/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const crypto = require('crypto');

const SRC = path.resolve(__dirname, '../src/BareMetal.Authenticator.js');
const SECRET_ASCII = '12345678901234567890';

function loadAuthenticator() {
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

describe('BareMetal.Authenticator', () => {
  let Auth;
  let secret;

  beforeEach(() => {
    jest.resetModules();
    Auth = loadAuthenticator();
    secret = Auth.base32encode(Buffer.from(SECRET_ASCII, 'ascii')).replace(/=+$/g, '');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('exports the expected API', () => {
    [
      'setup', 'verify', 'generate', 'challenge', 'protect', 'lastVerified', 'timeSinceVerify', 'replayGuard',
      'backupVerify', 'qrSvg', 'base32encode', 'base32decode', 'hmacSha1', 'hotp', 'totp', 'policy',
      'onSetup', 'onVerify', 'onFail', 'onChallenge'
    ].forEach((key) => expect(typeof Auth[key]).toBe('function'));
  });

  test('base32encode matches RFC 4648 examples', () => {
    expect(Auth.base32encode(Buffer.from('foo', 'ascii'))).toBe('MZXW6===');
    expect(Auth.base32encode(Buffer.from('foobar', 'ascii'))).toBe('MZXW6YTBOI======');
  });

  test('base32encode omits padding when requested', () => {
    expect(Auth.base32encode(Buffer.from('foo', 'ascii'), true)).toBe('MZXW6');
  });

  test('base32decode round-trips with whitespace and hyphens removed', () => {
    const decoded = Auth.base32decode('MZ XW-6YTB OI======');
    expect(Buffer.from(decoded).toString('ascii')).toBe('foobar');
  });

  test('base32decode throws on invalid input', () => {
    expect(() => Auth.base32decode('INVALID*')).toThrow('Invalid base32 character');
  });

  test('hmacSha1 matches Node crypto output', async () => {
    const expected = crypto.createHmac('sha1', Buffer.from('key')).update('message').digest('hex');
    const actual = Buffer.from(await Auth.hmacSha1('key', 'message')).toString('hex');
    expect(actual).toBe(expected);
  });

  test('HOTP matches RFC 4226 vectors', () => {
    const expected = ['755224', '287082', '359152', '969429', '338314', '254676'];
    expected.forEach((code, counter) => expect(Auth.hotp(secret, counter)).toBe(code));
  });

  test('TOTP matches RFC 6238 vectors', () => {
    const vectors = [
      [59, '94287082'],
      [1111111109, '07081804'],
      [1234567890, '89005924']
    ];
    vectors.forEach(([timestamp, code]) => expect(Auth.totp(secret, { timestamp, digits: 8 })).toBe(code));
  });

  test('generate returns code remaining and period', () => {
    expect(Auth.generate(secret, { timestamp: 59 })).toEqual({ code: Auth.totp(secret, { timestamp: 59 }), remaining: 1, period: 30 });
  });

  test('verify succeeds within drift window and updates lastVerified', () => {
    const code = Auth.totp(secret, { timestamp: 59 });
    expect(Auth.verify(code, secret, { timestamp: 89, period: 30, window: 1 })).toEqual({ ok: true, drift: -1 });
    expect(Auth.lastVerified()).toBe(89000);
  });

  test('verify fails outside the allowed window', () => {
    const code = Auth.totp(secret, { timestamp: 59 });
    expect(Auth.verify(code, secret, { timestamp: 120, period: 30, window: 0 })).toEqual({ ok: false, drift: 0 });
  });

  test('onVerify listener receives successful verification payloads', () => {
    const listener = jest.fn();
    const off = Auth.onVerify(listener);
    const code = Auth.totp(secret, { timestamp: 59 });
    Auth.verify(code, secret, { timestamp: 59 });
    expect(listener).toHaveBeenCalledWith({ ok: true, drift: 0, timestamp: 59000 });
    off();
  });

  test('onFail listener receives failed verification payloads', () => {
    const listener = jest.fn();
    const off = Auth.onFail(listener);
    Auth.verify('000000', secret, { timestamp: 59, window: 0 });
    expect(listener).toHaveBeenCalledWith({ ok: false, code: '000000', timestamp: 59000 });
    off();
  });

  test('setup emits setup events and returns expected values', () => {
    const listener = jest.fn();
    const off = Auth.onSetup(listener);
    const result = Auth.setup('alice@example.com', { issuer: 'BareMetal', backupCount: 4 });
    expect(result.secret).toMatch(/^[A-Z2-7]+$/);
    expect(result.backupCodes).toHaveLength(4);
    expect(result.qrUri).toContain('otpauth://totp/BareMetal:alice%40example.com');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ userId: 'alice@example.com', secret: result.secret }));
    off();
  });

  test('lastVerified starts null and timeSinceVerify is Infinity before verification', () => {
    expect(Auth.lastVerified()).toBeNull();
    expect(Auth.timeSinceVerify()).toBe(Infinity);
  });

  test('timeSinceVerify reflects elapsed seconds', () => {
    jest.spyOn(Date, 'now').mockReturnValue(61000);
    Auth.verify(Auth.totp(secret, { timestamp: 59 }), secret, { timestamp: 59 });
    expect(Auth.timeSinceVerify()).toBe(2);
  });

  test('challenge reports not required when TOTP is disabled', () => {
    expect(Auth.challenge({ totpEnabled: false })).toEqual({ required: false, reason: 'TOTP not enabled' });
  });

  test('challenge reports required when enabled and never verified', () => {
    expect(Auth.challenge({ totpSecret: secret })).toEqual({ required: true, reason: 'TOTP verification required' });
  });

  test('challenge reports expired verification when max age has elapsed', () => {
    jest.spyOn(Date, 'now').mockReturnValue(100000);
    expect(Auth.challenge({ totpSecret: secret, totpVerifiedAt: 1, maxAge: 30 })).toEqual({ required: true, reason: 'TOTP verification expired' });
  });

  test('backupVerify removes a used code and preserves others', () => {
    expect(Auth.backupVerify(' 12345678 ', ['12345678', '87654321'])).toEqual({ ok: true, remaining: ['87654321'] });
  });

  test('replayGuard blocks code reuse until reset', () => {
    const guard = Auth.replayGuard(secret, { timestamp: 59 });
    const code = Auth.totp(secret, { timestamp: 59 });
    expect(guard.check(code, { timestamp: 59 })).toBe(true);
    expect(guard.check(code, { timestamp: 59 })).toBe(false);
    guard.reset();
    expect(guard.check(code, { timestamp: 59 })).toBe(true);
  });

  test('protect rejects when challenge is required but no onChallenge handler exists', async () => {
    const fn = Auth.protect((x) => x * 2, { secret, maxAge: 0 });
    await expect(fn(2)).rejects.toThrow('TOTP challenge required');
  });

  test('protect resolves with a valid TOTP code and preserves this and args', async () => {
    const ctx = { factor: 3 };
    const fn = Auth.protect(function(value) { return value * this.factor; }, {
      maxAge: 0,
      onChallenge(accept) { accept(Auth.totp(secret, { timestamp: 59 })); },
      verify: { timestamp: 59 },
      secret
    });
    await expect(fn.call(ctx, 5)).resolves.toBe(15);
  });

  test('protect can authorize using backup codes and updates session', async () => {
    const session = { totpSecret: secret, totpRequired: true };
    const fn = Auth.protect(() => 'ok', {
      session,
      maxAge: 0,
      backupCodes: ['11112222'],
      onChallenge(accept) { accept({ code: '11112222' }); }
    });
    await expect(fn()).resolves.toBe('ok');
    expect(typeof session.totpVerifiedAt).toBe('number');
  });

  test('protect rejects when onChallenge denies the request', async () => {
    const fn = Auth.protect(() => 'nope', {
      secret,
      maxAge: 0,
      onChallenge(_accept, deny) { deny('Cancelled'); }
    });
    await expect(fn()).rejects.toThrow('Cancelled');
  });

  test('onChallenge listeners fire when protect requires a code', async () => {
    const listener = jest.fn();
    const off = Auth.onChallenge(listener);
    const fn = Auth.protect(() => 'ok', {
      secret,
      maxAge: 0,
      onChallenge(accept) { accept(Auth.totp(secret, { timestamp: 59 })); },
      verify: { timestamp: 59 }
    });
    await fn();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'Enter your authentication code', reason: 'TOTP verification required' }));
    off();
  });

  test('policy requires by action name amount role and transition', () => {
    const policy = Auth.policy({ actions: ['transfer'], minAmount: 1000, roles: ['admin'], transitions: ['draft→approved'] });
    expect(policy.requires('transfer', {})).toBe(true);
    expect(policy.requires('view', { amount: 1500 })).toBe(true);
    expect(policy.requires('view', { role: 'admin' })).toBe(true);
    expect(policy.requires('view', { transition: 'draft->approved' })).toBe(true);
    expect(policy.requires({ name: 'noop' }, { amount: 1, roles: ['user'], transition: 'a→b' })).toBe(false);
  });

  test('qrSvg returns SVG markup honoring custom size', () => {
    const svg = Auth.qrSvg('otpauth://totp/BareMetal:alice?secret=ABCDEF&issuer=BareMetal', { size: 144, quiet: 2 });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="144"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });
});

describe('branch coverage - Authenticator', () => {
  let Auth;
  let secret;

  beforeEach(() => {
    jest.resetModules();
    Auth = loadAuthenticator();
    secret = Auth.base32encode(Buffer.from(SECRET_ASCII, 'ascii')).replace(/=+$/g, '');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('covers utility edge cases and recent verification branches', () => {
    expect(typeof Auth.onSetup(null)).toBe('function');
    expect(Auth.base32encode(new Uint8Array([102, 111, 111]).buffer, true)).toBe('MZXW6');
    expect(Buffer.from(Auth.base32decode('')).toString('hex')).toBe('');

    const failListener = jest.fn(() => {
      throw new Error('listener failure');
    });
    const offFail = Auth.onFail(failListener);
    expect(Auth.verify('000000', secret, { timestamp: 0, window: 5 })).toEqual({ ok: false, drift: 0 });
    expect(failListener).toHaveBeenCalled();
    offFail();

    const generated = Auth.generate(secret, { digits: 0, period: 0, timestamp: new Date(59000) });
    expect(generated.period).toBe(30);
    expect(generated.code).toHaveLength(6);

    const setup = Auth.setup('bob@example.com', { digits: 0, period: 0, backupCount: -1 });
    expect(setup.backupCodes).toHaveLength(0);
    expect(setup.qrUri).toContain('digits=6');
    expect(setup.qrUri).toContain('period=30');

    expect(Auth.backupVerify('miss', ['12345678'])).toEqual({ ok: false, remaining: ['12345678'] });
    expect(Auth.replayGuard(secret, { timestamp: 59 }).check('bad', { timestamp: 59 })).toBe(false);

    Auth.verify(Auth.totp(secret, { timestamp: 59 }), secret, { timestamp: 59 });
    jest.spyOn(Date, 'now').mockReturnValue(59000);
    expect(Auth.challenge({ requireTotp: true, maxAge: 60 })).toEqual({ required: false, reason: 'Recently verified' });

    const svg = Auth.qrSvg('otpauth://totp/Test:alice?secret=ABC', { ecLevel: 'z', size: 0, quiet: -2 });
    expect(svg).toContain('width="200"');
    expect(svg).toContain('viewBox="0 0 29 29"');
  });

  test('covers protect secret resolution and denial branches', async () => {
    Auth.verify(Auth.totp(secret, { timestamp: 59 }), secret, { timestamp: 59 });
    jest.spyOn(Date, 'now').mockReturnValue(59000);

    const immediate = Auth.protect(function() { return this.value; }, { maxAge: 60 });
    await expect(immediate.call({ value: 'done' })).resolves.toBe('done');

    const fromSession = Auth.protect(() => 'session-ok', {
      session: { totpSecret: secret, totpRequired: true },
      maxAge: 0,
      onChallenge(accept) { accept({ code: Auth.totp(secret, { timestamp: 59 }) }); },
      verify: { timestamp: 59 }
    });
    await expect(fromSession()).resolves.toBe('session-ok');

    const fromArgs = Auth.protect((payload) => payload.id, {
      maxAge: 0,
      onChallenge(accept) { accept({ code: Auth.totp(secret, { timestamp: 59 }) }); },
      verify: { timestamp: 59 }
    });
    await expect(fromArgs({ id: 7, secret })).resolves.toBe(7);

    const fromContext = Auth.protect(function() { return this.ok; }, {
      maxAge: 0,
      onChallenge(accept) { accept({ code: Auth.totp(secret, { timestamp: 59 }) }); },
      verify: { timestamp: 59 }
    });
    await expect(fromContext.call({ ok: true, secret })).resolves.toBe(true);

    Date.now.mockReturnValue(70000);
    const invalid = Auth.protect(() => 'x', {
      secret,
      maxAge: 0,
      onChallenge(accept) { accept({ code: '000000' }); },
      verify: { timestamp: 59 }
    });
    await expect(invalid()).rejects.toThrow('Invalid TOTP code');

    const thrown = Auth.protect(() => 'x', {
      secret,
      maxAge: 0,
      onChallenge() { throw new Error('handler failed'); }
    });
    await expect(thrown()).rejects.toThrow('handler failed');

    const denied = Auth.protect(() => 'x', {
      secret,
      maxAge: 0,
      onChallenge(_accept, deny) { deny(new Error('Nope')); }
    });
    await expect(denied()).rejects.toThrow('Nope');

    const policy = Auth.policy({ minAmount: 10, transitions: ['a->b'], roles: ['owner'] });
    expect(policy.requires('noop', { amount: 10 })).toBe(true);
    expect(policy.requires('noop', { roles: ['owner'] })).toBe(true);
    expect(policy.requires('noop', { from: 'a', to: 'b' })).toBe(true);
    expect(policy.requires('noop', { amount: 1, roles: ['user'] })).toBe(false);
  });
});
