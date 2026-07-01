/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(
  __dirname, '../src/BareMetal.Communications.js'
);

// Helper: load the module so its `fetch` references global.fetch at call time.
function loadRest() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

// Minimal WebSocket mock for testing
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.binaryType = '';
    this.readyState = 0;
    this.onopen = null;
    this.onerror = null;
    this.onclose = null;
    this.onmessage = null;
    this._sent = [];
    Promise.resolve().then(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen({});
    });
  }
  send(data) { this._sent.push(data); }
  close() { this.readyState = 3; if (this.onclose) this.onclose({}); }
}

// ── Shared fetch response builders ────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function noContentResponse() {
  return { ok: true, status: 204, headers: { get: () => '' } };
}

function errorResponse(statusText, bodyText, status = 500) {
  return {
    ok: false, status, statusText,
    headers: { get: () => 'text/plain' },
    text: () => Promise.resolve(bodyText),
  };
}

// ── setRoot / getRoot ──────────────────────────────────────────────────────

describe('BareMetalRest – root URL management', () => {
  let rest;
  beforeEach(() => { rest = loadRest(); });

  test('default root is /api/', () => {
    expect(rest.getRoot()).toBe('/api/');
  });

  test('setRoot appends trailing slash when missing', () => {
    rest.setRoot('/v2/api');
    expect(rest.getRoot()).toBe('/v2/api/');
  });

  test('setRoot keeps trailing slash when already present', () => {
    rest.setRoot('/v3/api/');
    expect(rest.getRoot()).toBe('/v3/api/');
  });

  test('entity() is accessible after setRoot', () => {
    rest.setRoot('/custom/');
    expect(typeof rest.entity('items').list).toBe('function');
  });
});

// ── entity() – URL construction ────────────────────────────────────────────

describe('BareMetalRest – entity() helper', () => {
  let rest;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse([]));
    rest = loadRest();
    rest.setRoot('/api/');
  });

  afterEach(() => { delete global.fetch; });

  test('entity().list() calls GET /api/{slug}', async () => {
    await rest.entity('orders').list();
    expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({ method: 'GET' }));
  });

  test('entity().list(params) appends query string', async () => {
    await rest.entity('orders').list({ status: 'open' });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('status=open');
  });

  test('entity().get(id) calls GET /api/{slug}/{id}', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: '7' }));
    await rest.entity('products').get('7');
    expect(global.fetch).toHaveBeenCalledWith('/api/products/7', expect.objectContaining({ method: 'GET' }));
  });

  test('entity().create(data) calls POST with JSON body', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: '1' }));
    await rest.entity('customers').create({ name: 'Alice' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/customers');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ name: 'Alice' }));
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  test('entity().update(id, data) calls PUT /api/{slug}/{id}', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: '3' }));
    await rest.entity('customers').update('3', { name: 'Bob' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/customers/3');
    expect(opts.method).toBe('PUT');
  });

  test('entity().remove(id) calls DELETE /api/{slug}/{id}', async () => {
    global.fetch.mockResolvedValue(noContentResponse());
    await rest.entity('customers').remove('5');
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/customers/5');
    expect(opts.method).toBe('DELETE');
  });

  test('entity().metadata() calls GET /api/metadata/{slug}', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}));
    await rest.entity('products').metadata();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/metadata/products');
  });
});

// ── call() – HTTP semantics ────────────────────────────────────────────────

describe('BareMetalRest – call() HTTP semantics', () => {
  let rest;

  beforeEach(() => {
    global.fetch = jest.fn();
    rest = loadRest();
  });

  afterEach(() => { delete global.fetch; });

  test('throws when response is not ok', async () => {
    global.fetch.mockResolvedValue(errorResponse('Internal Server Error', 'Server blew up'));
    await expect(rest.call('GET', '/api/bad')).rejects.toThrow('Server blew up');
  });

  test('returns null for 204 No Content', async () => {
    global.fetch.mockResolvedValue(noContentResponse());
    const result = await rest.call('DELETE', '/api/items/1');
    expect(result).toBeNull();
  });

  test('returns null when content-type is not application/json', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'text/html' } });
    const result = await rest.call('GET', '/api/items');
    expect(result).toBeNull();
  });

  test('sets X-Requested-With header on POST', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}));
    await rest.call('POST', '/api/items', { name: 'test' });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers['X-Requested-With']).toBe('BareMetalWeb');
  });

  test('does NOT set X-Requested-With on GET', async () => {
    global.fetch.mockResolvedValue(jsonResponse([]));
    await rest.call('GET', '/api/items');
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers['X-Requested-With']).toBeUndefined();
  });

  test('reads CSRF token from meta tag', async () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'test-csrf-123');
    document.head.appendChild(meta);

    global.fetch.mockResolvedValue(jsonResponse({}));
    await rest.call('POST', '/api/items', {});
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers['X-CSRF-Token']).toBe('test-csrf-123');

    document.head.removeChild(meta);
  });

  test('sends FormData body without Content-Type header', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}));
    const fd = new FormData();
    fd.append('name', 'test');
    await rest.call('POST', '/api/upload', fd);
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.body).toBeInstanceOf(FormData);
    // Browser must set Content-Type with boundary — must NOT be set manually
    expect(opts.headers['Content-Type']).toBeUndefined();
  });
});

// ── init() – route table loading ──────────────────────────────────────────

describe('BareMetalRest – init() route table', () => {
  let rest;

  beforeEach(() => {
    global.fetch = jest.fn();
    rest = loadRest();
  });

  afterEach(() => { delete global.fetch; });

  test('init() fetches /bmw/routes and builds route map', async () => {
    global.fetch.mockResolvedValue(jsonResponse([
      { id: 1, verb: 'GET', path: '/api/users', params: 0 },
      { id: 2, verb: 'POST', path: '/api/users', params: 0 },
      { id: 3, verb: 'GET', path: '/api/users/{id}', params: 1 },
    ]));
    await rest.init();
    expect(global.fetch).toHaveBeenCalledWith('/bmw/routes');
    expect(rest.resolveRouteId('GET', '/api/users')).toBe(1);
    expect(rest.resolveRouteId('POST', '/api/users')).toBe(2);
  });

  test('init() is idempotent — only fetches once', async () => {
    global.fetch.mockResolvedValue(jsonResponse([
      { id: 1, verb: 'GET', path: '/api/users', params: 0 },
    ]));
    await rest.init();
    await rest.init();
    // Only one fetch call for /bmw/routes (not counting other fetches)
    const routeCalls = global.fetch.mock.calls.filter(c => c[0] === '/bmw/routes');
    expect(routeCalls).toHaveLength(1);
  });

  test('init() gracefully handles fetch error', async () => {
    global.fetch.mockRejectedValue(new Error('network'));
    await rest.init(); // should not throw
    expect(rest.resolveRouteId('GET', '/api/users')).toBeNull();
  });

  test('init() gracefully handles non-ok response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404 });
    await rest.init(); // should not throw
    expect(rest.resolveRouteId('GET', '/api/users')).toBeNull();
  });
});

// ── Numeric dispatch – transparent URL rewriting ──────────────────────────

describe('BareMetalRest – numeric route dispatch', () => {
  let rest;

  beforeEach(async () => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/bmw/routes') {
        return Promise.resolve(jsonResponse([
          { id: 10, verb: 'GET', path: '/api/orders', params: 0 },
          { id: 11, verb: 'POST', path: '/api/orders', params: 0 },
          { id: 12, verb: 'GET', path: '/api/orders/{id}', params: 1 },
          { id: 13, verb: 'PUT', path: '/api/orders/{id}', params: 1 },
          { id: 14, verb: 'DELETE', path: '/api/orders/{id}', params: 1 },
        ]));
      }
      return Promise.resolve(jsonResponse([]));
    });
    rest = loadRest();
    rest.setRoot('/api/');
    await rest.init();
    // Reset fetch mock after init so we only see entity calls
    global.fetch.mockClear();
    global.fetch.mockResolvedValue(jsonResponse([]));
  });

  afterEach(() => { delete global.fetch; });

  test('entity().list() uses numeric URL /10?type=orders', async () => {
    await rest.entity('orders').list();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toBe('/10?type=orders');
  });

  test('entity().list(params) appends query params with &', async () => {
    await rest.entity('orders').list({ status: 'open' });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/10?type=orders&');
    expect(url).toContain('status=open');
  });

  test('entity().get(id) uses numeric URL /12?type=orders&id=42', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: '42' }));
    await rest.entity('orders').get('42');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toBe('/12?type=orders&id=42');
  });

  test('entity().create(data) uses numeric URL /11?type=orders', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: '1' }));
    await rest.entity('orders').create({ item: 'widget' });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toBe('/11?type=orders');
  });

  test('entity().update(id, data) uses numeric URL /13?type=orders&id=7', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: '7' }));
    await rest.entity('orders').update('7', { qty: 5 });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toBe('/13?type=orders&id=7');
  });

  test('entity().remove(id) uses numeric URL /14?type=orders&id=9', async () => {
    global.fetch.mockResolvedValue(noContentResponse());
    await rest.entity('orders').remove('9');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toBe('/14?type=orders&id=9');
  });

  test('falls back to string URL when slug not in route table', async () => {
    await rest.entity('unknown').list();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toBe('/api/unknown');
  });

  test('byId() dispatches directly by route ID', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ ok: true }));
    await rest.byId(42);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toBe('/42');
  });

  test('byId() with method option', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}));
    await rest.byId(5, { method: 'POST', body: { x: 1 } });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/5');
    expect(opts.method).toBe('POST');
  });
});

// ── WebSocket transport ────────────────────────────────────────────────────

describe('BareMetalRest – WebSocket transport', () => {
  let rest;
  beforeEach(() => {
    global.fetch = jest.fn();
    global.WebSocket = MockWebSocket;
    rest = loadRest();
  });
  afterEach(() => { delete global.WebSocket; });

  test('connectWs() establishes WebSocket connection', async () => {
    await rest.connectWs('ws://test/bmw/ws');
    expect(rest.isWsReady()).toBe(true);
  });

  test('isWsReady() returns false before connect', () => {
    expect(rest.isWsReady()).toBe(false);
  });

  test('init() fetches route table, protocol, and connects WS', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ verb: 'GET', path: '/api/items', id: 1 }]))
      .mockResolvedValueOnce(jsonResponse({
        protocol: 'BMW1.0',
        routes: [{ name: 'listItems', opcode: 1 }]
      }));
    await rest.init();
    expect(global.fetch).toHaveBeenCalledWith('/bmw/routes');
    expect(global.fetch).toHaveBeenCalledWith('/bmw/protocol');
    expect(rest.isWsReady()).toBe(true);
  });

  test('entity().list() falls back to fetch when WS not connected', async () => {
    global.fetch.mockResolvedValue(jsonResponse([{ id: 1 }]));
    const result = await rest.entity('items').list();
    expect(result).toEqual([{ id: 1 }]);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('new exports: connectWs, isWsReady are present', () => {
    expect(typeof rest.connectWs).toBe('function');
    expect(typeof rest.isWsReady).toBe('function');
  });
});

describe('BareMetalRest additional coverage', () => {
  function binaryResponse(buffer, extraHeaders = {}) {
    return {
      ok: true,
      status: 200,
      headers: {
        get: (name) => extraHeaders[name.toLowerCase()] || extraHeaders[name] || ''
      },
      arrayBuffer: () => Promise.resolve(buffer),
      text: () => Promise.resolve('')
    };
  }

  afterEach(() => {
    delete global.fetch;
    delete global.WebSocket;
    delete global.BareMetal;
    delete global.__lastWs;
  });

  test('compression settings compress requests and decompress responses', async () => {
    const injectedBareMetal = {
      Compress: {
        compress: jest.fn(() => new Uint8Array([9, 8, 7])),
        decompress: jest.fn(() => new TextEncoder().encode('{"ok":true}'))
      }
    };
    global.fetch = jest.fn().mockResolvedValue(binaryResponse(new Uint8Array([1, 2]).buffer, {
      'content-type': 'application/json',
      'content-encoding': 'BareMetal.Compress'
    }));
    const code = require('fs').readFileSync(SRC, 'utf8');
    const rest = new Function('BareMetal', code + '\nreturn BareMetal.Communications;')(injectedBareMetal);
    rest.setCompression({ enabled: true, minSize: 1, profile: 'small' });

    const result = await rest.call('POST', '/api/compressed', { payload: 'x'.repeat(20) });

    expect(rest.getCompression()).toMatchObject({ enabled: true, minSize: 1, profile: 'small' });
    expect(injectedBareMetal.Compress.compress).toHaveBeenCalled();
    expect(global.fetch.mock.calls[0][1].headers['Content-Encoding']).toBe('BareMetal.Compress');
    expect(global.fetch.mock.calls[0][1].headers['Accept-Encoding']).toBe('BareMetal.Compress');
    expect(injectedBareMetal.Compress.decompress).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  test('binary entity paths, delta helpers, and ensureBinary use BareMetal.Binary when available', async () => {
    const injectedBareMetal = {
      Binary: {
        setSigningKey: jest.fn().mockResolvedValue(),
        fetchSchema: jest.fn().mockResolvedValue({ name: 'orders' }),
        deserializeList: jest.fn().mockResolvedValue([{ id: 1 }]),
        deserialize: jest.fn().mockResolvedValue({ id: 2 }),
        serialize: jest.fn().mockResolvedValue(new Uint8Array([5, 6, 7])),
        applyDeltaJson: jest.fn().mockResolvedValue({ version: 2 }),
        fetchLayout: jest.fn().mockResolvedValue({}),
        buildDelta: jest.fn()
          .mockReturnValueOnce(null)
          .mockReturnValueOnce(new Uint8Array([7, 7])),
        applyDelta: jest.fn().mockResolvedValue({ saved: true })
      }
    };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(' signing-key ') })
      .mockResolvedValueOnce(binaryResponse(new Uint8Array([1]).buffer))
      .mockResolvedValueOnce(binaryResponse(new Uint8Array([2]).buffer))
      .mockResolvedValueOnce(binaryResponse(new Uint8Array([3]).buffer))
      .mockResolvedValueOnce(binaryResponse(new Uint8Array([4]).buffer))
      .mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => '' } });

    const code = require('fs').readFileSync(SRC, 'utf8');
    const rest = new Function('BareMetal', code + '\nreturn BareMetal.Communications;')(injectedBareMetal);
    rest.setRoot('/api/');

    await rest.ensureBinary();
    expect(injectedBareMetal.Binary.setSigningKey).toHaveBeenCalledWith('signing-key');
    expect(rest.isBinaryAvailable()).toBe(true);

    await expect(rest.entity('orders').list({ state: 'open' })).resolves.toEqual({ data: [{ id: 1 }], count: -1 });
    await expect(rest.entity('orders').get(2)).resolves.toEqual({ id: 2 });
    await expect(rest.entity('orders').create({ item: 'widget' })).resolves.toEqual({ id: 2 });
    await expect(rest.entity('orders').update(2, { qty: 4 })).resolves.toEqual({ id: 2 });
    await expect(rest.entity('orders').remove(2)).resolves.toBeNull();
    await expect(rest.entity('orders').delta(2, { qty: 5 }, 1)).resolves.toEqual({ version: 2 });
    await expect(rest.entity('orders').deltaFromTracker({ entity: { Key: 99, name: 'cached' } })).resolves.toEqual({ Key: 99, name: 'cached' });
    await expect(rest.entity('orders').deltaFromTracker({ entity: { Key: 100 }, changes: true })).resolves.toEqual({ saved: true });
    expect(injectedBareMetal.Binary.fetchLayout).toHaveBeenCalledWith('orders');
    expect(injectedBareMetal.Binary.applyDelta).toHaveBeenCalledWith('orders', 100, expect.any(Uint8Array));
  });

  test('wal stream helpers parse complete and truncated buffers', async () => {
    function walBuffer(records) {
      const chunks = [];
      const count = new Uint8Array(4);
      new DataView(count.buffer).setUint32(0, records.length, true);
      chunks.push(count);
      records.forEach((record) => {
        const bytes = record == null ? new Uint8Array(0) : new Uint8Array(record);
        const header = new Uint8Array(4);
        new DataView(header.buffer).setUint32(0, bytes.length, true);
        chunks.push(header);
        if (bytes.length) chunks.push(bytes);
      });
      const total = chunks.reduce((sum, part) => sum + part.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      chunks.forEach((part) => {
        out.set(part, offset);
        offset += part.length;
      });
      return out.buffer;
    }

    const full = walBuffer([[1, 2, 3], null]);
    const truncated = full.slice(0, full.byteLength - 1);
    global.fetch = jest.fn()
      .mockResolvedValueOnce(binaryResponse(full))
      .mockResolvedValueOnce(binaryResponse(truncated));
    const rest = loadRest();

    await expect(rest.walStream('orders')).resolves.toEqual({
      records: [full.slice(8, 11), null],
      complete: true
    });
    const partial = await rest.walStreamAll();
    expect(partial.complete).toBe(false);
    expect(partial.records).toHaveLength(1);
  });

  test('websocket entity dispatch encodes frames and decodes payloads', async () => {
    class EchoWebSocket extends MockWebSocket {
      constructor(url) {
        super(url);
        global.__lastWs = this;
      }
    }
    global.WebSocket = EchoWebSocket;
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse([{ verb: 'GET', path: '/api/items', id: 1 }]))
      .mockResolvedValueOnce(jsonResponse({
        protocol: 'BMW1.0',
        routes: [{ name: 'listItems', opcode: 7 }]
      }));
    const rest = loadRest();
    await rest.init();

    const promise = rest.entity('items').list();
    await Promise.resolve();

    const sent = global.__lastWs._sent[0];
    const view = new DataView(sent.buffer || sent);
    const requestId = view.getUint32(2, true);
    const json = new TextEncoder().encode(JSON.stringify({ via: 'ws' }));
    const buf = new Uint8Array(9 + json.length);
    new DataView(buf.buffer).setUint16(0, 7 << 2);
    new DataView(buf.buffer).setUint32(2, requestId, true);
    buf[6] = json.length & 0xFF;
    buf[7] = (json.length >> 8) & 0xFF;
    buf[8] = (json.length >> 16) & 0xFF;
    buf.set(json, 9);
    global.__lastWs.onmessage({ data: buf.buffer });

    await expect(promise).resolves.toEqual({ via: 'ws' });
  });

  test('websocket create sends payload frames with encoded JSON bodies', async () => {
    class EchoWebSocket extends MockWebSocket {
      constructor(url) {
        super(url);
        global.__lastWs = this;
      }
    }
    global.WebSocket = EchoWebSocket;
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse([{ verb: 'POST', path: '/api/items', id: 3 }]))
      .mockResolvedValueOnce(jsonResponse({
        protocol: 'BMW1.0',
        routes: [{ name: 'createItems', opcode: 9 }]
      }));
    const rest = loadRest();
    await rest.init();

    const created = rest.entity('items').create({ name: 'widget' });
    await Promise.resolve();
    const sent = global.__lastWs._sent[0];
    expect(sent.byteLength).toBeGreaterThan(6);
    const reqId = new DataView(sent.buffer).getUint32(2, true);
    const json = new TextEncoder().encode(JSON.stringify({ created: true }));
    const buf = new Uint8Array(9 + json.length);
    new DataView(buf.buffer).setUint16(0, 9 << 2);
    new DataView(buf.buffer).setUint32(2, reqId, true);
    buf[6] = json.length & 0xFF;
    buf[7] = (json.length >> 8) & 0xFF;
    buf[8] = (json.length >> 16) & 0xFF;
    buf.set(json, 9);
    global.__lastWs.onmessage({ data: buf.buffer });

    await expect(created).resolves.toEqual({ created: true });
    expect(reqId).toBeGreaterThan(0);
  });

  test('call rejects unauthorized responses and websocket decode errors fall back to HTTP', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'text/plain' },
      text: () => Promise.resolve('unauthorized')
    });
    const rest = loadRest();
    await expect(rest.call('GET', '/api/protected')).rejects.toThrow('Unauthorized');

    class EchoWebSocket extends MockWebSocket {
      constructor(url) {
        super(url);
        global.__lastWs = this;
      }
    }
    global.WebSocket = EchoWebSocket;
    global.fetch = jest.fn()
      .mockResolvedValueOnce(jsonResponse([{ verb: 'GET', path: '/api/items', id: 1 }]))
      .mockResolvedValueOnce(jsonResponse({ protocol: 'BMW1.0', routes: [{ name: 'listItems', opcode: 5 }] }))
      .mockResolvedValueOnce(jsonResponse([{ via: 'http' }]));
    const wsRest = loadRest();
    await wsRest.init();
    const pending = wsRest.entity('items').list();
    await Promise.resolve();
    const sent = global.__lastWs._sent[0];
    const reqId = new DataView(sent.buffer).getUint32(2, true);
    const invalidJson = new TextEncoder().encode('{bad');
    const bad = new Uint8Array(9 + invalidJson.length);
    new DataView(bad.buffer).setUint16(0, 5 << 2);
    new DataView(bad.buffer).setUint32(2, reqId, true);
    bad[6] = invalidJson.length & 0xFF;
    bad[7] = (invalidJson.length >> 8) & 0xFF;
    bad[8] = (invalidJson.length >> 16) & 0xFF;
    bad.set(invalidJson, 9);
    global.__lastWs.onmessage({ data: bad.buffer });
    await expect(pending).resolves.toEqual([{ via: 'http' }]);
  });
});
