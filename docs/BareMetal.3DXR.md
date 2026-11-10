# BareMetal.3DXR

> Small dependency-free WebGL/WebXR renderer for floating video tiles, gaze focus, and a shared audio bed.

**Dependencies:** None. Uses browser WebGL, WebXR, HTML video, and audio APIs.

## Quick start

```html
<canvas id="scene" class="scene"></canvas>
<button id="enter-vr">Enter VR</button>
<script src="BareMetal.3DXR.js"></script>
<script>
  const xr = BareMetal['3DXR'].create(document.querySelector('#scene'));
  xr.setProceduralBackground('spiral', { colors: ['#160924', '#ff2b9d'], speed: 0.8 });
  const clips = ['/media/a.mp4', '/media/b.mp4', '/media/c.mp4'];

  xr.addVideo({
    id: 'tile-1', src: clips[0], playlist: clips, shuffle: true,
    position: [-1, 1.6, -3], width: 1.6, height: 0.9, yaw: -0.25
  });
  xr.addVideo({
    id: 'tile-2', src: clips[1], playlist: clips, shuffle: true,
    position: [1, 1.6, -3], width: 1.6, height: 0.9, yaw: 0.25
  });

  xr.on('focuschange', ({ id }) => console.log('Audio focus:', id));
  xr.on('tileended', ({ id }) => console.log('Tile advanced:', id));
  xr.setAmbientTrack('/media/ambient.mp3', { volume: 0.2 });
  document.querySelector('#enter-vr').addEventListener('click', () => xr.enterVR());
</script>
```

The canvas provides a drag-to-look desktop preview. In immersive VR, each WebXR view is rendered from the headset pose. The center reticle selects the nearest video tile; only that tile is unmuted. A pointer click or entering VR unlocks audio under browser autoplay rules. Every tile starts muted, and videos continue through their playlist when a clip ends.

The background can be a generated animated spiral, an equirectangular panorama image/video, or the flat clear colour. The panorama is drawn as a sphere centered on each viewer eye, behind the floating tiles. Video panoramas are muted by default. Pass an already loaded image, video, or canvas element to manage loading yourself.

Host the page over HTTPS to use WebXR. Cross-origin video, image, and audio servers must allow CORS so their media can be uploaded as WebGL textures. Panorama URLs must contain equirectangular 360-degree media. Keep tile count and resolution within the device's simultaneous decode and GPU limits.

## API

### `BareMetal['3DXR'].create(canvas, options)` → `renderer`

Creates the WebGL renderer and starts its desktop preview loop.

| Option | Default | Description |
|---|---:|---|
| `background` | `#090510` | Canvas clear colour as a six digit hex value or RGB array. |
| `fov` | `70` | Desktop preview field of view in degrees. |
| `maxTiles` | `16` | Maximum number of video tiles. |
| `reticle` | `true` | Add a simple centered DOM reticle over the canvas. |
| `desktopLook` | `true` | Enable drag-to-look and desktop gaze selection. |

### `renderer.addVideo(options)` → `id`

Creates a streaming HTML video element and displays it on a floating plane. Pass an existing `video` element instead of `src` to manage media loading yourself.

| Option | Default | Description |
|---|---:|---|
| `id` | generated | Stable tile id. |
| `src` | — | Video URL or `{ src }` / `{ url }` entry from a manifest. |
| `playlist` | `[]` | URLs or manifest entries to advance through after `ended`. |
| `shuffle` | `false` | Choose a random next playlist item without immediately repeating the previous URL. |
| `position` | `[0, 1.6, -3]` | Tile center in world metres `[x, y, z]`; negative `z` is in front of the initial view. |
| `width`, `height` | `1.6`, `0.9` | Tile dimensions in world metres. |
| `yaw`, `pitch` | `0`, `0` | Tile orientation in radians. |
| `crossOrigin` | `anonymous` | CORS mode set before loading `src`. |
| `onEnded` | — | Optional callback called when the current clip ends. |

### Video and audio control

- `renderer.replaceVideo(id, urlOrEntry)` changes a tile's current video.
- `renderer.setPlaylist(id, entries, { shuffle })` replaces its playlist.
- `renderer.removeVideo(id)` removes and releases a tile.
- `renderer.setAmbientTrack(urlOrEntry, { volume, loop, crossOrigin })` sets the shared audio bed.
- `renderer.setAmbientVolume(value)` sets ambient volume from `0` to `1`; a remote control console can call this after applying server state.
- `renderer.setBackground(color)` updates the clear colour shown before a panorama loads or when no background sphere is enabled.
- `renderer.setBackgroundPanorama(urlOrElement, { type, loop, muted, crossOrigin })` displays an equirectangular image or video around the viewer. Set `type: 'video'` for video URLs; an element can be an image, video, or canvas.
- `renderer.setProceduralBackground('spiral', { colors, speed, turns })` renders a real-time generated spiral sky. Colours accept six digit hex strings or RGB arrays.
- `renderer.clearBackgroundPanorama()` removes the current panorama or generated sky and returns to the clear colour.
- `renderer.on(name, callback)` subscribes to `focuschange`, `tileended`, `autoplayblocked`, `ambientblocked`, `textureerror`, `backgroundready`, `backgrounderror`, `backgroundblocked`, `xrstart`, `xrend`, and `contextlost`. It returns an unsubscribe function.

### WebXR and lifecycle

- `await renderer.isXRSupported()` checks `immersive-vr` support.
- `await renderer.enterVR()` must be called directly from a user gesture such as a button click.
- `renderer.start()` / `renderer.stop()` control the preview loop.
- `renderer.dispose()` stops playback, ends the XR session, releases GPU resources, and removes listeners.

The app remains responsible for authenticating users, fetching the online manifest, deciding which clips to assign to tiles, and synchronizing remote controls between people. Browser media codec support, CORS headers, HTTPS, and autoplay policy are platform requirements.
