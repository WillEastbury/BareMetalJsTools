# BareMetal.Session

> Session lifecycle, token rotation, activity tracking, and cross-tab coordination.

**Size:** 20 KB source / 9 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Session.min.js"></script>
<script>
  const session = BareMetal.Session.create({
    ttl: 30 * 60 * 1000,
    syncTabs: true,
    refreshFn: async data => ({ ...data, token: 'fresh-token' })
  });

  session.init({ userId: 7, token: 'abc123' });
</script>
```

## API Reference

### `create(opts)` → `object`

Creates a managed session store with expiry, refresh, and optional tab sync.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Session options such as `ttl`, `refreshBefore`, `key`, `storage`, `syncTabs`, `refreshFn`, `onExpire`, and `onRefresh`. |

**Example:**
```js
const session = BareMetal.Session.create({
  ttl: 15 * 60 * 1000,
  refreshBefore: 60 * 1000,
  storage: 'localStorage',
  syncTabs: true
});
```

**Session methods:**

| Method | Description |
|--------|-------------|
| `init(data)` | Sets the starting session payload and arms expiry timers. |
| `get(keyName)` | Returns one cloned session value. |
| `set(keyName, value)` | Updates one field and persists the session. |
| `getData()` | Returns the full cloned session payload. |
| `destroy()` | Clears data, timers, and persisted state. |
| `isActive()` | Returns `true` while the session is valid. |
| `getExpiry()` | Returns the current expiry as a `Date` or `null`. |
| `refresh(refreshFn)` | Refreshes session data using the configured or supplied function. |
| `rotate(rotateOpts)` | Refreshes the session and applies rotation metadata. |
| `onExpire(cb)` | Subscribes to expiry events. |
| `onRefresh(cb)` | Subscribes to refresh events. |
| `onChange(cb)` | Subscribes to any session mutation. |
| `extend(extraTtl)` | Pushes the expiry window forward. |

### `tabSync(key)` → `object`

Creates a small cross-tab message bus backed by `BroadcastChannel` or storage events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | string | — | Channel or storage key used for tab messages. |

**Example:**
```js
const sync = BareMetal.Session.tabSync('bm_session');
sync.onMessage(msg => console.log('tab update', msg));
sync.broadcast({ type: 'destroy' });
```

**Tab sync methods:**

| Method | Description |
|--------|-------------|
| `broadcast(message)` | Sends a message to other tabs. |
| `onMessage(cb)` | Subscribes to incoming messages. |
| `destroy()` | Removes event listeners and closes the channel. |

### `guard(checkFn, redirectFn)` → `function`

Creates a session guard for routes, actions, or async flows.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| checkFn | function | — | Predicate that receives the context. |
| redirectFn | function | `undefined` | Optional fallback when the check fails. |

**Example:**
```js
const requireSession = BareMetal.Session.guard(
  ctx => ctx.session.isActive(),
  () => location.hash = '#/login'
);
```

### `fingerprint()` → `string`

Builds a lightweight browser fingerprint string for session correlation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
const sessionId = BareMetal.Session.fingerprint();
```

### `activity(opts)` → `object`

Creates an activity tracker for idle timeout and last-seen timestamps.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Activity options such as `events`, `target`, `throttle`, `onActive`, and `onIdle`. |

**Example:**
```js
const tracker = BareMetal.Session.activity({
  onIdle: () => console.log('user idle')
});
tracker.start();
```

**Activity methods:**

| Method | Description |
|--------|-------------|
| `start()` | Starts listening for activity events. |
| `stop()` | Stops listening. |
| `touch()` | Records activity manually. |
| `lastActive()` | Returns the last activity timestamp. |
| `idleFor()` | Returns idle time in milliseconds. |
| `isIdle(timeout)` | Checks whether idle time exceeds a threshold. |

## Notes
- Session reads and writes are cloned, so mutating an object returned by `getData()` will not update stored state.
- `refresh()` requires either `opts.refreshFn` or an explicit refresh function argument.
- `syncTabs: true` mirrors changes and destroys across tabs when the environment supports it.
- `extend()` is useful when you want sliding expiry without changing session data.
