var window = typeof globalThis !== 'undefined' ? (globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;
BareMetal.A11y = (function () {
  'use strict';

  var g = typeof globalThis !== 'undefined' ? globalThis : window;
  var live = {};

  function noop() {}

  function mm(q) {
    try {
      return g.matchMedia ? g.matchMedia(q) : null;
    } catch (_) {
      return null;
    }
  }

  function call(fn, a) {
    try {
      return typeof fn === 'function' ? fn(a) : undefined;
    } catch (_) {}
  }

  function focusables(el) {
    var s = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[contenteditable],audio[controls],video[controls],[tabindex]:not([tabindex="-1"])';
    try {
      return Array.prototype.slice.call(el.querySelectorAll(s)).filter(function (n) {
        return !n.hidden && typeof n.focus === 'function';
      });
    } catch (_) {
      return [];
    }
  }

  function ensureLive(priority) {
    var d = g.document;
    var n;
    if (!d || !d.body) return null;
    if (live[priority]) return live[priority];
    n = d.createElement('div');
    n.setAttribute('aria-live', priority);
    n.setAttribute('aria-atomic', 'true');
    n.style.position = 'absolute';
    n.style.width = '1px';
    n.style.height = '1px';
    n.style.margin = '-1px';
    n.style.padding = '0';
    n.style.overflow = 'hidden';
    n.style.clip = 'rect(0 0 0 0)';
    n.style.whiteSpace = 'nowrap';
    n.style.border = '0';
    d.body.appendChild(n);
    live[priority] = n;
    return n;
  }

  function sub(mq, fn) {
    if (!mq || typeof fn !== 'function') return noop;
    if (mq.addEventListener) {
      mq.addEventListener('change', fn);
      return function () { mq.removeEventListener('change', fn); };
    }
    if (mq.addListener) {
      mq.addListener(fn);
      return function () { mq.removeListener(fn); };
    }
    return noop;
  }

  /**
   * Traps focus within a container.
   * @param {Element} container
   * @param {Object} [opts]
   * @returns {{destroy: Function, pause: Function, resume: Function}}
   */
  function focusTrap(container, opts) {
    var paused = false;
    var last = g.document && g.document.activeElement;
    opts = opts || {};
    if (!container || !container.addEventListener) {
      return { destroy: noop, pause: noop, resume: noop };
    }

    function focusFirst() {
      var n = null;
      var a = focusables(container);
      if (opts.initialFocus && container.querySelector) {
        try {
          n = container.querySelector(opts.initialFocus);
        } catch (_) {}
      }
      if (!n) n = a[0] || container;
      if (n && typeof n.focus === 'function') {
        if (n === container && !container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
        g.setTimeout(function () { call(n.focus.bind(n)); }, 0);
      }
    }

    function onKey(e) {
      var a;
      var i;
      if (paused || !e || e.key !== 'Tab') return;
      a = focusables(container);
      if (!a.length) {
        if (e.preventDefault) e.preventDefault();
        focusFirst();
        return;
      }
      i = a.indexOf(g.document.activeElement);
      if (e.shiftKey && (i <= 0 || g.document.activeElement === container)) {
        if (e.preventDefault) e.preventDefault();
        call(a[a.length - 1].focus.bind(a[a.length - 1]));
      } else if (!e.shiftKey && i === a.length - 1) {
        if (e.preventDefault) e.preventDefault();
        call(a[0].focus.bind(a[0]));
      }
    }

    container.addEventListener('keydown', onKey);
    focusFirst();
    return {
      destroy: function () {
        container.removeEventListener('keydown', onKey);
        if (opts.returnFocus !== false && last && typeof last.focus === 'function') g.setTimeout(function () { call(last.focus.bind(last)); }, 0);
      },
      pause: function () {
        paused = true;
      },
      resume: function () {
        paused = false;
        focusFirst();
      }
    };
  }

  /**
   * Announces text via a live region.
   * @param {string} text
   * @param {'polite'|'assertive'} [priority]
   */
  function announce(text, priority) {
    var n = ensureLive(priority === 'assertive' ? 'assertive' : 'polite');
    if (!n) return;
    n.textContent = '';
    g.setTimeout(function () {
      n.textContent = text == null ? '' : String(text);
    }, 20);
  }

  /**
   * Creates a skip-navigation link.
   * @param {string} targetId
   * @returns {{destroy: Function}}
   */
  function skipNav(targetId) {
    var d = g.document;
    var a;
    if (!d || !d.body || !targetId) return { destroy: noop };
    a = d.createElement('a');
    a.href = '#' + targetId;
    a.textContent = 'Skip to content';
    a.style.position = 'absolute';
    a.style.left = '-9999px';
    a.style.top = '0';
    a.style.zIndex = '2147483647';
    a.style.padding = '0.5rem 1rem';
    a.style.background = '#000';
    a.style.color = '#fff';
    a.addEventListener('focus', function () {
      a.style.left = '0.5rem';
    });
    a.addEventListener('blur', function () {
      a.style.left = '-9999px';
    });
    a.addEventListener('click', function (e) {
      var t = d.getElementById(targetId);
      if (e.preventDefault) e.preventDefault();
      if (!t) return;
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      call(t.focus.bind(t));
    });
    d.body.insertBefore(a, d.body.firstChild || null);
    return {
      destroy: function () {
        if (a.remove) a.remove();
      }
    };
  }

  /**
   * Enables roving tabindex keyboard navigation.
   * @param {Element} container
   * @param {string} selector
   * @param {Object} [opts]
   * @returns {{destroy: Function, focus: Function}}
   */
  function roving(container, selector, opts) {
    var i = 0;
    opts = opts || {};
    if (!container || !container.addEventListener) return { destroy: noop, focus: noop };

    function items() {
      try {
        return Array.prototype.slice.call(container.querySelectorAll(selector || '[tabindex]'));
      } catch (_) {
        return [];
      }
    }

    function sync() {
      var a = items();
      a.forEach(function (n, idx) {
        n.setAttribute('tabindex', idx === i ? '0' : '-1');
      });
      return a;
    }

    function focusAt(idx) {
      var a = sync();
      if (!a.length) return;
      i = Math.max(0, Math.min(idx, a.length - 1));
      sync();
      call(a[i].focus.bind(a[i]));
    }

    function onKey(e) {
      var a = items();
      var next = i;
      if (!a.length || !e) return;
      if (opts.direction === 'vertical') {
        if (e.key === 'ArrowDown') next++;
        if (e.key === 'ArrowUp') next--;
      } else {
        if (e.key === 'ArrowRight') next++;
        if (e.key === 'ArrowLeft') next--;
      }
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = a.length - 1;
      if (next !== i) {
        if (e.preventDefault) e.preventDefault();
        focusAt((next + a.length) % a.length);
      }
    }

    function onFocus(e) {
      var a = items();
      var idx = a.indexOf(e.target);
      if (idx > -1) {
        i = idx;
        sync();
      }
    }

    sync();
    container.addEventListener('keydown', onKey);
    container.addEventListener('focusin', onFocus);
    return {
      destroy: function () {
        container.removeEventListener('keydown', onKey);
        container.removeEventListener('focusin', onFocus);
      },
      focus: focusAt
    };
  }

  /**
   * Returns whether reduced-motion is preferred.
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    var q = mm('(prefers-reduced-motion: reduce)');
    return !!(q && q.matches);
  }

  /**
   * Returns the preferred color scheme.
   * @returns {'light'|'dark'|'no-preference'}
   */
  function prefersColorScheme() {
    if (mm('(prefers-color-scheme: dark)') && mm('(prefers-color-scheme: dark)').matches) return 'dark';
    if (mm('(prefers-color-scheme: light)') && mm('(prefers-color-scheme: light)').matches) return 'light';
    return 'no-preference';
  }

  /**
   * Subscribes to reduced-motion preference changes.
   * @param {Function} fn
   * @returns {Function}
   */
  function onMotionChange(fn) {
    var q = mm('(prefers-reduced-motion: reduce)');
    return sub(q, function () { call(fn, prefersReducedMotion()); });
  }

  /**
   * Subscribes to color-scheme preference changes.
   * @param {Function} fn
   * @returns {Function}
   */
  function onSchemeChange(fn) {
    var off1 = sub(mm('(prefers-color-scheme: dark)'), function () { call(fn, prefersColorScheme()); });
    var off2 = sub(mm('(prefers-color-scheme: light)'), function () { call(fn, prefersColorScheme()); });
    return function () {
      off1();
      off2();
    };
  }

  return {
    focusTrap: focusTrap,
    announce: announce,
    skipNav: skipNav,
    roving: roving,
    prefersReducedMotion: prefersReducedMotion,
    prefersColorScheme: prefersColorScheme,
    onMotionChange: onMotionChange,
    onSchemeChange: onSchemeChange
  };
})();
