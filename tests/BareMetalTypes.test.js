/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadTypes() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Types.js'), 'utf8');
  const win = {};
  const module = { exports: null };
  const fn = new Function('module', 'exports', 'window', 'globalThis', code + '\nreturn module.exports || (window.BareMetal && window.BareMetal.Types);');
  return fn(module, {}, win, win);
}

describe('BareMetal.Types', () => {
  let Types;

  beforeEach(() => {
    Types = loadTypes();

    Types.define('Person', {
      fields: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        active: { type: 'boolean', default: true }
      },
      validate: function (value) {
        if (value.name === '') return 'Name cannot be empty.';
      }
    });

    Types.define('HasId', {
      fields: {
        id: { type: 'number', required: true }
      }
    });

    Types.define('HasName', {
      fields: {
        name: { type: 'string', required: true }
      }
    });

    Types.define('Entity', {
      fields: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true }
      },
      ancestors: ['HasId', 'HasName'],
      methods: {
        save: function () {}
      }
    });

    Types.define('Session', {
      fields: {
        user: { type: 'string', required: true },
        expires: { type: 'date', required: true }
      },
      serialize: function (value) {
        return { user: value.user, expires: value.expires.getTime() };
      },
      deserialize: function (data) {
        return { user: data.user, expires: new Date(data.expires) };
      }
    });
  });

  test('define and check validate custom runtime types', () => {
    const valid = Types.check({ id: 1, name: 'Alice', active: true }, 'Person');
    const invalid = Types.check({ id: 'x' }, 'Person');

    expect(valid.ok).toBe(true);
    expect(valid.errors).toEqual([]);
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.map((item) => item.path)).toEqual(expect.arrayContaining(['id', 'name']));
  });

  test('is, assert, and cast work for primitive and custom types', () => {
    expect(Types.is('hello', 'string')).toBe(true);
    expect(Types.is('hello', 'number')).toBe(false);
    expect(() => Types.assert('hello', 'number')).toThrow(TypeError);

    expect(Types.cast('42', 'number')).toBe(42);
    expect(Types.cast({ id: '7', name: 123 }, 'Person')).toEqual({ id: 7, name: '123', active: true });
  });

  test('of detects built-in values and registered custom types', () => {
    expect(Types.of('x')).toBe('string');
    expect(Types.of(3)).toBe('number');
    expect(Types.of(true)).toBe('boolean');
    expect(Types.of([1, 2])).toBe('array');
    expect(Types.of({ plain: true })).toBe('object');
    expect(Types.of(null)).toBe('null');
    expect(Types.of(undefined)).toBe('undefined');
    expect(Types.of(new Date('2024-01-01T00:00:00Z'))).toBe('date');
    expect(Types.of(/x/gi)).toBe('regexp');
    expect(Types.of(function () {})).toBe('function');
    expect(Types.of(Symbol('s'))).toBe('symbol');
    expect(Types.of(BigInt(5))).toBe('bigint');
    expect(Types.of(new Map())).toBe('map');
    expect(Types.of(new Set())).toBe('set');
    expect(Types.of(Promise.resolve(1))).toBe('promise');
    expect(Types.of({ id: 1, name: 'Alice', active: false })).toBe('Person');
  });

  test('registry supports register, get, has, list, and remove', () => {
    Types.registry.register('Score', {
      fields: {
        value: { type: 'number', required: true }
      }
    });

    expect(Types.registry.has('Score')).toBe(true);
    expect(Types.registry.get('Score').name).toBe('Score');
    expect(Types.registry.list()).toEqual(expect.arrayContaining(['string', 'number', 'Person', 'Score']));
    expect(Types.registry.remove('Score')).toBe(true);
    expect(Types.registry.has('Score')).toBe(false);
  });

  test('contract validates input arguments and return values', () => {
    const add = Types.contract(['number', 'number'], 'number')(function (a, b) {
      return a + b;
    });
    const broken = Types.contract(['number'], 'number')(function () {
      return 'nope';
    });

    expect(add(4, 5)).toBe(9);
    expect(() => add(4, 'bad')).toThrow(TypeError);
    expect(() => broken(4)).toThrow(TypeError);
  });

  test('guard creates composable predicate functions', () => {
    const isPerson = Types.guard('Person');
    const values = [
      { id: 1, name: 'Alice' },
      { id: '2', name: 'Bob' },
      null
    ];

    expect(values.filter(isPerson)).toEqual([{ id: 1, name: 'Alice' }]);
  });

  test('union, intersection, literal, tuple, and record descriptors work', () => {
    expect(Types.is('a', Types.union('string', 'number'))).toBe(true);
    expect(Types.is(false, Types.union('string', 'number'))).toBe(false);

    expect(Types.is({ id: 1, name: 'Alice' }, Types.intersection('HasId', 'HasName'))).toBe(true);
    expect(Types.is({ id: 1 }, Types.intersection('HasId', 'HasName'))).toBe(false);

    expect(Types.is('ok', Types.literal('ok'))).toBe(true);
    expect(Types.is('no', Types.literal('ok'))).toBe(false);

    expect(Types.is(['x', 3, true], Types.tuple('string', 'number', 'boolean'))).toBe(true);
    expect(Types.is(['x', '3', true], Types.tuple('string', 'number', 'boolean'))).toBe(false);

    expect(Types.is({ a: 1, b: 2 }, Types.record('string', 'number'))).toBe(true);
    expect(Types.is({ a: 1, b: '2' }, Types.record('string', 'number'))).toBe(false);
  });

  test('nullable and optional descriptors accept null and undefined appropriately', () => {
    expect(Types.is(null, Types.nullable('string'))).toBe(true);
    expect(Types.is('value', Types.nullable('string'))).toBe(true);
    expect(Types.is(undefined, Types.nullable('string'))).toBe(false);

    expect(Types.is(undefined, Types.optional('number'))).toBe(true);
    expect(Types.is(10, Types.optional('number'))).toBe(true);
    expect(Types.is(null, Types.optional('number'))).toBe(false);
  });

  test('reflect returns the expected type shape', () => {
    expect(Types.reflect('Entity')).toEqual({
      name: 'Entity',
      fields: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true }
      },
      methods: ['save'],
      ancestors: ['HasId', 'HasName'],
      serializable: true
    });
  });

  test('serialize and deserialize support custom round-trips', () => {
    const value = {
      user: 'alice',
      expires: new Date('2024-03-01T10:00:00Z')
    };

    const serialized = Types.serialize(value, 'Session');
    const hydrated = Types.deserialize(serialized, 'Session');

    expect(serialized).toEqual({ user: 'alice', expires: value.expires.getTime() });
    expect(hydrated.expires).toBeInstanceOf(Date);
    expect(Types.equals(hydrated, value, 'Session')).toBe(true);
  });

  test('equals performs deep equality with nested typed values', () => {
    const a = {
      user: { id: 1, name: 'Alice' },
      tags: ['x', 'y'],
      meta: { created: new Date('2024-01-01T00:00:00Z') }
    };
    const b = {
      user: { id: 1, name: 'Alice' },
      tags: ['x', 'y'],
      meta: { created: new Date('2024-01-01T00:00:00Z') }
    };
    const c = {
      user: { id: 1, name: 'Alice' },
      tags: ['x', 'z'],
      meta: { created: new Date('2024-01-01T00:00:00Z') }
    };

    expect(Types.equals(a, b)).toBe(true);
    expect(Types.equals(a, c)).toBe(false);
  });

  test('clone creates independent deep copies', () => {
    const original = {
      person: { id: 1, name: 'Alice', active: true },
      tags: ['one', 'two'],
      when: new Date('2024-04-02T00:00:00Z')
    };
    const copied = Types.clone(original);

    copied.person.name = 'Bob';
    copied.tags.push('three');
    copied.when.setUTCFullYear(2030);

    expect(original.person.name).toBe('Alice');
    expect(original.tags).toEqual(['one', 'two']);
    expect(original.when.getUTCFullYear()).toBe(2024);
  });
});
