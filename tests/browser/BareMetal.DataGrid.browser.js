BareMetal.TestRunner.installGlobals();

describe('BareMetal.DataGrid', function () {
  function host() {
    var el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  }

  it('virtualizes local rows while preserving full-page scroll space', function () {
    var rows = [];
    for (var index = 0; index < 1000; index++) rows.push({ id: index, name: 'Record ' + index });
    var grid = BareMetal.DataGrid.create(host(), {
      rows: rows,
      columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }],
      pageSize: 1000,
      rowHeight: 20,
      viewportHeight: 100,
      overscan: 2
    });
    var scroller = grid.el.querySelector('.bm-data-grid-scroll');
    var renderedBefore = grid.el.querySelectorAll('tbody tr.bm-data-grid-row').length;
    expect(renderedBefore < rows.length).toBe(true);
    expect(grid.el.querySelector('.bm-data-grid-spacer td').style.height).not.toBe('');
    scroller.scrollTop = 5000;
    scroller.dispatchEvent(new Event('scroll'));
    var firstVisible = grid.el.querySelector('tbody tr.bm-data-grid-row');
    expect(Number(firstVisible.dataset.rowId) > 100).toBe(true);
    grid.destroy();
  });

  it('loads remote pages and passes sort state to the server adapter', async function () {
    var calls = [];
    var grid = BareMetal.DataGrid.create(host(), {
      columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }],
      pageSize: 2,
      fetchPage: function (request) {
        calls.push(request);
        var rows = [];
        for (var index = request.page * request.pageSize; index < Math.min(5, (request.page + 1) * request.pageSize); index++) {
          rows.push({ id: index + 1, name: 'Record ' + (index + 1) });
        }
        return Promise.resolve({ rows: rows, total: 5 });
      }
    });
    await grid.ready;
    await grid.loadPage(1);
    expect(grid.getState().page).toBe(1);
    expect(grid.el.querySelector('.bm-data-grid-pager').textContent.indexOf('Page 2 of 3') >= 0).toBe(true);
    await grid.setSort('name', 'desc');
    expect(calls[calls.length - 1].page).toBe(0);
    expect(calls[calls.length - 1].sort.key).toBe('name');
    expect(calls[calls.length - 1].sort.direction).toBe('desc');
    grid.destroy();
  });

  it('bulk-edits selected records and reports the persisted batch', async function () {
    var saved = null;
    var grid = BareMetal.DataGrid.create(host(), {
      rows: [{ id: 'a', status: 'draft' }, { id: 'b', status: 'draft' }],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'status', label: 'Status', editable: true }
      ],
      onBulkEdit: function (batch) {
        saved = batch;
        return Promise.resolve();
      }
    });
    var selectAll = grid.el.querySelector('thead input[type=checkbox]');
    selectAll.checked = true;
    selectAll.dispatchEvent(new Event('change', { bubbles: true }));
    var result = await grid.bulkEdit({ status: 'approved' });
    expect(result.ids.length).toBe(2);
    expect(saved.records.every(function (record) { return record.status === 'approved'; })).toBe(true);
    expect(grid.el.querySelector('tbody').textContent.indexOf('approved') >= 0).toBe(true);
    expect(grid.getState().selected.length).toBe(0);
    grid.destroy();
  });

  it('rolls back optimistic bulk edits when the server callback fails', async function () {
    var grid = BareMetal.DataGrid.create(host(), {
      columns: [{ key: 'id', label: 'ID' }, { key: 'status', label: 'Status', editable: true }],
      fetchPage: function () { return Promise.resolve({ rows: [{ id: 1, status: 'draft' }], total: 1 }); },
      onBulkEdit: function () { return Promise.reject(new Error('offline')); }
    });
    await grid.ready;
    var checkbox = grid.el.querySelector('tbody input[type=checkbox]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    var rejected = false;
    try { await grid.bulkEdit({ status: 'approved' }); }
    catch (error) { rejected = error.message === 'offline'; }
    expect(rejected).toBe(true);
    expect(grid.el.querySelector('tbody').textContent.indexOf('draft') >= 0).toBe(true);
    expect(grid.el.querySelector('.bm-data-grid-status').textContent.indexOf('offline') >= 0).toBe(true);
    grid.destroy();
  });
});
