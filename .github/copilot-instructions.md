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

This is a collection of independent vanilla-JS IIFE modules designed to work without a bundler. Each `src/*.js` file is a self-contained `const ModuleName = (() => {...})()` that attaches to global scope when loaded via `<script>`. ESM wrappers in `esm/` re-export for Node/bundler use.

**Module dependency graph (only these matter for load order):**

- `BareMetalRendering` → depends on `BareMetalBind`, `BareMetalRest`, `BareMetalTemplate`
- `BareMetalRest` → depends on `BareMetalBinary`; optionally uses `PicoCompress`
- `BareMetalBind.chatEndpoint()` → depends on `BareMetalRest`
- `BareMetalRouting`, `BareMetalCharts`, `BareMetalGraph`, `BareMetalStyles.css` → fully standalone

## Key Conventions

### Module pattern

Every JS module follows the same IIFE structure:

```js
const ModuleName = (() => {
  'use strict';
  // ... implementation ...
  return { publicApi };
})();
```

Do not convert to ES modules or classes. The ESM wrappers in `esm/` simply re-export the IIFE result.

### Test pattern

Tests load source via `fs.readFileSync` + `new Function(...)` to execute the IIFE in a fresh jsdom context per suite. This avoids Node module caching and allows injecting mocks for `document`, `fetch`, `window`, etc. Follow this pattern for new tests:

```js
function loadModule() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const iife = code.replace(/const ModuleName\s*=\s*/, '').replace(/;\s*$/, '');
  return new Function('document', 'fetch', `return (${iife});`)(global.document, mockFetch);
}
```

### No dependencies

The library has zero runtime dependencies. `jest` and `jest-environment-jsdom` are the only dev dependencies. Do not add frameworks, transpilers, or bundlers.

### Reactive binding directives

`BareMetalBind` uses `m-*` HTML attributes (e.g., `m-value`, `m-text`, `m-each`, `m-if`). When adding or modifying directives, register them in the directive processing switch inside `BareMetalBind.js` and add corresponding tests.

### CSS module

`BareMetalStyles.css` is a standalone Bootstrap-5-compatible subset. It has no JS and no preprocessor — edit the CSS directly.
