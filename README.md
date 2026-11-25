# @vdegenne/kuromoji

A TypeScript wrapper around [Kuromoji.js](https://github.com/takuyaa/kuromoji.js), providing Japanese-to-Hiragana conversion with bundled dictionary files.

The package is primarily intended for web applications that want to control how dictionary files are served, compressed and cached.

## Installation

```bash
npm install @vdegenne/kuromoji
```

## Dictionaries

The package includes all 12 dictionary files in **uncompressed `.dat` format**.

They are not automatically copied to your application's public directory. You need to copy them yourself so they can be served as static assets.

For example, with a Vite application:

```bash
cp -r ./node_modules/@vdegenne/kuromoji/dict ./public/
```

This makes the dictionaries available under `/dict/`, which is the default dictionary path used by the wrapper.

### Why uncompressed dictionaries?

Keeping the dictionaries uncompressed gives your application control over how they are delivered, and a better tokenizer loading time.

For websites, it is generally preferable to serve dictionary files using HTTP compression (Brotli or gzip), allowing the browser to receive smaller responses without requiring the package to ship compressed files.

It is also useful for Progressive Web Apps (PWA): you can add the compressed dictionary assets to your service worker's precache or runtime cache. This allows the dictionaries to be cached efficiently and reused between visits.

### Using `.gz` dictionaries

You can also use gzip-compressed dictionary files. There are 2 ways to obtain them:

**Option 1: Compress the included `.dat` files yourself.**

For example, using gzip while keeping the original files:

```bash
gzip -k ./node_modules/@vdegenne/kuromoji/dict/*.dat
```

**Option 2: Install the original `kuromoji` package as a development dependency and copy its compressed dictionaries.**

```bash
npm install -D kuromoji
cp ./node_modules/kuromoji/dict/*.dat.gz ./public/dict/
```

Then configure the wrapper to use the gzip format:

```ts
const kuromoji = new Kuromoji({
	dicPath: '/dict/',
	dictFileFormat: 'gz',
})
```

The wrapper supports both formats. You can choose whichever best fits your application's asset pipeline.

## Usage

```ts
import {Kuromoji} from '@vdegenne/kuromoji'

const kuromoji = new Kuromoji()

const result = await kuromoji.toHiragana('日本語')
console.log(result) // にほんご
```

## Options

```ts
const kuromoji = new Kuromoji({
	dicPath: '/dict/',
	dictFileFormat: 'dat',
	preload: false,
	onProgress(progress) {
		console.log(progress.filesLoaded, progress.filesTotal)
	},
})
```

| Option           | Type            | Default     | Description                                               |
| ---------------- | --------------- | ----------- | --------------------------------------------------------- |
| `dicPath`        | `string`        | `'./dict/'` | URL of the directory containing the dictionary files      |
| `dictFileFormat` | `'dat' \| 'gz'` | `'dat'`     | Dictionary file format                                    |
| `preload`        | `boolean`       | `false`     | Load dictionaries when the instance is created            |
| `onProgress`     | `function`      | —           | Callback invoked when dictionary loading progress changes |

## Dictionary loading

Dictionaries are loaded lazily when `toHiragana()` first encounters text containing kanji.

To load them immediately, enable `preload`:

```ts
const kuromoji = new Kuromoji({preload: true})

await kuromoji.ready
```

The `onProgress` callback provides loading progress information, including the number of bytes loaded and the number of dictionary files processed.

## API

### `new Kuromoji(options?)`

Creates a Kuromoji instance.

### `toHiragana(text)`

Converts Japanese text to Hiragana and returns a `Promise<string>`.

### `ready`

A promise that resolves when dictionary preloading is complete. When `preload` is disabled, it resolves immediately.

## License

Apache-2.0
