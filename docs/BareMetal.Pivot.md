# BareMetal.Pivot

> Group, summarise, sort, and filter a list of records. Optional bar chart via `BareMetal.Charts`.

**Dependencies:** `BareMetal.Charts` (optional)

## Quick Start

```html
<script src="BareMetal.Charts.js"></script>
<script src="BareMetal.Pivot.js"></script>
<div id="pivot"></div>
<script>
  BareMetal.Pivot.create('#pivot', {
    fields: ['Item', 'Qty'],
    records: [
      { Item: 'Paper', Qty: 12 },
      { Item: 'Ink', Qty: 4 },
      { Item: 'Paper', Qty: 3 }
    ],
    groupBy: 'Item',
    valueField: 'Qty',
    op: 'sum'
  });
</script>
```

`fromRange(headers, rows)` turns a highlighted grid into `{ fields, records }`.

Summarise ops: `sum`, `count`, `avg`, `min`, `max`. Sort by `group` or `value`, `asc` or `desc`. Filter is a substring on the group label.

## API

`create(target, options)` → `{ el, compute, setRecords, state }`

`compute(records, opts)` → summary rows `{ group, count, sum, avg, min, max, value }`

`fromRange(headers, bodyRows)` → `{ fields, records }`
