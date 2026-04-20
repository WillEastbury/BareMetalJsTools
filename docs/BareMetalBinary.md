# BareMetalBinary

BSO1 binary wire serialiser. Mirrors the server-side `MetadataWireSerializer.cs`. Used by `BareMetalRest` whenever the server negotiates binary transport.

## Wire format

```
┌──────────────────────────────────────────────────────────┐
│ magic      uint32  0x314F5342  ("BSO1" little-endian)    │
│ version    uint32  3                                     │
│ schemaId   uint32                                        │
│ arch       uint8                                         │
│ signature  byte[32]   HMAC-SHA256 over header+payload    │  ← 45-byte header
├──────────────────────────────────────────────────────────┤
│ payload    bytes      metadata-driven encoding           │
└──────────────────────────────────────────────────────────┘
```

Field encoding is positional, ordered by `field.ordinal`. Reads use zero-copy `DataView`. Writes use a growing `SpanWriter`.

## API

| Function | Description |
|---|---|
| `setSigningKey(cryptoKey)` / `setSigningKeyBytes(bytes)` | Install HMAC-SHA256 key. |
| `fetchSchema(slug)` / `getCachedSchema(slug)` | Schema cache management. |
| `serialize(slug, value)`         | `Promise<ArrayBuffer>` |
| `deserialize(slug, buffer)`      | `Promise<object>` |
| `deserializeList(buffer, schema)` | `Promise<object[]>` |
| `verifySignature(buffer)`        | `Promise<boolean>` |
| `fetchLayout(slug)`              | UI layout helper (used by `BareMetalRendering`). |
| `createTracker(slug, initial?)`  | Returns a tracker that records dirty fields. |
| `buildDelta(slug, tracker, expectedVersion)` | Encode a delta payload. |
| `applyDelta(target, delta)` / `applyDeltaJson(...)` | Apply binary or JSON delta to an object. |
| `SpanReader`, `SpanWriter`       | Low-level codec primitives (exposed for tests). |

## Supported types

`Bool, Byte, SByte, Int16, UInt16, Int32, UInt32, Int64, UInt64, Float32, Float64, Decimal, DateTime, DateTimeOffset, DateOnly, TimeOnly, TimeSpan, Guid, StringUtf8, Enum*, Identifier, NestedObject, ListOf<T>, ArrayOf<T>`

* `Decimal` is approximated as `Float64` (lossy for large precision values).
* `Identifier` is encoded as `(hi:uint32, lo:uint32)`.
* `DateTime` uses .NET ticks (10000 × ms + 621355968000000000).

## Example

```js
await BareMetalBinary.setSigningKeyBytes(new Uint8Array(32));
const schema = await BareMetalBinary.fetchSchema('customer');

const buf = await BareMetalBinary.serialize('customer', { id: 1, name: 'Acme' });
const obj = await BareMetalBinary.deserialize('customer', buf);
```

## Notes

* No tests yet — contributions welcome.
* The matching .NET serialiser lives in `BareMetalWeb.Core/Serialization/MetadataWireSerializer.cs`.
