# BareMetalBind

Reactive state + DOM directive binder with formatters, list rendering, transitions, computed expressions, toast notifications, image binding, table rendering, and treeview — ~620 lines, no dependencies.

## API

```js
const { state, watch, data } = BareMetalBind.reactive(initial);
BareMetalBind.bind(rootEl, state, watch);
```

### `reactive(initial)` → `{ state, watch, data }`

Wraps `initial` in a `Proxy`. Mutating any property of `state` notifies all watchers registered for that key.

* `state` — Proxy. Assignments (`state.foo = 'bar'`) trigger watchers.
* `watch(key, fn)` — register a callback to fire when `key` changes.
* `data` — the underlying plain object (read-only inspection).

**Reactive arrays** — Arrays are automatically wrapped in a Proxy that intercepts mutating methods (`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`). Mutations trigger watchers just like reassignment:

```js
state.items.push('new');  // watchers fire — no reassignment needed
```

Newly assigned arrays are also auto-wrapped.

### `bind(root, state, watch)`

Scans the subtree of `root` for directive attributes and wires them up:

| Directive | On | Effect |
|---|---|---|
| `m-value="path"` | `<input>`, `<select>`, `<textarea>` | Two-way binding. Handles `checkbox`, `date`, `datetime-local`. |
| `m-text="path"` | any element | One-way text content binding. Supports formatters. |
| `m-if="path"` | any element | Hides element when value is falsy. |
| `m-class="cls:path,cls2:path2"` | any element | Toggles CSS classes based on state truthiness. |
| `m-attr="attr:path,attr2:path2"` | any element | Sets/removes attributes. Removes on `null`/`undefined`/`false`; keeps `0` and `""`. |
| `m-each="key"` | container with `<template>` | List rendering from arrays. |
| `m-each="key key:prop"` | container with `<template>` | Keyed list rendering with DOM reuse and diffing. |
| `m-navbar="key"` | `<nav>` | Renders navigation links from array. Supports dropdowns. |
| `m-click="fn"` | any element | Calls `state[fn](event)` on click. |
| `m-submit="fn"` | `<form>` | Calls `state[fn](event)` on submit, with `preventDefault()`. |
| `m-transition="name"` | with `m-if` | CSS-class-driven enter/leave transitions. |
| `m-expression="target = expr"` | any element | Computed value — evaluates expression reactively. |
| `m-toast="key"` | `.toast-container` | Creates toast popups when items are pushed to the array. |
| `m-img="path"` | `<img>` or any element | Reactive image `src` (or `background-image`) with lazy loading and fallback. |
| `m-tree="key"` | any container | Collapsible treeview from nested array with icons, selection, and expand/collapse. |
| `m-table="key"` | `<table>` | Sortable data table from an array of objects, with column config and row selection. |

### `BareMetalBind.formatters`

A plain object registry for pipe transforms used in `m-text`:

```js
BareMetalBind.formatters.currency = (v, symbol) => (symbol || '$') + Number(v).toFixed(2);
BareMetalBind.formatters.upper = v => String(v).toUpperCase();
```

---

## Dot-path resolution

All directives support nested paths:

```html
<span m-text="user.address.city"></span>
<input m-value="config.theme">
<div m-if="flags.visible">...</div>
<div m-class="active:ui.selected"></div>
<a m-attr="href:link.url">go</a>
```

Watchers are registered on the top-level key (`user`, `config`, etc.). To trigger updates, reassign the top-level object:

```js
state.user = { ...state.user, name: 'Bob' };
```

---

## Formatters (pipes)

Chain transforms in `m-text` bindings using `|`. Formatters can accept one argument after `:`.

```html
<span m-text="price|currency:£"></span>
<span m-text="name|upper|exclaim"></span>
```

Register formatters before calling `bind()`:

```js
BareMetalBind.formatters.currency = (val, symbol) => (symbol || '$') + Number(val).toFixed(2);
BareMetalBind.formatters.upper = val => String(val).toUpperCase();
BareMetalBind.formatters.exclaim = val => val + '!';
```

> **Note:** Formatters are one-way (read-only). They are not supported on `m-value`.

---

## List rendering (`m-each`)

Render arrays using a `<template>` child. Inside the template, prefix property names with `.` to read from the current item:

```html
<!-- Array of objects -->
<ul m-each="users">
  <template>
    <li m-text=".name"></li>
  </template>
</ul>

<!-- Array of primitives -->
<ul m-each="tags">
  <template>
    <li m-text="."></li>
  </template>
</ul>
```

### Scope variables

Inside `m-each` templates, these special paths are available:

| Path | Resolves to |
|---|---|
| `.` | The current item itself |
| `.propName` | `item.propName` |
| `.prop.nested` | `item.prop.nested` (dot-path traversal) |
| `.index` | Current array index (number) |
| `.root` | The root state object |
| `.root.someKey` | A property on root state |
| `.parent` | Parent item (for nested loops) |
| `.parent.prop` | A property on the parent item |

### Keyed diffing

Add `key:prop` to enable DOM reuse when reordering:

```html
<ul m-each="items key:id">
  <template>
    <li m-text=".name"></li>
  </template>
</ul>
```

When the array changes, items with the same key value keep their existing DOM node — only additions and removals touch the DOM.

### Using directives inside templates

`m-text`, `m-class`, `m-attr`, and `m-if` all work inside `m-each` templates with `.` scope:

```html
<ul m-each="items">
  <template>
    <li m-class="active:.selected" m-attr="title:.tooltip" m-text=".name"></li>
  </template>
</ul>
```

---

## Navbar (`m-navbar`)

Renders navigation links from an array of `{ href, text, active? }` objects:

```html
<nav m-navbar="links"></nav>
```

```js
state.links = [
  { href: '/', text: 'Home', active: true },
  { href: '/about', text: 'About' }
];
```

### Dropdown menus

Pass a nested array where the first element is the title string:

```js
state.links = [
  { href: '/', text: 'Home' },
  ['Products', { href: '/alpha', text: 'Alpha' }, { href: '/beta', text: 'Beta' }],
  { href: '/about', text: 'About' }
];
```

Generates: `<div class="dropdown"><button class="dropdown-toggle">Products</button><div class="dropdown-menu"><a>...</a></div></div>`

---

## Transitions (`m-transition`)

Pair with `m-if` for CSS-driven enter/leave animations:

```html
<div m-if="show" m-transition="fade">Content</div>
```

Class lifecycle:

| Phase | Classes applied | Then |
|---|---|---|
| **Enter** | `fade-enter` | Next frame: remove `fade-enter`, add `fade-enter-active` |
| **Enter done** | | On `transitionend`: remove `fade-enter-active` |
| **Leave** | `fade-leave` | Next frame: remove `fade-leave`, add `fade-leave-active` |
| **Leave done** | | On `transitionend`: remove `fade-leave-active`, set `display: none` |

Example CSS:

```css
.fade-enter        { opacity: 0; }
.fade-enter-active { opacity: 1; transition: opacity 0.3s; }
.fade-leave-active { opacity: 0; transition: opacity 0.3s; }
```

If no name is given (`m-transition=""`), classes default to `m-enter`, `m-enter-active`, `m-leave`, `m-leave-active`.

---

## Computed expressions (`m-expression`)

Evaluate a JS expression and assign the result to a state key, re-evaluating when dependencies change:

```html
<div m-expression="total = price * qty"></div>
<span m-text="total"></span>
```

```js
const { state, watch } = BareMetalBind.reactive({ price: 10, qty: 3, total: 0 });
BareMetalBind.bind(root, state, watch);
// state.total is now 30
state.price = 20;
// state.total is now 60
```

Dependencies are extracted automatically from the right-hand side. Standard globals (`Math`, `Date`, `Number`, etc.) are available.

> **Note:** The target key must not appear in the expression's dependencies (to avoid infinite loops). Expression evaluation errors are silently ignored.

---

## Toast binding (`m-toast`)

Bind a `.toast-container` element to a reactive array. When items are pushed, toast notifications are created automatically using BareMetalStyles toast classes.

```html
<div class="toast-container toast-container-top-right" m-toast="notifications"></div>
```

```js
const { state, watch } = BareMetalBind.reactive({ notifications: [] });
BareMetalBind.bind(root, state, watch);

// Push an object → toast appears and auto-dismisses
state.notifications.push({
  type: 'success',        // success | danger | warning | info | dark
  title: 'Deployed',
  message: 'v2.1.0 is live!',
  duration: '5s'          // 3s | 5s | 8s | 10s (default: 5s)
});

// Push a plain string for a quick info toast
state.notifications.push('Quick notification!');
```

### Toast object properties

| Property | Type | Default | Description |
|---|---|---|---|
| `message` | string | `''` | Toast body text |
| `title` | string | *(none)* | If set, adds a toast header with title and close button |
| `type` | string | `'info'` | Colour variant: `success`, `danger`, `warning`, `info`, `dark` |
| `duration` | string | `'5s'` | Auto-dismiss timing: `3s`, `5s`, `8s`, `10s` |
| `time` | string | *(none)* | Optional timestamp shown in the header |
| `progress` | boolean | `true` | Set to `false` to hide the countdown progress bar |

Toasts are removed from the DOM automatically when the CSS `toast-auto-dismiss` animation ends. The close button (on toasts with a header) also removes the toast immediately.

> **Requires:** BareMetalStyles.css for the toast container, animation, and colour classes.

---

## Image binding (`m-img`)

Bind an element's image source to a reactive state property. On `<img>` elements it sets `src`; on any other element it sets `background-image`.

```html
<!-- Basic reactive image -->
<img m-img="user.avatar">

<!-- With fallback on error or empty value -->
<img m-img="user.avatar" m-img-fallback="/img/placeholder.png">

<!-- Lazy loading — defers src until element is near viewport -->
<img m-img="product.photo" m-img-fallback="/img/loading.svg" m-img-lazy>

<!-- Background image on a div -->
<div class="hero-banner" m-img="page.heroUrl"></div>
```

### Attributes

| Attribute | Required | Description |
|---|---|---|
| `m-img="path"` | ✅ | State path to the image URL string |
| `m-img-fallback="url"` | ❌ | Static fallback URL used when the value is empty or the image fails to load |
| `m-img-lazy` | ❌ | Defer loading until the element enters the viewport (uses `IntersectionObserver` with 200px margin) |

When the state value changes, the image updates reactively. On `<img>` elements, an `error` event listener automatically swaps to the fallback URL if provided.

---

## Table binding (`m-table`)

Render an array of objects as a sortable, selectable data table. Columns are auto-inferred from the first item's keys or configured explicitly.

```html
<!-- Auto-detect columns from object keys -->
<table m-table="users"></table>

<!-- Explicit columns with display headers -->
<table m-table="users" m-table-cols="Full Name:name,Email:email,Role:role"></table>

<!-- With row selection callback -->
<table m-table="users" m-table-cols="name,email,role" m-table-select="onRowClick"></table>

<!-- Disable sorting -->
<table m-table="users" m-table-nosort></table>
```

```js
const { state, watch } = BareMetalBind.reactive({
  users: [
    { name: 'Alice', email: 'alice@co.dev', role: 'Admin' },
    { name: 'Bob',   email: 'bob@co.dev',   role: 'Editor' },
    { name: 'Carol', email: 'carol@co.dev',  role: 'Viewer' }
  ],
  onRowClick: (item, e) => console.log('Selected:', item.name)
});
BareMetalBind.bind(document.getElementById('app'), state, watch);

// Reactive — push a new row and the table re-renders
state.users.push({ name: 'Dave', email: 'dave@co.dev', role: 'Editor' });
```

### Attributes

| Attribute | Required | Description |
|---|---|---|
| `m-table="key"` | ✅ | State path to the array of objects |
| `m-table-cols="col,..."` | ❌ | Comma-separated column definitions. Format: `Header:key` or just `key` (header is auto-capitalised). If omitted, columns are inferred from the first item. |
| `m-table-select="fn"` | ❌ | State function called with `(item, event)` when a row is clicked |
| `m-table-nosort` | ❌ | Disables click-to-sort on column headers |

### Sorting

Click any column header to sort ascending; click again to toggle descending. The active sort column shows ▲ or ▼. Numbers sort numerically; everything else sorts case-insensitively as strings.

### CSS classes

The table gets `bm-table` automatically. Add `bm-table-striped` for alternating row shading, or `bm-table-dark` for dark mode. Selected rows get `bm-table-selected`.

> **Requires:** BareMetalStyles.css for table styling.

---

## Tree binding (`m-tree`)

Render a nested array as a collapsible file-explorer-style treeview with icons, expand/collapse toggles, and node selection.

```html
<!-- Basic tree -->
<div m-tree="files"></div>

<!-- With selection callback and custom field names -->
<div m-tree="files" m-tree-select="onFileClick"
     m-tree-label="name" m-tree-children="items" m-tree-icon="emoji"></div>
```

```js
const { state, watch } = BareMetalBind.reactive({
  files: [
    { label: 'src', icon: '📁', open: true, children: [
      { label: 'index.js', icon: '📄' },
      { label: 'utils', icon: '📁', children: [
        { label: 'helpers.js', icon: '📄' },
        { label: 'math.js', icon: '📄' }
      ]}
    ]},
    { label: 'README.md', icon: '📝' },
    { label: 'package.json', icon: '📦' }
  ],
  onFileClick: (item, e) => console.log('Selected:', item.label)
});
BareMetalBind.bind(document.getElementById('app'), state, watch);
```

### Attributes

| Attribute | Required | Description |
|---|---|---|
| `m-tree="key"` | ✅ | State path to the nested array |
| `m-tree-select="fn"` | ❌ | State function called with `(item, event)` when a node is clicked |
| `m-tree-label="field"` | ❌ | Property name for node text (default: `label`) |
| `m-tree-children="field"` | ❌ | Property name for child array (default: `children`) |
| `m-tree-icon="field"` | ❌ | Property name for icon (default: `icon`) |

### Node object properties

| Property | Type | Default | Description |
|---|---|---|---|
| `label` | string | `''` | Display text (or custom field via `m-tree-label`) |
| `icon` | string | *(none)* | Emoji or text icon shown before the label |
| `children` | array | *(none)* | Nested child nodes (or custom field via `m-tree-children`) |
| `open` | boolean | `false` | If `true`, the node starts expanded |

### Behaviour

- Click the ▸ toggle to expand/collapse a branch
- Click anywhere on a row to select it (highlighted with `bm-tree-selected`)
- Nodes indent 1.25rem per level
- The tree re-renders reactively when the state array changes

Add `bm-tree-dark` class for dark mode styling.

> **Requires:** BareMetalStyles.css for treeview styling.

---

## Full example

```html
<div id="app">
  <input m-value="name" placeholder="Your name">
  <p>Hello, <span m-text="name|upper"></span>!</p>

  <div m-expression="total = price * qty"></div>
  <p>Total: <span m-text="total|currency:£"></span></p>

  <ul m-each="todos key:id">
    <template>
      <li m-class="done:.completed" m-text=".text"></li>
    </template>
  </ul>

  <div m-if="showTip" m-transition="fade">
    <p>Pro tip: reactive arrays work with push()!</p>
  </div>

  <nav m-navbar="nav"></nav>
</div>

<script src="src/BareMetalBind.js"></script>
<script>
  BareMetalBind.formatters.upper = v => String(v).toUpperCase();
  BareMetalBind.formatters.currency = (v, s) => (s || '$') + Number(v).toFixed(2);

  const { state, watch } = BareMetalBind.reactive({
    name: 'World',
    price: 10, qty: 3, total: 0,
    showTip: true,
    todos: [
      { id: 1, text: 'Learn BareMetalBind', completed: true },
      { id: 2, text: 'Build something', completed: false }
    ],
    nav: [
      { href: '/', text: 'Home', active: true },
      ['Docs', { href: '/guide', text: 'Guide' }, { href: '/api', text: 'API' }]
    ]
  });

  BareMetalBind.bind(document.getElementById('app'), state, watch);

  // Reactive array — no reassignment needed
  state.todos.push({ id: 3, text: 'Ship it', completed: false });
</script>
```

## Notes

* No virtual DOM. Bindings touch only the elements that change.
* `m-value` parses date inputs to ISO strings (`YYYY-MM-DD` / `YYYY-MM-DDTHH:MM`).
* Re-running `bind()` on the same root is safe — it reuses the same listener slots.
* Formatters are not supported on `m-value` (no reverse parsing).
* Dot-path writes via `m-value` use `setPath()` internally and notify the top-level key.
