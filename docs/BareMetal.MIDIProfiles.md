# BareMetal.MIDIProfiles

Imports, exports and learns JSON controller profiles.

```js
const profiles = BareMetal.MIDIProfiles.create();
await profiles.importJson(profileJson);
profiles.activate('OMNIS-DUO');
profiles.learn('deckA.play', { mode: 'toggle' });
const mapping = profiles.capture(message);
const portableJson = profiles.exportJson('OMNIS-DUO');
```

The bundled OMNIS-DUO profile is an explicitly unverified placeholder.
Physical MIDI messages and LED feedback must be validated on the device.
