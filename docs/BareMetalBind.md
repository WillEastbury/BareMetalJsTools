# BareMetalBind

Tiny reactive state + DOM directive binder, ~75 lines, no dependencies.

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

### `bind(root, state, watch)`

Scans the subtree of `root` for directive attributes and wires them up:

| Directive | On | Effect |
|---|---|---|
| `rv-value="key"`     | `<input>`, `<select>`, `<textarea>` | Two-way binding. Handles `checkbox`, `date`, `datetime-local`. |
| `rv-text="key"`      | any element | One-way text content binding. |
| `rv-if="key"`        | any element | Hides element when value is falsy. |
| `rv-on-click="fn"`   | any element | Calls `state[fn](event)` on click. |
| `rv-on-submit="fn"`  | `<form>`   | Calls `state[fn](event)` on submit, with `preventDefault()`. |

## Example

```html
<form>
  <input rv-value="email" type="email">
  <input rv-value="agree" type="checkbox">
  <button rv-on-click="save" rv-if="agree">Save</button>
  <p rv-text="status"></p>
</form>

<script src="src/BareMetalBind.js"></script>
<script>
  const { state, watch } = BareMetalBind.reactive({
    email: '', agree: false, status: '',
    save() { state.status = `Saving ${state.email}…`; }
  });
  BareMetalBind.bind(document.querySelector('form'), state, watch);
</script>
```

## Notes

* No virtual DOM. Bindings touch only the elements that change.
* `rv-value` parses date inputs to ISO strings (`YYYY-MM-DD` / `YYYY-MM-DDTHH:MM`).
* Re-running `bind()` on the same root is safe — it reuses the same listener slots.
