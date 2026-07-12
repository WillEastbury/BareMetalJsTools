// BareMetal.WorkflowPico.js — compile BareMetal.Workflow step lists into
// PicoScript (English dialect) so the visual workflow designer becomes a
// PicoScript frontend. The emitted source runs on any PicoScript VM
// (BareMetal.PicoScript in the browser, the RP2350/PIOS VM, or the C# VM in
// developercli/workflow/PicoVm.cs).
//
// Cross-language contract (kept in sync with developercli/workflow):
//   • Target dialect: PicoScript ENGLISH, word-form operators (plus, minus,
//     times, divided by, modulo, is / is not, is greater than, ...), matching
//     developercli/workflow/test/oracle.js which is the differential oracle.
//   • Data ABI: field/scratch values via Context.GetScratchValue(key) /
//     Context.SetScratchValue(key,value) (hooks 0xeb/0xea); array/general
//     memory via Memory.Get(addr) / Memory.Set(addr,value) (hooks 0x37/0x36).
//     These hook codes are identical in BareMetal.PicoScript and the C#
//     WorkflowHost, so compiled workflows run bit-identically on both VMs.
//   • Arrays: an array is a base address + length in Memory; elements live at
//     consecutive addresses; FOREACH iterates values via Memory.Get(base+i).
//
// The VM is a deterministic 32-bit integer machine. Arithmetic/control-flow and
// integer arrays lower faithfully; genuinely host-side steps (WEB, HTTP/JSON
// LOAD, localStorage SAVE, CALL) lower to host-hook calls or annotated comments
// and are reported through the returned `warnings` array.
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.WorkflowPico = (() => {
  'use strict';

  var VERSION = '1.1.0';
  var UNIT = '    ';
  var DEFAULT_ARRAY_BASE = 8192; // 0x2000 — well above workflow scratch/field keys
  var hasOwn = Object.prototype.hasOwnProperty;

  function own(o, k) { return o != null && hasOwn.call(o, k); }
  function pad(n) { var s = ''; for (var i = 0; i < n; i++) s += UNIT; return s; }

  // ── identifiers ────────────────────────────────────────────────────────────
  function sanitizeId(name) {
    var s = String(name == null ? '' : name).replace(/[^A-Za-z0-9_]/g, '_');
    if (!s) s = '_v';
    if (/^[0-9]/.test(s)) s = '_' + s;
    return s;
  }

  // ── expression translation (JS-ish subset → English word operators) ─────────
  var BINARY_WORD = {
    '==': 'is', '===': 'is', '!=': 'is not', '!==': 'is not',
    '>=': 'is at least', '<=': 'is at most',
    '>': 'is greater than', '<': 'is less than',
    '&&': 'and', '||': 'or',
    '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by', '%': 'modulo'
  };

  function tokenizeExpr(s) {
    var toks = [];
    var i = 0;
    var n = s.length;
    while (i < n) {
      var c = s.charAt(i);
      if (/\s/.test(c)) { i++; continue; }
      if (c === '"' || c === "'") {
        var q = c;
        var j = i + 1;
        var str = c;
        while (j < n) {
          var d = s.charAt(j);
          str += d;
          if (d === '\\' && j + 1 < n) { str += s.charAt(j + 1); j += 2; continue; }
          if (d === q) { j++; break; }
          j++;
        }
        toks.push({ type: 'str', value: str }); i = j; continue;
      }
      if (/[0-9]/.test(c)) {
        var jn = i;
        while (jn < n && /[0-9.]/.test(s.charAt(jn))) jn++;
        toks.push({ type: 'num', value: s.slice(i, jn) }); i = jn; continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        var ji = i;
        while (ji < n && /[A-Za-z0-9_$]/.test(s.charAt(ji))) ji++;
        toks.push({ type: 'id', value: s.slice(i, ji) }); i = ji; continue;
      }
      var three = s.substr(i, 3);
      if (three === '===' || three === '!==') { toks.push({ type: 'op', value: three }); i += 3; continue; }
      var two = s.substr(i, 2);
      if (two === '==' || two === '!=' || two === '>=' || two === '<=' || two === '&&' || two === '||') {
        toks.push({ type: 'op', value: two }); i += 2; continue;
      }
      if ('+-*/%<>!'.indexOf(c) >= 0) { toks.push({ type: 'op', value: c }); i++; continue; }
      toks.push({ type: 'punct', value: c }); i++;
    }
    return toks;
  }

  function translateExpr(src) {
    var toks = tokenizeExpr(String(src == null ? '' : src));
    var parts = [];
    var prevValue = false;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.type === 'op') {
        if ((t.value === '-' || t.value === '+') && !prevValue) {
          if (t.value === '-') { parts.push('0'); parts.push('minus'); } // unary minus
          prevValue = false;
        } else if (t.value === '!' && !prevValue) {
          parts.push('not'); prevValue = false;
        } else {
          parts.push(own(BINARY_WORD, t.value) ? BINARY_WORD[t.value] : t.value);
          prevValue = false;
        }
      } else if (t.type === 'id') {
        parts.push(sanitizeId(t.value)); prevValue = true;
      } else if (t.type === 'num' || t.type === 'str') {
        parts.push(t.value); prevValue = true;
      } else {
        parts.push(t.value);
        prevValue = (t.value === ')');
      }
    }
    return parts.join(' ')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\s+,/g, ',')
      .replace(/\s*\.\s*/g, '.')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── literals ────────────────────────────────────────────────────────────────
  function numLit(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '0';
    n = Math.trunc(n);
    return n < 0 ? '(0 minus ' + Math.abs(n) + ')' : String(n);
  }

  function quoteStr(s) {
    return '"' + String(s)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t') + '"';
  }

  function emitScalar(value, warnings, label) {
    if (value === null || value === undefined) return '0';
    if (typeof value === 'number') return numLit(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string') return emitStringValue(value, warnings, label);
    warnings.push(label + ': non-scalar value is not representable on the integer VM; emitted 0');
    return '0';
  }

  function emitStringValue(v, warnings, label) {
    var exact = /^\$\{([\s\S]+)\}$/.exec(v);
    if (exact) return '(' + translateExpr(exact[1]) + ')';
    var trimmed = v.trim();
    if (/^-?\d+$/.test(trimmed)) return numLit(parseInt(trimmed, 10));
    if (/\$\{[\s\S]*\}/.test(v)) {
      warnings.push(label + ': string interpolation ' + JSON.stringify(v) + ' is not representable; emitted quoted literal');
    }
    return quoteStr(v);
  }

  function emitOperand(value, warnings, label) {
    if (typeof value === 'number') return numLit(value);
    if (typeof value === 'string') {
      var t = value.trim();
      if (/^-?\d+$/.test(t)) return numLit(parseInt(t, 10));
      return translateExpr(value);
    }
    return emitScalar(value, warnings, label);
  }

  function literalArray(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      var t = v.trim();
      if (t.charAt(0) === '[') { try { var a = JSON.parse(t); if (Array.isArray(a)) return a; } catch (_) {} }
    }
    return null;
  }

  // ── array allocation ─────────────────────────────────────────────────────────
  function allocArray(ctx, len) {
    var base = ctx.memNext;
    ctx.memNext += Math.max(1, len);
    return base;
  }

  // Materialise an array literal into consecutive Memory cells; returns {base,len}.
  function materializeArray(ctx, indent, values, label) {
    var base = allocArray(ctx, values.length);
    for (var k = 0; k < values.length; k++) {
      ctx.out.push(pad(indent) + 'Memory.Set(' + (base + k) + ', ' + emitScalar(values[k], ctx.warnings, label + '[' + k + ']') + ').');
    }
    return { base: base, len: values.length };
  }

  // ── recursive lowering ──────────────────────────────────────────────────────
  function emitSeq(steps, pos, indent, ctx) {
    while (pos.i < steps.length) {
      var step = steps[pos.i] || {};
      var type = String(step.type || '').toUpperCase();
      if (type === 'END') { pos.i++; return 'END'; }
      if (type === 'ELSE') return 'ELSE';
      pos.i++;
      emitStep(step, type, steps, pos, indent, ctx);
    }
    return 'EOF';
  }

  function emitBody(steps, pos, indent, ctx) {
    var start = ctx.out.length;
    var term = emitSeq(steps, pos, indent, ctx);
    if (ctx.out.length === start) ctx.out.push(pad(indent) + 'Set _nop to 0.');
    return term;
  }

  function closeLoop(steps, pos, indent, ctx) {
    var term = emitBody(steps, pos, indent + 1, ctx);
    if (term === 'ELSE') { pos.i++; ctx.warnings.push('ELSE without a matching IF; ignored'); }
  }

  function emitStep(step, type, steps, pos, indent, ctx) {
    var out = ctx.out;
    var warnings = ctx.warnings;
    var line;
    switch (type) {
      case 'SET':
        emitSet(step, indent, ctx);
        break;

      case 'IF':
        out.push(pad(indent) + 'If ' + translateExpr(step.condition || 'false') + ':');
        var term = emitBody(steps, pos, indent + 1, ctx);
        if (term === 'ELSE') {
          pos.i++;
          out.push(pad(indent) + 'Otherwise:');
          term = emitBody(steps, pos, indent + 1, ctx);
        }
        if (term === 'ELSE') { pos.i++; warnings.push('IF: multiple ELSE branches; extra ELSE ignored'); }
        break;

      case 'FOR':
        var v = sanitizeId(step.var || 'i');
        line = pad(indent) + 'For each ' + v +
          ' from ' + emitOperand(step.from, warnings, 'FOR from') +
          ' to ' + emitOperand(step.to, warnings, 'FOR to');
        if (step.step != null) line += ' by ' + emitOperand(step.step, warnings, 'FOR step');
        out.push(line + ':');
        closeLoop(steps, pos, indent, ctx);
        break;

      case 'FOREACH':
      case 'FOREACHP':
        emitForeach(step, type, steps, pos, indent, ctx);
        break;

      case 'LOG':
        emitLog(step, indent, ctx);
        break;

      case 'WAIT':
        out.push(pad(indent) + 'Timer.After(' + emitOperand(step.ms == null ? 0 : step.ms, warnings, 'WAIT ms') + ').');
        warnings.push('WAIT: Timer.After schedules but does not block the VM');
        break;

      case 'RAISE':
      case 'EMIT':
        var ev = emitOperand(step.event == null ? 0 : step.event, warnings, 'RAISE event');
        var tgt = step.target != null ? emitOperand(step.target, warnings, 'RAISE target') : '0';
        var call = 'Event.Post(' + ev + ', ' + tgt + ')';
        if (step.result) out.push(pad(indent) + 'Set ' + sanitizeId(step.result) + ' to ' + call + '.');
        else out.push(pad(indent) + call + '.');
        break;

      case 'LOAD':
        emitLoad(step, indent, ctx);
        break;

      case 'SAVE':
        emitSave(step, indent, ctx);
        break;

      case 'WEB':
        out.push(pad(indent) + '# WEB ' + String(step.method || 'GET').toUpperCase() + ' ' + (step.url || '') +
          (step.result ? ' -> ' + step.result : ''));
        warnings.push('WEB: HTTP requests require a host transport hook and are not executed by the integer VM');
        break;

      case 'CALL':
        out.push(pad(indent) + '# CALL ' + (step.workflow || ''));
        warnings.push('CALL: nested workflow ' + JSON.stringify(step.workflow || '') + ' must be compiled separately and is not linked');
        break;

      case 'ELSE':
        pos.i++;
        warnings.push('ELSE without a matching IF; ignored');
        break;

      default:
        out.push(pad(indent) + '# ' + type + ' (unsupported step type)');
        warnings.push('Unsupported step type ' + JSON.stringify(type) + '; emitted as comment');
    }
  }

  function emitSet(step, indent, ctx) {
    var name = sanitizeId(step.name);
    if (own(step, 'expr')) {
      ctx.out.push(pad(indent) + 'Set ' + name + ' to ' + translateExpr(step.expr) + '.');
      delete ctx.arrays[name];
      return;
    }
    var arr = literalArray(step.value);
    if (arr) {
      var info = materializeArray(ctx, indent, arr, 'SET ' + step.name);
      ctx.arrays[name] = info;
      ctx.out.push(pad(indent) + 'Set ' + name + ' to ' + info.base + '.');
      ctx.out.push(pad(indent) + 'Set ' + name + '_len to ' + numLit(info.len) + '.');
      return;
    }
    delete ctx.arrays[name];
    ctx.out.push(pad(indent) + 'Set ' + name + ' to ' + emitScalar(step.value, ctx.warnings, 'SET ' + step.name) + '.');
  }

  function resolveArray(step, indent, ctx, label) {
    var inRaw = step.in;
    if (typeof inRaw === 'string') {
      var key = sanitizeId(inRaw.trim());
      if (own(ctx.arrays, key)) return ctx.arrays[key];
    }
    var lit = literalArray(inRaw);
    if (lit) return materializeArray(ctx, indent, lit, label);
    return null;
  }

  function emitForeach(step, type, steps, pos, indent, ctx) {
    var v = sanitizeId(step.var || 'item');
    if (type === 'FOREACHP') ctx.warnings.push('FOREACHP: parallel iteration lowered to sequential');
    var info = resolveArray(step, indent, ctx, 'FOREACH ' + (step.var || 'item'));
    if (info) {
      var idx = '_fe' + (ctx.tempN++);
      ctx.out.push(pad(indent) + 'For each ' + idx + ' from 0 to ' + numLit(info.len - 1) + ':');
      ctx.out.push(pad(indent + 1) + 'Set ' + v + ' to Memory.Get(' + info.base + ' plus ' + idx + ').');
      var start = ctx.out.length;
      var term = emitSeq(steps, pos, indent + 1, ctx);
      if (ctx.out.length === start) ctx.out.push(pad(indent + 1) + 'Set _nop to 0.');
      if (term === 'ELSE') { pos.i++; ctx.warnings.push('ELSE without a matching IF; ignored'); }
      return;
    }
    ctx.out.push(pad(indent) + '# FOREACH ' + v + ' in ' + (step.in || '') + ' — runtime array not resolvable; body runs once with ' + v + ' = 0');
    ctx.out.push(pad(indent) + 'For each ' + v + ' from 0 to 0:');
    ctx.warnings.push('FOREACH over ' + JSON.stringify(step.in || '') + ' is not representable on the integer VM; body lowered to a single iteration');
    closeLoop(steps, pos, indent, ctx);
  }

  // LOAD name from <source>. `variable` clones another context value (a plain
  // assignment, array-aware); `memory`/`scratch` read a Memory/Context cell.
  function emitLoad(step, indent, ctx) {
    var name = sanitizeId(step.name);
    var from = String(step.from || '').toLowerCase();
    if (from === 'variable') {
      var srcRaw = step.key || step.var || step.source || '';
      var srcId = sanitizeId(String(srcRaw).trim());
      if (own(ctx.arrays, srcId)) ctx.arrays[name] = ctx.arrays[srcId];
      else delete ctx.arrays[name];
      ctx.out.push(pad(indent) + 'Set ' + name + ' to ' + translateExpr(String(srcRaw)) + '.');
      return;
    }
    if (from === 'memory' || from === 'scratch') {
      var hook = from === 'scratch' ? 'Context.GetScratchValue' : 'Memory.Get';
      ctx.out.push(pad(indent) + 'Set ' + name + ' to ' + hook + '(' + emitOperand(step.key == null ? 0 : step.key, ctx.warnings, 'LOAD key') + ').');
      delete ctx.arrays[name];
      return;
    }
    ctx.out.push(pad(indent) + '# LOAD ' + (step.name || '') + ' <- ' + (step.from || '') + (step.key ? ' [' + step.key + ']' : ''));
    ctx.warnings.push('LOAD from ' + JSON.stringify(step.from || '') + ' requires a host storage/transport hook and is not executed by the integer VM');
  }

  // SAVE name to <target>. `variable` copies into another context key; `memory`/
  // `scratch` write a Memory/Context cell.
  function emitSave(step, indent, ctx) {
    var name = sanitizeId(step.name);
    var to = String(step.to || '').toLowerCase();
    if (to === 'variable') {
      var target = sanitizeId(step.key || step.target || step.name);
      ctx.out.push(pad(indent) + 'Set ' + target + ' to ' + name + '.');
      if (own(ctx.arrays, name)) ctx.arrays[target] = ctx.arrays[name];
      return;
    }
    if (to === 'memory' || to === 'scratch') {
      var hook = to === 'scratch' ? 'Context.SetScratchValue' : 'Memory.Set';
      ctx.out.push(pad(indent) + hook + '(' + emitOperand(step.key == null ? 0 : step.key, ctx.warnings, 'SAVE key') + ', ' + name + ').');
      return;
    }
    ctx.out.push(pad(indent) + '# SAVE ' + (step.name || '') + ' -> ' + (step.to || '') + (step.key ? ' [' + step.key + ']' : ''));
    ctx.warnings.push('SAVE to ' + JSON.stringify(step.to || '') + ' requires a host storage hook and is not executed by the integer VM');
  }

  function emitLog(step, indent, ctx) {
    var msg = step.message;
    if (typeof msg === 'number') { ctx.out.push(pad(indent) + 'Print ' + numLit(msg) + '.'); return; }
    if (typeof msg === 'string') {
      var exact = /^\$\{([\s\S]+)\}$/.exec(msg);
      if (exact) { ctx.out.push(pad(indent) + 'Print ' + translateExpr(exact[1]) + '.'); return; }
      if (/^-?\d+$/.test(msg.trim())) { ctx.out.push(pad(indent) + 'Print ' + numLit(parseInt(msg.trim(), 10)) + '.'); return; }
      if (/^[A-Za-z_]\w*$/.test(msg.trim())) { ctx.out.push(pad(indent) + 'Print ' + sanitizeId(msg.trim()) + '.'); return; }
    }
    ctx.out.push(pad(indent) + '# LOG ' + (step.level ? '[' + step.level + '] ' : '') + String(msg == null ? '' : msg));
    ctx.warnings.push('LOG: console strings are not printable on the integer VM; emitted as comment');
  }

  // ── public compile ──────────────────────────────────────────────────────────
  function resolveSteps(stepsOrName) {
    if (Array.isArray(stepsOrName)) return stepsOrName;
    if (typeof stepsOrName === 'string') {
      var WF = BareMetal.Workflow;
      if (WF && typeof WF.get === 'function') {
        var s = WF.get(stepsOrName);
        if (s) return s;
      }
      throw new Error('Workflow not found: ' + stepsOrName);
    }
    throw new Error('WorkflowPico.compile expects a steps array or a registered workflow name');
  }

  function compile(stepsOrName, opts) {
    opts = opts || {};
    var steps = resolveSteps(stepsOrName);
    var ctx = {
      out: [],
      warnings: [],
      arrays: {},
      memNext: opts.arrayBase || DEFAULT_ARRAY_BASE,
      tempN: 0,
      opts: opts
    };
    var pos = { i: 0 };
    while (pos.i < steps.length) {
      var term = emitSeq(steps, pos, 0, ctx);
      if (term === 'ELSE') { pos.i++; ctx.warnings.push('ELSE without a matching IF; ignored'); }
      else if (term === 'END') { ctx.warnings.push('END without a matching block; ignored'); }
      else break;
    }
    return { source: ctx.out.join('\n') + '\n', warnings: ctx.warnings };
  }

  // ── PicoScript integration ──────────────────────────────────────────────────
  function resolvePico(opts) {
    if (opts && opts.pico) return opts.pico;
    if (typeof BareMetal !== 'undefined' && BareMetal.PicoScript) return BareMetal.PicoScript;
    if (typeof window !== 'undefined' && window.BareMetal && window.BareMetal.PicoScript) return window.BareMetal.PicoScript;
    return null;
  }

  function toWords(stepsOrName, opts) {
    var c = compile(stepsOrName, opts);
    var ps = resolvePico(opts);
    if (!ps || typeof ps.compileEnglish !== 'function') {
      throw new Error('BareMetal.PicoScript is not available; load it or pass opts.pico');
    }
    var r = ps.compileEnglish(c.source);
    return { source: c.source, words: r.words, warnings: c.warnings };
  }

  function run(stepsOrName, opts) {
    opts = opts || {};
    var w = toWords(stepsOrName, opts);
    var ps = resolvePico(opts);
    var vm = opts.vmOptions ? new ps.VM(opts.vmOptions) : new ps.VM();
    vm.run(w.words);
    return { source: w.source, words: w.words, output: vm.output, vm: vm, warnings: w.warnings };
  }

  // ── designer integration ────────────────────────────────────────────────────
  function attachToDesigner(controller, opts) {
    opts = opts || {};
    if (typeof document === 'undefined' || !controller || !controller.element) return null;
    var toolbar = controller.element.querySelector('.bm-wf-toolbar') || controller.element;
    var btn = document.createElement('button');
    btn.className = 'bt bm-wf-pico';
    btn.textContent = opts.label || 'Compile to PicoScript';
    btn.onclick = function () {
      var steps = typeof controller.getSteps === 'function' ? controller.getSteps() : [];
      var detail;
      try {
        var res = opts.run ? run(steps, opts) : compile(steps, opts);
        detail = {
          steps: steps,
          source: res.source,
          words: res.words || null,
          output: res.output || null,
          warnings: res.warnings
        };
      } catch (error) {
        controller.element.dispatchEvent(new CustomEvent('bm:workflow-pico-error', { detail: { error: error }, bubbles: true }));
        return;
      }
      controller.element.dispatchEvent(new CustomEvent('bm:workflow-pico', { detail: detail, bubbles: true }));
      if (typeof opts.onResult === 'function') opts.onResult(detail);
      else if (typeof window !== 'undefined' && typeof window.prompt === 'function') window.prompt('PicoScript (English dialect)', detail.source);
    };
    toolbar.appendChild(btn);
    return btn;
  }

  return {
    VERSION: VERSION,
    compile: compile,
    compileWorkflow: compile,
    toWords: toWords,
    run: run,
    translateExpr: translateExpr,
    attachToDesigner: attachToDesigner
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.WorkflowPico;
