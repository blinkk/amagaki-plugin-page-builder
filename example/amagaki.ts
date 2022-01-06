import {PageBuilder} from '../dist/';
import {Pod} from '@amagaki/amagaki';

export default async (pod: Pod) => {
  pod.configure({
    localization: {
      defaultLocale: 'en',
      locales: ['en', 'ja'],
    },
    environments: {
      staging: {},
      prod: {},
    },
    staticRoutes: [
      {
        path: `/static/`,
        staticDir: '/dist/',
      },
    ],
  });
  PageBuilder.register(pod, {
    head: {
      siteName: 'Example',
      scripts: [pod.staticFile('/dist/js/main.js')],
      stylesheets: [
        'https://fonts.googleapis.com/css?family=Material+Icons|Roboto:400,500,700&display=swap',
        pod.staticFile('/dist/css/main.css'),
      ],
      extra: ['/views/head.njk']
    },
    body: {
      prepend: ['/views/body.njk']
    },
    robotsTxt: {
      path: '/bar/robots.txt',
    },
    sitemapXml: {
      path: '/foo/sitemap.xml',
    },
  });
};
