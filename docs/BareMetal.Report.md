# BareMetal.Report

> Report & form builder — one templated layout engine, two modes (read-only report, read-write form), plus a visual designer.

**Size:** ~18 KB source / ~10 KB minified
**Dependencies:** None

## The 2-stage model

Reports and forms are two faces of one templated layout engine:

- **Stage 1 — data producer:** anything that yields a flat list of integer values — an API call (`BareMetal.Communications`), a [`BareMetal.Workflow`](./BareMetal.Workflow.md), a PicoScript program (`BareMetal.PicoScript`/`BareMetal.WorkflowPico`), a `Storage` query, or a literal array.
- **Stage 2 — layout template:** describes how to render that data.

A **report** is a data source with a **read-only** layout; a **form** is the same with a **read-write** layout. This module is the browser counterpart of picoscript's `picolayout` engine (byte-identical text/HTML), so a template renders the same in the app and in the PicoScript toolchain.

## Quick start

```html
<script src="BareMetal.Report.min.js"></script>
<script>
  var data = [2, 10, 3, 20, 1, 50];   // stage-1 output: rows of [qty, price]
  var template = {
    title: 'Orders',
    mode: 'report',                     // or 'form'
    columns: [
      { label: 'Qty',   field: 0, width: 5 },
      { label: 'Price', field: 1, width: 6, format: 'int' }
    ],
    aggregates: [{ column: 0, fn: 'sum' }, { column: 1, fn: 'max' }]
  };
  BareMetal.Report.render(document.getElementById('out'), data, template);
</script>
```

## Template

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Optional banner (caption / heading). |
| `mode` | `"report"` \| `"form"` | Read-only table vs read-write inputs. Default `"report"`. |
| `columns` | object[] | Data is chunked into rows of `columns.length`. |
| `aggregates` | object[] | Footer summaries (report mode). |

**Column:** `{ label, field, width, format, align, editable }`
- `field` — index into the row (defaults to column position)
- `format` — `"int"` (default), `"hex"`, `"raw"`
- `align` — `"left"` (default) or `"right"` (text mode)
- `editable` — form mode only; `false` renders a read-only `<output>`

**Aggregate:** `{ column, fn }` where `fn` ∈ `count` · `sum` · `min` · `max` · `avg`.

## API Reference

### `render(container, data, template, opts)` → controller

Renders `data` with `template` into `container`. `opts.mode` overrides `template.mode`. Returns `{ element, form, collect(), refresh(data?, template?) }`.

### `renderHtml(data, template, mode)` → `string` · `renderText(data, template)` → `string`

The pure layout engine (no DOM). `renderHtml` returns a report `<table>` or a `<form>`; `renderText` returns a monospace text report.

### `designer(container, opts)` → controller

Renders a **visual designer to create/edit** a report or form template: title, mode toggle, add/edit/remove columns (label, field, width, format, editable), add/remove aggregates, a data input, a live preview (HTML + text), and Export. Dispatches bubbling `bm:report-change` and `bm:report-export` events.

| `opts` | Description |
|--------|-------------|
| `template` | Initial template (default a one-column report). |
| `data` | Initial preview data (array of ints). |

Controller: `{ element, getTemplate(), setTemplate(t), getData(), setData(d), refresh(), destroy() }`.

**Example:**
```js
var d = BareMetal.Report.designer(document.getElementById('designer'), {
  data: [2, 10, 3, 20],
  template: { title: 'Orders', mode: 'report',
    columns: [{ label: 'Qty', field: 0 }, { label: 'Price', field: 1 }],
    aggregates: [{ column: 0, fn: 'sum' }] }
});
d.element.addEventListener('bm:report-change', function (e) {
  console.log(e.detail.template);   // live template as you design
});
```

## Stage-1 data sources — `loadData(source, opts)` → `Promise<int[]>`

Decouples the layout (stage 2) from where the data comes from (stage 1). Resolves a source descriptor to the flat int list the engine renders:

| `source.kind` | Fields | Behaviour |
|---------------|--------|-----------|
| `literal` | `values` | Returns the array as-is (a plain array works too). |
| `rest` | `url`, `opts?` | Fetches JSON via `BareMetal.Communications.get` (or `fetch`) and flattens every number in document order. |
| `workflow` | `steps` | Runs the step list through `BareMetal.WorkflowPico` and decodes the VM output (`Print` = 4-byte big-endian ints). |
| `pico` | `source`, `lang?` | Compiles + runs a PicoScript program via `BareMetal.PicoScript` and decodes the VM output. |
| `function` | `fn` | Calls `fn()` (sync or async); numbers are extracted from the result. |

```js
// pull rows from an API
BareMetal.Report.loadData({ kind: 'rest', url: '/api/orders' })
  .then(data => BareMetal.Report.render(el, data, template));

// or run a workflow as the data producer
BareMetal.Report.loadData({ kind: 'workflow', steps: myWorkflowSteps })
  .then(data => ...);
```

The **designer** exposes this as a picker: choose `literal` / `REST` / `workflow` / `PicoScript`, enter the config (URL, steps JSON, or source), and hit **Load** — the preview fills from the chosen source (`bm:report-data` / `bm:report-error` events). The designer controller also has `getSource()` / `setSource(s)` / `load()`.

### Form write-back — `collect(formEl)` · `flatten(rows)` · `toWrites(rows, opts)`

The read-write path. `collect(form)` reads a rendered form's inputs back into rows of ints; `flatten(rows)` returns the flat list; `toWrites(rows, { base, stride })` produces a `{ key: value }` map keyed by `base + row*stride + field` for persisting through the data ABI (`Context`/`Memory` scratch, `Storage`) — the same store a stage-1 program reads.

**Example (edit → persist):**
```js
var ctl = BareMetal.Report.render(el, data, { mode: 'form', columns: cols });
// ... user edits inputs ...
var rows = ctl.collect();
var writes = BareMetal.Report.toWrites(rows, { base: 8192 });
// write `writes` to your store; a PicoScript report program reads it via Memory.Get
```

## Notes

- The engine is integer-oriented (matching the deterministic PicoScript VM). Non-numeric cells fall back to `raw`.
- `renderText`/`renderHtml` are byte-identical to picoscript's `vm/picolayout.js` and `picolayout.py`, so a template designed here renders identically in the PicoScript playground and toolchain.
- The designer produces plain template JSON — persist it, ship it, or feed it to `render()` at runtime.
