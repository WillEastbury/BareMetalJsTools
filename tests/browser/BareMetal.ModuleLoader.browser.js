BareMetal.TestRunner.installGlobals();

describe('BareMetal.ModuleLoader', function () {
  it('creates a loader and caches its manifest and modules', function () {
    var loader = BareMetal.ModuleLoader.create({
      manifestUrl: '/module.manifest.json',
      requireIntegrity: true
    });
    expect(loader.loadManifest).toBeInstanceOf(Function);
    expect(loader.load).toBeInstanceOf(Function);
    expect(loader.loadAll).toBeInstanceOf(Function);
  });

  it('reports unknown manifest modules without executing them', async function () {
    var loader = BareMetal.ModuleLoader.create({
      manifest: { modules: { Known: { path: 'known.js', sha256: 'a'.repeat(64) } } },
      baseUrl: '/'
    });
    await expect(loader.load('Unknown')).rejects.toThrow('not in manifest');
  });

  it('supports gzip browser compression APIs through the minifier', async function () {
    if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') return;
    var source = 'var BareMetal = {};';
    var compressed = await BareMetal.Minifier.compressGzip(source);
    var restored = await BareMetal.Minifier.decompressGzip(compressed);
    expect(new TextDecoder().decode(restored)).toBe(source);
  });
});
