# BareMetal.Metadata

Client-side entity schema registry. Declare entity metadata in your page, fetch it from the server, or parse PicoWAL binary schema cards — then auto-render forms and tables via `BareMetal.Template` and bind them with `BareMetal.Bind`.

---

## Quick start

```html
<script src="src/BareMetal.Metadata.js"></script>
<script src="src/BareMetal.Template.js"></script>
<script src="src/BareMetal.Bind.js"></script>

<!-- Inline metadata -->
<script type="application/bm-meta">
{
  "name": "Customer",
  "schema": {
    "fields": {
      "name":  { "type": "text",  "label": "Name",  "required": true },
      "email": { "type": "Email", "label": "Email" },
      "active":{ "type": "boolean","label": "Active" }
    }
  },
  "layout": { "columns": 2, "fields": ["name", "email", "active"] }
}
</script>

<div id="customer-form"></div>

<script>
  BareMetal.Metadata.scanInline();
  BareMetal.Metadata.renderForm('customer', document.getElementById('customer-form'));
</script>
```

---

## API

### `register(meta)` → normalized entity

Accepts **simple** or **rich** format (auto-detected). Returns the normalized entity and stores it in the registry.

### `get(slug)` → entity | null

Retrieve a registered entity by slug.

### `list()` → string[]

Return all registered slugs.

### `remove(slug)` → boolean

Remove an entity from the registry. Returns `true` if it existed.

### `scanInline()` → entity[]

Scans all `<script type="application/bm-meta">` tags in the document, parses and registers each one.

### `fetchAndRegister(url)` → Promise\<entity\>

Fetches JSON from `url` (uses `BareMetal.Rest` if loaded, otherwise `fetch`), registers the result.

```js
await BareMetal.Metadata.fetchAndRegister('/api/metadata/customer');
```

### `renderForm(slug, rootElement, state?, watch?)` → { form, state, watch }

Builds a form via `BareMetal.Template.buildForm()`, appends it to `rootElement`, and optionally binds reactive state via `BareMetal.Bind`. If `state`/`watch` are omitted, creates fresh reactive state from `initialData`.

### `renderTable(slug, rootElement, items, callbacks)` → HTMLElement

Builds a table via `BareMetal.Template.buildTable()` and appends it to `rootElement`.

### `toTemplateFields(slugOrMeta)` → { fields, layout } | null

Returns the `fields` and `layout` objects ready for `BareMetal.Template.buildForm()`.

### `fromBinary(arrayBuffer)` → entity

Parses a PicoWAL Pack-0 binary schema card and registers it. Requires `BareMetal.Binary`.

---

## Schema formats

### Simple format

Used by `/api/metadata/{entity}` endpoints:

```json
{
  "name": "Customer",
  "endpoint": "/api/customer",
  "schema": {
    "fields": {
      "name":  { "type": "text", "label": "Name", "required": true },
      "email": { "type": "Email", "label": "Email" }
    }
  },
  "layout": { "columns": 2, "fields": ["name", "email"] },
  "initialData": { "name": "", "email": "" }
}
```

### Rich format

Used by `/meta/{object}` endpoints — fields as an array with extra attributes:

```json
{
  "name": "Order",
  "slug": "order",
  "fields": [
    { "name": "id", "type": "hidden", "isIdField": true },
    { "name": "total", "type": "money", "label": "Total", "required": true },
    { "name": "status", "type": "text", "enumValues": ["open", "shipped", "closed"] }
  ]
}
```

Rich format is auto-detected when `fields` is an array. Enum values become `select` dropdowns. `isIdField` fields are hidden.

### Type normalisation

| Input types | Normalised to |
|---|---|
| `Country` | `Country` |
| `Email` | `Email` |
| `number`, `integer`, `decimal`, `money` | `number` |
| `boolean`, `bool` | `boolean` |
| `datetime`, `datetime-local` | `datetime-local` |
| Everything else | passed through |

---

## m-entity directive

When using `BareMetal.Components`, you can render entities declaratively:

```html
<!-- Auto-render form -->
<div m-entity="customer" m-mode="form"></div>

<!-- Auto-render table -->
<div m-entity="order" m-mode="table" m-items="orderList"></div>
```

| Attribute | Description |
|---|---|
| `m-entity` | Entity slug (must be registered) |
| `m-mode` | `form` (default) or `table` |
| `m-items` | State key for table data (default: `{slug}List`) |
| `m-on-view` | State key for view callback |
| `m-on-edit` | State key for edit callback |
| `m-on-delete` | State key for delete callback |

---

## Dependencies

| Feature | Requires |
|---|---|
| `renderForm()` | `BareMetal.Template`, optionally `BareMetal.Bind` |
| `renderTable()` | `BareMetal.Template` |
| `fetchAndRegister()` | `BareMetal.Rest` or native `fetch` |
| `fromBinary()` | `BareMetal.Binary` |
| `m-entity` directive | `BareMetal.Components` + `BareMetal.Metadata` |
