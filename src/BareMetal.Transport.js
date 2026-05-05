var __bmRoot = (typeof globalThis !== 'undefined') ? globalThis : ((typeof window !== 'undefined') ? window : this);
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : ((__bmRoot && __bmRoot.BareMetal) ? __bmRoot.BareMetal : {});
BareMetal.Transport = (function(){
  'use strict';

  var PRIORITY_ORDER = { critical: 5, high: 4, normal: 3, low: 2, idle: 1 };

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function noop() {}
  function slice(args) { return Array.prototype.slice.call(args); }
  function now() { return Date.now(); }
  function isFn(value) { return typeof value === 'function'; }
  function toNumber(value, fallback) { return typeof value === 'number' && !isNaN(value) ? value : fallback; }
  function clamp(num, min, max) { return Math.max(min, Math.min(max, num)); }
  function delay(ms, signal) {
    ms = Math.max(0, toNumber(ms, 0));
    return new Promise(function(resolve, reject) {
      var timer;
      function cleanup() {
        if (timer != null) clearTimeout(timer);
        if (signal && signal.removeEventListener) signal.removeEventListener('abort', onAbort);
      }
      function onAbort() {
        cleanup();
        reject(makeAbortError(signal && signal.reason));
      }
      if (signal && signal.aborted) return reject(makeAbortError(signal.reason));
      timer = setTimeout(function() {
        cleanup();
        resolve();
      }, ms);
      if (signal && signal.addEventListener) signal.addEventListener('abort', onAbort, { once: true });
    });
  }
  function makeAbortError(reason) {
    var err = reason instanceof Error ? reason : new Error(reason && reason.message ? reason.message : 'Aborted');
    if (!err.name) err.name = 'AbortError';
    err.name = 'AbortError';
    return err;
  }
  function normalizePriority(level) {
    level = String(level || 'normal').toLowerCase();
    return own(PRIORITY_ORDER, level) ? level : 'normal';
  }
  function randomBytes(len) {
    var out = [];
    var i;
    if (__bmRoot && __bmRoot.crypto && isFn(__bmRoot.crypto.getRandomValues)) {
      var typed = new Uint8Array(len);
      __bmRoot.crypto.getRandomValues(typed);
      for (i = 0; i < typed.length; i++) out.push(typed[i]);
      return out;
    }
    for (i = 0; i < len; i++) out.push(Math.floor(Math.random() * 256));
    return out;
  }
  function createAbortController() {
    if (typeof AbortController !== 'undefined') return new AbortController();
    var listeners = [];
    var signal = {
      aborted: false,
      reason: undefined,
      addEventListener: function(type, fn) {
        if (type === 'abort' && isFn(fn)) listeners.push(fn);
      },
      removeEventListener: function(type, fn) {
        var i;
        if (type !== 'abort') return;
        for (i = listeners.length - 1; i >= 0; i--) if (listeners[i] === fn) listeners.splice(i, 1);
      }
    };
    return {
      signal: signal,
      abort: function(reason) {
        var list, i;
        if (signal.aborted) return;
        signal.aborted = true;
        signal.reason = reason;
        list = listeners.slice();
        listeners = [];
        for (i = 0; i < list.length; i++) {
          try { list[i]({ type: 'abort', target: signal }); } catch (_) {}
        }
      }
    };
  }
  function backoff(attempt, policy) {
    var cfg = policy || {};
    var baseDelay = Math.max(0, toNumber(cfg.baseDelay, 100));
    var maxDelay = Math.max(baseDelay, toNumber(cfg.maxDelay, Infinity));
    var mode = cfg.backoff || 'exponential';
    var index = Math.max(1, toNumber(attempt, 1));
    var wait = baseDelay;
    if (mode === 'linear') wait = baseDelay * index;
    else if (mode === 'fixed') wait = baseDelay;
    else wait = baseDelay * Math.pow(2, index - 1);
    wait = Math.min(wait, maxDelay);
    if (cfg.jitter) wait = Math.floor(Math.random() * (wait + 1));
    return Math.max(0, Math.floor(wait));
  }
  function retry(fn, policy) {
    var cfg = policy || {};
    var maxAttempts = Math.max(1, toNumber(cfg.maxAttempts, 3));
    var retryOn = isFn(cfg.retryOn) ? cfg.retryOn : function() { return true; };
    var signal = cfg.signal;
    function run(attempt) {
      if (signal && signal.aborted) return Promise.reject(makeAbortError(signal.reason));
      return Promise.resolve().then(function() {
        return fn(attempt);
      }).catch(function(err) {
        if (attempt >= maxAttempts || !retryOn(err, attempt)) throw err;
        return delay(backoff(attempt, cfg), signal).then(function() {
          return run(attempt + 1);
        });
      });
    }
    return run(1);
  }
  function idempotencyKey() {
    var bytes = randomBytes(16);
    var i;
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    for (i = 0; i < bytes.length; i++) bytes[i] = (bytes[i] + 256).toString(16).slice(1);
    return bytes.slice(0, 4).join('') + '-' + bytes.slice(4, 6).join('') + '-' + bytes.slice(6, 8).join('') + '-' + bytes.slice(8, 10).join('') + '-' + bytes.slice(10, 16).join('');
  }
  function dedupe(keyFn, maybeFn) {
    function makeWrapper(fn) {
      var inflight = {};
      var wrapped = function() {
        var args = slice(arguments);
        var ctx = this;
        var key = isFn(keyFn) ? keyFn.apply(ctx, args) : JSON.stringify(args);
        if (own(inflight, key)) return inflight[key];
        try {
          inflight[key] = Promise.resolve(fn.apply(ctx, args)).then(function(value) {
            delete inflight[key];
            return value;
          }, function(err) {
            delete inflight[key];
            throw err;
          });
        } catch (err) {
          delete inflight[key];
          return Promise.reject(err);
        }
        return inflight[key];
      };
      wrapped.inflight = function() { return Object.keys(inflight).length; };
      wrapped.clear = function() { inflight = {}; return wrapped; };
      return wrapped;
    }
    if (isFn(maybeFn)) return makeWrapper(maybeFn);
    return function(fn) { return makeWrapper(fn); };
  }
  function createCoalescer(options) {
    var opts = options || {};
    var batchFn = isFn(opts.batchFn) ? opts.batchFn : function(batch) { return batch; };
    var maxBatch = Math.max(1, toNumber(opts.maxBatch, Infinity));
    var maxWait = Math.max(0, toNumber(opts.maxWait, 0));
    var pending = [];
    var timer = null;
    function resolveBatch(items, result) {
      var i;
      if (Array.isArray(result)) {
        for (i = 0; i < items.length; i++) items[i].resolve(result[i]);
      } else {
        for (i = 0; i < items.length; i++) items[i].resolve(result);
      }
    }
    function rejectBatch(items, err) {
      var i;
      for (i = 0; i < items.length; i++) items[i].reject(err);
    }
    function flush() {
      var items;
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      if (!pending.length) return Promise.resolve([]);
      items = pending.splice(0, maxBatch);
      return Promise.resolve().then(function() {
        return batchFn(items.map(function(entry) { return entry.request; }), items);
      }).then(function(result) {
        resolveBatch(items, result);
        if (pending.length) schedule();
        return result;
      }, function(err) {
        rejectBatch(items, err);
        if (pending.length) schedule();
        throw err;
      });
    }
    function schedule() {
      if (!pending.length) return;
      if (pending.length >= maxBatch) return void flush();
      if (timer != null) return;
      if (!maxWait) return void Promise.resolve().then(flush);
      timer = setTimeout(flush, maxWait);
    }
    var enqueue = function(request) {
      return new Promise(function(resolve, reject) {
        pending.push({ request: request, resolve: resolve, reject: reject });
        schedule();
      });
    };
    enqueue.flush = flush;
    enqueue.size = function() { return pending.length; };
    enqueue.clear = function() {
      rejectBatch(pending.splice(0, pending.length), new Error('Coalescer cleared'));
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    };
    return enqueue;
  }
  function coalesce(requests, opts) {
    var i = 0;
    var all = [];
    var options = opts || requests || {};
    var batchFn = isFn(options.batchFn) ? options.batchFn : function(batch) { return batch; };
    var maxBatch = Math.max(1, toNumber(options.maxBatch, Infinity));
    var maxWait = Math.max(0, toNumber(options.maxWait, 0));
    if (!Array.isArray(requests)) return createCoalescer(options);
    function step() {
      var batch;
      if (i >= requests.length) return Promise.resolve(all);
      batch = requests.slice(i, i + maxBatch);
      i += batch.length;
      return Promise.resolve().then(function() {
        return batchFn(batch);
      }).then(function(result) {
        if (Array.isArray(result)) Array.prototype.push.apply(all, result);
        else all.push(result);
        if (!maxWait) return step();
        return delay(maxWait).then(step);
      });
    }
    return step();
  }
  function cancel(parentSignal) {
    var controller = createAbortController();
    function abortFromParent() {
      controller.abort(parentSignal && parentSignal.reason);
    }
    if (parentSignal) {
      if (parentSignal.aborted) abortFromParent();
      else if (parentSignal.addEventListener) parentSignal.addEventListener('abort', abortFromParent, { once: true });
    }
    if (controller.signal && controller.signal.addEventListener && parentSignal && parentSignal.removeEventListener) {
      controller.signal.addEventListener('abort', function() {
        parentSignal.removeEventListener('abort', abortFromParent);
      }, { once: true });
    }
    return {
      signal: controller.signal,
      abort: function(reason) {
        controller.abort(reason);
      },
      fork: function() {
        return cancel(controller.signal);
      }
    };
  }
  function timeout(ms) {
    var scoped = cancel();
    var timer = setTimeout(function() {
      scoped.abort(new Error('Timed out after ' + Math.max(0, toNumber(ms, 0)) + 'ms'));
    }, Math.max(0, toNumber(ms, 0)));
    function clear() {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    }
    if (scoped.signal && scoped.signal.addEventListener) scoped.signal.addEventListener('abort', clear, { once: true });
    return { signal: scoped.signal, clear: clear };
  }
  function race(promises, signal) {
    var entries = [];
    var i;
    function toEntry(item) {
      var local = cancel(signal);
      if (isFn(item)) {
        return {
          promise: Promise.resolve().then(function() { return item(local.signal); }),
          abort: function() { local.abort(new Error('Race cancelled')); }
        };
      }
      if (item && isFn(item.promise && item.promise.then)) {
        return {
          promise: item.promise,
          abort: isFn(item.abort) ? item.abort : (item.controller && isFn(item.controller.abort) ? function() { item.controller.abort(); } : noop)
        };
      }
      return {
        promise: Promise.resolve(item),
        abort: isFn(item && item.abort) ? item.abort : noop
      };
    }
    function abortOthers(winner) {
      for (i = 0; i < entries.length; i++) if (i !== winner) {
        try { entries[i].abort(); } catch (_) {}
      }
    }
    return new Promise(function(resolve, reject) {
      var done = false;
      var remaining;
      var failures = [];
      function onAbort() {
        var j;
        if (done) return;
        done = true;
        for (j = 0; j < entries.length; j++) {
          try { entries[j].abort(); } catch (_) {}
        }
        reject(makeAbortError(signal && signal.reason));
      }
      if (signal && signal.aborted) return reject(makeAbortError(signal.reason));
      for (i = 0; i < (promises || []).length; i++) entries.push(toEntry(promises[i]));
      if (!entries.length) return reject(new Error('No promises to race'));
      remaining = entries.length;
      if (signal && signal.addEventListener) signal.addEventListener('abort', onAbort, { once: true });
      entries.forEach(function(entry, index) {
        Promise.resolve(entry.promise).then(function(value) {
          if (done) return;
          done = true;
          if (signal && signal.removeEventListener) signal.removeEventListener('abort', onAbort);
          abortOthers(index);
          resolve(value);
        }, function(err) {
          if (done) return;
          failures[index] = err;
          remaining--;
          if (!remaining) {
            done = true;
            if (signal && signal.removeEventListener) signal.removeEventListener('abort', onAbort);
            reject(failures[0] || new Error('All raced promises rejected'));
          }
        });
      });
    });
  }
  function memoryStore() {
    var map = new Map();
    return {
      get: function(key) { return map.get(key); },
      set: function(key, value) {
        if (map.has(key)) map.delete(key);
        map.set(key, value);
      },
      delete: function(key) { map.delete(key); },
      clear: function() { map.clear(); },
      has: function(key) { return map.has(key); },
      keys: function() { return Array.from(map.keys()); },
      size: function() { return map.size; }
    };
  }
  function resolveStore(opts) {
    if (opts && opts.storage && typeof opts.storage === 'object' && !Array.isArray(opts.storage)) return opts.storage;
    if (opts && opts.store && typeof opts.store === 'object') return opts.store;
    return memoryStore();
  }
  function cache(fn, opts) {
    var cfg = opts || {};
    var ttl = toNumber(cfg.ttl, Infinity);
    var swr = Math.max(0, toNumber(cfg.swr, 0));
    var staleIfError = !!cfg.staleIfError;
    var keyFn = isFn(cfg.key) ? cfg.key : function(args) { return JSON.stringify(args); };
    var maxSize = cfg.maxSize > 0 ? cfg.maxSize : 0;
    var store = resolveStore(cfg);
    var inflight = {};
    function getEntry(key) {
      return isFn(store.get) ? store.get(key) : store[key];
    }
    function setEntry(key, value) {
      if (isFn(store.set)) store.set(key, value);
      else store[key] = value;
      evict();
      return value;
    }
    function delEntry(key) {
      if (isFn(store.delete)) store.delete(key);
      else delete store[key];
    }
    function touch(key, entry) {
      if (isFn(store.set) && isFn(store.get)) store.set(key, entry);
    }
    function count() {
      if (isFn(store.size)) return store.size();
      if (isFn(store.keys)) return store.keys().length;
      return Object.keys(store).length;
    }
    function keys() {
      if (isFn(store.keys)) return store.keys();
      return Object.keys(store);
    }
    function evict() {
      var list;
      while (maxSize && count() > maxSize) {
        list = keys();
        if (!list.length) break;
        delEntry(list[0]);
      }
    }
    function buildEntry(value) {
      var stamp = now();
      return {
        value: value,
        expiresAt: ttl === Infinity ? Infinity : stamp + Math.max(0, ttl),
        swrUntil: ttl === Infinity ? Infinity : stamp + Math.max(0, ttl) + swr,
        updatedAt: stamp
      };
    }
    function refresh(key, ctx, args, previous) {
      if (own(inflight, key)) return inflight[key];
      inflight[key] = Promise.resolve().then(function() {
        return fn.apply(ctx, args);
      }).then(function(value) {
        delete inflight[key];
        setEntry(key, buildEntry(value));
        return value;
      }, function(err) {
        delete inflight[key];
        if (previous && staleIfError) return previous.value;
        throw err;
      });
      return inflight[key];
    }
    var wrapped = function() {
      var args = slice(arguments);
      var ctx = this;
      var key = keyFn.call(ctx, args);
      var entry = getEntry(key);
      var stamp = now();
      if (entry) {
        touch(key, entry);
        if (entry.expiresAt > stamp) return Promise.resolve(entry.value);
        if (entry.swrUntil > stamp) {
          refresh(key, ctx, args, entry).catch(noop);
          return Promise.resolve(entry.value);
        }
        return refresh(key, ctx, args, entry);
      }
      return refresh(key, ctx, args);
    };
    wrapped.clear = function() {
      if (isFn(store.clear)) store.clear();
      else {
        var list = keys();
        var i;
        for (i = 0; i < list.length; i++) delEntry(list[i]);
      }
      inflight = {};
      return wrapped;
    };
    wrapped.delete = function() {
      var key = keyFn.call(this, slice(arguments));
      delEntry(key);
      return wrapped;
    };
    wrapped.peek = function() {
      var key = keyFn.call(this, slice(arguments));
      var entry = getEntry(key);
      return entry ? entry.value : undefined;
    };
    return wrapped;
  }
  function priority(fn, level) {
    var wrapped = function() {
      return fn.apply(this, arguments);
    };
    wrapped.priority = normalizePriority(level);
    wrapped.priorityWeight = PRIORITY_ORDER[wrapped.priority];
    wrapped.original = fn;
    return wrapped;
  }
  function queue(opts) {
    var cfg = opts || {};
    var concurrency = Math.max(1, toNumber(cfg.concurrency, 1));
    var usePriority = !!cfg.priority;
    var onDrain = isFn(cfg.onDrain) ? cfg.onDrain : null;
    var running = 0;
    var paused = false;
    var items = [];
    var seq = 0;
    function rank(level) { return PRIORITY_ORDER[normalizePriority(level)]; }
    function notifyDrain() {
      if (!running && !items.length && onDrain) {
        Promise.resolve().then(function() { onDrain(); });
      }
    }
    function insert(item) {
      var i;
      if (!usePriority) {
        items.push(item);
        return;
      }
      for (i = 0; i < items.length; i++) {
        if (item.rank > items[i].rank || (item.rank === items[i].rank && item.seq < items[i].seq)) {
          items.splice(i, 0, item);
          return;
        }
      }
      items.push(item);
    }
    function runItem(entry) {
      running++;
      Promise.resolve().then(function() {
        return entry.fn();
      }).then(function(value) {
        entry.resolve(value);
      }, function(err) {
        entry.reject(err);
      }).then(function() {
        running--;
        pump();
        notifyDrain();
      });
    }
    function pump() {
      if (paused) return;
      while (running < concurrency && items.length) runItem(items.shift());
      notifyDrain();
    }
    return {
      add: function(fn, level) {
        return new Promise(function(resolve, reject) {
          insert({
            fn: fn,
            resolve: resolve,
            reject: reject,
            rank: rank(level || (fn && fn.priority) || 'normal'),
            seq: seq++
          });
          pump();
        });
      },
      pause: function() { paused = true; return this; },
      resume: function() { paused = false; pump(); return this; },
      clear: function() {
        while (items.length) items.shift().reject(new Error('Queue cleared'));
        notifyDrain();
        return this;
      },
      size: function() { return items.length; },
      pending: function() { return running; }
    };
  }
  function circuit(fn, opts) {
    var cfg = opts || {};
    var threshold = Math.max(1, toNumber(cfg.threshold, 5));
    var resetTimeout = Math.max(0, toNumber(cfg.resetTimeout, 30000));
    var halfOpenMax = Math.max(1, toNumber(cfg.halfOpenMax, 1));
    var state = 'closed';
    var failures = 0;
    var openedAt = 0;
    var halfOpenInFlight = 0;
    var halfOpenSuccesses = 0;
    function setState(next) {
      if (state === next) return;
      state = next;
      if (next === 'open') {
        openedAt = now();
        halfOpenInFlight = 0;
        halfOpenSuccesses = 0;
        failures = 0;
        if (isFn(cfg.onOpen)) cfg.onOpen();
      } else if (next === 'half-open') {
        halfOpenInFlight = 0;
        halfOpenSuccesses = 0;
        if (isFn(cfg.onHalfOpen)) cfg.onHalfOpen();
      } else {
        failures = 0;
        halfOpenInFlight = 0;
        halfOpenSuccesses = 0;
        if (isFn(cfg.onClose)) cfg.onClose();
      }
    }
    function ensureState() {
      if (state === 'open' && now() - openedAt >= resetTimeout) setState('half-open');
    }
    function openError() {
      var err = new Error('Circuit is open');
      err.name = 'CircuitOpenError';
      err.code = 'E_CIRCUIT_OPEN';
      return err;
    }
    var wrapped = function() {
      var args = arguments;
      var ctx = this;
      ensureState();
      if (state === 'open') return Promise.reject(openError());
      if (state === 'half-open' && halfOpenInFlight >= halfOpenMax) return Promise.reject(openError());
      if (state === 'half-open') halfOpenInFlight++;
      return Promise.resolve().then(function() {
        return fn.apply(ctx, args);
      }).then(function(value) {
        if (state === 'half-open') {
          halfOpenInFlight = Math.max(0, halfOpenInFlight - 1);
          halfOpenSuccesses++;
          if (halfOpenSuccesses >= halfOpenMax && !halfOpenInFlight) setState('closed');
        } else {
          failures = 0;
        }
        return value;
      }, function(err) {
        if (state === 'half-open') {
          halfOpenInFlight = Math.max(0, halfOpenInFlight - 1);
          setState('open');
        } else {
          failures++;
          if (failures >= threshold) setState('open');
        }
        throw err;
      });
    };
    wrapped.state = function() {
      ensureState();
      return state;
    };
    wrapped.reset = function() {
      setState('closed');
      return wrapped;
    };
    wrapped.stats = function() {
      ensureState();
      return {
        state: state,
        failures: failures,
        threshold: threshold,
        halfOpenInFlight: halfOpenInFlight,
        halfOpenMax: halfOpenMax
      };
    };
    return wrapped;
  }
  function rateLimit(fn, opts) {
    var cfg = opts || {};
    var maxPerSecond = cfg.maxPerSecond > 0 ? cfg.maxPerSecond : Infinity;
    var maxPerMinute = cfg.maxPerMinute > 0 ? cfg.maxPerMinute : Infinity;
    var queueEnabled = !!cfg.queue;
    var secondHits = [];
    var minuteHits = [];
    var pending = [];
    var timer = null;
    function prune(stamp) {
      while (secondHits.length && stamp - secondHits[0] >= 1000) secondHits.shift();
      while (minuteHits.length && stamp - minuteHits[0] >= 60000) minuteHits.shift();
    }
    function nextDelay(stamp) {
      var waits = [];
      prune(stamp);
      if (maxPerSecond !== Infinity && secondHits.length >= maxPerSecond) waits.push(1000 - (stamp - secondHits[0]));
      if (maxPerMinute !== Infinity && minuteHits.length >= maxPerMinute) waits.push(60000 - (stamp - minuteHits[0]));
      return waits.length ? Math.max.apply(Math, waits) : 0;
    }
    function mark(stamp) {
      secondHits.push(stamp);
      minuteHits.push(stamp);
    }
    function schedule() {
      var wait;
      if (timer != null || !pending.length) return;
      wait = nextDelay(now());
      timer = setTimeout(function() {
        timer = null;
        pump();
      }, wait);
    }
    function run(entry) {
      mark(now());
      Promise.resolve().then(function() {
        return fn.apply(entry.ctx, entry.args);
      }).then(entry.resolve, entry.reject).then(function() {
        pump();
      });
    }
    function pump() {
      var wait;
      prune(now());
      while (pending.length) {
        wait = nextDelay(now());
        if (wait > 0) {
          if (timer == null) timer = setTimeout(function() { timer = null; pump(); }, wait);
          return;
        }
        run(pending.shift());
      }
    }
    var wrapped = function() {
      var ctx = this;
      var args = arguments;
      var stamp = now();
      var wait = nextDelay(stamp);
      if (!wait && !pending.length) {
        mark(stamp);
        return Promise.resolve().then(function() {
          return fn.apply(ctx, args);
        });
      }
      if (!queueEnabled) return Promise.reject(new Error('Rate limit exceeded'));
      return new Promise(function(resolve, reject) {
        pending.push({ ctx: ctx, args: args, resolve: resolve, reject: reject });
        schedule();
      });
    };
    wrapped.pending = function() { return pending.length; };
    wrapped.clear = function() {
      while (pending.length) pending.shift().reject(new Error('Rate limit queue cleared'));
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      return wrapped;
    };
    return wrapped;
  }

  return {
    retry: retry,
    backoff: backoff,
    idempotencyKey: idempotencyKey,
    dedupe: dedupe,
    coalesce: coalesce,
    cancel: cancel,
    timeout: timeout,
    race: race,
    cache: cache,
    priority: priority,
    queue: queue,
    circuit: circuit,
    rateLimit: rateLimit
  };
})();
if (__bmRoot) {
  __bmRoot.BareMetal = __bmRoot.BareMetal || BareMetal;
  __bmRoot.BareMetal.Transport = BareMetal.Transport;
}
if(typeof module!=='undefined') module.exports = BareMetal.Transport;
