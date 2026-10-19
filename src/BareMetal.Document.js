/* BareMetal.Document — semantic HTML rich-text editor (not RTF). */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Document = (function () {
  "use strict";

  var CSS_ID = "bm-document-css";
  var CSS = [
    ".bm-doc{display:flex;flex-direction:column;min-height:0;height:100%;background:#fff;border:1px solid var(--bs-border-color,#f8bbd0);border-radius:.6rem;font-family:var(--bs-font-sans,system-ui,sans-serif)}",
    ".bm-doc-page{flex:1;overflow:auto;padding:1.4rem 1.6rem;min-height:16rem;outline:0;color:var(--bs-body-color,#4a2040);line-height:1.55}",
    ".bm-doc-page:focus{box-shadow:inset 0 0 0 2px rgba(233,30,140,.2)}",
    ".bm-doc-page h1,.bm-doc-page h2,.bm-doc-page h3{margin:.4rem 0 .5rem}",
    ".bm-doc-page p{margin:0 0 .7rem}",
    ".bm-doc-page ul,.bm-doc-page ol{margin:0 0 .7rem;padding-left:1.3rem}"
  ].join("");

  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
    var style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function sanitize(html) {
    var wrap = document.createElement("div");
    wrap.innerHTML = String(html || "");
    wrap.querySelectorAll("script,style,iframe,object,link,meta").forEach(function (n) { n.remove(); });
    wrap.querySelectorAll("*").forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        if (name.indexOf("on") === 0 || (name === "href" && /^\s*javascript:/i.test(attr.value))) n.removeAttribute(attr.name);
      });
    });
    return wrap.innerHTML;
  }

  function create(target, options) {
    ensureCss();
    options = options || {};
    var root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) throw new Error("Document target not found.");
    var wrap = document.createElement("div");
    wrap.className = "bm-doc";
    var page = document.createElement("div");
    page.className = "bm-doc-page";
    page.contentEditable = "true";
    page.spellcheck = true;
    page.innerHTML = sanitize(options.html || "<p></p>");
    wrap.appendChild(page);
    root.appendChild(wrap);
    var last = page.innerHTML;

    function emit() {
      var html = sanitize(page.innerHTML);
      if (html === last) return;
      var prev = last;
      last = html;
      if (options.onChange) options.onChange(html, prev);
    }

    page.addEventListener("input", emit);
    page.addEventListener("blur", emit);

    function cmd(name, value) {
      page.focus();
      try { document.execCommand(name, false, value); } catch (err) { /* execCommand missing */ }
      emit();
    }

    return {
      el: wrap,
      page: page,
      getHTML: function () { return sanitize(page.innerHTML); },
      setHTML: function (html, silent) {
        page.innerHTML = sanitize(html);
        last = page.innerHTML;
        if (!silent && options.onChange) options.onChange(last, last);
      },
      command: cmd,
      bold: function () { cmd("bold"); },
      italic: function () { cmd("italic"); },
      underline: function () { cmd("underline"); },
      heading: function (n) { cmd("formatBlock", "H" + (n || 1)); },
      paragraph: function () { cmd("formatBlock", "P"); },
      list: function (ordered) { cmd(ordered ? "insertOrderedList" : "insertUnorderedList"); },
      color: function (hex) { cmd("foreColor", hex); },
      hilite: function (hex) { cmd("hiliteColor", hex); try { cmd("backColor", hex); } catch (err) {} },
      font: function (name) { cmd("fontName", name); },
      fontSize: function (n) { cmd("fontSize", n > 6 ? 6 : n); },
      query: function (name) {
        try { return document.queryCommandState(name); } catch (err) { return false; }
      }
    };
  }

  return { create: create, sanitize: sanitize };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Document;
