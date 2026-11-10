// BareMetal.Bind — core reactive m-* directive binder
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Bind = (() => {
  'use strict';

  // Formatter registry
  const formatters = {};

  // Path helpers
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

  // Binding expression parser
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

  // Scope-aware value resolution
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
  function resolveBinding(expr, state, scope) {
    const { path, pipes } = parseBinding(expr);
    const val = resolveInScope(path, state, scope);
    return pipes.length ? applyPipes(val, pipes) : val;
  }

  // Reactive arrays
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

  function cloneListValue(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') {
      try { return structuredClone(value); } catch (_) {}
    }
    if (Array.isArray(value)) return value.map(cloneListValue);
    if (typeof value === 'object') {
      const copy = {};
      Object.keys(value).forEach(k => { copy[k] = cloneListValue(value[k]); });
      return copy;
    }
    return value;
  }

  function resolveArrayPath(path, state, scope) {
    if (!path) return null;
    if (scope && path.startsWith('.root.')) return resolveInScope(path, state, scope);
    if (scope && path.startsWith('.parent.')) return resolveInScope(path, state, scope);
    if (scope && path.startsWith('.')) return resolveInScope(path, state, scope);
    return getPath(state, path);
  }

  function setArrayPath(path, state, scope, next) {
    if (!path) return false;
    if (scope && path.startsWith('.root.')) {
      setPath(state, path.slice(6), next);
      return true;
    }
    if (scope && path.startsWith('.parent.')) {
      setPath(scope.parent, path.slice(8), next);
      return true;
    }
    if (scope && path.startsWith('.')) {
      setPath(scope.item, path.slice(1), next);
      return true;
    }
    setPath(state, path, next);
    return true;
  }

  function appendList(state, path, value, scope) {
    const arr = resolveArrayPath(path, state, scope);
    if (!Array.isArray(arr) || value === undefined) return false;
    arr.push(cloneListValue(value));
    if (!Array.isArray(state[path])) setArrayPath(path, state, scope, arr);
    return true;
  }

  function removeList(state, path, value, options, scope) {
    const arr = resolveArrayPath(path, state, scope);
    if (!Array.isArray(arr)) return false;
    options = options || {};
    let index = -1;
    if (typeof options.index === 'number') index = options.index;
    else if (value !== undefined) {
      if (options.key) {
        index = arr.findIndex(item =>
          typeof item === 'object' && item
            ? item[options.key] === value[options.key]
            : item === value
        );
      } else {
        index = arr.indexOf(value);
        if (index < 0 && typeof value === 'object' && value) {
          index = arr.findIndex(item => {
            if (typeof item !== 'object' || !item) return false;
            return Object.keys(value).every(k => item[k] === value[k]);
          });
        }
      }
    }
    if (index < 0) return false;
    arr.splice(index, 1);
    if (arr !== state[path]) setArrayPath(path, state, scope, arr);
    return true;
  }

  // Parse "name:stateKey,name2:stateKey2" pairs
  function parsePairs(attr) {
    return attr.split(',').map(p => {
      const i = p.indexOf(':');
      return i < 0 ? null : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }).filter(Boolean);
  }

  // reactive()
  function reactive(initial) {
    const L = new Map();
    const notify = k => (L.get(k) || []).forEach(fn => fn());
    const watch  = (k, fn) => { L.has(k) || L.set(k, []); L.get(k).push(fn); };
    const data   = { ...initial };
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k])) data[k] = wrapArray(data[k], () => notify(k));
    }
    const state  = new Proxy(data, {
      set(t, k, v) {
        t[k] = Array.isArray(v) ? wrapArray(v, () => notify(k)) : v;
        notify(k);
        return true;
      }
    });
    return { state, watch, data };
  }

  // Transition helpers — shared double-rAF pattern
  function doubleRaf(fn) { requestAnimationFrame(() => { requestAnimationFrame(fn); }); }
  function transitionIn(el, name) {
    el.style.display = '';
    const enter = (name || 'm') + '-enter', active = (name || 'm') + '-enter-active';
    el.classList.add(enter);
    doubleRaf(() => {
      el.classList.add(active);
      el.classList.remove(enter);
      const done = () => { el.classList.remove(active); el.removeEventListener('transitionend', done); };
      el.addEventListener('transitionend', done);
    });
  }
  function transitionOut(el, name, cb) {
    const leave = (name || 'm') + '-leave', active = (name || 'm') + '-leave-active';
    el.classList.add(leave);
    doubleRaf(() => {
      el.classList.add(active);
      el.classList.remove(leave);
      const done = () => { el.classList.remove(active); el.removeEventListener('transitionend', done); cb(); };
      el.addEventListener('transitionend', done);
    });
  }

  function parseAddedValue(raw, state, scope) {
    if (raw == null || raw === '') return undefined;
    const trim = raw.trim();
    if (trim.charAt(0) === '{' || trim.charAt(0) === '[') {
      try { return JSON.parse(trim); } catch (_) { return undefined; }
    }
    if (scope) {
      if (trim.startsWith('.root.')) return resolveInScope(trim, state, scope);
      if (trim.startsWith('.parent.')) return resolveInScope(trim, state, scope);
      if (trim.startsWith('.')) return resolveInScope(trim, state, scope);
    }
    return getPath(state, trim);
  }

  function bindMutationControls(root, state, scope) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    root.querySelectorAll('[m-add]').forEach(n => {
      n.__bmMutationState = state;
      n.__bmMutationScope = scope;
      if (n.__bmAddBound) return;
      n.__bmAddBound = true;
      n.addEventListener('click', event => {
        event.preventDefault();
        const path = n.getAttribute('m-add');
        const valueAttr = n.getAttribute('m-add-value');
        const defaultAttr = n.getAttribute('m-add-default');
        const currentState = n.__bmMutationState || state;
        const currentScope = n.__bmMutationScope || scope;
        let value = parseAddedValue(valueAttr || defaultAttr, currentState, currentScope);
        if (value === undefined && defaultAttr) value = parseAddedValue(defaultAttr, currentState, currentScope);
        appendList(currentState, path, value, currentScope);
      });
    });

    root.querySelectorAll('[m-remove]').forEach(n => {
      n.__bmMutationState = state;
      n.__bmMutationScope = scope;
      if (n.__bmRemoveBound) return;
      n.__bmRemoveBound = true;
      n.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const path = n.getAttribute('m-remove');
        const currentState = n.__bmMutationState || state;
        const currentScope = n.__bmMutationScope || scope;
        let value;
        const valueAttr = n.getAttribute('m-remove-value');
        if (valueAttr) value = parseAddedValue(valueAttr, currentState, currentScope);
        else if (currentScope) value = currentScope.item;
        const key = n.getAttribute('m-remove-key') || null;
        const indexAttr = n.getAttribute('m-remove-index');
        const options = {};
        if (indexAttr) {
          const indexValue = parseAddedValue(indexAttr, currentState, currentScope);
          if (typeof indexValue === 'number') options.index = indexValue;
        } else if (currentScope && typeof currentScope.index === 'number' && n.hasAttribute('m-remove-index-only')) {
          options.index = currentScope.index;
        }
        if (key) options.key = key;
        removeList(currentState, path, value, options, currentScope);
      });
    });
  }

  // Apply directives to a row (non-reactive, for m-each)
  function applyRow(el, state, scope) {
    bindMutationControls(el, state, scope);
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

  // m-expression helpers
  function parseExpression(raw) {
    const eq = raw.indexOf('=');
    if (eq < 0) return null;
    const target = raw.slice(0, eq).trim();
    const expr = raw.slice(eq + 1).trim();
    const ids = new Set();
    expr.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, (m, id) => {
      if (!/^(true|false|null|undefined|NaN|Infinity|Math|Date|Number|String|Boolean|Array|Object|parseInt|parseFloat|isNaN|isFinite)$/.test(id)) {
        ids.add(id);
      }
    });
    return { target, expr, deps: [...ids] };
  }

  // DOM helper: create element with className
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  // bind()
  function bind(root, state, watch) {

    // m-expression (process first so computed values exist for other directives)
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
      const targetTop = topKey(target);
      watchKeys.delete(targetTop);
      watchKeys.forEach(k => watch(k, evaluate));
    });

    // m-value (two-way, no formatters)
    root.querySelectorAll('[m-value]').forEach(n => {
      const path = n.getAttribute('m-value');
      const chk = n.type === 'checkbox';
      const radio = n.type === 'radio';
      const select = n.tagName === 'SELECT';
      const isDate = n.type === 'date';
      const isDtLocal = n.type === 'datetime-local';
      const isNumber = n.type === 'number' || n.type === 'range';
      const wk = topKey(path);
      const coerce = v => {
        if (radio || select) {
          if (v === 'true') return true;
          if (v === 'false') return false;
        }
        if (radio) {
          const current = getPath(state, path);
          if (typeof current === 'number') {
            const number = Number(v);
            if (Number.isFinite(number)) return number;
          }
        }
        if (isNumber) {
          if (v === '' || v == null) return '';
          const number = Number(v);
          return Number.isFinite(number) ? number : v;
        }
        return v;
      };
      const fmt = v => {
        if (v == null || v === '') return '';
        if (isDate) return String(v).slice(0, 10);
        if (isDtLocal) return String(v).slice(0, 16);
        return String(v);
      };
      const sync = () => {
        const v = getPath(state, path);
        if (chk) n.checked = !!v;
        else if (radio) n.checked = String(v) === n.value;
        else if (select) {
          if (n.multiple) {
            const selected = Array.isArray(v) ? v.map(item => String(item)) : [];
            Array.from(n.options).forEach(option => {
              option.selected = selected.includes(option.value);
            });
          } else {
            const value = fmt(v);
            if (n.value !== value) n.value = value;
          }
        }
        else { const s = fmt(v); if (n.value !== s) n.value = s; }
      };
      sync(); watch(wk, sync);
      if (radio) {
        n.addEventListener('change', () => {
          if (n.checked) setPath(state, path, coerce(n.value));
        });
      } else if (select && n.multiple) {
        n.addEventListener('change', () => {
          setPath(state, path, Array.from(n.selectedOptions).map(option => coerce(option.value)));
        });
      } else {
        n.addEventListener(select ? 'change' : (chk ? 'change' : 'input'), () => {
          setPath(state, path, chk ? n.checked : coerce(n.value));
        });
      }
    });

    // m-many-select / m-many-checklist
    // Many-to-many binding for arrays of selected IDs or selected objects.
    // Options come from m-options="path"; value/label fields default to id/name.
    root.querySelectorAll('[m-many-select],[m-many-checklist]').forEach(n => {
      const isChecklist = n.hasAttribute('m-many-checklist');
      const path = n.getAttribute(isChecklist ? 'm-many-checklist' : 'm-many-select');
      const optionsPath = n.getAttribute('m-options') || '';
      const optionsJson = n.getAttribute('m-options-json') || '';
      const valueField = n.getAttribute('m-value-field') || 'id';
      const labelField = n.getAttribute('m-label-field') || 'name';
      const wk = topKey(path);
      const optionsKey = topKey(optionsPath);
      const optionValue = option => typeof option === 'object' && option ? option[valueField] : option;
      const optionLabel = option => typeof option === 'object' && option ? (option[labelField] ?? option[valueField] ?? option) : option;
      const selectedValue = item => typeof item === 'object' && item ? item[valueField] : item;

      const sync = () => {
        const selected = getPath(state, path);
        const selectedIds = new Set((Array.isArray(selected) ? selected : []).map(selectedValue).map(String));
        let options = optionsPath ? getPath(state, optionsPath) : [];
        if (!options.length && optionsJson) {
          try { options = JSON.parse(optionsJson); } catch (_) { options = []; }
        }
        n.innerHTML = '';
        if (!Array.isArray(options)) return;
        if (isChecklist) {
          n.classList.add('bm-many-checklist');
          options.forEach(option => {
            const value = optionValue(option);
            const label = document.createElement('label');
            label.className = 'bm-many-check';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = String(value);
            input.checked = selectedIds.has(String(value));
            input.addEventListener('change', () => {
              const current = getPath(state, path);
              let next = (Array.isArray(current) ? current : []).slice();
              if (input.checked) {
                if (!next.some(item => String(selectedValue(item)) === String(value))) {
                  next.push(typeof option === 'object' ? Object.assign({}, option) : value);
                }
              } else {
                next = next.filter(item => String(selectedValue(item)) !== String(value));
              }
              setPath(state, path, next);
            });
            label.append(input, document.createTextNode(' ' + String(optionLabel(option))));
            n.appendChild(label);
          });
        } else {
          n.innerHTML = '';
          if (n.tagName !== 'SELECT') {
            n.setAttribute('role', 'group');
          }
          if (n.tagName === 'SELECT') {
            n.multiple = true;
            options.forEach(option => {
              const value = optionValue(option);
              const opt = document.createElement('option');
              opt.value = String(value);
              opt.textContent = String(optionLabel(option));
              opt.selected = selectedIds.has(String(value));
              n.appendChild(opt);
            });
            n.onchange = () => {
              const map = new Map(options.map(option => [String(optionValue(option)), option]));
              const next = Array.from(n.selectedOptions).map(option => {
                const original = map.get(option.value);
                return typeof original === 'object' ? Object.assign({}, original) : original;
              });
              setPath(state, path, next);
            };
          } else {
            options.forEach(option => {
              const value = optionValue(option);
              const button = document.createElement('button');
              button.type = 'button';
              button.className = 'bm-many-option';
              button.textContent = String(optionLabel(option));
              button.setAttribute('aria-pressed', String(selectedIds.has(String(value))));
              button.addEventListener('click', () => {
                const current = getPath(state, path);
                let next = (Array.isArray(current) ? current : []).slice();
                if (next.some(item => String(selectedValue(item)) === String(value))) {
                  next = next.filter(item => String(selectedValue(item)) !== String(value));
                } else {
                  next.push(typeof option === 'object' ? Object.assign({}, option) : value);
                }
                setPath(state, path, next);
              });
              n.appendChild(button);
            });
          }
        }
      };
      sync();
      watch(wk, sync);
      if (optionsKey && optionsKey !== wk) watch(optionsKey, sync);
    });

    // m-text
    root.querySelectorAll('[m-text]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      const expr = n.getAttribute('m-text');
      const { path } = parseBinding(expr);
      const wk = topKey(path);
      const sync = () => n.textContent = resolveBinding(expr, state) ?? '';
      sync(); watch(wk, sync);
    });

    // m-if (with m-transition support)
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

    // m-class
    root.querySelectorAll('[m-class]').forEach(n => {
      if (n.closest('[m-each],[m-navbar]')) return;
      parsePairs(n.getAttribute('m-class')).forEach(([cls, k]) => {
        const wk = topKey(k);
        const sync = () => n.classList.toggle(cls, !!getPath(state, k));
        sync(); watch(wk, sync);
      });
    });

    // m-attr
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

    // m-each (keyed diffing)
    root.querySelectorAll('[m-each]').forEach(n => {
      const raw = n.getAttribute('m-each');
      const keyMatch = raw.match(/^(\S+)\s+key:(\S+)$/);
      const arrKey = keyMatch ? keyMatch[1] : raw.trim();
      const keyProp = keyMatch ? keyMatch[2] : null;
      const wk = topKey(arrKey);
      const tpl = n.querySelector('template');
      if (!tpl) return;
      const frag = tpl.content;
      let rowMap = new Map();
      function makeRow(item, index, parentScope) {
        const scope = { item, index, parent: parentScope ? parentScope.item : undefined, root: state };
        const clone = frag.cloneNode(true);
        const wrap = document.createElement('div');
        wrap.appendChild(clone);
        applyRow(wrap, state, scope);
        const el = wrap.firstElementChild || wrap.firstChild;
        if (el) el.__bmScope = scope;
        return { el, wrap };
      }
      function updateRow(el, item, index, parentScope) {
        const scope = { item, index, parent: parentScope ? parentScope.item : undefined, root: state };
        el.__bmScope = scope;
        const container = document.createElement('div');
        container.appendChild(el);
        applyRow(container, state, scope);
        return container.firstElementChild || container.firstChild;
      }
      const render = () => {
        const arr = getPath(state, arrKey);
        if (!Array.isArray(arr)) {
          Array.from(n.children).forEach(c => { if (c !== tpl) n.removeChild(c); });
          rowMap.clear();
          return;
        }
        if (keyProp) {
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
          for (const [kv, { el }] of rowMap) {
            if (!newMap.has(kv) && el && el.parentNode) el.parentNode.removeChild(el);
          }
          newOrder.forEach(el => { if (el) n.appendChild(el); });
          rowMap = newMap;
        } else {
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

    // m-add / m-remove (standalone and outside m-each)
    bindMutationControls(root, state, undefined);

    // m-click / m-submit
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

  return {
    reactive, bind, formatters,
    // Exposed helpers for Components module
    getPath, setPath, topKey, parseBinding, applyPipes,
    resolveInScope, resolveBinding, parsePairs, applyRow, el,
    appendList, removeList
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Bind;
