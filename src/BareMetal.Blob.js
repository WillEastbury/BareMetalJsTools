/* istanbul ignore next */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Blob = (function(){
  'use strict';

  /* istanbul ignore next */
  var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
  var cryptoRef = g.crypto || null;
  var subtle = cryptoRef && cryptoRef.subtle ? cryptoRef.subtle : null;
  var encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  var DEFAULT_CHUNK_SIZE = 1024 * 1024;

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function now() { return Date.now(); }
  function iso(ts) { return new Date(ts == null ? now() : ts).toISOString(); }
  function safeCall(fn) {
    if (typeof fn !== 'function') return;
    try { return fn.apply(null, Array.prototype.slice.call(arguments, 1)); } catch (_) {}
  }
  function copy(a, b) {
    var out = {}, k;
    for (k in (a || {})) if (own(a, k)) out[k] = a[k];
    for (k in (b || {})) if (own(b, k)) out[k] = b[k];
    return out;
  }
  function cloneObject(obj) {
    var out = {}, k;
    for (k in (obj || {})) if (own(obj, k)) out[k] = obj[k];
    return out;
  }
  function defineHidden(obj, key, value) {
    try { Object.defineProperty(obj, key, { value: value, writable: true, configurable: true, enumerable: false }); }
    catch (_) { obj[key] = value; }
    return obj;
  }
  function isArrayBuffer(v) { return typeof ArrayBuffer !== 'undefined' && v instanceof ArrayBuffer; }
  function isView(v) { return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(v); }
  function isBlobLike(v) { return !!(v && typeof v === 'object' && typeof v.size === 'number' && typeof v.slice === 'function'); }
  function isDescriptor(v) { return !!(v && typeof v === 'object' && own(v, 'id') && own(v, 'size') && own(v, 'version')); }
  function sliceView(view) { return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength); }
  function guessType(data, fallback) {
    if (data && data.type) return data.type || fallback || '';
    if (typeof data === 'string') return fallback || 'text/plain';
    if (isArrayBuffer(data) || isView(data)) return fallback || 'application/octet-stream';
    return fallback || 'application/octet-stream';
  }
  function utf8(str) {
    var i, out;
    str = String(str == null ? '' : str);
    if (encoder) return encoder.encode(str).buffer;
    out = new Uint8Array(str.length);
    for (i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 255;
    return out.buffer;
  }
  function toHex(buffer) {
    var bytes = new Uint8Array(buffer), out = '', i, h;
    for (i = 0; i < bytes.length; i++) {
      h = bytes[i].toString(16);
      out += h.length === 1 ? '0' + h : h;
    }
    return out;
  }
  function bytesToBase64(bytes) {
    var i, bin = '';
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
    for (i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function base64ToBytes(base64) {
    var clean = String(base64 || '').replace(/\s+/g, ''), bin, out, i;
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(clean, 'base64'));
    bin = atob(clean);
    out = new Uint8Array(bin.length);
    for (i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function randomHex(n) {
    var bytes = new Uint8Array(n || 8), i, out = '';
    if (cryptoRef && cryptoRef.getRandomValues) cryptoRef.getRandomValues(bytes);
    else for (i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    for (i = 0; i < bytes.length; i++) out += ('0' + bytes[i].toString(16)).slice(-2);
    return out;
  }
  function makeId() { return 'blob_' + now().toString(36) + '_' + randomHex(6); }
  function computeChunks(size, chunkSize) {
    var z = Number(chunkSize) || DEFAULT_CHUNK_SIZE;
    return size > 0 ? Math.ceil(size / z) : 0;
  }
  function computeUploadChunks(size, chunkSize) {
    var z = Number(chunkSize) || DEFAULT_CHUNK_SIZE;
    return size > 0 ? Math.ceil(size / z) : 1;
  }
  function decorateBlob(blob) {
    if (!blob) return blob;
    if (typeof blob.arrayBuffer !== 'function') {
      defineHidden(blob, '__bmArrayBufferPolyfill', true);
      defineHidden(blob, 'arrayBuffer', function() { return toArrayBufferViaFileReader(blob); });
    }
    if (typeof blob.text !== 'function') {
      defineHidden(blob, '__bmTextPolyfill', true);
      defineHidden(blob, 'text', function() { return toTextViaFileReader(blob); });
    }
    return blob;
  }
  function asBlob(data, type) {
    if (data && data.__blob && isBlobLike(data.__blob)) return decorateBlob(data.__blob);
    if (isBlobLike(data)) return decorateBlob(data);
    if (isArrayBuffer(data)) return decorateBlob(new Blob([data], { type: type || guessType(data) }));
    if (isView(data)) return decorateBlob(new Blob([sliceView(data)], { type: type || guessType(data) }));
    if (typeof data === 'string') return decorateBlob(new Blob([data], { type: type || 'text/plain' }));
    if (data == null) return decorateBlob(new Blob([''], { type: type || 'application/octet-stream' }));
    return decorateBlob(new Blob([JSON.stringify(data)], { type: type || 'application/json' }));
  }
  function toArrayBufferViaFileReader(blob) {
    return new Promise(function(resolve, reject) {
      var Reader = g.FileReader, fr;
      if (!Reader) return reject(new Error('FileReader unavailable'));
      try {
        fr = new Reader();
        fr.onload = function() { resolve(fr.result); };
        fr.onerror = function() { reject(fr.error || new Error('FileReader error')); };
        fr.readAsArrayBuffer(blob);
      } catch (err) { reject(err); }
    });
  }
  function toTextViaFileReader(blob) {
    return new Promise(function(resolve, reject) {
      var Reader = g.FileReader, fr;
      if (!Reader) return reject(new Error('FileReader unavailable'));
      try {
        fr = new Reader();
        fr.onload = function() { resolve(fr.result); };
        fr.onerror = function() { reject(fr.error || new Error('FileReader error')); };
        fr.readAsText(blob);
      } catch (err) { reject(err); }
    });
  }
  function toDataURLViaFileReader(blob) {
    return new Promise(function(resolve, reject) {
      var Reader = g.FileReader, fr;
      if (!Reader) return reject(new Error('FileReader unavailable'));
      try {
        fr = new Reader();
        fr.onload = function() { resolve(fr.result); };
        fr.onerror = function() { reject(fr.error || new Error('FileReader error')); };
        fr.readAsDataURL(blob);
      } catch (err) { reject(err); }
    });
  }
  function readHeader(response, name) {
    var headers = response && response.headers;
    if (!headers) return null;
    if (typeof headers.get === 'function') return headers.get(name) || headers.get(String(name || '').toLowerCase()) || null;
    return headers[name] || headers[String(name || '').toLowerCase()] || null;
  }
  async function toArrayBuffer(data) {
    if (data && data.__blob && isBlobLike(data.__blob)) data = data.__blob;
    if (isArrayBuffer(data)) return data;
    if (isView(data)) return sliceView(data);
    if (typeof data === 'string') return utf8(data);
    if (data == null) return new ArrayBuffer(0);
    if (isBlobLike(data) && typeof data.arrayBuffer === 'function') return data.arrayBuffer();
    if (isBlobLike(data)) return toArrayBufferViaFileReader(data);
    return utf8(JSON.stringify(data));
  }
  async function blobText(blob) {
    if (blob && typeof blob.text === 'function' && !blob.__bmTextPolyfill) return blob.text();
    return toTextViaFileReader(blob);
  }
  function create(data, opts) {
    opts = opts || {};
    var chunkSize = Number(opts.chunkSize) || DEFAULT_CHUNK_SIZE;
    var blob = asBlob(data, opts.type);
    var descriptor = {
      id: opts.id || makeId(),
      size: blob.size || 0,
      type: opts.type || blob.type || guessType(data),
      chunks: computeChunks(blob.size || 0, chunkSize),
      hash: null,
      metadata: cloneObject(opts.metadata),
      created: iso(),
      version: Number(opts.version) || 1
    };
    defineHidden(descriptor, '__blob', blob);
    defineHidden(descriptor, '__chunkSize', chunkSize);
    if (opts.hash) defineHidden(descriptor, 'hashPromise', hash(blob, 'sha256').then(function(value) { descriptor.hash = value; return value; }).catch(function() { return null; }));
    return descriptor;
  }
  async function chunk(blob, chunkSize) {
    var source = asBlob(blob, blob && blob.type);
    var size = source.size || 0;
    var out = [];
    var z = Number(chunkSize || (blob && blob.__chunkSize)) || DEFAULT_CHUNK_SIZE;
    var offset = 0, index = 0, end;
    while (offset < size) {
      end = Math.min(size, offset + z);
      out.push({ index: index, offset: offset, size: end - offset, data: await toArrayBuffer(source.slice(offset, end)) });
      offset = end;
      index++;
    }
    return out;
  }
  function normalizeUploaded(uploaded) {
    var out = {}, i, k;
    if (!uploaded) return out;
    if (Array.isArray(uploaded)) {
      for (i = 0; i < uploaded.length; i++) {
        if (typeof uploaded[i] === 'number') out[uploaded[i]] = 1;
        else if (uploaded[i] && typeof uploaded[i] === 'object' && own(uploaded[i], 'index')) out[uploaded[i].index] = 1;
      }
      return out;
    }
    for (k in uploaded) if (own(uploaded, k) && uploaded[k]) out[Number(k)] = 1;
    return out;
  }
  function chunkByteSize(index, totalSize, chunkSize) {
    var start = index * chunkSize;
    var end = Math.min(totalSize, start + chunkSize);
    return Math.max(0, end - start);
  }
  function cloneToken(token) {
    var uploaded = {}, k;
    if (!token) return null;
    for (k in (token.uploaded || {})) if (own(token.uploaded, k) && token.uploaded[k]) uploaded[k] = 1;
    return {
      id: token.id,
      size: token.size,
      type: token.type,
      chunkSize: token.chunkSize,
      totalChunks: token.totalChunks,
      version: token.version,
      metadata: cloneObject(token.metadata),
      created: token.created,
      updated: token.updated,
      completed: !!token.completed,
      uploaded: uploaded
    };
  }
  function prepareToken(resumeToken, descriptor, blob, chunkSize) {
    var token = cloneToken(resumeToken) || {};
    token.id = token.id || descriptor.id || makeId();
    token.size = blob.size || 0;
    token.type = descriptor.type || blob.type || token.type || '';
    token.chunkSize = Number(chunkSize) || DEFAULT_CHUNK_SIZE;
    token.totalChunks = computeUploadChunks(token.size, token.chunkSize);
    token.version = Number(token.version || descriptor.version || 1);
    token.metadata = cloneObject(token.metadata || descriptor.metadata);
    token.created = token.created || descriptor.created || iso();
    token.updated = iso();
    token.completed = false;
    token.uploaded = normalizeUploaded(token.uploaded);
    return token;
  }
  function uploadedBytes(token) {
    var total = 0, k;
    for (k in token.uploaded) if (own(token.uploaded, k) && token.uploaded[k]) total += chunkByteSize(Number(k), token.size, token.chunkSize);
    return total;
  }
  function progressPercent(bytes, size) {
    if (!size) return bytes > 0 ? 100 : 0;
    return Math.round((bytes / size) * 10000) / 100;
  }
  function uploadError(err, token, response) {
    var out = err instanceof Error ? err : new Error(String(err || 'Upload failed'));
    out.resumeToken = cloneToken(token);
    if (response) out.response = response;
    return out;
  }
  async function upload(blob, url, opts) {
    opts = opts || {};
    if (typeof g.fetch !== 'function') throw new Error('fetch unavailable');
    var descriptor = isDescriptor(blob) ? blob : create(blob, { type: opts.type, metadata: opts.metadata, chunkSize: opts.chunkSize });
    var source = asBlob(descriptor, descriptor.type);
    var token = prepareToken(opts.resumeToken, descriptor, source, Number(opts.chunkSize || descriptor.__chunkSize) || DEFAULT_CHUNK_SIZE);
    var indices = [];
    var method = opts.method || 'PUT';
    var parallel = Math.max(1, parseInt(opts.parallel, 10) || 3);
    var sentBytes = uploadedBytes(token);
    var etag = null;
    var failed = null;
    var i;

    for (i = 0; i < token.totalChunks; i++) if (!token.uploaded[i]) indices.push(i);
    safeCall(opts.onProgress, progressPercent(sentBytes, token.size), sentBytes, cloneToken(token));

    async function sendChunk(index) {
      var start = index * token.chunkSize;
      var end = Math.min(token.size, start + token.chunkSize);
      var piece = source.slice(start, end);
      var body = await toArrayBuffer(piece);
      var headers = copy(opts.headers, {
        'Content-Type': token.type || 'application/octet-stream',
        'X-Blob-Id': token.id,
        'X-Blob-Version': String(token.version),
        'X-Chunk-Index': String(index),
        'X-Chunk-Count': String(token.totalChunks),
        'X-Chunk-Size': String(body.byteLength),
        'Content-Range': token.size ? ('bytes ' + start + '-' + Math.max(start, end - 1) + '/' + token.size) : 'bytes */0'
      });
      var response;
      if (token.metadata && Object.keys(token.metadata).length) headers['X-Blob-Metadata'] = JSON.stringify(token.metadata);
      if (opts.signal && opts.signal.aborted) throw uploadError(new Error('Upload aborted'), token);
      try {
        response = await g.fetch(url, { method: method, headers: headers, body: body, signal: opts.signal });
      } catch (err) {
        throw uploadError(err, token);
      }
      if (!response || response.ok === false) throw uploadError(new Error('Upload failed for chunk ' + index), token, response);
      token.uploaded[index] = 1;
      token.updated = iso();
      etag = readHeader(response, 'etag') || etag;
      token.version = Number(readHeader(response, 'x-blob-version') || token.version);
      sentBytes += body.byteLength;
      safeCall(opts.onProgress, progressPercent(sentBytes, token.size), sentBytes, cloneToken(token));
    }

    async function worker() {
      var index;
      while (true) {
        if (failed) throw failed;
        index = indices.length ? indices.shift() : null;
        if (index === null) return;
        try { await sendChunk(index); }
        catch (err) { failed = uploadError(err, token, err && err.response); throw failed; }
      }
    }

    try {
      await Promise.all((function() {
        var workers = [], count = Math.min(parallel, indices.length || 1), j;
        for (j = 0; j < count; j++) workers.push(worker());
        return workers;
      })());
    } catch (err) {
      throw uploadError(err, token, err && err.response);
    }

    token.completed = true;
    token.updated = iso();
    return { id: token.id, etag: etag, version: token.version, resumeToken: cloneToken(token) };
  }
  function resume(url, resumeToken, blob, opts) {
    return upload(blob, url, copy(opts, { resumeToken: resumeToken }));
  }
  function metadataFromResponse(response) {
    var out = {
      type: readHeader(response, 'content-type') || '',
      etag: readHeader(response, 'etag') || null,
      size: parseInt(readHeader(response, 'content-length') || '0', 10) || 0
    };
    try {
      out.metadata = JSON.parse(readHeader(response, 'x-blob-metadata') || '{}');
    } catch (_) {
      out.metadata = {};
    }
    return out;
  }
  async function readResponseBuffer(response, onProgress, knownTotal) {
    var reader, parts = [], loaded = 0, value;
    if (response && response.body && typeof response.body.getReader === 'function') {
      reader = response.body.getReader();
      while (true) {
        value = await reader.read();
        if (value.done) break;
        parts.push(sliceView(value.value));
        loaded += value.value.byteLength || 0;
        safeCall(onProgress, progressPercent(loaded, knownTotal || 0), loaded);
      }
      return concatArrayBuffers(parts);
    }
    if (response && typeof response.arrayBuffer === 'function') {
      value = await response.arrayBuffer();
      safeCall(onProgress, 100, value.byteLength || 0);
      return value;
    }
    if (response && typeof response.blob === 'function') return toArrayBuffer(await response.blob());
    return new ArrayBuffer(0);
  }
  function concatArrayBuffers(buffers) {
    var total = 0, i, out, offset = 0, view;
    for (i = 0; i < buffers.length; i++) total += buffers[i].byteLength || 0;
    out = new Uint8Array(total);
    for (i = 0; i < buffers.length; i++) {
      view = new Uint8Array(buffers[i]);
      out.set(view, offset);
      offset += view.length;
    }
    return out.buffer;
  }
  async function download(url, opts) {
    opts = opts || {};
    if (typeof g.fetch !== 'function') throw new Error('fetch unavailable');
    var headers = copy(opts.headers);
    var meta, size = 0, chunkSize, start, end, response, parts, loaded;

    if (opts.chunks) {
      try {
        response = await g.fetch(url, { method: 'HEAD', headers: headers, signal: opts.signal });
        size = parseInt(readHeader(response, 'content-length') || '0', 10) || 0;
        meta = metadataFromResponse(response);
      } catch (_) {}
      if (size > 0) {
        chunkSize = Number(opts.chunkSize) || DEFAULT_CHUNK_SIZE;
        parts = [];
        loaded = 0;
        for (start = 0; start < size; start += chunkSize) {
          end = Math.min(size - 1, start + chunkSize - 1);
          response = await g.fetch(url, { method: 'GET', headers: copy(headers, { Range: 'bytes=' + start + '-' + end }), signal: opts.signal });
          parts.push(await readResponseBuffer(response, null, end - start + 1));
          loaded += Math.max(0, end - start + 1);
          safeCall(opts.onProgress, progressPercent(loaded, size), loaded);
        }
        return { blob: new Blob(parts, { type: (meta && meta.type) || '' }), metadata: meta || { size: size, type: '' } };
      }
    }

    response = await g.fetch(url, { method: 'GET', headers: headers, signal: opts.signal });
    meta = metadataFromResponse(response);
    return { blob: new Blob([await readResponseBuffer(response, opts.onProgress, meta.size)], { type: meta.type || '' }), metadata: meta };
  }
  function md5Hex(buffer) {
    var bytes = new Uint8Array(buffer), words = [], bitLength = bytes.length * 8, i;
    function add(x, y) { var l = (x & 65535) + (y & 65535), m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 65535); }
    function rol(n, c) { return (n << c) | (n >>> (32 - c)); }
    function cmn(q, a, b, x, s, t) { return add(rol(add(add(a, q), add(x, t)), s), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function wordHex(n) {
      var j, out = '', v;
      for (j = 0; j < 4; j++) { v = (n >>> (j * 8)) & 255; out += ('0' + v.toString(16)).slice(-2); }
      return out;
    }
    for (i = 0; i < bytes.length; i++) words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8));
    words[bitLength >> 5] = (words[bitLength >> 5] || 0) | (128 << (bitLength % 32));
    words[(((bitLength + 64) >>> 9) << 4) + 14] = bitLength;
    var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    var oa, ob, oc, od, x;
    for (i = 0; i < words.length; i += 16) {
      x = words.slice(i, i + 16);
      while (x.length < 16) x.push(0);
      oa = a; ob = b; oc = c; od = d;
      a = ff(a, b, c, d, x[0], 7, -680876936); d = ff(d, a, b, c, x[1], 12, -389564586); c = ff(c, d, a, b, x[2], 17, 606105819); b = ff(b, c, d, a, x[3], 22, -1044525330);
      a = ff(a, b, c, d, x[4], 7, -176418897); d = ff(d, a, b, c, x[5], 12, 1200080426); c = ff(c, d, a, b, x[6], 17, -1473231341); b = ff(b, c, d, a, x[7], 22, -45705983);
      a = ff(a, b, c, d, x[8], 7, 1770035416); d = ff(d, a, b, c, x[9], 12, -1958414417); c = ff(c, d, a, b, x[10], 17, -42063); b = ff(b, c, d, a, x[11], 22, -1990404162);
      a = ff(a, b, c, d, x[12], 7, 1804603682); d = ff(d, a, b, c, x[13], 12, -40341101); c = ff(c, d, a, b, x[14], 17, -1502002290); b = ff(b, c, d, a, x[15], 22, 1236535329);
      a = gg(a, b, c, d, x[1], 5, -165796510); d = gg(d, a, b, c, x[6], 9, -1069501632); c = gg(c, d, a, b, x[11], 14, 643717713); b = gg(b, c, d, a, x[0], 20, -373897302);
      a = gg(a, b, c, d, x[5], 5, -701558691); d = gg(d, a, b, c, x[10], 9, 38016083); c = gg(c, d, a, b, x[15], 14, -660478335); b = gg(b, c, d, a, x[4], 20, -405537848);
      a = gg(a, b, c, d, x[9], 5, 568446438); d = gg(d, a, b, c, x[14], 9, -1019803690); c = gg(c, d, a, b, x[3], 14, -187363961); b = gg(b, c, d, a, x[8], 20, 1163531501);
      a = gg(a, b, c, d, x[13], 5, -1444681467); d = gg(d, a, b, c, x[2], 9, -51403784); c = gg(c, d, a, b, x[7], 14, 1735328473); b = gg(b, c, d, a, x[12], 20, -1926607734);
      a = hh(a, b, c, d, x[5], 4, -378558); d = hh(d, a, b, c, x[8], 11, -2022574463); c = hh(c, d, a, b, x[11], 16, 1839030562); b = hh(b, c, d, a, x[14], 23, -35309556);
      a = hh(a, b, c, d, x[1], 4, -1530992060); d = hh(d, a, b, c, x[4], 11, 1272893353); c = hh(c, d, a, b, x[7], 16, -155497632); b = hh(b, c, d, a, x[10], 23, -1094730640);
      a = hh(a, b, c, d, x[13], 4, 681279174); d = hh(d, a, b, c, x[0], 11, -358537222); c = hh(c, d, a, b, x[3], 16, -722521979); b = hh(b, c, d, a, x[6], 23, 76029189);
      a = hh(a, b, c, d, x[9], 4, -640364487); d = hh(d, a, b, c, x[12], 11, -421815835); c = hh(c, d, a, b, x[15], 16, 530742520); b = hh(b, c, d, a, x[2], 23, -995338651);
      a = ii(a, b, c, d, x[0], 6, -198630844); d = ii(d, a, b, c, x[7], 10, 1126891415); c = ii(c, d, a, b, x[14], 15, -1416354905); b = ii(b, c, d, a, x[5], 21, -57434055);
      a = ii(a, b, c, d, x[12], 6, 1700485571); d = ii(d, a, b, c, x[3], 10, -1894986606); c = ii(c, d, a, b, x[10], 15, -1051523); b = ii(b, c, d, a, x[1], 21, -2054922799);
      a = ii(a, b, c, d, x[8], 6, 1873313359); d = ii(d, a, b, c, x[15], 10, -30611744); c = ii(c, d, a, b, x[6], 15, -1560198380); b = ii(b, c, d, a, x[13], 21, 1309151649);
      a = ii(a, b, c, d, x[4], 6, -145523070); d = ii(d, a, b, c, x[11], 10, -1120210379); c = ii(c, d, a, b, x[2], 15, 718787259); b = ii(b, c, d, a, x[9], 21, -343485551);
      a = add(a, oa); b = add(b, ob); c = add(c, oc); d = add(d, od);
    }
    return wordHex(a) + wordHex(b) + wordHex(c) + wordHex(d);
  }
  async function hash(data, algorithm) {
    var algo = String(algorithm || 'sha256').toLowerCase();
    var buffer = await toArrayBuffer(data);
    if (algo === 'md5') return md5Hex(buffer);
    if (!subtle || typeof subtle.digest !== 'function') throw new Error('Web Crypto digest unavailable');
    return toHex(await subtle.digest(algo === 'sha1' ? 'SHA-1' : 'SHA-256', buffer));
  }
  async function resolveAesKey(key) {
    var raw;
    if (!subtle || typeof subtle.importKey !== 'function') throw new Error('Web Crypto AES unavailable');
    if (key && typeof key === 'object' && key.type && key.algorithm) return key;
    raw = await toArrayBuffer(key);
    if (raw.byteLength !== 16 && raw.byteLength !== 24 && raw.byteLength !== 32) raw = await subtle.digest('SHA-256', raw);
    return subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }
  async function encrypt(blob, key) {
    var source = asBlob(blob, blob && blob.type);
    var iv = new Uint8Array(12);
    var aesKey = await resolveAesKey(key);
    if (cryptoRef && cryptoRef.getRandomValues) cryptoRef.getRandomValues(iv);
    else { iv[0] = now() & 255; }
    var encrypted = await subtle.encrypt({ name: 'AES-GCM', iv: iv }, aesKey, await toArrayBuffer(source));
    var out = decorateBlob(new Blob([encrypted], { type: 'application/octet-stream' }));
    defineHidden(out, '__type', source.type || 'application/octet-stream');
    return { encrypted: out, iv: iv };
  }
  async function decrypt(encrypted, key, iv) {
    var source = asBlob(encrypted, 'application/octet-stream');
    var aesKey = await resolveAesKey(key);
    var plain = await subtle.decrypt({ name: 'AES-GCM', iv: isView(iv) ? iv : new Uint8Array(iv) }, aesKey, await toArrayBuffer(source));
    return decorateBlob(new Blob([plain], { type: encrypted && encrypted.__type || '' }));
  }
  async function compress(blob) {
    var source = asBlob(blob, blob && blob.type);
    if (!g.CompressionStream || !source.stream || typeof g.Response === 'undefined') return source;
    try { return await new g.Response(source.stream().pipeThrough(new g.CompressionStream('deflate'))).blob(); }
    catch (_) { return source; }
  }
  async function decompress(blob) {
    var source = asBlob(blob, blob && blob.type);
    if (!g.DecompressionStream || !source.stream || typeof g.Response === 'undefined') return source;
    try { return await new g.Response(source.stream().pipeThrough(new g.DecompressionStream('deflate'))).blob(); }
    catch (_) { return source; }
  }
  async function transform(blob, transforms) {
    var current = asBlob(blob, blob && blob.type);
    var steps = transforms || [];
    var i, step, result, pieces;
    for (i = 0; i < steps.length; i++) {
      step = steps[i];
      if (typeof step === 'function') {
        result = await step(current);
        current = isBlobLike(result) ? result : asBlob(result, current.type);
      } else if (step === 'compress') {
        current = await compress(current);
      } else if (step === 'decompress') {
        current = await decompress(current);
      } else if (step === 'split') {
        pieces = await chunk(current, DEFAULT_CHUNK_SIZE);
        current = concat(pieces.map(function(piece) { return new Blob([piece.data], { type: current.type || '' }); }), current.type);
      } else if (step && typeof step === 'object') {
        if (step.type === 'compress') current = await compress(current);
        else if (step.type === 'decompress') current = await decompress(current);
        else if (step.type === 'encrypt') { result = await encrypt(current, step.key); if (typeof step.capture === 'function') step.capture(result); current = result.encrypted; }
        else if (step.type === 'decrypt') current = await decrypt(current, step.key, step.iv);
        else if (typeof step.fn === 'function') { result = await step.fn(current, step); current = isBlobLike(result) ? result : asBlob(result, current.type); }
      }
    }
    return current;
  }
  async function toDataURL(blob) {
    var source = asBlob(blob, blob && blob.type);
    try { return await toDataURLViaFileReader(source); }
    catch (_) { return 'data:' + (source.type || 'application/octet-stream') + ';base64,' + await toBase64(source); }
  }
  function fromDataURL(dataUrl) {
    var match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/i.exec(String(dataUrl || ''));
    var type, data;
    if (!match) return new Blob([''], { type: 'application/octet-stream' });
    type = match[1] || 'application/octet-stream';
    data = match[3] || '';
    return match[2] ? fromBase64(data, type) : decorateBlob(new Blob([decodeURIComponent(data)], { type: type }));
  }
  async function toBase64(blob) {
    return bytesToBase64(new Uint8Array(await toArrayBuffer(blob)));
  }
  function fromBase64(str, type) {
    var bytes = base64ToBytes(str);
    return decorateBlob(new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: type || 'application/octet-stream' }));
  }
  function slice(blob, start, end) {
    return asBlob(blob, blob && blob.type).slice(start || 0, end == null ? undefined : end);
  }
  function concat(blobs, type) {
    var list = (blobs || []).map(function(item) { return asBlob(item, type); });
    return decorateBlob(new Blob(list, { type: type || (list[0] && list[0].type) || '' }));
  }
  async function diff(blobA, blobB) {
    var a = new Uint8Array(await toArrayBuffer(blobA));
    var b = new Uint8Array(await toArrayBuffer(blobB));
    var max = Math.min(a.length, b.length), i, offset = null;
    for (i = 0; i < max; i++) if (a[i] !== b[i]) { offset = i; break; }
    if (offset === null && a.length !== b.length) offset = max;
    return { same: offset === null, sizeA: a.length, sizeB: b.length, firstDiffOffset: offset };
  }
  async function fingerprint(blob) {
    return (await hash(blob, 'sha256')).slice(0, 16);
  }
  function latestRecord(records) { return records && records.length ? records[records.length - 1] : null; }
  function listSummary(record) {
    return { id: record.id, size: record.size, type: record.type, created: record.created, metadata: cloneObject(record.metadata) };
  }
  function matchesList(record, opts) {
    opts = opts || {};
    if (!record) return false;
    if (opts.type && record.type !== opts.type) return false;
    return true;
  }
  function memoryStore() {
    var db = {};
    return {
      put: function(id, blob, metadata) {
        var key = String(id || makeId());
        var records = db[key] || (db[key] = []);
        var source = asBlob(blob, blob && blob.type);
        var record = { id: key, blob: source, metadata: cloneObject(metadata), version: records.length ? records[records.length - 1].version + 1 : 1, created: iso(), size: source.size || 0, type: source.type || '' };
        records.push(record);
        return Promise.resolve({ id: key, version: record.version });
      },
      get: function(id) {
        var record = latestRecord(db[id]);
        return Promise.resolve(record ? { blob: record.blob, metadata: cloneObject(record.metadata), version: record.version } : null);
      },
      delete: function(id) { delete db[id]; return Promise.resolve(true); },
      list: function(opts) {
        var out = [], key, record;
        for (key in db) if (own(db, key)) { record = latestRecord(db[key]); if (matchesList(record, opts)) out.push(listSummary(record)); }
        out.sort(function(a, b) { return String(a.id).localeCompare(String(b.id)); });
        if (opts && opts.limit) out = out.slice(0, opts.limit);
        return Promise.resolve(out);
      },
      exists: function(id) { return Promise.resolve(!!latestRecord(db[id])); },
      metadata: function(id) { var record = latestRecord(db[id]); return Promise.resolve(record ? cloneObject(record.metadata) : null); },
      versions: function(id) { return Promise.resolve((db[id] || []).map(function(record) { return { version: record.version, created: record.created, size: record.size }; })); },
      getVersion: function(id, version) {
        var records = db[id] || [], i;
        for (i = 0; i < records.length; i++) if (records[i].version === version) return Promise.resolve(records[i].blob);
        return Promise.resolve(null);
      }
    };
  }
  function indexedDbStore(opts) {
    var idb = g.indexedDB;
    if (!idb) return memoryStore();
    var dbName = opts.name || 'baremetal_blob_store';
    var storeName = opts.storeName || 'blobs';
    var dbPromise;
    function openDb() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise(function(resolve, reject) {
        var req = idb.open(dbName, 1);
        req.onupgradeneeded = function() {
          var db = req.result;
          var store;
          if (!db.objectStoreNames.contains(storeName)) {
            store = db.createObjectStore(storeName, { keyPath: ['id', 'version'] });
            store.createIndex('id', 'id', { unique: false });
          }
        };
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      });
      return dbPromise;
    }
    function withStore(mode, fn) {
      return openDb().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction(storeName, mode);
          var store = tx.objectStore(storeName);
          Promise.resolve(fn(store, tx)).then(resolve, reject);
          tx.onerror = function() { reject(tx.error); };
        });
      });
    }
    function requestPromise(req) {
      return new Promise(function(resolve, reject) {
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      });
    }
    async function allRecords() {
      return withStore('readonly', function(store) { return requestPromise(store.getAll()); });
    }
    function latestById(records, id) {
      var latest = null, i;
      for (i = 0; i < records.length; i++) if (records[i].id === id && (!latest || records[i].version > latest.version)) latest = records[i];
      return latest;
    }
    return {
      put: async function(id, blob, metadata) {
        var key = String(id || makeId());
        var records = await allRecords();
        var latest = latestById(records, key);
        var source = asBlob(blob, blob && blob.type);
        var record = { id: key, blob: source, metadata: cloneObject(metadata), version: latest ? latest.version + 1 : 1, created: iso(), size: source.size || 0, type: source.type || '' };
        await withStore('readwrite', function(store) { return requestPromise(store.put(record)); });
        return { id: key, version: record.version };
      },
      get: async function(id) {
        var record = latestById(await allRecords(), String(id));
        return record ? { blob: record.blob, metadata: cloneObject(record.metadata), version: record.version } : null;
      },
      delete: async function(id) {
        var key = String(id);
        var records = await allRecords(), i;
        for (i = 0; i < records.length; i++) if (records[i].id === key) await withStore('readwrite', function(store) { return requestPromise(store.delete([records[i].id, records[i].version])); });
        return true;
      },
      list: async function(opts) {
        var latestMap = {}, records = await allRecords(), out = [], i, rec, key;
        for (i = 0; i < records.length; i++) {
          rec = records[i];
          if (!latestMap[rec.id] || rec.version > latestMap[rec.id].version) latestMap[rec.id] = rec;
        }
        for (key in latestMap) if (own(latestMap, key) && matchesList(latestMap[key], opts)) out.push(listSummary(latestMap[key]));
        out.sort(function(a, b) { return String(a.id).localeCompare(String(b.id)); });
        if (opts && opts.limit) out = out.slice(0, opts.limit);
        return out;
      },
      exists: async function(id) { return !!latestById(await allRecords(), String(id)); },
      metadata: async function(id) { var rec = latestById(await allRecords(), String(id)); return rec ? cloneObject(rec.metadata) : null; },
      versions: async function(id) {
        return (await allRecords()).filter(function(rec) { return rec.id === String(id); }).sort(function(a, b) { return a.version - b.version; }).map(function(rec) { return { version: rec.version, created: rec.created, size: rec.size }; });
      },
      getVersion: async function(id, version) {
        var records = await allRecords(), i;
        for (i = 0; i < records.length; i++) if (records[i].id === String(id) && records[i].version === version) return records[i].blob;
        return null;
      }
    };
  }
  function store(opts) {
    opts = opts || {};
    return opts.backend === 'indexeddb' ? indexedDbStore(opts) : memoryStore();
  }
  function matchesPolicy(item, match) {
    match = match || {};
    if (match.type && item.type !== match.type) return false;
    if (match.olderThan && (now() - new Date(item.created).getTime()) <= Number(match.olderThan)) return false;
    if (match.maxSize && item.size <= Number(match.maxSize)) return false;
    return true;
  }
  function lifecycle(storeInstance, policies) {
    var timer = null;
    var list = policies || [];
    async function applyPolicy(item, policy) {
      var action = policy && policy.action;
      var latest, compressed;
      if (typeof action === 'function') return action(item, storeInstance, policy);
      if (action === 'delete') return storeInstance.delete(item.id);
      if (action === 'archive') {
        latest = await storeInstance.get(item.id);
        if (latest) return storeInstance.put(item.id, latest.blob, copy(latest.metadata, { archived: true, archivedAt: iso() }));
      }
      if (action === 'compress') {
        latest = await storeInstance.get(item.id);
        if (latest) {
          compressed = await compress(latest.blob);
          return storeInstance.put(item.id, compressed, copy(latest.metadata, { compressed: true, originalSize: item.size }));
        }
      }
      return null;
    }
    async function run() {
      var items = await storeInstance.list({});
      var results = [];
      var i, j;
      for (i = 0; i < items.length; i++) {
        for (j = 0; j < list.length; j++) {
          if (matchesPolicy(items[i], list[j].match)) {
            results.push(await applyPolicy(items[i], list[j]));
            break;
          }
        }
      }
      return results;
    }
    return {
      start: function(intervalMs) {
        if (timer) clearInterval(timer);
        timer = setInterval(run, Number(intervalMs) || 60000);
        return this;
      },
      stop: function() {
        if (timer) clearInterval(timer);
        timer = null;
        return this;
      },
      run: run
    };
  }
  async function quota() {
    var storage = g.navigator && g.navigator.storage;
    var est = storage && typeof storage.estimate === 'function' ? await storage.estimate() : { usage: 0, quota: 0 };
    var usage = Number(est && est.usage || 0);
    var limit = Number(est && est.quota || 0);
    return { usage: usage, quota: limit, percent: limit ? Math.round(usage / limit * 10000) / 100 : 0 };
  }

  return {
    create: create,
    chunk: chunk,
    upload: upload,
    resume: resume,
    download: download,
    hash: hash,
    store: store,
    lifecycle: lifecycle,
    transform: transform,
    encrypt: encrypt,
    decrypt: decrypt,
    compress: compress,
    decompress: decompress,
    toDataURL: toDataURL,
    fromDataURL: fromDataURL,
    toBase64: toBase64,
    fromBase64: fromBase64,
    slice: slice,
    concat: concat,
    diff: diff,
    fingerprint: fingerprint,
    quota: quota
  };
})();
if(typeof module!=='undefined') module.exports = BareMetal.Blob;
