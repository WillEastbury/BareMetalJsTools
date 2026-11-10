# BareMetal.Print

Schema-driven browser printing and receipt formatting, with optional dependency-free PDF generation through `BareMetal.DocumentRenderer`.

## Load

```html
<script src="src/BareMetal.DocumentRenderer.js"></script>
<script src="src/BareMetal.Print.js"></script>
```

## Public API

### `render(document, options)`

Builds HTML from a document and print options.

### `paginate(document, options)`

Paginates document content using the configured layout.

### `print(document, options)`

Selects a device using `options.device`:

- `browser` (default) writes the content into a browser frame and opens the browser print UI unless `silent: true`.
- `thermal` returns receipt text or structured receipt output.
- `pdf` delegates to `BareMetal.DocumentRenderer.render` and resolves to `{ blob, pages, bytes, pageSize, orientation, searchableWords }`. Load `BareMetal.DocumentRenderer.js` first. This path writes a real PDF in JavaScript and does not open the print UI.

### `preview(document, options)`

Creates a browser preview of the rendered document.

### `receipt(data, options)`

Formats receipt data for a thermal device.

### `invoice(data, options)`

Builds an invoice document.

### `document(data, options)`

Builds a document from structured content.

### `barcode(value, options)`

Creates a barcode representation for a printable document.

### `qr(value, options)`

Creates a QR representation for a printable document.

## PDF example

```js
const result = await BareMetal.Print.print(invoiceHtml, {
  device: 'pdf',
  title: 'Invoice INV-1042',
  pageSize: 'A4'
});
const url = URL.createObjectURL(result.blob);
downloadLink.href = url;
downloadLink.download = 'invoice-1042.pdf';
```
