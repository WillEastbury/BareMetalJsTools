# BareMetal.DJMixer

Four-channel Web Audio mixer with low/mid/high EQ, pan, channel gain, master
gain, channel metres and a straight four-channel crossfader.

```js
const mixer = BareMetal.DJMixer.create({ masterGain: 1 });
const ch0 = mixer.addChannel(0, audioElement0);
const ch1 = mixer.addChannel(1, audioElement1);
const ch2 = mixer.addChannel(2, audioElement2);
const ch3 = mixer.addChannel(3, audioElement3);

mixer.setChannel(0, { low: 3, mid: -1, high: 2, pan: -0.2, gainDb: -3 });
mixer.setCrossfader(-0.5);
mixer.setPitch(0, 2);
mixer.setPitchBend(0, -0.25);
```

Channels 0 and 1 belong to the left side of the crossfader; channels 2 and 3
belong to the right side. The mixer exposes channel metres and master gain.

The mixer also supports channel trim, channel faders, equal-power or linear
crossfader curves, full-kill EQ, filter sweeps, master limiting and an isolated
pre-fader cue/PFL bus. Use `setCue(index, true)` or
`createPreviewControl()` for headphone preview independent of the channel
fader and crossfader.
