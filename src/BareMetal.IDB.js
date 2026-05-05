var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.IDB = (function(){
  'use strict';

  var LIVE = {};

  function arr(x){ return Array.prototype.slice.call(x || []); }
  function isSupported(){ return typeof indexedDB !== 'undefined' && indexedDB && typeof indexedDB.open === 'function'; }
  function track(name, db){ (LIVE[name] = LIVE[name] || []).push(db); }
  function untrack(name, db){ var list = LIVE[name] || [], i = list.indexOf(db); if(i >= 0) list.splice(i, 1); if(!list.length) delete LIVE[name]; }
  function closeAll(name){ (LIVE[name] || []).slice().forEach(function(db){ try { db.close(); } catch(e){} }); delete LIVE[name]; }
  function keyRange(opts){
    opts = opts || {};
    var hasLo = opts.gt !== undefined || opts.gte !== undefined;
    var hasHi = opts.lt !== undefined || opts.lte !== undefined;
    var lo = opts.gt !== undefined ? opts.gt : opts.gte;
    var hi = opts.lt !== undefined ? opts.lt : opts.lte;
    if(!hasLo && !hasHi) return null;
    return hasLo && hasHi ? IDBKeyRange.bound(lo, hi, opts.gt !== undefined, opts.lt !== undefined) : hasLo ? IDBKeyRange.lowerBound(lo, opts.gt !== undefined) : IDBKeyRange.upperBound(hi, opts.lt !== undefined);
  }
  function tx(db, stores, mode, work){
    return new Promise(function(resolve, reject){
      var t, out, done = false;
      try { t = db.transaction(Array.isArray(stores) ? stores : [stores], mode); } catch (e) { reject(e); return; }
      function fail(err){ if(done) return; done = true; try { t.abort(); } catch(e){} reject(err); }
      t.oncomplete = function(){ if(!done){ done = true; resolve(out); } };
      t.onabort = t.onerror = function(){ if(!done){ done = true; reject(t.error || new Error('Transaction failed')); } };
      try { work(t, function(v){ out = v; }, fail); } catch (e) { fail(e); }
    });
  }
  function source(txn, store, index){ var st = txn.objectStore(store); return index ? st.index(index) : st; }
  function single(db, store, mode, work, map){
    return tx(db, store, mode, function(t, set, fail){
      var req = work(t.objectStore(store), t);
      req.onsuccess = function(){ set(map ? map(req.result) : req.result); };
      req.onerror = function(){ fail(req.error || new Error('Request failed')); };
    });
  }
  function many(db, store, mode, items, work){
    items = items || [];
    return tx(db, store, mode, function(t, set, fail){
      var st = t.objectStore(store);
      if(!items.length){ set(); return; }
      items.forEach(function(item){
        var req = work(st, item);
        req.onerror = function(){ fail(req.error || new Error('Request failed')); };
      });
      set();
    });
  }
  function collect(db, store, index, query, opts, first){
    opts = opts || {};
    return tx(db, store, 'readonly', function(t, set, fail){
      var out = [], limit = opts.limit || 0;
      var req = source(t, store, index).openCursor(query, opts.direction === 'prev' ? 'prev' : 'next');
      req.onsuccess = function(){
        var c = req.result;
        if(!c){ set(first ? null : out); return; }
        if(first){ set(c.value); return; }
        out.push(c.value);
        if(limit && out.length >= limit){ set(out); return; }
        c.continue();
      };
      req.onerror = function(){ fail(req.error || new Error('Cursor failed')); };
    });
  }
  function iterate(db, store, index, query, opts, cb){
    if(typeof opts === 'function'){ cb = opts; opts = {}; }
    opts = opts || {};
    return tx(db, store, 'readonly', function(t, set, fail){
      var count = 0, limit = opts.limit || 0;
      var req = source(t, store, index).openCursor(query, opts.direction === 'prev' ? 'prev' : 'next');
      req.onsuccess = function(){
        var c = req.result, keep;
        if(!c){ set(); return; }
        try { keep = cb(c.value, c, count); } catch (e) { fail(e); return; }
        count += 1;
        if(keep === false || (limit && count >= limit)){ set(); return; }
        c.continue();
      };
      req.onerror = function(){ fail(req.error || new Error('Cursor failed')); };
    });
  }
  function syncStore(db, txn, name, def){
    def = def || {};
    var exists = db.objectStoreNames.contains(name), st, same, indexes;
    if(exists){
      st = txn.objectStore(name);
      same = JSON.stringify(st.keyPath || null) === JSON.stringify(def.keyPath || null) && !!st.autoIncrement === !!def.autoIncrement;
      if(!same){ db.deleteObjectStore(name); exists = false; }
    }
    st = exists ? txn.objectStore(name) : db.createObjectStore(name, { keyPath: def.keyPath, autoIncrement: !!def.autoIncrement });
    indexes = def.indexes || [];
    arr(st.indexNames).forEach(function(idxName){
      if(!indexes.some(function(idx){ return idx.name === idxName; })) st.deleteIndex(idxName);
    });
    indexes.forEach(function(idx){
      var cur, match = false;
      if(st.indexNames.contains(idx.name)){
        cur = st.index(idx.name);
        match = JSON.stringify(cur.keyPath) === JSON.stringify(idx.keyPath) && !!cur.unique === !!idx.unique && !!cur.multiEntry === !!idx.multiEntry;
        if(!match) st.deleteIndex(idx.name);
      }
      if(!st.indexNames.contains(idx.name)) st.createIndex(idx.name, idx.keyPath, { unique: !!idx.unique, multiEntry: !!idx.multiEntry });
    });
  }
  function syncSchema(db, txn, stores){
    stores = stores || {};
    arr(db.objectStoreNames).forEach(function(name){ if(!Object.prototype.hasOwnProperty.call(stores, name)) db.deleteObjectStore(name); });
    Object.keys(stores).forEach(function(name){ syncStore(db, txn, name, stores[name]); });
  }
  function wrap(name, db){
    var off;
    function close(){ if(off){ off(); off = null; } untrack(name, db); try { db.close(); } catch(e){} }
    db.onversionchange = close;
    if(typeof globalThis !== 'undefined' && globalThis.addEventListener){
      globalThis.addEventListener('pagehide', close);
      globalThis.addEventListener('beforeunload', close);
      off = function(){
        try { globalThis.removeEventListener('pagehide', close); } catch(e){}
        try { globalThis.removeEventListener('beforeunload', close); } catch(e){}
      };
    }
    track(name, db);
    var api = {
      close: close,
      stores: function(){ return arr(db.objectStoreNames); },
      put: function(store, value){ return single(db, store, 'readwrite', function(st){ return st.put(value); }); },
      putAll: function(store, values){ return many(db, store, 'readwrite', values, function(st, value){ return st.put(value); }); },
      get: function(store, key){ return single(db, store, 'readonly', function(st){ return st.get(key); }, function(v){ return v === undefined ? null : v; }); },
      getAll: function(store, opts){ return collect(db, store, null, null, opts || {}); },
      delete: function(store, key){ return single(db, store, 'readwrite', function(st){ return st.delete(key); }).then(function(){}); },
      deleteAll: function(store, keys){ return many(db, store, 'readwrite', keys, function(st, key){ return st.delete(key); }); },
      clear: function(store){ return single(db, store, 'readwrite', function(st){ return st.clear(); }).then(function(){}); },
      count: function(store){ return single(db, store, 'readonly', function(st){ return st.count(); }); },
      getBy: function(store, index, value){ return collect(db, store, index, value, { limit: 1 }, true); },
      getAllBy: function(store, index, value, opts){ return collect(db, store, index, value, opts || {}); },
      range: function(store, index, opts){ return collect(db, store, index, keyRange(opts), opts || {}); },
      each: function(store, cb){ return iterate(db, store, null, null, {}, cb); },
      eachBy: function(store, index, opts, cb){ return iterate(db, store, index, keyRange(opts || {}), opts, cb); },
      filter: function(store, cb){ var out = []; return api.each(store, function(record, cursor, i){ if(cb(record, cursor, i)) out.push(record); }).then(function(){ return out; }); },
      transaction: function(stores, mode, fn){
        return tx(db, stores, mode || 'readonly', function(t, set){
          set(fn({
            store: function(name){ return t.objectStore(name); },
            get: function(name, key){ return t.objectStore(name).get(key); },
            put: function(name, value){ return t.objectStore(name).put(value); },
            delete: function(name, key){ return t.objectStore(name)['delete'](key); },
            clear: function(name){ return t.objectStore(name).clear(); }
          }, t));
        });
      },
      batch: function(store, op, items){
        if(op === 'put') return api.putAll(store, items);
        if(op === 'delete') return api.deleteAll(store, items);
        return Promise.reject(new Error('Unsupported batch operation: ' + op));
      },
      export: function(store){ return api.getAll(store); },
      import: function(store, data){
        data = data || [];
        return tx(db, store, 'readwrite', function(t, set, fail){
          var st = t.objectStore(store), req = st.clear();
          req.onerror = function(){ fail(req.error || new Error('Clear failed')); };
          data.forEach(function(item){
            var putReq = st.put(item);
            putReq.onerror = function(){ fail(putReq.error || new Error('Put failed')); };
          });
          set();
        });
      }
    };
    return api;
  }
  function open(name, opts){
    opts = opts || {};
    if(!isSupported()) return Promise.reject(new Error('IndexedDB is not supported'));
    return new Promise(function(resolve, reject){
      var req = opts.version == null ? indexedDB.open(name) : indexedDB.open(name, opts.version);
      req.onupgradeneeded = function(e){
        if(opts.stores) syncSchema(req.result, e.target.transaction, opts.stores);
        if(typeof opts.onUpgrade === 'function') opts.onUpgrade(req.result, e.oldVersion, e.newVersion, e.target.transaction);
      };
      req.onblocked = function(e){ if(typeof opts.onBlocked === 'function') opts.onBlocked(e); };
      req.onerror = function(){ reject(req.error); };
      req.onsuccess = function(){ resolve(wrap(name, req.result)); };
    });
  }
  function databases(){
    if(!isSupported()) return Promise.resolve([]);
    if(typeof indexedDB.databases === 'function') return Promise.resolve(indexedDB.databases()).then(function(list){ return list || []; });
    return Promise.resolve([]);
  }
  function deleteDatabase(name){
    if(!isSupported()) return Promise.reject(new Error('IndexedDB is not supported'));
    closeAll(name);
    return new Promise(function(resolve, reject){
      var req = indexedDB.deleteDatabase(name);
      req.onerror = function(){ reject(req.error); };
      req.onsuccess = function(){ resolve(); };
    });
  }
  function kv(name){
    return open(name, { version: 1, stores: { kv: { keyPath: 'key' } } }).then(function(db){
      return {
        set: function(key, value){ return db.put('kv', { key: key, value: value }); },
        get: function(key){ return db.get('kv', key).then(function(rec){ return rec ? rec.value : null; }); },
        delete: function(key){ return db.delete('kv', key); },
        has: function(key){ return db.get('kv', key).then(function(rec){ return !!rec; }); },
        keys: function(){ return db.getAll('kv').then(function(items){ return items.map(function(item){ return item.key; }); }); },
        clear: function(){ return db.clear('kv'); },
        close: function(){ db.close(); }
      };
    });
  }

  return { open: open, kv: kv, databases: databases, deleteDatabase: deleteDatabase, isSupported: isSupported };
})();
if(typeof module!=='undefined') module.exports = BareMetal.IDB;
