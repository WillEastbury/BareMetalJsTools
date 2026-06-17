# BareMetal.Capabilities

> Feature detection, environment profiling, permissions, and graceful degradation helpers.

**Size:** 23 KB source / 12 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Capabilities.min.js"></script>
<script>
  const required = BareMetal.Capabilities.require(['fetch', 'localStorage', 'serviceWorker']);
  if (!required.ok) console.warn('Missing features:', required.missing);
  console.log(BareMetal.Capabilities.profile());
</script>
```

## API Reference

### `detect(feature)` → `boolean`

Checks one built-in or custom capability detector.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| feature | string | — | Feature name such as `fetch`, `webgl`, or `serviceWorker`. |

**Example:**
```js
BareMetal.Capabilities.detect('serviceWorker');
```

### `detectAll(features)` → `object`

Returns a capability map for the requested features or every registered detector.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| features | array | `undefined` | Optional feature list. When omitted, all built-in and custom detectors are evaluated. |

**Example:**
```js
const caps = BareMetal.Capabilities.detectAll(['fetch', 'webgl', 'clipboard']);
```

### `profile()` → `object`

Builds a snapshot of the current browser, device, display, and preference profile.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
const profile = BareMetal.Capabilities.profile();
console.log(profile.browser, profile.os, profile.darkMode);
```

### `supports(feature, fallbackValue)` → `boolean | any`

Returns `true` when supported, or resolves a fallback value when unsupported.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| feature | string | — | Capability to check. |
| fallbackValue | any | `undefined` | Optional fallback value or function. |

**Example:**
```js
const workerCount = BareMetal.Capabilities.supports('worker', () => 1);
```

### `fallback(...options)` → `any`

Selects the first supported fallback option.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | any[] | — | Feature names or option objects with `feature`, `value`, `use`, `detect`, or `test`. |

**Example:**
```js
const transport = BareMetal.Capabilities.fallback(
  { feature: 'websocket', value: 'ws' },
  { feature: 'fetch', value: 'http' },
  { value: 'poll' }
);
```

### `permission(name)` → `Promise<string>`

Reads the current permission state for a browser capability.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Permission name such as `geo`, `camera`, `mic`, `clipboard`, or `notification`. |

**Example:**
```js
const state = await BareMetal.Capabilities.permission('camera');
```

### `requestPermission(name)` → `Promise<string>`

Prompts for a permission when the platform supports doing so.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Permission to request. |

**Example:**
```js
const result = await BareMetal.Capabilities.requestPermission('notification');
```

### `register(name, detectFn)` → `object`

Registers a custom detector and returns the module API for chaining.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Custom feature name. |
| detectFn | function | — | Detector that returns a truthy or falsy result. |

**Example:**
```js
BareMetal.Capabilities.register('wide-screen', () => window.innerWidth >= 1440);
```

### `require(features)` → `{ supported, missing, ok }`

Checks whether all required capabilities are available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| features | array | — | Required feature names. |

**Example:**
```js
const check = BareMetal.Capabilities.require(['fetch', 'localStorage']);
if (!check.ok) console.warn(check.missing);
```

### `degrade(features, levels)` → `object | null`

Picks the first compatible degradation level.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| features | array | — | Available features or degradation levels when using the single-argument form. |
| levels | array | `undefined` | Ordered degradation options. |

**Example:**
```js
const mode = BareMetal.Capabilities.degrade([
  { name: 'rich', requires: ['webgl', 'worker'] },
  { name: 'basic', requires: ['fetch'] },
  { name: 'minimal', requires: [] }
]);
```

### `onChange(callback)` → `function`

Subscribes to capability changes such as media queries or connectivity changes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Called whenever the capability snapshot changes. |

**Example:**
```js
const off = BareMetal.Capabilities.onChange(snapshot => {
  console.log('capabilities changed', snapshot);
});
```

### `constraints()` → `object`

Returns estimated runtime limits for workers, memory, connection, and battery.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
const limits = BareMetal.Capabilities.constraints();
console.log(limits.maxWorkers, limits.connection);
```

### `score()` → `number`

Calculates a rough 0–100 capability score for progressive enhancement decisions.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | This function takes no parameters. |

**Example:**
```js
const score = BareMetal.Capabilities.score();
```

### `compare(required, available)` → `object`

Compares required and optional features against an available feature list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| required | array \| object | — | Required feature list or an object with `required`/`optional`. |
| available | array | — | Available feature list. |

**Example:**
```js
const result = BareMetal.Capabilities.compare(
  { required: ['fetch'], optional: ['webgl'] },
  ['fetch', 'localStorage']
);
```

## Notes
- Feature names are normalized internally, so `service-worker`, `service_worker`, and `serviceWorker` resolve to the same detector.
- `profile()` returns immediately even when battery probing completes asynchronously later.
- `supports()` can return a fallback value, not just a boolean.
- `degrade()` accepts either a levels array by itself or `(availableFeatures, levels)` when you already have a feature list.
