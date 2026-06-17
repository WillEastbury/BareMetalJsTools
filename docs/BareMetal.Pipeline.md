# BareMetal.Pipeline

> Async pipelines, stream transforms, retries, batching, and backpressure controls.

**Size:** 21 KB source / 10 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Pipeline.min.js"></script>
<script>
  const pipeline = BareMetal.Pipeline.create(
    value => value.trim(),
    value => value.toUpperCase()
  ).tap(value => console.log('stage output', value));

  pipeline.execute('  ready  ').then(console.log);
</script>
```

## API Reference

### `create(...stages)` → `object`

Creates a chainable async pipeline.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stages | function[] | — | Initial stage functions. |

**Example:**
```js
const pipeline = BareMetal.Pipeline.create(
  value => value + 1,
  value => value * 2
);
```

**Pipeline methods:**

| Method | Description |
|--------|-------------|
| `execute(input, opts)` | Runs the pipeline and returns a promise. |
| `pipe(stage)` | Appends a stage. |
| `prepend(stage)` | Inserts a stage at the front. |
| `tap(fn)` | Runs a side-effect stage and forwards the value. |
| `filter(predicate)` | Drops values that do not pass the predicate. |
| `branch(predicate, ifTrue, ifFalse)` | Routes values through one of two stages. |
| `retry(stage, policy)` | Appends a retry-wrapped stage. |
| `timeout(stage, ms)` | Appends a stage with a timeout guard. |
| `parallel(stages)` | Appends a `Promise.all` stage. |
| `batch(size, fn)` | Buffers items into batches before processing. |
| `debounce(ms)` | Debounces pipeline execution. |

### `compose(...fns)` → `function`

Composes functions from right to left.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fns | function[] | — | Functions to compose. |

**Example:**
```js
const format = BareMetal.Pipeline.compose(
  value => value.toUpperCase(),
  value => value.trim()
);
```

### `series(fns, input, ctx)` → `Promise<any>`

Runs functions sequentially with a shared input and optional context.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fns | function[] | — | Functions to run in order. |
| input | any | — | Initial input. |
| ctx | object | `undefined` | Optional execution context. |

**Example:**
```js
const result = await BareMetal.Pipeline.series([
  x => x + 1,
  x => x * 2
], 3);
```

### `parallel(fns, input, ctx)` → `Promise<Array>`

Runs functions in parallel with the same input.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fns | function[] | — | Functions to run in parallel. |
| input | any | — | Shared input. |
| ctx | object | `undefined` | Optional execution context. |

**Example:**
```js
const values = await BareMetal.Pipeline.parallel([
  x => x + 1,
  x => x * 10
], 5);
```

### `waterfall(fns)` → `function`

Creates a reducer-style function that pipes a value through each step.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fns | function[] | — | Functions to chain. |

**Example:**
```js
const transform = BareMetal.Pipeline.waterfall([
  x => ({ total: x }),
  data => ({ ...data, ready: true })
]);
```

### `stream(iterable)` → `object`

Wraps an iterable or async iterable in a fluent async stream helper.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| iterable | Iterable \| AsyncIterable | — | Source data stream. |

**Example:**
```js
const values = await BareMetal.Pipeline
  .stream([1, 2, 3, 4])
  .map(x => x * 2)
  .filter(x => x > 4)
  .collect();
```

**Stream methods:**

| Method | Description |
|--------|-------------|
| `map(fn)` | Transforms each item. |
| `filter(predicate)` | Keeps matching items. |
| `reduce(fn, init)` | Reduces the stream to one value. |
| `take(n)` | Takes the first `n` items. |
| `skip(n)` | Skips the first `n` items. |
| `chunk(n)` | Groups items into arrays of size `n`. |
| `flatten()` | Flattens nested iterables. |
| `throttle(ms)` | Delays emission between items. |
| `buffer(n)` | Buffers items before emitting chunks. |
| `merge(other)` | Merges another iterable into the stream. |
| `collect()` | Collects all output into an array. |
| `forEach(fn)` | Consumes each item with a callback. |
| `first()` | Resolves the first item or `undefined`. |

### `backpressure(producer, consumer, opts)` → `object`

Coordinates a producer and consumer with high/low water marks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| producer | function | — | Producer that receives a controller. |
| consumer | function | — | Consumer called for each queued item. |
| opts | object | `{}` | Options such as `highWaterMark`, `lowWaterMark`, `onPressure`, and `onDrain`. |

**Example:**
```js
const flow = BareMetal.Pipeline.backpressure(
  async control => {
    for (const item of [1, 2, 3]) await control.push(item);
    control.stop();
  },
  async item => console.log('consumed', item),
  { highWaterMark: 2 }
);
flow.start();
```

**Backpressure methods:**

| Method | Description |
|--------|-------------|
| `start()` | Starts the producer/consumer loop. |
| `pause()` | Pauses consumption. |
| `resume()` | Resumes consumption. |
| `stop()` | Stops the controller. |

## Notes
- `execute()` accepts `signal`, `timeout`, and `onStage` for cancellation and instrumentation.
- `filter()` uses the module’s dropped-sentinel behavior, so downstream stages are skipped when a value is rejected.
- `retry()` supports exponential backoff through the supplied policy object.
- `stream()` works with both sync and async iterables, which makes it useful for DOM, network, or worker-fed flows.
