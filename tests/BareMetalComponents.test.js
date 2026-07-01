/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Components.js');

function loadComponents() {
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

describe('BareMetal.Components', () => {
  let Components;

  beforeEach(() => {
    jest.resetModules();
    Components = loadComponents();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('module loads and exports bindComponents', () => {
    expect(typeof Components.bindComponents).toBe('function');
  });

  test('bindComponents safely ignores a null root', () => {
    expect(() => Components.bindComponents(null, {}, jest.fn())).not.toThrow();
  });

  test('bindComponents safely ignores a root without querySelectorAll', () => {
    expect(() => Components.bindComponents({}, {}, jest.fn())).not.toThrow();
  });

  test('bindComponents does nothing on an empty element', () => {
    const root = document.createElement('div');
    expect(() => Components.bindComponents(root, {}, jest.fn())).not.toThrow();
    expect(root.innerHTML).toBe('');
  });

  test('bindComponents leaves ordinary content unchanged', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Hello</p><span>World</span>';
    Components.bindComponents(root, {}, jest.fn());
    expect(root.innerHTML).toContain('<p>Hello</p>');
    expect(root.querySelectorAll('*')).toHaveLength(2);
  });

  test('bindComponents does not call watch without Bind helpers', () => {
    const watch = jest.fn();
    const root = document.createElement('div');
    root.innerHTML = '<div m-chatbot="messages"></div>';
    Components.bindComponents(root, { messages: [] }, watch);
    expect(watch).not.toHaveBeenCalled();
  });

  test('bindComponents safely skips m-img descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<img m-img="photo" m-img-fallback="fallback.png">';
    expect(() => Components.bindComponents(root, { photo: 'a.png' }, jest.fn())).not.toThrow();
    expect(root.querySelector('img').getAttribute('src')).toBeNull();
  });

  test('bindComponents safely skips m-navbar descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<nav m-navbar="items"></nav>';
    expect(() => Components.bindComponents(root, { items: [] }, jest.fn())).not.toThrow();
    expect(root.querySelector('nav').innerHTML).toBe('');
  });

  test('bindComponents safely skips m-chatbot descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<section m-chatbot="messages"></section>';
    expect(() => Components.bindComponents(root, { messages: [] }, jest.fn())).not.toThrow();
    expect(root.querySelector('section').innerHTML).toBe('');
  });

  test('bindComponents safely skips m-calendar descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-calendar="events"></div>';
    expect(() => Components.bindComponents(root, { events: [] }, jest.fn())).not.toThrow();
  });

  test('bindComponents safely skips m-gantt descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-gantt="tasks"></div>';
    expect(() => Components.bindComponents(root, { tasks: [] }, jest.fn())).not.toThrow();
  });

  test('bindComponents safely skips m-table descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<table m-table="rows"></table>';
    expect(() => Components.bindComponents(root, { rows: [] }, jest.fn())).not.toThrow();
  });

  test('bindComponents safely skips m-tree descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-tree="nodes"></div>';
    expect(() => Components.bindComponents(root, { nodes: [] }, jest.fn())).not.toThrow();
  });

  test('bindComponents safely skips m-toast descendants', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-toast="toasts"></div>';
    expect(() => Components.bindComponents(root, { toasts: [] }, jest.fn())).not.toThrow();
  });

  test('bindComponents safely skips m-entity descendants when Metadata is absent', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-entity="customer"></div>';
    expect(() => Components.bindComponents(root, {}, jest.fn())).not.toThrow();
    expect(root.querySelector('[m-entity]').innerHTML).toBe('');
  });

  test('bindComponents can be called repeatedly without mutating the DOM', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div m-navbar="items"></div><div m-entity="thing"></div>';
    Components.bindComponents(root, { items: [] }, jest.fn());
    const first = root.innerHTML;
    Components.bindComponents(root, { items: [] }, jest.fn());
    expect(root.innerHTML).toBe(first);
  });

  test('bindComponents is safe for document fragments', () => {
    const frag = document.createDocumentFragment();
    const el = document.createElement('div');
    el.innerHTML = '<div m-table="rows"></div>';
    frag.appendChild(el);
    expect(() => Components.bindComponents(frag, { rows: [] }, jest.fn())).not.toThrow();
  });
});
