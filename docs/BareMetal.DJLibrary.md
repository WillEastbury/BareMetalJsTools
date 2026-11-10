# BareMetal.DJLibrary

IndexedDB-backed track, cue, loop, playlist and settings storage.

```js
const library = BareMetal.DJLibrary.create();
await library.saveTrack({ id: file.name, title: 'Track', bpm: 128, key: 'Am' });
await library.saveCues(file.name, { hotCues: [0, 32], loops: [], cuePoint: 0 });
const tracks = await library.search('', { minBpm: 120, maxBpm: 140 });
```

No audio upload occurs: persistent library metadata and locally permitted
track handles stay in the browser.
