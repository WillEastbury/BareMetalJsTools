/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

function loadSearch() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Search.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
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

describe('branch coverage - Search', () => {
  test('empty queries pagination sorting and clear index cover guard branches', () => {
    const Search = loadSearch();
    const index = Search.createIndex({ fields: ['title', 'body', 'category'], stemming: false });
    index.addAll([
      { id: '1', title: 'Gamma', body: 'third', category: 'c' },
      { id: '2', title: 'Alpha', body: 'first', category: 'a' },
      { id: '3', title: 'Beta', body: 'second', category: 'b' }
    ], 'id');

    expect(index.search('', { limit: 2, offset: 0 }).results).toHaveLength(2);
    expect(index.search('', { limit: 2, offset: 2 }).results).toHaveLength(1);
    expect(index.search('missing', { sort: 'title:asc' })).toEqual({ results: [], total: 0, facets: {} });
    expect(index.search('', { sort: 'title:asc' }).results.map((item) => item.id)).toEqual(['2', '3', '1']);
    expect(index.search('', { sort: '-title' }).results.map((item) => item.id)).toEqual(['1', '3', '2']);

    index.remove('nope');
    index.clear();
    expect(index.stats()).toEqual(expect.objectContaining({ docCount: 0, termCount: 0, avgDocLength: 0 }));
    expect(index.search('').results).toEqual([]);
  });

  test('special chars case sensitivity filters field queries and highlights cover alternative paths', () => {
    const Search = loadSearch();
    const sensitive = Search.createIndex({ fields: ['title', 'body'], caseSensitive: true, stopWords: false });
    sensitive.addAll([
      { id: 'A', title: 'Alpha', body: 'MiXeD body', category: ['tech', 'code'] },
      { id: 'B', title: 'alpha', body: 'mixed body', category: ['docs'] }
    ], 'id');

    expect(sensitive.search('mixed').results.map((item) => item.id)).toEqual(['B']);

    const insensitive = Search.createIndex({ fields: ['title', 'body'], caseSensitive: false, stopWords: false });
    insensitive.addAll([
      { id: 'A', title: 'Alpha', body: 'MiXeD body', category: ['tech', 'code'] },
      { id: 'B', title: 'alpha', body: 'mixed body', category: ['docs'] }
    ], 'id');
    expect(insensitive.search('mixed').results.map((item) => item.id)).toEqual(expect.arrayContaining(['A', 'B']));

    const html = Search.highlight('<b>C++</b> guide', ['C++'], { tag: 'em', contextWords: 1, maxLength: 20 });
    expect(html).toContain('<em>C++</em>');

    const indexed = Search.createIndex({ fields: ['title', 'body'], stemming: false });
    indexed.addAll([
      { id: '1', title: 'Regex guide', body: 'special chars .* and []', category: ['tech'] },
      { id: '2', title: 'Plain text', body: 'nothing to see', category: ['misc'] }
    ], 'id');
    expect(indexed.search('category:tech', { fields: ['title', 'body'] }).results.map((item) => item.id)).toEqual(['1']);
    expect(indexed.search('guide', { filter: { category: 'tech' } }).results.map((item) => item.id)).toEqual(['1']);
    expect(indexed.search('guide', { filter: { category: 'missing' } }).total).toBe(0);
  });

  test('pipeline query parsing suggestions import and similarity cover remaining branches', () => {
    const Search = loadSearch();
    const synonymPipe = Search.pipeline([Search.pipeline.synonym({ fast: ['quick'] })]);
    const ngramPipe = Search.pipeline([Search.pipeline.ngram(2)]);

    expect(synonymPipe('fast')).toEqual(['fast', 'quick']);
    expect(ngramPipe('one two three')).toEqual(expect.arrayContaining(['one', 'two', 'three', 'one two', 'two three']));
    expect(Search.query.parse('')).toEqual(expect.objectContaining({ clauses: [], groups: [{ include: [], exclude: [] }], hasOr: false }));

    const index = Search.createIndex({ fields: ['title', 'body'], stemming: true });
    index.addAll([
      { id: '1', title: 'Search systems', body: 'Find better results quickly' },
      { id: '2', title: 'Finder tools', body: 'Search result ranking' }
    ], 'id');

    expect(index.suggest('serch', { fuzzy: 1, limit: 5 })[0]).toEqual(expect.objectContaining({ term: 'search' }));
    expect(index.suggest('serch', { field: 'unknown', fuzzy: 1 })).toEqual([]);
    expect(index.filter((doc) => doc.title.indexOf('Search') > -1)).toEqual(['1']);
    expect(index.filter(() => { throw new Error('skip'); })).toEqual([]);
    expect(index.similar('missing')).toEqual([]);

    const restored = Search.createIndex({ fields: ['ignored'] });
    restored.import({ config: { fields: [] }, docs: [{ id: 'x', title: 'Hello', body: 'World' }] });
    expect(restored.options().fields).toEqual(['title', 'body']);
    expect(restored.search('hello').results.map((item) => item.id)).toEqual(['x']);
  });
});
