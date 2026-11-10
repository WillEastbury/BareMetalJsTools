/* BareMetal.ModuleLoader - verified, compressed, cacheable browser module loading. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.ModuleLoader = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var manifestUrl = options.manifestUrl;
    var manifest = options.manifest || null;
    var baseUrl = options.baseUrl || '';
    var cache = new Map();
    var secure = options.secureTransport || null;

    function resolveUrl(path) {
      if (/^[a-z]+:/i.test(path) || path.indexOf('//') === 0) return path;
      if (typeof URL !== 'undefined') return new URL(path, baseUrl || manifestUrl || location.href).href;
      return (baseUrl || '').replace(/\/?$/, '/') + path.replace(/^\/+/, '');
    }

    async function httpFetch(url, fetchOptions) {
      if (secure && typeof secure.fetch === 'function') return secure.fetch(url, fetchOptions);
      return fetch(url, fetchOptions);
    }

    async function loadManifest() {
      if (manifest) return manifest;
      if (!manifestUrl) throw new Error('ModuleLoader requires manifestUrl or manifest');
      var response = await httpFetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Manifest load failed: HTTP ' + response.status);
      manifest = await response.json();
      return manifest;
    }

    async function decompress(buffer, encoding) {
      if (!encoding) return buffer;
      if (typeof DecompressionStream === 'undefined') throw new Error('DecompressionStream is unavailable for encoding: ' + encoding);
      var stream = new DecompressionStream(encoding);
      var response = new Response(buffer).body.pipeThrough(stream);
      return new Response(response).arrayBuffer();
    }

    async function execute(code, url) {
      if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
        var fn = new Function(code + '\n//# sourceURL=' + url);
        fn();
        return;
      }
      await new Promise(function (resolve, reject) {
        var blob = new Blob([code, '\n//# sourceURL=' + url], { type: 'text/javascript' });
        var blobUrl = URL.createObjectURL(blob);
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = blobUrl;
        script.onload = function () { URL.revokeObjectURL(blobUrl); resolve(); };
        script.onerror = function () { URL.revokeObjectURL(blobUrl); reject(new Error('Module execution failed: ' + url)); };
        (document.head || document.documentElement).appendChild(script);
      });
    }

    async function load(name) {
      if (cache.has(name)) return cache.get(name);
      var current = await loadManifest();
      var entries = current.modules || current.entries || {};
      var entry = Array.isArray(entries)
        ? entries.find(function (item) { return (item.name || item.path || item.file) === name; })
        : entries[name];
      if (!entry) throw new Error('Module is not in manifest: ' + name);
      entry = typeof entry === 'string' ? { path: entry } : Object.assign({}, entry);
      var path = entry.path || entry.url || entry.file || name;
      var url = resolveUrl(path);
      var response = await httpFetch(url, { cache: options.cache || 'no-store' });
      if (!response.ok) throw new Error('Module load failed: HTTP ' + response.status);

      var contentEncoding = entry.encoding || response.headers && response.headers.get('content-encoding');
      var buffer = await response.arrayBuffer();
      if (contentEncoding) {
        var normalized = String(contentEncoding).toLowerCase();
        if (normalized === 'gzip' || normalized === 'deflate' || normalized === 'deflate-raw') {
          buffer = await decompress(buffer, normalized);
        }
      }

      if (entry.sha256 || entry.hash) {
        if (!BareMetal.Integrity) throw new Error('BareMetal.Integrity is required for verified module loading');
        var valid = await BareMetal.Integrity.verify(buffer, entry.sha256 || entry.hash);
        if (!valid) throw new Error('Integrity verification failed: ' + name);
      } else if (options.requireIntegrity) {
        throw new Error('Manifest entry has no digest: ' + name);
      }
      var code = new TextDecoder().decode(new Uint8Array(buffer));
      await execute(code, url);
      var result = { name: name, url: url, bytes: buffer.byteLength, globalName: entry.globalName || null };
      cache.set(name, result);
      return result;
    }

    async function loadAll(names) {
      if (!names) {
        var current = await loadManifest();
        var entries = current.modules || current.entries || {};
        names = Array.isArray(entries)
          ? entries.map(function (entry) { return entry.name || entry.path || entry.file; })
          : Object.keys(entries);
      }
      var results = [];
      for (var i = 0; i < names.length; i++) results.push(await load(names[i]));
      return results;
    }

    function clearCache() { cache.clear(); }
    return { loadManifest: loadManifest, load: load, loadAll: loadAll, clearCache: clearCache };
  }

  return { create: create };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.ModuleLoader;
