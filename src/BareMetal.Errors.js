var root = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
root.BareMetal = root.BareMetal || {};
var BareMetal = root.BareMetal;

BareMetal.Errors = (function(){
  'use strict';

  var registry = {};
  var categories = {
    transient: true,
    permanent: true,
    auth: true,
    validation: true,
    network: true,
    timeout: true,
    unknown: true
  };

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function lower(v) { return String(v == null ? '' : v).toLowerCase(); }
  function isObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function isPromiseLike(v) { return !!v && typeof v.then === 'function'; }
  function sliceArgs(args) { return Array.prototype.slice.call(args || []); }
  function copy(a, b) {
    var out = {}, k;
    for (k in (a || {})) if (own(a, k)) out[k] = a[k];
    for (k in (b || {})) if (own(b, k)) out[k] = b[k];
    return out;
  }
  function now() { return new Date().toISOString(); }
  function normalizeCategory(category) {
    category = lower(category);
    return own(categories, category) ? category : 'unknown';
  }
  function defaultRetryable(category) {
    category = normalizeCategory(category);
    return category === 'transient' || category === 'network' || category === 'timeout';
  }
  function defaultUserMessage(category) {
    category = normalizeCategory(category);
    if (category === 'auth') return 'Please sign in and try again.';
    if (category === 'validation') return 'Please check your input and try again.';
    if (category === 'network') return 'A network error occurred. Please try again.';
    if (category === 'timeout') return 'The operation timed out. Please try again.';
    if (category === 'transient') return 'A temporary error occurred. Please try again.';
    return 'Something went wrong.';
  }
  function hasOwnValue(obj, key) {
    return !!obj && own(obj, key) && obj[key] !== void 0;
  }
  function lookupDefaults(code) {
    return code != null && own(registry, String(code)) ? copy({}, registry[String(code)]) : null;
  }
  function statusInfo(status) {
    status = Number(status);
    if (isNaN(status)) return null;
    if (status === 0) return { category: 'network', retryable: true, code: 'HTTP_0' };
    if (status === 400 || status === 422) return { category: 'validation', retryable: false, code: 'HTTP_' + status };
    if (status === 401 || status === 403) return { category: 'auth', retryable: false, code: 'HTTP_' + status };
    if (status === 404 || status === 410) return { category: 'permanent', retryable: false, code: 'HTTP_' + status };
    if (status === 408) return { category: 'timeout', retryable: true, code: 'HTTP_408' };
    if (status === 425 || status === 429) return { category: 'transient', retryable: true, code: 'HTTP_' + status };
    if (status >= 500) return { category: status === 504 ? 'timeout' : 'transient', retryable: true, code: 'HTTP_' + status };
    if (status >= 400) return { category: 'permanent', retryable: false, code: 'HTTP_' + status };
    return null;
  }
  function domInfo(name, message) {
    var n = lower(name);
    var m = lower(message);
    if (!n && !m) return null;
    if (n === 'timeouterror' || m.indexOf('timed out') > -1 || m.indexOf('timeout') > -1) return { category: 'timeout', retryable: true, code: 'TIMEOUT' };
    if (n === 'networkerror' || m.indexOf('failed to fetch') > -1 || m.indexOf('network') > -1 || m.indexOf('offline') > -1 || /econn|enotfound|eai_again|socket|dns/.test(m)) return { category: 'network', retryable: true, code: 'NETWORK_ERROR' };
    if (n === 'aborterror') return { category: 'timeout', retryable: true, code: 'ABORTED' };
    if (n === 'securityerror' || n === 'notallowederror') return { category: 'auth', retryable: false, code: 'AUTH_ERROR' };
    if (n === 'dataerror' || n === 'invalidstateerror' || n === 'syntaxerror' || n === 'typeerror') return { category: 'validation', retryable: false, code: 'VALIDATION_ERROR' };
    return null;
  }
  function messageInfo(message) {
    var m = lower(message);
    if (!m) return null;
    if (m.indexOf('timed out') > -1 || m.indexOf('timeout') > -1) return { category: 'timeout', retryable: true, code: 'TIMEOUT' };
    if (/failed to fetch|network|offline|econn|socket|dns|enotfound|eai_again|connection reset|connection refused/.test(m)) return { category: 'network', retryable: true, code: 'NETWORK_ERROR' };
    if (/unauthori[sz]ed|forbidden|not authenticated|access denied|token expired|authentication/.test(m)) return { category: 'auth', retryable: false, code: 'AUTH_ERROR' };
    if (/invalid|validation|required|malformed|bad request|unprocessable/.test(m)) return { category: 'validation', retryable: false, code: 'VALIDATION_ERROR' };
    if (/rate limit|too many requests|temporar|try again|unavailable|busy|overload|retry later/.test(m)) return { category: 'transient', retryable: true, code: 'TRANSIENT_ERROR' };
    if (/not found|missing|does not exist|unsupported|gone/.test(m)) return { category: 'permanent', retryable: false, code: 'PERMANENT_ERROR' };
    return null;
  }
  function BareMetalError(code, message, opts) {
    opts = opts || {};
    this.name = opts.name || 'BareMetalError';
    this.code = code == null || code === '' ? 'UNKNOWN_ERROR' : String(code);
    this.message = message == null || message === '' ? 'An unexpected error occurred.' : String(message);
    this.category = normalizeCategory(opts.category);
    this.retryable = hasOwnValue(opts, 'retryable') ? !!opts.retryable : defaultRetryable(this.category);
    this.cause = hasOwnValue(opts, 'cause') ? opts.cause : null;
    this.data = hasOwnValue(opts, 'data') ? opts.data : null;
    this.userMessage = hasOwnValue(opts, 'userMessage') ? opts.userMessage : null;
    this.statusCode = hasOwnValue(opts, 'statusCode') ? opts.statusCode : null;
    this.timestamp = opts.timestamp || now();
    if (typeof Error.captureStackTrace === 'function') Error.captureStackTrace(this, BareMetalError);
    else this.stack = (new Error(this.message)).stack;
    if (opts.stack) this.stack = String(opts.stack);
    if (Array.isArray(opts.errors)) this.errors = opts.errors.slice();
  }
  BareMetalError.prototype = Object.create(Error.prototype);
  BareMetalError.prototype.constructor = BareMetalError;
  BareMetalError.prototype.toJSON = function() { return toJSON(this); };

  function normalizeCause(cause) {
    if (cause == null) return null;
    if (cause instanceof BareMetalError) return cause;
    if (isObject(cause) && hasOwnValue(cause, 'timestamp') && hasOwnValue(cause, 'message') && (hasOwnValue(cause, 'code') || hasOwnValue(cause, 'category'))) return fromJSON(cause);
    return ensureError(cause);
  }
  function create(code, message, opts) {
    var defaults = lookupDefaults(code) || {};
    var settings = copy(defaults, opts || {});
    var statusCode = hasOwnValue(settings, 'statusCode') ? settings.statusCode : null;
    var seed = {
      code: code,
      message: message != null ? message : defaults.message,
      category: settings.category,
      retryable: settings.retryable,
      statusCode: statusCode
    };
    var inferred = classify(seed);
    return new BareMetalError(code != null && code !== '' ? code : inferred.code, seed.message, {
      name: settings.name,
      category: hasOwnValue(settings, 'category') ? settings.category : inferred.category,
      retryable: hasOwnValue(settings, 'retryable') ? settings.retryable : inferred.retryable,
      cause: hasOwnValue(settings, 'cause') ? normalizeCause(settings.cause) : null,
      data: hasOwnValue(settings, 'data') ? settings.data : null,
      userMessage: hasOwnValue(settings, 'userMessage') ? settings.userMessage : defaults.userMessage,
      statusCode: statusCode,
      timestamp: settings.timestamp,
      stack: settings.stack,
      errors: settings.errors
    });
  }
  function rebuild(err, overrides) {
    var base = ensureError(err);
    var merged = copy({
      name: base.name,
      category: base.category,
      retryable: base.retryable,
      cause: base.cause,
      data: base.data,
      userMessage: base.userMessage,
      statusCode: base.statusCode,
      timestamp: base.timestamp,
      stack: base.stack,
      errors: base.errors
    }, overrides || {});
    return create(hasOwnValue(merged, 'code') ? merged.code : base.code, hasOwnValue(merged, 'message') ? merged.message : base.message, merged);
  }
  function ensureError(err) {
    var info, defaults, statusCode, data, out;
    if (err instanceof BareMetalError) return err;
    info = classify(err);
    defaults = err && err.code != null ? lookupDefaults(err.code) : null;
    statusCode = err && (hasOwnValue(err, 'statusCode') || hasOwnValue(err, 'status')) ? (hasOwnValue(err, 'statusCode') ? err.statusCode : err.status) : null;
    data = isObject(err) && hasOwnValue(err, 'data') ? err.data : null;
    if (!data && isObject(err) && (hasOwnValue(err, 'status') || hasOwnValue(err, 'statusCode'))) data = { status: statusCode };
    out = create(err && err.code != null ? err.code : info.code, err && err.message != null ? err.message : String(err == null ? 'An unexpected error occurred.' : err), {
      name: err && err.name ? err.name : 'BareMetalError',
      category: err && hasOwnValue(err, 'category') ? err.category : (defaults && hasOwnValue(defaults, 'category') ? defaults.category : info.category),
      retryable: err && hasOwnValue(err, 'retryable') ? err.retryable : (defaults && hasOwnValue(defaults, 'retryable') ? defaults.retryable : info.retryable),
      cause: err && hasOwnValue(err, 'cause') ? err.cause : null,
      data: data,
      userMessage: err && hasOwnValue(err, 'userMessage') ? err.userMessage : (defaults && hasOwnValue(defaults, 'userMessage') ? defaults.userMessage : null),
      statusCode: statusCode,
      timestamp: err && err.timestamp ? err.timestamp : null,
      stack: err && err.stack ? err.stack : null,
      errors: err && Array.isArray(err.errors) ? err.errors : null
    });
    return out;
  }
  function classify(err) {
    var code = null;
    var category = null;
    var retryable;
    var statusCode = null;
    var defaults = null;
    var status = null;
    var byStatus = null;
    var byDom = null;
    var byMessage = null;
    if (typeof err === 'number') {
      status = err;
      byStatus = statusInfo(status);
    } else if (typeof err === 'string') {
      byMessage = messageInfo(err);
    } else if (err) {
      if (hasOwnValue(err, 'code') && err.code != null && err.code !== '') {
        code = String(err.code);
        defaults = lookupDefaults(code);
      }
      if (hasOwnValue(err, 'statusCode')) statusCode = err.statusCode;
      else if (hasOwnValue(err, 'status')) statusCode = err.status;
      if (statusCode != null) {
        status = statusCode;
        byStatus = statusInfo(statusCode);
      }
      if (hasOwnValue(err, 'category')) category = normalizeCategory(err.category);
      if (hasOwnValue(err, 'retryable')) retryable = !!err.retryable;
      if (!category && defaults && hasOwnValue(defaults, 'category')) category = normalizeCategory(defaults.category);
      if (retryable === void 0 && defaults && hasOwnValue(defaults, 'retryable')) retryable = !!defaults.retryable;
      byDom = domInfo(err.name, err.message);
      byMessage = messageInfo(err.message);
    }
    category = category || (byStatus && byStatus.category) || (byDom && byDom.category) || (byMessage && byMessage.category) || 'unknown';
    if (retryable === void 0) retryable = (byStatus && byStatus.retryable);
    if (retryable === void 0) retryable = (byDom && byDom.retryable);
    if (retryable === void 0) retryable = (byMessage && byMessage.retryable);
    if (retryable === void 0) retryable = defaultRetryable(category);
    code = code || (byStatus && byStatus.code) || (byDom && byDom.code) || (byMessage && byMessage.code) || (status != null ? 'HTTP_' + status : 'UNKNOWN_ERROR');
    return { category: normalizeCategory(category), retryable: !!retryable, code: String(code) };
  }
  function isRetryable(err) { return !!classify(err).retryable; }
  function isTransient(err) {
    var category = classify(err).category;
    return category === 'transient' || category === 'network' || category === 'timeout';
  }
  function cloneCauseChain(err) {
    var base = normalizeCause(err);
    if (!base) return null;
    return rebuild(base, { cause: base.cause ? cloneCauseChain(base.cause) : null });
  }
  function chain(err, cause) {
    var wrapped = rebuild(err);
    var extra = normalizeCause(cause);
    var node;
    var seen = [];
    if (!wrapped.cause) {
      wrapped.cause = extra;
      return wrapped;
    }
    wrapped.cause = cloneCauseChain(wrapped.cause);
    node = wrapped.cause;
    while (node && node.cause && seen.indexOf(node) === -1) {
      seen.push(node);
      node = node.cause;
    }
    if (node && seen.indexOf(node) === -1) node.cause = extra;
    return wrapped;
  }
  function getChain(err) {
    var out = [];
    var node = err;
    var seen = [];
    while (node && seen.indexOf(node) === -1) {
      seen.push(node);
      out.push(ensureError(node));
      node = node.cause;
    }
    out.reverse();
    return out;
  }
  function toUserSafe(err) {
    var wrapped = ensureError(err);
    return {
      message: wrapped.userMessage || defaultUserMessage(wrapped.category),
      code: wrapped.code
    };
  }
  function serialize(value, seen) {
    var out, i, k;
    if (value == null) return value;
    if (value instanceof BareMetalError || value instanceof Error) return toJSON(value, seen);
    if (Array.isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(serialize(value[i], seen));
      return out;
    }
    if (isObject(value)) {
      if (seen.indexOf(value) > -1) return '[Circular]';
      seen.push(value);
      out = {};
      for (k in value) if (own(value, k)) out[k] = serialize(value[k], seen);
      seen.pop();
      return out;
    }
    return value;
  }
  function toJSON(err, seen) {
    var trail = seen || [];
    var wrapped = ensureError(err);
    var out;
    if (trail.indexOf(wrapped) > -1) return null;
    trail.push(wrapped);
    out = {
      code: wrapped.code,
      message: wrapped.message,
      category: wrapped.category,
      retryable: !!wrapped.retryable,
      data: serialize(wrapped.data, trail),
      cause: wrapped.cause ? toJSON(wrapped.cause, trail) : null,
      timestamp: wrapped.timestamp
    };
    trail.pop();
    return out;
  }
  function fromJSON(obj) {
    if (!isObject(obj)) return create('UNKNOWN_ERROR', 'An unexpected error occurred.');
    return create(obj.code, obj.message, {
      category: obj.category,
      retryable: obj.retryable,
      data: obj.data,
      cause: obj.cause ? fromJSON(obj.cause) : null,
      timestamp: obj.timestamp
    });
  }
  function reclassify(err, opts) {
    var wrapped = ensureError(err);
    return rebuild(wrapped, {
      code: opts && hasOwnValue(opts, 'code') ? opts.code : wrapped.code,
      category: opts && hasOwnValue(opts, 'category') ? opts.category : wrapped.category
    });
  }
  function wrap(fn, opts) {
    var settings = opts || {};
    return function() {
      var ctx = this;
      var args = arguments;
      function onError(err) {
        var wrapped = reclassify(err, settings);
        if (settings.rethrow === false) return wrapped;
        throw wrapped;
      }
      try {
        var result = fn.apply(ctx, args);
        return isPromiseLike(result) ? result.catch(onError) : result;
      } catch (err) {
        return onError(err);
      }
    };
  }
  function assert(condition, code, message) {
    if (condition) return condition;
    throw create(code || 'ASSERTION_FAILED', message || 'Assertion failed.', { category: 'validation', retryable: false });
  }
  function register(code, defaults) {
    if (code == null || code === '') return null;
    registry[String(code)] = copy({}, defaults || {});
    return lookupDefaults(code);
  }
  function match(err, handlers) {
    var wrapped = ensureError(err);
    var info = classify(wrapped);
    var fn = handlers && typeof handlers[wrapped.code] === 'function' ? handlers[wrapped.code]
      : handlers && typeof handlers[info.category] === 'function' ? handlers[info.category]
      : handlers && typeof handlers.default === 'function' ? handlers.default
      : null;
    return fn ? fn(wrapped, info) : void 0;
  }
  function aggregateCategory(list) {
    var i, info, cat;
    for (i = 0; i < list.length; i++) {
      info = classify(list[i]);
      cat = info.category;
      if (cat === 'timeout') return 'timeout';
      if (cat === 'network') return 'network';
    }
    for (i = 0; i < list.length; i++) {
      info = classify(list[i]);
      cat = info.category;
      if (cat === 'transient') return 'transient';
      if (cat === 'auth') return 'auth';
      if (cat === 'validation') return 'validation';
      if (cat === 'permanent') return 'permanent';
    }
    return 'unknown';
  }
  function aggregate(errors) {
    var list = Array.isArray(errors) ? errors.filter(function(v) { return !!v; }).map(ensureError) : [];
    var retryable = false;
    var i;
    var out;
    for (i = 0; i < list.length; i++) if (isRetryable(list[i])) retryable = true;
    out = create('AGGREGATE_ERROR', list.length ? 'Multiple errors occurred.' : 'No errors supplied.', {
      category: aggregateCategory(list),
      retryable: retryable,
      cause: list.length ? list[list.length - 1] : null,
      data: { errors: list.map(function(err) { return toJSON(err); }) },
      errors: list
    });
    out.errors = list.slice();
    return out;
  }
  function runFallback(fallback, ctx, args, err, info) {
    if (typeof fallback === 'function') return fallback.apply(ctx, [err, info].concat(args));
    return fallback;
  }
  function boundary(fn, fallback) {
    return function() {
      var ctx = this;
      var args = sliceArgs(arguments);
      function recover(err) {
        var wrapped = ensureError(err);
        var info = classify(wrapped);
        if (info.retryable) {
          try {
            var retried = fn.apply(ctx, args);
            if (isPromiseLike(retried)) return retried.catch(function(lastErr) {
              var lastWrapped = ensureError(lastErr);
              return runFallback(fallback, ctx, args, lastWrapped, classify(lastWrapped));
            });
            return retried;
          } catch (lastErr) {
            var retriedWrapped = ensureError(lastErr);
            return runFallback(fallback, ctx, args, retriedWrapped, classify(retriedWrapped));
          }
        }
        return runFallback(fallback, ctx, args, wrapped, info);
      }
      try {
        var result = fn.apply(ctx, args);
        return isPromiseLike(result) ? result.catch(recover) : result;
      } catch (err) {
        return recover(err);
      }
    };
  }

  return {
    BareMetalError: BareMetalError,
    create: create,
    classify: classify,
    isRetryable: isRetryable,
    isTransient: isTransient,
    chain: chain,
    getChain: getChain,
    toUserSafe: toUserSafe,
    toJSON: toJSON,
    fromJSON: fromJSON,
    wrap: wrap,
    assert: assert,
    codes: {
      register: register,
      lookup: lookupDefaults
    },
    match: match,
    aggregate: aggregate,
    boundary: boundary
  };
})();

if (typeof module !== 'undefined') module.exports = BareMetal.Errors;
