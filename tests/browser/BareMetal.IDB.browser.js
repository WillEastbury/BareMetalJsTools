BareMetal.TestRunner.installGlobals();

describe('BareMetal.IDB', function () {
  var IDB = BareMetal.IDB;
  var names;

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

  function makeName(label) {
    var name = 'bm-idb-' + label + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    names.push(name);
    return name;
  }

  beforeEach(function () { names = []; });

  afterEach(async function () {
    var i;
    for (i = 0; i < names.length; i++) {
      try { await IDB.deleteDatabase(names[i]); } catch (e) {}
    }
  });

  test('isSupported', function () {
    expect(IDB.isSupported()).toBe(true);
  });

  test('open/create database with stores', async function () {
    var db = await IDB.open(makeName('open'), schema());
    expect(db.stores().sort()).toEqual(['cache', 'posts', 'users']);
    db.close();
  });

  test('put/get/delete/clear operations', async function () {
    var db = await IDB.open(makeName('crud'), schema());
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

  test('putAll/getAll and export/import', async function () {
    var db = await IDB.open(makeName('bulk'), schema());
    await db.putAll('users', [
      { id: 'u1', email: 'a@b.com', age: 24, role: 'admin' },
      { id: 'u2', email: 'b@b.com', age: 31, role: 'user' },
      { id: 'u3', email: 'c@b.com', age: 27, role: 'admin' }
    ]);
    expect((await db.getAll('users', { limit: 2 })).length).toBe(2);
    var exported = await db.export('users');
    await db.import('users', exported.slice(0, 2));
    expect(await db.count('users')).toBe(2);
    expect((await db.getAll('users')).map(function (u) { return u.id; }).sort()).toEqual(['u1', 'u2']);
    db.close();
  });

  test('index queries and range queries work', async function () {
    var db = await IDB.open(makeName('query'), schema());
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
    expect((await db.getAllBy('posts', 'authorId', 'u1')).map(function (p) { return p.title; })).toEqual(['One', 'Two']);
    expect((await db.range('users', 'age', { gte: 18, lt: 30 })).map(function (u) { return u.id; })).toEqual(['u1', 'u2']);
    expect((await db.range('posts', 'date', { lte: '2024-12-31', limit: 2, direction: 'prev' })).map(function (p) { return p.title; })).toEqual(['Three', 'Two']);
    db.close();
  });

  test('kv mode set/get/delete/has/keys works', async function () {
    var kv = await IDB.kv(makeName('kv'));
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

  test('deleteDatabase clears stores', async function () {
    var name = makeName('delete-db');
    var db = await IDB.open(name, schema());
    await db.put('users', { id: 'u1', email: 'a@b.com', age: 30 });
    db.close();
    await IDB.deleteDatabase(name);
    var reopened = await IDB.open(name, schema());
    expect(await reopened.count('users')).toBe(0);
    reopened.close();
  });
});
