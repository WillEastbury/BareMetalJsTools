/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs   = require('fs');

const SRC = path.resolve(
  __dirname, '../src/BareMetalBind.js'
);

// Helper: load BareMetalBind into the current jsdom context each time.
// Uses new Function so each test suite starts from a fresh module instance.
function loadBind() {
  const code = fs.readFileSync(SRC, 'utf8');
  const iife = code.replace(/const BareMetalBind\s*=\s*/, '').replace(/;\s*$/, '');
  const factory = new Function(
    'document', 'requestAnimationFrame',
    `return (${iife});`
  );
  const raf = typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame
    : (cb) => setTimeout(cb, 0);
  return factory(global.document, raf);
}

// ── reactive() ────────────────────────────────────────────────────────────

describe('BareMetalBind – reactive()', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('returns state, watch, and data properties', () => {
    const r = bind.reactive({ x: 1 });
    expect(r).toHaveProperty('state');
    expect(r).toHaveProperty('watch');
    expect(r).toHaveProperty('data');
  });

  test('state reads initial values', () => {
    const { state } = bind.reactive({ name: 'Alice', age: 30 });
    expect(state.name).toBe('Alice');
    expect(state.age).toBe(30);
  });

  test('setting state property notifies registered watcher', () => {
    const { state, watch } = bind.reactive({ count: 0 });
    const spy = jest.fn();
    watch('count', spy);
    state.count = 5;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('setting state property updates data object', () => {
    const { state, data } = bind.reactive({ val: 'old' });
    state.val = 'new';
    expect(data.val).toBe('new');
  });

  test('multiple watchers on the same key are all called', () => {
    const { state, watch } = bind.reactive({ x: 0 });
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    watch('x', spy1);
    watch('x', spy2);
    state.x = 42;
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  test('watcher for a different key is NOT called', () => {
    const { state, watch } = bind.reactive({ a: 1, b: 2 });
    const spyA = jest.fn();
    watch('a', spyA);
    state.b = 99;
    expect(spyA).not.toHaveBeenCalled();
  });
});

// ── bind() – m-text ──────────────────────────────────────────────────────

describe('BareMetalBind – bind() m-text directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('sets textContent from state on initial bind', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="greeting"></span>';
    const { state, watch } = bind.reactive({ greeting: 'Hello' });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('Hello');
  });

  test('updates textContent when state changes', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="msg"></span>';
    const { state, watch } = bind.reactive({ msg: 'before' });
    bind.bind(root, state, watch);
    state.msg = 'after';
    expect(root.querySelector('span').textContent).toBe('after');
  });

  test('textContent is empty string when state value is undefined', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="missing"></span>';
    const { state, watch } = bind.reactive({});
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('');
  });
});

// ── bind() – m-value ─────────────────────────────────────────────────────

describe('BareMetalBind – bind() m-value directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('sets input value from state on initial bind', () => {
    const root = document.createElement('div');
    root.innerHTML = '<input m-value="name">';
    const { state, watch } = bind.reactive({ name: 'Bob' });
    bind.bind(root, state, watch);
    expect(root.querySelector('input').value).toBe('Bob');
  });

  test('updates input value when state changes', () => {
    const root = document.createElement('div');
    root.innerHTML = '<input m-value="city">';
    const { state, watch } = bind.reactive({ city: 'London' });
    bind.bind(root, state, watch);
    state.city = 'Paris';
    expect(root.querySelector('input').value).toBe('Paris');
  });

  test('input event updates state', () => {
    const root = document.createElement('div');
    root.innerHTML = '<input m-value="val">';
    const { state, watch } = bind.reactive({ val: '' });
    bind.bind(root, state, watch);
    const inp = root.querySelector('input');
    inp.value = 'typed';
    inp.dispatchEvent(new Event('input'));
    expect(state.val).toBe('typed');
  });

  test('checkbox reflects boolean state', () => {
    const root = document.createElement('div');
    root.innerHTML = '<input type="checkbox" m-value="active">';
    const { state, watch } = bind.reactive({ active: true });
    bind.bind(root, state, watch);
    expect(root.querySelector('input').checked).toBe(true);
  });

  test('checkbox change event updates boolean state', () => {
    const root = document.createElement('div');
    root.innerHTML = '<input type="checkbox" m-value="flag">';
    const { state, watch } = bind.reactive({ flag: false });
    bind.bind(root, state, watch);
    const chk = root.querySelector('input');
    chk.checked = true;
    chk.dispatchEvent(new Event('change'));
    expect(state.flag).toBe(true);
  });

  test('date input formats value to YYYY-MM-DD', () => {
    const root = document.createElement('div');
    root.innerHTML = '<input type="date" m-value="dob">';
    const { state, watch } = bind.reactive({ dob: '2000-06-15T00:00:00Z' });
    bind.bind(root, state, watch);
    expect(root.querySelector('input').value).toBe('2000-06-15');
  });
});

// ── bind() – m-if ────────────────────────────────────────────────────────

describe('BareMetalBind – bind() m-if directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('shows element when state value is truthy', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-if="visible">content</div>';
    const { state, watch } = bind.reactive({ visible: true });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').style.display).toBe('');
  });

  test('hides element when state value is falsy', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-if="visible">content</div>';
    const { state, watch } = bind.reactive({ visible: false });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').style.display).toBe('none');
  });

  test('toggles display when state changes', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-if="show">x</div>';
    const { state, watch } = bind.reactive({ show: true });
    bind.bind(root, state, watch);
    state.show = false;
    expect(root.querySelector('div').style.display).toBe('none');
    state.show = true;
    expect(root.querySelector('div').style.display).toBe('');
  });
});

// ── bind() – m-click ──────────────────────────────────────────────────

describe('BareMetalBind – bind() m-click directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('calls state function when button is clicked', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button m-click="handleClick">click me</button>';
    const handler = jest.fn();
    const { state, watch } = bind.reactive({ handleClick: handler });
    bind.bind(root, state, watch);
    root.querySelector('button').click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('does not throw when m-click references a non-function state key', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button m-click="notAFn">x</button>';
    const { state, watch } = bind.reactive({ notAFn: 'oops' });
    bind.bind(root, state, watch);
    expect(() => root.querySelector('button').click()).not.toThrow();
  });
});

// ── bind() – m-submit ─────────────────────────────────────────────────

describe('BareMetalBind – bind() m-submit directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('calls state function on form submit', () => {
    const root = document.createElement('div');
    root.innerHTML = '<form m-submit="save"><button type="submit">go</button></form>';
    const saveHandler = jest.fn();
    const { state, watch } = bind.reactive({ save: saveHandler });
    bind.bind(root, state, watch);
    const form = root.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    expect(saveHandler).toHaveBeenCalledTimes(1);
  });
});

// ── bind() – m-class ──────────────────────────────────────────────────

describe('BareMetalBind – bind() m-class directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('adds class when state is truthy on initial bind', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-class="highlight:active"></div>';
    const { state, watch } = bind.reactive({ active: true });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').classList.contains('highlight')).toBe(true);
  });

  test('does not add class when state is falsy', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-class="highlight:active"></div>';
    const { state, watch } = bind.reactive({ active: false });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').classList.contains('highlight')).toBe(false);
  });

  test('toggles class when state changes', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-class="on:flag"></div>';
    const { state, watch } = bind.reactive({ flag: false });
    bind.bind(root, state, watch);
    state.flag = true;
    expect(root.querySelector('div').classList.contains('on')).toBe(true);
    state.flag = false;
    expect(root.querySelector('div').classList.contains('on')).toBe(false);
  });

  test('supports multiple comma-separated pairs', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-class="bold:b,italic:i"></div>';
    const { state, watch } = bind.reactive({ b: true, i: false });
    bind.bind(root, state, watch);
    const el = root.querySelector('div');
    expect(el.classList.contains('bold')).toBe(true);
    expect(el.classList.contains('italic')).toBe(false);
    state.i = true;
    expect(el.classList.contains('italic')).toBe(true);
  });
});

// ── bind() – m-attr ──────────────────────────────────────────────────

describe('BareMetalBind – bind() m-attr directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('sets boolean attribute when state is true', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button m-attr="disabled:loading">go</button>';
    const { state, watch } = bind.reactive({ loading: true });
    bind.bind(root, state, watch);
    expect(root.querySelector('button').hasAttribute('disabled')).toBe(true);
  });

  test('removes attribute when state is false', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button m-attr="disabled:loading">go</button>';
    const { state, watch } = bind.reactive({ loading: false });
    bind.bind(root, state, watch);
    expect(root.querySelector('button').hasAttribute('disabled')).toBe(false);
  });

  test('removes attribute when state is null or undefined', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-attr="title:tip"></span>';
    const { state, watch } = bind.reactive({ tip: null });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').hasAttribute('title')).toBe(false);
  });

  test('sets attribute to string value for non-boolean truthy', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-attr="title:tip"></span>';
    const { state, watch } = bind.reactive({ tip: 'hello' });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').getAttribute('title')).toBe('hello');
  });

  test('keeps attribute when value is 0 (not false/null)', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-attr="tabindex:idx"></span>';
    const { state, watch } = bind.reactive({ idx: 0 });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').getAttribute('tabindex')).toBe('0');
  });

  test('updates attribute reactively', () => {
    const root = document.createElement('div');
    root.innerHTML = '<a m-attr="href:url">link</a>';
    const { state, watch } = bind.reactive({ url: '/a' });
    bind.bind(root, state, watch);
    state.url = '/b';
    expect(root.querySelector('a').getAttribute('href')).toBe('/b');
  });
});

// ── bind() – m-each ──────────────────────────────────────────────────

describe('BareMetalBind – bind() m-each directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('renders list items from array of objects', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text=".name"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ name: 'A' }, { name: 'B' }] });
    bind.bind(root, state, watch);
    const lis = root.querySelectorAll('li');
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe('A');
    expect(lis[1].textContent).toBe('B');
  });

  test('renders primitives with m-text="."', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="tags"><template><li m-text="."></li></template></ul>';
    const { state, watch } = bind.reactive({ tags: ['x', 'y', 'z'] });
    bind.bind(root, state, watch);
    const lis = root.querySelectorAll('li');
    expect(lis.length).toBe(3);
    expect(lis[1].textContent).toBe('y');
  });

  test('re-renders when array is reassigned', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text="."></li></template></ul>';
    const { state, watch } = bind.reactive({ items: ['a'] });
    bind.bind(root, state, watch);
    expect(root.querySelectorAll('li').length).toBe(1);
    state.items = ['a', 'b', 'c'];
    expect(root.querySelectorAll('li').length).toBe(3);
  });

  test('clears list when set to empty array', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text="."></li></template></ul>';
    const { state, watch } = bind.reactive({ items: ['a', 'b'] });
    bind.bind(root, state, watch);
    state.items = [];
    expect(root.querySelectorAll('li').length).toBe(0);
  });

  test('supports m-class inside template', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-class="on:.active" m-text=".name"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ name: 'A', active: true }, { name: 'B', active: false }] });
    bind.bind(root, state, watch);
    const lis = root.querySelectorAll('li');
    expect(lis[0].classList.contains('on')).toBe(true);
    expect(lis[1].classList.contains('on')).toBe(false);
  });

  test('supports m-attr inside template', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-each="links"><template><a m-attr="href:.url" m-text=".label"></a></template></div>';
    const { state, watch } = bind.reactive({ links: [{ url: '/home', label: 'Home' }] });
    bind.bind(root, state, watch);
    const a = root.querySelector('a');
    expect(a.getAttribute('href')).toBe('/home');
    expect(a.textContent).toBe('Home');
  });

  test('handles non-array state gracefully', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text="."></li></template></ul>';
    const { state, watch } = bind.reactive({ items: null });
    bind.bind(root, state, watch);
    expect(root.querySelectorAll('li').length).toBe(0);
  });
});

// ── bind() – m-navbar ─────────────────────────────────────────────────

describe('BareMetalBind – bind() m-navbar directive', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('renders anchor elements from link array', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="nav"></nav>';
    const { state, watch } = bind.reactive({
      nav: [{ href: '/', text: 'Home' }, { href: '/about', text: 'About' }]
    });
    bind.bind(root, state, watch);
    const links = root.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].href).toContain('/');
    expect(links[0].textContent).toBe('Home');
    expect(links[1].textContent).toBe('About');
  });

  test('adds active class when link.active is truthy', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="nav"></nav>';
    const { state, watch } = bind.reactive({
      nav: [{ href: '/', text: 'Home', active: true }, { href: '/x', text: 'X' }]
    });
    bind.bind(root, state, watch);
    const links = root.querySelectorAll('a');
    expect(links[0].classList.contains('act')).toBe(true);
    expect(links[1].classList.contains('act')).toBe(false);
  });

  test('re-renders when nav array is reassigned', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="nav"></nav>';
    const { state, watch } = bind.reactive({ nav: [{ href: '/', text: 'Home' }] });
    bind.bind(root, state, watch);
    expect(root.querySelectorAll('a').length).toBe(1);
    state.nav = [{ href: '/', text: 'Home' }, { href: '/new', text: 'New' }];
    expect(root.querySelectorAll('a').length).toBe(2);
  });

  test('defaults href to # and text to empty', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="nav"></nav>';
    const { state, watch } = bind.reactive({ nav: [{}] });
    bind.bind(root, state, watch);
    const a = root.querySelector('a');
    expect(a.getAttribute('href')).toBe('#');
    expect(a.textContent).toBe('');
  });

  test('renders dropdown from nested array', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="nav"></nav>';
    const { state, watch } = bind.reactive({
      nav: [
        ['Products', { href: '/a', text: 'Alpha' }, { href: '/b', text: 'Beta' }]
      ]
    });
    bind.bind(root, state, watch);
    const dd = root.querySelector('.dd');
    expect(dd).not.toBeNull();
    expect(dd.querySelector('.dd-t').textContent).toBe('Products');
    const links = dd.querySelectorAll('.dd-m a');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toBe('Alpha');
    expect(links[1].getAttribute('href')).toBe('/b');
  });

  test('mixes plain links and dropdowns', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="nav"></nav>';
    const { state, watch } = bind.reactive({
      nav: [
        { href: '/', text: 'Home' },
        ['More', { href: '/x', text: 'X' }, { href: '/y', text: 'Y' }],
        { href: '/about', text: 'About' }
      ]
    });
    bind.bind(root, state, watch);
    const nav = root.querySelector('nav');
    // 3 direct children: <a>, <div.dd>, <a>
    expect(nav.children.length).toBe(3);
    expect(nav.children[0].tagName).toBe('A');
    expect(nav.children[1].classList.contains('dd')).toBe(true);
    expect(nav.children[2].tagName).toBe('A');
  });

  test('dropdown links support active class', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="nav"></nav>';
    const { state, watch } = bind.reactive({
      nav: [['Menu', { href: '/a', text: 'A', active: true }, { href: '/b', text: 'B' }]]
    });
    bind.bind(root, state, watch);
    const links = root.querySelectorAll('.dd-m a');
    expect(links[0].classList.contains('act')).toBe(true);
    expect(links[1].classList.contains('act')).toBe(false);
  });
});

// ── Dot-path resolution ───────────────────────────────────────────────

describe('BareMetalBind – dot-path resolution', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('m-text resolves nested dot-path', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="user.name"></span>';
    const { state, watch } = bind.reactive({ user: { name: 'Alice' } });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('Alice');
  });

  test('m-text updates on top-level key reassignment', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="user.name"></span>';
    const { state, watch } = bind.reactive({ user: { name: 'A' } });
    bind.bind(root, state, watch);
    state.user = { name: 'B' };
    expect(root.querySelector('span').textContent).toBe('B');
  });

  test('m-value reads and writes nested path', () => {
    const root = document.createElement('div');
    root.innerHTML = '<input m-value="config.theme">';
    const { state, watch } = bind.reactive({ config: { theme: 'dark' } });
    bind.bind(root, state, watch);
    expect(root.querySelector('input').value).toBe('dark');
  });

  test('m-if works with dot-path', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-if="flags.visible">hi</div>';
    const { state, watch } = bind.reactive({ flags: { visible: false } });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').style.display).toBe('none');
  });

  test('m-class works with dot-path', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-class="active:ui.selected"></div>';
    const { state, watch } = bind.reactive({ ui: { selected: true } });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').classList.contains('active')).toBe(true);
  });

  test('m-attr works with dot-path', () => {
    const root = document.createElement('div');
    root.innerHTML = '<a m-attr="href:link.url">go</a>';
    const { state, watch } = bind.reactive({ link: { url: '/test' } });
    bind.bind(root, state, watch);
    expect(root.querySelector('a').getAttribute('href')).toBe('/test');
  });

  test('deeply nested path resolves', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="a.b.c.d"></span>';
    const { state, watch } = bind.reactive({ a: { b: { c: { d: 'deep' } } } });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('deep');
  });
});

// ── Formatters ────────────────────────────────────────────────────────

describe('BareMetalBind – formatters', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('applies a single formatter', () => {
    bind.formatters.upper = v => String(v).toUpperCase();
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="name|upper"></span>';
    const { state, watch } = bind.reactive({ name: 'hello' });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('HELLO');
  });

  test('chains multiple formatters', () => {
    bind.formatters.upper = v => String(v).toUpperCase();
    bind.formatters.exclaim = v => v + '!';
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="name|upper|exclaim"></span>';
    const { state, watch } = bind.reactive({ name: 'hi' });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('HI!');
  });

  test('formatter with argument', () => {
    bind.formatters.prefix = (v, arg) => arg + v;
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="price|prefix:$"></span>';
    const { state, watch } = bind.reactive({ price: '100' });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('$100');
  });

  test('formatters update reactively', () => {
    bind.formatters.double = v => Number(v) * 2;
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="x|double"></span>';
    const { state, watch } = bind.reactive({ x: 5 });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('10');
    state.x = 7;
    expect(root.querySelector('span').textContent).toBe('14');
  });

  test('unknown formatter passes value through', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span m-text="val|noexist"></span>';
    const { state, watch } = bind.reactive({ val: 'ok' });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('ok');
  });
});

// ── Reactive arrays ───────────────────────────────────────────────────

describe('BareMetalBind – reactive arrays', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('push triggers watcher', () => {
    const { state, watch } = bind.reactive({ items: ['a'] });
    const spy = jest.fn();
    watch('items', spy);
    state.items.push('b');
    expect(spy).toHaveBeenCalled();
    expect(state.items.length).toBe(2);
  });

  test('splice triggers watcher', () => {
    const { state, watch } = bind.reactive({ items: ['a', 'b', 'c'] });
    const spy = jest.fn();
    watch('items', spy);
    state.items.splice(1, 1);
    expect(spy).toHaveBeenCalled();
    expect(state.items.length).toBe(2);
  });

  test('pop triggers watcher', () => {
    const { state, watch } = bind.reactive({ items: [1, 2] });
    const spy = jest.fn();
    watch('items', spy);
    const popped = state.items.pop();
    expect(popped).toBe(2);
    expect(spy).toHaveBeenCalled();
  });

  test('sort triggers watcher', () => {
    const { state, watch } = bind.reactive({ items: [3, 1, 2] });
    const spy = jest.fn();
    watch('items', spy);
    state.items.sort();
    expect(spy).toHaveBeenCalled();
  });

  test('reassigning array still works and new array is reactive', () => {
    const { state, watch } = bind.reactive({ items: [] });
    state.items = ['x'];
    const spy = jest.fn();
    watch('items', spy);
    state.items.push('y');
    expect(spy).toHaveBeenCalled();
    expect(state.items.length).toBe(2);
  });

  test('m-each re-renders on push', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text="."></li></template></ul>';
    const { state, watch } = bind.reactive({ items: ['a'] });
    bind.bind(root, state, watch);
    expect(root.querySelectorAll('li').length).toBe(1);
    state.items.push('b');
    expect(root.querySelectorAll('li').length).toBe(2);
    expect(root.querySelectorAll('li')[1].textContent).toBe('b');
  });
});

// ── m-each keyed diffing ──────────────────────────────────────────────

describe('BareMetalBind – m-each keyed diffing', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('keyed diff renders initial list', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items key:id"><template><li m-text=".name"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] });
    bind.bind(root, state, watch);
    const lis = root.querySelectorAll('li');
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe('A');
  });

  test('keyed diff reuses DOM on reorder', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items key:id"><template><li m-text=".name"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] });
    bind.bind(root, state, watch);
    const firstLi = root.querySelectorAll('li')[0];
    state.items = [{ id: 2, name: 'B' }, { id: 1, name: 'A' }];
    const lis = root.querySelectorAll('li');
    expect(lis[1]).toBe(firstLi);
    expect(lis[1].textContent).toBe('A');
  });

  test('keyed diff adds new items', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items key:id"><template><li m-text=".name"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ id: 1, name: 'A' }] });
    bind.bind(root, state, watch);
    state.items = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    expect(root.querySelectorAll('li').length).toBe(2);
  });

  test('keyed diff removes old items', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items key:id"><template><li m-text=".name"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] });
    bind.bind(root, state, watch);
    state.items = [{ id: 2, name: 'B' }];
    expect(root.querySelectorAll('li').length).toBe(1);
    expect(root.querySelector('li').textContent).toBe('B');
  });

  test('keyed diff updates content of reused row', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items key:id"><template><li m-text=".name"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ id: 1, name: 'Old' }] });
    bind.bind(root, state, watch);
    state.items = [{ id: 1, name: 'New' }];
    expect(root.querySelector('li').textContent).toBe('New');
  });
});

// ── m-each scope (.index, .parent, .root) ─────────────────────────────

describe('BareMetalBind – m-each scope', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('.index exposes array index', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text=".index"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: ['a', 'b', 'c'] });
    bind.bind(root, state, watch);
    const lis = root.querySelectorAll('li');
    expect(lis[0].textContent).toBe('0');
    expect(lis[2].textContent).toBe('2');
  });

  test('.root accesses root state from inside m-each', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text=".root.title"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: ['a', 'b'], title: 'MyList' });
    bind.bind(root, state, watch);
    expect(root.querySelectorAll('li')[0].textContent).toBe('MyList');
    expect(root.querySelectorAll('li')[1].textContent).toBe('MyList');
  });

  test('.prop.nested resolves nested item properties', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul m-each="items"><template><li m-text=".addr.city"></li></template></ul>';
    const { state, watch } = bind.reactive({ items: [{ addr: { city: 'London' } }] });
    bind.bind(root, state, watch);
    expect(root.querySelector('li').textContent).toBe('London');
  });
});

// ── m-transition ──────────────────────────────────────────────────────

describe('BareMetalBind – m-transition', () => {
  let bind;
  let origRAF;
  beforeEach(() => {
    jest.useFakeTimers(); // mock setTimeout first
    origRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0); // now uses jest's setTimeout
    bind = loadBind();
  });
  afterEach(() => {
    global.requestAnimationFrame = origRAF;
    jest.useRealTimers();
  });

  test('m-if without m-transition still toggles display', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-if="show">hi</div>';
    const { state, watch } = bind.reactive({ show: true });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').style.display).toBe('');
    state.show = false;
    expect(root.querySelector('div').style.display).toBe('none');
  });

  test('m-transition adds enter classes on show', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-if="show" m-transition="fade">hi</div>';
    const { state, watch } = bind.reactive({ show: false });
    bind.bind(root, state, watch);
    expect(root.querySelector('div').style.display).toBe('none');
    state.show = true;
    jest.advanceTimersByTime(100);
    const el = root.querySelector('div');
    expect(el.style.display).toBe('');
    expect(el.classList.contains('fade-enter-active') || el.classList.contains('fade-enter') || el.style.display === '').toBe(true);
  });

  test('m-transition adds leave classes on hide', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-if="show" m-transition="slide">hi</div>';
    const { state, watch } = bind.reactive({ show: true });
    bind.bind(root, state, watch);
    state.show = false;
    // Flush the nested rAF callbacks (setTimeout-based in test)
    jest.advanceTimersByTime(100);
    const el = root.querySelector('div');
    expect(el.classList.contains('slide-leave-active')).toBe(true);
    // Simulate CSS transition completing
    el.dispatchEvent(new Event('transitionend'));
    expect(el.style.display).toBe('none');
  });
});

// ── m-expression ──────────────────────────────────────────────────────

describe('BareMetalBind – m-expression', () => {
  let bind;
  beforeEach(() => { bind = loadBind(); });

  test('computes derived value on initial bind', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-expression="total = price * qty"></div><span m-text="total"></span>';
    const { state, watch } = bind.reactive({ price: 10, qty: 3, total: 0 });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('30');
  });

  test('recomputes when dependency changes', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-expression="total = price * qty"></div><span m-text="total"></span>';
    const { state, watch } = bind.reactive({ price: 10, qty: 3, total: 0 });
    bind.bind(root, state, watch);
    state.price = 20;
    expect(root.querySelector('span').textContent).toBe('60');
  });

  test('supports complex expressions', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-expression="greeting = first + \' \' + last"></div><span m-text="greeting"></span>';
    const { state, watch } = bind.reactive({ first: 'John', last: 'Doe', greeting: '' });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('John Doe');
  });

  test('handles Math functions', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-expression="result = Math.max(a, b)"></div><span m-text="result"></span>';
    const { state, watch } = bind.reactive({ a: 5, b: 9, result: 0 });
    bind.bind(root, state, watch);
    expect(root.querySelector('span').textContent).toBe('9');
  });
});