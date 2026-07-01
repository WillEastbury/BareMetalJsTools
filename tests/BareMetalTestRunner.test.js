/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.TestRunner.js');
const jestGlobals = {
  test: global.test,
  it: global.it,
  describe: global.describe,
  expect: global.expect,
  beforeEach: global.beforeEach,
  afterEach: global.afterEach,
  beforeAll: global.beforeAll,
  afterAll: global.afterAll
};

function loadRunner() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  delete global.BareMetal;
  if (global.window) delete global.window.BareMetal;
  return require(SRC);
}

describe('BareMetal.TestRunner', () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    global.test = jestGlobals.test;
    global.it = jestGlobals.it;
    global.describe = jestGlobals.describe;
    global.expect = jestGlobals.expect;
    global.beforeEach = jestGlobals.beforeEach;
    global.afterEach = jestGlobals.afterEach;
    global.beforeAll = jestGlobals.beforeAll;
    global.afterAll = jestGlobals.afterAll;
    delete global.mock;
    delete global.run;
  });

  test('exports the expected public API', () => {
    const Runner = loadRunner();
    expect(Object.keys(Runner)).toEqual([
      'describe',
      'it',
      'test',
      'expect',
      'beforeEach',
      'afterEach',
      'beforeAll',
      'afterAll',
      'mock',
      'run',
      'configure',
      'toTAP',
      'toMarkdown',
      'installGlobals'
    ]);
  });

  test('expect supports core synchronous matchers', () => {
    const Runner = loadRunner();

    expect(() => {
      Runner.expect(3).toBe(3);
      Runner.expect(3).toBeGreaterThan(1);
      Runner.expect(3).toBeLessThanOrEqual(3);
      Runner.expect({ a: [1] }).toEqual({ a: [1] });
      Runner.expect('hello').toContain('ell');
      Runner.expect('hello').toMatch(/hell/);
      Runner.expect('hello').toHaveLength(5);
      Runner.expect({ deep: { value: 2 } }).toHaveProperty('deep.value', 2);
      Runner.expect(null).toBeNull();
      Runner.expect(undefined).toBeUndefined();
      Runner.expect('x').toBeDefined();
      Runner.expect(NaN).toBeNaN();
      Runner.expect(0.3001).toBeCloseTo(0.3, 2);
      Runner.expect(false).toBeFalsy();
      Runner.expect(true).toBeTruthy();
      Runner.expect(2).not.toBe(3);
    }).not.toThrow();
  });

  test('expect supports toThrow and instance checks', () => {
    const Runner = loadRunner();
    class Example {}

    expect(() => {
      Runner.expect(() => {
        throw new Error('boom');
      }).toThrow('boom');
      Runner.expect(new Example()).toBeInstanceOf(Example);
    }).not.toThrow();
  });

  test('expect supports resolves and rejects helpers', async () => {
    const Runner = loadRunner();

    await expect(Runner.expect(Promise.resolve(4)).resolves.toBe(4)).resolves.toBeUndefined();
    await expect(Runner.expect(Promise.resolve({ ok: true })).resolves.toEqual({ ok: true })).resolves.toBeUndefined();
    await expect(Runner.expect(Promise.reject(new Error('bad'))).rejects.toThrow('bad')).resolves.toBeUndefined();
  });

  test('mock.fn records calls, return values and reset state', () => {
    const Runner = loadRunner();
    const spy = Runner.mock.fn((x) => x * 2);

    expect(spy(3)).toBe(6);
    expect(spy.calls).toEqual([[3]]);
    expect(spy.lastCall).toEqual([3]);
    expect(spy.returnValue).toBe(6);

    spy.reset();
    expect(spy.calls).toEqual([]);
    expect(spy.lastCall).toBeNull();
  });

  test('mock.fn stores thrown errors', () => {
    const Runner = loadRunner();
    const spy = Runner.mock.fn(() => {
      throw new Error('explode');
    });

    expect(() => spy()).toThrow('explode');
    expect(spy.error).toBeInstanceOf(Error);
  });

  test('mock.fetch installs predictable fetch responses', async () => {
    const Runner = loadRunner();
    const restore = Runner.mock.fetch({
      '/items': { json: [{ id: 1 }] },
      '/text': { text: 'hello' },
      '*': { body: { fallback: true } }
    });

    await expect(global.fetch('/items').then((res) => res.json())).resolves.toEqual([{ id: 1 }]);
    await expect(global.fetch('/text').then((res) => res.text())).resolves.toBe('hello');
    await expect(global.fetch('/other').then((res) => res.json())).resolves.toEqual({ fallback: true });

    restore();
  });

  test('run executes passing tests and lifecycle hooks in order', async () => {
    const Runner = loadRunner();
    const order = [];

    Runner.describe('suite', () => {
      Runner.beforeAll(() => order.push('beforeAll'));
      Runner.beforeEach(() => order.push('beforeEach'));
      Runner.afterEach(() => order.push('afterEach'));
      Runner.afterAll(() => order.push('afterAll'));
      Runner.it('works', () => order.push('test'));
    });

    const result = await Runner.run({ reporter: {} });

    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
    expect(order).toEqual(['beforeAll', 'beforeEach', 'test', 'afterEach', 'afterAll']);
  });

  test('run reports skipped and pending tests', async () => {
    const Runner = loadRunner();

    Runner.describe('suite', () => {
      Runner.it.skip('skip me', () => {});
      Runner.it('pending');
    });

    const result = await Runner.run({ reporter: {} });

    expect(result.skipped).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.results.map((entry) => entry.status)).toEqual(['skipped', 'pending']);
  });

  test('only mode runs exclusive tests only', async () => {
    const Runner = loadRunner();
    const seen = [];

    Runner.describe('suite', () => {
      Runner.it('normal', () => seen.push('normal'));
      Runner.it.only('only', () => seen.push('only'));
    });

    const result = await Runner.run({ reporter: {} });

    expect(seen).toEqual(['only']);
    expect(result.skipped).toBe(1);
    expect(result.passed).toBe(1);
  });

  test('describe.only limits execution to the selected suite', async () => {
    const Runner = loadRunner();
    const seen = [];

    Runner.describe('outside', () => {
      Runner.it('nope', () => seen.push('outside'));
    });
    Runner.describe.only('inside', () => {
      Runner.it('yep', () => seen.push('inside'));
    });

    const result = await Runner.run({ reporter: {} });

    expect(seen).toEqual(['inside']);
    expect(result.passed).toBe(1);
  });

  test('grep filters tests by name', async () => {
    const Runner = loadRunner();
    Runner.describe('suite', () => {
      Runner.it('alpha test', () => {});
      Runner.it('beta test', () => {});
    });

    const result = await Runner.run({ grep: 'beta', reporter: {} });

    expect(result.passed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.results[1].name).toContain('beta');
  });

  test('bail stops execution after the first failure', async () => {
    const Runner = loadRunner();
    const seen = [];
    Runner.describe('suite', () => {
      Runner.it('fails', () => {
        seen.push('fails');
        throw new Error('boom');
      });
      Runner.it('later', () => seen.push('later'));
    });

    const result = await Runner.run({ bail: true, reporter: {} });

    expect(result.failed).toBe(1);
    expect(seen).toEqual(['fails']);
  });

  test('retries rerun failing tests until they pass', async () => {
    const Runner = loadRunner();
    let attempts = 0;
    Runner.it('flaky', () => {
      attempts++;
      if (attempts < 2) throw new Error('retry');
    });

    const result = await Runner.run({ retries: 1, reporter: {} });

    expect(result.passed).toBe(1);
    expect(result.results[0].attempts).toBe(2);
  });

  test('timeouts fail long-running tests', async () => {
    const Runner = loadRunner();
    Runner.it('slow', () => new Promise(() => {}), 5);

    const result = await Runner.run({ reporter: {} });

    expect(result.failed).toBe(1);
    expect(String(result.results[0].error.message)).toContain('timed out');
  });

  test('slow threshold marks slow tests', async () => {
    const Runner = loadRunner();
    Runner.it('slow test', () => new Promise((resolve) => setTimeout(resolve, 20)), 50);

    const result = await Runner.run({ slow: 5, reporter: {} });

    expect(result.results[0].slow).toBe(true);
  });

  test('reporters receive pass, fail, skip and pending notifications', async () => {
    const Runner = loadRunner();
    const reporter = { pass: jest.fn(), fail: jest.fn(), skip: jest.fn(), pending: jest.fn() };
    Runner.it('pass', () => {});
    Runner.it.skip('skip', () => {});
    Runner.it('pending');
    Runner.it('fail', () => {
      throw new Error('bad');
    });

    const result = await Runner.run({ reporter });

    expect(result.passed).toBe(1);
    expect(result.failed).toBe(1);
    expect(reporter.pass).toHaveBeenCalledTimes(1);
    expect(reporter.fail).toHaveBeenCalledTimes(1);
    expect(reporter.skip).toHaveBeenCalledTimes(1);
    expect(reporter.pending).toHaveBeenCalledTimes(1);
  });

  test('toTAP formats results in TAP output', () => {
    const Runner = loadRunner();
    const tap = Runner.toTAP({
      passed: 1,
      failed: 1,
      skipped: 0,
      pending: 0,
      duration: 10,
      results: [
        { name: 'ok test', status: 'passed' },
        { name: 'bad test', status: 'failed', error: new Error('boom') }
      ]
    });

    expect(tap).toContain('TAP version 13');
    expect(tap).toContain('ok 1 - ok test');
    expect(tap).toContain('not ok 2 - bad test');
  });

  test('toMarkdown formats summaries, failures and slow tests', () => {
    const Runner = loadRunner();
    Runner.configure({ slow: 10 });
    const md = Runner.toMarkdown({
      passed: 1,
      failed: 1,
      skipped: 1,
      pending: 1,
      duration: 20,
      results: [
        { name: 'suite > pass', status: 'passed', duration: 5, attempts: 1 },
        { name: 'suite > fail', status: 'failed', duration: 12, attempts: 2, slow: true, error: new Error('boom') },
        { name: 'suite > skip', status: 'skipped', duration: 0, attempts: 1 },
        { name: 'suite > pending', status: 'pending', duration: 0, attempts: 1 }
      ]
    }, { title: 'Runner Report', timestamp: false });

    expect(md).toContain('# Runner Report');
    expect(md).toContain('⚠️ **1 test(s) failed.**');
    expect(md).toContain('retry ×1');
    expect(md).toContain('## Failures');
    expect(md).toContain('## Slow Tests (>10ms)');
  });

  test('installGlobals installs and restores the public API', () => {
    const Runner = loadRunner();
    const restore = Runner.installGlobals();

    expect(global.describe).toBe(Runner.describe);
    expect(global.mock).toBe(Runner.mock);

    restore();
    expect(global.describe).toBe(jestGlobals.describe);
    expect(global.mock).toBeUndefined();
  });
});
