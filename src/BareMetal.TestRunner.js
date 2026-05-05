var window = typeof globalThis !== 'undefined' ? (globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;
BareMetal.TestRunner = (function () {
  'use strict';

  var g = typeof globalThis !== 'undefined' ? globalThis : window;
  var root = makeSuite('', null);
  var cur = root;

  function makeSuite(name, parent) {
    return { name: name || '', parent: parent, suites: [], tests: [], ba: [], aa: [], be: [], ae: [] };
  }

  function noop() {}

  function push(arr, fn) {
    if (typeof fn === 'function') arr.push(fn);
  }

  function call(fn, ctx) {
    return Promise.resolve().then(function () {
      return typeof fn === 'function' ? fn.call(ctx) : undefined;
    });
  }

  function fail(msg) {
    var e = new Error(msg || 'Assertion failed');
    e.name = 'AssertionError';
    throw e;
  }

  function eq(a, b, s) {
    var ak;
    var bk;
    var i;
    if (Object.is(a, b)) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;
    s = s || new WeakMap();
    if (s.get(a) === b) return true;
    s.set(a, b);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (i = 0; i < a.length; i++) if (!eq(a[i], b[i], s)) return false;
      return true;
    }
    ak = Object.keys(a);
    bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (i = 0; i < ak.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(b, ak[i]) || !eq(a[ak[i]], b[ak[i]], s)) return false;
    }
    return true;
  }

  function printable(v) {
    if (typeof v === 'string') return '"' + v + '"';
    try {
      return JSON.stringify(v);
    } catch (_) {
      return String(v);
    }
  }

  function chain(v) {
    var neg = false;
    var api = {
      get not() {
        neg = !neg;
        return api;
      },
      toBe: function (x) {
        done(Object.is(v, x), 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' be ' + printable(x));
      },
      toEqual: function (x) {
        done(eq(v, x), 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' equal ' + printable(x));
      },
      toBeTruthy: function () {
        done(!!v, 'Expected value to' + (neg ? ' not' : '') + ' be truthy');
      },
      toBeFalsy: function () {
        done(!v, 'Expected value to' + (neg ? ' not' : '') + ' be falsy');
      },
      toContain: function (x) {
        var ok = typeof v === 'string' ? v.indexOf(x) > -1 : Array.isArray(v) && v.indexOf(x) > -1;
        done(ok, 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' contain ' + printable(x));
      },
      toThrow: function (m) {
        var ok = false;
        var err;
        if (typeof v === 'function') {
          try {
            v();
          } catch (e) {
            err = e;
            ok = !m || String(e && e.message || e).indexOf(m) > -1;
          }
        }
        done(ok, 'Expected function to' + (neg ? ' not' : '') + ' throw' + (m ? ' ' + printable(m) : ''));
        return err;
      },
      toBeInstanceOf: function (C) {
        done(typeof C === 'function' && v instanceof C, 'Expected value to' + (neg ? ' not' : '') + ' be instance of ' + (C && C.name || 'unknown'));
      },
      toBeGreaterThan: function (x) {
        done(v > x, 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' be greater than ' + printable(x));
      },
      toBeGreaterThanOrEqual: function (x) {
        done(v >= x, 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' be >= ' + printable(x));
      },
      toBeLessThan: function (x) {
        done(v < x, 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' be less than ' + printable(x));
      },
      toBeLessThanOrEqual: function (x) {
        done(v <= x, 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' be <= ' + printable(x));
      },
      toBeNull: function () {
        done(v === null, 'Expected value to' + (neg ? ' not' : '') + ' be null');
      },
      toBeUndefined: function () {
        done(v === undefined, 'Expected value to' + (neg ? ' not' : '') + ' be undefined');
      },
      toBeDefined: function () {
        done(v !== undefined, 'Expected value to' + (neg ? ' not' : '') + ' be defined');
      },
      toBeNaN: function () {
        done(Number.isNaN(v), 'Expected value to' + (neg ? ' not' : '') + ' be NaN');
      },
      toMatch: function (x) {
        var ok = x instanceof RegExp ? x.test(v) : String(v).indexOf(x) > -1;
        done(ok, 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' match ' + printable(x));
      },
      toHaveLength: function (x) {
        var len = v && v.length !== undefined ? v.length : -1;
        done(len === x, 'Expected length ' + len + ' to' + (neg ? ' not' : '') + ' be ' + x);
      },
      toHaveProperty: function (path, expected) {
        var parts = typeof path === 'string' ? path.split('.') : [path];
        var cur = v;
        var has = true;
        for (var i = 0; i < parts.length; i++) {
          if (cur == null || !Object.prototype.hasOwnProperty.call(cur, parts[i])) { has = false; break; }
          cur = cur[parts[i]];
        }
        var ok = has && (arguments.length < 2 || eq(cur, expected));
        done(ok, 'Expected object to' + (neg ? ' not' : '') + ' have property ' + printable(path) + (arguments.length >= 2 ? ' with value ' + printable(expected) : ''));
      },
      toBeCloseTo: function (x, digits) {
        var d = digits === undefined ? 2 : digits;
        var ok = Math.abs(v - x) < Math.pow(10, -d) / 2;
        done(ok, 'Expected ' + printable(v) + ' to' + (neg ? ' not' : '') + ' be close to ' + printable(x));
      },
      toHaveBeenCalled: function () {
        var c = v && v.calls;
        done(Array.isArray(c) && c.length > 0, 'Expected spy to' + (neg ? ' not' : '') + ' have been called');
      },
      toHaveBeenCalledTimes: function (n) {
        var c = v && v.calls ? v.calls.length : 0;
        done(c === n, 'Expected spy to' + (neg ? ' not' : '') + ' have been called ' + n + ' times, got ' + c);
      },
      toHaveBeenCalledWith: function () {
        var args = Array.prototype.slice.call(arguments);
        var c = v && v.calls || [];
        var ok = c.some(function (call) { return eq(call, args); });
        done(ok, 'Expected spy to' + (neg ? ' not' : '') + ' have been called with ' + printable(args));
      },
      get resolves() {
        return {
          toBe: async function (x) { var r = await v; done(Object.is(r, x), 'Expected resolved ' + printable(r) + ' to' + (neg ? ' not' : '') + ' be ' + printable(x)); },
          toEqual: async function (x) { var r = await v; done(eq(r, x), 'Expected resolved ' + printable(r) + ' to' + (neg ? ' not' : '') + ' equal ' + printable(x)); }
        };
      },
      get rejects() {
        return {
          toThrow: async function (m) {
            var ok = false;
            try { await v; } catch (e) { ok = !m || String(e && e.message || e).indexOf(m) > -1; }
            done(ok, 'Expected promise to' + (neg ? ' not' : '') + ' reject' + (m ? ' with ' + printable(m) : ''));
          }
        };
      }
    };
    function done(ok, msg) {
      ok = neg ? !ok : ok;
      neg = false;
      if (!ok) fail(msg);
      return api;
    }
    return api;
  }

  function addTest(name, fn, mode, timeout) {
    cur.tests.push({ name: name || 'test', fn: typeof fn === 'function' ? fn : noop, skip: mode === 'skip', only: mode === 'only', timeout: timeout || 5000 });
  }

  function hasOnly(s) {
    return s.only || s.tests.some(function (t) { return t.only; }) || s.suites.some(hasOnly);
  }

  function hasSelected(s, onlyMode) {
    if (s.only) return true;
    return s.tests.some(function (t) { return onlyMode ? t.only : true; }) || s.suites.some(function (x) { return hasSelected(x, onlyMode); });
  }

  async function runHooks(list, ctx) {
    var i;
    for (i = 0; i < list.length; i++) await call(list[i], ctx);
  }

  var _opts = { grep: null, bail: false, slow: 75, retries: 0, reporter: null };

  function configure(opts) {
    if (opts) {
      if (opts.grep) _opts.grep = opts.grep instanceof RegExp ? opts.grep : new RegExp(opts.grep, 'i');
      if (opts.bail !== undefined) _opts.bail = !!opts.bail;
      if (opts.slow !== undefined) _opts.slow = opts.slow;
      if (opts.retries !== undefined) _opts.retries = opts.retries;
      if (opts.reporter !== undefined) _opts.reporter = opts.reporter;
    }
  }

  function matchGrep(name) {
    return !_opts.grep || _opts.grep.test(name);
  }

  async function runTest(chainSuites, t, res, onlyMode) {
    var full = chainSuites.map(function (s) { return s.name; }).filter(Boolean).concat(t.name).join(' > ');
    var ctx = { name: t.name, path: full };
    var be = [];
    var ae = [];
    var i;
    var ok = true;
    var err = null;
    var start;
    var duration;
    var attempts = 0;
    var maxRetries = t.retries !== undefined ? t.retries : _opts.retries;
    if (res.bail) return;
    if (onlyMode && !t.only && !chainSuites.some(function (s) { return s.only; })) {
      res.skipped++;
      res.results.push({ name: full, status: 'skipped', duration: 0 });
      emit(res, 'skip', { name: full });
      return;
    }
    if (t.skip) {
      res.skipped++;
      res.results.push({ name: full, status: 'skipped', duration: 0 });
      emit(res, 'skip', { name: full });
      return;
    }
    if (!t.fn || t.fn === noop) {
      res.pending++;
      res.results.push({ name: full, status: 'pending', duration: 0 });
      emit(res, 'pending', { name: full });
      return;
    }
    if (!matchGrep(full)) {
      res.skipped++;
      res.results.push({ name: full, status: 'skipped', duration: 0 });
      return;
    }
    for (i = 0; i < chainSuites.length; i++) be = be.concat(chainSuites[i].be);
    for (i = chainSuites.length - 1; i >= 0; i--) ae = ae.concat(chainSuites[i].ae);
    while (attempts <= maxRetries) {
      ok = true;
      err = null;
      start = Date.now();
      try {
        await runHooks(be, ctx);
        await Promise.race([
          call(t.fn, ctx),
          new Promise(function (_, rej) { setTimeout(function () { rej(new Error('Test timed out after ' + t.timeout + 'ms')); }, t.timeout); })
        ]);
      } catch (e) {
        ok = false;
        err = e;
      }
      try {
        await runHooks(ae, ctx);
      } catch (e2) {
        ok = false;
        err = err || e2;
      }
      duration = Date.now() - start;
      if (ok || attempts >= maxRetries) break;
      attempts++;
    }
    var entry = { name: full, status: ok ? 'passed' : 'failed', duration: duration, attempts: attempts + 1 };
    if (duration > _opts.slow) entry.slow = true;
    if (!ok) entry.error = err;
    if (ok) {
      res.passed++;
      res.results.push(entry);
      emit(res, 'pass', entry);
    } else {
      res.failed++;
      res.results.push(entry);
      emit(res, 'fail', entry);
      if (_opts.bail) res.bail = true;
    }
  }

  function emit(res, event, data) {
    if (_opts.reporter && typeof _opts.reporter[event] === 'function') _opts.reporter[event](data);
    else if (event === 'pass' && g.console && console.log) console.log('✓ ' + data.name + (data.slow ? ' (' + data.duration + 'ms)' : ''));
    else if (event === 'fail' && g.console && console.error) console.error('✗ ' + data.name + '\n  ' + String(data.error && data.error.stack || data.error));
    else if (event === 'skip' && g.console && console.log) console.log('- ' + data.name + ' (skipped)');
    else if (event === 'pending' && g.console && console.log) console.log('○ ' + data.name + ' (pending)');
  }

  async function runSuite(s, chainSuites, res, onlyMode) {
    var next = chainSuites.concat(s);
    var i;
    if (res.bail) return;
    if (s.skipped) {
      for (i = 0; i < s.tests.length; i++) { res.skipped++; res.results.push({ name: s.tests[i].name, status: 'skipped', duration: 0 }); }
      for (i = 0; i < s.suites.length; i++) await runSuite(s.suites[i], next, res, onlyMode);
      return;
    }
    if (!hasSelected(s, onlyMode)) return;
    try {
      await runHooks(s.ba, { suite: s.name });
    } catch (e) {
      res.failed++;
      res.results.push({ name: next.map(function (x) { return x.name; }).filter(Boolean).join(' > '), status: 'failed', error: e });
    }
    for (i = 0; i < s.tests.length; i++) await runTest(next, s.tests[i], res, onlyMode);
    for (i = 0; i < s.suites.length; i++) await runSuite(s.suites[i], next, res, onlyMode);
    try {
      await runHooks(s.aa, { suite: s.name });
    } catch (_) {}
  }

  function pick(map, url) {
    var keys = Object.keys(map || {});
    var i;
    for (i = 0; i < keys.length; i++) {
      if (keys[i] === '*' || url.indexOf(keys[i]) > -1) return map[keys[i]];
      try {
        if (new RegExp(keys[i]).test(url)) return map[keys[i]];
      } catch (_) {}
    }
  }

  function pack(spec, url) {
    var body;
    var status;
    var ok;
    if (spec && typeof spec === 'object' && typeof spec.json === 'function' && typeof spec.text === 'function') return spec;
    if (typeof spec === 'function') spec = spec(url);
    body = spec && typeof spec === 'object' && ('body' in spec || 'json' in spec || 'text' in spec || 'data' in spec)
      ? (spec.body !== undefined ? spec.body : spec.json !== undefined ? spec.json : spec.text !== undefined ? spec.text : spec.data)
      : spec;
    status = spec && typeof spec === 'object' && spec.status != null ? spec.status : 200;
    ok = spec && typeof spec === 'object' && spec.ok != null ? !!spec.ok : status >= 200 && status < 300;
    return {
      ok: ok,
      status: status,
      url: url || '',
      headers: spec && spec.headers || {},
      json: async function () {
        if (typeof body === 'string') {
          try {
            return JSON.parse(body);
          } catch (_) {
            return body;
          }
        }
        return body;
      },
      text: async function () {
        return typeof body === 'string' ? body : JSON.stringify(body == null ? '' : body);
      },
      clone: function () {
        return pack(spec, url);
      }
    };
  }

  /**
   * Defines a test suite.
   * @param {string} name
   * @param {Function} fn
   */
  function describe(name, fn) {
    var p = cur;
    var s = makeSuite(name, p);
    p.suites.push(s);
    cur = s;
    try {
      if (typeof fn === 'function') fn();
    } catch (_) {}
    cur = p;
  }

  describe.skip = function (name, fn) {
    var p = cur;
    var s = makeSuite(name, p);
    s.skipped = true;
    p.suites.push(s);
    cur = s;
    try { if (typeof fn === 'function') fn(); } catch (_) {}
    cur = p;
  };

  describe.only = function (name, fn) {
    var p = cur;
    var s = makeSuite(name, p);
    s.only = true;
    p.suites.push(s);
    cur = s;
    try { if (typeof fn === 'function') fn(); } catch (_) {}
    cur = p;
  };

  /**
   * Defines a test case.
   * @param {string} name
   * @param {Function} fn
   */
  function it(name, fn, timeout) {
    addTest(name, fn, null, timeout);
  }

  /**
   * Defines a skipped test case.
   * @param {string} name
   * @param {Function} fn
   */
  it.skip = function (name, fn) {
    addTest(name, fn, 'skip');
  };

  /**
   * Defines an exclusive test case.
   * @param {string} name
   * @param {Function} fn
   */
  it.only = function (name, fn, timeout) {
    addTest(name, fn, 'only', timeout);
  };

  /**
   * Alias for it().
   * @param {string} name
   * @param {Function} fn
   */
  function test(name, fn, timeout) {
    it(name, fn, timeout);
  }
  test.skip = it.skip;
  test.only = it.only;

  /**
   * Creates an assertion chain.
   * @param {*} value
   * @returns {Object}
   */
  function expect(value) {
    return chain(value);
  }

  /**
   * Registers a beforeEach hook.
   * @param {Function} fn
   */
  function beforeEach(fn) {
    push(cur.be, fn);
  }

  /**
   * Registers an afterEach hook.
   * @param {Function} fn
   */
  function afterEach(fn) {
    push(cur.ae, fn);
  }

  /**
   * Registers a beforeAll hook.
   * @param {Function} fn
   */
  function beforeAll(fn) {
    push(cur.ba, fn);
  }

  /**
   * Registers an afterAll hook.
   * @param {Function} fn
   */
  function afterAll(fn) {
    push(cur.aa, fn);
  }

  var mock = {
    /**
     * Creates a function spy.
     * @param {Function} [impl]
     * @returns {Function}
     */
    fn: function (impl) {
      var spy = function () {
        var args = Array.prototype.slice.call(arguments);
        spy.calls.push(args);
        spy.lastCall = args;
        try {
          spy.returnValue = typeof spy.impl === 'function' ? spy.impl.apply(this, args) : undefined;
          return spy.returnValue;
        } catch (e) {
          spy.error = e;
          throw e;
        }
      };
      spy.impl = impl;
      spy.calls = [];
      spy.lastCall = null;
      spy.returnValue = undefined;
      spy.error = null;
      spy.reset = function () {
        spy.calls = [];
        spy.lastCall = null;
        spy.returnValue = undefined;
        spy.error = null;
        return spy;
      };
      return spy;
    },
    /**
     * Replaces global fetch with predictable responses.
     * @param {Array|Object} responses
     * @returns {Function}
     */
    fetch: function (responses) {
      var old = g.fetch;
      var had = 'fetch' in g;
      var list = Array.isArray(responses) ? responses.slice() : null;
      g.fetch = function (url, opts) {
        var u = String(url || '');
        var spec = list ? (list.length ? list.shift() : undefined) : pick(responses || {}, u);
        try {
          if (spec instanceof Error) return Promise.reject(spec);
          if (typeof spec === 'function') spec = spec(u, opts);
          return Promise.resolve(pack(spec, u));
        } catch (e) {
          return Promise.reject(e);
        }
      };
      return function () {
        if (had) g.fetch = old;
        else delete g.fetch;
      };
    }
  };

  /**
   * Runs the queued test suites.
   * @param {Object} [opts] - {grep, bail, slow, retries, reporter}
   * @returns {Promise<{passed:number,failed:number,skipped:number,pending:number,results:Array,duration:number}>}
   */
  async function run(opts) {
    configure(opts);
    var res = { passed: 0, failed: 0, skipped: 0, pending: 0, results: [], bail: false };
    var onlyMode = hasOnly(root);
    var start = Date.now();
    await runSuite(root, [], res, onlyMode);
    res.duration = Date.now() - start;
    delete res.bail;
    if (g.console && console.log) console.log('\nDone: ' + res.passed + ' passed, ' + res.failed + ' failed, ' + res.skipped + ' skipped, ' + res.pending + ' pending (' + res.duration + 'ms)');
    return res;
  }

  /**
   * Formats results as TAP (Test Anything Protocol).
   * @param {Object} res - Result from run()
   * @returns {string}
   */
  function toTAP(res) {
    var lines = ['TAP version 13', '1..' + res.results.length];
    for (var i = 0; i < res.results.length; i++) {
      var r = res.results[i];
      var num = i + 1;
      if (r.status === 'passed') lines.push('ok ' + num + ' - ' + r.name);
      else if (r.status === 'failed') lines.push('not ok ' + num + ' - ' + r.name + '\n  ---\n  message: ' + String(r.error && r.error.message || r.error) + '\n  ...');
      else if (r.status === 'pending') lines.push('ok ' + num + ' - ' + r.name + ' # TODO pending');
      else lines.push('ok ' + num + ' - ' + r.name + ' # SKIP');
    }
    lines.push('# passed: ' + res.passed, '# failed: ' + res.failed, '# skipped: ' + res.skipped, '# pending: ' + res.pending, '# duration: ' + res.duration + 'ms');
    return lines.join('\n');
  }

  /**
   * Formats results as Markdown report.
   * @param {Object} res - Result from run()
   * @param {Object} [opts] - {title, timestamp}
   * @returns {string}
   */
  function toMarkdown(res, opts) {
    opts = opts || {};
    var title = opts.title || 'Test Results';
    var ts = opts.timestamp !== false ? new Date().toISOString() : '';
    var lines = [];
    var failures = [];
    var slow = [];
    var suites = {};
    lines.push('# ' + title);
    lines.push('');
    if (ts) lines.push('> Generated: ' + ts);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Count |');
    lines.push('|--------|-------|');
    lines.push('| ✅ Passed | ' + res.passed + ' |');
    lines.push('| ❌ Failed | ' + res.failed + ' |');
    lines.push('| ⏭️ Skipped | ' + res.skipped + ' |');
    lines.push('| ○ Pending | ' + res.pending + ' |');
    lines.push('| **Total** | **' + res.results.length + '** |');
    lines.push('| ⏱️ Duration | ' + res.duration + 'ms |');
    lines.push('');
    if (res.failed === 0) lines.push('🎉 **All tests passed!**');
    else lines.push('⚠️ **' + res.failed + ' test(s) failed.**');
    lines.push('');
    // Group by suite
    for (var i = 0; i < res.results.length; i++) {
      var r = res.results[i];
      var parts = r.name.split(' > ');
      var suite = parts.length > 1 ? parts.slice(0, -1).join(' > ') : '(root)';
      var testName = parts[parts.length - 1];
      if (!suites[suite]) suites[suite] = [];
      suites[suite].push({ name: testName, status: r.status, duration: r.duration, error: r.error, slow: r.slow, attempts: r.attempts });
      if (r.status === 'failed') failures.push(r);
      if (r.slow) slow.push(r);
    }
    lines.push('## Results');
    lines.push('');
    var suiteNames = Object.keys(suites);
    for (var s = 0; s < suiteNames.length; s++) {
      lines.push('### ' + suiteNames[s]);
      lines.push('');
      lines.push('| Status | Test | Duration |');
      lines.push('|--------|------|----------|');
      var tests = suites[suiteNames[s]];
      for (var t = 0; t < tests.length; t++) {
        var icon = tests[t].status === 'passed' ? '✅' : tests[t].status === 'failed' ? '❌' : tests[t].status === 'pending' ? '○' : '⏭️';
        var dur = tests[t].duration !== undefined ? tests[t].duration + 'ms' : '-';
        if (tests[t].slow) dur = '⚠️ ' + dur;
        var retry = tests[t].attempts > 1 ? ' (retry ×' + (tests[t].attempts - 1) + ')' : '';
        lines.push('| ' + icon + ' | ' + tests[t].name + retry + ' | ' + dur + ' |');
      }
      lines.push('');
    }
    if (failures.length) {
      lines.push('## Failures');
      lines.push('');
      for (var f = 0; f < failures.length; f++) {
        lines.push('### ❌ ' + failures[f].name);
        lines.push('');
        lines.push('```');
        lines.push(String(failures[f].error && failures[f].error.stack || failures[f].error));
        lines.push('```');
        lines.push('');
      }
    }
    if (slow.length) {
      lines.push('## Slow Tests (>' + _opts.slow + 'ms)');
      lines.push('');
      lines.push('| Test | Duration |');
      lines.push('|------|----------|');
      for (var sl = 0; sl < slow.length; sl++) {
        lines.push('| ' + slow[sl].name + ' | ' + slow[sl].duration + 'ms |');
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  /**
   * Installs the public API onto globalThis.
   * @returns {Function}
   */
  function installGlobals() {
    var names = ['describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'mock', 'run'];
    var prev = {};
    var i;
    for (i = 0; i < names.length; i++) {
      prev[names[i]] = g[names[i]];
      g[names[i]] = api[names[i]];
    }
    return function () {
      for (i = 0; i < names.length; i++) {
        if (prev[names[i]] === undefined) delete g[names[i]];
        else g[names[i]] = prev[names[i]];
      }
    };
  }

  var api = {
    describe: describe,
    it: it,
    test: test,
    expect: expect,
    beforeEach: beforeEach,
    afterEach: afterEach,
    beforeAll: beforeAll,
    afterAll: afterAll,
    mock: mock,
    run: run,
    configure: configure,
    toTAP: toTAP,
    toMarkdown: toMarkdown,
    installGlobals: installGlobals
  };

  return api;
})();
