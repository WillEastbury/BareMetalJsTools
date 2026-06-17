# BareMetal.Forms

> Declarative form helpers for serialization, validation, masking, wizards, repeaters, autosave, conditional fields, generated forms, and submit flows.

**Size:** 37 KB source / 20 KB minified  
**Dependencies:** None

## Quick Start

```html
<form id="signupForm">
  <label>Email <input name="email" type="email"></label>
  <label>Password <input name="password" type="password"></label>
  <label>Confirm <input name="confirm" type="password"></label>
  <button type="submit">Create account</button>
</form>
<script src="BareMetal.Forms.min.js"></script>
<script>
  const form = document.getElementById('signupForm');
  const api = BareMetal.Forms.create(form, {
    fields: {
      email: { required: true, email: true },
      password: { required: true, minLength: 8 },
      confirm: { required: true, match: 'password', label: 'Confirm password' }
    }
  });

  api.onSubmit(function (values, ev, state) {
    ev.preventDefault();
    console.log('Submit:', values, state.valid);
  });
</script>
```

## API Reference

### `create(form, schema)` → `formApi`

Creates a managed form instance with validation, change tracking, and submit hooks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | HTMLFormElement | — | Form element to manage. |
| schema | object | `{}` | Validation schema. Use either `{ fields: ... }` or a plain field map. |

**Example:**
```js
const api = BareMetal.Forms.create(form, {
  fields: {
    email: { required: true, email: true }
  }
});
```

### `formApi.validate()` → `{ valid, errors }`

Validates the managed form against its schema and stores the latest error state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const result = api.validate();
```

### `formApi.getValues()` → `object`

Serializes current field values.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(api.getValues());
```

### `formApi.setValues(obj)` → `formApi`

Populates form fields from an object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| obj | object | `{}` | Values keyed by field name. |

**Example:**
```js
api.setValues({ email: 'ada@example.com' });
```

### `formApi.reset()` → `formApi`

Resets the form, restores initial values, and clears touched/errors state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
api.reset();
```

### `formApi.destroy()` → `void`

Removes all listeners added by `create()` and deletes internal metadata.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
api.destroy();
```

### `formApi.onSubmit(cb)` → `formApi`

Adds a managed submit callback.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cb | function | — | Receives `(values, event, state)`. |

**Example:**
```js
api.onSubmit(function (values) {
  console.log(values);
});
```

### `formApi.onChange(cb)` → `formApi`

Adds a managed change callback.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cb | function | — | Receives `(values, state, event)`. |

**Example:**
```js
api.onChange(function (values, state) {
  console.log(state.dirty, values);
});
```

### `formApi.getState()` → `object`

Returns current `dirty`, `pristine`, `valid`, `invalid`, `touched`, `untouched`, `errors`, and `values` state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(api.getState());
```

### `getState(form)` → `object`

Reads current state for any form, even if it was not created through `create()` yet.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | Element | — | Form root to inspect. |

**Example:**
```js
console.log(BareMetal.Forms.getState(form));
```

### `serialize(form)` → `object`

Serializes form controls by `name`, handling radio groups, checkbox groups, files, and multi-selects.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | Element | — | Form or container root. |

**Example:**
```js
const values = BareMetal.Forms.serialize(form);
```

### `deserialize(form, data)` → `Element`

Writes object values back into matching controls.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | Element | — | Form or container root. |
| data | object | `{}` | Values keyed by field name. |

**Example:**
```js
BareMetal.Forms.deserialize(form, { plan: 'pro', agree: true });
```

### `validate(root, rules)` → `{ valid, errors }`

Validates serialized values using rule properties such as `required`, `email`, `url`, `pattern`, `match`, `minLength`, `maxLength`, `min`, `max`, and `custom`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| root | Element | — | Form or container root. |
| rules | object | — | Field rule map or `{ fields: ... }`. |

**Example:**
```js
const result = BareMetal.Forms.validate(form, {
  email: { required: true, email: true },
  age: { min: 18, type: 'number' }
});
```

### `mask(input, pattern)` → `{ destroy() }`

Applies a simple token mask. `#` matches digits, `A` letters, and `*` any character.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | HTMLInputElement | — | Input to mask. |
| pattern | string | — | Mask pattern such as `(###) ###-####`. |

**Example:**
```js
const phoneMask = BareMetal.Forms.mask(phoneInput, '(###) ###-####');
```

### `wizard(container, steps)` → `wizardApi`

Creates a stepper that shows fields or `[data-step]` blocks one step at a time.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| container | Element | — | Wizard root or form wrapper. |
| steps | array | `[]` | Step definitions with `id`, `fields`, and optional `validate(values, step, index)`. |

**Example:**
```js
const wizard = BareMetal.Forms.wizard(form, [
  { id: 'account', fields: ['email', 'password'] },
  { id: 'profile', fields: ['name'] }
]);
```

### `wizardApi.next()` / `wizardApi.prev()` / `wizardApi.goTo(n)` → `number`

Moves through the wizard and returns the current step index.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| n | number | — | Step index for `goTo()`. Omit for `next()` and `prev()`. |

**Example:**
```js
wizard.next();
wizard.goTo(1);
```

### `wizardApi.getCurrentStep()` → `object | null`

Returns the current step definition plus its `index`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(wizard.getCurrentStep());
```

### `wizardApi.isFirst()` / `wizardApi.isLast()` → `boolean`

Reports whether the current wizard step is the first or last step.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(wizard.isLast());
```

### `wizardApi.onStep(cb)` → `wizardApi`

Subscribes to step changes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cb | function | — | Receives `(step, index)`. |

**Example:**
```js
wizard.onStep(function (step, index) {
  console.log(step.id, index);
});
```

### `wizardApi.submit()` → `object`

Dispatches a synthetic submit event on the managed form and returns serialized values.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const values = wizard.submit();
```

### `repeater(container, opts)` → `repeaterApi`

Creates a repeatable item region that appends template HTML and supports add/remove events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| container | Element | — | Repeater root. |
| opts | object | `{}` | Supports `template`, `addBtn`, `removeBtn`, `min`, and `max`. |

**Example:**
```js
const reps = BareMetal.Forms.repeater(document.getElementById('phones'), {
  addBtn: '#addPhone',
  template: '<div data-bm-repeat-item><input name="number"><button data-remove>Remove</button></div>'
});
```

### `repeaterApi.add(data)` → `Element | null`

Adds a new repeated row and optionally deserializes initial row data into it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| data | object | `{}` | Initial row values. |

**Example:**
```js
reps.add({ number: '555-1234' });
```

### `repeaterApi.remove(index)` → `boolean`

Removes one repeated row by index.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| index | number | — | Row index to remove. |

**Example:**
```js
reps.remove(0);
```

### `repeaterApi.getAll()` → `array`

Serializes every repeated row.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(reps.getAll());
```

### `repeaterApi.onAdd(cb)` / `repeaterApi.onRemove(cb)` → `repeaterApi`

Subscribes to row add or remove events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cb | function | — | `onAdd` receives `(node, data, index)` and `onRemove` receives `(index, node)`. |

**Example:**
```js
reps.onAdd(function (node, data, index) {
  console.log(index, data);
});
```

### `repeaterApi.destroy()` → `void`

Removes repeater event listeners.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
reps.destroy();
```

### `autosave(form, opts)` → `autosaveApi`

Persists serialized form values to storage on input/change with debounce.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | HTMLFormElement | — | Form to persist. |
| opts | object | `{}` | Supports `key`, `debounce`, `storage`, `onSave`, and `onRestore`. |

**Example:**
```js
const autosave = BareMetal.Forms.autosave(form, { debounce: 300 });
```

### `autosaveApi.restore()` → `object | null`

Reads saved values from storage, reapplies them to the form, and returns the restored object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
autosave.restore();
```

### `autosaveApi.clear()` / `autosaveApi.destroy()` → `void`

Clears the saved payload or removes autosave listeners.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
autosave.clear();
autosave.destroy();
```

### `conditional(form, rules)` → `{ destroy() }`

Shows or hides named fields based on other field values.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | Element | — | Form root. |
| rules | array | `[]` | Rules with `when` and `show`. `when` supports `field`, `equals`, `notEquals`, `in`, and `truthy`. |

**Example:**
```js
const conditional = BareMetal.Forms.conditional(form, [{
  when: { field: 'plan', equals: 'business' },
  show: ['vatNumber']
}]);
```

### `submit(form, handler, opts)` → `{ destroy() }`

Adds a submit pipeline with validation, pending-state handling, optional disabling, loading classes, and error rendering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | HTMLFormElement | — | Form to submit. |
| handler | function | — | Called with serialized form values. May return a promise. |
| opts | object | `{}` | Supports `errorContainer`, `disableOnSubmit`, `loadingClass`, and `resetOnSuccess`. |

**Example:**
```js
BareMetal.Forms.submit(form, async function (values) {
  await saveForm(values);
}, {
  disableOnSubmit: true,
  loadingClass: 'is-loading',
  errorContainer: '#formErrors'
});
```

### `fromJSON(container, schema)` → `formApi`

Generates a form UI from JSON field definitions, mounts it into `container`, and returns the same API shape as `create()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| container | Element | — | Container or existing form element. |
| schema | object | — | Schema with `layout` and `fields` array definitions. |

**Example:**
```js
const generated = BareMetal.Forms.fromJSON(document.getElementById('mount'), {
  layout: 'vertical',
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'role', type: 'select', options: ['Admin', 'User'] }
  ]
});
```

### `toFormData(form)` → `FormData`

Builds a `FormData` object from the current form state, including files.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | Element | — | Form or form-like container. |

**Example:**
```js
const fd = BareMetal.Forms.toFormData(form);
```

### `diff(form)` → `object`

Returns only fields whose current values differ from the stored initial snapshot.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | Element | — | Form to diff. |

**Example:**
```js
console.log(BareMetal.Forms.diff(form));
```

### `focus(form, opts)` → `{ destroy() }`

Adds keyboard-focused form UX helpers such as Enter-to-next, tab trapping, and first-invalid focus after submit.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| form | HTMLFormElement | — | Form to enhance. |
| opts | object | `{}` | Supports `firstInvalid`, `nextOnEnter`, and `tabTrap`. |

**Example:**
```js
const focus = BareMetal.Forms.focus(form, { nextOnEnter: true, tabTrap: true });
```

## Notes

- `serialize()` and `deserialize()` work with radios, single and grouped checkboxes, files, multi-selects, and repeated field names.
- Validation rule objects can be passed directly or nested under `fields`.
- `mask()` uses `#`, `A`, and `*` tokens only; literals are preserved automatically.
- `wizard()` can target `[data-step="..."]` blocks or infer steps from field names.
- `repeater()` expects repeated rows to carry `data-bm-repeat-item`; it adds the attribute when needed.
- `autosave()` skips `File` objects and defaults its storage key to `BareMetal.Forms.<form.id|name|form>`.
- `conditional()` toggles wrapper visibility and updates `aria-hidden`.
