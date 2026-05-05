/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.Transport.js');

function loadTransport() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const moduleObj = { exports: {} };
  const previousBareMetal = global.BareMetal;
  try {
    const fn = new Function('BareMetal', 'module', code + '\nreturn BareMetal.Transport || module.exports;');
    return fn({}, moduleObj);
  } finally {
    if (typeof previousBareMetal === 'undefined') delete global.BareMetal;
    else global.BareMetal = previousBareMetal;
  }
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function flush() {
  return Promise.resolve().then(() => Promise.resolve());
}

describe('BareMetal.Transport', () => {
  let Transport;

  beforeAll(() => {
    Transport = loadTransport();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('retry retries failing work until it succeeds', async () => {
    jest.useFakeTimers();
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('nope-1'))
      .mockRejectedValueOnce(new Error('nope-2'))
      .mockResolvedValue('ok');

    const promise = Transport.retry(fn, {
      maxAttempts: 3,
      baseDelay: 100,
      backoff: 'linear'
    });

    await flush();
    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(200);
    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('backoff calculates fixed, linear and exponential delays', () => {
    expect(Transport.backoff(3, { baseDelay: 50, backoff: 'fixed' })).toBe(50);
    expect(Transport.backoff(3, { baseDelay: 50, backoff: 'linear' })).toBe(150);
    expect(Transport.backoff(3, { baseDelay: 50, backoff: 'exponential' })).toBe(200);
    expect(Transport.backoff(5, { baseDelay: 50, maxDelay: 300, backoff: 'exponential' })).toBe(300);
  });

  test('dedupe coalesces identical in-flight requests', async () => {
    const gate = deferred();
    const fn = jest.fn(() => gate.promise);
    const wrapped = Transport.dedupe(function(id) { return String(id); })(fn);

    const p1 = wrapped(7);
    const p2 = wrapped(7);
    const p3 = wrapped(8);

    expect(p1).toBe(p2);
    expect(p1).not.toBe(p3);
    expect(fn).toHaveBeenCalledTimes(2);

    gate.resolve('shared');
    await expect(p1).resolves.toBe('shared');
    await expect(p2).resolves.toBe('shared');
  });

  test('cancel propagates aborts to forked signals', () => {
    const parent = Transport.cancel();
    const child = parent.fork();
    const grandChild = Transport.cancel(child.signal);

    expect(parent.signal.aborted).toBe(false);
    expect(child.signal.aborted).toBe(false);
    expect(grandChild.signal.aborted).toBe(false);

    parent.abort(new Error('stop'));

    expect(parent.signal.aborted).toBe(true);
    expect(child.signal.aborted).toBe(true);
    expect(grandChild.signal.aborted).toBe(true);
  });

  test('cache honours ttl and stale-while-revalidate', async () => {
    jest.useFakeTimers();
    const fn = jest.fn()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');
    const cached = Transport.cache(fn, {
      ttl: 100,
      swr: 200,
      key(args) { return args[0]; }
    });

    await expect(cached('user:1')).resolves.toBe('v1');
    await expect(cached('user:1')).resolves.toBe('v1');
    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(150);
    await expect(cached('user:1')).resolves.toBe('v1');
    expect(fn).toHaveBeenCalledTimes(2);

    await flush();
    await expect(cached('user:1')).resolves.toBe('v2');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('circuit transitions through closed, open and half-open states', async () => {
    jest.useFakeTimers();
    const onOpen = jest.fn();
    const onHalfOpen = jest.fn();
    const onClose = jest.fn();
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('ok');
    const guarded = Transport.circuit(fn, {
      threshold: 2,
      resetTimeout: 1000,
      halfOpenMax: 1,
      onOpen,
      onHalfOpen,
      onClose
    });

    await expect(guarded()).rejects.toThrow('fail-1');
    expect(guarded.state()).toBe('closed');

    await expect(guarded()).rejects.toThrow('fail-2');
    expect(guarded.state()).toBe('open');
    expect(onOpen).toHaveBeenCalledTimes(1);

    await expect(guarded()).rejects.toMatchObject({ name: 'CircuitOpenError' });
    expect(fn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1000);
    await expect(guarded()).resolves.toBe('ok');
    expect(onHalfOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(guarded.state()).toBe('closed');
  });

  test('queue enforces concurrency and drains queued work', async () => {
    const q = Transport.queue({ concurrency: 2 });
    const gates = [deferred(), deferred(), deferred()];
    let running = 0;
    let maxRunning = 0;

    const tasks = gates.map((gate, index) => q.add(() => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      return gate.promise.then(() => {
        running--;
        return index;
      });
    }));

    await flush();
    expect(q.pending()).toBe(2);
    expect(q.size()).toBe(1);

    gates[0].resolve();
    await flush();
    expect(maxRunning).toBe(2);
    expect(q.pending()).toBe(2);
    expect(q.size()).toBe(0);

    gates[1].resolve();
    gates[2].resolve();
    await expect(Promise.all(tasks)).resolves.toEqual([0, 1, 2]);
    expect(q.pending()).toBe(0);
    expect(q.size()).toBe(0);
  });

  test('rateLimit queues excess work until capacity is available', async () => {
    jest.useFakeTimers();
    const fn = jest.fn((value) => Promise.resolve(value));
    const limited = Transport.rateLimit(fn, {
      maxPerSecond: 2,
      queue: true
    });

    const p1 = limited('a');
    const p2 = limited('b');
    const p3 = limited('c');

    await flush();
    await expect(Promise.all([p1, p2])).resolves.toEqual(['a', 'b']);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(limited.pending()).toBe(1);

    await jest.advanceTimersByTimeAsync(999);
    expect(fn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1);
    await expect(p3).resolves.toBe('c');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(limited.pending()).toBe(0);
  });
});
