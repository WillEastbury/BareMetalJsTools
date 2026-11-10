# BareMetal.Integrity

SHA-256 manifest generation and fail-closed verification for browser module loading.

```html
<script src="src/BareMetal.Integrity.js"></script>
<script>
const digest = await BareMetal.Integrity.sha256(moduleBytes);
const valid = await BareMetal.Integrity.verify(moduleBytes, expectedDigest);

const result = await BareMetal.Integrity.verifyManifest({
  version: 1,
  algorithm: 'SHA-256',
  revision: 'source revision or commit',
  modules: {
    'BareMetal.Bind': {
      path: 'src/BareMetal.Bind.min.js',
      sha256: '64-character hex digest'
    }
  }
}, { baseUrl: '/' });

if (!result.ok) throw new Error('Module integrity failed');
</script>
```

`createManifest(entries, options)` builds a manifest. `verifyManifest()` checks every SHA-256 digest and optional byte size. Verification fails closed: the caller decides whether to block module execution.
