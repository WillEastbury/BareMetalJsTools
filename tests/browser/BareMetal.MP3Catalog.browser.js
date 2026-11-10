BareMetal.TestRunner.installGlobals();

describe('BareMetal.MP3Catalog', function () {
  it('generates, indexes and searches tag content', function () {
    var catalog = BareMetal.MP3Catalog.create({
      entries: [
        { id: 'one', title: 'Blue Monday', artist: 'New Order', album: 'Brotherhood', genre: 'Synthpop', year: '1986', tags: ['80s', 'electronic'] },
        { id: 'two', title: 'Paper Planes', artist: 'M.I.A.', album: 'Kala', genre: 'Alternative', year: '2007', tags: ['hip-hop', 'world'] }
      ]
    });
    expect(catalog.search('blue monday')[0].id).toBe('one');
    expect(catalog.search('', { genre: 'Synthpop' }).length).toBe(1);
    expect(catalog.search('', { tag: 'world' })[0].id).toBe('two');
  });

  it('generates a portable manifest', function () {
    var manifest = BareMetal.MP3Catalog.generate([
      { id: 'one', title: 'Track', artist: 'Artist', tags: ['live'] }
    ], { title: 'My MP3 Catalog', revision: 'v1' });
    expect(manifest.title).toBe('My MP3 Catalog');
    expect(manifest.revision).toBe('v1');
    expect(manifest.entries[0].searchText).toContain('live');
  });
});
