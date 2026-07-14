/* istanbul ignore next */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Workflow = (function() {
  'use strict';

  var workflows = {};
  var stepHooks = [];
  var errorHooks = [];
  var completeHooks = [];
  var meta = [
    { type: 'SET', params: ['name', 'value', 'expr'], description: 'Set a variable' },
    { type: 'IF', params: ['condition'], description: 'Conditional branch start' },
    { type: 'ELSE', params: [], description: 'Conditional else branch' },
    { type: 'END', params: [], description: 'Block terminator' },
    { type: 'FOR', params: ['var', 'from', 'to', 'step'], description: 'Counted loop' },
    { type: 'FOREACH', params: ['var', 'in'], description: 'Sequential array loop' },
    { type: 'FOREACHP', params: ['var', 'in', 'concurrency'], description: 'Parallel array loop' },
    { type: 'LOAD', params: ['name', 'from', 'key', 'url'], description: 'Load data' },
    { type: 'SAVE', params: ['name', 'to', 'key'], description: 'Save data' },
    { type: 'WEB', params: ['method', 'url', 'body', 'headers', 'result'], description: 'HTTP request' },
    { type: 'LOG', params: ['level', 'message'], description: 'Write to console' },
    { type: 'WAIT', params: ['ms'], description: 'Pause execution' },
    { type: 'RAISE', params: ['event', 'target', 'result'], description: 'Emit/raise an event' },
    { type: 'ON', params: ['event', 'var'], description: 'Subscribe: handle a raised event (block, closed by END)' },
    { type: 'CALL', params: ['workflow', 'args'], description: 'Call workflow' }
  ];

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function each(list, payload) {
    var i;
    for (i = 0; i < list.length; i++) {
      try { list[i](payload); } catch (_) {}
    }
  }
  function clone(value) {
    var out;
    var k;
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(clone);
    out = {};
    for (k in value) if (own(value, k)) out[k] = clone(value[k]);
    return out;
  }
  function addHook(list, fn) {
    if (typeof fn !== 'function') return function() {};
    list.push(fn);
    return function() {
      var i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }
  function evaluate(src, context) {
    return Function('context', 'with(context){return (' + src + ')}')(context || {});
  }
  function safeEvaluate(src, context) {
    try { return evaluate(src, context); } catch (_) { return undefined; }
  }
  function interpolate(value, context) {
    var match;
    var out;
    var k;
    if (typeof value === 'string') {
      match = value.match(/^\$\{([\s\S]+)\}$/);
      if (match) return safeEvaluate(match[1], context);
      return value.replace(/\$\{([^}]+)\}/g, function(_, expr) {
        var result = safeEvaluate(expr, context);
        return result == null ? '' : String(result);
      });
    }
    if (Array.isArray(value)) return value.map(function(item) { return interpolate(item, context); });
    if (value && typeof value === 'object') {
      out = {};
      for (k in value) if (own(value, k)) out[k] = interpolate(value[k], context);
      return out;
    }
    return value;
  }
  function computed(value, context) {
    if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (/^\$\{[\s\S]+\}$/.test(value)) return interpolate(value, context);
      return evaluate(value, context);
    }
    return interpolate(value, context);
  }
  function numberValue(value, fallback) {
    value = Number(value);
    return isFinite(value) ? value : fallback;
  }
  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms < 0 ? 0 : ms); });
  }
  function getStorage(name) {
    try {
      if (name === 'localStorage' && typeof localStorage !== 'undefined') return localStorage;
      if (name === 'sessionStorage' && typeof sessionStorage !== 'undefined') return sessionStorage;
    } catch (_) {}
    return null;
  }
  function parseTextJson(text) {
    if (!text) return null;
    try { return JSON.parse(text); } catch (_) { return text; }
  }
  async function readResponse(response) {
    var type = response && response.headers && response.headers.get ? (response.headers.get('content-type') || '') : '';
    var text = await response.text();
    if (!text) return null;
    if (/json/i.test(type)) {
      try { return JSON.parse(text); } catch (_) {}
    }
    return text;
  }
  function blockInfo(steps, index) {
    var depth = 0;
    var elseIndex = -1;
    var i;
    var type;
    for (i = index + 1; i < steps.length; i++) {
      type = String(steps[i] && steps[i].type || '').toUpperCase();
      if (type === 'IF' || type === 'FOR' || type === 'FOREACH' || type === 'FOREACHP' || type === 'ON') depth++;
      else if (type === 'END') {
        if (!depth) return { elseIndex: elseIndex, endIndex: i };
        depth--;
      } else if (type === 'ELSE' && !depth) elseIndex = i;
    }
    return { elseIndex: elseIndex, endIndex: steps.length };
  }
  function workflowSteps(nameOrSteps) {
    if (Array.isArray(nameOrSteps)) return nameOrSteps;
    if (typeof nameOrSteps === 'string' && own(workflows, nameOrSteps)) return workflows[nameOrSteps];
    throw new Error('Workflow not found: ' + nameOrSteps);
  }
  async function doLoad(step, context) {
    var source = step.from;
    var store;
    var key;
    var raw;
    var url;
    if (source === 'localStorage' || source === 'sessionStorage') {
      store = getStorage(source);
      key = String(interpolate(step.key || step.name, context));
      raw = store ? store.getItem(key) : null;
      context[step.name] = raw == null ? null : parseTextJson(raw);
      return;
    }
    if (source === 'json') {
      if (typeof fetch !== 'function') throw new Error('fetch is unavailable');
      url = String(interpolate(step.url || step.key || '', context));
      context[step.name] = await (await fetch(url)).json();
      return;
    }
    if (source === 'variable') {
      context[step.name] = clone(safeEvaluate(step.key || step.var || step.source || '', context));
      return;
    }
    throw new Error('Unknown LOAD source: ' + source);
  }
  async function doSave(step, context) {
    var target = step.to;
    var store;
    var key;
    if (target === 'localStorage' || target === 'sessionStorage') {
      store = getStorage(target);
      if (!store) return;
      key = String(interpolate(step.key || step.name, context));
      store.setItem(key, JSON.stringify(context[step.name]));
      return;
    }
    if (target === 'variable') {
      context[step.key || step.target || step.name] = clone(context[step.name]);
      return;
    }
    throw new Error('Unknown SAVE target: ' + target);
  }
  async function doWeb(step, context) {
    var method = String(step.method || 'GET').toUpperCase();
    var headers = interpolate(step.headers || {}, context) || {};
    var options = { method: method, headers: headers };
    var body = interpolate(step.body, context);
    var response;
    var data;
    if (typeof fetch !== 'function') throw new Error('fetch is unavailable');
    if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
      if (typeof body === 'string' || (typeof FormData !== 'undefined' && body instanceof FormData) || (typeof Blob !== 'undefined' && body instanceof Blob)) options.body = body;
      else {
        if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }
    response = await fetch(String(interpolate(step.url || '', context)), options);
    context._status = response.status;
    context._ok = !!response.ok;
    data = await readResponse(response);
    if (step.result) context[step.result] = data;
    return data;
  }
  async function execSteps(steps, context, start, end, name) {
    var i;
    var step;
    var type;
    var info;
    var ok;
    var from;
    var to;
    var inc;
    var val;
    var list;
    var idx;
    var limit;
    var results;
    var next;
    var workers;
    for (i = start || 0; i < (end == null ? steps.length : end); i++) {
      step = steps[i] || {};
      type = String(step.type || '').toUpperCase();
      each(stepHooks, { step: step, context: context, index: i, name: name || null });
      try {
        if (type === 'SET') {
          context[step.name] = own(step, 'expr') ? evaluate(step.expr, context) : interpolate(step.value, context);
        } else if (type === 'IF') {
          info = blockInfo(steps, i);
          ok = !!evaluate(step.condition || 'false', context);
          if (ok) await execSteps(steps, context, i + 1, info.elseIndex >= 0 ? info.elseIndex : info.endIndex, name);
          else if (info.elseIndex >= 0) await execSteps(steps, context, info.elseIndex + 1, info.endIndex, name);
          i = info.endIndex;
        } else if (type === 'FOR') {
          info = blockInfo(steps, i);
          from = numberValue(computed(step.from, context), 0);
          to = numberValue(computed(step.to, context), -1);
          inc = numberValue(step.step == null ? 1 : computed(step.step, context), 1);
          if (!inc) throw new Error('FOR step cannot be 0');
          for (val = from; inc > 0 ? val <= to : val >= to; val += inc) {
            context[step.var] = val;
            await execSteps(steps, context, i + 1, info.endIndex, name);
          }
          i = info.endIndex;
        } else if (type === 'FOREACH') {
          info = blockInfo(steps, i);
          list = safeEvaluate(step.in || '', context);
          list = Array.isArray(list) ? list : [];
          for (idx = 0; idx < list.length; idx++) {
            context[step.var] = list[idx];
            context._index = idx;
            await execSteps(steps, context, i + 1, info.endIndex, name);
          }
          i = info.endIndex;
        } else if (type === 'FOREACHP') {
          info = blockInfo(steps, i);
          list = safeEvaluate(step.in || '', context);
          list = Array.isArray(list) ? list : [];
          limit = numberValue(step.concurrency == null ? list.length || 1 : computed(step.concurrency, context), list.length || 1);
          results = new Array(list.length);
          next = 0;
          workers = new Array(Math.max(1, Math.min(limit || list.length || 1, list.length || 1))).fill(0).map(function() {
            return (async function() {
              var local;
              var myIndex;
              while (next < list.length) {
                myIndex = next++;
                local = clone(context);
                local[step.var] = list[myIndex];
                local._index = myIndex;
                await execSteps(steps, local, i + 1, info.endIndex, name);
                results[myIndex] = local;
              }
            })();
          });
          await Promise.all(workers);
          context._results = results;
          i = info.endIndex;
        } else if (type === 'ON' || type === 'SUBSCRIBE') {
          info = blockInfo(steps, i);
          (function(evName, bodyStart, bodyEnd, handlerVar) {
            var bus = BareMetal.PubSub;
            var sub = bus && (bus.subscribe || bus.on);
            if (sub) sub.call(bus, String(evName), function(data) {
              var local = clone(context);
              if (handlerVar) local[handlerVar] = data;
              execSteps(steps, local, bodyStart, bodyEnd, name);
            });
          })(interpolate(step.event, context), i + 1, info.endIndex, step.var);
          i = info.endIndex;
        } else if (type === 'LOAD') {
          await doLoad(step, context);
        } else if (type === 'SAVE') {
          await doSave(step, context);
        } else if (type === 'WEB') {
          await doWeb(step, context);
        } else if (type === 'LOG') {
          var level = step.level && console[step.level] ? step.level : 'log';
          console[level](interpolate(step.message, context));
        } else if (type === 'WAIT') {
          await sleep(numberValue(interpolate(step.ms, context), 0));
        } else if (type === 'RAISE' || type === 'EMIT') {
          var evName = interpolate(step.event, context);
          var evData = step.data !== undefined ? interpolate(step.data, context) : interpolate(step.target, context);
          if (BareMetal.PubSub && typeof BareMetal.PubSub.publish === 'function') BareMetal.PubSub.publish(String(evName), evData);
          else if (BareMetal.PubSub && typeof BareMetal.PubSub.emit === 'function') BareMetal.PubSub.emit(String(evName), evData);
          if (step.result) context[step.result] = evName;
        } else if (type === 'CALL') {
          var args = interpolate(step.args || {}, context);
          var key;
          for (key in args) if (own(args, key)) context[key] = args[key];
          await execute(step.workflow, context, true);
        } else if (type === 'ELSE' || type === 'END' || !type) {
        } else {
          throw new Error('Unknown step type: ' + type);
        }
      } catch (error) {
        if (type === 'WEB') {
          context._ok = false;
          if (context._status == null) context._status = 0;
        }
        each(errorHooks, { step: step, error: error, context: context, index: i, name: name || null });
      }
    }
    return context;
  }
  async function execute(nameOrSteps, initialContext, nested) {
    var name = typeof nameOrSteps === 'string' ? nameOrSteps : null;
    var steps = workflowSteps(nameOrSteps);
    var context = nested ? initialContext : clone(initialContext || {});
    var started = Date.now();
    await execSteps(steps, context, 0, steps.length, name);
    if (!nested) each(completeHooks, { name: name, context: context, duration: Date.now() - started });
    return context;
  }
  function create(name, steps) {
    workflows[name] = Array.isArray(steps) ? clone(steps) : [];
    return get(name);
  }
  function list() { return Object.keys(workflows); }
  function get(name) { return own(workflows, name) ? clone(workflows[name]) : null; }
  function remove(name) {
    var had = own(workflows, name);
    if (had) delete workflows[name];
    return had;
  }
  function toJSON(name) {
    var steps = workflowSteps(name);
    return JSON.stringify(steps, null, 2);
  }
  function fromJSON(name, json) {
    return create(name, JSON.parse(json));
  }
  function describe(step) {
    var type = String(step && step.type || '').toUpperCase();
    if (type === 'SET') return step.name + ' = ' + (own(step, 'expr') ? step.expr : JSON.stringify(step.value));
    if (type === 'IF') return step.condition || '';
    if (type === 'FOR') return step.var + ' = ' + step.from + ' .. ' + step.to + (step.step == null ? '' : ' step ' + step.step);
    if (type === 'FOREACH' || type === 'FOREACHP') return step.var + ' in ' + step.in + (step.concurrency ? ' (' + step.concurrency + ')' : '');
    if (type === 'LOAD') return step.name + ' ← ' + step.from;
    if (type === 'SAVE') return step.name + ' → ' + step.to;
    if (type === 'WEB') return String(step.method || 'GET').toUpperCase() + ' ' + (step.url || '');
    if (type === 'LOG') return step.message || '';
    if (type === 'WAIT') return String(step.ms || 0) + 'ms';
    if (type === 'RAISE' || type === 'EMIT') return String(step.event == null ? '' : step.event) + (step.target != null ? ' -> ' + step.target : '');
    if (type === 'ON' || type === 'SUBSCRIBE') return 'on event ' + String(step.event == null ? '' : step.event);
    if (type === 'CALL') return step.workflow || '';
    return type;
  }
  function emit(el, type, detail) {
    if (!el || !el.dispatchEvent || typeof CustomEvent !== 'function') return;
    try { el.dispatchEvent(new CustomEvent(type, { bubbles: true, detail: detail || {} })); } catch (_) {}
  }
  function applyStyle(el, styles) {
    var key;
    if (!el || !el.style) return;
    for (key in styles) if (own(styles, key)) el.style[key] = styles[key];
  }
  function promptStep(current) {
    var raw;
    if (typeof window === 'undefined' || typeof window.prompt !== 'function') return null;
    raw = window.prompt('Workflow step JSON', JSON.stringify(current || { type: 'SET', name: 'value', value: '' }, null, 2));
    if (raw == null) return null;
    try { return JSON.parse(raw); }
    catch (error) {
      if (typeof window.alert === 'function') window.alert('Invalid JSON: ' + error.message);
      return current || null;
    }
  }
  function designer(container, workflowName) {
    var root;
    var toolbar;
    var stepsEl;
    var addBtn;
    var runBtn;
    var exportBtn;
    var sorter = null;
    var dragIndex = -1;
    var indent = 0;
    if (!container || !container.appendChild || typeof document === 'undefined') return null;
    if (workflowName && !own(workflows, workflowName)) workflows[workflowName] = [];
    root = document.createElement('div');
    toolbar = document.createElement('div');
    stepsEl = document.createElement('div');
    addBtn = document.createElement('button');
    runBtn = document.createElement('button');
    exportBtn = document.createElement('button');
    root.className = 'bm-wf-designer cd';
    toolbar.className = 'bm-wf-toolbar rw';
    stepsEl.className = 'bm-wf-steps';
    addBtn.className = runBtn.className = exportBtn.className = 'bt';
    addBtn.textContent = '+ Add Step';
    runBtn.textContent = 'Run';
    exportBtn.textContent = 'Export JSON';
    toolbar.appendChild(addBtn);
    toolbar.appendChild(runBtn);
    toolbar.appendChild(exportBtn);
    root.appendChild(toolbar);
    root.appendChild(stepsEl);
    container.innerHTML = '';
    container.appendChild(root);
    applyStyle(root, { border: '1px solid #ccc', padding: '8px', borderRadius: '8px', fontFamily: 'sans-serif' });
    applyStyle(toolbar, { display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' });
    applyStyle(stepsEl, { display: 'flex', flexDirection: 'column', gap: '6px' });

    function currentSteps() { return workflowName ? workflows[workflowName] : []; }
    function changed(kind) {
      emit(root, 'bm:workflow-change', { name: workflowName || null, type: kind, steps: clone(currentSteps()) });
    }
    function reorder(order) {
      var steps = currentSteps();
      var next = order.map(function(id) { return steps[+id]; }).filter(function(x) { return x; });
      workflows[workflowName] = next;
      render();
      changed('reorder');
    }
    function bindSortable() {
      if (sorter && sorter.destroy) sorter.destroy();
      sorter = null;
      if (BareMetal.DragDrop && typeof BareMetal.DragDrop.sortable === 'function') {
        sorter = BareMetal.DragDrop.sortable(stepsEl, {
          items: '.bm-wf-step',
          onReorder: function(order) { reorder(order); }
        });
      }
    }
    function render() {
      var steps = currentSteps();
      var i;
      var step;
      var row;
      var badge;
      var detail;
      var editBtn;
      var delBtn;
      indent = 0;
      stepsEl.innerHTML = '';
      for (i = 0; i < steps.length; i++) {
        step = steps[i] || {};
        if (step.type === 'ELSE' || step.type === 'END') indent = Math.max(0, indent - 1);
        row = document.createElement('div');
        badge = document.createElement('span');
        detail = document.createElement('span');
        editBtn = document.createElement('button');
        delBtn = document.createElement('button');
        row.className = 'bm-wf-step bm-wf-indent-' + indent + ' cd';
        row.setAttribute('data-index', i);
        row.setAttribute('data-key', i);
        row.setAttribute('data-type', step.type || '');
        row.draggable = !(BareMetal.DragDrop && typeof BareMetal.DragDrop.sortable === 'function');
        badge.className = 'bm-wf-badge';
        detail.className = 'bm-wf-detail';
        editBtn.className = 'bm-wf-edit bt';
        delBtn.className = 'bm-wf-del bt';
        badge.textContent = step.type || '?';
        detail.textContent = describe(step);
        editBtn.textContent = '✎';
        delBtn.textContent = '×';
        row.appendChild(badge);
        row.appendChild(detail);
        row.appendChild(editBtn);
        row.appendChild(delBtn);
        applyStyle(row, { display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', marginLeft: (indent * 18) + 'px', background: '#fff' });
        applyStyle(badge, { display: 'inline-block', minWidth: '72px', fontWeight: '700', fontSize: '12px', background: '#eef2ff', padding: '2px 6px', borderRadius: '999px' });
        applyStyle(detail, { flex: '1 1 auto', wordBreak: 'break-word' });
        editBtn.onclick = (function(index) { return function() {
          var next = promptStep(currentSteps()[index]);
          if (!next) return;
          currentSteps()[index] = next;
          render();
          changed('edit');
        }; })(i);
        delBtn.onclick = (function(index) { return function() {
          currentSteps().splice(index, 1);
          render();
          changed('remove');
        }; })(i);
        row.addEventListener('dragstart', (function(index) { return function(e) {
          dragIndex = index;
          if (e.dataTransfer) e.dataTransfer.setData('text/plain', String(index));
        }; })(i));
        row.addEventListener('dragover', function(e) { if (e.preventDefault) e.preventDefault(); });
        row.addEventListener('drop', (function(index) { return function(e) {
          var from = dragIndex;
          var item;
          if (e.preventDefault) e.preventDefault();
          if (from < 0 || from === index) return;
          item = currentSteps().splice(from, 1)[0];
          currentSteps().splice(index, 0, item);
          dragIndex = -1;
          render();
          changed('reorder');
        }; })(i));
        stepsEl.appendChild(row);
        if (step.type === 'IF' || step.type === 'FOR' || step.type === 'FOREACH' || step.type === 'FOREACHP' || step.type === 'ON' || step.type === 'ELSE') indent++;
      }
      bindSortable();
    }

    addBtn.onclick = function() {
      var step = promptStep(null);
      if (!step) return;
      currentSteps().push(step);
      render();
      changed('add');
    };
    runBtn.onclick = async function() {
      var result;
      try { result = await run(workflowName, {}); }
      catch (error) { emit(root, 'bm:workflow-error', { name: workflowName || null, error: error }); return; }
      emit(root, 'bm:workflow-run', { name: workflowName || null, context: result });
    };
    exportBtn.onclick = function() {
      var json = workflowName ? toJSON(workflowName) : JSON.stringify(currentSteps(), null, 2);
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).catch(function() {});
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') window.prompt('Workflow JSON', json);
      emit(root, 'bm:workflow-export', { name: workflowName || null, json: json });
    };
    render();
    return {
      element: root,
      refresh: render,
      getSteps: function() { return clone(currentSteps()); },
      destroy: function() { if (sorter && sorter.destroy) sorter.destroy(); if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  async function run(name, initialContext) { return execute(name, initialContext, false); }
  async function exec(steps, initialContext) { return execute(Array.isArray(steps) ? steps : [], initialContext, false); }
  function stepTypes() { return clone(meta); }

  return {
    create: create,
    run: run,
    exec: exec,
    list: list,
    get: get,
    remove: remove,
    onStep: function(fn) { return addHook(stepHooks, fn); },
    onError: function(fn) { return addHook(errorHooks, fn); },
    onComplete: function(fn) { return addHook(completeHooks, fn); },
    toJSON: toJSON,
    fromJSON: fromJSON,
    stepTypes: stepTypes,
    designer: designer
  };
})();
// Designer: the christmas-tree flow-chart workflow canvas (merged from the
// former BareMetal.FlowCanvas module). Renders a flat step list as a centered
// tree of boxes with fan-out branches; drag-drop via BareMetal.DragDrop.
BareMetal.Workflow.Designer = (function () {
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
  var MEM = [{ v: 'memory', t: 'memory' }, { v: 'scratch', t: 'scratch' }, { v: 'field', t: 'field' }, { v: 'request', t: 'request' }];
  var REQFIELDS = [{ v: 'method' }, { v: 'length' }, { v: 'bodylen' }, { v: 'pathlen' }, { v: 'querylen' }, { v: 'sum' }];
  var METHODS = [{ v: 'GET' }, { v: 'POST' }, { v: 'PUT' }, { v: 'DELETE' }, { v: 'PATCH' }];

  // Known enums for designer "intellisense": when a field/condition tests one of
  // these, we offer a type-or-pick dropdown of the options (value = the numeric
  // code the VM sees, label = the human name). See docs/MAP.md.
  var METHOD_ENUM = [
    { code: 1, name: 'GET' }, { code: 2, name: 'POST' }, { code: 3, name: 'PUT' },
    { code: 4, name: 'DELETE' }, { code: 5, name: 'HEAD' }, { code: 6, name: 'PATCH' }, { code: 7, name: 'OPTIONS' }];
  var STATUS_ENUM = [
    { code: 200, name: 'OK' }, { code: 201, name: 'Created' }, { code: 204, name: 'No Content' },
    { code: 301, name: 'Moved' }, { code: 302, name: 'Found' }, { code: 400, name: 'Bad Request' },
    { code: 401, name: 'Unauthorized' }, { code: 403, name: 'Forbidden' }, { code: 404, name: 'Not Found' },
    { code: 409, name: 'Conflict' }, { code: 422, name: 'Unprocessable' }, { code: 429, name: 'Too Many Requests' },
    { code: 500, name: 'Server Error' }, { code: 502, name: 'Bad Gateway' }, { code: 503, name: 'Unavailable' }];
  // A variable becomes a typed enum when it is LOADed from a known request field
  // (today: method). Scanning the (flat) step list gives us the enum vars in play.
  function collectEnumVars(steps) {
    var m = {};
    (steps || []).forEach(function (s) {
      if (s && up(s.type) === 'LOAD' && String(s.from || '').toLowerCase() === 'request'
        && String(s.field || '').toLowerCase() === 'method' && s.name) m[s.name] = 'httpMethod';
    });
    return m;
  }

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
      fields: [{ key: 'condition', label: '', placeholder: 'sum >= 50', width: 200, suggest: 'condition' }] },
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
      { key: 'field', label: 'req', kind: 'select', choices: REQFIELDS },
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
    RESPOND: { label: 'Respond', kind: 'atom', color: '#7ee787', fields: [
      { key: 'status', label: '', placeholder: '200', width: 55, kind: 'num', suggest: 'status' },
      { key: 'contentType', label: '', placeholder: 'application/json', width: 130 },
      { key: 'body', label: 'body', placeholder: '{"ok":true}', width: 150 } ] },
    CALL: { label: 'Call', kind: 'atom', color: '#b0a0ff', fields: [
      { key: 'workflow', label: '', placeholder: 'other', width: 140 } ] }
  };

  // sensible defaults when a fresh box is created
  var DEFAULTS = {
    SET: { name: 'x', value: 0 }, IF: { condition: 'x >= 1' }, FOR: { 'var': 'i', from: 1, to: 5 },
    FOREACH: { 'var': 'item', 'in': 'data' }, FOREACHP: { 'var': 'item', 'in': 'data' }, LOG: { message: 'x' },
    WAIT: { ms: 100 }, RAISE: { event: 1, target: 0 }, ON: { event: 1 }, LOAD: { name: 'x', from: 'memory', key: 0 },
    SAVE: { name: 'x', to: 'memory', key: 0 }, WEB: { method: 'GET', url: '/api' }, CALL: { workflow: 'other' },
    RESPOND: { status: 200, contentType: 'application/json', body: '{"ok":true}' }
  };

  var CSS = [
    '.fc-wrap{--fc-line:#3a4152;--fc-bg:#0c0e14;--fc-panel:#161a24;--fc-muted:#8b93a7;--fc-accent:#667eea;color:#e6e8ef;font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}',
    '.fc-palette{display:flex;flex-wrap:wrap;gap:5px;padding:6px;margin-bottom:8px;background:var(--fc-panel);border:1px solid var(--fc-line);border-radius:8px;}',
    '.fc-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;background:#1d2230;border:1px solid var(--fc-line);color:#cdd3e0;font-size:11.5px;font-weight:600;cursor:grab;user-select:none;transition:transform .08s,border-color .12s;}',
    '.fc-chip:hover{border-color:var(--c,#667eea);transform:translateY(-1px);}',
    '.fc-chip .fc-dot{width:8px;height:8px;border-radius:50%;background:var(--c,#667eea);}',
    '.fc-canvas{background:var(--fc-bg);border:1px solid var(--fc-line);border-radius:10px;padding:16px 12px;min-height:80px;max-height:52vh;overflow:auto;}',
    '.fc-seq{display:flex;flex-direction:column;align-items:center;gap:0;min-height:22px;border-radius:8px;transition:background .12s,box-shadow .12s;}',
    '.fc-seq.fc-empty{min-height:34px;min-width:150px;border:1px dashed var(--fc-line);border-radius:8px;position:relative;}',
    '.fc-seq.fc-empty::after{content:"drop a box here";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--fc-muted);font-size:11px;font-style:italic;pointer-events:none;}',
    '.fc-seq.fc-drop-over{background:rgba(102,126,234,.14);box-shadow:inset 0 0 0 1px var(--fc-accent);}',
    '.fc-node{position:relative;background:var(--fc-panel);border:1px solid var(--fc-line);border-left:3px solid var(--fc-accent);border-radius:8px;margin:0;box-shadow:0 1px 2px rgba(0,0,0,.25);width:max-content;max-width:100%;}',
    '.fc-node+.fc-node{margin-top:22px;}',
    '.fc-node+.fc-node::before{content:"";position:absolute;left:50%;top:-22px;width:2px;height:16px;background:linear-gradient(var(--fc-line),var(--fc-accent));transform:translateX(-50%);}',
    '.fc-node+.fc-node::after{content:"";position:absolute;left:50%;top:-8px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--fc-accent);transform:translateX(-50%);}',
    '.fc-node.fc-dragging{opacity:.4;}',
    '.fc-ghost{border-radius:8px;box-shadow:0 8px 22px rgba(0,0,0,.5);transform:rotate(-1deg);}',
    // block nodes: the head is the box; children fan out below like a flow chart
    '.fc-node.fc-block{background:none;border:none;border-left:none;box-shadow:none;padding:0;display:flex;flex-direction:column;align-items:center;}',
    '.fc-block>.fc-head{background:var(--fc-panel);border:1px solid var(--fc-line);border-left:3px solid var(--fc-accent);border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.25);width:max-content;max-width:100%;}',
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
    // slots fan out horizontally under the block head (christmas-tree branches)
    '.fc-slots{padding:26px 8px 6px 8px;display:flex;flex-direction:row;justify-content:center;align-items:flex-start;gap:30px;position:relative;}',
    '.fc-block>.fc-slots::before{content:"";position:absolute;top:8px;left:50%;transform:translateX(-50%);width:2px;height:12px;background:var(--fc-accent);}',
    '.fc-branch{position:relative;display:flex;flex-direction:column;align-items:center;padding-top:20px;border:none;margin:0;}',
    '.fc-branch::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:2px;height:20px;background:var(--fc-line);}',
    '.fc-branch-label{position:absolute;top:4px;left:50%;transform:translateX(-50%);background:var(--fc-bg);padding:0 6px;color:var(--fc-accent);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;z-index:1;white-space:nowrap;}',
    '.fc-addchild{align-self:center;background:none;border:1px dashed var(--fc-line);border-radius:6px;color:var(--fc-muted);cursor:pointer;font-size:11px;padding:2px 8px;margin-top:14px;}',
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
    var enumVars = {};   // varName -> enum kind, recomputed each render (designer intellisense)
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
    var dlSeq = 0;
    // Build type-or-pick suggestions for a field flagged with `suggest`. Values
    // are what the VM sees (e.g. `method is 2`); labels are the human enum names.
    function suggestOptions(kind) {
      var out = [];
      if (kind === 'status') {
        STATUS_ENUM.forEach(function (s) { out.push({ value: String(s.code), label: s.code + ' ' + s.name }); });
      } else if (kind === 'condition') {
        Object.keys(enumVars).forEach(function (v) {
          if (enumVars[v] === 'httpMethod') {
            METHOD_ENUM.forEach(function (m) { out.push({ value: v + ' is ' + m.code, label: v + ' is ' + m.name }); });
          }
        });
      }
      return out;
    }
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
        if (f.suggest) {
          var opts = suggestOptions(f.suggest);
          if (opts.length) {
            var dl = docObj.createElement('datalist');
            var dlId = 'fc-dl-' + (dlSeq++);
            dl.id = dlId;
            opts.forEach(function (o) {
              var op = docObj.createElement('option'); op.value = o.value;
              if (o.label && o.label !== o.value) op.label = o.label;
              dl.appendChild(op);
            });
            input.setAttribute('list', dlId);
            d.appendChild(dl);
          }
        }
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
      el.className = 'fc-node' + (isBlock(types, node.type) ? ' fc-block' : '');
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
      enumVars = collectEnumVars(serialize(types, roots));
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

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Workflow;
