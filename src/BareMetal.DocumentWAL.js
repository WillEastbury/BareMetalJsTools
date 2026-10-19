/* BareMetal.DocumentWAL — op log, merge, compact, undo/redo, change stream. */
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.DocumentWAL = (function () {
  "use strict";

  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

  function getPath(obj, path) {
    var parts = String(path || "").split(".");
    var cur = obj, i;
    for (i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function setPath(obj, path, value) {
    var parts = String(path || "").split(".");
    var next = clone(obj == null ? {} : obj);
    var cur = next, i, key;
    if (!parts[0]) return next;
    for (i = 0; i < parts.length - 1; i++) {
      key = parts[i];
      if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
      cur = cur[key];
    }
    key = parts[parts.length - 1];
    if (value === undefined) delete cur[key];
    else cur[key] = clone(value);
    return next;
  }

  function memoryTransport(seed) {
    var docs = seed && typeof seed === "object" ? clone(seed) : {};
    function bucket(id) {
      if (!docs[id]) docs[id] = { seq: 0, snapshot: {}, ops: [] };
      return docs[id];
    }
    return {
      push: function (docId, ops) {
        var b = bucket(docId);
        (ops || []).forEach(function (op) {
          b.seq += 1;
          op.seq = b.seq;
          b.ops.push(clone(op));
          b.snapshot = setPath(b.snapshot, op.path, op.value);
        });
        return Promise.resolve({ seq: b.seq, ops: clone(ops) });
      },
      pull: function (docId, since) {
        var b = bucket(docId);
        var from = Number(since) || 0;
        return Promise.resolve({
          seq: b.seq,
          snapshot: clone(b.snapshot),
          ops: b.ops.filter(function (op) { return op.seq > from; }).map(clone)
        });
      },
      compact: function (docId, snapshot, seq) {
        var b = bucket(docId);
        b.snapshot = clone(snapshot || b.snapshot);
        if (typeof seq === "number") b.seq = seq;
        b.ops = b.ops.filter(function (op) { return op.seq > b.seq; });
        return Promise.resolve({ seq: b.seq, snapshot: clone(b.snapshot) });
      }
    };
  }

  function httpTransport(root) {
    var base = String(root || "").replace(/\/$/, "");
    function req(method, path, body) {
      var opts = { method: method, headers: {} };
      if (body !== undefined) {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body);
      }
      return fetch(base + path, opts).then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error(t || res.statusText); });
        if (res.status === 204) return null;
        var type = res.headers.get("content-type") || "";
        if (type.indexOf("application/json") < 0) return null;
        return res.json();
      });
    }
    function packRows(pack) {
      return req("GET", "/list/" + pack).then(function (body) {
        return ((body && body.records) || []).map(function (rec) {
          var data = rec.data;
          if (typeof data === "string") data = JSON.parse(data);
          if (!data || typeof data !== "object") return null;
          data.id = rec.record;
          return data;
        }).filter(Boolean);
      });
    }
    return {
      push: function (docId, ops) {
        var chain = Promise.resolve();
        var last = 0;
        (ops || []).forEach(function (op) {
          chain = chain.then(function () {
            return req("POST", "/2", { doc: docId, path: op.path, value: op.value, prev: op.prev, client: op.client, ts: op.ts, kind: op.kind || "set" }).then(function (body) {
              last = body.record;
              op.seq = last;
            });
          });
        });
        return chain.then(function () { return { seq: last, ops: ops }; });
      },
      pull: function (docId, since) {
        return packRows(2).then(function (rows) {
          var ops = rows.filter(function (row) {
            return row.doc === docId && Number(row.id) > (Number(since) || 0);
          }).map(function (row) {
            return { seq: row.id, path: row.path, value: row.value, prev: row.prev, client: row.client, ts: row.ts, kind: row.kind };
          });
          return packRows(3).then(function (snaps) {
            var snap = snaps.filter(function (row) { return row.doc === docId; }).pop();
            return { seq: ops.length ? ops[ops.length - 1].seq : (Number(since) || 0), ops: ops, snapshot: snap && snap.snapshot };
          });
        });
      },
      compact: function (docId, snapshot, seq) {
        return req("POST", "/3", { doc: docId, seq: seq, snapshot: snapshot });
      }
    };
  }

  function create(options) {
    options = options || {};
    var docId = options.docId || "doc";
    var clientId = options.clientId || ("c-" + Math.random().toString(36).slice(2, 8));
    var snapshot = clone(options.snapshot || {});
    var ops = [];
    var seq = 0;
    var undo = [];
    var redo = [];
    var transport = options.transport || memoryTransport();

    function emit(op) {
      if (options.onChange) options.onChange(clone(snapshot), op);
    }

    function applyOp(op, recordUndo) {
      var prev = getPath(snapshot, op.path);
      snapshot = setPath(snapshot, op.path, op.value);
      if (op.seq && op.seq > seq) seq = op.seq;
      if (recordUndo) {
        undo.push({ path: op.path, value: prev, prev: op.value, client: clientId, ts: Date.now(), kind: "undo" });
        redo.length = 0;
      }
      emit(op);
      return op;
    }

    function localSet(path, value) {
      var prev = getPath(snapshot, path);
      var op = { path: path, value: clone(value), prev: clone(prev), client: clientId, ts: Date.now(), kind: "set" };
      applyOp(op, true);
      ops.push(op);
      return op;
    }

    function mergeRemote(list) {
      (list || []).forEach(function (op) {
        if (!op || !op.path) return;
        if (op.seq && ops.some(function (local) { return local.seq === op.seq; })) return;
        var localNewer = ops.some(function (local) {
          return local.path === op.path && (local.ts || 0) > (op.ts || 0);
        });
        if (localNewer) return;
        applyOp(op, false);
        ops.push(op);
      });
    }

    return {
      docId: docId,
      clientId: clientId,
      snapshot: function () { return clone(snapshot); },
      ops: function () { return clone(ops); },
      seq: function () { return seq; },
      set: localSet,
      apply: function (op) { return applyOp(op, true); },
      undo: function () {
        var op = undo.pop();
        if (!op) return false;
        var forward = { path: op.path, value: getPath(snapshot, op.path), prev: op.value, client: clientId, ts: Date.now(), kind: "set" };
        applyOp(op, false);
        redo.push(forward);
        ops.push({ path: op.path, value: op.value, prev: op.prev, client: clientId, ts: Date.now(), kind: "undo" });
        return true;
      },
      redo: function () {
        var op = redo.pop();
        if (!op) return false;
        applyOp(op, true);
        ops.push(op);
        return true;
      },
      canUndo: function () { return undo.length > 0; },
      canRedo: function () { return redo.length > 0; },
      stream: function (since) {
        var from = Number(since) || 0;
        return clone(ops.filter(function (op) {
          var s = op.seq == null ? from + 1 : op.seq;
          return s > from;
        }));
      },
      push: function () {
        var pending = ops.filter(function (op) { return !op.seq; });
        if (!pending.length) return Promise.resolve({ seq: seq, ops: [] });
        return Promise.resolve(transport.push(docId, pending)).then(function (res) {
          seq = res.seq || seq;
          return res;
        });
      },
      pull: function () {
        return Promise.resolve(transport.pull(docId, seq)).then(function (res) {
          if (res.snapshot && (!ops.length || res.seq > seq)) {
            snapshot = clone(res.snapshot);
            seq = res.seq || seq;
            emit(null);
          }
          mergeRemote(res.ops || []);
          return res;
        });
      },
      compact: function () {
        return Promise.resolve(transport.compact(docId, snapshot, seq));
      },
      download: function (since) {
        return Promise.resolve(transport.pull(docId, since || 0));
      }
    };
  }

  return {
    create: create,
    memoryTransport: memoryTransport,
    httpTransport: httpTransport,
    getPath: getPath,
    setPath: setPath
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.DocumentWAL;
