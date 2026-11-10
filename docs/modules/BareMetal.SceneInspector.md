# BareMetal.SceneInspector

Dependency-free browser module. Source: `./src/BareMetal.SceneInspector.js`.

## Load

```html
<script src="../src/BareMetal.SceneInspector.js"></script>
```

## Public API

### `create(options)`

Call `BareMetal.SceneInspector.create(...)` using the arguments shown by the function implementation.

## Example

```js
const inspector = BareMetal.SceneInspector.create({ targets:[scene], adapter });
document.querySelector('#app').append(inspector.element);
```
