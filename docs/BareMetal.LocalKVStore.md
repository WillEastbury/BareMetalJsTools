# BareMetal.LocalKVStore

> Promise-based browser key-value storage over localStorage, sessionStorage, or IndexedDB.

**Size:** 13.99 KB source / 6.88 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.LocalKVStore.min.js"></script>
<script>
  (async () => {
    const store = BareMetal.LocalKVStore.create({
      backend: 'session',
      namespace: 'demo',
      ttl: 300
    });

    await store.set('theme', 'dark');
    console.log(await store.get('theme'));
  })();
</script>
```

## API Reference

### `create(options)` → `store`

Creates a namespaced store. All public store methods return promises.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Backend, namespace, and default TTL |

**Example:**
```js
const cache = BareMetal.LocalKVStore.create({
  backend: 'local',
  namespace: 'app-cache',
  ttl: 60
});
```

### `store.get(key)` → `Promise<any|null>`

Returns the value for a key or `null` when missing/expired.

### `store.set(key, value, ttl)` → `Promise<void>`

Stores a value with an optional TTL override in seconds.

### `store.remove(key)` → `Promise<void>`

Deletes a key.

### `store.has(key)` → `Promise<boolean>`

Checks whether a non-expired key exists.

### `store.clear()` → `Promise<void>`

Removes every key in the current namespace.

### `store.getMany(keys)` → `Promise<object>`

Fetches multiple keys and returns an object keyed by the requested names.

### `store.setMany(entries, ttl)` → `Promise<void>`

Stores many values from an object map.

### `store.removeMany(keys)` → `Promise<void>`

Deletes multiple keys.

### `store.keys()` → `Promise<string[]>`

Returns all live keys in the namespace.

### `store.values()` → `Promise<any[]>`

Returns all live values in the namespace.

### `store.entries()` → `Promise<[string, any][]>`

Returns key/value pairs for all live entries.

### `store.count()` → `Promise<number>`

Returns the number of live entries.

### `store.find(predicate)` → `Promise<[string, any][]>`

Filters live entries using `predicate(value, key)`.

### `store.ttl(key)` → `Promise<number|null>`

Returns the remaining TTL in whole seconds, or `null` for missing/persistent entries.

### `store.expire(key, ttl)` → `Promise<boolean>`

Updates the expiration for an existing live record.

### `store.persist(key)` → `Promise<boolean>`

Removes the expiration from an existing live record.

### `store.cleanup()` → `Promise<number>`

Removes expired entries and returns the count removed for web-storage backends.

### `store.size()` → `Promise<number>`

Estimates storage used by the namespace by summing JSON record size plus namespaced key length.

### `store.onChange(callback)` → `() => void`

Subscribes to local store changes and, for the `local` backend, cross-tab `storage` events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Receives event objects such as `{ type, key, value }` |

**Example:**
```js
const off = store.onChange((event) => {
  console.log(event.type, event.key, event.value);
});
```

## Configuration / Options

### `create()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| backend | string | `'local'` | `'local'`, `'session'`, or `'indexeddb'` |
| namespace | string | `'bm'` | Key prefix used to isolate the store |
| ttl | number | `0` | Default TTL in seconds; `0` means no expiry |

### Change event shape

| Field | Type | Description |
|-------|------|-------------|
| type | string | `set`, `remove`, `clear`, or `expire` |
| key | string | Entry key when applicable |
| value | any | Entry value for `set` events |

## Examples

### Example 1: Page cache with expiry
```html
<script src="BareMetal.LocalKVStore.min.js"></script>
<script>
  (async () => {
    const pages = BareMetal.LocalKVStore.create({
      backend: 'local',
      namespace: 'pages',
      ttl: 900
    });

    await pages.set('/dashboard', { html: '<h1>Cached</h1>' });
    console.log(await pages.ttl('/dashboard'));
  })();
</script>
```

### Example 2: Batch updates and cleanup
```js
const store = BareMetal.LocalKVStore.create({ namespace: 'filters' });
await store.setMany({ region: 'EU', sort: 'name', pageSize: 50 });

const active = await store.find((value, key) => key !== 'pageSize');
const removed = await store.cleanup();
console.log(active, removed);
```

## Notes
- TTL values are expressed in seconds.
- The store namespaces keys as `{namespace}:{key}`.
- `onChange()` listens to browser `storage` events only for the `local` backend.
- IndexedDB supports the same API surface, but `cleanup()` does not implement a dedicated expired-record sweep in this version.
