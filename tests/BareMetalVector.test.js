/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Vector.js');

function loadVector() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

function makeRandVec(dims, rng) {
  const v = new Array(dims);
  for (let i = 0; i < dims; i++) v[i] = rng() * 2 - 1;
  return v;
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('BareMetal.Vector', () => {
  let Vector;

  beforeEach(() => {
    Vector = loadVector();
  });

  test('createCollection enforces unique names and positive dims', () => {
    const db = Vector.createDatabase();
    expect(db.createCollection('products', 4, Vector.MODE_EXACT)).toBe(true);
    expect(() => db.createCollection('products', 4, Vector.MODE_EXACT)).toThrow(/already exists/);
    expect(() => db.createCollection('bad', 0, Vector.MODE_EXACT)).toThrow(/dims/);
  });

  test('EXACT collection: upsert + metadata + unfiltered/filtered search + overwrite + delete', () => {
    const db = Vector.createDatabase();
    db.createCollection('products', 4, Vector.MODE_EXACT);

    db.upsert('products', 'sku1', [1, 0, 0, 0], { category: 'shoes' });
    db.upsert('products', 'sku2', [0.9, 0.1, 0, 0], { category: 'shoes' });
    db.upsert('products', 'sku3', [0, 1, 0, 0], { category: 'hats' });
    expect(db.count('products')).toBe(3);

    let hits = db.search('products', [1, 0, 0, 0], 3);
    expect(hits).toHaveLength(3);
    expect(hits[0].key).toBe('sku1');
    expect(hits[0].metadata.category).toBe('shoes');

    hits = db.search('products', [1, 0, 0, 0], 3, {
      filter: (meta) => meta.category === 'hats'
    });
    expect(hits).toHaveLength(1);
    expect(hits[0].key).toBe('sku3');

    // overwrite: count unchanged, both vector + metadata update
    db.upsert('products', 'sku3', [1, 0, 0, 0], { category: 'hats-clearance' });
    expect(db.count('products')).toBe(3);
    hits = db.search('products', [1, 0, 0, 0], 3);
    const sku3 = hits.find((h) => h.key === 'sku3');
    expect(sku3.metadata.category).toBe('hats-clearance');
    expect(sku3.score).toBeCloseTo(1, 5);

    expect(db.remove('products', 'sku2')).toBe(true);
    expect(db.remove('products', 'sku2')).toBe(false);
    expect(db.count('products')).toBe(2);
    hits = db.search('products', [1, 0, 0, 0], 3);
    expect(hits.map((h) => h.key)).not.toContain('sku2');
  });

  test('APPROX (HNSW-lite) collection: insert-only-vector semantics, metadata still updates on re-upsert', () => {
    const db = Vector.createDatabase();
    db.createCollection('big', 8, Vector.MODE_APPROX);

    db.upsert('big', 'b1', [1, 0, 0, 0, 0, 0, 0, 0], { cat: 'electronics' });
    db.upsert('big', 'b2', [0, 1, 0, 0, 0, 0, 0, 0], { cat: 'furniture' });
    expect(db.count('big')).toBe(2);

    let hits = db.search('big', [1, 0, 0, 0, 0, 0, 0, 0], 2, { efSearch: 64 });
    expect(hits).toHaveLength(2);
    expect(hits[0].key).toBe('b1');

    // re-upsert updates metadata even though the vector itself is insert-only
    db.upsert('big', 'b1', [1, 0, 0, 0, 0, 0, 0, 0], { cat: 'electronics-updated' });
    expect(db.count('big')).toBe(2);
    hits = db.search('big', [1, 0, 0, 0, 0, 0, 0, 0], 2, { efSearch: 64 });
    expect(hits.find((h) => h.key === 'b1').metadata.cat).toBe('electronics-updated');
  });

  test('searching an unknown collection throws', () => {
    const db = Vector.createDatabase();
    expect(() => db.search('nope', [1, 2], 1)).toThrow(/unknown collection/);
  });

  test('HNSW-lite recall@10 vs exact brute force on a synthetic dataset (>= 80%)', () => {
    const dims = 16;
    const nVectors = 400;
    const nQueries = 30;
    const k = 10;

    const db = Vector.createDatabase();
    db.createCollection('exact', dims, Vector.MODE_EXACT);
    db.createCollection('approx', dims, Vector.MODE_APPROX, { seed: 42 });

    const rng = mulberry32(1234);
    for (let i = 0; i < nVectors; i++) {
      const vec = makeRandVec(dims, rng);
      const key = 'v' + i;
      db.upsert('exact', key, vec, null);
      db.upsert('approx', key, vec, null);
    }

    let totalHits = 0;
    let totalPossible = 0;
    for (let q = 0; q < nQueries; q++) {
      const query = makeRandVec(dims, rng);
      const truth = db.search('exact', query, k);
      const approx = db.search('approx', query, k, { efSearch: 128 });
      const approxKeys = new Set(approx.map((h) => h.key));
      truth.forEach((t) => {
        totalPossible++;
        if (approxKeys.has(t.key)) totalHits++;
      });
    }
    const recall = totalHits / totalPossible;
    // eslint-disable-next-line no-console
    console.log('BareMetal.Vector HNSW-lite recall@' + k + ': ' + (recall * 100).toFixed(1) + '%');
    expect(recall).toBeGreaterThanOrEqual(0.8);
  });
});
