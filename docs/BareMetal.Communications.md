# BareMetal.Communications

> REST, WebSocket, binary, and WAL client for BareMetalWeb APIs.

**Size:** 19.02 KB source / 8.29 KB minified  
**Dependencies:** `BareMetal.Binary` required for binary mode; `BareMetal.Compress` optional for request/response compression

## Quick Start

```html
<script src="BareMetal.Binary.min.js"></script>
<script src="BareMetal.Communications.min.js"></script>
<script>
  (async () => {
    BareMetal.Communications.setRoot('/api/');
    await BareMetal.Communications.init();

    const orders = BareMetal.Communications.entity('orders');
    const result = await orders.list();
    console.log(result);
  })();
</script>
```

## API Reference

### `setRoot(root)` → `void`

Sets the API root used by `entity()` and `ensureBinary()`. A trailing slash is added automatically.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| root | string | — | Base API path such as `/api/` |

**Example:**
```js
BareMetal.Communications.setRoot('/v2/api');
console.log(BareMetal.Communications.getRoot()); // /v2/api/
```

### `getRoot()` → `string`

Returns the current API root.

**Example:**
```js
const apiRoot = BareMetal.Communications.getRoot();
```

### `init()` → `Promise<void>`

Fetches `/bmw/routes` and `/bmw/protocol`, then attempts to connect the BMW WebSocket transport.

**Example:**
```js
await BareMetal.Communications.init();
if (BareMetal.Communications.isWsReady()) {
  console.log('BMW WebSocket transport is ready');
}
```

### `call(method, url, body)` → `Promise<object|null>`

Performs a JSON request with CSRF/header handling and automatic 401 redirect to `/login?returnUrl=...`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| method | string | — | HTTP verb |
| url | string | — | Absolute or relative request URL |
| body | object\|FormData | — | JSON body or `FormData` |

**Example:**
```js
const profile = await BareMetal.Communications.call('GET', '/api/profile');
await BareMetal.Communications.call('POST', '/api/profile', {
  displayName: 'Ada Lovelace'
});
```

### `entity(slug)` → `entityClient`

Creates a CRUD client for one entity slug.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| slug | string | — | Entity name such as `users` or `orders` |

**Example:**
```js
const users = BareMetal.Communications.entity('users');
const user = await users.get(42);
```

#### `entityClient.list(query)` → `Promise<object>`
Lists records. If binary mode is available it returns `{ data, count: -1 }`; JSON fallback returns the server JSON as-is.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| query | object | — | Query object converted with `URLSearchParams` |

#### `entityClient.get(id)` → `Promise<object|null>`
Fetches a single record.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | string\|number | — | Record identifier |

#### `entityClient.create(data)` → `Promise<object>`
Creates a record.

#### `entityClient.update(id, data)` → `Promise<object>`
Replaces a record.

#### `entityClient.remove(id)` → `Promise<object|null>`
Deletes a record.

#### `entityClient.delta(id, changes, expectedVersion = 0)` → `Promise<object>`
Sends partial changes through the binary delta endpoint when available, otherwise falls back to `PUT`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | string\|number | — | Record identifier |
| changes | object | — | Partial field map |
| expectedVersion | number | `0` | Concurrency/version hint for the JSON delta route |

#### `entityClient.deltaFromTracker(tracker)` → `Promise<object>`
Builds and submits a binary delta from a `BareMetal.Binary.createTracker()` result.

#### `entityClient.metadata()` → `Promise<object>`
Fetches `GET {root}metadata/{slug}`.

**Example:**
```js
const orders = BareMetal.Communications.entity('orders');
await orders.create({ customerId: 7, total: 149.95 });
await orders.delta(12, { status: 'Shipped' }, 3);
```

### `byId(routeId, options)` → `Promise<object|null>`

Calls a numeric route directly.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| routeId | string\|number | — | Numeric route id |
| options | object | `{}` | `{ method, body }` |

**Example:**
```js
await BareMetal.Communications.byId(105, {
  method: 'POST',
  body: { q: 'active' }
});
```

### `resolveRouteId(verb, path)` → `number|null`

Looks up a numeric BMW route id after `init()` has loaded the route table.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| verb | string | — | HTTP verb |
| path | string | — | Route pattern such as `/api/orders/{id}` |

**Example:**
```js
await BareMetal.Communications.init();
const routeId = BareMetal.Communications.resolveRouteId('GET', '/api/orders/{id}');
```

### `connectWs(url)` → `Promise<void>`

Connects the BMW WebSocket transport. If no URL is supplied it derives one from `location` and uses `/bmw/ws`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | auto | WebSocket endpoint |

**Example:**
```js
await BareMetal.Communications.connectWs('wss://example.com/bmw/ws');
```

### `isWsReady()` → `boolean`

Returns `true` when the WebSocket transport is connected.

### `ensureBinary()` → `Promise<void>`

Fetches `{root}_binary/_key` and primes `BareMetal.Binary` with the signing key.

**Example:**
```js
await BareMetal.Communications.ensureBinary();
console.log(BareMetal.Communications.isBinaryAvailable());
```

### `isBinaryAvailable()` → `boolean`

Returns `true` after `ensureBinary()` succeeds and `BareMetal.Binary` is loaded.

### `walStream(entityName)` → `Promise<{ records: (ArrayBuffer|null)[], complete: boolean }>`

Fetches and parses `/bmw/wal/stream?entity=...`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| entityName | string | — | Entity slug to stream |

**Example:**
```js
const wal = await BareMetal.Communications.walStream('orders');
for (const record of wal.records) {
  if (record) console.log('BSO1 payload bytes', record.byteLength);
}
```

### `walStreamAll()` → `Promise<{ records: (ArrayBuffer|null)[], complete: boolean }>`

Fetches the combined WAL stream for all entities.

### `setCompression(options)` → `object`

Enables or updates BareMetal.Compress integration.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Compression settings to merge into the current config |

**Example:**
```js
BareMetal.Communications.setCompression({
  enabled: true,
  profile: 'balanced',
  minSize: 512
});
```

### `getCompression()` → `object`

Returns a copy of the current compression settings.

## Configuration / Options

### Compression options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| enabled | boolean | `false` | Turns compression support on |
| profile | string | `'balanced'` | Passed to `BareMetal.Compress.compress()` |
| minSize | number | `256` | Only compress payloads at or above this byte size |

## Examples

### Example 1: CRUD client with metadata
```html
<script src="BareMetal.Binary.min.js"></script>
<script src="BareMetal.Communications.min.js"></script>
<script>
  (async () => {
    BareMetal.Communications.setRoot('/api/');

    const products = BareMetal.Communications.entity('products');
    const metadata = await products.metadata();
    const list = await products.list({ page: 1, pageSize: 20 });

    console.log(metadata, list);
  })();
</script>
```

### Example 2: Binary delta update
```js
await BareMetal.Communications.ensureBinary();
const orders = BareMetal.Communications.entity('orders');
const layout = await BareMetal.Binary.fetchLayout('orders');
const tracker = BareMetal.Binary.createTracker(await orders.get(42), layout);

tracker.entity.Status = 'Packed';
tracker.entity.Notes = 'Ready for courier';

await orders.deltaFromTracker(tracker);
```

## Notes
- 401 responses redirect the browser to `/login?returnUrl=...`.
- Binary and WebSocket paths are opportunistic; JSON/HTTP remains the fallback.
- `walStream()` records are raw BSO1 payloads or `null` tombstones.
- Compression only applies when `BareMetal.Compress` is loaded and produces a smaller payload.
