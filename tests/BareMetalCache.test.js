/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Cache.js');

function loadCache() {
  const code = fs.readFileSync(SRC, 'utf8');
  const mod = { exports: {} };
  delete global.window.BareMetal;
  const fn = new Function('window', 'module', code + '\nreturn window.BareMetal.Cache || module.exports;');
  return fn(global.window, mod);
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
});
