/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const { webcrypto } = require('crypto');
const SRC = path.resolve(__dirname, '../src/BareMetal.Binary.js');
const MAGIC = 0x314F5342;
const VERSION = 3;
const SIG_SIZE = 32;
const HDR_FIELDS = 13;
const HDR_SIZE = HDR_FIELDS + SIG_SIZE;

function loadBinary() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

async function signPayload(payload, keyBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const parts = new Uint8Array(payload.length - SIG_SIZE);
  parts.set(payload.subarray(0, HDR_FIELDS));
  parts.set(payload.subarray(HDR_SIZE), HDR_FIELDS);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, parts));
  payload.set(sig, HDR_FIELDS);
  return payload;
}

function writeMember(writer, member, value) {
  if (member.wireType === 'Int32') writer.writeInt32(value);
  else if (member.wireType === 'String') writer.writeString(value);
  else if (member.wireType === 'Bool') writer.writeBool(value);
  else if (member.wireType === 'Guid') writer.writeGuid(value);
  else if (member.wireType === 'Identifier') writer.writeIdentifier(value);
  else if (member.wireType === 'Float64') writer.writeFloat64(value);
  else if (member.wireType === 'DateOnly') writer.writeInt32(719162 + Math.floor(new Date(value).getTime() / 86400000));
  else throw new Error('Unsupported wire type in test helper: ' + member.wireType);
}

async function buildListBuffer(Binary, schema, items, keyBytes) {
  const entries = items.map((item) => {
    if (item == null) return { bytes: new Uint8Array(0), present: 0 };
    const w = new Binary.SpanWriter(64);
    schema.members.forEach((member) => writeMember(w, member, item[member.name]));
    return { bytes: w.toUint8Array(), present: 1 };
  });

  const total = HDR_SIZE + 4 + entries.reduce((sum, entry) => sum + 5 + entry.bytes.length, 0);
  const writer = new Binary.SpanWriter(total);
  writer.writeInt32(MAGIC);
  writer.writeInt32(VERSION);
  writer.writeInt32(schema.version || 1);
  writer.writeByte(0);
  for (let i = 0; i < SIG_SIZE; i++) writer.writeByte(0);
  writer.writeInt32(entries.length);
  entries.forEach((entry) => {
    writer.writeInt32(entry.bytes.length);
    writer.writeByte(entry.present);
    if (entry.present) writer.writeBytes(entry.bytes);
  });
  const payload = writer.toUint8Array();
  await signPayload(payload, keyBytes);
  return payload.buffer.slice(0, payload.length);
}

describe('BareMetal.Binary', () => {
  let Binary;
  let keyBytes;
  let originalFetch;

  beforeEach(async () => {
    if (!global.crypto || !global.crypto.subtle) {
      Object.defineProperty(global, 'crypto', {
        value: webcrypto,
        configurable: true,
        writable: true
      });
    }
    Binary = loadBinary();
    keyBytes = new Uint8Array(32).fill(7);
    originalFetch = global.fetch;
    await Binary.setSigningKeyBytes(keyBytes);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('exports the expected public API', () => {
    expect(Binary).toEqual(expect.objectContaining({
      setSigningKey: expect.any(Function),
      setSigningKeyBytes: expect.any(Function),
      fetchSchema: expect.any(Function),
      getCachedSchema: expect.any(Function),
      deserialize: expect.any(Function),
      deserializeList: expect.any(Function),
      serialize: expect.any(Function),
      verifySignature: expect.any(Function),
      fetchLayout: expect.any(Function),
      createTracker: expect.any(Function),
      buildDelta: expect.any(Function),
      applyDelta: expect.any(Function),
      applyDeltaJson: expect.any(Function),
      SpanReader: expect.any(Function),
      SpanWriter: expect.any(Function)
    }));
  });

  test('SpanWriter and SpanReader round-trip primitive values', () => {
    const writer = new Binary.SpanWriter(4);
    writer.writeBool(true);
    writer.writeInt32(-42);
    writer.writeFloat64(3.5);
    writer.writeString('hello');
    writer.writeString(null);
    const bytes = writer.toUint8Array();
    const reader = new Binary.SpanReader(bytes);

    expect(reader.readBool()).toBe(true);
    expect(reader.readInt32()).toBe(-42);
    expect(reader.readFloat64()).toBeCloseTo(3.5);
    expect(reader.readInt32()).toBe(5);
    expect(new TextDecoder().decode(reader.readBytes(5))).toBe('hello');
    expect(reader.readInt32()).toBe(-1);
  });

  test('SpanWriter expands capacity automatically', () => {
    const writer = new Binary.SpanWriter(1);
    for (let i = 0; i < 50; i++) writer.writeByte(i);

    expect(writer.toUint8Array()).toHaveLength(50);
  });

  test('SpanReader throws EOF when reading past the end', () => {
    const reader = new Binary.SpanReader(new Uint8Array([1]));
    reader.readByte();
    expect(() => reader.readByte()).toThrow('EOF');
  });

  test('serializes and deserializes a simple object', async () => {
    const schema = {
      version: 2,
      members: [
        { name: 'id', wireType: 'Int32' },
        { name: 'name', wireType: 'String' },
        { name: 'active', wireType: 'Bool' }
      ]
    };

    const buffer = await Binary.serialize({ id: 3, name: 'Ada', active: true }, schema);
    const result = await Binary.deserialize(buffer, schema);

    expect(result).toEqual({ id: 3, name: 'Ada', active: true });
  });

  test('round-trips nullable strings and floating point values', async () => {
    const schema = {
      version: 1,
      members: [
        { name: 'ratio', wireType: 'Float64' },
        { name: 'note', wireType: 'String', isNullable: true }
      ]
    };

    const buffer = await Binary.serialize({ ratio: 1.25, note: null }, schema);
    const result = await Binary.deserialize(buffer, schema);

    expect(result.ratio).toBeCloseTo(1.25);
    expect(result.note).toBeNull();
  });

  test('round-trips GUIDs and identifiers', async () => {
    const schema = {
      members: [
        { name: 'id', wireType: 'Guid' },
        { name: 'code', wireType: 'Identifier' }
      ]
    };

    const payload = {
      id: '12345678-1234-1234-1234-1234567890ab',
      code: 'ab-12'
    };
    const result = await Binary.deserialize(await Binary.serialize(payload, schema), schema);

    expect(result).toEqual({
      id: '12345678-1234-1234-1234-1234567890ab',
      code: 'AB-12'
    });
  });

  test('round-trips date values', async () => {
    const schema = {
      members: [
        { name: 'when', wireType: 'DateTime' },
        { name: 'day', wireType: 'DateOnly' },
        { name: 'time', wireType: 'TimeOnly' },
        { name: 'offset', wireType: 'DateTimeOffset' }
      ]
    };
    const source = {
      when: new Date('2026-06-01T12:30:00Z'),
      day: '2026-06-02',
      time: '05:06:07',
      offset: new Date('2026-06-03T09:10:00Z')
    };

    const result = await Binary.deserialize(await Binary.serialize(source, schema), schema);

    expect(result.when).toBeInstanceOf(Date);
    expect(result.when.toISOString()).toBe('2026-06-01T12:30:00.000Z');
    expect(result.day).toBe('2026-06-02');
    expect(result.time).toBe('05:06:07');
    expect(result.offset.toISOString()).toBe('2026-06-03T09:10:00.000Z');
  });

  test('verifySignature returns true for untouched payloads', async () => {
    const schema = { members: [{ name: 'id', wireType: 'Int32' }] };
    const buffer = await Binary.serialize({ id: 9 }, schema);

    await expect(Binary.verifySignature(new Uint8Array(buffer))).resolves.toBe(true);
  });

  test('deserialize rejects tampered payloads', async () => {
    const schema = { members: [{ name: 'id', wireType: 'Int32' }] };
    const payload = new Uint8Array(await Binary.serialize({ id: 9 }, schema));
    payload[payload.length - 1] ^= 0xff;

    await expect(Binary.deserialize(payload.buffer, schema)).rejects.toThrow('Signature mismatch');
  });

  test('setSigningKey accepts base64 keys', async () => {
    const base64 = Buffer.from(keyBytes).toString('base64');
    await expect(Binary.setSigningKey(base64)).resolves.toBeUndefined();
  });

  test('fetchSchema caches fetched schemas', async () => {
    const schema = { slug: 'tasks', members: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(schema)
    });

    const first = await Binary.fetchSchema('tasks', '/root/');
    const second = await Binary.fetchSchema('tasks', '/root/');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(first).toBe(schema);
    expect(second).toBe(schema);
    expect(Binary.getCachedSchema('tasks')).toBe(schema);
  });

  test('fetchSchema rejects failed responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(Binary.fetchSchema('broken', '/api/')).rejects.toThrow('Schema fetch failed: 500');
  });

  test('fetchLayout caches layouts and builds a name lookup', async () => {
    const layout = { fields: [{ name: 'Name', ordinal: 1 }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(layout)
    });

    const first = await Binary.fetchLayout('users');
    const second = await Binary.fetchLayout('users');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(first._byName.Name).toEqual({ name: 'Name', ordinal: 1 });
    expect(second).toBe(first);
  });

  test('createTracker detects changes and reset clears them', () => {
    const entity = { Name: 'Ada', Active: true };
    const layout = { fields: [{ name: 'Name' }, { name: 'Active' }] };
    const tracker = Binary.createTracker(entity, layout);

    tracker.entity.Name = 'Grace';
    tracker.entity.Active = true;
    expect(tracker.changedFields()).toEqual(['Name']);
    expect(tracker.hasChanges()).toBe(true);

    tracker.reset();
    expect(tracker.changedFields()).toEqual([]);
    expect(tracker.hasChanges()).toBe(false);
  });

  test('buildDelta returns null when there are no changes', () => {
    const entity = { Key: 1, Version: 2, Name: 'Ada' };
    const layout = { schemaHash: '1', fields: [{ name: 'Name', ordinal: 1, type: 'StringUtf8' }], _byName: { Name: { name: 'Name', ordinal: 1, type: 'StringUtf8' } } };
    const tracker = Binary.createTracker(entity, layout);

    expect(Binary.buildDelta(tracker, layout)).toBeNull();
  });

  test('buildDelta encodes changed writable fields', () => {
    const entity = { Key: 7, Version: 3, Name: 'Ada', Ignored: 10 };
    const layout = {
      schemaHash: '5',
      fields: [
        { name: 'Name', ordinal: 1, type: 'StringUtf8' },
        { name: 'Ignored', ordinal: 2, type: 'Int32', readOnly: true }
      ],
      _byName: {
        Name: { name: 'Name', ordinal: 1, type: 'StringUtf8' },
        Ignored: { name: 'Ignored', ordinal: 2, type: 'Int32', readOnly: true }
      }
    };
    const tracker = Binary.createTracker(entity, layout);
    tracker.entity.Name = 'Grace';
    tracker.entity.Ignored = 11;

    const delta = Binary.buildDelta(tracker, layout);
    const view = new DataView(delta);

    expect(view.getUint32(0, true)).toBe(7);
    expect(view.getUint16(16, true)).toBe(1);
  });

  test('applyDelta sends binary patches and returns JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true })
    });

    const response = await Binary.applyDelta('users', 5, new ArrayBuffer(2));

    expect(global.fetch).toHaveBeenCalledWith('/api/_binary/users/5', expect.objectContaining({
      method: 'PATCH',
      body: expect.any(ArrayBuffer)
    }));
    expect(response).toEqual({ ok: true });
  });

  test('applyDelta surfaces API failures', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: () => Promise.resolve({ result: 'Conflict', message: 'Version mismatch' })
    });

    await expect(Binary.applyDelta('users', 5, new ArrayBuffer(2))).rejects.toThrow(
      'Delta failed (409): Conflict - Version mismatch'
    );
  });

  test('applyDeltaJson sends JSON patches and returns JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, applied: 1 })
    });

    const response = await Binary.applyDeltaJson('users', 6, { Name: 'Ada' }, 3);

    expect(global.fetch).toHaveBeenCalledWith('/api/_binary/users/6', expect.objectContaining({
      method: 'PATCH',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expectedVersion: 3, changes: { Name: 'Ada' } })
    }));
    expect(response.applied).toBe(1);
  });

  test('deserializeList reads arrays of objects and nulls', async () => {
    const schema = {
      version: 1,
      members: [
        { name: 'id', wireType: 'Int32' },
        { name: 'name', wireType: 'String' },
        { name: 'active', wireType: 'Bool' }
      ]
    };

    const buffer = await buildListBuffer(Binary, schema, [
      { id: 1, name: 'Ada', active: true },
      null,
      { id: 2, name: 'Grace', active: false }
    ], keyBytes);

    const result = await Binary.deserializeList(buffer, schema);

    expect(result).toEqual([
      { id: 1, name: 'Ada', active: true },
      null,
      { id: 2, name: 'Grace', active: false }
    ]);
  });
});
