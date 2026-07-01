/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.Workflow.js');

function loadWorkflow(extra) {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Workflow.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
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

describe('BareMetal.Workflow additional coverage', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete global.fetch;
    delete global.BareMetal;
    jest.restoreAllMocks();
  });

  test('supports LOAD SAVE WEB CALL hooks logging and error handling', async () => {
    const Workflow = loadWorkflow();
    const stepTypes = [];
    const errors = [];
    const completed = [];
    const offStep = Workflow.onStep((payload) => stepTypes.push(payload.step.type));
    Workflow.onError((payload) => errors.push(payload.error.message));
    Workflow.onComplete((payload) => completed.push(payload.context));
    Workflow.create('child-flow', [
      { type: 'SET', name: 'childResult', expr: 'seed + 1' }
    ]);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ remote: true }) })
      .mockResolvedValueOnce({
        status: 201,
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve('{"saved":true}')
      });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await Workflow.exec([
      { type: 'SET', name: 'seed', value: 1 },
      { type: 'SET', name: 'copySource', value: { count: 2 } },
      { type: 'SAVE', name: 'seed', to: 'sessionStorage', key: 'saved-seed' },
      { type: 'LOAD', name: 'sessionValue', from: 'sessionStorage', key: 'saved-seed' },
      { type: 'SAVE', name: 'copySource', to: 'localStorage', key: 'saved-obj' },
      { type: 'LOAD', name: 'localValue', from: 'localStorage', key: 'saved-obj' },
      { type: 'SAVE', name: 'copySource', to: 'variable', key: 'shadow' },
      { type: 'LOAD', name: 'copyValue', from: 'variable', key: 'copySource' },
      { type: 'LOAD', name: 'remoteValue', from: 'json', url: '/wf.json' },
      { type: 'WEB', method: 'POST', url: '/wf', headers: { 'X-Seed': '${seed}' }, body: { seed: '${seed}' }, result: 'webResult' },
      { type: 'CALL', workflow: 'child-flow', args: { seed: '${seed}' } },
      { type: 'LOG', level: 'warn', message: 'Seed ${seed}' },
      { type: 'WAIT', ms: '${1}' },
      { type: 'LOAD', name: 'badLoad', from: 'unknown', key: 'x' },
      { type: 'SAVE', name: 'seed', to: 'unknown', key: 'x' },
      { type: 'MYSTERY' }
    ], {});

    offStep();
    expect(sessionStorage.getItem('saved-seed')).toBe('1');
    expect(localStorage.getItem('saved-obj')).toBe(JSON.stringify({ count: 2 }));
    expect(result).toMatchObject({
      sessionValue: 1,
      localValue: { count: 2 },
      shadow: { count: 2 },
      copyValue: { count: 2 },
      remoteValue: { remote: true },
      webResult: { saved: true },
      childResult: 2,
      _status: 201,
      _ok: true
    });
    expect(global.fetch.mock.calls[1][1].headers['X-Seed']).toBe(1);
    expect(global.fetch.mock.calls[1][1].body).toBe(JSON.stringify({ seed: 1 }));
    expect(stepTypes).toEqual(expect.arrayContaining(['LOAD', 'SAVE', 'WEB', 'CALL', 'LOG', 'WAIT']));
    expect(errors).toEqual(expect.arrayContaining([
      'Unknown LOAD source: unknown',
      'Unknown SAVE target: unknown',
      'Unknown step type: MYSTERY'
    ]));
    expect(completed).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith('Seed 1');
  });

  test('designer supports add edit reorder export run and destroy flows', async () => {
    const Workflow = loadWorkflow();
    Workflow.create('designer-flow', [{ type: 'SET', name: 'count', value: 1 }]);
    const host = document.createElement('div');
    document.body.appendChild(host);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue() }
    });
    const prompt = jest.spyOn(window, 'prompt')
      .mockReturnValueOnce(JSON.stringify({ type: 'SET', name: 'name', value: 'Alice' }))
      .mockReturnValueOnce('not json')
      .mockReturnValueOnce('');
    const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const ui = Workflow.designer(host, 'designer-flow');
    const runEvent = new Promise((resolve) => ui.element.addEventListener('bm:workflow-run', resolve, { once: true }));
    const exportSpy = jest.fn();
    ui.element.addEventListener('bm:workflow-export', exportSpy);

    const buttons = host.querySelectorAll('button');
    buttons[0].click();
    expect(ui.getSteps()).toHaveLength(2);

    host.querySelector('.bm-wf-edit').click();
    expect(alert).toHaveBeenCalled();

    const rows = host.querySelectorAll('.bm-wf-step');
    rows[0].dispatchEvent(new Event('dragstart', { bubbles: true }));
    rows[1].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    expect(ui.getSteps()[0].name).toBe('name');

    buttons[1].click();
    await runEvent;
    buttons[2].click();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('"type"'));
    expect(exportSpy).toHaveBeenCalled();
    expect(Workflow.stepTypes().map((step) => step.type)).toEqual(expect.arrayContaining(['SET', 'WEB', 'CALL']));
    expect(Workflow.remove('designer-flow')).toBe(true);
    expect(Workflow.remove('designer-flow')).toBe(false);
    expect(Workflow.designer(null, 'missing')).toBeNull();

    ui.destroy();
    expect(host.querySelector('.bm-wf-designer')).toBeNull();
    expect(prompt).toHaveBeenCalled();
  });
});

describe('branch coverage - Workflow', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete global.fetch;
    delete global.BareMetal;
    jest.restoreAllMocks();
  });

  test('covers error-oriented execution branches and optional hooks', async () => {
    localStorage.setItem('raw-text', 'plain text');
    const Workflow = loadWorkflow();
    const stepTypes = [];
    const errors = [];
    const completions = [];

    expect(typeof Workflow.onStep(null)).toBe('function');
    Workflow.onStep((payload) => stepTypes.push(payload.step.type || ''));
    Workflow.onError((payload) => errors.push(payload.error.message));
    Workflow.onComplete((payload) => completions.push(payload));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        status: 204,
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve('not-json')
      })
      .mockRejectedValueOnce(new Error('network down'));

    Workflow.create('not-array', null);
    expect(Workflow.get('not-array')).toEqual([]);
    await expect(Workflow.run('missing-flow')).rejects.toThrow('Workflow not found: missing-flow');

    const result = await Workflow.exec([
      { type: 'SET', name: 'count', value: 1 },
      { type: 'SET', name: 'computedLiteral', value: '${count + 1}' },
      { type: 'SET', name: 'copied', value: { nested: ['${count}', true] } },
      { type: 'IF', condition: 'false' },
        { type: 'SET', name: 'shouldSkip', value: true },
      { type: 'END' },
      { type: 'IF', condition: 'true' },
      { type: 'END' },
      { type: 'FOR', var: 'i', from: 3, to: 1, step: -1 },
        { type: 'SET', name: 'lastLoop', expr: 'i' },
      { type: 'END' },
      { type: 'FOR', var: 'broken', from: 0, to: 1, step: 0 },
        { type: 'SET', name: 'never', value: true },
      { type: 'END' },
      { type: 'FOREACH', var: 'entry', in: 'missingList' },
        { type: 'SET', name: 'neverForeach', value: true },
      { type: 'END' },
      { type: 'FOREACHP', var: 'entry', in: '[]', concurrency: 0 },
        { type: 'SET', name: 'neverParallel', value: true },
      { type: 'END' },
      { type: 'LOAD', name: 'rawText', from: 'localStorage', key: 'raw-text' },
      { type: 'SAVE', name: 'count', to: 'variable', target: 'shadowCount' },
      { type: 'WEB', method: 'HEAD', url: '/head', body: 'ignored', result: 'headResult' },
      { type: 'WEB', method: 'POST', url: '/fail', body: 'plain-body', result: 'postResult' },
      { type: '' },
      { type: 'ELSE' },
      { type: 'END' }
    ], { seed: 1 });

    expect(result).toMatchObject({
      count: 1,
      computedLiteral: 2,
      copied: { nested: [1, true] },
      lastLoop: 1,
      rawText: 'plain text',
      shadowCount: 1,
      headResult: 'not-json',
      _ok: false,
      _status: 204,
      _results: []
    });
    expect(result.shouldSkip).toBeUndefined();
    expect(stepTypes).toEqual(expect.arrayContaining(['FOR', 'FOREACH', 'FOREACHP', 'WEB']));
    expect(errors).toEqual(expect.arrayContaining(['FOR step cannot be 0', 'network down']));
    expect(completions).toHaveLength(1);
  });

  test('covers designer export and workflow error events', async () => {
    const Workflow = loadWorkflow();
    const prompt = jest.spyOn(window, 'prompt')
      .mockReturnValueOnce(JSON.stringify({ type: 'SET', name: 'value', value: 'ok' }))
      .mockReturnValueOnce(null)
      .mockImplementation((_title, json) => json);

    Workflow.create('draft', []);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ui = Workflow.designer(host, 'draft');

    host.querySelectorAll('button')[0].click();
    expect(ui.getSteps()).toEqual([{ type: 'SET', name: 'value', value: 'ok' }]);
    host.querySelector('.bm-wf-edit').click();
    host.querySelector('.bm-wf-edit').click();

    const errorHost = document.createElement('div');
    document.body.appendChild(errorHost);
    const errorUi = Workflow.designer(errorHost);
    const errorEvent = new Promise((resolve) => errorUi.element.addEventListener('bm:workflow-error', resolve, { once: true }));
    errorHost.querySelectorAll('button')[1].click();
    await errorEvent;
    host.querySelectorAll('button')[2].click();
    host.querySelectorAll('button')[2].click();

    expect(prompt).toHaveBeenCalled();

    ui.destroy();
    errorUi.destroy();
  });
});
