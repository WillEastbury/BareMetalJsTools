# BareMetal.Timeline

Dependency-free browser module. Source: `./src/BareMetal.Timeline.js`.

## Load

```html
<script src="../src/BareMetal.Timeline.js"></script>
```

## Public API

### `create(options)`

Call `BareMetal.Timeline.create(...)` using the arguments shown by the function implementation.

### `formatTime(seconds)`

Call `BareMetal.Timeline.formatTime(...)` using the arguments shown by the function implementation.

## Example

```js
const timeline = BareMetal.Timeline.create({ duration:120, onSeek:seconds => player.seek(seconds) });
document.querySelector('#player').append(timeline.element);
```
