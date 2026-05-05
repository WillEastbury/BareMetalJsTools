# BareMetal.Notify

> Toast and banner queue with native Notification API fallback, progress bars, stacking, auto-dismiss, and dark/light themes.

**Size:** 11 KB source / 11 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Notify.min.js"></script>
<script>
  BareMetal.Notify.configure({
    theme: 'auto',
    maxVisible: 4
  });

  BareMetal.Notify.success('Saved successfully');
  BareMetal.Notify.info('Sync started', { title: 'Background job' });

  const job = BareMetal.Notify.progress('Uploading...', { title: 'Upload' });
  let value = 0;

  const timer = setInterval(function () {
    value += 0.25;
    job.update(value, 'Uploading ' + Math.round(value * 100) + '%');

    if (value >= 1) {
      clearInterval(timer);
      job.complete('Upload complete');
    }
  }, 400);
</script>
```

## API Reference

### `toast(message, options)` → `{ id: string, dismiss: Function }`

Shows a toast notification. Toasts are queued once the visible count reaches `maxVisible`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Main notification text. |
| options | object | `{}` | Toast options: `type`, `duration`, `position`, `title`, `icon`, `dismissible`, `onClick`, `onDismiss`, `className`, and `html`. |

**Example:**
```js
const toast = BareMetal.Notify.toast('Profile updated', {
  type: 'success',
  title: 'Account',
  duration: 2500
});
```

### `success(message, options)` → `{ id: string, dismiss: Function }`

Shortcut for `toast()` with `type: 'success'`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Main notification text. |
| options | object | `{}` | Same options as `toast()`, with `type` forced to `success`. |

**Example:**
```js
BareMetal.Notify.success('Record saved');
```

### `error(message, options)` → `{ id: string, dismiss: Function }`

Shortcut for `toast()` with `type: 'error'`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Main notification text. |
| options | object | `{}` | Same options as `toast()`, with `type` forced to `error`. |

**Example:**
```js
BareMetal.Notify.error('Save failed', { title: 'Network error' });
```

### `warning(message, options)` → `{ id: string, dismiss: Function }`

Shortcut for `toast()` with `type: 'warning'`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Main notification text. |
| options | object | `{}` | Same options as `toast()`, with `type` forced to `warning`. |

**Example:**
```js
BareMetal.Notify.warning('Storage almost full');
```

### `info(message, options)` → `{ id: string, dismiss: Function }`

Shortcut for `toast()` with `type: 'info'`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Main notification text. |
| options | object | `{}` | Same options as `toast()`, with `type` forced to `info`. |

**Example:**
```js
BareMetal.Notify.info('Draft restored');
```

### `banner(message, options)` → `{ id: string, dismiss: Function }`

Shows a full-width top or bottom banner. Banners can be sticky and may include an action button.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Banner text. |
| options | object | `{}` | Banner options: `type`, `position` (`'top'` or `'bottom'`), `sticky`, `action` (`{ text, onClick }`), `dismissible`, and `onDismiss`. |

**Example:**
```js
BareMetal.Notify.banner('Offline mode enabled', {
  type: 'warning',
  sticky: true,
  action: {
    text: 'Retry',
    onClick() {
      location.reload();
    }
  }
});
```

### `dismiss(id)` → `boolean`

Dismisses a toast or banner by id.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | string | — | Notification id returned by `toast()`, `banner()`, or `progress()`. |

**Example:**
```js
const n = BareMetal.Notify.info('Temporary message');
BareMetal.Notify.dismiss(n.id);
```

### `dismissAll()` → `void`

Dismisses every active or queued notification.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
BareMetal.Notify.dismissAll();
```

### `count()` → `number`

Returns the number of currently tracked notifications, including queued items.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.Notify.count());
```

### `configure(options)` → `object`

Updates global notification defaults. Existing containers are repositioned to match the new layout settings.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Global settings: `maxVisible`, `defaultDuration`, `defaultPosition`, `gap`, `animate`, `zIndex`, and `theme` (`'auto'`, `'light'`, or `'dark'`). |

**Example:**
```js
BareMetal.Notify.configure({
  defaultPosition: 'bottom-right',
  theme: 'dark',
  gap: 12
});
```

### `requestPermission()` → `Promise<'default' | 'granted' | 'denied'>`

Requests permission for the native Notification API.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const permission = await BareMetal.Notify.requestPermission();
console.log(permission);
```

### `permission()` → `'default' | 'granted' | 'denied'`

Returns the current native Notification permission state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.Notify.permission());
```

### `native(title, options)` → `Notification | null`

Sends a native browser notification when permission is already granted.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| title | string | `''` | Native notification title. |
| options | object | `{}` | Native options: `body`, `icon`, `badge`, `tag`, `silent`, `requireInteraction`, `onClick`, `onClose`, and `onError`. |

**Example:**
```js
BareMetal.Notify.native('Build complete', {
  body: 'All tests passed',
  tag: 'build-status'
});
```

### `send(title, options)` → `Notification | { id: string, dismiss: Function }`

Attempts a native notification first, then falls back to an in-page toast if the Notification API is unavailable or permission is not granted.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| title | string | `''` | Title for the native notification or fallback toast title. |
| options | object | `{}` | Supports native fields like `body`, plus toast-style `type`, `duration`, `position`, and `onClick` for fallback mode. |

**Example:**
```js
BareMetal.Notify.send('Upload finished', {
  body: 'report.pdf is ready',
  type: 'success'
});
```

### `progress(message, options)` → `{ id: string, update: Function, complete: Function, error: Function, dismiss: Function }`

Shows a sticky toast with a progress bar controller.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Initial progress message. |
| options | object | `{}` | Same general options as `toast()`. `duration` is forced to `0` until `complete()` or `error()` is called. |

**Example:**
```js
const job = BareMetal.Notify.progress('Uploading file', { title: 'Upload' });
job.update(0.5, 'Uploading 50%');
job.complete('Done');
```

#### Progress controller methods

### `progress().update(value, message)` → `number`

Sets the progress bar width using a normalized value between `0` and `1`, and optionally updates the message.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | number | `0` | Progress value; values are clamped into the `0..1` range. |
| message | string | optional | Replacement message text. |

**Example:**
```js
job.update(0.75, 'Uploading 75%');
```

### `progress().complete(message)` → `void`

Marks the progress toast as successful, fills the bar, and schedules auto-dismiss using `defaultDuration`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | optional | Final success message. |

**Example:**
```js
job.complete('Upload complete');
```

### `progress().error(message)` → `void`

Marks the progress toast as failed and schedules auto-dismiss using `defaultDuration`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | optional | Final error message. |

**Example:**
```js
job.error('Upload failed');
```

### `progress().dismiss()` → `boolean`

Dismisses the progress toast immediately.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
job.dismiss();
```

### `isSupported()` → `boolean`

Returns `true` when the native Notification API exists in the current environment.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.Notify.isSupported());
```

### `isSecureContext()` → `boolean`

Returns `true` when `globalThis.isSecureContext` is present and truthy.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.Notify.isSecureContext());
```

## Notes

- Toasts are grouped by position and queued once `maxVisible` visible toasts are already on screen.
- `theme: 'auto'` tracks the user’s `prefers-color-scheme`; `light` and `dark` lock the palette explicitly.
- `duration: 0` creates a sticky toast that stays visible until dismissed or updated by `progress().complete()` / `progress().error()`.
- `send()` is the easiest way to get native notifications when available without losing an in-page fallback.
