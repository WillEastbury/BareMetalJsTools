# BareMetalTemplate

Schema-driven DOM builder. Produces Bootstrap-compatible markup from server-supplied field metadata. No template strings, no JSX, no DSL — just functions returning `HTMLElement`.

## API

| Function | Returns | Notes |
|---|---|---|
| `buildForm(layout, fields)`        | `HTMLElement` | Bootstrap-grid form. |
| `buildTable(fields, items, callbacks)` | `HTMLElement` | Bootstrap table. |
| `buildBmwForm(layout, fields)`     | `HTMLElement` | Same as `buildForm`, but uses BMW grammar (`<ds>`/`<dr>`/`<dc>` custom elements) instead of Bootstrap grid. |
| `buildBmwTable(fields, items, cb)` | `HTMLElement` | BMW grammar table. |
| `ds`, `dr`, `dc`, `db`, `dn`, `ta`, `ch`, `gt`, `cl` | `HTMLElement` | Low-level BMW custom-element factories. |

## `fields` shape

`fields` is a `{ [name]: FieldDescriptor }` map. Each descriptor:

```ts
{
  type:      'String'|'Integer'|'Decimal'|'Money'|'Bool'|'Date'|'DateTime'|'Time'|
             'Email'|'Password'|'Url'|'Phone'|'Country'|'Lookup'|'Hidden'|...,
  label?:    string,
  required?: boolean,
  readonly?: boolean,
  options?:  Array<{ value, label }>,   // for select / lookup
  lookupUrl?: string,                   // hydrated by BareMetalRendering
  default?:  any,
  value?:    any                        // initial / current value
}
```

## `layout` shape

```ts
{
  rows: [
    { cols: [ { field: 'name', span: 6 }, { field: 'email', span: 6 } ] },
    { cols: [ { field: 'notes', span: 12 } ] }
  ]
}
```

If `layout` is omitted, a single column of all fields is produced.

## `buildTable` callbacks

```js
buildTable(fields, items, {
  onRowClick:   row => navigate(row.id),
  onEdit:       row => …,
  onDelete:     row => …,
  rowClass:     row => row.disabled ? 'text-muted' : ''
});
```

Boolean fields render as Bootstrap badges. Date/datetime values are formatted via the browser's locale.

## Example

```js
const fields = {
  name:  { type: 'String',  label: 'Name', required: true },
  age:   { type: 'Integer', label: 'Age' },
  email: { type: 'Email',   label: 'Email' }
};
const layout = { rows: [{ cols: [
  { field: 'name',  span: 6 },
  { field: 'email', span: 6 },
  { field: 'age',   span: 12 }
] }] };

document.getElementById('app').appendChild(BareMetalTemplate.buildForm(layout, fields));
```
