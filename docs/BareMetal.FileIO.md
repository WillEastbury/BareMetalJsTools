# BareMetal.FileIO

> File System Access API wrapper with picker fallbacks, drag-drop helpers, chunked reading, downloads, and file utility methods.

**Size:** 12 KB source / 9 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.FileIO.min.js"></script>
<script>
  async function run() {
    const picked = await BareMetal.FileIO.openText({
      accept: ['text/plain', '.md'],
      description: 'Text files'
    });

    if (!picked) return;

    console.log('Opened:', picked.name, picked.text);

    await BareMetal.FileIO.save(picked.text.toUpperCase(), {
      filename: 'copy.txt',
      type: 'text/plain',
      accept: ['text/plain']
    });
  }

  run();
</script>
```

## API Reference

### `open(options)` → `Promise<File | File[] | null>`

Opens the system file picker. Uses `showOpenFilePicker()` when available and falls back to a hidden `<input type="file">`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Picker options: `accept` (array of MIME types/extensions), `multiple`, and `description`. |

**Example:**
```js
const file = await BareMetal.FileIO.open({
  accept: ['application/json', '.json'],
  description: 'JSON files'
});
```

### `openText(options)` → `Promise<{ name: string, text: string, size: number, type: string } | null>`

Opens a file and reads it as UTF-8 text.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Same picker options as `open()`. |

**Example:**
```js
const doc = await BareMetal.FileIO.openText({ accept: ['text/plain'] });
if (doc) console.log(doc.text);
```

### `openJSON(options)` → `Promise<{ name: string, data: any, size: number } | null>`

Opens a file and parses it as JSON. Invalid JSON resolves to `null`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Same picker options as `open()`. |

**Example:**
```js
const payload = await BareMetal.FileIO.openJSON({ accept: ['application/json'] });
if (payload) console.log(payload.data);
```

### `openBinary(options)` → `Promise<{ name: string, buffer: ArrayBuffer, size: number, type: string } | null>`

Opens a file and reads it as an `ArrayBuffer`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Same picker options as `open()`. |

**Example:**
```js
const bin = await BareMetal.FileIO.openBinary({ accept: ['image/*'] });
if (bin) console.log(bin.buffer.byteLength);
```

### `openDataURL(options)` → `Promise<{ name: string, dataUrl: string, size: number, type: string } | null>`

Opens a file and reads it as a data URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Same picker options as `open()`. |

**Example:**
```js
const img = await BareMetal.FileIO.openDataURL({ accept: ['image/*'] });
if (img) document.querySelector('img').src = img.dataUrl;
```

### `openDirectory()` → `Promise<Array<{ name: string, path: string, file: File }>>`

Opens a directory picker and returns every file with its relative path. Uses `showDirectoryPicker()` when available and falls back to a directory-enabled file input.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const files = await BareMetal.FileIO.openDirectory();
console.log(files.map(x => x.path));
```

### `save(content, options)` → `Promise<boolean>`

Saves content to disk. Uses `showSaveFilePicker()` when available, otherwise downloads the generated blob.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| content | any | — | Content to save. Strings, blobs, objects, `ArrayBuffer`s, and typed arrays are supported. |
| options | object | `{}` | Save options: `filename`, `type`, `accept`, and `description`. |

**Example:**
```js
await BareMetal.FileIO.save({ ok: true }, {
  filename: 'result.json',
  type: 'application/json',
  accept: ['application/json']
});
```

### `download(content, filename, type)` → `void`

Triggers a browser download for in-memory content.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| content | any | — | Content to package as a blob. |
| filename | string | `'download'` | Download filename. |
| type | string | inferred | MIME type for the blob. |

**Example:**
```js
BareMetal.FileIO.download('Hello', 'hello.txt', 'text/plain');
```

### `downloadUrl(url, filename)` → `Promise<void>`

Downloads a remote URL. If `fetch()` is available and `filename` is provided, it first downloads the blob so the filename can be preserved.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | Source URL to download. |
| filename | string | optional | Preferred filename for the download. |

**Example:**
```js
await BareMetal.FileIO.downloadUrl('/api/report.csv', 'report.csv');
```

### `dropZone(element, options)` → `{ destroy: Function }`

Turns an element into a drag-drop target. Accepted files can be filtered and optionally pre-read before your `onDrop` callback runs.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| element | Element | — | Drop target element. |
| options | object | `{}` | Drop options: `accept`, `multiple`, `highlight` (defaults to `true`), `readAs` (`'text'`, `'binary'`, or `'dataurl'`), `onDrop`, `onDragOver`, and `onDragLeave`. |

**Example:**
```js
const zone = BareMetal.FileIO.dropZone(document.getElementById('drop'), {
  accept: ['image/*'],
  multiple: true,
  onDrop(files) {
    console.log(files);
  }
});

// zone.destroy();
```

### `readAsText(file, encoding)` → `Promise<string | null>`

Reads a `Blob` or `File` as text.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | Blob | — | Blob or file to read. |
| encoding | string | `'utf-8'` | Text encoding passed to `FileReader.readAsText()`. |

**Example:**
```js
const text = await BareMetal.FileIO.readAsText(file, 'utf-8');
```

### `readAsJSON(file)` → `Promise<any | null>`

Reads a file as text and parses JSON.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | Blob | — | Blob or file to parse. |

**Example:**
```js
const data = await BareMetal.FileIO.readAsJSON(file);
```

### `readAsArrayBuffer(file)` → `Promise<ArrayBuffer | null>`

Reads a file as binary data.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | Blob | — | Blob or file to read. |

**Example:**
```js
const buffer = await BareMetal.FileIO.readAsArrayBuffer(file);
```

### `readAsDataURL(file)` → `Promise<string | null>`

Reads a file and returns a `data:` URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | Blob | — | Blob or file to read. |

**Example:**
```js
const dataUrl = await BareMetal.FileIO.readAsDataURL(file);
```

### `readChunked(file, options)` → `Promise<void>`

Reads a file in chunks using `file.slice()`, calling your callbacks as each chunk arrives.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | File | — | File to process incrementally. |
| options | object | `{}` | Chunk settings: `chunkSize` (defaults to `65536`), `onChunk(chunk, offset, size)`, `onProgress(percent)`, and `onComplete()`. |

**Example:**
```js
await BareMetal.FileIO.readChunked(file, {
  chunkSize: 1024 * 1024,
  onChunk(chunk, offset) {
    console.log('Chunk at', offset, chunk.byteLength);
  },
  onProgress(percent) {
    console.log(percent + '%');
  }
});
```

### `stream(file)` → `ReadableStream | null`

Returns the native stream for a file/blob when supported.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | Blob | — | Blob or file to stream. |

**Example:**
```js
const stream = BareMetal.FileIO.stream(file);
const reader = stream && stream.getReader();
```

### `pick(options)` → `Promise<File[]>`

Low-level hidden-input picker helper. Always resolves to an array.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Same options accepted by `open()`. |

**Example:**
```js
const files = await BareMetal.FileIO.pick({ multiple: true, accept: ['image/*'] });
```

### `formatSize(bytes)` → `string`

Formats a byte count into `B`, `KB`, `MB`, `GB`, or `TB`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| bytes | number | `0` | Byte count to format. |

**Example:**
```js
BareMetal.FileIO.formatSize(1536); // '1.5 KB'
```

### `ext(name)` → `string`

Returns a lowercase extension without the leading dot.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | `''` | Filename to inspect. |

**Example:**
```js
BareMetal.FileIO.ext('report.PDF'); // 'pdf'
```

### `isImage(file)` → `boolean`

Checks a file by MIME type and common image extensions.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | File | — | File to test. |

**Example:**
```js
console.log(BareMetal.FileIO.isImage(file));
```

### `isVideo(file)` → `boolean`

Checks a file by MIME type and common video extensions.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | File | — | File to test. |

**Example:**
```js
console.log(BareMetal.FileIO.isVideo(file));
```

### `isAudio(file)` → `boolean`

Checks a file by MIME type and common audio extensions.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | File | — | File to test. |

**Example:**
```js
console.log(BareMetal.FileIO.isAudio(file));
```

### `isPDF(file)` → `boolean`

Checks whether a file is a PDF by MIME type or `.pdf` extension.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | File | — | File to test. |

**Example:**
```js
console.log(BareMetal.FileIO.isPDF(file));
```

### `slice(file, start, end)` → `Blob | null`

Safely slices a file/blob.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| file | Blob | — | Source blob. |
| start | number | — | Start byte offset. |
| end | number | — | End byte offset. |

**Example:**
```js
const firstKb = BareMetal.FileIO.slice(file, 0, 1024);
```

### `blobToArrayBuffer(blob)` → `Promise<ArrayBuffer | null>`

Converts a blob into an `ArrayBuffer`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| blob | Blob | — | Blob to convert. |

**Example:**
```js
const buffer = await BareMetal.FileIO.blobToArrayBuffer(blob);
```

### `blobToText(blob)` → `Promise<string | null>`

Converts a blob into text.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| blob | Blob | — | Blob to convert. |

**Example:**
```js
const text = await BareMetal.FileIO.blobToText(blob);
```

### `blobToDataURL(blob)` → `Promise<string | null>`

Converts a blob into a data URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| blob | Blob | — | Blob to convert. |

**Example:**
```js
const dataUrl = await BareMetal.FileIO.blobToDataURL(blob);
```

### `textToBlob(text, type)` → `Blob`

Creates a text blob.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| text | string | `''` | Text content to wrap. |
| type | string | `'text/plain'` | Blob MIME type. |

**Example:**
```js
const blob = BareMetal.FileIO.textToBlob('hello', 'text/plain');
```

### `arrayBufferToBlob(buffer, type)` → `Blob`

Creates a blob from an `ArrayBuffer`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| buffer | ArrayBuffer | empty buffer | Binary content to wrap. |
| type | string | `'application/octet-stream'` | Blob MIME type. |

**Example:**
```js
const blob = BareMetal.FileIO.arrayBufferToBlob(buffer, 'application/pdf');
```

### `hasFileSystemAccess()` → `boolean`

Returns `true` when the browser exposes `showOpenFilePicker()` and `showSaveFilePicker()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.FileIO.hasFileSystemAccess());
```

### `hasDragDrop()` → `boolean`

Returns `true` when the current browser supports DOM drag-drop events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.FileIO.hasDragDrop());
```

## Notes

- `open()`, `save()`, and `openDirectory()` automatically prefer the File System Access API and fall back gracefully when unavailable.
- `dropZone()` adds and removes the `bm-drop-active` class unless `highlight: false` is set.
- `save()` and `download()` accept strings, blobs, objects, `ArrayBuffer`s, and typed arrays.
- `readChunked()` is useful for hashing, uploads, parsing, and other large-file workflows where loading the whole file at once is undesirable.
