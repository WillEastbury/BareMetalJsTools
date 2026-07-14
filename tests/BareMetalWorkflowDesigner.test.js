/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

// The christmas-tree workflow Designer canvas lives on BareMetal.Workflow.Designer
// (merged from the former standalone BareMetal.FlowCanvas module).
const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.Workflow.js');

function load() {
  delete require.cache[SRC];
  return require(SRC).Designer;
}

const SNIPPET = [
  { type: 'SET', name: 'data', value: [10, 20, 30, 40] },
  { type: 'SET', name: 'sum', value: 0 },
  { type: 'FOREACH', var: 'item', in: 'data' },
  { type: 'SET', name: 'sum', expr: 'sum + item' },
  { type: 'END' },
  { type: 'IF', condition: 'sum >= 50' },
  { type: 'LOG', message: 'sum' },
  { type: 'END' }
];

describe('BareMetal.Workflow.Designer', () => {
  let FC;
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    FC = load();
  });

  test('parseTree -> serialize round-trips the flat step list', () => {
    const tree = FC.parseTree(SNIPPET);
    expect(FC.serialize(tree)).toEqual(SNIPPET);
  });

  test('IF/ELSE nesting round-trips with END + ELSE markers', () => {
    const steps = [
      { type: 'IF', condition: 'x > 0' },
      { type: 'LOG', message: 'pos' },
      { type: 'ELSE' },
      { type: 'LOG', message: 'neg' },
      { type: 'END' }
    ];
    const tree = FC.parseTree(steps);
    expect(tree.length).toBe(1);
    expect(tree[0].slots.then.length).toBe(1);
    expect(tree[0].slots.else.length).toBe(1);
    expect(FC.serialize(tree)).toEqual(steps);
  });

  test('create() renders a palette, nodes and nested branch drop-zones', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const fc = FC.create(host, { steps: SNIPPET });
    // palette present with a chip per type
    expect(host.querySelectorAll('.fc-palette .fc-chip').length).toBeGreaterThan(5);
    // top-level nodes: 2 SET + FOREACH + IF = 4
    const rootSeq = host.querySelector('.fc-canvas > .fc-seq');
    const topNodes = Array.from(rootSeq.children).filter((c) => c.classList.contains('fc-node'));
    expect(topNodes.length).toBe(4);
    // block boxes contain nested seqs (drop-zones inside boxes)
    const foreach = host.querySelector('.fc-node[data-type="FOREACH"]');
    expect(foreach.querySelector('.fc-slots .fc-seq')).toBeTruthy();
    // IF has two branches (then + else)
    const iff = host.querySelector('.fc-node[data-type="IF"]');
    expect(iff.querySelectorAll('.fc-branch').length).toBe(2);
    // CSS injected once
    expect(document.getElementById('bm-flowcanvas-css')).toBeTruthy();
    fc.destroy();
  });

  test('block nodes render as fc-block (christmas-tree head + fan-out branches)', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const fc = FC.create(host, { steps: SNIPPET });
    const iff = host.querySelector('.fc-node[data-type="IF"]');
    expect(iff.classList.contains('fc-block')).toBe(true);
    const setNode = host.querySelector('.fc-node[data-type="SET"]');
    expect(setNode.classList.contains('fc-block')).toBe(false);
    fc.destroy();
  });

  test('enum-aware suggestions: IF condition offers method options when a request method var is in scope', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const fc = FC.create(host, { steps: [
      { type: 'LOAD', name: 'method', from: 'request', field: 'method' },
      { type: 'IF', condition: 'method is 2' },
      { type: 'RESPOND', status: 201 },
      { type: 'END' }
    ] });
    const cond = host.querySelector('.fc-node[data-type="IF"] .fc-fields input');
    const listId = cond.getAttribute('list');
    expect(listId).toBeTruthy();
    const dl = host.querySelector('datalist#' + listId);
    const values = Array.from(dl.querySelectorAll('option')).map((o) => o.value);
    expect(values).toContain('method is 2');   // POST
    expect(values).toContain('method is 1');   // GET
    fc.destroy();
  });

  test('namespace toolbox: lists implemented methods grouped by namespace and inserts a CALLNS box on click', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const namespaces = {
      Net: [{ method: 'Status', code: '0x1', impl: true }, { method: 'Planned', code: '0x2', impl: false }],
      Storage: [{ method: 'Load', code: '0x3', impl: true }]
    };
    const fc = FC.create(host, { steps: [], namespaces });
    // toolbox renders both namespaces, only implemented methods as chips
    const groups = host.querySelectorAll('.fc-toolbox .fc-tb-group');
    expect(groups.length).toBe(2);
    const chips = host.querySelectorAll('.fc-toolbox .fc-tb-chip');
    expect(chips.length).toBe(2);   // Net.Status + Storage.Load (Net.Planned is unimplemented, excluded)
    // clicking a chip inserts a CALLNS box pre-filled with Namespace.Method()
    const netStatusChip = Array.from(chips).find((c) => c.getAttribute('data-method') === 'Status');
    netStatusChip.click();
    expect(fc.getSteps()).toEqual([{ type: 'CALLNS', call: 'Net.Status()' }]);
    fc.destroy();
  });

  test('namespace toolbox: filter narrows visible chips and groups without touching the model', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const namespaces = { Net: [{ method: 'Status', code: '0x1', impl: true }], Storage: [{ method: 'Load', code: '0x3', impl: true }] };
    const fc = FC.create(host, { steps: [], namespaces });
    const search = host.querySelector('.fc-tb-search');
    search.value = 'stor';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const netChip = host.querySelector('.fc-tb-group[data-ns="Net"] .fc-tb-chip');
    const storageChip = host.querySelector('.fc-tb-group[data-ns="Storage"] .fc-tb-chip');
    expect(netChip.style.display).toBe('none');
    expect(storageChip.style.display).not.toBe('none');
    expect(fc.getSteps()).toEqual([]);   // filtering never mutates the step model
    fc.destroy();
  });

  test('editing an input updates the model and fires onChange', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let last = null;
    const fc = FC.create(host, { steps: [{ type: 'SET', name: 'sum', value: 0 }], onChange: (s) => { last = s; } });
    const input = host.querySelectorAll('.fc-node[data-type="SET"] .fc-fields input')[1];
    input.value = '42';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fc.getSteps()[0]).toEqual({ type: 'SET', name: 'sum', value: 42 });
    expect(last[0].value).toBe(42);
  });

  test('SET value/expr field distinguishes literals from expressions', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const fc = FC.create(host, { steps: [{ type: 'SET', name: 'sum', value: 0 }] });
    const valInput = host.querySelectorAll('.fc-node[data-type="SET"] .fc-fields input')[1];
    valInput.value = 'sum + item';
    valInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fc.getSteps()[0]).toEqual({ type: 'SET', name: 'sum', expr: 'sum + item' });
    valInput.value = '[1,2,3]';
    valInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fc.getSteps()[0]).toEqual({ type: 'SET', name: 'sum', value: [1, 2, 3] });
  });

  test('addNode / removeNode / moveNode mutate the tree and emit', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let count = 0;
    const fc = FC.create(host, { steps: SNIPPET, onChange: () => { count++; } });

    // add a LOG at root
    const id = fc.addNode('LOG', null, null, 0);
    expect(fc.getSteps()[0].type).toBe('LOG');
    expect(count).toBe(1);

    // move it inside the FOREACH body
    const foreachId = host.querySelector('.fc-node[data-type="FOREACH"]').getAttribute('data-id');
    expect(fc.moveNode(id, foreachId, 'body', 0)).toBe(true);
    const tree = FC.parseTree(fc.getSteps());
    const fe = tree.find((n) => n.type === 'FOREACH');
    expect(fe.slots.body.some((n) => n.type === 'LOG')).toBe(true);

    // cannot move a block into its own body
    expect(fc.moveNode(foreachId, foreachId, 'body', 0)).toBe(false);

    // remove it
    fc.removeNode(id);
    expect(fc.getSteps().some((s) => s.type === 'LOG' && s.message === undefined)).toBe(false);
  });
});
