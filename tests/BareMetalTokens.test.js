/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const { webcrypto } = require('crypto');

function loadTokens() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Tokens.js');
  Object.defineProperty(global, 'crypto', { configurable: true, value: webcrypto });
  if (global.window) Object.defineProperty(global.window, 'crypto', { configurable: true, value: webcrypto });
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Tokens', () => {
  test('builder creates HS256 token that verifies and decodes', async () => {
    const T = loadTokens();
    const secret = await T.generateSecret('HS256');
    const token = await T.create()
      .subject('user-123')
      .issuer('https://auth.example.com')
      .audience('my-app')
      .expiresIn('1h')
      .claim('role', 'admin')
      .sign(secret, 'HS256');

    const payload = await T.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'https://auth.example.com',
      audience: 'my-app'
    });
    const decoded = T.decode(token);

    expect(payload.sub).toBe('user-123');
    expect(payload.role).toBe('admin');
    expect(decoded.header.alg).toBe('HS256');
    expect(T.isExpired(token)).toBe(false);
    expect(T.claim(token, 'sub')).toBe('user-123');
    expect(T.expiresIn(token)).toBeGreaterThan(0);
  });

  test('verify rejects tampered token', async () => {
    const T = loadTokens();
    const secret = await T.generateSecret('HS256');
    const token = await T.sign({ sub: 'abc', iat: Math.floor(Date.now() / 1000) }, secret, { algorithm: 'HS256' });
    const parts = token.split('.');
    parts[1] = T.toBase64Url(JSON.stringify({ sub: 'tampered', iat: Math.floor(Date.now() / 1000) }));
    const tampered = parts.join('.');

    await expect(T.verify(tampered, secret, { algorithms: ['HS256'] })).rejects.toMatchObject({
      name: 'TokenInvalidError'
    });
  });

  test('ES256 key pair signs and verifies', async () => {
    const T = loadTokens();
    const { publicKey, privateKey } = await T.generateKeyPair('ES256');
    const token = await T.sign({ sub: 'ecdsa-user', iat: Math.floor(Date.now() / 1000) }, privateKey, { algorithm: 'ES256' });
    const payload = await T.verify(token, publicKey, { algorithms: ['ES256'] });

    expect(payload.sub).toBe('ecdsa-user');
  });
});

describe('BareMetal.Tokens additional coverage', () => {
  test('none algorithm, sync signing, and claim validation cover non-HMAC paths', async () => {
    const T = loadTokens();
    const now = Math.floor(Date.now() / 1000);
    const token = T.create({ role: 'guest' })
      .issuer('issuer-1')
      .audience('aud-1')
      .notBefore('1s')
      .claim('exp', now + 60)
      .signSync(null, 'none', { header: { kid: 'demo' } });

    expect(T.decode(token).header.kid).toBe('demo');
    await expect(T.verify(token, null, { algorithms: ['none'], ignoreExpiration: true, clockTolerance: '1s' })).resolves.toMatchObject({
      role: 'guest',
      iss: 'issuer-1',
      aud: 'aud-1'
    });

    let syncError;
    try {
      T.signSync({ sub: 'bad' }, null, { algorithm: 'HS256' });
    } catch (error) {
      syncError = error;
    }
    expect(syncError).toMatchObject({ name: 'AlgorithmMismatchError' });

    await expect(T.verify(token, 'secret', { algorithms: ['HS256'] })).rejects.toMatchObject({
      name: 'AlgorithmMismatchError'
    });

    const activeToken = await T.sign({ sub: 'active', nbf: now + 60 }, null, { algorithm: 'none' });
    await expect(T.verify(activeToken, null, { algorithms: ['none'] })).rejects.toMatchObject({
      name: 'TokenInvalidError'
    });

    const noIat = await T.sign({ sub: 'missing-iat' }, null, { algorithm: 'none' });
    await expect(T.verify(noIat, null, { algorithms: ['none'], maxAge: '1s' })).rejects.toMatchObject({
      name: 'TokenInvalidError'
    });
  });

  test('imports and exports keys across RS256 and HMAC helpers', async () => {
    const T = loadTokens();
    const { publicKey, privateKey } = await T.generateKeyPair('RS256');
    const publicJwk = await T.exportKey(publicKey);
    const importedPublic = await T.importJWK(publicJwk, 'RS256', 'public');
    const token = await T.sign({ sub: 'rsa-user', iat: Math.floor(Date.now() / 1000) }, privateKey, { algorithm: 'RS256' });
    await expect(T.verify(token, importedPublic, { algorithms: ['RS256'] })).resolves.toMatchObject({
      sub: 'rsa-user'
    });

    const secret = await T.generateSecret('HS256');
    const jwk = await T.exportKey(secret);
    const importedSecret = await T.importJWK(jwk, 'HS256');
    const hmacToken = await T.sign({ sub: 'jwk-user', iat: Math.floor(Date.now() / 1000) }, importedSecret, { algorithm: 'HS256' });
    await expect(T.verify(hmacToken, secret, { algorithms: ['HS256'] })).resolves.toMatchObject({
      sub: 'jwk-user'
    });

    await expect(T.generateSecret('RS256')).rejects.toMatchObject({ name: 'AlgorithmMismatchError' });
    await expect(T.generateKeyPair('HS256')).rejects.toMatchObject({ name: 'AlgorithmMismatchError' });
    await expect(T.importKey(42, 'RS256')).rejects.toMatchObject({ name: 'TokenMalformedError' });
  });

  test('base64 helpers, decode failures, and malformed claims report clear errors', async () => {
    const T = loadTokens();
    const payloadBytes = new DataView(new Uint8Array([1, 2, 3, 4]).buffer);
    const encoded = T.toBase64Url(payloadBytes);
    expect(T.fromBase64Url(encoded)).toEqual(new Uint8Array([1, 2, 3, 4]));

    let malformed;
    try {
      T.decode('not-a-token');
    } catch (error) {
      malformed = error;
    }
    expect(malformed).toMatchObject({ name: 'TokenMalformedError' });

    let badBase64;
    try {
      T.fromBase64Url('*bad*');
    } catch (error) {
      badBase64 = error;
    }
    expect(badBase64).toMatchObject({ name: 'TokenMalformedError' });

    const secret = await T.generateSecret('HS256');
    const expired = await T.sign({
      sub: 'expired',
      iss: 'issuer-a',
      aud: ['aud-a', 'aud-b'],
      iat: Math.floor(Date.now() / 1000) - 120,
      exp: Math.floor(Date.now() / 1000) - 10
    }, secret, { algorithm: 'HS256' });

    await expect(T.verify(expired, secret, { algorithms: ['HS256'] })).rejects.toMatchObject({
      name: 'TokenExpiredError'
    });
    await expect(T.verify(expired, secret, { algorithms: ['HS256'], ignoreExpiration: true, issuer: 'wrong' })).rejects.toMatchObject({
      name: 'TokenInvalidError'
    });
    await expect(T.verify(expired, secret, { algorithms: ['HS256'], ignoreExpiration: true, issuer: 'issuer-a', audience: 'other' })).rejects.toMatchObject({
      name: 'TokenInvalidError'
    });
    await expect(T.verify(expired, secret, { algorithms: ['HS256'], ignoreExpiration: true, issuer: 'issuer-a', audience: 'aud-b', maxAge: '30s' })).rejects.toMatchObject({
      name: 'TokenExpiredError'
    });
  });

  test('builder helpers, PEM import, and pair resolution cover additional signing paths', async () => {
    const T = loadTokens();
    const secret = await T.generateSecret('HS512');
    const built = await T.create({ sub: 'builder' })
      .expiresIn('2s')
      .notBefore('-1s')
      .claim('scope', 'all')
      .sign(secret, 'HS512');

    expect(T.claim(built, 'scope')).toBe('all');
    expect(T.isExpired(built, { clockTolerance: '5s' })).toBe(false);
    expect(T.expiresIn(built, { clockTolerance: '1s' })).toBeGreaterThan(0);

    const rsaPair = await T.generateKeyPair('RS256');
    const spki = await webcrypto.subtle.exportKey('spki', rsaPair.publicKey);
    const pkcs8 = await webcrypto.subtle.exportKey('pkcs8', rsaPair.privateKey);
    const toPem = (label, buffer) => {
      const b64 = Buffer.from(buffer).toString('base64').match(/.{1,64}/g).join('\n');
      return '-----BEGIN ' + label + '-----\n' + b64 + '\n-----END ' + label + '-----';
    };
    const publicPem = toPem('PUBLIC KEY', spki);
    const privatePem = toPem('PRIVATE KEY', pkcs8);
    const rsaToken = await T.sign({ sub: 'pem-user', iat: Math.floor(Date.now() / 1000) }, rsaPair.privateKey, { algorithm: 'RS256' });
    await expect(T.verify(rsaToken, { publicKey: rsaPair.publicKey }, { algorithms: ['RS256'] })).resolves.toMatchObject({ sub: 'pem-user' });
    await expect(T.importKey(publicPem, 'RS256', 'public')).rejects.toBeDefined();
    await expect(T.importKey(privatePem, 'RS256', 'private')).rejects.toBeDefined();

    let badDuration;
    try {
      T.parseDuration({});
    } catch (error) {
      badDuration = error;
    }
    expect(badDuration).toBeInstanceOf(Error);
  });

  test('ES256 DER conversion paths are exercised during sign and verify fallbacks', async () => {
    const T = loadTokens();
    const pair = await T.generateKeyPair('ES256');
    const derSignature = new Uint8Array([48, 6, 2, 1, 1, 2, 1, 2]).buffer;
    const signSpy = jest.spyOn(webcrypto.subtle, 'sign').mockResolvedValue(derSignature);
    const verifySpy = jest.spyOn(webcrypto.subtle, 'verify')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const token = await T.sign({ sub: 'ecdsa-der', iat: Math.floor(Date.now() / 1000) }, pair.privateKey, { algorithm: 'ES256' });
    await expect(T.verify(token, pair.publicKey, { algorithms: ['ES256'] })).resolves.toMatchObject({
      sub: 'ecdsa-der'
    });

    expect(signSpy).toHaveBeenCalled();
    expect(verifySpy).toHaveBeenCalledTimes(2);
    signSpy.mockRestore();
    verifySpy.mockRestore();
  });
});
