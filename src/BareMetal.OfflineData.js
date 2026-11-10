var __bmOfflineDataRoot = typeof window !== 'undefined' ? window :
  (typeof globalThis !== 'undefined' ? globalThis : this);
__bmOfflineDataRoot.BareMetal = __bmOfflineDataRoot.BareMetal ||
  ((typeof BareMetal !== 'undefined' && BareMetal) ? BareMetal : {});
var BareMetal = __bmOfflineDataRoot.BareMetal;

BareMetal.OfflineData = (function () {
  'use strict';

  var sequence = 0;

  function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isObject(value) {
    return !!value && Object.prototype.toString.call(value) === '[object Object]';
  }

  function clone(value) {
    var output;
    var key;
    var index;
    if (value == null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) {
      output = [];
      for (index = 0; index < value.length; index++) output.push(clone(value[index]));
      return output;
    }
    output = {};
    for (key in value) if (own(value, key)) output[key] = clone(value[key]);
    return output;
  }

  function makeId() {
    var cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
    sequence++;
    return 'offline-' + Date.now().toString(36) + '-' + sequence.toString(36);
  }

  function conflictError(error) {
    var status = Number(error && (error.status || (error.response && error.response.status)));
    return status === 409 || status === 412 || !!(error && error.code === 'CONFLICT');
  }

  async function responseValue(response) {
    if (!response || typeof response.ok !== 'boolean' || typeof response.status !== 'number') return response;
    if (!response.ok) {
      var error = new Error('Offline mutation failed with HTTP ' + response.status);
      error.status = response.status;
      if (response.status === 409 || response.status === 412) {
        var body = await response.clone().text();
        try {
          var parsed = body ? JSON.parse(body) : null;
          error.remote = parsed && (parsed.remote || parsed.current || parsed.record || parsed.data || parsed);
        } catch (_) {
          error.remote = body || null;
        }
      }
      throw error;
    }
    if (response.status === 204) return undefined;
    var contentType = response.headers && response.headers.get ? response.headers.get('content-type') || '' : '';
    return /json/i.test(contentType) ? response.json() : response.text();
  }

  function create(options) {
    var cfg = options || {};
    var db = cfg.db;
    var recordStore = cfg.recordStore || 'records';
    var outboxStore = cfg.outboxStore || 'outbox';
    var keyField = cfg.keyField || 'id';
    var send = cfg.send;
    var listeners = {};
    var flushing = null;
    var autoSyncStarted = false;
    var onlineHandler = null;
    var api;
    if (!db || typeof db.get !== 'function' || typeof db.put !== 'function' ||
        typeof db.getAll !== 'function' || typeof db.transaction !== 'function') {
      throw new TypeError('OfflineData requires a BareMetal.IDB database with transaction support');
    }
    if (typeof send !== 'function') throw new TypeError('OfflineData requires a send(operation) function');
    if (!BareMetal.Sync || typeof BareMetal.Sync.merge !== 'function') {
      throw new Error('Load BareMetal.Sync.js before BareMetal.OfflineData.js');
    }

    function emit(type, payload) {
      (listeners[type] || []).slice().forEach(function (handler) {
        try { handler(clone(payload)); } catch (_) {}
      });
    }

    function on(type, handler) {
      if (typeof handler !== 'function') throw new TypeError('Event handler must be a function');
      (listeners[type] = listeners[type] || []).push(handler);
      return function () {
        var handlers = listeners[type] || [];
        var index = handlers.indexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
      };
    }

    function atomic(work) {
      return db.transaction([recordStore, outboxStore], 'readwrite', work);
    }

    function storeRecord(tx, key, value, remove) {
      if (remove || value == null) tx.store(recordStore).delete(key);
      else tx.store(recordStore).put(value);
    }

    async function mutate(input) {
      var item = input || {};
      if (item.key == null) throw new TypeError('Offline mutation requires a record key');
      var remove = item.remove === true;
      if (!remove && !isObject(item.value)) throw new TypeError('Offline put mutations require a record object');
      var optimistic = remove ? null : clone(item.value);
      if (optimistic && !own(optimistic, keyField)) optimistic[keyField] = item.key;
      if (optimistic && String(optimistic[keyField]) !== String(item.key)) {
        throw new Error('Record key does not match the requested mutation key');
      }
      var entry = {
        id: item.id || makeId(),
        key: item.key,
        kind: remove ? 'delete' : 'put',
        request: clone(item.request || {}),
        base: null,
        optimistic: optimistic,
        status: 'pending',
        attempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await atomic(function (tx) {
        var getRequest = tx.store(recordStore).get(item.key);
        getRequest.onsuccess = function () {
          entry.base = clone(getRequest.result === undefined ? null : getRequest.result);
          storeRecord(tx, item.key, optimistic, remove);
          tx.store(outboxStore).put(entry);
        };
      });
      emit('optimistic', entry);
      emit('change', { type: 'optimistic', entry: entry });
      requestAutoFlush();
      return clone(entry);
    }

    function remove(key, request) {
      return mutate({ key: key, request: request, remove: true });
    }

    async function listOutbox() {
      var entries = await db.getAll(outboxStore);
      return entries.sort(function (left, right) { return left.createdAt - right.createdAt; });
    }

    async function pending() {
      return (await listOutbox()).filter(function (entry) { return entry.status === 'pending'; });
    }

    async function conflicts() {
      return (await listOutbox()).filter(function (entry) { return entry.status === 'conflict'; });
    }

    async function saveConflict(entry, error) {
      var remote = own(error, 'remote') ? clone(error.remote) : null;
      var merged = BareMetal.Sync.merge(entry.optimistic, remote, entry.base, 'field-level');
      entry.status = 'conflict';
      entry.remote = remote;
      entry.mergeProposal = clone(merged.result);
      entry.conflicts = clone(merged.conflicts);
      entry.lastError = error.message || String(error);
      entry.updatedAt = Date.now();
      await db.put(outboxStore, entry);
      emit('conflict', entry);
      emit('change', { type: 'conflict', entry: entry });
      return entry;
    }

    async function settle(entry, serverValue) {
      var value = serverValue === undefined ? entry.optimistic : serverValue;
      await atomic(function (tx) {
        storeRecord(tx, entry.key, entry.kind === 'delete' ? null : value, entry.kind === 'delete');
        tx.store(outboxStore).delete(entry.id);
      });
      emit('sent', { entry: entry, record: value });
      emit('change', { type: 'sent', entry: entry });
    }

    async function runFlush() {
      var entries = await pending();
      var sent = [];
      var index;
      for (index = 0; index < entries.length; index++) {
        var entry = entries[index];
        try {
          var rawResult = await send(clone(entry));
          var result = await responseValue(rawResult);
          var serverValue = result && isObject(result) && own(result, 'record') ? result.record : result;
          await settle(entry, serverValue);
          sent.push(entry.id);
        } catch (error) {
          if (conflictError(error)) {
            var conflict = await saveConflict(entry, error);
            return { sent: sent, conflict: clone(conflict), remaining: (await pending()).length };
          }
          entry.attempts = (entry.attempts || 0) + 1;
          entry.lastError = error.message || String(error);
          entry.updatedAt = Date.now();
          await db.put(outboxStore, entry);
          emit('error', { entry: entry, error: error, attempts: entry.attempts });
          emit('change', { type: 'error', entry: entry });
          throw error;
        }
      }
      return { sent: sent, conflict: null, remaining: (await pending()).length };
    }

    function flush() {
      if (flushing) return flushing;
      var running = runFlush();
      flushing = running.finally(function () { flushing = null; });
      return flushing;
    }

    function requestAutoFlush() {
      if (!autoSyncStarted || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
      if (flushing) {
        flushing.catch(function () {}).then(function () {
          if (autoSyncStarted && !(typeof navigator !== 'undefined' && navigator.onLine === false)) flush().catch(function () {});
        });
      } else {
        flush().catch(function () {});
      }
    }

    function startAutoSync() {
      if (autoSyncStarted) return api;
      autoSyncStarted = true;
      onlineHandler = requestAutoFlush;
      if (__bmOfflineDataRoot && typeof __bmOfflineDataRoot.addEventListener === 'function') {
        __bmOfflineDataRoot.addEventListener('online', onlineHandler);
      }
      requestAutoFlush();
      return api;
    }

    function stopAutoSync() {
      if (onlineHandler && __bmOfflineDataRoot && typeof __bmOfflineDataRoot.removeEventListener === 'function') {
        __bmOfflineDataRoot.removeEventListener('online', onlineHandler);
      }
      autoSyncStarted = false;
      onlineHandler = null;
      return api;
    }

    async function resolve(id, choice) {
      var entry = await db.get(outboxStore, id);
      if (!entry || entry.status !== 'conflict') throw new Error('Conflict not found: ' + id);
      var value;
      var resolution = choice;
      if (choice === 'remote') {
        await atomic(function (tx) {
          storeRecord(tx, entry.key, entry.remote, entry.kind === 'delete' || entry.remote == null);
          tx.store(outboxStore).delete(entry.id);
        });
        emit('resolved', { id: id, choice: 'remote', record: entry.remote });
        emit('change', { type: 'resolved', id: id });
        return { resolved: true, queued: false, value: clone(entry.remote) };
      }
      if (choice === 'local') value = clone(entry.optimistic);
      else if (choice === 'merge') {
        if (entry.conflicts && entry.conflicts.length) {
          return { resolved: false, conflicts: clone(entry.conflicts), proposal: clone(entry.mergeProposal) };
        }
        value = clone(entry.mergeProposal);
      } else if (isObject(choice) && own(choice, 'value')) value = clone(choice.value);
      else if (isObject(choice) && own(choice, 'resolutions')) {
        value = BareMetal.Sync.resolve(entry.conflicts || [], choice.resolutions);
      } else {
        resolution = 'manual';
        value = clone(choice);
      }
      if (!entry || (value == null && entry.kind !== 'delete')) throw new TypeError('A resolved record value is required');
      entry.base = clone(entry.remote);
      entry.optimistic = clone(value);
      entry.status = 'pending';
      entry.attempts = 0;
      entry.updatedAt = Date.now();
      delete entry.remote;
      delete entry.conflicts;
      delete entry.mergeProposal;
      delete entry.lastError;
      await atomic(function (tx) {
        storeRecord(tx, entry.key, value, entry.kind === 'delete');
        tx.store(outboxStore).put(entry);
      });
      emit('resolved', { id: id, choice: resolution, record: value });
      emit('change', { type: 'resolved', id: id });
      return { resolved: true, queued: true, value: clone(value), entry: clone(entry) };
    }

    function mountConflictUI(target) {
      var host = typeof target === 'string' ? document.querySelector(target) : target;
      if (!host) throw new Error('Conflict UI target not found');
      var section = document.createElement('section');
      var status = document.createElement('p');
      section.className = 'bm-offline-conflicts';
      status.className = 'sm fg-m';
      status.setAttribute('role', 'status');
      section.appendChild(status);
      host.replaceChildren(section);
      var destroyed = false;
      var unsubscribe = on('change', function () { refresh().catch(showError); });

      function showError(error) {
        status.textContent = 'Conflict list failed: ' + (error.message || String(error));
      }

      async function refresh() {
        var entries = await conflicts();
        if (destroyed) return entries;
        section.replaceChildren(status);
        status.textContent = entries.length ? entries.length + ' unresolved conflict(s)' : 'No unresolved conflicts';
        entries.forEach(function (entry) {
          var card = document.createElement('article');
          var title = document.createElement('h3');
          var local = document.createElement('pre');
          var remote = document.createElement('pre');
          var editor = document.createElement('textarea');
          var actions = document.createElement('div');
          title.textContent = 'Record ' + entry.key + ' · ' + (entry.lastError || 'Conflict');
          local.textContent = 'Your version\n' + JSON.stringify(entry.optimistic, null, 2);
          remote.textContent = 'Server version\n' + JSON.stringify(entry.remote, null, 2);
          editor.className = 'fc';
          editor.setAttribute('aria-label', 'Merged record JSON');
          editor.value = JSON.stringify(entry.mergeProposal || entry.optimistic, null, 2);
          actions.className = 'fx fx-w gp1';
          card.className = 'cd p-2 mb-2';
          card.appendChild(title);
          card.appendChild(local);
          card.appendChild(remote);
          card.appendChild(editor);
          card.appendChild(actions);
          [['Keep mine', 'local'], ['Use server', 'remote']].forEach(function (action) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'bt bt-os bt-s';
            button.textContent = action[0];
            button.addEventListener('click', function () {
              resolve(entry.id, action[1]).then(refresh).catch(showError);
            });
            actions.appendChild(button);
          });
          var apply = document.createElement('button');
          apply.type = 'button';
          apply.className = 'bt bt-p bt-s';
          apply.textContent = 'Apply edited merge';
          apply.addEventListener('click', function () {
            var value;
            try { value = JSON.parse(editor.value); }
            catch (error) { showError(new Error('Merged value must be valid JSON: ' + error.message)); return; }
            resolve(entry.id, { value: value }).then(refresh).catch(showError);
          });
          actions.appendChild(apply);
          section.appendChild(card);
        });
        return entries;
      }

      refresh().catch(showError);
      return {
        el: section,
        refresh: refresh,
        destroy: function () { destroyed = true; unsubscribe(); section.remove(); }
      };
    }

    api = {
      mutate: mutate,
      put: function (key, value, request) { return mutate({ key: key, value: value, request: request }); },
      remove: remove,
      get: function (key) { return db.get(recordStore, key); },
      all: function () { return db.getAll(recordStore); },
      pending: pending,
      conflicts: conflicts,
      flush: flush,
      resolve: resolve,
      on: on,
      mountConflictUI: mountConflictUI,
      startAutoSync: startAutoSync,
      stopAutoSync: stopAutoSync,
      destroy: function () { stopAutoSync(); listeners = {}; }
    };
    if (cfg.autoFlush === true) startAutoSync();
    return api;
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.OfflineData;
