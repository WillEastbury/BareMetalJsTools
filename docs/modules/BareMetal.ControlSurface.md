# BareMetal.ControlSurface

Dependency-free browser module. Source: `./src/BareMetal.ControlSurface.js`.

## Load

```html
<script src="../src/BareMetal.ControlSurface.js"></script>
```

## Public API

### `create(options)`

Call `BareMetal.ControlSurface.create(...)` using the arguments shown by the function implementation.

## Example

```js
const panel = BareMetal.ControlSurface.create({ title:'Settings', fields:[{ name:'level', type:'range', min:0, max:1, defaultValue:0.7 }] });
document.querySelector('#app').append(panel.element);
```
