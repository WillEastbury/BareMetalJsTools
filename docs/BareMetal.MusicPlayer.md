# BareMetal.MusicPlayer

A small browser audio player with playlist navigation, repeat/shuffle, remote-callable controls, Media Session buttons, and two-deck crossfades. It uses native `HTMLAudioElement`; the application remains responsible for authenticating and distributing shared control commands.

```html
<script src="BareMetal.MusicPlayer.js"></script>
<script>
  const music = BareMetal.MusicPlayer.create({ volume: 0.2, crossfade: 3, repeat: 'all' });
  music.setPlaylist([
    { src: '/media/ambient-a.mp3', title: 'Ambient A' },
    { src: '/media/ambient-b.mp3', title: 'Ambient B' }
  ], { shuffle: true });
  document.querySelector('#play').addEventListener('click', () => music.play());
  music.on('trackchange', ({ entry }) => console.log('Now playing', entry.title));
</script>
```

## API

- `BareMetal.MusicPlayer.create({ volume, crossfade, repeat, shuffle, crossOrigin })` creates a player. Defaults are `0.25`, 2 seconds, `all`, `false`, and `anonymous`.
- `setPlaylist(entries, { index, autoplay, shuffle, repeat })` loads entries shaped as URL strings or objects with `src`/`url`, and optional `title`, `artist`, `album`, and `crossOrigin`.
- `play()`, `pause()`, `stop()`, `next({ crossfade })`, and `previous()` control playback. Call `play()` from a user gesture when browser autoplay policy requires it.
- `seek(seconds)`, `setVolume(0..1)`, `setCrossfade(seconds)`, `setRepeat('none'|'all'|'one')`, and `setShuffle(boolean)` update playback.
- `state()` returns the current track, position, duration, volume, and playback modes.
- `on(name, callback)` listens for `trackchange`, `timeupdate`, `play`, `pause`, `stop`, `ended`, `crossfadeend`, `volumechange`, `modechange`, `autoplayblocked`, and `error`.
- `destroy()` releases both media elements and event listeners.

Cross-origin audio servers must permit CORS when `crossOrigin` is enabled. Streaming formats and seek behavior depend on the media server, browser, codec, and response headers. For shared two-person playback, send authorized player actions through the application's control channel and resolve the resulting state on both clients; this library does not provide networking or authentication.
