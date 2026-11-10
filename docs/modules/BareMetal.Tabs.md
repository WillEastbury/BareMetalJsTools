# BareMetal.Tabs

Dependency-free browser module. Source: `./src/BareMetal.Tabs.js`.

## Load

```html
<script src="../src/BareMetal.Tabs.js"></script>
```

## Public API

### `create(options)`

Call `BareMetal.Tabs.create(...)` using the arguments shown by the function implementation.

## Example

```js
const tabs = BareMetal.Tabs.create({ items:[{id:'one',label:'One',content:panelOne},{id:'two',label:'Two',content:panelTwo}] });
document.querySelector('#app').append(tabs.element);
```
