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
    // partials.forEach(partial => {
    //   routes.push(
    //     new PartialPreviewRoute(this, {
    //       partial: partial,
    //     })
    //   );
    // });
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
    const partial = path.join(__dirname, 'partial-preview-gallery.njk');
    const partials: Record<string, any>[] = [
      {
        partial: 'partial',
        // partials: this.options.partials,
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

class PartialPreviewRoute extends Route {
  options: PartialPreviewRouteOptions;

  constructor(provider: RouteProvider, options: PartialPreviewRouteOptions) {
    super(provider);
    this.provider = provider;
    this.options = options;
  }
  get path() {
    return this.urlPath;
  }
  get urlPath() {
    return `/preview/${this.options.partial.name}/`;
  }
  async build() {
    const {frontMatter} = splitFrontMatter(
      this.provider.pod.readFile(this.options.partial.podPath)
    );
    const mockData =
      (frontMatter && this.pod.readYamlString(frontMatter)) || {};
    const mocks = mockData?.mocks || {};
    const partials = [];
    partials.push({
      partial: 'preview-spacer',
    });
    for (const [mockName, mockData] of Object.entries(mocks)) {
      const mock = {
        partial: this.options.partial.name,
      };
      partials.push(Object.assign(mock, mockData));
      partials.push({
        partial: 'preview-spacer',
      });
    }
    const fakeDoc = {
      fields: {
        title: `${this.options.partial.name} – Preview`,
        partials: partials,
      },
      locale: this.pod.locale('en'),
      url: {
        path: this.urlPath,
      },
    };
    const template = '/views/base.njk';
    const engine = this.provider.pod.engines.getEngineByFilename(
      template
    ) as NunjucksTemplateEngine;
    return await engine.render(template, {
      doc: fakeDoc,
      env: this.provider.pod.env,
      pod: this.provider.pod,
      process: process,
    });
  }
}
