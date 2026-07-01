/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

function createMockLocalStorage() {
  let store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
}

const DEFAULT_LOCAL_STORAGE = global.localStorage;

function loadSync(storage) {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Sync.js');
  const targetStorage = storage || DEFAULT_LOCAL_STORAGE;

  Object.defineProperty(global, 'localStorage', { configurable: true, writable: true, value: targetStorage });
  if (global.window) {
    Object.defineProperty(global.window, 'localStorage', { configurable: true, writable: true, value: targetStorage });
  }

  jest.resetModules();

  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Sync', () => {
  test('diff() produces add/remove/replace ops for nested objects and arrays', () => {
    const Sync = loadSync();
    const source = {
      name: 'Alice',
      meta: { active: true },
      tags: ['a', 'b', 'c'],
      stale: 'old'
    };
    const target = {
      name: 'Bob',
      meta: { active: true, level: 2 },
      tags: ['a', 'z'],
      fresh: 'new'
    };

    const ops = Sync.diff(source, target);

    expect(ops).toEqual(expect.arrayContaining([
      { op: 'replace', path: ['name'], value: 'Bob' },
      { op: 'add', path: ['meta', 'level'], value: 2 },
      { op: 'replace', path: ['tags', 1], value: 'z' },
      { op: 'remove', path: ['tags', 2] },
      { op: 'remove', path: ['stale'] },
      { op: 'add', path: ['fresh'], value: 'new' }
    ]));
    expect(ops).toHaveLength(6);
  });

  test('patch() applies ops immutably', () => {
    const Sync = loadSync();
    const source = { profile: { name: 'Alice' }, list: [1, 2] };
    const target = { profile: { name: 'Bob', age: 30 }, list: [1, 3, 4] };
    const ops = Sync.diff(source, target);

    const patched = Sync.patch(source, ops);

    expect(patched).toEqual(target);
    expect(source).toEqual({ profile: { name: 'Alice' }, list: [1, 2] });
  });

  test('merge() with field-level strategy performs three-way merge', () => {
    const Sync = loadSync();
    const base = { name: 'Alice', prefs: { theme: 'light', lang: 'en' }, meta: { count: 1 } };
    const local = { name: 'Alice', prefs: { theme: 'dark', lang: 'en' }, meta: { count: 2 } };
    const remote = { name: 'Alicia', prefs: { theme: 'light', lang: 'fr' }, meta: { count: 1 } };

    const merged = Sync.merge(local, remote, base, 'field-level');

    expect(merged.result).toEqual({
      name: 'Alicia',
      prefs: { theme: 'dark', lang: 'fr' },
      meta: { count: 2 }
    });
    expect(merged.conflicts).toEqual([]);
  });

  test('conflict() and merge() expose conflict descriptors', () => {
    const Sync = loadSync();
    const direct = Sync.conflict(['title'], 'local', 'remote', 'base');
    const merged = Sync.merge({ title: 'Local' }, { title: 'Remote' }, { title: 'Base' }, 'field-level');

    expect(direct).toEqual({
      type: 'conflict',
      id: JSON.stringify(['title']),
      field: 'title',
      path: ['title'],
      local: 'local',
      remote: 'remote',
      base: 'base'
    });
    expect(merged.result).toEqual({ title: 'Local' });
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.conflicts[0]).toEqual(expect.objectContaining({
      type: 'conflict',
      path: ['title'],
      local: 'Local',
      remote: 'Remote',
      base: 'Base'
    }));
  });

  test('queue() supports push, flush, and localStorage persistence', async () => {
    const storage = createMockLocalStorage();
    const SyncA = loadSync(storage);
    const queueA = SyncA.queue({ storage: 'localStorage', key: 'sync-test' });
    const sent = [];
    const flushed = [];

    queueA.onFlush((op) => flushed.push(op.id));
    queueA.push({ id: 1, action: 'save' });
    queueA.push({ id: 2, action: 'publish' });

    const SyncB = loadSync(storage);
    const queueB = SyncB.queue({ storage: 'localStorage', key: 'sync-test' });
    expect(queueB.size()).toBe(2);
    expect(queueB.peek()).toEqual({ id: 1, action: 'save' });

    await queueB.flush((op) => {
      sent.push(op.id);
      return Promise.resolve({ ok: true });
    });

    expect(sent).toEqual([1, 2]);
    expect(flushed).toEqual([]);
    expect(queueB.size()).toBe(0);
    expect(storage.getItem('sync-test')).toBe('[]');
  });

  test('queue() flush callbacks fire on the active queue instance', async () => {
    const Sync = loadSync();
    const queue = Sync.queue({ storage: 'memory' });
    const flushed = [];

    queue.onFlush((op) => flushed.push(op.id));
    queue.push({ id: 'a' });
    queue.push({ id: 'b' });
    await queue.flush(() => Promise.resolve(true));

    expect(flushed).toEqual(['a', 'b']);
  });

  test('echo() reconciles confirmed, rejected, and pending ops', () => {
    const Sync = loadSync();
    const result = Sync.echo(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      [{ id: 1, status: 'confirmed' }, { id: 2, status: 'rejected' }]
    );

    expect(result.confirmed).toEqual([{ id: 1 }]);
    expect(result.rejected).toEqual([{ id: 2 }]);
    expect(result.pending).toEqual([{ id: 3 }]);
  });

  test('clock() compares vector clocks correctly', () => {
    const Sync = loadSync();
    const a = Sync.clock();
    const b = Sync.clock();
    const c = Sync.clock();

    a.increment('nodeA');
    b.increment('nodeA').increment('nodeA');
    c.increment('nodeB');

    expect(a.compare(b.toJSON())).toBe('before');
    expect(b.compare(a.toJSON())).toBe('after');
    expect(a.compare(c.toJSON())).toBe('concurrent');
  });

  test('crdt(counter) increments and merges', () => {
    const Sync = loadSync();
    const left = Sync.crdt('counter', { nodeId: 'left' });
    const right = Sync.crdt('counter', { nodeId: 'right' });

    left.increment();
    left.increment();
    right.increment();
    left.merge(right.toJSON());

    expect(left.value()).toBe(3);
  });

  test('crdt(set) supports add/remove/merge', () => {
    const Sync = loadSync();
    const first = Sync.crdt('set');
    const second = Sync.crdt('set');

    first.add('alpha').add('beta');
    second.fromJSON(first.toJSON());
    second.remove('alpha');
    first.add('gamma');
    first.merge(second.toJSON());

    expect(first.value().sort()).toEqual(['beta', 'gamma']);
  });

  test('crdt(register) resolves to the latest write', () => {
    const Sync = loadSync();
    const local = Sync.crdt('register', { nodeId: 'a' });
    const remote = Sync.crdt('register', { nodeId: 'b' });

    local.set('draft', 1, 'a');
    remote.set('published', 2, 'b');
    local.merge(remote.toJSON());

    expect(local.value()).toBe('published');
  });

  test('version() tracks history and supports rollback', () => {
    const Sync = loadSync();
    const versioned = Sync.version({ count: 1 });

    versioned.set({ count: 2 });
    versioned.set({ count: 3 });

    expect(versioned.getVersion()).toBe(2);
    expect(versioned.getHistory().map((entry) => entry.version)).toEqual([0, 1, 2]);
    expect(versioned.rollback(1)).toEqual({ count: 2 });
    expect(versioned.get()).toEqual({ count: 2 });
    expect(versioned.getVersion()).toBe(1);
  });
});

describe('branch coverage - Sync', () => {
  test('diff, patch, merge, resolve, and batch cover nested and conflicting shapes', () => {
    const Sync = loadSync();
    const before = {
      items: [{ id: 1, meta: { order: 1 } }, { id: 2, meta: { order: 2 } }],
      nested: { keep: true, drop: 'x', deep: { count: 1 } }
    };
    const after = {
      items: [{ id: 2, meta: { order: 1 } }, { id: 1, meta: { order: 2 } }, { id: 3, meta: { order: 3 } }],
      nested: { keep: true, deep: { count: 2, flag: true } }
    };

    expect(Sync.diff({}, {})).toEqual([]);
    expect(Sync.diff([], [])).toEqual([]);

    const ops = Sync.diff(before, after);
    expect(ops).toEqual(expect.arrayContaining([
      { op: 'remove', path: ['nested', 'drop'] },
      { op: 'replace', path: ['nested', 'deep', 'count'], value: 2 },
      { op: 'add', path: ['nested', 'deep', 'flag'], value: true },
      { op: 'add', path: ['items', 2], value: { id: 3, meta: { order: 3 } } }
    ]));
    expect(Sync.patch(before, ops)).toEqual(after);
    expect(Sync.patch(before, null)).toEqual(before);
    expect(() => Sync.patch(before, [{ op: 'move', path: [] }])).toThrow('Invalid operation');

    const merged = Sync.merge(
      { title: 'Local', tags: ['l1'], meta: { keep: 'local' } },
      { title: 'Remote', tags: ['r1'], meta: { keep: 'remote' } },
      { title: 'Base', tags: [], meta: { keep: 'base' } },
      'field-level'
    );
    expect(merged.conflicts).toHaveLength(3);
    expect(Sync.resolve(merged.conflicts, {
      [JSON.stringify(['title'])]: { use: 'remote' },
      tags: { use: 'value', value: ['l1', 'r1'] },
      keep: { use: 'base' }
    })).toEqual({
      title: 'Remote',
      tags: ['l1', 'r1'],
      meta: { keep: 'base' }
    });

    expect(Sync.merge({ status: 'draft' }, { status: 'published' }, { status: 'base' }, 'last-write').result)
      .toEqual({ status: 'published' });
    expect(Sync.merge('Left', 'Right', 'Base', (field, local, remote) => [field, local, remote].join(':')).result)
      .toBe(':Left:Right');

    const batched = Sync.batch([
      { op: 'replace', path: ['items', 0, 'id'], value: 9 },
      { op: 'remove', path: ['nested', 'keep'] }
    ]);
    expect(batched.size()).toBe(2);
    expect(batched.apply(before)).toEqual({
      items: [{ id: 9, meta: { order: 1 } }, { id: 2, meta: { order: 2 } }],
      nested: { drop: 'x', deep: { count: 1 } }
    });
  });

  test('queue, replay, and echo cover empty, retry, and rejection paths', async () => {
    const Sync = loadSync();
    const queue = Sync.queue({ storage: 'memory', maxSize: 2, retry: true, maxRetries: 1 });
    const errors = [];
    const offError = queue.onError((err, op, retries) => errors.push({ message: err.message, op, retries }));

    queue.push({ id: 1, type: 'drop-me' });
    queue.push({ id: 2, type: 'retry-me' });
    queue.push({ id: 3, type: 'ok' });

    let attempts = 0;
    await expect(queue.flush((op) => {
      attempts += 1;
      if (attempts === 1) return Promise.reject(new Error('transient'));
      return Promise.resolve(op.id);
    })).resolves.toEqual([{ id: 2, type: 'retry-me' }, { id: 3, type: 'ok' }]);

    offError();
    expect(errors).toEqual([
      { message: 'transient', op: { id: 2, type: 'retry-me' }, retries: 1 }
    ]);
    expect(await Sync.queue({ storage: 'memory' }).flush()).toEqual([]);

    expect(await Sync.replay()).toEqual([]);
    expect(await Sync.replay([{ id: 'a' }, { id: 'b' }], (op, index) => ({ index, id: op.id })))
      .toEqual([{ index: 0, id: 'a' }, { index: 1, id: 'b' }]);

    expect(Sync.echo({ id: 'solo' }, [{ op: { id: 'solo' }, state: 'error' }])).toEqual({
      confirmed: [],
      rejected: [{ id: 'solo' }],
      pending: []
    });
    expect(Sync.echo([{ value: 'x' }], null)).toEqual({
      confirmed: [],
      rejected: [],
      pending: [{ value: 'x' }]
    });
  });

  test('crdt, version, and subscribe cover fallback branches and invalid input', () => {
    const Sync = loadSync();

    const counter = Sync.crdt('counter').fromJSON({ counts: { a: 2 } }).merge({ counts: { a: 1, b: 3 } });
    expect(counter.value()).toBe(5);

    const set = Sync.crdt('set');
    set.remove('ghost');
    set.add({ id: 1 }, 't1');
    expect(set.has('ghost')).toBe(false);
    expect(set.value()).toEqual([{ id: 1 }]);

    const register = Sync.crdt('register', { nodeId: 'b' });
    register.set('local', 5, 'b');
    register.merge({ value: 'remote', timestamp: 5, nodeId: 'a' });
    expect(register.value()).toBe('local');
    expect(() => Sync.crdt('unknown')).toThrow('Unknown CRDT type');

    const versioned = Sync.version({ count: 0 });
    versioned.set({ count: 1 }).set({ count: 2 });
    expect(versioned.rollback(99)).toBeNull();
    versioned.rollback(1);
    versioned.set({ count: 10 });
    expect(versioned.getHistory().map((entry) => entry.version)).toEqual([0, 1, 3]);

    const onEvents = [];
    const viaSubscribe = { subscribe: jest.fn((cb) => { cb('subscribe'); return () => onEvents.push('off:subscribe'); }) };
    const offSubscribe = Sync.subscribe(viaSubscribe, (value) => onEvents.push(value));
    offSubscribe();

    const viaOn = {
      on: jest.fn((event, cb) => {
        viaOn._event = event;
        viaOn._cb = cb;
      }),
      off: jest.fn()
    };
    const offOn = Sync.subscribe(viaOn, (value) => onEvents.push(value));
    viaOn._cb('remote');
    offOn();

    const fallback = {};
    const offFallback = Sync.subscribe(fallback, (value) => onEvents.push(value.kind));
    fallback.notifyRemote({ kind: 'fallback' });
    offFallback();
    fallback.notifyRemote({ kind: 'ignored' });

    expect(typeof Sync.subscribe(null, null)).toBe('function');
    expect(viaSubscribe.subscribe).toHaveBeenCalledTimes(1);
    expect(viaOn.on).toHaveBeenCalledWith('remote', expect.any(Function));
    expect(viaOn.off).toHaveBeenCalledWith('remote', expect.any(Function));
    expect(onEvents).toEqual(['subscribe', 'off:subscribe', 'remote', 'fallback']);
  });
});
