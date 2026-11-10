BareMetal.TestRunner.installGlobals();
describe('smoke ServiceWorker', function () {
  it('is a service-worker script, not a window export', function () {
    expect(typeof BareMetal.ServiceWorker === 'undefined').toBe(true);
  });
});
