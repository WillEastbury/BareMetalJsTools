/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.Validate.js');

function loadValidate() {
  delete require.cache[SRC];
  delete global.BareMetal;
  if (global.window) delete global.window.BareMetal;
  return require(SRC);
}

describe('BareMetal.Validate', () => {
  let Validate;

  beforeEach(() => {
    Validate = loadValidate();
  });

  test('validates a simple object successfully', () => {
    const result = Validate.validate({
      name: { required: true, type: 'string' },
      age: { type: 'number', min: 18 }
    }, {
      name: 'Alice',
      age: 30
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('reports required error for empty strings', () => {
    const result = Validate.validate({ name: { required: true } }, { name: '   ' });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { path: 'name', code: 'required', message: 'This field is required.' }
    ]);
  });

  test('skips optional empty values', () => {
    const result = Validate.validate({
      nickname: { type: 'string', minLength: 3 }
    }, {
      nickname: ''
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('reports type mismatches for primitive types', () => {
    const result = Validate.validate({
      title: { type: 'string' },
      age: { type: 'number' },
      active: { type: 'boolean' }
    }, {
      title: 10,
      age: 'old',
      active: 'yes'
    });

    expect(result.errors.map((error) => error.code)).toEqual(['type', 'type', 'type']);
    expect(result.errors.map((error) => error.path)).toEqual(['title', 'age', 'active']);
  });

  test('validates array and object types', () => {
    const result = Validate.validate({
      tags: { type: 'array' },
      profile: { type: 'object' }
    }, {
      tags: ['a', 'b'],
      profile: { ok: true }
    });

    expect(result.valid).toBe(true);
  });

  test('reports min and max number validation errors', () => {
    const result = Validate.validate({
      score: { type: 'number', min: 5, max: 10 }
    }, {
      score: 11
    });

    expect(result.errors).toEqual([
      { path: 'score', code: 'max', message: 'Must be at most 10.' }
    ]);
  });

  test('reports minLength and maxLength errors', () => {
    const result = Validate.validate({
      password: { type: 'string', minLength: 3, maxLength: 5 }
    }, {
      password: 'abcdef'
    });

    expect(result.errors).toEqual([
      { path: 'password', code: 'maxLength', message: 'Must be at most 5 characters.' }
    ]);
  });

  test('validates pattern from regular expression', () => {
    const bad = Validate.validate({ code: { pattern: /^[A-Z]{2}$/ } }, { code: 'abc' });
    const good = Validate.validate({ code: { pattern: /^[A-Z]{2}$/ } }, { code: 'AB' });

    expect(bad.errors[0]).toEqual({ path: 'code', code: 'pattern', message: 'Invalid format.' });
    expect(good.valid).toBe(true);
  });

  test('validates pattern from string and ignores invalid pattern strings', () => {
    const bad = Validate.validate({ slug: { pattern: '^[a-z]+$' } }, { slug: 'NOPE' });
    const ignored = Validate.validate({ slug: { pattern: '[' } }, { slug: 'anything' });

    expect(bad.errors[0].code).toBe('pattern');
    expect(ignored.valid).toBe(true);
  });

  test('validates email addresses', () => {
    const result = Validate.validate({ email: { email: true } }, { email: 'not-an-email' });

    expect(result.errors).toEqual([
      { path: 'email', code: 'email', message: 'Invalid email address.' }
    ]);
  });

  test('validates URLs', () => {
    const result = Validate.validate({ homepage: { url: true } }, { homepage: 'notaurl' });

    expect(result.errors).toEqual([
      { path: 'homepage', code: 'url', message: 'Invalid URL.' }
    ]);
  });

  test('runs custom validators and passes root data and path', () => {
    const custom = jest.fn((value, root, fieldPath) => {
      expect(root.accountType).toBe('premium');
      expect(fieldPath).toBe('points');
      return value < 100 ? 'Need more points.' : '';
    });

    const result = Validate.validate({
      accountType: { type: 'string' },
      points: { type: 'number', custom }
    }, {
      accountType: 'premium',
      points: 50
    });

    expect(custom).toHaveBeenCalled();
    expect(result.errors[0]).toEqual({
      path: 'points',
      code: 'custom',
      message: 'Need more points.'
    });
  });

  test('ignores exceptions thrown by custom validators', () => {
    const result = Validate.validate({
      field: { custom: () => { throw new Error('boom'); } }
    }, {
      field: 'value'
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('validates nested schemas recursively', () => {
    const result = Validate.validate({
      user: {
        type: 'object',
        schema: {
          name: { required: true, type: 'string' },
          address: {
            type: 'object',
            schema: {
              city: { required: true, type: 'string' }
            }
          }
        }
      }
    }, {
      user: { name: 'Alice', address: {} }
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { path: 'user.address.city', code: 'required', message: 'This field is required.' }
    ]);
  });

  test('validates array items recursively', () => {
    const result = Validate.validate({
      tags: { type: 'array', items: { type: 'string', minLength: 2 } }
    }, {
      tags: ['ok', 'x']
    });

    expect(result.errors).toEqual([
      { path: 'tags[1]', code: 'minLength', message: 'Must be at least 2 characters.' }
    ]);
  });

  test('registers and unregisters custom named rules', () => {
    const remove = Validate.addRule('startsWithA', (value, expected) => (
      expected && typeof value === 'string' && value.charAt(0) !== 'A' ? 'Must start with A.' : ''
    ));

    const failing = Validate.validate({
      word: { startsWithA: true }
    }, {
      word: 'Beta'
    });

    remove();

    const passingAfterRemove = Validate.validate({
      word: { startsWithA: true }
    }, {
      word: 'Beta'
    });

    expect(failing.errors[0]).toEqual({
      path: 'word',
      code: 'startsWithA',
      message: 'Must start with A.'
    });
    expect(passingAfterRemove.valid).toBe(true);
  });

  test('refuses to register reserved rule names or invalid registrations', () => {
    const badReserved = Validate.addRule('required', jest.fn());
    const badName = Validate.addRule('', jest.fn());
    const badFn = Validate.addRule('extraRule', 'not-a-function');

    badReserved();
    badName();
    badFn();

    const result = Validate.validate({ field: { required: true } }, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  test('treats non-object schema or data inputs safely', () => {
    const result = Validate.validate(null, null);

    expect(result).toEqual({ valid: true, errors: [] });
  });
});
