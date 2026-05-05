# BareMetal.Workers

> Inline worker helpers, frame schedulers, idle queues, and priority task queues for browser-side concurrency.

**Size:** 9 KB source / 9 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Workers.min.js"></script>
<script>
  const pool = BareMetal.Workers.pool(function(job) {
    return job.a + job.b;
  }, { size: 2 });

  const onResize = BareMetal.Workers.debounce(function() {
    console.log('layout settled');
  }, 150);

  pool.run({ a: 2, b: 3 }).then(result => {
    console.log(result); // 5
    pool.terminate();
  });

  window.addEventListener('resize', onResize);
</script>
```

## API Reference

### `create(workerFn)` → `runner`

Creates an inline worker from a function that receives one payload and returns a value or promise.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| workerFn | function | — | Worker body invoked with `payload`. |

**Example:**
```js
const hashWorker = BareMetal.Workers.create(function(input) {
  return String(input).toUpperCase();
});
```

### `spawn(workerFn)` → `workerHandle`

Creates an inline worker by executing `workerFn` as a self-invoking script.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| workerFn | function | — | Script body that sets up `self.onmessage`, timers, or other worker globals. |

**Example:**
```js
const worker = BareMetal.Workers.spawn(function() {
  self.onmessage = function(e) {
    self.postMessage(e.data * 2);
  };
});
```

### `shared(workerFn, opts)` → `sharedHandle`

Creates a `SharedWorker` from an inline script.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| workerFn | function | — | Shared worker script body, usually wiring `self.onconnect`. |
| opts | object | `undefined` | Optional SharedWorker options. Supports `name`. |

**Example:**
```js
const shared = BareMetal.Workers.shared(function() {
  self.onconnect = function(e) {
    const port = e.ports[0];
    port.onmessage = function(msg) { port.postMessage(msg.data); };
  };
}, { name: 'echo' });
```

### `pool(workerFn, opts)` → `pool`

Creates a worker pool for parallel jobs.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| workerFn | function | — | Worker body invoked with one payload. |
| opts | object | `undefined` | Pool options. Supports `size` and `timeout`. |

**Example:**
```js
const pool = BareMetal.Workers.pool(function(job) {
  return job.values.reduce((sum, n) => sum + n, 0);
}, { size: 4, timeout: 5000 });
```

### `debounce(fn, wait, opts)` → `function`

Returns a debounced wrapper with `.cancel()` and `.flush()` helpers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to debounce. |
| wait | number | `0` | Delay in milliseconds. |
| opts | object | `{}` | Supports `leading` and `trailing` (`true` by default). |

**Example:**
```js
const saveDraft = BareMetal.Workers.debounce(sendDraft, 250, { leading: false });
```

### `throttle(fn, wait, opts)` → `function`

Returns a throttled wrapper with `.cancel()` and `.flush()` helpers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to throttle. |
| wait | number | `0` | Minimum gap in milliseconds. |
| opts | object | `{}` | Supports `leading` and `trailing`. |

**Example:**
```js
const syncScroll = BareMetal.Workers.throttle(renderPreview, 33);
```

### `read(fn)` → `function`

Queues a function for the next read batch on `requestAnimationFrame`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Read-phase callback. |

**Example:**
```js
BareMetal.Workers.read(() => {
  const width = panel.offsetWidth;
  console.log(width);
});
```

### `write(fn)` → `function`

Queues a function for the next write batch after queued reads finish.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Write-phase callback. |

**Example:**
```js
BareMetal.Workers.write(() => {
  panel.style.width = '320px';
});
```

### `nextFrame(fn)` → `number`

Schedules a callback on the next animation frame (or a timeout fallback).

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Callback receiving the frame timestamp. |

**Example:**
```js
const frameId = BareMetal.Workers.nextFrame(ts => console.log(ts));
```

### `cancelFrame(id)` → `void`

Cancels a frame scheduled by `nextFrame()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | number | — | Frame or timeout handle returned by `nextFrame()`. |

**Example:**
```js
BareMetal.Workers.cancelFrame(frameId);
```

### `idle(fn, opts)` → `number`

Schedules work for an idle period using `requestIdleCallback` with a timeout fallback.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Callback receiving an idle deadline-like object. |
| opts | object | `{}` | Native idle options when supported. |

**Example:**
```js
const idleId = BareMetal.Workers.idle(deadline => {
  console.log(deadline.didTimeout);
});
```

### `cancelIdle(id)` → `void`

Cancels a job scheduled by `idle()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | number | — | Idle callback or timeout handle. |

**Example:**
```js
BareMetal.Workers.cancelIdle(idleId);
```

### `idleQueue(tasks, opts)` → `object`

Runs an array of functions over one or more idle slices.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| tasks | function[] | `[]` | Task callbacks executed in order. |
| opts | object | `{}` | Supports `chunkTime`, `onProgress`, `onComplete`, and native idle options. |

**Example:**
```js
const queue = BareMetal.Workers.idleQueue([
  () => indexChunk(0),
  () => indexChunk(1)
], {
  onProgress(done, total) { console.log(done, total); }
});
```

### `taskQueue(opts)` → `queue`

Creates an in-memory async task queue with priority ordering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `undefined` | Supports `concurrency` and `priorities`. |

**Example:**
```js
const queue = BareMetal.Workers.taskQueue({ concurrency: 2 });
```

### `delay(ms)` → `Promise<void>`

Resolves after `ms` milliseconds.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| ms | number | `0` | Delay duration. |

**Example:**
```js
await BareMetal.Workers.delay(100);
```

### `interval(fn, ms)` → `object`

Starts an interval and returns `.stop()` / `.restart()` controls.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Interval callback. |
| ms | number | `0` | Interval duration. |

**Example:**
```js
const ticker = BareMetal.Workers.interval(() => console.log('tick'), 1000);
```

### `timeout(valueOrPromise, ms)` → `Promise<any>`

Wraps a value or promise and rejects if it does not settle before `ms`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| valueOrPromise | any | — | Immediate value or promise to race. |
| ms | number | `0` | Timeout duration. |

**Example:**
```js
await BareMetal.Workers.timeout(fetch('/api/data'), 3000);
```

### `retry(fn, opts)` → `Promise<any>`

Retries an async task until it succeeds or attempts are exhausted.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function invoked on each attempt. |
| opts | object | `{}` | Supports `attempts`, `delay`, and `backoff`. |

**Example:**
```js
const result = await BareMetal.Workers.retry(loadConfig, {
  attempts: 5,
  delay: 200,
  backoff: 2
});
```

### `cleanup()` → `void`

Cancels timers, intervals, RAF callbacks, idle callbacks, and queued read/write batches tracked by this module.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
BareMetal.Workers.cleanup();
```

### `runner.run(payload, transfer)` → `Promise<any>`

Posts work to a worker created by `create()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| payload | any | — | Data sent to the worker function. |
| transfer | array | `undefined` | Optional transfer list for `postMessage`. |

**Example:**
```js
const result = await hashWorker.run('abc');
```

### `runner.terminate()` → `void`

Rejects pending jobs, terminates the worker, and revokes the generated blob URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
hashWorker.terminate();
```

### `workerHandle.send(data, transfer)` → `workerHandle`

Posts a message to a worker created by `spawn()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| data | any | — | Message payload. |
| transfer | array | `undefined` | Optional transfer list. |

**Example:**
```js
worker.send(21);
```

### `workerHandle.on(event, handler)` → `workerHandle`

Subscribes to worker events such as `message` or `error`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| event | string | — | Event name. |
| handler | function | — | Callback receiving `event.data` when available. |

**Example:**
```js
worker.on('message', value => console.log(value));
```

### `workerHandle.terminate()` → `void`

Terminates a spawned worker and revokes its blob URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
worker.terminate();
```

### `sharedHandle.send(data, transfer)` → `sharedHandle`

Posts a message through the shared worker port.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| data | any | — | Message payload. |
| transfer | array | `undefined` | Optional transfer list. |

**Example:**
```js
shared.send({ type: 'ping' });
```

### `sharedHandle.on(event, handler)` → `sharedHandle`

Subscribes to shared worker port events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| event | string | — | Event name, usually `message`. |
| handler | function | — | Callback receiving `event.data` when available. |

**Example:**
```js
shared.on('message', data => console.log(data));
```

### `sharedHandle.close()` → `void`

Closes the shared worker port and revokes the generated blob URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
shared.close();
```

### `pool.run(data, transfer)` → `Promise<any>`

Queues one job in the worker pool.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| data | any | — | Job payload. |
| transfer | array | `undefined` | Optional transfer list. |

**Example:**
```js
const total = await pool.run({ values: [1, 2, 3] });
```

### `pool.runAll(items)` → `Promise<any[]>`

Queues many jobs and resolves when all complete.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| items | array | `[]` | Array of payloads or `{ data, transfer }` job objects. |

**Example:**
```js
const results = await pool.runAll([{ values: [1] }, { values: [2] }]);
```

### `pool.map(items, fn)` → `Promise<any[]>`

Splits input into chunks across pool workers. When `fn` is provided, a temporary worker maps each chunk item with that function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| items | array | `[]` | Items to split across workers. |
| fn | function | `undefined` | Optional per-item mapper. |

**Example:**
```js
const doubled = await pool.map([1, 2, 3, 4], n => n * 2);
```

### `pool.terminate()` → `void`

Rejects queued jobs and terminates every worker in the pool.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
pool.terminate();
```

### `pool.stats()` → `object`

Returns pool activity counters.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(pool.stats());
```

### `queue.add(fn, opts)` → `Promise<any>`

Adds an async task to a priority queue.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Task function, typically returning a promise. |
| opts | object | `{}` | Supports `priority` and `id`. |

**Example:**
```js
queue.add(() => fetch('/high-priority'), { priority: 'high' });
```

### `queue.pause()` → `void`

Stops starting new tasks while allowing running work to finish.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
queue.pause();
```

### `queue.resume()` → `void`

Restarts queue processing.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
queue.resume();
```

### `queue.clear()` → `void`

Rejects all queued-but-not-running tasks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
queue.clear();
```

### `queue.stats()` → `object`

Returns queue counters for running, queued, and completed work.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(queue.stats());
```

### `idleQueue.cancel()` → `void`

Stops any remaining idle-queue work.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
queue.cancel();
```

### `interval.stop()` → `void`

Stops an interval created by `interval()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
ticker.stop();
```

### `interval.restart()` → `number`

Restarts the interval and returns the new timer handle.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
ticker.restart();
```

## Notes

- `create()`, `spawn()`, and `shared()` require Blob-backed inline workers; unsupported browsers throw immediately.
- Pool timeouts replace the timed-out worker instance before continuing queued jobs.
- `read()` callbacks run before queued `write()` callbacks in the same frame.
- `idleQueue()` is good for chunked indexing or cache warmup work that should yield between slices.
- `cleanup()` clears scheduler state and timers, but it does not terminate pools or workers you created manually.
