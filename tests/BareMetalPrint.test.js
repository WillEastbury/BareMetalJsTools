/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.Print.js');

function loadPrint() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Print.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Print', () => {
  let Print;

  beforeEach(() => {
    document.body.innerHTML = '';
    Print = loadPrint();
  });

  test('render produces HTML with schema field values', () => {
    const schema = {
      type: 'object',
      title: 'Customer Record',
      shape: {
        name: { type: 'string', label: 'Name' },
        email: { type: 'string', label: 'Email' },
        active: { type: 'boolean', label: 'Active' }
      }
    };
    const html = Print.render(schema, { name: 'Ada Lovelace', email: 'ada@example.com', active: true }, { title: 'Customer Printout' });

    expect(html).toContain('Customer Printout');
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('ada@example.com');
    expect(html).toContain('Yes');
    expect(html).toContain('bm-print-page');
  });

  test('table generates correct rows and columns', () => {
    const html = Print.table({ fields: { sku: { label: 'SKU' }, qty: { label: 'Qty' } } }, [
      { sku: 'A1', qty: 2 },
      { sku: 'B2', qty: 5 }
    ], { bordered: true, striped: true });

    expect(html).toContain('<th>SKU</th>');
    expect(html).toContain('<th>Qty</th>');
    expect((html.match(/<tr>/g) || []).length).toBe(3);
    expect(html).toContain('A1');
    expect(html).toContain('B2');
  });

  test('barcode SVG output contains rect elements', () => {
    const html = Print.barcode('ABC123', { format: 'code128', width: 2, height: 60, showText: true });

    expect(html).toContain('<svg');
    expect(html).toContain('<rect');
    expect(html).toContain('ABC123');
  });

  test('QR SVG output is valid', () => {
    const html = Print.qr('https://example.com/invoice/42', { size: 180, ecLevel: 'M', quiet: 2 });
    const host = document.createElement('div');
    host.innerHTML = html;
    const svg = host.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 /);
    expect(svg.querySelectorAll('rect').length).toBeGreaterThan(10);
    expect(svg.textContent || svg.innerHTML).toContain('https://example.com/invoice/42');
  });

  test('paginate splits content at block boundaries', () => {
    const content = [
      Print.section('One', '<p>First</p>'),
      Print.spacer(120),
      Print.section('Two', '<p>Second</p>'),
      Print.spacer(120),
      Print.section('Three', '<p>Third</p>')
    ].join('');

    const pages = Print.paginate(content, { pageHeight: 220, margins: { top: 10, bottom: 10 }, headerHeight: 20, footerHeight: 20 });

    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0]).toContain('One');
    expect(pages.join('')).toContain('Three');
    expect(pages.every((page) => page.includes('bm-print-page-body'))).toBe(true);
  });

  test('receipt format is correct width', () => {
    const output = Print.receipt([
      { name: 'Widget', qty: 2, price: 3.5 },
      { name: 'Cable', qty: 1, price: 1.25 }
    ], { width: 32, header: 'BareMetal Store', footer: 'Thanks!' });

    const lines = output.split('\n');
    expect(lines[0]).toHaveLength(32);
    expect(lines.every((line) => line.length <= 32)).toBe(true);
    expect(output).toContain('Widget');
    expect(output).toContain('Total');
  });

  test('invoice layout contains all sections', () => {
    const html = Print.invoice({}, {
      invoiceNo: 'INV-100',
      date: '2025-05-01',
      company: { name: 'BareMetal Ltd', address: '1 Forge Lane', email: 'accounts@baremetal.test' },
      customer: { name: 'Acme Corp', address: '2 Industrial Way', email: 'ap@acme.test' },
      items: [
        { description: 'Widget', qty: 2, price: 10 },
        { description: 'Service', qty: 1, price: 50 }
      ],
      terms: 'Net 30'
    }, { currency: 'USD', taxRate: 0.2, bankDetails: 'Sort 00-00-00 / Acc 12345678' });

    expect(html).toContain('Invoice');
    expect(html).toContain('Company / Customer');
    expect(html).toContain('Line Items');
    expect(html).toContain('Totals');
    expect(html).toContain('Payment');
    expect(html).toContain('Terms');
    expect(html).toContain('INV-100');
  });

  test('fromDocChain renders printable tree', () => {
    const tree = {
      doc: { id: 'quote-1', type: 'quotation', status: 'draft', data: { customer: 'Acme', total: 150 } },
      children: [
        {
          doc: { id: 'order-1', type: 'order', status: 'confirmed', data: { poNumber: 'PO-1' } },
          children: [
            { doc: { id: 'invoice-1', type: 'invoice', status: 'sent', data: { invoiceNo: 'INV-1' } }, children: [] }
          ]
        }
      ]
    };

    const html = Print.fromDocChain(tree);

    expect(html).toContain('quotation');
    expect(html).toContain('order');
    expect(html).toContain('invoice');
    expect(html).toContain('quote-1');
    expect(html).toContain('bm-print-chain-node');
  });

  test('thermal print format is plain text at correct char width', () => {
    const html = '<div><h1>Receipt</h1><p>Alpha Beta Gamma Delta</p></div>';
    const text = Print.print(html, { device: 'thermal', width: 24 });

    expect(typeof text).toBe('string');
    expect(text).toContain('Receipt');
    expect(text.split('\n').every((line) => line.length <= 24)).toBe(true);
    expect(text).not.toContain('<div>');
  });

  test('stylesheet contains @page rules', () => {
    const css = Print.stylesheet({ pageSize: 'letter', orientation: 'landscape', margins: { top: '10mm', right: '12mm', bottom: '14mm', left: '12mm' } });

    expect(css).toContain('@page');
    expect(css).toContain('size:letter landscape');
    expect(css).toContain('margin:10mm 12mm 14mm 12mm');
  });

  test('preview renders scaled HTML into a container', () => {
    const container = document.createElement('div');
    const html = Print.render({ type: 'object', shape: { name: { label: 'Name' } } }, { name: 'Preview User' }, { title: 'Preview' });

    Print.preview(html, container);

    expect(container.innerHTML).toContain('bm-print-preview');
    expect(container.innerHTML).toContain('Preview User');
  });
});
