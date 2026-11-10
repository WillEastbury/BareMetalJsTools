# BareMetal minified artefacts

Dependency-free minify path for `components/baremetaljstools` (issue #50).
No Node, npm, or Terser.

## Source of truth

| Role | Path |
|---|---|
| Authoritative source | Unminified `src/**/*.js` and `src/**/*.css` (not `*.min.*`) |
| Generated artefacts | Sibling `*.min.js` / `*.min.css` next to the source |
| Minifier implementation | `src/BareMetal.Minifier.js` (`BareMetal.Minifier.minifyJS` / `minifyCSS`) |
| Host entry point | `minify.ps1` (Edge CDP + `minify-host.html`) |

Do not edit `*.min.js` / `*.min.css` by hand.

## Commands

```powershell
cd components/baremetaljstools

# Dry-run: minify all existing pairs; fail only on unsupported (reports drift, no writes)
powershell -ExecutionPolicy Bypass -File minify.ps1

# Strict: require checked-in *.min.* to match fresh output exactly
powershell -ExecutionPolicy Bypass -File minify.ps1 -Check

# Minify one file (writes sibling .min.*)
powershell -ExecutionPolicy Bypass -File minify.ps1 -Path src\BareMetal.Bind.js -Write

# Refresh all pairs that already have a .min.* sibling
powershell -ExecutionPolicy Bypass -File minify.ps1 -All -Write
```

Default mode is dry-run. After the #50 refresh, `-Check` should stay green; re-run `-Path … -Write` when you change a source that has a min sibling.

## Pairing rules

- `Foo.js` → `Foo.min.js`
- `Foo.css` → `Foo.min.css`
- Skip anything already named `*.min.js` / `*.min.css`
- Skip `src/vendor/**`
- `-All` only considers sources under `src/` that already have a min sibling (no surprise new artefacts)
- Explicit `-Path ... -Write` may create a missing sibling
- `BareMetal.Minifier.js` itself is not part of `-All` (no checked-in `BareMetal.Minifier.min.js`)

## Fail-closed behaviour

If `minifyJS` / `minifyCSS` returns `unsupported: true` or non-empty `errors`, the run fails and **does not write**.

Lexical compaction only: no mangling, no AST. Intended for known BareMetal sources, not arbitrary third-party JS.

`BareMetal.Minifier.compressGzip(source)` and `decompressGzip(source)` use browser
`CompressionStream`/`DecompressionStream` when available. This provides an optional
load-time gzip layer for assets already received as bytes; it does not replace HTTP
compression or TLS.

Pass `{ format: 'picocompress', profile: 'balanced' }` to use the repository's
`BareMetal.Compress` implementation instead:

```js
const packed = await BareMetal.Minifier.compressGzip(bytes, {
  format: 'picocompress',
  profile: 'balanced'
});
const restored = await BareMetal.Minifier.decompressGzip(packed, {
  format: 'picocompress'
});
```

## When to regenerate

1. After an accepted change to `BareMetal.Minifier.js`, re-run `-All -Check`. If drift is expected, `-All -Write` in a focused PR.
2. After editing a source module that already has a min sibling, refresh that pair (`-Path ... -Write`) in the same change.
3. Do not mass-regenerate unrelated modules “for luck”.

## Determinism

Same minifier source + same input bytes → same output bytes (UTF-8, no BOM).
`-Check` compares exact string equality to the checked-in artefact.

## Optional provenance

Commits that refresh min files should mention:

- command used (`minify.ps1 -Path … -Write` or `-All -Write`)
- minifier file (`src/BareMetal.Minifier.js`) at that revision

Hashes are optional; exact `-Check` equality is the gate.

## Related

- Client harness smoke: `run-harness.ps1 -Smoke` (includes Minifier browser tests)
- Parent tooling: issue #46 / #50
