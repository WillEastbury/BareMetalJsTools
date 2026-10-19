/* BareMetal.Sheet — spreadsheet cell view. */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Sheet = (function () {
  "use strict";

  var CSS_ID = "bm-sheet-css";
  var CSS = [
    ".bm-sheet{display:flex;flex-direction:column;min-height:0;height:100%;font-family:var(--bs-font-sans,system-ui,sans-serif);font-size:13px;color:var(--bs-body-color,#4a2040);background:#fff}",
    ".bm-sheet-formula{display:flex;gap:.4rem;align-items:center;padding:.3rem .5rem;border-bottom:1px solid var(--bs-border-color,#f8bbd0)}",
    ".bm-sheet-addr{min-width:3.2rem;font-weight:700;color:var(--bs-primary,#e91e8c)}",
    ".bm-sheet-formula input{flex:1;border:1px solid var(--bs-border-color,#f8bbd0);border-radius:.3rem;padding:.25rem .45rem;font:inherit}",
    ".bm-sheet-scroller{flex:1;overflow:auto;min-height:12rem}",
    ".bm-sheet table{border-collapse:collapse;table-layout:fixed}",
    ".bm-sheet th,.bm-sheet td{border:1px solid #f3c6d8;min-width:5.2rem;height:1.55rem;padding:.05rem .3rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;background:#fff}",
    ".bm-sheet thead th,.bm-sheet .bm-sheet-rn{background:var(--bs-light,#fce4ec);text-align:center;font-weight:600;position:sticky;z-index:1}",
    ".bm-sheet thead th{top:0}",
    ".bm-sheet .bm-sheet-rn{left:0;min-width:2.4rem;width:2.4rem}",
    ".bm-sheet td.sel{outline:2px solid var(--bs-primary,#e91e8c);outline-offset:-2px;background:#fff0f7}",
    ".bm-sheet td.edit{padding:0}",
    ".bm-sheet td.edit input{width:100%;height:100%;border:0;padding:.05rem .3rem;font:inherit;box-sizing:border-box}"
  ].join("");

  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
    var style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function colName(i) {
    var n = i, s = "";
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return s;
  }

  function parseAddr(addr) {
    var m = String(addr || "").toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!m) return null;
    var col = 0, i;
    for (i = 0; i < m[1].length; i++) col = col * 26 + (m[1].charCodeAt(i) - 64);
    return { c: col - 1, r: Number(m[2]) - 1, addr: m[1] + m[2] };
  }

  function makeAddr(c, r) { return colName(c) + String(r + 1); }

  function cloneCell(cell) {
    if (!cell || typeof cell !== "object") return { v: cell == null ? "" : String(cell) };
    return JSON.parse(JSON.stringify(cell));
  }

  function cellText(cell) {
    if (cell == null) return "";
    if (typeof cell === "object") return cell.v == null ? "" : String(cell.v);
    return String(cell);
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
    if (!root) throw new Error("Sheet target not found.");
    var rows = options.rows || 20;
    var cols = options.cols || 10;
    var cells = {};
    Object.keys(options.cells || {}).forEach(function (k) { cells[k.toUpperCase()] = cloneCell(options.cells[k]); });
    var sel = parseAddr(options.select) || { c: 0, r: 0, addr: "A1" };
    var editing = false;
    var wrap = el("div", "bm-sheet");
    var formula = el("div", "bm-sheet-formula");
    var addrEl = el("div", "bm-sheet-addr");
    var input = document.createElement("input");
    input.type = "text";
    formula.appendChild(addrEl);
    formula.appendChild(input);
    var scroller = el("div", "bm-sheet-scroller");
    var table = document.createElement("table");
    scroller.appendChild(table);
    wrap.appendChild(formula);
    wrap.appendChild(scroller);
    wrap.tabIndex = 0;
    root.appendChild(wrap);

    function styleTd(td, cell) {
      var s = cell && cell.s ? cell.s : {};
      td.style.fontWeight = s.bold ? "700" : "";
      td.style.fontStyle = s.italic ? "italic" : "";
      td.style.color = s.color || "";
      td.style.background = s.bg || "";
      td.style.fontFamily = s.font || "";
      td.style.fontSize = s.size ? s.size + "px" : "";
      td.style.textAlign = s.align || "";
    }

    function getCell(addr) { return cells[String(addr).toUpperCase()] || null; }

    function setCell(addr, cell, silent) {
      var key = String(addr).toUpperCase();
      var prev = getCell(key);
      if (cell == null || (typeof cell === "object" && !cellText(cell) && !cell.s)) delete cells[key];
      else cells[key] = cloneCell(cell);
      if (!silent && options.onChange) options.onChange(key, getCell(key), prev);
      renderBody();
    }

    function commitInput() {
      if (!editing) {
        setCell(sel.addr, Object.assign(cloneCell(getCell(sel.addr) || {}), { v: input.value }));
      }
    }

    function renderHead() {
      var thead = document.createElement("thead");
      var tr = document.createElement("tr");
      var corner = document.createElement("th");
      corner.className = "bm-sheet-rn";
      tr.appendChild(corner);
      var c;
      for (c = 0; c < cols; c++) {
        var th = document.createElement("th");
        th.textContent = colName(c);
        tr.appendChild(th);
      }
      thead.appendChild(tr);
      return thead;
    }

    function renderBody() {
      table.innerHTML = "";
      table.appendChild(renderHead());
      var tbody = document.createElement("tbody");
      var r, c, tr, th, td, addr, cell;
      for (r = 0; r < rows; r++) {
        tr = document.createElement("tr");
        th = document.createElement("th");
        th.className = "bm-sheet-rn";
        th.textContent = String(r + 1);
        tr.appendChild(th);
        for (c = 0; c < cols; c++) {
          addr = makeAddr(c, r);
          cell = getCell(addr);
          td = document.createElement("td");
          td.setAttribute("data-addr", addr);
          td.textContent = cellText(cell);
          styleTd(td, cell);
          if (addr === sel.addr) td.className += (td.className ? " " : "") + "sel";
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      addrEl.textContent = sel.addr;
      if (!editing) input.value = cellText(getCell(sel.addr));
    }

    function select(addr, keepEdit) {
      var parsed = typeof addr === "string" ? parseAddr(addr) : addr;
      if (!parsed) return;
      if (parsed.c < 0) parsed.c = 0;
      if (parsed.r < 0) parsed.r = 0;
      if (parsed.c >= cols) parsed.c = cols - 1;
      if (parsed.r >= rows) parsed.r = rows - 1;
      parsed.addr = makeAddr(parsed.c, parsed.r);
      sel = parsed;
      if (!keepEdit) editing = false;
      renderBody();
      if (options.onSelect) options.onSelect(sel.addr, getCell(sel.addr));
    }

    function startEdit() {
      editing = true;
      var td = table.querySelector('td[data-addr="' + sel.addr + '"]');
      if (!td) return;
      td.className = "sel edit";
      td.textContent = "";
      var field = document.createElement("input");
      field.value = cellText(getCell(sel.addr));
      td.appendChild(field);
      field.focus();
      field.select();
      field.addEventListener("blur", function () {
        editing = false;
        setCell(sel.addr, Object.assign(cloneCell(getCell(sel.addr) || {}), { v: field.value }));
      });
      field.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") { ev.preventDefault(); field.blur(); select({ c: sel.c, r: sel.r + 1 }); }
        if (ev.key === "Escape") { ev.preventDefault(); editing = false; renderBody(); }
      });
    }

    table.addEventListener("mousedown", function (ev) {
      var td = ev.target.closest("td");
      if (!td) return;
      wrap.focus();
      select(td.getAttribute("data-addr"));
    });
    table.addEventListener("dblclick", function (ev) {
      if (ev.target.closest("td")) startEdit();
    });
    input.addEventListener("change", commitInput);
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { commitInput(); select({ c: sel.c, r: sel.r + 1 }); }
    });
    wrap.addEventListener("keydown", function (ev) {
      if (editing) return;
      if (ev.key === "Enter") { ev.preventDefault(); startEdit(); return; }
      if (ev.key === "ArrowRight") { ev.preventDefault(); select({ c: sel.c + 1, r: sel.r }); }
      if (ev.key === "ArrowLeft") { ev.preventDefault(); select({ c: sel.c - 1, r: sel.r }); }
      if (ev.key === "ArrowDown") { ev.preventDefault(); select({ c: sel.c, r: sel.r + 1 }); }
      if (ev.key === "ArrowUp") { ev.preventDefault(); select({ c: sel.c, r: sel.r - 1 }); }
      if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey) {
        startEdit();
      }
    });

    renderBody();
    return {
      el: wrap,
      addr: makeAddr,
      parseAddr: parseAddr,
      getData: function () { return { rows: rows, cols: cols, cells: JSON.parse(JSON.stringify(cells)) }; },
      setData: function (data, silent) {
        if (!data) return;
        if (data.rows) rows = data.rows;
        if (data.cols) cols = data.cols;
        cells = {};
        Object.keys(data.cells || {}).forEach(function (k) { cells[k.toUpperCase()] = cloneCell(data.cells[k]); });
        if (!silent) renderBody();
        else renderBody();
      },
      getCell: getCell,
      setCell: setCell,
      select: select,
      selected: function () { return sel.addr; },
      styleSelected: function (patch) {
        var cur = cloneCell(getCell(sel.addr) || { v: "" });
        cur.s = Object.assign({}, cur.s || {}, patch || {});
        setCell(sel.addr, cur);
      },
      startEdit: startEdit
    };
  }

  return { create: create, colName: colName, parseAddr: parseAddr, addr: makeAddr };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Sheet;
