# BareMetal.Template

> Schema-driven builders for Bind-ready forms, inputs, labels, and data tables.

**Size:** 7.6 KB source / 4.8 KB minified  
**Dependencies:** None

## Quick Start

```html
<div id="app"></div>

<script src="BareMetal.Template.min.js"></script>
<script>
  const form = BareMetal.Template.buildForm(
    { columns: 2, fields: ['name', 'email', 'isActive'] },
    {
      name: { label: 'Customer name', required: true },
      email: { type: 'Email', required: true },
      isActive: { type: 'boolean', label: 'Active account' }
    }
  );

  document.getElementById('app').appendChild(form);
</script>
```

## API Reference

### `buildForm(layout, fields)` → `HTMLFormElement`

Builds a `<form>` with `m-submit="save"` and `m-value` bindings for each field.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| layout | object | — | Layout object with `columns` and optional ordered `fields`. |
| fields | object | — | Field schema keyed by field name. |

**Example:**
```js
const form = BareMetal.Template.buildForm(
  { columns: 2, fields: ['firstName', 'lastName', 'country'] },
  {
    firstName: { required: true },
    lastName: { required: true },
    country: { type: 'Country', label: 'Country/Region' }
  }
);
```

### `buildTable(fields, items, callbacks)` → `HTMLDivElement`

Builds a simple table view from field metadata and an item array.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fields | object | — | Field schema keyed by field name. Readonly fields are omitted. |
| items | object[] | — | Rows to render. |
| callbacks | object | `{}` | Optional `resolve`, `onView`, `onEdit`, and `onDelete` hooks. |

**Example:**
```js
const table = BareMetal.Template.buildTable(fields, customers, {
  resolve: (name, value) => name === 'country' ? countryMap[value] || value : value,
  onEdit: id => openCustomer(id)
});
```

### `buildInput(name, field)` → `HTMLElement`

Builds the appropriate control for a single field. Supported types include text, number, textarea, select, boolean, file, `Country`, `Date`, `DateTime`, `Time`, `Email`, `Password`, and more.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Field name used for the `m-value` path. |
| field | object | — | Field schema. |

**Example:**
```js
const input = BareMetal.Template.buildInput('avatar', { type: 'file', accept: 'image/*' });
```

### `buildLabel(name, field)` → `HTMLLabelElement`

Builds a human-friendly label, falling back to a split-camel-case version of the field name.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Field name. |
| field | object | — | Field schema. |

**Example:**
```js
BareMetal.Template.buildLabel('firstName', {}); // label text becomes "first Name"
```

## Configuration / Options

### Layout object

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | number | `1` | Number of grid columns. |
| `fields` | string[] | `Object.keys(fields)` | Ordered field list. |

### Field schema

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | `text` | Field type. Special values include `boolean`, `textarea`, `select`, `Country`, `file`, `Date`, `DateTime`, `Email`, `Password`, `Integer`, `Decimal`, `Money`, `Phone`, and `Url`. |
| `label` | string | derived from name | Visible label text. |
| `required` | boolean | `false` | Marks the field as required. |
| `placeholder` | string | — | Input placeholder. |
| `readonly` | boolean | `false` | Disables the field and applies a muted class. |
| `rows` | number | `3` | Textarea rows. |
| `options` | array | `[]` | Select options as strings or `{ value, label }` objects. |
| `accept` | string | — | Accepted MIME types for file inputs. |
| `lookupUrl` | string | — | Adds built-in add/refresh controls beside a select field. |
| `lookupValueField` | string | `id` | Field used by the refresh button metadata. |
| `lookupDisplayField` | string | `name` | Display field used by the refresh button metadata. |

### Table callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| `resolve` | `(fieldName, rawValue) => string` | Formats displayed cell values. |
| `onView` | `(id, item) => void` | Adds a view button. |
| `onEdit` | `(id, item) => void` | Adds an edit button. |
| `onDelete` | `(id, item) => void` | Adds a delete button. |

## Examples

### Example 1: Customer form with lookup actions
```html
<div id="editor"></div>
<script>
  const form = BareMetal.Template.buildForm(
    { columns: 2, fields: ['name', 'accountManagerId', 'country', 'notes'] },
    {
      name: { required: true, placeholder: 'Contoso Ltd' },
      accountManagerId: {
        type: 'select',
        label: 'Account manager',
        lookupUrl: '/api/users',
        options: [{ value: '7', label: 'Ava Patel' }]
      },
      country: { type: 'Country' },
      notes: { type: 'textarea', rows: 5 }
    }
  );
  document.getElementById('editor').appendChild(form);
</script>
```

### Example 2: CRUD table with custom display values
```js
const table = BareMetal.Template.buildTable(
  {
    name: { label: 'Customer' },
    isActive: { label: 'Active', type: 'boolean' },
    accountManagerId: { label: 'Manager' }
  },
  data,
  {
    resolve: (field, value) => field === 'accountManagerId' ? managerNames[value] || value : value,
    onView: id => openDrawer(id),
    onEdit: id => router.navigate(`/customers/${id}/edit`),
    onDelete: id => confirmDelete(id)
  }
);
```

## Notes
- Hidden fields are rendered as hidden inputs and skipped in the visible layout.
- Boolean fields render as checkbox rows with a click target label.
- Select fields with `lookupUrl` only render helper buttons; loading and refreshing the options is handled elsewhere, typically by `BareMetal.Rendering`.
