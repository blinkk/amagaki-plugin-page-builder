import {ExecutionContext} from 'ava';
import {SitemapPlugin} from './sitemap';
import {Pod} from '@amagaki/amagaki';
import test from 'ava';

test('SitemapPlugin', async (t: ExecutionContext) => {
  const pod = new Pod('../example');
  const sitemap = SitemapPlugin.register(pod);
  console.log(sitemap);
  t.pass();
});
