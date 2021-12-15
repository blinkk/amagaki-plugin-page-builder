import {
  DataType,
  Document,
  Locale,
  Pod,
  StaticFile,
  TemplateContext,
  TemplateEngineComponent,
  Url,
  interpolate,
} from '@amagaki/amagaki';
import {html, safeString} from './utils';

import {PageBuilderStaticRouteProvider} from './router';
import {PartialPreviewRouteProvider} from './partial-preview';
import {SitemapPlugin} from './sitemap';
import fs from 'fs';
import jsBeautify from 'js-beautify';

type Partial = any;

interface BuiltinPartial {
  content: string;
  view: string;
}

/**
 * The pod path formats for CSS, JS, and the template for each partial. Values are interpolated.
 */
interface PartialPaths {
  /** The path format to load the CSS for a partial. Default: `/dist/css/partials/${partial.partial}.css` */
  css: string;
  /** The path format to load the JS for a partial. Default: `/dist/js/partials/${partial.partial}.js` */
  js: string;
  /** The path format to the view for a partial. Default: `/views/partials/${partial.partial}.njk` */
  view: string;
}

type ResourceLoader = {
  href: StaticFile | string;
  async?: boolean;
  defer?: boolean;
};

type Resource = StaticFile | string | ResourceLoader;

interface GetUrlOptions {
  includeDomain?: boolean;
  relative?: boolean;
}

interface GetHrefFromResourceOptions {
  includeFingerprint?: boolean;
}

/** Options for the inspector UI. */
interface InspectorOptions {
  /** Whether the inspector is enabled. If unset, the inspector is enabled in staging and dev modes only and completely absent from prod. */
  enabled?: boolean;

  /** A list of sizes used by the margin inspector. The margin inspector highlights margins, simplifying visual QA. */
  margins?: number[];
}

export interface PageBuilderOptions {
  inspector?: InspectorOptions;

  /** Whether to beautify HTML output. */
  beautify?: boolean;
  footer?: BuiltinPartial;
  header?: BuiltinPartial;
  head?: {
    /**
     * The description to use for the site. This is used as the default <meta>
     * description, if a page does not specify its own `description` field.
     */
    description?: string;

    /** The favicon. */
    icon?: Resource;

    /**
     * The image URL to use for the site. This is used as the default <meta>
     * image, if a page does not specify its own `image` field. Note this image
     * is used primarily when the page is shared. The image size should
     * generally be `1200x630`.
     */
    image?: string;

    /** A list of scripts to include in the <head> element. */
    scripts?: Resource[];

    /**
     * The site name. Used as the default <title> for any page that does not
     * specify its own `title` field. Also used as the `site_name` meta value.
     */
    siteName?: string;

    /** A list of all stylesheets to include in the <head> element. */
    stylesheets?: Resource[];

    /** The Twitter username (including @) belonging to the owner of the site. */
    twitterSite?: string;

    /**
     * The suggested color for browsers to use to customize the surrounding UI.
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name/theme-color
     */
    themeColor?: string;

    /** Whether to add a `noindex` meta tag to the page. */
    noIndex?: boolean;

    /** Append extra HTML to the bottom of the <head> element. */
    extra?: string[];
  };
  body?: {
    /**
     * Override the class on the <body> element. The class can either be a
     * string or an async function that returns a string.
     */
    class?: string | ((context: TemplateContext) => Promise<string>);
    /** Prepend HTML to the top of the <body> element. */
    prepend?: string[];
    /** Append extra HTML to the bottom of the <head> element. */
    extra?: string[];
  };
  partialPaths?: PartialPaths;
  /** Options for generating the sitemap. */
  sitemapXml?: {
    /** The URL path for the `sitemap.xml`. */
    path: string;
  };
  /** Options for generating the `robots.txt` file. */
  robotsTxt?: {
    /** The URL path for the `robots.txt` file. */
    path: string;
  };
}

export class PageBuilder {
  doc: Document;
  pod: Pod;
  resourceUrls: string[];
  partialPaths: PartialPaths;
  context: TemplateContext;
  options: PageBuilderOptions;
  enableInspector: boolean;

  constructor(
    doc: Document,
    context: TemplateContext,
    options?: PageBuilderOptions
  ) {
    this.doc = doc;
    this.pod = doc.pod;
    this.resourceUrls = [];
    this.context = context;
    this.options = options || {};
    this.enableInspector = PageBuilder.isInspectorEnabled(
      this.pod,
      this.options
    );
    this.partialPaths = options?.partialPaths ?? {
      css: '/dist/css/partials/${partial.partial}.css',
      js: '/dist/js/partials/${partial.partial}.js',
      view: '/views/partials/${partial.partial}.njk',
    };
  }

  static isInspectorEnabled(pod: Pod, options?: PageBuilderOptions) {
    return (
      options?.inspector?.enabled ?? (pod.env.dev || pod.env.name === 'staging')
    );
  }

  static async build(
    doc: Document,
    context: TemplateContext,
    options?: PageBuilderOptions
  ) {
    const builder = new PageBuilder(doc, context, options);
    return await builder.buildDocument();
  }

  static register(pod: Pod, options?: PageBuilderOptions) {
    SitemapPlugin.register(pod, {
      robotsTxtPath: options?.robotsTxt?.path,
      sitemapPath: options?.sitemapXml?.path,
    });
    if (PageBuilder.isInspectorEnabled(pod, options)) {
      PartialPreviewRouteProvider.register(pod, {
        pageBuilderOptions: options || {},
      });
      PageBuilderStaticRouteProvider.register(pod);
    }
    pod.defaultView = async (context: TemplateContext) => {
      return await PageBuilder.build(context.doc, context, options);
    };
    return options;
  }

  /**
   * Returns a field value with fallback from the document to the collection.
   * @param name The field's key.
   * @returns The field's value, either from the document fields or the collection fields.
   */
  getFieldValue(name: string) {
    return this.doc.fields[name] ?? this.doc.collection?.fields[name];
  }

  async buildBodyTag() {
    if (this.options.body?.class) {
      const className =
        typeof this.options.body?.class === 'function'
          ? await this.options.body?.class(this.context)
          : this.options.body?.class;
      return html`<body class="${className}">`;
    } else {
      return html`<body>`;
    }
  }

  async buildDocument() {
    const partials =
      this.doc.fields.partials ?? this.doc.collection?.fields.partials;
    let result = html`
      <!DOCTYPE html>
      <html lang="${this.getHtmlLang(
        this.doc.locale
      )}" itemscope itemtype="https://schema.org/WebPage">
      ${await this.buildHeadElement()}
      ${await this.buildBodyTag()}
        ${
          this.options.body?.prepend
            ? await this.buildExtraElements(this.options.body?.prepend)
            : ''
        }
        <div class="main">
          ${
            this.getFieldValue('header') === false
              ? ''
              : await this.buildBuiltinPartial('header')
          }
          <main>
            ${safeString(
              (
                await Promise.all(
                  ((partials as any[]) ?? []).map((partial: Partial) =>
                    this.buildPartialElement(partial)
                  )
                )
              ).join('\n')
            )}
          </main>
          ${
            this.getFieldValue('footer') === false
              ? ''
              : await this.buildBuiltinPartial('footer')
          }
        </div>
        ${
          this.options.body?.extra
            ? await this.buildExtraElements(this.options.body?.extra)
            : ''
        }
        ${this.enableInspector ?
          html`
            <page-inspector
              ${this.options?.inspector?.margins ? html`margins="${JSON.stringify(this.options.inspector.margins)}"` : ''}
            ></page-inspector>`
          : ''}
      </body>
      </html>
    `;
    let text = result.toString();
    if (this.options.beautify === false) {
      return text;
    }
    text = text.replace(/^\s*\n/gm, '');
    return jsBeautify.html(text, {indent_size: 2});
  }

  getUrl(item: any, options?: GetUrlOptions) {
    const fingerprint = item?.fingerprint;
    let url = item;
    if (item?.url) {
      url = options?.includeDomain ? item.url.toString() : item.url.path;
    }
    if (options?.relative && url) {
      url = Url.relative(url, this.context.doc);
    }
    return fingerprint && !url?.includes('?')
      ? `${url}?fingerprint=${fingerprint}`
      : url;
  }

  getHtmlLang(locale: Locale) {
    return locale.id.replace('_ALL', '').replace('_', '-');
  }

  async buildBuiltinPartial(partial: string) {
    const contentPodPath = `/content/partials/${partial}.yaml`;
    const viewPodPath = `/views/partials/${partial}.njk`;
    return this.pod.fileExists(viewPodPath)
      ? html`
        <${partial}>
        ${await this.buildPartialElement({
          ...{partial: partial},
          ...(this.pod.fileExists(contentPodPath)
            ? this.pod.doc(contentPodPath, this.context.doc.locale).fields
            : {}),
        })}
        </${partial}>
      ` : '';
  }

  async buildHeadElement() {
    return html`
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${this.buildHeadMetaElements({
          noIndex: this.getFieldValue('noIndex') ?? this.options.head?.noIndex,
          themeColor:
            this.getFieldValue('themeColor') ?? this.options.head?.themeColor,
          description:
            this.getFieldValue('description') ?? this.options.head?.description,
          image: this.getFieldValue('image') ?? this.options.head?.image,
          locale: this.doc.locale.id,
          siteName:
            this.getFieldValue('siteName') ?? this.options.head?.siteName,
          title: this.getFieldValue('title') ?? this.options.head?.siteName,
          twitterSite:
            this.getFieldValue('twitterSite') ?? this.options.head?.twitterSite,
          url: (this.doc.url as Url).toString(),
        })}
        ${this.buildHreflangLinkElements()}
        ${this.buildHeadLinkElements({
          icon: this.getFieldValue('icon') ?? this.options.head?.icon,
        })}
        ${safeString(
          this.options.head?.stylesheets
            ?.map(style => this.buildStyleLinkElement(style))
            .join('\n') ?? ''
        )}
        ${safeString(
          this.options.head?.scripts
            ?.map(script => this.buildScriptElement(script))
            .join('\n') ?? ''
        )}
        ${this.options.head?.extra
          ? await this.buildExtraElements(this.options.head.extra)
          : ''}
        ${safeString(
          this.enableInspector
            ? PageBuilderStaticRouteProvider.files
                .map(path =>
                  this.buildScriptElement(
                    `${PageBuilderStaticRouteProvider.urlBase}/${path}`
                  )
                )
                .join('\n')
            : ''
        )}
      </head>
    `;
  }

  async buildExtraElements(extra: string[]) {
    return (
      await Promise.all(extra.map(podPath => this.renderFile(podPath)))
    ).join('\n');
  }

  async renderFile(podPath: string) {
    const engine = this.pod.engines.getEngineByFilename(podPath);
    return await engine.render(podPath, this.context);
  }

  buildHreflangLinkElements() {
    // Documents created by the preview gallery may not have URLs. Check for
    // URLs prior to outputting link tags.
    const defaultUrl = this.getUrl(
      this.pod.doc(this.doc.podPath, this.doc.defaultLocale).url
    );
    return html`
      ${this.doc.url
        ? html`<link href="${this.doc.url}" rel="canonical">`
        : ''}
      ${defaultUrl
        ? html`<link
            href="${defaultUrl}"
            hreflang="x-default"
            rel="alternate"
          >`
        : ''}
      ${[...this.doc.locales]
        .filter(locale => {
          return locale !== this.doc.defaultLocale;
        })
        .map(locale => {
          return html`<link
            href="${this.getUrl(this.pod.doc(this.doc.podPath, locale).url)}"
            hreflang="${this.getHtmlLang(locale)}"
            rel="alternate"
          >`;
        })
        .join('\n')}
    `;
  }

  buildHeadLinkElements(options: {icon: string}) {
    return html`
      ${options.icon
        ? html`<link
            rel="icon"
            href="${this.getUrl(options.icon, {
              relative: true,
            })}"
          >`
        : ''}
    `;
  }

  buildHeadMetaElements(options: {
    description?: string;
    image?: string;
    locale?: string;
    siteName?: string;
    themeColor?: string;
    title: string;
    twitterSite?: string;
    url: string;
    noIndex?: boolean;
  }) {
    return html`
      ${options.title ? html`<title>${options.title}</title>` : ''}
      ${options.description
        ? html`<meta name="description" content="${options.description}">`
        : ''}
      ${options.themeColor
        ? html`<meta name="theme-color" content="${options.themeColor}">`
        : ''}
      ${options.noIndex ? html`<meta name="robots" content="noindex">` : ''}
      <meta name="referrer" content="no-referrer">
      <meta property="og:type" content="website">
      ${options.siteName
        ? html`<meta property="og:site_name" content="${options.siteName}">`
        : ''}
      <meta property="og:url" content="${options.url}">
      ${options.title
        ? html`<meta property="og:title" content="${options.title}">`
        : ''}
      ${options.description
        ? html`<meta
            property="og:description"
            content="${options.description}"
         >`
        : ''}
      ${options.image
        ? html`<meta
            property="og:image"
            content="${this.getUrl(options.image, {
              includeDomain: true,
            })}"
         >`
        : ''}
      ${options.locale
        ? html`<meta property="og:locale" content="${options.locale}">`
        : ''}
      ${options.twitterSite
        ? html`<meta
            property="twitter:site"
            content="${options.twitterSite}"
         >`
        : ''}
      ${options.title
        ? html`<meta property="twitter:title" content="${options.title}">`
        : ''}
      ${options.description
        ? html`<meta
            property="twitter:description"
            content="${options.description}"
         >`
        : ''}
      ${options.image
        ? html`<meta
            property="twitter:image"
            content="${this.getUrl(options.image, {includeDomain: true})}"
         >`
        : ''}
      <meta property="twitter:card" content="summary_large_image">
    `;
  }

  async buildPartialElement(partial: Partial) {
    // Support both:
    // 1. {partial: 'foo', ...}
    // 2. {partial: {partial: 'foo', absolutePath: '/Users/foo/.../foo.njk'}, ...}
    const name =
      typeof partial.partial === 'string'
        ? partial.partial
        : partial.partial?.partial;
    const [cssFile, jsFile] = [this.partialPaths.css, this.partialPaths.js].map(
      pathFormat => {
        return this.pod.staticFile(
          interpolate(this.pod, pathFormat, {
            partial: {
              partial: name,
            },
          })
        );
      }
    );
    const partialBuilder = [];
    // Load resources required by partial module.
    cssFile.exists && partialBuilder.push(this.buildStyleLinkElement(cssFile));
    jsFile.exists && partialBuilder.push(this.buildScriptElement(jsFile));
    const engine = this.pod.engines.getEngineByFilename(
      this.partialPaths.view
    ) as TemplateEngineComponent;
    partialBuilder.push('<page-module>');
    if (this.enableInspector && partial.partial?.includeInspector !== false) {
      partialBuilder.push(html`
        <page-module-inspector partial="${name}"></page-module-inspector>
      `);
    }
    const context = {...this.context, partial};
    let result;
    // TODO: Handle error when partial doesn't exist.
    if (typeof partial.partial === 'string') {
      const partialFile = interpolate(this.pod, this.partialPaths.view, {
        partial: partial,
      });
      result = await engine.render(partialFile, context);
    } else if (partial.partial?.absolutePath) {
      const template = fs.readFileSync(partial.partial?.absolutePath, 'utf8');
      result = await engine.renderFromString(template, context);
    }
    partialBuilder.push(result);
    partialBuilder.push('</page-module>');
    return safeString(partialBuilder.join('\n'));
  }

  getHrefFromResource(
    resource: Resource,
    options?: GetHrefFromResourceOptions
  ) {
    if (DataType.isStaticFile(resource)) {
      resource = resource as StaticFile;
      let href = resource.url?.path;
      if (options?.includeFingerprint !== false && !href?.includes('?')) {
        href = `${href}?fingerprint=${resource.fingerprint}`;
      }
      return href;
    } else if ((resource as ResourceLoader)?.href) {
      return (resource as ResourceLoader).href;
    }
    // `resource` is a string.
    return resource;
  }

  buildScriptElement(resource: Resource, defer = false, async = false) {
    const href = this.getHrefFromResource(resource);
    const url = this.getUrl(href, {relative: true});
    // Resource has already been loaded, don't build again.
    if (this.resourceUrls.includes(url)) {
      return '';
    }
    if (!url) {
      throw new Error(
        `Resource ${resource} has no URL. Does it exist and is it mapped in \`staticRoutes\`?`
      );
    }
    this.resourceUrls.push(url);
    return html`
      <script
        src="${url}"
        ${defer ? 'defer' : ''}
        ${async ? 'async' : ''}
      ></script>
    `;
  }

  buildStyleLinkElement(resource: Resource, async = true) {
    const href = this.getHrefFromResource(resource);
    const url = this.getUrl(href, {relative: true});
    // Resource has already been loaded, don't build again.
    if (this.resourceUrls.includes(url)) {
      return '';
    }
    if (!url) {
      throw new Error(
        `Resource ${resource} has no URL. Does it exist and is it mapped in \`staticRoutes\`?`
      );
    }
    this.resourceUrls.push(url);
    return html`
      <link
        href="${url}"
        rel="stylesheet"
        ${async
          ? html`
              rel="preload" as="style"
              onload="this.onload=null;this.rel='stylesheet'"
            `
          : ''}
      >
    `;
  }
}
