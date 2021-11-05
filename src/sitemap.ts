import {
  DocumentRoute,
  Pod,
  Route,
  RouteProvider,
  Router,
} from '@amagaki/amagaki';

interface RobotsTxtRouteProviderOptions {
  sizes: Array<string>;
}

export class RobotsTxtRouteProvider extends RouteProvider {
  options: RobotsTxtRouteProviderOptions;

  constructor(router: Router, options: RobotsTxtRouteProviderOptions) {
    super(router);
    this.type = 'robots';
    this.options = options;
  }

  static register(pod: Pod, options?: RobotsTxtRouteProviderOptions) {
    const provider = new RobotsTxtRouteProvider(pod.router, options);
    pod.router.addProvider(provider);
    return provider;
  }

  async routes() {
    return [new RobotsTxtRoute(this), new SitemapRoute(this)];
  }
}

class RobotsTxtRoute extends Route {
  constructor(provider: RouteProvider) {
    super(provider);
    this.provider = provider;
  }

  get urlPath() {
    return '/robots.txt';
  }

  async build() {
    return `
      User-agent: *
      Allow: /
      Sitemap: doc.sitemap
    `;
  }
}

class SitemapRoute extends Route {
  constructor(provider: RouteProvider) {
    super(provider);
    this.provider = provider;
  }

  get urlPath() {
    return '/sitemap.xml';
  }

  get templateSource() {
    return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
      {% for route in routes %}
      <url>
          {% set doc = route.doc %}
          <loc>{{doc.url|url}}</loc>
          <xhtml:link href="{{doc.url|url}}" hreflang="x-default" rel="alternate" />
          {% for locale in doc.locales %}
          {% set doc = pod.doc(doc.podPath, locale) %}
          <xhtml:link href="{{doc.url|url}}" hreflang="{{doc.locale.id}}" rel="alternate" />
          {% endfor %}
      </url>
      {% endfor %}
  </urlset>`;
  }

  async build() {
    const njk = this.pod.engines.getEngineByExtension('.njk');
    const routes = (await this.pod.router.routes()).filter(
      route =>
        ['collection', 'doc'].includes(route.provider.type) &&
        (route as DocumentRoute).locale === this.pod.defaultLocale &&
        !route.urlPath.includes('/404/')
    );
    return (
      await njk.renderFromString(this.templateSource, {
        routes: routes,
        pod: this.pod,
      })
    ).replace(/^\s*[\r\n]/gm, '');
  }
}
