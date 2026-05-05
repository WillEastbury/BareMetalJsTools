var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.PubSub = (function(){
  'use strict';

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function copy(a, b) {
    var out = {}, k;
    for (k in (a || {})) if (own(a, k)) out[k] = a[k];
    for (k in (b || {})) if (own(b, k)) out[k] = b[k];
    return out;
  }
  function splitTopic(topic) { return String(topic == null ? '' : topic).split('.'); }
  function hasWildcard(topic) { return typeof topic === 'string' && topic.indexOf('*') > -1; }
  function matchParts(pattern, topic, pi, ti) {
    var i;
    if (pi === pattern.length) return ti === topic.length;
    if (pattern[pi] === '**') {
      if (pi === pattern.length - 1) return true;
      for (i = ti; i <= topic.length; i++) if (matchParts(pattern, topic, pi + 1, i)) return true;
      return false;
    }
    if (ti === topic.length) return false;
    if (pattern[pi] === '*' || pattern[pi] === topic[ti]) return matchParts(pattern, topic, pi + 1, ti + 1);
    return false;
  }
  function matches(pattern, topic) {
    if (pattern === topic) return true;
    if (!hasWildcard(pattern) || typeof topic !== 'string') return false;
    return matchParts(splitTopic(pattern), splitTopic(topic), 0, 0);
  }
  function makeMeta(topic, opts) {
    return {
      topic: topic,
      timestamp: Date.now(),
      source: opts && own(opts, 'source') ? opts.source : null
    };
  }
  function createBus() {
    var subscriptions = {};
    var stickyValues = new Map();
    var middlewares = [];
    var requestHandlers = {};
    var api;

    function tidy(topic) {
      if (subscriptions[topic] && !subscriptions[topic].length) delete subscriptions[topic];
    }
    function removeEntry(topic, entry) {
      var list = subscriptions[topic], i;
      if (!list) return;
      for (i = list.length - 1; i >= 0; i--) if (list[i] === entry) list.splice(i, 1);
      tidy(topic);
    }
    function dispatch(entry, data, meta, isAsync) {
      function call() {
        try { entry.handler(data, meta); } catch (_) {}
      }
      if (entry.once) removeEntry(entry.topic, entry);
      if (isAsync) setTimeout(call, 0);
      else call();
    }
    function subscribe(topic, handler, opts, skipSticky) {
      var entry;
      if (typeof handler !== 'function') return function() {};
      entry = { topic: topic, handler: handler, ns: opts && opts.ns || null, once: !!(opts && opts.once) };
      (subscriptions[topic] = subscriptions[topic] || []).push(entry);
      if (!skipSticky && stickyValues.has(topic)) {
        try { handler(stickyValues.get(topic).data, stickyValues.get(topic).meta); } catch (_) {}
        if (entry.once) removeEntry(topic, entry);
      }
      return function() { removeEntry(topic, entry); };
    }
    function getMatches(topic) {
      var out = [];
      var key, list, i;
      list = subscriptions[topic];
      if (list) for (i = 0; i < list.length; i++) out.push(list[i]);
      for (key in subscriptions) if (own(subscriptions, key) && key !== topic && hasWildcard(key) && matches(key, topic)) {
        list = subscriptions[key];
        for (i = 0; i < list.length; i++) out.push(list[i]);
      }
      return out;
    }
    function runHandlers(topic, data, opts) {
      var list = getMatches(topic);
      var meta = makeMeta(topic, opts);
      var isAsync = !!(opts && opts.async);
      var i;
      for (i = 0; i < list.length; i++) dispatch(list[i], data, meta, isAsync);
    }
    function runMiddlewares(topic, data, done, fail) {
      var list = [];
      var i;
      function step(index) {
        if (index >= list.length) return done();
        try { list[index](topic, data, function() { step(index + 1); }); }
        catch (err) { if (fail) fail(err); }
      }
      for (i = 0; i < middlewares.length; i++) if (!middlewares[i].pattern || matches(middlewares[i].pattern, topic)) list.push(middlewares[i].fn);
      step(0);
    }
    function on(topic, handler, opts) { return subscribe(topic, handler, opts, false); }
    function once(topic, handler, opts) { return subscribe(topic, handler, copy(opts, { once: true }), false); }
    function off(topic, handler) {
      var list = subscriptions[topic], i;
      if (!list) return api;
      if (!handler) {
        delete subscriptions[topic];
        return api;
      }
      for (i = list.length - 1; i >= 0; i--) if (list[i].handler === handler) list.splice(i, 1);
      tidy(topic);
      return api;
    }
    function offAll(topic) {
      if (own(subscriptions, topic)) delete subscriptions[topic];
      return api;
    }
    function offNs(ns) {
      var key, list, i;
      for (key in subscriptions) if (own(subscriptions, key)) {
        list = subscriptions[key];
        for (i = list.length - 1; i >= 0; i--) if (list[i].ns === ns) list.splice(i, 1);
        tidy(key);
      }
      return api;
    }
    function emit(topic, data, opts) {
      runMiddlewares(topic, data, function() { runHandlers(topic, data, opts || {}); });
      return api;
    }
    function sticky(topic, data, opts) {
      stickyValues.set(topic, { data: data, meta: makeMeta(topic, opts) });
      return emit(topic, data, opts);
    }
    function handle(topic, handler) {
      if (typeof handler !== 'function') return function() {};
      requestHandlers[topic] = handler;
      return function() {
        if (requestHandlers[topic] === handler) delete requestHandlers[topic];
      };
    }
    function request(topic, data) {
      return new Promise(function(resolve, reject) {
        runMiddlewares(topic, data, function() {
          var handler = requestHandlers[topic];
          if (typeof handler !== 'function') return reject(new Error('No handler for ' + topic));
          try { Promise.resolve(handler(data, makeMeta(topic, { source: 'request' }))).then(resolve, reject); }
          catch (err) { reject(err); }
        }, reject);
      });
    }
    function use(pattern, fn) {
      var entry;
      if (typeof pattern === 'function') {
        fn = pattern;
        pattern = null;
      }
      if (typeof fn !== 'function') return function() {};
      entry = { pattern: pattern, fn: fn };
      middlewares.push(entry);
      return function() {
        var i;
        for (i = middlewares.length - 1; i >= 0; i--) if (middlewares[i] === entry) middlewares.splice(i, 1);
      };
    }
    function channel(topic, opts) {
      var cfg = opts || {};
      var replay = cfg.replay > 0 ? cfg.replay : 0;
      var validate = typeof cfg.validate === 'function' ? cfg.validate : null;
      var buffer = [];
      var unsubs = [];
      var dead = false;
      function push(data, meta) {
        if (!replay) return;
        buffer.push({ data: data, meta: meta });
        if (buffer.length > replay) buffer.shift();
      }
      return {
        emit: function(data, emitOpts) {
          var meta;
          if (dead) return false;
          if (validate && !validate(data)) return false;
          meta = makeMeta(topic, emitOpts);
          push(data, meta);
          emit(topic, data, emitOpts);
          return true;
        },
        subscribe: function(fn, subOpts) {
          var i, unsub;
          if (typeof fn !== 'function') return function() {};
          for (i = 0; i < buffer.length; i++) {
            try { fn(buffer[i].data, buffer[i].meta); } catch (_) {}
          }
          if (dead) return function() {};
          unsub = subscribe(topic, fn, subOpts, true);
          unsubs.push(unsub);
          return function() {
            var i;
            for (i = unsubs.length - 1; i >= 0; i--) if (unsubs[i] === unsub) unsubs.splice(i, 1);
            unsub();
          };
        },
        history: function() {
          var out = [], i;
          for (i = 0; i < buffer.length; i++) out.push(buffer[i].data);
          return out;
        },
        last: function() { return buffer.length ? buffer[buffer.length - 1].data : null; },
        destroy: function() {
          var list = unsubs.slice();
          var i;
          dead = true;
          unsubs = [];
          buffer = [];
          for (i = 0; i < list.length; i++) list[i]();
        }
      };
    }
    function topics() {
      var out = [], key;
      for (key in subscriptions) if (own(subscriptions, key) && subscriptions[key].length) out.push(key);
      return out;
    }
    function subscribers(topic) {
      var total = 0, key;
      for (key in subscriptions) if (own(subscriptions, key) && (key === topic || (hasWildcard(key) && matches(key, topic)))) total += subscriptions[key].length;
      return total;
    }
    function has(topic) { return subscribers(topic) > 0; }
    function clear() {
      subscriptions = {};
      stickyValues = new Map();
      middlewares = [];
      requestHandlers = {};
      return api;
    }

    api = {
      on: on,
      emit: emit,
      once: once,
      off: off,
      offAll: offAll,
      offNs: offNs,
      clear: clear,
      sticky: sticky,
      channel: channel,
      handle: handle,
      request: request,
      use: use,
      create: createBus,
      topics: topics,
      subscribers: subscribers,
      has: has
    };
    return api;
  }

  return createBus();
})();
if(typeof module!=='undefined') module.exports = BareMetal.PubSub;
