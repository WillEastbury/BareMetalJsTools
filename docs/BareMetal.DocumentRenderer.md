# BareMetal.DocumentRenderer

Dependency-free browser module that turns HTML into an actual `application/pdf` Blob. It does not open a print dialog or rely on a browser PDF/print pipeline.

## Load

```html
<script src="src/BareMetal.DocumentRenderer.js"></script>
```

Load this module before using the `device: 'pdf'` option in `BareMetal.Print`.

## Public API

### `isSupported()`

Returns whether the current browser exposes the DOM, SVG image, Canvas 2D, Blob, and object-URL APIs required by the renderer.

### `sanitizeHTML(html)`

Returns sanitized HTML for layout. Scripts, active form controls, frames, external resource URLs, event-handler attributes, and non-data image sources are removed. Embedded PNG, JPEG, GIF, and WebP data images are permitted; CSS imports and non-data CSS URLs are removed.

### `pageBreak()`

Returns an explicit page-break marker. The renderer also recognizes elements carrying `data-pdf-page-break`.

### `render(html, options)`

Returns a Promise for `{ blob, pages, bytes, pageSize, orientation, searchableWords }`. The `blob` is a PDF 1.4 file containing rasterized page images and an invisible text layer for search and copy.

Supported options:

| Option | Default | Description |
|---|---:|---|
| `title` | `Document` | PDF metadata title. |
| `pageSize` | `A4` | `A3`, `A4`, `A5`, `Letter`, or `Legal`. |
| `orientation` | `portrait` | `portrait` or `landscape`. |
| `margin` | `12` | Uniform margin in millimetres, or a numeric/CSS length using `mm`, `cm`, `in`, `pt`, or `px`. |
| `margins` | — | Per-side `top`, `right`, `bottom`, and `left` overrides. |
| `scale` | `1.5` | Raster resolution multiplier from `0.5` to `3`. |
| `quality` | `0.9` | JPEG quality greater than `0` and at most `1`. |
| `fontSize` | `12px` | Base CSS font size. |
| `fontFamily` | `Arial, Helvetica, sans-serif` | Base font family. |
| `maxPages` | `100` | Maximum number of generated pages. |
| `timeoutMs` | `15000` | Layout and embedded-image timeout. |

```js
const result = await BareMetal.DocumentRenderer.render(invoiceHtml, {
  title: 'Invoice INV-1042',
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 14,
  scale: 1.5
});

const url = URL.createObjectURL(result.blob);
downloadLink.href = url;
downloadLink.download = 'invoice-1042.pdf';
```

The renderer accepts HTML strings, sanitizes them, lays them out in a hidden same-origin sandboxed frame, captures element geometry and computed text styles, rasterizes SVG page artwork with Canvas, and writes PDF objects and cross-reference offsets in JavaScript.

### `download(html, filename, options)`

Renders the document, triggers a browser file download, and resolves to the same result object as `render`. It does not open a print dialog or invoke a printer driver.

```js
const result = await BareMetal.DocumentRenderer.download(invoiceHtml, 'invoice-1042.pdf', {
  title: 'Invoice INV-1042',
  pageSize: 'A4'
});
console.log('Downloaded PDF pages:', result.pages);
```

## Fidelity and limits

- Browser layout determines element and text positions. The SVG painter supports text, common backgrounds and borders, and embedded raster images; advanced CSS effects, pseudo-elements, and some SVG/CSS artwork may differ from the browser preview.
- The text layer is invisible and uses the built-in WinAnsi Helvetica font. Text outside WinAnsi may be normalized or replaced in the searchable layer, while remaining visible in the raster page.
- External resources are intentionally blocked. Embed required raster images as supported data URIs; fonts, stylesheets, scripts, and linked images are not fetched.
- SVG image loading, Canvas 2D, Blob, and object URLs must be available. The renderer reports an error if page rasterization fails; it does not fall back to printing.
- Page canvases are limited to 30 megapixels, and the text layer is limited to 20,000 positioned words.
