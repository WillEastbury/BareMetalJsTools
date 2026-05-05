/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadURL() {
  delete global.window.BareMetal;
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.URL.js'), 'utf8');
  const fn = new Function('window', 'module', code + '\nreturn window.BareMetal.URL;');
  return fn(global.window, { exports: {} });
}

describe('BareMetal.URL', () => {
  let URLTools;

  beforeEach(() => {
    URLTools = loadURL();
  });

  test('parse handles full URLs', () => {
    const parsed = URLTools.parse('https://Example.COM:443/a/b?x=1&x=2#frag');
    expect(parsed).toEqual({
      protocol: 'https:',
      host: 'Example.COM:443',
      hostname: 'Example.COM',
      port: '443',
      pathname: '/a/b',
      search: '?x=1&x=2',
      hash: '#frag',
      origin: 'https://Example.COM:443',
      params: { x: ['1', '2'] },
      segments: ['a', 'b']
    });
  });

  test('parse handles partial URLs', () => {
    const parsed = URLTools.parse('/docs/api/v1?search=hello+world');
    expect(parsed.protocol).toBe('');
    expect(parsed.host).toBe('');
    expect(parsed.pathname).toBe('/docs/api/v1');
    expect(parsed.params).toEqual({ search: 'hello world' });
    expect(parsed.segments).toEqual(['docs', 'api', 'v1']);
  });

  test('build round-trips parsed URLs', () => {
    const input = 'https://example.com:8080/api/v2/users?id=5&tag=a&tag=b#top';
    expect(URLTools.build(URLTools.parse(input))).toBe(input);
  });

  test('query encode and decode handle arrays, nested values, spaces and specials', () => {
    const encoded = URLTools.query.encode({
      tag: ['alpha', 'beta'],
      user: { name: 'Jane Doe', note: 'a&b' },
      flag: null
    });

    expect(encoded).toBe('tag=alpha&tag=beta&user%5Bname%5D=Jane%20Doe&user%5Bnote%5D=a%26b&flag');
    expect(URLTools.query.decode(encoded)).toEqual({
      tag: ['alpha', 'beta'],
      user: { name: 'Jane Doe', note: 'a&b' },
      flag: null
    });
  });

  test('query merge and remove update URLs', () => {
    expect(URLTools.query.merge('/users?page=1', { q: 'john smith', page: 2 })).toBe('/users?page=2&q=john%20smith');
    expect(URLTools.query.remove('/users?page=2&q=john%20smith', 'page')).toBe('/users?q=john%20smith');
  });

  test('params extracts route params from patterns', () => {
    expect(URLTools.params('/user/:id/orders/:orderId', '/user/42/orders/abc')).toEqual({
      id: '42',
      orderId: 'abc'
    });
  });

  test('template fills URL patterns', () => {
    expect(URLTools.template('/api/:version/users/:id', { version: 'v2', id: 5 })).toBe('/api/v2/users/5');
  });

  test('join handles duplicate slashes and trailing slash', () => {
    expect(URLTools.join('/api//', '/v1/', '/users/')).toBe('/api/v1/users/');
    expect(URLTools.join('https://example.com/', '/api/', 'users')).toBe('https://example.com/api/users');
  });

  test('normalize canonicalizes ports, trailing slash, dot segments and query order', () => {
    expect(URLTools.normalize('HTTPS://Example.COM:443/a/b/../c/?b=2&a=1')).toBe('https://example.com/a/c?a=1&b=2');
  });

  test('compare uses normalized semantic equality', () => {
    expect(URLTools.compare('https://Example.com:443/a/./b/?b=2&a=1', 'https://example.com/a/b?a=1&b=2')).toBe(true);
  });

  test('slug generates URL-safe slugs', () => {
    expect(URLTools.slug('Hello, World! Café -- 2026')).toBe('hello-world-cafe-2026');
  });

  test('resolve handles relative URLs', () => {
    expect(URLTools.resolve('https://example.com/app/v1/users/', '../status?ok=yes')).toBe('https://example.com/app/v1/status?ok=yes');
  });

  test('hash, origin, validity and relative helpers work', () => {
    expect(URLTools.hash.get('https://example.com/path#section-1')).toBe('section-1');
    expect(URLTools.hash.set('https://example.com/path#old', 'new-hash')).toBe('https://example.com/path#new-hash');
    expect(URLTools.origin('https://example.com:8080/path')).toBe('https://example.com:8080');
    expect(URLTools.isAbsolute('https://example.com')).toBe(true);
    expect(URLTools.isRelative('/docs/page')).toBe(true);
    expect(URLTools.isValid('https://example.com/path')).toBe(true);
    expect(URLTools.relative('https://example.com/a/b/c', 'https://example.com/a/d/e?x=1')).toBe('../d/e?x=1');
  });

  test('decode safely handles malformed sequences', () => {
    expect(URLTools.decode('%E0%A4%A')).toBe('%E0%A4%A');
  });
});
