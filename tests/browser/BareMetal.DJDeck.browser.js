BareMetal.TestRunner.installGlobals();

describe('BareMetal.DJDeck', function () {
  it('creates a deck with cue, pitch, tempo, hot-cue and loop state', function () {
    var deck = BareMetal.DJDeck.create();
    deck.setCuePoint(12);
    deck.setHotCue(0, 12);
    deck.setPitch(1);
    deck.setTempo(125);
    deck.setLoop(4, true);
    var state = deck.state();
    expect(state.cuePoint).toBe(12);
    expect(state.hotCues[0]).toBe(12);
    expect(state.pitchSemitones).toBe(1);
    expect(state.tempoPercent).toBe(125);
    expect(state.loop.beats).toBe(4);
  });

  it('rejects unsupported or invalid loop formats', function () {
    var deck = BareMetal.DJDeck.create();
    expect(function () { deck.setLoop(3, true); }).toThrow(RangeError);
  });
});
