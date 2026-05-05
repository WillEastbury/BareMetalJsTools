# BareMetal.Bind

> Reactive state, DOM binding, and core `m-*` directives.

**Size:** 13.2 KB source / 6.6 KB minified  
**Dependencies:** None

## Quick Start

```html
<div id="cart">
  <input type="number" m-value="price">
  <input type="number" m-value="qty">
  <div hidden m-expression="total = Number(price) * Number(qty)"></div>
  <strong m-text="total | money"></strong>
</div>

<script src="BareMetal.Bind.min.js"></script>
<script>
  BareMetal.Bind.formatters.money = v => '$' + Number(v || 0).toFixed(2);

  const { state, watch } = BareMetal.Bind.reactive({
    price: 19.99,
    qty: 2,
    total: 0
  });

  BareMetal.Bind.bind(document.getElementById('cart'), state, watch);
</script>
```

## API Reference

### `reactive(initial)` → `{ state, watch, data }`

Creates a top-level reactive state object. Array mutators such as `push`, `splice`, and `sort` notify watchers automatically.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| initial | object | — | Initial state snapshot. |

**Example:**
```js
const { state, watch, data } = BareMetal.Bind.reactive({ items: [], open: false });
watch('items', () => console.log('items changed', data.items.length));
state.items.push({ id: 1, name: 'Desk' });
state.open = true;
```

### `bind(root, state, watch)` → `void`

Binds core directives under `root`: `m-expression`, `m-value`, `m-text`, `m-if`, `m-class`, `m-attr`, `m-each`, `m-click`, and `m-submit`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| root | Element | — | Root element to scan. |
| state | object | — | Reactive state returned by `reactive()`. |
| watch | function | — | Watch function returned by `reactive()`. |

**Example:**
```js
const root = document.getElementById('profile');
const { state, watch } = BareMetal.Bind.reactive({
  firstName: 'Ada',
  lastName: 'Lovelace',
  fullName: '',
  save: e => console.log('submit', e.type)
});
BareMetal.Bind.bind(root, state, watch);
```

### `formatters` → `object`

Registry of pipe formatters used by binding expressions such as `m-text="price | money"`. The module ships with no built-in formatters.

**Example:**
```js
BareMetal.Bind.formatters.upper = value => String(value || '').toUpperCase();
```

### `getPath(obj, path)` → `any`

Reads a dotted path from an object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| obj | object | — | Source object. |
| path | string | — | Dotted path like `user.name`. |

**Example:**
```js
BareMetal.Bind.getPath({ user: { name: 'Ada' } }, 'user.name'); // 'Ada'
```

### `setPath(obj, path, value)` → `void`

Sets a dotted path, creating missing intermediate objects.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| obj | object | — | Target object. |
| path | string | — | Dotted path like `settings.theme`. |
| value | any | — | Value to assign. |

**Example:**
```js
const model = {};
BareMetal.Bind.setPath(model, 'settings.theme', 'dark');
```

### `topKey(path)` → `string`

Returns the first segment of a dotted path.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| path | string | — | Dotted path. |

**Example:**
```js
BareMetal.Bind.topKey('order.customer.name'); // 'order'
```

### `parseBinding(expr)` → `{ path, pipes }`

Parses a binding expression with optional pipes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| expr | string | — | Expression like `price | money:GBP`. |

**Example:**
```js
BareMetal.Bind.parseBinding('price | money:GBP');
// { path: 'price', pipes: [{ name: 'money', arg: 'GBP' }] }
```

### `applyPipes(value, pipes)` → `any`

Runs a parsed pipe list through `formatters`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Raw value. |
| pipes | array | — | Pipe descriptors from `parseBinding()`. |

**Example:**
```js
BareMetal.Bind.formatters.percent = v => `${v}%`;
BareMetal.Bind.applyPipes(42, [{ name: 'percent' }]);
```

### `resolveInScope(path, state, scope)` → `any`

Resolves values for normal state paths and `m-each` scope helpers such as `.`, `.index`, `.parent`, and `.root`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| path | string | — | State path or scope path. |
| state | object | — | Root state. |
| scope | object | `undefined` | Row scope created by `m-each`. |

**Example:**
```js
BareMetal.Bind.resolveInScope('.index', {}, { index: 3 }); // 3
```

### `resolveBinding(expr, state, scope)` → `any`

Combines path resolution and pipe application.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| expr | string | — | Binding expression. |
| state | object | — | Root state. |
| scope | object | `undefined` | Optional row scope. |

**Example:**
```js
BareMetal.Bind.formatters.upper = v => String(v).toUpperCase();
BareMetal.Bind.resolveBinding('name | upper', { name: 'ada' });
```

### `parsePairs(attr)` → `Array<[string, string]>`

Parses comma-separated `name:path` pairs used by `m-class` and `m-attr`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| attr | string | — | Pair string like `active:isOpen,disabled:isLocked`. |

**Example:**
```js
BareMetal.Bind.parsePairs('active:isOpen,disabled:isLocked');
```

### `applyRow(el, state, scope)` → `void`

Applies row-safe directives (`m-text`, `m-class`, `m-attr`, `m-if`) inside an `m-each` clone.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Row wrapper element. |
| state | object | — | Root state. |
| scope | object | — | Current row scope. |

**Example:**
```js
const wrapper = document.createElement('div');
wrapper.innerHTML = '<span m-text=".name"></span>';
BareMetal.Bind.applyRow(wrapper, {}, { item: { name: 'Desk' }, index: 0, root: {} });
```

### `el(tag, className)` → `HTMLElement`

Small DOM helper used by this module and `BareMetal.Components`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| tag | string | — | Element tag name. |
| className | string | `''` | Optional class name. |

**Example:**
```js
const badge = BareMetal.Bind.el('span', 'badge');
badge.textContent = 'New';
```

## Configuration / Options

### Core directives

| Directive | Value | Description |
|-----------|-------|-------------|
| `m-expression` | `target = expression` | Computes a state value and watches referenced identifiers. |
| `m-value` | `path` | Two-way binding for inputs, checkboxes, dates, and datetime-local inputs. |
| `m-text` | `path | formatter[:arg]` | Sets `textContent`, with optional pipes. |
| `m-if` | `path` | Shows or hides an element. |
| `m-transition` | `name` | Optional CSS prefix for `m-if` enter/leave classes. |
| `m-class` | `class:path,...` | Toggles classes from state booleans/truthy values. |
| `m-attr` | `attr:path,...` | Maps state values onto DOM attributes. |
| `m-each` | `items` or `items key:id` | Repeats a `<template>` over an array, optionally with keyed diffing. |
| `m-click` | `handlerName` | Calls `state[handlerName](event)` on click. |
| `m-submit` | `handlerName` | Calls `state[handlerName](event)` on form submit. |

### `m-each` scope helpers

| Helper | Meaning |
|--------|---------|
| `.` | Current row item |
| `.index` | Current row index |
| `.parent` | Parent row item |
| `.root` | Root state object |
| `.fieldName` | Field on the current row item |

## Examples

### Example 1: Reactive order summary
```html
<div id="order">
  <div hidden m-expression="subtotal = Number(price) * Number(qty)"></div>
  <label>Price <input type="number" m-value="price"></label>
  <label>Qty <input type="number" m-value="qty"></label>
  <p m-text="subtotal | money"></p>
  <p m-class="text-danger:isLowStock">Only a few left</p>
</div>
<script>
  BareMetal.Bind.formatters.money = v => '$' + Number(v || 0).toFixed(2);
  const { state, watch } = BareMetal.Bind.reactive({ price: 125, qty: 1, subtotal: 0, isLowStock: true });
  BareMetal.Bind.bind(document.getElementById('order'), state, watch);
</script>
```

### Example 2: Keyed list rendering
```html
<ul id="tasks" m-each="tasks key:id">
  <template>
    <li>
      <span m-text=".title"></span>
      <small m-text=".index"></small>
    </li>
  </template>
</ul>
<script>
  const { state, watch } = BareMetal.Bind.reactive({
    tasks: [
      { id: 1, title: 'Prepare quote' },
      { id: 2, title: 'Email customer' }
    ]
  });
  BareMetal.Bind.bind(document.getElementById('tasks').parentElement, state, watch);
</script>
```

## Notes
- Watchers are keyed by the top-level property name; flat state objects work best.
- `m-each` requires a child `<template>` node.
- `m-transition="fade"` expects CSS classes such as `fade-enter`, `fade-enter-active`, `fade-leave`, and `fade-leave-active`.
