var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.Validate = (function () {
  'use strict';

  var x = {};
  var b = {
    required: 1,
    type: 1,
    min: 1,
    max: 1,
    minLength: 1,
    maxLength: 1,
    pattern: 1,
    email: 1,
    url: 1,
    custom: 1,
    schema: 1,
    items: 1
  };

  function o(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function m(v) { return v == null || (typeof v === 'string' && v.trim() === ''); }
  function e(a, p, c, s) { a.push({ path: p, code: c, message: s }); }
  function t(r, v) {
    if (r === 'array') return Array.isArray(v);
    if (r === 'object') return o(v);
    if (r === 'number') return typeof v === 'number' && isFinite(v);
    return typeof v === r;
  }
  function g(r) {
    if (r instanceof RegExp) {
      try { return new RegExp(r.source, r.flags.replace(/g/g, '')); } catch (_) { return null; }
    }
    if (typeof r === 'string') {
      try { return new RegExp(r); } catch (_) { return null; }
    }
    return null;
  }
  function h(v) { return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function u(v) {
    if (typeof v !== 'string' || !v) return false;
    try { new URL(v); return true; } catch (_) { return false; }
  }

  function p(r, v, pth, root, errs) {
    var k, n, f, z;
    if (!o(r)) return;
    if (r.required && m(v)) {
      e(errs, pth, 'required', 'This field is required.');
      return;
    }
    if (m(v)) return;
    if (r.type && !t(r.type, v)) {
      e(errs, pth, 'type', 'Expected ' + r.type + '.');
      return;
    }
    if (r.min != null && typeof v === 'number' && v < r.min) e(errs, pth, 'min', 'Must be at least ' + r.min + '.');
    if (r.max != null && typeof v === 'number' && v > r.max) e(errs, pth, 'max', 'Must be at most ' + r.max + '.');
    if (r.minLength != null && typeof v === 'string' && v.length < r.minLength) e(errs, pth, 'minLength', 'Must be at least ' + r.minLength + ' characters.');
    if (r.maxLength != null && typeof v === 'string' && v.length > r.maxLength) e(errs, pth, 'maxLength', 'Must be at most ' + r.maxLength + ' characters.');
    if (r.pattern != null && typeof v === 'string') {
      z = g(r.pattern);
      if (z && !z.test(v)) e(errs, pth, 'pattern', 'Invalid format.');
    }
    if (r.email && !h(v)) e(errs, pth, 'email', 'Invalid email address.');
    if (r.url && !u(v)) e(errs, pth, 'url', 'Invalid URL.');
    if (typeof r.custom === 'function') {
      try {
        n = r.custom(v, root, pth, r);
        if (typeof n === 'string' && n) e(errs, pth, 'custom', n);
      } catch (_) {}
    }
    if (r.type === 'object' && r.schema && o(v)) {
      for (k in r.schema) {
        if (Object.prototype.hasOwnProperty.call(r.schema, k)) p(r.schema[k], v ? v[k] : void 0, pth ? pth + '.' + k : k, root, errs);
      }
    }
    if (r.type === 'array' && Array.isArray(v) && r.items) {
      for (k = 0; k < v.length; k++) p(r.items, v[k], pth + '[' + k + ']', root, errs);
    }
    for (k in x) {
      if (!Object.prototype.hasOwnProperty.call(x, k) || b[k] || !Object.prototype.hasOwnProperty.call(r, k)) continue;
      try {
        f = x[k](v, r[k], root, pth, r);
        if (typeof f === 'string' && f) e(errs, pth, k, f);
      } catch (_) {}
    }
  }

  /** Validate data against a schema. */
  function validate(schema, data) {
    var errs = [];
    var s = o(schema) ? schema : {};
    var d = o(data) ? data : {};
    var k;
    for (k in s) if (Object.prototype.hasOwnProperty.call(s, k)) p(s[k], d[k], k, d, errs);
    return { valid: !errs.length, errors: errs };
  }

  /** Register a named validation rule. */
  function addRule(name, fn) {
    if (typeof name !== 'string' || !name || typeof fn !== 'function' || b[name]) return function () {};
    x[name] = fn;
    return function () { delete x[name]; };
  }

  return { validate: validate, addRule: addRule };
})();