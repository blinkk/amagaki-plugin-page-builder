import {Pod} from '@amagaki/amagaki';

// eslint-disable-next-line node/no-unpublished-import
import {SitemapPlugin} from '../dist';

export default async (pod: Pod) => {
    SitemapPlugin.register(pod, {
        sitemapPath: '/foo/sitemap.xml',
        robotsTxtPath: '/bar/robots.txt'
    });
};
