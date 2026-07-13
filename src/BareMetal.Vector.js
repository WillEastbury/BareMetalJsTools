/**
 * BareMetal.Vector -- in-memory JS vector database: named collections,
 * each combining metadata storage, exact brute-force cosine search,
 * and approximate (HNSW-lite) search behind one cohesive API with
 * post-filter metadata predicates.
 *
 * Frontend mirror of `picovector` (the pico-stack backend equivalent):
 * same collection/mode/metadata/filter shape, so application code
 * written against one translates directly to the other. Where
 * `picovector` delegates to `pico_vecsearch`/`pico_ann`, this module
 * implements both an exact index and a real (simplified) HNSW index
 * directly in JS -- no dependencies, matching every other module in
 * this package.
 *
 * HNSW here is a genuine, from-the-paper (Malkov & Yashunin 2016)
 * multi-layer proximity graph -- not a stub -- ported from picoann's
 * C implementation with the same documented v1 simplifications:
 * "select neighbors simple" (closest-M, not the heuristic variant),
 * soft deletes exclude a node from traversal entirely, and no
 * id/slot reuse after delete.
 */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Vector = (function(root) {
  'use strict';

  var MODE_EXACT = 'exact';
  var MODE_APPROX = 'approx';
  var MAX_LEVEL_HARD_CAP = 16;

  function isFiniteNumber(n) { return typeof n === 'number' && isFinite(n); }

  function toFloatArray(vec) {
    if (!vec || typeof vec.length !== 'number') throw new Error('BareMetal.Vector: vector must be array-like');
    var out = new Array(vec.length);
    var i;
    for (i = 0; i < vec.length; i++) {
      var v = vec[i];
      if (!isFiniteNumber(v)) throw new Error('BareMetal.Vector: vector component ' + i + ' is not a finite number');
      out[i] = v;
    }
    return out;
  }

  function cosineSimilarity(a, b) {
    var dot = 0, na = 0, nb = 0, i;
    var n = Math.min(a.length, b.length);
    for (i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    if (na <= 0 || nb <= 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
  function cosineDist(a, b) { return 1 - cosineSimilarity(a, b); }

  /* Deterministic mulberry32 PRNG -- reproducible index construction,
   * matching picoann's fixed-seed xorshift32 design intent (no
   * dependence on Math.random() so tests/builds are reproducible). */
  function makeRng(seed) {
    var s = seed >>> 0;
    return function() {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------------- *
   * Exact (brute-force) index -- mirrors pico_vecsearch.
   * ---------------------------------------------------------------- */
  function createExactIndex(dims) {
    var store = Object.create(null);
    var count = 0;
    return {
      upsert: function(key, vec) {
        var arr = toFloatArray(vec);
        if (arr.length !== dims) throw new Error('BareMetal.Vector: expected ' + dims + ' dims, got ' + arr.length);
        if (!(key in store)) count++;
        store[key] = arr;
      },
      remove: function(key) {
        if (!(key in store)) return false;
        delete store[key];
        count--;
        return true;
      },
      has: function(key) { return key in store; },
      size: function() { return count; },
      search: function(query, k) {
        var q = toFloatArray(query);
        var scored = [];
        var key;
        for (key in store) {
          if (!Object.prototype.hasOwnProperty.call(store, key)) continue;
          scored.push({ key: key, score: cosineSimilarity(q, store[key]) });
        }
        scored.sort(function(a, b) { return b.score - a.score; });
        return scored.slice(0, k);
      }
    };
  }

  /* ---------------------------------------------------------------- *
   * HNSW-lite approximate index -- mirrors picoann's pico_ann.
   * ---------------------------------------------------------------- */
  function createHnswIndex(dims, opts) {
    opts = opts || {};
    var M = opts.m || 16;
    var Mmax0 = M * 2;
    var efConstruction = opts.efConstruction || 200;
    var mL = 1 / Math.log(M);
    var rng = makeRng(opts.seed || 0x9E3779B9);

    var nodes = [];       /* { key, vec, level, neighbors: [[...ids]], deleted } */
    var keyToId = Object.create(null);
    var entryPoint = -1;
    var entryLevel = -1;
    var liveCount = 0;

    function mmaxForLayer(layer) { return layer === 0 ? Mmax0 : M; }

    function randomLevel() {
      var r = rng();
      if (r <= 0) r = Number.MIN_VALUE;
      var level = Math.floor(-Math.log(r) * mL);
      return level > MAX_LEVEL_HARD_CAP ? MAX_LEVEL_HARD_CAP : level;
    }

    function greedySearchLayer(query, ep, layer) {
      var cur = ep;
      var curDist = cosineDist(query, nodes[cur].vec);
      for (;;) {
        var improved = false;
        var node = nodes[cur];
        if (layer > node.level) break;
        var nbrs = node.neighbors[layer];
        for (var i = 0; i < nbrs.length; i++) {
          var nb = nbrs[i];
          if (nodes[nb].deleted) continue;
          var d = cosineDist(query, nodes[nb].vec);
          if (d < curDist) { cur = nb; curDist = d; improved = true; }
        }
        if (!improved) break;
      }
      return cur;
    }

    /* Beam search at one layer: returns up to `ef` nearest candidates
     * (ascending by distance) starting the frontier from entryIds. */
    function searchLayer(query, entryIds, ef, layer) {
      var visited = Object.create(null);
      var frontier = []; /* sorted ascending by dist */
      var result = [];   /* sorted ascending by dist, capped at ef */

      function insertSorted(arr, cap, item) {
        var pos = arr.length;
        if (pos < cap) {
          arr.push(item);
        } else {
          if (item.dist >= arr[cap - 1].dist) return;
          arr[cap - 1] = item;
          pos = cap - 1;
        }
        while (pos > 0 && arr[pos - 1].dist > item.dist) {
          arr[pos] = arr[pos - 1];
          arr[pos - 1] = item;
          pos--;
        }
      }

      for (var i = 0; i < entryIds.length; i++) {
        var id = entryIds[i];
        if (nodes[id].deleted || visited[id]) continue;
        visited[id] = true;
        var d = cosineDist(query, nodes[id].vec);
        var c = { id: id, dist: d };
        insertSorted(frontier, Math.max(ef * 4, entryIds.length + 4), c);
        insertSorted(result, ef, c);
      }

      var head = 0;
      while (head < frontier.length) {
        var cur = frontier[head++];
        if (result.length >= ef && cur.dist > result[result.length - 1].dist) break;
        var node = nodes[cur.id];
        var nbrs = node.neighbors[layer] || [];
        for (var j = 0; j < nbrs.length; j++) {
          var nb = nbrs[j];
          if (visited[nb]) continue;
          visited[nb] = true;
          if (nodes[nb].deleted) continue;
          var dd = cosineDist(query, nodes[nb].vec);
          if (result.length < ef || dd < result[result.length - 1].dist) {
            var nc = { id: nb, dist: dd };
            insertSorted(frontier, Math.max(ef * 4, entryIds.length + 4), nc);
            insertSorted(result, ef, nc);
          }
        }
      }
      return result;
    }

    function insert(key, vec) {
      var arr = toFloatArray(vec);
      if (arr.length !== dims) throw new Error('BareMetal.Vector: expected ' + dims + ' dims, got ' + arr.length);
      if (key in keyToId) throw new Error('BareMetal.Vector: key "' + key + '" already exists in this HNSW collection (insert-only -- delete then re-insert to replace)');

      var id = nodes.length;
      var level = randomLevel();
      var neighbors = [];
      for (var L = 0; L <= level; L++) neighbors.push([]);
      var node = { key: key, vec: arr, level: level, neighbors: neighbors, deleted: false };
      nodes.push(node);
      keyToId[key] = id;
      liveCount++;

      if (entryPoint === -1) {
        entryPoint = id;
        entryLevel = level;
        return;
      }

      var curEp = entryPoint;
      var L2;
      for (L2 = entryLevel; L2 > level; L2--) curEp = greedySearchLayer(arr, curEp, L2);

      var entryIds = [curEp];
      var topForInsert = Math.min(level, entryLevel);
      for (L2 = topForInsert; L2 >= 0; L2--) {
        var candidates = searchLayer(arr, entryIds, efConstruction, L2);
        var mmax = mmaxForLayer(L2);
        var connectN = Math.min(candidates.length, mmax);
        for (var ci = 0; ci < connectN; ci++) {
          var other = candidates[ci].id;
          node.neighbors[L2].push(other);
          var onode = nodes[other];
          if (L2 <= onode.level) {
            if (onode.neighbors[L2].length < mmax) {
              onode.neighbors[L2].push(id);
            } else {
              var worstIdx = 0, worstDist = -1;
              for (var k = 0; k < onode.neighbors[L2].length; k++) {
                var dk = cosineDist(onode.vec, nodes[onode.neighbors[L2][k]].vec);
                if (dk > worstDist) { worstDist = dk; worstIdx = k; }
              }
              var newDist = cosineDist(onode.vec, arr);
              if (newDist < worstDist) onode.neighbors[L2][worstIdx] = id;
            }
          }
        }
        entryIds = candidates.map(function(c) { return c.id; });
        if (entryIds.length === 0) entryIds = [curEp];
      }

      if (level > entryLevel) { entryPoint = id; entryLevel = level; }
    }

    function remove(key) {
      if (!(key in keyToId)) return false;
      var id = keyToId[key];
      if (nodes[id].deleted) return false;
      nodes[id].deleted = true;
      nodes[id].vec = null;
      delete keyToId[key];
      liveCount--;
      if (id === entryPoint) {
        entryPoint = -1;
        entryLevel = -1;
        for (var i = 0; i < nodes.length; i++) {
          if (!nodes[i].deleted) { entryPoint = i; entryLevel = nodes[i].level; break; }
        }
      }
      return true;
    }

    function search(query, k, efSearch) {
      if (entryPoint === -1 || nodes[entryPoint].deleted) return [];
      var q = toFloatArray(query);
      efSearch = efSearch || Math.max(k, 64);
      var curEp = entryPoint;
      for (var L = entryLevel; L > 0; L--) curEp = greedySearchLayer(q, curEp, L);
      var cap = Math.max(efSearch, k);
      var candidates = searchLayer(q, [curEp], cap, 0);
      return candidates.slice(0, k).map(function(c) {
        return { key: nodes[c.id].key, score: 1 - c.dist };
      });
    }

    return {
      insert: insert,
      remove: remove,
      has: function(key) { return key in keyToId; },
      size: function() { return liveCount; },
      search: search
    };
  }

  /* ---------------------------------------------------------------- *
   * Vector database: named collections + metadata + post-filter.
   * ---------------------------------------------------------------- */
  function createDatabase() {
    var collections = Object.create(null);

    function createCollection(name, dims, mode, opts) {
      if (!name) throw new Error('BareMetal.Vector: collection name is required');
      if (collections[name]) throw new Error('BareMetal.Vector: collection "' + name + '" already exists');
      if (!(dims > 0)) throw new Error('BareMetal.Vector: dims must be a positive integer');
      mode = mode || MODE_EXACT;
      var index = (mode === MODE_APPROX) ? createHnswIndex(dims, opts) : createExactIndex(dims);
      collections[name] = { dims: dims, mode: mode, index: index, meta: Object.create(null) };
      return true;
    }

    function getCollection(name) {
      var c = collections[name];
      if (!c) throw new Error('BareMetal.Vector: unknown collection "' + name + '"');
      return c;
    }

    function upsert(name, key, vec, metadata) {
      var c = getCollection(name);
      var alreadyPresent = key in c.meta;
      c.meta[key] = metadata;
      if (c.mode === MODE_APPROX) {
        if (!alreadyPresent) c.index.insert(key, vec);
        /* else: insert-only for the vector in APPROX mode, matching
         * picovector's documented behavior -- metadata still updates. */
      } else {
        c.index.upsert(key, vec);
      }
      return true;
    }

    function remove(name, key) {
      var c = getCollection(name);
      if (!(key in c.meta)) return false;
      delete c.meta[key];
      c.index.remove(key);
      return true;
    }

    function count(name) {
      var c = getCollection(name);
      return Object.keys(c.meta).length;
    }

    function search(name, query, k, options) {
      options = options || {};
      var c = getCollection(name);
      var overFetchK = options.overFetchK || (k * 4);
      if (overFetchK < k) overFetchK = k;
      var raw = (c.mode === MODE_APPROX) ? c.index.search(query, overFetchK, options.efSearch)
                                        : c.index.search(query, overFetchK);
      var out = [];
      for (var i = 0; i < raw.length && out.length < k; i++) {
        var key = raw[i].key;
        if (!(key in c.meta)) continue; /* deleted between index result and metadata lookup */
        var meta = c.meta[key];
        if (options.filter && !options.filter(meta, key)) continue;
        out.push({ key: key, score: raw[i].score, metadata: meta });
      }
      return out;
    }

    function clear(name) {
      if (name) { delete collections[name]; return; }
      collections = Object.create(null);
    }

    return {
      createCollection: createCollection,
      upsert: upsert,
      remove: remove,
      count: count,
      search: search,
      clear: clear
    };
  }

  var api = {
    createDatabase: createDatabase,
    cosineSimilarity: cosineSimilarity,
    MODE_EXACT: MODE_EXACT,
    MODE_APPROX: MODE_APPROX
  };

  if (root && typeof root === 'object') root.BareMetal = BareMetal;
  return api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
if (typeof window !== 'undefined') window.BareMetal = BareMetal;
if (typeof module !== 'undefined') module.exports = BareMetal.Vector;
