# BareMetal.Geo

> Geolocation helpers for browser positioning, distance math, geohash encoding, tracking, and lightweight geocoding.

**Size:** 9 KB source / 7 KB minified  
**Dependencies:** None

## Quick Start

```html
<button id="whereBtn">Locate me</button>
<script src="BareMetal.Geo.min.js"></script>
<script>
  document.getElementById('whereBtn').addEventListener('click', async function () {
    const here = await BareMetal.Geo.getCurrentPosition({ enableHighAccuracy: true });
    const office = { lat: 51.5074, lng: -0.1278 };

    console.log('You are here:', here.lat, here.lng);
    console.log('Distance to office:', BareMetal.Geo.distance(here, office).toFixed(0), 'm');
    console.log('Geohash:', BareMetal.Geo.encode(here.lat, here.lng, 8));
  });
</script>
```

## API Reference

### `getCurrentPosition(opts)` → `Promise<object>`

Gets the current browser position and normalizes it to `{ lat, lng, accuracy, altitude, heading, speed, timestamp }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Native geolocation options such as `enableHighAccuracy`, `timeout`, and `maximumAge`. |

**Example:**
```js
const pos = await BareMetal.Geo.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000
});
```

### `watchPosition(callback, opts)` → `number | null`

Starts a live watch and calls `callback(position)` whenever the browser reports a new position.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Receives normalized position objects. |
| opts | object | `{}` | Geolocation options. You can also pass `error(err)` to handle watch errors. |

**Example:**
```js
const watchId = BareMetal.Geo.watchPosition(function (pos) {
  console.log('Moved to', pos.lat, pos.lng);
}, {
  maximumAge: 5000,
  error(err) {
    console.error(err.message);
  }
});
```

### `clearWatch(watchId)` → `void`

Stops a watcher created by `watchPosition()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| watchId | number | — | Watch identifier returned by `watchPosition()`. |

**Example:**
```js
BareMetal.Geo.clearWatch(watchId);
```

### `distance(p1, p2)` → `number`

Calculates Haversine distance in meters between two points.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| p1 | object | — | Point-like object with `lat`/`lng`, `latitude`/`longitude`, or `coords`. |
| p2 | object | — | Second point in the same formats. |

**Example:**
```js
const meters = BareMetal.Geo.distance({ lat: 48.8566, lng: 2.3522 }, { lat: 52.52, lng: 13.4050 });
```

### `bearing(p1, p2)` → `number`

Returns the initial bearing from the first point to the second in degrees.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| p1 | object | — | Start point. |
| p2 | object | — | Destination point. |

**Example:**
```js
const heading = BareMetal.Geo.bearing(start, end);
```

### `midpoint(p1, p2)` → `object | null`

Returns the geographic midpoint between two points.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| p1 | object | — | Start point. |
| p2 | object | — | End point. |

**Example:**
```js
const center = BareMetal.Geo.midpoint(a, b);
```

### `boundingBox(center, radiusMeters)` → `object | null`

Builds a north/south/east/west box around a center point and radius.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| center | object | — | Center point. |
| radiusMeters | number | — | Radius in meters. `0` returns the center point bounds. |

**Example:**
```js
const box = BareMetal.Geo.boundingBox({ lat: 51.5, lng: -0.12 }, 2500);
```

### `isInside(point, polygon)` → `boolean`

Checks whether a point is inside a polygon. Points on an edge count as inside.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| point | object | — | Point to test. |
| polygon | array | — | Array of point-like objects describing the polygon ring. |

**Example:**
```js
const inside = BareMetal.Geo.isInside({ lat: 51.5, lng: -0.1 }, regionPoints);
```

### `encode(lat, lng, precision)` → `string`

Encodes a latitude and longitude to a geohash.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| lat | number | — | Latitude. |
| lng | number | — | Longitude. |
| precision | number | `12` | Hash length. Values below `1` are clamped. |

**Example:**
```js
const hash = BareMetal.Geo.encode(51.5074, -0.1278, 7);
```

### `decode(hash)` → `object | null`

Decodes a geohash to the cell center plus an approximate error box.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| hash | string | — | Geohash string to decode. |

**Example:**
```js
const cell = BareMetal.Geo.decode('gcpvj0d');
// { lat, lng, error: { lat, lng } }
```

### `track(opts)` → `tracker`

Creates a lightweight tracker that builds a path from watched positions and accumulates traveled distance.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Supports `minimumDistance`, `autoStart`, `onUpdate`, plus any `watchPosition()` options. |

**Example:**
```js
const tracker = BareMetal.Geo.track({ minimumDistance: 10, autoStart: true });
tracker.onUpdate(function (state) {
  console.log(state.distance, state.path.length);
});
```

### `tracker.start()` → `tracker`

Starts the tracker watch if it is not already running.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
tracker.start();
```

### `tracker.stop()` → `tracker`

Stops the active watch without clearing the collected path.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
tracker.stop();
```

### `tracker.getPath()` → `array`

Returns a copy of the recorded position path.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(tracker.getPath());
```

### `tracker.getDistance()` → `number`

Returns the accumulated tracked distance in meters.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(tracker.getDistance());
```

### `tracker.onUpdate(cb)` → `function`

Subscribes to tracker updates and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cb | function | — | Receives `{ point, path, distance }` on each accepted position. |

**Example:**
```js
const off = tracker.onUpdate(function (state) {
  console.log(state.point.lat, state.distance);
});
```

### `geocode(address)` → `Promise<Array<object>>`

Looks up an address with OpenStreetMap Nominatim and returns normalized place objects.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| address | string | — | Free-form address or place query. |

**Example:**
```js
const results = await BareMetal.Geo.geocode('10 Downing Street, London');
```

### `reverseGeocode(lat, lng)` → `Promise<object | null>`

Reverse geocodes a latitude and longitude through Nominatim.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| lat | number | — | Latitude. |
| lng | number | — | Longitude. |

**Example:**
```js
const place = await BareMetal.Geo.reverseGeocode(51.5034, -0.1276);
```

## Notes

- Point inputs accept `{ lat, lng }`, `{ latitude, longitude }`, `{ lat, lon }`, and browser position objects with `coords`.
- Latitude is clamped and longitude is wrapped automatically.
- `watchPosition()` returns `null` when geolocation is unavailable or the callback is not a function.
- `track()` ignores steps shorter than `minimumDistance` when that option is set.
- `geocode()` returns up to 5 results and `reverseGeocode()` returns one normalized place object.
