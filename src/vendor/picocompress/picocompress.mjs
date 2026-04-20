// picocompress — JavaScript port (ES module)
// Byte-identical to the C reference implementation.
// Pure JavaScript, zero dependencies, works in Node.js 18+ and modern browsers.

const PC_BLOCK_SIZE = 508;
const PC_LITERAL_MAX = 64;
const PC_MATCH_MIN = 2;
const PC_MATCH_CODE_BITS = 5;
const PC_MATCH_MAX = PC_MATCH_MIN + ((1 << PC_MATCH_CODE_BITS) - 1); // 33
const PC_OFFSET_SHORT_BITS = 9;
const PC_OFFSET_SHORT_MAX = (1 << PC_OFFSET_SHORT_BITS) - 1; // 511
const PC_LONG_MATCH_MIN = 2;
const PC_LONG_MATCH_MAX = 17;
const PC_OFFSET_LONG_MAX = 65535;
const PC_DICT_COUNT = 96;
const PC_GOOD_MATCH = 8;
const PC_REPEAT_CACHE_SIZE = 3;
const PC_BLOCK_MAX_COMPRESSED = PC_BLOCK_SIZE + Math.ceil(PC_BLOCK_SIZE / PC_LITERAL_MAX) + 16;

// Default profile constants (can be overridden via options)
const DEFAULT_HASH_BITS = 9;
const DEFAULT_HASH_CHAIN_DEPTH = 2;
const DEFAULT_HISTORY_SIZE = 504;
const DEFAULT_LAZY_STEPS = 1;

// ---- Static dictionary (96 entries, identical to C) ----

const DICT = [
  /* 0  */ [0x22, 0x3A, 0x20, 0x22],                         // ": "
  /* 1  */ [0x7D, 0x2C, 0x0A, 0x22],                         // },\n"
  /* 2  */ [0x3C, 0x2F, 0x64, 0x69, 0x76],                   // </div
  /* 3  */ [0x74, 0x69, 0x6F, 0x6E],                         // tion
  /* 4  */ [0x6D, 0x65, 0x6E, 0x74],                         // ment
  /* 5  */ [0x6E, 0x65, 0x73, 0x73],                         // ness
  /* 6  */ [0x61, 0x62, 0x6C, 0x65],                         // able
  /* 7  */ [0x69, 0x67, 0x68, 0x74],                         // ight
  /* 8  */ [0x22, 0x3A, 0x22],                               // ":"
  /* 9  */ [0x3C, 0x2F, 0x64, 0x69],                         // </di
  /* 10 */ [0x3D, 0x22, 0x68, 0x74],                         // ="ht
  /* 11 */ [0x74, 0x68, 0x65],                               // the
  /* 12 */ [0x69, 0x6E, 0x67],                               // ing
  /* 13 */ [0x2C, 0x22, 0x2C],                               // ","
  /* 14 */ [0x22, 0x3A, 0x7B],                               // ":{
  /* 15 */ [0x22, 0x3A, 0x5B],                               // ":[
  /* 16 */ [0x69, 0x6F, 0x6E],                               // ion
  /* 17 */ [0x65, 0x6E, 0x74],                               // ent
  /* 18 */ [0x74, 0x65, 0x72],                               // ter
  /* 19 */ [0x61, 0x6E, 0x64],                               // and
  /* 20 */ [0x2F, 0x3E, 0x0D, 0x0A],                         // />\r\n
  /* 21 */ [0x22, 0x7D, 0x2C],                               // "},
  /* 22 */ [0x22, 0x5D, 0x2C],                               // "],
  /* 23 */ [0x68, 0x61, 0x76, 0x65],                         // have
  /* 24 */ [0x6E, 0x6F, 0x22, 0x3A],                         // no":
  /* 25 */ [0x74, 0x72, 0x75, 0x65],                         // true
  /* 26 */ [0x6E, 0x75, 0x6C, 0x6C],                         // null
  /* 27 */ [0x6E, 0x61, 0x6D, 0x65],                         // name
  /* 28 */ [0x64, 0x61, 0x74, 0x61],                         // data
  /* 29 */ [0x74, 0x69, 0x6D, 0x65],                         // time
  /* 30 */ [0x74, 0x79, 0x70, 0x65],                         // type
  /* 31 */ [0x6D, 0x6F, 0x64, 0x65],                         // mode
  /* 32 */ [0x68, 0x74, 0x74, 0x70],                         // http
  /* 33 */ [0x74, 0x69, 0x6F, 0x6E],                         // tion
  /* 34 */ [0x63, 0x6F, 0x64, 0x65],                         // code
  /* 35 */ [0x73, 0x69, 0x7A, 0x65],                         // size
  /* 36 */ [0x6D, 0x65, 0x6E, 0x74],                         // ment
  /* 37 */ [0x6C, 0x69, 0x73, 0x74],                         // list
  /* 38 */ [0x69, 0x74, 0x65, 0x6D],                         // item
  /* 39 */ [0x74, 0x65, 0x78, 0x74],                         // text
  /* 40 */ [0x66, 0x61, 0x6C, 0x73, 0x65],                   // false
  /* 41 */ [0x65, 0x72, 0x72, 0x6F, 0x72],                   // error
  /* 42 */ [0x76, 0x61, 0x6C, 0x75, 0x65],                   // value
  /* 43 */ [0x73, 0x74, 0x61, 0x74, 0x65],                   // state
  /* 44 */ [0x61, 0x6C, 0x65, 0x72, 0x74],                   // alert
  /* 45 */ [0x69, 0x6E, 0x70, 0x75, 0x74],                   // input
  /* 46 */ [0x61, 0x74, 0x69, 0x6F, 0x6E],                   // ation
  /* 47 */ [0x6F, 0x72, 0x64, 0x65, 0x72],                   // order
  /* 48 */ [0x73, 0x74, 0x61, 0x74, 0x75, 0x73],             // status
  /* 49 */ [0x6E, 0x75, 0x6D, 0x62, 0x65, 0x72],             // number
  /* 50 */ [0x61, 0x63, 0x74, 0x69, 0x76, 0x65],             // active
  /* 51 */ [0x64, 0x65, 0x76, 0x69, 0x63, 0x65],             // device
  /* 52 */ [0x72, 0x65, 0x67, 0x69, 0x6F, 0x6E],             // region
  /* 53 */ [0x73, 0x74, 0x72, 0x69, 0x6E, 0x67],             // string
  /* 54 */ [0x72, 0x65, 0x73, 0x75, 0x6C, 0x74],             // result
  /* 55 */ [0x6C, 0x65, 0x6E, 0x67, 0x74, 0x68],             // length
  /* 56 */ [0x6D, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65],       // message
  /* 57 */ [0x63, 0x6F, 0x6E, 0x74, 0x65, 0x6E, 0x74],       // content
  /* 58 */ [0x72, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74],       // request
  /* 59 */ [0x64, 0x65, 0x66, 0x61, 0x75, 0x6C, 0x74],       // default
  /* 60 */ [0x6E, 0x75, 0x6D, 0x62, 0x65, 0x72, 0x22, 0x3A], // number":
  /* 61 */ [0x6F, 0x70, 0x65, 0x72, 0x61, 0x74, 0x6F, 0x72], // operator
  /* 62 */ [0x68, 0x74, 0x74, 0x70, 0x73, 0x3A, 0x2F, 0x2F], // https://
  /* 63 */ [0x72, 0x65, 0x73, 0x70, 0x6F, 0x6E, 0x73, 0x65], // response
  /* 64 */ [0x2E, 0x20, 0x54, 0x68, 0x65, 0x20],             // . The
  /* 65 */ [0x2E, 0x20, 0x49, 0x74, 0x20],                   // . It
  /* 66 */ [0x2E, 0x20, 0x54, 0x68, 0x69, 0x73, 0x20],       // . This
  /* 67 */ [0x2E, 0x20, 0x41, 0x20],                         // . A
  /* 68 */ [0x48, 0x54, 0x54, 0x50],                         // HTTP
  /* 69 */ [0x4A, 0x53, 0x4F, 0x4E],                         // JSON
  /* 70 */ [0x54, 0x68, 0x65, 0x20],                         // The
  /* 71 */ [0x4E, 0x6F, 0x6E, 0x65],                         // None
  /* 72 */ [0x6D, 0x65, 0x6E, 0x74],                         // ment
  /* 73 */ [0x6E, 0x65, 0x73, 0x73],                         // ness
  /* 74 */ [0x61, 0x62, 0x6C, 0x65],                         // able
  /* 75 */ [0x69, 0x67, 0x68, 0x74],                         // ight
  /* 76 */ [0x61, 0x74, 0x69, 0x6F, 0x6E],                   // ation
  /* 77 */ [0x6F, 0x75, 0x6C, 0x64, 0x20],                   // ould
  /* 78 */ [0x22, 0x3A, 0x20, 0x22],                         // ": "
  /* 79 */ [0x22, 0x2C, 0x20, 0x22],                         // ", "
  /* 80 */ [0x44, 0x49, 0x4D],                               // DIM
  /* 81 */ [0x46, 0x4F, 0x52],                               // FOR
  /* 82 */ [0x45, 0x4E, 0x44],                               // END
  /* 83 */ [0x52, 0x45, 0x4C],                               // REL
  /* 84 */ [0x45, 0x41, 0x43, 0x48],                         // EACH
  /* 85 */ [0x4C, 0x4F, 0x41, 0x44],                         // LOAD
  /* 86 */ [0x53, 0x41, 0x56, 0x45],                         // SAVE
  /* 87 */ [0x43, 0x41, 0x52, 0x44],                         // CARD
  /* 88 */ [0x4A, 0x55, 0x4D, 0x50],                         // JUMP
  /* 89 */ [0x50, 0x52, 0x49, 0x4E, 0x54],                   // PRINT
  /* 90 */ [0x49, 0x4E, 0x50, 0x55, 0x54],                   // INPUT
  /* 91 */ [0x47, 0x4F, 0x53, 0x55, 0x42],                   // GOSUB
  /* 92 */ [0x53, 0x54, 0x52, 0x45, 0x41, 0x4D],             // STREAM
  /* 93 */ [0x52, 0x45, 0x54, 0x55, 0x52, 0x4E],             // RETURN
  /* 94 */ [0x53, 0x57, 0x49, 0x54, 0x43, 0x48],             // SWITCH
  /* 95 */ [0x50, 0x52, 0x4F, 0x47, 0x52, 0x41, 0x4D],       // PROGRAM
];

// Convert to Uint8Array for fast comparison
const DICT_U8 = DICT.map(d => new Uint8Array(d));

// ---- Hash function (portable, matches C) ----

function hash3(buf, pos, hashSize) {
  return ((buf[pos] * 251 + buf[pos + 1] * 11 + buf[pos + 2] * 3) & 0xFFFFFFFF) & (hashSize - 1);
}

// ---- Match length ----

function matchLen(a, aOff, b, bOff, limit) {
  let m = 0;
  while (m < limit && a[aOff + m] === b[bOff + m]) ++m;
  return m;
}

// ---- Emit literals ----

function emitLiterals(src, srcOff, srcLen, dst, op) {
  let pos = 0;
  while (pos < srcLen) {
    let chunk = srcLen - pos;
    if (chunk > PC_LITERAL_MAX) chunk = PC_LITERAL_MAX;
    dst[op++] = (chunk - 1) & 0xFF; // 0x00..0x3F
    dst.set(src.subarray(srcOff + pos, srcOff + pos + chunk), op);
    op += chunk;
    pos += chunk;
  }
  return op;
}

// ---- Hash table insert ----

function headInsert(head, depth, hashSize, h, pos) {
  for (let d = depth - 1; d > 0; --d) {
    head[d * hashSize + h] = head[(d - 1) * hashSize + h];
  }
  head[h] = pos;
}

// ---- Find best match (repeat-cache, dict, LZ) ----

function findBest(vbuf, vbufLen, vpos, head, depth, hashSize,
                  repOffsets, goodMatch, skipDict, out) {
  let bestSavings = 0;
  const remaining = vbufLen - vpos;

  out.len = 0;
  out.off = 0;
  out.dict = 0xFFFF;
  out.isRepeat = 0;

  // 1. Repeat-offset cache
  if (remaining >= PC_MATCH_MIN) {
    const maxRep = remaining > PC_MATCH_MAX ? PC_MATCH_MAX : remaining;
    for (let d = 0; d < PC_REPEAT_CACHE_SIZE; ++d) {
      const off = repOffsets[d];
      if (off === 0 || off > vpos) continue;
      if (vbuf[vpos] !== vbuf[vpos - off]) continue;
      if (remaining >= 2 && vbuf[vpos + 1] !== vbuf[vpos - off + 1]) continue;
      const len = matchLen(vbuf, vpos - off, vbuf, vpos, maxRep);
      if (len < PC_MATCH_MIN) continue;

      const isRep = (d === 0 && len <= 17) ? 1 : 0;
      const tokenCost = isRep ? 1 : (off <= PC_OFFSET_SHORT_MAX ? 2 : 3);
      const s = len - tokenCost;

      if (s > bestSavings) {
        bestSavings = s;
        out.len = len;
        out.off = off;
        out.dict = 0xFFFF;
        out.isRepeat = isRep;
        if (len >= goodMatch) return bestSavings;
      }
    }
  }

  // 2. Dictionary match
  if (!skipDict) {
    const firstByte = vbuf[vpos];
    for (let d = 0; d < PC_DICT_COUNT; ++d) {
      const entry = DICT_U8[d];
      const dlen = entry.length;
      if (dlen > remaining) continue;
      if (dlen - 1 <= bestSavings) continue;
      if (entry[0] !== firstByte) continue;
      let match = true;
      for (let k = 1; k < dlen; ++k) {
        if (vbuf[vpos + k] !== entry[k]) { match = false; break; }
      }
      if (!match) continue;
      bestSavings = dlen - 1;
      out.dict = d;
      out.len = dlen;
      out.off = 0;
      out.isRepeat = 0;
      if (dlen >= goodMatch) return bestSavings;
    }
  }

  // 3. LZ hash-chain match
  if (remaining >= 3) {
    const h = hash3(vbuf, vpos, hashSize);
    const maxLenShort = remaining > PC_MATCH_MAX ? PC_MATCH_MAX : remaining;
    const maxLenLong = remaining > PC_LONG_MATCH_MAX ? PC_LONG_MATCH_MAX : remaining;
    const firstByte = vbuf[vpos];

    for (let d = 0; d < depth; ++d) {
      const prev = head[d * hashSize + h];
      if (prev < 0) continue;
      if (prev >= vpos) continue;
      const off = vpos - prev;
      if (off === 0 || off > PC_OFFSET_LONG_MAX) continue;
      if (vbuf[prev] !== firstByte) continue;

      const maxLen = (off <= PC_OFFSET_SHORT_MAX) ? maxLenShort : maxLenLong;
      const len = matchLen(vbuf, prev, vbuf, vpos, maxLen);
      if (len < PC_MATCH_MIN) continue;

      const tokenCost = (off <= PC_OFFSET_SHORT_MAX) ? 2 : 3;
      const s = len - tokenCost;

      if (s > bestSavings
          || (s === bestSavings && len > out.len)
          || (s === bestSavings && len === out.len && off < out.off)
          || (s === bestSavings - 1 && len >= out.len + 2)) {
        bestSavings = len - tokenCost;
        out.len = len;
        out.off = off;
        out.dict = 0xFFFF;
        out.isRepeat = 0;
        if (len >= goodMatch) return bestSavings;
      }
    }
  }

  return bestSavings;
}

// ---- Compress a single block ----

function compressBlock(vbuf, histLen, blockLen, out, hashBits, chainDepth, lazySteps) {
  const hashSize = 1 << hashBits;
  const head = new Int16Array(chainDepth * hashSize);
  head.fill(-1);
  const repOffsets = new Uint16Array(PC_REPEAT_CACHE_SIZE);
  const vbufLen = histLen + blockLen;
  let op = 0;

  // Seed hash table from history
  if (histLen >= 3) {
    for (let p = 0; p + 2 < histLen; ++p) {
      headInsert(head, chainDepth, hashSize, hash3(vbuf, p, hashSize), p);
    }
    // Boundary-boost: re-inject last 64 history positions into slot 0
    const tailStart = histLen > 64 ? histLen - 64 : 0;
    for (let p = tailStart; p + 2 < histLen; ++p) {
      const h = hash3(vbuf, p, hashSize);
      if (head[h] !== p) {
        const save = head[(chainDepth - 1) * hashSize + h];
        headInsert(head, chainDepth, hashSize, h, p);
        head[(chainDepth - 1) * hashSize + h] = save;
      }
    }
  }

  // Self-disabling dictionary check
  let dictSkip = false;
  if (blockLen >= 1) {
    const b0 = vbuf[histLen];
    if (b0 === 0x7B || b0 === 0x5B || b0 === 0x3C || b0 === 0xEF) {
      dictSkip = false;
    } else {
      const checkLen = blockLen < 4 ? blockLen : 4;
      for (let ci = 0; ci < checkLen; ++ci) {
        const c = vbuf[histLen + ci];
        if (c < 0x20 || c > 0x7E) { dictSkip = true; break; }
      }
    }
  }

  let anchor = histLen;
  let vpos = histLen;
  const bestOut = { len: 0, off: 0, dict: 0xFFFF, isRepeat: 0 };
  const lazyOut = { len: 0, off: 0, dict: 0xFFFF, isRepeat: 0 };

  while (vpos < vbufLen) {
    if (vbufLen - vpos < PC_MATCH_MIN) break;

    let bestSavings;

    // retry_pos loop (for lazy matching)
    for (;;) {
      bestSavings = findBest(vbuf, vbufLen, vpos, head, chainDepth, hashSize,
                             repOffsets, PC_GOOD_MATCH, dictSkip, bestOut);

      // Insert current position into hash table
      if (vbufLen - vpos >= 3) {
        headInsert(head, chainDepth, hashSize, hash3(vbuf, vpos, hashSize), vpos);
      }

      // Literal run extension
      if (bestSavings <= 1 && bestOut.dict === 0xFFFF && anchor < vpos) {
        bestSavings = 0;
      }

      // Lazy matching
      if (bestSavings > 0 && bestOut.len < PC_GOOD_MATCH) {
        let improved = false;
        for (let step = 1; step <= lazySteps; ++step) {
          const npos = vpos + step;
          if (npos >= vbufLen || vbufLen - npos < PC_MATCH_MIN) break;
          const nSav = findBest(vbuf, vbufLen, npos, head, chainDepth, hashSize,
                                repOffsets, PC_GOOD_MATCH, dictSkip, lazyOut);
          if (nSav > bestSavings) {
            // Insert skipped positions
            for (let s = 0; s < step; ++s) {
              const sp = vpos + s;
              if (vbufLen - sp >= 3) {
                headInsert(head, chainDepth, hashSize, hash3(vbuf, sp, hashSize), sp);
              }
            }
            vpos = npos;
            improved = true;
            break;
          }
        }
        if (improved) continue; // retry_pos
      }
      break; // no lazy improvement, proceed to emit
    }

    // Emit
    if (bestSavings > 0) {
      const litLen = vpos - anchor;
      if (litLen > 0) {
        op = emitLiterals(vbuf, anchor, litLen, out, op);
      }

      if (bestOut.dict !== 0xFFFF) {
        const idx = bestOut.dict;
        if (idx < 64) {
          out[op++] = 0x40 | (idx & 0x3F);
        } else if (idx < 80) {
          out[op++] = 0xE0 | ((idx - 64) & 0x0F);
        } else {
          out[op++] = 0xD0 | ((idx - 80) & 0x0F);
        }
      } else if (bestOut.isRepeat) {
        out[op++] = 0xC0 | ((bestOut.len - PC_MATCH_MIN) & 0x0F);
      } else if (bestOut.off <= PC_OFFSET_SHORT_MAX && bestOut.len <= PC_MATCH_MAX) {
        out[op++] = 0x80
          | (((bestOut.len - PC_MATCH_MIN) & 0x1F) << 1)
          | ((bestOut.off >>> 8) & 0x01);
        out[op++] = bestOut.off & 0xFF;
      } else {
        let elen = bestOut.len > PC_LONG_MATCH_MAX ? PC_LONG_MATCH_MAX : bestOut.len;
        out[op++] = 0xF0 | ((elen - PC_LONG_MATCH_MIN) & 0x0F);
        out[op++] = (bestOut.off >>> 8) & 0xFF;
        out[op++] = bestOut.off & 0xFF;
        bestOut.len = elen;
      }

      // Update repeat-offset cache
      if (!bestOut.isRepeat && bestOut.off !== 0 && bestOut.dict === 0xFFFF) {
        repOffsets[2] = repOffsets[1];
        repOffsets[1] = repOffsets[0];
        repOffsets[0] = bestOut.off;
      }

      // Insert match positions into hash table
      for (let k = 1; k < bestOut.len && vpos + k + 2 < vbufLen; ++k) {
        headInsert(head, chainDepth, hashSize, hash3(vbuf, vpos + k, hashSize), vpos + k);
      }

      vpos += bestOut.len;
      anchor = vpos;
    } else {
      ++vpos;
    }
  }

  // Trailing literals
  if (anchor < vbufLen) {
    op = emitLiterals(vbuf, anchor, vbufLen - anchor, out, op);
  }

  return op;
}

// ---- History management ----

function updateHistory(hist, histLen, data, dataOff, len, historySize) {
  if (len >= historySize) {
    hist.set(data.subarray(dataOff + len - historySize, dataOff + len));
    return historySize;
  }
  if (histLen + len <= historySize) {
    hist.set(data.subarray(dataOff, dataOff + len), histLen);
    return histLen + len;
  }
  const keep = Math.min(historySize - len, histLen);
  hist.copyWithin(0, histLen - keep, histLen);
  hist.set(data.subarray(dataOff, dataOff + len), keep);
  return keep + len;
}

// ---- Copy match (decompress helper) ----

function copyMatch(out, op, hist, histLen, off, matchLen) {
  if (off <= op) {
    const src = op - off;
    for (let j = 0; j < matchLen; ++j) {
      out[op++] = out[src + j];
    }
  } else {
    const histBack = off - op;
    const histStart = histLen - histBack;
    for (let j = 0; j < matchLen; ++j) {
      const src = histStart + j;
      if (src < histLen) {
        out[op++] = hist[src];
      } else {
        out[op++] = out[src - histLen];
      }
    }
  }
  return op;
}

// ---- Decompress a single block ----

function decompressBlock(hist, histLen, input, inLen, out, outLen) {
  let ip = 0;
  let op = 0;
  let lastOffset = 0;

  while (ip < inLen) {
    const token = input[ip++];

    // 0x00..0x3F: short literal
    if (token < 0x40) {
      const litLen = (token & 0x3F) + 1;
      if (ip + litLen > inLen || op + litLen > outLen) throw new Error('corrupt');
      out.set(input.subarray(ip, ip + litLen), op);
      ip += litLen;
      op += litLen;
      continue;
    }

    // 0x40..0x7F: dictionary ref (0..63)
    if (token < 0x80) {
      const idx = token & 0x3F;
      if (idx >= PC_DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }

    // 0x80..0xBF: LZ match (short offset)
    if (token < 0xC0) {
      if (ip >= inLen) throw new Error('corrupt');
      const ml = ((token >>> 1) & 0x1F) + PC_MATCH_MIN;
      const off = ((token & 0x01) << 8) | input[ip++];
      if (off === 0 || off > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, off, ml);
      lastOffset = off;
      continue;
    }

    // 0xC0..0xCF: repeat-offset match
    if (token < 0xD0) {
      const ml = (token & 0x0F) + PC_MATCH_MIN;
      if (lastOffset === 0 || lastOffset > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, lastOffset, ml);
      continue;
    }

    // 0xD0..0xDF: dictionary ref (80..95)
    if (token < 0xE0) {
      const idx = 80 + (token & 0x0F);
      if (idx >= PC_DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }

    // 0xE0..0xEF: dictionary ref (64..79)
    if (token < 0xF0) {
      const idx = 64 + (token & 0x0F);
      if (idx >= PC_DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }

    // 0xF0..0xFF: long-offset LZ match
    {
      const ml = (token & 0x0F) + PC_LONG_MATCH_MIN;
      if (ip + 2 > inLen) throw new Error('corrupt');
      const off = (input[ip] << 8) | input[ip + 1];
      ip += 2;
      if (off === 0 || off > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, off, ml);
      lastOffset = off;
    }
  }

  if (op !== outLen) throw new Error('corrupt');
}

// ---- Profiles ----

const PROFILES = {
  micro:      { blockSize: 192, hashBits: 8,  chainDepth: 1, historySize: 64,   lazySteps: 1 },
  minimal:    { blockSize: 508, hashBits: 8,  chainDepth: 1, historySize: 128,  lazySteps: 1 },
  balanced:   { blockSize: 508, hashBits: 9,  chainDepth: 2, historySize: 504,  lazySteps: 1 },
  aggressive: { blockSize: 508, hashBits: 8,  chainDepth: 4, historySize: 504,  lazySteps: 1 },
  q3:         { blockSize: 508, hashBits: 10, chainDepth: 2, historySize: 1024, lazySteps: 2 },
  q4:         { blockSize: 508, hashBits: 11, chainDepth: 2, historySize: 2048, lazySteps: 2 },
};

// ---- Public API ----

/**
 * Compress input bytes.
 * @param {Uint8Array} input
 * @param {object} [options]
 * @param {string} [options.profile] - 'micro'|'minimal'|'balanced'|'aggressive'|'q3'|'q4'
 * @param {number} [options.blockSize]
 * @param {number} [options.hashBits]
 * @param {number} [options.chainDepth]
 * @param {number} [options.historySize]
 * @param {number} [options.lazySteps]
 * @returns {Uint8Array}
 */
export function compress(input, options) {
  if (!(input instanceof Uint8Array)) throw new TypeError('input must be Uint8Array');
  if (input.length === 0) return new Uint8Array(0);

  // Resolve profile
  let profile = PROFILES.balanced;
  if (options?.profile && PROFILES[options.profile]) {
    profile = PROFILES[options.profile];
  }

  const blockSize   = options?.blockSize   ?? profile.blockSize;
  const hashBits    = options?.hashBits    ?? profile.hashBits;
  const chainDepth  = options?.chainDepth  ?? profile.chainDepth;
  const historySize = options?.historySize ?? profile.historySize;
  const lazySteps   = options?.lazySteps   ?? profile.lazySteps;

  if (blockSize < 1 || blockSize > PC_OFFSET_SHORT_MAX) {
    throw new RangeError(`blockSize must be 1..${PC_OFFSET_SHORT_MAX}`);
  }

  const maxComp = blockSize + Math.ceil(blockSize / PC_LITERAL_MAX) + 16;
  const hist = new Uint8Array(historySize);
  let histLen = 0;
  const combined = new Uint8Array(historySize + blockSize);
  const tmp = new Uint8Array(maxComp);

  // Output buffer — worst case: 4-byte header per block + raw data
  const blocks = Math.ceil(input.length / blockSize);
  const outBuf = new Uint8Array(input.length + blocks * 4 + 4);
  let outPos = 0;

  let pos = 0;
  while (pos < input.length) {
    const rawLen = Math.min(blockSize, input.length - pos);

    // Build virtual buffer: [history | block]
    combined.set(hist.subarray(0, histLen));
    combined.set(input.subarray(pos, pos + rawLen), histLen);

    const compLen = compressBlock(combined, histLen, rawLen, tmp, hashBits, chainDepth, lazySteps);

    // Write 4-byte LE header
    if (compLen < rawLen) {
      outBuf[outPos++] = rawLen & 0xFF;
      outBuf[outPos++] = (rawLen >>> 8) & 0xFF;
      outBuf[outPos++] = compLen & 0xFF;
      outBuf[outPos++] = (compLen >>> 8) & 0xFF;
      outBuf.set(tmp.subarray(0, compLen), outPos);
      outPos += compLen;
    } else {
      // Raw fallback
      outBuf[outPos++] = rawLen & 0xFF;
      outBuf[outPos++] = (rawLen >>> 8) & 0xFF;
      outBuf[outPos++] = 0;
      outBuf[outPos++] = 0;
      outBuf.set(input.subarray(pos, pos + rawLen), outPos);
      outPos += rawLen;
    }

    // Update history
    histLen = updateHistory(hist, histLen, input, pos, rawLen, historySize);
    pos += rawLen;
  }

  return outBuf.subarray(0, outPos);
}

/**
 * Decompress picocompress data.
 * @param {Uint8Array} compressed
 * @returns {Uint8Array}
 */
export function decompress(compressed) {
  if (!(compressed instanceof Uint8Array)) throw new TypeError('input must be Uint8Array');
  if (compressed.length === 0) return new Uint8Array(0);

  // First pass: compute total output size by scanning headers
  let totalOut = 0;
  let scanPos = 0;
  while (scanPos < compressed.length) {
    if (scanPos + 4 > compressed.length) throw new Error('truncated header');
    const rawLen = compressed[scanPos] | (compressed[scanPos + 1] << 8);
    const compLen = compressed[scanPos + 2] | (compressed[scanPos + 3] << 8);
    scanPos += 4;
    if (rawLen === 0 && compLen === 0) continue;
    if (rawLen === 0) throw new Error('corrupt');
    const payloadLen = compLen === 0 ? rawLen : compLen;
    if (scanPos + payloadLen > compressed.length) throw new Error('truncated payload');
    totalOut += rawLen;
    scanPos += payloadLen;
  }

  const output = new Uint8Array(totalOut);
  let outPos = 0;

  // We need a generous history buffer for decompression — use max possible
  // (the encoder could have used any history size; the decoder just needs enough)
  const maxHistSize = 2048;
  const hist = new Uint8Array(maxHistSize);
  let histLen = 0;

  let ip = 0;
  while (ip < compressed.length) {
    const rawLen = compressed[ip] | (compressed[ip + 1] << 8);
    const compLen = compressed[ip + 2] | (compressed[ip + 3] << 8);
    ip += 4;

    if (rawLen === 0 && compLen === 0) continue;

    if (compLen === 0) {
      // Stored raw
      output.set(compressed.subarray(ip, ip + rawLen), outPos);
      histLen = updateHistory(hist, histLen, compressed, ip, rawLen, maxHistSize);
      outPos += rawLen;
      ip += rawLen;
    } else {
      // Decompress
      const blockOut = output.subarray(outPos, outPos + rawLen);
      decompressBlock(hist, histLen, compressed.subarray(ip, ip + compLen), compLen, blockOut, rawLen);
      histLen = updateHistory(hist, histLen, output, outPos, rawLen, maxHistSize);
      outPos += rawLen;
      ip += compLen;
    }
  }

  return output;
}

/**
 * Compute worst-case compressed size bound.
 * @param {number} inputLen
 * @returns {number}
 */
export function compressBound(inputLen) {
  if (inputLen === 0) return 0;
  const blocks = Math.ceil(inputLen / PC_BLOCK_SIZE);
  return inputLen + blocks * 4;
}

export { PROFILES };

export default { compress, decompress, compressBound, PROFILES };
