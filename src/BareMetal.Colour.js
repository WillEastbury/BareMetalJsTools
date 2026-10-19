/* BareMetal.Colour — popover colour picker. */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Colour = (function () {
  "use strict";

  var CSS_ID = "bm-colour-css";
  var CSS = [
    ".bm-colour{position:relative;display:inline-flex;align-items:center;gap:.35rem;font-family:var(--bs-font-sans,system-ui,sans-serif);font-size:.85rem}",
    ".bm-colour-swatch{width:1.35rem;height:1.35rem;border:1px solid var(--bs-border-color,#ccc);border-radius:.3rem;cursor:pointer;padding:0;background:currentColor}",
    ".bm-colour-pop{position:absolute;z-index:40;top:calc(100% + 6px);left:0;background:#fff;border:1px solid var(--bs-border-color,#ddd);border-radius:.6rem;padding:.65rem;box-shadow:0 12px 28px rgba(0,0,0,.12);min-width:12.5rem}",
    ".bm-colour-grid{display:grid;grid-template-columns:repeat(8,1.15rem);gap:.28rem;margin-bottom:.5rem}",
    ".bm-colour-chip{width:1.15rem;height:1.15rem;border:1px solid rgba(0,0,0,.12);border-radius:.25rem;cursor:pointer;padding:0}",
    ".bm-colour-chip.act{outline:2px solid var(--bs-primary,#e91e8c);outline-offset:1px}",
    ".bm-colour-row{display:flex;gap:.35rem;align-items:center}",
    ".bm-colour-row input{flex:1;min-width:0;font:inherit;padding:.25rem .4rem;border:1px solid var(--bs-border-color,#ddd);border-radius:.3rem}"
  ].join("");

  var DEFAULTS = [
    "#000000", "#4a2040", "#e91e8c", "#e53935", "#ffb74d", "#4caf80", "#3b82f6", "#ffffff",
    "#6b7280", "#7c3aed", "#0ea5e9", "#14b8a6", "#84cc16", "#f97316", "#fce4ec", "#fff5f9"
  ];

  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
    var style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function norm(value) {
    var hex = String(value || "").trim();
    if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
      return ("#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]).toLowerCase();
    }
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
    return "#000000";
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
    if (!root) throw new Error("Colour target not found.");
    var palette = (options.palette && options.palette.length) ? options.palette.slice() : DEFAULTS.slice();
    var value = norm(options.value || palette[0]);
    var open = false;
    var wrap = el("div", "bm-colour");
    var btn = el("button", "bm-colour-swatch");
    btn.type = "button";
    btn.title = options.title || "Colour";
    btn.setAttribute("aria-label", btn.title);
    var pop = el("div", "bm-colour-pop");
    pop.hidden = true;
    var grid = el("div", "bm-colour-grid");
    var row = el("div", "bm-colour-row");
    var input = document.createElement("input");
    input.type = "text";
    input.maxLength = 7;
    input.spellcheck = false;
    row.appendChild(input);
    pop.appendChild(grid);
    pop.appendChild(row);
    wrap.appendChild(btn);
    wrap.appendChild(pop);
    root.appendChild(wrap);

    function paint() {
      btn.style.color = value;
      btn.style.background = value;
      input.value = value;
      Array.prototype.forEach.call(grid.children, function (chip) {
        chip.className = "bm-colour-chip" + (norm(chip.getAttribute("data-c")) === value ? " act" : "");
      });
    }

    function set(next, silent) {
      value = norm(next);
      paint();
      if (!silent && options.onChange) options.onChange(value);
    }

    palette.forEach(function (c) {
      var chip = el("button", "bm-colour-chip");
      chip.type = "button";
      chip.setAttribute("data-c", c);
      chip.style.background = c;
      chip.title = c;
      chip.addEventListener("click", function () { set(c); close(); });
      grid.appendChild(chip);
    });

    function close() { open = false; pop.hidden = true; }
    function toggle() {
      open = !open;
      pop.hidden = !open;
      if (open) input.focus();
    }

    btn.addEventListener("click", function (ev) { ev.stopPropagation(); toggle(); });
    input.addEventListener("change", function () { set(input.value); });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { set(input.value); close(); }
      if (ev.key === "Escape") close();
    });
    document.addEventListener("click", function (ev) {
      if (open && !wrap.contains(ev.target)) close();
    });
    paint();
    return {
      el: wrap,
      get: function () { return value; },
      set: function (next) { set(next, true); },
      open: toggle,
      close: close
    };
  }

  return { create: create, normalize: norm, palette: DEFAULTS.slice() };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Colour;
