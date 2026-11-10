/* BareMetal.MIDIProfiles - JSON import/export and learnable controller mappings. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.MIDIProfiles = (function () {
  'use strict';

  function omnisDuoPlaceholder() {
    return {
      profile: 'OMNIS-DUO',
      version: 1,
      verified: false,
      mappings: [
        { control: 'deckA.play', type: 'note', channel: 1, number: 10, mode: 'toggle' },
        { control: 'deckB.play', type: 'note', channel: 1, number: 11, mode: 'toggle' },
        { control: 'mixer.crossfader', type: 'cc', channel: 1, number: 20, range: [0, 127] },
        { control: 'mixer.cue.mix', type: 'cc', channel: 1, number: 21, range: [0, 127] }
      ],
      feedback: [],
      note: 'Placeholder MIDI assignments require physical OMNIS-DUO validation.'
    };
  }

  function create(options) {
    options = options || {};
    var profiles = new Map();
    var active = null;
    var learning = null;

    function importJson(json) {
      var profile = typeof json === 'string' ? JSON.parse(json) : json;
      if (!profile || !profile.profile) throw new TypeError('Invalid MIDI profile');
      profile.version = profile.version || 1;
      profile.mappings = Array.isArray(profile.mappings) ? profile.mappings : [];
      profile.feedback = Array.isArray(profile.feedback) ? profile.feedback : [];
      profiles.set(profile.profile, profile);
      return profile;
    }

    function exportJson(profileName) {
      var profile = profileName ? profiles.get(profileName) : active;
      if (!profile) throw new Error('MIDI profile not found');
      return JSON.stringify(profile, null, 2);
    }

    function activate(profileName) {
      var profile = typeof profileName === 'object' ? profileName : profiles.get(profileName);
      if (!profile) throw new Error('MIDI profile not found');
      active = profile;
      return profile;
    }

    function learn(control, options) {
      learning = { control: control, options: options || {} };
      return learning;
    }

    function cancelLearn() { learning = null; }

    function capture(message) {
      if (!learning) return null;
      var mapping = {
        control: learning.control,
        type: message.type === 'cc' ? 'cc' : message.type === 'pitchbend' ? 'pitchbend' : 'note',
        channel: message.channel,
        number: message.controller != null ? message.controller : message.note,
        mode: learning.options.mode || 'absolute',
        range: learning.options.range || [0, 127]
      };
      if (!active) active = { profile: 'Learned', version: 1, mappings: [], feedback: [] };
      active.mappings.push(mapping);
      var captured = learning;
      learning = null;
      return captured.control ? mapping : null;
    }

    function resolveMessage(message) {
      if (!active) return [];
      return active.mappings.filter(function (mapping) {
        if (mapping.channel && mapping.channel !== message.channel) return false;
        if (mapping.type === 'cc') return message.type === 'cc' && mapping.number === message.controller;
        if (mapping.type === 'pitchbend') return message.type === 'pitchbend';
        if (mapping.type === 'note') return (message.type === 'noteon' || message.type === 'noteoff') && mapping.number === message.note;
        return false;
      });
    }

    function listProfiles() { return Array.from(profiles.values()); }

    profiles.set('OMNIS-DUO', omnisDuoPlaceholder());
    active = options.profile || profiles.get('OMNIS-DUO');

    return {
      importJson: importJson,
      exportJson: exportJson,
      activate: activate,
      learn: learn,
      cancelLearn: cancelLearn,
      capture: capture,
      resolveMessage: resolveMessage,
      listProfiles: listProfiles,
      omnisDuoPlaceholder: omnisDuoPlaceholder
    };
  }

  return { create: create, omnisDuoPlaceholder: omnisDuoPlaceholder };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.MIDIProfiles;
