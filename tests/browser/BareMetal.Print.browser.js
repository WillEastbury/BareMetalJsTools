BareMetal.TestRunner.installGlobals();
describe('BareMetal.Print', function () {
  it('loads', function () { expect(BareMetal.Print).toBeTruthy(); });
  it('delegates PDF requests to the JavaScript document renderer', async function () {
    var result = await BareMetal.Print.print('<h1>Invoice</h1><p>Total due</p>', {
      device: 'pdf',
      title: 'Print PDF test',
      scale: 0.8
    });
    expect(result.blob.type).toBe('application/pdf');
    expect(result.pages).toBe(1);
  });
});