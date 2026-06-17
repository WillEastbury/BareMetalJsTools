# BareMetal.Cache

> TTL, stale-while-revalidate, LRU, tiered caching, and memoization utilities.

**Size:** 25 KB source / 11 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Cache.min.js"></script>
<script>
  const cache = BareMetal.Cache.create({ ttl: 60_000, swr: 10_000, maxSize: 100 });
  const user = await cache.wrap('user:42', () => fetch('/api/users/42').then(r => r.json()));
  console.log(user);
</script>
```

## API Reference

### `create(opts)` → `object`

Creates a cache instance with TTL, optional stale-while-revalidate, and pluggable storage.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Cache options such as `maxSize`, `ttl`, `swr`, `staleIfError`, `storage`, `onEvict`, `serialize`, `deserialize`, and `namespace`. |

**Example:**
```js
const cache = BareMetal.Cache.create({
  ttl: 30_000,
  swr: 5_000,
  maxSize: 250,
  storage: 'localStorage'
});
```

**Cache methods:**

| Method | Description |
|--------|-------------|
| `get(key)` | Returns a cached value or `undefined`. |
| `set(key, value, options)` | Stores a value with optional per-item overrides. |
| `has(key)` | Returns `true` when a live item exists. |
| `delete(key)` | Removes one entry. |
| `clear()` | Clears the whole cache. |
| `size()` | Returns the item count. |
| `keys()` | Returns all keys. |
| `entries()` | Returns raw entry metadata for inspection. |
| `wrap(key, fetchFn, options)` | Gets cached data or fills it from a loader. |
| `invalidate(key)` | Marks one entry stale. |
| `invalidateByTag(tag)` | Invalidates all items carrying a tag. |
| `prune()` | Removes expired items and enforces size limits. |
| `stats()` | Returns hit/miss/eviction statistics. |
| `on(event, cb)` | Subscribes to cache lifecycle events. |
| `__peekRaw(key)` | Returns a cloned raw entry record for debugging. |

### `tiered(levels)` → `object`

Creates a write-through cache stack using multiple cache levels.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| levels | array | — | Cache instances or config objects used to create them. |

**Example:**
```js
const hot = BareMetal.Cache.create({ ttl: 5_000, maxSize: 50 });
const warm = BareMetal.Cache.create({ ttl: 60_000, storage: 'localStorage' });
const cache = BareMetal.Cache.tiered([hot, warm]);
```

**Tiered cache methods:**

| Method | Description |
|--------|-------------|
| `get(key)` | Reads from the first level with a hit and promotes upward. |
| `set(key, value, options)` | Writes through all levels. |
| `has(key)` | Returns `true` if any level has a live item. |
| `delete(key)` | Removes the key from all levels. |
| `clear()` | Clears every level. |
| `size()` | Returns the total visible item count. |
| `keys()` | Returns de-duplicated keys across levels. |
| `entries()` | Returns visible entries across the stack. |
| `wrap(key, fetchFn, options)` | Performs cached loading across levels. |
| `invalidate(key)` | Invalidates the key in every level. |
| `invalidateByTag(tag)` | Invalidates tagged items across levels. |
| `prune()` | Prunes every level. |
| `stats()` | Returns merged stats. |
| `on(event, cb)` | Subscribes to lifecycle events on the tiered wrapper. |
| `__peekRaw(key)` | Returns the first raw record found. |

### `lru(maxSize)` → `object`

Shortcut for `create({ maxSize })`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| maxSize | number | — | Maximum number of entries before eviction. |

**Example:**
```js
const recent = BareMetal.Cache.lru(100);
recent.set('page:home', { visits: 1 });
```

### `memoize(fn, opts)` → `function`

Wraps a function with cache-backed memoization.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to memoize. |
| opts | object | `{}` | Memoization options such as `cache`, `key`, `ttl`, or cache factory options. |

**Example:**
```js
const slowTotal = BareMetal.Cache.memoize((a, b) => a + b, {
  key: args => args.join(':'),
  ttl: 10_000
});
slowTotal(2, 3);
```

## Notes
- `wrap()` deduplicates concurrent fetches for the same key.
- `invalidate()` marks entries stale immediately; `entries()` still exposes that raw state for debugging.
- LRU eviction is driven by read/write touch time, not just insertion order.
- Web storage backends use `serialize` and `deserialize` when values need custom persistence.
