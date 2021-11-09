import {BuilderPlugin, Pod} from '@amagaki/amagaki';

// eslint-disable-next-line node/no-unpublished-import
import {SitemapPlugin} from '../dist';

export default async (pod: Pod) => {
  const builderPlugin = pod.plugins.get('BuilderPlugin') as BuilderPlugin;
  builderPlugin.addBeforeBuildStep(async () => {
    const sitemap = SitemapPlugin.register(pod);
    console.log(sitemap)
  });
};
