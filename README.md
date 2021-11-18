# amagaki-plugin-page-builder

[![NPM Version][npm-image]][npm-url]
[![GitHub Actions][github-image]][github-url]
[![TypeScript Style Guide][gts-image]][gts-url]

An opinionated page builder for Amagaki – the base template for constructing
pages from content and templates.

## Usage

1. Install the plugin.

```shell
npm install --save @amagaki/amagaki-plugin-page-builder
```

2. Add to `amagaki.ts`.

```typescript
import {SitemapPlugin} from '@amagaki/amagaki-plugin-page-builder';
import {BuilderPlugin, Pod} from '@amagaki/amagaki';

export default (pod: Pod) => {
  SitemapPlugin.register(pod);
};
```

[github-image]: https://github.com/blinkk/amagaki-plugin-page-builder/workflows/Run%20tests/badge.svg
[github-url]: https://github.com/blinkk/amagaki-plugin-page-builder/actions
[npm-image]: https://img.shields.io/npm/v/@amagaki/amagaki-plugin-page-builder.svg
[npm-url]: https://npmjs.org/package/@amagaki/amagaki-plugin-page-builder
[gts-image]: https://img.shields.io/badge/code%20style-google-blueviolet.svg
[gts-url]: https://github.com/google/gts
