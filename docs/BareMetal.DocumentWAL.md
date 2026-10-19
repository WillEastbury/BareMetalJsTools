# BareMetal.DocumentWAL

> Op log for document and spreadsheet edits: local undo/redo, last-write merge, a downloadable change stream, and compact snapshots.

**Size:** see `src/BareMetal.DocumentWAL.js`  
**Dependencies:** None. Pair with `BareMetal.Sheet` or `BareMetal.Document`.

The PicoScript host is [`picoscript/docwal.pc`](../picoscript/docwal.pc) (also `pios/examples/docwal.pc`). It records ops on PicoWAL cards and stores compacted snapshots. It does not parse formulas or HTML.

## Quick Start

```html
<script src="BareMetal.DocumentWAL.js"></script>
<script>
  const wal = BareMetal.DocumentWAL.create({
    docId: 'sheet-1',
    snapshot: { cells: {} },
    transport: BareMetal.DocumentWAL.memoryTransport()
  });
  wal.set('cells.A1', { v: 'Hello' });
  wal.undo();
  wal.push().then(() => wal.pull());
  const stream = wal.stream(0);
</script>
```

Live UI: [`examples/sheet-app.html`](../examples/sheet-app.html), [`examples/document-app.html`](../examples/document-app.html).

## Ops

Each change is:

```json
{ "seq": 1, "client": "c-ab12", "ts": 1710000000000, "kind": "set", "path": "cells.A1", "value": { "v": "Hi" }, "prev": null }
```

`path` is dotted. Merge is last-write-wins on the same path using `ts`, then the local pending op if it is newer. Undo writes an op that restores `prev`. Redo writes the forward op again.

## API

### `create(options)` → `wal`

| Option | Meaning |
| --- | --- |
| `docId` | Document id |
| `clientId` | Op author |
| `snapshot` | Starting JSON |
| `transport` | `push` / `pull` / `compact` |
| `onChange(snapshot, op)` | After each apply |

`wal.set(path, value)`, `undo()`, `redo()`, `push()`, `pull()`, `compact()`, `stream(since)`, `download(since)`, `snapshot()`, `ops()`, `seq()`.

### `memoryTransport(seed?)`

In-process store, keyed by `docId`. Use this in demos and tests.

### `httpTransport(root)`

Talks to `docwal.pc`:

| Call | HTTP |
| --- | --- |
| `push` | `POST /2` one JSON op per change |
| `pull` | `GET /list/2` filtered by `doc` and seq |
| `compact` | `POST /3` `{doc, seq, snapshot}` |

Pack 1 is reserved for document meta. Pack 2 is the op stream (download this). Pack 3 is the compacted file/card.

## PIOS document server

`docwal.pc` is a PicoScript C-dialect picoweb handler. Loopback-only on the reference VM. On PIOS: capsule pack 1024, `io = tcp/82`, `entry = http`. The bytecode image is the generic WAL router (same size class as the story prototype) and is larger than the 4096-byte EL0 cap, so the reference VM is the current run path. Compact writes one snapshot card. Redo/undo stay in the op log so a client can rebuild or walk history.
