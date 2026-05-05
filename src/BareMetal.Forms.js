var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Forms = (function(){
  'use strict';

  var store = new WeakMap();
  var toks = { '#': /\d/, 'A': /[A-Za-z]/, '*': /./ };

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function arr(v) { return Array.prototype.slice.call(v || []); }
  function docOf(el) { return el && el.ownerDocument ? el.ownerDocument : (typeof document !== 'undefined' ? document : null); }
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v) && !isFile(v); }
  function isFile(v) { return typeof File !== 'undefined' && v instanceof File; }
  function txt(v) { return v == null ? '' : String(v); }
  function trim(v) { return txt(v).replace(/^\s+|\s+$/g, ''); }
  function empty(v) {
    if (v == null) return true;
    if (typeof v === 'boolean') return !v;
    if (isFile(v)) return false;
    if (Array.isArray(v)) return !v.length;
    return trim(v) === '';
  }
  function clone(v) {
    var out, k, i;
    if (Array.isArray(v)) {
      out = [];
      for (i = 0; i < v.length; i++) out.push(clone(v[i]));
      return out;
    }
    if (isObj(v)) {
      out = {};
      for (k in v) if (own(v, k)) out[k] = clone(v[k]);
      return out;
    }
    return v;
  }
  function same(a, b) {
    var i, ka, kb;
    if (a === b) return true;
    if (isFile(a) || isFile(b)) {
      return !!a && !!b && a.name === b.name && a.size === b.size && a.type === b.type && a.lastModified === b.lastModified;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
      for (i = 0; i < a.length; i++) if (!same(a[i], b[i])) return false;
      return true;
    }
    if (isObj(a) || isObj(b)) {
      if (!isObj(a) || !isObj(b)) return false;
      ka = Object.keys(a); kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (i = 0; i < ka.length; i++) if (!same(a[ka[i]], b[ka[i]])) return false;
      return true;
    }
    return txt(a) === txt(b);
  }
  function escHtml(v) {
    return txt(v).replace(/[&<>\"]/g, function(ch) {
      return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;';
    });
  }
  function nice(name) {
    name = txt(name).replace(/[\[\]]+/g, ' ').replace(/[._-]+/g, ' ');
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Field';
  }
  function kind(el) { return txt(el && (el.type || el.tagName)).toLowerCase(); }
  function names(root) {
    return root && root.querySelectorAll ? arr(root.querySelectorAll('input[name],select[name],textarea[name]')) : [];
  }
  function byName(root, name) {
    var list = names(root), out = [], i;
    for (i = 0; i < list.length; i++) if (list[i].name === name) out.push(list[i]);
    return out;
  }
  function groups(root) {
    var out = {}, list = names(root), i, n;
    for (i = 0; i < list.length; i++) {
      n = list[i].name;
      if (!n) continue;
      (out[n] = out[n] || []).push(list[i]);
    }
    return out;
  }
  function testRe(p) {
    if (p instanceof RegExp) {
      try { return new RegExp(p.source, p.flags.replace(/g/g, '')); } catch (_) { return new RegExp(p.source); }
    }
    if (typeof p === 'string' && p) {
      try { return new RegExp(p); } catch (_) { return null; }
    }
    return null;
  }
  function email(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(txt(v)); }
  function url(v) {
    try { return !!new URL(txt(v)); } catch (_) { return false; }
  }
  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function isNumRule(rule, list) {
    var t = txt(rule && rule.type).toLowerCase();
    return t === 'number' || t === 'range' || /^(number|range)$/.test(kind(list && list[0]));
  }
  function count(v) { return Array.isArray(v) ? v.length : txt(v).length; }
  function elValue(list) {
    var el = list && list[0], i, out, opts;
    if (!el) return undefined;
    switch (kind(el)) {
      case 'radio':
        for (i = 0; i < list.length; i++) if (list[i].checked) return list[i].value;
        return null;
      case 'checkbox':
        if (list.length === 1) return !!el.checked;
        out = [];
        for (i = 0; i < list.length; i++) if (list[i].checked) out.push(list[i].value || true);
        return out;
      case 'select-multiple':
        out = [];
        opts = el.options || [];
        for (i = 0; i < opts.length; i++) if (opts[i].selected) out.push(opts[i].value);
        return out;
      case 'file':
        out = arr(el.files || []);
        return el.multiple ? out : (out[0] || null);
      default:
        if (list.length > 1) {
          out = [];
          for (i = 0; i < list.length; i++) out.push(list[i].value);
          return out;
        }
        return el.value;
    }
  }
  function serialize(root) {
    var out = {}, g = groups(root), k;
    for (k in g) if (own(g, k)) out[k] = elValue(g[k]);
    return out;
  }
  function pick(v) { return Array.isArray(v) ? v : [v]; }
  function setValues(list, val) {
    var el = list && list[0], i, vals, map, opts;
    if (!el) return;
    switch (kind(el)) {
      case 'radio':
        for (i = 0; i < list.length; i++) list[i].checked = txt(list[i].value) === txt(val);
        return;
      case 'checkbox':
        if (list.length === 1) {
          if (Array.isArray(val)) list[0].checked = val.indexOf(list[0].value) > -1 || val.indexOf(true) > -1;
          else if (typeof val === 'string' && list[0].value && list[0].value !== 'on') list[0].checked = val === list[0].value || val === 'true';
          else list[0].checked = !!val && val !== 'false' && val !== 0;
          return;
        }
        vals = pick(val); map = {};
        for (i = 0; i < vals.length; i++) map[txt(vals[i])] = 1;
        for (i = 0; i < list.length; i++) list[i].checked = !!map[txt(list[i].value)] || (!!map.true && !list[i].value);
        return;
      case 'select-multiple':
        vals = pick(val); map = {};
        for (i = 0; i < vals.length; i++) map[txt(vals[i])] = 1;
        opts = el.options || [];
        for (i = 0; i < opts.length; i++) opts[i].selected = !!map[txt(opts[i].value)];
        return;
      case 'file':
        return;
      default:
        if (list.length > 1 && Array.isArray(val)) {
          for (i = 0; i < list.length; i++) list[i].value = val[i] == null ? '' : val[i];
          return;
        }
        for (i = 0; i < list.length; i++) list[i].value = val == null ? '' : val;
    }
  }
  function deserialize(root, data) {
    var g = groups(root), k, d = data || {};
    for (k in g) if (own(g, k) && own(d, k)) setValues(g[k], d[k]);
    return root;
  }
  function fieldWrap(el, root) {
    var cur = el;
    while (cur && cur !== root && cur.nodeType === 1) {
      if (cur.getAttribute && (cur.getAttribute('data-field') != null || cur.getAttribute('data-form-field') != null)) return cur;
      if (typeof cur.className === 'string' && /(^|\s)(field|bm-field)(\s|$)/.test(cur.className)) return cur;
      if (/^(LABEL|FIELDSET|LI|P|DIV)$/.test(cur.tagName) && cur.parentNode === root) return cur;
      cur = cur.parentNode;
    }
    return el;
  }
  function message(label, textValue) { return label + ' ' + textValue; }
  function validate(root, rules) {
    var vals = serialize(root), schema = rules && rules.fields ? rules.fields : (rules || {}), out = {}, k, rule, label, v, n, re, other, list;
    for (k in schema) if (own(schema, k)) {
      rule = schema[k] || {};
      label = rule.label || nice(k);
      v = own(vals, k) ? vals[k] : undefined;
      list = byName(root, k);
      if (rule.required && empty(v)) {
        out[k] = [message(label, 'is required.')];
        continue;
      }
      if (empty(v)) continue;
      if ((rule.email || rule.type === 'email') && !email(v)) (out[k] = out[k] || []).push(message(label, 'must be a valid email.'));
      if ((rule.url || rule.type === 'url') && !url(v)) (out[k] = out[k] || []).push(message(label, 'must be a valid URL.'));
      re = testRe(rule.pattern);
      if (re && !re.test(txt(v))) (out[k] = out[k] || []).push(message(label, 'has an invalid format.'));
      if (rule.match && !same(v, vals[rule.match])) {
        other = schema[rule.match] && schema[rule.match].label ? schema[rule.match].label : nice(rule.match);
        (out[k] = out[k] || []).push(message(label, 'must match ' + other + '.'));
      }
      if (rule.minLength != null && count(v) < rule.minLength) (out[k] = out[k] || []).push(message(label, 'must be at least ' + rule.minLength + ' characters.'));
      if (rule.maxLength != null && count(v) > rule.maxLength) (out[k] = out[k] || []).push(message(label, 'must be at most ' + rule.maxLength + ' characters.'));
      if (rule.min != null) {
        if (isNumRule(rule, list)) {
          n = num(v);
          if (n != null && n < rule.min) (out[k] = out[k] || []).push(message(label, 'must be at least ' + rule.min + '.'));
        } else if (count(v) < rule.min) (out[k] = out[k] || []).push(message(label, 'must be at least ' + rule.min + ' characters.'));
      }
      if (rule.max != null) {
        if (isNumRule(rule, list)) {
          n = num(v);
          if (n != null && n > rule.max) (out[k] = out[k] || []).push(message(label, 'must be at most ' + rule.max + '.'));
        } else if (count(v) > rule.max) (out[k] = out[k] || []).push(message(label, 'must be at most ' + rule.max + ' characters.'));
      }
      if (typeof rule.custom === 'function') {
        try {
          other = rule.custom(v, vals, rule, root);
          if (typeof other === 'string' && other) (out[k] = out[k] || []).push(other);
        } catch (_) {}
      }
    }
    return { valid: !Object.keys(out).length, errors: out };
  }
  function ensure(form, schema) {
    var meta = store.get(form);
    if (!meta) {
      meta = { form: form, schema: null, initial: clone(serialize(form)), touched: {}, errors: {}, changeCbs: [], submitCbs: [], destroyers: [], bound: false };
      store.set(form, meta);
    }
    if (schema) meta.schema = schema.fields ? schema.fields : schema;
    if (!meta.bound && form && form.addEventListener) {
      meta.bound = true;
      meta.onInput = function(ev) {
        if (ev && ev.target && ev.target.name) meta.touched[ev.target.name] = 1;
        fireChanges(meta, ev);
      };
      meta.onChange = function(ev) {
        if (ev && ev.target && ev.target.name) meta.touched[ev.target.name] = 1;
        fireChanges(meta, ev);
      };
      meta.onBlur = function(ev) {
        if (ev && ev.target && ev.target.name) meta.touched[ev.target.name] = 1;
      };
      meta.onSubmit = function(ev) {
        var state = getState(form), vals, i;
        if (meta.submitCbs.length) {
          if (ev && ev.preventDefault) ev.preventDefault();
          if (!state.valid) return;
          vals = state.values;
          for (i = 0; i < meta.submitCbs.length; i++) {
            try { meta.submitCbs[i](vals, ev, state); } catch (_) {}
          }
        } else if (meta.schema && !state.valid && ev && ev.preventDefault) ev.preventDefault();
      };
      form.addEventListener('input', meta.onInput);
      form.addEventListener('change', meta.onChange);
      form.addEventListener('blur', meta.onBlur, true);
      form.addEventListener('submit', meta.onSubmit);
      meta.destroyers.push(function() {
        form.removeEventListener('input', meta.onInput);
        form.removeEventListener('change', meta.onChange);
        form.removeEventListener('blur', meta.onBlur, true);
        form.removeEventListener('submit', meta.onSubmit);
      });
    }
    return meta;
  }
  function fireChanges(meta, ev) {
    var state = getState(meta.form), i;
    for (i = 0; i < meta.changeCbs.length; i++) {
      try { meta.changeCbs[i](state.values, state, ev); } catch (_) {}
    }
  }
  function diff(form) {
    var meta = ensure(form), now = serialize(form), out = {}, seen = {}, k;
    for (k in meta.initial) if (own(meta.initial, k)) seen[k] = 1;
    for (k in now) if (own(now, k)) seen[k] = 1;
    for (k in seen) if (!same(meta.initial[k], now[k])) out[k] = now[k];
    return out;
  }
  function getState(form) {
    var meta = ensure(form), res = meta.schema ? validate(form, meta.schema) : { valid: form && form.checkValidity ? form.checkValidity() : true, errors: {} }, vals = serialize(form), changed = diff(form), dirty = false, touched = false, k;
    for (k in changed) if (own(changed, k)) { dirty = true; break; }
    for (k in meta.touched) if (own(meta.touched, k)) { touched = true; break; }
    meta.errors = res.errors;
    return { dirty: dirty, pristine: !dirty, valid: res.valid, invalid: !res.valid, touched: touched, untouched: !touched, errors: clone(res.errors), values: vals };
  }
  function create(form, schema) {
    var meta = ensure(form, schema), api;
    api = {
      validate: function() { var res = validate(form, meta.schema || schema || {}); meta.errors = res.errors; return res; },
      getValues: function() { return serialize(form); },
      setValues: function(obj) { deserialize(form, obj || {}); return api; },
      reset: function() {
        if (form && form.reset) form.reset();
        deserialize(form, meta.initial);
        meta.touched = {};
        meta.errors = {};
        return api;
      },
      destroy: function() {
        var list = meta.destroyers.slice(), i;
        for (i = 0; i < list.length; i++) list[i]();
        store.delete(form);
      },
      onSubmit: function(cb) { if (typeof cb === 'function') meta.submitCbs.push(cb); return api; },
      onChange: function(cb) { if (typeof cb === 'function') meta.changeCbs.push(cb); return api; },
      getState: function() { return getState(form); },
      form: form
    };
    return api;
  }
  function toFormData(form) {
    var fd, g, k, list, el, i, opts;
    try {
      if (form && form.tagName === 'FORM') return new FormData(form);
    } catch (_) {}
    fd = new FormData();
    g = groups(form);
    for (k in g) if (own(g, k)) {
      list = g[k]; el = list[0];
      switch (kind(el)) {
        case 'radio':
          for (i = 0; i < list.length; i++) if (list[i].checked) fd.append(k, list[i].value);
          break;
        case 'checkbox':
          if (list.length === 1) { if (list[0].checked) fd.append(k, list[0].value && list[0].value !== 'on' ? list[0].value : 'true'); }
          else for (i = 0; i < list.length; i++) if (list[i].checked) fd.append(k, list[i].value || 'true');
          break;
        case 'select-multiple':
          opts = el.options || [];
          for (i = 0; i < opts.length; i++) if (opts[i].selected) fd.append(k, opts[i].value);
          break;
        case 'file':
          for (i = 0; i < (el.files || []).length; i++) fd.append(k, el.files[i]);
          break;
        default:
          if (list.length > 1) for (i = 0; i < list.length; i++) fd.append(k, list[i].value);
          else fd.append(k, el.value);
      }
    }
    return fd;
  }
  function rawFrom(masked, pattern, stop) {
    var out = '', pi = 0, i = 0, ch, need, take;
    stop = stop == null ? masked.length : stop;
    while (i < stop && pi < pattern.length) {
      ch = masked.charAt(i);
      need = toks[pattern.charAt(pi)];
      if (!need) {
        if (ch === pattern.charAt(pi)) { i++; pi++; }
        else pi++;
        continue;
      }
      take = need.test(ch);
      if (take) {
        out += pattern.charAt(pi) === 'A' ? ch.toUpperCase() : ch;
        i++;
        pi++;
      } else i++;
    }
    return out;
  }
  function format(raw, pattern) {
    var out = '', ri = 0, pi = 0, ch, need;
    raw = txt(raw);
    while (pi < pattern.length && ri < raw.length) {
      need = toks[pattern.charAt(pi)];
      if (!need) { out += pattern.charAt(pi); pi++; continue; }
      ch = raw.charAt(ri);
      if (need.test(ch)) {
        out += pattern.charAt(pi) === 'A' ? ch.toUpperCase() : ch;
        pi++; ri++;
      } else ri++;
    }
    return out;
  }
  function cursorPos(count, pattern) {
    var pi = 0, seen = 0;
    if (!count) return 0;
    while (pi < pattern.length) {
      if (toks[pattern.charAt(pi)]) {
        seen++;
        if (seen >= count) return pi + 1;
      }
      pi++;
    }
    return pattern.length;
  }
  function mask(input, pattern) {
    var onInput, onKey, onPaste;
    function paint(pos) {
      var raw = rawFrom(input.value, pattern), val = format(raw, pattern), at = cursorPos(pos == null ? raw.length : pos, pattern);
      input.value = val;
      try { input.setSelectionRange(at, at); } catch (_) {}
    }
    onInput = function() {
      var raw = rawFrom(input.value, pattern), pos = rawFrom(input.value, pattern, input.selectionStart || 0).length;
      input.value = format(raw, pattern);
      try { input.setSelectionRange(cursorPos(pos, pattern), cursorPos(pos, pattern)); } catch (_) {}
    };
    onPaste = function() { setTimeout(onInput, 0); };
    onKey = function(ev) {
      var pos, raw, left;
      if (!ev || ev.key !== 'Backspace') return;
      pos = input.selectionStart || 0;
      if (input.selectionStart !== input.selectionEnd) return;
      raw = rawFrom(input.value, pattern);
      left = rawFrom(input.value, pattern, pos).length;
      if (!left) return;
      ev.preventDefault();
      raw = raw.slice(0, left - 1) + raw.slice(left);
      input.value = format(raw, pattern);
      try { input.setSelectionRange(cursorPos(left - 1, pattern), cursorPos(left - 1, pattern)); } catch (_) {}
    };
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);
    input.addEventListener('paste', onPaste);
    paint();
    return { destroy: function() { input.removeEventListener('input', onInput); input.removeEventListener('keydown', onKey); input.removeEventListener('paste', onPaste); } };
  }
  function wizard(container, steps) {
    var root = container, form = root.tagName === 'FORM' ? root : (root.querySelector('form') || root), defs = steps || [], idx = 0, cbs = [];
    function stepNodes(step) {
      var out = [], seen = [], i, j, nodes, node;
      if (!step) return out;
      if (step.id && root.querySelectorAll) {
        nodes = arr(root.querySelectorAll('[data-step="' + step.id + '"]'));
        if (nodes.length) return nodes;
      }
      for (i = 0; i < (step.fields || []).length; i++) {
        nodes = byName(root, step.fields[i]);
        for (j = 0; j < nodes.length; j++) {
          node = fieldWrap(nodes[j], root);
          if (seen.indexOf(node) === -1) { seen.push(node); out.push(node); }
        }
      }
      return out;
    }
    function show() {
      var i, nodes, j;
      for (i = 0; i < defs.length; i++) {
        nodes = stepNodes(defs[i]);
        for (j = 0; j < nodes.length; j++) nodes[j].style.display = i === idx ? '' : 'none';
      }
      for (i = 0; i < cbs.length; i++) try { cbs[i](defs[idx], idx); } catch (_) {}
    }
    function ok(step) {
      var meta = store.get(form), rules = {}, i;
      if (!step) return true;
      if (typeof step.validate === 'function') return step.validate(serialize(form), step, idx) !== false;
      if (meta && meta.schema && step.fields) {
        for (i = 0; i < step.fields.length; i++) if (meta.schema[step.fields[i]]) rules[step.fields[i]] = meta.schema[step.fields[i]];
        if (Object.keys(rules).length) return validate(form, rules).valid;
      }
      return true;
    }
    show();
    return {
      next: function() { if (idx < defs.length - 1 && ok(defs[idx])) { idx++; show(); } return idx; },
      prev: function() { if (idx > 0) { idx--; show(); } return idx; },
      goTo: function(n) { if (n >= 0 && n < defs.length) { idx = n; show(); } return idx; },
      getCurrentStep: function() { var step = defs[idx] || null, out = {}, k; if (!step) return null; for (k in step) if (own(step, k)) out[k] = step[k]; out.index = idx; return out; },
      isFirst: function() { return idx === 0; },
      isLast: function() { return idx === defs.length - 1; },
      onStep: function(cb) { if (typeof cb === 'function') cbs.push(cb); return this; },
      submit: function() {
        var ev, vals = serialize(form);
        if (form && form.dispatchEvent) {
          try { ev = new Event('submit', { bubbles: true, cancelable: true }); }
          catch (_) { ev = docOf(form).createEvent('Event'); ev.initEvent('submit', true, true); }
          form.dispatchEvent(ev);
        }
        return vals;
      }
    };
  }
  function nodeFrom(html, doc) {
    var host = doc.createElement('div'), wrap = doc.createElement('div');
    host.innerHTML = html;
    if (host.children.length === 1) return host.removeChild(host.firstChild);
    while (host.firstChild) wrap.appendChild(host.firstChild);
    return wrap;
  }
  function closest(el, sel, root) {
    var m = el && (el.matches || el.msMatchesSelector || el.webkitMatchesSelector);
    while (el && el !== root && el.nodeType === 1) {
      if (m && m.call(el, sel)) return el;
      el = el.parentNode;
      m = el && (el.matches || el.msMatchesSelector || el.webkitMatchesSelector);
    }
    return null;
  }
  function resolve(root, ref) {
    var doc = docOf(root);
    if (!ref) return null;
    if (typeof ref === 'string') return (root.querySelector && root.querySelector(ref)) || (doc && doc.querySelector(ref)) || null;
    return ref;
  }
  function repeater(container, opts) {
    var cfg = opts || {}, root = container, doc = docOf(root), addCbs = [], remCbs = [], addBtn = resolve(root, cfg.addBtn), onAdd, onRemove;
    function items() { return arr(root.querySelectorAll('[data-bm-repeat-item]')); }
    function html(data, index) { return typeof cfg.template === 'function' ? cfg.template(data || {}, index) : txt(cfg.template); }
    function add(data) {
      var list = items(), node;
      if (cfg.max != null && list.length >= cfg.max) return null;
      node = nodeFrom(html(data, list.length), doc);
      if (node.getAttribute && node.getAttribute('data-bm-repeat-item') == null) node.setAttribute('data-bm-repeat-item', '');
      root.appendChild(node);
      if (data) deserialize(node, data);
      list = items();
      for (var i = 0; i < addCbs.length; i++) try { addCbs[i](node, data || {}, list.length - 1); } catch (_) {}
      return node;
    }
    function remove(idx) {
      var list = items(), node = list[idx], i;
      if (!node) return false;
      if (cfg.min != null && list.length <= cfg.min) return false;
      node.parentNode.removeChild(node);
      for (i = 0; i < remCbs.length; i++) try { remCbs[i](idx, node); } catch (_) {}
      return true;
    }
    function getAll() {
      var list = items(), out = [], i;
      for (i = 0; i < list.length; i++) out.push(serialize(list[i]));
      return out;
    }
    onAdd = function(ev) {
      if (addBtn && (ev.target === addBtn || (addBtn.contains && addBtn.contains(ev.target)))) {
        ev.preventDefault();
        add();
      }
    };
    onRemove = function(ev) {
      var btn = closest(ev.target, cfg.removeBtn || '[data-remove]', root), row, list;
      if (!btn) return;
      ev.preventDefault();
      row = closest(btn, '[data-bm-repeat-item]', root) || btn.parentNode;
      list = items();
      remove(list.indexOf(row));
    };
    if (addBtn) addBtn.addEventListener('click', onAdd);
    root.addEventListener('click', onRemove);
    while ((cfg.min || 0) > items().length) add();
    return {
      add: add,
      remove: remove,
      getAll: getAll,
      onAdd: function(cb) { if (typeof cb === 'function') addCbs.push(cb); return this; },
      onRemove: function(cb) { if (typeof cb === 'function') remCbs.push(cb); return this; },
      destroy: function() {
        if (addBtn) addBtn.removeEventListener('click', onAdd);
        root.removeEventListener('click', onRemove);
      }
    };
  }
  function safeSave(v) {
    var out, i, k;
    if (isFile(v)) return null;
    if (Array.isArray(v)) {
      out = [];
      for (i = 0; i < v.length; i++) out.push(safeSave(v[i]));
      return out;
    }
    if (isObj(v)) {
      out = {};
      for (k in v) if (own(v, k)) out[k] = safeSave(v[k]);
      return out;
    }
    return v;
  }
  function autosave(form, opts) {
    var cfg = opts || {}, key = cfg.key || ('BareMetal.Forms.' + (form.id || form.name || 'form')), delay = cfg.debounce == null ? 150 : cfg.debounce, bucket = cfg.storage || (typeof localStorage !== 'undefined' ? localStorage : null), t = 0;
    function save() {
      if (!bucket) return;
      try {
        bucket.setItem(key, JSON.stringify(safeSave(serialize(form))));
        if (typeof cfg.onSave === 'function') cfg.onSave(key, serialize(form));
      } catch (_) {}
    }
    function queue() {
      clearTimeout(t);
      t = setTimeout(save, delay);
    }
    form.addEventListener('input', queue);
    form.addEventListener('change', queue);
    return {
      restore: function() {
        var raw, data;
        if (!bucket) return null;
        try { raw = bucket.getItem(key); data = raw ? JSON.parse(raw) : null; } catch (_) { data = null; }
        if (data) deserialize(form, data);
        if (typeof cfg.onRestore === 'function' && data) cfg.onRestore(data);
        return data;
      },
      clear: function() { if (bucket) bucket.removeItem(key); },
      destroy: function() { clearTimeout(t); form.removeEventListener('input', queue); form.removeEventListener('change', queue); }
    };
  }
  function conditional(form, rules) {
    var list = rules || [], on;
    function pass(rule, vals) {
      var when = rule.when || {}, v = vals[when.field];
      if (own(when, 'equals')) return same(v, when.equals);
      if (own(when, 'notEquals')) return !same(v, when.notEquals);
      if (Array.isArray(when.in)) return when.in.indexOf(v) > -1;
      if (own(when, 'truthy')) return !!v === !!when.truthy;
      return !!v;
    }
    function apply() {
      var vals = serialize(form), wanted = {}, show = {}, i, j, els, wrap, key;
      for (i = 0; i < list.length; i++) {
        for (j = 0; j < (list[i].show || []).length; j++) wanted[list[i].show[j]] = 1;
        if (pass(list[i], vals)) for (j = 0; j < (list[i].show || []).length; j++) show[list[i].show[j]] = 1;
      }
      for (key in wanted) if (own(wanted, key)) {
        els = byName(form, key);
        for (j = 0; j < els.length; j++) {
          wrap = fieldWrap(els[j], form);
          wrap.style.display = show[key] ? '' : 'none';
          wrap.setAttribute('aria-hidden', show[key] ? 'false' : 'true');
        }
      }
    }
    on = function() { apply(); };
    form.addEventListener('input', on);
    form.addEventListener('change', on);
    apply();
    return {
      destroy: function() {
        var i, j, els, wrap;
        form.removeEventListener('input', on);
        form.removeEventListener('change', on);
        for (i = 0; i < list.length; i++) for (j = 0; j < (list[i].show || []).length; j++) {
          els = byName(form, list[i].show[j]);
          for (var x = 0; x < els.length; x++) {
            wrap = fieldWrap(els[x], form);
            wrap.style.display = '';
            wrap.removeAttribute('aria-hidden');
          }
        }
      }
    };
  }
  function submit(form, handler, opts) {
    var cfg = opts || {}, pending = false, on;
    function errBox() { return resolve(form, cfg.errorContainer); }
    function mark(errors) {
      var k, i, box = errBox(), lines = [], list;
      names(form).forEach(function(el) { el.removeAttribute('aria-invalid'); });
      for (k in errors) if (own(errors, k)) {
        list = byName(form, k);
        for (i = 0; i < list.length; i++) list[i].setAttribute('aria-invalid', 'true');
        lines.push(errors[k].join(' '));
      }
      if (box) box.innerHTML = lines.join('<br>');
    }
    function disable(onOff) {
      var list = arr(form.querySelectorAll('button,input,select,textarea')), i;
      if (!cfg.disableOnSubmit) return;
      for (i = 0; i < list.length; i++) list[i].disabled = !!onOff;
    }
    on = function(ev) {
      var meta = store.get(form), res = meta && meta.schema ? validate(form, meta.schema) : { valid: true, errors: {} }, box = errBox();
      if (ev && ev.preventDefault) ev.preventDefault();
      if (pending) return;
      if (!res.valid) { mark(res.errors); return; }
      if (box) box.innerHTML = '';
      pending = true;
      if (cfg.loadingClass && form.classList) form.classList.add(cfg.loadingClass);
      disable(true);
      Promise.resolve(typeof handler === 'function' ? handler(serialize(form)) : serialize(form)).then(function(result) {
        pending = false;
        disable(false);
        if (cfg.loadingClass && form.classList) form.classList.remove(cfg.loadingClass);
        if (cfg.resetOnSuccess) {
          if (form.reset) form.reset();
          ensure(form).initial = clone(serialize(form));
          ensure(form).touched = {};
        }
        return result;
      }, function(err) {
        pending = false;
        disable(false);
        if (cfg.loadingClass && form.classList) form.classList.remove(cfg.loadingClass);
        if (box) box.textContent = err && err.message ? err.message : txt(err);
      });
    };
    form.addEventListener('submit', on);
    return { destroy: function() { form.removeEventListener('submit', on); } };
  }
  function optionEl(doc, data) {
    var opt = doc.createElement('option');
    if (isObj(data)) {
      opt.value = data.value == null ? '' : data.value;
      opt.textContent = data.label == null ? txt(data.value) : data.label;
      if (data.selected) opt.selected = true;
    } else {
      opt.value = data;
      opt.textContent = data;
    }
    return opt;
  }
  function buildField(doc, field) {
    var wrap = doc.createElement('div'), label, input, i, opt, box, group;
    wrap.className = 'bm-field';
    wrap.setAttribute('data-field', field.name || '');
    if (field.type === 'radio' && field.options) {
      input = doc.createElement('fieldset');
      label = doc.createElement('legend');
      label.textContent = field.label || nice(field.name);
      input.appendChild(label);
      for (i = 0; i < field.options.length; i++) {
        box = doc.createElement('label');
        opt = doc.createElement('input');
        opt.type = 'radio';
        opt.name = field.name;
        opt.value = isObj(field.options[i]) ? field.options[i].value : field.options[i];
        if (isObj(field.options[i]) && field.options[i].checked) opt.checked = true;
        box.appendChild(opt);
        box.appendChild(doc.createTextNode(' ' + (isObj(field.options[i]) ? field.options[i].label : field.options[i])));
        input.appendChild(box);
      }
      wrap.appendChild(input);
      return wrap;
    }
    if (field.type === 'checkbox' && field.options) {
      input = doc.createElement('fieldset');
      label = doc.createElement('legend');
      label.textContent = field.label || nice(field.name);
      input.appendChild(label);
      for (i = 0; i < field.options.length; i++) {
        group = doc.createElement('label');
        opt = doc.createElement('input');
        opt.type = 'checkbox';
        opt.name = field.name;
        opt.value = isObj(field.options[i]) ? field.options[i].value : field.options[i];
        if (isObj(field.options[i]) && field.options[i].checked) opt.checked = true;
        group.appendChild(opt);
        group.appendChild(doc.createTextNode(' ' + (isObj(field.options[i]) ? field.options[i].label : field.options[i])));
        input.appendChild(group);
      }
      wrap.appendChild(input);
      return wrap;
    }
    if (field.type === 'checkbox') {
      label = doc.createElement('label');
      input = doc.createElement('input');
      input.type = 'checkbox';
      input.name = field.name;
      if (field.checked) input.checked = true;
      label.appendChild(input);
      label.appendChild(doc.createTextNode(' ' + (field.label || nice(field.name))));
      wrap.appendChild(label);
      return wrap;
    }
    label = doc.createElement('label');
    label.textContent = field.label || nice(field.name);
    label.setAttribute('for', field.name);
    wrap.appendChild(label);
    if (field.type === 'textarea') input = doc.createElement('textarea');
    else if (field.type === 'select') {
      input = doc.createElement('select');
      if (field.multiple) input.multiple = true;
      for (i = 0; i < (field.options || []).length; i++) input.appendChild(optionEl(doc, field.options[i]));
    } else {
      input = doc.createElement('input');
      input.type = field.type || 'text';
    }
    input.name = field.name;
    input.id = field.name;
    if (field.placeholder != null) input.setAttribute('placeholder', field.placeholder);
    if (field.required) input.required = true;
    if (field.min != null) input.setAttribute('min', field.min);
    if (field.max != null) input.setAttribute('max', field.max);
    if (field.pattern != null && typeof field.pattern === 'string') input.setAttribute('pattern', field.pattern);
    if (field.value != null) {
      if (field.type === 'textarea') input.value = field.value;
      else input.value = field.value;
    }
    wrap.appendChild(input);
    return wrap;
  }
  function fromJSON(container, schema) {
    var doc = docOf(container), form = container.tagName === 'FORM' ? container : doc.createElement('form'), defs = schema && schema.fields ? schema.fields : [], rules = {}, i, inst;
    form.innerHTML = '';
    form.className = 'bm-form bm-form-' + (schema && schema.layout ? schema.layout : 'vertical');
    form.setAttribute('data-layout', schema && schema.layout ? schema.layout : 'vertical');
    for (i = 0; i < defs.length; i++) {
      form.appendChild(buildField(doc, defs[i]));
      rules[defs[i].name] = defs[i];
    }
    if (form !== container) {
      container.innerHTML = '';
      container.appendChild(form);
    }
    inst = create(form, { fields: rules });
    inst.form = form;
    return inst;
  }
  function focus(form, opts) {
    var cfg = opts || {}, onKey, onSubmit;
    function focusables() {
      return arr(form.querySelectorAll('input,select,textarea,button,[tabindex],a[href]')).filter(function(el) {
        return !el.disabled && el.tabIndex !== -1 && el.offsetParent !== null;
      });
    }
    onSubmit = function() {
      if (cfg.firstInvalid === false) return;
      setTimeout(function() {
        var meta = store.get(form), res = meta && meta.schema ? validate(form, meta.schema) : { valid: true, errors: {} }, key, list;
        if (res.valid) return;
        for (key in res.errors) if (own(res.errors, key)) {
          list = byName(form, key);
          if (list[0] && list[0].focus) { list[0].focus(); break; }
        }
      }, 0);
    };
    onKey = function(ev) {
      var list, idx;
      if (!ev) return;
      if ((cfg.nextOnEnter !== false) && ev.key === 'Enter' && !ev.shiftKey && ev.target && !/^(TEXTAREA|BUTTON)$/.test(ev.target.tagName) && kind(ev.target) !== 'submit') {
        list = focusables(); idx = list.indexOf(ev.target);
        if (idx > -1 && list[idx + 1]) {
          ev.preventDefault();
          list[idx + 1].focus();
        }
      }
      if (cfg.tabTrap && ev.key === 'Tab') {
        list = focusables();
        if (!list.length) return;
        if (ev.shiftKey && ev.target === list[0]) { ev.preventDefault(); list[list.length - 1].focus(); }
        else if (!ev.shiftKey && ev.target === list[list.length - 1]) { ev.preventDefault(); list[0].focus(); }
      }
    };
    form.addEventListener('submit', onSubmit);
    form.addEventListener('keydown', onKey);
    return { destroy: function() { form.removeEventListener('submit', onSubmit); form.removeEventListener('keydown', onKey); } };
  }

  return {
    create: create,
    getState: getState,
    serialize: serialize,
    deserialize: deserialize,
    validate: validate,
    mask: mask,
    wizard: wizard,
    repeater: repeater,
    autosave: autosave,
    conditional: conditional,
    submit: submit,
    fromJSON: fromJSON,
    toFormData: toFormData,
    diff: diff,
    focus: focus
  };
})();
if(typeof module!=='undefined') module.exports = BareMetal.Forms;
