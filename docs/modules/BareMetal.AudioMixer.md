# BareMetal.AudioMixer

Dependency-free browser module. Source: `./src/BareMetal.AudioMixer.js`.

## Load

```html
<script src="../src/BareMetal.AudioMixer.js"></script>
```

## Public API

### `create(options)`

Call `BareMetal.AudioMixer.create(...)` using the arguments shown by the function implementation.

## Example

```js
const mixer = BareMetal.AudioMixer.create({ tracks: [] });
mixer.addTrack({ id:'deck-a', label:'Deck A', gain:1 });
```
