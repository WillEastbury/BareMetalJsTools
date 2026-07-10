/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const WP_PATH = path.resolve(__dirname, '../src/BareMetal.WorkflowPico.js');
const PS_PATH = path.resolve(__dirname, '../src/BareMetal.PicoScript.js');

function load(src) {
  jest.resetModules();
  delete require.cache[require.resolve(src)];
  return require(src);
}

function loadWP() { return load(WP_PATH); }
function loadPS() { return load(PS_PATH); }

// Decode the trailing 4-byte big-endian int emitted by the English `Print`.
function tail(output) {
  const b = output.slice(-4);
  return ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) | 0;
}

describe('WorkflowPico – source generation', () => {
  let WP;
  beforeEach(() => { WP = loadWP(); });

  test('lowers SET/FOR/IF/ELSE/LOG to indented English', () => {
    const { source } = WP.compile([
      { type: 'SET', name: 'sum', value: 0 },
      { type: 'FOR', var: 'i', from: 1, to: 5, step: 1 },
      { type: 'SET', name: 'sum', expr: 'sum + i' },
      { type: 'END' },
      { type: 'IF', condition: 'sum >= 15' },
      { type: 'SET', name: 'status', value: 1 },
      { type: 'ELSE' },
      { type: 'SET', name: 'status', value: 2 },
      { type: 'END' },
      { type: 'LOG', message: 'status' }
    ]);
    expect(source).toContain('Set sum to 0.');
    expect(source).toContain('For each i from 1 to 5 by 1:');
    expect(source).toContain('    Set sum to sum plus i.');
    expect(source).toContain('If sum is at least 15:');
    expect(source).toContain('Otherwise:');
    expect(source).toContain('Print status.');
  });

  test('translates JS operators to English word operators', () => {
    const { source } = WP.compile([
      { type: 'SET', name: 'r', expr: 'a == 1 && b != 2 || c === 3' }
    ]);
    expect(source.trim()).toBe('Set r to a is 1 and b is not 2 or c is 3.');
  });

  test('translates arithmetic and comparison words', () => {
    expect(WP.compile([{ type: 'SET', name: 'x', expr: 'a * b - c / d % e' }]).source.trim())
      .toBe('Set x to a times b minus c divided by d modulo e.');
    expect(WP.compile([{ type: 'IF', condition: 'x > 1', }, { type: 'END' }]).source)
      .toContain('If x is greater than 1:');
    expect(WP.compile([{ type: 'IF', condition: 'x <= 1', }, { type: 'END' }]).source)
      .toContain('If x is at most 1:');
  });

  test('emits negative literals with a word subtraction form', () => {
    const { source } = WP.compile([{ type: 'SET', name: 'x', value: -5 }]);
    expect(source.trim()).toBe('Set x to (0 minus 5).');
  });

  test('sanitizes invalid identifiers', () => {
    const { source } = WP.compile([{ type: 'SET', name: 'a$b', value: 1 }]);
    expect(source.trim()).toBe('Set a_b to 1.');
  });

  test('empty blocks get a no-op filler statement', () => {
    const { source } = WP.compile([
      { type: 'IF', condition: 'x is 1' },
      { type: 'END' }
    ]);
    expect(source).toContain('    Set _nop to 0.');
  });

  test('${expr} in SET value is treated as an expression', () => {
    const { source } = WP.compile([{ type: 'SET', name: 'y', value: '${a + 1}' }]);
    expect(source.trim()).toBe('Set y to (a plus 1).');
  });

  test('accepts a registered workflow name via BareMetal.Workflow', () => {
    const WF = load(path.resolve(__dirname, '../src/BareMetal.Workflow.js'));
    // WorkflowPico reads its own module-scoped BareMetal namespace, so it does
    // not see this Workflow instance; passing an array is the supported path.
    WF.create('demo', [{ type: 'SET', name: 'x', value: 1 }]);
    const steps = WF.get('demo');
    expect(WP.compile(steps).source.trim()).toBe('Set x to 1.');
  });
});

describe('WorkflowPico – warnings for non-representable steps', () => {
  let WP;
  beforeEach(() => { WP = loadWP(); });

  test('WEB/LOAD/SAVE/CALL lower to annotated comments with warnings', () => {
    const { source, warnings } = WP.compile([
      { type: 'WEB', method: 'get', url: '/api/x', result: 'resp' },
      { type: 'LOAD', name: 'cfg', from: 'localStorage', key: 'k' },
      { type: 'SAVE', name: 'n', to: 'localStorage', key: 'k' },
      { type: 'CALL', workflow: 'other' }
    ]);
    expect(source).toContain('# WEB GET /api/x -> resp');
    expect(source).toContain('# LOAD cfg <- localStorage [k]');
    expect(source).toContain('# SAVE n -> localStorage [k]');
    expect(source).toContain('# CALL other');
    expect(warnings).toHaveLength(4);
  });

  test('WAIT lowers to Timer.After with a warning', () => {
    const { source, warnings } = WP.compile([{ type: 'WAIT', ms: 50 }]);
    expect(source.trim()).toBe('Timer.After(50).');
    expect(warnings.join(' ')).toMatch(/WAIT/);
  });

  test('FOREACH over a literal array materializes into Memory and iterates values', () => {
    const { source, warnings } = WP.compile([
      { type: 'FOREACH', var: 'item', in: '[10,20,30]' },
      { type: 'SET', name: 's', expr: 's + item' },
      { type: 'END' }
    ]);
    expect(source).toContain('Memory.Set(8192, 10).');
    expect(source).toContain('Memory.Set(8194, 30).');
    expect(source).toContain('For each _fe0 from 0 to 2:');
    expect(source).toContain('Set item to Memory.Get(8192 plus _fe0).');
    expect(warnings).toHaveLength(0);
  });

  test('unsupported step types become comments', () => {
    const { source, warnings } = WP.compile([{ type: 'NONSENSE' }]);
    expect(source).toContain('# NONSENSE (unsupported step type)');
    expect(warnings.join(' ')).toMatch(/Unsupported/);
  });

  test('stray END/ELSE are reported', () => {
    const a = WP.compile([{ type: 'END' }]);
    expect(a.warnings.join(' ')).toMatch(/END without/);
    const b = WP.compile([{ type: 'ELSE' }]);
    expect(b.warnings.join(' ')).toMatch(/ELSE without/);
  });
});

describe('WorkflowPico – compile + run on the PicoScript VM', () => {
  let WP, ps;
  beforeEach(() => { WP = loadWP(); ps = loadPS(); });

  function run(steps) { return WP.run(steps, { pico: ps }); }

  test('toWords throws without a PicoScript instance', () => {
    expect(() => WP.toWords([{ type: 'SET', name: 'x', value: 1 }])).toThrow(/PicoScript/);
  });

  test('sum of 1..5 with a conditional resolves correctly', () => {
    const r = run([
      { type: 'SET', name: 'sum', value: 0 },
      { type: 'FOR', var: 'i', from: 1, to: 5 },
      { type: 'SET', name: 'sum', expr: 'sum + i' },
      { type: 'END' },
      { type: 'IF', condition: 'sum >= 15' },
      { type: 'SET', name: 'out', value: 7 },
      { type: 'ELSE' },
      { type: 'SET', name: 'out', value: 9 },
      { type: 'END' },
      { type: 'LOG', message: 'out' }
    ]);
    expect(tail(r.output)).toBe(7);
    expect(r.words.length).toBeGreaterThan(0);
  });

  test('nested loops multiply iteration counts', () => {
    const r = run([
      { type: 'SET', name: 'c', value: 0 },
      { type: 'FOR', var: 'i', from: 1, to: 2 },
      { type: 'FOR', var: 'j', from: 1, to: 3 },
      { type: 'SET', name: 'c', expr: 'c + 1' },
      { type: 'END' },
      { type: 'END' },
      { type: 'LOG', message: 'c' }
    ]);
    expect(tail(r.output)).toBe(6);
  });

  test('&& / != / == translate and evaluate', () => {
    const r = run([
      { type: 'SET', name: 'a', value: 1 },
      { type: 'SET', name: 'r', value: 0 },
      { type: 'IF', condition: 'a == 1 && a != 2' },
      { type: 'SET', name: 'r', value: 42 },
      { type: 'END' },
      { type: 'LOG', message: 'r' }
    ]);
    expect(tail(r.output)).toBe(42);
  });

  test('FOREACH over an array variable sums element VALUES', () => {
    const r = run([
      { type: 'SET', name: 'data', value: [10, 20, 30] },
      { type: 'SET', name: 's', value: 0 },
      { type: 'FOREACH', var: 'item', in: 'data' },
      { type: 'SET', name: 's', expr: 's + item' },
      { type: 'END' },
      { type: 'LOG', message: 's' }
    ]);
    expect(tail(r.output)).toBe(60); // 10 + 20 + 30 (values, not indices)
  });

  test('FOREACH over an inline literal array sums VALUES', () => {
    const r = run([
      { type: 'SET', name: 's', value: 0 },
      { type: 'FOREACH', var: 'v', in: '[3,4,5]' },
      { type: 'SET', name: 's', expr: 's + v' },
      { type: 'END' },
      { type: 'LOG', message: 's' }
    ]);
    expect(tail(r.output)).toBe(12);
  });

  test('LOAD from variable + SAVE/LOAD memory round-trip', () => {
    const r = run([
      { type: 'SET', name: 'a', value: 41 },
      { type: 'LOAD', name: 'b', from: 'variable', key: 'a + 1' },
      { type: 'SAVE', name: 'b', to: 'memory', key: 100 },
      { type: 'LOAD', name: 'c', from: 'memory', key: 100 },
      { type: 'LOG', message: 'c' }
    ]);
    expect(tail(r.output)).toBe(42);
  });
});

describe('WorkflowPico – designer integration', () => {
  let WP;
  beforeEach(() => { WP = loadWP(); });

  test('attachToDesigner adds a button and dispatches bm:workflow-pico', () => {
    const element = document.createElement('div');
    const toolbar = document.createElement('div');
    toolbar.className = 'bm-wf-toolbar';
    element.appendChild(toolbar);
    const controller = {
      element,
      getSteps: () => [{ type: 'SET', name: 'x', value: 1 }]
    };

    let received = null;
    element.addEventListener('bm:workflow-pico', (e) => { received = e.detail; });

    const btn = WP.attachToDesigner(controller, { onResult: () => {} });
    expect(btn).not.toBeNull();
    expect(toolbar.contains(btn)).toBe(true);
    expect(btn.textContent).toBe('Compile to PicoScript');

    btn.onclick();
    expect(received).not.toBeNull();
    expect(received.source).toContain('Set x to 1.');
    expect(Array.isArray(received.warnings)).toBe(true);
  });

  test('attachToDesigner returns null without a valid controller', () => {
    expect(WP.attachToDesigner(null)).toBeNull();
    expect(WP.attachToDesigner({})).toBeNull();
  });
});
