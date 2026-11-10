# BareMetal.Authenticator

Dependency-free browser module. Source: `./src/BareMetal.Authenticator.js`.

## Load

```html
<script src="../src/BareMetal.Authenticator.js"></script>
```

## Public API

### `setup(userId, options)`

Call `BareMetal.Authenticator.setup(...)` using the arguments shown by the function implementation.

### `verify(code, secret, options)`

Call `BareMetal.Authenticator.verify(...)` using the arguments shown by the function implementation.

### `generate(secret, options)`

Call `BareMetal.Authenticator.generate(...)` using the arguments shown by the function implementation.

### `challenge(session, options)`

Call `BareMetal.Authenticator.challenge(...)` using the arguments shown by the function implementation.

### `protect(fn, options)`

Call `BareMetal.Authenticator.protect(...)` using the arguments shown by the function implementation.

### `replayGuard(secret, options)`

Call `BareMetal.Authenticator.replayGuard(...)` using the arguments shown by the function implementation.

### `backupVerify(code, backupCodes)`

Call `BareMetal.Authenticator.backupVerify(...)` using the arguments shown by the function implementation.

### `qrSvg(uri, options)`

Call `BareMetal.Authenticator.qrSvg(...)` using the arguments shown by the function implementation.

## Example

```js
const moduleApi = BareMetal.Authenticator;
// Source: ./src/BareMetal.Authenticator.js
// See the public API list below for call signatures.
```
