# BareMetal.OfflineData

Optimistic record writes with a durable IndexedDB outbox, sequential replay, and a conflict-resolution panel. It composes `BareMetal.IDB` with `BareMetal.Sync`; the application supplies the server request callback and owns any credentials.

## Load

```html
<script src="src/BareMetal.IDB.js"></script>
<script src="src/BareMetal.Sync.js"></script>
<script src="src/BareMetal.OfflineData.js"></script>
```

## Public API

### `create(options)`

Creates a client over a `BareMetal.IDB` database and a required `send(operation)` callback.

### `client.mutate(input)`

Atomically writes the optimistic record and its durable outbox operation. `input` contains `key`, `value` (or `remove: true`), and a serializable request descriptor.

### `client.put(key, value, request)`

Queues an optimistic record put.

### `client.remove(key, request)`

Queues an optimistic record removal.

### `client.get(key)` and `client.all()`

Read the local record store.

### `client.pending()` and `client.conflicts()`

List queued and conflicted outbox operations.

### `client.flush()`

Replays pending writes in order and resolves to `{ sent, conflict, remaining }`. Transient failures persist and reject; conflicts are recorded and returned for resolution.

### `client.resolve(id, choice)`

Resolves a conflict using `'local'`, `'remote'`, `'merge'`, `{ value }`, or `{ resolutions }`.

### `client.on(event, handler)`

Subscribes to optimistic, sent, conflict, resolved, error, and change events. Returns an unsubscribe function.

### `client.mountConflictUI(target)`

Mounts local/server comparison and manual JSON merge controls. Returns `{ el, refresh, destroy }`.

### `client.startAutoSync()` and `client.stopAutoSync()`

Attach or remove the browser `online` event listener and flush queued operations when connectivity is available.

### `client.destroy()`

Stops automatic synchronization and releases event listeners.

## Create a client

The provided database must contain a record store and an outbox store, both keyed by `id`. Mutations update the local record and insert the outbox operation in the same IndexedDB transaction.

```js
const db = await BareMetal.IDB.open('orders-v1', {
  version: 1,
  stores: {
    orders: { keyPath: 'id' },
    outbox: { keyPath: 'id' }
  }
});

const offline = BareMetal.OfflineData.create({
  db,
  recordStore: 'orders',
  outboxStore: 'outbox',
  send: async operation => {
    const response = await fetch(operation.request.url, {
      method: operation.request.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation.optimistic)
    });
    if (!response.ok) {
      const error = new Error('Save failed: ' + response.status);
      error.status = response.status;
      if (response.status === 409 || response.status === 412) error.remote = await response.json();
      throw error;
    }
    return response.status === 204 ? undefined : response.json();
  }
});

await offline.put('PO-1042', updatedOrder, {
  method: 'PUT',
  url: '/api/orders/PO-1042'
});
```

`put(key, value, request)` and `remove(key, request)` apply the local change immediately and queue the request. Call `flush()` on startup and after reconnect; it replays pending operations in order. Set `autoFlush: true` to flush on creation, after new writes, and when the browser returns online. Transient errors keep the optimistic record and outbox item, update its attempt count, and reject the flush call.

## Conflicts

HTTP `409`/`412` responses are stored as conflicts with the base, local, and server versions. `conflicts()` lists them; `resolve(id, 'local')`, `resolve(id, 'remote')`, `resolve(id, 'merge')`, or `resolve(id, { value })` applies a decision. `merge` resolves non-overlapping edits automatically and returns the remaining field conflicts for manual resolution. A merge proposal is prepared with `BareMetal.Sync.merge`.

```js
offline.on('conflict', conflict => console.warn('Needs review', conflict.id));
offline.mountConflictUI('#sync-conflicts');

const result = await offline.flush();
if (result.conflict) console.log('Resolve this operation in the conflict panel');
```

The mounted panel shows both versions and offers **Keep mine**, **Use server**, and a JSON editor for a manual merge. The module does not store API credentials or assume a server protocol; `send(operation)` is the application adapter.

`startAutoSync()` and `stopAutoSync()` enable or disable online-event replay after client creation. `destroy()` removes the online listener.
