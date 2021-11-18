import {PageBuilder, SitemapPlugin} from '../dist';

import {Pod} from '@amagaki/amagaki';

export default async (pod: Pod) => {
  PageBuilder.register(pod);
  SitemapPlugin.register(pod, {
    robotsTxtPath: '/bar/robots.txt',
    sitemapPath: '/foo/sitemap.xml',
  });
};
