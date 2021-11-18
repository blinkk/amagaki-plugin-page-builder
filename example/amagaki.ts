import {PageBuilder, SitemapPlugin} from '../dist';

import {Pod} from '@amagaki/amagaki';

export default async (pod: Pod) => {
  PageBuilder.register(pod, {
    robotsTxt: {
      path: '/bar/robots.txt',
    },
    sitemapXml: {
      path: '/foo/sitemap.xml',
    },
  });
};
