# BareMetal.Tokens

> Tiny JWT creation, signing, verification, and key-management helpers built on Web Crypto.

**Size:** 19.05 KB source / 9.61 KB minified  
**Dependencies:** Web Crypto API plus `TextEncoder`/`TextDecoder`

## Quick Start

```html
<script src="BareMetal.Tokens.min.js"></script>
<script>
  (async () => {
    const token = await BareMetal.Tokens.sign(
      { sub: 'user-42', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 },
      'super-secret-key',
      { algorithm: 'HS256' }
    );

    const payload = await BareMetal.Tokens.verify(token, 'super-secret-key', {
      algorithms: ['HS256']
    });

    console.log(payload.role);
  })();
</script>
```

## API Reference

### `sign(payload, key, options)` → `Promise<string>`

Creates a signed JWT.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `payload` | `object` | — | Claims payload |
| `key` | `string \| Uint8Array \| CryptoKey \| JWK \| PEM \| CryptoKeyPair` | — | Signing key |
| `options` | `object` | `{}` | Signing options |

**Example:**
```js
const token = await BareMetal.Tokens.sign({ sub: '123' }, 'secret', {
  algorithm: 'HS384',
  header: { kid: 'primary' }
});
```

### `signSync(payload, key, options)` → `string`

Creates an unsigned JWT using `algorithm: 'none'` only.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `payload` | `object` | — | Claims payload |
| `key` | `any` | — | Ignored for `none` tokens |
| `options` | `object` | `{ algorithm: 'none' }` | Header options |

**Example:**
```js
const token = BareMetal.Tokens.signSync({ sub: 'debug-user' }, null, {
  algorithm: 'none'
});
```

### `decode(token)` → `{ header, payload, signature }`

Decodes a JWT without verifying its signature.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `token` | `string` | — | JWT string |

**Example:**
```js
const decoded = BareMetal.Tokens.decode(token);
console.log(decoded.header.alg, decoded.payload.sub);
```

### `verify(token, key, options)` → `Promise<object>`

Verifies a JWT signature and validates claims.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `token` | `string` | — | JWT string |
| `key` | `string \| Uint8Array \| CryptoKey \| JWK \| PEM \| CryptoKeyPair` | — | Verification key |
| `options` | `object` | `{}` | Verification rules |

**Example:**
```js
const payload = await BareMetal.Tokens.verify(token, publicKeyPem, {
  algorithms: ['RS256'],
  issuer: 'https://auth.example.com',
  audience: 'dashboard'
});
```

### `isExpired(token, options)` → `boolean`

Returns `true` when the token's `exp` claim is in the past.

**Example:**
```js
if (BareMetal.Tokens.isExpired(token, { clockTolerance: '30s' })) {
  refreshSession();
}
```

### `expiresIn(token, options)` → `number | null`

Returns seconds remaining until expiration, or `null` when `exp` is missing.

**Example:**
```js
console.log(BareMetal.Tokens.expiresIn(token), 'seconds left');
```

### `claim(token, name)` → `any`

Reads a single claim from the decoded payload.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `token` | `string` | — | JWT string |
| `name` | `string` | — | Claim name |

**Example:**
```js
const subject = BareMetal.Tokens.claim(token, 'sub');
```

### `generateSecret(algorithmName)` → `Promise<CryptoKey>`

Generates an HMAC key for `HS256`, `HS384`, or `HS512`.

**Example:**
```js
const secret = await BareMetal.Tokens.generateSecret('HS512');
```

### `generateKeyPair(algorithmName)` → `Promise<CryptoKeyPair>`

Generates a key pair for `RS256` or `ES256`.

**Example:**
```js
const pair = await BareMetal.Tokens.generateKeyPair('ES256');
```

### `importKey(keyData, algorithmName, kind)` → `Promise<CryptoKey | null>`

Imports a key from a `CryptoKey`, JWK, raw HMAC key, or PEM string.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `keyData` | `any` | — | Key material |
| `algorithmName` | `string` | — | `HS256`, `HS384`, `HS512`, `RS256`, `ES256`, or `none` |
| `kind` | `'public' \| 'private'` | inferred | PEM/JWK key usage |

**Example:**
```js
const key = await BareMetal.Tokens.importKey(secretBytes, 'HS256');
```

### `exportKey(key)` → `Promise<JWK>`

Exports a `CryptoKey` as JWK.

**Example:**
```js
const jwk = await BareMetal.Tokens.exportKey(pair.publicKey);
```

### `importJWK(jwk, algorithmName, kind)` → `Promise<CryptoKey | null>`

Imports a JWK directly.

**Example:**
```js
const key = await BareMetal.Tokens.importJWK(publicJwk, 'RS256', 'public');
```

### `create(payload)` → `TokenBuilder`

Creates a fluent JWT builder.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `payload` | `object` | — | Initial claims |

Builder methods:

| Method | Description |
|--------|-------------|
| `subject(value)` | Sets `sub` |
| `issuer(value)` | Sets `iss` |
| `audience(value)` | Sets `aud` |
| `expiresIn(value)` | Sets `exp` relative to now |
| `notBefore(value)` | Sets `nbf` relative to now |
| `claim(name, value)` | Sets an arbitrary claim |
| `sign(key, algorithm, options)` | Async signed token |
| `signSync(key, algorithm, options)` | Sync unsigned token (`none`) |

**Example:**
```js
const token = await BareMetal.Tokens.create({ role: 'editor' })
  .subject('user-42')
  .issuer('https://auth.example.com')
  .audience('admin-ui')
  .expiresIn('2h')
  .sign('super-secret-key', 'HS256');
```

### `parseDuration(value)` → `number`

Converts durations like `30s`, `5m`, `2h`, `1d`, and `1w` into seconds.

**Example:**
```js
const seconds = BareMetal.Tokens.parseDuration('15m');
```

### `toBase64Url(value)` → `string`

Encodes bytes or strings to base64url.

**Example:**
```js
const encoded = BareMetal.Tokens.toBase64Url('hello');
```

### `fromBase64Url(value)` → `Uint8Array`

Decodes a base64url string to bytes.

**Example:**
```js
const bytes = BareMetal.Tokens.fromBase64Url(encoded);
```

## Configuration / Options

### Signing options

| Option | Default | Description |
|--------|---------|-------------|
| `algorithm` | `'HS256'` | Signing algorithm |
| `header` | `{}` | Additional JOSE header fields |

Supported algorithms: `HS256`, `HS384`, `HS512`, `RS256`, `ES256`, `none`.

### Verification options

| Option | Default | Description |
|--------|---------|-------------|
| `algorithms` | allow header `alg` | Whitelist of accepted algorithms |
| `clockTolerance` | `0` | Extra seconds or duration string for time checks |
| `ignoreExpiration` | `false` | Skip `exp` validation |
| `issuer` | — | Required `iss` value or array of values |
| `audience` | — | Required `aud` value or array of values |
| `maxAge` | — | Maximum age from `iat` |

## Examples

### Example 1: Issue a login token
```js
const token = await BareMetal.Tokens.create({ role: 'admin' })
  .subject('user-42')
  .issuer('https://auth.example.com')
  .audience('dashboard')
  .expiresIn('1h')
  .sign('super-secret-key', 'HS256', {
    header: { kid: 'main-hmac' }
  });
```

### Example 2: Verify an RS256 bearer token
```js
const payload = await BareMetal.Tokens.verify(token, publicKeyPem, {
  algorithms: ['RS256'],
  issuer: ['https://auth.example.com'],
  audience: 'dashboard',
  maxAge: '8h',
  clockTolerance: '30s'
});

console.log(payload.sub);
```

## Notes
- `signSync()` only supports `algorithm: 'none'`.
- `importKey()` accepts raw HMAC keys, JWKs, `CryptoKey`s, or PEM strings for RSA/ECDSA.
- RSA PEMs are imported as `spki` for public keys and `pkcs8` for private keys.
- Claim validation throws plain objects with `name` and `message` fields such as `TokenExpiredError` and `TokenInvalidError`.
- `verify()` accepts both JOSE and DER-shaped ECDSA signatures when needed.
