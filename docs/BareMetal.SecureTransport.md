# BareMetal.SecureTransport

Client-side RSA-OAEP wrapping of AES-256-GCM session payloads. The browser receives only a public key; private decryption remains on a trusted server.

```html
<script src="src/BareMetal.SecureTransport.js"></script>
<script>
const secure = BareMetal.SecureTransport.create({
  publicKeyUrl: '/api/security/public-key',
  keyId: '2026-11',
  tunnelUrl: '/bmsecure'
});

const response = await secure.fetch('/api/customers', {
  method: 'GET'
});
</script>
```

The tunnel request is an encrypted envelope containing the original method, URL, headers and body. The response is AES-GCM encrypted in the request session. This is application payload confidentiality in addition to TLS; server/private-key implementation is not performed by the browser module.

The envelope algorithms are `RSA-OAEP-SHA256` for wrapping and `AES-256-GCM` for payload data. `encryptObject()` accepts public-key-only operation. `decryptObject(envelope, privateKey)` is for trusted server-side or isolated key-adapter use and must never bundle a private key in browser assets.
