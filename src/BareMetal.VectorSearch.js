/**
 * BareMetal.VectorSearch -- exact float32 cosine-similarity top-K
 * vector search, for the browser/frontend side of the pico stack.
 *
 * Mirrors `picovec`'s `pico_vecsearch` shape (upsert/delete/topK,
 * runtime-configurable dimension count, safe zero-vector handling)
 * so the same embedding-vector search semantics work identically on
 * a picoweb/picowal backend and in a browser client (e.g. client-side
 * re-ranking of a small already-fetched candidate set, or an
 * entirely offline/local-only search index for a PWA).
 *
 * This is a DIFFERENT primitive from BareMetal.Search's `similar()`
 * helper: BareMetal.Search builds its own TF-IDF term-frequency
 * vectors internally from indexed text fields, whereas
 * BareMetal.VectorSearch stores and searches arbitrary externally-
 * supplied float vectors (e.g. real embeddings from an embedding
 * model call), the same way pico_vecsearch does not care where its
 * vectors come from.
 *
 * No dependencies. UMD-style export (root.BareMetal + module.exports)
 * matching every other module in this package.
 */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.VectorSearch = (function(root) {
  'use strict';

  function isFiniteNumber(n) { return typeof n === 'number' && isFinite(n); }

  function toFloatArray(vec) {
    if (!vec || typeof vec.length !== 'number') throw new Error('BareMetal.VectorSearch: vector must be array-like');
    var out = new Array(vec.length);
    var i;
    for (i = 0; i < vec.length; i++) {
      var v = vec[i];
      if (!isFiniteNumber(v)) throw new Error('BareMetal.VectorSearch: vector component ' + i + ' is not a finite number');
      out[i] = v;
    }
    return out;
  }

  /* Cosine similarity, computed exactly the same way as picovec.c's
   * cosine_sim: dot(a,b) / (||a|| * ||b||), with the same safe
   * zero-vector handling (score 0, never NaN/Infinity from a 0/0
   * division). */
  function cosineSimilarity(a, b) {
    var dot = 0, na = 0, nb = 0, i;
    var n = Math.min(a.length, b.length);
    for (i = 0; i < n; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na <= 0 || nb <= 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  /**
   * Creates an in-memory vector index for vectors of exactly `dims`
   * components. Unlike a fixed compile-time dimension constant, this
   * is a per-index runtime parameter -- different indexes (e.g. one
   * per embedding model) can coexist with different dimensionality,
   * matching pico_vecsearch_open's contract.
   */
  function createIndex(dims) {
    if (!(dims > 0)) throw new Error('BareMetal.VectorSearch.createIndex: dims must be a positive integer');
    dims = Math.floor(dims);
    var store = Object.create(null); /* key -> float array */
    var count = 0;

    function upsert(key, vec) {
      if (key == null) throw new Error('BareMetal.VectorSearch: key is required');
      key = String(key);
      var arr = toFloatArray(vec);
      if (arr.length !== dims) {
        throw new Error('BareMetal.VectorSearch: expected ' + dims + ' dims, got ' + arr.length);
      }
      if (!(key in store)) count++;
      store[key] = arr;
      return true;
    }

    function remove(key) {
      key = String(key);
      if (!(key in store)) return false;
      delete store[key];
      count--;
      return true;
    }

    function has(key) { return String(key) in store; }

    function get(key) {
      key = String(key);
      return (key in store) ? store[key].slice() : null;
    }

    function size() { return count; }

    function clear() {
      store = Object.create(null);
      count = 0;
    }

    /**
     * Exact brute-force top-K: scores every stored vector against
     * `query` by cosine similarity, returns the `k` highest-scoring
     * entries sorted descending by score -- [{ key, score }, ...].
     * Returns fewer than `k` entries if the index holds fewer than
     * `k` vectors. `query` must have exactly `dims` components.
     */
    function topK(query, k) {
      var q = toFloatArray(query);
      if (q.length !== dims) throw new Error('BareMetal.VectorSearch: query expected ' + dims + ' dims, got ' + q.length);
      k = (k == null) ? 10 : Math.max(1, Math.floor(k));
      var scored = [];
      var key;
      for (key in store) {
        if (!Object.prototype.hasOwnProperty.call(store, key)) continue;
        scored.push({ key: key, score: cosineSimilarity(q, store[key]) });
      }
      scored.sort(function(a, b) { return b.score - a.score; });
      return scored.slice(0, k);
    }

    return {
      upsert: upsert,
      remove: remove,
      has: has,
      get: get,
      size: size,
      clear: clear,
      topK: topK,
      dims: function() { return dims; }
    };
  }

  var api = {
    createIndex: createIndex,
    cosineSimilarity: cosineSimilarity
  };

  if (root && typeof root === 'object') root.BareMetal = BareMetal;
  return api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
if (typeof window !== 'undefined') window.BareMetal = BareMetal;
if (typeof module !== 'undefined') module.exports = BareMetal.VectorSearch;
