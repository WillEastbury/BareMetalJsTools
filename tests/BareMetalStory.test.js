/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');

function loadStory() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Story.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Story', () => {
  let Story;

  beforeAll(() => {
    Story = loadStory();
  });

  test('exposes default story packs', () => {
    expect(Story.PACKS).toEqual({
      stories: 1,
      nodes: 2,
      choices: 3,
      personas: 4,
      templates: 5,
      user_progress: 6
    });
  });

  test('validateConditions accepts $contains and $gte', () => {
    expect(Story.validateConditions('').ok).toBe(true);
    expect(Story.validateConditions('{"inventory":{"$contains":"a strip of colour"}}').value.inventory.$contains).toBe('a strip of colour');
    expect(Story.validateConditions('{"reputation":{"$gte":2}}').ok).toBe(true);
    expect(Story.validateConditions('{"flag":{"$eq":true}}').ok).toBe(false);
  });

  test('validateEffects accepts named ops', () => {
    const ok = Story.validateEffects('[{"op":"add_item","item":"a painted key"}]');
    expect(ok.ok).toBe(true);
    expect(ok.value[0].item).toBe('a painted key');
    expect(Story.validateEffects('[{"op":"teleport"}]').ok).toBe(false);
  });

  test('validateTriggers require template and to', () => {
    expect(Story.validateTriggers('[{"template":"yard-letter","to":"the courtyard"}]').ok).toBe(true);
    expect(Story.validateTriggers('[{"template":"yard-letter"}]').ok).toBe(false);
  });

  test('validateBaseFacts stores an object', () => {
    expect(Story.validateBaseFacts('').value).toEqual({});
    expect(Story.validateBaseFacts('{"notice":"the wet paint"}').value.notice).toBe('the wet paint');
    expect(Story.validateBaseFacts('[]').ok).toBe(false);
  });

  test('graphData links options to target keys', () => {
    const data = Story.graphData(
      [{ id: 1, key: 'yard', text: 'start' }, { id: 2, key: 'glow', text: 'end', is_ending: true }],
      [{ id: 10, node_id: 1, label: 'Light the lantern', target_node_key: 'glow' }]
    );
    expect(data.nodes.map(function (n) { return n.id; }).sort()).toEqual(['n1', 'n2']);
    expect(data.edges[0]).toMatchObject({ source: 'n1', target: 'n2', label: 'Light the lantern' });
  });
});
