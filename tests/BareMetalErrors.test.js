/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Errors.js');

function loadErrors() {
  delete global.BareMetal;
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Errors;');
  return fn();
}

describe('BareMetal.Errors', () => {
  let Errors;

  beforeEach(() => {
    Errors = loadErrors();
  });

  afterEach(() => {
    delete global.BareMetal;
  });

  test('create applies all options and registry defaults', () => {
    Errors.codes.register('AUTH_TOKEN_EXPIRED', {
      category: 'auth',
      retryable: true,
      userMessage: 'Please sign in again.'
    });
    const cause = new Error('Token service unavailable');
    const err = Errors.create('AUTH_TOKEN_EXPIRED', 'Token refresh failed', {
      data: { attempt: 2 },
      cause,
      statusCode: 401
    });

    expect(err).toBeInstanceOf(Errors.BareMetalError);
    expect(err.code).toBe('AUTH_TOKEN_EXPIRED');
    expect(err.message).toBe('Token refresh failed');
    expect(err.category).toBe('auth');
    expect(err.retryable).toBe(true);
    expect(err.cause.message).toBe('Token service unavailable');
    expect(err.data).toEqual({ attempt: 2 });
    expect(err.userMessage).toBe('Please sign in again.');
    expect(err.statusCode).toBe(401);
    expect(typeof err.stack).toBe('string');
    expect(typeof err.timestamp).toBe('string');
  });

  test('classify handles HTTP status codes', () => {
    expect(Errors.classify({ status: 400 })).toEqual({ category: 'validation', retryable: false, code: 'HTTP_400' });
    expect(Errors.classify({ status: 401 })).toEqual({ category: 'auth', retryable: false, code: 'HTTP_401' });
    expect(Errors.classify({ status: 500 })).toEqual({ category: 'transient', retryable: true, code: 'HTTP_500' });
    expect(Errors.classify({ status: 404 })).toEqual({ category: 'permanent', retryable: false, code: 'HTTP_404' });
  });

  test('chain and getChain preserve root-to-leaf order', () => {
    const root = new Error('Disk offline');
    const mid = Errors.chain(Errors.create('FETCH_FAILED', 'Request failed', { category: 'network', retryable: true }), root);
    const leaf = Errors.chain(Errors.create('SAVE_FAILED', 'Save failed', { category: 'transient', retryable: true }), mid);

    expect(Errors.getChain(leaf).map((err) => err.message)).toEqual([
      'Disk offline',
      'Request failed',
      'Save failed'
    ]);
  });

  test('toUserSafe strips internal details', () => {
    const err = Errors.create('DB_LEAK', 'Database password leaked: hunter2', {
      category: 'permanent',
      userMessage: 'We could not complete your request.'
    });

    expect(Errors.toUserSafe(err)).toEqual({
      message: 'We could not complete your request.',
      code: 'DB_LEAK'
    });
  });

  test('JSON round-trip preserves typed structure', () => {
    const err = Errors.create('NETWORK_DOWN', 'Unable to reach upstream', {
      category: 'network',
      retryable: true,
      data: { region: 'eu-west-1' },
      cause: Errors.create('DNS_FAIL', 'DNS lookup failed', { category: 'network', retryable: true })
    });
    const json = Errors.toJSON(err);
    const restored = Errors.fromJSON(json);

    expect(restored).toBeInstanceOf(Errors.BareMetalError);
    expect(Errors.toJSON(restored)).toEqual(json);
  });

  test('wrap reclassifies errors without rethrow when requested', () => {
    const wrapped = Errors.wrap(function() {
      throw new Error('boom');
    }, { code: 'WRAPPED', category: 'transient', rethrow: false });
    const err = wrapped();

    expect(err).toBeInstanceOf(Errors.BareMetalError);
    expect(err.code).toBe('WRAPPED');
    expect(err.category).toBe('transient');
  });

  test('match routes by code before category', () => {
    const handlers = {
      AUTH_REQUIRED: jest.fn(() => 'code-handler'),
      auth: jest.fn(() => 'category-handler'),
      default: jest.fn(() => 'default-handler')
    };
    const err = Errors.create('AUTH_REQUIRED', 'Authentication required', { category: 'auth' });

    expect(Errors.match(err, handlers)).toBe('code-handler');
    expect(handlers.AUTH_REQUIRED).toHaveBeenCalledTimes(1);
    expect(handlers.auth).not.toHaveBeenCalled();
    expect(handlers.default).not.toHaveBeenCalled();
  });

  test('assert throws a BareMetalError for falsy conditions', () => {
    expect(() => Errors.assert(false, 'MISSING_FIELD', 'Name is required')).toThrow('Name is required');
    try {
      Errors.assert(false, 'MISSING_FIELD', 'Name is required');
    } catch (err) {
      expect(err).toBeInstanceOf(Errors.BareMetalError);
      expect(err.code).toBe('MISSING_FIELD');
      expect(err.category).toBe('validation');
    }
  });

  test('aggregate returns a typed composite error', () => {
    const one = Errors.create('HTTP_500', 'Server exploded', { category: 'transient', retryable: true });
    const two = Errors.create('HTTP_503', 'Service unavailable', { category: 'transient', retryable: true });
    const agg = Errors.aggregate([one, two]);

    expect(agg).toBeInstanceOf(Errors.BareMetalError);
    expect(agg.code).toBe('AGGREGATE_ERROR');
    expect(agg.category).toBe('transient');
    expect(agg.retryable).toBe(true);
    expect(agg.errors).toHaveLength(2);
    expect(agg.data.errors).toHaveLength(2);
  });

  test('boundary retries retryable errors before succeeding', () => {
    let attempts = 0;
    const guarded = Errors.boundary(function() {
      attempts += 1;
      if (attempts === 1) throw Errors.create('TEMP_FAIL', 'Please retry', { category: 'transient', retryable: true });
      return 'ok';
    }, 'fallback');

    expect(guarded()).toBe('ok');
    expect(attempts).toBe(2);
  });
});
