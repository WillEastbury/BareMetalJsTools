// BareMetal.FlowCanvas.js — a component-based, drag-and-drop nested flow canvas.
//
// Renders a *flat step list* (the BareMetal.Workflow / WorkflowPico model:
// SET / IF..ELSE..END / FOR..END / FOREACH..END / ON..END / LOG / WAIT / RAISE /
// LOAD / SAVE / WEB / CALL) as a tree of slick boxes with flow connectors between
// them and drop-zones *inside* block boxes, so code lives visually inside loops
// and choices. Think Scratch, minus the jigsaw — every atomic statement is a box,
// block statements are boxes that contain boxes.
//
// Drag-and-drop is powered by BareMetal.DragDrop (draggable + droppable). Nested
// drop-zones are registered innermost-first so the deepest zone under the pointer
// wins (BareMetal.DragDrop.findDrop returns the first-registered matching zone).
//
// Standalone: injects its own CSS once, zero third-party deps. The step model is
// identical to BareMetal.WorkflowPico, so `canvas.getSteps()` compiles directly.
//
//   var fc = BareMetal.FlowCanvas.create(hostEl, {
//     steps: [ {type:'SET',name:'sum',value:0}, ... ],
//     onChange: function (steps) { ... }        // fired on every edit
//   });
//   fc.getSteps();  fc.setSteps(steps);  fc.destroy();
//
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.FlowCanvas = (function () {
  'use strict';

  var VERSION = '1.0.0';
  var CSS_ID = 'bm-flowcanvas-css';
  var seq = 0;
  function uid() { seq += 1; return 'n' + seq + '_' + Math.floor(Math.random() * 1e6); }
  function up(s) { return String(s == null ? '' : s).toUpperCase(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function dd() { return (typeof BareMetal !== 'undefined' && BareMetal.DragDrop) ? BareMetal.DragDrop : null; }

  // ── type schema ─────────────────────────────────────────────────────────────
  // Each descriptor: { label, kind:'atom'|'block', color, slots:[{key,label}],
  //   fields:[{key,label,placeholder,kind:'text'|'num'|'select',choices,get,set}] }
  var MEM = [{ v: 'memory', t: 'memory' }, { v: 'scratch', t: 'scratch' }, { v: 'field', t: 'field' }];
  var METHODS = [{ v: 'GET' }, { v: 'POST' }, { v: 'PUT' }, { v: 'DELETE' }, { v: 'PATCH' }];

  function setValueField() {
    return {
      key: 'value', label: 'value / expr', placeholder: '0 or sum + item', width: 150,
      get: function (p) { return ('expr' in p) ? p.expr : (p.value === undefined ? '' : JSON.stringify(p.value)); },
      set: function (p, raw) {
        var t = String(raw == null ? '' : raw).trim();
        var parsed, ok = false;
        try { parsed = JSON.parse(t); ok = (typeof parsed === 'number' || Array.isArray(parsed)); } catch (e) { ok = false; }
        if (ok) { p.value = parsed; delete p.expr; } else { p.expr = t; delete p.value; }
      }
    };
  }

  var WORKFLOW_TYPES = {
    SET: { label: 'Set', kind: 'atom', color: '#79c0ff', fields: [
      { key: 'name', label: '', placeholder: 'name', width: 90 }, setValueField() ] },
    IF: { label: 'If', kind: 'block', color: '#f0a3ff',
      slots: [{ key: 'then', label: 'then' }, { key: 'else', label: 'else' }],
      fields: [{ key: 'condition', label: '', placeholder: 'sum >= 50', width: 200 }] },
    FOR: { label: 'For', kind: 'block', color: '#ffd866', slots: [{ key: 'body', label: '' }], fields: [
      { key: 'var', label: '', placeholder: 'i', width: 50 },
      { key: 'from', label: 'from', placeholder: '1', width: 60, kind: 'num' },
      { key: 'to', label: 'to', placeholder: '5', width: 60, kind: 'num' } ] },
    FOREACH: { label: 'For each', kind: 'block', color: '#ffd866', slots: [{ key: 'body', label: '' }], fields: [
      { key: 'var', label: '', placeholder: 'item', width: 70 },
      { key: 'in', label: 'in', placeholder: 'data', width: 90 } ] },
    FOREACHP: { label: 'For each (parallel)', kind: 'block', color: '#ffd866', slots: [{ key: 'body', label: '' }], fields: [
      { key: 'var', label: '', placeholder: 'item', width: 70 },
      { key: 'in', label: 'in', placeholder: 'data', width: 90 } ] },
    LOG: { label: 'Log', kind: 'atom', color: '#7ee787', fields: [
      { key: 'message', label: '', placeholder: 'sum', width: 180 } ] },
    WAIT: { label: 'Wait', kind: 'atom', color: '#9aa0ad', fields: [
      { key: 'ms', label: '', placeholder: '100', width: 70, kind: 'num' }, { key: '_ms', label: 'ms', kind: 'static' } ] },
    RAISE: { label: 'Raise', kind: 'atom', color: '#ff9f7f', fields: [
      { key: 'event', label: 'event', placeholder: '1', width: 60, kind: 'num' },
      { key: 'target', label: '→', placeholder: '0', width: 60, kind: 'num' } ] },
    ON: { label: 'On event', kind: 'block', color: '#ff9f7f', slots: [{ key: 'body', label: '' }], fields: [
      { key: 'event', label: '', placeholder: '1', width: 60, kind: 'num' } ] },
    LOAD: { label: 'Load', kind: 'atom', color: '#66e0cc', fields: [
      { key: 'name', label: '', placeholder: 'x', width: 70 },
      { key: 'from', label: 'from', kind: 'select', choices: MEM },
      { key: 'key', label: 'key', placeholder: '0', width: 60, kind: 'num' } ] },
    SAVE: { label: 'Save', kind: 'atom', color: '#66e0cc', fields: [
      { key: 'name', label: '', placeholder: 'x', width: 70 },
      { key: 'to', label: 'to', kind: 'select', choices: MEM },
      { key: 'key', label: 'key', placeholder: '0', width: 60, kind: 'num' } ] },
    WEB: { label: 'Web', kind: 'atom', color: '#a0d0ff', fields: [
      { key: 'method', label: '', kind: 'select', choices: METHODS },
      { key: 'url', label: '', placeholder: '/api', width: 130 },
      { key: 'headers', label: 'headers', placeholder: '{"Accept":"application/json"}', width: 180,
        get: function (p) { return p.headers ? JSON.stringify(p.headers) : ''; },
        set: function (p, raw) {
          var t = String(raw == null ? '' : raw).trim();
          if (!t) { delete p.headers; return; }
          try { var o = JSON.parse(t); if (o && typeof o === 'object' && !Array.isArray(o)) p.headers = o; } catch (e) {}
        } },
      { key: 'result', label: '\u2192', placeholder: 'resp', width: 70 } ] },
    CALL: { label: 'Call', kind: 'atom', color: '#b0a0ff', fields: [
      { key: 'workflow', label: '', placeholder: 'other', width: 140 } ] }
  };

  // sensible defaults when a fresh box is created
  var DEFAULTS = {
    SET: { name: 'x', value: 0 }, IF: { condition: 'x >= 1' }, FOR: { 'var': 'i', from: 1, to: 5 },
    FOREACH: { 'var': 'item', 'in': 'data' }, FOREACHP: { 'var': 'item', 'in': 'data' }, LOG: { message: 'x' },
    WAIT: { ms: 100 }, RAISE: { event: 1, target: 0 }, ON: { event: 1 }, LOAD: { name: 'x', from: 'memory', key: 0 },
    SAVE: { name: 'x', to: 'memory', key: 0 }, WEB: { method: 'GET', url: '/api' }, CALL: { workflow: 'other' }
  };

  var CSS = [
    '.fc-wrap{--fc-line:#3a4152;--fc-bg:#0c0e14;--fc-panel:#161a24;--fc-muted:#8b93a7;--fc-accent:#667eea;color:#e6e8ef;font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}',
    '.fc-palette{display:flex;flex-wrap:wrap;gap:5px;padding:6px;margin-bottom:8px;background:var(--fc-panel);border:1px solid var(--fc-line);border-radius:8px;}',
    '.fc-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;background:#1d2230;border:1px solid var(--fc-line);color:#cdd3e0;font-size:11.5px;font-weight:600;cursor:grab;user-select:none;transition:transform .08s,border-color .12s;}',
    '.fc-chip:hover{border-color:var(--c,#667eea);transform:translateY(-1px);}',
    '.fc-chip .fc-dot{width:8px;height:8px;border-radius:50%;background:var(--c,#667eea);}',
    '.fc-canvas{background:var(--fc-bg);border:1px solid var(--fc-line);border-radius:10px;padding:12px;min-height:80px;}',
    '.fc-seq{display:flex;flex-direction:column;gap:0;min-height:22px;border-radius:8px;transition:background .12s,box-shadow .12s;}',
    '.fc-seq.fc-empty{min-height:34px;border:1px dashed var(--fc-line);border-radius:8px;position:relative;}',
    '.fc-seq.fc-empty::after{content:"drop a box here";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--fc-muted);font-size:11px;font-style:italic;pointer-events:none;}',
    '.fc-seq.fc-drop-over{background:rgba(102,126,234,.14);box-shadow:inset 0 0 0 1px var(--fc-accent);}',
    '.fc-node{position:relative;background:var(--fc-panel);border:1px solid var(--fc-line);border-left:3px solid var(--fc-accent);border-radius:8px;margin:0;box-shadow:0 1px 2px rgba(0,0,0,.25);}',
    '.fc-node+.fc-node{margin-top:20px;}',
    '.fc-node+.fc-node::before{content:"";position:absolute;left:50%;top:-20px;width:2px;height:14px;background:linear-gradient(var(--fc-line),var(--fc-accent));transform:translateX(-50%);}',
    '.fc-node+.fc-node::after{content:"";position:absolute;left:50%;top:-8px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--fc-accent);transform:translateX(-50%);}',
    '.fc-node.fc-dragging{opacity:.4;}',
    '.fc-ghost{border-radius:8px;box-shadow:0 8px 22px rgba(0,0,0,.5);transform:rotate(-1deg);}',
    '.fc-head{display:flex;align-items:center;gap:7px;padding:6px 8px;flex-wrap:wrap;}',
    '.fc-grip{cursor:grab;color:var(--fc-muted);font-size:14px;line-height:1;user-select:none;touch-action:none;}',
    '.fc-grip:active{cursor:grabbing;}',
    '.fc-type{font-weight:700;font-size:11px;letter-spacing:.02em;color:var(--fc-accent);text-transform:uppercase;white-space:nowrap;}',
    '.fc-fields{display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex:1 1 auto;}',
    '.fc-flabel{color:var(--fc-muted);font-size:11px;}',
    '.fc-static{color:var(--fc-muted);font-size:11px;}',
    '.fc-fields input,.fc-fields select{background:#0c0e14;border:1px solid var(--fc-line);border-radius:5px;color:#e6e8ef;font:12px/1.2 "SF Mono",Consolas,monospace;padding:3px 6px;min-width:36px;}',
    '.fc-fields input:focus,.fc-fields select:focus{outline:none;border-color:var(--fc-accent);}',
    '.fc-acts{display:flex;gap:2px;margin-left:auto;}',
    '.fc-acts button{background:none;border:1px solid transparent;border-radius:5px;color:var(--fc-muted);cursor:pointer;font-size:12px;padding:2px 6px;line-height:1;}',
    '.fc-acts button:hover{border-color:var(--fc-line);color:#e6e8ef;background:#1d2230;}',
    '.fc-slots{padding:0 8px 8px 8px;display:flex;flex-direction:column;gap:6px;}',
    '.fc-branch{border-left:2px solid var(--fc-accent);border-radius:0 0 0 6px;padding:2px 0 2px 12px;margin-left:6px;}',
    '.fc-branch-label{color:var(--fc-accent);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin:2px 0 4px;opacity:.85;}',
    '.fc-addchild{align-self:flex-start;background:none;border:1px dashed var(--fc-line);border-radius:6px;color:var(--fc-muted);cursor:pointer;font-size:11px;padding:2px 8px;margin-top:4px;}',
    '.fc-addchild:hover{border-color:var(--fc-accent);color:#e6e8ef;}',
    '.fc-empty-root{color:var(--fc-muted);font-size:12px;font-style:italic;text-align:center;padding:14px;}'
  ].join('');

  function injectCss(docObj) {
    if (!docObj || !docObj.head || docObj.getElementById(CSS_ID)) return;
    var st = docObj.createElement('style');
    st.id = CSS_ID; st.textContent = CSS;
    docObj.head.appendChild(st);
  }

  // ── model: flat step list <-> tree of nodes ─────────────────────────────────
  function typeDesc(types, t) { return types[up(t)] || null; }
  function isBlock(types, t) { var d = typeDesc(types, t); return !!(d && d.kind === 'block'); }
  function slotKeys(types, t) {
    var d = typeDesc(types, t);
    if (!d || d.kind !== 'block') return [];
    return (d.slots || [{ key: 'body', label: '' }]).map(function (s) { return s.key; });
  }

  function makeNode(types, t, props) {
    var type = up(t);
    var node = { id: uid(), type: type, props: {}, slots: {} };
    var src = props || (DEFAULTS[type] ? JSON.parse(JSON.stringify(DEFAULTS[type])) : {});
    Object.keys(src).forEach(function (k) { if (k !== 'type') node.props[k] = src[k]; });
    slotKeys(types, type).forEach(function (k) { node.slots[k] = []; });
    return node;
  }

  function parseTree(types, steps) {
    var i = 0;
    steps = Array.isArray(steps) ? steps : [];
    function cur() { return steps[i] || { type: '' }; }
    function parseSeq() {
      var nodes = [];
      while (i < steps.length) {
        var t = up(cur().type);
        if (t === 'END' || t === 'ELSE') return nodes;
        var raw = steps[i]; i += 1;
        var node = { id: uid(), type: t, props: {}, slots: {} };
        Object.keys(raw).forEach(function (k) { if (k !== 'type') node.props[k] = raw[k]; });
        if (isBlock(types, t)) {
          if (t === 'IF') {
            node.slots.then = parseSeq();
            node.slots['else'] = [];
            if (up(cur().type) === 'ELSE') { i += 1; node.slots['else'] = parseSeq(); }
            if (up(cur().type) === 'END') i += 1;
          } else {
            node.slots.body = parseSeq();
            if (up(cur().type) === 'END') i += 1;
          }
        }
        nodes.push(node);
      }
      return nodes;
    }
    return parseSeq();
  }

  function serialize(types, nodes) {
    var out = [];
    (nodes || []).forEach(function (n) {
      var step = { type: n.type };
      Object.keys(n.props).forEach(function (k) { step[k] = n.props[k]; });
      out.push(step);
      if (isBlock(types, n.type)) {
        if (n.type === 'IF') {
          out = out.concat(serialize(types, n.slots.then || []));
          if ((n.slots['else'] || []).length) { out.push({ type: 'ELSE' }); out = out.concat(serialize(types, n.slots['else'])); }
          out.push({ type: 'END' });
        } else {
          out = out.concat(serialize(types, n.slots.body || []));
          out.push({ type: 'END' });
        }
      }
    });
    return out;
  }

  // ── controller ──────────────────────────────────────────────────────────────
  function create(host, opts) {
    opts = opts || {};
    var docObj = (host && host.ownerDocument) || (typeof document !== 'undefined' ? document : null);
    var types = opts.types || WORKFLOW_TYPES;
    var paletteList = opts.palette || Object.keys(types);
    var roots = parseTree(types, opts.steps || []);
    var handles = [];
    if (docObj) injectCss(docObj);
    if (host) { host.classList.add('fc-wrap'); }

    function emit() {
      var steps = serialize(types, roots);
      if (typeof opts.onChange === 'function') opts.onChange(steps);
      if (host && host.dispatchEvent && typeof CustomEvent !== 'undefined') {
        host.dispatchEvent(new CustomEvent('bm:flow-change', { detail: { steps: steps }, bubbles: true }));
      }
    }

    // tree ops (also the drag/keyboard fallback API)
    function findNode(id, list, parent, slot) {
      list = list || roots;
      for (var i = 0; i < list.length; i++) {
        var n = list[i];
        if (n.id === id) return { node: n, list: list, index: i };
        var keys = Object.keys(n.slots);
        for (var k = 0; k < keys.length; k++) {
          var hit = findNode(id, n.slots[keys[k]]);
          if (hit) return hit;
        }
      }
      return null;
    }
    function detach(id) {
      var hit = findNode(id);
      if (!hit) return null;
      return hit.list.splice(hit.index, 1)[0];
    }
    function slotArray(ownerId, slot) {
      if (!ownerId) return roots;
      var hit = findNode(ownerId);
      if (!hit) return null;
      if (!hit.node.slots[slot]) hit.node.slots[slot] = [];
      return hit.node.slots[slot];
    }
    function isWithin(dragId, ownerId) {
      if (!ownerId) return false;
      if (dragId === ownerId) return true;
      var hit = findNode(dragId);
      if (!hit) return false;
      return !!findNode(ownerId, [hit.node]);
    }

    function addNode(type, ownerId, slot, index) {
      var arr = slotArray(ownerId || null, slot);
      if (!arr) return null;
      var node = makeNode(types, type);
      if (index == null || index > arr.length) index = arr.length;
      arr.splice(index, 0, node);
      render(); emit();
      return node.id;
    }
    function removeNode(id) {
      if (detach(id)) { render(); emit(); }
    }
    function moveNode(id, ownerId, slot, index) {
      if (isWithin(id, ownerId)) return false;    // can't nest a block into itself
      var node = detach(id);
      if (!node) return false;
      var arr = slotArray(ownerId || null, slot);
      if (!arr) { return false; }
      if (index == null || index > arr.length) index = arr.length;
      arr.splice(index, 0, node);
      render(); emit();
      return true;
    }

    // ── rendering ─────────────────────────────────────────────────────────────
    function fieldEl(node, f) {
      var d = docObj.createElement('span');
      d.style.display = 'inline-flex'; d.style.alignItems = 'center'; d.style.gap = '3px';
      if (f.kind === 'static') { d.className = 'fc-static'; d.textContent = f.key === '_ms' ? 'ms' : (f.label || ''); return d; }
      if (f.label) { var lb = docObj.createElement('span'); lb.className = 'fc-flabel'; lb.textContent = f.label; d.appendChild(lb); }
      var val = f.get ? f.get(node.props) : (node.props[f.key] === undefined ? '' : node.props[f.key]);
      var input;
      if (f.kind === 'select') {
        input = docObj.createElement('select');
        (f.choices || []).forEach(function (c) {
          var o = docObj.createElement('option'); o.value = c.v; o.textContent = c.t || c.v;
          if (String(c.v) === String(val)) o.selected = true;
          input.appendChild(o);
        });
      } else {
        input = docObj.createElement('input');
        input.type = 'text';
        input.value = val;
        if (f.placeholder) input.placeholder = f.placeholder;
        if (f.width) input.style.width = f.width + 'px';
      }
      function apply() {
        var raw = input.value;
        if (f.set) f.set(node.props, raw);
        else if (f.kind === 'num') { var num = Number(raw); node.props[f.key] = (raw !== '' && !isNaN(num)) ? num : raw; }
        else node.props[f.key] = raw;
        emit();
      }
      input.addEventListener('change', apply);
      input.addEventListener('input', function () { if (f.kind !== 'select') apply(); });
      // keep pointerdown on inputs from bubbling to a drag start
      input.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      d.appendChild(input);
      return d;
    }

    function nodeEl(node) {
      var desc = typeDesc(types, node.type) || { label: node.type, color: '#667eea', fields: [] };
      var el = docObj.createElement('div');
      el.className = 'fc-node';
      el.setAttribute('data-id', node.id);
      el.setAttribute('data-type', node.type);
      el.style.setProperty('--fc-accent', desc.color || '#667eea');

      var head = docObj.createElement('div'); head.className = 'fc-head';
      var grip = docObj.createElement('span'); grip.className = 'fc-grip'; grip.textContent = '\u2807'; grip.title = 'drag to move';
      var ty = docObj.createElement('span'); ty.className = 'fc-type'; ty.textContent = desc.label || node.type;
      var fields = docObj.createElement('span'); fields.className = 'fc-fields';
      (desc.fields || []).forEach(function (f) { fields.appendChild(fieldEl(node, f)); });
      var acts = docObj.createElement('span'); acts.className = 'fc-acts';
      var del = docObj.createElement('button'); del.textContent = '\u2715'; del.title = 'delete';
      del.addEventListener('click', function (e) { e.preventDefault(); removeNode(node.id); });
      acts.appendChild(del);
      head.appendChild(grip); head.appendChild(ty); head.appendChild(fields); head.appendChild(acts);
      el.appendChild(head);

      if (isBlock(types, node.type)) {
        var slots = docObj.createElement('div'); slots.className = 'fc-slots';
        var slotDefs = (desc.slots || [{ key: 'body', label: '' }]);
        slotDefs.forEach(function (sd) {
          var branch = docObj.createElement('div'); branch.className = 'fc-branch';
          if (sd.label) { var bl = docObj.createElement('div'); bl.className = 'fc-branch-label'; bl.textContent = sd.label; branch.appendChild(bl); }
          branch.appendChild(seqEl(node.slots[sd.key] || [], node.id, sd.key));
          var addc = docObj.createElement('button'); addc.className = 'fc-addchild'; addc.textContent = '+ box';
          addc.addEventListener('click', function (e) { e.preventDefault(); addNode('SET', node.id, sd.key); });
          branch.appendChild(addc);
          slots.appendChild(branch);
        });
        el.appendChild(slots);
      }
      el.__grip = grip;
      return el;
    }

    function seqEl(list, ownerId, slot) {
      var s = docObj.createElement('div');
      s.className = 'fc-seq' + (list.length ? '' : ' fc-empty');
      if (ownerId) { s.setAttribute('data-owner', ownerId); s.setAttribute('data-slot', slot); }
      else s.setAttribute('data-root', '1');
      list.forEach(function (n) { s.appendChild(nodeEl(n)); });
      return s;
    }

    function clearHandles() { handles.forEach(function (h) { try { h.destroy(); } catch (e) {} }); handles = []; }

    function seqNodeEls(seqEl2, exceptId) {
      return Array.prototype.filter.call(seqEl2.children, function (c) {
        return c.classList && c.classList.contains('fc-node') && c.getAttribute('data-id') !== exceptId;
      });
    }
    function dropIndex(seqEl2, y, exceptId) {
      var kids = seqNodeEls(seqEl2, exceptId);
      for (var i = 0; i < kids.length; i++) {
        var r = kids[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) return i;
      }
      return kids.length;
    }

    function wireDnD() {
      var D = dd();
      if (!D || !host) return;
      // droppables: register innermost-first so nested zones win in findDrop
      var seqs = Array.prototype.slice.call(host.querySelectorAll('.fc-seq'));
      seqs.reverse().forEach(function (sEl) {
        var ownerId = sEl.getAttribute('data-owner') || null;
        var slot = sEl.getAttribute('data-slot') || null;
        handles.push(D.droppable(sEl, {
          overClass: 'fc-drop-over',
          accept: function (data) {
            if (!data) return false;
            if (data.newType) return true;
            return !isWithin(data.id, ownerId);
          },
          onDrop: function (data, source, target, e) {
            var y = (e && e.clientY != null) ? e.clientY : 0;
            if (data && data.newType) {
              addNode(data.newType, ownerId, slot, dropIndex(sEl, y, null));
            } else if (data && data.id) {
              moveNode(data.id, ownerId, slot, dropIndex(sEl, y, data.id));
            }
          }
        }));
      });
      // draggables: node grips
      Array.prototype.slice.call(host.querySelectorAll('.fc-node')).forEach(function (nEl) {
        handles.push(D.draggable(nEl, {
          handle: '.fc-grip', ghostClass: 'fc-ghost', dragClass: 'fc-dragging',
          data: function () { return { id: nEl.getAttribute('data-id') }; }
        }));
      });
      // palette chips create new boxes
      if (host.__palette) {
        Array.prototype.slice.call(host.__palette.querySelectorAll('.fc-chip')).forEach(function (chip) {
          handles.push(D.draggable(chip, {
            ghostClass: 'fc-ghost',
            data: { newType: chip.getAttribute('data-type') }
          }));
        });
      }
    }

    function renderPalette() {
      var pal = docObj.createElement('div'); pal.className = 'fc-palette';
      paletteList.forEach(function (t) {
        var desc = typeDesc(types, t) || { label: t, color: '#667eea' };
        var chip = docObj.createElement('span'); chip.className = 'fc-chip';
        chip.setAttribute('data-type', up(t));
        chip.style.setProperty('--c', desc.color || '#667eea');
        var dot = docObj.createElement('span'); dot.className = 'fc-dot';
        chip.appendChild(dot);
        chip.appendChild(docObj.createTextNode(desc.label || t));
        chip.title = 'drag onto the canvas, or click to append';
        chip.addEventListener('click', function () { addNode(up(t), null, null, roots.length); });
        pal.appendChild(chip);
      });
      return pal;
    }

    function render() {
      if (!host) return;
      clearHandles();
      host.innerHTML = '';
      var pal = renderPalette();
      host.appendChild(pal); host.__palette = pal;
      var canvas = docObj.createElement('div'); canvas.className = 'fc-canvas';
      if (!roots.length) {
        var empty = docObj.createElement('div'); empty.className = 'fc-empty-root';
        empty.textContent = 'Empty flow — drag a box from the palette, or click one to add it.';
        canvas.appendChild(empty);
        var rootSeq0 = seqEl([], null, null);
        canvas.appendChild(rootSeq0);
      } else {
        canvas.appendChild(seqEl(roots, null, null));
      }
      host.appendChild(canvas);
      wireDnD();
    }

    function setSteps(steps) { roots = parseTree(types, steps || []); render(); }
    function getSteps() { return serialize(types, roots); }
    function destroy() { clearHandles(); if (host) host.innerHTML = ''; }

    render();
    return {
      element: host, getSteps: getSteps, setSteps: setSteps, render: render, destroy: destroy,
      addNode: addNode, removeNode: removeNode, moveNode: moveNode
    };
  }

  return {
    VERSION: VERSION,
    create: create,
    mount: create,
    parseTree: function (steps, types) { return parseTree(types || WORKFLOW_TYPES, steps); },
    serialize: function (nodes, types) { return serialize(types || WORKFLOW_TYPES, nodes); },
    WORKFLOW_TYPES: WORKFLOW_TYPES
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.FlowCanvas;
