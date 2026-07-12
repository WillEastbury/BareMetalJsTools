// BareMetal.Report.js — report & form builder for the BareMetal suite.
//
// Reports and forms are two faces of one templated layout engine (the 2-stage
// model shared with picoscript's picolayout): stage 1 is a data producer (an API
// call, a Workflow, a PicoScript program, a Storage query, or a literal array)
// whose output is a flat list of integer values; stage 2 is a layout *template*
// that renders that data.
//
//   mode "report" -> read-only  (an HTML table + aggregate footer)
//   mode "form"   -> read-write (labelled inputs bound to the data)
//
// A report is a data source with a read-only layout attached; a form is the same
// with a read-write layout. This module provides:
//   • the layout engine  — renderText / renderHtml (byte-aligned with picolayout)
//   • DOM rendering       — render(container, data, template, opts)
//   • form write-back     — collect(formEl) / flatten / toWrites (data ABI map)
//   • a visual designer   — designer(container, opts): CREATE/edit a template
//                           (columns, aggregates, mode) with a live preview.
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Report = (() => {
  'use strict';

  var VALID_AGG = ['count', 'sum', 'min', 'max', 'avg'];
  var FORMATS = ['int', 'hex', 'raw'];

  function chunk(data, ncols) {
    ncols = Math.max(1, ncols);
    var rows = [];
    for (var i = 0; i < data.length; i += ncols) rows.push(data.slice(i, i + ncols));
    return rows;
  }

  function fmt(value, f) {
    if (value == null) return '';
    if (f === 'hex') { var n = Number(value) >>> 0; return '0x' + n.toString(16); }
    if (f === 'raw') return String(value);
    var iv = parseInt(value, 10);
    return isNaN(iv) ? String(value) : String(iv);
  }

  function columns(template) {
    var cols = template.columns || template.fields || [];
    return cols.map(function (c) { return (c && typeof c === 'object') ? c : { label: String(c) }; });
  }

  function colField(col, idx) { return (typeof col.field === 'number') ? col.field : idx; }

  function agg(rows, col, fn) {
    var vals = [];
    for (var i = 0; i < rows.length; i++) { var v = rows[i][col]; if (typeof v === 'number') vals.push(v); }
    if (fn === 'count') return vals.length;
    if (!vals.length) return 0;
    if (fn === 'sum') return vals.reduce(function (a, b) { return a + b; }, 0);
    if (fn === 'min') return Math.min.apply(null, vals);
    if (fn === 'max') return Math.max.apply(null, vals);
    if (fn === 'avg') return Math.trunc(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length);
    return 0;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function padEnd(s, w) { s = String(s); while (s.length < w) s += ' '; return s; }
  function padStart(s, w) { s = String(s); while (s.length < w) s = ' ' + s; return s; }

  // ── layout engine (aligned with picolayout.js / picolayout.py) ───────────────
  function renderText(data, template) {
    var cols = columns(template);
    if (!cols.length) return '';
    var widths = cols.map(function (c) { return Math.max(3, parseInt(c.width, 10) || 8); });
    var lines = [];
    if (template.title) lines.push(String(template.title));
    lines.push(cols.map(function (c, i) { return padEnd(c.label || '', widths[i]); }).join('  '));
    lines.push(widths.map(function (w) { return new Array(w + 1).join('-'); }).join('  '));
    var rows = chunk(data.slice(), cols.length);
    rows.forEach(function (row) {
      lines.push(cols.map(function (c, i) {
        var fi = colField(c, i);
        var s = fmt(fi < row.length ? row[fi] : null, c.format || 'int');
        return c.align === 'right' ? padStart(s, widths[i]) : padEnd(s, widths[i]);
      }).join('  '));
    });
    var aggs = template.aggregates || [];
    if (aggs.length) {
      lines.push(widths.map(function (w) { return new Array(w + 1).join('-'); }).join('  '));
      lines.push(aggs.map(function (a) { var fn = a.fn || 'sum'; return fn + '=' + agg(rows, parseInt(a.column, 10) || 0, fn); }).join('  '));
    }
    return lines.join('\n') + '\n';
  }

  function renderHtml(data, template, mode) {
    var cols = columns(template);
    mode = (mode || template.mode || 'report').toLowerCase();
    var rows = chunk(data.slice(), cols.length || 1);

    if (mode === 'form') {
      var out = ['<form class="pico-form">'];
      if (template.title) out.push('<h3 class="pico-form-title">' + esc(template.title) + '</h3>');
      rows.forEach(function (row, ri) {
        out.push('<div class="pico-form-row" data-row="' + ri + '">');
        cols.forEach(function (c, i) {
          var fi = colField(c, i);
          var v = fi < row.length ? row[fi] : 0;
          var sval = esc(fmt(v, c.format || 'int'));
          if (c.editable !== false) {
            out.push('<label class="pico-field"><span>' + esc(c.label || '') + '</span>' +
              '<input name="c' + i + '" data-field="' + fi + '" data-row="' + ri + '" value="' + sval + '"></label>');
          } else {
            out.push('<label class="pico-field"><span>' + esc(c.label || '') + '</span>' +
              '<output data-field="' + fi + '" data-row="' + ri + '">' + sval + '</output></label>');
          }
        });
        out.push('</div>');
      });
      out.push('</form>');
      return out.join('\n') + '\n';
    }

    var t = ['<table class="pico-report">'];
    if (template.title) t.push('<caption>' + esc(template.title) + '</caption>');
    t.push('<thead><tr>' + cols.map(function (c) { return '<th>' + esc(c.label || '') + '</th>'; }).join('') + '</tr></thead>');
    t.push('<tbody>');
    rows.forEach(function (row) {
      t.push('<tr>' + cols.map(function (c, i) {
        var fi = colField(c, i);
        return '<td>' + esc(fmt(fi < row.length ? row[fi] : null, c.format || 'int')) + '</td>';
      }).join('') + '</tr>');
    });
    t.push('</tbody>');
    var aggs = template.aggregates || [];
    if (aggs.length) {
      var cellmap = {};
      aggs.forEach(function (a) { var col = parseInt(a.column, 10) || 0; var fn = a.fn || 'sum'; cellmap[col] = fn + '=' + agg(rows, col, fn); });
      var tf = '';
      for (var i = 0; i < cols.length; i++) tf += '<td>' + esc(cellmap[i] || '') + '</td>';
      t.push('<tfoot><tr>' + tf + '</tr></tfoot>');
    }
    t.push('</table>');
    return t.join('\n') + '\n';
  }

  // ── DOM rendering ────────────────────────────────────────────────────────────
  // render(container, data, template, opts) -> { element, form, collect, refresh }
  function render(container, data, template, opts) {
    opts = opts || {};
    if (!container || typeof document === 'undefined') return null;
    if (typeof template === 'string') template = JSON.parse(template);
    var mode = (opts.mode || template.mode || 'report').toLowerCase();
    container.innerHTML = renderHtml(data || [], template, mode);
    var form = container.querySelector('form.pico-form');
    return {
      element: container,
      form: form,
      collect: function () { return collect(form); },
      refresh: function (nextData, nextTemplate) {
        return render(container, nextData || data, nextTemplate || template, opts);
      }
    };
  }

  // ── form write-back (data ABI) ───────────────────────────────────────────────
  function collect(formEl) {
    if (!formEl || !formEl.querySelectorAll) return [];
    var rows = {};
    formEl.querySelectorAll('input[data-row]').forEach(function (inp) {
      var r = parseInt(inp.getAttribute('data-row'), 10) || 0;
      var f = parseInt(inp.getAttribute('data-field'), 10) || 0;
      var val = parseInt(inp.value, 10); if (isNaN(val)) val = 0;
      (rows[r] = rows[r] || {})[f] = val;
    });
    return Object.keys(rows).sort(function (a, b) { return a - b; }).map(function (r) {
      var obj = rows[r], arr = [];
      Object.keys(obj).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) { arr[k] = obj[k]; });
      return arr;
    });
  }

  function flatten(rows) {
    var out = [];
    (rows || []).forEach(function (row) { (row || []).forEach(function (v) { out.push(v | 0); }); });
    return out;
  }

  function toWrites(rows, opts) {
    opts = opts || {};
    var base = opts.base | 0, stride = opts.stride | 0;
    if (!stride) { stride = 0; (rows || []).forEach(function (r) { stride = Math.max(stride, (r || []).length); }); stride = Math.max(1, stride); }
    var map = {};
    (rows || []).forEach(function (row, ri) { (row || []).forEach(function (v, fi) { map[base + ri * stride + fi] = v | 0; }); });
    return map;
  }

  // ── visual designer (CREATE / edit a report or form template) ────────────────
  function applyStyle(el, s) { for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) el.style[k] = s[k]; }
  function emit(el, name, detail) {
    if (typeof CustomEvent !== 'function') return;
    el.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true }));
  }
  function parseData(text) {
    return String(text || '').split(/[\s,]+/).map(function (t) { return parseInt(t, 10); }).filter(function (n) { return !isNaN(n); });
  }

  function designer(container, opts) {
    opts = opts || {};
    if (!container || typeof document === 'undefined') return null;
    var template = opts.template || { title: 'Report', mode: 'report', columns: [{ label: 'A', field: 0, width: 6, format: 'int', editable: true }], aggregates: [] };
    var data = opts.data || [];

    var root = document.createElement('div');
    root.className = 'bm-report-designer cd';
    var bar = document.createElement('div');
    bar.className = 'bm-report-bar rw';
    var body = document.createElement('div');
    var preview = document.createElement('div');
    preview.className = 'bm-report-preview';
    var text = document.createElement('pre');
    text.className = 'bm-report-text';
    root.appendChild(bar);
    root.appendChild(body);
    root.appendChild(preview);
    root.appendChild(text);
    container.innerHTML = '';
    container.appendChild(root);
    applyStyle(bar, { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' });

    function refresh() {
      renderBar();
      renderColumns();
      var mode = template.mode || 'report';
      preview.innerHTML = renderHtml(data, template, mode);
      text.textContent = renderText(data, template);
      emit(root, 'bm:report-change', { template: JSON.parse(JSON.stringify(template)), mode: mode });
    }

    function renderBar() {
      bar.innerHTML = '';
      var title = document.createElement('input');
      title.className = 'bt'; title.value = template.title || ''; title.placeholder = 'title';
      title.oninput = function () { template.title = title.value; scheduleRefresh(); };
      var modeSel = document.createElement('select');
      modeSel.className = 'bt';
      ['report', 'form'].forEach(function (m) { var o = document.createElement('option'); o.value = o.textContent = m; if ((template.mode || 'report') === m) o.selected = true; modeSel.appendChild(o); });
      modeSel.onchange = function () { template.mode = modeSel.value; refresh(); };
      var addCol = document.createElement('button'); addCol.className = 'bt'; addCol.textContent = '+ Column';
      addCol.onclick = function () { (template.columns = template.columns || []).push({ label: 'Col', field: template.columns.length, width: 6, format: 'int', editable: true }); refresh(); };
      var addAgg = document.createElement('button'); addAgg.className = 'bt'; addAgg.textContent = '+ Aggregate';
      addAgg.onclick = function () { (template.aggregates = template.aggregates || []).push({ column: 0, fn: 'sum' }); refresh(); };
      var exp = document.createElement('button'); exp.className = 'bt'; exp.textContent = 'Export';
      exp.onclick = function () { var j = JSON.stringify(template, null, 2); if (typeof window !== 'undefined' && window.prompt) window.prompt('Report template', j); emit(root, 'bm:report-export', { template: JSON.parse(j), json: j }); };
      var dataIn = document.createElement('input');
      dataIn.className = 'bt'; dataIn.value = data.join(', '); dataIn.placeholder = 'data (ints)';
      dataIn.oninput = function () { data = parseData(dataIn.value); scheduleRefresh(); };
      bar.appendChild(title); bar.appendChild(modeSel); bar.appendChild(addCol); bar.appendChild(addAgg); bar.appendChild(exp); bar.appendChild(dataIn);
    }

    function renderColumns() {
      body.innerHTML = '';
      (template.columns || []).forEach(function (c, idx) {
        var row = document.createElement('div');
        row.className = 'bm-report-col rw';
        applyStyle(row, { display: 'flex', gap: '6px', alignItems: 'center', margin: '3px 0' });
        var label = document.createElement('input'); label.className = 'bt'; label.value = c.label || ''; label.placeholder = 'label';
        label.oninput = function () { c.label = label.value; scheduleRefresh(); };
        var field = document.createElement('input'); field.className = 'bt'; field.type = 'number'; field.value = (typeof c.field === 'number' ? c.field : idx); field.title = 'field index'; applyStyle(field, { width: '56px' });
        field.oninput = function () { c.field = parseInt(field.value, 10) || 0; scheduleRefresh(); };
        var width = document.createElement('input'); width.className = 'bt'; width.type = 'number'; width.value = c.width || 6; width.title = 'width'; applyStyle(width, { width: '56px' });
        width.oninput = function () { c.width = parseInt(width.value, 10) || 6; scheduleRefresh(); };
        var fmtSel = document.createElement('select'); fmtSel.className = 'bt';
        FORMATS.forEach(function (f) { var o = document.createElement('option'); o.value = o.textContent = f; if ((c.format || 'int') === f) o.selected = true; fmtSel.appendChild(o); });
        fmtSel.onchange = function () { c.format = fmtSel.value; refresh(); };
        var edit = document.createElement('label'); edit.style.fontSize = '12px';
        var ecb = document.createElement('input'); ecb.type = 'checkbox'; ecb.checked = c.editable !== false;
        ecb.onchange = function () { c.editable = ecb.checked; refresh(); };
        edit.appendChild(ecb); edit.appendChild(document.createTextNode(' editable'));
        var del = document.createElement('button'); del.className = 'bt'; del.textContent = '\u00d7';
        del.onclick = function () { template.columns.splice(idx, 1); refresh(); };
        row.appendChild(label); row.appendChild(field); row.appendChild(width); row.appendChild(fmtSel); row.appendChild(edit); row.appendChild(del);
        body.appendChild(row);
      });
      (template.aggregates || []).forEach(function (a, idx) {
        var row = document.createElement('div');
        row.className = 'bm-report-agg rw';
        applyStyle(row, { display: 'flex', gap: '6px', alignItems: 'center', margin: '3px 0' });
        var span = document.createElement('span'); span.textContent = 'agg'; span.style.fontSize = '12px';
        var colIn = document.createElement('input'); colIn.className = 'bt'; colIn.type = 'number'; colIn.value = a.column || 0; colIn.title = 'column'; applyStyle(colIn, { width: '56px' });
        colIn.oninput = function () { a.column = parseInt(colIn.value, 10) || 0; scheduleRefresh(); };
        var fnSel = document.createElement('select'); fnSel.className = 'bt';
        VALID_AGG.forEach(function (f) { var o = document.createElement('option'); o.value = o.textContent = f; if ((a.fn || 'sum') === f) o.selected = true; fnSel.appendChild(o); });
        fnSel.onchange = function () { a.fn = fnSel.value; refresh(); };
        var del = document.createElement('button'); del.className = 'bt'; del.textContent = '\u00d7';
        del.onclick = function () { template.aggregates.splice(idx, 1); refresh(); };
        row.appendChild(span); row.appendChild(colIn); row.appendChild(fnSel); row.appendChild(del);
        body.appendChild(row);
      });
    }

    var pending = null;
    function scheduleRefresh() {
      var mode = template.mode || 'report';
      preview.innerHTML = renderHtml(data, template, mode);
      text.textContent = renderText(data, template);
      emit(root, 'bm:report-change', { template: JSON.parse(JSON.stringify(template)), mode: mode });
    }

    refresh();
    return {
      element: root,
      getTemplate: function () { return JSON.parse(JSON.stringify(template)); },
      setTemplate: function (t) { template = (typeof t === 'string') ? JSON.parse(t) : t; refresh(); return this; },
      getData: function () { return data.slice(); },
      setData: function (d) { data = Array.isArray(d) ? d.slice() : parseData(d); refresh(); return this; },
      refresh: refresh,
      destroy: function () { if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  return {
    VERSION: '1.0.0',
    renderText: renderText,
    renderHtml: renderHtml,
    render: render,
    collect: collect,
    flatten: flatten,
    toWrites: toWrites,
    designer: designer
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Report;
