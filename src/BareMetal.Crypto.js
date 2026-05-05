// BareMetal.Crypto — lightweight Web Crypto wrapper
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Crypto = (() => {
  'use strict';

  const subtle = crypto.subtle;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // --- Helpers ---

  function toUtf8(str) { return encoder.encode(str).buffer; }
  function fromUtf8(buffer) { return decoder.decode(buffer); }

  function toBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function randomBytes(n) { return crypto.getRandomValues(new Uint8Array(n)).buffer; }

  function ensureBuffer(data) {
    return typeof data === 'string' ? toUtf8(data) : data;
  }

  // --- Symmetric (AES-256-GCM) ---

  function generateSymmetricKey(extractable) {
    return subtle.generateKey({ name: 'AES-GCM', length: 256 }, !!extractable, ['encrypt', 'decrypt']);
  }

  async function encryptSymmetric(key, data) {
    const iv = randomBytes(12);
    const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, ensureBuffer(data));
    return { iv, ciphertext };
  }

  function decryptSymmetric(key, iv, ciphertext) {
    return subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, ciphertext);
  }

  // --- Asymmetric — Hybrid Envelope (RSA-OAEP + AES-GCM) ---

  function generateAsymmetricKey(bits, extractable) {
    return subtle.generateKey({
      name: 'RSA-OAEP',
      modulusLength: bits || 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    }, !!extractable, ['wrapKey', 'unwrapKey']);
  }

  async function encryptAsymmetric(publicKey, data) {
    const ephemeral = await generateSymmetricKey(true);
    const { iv, ciphertext } = await encryptSymmetric(ephemeral, data);
    const wrappedKey = await subtle.wrapKey('raw', ephemeral, publicKey, { name: 'RSA-OAEP' });
    return { wrappedKey, iv, ciphertext };
  }

  async function decryptAsymmetric(privateKey, envelope) {
    const aesKey = await subtle.unwrapKey(
      'raw', envelope.wrappedKey, privateKey, { name: 'RSA-OAEP' },
      { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    return decryptSymmetric(aesKey, envelope.iv, envelope.ciphertext);
  }

  // --- Hashing ---

  function digest(data) {
    return subtle.digest('SHA-256', ensureBuffer(data));
  }

  async function digestWithSalt(data, salt) {
    salt = salt || randomBytes(16);
    const buf = ensureBuffer(data);
    const combined = new Uint8Array(new Uint8Array(salt).length + new Uint8Array(buf).length);
    combined.set(new Uint8Array(salt), 0);
    combined.set(new Uint8Array(buf), new Uint8Array(salt).length);
    const hash = await subtle.digest('SHA-256', combined);
    return { hash, salt };
  }

  async function deriveKey(password, salt, iterations) {
    salt = salt || randomBytes(16);
    iterations = iterations || 600000;
    const baseKey = await subtle.importKey('raw', ensureBuffer(password), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle.deriveKey(
      { name: 'PBKDF2', salt: new Uint8Array(salt), iterations, hash: 'SHA-256' },
      baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
    return { key, salt };
  }

  // --- Signing (ECDSA P-256 SHA-256) ---

  function generateSigningKey(extractable) {
    return subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, !!extractable, ['sign', 'verify']);
  }

  function sign(privateKey, data) {
    return subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, ensureBuffer(data));
  }

  async function verifySignature(publicKey, data, signature) {
    return subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, signature, ensureBuffer(data));
  }

  // --- Key utilities ---

  function exportKey(key, format) {
    return subtle.exportKey(format || 'jwk', key);
  }

  function importKey(keyData, algorithm, usages, format, extractable) {
    format = format || 'jwk';
    let params;
    switch (algorithm) {
      case 'AES-GCM': params = { name: 'AES-GCM', length: 256 }; break;
      case 'RSA-OAEP': params = { name: 'RSA-OAEP', hash: 'SHA-256' }; break;
      case 'ECDSA':    params = { name: 'ECDSA', namedCurve: 'P-256' }; break;
      default: throw new Error('Unknown algorithm: ' + algorithm);
    }
    return subtle.importKey(format, keyData, params, !!extractable, usages);
  }

  return {
    generateSymmetricKey, encryptSymmetric, decryptSymmetric,
    generateAsymmetricKey, encryptAsymmetric, decryptAsymmetric,
    digest, digestWithSalt, deriveKey,
    generateSigningKey, sign, verifySignature,
    exportKey, importKey,
    toBase64Url, fromBase64Url, toUtf8, fromUtf8, randomBytes
  };
})();
