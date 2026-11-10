BareMetal.TestRunner.installGlobals();

describe('BareMetal.Integrity', function () {
  it('computes and verifies SHA-256 digests', async function () {
    var digest = await BareMetal.Integrity.sha256('BareMetal');
    expect(digest).toHaveLength(64);
    expect(await BareMetal.Integrity.verify('BareMetal', digest)).toBe(true);
    expect(await BareMetal.Integrity.verify('Modified', digest)).toBe(false);
  });

  it('builds and validates manifest structure', function () {
    var manifest = BareMetal.Integrity.createManifest([
      { name: 'Bind', path: 'BareMetal.Bind.js', sha256: 'a'.repeat(64) }
    ], { revision: 'test-commit' });
    expect(manifest.algorithm).toBe('SHA-256');
    expect(manifest.revision).toBe('test-commit');
    expect(manifest.modules.Bind.path).toBe('BareMetal.Bind.js');
  });
});
