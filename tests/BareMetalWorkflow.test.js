/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.Workflow.js');

function loadWorkflow(extra) {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const fn = new Function(
    'BareMetal', 'fetch', 'localStorage', 'sessionStorage', 'document', 'window', 'navigator', 'CustomEvent', 'setTimeout', 'clearTimeout', 'console',
    code + '\nreturn BareMetal.Workflow;'
  );
  return fn(
    {},
    extra && extra.fetch,
    global.localStorage,
    global.sessionStorage,
    global.document,
    global.window,
    global.navigator,
    global.CustomEvent,
    setTimeout,
    clearTimeout,
    console
  );
}

describe('BareMetal.Workflow', () => {
  test('executes SET, IF, FOR and FOREACH steps', async () => {
    const Workflow = loadWorkflow();
    Workflow.create('smoke', [
      { type: 'SET', name: 'sum', value: 0 },
      { type: 'SET', name: 'nums', value: [1, 2, 3] },
      { type: 'FOR', var: 'i', from: 1, to: 3 },
        { type: 'SET', name: 'sum', expr: 'sum + i' },
      { type: 'END' },
      { type: 'IF', condition: 'sum === 6' },
        { type: 'SET', name: 'status', value: 'ok' },
      { type: 'ELSE' },
        { type: 'SET', name: 'status', value: 'bad' },
      { type: 'END' },
      { type: 'FOREACH', var: 'n', in: 'nums' },
        { type: 'SET', name: 'lastSeen', expr: 'n * 2' },
      { type: 'END' }
    ]);

    const result = await Workflow.run('smoke');
    expect(result).toMatchObject({ sum: 6, status: 'ok', lastSeen: 6, _index: 2 });
  });

  test('collects parallel foreach results with concurrency limits', async () => {
    const Workflow = loadWorkflow();
    const result = await Workflow.exec([
      { type: 'SET', name: 'items', value: [1, 2, 3, 4] },
      { type: 'SET', name: 'delay', value: 1 },
      { type: 'FOREACHP', var: 'item', in: 'items', concurrency: 2 },
        { type: 'WAIT', ms: '${delay}' },
        { type: 'SET', name: 'doubled', expr: 'item * 2' },
      { type: 'END' }
    ]);

    expect(result._results.map((x) => x.doubled)).toEqual([2, 4, 6, 8]);
  });

  test('serializes workflows and renders designer blocks', () => {
    const Workflow = loadWorkflow();
    Workflow.fromJSON('design', JSON.stringify([
      { type: 'SET', name: 'counter', value: 1 },
      { type: 'IF', condition: 'counter > 0' },
      { type: 'END' }
    ]));

    const host = document.createElement('div');
    const ui = Workflow.designer(host, 'design');

    expect(Workflow.list()).toContain('design');
    expect(JSON.parse(Workflow.toJSON('design'))).toHaveLength(3);
    expect(host.querySelectorAll('.bm-wf-step')).toHaveLength(3);
    expect(ui.getSteps()[1]).toEqual(expect.objectContaining({ type: 'IF' }));
  });
});
