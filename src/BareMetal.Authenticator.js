var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Authenticator = (function(){
  'use strict';

  var BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  var EVENTS = { setup: [], verify: [], fail: [], challenge: [] };
  var QR_CAPACITY = {
    L: [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271],
    M: [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213],
    Q: [0, 11, 20, 32, 46, 60, 74, 86, 108, 130, 151],
    H: [0, 7, 14, 24, 34, 44, 58, 64, 84, 98, 119]
  };
  var QR_BLOCKS = {
    L: [null,
      { data: 19, ec: 7, g1: 1, d1: 19, g2: 0, d2: 0 },
      { data: 34, ec: 10, g1: 1, d1: 34, g2: 0, d2: 0 },
      { data: 55, ec: 15, g1: 1, d1: 55, g2: 0, d2: 0 },
      { data: 80, ec: 20, g1: 1, d1: 80, g2: 0, d2: 0 },
      { data: 108, ec: 26, g1: 1, d1: 108, g2: 0, d2: 0 },
      { data: 136, ec: 18, g1: 2, d1: 68, g2: 0, d2: 0 },
      { data: 156, ec: 20, g1: 2, d1: 78, g2: 0, d2: 0 },
      { data: 194, ec: 24, g1: 2, d1: 97, g2: 0, d2: 0 },
      { data: 232, ec: 30, g1: 2, d1: 116, g2: 0, d2: 0 },
      { data: 274, ec: 18, g1: 2, d1: 68, g2: 2, d2: 69 }
    ],
    M: [null,
      { data: 16, ec: 10, g1: 1, d1: 16, g2: 0, d2: 0 },
      { data: 28, ec: 16, g1: 1, d1: 28, g2: 0, d2: 0 },
      { data: 44, ec: 26, g1: 1, d1: 44, g2: 0, d2: 0 },
      { data: 64, ec: 18, g1: 2, d1: 32, g2: 0, d2: 0 },
      { data: 86, ec: 24, g1: 2, d1: 43, g2: 0, d2: 0 },
      { data: 108, ec: 16, g1: 4, d1: 27, g2: 0, d2: 0 },
      { data: 124, ec: 18, g1: 4, d1: 31, g2: 0, d2: 0 },
      { data: 154, ec: 22, g1: 2, d1: 38, g2: 2, d2: 39 },
      { data: 182, ec: 22, g1: 3, d1: 36, g2: 2, d2: 37 },
      { data: 216, ec: 26, g1: 4, d1: 43, g2: 1, d2: 44 }
    ],
    Q: [null,
      { data: 13, ec: 13, g1: 1, d1: 13, g2: 0, d2: 0 },
      { data: 22, ec: 22, g1: 1, d1: 22, g2: 0, d2: 0 },
      { data: 34, ec: 18, g1: 2, d1: 17, g2: 0, d2: 0 },
      { data: 48, ec: 26, g1: 2, d1: 24, g2: 0, d2: 0 },
      { data: 62, ec: 18, g1: 2, d1: 15, g2: 2, d2: 16 },
      { data: 76, ec: 24, g1: 4, d1: 19, g2: 0, d2: 0 },
      { data: 88, ec: 18, g1: 2, d1: 14, g2: 4, d2: 15 },
      { data: 110, ec: 22, g1: 4, d1: 18, g2: 2, d2: 19 },
      { data: 132, ec: 20, g1: 4, d1: 16, g2: 4, d2: 17 },
      { data: 154, ec: 24, g1: 6, d1: 19, g2: 2, d2: 20 }
    ],
    H: [null,
      { data: 9, ec: 17, g1: 1, d1: 9, g2: 0, d2: 0 },
      { data: 16, ec: 28, g1: 1, d1: 16, g2: 0, d2: 0 },
      { data: 26, ec: 22, g1: 2, d1: 13, g2: 0, d2: 0 },
      { data: 36, ec: 16, g1: 4, d1: 9, g2: 0, d2: 0 },
      { data: 46, ec: 22, g1: 2, d1: 11, g2: 2, d2: 12 },
      { data: 60, ec: 28, g1: 4, d1: 15, g2: 0, d2: 0 },
      { data: 66, ec: 26, g1: 4, d1: 13, g2: 1, d2: 14 },
      { data: 86, ec: 26, g1: 4, d1: 14, g2: 2, d2: 15 },
      { data: 100, ec: 24, g1: 4, d1: 12, g2: 4, d2: 13 },
      { data: 122, ec: 28, g1: 6, d1: 15, g2: 2, d2: 16 }
    ]
  };
  var QR_ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var QR_REMAINDER = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0];
  var GF_EXP = [];
  var GF_LOG = [];
  var _lastVerifiedAt = null;

  initGalois();

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function copy(a, b) {
    var out = {}, key;
    for (key in (a || {})) if (own(a, key)) out[key] = a[key];
    for (key in (b || {})) if (own(b, key)) out[key] = b[key];
    return out;
  }
  function toArray(data) {
    if (data == null) return new Uint8Array(0);
    if (data instanceof Uint8Array) return new Uint8Array(data);
    if (typeof ArrayBuffer !== 'undefined') {
      if (data instanceof ArrayBuffer) return new Uint8Array(data.slice(0));
      if (ArrayBuffer.isView && ArrayBuffer.isView(data)) return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(data)) return new Uint8Array(data);
    if (Array.isArray(data)) return new Uint8Array(data);
    if (typeof data === 'string') return utf8Bytes(data);
    return new Uint8Array(data);
  }
  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(str));
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(String(str), 'utf8'));
    var encoded = unescape(encodeURIComponent(String(str)));
    var out = new Uint8Array(encoded.length);
    var i;
    for (i = 0; i < encoded.length; i++) out[i] = encoded.charCodeAt(i);
    return out;
  }
  function asciiString(bytes) {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('ascii');
    var out = '', i;
    for (i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    return out;
  }
  function repeat(str, count) {
    var out = '';
    while (count-- > 0) out += str;
    return out;
  }
  function sanitizeDigits(digits) {
    digits = digits == null ? 6 : Number(digits);
    return digits > 0 ? Math.floor(digits) : 6;
  }
  function sanitizePeriod(period) {
    period = period == null ? 30 : Number(period);
    return period > 0 ? Math.floor(period) : 30;
  }
  function sanitizeEcLevel(level) {
    level = String(level || 'M').toUpperCase();
    return own(QR_CAPACITY, level) ? level : 'M';
  }
  function normalizeTimestamp(timestamp) {
    if (timestamp == null) return Date.now();
    if (timestamp instanceof Date) return timestamp.getTime();
    timestamp = Number(timestamp);
    if (!isFinite(timestamp)) return Date.now();
    return Math.abs(timestamp) < 100000000000 ? Math.round(timestamp * 1000) : Math.round(timestamp);
  }
  function unixSeconds(timestamp) {
    return Math.floor(normalizeTimestamp(timestamp) / 1000);
  }
  function constantTimeEq(a, b) {
    a = String(a == null ? '' : a);
    b = String(b == null ? '' : b);
    if (a.length !== b.length) return false;
    var diff = 0, i;
    for (i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }
  function indexOf(list, value) {
    var i;
    for (i = 0; i < (list || []).length; i++) if (list[i] === value) return i;
    return -1;
  }
  function intersects(a, b) {
    var i;
    for (i = 0; i < (a || []).length; i++) if (indexOf(b || [], a[i]) > -1) return true;
    return false;
  }
  function pow10(n) {
    var out = 1;
    while (n-- > 0) out *= 10;
    return out;
  }
  function getNodeCrypto() {
    try { return typeof require === 'function' ? require('crypto') : null; }
    catch (_) { return null; }
  }
  function getCrypto() {
    if (typeof crypto !== 'undefined') return crypto;
    if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto;
    var node = getNodeCrypto();
    return node && node.webcrypto ? node.webcrypto : null;
  }
  function randomBytes(length) {
    var c = getCrypto();
    var arr;
    if (c && typeof c.getRandomValues === 'function') {
      arr = new Uint8Array(length);
      c.getRandomValues(arr);
      return arr;
    }
    c = getNodeCrypto();
    if (c && typeof c.randomBytes === 'function') return new Uint8Array(c.randomBytes(length));
    throw new Error('Secure random source unavailable');
  }
  function int64BE(counter) {
    var out = new Uint8Array(8);
    var hi = Math.floor(counter / 4294967296);
    var lo = counter >>> 0;
    out[0] = (hi >>> 24) & 255;
    out[1] = (hi >>> 16) & 255;
    out[2] = (hi >>> 8) & 255;
    out[3] = hi & 255;
    out[4] = (lo >>> 24) & 255;
    out[5] = (lo >>> 16) & 255;
    out[6] = (lo >>> 8) & 255;
    out[7] = lo & 255;
    return out;
  }
  function emit(name, payload) {
    var list = EVENTS[name] || [];
    var i;
    for (i = 0; i < list.length; i++) {
      try { list[i](payload); } catch (_) {}
    }
  }
  function on(name, cb) {
    if (typeof cb !== 'function') return function() {};
    (EVENTS[name] = EVENTS[name] || []).push(cb);
    return function() {
      var list = EVENTS[name] || [];
      var i;
      for (i = list.length - 1; i >= 0; i--) if (list[i] === cb) list.splice(i, 1);
    };
  }

  function base32encode(buffer, omitPadding) {
    var bytes = toArray(buffer);
    var out = '';
    var bits = 0;
    var value = 0;
    var i;
    for (i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    if (!omitPadding) while (out.length % 8) out += '=';
    return out;
  }
  function base32decode(str) {
    str = String(str == null ? '' : str).toUpperCase().replace(/[\s-]+/g, '').replace(/=+$/g, '');
    var bits = 0;
    var value = 0;
    var out = [];
    var idx, i;
    for (i = 0; i < str.length; i++) {
      idx = BASE32_ALPHABET.indexOf(str.charAt(i));
      if (idx < 0) throw new Error('Invalid base32 character');
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        out.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return new Uint8Array(out);
  }
  function secretBytes(secret) {
    return typeof secret === 'string' ? base32decode(secret) : toArray(secret);
  }

  function sha1Bytes(message) {
    var bytes = toArray(message);
    var words = [];
    var i, j;
    var bitLength = bytes.length * 8;
    var w = [];
    var h0 = 0x67452301;
    var h1 = 0xEFCDAB89;
    var h2 = 0x98BADCFE;
    var h3 = 0x10325476;
    var h4 = 0xC3D2E1F0;
    function rol(v, s) { return ((v << s) | (v >>> (32 - s))) >>> 0; }
    for (i = 0; i < bytes.length; i++) words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << (24 - (i % 4) * 8));
    words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | (0x80 << (24 - (bytes.length % 4) * 8));
    words[(((bytes.length + 8) >> 6) + 1) * 16 - 1] = bitLength;
    for (i = 0; i < words.length; i += 16) {
      for (j = 0; j < 16; j++) w[j] = words[i + j] || 0;
      for (j = 16; j < 80; j++) w[j] = rol((w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16]) >>> 0, 1);
      var a = h0, b = h1, c = h2, d = h3, e = h4, f, k, temp;
      for (j = 0; j < 80; j++) {
        if (j < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
        else if (j < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        temp = (rol(a, 5) + f + e + k + w[j]) >>> 0;
        e = d;
        d = c;
        c = rol(b, 30);
        b = a;
        a = temp;
      }
      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
    }
    return new Uint8Array([
      (h0 >>> 24) & 255, (h0 >>> 16) & 255, (h0 >>> 8) & 255, h0 & 255,
      (h1 >>> 24) & 255, (h1 >>> 16) & 255, (h1 >>> 8) & 255, h1 & 255,
      (h2 >>> 24) & 255, (h2 >>> 16) & 255, (h2 >>> 8) & 255, h2 & 255,
      (h3 >>> 24) & 255, (h3 >>> 16) & 255, (h3 >>> 8) & 255, h3 & 255,
      (h4 >>> 24) & 255, (h4 >>> 16) & 255, (h4 >>> 8) & 255, h4 & 255
    ]);
  }
  function hmacSha1Sync(key, data) {
    var node = getNodeCrypto();
    key = toArray(key);
    data = toArray(data);
    if (node && typeof node.createHmac === 'function' && typeof Buffer !== 'undefined') {
      return new Uint8Array(node.createHmac('sha1', Buffer.from(key)).update(Buffer.from(data)).digest());
    }
    var block = new Uint8Array(64);
    var i;
    if (key.length > 64) key = sha1Bytes(key);
    block.set(key.subarray(0, 64));
    var inner = new Uint8Array(64 + data.length);
    var outer = new Uint8Array(84);
    for (i = 0; i < 64; i++) {
      inner[i] = block[i] ^ 0x36;
      outer[i] = block[i] ^ 0x5c;
    }
    inner.set(data, 64);
    outer.set(sha1Bytes(inner), 64);
    return sha1Bytes(outer);
  }
  function hmacSha1(key, data) {
    var c = getCrypto();
    var subtle = c && c.subtle;
    key = toArray(key);
    data = toArray(data);
    if (subtle && typeof subtle.importKey === 'function' && typeof subtle.sign === 'function') {
      return subtle.importKey('raw', key, { name: 'HMAC', hash: { name: 'SHA-1' } }, false, ['sign'])
        .then(function(imported) { return subtle.sign('HMAC', imported, data); })
        .then(function(sig) { return new Uint8Array(sig); }, function() { return hmacSha1Sync(key, data); });
    }
    return Promise.resolve(hmacSha1Sync(key, data));
  }
  function dynamicCode(hmac, digits) {
    var offset = hmac[19] & 15;
    var binary = ((hmac[offset] & 127) << 24) | ((hmac[offset + 1] & 255) << 16) | ((hmac[offset + 2] & 255) << 8) | (hmac[offset + 3] & 255);
    var code = String(binary % pow10(digits));
    return repeat('0', Math.max(0, digits - code.length)) + code;
  }
  function hotp(secret, counter, opts) {
    opts = opts || {};
    return dynamicCode(hmacSha1Sync(secretBytes(secret), int64BE(Number(counter) || 0)), sanitizeDigits(opts.digits));
  }
  function totp(secret, opts) {
    opts = opts || {};
    var period = sanitizePeriod(opts.period);
    return hotp(secret, Math.floor(unixSeconds(opts.timestamp) / period), opts);
  }
  function generate(secret, opts) {
    opts = opts || {};
    var period = sanitizePeriod(opts.period);
    var now = unixSeconds(opts.timestamp);
    var remaining = period - (now % period);
    if (remaining <= 0) remaining = period;
    return { code: totp(secret, opts), remaining: remaining, period: period };
  }
  function verify(code, secret, opts) {
    opts = opts || {};
    var digits = sanitizeDigits(opts.digits);
    var period = sanitizePeriod(opts.period);
    var window = opts.window == null ? 1 : Math.max(0, Math.floor(opts.window));
    var current = Math.floor(unixSeconds(opts.timestamp) / period);
    var clean = String(code == null ? '' : code).replace(/\s+/g, '');
    var drift;
    for (drift = -window; drift <= window; drift++) {
      if (current + drift < 0) continue;
      if (constantTimeEq(hotp(secret, current + drift, { digits: digits }), clean)) {
        _lastVerifiedAt = normalizeTimestamp(opts.timestamp);
        emit('verify', { ok: true, drift: drift, timestamp: _lastVerifiedAt });
        return { ok: true, drift: drift };
      }
    }
    emit('fail', { ok: false, code: clean, timestamp: normalizeTimestamp(opts.timestamp) });
    return { ok: false, drift: 0 };
  }

  function otpAuthUri(userId, secret, opts) {
    opts = copy({ issuer: 'BareMetal', digits: 6, period: 30, algorithm: 'SHA1' }, opts);
    var issuer = String(opts.issuer || 'BareMetal');
    var label = encodeURIComponent(issuer) + ':' + encodeURIComponent(String(userId == null ? '' : userId));
    return 'otpauth://totp/' + label + '?secret=' + encodeURIComponent(secret) + '&issuer=' + encodeURIComponent(issuer) + '&algorithm=' + encodeURIComponent(String(opts.algorithm || 'SHA1').toUpperCase()) + '&digits=' + sanitizeDigits(opts.digits) + '&period=' + sanitizePeriod(opts.period);
  }
  function generateBackupCodes(count) {
    var out = [];
    var i, bytes, value;
    count = count == null ? 8 : Math.max(0, Math.floor(count));
    for (i = 0; i < count; i++) {
      bytes = randomBytes(4);
      value = (((bytes[0] << 24) >>> 0) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3]) % 100000000;
      out.push(repeat('0', Math.max(0, 8 - String(value).length)) + value);
    }
    return out;
  }
  function setup(userId, opts) {
    opts = copy({ issuer: 'BareMetal', digits: 6, period: 30, algorithm: 'SHA1', backupCount: 8 }, opts);
    var secret = base32encode(randomBytes(20), true);
    var qrUri = otpAuthUri(userId, secret, opts);
    var backupCodes = generateBackupCodes(opts.backupCount);
    var result = { secret: secret, qrUri: qrUri, backupCodes: backupCodes };
    emit('setup', copy(result, { userId: userId }));
    return result;
  }
  function lastVerified() { return _lastVerifiedAt; }
  function timeSinceVerify() { return _lastVerifiedAt == null ? Infinity : (Date.now() - _lastVerifiedAt) / 1000; }
  function challenge(session) {
    session = session || {};
    var enabled = session.totpEnabled === false ? false : !!(session.totpEnabled || session.requireTotp || session.requiresTotp || session.totpRequired || session.totpSecret || session.secret);
    var verifiedAt = session.totpVerifiedAt != null ? normalizeTimestamp(session.totpVerifiedAt) : _lastVerifiedAt;
    var maxAge = session.maxAge == null ? (session.totpMaxAge == null ? 300 : session.totpMaxAge) : session.maxAge;
    if (!enabled) return { required: false, reason: 'TOTP not enabled' };
    if (verifiedAt == null) return { required: true, reason: 'TOTP verification required' };
    if (((Date.now() - verifiedAt) / 1000) > maxAge) return { required: true, reason: 'TOTP verification expired' };
    return { required: false, reason: 'Recently verified' };
  }
  function backupVerify(code, backupCodes) {
    var clean = String(code == null ? '' : code).replace(/\s+/g, '');
    var remaining = (backupCodes || []).slice();
    var idx = indexOf(remaining, clean);
    if (idx < 0) return { ok: false, remaining: remaining };
    remaining.splice(idx, 1);
    return { ok: true, remaining: remaining };
  }
  function replayGuard(secret, opts) {
    var lastCounter = null;
    return {
      check: function(code, checkOpts) {
        var cfg = copy(opts, checkOpts);
        var digits = sanitizeDigits(cfg && cfg.digits);
        var period = sanitizePeriod(cfg && cfg.period);
        var window = (!cfg || cfg.window == null) ? 1 : Math.max(0, Math.floor(cfg.window || 0));
        var current = Math.floor(unixSeconds(cfg && cfg.timestamp) / period);
        var clean = String(code == null ? '' : code).replace(/\s+/g, '');
        var drift, counter;
        for (drift = -window; drift <= window; drift++) {
          counter = current + drift;
          if (counter < 0) continue;
          if (constantTimeEq(hotp(secret, counter, { digits: digits }), clean)) {
            if (lastCounter != null && counter <= lastCounter) return false;
            lastCounter = counter;
            return true;
          }
        }
        return false;
      },
      reset: function() { lastCounter = null; }
    };
  }
  function resolveSecret(opts, args, context) {
    var session = opts && opts.session;
    if (opts && opts.secret) return opts.secret;
    if (session) return session.totpSecret || session.secret || session.authSecret || null;
    if (context && typeof context === 'object') return context.totpSecret || context.secret || null;
    if (args && args.length && args[0] && typeof args[0] === 'object') return args[0].totpSecret || args[0].secret || null;
    return null;
  }
  function protect(actionFn, opts) {
    opts = opts || {};
    return function() {
      var context = this;
      var args = Array.prototype.slice.call(arguments);
      var session = opts.session || null;
      var maxAge = opts.maxAge == null ? 300 : Math.max(0, Number(opts.maxAge));
      var gate = session ? challenge(copy(session, { maxAge: maxAge })) : { required: timeSinceVerify() > maxAge, reason: 'TOTP verification required' };
      if (!gate.required) return Promise.resolve(actionFn.apply(context, args));
      return new Promise(function(resolve, reject) {
        var secret = resolveSecret(opts, args, context);
        var info = { prompt: opts.prompt || 'Enter your authentication code', reason: gate.reason, maxAge: maxAge, session: session, args: args.slice() };
        emit('challenge', info);
        if (typeof opts.onChallenge !== 'function') return reject(new Error('TOTP challenge required'));
        function accept(value) {
          var payload = value && typeof value === 'object' && own(value, 'code') ? value : { code: value };
          var ok = false;
          var backup;
          if (payload.code != null && secret) ok = verify(payload.code, secret, opts.verify || opts).ok;
          if (!ok && payload.code != null && opts.backupCodes) {
            backup = backupVerify(payload.code, opts.backupCodes);
            if (backup.ok) {
              opts.backupCodes = backup.remaining;
              _lastVerifiedAt = Date.now();
              emit('verify', { ok: true, drift: 0, backup: true, timestamp: _lastVerifiedAt });
              ok = true;
            }
          }
          if (!ok) return reject(new Error('Invalid TOTP code'));
          if (session && typeof session === 'object') session.totpVerifiedAt = _lastVerifiedAt;
          Promise.resolve(actionFn.apply(context, args)).then(resolve, reject);
        }
        function deny(err) { reject(err instanceof Error ? err : new Error(err || 'Challenge cancelled')); }
        try { opts.onChallenge(accept, deny, info); }
        catch (err) { reject(err); }
      });
    };
  }
  function policy(opts) {
    var cfg = copy({ actions: [], roles: [], transitions: [] }, opts);
    return {
      config: cfg,
      requires: function(action, context) {
        context = context || {};
        var actionName = typeof action === 'string' ? action : (action && action.name) || context.action || context.type || '';
        var roles = Array.isArray(context.roles) ? context.roles : (context.role ? [context.role] : []);
        var transition = context.transition || '';
        if (!transition && (context.from || context.fromState) && (context.to || context.toState)) transition = String(context.from || context.fromState) + '→' + String(context.to || context.toState);
        if (indexOf(cfg.actions, actionName) > -1) return true;
        if (cfg.minAmount != null && Number(context.amount || 0) >= Number(cfg.minAmount)) return true;
        if (intersects(cfg.roles, roles)) return true;
        if (transition && (indexOf(cfg.transitions, transition) > -1 || indexOf(cfg.transitions, transition.replace(/->/g, '→')) > -1 || indexOf(cfg.transitions, transition.replace(/→/g, '->')) > -1)) return true;
        return false;
      }
    };
  }

  function initGalois() {
    var x = 1;
    var i;
    for (i = 0; i < 256; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 256) x ^= 285;
    }
    for (i = 256; i < 512; i++) GF_EXP[i] = GF_EXP[i - 256];
  }
  function gfMul(a, b) {
    if (!a || !b) return 0;
    return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
  }
  function rsGenerator(degree) {
    var poly = [1];
    var d, i, next;
    for (d = 0; d < degree; d++) {
      next = poly.slice();
      next.push(0);
      for (i = 0; i < poly.length; i++) next[i + 1] ^= gfMul(poly[i], GF_EXP[d]);
      poly = next;
    }
    return poly;
  }
  function rsEncode(data, ecCount) {
    var gen = rsGenerator(ecCount);
    var msg = data.slice();
    var i, j, factor;
    for (i = 0; i < ecCount; i++) msg.push(0);
    for (i = 0; i < data.length; i++) {
      factor = msg[i];
      if (!factor) continue;
      for (j = 0; j < gen.length; j++) msg[i + j] ^= gfMul(gen[j], factor);
    }
    return msg.slice(msg.length - ecCount);
  }
  function qrBlockInfo(version, ecLevel) {
    return QR_BLOCKS[sanitizeEcLevel(ecLevel)][version];
  }
  function qrVersionForLength(length, ecLevel) {
    var caps = QR_CAPACITY[sanitizeEcLevel(ecLevel)];
    var version;
    for (version = 1; version < caps.length; version++) if (length <= caps[version]) return version;
    throw new Error('URI too long for built-in QR capacity');
  }
  function pushBits(bits, value, length) {
    var i;
    for (i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  }
  function qrDataBytes(text, version, ecLevel) {
    var data = utf8Bytes(String(text == null ? '' : text));
    var info = qrBlockInfo(version, ecLevel);
    var bits = [];
    var bytes = [];
    var i;
    pushBits(bits, 4, 4);
    pushBits(bits, data.length, version < 10 ? 8 : 16);
    for (i = 0; i < data.length; i++) pushBits(bits, data[i], 8);
    if (bits.length + 4 <= info.data * 8) pushBits(bits, 0, 4);
    else while (bits.length < info.data * 8) bits.push(0);
    while (bits.length % 8) bits.push(0);
    for (i = 0; i < bits.length; i += 8) bytes.push((bits[i] << 7) | (bits[i + 1] << 6) | (bits[i + 2] << 5) | (bits[i + 3] << 4) | (bits[i + 4] << 3) | (bits[i + 5] << 2) | (bits[i + 6] << 1) | bits[i + 7]);
    while (bytes.length < info.data) bytes.push(bytes.length % 2 ? 0x11 : 0xEC);
    return bytes;
  }
  function qrCodewords(text, version, ecLevel) {
    var info = qrBlockInfo(version, ecLevel);
    var data = qrDataBytes(text, version, ecLevel);
    var blocks = [];
    var ecc = [];
    var result = [];
    var offset = 0;
    var i, j, maxData = 0;
    for (i = 0; i < info.g1; i++) {
      blocks.push(data.slice(offset, offset + info.d1));
      offset += info.d1;
    }
    for (i = 0; i < info.g2; i++) {
      blocks.push(data.slice(offset, offset + info.d2));
      offset += info.d2;
    }
    for (i = 0; i < blocks.length; i++) {
      if (blocks[i].length > maxData) maxData = blocks[i].length;
      ecc[i] = rsEncode(blocks[i], info.ec);
    }
    for (i = 0; i < maxData; i++) for (j = 0; j < blocks.length; j++) if (i < blocks[j].length) result.push(blocks[j][i]);
    for (i = 0; i < info.ec; i++) for (j = 0; j < ecc.length; j++) result.push(ecc[j][i]);
    return result;
  }
  function createMatrix(size) {
    var modules = [];
    var reserved = [];
    var r, c;
    for (r = 0; r < size; r++) {
      modules[r] = [];
      reserved[r] = [];
      for (c = 0; c < size; c++) {
        modules[r][c] = null;
        reserved[r][c] = false;
      }
    }
    return { modules: modules, reserved: reserved };
  }
  function mark(state, row, col, dark) {
    if (row < 0 || col < 0 || row >= state.modules.length || col >= state.modules.length) return;
    state.modules[row][col] = !!dark;
    state.reserved[row][col] = true;
  }
  function placeFinder(state, row, col) {
    var r, c;
    for (r = -1; r <= 7; r++) {
      for (c = -1; c <= 7; c++) {
        if (row + r < 0 || col + c < 0 || row + r >= state.modules.length || col + c >= state.modules.length) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) mark(state, row + r, col + c, false);
        else if (r === 0 || r === 6 || c === 0 || c === 6) mark(state, row + r, col + c, true);
        else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) mark(state, row + r, col + c, true);
        else mark(state, row + r, col + c, false);
      }
    }
  }
  function placeAlignment(state, row, col) {
    var r, c;
    for (r = -2; r <= 2; r++) for (c = -2; c <= 2; c++) mark(state, row + r, col + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
  }
  function reserveFormats(state, version) {
    var size = state.modules.length;
    var i, r, c, align = QR_ALIGN[version];
    placeFinder(state, 0, 0);
    placeFinder(state, size - 7, 0);
    placeFinder(state, 0, size - 7);
    for (i = 8; i < size - 8; i++) {
      mark(state, 6, i, i % 2 === 0);
      mark(state, i, 6, i % 2 === 0);
    }
    for (r = 0; r < align.length; r++) {
      for (c = 0; c < align.length; c++) {
        if ((r === 0 && c === 0) || (r === 0 && c === align.length - 1) || (r === align.length - 1 && c === 0)) continue;
        placeAlignment(state, align[r], align[c]);
      }
    }
    mark(state, size - 8, 8, true);
    for (i = 0; i < 9; i++) {
      if (!state.reserved[8][i]) mark(state, 8, i, false);
      if (!state.reserved[i][8]) mark(state, i, 8, false);
    }
    for (i = 0; i < 8; i++) {
      if (!state.reserved[8][size - 1 - i]) mark(state, 8, size - 1 - i, false);
      if (!state.reserved[size - 1 - i][8]) mark(state, size - 1 - i, 8, false);
    }
    if (version >= 7) {
      for (r = 0; r < 6; r++) for (c = 0; c < 3; c++) {
        mark(state, r, size - 11 + c, false);
        mark(state, size - 11 + c, r, false);
      }
    }
  }
  function cloneMatrix(modules) {
    return modules.map(function(row) { return row.slice(); });
  }
  function maskBit(mask, row, col) {
    switch (mask) {
      case 0: return (row + col) % 2 === 0;
      case 1: return row % 2 === 0;
      case 2: return col % 3 === 0;
      case 3: return (row + col) % 3 === 0;
      case 4: return ((Math.floor(row / 2) + Math.floor(col / 3)) % 2) === 0;
      case 5: return (((row * col) % 2) + ((row * col) % 3)) === 0;
      case 6: return ((((row * col) % 2) + ((row * col) % 3)) % 2) === 0;
      case 7: return ((((row + col) % 2) + ((row * col) % 3)) % 2) === 0;
      default: return false;
    }
  }
  function placeData(state, codewords, mask) {
    var modules = cloneMatrix(state.modules);
    var size = modules.length;
    var row = size - 1;
    var direction = -1;
    var bitIndex = 7;
    var byteIndex = 0;
    var col, c, dark;
    for (col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (c = 0; c < 2; c++) {
          if (!state.reserved[row][col - c]) {
            dark = false;
            if (byteIndex < codewords.length) dark = ((codewords[byteIndex] >>> bitIndex) & 1) === 1;
            if (maskBit(mask, row, col - c)) dark = !dark;
            modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex < 0) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += direction;
        if (row < 0 || row >= size) {
          row -= direction;
          direction = -direction;
          break;
        }
      }
    }
    return modules;
  }
  function bitLength(n) {
    var len = 0;
    while (n) { len++; n >>>= 1; }
    return len;
  }
  function bchEncode(value, poly, shift) {
    var v = value << shift;
    while (bitLength(v) >= bitLength(poly)) v ^= poly << (bitLength(v) - bitLength(poly));
    return (value << shift) | v;
  }
  function formatBits(ecLevel, mask) {
    var ecBits = { L: 1, M: 0, Q: 3, H: 2 }[sanitizeEcLevel(ecLevel)];
    return bchEncode((ecBits << 3) | mask, 0x537, 10) ^ 0x5412;
  }
  function versionBits(version) {
    return bchEncode(version, 0x1f25, 12);
  }
  function placeFormat(modules, ecLevel, mask) {
    var size = modules.length;
    var bits = formatBits(ecLevel, mask);
    var i, mod;
    for (i = 0; i < 15; i++) {
      mod = ((bits >> i) & 1) === 1;
      if (i < 6) modules[i][8] = mod;
      else if (i < 8) modules[i + 1][8] = mod;
      else modules[size - 15 + i][8] = mod;
      if (i < 8) modules[8][size - i - 1] = mod;
      else if (i < 9) modules[8][7] = mod;
      else modules[8][15 - i - 1] = mod;
    }
    modules[size - 8][8] = true;
  }
  function placeVersion(modules, version) {
    if (version < 7) return;
    var size = modules.length;
    var bits = versionBits(version);
    var i, mod;
    for (i = 0; i < 18; i++) {
      mod = ((bits >> i) & 1) === 1;
      modules[Math.floor(i / 3)][(i % 3) + size - 11] = mod;
      modules[(i % 3) + size - 11][Math.floor(i / 3)] = mod;
    }
  }
  function penalty(modules) {
    var size = modules.length;
    var score = 0;
    var row, col, runColor, runLength, dark, totalDark = 0;
    var patterns = ['10111010000', '00001011101'];
    function linePenalty(bits) {
      var i, out = 0, slice;
      for (i = 0; i <= bits.length - 11; i++) {
        slice = bits.slice(i, i + 11).join('');
        if (slice === patterns[0] || slice === patterns[1]) out += 40;
      }
      return out;
    }
    for (row = 0; row < size; row++) {
      runColor = modules[row][0];
      runLength = 1;
      dark = '';
      for (col = 0; col < size; col++) {
        dark += modules[row][col] ? '1' : '0';
        if (modules[row][col]) totalDark++;
        if (col && modules[row][col] === runColor) runLength++;
        else if (col) {
          if (runLength >= 5) score += 3 + (runLength - 5);
          runColor = modules[row][col];
          runLength = 1;
        }
      }
      if (runLength >= 5) score += 3 + (runLength - 5);
      score += linePenalty(dark.split(''));
    }
    for (col = 0; col < size; col++) {
      runColor = modules[0][col];
      runLength = 1;
      dark = '';
      for (row = 0; row < size; row++) {
        dark += modules[row][col] ? '1' : '0';
        if (row && modules[row][col] === runColor) runLength++;
        else if (row) {
          if (runLength >= 5) score += 3 + (runLength - 5);
          runColor = modules[row][col];
          runLength = 1;
        }
      }
      if (runLength >= 5) score += 3 + (runLength - 5);
      score += linePenalty(dark.split(''));
    }
    for (row = 0; row < size - 1; row++) for (col = 0; col < size - 1; col++) {
      if (modules[row][col] === modules[row][col + 1] && modules[row][col] === modules[row + 1][col] && modules[row][col] === modules[row + 1][col + 1]) score += 3;
    }
    score += Math.floor(Math.abs((totalDark * 100 / (size * size)) - 50) / 5) * 10;
    return score;
  }
  function qrMatrix(text, ecLevel) {
    ecLevel = sanitizeEcLevel(ecLevel);
    var version = qrVersionForLength(utf8Bytes(String(text == null ? '' : text)).length, ecLevel);
    var state = createMatrix(version * 4 + 17);
    var codewords = qrCodewords(text, version, ecLevel);
    var best = null;
    var bestScore = Infinity;
    var mask, candidate, score;
    reserveFormats(state, version);
    for (mask = 0; mask < 8; mask++) {
      candidate = placeData(state, codewords, mask);
      placeFormat(candidate, ecLevel, mask);
      placeVersion(candidate, version);
      score = penalty(candidate);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  }
  function qrSvg(uri, opts) {
    opts = copy({ size: 200, ecLevel: 'M', quiet: 4 }, opts);
    var matrix = qrMatrix(uri, opts.ecLevel);
    var quiet = Math.max(0, Math.floor(opts.quiet || 0));
    var viewSize = matrix.length + quiet * 2;
    var size = Math.max(1, Math.floor(opts.size || 200));
    var path = '';
    var row, col;
    for (row = 0; row < matrix.length; row++) for (col = 0; col < matrix.length; col++) if (matrix[row][col]) path += 'M' + (col + quiet) + ' ' + (row + quiet) + 'h1v1H' + (col + quiet) + 'z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + viewSize + ' ' + viewSize + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges"><rect width="' + viewSize + '" height="' + viewSize + '" fill="#fff"/><path d="' + path + '" fill="#000"/></svg>';
  }

  var events = {
    onSetup: function(cb) { return on('setup', cb); },
    onVerify: function(cb) { return on('verify', cb); },
    onFail: function(cb) { return on('fail', cb); },
    onChallenge: function(cb) { return on('challenge', cb); }
  };

  return {
    setup: setup,
    verify: verify,
    generate: generate,
    challenge: challenge,
    protect: protect,
    lastVerified: lastVerified,
    timeSinceVerify: timeSinceVerify,
    replayGuard: replayGuard,
    backupVerify: backupVerify,
    qrSvg: qrSvg,
    base32encode: base32encode,
    base32decode: base32decode,
    hmacSha1: hmacSha1,
    hotp: hotp,
    totp: totp,
    policy: policy,
    events: events,
    onSetup: events.onSetup,
    onVerify: events.onVerify,
    onFail: events.onFail,
    onChallenge: events.onChallenge
  };
})();
if (typeof window !== 'undefined') {
  window.BareMetal = window.BareMetal || BareMetal;
  window.BareMetal.Authenticator = BareMetal.Authenticator;
}
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Authenticator;
