# BareMetal.Vector

Dependency-free browser module. Source: `./src/BareMetal.Vector.js`.

## Load

```html
<script src="../src/BareMetal.Vector.js"></script>
```

## Public API

### `createDatabase(options)`

Call `BareMetal.Vector.createDatabase(...)` using the arguments shown by the function implementation.

### `cosineSimilarity(a, b)`

Call `BareMetal.Vector.cosineSimilarity(...)` using the arguments shown by the function implementation.

## Example

```js
const db = BareMetal.Vector.createDatabase();
const collection = db.createCollection('tracks');
collection.upsert('track-1', embedding, { title:'Blue Monday' });
```
