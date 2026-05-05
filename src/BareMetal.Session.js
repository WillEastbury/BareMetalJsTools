var __bmSessionRoot = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
var BareMetal = __bmSessionRoot.BareMetal || {};
__bmSessionRoot.BareMetal = BareMetal;
BareMetal.Session = (function(root) {
  'use strict';

  var _memoryStore = {};
  var _fingerprintCache = null;

  function own(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function isObject(value) {
    return !!value && Object.prototype.toString.call(value) === '[object Object]';
  }

  function clone(value) {
    var out;
    var key;
    var i;
    if (value == null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out[i] = clone(value[i]);
      return out;
    }
    out = {};
    for (key in value) if (own(value, key)) out[key] = clone(value[key]);
    return out;
  }

  function copy(a, b) {
    var out = {};
    var key;
    for (key in (a || {})) if (own(a, key)) out[key] = clone(a[key]);
    for (key in (b || {})) if (own(b, key)) out[key] = clone(b[key]);
    return out;
  }

  function now() {
    return Date.now();
  }

  function noop() {}

  function uniqueId(prefix) {
    return String(prefix || 'bm') + '_' + now().toString(36) + '_' + Math.random().toString(36).slice(2);
  }

  function toNumber(value, fallback) {
    var num = Number(value);
    return isFinite(num) ? num : fallback;
  }

  function safeParse(json) {
    if (!json) return null;
    try { return JSON.parse(json); } catch (_) { return null; }
  }

  function hashString(input) {
    var str = String(input == null ? '' : input);
    var hash = 2166136261;
    var i;
    for (i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
  }

  function getStorage(name) {
    try {
      if (name === 'localStorage' && typeof root.localStorage !== 'undefined') return root.localStorage;
      if (name === 'sessionStorage' && typeof root.sessionStorage !== 'undefined') return root.sessionStorage;
    } catch (_) {}
    return null;
  }

  function createStore(name, key) {
    var storage = getStorage(name);
    if (!storage || name === 'memory') {
      return {
        type: 'memory',
        read: function() {
          return clone(_memoryStore[key] || null);
        },
        write: function(value) {
          if (value == null) delete _memoryStore[key];
          else _memoryStore[key] = clone(value);
        },
        clear: function() {
          delete _memoryStore[key];
        }
      };
    }
    return {
      type: name,
      read: function() {
        var parsed = safeParse(storage.getItem(key));
        return parsed ? clone(parsed) : null;
      },
      write: function(value) {
        if (value == null) storage.removeItem(key);
        else storage.setItem(key, JSON.stringify(value));
      },
      clear: function() {
        storage.removeItem(key);
      }
    };
  }

  function listAdd(list, cb) {
    if (typeof cb !== 'function') return noop;
    list.push(cb);
    return function() {
      var i;
      for (i = list.length - 1; i >= 0; i--) {
        if (list[i] === cb) {
          list.splice(i, 1);
          break;
        }
      }
    };
  }

  function emit(list, args) {
    var copyList = list.slice();
    var i;
    for (i = 0; i < copyList.length; i++) {
      try { copyList[i].apply(null, args); } catch (_) {}
    }
  }

  function normalizeExpiry(data, ttl, previousExpiry) {
    var candidate = null;
    if (data && own(data, 'expiresAt') && data.expiresAt != null) {
      if (data.expiresAt instanceof Date) candidate = data.expiresAt.getTime();
      else if (typeof data.expiresAt === 'string') candidate = Date.parse(data.expiresAt);
      else candidate = Number(data.expiresAt);
    } else if (data && own(data, 'expiry') && data.expiry != null) {
      candidate = Number(data.expiry);
    } else if (data && own(data, 'expiresIn') && data.expiresIn != null) {
      candidate = now() + (Number(data.expiresIn) * 1000);
    } else if (ttl > 0) {
      candidate = now() + ttl;
    } else if (previousExpiry) {
      candidate = previousExpiry;
    }
    if (!candidate || !isFinite(candidate) || candidate <= 0) return 0;
    return candidate;
  }

  function prepareData(data, expiry) {
    var out = clone(data || {});
    if (expiry) out.expiresAt = expiry;
    else if (own(out, 'expiresAt') && !out.expiresAt) delete out.expiresAt;
    return out;
  }

  function isRecordExpired(record) {
    return !!(record && record.expiresAt && record.expiresAt <= now());
  }

  function normalizeRecord(record, ttl) {
    if (!record || !isObject(record)) return null;
    if (!isObject(record.data)) record.data = {};
    record.expiresAt = normalizeExpiry(record.data, ttl, record.expiresAt || 0);
    record.data = prepareData(record.data, record.expiresAt);
    record.updatedAt = toNumber(record.updatedAt, now());
    record.fingerprint = record.fingerprint || fingerprint();
    return record;
  }

  function makeRecord(data, ttl, previousExpiry) {
    var expiry = normalizeExpiry(data, ttl, previousExpiry || 0);
    return normalizeRecord({
      data: prepareData(data, expiry),
      expiresAt: expiry,
      updatedAt: now(),
      fingerprint: fingerprint()
    }, ttl);
  }

  function storageChannelKey(name) {
    return '__bm_session_channel__:' + name;
  }

  function tabSync(key) {
    var name = 'BareMetal.Session:' + (key || 'default');
    var listeners = [];
    var channel = null;
    var closed = false;
    var channelKey = storageChannelKey(name);
    var storageHandler = null;

    function notify(message) {
      emit(listeners, [clone(message)]);
    }

    if (typeof root.BroadcastChannel !== 'undefined') {
      try {
        channel = new root.BroadcastChannel(name);
        if (channel && typeof channel.addEventListener === 'function') {
          channel.addEventListener('message', function(event) {
            notify(event && event.data);
          });
        } else if (channel) {
          channel.onmessage = function(event) {
            notify(event && event.data);
          };
        }
      } catch (_) {
        channel = null;
      }
    }

    if (!channel && typeof root.addEventListener === 'function') {
      storageHandler = function(event) {
        if (!event || event.key !== channelKey || !event.newValue) return;
        notify(safeParse(event.newValue));
      };
      root.addEventListener('storage', storageHandler);
    }

    return {
      broadcast: function(message) {
        if (closed) return false;
        if (channel && typeof channel.postMessage === 'function') {
          channel.postMessage(clone(message));
          return true;
        }
        try {
          if (root.localStorage && typeof root.localStorage.setItem === 'function') {
            root.localStorage.setItem(channelKey, JSON.stringify(message));
            root.localStorage.removeItem(channelKey);
            return true;
          }
        } catch (_) {}
        return false;
      },
      onMessage: function(cb) {
        return listAdd(listeners, cb);
      },
      destroy: function() {
        closed = true;
        listeners = [];
        if (channel && typeof channel.close === 'function') channel.close();
        if (storageHandler && typeof root.removeEventListener === 'function') {
          root.removeEventListener('storage', storageHandler);
        }
      }
    };
  }

  function guard(checkFn, redirectFn) {
    return function(context) {
      var result = typeof checkFn === 'function' ? checkFn(context) : true;
      if (result && typeof result.then === 'function') {
        return result.then(function(ok) {
          if (!ok && typeof redirectFn === 'function') redirectFn(context);
          return !!ok;
        }, function() {
          if (typeof redirectFn === 'function') redirectFn(context);
          return false;
        });
      }
      if (!result && typeof redirectFn === 'function') redirectFn(context);
      return !!result;
    };
  }

  function fingerprint() {
    var nav = root.navigator || {};
    var scr = root.screen || {};
    var tz = '';
    var parts;
    if (_fingerprintCache) return _fingerprintCache;
    try { tz = root.Intl && root.Intl.DateTimeFormat ? root.Intl.DateTimeFormat().resolvedOptions().timeZone || '' : ''; }
    catch (_) { tz = ''; }
    parts = [
      nav.userAgent || '',
      nav.language || (nav.languages && nav.languages.join(',')) || '',
      nav.platform || '',
      nav.vendor || '',
      nav.hardwareConcurrency || '',
      nav.deviceMemory || '',
      scr.width || '',
      scr.height || '',
      scr.colorDepth || '',
      tz,
      (root.location && root.location.hostname) || '',
      (root.process && root.process.version) || ''
    ];
    _fingerprintCache = hashString(parts.join('|'));
    return _fingerprintCache;
  }

  function activity(opts) {
    opts = opts || {};
    var idleTimeout = Math.max(1, toNumber(opts.idleTimeout, 60000));
    var events = Array.isArray(opts.events) && opts.events.length ? opts.events.slice() : ['click', 'keydown', 'scroll', 'mousemove'];
    var listeners = [];
    var teardown = [];
    var timer = null;
    var idle = false;
    var target = root.document || root;
    var tracker;

    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function() {
        if (!idle) {
          idle = true;
          emit(listeners, [true]);
        }
      }, idleTimeout);
    }

    function touch() {
      idle = false;
      schedule();
      return tracker;
    }

    function bindEvent(eventName) {
      var handler = function() { touch(); };
      if (target && typeof target.addEventListener === 'function') {
        target.addEventListener(eventName, handler, true);
        teardown.push(function() {
          if (target && typeof target.removeEventListener === 'function') target.removeEventListener(eventName, handler, true);
        });
      }
    }

    tracker = {
      touch: touch,
      isIdle: function() {
        return idle;
      },
      onIdle: function(cb) {
        return listAdd(listeners, cb);
      },
      destroy: function() {
        var i;
        if (timer) clearTimeout(timer);
        for (i = 0; i < teardown.length; i++) teardown[i]();
        teardown = [];
        listeners = [];
      }
    };

    events.forEach(bindEvent);
    schedule();
    return tracker;
  }

  function create(opts) {
    opts = opts || {};
    var ttl = Math.max(0, toNumber(opts.ttl, 0));
    var refreshBefore = Math.max(0, toNumber(opts.refreshBefore, 0));
    var key = opts.key || 'bm_session';
    var store = createStore(opts.storage || 'memory', key);
    var expireListeners = [];
    var refreshListeners = [];
    var changeListeners = [];
    var state = normalizeRecord(store.read(), ttl);
    var expireTimer = null;
    var refreshTimer = null;
    var tab = opts.syncTabs ? tabSync(key) : null;
    var instanceId = uniqueId('session');
    var refreshPromise = null;
    var rotatePromise = null;
    var lastRefreshFn = typeof opts.refreshFn === 'function' ? opts.refreshFn : null;
    var api;

    function clearTimers() {
      if (expireTimer) clearTimeout(expireTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
      expireTimer = null;
      refreshTimer = null;
    }

    function fireChange(type, source) {
      emit(changeListeners, [api.getData(), {
        type: type,
        active: api.isActive(),
        expiry: api.getExpiry(),
        source: source || 'local'
      }]);
    }

    function persist() {
      if (state) store.write(state);
      else store.clear();
    }

    function broadcast(type, extra) {
      if (!tab) return;
      tab.broadcast(copy({
        id: instanceId,
        type: type,
        record: state ? clone(state) : null
      }, extra || {}));
    }

    function expire(meta) {
      var info = copy({
        reason: 'expired',
        source: 'local'
      }, meta || {});
      var previous = state ? clone(state.data) : null;
      clearTimers();
      state = null;
      persist();
      if (info.broadcast !== false) broadcast('destroy', { reason: info.reason });
      if (info.notify !== false) emit(expireListeners, [{ reason: info.reason, data: previous, source: info.source }]);
      if (info.change !== false) fireChange('destroy', info.source);
      return null;
    }

    function schedule() {
      var msUntilExpiry;
      var refreshDelay;
      clearTimers();
      if (!state) return;
      if (isRecordExpired(state)) {
        expire({ reason: 'expired', source: 'local' });
        return;
      }
      if (!state.expiresAt) return;
      msUntilExpiry = state.expiresAt - now();
      expireTimer = setTimeout(function() {
        expire({ reason: 'expired', source: 'local' });
      }, msUntilExpiry);
      if (refreshBefore > 0 && typeof lastRefreshFn === 'function') {
        refreshDelay = msUntilExpiry - refreshBefore;
        if (refreshDelay < 0) refreshDelay = 0;
        refreshTimer = setTimeout(function() {
          api.refresh(lastRefreshFn).catch(noop);
        }, refreshDelay);
      }
    }

    function ensureState() {
      if (!state) return null;
      if (isRecordExpired(state)) return expire({ reason: 'expired', source: 'local' });
      return state;
    }

    function applyData(data, extra, meta) {
      var previousExpiry = state && state.expiresAt ? state.expiresAt : 0;
      var merged = copy(state ? state.data : {}, data || {});
      var record = makeRecord(merged, ttl, extra && own(extra, 'expiry') ? extra.expiry : previousExpiry);
      var type = meta && meta.type ? meta.type : 'change';
      var source = meta && meta.source ? meta.source : 'local';
      state = record;
      persist();
      schedule();
      if (!meta || meta.broadcast !== false) broadcast('update', { kind: type });
      if (meta && meta.refresh) emit(refreshListeners, [api.getData(), { expiry: api.getExpiry(), source: source }]);
      fireChange(type, source);
      return api.getData();
    }

    function receiveRemote(message) {
      if (!message || message.id === instanceId) return;
      if (message.type === 'destroy') {
        expire({ reason: message.reason || 'destroyed', source: 'remote', broadcast: false, notify: true, change: true });
        return;
      }
      if (message.type === 'update' && message.record) {
        state = normalizeRecord(message.record, ttl);
        if (isRecordExpired(state)) {
          expire({ reason: 'expired', source: 'remote', broadcast: false, notify: true, change: true });
          return;
        }
        persist();
        schedule();
        fireChange(message.kind || 'change', 'remote');
      }
    }

    if (tab) tab.onMessage(receiveRemote);
    if (state && isRecordExpired(state)) state = expire({ reason: 'expired', source: 'local', notify: false, change: false, broadcast: false });
    else schedule();

    if (typeof opts.onExpire === 'function') listAdd(expireListeners, opts.onExpire);
    if (typeof opts.onRefresh === 'function') listAdd(refreshListeners, opts.onRefresh);

    api = {
      init: function(data) {
        state = makeRecord(data || {}, ttl, 0);
        persist();
        schedule();
        broadcast('update', { kind: 'init' });
        fireChange('init', 'local');
        return api;
      },
      get: function(keyName) {
        var current = ensureState();
        return current && own(current.data, keyName) ? clone(current.data[keyName]) : null;
      },
      set: function(keyName, value) {
        var current = ensureState();
        var next = current ? copy(current.data, {}) : {};
        next[keyName] = clone(value);
        applyData(next, { expiry: current && current.expiresAt ? current.expiresAt : 0 }, { type: 'set', source: 'local' });
        return api;
      },
      getData: function() {
        var current = ensureState();
        return current ? clone(current.data) : null;
      },
      destroy: function() {
        expire({ reason: 'destroyed', source: 'local' });
        return api;
      },
      isActive: function() {
        return !!ensureState();
      },
      getExpiry: function() {
        var current = ensureState();
        return current && current.expiresAt ? new Date(current.expiresAt) : null;
      },
      refresh: function(refreshFn) {
        if (typeof refreshFn === 'function') lastRefreshFn = refreshFn;
        if (typeof lastRefreshFn !== 'function') return Promise.reject(new Error('refreshFn required'));
        if (refreshPromise) return refreshPromise;
        refreshPromise = Promise.resolve(lastRefreshFn(clone(state ? state.data : {}))).then(function(next) {
          var patch = clone(next || {});
          var expiry = normalizeExpiry(patch, ttl, state && state.expiresAt ? state.expiresAt : 0);
          if (expiry && !own(patch, 'expiresAt')) patch.expiresAt = expiry;
          return applyData(patch, { expiry: expiry }, { type: 'refresh', source: 'local', refresh: true });
        }).finally(function() {
          refreshPromise = null;
        });
        return refreshPromise;
      },
      rotate: function(rotateOpts) {
        var run;
        rotateOpts = rotateOpts || {};
        if (rotateOpts.lockout !== false && rotatePromise) return rotatePromise;
        run = api.refresh(rotateOpts.refreshFn);
        if (rotateOpts.lockout !== false) {
          rotatePromise = run.finally(function() {
            rotatePromise = null;
          });
          return rotatePromise;
        }
        return run;
      },
      onExpire: function(cb) {
        return listAdd(expireListeners, cb);
      },
      onRefresh: function(cb) {
        return listAdd(refreshListeners, cb);
      },
      onChange: function(cb) {
        return listAdd(changeListeners, cb);
      },
      extend: function(extraTtl) {
        var current = ensureState();
        var base;
        var expiry;
        if (!current) return api;
        base = current.expiresAt && current.expiresAt > now() ? current.expiresAt : now();
        expiry = base + Math.max(0, toNumber(extraTtl, 0));
        applyData(copy(current.data, { expiresAt: expiry }), { expiry: expiry }, { type: 'extend', source: 'local' });
        return api;
      }
    };

    return api;
  }

  return {
    create: create,
    tabSync: tabSync,
    guard: guard,
    fingerprint: fingerprint,
    activity: activity
  };
})(__bmSessionRoot);

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Session;
else if (typeof exports !== 'undefined') exports.Session = BareMetal.Session;
