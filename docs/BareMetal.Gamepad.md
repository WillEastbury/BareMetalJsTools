# BareMetal.Gamepad

> Gamepad API helpers for polling, button and axis events, deadzone handling, haptics, combos, and controller profiles.

**Size:** 11 KB source / 8 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Gamepad.min.js"></script>
<script>
  BareMetal.Gamepad.on('buttondown', function (event) {
    console.log('Pressed:', event.name, 'on pad', event.index);
  });

  BareMetal.Gamepad.start({ pollRate: 16, deadzone: 0.15 });
</script>
```

## API Reference

### `poll()` → `array`

Reads connected controllers, normalizes them, emits connect/button/axis events, and returns cloned state snapshots.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const pads = BareMetal.Gamepad.poll();
console.log(pads[0]);
```

### `on(event, callback)` → `function`

Subscribes to `connect`, `disconnect`, `buttondown`, `buttonup`, or `axismove` events and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| event | string | — | Event name. |
| callback | function | — | Listener callback for the event payload. |

**Example:**
```js
const off = BareMetal.Gamepad.on('connect', function (event) {
  console.log(event.gamepad.profile);
});
```

### `off(event, callback)` → `void`

Removes a previously registered listener.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| event | string | — | Event name. |
| callback | function | — | Callback to remove. |

**Example:**
```js
BareMetal.Gamepad.off('connect', handler);
```

### `start(opts)` → `void`

Starts continuous polling using `requestAnimationFrame()` when available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Supports `pollRate` in ms and `deadzone` between `0` and `1`. |

**Example:**
```js
BareMetal.Gamepad.start({ pollRate: 33, deadzone: 0.2 });
```

### `stop()` → `void`

Stops the polling loop.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
BareMetal.Gamepad.stop();
```

### `getState(index)` → `object | null`

Returns a cloned snapshot for one gamepad index.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| index | number | — | Gamepad index to read. |

**Example:**
```js
const pad = BareMetal.Gamepad.getState(0);
```

### `isPressed(index, button)` → `boolean`

Checks whether a button is currently pressed.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| index | number | — | Gamepad index. |
| button | number \| string | — | Button index or alias such as `A`, `cross`, `start`, or `dpad-left`. |

**Example:**
```js
if (BareMetal.Gamepad.isPressed(0, 'A')) jump();
```

### `getAxis(index, axisIndex)` → `number`

Reads a normalized, deadzoned axis value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| index | number | — | Gamepad index. |
| axisIndex | number \| string | — | Axis index or alias such as `leftX`, `ly`, `axis:2`, or `rightY`. |

**Example:**
```js
const moveX = BareMetal.Gamepad.getAxis(0, 'leftX');
```

### `vibrate(index, opts)` → `Promise<boolean>`

Triggers gamepad haptics through `playEffect()` or `pulse()` when available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| index | number | — | Gamepad index. |
| opts | object | `{}` | Supports `duration`, `weakMagnitude`, and `strongMagnitude`. |

**Example:**
```js
await BareMetal.Gamepad.vibrate(0, { duration: 150, strongMagnitude: 1 });
```

### `map(index, mapping)` → `object`

Maps buttons and axes into an app-specific state object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| index | number | — | Gamepad index. |
| mapping | object | — | Mapping object. Values can be button names, axis names, `axis:*` strings, or `{ button }` / `{ axis }` descriptors. |

**Example:**
```js
const input = BareMetal.Gamepad.map(0, {
  jump: 'A',
  shoot: 'RT',
  moveX: 'leftX',
  moveY: { axis: 1 }
});
```

### `combo(index, sequence, callback, opts)` → `{ cancel() }`

Registers a timed button sequence detector.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| index | number | — | Gamepad index. |
| sequence | array | — | Ordered button tokens. |
| callback | function | — | Called with combo details when the sequence completes. |
| opts | object | `{}` | Supports `timeout` in ms and `once`. |

**Example:**
```js
const combo = BareMetal.Gamepad.combo(0, ['up', 'up', 'down', 'down', 'A'], function () {
  console.log('Combo!');
}, { timeout: 700 });
```

### `combo.cancel()` → `void`

Unregisters a combo listener.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
combo.cancel();
```

### `deadzone(value, threshold)` → `number`

Applies deadzone filtering to an axis value.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | number | — | Raw axis value between `-1` and `1`. |
| threshold | number | configured deadzone | Deadzone threshold. |

**Example:**
```js
const filtered = BareMetal.Gamepad.deadzone(rawAxis, 0.15);
```

### `normalize(gamepad)` → `object`

Normalizes a native `Gamepad` object into a predictable structure with profile-aware button names.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| gamepad | Gamepad | — | Native browser gamepad object. |

**Example:**
```js
const normalized = BareMetal.Gamepad.normalize(navigator.getGamepads()[0]);
```

### `profiles` → `object`

Built-in button and axis label maps for `xbox`, `ps`, and `generic` controllers.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | Read-only profile object. |

**Example:**
```js
console.log(BareMetal.Gamepad.profiles.xbox.buttons[0]); // 'A'
```

## Notes

- Button aliases include Xbox, PlayStation, D-pad, and numeric `ButtonN` names.
- `poll()` and `start()` apply the configured deadzone to axis snapshots before returning them.
- `buttondown` events feed combo detection automatically.
- `vibrate()` gracefully resolves `false` on unsupported controllers instead of throwing.
- Controller IDs are heuristically mapped to Xbox, PlayStation, or `generic` profiles.
