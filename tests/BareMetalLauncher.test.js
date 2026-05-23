/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Launcher.js');

function loadLauncher() {
  const code = fs.readFileSync(SRC, 'utf8');
  const mod = { exports: {} };
  delete global.window.BareMetal;
  const fn = new Function('window', 'globalThis', 'module', code + '\nreturn window.BareMetal.Launcher || module.exports;');
  return fn(global.window, global.window, mod);
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
});
