# BareMetal.ThemePicker

Dependency-free browser module. Source: `./src/BareMetal.ThemePicker.js`.

## Load

```html
<script src="../src/BareMetal.ThemePicker.js"></script>
```

## Public API

### `create(options)`

Call `BareMetal.ThemePicker.create(...)` using the arguments shown by the function implementation.

## Example

```js
const picker = BareMetal.ThemePicker.create({ themes, selected:'wavefunction', link:themeLink });
document.querySelector('#settings').append(picker.element);
```
