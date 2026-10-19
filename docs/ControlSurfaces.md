# Control surfaces

These small DOM components share accessible controls across dashboards, media
tools, editors, games and 3D viewers. They use native browser inputs and have no
framework dependency. Load `BareMetal.ControlSurface.css` after the project's
theme stylesheet.

## Parameter panel

`BareMetal.ControlSurface.create({title, fields, values, presets, onChange})`
builds fields from a schema. Each field supports `name`, `label`, `type`
(`text`, `number`, `range`, `toggle`, `select`, `color`, or `action`),
`defaultValue`, `min`, `max`, `step`, `unit`, `help`, `group`, and `options`.
Presets have `{label, values}`. An optional `storageKey` restores and saves the
values in local storage.

The returned object exposes `element`, `inputs`, `get()`, `set(name, value)`,
`setMany(values)`, `reset()`, `onChange(callback)` and `destroy()`. Change
callbacks receive `{name, value, values, source}`. Treat browser values as UI
input and validate them again at the application boundary.

```js
const panel = BareMetal.ControlSurface.create({
  title: 'Preview',
  fields: [
    {name:'quality', label:'Quality', type:'select', options:['low','balanced','high'], defaultValue:'balanced'},
    {name:'exposure', label:'Exposure', type:'range', min:0.25, max:2, step:0.05, defaultValue:1, group:'Rendering'},
    {name:'loop', label:'Loop playback', type:'toggle', defaultValue:true, group:'Playback'}
  ],
  presets: [{label:'Battery saver', values:{quality:'low', exposure:1}}],
  onChange: ({name, value}) => console.log(name, value)
});
document.querySelector('#settings').append(panel.element);
```

## Timeline

`BareMetal.Timeline.create({duration, currentTime, markers, onSeek, onPlay,
onPause, onSelectionChange})` returns an accessible seek bar with keyboard
support, time readouts, marker buttons and optional in/out selection marks.
Use `setTime`, `setDuration`, `setPlaying`, `setMarkers`, and `setSelection` to
reflect a media or animation engine's state. The component does not own or
advance playback time; the host should call `setTime` as its clock changes.

## Audio mixer

`BareMetal.AudioMixer.create({tracks, audioContext, onChange})` renders track
level, pan, mute, solo and meter controls. A track can provide an `adapter(state)`
callback for an existing player. To let the mixer create a Web Audio chain,
provide `source` and the shared `audioContext`; its optional `destination`
defaults to `audioContext.destination`. Call `addTrack`, `setTrack`,
`removeTrack`, `getState`, and `destroy` as the host changes its tracks.
Microphone access and playback policy remain with the host application.

## Scene inspector

`BareMetal.SceneInspector.create({targets, fields, adapter, onChange})` provides
a renderer-neutral object inspector. Targets expose values such as
`position.x`, `rotation.y`, `scale.z`, `material.roughness`, or `light.intensity`.
Supply an adapter `{get(target), update(target, patch)}` to map those values to
Three.js, A-Frame, WebGL state, or another engine. The default field list shows
only paths present in the selected target. Supply `fields` to define a custom
engine's editable properties.

## Input router

`BareMetal.InputRouter.create({element, keyboard, gamepad, onAction})` maps
keyboard keys, pointer buttons marked with `data-bm-action`, and the existing
`BareMetal.Gamepad` button events into `{action, phase, source, detail}` events.
For XR gaze or another input provider, call `trigger(action, 'activate', detail)`.
`onAction(callback)` subscribes to the same events; `destroy()` removes listeners.
Keyboard bindings map action names to one or more `KeyboardEvent.key` or
`KeyboardEvent.code` values, for example `{play:['Space'], stop:['Escape']}`.

## Shared interaction styles

The stylesheet uses existing theme variables when available and falls back to
browser colors. Controls retain native semantics, text labels and focus rings.
Applications should keep the keyboard path available when they add gamepad or
gaze activation.
