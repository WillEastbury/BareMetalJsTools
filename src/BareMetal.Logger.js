var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.Logger = (function () {
  'use strict';

  var x = { debug: 0, info: 1, warn: 2, error: 3 };

  function o(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function n(v) {
    if (typeof v === 'number') return v >= 0 && v <= 3 ? v : 1;
    return Object.prototype.hasOwnProperty.call(x, v) ? x[v] : 1;
  }
  function m(a, b) {
    var c = Object.assign({}, o(a) ? a : {});
    if (o(b)) Object.assign(c, b);
    return c;
  }
  function s(v) {
    var seen = [];
    try {
      return JSON.stringify(v, function (_, val) {
        if (val instanceof Error) return { name: val.name, message: val.message, stack: val.stack };
        if (val && typeof val === 'object') {
          if (seen.indexOf(val) >= 0) return '[Circular]';
          seen.push(val);
        }
        return val;
      });
    } catch (_) {
      return '"[Unserializable]"';
    }
  }
  function cTransport(rec) {
    var c = typeof console === 'object' && console ? console : null;
    var f = rec.level === 'error' ? 'error' : rec.level === 'warn' ? 'warn' : 'log';
    var a = ['[' + rec.ts + '] ' + rec.level.toUpperCase() + ' ' + rec.msg];
    if (rec.context && Object.keys(rec.context).length) a.push(rec.context);
    if (rec.data !== void 0) a.push(rec.data);
    try {
      if (c && typeof c[f] === 'function') c[f].apply(c, a);
    } catch (_) {}
  }
  function beacon(url) {
    var q = [];
    var t = 0;
    function flush() {
      var out;
      if (!q.length) return;
      out = q.splice(0);
      if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function' || typeof url !== 'string' || !url) return;
      try { navigator.sendBeacon(url, s(out)); } catch (_) {}
    }
    function kick() {
      if (t || typeof setTimeout !== 'function') return;
      t = setTimeout(function () {
        t = 0;
        flush();
      }, 1000);
    }
    function onVis() {
      if (typeof document === 'undefined' || document.visibilityState === 'hidden') flush();
    }
    try {
      if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', onVis);
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('pagehide', flush);
        window.addEventListener('unload', flush);
      }
    } catch (_) {}
    return function (rec) {
      q.push({ level: rec.level, msg: rec.msg, data: rec.data, context: rec.context, ts: rec.ts });
      if (q.length >= 10) flush();
      else kick();
    };
  }

  /** Create a structured logger instance. */
  function create(opts) {
    var z = o(opts) ? opts : {};
    var l = n(z.level);
    var c = m(z.context);
    var p = Array.isArray(z.transports)
      ? z.transports.filter(function (fn) { return typeof fn === 'function'; })
      : typeof z.transports === 'function'
        ? [z.transports]
        : [cTransport];

    function w(level, msg, data) {
      var lv = n(level);
      var rec;
      var i0;
      if (lv < l) return;
      rec = {
        level: typeof level === 'string' ? level : 'info',
        msg: msg == null ? '' : String(msg),
        data: data,
        context: c,
        ts: new Date().toISOString()
      };
      for (i0 = 0; i0 < p.length; i0++) {
        try { p[i0](rec); } catch (_) {}
      }
    }

    /** Log a debug message. */
    function debug(msg, data) { w('debug', msg, data); }

    /** Log an info message. */
    function info(msg, data) { w('info', msg, data); }

    /** Log a warning message. */
    function warn(msg, data) { w('warn', msg, data); }

    /** Log an error message. */
    function error(msg, data) { w('error', msg, data); }

    /** Create a child logger with merged context. */
    function child(extraContext) {
      return create({ level: l, context: m(c, extraContext), transports: p.slice() });
    }

    /** Change the minimum log level. */
    function setLevel(level) {
      l = n(level);
      return l;
    }

    /** Add a transport function. */
    function addTransport(fn) {
      if (typeof fn !== 'function') return function () {};
      p.push(fn);
      return function () {
        var i0 = p.indexOf(fn);
        if (i0 >= 0) p.splice(i0, 1);
      };
    }

    return {
      debug: debug,
      info: info,
      warn: warn,
      error: error,
      child: child,
      setLevel: setLevel,
      addTransport: addTransport
    };
  }

  return {
    create: create,
    console: cTransport,
    beacon: beacon
  };
})();