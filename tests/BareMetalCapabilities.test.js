/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Capabilities.js');

function createMql(matches) {
  let handler = null;
  return {
    matches: !!matches,
    media: '',
    addEventListener: jest.fn((event, cb) => {
      if (event === 'change') handler = cb;
    }),
    removeEventListener: jest.fn((event, cb) => {
      if (event === 'change' && handler === cb) handler = null;
    }),
    dispatch(next) {
      this.matches = !!next;
      if (handler) handler({ matches: this.matches, media: this.media });
    }
  };
}

function createEnvironment(overrides) {
  const events = {};
  const dark = createMql(false);
  dark.media = '(prefers-color-scheme: dark)';
  const motion = createMql(false);
  motion.media = '(prefers-reduced-motion: reduce)';
  const contrast = createMql(false);
  contrast.media = '(prefers-contrast: more)';
  const coarse = createMql(false);
  coarse.media = '(pointer: coarse)';
  const mqls = {
    '(prefers-color-scheme: dark)': dark,
    '(prefers-reduced-motion: reduce)': motion,
    '(prefers-contrast: more)': contrast,
    '(pointer: coarse)': coarse
  };
  const battery = {
    level: 0.82,
    charging: true,
    addEventListener: jest.fn()
  };
  const connection = {
    effectiveType: '4g',
    downlink: 12,
    saveData: false,
    _handler: null,
    addEventListener: jest.fn((event, cb) => {
      if (event === 'change') connection._handler = cb;
    }),
    removeEventListener: jest.fn((event, cb) => {
      if (event === 'change' && connection._handler === cb) connection._handler = null;
    }),
    dispatch() {
      if (connection._handler) connection._handler({ type: 'change' });
    }
  };
  const glExt = { UNMASKED_RENDERER_WEBGL: 37446, UNMASKED_VENDOR_WEBGL: 37445 };
  const gl = {
    RENDERER: 7937,
    getExtension: jest.fn(() => glExt),
    getParameter: jest.fn((key) => key === glExt.UNMASKED_RENDERER_WEBGL ? 'Mock GPU 9000' : 'Mock Renderer')
  };
  const documentMock = {
    createElement: jest.fn((tag) => {
      if (tag === 'canvas') {
        return {
          getContext: jest.fn((type) => (type === 'webgl' || type === 'experimental-webgl') ? gl : null)
        };
      }
      return global.document.createElement(tag);
    })
  };
  const navigatorMock = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    language: 'en-GB',
    languages: ['en-GB', 'en'],
    maxTouchPoints: 3,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    clipboard: { writeText: jest.fn() },
    geolocation: { getCurrentPosition: jest.fn((ok) => ok({ coords: { latitude: 0, longitude: 0 } })) },
    gpu: {},
    serviceWorker: {},
    mediaDevices: {
      getUserMedia: jest.fn(() => Promise.resolve({ getTracks: () => [{ stop: jest.fn() }] }))
    },
    permissions: {
      query: jest.fn(({ name }) => Promise.resolve({ state: name === 'geolocation' ? 'prompt' : 'granted' }))
    },
    connection,
    getGamepads: jest.fn(() => []),
    share: jest.fn(),
    wakeLock: { request: jest.fn() },
    bluetooth: {},
    usb: {},
    hid: {},
    vibrate: jest.fn(() => true),
    getBattery: jest.fn(() => Promise.resolve(battery))
  };
  const NotificationMock = function Notification() {};
  NotificationMock.permission = 'default';
  NotificationMock.requestPermission = jest.fn(() => Promise.resolve('granted'));
  const windowMock = {
    navigator: navigatorMock,
    document: documentMock,
    screen: { width: 1440, height: 900, colorDepth: 24 },
    devicePixelRatio: 2,
    WebSocket: function WebSocket() {},
    fetch: jest.fn(),
    crypto: { subtle: {} },
    SpeechRecognition: function SpeechRecognition() {},
    speechSynthesis: {},
    PaymentRequest: function PaymentRequest() {},
    Notification: NotificationMock,
    indexedDB: {},
    performance: { memory: { jsHeapSizeLimit: 2147483648 } },
    matchMedia: jest.fn((query) => mqls[query] || createMql(false)),
    addEventListener: jest.fn((event, cb) => { events[event] = cb; }),
    removeEventListener: jest.fn((event, cb) => {
      if (events[event] === cb) delete events[event];
    })
  };

  const env = {
    window: windowMock,
    navigator: navigatorMock,
    document: documentMock,
    screen: windowMock.screen,
    events,
    mqls,
    connection,
    battery,
    Notification: NotificationMock
  };

  if (overrides) {
    if (overrides.window) Object.assign(windowMock, overrides.window);
    if (overrides.navigator) Object.assign(navigatorMock, overrides.navigator);
    if (overrides.screen) Object.assign(windowMock.screen, overrides.screen);
    if (overrides.mqls) Object.assign(mqls, overrides.mqls);
    if (overrides.connection) Object.assign(connection, overrides.connection);
    if (overrides.Notification) {
      env.Notification = overrides.Notification;
      windowMock.Notification = overrides.Notification;
    }
  }

  return env;
}

function loadCapabilities(overrides) {
  const code = fs.readFileSync(SRC, 'utf8');
  const env = createEnvironment(overrides);
  const fn = new Function('BareMetal', 'window', 'document', 'navigator', 'screen', 'module', code + '\nreturn BareMetal.Capabilities;');
  return { Capabilities: fn({}, env.window, env.document, env.navigator, env.screen, { exports: {} }), env };
}

describe('BareMetal.Capabilities', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('detect reports supported and missing features', () => {
    const { Capabilities } = loadCapabilities({ navigator: { serial: null } });

    expect(Capabilities.detect('clipboard')).toBe(true);
    expect(Capabilities.detect('webgl')).toBe(true);
    expect(Capabilities.detect('webgpu')).toBe(true);
    expect(Capabilities.detect('serviceWorker')).toBe(true);
    expect(Capabilities.detect('speechRecognition')).toBe(true);
    expect(Capabilities.detect('serial')).toBe(false);
    expect(Capabilities.detectAll(['fetch', 'crypto', 'bluetooth'])).toEqual({ fetch: true, crypto: true, bluetooth: true });
  });

  test('profile returns the expected environment shape', () => {
    const { Capabilities } = loadCapabilities();
    const info = Capabilities.profile();

    expect(info).toEqual(expect.objectContaining({
      browser: 'Chrome',
      os: 'Windows',
      mobile: false,
      touch: true,
      memory: 8,
      cores: 8,
      gpu: 'Mock GPU 9000',
      language: 'en-GB',
      darkMode: false,
      reducedMotion: false,
      prefersContrast: false
    }));
    expect(info.screen).toEqual({ width: 1440, height: 900, dpr: 2, colorDepth: 24 });
    expect(info.connection).toEqual({ type: '4g', downlink: 12, saveData: false });
    expect(typeof info.timezone).toBe('string');
  });

  test('fallback picks the first supported option and supports invokes fallback when needed', () => {
    const { Capabilities } = loadCapabilities({ navigator: { gpu: null } });
    const primary = jest.fn();
    const fallback = jest.fn(() => 'canvas-mode');

    expect(Capabilities.fallback(
      { feature: 'webgpu', value: primary },
      { feature: 'webgl', value: fallback },
      'minimal'
    )).toBe(fallback);
    expect(Capabilities.supports('webgpu', fallback)).toBe('canvas-mode');
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(Capabilities.supports('webgl', fallback)).toBe(true);
  });

  test('permission helpers query and request permissions', async () => {
    const { Capabilities, env } = loadCapabilities();

    await expect(Capabilities.permission('notifications')).resolves.toBe('prompt');
    await expect(Capabilities.permission('geolocation')).resolves.toBe('prompt');
    await expect(Capabilities.requestPermission('notifications')).resolves.toBe('granted');
    await expect(Capabilities.requestPermission('geolocation')).resolves.toBe('granted');

    expect(env.Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(env.navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  test('require reports mixed supported and missing features', () => {
    const { Capabilities } = loadCapabilities({ navigator: { serial: null, usb: null } });
    const result = Capabilities.require(['fetch', 'webgpu', 'serial', 'usb']);

    expect(result).toEqual({
      supported: ['fetch', 'webgpu'],
      missing: ['serial', 'usb'],
      ok: false
    });
  });

  test('degrade selects the highest compatible level', () => {
    const { Capabilities } = loadCapabilities({ navigator: { gpu: null } });
    const level = Capabilities.degrade(['canvas', 'webgl', 'webgpu'], [
      { name: 'full', requires: ['webgl', 'webgpu'] },
      { name: 'basic', requires: ['canvas'] },
      { name: 'minimal', requires: [] }
    ]);

    expect(level).toEqual({ name: 'basic', requires: ['canvas'], missing: [], ok: true });
  });

  test('score returns a bounded aggregate score and richer environments score higher', () => {
    const rich = loadCapabilities().Capabilities;
    const poor = loadCapabilities({
      navigator: {
        gpu: null,
        mediaDevices: null,
        share: null,
        wakeLock: null,
        bluetooth: null,
        usb: null,
        hid: null,
        getGamepads: null,
        deviceMemory: 1,
        hardwareConcurrency: 1
      },
      window: {
        fetch: null,
        WebSocket: null,
        PaymentRequest: null,
        SpeechRecognition: null,
        speechSynthesis: null,
        crypto: null,
        indexedDB: null
      },
      connection: { downlink: 0.5 }
    }).Capabilities;

    expect(rich.score()).toBeGreaterThan(poor.score());
    expect(rich.score()).toBeGreaterThanOrEqual(0);
    expect(rich.score()).toBeLessThanOrEqual(100);
    expect(poor.score()).toBeGreaterThanOrEqual(0);
    expect(poor.score()).toBeLessThanOrEqual(100);
  });

  test('register adds custom feature detection', () => {
    const { Capabilities } = loadCapabilities();

    Capabilities.register('customFeature', () => true);

    expect(Capabilities.detect('customFeature')).toBe(true);
  });

  test('onChange reacts to connection and media query changes and unsubscribes cleanly', () => {
    const { Capabilities, env } = loadCapabilities();
    const callback = jest.fn();
    const unsubscribe = Capabilities.onChange(callback);

    env.connection.dispatch();
    env.mqls['(prefers-color-scheme: dark)'].dispatch(true);
    expect(callback).toHaveBeenNthCalledWith(1, expect.objectContaining({ connection: expect.objectContaining({ type: '4g' }) }), expect.objectContaining({ type: 'connection' }));
    expect(callback).toHaveBeenNthCalledWith(2, expect.objectContaining({ darkMode: true }), expect.objectContaining({ type: 'darkMode' }));

    unsubscribe();
    callback.mockClear();
    env.connection.dispatch();
    expect(callback).not.toHaveBeenCalled();
  });

  test('compare distinguishes required and optional gaps', () => {
    const { Capabilities } = loadCapabilities({ navigator: { serial: null, bluetooth: null } });
    const result = Capabilities.compare({ required: ['fetch', 'serial'], optional: ['bluetooth'] });

    expect(result).toEqual({ compatible: false, missing: ['serial'], optional: ['bluetooth'] });
  });
});
