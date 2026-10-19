/* BareMetal.Font — font family and size picker. */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Font = (function () {
  "use strict";

  var CSS_ID = "bm-font-css";
  var CSS = [
    ".bm-font{position:relative;display:inline-flex;gap:.3rem;align-items:center;font-family:var(--bs-font-sans,system-ui,sans-serif);font-size:.85rem}",
    ".bm-font-btn,.bm-font-size{border:1px solid var(--bs-border-color,#ddd);background:#fff;border-radius:.35rem;padding:.2rem .45rem;cursor:pointer;font:inherit;min-width:7.5rem;text-align:left}",
    ".bm-font-size{min-width:3.2rem}",
    ".bm-font-pop{position:absolute;z-index:40;top:calc(100% + 6px);left:0;background:#fff;border:1px solid var(--bs-border-color,#ddd);border-radius:.55rem;box-shadow:0 12px 28px rgba(0,0,0,.12);max-height:16rem;overflow:auto;min-width:12rem}",
    ".bm-font-item{display:block;width:100%;text-align:left;border:0;background:transparent;padding:.4rem .7rem;cursor:pointer;font-size:.95rem}",
    ".bm-font-item:hover,.bm-font-item.act{background:var(--bs-light,#fce4ec)}"
  ].join("");

  var FAMILIES = [
    "BareMetalSans", "Wavefunction-Sans", "Wavefunction-Serif", "Georgia, serif",
    "Times New Roman, Times, serif", "Arial, Helvetica, sans-serif", "Segoe UI, system-ui, sans-serif",
    "Trebuchet MS, sans-serif", "Courier New, monospace", "BareMetalMono"
  ];
  var SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36];

  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
    var style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
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
    if (!root) throw new Error("Font target not found.");
    var families = options.families || FAMILIES;
    var sizes = options.sizes || SIZES;
    var family = options.family || families[0];
    var size = options.size || 12;
    var wrap = el("div", "bm-font");
    var btn = el("button", "bm-font-btn");
    btn.type = "button";
    var sizeSel = document.createElement("select");
    sizeSel.className = "bm-font-size";
    var pop = el("div", "bm-font-pop");
    pop.hidden = true;
    wrap.appendChild(btn);
    wrap.appendChild(sizeSel);
    wrap.appendChild(pop);
    root.appendChild(wrap);

    function emit() {
      if (options.onChange) options.onChange({ family: family, size: size });
    }

    function paint() {
      btn.textContent = String(family).split(",")[0];
      btn.style.fontFamily = family;
      sizeSel.value = String(size);
      Array.prototype.forEach.call(pop.children, function (item) {
        item.className = "bm-font-item" + (item.getAttribute("data-f") === family ? " act" : "");
      });
    }

    families.forEach(function (name) {
      var item = el("button", "bm-font-item");
      item.type = "button";
      item.setAttribute("data-f", name);
      item.textContent = name.split(",")[0];
      item.style.fontFamily = name;
      item.addEventListener("click", function () {
        family = name;
        paint();
        pop.hidden = true;
        emit();
      });
      pop.appendChild(item);
    });
    sizes.forEach(function (n) {
      var opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = String(n);
      sizeSel.appendChild(opt);
    });
    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      pop.hidden = !pop.hidden;
    });
    sizeSel.addEventListener("change", function () {
      size = Number(sizeSel.value) || size;
      emit();
    });
    document.addEventListener("click", function (ev) {
      if (!wrap.contains(ev.target)) pop.hidden = true;
    });
    paint();
    return {
      el: wrap,
      get: function () { return { family: family, size: size }; },
      set: function (next) {
        if (!next) return;
        if (next.family) family = next.family;
        if (next.size) size = Number(next.size) || size;
        paint();
      }
    };
  }

  return { create: create, families: FAMILIES.slice(), sizes: SIZES.slice() };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Font;
