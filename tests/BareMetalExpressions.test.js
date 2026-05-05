/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadExpressions() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Expressions.js'), 'utf8');
  const fn = new Function('BareMetal', code + '\nreturn BareMetal.Expressions;');
  return fn({});
}

describe('BareMetal.Expressions', () => {
  let E;

  beforeAll(() => {
    E = loadExpressions();
  });

  test('lists all built-in expressions and exposes info', () => {
    expect(E.list()).toHaveLength(51);
    expect(E.list()[0]).toBe('email');
    expect(E.info('email')).toEqual(expect.objectContaining({
      name: 'email',
      description: expect.stringMatching(/email/i),
      examples: expect.arrayContaining(['user@example.com'])
    }));
  });

  test('detect prefers specific types over generic ones', () => {
    expect(E.detect('user@example.com')).toEqual(['email']);
  });

  test('register exposes reusable custom expressions', () => {
    E.register('myPattern', {
      pattern: /^[A-Z]{3}-\d{4}$/,
      description: 'Custom ID format',
      examples: ['ABC-1234'],
      extract: (value) => {
        const m = value.match(/^([A-Z]{3})-(\d{4})$/);
        return m ? { prefix: m[1], num: m[2] } : null;
      }
    });

    expect(E.list()).toContain('myPattern');
    expect(E.myPattern.test('ABC-1234')).toBe(true);
    expect(E.myPattern.extract('ABC-1234')).toEqual({ prefix: 'ABC', num: '1234' });
  });

  test.each([
    ['email', 'user@domain.co.uk', { local: 'user', domain: 'domain.co.uk', tld: 'co.uk' }],
    ['phone', '+44 7911 123456', { digits: '447911123456', number: '+447911123456' }],
    ['url', 'https://example.com:8080/path?q=1#frag', { protocol: 'https', host: 'example.com', port: '8080', path: '/path', query: 'q=1', fragment: 'frag' }],
    ['ipv4', '192.168.1.1', { octets: ['192', '168', '1', '1'] }],
    ['zipUS', '10001-1234', { zip: '10001', plus4: '1234' }],
    ['creditCard', '4111 1111 1111 1111', { number: '4111111111111111', formatted: '4111 1111 1111 1111' }],
    ['iban', 'GB82 WEST 1234 5698 7654 32', { country: 'GB', checkDigits: '82' }],
    ['dateISO', '2024-03-15', { year: '2024', month: '03', day: '15' }],
    ['time12', '9:30 AM', { hour: '9', minute: '30', period: 'AM' }],
    ['uuid', '550e8400-e29b-41d4-a716-446655440000', { uuid: '550e8400-e29b-41d4-a716-446655440000' }],
    ['semver', '2.1.0-beta.1', { major: '2', minor: '1', patch: '0', prerelease: 'beta.1' }],
    ['jwt', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature', { payload: { sub: '123' } }],
    ['markdownLink', '[BareMetal](https://example.com)', { text: 'BareMetal', url: 'https://example.com' }]
  ])('%s test() and extract()', (name, value, expected) => {
    expect(E[name].test(value)).toBe(true);
    expect(E[name].extract(value)).toEqual(expect.objectContaining(expected));
  });

  test('invalid values are rejected', () => {
    expect(E.creditCard.test('4111 1111 1111 1112')).toBe(false);
    expect(E.dateISO.extract('2024-02-30')).toBeNull();
    expect(E.phoneStrict.test('+44 7911 123456')).toBe(false);
  });
});
