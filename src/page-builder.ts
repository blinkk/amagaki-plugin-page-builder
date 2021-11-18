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

import {SitemapPlugin} from '.';
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
}

interface PageBuilderOptions {
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
  }
  /** Options for generating the `robots.txt` file. */
  robotsTxt?: {
    /** The URL path for the `robots.txt` file. */
    path: string;
  }
}

export class PageBuilder {
  doc: Document;
  pod: Pod;
  resourceUrls: string[];
  partialPaths: PartialPaths;
  context: TemplateContext;
  options: PageBuilderOptions;

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
    this.partialPaths = options?.partialPaths ?? {
      css: '/dist/css/partials/${partial.partial}.css',
      js: '/dist/js/partials/${partial.partial}.js',
      view: '/views/partials/${partial.partial}.njk',
    };
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
    pod.defaultView = async (context: TemplateContext) => {
      return await PageBuilder.build(context.doc, context, options);
    };
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
      return `<body class="${className}">`;
    } else {
      return '<body>';
    }
  }

  async buildDocument() {
    const partials =
      this.doc.fields.partials ?? this.doc.collection?.fields.partials;
    let html = `
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
            this.doc.fields.header === false
              ? ''
              : await this.buildBuiltinPartial('header')
          }
          ${await Promise.all(
            (partials ?? []).map((partial: Partial) =>
              this.buildPartialElement(partial)
            )
          )}
          ${
            this.doc.fields.footer === false
              ? ''
              : await this.buildBuiltinPartial('footer')
          }
        </div>
        ${
          this.options.body?.extra
            ? await this.buildExtraElements(this.options.body?.extra)
            : ''
        }
      </body>
      </html>
    `.trim();
    if (this.options.beautify === false) {
      return html;
    }
    html = html.replace(/^\s*\n/gm, '');
    return jsBeautify.html(html, {indent_size: 2});
  }

  getUrl(item: any, options?: GetUrlOptions) {
    const fingerprint = item?.fingerprint;
    let url = item;
    if (item?.url) {
      url = options?.includeDomain ? item.url.toString() : item.url.path;
    }
    return fingerprint && !url.includes('?')
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
      ? await this.buildPartialElement({
          ...{partial: partial},
          ...(this.pod.fileExists(contentPodPath)
            ? this.pod.readYaml(contentPodPath)
            : {}),
        })
      : '';
  }

  async buildHeadElement() {
    return `
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
        ${
          this.options.head?.stylesheets
            ?.map(style => this.buildStyleLinkElement(style))
            .join('\n') ?? ''
        }
        ${
          this.options.head?.scripts
            ?.map(script => this.buildScriptElement(script))
            .join('\n') ?? ''
        }
        ${
          this.options.head?.extra
            ? await this.buildExtraElements(this.options.head.extra)
            : ''
        }
      </head>
    `.trim();
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
    return `
      <link href="${this.doc.url}" rel="canonical">
      <link href="${this.getUrl(
        this.pod.doc(this.doc.podPath, this.doc.defaultLocale).url
      )}" hreflang="x-default" rel="alternate">
      ${[...this.doc.locales]
        .filter(locale => {
          return locale !== this.doc.defaultLocale;
        })
        .map(locale => {
          return `<link href="${this.getUrl(
            this.pod.doc(this.doc.podPath, locale).url
          )}" hreflang="${this.getHtmlLang(locale)}" rel="alternate">`;
        })
        .join('\n')}
    `.trim();
  }

  buildHeadLinkElements(options: {icon: string}) {
    return `
      ${
        options.icon
          ? `<link rel="icon" href="${this.getUrl(options.icon)}">`
          : ''
      }
    `.trim();
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
    return `
      ${options.title ? `<title>${options.title}</title>` : ''}
      ${
        options.description
          ? `<meta name="description" content="${options.description}">`
          : ''
      }
      ${
        options.themeColor
          ? `<meta name="theme-color" content="${options.themeColor}">`
          : ''
      }
      ${
        options.noIndex
          ? `<meta name="robots" content="noindex">`
          : ''
      }
      <meta name="referrer" content="no-referrer">
      <meta property="og:type" content="website">
      ${
        options.siteName
          ? `<meta property="og:site_name" content="${options.siteName}">`
          : ''
      }
      <meta property="og:url" content="${options.url}">
      ${
        options.title
          ? `<meta property="og:title" content="${options.title}">`
          : ''
      }
      ${
        options.description
          ? `<meta property="og:description" content="${options.description}">`
          : ''
      }
      ${
        options.image
          ? `<meta property="og:image" content="${this.getUrl(options.image, {
              includeDomain: true,
            })}">`
          : ''
      }
      ${
        options.locale
          ? `<meta property="og:locale" content="${options.locale}">`
          : ''
      }
      ${
        options.twitterSite
          ? `<meta property="twitter:site" content="${options.twitterSite}">`
          : ''
      }
      ${
        options.title
          ? `<meta property="twitter:title" content="${options.title}">`
          : ''
      }
      ${
        options.description
          ? `<meta property="twitter:description" content="${options.description}">`
          : ''
      }
      ${
        options.image
          ? `<meta property="twitter:image" content="${this.getUrl(
              options.image,
              {includeDomain: true}
            )}">`
          : ''
      }
      <meta property="twitter:card" content="summary_large_image">
    `.trim();
  }

  async buildPartialElement(partial: Partial) {
    const [cssFile, jsFile] = [this.partialPaths.css, this.partialPaths.js].map(
      pathFormat => {
        return this.pod.staticFile(
          interpolate(this.pod, pathFormat, {partial: partial})
        );
      }
    );
    const partialBuilder = [];
    // Load resources required by partial module.
    cssFile.exists && partialBuilder.push(this.buildStyleLinkElement(cssFile));
    jsFile.exists && partialBuilder.push(this.buildScriptElement(jsFile));
    // TODO: Handle error when partial doesn't exist.
    const partialFile = interpolate(this.pod, this.partialPaths.view, {
      partial: partial,
    });
    const engine = this.pod.engines.getEngineByFilename(
      this.partialPaths.view
    ) as TemplateEngineComponent;
    const context = {...this.context, partial};
    partialBuilder.push(await engine.render(partialFile, context));
    return partialBuilder.join('\n');
  }

  getHrefFromResource(resource: Resource) {
    if (DataType.isStaticFile(resource)) {
      return (resource as StaticFile).url?.path;
    } else if ((resource as ResourceLoader)?.href) {
      return (resource as ResourceLoader).href;
    }
    // `resource` is a string.
    return resource;
  }

  buildScriptElement(resource: Resource, defer = false, async = false) {
    const href = this.getHrefFromResource(resource);
    const url = this.getUrl(href);
    // Resource has already been loaded, don't build again.
    if (this.resourceUrls.includes(url)) {
      return '';
    }
    if (!url) {
      throw new Error(`Resource ${resource} has no URL. Does it exist and is it mapped in \`staticRoutes\`?`);
    }
    this.resourceUrls.push(url);
    return `
      <script
        src="${url}"
        ${defer ? 'defer' : ''}
        ${async ? 'async' : ''}
      >
      </script>
    `.trim();
  }

  buildStyleLinkElement(resource: Resource, async = true) {
    const href = this.getHrefFromResource(resource);
    const url = this.getUrl(href);
    // Resource has already been loaded, don't build again.
    if (this.resourceUrls.includes(url)) {
      return '';
    }
    if (!url) {
      throw new Error(`Resource ${resource} has no URL. Does it exist and is it mapped in \`staticRoutes\`?`);
    }
    this.resourceUrls.push(url);
    return `
      <link
        href="${url}"
        rel="stylesheet"
        ${
          async
            ? `
            rel="preload"
            as="style"
            onload="this.onload=null;this.rel='stylesheet'"
            `
            : ''
        }
      >
    `.trim();
  }
}
