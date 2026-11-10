BareMetal.TestRunner.installGlobals();

describe('BareMetal.ID3', function () {
  it('reads ID3v1 title, artist, album and track', function () {
    var bytes = new Uint8Array(128);
    var text = 'TAG' + 'Test Title'.padEnd(30, '\0') + 'Test Artist'.padEnd(30, '\0') +
      'Test Album'.padEnd(30, '\0') + '2026' + ''.padEnd(30, '\0');
    var i;
    for (i = 0; i < text.length && i < 128; i++) bytes[i] = text.charCodeAt(i);
    var tags = BareMetal.ID3.readV1(bytes);
    expect(tags.title).toContain('Test Title');
    expect(tags.artist).toContain('Test Artist');
    expect(tags.album).toContain('Test Album');
  });

  it('reads ID3v2 text frames', async function () {
    var bytes = new Uint8Array(50);
    bytes.set([0x49,0x44,0x33,4,0,0,0,0,0,30], 0);
    bytes.set([0x54,0x49,0x54,0x32], 10);
    var frameSize = 12;
    bytes[14] = 0; bytes[15] = 0; bytes[16] = 0; bytes[17] = frameSize;
    bytes[20] = 3;
    bytes.set(new TextEncoder().encode('Track One'), 21);
    var tags = await BareMetal.ID3.read(bytes);
    expect(tags.title).toBe('Track One');
  });
});
