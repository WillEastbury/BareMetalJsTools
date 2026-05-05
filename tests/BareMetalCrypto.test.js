/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

// jsdom lacks full Web Crypto — use Node's webcrypto
const { webcrypto } = require('crypto');

function loadCrypto() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Crypto.js'), 'utf8');
  const bm = {};
  const fn = new Function('document', 'BareMetal', 'crypto', code + '\nreturn BareMetal;');
  return fn(global.document, bm, webcrypto).Crypto;
}

const C = loadCrypto();

describe('BareMetal.Crypto', () => {

  test('symmetric encrypt/decrypt round-trip', async () => {
    const key = await C.generateSymmetricKey();
    const plaintext = 'hello symmetric world';
    const { iv, ciphertext } = await C.encryptSymmetric(key, plaintext);
    const decrypted = await C.decryptSymmetric(key, iv, ciphertext);
    expect(C.fromUtf8(decrypted)).toBe(plaintext);
  });

  test('asymmetric envelope encrypt/decrypt round-trip', async () => {
    const { publicKey, privateKey } = await C.generateAsymmetricKey();
    const plaintext = 'hello asymmetric world';
    const envelope = await C.encryptAsymmetric(publicKey, plaintext);
    expect(envelope).toHaveProperty('wrappedKey');
    expect(envelope).toHaveProperty('iv');
    expect(envelope).toHaveProperty('ciphertext');
    const decrypted = await C.decryptAsymmetric(privateKey, envelope);
    expect(C.fromUtf8(decrypted)).toBe(plaintext);
  });

  test('digest returns SHA-256 hash', async () => {
    const hash = await C.digest('test');
    expect(new Uint8Array(hash).length).toBe(32);
  });

  test('digestWithSalt returns hash and salt', async () => {
    const { hash, salt } = await C.digestWithSalt('test');
    expect(new Uint8Array(hash).length).toBe(32);
    expect(new Uint8Array(salt).length).toBe(16);
    // Same salt produces same hash
    const { hash: hash2 } = await C.digestWithSalt('test', salt);
    expect(C.toBase64Url(hash2)).toBe(C.toBase64Url(hash));
  });

  test('deriveKey from password', async () => {
    const { key, salt } = await C.deriveKey('password123');
    expect(salt).toBeDefined();
    // Derived key works for encrypt/decrypt
    const { iv, ciphertext } = await C.encryptSymmetric(key, 'secret');
    const dec = await C.decryptSymmetric(key, iv, ciphertext);
    expect(C.fromUtf8(dec)).toBe('secret');
  });

  test('sign and verifySignature', async () => {
    const { publicKey, privateKey } = await C.generateSigningKey();
    const data = 'sign me';
    const sig = await C.sign(privateKey, data);
    expect(await C.verifySignature(publicKey, data, sig)).toBe(true);
    expect(await C.verifySignature(publicKey, 'tampered', sig)).toBe(false);
  });

  test('exportKey/importKey round-trip (AES-GCM JWK)', async () => {
    const key = await C.generateSymmetricKey();
    const jwk = await C.exportKey(key, 'jwk');
    const imported = await C.importKey(jwk, 'AES-GCM', ['encrypt', 'decrypt']);
    const { iv, ciphertext } = await C.encryptSymmetric(imported, 'roundtrip');
    const dec = await C.decryptSymmetric(imported, iv, ciphertext);
    expect(C.fromUtf8(dec)).toBe('roundtrip');
  });

  test('toBase64Url/fromBase64Url round-trip', () => {
    const original = new Uint8Array([0, 1, 2, 255, 254, 253]);
    const encoded = C.toBase64Url(original.buffer);
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toMatch(/[+/=]/);
    const decoded = new Uint8Array(C.fromBase64Url(encoded));
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  test('randomBytes returns correct length', () => {
    const buf = C.randomBytes(32);
    expect(new Uint8Array(buf).length).toBe(32);
    const buf2 = C.randomBytes(1);
    expect(new Uint8Array(buf2).length).toBe(1);
  });
});
