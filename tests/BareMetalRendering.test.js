/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Rendering.js');

function loadRendering() {
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

describe('BareMetal.Rendering', () => {
  let Rendering;

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '';
    Rendering = loadRendering();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete window.minibind;
    jest.restoreAllMocks();
  });

  test('module loads without throwing in jsdom', () => {
    expect(Rendering).toBeTruthy();
  });

  test('exports createEntity and listEntities', () => {
    expect(typeof Rendering.createEntity).toBe('function');
    expect(typeof Rendering.listEntities).toBe('function');
  });

  test('exposes a minibind surface on window', () => {
    expect(window.minibind).toBeTruthy();
    expect(typeof window.minibind.setRoot).toBe('function');
    expect(typeof window.minibind.createNewEntity).toBe('function');
    expect(typeof window.minibind.listEntities).toBe('function');
    expect(typeof window.minibind.bind).toBe('function');
  });

  test('minibind.bind fallback is callable without dependencies', () => {
    expect(() => window.minibind.bind()).not.toThrow();
  });

  test('listEntities rejects with a descriptive dependency error', async () => {
    await expect(Rendering.listEntities()).rejects.toThrow('Rendering: missing BareMetal.Communications, BareMetal.Bind, or BareMetal.Template');
  });

  test('createEntity rejects with a descriptive dependency error', async () => {
    await expect(Rendering.createEntity('customer')).rejects.toThrow('Rendering: missing BareMetal.Communications, BareMetal.Bind, or BareMetal.Template');
  });

  test('minibind.listEntities delegates to the module function', async () => {
    await expect(window.minibind.listEntities()).rejects.toThrow('Rendering: missing BareMetal.Communications, BareMetal.Bind, or BareMetal.Template');
  });

  test('minibind.createNewEntity delegates to createEntity', async () => {
    await expect(window.minibind.createNewEntity('invoice')).rejects.toThrow('Rendering: missing BareMetal.Communications, BareMetal.Bind, or BareMetal.Template');
  });

  test('minibind.setRoot throws when Communications is unavailable', () => {
    expect(() => window.minibind.setRoot('/api/')).toThrow('Rendering: missing BareMetal.Communications');
  });

  test('reloading the module recreates the minibind surface', () => {
    const first = window.minibind;
    jest.resetModules();
    const reloaded = loadRendering();
    expect(reloaded).toBeTruthy();
    expect(window.minibind).not.toBe(first);
  });

  test('createEntity remains a Promise-returning API even when it rejects', () => {
    const result = Rendering.createEntity('project');
    expect(typeof result.then).toBe('function');
    return expect(result).rejects.toThrow('Rendering: missing BareMetal.Communications, BareMetal.Bind, or BareMetal.Template');
  });

  test('listEntities remains a Promise-returning API even when it rejects', () => {
    const result = Rendering.listEntities();
    expect(typeof result.then).toBe('function');
    return expect(result).rejects.toThrow('Rendering: missing BareMetal.Communications, BareMetal.Bind, or BareMetal.Template');
  });
});
