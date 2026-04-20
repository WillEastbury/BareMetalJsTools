var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Compress = (() => {
  'use strict';
const BLOCK_SIZE = 508;
const LITERAL_MAX = 64;
const MATCH_MIN = 2;
const MATCH_CODE_BITS = 5;
const MATCH_MAX = MATCH_MIN + ((1 << MATCH_CODE_BITS) - 1);
const OFFSET_SHORT_BITS = 9;
const OFFSET_SHORT_MAX = (1 << OFFSET_SHORT_BITS) - 1;
const LONG_MATCH_MIN = 2;
const LONG_MATCH_MAX = 17;
const OFFSET_LONG_MAX = 65535;
const DICT_COUNT = 96;
const GOOD_MATCH = 8;
const REPEAT_CACHE_SIZE = 3;
const BLOCK_MAX_COMPRESSED = BLOCK_SIZE + Math.ceil(BLOCK_SIZE / LITERAL_MAX) + 16;
const DEFAULT_HASH_BITS = 9;
const DEFAULT_HASH_CHAIN_DEPTH = 2;
const DEFAULT_HISTORY_SIZE = 504;
const DEFAULT_LAZY_STEPS = 1;
const DICT = [
  [0x22, 0x3A, 0x20, 0x22],[0x7D, 0x2C, 0x0A, 0x22],[0x3C, 0x2F, 0x64, 0x69, 0x76],[0x74, 0x69, 0x6F, 0x6E],[0x6D, 0x65, 0x6E, 0x74],
  [0x6E, 0x65, 0x73, 0x73],[0x61, 0x62, 0x6C, 0x65],[0x69, 0x67, 0x68, 0x74],[0x22, 0x3A, 0x22],[0x3C, 0x2F, 0x64, 0x69],
  [0x3D, 0x22, 0x68, 0x74],[0x74, 0x68, 0x65],[0x69, 0x6E, 0x67],[0x2C, 0x22, 0x2C],[0x22, 0x3A, 0x7B],
  [0x22, 0x3A, 0x5B],[0x69, 0x6F, 0x6E],[0x65, 0x6E, 0x74],[0x74, 0x65, 0x72],[0x61, 0x6E, 0x64],
  [0x2F, 0x3E, 0x0D, 0x0A],[0x22, 0x7D, 0x2C],[0x22, 0x5D, 0x2C],[0x68, 0x61, 0x76, 0x65],[0x6E, 0x6F, 0x22, 0x3A],
  [0x74, 0x72, 0x75, 0x65],[0x6E, 0x75, 0x6C, 0x6C],[0x6E, 0x61, 0x6D, 0x65],[0x64, 0x61, 0x74, 0x61],[0x74, 0x69, 0x6D, 0x65],
  [0x74, 0x79, 0x70, 0x65],[0x6D, 0x6F, 0x64, 0x65],[0x68, 0x74, 0x74, 0x70],[0x74, 0x69, 0x6F, 0x6E],[0x63, 0x6F, 0x64, 0x65],
  [0x73, 0x69, 0x7A, 0x65],[0x6D, 0x65, 0x6E, 0x74],[0x6C, 0x69, 0x73, 0x74],[0x69, 0x74, 0x65, 0x6D],[0x74, 0x65, 0x78, 0x74],
  [0x66, 0x61, 0x6C, 0x73, 0x65],[0x65, 0x72, 0x72, 0x6F, 0x72],[0x76, 0x61, 0x6C, 0x75, 0x65],[0x73, 0x74, 0x61, 0x74, 0x65],[0x61, 0x6C, 0x65, 0x72, 0x74],
  [0x69, 0x6E, 0x70, 0x75, 0x74],[0x61, 0x74, 0x69, 0x6F, 0x6E],[0x6F, 0x72, 0x64, 0x65, 0x72],[0x73, 0x74, 0x61, 0x74, 0x75, 0x73],[0x6E, 0x75, 0x6D, 0x62, 0x65, 0x72],
  [0x61, 0x63, 0x74, 0x69, 0x76, 0x65],[0x64, 0x65, 0x76, 0x69, 0x63, 0x65],[0x72, 0x65, 0x67, 0x69, 0x6F, 0x6E],[0x73, 0x74, 0x72, 0x69, 0x6E, 0x67],[0x72, 0x65, 0x73, 0x75, 0x6C, 0x74],
  [0x6C, 0x65, 0x6E, 0x67, 0x74, 0x68],[0x6D, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65],[0x63, 0x6F, 0x6E, 0x74, 0x65, 0x6E, 0x74],[0x72, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74],[0x64, 0x65, 0x66, 0x61, 0x75, 0x6C, 0x74],
  [0x6E, 0x75, 0x6D, 0x62, 0x65, 0x72, 0x22, 0x3A],[0x6F, 0x70, 0x65, 0x72, 0x61, 0x74, 0x6F, 0x72],[0x68, 0x74, 0x74, 0x70, 0x73, 0x3A, 0x2F, 0x2F],[0x72, 0x65, 0x73, 0x70, 0x6F, 0x6E, 0x73, 0x65],[0x2E, 0x20, 0x54, 0x68, 0x65, 0x20],
  [0x2E, 0x20, 0x49, 0x74, 0x20],[0x2E, 0x20, 0x54, 0x68, 0x69, 0x73, 0x20],[0x2E, 0x20, 0x41, 0x20],[0x48, 0x54, 0x54, 0x50],[0x4A, 0x53, 0x4F, 0x4E],
  [0x54, 0x68, 0x65, 0x20],[0x4E, 0x6F, 0x6E, 0x65],[0x6D, 0x65, 0x6E, 0x74],[0x6E, 0x65, 0x73, 0x73],[0x61, 0x62, 0x6C, 0x65],
  [0x69, 0x67, 0x68, 0x74],[0x61, 0x74, 0x69, 0x6F, 0x6E],[0x6F, 0x75, 0x6C, 0x64, 0x20],[0x22, 0x3A, 0x20, 0x22],[0x22, 0x2C, 0x20, 0x22],
  [0x44, 0x49, 0x4D],[0x46, 0x4F, 0x52],[0x45, 0x4E, 0x44],[0x52, 0x45, 0x4C],[0x45, 0x41, 0x43, 0x48],
  [0x4C, 0x4F, 0x41, 0x44],[0x53, 0x41, 0x56, 0x45],[0x43, 0x41, 0x52, 0x44],[0x4A, 0x55, 0x4D, 0x50],[0x50, 0x52, 0x49, 0x4E, 0x54],
  [0x49, 0x4E, 0x50, 0x55, 0x54],[0x47, 0x4F, 0x53, 0x55, 0x42],[0x53, 0x54, 0x52, 0x45, 0x41, 0x4D],[0x52, 0x45, 0x54, 0x55, 0x52, 0x4E],[0x53, 0x57, 0x49, 0x54, 0x43, 0x48],
  [0x50, 0x52, 0x4F, 0x47, 0x52, 0x41, 0x4D]
];
const DICT_U8 = DICT.map(d => new Uint8Array(d));
function hash3(buf, pos, hashSize) {
  return ((buf[pos] * 251 + buf[pos + 1] * 11 + buf[pos + 2] * 3) & 0xFFFFFFFF) & (hashSize - 1);
}
function matchLen(a, aOff, b, bOff, limit) {
  let m = 0;
  while (m < limit && a[aOff + m] === b[bOff + m]) ++m;
  return m;
}
function emitLiterals(src, srcOff, srcLen, dst, op) {
  let pos = 0;
  while (pos < srcLen) {
    let chunk = srcLen - pos;
    if (chunk > LITERAL_MAX) chunk = LITERAL_MAX;
    dst[op++] = (chunk - 1) & 0xFF;
    dst.set(src.subarray(srcOff + pos, srcOff + pos + chunk), op);
    op += chunk;
    pos += chunk;
  }
  return op;
}
function headInsert(head, depth, hashSize, h, pos) {
  for (let d = depth - 1; d > 0; --d) {
    head[d * hashSize + h] = head[(d - 1) * hashSize + h];
  }
  head[h] = pos;
}
function findBest(vbuf, vbufLen, vpos, head, depth, hashSize,
                  rOs, goodMatch, skipDict, out) {
  let bSv = 0;
  const remaining = vbufLen - vpos;
  out.len = 0;
  out.off = 0;
  out.dict = 0xFFFF;
  out.isRepeat = 0;
  if (remaining >= MATCH_MIN) {
    const maxRep = remaining > MATCH_MAX ? MATCH_MAX : remaining;
    for (let d = 0; d < REPEAT_CACHE_SIZE; ++d) {
      const off = rOs[d];
      if (off === 0 || off > vpos) continue;
      if (vbuf[vpos] !== vbuf[vpos - off]) continue;
      if (remaining >= 2 && vbuf[vpos + 1] !== vbuf[vpos - off + 1]) continue;
      const len = matchLen(vbuf, vpos - off, vbuf, vpos, maxRep);
      if (len < MATCH_MIN) continue;
      const isRep = (d === 0 && len <= 17) ? 1 : 0;
      const tokenCost = isRep ? 1 : (off <= OFFSET_SHORT_MAX ? 2 : 3);
      const s = len - tokenCost;
      if (s > bSv) {
        bSv = s;
        out.len = len;
        out.off = off;
        out.dict = 0xFFFF;
        out.isRepeat = isRep;
        if (len >= goodMatch) return bSv;
      }
    }
  }
  if (!skipDict) {
    const firstByte = vbuf[vpos];
    for (let d = 0; d < DICT_COUNT; ++d) {
      const entry = DICT_U8[d];
      const dlen = entry.length;
      if (dlen > remaining) continue;
      if (dlen - 1 <= bSv) continue;
      if (entry[0] !== firstByte) continue;
      let match = true;
      for (let k = 1; k < dlen; ++k) {
        if (vbuf[vpos + k] !== entry[k]) { match = false; break; }
      }
      if (!match) continue;
      bSv = dlen - 1;
      out.dict = d;
      out.len = dlen;
      out.off = 0;
      out.isRepeat = 0;
      if (dlen >= goodMatch) return bSv;
    }
  }
  if (remaining >= 3) {
    const h = hash3(vbuf, vpos, hashSize);
    const maxLenShort = remaining > MATCH_MAX ? MATCH_MAX : remaining;
    const maxLenLong = remaining > LONG_MATCH_MAX ? LONG_MATCH_MAX : remaining;
    const firstByte = vbuf[vpos];
    for (let d = 0; d < depth; ++d) {
      const prev = head[d * hashSize + h];
      if (prev < 0) continue;
      if (prev >= vpos) continue;
      const off = vpos - prev;
      if (off === 0 || off > OFFSET_LONG_MAX) continue;
      if (vbuf[prev] !== firstByte) continue;
      const maxLen = (off <= OFFSET_SHORT_MAX) ? maxLenShort : maxLenLong;
      const len = matchLen(vbuf, prev, vbuf, vpos, maxLen);
      if (len < MATCH_MIN) continue;
      const tokenCost = (off <= OFFSET_SHORT_MAX) ? 2 : 3;
      const s = len - tokenCost;
      if (s > bSv
          || (s === bSv && len > out.len)
          || (s === bSv && len === out.len && off < out.off)
          || (s === bSv - 1 && len >= out.len + 2)) {
        bSv = len - tokenCost;
        out.len = len;
        out.off = off;
        out.dict = 0xFFFF;
        out.isRepeat = 0;
        if (len >= goodMatch) return bSv;
      }
    }
  }
  return bSv;
}
function compressBlock(vbuf, histLen, blockLen, out, hashBits, chainDepth, lazySteps) {
  const hashSize = 1 << hashBits;
  const head = new Int16Array(chainDepth * hashSize);
  head.fill(-1);
  const rOs = new Uint16Array(REPEAT_CACHE_SIZE);
  const vbufLen = histLen + blockLen;
  let op = 0;
  if (histLen >= 3) {
    for (let p = 0; p + 2 < histLen; ++p) {
      headInsert(head, chainDepth, hashSize, hash3(vbuf, p, hashSize), p);
    }
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
    if (vbufLen - vpos < MATCH_MIN) break;
    let bSv;
    for (;;) {
      bSv = findBest(vbuf, vbufLen, vpos, head, chainDepth, hashSize,
                             rOs, GOOD_MATCH, dictSkip, bestOut);
      if (vbufLen - vpos >= 3) {
        headInsert(head, chainDepth, hashSize, hash3(vbuf, vpos, hashSize), vpos);
      }
      if (bSv <= 1 && bestOut.dict === 0xFFFF && anchor < vpos) {
        bSv = 0;
      }
      if (bSv > 0 && bestOut.len < GOOD_MATCH) {
        let improved = false;
        for (let step = 1; step <= lazySteps; ++step) {
          const npos = vpos + step;
          if (npos >= vbufLen || vbufLen - npos < MATCH_MIN) break;
          const nSav = findBest(vbuf, vbufLen, npos, head, chainDepth, hashSize,
                                rOs, GOOD_MATCH, dictSkip, lazyOut);
          if (nSav > bSv) {
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
        if (improved) continue;
      }
      break;
    }
    if (bSv > 0) {
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
        out[op++] = 0xC0 | ((bestOut.len - MATCH_MIN) & 0x0F);
      } else if (bestOut.off <= OFFSET_SHORT_MAX && bestOut.len <= MATCH_MAX) {
        out[op++] = 0x80
          | (((bestOut.len - MATCH_MIN) & 0x1F) << 1)
          | ((bestOut.off >>> 8) & 0x01);
        out[op++] = bestOut.off & 0xFF;
      } else {
        let elen = bestOut.len > LONG_MATCH_MAX ? LONG_MATCH_MAX : bestOut.len;
        out[op++] = 0xF0 | ((elen - LONG_MATCH_MIN) & 0x0F);
        out[op++] = (bestOut.off >>> 8) & 0xFF;
        out[op++] = bestOut.off & 0xFF;
        bestOut.len = elen;
      }
      if (!bestOut.isRepeat && bestOut.off !== 0 && bestOut.dict === 0xFFFF) {
        rOs[2] = rOs[1];
        rOs[1] = rOs[0];
        rOs[0] = bestOut.off;
      }
      for (let k = 1; k < bestOut.len && vpos + k + 2 < vbufLen; ++k) {
        headInsert(head, chainDepth, hashSize, hash3(vbuf, vpos + k, hashSize), vpos + k);
      }
      vpos += bestOut.len;
      anchor = vpos;
    } else {
      ++vpos;
    }
  }
  if (anchor < vbufLen) {
    op = emitLiterals(vbuf, anchor, vbufLen - anchor, out, op);
  }
  return op;
}
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
function decompressBlock(hist, histLen, input, inLen, out, outLen) {
  let ip = 0;
  let op = 0;
  let lastOffset = 0;
  while (ip < inLen) {
    const token = input[ip++];
    if (token < 0x40) {
      const litLen = (token & 0x3F) + 1;
      if (ip + litLen > inLen || op + litLen > outLen) throw new Error('corrupt');
      out.set(input.subarray(ip, ip + litLen), op);
      ip += litLen;
      op += litLen;
      continue;
    }
    if (token < 0x80) {
      const idx = token & 0x3F;
      if (idx >= DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }
    if (token < 0xC0) {
      if (ip >= inLen) throw new Error('corrupt');
      const ml = ((token >>> 1) & 0x1F) + MATCH_MIN;
      const off = ((token & 0x01) << 8) | input[ip++];
      if (off === 0 || off > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, off, ml);
      lastOffset = off;
      continue;
    }
    if (token < 0xD0) {
      const ml = (token & 0x0F) + MATCH_MIN;
      if (lastOffset === 0 || lastOffset > op + histLen || op + ml > outLen) throw new Error('corrupt');
      op = copyMatch(out, op, hist, histLen, lastOffset, ml);
      continue;
    }
    if (token < 0xE0) {
      const idx = 80 + (token & 0x0F);
      if (idx >= DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }
    if (token < 0xF0) {
      const idx = 64 + (token & 0x0F);
      if (idx >= DICT_COUNT) throw new Error('corrupt');
      const entry = DICT_U8[idx];
      if (op + entry.length > outLen) throw new Error('corrupt');
      out.set(entry, op);
      op += entry.length;
      continue;
    }
    {
      const ml = (token & 0x0F) + LONG_MATCH_MIN;
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
const PROFILES = {
  micro:      { bSz: 192, hashBits: 8,  chainDepth: 1, historySize: 64,   lazySteps: 1 },
  minimal:    { bSz: 508, hashBits: 8,  chainDepth: 1, historySize: 128,  lazySteps: 1 },
  balanced:   { bSz: 508, hashBits: 9,  chainDepth: 2, historySize: 504,  lazySteps: 1 },
  aggressive: { bSz: 508, hashBits: 8,  chainDepth: 4, historySize: 504,  lazySteps: 1 },
  q3:         { bSz: 508, hashBits: 10, chainDepth: 2, historySize: 1024, lazySteps: 2 },
  q4:         { bSz: 508, hashBits: 11, chainDepth: 2, historySize: 2048, lazySteps: 2 },
};
function compress(input, options) {
  if (!(input instanceof Uint8Array)) throw new TypeError('input must be Uint8Array');
  if (input.length === 0) return new Uint8Array(0);
  let profile = PROFILES.balanced;
  if (options?.profile && PROFILES[options.profile]) {
    profile = PROFILES[options.profile];
  }
  const bSz   = options?.bSz   ?? profile.bSz;
  const hashBits    = options?.hashBits    ?? profile.hashBits;
  const chainDepth  = options?.chainDepth  ?? profile.chainDepth;
  const historySize = options?.historySize ?? profile.historySize;
  const lazySteps   = options?.lazySteps   ?? profile.lazySteps;
  if (bSz < 1 || bSz > OFFSET_SHORT_MAX) {
    throw new RangeError(`bSz must be 1..${OFFSET_SHORT_MAX}`);
  }
  const maxComp = bSz + Math.ceil(bSz / LITERAL_MAX) + 16;
  const hist = new Uint8Array(historySize);
  let histLen = 0;
  const comb = new Uint8Array(historySize + bSz);
  const tmp = new Uint8Array(maxComp);
  const blocks = Math.ceil(input.length / bSz);
  const oB = new Uint8Array(input.length + blocks * 4 + 4);
  let outPos = 0;
  let pos = 0;
  while (pos < input.length) {
    const rawLen = Math.min(bSz, input.length - pos);
    comb.set(hist.subarray(0, histLen));
    comb.set(input.subarray(pos, pos + rawLen), histLen);
    const compLen = compressBlock(comb, histLen, rawLen, tmp, hashBits, chainDepth, lazySteps);
    if (compLen < rawLen) {
      oB[outPos++] = rawLen & 0xFF;
      oB[outPos++] = (rawLen >>> 8) & 0xFF;
      oB[outPos++] = compLen & 0xFF;
      oB[outPos++] = (compLen >>> 8) & 0xFF;
      oB.set(tmp.subarray(0, compLen), outPos);
      outPos += compLen;
    } else {
      oB[outPos++] = rawLen & 0xFF;
      oB[outPos++] = (rawLen >>> 8) & 0xFF;
      oB[outPos++] = 0;
      oB[outPos++] = 0;
      oB.set(input.subarray(pos, pos + rawLen), outPos);
      outPos += rawLen;
    }
    histLen = updateHistory(hist, histLen, input, pos, rawLen, historySize);
    pos += rawLen;
  }
  return oB.subarray(0, outPos);
}
function decompress(cmp) {
  if (!(cmp instanceof Uint8Array)) throw new TypeError('input must be Uint8Array');
  if (cmp.length === 0) return new Uint8Array(0);
  let totalOut = 0;
  let scanPos = 0;
  while (scanPos < cmp.length) {
    if (scanPos + 4 > cmp.length) throw new Error('truncated header');
    const rawLen = cmp[scanPos] | (cmp[scanPos + 1] << 8);
    const compLen = cmp[scanPos + 2] | (cmp[scanPos + 3] << 8);
    scanPos += 4;
    if (rawLen === 0 && compLen === 0) continue;
    if (rawLen === 0) throw new Error('corrupt');
    const payloadLen = compLen === 0 ? rawLen : compLen;
    if (scanPos + payloadLen > cmp.length) throw new Error('truncated payload');
    totalOut += rawLen;
    scanPos += payloadLen;
  }
  const output = new Uint8Array(totalOut);
  let outPos = 0;
  const maxHistSize = 2048;
  const hist = new Uint8Array(maxHistSize);
  let histLen = 0;
  let ip = 0;
  while (ip < cmp.length) {
    const rawLen = cmp[ip] | (cmp[ip + 1] << 8);
    const compLen = cmp[ip + 2] | (cmp[ip + 3] << 8);
    ip += 4;
    if (rawLen === 0 && compLen === 0) continue;
    if (compLen === 0) {
      output.set(cmp.subarray(ip, ip + rawLen), outPos);
      histLen = updateHistory(hist, histLen, cmp, ip, rawLen, maxHistSize);
      outPos += rawLen;
      ip += rawLen;
    } else {
      const blockOut = output.subarray(outPos, outPos + rawLen);
      decompressBlock(hist, histLen, cmp.subarray(ip, ip + compLen), compLen, blockOut, rawLen);
      histLen = updateHistory(hist, histLen, output, outPos, rawLen, maxHistSize);
      outPos += rawLen;
      ip += compLen;
    }
  }
  return output;
}
function compressBound(inputLen) {
  if (inputLen === 0) return 0;
  const blocks = Math.ceil(inputLen / BLOCK_SIZE);
  return inputLen + blocks * 4;
}
  return { compress: compress, decompress: decompress, compressBound: compressBound, PROFILES: PROFILES };
})();
if (typeof globalThis !== 'undefined') globalThis.PicoCompress = BareMetal.Compress;
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Compress;
