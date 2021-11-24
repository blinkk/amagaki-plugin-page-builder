import {
  Document,
  NunjucksTemplateEngine,
  Pod,
  Route,
  RouteProvider,
  Router,
  TemplateContext,
  splitFrontMatter,
} from '@amagaki/amagaki';

import {PageBuilder} from './page-builder';
import path from 'path';

interface PartialPreviewRouteProviderOptions {}

interface Partial {
  basename: string;
  name: string;
  podPath: string;
}

interface PartialPreviewRouteOptions {
  partial: Partial;
}

interface PartialGalleryRouteOptions {
  partials: Partial[];
}

export class PartialPreviewRouteProvider extends RouteProvider {
  options: PartialPreviewRouteProviderOptions;

  constructor(router: Router, options: PartialPreviewRouteProviderOptions) {
    super(router);
    this.type = 'partialPreview';
    this.options = options;
  }

  static register(pod: Pod, options?: PartialPreviewRouteProviderOptions) {
    const provider = new PartialPreviewRouteProvider(pod.router, options ?? {});
    pod.router.addProvider(provider);
    return provider;
  }

  async routes(): Promise<Route[]> {
    const routes: Route[] = [];
    const podPaths = this.pod.walk('/views/partials');
    const partials = podPaths.map((podPath: string) => {
      const filename = podPath.split('/').pop() as string;
      return {
        podPath: podPath,
        name: filename.split('.')[0],
        basename: filename,
      };
    });
    routes.push(new PartialGalleryRoute(this, {partials: partials}));
    return routes;
  }
}

class PartialGalleryRoute extends Route {
  options: PartialGalleryRouteOptions;

  constructor(provider: RouteProvider, options: PartialGalleryRouteOptions) {
    super(provider);
    this.provider = provider;
    this.options = options;
  }

  get path() {
    return this.urlPath;
  }

  get urlPath() {
    return '/preview/';
  }

  async build() {
    const partial = path.join(__dirname, 'ui', 'partial-preview-gallery.njk');
    const partials: Record<string, any>[] = [
      {
        partial: {
          partial: 'partial-preview-gallery',
          includeInspector: false,
          absolutePath: partial,
        },
        partials: this.pod.walk('/views/partials/')
      },
    ];
    const fakeDoc = {
      pod: this.provider.pod,
      podPath: '',
      locales: [],
      fields: {
        title: `Preview Gallery`,
        partials: partials,
      },
      defaultLocale: this.pod.locale('en'),
      locale: this.pod.locale('en'),
      url: {
        path: this.urlPath,
        toString: () => {
          return '';
        },
      },
    } as unknown as Document; 
    const context: TemplateContext = {
      doc: fakeDoc,
      env: this.provider.pod.env,
      pod: this.provider.pod,
      process: process,
    };
    const builder = new PageBuilder(fakeDoc, context, {});
    return await builder.buildDocument();
  }
}
