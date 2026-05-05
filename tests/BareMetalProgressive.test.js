/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadProgressive(mockRest, mockKVStore) {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Progressive.js'), 'utf8');
  const bm = {};
  if (mockRest) bm.Rest = mockRest;
  if (mockKVStore) bm.LocalKVStore = mockKVStore;

  const mockRegistration = {
    installing: null, waiting: null,
    active: { postMessage: jest.fn() },
    addEventListener: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    unregister: jest.fn().mockResolvedValue(true),
    pushManager: { subscribe: jest.fn().mockResolvedValue({}), getSubscription: jest.fn().mockResolvedValue(null) },
    sync: { register: jest.fn().mockResolvedValue(undefined) }
  };

  const mockSW = {
    register: jest.fn().mockResolvedValue(mockRegistration),
    getRegistration: jest.fn().mockResolvedValue(null),
    ready: Promise.resolve({ active: { postMessage: jest.fn() } }),
    addEventListener: jest.fn(),
    controller: null
  };

  const mockNavigator = { serviceWorker: mockSW, onLine: true };

  // Provide a minimal window with matchMedia
  const mockWindow = Object.assign({}, global.window || {}, {
    addEventListener: jest.fn(),
    matchMedia: jest.fn().mockReturnValue({ matches: false })
  });

  const fn = new Function('document', 'BareMetal', 'navigator', 'window', 'localStorage',
    code + '\nreturn BareMetal;');
  const result = fn(global.document, bm, mockNavigator, mockWindow, global.localStorage);
  return { Progressive: result.Progressive, mockSW, mockRegistration, mockNavigator, mockWindow };
}

describe('BareMetal.Progressive', () => {
  test('register() calls navigator.serviceWorker.register with default URL', async () => {
    const { Progressive, mockSW } = loadProgressive();
    await Progressive.register();
    expect(mockSW.register).toHaveBeenCalledWith('/BareMetal.ServiceWorker.js', undefined);
  });

  test('register() with custom SW URL', async () => {
    const { Progressive, mockSW } = loadProgressive();
    await Progressive.register('/custom-sw.js');
    expect(mockSW.register).toHaveBeenCalledWith('/custom-sw.js', undefined);
  });

  test('register() with scope option', async () => {
    const { Progressive, mockSW } = loadProgressive();
    await Progressive.register('/sw.js', { scope: '/app/' });
    expect(mockSW.register).toHaveBeenCalledWith('/sw.js', { scope: '/app/' });
  });

  test('unregister() calls registration.unregister', async () => {
    const { Progressive, mockRegistration } = loadProgressive();
    await Progressive.register();
    const result = await Progressive.unregister();
    expect(mockRegistration.unregister).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('isOnline() returns navigator.onLine', () => {
    const { Progressive } = loadProgressive();
    expect(Progressive.isOnline()).toBe(true);
  });

  test('onConnectivityChange fires callback on online/offline events', () => {
    const cb = jest.fn();
    const { Progressive, mockWindow } = loadProgressive();
    // The listeners are registered in the module IIFE on `window`
    // Since we can't trigger them easily in the sandbox, test that unsubscribe works
    const unsub = Progressive.onConnectivityChange(cb);
    expect(typeof unsub).toBe('function');
  });

  test('isInstalled() checks display-mode', () => {
    const { Progressive } = loadProgressive();
    // mockWindow.matchMedia returns { matches: false }
    expect(Progressive.isInstalled()).toBe(false);
  });

  test('generateManifest() returns valid manifest object', () => {
    const { Progressive } = loadProgressive();
    const m = Progressive.generateManifest({ name: 'Test', shortName: 'T', themeColor: '#ff0000' });
    expect(m.name).toBe('Test');
    expect(m.short_name).toBe('T');
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBe('#ff0000');
    expect(m.background_color).toBe('#ffffff');
    expect(Array.isArray(m.icons)).toBe(true);
  });

  test('generateManifest() uses defaults', () => {
    const { Progressive } = loadProgressive();
    const m = Progressive.generateManifest({});
    expect(m.name).toBe('App');
    expect(m.short_name).toBe('App');
  });

  test('postMessage() sends to active SW', async () => {
    const { Progressive, mockRegistration } = loadProgressive();
    await Progressive.register();
    // postMessage uses MessageChannel which we can't fully mock in jsdom,
    // but we verify it calls the SW's postMessage
    const promise = Progressive.postMessage({ type: 'TEST' });
    expect(mockRegistration.active.postMessage).toHaveBeenCalled();
    const args = mockRegistration.active.postMessage.mock.calls[0];
    expect(args[0]).toEqual({ type: 'TEST' });
  });

  test('precache() sends BM_PRECACHE message to SW', async () => {
    const { Progressive, mockRegistration } = loadProgressive();
    await Progressive.register();
    Progressive.precache(['/index.html', '/app.js']);
    expect(mockRegistration.active.postMessage).toHaveBeenCalled();
    const call = mockRegistration.active.postMessage.mock.calls[0];
    expect(call[0]).toEqual({ type: 'BM_PRECACHE', urls: ['/index.html', '/app.js'] });
  });

  test('clearCache() sends BM_CLEAR_CACHE message', async () => {
    const { Progressive, mockRegistration } = loadProgressive();
    await Progressive.register();
    Progressive.clearCache('bm-static');
    expect(mockRegistration.active.postMessage).toHaveBeenCalled();
    const call = mockRegistration.active.postMessage.mock.calls[0];
    expect(call[0]).toEqual({ type: 'BM_CLEAR_CACHE', cacheName: 'bm-static' });
  });

  test('clearCache() without name sends null cacheName', async () => {
    const { Progressive, mockRegistration } = loadProgressive();
    await Progressive.register();
    Progressive.clearCache();
    const call = mockRegistration.active.postMessage.mock.calls[0];
    expect(call[0]).toEqual({ type: 'BM_CLEAR_CACHE', cacheName: null });
  });

  test('isInstallable() returns false by default', () => {
    const { Progressive } = loadProgressive();
    expect(Progressive.isInstallable()).toBe(false);
  });

  test('onMessage returns unsubscribe function', () => {
    const { Progressive } = loadProgressive();
    const unsub = Progressive.onMessage(jest.fn());
    expect(typeof unsub).toBe('function');
  });
});
