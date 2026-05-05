# BareMetal.Animate

> CSS enter/leave/move animation helpers with reduced-motion awareness.

**Size:** 7.89 KB source / 3.61 KB minified  
**Dependencies:** None; browser DOM APIs only

## Quick Start

```html
<style>
.fade { opacity: 0; transform: translateY(8px); }
.fade-active { opacity: 1; transform: translateY(0); transition: opacity .18s ease, transform .18s ease; }
</style>

<div id="toast" hidden>Profile saved</div>

<script src="BareMetal.Animate.min.js"></script>
<script>
  const toast = document.getElementById('toast');
  BareMetal.Animate.enter(toast, 'fade');
</script>
```

## API Reference

### `enter(el, className, done)` → `void`

Shows an element and runs a class-based enter animation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `el` | `Element` | — | Element to show and animate |
| `className` | `string` | — | Base CSS class. The helper also toggles `className + '-active'` |
| `done` | `Function` | — | Optional callback after the transition/animation finishes |

**Example:**
```js
BareMetal.Animate.enter(panel, 'fade-in', () => {
  console.log('panel is visible');
});
```

### `leave(el, className, done)` → `void`

Runs a leave animation. If `done` is omitted, the element is removed from the DOM when the animation completes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `el` | `Element` | — | Element to animate out |
| `className` | `string` | — | Base CSS class for the leave transition |
| `done` | `Function` | — | Optional callback. If supplied, the element is not auto-removed |

**Example:**
```js
BareMetal.Animate.leave(modal, 'fade-out', () => {
  modal.hidden = true;
});
```

### `toggle(el, enterClass, leaveClass)` → `void`

Chooses `enter()` or `leave()` based on the element's current visibility.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `el` | `Element` | — | Element to toggle |
| `enterClass` | `string` | — | Class used when showing the element |
| `leaveClass` | `string` | `enterClass` | Class used when hiding the element |

**Example:**
```js
button.addEventListener('click', () => {
  BareMetal.Animate.toggle(drawer, 'drawer-in', 'drawer-out');
});
```

### `move(el, fromRect, toRect)` → `void`

Runs a FLIP-style move animation between two rectangles.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `el` | `Element` | — | Element being repositioned |
| `fromRect` | `DOMRect \| object` | — | Previous bounding box |
| `toRect` | `DOMRect \| object` | — | New bounding box |

**Example:**
```js
const before = card.getBoundingClientRect();
list.prepend(card);
const after = card.getBoundingClientRect();
BareMetal.Animate.move(card, before, after);
```

### `list(container, className)` → `{ update, destroy }`

Tracks direct children in a container and animates inserts, removals, and position changes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `Element` | — | Parent element whose direct children are tracked |
| `className` | `string` | — | Base class used for enter/leave transitions |

Returned handle:

| Method | Description |
|-------|-------------|
| `update()` | Snapshots current children and animates enter/leave/move differences |
| `destroy()` | Clears internal snapshots and removes cloned leave nodes |

**Example:**
```js
const animator = BareMetal.Animate.list(todoList, 'fade');

addButton.addEventListener('click', () => {
  const li = document.createElement('li');
  li.textContent = 'Review pull request';
  todoList.prepend(li);
  animator.update();
});
```

### `prefersReducedMotion()` → `boolean`

Returns `true` when `prefers-reduced-motion: reduce` matches.

**Example:**
```js
if (BareMetal.Animate.prefersReducedMotion()) {
  element.classList.add('is-visible');
} else {
  BareMetal.Animate.enter(element, 'fade');
}
```

## Configuration / Options

This module has no global configuration. Supply CSS classes and callbacks per call.

## Examples

### Example 1: Animate a modal open and close
```html
<style>
.modal-in { opacity: 0; transform: scale(.98); }
.modal-in-active { opacity: 1; transform: scale(1); transition: opacity .2s ease, transform .2s ease; }
.modal-out { opacity: 1; transform: scale(1); }
.modal-out-active { opacity: 0; transform: scale(.98); transition: opacity .16s ease, transform .16s ease; }
</style>

<div id="modal" hidden>
  <h2>Edit customer</h2>
  <button id="closeModal">Close</button>
</div>
<button id="openModal">Open</button>

<script src="BareMetal.Animate.min.js"></script>
<script>
  const modal = document.getElementById('modal');

  openModal.addEventListener('click', () => {
    BareMetal.Animate.enter(modal, 'modal-in');
  });

  closeModal.addEventListener('click', () => {
    BareMetal.Animate.leave(modal, 'modal-out', () => {
      modal.hidden = true;
    });
  });
</script>
```

### Example 2: Animate list changes after sorting
```js
const animator = BareMetal.Animate.list(document.querySelector('#orders'), 'fade');

function moveUrgentOrder(id) {
  const row = document.getElementById(id);
  row.parentNode.prepend(row);
  animator.update();
}
```

## Notes
- `leave()` removes the element automatically only when no callback is supplied.
- `list()` animates direct children only.
- Removed children are cloned into `document.body` temporarily so their exit animation can finish.
- When reduced motion is preferred, transitions complete immediately.
