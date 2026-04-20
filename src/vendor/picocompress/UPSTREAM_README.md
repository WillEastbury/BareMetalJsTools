# picocompress — JavaScript

Pure JavaScript port of the [picocompress](../../) block-based LZ compressor.
Zero dependencies. Works in Node.js 18+ and modern browsers.

## Install

```bash
npm install picocompress
```

Or copy `picocompress.mjs` directly into your project.

## API

### `compress(input: Uint8Array, options?: object): Uint8Array`

Compress a byte array. Returns the compressed bytes.

**Options:**

| Option        | Type   | Default     | Description                              |
|---------------|--------|-------------|------------------------------------------|
| `profile`     | string | `'balanced'`| Preset: `micro`, `minimal`, `balanced`, `aggressive`, `q3`, `q4` |
| `blockSize`   | number | 508         | Block size in bytes (1–511)              |
| `hashBits`    | number | 9           | Hash table size = 2^hashBits             |
| `chainDepth`  | number | 2           | Hash chain depth                         |
| `historySize` | number | 504         | Cross-block history buffer size          |
| `lazySteps`   | number | 1           | Lazy match lookahead steps               |

### `decompress(compressed: Uint8Array): Uint8Array`

Decompress picocompress data. Returns the original bytes.

### `compressBound(inputLen: number): number`

Returns the worst-case compressed output size for a given input length.

## Node.js — ES Module

```js
import { compress, decompress } from 'picocompress';

const input = new TextEncoder().encode('Hello, world!');
const compressed = compress(input);
const restored = decompress(compressed);
console.log(new TextDecoder().decode(restored)); // "Hello, world!"
```

## Node.js — CommonJS

```js
const { compress, decompress } = require('picocompress');

const input = Buffer.from('Hello, world!');
const compressed = compress(new Uint8Array(input));
const restored = decompress(compressed);
console.log(Buffer.from(restored).toString()); // "Hello, world!"
```

## Browser

```html
<script type="module">
  import { compress, decompress } from './picocompress.mjs';

  const input = new TextEncoder().encode('Hello from the browser!');
  const compressed = compress(input);
  const restored = decompress(compressed);
  console.log(new TextDecoder().decode(restored));
</script>
```

## Profiles

All profiles produce streams that any decoder can decompress.

| Profile      | Block | Hash   | Depth | History | Lazy | Best for                    |
|--------------|------:|-------:|------:|--------:|-----:|-----------------------------|
| `micro`      |   192 | 256×1  |     1 |      64 |    1 | Extreme RAM constraints     |
| `minimal`    |   508 | 256×1  |     1 |     128 |    1 | Low-memory embedded         |
| `balanced`   |   508 | 512×2  |     2 |     504 |    1 | General purpose (default)   |
| `aggressive` |   508 | 256×4  |     4 |     504 |    1 | Better ratio, same RAM      |
| `q3`         |   508 | 1024×2 |     2 |    1024 |    2 | Higher ratio, more RAM      |
| `q4`         |   508 | 2048×2 |     2 |    2048 |    2 | Maximum ratio               |

```js
const compressed = compress(data, { profile: 'q4' });
```

## Compatibility

The JavaScript port produces byte-identical compressed output to the C
reference implementation (with matching profile settings). Any stream
compressed by the C library can be decompressed by the JavaScript port
and vice versa.

## License

MIT
