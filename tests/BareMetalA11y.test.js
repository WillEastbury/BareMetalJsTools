/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.A11y.js');

function loadA11y() {
  delete require.cache[SRC];
  return require(SRC);
}

describe('BareMetal.A11y', () => {
  let A11y;
  let realMatchMedia;

  function createMql(matches) {
    const listeners = [];
    return {
      matches,
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
        listeners.slice().forEach((fn) => fn({ matches: next }));
      }
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    realMatchMedia = global.matchMedia;
    const queries = {
      '(prefers-reduced-motion: reduce)': createMql(false),
      '(prefers-color-scheme: dark)': createMql(false),
      '(prefers-color-scheme: light)': createMql(true)
    };
    global.matchMedia = jest.fn((query) => queries[query] || createMql(false));
    A11y = loadA11y();
  });

  afterEach(() => {
    global.matchMedia = realMatchMedia;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('exports the main accessibility helpers', () => {
    expect(Object.keys(A11y)).toEqual([
      'focusTrap',
      'announce',
      'skipNav',
      'roving',
      'prefersReducedMotion',
      'prefersColorScheme',
      'onMotionChange',
      'onSchemeChange'
    ]);
  });

  test('focusTrap returns noop controls for invalid containers', () => {
    expect(A11y.focusTrap(null)).toEqual({
      destroy: expect.any(Function),
      pause: expect.any(Function),
      resume: expect.any(Function)
    });
  });

  test('focusTrap focuses the requested initial element', () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const second = document.createElement('button');
    second.className = 'preferred';
    container.append(first, second);
    document.body.appendChild(container);
    const focusSpy = jest.spyOn(second, 'focus').mockImplementation(() => {});

    A11y.focusTrap(container, { initialFocus: '.preferred' });
    jest.advanceTimersByTime(0);

    expect(focusSpy).toHaveBeenCalled();
  });

  test('focusTrap wraps tab from the last element to the first', () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const second = document.createElement('button');
    container.append(first, second);
    document.body.appendChild(container);
    const firstFocus = jest.spyOn(first, 'focus').mockImplementation(() => {});

    A11y.focusTrap(container);
    Object.defineProperty(document, 'activeElement', { configurable: true, value: second });
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(firstFocus).toHaveBeenCalled();
  });

  test('focusTrap wraps shift+tab from the first element to the last', () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const second = document.createElement('button');
    container.append(first, second);
    document.body.appendChild(container);
    const secondFocus = jest.spyOn(second, 'focus').mockImplementation(() => {});

    A11y.focusTrap(container);
    Object.defineProperty(document, 'activeElement', { configurable: true, value: first });
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));

    expect(secondFocus).toHaveBeenCalled();
  });

  test('focusTrap focuses the container when no focusable children exist', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const focusSpy = jest.spyOn(container, 'focus').mockImplementation(() => {});

    A11y.focusTrap(container);
    jest.advanceTimersByTime(0);

    expect(container.getAttribute('tabindex')).toBe('-1');
    expect(focusSpy).toHaveBeenCalled();
  });

  test('focusTrap pause prevents tab wrapping until resumed', () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const second = document.createElement('button');
    container.append(first, second);
    document.body.appendChild(container);
    const api = A11y.focusTrap(container);
    const firstFocus = jest.spyOn(first, 'focus').mockImplementation(() => {});

    api.pause();
    Object.defineProperty(document, 'activeElement', { configurable: true, value: second });
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(firstFocus).not.toHaveBeenCalled();

    api.resume();
    jest.advanceTimersByTime(0);
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(firstFocus).toHaveBeenCalled();
  });

  test('focusTrap destroy returns focus to the previously active element', () => {
    const previous = document.createElement('button');
    const container = document.createElement('div');
    container.appendChild(document.createElement('button'));
    document.body.append(previous, container);
    const previousFocus = jest.spyOn(previous, 'focus').mockImplementation(() => {});
    Object.defineProperty(document, 'activeElement', { configurable: true, value: previous });

    const api = A11y.focusTrap(container);
    api.destroy();
    jest.advanceTimersByTime(0);

    expect(previousFocus).toHaveBeenCalled();
  });

  test('focusTrap destroy can skip returning focus', () => {
    const previous = document.createElement('button');
    const container = document.createElement('div');
    container.appendChild(document.createElement('button'));
    document.body.append(previous, container);
    const previousFocus = jest.spyOn(previous, 'focus').mockImplementation(() => {});
    Object.defineProperty(document, 'activeElement', { configurable: true, value: previous });

    const api = A11y.focusTrap(container, { returnFocus: false });
    api.destroy();
    jest.advanceTimersByTime(0);

    expect(previousFocus).not.toHaveBeenCalled();
  });

  test('announce creates a polite live region', () => {
    A11y.announce('Saved');
    jest.advanceTimersByTime(20);

    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    expect(live.textContent).toBe('Saved');
  });

  test('announce reuses live regions and supports assertive priority', () => {
    A11y.announce('First', 'assertive');
    jest.advanceTimersByTime(20);
    A11y.announce('Second', 'assertive');
    jest.advanceTimersByTime(20);

    const regions = document.querySelectorAll('[aria-live="assertive"]');
    expect(regions).toHaveLength(1);
    expect(regions[0].textContent).toBe('Second');
  });

  test('skipNav inserts a link and focuses the target on click', () => {
    const target = document.createElement('main');
    target.id = 'content';
    const focusSpy = jest.spyOn(target, 'focus').mockImplementation(() => {});
    document.body.appendChild(target);

    A11y.skipNav('content');
    const link = document.body.firstChild;
    link.dispatchEvent(new Event('focus'));
    expect(link.style.left).toBe('0.5rem');
    link.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(target.getAttribute('tabindex')).toBe('-1');
    expect(focusSpy).toHaveBeenCalled();
  });

  test('skipNav blur hides the link and destroy removes it', () => {
    const api = A11y.skipNav('content');
    const link = document.body.firstChild;

    link.dispatchEvent(new Event('blur'));
    expect(link.style.left).toBe('-9999px');

    api.destroy();
    expect(document.body.contains(link)).toBe(false);
  });

  test('skipNav returns noop for missing target ids', () => {
    expect(() => A11y.skipNav('').destroy()).not.toThrow();
  });

  test('roving sets initial tabindex values', () => {
    const container = document.createElement('div');
    const one = document.createElement('button');
    const two = document.createElement('button');
    const three = document.createElement('button');
    container.append(one, two, three);
    document.body.appendChild(container);

    A11y.roving(container, 'button');

    expect(one.getAttribute('tabindex')).toBe('0');
    expect(two.getAttribute('tabindex')).toBe('-1');
    expect(three.getAttribute('tabindex')).toBe('-1');
  });

  test('roving ArrowRight and ArrowLeft move focus', () => {
    const container = document.createElement('div');
    const one = document.createElement('button');
    const two = document.createElement('button');
    container.append(one, two);
    document.body.appendChild(container);
    const focusSpy = jest.spyOn(two, 'focus').mockImplementation(() => {});
    const api = A11y.roving(container, 'button');

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(focusSpy).toHaveBeenCalled();

    api.focus(0);
    expect(one.getAttribute('tabindex')).toBe('0');
  });

  test('roving Home and End move to the first and last item', () => {
    const container = document.createElement('div');
    const one = document.createElement('button');
    const two = document.createElement('button');
    const three = document.createElement('button');
    container.append(one, two, three);
    document.body.appendChild(container);
    const lastFocus = jest.spyOn(three, 'focus').mockImplementation(() => {});
    const firstFocus = jest.spyOn(one, 'focus').mockImplementation(() => {});

    A11y.roving(container, 'button');
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));

    expect(lastFocus).toHaveBeenCalled();
    expect(firstFocus).toHaveBeenCalled();
  });

  test('roving supports vertical navigation', () => {
    const container = document.createElement('div');
    const one = document.createElement('button');
    const two = document.createElement('button');
    container.append(one, two);
    document.body.appendChild(container);
    const focusSpy = jest.spyOn(two, 'focus').mockImplementation(() => {});

    A11y.roving(container, 'button', { direction: 'vertical' });
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(focusSpy).toHaveBeenCalled();
  });

  test('roving updates its index from focusin events', () => {
    const container = document.createElement('div');
    const one = document.createElement('button');
    const two = document.createElement('button');
    container.append(one, two);
    document.body.appendChild(container);
    A11y.roving(container, 'button');

    two.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(two.getAttribute('tabindex')).toBe('0');
  });

  test('roving destroy removes listeners safely', () => {
    const container = document.createElement('div');
    container.appendChild(document.createElement('button'));
    document.body.appendChild(container);

    const api = A11y.roving(container, 'button');
    expect(() => api.destroy()).not.toThrow();
  });

  test('prefersReducedMotion and prefersColorScheme use matchMedia', () => {
    expect(A11y.prefersReducedMotion()).toBe(false);
    expect(A11y.prefersColorScheme()).toBe('light');
  });

  test('onMotionChange subscribes and unsubscribes', () => {
    const spy = jest.fn();
    const stop = A11y.onMotionChange(spy);
    const mql = global.matchMedia.mock.results[0].value;

    mql.trigger(true);
    expect(spy).toHaveBeenCalledWith(true);

    stop();
    mql.trigger(false);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('onSchemeChange reacts to both dark and light media queries', () => {
    const spy = jest.fn();
    const stop = A11y.onSchemeChange(spy);
    const dark = global.matchMedia.mock.results.find((entry) => entry.value.media === undefined)?.value || null;
    const calls = global.matchMedia.mock.results.map((entry) => entry.value);
    const darkMql = calls.find((mql, index) => global.matchMedia.mock.calls[index][0] === '(prefers-color-scheme: dark)');
    const lightMql = calls.find((mql, index) => global.matchMedia.mock.calls[index][0] === '(prefers-color-scheme: light)');

    darkMql.trigger(true);
    lightMql.trigger(false);

    expect(spy).toHaveBeenCalledWith('dark');
    stop();
  });
});
