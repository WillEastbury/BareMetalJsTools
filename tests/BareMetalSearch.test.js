/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadSearch() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Search.js'), 'utf8');
  const fn = new Function('BareMetal', 'module', 'window', code + '\nreturn BareMetal.Search;');
  const window = {};
  return fn({}, { exports: {} }, window);
}

describe('BareMetal.Search', () => {
  let Search;
  let index;

  beforeEach(() => {
    Search = loadSearch();
    index = Search.createIndex({ fields: ['title', 'body'], stemming: true });
    index.addAll([
      { id: '1', title: 'JavaScript search basics', body: 'Learn search indexing and ranked query results', category: 'tech' },
      { id: '2', title: 'Search advanced scoring', body: 'Search search ranking and scoring relevance', category: 'tech' },
      { id: '3', title: 'Cooking pasta guide', body: 'Boil water and add pasta for dinner', category: 'food' },
      { id: '4', title: 'Prefix trees for autocomplete', body: 'Autocomplete suggestions start with prefix terms', category: 'tech' }
    ], 'id');
  });

  test('add/search basic flow returns matches and highlights', () => {
    const result = index.search('search basics', { limit: 5 });

    expect(result.total).toBeGreaterThan(0);
    expect(result.results[0].id).toBe('1');
    expect(result.results[0].highlights.title).toContain('<mark>search</mark>');
  });

  test('tf-idf scoring ranks more relevant docs higher', () => {
    const result = index.search('search', { limit: 5 });

    expect(result.results[0].id).toBe('2');
    expect(result.results[0].score).toBeGreaterThan(result.results[1].score);
  });

  test('fuzzy matching tolerates small typos', () => {
    const result = index.search('serch', { fuzzy: 1, limit: 5 });

    expect(result.results.map((item) => item.id)).toContain('1');
  });

  test('prefix search expands matching terms', () => {
    const result = index.search('auto', { prefix: true, limit: 5 });

    expect(result.results[0].id).toBe('4');
  });

  test('facets return counts on matching result sets', () => {
    const result = index.search('search', { facets: ['category'], limit: 10 });

    expect(result.facets.category).toEqual([{ value: 'tech', count: 2 }]);
    expect(index.facets('category')).toEqual([
      { value: 'tech', count: 3 },
      { value: 'food', count: 1 }
    ]);
  });

  test('highlight marks matching terms', () => {
    const html = Search.highlight('Hello search world for searchers', ['search'], { contextWords: 2, maxLength: 40 });
    expect(html).toContain('<mark>search</mark>');
  });

  test('query parser handles AND OR NOT phrases and fields', () => {
    const parsed = Search.query.parse('title:"hello world" OR category:tech -spam NOT eggs');

    expect(parsed.groups).toHaveLength(2);
    expect(parsed.groups[0].include[0]).toEqual(expect.objectContaining({ field: 'title', phrase: true, value: 'hello world' }));
    expect(parsed.groups[1].include[0]).toEqual(expect.objectContaining({ field: 'category', value: 'tech' }));
    expect(parsed.groups[1].exclude).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 'spam', negated: true }),
      expect.objectContaining({ value: 'eggs', negated: true })
    ]));
  });

  test('suggest returns autocomplete terms', () => {
    const suggestions = index.suggest('sear', { limit: 5 });

    expect(suggestions[0]).toEqual(expect.objectContaining({ term: 'search' }));
    expect(suggestions[0].count).toBeGreaterThan(0);
  });

  test('export and import round-trip preserves results', () => {
    const snapshot = index.export();
    const restored = Search.createIndex({ fields: ['title', 'body'], stemming: true });
    restored.import(snapshot);

    expect(restored.search('ranking scoring', { limit: 5 }).results[0].id).toBe('2');
    expect(restored.stats().docCount).toBe(4);
  });

  test('stemmer handles basic suffixes', () => {
    expect(Search.stem('running')).toBe('run');
    expect(Search.stem('cats')).toBe('cat');
  });

  test('field boost changes ranking', () => {
    index.add('5', { title: 'Tiny title', body: 'search search search search', category: 'tech' });
    const noBoost = index.search('search', { limit: 5 });
    const boosted = index.search('search', { boost: { title: 5 }, limit: 5 });

    expect(noBoost.results[0].id).toBe('5');
    expect(boosted.results[0].id).toBe('2');
  });

  test('remove and update change the index', () => {
    index.remove('3');
    expect(index.search('pasta', { limit: 5 }).total).toBe(0);

    index.update('1', { id: '1', title: 'Distributed search', body: 'clustered index replicas', category: 'tech' });
    const result = index.search('distributed', { limit: 5 });
    expect(result.results[0].id).toBe('1');
  });

  test('similar finds related documents', () => {
    const result = index.similar('1', { limit: 3 });

    expect(result[0].id).toBe('2');
    expect(result[0].score).toBeGreaterThan(0);
  });
});
