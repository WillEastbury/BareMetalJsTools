# BareMetal.Schema

> Runtime schema builders for parsing, validation, coercion, transforms, versioning, JSON descriptors, and Binary wire-type alignment.

**Size:** 31 KB source / 13 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Schema.min.js"></script>
<script>
  const User = BareMetal.Schema.object({
    id: BareMetal.Schema.number({ integer: true, positive: true }),
    email: BareMetal.Schema.string({ trim: true, lowercase: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }),
    active: BareMetal.Schema.boolean({ coerce: true })
  }, { strict: true });

  const parsed = BareMetal.Schema.parse(User, { id: 7, email: ' ADA@EXAMPLE.COM ', active: 'true' });
  console.log(parsed);
</script>
```

## API Reference

### `string(opts)` → `object`

Creates a string schema.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Supports `trim`, `lowercase`, `uppercase`, `min`, `max`, `enum`, `pattern`, `default`, `nullable`, and `optional`. |

**Example:**
```js
const Name = BareMetal.Schema.string({ trim: true, min: 2 });
```

### `number(opts)` → `object`

Creates a number schema.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Supports `integer`, `positive`, `min`, `max`, `wire`, `encoding`, `wireType`, `default`, `nullable`, and `optional`. |

**Example:**
```js
const Age = BareMetal.Schema.number({ integer: true, min: 0 });
```

### `boolean(opts)` → `object`

Creates a boolean schema.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Supports `coerce`, `default`, `nullable`, and `optional`. |

**Example:**
```js
const Flag = BareMetal.Schema.boolean({ coerce: true, default: false });
```

### `array(itemSchema, opts)` → `object`

Creates an array schema.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| itemSchema | object | — | Schema used for each array item. |
| opts | object | `{}` | Supports `min`, `max`, `unique`, `default`, `nullable`, and `optional`. |

**Example:**
```js
const Tags = BareMetal.Schema.array(BareMetal.Schema.string({ trim: true }), { unique: true });
```

### `object(shape, opts)` → `object`

Creates an object schema.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| shape | object | — | Map of field names to child schemas. |
| opts | object | `{}` | Supports `strict`, `default`, `nullable`, and `optional`. |

**Example:**
```js
const User = BareMetal.Schema.object({
  id: BareMetal.Schema.number({ integer: true }),
  name: BareMetal.Schema.string({ min: 1 })
}, { strict: true });
```

### `date(opts)` → `object`

Creates a date schema.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Supports `format`, `min`, `max`, `default`, `nullable`, and `optional`. |

**Example:**
```js
const CreatedAt = BareMetal.Schema.date({ format: 'iso' });
```

### `oneOf(schemas)` → `object`

Creates a union schema that accepts the first matching branch.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schemas | array | — | Array of candidate schemas. |

**Example:**
```js
const Id = BareMetal.Schema.oneOf([
  BareMetal.Schema.number({ integer: true }),
  BareMetal.Schema.string({ min: 1 })
]);
```

### `nullable(schema)` → `object`

Clones a schema and marks it nullable.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to clone. |

**Example:**
```js
const MaybeName = BareMetal.Schema.nullable(BareMetal.Schema.string());
```

### `optional(schema)` → `object`

Clones a schema and marks it optional.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to clone. |

**Example:**
```js
const MaybeAge = BareMetal.Schema.optional(BareMetal.Schema.number());
```

### `custom(name, validateFn, opts)` → `object`

Creates or reuses a named custom validator schema.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Validator name. |
| validateFn | function | registered validator | Validator function returning `true`, `undefined`, `null`, or an error message. |
| opts | object | `{}` | Additional schema options. |

**Example:**
```js
const Even = BareMetal.Schema.custom('even', function (value) {
  return value % 2 === 0 || 'Value must be even.';
});
```

### `parse(schema, data)` → `{ ok, value } | { ok: false, errors }`

Parses input data, applying schema defaults and parse-mode transforms.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to execute. |
| data | any | — | Input value. |

**Example:**
```js
const parsed = BareMetal.Schema.parse(User, payload);
```

### `validate(schema, data)` → `{ valid, errors }`

Validates input without returning transformed values.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to execute. |
| data | any | — | Input value. |

**Example:**
```js
const result = BareMetal.Schema.validate(User, payload);
```

### `transform(schema, data)` → `any`

Transforms data in non-validating mode, applying schema mutations such as trim/case conversion.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to execute. |
| data | any | — | Input value. |

**Example:**
```js
const value = BareMetal.Schema.transform(User, payload);
```

### `coerce(schema, data)` → `any`

Runs coercion mode, converting common strings/numbers to schema types when allowed.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to execute. |
| data | any | — | Input value. |

**Example:**
```js
const coerced = BareMetal.Schema.coerce(User, payload);
```

### `defaults(schema)` → `any`

Builds the schema's default value tree.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to inspect. |

**Example:**
```js
console.log(BareMetal.Schema.defaults(User));
```

### `extend(baseSchema, overrides)` → `object`

Clones an object schema and merges in additional or replacement fields.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| baseSchema | object | — | Base object or versioned object schema. |
| overrides | object | `{}` | Field schema overrides. |

**Example:**
```js
const Admin = BareMetal.Schema.extend(User, {
  role: BareMetal.Schema.string({ default: 'admin' })
});
```

### `pick(schema, keys)` → `object`

Creates an object schema containing only selected keys.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Source object schema. |
| keys | array | `[]` | Keys to keep. |

**Example:**
```js
const PublicUser = BareMetal.Schema.pick(User, ['id', 'name']);
```

### `omit(schema, keys)` → `object`

Creates an object schema without the specified keys.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Source object schema. |
| keys | array | `[]` | Keys to remove. |

**Example:**
```js
const SafeUser = BareMetal.Schema.omit(User, ['password']);
```

### `partial(schema)` → `object`

Clones an object schema and marks every field optional.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Source object schema. |

**Example:**
```js
const PatchUser = BareMetal.Schema.partial(User);
```

### `version(schema, v, migrations)` → `object`

Wraps a schema with a version number and migration metadata.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Base schema. |
| v | number | — | Current version number. |
| migrations | array | `[]` | Migration steps with `from`, `to`, `up`, and `down`. |

**Example:**
```js
const V2User = BareMetal.Schema.version(User, 2, [{
  from: 1,
  to: 2,
  up(data) { data.fullName = data.name; delete data.name; return data; },
  down(data) { data.name = data.fullName; delete data.fullName; return data; }
}]);
```

### `versionedSchema.migrate(data, fromV, toV)` → `any`

Runs migration steps forward or backward between versions.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| data | any | — | Value to migrate. |
| fromV | number | — | Starting version. |
| toV | number | — | Target version. |

**Example:**
```js
const next = V2User.migrate(oldData, 1, 2);
```

### `toJSON(schema)` → `object | null`

Converts a schema into a serializable descriptor, preserving nested shape, defaults, dates, regexes, and version metadata.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Schema to serialize. |

**Example:**
```js
const descriptor = BareMetal.Schema.toJSON(User);
```

### `fromJSON(descriptor)` → `object | null`

Rebuilds a schema from a descriptor created by `toJSON()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| descriptor | object | — | JSON schema descriptor. |

**Example:**
```js
const rebuilt = BareMetal.Schema.fromJSON(descriptor);
```

### `toBinary(schema, opts)` → `object`

Converts an object schema into BareMetal.Binary member metadata for wire-format alignment.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | — | Object schema to convert. |
| opts | object | `{}` | Supports `version` and `schemaHash`. |

**Example:**
```js
const binarySchema = BareMetal.Schema.toBinary(User, { version: 2, schemaHash: 12345 });
```

### `fromBinary(binarySchema)` → `object`

Builds an object schema from BareMetal.Binary-style `{ members }` metadata.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| binarySchema | object | — | Binary schema with `members`. |

**Example:**
```js
const schema = BareMetal.Schema.fromBinary({
  members: [
    { name: 'id', wireType: 'Int32' },
    { name: 'name', wireType: 'String', isNullable: true }
  ]
});
```

## Notes

- `parse()` and `validate()` collect detailed errors shaped as `{ path, message, code }`.
- `transform()` applies string trimming and case normalization, while `coerce()` also converts common string/number inputs.
- `oneOf()` returns the first successful branch; transform/coerce modes fall back to the first branch when none pass cleanly.
- `object(..., { strict: true })` rejects unexpected keys.
- `version()` adds a `.migrate()` helper for forward and backward migration steps.
- `toBinary()` and `fromBinary()` align schema metadata with the BareMetal.Binary wire types, including `toBinary()` / `fromBinary()` support requested for Binary module alignment.
