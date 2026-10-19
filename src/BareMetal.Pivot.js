/* BareMetal.Pivot — group, summarise, sort, and filter a table of records. */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Pivot = (function () {
  "use strict";

  var CSS_ID = "bm-pivot-css";
  var CSS = [
    ".bm-pivot{display:flex;flex-direction:column;gap:.7rem;min-height:12rem;font-family:var(--bs-font-sans,system-ui,sans-serif);color:var(--bs-body-color,#4a2040)}",
    ".bm-pivot-bar{display:flex;flex-wrap:wrap;gap:.55rem 1rem;align-items:flex-end}",
    ".bm-pivot-bar label{display:flex;flex-direction:column;gap:.15rem;font-size:.75rem;color:var(--bs-secondary-color,#a06080)}",
    ".bm-pivot-bar select,.bm-pivot-bar input{font:inherit;padding:.25rem .4rem;border:1px solid var(--bs-border-color,#f8bbd0);border-radius:.35rem;background:#fff}",
    ".bm-pivot-table{border-collapse:collapse;width:100%;background:#fff}",
    ".bm-pivot-table th,.bm-pivot-table td{border:1px solid var(--bs-border-color,#f8bbd0);padding:.4rem .55rem;text-align:left}",
    ".bm-pivot-table th{cursor:pointer;background:var(--bs-light,#fce4ec)}",
    ".bm-pivot-chart{max-width:36rem}"
  ].join("");

  var OPS = ["sum", "count", "avg", "min", "max"];

  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
    var style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function num(v) {
    var n = Number(v);
    return isFinite(n) && String(v).trim() !== "" ? n : null;
  }

  function compute(records, opts) {
    opts = opts || {};
    var groupBy = opts.groupBy;
    var valueField = opts.valueField;
    var op = OPS.indexOf(opts.op) >= 0 ? opts.op : "sum";
    var filter = String(opts.filter || "").toLowerCase();
    var groups = {};
    (records || []).forEach(function (rec) {
      var key = String(rec && rec[groupBy] != null ? rec[groupBy] : "");
      if (filter && key.toLowerCase().indexOf(filter) < 0) return;
      if (!groups[key]) groups[key] = { group: key, count: 0, sum: 0, min: null, max: null };
      var g = groups[key];
      var n = rec ? num(rec[valueField]) : null;
      g.count += 1;
      if (n != null) {
        g.sum += n;
        g.min = g.min == null ? n : Math.min(g.min, n);
        g.max = g.max == null ? n : Math.max(g.max, n);
      }
    });
    var rows = Object.keys(groups).map(function (k) {
      var g = groups[k];
      g.avg = g.count ? g.sum / g.count : 0;
      g.value = op === "count" ? g.count : op === "avg" ? g.avg : op === "min" ? g.min : op === "max" ? g.max : g.sum;
      if (g.value == null) g.value = 0;
      return g;
    });
    var dir = opts.sortDir === "desc" ? -1 : 1;
    var sortKey = opts.sort === "group" ? "group" : "value";
    rows.sort(function (a, b) {
      if (sortKey === "group") return dir * String(a.group).localeCompare(String(b.group));
      return dir * ((Number(a.value) || 0) - (Number(b.value) || 0));
    });
    return rows;
  }

  function fromRange(headers, bodyRows) {
    var fields = (headers || []).map(function (h, i) { return String(h || ("Col" + (i + 1))); });
    var records = (bodyRows || []).map(function (row) {
      var rec = {}, i;
      for (i = 0; i < fields.length; i++) rec[fields[i]] = row[i];
      return rec;
    });
    return { fields: fields, records: records };
  }

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  function create(target, options) {
    ensureCss();
    options = options || {};
    var root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) throw new Error("Pivot target not found.");
    var fields = (options.fields || []).slice();
    var records = (options.records || []).slice();
    var state = {
      groupBy: options.groupBy || fields[0] || "",
      valueField: options.valueField || fields[fields.length - 1] || "",
      op: options.op || "sum",
      sort: options.sort || "value",
      sortDir: options.sortDir || "desc",
      filter: options.filter || ""
    };
    var wrap = el("div", "bm-pivot");
    var bar = el("div", "bm-pivot-bar");
    var table = el("table", "bm-pivot-table");
    var chart = el("div", "bm-pivot-chart");
    wrap.appendChild(bar);
    wrap.appendChild(table);
    wrap.appendChild(chart);
    root.appendChild(wrap);

    function sel(name, choices, value) {
      var lab = el("label");
      lab.appendChild(document.createTextNode(name));
      var s = document.createElement("select");
      choices.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c;
        o.textContent = c;
        if (c === value) o.selected = true;
        s.appendChild(o);
      });
      lab.appendChild(s);
      return { lab: lab, el: s };
    }

    function paintBar() {
      bar.innerHTML = "";
      var g = sel("Group", fields, state.groupBy);
      var v = sel("Value", fields, state.valueField);
      var o = sel("Summarise", OPS, state.op);
      var so = sel("Sort", ["value", "group"], state.sort);
      var di = sel("Dir", ["asc", "desc"], state.sortDir);
      var fl = el("label");
      fl.appendChild(document.createTextNode("Filter"));
      var fi = document.createElement("input");
      fi.value = state.filter;
      fi.placeholder = "group contains";
      fl.appendChild(fi);
      bar.appendChild(g.lab);
      bar.appendChild(v.lab);
      bar.appendChild(o.lab);
      bar.appendChild(so.lab);
      bar.appendChild(di.lab);
      bar.appendChild(fl);
      function bump() {
        state.groupBy = g.el.value;
        state.valueField = v.el.value;
        state.op = o.el.value;
        state.sort = so.el.value;
        state.sortDir = di.el.value;
        state.filter = fi.value;
        render();
      }
      [g.el, v.el, o.el, so.el, di.el].forEach(function (n) { n.addEventListener("change", bump); });
      fi.addEventListener("input", bump);
    }

    function render() {
      var rows = compute(records, state);
      table.innerHTML = "";
      var head = document.createElement("tr");
      ["Group", "Count", "Sum", "Avg", "Min", "Max"].forEach(function (name) {
        var th = document.createElement("th");
        th.textContent = name;
        head.appendChild(th);
      });
      table.appendChild(head);
      rows.forEach(function (row) {
        var tr = document.createElement("tr");
        [row.group, row.count, row.sum, row.avg, row.min, row.max].forEach(function (val) {
          var td = document.createElement("td");
          td.textContent = val == null ? "" : String(typeof val === "number" ? Math.round(val * 1000) / 1000 : val);
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      chart.innerHTML = "";
      if (BareMetal.Charts && rows.length) {
        BareMetal.Charts.bar(chart, rows.map(function (row) {
          return { label: row.group, value: row.value };
        }), { showValues: true });
      }
      if (options.onChange) options.onChange(rows, state);
    }

    paintBar();
    render();
    return {
      el: wrap,
      compute: function () { return compute(records, state); },
      setRecords: function (next, nextFields) {
        records = (next || []).slice();
        if (nextFields) fields = nextFields.slice();
        paintBar();
        render();
      },
      state: function () { return Object.assign({}, state); }
    };
  }

  return { create: create, compute: compute, fromRange: fromRange, ops: OPS.slice() };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Pivot;
