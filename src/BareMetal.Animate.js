var window = typeof globalThis !== 'undefined' ? (globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;
BareMetal.Animate = (function () {
  'use strict';

  var g = typeof globalThis !== 'undefined' ? globalThis : window;

  function f(fn) {
    return typeof fn === 'function' ? fn : function () {};
  }

  function mm(q) {
    try {
      return !!(g.matchMedia && g.matchMedia(q).matches);
    } catch (_) {
      return false;
    }
  }

  function raf(fn) {
    if (g.requestAnimationFrame) {
      g.requestAnimationFrame(function () {
        g.requestAnimationFrame(fn);
      });
      return;
    }
    g.setTimeout(fn, 17);
  }

  function num(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function time(v) {
    return String(v || '').split(',').reduce(function (m, s) {
      s = s.trim();
      if (!s) return m;
      return Math.max(m, s.slice(-2) === 'ms' ? num(s) : num(s) * 1000);
    }, 0);
  }

  function maxTime(el) {
    var s;
    if (!el || !g.getComputedStyle) return 50;
    try {
      s = g.getComputedStyle(el);
    } catch (_) {
      return 50;
    }
    return Math.max(
      time(s.transitionDuration) + time(s.transitionDelay),
      time(s.animationDuration) + time(s.animationDelay)
    ) + 50;
  }

  function finish(el, fn) {
    var t = 0;
    var done = 0;
    var end = function () {
      if (done) return;
      done = 1;
      if (t) g.clearTimeout(t);
      if (el && el.removeEventListener) {
        el.removeEventListener('transitionend', end);
        el.removeEventListener('animationend', end);
      }
      f(fn)();
    };
    if (!el || prefersReducedMotion()) {
      end();
      return end;
    }
    if (el.addEventListener) {
      el.addEventListener('transitionend', end);
      el.addEventListener('animationend', end);
    }
    t = g.setTimeout(end, maxTime(el));
    return end;
  }

  function shown(el) {
    var s;
    if (!el) return false;
    if (el.hidden) return false;
    if (!g.getComputedStyle) return true;
    try {
      s = g.getComputedStyle(el);
    } catch (_) {
      return true;
    }
    return s.display !== 'none' && s.visibility !== 'hidden' && num(s.opacity) !== 0;
  }

  function clean(el, n) {
    if (!el || !el.classList || !n) return;
    el.classList.remove(n);
    el.classList.remove(n + '-active');
  }

  function pulse(el, n, cb) {
    cb = f(cb);
    if (!el) return cb();
    if (!n || prefersReducedMotion()) {
      clean(el, n);
      return cb();
    }
    if (el.classList) el.classList.add(n);
    void el.offsetWidth;
    raf(function () {
      if (el.classList) el.classList.add(n + '-active');
      finish(el, function () {
        clean(el, n);
        cb();
      });
    });
  }

  function clone(el, r) {
    var c;
    var b = g.document && g.document.body;
    if (!el || !r || !b || !el.cloneNode) return null;
    c = el.cloneNode(true);
    c.style.position = 'fixed';
    c.style.left = r.left + 'px';
    c.style.top = r.top + 'px';
    c.style.width = r.width + 'px';
    c.style.height = r.height + 'px';
    c.style.margin = '0';
    c.style.pointerEvents = 'none';
    c.style.zIndex = '2147483647';
    b.appendChild(c);
    return c;
  }

  /**
   * Returns whether reduced-motion is preferred.
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return mm('(prefers-reduced-motion: reduce)');
  }

  /**
   * Runs an enter transition on an element.
   * @param {Element} el
   * @param {string} className
   * @param {Function} [done]
   */
  function enter(el, className, done) {
    if (!el) return;
    try {
      el.hidden = false;
      if (el.style && el.style.display === 'none') el.style.display = '';
    } catch (_) {}
    pulse(el, className, done);
  }

  /**
   * Runs a leave transition on an element.
   * @param {Element} el
   * @param {string} className
   * @param {Function} [done]
   */
  function leave(el, className, done) {
    if (!el) return;
    pulse(el, className, function () {
      if (typeof done === 'function') return done();
      try {
        if (el.remove) el.remove();
      } catch (_) {}
    });
  }

  /**
   * Toggles enter or leave based on visibility.
   * @param {Element} el
   * @param {string} enterClass
   * @param {string} leaveClass
   */
  function toggle(el, enterClass, leaveClass) {
    if (!el) return;
    if (shown(el)) leave(el, leaveClass || enterClass);
    else enter(el, enterClass || leaveClass);
  }

  /**
   * Runs a FLIP move animation between two rects.
   * @param {Element} el
   * @param {DOMRect|Object} fromRect
   * @param {DOMRect|Object} toRect
   */
  function move(el, fromRect, toRect) {
    var dx;
    var dy;
    var sx;
    var sy;
    var t;
    if (!el || !fromRect || !toRect || prefersReducedMotion()) return;
    dx = num(fromRect.left) - num(toRect.left);
    dy = num(fromRect.top) - num(toRect.top);
    sx = num(fromRect.width) && num(toRect.width) ? num(fromRect.width) / num(toRect.width) : 1;
    sy = num(fromRect.height) && num(toRect.height) ? num(fromRect.height) / num(toRect.height) : 1;
    if (!dx && !dy && sx === 1 && sy === 1) return;
    t = el.style.transition;
    el.style.transition = 'none';
    el.style.transformOrigin = '0 0';
    el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
    void el.offsetWidth;
    raf(function () {
      if (!/transform/.test((g.getComputedStyle ? g.getComputedStyle(el).transitionProperty : '') || '')) {
        el.style.transition = t ? t + ', transform 180ms ease' : 'transform 180ms ease';
      } else {
        el.style.transition = t;
      }
      el.style.transform = '';
      finish(el, function () {
        el.style.transition = t;
        el.style.transformOrigin = '';
      });
    });
  }

  /**
   * Creates a list animator for child enter/leave/move transitions.
   * @param {Element} container
   * @param {string} className
   * @returns {{update: Function, destroy: Function}}
   */
  function list(container, className) {
    var prev = new Map();
    var dead = [];

    function snap() {
      var m = new Map();
      var a;
      if (!container || !container.children) return m;
      a = Array.prototype.slice.call(container.children);
      a.forEach(function (el) {
        if (el && el.getBoundingClientRect) m.set(el, el.getBoundingClientRect());
      });
      return m;
    }

    function reset() {
      dead.forEach(function (n) {
        try {
          if (n.remove) n.remove();
        } catch (_) {}
      });
      dead = [];
    }

    function dropDead(n) {
      dead = dead.filter(function (x) {
        return x !== n;
      });
    }

    prev = snap();

    return {
      /**
       * Reconciles current children against the previous snapshot.
       */
      update: function () {
        var next = snap();
        prev.forEach(function (r, el) {
          if (!next.has(el)) {
            var c = clone(el, r);
            if (c) {
              dead.push(c);
              leave(c, className, function () {
                try {
                  if (c.remove) c.remove();
                } catch (_) {}
                dropDead(c);
              });
            }
          }
        });
        next.forEach(function (r, el) {
          if (!prev.has(el)) enter(el, className);
          else move(el, prev.get(el), r);
        });
        prev = next;
      },
      /**
       * Disposes tracked clones and snapshots.
       */
      destroy: function () {
        reset();
        prev = new Map();
      }
    };
  }

  return {
    enter: enter,
    leave: leave,
    toggle: toggle,
    move: move,
    list: list,
    prefersReducedMotion: prefersReducedMotion
  };
})();
