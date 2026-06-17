# BareMetal.Sync

> Diff, patch, merge, offline queueing, and lightweight CRDT helpers.

**Size:** 25 KB source / 12 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Sync.min.js"></script>
<script>
  const base = { title: 'Draft', tags: ['docs'] };
  const local = { title: 'Ready', tags: ['docs'] };
  const remote = { title: 'Published', tags: ['docs', 'site'] };

  const { result, conflicts } = BareMetal.Sync.merge(local, remote, base, 'last-write');
  console.log(result, conflicts);
</script>
```

## API Reference

### `diff(a, b)` → `Array<object>`

Creates JSON-patch-style `add`, `remove`, and `replace` operations needed to turn `a` into `b`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| a | any | — | Original value. |
| b | any | — | Updated value. |

**Example:**
```js
const ops = BareMetal.Sync.diff(
  { title: 'Draft', count: 1 },
  { title: 'Ready', count: 2 }
);
```

### `patch(target, ops)` → `any`

Applies a list of sync operations without mutating the original target.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | any | — | Value to patch. |
| ops | array | — | Operations from `diff()` or `batch()`. |

**Example:**
```js
const next = BareMetal.Sync.patch({ done: false }, [
  { op: 'replace', path: ['done'], value: true }
]);
```

### `merge(local, remote, base, strategy)` → `{ result, conflicts }`

Performs a three-way merge and returns the merged result plus any unresolved conflicts.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| local | any | — | Local copy. |
| remote | any | — | Remote copy. |
| base | any | — | Shared ancestor snapshot. |
| strategy | string \| function \| object | `'last-write'` | Conflict resolver name or custom resolver. |

**Example:**
```js
const merged = BareMetal.Sync.merge(localDraft, remoteDraft, baseDraft, 'last-write');
console.log(merged.result, merged.conflicts);
```

### `conflict(path, local, remote, base)` → `object`

Builds a conflict record you can store, display, or feed into `resolve()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| path | array \| string | — | Field path that conflicted. |
| local | any | — | Local value. |
| remote | any | — | Remote value. |
| base | any | — | Base value. |

**Example:**
```js
const item = BareMetal.Sync.conflict(['title'], 'Ready', 'Published', 'Draft');
```

### `resolve(conflicts, resolutions)` → `any`

Applies chosen values back onto the conflicted snapshot.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| conflicts | array | — | Conflict list returned by `merge()`. |
| resolutions | array \| object | — | Overrides keyed by path, field name, or index. |

**Example:**
```js
const resolved = BareMetal.Sync.resolve(conflicts, {
  title: 'Published'
});
```

### `queue(opts)` → `object`

Creates a persistent or in-memory sync queue for offline writes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Queue options such as `key`, `maxSize`, `retry`, `maxRetries`, and `storage`. |

**Example:**
```js
const queue = BareMetal.Sync.queue({ key: 'orders', storage: 'localStorage', retry: true });
queue.push({ id: 1, op: 'save' });
await queue.flush(async op => api.send(op));
```

**Queue methods:**

| Method | Description |
|--------|-------------|
| `push(op)` | Adds an operation and returns the queued item. |
| `flush(applyFn)` | Replays queued operations in order. |
| `peek()` | Returns a cloned snapshot of queued items. |
| `size()` | Returns the queue length. |
| `clear()` | Removes all queued items. |
| `onFlush(cb)` | Subscribes to successful flushes. |
| `onError(cb)` | Subscribes to replay failures. |

### `replay(ops, applyFn)` → `Promise<Array>`

Replays a list of operations sequentially through a sync or async handler.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| ops | array | — | Operations to replay. |
| applyFn | function | — | Called with each operation. |

**Example:**
```js
await BareMetal.Sync.replay(queue.peek(), op => fetch('/sync', {
  method: 'POST',
  body: JSON.stringify(op)
}));
```

### `echo(sent, received)` → `{ confirmed, rejected, pending }`

Compares optimistic operations to server receipts.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| sent | array | — | Outbound operations. |
| received | array | — | Server acknowledgements. |

**Example:**
```js
const status = BareMetal.Sync.echo(sentOps, serverAcks);
console.log(status.confirmed.length, status.pending.length);
```

### `clock(initial)` → `object`

Creates a simple vector-clock-style counter map.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| initial | object | `{}` | Starting node counters. |

**Example:**
```js
const clock = BareMetal.Sync.clock({ web: 2 });
clock.increment('web');
clock.merge({ worker: 5 });
```

**Clock methods:**

| Method | Description |
|--------|-------------|
| `increment(nodeId, amount)` | Increments one node counter. |
| `merge(otherClock)` | Merges another clock by max counter value. |
| `compare(otherClock)` | Returns ordering information for two clocks. |
| `toJSON()` | Serialises the clock. |
| `value()` | Returns a cloned counter map. |

### `crdt(type, opts)` → `object`

Creates a lightweight CRDT for counters, sets, or registers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string | — | `'counter'`, `'set'`, or `'register'`. |
| opts | object | `{}` | Options such as `nodeId`. |

**Example:**
```js
const likes = BareMetal.Sync.crdt('counter', { nodeId: 'tab-1' });
likes.increment(1);
```

**CRDT methods:**

| Type | Methods |
|------|---------|
| `counter` | `increment(amount)`, `value()`, `merge(other)`, `toJSON()`, `fromJSON(data)` |
| `set` | `add(value)`, `remove(value)`, `has(value)`, `value()`, `merge(other)`, `toJSON()`, `fromJSON(data)` |
| `register` | `set(value, timestamp, nodeId)`, `value()`, `merge(other)`, `toJSON()`, `fromJSON(data)` |

### `version(obj)` → `object`

Wraps a value with version history and rollback support.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| obj | any | — | Initial value to track. |

**Example:**
```js
const history = BareMetal.Sync.version({ stage: 'draft' });
history.set({ stage: 'review' });
history.rollback(0);
```

**Version methods:**

| Method | Description |
|--------|-------------|
| `get()` | Returns the current snapshot. |
| `set(value)` | Stores a new version. |
| `getVersion()` | Returns the current version number. |
| `getHistory()` | Returns prior snapshots. |
| `rollback(versionId)` | Restores a previous version. |

### `subscribe(syncable, callback)` → `function`

Normalises subscription hooks across syncable objects and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| syncable | object | — | Object exposing `subscribe`, `onChange`, or `on('remote')`. |
| callback | function | — | Handler for remote updates. |

**Example:**
```js
const off = BareMetal.Sync.subscribe(session, update => {
  console.log('remote update', update);
});
```

### `batch(ops)` → `object`

Normalises a list of operations and returns a reusable patch batch.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| ops | array | — | Operation list to validate. |

**Example:**
```js
const batch = BareMetal.Sync.batch([
  { op: 'replace', path: ['status'], value: 'done' }
]);
const next = batch.apply({ status: 'draft' });
```

**Batch members:**

| Member | Description |
|--------|-------------|
| `ops` | Normalised operations array. |
| `size` | Operation count. |
| `apply(target)` | Applies the whole batch to a target. |

## Notes
- Operations use array paths internally; dotted paths are best reserved for conflict resolution maps.
- `merge()` is conservative with arrays and may surface a conflict instead of guessing item-level intent.
- `queue()` only persists automatically when `storage: 'localStorage'` is enabled.
- `replay()` and `queue.flush()` stop on the first unrecoverable error unless retries are configured.
