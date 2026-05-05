/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function createStorageMock() {
  let data = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
    clear() {
      data = {};
    },
    key(index) {
      return Object.keys(data)[index] || null;
    },
    get length() {
      return Object.keys(data).length;
    }
  };
}

function createBroadcastChannelMock() {
  const groups = {};

  function MockBroadcastChannel(name) {
    this.name = name;
    this.closed = false;
    this.onmessage = null;
    this._listeners = [];
    groups[name] = groups[name] || [];
    groups[name].push(this);
  }

  MockBroadcastChannel.prototype.addEventListener = function(type, handler) {
    if (type === 'message' && typeof handler === 'function') this._listeners.push(handler);
  };

  MockBroadcastChannel.prototype.postMessage = function(message) {
    const peers = groups[this.name] || [];
    peers.forEach((peer) => {
      if (peer === this || peer.closed) return;
      const event = { data: message };
      if (typeof peer.onmessage === 'function') peer.onmessage(event);
      peer._listeners.forEach((handler) => handler(event));
    });
  };

  MockBroadcastChannel.prototype.close = function() {
    this.closed = true;
    groups[this.name] = (groups[this.name] || []).filter((peer) => peer !== this);
  };

  return MockBroadcastChannel;
}

function loadSession(env) {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Session.js'), 'utf8');
  const fn = new Function(
    'window',
    'document',
    'navigator',
    'localStorage',
    'sessionStorage',
    'BroadcastChannel',
    'module',
    'exports',
    'screen',
    code + '\nreturn window.BareMetal.Session;'
  );
  return fn(
    env.window,
    env.window.document,
    env.window.navigator,
    env.window.localStorage,
    env.window.sessionStorage,
    env.window.BroadcastChannel,
    { exports: {} },
    {},
    env.window.screen || {}
  );
}

describe('BareMetal.Session', () => {
  let Session;
  let localStorageMock;
  let sessionStorageMock;
  let windowLike;

  beforeEach(() => {
    jest.useRealTimers();
    localStorageMock = createStorageMock();
    sessionStorageMock = createStorageMock();
    windowLike = {
      BareMetal: {},
      document: document,
      navigator: {
        userAgent: 'jest',
        language: 'en-GB',
        platform: 'win32',
        vendor: 'test',
        hardwareConcurrency: 8,
        deviceMemory: 16
      },
      screen: { width: 1920, height: 1080, colorDepth: 24 },
      localStorage: localStorageMock,
      sessionStorage: sessionStorageMock,
      BroadcastChannel: createBroadcastChannelMock(),
      location: { hostname: 'localhost' },
      Intl: Intl,
      process: process,
      addEventListener: window.addEventListener.bind(window),
      removeEventListener: window.removeEventListener.bind(window),
      setTimeout: setTimeout,
      clearTimeout: clearTimeout
    };
    Session = loadSession({ window: windowLike });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('init/get/set/getData/destroy manage lifecycle', () => {
    const expired = jest.fn();
    const changed = jest.fn();
    const session = Session.create({ storage: 'localStorage', key: 'life', ttl: 5000, onExpire: expired });
    session.onChange(changed);

    session.init({ accessToken: 'a1', user: { id: 7 } });
    session.set('role', 'admin');

    expect(session.isActive()).toBe(true);
    expect(session.get('accessToken')).toBe('a1');
    expect(session.get('user')).toEqual({ id: 7 });
    expect(session.getData()).toMatchObject({ accessToken: 'a1', role: 'admin' });
    expect(localStorageMock.getItem('life')).toContain('a1');
    expect(changed).toHaveBeenCalled();

    session.destroy();

    expect(session.isActive()).toBe(false);
    expect(session.getData()).toBeNull();
    expect(localStorageMock.getItem('life')).toBeNull();
    expect(expired).toHaveBeenCalledWith(expect.objectContaining({ reason: 'destroyed' }));
  });

  test('ttl expiry clears session with fake timers', () => {
    jest.useFakeTimers();
    const expired = jest.fn();
    const session = Session.create({ storage: 'memory', key: 'ttl', ttl: 100, onExpire: expired });

    session.init({ accessToken: 'short' });
    expect(session.isActive()).toBe(true);

    jest.advanceTimersByTime(101);

    expect(session.isActive()).toBe(false);
    expect(session.getExpiry()).toBeNull();
    expect(expired).toHaveBeenCalledWith(expect.objectContaining({ reason: 'expired' }));
  });

  test('refresh calls refreshFn and updates data', async () => {
    const refreshed = jest.fn();
    const session = Session.create({ storage: 'memory', key: 'refresh', ttl: 1000, onRefresh: refreshed });
    const refreshFn = jest.fn().mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresIn: 60
    });

    session.init({ accessToken: 'old-access', refreshToken: 'old-refresh' });
    await session.refresh(refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(session.get('accessToken')).toBe('new-access');
    expect(session.get('refreshToken')).toBe('new-refresh');
    expect(session.getExpiry()).toBeInstanceOf(Date);
    expect(refreshed).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      expect.objectContaining({ source: 'local' })
    );
  });

  test('rotate prevents concurrent refresh calls', async () => {
    let resolveRefresh;
    const refreshFn = jest.fn(() => new Promise((resolve) => {
      resolveRefresh = resolve;
    }));
    const session = Session.create({ storage: 'memory', key: 'rotate', ttl: 1000 });
    session.init({ accessToken: 'old', refreshToken: 'rotating' });

    const first = session.rotate({ refreshFn, lockout: true });
    const second = session.rotate({ refreshFn, lockout: true });
    resolveRefresh({ accessToken: 'fresh', refreshToken: 'next', expiresIn: 10 });

    const [one, two] = await Promise.all([first, second]);
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(one).toEqual(two);
    expect(session.get('refreshToken')).toBe('next');
  });

  test('tabSync broadcasts messages with BroadcastChannel', () => {
    const a = Session.tabSync('sync-demo');
    const b = Session.tabSync('sync-demo');
    const seen = jest.fn();
    b.onMessage(seen);

    a.broadcast({ type: 'ping', ok: true });

    expect(seen).toHaveBeenCalledWith({ type: 'ping', ok: true });
    a.destroy();
    b.destroy();
  });

  test('activity tracker detects idle state and resets on touch', () => {
    jest.useFakeTimers();
    const idle = jest.fn();
    const tracker = Session.activity({ idleTimeout: 100, events: ['click'] });
    tracker.onIdle(idle);

    expect(tracker.isIdle()).toBe(false);
    jest.advanceTimersByTime(101);
    expect(tracker.isIdle()).toBe(true);
    expect(idle).toHaveBeenCalledWith(true);

    tracker.touch();
    expect(tracker.isIdle()).toBe(false);
    tracker.destroy();
  });

  test('guard invokes redirect when check fails', () => {
    const redirect = jest.fn();
    const guard = Session.guard(
      (ctx) => ctx.allowed,
      redirect
    );

    expect(guard({ allowed: true })).toBe(true);
    expect(guard({ allowed: false })).toBe(false);
    expect(redirect).toHaveBeenCalledWith({ allowed: false });
  });

  test('multi-tab session sync propagates updates and destroy', () => {
    const first = Session.create({ storage: 'memory', key: 'shared', ttl: 1000, syncTabs: true });
    const second = Session.create({ storage: 'memory', key: 'shared', ttl: 1000, syncTabs: true });

    first.init({ accessToken: 'a1', user: { id: 3 } });
    expect(second.getData()).toMatchObject({ accessToken: 'a1', user: { id: 3 } });

    first.set('role', 'editor');
    expect(second.get('role')).toBe('editor');

    first.destroy();
    expect(second.isActive()).toBe(false);

    first.init({ accessToken: 'a2' });
    expect(second.get('accessToken')).toBe('a2');
  });
});
