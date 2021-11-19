import {PageBuilder} from '../dist/';
import {Pod} from '@amagaki/amagaki';

export default async (pod: Pod) => {
  pod.configure({
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
      scripts: [pod.staticFile('/dist/js/main.js')],
      stylesheets: [
        'https://fonts.googleapis.com/css?family=Material+Icons|Roboto:400,500,700&display=swap',
        pod.staticFile('/dist/css/main.css'),
      ],
    },
    robotsTxt: {
      path: '/bar/robots.txt',
    },
    sitemapXml: {
      path: '/foo/sitemap.xml',
    },
  });
};
