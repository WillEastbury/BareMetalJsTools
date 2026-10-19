# BareMetal.Sheet

> Spreadsheet cell view: A1 grid, formula bar, selection, in-cell edit, per-cell style.

**Dependencies:** None. Pair with `BareMetal.Ribbon`, `BareMetal.FooterBar`, `BareMetal.Colour`, `BareMetal.Font`, `BareMetal.DocumentWAL`.

## Quick Start

```html
<script src="BareMetal.Sheet.js"></script>
<div id="sheet" style="height:24rem"></div>
<script>
  const sheet = BareMetal.Sheet.create('#sheet', {
    rows: 20,
    cols: 10,
    cells: { A1: { v: 'Hello', s: { bold: true } } },
    onChange(addr, cell, prev) { console.log(addr, cell); }
  });
  sheet.setCell('B2', { v: '42' });
</script>
```

Demo: [`examples/sheet-app.html`](../examples/sheet-app.html).

## Cell shape

```json
{ "v": "display text", "s": { "bold": true, "italic": false, "color": "#4a2040", "bg": "#fff", "font": "Georgia, serif", "size": 13, "align": "left" } }
```

## API

`create(target, options)` → `{ el, getData, setData, getCell, setCell, select, selected, styleSelected, startEdit, addr, parseAddr }`.

Arrow keys move. Shift+arrows or drag selects a range. Enter or a character starts edit. `colName(0)` is `A`. `parseAddr('B3')` is `{ c:1, r:2, addr:'B3' }`.

Style on `cell.s`: `bold`, `italic`, `underline`, `color`, `bg`, `font`, `size`, `align`, `border` (`thin` / `thick` / `none`), `merge` (`{ cols, rows }` on the origin cell).

`selectedRange()`, `styleRange(patch)`, `mergeSelected()`, `unmergeSelected()`, `insertRow(at?)`, `deleteRow(at?)`, `insertCol(at?)`, `deleteCol(at?)`, `setRowFilter(fn)`.

Empty cells are not stored. The grid grows as you arrow or scroll toward the edge (capped). `getData().cells` is sparse.
