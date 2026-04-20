// BareMetalBind — reactive Proxy state and m-* directive binder
// Directives: m-value, m-text, m-if, m-click, m-submit, m-class, m-attr,
//             m-each (keyed), m-navbar, m-transition, m-expression,
//             m-toast, m-img, m-gantt, m-table, m-tree
// API: reactive(initial) → { state, watch, data }
//      bind(root, state, watch)
//      formatters   – registry object for pipe transforms
const BareMetalBind = (() => {
  'use strict';

  // ── Formatter registry ──────────────────────────────────────────────
  const formatters = {};

  // ── Path helpers ────────────────────────────────────────────────────
  function getPath(obj, path) {
    const segs = path.split('.');
    let cur = obj;
    for (let i = 0; i < segs.length && cur != null; i++) cur = cur[segs[i]];
    return cur;
  }

  function setPath(obj, path, val) {
    const segs = path.split('.');
    let cur = obj;
    for (let i = 0; i < segs.length - 1; i++) {
      if (cur[segs[i]] == null) cur[segs[i]] = {};
      cur = cur[segs[i]];
    }
    cur[segs[segs.length - 1]] = val;
  }

  function topKey(path) { return path.split('.')[0]; }

  // ── Binding expression parser ───────────────────────────────────────
  // "path|fmt1|fmt2:arg" → { path, pipes:[{name,arg}] }
  function parseBinding(expr) {
    const parts = expr.split('|').map(s => s.trim());
    const path = parts[0];
    const pipes = [];
    for (let i = 1; i < parts.length; i++) {
      const ci = parts[i].indexOf(':');
      if (ci < 0) pipes.push({ name: parts[i], arg: undefined });
      else pipes.push({ name: parts[i].slice(0, ci).trim(), arg: parts[i].slice(ci + 1).trim() });
    }
    return { path, pipes };
  }

  function applyPipes(val, pipes) {
    for (const p of pipes) {
      const fn = formatters[p.name];
      if (typeof fn === 'function') val = fn(val, p.arg);
    }
    return val;
  }

  // ── Scope-aware value resolution ────────────────────────────────────
  // scope: { item, index, parent, root } | undefined
  function resolveInScope(path, state, scope) {
    if (scope) {
      if (path === '.') return scope.item;
      if (path === '.index') return scope.index;
      if (path === '.parent') return scope.parent;
      if (path === '.root') return scope.root;
      if (path.startsWith('.root.')) return getPath(scope.root, path.slice(6));
      if (path.startsWith('.parent.')) return getPath(scope.parent, path.slice(8));
      if (path.startsWith('.')) return getPath(scope.item, path.slice(1));
    }
    return getPath(state, path);
  }

  // Full resolve: parse binding, resolve in scope, apply pipes.
  function resolveBinding(expr, state, scope) {
    const { path, pipes } = parseBinding(expr);
    const val = resolveInScope(path, state, scope);
    return pipes.length ? applyPipes(val, pipes) : val;
  }

  // ── Reactive arrays ─────────────────────────────────────────────────
  const ARRAY_MUTATORS = ['push','pop','shift','unshift','splice','sort','reverse'];

  function wrapArray(arr, notify) {
    return new Proxy(arr, {
      get(t, p) {
        if (ARRAY_MUTATORS.includes(p)) {
          return function (...args) {
            const result = Array.prototype[p].apply(t, args);
            notify();
            return result;
          };
        }
        return t[p];
      },
      set(t, p, v) { t[p] = v; notify(); return true; }
    });
  }

  // ── Parse "name:stateKey,name2:stateKey2" pairs ─────────────────────
  function parsePairs(attr) {
    return attr.split(',').map(p => {
      const i = p.indexOf(':');
      return i < 0 ? null : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }).filter(Boolean);
  }

  // ── reactive() ──────────────────────────────────────────────────────
  function reactive(initial) {
    const L = new Map();
    const notify = k => (L.get(k) || []).forEach(fn => fn());
    const watch  = (k, fn) => { L.has(k) || L.set(k, []); L.get(k).push(fn); };
    const data   = { ...initial };

    // Wrap any initial arrays
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k])) data[k] = wrapArray(data[k], () => notify(k));
    }

    const state  = new Proxy(data, {
      set(t, k, v) {
        // auto-wrap arrays assigned later
        t[k] = Array.isArray(v) ? wrapArray(v, () => notify(k)) : v;
        notify(k);
        return true;
      }
    });
    return { state, watch, data };
  }

  // ── Transition helpers ──────────────────────────────────────────────
  function transitionIn(el, name) {
    el.style.display = '';
    const enter = name ? name + '-enter' : 'm-enter';
    const active = name ? name + '-enter-active' : 'm-enter-active';
    el.classList.add(enter);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add(active);
        el.classList.remove(enter);
        const done = () => { el.classList.remove(active); el.removeEventListener('transitionend', done); };
        el.addEventListener('transitionend', done);
      });
    });
  }

  function transitionOut(el, name, cb) {
    const leave = name ? name + '-leave' : 'm-leave';
    const active = name ? name + '-leave-active' : 'm-leave-active';
    el.classList.add(leave);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add(active);
        el.classList.remove(leave);
        const done = () => {
          el.classList.remove(active);
          el.removeEventListener('transitionend', done);
          cb();
        };
        el.addEventListener('transitionend', done);
      });
    });
  }

  // ── Apply directives to a row (non-reactive, for m-each) ───────────
  function applyRow(el, state, scope) {
    el.querySelectorAll('[m-text]').forEach(n => {
      n.textContent = resolveBinding(n.getAttribute('m-text'), state, scope) ?? '';
    });
    el.querySelectorAll('[m-class]').forEach(n => {
      parsePairs(n.getAttribute('m-class')).forEach(([cls, k]) => {
        n.classList.toggle(cls, !!resolveInScope(k, state, scope));
      });
    });
    el.querySelectorAll('[m-attr]').forEach(n => {
      parsePairs(n.getAttribute('m-attr')).forEach(([attr, k]) => {
        const v = resolveInScope(k, state, scope);
        if (v == null || v === false) n.removeAttribute(attr);
        else n.setAttribute(attr, v === true ? '' : String(v));
      });
    });
    el.querySelectorAll('[m-if]').forEach(n => {
      const vis = !!resolveInScope(n.getAttribute('m-if'), state, scope);
      n.style.display = vis ? '' : 'none';
    });
  }

  // ── m-expression helpers ────────────────────────────────────────────
  // "target = expr" → { target, expr, deps[] }
  function parseExpression(raw) {
    const eq = raw.indexOf('=');
    if (eq < 0) return null;
    const target = raw.slice(0, eq).trim();
    const expr = raw.slice(eq + 1).trim();
    // Extract top-level identifiers from RHS (skip dotted suffixes, strings, numbers)
    const ids = new Set();
    expr.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, (m, id) => {
      if (!/^(true|false|null|undefined|NaN|Infinity|Math|Date|Number|String|Boolean|Array|Object|parseInt|parseFloat|isNaN|isFinite)$/.test(id)) {
        ids.add(id);
      }
    });
    return { target, expr, deps: [...ids] };
  }

  // ── bind() ──────────────────────────────────────────────────────────
  function bind(root, state, watch) {

    // ── m-expression (process first so computed values exist for other directives) ──
    root.querySelectorAll('[m-expression]').forEach(n => {
      const parsed = parseExpression(n.getAttribute('m-expression'));
      if (!parsed) return;
      const { target, expr, deps } = parsed;
      const argNames = deps.slice();
      const fn = new Function(...argNames, `return (${expr});`);
      const evaluate = () => {
        try {
          const args = argNames.map(d => getPath(state, d));
          const result = fn(...args);
          setPath(state, target, result);
        } catch (_) { /* silently skip eval errors */ }
      };
      evaluate();
      const watchKeys = new Set(deps.map(d => topKey(d)));
      // Don't watch target's own key if it's also a dep (avoid infinite loop)
      const targetTop = topKey(target);
      watchKeys.delete(targetTop);
      watchKeys.forEach(k => watch(k, evaluate));
    });

    // ── m-value (two-way, no formatters) ──
    root.querySelectorAll('[m-value]').forEach(n => {
      const path = n.getAttribute('m-value'), chk = n.type === 'checkbox';
      const isDate = n.type === 'date', isDtLocal = n.type === 'datetime-local';
      const wk = topKey(path);
      const fmt = v => {
        if (v == null || v === '') return '';
        if (isDate) return String(v).slice(0, 10);
        if (isDtLocal) return String(v).slice(0, 16);
        return String(v);
      };
      const sync = () => {
        const v = getPath(state, path);
        if (chk) { n.checked = !!v; }
        else { const s = fmt(v); if (n.value !== s) n.value = s; }
      };
      sync(); watch(wk, sync);
      n.addEventListener(chk ? 'change' : 'input', () => {
        setPath(state, path, chk ? n.checked : n.value);
      });
    });

    // ── m-img (reactive src + lazy loading + fallback) ──
    // Usage: <img m-img="user.avatar" m-img-fallback="/placeholder.png" m-img-lazy>
    root.querySelectorAll('[m-img]').forEach(n => {
      const path = n.getAttribute('m-img'), wk = topKey(path);
      const fallback = n.getAttribute('m-img-fallback') || '';
      const lazy = n.hasAttribute('m-img-lazy');
      const tag = n.tagName;

      function applySrc(src) {
        const url = src || fallback;
        if (tag === 'IMG') {
          n.src = url || '';
          if (!url) n.removeAttribute('src');
        } else {
          n.style.backgroundImage = url ? 'url(' + url + ')' : '';
        }
      }

      function onError() {
        if (fallback && n.src !== fallback) n.src = fallback;
      }

      if (tag === 'IMG') {
        if (fallback) n.addEventListener('error', onError);
        if (lazy && typeof IntersectionObserver !== 'undefined') {
          n.setAttribute('loading', 'lazy');
          let revealed = false;
          const obs = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) { revealed = true; applySrc(getPath(state, path)); obs.disconnect(); }
          }, { rootMargin: '200px' });
          obs.observe(n);
          const sync = () => { if (revealed) applySrc(getPath(state, path)); };
          sync(); watch(wk, sync);
          return;
        }
      }

      const sync = () => applySrc(getPath(state, path));
      sync(); watch(wk, sync);
    });

    // ── m-text ──
    root.querySelectorAll('[m-text]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      const expr = n.getAttribute('m-text');
      const { path } = parseBinding(expr);
      const wk = topKey(path);
      const sync = () => n.textContent = resolveBinding(expr, state) ?? '';
      sync(); watch(wk, sync);
    });

    // ── m-if (with m-transition support) ──
    root.querySelectorAll('[m-if]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      const k = n.getAttribute('m-if'), wk = topKey(k);
      const trName = n.getAttribute('m-transition') || null;
      const hasTr = n.hasAttribute('m-transition');
      let visible = !!getPath(state, k);
      n.style.display = visible ? '' : 'none';
      watch(wk, () => {
        const next = !!getPath(state, k);
        if (next === visible) return;
        visible = next;
        if (!hasTr) { n.style.display = next ? '' : 'none'; return; }
        if (next) transitionIn(n, trName);
        else transitionOut(n, trName, () => { n.style.display = 'none'; });
      });
    });

    // ── m-class ──
    root.querySelectorAll('[m-class]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      parsePairs(n.getAttribute('m-class')).forEach(([cls, k]) => {
        const wk = topKey(k);
        const sync = () => n.classList.toggle(cls, !!getPath(state, k));
        sync(); watch(wk, sync);
      });
    });

    // ── m-attr ──
    root.querySelectorAll('[m-attr]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      parsePairs(n.getAttribute('m-attr')).forEach(([attr, k]) => {
        const wk = topKey(k);
        const sync = () => {
          const v = getPath(state, k);
          if (v == null || v === false) n.removeAttribute(attr);
          else n.setAttribute(attr, v === true ? '' : String(v));
        };
        sync(); watch(wk, sync);
      });
    });

    // ── m-each (keyed diffing) ──
    root.querySelectorAll('[m-each]').forEach(n => {
      const raw = n.getAttribute('m-each');
      const keyMatch = raw.match(/^(\S+)\s+key:(\S+)$/);
      const arrKey = keyMatch ? keyMatch[1] : raw.trim();
      const keyProp = keyMatch ? keyMatch[2] : null;
      const wk = topKey(arrKey);
      const tpl = n.querySelector('template');
      if (!tpl) return;
      const frag = tpl.content;

      // Map of keyValue → { el, item } for keyed diffing
      let rowMap = new Map();

      function makeRow(item, index, parentScope) {
        const scope = { item, index, parent: parentScope ? parentScope.item : undefined, root: state };
        const clone = frag.cloneNode(true);
        const wrap = document.createElement('div');
        wrap.appendChild(clone);
        applyRow(wrap, state, scope);
        // Use first element child as the row root (for keyed reuse)
        const el = wrap.firstElementChild || wrap.firstChild;
        if (el) el.__bmScope = scope;
        return { el, wrap };
      }

      function updateRow(el, item, index, parentScope) {
        const scope = { item, index, parent: parentScope ? parentScope.item : undefined, root: state };
        el.__bmScope = scope;
        // Re-apply directives to the existing element
        const container = document.createElement('div');
        container.appendChild(el);
        applyRow(container, state, scope);
        return container.firstElementChild || container.firstChild;
      }

      const render = () => {
        const arr = getPath(state, arrKey);
        if (!Array.isArray(arr)) {
          // Clear all rendered children
          Array.from(n.children).forEach(c => { if (c !== tpl) n.removeChild(c); });
          rowMap.clear();
          return;
        }

        if (keyProp) {
          // ── Keyed diff ──
          const newMap = new Map();
          const newOrder = [];
          arr.forEach((item, index) => {
            const kv = typeof item === 'object' && item ? item[keyProp] : item;
            const existing = rowMap.get(kv);
            let el;
            if (existing) {
              el = updateRow(existing.el, item, index, undefined);
            } else {
              const row = makeRow(item, index, undefined);
              el = row.el;
            }
            newMap.set(kv, { el, item });
            newOrder.push(el);
          });
          // Remove old rows not in new set
          for (const [kv, { el }] of rowMap) {
            if (!newMap.has(kv) && el && el.parentNode) el.parentNode.removeChild(el);
          }
          // Append in correct order (insertBefore reorders existing nodes)
          newOrder.forEach(el => { if (el) n.appendChild(el); });
          rowMap = newMap;
        } else {
          // ── Full rebuild (no key) ──
          Array.from(n.children).forEach(c => { if (c !== tpl) n.removeChild(c); });
          rowMap.clear();
          arr.forEach((item, index) => {
            const { wrap } = makeRow(item, index, undefined);
            while (wrap.firstChild) n.appendChild(wrap.firstChild);
          });
        }
      };
      render(); watch(wk, render);
    });

    // ── m-navbar ──
    root.querySelectorAll('[m-navbar]').forEach(n => {
      const k = n.getAttribute('m-navbar'), wk = topKey(k);
      const mkLink = link => {
        const a = document.createElement('a');
        a.href = link.href || '#';
        a.textContent = link.text || '';
        if (link.active) a.classList.add('active');
        return a;
      };
      const render = () => {
        n.innerHTML = '';
        const arr = getPath(state, k);
        if (!Array.isArray(arr)) return;
        arr.forEach(item => {
          if (Array.isArray(item)) {
            const dd = document.createElement('div');
            dd.classList.add('dropdown');
            const btn = document.createElement('button');
            btn.className = 'dropdown-toggle';
            btn.textContent = item[0] || '';
            dd.appendChild(btn);
            const menu = document.createElement('div');
            menu.className = 'dropdown-menu';
            for (let i = 1; i < item.length; i++) menu.appendChild(mkLink(item[i]));
            dd.appendChild(menu);
            n.appendChild(dd);
          } else {
            n.appendChild(mkLink(item));
          }
        });
      };
      render(); watch(wk, render);
    });

    // ── m-gantt (array → timeline Gantt chart) ──
    // Usage: <div m-gantt="tasks"></div>
    // State: [{ label:'Design', start:'2025-01-01', end:'2025-01-15', group:'Phase 1', color:'#0d6efd', progress:0.6 }]
    root.querySelectorAll('[m-gantt]').forEach(n => {
      const arrKey = n.getAttribute('m-gantt'), wk = topKey(arrKey);
      const labelField = n.getAttribute('m-gantt-label') || 'label';
      const startField = n.getAttribute('m-gantt-start') || 'start';
      const endField = n.getAttribute('m-gantt-end') || 'end';
      const groupField = n.getAttribute('m-gantt-group') || 'group';
      const rowH = 32, headerH = 40, padL = 180, padR = 20;

      function toDay(s) { return Math.floor(new Date(s).getTime() / 864e5); }

      function render() {
        var arr = getPath(state, arrKey);
        n.innerHTML = '';
        n.classList.add('bm-gantt');
        if (!Array.isArray(arr) || arr.length === 0) return;

        // Compute date range
        var minD = Infinity, maxD = -Infinity;
        arr.forEach(function(t) {
          var s = toDay(t[startField]), e = toDay(t[endField]);
          if (s < minD) minD = s;
          if (e > maxD) maxD = e;
        });
        var span = maxD - minD || 1;

        // Group tasks
        var groups = [], groupMap = {}, ordered = [];
        arr.forEach(function(t) {
          var g = t[groupField] || '';
          if (g && !groupMap[g]) { groupMap[g] = true; groups.push(g); }
        });
        groups.forEach(function(g) {
          ordered.push({ _groupHeader: g });
          arr.forEach(function(t) { if ((t[groupField] || '') === g) ordered.push(t); });
        });
        arr.forEach(function(t) { if (!(t[groupField] || '')) ordered.push(t); });

        var totalH = headerH + ordered.length * rowH + 4;
        var chartW = Math.max(n.clientWidth || 600, 400);
        var barArea = chartW - padL - padR;

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('viewBox', '0 0 ' + chartW + ' ' + totalH);
        svg.style.fontFamily = 'system-ui,sans-serif';
        svg.style.fontSize = '12px';

        // Header month markers
        var d0 = new Date(minD * 864e5), dEnd = new Date(maxD * 864e5);
        var cur = new Date(d0.getFullYear(), d0.getMonth(), 1);
        while (cur <= dEnd) {
          var dx = toDay(cur) - minD;
          var x = padL + (dx / span) * barArea;
          if (x >= padL) {
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x); line.setAttribute('x2', x);
            line.setAttribute('y1', headerH); line.setAttribute('y2', totalH);
            line.setAttribute('stroke', '#dee2e6'); line.setAttribute('stroke-dasharray', '3,3');
            svg.appendChild(line);
            var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', x + 4); txt.setAttribute('y', headerH - 8);
            txt.setAttribute('fill', '#6c757d'); txt.setAttribute('font-size', '11');
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            txt.textContent = months[cur.getMonth()] + ' ' + cur.getFullYear();
            svg.appendChild(txt);
          }
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }

        // Rows
        ordered.forEach(function(item, i) {
          var y = headerH + i * rowH;

          // Zebra stripe
          if (i % 2 === 0) {
            var bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('x', 0); bg.setAttribute('y', y);
            bg.setAttribute('width', chartW); bg.setAttribute('height', rowH);
            bg.setAttribute('fill', '#f8f9fa');
            svg.appendChild(bg);
          }

          if (item._groupHeader) {
            var gt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            gt.setAttribute('x', 8); gt.setAttribute('y', y + rowH * 0.65);
            gt.setAttribute('font-weight', '700'); gt.setAttribute('fill', '#212529');
            gt.textContent = item._groupHeader;
            svg.appendChild(gt);
            return;
          }

          // Label
          var lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          lbl.setAttribute('x', 12); lbl.setAttribute('y', y + rowH * 0.65);
          lbl.setAttribute('fill', '#495057');
          var labelText = item[labelField] || '';
          if (labelText.length > 22) labelText = labelText.substring(0, 20) + '…';
          lbl.textContent = labelText;
          svg.appendChild(lbl);

          // Bar
          var s = toDay(item[startField]) - minD, e = toDay(item[endField]) - minD;
          var bx = padL + (s / span) * barArea;
          var bw = Math.max(((e - s) / span) * barArea, 4);
          var by = y + 6, bh = rowH - 12;
          var color = item.color || 'var(--bs-primary, #0d6efd)';

          // Background bar
          var bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bar.setAttribute('x', bx); bar.setAttribute('y', by);
          bar.setAttribute('width', bw); bar.setAttribute('height', bh);
          bar.setAttribute('rx', 3); bar.setAttribute('fill', color);
          bar.setAttribute('opacity', '0.25');
          svg.appendChild(bar);

          // Progress fill
          var prog = item.progress != null ? item.progress : 1;
          if (prog > 0) {
            var pbar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            pbar.setAttribute('x', bx); pbar.setAttribute('y', by);
            pbar.setAttribute('width', bw * Math.min(prog, 1)); pbar.setAttribute('height', bh);
            pbar.setAttribute('rx', 3); pbar.setAttribute('fill', color);
            svg.appendChild(pbar);
          }

          // Milestone diamond (if start === end)
          if (s === e) {
            bar.setAttribute('width', 0);
            var dia = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            var cx = bx, cy = by + bh / 2, r = bh / 2;
            dia.setAttribute('points', cx + ',' + (cy - r) + ' ' + (cx + r) + ',' + cy + ' ' + cx + ',' + (cy + r) + ' ' + (cx - r) + ',' + cy);
            dia.setAttribute('fill', color);
            svg.appendChild(dia);
          }

          // Tooltip title
          var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          title.textContent = (item[labelField] || '') + '\n' + item[startField] + ' → ' + item[endField] +
            (prog != null && prog < 1 ? '\nProgress: ' + Math.round(prog * 100) + '%' : '');
          bar.appendChild(title.cloneNode(true));
          if (prog > 0 && pbar) pbar.appendChild(title);
        });

        n.appendChild(svg);
      }

      render(); watch(wk, render);
    });

    // ── m-table (array of objects → sortable table) ──
    // Usage: <table m-table="users" m-table-cols="name,email,role" m-table-select="onRow"></table>
    // If m-table-cols omitted, columns are inferred from first item's keys.
    root.querySelectorAll('[m-table]').forEach(n => {
      const arrKey = n.getAttribute('m-table'), wk = topKey(arrKey);
      const selectFn = n.getAttribute('m-table-select') || '';
      const colsDef = n.getAttribute('m-table-cols') || '';
      const sortable = !n.hasAttribute('m-table-nosort');
      let sortCol = null, sortAsc = true, selectedRow = null;

      function parseCol(s) {
        // "Name:name" → { header:'Name', key:'name' } or "name" → { header:'name', key:'name' }
        var i = s.indexOf(':');
        if (i > -1) return { header: s.substring(0, i).trim(), key: s.substring(i + 1).trim() };
        s = s.trim();
        return { header: s.charAt(0).toUpperCase() + s.slice(1), key: s };
      }

      function render() {
        var arr = getPath(state, arrKey);
        n.innerHTML = '';
        selectedRow = null;
        if (!Array.isArray(arr) || arr.length === 0) return;

        var cols = colsDef
          ? colsDef.split(',').map(parseCol)
          : Object.keys(arr[0]).map(function(k) { return { header: k.charAt(0).toUpperCase() + k.slice(1), key: k }; });

        // Sort data
        var data = arr.slice();
        if (sortCol !== null) {
          var key = cols[sortCol].key;
          data.sort(function(a, b) {
            var va = a[key], vb = b[key];
            if (va == null) va = '';
            if (vb == null) vb = '';
            if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
            va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
            return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
          });
        }

        // Header
        var thead = document.createElement('thead');
        var hrow = document.createElement('tr');
        cols.forEach(function(col, ci) {
          var th = document.createElement('th');
          th.textContent = col.header;
          th.className = 'bm-table-th';
          if (sortable) {
            th.style.cursor = 'pointer';
            if (sortCol === ci) th.textContent += sortAsc ? ' ▲' : ' ▼';
            th.addEventListener('click', function() {
              if (sortCol === ci) sortAsc = !sortAsc; else { sortCol = ci; sortAsc = true; }
              render();
            });
          }
          hrow.appendChild(th);
        });
        thead.appendChild(hrow);
        n.appendChild(thead);

        // Body
        var tbody = document.createElement('tbody');
        data.forEach(function(item) {
          var tr = document.createElement('tr');
          tr.className = 'bm-table-row';
          cols.forEach(function(col) {
            var td = document.createElement('td');
            var val = item[col.key];
            td.textContent = val != null ? val : '';
            tr.appendChild(td);
          });
          tr.addEventListener('click', function(e) {
            if (selectedRow) selectedRow.classList.remove('bm-table-selected');
            tr.classList.add('bm-table-selected');
            selectedRow = tr;
            if (selectFn && typeof state[selectFn] === 'function') state[selectFn](item, e);
          });
          tbody.appendChild(tr);
        });
        n.appendChild(tbody);
        n.classList.add('bm-table');
      }

      render(); watch(wk, render);
    });

    // ── m-tree (recursive collapsible treeview) ──
    // Usage: <div m-tree="files" m-tree-select="onSelect"></div>
    // State: [{ label:'src', icon:'📁', children:[{ label:'index.js', icon:'📄' }] }]
    root.querySelectorAll('[m-tree]').forEach(n => {
      const arrKey = n.getAttribute('m-tree'), wk = topKey(arrKey);
      const selectFn = n.getAttribute('m-tree-select') || '';
      const labelField = n.getAttribute('m-tree-label') || 'label';
      const childField = n.getAttribute('m-tree-children') || 'children';
      const iconField = n.getAttribute('m-tree-icon') || 'icon';

      let selectedEl = null;

      function buildNode(item, depth) {
        const hasKids = Array.isArray(item[childField]) && item[childField].length > 0;
        const row = document.createElement('div');
        row.className = 'bm-tree-row';
        row.style.paddingLeft = (depth * 1.25) + 'rem';

        if (hasKids) {
          const toggle = document.createElement('span');
          toggle.className = 'bm-tree-toggle';
          toggle.textContent = '▸';
          row.appendChild(toggle);
        } else {
          const spacer = document.createElement('span');
          spacer.className = 'bm-tree-spacer';
          row.appendChild(spacer);
        }

        if (item[iconField]) {
          const ico = document.createElement('span');
          ico.className = 'bm-tree-icon';
          ico.textContent = item[iconField];
          row.appendChild(ico);
        }

        const lbl = document.createElement('span');
        lbl.className = 'bm-tree-label';
        lbl.textContent = item[labelField] || '';
        row.appendChild(lbl);

        const wrapper = document.createElement('div');
        wrapper.className = 'bm-tree-node';
        wrapper.appendChild(row);

        // Selection
        row.addEventListener('click', function(e) {
          e.stopPropagation();
          if (selectedEl) selectedEl.classList.remove('bm-tree-selected');
          row.classList.add('bm-tree-selected');
          selectedEl = row;
          if (selectFn && typeof state[selectFn] === 'function') state[selectFn](item, e);
        });

        // Children container (collapsed by default unless item.open)
        if (hasKids) {
          const kids = document.createElement('div');
          kids.className = 'bm-tree-children';
          if (!item.open) kids.style.display = 'none';
          else row.querySelector('.bm-tree-toggle').textContent = '▾';

          item[childField].forEach(function(child) { kids.appendChild(buildNode(child, depth + 1)); });
          wrapper.appendChild(kids);

          row.querySelector('.bm-tree-toggle').addEventListener('click', function(e) {
            e.stopPropagation();
            const open = kids.style.display === 'none';
            kids.style.display = open ? '' : 'none';
            this.textContent = open ? '▾' : '▸';
          });
        }

        return wrapper;
      }

      function render() {
        const arr = getPath(state, arrKey);
        n.innerHTML = '';
        selectedEl = null;
        n.classList.add('bm-tree');
        if (!Array.isArray(arr)) return;
        arr.forEach(function(item) { n.appendChild(buildNode(item, 0)); });
      }

      render(); watch(wk, render);
    });

    // ── m-toast (array → toast popup) ──
    // Usage: <div class="toast-container toast-container-top-right" m-toast="notifications"></div>
    // Push: state.notifications.push({ type:'success', title:'Saved', message:'Done.', duration:'5s' })
    root.querySelectorAll('[m-toast]').forEach(n => {
      const arrKey = n.getAttribute('m-toast'), wk = topKey(arrKey);
      let lastLen = 0;

      function createToast(item) {
        const t = typeof item === 'string' ? { message: item } : item;
        const type = t.type || 'info';
        const dur = t.duration || '5s';
        const durClass = 'toast-' + dur.replace(/\s/g, '');
        const dark = type === 'dark';

        const toast = document.createElement('div');
        toast.className = 'toast toast-auto ' + durClass + (dark ? ' toast-dark' : ' toast-' + type);

        if (t.title) {
          const header = document.createElement('div');
          header.className = 'toast-header';
          header.innerHTML = '<span class="toast-title">' + (t.title || '') + '</span>' +
            (t.time ? '<span class="toast-time">' + t.time + '</span>' : '');
          const closeBtn = document.createElement('button');
          closeBtn.className = 'btn-close' + (dark ? ' btn-close-white' : '');
          closeBtn.addEventListener('click', () => toast.remove());
          header.appendChild(closeBtn);
          toast.appendChild(header);
        }

        const body = document.createElement('div');
        body.className = 'toast-body';
        body.textContent = t.message || '';
        toast.appendChild(body);

        if (t.progress !== false) {
          const bar = document.createElement('div');
          bar.className = 'toast-progress';
          toast.appendChild(bar);
        }

        toast.addEventListener('animationend', function(e) {
          if (e.animationName === 'toast-auto-dismiss') toast.remove();
        });

        n.appendChild(toast);
      }

      const sync = () => {
        const arr = getPath(state, arrKey);
        if (!Array.isArray(arr)) return;
        // Only render newly added items
        while (lastLen < arr.length) {
          createToast(arr[lastLen]);
          lastLen++;
        }
        // Handle array being replaced (reset)
        if (arr.length < lastLen) lastLen = arr.length;
      };

      sync(); watch(wk, sync);
    });

    // ── m-click / m-submit ──
    root.querySelectorAll('[m-click],[m-submit]').forEach(n => {
      const sub = n.hasAttribute('m-submit');
      const fn  = n.getAttribute(sub ? 'm-submit' : 'm-click');
      n.addEventListener(sub ? 'submit' : 'click', e => {
        e.preventDefault();
        const handler = getPath(state, fn);
        typeof handler === 'function' && handler(e);
      });
    });
  }

  return { reactive, bind, formatters };
})();
