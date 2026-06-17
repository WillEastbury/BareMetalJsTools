/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const fs = require('fs');
const path = require('path');

function loadSchedule() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Schedule.js'), 'utf8');
  const fn = new Function('BareMetal', 'module', code + '\nreturn BareMetal.Schedule;');
  return fn({}, { exports: {} });
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

describe('BareMetal.Schedule', () => {
  let Schedule;

  beforeEach(() => {
    Schedule = loadSchedule();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('parseCron supports ranges, lists, steps, names and seconds', () => {
    const parsed = Schedule.parseCron('10 */15 9-17 * jan,mar mon-fri');
    expect(parsed.seconds).toEqual([10]);
    expect(parsed.minutes).toEqual([0, 15, 30, 45]);
    expect(parsed.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(parsed.months).toEqual([1, 3]);
    expect(parsed.weekdays).toEqual([1, 2, 3, 4, 5]);
  });

  test('parseCron expands special aliases', () => {
    const parsed = Schedule.parseCron('@daily');
    expect(parsed.minutes).toEqual([0]);
    expect(parsed.hours).toEqual([0]);
    expect(parsed.days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  test('nextCron calculates the next minute and second occurrence', () => {
    const nextMinute = Schedule.nextCron('*/15 * * * *', new Date(2024, 0, 1, 10, 7, 30));
    const nextSecond = Schedule.nextCron('10 * * * * *', new Date(2024, 0, 1, 10, 7, 9));

    expect(nextMinute.getTime()).toBe(new Date(2024, 0, 1, 10, 15, 0, 0).getTime());
    expect(nextSecond.getTime()).toBe(new Date(2024, 0, 1, 10, 7, 10, 0).getTime());
  });

  test('matchesCron matches named weekdays and second precision', () => {
    expect(Schedule.matchesCron('0 9 * * mon-fri', new Date(2024, 0, 1, 9, 0, 45))).toBe(true);
    expect(Schedule.matchesCron('0 9 * * mon-fri', new Date(2024, 0, 7, 9, 0, 0))).toBe(false);
    expect(Schedule.matchesCron('10 * * * * *', new Date(2024, 0, 1, 12, 0, 10))).toBe(true);
    expect(Schedule.matchesCron('10 * * * * *', new Date(2024, 0, 1, 12, 0, 11))).toBe(false);
  });

  test('interval fires the expected number of times', async () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const job = Schedule.interval(100, fn, { immediate: true, maxRuns: 3 });

    await jest.advanceTimersByTimeAsync(250);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(job.runCount).toBe(3);
    expect(job.isRunning()).toBe(false);
  });

  test('delay can be cancelled and rescheduled', async () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const job = Schedule.delay(100, fn, { name: 'later' });

    job.cancel();
    await jest.advanceTimersByTimeAsync(150);
    expect(fn).not.toHaveBeenCalled();

    job.reschedule(50);
    await jest.advanceTimersByTimeAsync(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(job.name).toBe('later');
  });

  test('every uses human-readable durations', async () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const job = Schedule.every('5s', fn, { maxRuns: 2 });

    await jest.advanceTimersByTimeAsync(10000);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(job.runCount).toBe(2);
  });

  test('queue enforces concurrency', async () => {
    const q = Schedule.queue({ concurrency: 2 });
    const gates = [deferred(), deferred(), deferred()];
    let running = 0;
    let maxRunning = 0;

    const items = gates.map((gate, index) => q.add(() => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      return gate.promise.then(() => {
        running -= 1;
        return index;
      });
    }));

    await flush();
    expect(q.active()).toBe(2);
    expect(q.pending()).toBe(1);

    gates[0].resolve();
    await items[0].promise;
    await flush();

    gates[1].resolve();
    gates[2].resolve();
    await Promise.all(items.map(item => item.promise));

    expect(maxRunning).toBe(2);
    expect(q.active()).toBe(0);
    expect(q.pending()).toBe(0);
  });

  test('queue retries failed jobs', async () => {
    jest.useFakeTimers();
    const worker = jest.fn()
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValue('ok');
    const q = Schedule.queue({ retries: 1, retryDelay: 100 });
    const item = q.add(worker);

    await flush();
    expect(worker).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(100);
    await expect(item.promise).resolves.toBe('ok');
    expect(worker).toHaveBeenCalledTimes(2);
  });

  test('scheduler add, get, list and remove manage jobs', async () => {
    jest.useFakeTimers();
    const scheduler = Schedule.scheduler();
    const fn = jest.fn();
    const job = Schedule.interval(1000, fn, { paused: true });

    scheduler.add('heartbeat', job);
    expect(scheduler.get('heartbeat')).toBe(job);
    expect(scheduler.list()).toEqual([
      expect.objectContaining({ name: 'heartbeat', type: 'interval', status: 'paused', runCount: 0 })
    ]);

    scheduler.startAll();
    await jest.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(1);

    const removed = scheduler.remove('heartbeat');
    expect(removed).toBe(job);
    expect(scheduler.get('heartbeat')).toBeNull();
    expect(scheduler.list()).toEqual([]);
  });

  test('parseDuration and formatDuration convert durations', () => {
    expect(Schedule.parseDuration('5m30s')).toBe(330000);
    expect(Schedule.parseDuration('1d12h')).toBe(129600000);
    expect(Schedule.formatDuration(93784005)).toBe('1d 2h 3m 4s 5ms');
  });

  test('debounce and throttle coalesce calls correctly', async () => {
    jest.useFakeTimers();
    const debouncedFn = jest.fn();
    const throttledFn = jest.fn();
    const debounced = Schedule.debounce(debouncedFn, 100, { trailing: true });
    const throttled = Schedule.throttle(throttledFn, 100, { leading: true, trailing: true });

    debounced('a');
    debounced('b');
    await jest.advanceTimersByTimeAsync(99);
    expect(debouncedFn).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(debouncedFn).toHaveBeenCalledTimes(1);
    expect(debouncedFn).toHaveBeenLastCalledWith('b');

    throttled('first');
    throttled('second');
    expect(throttledFn).toHaveBeenCalledTimes(1);
    expect(throttledFn).toHaveBeenLastCalledWith('first');
    await jest.advanceTimersByTimeAsync(100);
    expect(throttledFn).toHaveBeenCalledTimes(2);
    expect(throttledFn).toHaveBeenLastCalledWith('second');
  });

  test('deadline rejects on timeout', async () => {
    jest.useFakeTimers();
    const promise = Schedule.deadline(() => new Promise(() => {}), 50);
    const assertion = expect(promise).rejects.toThrow('Deadline exceeded');

    await jest.advanceTimersByTimeAsync(50);
    await assertion;
  });
});
