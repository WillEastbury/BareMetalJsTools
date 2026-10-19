/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');

function loadPlay() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Play.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Play', () => {
  let Play;

  beforeAll(() => {
    Play = loadPlay();
  });

  test('exposes default story packs', () => {
    expect(Play.PACKS).toEqual({
      stories: 1,
      nodes: 2,
      choices: 3,
      personas: 4,
      templates: 5,
      user_progress: 6
    });
  });

  test('empty conditions pass and unknown operators fail', () => {
    expect(Play.matchConditions({}, null)).toBe(true);
    expect(Play.matchConditions({}, '')).toBe(true);
    expect(Play.matchConditions({ inventory: ['a strip of colour'] }, { inventory: { $contains: 'a strip of colour' } })).toBe(true);
    expect(Play.matchConditions({ inventory: [] }, { inventory: { $contains: 'a strip of colour' } })).toBe(false);
    expect(Play.matchConditions({ reputation: 5 }, { reputation: { $gte: 5 } })).toBe(true);
    expect(Play.matchConditions({ reputation: 4 }, { reputation: { $gte: 5 } })).toBe(false);
    expect(Play.matchConditions({}, { flag: { $eq: true } })).toBe(false);
  });

  test('applyEffects mutates inventory and numeric vars', () => {
    const next = Play.applyEffects(Play.freshState(), [
      { op: 'add_item', item: 'a painted key' },
      { op: 'add_item', item: 'a painted key' },
      { op: 'add', var: 'reputation', value: 2 },
      { op: 'set', var: 'has_spoken', value: true },
      { op: 'append', var: 'log', value: 'took the walk' },
      { op: 'remove_item', item: 'a painted key' }
    ]);
    expect(next.inventory).toEqual(['a painted key']);
    expect(next.reputation).toBe(2);
    expect(next.has_spoken).toBe(true);
    expect(next.log).toEqual(['took the walk']);
  });

  test('fillText replaces dotted placeholders', () => {
    const text = Play.fillText(
      'You notice {{state.facts.notice}}. You hold {{state.inventory}}. For {{to}}.',
      { state: { facts: { notice: 'the wet paint' }, inventory: [] }, to: 'the courtyard' }
    );
    expect(text).toBe('You notice the wet paint. You hold nothing. For the courtyard.');
  });

  test('sceneText prefers generated_texts then fills authored Markdown', () => {
    const node = { key: 'yard', text: 'Air is {{persona.base_facts.weather}}.' };
    expect(Play.sceneText(node, { generated_texts: { yard: 'Cached scene.' } }, null)).toBe('Cached scene.');
    expect(Play.sceneText(node, { state: {} }, { base_facts: { weather: 'damp and still' } })).toBe('Air is damp and still.');
  });

  test('entryNode prefers untargeted starts whose conditions match', () => {
    const nodes = [
      { id: 2, key: 'glow', conditions: null },
      { id: 1, key: 'yard', conditions: null }
    ];
    const choices = [{ target_node_key: 'glow' }];
    expect(Play.entryNode(nodes, choices, Play.freshState()).key).toBe('yard');
  });

  test('offeredChoices hide gated targets', () => {
    const node = { id: 1, key: 'walk' };
    const nodes = [
      node,
      { id: 2, key: 'door-end', conditions: { inventory: { $contains: 'a painted key' } } },
      { id: 3, key: 'knock-end' }
    ];
    const choices = [
      { id: 1, node_id: 1, label: 'Open the narrow door', target_node_key: 'door-end', conditions: { inventory: { $contains: 'a painted key' } } },
      { id: 2, node_id: 1, label: 'Knock and wait', target_node_key: 'knock-end' }
    ];
    const empty = Play.offeredChoices(node, nodes, choices, Play.freshState());
    expect(empty.map(function (c) { return c.label; })).toEqual(['Knock and wait']);
    const keyed = Play.offeredChoices(node, nodes, choices, { inventory: ['a painted key'] });
    expect(keyed.map(function (c) { return c.label; })).toEqual(['Open the narrow door', 'Knock and wait']);
  });

  test('slipsFor renders a trigger against a template', () => {
    const slips = Play.slipsFor(
      { key: 'yard', triggers: [{ template: 'yard-letter', to: 'the courtyard' }] },
      [{ key: 'yard-letter', channel: 'email', subject: 'The courtyard', body: 'For {{to}}. You hold {{state.inventory}}.' }],
      { state: Play.freshState(), history: [] },
      { base_facts: {} }
    );
    expect(slips).toHaveLength(1);
    expect(slips[0].channel).toBe('email');
    expect(slips[0].to).toBe('the courtyard');
    expect(slips[0].body).toBe('For the courtyard. You hold nothing.');
  });

  test('memoryClient seeds rows and allocates the next id', async () => {
    const client = Play.memoryClient({
      stories: [{ id: 1, title: 'The Paper Lantern' }]
    });
    const listed = await client.list(Play.PACKS.stories);
    expect(listed[0].title).toBe('The Paper Lantern');
    const id = await client.create(Play.PACKS.stories, { title: 'Saltglass Station' });
    expect(id).toBe(2);
    await client.put(Play.PACKS.stories, 2, { title: 'Saltglass' });
    const again = await client.list(Play.PACKS.stories);
    expect(again.map(function (row) { return row.title; })).toEqual(['The Paper Lantern', 'Saltglass']);
  });

  test('withPersonaFacts copies protagonist facts once', () => {
    const personas = [
      { story_id: 1, role: 'narrator', base_facts: { sign: 'Told by the yard.' } },
      { story_id: 1, role: 'protagonist', base_facts: { notice: 'the wet paint' } }
    ];
    const merged = Play.withPersonaFacts(Play.freshState(), personas, 1);
    expect(merged.facts.notice).toBe('the wet paint');
    expect(merged.facts.sign).toBeUndefined();
    expect(Play.narratorOf(personas, 1).role).toBe('narrator');
  });
});
