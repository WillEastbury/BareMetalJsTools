# BareMetal.ComponentFactories

> Small factory helpers for component-friendly data shapes and chat endpoints.

**Size:** 2.5 KB source / 1.5 KB minified  
**Dependencies:** Soft deps on `BareMetal.Bind` and `BareMetal.Communications`

## Quick Start

```html
<script src="BareMetal.ComponentFactories.min.js"></script>
<script>
  const toast = BareMetal.ComponentFactories.create.toast('Deployment complete', {
    type: 'success',
    duration: '6s'
  });

  const nav = [
    BareMetal.ComponentFactories.create.navLink('Home', '/'),
    BareMetal.ComponentFactories.create.navDropdown(
      'Admin',
      BareMetal.ComponentFactories.create.navLink('Users', '/users'),
      BareMetal.ComponentFactories.create.navLink('Roles', '/roles')
    )
  ];
</script>
```

## API Reference

### `create.message(text, opts)` → `object`

Creates a user chat message with defaults `{ text, from: 'user', time }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| text | string | `''` | Message text. |
| opts | object | `{}` | Extra fields to merge onto the result. |

**Example:**
```js
BareMetal.ComponentFactories.create.message('Can you resend the quote?', { avatar: '🧑' });
```

### `create.botMessage(text, opts)` → `object`

Creates a bot/system chat message with defaults `{ text, from: 'bot', time }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| text | string | `''` | Reply text. |
| opts | object | `{}` | Extra fields such as `avatar` or `name`. |

**Example:**
```js
BareMetal.ComponentFactories.create.botMessage('Quote resent.', { avatar: '🤖', name: 'Sales Bot' });
```

### `create.toast(message, opts)` → `object`

Creates a toast payload with defaults `{ message, type: 'info', duration: '5s' }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| message | string | `''` | Body text. |
| opts | object | `{}` | Additional toast fields like `title` or `progress`. |

**Example:**
```js
BareMetal.ComponentFactories.create.toast('Invoice paid', { title: 'Accounting', type: 'success' });
```

### `create.calendarEvent(date, label, opts)` → `object`

Creates a calendar event object with `{ date, label }` defaults.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| date | string | `''` | Event date string. |
| label | string | `''` | Event label. |
| opts | object | `{}` | Extra fields such as `color` or IDs. |

**Example:**
```js
BareMetal.ComponentFactories.create.calendarEvent('2026-05-12', 'Go-live', { color: '#198754' });
```

### `create.ganttTask(label, start, end, opts)` → `object`

Creates a gantt task with defaults `{ label, start, end, progress: 0 }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| label | string | `''` | Task label. |
| start | string | `''` | Start date. |
| end | string | `''` | End date. |
| opts | object | `{}` | Extra fields such as `group`, `color`, or `progress`. |

**Example:**
```js
BareMetal.ComponentFactories.create.ganttTask('Build API', '2026-05-01', '2026-05-10', { progress: 0.6 });
```

### `create.treeNode(label, opts)` → `object`

Creates a tree node with defaults `{ label, children: [] }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| label | string | `''` | Node label. |
| opts | object | `{}` | Extra node fields like `icon` or `open`. |

**Example:**
```js
BareMetal.ComponentFactories.create.treeNode('Documents', { icon: '📁', open: true });
```

### `create.tableRow(obj)` → `object`

Shallow-copies a row object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| obj | object | — | Source row object. |

**Example:**
```js
BareMetal.ComponentFactories.create.tableRow({ id: 42, name: 'Northwind' });
```

### `create.navLink(text, href, opts)` → `object`

Creates a navbar link with defaults `{ text, href }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| text | string | `''` | Link label. |
| href | string | `'#'` | Link target. |
| opts | object | `{}` | Extra fields such as `active`. |

**Example:**
```js
BareMetal.ComponentFactories.create.navLink('Pipeline', '/pipeline', { active: true });
```

### `create.navDropdown(title, ...links)` → `array`

Creates a dropdown payload consumed by `m-navbar`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| title | string | — | Dropdown title. |
| links | object[] | `[]` | Link objects created by `create.navLink()`. |

**Example:**
```js
BareMetal.ComponentFactories.create.navDropdown(
  'Reports',
  BareMetal.ComponentFactories.create.navLink('Monthly', '/reports/monthly'),
  BareMetal.ComponentFactories.create.navLink('Annual', '/reports/annual')
);
```

### `create.listItem(key, data)` → `object`

Creates a list item with an `id` property copied from `key`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | string | — | Item ID. |
| data | object | `{}` | Remaining data. |

**Example:**
```js
BareMetal.ComponentFactories.create.listItem('cust-001', { name: 'Contoso' });
```

### `chatEndpoint(messagesKey, url, opts)` → `(state) => (text) => void`

Creates a message sender for `m-chatbot`. It appends a user message immediately, then calls `BareMetal.Communications.call(url, method, body)` when the communications module is available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| messagesKey | string | — | Dotted path to the messages array in state. |
| url | string | — | Endpoint URL. |
| opts | object | `{}` | Transport and response settings. |

**Example:**
```js
const send = BareMetal.ComponentFactories.chatEndpoint('support.messages', '/api/support/chat', {
  bodyKey: 'prompt',
  responseKey: 'answer',
  botName: 'Support Bot'
});
state.sendMessage = send(state);
```

## Configuration / Options

### `chatEndpoint()` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | string | `POST` | HTTP verb passed to `BareMetal.Communications.call()`. |
| `bodyKey` | string | `message` | Request property used for the submitted text. |
| `responseKey` | string | `reply` | Response field used for the bot reply. |
| `botAvatar` | string | `🤖` | Avatar used for successful replies. |
| `botName` | string | `Assistant` | Name used for successful replies. |

## Examples

### Example 1: Wire a chatbot to an API
```js
const { state } = BareMetal.Bind.reactive({ support: { messages: [] } });
state.sendSupport = BareMetal.ComponentFactories
  .chatEndpoint('support.messages', '/api/support/chat', { responseKey: 'message' })(state);
```

### Example 2: Seed a dashboard UI
```js
const create = BareMetal.ComponentFactories.create;
const dashboardState = {
  nav: [
    create.navLink('Home', '/'),
    create.navDropdown('Operations', create.navLink('Jobs', '/jobs'), create.navLink('Agents', '/agents'))
  ],
  alerts: [create.toast('3 jobs completed', { type: 'success', title: 'Scheduler' })],
  tasks: [create.ganttTask('Import data', '2026-05-01', '2026-05-03', { progress: 1 })]
};
```

## Notes
- `message()` and `botMessage()` stamp `time` using the local clock at creation time.
- `chatEndpoint()` silently does nothing if `messagesKey` does not resolve to an array.
- Error responses are converted into bot messages from `System` with a `⚠️` avatar.
