BareMetal.TestRunner.installGlobals();

describe('BareMetal.DJMixer', function () {
  it('creates a four-channel crossfader and state model', function () {
    if (!BareMetal.DJMixer) throw new Error('DJMixer unavailable');
    var context = typeof AudioContext !== 'undefined' ? new AudioContext() :
      (typeof webkitAudioContext !== 'undefined' ? new webkitAudioContext() : null);
    if (!context) return;
    var mixer = BareMetal.DJMixer.create({ audioContext: context });
    for (var i = 0; i < 4; i++) mixer.addChannel(i);
    mixer.setCrossfader(-1);
    mixer.setChannel(0, { gainDb: -6, low: 3, mid: -2, high: 4, pan: -0.5, pitch: 2 });
    mixer.setPitchBend(0, 0.5);
    mixer.setCue(0, true);
    mixer.setCrossfaderCurve('equal-power');
    mixer.setLimiter({ threshold: -6, ratio: 12 });
    var state = mixer.state(0);
    expect(state.gainDb).toBe(-6);
    expect(state.lowDb).toBe(3);
    expect(state.pitchSemitones).toBe(2);
    expect(state.pitchBendSemitones).toBe(0.5);
    mixer.destroy();
  });
});
