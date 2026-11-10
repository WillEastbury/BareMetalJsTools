/* BareMetal.ID3 - dependency-free MP3 ID3v1/v2 metadata reader. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.ID3 = (function () {
  'use strict';

  var decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

  function toUint8(source) {
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    if (typeof Uint8Array !== 'undefined' && source instanceof Uint8Array) return source;
    if (typeof Blob !== 'undefined' && source instanceof Blob) {
      throw new TypeError('Use readBlob(blob) or read(File/Blob) for Blob input');
    }
    throw new TypeError('ID3 input must be an ArrayBuffer or Uint8Array');
  }

  function decodeLatin(bytes, start, length) {
    var out = '';
    for (var i = start; i < start + length && i < bytes.length; i++) {
      var value = bytes[i];
      if (value === 0) break;
      out += String.fromCharCode(value);
    }
    return out;
  }

  function decodeText(bytes, start, length, encoding) {
    var sub = bytes.subarray(start, start + length);
    if (encoding === 0) return decodeLatin(bytes, start, length);
    if (encoding === 3) {
      var utf8 = decoder ? decoder.decode(sub) : decodeLatin(bytes, start, length);
      return utf8.replace(/\0+$/, '');
    }
    if (encoding === 1) {
      var bom = sub[0] === 0xFF && sub[1] === 0xFE ? 'utf-16le' :
        sub[0] === 0xFE && sub[1] === 0xFF ? 'utf-16be' : 'utf-16';
      if (typeof TextDecoder !== 'undefined') {
        try { return new TextDecoder(bom).decode(sub.slice(2)).replace(/\0+$/, ''); } catch (_) {}
      }
    }
    return decodeLatin(bytes, start, length);
  }

  function synchsafe(bytes, start) {
    return ((bytes[start] & 0x7F) << 21) | ((bytes[start + 1] & 0x7F) << 14) |
      ((bytes[start + 2] & 0x7F) << 7) | (bytes[start + 3] & 0x7F);
  }

  function readV1(bytes) {
    if (bytes.length < 128 || decodeLatin(bytes, bytes.length - 128, 3) !== 'TAG') return null;
    var start = bytes.length - 128;
    return {
      title: decodeLatin(bytes, start + 3, 30),
      artist: decodeLatin(bytes, start + 33, 30),
      album: decodeLatin(bytes, start + 63, 30),
      year: decodeLatin(bytes, start + 93, 4),
      comment: decodeLatin(bytes, start + 97, 30),
      track: bytes[start + 125] === 0 ? bytes[start + 126] : null,
      genre: bytes[start + 127]
    };
  }

  function frameData(bytes, start, length, encoding) {
    var offset = start;
    if (encoding === 1 || encoding === 2) offset += 2;
    else if (encoding === 3) offset += 1;
    return decodeText(bytes, offset, Math.max(0, length - (offset - start)), encoding);
  }

  function readV2(bytes) {
    if (bytes.length < 10 || decodeLatin(bytes, 0, 3) !== 'ID3') return null;
    var major = bytes[3];
    var footer = bytes[5] & 0x10;
    var size = synchsafe(bytes, 6);
    var end = Math.min(bytes.length, 10 + size + (footer ? 10 : 0));
    var tags = {};
    var pictures = [];
    var offset = 10;
    while (offset + 10 <= end) {
      var id;
      if (major === 2) {
        id = decodeLatin(bytes, offset, 3);
        var frameSize2 = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
        var frameEnd2 = offset + 6 + frameSize2;
        if (frameSize2 <= 0 || frameEnd2 > end) break;
        parseFrame(id, bytes, offset + 6, frameSize2, major, tags, pictures);
        offset = frameEnd2;
      } else {
        id = decodeLatin(bytes, offset, 4);
        var frameSize = major === 4 ? synchsafe(bytes, offset + 4) :
          (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
        var flags = (bytes[offset + 8] << 8) | bytes[offset + 9];
        var frameEnd = offset + 10 + frameSize;
        if (frameSize <= 0 || frameEnd > end) break;
        parseFrame(id, bytes, offset + 10, frameSize, major, tags, pictures);
        offset = frameEnd;
      }
    }
    if (pictures.length) tags.picture = pictures[0];
    return tags;
  }

  function parseFrame(id, bytes, start, length, major, tags, pictures) {
    if (id === 'APIC' || id === 'PIC') {
      var encoding = bytes[start] || 0;
      var cursor = start + 1;
      var mimeEnd = cursor;
      while (mimeEnd < start + length && bytes[mimeEnd] !== 0) mimeEnd++;
      var mime = decodeLatin(bytes, cursor, mimeEnd - cursor);
      cursor = mimeEnd + 1;
      var pictureType = bytes[cursor] || 0;
      cursor++;
      var descriptionEnd = cursor;
      var separator = encoding === 1 ? 2 : 1;
      if (encoding === 1 || encoding === 2) {
        while (descriptionEnd + separator <= start + length &&
          !(bytes[descriptionEnd] === 0 && bytes[descriptionEnd + 1] === 0)) descriptionEnd += separator;
        descriptionEnd += separator;
      } else {
        while (descriptionEnd < start + length && bytes[descriptionEnd] !== 0) descriptionEnd++;
        descriptionEnd++;
      }
      var image = bytes.slice(descriptionEnd, start + length);
      pictures.push({
        type: pictureType,
        mime: mime,
        description: '',
        data: image
      });
      return;
    }

    if (/^T/.test(id) || id === 'COMM' || id === 'USLT') {
      var enc = bytes[start] || 0;
      var text = decodeText(bytes, start + 1, length - 1, enc);
      var names = {
        TIT2: 'title', TT2: 'title',
        TPE1: 'artist', TP1: 'artist',
        TALB: 'album', TAL: 'album',
        TDRC: 'year', TYER: 'year', TYE: 'year',
        TCON: 'genre', TCO: 'genre',
        TRCK: 'track', TRK: 'track',
        COMM: 'comment', USLT: 'lyrics'
      };
      if (names[id]) tags[names[id]] = text;
    }
  }

  async function read(source) {
    var data = source instanceof Blob ? await source.arrayBuffer() : source;
    var bytes = toUint8(data);
    var v2 = readV2(bytes) || {};
    var v1 = readV1(bytes) || {};
    var combined = {};
    Object.keys(v1).forEach(function (key) { if (v1[key] !== null && v1[key] !== '') combined[key] = v1[key]; });
    Object.keys(v2).forEach(function (key) { if (v2[key] !== null && v2[key] !== '') combined[key] = v2[key]; });
    return combined;
  }

  function readBlob(blob) { return read(blob); }

  return { read: read, readBlob: readBlob, readV1: readV1, readV2: readV2 };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.ID3;
