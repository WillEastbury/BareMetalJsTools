# BareMetal.Rendering

> Metadata-driven entity controller that loads schemas, hydrates lookups, binds state, and renders forms.

**Size:** 4.0 KB source / 1.9 KB minified  
**Dependencies:** `BareMetal.Communications`, `BareMetal.Bind`, `BareMetal.Template`

## Quick Start

```html
<div id="app"></div>

<script src="BareMetal.Communications.min.js"></script>
<script src="BareMetal.Bind.min.js"></script>
<script src="BareMetal.Template.min.js"></script>
<script src="BareMetal.Rendering.min.js"></script>
<script>
  BareMetal.Communications.setRoot('/api/');

  (async () => {
    const customer = await BareMetal.Rendering.createEntity('customer');
    customer.renderUI('app');
  })();
</script>
```

## API Reference

### `createEntity(slug)` → `Promise<object>`

Loads metadata for one entity, creates reactive state, hydrates lookup options, and returns a controller object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| slug | string | — | Entity slug passed to `BareMetal.Communications.entity(slug)`. |

**Example:**
```js
const customer = await BareMetal.Rendering.createEntity('customer');
await customer.load(42);
customer.renderUI(document.getElementById('editor'));
```

#### Entity controller members

| Member | Type | Description |
|--------|------|-------------|
| `state` | object | Reactive proxy returned from `BareMetal.Bind.reactive()`. |
| `meta` | object | Metadata returned by `api.metadata()`. |
| `api` | object | Entity API object from `BareMetal.Communications.entity(slug)`. |
| `save(formEl)` | function | Creates or updates the entity. Uses `FormData` when file inputs have selected files. |
| `load(id)` | function | Loads one entity and merges it into state. |
| `renderUI(el)` | function | Clears a container, builds a form, assigns `state.save`, and binds it. |
| `resolve(fieldName, rawValue)` | function | Resolves select lookup values to display labels when options exist. |

### `listEntities()` → `Promise<any>`

Fetches the global entity list from `BareMetal.Communications.getRoot() + '_meta'` and caches the result after the first call.

**Example:**
```js
const entities = await BareMetal.Rendering.listEntities();
```

### `window.minibind` → `object`

Global alias exposed for a small declarative surface.

| Member | Description |
|--------|-------------|
| `setRoot(root)` | Calls `BareMetal.Communications.setRoot(root)`. |
| `createNewEntity(name)` | Alias for `createEntity(name)`. |
| `listEntities()` | Alias for `BareMetal.Rendering.listEntities()`. |
| `bind` | Direct reference to `BareMetal.Bind.bind`. |

**Example:**
```js
window.minibind.setRoot('/api/');
const invoice = await window.minibind.createNewEntity('invoice');
invoice.renderUI('app');
```

## Configuration / Options

### Metadata fields consumed by this module

| Field property | Description |
|----------------|-------------|
| `lookupUrl` | Triggers a pre-render fetch to populate select options. |
| `lookupValueField` | Field used to build lookup option values. |
| `lookupDisplayField` | Field used to build lookup option labels. |
| `layout` | Passed to `BareMetal.Template.buildForm()`. |
| `initialData` | Seed object for `BareMetal.Bind.reactive()`. |

## Examples

### Example 1: Create or edit a customer
```js
const customer = await BareMetal.Rendering.createEntity('customer');
if (customerId) {
  await customer.load(customerId);
}
customer.renderUI(document.getElementById('customer-editor'));
```

### Example 2: Resolve lookup labels in a list view
```js
const project = await BareMetal.Rendering.createEntity('project');
const rows = await project.api.list();
const table = BareMetal.Template.buildTable(project.meta.schema.fields, rows, {
  resolve: project.resolve,
  onEdit: id => router.navigate(`/projects/${id}/edit`)
});
document.getElementById('project-list').appendChild(table);
```

## Notes
- `createEntity()` mutates lookup field metadata in place by attaching `options` before rendering.
- `save()` decides between `api.create()` and `api.update(id, payload)` by checking `state.id` or `state.Id`.
- When a file input contains data, `save()` submits a `FormData` payload and appends each selected file under the element's `m-value` name.
