# BareMetalJsTools

> *164 KB minified for a complete reactive UI framework, CSS toolkit, binary serialisation, compression, REST+WebSocket transport, OAuth/OIDC auth, crypto, offline-first PWA, routing, charting, and graph visualisation. Most people pull in more than that just for a toast notification library.*

Modern web development has become absurdly complicated. You need a bundler, a transpiler, a framework, a meta-framework, a state manager, a CSS-in-JS solution, and forty-seven config files before you can render "Hello World". Then you wait for it to compile.

**This toolkit takes a different approach: just host some damn files.**

BareMetalJsTools is a collection of tiny, zero-dependency vanilla-JS modules that give you reactive UI, REST transport, SPA routing, charts, and a full CSS framework — all as plain `<script>` tags. No build step. No compile phase. No node_modules black hole. Save your file, refresh your browser, and get on with your life.

Every module follows the same pattern: small, obvious, fast. You can read the source in one sitting. You can understand what it does without a tutorial series. And because there's nothing to build, your deploy is just... serving files. *How* you serve them matters — cache headers, compression, CDN — but the point is your toolchain stays out of your way.

> Extracted from [BareMetalWeb](https://github.com/WillEastbury/BareMetalWeb) and maintained separately so each piece can be reused, evolved, and tested in isolation.

---

## The BareMetal family

This toolkit doesn't exist in isolation. The same "strip away the nonsense" philosophy runs through the entire stack:

| Project | What it is |
|---|---|
| [**BareMetalJsTools**](https://github.com/WillEastbury/BareMetalJsTools) | This repo. Reactive UI, REST transport, SPA routing, charts, CSS framework — all as plain `<script>` tags. This is what happens when you apply the philosophy to *the browser*. |
| [**BareMetalWeb**](https://github.com/WillEastbury/BareMetalWeb) | The web server and application framework this toolkit was extracted from. A minimal, metadata-driven .NET web host that serves these JS modules and renders server-driven UI — absolute lightning, but it's the only component in the stack that won't run on a tiny RPi Pico 2W. C port incoming. |
| [**PicoWAL**](https://github.com/WillEastbury/PicoWAL) | A write-ahead-log database engine built from scratch. Binary schema cards, Pack-0 wire format, embedded storage — no ORM, no query planner committee meetings. This is what happens when you apply it to the *database*. |
| [**picocompress**](https://github.com/WillEastbury/picocompress) | Block-based LZ compression in pure C and JS (byte-identical output). Integrated into `BareMetal.Rest` for opt-in wire compression. This is what happens when you apply it to *data on the wire*. |
| [**RP2350B_Bitnet**](https://github.com/WillEastbury/RP2350B_Bitnet) | A 1-bit quantised SLM that runs on a Raspberry Pi Pico 2 with 512 KB of RAM. This is what happens when you apply it to *machine learning* — and refuse to accept that "AI" requires a data centre, or a GPU, or even a proper desktop or laptop computer. |
| [**PiOS**](https://github.com/WillEastbury/PiOS) | A bare-metal operating system for the Pi 5. This is what happens when you apply it to *the OS itself*. Requires Pi 5 for now — but if we can get it small enough, who knows. |

The whole point is the same everywhere: understand what the machine actually needs to do, throw away everything that doesn't serve that goal, and keep the result small enough that one person can hold the entire system in their head.

---

## What's in the box

| Module | What it does | Source | Min | Nearest equivalent for the not-quite-insane |
|---|---|---|---|---|
| [`BareMetal.Styles`](docs/BareMetalStyles.md) | CSS framework. Grid, flex, buttons, forms, tables, cards, modals, alerts, toasts — all with short class names optimised for wire size. Zero JS. | [58 KB](src/BareMetalStyles.css) | [42 KB](src/BareMetalStyles.min.css) | *Bootstrap (227 KB)*, Tailwind (≈300 KB+), Fabric UI (≈350 KB), React (≈140 KB) |
| [`BareMetal.Styles.BootstrapCompatibilityShim`](src/BareMetal.Styles.BootstrapCompatibilityShim.css) | Drop-in Bootstrap 5 class-name compatibility. Use standard Bootstrap classes (`.btn`, `.card`, `.row`, `.col-md-6`, etc.) without loading Bootstrap itself. Optional — only needed if migrating from Bootstrap. | [29 KB](src/BareMetal.Styles.BootstrapCompatibilityShim.css) | [24 KB](src/BareMetal.Styles.BootstrapCompatibilityShim.min.css) | *Bootstrap 5 (227 KB)* — this replaces it at 1/9th the size |
| [`BareMetal.Bind`](docs/BareMetalBind.md) | Reactive `Proxy` state + `m-*` directives. Two-way forms, lists, toasts, chatbot, calendar, Gantt charts, sortable tables, tree views. | [13 KB](src/BareMetal.Bind.js) | [6 KB](src/BareMetal.Bind.min.js) | Vue.js (≈40 KB min), Alpine.js (≈15 KB), Rivets.js ❤️, *Knockout.js ❤️*, TinyBind 💕 |
| [`BareMetal.Components`](docs/BareMetalBind.md) | Widget directives (m-img, m-toast, m-chatbot, m-calendar, m-gantt, m-table, m-tree, m-entity) that extend Bind. | [25 KB](src/BareMetal.Components.js) | [13 KB](src/BareMetal.Components.min.js) | PrimeVue, Vuetify, Material UI (hundreds of KB each) |
| [`BareMetal.ComponentFactories`](docs/BareMetalBind.md) | `create.*` helpers and `chatEndpoint()` auto-wire for REST-backed chatbots. | [2 KB](src/BareMetal.ComponentFactories.js) | [1 KB](src/BareMetal.ComponentFactories.min.js) | *Hand-rolled boilerplate* |
| [`BareMetal.Template`](docs/BareMetalTemplate.md) | Schema-driven DOM builder. Hand it metadata, get a form or table back. | [7 KB](src/BareMetal.Template.js) | [4 KB](src/BareMetal.Template.min.js) | Formly (≈80 KB), *JSON Forms (≈200 KB)* |
| [`BareMetal.Metadata`](docs/BareMetalMetadata.md) | Client-side entity schema registry. Inline JSON, server fetch, or PicoWAL binary — declare your entities and render them automatically. | [8 KB](src/BareMetal.Metadata.js) | [4 KB](src/BareMetal.Metadata.min.js) | *GraphQL schema* + codegen toolchain |
| [`BareMetal.Communications`](docs/BareMetalRest.md) | REST + WebSocket transport. Negotiates WS binary frames → BSO1 → JSON fallback. CSRF, 401-redirect, request multiplexing. | [19 KB](src/BareMetal.Communications.js) | [8 KB](src/BareMetal.Communications.min.js) | Axios (≈14 KB) + *socket.io-client* (≈45 KB) |
| [`BareMetal.Binary`](docs/BareMetalBinary.md) | BSO1 binary wire serialiser. Zero-copy `DataView` reads, HMAC-SHA256 signing via Web Crypto. | [23 KB](src/BareMetal.Binary.js) | [14 KB](src/BareMetal.Binary.min.js) | Protocol Buffers JS (≈230 KB), *MessagePack (≈25 KB)* |
| [`BareMetal.Compress`](docs/PicoCompress.md) | Block-based LZ compressor. Byte-identical to the [C reference](https://github.com/WillEastbury/picocompress). Opt-in wire compression for Rest. | [19 KB](src/BareMetal.Compress.js) | [8 KB](src/BareMetal.Compress.min.js) | Brotli.js (≈300 KB), *HeatShrink (≈8 KB)* |
| [`BareMetal.Rendering`](docs/BareMetalRendering.md) | Glue layer — wires Rest + Bind + Template into an entity lifecycle (`createEntity`, `listEntities`). | [4 KB](src/BareMetal.Rendering.js) | [1 KB](src/BareMetal.Rendering.min.js) | *Custom Redux middleware* + React container layer |
| [`BareMetal.Routing`](docs/BareMetalRouting.md) | History-API SPA router. Named segments (`:param`), catch-all (`*`), query parsing. | [7 KB](src/BareMetal.Routing.js) | [2 KB](src/BareMetal.Routing.min.js) | *vue-router (≈18 KB)*, react-router (≈30 KB) |
| [`BareMetal.Charts`](docs/BareMetalCharts.md) | SVG charts — bar, line, sparkline, donut, gauge. Animated, themeable via CSS custom properties. | [16 KB](src/BareMetal.Charts.js) | [8 KB](src/BareMetal.Charts.min.js) | *Chart.js (≈200 KB)*, D3 (≈250 KB) |
| [`BareMetal.Graph`](docs/BareMetalGraph.md) | Force-directed graph visualiser. Drag, zoom, hover, dynamic add/remove. | [18 KB](src/BareMetal.Graph.js) | [9 KB](src/BareMetal.Graph.min.js) | D3-force (≈30 KB) + D3-selection (≈20 KB), *Cytoscape.js* (≈600 KB) |
| [`BareMetal.Auth`](src/BareMetal.Auth.js) | OIDC/OAuth2 PKCE client. Silent refresh, provider presets (Google, Microsoft, GitHub, Apple, Facebook), login/whoami UI components. | [28 KB](src/BareMetal.Auth.js) | [16 KB](src/BareMetal.Auth.min.js) | *oidc-client-ts (≈80 KB)*, Auth0 SPA SDK (≈60 KB) |
| [`BareMetal.Crypto`](src/BareMetal.Crypto.js) | Web Crypto wrapper. AES-256-GCM symmetric, RSA-OAEP hybrid envelope, ECDSA P-256 signing, PBKDF2 key derivation. | [5 KB](src/BareMetal.Crypto.js) | [3 KB](src/BareMetal.Crypto.min.js) | *Stanford JS Crypto (≈45 KB)*, tweetnacl (≈7 KB) |
| [`BareMetal.LocalKVStore`](src/BareMetal.LocalKVStore.js) | Key-value store abstraction. localStorage, sessionStorage, IndexedDB backends with TTL, namespacing, cross-tab sync. | [14 KB](src/BareMetal.LocalKVStore.js) | [7 KB](src/BareMetal.LocalKVStore.min.js) | *localForage (≈29 KB)*, idb-keyval (≈1 KB) |
| [`BareMetal.Progressive`](src/BareMetal.Progressive.js) | PWA helper. Service worker registration, install prompts, offline request queue, push notifications, manifest generation. | [10 KB](src/BareMetal.Progressive.js) | [5 KB](src/BareMetal.Progressive.min.js) | *Workbox (≈60 KB)*, PWA Builder |
| [`BareMetal.ServiceWorker`](src/BareMetal.ServiceWorker.js) | Configurable service worker. CacheFirst, NetworkFirst, StaleWhileRevalidate strategies, precache, background sync. | [7 KB](src/BareMetal.ServiceWorker.js) | [4 KB](src/BareMetal.ServiceWorker.min.js) | *Workbox SW (≈15 KB)* |
| [`BareMetal.Time`](src/BareMetal.Time.js) | Date/time library. Format, parse, add/subtract, diff, durations, relative time, timezone support, Temporal API bridge. | [12 KB](src/BareMetal.Time.js) | [7 KB](src/BareMetal.Time.min.js) | *Day.js (≈7 KB)*, date-fns (≈75 KB), Moment.js (≈290 KB) |
| **Total** | **The whole toolkit** | **≈292 KB** | **≈164 KB** | **≈1,862 KB** (picking the smaller option from each row) |

### Architecture

```mermaid
graph TB
  subgraph "Presentation"
    Styles["🎨 Styles<br/><i>Grid · Buttons · Cards<br/>Modals · Toasts · Layout</i>"]
    Charts["📊 Charts<br/><i>Bar · Line · Sparkline<br/>Donut · Gauge</i>"]
    Graph["🕸️ Graph<br/><i>Force-directed<br/>Drag · Zoom</i>"]
  end

  subgraph "Reactive Binding"
    Bind["⚡ Bind + Components<br/><i>Proxy state · m-* directives</i>"]
    Factories["🏭 Factories<br/><i>create.* · chatEndpoint</i>"]
    Metadata["📋 Metadata<br/><i>Entity schemas · m-entity</i>"]
  end

  subgraph "Transport"
    Rest["🌐 Communications<br/><i>REST + WebSocket<br/>CSRF · Multiplexing</i>"]
    Binary["📦 Binary<br/><i>BSO1 codec · HMAC</i>"]
    Compress["🗜️ Compress<br/><i>LZ compression</i>"]
  end

  subgraph "Orchestration"
    Rendering["🔧 Rendering<br/><i>Entity lifecycle</i>"]
    Template["📝 Template<br/><i>buildForm · buildTable</i>"]
    Routing["🧭 Routing<br/><i>SPA router</i>"]
  end

  subgraph "Security & Auth"
    Auth["🔐 Auth<br/><i>OIDC · PKCE · Providers</i>"]
    Crypto["🔑 Crypto<br/><i>AES · RSA · ECDSA</i>"]
  end

  subgraph "Offline & PWA"
    Progressive["📱 Progressive<br/><i>SW reg · Install · Push</i>"]
    ServiceWorker["⚙️ ServiceWorker<br/><i>Cache strategies · Sync</i>"]
    KVStore["💾 LocalKVStore<br/><i>KV · TTL · IndexedDB</i>"]
    Time["🕐 Time<br/><i>Format · Relative · TZ</i>"]
  end

  Rendering --> Bind
  Rendering --> Template
  Rendering --> Rest
  Metadata --> Template
  Metadata -.-> Bind
  Metadata -.-> Rest
  Rest --> Binary
  Rest -.->|opt-in| Compress
  Factories -.-> Rest
  Bind --> Styles
  Auth -.-> Rest
  Progressive -.-> Rest
  Progressive -.-> KVStore
  Progressive --> ServiceWorker

  style Bind fill:#0d6efd,color:#fff
  style Styles fill:#198754,color:#fff
  style Rest fill:#6f42c1,color:#fff
  style Charts fill:#fd7e14,color:#fff
  style Graph fill:#d63384,color:#fff
  style Rendering fill:#495057,color:#fff
  style Metadata fill:#20c997,color:#fff
  style Auth fill:#dc3545,color:#fff
  style Crypto fill:#6610f2,color:#fff
  style Progressive fill:#0dcaf0,color:#000
  style ServiceWorker fill:#adb5bd,color:#000
  style KVStore fill:#ffc107,color:#000
  style Time fill:#198754,color:#fff
```

---

## Getting started

### Drop in the scripts

```html
<link rel="stylesheet" href="src/BareMetal.Styles.css">
<script src="src/BareMetal.Bind.js"></script>
<script src="src/BareMetal.Components.js"></script>
<!-- add whichever modules you need — order only matters where dependencies exist -->
```

That's it. No install. No config. No waiting.

### Or use npm (if you must)

```bash
npm install github:WillEastbury/BareMetalJsTools
```

---

## Quick start

### Reactive UI in five lines

```js
const { state, watch } = BareMetal.Bind.reactive({ name: 'World', items: [] });

document.body.innerHTML = `
  <input m-value="name">
  <p>Hello, <span m-text="name"></span>!</p>
`;
BareMetal.Bind.bind(document.body, state, watch);
state.name = 'BareMetal';  // UI updates instantly
```

### SPA routing

```js
BareMetal.Routing.on('/users',     () => renderList('user'));
BareMetal.Routing.on('/users/:id', ctx => renderDetail('user', ctx.params.id));
BareMetal.Routing.start();
```

### REST client

```js
BareMetal.Communications.setRoot('/api/');
const customer = BareMetal.Communications.entity('customer');
const all      = await customer.list();
await customer.update(42, { name: 'Acme' });
```

### Metadata-driven forms

```html
<script type="application/bm-meta">
{ "name": "Customer", "schema": { "fields": {
    "name":  { "type": "text", "label": "Name", "required": true },
    "email": { "type": "Email", "label": "Email" }
  }}, "layout": { "columns": 2, "fields": ["name", "email"] }}
</script>

<div m-entity="customer" m-mode="form"></div>

<script>
  BareMetal.Metadata.scanInline();
  // form is auto-rendered and bound — done.
</script>
```

---

## Tests

```bash
npm install && npm test
```

Tests run under Node + jsdom. Each module is loaded in isolation via `new Function(...)` so globals can be mocked per test.

| Suite | What's covered |
|---|---|
| Bind | `reactive()`, all `m-*` directives, dot-paths, formatters, reactive arrays, keyed diffing, transitions, expressions |
| Rest | CRUD, fetch errors, CSRF, FormData |
| Template | `buildForm` field types, layout, lookup; `buildTable` cells, callbacks, badges |
| Routing | Pattern matching, params, query parsing, `navigate()` |
| Rendering | Entity lifecycle, lookup hydration, `minibind` |
| Compress | Round-trip, profiles, `compressBound` |
| Metadata | Register, get, scanInline, type normalisation, toTemplateFields |

---

## Why this exists

Web development got complicated for no good reason. Somewhere along the way, "make a web page" turned into "configure a seventeen-stage build pipeline, wait for it to compile, debug the bundler, then discover your CSS got tree-shaken into oblivion."

BareMetalJsTools exists because we think that's insane.

* **No build step.** Save the file. Refresh the browser. Done.
* **No framework tax.** No virtual DOM diffing. The browser already has a perfectly good DOM — use it.
* **No dependencies.** Every module is plain ES2017+ that works in any modern browser, right now.
* **Pick what you need.** Use one module or all of them. They compose cleanly but don't demand each other.
* **Server-driven where it counts.** Forms and tables render from metadata — declare your schema, not your markup.
* **Wire-efficient.** Short class names, binary transport, optional LZ compression. Every byte earns its place.

The hard part isn't the JavaScript. The hard part is serving your files well — cache headers, compression, CDN placement, HTTP/2 push. Focus your energy there, not on configuring webpack.

---

## License

MIT — see [LICENSE](./LICENSE).

Extracted from [BareMetalWeb](https://github.com/WillEastbury/BareMetalWeb) and maintained here for independent reuse.
