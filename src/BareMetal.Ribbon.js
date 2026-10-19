/* BareMetal.Ribbon — compact command bar (a ribbon alternative). */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Ribbon = (function () {
  "use strict";

  var CSS_ID = "bm-ribbon-css";
  var CSS = [
    ".bm-ribbon{display:flex;flex-wrap:wrap;gap:.55rem 1rem;align-items:flex-end;padding:.45rem .7rem;background:var(--bs-light,#fce4ec);border-bottom:1px solid var(--bs-border-color,#f8bbd0);font-family:var(--bs-font-sans,system-ui,sans-serif)}",
    ".bm-ribbon-group{display:flex;flex-direction:column;gap:.2rem;min-width:0}",
    ".bm-ribbon-label{font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:var(--bs-secondary-color,#a06080)}",
    ".bm-ribbon-items{display:flex;flex-wrap:wrap;gap:.28rem;align-items:center}",
    ".bm-ribbon-btn{border:1px solid transparent;background:#fff;border-radius:.4rem;padding:.28rem .55rem;cursor:pointer;font:inherit;font-size:.85rem;min-height:1.85rem}",
    ".bm-ribbon-btn:hover{border-color:var(--bs-primary,#e91e8c)}",
    ".bm-ribbon-btn.act{background:var(--bs-primary,#e91e8c);color:#fff}",
    ".bm-ribbon-btn:disabled{opacity:.45;cursor:default}",
    ".bm-ribbon-sep{width:1px;align-self:stretch;background:var(--bs-border-color,#f8bbd0);margin:0 .2rem}"
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
    if (!root) throw new Error("Ribbon target not found.");
    var bar = el("div", "bm-ribbon");
    if (options.className) bar.className += " " + options.className;
    var byId = {};
    var groups = options.groups || [];
    root.appendChild(bar);

    function command(id, extra) {
      var item = byId[id] && byId[id].def;
      if (options.onCommand) options.onCommand(id, item, extra);
    }

    groups.forEach(function (group) {
      var g = el("div", "bm-ribbon-group");
      if (group.label) {
        var lab = el("div", "bm-ribbon-label");
        lab.textContent = group.label;
        g.appendChild(lab);
      }
      var row = el("div", "bm-ribbon-items");
      (group.items || []).forEach(function (item) {
        if (!item) return;
        if (item.type === "separator" || item.id === "-") {
          row.appendChild(el("span", "bm-ribbon-sep"));
          return;
        }
        var slot = el("span", "bm-ribbon-slot");
        var rec = { def: item, el: slot };
        if (item.type === "colour" && BareMetal.Colour) {
          rec.ctl = BareMetal.Colour.create(slot, {
            value: item.value,
            title: item.label || item.id,
            onChange: function (value) {
              item.value = value;
              if (options.onChange) options.onChange(item.id, value, item);
              command(item.id, { value: value });
            }
          });
        } else if (item.type === "font" && BareMetal.Font) {
          rec.ctl = BareMetal.Font.create(slot, {
            family: item.family,
            size: item.size,
            onChange: function (value) {
              item.family = value.family;
              item.size = value.size;
              if (options.onChange) options.onChange(item.id, value, item);
              command(item.id, value);
            }
          });
        } else {
          var btn = el("button", "bm-ribbon-btn");
          btn.type = "button";
          btn.textContent = item.label || item.id;
          if (item.title) btn.title = item.title;
          if (item.toggle && item.active) btn.className += " act";
          btn.disabled = !!item.disabled;
          btn.addEventListener("click", function () {
            if (item.toggle) {
              item.active = !item.active;
              btn.className = "bm-ribbon-btn" + (item.active ? " act" : "");
            }
            command(item.id, { active: item.active });
          });
          rec.btn = btn;
          slot.appendChild(btn);
        }
        byId[item.id] = rec;
        row.appendChild(slot);
      });
      g.appendChild(row);
      bar.appendChild(g);
    });

    return {
      el: bar,
      item: function (id) { return byId[id] ? byId[id].def : null; },
      setActive: function (id, on) {
        var rec = byId[id];
        if (!rec || !rec.def) return;
        rec.def.active = !!on;
        if (rec.btn) rec.btn.className = "bm-ribbon-btn" + (on ? " act" : "");
      },
      setDisabled: function (id, on) {
        var rec = byId[id];
        if (rec && rec.btn) rec.btn.disabled = !!on;
      },
      setColour: function (id, value) {
        var rec = byId[id];
        if (rec && rec.ctl && rec.ctl.set) rec.ctl.set(value);
      },
      setFont: function (id, value) {
        var rec = byId[id];
        if (rec && rec.ctl && rec.ctl.set) rec.ctl.set(value);
      }
    };
  }

  return { create: create };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Ribbon;
