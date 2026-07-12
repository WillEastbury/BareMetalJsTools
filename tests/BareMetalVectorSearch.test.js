/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.VectorSearch.js');

function loadVectorSearch() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

describe('BareMetal.VectorSearch', () => {
  let VectorSearch;

  beforeEach(() => {
    VectorSearch = loadVectorSearch();
  });

  test('cosineSimilarity matches known values, including the zero-vector safe case', () => {
    expect(VectorSearch.cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 6);
    expect(VectorSearch.cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 6);
    expect(VectorSearch.cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(VectorSearch.cosineSimilarity([0, 0], [1, 2])).toBe(0);
    expect(Number.isNaN(VectorSearch.cosineSimilarity([0, 0], [0, 0]))).toBe(false);
  });

  test('createIndex enforces a runtime-configured, per-index dimension count', () => {
    const idx = VectorSearch.createIndex(4);
    expect(idx.dims()).toBe(4);
    expect(() => idx.upsert('a', [1, 2, 3])).toThrow(/dims/);
    expect(idx.upsert('a', [1, 2, 3, 4])).toBe(true);

    const idx2 = VectorSearch.createIndex(2);
    expect(idx2.dims()).toBe(2);
    idx2.upsert('x', [1, 1]);
    expect(idx2.size()).toBe(1);
  });

  test('upsert/get/has/remove/size/clear basic CRUD', () => {
    const idx = VectorSearch.createIndex(3);
    expect(idx.size()).toBe(0);
    idx.upsert('one', [1, 0, 0]);
    idx.upsert('two', [0, 1, 0]);
    expect(idx.size()).toBe(2);
    expect(idx.has('one')).toBe(true);
    expect(idx.get('one')).toEqual([1, 0, 0]);
    expect(idx.get('missing')).toBeNull();

    // overwrite existing key does not change count
    idx.upsert('one', [2, 0, 0]);
    expect(idx.size()).toBe(2);
    expect(idx.get('one')).toEqual([2, 0, 0]);

    expect(idx.remove('one')).toBe(true);
    expect(idx.remove('one')).toBe(false);
    expect(idx.size()).toBe(1);

    idx.clear();
    expect(idx.size()).toBe(0);
    expect(idx.has('two')).toBe(false);
  });

  test('topK returns exact cosine-ranked results, sorted descending, capped at k', () => {
    const idx = VectorSearch.createIndex(8);
    idx.upsert('identical', [1, 2, 3, 4, 5, 6, 7, 8]);
    idx.upsert('scaled', [2, 4, 6, 8, 10, 12, 14, 16]); // same direction -> ties "identical" at 1.0
    idx.upsert('opposite', [-1, -2, -3, -4, -5, -6, -7, -8]);
    idx.upsert('zero', [0, 0, 0, 0, 0, 0, 0, 0]);
    idx.upsert('random1', [3, 1, 4, 1, 5, 9, 2, 6]);
    idx.upsert('random2', [2, 7, 1, 8, 2, 8, 1, 8]);

    const all = idx.topK([1, 2, 3, 4, 5, 6, 7, 8], 6);
    expect(all).toHaveLength(6);
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].score).toBeGreaterThanOrEqual(all[i].score);
    }
    const topTwoKeys = [all[0].key, all[1].key].sort();
    expect(topTwoKeys).toEqual(['identical', 'scaled']);
    expect(all[0].score).toBeCloseTo(1, 6);
    expect(all[all.length - 1].key).toBe('opposite');
    expect(all[all.length - 1].score).toBeCloseTo(-1, 6);

    const capped = idx.topK([1, 2, 3, 4, 5, 6, 7, 8], 2);
    expect(capped).toHaveLength(2);

    // query with fewer stored vectors than k -> returns what's available
    const smallIdx = VectorSearch.createIndex(2);
    smallIdx.upsert('only', [1, 1]);
    expect(smallIdx.topK([1, 1], 10)).toHaveLength(1);
  });

  test('topK against a zero-vector query returns score 0 for every hit, never NaN', () => {
    const idx = VectorSearch.createIndex(3);
    idx.upsert('a', [1, 2, 3]);
    idx.upsert('b', [-1, -2, -3]);
    const hits = idx.topK([0, 0, 0], 2);
    expect(hits).toHaveLength(2);
    hits.forEach((h) => {
      expect(h.score).toBe(0);
      expect(Number.isNaN(h.score)).toBe(false);
    });
  });

  test('removed vectors are excluded from subsequent topK results', () => {
    const idx = VectorSearch.createIndex(2);
    idx.upsert('a', [1, 0]);
    idx.upsert('b', [0, 1]);
    idx.remove('a');
    const hits = idx.topK([1, 0], 5);
    expect(hits.map((h) => h.key)).not.toContain('a');
  });

  test('rejects non-finite vector components', () => {
    const idx = VectorSearch.createIndex(2);
    expect(() => idx.upsert('bad', [1, NaN])).toThrow();
    expect(() => idx.upsert('bad', [1, Infinity])).toThrow();
  });
});
