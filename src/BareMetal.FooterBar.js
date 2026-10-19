/* BareMetal.FooterBar — status, sheet tabs, and zoom. */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.FooterBar = (function () {
  "use strict";

  var CSS_ID = "bm-footerbar-css";
  var CSS = [
    ".bm-footer{display:flex;align-items:center;gap:.7rem;padding:.25rem .6rem;background:var(--bs-light,#fce4ec);border-top:1px solid var(--bs-border-color,#f8bbd0);font-family:var(--bs-font-sans,system-ui,sans-serif);font-size:.82rem;color:var(--bs-body-color,#4a2040)}",
    ".bm-footer-status{color:var(--bs-secondary-color,#a06080);min-width:6rem}",
    ".bm-footer-tabs{display:flex;gap:.2rem;flex:1;min-width:0;overflow:auto}",
    ".bm-footer-tab{border:1px solid transparent;background:transparent;border-radius:.4rem .4rem 0 0;padding:.25rem .7rem;cursor:pointer;font:inherit}",
    ".bm-footer-tab.act{background:#fff;border-color:var(--bs-border-color,#f8bbd0);border-bottom-color:#fff}",
    ".bm-footer-zoom{display:flex;align-items:center;gap:.35rem}",
    ".bm-footer-zoom input{width:7rem}"
  ].join("");

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
    if (!root) throw new Error("FooterBar target not found.");
    var bar = el("div", "bm-footer");
    var status = el("div", "bm-footer-status");
    var tabsEl = el("div", "bm-footer-tabs");
    var zoomWrap = el("div", "bm-footer-zoom");
    var zoomLabel = el("span");
    zoomLabel.textContent = "Zoom";
    var zoom = document.createElement("input");
    zoom.type = "range";
    zoom.min = String(options.minZoom || 50);
    zoom.max = String(options.maxZoom || 200);
    zoom.value = String(options.zoom || 100);
    var zoomVal = el("span");
    zoomWrap.appendChild(zoomLabel);
    zoomWrap.appendChild(zoom);
    zoomWrap.appendChild(zoomVal);
    bar.appendChild(status);
    bar.appendChild(tabsEl);
    bar.appendChild(zoomWrap);
    root.appendChild(bar);
    var tabs = (options.tabs || []).map(function (t) { return { id: t.id, label: t.label || t.id, active: !!t.active }; });
    var currentZoom = Number(zoom.value) || 100;

    function paintStatus() {
      status.textContent = options.status || "Ready";
    }
    function paintZoom() {
      zoomVal.textContent = currentZoom + "%";
      zoom.value = String(currentZoom);
    }
    function paintTabs() {
      tabsEl.innerHTML = "";
      tabs.forEach(function (tab) {
        var btn = el("button", "bm-footer-tab" + (tab.active ? " act" : ""));
        btn.type = "button";
        btn.textContent = tab.label;
        btn.addEventListener("click", function () {
          tabs.forEach(function (item) { item.active = item.id === tab.id; });
          paintTabs();
          if (options.onTab) options.onTab(tab.id, tab);
        });
        tabsEl.appendChild(btn);
      });
    }

    zoom.addEventListener("input", function () {
      currentZoom = Number(zoom.value) || currentZoom;
      paintZoom();
      if (options.onZoom) options.onZoom(currentZoom);
    });

    paintStatus();
    paintTabs();
    paintZoom();
    return {
      el: bar,
      setStatus: function (text) { options.status = text; paintStatus(); },
      setTabs: function (next) {
        tabs = (next || []).map(function (t) { return { id: t.id, label: t.label || t.id, active: !!t.active }; });
        paintTabs();
      },
      setZoom: function (n) { currentZoom = Number(n) || currentZoom; paintZoom(); },
      getZoom: function () { return currentZoom; }
    };
  }

  return { create: create };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.FooterBar;
