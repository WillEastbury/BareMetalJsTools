// BareMetal.LocalKVStore — client-side key-value storage abstraction
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.LocalKVStore = (() => {
  'use strict';

  function _now() { return Date.now(); }

  function _isExpired(t) { return t !== 0 && _now() > t; }

  function _expiryMs(ttl) { return ttl > 0 ? _now() + ttl * 1000 : 0; }

  function _nsKey(ns, key) { return ns + ':' + key; }

  function _stripNs(ns, raw) { return raw.substring(ns.length + 1); }

  // --- Web Storage backend (localStorage / sessionStorage) ---
  function _webBackend(storage, ns) {
    function _raw(key) {
      var json = storage.getItem(_nsKey(ns, key));
      if (json === null) return null;
      try { return JSON.parse(json); } catch (e) { return null; }
    }

    function _allNsKeys() {
      var prefix = ns + ':';
      var result = [];
      for (var i = 0; i < storage.length; i++) {
        var k = storage.key(i);
        if (k && k.indexOf(prefix) === 0) result.push(k);
      }
      return result;
    }

    return {
      get: function(key) {
        var rec = _raw(key);
        if (!rec) return null;
        if (_isExpired(rec.t)) { storage.removeItem(_nsKey(ns, key)); return null; }
        return rec.v;
      },
      set: function(key, value, t) {
        storage.setItem(_nsKey(ns, key), JSON.stringify({ v: value, t: t }));
      },
      remove: function(key) { storage.removeItem(_nsKey(ns, key)); },
      has: function(key) {
        var rec = _raw(key);
        if (!rec) return false;
        if (_isExpired(rec.t)) { storage.removeItem(_nsKey(ns, key)); return false; }
        return true;
      },
      clear: function() {
        _allNsKeys().forEach(function(k) { storage.removeItem(k); });
      },
      allEntries: function() {
        var prefix = ns + ':';
        var out = [];
        var toRemove = [];
        for (var i = 0; i < storage.length; i++) {
          var k = storage.key(i);
          if (!k || k.indexOf(prefix) !== 0) continue;
          var json = storage.getItem(k);
          var rec;
          try { rec = JSON.parse(json); } catch (e) { continue; }
          if (_isExpired(rec.t)) { toRemove.push(k); continue; }
          out.push([_stripNs(ns, k), rec]);
        }
        toRemove.forEach(function(k) { storage.removeItem(k); });
        return out;
      },
      getRaw: function(key) { return _raw(key); },
      setRaw: function(key, rec) {
        storage.setItem(_nsKey(ns, key), JSON.stringify(rec));
      }
    };
  }

  // --- IndexedDB backend ---
  var _idbCache = {};

  function _idbBackend(ns) {
    var DB_NAME = 'bm_kvstore';

    function _getDb() {
      var cacheKey = DB_NAME + ':' + ns;
      if (_idbCache[cacheKey]) return _idbCache[cacheKey];
      _idbCache[cacheKey] = new Promise(function(resolve, reject) {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(ns)) db.createObjectStore(ns, { keyPath: 'key' });
        };
        req.onerror = function() { _idbCache[cacheKey] = null; reject(req.error); };
        req.onsuccess = function() {
          var db = req.result;
          if (!db.objectStoreNames.contains(ns)) {
            db.close();
            var ver = db.version + 1;
            var req2 = indexedDB.open(DB_NAME, ver);
            req2.onupgradeneeded = function(e2) {
              e2.target.result.createObjectStore(ns, { keyPath: 'key' });
            };
            req2.onerror = function() { _idbCache[cacheKey] = null; reject(req2.error); };
            req2.onsuccess = function() { resolve(req2.result); };
            return;
          }
          resolve(db);
        };
      });
      return _idbCache[cacheKey];
    }

    function _idb(mode, fn) {
      return _getDb().then(function(db) {
        var tx = db.transaction(ns, mode);
        var st = tx.objectStore(ns);
        return fn(st, tx, db);
      });
    }

    function _getRec(key) {
      return _idb('readonly', function(st) {
        return new Promise(function(resolve) {
          var r = st.get(key);
          r.onsuccess = function() { resolve(r.result || null); };
          r.onerror = function() { resolve(null); };
        });
      }).then(function(p) { return p; });
    }

    function _getAll() {
      return _idb('readonly', function(st) {
        return new Promise(function(resolve) {
          var r = st.getAll();
          r.onsuccess = function() { resolve(r.result || []); };
          r.onerror = function() { resolve([]); };
        });
      }).then(function(p) { return p; });
    }

    return {
      get: function(key) {
        return _getRec(key).then(function(rec) {
          if (!rec) return null;
          if (_isExpired(rec.t)) {
            return _idb('readwrite', function(st) {
              return new Promise(function(resolve) {
                var r = st.delete(key); r.onsuccess = function() { resolve(null); }; r.onerror = function() { resolve(null); };
              });
            }).then(function(p) { return p; });
          }
          return rec.v;
        });
      },
      set: function(key, value, t) {
        return _idb('readwrite', function(st) {
          return new Promise(function(resolve, reject) {
            var r = st.put({ key: key, v: value, t: t });
            r.onsuccess = function() { resolve(); }; r.onerror = function() { reject(r.error); };
          });
        }).then(function(p) { return p; });
      },
      remove: function(key) {
        return _idb('readwrite', function(st) {
          return new Promise(function(resolve) {
            var r = st.delete(key); r.onsuccess = function() { resolve(); }; r.onerror = function() { resolve(); };
          });
        }).then(function(p) { return p; });
      },
      has: function(key) {
        return _getRec(key).then(function(rec) {
          if (!rec) return false;
          if (_isExpired(rec.t)) return false;
          return true;
        });
      },
      clear: function() {
        return _idb('readwrite', function(st) {
          return new Promise(function(resolve) {
            var r = st.clear(); r.onsuccess = function() { resolve(); }; r.onerror = function() { resolve(); };
          });
        }).then(function(p) { return p; });
      },
      allEntries: function() {
        return _getAll().then(function(all) {
          var out = [];
          all.forEach(function(rec) {
            if (!_isExpired(rec.t)) out.push([rec.key, rec]);
          });
          return out;
        });
      },
      getRaw: function(key) { return _getRec(key); },
      setRaw: function(key, rec) {
        return _idb('readwrite', function(st) {
          return new Promise(function(resolve) {
            var r = st.put(Object.assign({ key: key }, rec));
            r.onsuccess = function() { resolve(); }; r.onerror = function() { resolve(); };
          });
        }).then(function(p) { return p; });
      }
    };
  }

  // --- Store factory ---
  function create(opts) {
    opts = opts || {};
    var backendName = opts.backend || 'local';
    var ns = opts.namespace || 'bm';
    var defaultTTL = opts.ttl || 0;
    var listeners = [];
    var b;

    if (backendName === 'local') b = _webBackend(localStorage, ns);
    else if (backendName === 'session') b = _webBackend(sessionStorage, ns);
    else if (backendName === 'indexeddb') b = _idbBackend(ns);
    else throw new Error('Unknown backend: ' + backendName);

    function _emit(evt) {
      listeners.forEach(function(cb) { try { cb(evt); } catch (e) { /* ignore */ } });
    }

    function _ttlVal(ttl) {
      var t = (ttl !== undefined && ttl !== null) ? ttl : defaultTTL;
      return _expiryMs(t);
    }

    var store = {
      get: function(key) { return Promise.resolve(b.get(key)); },

      set: function(key, value, ttl) {
        var t = _ttlVal(ttl);
        var r = Promise.resolve(b.set(key, value, t));
        return r.then(function() { _emit({ type: 'set', key: key, value: value }); });
      },

      remove: function(key) {
        return Promise.resolve(b.remove(key)).then(function() {
          _emit({ type: 'remove', key: key });
        });
      },

      has: function(key) { return Promise.resolve(b.has(key)); },

      clear: function() {
        return Promise.resolve(b.clear()).then(function() { _emit({ type: 'clear' }); });
      },

      getMany: function(keys) {
        return Promise.all(keys.map(function(k) { return Promise.resolve(b.get(k)); }))
          .then(function(vals) {
            var out = {};
            keys.forEach(function(k, i) { out[k] = vals[i]; });
            return out;
          });
      },

      setMany: function(entries, ttl) {
        var t = _ttlVal(ttl);
        var ks = Object.keys(entries);
        return Promise.all(ks.map(function(k) { return Promise.resolve(b.set(k, entries[k], t)); }))
          .then(function() {
            ks.forEach(function(k) { _emit({ type: 'set', key: k, value: entries[k] }); });
          });
      },

      removeMany: function(keys) {
        return Promise.all(keys.map(function(k) { return Promise.resolve(b.remove(k)); }))
          .then(function() {
            keys.forEach(function(k) { _emit({ type: 'remove', key: k }); });
          });
      },

      keys: function() {
        return Promise.resolve(b.allEntries()).then(function(all) {
          return all.map(function(e) { return e[0]; });
        });
      },

      values: function() {
        return Promise.resolve(b.allEntries()).then(function(all) {
          return all.map(function(e) { return e[1].v; });
        });
      },

      entries: function() {
        return Promise.resolve(b.allEntries()).then(function(all) {
          return all.map(function(e) { return [e[0], e[1].v]; });
        });
      },

      count: function() {
        return Promise.resolve(b.allEntries()).then(function(all) { return all.length; });
      },

      find: function(predicate) {
        return Promise.resolve(b.allEntries()).then(function(all) {
          return all.filter(function(e) { return predicate(e[1].v, e[0]); })
            .map(function(e) { return [e[0], e[1].v]; });
        });
      },

      ttl: function(key) {
        return Promise.resolve(b.getRaw(key)).then(function(rec) {
          if (!rec) return null;
          if (rec.t === 0) return null;
          if (_isExpired(rec.t)) return null;
          return Math.max(0, Math.round((rec.t - _now()) / 1000));
        });
      },

      expire: function(key, ttl) {
        return Promise.resolve(b.getRaw(key)).then(function(rec) {
          if (!rec || _isExpired(rec.t)) return false;
          rec.t = _expiryMs(ttl);
          return Promise.resolve(b.setRaw(key, rec)).then(function() {
            _emit({ type: 'expire', key: key });
            return true;
          });
        });
      },

      persist: function(key) {
        return Promise.resolve(b.getRaw(key)).then(function(rec) {
          if (!rec || _isExpired(rec.t)) return false;
          rec.t = 0;
          return Promise.resolve(b.setRaw(key, rec)).then(function() { return true; });
        });
      },

      cleanup: function() {
        return Promise.resolve(b.allEntries()).then(function() {
          // allEntries already removes expired for web backends; for idb we need explicit cleanup
          if (backendName === 'indexeddb') {
            return b._cleanExpired ? b._cleanExpired() : 0;
          }
          // For web backends, count what was removed by re-scanning
          return 0;
        });
      },

      size: function() {
        return Promise.resolve(b.allEntries()).then(function(all) {
          var total = 0;
          all.forEach(function(e) {
            total += JSON.stringify(e[1]).length + _nsKey(ns, e[0]).length;
          });
          return total;
        });
      },

      onChange: function(callback) {
        listeners.push(callback);
        var handler;
        if (backendName === 'local' && typeof window !== 'undefined') {
          handler = function(e) {
            if (!e.key || e.key.indexOf(ns + ':') !== 0) return;
            var k = _stripNs(ns, e.key);
            if (e.newValue === null) {
              callback({ type: 'remove', key: k });
            } else {
              try {
                var rec = JSON.parse(e.newValue);
                callback({ type: 'set', key: k, value: rec.v });
              } catch (err) { /* ignore */ }
            }
          };
          window.addEventListener('storage', handler);
        }
        return function() {
          var idx = listeners.indexOf(callback);
          if (idx >= 0) listeners.splice(idx, 1);
          if (handler && typeof window !== 'undefined') {
            window.removeEventListener('storage', handler);
          }
        };
      }
    };

    // Enhanced cleanup that actually counts removals for web backends
    store.cleanup = function() {
      if (backendName === 'indexeddb') {
        return b._idb ? Promise.resolve(0) : Promise.resolve(0);
      }
      // Web backend: scan all keys, remove expired, count them
      var prefix = ns + ':';
      var count = 0;
      var storage = (backendName === 'local') ? localStorage : sessionStorage;
      var toRemove = [];
      for (var i = 0; i < storage.length; i++) {
        var k = storage.key(i);
        if (!k || k.indexOf(prefix) !== 0) continue;
        try {
          var rec = JSON.parse(storage.getItem(k));
          if (rec.t !== 0 && _now() > rec.t) {
            toRemove.push(k);
          }
        } catch (e) { /* skip */ }
      }
      toRemove.forEach(function(k) {
        storage.removeItem(k);
        count++;
        _emit({ type: 'expire', key: _stripNs(ns, k) });
      });
      return Promise.resolve(count);
    };

    return store;
  }

  return { create: create };
})();
