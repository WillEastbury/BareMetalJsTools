# BareMetal.Errors

> Typed error helpers for classification, chaining, serialization, matching, aggregation, and fault boundaries.

**Size:** 20 KB source / 10 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Errors.min.js"></script>
<script>
  BareMetal.Errors.codes.register('USER_LOOKUP_FAILED', {
    category: 'network',
    retryable: true,
    userMessage: 'We could not load that user right now.'
  });

  const safeLoadUser = BareMetal.Errors.boundary(async function (id) {
    throw BareMetal.Errors.create('USER_LOOKUP_FAILED', 'Fetch failed');
  }, function (err, info, id) {
    console.warn(info.category, id, err.message);
    return null;
  });
</script>
```

## API Reference

### `new BareMetalError(code, message, opts)` → `Error`

Creates a typed error instance with BareMetal metadata.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| code | string | `'UNKNOWN_ERROR'` | Error code. |
| message | string | `'An unexpected error occurred.'` | Developer-facing message. |
| opts | object | `{}` | Supports `name`, `category`, `retryable`, `cause`, `data`, `userMessage`, `statusCode`, `timestamp`, `stack`, and `errors`. |

**Example:**
```js
const err = new BareMetal.Errors.BareMetalError('AUTH_ERROR', 'Token expired', {
  category: 'auth',
  retryable: false
});
```

### `create(code, message, opts)` → `BareMetalError`

Creates a typed error and merges any defaults registered for the code.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| code | string | inferred | Error code to create. |
| message | string | registered default | Message override. |
| opts | object | `{}` | Same option fields as `BareMetalError`. |

**Example:**
```js
const err = BareMetal.Errors.create('HTTP_429', 'Too many requests');
```

### `classify(err)` → `object`

Infers `{ category, retryable, code }` from numbers, strings, native errors, status codes, and registered defaults.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Error-like value to inspect. |

**Example:**
```js
console.log(BareMetal.Errors.classify(new Error('Failed to fetch')));
```

### `isRetryable(err)` → `boolean`

Reports whether the error is retryable.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Error-like value to inspect. |

**Example:**
```js
if (BareMetal.Errors.isRetryable(err)) retryLater();
```

### `isTransient(err)` → `boolean`

Reports whether the error belongs to `transient`, `network`, or `timeout` categories.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Error-like value to inspect. |

**Example:**
```js
console.log(BareMetal.Errors.isTransient(err));
```

### `chain(err, cause)` → `BareMetalError`

Appends a cause to an error chain and returns a rebuilt top-level error.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Root error. |
| cause | any | — | Cause to append. |

**Example:**
```js
const chained = BareMetal.Errors.chain(primaryErr, secondaryErr);
```

### `getChain(err)` → `Array<BareMetalError>`

Returns the cause chain from root cause to leaf error.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Error-like value with optional causes. |

**Example:**
```js
console.log(BareMetal.Errors.getChain(err));
```

### `toUserSafe(err)` → `object`

Returns a safe message payload shaped as `{ message, code }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Error-like value to sanitize. |

**Example:**
```js
const safe = BareMetal.Errors.toUserSafe(err);
```

### `toJSON(err)` → `object`

Serializes an error, its data, and its cause chain into plain JSON-safe data.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Error-like value to serialize. |

**Example:**
```js
const payload = BareMetal.Errors.toJSON(err);
```

### `fromJSON(obj)` → `BareMetalError`

Rebuilds a typed error from serialized JSON.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| obj | object | — | Serialized error payload. |

**Example:**
```js
const restored = BareMetal.Errors.fromJSON(payload);
```

### `wrap(fn, opts)` → `function`

Wraps a sync or async function and reclassifies thrown errors before rethrowing them.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Function to wrap. |
| opts | object | `{}` | Supports `code`, `category`, and `rethrow`. |

**Example:**
```js
const wrapped = BareMetal.Errors.wrap(async function () {
  throw new Error('offline');
}, { code: 'LOAD_FAILED', category: 'network' });
```

### `assert(condition, code, message)` → `any`

Throws a validation-flavored BareMetal error when the condition is falsy.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| condition | any | — | Condition to test. |
| code | string | `'ASSERTION_FAILED'` | Error code when the assertion fails. |
| message | string | `'Assertion failed.'` | Error message. |

**Example:**
```js
BareMetal.Errors.assert(userId, 'USER_ID_REQUIRED', 'User id is required.');
```

### `codes.register(code, defaults)` → `object | null`

Registers default settings for a code.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| code | string | — | Error code to register. |
| defaults | object | `{}` | Default fields such as `category`, `retryable`, `message`, and `userMessage`. |

**Example:**
```js
BareMetal.Errors.codes.register('SAVE_FAILED', {
  category: 'transient',
  retryable: true
});
```

### `codes.lookup(code)` → `object | null`

Reads registered defaults for a code.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| code | string | — | Error code to look up. |

**Example:**
```js
console.log(BareMetal.Errors.codes.lookup('SAVE_FAILED'));
```

### `match(err, handlers)` → `any`

Routes an error to handlers by exact code, then category, then `default`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| err | any | — | Error-like value to route. |
| handlers | object | — | Handler map keyed by code, category, or `default`. |

**Example:**
```js
BareMetal.Errors.match(err, {
  AUTH_ERROR() { showLogin(); },
  network() { showOffline(); },
  default() { showGenericError(); }
});
```

### `aggregate(errors)` → `BareMetalError`

Combines many errors into one aggregate error and exposes the original list on `.errors`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| errors | array | `[]` | Array of error-like values. |

**Example:**
```js
const agg = BareMetal.Errors.aggregate([err1, err2]);
```

### `boundary(fn, fallback)` → `function`

Wraps a function with one retry for retryable errors, then runs a fallback if the operation still fails.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Sync or async function to protect. |
| fallback | function \| any | — | Fallback handler or static return value. Function form receives `(err, info, ...args)`. |

**Example:**
```js
const safeRead = BareMetal.Errors.boundary(loadSettings, function (err, info) {
  console.warn(info.code, err.message);
  return { theme: 'light' };
});
```

## Notes

- Categories are normalized to `transient`, `permanent`, `auth`, `validation`, `network`, `timeout`, or `unknown`.
- `classify()` understands HTTP-like status codes, DOMException-style names, and common error message text.
- `wrap()` preserves sync return values and only intercepts thrown or rejected errors.
- `aggregate()` stores serialized nested errors in `data.errors` and the live list on `.errors`.
- `boundary()` retries retryable failures once before invoking its fallback.
