# BareMetal.MIDI

Browser Web MIDI access and normalized message routing.

```js
const midi = BareMetal.MIDI.create();
await midi.request();

midi.mapCC(1, message => player.setPitchBend(message.value * 2 - 1));
midi.mapPitchBend(message => player.setPitchBend(message.value * 2));
midi.onMessage(message => console.log(message));
```

Messages are normalized into `noteon`, `noteoff`, `cc`, and `pitchbend`
objects with 1-based MIDI channel numbers. If unsupported, `request()` throws
and the application can retain keyboard/touch controls.
