# BareMetal.DJDeck

Local MP3/WAV/FLAC/OGG/AAC deck primitive with native playback, hot cues,
seeking, pitch, tempo, beat-grid, waveform peaks and loop state.

```js
const deck = BareMetal.DJDeck.create();
await deck.loadFile(fileFromPicker);
deck.play();
deck.setCuePoint(8);
deck.setHotCue(0, 8);
deck.jumpHotCue(0);
deck.setPitch(-1);
deck.setTempo(103);
deck.setLoop(8, true);
```

`loadFile()` accepts browser File objects and reports whether the browser
decoding the format. `loadUrl()` supports streaming HTTP media. The deck
provides elapsed/remaining/duration, BPM estimates, beat-grid timepoints,
waveform peaks and hot-cue/loop metadata for persistent storage.
