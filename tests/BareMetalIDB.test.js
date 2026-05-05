/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
require('fake-indexeddb/auto');
const path = require('path');
const fs = require('fs');

function loadIDB() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.IDB.js'), 'utf8');
  const fn = new Function('BareMetal', code + '\nreturn BareMetal.IDB;');
  return fn({});
}

function schema() {
  return {
    version: 1,
    stores: {
      users: {
        keyPath: 'id',
        indexes: [
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'age', keyPath: 'age' }
        ]
      },
      posts: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'authorId', keyPath: 'authorId' },
          { name: 'date', keyPath: 'createdAt' }
        ]
      },
      cache: { keyPath: 'key' }
    }
  };
}

describe('BareMetal.IDB', () => {
  let IDB;
  let names;

  function makeName(label) {
    const name = 'bm-idb-' + label + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    names.push(name);
    return name;
  }

  beforeEach(() => {
    IDB = loadIDB();
    names = [];
  });

  afterEach(async () => {
    for (const name of names) {
      try { await IDB.deleteDatabase(name); } catch (e) {}
    }
  });

  test('open/create database with stores', async () => {
    const db = await IDB.open(makeName('open'), schema());
    expect(db.stores().sort()).toEqual(['cache', 'posts', 'users']);
    db.close();
  });

  test('put/get/delete/clear operations', async () => {
    const db = await IDB.open(makeName('crud'), schema());
    await db.put('users', { id: 'u1', email: 'a@b.com', age: 30, name: 'Alice' });
    expect(await db.get('users', 'u1')).toEqual({ id: 'u1', email: 'a@b.com', age: 30, name: 'Alice' });
    await db.delete('users', 'u1');
    expect(await db.get('users', 'u1')).toBeNull();
    await db.putAll('users', [
      { id: 'u2', email: 'b@b.com', age: 21, name: 'Bob' },
      { id: 'u3', email: 'c@b.com', age: 41, name: 'Cara' }
    ]);
    expect(await db.count('users')).toBe(2);
    await db.clear('users');
    expect(await db.count('users')).toBe(0);
    db.close();
  });

  test('putAll/getAll and export/import', async () => {
    const db = await IDB.open(makeName('bulk'), schema());
    const users = [
      { id: 'u1', email: 'a@b.com', age: 24, role: 'admin' },
      { id: 'u2', email: 'b@b.com', age: 31, role: 'user' },
      { id: 'u3', email: 'c@b.com', age: 27, role: 'admin' }
    ];
    await db.putAll('users', users);
    expect((await db.getAll('users', { limit: 2 })).length).toBe(2);
    const exported = await db.export('users');
    await db.import('users', exported.slice(0, 2));
    expect(await db.count('users')).toBe(2);
    expect((await db.getAll('users')).map(u => u.id).sort()).toEqual(['u1', 'u2']);
    db.close();
  });

  test('index queries and range queries work', async () => {
    const db = await IDB.open(makeName('query'), schema());
    await db.putAll('users', [
      { id: 'u1', email: 'a@b.com', age: 22, name: 'Alice' },
      { id: 'u2', email: 'b@b.com', age: 29, name: 'Bob' },
      { id: 'u3', email: 'c@b.com', age: 35, name: 'Cara' }
    ]);
    await db.putAll('posts', [
      { id: 1, authorId: 'u1', createdAt: '2024-01-10', title: 'One' },
      { id: 2, authorId: 'u1', createdAt: '2024-07-10', title: 'Two' },
      { id: 3, authorId: 'u2', createdAt: '2024-12-05', title: 'Three' }
    ]);

    expect((await db.getBy('users', 'email', 'a@b.com')).name).toBe('Alice');
    expect((await db.getAllBy('posts', 'authorId', 'u1')).map(p => p.title)).toEqual(['One', 'Two']);
    expect((await db.range('users', 'age', { gte: 18, lt: 30 })).map(u => u.id)).toEqual(['u1', 'u2']);
    expect((await db.range('posts', 'date', { lte: '2024-12-31', limit: 2, direction: 'prev' })).map(p => p.title)).toEqual(['Three', 'Two']);
    db.close();
  });

  test('each, eachBy and filter iterate efficiently', async () => {
    const db = await IDB.open(makeName('iter'), schema());
    await db.putAll('users', [
      { id: 'u1', email: 'a@b.com', age: 22, role: 'admin' },
      { id: 'u2', email: 'b@b.com', age: 29, role: 'user' },
      { id: 'u3', email: 'c@b.com', age: 35, role: 'admin' }
    ]);
    await db.putAll('posts', [
      { id: 1, authorId: 'u1', createdAt: '2024-01-10', title: 'One' },
      { id: 2, authorId: 'u1', createdAt: '2024-07-10', title: 'Two' },
      { id: 3, authorId: 'u2', createdAt: '2024-12-05', title: 'Three' }
    ]);

    const seen = [];
    await db.each('users', function(record) {
      seen.push(record.id);
      if (seen.length === 2) return false;
    });
    expect(seen).toEqual(['u1', 'u2']);

    const ordered = [];
    await db.eachBy('posts', 'date', { direction: 'prev', limit: 2 }, function(record) {
      ordered.push(record.title);
    });
    expect(ordered).toEqual(['Three', 'Two']);

    const admins = await db.filter('users', function(record) {
      return record.role === 'admin';
    });
    expect(admins.map(u => u.id)).toEqual(['u1', 'u3']);
    db.close();
  });

  test('transaction and batch operations work', async () => {
    const db = await IDB.open(makeName('tx'), schema());
    await db.transaction(['users', 'posts'], 'readwrite', function(tx) {
      tx.put('users', { id: 'u9', email: 'z@b.com', age: 40, name: 'Zed' });
      tx.put('posts', { id: 9, authorId: 'u9', createdAt: '2024-03-15', title: 'Tx' });
    });
    expect((await db.get('users', 'u9')).name).toBe('Zed');
    expect((await db.get('posts', 9)).title).toBe('Tx');

    await db.batch('users', 'put', [
      { id: 'u1', email: 'a@b.com', age: 20 },
      { id: 'u2', email: 'b@b.com', age: 21 }
    ]);
    expect(await db.count('users')).toBe(3);
    await db.batch('users', 'delete', ['u1', 'u2']);
    expect(await db.count('users')).toBe(1);
    db.close();
  });

  test('kv mode set/get/delete/has/keys works', async () => {
    const kv = await IDB.kv(makeName('kv'));
    await kv.set('theme', 'dark');
    expect(await kv.get('theme')).toBe('dark');
    expect(await kv.has('theme')).toBe(true);
    expect(await kv.keys()).toEqual(['theme']);
    await kv.delete('theme');
    expect(await kv.has('theme')).toBe(false);
    await kv.set('one', 1);
    await kv.clear();
    expect(await kv.keys()).toEqual([]);
    kv.close();
  });

  test('deleteDatabase, databases and isSupported utilities work', async () => {
    expect(IDB.isSupported()).toBe(true);
    expect(Array.isArray(await IDB.databases())).toBe(true);
    const name = makeName('delete-db');
    const db = await IDB.open(name, schema());
    await db.put('users', { id: 'u1', email: 'a@b.com', age: 30 });
    db.close();
    await IDB.deleteDatabase(name);
    const reopened = await IDB.open(name, schema());
    expect(await reopened.count('users')).toBe(0);
    reopened.close();
  });
});
