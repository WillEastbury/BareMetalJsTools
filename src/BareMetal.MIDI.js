/* BareMetal.MIDI - dependency-free Web MIDI access and message routing. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.MIDI = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var access = null;
    var inputs = new Map();
    var listeners = new Set();
    var destroyed = false;

    async function request() {
      if (!navigator || typeof navigator.requestMIDIAccess !== 'function') {
        throw new Error('Web MIDI is unavailable');
      }
      access = await navigator.requestMIDIAccess({ sysex: !!options.sysex });
      attach();
      access.onstatechange = function (event) {
        attach();
        if (options.onStateChange) options.onStateChange(event, getDevices());
      };
      return access;
    }

    function attach() {
      if (!access) return;
      inputs.forEach(function (input) { input.onmidimessage = null; });
      inputs.clear();
      Array.prototype.forEach.call(access.inputs.values(), function (input) {
        inputs.set(input.id, input);
        input.onmidimessage = handleMessage;
      });
    }

    function handleMessage(event) {
      var data = event.data;
      if (!data || data.length < 2) return;
      var status = data[0];
      var type = status & 0xF0;
      var channel = (status & 0x0F) + 1;
      var message;
      if (type === 0x90 && data[2] > 0) {
        message = { type: 'noteon', channel: channel, note: data[1], velocity: data[2] / 127, value: data[2] };
      } else if (type === 0x80 || (type === 0x90 && data[2] === 0)) {
        message = { type: 'noteoff', channel: channel, note: data[1], velocity: (data[2] || 0) / 127, value: data[2] || 0 };
      } else if (type === 0xB0) {
        message = { type: 'cc', channel: channel, controller: data[1], value: data[2] / 127, raw: data[2] };
      } else if (type === 0xE0) {
        var bend = ((data[2] << 7) | data[1]) - 8192;
        message = { type: 'pitchbend', channel: channel, value: bend / 8192, raw: bend };
      } else {
        return;
      }
      listeners.forEach(function (listener) {
        try { listener(message, event.target || event.currentTarget || null); } catch (_) {}
      });
      if (options.onMessage) options.onMessage(message, event.target || null);
    }

    function onMessage(listener) {
      if (typeof listener !== 'function') throw new TypeError('MIDI listener must be a function');
      listeners.add(listener);
      return function () { listeners.delete(listener); };
    }

    function mapCC(controller, callback) {
      return onMessage(function (message) {
        if (message.type === 'cc' && message.controller === controller) callback(message);
      });
    }

    function mapPitchBend(callback) {
      return onMessage(function (message) {
        if (message.type === 'pitchbend') callback(message);
      });
    }

    function getInputs() { return Array.from(inputs.values()); }
    function getOutputs() {
      return access ? Array.from(access.outputs.values()) : [];
    }
    function getDevices() {
      return {
        inputs: getInputs().map(function (input) {
          return { id: input.id, name: input.name || '', manufacturer: input.manufacturer || '', state: input.state, type: 'input' };
        }),
        outputs: getOutputs().map(function (output) {
          return { id: output.id, name: output.name || '', manufacturer: output.manufacturer || '', state: output.state, type: 'output' };
        })
      };
    }
    function send(outputId, data) {
      var output = outputId ? access.outputs.get(outputId) : getOutputs()[0];
      if (!output) return false;
      output.send(data);
      return true;
    }

    function destroy() {
      destroyed = true;
      inputs.forEach(function (input) { input.onmidimessage = null; });
      inputs.clear();
      listeners.clear();
      if (access && access.onstatechange) access.onstatechange = null;
    }

    return {
      request: request,
      onMessage: onMessage,
      mapCC: mapCC,
      mapPitchBend: mapPitchBend,
      getInputs: getInputs,
      getOutputs: getOutputs,
      getDevices: getDevices,
      send: send,
      destroy: destroy
    };
  }

  return { create: create };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.MIDI;
