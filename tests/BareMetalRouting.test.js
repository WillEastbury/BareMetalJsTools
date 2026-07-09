/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

// ── Load the library under test ────────────────────────────────────────────
const SRC = path.resolve(
  __dirname, '../src/BareMetal.Routing.js'
);

function loadRouter() {
  delete global.BMRouter;
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

// ── patternToRegex / route matching (via BMRouter._dispatch) ───────────────

describe('BMRouter – route registration and dispatch', () => {
  let router;

  beforeEach(() => {
    router = loadRouter();
    // Replace the routes from previous test
    router._routes = [];
    router._notFound = null;
  });

  test('registers a static route and dispatches it', () => {
    const handler = jest.fn();
    router.on('/home', handler);
    router._dispatch('/home', '', null);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({}, {}, null);
  });

  test('registers a route with a named param and extracts it', () => {
    const handler = jest.fn();
    router.on('/data/:entity', handler);
    router._dispatch('/data/customers', '', null);
    expect(handler).toHaveBeenCalledWith({ entity: 'customers' }, {}, null);
  });

  test('registers a route with multiple named params', () => {
    const handler = jest.fn();
    router.on('/data/:entity/:id', handler);
    router._dispatch('/data/orders/42', '', null);
    expect(handler).toHaveBeenCalledWith({ entity: 'orders', id: '42' }, {}, null);
  });

  test('registers a wildcard route and extracts the rest', () => {
    const handler = jest.fn();
    router.on('/files/*', handler);
    router._dispatch('/files/images/logo.png', '', null);
    const [params] = handler.mock.calls[0];
    expect(params['*']).toBe('images/logo.png');
  });

  test('dispatches the first matching route (registration order)', () => {
    const h1 = jest.fn();
    const h2 = jest.fn();
    router.on('/data/:entity', h1);
    router.on('/data/customers', h2);   // registered second — should NOT match
    router._dispatch('/data/customers', '', null);
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).not.toHaveBeenCalled();
  });

  test('calls notFound handler when no route matches', () => {
    const nf = jest.fn();
    router.notFound(nf);
    router._dispatch('/unknown', '', null);
    expect(nf).toHaveBeenCalledWith('/unknown', {});
  });

  test('does not call notFound when a route matches', () => {
    const handler = jest.fn();
    const nf = jest.fn();
    router.on('/match', handler);
    router.notFound(nf);
    router._dispatch('/match', '', null);
    expect(nf).not.toHaveBeenCalled();
  });

  test('on() is chainable', () => {
    const result = router.on('/a', jest.fn()).on('/b', jest.fn());
    expect(result).toBe(router);
  });

  test('notFound() is chainable', () => {
    const result = router.notFound(jest.fn());
    expect(result).toBe(router);
  });

  test('trailing slash is tolerated in dispatch', () => {
    const handler = jest.fn();
    router.on('/page', handler);
    router._dispatch('/page/', '', null);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('URL-encoded params are decoded', () => {
    const handler = jest.fn();
    router.on('/data/:entity', handler);
    router._dispatch('/data/hello%20world', '', null);
    expect(handler).toHaveBeenCalledWith({ entity: 'hello world' }, {}, null);
  });
});

// ── parseQuery (exercised through _dispatch) ───────────────────────────────

describe('BMRouter – query string parsing', () => {
  let router;

  beforeEach(() => {
    router = loadRouter();
    router._routes = [];
  });

  test('parses a single key=value pair', () => {
    const handler = jest.fn();
    router.on('/q', handler);
    router._dispatch('/q', '?foo=bar', null);
    expect(handler).toHaveBeenCalledWith({}, { foo: 'bar' }, null);
  });

  test('parses multiple key=value pairs', () => {
    const handler = jest.fn();
    router.on('/q', handler);
    router._dispatch('/q', '?a=1&b=2', null);
    expect(handler).toHaveBeenCalledWith({}, { a: '1', b: '2' }, null);
  });

  test('parses repeated keys into an array', () => {
    const handler = jest.fn();
    router.on('/q', handler);
    router._dispatch('/q', '?x=1&x=2', null);
    const [, query] = handler.mock.calls[0];
    expect(query.x).toEqual(['1', '2']);
  });

  test('parses a key without a value as empty string', () => {
    const handler = jest.fn();
    router.on('/q', handler);
    router._dispatch('/q', '?flag', null);
    expect(handler).toHaveBeenCalledWith({}, { flag: '' }, null);
  });

  test('returns empty object for empty search string', () => {
    const handler = jest.fn();
    router.on('/q', handler);
    router._dispatch('/q', '', null);
    expect(handler).toHaveBeenCalledWith({}, {}, null);
  });

  test('decodes + as space in query values', () => {
    const handler = jest.fn();
    router.on('/q', handler);
    router._dispatch('/q', '?name=hello+world', null);
    expect(handler).toHaveBeenCalledWith({}, { name: 'hello world' }, null);
  });
});

// ── navigate (programmatic navigation) ────────────────────────────────────

describe('BMRouter – navigate()', () => {
  let router;

  beforeEach(() => {
    router = loadRouter();
    router._routes = [];
    // Reset history state
    window.history.replaceState(null, '', '/');
  });

  test('navigate() pushes a new history entry and dispatches', () => {
    const handler = jest.fn();
    router.on('/new-page', handler);
    router.navigate('/new-page');
    expect(window.location.pathname).toBe('/new-page');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('navigate() with replace=true uses replaceState', () => {
    const handler = jest.fn();
    router.on('/replaced', handler);
    router.navigate('/replaced', null, true);
    expect(window.location.pathname).toBe('/replaced');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('navigate() passes query params to handler', () => {
    const handler = jest.fn();
    router.on('/search', handler);
    router.navigate('/search?q=jest');
    expect(handler).toHaveBeenCalledWith({}, { q: 'jest' }, null);
  });
});

// ── hash mode ─────────────────────────────────────────────────────────────

describe('BMRouter – hash mode', () => {
  let router;

  beforeEach(() => {
    router = loadRouter();
    router._routes = [];
    router._notFound = null;
    router._mode = 'history';
    router._suppressChange = null;
    window.history.replaceState(null, '', '/');
    window.location.hash = '';
  });

  test('start({mode:"hash"}) dispatches the current hash route', () => {
    window.location.hash = '#/products';
    const handler = jest.fn();
    router.on('/products', handler);
    router.start({ mode: 'hash' });
    expect(router._mode).toBe('hash');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({}, {}, null);
  });

  test('start({mode:"hash"}) defaults to "/" when no hash present', () => {
    window.location.hash = '';
    const home = jest.fn();
    router.on('/', home);
    router.start({ mode: 'hash' });
    expect(home).toHaveBeenCalledTimes(1);
  });

  test('navigate() writes to location.hash and dispatches once', () => {
    router.start({ mode: 'hash' });
    const handler = jest.fn();
    router.on('/customers/:id', handler);
    router.navigate('/customers/42');
    expect(window.location.hash).toBe('#/customers/42');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ id: '42' }, {}, null);
  });

  test('navigate() parses query params from the hash path', () => {
    router.start({ mode: 'hash' });
    const handler = jest.fn();
    router.on('/search', handler);
    router.navigate('/search?q=jest');
    expect(handler).toHaveBeenCalledWith({}, { q: 'jest' }, null);
  });

  test('a hashchange from a manual edit dispatches the new route', () => {
    router.start({ mode: 'hash' });
    const handler = jest.fn();
    router.on('/manual', handler);
    window.location.hash = '#/manual';
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('the hashchange triggered by navigate() does not double-dispatch', () => {
    router.start({ mode: 'hash' });
    const handler = jest.fn();
    router.on('/once', handler);
    router.navigate('/once');
    // Simulate the async hashchange the write would trigger.
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
