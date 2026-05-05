/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadKVStore() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.LocalKVStore.js'), 'utf8');
  const bm = {};
  const fn = new Function('document', 'BareMetal', 'localStorage', 'sessionStorage', code + '\nreturn BareMetal;');
  return fn(global.document, bm, global.localStorage, global.sessionStorage).LocalKVStore;
}

describe('BareMetal.LocalKVStore', () => {
  let KV;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    KV = loadKVStore();
  });

  test('create() returns store with expected methods', () => {
    const store = KV.create();
    const methods = [
      'get', 'set', 'remove', 'has', 'clear',
      'getMany', 'setMany', 'removeMany',
      'keys', 'values', 'entries', 'count', 'find',
      'ttl', 'expire', 'persist', 'cleanup',
      'size', 'onChange'
    ];
    methods.forEach(m => expect(typeof store[m]).toBe('function'));
  });

  describe('set/get round-trip', () => {
    test.each([
      ['string', 'hello'],
      ['number', 42],
      ['object', { a: 1 }],
      ['array', [1, 2, 3]],
      ['boolean', true],
      ['null', null]
    ])('%s', async (label, value) => {
      const store = KV.create();
      await store.set('k', value);
      const result = await store.get('k');
      expect(result).toEqual(value);
    });
  });

  test('get returns null for missing key', async () => {
    const store = KV.create();
    expect(await store.get('nope')).toBeNull();
  });

  test('remove deletes key', async () => {
    const store = KV.create();
    await store.set('k', 'v');
    await store.remove('k');
    expect(await store.get('k')).toBeNull();
  });

  test('has returns true/false correctly', async () => {
    const store = KV.create();
    expect(await store.has('k')).toBe(false);
    await store.set('k', 1);
    expect(await store.has('k')).toBe(true);
    await store.remove('k');
    expect(await store.has('k')).toBe(false);
  });

  test('clear only removes namespaced keys', async () => {
    const store = KV.create({ namespace: 'app' });
    await store.set('a', 1);
    await store.set('b', 2);
    localStorage.setItem('foreign_key', 'keep me');
    await store.clear();
    expect(await store.get('a')).toBeNull();
    expect(localStorage.getItem('foreign_key')).toBe('keep me');
  });

  describe('TTL', () => {
    let realNow;

    beforeEach(() => {
      realNow = Date.now;
    });
    afterEach(() => {
      Date.now = realNow;
    });

    test('get returns null after expiry', async () => {
      const store = KV.create();
      let now = 1000000;
      Date.now = jest.fn(() => now);
      await store.set('k', 'v', 2);
      expect(await store.get('k')).toBe('v');
      now += 3000;
      expect(await store.get('k')).toBeNull();
    });

    test('expire() updates TTL on existing key', async () => {
      const store = KV.create();
      let now = 1000000;
      Date.now = jest.fn(() => now);
      await store.set('k', 'v', 10);
      const ok = await store.expire('k', 2);
      expect(ok).toBe(true);
      now += 3000;
      expect(await store.get('k')).toBeNull();
    });

    test('persist() removes TTL', async () => {
      const store = KV.create();
      let now = 1000000;
      Date.now = jest.fn(() => now);
      await store.set('k', 'v', 2);
      await store.persist('k');
      now += 5000;
      expect(await store.get('k')).toBe('v');
    });

    test('cleanup() removes expired entries', async () => {
      const store = KV.create();
      let now = 1000000;
      Date.now = jest.fn(() => now);
      await store.set('a', 1, 1);
      await store.set('b', 2, 1);
      await store.set('c', 3);
      now += 2000;
      const count = await store.cleanup();
      expect(count).toBe(2);
      expect(await store.get('c')).toBe(3);
    });
  });

  test('keys/values/entries return correct data', async () => {
    const store = KV.create({ namespace: 'iter' });
    await store.set('x', 10);
    await store.set('y', 20);
    const k = await store.keys();
    expect(k.sort()).toEqual(['x', 'y']);
    const v = (await store.values()).sort();
    expect(v).toEqual([10, 20]);
    const e = (await store.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    expect(e).toEqual([['x', 10], ['y', 20]]);
  });

  test('count returns correct number', async () => {
    const store = KV.create();
    await store.set('a', 1);
    await store.set('b', 2);
    expect(await store.count()).toBe(2);
  });

  test('getMany/setMany batch operations', async () => {
    const store = KV.create();
    await store.setMany({ a: 1, b: 2, c: 3 });
    const result = await store.getMany(['a', 'b', 'missing']);
    expect(result).toEqual({ a: 1, b: 2, missing: null });
  });

  test('removeMany removes multiple keys', async () => {
    const store = KV.create();
    await store.setMany({ a: 1, b: 2, c: 3 });
    await store.removeMany(['a', 'c']);
    expect(await store.has('a')).toBe(false);
    expect(await store.has('b')).toBe(true);
    expect(await store.has('c')).toBe(false);
  });

  test('find with predicate', async () => {
    const store = KV.create();
    await store.setMany({ a: 1, b: 20, c: 3, d: 40 });
    const found = await store.find((v) => v > 10);
    const keys = found.map(e => e[0]).sort();
    expect(keys).toEqual(['b', 'd']);
  });

  test('multiple stores with different namespaces do not interfere', async () => {
    const s1 = KV.create({ namespace: 'ns1' });
    const s2 = KV.create({ namespace: 'ns2' });
    await s1.set('k', 'from-s1');
    await s2.set('k', 'from-s2');
    expect(await s1.get('k')).toBe('from-s1');
    expect(await s2.get('k')).toBe('from-s2');
  });

  test('session backend works', async () => {
    const store = KV.create({ backend: 'session' });
    await store.set('k', 'sess');
    expect(await store.get('k')).toBe('sess');
    expect(sessionStorage.getItem('bm:k')).toBeTruthy();
  });

  test('onChange fires on set/remove/clear', async () => {
    const store = KV.create();
    const events = [];
    const unsub = store.onChange(e => events.push(e));

    await store.set('k', 'v');
    await store.remove('k');
    await store.clear();

    expect(events).toEqual([
      { type: 'set', key: 'k', value: 'v' },
      { type: 'remove', key: 'k' },
      { type: 'clear' }
    ]);
    unsub();
  });

  test('ttl() returns remaining seconds', async () => {
    const store = KV.create();
    const realNow = Date.now;
    let now = 1000000;
    Date.now = jest.fn(() => now);
    await store.set('k', 'v', 10);
    const remaining = await store.ttl('k');
    expect(remaining).toBe(10);
    expect(await store.ttl('missing')).toBeNull();
    Date.now = realNow;
  });

  test('size() returns approximate byte count', async () => {
    const store = KV.create();
    await store.set('hello', 'world');
    const s = await store.size();
    expect(s).toBeGreaterThan(0);
  });
});
