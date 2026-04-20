/**
 * @jest-environment node
 */
'use strict';

const path = require('path');

describe('picocompress IIFE wrapper', () => {
  let pc;
  beforeAll(() => {
    require(path.resolve(__dirname, '../src/BareMetal.Compress.js'));
    pc = global.PicoCompress;
  });

  test('exposes compress/decompress/compressBound/PROFILES', () => {
    expect(typeof pc.compress).toBe('function');
    expect(typeof pc.decompress).toBe('function');
    expect(typeof pc.compressBound).toBe('function');
    expect(typeof pc.PROFILES).toBe('object');
  });

  test('round-trips a string', () => {
    const src = 'BareMetalJsTools – picocompress integration test. '.repeat(40);
    const enc = new TextEncoder().encode(src);
    const c   = pc.compress(enc);
    const d   = pc.decompress(c);
    expect(c.length).toBeLessThan(enc.length);
    expect(new TextDecoder().decode(d)).toBe(src);
  });

  test('honours profile option', () => {
    const enc = new TextEncoder().encode('x'.repeat(2000));
    const a = pc.compress(enc, { profile: 'minimal' });
    const b = pc.compress(enc, { profile: 'q4' });
    // Both decompress back to original
    expect(new TextDecoder().decode(pc.decompress(a))).toBe('x'.repeat(2000));
    expect(new TextDecoder().decode(pc.decompress(b))).toBe('x'.repeat(2000));
  });

  test('compressBound returns a safe upper bound', () => {
    const bound = pc.compressBound(1000);
    const enc   = new TextEncoder().encode('x'.repeat(1000));
    const c     = pc.compress(enc);
    expect(bound).toBeGreaterThanOrEqual(c.length);
  });
});
