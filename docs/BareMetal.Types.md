# BareMetal.Types

> Runtime type registry, contracts, guards, reflection, and typed serialization helpers.

**Size:** 35 KB source / 18 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Types.min.js"></script>
<script>
  BareMetal.Types.define('User', {
    fields: {
      id: 'number',
      name: 'string',
      email: BareMetal.Types.optional('string')
    }
  });

  const result = BareMetal.Types.check({ id: 7, name: 'Ada' }, 'User');
  console.log(result.ok, result.errors);
</script>
```

## API Reference

### `define(name, descriptor)` → `object`

Registers a named runtime type.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Type name to register. |
| descriptor | object | — | Type descriptor containing `fields`, validators, serializers, or metadata. |

**Example:**
```js
BareMetal.Types.define('Money', {
  fields: {
    amount: 'number',
    currency: 'string'
  }
});
```

### `check(value, type)` → `{ ok, errors }`

Validates a value against a type definition.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to validate. |
| type | string \| object | — | Built-in, custom, or composed type descriptor. |

**Example:**
```js
const result = BareMetal.Types.check({ amount: 9.99, currency: 'GBP' }, 'Money');
```

### `is(value, type)` → `boolean`

Boolean shorthand for `check(value, type).ok`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to validate. |
| type | string \| object | — | Type to test. |

**Example:**
```js
BareMetal.Types.is(['a', 'b'], 'array');
```

### `assert(value, type)` → `any`

Asserts that a value matches a type or throws a `TypeError`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to assert. |
| type | string \| object | — | Expected type. |

**Example:**
```js
const user = BareMetal.Types.assert({ id: 1, name: 'Ada' }, 'User');
```

### `cast(value, type)` → `any`

Attempts to coerce a value into the requested type.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Source value. |
| type | string \| object | — | Target type. |

**Example:**
```js
const count = BareMetal.Types.cast('42', 'number');
```

### `of(value)` → `string`

Returns the inferred built-in or registered type name for a value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to inspect. |

**Example:**
```js
BareMetal.Types.of(new Date());
```

### `registry` → `object`

Direct access to the internal type registry.

**Methods:**

| Method | Description |
|--------|-------------|
| `register(name, descriptor)` | Registers a type. |
| `get(name)` | Returns one descriptor or `null`. |
| `has(name)` | Returns `true` when a type exists. |
| `list()` | Returns all registered type names. |
| `remove(name)` | Removes a non-built-in type. |

**Example:**
```js
const names = BareMetal.Types.registry.list();
```

### `contract(input, output)` → `function`

Builds a function wrapper that validates inputs and outputs.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | string \| object | — | Input type or tuple descriptor. |
| output | string \| object | — | Output type. |

**Example:**
```js
const add = BareMetal.Types.contract(
  BareMetal.Types.tuple('number', 'number'),
  'number'
)((a, b) => a + b);
```

### `guard(type)` → `function`

Returns a predicate function for one type.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string \| object | — | Type to guard. |

**Example:**
```js
const isUser = BareMetal.Types.guard('User');
```

### `union(...types)` → `object`

Creates a union type descriptor.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| types | Array<string \| object> | — | Allowed type alternatives. |

**Example:**
```js
const stringOrNumber = BareMetal.Types.union('string', 'number');
```

### `intersection(...types)` → `object`

Creates an intersection type descriptor.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| types | Array<string \| object> | — | Types that must all match. |

**Example:**
```js
const namedEntity = BareMetal.Types.intersection('object', { fields: { name: 'string' } });
```

### `literal(value)` → `object`

Creates a type descriptor that matches one exact value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Literal value to match. |

**Example:**
```js
const published = BareMetal.Types.literal('published');
```

### `tuple(...types)` → `object`

Creates an ordered tuple descriptor.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| types | Array<string \| object> | — | Expected item types by index. |

**Example:**
```js
const point = BareMetal.Types.tuple('number', 'number');
```

### `record(keyType, valueType)` → `object`

Creates a record descriptor for object key/value pairs.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| keyType | string \| object | — | Expected key type. |
| valueType | string \| object | — | Expected value type. |

**Example:**
```js
const headersType = BareMetal.Types.record('string', 'string');
```

### `nullable(type)` → `object`

Creates a type descriptor that accepts `null` or the supplied type.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string \| object | — | Wrapped type. |

**Example:**
```js
const maybeDate = BareMetal.Types.nullable('date');
```

### `optional(type)` → `object`

Creates a type descriptor that accepts `undefined` or the supplied type.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string \| object | — | Wrapped type. |

**Example:**
```js
const maybeEmail = BareMetal.Types.optional('string');
```

### `reflect(typeName)` → `object | null`

Returns metadata for a registered type.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| typeName | string | — | Registered type name. |

**Example:**
```js
const info = BareMetal.Types.reflect('User');
```

### `serialize(value, type)` → `any`

Serializes a typed value into JSON-safe data.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to serialize. |
| type | string \| object | — | Type descriptor used during serialization. |

**Example:**
```js
const json = BareMetal.Types.serialize(new Set(['a', 'b']), 'set');
```

### `deserialize(data, type)` → `any`

Restores typed data from serialized form.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| data | any | — | Serialized value. |
| type | string \| object | — | Target type descriptor. |

**Example:**
```js
const tags = BareMetal.Types.deserialize(['a', 'b'], 'set');
```

### `equals(a, b, type)` → `boolean`

Performs typed deep equality checks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| a | any | — | First value. |
| b | any | — | Second value. |
| type | string \| object | — | Type descriptor to guide comparison. |

**Example:**
```js
BareMetal.Types.equals(new Date('2024-01-01'), new Date('2024-01-01'), 'date');
```

### `clone(value, type)` → `any`

Clones a typed value deeply.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to clone. |
| type | string \| object | — | Type descriptor to guide cloning. |

**Example:**
```js
const copy = BareMetal.Types.clone({ id: 1, tags: new Set(['a']) }, 'object');
```

## Notes
- Built-in types include primitives plus `date`, `regexp`, `map`, `set`, `promise`, `symbol`, and `bigint`.
- `assert()` throws one `TypeError` whose `errors` property contains the detailed validation failures.
- `contract()` validates resolved values from async functions as well as direct return values.
- `serialize()` and `deserialize()` have special handling for `Date`, `RegExp`, `Map`, `Set`, arrays, and custom registered types.
