# BareMetal.Binary

> Signed BSO1 serialization, schema helpers, and binary delta utilities.

**Size:** 22.47 KB source / 13.98 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Binary.min.js"></script>
<script>
  (async () => {
    const key = new Uint8Array(32).fill(7);
    await BareMetal.Binary.setSigningKeyBytes(key);

    const schema = {
      version: 1,
      members: [
        { name: 'Id', wireType: 'Int32' },
        { name: 'Name', wireType: 'String', isNullable: false },
        { name: 'Active', wireType: 'Bool' }
      ]
    };

    const payload = await BareMetal.Binary.serialize({ Id: 1, Name: 'Ada', Active: true }, schema);
    const record = await BareMetal.Binary.deserialize(payload, schema);
    console.log(record);
  })();
</script>
```

## API Reference

### `setSigningKey(base64Key)` → `Promise<void>`

Imports the HMAC-SHA256 signing key from a base64 string.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| base64Key | string | — | Raw key bytes encoded with base64 |

### `setSigningKeyBytes(keyBytes)` → `Promise<void>`

Imports the HMAC-SHA256 signing key from raw bytes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| keyBytes | BufferSource | — | Byte array or `ArrayBuffer` accepted by `crypto.subtle.importKey()` |

**Example:**
```js
await BareMetal.Binary.setSigningKeyBytes(new Uint8Array(32).fill(1));
```

### `fetchSchema(slug, apiRoot)` → `Promise<object>`

Fetches and caches `{apiRoot || '/api/'}_binary/{slug}/_schema`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| slug | string | — | Entity slug |
| apiRoot | string | `'/api/'` | Alternate API root |

### `getCachedSchema(slug)` → `object|null`

Returns the cached schema for a slug or `null`.

### `serialize(object, schema)` → `Promise<ArrayBuffer>`

Serializes an object to a signed BSO1 payload.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| object | object | — | Entity data to encode |
| schema | object | — | Schema with `version` and `members[]` |

**Example:**
```js
const payload = await BareMetal.Binary.serialize(order, schema);
```

### `deserialize(buffer, schema)` → `Promise<object|null>`

Verifies the signature and decodes one object. Returns `null` when the encoded presence flag is `0`.

### `deserializeList(buffer, schema)` → `Promise<(object|null)[]>`

Verifies the signature and decodes a list payload.

### `verifySignature(payload)` → `Promise<boolean>`

Checks the embedded HMAC signature.

### `fetchLayout(slug)` → `Promise<object>`

Fetches `/api/_binary/{slug}/_layout`, caches it, and adds a `_byName` lookup.

### `createTracker(entity, layout)` → `tracker`

Wraps an entity in a proxy that tracks changed fields.

| Property / Method | Type | Description |
|---|---|---|
| `tracker.entity` | object | Proxied entity you mutate |
| `tracker.original` | object | Snapshot of original field values |
| `tracker.changedFields()` | `string[]` | Returns changed field names |
| `tracker.hasChanges()` | `boolean` | Returns `true` if anything changed |
| `tracker.reset()` | `void` | Accepts the current values as the new baseline |

**Example:**
```js
const layout = await BareMetal.Binary.fetchLayout('users');
const tracker = BareMetal.Binary.createTracker(user, layout);
tracker.entity.DisplayName = 'Ada Lovelace';
console.log(tracker.changedFields());
```

### `buildDelta(tracker, layout)` → `ArrayBuffer|null`

Builds a binary PATCH payload from a tracker. Returns `null` when nothing changed.

### `applyDelta(slug, entityId, deltaBuffer)` → `Promise<object>`

Sends a binary delta as `PATCH /api/_binary/{slug}/{entityId}` with `application/octet-stream`.

### `applyDeltaJson(slug, entityId, changes, expectedVersion = 0)` → `Promise<object>`

Sends a JSON delta body `{ expectedVersion, changes }` to the same endpoint.

### `SpanReader` → `class`

Low-level little-endian binary reader for BSO1 payloads.

#### `new BareMetal.Binary.SpanReader(buffer)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| buffer | ArrayBuffer\|Uint8Array | — | Buffer to read from |

#### Reader methods

| Method | Description |
|---|---|
| `ensure(n)` | Throws if `n` bytes are not available |
| `readByte()` / `readSByte()` | Reads 8-bit integer |
| `readBool()` | Reads a boolean |
| `readInt16()` / `readUInt16()` | Reads 16-bit integer |
| `readInt32()` / `readUInt32()` | Reads 32-bit integer |
| `readInt64()` / `readUInt64()` | Reads 64-bit `BigInt` |
| `readFloat32()` / `readFloat64()` | Reads IEEE floating point values |
| `readDecimal()` | Reads .NET-style decimal data |
| `readChar()` | Reads a UTF-16 code unit |
| `readBytes(n)` | Reads a byte slice |
| `readGuid()` | Reads a GUID string |
| `readIdentifier()` | Reads a packed identifier string |
| `skip(n)` | Advances the offset |

### `SpanWriter` → `class`

Low-level writer used by `serialize()`.

#### `new BareMetal.Binary.SpanWriter(size = 256)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| size | number | `256` | Initial buffer capacity |

#### Writer methods

| Method | Description |
|---|---|
| `ensure(n)` | Grows the backing buffer when needed |
| `writeByte(v)` / `writeSByte(v)` | Writes 8-bit integer |
| `writeBool(v)` | Writes a boolean |
| `writeInt16(v)` / `writeUInt16(v)` | Writes 16-bit integer |
| `writeInt32(v)` / `writeUInt32(v)` | Writes 32-bit integer |
| `writeInt64(v)` / `writeUInt64(v)` | Writes 64-bit integer / `BigInt` |
| `writeFloat32(v)` / `writeFloat64(v)` | Writes floating point values |
| `writeDecimal(v)` | Writes decimal data |
| `writeChar(v)` | Writes a UTF-16 code unit |
| `writeBytes(bytes)` | Writes a byte array |
| `writeGuid(str)` | Writes a GUID string |
| `writeString(str)` | Writes a length-prefixed UTF-8 string |
| `writeIdentifier(str)` | Writes a packed identifier |
| `toUint8Array()` | Returns the written bytes |

## Configuration / Options

### Schema member shape

| Field | Type | Description |
|-------|------|-------------|
| name | string | Object property name |
| wireType | string | Primitive or logical BSO1 type |
| isNullable | boolean | Adds a null marker byte when true |
| enumUnderlying | string | Backing type for `wireType: 'Enum'` |

Supported `wireType` values in this file include `Bool`, `Byte`, `SByte`, `Int16`, `UInt16`, `Int32`, `UInt32`, `Int64`, `UInt64`, `Float32`, `Float64`, `Decimal`, `Char`, `String`, `Guid`, `DateTime`, `DateOnly`, `TimeOnly`, `DateTimeOffset`, `TimeSpan`, `Identifier`, and `Enum`.

### Layout shape for deltas

| Field | Type | Description |
|-------|------|-------------|
| schemaHash | string\|number | Used in delta headers |
| fields | array | Layout field metadata |
| fields[].name | string | Property name |
| fields[].type | string | Field type used by delta encoding |
| fields[].ordinal | number | Field ordinal in the delta payload |
| fields[].readOnly | boolean | Read-only fields are skipped |

## Examples

### Example 1: Fetch schema and decode a response
```html
<script src="BareMetal.Binary.min.js"></script>
<script>
  (async () => {
    await BareMetal.Binary.setSigningKey('AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=');
    const schema = await BareMetal.Binary.fetchSchema('users');
    const buffer = await fetch('/api/_binary/users/42').then(r => r.arrayBuffer());
    const user = await BareMetal.Binary.deserialize(buffer, schema);
    console.log(user);
  })();
</script>
```

### Example 2: Build and apply a delta
```js
const layout = await BareMetal.Binary.fetchLayout('orders');
const tracker = BareMetal.Binary.createTracker(order, layout);
tracker.entity.Status = 'Shipped';
tracker.entity.Version = order.Version;

const delta = BareMetal.Binary.buildDelta(tracker, layout);
if (delta) {
  await BareMetal.Binary.applyDelta('orders', order.Key, delta);
}
```

## Notes
- `deserialize()` and `deserializeList()` throw when the signature does not match.
- Strings larger than 4 MB and nesting deeper than 64 levels are rejected.
- `fetchSchema()` and `fetchLayout()` cache results in-memory for the lifetime of the page.
- `applyDeltaJson()` is useful when you want optimistic concurrency without building a binary payload yourself.
