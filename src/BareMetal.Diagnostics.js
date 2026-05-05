var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.Diagnostics = (function () {
  'use strict';

  var root = typeof globalThis !== 'undefined' ? globalThis : window;
  var hasOwn = Object.prototype.hasOwnProperty;
  var perfApi = root.performance || null;
  var enabled = true;
  var MAX_MUTATIONS = 1000;
  var GAUGE_INTERVAL = 1000;
  var timelineStore = createTimeline();
  var perfMarks = [];
  var perfMeasures = [];
  var perfMarkIndex = {};
  var counters = {};
  var gauges = {};
  var spans = [];
  var mutations = [];
  var spanSeed = 0;
  var observedProps = new WeakMap();

  function noop() {}
  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function isObject(value) { return value && (typeof value === 'object' || typeof value === 'function'); }
  function isPromiseLike(value) { return !!value && typeof value.then === 'function'; }
  function now() { return perfApi && typeof perfApi.now === 'function' ? perfApi.now() : Date.now(); }
  function stamp() { return Date.now(); }
  function objectKeys(value) {
    if (!isObject(value)) return [];
    if (value instanceof Map) return Array.from(value.keys());
    if (value instanceof Set) return Array.from(value.values());
    return Object.keys(value);
  }
  function kindOf(value) {
    if (value === null) return 'null';
    if (value === void 0) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    if (value instanceof Map) return 'map';
    if (value instanceof Set) return 'set';
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) return 'typed-array';
    return typeof value;
  }
  function sizeOf(value) {
    var type = kindOf(value);
    if (type === 'array' || type === 'typed-array' || type === 'string') return value.length;
    if (type === 'map' || type === 'set') return value.size;
    if (type === 'object') return objectKeys(value).length;
    return 0;
  }
  function copyObject(source) {
    var out = {};
    var key;
    for (key in (source || {})) if (own(source, key)) out[key] = source[key];
    return out;
  }
  function toList(value) {
    return Array.isArray(value) ? value.slice() : [];
  }
  function percent(values, ratio) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var index;
    if (!sorted.length) return 0;
    index = Math.ceil(sorted.length * ratio) - 1;
    if (index < 0) index = 0;
    if (index >= sorted.length) index = sorted.length - 1;
    return sorted[index];
  }
  function parsePath(path) {
    var text;
    if (Array.isArray(path)) return path.map(function (part) { return String(part); });
    text = String(path == null ? '' : path).replace(/\[(.*?)\]/g, '.$1');
    return text ? text.split('.').filter(function (part) { return part.length; }) : [];
  }
  function getPath(target, parts) {
    var cursor = target;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null) return void 0;
      cursor = cursor[parts[i]];
    }
    return cursor;
  }
  function sameValue(a, b) {
    return a === b || (a !== a && b !== b);
  }
  function snapshot(value, stack) {
    var seen = stack || [];
    var out;
    var i;
    var keys;
    if (!isObject(value)) {
      if (typeof value === 'function') return '[Function]';
      if (typeof value === 'number' && !isFinite(value)) return String(value);
      return value;
    }
    for (i = 0; i < seen.length; i++) if (seen[i] === value) return '[Circular]';
    seen.push(value);
    if (Array.isArray(value)) {
      out = value.map(function (item) { return snapshot(item, seen); });
      seen.pop();
      return out;
    }
    if (value instanceof Date) {
      seen.pop();
      return value.toISOString();
    }
    if (value instanceof RegExp) {
      seen.pop();
      return String(value);
    }
    if (value instanceof Map) {
      out = [];
      value.forEach(function (item, key) {
        out.push([snapshot(key, seen), snapshot(item, seen)]);
      });
      seen.pop();
      return out;
    }
    if (value instanceof Set) {
      out = [];
      value.forEach(function (item) { out.push(snapshot(item, seen)); });
      seen.pop();
      return out;
    }
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) {
      out = Array.prototype.slice.call(value);
      seen.pop();
      return out;
    }
    if (value instanceof Error) {
      out = { name: value.name, message: value.message, stack: value.stack };
      seen.pop();
      return out;
    }
    keys = Object.keys(value);
    out = {};
    for (i = 0; i < keys.length; i++) out[keys[i]] = snapshot(value[keys[i]], seen);
    seen.pop();
    return out;
  }
  function cloneEntry(entry) {
    return snapshot(entry);
  }
  function matchesFilter(entry, filter) {
    var key;
    if (!filter) return true;
    if (typeof filter === 'function') return !!filter(entry);
    if (typeof filter === 'string') return entry.name === filter || entry.type === filter;
    if (!isObject(filter)) return true;
    for (key in filter) if (own(filter, key) && entry[key] !== filter[key]) return false;
    return true;
  }
  function resolvePoint(value, marks) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && marks && own(marks, value)) return marks[value];
    if (value && typeof value.timestamp === 'number') return value.timestamp;
    return null;
  }
  function pushMutation(change) {
    mutations.push(cloneEntry(change));
    if (mutations.length > MAX_MUTATIONS) mutations.shift();
  }
  function createTimeline() {
    var events = [];
    var marks = {};
    var measures = [];

    function push(type, name, data, time) {
      var entry = { type: type, name: String(name == null ? '' : name), timestamp: time == null ? now() : time };
      if (data !== void 0) entry.data = snapshot(data);
      events.push(entry);
      return entry;
    }

    return {
      record: function (event, data) {
        if (!enabled) return null;
        return push('event', event, data);
      },
      mark: function (name) {
        var time;
        if (!enabled) return null;
        time = now();
        marks[name] = time;
        push('mark', name, void 0, time);
        return time;
      },
      measure: function (name, startMark, endMark) {
        var start = resolvePoint(startMark, marks);
        var end = resolvePoint(endMark, marks);
        var item;
        if (!enabled) return { name: name, start: start, end: end, duration: 0 };
        if (start == null) start = now();
        if (end == null) end = now();
        item = { name: String(name == null ? '' : name), start: start, end: end, duration: end - start };
        measures.push(item);
        push('measure', name, item, end);
        return snapshot(item);
      },
      getEvents: function (filter) {
        return events.filter(function (entry) { return matchesFilter(entry, filter); }).map(cloneEntry);
      },
      getDuration: function (start, end) {
        var from = resolvePoint(start, marks);
        var to = resolvePoint(end, marks);
        if (from == null || to == null) return 0;
        return to - from;
      },
      clear: function () {
        events = [];
        marks = {};
        measures = [];
      },
      export: function () {
        return {
          events: events.map(cloneEntry),
          marks: snapshot(marks),
          measures: measures.map(cloneEntry)
        };
      }
    };
  }
  function restartGauges() {
    var key;
    for (key in gauges) if (own(gauges, key)) gauges[key].start();
  }
  function stopGauges() {
    var key;
    for (key in gauges) if (own(gauges, key)) gauges[key].stop();
  }
  function createNoopSpan() {
    var api = { context: {} };
    api.end = function () { return api.context; };
    api.addEvent = function () { return api; };
    api.setAttribute = function () { return api; };
    return api;
  }
  function createSpan(name, opts) {
    var config = opts || {};
    var parent = config.parent && config.parent.context ? config.parent.context : config.parent;
    var context;
    var api;
    if (!enabled) return createNoopSpan();
    context = {
      id: String(++spanSeed),
      name: String(name == null ? '' : name),
      parentId: parent && parent.id ? parent.id : null,
      start: now(),
      end: null,
      duration: null,
      attributes: copyObject(config.attributes),
      events: []
    };
    spans.push(context);
    timelineStore.record('span.start', { id: context.id, name: context.name, parentId: context.parentId, attributes: context.attributes });
    api = {
      context: context,
      end: function (data) {
        if (context.end != null) return context;
        context.end = now();
        context.duration = context.end - context.start;
        if (data !== void 0) context.result = snapshot(data);
        timelineStore.record('span.end', { id: context.id, name: context.name, duration: context.duration });
        return context;
      },
      addEvent: function (eventName, data) {
        var item;
        if (!enabled) return api;
        item = { name: String(eventName == null ? '' : eventName), data: snapshot(data), timestamp: now() };
        context.events.push(item);
        timelineStore.record('span.event', { spanId: context.id, name: item.name, data: item.data });
        return api;
      },
      setAttribute: function (key, value) {
        if (!enabled) return api;
        context.attributes[key] = value;
        return api;
      }
    };
    return api;
  }
  function trace(name, fn) {
    if (typeof fn !== 'function') return noop;
    function wrapped() {
      var start;
      var activeSpan;
      var self = this;
      var args = arguments;
      function finish(error) {
        var end;
        var duration;
        if (!enabled) return;
        end = now();
        duration = end - start;
        if (error) activeSpan.setAttribute('error', error && error.message ? error.message : String(error));
        activeSpan.setAttribute('duration', duration);
        activeSpan.end();
        timelineStore.record('trace.end', { name: name, duration: duration, error: !!error });
      }
      if (!enabled) return fn.apply(self, args);
      start = now();
      activeSpan = createSpan(name, { attributes: { traced: true } });
      timelineStore.record('trace.start', { name: name });
      try {
        var result = fn.apply(self, args);
        if (isPromiseLike(result)) {
          return Promise.resolve(result).then(function (value) {
            finish(null);
            return value;
          }, function (error) {
            finish(error);
            throw error;
          });
        }
        finish(null);
        return result;
      } catch (error) {
        finish(error);
        throw error;
      }
    }
    wrapped.__bmOriginal = fn;
    wrapped.__bmTraceName = name;
    return wrapped;
  }
  function inspect(value, opts) {
    var limit = opts && typeof opts.maxDepth === 'number' ? opts.maxDepth : Infinity;
    var stack = [];
    var circular = false;
    var maxDepth = 0;
    function visit(node, depth) {
      var keys;
      var i;
      if (depth > maxDepth) maxDepth = depth;
      if (!isObject(node) || depth >= limit) return;
      if (stack.indexOf(node) >= 0) {
        circular = true;
        return;
      }
      stack.push(node);
      keys = objectKeys(node);
      for (i = 0; i < keys.length; i++) visit(node[keys[i]], depth + 1);
      stack.pop();
    }
    visit(value, 0);
    return {
      type: kindOf(value),
      keys: objectKeys(value),
      size: sizeOf(value),
      circular: circular,
      depth: maxDepth,
      frozen: isObject(value) ? Object.isFrozen(value) : false,
      sealed: isObject(value) ? Object.isSealed(value) : false
    };
  }
  function comparable(value) {
    return JSON.stringify(snapshot(value));
  }
  function why(value, history) {
    var list = Array.isArray(history) ? history : mutations;
    var chain = [];
    var targetPath = typeof value === 'string' ? value : null;
    var needle = targetPath ? null : comparable(value);
    var index = -1;
    var current;
    var i;
    if (targetPath) {
      for (i = 0; i < list.length; i++) if (list[i].path === targetPath) chain.push(cloneEntry(list[i]));
      return chain;
    }
    for (i = list.length - 1; i >= 0; i--) {
      if (comparable(list[i]['new']) === needle) {
        index = i;
        break;
      }
    }
    while (index >= 0) {
      current = list[index];
      chain.unshift(cloneEntry(current));
      needle = comparable(current.old);
      index = -1;
      for (i = chain.length ? list.length - 1 : index; i >= 0; i--) {
        if (list[i].path === current.path && comparable(list[i]['new']) === needle && list[i].timestamp < current.timestamp) {
          index = i;
          break;
        }
      }
    }
    return chain;
  }
  function getObservedState(target, prop) {
    var props = observedProps.get(target);
    if (!props) {
      props = {};
      observedProps.set(target, props);
    }
    return props[prop];
  }
  function setObservedState(target, prop, state) {
    var props = observedProps.get(target);
    if (!props) {
      props = {};
      observedProps.set(target, props);
    }
    props[prop] = state;
  }
  function deleteObservedState(target, prop) {
    var props = observedProps.get(target);
    if (props) delete props[prop];
  }
  function observeProperty(target, prop, listener) {
    var state;
    var original;
    var current;
    if (!isObject(target)) return noop;
    state = getObservedState(target, prop);
    if (!state) {
      original = Object.getOwnPropertyDescriptor(target, prop);
      if (original && original.configurable === false) return noop;
      current = original && original.get ? original.get.call(target) : target[prop];
      state = {
        listeners: [],
        descriptor: original || null,
        enumerable: !original || original.enumerable !== false,
        value: current,
        getter: original && original.get ? function () { return original.get.call(target); } : function () { return state.value; },
        setter: original && original.set ? function (next) {
          original.set.call(target, next);
          if (!original.get) state.value = next;
        } : function (next) { state.value = next; }
      };
      Object.defineProperty(target, prop, {
        configurable: true,
        enumerable: state.enumerable,
        get: function () { return state.getter(); },
        set: function (next) {
          var before = state.getter();
          state.setter(next);
          var after = state.getter();
          state.listeners.slice().forEach(function (fn) {
            try { fn(before, after); } catch (_) {}
          });
        }
      });
      setObservedState(target, prop, state);
    }
    state.listeners.push(listener);
    return function () {
      var index = state.listeners.indexOf(listener);
      var descriptor;
      var value;
      if (index >= 0) state.listeners.splice(index, 1);
      if (state.listeners.length) return;
      value = state.getter();
      if (state.descriptor) {
        descriptor = {};
        if (own(state.descriptor, 'get')) descriptor.get = state.descriptor.get;
        if (own(state.descriptor, 'set')) descriptor.set = state.descriptor.set;
        if (own(state.descriptor, 'value')) {
          descriptor.value = value;
          descriptor.writable = state.descriptor.writable !== false;
        }
        descriptor.enumerable = state.descriptor.enumerable !== false;
        descriptor.configurable = true;
        Object.defineProperty(target, prop, descriptor);
      } else {
        try { delete target[prop]; } catch (_) {}
        target[prop] = value;
      }
      deleteObservedState(target, prop);
    };
  }
  function watch(target, path, callback) {
    var parts = parsePath(path);
    var unsubscribers = [];
    var active = true;
    var lastValue;

    function clearFrom(index) {
      while (unsubscribers.length > index) {
        try { unsubscribers.pop()(); } catch (_) {}
      }
    }
    function emitChange(oldValue, newValue) {
      var change;
      if (!active || !enabled) {
        lastValue = newValue;
        return;
      }
      change = {
        old: snapshot(oldValue),
        'new': snapshot(newValue),
        path: parts.join('.'),
        timestamp: stamp()
      };
      pushMutation(change);
      lastValue = newValue;
      try { callback(change); } catch (_) {}
    }
    function refresh() {
      var next = getPath(target, parts);
      if (!sameValue(lastValue, next)) emitChange(lastValue, next);
      else lastValue = next;
    }
    function bind(node, index) {
      var prop;
      clearFrom(index);
      if (!isObject(node) || index >= parts.length) return;
      prop = parts[index];
      unsubscribers[index] = observeProperty(node, prop, function (oldValue, newValue) {
        bind(newValue, index + 1);
        if (index < parts.length - 1) refresh();
        else emitChange(oldValue, newValue);
      });
      bind(node[prop], index + 1);
    }

    if (!isObject(target) || !parts.length || typeof callback !== 'function') return noop;
    lastValue = getPath(target, parts);
    bind(target, 0);
    return function () {
      active = false;
      clearFrom(0);
    };
  }
  function counter(name) {
    var key = String(name == null ? '' : name);
    var entry = counters[key] || (counters[key] = { name: key, value: 0 });
    return {
      increment: function (amount) {
        if (!enabled) return entry.value;
        entry.value += amount == null ? 1 : Number(amount) || 0;
        return entry.value;
      },
      decrement: function (amount) {
        if (!enabled) return entry.value;
        entry.value -= amount == null ? 1 : Number(amount) || 0;
        return entry.value;
      },
      value: function () { return entry.value; },
      reset: function () {
        if (!enabled) return entry.value;
        entry.value = 0;
        return entry.value;
      }
    };
  }
  function gauge(name, fn) {
    var key = String(name == null ? '' : name);
    var entry = gauges[key];
    if (!entry || (typeof fn === 'function' && entry.fn !== fn)) {
      if (entry && entry.timer) clearInterval(entry.timer);
      entry = {
        name: key,
        fn: typeof fn === 'function' ? fn : function () { return 0; },
        current: void 0,
        samples: [],
        timer: 0,
        sample: function () {
          var value;
          if (!enabled) return entry.current;
          try { value = entry.fn(); } catch (_) { return entry.current; }
          entry.current = value;
          entry.samples.push({ timestamp: stamp(), value: snapshot(value) });
          return entry.current;
        },
        start: function () {
          if (!enabled || entry.timer || typeof setInterval !== 'function') return;
          entry.timer = setInterval(function () { entry.sample(); }, GAUGE_INTERVAL);
        },
        stop: function () {
          if (!entry.timer) return;
          clearInterval(entry.timer);
          entry.timer = 0;
        }
      };
      gauges[key] = entry;
      if (enabled) {
        entry.sample();
        entry.start();
      }
    }
    return {
      value: function () { return entry.current; },
      sample: function () { return entry.sample(); },
      history: function () { return entry.samples.map(cloneEntry); }
    };
  }
  var perf = {
    mark: function (name) {
      var mark;
      if (!enabled) return;
      mark = { name: String(name == null ? '' : name), timestamp: now() };
      perfMarks.push(mark);
      perfMarkIndex[mark.name] = mark.timestamp;
      if (perfApi && typeof perfApi.mark === 'function') {
        try { perfApi.mark(mark.name); } catch (_) {}
      }
    },
    measure: function (name, start, end) {
      var startValue = typeof start === 'string' ? perfMarkIndex[start] : start;
      var endValue = typeof end === 'string' ? perfMarkIndex[end] : end;
      var item;
      if (!enabled) return { name: name, start: startValue, end: endValue, duration: 0 };
      if (typeof startValue !== 'number') startValue = now();
      if (typeof endValue !== 'number') endValue = now();
      item = { name: String(name == null ? '' : name), start: startValue, end: endValue, duration: endValue - startValue };
      perfMeasures.push(item);
      if (perfApi && typeof perfApi.measure === 'function' && typeof start === 'string' && typeof end === 'string') {
        try { perfApi.measure(item.name, start, end); } catch (_) {}
      }
      return snapshot(item);
    },
    getMarks: function () { return perfMarks.map(cloneEntry); },
    getMeasures: function () { return perfMeasures.map(cloneEntry); },
    clear: function () {
      perfMarks = [];
      perfMeasures = [];
      perfMarkIndex = {};
      if (perfApi && typeof perfApi.clearMarks === 'function') {
        try { perfApi.clearMarks(); } catch (_) {}
      }
      if (perfApi && typeof perfApi.clearMeasures === 'function') {
        try { perfApi.clearMeasures(); } catch (_) {}
      }
    },
    aggregate: function (name) {
      var values = perfMeasures.filter(function (item) { return item.name === name; }).map(function (item) { return item.duration; });
      var total = values.reduce(function (sum, value) { return sum + value; }, 0);
      return {
        count: values.length,
        avg: values.length ? total / values.length : 0,
        min: values.length ? Math.min.apply(Math, values) : 0,
        max: values.length ? Math.max.apply(Math, values) : 0,
        p50: percent(values, 0.50),
        p95: percent(values, 0.95),
        p99: percent(values, 0.99)
      };
    }
  };
  function timeline() {
    return timelineStore;
  }
  function report() {
    var counterData = {};
    var gaugeData = {};
    var key;
    for (key in counters) if (own(counters, key)) counterData[key] = counters[key].value;
    for (key in gauges) if (own(gauges, key)) gaugeData[key] = {
      current: snapshot(gauges[key].current),
      samples: gauges[key].samples.map(cloneEntry)
    };
    return {
      timeline: timelineStore.export(),
      counters: counterData,
      gauges: gaugeData,
      spans: spans.map(cloneEntry),
      measures: perf.getMeasures()
    };
  }
  function enable() {
    enabled = true;
    restartGauges();
    return enabled;
  }
  function disable() {
    enabled = false;
    stopGauges();
    return enabled;
  }
  function hook(moduleName, instance) {
    var seen = {};
    var cursor = instance;
    var keys = [];
    var i;
    var name;
    if (!isObject(instance)) return instance;
    while (cursor && cursor !== Object.prototype && cursor !== Function.prototype) {
      Object.getOwnPropertyNames(cursor).forEach(function (key) {
        if (key === 'constructor' || seen[key]) return;
        seen[key] = true;
        keys.push(key);
      });
      cursor = Object.getPrototypeOf(cursor);
    }
    for (i = 0; i < keys.length; i++) {
      name = keys[i];
      if (typeof instance[name] !== 'function' || instance[name].__bmOriginal) continue;
      (function (methodName, original) {
        var wrapped = trace(String(moduleName == null ? '' : moduleName) + '.' + methodName, function () {
          return original.apply(this, arguments);
        });
        wrapped.__bmOriginal = original;
        instance[methodName] = wrapped;
      })(name, instance[name]);
    }
    return instance;
  }

  return {
    trace: trace,
    span: createSpan,
    timeline: timeline,
    inspect: inspect,
    why: why,
    watch: watch,
    perf: perf,
    counter: counter,
    gauge: gauge,
    report: report,
    enable: enable,
    disable: disable,
    hook: hook
  };
})();

if (typeof module !== 'undefined') module.exports = BareMetal.Diagnostics;
