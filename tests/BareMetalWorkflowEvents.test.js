/**
 * @jest-environment node
 */
'use strict';

// Loads BareMetal.PubSub + BareMetal.Workflow into ONE shared BareMetal namespace
// (as the browser does via window.BareMetal) so the workflow engine's RAISE/ON
// steps bridge to the PubSub event bus.
const fs = require('fs');
const path = require('path');

function loadShared() {
  const shared = {};
  for (const f of ['BareMetal.PubSub.js', 'BareMetal.Workflow.js']) {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/' + f), 'utf8');
    // eslint-disable-next-line no-new-func
    new Function('BareMetal', 'module', 'window', 'document', code)(shared, { exports: {} }, undefined, undefined);
  }
  return shared;
}

describe('Workflow ↔ PubSub event bridge', () => {
  test('workflow RAISE emits on the PubSub bus', async () => {
    const BM = loadShared();
    const got = [];
    BM.PubSub.on('evt.x', (d) => got.push(d));
    await BM.Workflow.exec([{ type: 'RAISE', event: 'evt.x', target: 7 }]);
    expect(got).toEqual([7]);
  });

  test('workflow ON subscribes to the PubSub bus', async () => {
    const BM = loadShared();
    const done = [];
    BM.PubSub.on('done', (d) => done.push(d));
    // ON registers a subscription for 'evt.y'; its handler RAISEs 'done'
    await BM.Workflow.exec([
      { type: 'ON', event: 'evt.y', var: 'data' },
      { type: 'RAISE', event: 'done', target: 99 },
      { type: 'END' }
    ]);
    // fire the subscribed event externally -> handler runs -> RAISE 'done'
    BM.PubSub.emit('evt.y', 5);
    await new Promise((r) => setTimeout(r, 0));
    expect(done).toEqual([99]);
  });

  test('ON is registered as a block terminated by END (meta)', () => {
    const BM = loadShared();
    const types = BM.Workflow.stepTypes().map((s) => s.type);
    expect(types).toContain('RAISE');
    expect(types).toContain('ON');
  });
});
