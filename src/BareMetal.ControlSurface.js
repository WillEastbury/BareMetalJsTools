/* BareMetal.ControlSurface — schema-driven, accessible parameter panels. */
var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.ControlSurface = (() => {
  'use strict';
  const doc = () => typeof document !== 'undefined' ? document : null;
  const clone = value => JSON.parse(JSON.stringify(value));
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function create(options = {}) {
    const d = doc();
    if (!d) throw new Error('ControlSurface requires a document');
    const schema = Array.isArray(options.fields) ? options.fields : Object.entries(options.fields || {}).map(([name, field]) => ({name, ...field}));
    const values = Object.assign({}, options.values || {}), inputs = Object.create(null), listeners = new Set();
    const root = d.createElement('section'); root.className = 'bm-control-surface';
    if (options.label) { root.setAttribute('aria-label', options.label); root.setAttribute('role', 'group'); }
    if (options.title) { const heading = d.createElement(options.headingTag || 'h3'); heading.textContent = options.title; root.append(heading); }
    const status = d.createElement('span'); status.className = 'bm-surface-status'; status.setAttribute('role', 'status');
    let presetSelect = null, destroyed = false;
    function emit(name, value, source) {
      if (options.storageKey) try { localStorage.setItem(options.storageKey, JSON.stringify(values)); } catch (_) {}
      const detail = {name, value, values: clone(values), source: source || 'input'};
      listeners.forEach(fn => { try { fn(detail); } catch (_) {} });
      if (typeof options.onChange === 'function') options.onChange(detail);
      root.dispatchEvent(new CustomEvent('bm:change', {detail, bubbles: true}));
    }
    function normalize(field, value) {
      if (field.type === 'number' || field.type === 'range') {
        const n = Number(value); if (!Number.isFinite(n)) return values[field.name];
        return Math.max(field.min == null ? -Infinity : Number(field.min), Math.min(field.max == null ? Infinity : Number(field.max), n));
      }
      if (field.type === 'toggle' || field.type === 'checkbox') return !!value;
      return value;
    }
    function write(field, value, notify = true, source = 'api') {
      value = normalize(field, value); values[field.name] = value;
      const input = inputs[field.name]; if (input) {
        if (input.type === 'checkbox') input.checked = !!value; else input.value = value == null ? '' : String(value);
        if (input._bmOutput) input._bmOutput.textContent = field.format ? field.format(value) : String(value) + (field.unit || '');
        input.setAttribute('aria-valuetext', field.format ? field.format(value) : String(value) + (field.unit || ''));
      }
      if (notify) emit(field.name, value, source);
      return value;
    }
    function addField(field, parent) {
      if (!field || !field.name) return;
      if (!has(values, field.name)) values[field.name] = field.defaultValue !== undefined ? field.defaultValue : (field.value !== undefined ? field.value : (field.type === 'toggle' || field.type === 'checkbox' ? false : ''));
      if (field.type === 'action') {
        const button = d.createElement('button'); button.type = 'button'; button.className = 'bm-control-action'; button.textContent = field.label || field.name;
        button.addEventListener('click', () => { if (typeof field.action === 'function') field.action({values: clone(values), set, root}); }); parent.append(button); return;
      }
      const row = d.createElement('div'); row.className = 'bm-control-row';
      const label = d.createElement('label'); label.textContent = field.label || field.name; label.htmlFor = 'bm-cs-' + Math.random().toString(36).slice(2);
      const input = d.createElement('input'); input.id = label.htmlFor;
      let type = field.type || 'text'; if (type === 'toggle') type = 'checkbox';
      input.type = ['number','range','checkbox','color'].includes(type) ? type : 'text';
      if (field.min != null) input.min = field.min; if (field.max != null) input.max = field.max; if (field.step != null) input.step = field.step;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.type === 'select') {
        const select = d.createElement('select'); select.id = input.id; select.className = 'bm-control-input';
        for (const item of field.options || []) { const option = d.createElement('option'); option.value = String(typeof item === 'object' ? item.value : item); option.textContent = String(typeof item === 'object' ? item.label : item); select.append(option); }
        inputs[field.name] = select; select.addEventListener('change', () => write(field, select.value, true));
        label.htmlFor = select.id; row.append(label, select);
      } else {
        input.className = 'bm-control-input'; if (field.type === 'toggle' || field.type === 'checkbox') row.classList.add('bm-control-check');
        const output = (field.type === 'range' || field.type === 'number') ? d.createElement('output') : null;
        if (output) { output.className = 'bm-control-readout'; input._bmOutput = output; }
        inputs[field.name] = input;
        const update = () => write(field, input.type === 'checkbox' ? input.checked : (input.type === 'number' || input.type === 'range' ? input.value : input.value), true);
        input.addEventListener(field.type === 'range' ? 'input' : 'change', update);
        if (field.type === 'range') input.addEventListener('change', update);
        if (input.type === 'checkbox') row.append(input, label); else { row.append(label, input); if (output) row.append(output); }
      }
      if (field.help) { const help = d.createElement('small'); help.className = 'bm-control-help'; help.textContent = field.help; row.append(help); }
      parent.append(row); write(field, values[field.name], false);
    }
    const groups = new Map();
    for (const field of schema) {
      const groupName = field.group || '';
      let parent = root;
      if (groupName) {
        if (!groups.has(groupName)) { const group = d.createElement('fieldset'); group.className = 'bm-control-group'; const legend = d.createElement('legend'); legend.textContent = groupName; group.append(legend); groups.set(groupName, group); root.append(group); }
        parent = groups.get(groupName);
      }
      addField(field, parent);
    }
    if (Array.isArray(options.presets) && options.presets.length) {
      const bar = d.createElement('div'); bar.className = 'bm-control-presets'; presetSelect = d.createElement('select'); presetSelect.setAttribute('aria-label', options.presetLabel || 'Preset');
      const placeholder = d.createElement('option'); placeholder.value = ''; placeholder.textContent = options.presetLabel || 'Choose preset'; presetSelect.append(placeholder);
      options.presets.forEach((preset, index) => { const option = d.createElement('option'); option.value = String(index); option.textContent = preset.label || preset.name || ('Preset ' + (index + 1)); presetSelect.append(option); });
      presetSelect.addEventListener('change', () => { const preset = options.presets[Number(presetSelect.value)]; if (preset) setMany(preset.values || {}, 'preset'); }); bar.append(presetSelect); root.append(bar);
    }
    root.append(status);
    function set(name, value, opts = {}) { const field = schema.find(item => item.name === name); if (!field) throw new RangeError('Unknown control: ' + name); return write(field, value, opts.silent !== true, opts.source || 'api'); }
    function setMany(next, source = 'api') { Object.keys(next || {}).forEach(name => { const field = schema.find(item => item.name === name); if (field) write(field, next[name], false, source); }); if (Object.keys(next || {}).length) emit('*', clone(next), source); return api; }
    function get() { return clone(values); }
    function reset() { const initial = {}; schema.forEach(field => { initial[field.name] = field.defaultValue !== undefined ? field.defaultValue : (field.value !== undefined ? field.value : (field.type === 'toggle' || field.type === 'checkbox' ? false : '')); }); return setMany(initial, 'reset'); }
    const api = {element: root, inputs, status, get, set, setMany, reset, onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }, destroy() { if (destroyed) return; destroyed = true; listeners.clear(); root.remove(); }};
    if (options.storageKey) try { const saved = JSON.parse(localStorage.getItem(options.storageKey) || 'null'); if (saved && typeof saved === 'object') setMany(saved, 'restore'); } catch (_) {}
    return api;
  }
  return {create};
})();
if (typeof module !== 'undefined') module.exports = BareMetal.ControlSurface;
