# BareMetal.PubSub

> Wildcard-aware event bus with namespaces, sticky events, replayable channels, middleware, and request/response helpers.

**Size:** 10 KB source / 4 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.PubSub.min.js"></script>
<script>
  const bus = BareMetal.PubSub.create();

  bus.on('chat.**', (message, meta) => {
    console.log('wildcard:', meta.topic, message.text);
  });

  bus.on('chat.message', message => {
    console.log('exact:', message.user, message.text);
  });

  bus.emit('chat.message', { user: 'Ada', text: 'Hello world' });
</script>
```

## API Reference

### `create()` → `bus`

Creates a fresh bus instance with the same API as `BareMetal.PubSub`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const appBus = BareMetal.PubSub.create();
const auditBus = BareMetal.PubSub.create();
```

### `on(topic, handler, opts)` → `function`

Subscribes to a topic and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Exact topic or wildcard pattern such as `user.*` or `user.**`. |
| handler | function | — | Receives `(data, meta)`. |
| opts | object | `undefined` | Optional subscription options. Supports `ns` for namespace tagging. |

**Example:**
```js
const off = BareMetal.PubSub.on('user.*', (payload, meta) => {
  console.log(meta.topic, payload);
});
```

### `once(topic, handler, opts)` → `function`

Subscribes once, then removes itself after the first matching event.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Exact topic or wildcard pattern. |
| handler | function | — | Receives `(data, meta)`. |
| opts | object | `undefined` | Optional subscription options such as `ns`. |

**Example:**
```js
BareMetal.PubSub.once('auth.ready', session => {
  console.log('first session only', session.userId);
});
```

### `emit(topic, data, opts)` → `bus`

Publishes an event to exact and wildcard subscribers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Topic to publish. |
| data | any | — | Payload delivered to subscribers. |
| opts | object | `undefined` | Optional emit options. Supports `async` and `source`. |

**Example:**
```js
BareMetal.PubSub.emit('orders.created', { id: 42 }, { source: 'checkout' });
```

### `sticky(topic, data, opts)` → `bus`

Stores the latest value for a topic, then emits it immediately. Later exact-topic subscribers replay the sticky payload on subscribe.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Topic to store and emit. |
| data | any | — | Sticky payload. |
| opts | object | `undefined` | Optional emit metadata such as `source` or `async`. |

**Example:**
```js
BareMetal.PubSub.sticky('config.loaded', { locale: 'en-GB' });

BareMetal.PubSub.on('config.loaded', cfg => {
  console.log(cfg.locale); // replays immediately
});
```

### `off(topic, handler)` → `bus`

Removes a specific handler, or every handler on `topic` when `handler` is omitted.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Topic whose subscriptions should be removed. |
| handler | function | `undefined` | Specific handler to remove. |

**Example:**
```js
function logOrder(order) { console.log(order.id); }
BareMetal.PubSub.on('orders.created', logOrder);
BareMetal.PubSub.off('orders.created', logOrder);
```

### `offAll(topic)` → `bus`

Removes all subscriptions registered for one topic or pattern.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Topic or wildcard pattern to clear. |

**Example:**
```js
BareMetal.PubSub.offAll('orders.*');
```

### `offNs(ns)` → `bus`

Removes all subscriptions tagged with a namespace.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| ns | string | — | Namespace value passed in `opts.ns` during subscription. |

**Example:**
```js
BareMetal.PubSub.on('chat.message', render, { ns: 'ui' });
BareMetal.PubSub.on('chat.typing', renderTyping, { ns: 'ui' });
BareMetal.PubSub.offNs('ui');
```

### `clear()` → `bus`

Resets subscriptions, sticky values, middleware, and request handlers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
BareMetal.PubSub.clear();
```

### `use(pattern, fn)` → `function`

Registers middleware that runs before `emit()` and `request()`. Middleware must call `next()` to continue the pipeline.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| pattern | string \| function | — | Topic filter, or the middleware function itself for all topics. |
| fn | function | `undefined` | Middleware signature: `(topic, data, next)`. |

**Example:**
```js
const stop = BareMetal.PubSub.use('orders.**', (topic, data, next) => {
  console.log('middleware', topic, data);
  next();
});
```

### `handle(topic, handler)` → `function`

Registers a request handler for `request()` calls and returns an unregister function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Request topic. |
| handler | function | — | Receives `(data, meta)` and may return a value or promise. |

**Example:**
```js
const dispose = BareMetal.PubSub.handle('math.add', ({ a, b }) => a + b);
```

### `request(topic, data)` → `Promise<any>`

Calls a request handler through the middleware pipeline.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Request topic. |
| data | any | — | Payload passed to the handler. |

**Example:**
```js
BareMetal.PubSub.handle('users.load', async ({ id }) => ({ id, name: 'Ada' }));
const user = await BareMetal.PubSub.request('users.load', { id: 7 });
```

### `channel(topic, opts)` → `channel`

Creates a topic-focused helper with validation and replay buffering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Backing topic used for emit/subscribe. |
| opts | object | `undefined` | Channel options. Supports `replay` and `validate(data)`. |

**Example:**
```js
const prices = BareMetal.PubSub.channel('prices.updated', {
  replay: 3,
  validate: value => typeof value === 'number'
});

prices.emit(10.5);
prices.emit(11.25);
```

### `topics()` → `string[]`

Returns topics or patterns that currently have subscribers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.PubSub.topics());
```

### `subscribers(topic)` → `number`

Counts exact and wildcard subscribers that would receive `topic`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Topic to inspect. |

**Example:**
```js
console.log(BareMetal.PubSub.subscribers('orders.created'));
```

### `has(topic)` → `boolean`

Returns `true` when at least one subscriber matches `topic`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| topic | string | — | Topic to inspect. |

**Example:**
```js
if (BareMetal.PubSub.has('orders.created')) {
  BareMetal.PubSub.emit('orders.created', { id: 1 });
}
```

### `channel.emit(data, emitOpts)` → `boolean`

Publishes through a channel. Returns `false` if the channel was destroyed or validation failed.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| data | any | — | Payload to publish. |
| emitOpts | object | `undefined` | Optional emit metadata such as `source` or `async`. |

**Example:**
```js
const channel = BareMetal.PubSub.channel('metrics.tick', { validate: n => typeof n === 'number' });
channel.emit(1);
```

### `channel.subscribe(fn, subOpts)` → `function`

Replays buffered items first, then subscribes to future events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Receives `(data, meta)`. |
| subOpts | object | `undefined` | Optional subscription options such as `ns`. |

**Example:**
```js
const channel = BareMetal.PubSub.channel('logs', { replay: 2 });
channel.emit('a');
channel.emit('b');
channel.subscribe(value => console.log(value)); // prints a, b immediately
```

### `channel.history()` → `any[]`

Returns the replay buffer payloads.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(channel.history());
```

### `channel.last()` → `any | null`

Returns the last replayed value, or `null` when the buffer is empty.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(channel.last());
```

### `channel.destroy()` → `void`

Unsubscribes channel listeners, clears replay state, and prevents future emits.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
channel.destroy();
```

## Notes

- `*` matches a single topic segment, while `**` matches zero or more segments.
- Subscriber handlers receive a `meta` object with `topic`, `timestamp`, and `source`.
- Sticky replay is keyed by the exact topic name; wildcard subscriptions do not automatically receive old sticky values.
- `request()` rejects when no handler is registered for the topic.
- Middleware must call `next()` or the publish/request chain stops.
