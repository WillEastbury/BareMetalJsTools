/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const Pivot = require('../src/BareMetal.Pivot.js');

describe('BareMetal.Pivot', () => {
  const records = [
    { Item: 'Paper', Qty: 12 },
    { Item: 'Ink', Qty: 4 },
    { Item: 'Paper', Qty: 3 }
  ];

  test('fromRange builds records', () => {
    const pack = Pivot.fromRange(['Item', 'Qty'], [['Paper', 12], ['Ink', 4]]);
    expect(pack.records[0].Item).toBe('Paper');
    expect(pack.records[0].Qty).toBe(12);
  });

  test('sum groups and counts', () => {
    const rows = Pivot.compute(records, { groupBy: 'Item', valueField: 'Qty', op: 'sum', sort: 'group', sortDir: 'asc' });
    expect(rows.map(function (r) { return r.group; })).toEqual(['Ink', 'Paper']);
    expect(rows[1].sum).toBe(15);
    expect(rows[1].count).toBe(2);
  });

  test('filter and sort by value desc', () => {
    const rows = Pivot.compute(records, { groupBy: 'Item', valueField: 'Qty', op: 'sum', filter: 'pa', sort: 'value', sortDir: 'desc' });
    expect(rows).toHaveLength(1);
    expect(rows[0].group).toBe('Paper');
  });

  test('create paints a table', () => {
    document.body.innerHTML = '<div id="p"></div>';
    const ctl = Pivot.create('#p', { fields: ['Item', 'Qty'], records: records, groupBy: 'Item', valueField: 'Qty' });
    expect(ctl.el.querySelectorAll('tr').length).toBeGreaterThan(1);
    expect(ctl.compute()[0].count).toBeGreaterThan(0);
  });
});
