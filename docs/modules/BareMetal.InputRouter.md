# BareMetal.InputRouter

Dependency-free browser module. Source: `./src/BareMetal.InputRouter.js`.

## Load

```html
<script src="../src/BareMetal.InputRouter.js"></script>
```

## Public API

### `create(options)`

Call `BareMetal.InputRouter.create(...)` using the arguments shown by the function implementation.

## Example

```js
const router = BareMetal.InputRouter.create({ element:document, onAction:event => console.log(event.action) });
```
