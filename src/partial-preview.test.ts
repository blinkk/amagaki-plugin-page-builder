import {Pod, Route} from '@amagaki/amagaki';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('PatialPreview', async (t: ExecutionContext) => {
  const pod = new Pod('./example', {dev: true, name: 'staging'});
  await pod.router.warmup();
  const html = await (await pod.router.resolve('/preview/') as Route).build();
  const expected = `
<!DOCTYPE html>
<html lang="en" itemscope itemtype="https://schema.org/WebPage">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Gallery</title>
  <meta name="referrer" content="no-referrer">
  <meta property="og:type" content="website">
  <meta property="og:url" content="http://localhost/preview/">
  <meta property="og:title" content="Preview Gallery">
  <meta property="og:locale" content="en">
  <meta property="twitter:title" content="Preview Gallery">
  <meta property="twitter:card" content="summary_large_image">
  <link href="http://localhost/preview/" rel="canonical">
  <link href="https://fonts.googleapis.com/css?family=Material+Icons|Roboto:400,500,700&display=swap" rel="stylesheet" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link href="./../static/css/main.css?fingerprint=d41d8cd98f00b204e9800998ecf8427e" rel="stylesheet" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <script src="./../static/js/main.js?fingerprint=d41d8cd98f00b204e9800998ecf8427e">
  </script>
  <script src="./../_page-builder/page-builder-ui.min.js">
  </script>
</head>

<body>
  <div class="main">
    <page-module>
      <page-module-inspector partial="header"></page-module-inspector>
      <div class="header">
        <p>Header</p>
      </div>
    </page-module>
    <page-module>
      <div class="partial-preview-gallery">
        <ul>
          <li>/views/partials/header.njk
          <li>/views/partials/hero.njk
        </ul>
      </div>
    </page-module>
  </div>
</body>

</html>
  `.trim();
  t.deepEqual(html, expected);
});
