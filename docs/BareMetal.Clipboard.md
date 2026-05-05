# BareMetal.Clipboard

> Clipboard API wrapper for text, HTML, and images with paste hooks, copy feedback, and legacy `execCommand` fallback.

**Size:** 8 KB source / 7 KB minified  
**Dependencies:** None

## Quick Start

```html
<button id="copyBtn">Copy greeting</button>
<textarea id="pasteBox" placeholder="Paste here"></textarea>

<script src="BareMetal.Clipboard.min.js"></script>
<script>
  const pasteBox = document.getElementById('pasteBox');

  BareMetal.Clipboard.onPaste(pasteBox, function (data, event) {
    event.preventDefault();
    console.log('Text:', data.text);
    console.log('HTML:', data.html);
  });

  document.getElementById('copyBtn').addEventListener('click', async function () {
    await BareMetal.Clipboard.copy('Hello from BareMetal!', {
      notifyText: 'Copied to clipboard'
    });
  });
</script>
```

## API Reference

### `writeText(text)` → `Promise<boolean | undefined>`

Writes plain text to the clipboard. Uses `navigator.clipboard.writeText()` when available, then falls back to a hidden textarea + `execCommand('copy')`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| text | string | `''` | Text to place on the clipboard. |

**Example:**
```js
await BareMetal.Clipboard.writeText('Invoice #1042');
```

### `readText()` → `Promise<string>`

Reads plain text from the clipboard. Falls back to `execCommand('paste')` where possible.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const text = await BareMetal.Clipboard.readText();
console.log(text);
```

### `write(list)` → `Promise<boolean | void>`

Writes one or more clipboard items. Supports rich types such as `text/plain`, `text/html`, and `image/png`. If rich clipboard writes fail, it falls back to plain text when a `text/plain` item is present.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| list | array | `[]` | Array of `{ type, data }` clipboard entries. `data` can be text, a `Blob`, or other blob-compatible content. |

**Example:**
```js
await BareMetal.Clipboard.write([
  { type: 'text/plain', data: 'Hello world' },
  { type: 'text/html', data: '<strong>Hello world</strong>' }
]);
```

### `read()` → `Promise<Array<{ type: string, data: Blob }>>`

Reads all available clipboard items. If the async Clipboard API is unavailable, it falls back to plain text and returns a single `text/plain` blob when possible.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const items = await BareMetal.Clipboard.read();
for (const item of items) {
  console.log(item.type, item.data);
}
```

### `copy(text, options)` → `Promise<boolean>`

Copies text and optionally shows a temporary "Copied!" style toast at the top of the page.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| text | string | `''` | Text to copy. |
| options | object | `{}` | Optional settings: `notify` (`true` by default), `notifyText`, and `notifyDuration` in milliseconds. |

**Example:**
```js
await BareMetal.Clipboard.copy('Customer ID: 42', {
  notifyText: 'Customer ID copied',
  notifyDuration: 1500
});
```

### `copyFrom(element, options)` → `Promise<boolean>`

Copies content from an element. By default it copies `textContent`; with `options.html = true` it writes both `text/plain` and `text/html`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| element | Element | — | Source element to copy from. |
| options | object | `{}` | Supports `html`, `notify`, `notifyText`, and `notifyDuration`. |

**Example:**
```js
await BareMetal.Clipboard.copyFrom(document.getElementById('snippet'), {
  html: true,
  notifyText: 'Snippet copied'
});
```

### `copyImage(node)` → `Promise<boolean>`

Copies an image as `image/png`. Accepts a `<canvas>` directly or an `<img>` that can be drawn into an internal canvas first.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| node | HTMLCanvasElement \| HTMLImageElement | — | Canvas or image to copy. |

**Example:**
```js
const ok = await BareMetal.Clipboard.copyImage(document.querySelector('canvas'));
console.log('Image copied:', ok);
```

### `readImage()` → `Promise<Blob | null>`

Returns the first clipboard item whose MIME type starts with `image/`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const blob = await BareMetal.Clipboard.readImage();
if (blob) {
  console.log('Clipboard image size:', blob.size);
}
```

### `onPaste(element, callback)` → `Function`

Attaches a paste listener and normalizes the payload into `{ text, html, files, items }`. If you pass only a callback, it listens on `document`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| element | EventTarget \| function | `document` | Target element, or the callback itself for document-level listening. |
| callback | function | — | Called as `callback(data, event)` when paste occurs. |

**Example:**
```js
const stop = BareMetal.Clipboard.onPaste(function (data) {
  console.log(data.text, data.files.length);
});

// Later:
stop();
```

### `onPasteFiles(element, callback)` → `Function`

Convenience wrapper around `onPaste()` that only forwards pasted files.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| element | EventTarget \| function | `document` | Target element, or the callback itself. |
| callback | function | — | Called as `callback(files, event)`. |

**Example:**
```js
BareMetal.Clipboard.onPasteFiles(document, function (files) {
  console.log('Received files:', files);
});
```

### `onPasteImage(element, callback)` → `Function`

Convenience wrapper around `onPaste()` that forwards only the first pasted image file.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| element | EventTarget \| function | `document` | Target element, or the callback itself. |
| callback | function | — | Called as `callback(file, event)` for the first pasted image. |

**Example:**
```js
BareMetal.Clipboard.onPasteImage(function (file) {
  console.log(file.name, file.type);
});
```

### `cut(element)` → `Promise<boolean>`

Cuts the current value from an input-like element. Uses `execCommand('cut')` when possible and otherwise copies the value and clears it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| element | HTMLInputElement \| HTMLTextAreaElement | — | Element whose current value should be cut. |

**Example:**
```js
const ok = await BareMetal.Clipboard.cut(document.querySelector('textarea'));
console.log(ok);
```

### `checkPermission(name)` → `Promise<'granted' | 'denied' | 'prompt'>`

Checks the browser permission state for clipboard access.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | `'read' \| 'write'` | — | Permission to query. |

**Example:**
```js
const state = await BareMetal.Clipboard.checkPermission('read');
console.log(state);
```

### `requestPermission(name)` → `Promise<boolean>`

Attempts to trigger clipboard permission flow by performing a read or write probe when necessary.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | `'read' \| 'write'` | — | Permission to request. |

**Example:**
```js
const allowed = await BareMetal.Clipboard.requestPermission('write');
console.log('Clipboard write allowed:', allowed);
```

### `isSupported()` → `boolean`

Returns `true` when either the async Clipboard API or `document.execCommand()` fallback is available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
if (!BareMetal.Clipboard.isSupported()) {
  console.warn('Clipboard features are unavailable in this browser.');
}
```

### `isSecureContext()` → `boolean`

Returns `true` when the page is running in a secure context (`https`, localhost, or equivalent).

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.Clipboard.isSecureContext());
```

## Notes

- Rich clipboard reads and writes usually require a secure context and a user gesture.
- `write()` and `copyFrom({ html: true })` are the easiest way to preserve both plain text and HTML.
- `onPaste()` is ideal for paste intercept flows because it exposes text, HTML, and files in one callback.
- The legacy fallback depends on browser support for `document.execCommand()`, which is less capable than the modern Clipboard API.
