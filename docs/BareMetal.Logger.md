# BareMetal.Logger

> Structured logger with levels, child loggers, pluggable transports, and a batched `sendBeacon` transport.

**Size:** 4.7 KB source / 2.5 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Logger.min.js"></script>
<script>
var log = BareMetal.Logger.create({
  level: 'info',
  context: { app: 'orders-ui' },
  transports: [
    BareMetal.Logger.console,
    BareMetal.Logger.beacon('/client-logs')
  ]
});

log.info('Page loaded', { path: location.pathname });
log.warn('Inventory is low', { sku: 'ABC-123' });
</script>
```

## API Reference

### `create(opts)` → `logger`

Creates a logger instance.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Logger configuration |

**Example:**
```js
var log = BareMetal.Logger.create({
  level: 'debug',
  context: { service: 'checkout' }
});
```

### `console(record)` → `void`

Default transport that writes to `console.log`, `console.warn`, or `console.error`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| record | object | — | Structured log record |

**Example:**
```js
var log = BareMetal.Logger.create({ transports: [BareMetal.Logger.console] });
```

### `beacon(url)` → `function`

Creates a transport that batches log records and ships them with `navigator.sendBeacon()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | Beacon endpoint |

**Example:**
```js
var beaconTransport = BareMetal.Logger.beacon('/api/client-logs');
```

### `logger.debug(msg, data)` → `void`

Logs a debug message.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| msg | any | — | Message text |
| data | any | — | Optional structured payload |

**Example:**
```js
log.debug('Form state', { dirty: true });
```

### `logger.info(msg, data)` → `void`

Logs an info message.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| msg | any | — | Message text |
| data | any | — | Optional structured payload |

**Example:**
```js
log.info('Saved order', { id: 42 });
```

### `logger.warn(msg, data)` → `void`

Logs a warning message.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| msg | any | — | Message text |
| data | any | — | Optional structured payload |

**Example:**
```js
log.warn('Retrying request', { attempt: 2 });
```

### `logger.error(msg, data)` → `void`

Logs an error message.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| msg | any | — | Message text |
| data | any | — | Optional structured payload |

**Example:**
```js
log.error('Checkout failed', new Error('Gateway timeout'));
```

### `logger.child(extraContext)` → `logger`

Creates a child logger with merged context and the same level/transports.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| extraContext | object | — | Additional context fields |

**Example:**
```js
var orderLog = log.child({ orderId: 42 });
orderLog.info('Payment authorised');
```

### `logger.setLevel(level)` → `number`

Changes the minimum log level and returns its numeric value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| level | string \| number | — | `debug`, `info`, `warn`, `error`, or `0-3` |

**Example:**
```js
log.setLevel('warn');
```

### `logger.addTransport(fn)` → `function`

Adds a transport function at runtime. The returned function removes it again.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Transport callback |

**Example:**
```js
var buffer = [];
var stop = log.addTransport(function (record) {
  buffer.push(record);
});
```

## Configuration / Options

### `create()` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | string \| number | `'info'` | Minimum level to emit |
| `context` | object | `{}` | Shared context object copied into every record |
| `transports` | function \| function[] | `[BareMetal.Logger.console]` | One or more transport callbacks |

### Log levels

| Level | Numeric value |
|-------|---------------|
| `debug` | `0` |
| `info` | `1` |
| `warn` | `2` |
| `error` | `3` |

### Record shape

| Field | Type | Description |
|-------|------|-------------|
| `level` | string | Emitted level name |
| `msg` | string | Message text coerced with `String()` |
| `data` | any | Optional payload |
| `context` | object | Shared logger context |
| `ts` | string | ISO timestamp |

## Examples

### Example 1: Ship logs to the server
```html
<script src="BareMetal.Logger.min.js"></script>
<script>
var log = BareMetal.Logger.create({
  level: 'info',
  context: { app: 'support-console' },
  transports: [BareMetal.Logger.beacon('/logs/client')]
});

window.addEventListener('error', function (event) {
  log.error('Unhandled browser error', {
    message: event.message,
    file: event.filename,
    line: event.lineno
  });
});
</script>
```

### Example 2: Capture logs in tests or dev tools
```js
var records = [];
var log = BareMetal.Logger.create({
  level: 'debug',
  transports: [function (record) { records.push(record); }]
});

log.debug('Rendered widget', { id: 'w-1' });
```

## Notes
- Invalid or unknown levels fall back to `info`.
- Transport exceptions are swallowed so logging does not crash the app.
- The beacon transport batches up to 10 records, flushes after about 1 second, and also flushes on `visibilitychange`, `pagehide`, and `unload`.
- Beacon payloads are JSON-serialised safely: `Error` objects are expanded and circular references become `"[Circular]"`.
- There is no public manual `flush()` for beacon transports.
