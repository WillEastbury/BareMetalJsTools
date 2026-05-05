# BareMetal.Compress

> Tiny block-based compressor with tuned profiles for small browser payloads.

**Size:** 18.94 KB source / 8.28 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Compress.min.js"></script>
<script>
  const text = 'status=ok&status=ok&status=ok&message=Hello';
  const input = new TextEncoder().encode(text);
  const packed = BareMetal.Compress.compress(input, { profile: 'balanced' });
  const roundTrip = new TextDecoder().decode(BareMetal.Compress.decompress(packed));
  console.log(roundTrip);
</script>
```

## API Reference

### `compress(input, options)` → `Uint8Array`

Compresses a `Uint8Array` using one of the built-in profiles plus any explicit overrides.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | Uint8Array | — | Raw bytes to compress |
| options | object | `{ profile: 'balanced' }` | Compression profile and overrides |

**Example:**
```js
const bytes = new TextEncoder().encode(JSON.stringify(payload));
const compressed = BareMetal.Compress.compress(bytes, { profile: 'q3' });
```

### `decompress(input)` → `Uint8Array`

Decompresses a stream produced by `compress()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | Uint8Array | — | Encoded bytes |

**Example:**
```js
const decoded = BareMetal.Compress.decompress(compressed);
```

### `compressBound(inputLength)` → `number`

Returns the worst-case output size used for preallocation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| inputLength | number | — | Raw input length in bytes |

### `PROFILES` → `object`

Exposes the built-in compression presets.

| Profile | Description |
|---|---|
| `micro` | Very small history, lowest memory |
| `minimal` | Small and cheap general-purpose preset |
| `balanced` | Default preset used by `compress()` |
| `aggressive` | Deeper search for better ratio |
| `q3` | Higher compression with more history |
| `q4` | Highest preset in this file |

BareMetal.Compress is also assigned to `globalThis.PicoCompress`.

## Configuration / Options

### `compress()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| profile | string | `'balanced'` | Picks a preset from `PROFILES` |
| bSz | number | profile value | Block size |
| hashBits | number | profile value | Hash table size exponent |
| chainDepth | number | profile value | Match search depth |
| historySize | number | profile value | Cross-block history window |
| lazySteps | number | profile value | Look-ahead steps before committing a match |

### Built-in profiles

| Profile | `bSz` | `hashBits` | `chainDepth` | `historySize` | `lazySteps` |
|---|---:|---:|---:|---:|---:|
| `micro` | 192 | 8 | 1 | 64 | 1 |
| `minimal` | 508 | 8 | 1 | 128 | 1 |
| `balanced` | 508 | 9 | 2 | 504 | 1 |
| `aggressive` | 508 | 8 | 4 | 504 | 1 |
| `q3` | 508 | 10 | 2 | 1024 | 2 |
| `q4` | 508 | 11 | 2 | 2048 | 2 |

## Examples

### Example 1: Compress a JSON payload before upload
```js
const body = new TextEncoder().encode(JSON.stringify({
  status: 'ready',
  items: rows,
  generatedAt: new Date().toISOString()
}));

const packed = BareMetal.Compress.compress(body, { profile: 'balanced' });
await fetch('/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: packed
});
```

### Example 2: Use the global alias
```js
const original = new TextEncoder().encode('<div><div><div>repeat repeat repeat</div></div></div>');
const packed = PicoCompress.compress(original, { profile: 'aggressive' });
const restored = PicoCompress.decompress(packed);
console.log(restored.byteLength);
```

## Notes
- Inputs must be `Uint8Array`; strings and `ArrayBuffer` values should be converted first.
- `decompress()` throws on truncated headers, truncated payloads, or corrupt token streams.
- Compression is block-based, so data may be emitted uncompressed when that is smaller.
- The file also exports CommonJS `module.exports = BareMetal.Compress`.
