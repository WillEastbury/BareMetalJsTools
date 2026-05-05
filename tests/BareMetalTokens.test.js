/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { webcrypto } = require('crypto');

function loadTokens() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Tokens.js'), 'utf8');
  const bm = {};
  const fn = new Function('BareMetal', 'crypto', code + '\nreturn BareMetal;');
  return fn(bm, webcrypto).Tokens;
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
    parts[2] = parts[2].slice(0, -1) + (parts[2].slice(-1) === 'A' ? 'B' : 'A');
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
