var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Pipeline = (function() {
  'use strict';

  var DROPPED = { dropped: true };

  function noop() {}
  function isFn(value) { return typeof value === 'function'; }
  function isPromiseLike(value) { return !!(value && isFn(value.then)); }
  function toNumber(value, fallback) {
    value = Number(value);
    return isFinite(value) ? value : fallback;
  }
  function listFrom(args) {
    return args.length === 1 && Array.isArray(args[0]) ? args[0].slice() : Array.prototype.slice.call(args);
  }
  function abortError(reason) {
    var err;
    if (reason instanceof Error) return reason;
    err = new Error(reason || 'Aborted');
    err.name = 'AbortError';
    return err;
  }
  function timeoutError(ms) {
    var err = new Error('Operation timed out after ' + ms + 'ms');
    err.name = 'TimeoutError';
    err.timeout = ms;
    return err;
  }
  function checkSignal(signal) {
    if (signal && signal.aborted) throw abortError(signal.reason);
  }
  function onAbort(signal, handler) {
    if (!signal || !isFn(signal.addEventListener)) return noop;
    signal.addEventListener('abort', handler, { once: true });
    return function() {
      try { signal.removeEventListener('abort', handler); } catch (_) {}
    };
  }
  function wait(ms, signal) {
    ms = Math.max(0, toNumber(ms, 0));
    return new Promise(function(resolve, reject) {
      var timer;
      var off;
      try { checkSignal(signal); } catch (err) { reject(err); return; }
      off = onAbort(signal, function() {
        if (timer != null) clearTimeout(timer);
        reject(abortError(signal && signal.reason));
      });
      timer = setTimeout(function() {
        off();
        resolve();
      }, ms);
    });
  }
  function guard(promise, signal, timeout) {
    timeout = Math.max(0, toNumber(timeout, 0));
    return new Promise(function(resolve, reject) {
      var settled = false;
      var timer = null;
      var off = noop;
      function finish(err, value) {
        if (settled) return;
        settled = true;
        if (timer != null) clearTimeout(timer);
        off();
        if (err) reject(err);
        else resolve(value);
      }
      try {
        checkSignal(signal);
        off = onAbort(signal, function() { finish(abortError(signal && signal.reason)); });
        if (timeout > 0) timer = setTimeout(function() { finish(timeoutError(timeout)); }, timeout);
        Promise.resolve(promise).then(function(value) { finish(null, value); }, function(err) { finish(err); });
      } catch (err) {
        finish(err);
      }
    });
  }
  function stageName(stage, index) {
    if (stage && stage._bmName) return stage._bmName;
    if (stage && stage.displayName) return stage.displayName;
    if (stage && stage.name) return stage.name;
    return 'stage' + index;
  }
  function isPipeline(value) {
    return !!(value && value._bmPipeline && isFn(value.execute));
  }
  function isStream(value) {
    return !!(value && value._bmStream && isFn(value[Symbol.asyncIterator]));
  }
  function toAsyncIterable(source) {
    if (isStream(source)) return source;
    if (source && isFn(source[Symbol.asyncIterator])) return source;
    if (source && isFn(source.next)) {
      return {
        [Symbol.asyncIterator]: function() { return source; }
      };
    }
    if (source && isFn(source[Symbol.iterator])) {
      return {
        [Symbol.asyncIterator]: async function*() {
          var item;
          for (item of source) yield item;
        }
      };
    }
    return {
      [Symbol.asyncIterator]: async function*() {
        if (source !== undefined) yield source;
      }
    };
  }
  function iteratorFrom(source) {
    return toAsyncIterable(source)[Symbol.asyncIterator]();
  }
  function invokeUnit(unit, input, ctx) {
    if (unit == null) return input;
    if (Array.isArray(unit)) return series(unit, input, ctx);
    if (isPipeline(unit)) return unit.execute(input, { signal: ctx && ctx.signal });
    if (isFn(unit)) return unit._bmInternal ? unit(input, ctx || {}) : unit(input);
    return unit;
  }

  function compose() {
    var fns = listFrom(arguments);
    return function(input) {
      var i;
      var result = input;
      for (i = fns.length - 1; i >= 0; i--) {
        if (isPromiseLike(result)) {
          result = Promise.resolve(result).then((function(fn) {
            return function(value) { return invokeUnit(fn, value, {}); };
          })(fns[i]));
        } else result = invokeUnit(fns[i], result, {});
      }
      return result;
    };
  }
  function series(fns, input, ctx) {
    var list = Array.isArray(fns) ? fns.slice() : [];
    return list.reduce(function(chain, fn) {
      return Promise.resolve(chain).then(function(value) {
        return invokeUnit(fn, value, ctx || {});
      });
    }, Promise.resolve(input));
  }
  function parallel(fns, input, ctx) {
    var list = Array.isArray(fns) ? fns.slice() : [];
    return Promise.all(list.map(function(fn) {
      return Promise.resolve().then(function() {
        return invokeUnit(fn, input, ctx || {});
      });
    }));
  }
  function waterfall(fns) {
    var list = Array.isArray(fns) ? fns.slice() : [];
    return function(input, ctx) {
      return list.reduce(function(chain, fn) {
        return Promise.resolve(chain).then(function(previous) {
          return fn(previous, input, ctx || {});
        });
      }, Promise.resolve(input));
    };
  }

  function tapStage(fn) {
    function stage(value, ctx) {
      return Promise.resolve(invokeUnit(fn, value, ctx || {})).then(function() { return value; });
    }
    stage._bmName = 'tap';
    stage._bmInternal = true;
    return stage;
  }
  function filterStage(predicate) {
    function stage(value, ctx) {
      return Promise.resolve(invokeUnit(predicate, value, ctx || {})).then(function(ok) {
        return ok ? value : DROPPED;
      });
    }
    stage._bmName = 'filter';
    stage._bmInternal = true;
    return stage;
  }
  function branchStage(predicate, ifTrue, ifFalse) {
    function stage(value, ctx) {
      return Promise.resolve(invokeUnit(predicate, value, ctx || {})).then(function(ok) {
        if (ok) return invokeUnit(ifTrue, value, ctx || {});
        if (ifFalse == null) return value;
        return invokeUnit(ifFalse, value, ctx || {});
      });
    }
    stage._bmName = 'branch';
    stage._bmInternal = true;
    return stage;
  }
  function retryStage(unit, policy) {
    var cfg = policy || {};
    var maxAttempts = Math.max(1, toNumber(cfg.maxAttempts, 3));
    var baseDelay = Math.max(0, toNumber(cfg.delay, 0));
    var backoff = cfg.backoff == null ? 1 : Number(cfg.backoff);
    backoff = isFinite(backoff) && backoff > 0 ? backoff : 1;
    function stage(value, ctx) {
      var attempt = 0;
      function run() {
        return Promise.resolve().then(function() {
          checkSignal(ctx && ctx.signal);
          return invokeUnit(unit, value, ctx || {});
        }).catch(function(err) {
          var pause;
          if (ctx && ctx.signal && ctx.signal.aborted) throw abortError(ctx.signal.reason);
          attempt++;
          if (attempt >= maxAttempts) throw err;
          pause = baseDelay ? baseDelay * Math.pow(backoff, attempt - 1) : 0;
          return wait(pause, ctx && ctx.signal).then(run);
        });
      }
      return run();
    }
    stage._bmName = 'retry';
    stage._bmInternal = true;
    return stage;
  }
  function timeoutStage(unit, ms) {
    ms = Math.max(0, toNumber(ms, 0));
    function stage(value, ctx) {
      return guard(Promise.resolve().then(function() {
        return invokeUnit(unit, value, ctx || {});
      }), ctx && ctx.signal, ms);
    }
    stage._bmName = 'timeout';
    stage._bmInternal = true;
    return stage;
  }
  function parallelStage(stages) {
    var list = Array.isArray(stages) ? stages.slice() : [];
    function stage(value, ctx) {
      return parallel(list, value, ctx || {});
    }
    stage._bmName = 'parallel';
    stage._bmInternal = true;
    return stage;
  }
  function batchStage(size, fn) {
    var batchSize = Math.max(1, toNumber(size, 1));
    var queue = [];
    function remove(entry) {
      var i = queue.indexOf(entry);
      if (i >= 0) queue.splice(i, 1);
    }
    function settle(entries, err, value) {
      var i;
      for (i = 0; i < entries.length; i++) {
        entries[i].cleanup();
        if (err) entries[i].reject(err);
        else entries[i].resolve(value);
      }
    }
    function flush(entries) {
      var values = entries.map(function(entry) { return entry.value; });
      Promise.resolve().then(function() {
        return isFn(fn) ? fn(values) : values;
      }).then(function(result) {
        settle(entries, null, result);
      }, function(err) {
        settle(entries, err);
      });
    }
    function stage(value, ctx) {
      return new Promise(function(resolve, reject) {
        var entry = { value: value, ctx: ctx || {}, resolve: resolve, reject: reject, cleanup: noop };
        if (ctx && ctx.signal) {
          if (ctx.signal.aborted) { reject(abortError(ctx.signal.reason)); return; }
          entry.cleanup = onAbort(ctx.signal, function() {
            remove(entry);
            reject(abortError(ctx.signal.reason));
          });
        }
        queue.push(entry);
        if (queue.length >= batchSize) flush(queue.splice(0, batchSize));
      });
    }
    stage._bmName = 'batch';
    stage._bmInternal = true;
    return stage;
  }
  function debounceStage(ms) {
    var waitMs = Math.max(0, toNumber(ms, 0));
    var timer = null;
    var current = null;
    function finish(value, err) {
      var entry = current;
      if (!entry) return;
      if (timer != null) clearTimeout(timer);
      timer = null;
      current = null;
      entry.cleanup();
      if (err) entry.reject(err);
      else entry.resolve(value);
    }
    function stage(value, ctx) {
      return new Promise(function(resolve, reject) {
        if (current) finish(DROPPED);
        if (ctx && ctx.signal && ctx.signal.aborted) { reject(abortError(ctx.signal.reason)); return; }
        current = { resolve: resolve, reject: reject, cleanup: noop };
        if (ctx && ctx.signal) current.cleanup = onAbort(ctx.signal, function() {
          if (current && current.resolve === resolve) finish(null, abortError(ctx.signal.reason));
        });
        timer = setTimeout(function() {
          if (current && current.resolve === resolve) finish(value);
        }, waitMs);
      });
    }
    stage._bmName = 'debounce';
    stage._bmInternal = true;
    return stage;
  }

  function makePipeline(stages) {
    var list = Array.isArray(stages) ? stages.slice() : [];
    var api;
    function execute(input, opts) {
      opts = opts || {};
      return guard((async function() {
        var value = input;
        var i;
        var stage;
        var output;
        for (i = 0; i < list.length; i++) {
          checkSignal(opts.signal);
          stage = list[i];
          output = await guard(Promise.resolve().then(function() {
            return invokeUnit(stage, value, {
              signal: opts.signal,
              stageIndex: i,
              originalInput: input,
              pipeline: api
            });
          }), opts.signal, 0);
          if (isFn(opts.onStage)) {
            try { opts.onStage(i, stageName(stage, i), value, output === DROPPED ? undefined : output); } catch (_) {}
          }
          if (output === DROPPED) return undefined;
          value = output;
        }
        return value;
      })(), opts.signal, opts.timeout);
    }
    api = {
      _bmPipeline: true,
      stages: list.slice(),
      execute: execute,
      pipe: function(stage) { return makePipeline(list.concat([stage])); },
      prepend: function(stage) { return makePipeline([stage].concat(list)); },
      tap: function(fn) { return api.pipe(tapStage(fn)); },
      filter: function(predicate) { return api.pipe(filterStage(predicate)); },
      branch: function(predicate, ifTrue, ifFalse) { return api.pipe(branchStage(predicate, ifTrue, ifFalse)); },
      retry: function(stage, policy) { return api.pipe(retryStage(stage, policy)); },
      timeout: function(stage, ms) { return api.pipe(timeoutStage(stage, ms)); },
      parallel: function(stages) { return api.pipe(parallelStage(stages)); },
      batch: function(size, fn) { return api.pipe(batchStage(size, fn)); },
      debounce: function(ms) { return api.pipe(debounceStage(ms)); }
    };
    return api;
  }

  function create() {
    return makePipeline(listFrom(arguments));
  }
  function makeStream(factory) {
    var api;
    async function collect() {
      var out = [];
      for await (var item of api) out.push(item);
      return out;
    }
    async function forEach(fn) {
      for await (var item of api) await fn(item);
    }
    async function first() {
      for await (var item of api) return item;
      return undefined;
    }
    async function reduce(fn, init) {
      var hasInit = arguments.length > 1;
      var acc = init;
      for await (var item of api) {
        if (!hasInit) {
          acc = item;
          hasInit = true;
        } else acc = await fn(acc, item);
      }
      return acc;
    }
    api = {
      _bmStream: true,
      [Symbol.asyncIterator]: function() { return iteratorFrom(factory()); },
      map: function(fn) {
        var self = api;
        return makeStream(async function*() {
          for await (var item of self) yield fn ? await fn(item) : item;
        });
      },
      filter: function(predicate) {
        var self = api;
        return makeStream(async function*() {
          for await (var item of self) if (!predicate || await predicate(item)) yield item;
        });
      },
      reduce: reduce,
      take: function(n) {
        var self = api;
        var limit = Math.max(0, toNumber(n, 0));
        return makeStream(async function*() {
          var count = 0;
          if (!limit) return;
          for await (var item of self) {
            yield item;
            count++;
            if (count >= limit) break;
          }
        });
      },
      skip: function(n) {
        var self = api;
        var limit = Math.max(0, toNumber(n, 0));
        return makeStream(async function*() {
          var skipped = 0;
          for await (var item of self) {
            if (skipped < limit) { skipped++; continue; }
            yield item;
          }
        });
      },
      chunk: function(n) {
        var self = api;
        var size = Math.max(1, toNumber(n, 1));
        return makeStream(async function*() {
          var batch = [];
          for await (var item of self) {
            batch.push(item);
            if (batch.length >= size) {
              yield batch;
              batch = [];
            }
          }
          if (batch.length) yield batch;
        });
      },
      flatten: function() {
        var self = api;
        return makeStream(async function*() {
          var sub;
          for await (var item of self) {
            if (item == null || typeof item === 'string') { yield item; continue; }
            if (isFn(item[Symbol.asyncIterator])) {
              for await (sub of item) yield sub;
              continue;
            }
            if (isFn(item[Symbol.iterator])) {
              for (sub of item) yield sub;
              continue;
            }
            yield item;
          }
        });
      },
      throttle: function(ms) {
        var self = api;
        var gap = Math.max(0, toNumber(ms, 0));
        return makeStream(async function*() {
          var firstItem = true;
          for await (var item of self) {
            if (!firstItem && gap) await wait(gap);
            firstItem = false;
            yield item;
          }
        });
      },
      buffer: function(n) { return api.chunk(n); },
      merge: function(other) {
        var self = api;
        return makeStream(async function*() {
          var left = iteratorFrom(self);
          var right = iteratorFrom(other);
          var never = new Promise(function() {});
          var leftDone = false;
          var rightDone = false;
          var leftNext = Promise.resolve(left.next()).then(function(result) { return { side: 'left', result: result }; });
          var rightNext = Promise.resolve(right.next()).then(function(result) { return { side: 'right', result: result }; });
          var winner;
          while (!leftDone || !rightDone) {
            winner = await Promise.race([leftDone ? never : leftNext, rightDone ? never : rightNext]);
            if (winner.side === 'left') {
              if (winner.result.done) leftDone = true;
              else {
                yield winner.result.value;
                leftNext = Promise.resolve(left.next()).then(function(result) { return { side: 'left', result: result }; });
              }
            } else if (winner.result.done) rightDone = true;
            else {
              yield winner.result.value;
              rightNext = Promise.resolve(right.next()).then(function(result) { return { side: 'right', result: result }; });
            }
          }
        });
      },
      collect: collect,
      forEach: forEach,
      first: first
    };
    return api;
  }
  function stream(iterable) {
    return makeStream(function() { return iterable; });
  }

  function backpressure(producer, consumer, opts) {
    opts = opts || {};
    consumer = isFn(consumer) ? consumer : function() {};
    var high = Math.max(1, toNumber(opts.highWaterMark, 16));
    var low = Math.max(0, toNumber(opts.lowWaterMark, Math.max(0, high - 1)));
    var queue = [];
    var waiters = [];
    var started = false;
    var stopped = false;
    var paused = false;
    var draining = false;
    var pressured = false;
    var controller;

    if (low > high) low = high;

    function notify(fn, size) {
      if (!isFn(fn)) return;
      try { fn(size); } catch (_) {}
    }
    function wake() {
      var pending = waiters.slice();
      var i;
      waiters.length = 0;
      for (i = 0; i < pending.length; i++) pending[i]();
    }
    function held() {
      return !stopped && (paused || pressured);
    }
    function waitForFlow() {
      if (!held()) return Promise.resolve();
      return new Promise(function(resolve) { waiters.push(resolve); });
    }
    function setPressure(next) {
      if (next && !pressured) {
        pressured = true;
        notify(opts.onPressure, queue.length);
      } else if (!next && pressured) {
        pressured = false;
        notify(opts.onDrain, queue.length);
        wake();
      }
    }
    function push(item) {
      if (stopped) return false;
      queue.push(item);
      if (queue.length >= high) setPressure(true);
      drain();
      return !pressured;
    }
    async function drain() {
      if (draining || stopped || paused) return;
      draining = true;
      try {
        while (queue.length && !stopped && !paused) {
          if (pressured && queue.length <= low) setPressure(false);
          await consumer(queue.shift(), controller);
        }
        if (pressured && queue.length <= low) setPressure(false);
      } finally {
        draining = false;
        if (!stopped && !paused && queue.length) drain();
      }
    }
    async function runProducer() {
      if (started) return;
      started = true;
      if (isFn(producer)) {
        await producer(push, internal);
        return;
      }
      for await (var item of toAsyncIterable(producer)) {
        if (stopped) break;
        if (held()) await waitForFlow();
        if (stopped) break;
        push(item);
        if (held()) await waitForFlow();
      }
    }
    var internal = {
      push: push,
      pause: function() { paused = true; },
      resume: function() { paused = false; wake(); drain(); },
      stop: function() { stopped = true; queue.length = 0; wake(); },
      wait: waitForFlow,
      size: function() { return queue.length; },
      isPaused: function() { return paused || pressured; }
    };
    controller = {
      start: function() { Promise.resolve(runProducer()).catch(noop); drain(); return controller; },
      pause: function() { paused = true; return controller; },
      resume: function() { paused = false; wake(); drain(); return controller; },
      stop: function() { stopped = true; queue.length = 0; wake(); return controller; }
    };
    return controller;
  }

  return {
    create: create,
    stream: stream,
    compose: compose,
    series: series,
    parallel: parallel,
    waterfall: waterfall,
    backpressure: backpressure
  };
})();
if(typeof module!=='undefined') module.exports = BareMetal.Pipeline;
