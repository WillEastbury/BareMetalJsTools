// BareMetal.Tokens — tiny JWT helpers built on Web Crypto
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Tokens = (function() {
  'use strict';

  var BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  var decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;
  var cryptoRef = null;
  var ALGORITHMS = {
    HS256: { type: 'hmac', hash: 'SHA-256', length: 256 },
    HS384: { type: 'hmac', hash: 'SHA-384', length: 384 },
    HS512: { type: 'hmac', hash: 'SHA-512', length: 512 },
    RS256: { type: 'rsa', hash: 'SHA-256' },
    ES256: { type: 'ecdsa', hash: 'SHA-256', namedCurve: 'P-256', size: 32 },
    none: { type: 'none' }
  };

  function getCrypto() {
    if (cryptoRef && cryptoRef.subtle) return cryptoRef;
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) cryptoRef = globalThis.crypto;
    else if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) cryptoRef = window.crypto;
    else if (typeof crypto !== 'undefined' && crypto.subtle) cryptoRef = crypto;
    if (!cryptoRef || !cryptoRef.subtle) throw new Error('Web Crypto API is not available');
    return cryptoRef;
  }

  function subtle() { return getCrypto().subtle; }
  function nowSeconds() { return Math.floor(Date.now() / 1000); }
  function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function isCryptoKey(value) { return !!value && typeof value === 'object' && value.algorithm && typeof value.type === 'string' && value.usages; }
  function clone(value) { return JSON.parse(JSON.stringify(value || {})); }

  function createError(name, message, details) {
    var error = { name: name, message: message };
    var key;
    for (key in (details || {})) error[key] = details[key];
    return error;
  }

  function fail(name, message, details) {
    throw createError(name, message, details);
  }

  function utf8(value) {
    if (!encoder) throw new Error('TextEncoder is not available');
    return encoder.encode(String(value));
  }

  function text(bytes) {
    if (!decoder) throw new Error('TextDecoder is not available');
    return decoder.decode(bytes);
  }

  function toBytes(value) {
    if (typeof value === 'string') return utf8(value);
    if (value instanceof Uint8Array) return value;
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (value && Object.prototype.toString.call(value) === '[object ArrayBuffer]') return new Uint8Array(value);
    if (value && typeof value === 'object' && typeof value.byteLength === 'number' && value.buffer) return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength);
    fail('TokenMalformedError', 'Unsupported binary input');
  }

  function toBase64Url(value) {
    var bytes = toBytes(value);
    var out = '';
    var i;
    for (i = 0; i < bytes.length; i += 3) {
      var a = bytes[i];
      var b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      var c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      var triplet = (a << 16) | (b << 8) | c;
      out += BASE64[(triplet >> 18) & 63];
      out += BASE64[(triplet >> 12) & 63];
      out += i + 1 < bytes.length ? BASE64[(triplet >> 6) & 63] : '=';
      out += i + 2 < bytes.length ? BASE64[triplet & 63] : '=';
    }
    return out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(value) {
    if (typeof value !== 'string') fail('TokenMalformedError', 'Invalid base64url value');
    var base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    var out = [];
    var i;
    while (base64.length % 4) base64 += '=';
    for (i = 0; i < base64.length; i += 4) {
      var c1 = BASE64.indexOf(base64.charAt(i));
      var c2 = BASE64.indexOf(base64.charAt(i + 1));
      var p3 = base64.charAt(i + 2);
      var p4 = base64.charAt(i + 3);
      var c3 = p3 === '=' ? -1 : BASE64.indexOf(p3);
      var c4 = p4 === '=' ? -1 : BASE64.indexOf(p4);
      if (c1 < 0 || c2 < 0 || (c3 < 0 && p3 !== '=') || (c4 < 0 && p4 !== '=')) fail('TokenMalformedError', 'Invalid base64url encoding');
      var triplet = (c1 << 18) | (c2 << 12) | ((c3 < 0 ? 0 : c3) << 6) | (c4 < 0 ? 0 : c4);
      out.push((triplet >> 16) & 255);
      if (c3 >= 0) out.push((triplet >> 8) & 255);
      if (c4 >= 0) out.push(triplet & 255);
    }
    return new Uint8Array(out);
  }

  function encodeJson(value) {
    return toBase64Url(utf8(JSON.stringify(value)));
  }

  function decodeJson(segment, label) {
    try {
      return JSON.parse(text(fromBase64Url(segment)));
    } catch (error) {
      fail('TokenMalformedError', 'Invalid ' + label + ' segment');
    }
  }

  function getAlgorithm(name) {
    var algorithm = ALGORITHMS[name || 'HS256'];
    if (!algorithm) fail('AlgorithmMismatchError', 'Unsupported algorithm', { algorithm: name });
    return algorithm;
  }

  function importParams(name) {
    var algorithm = getAlgorithm(name);
    if (algorithm.type === 'hmac') return { name: 'HMAC', hash: { name: algorithm.hash }, length: algorithm.length };
    if (algorithm.type === 'rsa') return { name: 'RSASSA-PKCS1-v1_5', hash: { name: algorithm.hash } };
    if (algorithm.type === 'ecdsa') return { name: 'ECDSA', namedCurve: algorithm.namedCurve };
    return null;
  }

  function signParams(name) {
    var algorithm = getAlgorithm(name);
    if (algorithm.type === 'hmac') return 'HMAC';
    if (algorithm.type === 'rsa') return 'RSASSA-PKCS1-v1_5';
    if (algorithm.type === 'ecdsa') return { name: 'ECDSA', hash: { name: algorithm.hash } };
    return null;
  }

  function normalizePem(pem) {
    return pem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  }

  function trimInteger(bytes) {
    var offset = 0;
    while (offset < bytes.length - 1 && bytes[offset] === 0) offset++;
    return bytes.slice(offset);
  }

  function leftPad(bytes, size) {
    if (bytes.length > size) fail('TokenInvalidError', 'Invalid ECDSA signature');
    var out = new Uint8Array(size);
    out.set(bytes, size - bytes.length);
    return out;
  }

  function derLength(bytes, index) {
    var length = bytes[index++];
    if (length < 128) return { length: length, next: index };
    var count = length & 127;
    length = 0;
    while (count--) length = (length << 8) | bytes[index++];
    return { length: length, next: index };
  }

  function derToJose(signature, size) {
    var bytes = toBytes(signature);
    var index = 0;
    if (bytes[index++] !== 48) fail('TokenInvalidError', 'Invalid ECDSA signature');
    var seq = derLength(bytes, index);
    index = seq.next;
    if (bytes[index++] !== 2) fail('TokenInvalidError', 'Invalid ECDSA signature');
    var rLen = bytes[index++];
    var r = trimInteger(bytes.slice(index, index + rLen));
    index += rLen;
    if (bytes[index++] !== 2) fail('TokenInvalidError', 'Invalid ECDSA signature');
    var sLen = bytes[index++];
    var s = trimInteger(bytes.slice(index, index + sLen));
    var out = new Uint8Array(size * 2);
    out.set(leftPad(r, size), 0);
    out.set(leftPad(s, size), size);
    return out;
  }

  function joseToDer(signature, size) {
    var bytes = toBytes(signature);
    if (bytes.length !== size * 2) fail('TokenInvalidError', 'Invalid ECDSA signature');
    var r = trimInteger(bytes.slice(0, size));
    var s = trimInteger(bytes.slice(size));
    if (r[0] & 128) r = concatBytes(new Uint8Array([0]), r);
    if (s[0] & 128) s = concatBytes(new Uint8Array([0]), s);
    var body = concatBytes(new Uint8Array([2, r.length]), r, new Uint8Array([2, s.length]), s);
    return concatBytes(new Uint8Array([48, body.length]), body);
  }

  function concatBytes() {
    var total = 0;
    var i;
    for (i = 0; i < arguments.length; i++) total += toBytes(arguments[i]).length;
    var out = new Uint8Array(total);
    var offset = 0;
    for (i = 0; i < arguments.length; i++) {
      var bytes = toBytes(arguments[i]);
      out.set(bytes, offset);
      offset += bytes.length;
    }
    return out;
  }

  function parseDuration(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
      var match = /^\s*(-?\d+(?:\.\d+)?)\s*([smhdw]?)\s*$/i.exec(value);
      if (!match) throw new Error('Invalid duration: ' + value);
      var amount = parseFloat(match[1]);
      var unit = (match[2] || 's').toLowerCase();
      var scale = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 }[unit];
      return amount * scale;
    }
    throw new Error('Invalid duration');
  }

  function audienceMatches(actual, expected) {
    var actualList = Array.isArray(actual) ? actual : [actual];
    var expectedList = Array.isArray(expected) ? expected : [expected];
    var i;
    for (i = 0; i < expectedList.length; i++) if (actualList.indexOf(expectedList[i]) !== -1) return true;
    return false;
  }

  function validateClaims(payload, options) {
    var now = nowSeconds();
    var tolerance = options.clockTolerance ? parseDuration(options.clockTolerance) : 0;
    if (!options.ignoreExpiration && typeof payload.exp === 'number' && now >= payload.exp + tolerance) {
      fail('TokenExpiredError', 'Token expired', { expiredAt: payload.exp });
    }
    if (typeof payload.nbf === 'number' && now + tolerance < payload.nbf) {
      fail('TokenInvalidError', 'Token not active yet', { notBefore: payload.nbf });
    }
    if (options.issuer != null && payload.iss !== options.issuer && (!Array.isArray(options.issuer) || options.issuer.indexOf(payload.iss) === -1)) {
      fail('TokenInvalidError', 'Invalid issuer', { issuer: payload.iss });
    }
    if (options.audience != null && !audienceMatches(payload.aud, options.audience)) {
      fail('TokenInvalidError', 'Invalid audience', { audience: payload.aud });
    }
    if (options.maxAge != null) {
      if (typeof payload.iat !== 'number') fail('TokenInvalidError', 'Missing iat claim');
      var maxAge = parseDuration(options.maxAge);
      if (now >= payload.iat + maxAge + tolerance) {
        fail('TokenExpiredError', 'Token expired', { expiredAt: payload.iat + maxAge });
      }
    }
  }

  async function importJWK(jwk, algorithmName, kind) {
    var algorithm = getAlgorithm(algorithmName);
    if (algorithm.type === 'none') return null;
    if (algorithm.type === 'hmac') return subtle().importKey('jwk', jwk, importParams(algorithmName), true, ['sign', 'verify']);
    kind = kind || (jwk.d ? 'private' : 'public');
    return subtle().importKey('jwk', jwk, importParams(algorithmName), true, kind === 'private' ? ['sign'] : ['verify']);
  }

  async function importKey(keyData, algorithmName, kind) {
    var algorithm = getAlgorithm(algorithmName);
    if (algorithm.type === 'none') return null;
    if (isCryptoKey(keyData)) return keyData;
    if (isObject(keyData) && keyData.kty) return importJWK(keyData, algorithmName, kind);
    if (algorithm.type === 'hmac') return subtle().importKey('raw', toBytes(keyData), importParams(algorithmName), true, ['sign', 'verify']);
    if (typeof keyData !== 'string') fail('TokenMalformedError', 'PEM key expected');
    kind = kind || 'public';
    return subtle().importKey(kind === 'private' ? 'pkcs8' : 'spki', fromBase64Url(normalizePem(keyData)).buffer, importParams(algorithmName), true, kind === 'private' ? ['sign'] : ['verify']);
  }

  async function resolveKey(key, algorithmName, purpose) {
    if (key && typeof key === 'object') {
      if (purpose === 'sign' && key.privateKey) key = key.privateKey;
      if (purpose === 'verify' && key.publicKey) key = key.publicKey;
    }
    return importKey(key, algorithmName, purpose === 'sign' ? 'private' : 'public');
  }

  function decode(token) {
    if (typeof token !== 'string') fail('TokenMalformedError', 'Token must be a string');
    var parts = token.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1]) fail('TokenMalformedError', 'Malformed token');
    return {
      header: decodeJson(parts[0], 'header'),
      payload: decodeJson(parts[1], 'payload'),
      signature: parts[2] || ''
    };
  }

  function buildToken(payload, options) {
    var header = { alg: options.algorithm || 'HS256', typ: 'JWT' };
    var key;
    for (key in (options.header || {})) header[key] = options.header[key];
    var data = encodeJson(header) + '.' + encodeJson(payload);
    return { header: header, data: data };
  }

  async function sign(payload, key, options) {
    options = options || {};
    var algorithmName = options.algorithm || 'HS256';
    var algorithm = getAlgorithm(algorithmName);
    var token = buildToken(clone(payload), options);
    if (algorithm.type === 'none') return token.data + '.';
    var cryptoKey = await resolveKey(key, algorithmName, 'sign');
    var signature = await subtle().sign(signParams(algorithmName), cryptoKey, utf8(token.data));
    if (algorithm.type === 'ecdsa' && toBytes(signature).length !== algorithm.size * 2) signature = derToJose(signature, algorithm.size);
    return token.data + '.' + toBase64Url(signature);
  }

  function signSync(payload, key, options) {
    options = options || {};
    if ((options.algorithm || 'none') !== 'none') fail('AlgorithmMismatchError', 'signSync only supports algorithm none');
    return buildToken(clone(payload), { algorithm: 'none', header: options.header }).data + '.';
  }

  async function verify(token, key, options) {
    options = options || {};
    var parts = token.split('.');
    var decoded = decode(token);
    var algorithmName = decoded.header.alg || 'none';
    var algorithm = getAlgorithm(algorithmName);
    if (options.algorithms && options.algorithms.indexOf(algorithmName) === -1) {
      fail('AlgorithmMismatchError', 'Algorithm not allowed', { algorithm: algorithmName, allowedAlgorithms: options.algorithms.slice() });
    }
    if (algorithm.type === 'none') {
      if (parts[2]) fail('TokenInvalidError', 'Invalid signature');
      if ((options.algorithms && options.algorithms.indexOf('none') === -1) || key != null) {
        fail('AlgorithmMismatchError', 'Algorithm not allowed', { algorithm: 'none' });
      }
      validateClaims(decoded.payload, options);
      return decoded.payload;
    }
    var signature = fromBase64Url(parts[2]);
    var cryptoKey = await resolveKey(key, algorithmName, 'verify');
    var data = utf8(parts[0] + '.' + parts[1]);
    var valid;
    if (algorithm.type === 'ecdsa') {
      valid = await subtle().verify(signParams(algorithmName), cryptoKey, signature, data);
      if (!valid) valid = await subtle().verify(signParams(algorithmName), cryptoKey, joseToDer(signature, algorithm.size), data);
    } else {
      valid = await subtle().verify(signParams(algorithmName), cryptoKey, signature, data);
    }
    if (!valid) fail('TokenInvalidError', 'Invalid signature');
    validateClaims(decoded.payload, options);
    return decoded.payload;
  }

  function isExpired(token, options) {
    options = options || {};
    var exp = claim(token, 'exp');
    if (typeof exp !== 'number') return false;
    var tolerance = options.clockTolerance ? parseDuration(options.clockTolerance) : 0;
    return nowSeconds() >= exp + tolerance;
  }

  function expiresIn(token, options) {
    options = options || {};
    var exp = claim(token, 'exp');
    if (typeof exp !== 'number') return null;
    var tolerance = options.clockTolerance ? parseDuration(options.clockTolerance) : 0;
    return exp + tolerance - nowSeconds();
  }

  function claim(token, name) {
    var payload = decode(token).payload;
    return payload ? payload[name] : undefined;
  }

  function create(payload) {
    var claims = clone(payload);
    var offsets = {};
    var builder = {
      subject: function(value) { claims.sub = value; return builder; },
      issuer: function(value) { claims.iss = value; return builder; },
      audience: function(value) { claims.aud = value; return builder; },
      expiresIn: function(value) { offsets.exp = parseDuration(value); return builder; },
      notBefore: function(value) { offsets.nbf = parseDuration(value); return builder; },
      claim: function(name, value) {
        claims[name] = value;
        if (name === 'exp') delete offsets.exp;
        if (name === 'nbf') delete offsets.nbf;
        return builder;
      },
      sign: function(key, algorithm, options) {
        var payloadCopy = clone(claims);
        var now = nowSeconds();
        if (typeof payloadCopy.iat !== 'number') payloadCopy.iat = now;
        if (offsets.exp != null) payloadCopy.exp = now + offsets.exp;
        if (offsets.nbf != null) payloadCopy.nbf = now + offsets.nbf;
        options = options || {};
        options.algorithm = algorithm || options.algorithm || 'HS256';
        return sign(payloadCopy, key, options);
      },
      signSync: function(key, algorithm, options) {
        var payloadCopy = clone(claims);
        var now = nowSeconds();
        if (typeof payloadCopy.iat !== 'number') payloadCopy.iat = now;
        if (offsets.exp != null) payloadCopy.exp = now + offsets.exp;
        if (offsets.nbf != null) payloadCopy.nbf = now + offsets.nbf;
        options = options || {};
        options.algorithm = algorithm || options.algorithm || 'none';
        return signSync(payloadCopy, key, options);
      }
    };
    return builder;
  }

  async function generateSecret(algorithmName) {
    algorithmName = algorithmName || 'HS256';
    var algorithm = getAlgorithm(algorithmName);
    if (algorithm.type !== 'hmac') fail('AlgorithmMismatchError', 'Secret generation only supports HMAC algorithms');
    return subtle().generateKey(importParams(algorithmName), true, ['sign', 'verify']);
  }

  async function generateKeyPair(algorithmName) {
    algorithmName = algorithmName || 'RS256';
    var algorithm = getAlgorithm(algorithmName);
    if (algorithm.type === 'rsa') {
      return subtle().generateKey({
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: { name: algorithm.hash }
      }, true, ['sign', 'verify']);
    }
    if (algorithm.type === 'ecdsa') return subtle().generateKey(importParams(algorithmName), true, ['sign', 'verify']);
    fail('AlgorithmMismatchError', 'Key pair generation only supports RS256 and ES256');
  }

  async function exportKey(key) {
    return subtle().exportKey('jwk', key);
  }

  return {
    sign: sign,
    signSync: signSync,
    decode: decode,
    verify: verify,
    isExpired: isExpired,
    expiresIn: expiresIn,
    claim: claim,
    generateSecret: generateSecret,
    generateKeyPair: generateKeyPair,
    importKey: importKey,
    exportKey: exportKey,
    importJWK: importJWK,
    create: create,
    parseDuration: parseDuration,
    toBase64Url: toBase64Url,
    fromBase64Url: fromBase64Url
  };
})();
