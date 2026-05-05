var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Sync = (function(){
  'use strict';

  var root = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
  var ABSENT = { __bmSyncAbsent: true };
  var idSeq = 0;

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function noop() {}
  function isObject(v) { return !!v && Object.prototype.toString.call(v) === '[object Object]'; }
  function isArray(v) { return Array.isArray(v); }
  function isContainer(v) { return isArray(v) || isObject(v); }
  function isAbsent(v) { return v === ABSENT; }
  function isNumericKey(v) { return typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v)); }
  function slicePath(path) { return isArray(path) ? path.slice() : []; }
  function pathKey(path) { return JSON.stringify(slicePath(path)); }
  function typeOf(v) {
    if (isAbsent(v)) return 'absent';
    if (v === null) return 'null';
    if (isArray(v)) return 'array';
    return typeof v;
  }
  function clone(v) {
    var out, i, k;
    if (isAbsent(v) || v == null || typeof v !== 'object') return v;
    if (v instanceof Date) return new Date(v.getTime());
    if (isArray(v)) {
      out = [];
      for (i = 0; i < v.length; i++) out[i] = clone(v[i]);
      return out;
    }
    out = {};
    for (k in v) if (own(v, k)) out[k] = clone(v[k]);
    return out;
  }
  function same(a, b) {
    var i, k, keysA, keysB;
    if (a === b) return true;
    if (isAbsent(a) || isAbsent(b)) return false;
    if (a == null || b == null) return a === b;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (typeOf(a) !== typeOf(b)) return false;
    if (isArray(a)) {
      if (a.length !== b.length) return false;
      for (i = 0; i < a.length; i++) if (!same(a[i], b[i])) return false;
      return true;
    }
    if (isObject(a)) {
      keysA = Object.keys(a);
      keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (i = 0; i < keysA.length; i++) {
        k = keysA[i];
        if (!own(b, k) || !same(a[k], b[k])) return false;
      }
      return true;
    }
    return false;
  }
  function stable(v) {
    var keys, out, i;
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'number' && isNaN(v)) return 'NaN';
    if (typeof v !== 'object') return JSON.stringify(v);
    if (isArray(v)) {
      out = [];
      for (i = 0; i < v.length; i++) out.push(stable(v[i]));
      return '[' + out.join(',') + ']';
    }
    keys = Object.keys(v).sort();
    out = [];
    for (i = 0; i < keys.length; i++) out.push(JSON.stringify(keys[i]) + ':' + stable(v[keys[i]]));
    return '{' + out.join(',') + '}';
  }
  function fire(list) {
    var args = Array.prototype.slice.call(arguments, 1), i;
    for (i = 0; i < list.length; i++) {
      try { list[i].apply(null, args); } catch (_) {}
    }
  }
  function toOp(op) {
    if (!op || !isArray(op.path) || !/^(add|remove|replace)$/.test(op.op)) throw new Error('Invalid operation');
    if ((op.op === 'add' || op.op === 'replace') && !own(op, 'value')) throw new Error('Operation missing value');
    return { op: op.op, path: slicePath(op.path), value: clone(op.value) };
  }
  function emptyFor(nextKey) { return isNumericKey(nextKey) ? [] : {}; }

  function diff(a, b) {
    var ops = [];
    walk(a, b, []);
    return ops;

    function walk(left, right, path) {
      var keys, i, k, max;
      if (same(left, right)) return;
      if (isArray(left) && isArray(right)) {
        max = Math.min(left.length, right.length);
        for (i = 0; i < max; i++) walk(left[i], right[i], path.concat(i));
        for (i = left.length - 1; i >= right.length; i--) ops.push({ op: 'remove', path: path.concat(i) });
        for (i = max; i < right.length; i++) ops.push({ op: 'add', path: path.concat(i), value: clone(right[i]) });
        return;
      }
      if (isObject(left) && isObject(right)) {
        keys = {};
        for (k in left) if (own(left, k)) keys[k] = 1;
        for (k in right) if (own(right, k)) keys[k] = 1;
        for (k in keys) if (own(keys, k)) {
          if (!own(right, k)) ops.push({ op: 'remove', path: path.concat(k) });
          else if (!own(left, k)) ops.push({ op: 'add', path: path.concat(k), value: clone(right[k]) });
          else walk(left[k], right[k], path.concat(k));
        }
        return;
      }
      ops.push({ op: left === undefined ? 'add' : 'replace', path: slicePath(path), value: clone(right) });
    }
  }

  function applySingle(target, op) {
    var clean = toOp(op);
    if (!clean.path.length) {
      if (clean.op === 'remove') return undefined;
      return clone(clean.value);
    }
    return write(target, clean.path, 0, clean.op, clean.value);
  }

  function write(node, path, index, op, value) {
    var key = path[index], last = index === path.length - 1, out, child;
    if (isArray(node) || isNumericKey(key)) {
      out = isArray(node) ? node.slice() : [];
      key = typeof key === 'number' ? key : parseInt(key, 10);
      if (last) {
        if (op === 'remove') out.splice(key, 1);
        else if (op === 'add') out.splice(key, 0, clone(value));
        else out[key] = clone(value);
        return out;
      }
      child = key < out.length ? out[key] : emptyFor(path[index + 1]);
      out[key] = write(child, path, index + 1, op, value);
      return out;
    }
    out = isObject(node) ? clone(node) : {};
    if (last) {
      if (op === 'remove') delete out[key];
      else out[key] = clone(value);
      return out;
    }
    child = own(out, key) ? out[key] : emptyFor(path[index + 1]);
    out[key] = write(child, path, index + 1, op, value);
    return out;
  }

  function patch(target, ops) {
    var out = clone(target), list = isArray(ops) ? ops : [], i;
    for (i = 0; i < list.length; i++) out = applySingle(out, list[i]);
    return out;
  }

  function conflict(path, local, remote, base) {
    return {
      type: 'conflict',
      id: pathKey(path),
      field: path.length ? path[path.length - 1] : null,
      path: slicePath(path),
      local: clone(local),
      remote: clone(remote),
      base: clone(base)
    };
  }

  function merge(local, remote, base, strategy) {
    var resolver = typeof strategy === 'function' ? strategy : (strategy && typeof strategy.resolve === 'function' ? strategy.resolve : null);
    var mode = resolver ? 'custom' : (strategy || 'field-level');
    var conflicts = [];
    var result = mergeNode(toPresent(local), toPresent(remote), toPresent(base), []);
    var snapshot = clone(isAbsent(result) ? undefined : result);
    var i;
    for (i = 0; i < conflicts.length; i++) conflicts[i].snapshot = clone(snapshot);
    return { result: isAbsent(result) ? undefined : result, conflicts: conflicts };

    function toPresent(v) { return v === undefined ? ABSENT : v; }
    function fromPresent(v) { return isAbsent(v) ? undefined : v; }

    function mergeNode(l, r, b, path) {
      var lChanged, rChanged, keys, out, i, key, merged, resolved;
      if (same(l, r)) return clone(l);
      lChanged = !same(l, b);
      rChanged = !same(r, b);
      if (!lChanged && rChanged) return clone(r);
      if (lChanged && !rChanged) return clone(l);
      if (!lChanged && !rChanged) return clone(b);
      if (mode === 'last-write') return clone(r);
      if (resolver) {
        resolved = resolver(path.length ? path[path.length - 1] : null, fromPresent(l), fromPresent(r), fromPresent(b), slicePath(path));
        return resolved === undefined ? ABSENT : clone(resolved);
      }
      if (isObject(l) && isObject(r) && (isObject(b) || isAbsent(b))) {
        keys = {};
        out = {};
        if (isObject(b)) for (key in b) if (own(b, key)) keys[key] = 1;
        for (key in l) if (own(l, key)) keys[key] = 1;
        for (key in r) if (own(r, key)) keys[key] = 1;
        for (key in keys) if (own(keys, key)) {
          merged = mergeNode(own(l, key) ? l[key] : ABSENT, own(r, key) ? r[key] : ABSENT, isObject(b) && own(b, key) ? b[key] : ABSENT, path.concat(key));
          if (!isAbsent(merged)) out[key] = merged;
        }
        return out;
      }
      if (isArray(l) && isArray(r) && (isArray(b) || isAbsent(b))) {
        conflicts.push(conflict(path, fromPresent(l), fromPresent(r), fromPresent(b)));
        return clone(l);
      }
      conflicts.push(conflict(path, fromPresent(l), fromPresent(r), fromPresent(b)));
      return clone(l);
    }
  }

  function pickResolution(conf, resolution) {
    if (typeof resolution === 'function') return clone(resolution(conf));
    if (resolution && isObject(resolution) && own(resolution, 'use')) {
      if (resolution.use === 'local') return clone(conf.local);
      if (resolution.use === 'remote') return clone(conf.remote);
      if (resolution.use === 'base') return clone(conf.base);
      if (resolution.use === 'value') return clone(resolution.value);
    }
    return clone(resolution);
  }

  function resolve(conflicts, resolutions) {
    var list = isArray(conflicts) ? conflicts : [];
    var result = list.length && own(list[0], 'snapshot') ? clone(list[0].snapshot) : {};
    var i, conf, keyJson, keyDot, resolution;
    for (i = 0; i < list.length; i++) {
      conf = list[i];
      if (isArray(resolutions)) {
        resolution = findResolution(resolutions, conf.path);
      } else if (resolutions && typeof resolutions === 'object') {
        keyJson = pathKey(conf.path);
        keyDot = conf.path.join('.');
        if (own(resolutions, keyJson)) resolution = resolutions[keyJson];
        else if (own(resolutions, keyDot)) resolution = resolutions[keyDot];
        else if (conf.field != null && own(resolutions, conf.field)) resolution = resolutions[conf.field];
      }
      if (resolution !== undefined) result = patch(result, [{ op: 'replace', path: conf.path, value: pickResolution(conf, resolution) }]);
    }
    return result;
  }

  function findResolution(list, path) {
    var i, item;
    for (i = 0; i < list.length; i++) {
      item = list[i];
      if (item && same(item.path, path)) return own(item, 'value') ? item.value : item;
    }
  }

  function getStorage(kind) {
    if (kind !== 'localStorage') return null;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (_) {}
    try { if (root && root.localStorage) return root.localStorage; } catch (_) {}
    return null;
  }

  function queue(opts) {
    var cfg = opts || {};
    var key = cfg.key || 'BareMetal.Sync.queue';
    var maxSize = cfg.maxSize > 0 ? cfg.maxSize : 0;
    var retry = !!cfg.retry;
    var maxRetries = cfg.maxRetries >= 0 ? cfg.maxRetries : 3;
    var storage = getStorage(cfg.storage);
    var items = [];
    var flushers = [];
    var errors = [];
    var api;

    load();

    function persist() {
      if (!storage) return;
      try { storage.setItem(key, JSON.stringify(items)); } catch (_) {}
    }
    function load() {
      var raw;
      if (!storage) return;
      try {
        raw = storage.getItem(key);
        items = raw ? JSON.parse(raw) : [];
        if (!isArray(items)) items = [];
      } catch (_) { items = []; }
    }
    function normalize(op) {
      return { id: ++idSeq, op: clone(op), retries: 0, enqueuedAt: Date.now() };
    }
    function off(list, fn) {
      return function() {
        var i;
        for (i = list.length - 1; i >= 0; i--) if (list[i] === fn) list.splice(i, 1);
      };
    }

    api = {
      push: function(op) {
        if (maxSize && items.length >= maxSize) items.shift();
        items.push(normalize(op));
        persist();
        return api.size();
      },
      flush: function(sendFn) {
        sendFn = typeof sendFn === 'function' ? sendFn : function(value) { return Promise.resolve(value); };
        return new Promise(function(resolve, reject) {
          var sent = [];
          function step() {
            var current = items[0];
            if (!current) return resolve(sent);
            Promise.resolve(sendFn(clone(current.op)))
              .then(function(response) {
                items.shift();
                persist();
                sent.push(clone(current.op));
                fire(flushers, clone(current.op), response);
                step();
              })
              .catch(function(err) {
                current.retries = (current.retries || 0) + 1;
                persist();
                fire(errors, err, clone(current.op), current.retries);
                if (retry && current.retries <= maxRetries) return step();
                reject(err);
              });
          }
          step();
        });
      },
      peek: function() { return items.length ? clone(items[0].op) : null; },
      size: function() { return items.length; },
      clear: function() { items.length = 0; persist(); return api; },
      onFlush: function(cb) { if (typeof cb === 'function') flushers.push(cb); return off(flushers, cb); },
      onError: function(cb) { if (typeof cb === 'function') errors.push(cb); return off(errors, cb); }
    };

    return api;
  }

  function replay(ops, applyFn) {
    var list = isArray(ops) ? ops.slice() : [];
    var run = typeof applyFn === 'function' ? applyFn : function(op) { return op; };
    var chain = Promise.resolve([]);
    list.forEach(function(op, index) {
      chain = chain.then(function(results) {
        return Promise.resolve(run(clone(op), index)).then(function(value) {
          results.push(value);
          return results;
        });
      });
    });
    return chain;
  }

  function unwrap(entry) { return entry && own(entry, 'op') ? entry.op : entry; }
  function statusOf(entry) {
    var status = entry && (entry.status || entry.state || entry.result);
    return typeof status === 'string' ? status.toLowerCase() : '';
  }
  function sig(entry) {
    var value = unwrap(entry);
    if (value && own(value, 'id')) return 'id:' + value.id;
    if (entry && own(entry, 'id')) return 'id:' + entry.id;
    return stable(value);
  }
  function echo(sent, received) {
    var input = isArray(sent) ? sent : (sent == null ? [] : [sent]);
    var seen = {};
    var confirmed = [];
    var rejected = [];
    var pending = [];
    var i, match, status;
    var index = {};
    var list = isArray(received) ? received : (received == null ? [] : [received]);
    for (i = 0; i < list.length; i++) {
      match = sig(list[i]);
      (index[match] = index[match] || []).push(list[i]);
    }
    for (i = 0; i < input.length; i++) {
      match = sig(input[i]);
      if (index[match] && index[match].length) {
        status = statusOf(index[match][0]);
        seen[match] = 1;
        if (status === 'rejected' || status === 'error' || status === 'denied') rejected.push(clone(input[i]));
        else confirmed.push(clone(input[i]));
        index[match].shift();
      } else pending.push(clone(input[i]));
    }
    return { confirmed: confirmed, rejected: rejected, pending: pending };
  }

  function clock(initial) {
    var state = isObject(initial) ? clone(initial) : {};
    var api = {
      increment: function(nodeId, amount) {
        nodeId = nodeId || 'default';
        amount = amount == null ? 1 : amount;
        state[nodeId] = (state[nodeId] || 0) + amount;
        return api;
      },
      merge: function(otherClock) {
        var other = extractClock(otherClock), key;
        for (key in other) if (own(other, key)) state[key] = Math.max(state[key] || 0, other[key] || 0);
        return api;
      },
      compare: function(otherClock) {
        var other = extractClock(otherClock), before = false, after = false, key, keys = {};
        for (key in state) if (own(state, key)) keys[key] = 1;
        for (key in other) if (own(other, key)) keys[key] = 1;
        for (key in keys) if (own(keys, key)) {
          if ((state[key] || 0) < (other[key] || 0)) before = true;
          if ((state[key] || 0) > (other[key] || 0)) after = true;
        }
        if (before && !after) return 'before';
        if (after && !before) return 'after';
        return 'concurrent';
      },
      toJSON: function() { return clone(state); },
      value: function() { return clone(state); }
    };
    return api;
  }

  function extractClock(otherClock) {
    if (otherClock && typeof otherClock.toJSON === 'function') return otherClock.toJSON();
    return isObject(otherClock) ? clone(otherClock) : {};
  }

  function crdt(type, opts) {
    type = String(type || '').toLowerCase();
    if (type === 'counter') return counterCrdt(opts);
    if (type === 'set') return setCrdt(opts);
    if (type === 'register') return registerCrdt(opts);
    throw new Error('Unknown CRDT type');
  }

  function counterCrdt(opts) {
    var counts = {};
    var nodeId = opts && opts.nodeId || 'default';
    var api = {
      increment: function(id, amount) {
        id = id || nodeId;
        amount = amount == null ? 1 : amount;
        counts[id] = (counts[id] || 0) + amount;
        return api;
      },
      value: function() {
        var total = 0, key;
        for (key in counts) if (own(counts, key)) total += counts[key] || 0;
        return total;
      },
      merge: function(remote) {
        var other = remote && typeof remote.toJSON === 'function' ? remote.toJSON() : remote || {};
        var source = other.counts || other;
        var key;
        for (key in source) if (own(source, key)) counts[key] = Math.max(counts[key] || 0, source[key] || 0);
        return api;
      },
      toJSON: function() { return { type: 'counter', counts: clone(counts) }; },
      fromJSON: function(json) { counts = clone((json && json.counts) || json || {}); return api; }
    };
    return api;
  }

  function setCrdt() {
    var adds = {};
    var removes = {};
    var values = {};
    var api = {
      add: function(value, tag) {
        var key = encodeValue(value);
        tag = tag || ('tag-' + Date.now() + '-' + (++idSeq));
        values[key] = clone(value);
        adds[key] = adds[key] || {};
        adds[key][tag] = 1;
        return api;
      },
      remove: function(value) {
        var key = encodeValue(value), tag;
        removes[key] = removes[key] || {};
        for (tag in (adds[key] || {})) if (own(adds[key], tag)) removes[key][tag] = 1;
        return api;
      },
      has: function(value) {
        return activeTags(encodeValue(value)).length > 0;
      },
      value: function() {
        var out = [], key;
        for (key in adds) if (own(adds, key) && activeTags(key).length) out.push(clone(values[key]));
        return out;
      },
      merge: function(remote) {
        var data = remote && typeof remote.toJSON === 'function' ? remote.toJSON() : remote || {};
        mergeTagMap(adds, data.adds || {});
        mergeTagMap(removes, data.removes || {});
        mergeValueMap(values, data.values || {});
        return api;
      },
      toJSON: function() { return { type: 'set', adds: clone(adds), removes: clone(removes), values: clone(values) }; },
      fromJSON: function(json) {
        adds = clone((json && json.adds) || {});
        removes = clone((json && json.removes) || {});
        values = clone((json && json.values) || {});
        return api;
      }
    };
    return api;

    function activeTags(key) {
      var out = [], tag;
      for (tag in (adds[key] || {})) if (own(adds[key], tag) && !(removes[key] && removes[key][tag])) out.push(tag);
      return out;
    }
  }

  function mergeTagMap(target, source) {
    var key, tag;
    for (key in source) if (own(source, key)) {
      target[key] = target[key] || {};
      for (tag in source[key]) if (own(source[key], tag)) target[key][tag] = 1;
    }
  }
  function mergeValueMap(target, source) {
    var key;
    for (key in source) if (own(source, key)) target[key] = clone(source[key]);
  }
  function encodeValue(value) {
    return stable(value);
  }

  function registerCrdt(opts) {
    var state = { value: null, timestamp: 0, nodeId: opts && opts.nodeId || '' };
    var api = {
      set: function(value, timestamp, nodeId) {
        var candidate = {
          value: clone(value),
          timestamp: timestamp == null ? Date.now() : timestamp,
          nodeId: nodeId == null ? state.nodeId : nodeId
        };
        if (candidate.timestamp > state.timestamp || (candidate.timestamp === state.timestamp && String(candidate.nodeId) >= String(state.nodeId))) state = candidate;
        return api;
      },
      value: function() { return clone(state.value); },
      merge: function(remote) {
        var data = remote && typeof remote.toJSON === 'function' ? remote.toJSON() : remote || {};
        return api.set(data.value, data.timestamp, data.nodeId);
      },
      toJSON: function() { return clone(state); },
      fromJSON: function(json) { state = clone(json || state); return api; }
    };
    return api;
  }

  function version(obj) {
    var history = [{ version: 0, value: clone(obj), timestamp: Date.now() }];
    var index = 0;
    var api = {
      get: function() { return clone(history[index].value); },
      set: function(val) {
        var nextVersion = history[history.length - 1].version + 1;
        if (index < history.length - 1) history = history.slice(0, index + 1);
        history.push({ version: nextVersion, value: clone(val), timestamp: Date.now() });
        index = history.length - 1;
        return api;
      },
      getVersion: function() { return history[index].version; },
      getHistory: function() { return clone(history); },
      rollback: function(versionId) {
        var i;
        for (i = 0; i < history.length; i++) {
          if (history[i].version === versionId) {
            index = i;
            return clone(history[index].value);
          }
        }
        return null;
      }
    };
    return api;
  }

  function subscribe(syncable, callback) {
    var list, off;
    if (!syncable || typeof callback !== 'function') return noop;
    if (typeof syncable.subscribe === 'function') return syncable.subscribe(callback) || noop;
    if (typeof syncable.onChange === 'function') return syncable.onChange(callback) || noop;
    if (typeof syncable.on === 'function') {
      off = syncable.on('remote', callback);
      if (typeof off === 'function') return off;
      if (typeof syncable.off === 'function') return function() { syncable.off('remote', callback); };
    }
    list = syncable.__bmSyncSubscribers || [];
    list.push(callback);
    try {
      Object.defineProperty(syncable, '__bmSyncSubscribers', { value: list, configurable: true, writable: true });
      if (!syncable.notifyRemote) {
        Object.defineProperty(syncable, 'notifyRemote', {
          value: function(payload) { fire(syncable.__bmSyncSubscribers || [], payload); },
          configurable: true,
          writable: true
        });
      }
    } catch (_) {
      syncable.__bmSyncSubscribers = list;
      if (!syncable.notifyRemote) syncable.notifyRemote = function(payload) { fire(syncable.__bmSyncSubscribers || [], payload); };
    }
    return function() {
      var i;
      for (i = list.length - 1; i >= 0; i--) if (list[i] === callback) list.splice(i, 1);
    };
  }

  function batch(ops) {
    var list = (isArray(ops) ? ops : []).map(toOp);
    return {
      ops: clone(list),
      size: function() { return list.length; },
      apply: function(target) { return patch(target, list); }
    };
  }

  return {
    diff: diff,
    patch: patch,
    merge: merge,
    conflict: conflict,
    resolve: resolve,
    queue: queue,
    replay: replay,
    echo: echo,
    clock: clock,
    crdt: crdt,
    version: version,
    subscribe: subscribe,
    batch: batch
  };
})();
if (typeof window !== 'undefined') {
  window.BareMetal = window.BareMetal || BareMetal;
  window.BareMetal.Sync = BareMetal.Sync;
}
if (typeof globalThis !== 'undefined') {
  globalThis.BareMetal = globalThis.BareMetal || BareMetal;
  globalThis.BareMetal.Sync = BareMetal.Sync;
}
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Sync;
else if (typeof exports !== 'undefined') exports.Sync = BareMetal.Sync;
