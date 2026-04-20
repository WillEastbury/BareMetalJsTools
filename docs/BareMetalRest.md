# BareMetalRest

REST + WebSocket binary transport for BareMetalWeb-shaped APIs. Negotiates, in order:

1. **BMW WebSocket** — 6-byte frame (opcode + entity id) + length-prefixed payload, multiplexed by request id.
2. **BSO1 binary** — when `BareMetalBinary` is loaded and the server responds with binary content type.
3. **JSON** — universal fallback.

Handles 401 → redirect to `/login`, CSRF header, FormData, query params, and entity CRUD.

## Setup

```js
BareMetalRest.setRoot('/api/');           // base URL for all calls
await BareMetalRest.init();               // optional — fetches route table & connects WS
```

`init()` is optional. Without it, calls fall back to verbose URL paths and JSON.

## Generic call

```js
const obj = await BareMetalRest.call('GET',  '/customer/42');
const out = await BareMetalRest.call('POST', '/customer', { name: 'Acme' });
```

## Entity helper

```js
const customer = BareMetalRest.entity('customer');
await customer.list();                  // GET /customer
await customer.list({ q: 'Acme' });     // GET /customer?q=Acme
await customer.get(42);                 // GET /customer/42
await customer.create({ name: 'A' });   // POST /customer
await customer.update(42, { … });       // PUT  /customer/42
await customer.remove(42);              // DELETE /customer/42
await customer.metadata();              // GET /customer/$meta
await customer.delta(42, changes, expectedVersion);
await customer.deltaFromTracker(tracker);
```

## WebSocket transport

```js
await BareMetalRest.connectWs();
BareMetalRest.isWsReady();   // true
```

When connected, `entity().list/get/create/update/remove` automatically use WS; failures fall back to HTTP.

## WAL streaming

```js
const stream = await BareMetalRest.walStream('customer');   // since current LSN
for (const record of stream.records) { … }
const all = await BareMetalRest.walStreamAll();             // all entities
```

Wire format: `[count:uint32 LE]` then per record `[length:uint32 LE] [payload bytes]`. A length of 0 = tombstone.

## Public API

| Member | Purpose |
|---|---|
| `setRoot(url)` / `getRoot()`     | Configure base URL. |
| `entity(slug)`                   | CRUD façade. |
| `call(method, url, body)`        | Generic typed call. |
| `init()` / `ensureBinary()`      | Negotiate route table + WS + BSO1. |
| `byId(routeId, opts)`            | Numeric route dispatch (post-`init`). |
| `resolveRouteId(verb, path)`     | Look up numeric id for a verb/path. |
| `connectWs()` / `isWsReady()`    | Manage WS transport. |
| `walStream(slug)` / `walStreamAll()` | Stream WAL records. |
| `isBinaryAvailable()`            | Whether BSO1 path is active. |
| `setCompression(opts)` / `getCompression()` | Configure picocompress wire compression (`{ enabled, profile, minSize }`). |

## Compression (picocompress)

When `picocompress.js` is loaded alongside `BareMetalRest.js`, opt-in wire compression is available:

```js
BareMetalRest.setCompression({ enabled: true, profile: 'balanced', minSize: 256 });
```

* Outgoing request bodies ≥ `minSize` bytes are compressed and sent with `Content-Encoding: picocompress`.
* `Accept-Encoding: picocompress` is added to all requests so the server can compress responses too.
* If compression doesn't reduce size, the body is sent uncompressed (no overhead).
* Server must support the picocompress format (C, C#, Go, Rust, Python, Java ports available at [WillEastbury/picocompress](https://github.com/WillEastbury/picocompress)).

## Notes

* `Binary` and `WebSocket` features are graceful — if `BareMetalBinary` isn't loaded, JSON is used. If the server has no `/bmw/ws`, HTTP is used.
* On 401, the page is redirected to `/login?return=<current>`. Override by monkey-patching `BareMetalRest.call` if needed.
