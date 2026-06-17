# BareMetal.Diagnostics

> Trace spans, timelines, metrics, mutation watching, and performance reporting.

**Size:** 25 KB source / 11 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Diagnostics.min.js"></script>
<script>
  const fetchUser = BareMetal.Diagnostics.trace('users.fetch', async id => {
    const response = await fetch('/api/users/' + id);
    return response.json();
  });

  fetchUser(42).then(console.log);
</script>
```

## API Reference

### `trace(name, fn)` → `function`

Wraps a function so each call is recorded as a diagnostics span.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Span name to record. |
| fn | function | — | Function to wrap. |

**Example:**
```js
const save = BareMetal.Diagnostics.trace('order.save', async order => api.save(order));
```

### `span(name, opts)` → `object`

Creates a manual span with events and attributes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Span name. |
| opts | object | `{}` | Span options such as `parent` and `attributes`. |

**Example:**
```js
const span = BareMetal.Diagnostics.span('checkout', {
  attributes: { cartSize: 3 }
});
span.addEvent('validated');
span.end({ ok: true });
```

**Span methods:**

| Method | Description |
|--------|-------------|
| `end(data)` | Ends the span and records optional result data. |
| `addEvent(eventName, data)` | Attaches a named event. |
| `setAttribute(key, value)` | Adds or updates a span attribute. |
| `context` | The raw span context object. |

### `timeline()` → `object`

Returns the internal timeline recorder used for marks, measures, and events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
const timeline = BareMetal.Diagnostics.timeline();
timeline.mark('render:start');
timeline.mark('render:end');
timeline.measure('render', 'render:start', 'render:end');
```

**Timeline methods:**

| Method | Description |
|--------|-------------|
| `record(type, data)` | Adds a timeline event. |
| `mark(name)` | Records a named mark. |
| `measure(name, start, end)` | Records a duration between two marks. |
| `getEvents()` | Returns timeline events. |
| `getDuration()` | Returns total recorded duration. |
| `clear()` | Clears timeline state. |
| `export()` | Exports a serialisable snapshot. |

### `inspect(value, opts)` → `object`

Builds a structural summary of a value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to inspect. |
| opts | object | `{}` | Inspection options such as `maxDepth`. |

**Example:**
```js
const summary = BareMetal.Diagnostics.inspect({ order: { id: 42, lines: [] } }, { maxDepth: 2 });
```

### `why(value, history)` → `array`

Explains matching entries from the internal mutation history.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Path string or value to search for. |
| history | array | `undefined` | Optional mutation history override. |

**Example:**
```js
const reasons = BareMetal.Diagnostics.why('cart.total');
```

### `watch(target, path, callback)` → `function`

Watches a dotted property path and fires a callback when it changes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | object | — | Root object to watch. |
| path | string | — | Dotted path such as `cart.total`. |
| callback | function | — | Handler for changes. |

**Example:**
```js
const stop = BareMetal.Diagnostics.watch(state, 'cart.total', next => {
  console.log('total changed', next);
});
```

### `perf` → `object`

Performance helper for marks, measures, and aggregate stats.

**Methods:**

| Method | Description |
|--------|-------------|
| `mark(name)` | Records a performance mark. |
| `measure(name, start, end)` | Records a performance measure. |
| `getMarks()` | Returns all marks. |
| `getMeasures()` | Returns all measures. |
| `clear()` | Clears marks and measures. |
| `aggregate(name)` | Returns count, avg, min, max, p50, p95, and p99 stats for a measure name. |

**Example:**
```js
BareMetal.Diagnostics.perf.mark('load:start');
BareMetal.Diagnostics.perf.mark('load:end');
BareMetal.Diagnostics.perf.measure('load', 'load:start', 'load:end');
```

### `counter(name)` → `object`

Creates a named counter metric.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Counter name. |

**Example:**
```js
const errors = BareMetal.Diagnostics.counter('errors');
errors.increment();
```

**Counter methods:**

| Method | Description |
|--------|-------------|
| `increment(amount)` | Increases the counter. |
| `decrement(amount)` | Decreases the counter. |
| `value()` | Returns the current value. |
| `reset()` | Resets the counter to zero. |

### `gauge(name, fn)` → `object`

Creates a sampled gauge backed by a value function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Gauge name. |
| fn | function | — | Sampling function. |

**Example:**
```js
const heap = BareMetal.Diagnostics.gauge('heap', () => performance.memory?.usedJSHeapSize || 0);
heap.sample();
```

**Gauge methods:**

| Method | Description |
|--------|-------------|
| `value()` | Returns the latest sampled value. |
| `sample()` | Samples immediately. |
| `history()` | Returns previous samples. |

### `report()` → `object`

Returns a diagnostics snapshot covering timeline, counters, gauges, spans, and measures.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
const report = BareMetal.Diagnostics.report();
```

### `enable()` → `boolean`

Enables diagnostics collection and gauge sampling.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
BareMetal.Diagnostics.enable();
```

### `disable()` → `boolean`

Disables diagnostics collection and stops active gauge timers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
BareMetal.Diagnostics.disable();
```

### `hook(moduleName, instance)` → `object`

Wraps enumerable and prototype methods on an instance with traced versions.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| moduleName | string | — | Prefix used when naming traced methods. |
| instance | object | — | Object instance to instrument. |

**Example:**
```js
BareMetal.Diagnostics.hook('api', apiClient);
```

## Notes
- `trace()` preserves sync and async return values and records rejected promises as errors.
- `watch()` temporarily replaces property descriptors, then restores them when you unsubscribe.
- `disable()` also stops background gauge sampling until `enable()` is called again.
- `hook()` skips methods that are already traced, which keeps repeated instrumentation safe.
