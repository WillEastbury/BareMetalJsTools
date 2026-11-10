# BareMetal.Minifier

Dependency-free browser module. Source: `./src/BareMetal.Minifier.js`.

## Load

```html
<script src="../src/BareMetal.Minifier.js"></script>
```

## Public API

### `minifyJS(source, options)`

Call `BareMetal.Minifier.minifyJS(...)` using the arguments shown by the function implementation.

### `minifyCSS(source, options)`

Call `BareMetal.Minifier.minifyCSS(...)` using the arguments shown by the function implementation.

### `compressGzip(source, options)`

Call `BareMetal.Minifier.compressGzip(...)` using the arguments shown by the function implementation.

### `decompressGzip(source, options)`

Call `BareMetal.Minifier.decompressGzip(...)` using the arguments shown by the function implementation.

## Example

```js
const min = BareMetal.Minifier.minifyJS(source);
const packed = await BareMetal.Minifier.compressGzip(min.code);
```
