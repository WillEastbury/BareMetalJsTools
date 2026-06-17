/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'src', 'BareMetal.PicoScript.js');

function loadModule() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const fn = new Function('document', code + '\nreturn BareMetal.PicoScript;');
  return fn(global.document);
}

describe('BareMetal.PicoScript', () => {
  let ps;

  beforeAll(() => {
    ps = loadModule();
  });

  test('exports VERSION 2.0.0', () => {
    expect(ps.VERSION).toBe('2.0.0');
  });

  test('has compiler methods', () => {
    expect(typeof ps.compile).toBe('function');
    expect(typeof ps.compileC).toBe('function');
    expect(typeof ps.compileBasic).toBe('function');
    expect(typeof ps.compilePython).toBe('function');
    expect(typeof ps.compileEnglish).toBe('function');
  });

  test('has VM constructor', () => {
    expect(typeof ps.VM).toBe('function');
  });

  test('has hook table with 465 entries', () => {
    expect(Object.keys(ps.hooks.BY_CODE).length).toBe(465);
  });

  test('namespaces() returns 64 namespaces', () => {
    const ns = ps.namespaces();
    expect(ns.length).toBe(64);
    expect(ns).toContain('Process');
    expect(ns).toContain('Timer');
    expect(ns).toContain('Error');
    expect(ns).toContain('Capsule');
    expect(ns).toContain('Env');
    expect(ns).toContain('Principal');
    expect(ns).toContain('Sandbox');
    expect(ns).toContain('Storage');
    expect(ns).toContain('Tensor');
  });

  test('methods() returns hook methods for a namespace', () => {
    expect(ps.methods('Process')).toEqual(
      ['Args', 'Exit', 'Kill', 'Parent', 'Self', 'Spawn', 'Status', 'Wait']
    );
    expect(ps.methods('Timer')).toEqual(['After', 'Cancel', 'Elapsed', 'Every']);
    expect(ps.methods('Env')).toEqual(['Count', 'Get', 'Key', 'Set']);
  });

  test('hookCode() returns correct codes', () => {
    expect(ps.hookCode('Process', 'Self')).toBe(0x280);
    expect(ps.hookCode('Timer', 'After')).toBe(0x290);
    expect(ps.hookCode('Error', 'Code')).toBe(0x2B2);
    expect(ps.hookCode('Capsule', 'Call')).toBe(0x2C0);
  });

  test('C frontend compiles and runs', () => {
    const r = ps.compileC('int x = 42; Io.WriteByte(x);');
    expect(r.words.length).toBeGreaterThan(0);
    const vm = new ps.VM();
    vm.run(r.words);
    expect(vm.output).toEqual([42]);
  });

  test('BASIC frontend compiles', () => {
    const r = ps.compileBasic('LET R0 = 42\nRETURN');
    expect(r.words.length).toBeGreaterThan(0);
  });

  test('Python frontend compiles', () => {
    const r = ps.compilePython('x = 42');
    expect(r.words.length).toBeGreaterThan(0);
  });

  test('English frontend compiles', () => {
    const r = ps.compileEnglish('Set R0 to 42.\nReturn.');
    expect(r.words.length).toBeGreaterThan(0);
  });

  test('OS-worker Process.Self compiles and runs', () => {
    const r = ps.compileC('int pid = Process.Self(); Io.WriteByte(pid);');
    const vm = new ps.VM();
    vm.run(r.words);
    expect(vm.output[0]).toBe(1); // default self pid
  });

  test('OS-worker Timer.After compiles and runs', () => {
    const r = ps.compileC('int h = Timer.After(100); Io.WriteByte(h);');
    const vm = new ps.VM();
    vm.run(r.words);
    expect(vm.output[0]).toBe(1); // first timer handle
  });

  test('PicoCompress sub-module available', () => {
    expect(ps.PicoCompress).toBeDefined();
    expect(typeof ps.PicoCompress.compress).toBe('function');
  });

  test('PicoBrotli sub-module available', () => {
    expect(ps.PicoBrotli).toBeDefined();
  });
});
