# BareMetal.Config

> Layered configuration with validation, scoped views, overrides, and env import/export.

**Size:** 26 KB source / 11 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Config.min.js"></script>
<script>
  const config = BareMetal.Config.create({
    schema: {
      apiBase: { type: 'string', required: true },
      retryCount: { type: 'number', default: 3 }
    }
  });

  config.layer('defaults', { apiBase: '/api' }, BareMetal.Config.priorities.defaults);
  console.log(config.get('retryCount'));
</script>
```

## API Reference

### `create(opts)` → `object`

Creates a layered config store.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Config options such as `schema`, `strict`, `layers`, and `onChange`. |

**Example:**
```js
const config = BareMetal.Config.create({
  strict: true,
  schema: {
    apiBase: { type: 'string', required: true },
    featureFlag: { type: 'boolean', default: false }
  }
});
```

**Config methods:**

| Method | Description |
|--------|-------------|
| `get(key, defaultValue)` | Reads one merged value. |
| `set(key, value, layerName)` | Writes one value into a layer. |
| `has(key)` | Returns `true` when the merged config contains the key. |
| `getAll()` | Returns the full merged config object. |
| `delete(key, layerName)` | Removes one key from a layer. |
| `reset(layerName)` | Clears one layer. |
| `layer(name, data, priority)` | Adds or replaces a layer. |
| `getLayer(name)` | Returns one cloned layer payload. |
| `getLayers()` | Returns metadata for all layers. |
| `validate()` | Validates the merged config against the schema. |
| `schema(definition)` | Replaces the active schema. |
| `override(overrides, duration)` | Applies temporary overrides and returns a cancel function. |
| `scope(prefix)` | Returns a scoped config wrapper rooted at one path. |
| `freeze()` | Prevents later mutations. |
| `onChange(key, cb)` | Subscribes to one config key. |
| `onAnyChange(cb)` | Subscribes to all changes. |
| `toEnv()` | Exports config values as env-style key/value pairs. |
| `fromEnv(env)` | Imports values from env-style key/value pairs. |
| `merge(obj, layerName)` | Deep-merges an object into a layer. |
| `export()` | Exports schema, flags, and layers. |
| `import(snapshot)` | Restores a previous export snapshot. |

### `priorities` → `object`

Named layer priorities used by `layer()` and `create({ layers })`.

| Key | Value |
|-----|-------|
| `defaults` | `0` |
| `env` | `10` |
| `file` | `20` |
| `runtime` | `30` |
| `override` | `40` |

**Example:**
```js
config.layer('runtime', { featureFlag: true }, BareMetal.Config.priorities.runtime);
```

## Notes
- Layer precedence is sorted by priority, then by insertion order when priorities match.
- `strict: true` rejects unknown keys during `set()`, `merge()`, `fromEnv()`, and `validate()`.
- `override()` can auto-expire after the supplied duration and returns a cancel function for manual rollback.
- `scope(prefix)` is useful for nested config such as `services.api` while still honoring the shared layer stack.
