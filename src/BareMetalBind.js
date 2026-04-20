// BareMetalBind — reactive Proxy state and m-* directive binder
// Directives: m-value, m-text, m-if, m-click, m-submit, m-class, m-attr, m-each, m-navbar
// API: reactive(initial) → { state, watch, data },  bind(root, state, watch)
const BareMetalBind = (() => {
  'use strict';

  function reactive(initial) {
    const L = new Map();
    const notify = k => (L.get(k) || []).forEach(fn => fn());
    const watch  = (k, fn) => { L.has(k) || L.set(k, []); L.get(k).push(fn); };
    const data   = { ...initial };
    const state  = new Proxy(data, {
      set(t, k, v) { t[k] = v; notify(k); return true; }
    });
    return { state, watch, data };
  }

  // Parse "name:stateKey,name2:stateKey2" pairs.
  // First colon splits name from key; commas separate pairs.
  function parsePairs(attr) {
    return attr.split(',').map(p => {
      const i = p.indexOf(':');
      return i < 0 ? null : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }).filter(Boolean);
  }

  // Resolve a value: ".prop" reads from item, "." returns item, otherwise reads state[key].
  function resolve(key, state, item) {
    if (item !== undefined) {
      if (key === '.') return item;
      if (key.startsWith('.')) return item[key.slice(1)];
    }
    return state[key];
  }

  // Apply non-reactive directives to a single element against a context (state + optional item).
  function applyRow(el, state, item) {
    el.querySelectorAll('[m-text]').forEach(n => {
      n.textContent = resolve(n.getAttribute('m-text'), state, item) ?? '';
    });
    el.querySelectorAll('[m-class]').forEach(n => {
      parsePairs(n.getAttribute('m-class')).forEach(([cls, k]) => {
        n.classList.toggle(cls, !!resolve(k, state, item));
      });
    });
    el.querySelectorAll('[m-attr]').forEach(n => {
      parsePairs(n.getAttribute('m-attr')).forEach(([attr, k]) => {
        const v = resolve(k, state, item);
        if (v == null || v === false) n.removeAttribute(attr);
        else n.setAttribute(attr, v === true ? '' : String(v));
      });
    });
    el.querySelectorAll('[m-if]').forEach(n => {
      n.style.display = resolve(n.getAttribute('m-if'), state, item) ? '' : 'none';
    });
  }

  function bind(root, state, watch) {
    // ── m-value (two-way) ──
    root.querySelectorAll('[m-value]').forEach(n => {
      const k = n.getAttribute('m-value'), chk = n.type === 'checkbox';
      const isDate = n.type === 'date', isDtLocal = n.type === 'datetime-local';
      const fmt = v => {
        if (v == null || v === '') return '';
        if (isDate) return String(v).slice(0, 10);
        if (isDtLocal) return String(v).slice(0, 16);
        return String(v);
      };
      const sync = () => {
        if (chk) { n.checked = !!state[k]; }
        else { const v = fmt(state[k]); if (n.value !== v) n.value = v; }
      };
      sync(); watch(k, sync);
      n.addEventListener(chk ? 'change' : 'input', () => state[k] = chk ? n.checked : n.value);
    });

    // ── m-text ──
    root.querySelectorAll('[m-text]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return; // owned by m-each/m-navbar
      const k = n.getAttribute('m-text'), sync = () => n.textContent = state[k] ?? '';
      sync(); watch(k, sync);
    });

    // ── m-if ──
    root.querySelectorAll('[m-if]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      const k = n.getAttribute('m-if'), sync = () => n.style.display = state[k] ? '' : 'none';
      sync(); watch(k, sync);
    });

    // ── m-class ──
    root.querySelectorAll('[m-class]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      parsePairs(n.getAttribute('m-class')).forEach(([cls, k]) => {
        const sync = () => n.classList.toggle(cls, !!state[k]);
        sync(); watch(k, sync);
      });
    });

    // ── m-attr ──
    root.querySelectorAll('[m-attr]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      parsePairs(n.getAttribute('m-attr')).forEach(([attr, k]) => {
        const sync = () => {
          const v = state[k];
          if (v == null || v === false) n.removeAttribute(attr);
          else n.setAttribute(attr, v === true ? '' : String(v));
        };
        sync(); watch(k, sync);
      });
    });

    // ── m-each ──
    root.querySelectorAll('[m-each]').forEach(n => {
      const k = n.getAttribute('m-each');
      const tpl = n.querySelector('template');
      if (!tpl) return;
      const frag = tpl.content;
      const render = () => {
        // remove rendered children (keep <template>)
        Array.from(n.children).forEach(c => { if (c !== tpl) n.removeChild(c); });
        const arr = state[k];
        if (!Array.isArray(arr)) return;
        arr.forEach(item => {
          const clone = frag.cloneNode(true);
          // wrap in a temporary container so we can querySelectorAll on it
          const wrap = document.createElement('div');
          wrap.appendChild(clone);
          applyRow(wrap, state, item);
          // move children into the real parent
          while (wrap.firstChild) n.appendChild(wrap.firstChild);
        });
      };
      render(); watch(k, render);
    });

    // ── m-navbar ──
    root.querySelectorAll('[m-navbar]').forEach(n => {
      const k = n.getAttribute('m-navbar');
      const render = () => {
        n.innerHTML = '';
        const arr = state[k];
        if (!Array.isArray(arr)) return;
        arr.forEach(link => {
          const a = document.createElement('a');
          a.href = link.href || '#';
          a.textContent = link.text || '';
          if (link.active) a.classList.add('active');
          n.appendChild(a);
        });
      };
      render(); watch(k, render);
    });

    // ── m-click / m-submit ──
    root.querySelectorAll('[m-click],[m-submit]').forEach(n => {
      const sub = n.hasAttribute('m-submit');
      const fn  = n.getAttribute(sub ? 'm-submit' : 'm-click');
      n.addEventListener(sub ? 'submit' : 'click', e => {
        e.preventDefault();
        typeof state[fn] === 'function' && state[fn](e);
      });
    });
  }

  return { reactive, bind };
})();
