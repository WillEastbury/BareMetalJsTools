# BareMetal.Media

> Browser media helpers for camera, microphone, screen capture, recording, snapshots, device inspection, and preview playback.

**Size:** 11 KB source / 8 KB minified  
**Dependencies:** None

## Quick Start

```html
<div id="preview"></div>
<button id="snapBtn">Snapshot</button>
<script src="BareMetal.Media.min.js"></script>
<script>
  let camera;

  (async function () {
    camera = await BareMetal.Media.camera({ width: 1280, height: 720, facingMode: 'user' });
    BareMetal.Media.preview(camera.stream, '#preview', { mirror: true, width: 320, height: 180 });
  })();

  document.getElementById('snapBtn').addEventListener('click', async function () {
    const dataUrl = BareMetal.Media.snapshot(camera.video, { as: 'dataURL', format: 'image/jpeg', quality: 0.9 });
    console.log(dataUrl.slice(0, 40));
  });
</script>
```

## API Reference

### `camera(opts)` → `Promise<object>`

Requests a video-only stream and returns `{ stream, video, stop() }`, where `video` is an autoplaying preview element.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Video constraints such as `width`, `height`, `frameRate`, `facingMode`, and `deviceId`. |

**Example:**
```js
const cam = await BareMetal.Media.camera({ facingMode: 'environment' });
cam.stop();
```

### `microphone(opts)` → `Promise<object>`

Requests an audio-only stream and returns `{ stream, stop(), getLevel() }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Audio constraints such as `deviceId`, `echoCancellation`, `noiseSuppression`, `sampleRate`, and `channelCount`. |

**Example:**
```js
const mic = await BareMetal.Media.microphone({ echoCancellation: true });
console.log(mic.getLevel());
```

### `screen(opts)` → `Promise<object>`

Requests screen capture and returns `{ stream, stop() }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Display capture options. Supports video sizing options and `audio`. |

**Example:**
```js
const share = await BareMetal.Media.screen({ audio: true });
```

### `snapshot(videoEl, opts)` → `HTMLCanvasElement | string | Promise<Blob | null> | null`

Draws the current frame into a canvas and returns the canvas, a data URL, or a blob promise depending on `opts`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| videoEl | Element | — | Video, image, or canvas-like element to capture. |
| opts | object | `{}` | Supports `width`, `height`, `format`, `quality`, `as`, `blob`, and `dataURL`. |

**Example:**
```js
const blob = await BareMetal.Media.snapshot(cam.video, { as: 'blob', format: 'image/png' });
```

### `record(stream, opts)` → `recorder`

Creates a `MediaRecorder` wrapper with `start()`, `pause()`, `resume()`, `stop()`, `onData(cb)`, and `getBlob()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stream | MediaStream | — | Stream to record. |
| opts | object | `{}` | Recorder options such as `mimeType`, `audioBitsPerSecond`, `videoBitsPerSecond`, `bitsPerSecond`, and `timeslice`. |

**Example:**
```js
const rec = BareMetal.Media.record(cam.stream, { mimeType: 'video/webm', timeslice: 1000 });
rec.start();
setTimeout(async function () {
  const blob = await rec.stop();
  console.log(blob.size);
}, 3000);
```

### `recorder.start()` → `recorder`

Starts recording when the underlying `MediaRecorder` is inactive.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
rec.start();
```

### `recorder.pause()` / `recorder.resume()` → `recorder`

Pauses or resumes a running recording session.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
rec.pause();
rec.resume();
```

### `recorder.stop()` → `Promise<Blob>`

Stops recording and resolves to the accumulated output blob.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const blob = await rec.stop();
```

### `recorder.onData(cb)` → `function`

Subscribes to `dataavailable` chunks and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cb | function | — | Receives `(blobChunk, event)` for each emitted chunk. |

**Example:**
```js
const off = rec.onData(function (chunk) {
  console.log('Chunk:', chunk && chunk.size);
});
```

### `recorder.getBlob()` → `Blob`

Builds a blob from the currently collected recorder chunks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const partial = rec.getBlob();
```

### `devices()` → `Promise<object>`

Enumerates available media devices and groups them into `{ cameras, microphones, speakers }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const devices = await BareMetal.Media.devices();
console.log(devices.cameras.length);
```

### `switchCamera(stream, deviceId)` → `Promise<MediaStream>`

Swaps the video track on an existing stream while preserving audio tracks when possible.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stream | MediaStream | — | Existing stream whose video track should be replaced. |
| deviceId | string \| object | `undefined` | Device identifier or full `deviceId` constraint. |

**Example:**
```js
stream = await BareMetal.Media.switchCamera(stream, selectedCameraId);
```

### `pip(videoEl)` → `Promise<any>`

Requests Picture-in-Picture for a video element.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| videoEl | HTMLVideoElement | — | Video element to place in Picture-in-Picture. |

**Example:**
```js
await BareMetal.Media.pip(cam.video);
```

### `torch(stream, on)` → `Promise<boolean>`

Toggles the device torch/flash when supported by the active video track.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stream | MediaStream | — | Stream containing a video track. |
| on | boolean | — | Torch on/off state to request. |

**Example:**
```js
const enabled = await BareMetal.Media.torch(cam.stream, true);
```

### `preview(stream, container, opts)` → `object`

Creates a `<video>` preview element for a stream and returns `{ el, destroy() }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stream | MediaStream | — | Stream to preview. |
| container | Element \| string | — | Host element or selector. |
| opts | object | `{}` | Supports `muted`, `controls`, `className`, `fit`, `mirror`, `width`, and `height`. |

**Example:**
```js
const preview = BareMetal.Media.preview(cam.stream, '#preview', { mirror: true, width: 240 });
```

### `preview.destroy()` → `void`

Stops the preview element and removes it from the DOM.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
preview.destroy();
```

### `constraints(stream)` → `object`

Returns track metadata for a stream as `{ video, audio }`, including `constraints`, `settings`, and `capabilities`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stream | MediaStream | — | Stream to inspect. |

**Example:**
```js
console.log(BareMetal.Media.constraints(cam.stream));
```

### `audioContext(stream)` → `object`

Builds an analyser wrapper around an audio stream and returns `{ ctx, source, analyser, getFrequency(), getWaveform() }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stream | MediaStream | — | Audio stream to analyze. |

**Example:**
```js
const analyser = BareMetal.Media.audioContext(mic.stream);
console.log(analyser.getFrequency());
```

### `analyser.getFrequency()` → `Uint8Array | Array`

Returns a frequency-domain snapshot from the internal analyser node.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const bins = analyser.getFrequency();
```

### `analyser.getWaveform()` → `Uint8Array | Array`

Returns a time-domain waveform snapshot from the internal analyser node.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const waveform = analyser.getWaveform();
```

## Notes

- `camera()`, `microphone()`, and `screen()` reject when the required browser API is unavailable.
- `camera()` returns a muted autoplaying `<video>` element so you can capture frames immediately.
- `microphone().getLevel()` computes a normalized RMS level from the waveform buffer.
- `snapshot()` returns `null`, `''`, or `Promise.resolve(null)` when capture is not possible for the requested output type.
- `torch()` only works on streams and devices that expose torch capability support.
