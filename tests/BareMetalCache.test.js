/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Cache.js');

function loadCache() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('BareMetal.Cache', () => {
  let Cache;

  beforeEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    Cache = loadCache();
  });

  test('supports get/set/delete/clear basic operations', () => {
    const cache = Cache.create();

    cache.set('alpha', 1, { tags: ['core'] });
    cache.set('beta', 2);

    expect(cache.get('alpha')).toBe(1);
    expect(cache.has('beta')).toBe(true);
    expect(cache.size()).toBe(2);
    expect(cache.keys().sort()).toEqual(['alpha', 'beta']);
    expect(cache.entries()).toEqual(expect.arrayContaining([
      ['alpha', expect.objectContaining({ value: 1, tags: ['core'], stale: false })],
      ['beta', expect.objectContaining({ value: 2, stale: false })]
    ]));

    expect(cache.delete('alpha')).toBe(true);
    expect(cache.get('alpha')).toBeUndefined();

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.keys()).toEqual([]);
  });

  test('expires entries by TTL and prunes expired values', () => {
    jest.useFakeTimers();
    const cache = Cache.create({ ttl: 100 });

    cache.set('ttl', 'value');
    expect(cache.get('ttl')).toBe('value');

    jest.advanceTimersByTime(101);

    expect(cache.has('ttl')).toBe(false);
    expect(cache.get('ttl')).toBeUndefined();
    expect(cache.entries()).toEqual([
      ['ttl', expect.objectContaining({ value: 'value', stale: true })]
    ]);
    expect(cache.prune()).toBe(1);
    expect(cache.size()).toBe(0);
  });

  test('returns stale during SWR and revalidates in the background', async () => {
    jest.useFakeTimers();
    const cache = Cache.create({ ttl: 50, swr: 200 });
    const states = [];
    const fetchFn = jest.fn(() => Promise.resolve('fresh'));

    cache.on('revalidate', (evt) => states.push(evt.state));
    cache.set('profile', 'stale');
    jest.advanceTimersByTime(60);

    expect(cache.wrap('profile', fetchFn)).toBe('stale');
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    await Promise.resolve();

    expect(cache.get('profile')).toBe('fresh');
    expect(states).toEqual(expect.arrayContaining(['start', 'success']));
  });

  test('falls back to stale data on revalidation error when staleIfError is enabled', async () => {
    jest.useFakeTimers();
    const cache = Cache.create({ ttl: 50, staleIfError: true });
    const fetchFn = jest.fn(() => Promise.reject(new Error('boom')));

    cache.set('settings', 'old');
    jest.advanceTimersByTime(75);

    await expect(cache.wrap('settings', fetchFn)).resolves.toBe('old');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(cache.entries()).toEqual([
      ['settings', expect.objectContaining({ value: 'old', stale: true })]
    ]);
  });

  test('uses wrap as a cache-aside helper', async () => {
    const cache = Cache.create();
    const fetchFn = jest.fn(() => Promise.resolve('payload'));

    await expect(cache.wrap('remote', fetchFn)).resolves.toBe('payload');
    expect(cache.wrap('remote', fetchFn)).toBe('payload');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('invalidates entries by tag without deleting them', () => {
    const cache = Cache.create();

    cache.set('users', [1, 2], { tags: ['list', 'users'] });
    cache.set('posts', [3], { tags: ['list', 'posts'] });

    expect(cache.invalidateByTag('users')).toBe(1);
    expect(cache.get('users')).toBeUndefined();
    expect(cache.get('posts')).toEqual([3]);
    expect(cache.entries()).toEqual(expect.arrayContaining([
      ['users', expect.objectContaining({ stale: true })],
      ['posts', expect.objectContaining({ stale: false })]
    ]));
  });

  test('tracks hit/miss stats', async () => {
    const cache = Cache.create();

    expect(cache.get('missing')).toBeUndefined();
    cache.set('ready', 'ok');
    expect(cache.get('ready')).toBe('ok');
    await expect(cache.wrap('wrapped', () => Promise.resolve('value'))).resolves.toBe('value');
    expect(cache.wrap('wrapped', () => Promise.resolve('other'))).toBe('value');

    expect(cache.stats()).toEqual({
      hits: 2,
      misses: 2,
      hitRate: 0.5,
      size: 2,
      evictions: 0
    });
  });

  test('evicts least recently used items in lru caches', () => {
    const cache = Cache.lru(2);

    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);

    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  test('promotes lower-tier hits into higher tiers', () => {
    const l1 = Cache.create({ maxSize: 5 });
    const l2 = Cache.create({ storage: localStorage, namespace: 'BareMetal.Cache:tiered:' });
    const tiered = Cache.tiered([l1, l2]);

    l2.set('user:1', { id: 1, name: 'Ada' }, { ttl: 1000 });

    expect(l1.get('user:1')).toBeUndefined();
    expect(tiered.get('user:1')).toEqual({ id: 1, name: 'Ada' });
    expect(l1.get('user:1')).toEqual({ id: 1, name: 'Ada' });
  });

  test('memoizes functions using argument-derived keys', () => {
    const fn = jest.fn((a, b) => a + b);
    const memoized = Cache.memoize(fn, {
      key(args) { return args.join(':'); },
      ttl: 1000,
      maxSize: 10
    });

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(memoized(2, 3)).toBe(5);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('fires onEvict callback and tracks maxSize eviction', () => {
    const onEvict = jest.fn();
    const cache = Cache.create({ maxSize: 2, onEvict });

    cache.set('first', 1);
    cache.set('second', 2);
    cache.set('third', 3);

    expect(onEvict).toHaveBeenCalledWith('first', 1);
    expect(cache.size()).toBe(2);
    expect(cache.has('first')).toBe(false);
    expect(cache.stats().evictions).toBe(1);
  });

  test('supports localStorage serialization, explicit ttl overrides, and event unsubscription', () => {
    jest.useFakeTimers();
    const seen = [];
    const cache = Cache.create({
      storage: 'localStorage',
      namespace: 'BareMetal.Cache:serialized:',
      ttl: 500,
      serialize: JSON.stringify,
      deserialize: JSON.parse
    });
    const offHit = cache.on('hit', (payload) => seen.push(payload.key));

    cache.set('profile', { id: 1 }, { ttl: 0, tags: ['user', 'profile'] });
    expect(cache.__peekRaw('profile')).toEqual(expect.objectContaining({
      ttl: 0,
      expires: 0,
      tags: ['user', 'profile']
    }));
    expect(cache.get('profile')).toEqual({ id: 1 });
    offHit();
    expect(cache.get('profile')).toEqual({ id: 1 });
    expect(seen).toEqual(['profile']);
    expect(cache.on('unknown', 'bad')).toEqual(expect.any(Function));
  });

  test('custom map-like storage supports entries, remove fallback, and missing deletes', () => {
    const data = new Map();
    const storage = {
      get: (key) => data.get(key),
      set: (key, value) => data.set(key, value),
      remove: (key) => data.delete(key),
      entries: () => data.entries()
    };
    const cache = Cache.create({ storage });

    cache.set('one', 1, { tags: ['a', 'b'] });
    cache.set('two', 2, { tags: ['b'] });

    expect(cache.entries()).toEqual(expect.arrayContaining([
      ['one', expect.objectContaining({ value: 1, tags: ['a', 'b'] })],
      ['two', expect.objectContaining({ value: 2, tags: ['b'] })]
    ]));
    expect(cache.invalidateByTag('b')).toBe(2);
    expect(cache.invalidate('missing')).toBe(false);
    expect(cache.delete('missing')).toBe(false);
    expect(cache.delete('one')).toBe(true);
  });

  test('dedupes concurrent wrap calls and memoizes async results', async () => {
    const cache = Cache.create({ ttl: 1000 });
    const gate = deferred();
    const fetchFn = jest.fn(() => gate.promise);

    const first = cache.wrap('shared', fetchFn);
    const second = cache.wrap('shared', fetchFn);

    expect(first).toBe(second);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    gate.resolve('value');
    await expect(first).resolves.toBe('value');
    expect(cache.get('shared')).toBe('value');

    const asyncFn = jest.fn(async (value) => value * 2);
    const memoized = Cache.memoize(asyncFn, { ttl: 1000 });
    await expect(memoized(4)).resolves.toBe(8);
    expect(memoized(4)).toBe(8);
    memoized.clear();
    await expect(memoized(4)).resolves.toBe(8);
    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  test('tiered caches propagate invalidation, clear, and stale-if-error fallback', async () => {
    jest.useFakeTimers();
    const l1 = Cache.create({ ttl: 50, swr: 100 });
    const l2 = Cache.create({ ttl: 50, swr: 100, storage: 'localStorage', namespace: 'BareMetal.Cache:tiered-extra:' });
    const tiered = Cache.tiered([l1, l2]);

    tiered.set('shared', 'stale', { ttl: 50, tags: ['shared'] });
    jest.advanceTimersByTime(60);
    expect(tiered.wrap('shared', () => Promise.resolve('fresh'), { swr: 100 })).toBe('stale');

    await Promise.resolve();
    await Promise.resolve();
    expect(tiered.get('shared')).toBe('fresh');
    expect(tiered.invalidateByTag('shared')).toBe(2);
    expect(tiered.get('shared')).toBeUndefined();
    await expect(tiered.wrap('shared', () => Promise.reject(new Error('boom')), { staleIfError: true })).resolves.toBe('fresh');
    tiered.clear();
    expect(tiered.size()).toBe(0);
  });
});
