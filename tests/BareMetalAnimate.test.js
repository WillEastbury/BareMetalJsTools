/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.Animate.js');

function loadAnimate() {
  delete require.cache[SRC];
  return require(SRC);
}

describe('BareMetal.Animate', () => {
  let Animate;
  let realRAF;
  let realMatchMedia;
  let realGetComputedStyle;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    realRAF = global.requestAnimationFrame;
    realMatchMedia = global.matchMedia;
    realGetComputedStyle = global.getComputedStyle;
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    global.matchMedia = jest.fn().mockReturnValue({ matches: false });
    global.getComputedStyle = jest.fn((el) => ({
      display: el.style.display || 'block',
      visibility: el.style.visibility || 'visible',
      opacity: el.style.opacity || '1',
      transitionDuration: '0s',
      transitionDelay: '0s',
      animationDuration: '0s',
      animationDelay: '0s',
      transitionProperty: el.style.transitionProperty || ''
    }));
    Animate = loadAnimate();
  });

  afterEach(() => {
    global.requestAnimationFrame = realRAF;
    global.matchMedia = realMatchMedia;
    global.getComputedStyle = realGetComputedStyle;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function flushAnimation() {
    jest.advanceTimersByTime(0);
    jest.advanceTimersByTime(0);
    jest.advanceTimersByTime(60);
  }

  test('exports the main animation helpers', () => {
    expect(Object.keys(Animate)).toEqual([
      'enter',
      'leave',
      'toggle',
      'move',
      'list',
      'prefersReducedMotion'
    ]);
  });

  test('prefersReducedMotion reflects matchMedia', () => {
    expect(Animate.prefersReducedMotion()).toBe(false);
    global.matchMedia.mockReturnValue({ matches: true });
    expect(loadAnimate().prefersReducedMotion()).toBe(true);
  });

  test('enter unhides an element and invokes the callback', () => {
    const el = document.createElement('div');
    el.hidden = true;
    el.style.display = 'none';
    const done = jest.fn();

    Animate.enter(el, 'fade', done);
    flushAnimation();

    expect(el.hidden).toBe(false);
    expect(el.style.display).toBe('');
    expect(el.classList.contains('fade')).toBe(false);
    expect(el.classList.contains('fade-active')).toBe(false);
    expect(done).toHaveBeenCalledTimes(1);
  });

  test('enter without a class completes immediately', () => {
    const el = document.createElement('div');
    const done = jest.fn();

    Animate.enter(el, '', done);

    expect(done).toHaveBeenCalledTimes(1);
  });

  test('leave removes the element by default', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    Animate.leave(el, 'fade');
    flushAnimation();

    expect(document.body.contains(el)).toBe(false);
  });

  test('leave uses a custom completion callback instead of removing', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const done = jest.fn();

    Animate.leave(el, 'fade', done);
    flushAnimation();

    expect(done).toHaveBeenCalledTimes(1);
    expect(document.body.contains(el)).toBe(true);
  });

  test('toggle leaves a visible element', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    Animate.toggle(el, 'in', 'out');
    flushAnimation();

    expect(document.body.contains(el)).toBe(false);
  });

  test('toggle enters a hidden element', () => {
    const el = document.createElement('div');
    el.hidden = true;
    el.style.display = 'none';

    Animate.toggle(el, 'in', 'out');
    flushAnimation();

    expect(el.hidden).toBe(false);
    expect(el.style.display).toBe('');
  });

  test('move is a no-op when rectangles are identical', () => {
    const el = document.createElement('div');
    el.style.transition = 'opacity 1s';

    Animate.move(el, { left: 0, top: 0, width: 10, height: 10 }, { left: 0, top: 0, width: 10, height: 10 });

    expect(el.style.transform).toBe('');
    expect(el.style.transition).toBe('opacity 1s');
  });

  test('move applies and then clears a transform animation', () => {
    const el = document.createElement('div');
    el.style.transition = 'opacity 100ms';

    Animate.move(el, { left: 20, top: 30, width: 40, height: 50 }, { left: 10, top: 10, width: 20, height: 25 });

    expect(el.style.transform).toContain('translate(');
    flushAnimation();

    expect(el.style.transform).toBe('');
    expect(el.style.transformOrigin).toBe('');
    expect(el.style.transition).toBe('opacity 100ms');
  });

  test('move adds a transform transition when none exists', () => {
    const el = document.createElement('div');
    el.style.transition = '';

    Animate.move(el, { left: 10, top: 10, width: 20, height: 20 }, { left: 0, top: 0, width: 10, height: 10 });
    jest.advanceTimersByTime(1);
    jest.advanceTimersByTime(1);

    expect(el.style.transition).toContain('transform 180ms ease');
  });

  test('move preserves existing transform transitions', () => {
    global.getComputedStyle = jest.fn((el) => ({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      transitionDuration: '0s',
      transitionDelay: '0s',
      animationDuration: '0s',
      animationDelay: '0s',
      transitionProperty: 'opacity, transform'
    }));
    Animate = loadAnimate();
    const el = document.createElement('div');
    const original = 'opacity 1s, transform 1s';
    el.style.transition = original;
    Animate.move(el, { left: 10, top: 10, width: 20, height: 20 }, { left: 0, top: 0, width: 10, height: 10 });
    flushAnimation();

    expect(el.style.transition).toBe(original);
  });

  test('reduced motion finishes enter immediately', () => {
    global.matchMedia = jest.fn().mockReturnValue({ matches: true });
    Animate = loadAnimate();
    const el = document.createElement('div');
    const done = jest.fn();

    Animate.enter(el, 'fade', done);

    expect(done).toHaveBeenCalledTimes(1);
    expect(el.classList.contains('fade')).toBe(false);
  });

  test('list update enters newly added children', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const first = document.createElement('div');
    first.textContent = 'a';
    first.getBoundingClientRect = () => ({ left: 0, top: 0, width: 20, height: 20 });
    container.appendChild(first);
    const list = Animate.list(container, 'fade');

    const second = document.createElement('div');
    second.textContent = 'b';
    second.getBoundingClientRect = () => ({ left: 20, top: 0, width: 20, height: 20 });
    container.appendChild(second);
    list.update();
    flushAnimation();

    expect(container.children).toHaveLength(2);
    expect(second.classList.contains('fade')).toBe(false);
  });

  test('list update animates removed children with temporary clones', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const child = document.createElement('div');
    child.textContent = 'x';
    child.getBoundingClientRect = () => ({ left: 0, top: 0, width: 30, height: 30 });
    container.appendChild(child);
    const list = Animate.list(container, 'fade');

    container.removeChild(child);
    list.update();

    expect(document.body.querySelectorAll('div').length).toBeGreaterThan(1);
    flushAnimation();
    expect(document.body.querySelectorAll('div').length).toBe(1);
  });

  test('list destroy clears tracked clones', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const child = document.createElement('div');
    child.getBoundingClientRect = () => ({ left: 0, top: 0, width: 30, height: 30 });
    container.appendChild(child);
    const list = Animate.list(container, 'fade');

    container.removeChild(child);
    list.update();
    list.destroy();

    expect(document.body.querySelectorAll('div').length).toBe(1);
  });

  test('handles null elements safely', () => {
    expect(() => {
      Animate.enter(null, 'fade');
      Animate.leave(null, 'fade');
      Animate.toggle(null, 'fade');
      Animate.move(null, {}, {});
    }).not.toThrow();
  });
});
