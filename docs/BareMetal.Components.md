# BareMetal.Components

> Widget directives for images, navbars, chat, calendars, gantt charts, tables, trees, toasts, and metadata-driven UIs.

**Size:** 25.2 KB source / 12.9 KB minified  
**Dependencies:** `BareMetal.Bind` (required); `BareMetal.Metadata` for `m-entity`

## Quick Start

```html
<div id="chat" m-chatbot="messages" m-chatbot-send="sendMessage"></div>

<script src="BareMetal.Bind.min.js"></script>
<script src="BareMetal.Components.min.js"></script>
<script>
  const { state, watch } = BareMetal.Bind.reactive({
    messages: [{ text: 'How can I help?', from: 'bot', avatar: '🤖' }],
    sendMessage(text) {
      this.messages.push({ text, from: 'user' });
      setTimeout(() => this.messages.push({ text: 'Let me check that for you.', from: 'bot', avatar: '🤖' }), 300);
    }
  });

  BareMetal.Components.bindComponents(document.getElementById('chat'), state, watch);
</script>
```

## API Reference

### `bindComponents(root, state, watch)` → `void`

Scans `root` for widget directives and wires them to reactive state from `BareMetal.Bind.reactive()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| root | Element | — | Root element that contains widget directives. |
| state | object | — | Reactive state object. |
| watch | function | — | Watch function from `BareMetal.Bind`. |

**Example:**
```js
const { state, watch } = BareMetal.Bind.reactive({
  links: [
    { text: 'Dashboard', href: '/', active: true },
    ['Admin', { text: 'Users', href: '/users' }, { text: 'Roles', href: '/roles' }]
  ]
});
BareMetal.Components.bindComponents(document.getElementById('nav'), state, watch);
```

## Configuration / Options

### Supported directives

| Directive | Extra attributes | Description |
|-----------|------------------|-------------|
| `m-img="path"` | `m-img-fallback`, `m-img-lazy` | Reactive image or background image binding. |
| `m-navbar="links"` | — | Renders nav links and dropdowns. |
| `m-chatbot="messages"` | `m-chatbot-send`, `m-chatbot-placeholder`, `m-chatbot-text`, `m-chatbot-from` | Chat transcript and input box. |
| `m-calendar="events"` | `m-calendar-select`, `m-calendar-date`, `m-calendar-label` | Month grid with per-day event dots. |
| `m-gantt="tasks"` | `m-gantt-label`, `m-gantt-start`, `m-gantt-end`, `m-gantt-group` | SVG gantt/timeline view. |
| `m-table="rows"` | `m-table-select`, `m-table-cols`, `m-table-nosort` | Sortable data table. |
| `m-tree="nodes"` | `m-tree-select`, `m-tree-label`, `m-tree-children`, `m-tree-icon` | Recursive tree view with collapse/expand. |
| `m-toast="toasts"` | — | Toast container that appends new items. |
| `m-entity="slug"` | `m-mode`, `m-items`, `m-on-view`, `m-on-edit`, `m-on-delete` | Metadata-driven form or table renderer. |

### Directive details

#### `m-img`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `m-img` | string | — | State path containing the image URL. |
| `m-img-fallback` | string | `''` | URL used when the state value is empty or the `<img>` fails to load. |
| `m-img-lazy` | boolean attribute | off | Uses `IntersectionObserver` when available. |

#### `m-chatbot`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `m-chatbot` | string | — | State path to the messages array. |
| `m-chatbot-send` | string | `''` | Name of a state method called with the submitted text. |
| `m-chatbot-placeholder` | string | `Type a message…` | Input placeholder. |
| `m-chatbot-text` | string | `text` | Field name used for message text. |
| `m-chatbot-from` | string | `from` | Field name used to detect bot vs user messages. |

#### `m-calendar`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `m-calendar` | string | — | State path to the events array. |
| `m-calendar-select` | string | `''` | State method called as `fn(dateString, dayEvents, event)`. |
| `m-calendar-date` | string | `date` | Event field containing an ISO-like date string. |
| `m-calendar-label` | string | `label` | Event field used for dot tooltips. |

#### `m-gantt`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `m-gantt` | string | — | State path to the task array. |
| `m-gantt-label` | string | `label` | Label field. |
| `m-gantt-start` | string | `start` | Start date field. |
| `m-gantt-end` | string | `end` | End date field. |
| `m-gantt-group` | string | `group` | Optional grouping field. |

#### `m-table`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `m-table` | string | — | State path to an array of row objects. |
| `m-table-select` | string | `''` | State method called as `fn(item, event)`. |
| `m-table-cols` | string | inferred | Comma-separated `Header:key` pairs. |
| `m-table-nosort` | boolean attribute | off | Disables clickable sorting. |

#### `m-tree`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `m-tree` | string | — | State path to a tree node array. |
| `m-tree-select` | string | `''` | State method called as `fn(item, event)`. |
| `m-tree-label` | string | `label` | Label field. |
| `m-tree-children` | string | `children` | Children array field. |
| `m-tree-icon` | string | `icon` | Optional icon field. |

#### `m-entity`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `m-entity` | string | — | Metadata slug to render. |
| `m-mode` | string | `form` | `form` or `table`. |
| `m-items` | string | `${slug}List` | State path for table rows. |
| `m-on-view` | string | — | State handler name for view button clicks. |
| `m-on-edit` | string | — | State handler name for edit button clicks. |
| `m-on-delete` | string | — | State handler name for delete button clicks. |

## Examples

### Example 1: Project dashboard widgets
```html
<div id="widgets">
  <div m-calendar="events" m-calendar-select="openDay"></div>
  <table m-table="rows" m-table-cols="Project:name,Owner:owner,Stage:stage" m-table-select="openProject"></table>
</div>
<script>
  const { state, watch } = BareMetal.Bind.reactive({
    events: [
      { date: '2026-05-10', label: 'Kickoff', color: '#0d6efd' },
      { date: '2026-05-10', label: 'Design review', color: '#198754' }
    ],
    rows: [
      { name: 'Portal refresh', owner: 'Ava', stage: 'Build' },
      { name: 'API migration', owner: 'Noah', stage: 'Test' }
    ],
    openDay: (day, events) => console.log(day, events),
    openProject: item => console.log(item)
  });
  const root = document.getElementById('widgets');
  BareMetal.Components.bindComponents(root, state, watch);
</script>
```

### Example 2: Toasts and tree navigation
```js
const { state, watch } = BareMetal.Bind.reactive({
  toasts: [],
  folders: [
    { label: 'Design', icon: '📁', open: true, children: [{ label: 'wireframes.sketch', icon: '📄' }] },
    { label: 'Contracts', icon: '📁', children: [] }
  ],
  openNode: item => state.toasts.push({ title: 'Selected', message: item.label, type: 'info', duration: '4s' })
});
BareMetal.Components.bindComponents(document.getElementById('sidebar'), state, watch);
state.toasts.push({ title: 'Saved', message: 'Milestone updated', type: 'success', duration: '5s' });
```

## Notes
- This module does not replace `BareMetal.Bind.bind()`; use both when a page has core directives and widget directives.
- `m-navbar` accepts either link objects or dropdown arrays shaped like `[title, ...links]`.
- `m-tree` honors an `open: true` flag on nodes for initial expansion.
- `m-entity` is inert unless `BareMetal.Metadata` is loaded and the requested slug has been registered.
