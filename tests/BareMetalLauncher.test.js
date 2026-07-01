/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Launcher.js');

function loadLauncher() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Launcher.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Launcher', () => {
  let Launcher;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
    Launcher = loadLauncher();
  });

  test('createStore updates subscribers with cloned state', () => {
    const store = Launcher.createStore({ sessions: [] });
    const seen = [];

    store.subscribe((state) => seen.push(state));
    store.set({ sessions: [{ id: 's1' }] });
    const snapshot = store.get();
    snapshot.sessions[0].id = 'mutated';

    expect(store.get('sessions')).toEqual([{ id: 's1' }]);
    expect(seen).toEqual([{ sessions: [{ id: 's1' }] }]);
  });

  test('createApi wraps session endpoints and normalizes list payloads', async () => {
    const fetch = jest.fn((url, init) => Promise.resolve({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(url.endsWith('/sessions') ? { sessions: [{ id: 's1' }] } : { ok: true })
    }));
    const api = Launcher.createApi({ root: '/api', fetch });

    await expect(api.listSessions()).resolves.toEqual([{ id: 's1' }]);
    await api.startSession({ image: 'ubuntu' });
    await api.stopSession('s1');

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/sessions', expect.objectContaining({ method: 'GET' }));
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/sessions', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ image: 'ubuntu' })
    }));
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/sessions/s1', expect.objectContaining({ method: 'DELETE' }));
  });

  test('renderSessionCards shows idle state and action callbacks', () => {
    const host = document.createElement('div');
    const attached = [];

    Launcher.renderSessionCards(host, [
      { id: 'abc', title: 'Console', status: 'running', idleFor: '3m', owner: 'ada' }
    ], {
      onAttach: (session, id) => attached.push([session.title, id])
    });

    expect(host.querySelector('.bm-session-card').dataset.sessionId).toBe('abc');
    expect(host.querySelector('.bm-session-status').textContent).toBe('running');
    expect(host.querySelector('.bm-session-idle').textContent).toBe('idle 3m');

    host.querySelector('button').click();
    expect(attached).toEqual([['Console', 'abc']]);
  });

  test('createSocket reports status, sends data, and reconnects unexpected closes', () => {
    jest.useFakeTimers();
    const sockets = [];
    class FakeSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 0;
        this.sent = [];
        sockets.push(this);
      }
      send(data) { this.sent.push(data); }
      close(code) {
        this.readyState = 3;
        if (this.onclose) this.onclose({ code: code || 1000 });
      }
      open() {
        this.readyState = 1;
        if (this.onopen) this.onopen({});
      }
      message(data) {
        if (this.onmessage) this.onmessage({ data });
      }
    }
    const status = [];
    const messages = [];
    const socket = Launcher.createSocket('/terminal', {
      WebSocket: FakeSocket,
      reconnectDelay: 10,
      maxRetries: 1
    });
    socket.onStatus((s) => status.push(s));
    socket.onMessage((m) => messages.push(m));

    sockets[0].open();
    expect(socket.send('ls\r')).toBe(true);
    sockets[0].message('ok');
    sockets[0].readyState = 3;
    sockets[0].onclose({ code: 1006 });
    jest.advanceTimersByTime(10);

    expect(sockets).toHaveLength(2);
    expect(sockets[0].sent).toEqual(['ls\r']);
    expect(messages).toEqual(['ok']);
    expect(status).toEqual(expect.arrayContaining(['open', 'reconnecting']));
  });

  test('attachTerminal wires xterm-style data to socket and socket messages to terminal', () => {
    let onData;
    const term = {
      writes: [],
      opened: false,
      write(data) { this.writes.push(data); },
      open() { this.opened = true; },
      focus: jest.fn(),
      onData(cb) { onData = cb; return { dispose: jest.fn() }; }
    };
    const sent = [];
    const messageListeners = [];
    const socket = {
      send(data) { sent.push(data); return true; },
      onMessage(cb) { messageListeners.push(cb); return () => {}; }
    };

    Launcher.attachTerminal(document.createElement('div'), socket, { terminal: term });
    onData('pwd\r');
    messageListeners[0]('home\n');

    expect(term.opened).toBe(true);
    expect(term.focus).toHaveBeenCalled();
    expect(sent).toEqual(['pwd\r']);
    expect(term.writes).toEqual(['home\n']);
  });

  test('createApi handles missing fetch, text errors, and 204 responses', async () => {
    const unavailable = Launcher.createApi({ fetch: null });
    await expect(unavailable.listSessions()).rejects.toThrow(/fetch is not available/i);

    const fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: () => Promise.resolve('broken')
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: { get: () => '' }
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'text/plain' },
        text: () => Promise.resolve('ignored')
      });
    const api = Launcher.createApi({ root: '/api/', fetch, credentials: 'include', headers: { 'X-Test': '1' } });

    await expect(api.getSession('oops')).rejects.toThrow('broken');
    await expect(api.stopSession('gone')).resolves.toBeNull();
    await expect(api.startSession()).resolves.toBeNull();
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/sessions', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: expect.objectContaining({ 'X-Test': '1', 'Content-Type': 'application/json' })
    }));
  });

  test('renderSessionCards handles empty and stop actions', () => {
    const host = document.createElement('div');
    const stopped = [];

    Launcher.renderSessionCards(host, [], { emptyText: 'Nothing here' });
    expect(host.textContent).toContain('Nothing here');

    Launcher.renderSessionCards(host, [{ id: 's2', name: 'Demo', idle: true }], {
      onStop: (session, id) => stopped.push([session.name, id])
    });

    expect(host.querySelector('.bm-session-status').textContent).toBe('idle');
    host.querySelectorAll('button')[1].click();
    expect(stopped).toEqual([['Demo', 's2']]);
  });

  test('attachTerminal creates a fallback pre terminal and disposes listeners', () => {
    const host = document.createElement('div');
    const sent = [];
    const listeners = [];
    const socket = {
      send(data) { sent.push(data); return true; },
      onMessage(cb) { listeners.push(cb); return () => listeners.splice(listeners.indexOf(cb), 1); }
    };

    const attached = Launcher.attachTerminal(host, socket, {});
    const screen = host.querySelector('pre');
    screen.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    screen.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    screen.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    listeners[0]('hello');

    expect(sent).toEqual(['x', '\r', '\x7f']);
    expect(screen.textContent).toContain('hello');
    attached.destroy();
    expect(listeners).toEqual([]);
  });

  test('createSocket supports manual connect, error notifications, and intentional close', () => {
    jest.useFakeTimers();
    const sockets = [];
    class FakeSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 0;
        sockets.push(this);
      }
      close(code) {
        this.readyState = 3;
        if (this.onclose) this.onclose({ code: code || 1000 });
      }
    }
    const events = [];
    const socket = Launcher.createSocket('ws://example.test/terminal', {
      autoConnect: false,
      WebSocket: FakeSocket,
      reconnect: false
    });
    socket.onOpen(() => events.push('open'));
    socket.onError(() => events.push('error'));
    socket.onClose(() => events.push('close'));

    expect(socket.send('noop')).toBe(false);
    socket.connect();
    sockets[0].readyState = 1;
    sockets[0].onopen({});
    sockets[0].onerror({ message: 'fail' });
    socket.close();

    expect(events).toEqual(['open', 'error', 'close']);
    expect(socket.status()).toBe('closed');
  });

  test('createLauncher orchestrates api refresh, start, stop, and attachSocket', async () => {
    jest.useFakeTimers();
    const sessions = [{ id: 's1', title: 'Alpha', status: 'running' }];
    const api = {
      listSessions: jest.fn(() => Promise.resolve(sessions.slice())),
      startSession: jest.fn(() => Promise.resolve({ started: true })),
      stopSession: jest.fn(() => Promise.resolve({ stopped: true }))
    };
    const sockets = [];
    class FakeSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 0;
        sockets.push(this);
      }
      close(code) {
        this.readyState = 3;
        if (this.onclose) this.onclose({ code: code || 1000 });
      }
    }
    const host = document.createElement('div');
    const launcher = Launcher.createLauncher(host, {
      api,
      autoRefresh: false,
      terminalUrl: (id) => '/ws/' + id,
      socketOptions: { WebSocket: FakeSocket, autoConnect: false }
    });

    expect(launcher.store.get()).toEqual(expect.objectContaining({ sessions: [], socketStatus: 'idle' }));
    await expect(launcher.refresh()).resolves.toEqual(sessions);
    await expect(launcher.start({ image: 'ubuntu' })).resolves.toEqual({ started: true });
    await expect(launcher.stop('s1')).resolves.toEqual({ stopped: true });

    const attached = launcher.attachSocket('s1', document.createElement('div'));
    attached.socket.connect();
    sockets[0].readyState = 1;
    sockets[0].onopen({});

    expect(api.listSessions).toHaveBeenCalledTimes(3);
    expect(api.startSession).toHaveBeenCalledWith({ image: 'ubuntu' });
    expect(api.stopSession).toHaveBeenCalledWith('s1');
    expect(launcher.store.get('socketStatus')).toBe('open');
  });
});
