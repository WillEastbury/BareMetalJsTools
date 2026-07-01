/* istanbul ignore next */
var __bmLauncherRoot = (typeof globalThis !== 'undefined') ? globalThis : ((typeof window !== 'undefined') ? window : this);
var BareMetal = __bmLauncherRoot.BareMetal || {};
__bmLauncherRoot.BareMetal = BareMetal;
BareMetal.Launcher = (function(root) {
  'use strict';

  function noop() {}
  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function isFn(value) { return typeof value === 'function'; }
  function clone(value) {
    if (value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(clone);
    var out = {};
    Object.keys(value).forEach(function(key) { out[key] = clone(value[key]); });
    return out;
  }
  function merge(a, b) {
    var out = clone(a || {});
    Object.keys(b || {}).forEach(function(key) { out[key] = clone(b[key]); });
    return out;
  }
  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.data)) return value.data;
    if (value && Array.isArray(value.sessions)) return value.sessions;
    return [];
  }
  function resolveEl(el) {
    if (!el) return null;
    return typeof el === 'string' && root.document ? root.document.getElementById(el) : el;
  }
  function text(value, fallback) {
    value = value == null || value === '' ? fallback : value;
    return value == null ? '' : String(value);
  }
  function sessionId(session) {
    return session && (session.id || session.Id || session.sessionId || session.name || session.Name);
  }
  function sessionStatus(session) {
    return text(session && (session.status || session.state || session.phase), 'unknown').toLowerCase();
  }
  function isIdle(session) {
    var status = sessionStatus(session);
    return !!(session && (session.idle || session.isIdle || status === 'idle'));
  }
  function button(label, className, onClick) {
    var b = root.document.createElement('button');
    b.type = 'button';
    b.className = className || 'bt';
    b.textContent = label;
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  function emit(listeners, args) {
    listeners.slice().forEach(function(fn) {
      try { fn.apply(null, args); } catch (_) {}
    });
  }
  function add(list, cb) {
    if (!isFn(cb)) return noop;
    list.push(cb);
    return function() {
      var i = list.indexOf(cb);
      if (i >= 0) list.splice(i, 1);
    };
  }
  function wsUrl(path) {
    if (/^wss?:\/\//i.test(path)) return path;
    if (typeof root.location === 'undefined') return path;
    var scheme = root.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (path.charAt(0) !== '/') path = '/' + path;
    return scheme + '//' + root.location.host + path;
  }
  function backoff(attempt, opts) {
    var base = Math.max(0, Number(opts.reconnectDelay || 250));
    var max = Math.max(base, Number(opts.maxReconnectDelay || 5000));
    return Math.min(max, base * Math.pow(2, Math.max(0, attempt - 1)));
  }

  function createStore(initial) {
    var state = clone(initial || {});
    var listeners = [];
    return {
      get: function(key) {
        return key ? clone(state[key]) : clone(state);
      },
      set: function(patch) {
        var next = isFn(patch) ? patch(clone(state)) : patch;
        state = merge(state, next || {});
        emit(listeners, [clone(state)]);
        return clone(state);
      },
      replace: function(next) {
        state = clone(next || {});
        emit(listeners, [clone(state)]);
        return clone(state);
      },
      subscribe: function(cb) {
        return add(listeners, cb);
      }
    };
  }

  function createApi(opts) {
    opts = opts || {};
    var rootUrl = opts.root || '/api';
    var sessionsPath = opts.sessionsPath || '/sessions';
    var fetchImpl = opts.fetch || root.fetch;
    if (rootUrl.slice(-1) === '/') rootUrl = rootUrl.slice(0, -1);
    function url(path) {
      if (/^https?:\/\//i.test(path)) return path;
      return rootUrl + (path.charAt(0) === '/' ? path : '/' + path);
    }
    function request(method, path, body) {
      if (!fetchImpl) return Promise.reject(new Error('fetch is not available'));
      var headers = merge(opts.headers || {}, {});
      var init = { method: method, headers: headers };
      if (opts.credentials) init.credentials = opts.credentials;
      if (body !== undefined) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        init.body = JSON.stringify(body);
      }
      return Promise.resolve(fetchImpl(url(path), init)).then(function(res) {
        if (!res.ok) {
          return Promise.resolve(isFn(res.text) ? res.text() : '').then(function(msg) {
            throw new Error(msg || res.statusText || ('HTTP ' + res.status));
          });
        }
        if (res.status === 204) return null;
        var ct = res.headers && isFn(res.headers.get) ? (res.headers.get('content-type') || '') : '';
        return ct.indexOf('application/json') >= 0 && isFn(res.json) ? res.json() : null;
      });
    }
    return {
      request: request,
      listSessions: function() { return request('GET', sessionsPath).then(toArray); },
      getSession: function(id) { return request('GET', sessionsPath + '/' + encodeURIComponent(id)); },
      startSession: function(payload) { return request('POST', sessionsPath, payload || {}); },
      stopSession: function(id) { return request('DELETE', sessionsPath + '/' + encodeURIComponent(id)); }
    };
  }

  function createSocket(url, opts) {
    opts = opts || {};
    var WebSocketCtor = opts.WebSocket || root.WebSocket;
    var listeners = { status: [], message: [], open: [], close: [], error: [] };
    var socket = null;
    var closed = false;
    var attempt = 0;
    var timer = null;
    var status = 'idle';
    var api;
    function setStatus(next, meta) {
      status = next;
      emit(listeners.status, [status, meta || {}]);
    }
    function schedule() {
      if (closed || opts.reconnect === false) return;
      if (opts.maxRetries != null && attempt >= opts.maxRetries) {
        setStatus('closed', { reason: 'retry-limit' });
        return;
      }
      attempt++;
      setStatus('reconnecting', { attempt: attempt });
      timer = root.setTimeout(connect, backoff(attempt, opts));
    }
    function connect() {
      if (!WebSocketCtor) throw new Error('WebSocket is not available');
      if (timer) { root.clearTimeout(timer); timer = null; }
      closed = false;
      setStatus('connecting', { attempt: attempt });
      socket = new WebSocketCtor(wsUrl(url), opts.protocols);
      socket.binaryType = opts.binaryType || 'arraybuffer';
      socket.onopen = function(ev) {
        attempt = 0;
        setStatus('open');
        emit(listeners.open, [ev]);
      };
      socket.onmessage = function(ev) {
        emit(listeners.message, [ev.data, ev]);
      };
      socket.onerror = function(ev) {
        setStatus('error', { event: ev });
        emit(listeners.error, [ev]);
      };
      socket.onclose = function(ev) {
        var intentional = closed || (ev && ev.code === 1000);
        setStatus(intentional ? 'closed' : 'closed', { event: ev });
        emit(listeners.close, [ev]);
        if (!intentional) schedule();
      };
      return api;
    }
    api = {
      connect: connect,
      close: function(code, reason) {
        closed = true;
        if (timer) { root.clearTimeout(timer); timer = null; }
        if (socket && isFn(socket.close)) socket.close(code || 1000, reason || 'closed');
        setStatus('closed');
      },
      send: function(data) {
        if (!socket || socket.readyState !== 1) return false;
        socket.send(data);
        return true;
      },
      status: function() { return status; },
      socket: function() { return socket; },
      onStatus: function(cb) { return add(listeners.status, cb); },
      onMessage: function(cb) { return add(listeners.message, cb); },
      onOpen: function(cb) { return add(listeners.open, cb); },
      onClose: function(cb) { return add(listeners.close, cb); },
      onError: function(cb) { return add(listeners.error, cb); }
    };
    if (opts.autoConnect !== false) connect();
    return api;
  }

  function attachTerminal(target, socket, opts) {
    opts = opts || {};
    var container = resolveEl(opts.container || target);
    var term = opts.terminal || (target && isFn(target.write) ? target : null);
    var disposers = [];
    var screen = null;
    function write(data) {
      if (data == null) return;
      if (term && isFn(term.write)) term.write(data);
      else if (screen) {
        screen.textContent += typeof data === 'string' ? data : String(data);
        screen.scrollTop = screen.scrollHeight;
      }
    }
    if (term) {
      if (container && isFn(term.open)) term.open(container);
      if (isFn(term.onData)) {
        var sub = term.onData(function(data) { socket.send(data); });
        if (sub && isFn(sub.dispose)) disposers.push(function() { sub.dispose(); });
      }
      if (isFn(term.focus)) term.focus();
    } else if (container && root.document) {
      screen = root.document.createElement('pre');
      screen.className = opts.className || 'bm-terminal';
      screen.tabIndex = 0;
      container.replaceChildren(screen);
      var keyHandler = function(ev) {
        if (ev.key && ev.key.length === 1) socket.send(ev.key);
        else if (ev.key === 'Enter') socket.send('\r');
        else if (ev.key === 'Backspace') socket.send('\x7f');
      };
      screen.addEventListener('keydown', keyHandler);
      disposers.push(function() { screen.removeEventListener('keydown', keyHandler); });
    }
    disposers.push(socket.onMessage(write));
    return {
      write: write,
      destroy: function() {
        disposers.splice(0).forEach(function(fn) { fn(); });
      }
    };
  }

  function renderSessionCards(container, sessions, opts) {
    opts = opts || {};
    container = resolveEl(container);
    if (!container || !root.document) return container;
    container.replaceChildren();
    sessions = toArray(sessions);
    if (!sessions.length) {
      var empty = root.document.createElement('p');
      empty.className = opts.emptyClass || 'muted';
      empty.textContent = opts.emptyText || 'No sessions yet.';
      container.appendChild(empty);
      return container;
    }
    sessions.forEach(function(session) {
      var id = sessionId(session);
      var card = root.document.createElement('article');
      card.className = opts.cardClass || 'cd bm-session-card';
      card.dataset.sessionId = text(id);

      var title = root.document.createElement('h3');
      title.textContent = text(session.title || session.name || session.Name || id, 'Session');
      card.appendChild(title);

      var meta = root.document.createElement('p');
      meta.className = 'bm-session-meta';
      meta.textContent = text(session.owner || session.user || session.host, '');
      if (meta.textContent) card.appendChild(meta);

      var badge = root.document.createElement('span');
      badge.className = 'bm-session-status ' + (isIdle(session) ? 'idle' : sessionStatus(session));
      badge.textContent = isIdle(session) ? 'idle' : sessionStatus(session);
      card.appendChild(badge);

      if (session.updatedAt || session.lastActive || session.idleFor) {
        var idle = root.document.createElement('small');
        idle.className = 'bm-session-idle';
        idle.textContent = session.idleFor ? ('idle ' + session.idleFor) : ('last active ' + text(session.lastActive || session.updatedAt));
        card.appendChild(idle);
      }

      var actions = root.document.createElement('div');
      actions.className = 'bm-session-actions';
      actions.appendChild(button(opts.attachText || 'Attach', 'bt', function() {
        if (opts.onAttach) opts.onAttach(session, id);
      }));
      if (opts.onStop) actions.appendChild(button(opts.stopText || 'Stop', 'bt danger', function() { opts.onStop(session, id); }));
      card.appendChild(actions);
      container.appendChild(card);
    });
    return container;
  }

  function createLauncher(container, opts) {
    opts = opts || {};
    var api = opts.api || createApi(opts.apiOptions || opts);
    var store = opts.store || createStore({ sessions: [], loading: false, error: null, socketStatus: 'idle' });
    var cardOptions = merge(opts.cardOptions || {}, {
      onAttach: function(session, id) {
        if (opts.onAttach) opts.onAttach(session, id, launcher);
      },
      onStop: function(session, id) {
        launcher.stop(id);
      }
    });
    var launcher;
    function render() {
      var state = store.get();
      renderSessionCards(container, state.sessions, cardOptions);
    }
    store.subscribe(render);
    launcher = {
      store: store,
      api: api,
      render: render,
      refresh: function() {
        store.set({ loading: true, error: null });
        return api.listSessions().then(function(sessions) {
          store.set({ sessions: sessions, loading: false });
          return sessions;
        }, function(err) {
          store.set({ loading: false, error: err && err.message ? err.message : String(err) });
          throw err;
        });
      },
      start: function(payload) {
        return api.startSession(payload || {}).then(function(result) {
          return launcher.refresh().then(function() { return result; });
        });
      },
      stop: function(id) {
        return api.stopSession(id).then(function(result) {
          return launcher.refresh().then(function() { return result; });
        });
      },
      attachSocket: function(id, target, socketOptions) {
        var path = isFn(opts.terminalUrl) ? opts.terminalUrl(id) : (opts.terminalUrl || ('/sessions/' + encodeURIComponent(id) + '/terminal'));
        var sock = createSocket(path, socketOptions || opts.socketOptions || {});
        sock.onStatus(function(status) { store.set({ socketStatus: status }); });
        return { socket: sock, terminal: attachTerminal(target, sock, socketOptions || {}) };
      }
    };
    render();
    if (opts.autoRefresh !== false) launcher.refresh().catch(noop);
    return launcher;
  }

  return {
    createStore: createStore,
    createApi: createApi,
    createSocket: createSocket,
    attachTerminal: attachTerminal,
    renderSessionCards: renderSessionCards,
    createLauncher: createLauncher
  };
})(__bmLauncherRoot);

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Launcher;
else if (typeof exports !== 'undefined') exports.Launcher = BareMetal.Launcher;
