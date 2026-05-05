# Copilot Instructions for BareMetalJsTools

## Build & Test

```bash
npm install
npm test                          # full suite (Jest + jsdom)
npx jest tests/BareMetalBind.test.js          # single file
npx jest --testNamePattern="reactive"         # single test by name
npm run test:coverage             # with coverage report
```

No build step exists — source files are used directly.

## Architecture

This is a collection of independent vanilla-JS IIFE modules under the `BareMetal.*` namespace. Each `src/BareMetal.X.js` file is a self-contained IIFE that attaches to the shared `BareMetal` namespace object when loaded via `<script>`.

**Modules:**

| File | Namespace | Purpose |
|------|-----------|---------|
| `BareMetal.Bind.js` | `BareMetal.Bind` | Core reactive proxy binding, directives (m-value, m-text, m-each, m-if, etc.) |
| `BareMetal.Components.js` | `BareMetal.Components` | Widget directives (m-chatbot, m-calendar, m-gantt, m-table, m-tree, m-toast, m-navbar, m-img) |
| `BareMetal.ComponentFactories.js` | `BareMetal.ComponentFactories` | Object factories (`create`, `chatEndpoint`) |
| `BareMetal.Communications.js` | `BareMetal.Communications` | REST/WebSocket transport, WAL, compression |
| `BareMetal.Binary.js` | `BareMetal.Binary` | BSO1 binary serialisation |
| `BareMetal.Template.js` | `BareMetal.Template` | Schema-driven DOM templating |
| `BareMetal.Rendering.js` | `BareMetal.Rendering` | Entity rendering pipeline |
| `BareMetal.Routing.js` | `BareMetal.Routing` | SPA hash router (also `window.BMRouter`) |
| `BareMetal.Charts.js` | `BareMetal.Charts` | SVG chart rendering |
| `BareMetal.Graph.js` | `BareMetal.Graph` | Graph/network visualisation |
| `BareMetal.Compress.js` | `BareMetal.Compress` | Pico compression (also `globalThis.PicoCompress`) |
| `BareMetal.Metadata.js` | `BareMetal.Metadata` | Schema metadata utilities |
| `BareMetal.Auth.js` | `BareMetal.Auth` | OIDC/OAuth2 PKCE client with silent refresh, provider presets, UI |
| `BareMetal.Crypto.js` | `BareMetal.Crypto` | Web Crypto wrapper (AES-GCM, RSA-OAEP, ECDSA, PBKDF2) |
| `BareMetal.LocalKVStore.js` | `BareMetal.LocalKVStore` | Key-value store (localStorage, sessionStorage, IndexedDB) |
| `BareMetal.Progressive.js` | `BareMetal.Progressive` | PWA helper (SW registration, install prompts, offline queue, push) |
| `BareMetal.ServiceWorker.js` | — (SW context) | Configurable service worker (cache strategies, precache, background sync) |
| `BareMetal.Time.js` | `BareMetal.Time` | Date/time library (format, relative, durations, timezone, Temporal) |
| `BareMetalStyles.css` | — | CSS framework with short class names (`.bt`, `.cd`, `.rw`) |
| `BareMetal.Styles.BootstrapCompatibilityShim.css` | — | Optional Bootstrap 5 long-name aliases (`.btn`, `.card`, `.row`) |

**Dependency graph (load order matters):**

- `BareMetal.Components` → depends on `BareMetal.Bind`
- `BareMetal.ComponentFactories` → soft deps on `BareMetal.Bind`, `BareMetal.Communications`
- `BareMetal.Rendering` → depends on `BareMetal.Communications`, `BareMetal.Bind`, `BareMetal.Template`
- `BareMetal.Communications` → depends on `BareMetal.Binary`; optionally uses `BareMetal.Compress`
- `BareMetal.Auth` → soft dep on `BareMetal.Communications` (attachToRest auto-injects tokens)
- `BareMetal.Progressive` → soft deps on `BareMetal.Communications`, `BareMetal.LocalKVStore`
- All others → fully standalone

## Key Conventions

### Module pattern

Every JS module follows this namespace IIFE structure:

```js
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.X = (() => {
  'use strict';
  // ... implementation ...
  return { publicApi };
})();
```

Do not convert to ES modules or classes.

### Test pattern

Tests load source via `fs.readFileSync` + `new Function(...)` to execute in a fresh jsdom context. The file is executed as-is and the result is read from `BareMetal.X`:

```js
function loadModule() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const fn = new Function('document', 'requestAnimationFrame',
    code + '\nreturn BareMetal.X;'
  );
  return fn(global.document, (cb) => setTimeout(cb, 0));
}
```

### No dependencies

Zero runtime dependencies. `jest` and `jest-environment-jsdom` are the only dev dependencies.

### Reactive binding directives

`BareMetal.Bind` uses `m-*` HTML attributes (e.g., `m-value`, `m-text`, `m-each`, `m-if`). Widget directives (m-chatbot, m-calendar, etc.) live in `BareMetal.Components`.

### CSS module

`BareMetalStyles.css` is a standalone CSS framework with short class names optimised for wire size. No JS, no preprocessor.

`BareMetal.Styles.BootstrapCompatibilityShim.css` is an optional add-on that provides standard Bootstrap 5 class names (`.btn`, `.card`, `.row`, `.col-md-6`, `.d-flex`, etc.) for sites migrating from Bootstrap without rewriting HTML. Load it after BareMetalStyles:

```html
<link href="BareMetalStyles.min.css" rel="stylesheet">
<link href="BareMetal.Styles.BootstrapCompatibilityShim.min.css" rel="stylesheet">
```

**Themes** (`src/themes/`): Tiny `:root` variable overrides (~600 bytes min each). Load after the core stylesheet:

| Theme | Vibe |
|-------|------|
| `base` | Clean white, soft greys (default — already built into core) |
| `bedlam` | Dark cyberpunk — neon purples & teals |
| `wavefunction` | Dark scientific — deep slate & electric indigo |
| `lava` | Fiery dark — molten oranges on volcanic black |
| `candy` | Soft candy pink — pastels & lilacs |

```html
<link href="BareMetalStyles.min.css" rel="stylesheet">
<link href="themes/wavefunction.min.css" rel="stylesheet">
```

**Bundled fonts** (`src/fonts/`): Six subsetted WOFF2 fonts (Latin + Latin Extended + symbols + arrows + currency). Load `fonts.css` to register all `@font-face` declarations — themes then reference them via `--bs-font-sans` / `--bs-font-mono`.

| Font | Source | Size | Class | Use case |
|------|--------|------|-------|----------|
| `BareMetalMono` | JetBrains Mono | 17 KB | `.font-mono` | Code, data, terminals |
| `BareMetalSans` | Inter | 14 KB | `.font-sans` | Clean body text, UI |
| `BareMetalPixel` | Silkscreen | 2.7 KB | `.font-pixel` | Retro, IoT, tiny displays |
| `Wavefunction-Sans` | Source Sans 3 | 27 KB | `.font-wf-sans` | Modern sans-serif (general) |
| `Wavefunction-Curly` | Dancing Script | 28 KB | `.font-wf-curly` | Handwriting/calligraphy |
| `Wavefunction-Serif` | Source Serif 4 | 28 KB | `.font-wf-serif` | Professional typeset (Times-like) |

Total font bundle: **117 KB** (all OFL-licensed). Only load the fonts you use — each `@font-face` uses `font-display: swap` and only fetches on first reference.

```html
<link href="fonts/fonts.min.css" rel="stylesheet">
<link href="BareMetalStyles.min.css" rel="stylesheet">
<link href="themes/bedlam.min.css" rel="stylesheet">
```
