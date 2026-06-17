/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { webcrypto } = require('crypto');

function loadAuthenticator() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Authenticator.js'), 'utf8');
  const bm = {};
  const fn = new Function('BareMetal', 'crypto', 'require', 'window', 'document', code + '\nreturn BareMetal;');
  const fakeWindow = { BareMetal: bm };
  return fn(bm, webcrypto, require, fakeWindow, global.document).Authenticator;
}

describe('BareMetal.Authenticator', () => {
  let Auth;
  let secret;

  beforeEach(() => {
    Auth = loadAuthenticator();
    secret = Auth.base32encode(Buffer.from('12345678901234567890', 'ascii')).replace(/=+$/g, '');
  });

  test('base32 encode/decode round-trip with RFC 4648 vectors', () => {
    const vectors = [
      ['', ''],
      ['f', 'MY======'],
      ['fo', 'MZXQ===='],
      ['foo', 'MZXW6==='],
      ['foob', 'MZXW6YQ='],
      ['fooba', 'MZXW6YTB'],
      ['foobar', 'MZXW6YTBOI======']
    ];

    vectors.forEach(([input, expected]) => {
      const encoded = Auth.base32encode(Buffer.from(input, 'ascii'));
      expect(encoded).toBe(expected);
      expect(Buffer.from(Auth.base32decode(encoded)).toString('ascii')).toBe(input);
    });
  });

  test('HOTP matches RFC 4226 test vectors', () => {
    const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
    expected.forEach((code, counter) => {
      expect(Auth.hotp(secret, counter)).toBe(code);
    });
  });

  test('TOTP generation matches known RFC timestamps', () => {
    const vectors = [
      [59, '94287082'],
      [1111111109, '07081804'],
      [1111111111, '14050471'],
      [1234567890, '89005924'],
      [2000000000, '69279037'],
      [20000000000, '65353130']
    ];

    vectors.forEach(([timestamp, code]) => {
      expect(Auth.totp(secret, { timestamp, digits: 8 })).toBe(code);
    });
  });

  test('verify allows ±1 drift tolerance and reports drift', () => {
    const code = Auth.totp(secret, { timestamp: 59 });
    expect(Auth.verify(code, secret, { timestamp: 89, period: 30, window: 1 })).toEqual({ ok: true, drift: -1 });
    expect(Auth.verify(code, secret, { timestamp: 59, period: 30, window: 1 })).toEqual({ ok: true, drift: 0 });
    expect(Auth.verify(code, secret, { timestamp: 29, period: 30, window: 1 })).toEqual({ ok: true, drift: 1 });
  });

  test('replay guard blocks reuse in the same window', () => {
    const guard = Auth.replayGuard(secret);
    const code = Auth.totp(secret, { timestamp: 59 });
    expect(guard.check(code, { timestamp: 59 })).toBe(true);
    expect(guard.check(code, { timestamp: 59 })).toBe(false);
    const nextCode = Auth.totp(secret, { timestamp: 89 });
    expect(guard.check(nextCode, { timestamp: 89 })).toBe(true);
    guard.reset();
    expect(guard.check(code, { timestamp: 59 })).toBe(true);
  });

  test('setup generates otpauth URI, secret, and backup codes', () => {
    const result = Auth.setup('alice@example.com', { issuer: 'BareMetal', backupCount: 8 });
    expect(result.secret).toMatch(/^[A-Z2-7]+$/);
    expect(Auth.base32decode(result.secret)).toHaveLength(20);
    expect(result.qrUri).toContain('otpauth://totp/BareMetal:alice%40example.com');
    expect(result.qrUri).toContain('issuer=BareMetal');
    expect(result.backupCodes).toHaveLength(8);
    result.backupCodes.forEach(code => expect(code).toMatch(/^\d{8}$/));
  });

  test('backup codes verify once and remove the used code', () => {
    const codes = ['12345678', '87654321'];
    const result = Auth.backupVerify('12345678', codes);
    expect(result).toEqual({ ok: true, remaining: ['87654321'] });
    expect(Auth.backupVerify('12345678', result.remaining)).toEqual({ ok: false, remaining: ['87654321'] });
  });

  test('protect blocks invalid code and allows valid code', async () => {
    const protectedAction = Auth.protect(function(value) { return value * 2; }, {
      secret,
      prompt: 'Approve transfer',
      onChallenge(resolve) { resolve('000000'); }
    });

    await expect(protectedAction(5)).rejects.toThrow('Invalid TOTP code');

    const allowedAction = Auth.protect(function(value) { return value * 3; }, {
      secret,
      onChallenge(resolve) { resolve(Auth.totp(secret, { timestamp: 59 })); },
      verify: { timestamp: 59 }
    });

    await expect(allowedAction(5)).resolves.toBe(15);
  });

  test('policy requires checks actions, amounts, roles, and transitions', () => {
    const p = Auth.policy({
      actions: ['payment', 'ledger'],
      minAmount: 1000,
      roles: ['admin'],
      transitions: ['invoice→payment']
    });

    expect(p.requires('payment', {})).toBe(true);
    expect(p.requires('noop', { amount: 1500 })).toBe(true);
    expect(p.requires('noop', { roles: ['user', 'admin'] })).toBe(true);
    expect(p.requires('noop', { transition: 'invoice→payment' })).toBe(true);
    expect(p.requires('noop', { transition: 'invoice->payment' })).toBe(true);
    expect(p.requires('view', { amount: 5, roles: ['user'], transition: 'draft→view' })).toBe(false);
  });

  test('generate returns the current code and remaining seconds', () => {
    const result = Auth.generate(secret, { timestamp: 59 });
    expect(result).toEqual({ code: Auth.totp(secret, { timestamp: 59 }), remaining: 1, period: 30 });
  });

  test('qrSvg returns SVG markup', () => {
    const svg = Auth.qrSvg('otpauth://totp/BareMetal:alice?secret=ABCDEF&issuer=BareMetal');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('<path d="M');
  });
});
