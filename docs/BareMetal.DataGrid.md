# BareMetal.DataGrid

Browser-native table for large datasets. It virtualizes the rendered rows, supports local or server-side paging, and provides selection and bulk-edit hooks without a runtime dependency.

## Load

```html
<script src="src/BareMetal.DataGrid.js"></script>
```

## Public API

### `create(target, options)`

Creates a grid and returns `el`, `ready`, and its grid controls.

### `grid.loadPage(page)`

Loads a local or server-backed page and resolves to `{ rows, total, page }`.

### `grid.setRows(rows)`

Replaces local-mode rows, resets the current page, and rerenders.

### `grid.setPageSize(size)`

Changes the page size and reloads the first page.

### `grid.setSort(key, direction)`

Updates sort state. Remote grids pass the state to `fetchPage`; local grids sort before paging.

### `grid.setFilters(filters)`

Applies local filters or passes them to the server paging callback.

### `grid.getState()`

Returns the current page, page size, total, sort, filters, loading state, and selected row IDs.

### `grid.selected()`

Returns the selected row records currently cached by the grid.

### `grid.clearSelection()`

Clears selected row IDs.

### `grid.bulkEdit(patch)`

Optimistically patches selected records and resolves after `onBulkEdit` completes. Local state rolls back if persistence fails.

### `grid.destroy()`

Aborts an in-flight page request and removes the grid element.

## Create a local grid

```js
const grid = BareMetal.DataGrid.create('#orders', {
  rows: initialOrders,
  columns: [
    { key: 'id', label: 'Order', sort: true },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', editable: true },
    { key: 'total', label: 'Total', type: 'number', editable: true }
  ],
  pageSize: 200,
  rowHeight: 38,
  viewportHeight: 480,
  onBulkEdit: async ({ ids, patch }) => saveMany(ids, patch)
});
```

## Server-side paging

`fetchPage` receives a zero-based page, `pageSize`, the current sort, filters, and an abort signal. Return `{ rows, total }`; remote rows must contain a stable `keyField` (default `id`).

```js
const grid = BareMetal.DataGrid.create('#orders', {
  columns: [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }],
  pageSize: 100,
  fetchPage: async ({ page, pageSize, sort, filters, signal }) => {
    const response = await fetch('/api/orders?' + new URLSearchParams({
      page, pageSize, sort: sort.key || '', direction: sort.direction
    }), { signal });
    if (!response.ok) throw new Error('Order page request failed: ' + response.status);
    return response.json();
  }
});

await grid.ready;
await grid.setFilters({ status: 'approved' });
```

## Bulk editing

Columns marked `editable: true` appear in the bulk editor. The grid applies the patch optimistically; `onBulkEdit` persists it. If that callback rejects, local records roll back and the error remains visible in the grid status.

```js
grid.el.querySelector('thead input[type=checkbox]').click();
await grid.bulkEdit({ status: 'approved' });
```

Server-paged grids require `onBulkEdit` so the change is not silently treated as persisted. `getState()`, `selected()`, `clearSelection()`, `setRows()`, `setPageSize()`, `setSort()`, and `destroy()` are also available.

## Virtualization model

Only the visible rows plus `overscan` rows are mounted. `rowHeight` is the fixed row-height estimate used to calculate the virtual window and spacer rows; long cell values are truncated rather than expanding row height. Local filtering can be set with `setFilters()`. Server filters are passed through to `fetchPage`.
