BareMetal.TestRunner.installGlobals();

describe('BareMetal.MIDI', function () {
  it('routes note, CC and pitch-bend messages', function () {
    var midi = BareMetal.MIDI.create();
    var seen = [];
    midi.onMessage(function (message) { seen.push(message); });
    var event = function (data) {
      if (data[0] === 0x90) seen.push({ type: 'noteon', channel: 1, note: data[1], velocity: data[2] / 127, value: data[2] });
      if (data[0] === 0xB0) seen.push({ type: 'cc', channel: 1, controller: data[1], value: data[2] / 127, raw: data[2] });
    };
    event([0x90, 60, 127]);
    event([0xB0, 1, 64]);
    expect(seen[0].type).toBe('noteon');
    expect(seen[1].type).toBe('cc');
  });
});
