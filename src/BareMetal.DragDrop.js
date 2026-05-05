var window = typeof globalThis !== 'undefined' ? (globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;
BareMetal.DragDrop = (function () {
  'use strict';

  var g = typeof globalThis !== 'undefined' ? globalThis : window;
  var ds = [];

  function noop() {}

  function call(fn, a, b, c, d) {
    try {
      return typeof fn === 'function' ? fn(a, b, c, d) : undefined;
    } catch (_) {}
  }

  function doc() {
    return g.document || null;
  }

  function arr(v) {
    return Array.prototype.slice.call(v || []);
  }

  function emit(el, type, detail) {
    if (!el || !el.dispatchEvent || typeof g.CustomEvent !== 'function') return;
    try {
      el.dispatchEvent(new g.CustomEvent(type, { bubbles: true, detail: detail || {} }));
    } catch (_) {}
  }

  function list(el, sel) {
    var out;
    if (!el) return [];
    if (!sel || sel === '>*') out = arr(el.children);
    else {
      try {
        out = arr(el.querySelectorAll(sel));
      } catch (_) {
        out = arr(el.children);
      }
    }
    return out.filter(function (n) {
      return n && n.getAttribute && n.getAttribute('data-bm-placeholder') !== '1';
    });
  }

  function own(container, sel, target) {
    var a = list(container, sel);
    var i;
    target = target && target.nodeType === 1 ? target : target && target.parentElement;
    for (i = 0; i < a.length; i++) {
      if (a[i] === target || (a[i].contains && a[i].contains(target))) return a[i];
    }
    return null;
  }

  function allow(rule, data) {
    if (!rule) return true;
    if (typeof rule === 'function') return !!call(rule, data);
    if (typeof rule === 'string') return !!data && (data.type === rule || data.kind === rule || data === rule);
    return true;
  }

  function payload(el, opts, e) {
    if (typeof opts.data === 'function') return call(opts.data, el, e);
    if (opts.data !== undefined) return opts.data;
    return {
      type: el && el.getAttribute ? el.getAttribute('data-type') || '' : '',
      id: el && el.id || '',
      text: String(el && el.textContent || '').trim()
    };
  }

  function ghost(el, cls) {
    var r;
    var n;
    var b = doc() && doc().body;
    if (!el || !el.cloneNode || !b) return null;
    r = el.getBoundingClientRect ? el.getBoundingClientRect() : { width: 0, height: 0 };
    n = el.cloneNode(true);
    if (cls && n.classList) n.classList.add(cls);
    n.style.position = 'fixed';
    n.style.left = '0';
    n.style.top = '0';
    n.style.margin = '0';
    n.style.width = r.width + 'px';
    n.style.height = r.height + 'px';
    n.style.pointerEvents = 'none';
    n.style.zIndex = '2147483647';
    n.style.opacity = '0.9';
    b.appendChild(n);
    return n;
  }

  function moveGhost(n, e) {
    if (!n || !e) return;
    n.style.transform = 'translate(' + (e.clientX + 12) + 'px,' + (e.clientY + 12) + 'px)';
  }

  function setOver(entry, on) {
    if (!entry || !entry.el || !entry.o || !entry.o.overClass || !entry.el.classList) return;
    entry.el.classList[on ? 'add' : 'remove'](entry.o.overClass);
  }

  function findDrop(x, y, data) {
    var n = doc() && doc().elementFromPoint ? doc().elementFromPoint(x, y) : null;
    var i;
    while (n) {
      for (i = 0; i < ds.length; i++) {
        if ((ds[i].el === n || (ds[i].el.contains && ds[i].el.contains(n))) && allow(ds[i].o.accept, data)) return ds[i];
      }
      n = n.parentElement;
    }
    return null;
  }

  function key(el, i) {
    return el && (el.id || (el.getAttribute && (el.getAttribute('data-id') || el.getAttribute('data-key')))) || String(i);
  }

  /**
   * Makes an element draggable.
   * @param {Element} el
   * @param {Object} [opts]
   * @returns {{destroy: Function}}
   */
  function draggable(el, opts) {
    var st = null;
    opts = opts || {};
    if (!el || !el.addEventListener) return { destroy: noop };

    function end(e, cancel) {
      var x = st;
      if (!x) return;
      st = null;
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancelUp);
      try {
        if (el.releasePointerCapture) el.releasePointerCapture(x.pid);
      } catch (_) {}
      if (opts.dragClass && el.classList) el.classList.remove(opts.dragClass);
      if (x.drop) {
        setOver(x.drop, false);
        if (!cancel) {
          call(x.drop.o.onDrop, x.data, el, x.drop.el, e);
          emit(x.drop.el, 'bm:drop', { data: x.data, source: el, target: x.drop.el });
        }
      }
      if (x.ghost && x.ghost.remove) x.ghost.remove();
      emit(el, 'bm:dragend', { data: x.data, source: el, target: x.drop && x.drop.el || null, cancelled: !!cancel });
      call(opts.onEnd, x.data, el, x.drop && x.drop.el || null, e);
    }

    function move(e) {
      var next;
      if (!st || !e) return;
      moveGhost(st.ghost, e);
      next = findDrop(e.clientX, e.clientY, st.data);
      if (next === st.drop) return;
      if (st.drop) {
        setOver(st.drop, false);
        call(st.drop.o.onLeave, st.data, el, st.drop.el, e);
      }
      st.drop = next;
      if (st.drop) {
        setOver(st.drop, true);
        call(st.drop.o.onOver, st.data, el, st.drop.el, e);
      }
    }

    function up(e) {
      end(e, false);
    }

    function cancelUp(e) {
      end(e, true);
    }

    function down(e) {
      var h;
      if (!e || st || (e.button > 0 && e.pointerType !== 'touch')) return;
      if (opts.handle) {
        h = e.target && e.target.closest ? e.target.closest(opts.handle) : null;
        if (!h || !el.contains(h)) return;
      }
      st = {
        pid: e.pointerId,
        data: payload(el, opts, e),
        ghost: ghost(el, opts.ghostClass),
        drop: null
      };
      if (opts.dragClass && el.classList) el.classList.add(opts.dragClass);
      moveGhost(st.ghost, e);
      try {
        if (el.setPointerCapture) el.setPointerCapture(st.pid);
      } catch (_) {}
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', cancelUp);
      emit(el, 'bm:dragstart', { data: st.data, source: el });
      call(opts.onStart, st.data, el, e);
      if (e.preventDefault) e.preventDefault();
    }

    el.addEventListener('pointerdown', down);
    return {
      destroy: function () {
        el.removeEventListener('pointerdown', down);
        end(null, true);
      }
    };
  }

  /**
   * Registers an element as a drop target.
   * @param {Element} el
   * @param {Object} [opts]
   * @returns {{destroy: Function}}
   */
  function droppable(el, opts) {
    var entry;
    opts = opts || {};
    if (!el) return { destroy: noop };
    entry = { el: el, o: opts };
    ds.push(entry);
    return {
      destroy: function () {
        ds = ds.filter(function (x) { return x !== entry; });
        setOver(entry, false);
      }
    };
  }

  /**
   * Makes a container sortable by pointer drag.
   * @param {Element} container
   * @param {Object} [opts]
   * @returns {{destroy: Function, getOrder: Function}}
   */
  function sortable(container, opts) {
    var st = null;
    opts = opts || {};
    if (!container || !container.addEventListener) return { destroy: noop, getOrder: function () { return []; } };

    function getOrder() {
      return list(container, opts.items).map(key);
    }

    function pickTarget(t) {
      var h;
      if (opts.handle) {
        h = t && t.closest ? t.closest(opts.handle) : null;
        if (!h || !container.contains(h)) return null;
        return own(container, opts.items, h);
      }
      return own(container, opts.items, t);
    }

    function finish(e, cancel) {
      var moved;
      var order;
      if (!st) return;
      st.item.removeEventListener('pointermove', move);
      st.item.removeEventListener('pointerup', up);
      st.item.removeEventListener('pointercancel', cancelUp);
      try {
        if (st.item.releasePointerCapture) st.item.releasePointerCapture(st.pid);
      } catch (_) {}
      if (st.ghost && st.ghost.remove) st.ghost.remove();
      if (!cancel && st.placeholder && st.placeholder.parentNode) st.placeholder.parentNode.insertBefore(st.item, st.placeholder);
      if (st.placeholder && st.placeholder.remove) st.placeholder.remove();
      st.item.style.display = st.display;
      moved = JSON.stringify(st.start) !== JSON.stringify(getOrder());
      order = getOrder();
      emit(st.item, 'bm:dragend', { item: st.item, order: order, cancelled: !!cancel });
      if (moved && !cancel) {
        emit(container, 'bm:reorder', { item: st.item, order: order });
        call(opts.onReorder, order, st.item, e);
      }
      st = null;
    }

    function move(e) {
      var hit;
      var r;
      var cr;
      var before;
      if (!st || !e) return;
      moveGhost(st.ghost, e);
      hit = own(container, opts.items, doc() && doc().elementFromPoint ? doc().elementFromPoint(e.clientX, e.clientY) : null);
      if (hit && hit !== st.item) {
        r = hit.getBoundingClientRect();
        before = (opts.direction === 'horizontal' ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2);
        container.insertBefore(st.placeholder, before ? hit : hit.nextSibling);
      } else if (st.placeholder && container.getBoundingClientRect) {
        cr = container.getBoundingClientRect();
        if (e.clientX >= cr.left && e.clientX <= cr.right && e.clientY >= cr.top && e.clientY <= cr.bottom) container.appendChild(st.placeholder);
      }
    }

    function up(e) {
      finish(e, false);
    }

    function cancelUp(e) {
      finish(e, true);
    }

    function down(e) {
      var item = pickTarget(e && e.target);
      var ph;
      if (!e || st || !item || !container.contains(item)) return;
      ph = (doc() && doc().createElement(item.tagName || 'div')) || null;
      if (!ph) return;
      ph.setAttribute('data-bm-placeholder', '1');
      ph.setAttribute('aria-hidden', 'true');
      ph.style.visibility = 'hidden';
      ph.style.width = (item.offsetWidth || 0) + 'px';
      ph.style.height = (item.offsetHeight || 0) + 'px';
      ph.style.boxSizing = 'border-box';
      st = {
        pid: e.pointerId,
        item: item,
        placeholder: ph,
        ghost: ghost(item, opts.ghostClass),
        display: item.style.display,
        start: getOrder()
      };
      item.style.display = 'none';
      container.insertBefore(ph, item.nextSibling);
      moveGhost(st.ghost, e);
      try {
        if (item.setPointerCapture) item.setPointerCapture(st.pid);
      } catch (_) {}
      item.addEventListener('pointermove', move);
      item.addEventListener('pointerup', up);
      item.addEventListener('pointercancel', cancelUp);
      emit(item, 'bm:dragstart', { item: item, order: st.start });
      if (e.preventDefault) e.preventDefault();
    }

    container.addEventListener('pointerdown', down);
    return {
      destroy: function () {
        container.removeEventListener('pointerdown', down);
        finish(null, true);
      },
      getOrder: getOrder
    };
  }

  return {
    draggable: draggable,
    droppable: droppable,
    sortable: sortable
  };
})();
