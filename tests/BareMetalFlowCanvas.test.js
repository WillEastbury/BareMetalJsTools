/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.FlowCanvas.js');

function load() {
  delete require.cache[SRC];
  return require(SRC);
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

describe('BareMetal.FlowCanvas', () => {
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
    const input = host.querySelector('.fc-node[data-type="SET"] .fc-fields input:nth-child(1)') ||
      host.querySelectorAll('.fc-node[data-type="SET"] .fc-fields input')[1];
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
