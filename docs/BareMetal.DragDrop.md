# BareMetal.DragDrop

> Pointer-event drag-and-drop helpers for draggable items, drop zones, and sortable lists.

**Size:** 11.32 KB source / 6.27 KB minified  
**Dependencies:** None; browser Pointer Events and DOM APIs only

## Quick Start

```html
<style>
.dragging { opacity: .5; }
.drop-over { outline: 2px dashed #2563eb; }
.ghost { opacity: .85; }
</style>

<div id="palette" data-type="widget">Chart widget</div>
<div id="canvas">Drop here</div>

<script src="BareMetal.DragDrop.min.js"></script>
<script>
  BareMetal.DragDrop.draggable(document.getElementById('palette'), {
    ghostClass: 'ghost',
    dragClass: 'dragging'
  });

  BareMetal.DragDrop.droppable(document.getElementById('canvas'), {
    accept: 'widget',
    overClass: 'drop-over',
    onDrop(data) {
      console.log('Dropped', data);
    }
  });
</script>
```

## API Reference

### `draggable(el, opts)` → `{ destroy }`

Makes an element draggable using pointer events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `el` | `Element` | — | Element to drag |
| `opts` | `object` | `{}` | Drag behaviour options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `handle` | `string` | — | Only start a drag when the pointer starts on a matching descendant |
| `data` | `any \| Function` | element-derived payload | Static payload or `(el, event) => payload` |
| `ghostClass` | `string` | — | Class added to the floating clone |
| `dragClass` | `string` | — | Class added to the source while dragging |
| `onStart` | `Function` | — | Called with `(data, el, event)` |
| `onEnd` | `Function` | — | Called with `(data, el, dropTarget, event)` |

Default payload:

```js
{ type: el.dataset.type || '', id: el.id || '', text: el.textContent.trim() }
```

Emits `bm:dragstart` and `bm:dragend` custom events on the source element.

**Example:**
```js
BareMetal.DragDrop.draggable(card, {
  handle: '.grab',
  data: el => ({ type: 'task', id: el.dataset.id }),
  ghostClass: 'card-ghost'
});
```

### `droppable(el, opts)` → `{ destroy }`

Registers an element as a drop target.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `el` | `Element` | — | Drop target element |
| `opts` | `object` | `{}` | Drop target options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accept` | `string \| Function` | — | Accept all by default, or filter by payload |
| `overClass` | `string` | — | Class toggled while a valid item is over the target |
| `onOver` | `Function` | — | Called with `(data, source, target, event)` |
| `onLeave` | `Function` | — | Called when the pointer leaves the target |
| `onDrop` | `Function` | — | Called when a valid drag is dropped |

If `accept` is a string, it matches `data.type`, `data.kind`, or the payload value itself.

Emits `bm:drop` on the target element.

**Example:**
```js
BareMetal.DragDrop.droppable(bucket, {
  accept: data => data.type === 'image',
  overClass: 'bucket-over',
  onDrop(data, source, target) {
    target.appendChild(source);
  }
});
```

### `sortable(container, opts)` → `{ destroy, getOrder }`

Makes a container sortable by dragging its child items.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `Element` | — | Parent element containing sortable items |
| `opts` | `object` | `{}` | Sortable options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `string` | `'>*'` | Selector for sortable items |
| `handle` | `string` | — | Drag handle selector |
| `direction` | `string` | `'vertical'` | Use `'horizontal'` for left/right sorting |
| `ghostClass` | `string` | — | Class added to the floating clone |
| `onReorder` | `Function` | — | Called with `(order, item, event)` after a completed reorder |

Returned handle:

| Method | Description |
|--------|-------------|
| `destroy()` | Removes listeners and cancels any active sort |
| `getOrder()` | Returns an array of item keys |

`getOrder()` keys are derived from `id`, `data-id`, `data-key`, then the item index.

Emits `bm:dragstart` on the dragged item, `bm:dragend` on the dragged item, and `bm:reorder` on the container.

**Example:**
```js
const sort = BareMetal.DragDrop.sortable(list, {
  items: '.task',
  handle: '.grab',
  onReorder(order) {
    saveOrder(order);
  }
});
```

## Configuration / Options

No global configuration is stored. All behaviour is supplied through per-instance options.

## Examples

### Example 1: Drag cards into a status lane
```html
<div class="card" id="task-14" data-type="task">Write release notes</div>
<div id="doneLane"></div>

<script src="BareMetal.DragDrop.min.js"></script>
<script>
  const card = document.getElementById('task-14');
  const doneLane = document.getElementById('doneLane');

  BareMetal.DragDrop.draggable(card, {
    dragClass: 'dragging',
    ghostClass: 'ghost'
  });

  BareMetal.DragDrop.droppable(doneLane, {
    accept: 'task',
    overClass: 'drop-over',
    onDrop(data, source, target) {
      target.appendChild(source);
      source.dataset.status = 'done';
    }
  });
</script>
```

### Example 2: Sort a backlog list
```js
const backlog = BareMetal.DragDrop.sortable(document.querySelector('#backlog'), {
  items: '.story',
  handle: '.story-handle',
  ghostClass: 'story-ghost',
  onReorder(order) {
    fetch('/api/backlog/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
  }
});
```

## Notes
- `draggable()` ignores non-left mouse buttons except touch pointers.
- `droppable()` targets are global to the module until their `destroy()` handle is called.
- `sortable()` uses a hidden placeholder element while dragging.
- Custom events are only emitted when `CustomEvent` is available.
