# BareMetal.IDB

> Promise-based IndexedDB wrapper for CRUD, indexes, range queries, transactions, batch operations, and simple key/value storage.

**Size:** 12 KB source / 7 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.IDB.min.js"></script>
<script>
  (async () => {
    const db = await BareMetal.IDB.open('app-db', {
      version: 1,
      stores: {
        todos: {
          keyPath: 'id',
          indexes: [{ name: 'byDone', keyPath: 'done' }]
        }
      }
    });

    await db.put('todos', { id: 't1', title: 'Write docs', done: false });
    const todo = await db.get('todos', 't1');
    console.log(todo);
  })();
</script>
```

## API Reference

### `open(name, opts)` → `Promise<db>`

Opens a database and returns a wrapped connection.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Database name. |
| opts | object | `undefined` | Open options. Supports `version`, `stores`, `onUpgrade`, and `onBlocked`. |

**Example:**
```js
const db = await BareMetal.IDB.open('crm', {
  version: 2,
  stores: {
    contacts: {
      keyPath: 'id',
      indexes: [
        { name: 'byEmail', keyPath: 'email', unique: true },
        { name: 'byCompany', keyPath: 'company' }
      ]
    }
  }
});
```

### `isSupported()` → `boolean`

Checks whether IndexedDB is available in the current environment.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
if (!BareMetal.IDB.isSupported()) {
  alert('IndexedDB is unavailable in this browser.');
}
```

### `databases()` → `Promise<Array>`

Returns database metadata when `indexedDB.databases()` is supported, otherwise an empty array.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const list = await BareMetal.IDB.databases();
console.log(list);
```

### `deleteDatabase(name)` → `Promise<void>`

Closes tracked connections for `name` and deletes the database.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Database name to delete. |

**Example:**
```js
await BareMetal.IDB.deleteDatabase('scratch-db');
```

### `kv(name)` → `Promise<kvStore>`

Opens a database with a built-in `kv` object store keyed by `key`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Database name. |

**Example:**
```js
const cache = await BareMetal.IDB.kv('settings');
await cache.set('theme', 'dark');
console.log(await cache.get('theme'));
```

### `db.close()` → `void`

Closes the underlying IndexedDB connection.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
db.close();
```

### `db.stores()` → `string[]`

Returns the current object store names.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(db.stores());
```

### `db.put(store, value)` → `Promise<any>`

Inserts or replaces one record.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| value | object | — | Record to write. |

**Example:**
```js
await db.put('contacts', { id: 1, name: 'Ada' });
```

### `db.putAll(store, values)` → `Promise<void>`

Writes many records in a single transaction.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| values | array | `[]` | Records to write. |

**Example:**
```js
await db.putAll('contacts', [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' }
]);
```

### `db.get(store, key)` → `Promise<any | null>`

Reads one record by primary key and normalizes missing values to `null`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| key | any | — | Primary key. |

**Example:**
```js
const contact = await db.get('contacts', 1);
```

### `db.getAll(store, opts)` → `Promise<any[]>`

Reads all records with optional cursor ordering and limits.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| opts | object | `{}` | Supports `limit` and `direction` (`'next'` or `'prev'`). |

**Example:**
```js
const latest = await db.getAll('logs', { direction: 'prev', limit: 20 });
```

### `db.delete(store, key)` → `Promise<void>`

Deletes one record by primary key.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| key | any | — | Primary key to remove. |

**Example:**
```js
await db.delete('contacts', 2);
```

### `db.deleteAll(store, keys)` → `Promise<void>`

Deletes multiple records in one transaction.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| keys | array | `[]` | Primary keys to delete. |

**Example:**
```js
await db.deleteAll('contacts', [2, 3, 4]);
```

### `db.clear(store)` → `Promise<void>`

Removes all records from a store.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |

**Example:**
```js
await db.clear('cache');
```

### `db.count(store)` → `Promise<number>`

Counts records in a store.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |

**Example:**
```js
console.log(await db.count('contacts'));
```

### `db.getBy(store, index, value)` → `Promise<any | null>`

Returns the first record matching an index value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| index | string | — | Index name. |
| value | any | — | Indexed value to match. |

**Example:**
```js
const ada = await db.getBy('contacts', 'byEmail', 'ada@example.com');
```

### `db.getAllBy(store, index, value, opts)` → `Promise<any[]>`

Returns all records matching an exact index value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| index | string | — | Index name. |
| value | any | — | Indexed value to match. |
| opts | object | `{}` | Supports `limit` and `direction`. |

**Example:**
```js
const openOrders = await db.getAllBy('orders', 'byStatus', 'open', { limit: 50 });
```

### `db.range(store, index, opts)` → `Promise<any[]>`

Runs an index range query using `gt`, `gte`, `lt`, and `lte` bounds.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| index | string | — | Index name to query. |
| opts | object | `{}` | Supports `gt`, `gte`, `lt`, `lte`, `limit`, and `direction`. |

**Example:**
```js
const adults = await db.range('people', 'byAge', { gte: 18, lt: 65 });
```

### `db.each(store, cb)` → `Promise<void>`

Iterates all records in primary-key order until the cursor ends or `cb()` returns `false`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| cb | function | — | Receives `(record, cursor, index)`. Return `false` to stop early. |

**Example:**
```js
await db.each('contacts', record => {
  console.log(record.name);
});
```

### `db.eachBy(store, index, opts, cb)` → `Promise<void>`

Iterates records from an index with optional range bounds, direction, and limit.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| index | string | — | Index name. |
| opts | object | `{}` | Supports `gt`, `gte`, `lt`, `lte`, `limit`, and `direction`. |
| cb | function | — | Receives `(record, cursor, index)`. Return `false` to stop early. |

**Example:**
```js
await db.eachBy('orders', 'byCreatedAt', { direction: 'prev', limit: 10 }, order => {
  console.log(order.id);
});
```

### `db.filter(store, cb)` → `Promise<any[]>`

Collects records for which `cb()` returns truthy.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| cb | function | — | Receives `(record, cursor, index)`. |

**Example:**
```js
const overdue = await db.filter('tasks', task => task.due < Date.now());
```

### `db.transaction(stores, mode, fn)` → `Promise<any>`

Runs custom work inside one transaction and resolves when the transaction completes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stores | string \| string[] | — | Store or stores to open in the transaction. |
| mode | string | `'readonly'` | Transaction mode such as `'readonly'` or `'readwrite'`. |
| fn | function | — | Called with helper methods and the raw `IDBTransaction`. |

**Example:**
```js
await db.transaction(['accounts', 'logs'], 'readwrite', ({ put }) => {
  put('accounts', { id: 1, balance: 150 });
  put('logs', { id: 'l1', message: 'Balance updated' });
});
```

### `db.batch(store, op, items)` → `Promise<void>`

Runs a built-in batch operation for `put` or `delete`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| op | string | — | Supported values: `'put'` and `'delete'`. |
| items | array | — | Records or keys, depending on `op`. |

**Example:**
```js
await db.batch('contacts', 'put', [{ id: 1, name: 'Ada' }]);
```

### `db.export(store)` → `Promise<any[]>`

Exports a store as an array of records.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |

**Example:**
```js
const backup = await db.export('contacts');
```

### `db.import(store, data)` → `Promise<void>`

Clears a store, then bulk loads replacement records.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| store | string | — | Object store name. |
| data | array | `[]` | Replacement records. |

**Example:**
```js
await db.import('contacts', backupData);
```

### `kvStore.set(key, value)` → `Promise<any>`

Stores one value in the built-in `kv` store.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | any | — | Record key. |
| value | any | — | Value to store. |

**Example:**
```js
await cache.set('token', 'abc123');
```

### `kvStore.get(key)` → `Promise<any | null>`

Reads one value from the `kv` store.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | any | — | Record key. |

**Example:**
```js
const token = await cache.get('token');
```

### `kvStore.delete(key)` → `Promise<void>`

Deletes one key from the `kv` store.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | any | — | Record key. |

**Example:**
```js
await cache.delete('token');
```

### `kvStore.has(key)` → `Promise<boolean>`

Checks whether a key exists.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | any | — | Record key. |

**Example:**
```js
console.log(await cache.has('token'));
```

### `kvStore.keys()` → `Promise<any[]>`

Returns all keys from the `kv` store.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(await cache.keys());
```

### `kvStore.clear()` → `Promise<void>`

Removes every key/value pair.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
await cache.clear();
```

### `kvStore.close()` → `void`

Closes the underlying database connection.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
cache.close();
```

## Notes

- `opts.stores` is authoritative during upgrades: missing stores or indexes are removed to match the supplied schema.
- `db.get()` returns `null` for missing records instead of `undefined`.
- Range helpers accept `gt`, `gte`, `lt`, and `lte`, which are converted to `IDBKeyRange` bounds.
- `db.transaction()` exposes raw `IDBObjectStore` requests through its helper methods for advanced use.
- Opened databases are automatically closed on `versionchange`, `pagehide`, and `beforeunload`.
