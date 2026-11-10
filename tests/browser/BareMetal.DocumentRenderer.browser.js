BareMetal.TestRunner.installGlobals();

describe('BareMetal.DocumentRenderer', function () {
  it('sanitizes active content and external resource URLs', function () {
    var safe = BareMetal.DocumentRenderer.sanitizeHTML(
      '<h1 onclick="run()">Invoice</h1><script>run()</script>' +
      '<img src="https://example.invalid/track.png" onerror="run()">' +
      '<p style="font-weight:700;background:url(https://example.invalid/a)">Total due</p>' +
      '<svg><rect fill="url(https://example.invalid/paint.svg#id)"></rect></svg>'
    );
    expect(safe.indexOf('<script')).toBe(-1);
    expect(safe.indexOf('onclick')).toBe(-1);
    expect(safe.indexOf('onerror')).toBe(-1);
    expect(safe.indexOf('https://')).toBe(-1);
    expect(safe.indexOf('<h1>Invoice</h1>') >= 0).toBe(true);
  });

  it('creates a multipage application/pdf with a searchable text layer', async function () {
    var paragraphs = [];
    for (var i = 0; i < 80; i++) {
      paragraphs.push('<p>Invoice line ' + (i + 1) + ': northstar studio supply.</p>');
    }
    var result = await BareMetal.DocumentRenderer.render(
      '<h1>Quarterly report</h1>' + paragraphs.join(''),
      { title: 'Quarterly report', pageSize: 'A4', scale: 0.8 }
    );
    var header = await result.blob.slice(0, 8).text();
    var pdfText = await result.blob.text();
    var bytes = new Uint8Array(await result.blob.arrayBuffer());
    function ascii(start, length) {
      var value = '';
      var end = Math.min(bytes.length, start + length);
      for (var index = start; index < end; index++) value += String.fromCharCode(bytes[index]);
      return value;
    }
    var tailStart = Math.max(0, bytes.length - 64);
    var tail = ascii(tailStart, bytes.length - tailStart);
    var xrefMatch = /startxref\s+(\d+)\s+%%EOF/.exec(tail);
    var xrefOffset = xrefMatch ? Number(xrefMatch[1]) : -1;
    var report = {
      pages: result.pages,
      words: result.searchableWords,
      image: pdfText.indexOf('/Subtype /Image') >= 0,
      invisibleText: pdfText.indexOf('3 Tr') >= 0,
      invoiceText: pdfText.indexOf('496E766F696365') >= 0,
      xref: xrefOffset >= 0 && ascii(xrefOffset, 4) === 'xref'
    };
    if (!report.image || !report.invisibleText || !report.invoiceText || !report.xref ||
        report.pages < 2 || report.words < 1) {
      throw new Error(JSON.stringify(report));
    }
    expect(result.blob.type).toBe('application/pdf');
    expect(header).toBe('%PDF-1.4');
    expect(result.pages > 1).toBe(true);
    expect(result.searchableWords > 0).toBe(true);
    expect(report.image).toBe(true);
    expect(report.invisibleText).toBe(true);
    expect(report.invoiceText).toBe(true);
    expect(report.xref).toBe(true);
  });

  it('honors explicit page breaks', async function () {
    var html = '<h1>First page</h1><p>Summary</p>' +
      BareMetal.DocumentRenderer.pageBreak() +
      '<h1>Second page</h1><p>Details</p>';
    var result = await BareMetal.DocumentRenderer.render(html, { scale: 0.8 });
    expect(result.pages).toBe(2);
  });
});
