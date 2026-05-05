/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Observe.js');

function loadObserve() {
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Observe;');
  return fn();
}

function makeObserverClass(store) {
  return jest.fn(function Observer(callback, options) {
    this.callback = callback;
    this.options = options;
    this.targets = [];
    this.observe = jest.fn((target) => { this.targets.push(target); });
    this.unobserve = jest.fn((target) => {
      this.targets = this.targets.filter((item) => item !== target);
    });
    this.disconnect = jest.fn();
    store.push(this);
  });
}

describe('BareMetal.Observe', () => {
  let Observe;
  let resizeInstances;
  let intersectionInstances;
  let mutationInstances;
  let realResizeObserver;
  let realIntersectionObserver;
  let realMutationObserver;
  let realMatchMedia;
  let mediaQueries;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    resizeInstances = [];
    intersectionInstances = [];
    mutationInstances = [];
    mediaQueries = [];
    realResizeObserver = global.ResizeObserver;
    realIntersectionObserver = global.IntersectionObserver;
    realMutationObserver = global.MutationObserver;
    realMatchMedia = global.matchMedia;

    global.ResizeObserver = makeObserverClass(resizeInstances);
    global.IntersectionObserver = makeObserverClass(intersectionInstances);
    global.MutationObserver = makeObserverClass(mutationInstances);
    global.matchMedia = jest.fn((query) => {
      const listeners = [];
      const mq = {
        media: query,
        matches: false,
        addEventListener: jest.fn((type, fn) => {
          if (type === 'change') listeners.push(fn);
        }),
        removeEventListener: jest.fn((type, fn) => {
          if (type !== 'change') return;
          const index = listeners.indexOf(fn);
          if (index >= 0) listeners.splice(index, 1);
        }),
        trigger(next) {
          this.matches = next;
          listeners.slice().forEach((fn) => fn({ matches: next, media: query }));
        }
      };
      mediaQueries.push(mq);
      return mq;
    });

    Observe = loadObserve();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.ResizeObserver = realResizeObserver;
    global.IntersectionObserver = realIntersectionObserver;
    global.MutationObserver = realMutationObserver;
    global.matchMedia = realMatchMedia;
    jest.restoreAllMocks();
  });

  test('resize maps ResizeObserver entries to width and height', () => {
    const el = document.createElement('div');
    const spy = jest.fn();
    const handle = Observe.resize(el, spy, { box: 'content-box' });
    const ro = resizeInstances[0];

    expect(ro.observe).toHaveBeenCalledWith(el, { box: 'content-box' });

    ro.callback([{ target: el, contentRect: { width: 120, height: 45 } }]);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ width: 120, height: 45 }));
    handle.disconnect();
    expect(ro.disconnect).toHaveBeenCalled();
  });

  test('intersection maps observer state', () => {
    const el = document.createElement('div');
    const spy = jest.fn();
    const handle = Observe.intersection(el, spy, { rootMargin: '10px', threshold: 0.5 });
    const io = intersectionInstances[0];

    expect(io.observe).toHaveBeenCalledWith(el);
    expect(io.options).toEqual({ root: null, rootMargin: '10px', threshold: 0.5 });

    io.callback([{ target: el, isIntersecting: true, intersectionRatio: 0.25 }]);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ isIntersecting: true, ratio: 0.25 }));
    handle.disconnect();
    expect(io.disconnect).toHaveBeenCalled();
  });

  test('mutation forwards records with observer options', () => {
    const el = document.createElement('div');
    const spy = jest.fn();
    const handle = Observe.mutation(el, spy, { childList: false, attributes: true, attributeFilter: ['data-x'] });
    const mo = mutationInstances[0];
    const record = { type: 'attributes', target: el };

    expect(mo.observe).toHaveBeenCalledWith(el, {
      childList: false,
      attributes: true,
      characterData: false,
      subtree: true,
      attributeFilter: ['data-x']
    });

    mo.callback([record]);
    expect(spy).toHaveBeenCalledWith([record], mo, el);

    handle.disconnect();
    expect(mo.disconnect).toHaveBeenCalled();
  });

  test('lazyLoad swaps data-src attributes and marks loaded on load', () => {
    document.body.innerHTML = '<img id="hero" data-src="hero.jpg" data-srcset="hero@2x.jpg 2x">';
    const img = document.getElementById('hero');
    const onLoad = jest.fn();
    const handle = Observe.lazyLoad('#hero', { onLoad });
    const io = intersectionInstances[0];

    io.callback([{ target: img, isIntersecting: true, intersectionRatio: 1 }]);
    img.dispatchEvent(new Event('load'));

    expect(img.getAttribute('src')).toBe('hero.jpg');
    expect(img.getAttribute('srcset')).toBe('hero@2x.jpg 2x');
    expect(img.classList.contains('loaded')).toBe(true);
    expect(onLoad).toHaveBeenCalledWith(img, expect.objectContaining({ target: img, isIntersecting: true, intersectionRatio: 1 }));
    expect(io.unobserve).toHaveBeenCalledWith(img);

    handle.destroy();
    expect(io.disconnect).toHaveBeenCalled();
  });

  test('infinite triggers loadMore on enter edges', () => {
    const sentinel = document.createElement('div');
    const loadMore = jest.fn();
    Observe.infinite(sentinel, loadMore);
    const io = intersectionInstances[0];

    io.callback([{ target: sentinel, isIntersecting: true, intersectionRatio: 1 }]);
    io.callback([{ target: sentinel, isIntersecting: true, intersectionRatio: 1 }]);
    io.callback([{ target: sentinel, isIntersecting: false, intersectionRatio: 0 }]);
    io.callback([{ target: sentinel, isIntersecting: true, intersectionRatio: 1 }]);

    expect(loadMore).toHaveBeenCalledTimes(2);
  });

  test('sticky tracks stuck state and invokes callbacks', () => {
    document.body.innerHTML = '<div id="wrap"><div id="sticky" style="position:sticky;top:0"></div></div>';
    const el = document.getElementById('sticky');
    const onStick = jest.fn();
    const onUnstick = jest.fn();
    const handle = Observe.sticky(el, { top: 0, onStick, onUnstick });
    const io = intersectionInstances[0];

    io.callback([{ target: io.targets[0], isIntersecting: false, intersectionRatio: 0 }]);
    expect(handle.isStuck).toBe(true);
    expect(onStick).toHaveBeenCalledWith(el, expect.objectContaining({ isIntersecting: false }));

    io.callback([{ target: io.targets[0], isIntersecting: true, intersectionRatio: 1 }]);
    expect(handle.isStuck).toBe(false);
    expect(onUnstick).toHaveBeenCalledWith(el, expect.objectContaining({ isIntersecting: true }));

    handle.destroy();
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  test('viewport resolves when element first enters the viewport', async () => {
    const el = document.createElement('div');
    let resolved = false;
    const promise = Observe.viewport(el).then(() => { resolved = true; });
    const io = intersectionInstances[0];

    io.callback([{ target: el, isIntersecting: false, intersectionRatio: 0 }]);
    await Promise.resolve();
    expect(resolved).toBe(false);

    io.callback([{ target: el, isIntersecting: true, intersectionRatio: 1 }]);
    await promise;
    expect(resolved).toBe(true);
    expect(io.disconnect).toHaveBeenCalled();
  });

  test('trackSize debounces callback and returns latest size', () => {
    const el = document.createElement('div');
    const spy = jest.fn();
    const handle = Observe.trackSize(el, spy, { debounce: 50 });
    const ro = resizeInstances[0];

    ro.callback([{ target: el, contentRect: { width: 300, height: 100 } }]);
    ro.callback([{ target: el, contentRect: { width: 420, height: 180 } }]);

    expect(handle.getSize()).toEqual({ width: 420, height: 180 });
    expect(spy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ width: 420, height: 180 }, expect.any(Object));

    handle.disconnect();
    expect(ro.disconnect).toHaveBeenCalled();
  });

  test('breakpoint emits names when width crosses thresholds', () => {
    const el = document.createElement('div');
    const spy = jest.fn();
    el.getBoundingClientRect = () => ({ width: 500, height: 90, top: 0, right: 500, bottom: 90, left: 0 });

    const handle = Observe.breakpoint(el, { sm: 0, md: 768, lg: 1024 }, spy);
    const ro = resizeInstances[0];

    expect(spy).toHaveBeenNthCalledWith(1, 'sm', expect.objectContaining({ width: 500, height: 90 }));

    ro.callback([{ target: el, contentRect: { width: 800, height: 90 } }]);
    ro.callback([{ target: el, contentRect: { width: 1100, height: 90 } }]);
    ro.callback([{ target: el, contentRect: { width: 900, height: 90 } }]);
    ro.callback([{ target: el, contentRect: { width: 920, height: 90 } }]);

    expect(spy).toHaveBeenNthCalledWith(2, 'md', expect.objectContaining({ width: 800 }));
    expect(spy).toHaveBeenNthCalledWith(3, 'lg', expect.objectContaining({ width: 1100 }));
    expect(spy).toHaveBeenNthCalledWith(4, 'md', expect.objectContaining({ width: 900 }));
    expect(spy).toHaveBeenCalledTimes(4);

    handle.disconnect();
  });

  test('animateOnScroll toggles classes on enter and leave', () => {
    document.body.innerHTML = '<div class="card"></div>';
    const el = document.querySelector('.card');
    const handle = Observe.animateOnScroll([el], { class: 'visible' });
    const io = intersectionInstances[0];

    io.callback([{ target: el, isIntersecting: true, intersectionRatio: 0.5 }]);
    expect(el.classList.contains('visible')).toBe(true);

    io.callback([{ target: el, isIntersecting: false, intersectionRatio: 0 }]);
    expect(el.classList.contains('visible')).toBe(false);

    handle.destroy();
    expect(io.disconnect).toHaveBeenCalled();
  });

  test('mediaQuery reports changes and cleans up listeners', () => {
    const spy = jest.fn();
    const handle = Observe.mediaQuery('(min-width: 768px)', spy);
    const mq = mediaQueries[0];

    expect(spy).toHaveBeenNthCalledWith(1, false, mq);
    expect(handle.matches).toBe(false);

    mq.trigger(true);
    expect(spy).toHaveBeenNthCalledWith(2, true, expect.objectContaining({ matches: true }));
    expect(handle.matches).toBe(true);

    handle.destroy();
    mq.trigger(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('mutationStream yields queued MutationRecords and closes cleanly', async () => {
    const el = document.createElement('div');
    const stream = Observe.mutationStream(el, { attributes: true });
    const mo = mutationInstances[0];
    const record = { type: 'attributes', target: el };

    expect(stream[Symbol.asyncIterator]()).toBe(stream);

    const pending = stream.next();
    mo.callback([record]);

    await expect(pending).resolves.toEqual({ value: record, done: false });

    stream.disconnect();
    await expect(stream.next()).resolves.toEqual({ done: true });
    expect(mo.disconnect).toHaveBeenCalled();
  });
});
