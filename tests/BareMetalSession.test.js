/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

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
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Session.js');

  try {
    global.__bmSessionRootOverride = env.window;
    jest.resetModules();
    delete require.cache[require.resolve(srcPath)];
    return require(srcPath);
  } finally {
    delete global.__bmSessionRootOverride;
  }
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

describe('branch coverage - Session', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('covers guard fallback storage sync and refresh edge cases', async () => {
    const storageState = {};
    const listeners = {};
    const storage = {
      getItem: jest.fn((key) => (Object.prototype.hasOwnProperty.call(storageState, key) ? storageState[key] : null)),
      setItem: jest.fn((key, value) => { storageState[key] = String(value); }),
      removeItem: jest.fn((key) => { delete storageState[key]; })
    };
    const root = {
      BareMetal: {},
      document,
      navigator: { userAgent: 'ua', languages: ['en'], platform: 'p', vendor: 'v' },
      screen: {},
      localStorage: storage,
      sessionStorage: createStorageMock(),
      location: { hostname: 'example.test' },
      Intl: { DateTimeFormat() { throw new Error('no tz'); } },
      process,
      addEventListener(type, handler) { listeners[type] = handler; },
      removeEventListener(type) { delete listeners[type]; },
      setTimeout,
      clearTimeout
    };
    const Session = loadSession({ window: root });
    const redirect = jest.fn();

    expect(Session.fingerprint()).toBe(Session.fingerprint());
    await expect(Session.guard(() => Promise.resolve(false), redirect)({ route: '/nope' })).resolves.toBe(false);
    await expect(Session.guard(() => Promise.reject(new Error('boom')), redirect)({ route: '/boom' })).resolves.toBe(false);
    expect(Session.guard(null)({})).toBe(true);
    expect(redirect).toHaveBeenCalledTimes(2);

    const syncA = Session.tabSync('fallback');
    const syncB = Session.tabSync('fallback');
    const seen = jest.fn();
    const offSeen = syncB.onMessage(seen);

    expect(syncA.broadcast({ type: 'ping', ok: true })).toBe(true);
    const channelKey = storage.setItem.mock.calls[0][0];
    listeners.storage({ key: channelKey, newValue: JSON.stringify({ type: 'pong', ok: true }) });
    listeners.storage({ key: channelKey, newValue: '' });
    expect(seen).toHaveBeenCalledWith({ type: 'pong', ok: true });
    offSeen();
    syncA.destroy();
    expect(syncA.broadcast({ type: 'late' })).toBe(false);
    syncB.destroy();

    storageState.corrupt = '{bad json';
    const changes = [];
    const expires = [];
    const session = Session.create({ storage: 'localStorage', key: 'corrupt', ttl: 0, onExpire: (info) => expires.push(info) });
    const offChange = session.onChange((data, meta) => changes.push({ data, meta }));

    expect(session.getData()).toBeNull();
    expect(session.set('beforeInit', 1)).toBe(session);
    expect(session.get('beforeInit')).toBe(1);
    expect(session.extend(50)).toBe(session);
    await expect(session.refresh()).rejects.toThrow('refreshFn required');

    session.init({ accessToken: 'a', expiresIn: 1 });
    const refreshFn = jest.fn().mockResolvedValue({ accessToken: 'b', expiresAt: new Date(Date.now() + 2000) });
    const [one, two] = await Promise.all([session.refresh(refreshFn), session.refresh()]);
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(one).toEqual(two);
    expect(session.getExpiry()).toBeInstanceOf(Date);

    const rotateFn = jest.fn().mockResolvedValue({ accessToken: 'c', expiry: Date.now() + 3000 });
    const rotated = await Promise.all([
      session.rotate({ refreshFn: rotateFn, lockout: false }),
      session.rotate({ refreshFn: rotateFn, lockout: false })
    ]);
    await session.rotate({ refreshFn: rotateFn, lockout: false });
    expect(rotateFn).toHaveBeenCalledTimes(2);
    expect(rotated[0].accessToken).toBe('c');

    offChange();
    session.destroy();
    expect(session.getData()).toBeNull();
    expect(changes.some((entry) => entry.meta.type === 'init')).toBe(true);
    expect(expires[expires.length - 1]).toEqual(expect.objectContaining({ reason: 'destroyed' }));
  });

  test('covers activity cleanup and no-op extension paths', () => {
    jest.useFakeTimers();
    const Session = loadSession({ window: {
      BareMetal: {},
      document,
      navigator: {},
      screen: {},
      localStorage: createStorageMock(),
      sessionStorage: createStorageMock(),
      location: { hostname: 'example.test' },
      Intl,
      process,
      addEventListener: window.addEventListener.bind(window),
      removeEventListener: window.removeEventListener.bind(window),
      setTimeout,
      clearTimeout
    } });

    const tracker = Session.activity({ idleTimeout: 25, events: [] });
    expect(typeof tracker.onIdle(null)).toBe('function');
    tracker.touch();
    jest.advanceTimersByTime(26);
    expect(tracker.isIdle()).toBe(true);
    tracker.destroy();

    const session = Session.create({ storage: 'memory', key: 'noop', ttl: 0 });
    expect(session.extend(100)).toBe(session);
    expect(session.get('missing')).toBeNull();
  });
});
