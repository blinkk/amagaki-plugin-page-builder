import {Pod, Route} from '@amagaki/amagaki';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('PageBuilder', async (t: ExecutionContext) => {
  const pod = new Pod('./example');
  await pod.router.warmup();
  const html = await (await pod.router.resolve('/pages/') as Route).build();
  const expected = `
<!DOCTYPE html>
<html lang="en" itemscope itemtype="https://schema.org/WebPage">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <meta property="og:type" content="website">
  <meta property="og:url" content="http://localhost/pages/">
  <meta property="og:locale" content="en">
  <meta property="twitter:card" content="summary_large_image">
  <link href="http://localhost/pages/" rel="canonical">
  <link href="http://localhost/pages/" hreflang="x-default" rel="alternate">
</head>

<body>
  <div class="main">
    <div class="header">
    </div>
    <div class="hero">
      <h1>Hello World!</h1>
    </div>
  </div>
</body>

</html>
  `.trim();
  t.deepEqual(html, expected);
});
