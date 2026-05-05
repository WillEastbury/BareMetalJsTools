# BareMetal.ServiceWorker

> Configurable service worker with runtime caching, offline fallback, background sync, and push notifications.

**Size:** 7.6 KB source / 4.1 KB minified  
**Dependencies:** None

## Quick Start

> This file is registered as a service worker; it is not loaded with a normal page-level `<script src>` tag.

```html
<script>
async function sendToWorker(message) {
  await navigator.serviceWorker.register('/BareMetal.ServiceWorker.min.js');
  var readyReg = await navigator.serviceWorker.ready;

  return new Promise(function (resolve, reject) {
    var worker = readyReg.active || navigator.serviceWorker.controller;
    if (!worker) return reject(new Error('No active service worker'));

    var channel = new MessageChannel();
    channel.port1.onmessage = function (event) { resolve(event.data); };
    worker.postMessage(message, [channel.port2]);
  });
}

sendToWorker({
  type: 'BM_PRECACHE',
  urls: ['/', '/app.css', '/app.js']
});
</script>
```

## API Reference

### `BM_PRECACHE` → `{ ok: true }`

Adds a list of URLs to the `bm-precache` cache.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Must be `'BM_PRECACHE'` |
| `urls` | string[] | `[]` | URLs to cache |

**Example:**
```js
sendToWorker({ type: 'BM_PRECACHE', urls: ['/', '/offline.json'] });
```

### `BM_CLEAR_CACHE` → `{ ok: true }`

Deletes one cache by name, or all `bm-*` caches when `cacheName` is omitted.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Must be `'BM_CLEAR_CACHE'` |
| `cacheName` | string \| null | `null` | Specific cache to clear |

**Example:**
```js
sendToWorker({ type: 'BM_CLEAR_CACHE', cacheName: 'bm-images' });
```

### `BM_CACHE_STATUS` → `{ caches, totalSize }`

Returns the list of cache names managed by this worker.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Must be `'BM_CACHE_STATUS'` |

**Example:**
```js
sendToWorker({ type: 'BM_CACHE_STATUS' }).then(console.log);
```

### `BM_SET_ROUTES` → `{ ok: true }`

Replaces the runtime route table used by the `fetch` handler.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Must be `'BM_SET_ROUTES'` |
| `routes` | object[] | — | Array of route descriptors |

**Example:**
```js
sendToWorker({
  type: 'BM_SET_ROUTES',
  routes: [
    { match: '\\.(css|js)$', strategy: 'cacheFirst', cacheName: 'bm-static' },
    { match: '\\.(png|jpg|webp)$', strategy: 'staleWhileRevalidate', cacheName: 'bm-images' },
    { match: '.', strategy: 'networkFirst', cacheName: 'bm-pages' }
  ]
});
```

### `BM_SKIP_WAITING` → `{ ok: true }`

Calls `skipWaiting()` so an updated worker can activate immediately.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Must be `'BM_SKIP_WAITING'` |

**Example:**
```js
sendToWorker({ type: 'BM_SKIP_WAITING' });
```

### `BM_SET_OFFLINE_PAGE` → `{ ok: true }`

Overrides the built-in offline HTML returned when requests fail.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Must be `'BM_SET_OFFLINE_PAGE'` |
| `html` | string | — | Full HTML string for the offline response |

**Example:**
```js
sendToWorker({
  type: 'BM_SET_OFFLINE_PAGE',
  html: '<!doctype html><h1>Offline</h1><p>Please reconnect.</p>'
});
```

### `cacheFirst(request, cacheName)` → `Promise<Response>`

Serves a cached response first, then fetches and stores it on a miss.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| request | Request | — | Incoming request |
| cacheName | string | — | Cache bucket to use |

**Example:**
```js
// Used by default for CSS, JS, and font files.
```

### `networkFirst(request, cacheName)` → `Promise<Response|undefined>`

Fetches from the network first and falls back to cache if the request fails.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| request | Request | — | Incoming request |
| cacheName | string | — | Cache bucket to use |

**Example:**
```js
// Used by default for page navigations.
```

### `staleWhileRevalidate(request, cacheName)` → `Promise<Response>`

Returns a cached response immediately when present, while refreshing it in the background.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| request | Request | — | Incoming request |
| cacheName | string | — | Cache bucket to use |

**Example:**
```js
// Good for images or API read models that can tolerate slightly stale data.
```

### `networkOnly(request)` → `Promise<Response>`

Always fetches from the network and never caches the response.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| request | Request | — | Incoming request |

**Example:**
```js
// Default for /api/ routes.
```

### `cacheOnly(request, cacheName)` → `Promise<Response|undefined>`

Looks only in cache and never hits the network.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| request | Request | — | Incoming request |
| cacheName | string | — | Cache bucket to use |

**Example:**
```js
// Useful for explicit offline-only assets.
```

## Configuration / Options

### Default routes

| Match | Strategy | Cache |
|------|----------|-------|
| `\.(css|js|woff2?)$` | `cacheFirst` | `bm-static` |
| `/\/api\//` | `networkOnly` | `bm-api` |
| `\.(png|jpg|svg|gif|webp)$` | `cacheFirst` | `bm-images` |
| `/.*/` | `networkFirst` | `bm-pages` |

### `BM_SET_ROUTES` route shape

| Field | Type | Description |
|-------|------|-------------|
| `match` | string \| RegExp | Pattern tested against `event.request.url` |
| `strategy` | string | One of `cacheFirst`, `networkFirst`, `staleWhileRevalidate`, `networkOnly`, `cacheOnly` |
| `cacheName` | string | Cache bucket name |

## Examples

### Example 1: Custom route table
```html
<script>
sendToWorker({
  type: 'BM_SET_ROUTES',
  routes: [
    { match: '\\.(css|js|woff2?)$', strategy: 'cacheFirst', cacheName: 'bm-static' },
    { match: '/api/reports', strategy: 'networkFirst', cacheName: 'bm-report-cache' },
    { match: '\\.(png|jpg|svg|webp)$', strategy: 'staleWhileRevalidate', cacheName: 'bm-images' },
    { match: '.', strategy: 'networkFirst', cacheName: 'bm-pages' }
  ]
});
</script>
```

### Example 2: Custom offline page and immediate activation
```js
Promise.all([
  sendToWorker({
    type: 'BM_SET_OFFLINE_PAGE',
    html: '<!doctype html><html><body><h1>Offline</h1><p>Retry when your connection returns.</p></body></html>'
  }),
  sendToWorker({ type: 'BM_SKIP_WAITING' })
]);
```

## Notes
- Only `GET` requests are intercepted by the fetch handler.
- Cache buckets are trimmed to **100 entries** each.
- On activation, old `bm-*` caches not referenced by the current route table are deleted.
- Background Sync posts `{ type: 'BM_SYNC', tag }` to all controlled clients.
- Push payloads are read as JSON and passed to `showNotification(title, { body, icon, badge, data })`.
- Notification clicks focus the first existing window client or open `'/'`.
- `BM_CACHE_STATUS.totalSize` is currently always `0`; only cache names are reported.
