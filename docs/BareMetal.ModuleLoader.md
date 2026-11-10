# BareMetal.ModuleLoader

Verified, cacheable browser module loading with optional gzip/deflate decompression and optional secure transport.

```html
<script src="src/BareMetal.Integrity.js"></script>
<script src="src/BareMetal.ModuleLoader.js"></script>
<script>
const modules = BareMetal.ModuleLoader.create({
  manifestUrl: '/modules.manifest.json',
  baseUrl: '/',
  requireIntegrity: true,
  cache: 'no-store'
});

await modules.load('BareMetal.Bind');
await modules.loadAll();
</script>
```

Manifest entries use `path`, `sha256`, optional `size`, and optional `encoding` (`gzip`, `deflate`,
`deflate-raw`, or `picocompress`). `load()` verifies a digest before executing
module code.

Picocompress is preferable for constrained clients and offline/static hosts
because it is implemented in the toolkit itself and requires neither the
server nor the browser to negotiate gzip or Brotli. Load
`BareMetal.Compress.js` before `BareMetal.ModuleLoader.js`, precompress each
manifested module with `BareMetal.Minifier.compressGzip(..., { format:
'picocompress' })`, and set the entry `encoding` to `picocompress`. Blob-script execution supports browser CSP modes that permit blob scripts; strict CSP deployments should pre-authorise the manifest sources or use a nonce-compatible host integration.
