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
      if (type === 'IF' || type === 'FOR' || type === 'FOREACH' || type === 'FOREACHP') depth++;
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
        if (step.type === 'IF' || step.type === 'FOR' || step.type === 'FOREACH' || step.type === 'FOREACHP' || step.type === 'ELSE') indent++;
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
