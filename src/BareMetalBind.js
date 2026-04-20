// BareMetalBind — reactive Proxy state and m-* directive binder
// Directives: m-value, m-text, m-if, m-click, m-submit, m-class, m-attr,
//             m-each (keyed), m-navbar, m-transition, m-expression
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
