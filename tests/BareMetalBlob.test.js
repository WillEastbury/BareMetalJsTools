/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { webcrypto } = require('crypto');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.Blob.js');

function loadBlobModule() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const fn = new Function('BareMetal', 'module', code + '\nreturn BareMetal.Blob;');
  return fn({}, { exports: {} });
}

function mockResponse(headers) {
  const values = Object.assign({}, headers);
  return {
    ok: true,
    headers: {
      get(name) {
        return values[name] || values[String(name).toLowerCase()] || null;
      }
    },
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
  };
}

function readBlobText(blob) {
  if (blob && typeof blob.text === 'function') return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('BareMetal.Blob', () => {
  let BlobMod;
  let originalCrypto;
  let originalFetch;

  beforeEach(() => {
    originalCrypto = global.crypto;
    originalFetch = global.fetch;
    Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true, writable: true });
    BlobMod = loadBlobModule();
  });

  afterEach(() => {
    Object.defineProperty(global, 'crypto', { value: originalCrypto, configurable: true, writable: true });
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('create produces descriptor with correct size and type', () => {
    const descriptor = BlobMod.create('hello', { type: 'text/plain', metadata: { tag: 'greeting' }, chunkSize: 2 });
    expect(descriptor).toMatchObject({
      size: 5,
      type: 'text/plain',
      chunks: 3,
      metadata: { tag: 'greeting' },
      version: 1
    });
    expect(typeof descriptor.id).toBe('string');
    expect(typeof descriptor.created).toBe('string');
  });

  test('chunk splits blob correctly', async () => {
    const parts = await BlobMod.chunk(new Blob(['abcdef'], { type: 'text/plain' }), 2);
    expect(parts.map(part => part.size)).toEqual([2, 2, 2]);
    expect(parts.map(part => Buffer.from(part.data).toString())).toEqual(['ab', 'cd', 'ef']);
  });

  test('hash produces consistent output', async () => {
    const one = await BlobMod.hash('hash me', 'sha256');
    const two = await BlobMod.hash('hash me', 'sha256');
    expect(one).toBe(two);
    expect(one).toHaveLength(64);
  });

  test('store put/get/delete/list works in memory', async () => {
    const store = BlobMod.store({ backend: 'memory' });
    await store.put('alpha', new Blob(['first'], { type: 'text/plain' }), { role: 'primary' });

    expect(await store.exists('alpha')).toBe(true);
    expect(await store.metadata('alpha')).toEqual({ role: 'primary' });
    expect(await store.list()).toEqual([
      expect.objectContaining({ id: 'alpha', size: 5, type: 'text/plain', metadata: { role: 'primary' } })
    ]);

    const record = await store.get('alpha');
    expect(record.version).toBe(1);
    await expect(readBlobText(record.blob)).resolves.toBe('first');

    await store.delete('alpha');
    expect(await store.exists('alpha')).toBe(false);
    expect(await store.list()).toEqual([]);
  });

  test('versions tracking returns older blobs', async () => {
    const store = BlobMod.store({ backend: 'memory' });
    await store.put('doc', new Blob(['v1'], { type: 'text/plain' }), { rev: 1 });
    await store.put('doc', new Blob(['v2'], { type: 'text/plain' }), { rev: 2 });

    const latest = await store.get('doc');
    const versions = await store.versions('doc');
    const v1 = await store.getVersion('doc', 1);

    expect(latest.version).toBe(2);
    expect(versions).toEqual([
      expect.objectContaining({ version: 1, size: 2 }),
      expect.objectContaining({ version: 2, size: 2 })
    ]);
    await expect(readBlobText(v1)).resolves.toBe('v1');
  });

  test('lifecycle policy deletes old items', async () => {
    const store = BlobMod.store({ backend: 'memory' });
    const realNow = Date.now;
    let now = 1000;
    Date.now = jest.fn(() => now);

    await store.put('old', new Blob(['x'], { type: 'text/plain' }), { status: 'stale' });
    now += 10000;

    const manager = BlobMod.lifecycle(store, [{ match: { olderThan: 5000 }, action: 'delete' }]);
    await manager.run();

    expect(await store.exists('old')).toBe(false);
    Date.now = realNow;
  });

  test('toDataURL/fromDataURL round-trip', async () => {
    const original = new Blob(['hello data url'], { type: 'text/plain' });
    const url = await BlobMod.toDataURL(original);
    const restored = BlobMod.fromDataURL(url);
    await expect(readBlobText(restored)).resolves.toBe('hello data url');
    expect(restored.type).toBe('text/plain');
  });

  test('toBase64/fromBase64 round-trip', async () => {
    const original = new Blob(['hello base64'], { type: 'text/plain' });
    const encoded = await BlobMod.toBase64(original);
    const restored = BlobMod.fromBase64(encoded, 'text/plain');
    await expect(readBlobText(restored)).resolves.toBe('hello base64');
    expect(restored.type).toBe('text/plain');
  });

  test('slice and concat work together', async () => {
    const combined = BlobMod.concat([
      new Blob(['hello'], { type: 'text/plain' }),
      new Blob([' world'], { type: 'text/plain' })
    ], 'text/plain');
    const partial = BlobMod.slice(combined, 3, 8);
    await expect(readBlobText(combined)).resolves.toBe('hello world');
    await expect(readBlobText(partial)).resolves.toBe('lo wo');
  });

  test('diff finds differences', async () => {
    const result = await BlobMod.diff(new Blob(['abc']), new Blob(['abx']));
    expect(result).toEqual({ same: false, sizeA: 3, sizeB: 3, firstDiffOffset: 2 });
  });

  test('fingerprint is consistent', async () => {
    const one = await BlobMod.fingerprint('same');
    const two = await BlobMod.fingerprint('same');
    const three = await BlobMod.fingerprint('other');
    expect(one).toBe(two);
    expect(one).not.toBe(three);
    expect(one).toHaveLength(16);
  });

  test('upload progress callback fires', async () => {
    const progress = jest.fn();
    global.fetch = jest.fn(() => Promise.resolve(mockResponse({ etag: 'etag-1' })));

    const result = await BlobMod.upload(new Blob(['abcdef'], { type: 'text/plain' }), 'https://example.test/upload', {
      chunkSize: 2,
      parallel: 1,
      onProgress: progress
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(progress).toHaveBeenCalled();
    expect(progress.mock.calls[progress.mock.calls.length - 1][0]).toBe(100);
    expect(result.resumeToken.completed).toBe(true);
    expect(result.etag).toBe('etag-1');
  });

  test('resume token continues from last successful chunk', async () => {
    const calls = [];
    global.fetch = jest.fn((url, opts) => {
      calls.push(opts.headers['X-Chunk-Index']);
      if (calls.length === 2) return Promise.reject(new Error('interrupted'));
      return Promise.resolve(mockResponse({ etag: 'etag-2' }));
    });

    let resumeToken;
    try {
      await BlobMod.upload(new Blob(['abcd'], { type: 'text/plain' }), 'https://example.test/upload', {
        chunkSize: 2,
        parallel: 1
      });
    } catch (err) {
      expect(err.message).toBe('interrupted');
      resumeToken = err.resumeToken;
    }

    expect(resumeToken).toBeDefined();
    expect(resumeToken.uploaded).toEqual({ 0: 1 });

    calls.length = 0;
    global.fetch = jest.fn((url, opts) => {
      calls.push(opts.headers['X-Chunk-Index']);
      return Promise.resolve(mockResponse({ etag: 'etag-3' }));
    });

    const resumed = await BlobMod.resume('https://example.test/upload', resumeToken, new Blob(['abcd'], { type: 'text/plain' }), {
      chunkSize: 2,
      parallel: 1
    });

    expect(calls).toEqual(['1']);
    expect(resumed.resumeToken.completed).toBe(true);
    expect(resumed.etag).toBe('etag-3');
  });
});
