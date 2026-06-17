# BareMetal.Transport

> Async transport helpers for retry, backoff, dedupe, batching, cancellation, caching, queues, circuit breakers, and rate limiting.

**Size:** 26 KB source / 12 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Transport.min.js"></script>
<script>
  async function loadData() {
    return BareMetal.Transport.retry(async function () {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    }, {
      maxAttempts: 3,
      baseDelay: 200,
      retryOn: err => /failed|timeout/i.test(err.message)
    });
  }

  loadData().then(console.log).catch(console.error);
</script>
```

## API Reference

### `retry(fn, policy)` → `Promise<any>`

Runs an async function with retry and backoff behavior.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Called as `fn(attempt)`. |
| policy | object | `{}` | Supports `maxAttempts`, `retryOn(err, attempt)`, `baseDelay`, `maxDelay`, `backoff`, `jitter`, and `signal`. |

**Example:**
```js
const value = await BareMetal.Transport.retry(doRequest, { maxAttempts: 5, backoff: 'linear' });
```

### `backoff(attempt, policy)` → `number`

Calculates the wait time in milliseconds for one retry attempt.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| attempt | number | `1` | Retry attempt number. |
| policy | object | `{}` | Uses `baseDelay`, `maxDelay`, `backoff`, and `jitter`. |

**Example:**
```js
const wait = BareMetal.Transport.backoff(3, { baseDelay: 100, backoff: 'exponential' });
```

### `idempotencyKey()` → `string`

Generates a random UUID-like idempotency key.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const key = BareMetal.Transport.idempotencyKey();
```

### `dedupe(keyFn, fn)` → `function`

Wraps a function so matching in-flight calls share the same promise.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| keyFn | function | `JSON.stringify(args)` | Optional key builder. |
| fn | function | — | Function to wrap. If omitted, `dedupe()` returns a decorator factory. |

**Example:**
```js
const loadUser = BareMetal.Transport.dedupe(function (id) { return id; }, async function (id) {
  return fetch('/api/users/' + id).then(r => r.json());
});
```

### `deduped.inflight()` / `deduped.clear()`

Reads the number of in-flight keys or clears the in-flight map.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(loadUser.inflight());
loadUser.clear();
```

### `coalesce(requests, opts)` → `Promise<any> | function`

Processes an array in batches or creates a reusable coalescer queue.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| requests | array \| object | — | Array of requests to batch, or omit it to create a reusable coalescer. |
| opts | object | `{}` | Supports `batchFn`, `maxBatch`, and `maxWait`. |

**Example:**
```js
const result = await BareMetal.Transport.coalesce([1, 2, 3, 4], {
  maxBatch: 2,
  batchFn(batch) { return batch.map(x => x * 2); }
});
```

### `coalescer.flush()` / `coalescer.size()` / `coalescer.clear()`

Flushes queued requests immediately, reports queue size, or rejects queued work.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const coalescer = BareMetal.Transport.coalesce({ batchFn: fetchBatch, maxWait: 25 });
coalescer({ id: 1 });
await coalescer.flush();
```

### `cancel(parentSignal)` → `object`

Creates an abort scope and optionally chains it to a parent signal.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| parentSignal | AbortSignal | `undefined` | Optional parent abort signal. |

**Example:**
```js
const scope = BareMetal.Transport.cancel();
setTimeout(() => scope.abort(new Error('Stop now')), 5000);
```

### `scope.abort(reason)` / `scope.fork()`

Aborts the scope or creates a child scope linked to it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| reason | any | `undefined` | Optional abort reason for `abort()`. |

**Example:**
```js
const child = scope.fork();
child.abort('Cancelled');
```

### `timeout(ms)` → `object`

Creates an abort signal that triggers after a timeout.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| ms | number | — | Timeout in milliseconds. |

**Example:**
```js
const t = BareMetal.Transport.timeout(2000);
fetch(url, { signal: t.signal }).finally(t.clear);
```

### `timeout.clear()` → `void`

Clears the timeout without aborting immediately.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
t.clear();
```

### `race(promises, signal)` → `Promise<any>`

Races promise values, promise factories, or `{ promise, abort }` entries and aborts losers when one wins.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| promises | array | — | Array of promises, factories, or abortable entries. |
| signal | AbortSignal | `undefined` | Optional external abort signal. |

**Example:**
```js
const result = await BareMetal.Transport.race([
  signal => fetch('/fast', { signal }),
  signal => fetch('/slow', { signal })
]);
```

### `cache(fn, opts)` → `function`

Wraps a function with TTL caching, stale-while-revalidate, and optional stale-on-error behavior.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to cache. |
| opts | object | `{}` | Supports `ttl`, `swr`, `staleIfError`, `key`, `maxSize`, `store`, and `storage`. |

**Example:**
```js
const cachedUser = BareMetal.Transport.cache(loadUser, { ttl: 30000, swr: 10000 });
```

### `cached.clear()` / `cached.delete(...args)` / `cached.peek(...args)`

Clears cache storage, deletes one key, or reads a cached value without refreshing.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| args | any | — | Original function arguments for `delete()` and `peek()`. |

**Example:**
```js
cachedUser.delete(7);
console.log(cachedUser.peek(7));
```

### `priority(fn, level)` → `function`

Decorates a function with `priority`, `priorityWeight`, and `original` metadata for queues.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to decorate. |
| level | string | `'normal'` | One of `critical`, `high`, `normal`, `low`, or `idle`. |

**Example:**
```js
const urgent = BareMetal.Transport.priority(sendAlert, 'critical');
```

### `queue(opts)` → `queueApi`

Creates a concurrency-limited task queue with optional priority ordering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Supports `concurrency`, `priority`, and `onDrain`. |

**Example:**
```js
const queue = BareMetal.Transport.queue({ concurrency: 2, priority: true });
```

### `queueApi.add(fn, level)` → `Promise<any>`

Queues a task function for execution.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Task function. |
| level | string | function priority | Optional task priority level. |

**Example:**
```js
queue.add(() => fetch('/job/1'), 'high');
```

### `queueApi.pause()` / `queueApi.resume()` / `queueApi.clear()` → `queueApi`

Pauses processing, resumes processing, or rejects pending queued tasks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
queue.pause();
queue.resume();
```

### `queueApi.size()` / `queueApi.pending()` → `number`

Reports queued item count and currently running task count.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(queue.size(), queue.pending());
```

### `circuit(fn, opts)` → `function`

Wraps a function with closed/open/half-open circuit breaker behavior.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to protect. |
| opts | object | `{}` | Supports `threshold`, `resetTimeout`, `halfOpenMax`, `onOpen`, `onHalfOpen`, and `onClose`. |

**Example:**
```js
const guarded = BareMetal.Transport.circuit(fetchData, { threshold: 3, resetTimeout: 10000 });
```

### `circuit.state()` / `circuit.reset()` / `circuit.stats()`

Reads the current state, forces a reset to `closed`, or returns breaker counters.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(guarded.state(), guarded.stats());
guarded.reset();
```

### `rateLimit(fn, opts)` → `function`

Wraps a function with per-second and per-minute limits, optionally queueing overflow.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to limit. |
| opts | object | `{}` | Supports `maxPerSecond`, `maxPerMinute`, and `queue`. |

**Example:**
```js
const limited = BareMetal.Transport.rateLimit(searchApi, { maxPerSecond: 5, queue: true });
```

### `limited.pending()` / `limited.clear()`

Reads queued call count or rejects the pending rate-limit queue.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(limited.pending());
limited.clear();
```

## Notes

- `retry()` and `delay()` honor abort signals when provided.
- `dedupe()` and `cache()` default to `JSON.stringify(args)` keying.
- `coalesce()` can either batch an existing array or return a reusable queueing function.
- `cache()` supports stale-while-revalidate and optional stale-if-error fallbacks.
- `circuit()` rejects with an `Error` named `CircuitOpenError` and code `E_CIRCUIT_OPEN` while open.
- `rateLimit()` rejects immediately unless `queue: true` is enabled.
