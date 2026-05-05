# BareMetal.Progressive

> PWA helper for service worker registration, install prompts, offline request queueing, push, and manifest injection.

**Size:** 10.8 KB source / 5.7 KB minified  
**Dependencies:** Soft deps: `BareMetal.Rest` (offline queue integration), `BareMetal.LocalKVStore` (queue persistence; falls back to `localStorage`)

## Quick Start

```html
<button id="install" hidden>Install app</button>

<script src="BareMetal.Progressive.min.js"></script>
<script>
(async function () {
  await BareMetal.Progressive.register('/BareMetal.ServiceWorker.min.js', {
    scope: '/',
    onUpdate: function () {
      console.log('A new service worker is ready.');
    }
  });

  BareMetal.Progressive.onInstallPrompt(function (app) {
    var btn = document.getElementById('install');
    btn.hidden = false;
    btn.onclick = function () {
      app.prompt().then(function (result) {
        console.log('Install prompt result:', result);
      });
    };
  });

  BareMetal.Progressive.onMessage(function (msg) {
    if (msg.type === 'BM_SYNC') console.log('Background sync fired:', msg.tag);
  });
})();
</script>
```

## API Reference

### `register(swUrl, opts)` → `Promise<ServiceWorkerRegistration>`

Registers the service worker, installs update lifecycle hooks, loads any persisted offline queue, and patches `BareMetal.Rest.fetch` when that module is present.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| swUrl | string | `'/BareMetal.ServiceWorker.js'` | Service worker script URL |
| opts | object | `{}` | Registration and lifecycle options |

**Example:**
```js
BareMetal.Progressive.register('/sw.js', {
  scope: '/app/',
  onInstalled: function () { console.log('App cached for first install'); },
  onUpdate: function () { console.log('Update available'); },
  onActivated: function () { console.log('New worker activated'); },
  onError: function (err) { console.error(err); }
});
```

### `unregister()` → `Promise<boolean>`

Unregisters the current service worker. If this module did not create the registration, it falls back to `navigator.serviceWorker.getRegistration()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
BareMetal.Progressive.unregister().then(function (ok) {
  console.log('Unregistered:', ok);
});
```

### `getRegistration()` → `Promise<ServiceWorkerRegistration|null>`

Gets the cached registration if available, otherwise asks the browser for the current one.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
BareMetal.Progressive.getRegistration().then(function (reg) {
  if (reg) console.log('Active scope:', reg.scope);
});
```

### `update()` → `Promise<void|any>`

Requests a service worker update on the current registration.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
setInterval(function () {
  BareMetal.Progressive.update();
}, 60 * 60 * 1000);
```

### `onInstallPrompt(callback)` → `function`

Subscribes to the browser's deferred `beforeinstallprompt` event. The callback receives an object with a `prompt()` method.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Called with `{ prompt }` when install is available |

**Example:**
```js
var stop = BareMetal.Progressive.onInstallPrompt(function (app) {
  document.querySelector('#install').onclick = function () {
    app.prompt();
  };
});
```

### `isInstalled()` → `boolean`

Checks `matchMedia('(display-mode: standalone)')`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
if (BareMetal.Progressive.isInstalled()) {
  document.body.classList.add('app-installed');
}
```

### `isInstallable()` → `boolean`

Returns `true` once a deferred install prompt has been captured.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log('Ready to install:', BareMetal.Progressive.isInstallable());
```

### `precache(urls)` → `Promise<any>`

Asks the service worker to precache a list of URLs.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| urls | string[] | — | URLs to add to the `bm-precache` cache |

**Example:**
```js
BareMetal.Progressive.precache(['/', '/app.css', '/app.js']);
```

### `clearCache(cacheName)` → `Promise<any>`

Clears one named cache or, when omitted, all `bm-*` caches managed by the service worker.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cacheName | string \| null | `null` | Specific cache to delete |

**Example:**
```js
BareMetal.Progressive.clearCache('bm-images');
```

### `getCacheStatus()` → `Promise<object>`

Requests the current cache list from the service worker.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
BareMetal.Progressive.getCacheStatus().then(function (status) {
  console.log(status.caches);
});
```

### `isOnline()` → `boolean`

Returns `navigator.onLine` when available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
if (!BareMetal.Progressive.isOnline()) {
  console.log('Requests will be queued if BareMetal.Rest is loaded');
}
```

### `onConnectivityChange(callback)` → `function`

Subscribes to `online` and `offline` events. Going back online also triggers replay of the offline REST queue.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Called with `true` or `false` |

**Example:**
```js
BareMetal.Progressive.onConnectivityChange(function (online) {
  document.body.dataset.online = online ? 'yes' : 'no';
});
```

### `requestSync(tag)` → `Promise<void>`

Registers a Background Sync tag on the active service worker registration.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| tag | string | — | Sync identifier delivered back as `BM_SYNC` |

**Example:**
```js
BareMetal.Progressive.requestSync('orders-outbox');
```

### `subscribePush(vapidPublicKey)` → `Promise<PushSubscription>`

Requests notification permission if needed, then subscribes with the registration's `pushManager` using a base64url VAPID public key.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| vapidPublicKey | string | — | Base64url-encoded VAPID public key |

**Example:**
```js
BareMetal.Progressive.subscribePush('BElidedBase64UrlPublicKey...')
  .then(function (sub) { console.log('Push endpoint:', sub.endpoint); });
```

### `unsubscribePush()` → `Promise<boolean>`

Unsubscribes the current push subscription if one exists.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
BareMetal.Progressive.unsubscribePush();
```

### `getPushSubscription()` → `Promise<PushSubscription|null>`

Returns the current push subscription from `pushManager`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
BareMetal.Progressive.getPushSubscription().then(function (sub) {
  console.log('Already subscribed:', !!sub);
});
```

### `generateManifest(opts)` → `object`

Builds a manifest object in memory.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Manifest values |

**Example:**
```js
var manifest = BareMetal.Progressive.generateManifest({
  name: 'Field Ops',
  shortName: 'Ops',
  startUrl: '/app/',
  themeColor: '#0d6efd'
});
```

### `injectManifest(opts)` → `object`

Generates a manifest, creates a blob URL, and appends `<link rel="manifest">` to `document.head`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Same options as `generateManifest()` |

**Example:**
```js
BareMetal.Progressive.injectManifest({
  name: 'Warehouse Console',
  shortName: 'Warehouse',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
});
```

### `postMessage(msg)` → `Promise<any>`

Sends a message to the active service worker. If `MessageChannel` is available, the promise resolves with the worker's reply.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| msg | object | — | Message payload to send to the worker |

**Example:**
```js
BareMetal.Progressive.postMessage({ type: 'BM_SKIP_WAITING' });
```

### `onMessage(callback)` → `function`

Subscribes to messages posted from the service worker to the page.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Receives `event.data` from the worker |

**Example:**
```js
BareMetal.Progressive.onMessage(function (msg) {
  if (msg.type === 'BM_SYNC') console.log('Sync tag:', msg.tag);
});
```

## Configuration / Options

### `register()` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scope` | string | browser default | Optional service worker scope |
| `onUpdate` | function | — | Called when a new worker reaches `installed` while an older one is active |
| `onInstalled` | function | — | Called on first install when no active worker exists yet |
| `onActivated` | function | — | Called when the installing worker reaches `activated` |
| `onError` | function | — | Called before registration errors are rethrown |

### `generateManifest()` / `injectManifest()` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `'App'` | Full app name |
| `shortName` | string | `name` | Short name |
| `startUrl` | string | `'/'` | Launch URL |
| `display` | string | `'standalone'` | Manifest display mode |
| `themeColor` | string | `'#000000'` | Browser theme colour |
| `bgColor` | string | `'#ffffff'` | Background colour |
| `icons` | array | `[]` | Manifest icon entries |

## Examples

### Example 1: Queue REST writes while offline
```html
<script src="BareMetal.Communications.min.js"></script>
<script src="BareMetal.LocalKVStore.min.js"></script>
<script src="BareMetal.Progressive.min.js"></script>
<script>
(async function () {
  await BareMetal.Progressive.register('/BareMetal.ServiceWorker.min.js');

  document.querySelector('#save').onclick = function () {
    BareMetal.Rest.fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 42, status: 'queued' })
    }).catch(function (err) {
      console.log(err.message); // Offline — request queued
    });
  };
})();
</script>
```

### Example 2: Precaching and push setup
```js
Promise.all([
  BareMetal.Progressive.precache(['/', '/styles.css', '/app.js']),
  BareMetal.Progressive.subscribePush('BElidedBase64UrlPublicKey...')
]).then(function () {
  console.log('PWA runtime configured');
});
```

## Notes
- `register()` patches `BareMetal.Rest.fetch` only if `BareMetal.Rest` already exists.
- Offline queue entries strip `Authorization`, `Cookie`, `X-CSRF`, and `X-XSRF` headers, and drop string bodies longer than 4096 characters before persistence.
- Queue persistence prefers `BareMetal.LocalKVStore`; otherwise it uses `localStorage`.
- PWA APIs require HTTPS in production (or `localhost` during development).
