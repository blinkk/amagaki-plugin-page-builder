import {ExecutionContext} from 'ava';
import {Pod, Route} from '@amagaki/amagaki';
import test from 'ava';

test('SitemapPlugin: sitemap.xml', async (t: ExecutionContext) => {
  const pod = new Pod('./example');
  await pod.router.warmup();
  const sitemapRoute = await pod.router.resolve('/sitemap.xml') as Route;
  const sitemapContent = await sitemapRoute.build();
  const sitemapExpected = `
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
      <url>
          <loc>http://localhost/pages/bar/</loc>
          <xhtml:link href="http://localhost/pages/bar/" hreflang="x-default" rel="alternate" />
          <xhtml:link href="http://localhost/pages/bar/" hreflang="en" rel="alternate" />
      </url>
      <url>
          <loc>http://localhost/pages/foo/</loc>
          <xhtml:link href="http://localhost/pages/foo/" hreflang="x-default" rel="alternate" />
          <xhtml:link href="http://localhost/pages/foo/" hreflang="en" rel="alternate" />
      </url>
  </urlset>
  `.trim();
  t.deepEqual(sitemapContent, sitemapExpected);
});


test('SitemapPlugin: robots.txt', async (t: ExecutionContext) => {
  const pod = new Pod('./example');
  await pod.router.warmup();
  const robotsRoute = await pod.router.resolve('/robots.txt') as Route;
  const robotsContent = await robotsRoute.build();
  const robotsExpected = `
      User-agent: *
      Allow: /
      Sitemap: doc.sitemap
    `;
  t.deepEqual(robotsContent, robotsExpected);
});
