/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadServiceWorker() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.ServiceWorker.js'), 'utf8');

  const listeners = {};
  const mockCache = {
    put: jest.fn().mockResolvedValue(undefined),
    match: jest.fn().mockResolvedValue(undefined),
    addAll: jest.fn().mockResolvedValue(undefined),
    keys: jest.fn().mockResolvedValue([])
  };

  const mockSelf = {
    addEventListener: jest.fn((event, handler) => { listeners[event] = handler; }),
    skipWaiting: jest.fn().mockResolvedValue(undefined),
    clients: {
      claim: jest.fn().mockResolvedValue(undefined),
      matchAll: jest.fn().mockResolvedValue([]),
      openWindow: jest.fn().mockResolvedValue(null)
    },
    caches: {
      open: jest.fn().mockResolvedValue(mockCache),
      keys: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(true),
      match: jest.fn().mockResolvedValue(undefined)
    },
    registration: {
      showNotification: jest.fn().mockResolvedValue(undefined)
    }
  };

  const fn = new Function('self', code);
  fn(mockSelf);
  return { listeners, mockSelf, mockCache };
}

describe('BareMetal.ServiceWorker', () => {
  test('install listener is registered', () => {
    const { mockSelf } = loadServiceWorker();
    const events = mockSelf.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toContain('install');
  });

  test('activate listener is registered', () => {
    const { mockSelf } = loadServiceWorker();
    const events = mockSelf.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toContain('activate');
  });

  test('fetch listener is registered', () => {
    const { mockSelf } = loadServiceWorker();
    const events = mockSelf.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toContain('fetch');
  });

  test('message listener is registered', () => {
    const { mockSelf } = loadServiceWorker();
    const events = mockSelf.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toContain('message');
  });

  test('message handler handles BM_PRECACHE', async () => {
    const { listeners, mockSelf, mockCache } = loadServiceWorker();
    const port = { postMessage: jest.fn() };
    listeners.message({ data: { type: 'BM_PRECACHE', urls: ['/a.html', '/b.js'] }, ports: [port] });
    // Wait for async cache operations
    await new Promise(r => setTimeout(r, 50));
    expect(mockSelf.caches.open).toHaveBeenCalledWith('bm-precache');
    expect(mockCache.addAll).toHaveBeenCalledWith(['/a.html', '/b.js']);
  });

  test('message handler handles BM_CLEAR_CACHE', async () => {
    const { listeners, mockSelf } = loadServiceWorker();
    mockSelf.caches.keys.mockResolvedValue(['bm-static', 'bm-api', 'other-cache']);
    const port = { postMessage: jest.fn() };
    listeners.message({ data: { type: 'BM_CLEAR_CACHE' }, ports: [port] });
    await new Promise(r => setTimeout(r, 50));
    // Should delete bm-* caches but not other-cache
    expect(mockSelf.caches.delete).toHaveBeenCalledWith('bm-static');
    expect(mockSelf.caches.delete).toHaveBeenCalledWith('bm-api');
    expect(mockSelf.caches.delete).not.toHaveBeenCalledWith('other-cache');
  });

  test('message handler handles BM_SKIP_WAITING', () => {
    const { listeners, mockSelf } = loadServiceWorker();
    const port = { postMessage: jest.fn() };
    listeners.message({ data: { type: 'BM_SKIP_WAITING' }, ports: [port] });
    expect(mockSelf.skipWaiting).toHaveBeenCalled();
  });

  test('message handler handles BM_CACHE_STATUS', async () => {
    const { listeners, mockSelf } = loadServiceWorker();
    mockSelf.caches.keys.mockResolvedValue(['bm-static', 'bm-images', 'other']);
    const port = { postMessage: jest.fn() };
    listeners.message({ data: { type: 'BM_CACHE_STATUS' }, ports: [port] });
    await new Promise(r => setTimeout(r, 50));
    expect(port.postMessage).toHaveBeenCalledWith({ caches: ['bm-static', 'bm-images'], totalSize: 0 });
  });

  test('message handler handles BM_SET_ROUTES', () => {
    const { listeners } = loadServiceWorker();
    const port = { postMessage: jest.fn() };
    listeners.message({ data: { type: 'BM_SET_ROUTES', routes: [{ match: '\\.html$', strategy: 'cacheFirst', cacheName: 'bm-html' }] }, ports: [port] });
    expect(port.postMessage).toHaveBeenCalledWith({ ok: true });
  });

  test('sync listener is registered', () => {
    const { mockSelf } = loadServiceWorker();
    const events = mockSelf.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toContain('sync');
  });

  test('push listener is registered', () => {
    const { mockSelf } = loadServiceWorker();
    const events = mockSelf.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toContain('push');
  });

  test('notificationclick listener is registered', () => {
    const { mockSelf } = loadServiceWorker();
    const events = mockSelf.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toContain('notificationclick');
  });
});
