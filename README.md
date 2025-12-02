![Node.js CI](https://github.com/pchynoweth/svelte-assets-preprocessor/workflows/Node.js%20CI/badge.svg)
![new-version](https://github.com/pchynoweth/svelte-assets-preprocessor/workflows/new-version/badge.svg)
[![Build Status](https://travis-ci.org/pchynoweth/svelte-assets-preprocessor.svg?branch=master)](https://travis-ci.org/pchynoweth/svelte-assets-preprocessor)
[![version](https://img.shields.io/npm/v/svelte-assets-preprocessor.svg?style=flat-square)](http://npm.im/svelte-assets-preprocessor)

# svelte-assets-preprocessor

> A [Svelte](https://svelte.dev) preprocessor that extracts assets.

## Overview

This preprocessor is based on the webpack [html-loader](https://github.com/webpack-contrib/html-loader).  It works in a similar way and shares some config options.

## Installation

Using npm:
```bash
$ npm i -D svelte-assets-preprocessor
```

## Example

### Input

```html
<img src="./example.png">
```

### Output

```html
<script>
    import ___ASSET___1 from './example.png';
</script>

<img src="{___ASSET___1}">
```

## Usage

### With `rollup-plugin-svelte`

You will need to use [@rollup/plugin-url](https://github.com/rollup/plugins/tree/master/packages/url) to load assets.

```js
// rollup.config.js
import svelte from 'rollup-plugin-svelte';
import assetsPreprocessor from 'svelte-assets-preprocessor'
import url from '@rollup/plugin-url'

export default {
  ...,
  plugins: [
    url({ destDir: 'public' }),
    svelte({
      preprocess: assetsPreprocessor({ /* options */ })
    })
  ]
}
```

### With `svelte-loader`

You will need to install another loader to handle the imports appropriately such as [file-loader](https://webpack.js.org/loaders/file-loader/) or [url-loader](https://webpack.js.org/loaders/url-loader/).

```js
  ...
  module: {
    rules: [
      ...
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'file-loader',
        options: {
          outputPath: 'images',
        }
      },
      {
        test: /\.(html|svelte)$/,
        exclude: /node_modules/,
        use: {
          loader: 'svelte-loader',
          options: {
            preprocess: require('svelte-assets-preprocessor')({ /* options */ exclude: [ (attr) => !/\.(png|svg|jpg|gif)$/.test(attr)} ])
          },
        },
      },
      ...
    ]
  }
  ...
```

### With SvelteKit

With [SvelteKit](https://kit.svelte.dev/), [svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) is not a requirement if you just need to preprocess assets.

You can also configure your [assets](https://kit.svelte.dev/docs#configuration-files) folder using `kit.files.assets`. 

```js
// svelte.config.js
import assetsPreprocessor from 'svelte-assets-preprocessor';

const config = {
    preprocess: [assetsPreprocessor()],
    kit: {
        files: {
		assets: 'static'
        }
        // ...
    }
    // ...
};
```

## Options

### `attributes`

A list of tags and attributes to process.  For each tag and attribute a type is provided ('src' or 'srcset') and an optional filter function.  The filter function can be used to add further conditions.

#### Default

```js
[
  {
    tag: 'audio',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'embed',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'img',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'img',
    attribute: 'srcset',
    type: 'srcset',
  },
  {
    tag: 'input',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'link',
    attribute: 'href',
    type: 'src',
    filter: (tag, attribute, attributes) => {
      if (!attributes.rel || !/stylesheet/i.test(attributes.rel)) {
        return false;
      }

      if (
        attributes.type &&
        attributes.type.trim().toLowerCase() !== 'text/css'
      ) {
        return false;
      }

      return true;
    },
  },
  {
    tag: 'object',
    attribute: 'data',
    type: 'src',
  },
  {
    tag: 'script',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'source',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'source',
    attribute: 'srcset',
    type: 'srcset',
  },
  {
    tag: 'track',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'video',
    attribute: 'poster',
    type: 'src',
  },
  {
    tag: 'video',
    attribute: 'src',
    type: 'src',
  },
];
```

### `exclude`

A list of functions used to exclude specific assets.

#### Default `[]`

#### Example

Only apply to images with specific extensions.

```js
...
exclude: [ (attr) => !/\.(png|svg|jpg|gif)$/.test(attr)} ]
...
```

### `http`

Process urls starting with `http`.  This is disabled by default.

#### Default `false`

### `prefix`

The prefix used for generated variable names.

#### Default `___ASSET___`
