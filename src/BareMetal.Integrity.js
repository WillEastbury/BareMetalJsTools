/* BareMetal.Integrity - manifest and SHA-256 verification for browser module loading. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Integrity = (function () {
  'use strict';

  var textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  function bytes(source) {
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    if (typeof Uint8Array !== 'undefined' && source instanceof Uint8Array) return source;
    if (typeof Blob !== 'undefined' && source instanceof Blob) return source.arrayBuffer().then(function (buffer) { return new Uint8Array(buffer); });
    if (typeof source === 'string') {
      if (textEncoder) return textEncoder.encode(source);
      return new Uint8Array(unescape(encodeURIComponent(source)).split('').map(function (ch) { return ch.charCodeAt(0); }));
    }
    if (source && source.buffer instanceof ArrayBuffer) return new Uint8Array(source.buffer, source.byteOffset || 0, source.byteLength);
    throw new TypeError('Unsupported integrity source');
  }

  function hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (value) {
      return ('0' + value.toString(16)).slice(-2);
    }).join('');
  }

  async function sha256(source) {
    if (!crypto || !crypto.subtle) throw new Error('Web Crypto SHA-256 is unavailable');
    var data = await Promise.resolve(bytes(source));
    return hex(await crypto.subtle.digest('SHA-256', data));
  }

  async function verify(source, expected) {
    if (typeof expected !== 'string') throw new TypeError('Expected SHA-256 hex digest');
    var actual = await sha256(source);
    var normalized = expected.trim().toLowerCase().replace(/^sha-256:/i, '').replace(/^0x/i, '');
    return actual === normalized;
  }

  function entryPath(entry) {
    if (typeof entry === 'string') return entry;
    return entry.path || entry.url || entry.file;
  }

  function normalizedBase(baseUrl) {
    if (!baseUrl) return '';
    return baseUrl.replace(/\/?$/, '/');
  }

  function resolveUrl(baseUrl, path) {
    if (/^[a-z]+:/i.test(path) || path.indexOf('//') === 0) return path;
    if (typeof URL !== 'undefined') return new URL(path, normalizedBase(baseUrl)).href;
    return normalizedBase(baseUrl) + path.replace(/^\/+/, '');
  }

  function createManifest(entries, options) {
    options = options || {};
    var modules = {};
    (entries || []).forEach(function (entry) {
      var name = entry.name || entryPath(entry);
      modules[name] = {
        path: entryPath(entry),
        sha256: entry.sha256 || entry.hash,
        size: entry.size,
        encoding: entry.encoding,
        minified: entry.minified
      };
    });
    return {
      version: options.version || 1,
      algorithm: 'SHA-256',
      revision: options.revision || null,
      commit: options.commit || null,
      source: options.source || null,
      modules: modules
    };
  }

  async function verifyManifest(manifest, options) {
    options = options || {};
    if (!manifest || typeof manifest !== 'object') throw new TypeError('Manifest is required');
    if (manifest.algorithm && String(manifest.algorithm).toUpperCase() !== 'SHA-256') {
      throw new Error('Unsupported manifest digest algorithm: ' + manifest.algorithm);
    }
    var entries = manifest.modules || manifest.entries || {};
    var names = Array.isArray(entries) ? entries.map(function (entry) { return entry.name || entryPath(entry); }) : Object.keys(entries);
    var verified = [];
    var failed = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var raw = Array.isArray(entries) ? entries[i] : entries[name];
      var entry = typeof raw === 'string' ? { path: raw } : Object.assign({}, raw);
      if (!entry.sha256 && entry.hash) entry.sha256 = entry.hash;
      if (!entry.sha256) {
        failed.push({ name: name, path: entryPath(entry), reason: 'missing SHA-256 digest' });
        continue;
      }
      var path = entryPath(entry) || name;
      var url = resolveUrl(options.baseUrl || manifest.baseUrl || '', path);
      try {
        var response = await fetch(url, Object.assign({ cache: 'no-store' }, options.fetchOptions || {}));
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var data = await response.arrayBuffer();
        var bytesOk = await verify(data, entry.sha256);
        if (!bytesOk) throw new Error('SHA-256 mismatch');
        if (entry.size != null && data.byteLength !== Number(entry.size)) throw new Error('size mismatch');
        verified.push({ name: name, path: path, url: url, sha256: entry.sha256, size: data.byteLength });
      } catch (error) {
        failed.push({ name: name, path: path, reason: error.message || String(error) });
      }
    }
    return {
      ok: failed.length === 0,
      revision: manifest.revision || manifest.commit || null,
      verified: verified,
      failed: failed
    };
  }

  return {
    sha256: sha256,
    verify: verify,
    createManifest: createManifest,
    verifyManifest: verifyManifest
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Integrity;
