# PicoCompress

Block-based LZ compressor. Pure JavaScript, zero dependencies. Byte-identical to the [C reference implementation](https://github.com/WillEastbury/picocompress).

Vendored from [`WillEastbury/picocompress`](https://github.com/WillEastbury/picocompress) (MIT).

## API

| Function | Description |
|---|---|
| `PicoCompress.compress(input, options?)` | Compress a `Uint8Array`. Returns compressed `Uint8Array`. |
| `PicoCompress.decompress(compressed)`    | Decompress a `Uint8Array`. Returns original `Uint8Array`. |
| `PicoCompress.compressBound(inputLen)`   | Worst-case output size for a given input length. |
| `PicoCompress.PROFILES`                  | Named tuning presets (see below). |

### Options

| Option | Default | Description |
|---|---|---|
| `profile` | `'balanced'` | Preset: `micro`, `minimal`, `balanced`, `aggressive`, `q3`, `q4` |
| `blockSize` | 508 | Block size in bytes (1–511) |
| `hashBits` | 9 | Hash table size = 2^hashBits |
| `chainDepth` | 2 | Hash chain depth |
| `historySize` | 504 | Cross-block history buffer size |
| `lazySteps` | 1 | Lazy match lookahead steps |

### Profiles

| Profile | Block | Hash | Depth | History | Best for |
|---|---:|---:|---:|---:|---|
| `micro` | 192 | 256×1 | 1 | 64 | Extreme RAM constraints |
| `minimal` | 508 | 256×1 | 1 | 128 | Low-memory embedded |
| `balanced` | 508 | 512×2 | 2 | 504 | General purpose (default) |
| `aggressive` | 508 | 256×4 | 4 | 504 | Better ratio, same RAM |
| `q3` | 508 | 1024×2 | 2 | 1024 | Higher ratio, more RAM |
| `q4` | 508 | 2048×2 | 2 | 2048 | Maximum ratio |

## Integration with BareMetalRest

When `picocompress.js` is loaded before `BareMetalRest.js`, opt-in wire compression is available:

```js
BareMetalRest.setCompression({
  enabled: true,       // turn on
  profile: 'balanced', // picocompress profile
  minSize: 256         // only compress bodies >= this many bytes
});
```

This adds `Content-Encoding: picocompress` to outgoing requests and `Accept-Encoding: picocompress` to tell the server it can compress responses too. The server needs a matching picocompress implementation (C, C#, Go, Rust, Python, or Java ports are available upstream).

## Standalone usage

```html
<script src="src/picocompress.js"></script>
<script>
  const input = new TextEncoder().encode('Hello, world! '.repeat(100));
  const compressed = PicoCompress.compress(input);
  const restored = PicoCompress.decompress(compressed);
  console.log(input.length, '→', compressed.length, 'bytes');
</script>
```

## Files

| File | Description |
|---|---|
| `src/picocompress.js` | Classic IIFE global (`var PicoCompress = …`). Drop-in `<script>` tag. |
| `src/vendor/picocompress/picocompress.mjs` | Upstream ES module (verbatim copy). |
| `esm/picocompress.js` | ESM re-export wrapper. |
