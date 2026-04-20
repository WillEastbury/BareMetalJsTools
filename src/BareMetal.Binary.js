var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Binary = (() => {
  'use strict';
  const MAGIC = 0x314F5342, VERSION = 3, SIG_SIZE = 32, HDR_FIELDS = 13;
  const HDR_SIZE = HDR_FIELDS + SIG_SIZE;
  const MAX_STR = 4 * 1024 * 1024, MAX_DEPTH = 64;
  const utf8 = new TextEncoder(), utf8d = new TextDecoder('utf-8');
  const _HEX = new Array(256);
  for (let i = 0; i < 256; i++) _HEX[i] = i.toString(16).padStart(2, '0');
  let _cryptoKey = null;
  const _hmacOpts = { name: 'HMAC', hash: 'SHA-256' };
  async function setSigningKey(base64Key) {
    const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    _cryptoKey = await crypto.subtle.importKey('raw', raw, _hmacOpts, false, ['sign', 'verify']);
  }
  async function setSigningKeyBytes(keyBytes) {
    _cryptoKey = await crypto.subtle.importKey('raw', keyBytes, _hmacOpts, false, ['sign', 'verify']);
  }
  class SpanReader {
    constructor(buffer) {
      const ab = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
      const bo = buffer.byteOffset || 0, bl = buffer.byteLength;
      this.dv = new DataView(ab, bo, bl);
      this.buf = new Uint8Array(ab, bo, bl);
      this.off = 0;
    }
    ensure(n) { if (this.off + n > this.dv.byteLength) throw new Error('EOF'); }
    readByte() { this.ensure(1); return this.dv.getUint8(this.off++); }
    readSByte() { this.ensure(1); return this.dv.getInt8(this.off++); }
    readBool() { return this.readByte() !== 0; }
    readInt16() { this.ensure(2); const v = this.dv.getInt16(this.off, true); this.off += 2; return v; }
    readUInt16() { this.ensure(2); const v = this.dv.getUint16(this.off, true); this.off += 2; return v; }
    readInt32() { this.ensure(4); const v = this.dv.getInt32(this.off, true); this.off += 4; return v; }
    readUInt32() { this.ensure(4); const v = this.dv.getUint32(this.off, true); this.off += 4; return v; }
    readInt64() {
      this.ensure(8);
      const lo = this.dv.getUint32(this.off, true), hi = this.dv.getInt32(this.off + 4, true);
      this.off += 8;
      return BigInt(hi) * 0x100000000n + BigInt(lo >>> 0);
    }
    readUInt64() {
      this.ensure(8);
      const lo = this.dv.getUint32(this.off, true), hi = this.dv.getUint32(this.off + 4, true);
      this.off += 8;
      return BigInt(hi) * 0x100000000n + BigInt(lo >>> 0);
    }
    readFloat32() { this.ensure(4); const v = this.dv.getFloat32(this.off, true); this.off += 4; return v; }
    readFloat64() { this.ensure(8); const v = this.dv.getFloat64(this.off, true); this.off += 8; return v; }
    readDecimal() {
      const lo = this.readInt32(), mid = this.readInt32();
      const hi = this.readInt32(), flags = this.readInt32();
      const neg = (flags & 0x80000000) !== 0, scale = (flags >>> 16) & 0xFF;
      let val = (Math.abs(hi) * 4294967296 + (mid >>> 0)) * 4294967296 + (lo >>> 0);
      val /= Math.pow(10, scale);
      return neg ? -val : val;
    }
    readChar() { return String.fromCharCode(this.readUInt16()); }
    readBytes(n) { this.ensure(n); const s = this.buf.subarray(this.off, this.off + n); this.off += n; return s; }
    readGuid() {
      this.ensure(16);
      const b = this.buf, o = this.off; this.off += 16;
      return _HEX[b[o]]+_HEX[b[o+1]]+_HEX[b[o+2]]+_HEX[b[o+3]]+'-'+
        _HEX[b[o+4]]+_HEX[b[o+5]]+'-'+_HEX[b[o+6]]+_HEX[b[o+7]]+'-'+
        _HEX[b[o+8]]+_HEX[b[o+9]]+'-'+
        _HEX[b[o+10]]+_HEX[b[o+11]]+_HEX[b[o+12]]+_HEX[b[o+13]]+_HEX[b[o+14]]+_HEX[b[o+15]];
    }
    readIdentifier() { return decodeIdentifier(this.readUInt64(), this.readUInt64()); }
    skip(n) { this.off += n; }
  }
  class SpanWriter {
    constructor(sz) {
      this.capacity = sz || 256;
      this.buf = new ArrayBuffer(this.capacity);
      this.u8 = new Uint8Array(this.buf);
      this.dv = new DataView(this.buf);
      this.off = 0;
    }
    ensure(n) {
      if (this.off + n <= this.capacity) return;
      while (this.off + n > this.capacity) this.capacity *= 2;
      const nb = new ArrayBuffer(this.capacity);
      new Uint8Array(nb).set(this.u8.subarray(0, this.off));
      this.buf = nb; this.u8 = new Uint8Array(nb); this.dv = new DataView(nb);
    }
    writeByte(v) { this.ensure(1); this.dv.setUint8(this.off++, v); }
    writeSByte(v) { this.ensure(1); this.dv.setInt8(this.off++, v); }
    writeBool(v) { this.writeByte(v ? 1 : 0); }
    writeInt16(v) { this.ensure(2); this.dv.setInt16(this.off, v, true); this.off += 2; }
    writeUInt16(v) { this.ensure(2); this.dv.setUint16(this.off, v, true); this.off += 2; }
    writeInt32(v) { this.ensure(4); this.dv.setInt32(this.off, v, true); this.off += 4; }
    writeUInt32(v) { this.ensure(4); this.dv.setUint32(this.off, v, true); this.off += 4; }
    writeInt64(v) {
      this.ensure(8); const big = BigInt(v);
      this.dv.setUint32(this.off, Number(big & 0xFFFFFFFFn), true);
      this.dv.setInt32(this.off + 4, Number(big >> 32n), true);
      this.off += 8;
    }
    writeUInt64(v) {
      this.ensure(8); const big = BigInt(v);
      this.dv.setUint32(this.off, Number(big & 0xFFFFFFFFn), true);
      this.dv.setUint32(this.off + 4, Number((big >> 32n) & 0xFFFFFFFFn), true);
      this.off += 8;
    }
    writeFloat32(v) { this.ensure(4); this.dv.setFloat32(this.off, v, true); this.off += 4; }
    writeFloat64(v) { this.ensure(8); this.dv.setFloat64(this.off, v, true); this.off += 8; }
    writeDecimal(v) {
      const neg = v < 0, abs = Math.abs(v);
      const str = abs.toFixed(10), dot = str.indexOf('.');
      const scale = dot >= 0 ? str.length - dot - 1 : 0;
      let int = BigInt(str.replace('.', ''));
      while (int > 0n && int % 10n === 0n && scale > 0) int /= 10n;
      const lo = Number(int & 0xFFFFFFFFn);
      const mid = Number((int >> 32n) & 0xFFFFFFFFn);
      const hi = Number((int >> 64n) & 0xFFFFFFFFn);
      this.writeInt32(lo); this.writeInt32(mid); this.writeInt32(hi);
      this.writeInt32((scale << 16) | (neg ? 0x80000000 : 0));
    }
    writeChar(v) { this.writeUInt16(typeof v === 'string' ? v.charCodeAt(0) : v); }
    writeBytes(bytes) { this.ensure(bytes.length); this.u8.set(bytes, this.off); this.off += bytes.length; }
    writeGuid(str) {
      const hex = str.replace(/-/g, '');
      if (hex.length !== 32) throw new Error('Invalid GUID: expected 32 hex chars');
      this.ensure(16);
      const validHex = /^[0-9a-fA-F]{32}$/;
      if (!validHex.test(hex)) throw new Error('Invalid GUID hex character at position 0');
      for (let i = 0; i < 16; i++) {
        const h = hex.charCodeAt(i * 2), l = hex.charCodeAt(i * 2 + 1);
        this.u8[this.off++] = (((h < 58 ? h - 48 : (h | 32) - 87) << 4) | (l < 58 ? l - 48 : (l | 32) - 87));
      }
    }
    writeString(s) {
      if (s === null || s === undefined) { this.writeInt32(-1); return; }
      const bytes = utf8.encode(s);
      this.writeInt32(bytes.length);
      if (bytes.length > 0) this.writeBytes(bytes);
    }
    writeIdentifier(str) {
      const [hi, lo] = encodeIdentifier(str);
      this.writeUInt64(hi); this.writeUInt64(lo);
    }
    toUint8Array() { return new Uint8Array(this.buf, 0, this.off); }
  }
  const ID_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-', ID_MAX = 25;
  function decodeIdentifier(hi, lo) {
    if (hi === 0n && lo === 0n) return '';
    const len = Number((hi >> 59n) & 0x1Fn);
    if (len === 0 || len > ID_MAX) return '';
    hi = hi & 0x07FFFFFFFFFFFFFFn;
    const chars = [];
    for (let i = len - 1; i >= 0; i--) {
      const qH = hi / 37n, rH = hi % 37n;
      const c1 = (rH << 32n) | (lo >> 32n);
      const qM = c1 / 37n, rM = c1 % 37n;
      const c2 = (rM << 32n) | (lo & 0xFFFFFFFFn);
      const qL = c2 / 37n, rem = c2 % 37n;
      chars[i] = ID_ALPHA[Number(rem)];
      hi = qH; lo = (qM << 32n) | qL;
    }
    return chars.join('');
  }
  function encodeIdentifier(str) {
    if (!str || str.length === 0) return [0n, 0n];
    const norm = str.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (norm.length > ID_MAX) throw new Error('Identifier too long');
    let hi = 0n, lo = 0n;
    for (let i = 0; i < norm.length; i++) {
      const idx = ID_ALPHA.indexOf(norm[i]);
      if (idx < 0) throw new Error(`Invalid char '${norm[i]}'`);
      const loCarry = (lo * 37n) >> 64n;
      lo = (lo * 37n) & 0xFFFFFFFFFFFFFFFFn;
      hi = hi * 37n + loCarry;
      lo = lo + BigInt(idx);
      if (lo > 0xFFFFFFFFFFFFFFFFn) { hi++; lo = lo & 0xFFFFFFFFFFFFFFFFn; }
    }
    hi |= BigInt(norm.length) << 59n;
    return [hi, lo];
  }
  async function computeSignature(payload) {
    const parts = new Uint8Array(payload.length - SIG_SIZE);
    parts.set(payload.subarray(0, HDR_FIELDS));
    parts.set(payload.subarray(HDR_SIZE), HDR_FIELDS);
    return new Uint8Array(await crypto.subtle.sign('HMAC', _cryptoKey, parts));
  }
  async function signPayload(payload) { payload.set(await computeSignature(payload), HDR_FIELDS); }
  async function verifySignature(payload) {
    const expected = await computeSignature(payload);
    const actual = payload.subarray(HDR_FIELDS, HDR_SIZE);
    if (expected.length !== actual.length) return false;
    let ok = true;
    for (let i = 0; i < expected.length; i++) ok = ok && (expected[i] === actual[i]);
    return ok;
  }
  const _schemas = {};
  async function fetchSchema(slug, apiRoot) {
    if (_schemas[slug]) return _schemas[slug];
    const r = await fetch((apiRoot || '/api/') + '_binary/' + slug + '/_schema');
    if (!r.ok) throw new Error(`Schema fetch failed: ${r.status}`);
    _schemas[slug] = await r.json();
    return _schemas[slug];
  }
  function getCachedSchema(slug) { return _schemas[slug] || null; }
  const EPOCH_TICKS = 621355968000000000n;
  const _enumReader = { Byte:'readByte', SByte:'readSByte', Int16:'readInt16', UInt16:'readUInt16',
    UInt32:'readUInt32', Int64:'readInt64', UInt64:'readUInt64' };
  const _enumWriter = { Byte:'writeByte', SByte:'writeSByte', Int16:'writeInt16', UInt16:'writeUInt16',
    UInt32:'writeUInt32', Int64:'writeInt64', UInt64:'writeUInt64' };
  function readEnum(reader, member) {
    const m = _enumReader[member.enumUnderlying || 'Int32'];
    return m ? reader[m]() : reader.readInt32();
  }
  function writeEnum(writer, member, value) {
    const v = value | 0, u = member.enumUnderlying || 'Int32';
    if (u === 'UInt32') { writer.writeUInt32(v >>> 0); return; }
    if (u === 'Int64') { writer.writeInt64(BigInt(v)); return; }
    if (u === 'UInt64') { writer.writeUInt64(BigInt(v)); return; }
    const m = _enumWriter[u];
    m ? writer[m](v) : writer.writeInt32(v);
  }
  function readStr(reader) {
    const len = reader.readInt32();
    if (len < 0) return null;
    if (len === 0) return '';
    if (len > MAX_STR) throw new Error('String too long');
    return utf8d.decode(reader.readBytes(len));
  }
  function readDateTime(reader) {
    const ticks = reader.readInt64(); reader.readByte();
    return new Date(Number((ticks - EPOCH_TICKS) / 10000n));
  }
  function readDateOnly(reader) {
    return new Date((reader.readInt32() - 719162) * 86400000).toISOString().slice(0, 10);
  }
  function readTimeOnly(reader) {
    const ts = Number(reader.readInt64() / 10000000n);
    const h = Math.floor(ts / 3600), m = Math.floor((ts % 3600) / 60), s = ts % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function readDateTimeOffset(reader) {
    const ticks = reader.readInt64(), offMin = reader.readInt16();
    return new Date(Number((ticks - EPOCH_TICKS) / 10000n) - offMin * 60000);
  }
  const _readMap = {
    Bool: r => r.readBool(), Byte: r => r.readByte(), SByte: r => r.readSByte(),
    Int16: r => r.readInt16(), UInt16: r => r.readUInt16(),
    Int32: r => r.readInt32(), UInt32: r => r.readUInt32(),
    Int64: r => r.readInt64(), UInt64: r => r.readUInt64(),
    Float32: r => r.readFloat32(), Float64: r => r.readFloat64(),
    Decimal: r => r.readDecimal(), Char: r => r.readChar(),
    String: r => readStr(r), Guid: r => r.readGuid(),
    DateTime: r => readDateTime(r), DateOnly: r => readDateOnly(r),
    TimeOnly: r => readTimeOnly(r), DateTimeOffset: r => readDateTimeOffset(r),
    TimeSpan: r => r.readInt64(), Identifier: r => r.readIdentifier(),
  };
  function readFieldValue(reader, member, depth) {
    if (depth > MAX_DEPTH) throw new Error('Max depth exceeded');
    if (member.isNullable && reader.readByte() === 0) return null;
    if (member.wireType === 'Enum') return readEnum(reader, member);
    const fn = _readMap[member.wireType];
    return fn ? fn(reader) : readStr(reader);
  }
  function writeDateTime(w, value) {
    const d = value instanceof Date ? value : new Date(value || 0);
    w.writeInt64(EPOCH_TICKS + BigInt(d.getTime()) * 10000n);
    w.writeByte(1);
  }
  function writeDateOnly(w, value) {
    let d;
    if (typeof value === 'string') { const p = value.split('-'); d = new Date(Date.UTC(+p[0], +p[1]-1, +p[2])); }
    else d = value instanceof Date ? value : new Date(value || 0);
    w.writeInt32(Math.floor(d.getTime() / 86400000) + 719162);
  }
  function writeTimeOnly(w, value) {
    let ticks = 0n;
    if (typeof value === 'string') {
      const p = value.split(':').map(Number);
      ticks = BigInt((p[0]||0)*3600 + (p[1]||0)*60 + (p[2]||0)) * 10000000n;
    }
    w.writeInt64(ticks);
  }
  function writeDateTimeOffset(w, value) {
    const d = value instanceof Date ? value : new Date(value || 0);
    w.writeInt64(EPOCH_TICKS + BigInt(d.getTime()) * 10000n);
    w.writeInt16(0);
  }
  function writeFieldValue(w, member, value, depth) {
    if (depth > MAX_DEPTH) throw new Error('Max depth exceeded');
    if (member.isNullable) {
      if (value === null || value === undefined) { w.writeByte(0); return; }
      w.writeByte(1);
    }
    switch (member.wireType) {
      case 'Bool': w.writeBool(!!value); break;
      case 'Byte': w.writeByte(value | 0); break;
      case 'SByte': w.writeSByte(value | 0); break;
      case 'Int16': w.writeInt16(value | 0); break;
      case 'UInt16': w.writeUInt16(value | 0); break;
      case 'Int32': w.writeInt32(value | 0); break;
      case 'UInt32': w.writeUInt32(value >>> 0); break;
      case 'Int64': w.writeInt64(BigInt(value || 0)); break;
      case 'UInt64': w.writeUInt64(BigInt(value || 0)); break;
      case 'Float32': w.writeFloat32(value || 0); break;
      case 'Float64': w.writeFloat64(value || 0); break;
      case 'Decimal': w.writeDecimal(value || 0); break;
      case 'Char': w.writeChar(value || '\0'); break;
      case 'String': w.writeString(value ?? null); break;
      case 'Guid': w.writeGuid(value || '00000000-0000-0000-0000-000000000000'); break;
      case 'DateTime': writeDateTime(w, value); break;
      case 'DateOnly': writeDateOnly(w, value); break;
      case 'TimeOnly': writeTimeOnly(w, value); break;
      case 'DateTimeOffset': writeDateTimeOffset(w, value); break;
      case 'TimeSpan': w.writeInt64(BigInt(value || 0)); break;
      case 'Identifier': w.writeIdentifier(value || ''); break;
      case 'Enum': writeEnum(w, member, value); break;
      default: w.writeString(value != null ? String(value) : null); break;
    }
  }
  async function deserialize(buffer, schema) {
    const u8 = new Uint8Array(buffer);
    if (!await verifySignature(u8)) throw new Error('Signature mismatch');
    const reader = new SpanReader(u8);
    reader.skip(HDR_SIZE);
    if (reader.readByte() === 0) return null;
    const obj = {};
    for (const m of schema.members) obj[m.name] = readFieldValue(reader, m, 0);
    return obj;
  }
  async function deserializeList(buffer, schema) {
    const u8 = new Uint8Array(buffer);
    if (!await verifySignature(u8)) throw new Error('Signature mismatch');
    const reader = new SpanReader(u8);
    reader.skip(HDR_SIZE);
    const count = reader.readInt32(), items = [];
    for (let i = 0; i < count; i++) {
      const itemLen = reader.readInt32();
      if (reader.readByte() === 0) { items.push(null); continue; }
      const obj = {};
      for (const m of schema.members) obj[m.name] = readFieldValue(reader, m, 0);
      items.push(obj);
    }
    return items;
  }
  async function serialize(obj, schema) {
    const w = new SpanWriter(256);
    w.writeInt32(MAGIC); w.writeInt32(VERSION); w.writeInt32(schema.version || 1); w.writeByte(0);
    for (let i = 0; i < SIG_SIZE; i++) w.writeByte(0);
    w.writeByte(1);
    for (const m of schema.members) writeFieldValue(w, m, obj[m.name], 0);
    const payload = w.toUint8Array();
    await signPayload(payload);
    return payload.buffer.slice(0, payload.length);
  }
  const _layoutCache = {};
  async function fetchLayout(slug) {
    if (_layoutCache[slug]) return _layoutCache[slug];
    const resp = await fetch(`/api/_binary/${slug}/_layout`);
    if (!resp.ok) throw new Error(`Failed to fetch layout for ${slug}: ${resp.status}`);
    const layout = await resp.json();
    layout._byName = {};
    for (const f of layout.fields) layout._byName[f.name] = f;
    _layoutCache[slug] = layout;
    return layout;
  }
  function createTracker(entity, layout) {
    const orig = {}, changed = {};
    for (const f of layout.fields) orig[f.name] = entity[f.name];
    const proxy = new Proxy(entity, {
      set(target, prop, value) {
        target[prop] = value;
        if (prop in orig) { if (value !== orig[prop]) changed[prop] = true; else delete changed[prop]; }
        return true;
      }
    });
    return {
      entity: proxy, original: orig,
      changedFields() { return Object.keys(changed); },
      hasChanges() { return Object.keys(changed).length > 0; },
      reset() {
        for (const f of layout.fields) orig[f.name] = entity[f.name];
        for (const k of Object.keys(changed)) delete changed[k];
      }
    };
  }
  function encBuf(size, fn) { const b = new ArrayBuffer(size); fn(new DataView(b)); return b; }
  function encStr(value) {
    const enc = utf8.encode(String(value));
    const b = new ArrayBuffer(4 + enc.length);
    new DataView(b).setInt32(0, enc.length, true);
    new Uint8Array(b, 4).set(enc);
    return b;
  }
  function encodeFieldValue(field, value) {
    if (value === null || value === undefined) return new ArrayBuffer(0);
    switch (field.type) {
      case 'Bool': return encBuf(1, v => v.setUint8(0, value ? 1 : 0));
      case 'Byte': return encBuf(1, v => v.setUint8(0, value));
      case 'SByte': return encBuf(1, v => v.setInt8(0, value));
      case 'Int16': return encBuf(2, v => v.setInt16(0, value, true));
      case 'UInt16': return encBuf(2, v => v.setUint16(0, value, true));
      case 'Int32': case 'EnumInt32': return encBuf(4, v => v.setInt32(0, value, true));
      case 'UInt32': return encBuf(4, v => v.setUint32(0, value, true));
      case 'Int64': return encBuf(8, v => v.setBigInt64(0, BigInt(value), true));
      case 'UInt64': return encBuf(8, v => v.setBigUint64(0, BigInt(value), true));
      case 'Float32': return encBuf(4, v => v.setFloat32(0, value, true));
      case 'Float64': return encBuf(8, v => v.setFloat64(0, value, true));
      case 'Decimal': return encBuf(16, v => v.setFloat64(0, value, true));
      case 'DateTime': case 'DateTimeOffset':
        return encBuf(8, v => v.setBigInt64(0, BigInt(new Date(value).getTime()) * 10000n + EPOCH_TICKS, true));
      case 'DateOnly':
        return encBuf(4, v => v.setInt32(0, Math.floor(new Date(value).getTime() / 86400000) + 719162, true));
      case 'TimeOnly': case 'TimeSpan':
        return encBuf(8, v => v.setBigInt64(0, BigInt(value) * 10000n, true));
      case 'Guid': {
        const hex = String(value).replace(/-/g, ''), b = new ArrayBuffer(16), u = new Uint8Array(b);
        for (let i = 0; i < 16; i++) u[i] = parseInt(hex.substr(i * 2, 2), 16);
        return b;
      }
      case 'StringUtf8': return encStr(value);
      case 'Identifier': {
        const b = new ArrayBuffer(16);
        new Uint8Array(b).set(utf8.encode(String(value).substring(0, 16)));
        return b;
      }
      default: return encStr(value);
    }
  }
  function buildDelta(tracker, layout) {
    const entity = tracker.entity, fields = tracker.changedFields();
    if (fields.length === 0) return null;
    const hash = BigInt(layout.schemaHash), rowId = entity.Key || 0, ver = entity.Version || 0;
    const enc = [];
    for (const name of fields) {
      const f = layout._byName[name];
      if (!f || f.readOnly) continue;
      enc.push({ ordinal: f.ordinal, data: encodeFieldValue(f, entity[name]) });
    }
    let sz = 18;
    for (const c of enc) sz += 6 + c.data.byteLength;
    const buf = new ArrayBuffer(sz), dv = new DataView(buf);
    let off = 0;
    dv.setUint32(off, rowId, true); off += 4;
    dv.setUint32(off, ver, true); off += 4;
    dv.setUint32(off, Number(hash & 0xFFFFFFFFn), true); off += 4;
    dv.setUint32(off, Number((hash >> 32n) & 0xFFFFFFFFn), true); off += 4;
    dv.setUint16(off, enc.length, true); off += 2;
    for (const c of enc) {
      dv.setUint16(off, c.ordinal, true); off += 2;
      dv.setInt32(off, c.data.byteLength, true); off += 4;
      new Uint8Array(buf, off, c.data.byteLength).set(new Uint8Array(c.data));
      off += c.data.byteLength;
    }
    return buf;
  }
  async function applyDelta(slug, entityId, deltaBuffer, options = {}) {
    const resp = await fetch(`/api/_binary/${slug}/${entityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/octet-stream', 'Accept': 'application/json' },
      body: deltaBuffer,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ result: 'Error', message: resp.statusText }));
      throw new Error(`Delta failed (${resp.status}): ${err.result} - ${err.message}`);
    }
    return resp.json();
  }
  async function applyDeltaJson(slug, entityId, changes, expectedVersion = 0) {
    const resp = await fetch(`/api/_binary/${slug}/${entityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ expectedVersion, changes }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ result: 'Error', message: resp.statusText }));
      throw new Error(`Delta failed (${resp.status}): ${err.result} - ${err.message}`);
    }
    return resp.json();
  }
  return {
    setSigningKey, setSigningKeyBytes, fetchSchema, getCachedSchema,
    deserialize, deserializeList, serialize, verifySignature,
    fetchLayout, createTracker, buildDelta, applyDelta, applyDeltaJson,
    SpanReader, SpanWriter,
  };
})();
