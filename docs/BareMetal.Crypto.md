# BareMetal.Crypto

> Small Web Crypto wrapper for encryption, hashing, signing, and key transport.

**Size:** 5.23 KB source / 2.78 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Crypto.min.js"></script>
<script>
  (async () => {
    const { key, salt } = await BareMetal.Crypto.deriveKey('correct horse battery staple');
    const { iv, ciphertext } = await BareMetal.Crypto.encryptSymmetric(key, 'secret message');
    const plain = await BareMetal.Crypto.decryptSymmetric(key, iv, ciphertext);
    console.log(BareMetal.Crypto.fromUtf8(plain), salt.byteLength);
  })();
</script>
```

## API Reference

### `generateSymmetricKey(extractable)` → `Promise<CryptoKey>`

Generates an AES-256-GCM key.

### `encryptSymmetric(key, data)` → `Promise<{ iv: ArrayBuffer, ciphertext: ArrayBuffer }>`

Encrypts a string or buffer with AES-GCM and returns a random 12-byte IV plus the ciphertext.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | CryptoKey | — | AES-GCM key |
| data | string\|BufferSource | — | Plaintext |

### `decryptSymmetric(key, iv, ciphertext)` → `Promise<ArrayBuffer>`

Decrypts data produced by `encryptSymmetric()`.

### `generateAsymmetricKey(bits, extractable)` → `Promise<CryptoKeyPair>`

Generates an RSA-OAEP key pair.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| bits | number | `2048` | RSA modulus length |
| extractable | boolean | `false` | Whether keys can be exported |

### `encryptAsymmetric(publicKey, data)` → `Promise<{ wrappedKey: ArrayBuffer, iv: ArrayBuffer, ciphertext: ArrayBuffer }>`

Creates a hybrid envelope: AES-GCM for the data and RSA-OAEP to wrap the ephemeral AES key.

### `decryptAsymmetric(privateKey, envelope)` → `Promise<ArrayBuffer>`

Unwraps the AES key and decrypts the hybrid envelope.

### `digest(data)` → `Promise<ArrayBuffer>`

Computes a SHA-256 hash.

### `digestWithSalt(data, salt)` → `Promise<{ hash: ArrayBuffer, salt: ArrayBuffer }>`

Prepends a salt, hashes the result, and returns both values. A random 16-byte salt is generated when omitted.

### `deriveKey(password, salt, iterations)` → `Promise<{ key: CryptoKey, salt: ArrayBuffer }>`

Uses PBKDF2-SHA256 to derive an AES-GCM key.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| password | string\|BufferSource | — | Password or raw bytes |
| salt | ArrayBuffer | random 16 bytes | PBKDF2 salt |
| iterations | number | `600000` | PBKDF2 iteration count |

### `generateSigningKey(extractable)` → `Promise<CryptoKeyPair>`

Generates an ECDSA P-256 signing key pair.

### `sign(privateKey, data)` → `Promise<ArrayBuffer>`

Signs data with ECDSA P-256 / SHA-256.

### `verifySignature(publicKey, data, signature)` → `Promise<boolean>`

Verifies an ECDSA signature.

### `exportKey(key, format = 'jwk')` → `Promise<any>`

Exports a Web Crypto key.

### `importKey(keyData, algorithm, usages, format = 'jwk', extractable)` → `Promise<CryptoKey>`

Imports a key for `AES-GCM`, `RSA-OAEP`, or `ECDSA`.

### `toBase64Url(buffer)` → `string`

Encodes bytes as URL-safe base64.

### `fromBase64Url(string)` → `ArrayBuffer`

Decodes URL-safe base64.

### `toUtf8(string)` → `ArrayBuffer`

Encodes a string as UTF-8.

### `fromUtf8(buffer)` → `string`

Decodes UTF-8 bytes back to text.

### `randomBytes(length)` → `ArrayBuffer`

Returns cryptographically secure random bytes.

## Configuration / Options

### Supported algorithms

| API | Algorithm |
|---|---|
| Symmetric encryption | AES-GCM, 256-bit |
| Hybrid public-key envelope | RSA-OAEP + AES-GCM |
| Digest | SHA-256 |
| Password derivation | PBKDF2-SHA256 |
| Signing | ECDSA P-256 / SHA-256 |

## Examples

### Example 1: Store encrypted preferences
```js
const exported = localStorage.getItem('prefs-key');
const key = exported
  ? await BareMetal.Crypto.importKey(JSON.parse(exported), 'AES-GCM', ['encrypt', 'decrypt'])
  : await BareMetal.Crypto.generateSymmetricKey(true);

if (!exported) {
  const jwk = await BareMetal.Crypto.exportKey(key);
  localStorage.setItem('prefs-key', JSON.stringify(jwk));
}

const encrypted = await BareMetal.Crypto.encryptSymmetric(key, JSON.stringify({ theme: 'dark' }));
```

### Example 2: Sign and verify an API payload
```js
const pair = await BareMetal.Crypto.generateSigningKey(true);
const body = JSON.stringify({ id: 42, action: 'approve' });
const signature = await BareMetal.Crypto.sign(pair.privateKey, body);
const ok = await BareMetal.Crypto.verifySignature(pair.publicKey, body, signature);
console.log(ok);
```

## Notes
- Most methods return `ArrayBuffer` values; convert them with `toBase64Url()` or `fromUtf8()` as needed.
- `encryptAsymmetric()` and `decryptAsymmetric()` must be used together because the envelope shape is fixed.
- `importKey()` throws for unsupported algorithms.
- This module expects browser Web Crypto APIs (`crypto.subtle`) to exist.
