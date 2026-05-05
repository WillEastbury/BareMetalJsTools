var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.Markdown = (function () {
  'use strict';

  var D = {
    sanitize: false,
    breaks: false,
    linkTarget: null,
    highlight: null,
    baseUrl: '',
    headerIds: true,
    headerPrefix: '',
    smartypants: false,
    renderers: null
  };

  function o(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function x(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function a(v) { return x(v).replace(/"/g, '&quot;'); }
  function n(v) { return String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/\t/g, '    '); }
  function h(a0, b0) {
    var k, out = {};
    for (k in a0) if (Object.prototype.hasOwnProperty.call(a0, k)) out[k] = a0[k];
    for (k in (b0 || {})) if (Object.prototype.hasOwnProperty.call(b0, k)) out[k] = b0[k];
    return out;
  }
  function t(s) { return s.replace(/^\n+|\n+$/g, ''); }
  function q(s) {
    return String(s || '').replace(/<!--[\s\S]*?-->|<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?>/g, '');
  }
  function p(s) {
    return String(s || '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\[\^([^\]]+)\]/g, '')
      .replace(/(\*\*\*|___|\*\*|__|\*|_|~~)/g, '')
      .replace(/\\(.)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
  function u(s) {
    s = p(s).toLowerCase();
    if (typeof s.normalize === 'function') s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/&[a-z0-9#]+;/gi, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'section';
  }
  function z(base, state) {
    var raw = (state.opts.headerPrefix || '') + u(base);
    var id = raw || (state.opts.headerPrefix || '') + 'section';
    var c = state.ids[id] || 0;
    state.ids[id] = c + 1;
    return c ? id + '-' + c : id;
  }
  function w(url, base) {
    if (!url || !base || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(url)) return url;
    return base.replace(/\/?$/, '/') + url.replace(/^\.\//, '');
  }
  function l(s) {
    return String(s || '')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\.\.\./g, '…')
      .replace(/---/g, '—')
      .replace(/--/g, '–')
      .replace(/(^|[\s\[{(])"/g, '$1“')
      .replace(/"/g, '”')
      .replace(/(^|[\s\[{(])'/g, '$1‘')
      .replace(/'/g, '’');
  }
  function j(s) {
    return String(s || '').split(/(<[^>]+>)/g).map(function (part) {
      return /^<[^>]+>$/.test(part) ? part : l(part);
    }).join('');
  }
  function y(code, lang, state, inlineCode) {
    var out = String(code == null ? '' : code);
    if (!inlineCode && typeof state.opts.highlight === 'function') {
      out = state.opts.highlight(out, lang || '');
      out = out == null ? x(code) : String(out);
    } else out = x(out);
    if (inlineCode) return '<code>' + out + '</code>';
    if (state.opts.renderers && typeof state.opts.renderers.code === 'function') return String(state.opts.renderers.code(out, lang || ''));
    return '<pre><code' + (lang ? ' class="language-' + a(lang) + '"' : '') + '>' + out + '</code></pre>';
  }
  function A(href, title, text, state) {
    href = w(href, state.opts.baseUrl || '');
    if (state.opts.renderers && typeof state.opts.renderers.link === 'function') return String(state.opts.renderers.link(href, title || '', text));
    return '<a href="' + a(href) + '"' + (title ? ' title="' + a(title) + '"' : '') + (state.opts.linkTarget ? ' target="' + a(state.opts.linkTarget) + '" rel="noopener noreferrer"' : '') + '>' + text + '</a>';
  }
  function B(src, alt, title, state) {
    src = w(src, state.opts.baseUrl || '');
    alt = p(alt);
    if (state.opts.renderers && typeof state.opts.renderers.image === 'function') return String(state.opts.renderers.image(src, alt, title || ''));
    return '<img src="' + a(src) + '" alt="' + a(alt) + '"' + (title ? ' title="' + a(title) + '"' : '') + '>';
  }
  function C(text, level, state) {
    var id = state.opts.headerIds === false ? '' : z(text, state);
    if (state.opts.renderers && typeof state.opts.renderers.heading === 'function') return String(state.opts.renderers.heading(text, level, id || null));
    return '<h' + level + (id ? ' id="' + a(id) + '"' : '') + '>' + text + '</h' + level + '>';
  }
  function E(hd, bd, state) {
    if (state.opts.renderers && typeof state.opts.renderers.table === 'function') return String(state.opts.renderers.table(hd, bd));
    return '<table>\n' + hd + '\n' + bd + '\n</table>';
  }
  function F(id, state) {
    var key = String(id || '');
    if (!state.footnotes[key]) return x('[^' + key + ']');
    if (!state.fnIndex[key]) {
      state.fnOrder.push(key);
      state.fnIndex[key] = state.fnOrder.length;
    }
    return '<sup id="fnref-' + a(u(key)) + '"><a href="#fn-' + a(u(key)) + '">' + state.fnIndex[key] + '</a></sup>';
  }
  function G(s, state, depth) {
    s = String(s == null ? '' : s);
    depth = depth || 0;
    if (!s) return '';
    if (depth > 6) return x(s);
    var stash = [];
    function keep(v) { stash.push(v); return '\u001A' + (stash.length - 1) + '\u001A'; }
    function done(v) { return v.replace(/\u001A(\d+)\u001A/g, function (_, i0) { return stash[+i0]; }); }
    if (state.opts.sanitize) s = q(s);
    else s = s.replace(/<!--[\s\S]*?-->|<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?>/g, function (m) { return keep(m); });
    s = s.replace(/\\([\\`*_[\]{}()#+\-.!>~|])/g, function (_, ch) { return keep(x(ch)); });
    s = s.replace(/(`+)([\s\S]*?)\1/g, function (_, __, code) { return keep(y(code, '', state, true)); });
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, src, title) { return keep(B(src, alt, title, state)); });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, text, href, title) { return keep(A(href, title, G(text, state, depth + 1), state)); });
    s = s.replace(/<((?:https?:\/\/|mailto:)[^ >]+)>/g, function (_, href) { return keep(A(href, '', x(href.replace(/^mailto:/i, '')), state)); });
    s = s.replace(/\[\^([^\]]+)\]/g, function (_, id) { return keep(F(id, state)); });
    s = x(s);
    s = s.replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
    s = s.replace(/(\*\*\*|___)(?=\S)([\s\S]*?\S)\1/g, '<strong><em>$2</em></strong>');
    s = s.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>');
    s = s.replace(/(\*|_)(?=\S)([\s\S]*?\S)\1/g, '<em>$2</em>');
    s = s.replace(/(^|[\s(>])((?:https?:\/\/)[^\s<]+[^<.,:;"')\]\s])/g, function (_, pre, href) {
      return pre + A(href, '', x(href), state);
    });
    s = s.replace(/ {2,}\n/g, '<br>\n');
    if (state.opts.breaks) s = s.replace(/\n/g, '<br>\n');
    if (state.opts.smartypants) s = j(s);
    return done(s);
  }
  function H(line) {
    var m = /^(\s*)([*+-]|\d+[.)])\s+(.*)$/.exec(line || '');
    if (!m) return null;
    return {
      indent: m[1].length,
      ordered: /\d/.test(m[2].charAt(0)),
      start: /\d/.test(m[2].charAt(0)) ? parseInt(m[2], 10) : 1,
      text: m[3]
    };
  }
  function I(line) { return /^ {0,3}(#{1,6})\s+(.+)$/.exec(line || ''); }
  function J(line) { return /^ {0,3}(?:([-*_])(?:\s*\1){2,})\s*$/.test(line || ''); }
  function K(line) { return /^ {0,3}```\s*([\w-]+)?\s*$/.exec(line || ''); }
  function L(line) { return /^ {0,3}> ?/.test(line || ''); }
  function M(line) { return /^(?: {4}|\t)/.test(line || ''); }
  function N(arr) {
    while (arr.length && !arr[0].trim()) arr.shift();
    while (arr.length && !arr[arr.length - 1].trim()) arr.pop();
    return arr;
  }
  function O(line) {
    var s = String(line || '').trim();
    if (!s) return [];
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    var out = [], cur = '', code = false, i0, ch;
    for (i0 = 0; i0 < s.length; i0++) {
      ch = s.charAt(i0);
      if (ch === '\\' && s.charAt(i0 + 1) === '|') { cur += '|'; i0++; continue; }
      if (ch === '`') code = !code;
      if (ch === '|' && !code) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  }
  function P(line) {
    var cells = O(line), i0;
    if (!cells.length) return null;
    for (i0 = 0; i0 < cells.length; i0++) if (!/^:?-{3,}:?$/.test(cells[i0])) return null;
    return cells.map(function (c) {
      return c.charAt(0) === ':' && c.charAt(c.length - 1) === ':' ? 'center' : c.charAt(c.length - 1) === ':' ? 'right' : 'left';
    });
  }
  function Q(lines, i0) {
    return i0 + 1 < lines.length && /\|/.test(lines[i0]) && !!P(lines[i0 + 1]);
  }
  function R(lines, i0, state) {
    var info = K(lines[i0]), lang = info && info[1] ? info[1] : '', buf = [], i1 = i0 + 1;
    while (i1 < lines.length && !/^ {0,3}```\s*$/.test(lines[i1])) { buf.push(lines[i1]); i1++; }
    return { html: y(buf.join('\n'), lang, state, false), next: i1 < lines.length ? i1 + 1 : i1 };
  }
  function S(lines, i0, state) {
    var buf = [], i1 = i0;
    while (i1 < lines.length) {
      if (lines[i1].trim() === '') { buf.push(''); i1++; continue; }
      if (!M(lines[i1])) break;
      buf.push(lines[i1].replace(/^(?: {4}|\t)/, ''));
      i1++;
    }
    while (buf.length && buf[buf.length - 1] === '') buf.pop();
    return { html: y(buf.join('\n'), '', state, false), next: i1 };
  }
  function T(lines, i0, state) {
    var m = I(lines[i0]), raw = m[2].replace(/\s+#+\s*$/, ''), text = G(raw, state, 1);
    return { html: C(text, m[1].length, state), next: i0 + 1 };
  }
  function U(lines, i0, state) {
    var buf = [], i1 = i0;
    while (i1 < lines.length && (lines[i1].trim() === '' || L(lines[i1]))) {
      buf.push(L(lines[i1]) ? lines[i1].replace(/^ {0,3}> ?/, '') : '');
      i1++;
    }
    return { html: '<blockquote>\n' + Z(buf.join('\n'), state) + '\n</blockquote>', next: i1 };
  }
  function W(lines, i0, state) {
    var first = H(lines[i0]), base = first.indent, tag = first.ordered ? 'ol' : 'ul', start = first.start, items = [], i1 = i0;
    while (i1 < lines.length) {
      var meta = H(lines[i1]);
      if (!meta || meta.indent !== base || meta.ordered !== first.ordered) break;
      var task = /^\[( |x|X)\]\s+/.exec(meta.text);
      var head = task ? meta.text.slice(task[0].length) : meta.text;
      var part = [head];
      i1++;
      while (i1 < lines.length) {
        var next = H(lines[i1]);
        if (next && next.indent === base) break;
        if (next && next.indent < base) break;
        if (lines[i1].trim() === '') {
          var k0 = i1 + 1;
          while (k0 < lines.length && lines[k0].trim() === '') k0++;
          if (k0 >= lines.length) { i1 = k0; break; }
          var probe = H(lines[k0]);
          var ind = (/^\s*/.exec(lines[k0]) || [''])[0].length;
          if ((probe && probe.indent <= base) || (!probe && ind <= base && !M(lines[k0]) && !L(lines[k0]))) break;
        }
        part.push(lines[i1]);
        i1++;
      }
      var body = Z(N(part).join('\n'), state);
      if (task) {
        var box = '<input type="checkbox" disabled' + (/x/i.test(task[1]) ? ' checked' : '') + '>';
        body = /^<p>[\s\S]*<\/p>$/.test(body) ? body.replace(/^<p>/, '<p>' + box + ' ') : box + (body ? ' ' + body : '');
        items.push('<li class="task-list-item">' + body + '</li>');
      } else items.push('<li>' + body + '</li>');
    }
    return {
      html: '<' + tag + (tag === 'ol' && start !== 1 ? ' start="' + start + '"' : '') + '>\n' + items.join('\n') + '\n</' + tag + '>',
      next: i1
    };
  }
  function X(lines, i0, state) {
    var head = O(lines[i0]), align = P(lines[i0 + 1]), body = [], i1 = i0 + 2, r, c, th = '', tb = '';
    for (c = 0; c < head.length; c++) th += '<th' + (align[c] ? ' style="text-align:' + align[c] + '"' : '') + '>' + G(head[c], state, 1) + '</th>';
    while (i1 < lines.length && lines[i1].trim() && /\|/.test(lines[i1])) {
      r = O(lines[i1]);
      var row = '';
      for (c = 0; c < head.length; c++) row += '<td' + (align[c] ? ' style="text-align:' + align[c] + '"' : '') + '>' + G(r[c] || '', state, 1) + '</td>';
      body.push('<tr>' + row + '</tr>');
      i1++;
    }
    tb = '<tbody>' + body.join('') + '</tbody>';
    return { html: E('<thead><tr>' + th + '</tr></thead>', tb, state), next: i1 };
  }
  function Y(lines, i0, state) {
    var buf = [], i1 = i0;
    while (i1 < lines.length && lines[i1].trim() && !I(lines[i1]) && !K(lines[i1]) && !J(lines[i1]) && !L(lines[i1]) && !H(lines[i1]) && !Q(lines, i1)) {
      buf.push(lines[i1].replace(/^ {0,3}/, ''));
      i1++;
    }
    return { html: '<p>' + G(buf.join('\n'), state, 1) + '</p>', next: i1 };
  }
  function Z(src, state) {
    var lines = n(src).split('\n'), out = [], i0 = 0, tok;
    while (i0 < lines.length) {
      if (!lines[i0].trim()) { i0++; continue; }
      if (K(lines[i0])) tok = R(lines, i0, state);
      else if (I(lines[i0])) tok = T(lines, i0, state);
      else if (J(lines[i0])) tok = { html: '<hr>', next: i0 + 1 };
      else if (L(lines[i0])) tok = U(lines, i0, state);
      else if (Q(lines, i0)) tok = X(lines, i0, state);
      else if (H(lines[i0])) tok = W(lines, i0, state);
      else if (M(lines[i0])) tok = S(lines, i0, state);
      else tok = Y(lines, i0, state);
      out.push(tok.html);
      i0 = tok.next;
    }
    return out.join('\n');
  }
  function $(src, state) {
    var lines = n(src).split('\n'), out = [], i0, m, buf, j0;
    for (i0 = 0; i0 < lines.length; i0++) {
      m = /^\[\^([^\]]+)\]:\s*(.*)$/.exec(lines[i0]);
      if (!m) { out.push(lines[i0]); continue; }
      buf = [m[2]];
      for (j0 = i0 + 1; j0 < lines.length; j0++) {
        if (lines[j0] === '') { buf.push(''); continue; }
        if (/^(?: {4}|\t)/.test(lines[j0])) { buf.push(lines[j0].replace(/^(?: {4}|\t)/, '')); continue; }
        break;
      }
      state.footnotes[m[1]] = t(buf.join('\n'));
      i0 = j0 - 1;
    }
    return out.join('\n');
  }
  function _(state) {
    if (!state.fnOrder.length || state.noFootnotes) return '';
    var items = [], i0, id, body;
    state.noFootnotes = true;
    for (i0 = 0; i0 < state.fnOrder.length; i0++) {
      id = state.fnOrder[i0];
      body = Z(state.footnotes[id] || '', state) || '<p></p>';
      items.push('<li id="fn-' + a(u(id)) + '">' + body + ' <a href="#fnref-' + a(u(id)) + '" class="footnote-backref">↩</a></li>');
    }
    state.noFootnotes = false;
    return '<section class="footnotes">\n<ol>\n' + items.join('\n') + '\n</ol>\n</section>';
  }
  function ee(input, options, inlineOnly) {
    var state = { opts: h(D, options), ids: {}, footnotes: {}, fnOrder: [], fnIndex: {}, noFootnotes: false };
    var src = $(n(input), state);
    var html = inlineOnly ? G(src, state, 0) : Z(src, state);
    if (!inlineOnly) {
      var notes = _(state);
      if (notes) html += (html ? '\n' : '') + notes;
    }
    return html;
  }
  function render(input, options) { return ee(input, options, false); }
  function inline(input, options) { return ee(input, options, true); }
  function renderTo(el, input, options) { if (el) el.innerHTML = render(input, options); return el; }
  function renderSafe(el, input, options) { if (el) el.innerHTML = render(input, h(options || {}, { sanitize: true })); return el; }
  function createRenderer(options) {
    var buf = '';
    return {
      write: function (chunk) { buf += String(chunk == null ? '' : chunk); return this; },
      flush: function () { var out = render(buf, options); buf = ''; return out; }
    };
  }
  function frontMatter(input) {
    var src = n(input), lines = src.split('\n'), i0, meta = {}, m, key;
    if (lines[0] !== '---') return { meta: {}, content: src };
    for (i0 = 1; i0 < lines.length; i0++) if (lines[i0] === '---') break;
    if (i0 >= lines.length) return { meta: {}, content: src };
    function val(v) {
      if (/^['"].*['"]$/.test(v)) return v.slice(1, -1);
      if (/^(true|false)$/i.test(v)) return /^true$/i.test(v);
      if (/^null$/i.test(v)) return null;
      if (/^-?\d+(?:\.\d+)?$/.test(v)) return +v;
      return v;
    }
    for (var j0 = 1; j0 < i0; j0++) {
      m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[j0]);
      if (m) {
        key = m[1];
        meta[key] = m[2] ? val(m[2]) : [];
      } else if (key && Array.isArray(meta[key]) && /^\s*-\s+/.test(lines[j0])) meta[key].push(val(lines[j0].replace(/^\s*-\s+/, '')));
    }
    return { meta: meta, content: lines.slice(i0 + 1).join('\n') };
  }
  function toc(input, options) {
    var src = frontMatter(input).content;
    var opts = h(D, options), lines = n(src).split('\n'), list = [], ids = {}, i0, m, fence = false, raw, text, id, temp = { opts: opts, ids: ids };
    for (i0 = 0; i0 < lines.length; i0++) {
      if (K(lines[i0])) { fence = !fence; continue; }
      if (fence) continue;
      m = I(lines[i0]);
      if (!m) continue;
      raw = m[2].replace(/\s+#+\s*$/, '');
      text = p(raw);
      id = opts.headerIds === false ? null : z(text, temp);
      list.push({ level: m[1].length, text: text, id: id });
    }
    return list;
  }

  return {
    render: render,
    renderTo: renderTo,
    renderSafe: renderSafe,
    createRenderer: createRenderer,
    toc: toc,
    frontMatter: frontMatter,
    inline: inline,
    escape: x
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Markdown;
