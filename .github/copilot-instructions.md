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
| `BareMetalStyles.css` | — | Bootstrap-5-compatible CSS subset |

**Dependency graph (load order matters):**

- `BareMetal.Components` → depends on `BareMetal.Bind`
- `BareMetal.ComponentFactories` → soft deps on `BareMetal.Bind`, `BareMetal.Communications`
- `BareMetal.Rendering` → depends on `BareMetal.Communications`, `BareMetal.Bind`, `BareMetal.Template`
- `BareMetal.Communications` → depends on `BareMetal.Binary`; optionally uses `BareMetal.Compress`
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

`BareMetalStyles.css` is a standalone Bootstrap-5-compatible subset. No JS, no preprocessor.
