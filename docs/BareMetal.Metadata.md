# BareMetal.Metadata

> Client-side registry and normalization helpers for entity metadata.

**Size:** 8.4 KB source / 4.1 KB minified  
**Dependencies:** None; optional `BareMetal.Communications`, `BareMetal.Template`, `BareMetal.Bind`; `BareMetal.Binary` for `fromBinary()`

## Quick Start

```html
<div id="customer-form"></div>

<script src="BareMetal.Bind.min.js"></script>
<script src="BareMetal.Template.min.js"></script>
<script src="BareMetal.Metadata.min.js"></script>
<script>
  const meta = BareMetal.Metadata.register({
    name: 'Customer',
    fields: [
      { name: 'id', type: 'hidden', isIdField: true },
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email' },
      { name: 'isActive', type: 'boolean', label: 'Active' }
    ]
  });

  const { state, watch } = BareMetal.Bind.reactive(meta.initialData);
  BareMetal.Metadata.renderForm(meta.slug, document.getElementById('customer-form'), state, watch);
</script>
```

## API Reference

### `register(meta)` → `object`

Normalizes metadata and stores it by slug. Accepts either a rich `fields: []` format or a simpler `schema.fields` format.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| meta | object | — | Entity metadata definition. |

**Example:**
```js
const customer = BareMetal.Metadata.register({
  name: 'Customer',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'tier', type: 'text', enumValues: ['Bronze', 'Silver', 'Gold'] }
  ]
});
```

### `get(slug)` → `object | null`

Returns a registered metadata record.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| slug | string | — | Registered entity slug. |

**Example:**
```js
BareMetal.Metadata.get('customer');
```

### `list()` → `string[]`

Returns registered slugs.

**Example:**
```js
BareMetal.Metadata.list();
```

### `remove(slug)` → `boolean`

Deletes a metadata entry and returns whether it existed.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| slug | string | — | Slug to remove. |

**Example:**
```js
BareMetal.Metadata.remove('customer');
```

### `scanInline()` → `object[]`

Reads `<script type="application/bm-meta">` tags, parses JSON, registers each valid payload, and returns the normalized records.

**Example:**
```js
BareMetal.Metadata.scanInline();
```

### `fetchAndRegister(url)` → `Promise<object>`

Fetches metadata JSON and registers it. If `BareMetal.Communications` exists, it calls `BareMetal.Communications.call(url, 'GET')`; otherwise it falls back to `fetch(url)`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | Metadata endpoint. |

**Example:**
```js
await BareMetal.Metadata.fetchAndRegister('/meta/customer.json');
```

### `toTemplateFields(metaOrSlug)` → `{ fields, layout } | null`

Returns the `fields` and `layout` fragments expected by `BareMetal.Template`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| metaOrSlug | object \| string | — | A registered slug or metadata object. |

**Example:**
```js
const { fields, layout } = BareMetal.Metadata.toTemplateFields('customer');
```

### `renderForm(slugOrMeta, rootElement, state, watch)` → `{ form, state, watch }`

Renders a metadata-driven form into `rootElement` when `BareMetal.Template` is available. If `state` is omitted and `BareMetal.Bind` is present, it tries `BareMetal.Bind.create(...)`; otherwise it falls back to a plain cloned state and a no-op watcher.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| slugOrMeta | string \| object | — | Slug or metadata object. |
| rootElement | Element | — | Render target. |
| state | object | optional | State object to bind. |
| watch | function | optional | Watch function for the supplied state. |

**Example:**
```js
const result = BareMetal.Metadata.renderForm('customer', document.getElementById('editor'), state, watch);
```

### `renderTable(slugOrMeta, rootElement, items, callbacks)` → `HTMLElement | null`

Renders a metadata-driven table when `BareMetal.Template` is available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| slugOrMeta | string \| object | — | Slug or metadata object. |
| rootElement | Element | — | Render target. |
| items | object[] | — | Row data. |
| callbacks | object | `{}` | Passed through to `BareMetal.Template.buildTable()`. |

**Example:**
```js
BareMetal.Metadata.renderTable('customer', listRoot, customers, { onEdit: id => openEditor(id) });
```

### `fromBinary(buffer)` → `object`

Parses a Pack-0 binary metadata payload and registers the resulting entity definition.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| buffer | ArrayBuffer | — | Pack-0 binary metadata blob. |

**Example:**
```js
const meta = BareMetal.Metadata.fromBinary(arrayBuffer);
```

## Configuration / Options

### Rich format input

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Entity display name. |
| `slug` | string | Optional explicit slug. |
| `endpoint` | string | Optional API endpoint override. |
| `fields[]` | object[] | Field definitions in rich format. |

### Rich field properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Field key. |
| `type` | string | Field type, normalized internally. |
| `label` | string | Display label. |
| `required` | boolean | Marks the field as required. |
| `readOnly` | boolean | Marks the field as readonly. |
| `isIdField` | boolean | Makes the field readonly and hidden. |
| `enumValues` | string[] | Converts the field to a `select` with generated options. |
| `list` / `edit` / `create` | boolean | Extra flags preserved on the normalized field. |

### Simple format input

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Entity display name. |
| `slug` | string | Optional explicit slug. |
| `endpoint` | string | Optional API endpoint override. |
| `schema.fields` | object | Prebuilt field schema. |
| `layout` | object | Optional template layout. |
| `initialData` | object | Optional initial values. |

## Examples

### Example 1: Inline metadata blocks
```html
<script type="application/bm-meta">
{
  "name": "Project",
  "fields": [
    { "name": "name", "type": "text", "required": true },
    { "name": "status", "type": "text", "enumValues": ["Draft", "Active", "Closed"] }
  ]
}
</script>
<script>
  const [projectMeta] = BareMetal.Metadata.scanInline();
  console.log(projectMeta.slug); // project
</script>
```

### Example 2: Render a metadata table
```js
BareMetal.Metadata.register({
  name: 'Ticket',
  schema: {
    fields: {
      title: { label: 'Title' },
      priority: { label: 'Priority' },
      isOpen: { label: 'Open', type: 'boolean' }
    }
  }
});
BareMetal.Metadata.renderTable('ticket', document.getElementById('tickets'), ticketRows, {
  onView: id => console.log('view', id),
  onDelete: id => console.log('delete', id)
});
```

## Notes
- `register()` normalizes slugs to lowercase kebab-case when none is supplied.
- Rich-format numeric fields default to `0`; boolean fields default to `false`; everything else defaults to `''`.
- `fromBinary()` validates the Pack-0 header and throws if `BareMetal.Binary` is unavailable.
