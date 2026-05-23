# BareMetal.Launcher

> Tiny helpers for hosted multi-user terminal launchers: session cards, API calls, state, idle display, and reconnecting WebSocket terminal attach.

**Dependencies:** none. Optional xterm.js integration is duck-typed; pass an existing terminal instance if you already load xterm.

## Quick Start

```html
<link href="../src/BareMetalStyles.css" rel="stylesheet">
<script src="../src/BareMetal.Launcher.js"></script>

<div id="sessions"></div>
<div id="terminal"></div>

<script>
  const launcher = BareMetal.Launcher.createLauncher('sessions', {
    apiOptions: { root: '/api', sessionsPath: '/sessions' },
    terminalUrl: id => `/sessions/${encodeURIComponent(id)}/terminal`,
    onAttach(session, id, app) {
      app.attachSocket(id, 'terminal');
    }
  });
</script>
```

## API Reference

### `createStore(initial)`

Small observable store for launcher UI state.

```js
const store = BareMetal.Launcher.createStore({ sessions: [] });
store.subscribe(state => console.log(state.sessions.length));
store.set({ sessions: [{ id: 's1', status: 'running' }] });
```

Returns `{ get(key), set(patch), replace(next), subscribe(cb) }`. Values are cloned on read/write to keep UI code predictable.

### `createApi(options)`

Fetch wrapper for a conventional sessions API.

| Option | Default | Description |
|---|---:|---|
| `root` | `/api` | API root |
| `sessionsPath` | `/sessions` | Sessions collection path under `root` |
| `fetch` | `window.fetch` | Custom fetch for tests/adapters |
| `headers` | `{}` | Extra headers |
| `credentials` | — | Fetch credentials mode |

Methods:

- `listSessions()` → normalizes `[]`, `{ data: [] }`, or `{ sessions: [] }`
- `getSession(id)`
- `startSession(payload)`
- `stopSession(id)`
- `request(method, path, body)`

### `renderSessionCards(container, sessions, options)`

Renders plain DOM cards. It intentionally does not require a framework or `BareMetal.Bind`.

```js
BareMetal.Launcher.renderSessionCards('sessions', sessions, {
  onAttach(session, id) { console.log('attach', id); },
  onStop(session, id) { console.log('stop', id); }
});
```

Cards display title/name/id, owner/host, status, and idle state (`idle`, `isIdle`, status `idle`, `idleFor`, `lastActive`, or `updatedAt`).

### `createSocket(url, options)`

Reconnect-capable WebSocket wrapper for terminal attach.

```js
const socket = BareMetal.Launcher.createSocket('/sessions/s1/terminal', {
  reconnectDelay: 250,
  maxReconnectDelay: 5000
});

socket.onStatus(status => console.log(status)); // connecting/open/reconnecting/closed/error
socket.onMessage(data => console.log(data));
socket.send('ls\r');
```

Pass `reconnect: false` to disable reconnects, or `maxRetries` to cap attempts.

### `attachTerminal(target, socket, options)`

Bridges socket messages to either:

- an xterm-style object (`write`, `open`, `onData`, `focus`), or
- a fallback `<pre>` terminal surface that sends basic key input.

```js
const terminal = new Terminal();
BareMetal.Launcher.attachTerminal('terminal', socket, { terminal });
```

### `createLauncher(container, options)`

Composes the store, API, card renderer, and terminal attach.

```js
const app = BareMetal.Launcher.createLauncher('sessions', {
  apiOptions: { root: '/api' },
  terminalUrl: id => `/sessions/${id}/terminal`,
  onAttach(session, id, app) {
    app.attachSocket(id, 'terminal');
  }
});
```

Returns `{ store, api, render, refresh, start, stop, attachSocket }`.
