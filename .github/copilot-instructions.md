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
| `BareMetal.Validate.js` | `BareMetal.Validate` | Schema validation (required, type, min/max, pattern, nested, custom rules) |
| `BareMetal.I18n.js` | `BareMetal.I18n` | Internationalisation (locale fallback, plurals, interpolation, number/date format) |
| `BareMetal.StateMachine.js` | `BareMetal.StateMachine` | Finite state machine (states, transitions, guards, actions, context) |
| `BareMetal.Logger.js` | `BareMetal.Logger` | Structured logging (levels, transports, batching, safe stringify, child loggers) |
| `BareMetal.Animate.js` | `BareMetal.Animate` | CSS transition/animation helper (enter/leave, stagger, spring, reduced-motion) |
| `BareMetal.TestRunner.js` | `BareMetal.TestRunner` | In-browser test runner (describe/it/expect, mocks, DOM helpers, TAP output) |
| `BareMetal.DragDrop.js` | `BareMetal.DragDrop` | Pointer-event drag & drop (sortable, drop zones, constraints, touch) |
| `BareMetal.A11y.js` | `BareMetal.A11y` | Accessibility (focus traps, live regions, skip links, roving tabindex, keyboard nav) |
| `BareMetal.Expressions.js` | `BareMetal.Expressions` | 50+ pre-built regex patterns (email, phone, URL, postal, credit card, UUID, etc.) |
| `BareMetal.Tokens.js` | `BareMetal.Tokens` | JWT create/sign/verify/decode (HS256/384/512, RS256, ES256, Web Crypto) |
| `BareMetal.Codes.js` | `BareMetal.Codes` | Reference data (countries, currencies, languages, timezones, HTTP, MIME, colours, cards, units) |
| `BareMetal.RBAC.js` | `BareMetal.RBAC` | Client-side RBAC (reads JWT, checks roles/groups/permissions, DOM attrs) |
| `BareMetal.Workflow.js` | `BareMetal.Workflow` | Workflow engine (SET/IF/FOR/FOREACH/FOREACHP/WEB/LOAD/SAVE + designer) |
| `BareMetal.Markdown.js` | `BareMetal.Markdown` | GFM Markdown-to-HTML renderer (render, toc, frontMatter, sanitize) |
| `BareMetal.PicoScript.js` | `BareMetal.PicoScript` | Protocol compiler: BASIC DSL → bytecode → CFG. Event dispatch, EMIT/PEEK, safety rails, trace |
| `BareMetal.PicoScript.Editor.js` | `BareMetal.PicoScript.Editor` | 4-pane protocol compiler IDE (source/IR/CFG/trace) |
| `BareMetal.Clipboard.js` | `BareMetal.Clipboard` | Clipboard API: read/write/paste intercept/legacy fallback |
| `BareMetal.FileIO.js` | `BareMetal.FileIO` | File System Access, pick/save/drop/chunk/download |
| `BareMetal.Notify.js` | `BareMetal.Notify` | Toast/banner queue + Notification API + progress |
| `BareMetal.PubSub.js` | `BareMetal.PubSub` | Event bus: wildcards, namespaces, replay, request/response |
| `BareMetal.UndoRedo.js` | `BareMetal.UndoRedo` | Command-pattern undo/redo, grouping, snapshots, key binding |
| `BareMetal.IDB.js` | `BareMetal.IDB` | Promise-based IndexedDB (CRUD, ranges, cursors, KV mode) |
| `BareMetal.Workers.js` | `BareMetal.Workers` | Inline worker pool + scheduler (debounce/throttle/RAF/idle/priority) |
| `BareMetal.Geo.js` | `BareMetal.Geo` | Geolocation, Haversine, geohash, point-in-polygon, tracking, geocoding |
| `BareMetal.Media.js` | `BareMetal.Media` | Camera/mic/screen capture, MediaRecorder, snapshot, PiP, audio analyser |
| `BareMetal.Pay.js` | `BareMetal.Pay` | Payment Request API, cart, Luhn validation, currency formatting |
| `BareMetal.Observe.js` | `BareMetal.Observe` | Resize/Intersection/Mutation observers, lazy-load, infinite scroll, breakpoints |
| `BareMetal.Speech.js` | `BareMetal.Speech` | Web Speech API: synthesis, recognition, commands, dictation |
| `BareMetal.Gamepad.js` | `BareMetal.Gamepad` | Gamepad API: polling, deadzone, haptics, combos, Xbox/PS profiles |
| `BareMetal.Forms.js` | `BareMetal.Forms` | Declarative forms: validation, masks, wizards, repeaters, autosave, conditional |
| `BareMetal.Transport.js` | `BareMetal.Transport` | Retry/backoff, dedup, coalesce, AbortSignal, circuit breaker, rate limit, queue |
| `BareMetal.Errors.js` | `BareMetal.Errors` | Typed errors: classify, chain, match routing, serialisation, boundaries |
| `BareMetal.Schema.js` | `BareMetal.Schema` | Schema validation/transform, coercion, versioning, Binary wireType alignment |
| `BareMetal.Sync.js` | `BareMetal.Sync` | Diff/patch, merge strategies, conflict resolution, CRDTs, offline queue |
| `BareMetal.URL.js` | `BareMetal.URL` | URL parse/build, query encode/decode, route params, normalize, slugify |
| `BareMetal.Capabilities.js` | `BareMetal.Capabilities` | Feature detection, env profiling, permissions, degradation, scoring |
| `BareMetal.Session.js` | `BareMetal.Session` | Session lifecycle, token rotation, multi-tab sync, activity tracking |
| `BareMetal.Cache.js` | `BareMetal.Cache` | TTL, SWR, LRU, tag invalidation, tiered cache, memoize, stats |
| `BareMetal.Pipeline.js` | `BareMetal.Pipeline` | Async pipelines, stream transforms, backpressure, cancellation |
| `BareMetal.Diagnostics.js` | `BareMetal.Diagnostics` | Trace spans, timeline, perf marks, counters, gauges, auto-hook |
| `BareMetal.Config.js` | `BareMetal.Config` | Layered config, schema validation, scopes, overrides, env import/export |
| `BareMetal.Types.js` | `BareMetal.Types` | Runtime types: registry, contracts, guards, unions, reflection, serialize |
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
