/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

function load(name) {
  const path = require('path').resolve(__dirname, '../src/' + name);
  jest.resetModules();
  delete require.cache[require.resolve(path)];
  return require(path);
}

describe('desk controls', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="h"></div>';
  });

  test('Colour normalizes and reports hex', () => {
    const Colour = load('BareMetal.Colour.js');
    expect(Colour.normalize('#f0c')).toBe('#ff00cc');
    const picker = Colour.create('#h', { value: '#e91e8c' });
    expect(picker.get()).toBe('#e91e8c');
    picker.set('#4caf80');
    expect(picker.get()).toBe('#4caf80');
  });

  test('Font returns family and size', () => {
    const Font = load('BareMetal.Font.js');
    const picker = Font.create('#h', { family: 'Georgia, serif', size: 14 });
    expect(picker.get()).toEqual({ family: 'Georgia, serif', size: 14 });
  });

  test('Ribbon fires onCommand', () => {
    const Ribbon = load('BareMetal.Ribbon.js');
    const hits = [];
    const bar = Ribbon.create('#h', {
      groups: [{ label: 'Edit', items: [{ id: 'bold', label: 'B', toggle: true }] }],
      onCommand: function (id, item) { hits.push([id, item.active]); }
    });
    bar.el.querySelector('.bm-ribbon-btn').click();
    expect(hits[0]).toEqual(['bold', true]);
    expect(bar.item('bold').active).toBe(true);
  });

  test('FooterBar tabs and zoom', () => {
    const Footer = load('BareMetal.FooterBar.js');
    let tab = null;
    const foot = Footer.create('#h', {
      status: 'Ready',
      tabs: [{ id: 's1', label: 'Sheet1', active: true }, { id: 's2', label: 'Notes' }],
      onTab: function (id) { tab = id; }
    });
    foot.setStatus('A1');
    foot.el.querySelectorAll('.bm-footer-tab')[1].click();
    expect(tab).toBe('s2');
    foot.setZoom(125);
    expect(foot.getZoom()).toBe(125);
  });

  test('Sheet A1 addressing and setCell', () => {
    const Sheet = load('BareMetal.Sheet.js');
    expect(Sheet.addr(0, 0)).toBe('A1');
    expect(Sheet.parseAddr('B3')).toEqual({ c: 1, r: 2, addr: 'B3' });
    const seen = [];
    const sheet = Sheet.create('#h', {
      rows: 4,
      cols: 4,
      onChange: function (addr, cell) { seen.push([addr, cell.v]); }
    });
    sheet.setCell('A1', { v: 'Hi' });
    expect(sheet.getCell('A1').v).toBe('Hi');
    expect(seen[0]).toEqual(['A1', 'Hi']);
    sheet.select('B2');
    expect(sheet.selected()).toBe('B2');
    sheet.select('C3', false, true);
    expect(sheet.selectedRange()).toEqual({ c0: 1, r0: 1, c1: 2, r1: 2 });
    sheet.mergeSelected();
    expect(sheet.getCell('B2').s.merge).toEqual({ cols: 2, rows: 2 });
  });

  test('Document sanitizes scripts', () => {
    const Doc = load('BareMetal.Document.js');
    expect(Doc.sanitize('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>');
    const editor = Doc.create('#h', { html: '<h1>Notes</h1>' });
    expect(editor.getHTML()).toContain('Notes');
  });
});

describe('BareMetal.DocumentWAL', () => {
  const WAL = require('../src/BareMetal.DocumentWAL.js');

  test('set, stream, undo, redo', () => {
    const wal = WAL.create({ snapshot: { cells: {} }, transport: WAL.memoryTransport() });
    wal.set('cells.A1', { v: 'Hi' });
    expect(wal.snapshot().cells.A1.v).toBe('Hi');
    expect(wal.stream(0).length).toBe(1);
    expect(wal.undo()).toBe(true);
    expect(wal.snapshot().cells.A1).toBeUndefined();
    expect(wal.redo()).toBe(true);
    expect(wal.snapshot().cells.A1.v).toBe('Hi');
  });

  test('memory transport round-trips a stream', async () => {
    const transport = WAL.memoryTransport();
    const a = WAL.create({ docId: 'd1', snapshot: {}, transport: transport });
    a.set('title', 'one');
    await a.push();
    const b = WAL.create({ docId: 'd1', snapshot: {}, transport: transport });
    await b.pull();
    expect(b.snapshot().title).toBe('one');
    const stream = await b.download(0);
    expect(stream.ops.length).toBeGreaterThan(0);
    await a.compact();
  });

  test('setPath and getPath', () => {
    const obj = WAL.setPath({}, 'cells.A1.v', 'x');
    expect(WAL.getPath(obj, 'cells.A1.v')).toBe('x');
  });
});
