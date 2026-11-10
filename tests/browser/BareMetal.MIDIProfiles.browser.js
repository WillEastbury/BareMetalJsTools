BareMetal.TestRunner.installGlobals();

describe('BareMetal.MIDIProfiles', function () {
  it('imports exports and learns controller mappings', function () {
    var profiles = BareMetal.MIDIProfiles.create();
    profiles.importJson({
      profile: 'Test',
      version: 1,
      mappings: [],
      feedback: []
    });
    profiles.activate('Test');
    profiles.learn('deckA.play', { mode: 'toggle' });
    var mapping = profiles.capture({ type: 'noteon', channel: 1, note: 10 });
    expect(mapping.control).toBe('deckA.play');
    expect(mapping.number).toBe(10);
    var json = JSON.parse(profiles.exportJson('Test'));
    expect(json.mappings.length).toBe(1);
  });

  it('contains an explicitly unverified OMNIS-DUO placeholder', function () {
    var profile = BareMetal.MIDIProfiles.omnisDuoPlaceholder();
    expect(profile.profile).toBe('OMNIS-DUO');
    expect(profile.verified).toBe(false);
  });
});
