/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs   = require('fs');

const JS_DIR = path.resolve(
  __dirname, '../src'
);

// ── Module loader helpers ──────────────────────────────────────────────────
// BareMetalRendering depends on BareMetalRest, BareMetalBind, and
// BareMetalTemplate.  We load all four into the same Function scope so
// the references resolve correctly, injecting a lazy-fetch delegate so
// individual tests can mock global.fetch.

function loadAll() {
  const restCode     = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Communications.js'), 'utf8');
  const bindCode     = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Bind.js'), 'utf8');
  const templateCode = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Template.js'), 'utf8');
  const renderCode   = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Rendering.js'), 'utf8');

  const fn = new Function(
    'fetch', 'document', 'window', 'FormData', 'URLSearchParams', 'Promise', 'requestAnimationFrame',
    restCode + '\n' + bindCode + '\n' + templateCode + '\n' + renderCode +
    '\nreturn { BareMetalRest: BareMetal.Communications, BareMetalBind: BareMetal.Bind, BareMetalTemplate: BareMetal.Template, BareMetalRendering: BareMetal.Rendering };'
  );

  const win = { minibind: null };
  const raf = typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame : (cb) => setTimeout(cb, 0);
  return fn(
    (...args) => global.fetch(...args),
    global.document,
    win,
    global.FormData,
    global.URLSearchParams,
    global.Promise,
    raf
  );
}

// ── listEntities ───────────────────────────────────────────────────────────

describe('BareMetalRendering – listEntities()', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve([{ slug: 'customers', label: 'Customers' }]),
    });
  });
  afterEach(() => { delete global.fetch; });

  test('fetches entity list from /api/_meta', async () => {
    const { BareMetalRendering } = loadAll();
    const list = await BareMetalRendering.listEntities();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_meta'),
      expect.any(Object)
    );
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].slug).toBe('customers');
  });

  test('caches the result (fetch called only once for repeated calls)', async () => {
    const { BareMetalRendering } = loadAll();
    await BareMetalRendering.listEntities();
    await BareMetalRendering.listEntities();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

// ── createEntity – metadata fetch ─────────────────────────────────────────

describe('BareMetalRendering – createEntity() metadata fetch', () => {
  const META = {
    schema:      { fields: { name: { type: 'text', label: 'Name' } } },
    initialData: { name: '' },
    layout:      { fields: ['name'] }
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(META),
    });
  });
  afterEach(() => { delete global.fetch; });

  test('returns state, save, load, renderUI, meta, api, resolve', async () => {
    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('customers');
    expect(entity).toHaveProperty('state');
    expect(entity).toHaveProperty('save');
    expect(entity).toHaveProperty('load');
    expect(entity).toHaveProperty('renderUI');
    expect(entity).toHaveProperty('meta');
    expect(entity).toHaveProperty('api');
    expect(entity).toHaveProperty('resolve');
  });

  test('meta property contains the fetched metadata', async () => {
    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('customers');
    expect(entity.meta).toEqual(META);
  });

  test('state is pre-populated from initialData', async () => {
    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('customers');
    expect(entity.state.name).toBe('');
  });
});

// ── createEntity – save ────────────────────────────────────────────────────

describe('BareMetalRendering – createEntity() save()', () => {
  const META = {
    schema:      { fields: { name: { type: 'text' } } },
    initialData: { name: 'Alice' },
    layout:      { fields: ['name'] }
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => { delete global.fetch; });

  test('save() calls POST when no id is present', async () => {
    global.fetch
      // First call: metadata()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(META),
      })
      // Second call: create()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ id: '99', name: 'Alice' }),
      });

    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('customers');

    // save() requires the form element to detect file inputs
    const dummyForm = document.createElement('form');
    await entity.save(dummyForm);

    const postCall = global.fetch.mock.calls.find(c => c[1].method === 'POST');
    expect(postCall).toBeDefined();
  });

  test('save() calls PUT when id exists in state', async () => {
    const metaWithId = {
      ...META,
      initialData: { id: '7', name: 'Alice' }
    };
    global.fetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(metaWithId),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ id: '7', name: 'Alice Updated' }),
      });

    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('customers');

    const dummyForm = document.createElement('form');
    await entity.save(dummyForm);

    const putCall = global.fetch.mock.calls.find(c => c[1].method === 'PUT');
    expect(putCall).toBeDefined();
    expect(putCall[0]).toContain('/7');
  });
});

// ── createEntity – renderUI ────────────────────────────────────────────────

describe('BareMetalRendering – createEntity() renderUI()', () => {
  const META = {
    schema:      { fields: { title: { type: 'text', label: 'Title' } } },
    initialData: { title: 'Hello' },
    layout:      { fields: ['title'] }
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(META),
    });
  });
  afterEach(() => { delete global.fetch; });

  test('renderUI appends a form to the target element', async () => {
    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('posts');

    const container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    entity.renderUI('app');
    expect(container.querySelector('form')).not.toBeNull();

    document.body.removeChild(container);
  });

  test('renderUI accepts an element reference directly', async () => {
    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('posts');

    const container = document.createElement('div');
    document.body.appendChild(container);

    entity.renderUI(container);
    expect(container.querySelector('form')).not.toBeNull();

    document.body.removeChild(container);
  });

  test('renderUI clears existing content before rendering', async () => {
    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('posts');

    const container = document.createElement('div');
    container.innerHTML = '<p>old content</p>';
    document.body.appendChild(container);

    entity.renderUI(container);
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('form')).not.toBeNull();

    document.body.removeChild(container);
  });
});

// ── createEntity – resolve helper ─────────────────────────────────────────

describe('BareMetalRendering – createEntity() resolve()', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => { delete global.fetch; });

  test('resolve returns lookup label for a field with options', async () => {
    const META = {
      schema: {
        fields: {
          status: {
            type: 'select',
            lookupUrl: '/api/statuses',
            lookupValueField: 'id',
            lookupDisplayField: 'name',
            options: []
          }
        }
      },
      initialData: {},
      layout: { fields: ['status'] }
    };

    global.fetch
      // metadata()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(META),
      })
      // lookup fetch for status options
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve([
          { id: 'active',   name: 'Active'   },
          { id: 'inactive', name: 'Inactive' }
        ]),
      });

    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('items');

    expect(entity.resolve('status', 'active')).toBe('Active');
    expect(entity.resolve('status', 'inactive')).toBe('Inactive');
  });

  test('resolve falls back to String(value) for fields without options', async () => {
    const META = {
      schema: { fields: { name: { type: 'text' } } },
      initialData: {},
      layout: { fields: ['name'] }
    };
    global.fetch.mockResolvedValue({
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(META),
    });

    const { BareMetalRendering } = loadAll();
    const entity = await BareMetalRendering.createEntity('items');
    expect(entity.resolve('name', 'Alice')).toBe('Alice');
    expect(entity.resolve('name', null)).toBe('');
  });
});

// ── minibind surface ────────────────────────────────────────────────────────

describe('BareMetalRendering – window.minibind surface', () => {
  test('minibind.setRoot and minibind.createNewEntity are exposed', () => {
    // Load the modules; window.minibind is populated as a side-effect
    delete global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ schema: { fields: {} }, initialData: {}, layout: {} }),
    });

    const win = { minibind: null };
    const restCode     = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Communications.js'), 'utf8');
    const bindCode     = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Bind.js'), 'utf8');
    const templateCode = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Template.js'), 'utf8');
    const renderCode   = fs.readFileSync(path.join(JS_DIR, 'BareMetal.Rendering.js'), 'utf8');

    const fn = new Function(
      'fetch', 'document', 'window', 'FormData', 'URLSearchParams', 'Promise', 'requestAnimationFrame',
      restCode + '\n' + bindCode + '\n' + templateCode + '\n' + renderCode
    );
    const raf = typeof globalThis.requestAnimationFrame === 'function'
      ? globalThis.requestAnimationFrame : (cb) => setTimeout(cb, 0);
    fn(
      (...args) => global.fetch(...args),
      global.document,
      win,
      global.FormData,
      global.URLSearchParams,
      global.Promise,
      raf
    );

    expect(typeof win.minibind.setRoot).toBe('function');
    expect(typeof win.minibind.createNewEntity).toBe('function');
    expect(typeof win.minibind.listEntities).toBe('function');
    expect(typeof win.minibind.bind).toBe('function');

    delete global.fetch;
  });
});
