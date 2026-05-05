/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadSchema() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Schema.js'), 'utf8');
  const win = {};
  const module = { exports: null };
  const fn = new Function('module', 'exports', 'window', 'globalThis', code + '\nreturn module.exports || (window.BareMetal && window.BareMetal.Schema);');
  return fn(module, {}, win, win);
}

describe('BareMetal.Schema', () => {
  let Schema;

  beforeEach(() => {
    Schema = loadSchema();
  });

  test('string validators enforce min/max/pattern and transforms', () => {
    const schema = Schema.string({ min: 2, max: 5, pattern: '^[a-z]+$', trim: true, lowercase: true });

    expect(Schema.parse(schema, '  ABC  ')).toEqual({ ok: true, value: 'abc' });

    const invalid = Schema.parse(schema, ' 1 ');
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.map((item) => item.code)).toEqual(expect.arrayContaining(['min', 'pattern']));
  });

  test('number range and boolean coercion work in parse but not validate', () => {
    const schema = Schema.object({
      age: Schema.number({ min: 18, max: 65, integer: true }),
      active: Schema.boolean({ coerce: true })
    }, { strict: true });

    expect(Schema.validate(schema, { age: '21', active: '1' })).toEqual({
      valid: false,
      errors: [
        { path: 'age', code: 'type', message: 'Expected number.' },
        { path: 'active', code: 'type', message: 'Expected boolean.' }
      ]
    });

    expect(Schema.parse(schema, { age: '21', active: '1' })).toEqual({
      ok: true,
      value: { age: 21, active: true }
    });
  });

  test('nested object validation reports paths and strict errors', () => {
    const schema = Schema.object({
      user: Schema.object({
        name: Schema.string({ min: 2 }),
        tags: Schema.array(Schema.string({ min: 2 }), { min: 1 })
      }, { strict: true })
    }, { strict: true });

    const result = Schema.parse(schema, {
      user: {
        name: 'A',
        tags: ['ok', 'x'],
        extra: true
      }
    });

    expect(result.ok).toBe(false);
    expect(result.errors.map((item) => item.path).sort()).toEqual(['user.extra', 'user.name', 'user.tags[1]']);
  });

  test('array validation supports uniqueness', () => {
    const schema = Schema.array(Schema.number(), { min: 2, unique: true });
    const result = Schema.parse(schema, ['1', '1']);

    expect(result.ok).toBe(false);
    expect(result.errors.map((item) => item.code)).toContain('unique');
  });

  test('parse, transform, coerce, and defaults handle conversions', () => {
    const schema = Schema.object({
      name: Schema.string({ trim: true, uppercase: true }),
      count: Schema.number({ default: 2 }),
      active: Schema.boolean({ coerce: true }),
      nested: Schema.object({ enabled: Schema.boolean({ default: true }) })
    }, { strict: true });

    expect(Schema.transform(schema, { name: ' hi ', active: 'true' })).toEqual({
      name: 'HI',
      count: 2,
      active: true,
      nested: { enabled: true }
    });
    expect(Schema.coerce(Schema.number(), '42')).toBe(42);
    expect(Schema.defaults(schema)).toEqual({ count: 2, nested: { enabled: true } });
  });

  test('extend, pick, omit, and partial derive object schemas', () => {
    const base = Schema.object({
      id: Schema.number(),
      name: Schema.string(),
      admin: Schema.boolean({ default: false })
    }, { strict: true });
    const extended = Schema.extend(base, { email: Schema.optional(Schema.string()) });
    const picked = Schema.pick(extended, ['id', 'email']);
    const omitted = Schema.omit(extended, ['admin']);
    const partial = Schema.partial(base);

    expect(Schema.parse(extended, { id: '1', name: 'Alice' })).toEqual({
      ok: true,
      value: { id: 1, name: 'Alice', admin: false }
    });
    expect(Schema.parse(picked, { id: '2', email: 'a@example.com' })).toEqual({
      ok: true,
      value: { id: 2, email: 'a@example.com' }
    });
    expect(Schema.parse(omitted, { id: 1, name: 'Alice', admin: true }).errors[0].path).toBe('admin');
    expect(Schema.validate(partial, {})).toEqual({ valid: true, errors: [] });
  });

  test('version migrations move data up and down', () => {
    const schema = Schema.version(
      Schema.object({
        name: Schema.string(),
        active: Schema.boolean({ default: true })
      }, { strict: true }),
      2,
      [{
        from: 1,
        to: 2,
        up: function (data) {
          data.active = data.active !== false;
          return data;
        },
        down: function (data) {
          delete data.active;
          return data;
        }
      }]
    );

    expect(schema.migrate({ name: 'Alice' }, 1, 2)).toEqual({ name: 'Alice', active: true });
    expect(schema.migrate({ name: 'Alice', active: true }, 2, 1)).toEqual({ name: 'Alice' });
    expect(Schema.parse(schema, { name: 'Alice' })).toEqual({
      ok: true,
      value: { name: 'Alice', active: true }
    });
  });

  test('oneOf unions use first matching schema', () => {
    const schema = Schema.oneOf([
      Schema.number({ min: 10 }),
      Schema.string({ enum: ['small', 'large'] })
    ]);

    expect(Schema.parse(schema, '12')).toEqual({ ok: true, value: 12 });
    expect(Schema.parse(schema, 'small')).toEqual({ ok: true, value: 'small' });
    expect(Schema.parse(schema, '3')).toEqual({
      ok: false,
      errors: [{ path: '', code: 'oneOf', message: 'Value must match at least one schema.' }]
    });
  });

  test('custom validators return custom errors', () => {
    const even = Schema.custom('even', function (value) {
      return typeof value === 'number' && value % 2 === 0 ? true : 'Must be even.';
    });

    expect(Schema.parse(even, 4)).toEqual({ ok: true, value: 4 });
    expect(Schema.parse(even, 3)).toEqual({
      ok: false,
      errors: [{ path: '', code: 'custom', message: 'Must be even.' }]
    });
  });

  test('date schemas coerce and validate boundaries', () => {
    const schema = Schema.date({
      min: new Date('2024-01-01T00:00:00Z'),
      max: new Date('2024-12-31T00:00:00Z'),
      format: 'iso'
    });

    const parsed = Schema.parse(schema, '2024-05-01T00:00:00Z');
    expect(parsed.ok).toBe(true);
    expect(parsed.value).toBeInstanceOf(Date);

    const invalid = Schema.parse(schema, '2025-01-01T00:00:00Z');
    expect(invalid.ok).toBe(false);
    expect(invalid.errors[0].code).toBe('max');
  });

  test('nullable and optional wrappers allow null and missing values', () => {
    const schema = Schema.object({
      nickname: Schema.optional(Schema.string()),
      bio: Schema.nullable(Schema.string())
    }, { strict: true });

    expect(Schema.parse(schema, { bio: null })).toEqual({
      ok: true,
      value: { bio: null }
    });
    expect(Schema.validate(schema, {})).toEqual({
      valid: false,
      errors: [{ path: 'bio', code: 'required', message: 'Value is required.' }]
    });
  });

  test('schema descriptors round-trip through JSON', () => {
    const slug = Schema.custom('slug', function (value) {
      return /^[a-z-]+$/.test(value) || 'Invalid slug.';
    });
    const schema = Schema.object({
      id: Schema.number(),
      when: Schema.optional(Schema.date({ default: new Date('2024-01-01T00:00:00Z') })),
      tag: Schema.nullable(Schema.string()),
      choice: Schema.oneOf([Schema.string({ enum: ['a'] }), Schema.number()]),
      slug: slug
    }, { strict: true });

    const descriptor = Schema.toJSON(schema);
    const revived = Schema.fromJSON(JSON.parse(JSON.stringify(descriptor)));
    const result = Schema.parse(revived, { id: '2', tag: null, choice: 'a', slug: 'hello-world' });

    expect(result.ok).toBe(true);
    expect(result.value.id).toBe(2);
    expect(result.value.when).toBeInstanceOf(Date);
    expect(result.value.slug).toBe('hello-world');
  });

  test('toBinary converts object schema to Binary module format', () => {
    const schema = Schema.object({
      id: Schema.number({ wire: 'uint32', ordinal: 0 }),
      name: Schema.string({ ordinal: 1 }),
      email: Schema.nullable(Schema.string({ format: 'guid', ordinal: 2 })),
      active: Schema.boolean({ ordinal: 3 }),
      created: Schema.date({ ordinal: 4 }),
      score: Schema.number({ wire: 'float32', ordinal: 5 })
    });
    const bin = Schema.toBinary(schema, { version: 2 });
    expect(bin.version).toBe(2);
    expect(bin.members).toHaveLength(6);
    expect(bin.members[0]).toEqual({ name: 'id', wireType: 'UInt32', isNullable: false, ordinal: 0 });
    expect(bin.members[1]).toEqual({ name: 'name', wireType: 'String', isNullable: false, ordinal: 1 });
    expect(bin.members[2]).toEqual({ name: 'email', wireType: 'Guid', isNullable: true, ordinal: 2 });
    expect(bin.members[3]).toEqual({ name: 'active', wireType: 'Bool', isNullable: false, ordinal: 3 });
    expect(bin.members[4]).toEqual({ name: 'created', wireType: 'DateTime', isNullable: false, ordinal: 4 });
    expect(bin.members[5]).toEqual({ name: 'score', wireType: 'Float32', isNullable: false, ordinal: 5 });
  });

  test('fromBinary converts Binary schema back to Schema object', () => {
    const binarySchema = {
      members: [
        { name: 'id', wireType: 'UInt32', isNullable: false },
        { name: 'label', wireType: 'String', isNullable: true },
        { name: 'ts', wireType: 'DateTime', isNullable: false },
        { name: 'flags', wireType: 'Enum', isNullable: false, enumUnderlying: 'Byte' }
      ]
    };
    const schema = Schema.fromBinary(binarySchema);
    expect(schema.type).toBe('object');
    expect(schema.shape.id.type).toBe('number');
    expect(schema.shape.id.wire).toBe('uint32');
    expect(schema.shape.label.type).toBe('string');
    expect(schema.shape.label.nullable).toBe(true);
    expect(schema.shape.ts.type).toBe('date');
    expect(schema.shape.flags.enumUnderlying).toBe('Byte');
  });

  test('toBinary + fromBinary round-trips', () => {
    const original = Schema.object({
      key: Schema.string({ format: 'identifier' }),
      value: Schema.number({ wire: 'int64' }),
      stamp: Schema.date({ format: 'dateonly' })
    });
    const bin = Schema.toBinary(original);
    const restored = Schema.fromBinary(bin);
    expect(restored.shape.key.wireType).toBe('Identifier');
    expect(restored.shape.value.wire).toBe('int64');
    expect(restored.shape.stamp.format).toBe('dateonly');
  });
});
