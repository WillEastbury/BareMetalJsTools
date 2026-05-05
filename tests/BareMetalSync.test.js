/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

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

function loadSync(storage) {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Sync.js'), 'utf8');
  const fn = new Function('BareMetal', 'window', 'localStorage', 'module', code + '\nreturn BareMetal.Sync;');
  return fn({}, global.window, storage || global.localStorage, { exports: {} });
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
