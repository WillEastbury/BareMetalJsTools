# BareMetal.MP3

Convenience API for native MP3 streaming and ID3 metadata.

```js
const tags = await BareMetal.MP3.readTags(file);

const audio = BareMetal.MP3.stream('/audio/track.mp3', {
  preload: 'metadata',
  controls: true
});

const player = BareMetal.MP3.create({
  volume: 0.8,
  crossfade: 2
});
player.setPlaylist([{ src: '/audio/track.mp3', title: tags.title }]);
player.setPitch(1);
player.setPitchBend(-0.25);
player.setLow(3);
player.setMid(-1);
player.setHigh(2);
```

Native `<audio>` playback uses server Range/streaming behavior. Where no
server-side compression is available, precompressed or Picocompress module
payloads are handled by `BareMetal.ModuleLoader`.
