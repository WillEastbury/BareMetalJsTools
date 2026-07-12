/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.Report.js');

function loadReport() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

describe('BareMetal.Report – layout engine', () => {
  let R;
  beforeEach(() => { R = loadReport(); });

  const TMPL = {
    title: 'Orders',
    columns: [{ label: 'Qty', field: 0, width: 5 }, { label: 'Price', field: 1, width: 6 }],
    aggregates: [{ column: 0, fn: 'sum' }, { column: 1, fn: 'max' }]
  };

  test('renderText produces title, header and aggregate footer', () => {
    const lines = R.renderText([2, 10, 3, 20, 1, 50], TMPL).split('\n');
    expect(lines[0]).toBe('Orders');
    expect(lines[1]).toMatch(/^Qty/);
    expect(lines.filter(Boolean).pop()).toContain('sum=6');
    expect(lines.filter(Boolean).pop()).toContain('max=50');
  });

  test('renderHtml report mode builds a table with footer', () => {
    const html = R.renderHtml([1, 2, 3], { columns: [{ label: 'V', field: 0 }], aggregates: [{ column: 0, fn: 'sum' }] }, 'report');
    expect(html).toContain('<table class="pico-report">');
    expect(html).toContain('<th>V</th>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('sum=6');
  });

  test('renderHtml form mode builds editable inputs (editable:false -> output)', () => {
    const html = R.renderHtml([2, 10], { columns: [{ label: 'Qty', field: 0 }, { label: 'Price', field: 1, editable: false }] }, 'form');
    expect(html).toContain('<form class="pico-form">');
    expect(html).toMatch(/<input[^>]*data-field="0"/);
    expect(html).toContain('<output data-field="1"');
  });

  test('aggregate functions', () => {
    const t = fn => R.renderText([4, 2, 6, 8], { columns: [{ label: 'N', field: 0 }], aggregates: [{ column: 0, fn }] }).split('\n').filter(Boolean).pop();
    expect(t('count')).toBe('count=4');
    expect(t('sum')).toBe('sum=20');
    expect(t('min')).toBe('min=2');
    expect(t('max')).toBe('max=8');
    expect(t('avg')).toBe('avg=5');
  });
});

describe('BareMetal.Report – DOM render + form write-back', () => {
  let R;
  beforeEach(() => { R = loadReport(); });

  test('render() injects a report table into the container', () => {
    const el = document.createElement('div');
    const ctl = R.render(el, [1, 2, 3, 4], { columns: [{ label: 'A', field: 0 }, { label: 'B', field: 1 }] }, { mode: 'report' });
    expect(el.querySelector('table.pico-report')).not.toBeNull();
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(ctl.form).toBeNull();
  });

  test('render() form mode exposes collect() and write-back helpers', () => {
    const el = document.createElement('div');
    const ctl = R.render(el, [2, 10, 3, 20], { columns: [{ label: 'Qty', field: 0 }, { label: 'Price', field: 1 }] }, { mode: 'form' });
    expect(ctl.form).not.toBeNull();
    // edit the first Qty input
    const input = el.querySelector('input[data-row="0"][data-field="0"]');
    input.value = '99';
    const rows = ctl.collect();
    expect(rows).toEqual([[99, 10], [3, 20]]);
    expect(R.flatten(rows)).toEqual([99, 10, 3, 20]);
    const writes = R.toWrites(rows, { base: 8192 });
    expect(writes[8192]).toBe(99); // row0 field0
    expect(writes[8195]).toBe(20); // row1 field1
  });
});

describe('BareMetal.Report – visual designer', () => {
  let R;
  beforeEach(() => { R = loadReport(); });

  test('designer() renders a toolbar, column rows and a live preview', () => {
    const el = document.createElement('div');
    const d = R.designer(el, {
      data: [1, 2, 3, 4],
      template: { title: 'T', mode: 'report', columns: [{ label: 'A', field: 0 }, { label: 'B', field: 1 }], aggregates: [{ column: 0, fn: 'sum' }] }
    });
    expect(el.querySelector('.bm-report-designer')).not.toBeNull();
    expect(el.querySelectorAll('.bm-report-col').length).toBe(2);
    expect(el.querySelector('.bm-report-preview table.pico-report')).not.toBeNull();
    expect(d.getTemplate().columns.length).toBe(2);
  });

  test('designer emits bm:report-change and reflects template edits', () => {
    const el = document.createElement('div');
    let last = null;
    el.addEventListener('bm:report-change', e => { last = e.detail; });
    const d = R.designer(el, { data: [5, 6], template: { mode: 'report', columns: [{ label: 'A', field: 0 }] } });
    d.setTemplate({ mode: 'form', columns: [{ label: 'X', field: 0 }] });
    expect(last).not.toBeNull();
    expect(last.mode).toBe('form');
    expect(el.querySelector('form.pico-form')).not.toBeNull();
  });

  test('designer setData updates the preview', () => {
    const el = document.createElement('div');
    const d = R.designer(el, { template: { mode: 'report', columns: [{ label: 'N', field: 0 }], aggregates: [{ column: 0, fn: 'sum' }] } });
    d.setData([10, 20, 30]);
    expect(d.getData()).toEqual([10, 20, 30]);
    expect(el.querySelector('.bm-report-text').textContent).toContain('sum=60');
  });

  test('designer renders the stage-1 data-source picker', () => {
    const el = document.createElement('div');
    R.designer(el, { source: { kind: 'rest', url: '/api/x' }, template: { columns: [{ label: 'A', field: 0 }] } });
    const sel = el.querySelector('.bm-report-bar select');
    // two selects exist (mode + source); the source picker offers rest/workflow/pico
    const opts = Array.from(el.querySelectorAll('.bm-report-bar select option')).map(o => o.value);
    expect(opts).toEqual(expect.arrayContaining(['literal', 'rest', 'workflow', 'pico']));
  });
});

describe('BareMetal.Report – loadData (stage-1 sources)', () => {
  let R;
  beforeEach(() => { R = loadReport(); });
  afterEach(() => { delete global.fetch; });

  test('literal source resolves to its values', async () => {
    await expect(R.loadData({ kind: 'literal', values: [1, 2, 3] })).resolves.toEqual([1, 2, 3]);
    await expect(R.loadData([4, 5, 6])).resolves.toEqual([4, 5, 6]);
  });

  test('function source resolves (sync or async)', async () => {
    await expect(R.loadData({ kind: 'function', fn: () => [7, 8] })).resolves.toEqual([7, 8]);
    await expect(R.loadData({ kind: 'function', fn: async () => [9] })).resolves.toEqual([9]);
  });

  test('rest source fetches JSON and flattens numbers in order', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ a: [1, 2], b: 3, c: { d: 4 } }) }));
    await expect(R.loadData({ kind: 'rest', url: '/api/x' })).resolves.toEqual([1, 2, 3, 4]);
    expect(global.fetch).toHaveBeenCalledWith('/api/x');
  });

  test('unknown source kind rejects', async () => {
    await expect(R.loadData({ kind: 'nonsense' })).rejects.toThrow(/unknown data source/);
  });

  test('workflow source runs a WorkflowPico program and decodes VM ints', () => {
    // load PicoScript + WorkflowPico + Report into ONE shared BareMetal namespace
    const fs = require('fs');
    const shared = {};
    for (const f of ['BareMetal.PicoScript.js', 'BareMetal.WorkflowPico.js', 'BareMetal.Report.js']) {
      const code = fs.readFileSync(path.resolve(__dirname, '../src/' + f), 'utf8');
      // eslint-disable-next-line no-new-func
      new Function('BareMetal', 'module', 'window', 'document', code)(shared, { exports: {} }, undefined, undefined);
    }
    return shared.Report.loadData({
      kind: 'workflow',
      steps: [
        { type: 'SET', name: 'sum', value: 0 },
        { type: 'FOR', var: 'i', from: 1, to: 5 },
        { type: 'SET', name: 'sum', expr: 'sum + i' },
        { type: 'END' },
        { type: 'LOG', message: 'sum' }
      ]
    }).then((rows) => { expect(rows).toEqual([15]); });
  });
});
