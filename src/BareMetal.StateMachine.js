var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.StateMachine = (function () {
  'use strict';

  function o(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function s(v) {
    if (typeof v === 'string' && v) return { type: v };
    return o(v) && typeof v.type === 'string' && v.type ? v : null;
  }
  function r(fn, a, b) {
    try { return fn(a, b); } catch (_) { return void 0; }
  }
  function n(list, payload) {
    var i0;
    for (i0 = 0; i0 < list.length; i0++) {
      try { list[i0](payload); } catch (_) {}
    }
  }

  /** Create a finite state machine instance. */
  function create(config) {
    var z = o(config) ? config : {};
    var m = o(z.states) ? z.states : {};
    var k = Object.keys(m);
    var q = typeof z.initial === 'string' && m[z.initial] ? z.initial : (k[0] || '');
    var c = o(z.context) ? Object.assign({}, z.context) : {};
    var l = [];

    function d() { return m[q] || {}; }
    function a(fn, ev) {
      var nx;
      if (typeof fn !== 'function') return;
      nx = r(fn, c, ev);
      if (o(nx)) c = nx;
    }
    function b(fn, ev) {
      if (typeof fn === 'function') r(fn, c, ev);
    }
    function p(ev) {
      n(l, { state: q, context: c, event: ev });
    }

    if (q) b(d().entry, { type: '@@init' });

    /** Send an event to the machine. */
    function send(event) {
      var ev = s(event);
      var cur, tr;
      if (!ev) return { changed: false, state: q, context: c };
      cur = d();
      tr = cur.on && cur.on[ev.type];
      if (typeof tr === 'string') tr = { target: tr };
      if (!o(tr) || typeof tr.target !== 'string' || !m[tr.target]) return { changed: false, state: q, context: c };
      if (typeof tr.guard === 'function' && !r(tr.guard, c, ev)) return { changed: false, state: q, context: c };
      b(cur.exit, ev);
      a(tr.action, ev);
      q = tr.target;
      b(d().entry, ev);
      p(ev);
      return { changed: true, state: q, context: c };
    }

    /** Get the current state name. */
    function getState() { return q; }

    /** Get the current context object. */
    function getContext() { return c; }

    /** Test whether the machine matches a state. */
    function matches(stateName) { return stateName === q; }

    /** Subscribe to state changes. */
    function subscribe(fn) {
      if (typeof fn !== 'function') return function () {};
      l.push(fn);
      return function () {
        var i0 = l.indexOf(fn);
        if (i0 >= 0) l.splice(i0, 1);
      };
    }

    return {
      send: send,
      getState: getState,
      getContext: getContext,
      matches: matches,
      subscribe: subscribe
    };
  }

  return { create: create };
})();