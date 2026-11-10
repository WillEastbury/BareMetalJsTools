# BareMetal.MP3Catalog

Generates, loads and indexes searchable MP3 manifest records.

```js
const catalog = BareMetal.MP3Catalog.create();
catalog.addMany([
  { id: 'a', title: 'Blue Monday', artist: 'New Order',
    album: 'Brotherhood', genre: 'Synthpop', year: '1986',
    tags: ['80s', 'electronic'], src: '/audio/blue-monday.mp3' }
]);

catalog.search('blue electronic');
catalog.search('', { artist: 'New Order', year: '1986', tag: 'electronic' });

const manifest = catalog.manifest({ revision: 'v1' });
```

Use `MP3Catalog.generate(entries, options)` to build a manifest from records,
`index(entries)` for a ready-to-search catalog, and `load(url)` to fetch one.
The normalized record contains searchable title/artist/album/genre/year/track,
lyrics/comment, tags, keywords, metadata and source fields.
