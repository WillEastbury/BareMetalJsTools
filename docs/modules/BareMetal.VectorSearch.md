# BareMetal.VectorSearch

Dependency-free browser module. Source: `./src/BareMetal.VectorSearch.js`.

## Load

```html
<script src="../src/BareMetal.VectorSearch.js"></script>
```

## Public API

### `createIndex(options)`

Call `BareMetal.VectorSearch.createIndex(...)` using the arguments shown by the function implementation.

### `cosineSimilarity(a, b)`

Call `BareMetal.VectorSearch.cosineSimilarity(...)` using the arguments shown by the function implementation.

## Example

```js
const index = BareMetal.VectorSearch.createIndex({ dimensions:3 });
index.upsert('track-1', new Float32Array([0.1,0.2,0.3]));
const matches = index.topK(query, 5);
```
