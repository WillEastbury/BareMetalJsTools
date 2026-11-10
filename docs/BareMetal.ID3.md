# BareMetal.ID3

Reads ID3v1 and ID3v2 metadata from MP3 `ArrayBuffer`, `Uint8Array`, `Blob`,
or `File` values without a decoder or Node dependency.

```js
const tags = await BareMetal.ID3.read(file);
console.log(tags.title, tags.artist, tags.album, tags.track, tags.picture);
```

ID3 text frames include title, artist, album, year, genre, track, comment and
lyrics. Embedded APIC/PIC cover art is returned as a `Uint8Array`.
