var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.I18n = (function () {
  'use strict';

  var t = {};
  var s = [];
  var c = 'en';
  var d = 'en';
  var f = 'en';
  var p = {};
  var r = /^(ar|fa|he|iw|ps|ur|yi|ckb|sd)(-|$)/i;

  function o(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function a(v) { return typeof v === 'string' && v ? v : 'en'; }
  function h(m, out, pre) {
    var k, v, n;
    out = out || {};
    if (!o(m)) return out;
    for (k in m) {
      if (!Object.prototype.hasOwnProperty.call(m, k)) continue;
      v = m[k];
      n = pre ? pre + '.' + k : k;
      if (o(v)) h(v, out, n);
      else if (v != null) out[n] = String(v);
    }
    return out;
  }
  function u(loc) {
    loc = a(loc);
    if (!t[loc]) t[loc] = {};
    return t[loc];
  }
  function g(loc, key) {
    var m = u(loc);
    return Object.prototype.hasOwnProperty.call(m, key) ? m[key] : null;
  }
  function y(loc) {
    if (!p[loc]) {
      try {
        p[loc] = typeof Intl !== 'undefined' && Intl.PluralRules
          ? new Intl.PluralRules(loc)
          : { select: function (n) { return Number(n) === 1 ? 'one' : 'other'; } };
      } catch (_) {
        p[loc] = { select: function (n) { return Number(n) === 1 ? 'one' : 'other'; } };
      }
    }
    return p[loc];
  }
  function x(loc) {
    var v = [];
    var seen = {};
    function add(code) {
      code = a(code);
      if (!seen[code]) {
        seen[code] = 1;
        v.push(code);
      }
    }
    loc = a(loc || c);
    add(loc);
    while (loc.indexOf('-') > 0) {
      loc = loc.slice(0, loc.lastIndexOf('-'));
      add(loc);
    }
    add(f);
    add(d);
    return v;
  }
  function i(str, params) {
    return String(str).replace(/\{([^{}]+)\}/g, function (_, key) {
      return params && Object.prototype.hasOwnProperty.call(params, key) ? String(params[key] == null ? '' : params[key]) : '';
    });
  }
  function n() {
    var i0;
    for (i0 = 0; i0 < s.length; i0++) {
      try { s[i0](c); } catch (_) {}
    }
  }

  /** Set the active locale code. */
  function setLocale(code) {
    code = a(code);
    if (code !== c) {
      c = code;
      n();
    }
    return c;
  }

  /** Get the active locale code. */
  function getLocale() {
    return c;
  }

  /** Configure default and fallback locales. */
  function configure(opts) {
    if (o(opts)) {
      d = a(opts.defaultLocale || d);
      f = a(opts.fallbackLocale || f);
    }
    return { defaultLocale: d, fallbackLocale: f };
  }

  /** Merge messages into a locale table. */
  function addMessages(locale, messages) {
    var m = h(messages);
    var dst = u(locale);
    var k;
    for (k in m) if (Object.prototype.hasOwnProperty.call(m, k)) dst[k] = m[k];
    return dst;
  }

  /** Translate a key with interpolation and plural support. */
  function tFn(key, params) {
    var locs = x();
    var v = null;
    var i0, count, cat;
    if (typeof key !== 'string' || !key) return '';
    if (params && params.count != null) {
      count = Number(params.count);
      for (i0 = 0; i0 < locs.length && v == null; i0++) {
        if (count === 0) v = g(locs[i0], key + '_zero');
        if (v == null) {
          cat = y(locs[i0]).select(isFinite(count) ? count : 0);
          v = g(locs[i0], key + '_' + cat) || g(locs[i0], key + '_other');
        }
      }
    }
    for (i0 = 0; i0 < locs.length && v == null; i0++) v = g(locs[i0], key);
    return v == null ? key : i(v, params);
  }

  /** Fetch JSON messages and merge them into a locale table. */
  function loadMessages(locale, url) {
    if (typeof fetch !== 'function' || typeof url !== 'string' || !url) return Promise.resolve(u(locale));
    return fetch(url)
      .then(function (res) { return res && res.ok && typeof res.json === 'function' ? res.json() : null; })
      .catch(function () { return null; })
      .then(function (data) { return addMessages(locale, data); });
  }

  /** Detect whether a locale is right-to-left. */
  function isRTL(locale) {
    locale = a(locale || c);
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
        var info = new Intl.Locale(locale).textInfo;
        if (info && typeof info.direction === 'string') return info.direction === 'rtl';
      }
    } catch (_) {}
    return r.test(locale);
  }

  /** Subscribe to locale changes. */
  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    s.push(fn);
    return function () {
      var i0 = s.indexOf(fn);
      if (i0 >= 0) s.splice(i0, 1);
    };
  }

  return {
    setLocale: setLocale,
    getLocale: getLocale,
    addMessages: addMessages,
    t: tFn,
    loadMessages: loadMessages,
    isRTL: isRTL,
    subscribe: subscribe,
    configure: configure
  };
})();