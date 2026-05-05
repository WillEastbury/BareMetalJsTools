var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
(function(root){
  'use strict';

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function noop() {}
  function now() { return Date.now(); }
  function normalizeKey(key) { return String(key); }
  function listCopy(arr) { return Array.isArray(arr) ? arr.slice() : []; }
  function cloneRecord(record) {
    if (!record) return null;
    return {
      value: record.value,
      expires: record.expires || 0,
      ttl: record.ttl || 0,
      tags: listCopy(record.tags),
      invalidatedAt: record.invalidatedAt || 0,
      touched: record.touched || 0,
      created: record.created || 0
    };
  }
  function assign(a, b) {
    var out = {}, k;
    for (k in (a || {})) if (own(a, k)) out[k] = a[k];
    for (k in (b || {})) if (own(b, k)) out[k] = b[k];
    return out;
  }
  function isExpired(record, at) {
    return !!record && record.expires > 0 && record.expires <= at;
  }
  function isStale(record, at) {
    return !!record && (isExpired(record, at) || !!(record.invalidatedAt && record.invalidatedAt <= at));
  }
  function staleBase(record) {
    if (!record) return 0;
    return record.invalidatedAt || record.expires || 0;
  }
  function withinSwr(record, swr, at) {
    var base = staleBase(record);
    return !!record && !!swr && !!base && (base + swr > at);
  }
  function toPublic(record, at) {
    return {
      value: record.value,
      expires: record.expires || 0,
      tags: listCopy(record.tags),
      stale: !!isStale(record, at || now())
    };
  }
  function hitRate(stats) {
    var total = stats.hits + stats.misses;
    return total ? stats.hits / total : 0;
  }
  function listeners() {
    return { hit: [], miss: [], set: [], evict: [], expire: [], revalidate: [] };
  }
  function emit(map, event, payload) {
    var list = map[event] || [];
    var i;
    for (i = 0; i < list.length; i++) {
      try { list[i](payload); } catch (_) {}
    }
  }
  function makePayload(key, record, extra) {
    var payload = {
      key: key,
      value: record ? record.value : undefined,
      expires: record ? record.expires || 0 : 0,
      tags: record ? listCopy(record.tags) : [],
      stale: !!(record && isStale(record, now()))
    };
    var k;
    for (k in (extra || {})) if (own(extra, k)) payload[k] = extra[k];
    return payload;
  }
  function isWebStorage(storage) {
    return !!storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' && typeof storage.removeItem === 'function';
  }
  function isStoreAdapter(storage) {
    return !!storage && typeof storage.read === 'function' && typeof storage.write === 'function' && typeof storage.remove === 'function';
  }
  function isMapLike(storage) {
    return !!storage && typeof storage.get === 'function' && typeof storage.set === 'function';
  }
  function collectWebKeys(storage, prefix) {
    var out = [];
    var i;
    var raw;
    for (i = 0; i < storage.length; i++) {
      raw = storage.key(i);
      if (raw && raw.indexOf(prefix) === 0) out.push(raw.substring(prefix.length));
    }
    return out;
  }
  function createMemoryStore() {
    var data = new Map();
    return {
      read: function(key) { return data.has(key) ? cloneRecord(data.get(key)) : null; },
      write: function(key, record) { data.set(key, cloneRecord(record)); },
      remove: function(key) { return data.delete(key); },
      clear: function() { data.clear(); },
      keys: function() { return Array.from(data.keys()); },
      entries: function() {
        var out = [];
        data.forEach(function(record, key) { out.push([key, cloneRecord(record)]); });
        return out;
      }
    };
  }
  function createWebStore(storage, prefix, serializeValue, deserializeValue) {
    function read(key) {
      var raw = storage.getItem(prefix + key);
      var record;
      if (raw == null) return null;
      try { record = JSON.parse(raw); }
      catch (_) { return null; }
      record.tags = listCopy(record.tags);
      record.value = deserializeValue(record.value);
      return cloneRecord(record);
    }
    return {
      read: read,
      write: function(key, record) {
        var out = cloneRecord(record);
        out.value = serializeValue(out.value);
        storage.setItem(prefix + key, JSON.stringify(out));
      },
      remove: function(key) { storage.removeItem(prefix + key); return true; },
      clear: function() {
        var keys = collectWebKeys(storage, prefix);
        var i;
        for (i = 0; i < keys.length; i++) storage.removeItem(prefix + keys[i]);
      },
      keys: function() { return collectWebKeys(storage, prefix); },
      entries: function() {
        var keys = collectWebKeys(storage, prefix);
        var out = [];
        var i;
        var record;
        for (i = 0; i < keys.length; i++) {
          record = read(keys[i]);
          if (record) out.push([keys[i], record]);
        }
        return out;
      }
    };
  }
  function createCustomStore(storage) {
    function read(key) {
      var value = storage.get(key);
      return value == null ? null : cloneRecord(value);
    }
    return {
      read: read,
      write: function(key, record) { storage.set(key, cloneRecord(record)); },
      remove: function(key) {
        if (typeof storage.delete === 'function') return storage.delete(key);
        if (typeof storage.remove === 'function') { storage.remove(key); return true; }
        return false;
      },
      clear: function() {
        if (typeof storage.clear === 'function') storage.clear();
      },
      keys: function() {
        if (typeof storage.keys === 'function') {
          var keys = storage.keys();
          return Array.isArray(keys) ? keys.slice() : Array.from(keys);
        }
        if (typeof storage.entries === 'function') {
          return Array.from(storage.entries()).map(function(entry) { return entry[0]; });
        }
        return [];
      },
      entries: function() {
        if (typeof storage.entries === 'function') {
          return Array.from(storage.entries()).map(function(entry) { return [entry[0], cloneRecord(entry[1])]; });
        }
        return this.keys().map(function(key) { return [key, read(key)]; });
      }
    };
  }
  function createStore(opts) {
    var serializeValue = typeof opts.serialize === 'function' ? opts.serialize : function(value) { return value; };
    var deserializeValue = typeof opts.deserialize === 'function' ? opts.deserialize : function(value) { return value; };
    var prefix = opts.namespace || 'BareMetal.Cache:';
    if (!opts.storage || opts.storage === 'memory') return createMemoryStore();
    if (opts.storage === 'localStorage') {
      try {
        if (root && root.localStorage) return createWebStore(root.localStorage, prefix, serializeValue, deserializeValue);
      } catch (_) {}
      return createMemoryStore();
    }
    if (isStoreAdapter(opts.storage)) return opts.storage;
    if (isWebStorage(opts.storage)) return createWebStore(opts.storage, prefix, serializeValue, deserializeValue);
    if (isMapLike(opts.storage)) return createCustomStore(opts.storage);
    return createMemoryStore();
  }
  function create(opts) {
    var config = assign({
      maxSize: 0,
      ttl: 0,
      swr: 0,
      staleIfError: false,
      storage: 'memory',
      onEvict: null,
      serialize: null,
      deserialize: null,
      namespace: 'BareMetal.Cache:'
    }, opts || {});
    var store = createStore(config);
    var events = listeners();
    var pending = {};
    var counters = { hits: 0, misses: 0, evictions: 0 };
    var order = 0;
    var api;

    function nextOrder() {
      order += 1;
      return order;
    }
    function getRaw(key) {
      return store.read(normalizeKey(key));
    }
    function writeRaw(key, record) {
      store.write(normalizeKey(key), cloneRecord(record));
      return record;
    }
    function rememberExpire(key, record) {
      emit(events, 'expire', makePayload(key, record, { reason: 'ttl' }));
    }
    function resolveTtl(options, previous) {
      if (options && own(options, 'ttl')) return options.ttl;
      if (previous && own(previous, 'ttl')) return previous.ttl;
      return config.ttl;
    }
    function resolveTags(options, previous) {
      if (options && own(options, 'tags')) return listCopy(options.tags);
      return previous ? listCopy(previous.tags) : [];
    }
    function touch(key, record) {
      if (!record) return;
      record.touched = nextOrder();
      writeRaw(key, record);
    }
    function evictIfNeeded() {
      var limit = Number(config.maxSize) || 0;
      var rows;
      var oldest;
      var i;
      if (!limit || limit < 1) return;
      rows = store.entries();
      while (rows.length > limit) {
        oldest = 0;
        for (i = 1; i < rows.length; i++) {
          if ((rows[i][1].touched || rows[i][1].created || 0) < (rows[oldest][1].touched || rows[oldest][1].created || 0)) oldest = i;
        }
        store.remove(rows[oldest][0]);
        counters.evictions++;
        if (typeof config.onEvict === 'function') {
          try { config.onEvict(rows[oldest][0], rows[oldest][1].value); } catch (_) {}
        }
        emit(events, 'evict', makePayload(rows[oldest][0], rows[oldest][1], { reason: 'lru' }));
        rows.splice(oldest, 1);
      }
    }
    function set(key, value, options) {
      var rawKey = normalizeKey(key);
      var previous = getRaw(rawKey);
      var ttl = resolveTtl(options, previous);
      var at = now();
      var stamp = nextOrder();
      var record = {
        value: value,
        expires: ttl > 0 ? at + ttl : 0,
        ttl: ttl > 0 ? ttl : 0,
        tags: resolveTags(options, previous),
        invalidatedAt: 0,
        touched: stamp,
        created: previous && previous.created ? previous.created : stamp
      };
      writeRaw(rawKey, record);
      evictIfNeeded();
      emit(events, 'set', makePayload(rawKey, record));
    }
    function get(key) {
      var rawKey = normalizeKey(key);
      var record = getRaw(rawKey);
      var at = now();
      if (record && !isStale(record, at)) {
        counters.hits++;
        touch(rawKey, record);
        emit(events, 'hit', makePayload(rawKey, record));
        return record.value;
      }
      if (record && isExpired(record, at)) rememberExpire(rawKey, record);
      counters.misses++;
      emit(events, 'miss', makePayload(rawKey, record, { stale: !!record }));
      return undefined;
    }
    function has(key) {
      var record = getRaw(key);
      return !!record && !isStale(record, now());
    }
    function deleteKey(key) {
      var rawKey = normalizeKey(key);
      var exists = !!getRaw(rawKey);
      if (!exists) return false;
      store.remove(rawKey);
      return true;
    }
    function clear() {
      store.clear();
    }
    function size() {
      return store.keys().length;
    }
    function keys() {
      return store.keys().slice();
    }
    function entries() {
      var rows = store.entries();
      var at = now();
      return rows.map(function(entry) {
        return [entry[0], toPublic(entry[1], at)];
      });
    }
    function invalidate(key) {
      var rawKey = normalizeKey(key);
      var record = getRaw(rawKey);
      if (!record) return false;
      record.invalidatedAt = now();
      writeRaw(rawKey, record);
      return true;
    }
    function invalidateByTag(tag) {
      var rows = store.entries();
      var changed = 0;
      var i;
      for (i = 0; i < rows.length; i++) {
        if (rows[i][1].tags.indexOf(tag) > -1) {
          rows[i][1].invalidatedAt = now();
          writeRaw(rows[i][0], rows[i][1]);
          changed++;
        }
      }
      return changed;
    }
    function prune() {
      var rows = store.entries();
      var at = now();
      var removed = 0;
      var i;
      for (i = 0; i < rows.length; i++) {
        if (isExpired(rows[i][1], at)) {
          store.remove(rows[i][0]);
          removed++;
          rememberExpire(rows[i][0], rows[i][1]);
        }
      }
      return removed;
    }
    function stats() {
      return {
        hits: counters.hits,
        misses: counters.misses,
        hitRate: hitRate(counters),
        size: size(),
        evictions: counters.evictions
      };
    }
    function on(event, cb) {
      if (!events[event] || typeof cb !== 'function') return function() {};
      events[event].push(cb);
      return function() {
        var list = events[event];
        var i;
        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === cb) list.splice(i, 1);
        }
      };
    }
    function fetchAndStore(key, fetchFn, options, previous, background) {
      var rawKey = normalizeKey(key);
      var promise;
      if (pending[rawKey]) return pending[rawKey];
      emit(events, 'revalidate', makePayload(rawKey, previous, { background: !!background, state: 'start' }));
      try { promise = fetchFn(rawKey, previous ? previous.value : undefined); }
      catch (err) { promise = Promise.reject(err); }
      pending[rawKey] = Promise.resolve(promise).then(function(value) {
        set(rawKey, value, {
          ttl: resolveTtl(options, previous),
          tags: resolveTags(options, previous)
        });
        emit(events, 'revalidate', makePayload(rawKey, getRaw(rawKey), { background: !!background, state: 'success' }));
        delete pending[rawKey];
        return value;
      }, function(err) {
        emit(events, 'revalidate', makePayload(rawKey, previous, { background: !!background, state: 'error', error: err }));
        delete pending[rawKey];
        if (previous && options.staleIfError) return previous.value;
        throw err;
      });
      return pending[rawKey];
    }
    function wrap(key, fetchFn, options) {
      var rawKey = normalizeKey(key);
      var configForCall = assign({
        ttl: config.ttl,
        swr: config.swr,
        staleIfError: config.staleIfError
      }, options || {});
      var record = getRaw(rawKey);
      var at = now();
      if (record && !isStale(record, at)) {
        counters.hits++;
        touch(rawKey, record);
        emit(events, 'hit', makePayload(rawKey, record));
        return record.value;
      }
      if (!record) {
        counters.misses++;
        emit(events, 'miss', makePayload(rawKey, null));
        return fetchAndStore(rawKey, fetchFn, configForCall, null, false);
      }
      if (isExpired(record, at)) rememberExpire(rawKey, record);
      if (configForCall.swr && withinSwr(record, configForCall.swr, at)) {
        counters.hits++;
        emit(events, 'hit', makePayload(rawKey, record, { stale: true, swr: true }));
        fetchAndStore(rawKey, fetchFn, configForCall, record, true).catch(noop);
        return record.value;
      }
      counters.misses++;
      emit(events, 'miss', makePayload(rawKey, record, { stale: true }));
      return fetchAndStore(rawKey, fetchFn, configForCall, record, false);
    }

    api = {
      get: get,
      set: set,
      has: has,
      delete: deleteKey,
      clear: clear,
      size: size,
      keys: keys,
      entries: entries,
      wrap: wrap,
      invalidate: invalidate,
      invalidateByTag: invalidateByTag,
      prune: prune,
      stats: stats,
      on: on,
      __peekRaw: function(key) {
        var record = getRaw(key);
        return record ? cloneRecord(record) : null;
      }
    };
    return api;
  }
  function tiered(levels) {
    var configs = Array.isArray(levels) ? levels : [];
    var caches = configs.map(function(level) {
      return level && typeof level.get === 'function' && typeof level.set === 'function' ? level : create(level || {});
    });
    var events = listeners();
    var counters = { hits: 0, misses: 0 };
    var pending = {};
    function emitLocal(event, payload) { emit(events, event, payload); }
    function unionKeys() {
      var seen = {};
      var out = [];
      var i;
      var j;
      var keys;
      for (i = 0; i < caches.length; i++) {
        keys = caches[i].keys();
        for (j = 0; j < keys.length; j++) {
          if (!seen[keys[j]]) {
            seen[keys[j]] = true;
            out.push(keys[j]);
          }
        }
      }
      return out;
    }
    function writeAll(key, value, options) {
      caches.forEach(function(cache) { cache.set(key, value, options); });
      emitLocal('set', { key: key, value: value, tags: listCopy(options && options.tags), expires: 0, stale: false });
    }
    function findFresh(key) {
      var i;
      var value;
      var raw;
      for (i = 0; i < caches.length; i++) {
        value = caches[i].get(key);
        if (value !== undefined) {
          raw = caches[i].__peekRaw ? caches[i].__peekRaw(key) : null;
          return { index: i, value: value, raw: raw };
        }
      }
      return null;
    }
    function findStored(key) {
      var i;
      var raw;
      for (i = 0; i < caches.length; i++) {
        raw = caches[i].__peekRaw ? caches[i].__peekRaw(key) : null;
        if (raw) return { index: i, raw: raw };
      }
      return null;
    }
    function promote(targetIndex, key, raw) {
      var ttl = raw && raw.expires > 0 ? Math.max(0, raw.expires - now()) : 0;
      var i;
      for (i = 0; i < targetIndex; i++) {
        caches[i].set(key, raw.value, { ttl: ttl, tags: raw.tags });
      }
    }
    function on(event, cb) {
      if (!events[event] || typeof cb !== 'function') return function() {};
      events[event].push(cb);
      return function() {
        var list = events[event];
        var i;
        for (i = list.length - 1; i >= 0; i--) if (list[i] === cb) list.splice(i, 1);
      };
    }
    function fetchAll(key, fetchFn, options, previous, background) {
      var rawKey = normalizeKey(key);
      var promise;
      if (pending[rawKey]) return pending[rawKey];
      emitLocal('revalidate', makePayload(rawKey, previous, { background: !!background, state: 'start' }));
      try { promise = fetchFn(rawKey, previous ? previous.value : undefined); }
      catch (err) { promise = Promise.reject(err); }
      pending[rawKey] = Promise.resolve(promise).then(function(value) {
        writeAll(rawKey, value, {
          ttl: options && own(options, 'ttl') ? options.ttl : (previous ? previous.ttl : 0),
          tags: options && own(options, 'tags') ? options.tags : (previous ? previous.tags : [])
        });
        emitLocal('revalidate', makePayload(rawKey, { value: value, tags: options && options.tags || [], expires: 0 }, { background: !!background, state: 'success' }));
        delete pending[rawKey];
        return value;
      }, function(err) {
        emitLocal('revalidate', makePayload(rawKey, previous, { background: !!background, state: 'error', error: err }));
        delete pending[rawKey];
        if (previous && options && options.staleIfError) return previous.value;
        throw err;
      });
      return pending[rawKey];
    }
    return {
      get: function(key) {
        var hit = findFresh(key);
        if (hit) {
          counters.hits++;
          if (hit.index > 0 && hit.raw) promote(hit.index, normalizeKey(key), hit.raw);
          emitLocal('hit', makePayload(normalizeKey(key), hit.raw || { value: hit.value, tags: [] }));
          return hit.value;
        }
        counters.misses++;
        emitLocal('miss', { key: normalizeKey(key), stale: false, tags: [] });
        return undefined;
      },
      set: function(key, value, options) { writeAll(normalizeKey(key), value, options || {}); },
      has: function(key) {
        var i;
        for (i = 0; i < caches.length; i++) if (caches[i].has(key)) return true;
        return false;
      },
      delete: function(key) {
        var changed = false;
        caches.forEach(function(cache) { if (cache.delete(key)) changed = true; });
        return changed;
      },
      clear: function() { caches.forEach(function(cache) { cache.clear(); }); },
      size: function() { return unionKeys().length; },
      keys: unionKeys,
      entries: function() {
        return unionKeys().map(function(key) {
          var found = findStored(key);
          return [key, found ? toPublic(found.raw) : { value: undefined, expires: 0, tags: [], stale: true }];
        });
      },
      wrap: function(key, fetchFn, options) {
        var rawKey = normalizeKey(key);
        var hit = findFresh(rawKey);
        var found;
        var opts = assign({ staleIfError: false, swr: 0, ttl: 0 }, options || {});
        if (hit) {
          counters.hits++;
          if (hit.index > 0 && hit.raw) promote(hit.index, rawKey, hit.raw);
          emitLocal('hit', makePayload(rawKey, hit.raw || { value: hit.value, tags: [] }));
          return hit.value;
        }
        found = findStored(rawKey);
        if (found && withinSwr(found.raw, opts.swr, now())) {
          counters.hits++;
          emitLocal('hit', makePayload(rawKey, found.raw, { stale: true, swr: true }));
          fetchAll(rawKey, fetchFn, opts, found.raw, true).catch(noop);
          return found.raw.value;
        }
        counters.misses++;
        emitLocal('miss', makePayload(rawKey, found && found.raw, { stale: !!found }));
        return fetchAll(rawKey, fetchFn, opts, found && found.raw, false);
      },
      invalidate: function(key) {
        var changed = false;
        caches.forEach(function(cache) { if (cache.invalidate(key)) changed = true; });
        return changed;
      },
      invalidateByTag: function(tag) {
        var total = 0;
        caches.forEach(function(cache) { total += cache.invalidateByTag(tag); });
        return total;
      },
      prune: function() {
        var total = 0;
        caches.forEach(function(cache) { total += cache.prune(); });
        return total;
      },
      stats: function() {
        var evictions = 0;
        var i;
        var stat;
        for (i = 0; i < caches.length; i++) {
          stat = caches[i].stats();
          evictions += stat.evictions || 0;
        }
        return {
          hits: counters.hits,
          misses: counters.misses,
          hitRate: hitRate(counters),
          size: unionKeys().length,
          evictions: evictions
        };
      },
      on: on,
      __peekRaw: function(key) {
        var found = findStored(normalizeKey(key));
        return found ? cloneRecord(found.raw) : null;
      }
    };
  }
  function lru(maxSize) {
    return create({ maxSize: maxSize || 100 });
  }
  function memoize(fn, opts) {
    var options = opts || {};
    var keyFn = typeof options.key === 'function'
      ? options.key
      : function(args) {
          try { return JSON.stringify(args); }
          catch (_) { return String(args); }
        };
    var cache = create({ ttl: options.ttl || 0, maxSize: options.maxSize || 0 });
    function memoized() {
      var args = Array.prototype.slice.call(arguments);
      var self = this;
      var key = normalizeKey(keyFn(args));
      var cached = cache.get(key);
      var result;
      if (cached !== undefined) return cached;
      result = fn.apply(self, args);
      if (result && typeof result.then === 'function') {
        return result.then(function(value) {
          cache.set(key, value, { ttl: options.ttl });
          return value;
        });
      }
      cache.set(key, result, { ttl: options.ttl });
      return result;
    }
    memoized.cache = cache;
    memoized.clear = function() { cache.clear(); return memoized; };
    return memoized;
  }

  BareMetal.Cache = {
    create: create,
    tiered: tiered,
    lru: lru,
    memoize: memoize
  };
  if (root) {
    root.BareMetal = root.BareMetal || {};
    root.BareMetal.Cache = BareMetal.Cache;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Cache;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
