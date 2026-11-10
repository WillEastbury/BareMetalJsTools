/* BareMetal.DJMixer - four-channel pump with three-band EQ, crossfader and master. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.DJMixer = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var Context = typeof AudioContext !== 'undefined' ? AudioContext :
      (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null);
    var context = options.audioContext || (Context ? new Context() : null);
    if (!context) throw new Error('Web Audio is unavailable');

    var channels = [];
    var crossfader = 0;
    var crossfaderCurve = 'equal-power';
    var masterGain = context.createGain();
    var masterAnalyser = context.createAnalyser();
    var cueGain = context.createGain();
    var cueAnalyser = context.createAnalyser();
    var limiter = context.createDynamicsCompressor();
    var previewEnabled = false;
    var previewMix = 0;
    cueGain.gain.value = options.cueGain == null ? 1 : gainForDb(options.cueGain);
    cueAnalyser.fftSize = options.fftSize || 2048;
    limiter.threshold.value = options.limiterThreshold == null ? -3 : Number(options.limiterThreshold);
    limiter.knee.value = options.limiterKnee == null ? 0 : Number(options.limiterKnee);
    limiter.ratio.value = options.limiterRatio == null ? 20 : Number(options.limiterRatio);
    limiter.attack.value = options.limiterAttack == null ? 0.003 : Number(options.limiterAttack);
    limiter.release.value = options.limiterRelease == null ? 0.25 : Number(options.limiterRelease);
    cueGain.connect(cueAnalyser);
    cueAnalyser.connect(context.destination);
    masterGain.gain.value = options.masterGain == null ? 1 : Number(options.masterGain);
    masterAnalyser.fftSize = options.fftSize || 2048;
    masterGain.connect(limiter);
    limiter.connect(masterAnalyser);
    masterAnalyser.connect(context.destination);

    function db(value) {
      var number = Number(value);
      return Number.isFinite(number) ? number : 0;
    }

    function gainForDb(value) {
      return Math.pow(10, db(value) / 20);
    }

    function addChannel(index, source) {
      index = Number(index);
      if (!Number.isInteger(index) || index < 0 || index > 3) throw new RangeError('DJMixer channel must be 0-3');
      var existing = channels[index];
      if (existing) return existing;

      var gain = context.createGain();
      var cue = context.createGain();
      var trim = context.createGain();
      var filter = context.createBiquadFilter();
      var pan = context.createStereoPanner ? context.createStereoPanner() : null;
      var low = context.createBiquadFilter();
      var mid = context.createBiquadFilter();
      var high = context.createBiquadFilter();
      low.type = 'lowshelf';
      low.frequency.value = options.lowFrequency || 250;
      mid.type = 'peaking';
      mid.frequency.value = options.midFrequency || 1000;
      mid.Q.value = options.midQ || 1;
      high.type = 'highshelf';
      high.frequency.value = options.highFrequency || 5000;

      low.gain.value = 0;
      mid.gain.value = 0;
      high.gain.value = 0;
      gain.gain.value = 1;
      cue.gain.value = 0;
      trim.gain.value = 1;
      filter.type = 'allpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.7;

      trim.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(filter);
      filter.connect(cue);
      cue.connect(cueGain);
      if (pan) {
        filter.connect(pan);
        pan.connect(gain);
      } else {
        filter.connect(gain);
      }
      gain.connect(masterGain);

      var analyser = context.createAnalyser();
      analyser.fftSize = options.fftSize || 2048;
      gain.connect(analyser);

      var channel = {
        index: index,
        source: source || null,
        audio: null,
        gainNode: gain,
        cueNode: cue,
        trimNode: trim,
        filterNode: filter,
        cueEnabled: false,
        panNode: pan,
        low: low,
        mid: mid,
        high: high,
        analyser: analyser,
        pitchSemitones: 0,
        pitchBendSemitones: 0,
        gainDb: 0,
        trimDb: 0,
        lowDb: 0,
        midDb: 0,
        highDb: 0,
        lowKill: false,
        midKill: false,
        highKill: false,
        muted: false
      };
      if (source) connectSource(channel, source);
      channels[index] = channel;
      applyCrossfader();
      return channel;
    }

    function connectSource(channel, source) {
      if (!source) return channel;
      if (source instanceof HTMLMediaElement && !channel.sourceNode) {
        channel.audio = source;
        channel.sourceNode = context.createMediaElementSource(source);
      } else if (typeof source.connect === 'function') {
        channel.sourceNode = source;
      } else {
        throw new TypeError('Channel source must be a MediaElement or AudioNode');
      }
      channel.sourceNode.connect(channel.trimNode);
      channel.source = source;
      return channel;
    }

    function setChannel(index, patch) {
      patch = patch || {};
      var channel = channels[index] || addChannel(index, patch.source);
      if (patch.gainDb != null) channel.gainDb = db(patch.gainDb);
      if (patch.gain != null) channel.gainDb = 20 * Math.log10(Math.max(0.0001, Number(patch.gain)));
      if (patch.trimDb != null) channel.trimNode.gain.value = gainForDb(patch.trimDb);
      if (patch.trim != null) channel.trimNode.gain.value = Math.max(0, Number(patch.trim));
      if (patch.fader != null) channel.gainDb = 20 * Math.log10(Math.max(0.0001, Number(patch.fader)));
      if (patch.lowKill != null) channel.lowKill = !!patch.lowKill;
      if (patch.midKill != null) channel.midKill = !!patch.midKill;
      if (patch.highKill != null) channel.highKill = !!patch.highKill;
      channel.low.gain.value = channel.lowKill ? -60 : db(patch.low == null ? channel.lowDb : patch.low);
      channel.mid.gain.value = channel.midKill ? -60 : db(patch.mid == null ? channel.midDb : patch.mid);
      channel.high.gain.value = channel.highKill ? -60 : db(patch.high == null ? channel.highDb : patch.high);
      channel.lowDb = channel.lowKill ? -60 : db(patch.low == null ? channel.lowDb : patch.low);
      channel.midDb = channel.midKill ? -60 : db(patch.mid == null ? channel.midDb : patch.mid);
      channel.highDb = channel.highKill ? -60 : db(patch.high == null ? channel.highDb : patch.high);
      if (patch.filter != null) {
        var filterValue = Math.max(-1, Math.min(1, Number(patch.filter)));
        if (filterValue < -0.02) {
          channel.filterNode.type = 'lowpass';
          channel.filterNode.frequency.value = 1000 * Math.pow(20, 1 + filterValue);
        } else if (filterValue > 0.02) {
          channel.filterNode.type = 'highpass';
          channel.filterNode.frequency.value = 1000 * Math.pow(20, filterValue);
        } else {
          channel.filterNode.type = 'allpass';
          channel.filterNode.frequency.value = 1000;
        }
      }
      if (patch.pan != null && channel.panNode) channel.panNode.pan.value = Math.max(-1, Math.min(1, Number(patch.pan)));
      if (patch.muted != null) channel.muted = !!patch.muted;
      if (patch.pitch != null) setPitch(index, patch.pitch);
      if (patch.pitchBend != null) setPitchBend(index, patch.pitchBend);
      applyChannel(index);
      return state(index);
    }

    function applyChannel(index) {
      var channel = channels[index];
      if (!channel) return;
      var base = channel.muted ? 0 : gainForDb(channel.gainDb);
      channel.gainNode.gain.value = base * channel.crossGain;
    }

    function applyCrossfader() {
      var left, right;
      if (crossfaderCurve === 'linear') {
        left = (crossfader <= 0) ? 1 : 1 - crossfader;
        right = (crossfader >= 0) ? 1 : 1 + crossfader;
      } else {
        var angle = (crossfader + 1) * Math.PI / 4;
        left = Math.cos(angle);
        right = Math.sin(angle);
      }
      channels.forEach(function (channel, index) {
        if (!channel) return;
        channel.crossGain = index <= 1 ? left : right;
        applyChannel(index);
      });
    }

    function setCrossfader(value) {
      crossfader = Math.max(-1, Math.min(1, Number(value) || 0));
      applyCrossfader();
      return crossfader;
    }

    function setCue(index, enabled) {
      var channel = channels[index];
      if (!channel) return false;
      channel.cueEnabled = !!enabled;
      channel.cueNode.gain.value = channel.cueEnabled ? 1 : 0;
      previewEnabled = channels.some(function (item) { return item && item.cueEnabled; });
      return channel.cueEnabled;
    }

    function toggleCue(index) {
      var channel = channels[index];
      if (!channel) return false;
      return setCue(index, !channel.cueEnabled);
    }

    function setCueGain(value) {
      var gainValue = typeof value === 'number' && value <= 2 ? value : gainForDb(value);
      cueGain.gain.value = Math.max(0, gainValue);
      return cueGain.gain.value;
    }

    function setPreviewMix(value) {
      previewMix = Math.max(0, Math.min(1, Number(value) || 0));
      return previewMix;
    }

    function getCueState() {
      return {
        enabled: previewEnabled,
        mix: previewMix,
        gain: cueGain.gain.value,
        channels: channels.map(function (channel) {
          return channel ? channel.cueEnabled : false;
        })
      };
    }

    function cueMeter() {
      var data = new Uint8Array(cueAnalyser.fftSize);
      cueAnalyser.getByteTimeDomainData(data);
      var sum = 0;
      for (var i = 0; i < data.length; i++) {
        var value = (data[i] - 128) / 128;
        sum += value * value;
      }
      return data.length ? Math.min(1, Math.sqrt(sum / data.length) * 2) : 0;
    }

    function createPreviewControl(options) {
      options = options || {};
      var root = document.createElement('section');
      root.className = 'bm-dj-preview';
      root.setAttribute('aria-label', 'Headphone preview');
      var title = document.createElement('strong');
      title.textContent = options.title || 'DJ Preview';
      var mix = document.createElement('input');
      mix.type = 'range';
      mix.min = '0';
      mix.max = '1';
      mix.step = '0.01';
      mix.value = String(previewMix);
      mix.setAttribute('aria-label', 'Preview mix');
      var gain = document.createElement('input');
      gain.type = 'range';
      gain.min = '0';
      gain.max = '1';
      gain.step = '0.01';
      gain.value = '1';
      gain.setAttribute('aria-label', 'Preview gain');
      var buttons = [];
      for (var i = 0; i < 4; i++) {
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'PFL ' + (i + 1);
        button.setAttribute('aria-pressed', 'false');
        (function (index, control) {
          control.addEventListener('click', function () {
            var enabled = toggleCue(index);
            control.setAttribute('aria-pressed', String(enabled));
            if (options.onChange) options.onChange(getCueState());
          });
        })(i, button);
        buttons.push(button);
      }
      mix.addEventListener('input', function () {
        setPreviewMix(mix.value);
        if (options.onChange) options.onChange(getCueState());
      });
      gain.addEventListener('input', function () {
        setCueGain(Number(gain.value));
        if (options.onChange) options.onChange(getCueState());
      });
      root.append(title);
      buttons.forEach(function (button) { root.append(button); });
      root.append(mix, gain);
      return {
        element: root,
        setMix: setPreviewMix,
        setCue: setCue,
        getState: getCueState,
        destroy: function () { root.remove(); }
      };
    }

    function setPitch(index, semitones) {
      var channel = channels[index];
      if (!channel) return null;
      channel.pitchSemitones = Number(semitones) || 0;
      if (channel.audio) {
        channel.audio.preservesPitch = true;
        if ('mozPreservesPitch' in channel.audio) channel.audio.mozPreservesPitch = true;
        if ('webkitPreservesPitch' in channel.audio) channel.audio.webkitPreservesPitch = true;
        channel.audio.playbackRate = Math.pow(2, (channel.pitchSemitones + channel.pitchBendSemitones) / 12);
      }
      return state(index);
    }

    function setPitchBend(index, semitones) {
      var channel = channels[index];
      if (!channel) return null;
      channel.pitchBendSemitones = Number(semitones) || 0;
      if (channel.audio) channel.audio.playbackRate = Math.pow(2, (channel.pitchSemitones + channel.pitchBendSemitones) / 12);
      return state(index);
    }

    function setMasterGain(value) {
      masterGain.gain.value = gainForDb(typeof value === 'number' ? 20 * Math.log10(Math.max(0.0001, value)) : value);
      return masterGain.gain.value;
    }

    function setCrossfaderCurve(curve) {
      crossfaderCurve = curve === 'linear' ? 'linear' : 'equal-power';
      applyCrossfader();
      return crossfaderCurve;
    }

    function setLimiter(options) {
      options = options || {};
      if (options.threshold != null) limiter.threshold.value = Number(options.threshold);
      if (options.knee != null) limiter.knee.value = Number(options.knee);
      if (options.ratio != null) limiter.ratio.value = Number(options.ratio);
      if (options.attack != null) limiter.attack.value = Number(options.attack);
      if (options.release != null) limiter.release.value = Number(options.release);
      return { threshold: limiter.threshold.value, knee: limiter.knee.value, ratio: limiter.ratio.value };
    }

    function meter(index) {
      var channel = channels[index];
      if (!channel) return 0;
      var data = new Uint8Array(channel.analyser.fftSize);
      channel.analyser.getByteTimeDomainData(data);
      var sum = 0;
      for (var i = 0; i < data.length; i++) {
        var value = (data[i] - 128) / 128;
        sum += value * value;
      }
      return data.length ? Math.min(1, Math.sqrt(sum / data.length) * 2) : 0;
    }

    function state(index) {
      var channel = channels[index];
      if (!channel) return null;
      return {
        index: index,
        gainDb: channel.gainDb,
        trimDb: 20 * Math.log10(Math.max(0.0001, channel.trimNode.gain.value)),
        lowDb: channel.low.gain.value,
        midDb: channel.mid.gain.value,
        highDb: channel.high.gain.value,
        filter: channel.filterNode.type === 'allpass' ? 0 : channel.filterNode.type === 'lowpass' ? -1 : 1,
        lowKill: !!channel.lowKill,
        midKill: !!channel.midKill,
        highKill: !!channel.highKill,
        pan: channel.panNode ? channel.panNode.pan.value : 0,
        pitchSemitones: channel.pitchSemitones,
        pitchBendSemitones: channel.pitchBendSemitones,
        muted: channel.muted,
        cue: channel.cueEnabled,
        meter: meter(index)
      };
    }

    function getState() {
      var out = [];
      for (var i = 0; i < 4; i++) out.push(state(i));
      return out;
    }

    function destroy() {
      channels.forEach(function (channel) {
        if (!channel) return;
        [channel.sourceNode, channel.trimNode, channel.low, channel.mid, channel.high, channel.filterNode, channel.panNode, channel.gainNode, channel.cueNode, channel.analyser].forEach(function (node) {
          if (node && typeof node.disconnect === 'function') node.disconnect();
        });
      });
      cueGain.disconnect();
      cueAnalyser.disconnect();
      masterGain.disconnect();
      masterAnalyser.disconnect();
    }

    return {
      context: context,
      addChannel: addChannel,
      setChannel: setChannel,
      setCrossfader: setCrossfader,
      setPitch: setPitch,
      setPitchBend: setPitchBend,
      setMasterGain: setMasterGain,
      setCrossfaderCurve: setCrossfaderCurve,
      setLimiter: setLimiter,
      setCue: setCue,
      toggleCue: toggleCue,
      setCueGain: setCueGain,
      setPreviewMix: setPreviewMix,
      getCueState: getCueState,
      cueMeter: cueMeter,
      createPreviewControl: createPreviewControl,
      meter: meter,
      state: state,
      getState: getState,
      destroy: destroy
    };
  }

  return { create: create };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.DJMixer;
