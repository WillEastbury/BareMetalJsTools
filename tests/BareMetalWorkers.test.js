/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.Workers.js');

function loadWorkers() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const fn = new Function('BareMetal', code + '\nreturn BareMetal.Workers;');
  return fn({});
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

describe('BareMetal.Workers', () => {
  let Workers;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let originalWorker;
  let originalRequestIdleCallback;
  let originalCancelIdleCallback;
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeAll(() => {
    Workers = loadWorkers();
  });

  beforeEach(() => {
    originalWorker = global.Worker;
    originalRequestIdleCallback = global.requestIdleCallback;
    originalCancelIdleCallback = global.cancelIdleCallback;
    originalRequestAnimationFrame = global.requestAnimationFrame;
    originalCancelAnimationFrame = global.cancelAnimationFrame;
    originalCreateObjectURL = global.URL.createObjectURL;
    originalRevokeObjectURL = global.URL.revokeObjectURL;
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    Workers.cleanup();
    global.Worker = originalWorker;
    global.requestIdleCallback = originalRequestIdleCallback;
    global.cancelIdleCallback = originalCancelIdleCallback;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('debounce / throttle', () => {
    test('debounce delays, flushes and cancels trailing work', async () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = Workers.debounce(fn, 300, { trailing: true });

      debounced('a');
      debounced('b');
      await jest.advanceTimersByTimeAsync(299);
      expect(fn).not.toHaveBeenCalled();

      debounced.flush();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith('b');

      debounced('c');
      debounced.cancel();
      await jest.runOnlyPendingTimersAsync();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('throttle honours leading/trailing and cancel', async () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const throttled = Workers.throttle(fn, 100, { leading: true, trailing: true });

      throttled('first');
      throttled('second');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith('first');

      await jest.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('second');

      throttled('third');
      throttled.cancel();
      await jest.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('RAF batching', () => {
    test('read callbacks flush before writes in one frame', async () => {
      jest.useFakeTimers();
      global.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 16);
      global.cancelAnimationFrame = id => clearTimeout(id);
      const order = [];

      Workers.read(() => order.push('read-1'));
      Workers.write(() => order.push('write-1'));
      Workers.read(() => order.push('read-2'));

      await jest.advanceTimersByTimeAsync(16);
      expect(order).toEqual(['read-1', 'read-2', 'write-1']);
    });
  });

  describe('taskQueue', () => {
    test('runs higher priority work before lower priority queued work', async () => {
      const queue = Workers.taskQueue({ concurrency: 1, priorities: ['high', 'normal', 'low'] });
      const first = deferred();
      const order = [];

      const p1 = queue.add(() => {
        order.push('low-1');
        return first.promise;
      }, { priority: 'low' });
      const p2 = queue.add(() => {
        order.push('low-2');
        return 'low-2';
      }, { priority: 'low' });
      const p3 = queue.add(() => {
        order.push('high');
        return 'high';
      }, { priority: 'high' });

      expect(queue.stats()).toEqual({ running: 1, queued: 2, completed: 0 });

      first.resolve('done');
      await p1;
      await flush();
      await p3;
      await p2;
      await flush();

      expect(order).toEqual(['low-1', 'high', 'low-2']);
      expect(queue.stats()).toEqual({ running: 0, queued: 0, completed: 3 });
    });

    test('enforces concurrency limit', async () => {
      const queue = Workers.taskQueue({ concurrency: 2 });
      const gates = [deferred(), deferred(), deferred()];
      let running = 0;
      let maxRunning = 0;

      const tasks = gates.map((gate, index) => queue.add(() => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        return gate.promise.then(() => {
          running--;
          return index;
        });
      }));

      await flush();
      expect(queue.stats()).toEqual({ running: 2, queued: 1, completed: 0 });

      gates[0].resolve();
      await flush();
      expect(maxRunning).toBe(2);
      expect(queue.stats()).toEqual({ running: 2, queued: 0, completed: 1 });

      gates[1].resolve();
      gates[2].resolve();
      await Promise.all(tasks);
      await flush();
      expect(maxRunning).toBe(2);
      expect(queue.stats()).toEqual({ running: 0, queued: 0, completed: 3 });
    });
  });

  describe('timing helpers', () => {
    test('delay resolves after the requested time', async () => {
      jest.useFakeTimers();
      let done = false;
      const promise = Workers.delay(50).then(() => { done = true; });

      await jest.advanceTimersByTimeAsync(49);
      expect(done).toBe(false);
      await jest.advanceTimersByTimeAsync(1);
      await promise;
      expect(done).toBe(true);
    });

    test('timeout rejects slow promises', async () => {
      jest.useFakeTimers();
      const promise = Workers.timeout(new Promise(() => {}), 100);
      const assertion = expect(promise).rejects.toThrow('Operation timed out');
      await jest.advanceTimersByTimeAsync(100);
      await assertion;
    });

    test('retry retries with backoff before succeeding', async () => {
      jest.useFakeTimers();
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('first'))
        .mockRejectedValueOnce(new Error('second'))
        .mockResolvedValue('ok');

      const promise = Workers.retry(fn, { attempts: 3, delay: 100, backoff: 2 });
      await Promise.resolve();
      expect(fn).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(200);
      await expect(promise).resolves.toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('worker create / pool', () => {
    class MockWorker {
      constructor(url) {
        this.url = url;
        this.listeners = {};
        this.terminated = false;
        this.messages = [];
      }
      addEventListener(type, handler) {
        this.listeners[type] = handler;
      }
      postMessage(message, transfer) {
        this.messages.push({ message, transfer });
        const payload = message.payload;
        const result = Array.isArray(payload) ? payload.map(x => x * 2) : payload * 2;
        setTimeout(() => {
          if (this.terminated) return;
          const handler = this.listeners.message || this.onmessage;
          if (handler) handler({ data: { __bm_id: message.__bm_id, result } });
        }, 5);
      }
      terminate() {
        this.terminated = true;
      }
    }

    test('create runs work and passes transferables', async () => {
      jest.useFakeTimers();
      global.Worker = MockWorker;
      const worker = Workers.create(function(data) { return data.map(function(x) { return x * 2; }); });
      const buffer = new ArrayBuffer(8);
      const promise = worker.run([1, 2, 3], [buffer]);

      await jest.advanceTimersByTimeAsync(5);
      await expect(promise).resolves.toEqual([2, 4, 6]);
      expect(worker.worker.messages[0].transfer).toEqual([buffer]);
      worker.terminate();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    test('pool tracks active, queued and completed tasks', async () => {
      jest.useFakeTimers();
      global.Worker = MockWorker;
      const pool = Workers.pool(function(data) { return data * 2; }, { size: 2, timeout: 1000 });

      const p1 = pool.run(1);
      const p2 = pool.run(2);
      const p3 = pool.run(3);

      expect(pool.stats()).toEqual({ active: 2, idle: 0, queued: 1, completed: 0, errors: 0 });

      await jest.advanceTimersByTimeAsync(5);
      await Promise.all([p1, p2]);
      expect(pool.stats()).toEqual({ active: 1, idle: 1, queued: 0, completed: 2, errors: 0 });

      await jest.advanceTimersByTimeAsync(5);
      await expect(Promise.all([p1, p2, p3])).resolves.toEqual([2, 4, 6]);
      expect(pool.stats()).toEqual({ active: 0, idle: 2, queued: 0, completed: 3, errors: 0 });
      pool.terminate();
    });
  });

  describe('idle polyfill', () => {
    test('falls back to setTimeout when requestIdleCallback is unavailable', async () => {
      jest.useFakeTimers();
      global.requestIdleCallback = undefined;
      global.cancelIdleCallback = undefined;
      const fn = jest.fn();

      const id = Workers.idle(fn, { timeout: 5000 });
      expect(id).toBeDefined();
      await jest.advanceTimersByTimeAsync(1);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn.mock.calls[0][0].timeRemaining()).toBe(0);
    });
  });
});
