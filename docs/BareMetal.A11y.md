# BareMetal.A11y

> Lightweight accessibility helpers for focus management, live regions, skip links, and user preference detection.

**Size:** 9.26 KB source / 4.76 KB minified  
**Dependencies:** None; browser DOM APIs and `matchMedia`

## Quick Start

```html
<div id="dialog" hidden>
  <button class="close">Close</button>
  <a href="#">Focusable link</a>
</div>

<script src="BareMetal.A11y.min.js"></script>
<script>
  const dialog = document.getElementById('dialog');
  dialog.hidden = false;

  const trap = BareMetal.A11y.focusTrap(dialog, { initialFocus: '.close' });
  BareMetal.A11y.announce('Dialog opened');
</script>
```

## API Reference

### `focusTrap(container, opts)` → `{ destroy, pause, resume }`

Keeps keyboard focus inside a container while it is active.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `Element` | — | Element whose focusable descendants are trapped |
| `opts` | `object` | `{}` | Trap behaviour options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialFocus` | `string` | — | Selector for the element to focus first |
| `returnFocus` | `boolean` | `true` | Restore the previously focused element when destroyed |

Returned handle:

| Method | Description |
|--------|-------------|
| `destroy()` | Removes the trap and optionally restores focus |
| `pause()` | Temporarily disables Tab wrapping |
| `resume()` | Re-enables the trap and focuses the first item |

**Example:**
```js
const trap = BareMetal.A11y.focusTrap(modal, { initialFocus: '[data-autofocus]' });
closeButton.addEventListener('click', () => trap.destroy());
```

### `announce(text, priority)` → `void`

Announces text through a hidden live region.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | `string` | — | Message to announce |
| `priority` | `'polite' \| 'assertive'` | `'polite'` | Live region priority |

**Example:**
```js
BareMetal.A11y.announce('3 results loaded', 'polite');
```

### `skipNav(targetId)` → `{ destroy }`

Inserts a “Skip to content” link at the start of `document.body`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `targetId` | `string` | — | ID of the main content element to focus |

**Example:**
```js
const skip = BareMetal.A11y.skipNav('main-content');
```

### `roving(container, selector, opts)` → `{ destroy, focus }`

Implements roving `tabindex` keyboard navigation for a set of items.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `Element` | — | Element containing the focusable items |
| `selector` | `string` | `'[tabindex]'` | Selector used to collect items |
| `opts` | `object` | `{}` | Navigation options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Arrow key axis |

Returned handle:

| Method | Description |
|--------|-------------|
| `destroy()` | Removes listeners |
| `focus(index)` | Focuses the item at the given index |

**Example:**
```js
BareMetal.A11y.roving(toolbar, 'button', { direction: 'horizontal' });
```

### `prefersReducedMotion()` → `boolean`

Returns whether the user prefers reduced motion.

**Example:**
```js
if (BareMetal.A11y.prefersReducedMotion()) {
  document.body.classList.add('reduced-motion');
}
```

### `prefersColorScheme()` → `'light' | 'dark' | 'no-preference'`

Reads the current preferred color scheme.

**Example:**
```js
const scheme = BareMetal.A11y.prefersColorScheme();
document.documentElement.dataset.theme = scheme === 'no-preference' ? 'light' : scheme;
```

### `onMotionChange(fn)` → `Function`

Subscribes to reduced-motion preference changes and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `fn` | `Function` | — | Called with the latest boolean value |

**Example:**
```js
const off = BareMetal.A11y.onMotionChange(enabled => {
  document.body.classList.toggle('reduced-motion', enabled);
});
```

### `onSchemeChange(fn)` → `Function`

Subscribes to color-scheme changes and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `fn` | `Function` | — | Called with `'light'`, `'dark'`, or `'no-preference'` |

**Example:**
```js
const off = BareMetal.A11y.onSchemeChange(scheme => {
  document.documentElement.dataset.theme = scheme;
});
```

## Configuration / Options

### `focusTrap()` options

| Option | Default | Description |
|--------|---------|-------------|
| `initialFocus` | — | CSS selector for the first element to focus |
| `returnFocus` | `true` | Restore focus to the previously active element on destroy |

### `roving()` options

| Option | Default | Description |
|--------|---------|-------------|
| `direction` | `'horizontal'` | Use Left/Right keys by default, or Up/Down when `'vertical'` |

## Examples

### Example 1: Trap focus in a modal dialog
```html
<main id="main-content">...</main>
<div id="settingsDialog" hidden>
  <button data-autofocus>Profile</button>
  <button>Security</button>
  <button id="closeDialog">Close</button>
</div>

<script src="BareMetal.A11y.min.js"></script>
<script>
  const dialog = document.getElementById('settingsDialog');
  let trap;

  function openDialog() {
    dialog.hidden = false;
    trap = BareMetal.A11y.focusTrap(dialog, { initialFocus: '[data-autofocus]' });
    BareMetal.A11y.announce('Settings dialog opened');
  }

  document.getElementById('closeDialog').addEventListener('click', () => {
    trap.destroy();
    dialog.hidden = true;
    BareMetal.A11y.announce('Settings dialog closed');
  });
</script>
```

### Example 2: Add keyboard navigation to a custom toolbar
```js
const toolbar = document.querySelector('.editor-toolbar');
const nav = BareMetal.A11y.roving(toolbar, 'button');
nav.focus(0);
```

## Notes
- `skipNav()` inserts inline styles and a hard-coded “Skip to content” label.
- `focusTrap()` adds `tabindex="-1"` to the container if it must focus the container itself.
- Live regions are created lazily and reused per priority.
- Media-query subscriptions use `addEventListener('change', ...)` when available, with `addListener` fallback.
