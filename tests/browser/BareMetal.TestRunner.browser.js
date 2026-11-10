BareMetal.TestRunner.installGlobals();

describe('BareMetal.TestRunner', function () {
  it('loads', function () {
    expect(BareMetal.TestRunner).toBeTruthy();
  });

  it('each test body runs once per page', function () {
    window.__bmOnce = (window.__bmOnce || 0) + 1;
    expect(window.__bmOnce).toBe(1);
  });
});
