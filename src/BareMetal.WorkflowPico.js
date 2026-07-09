// BareMetal.WorkflowPico.js — compile BareMetal.Workflow step lists into
// PicoScript (English dialect) so the visual workflow designer becomes a
// PicoScript frontend. The emitted source runs on any PicoScript VM
// (BareMetal.PicoScript in the browser, the RP2350/PIOS VM, or the C# VM).
//
// The PicoScript VM is a deterministic integer machine, so the arithmetic /
// control-flow subset (SET / IF / ELSE / FOR / FOREACH / LOG) lowers faithfully.
// Data / IO steps (WEB / LOAD / SAVE / WAIT / CALL) and runtime arrays cannot be
// executed by the integer VM; they are lowered to host-hook calls or annotated
// comments and reported through the returned `warnings` array.
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.WorkflowPico = (() => {
  'use strict';

  var VERSION = '1.0.0';
  var UNIT = '    ';
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

  // ── expression translation (JS-ish subset → English operator dialect) ───────
  function translateExpr(src) {
    var s = String(src == null ? '' : src);
    var out = '';
    var i = 0;
    var quote = 0;
    while (i < s.length) {
      var c = s.charAt(i);
      if (quote) {
        out += c;
        if (c === '\\' && i + 1 < s.length) { out += s.charAt(i + 1); i += 2; continue; }
        if (c === quote) quote = 0;
        i++; continue;
      }
      if (c === '"' || c === "'") { quote = c; out += c; i++; continue; }
      if (c === '=' && s.charAt(i + 1) === '=') { var j = i + 2; if (s.charAt(j) === '=') j++; out += ' is '; i = j; continue; }
      if (c === '!' && s.charAt(i + 1) === '=') { var k = i + 2; if (s.charAt(k) === '=') k++; out += ' != '; i = k; continue; }
      if (c === '&' && s.charAt(i + 1) === '&') { out += ' and '; i += 2; continue; }
      if (c === '|' && s.charAt(i + 1) === '|') { out += ' or '; i += 2; continue; }
      out += c; i++;
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  // ── literals ────────────────────────────────────────────────────────────────
  function numLit(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '0';
    n = Math.trunc(n);
    return n < 0 ? '(0 - ' + Math.abs(n) + ')' : String(n);
  }

  function quoteStr(s) {
    return '"' + String(s)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t') + '"';
  }

  // A raw JS value → an English atom. Records a warning for anything the integer
  // VM cannot represent, but always returns a compilable atom.
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

  // A field that may be a number, a bare expression string, or a scalar value.
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

  // ── recursive lowering ──────────────────────────────────────────────────────
  // emitSeq emits statements at `indent` until it hits an END (consumed) or an
  // ELSE (left in place) at this level, returning the terminator it stopped on.
  function emitSeq(steps, pos, indent, out, warnings) {
    while (pos.i < steps.length) {
      var step = steps[pos.i] || {};
      var type = String(step.type || '').toUpperCase();
      if (type === 'END') { pos.i++; return 'END'; }
      if (type === 'ELSE') return 'ELSE';
      pos.i++;
      emitStep(step, type, steps, pos, indent, out, warnings);
    }
    return 'EOF';
  }

  // Emits a block body one level in, guaranteeing at least one statement so the
  // English (indentation-based) grammar stays valid for empty blocks.
  function emitBody(steps, pos, indent, out, warnings) {
    var start = out.length;
    var term = emitSeq(steps, pos, indent, out, warnings);
    if (out.length === start) out.push(pad(indent) + 'Set _nop to 0.');
    return term;
  }

  function emitStep(step, type, steps, pos, indent, out, warnings) {
    var line;
    switch (type) {
      case 'SET':
        var rhs = own(step, 'expr')
          ? translateExpr(step.expr)
          : emitScalar(step.value, warnings, 'SET ' + step.name);
        out.push(pad(indent) + 'Set ' + sanitizeId(step.name) + ' to ' + rhs + '.');
        break;

      case 'IF':
        out.push(pad(indent) + 'If ' + translateExpr(step.condition || 'false') + ':');
        var term = emitBody(steps, pos, indent + 1, out, warnings);
        if (term === 'ELSE') {
          pos.i++;
          out.push(pad(indent) + 'Otherwise:');
          term = emitBody(steps, pos, indent + 1, out, warnings);
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
        closeLoop(steps, pos, indent, out, warnings);
        break;

      case 'FOREACH':
      case 'FOREACHP':
        emitForeach(step, type, steps, pos, indent, out, warnings);
        break;

      case 'LOG':
        emitLog(step, indent, out, warnings);
        break;

      case 'WAIT':
        out.push(pad(indent) + 'Timer.After(' + emitOperand(step.ms == null ? 0 : step.ms, warnings, 'WAIT ms') + ').');
        warnings.push('WAIT: Timer.After schedules but does not block the VM');
        break;

      case 'WEB':
        out.push(pad(indent) + '# WEB ' + String(step.method || 'GET').toUpperCase() + ' ' + (step.url || '') +
          (step.result ? ' -> ' + step.result : ''));
        warnings.push('WEB: HTTP requests require a host transport hook and are not executed by the integer VM');
        break;

      case 'LOAD':
        out.push(pad(indent) + '# LOAD ' + (step.name || '') + ' <- ' + (step.from || '') + (step.key ? ' [' + step.key + ']' : ''));
        warnings.push('LOAD: persistence requires a host storage hook and is not executed by the integer VM');
        break;

      case 'SAVE':
        out.push(pad(indent) + '# SAVE ' + (step.name || '') + ' -> ' + (step.to || '') + (step.key ? ' [' + step.key + ']' : ''));
        warnings.push('SAVE: persistence requires a host storage hook and is not executed by the integer VM');
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

  function closeLoop(steps, pos, indent, out, warnings) {
    var term = emitBody(steps, pos, indent + 1, out, warnings);
    if (term === 'ELSE') { pos.i++; warnings.push('ELSE without a matching IF; ignored'); }
  }

  function emitForeach(step, type, steps, pos, indent, out, warnings) {
    var v = sanitizeId(step.var || 'item');
    var arr = literalArray(step.in);
    if (type === 'FOREACHP') warnings.push('FOREACHP: parallel iteration lowered to sequential');
    if (arr) {
      out.push(pad(indent) + '# FOREACH ' + v + ' in ' + JSON.stringify(step.in) + ' — ' + v + ' is the index; element values need host array hooks');
      out.push(pad(indent) + 'For each ' + v + ' from 0 to ' + numLit(arr.length - 1) + ':');
      warnings.push('FOREACH: runtime array elements are not available on the integer VM; ' + JSON.stringify(v) + ' is bound to the index');
    } else {
      out.push(pad(indent) + '# FOREACH ' + v + ' in ' + (step.in || '') + ' — runtime array not resolvable; body runs once with ' + v + ' = 0');
      out.push(pad(indent) + 'For each ' + v + ' from 0 to 0:');
      warnings.push('FOREACH over ' + JSON.stringify(step.in || '') + ' is not representable on the integer VM; body lowered to a single iteration');
    }
    closeLoop(steps, pos, indent, out, warnings);
  }

  function emitLog(step, indent, out, warnings) {
    var msg = step.message;
    if (typeof msg === 'number') { out.push(pad(indent) + 'Print ' + numLit(msg) + '.'); return; }
    if (typeof msg === 'string') {
      var exact = /^\$\{([\s\S]+)\}$/.exec(msg);
      if (exact) { out.push(pad(indent) + 'Print ' + translateExpr(exact[1]) + '.'); return; }
      if (/^-?\d+$/.test(msg.trim())) { out.push(pad(indent) + 'Print ' + numLit(parseInt(msg.trim(), 10)) + '.'); return; }
      if (/^[A-Za-z_]\w*$/.test(msg.trim())) { out.push(pad(indent) + 'Print ' + sanitizeId(msg.trim()) + '.'); return; }
    }
    out.push(pad(indent) + '# LOG ' + (step.level ? '[' + step.level + '] ' : '') + String(msg == null ? '' : msg));
    warnings.push('LOG: console strings are not printable on the integer VM; emitted as comment');
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

  function compile(stepsOrName /*, opts */) {
    var steps = resolveSteps(stepsOrName);
    var out = [];
    var warnings = [];
    var pos = { i: 0 };
    while (pos.i < steps.length) {
      var term = emitSeq(steps, pos, 0, out, warnings);
      if (term === 'ELSE') { pos.i++; warnings.push('ELSE without a matching IF; ignored'); }
      else if (term === 'END') { warnings.push('END without a matching block; ignored'); }
      else break;
    }
    return { source: out.join('\n') + '\n', warnings: warnings };
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
  // Adds a "Compile to PicoScript" control to a designer returned by
  // BareMetal.Workflow.designer(). Dispatches a bubbling `bm:workflow-pico`
  // CustomEvent with { steps, source, words, output, warnings }.
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
