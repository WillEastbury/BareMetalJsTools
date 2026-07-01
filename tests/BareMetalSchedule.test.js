/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

function loadSchedule() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Schedule.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
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

describe('BareMetal.Schedule additional coverage', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('retry, rateLimit, and parser errors cover control-flow branches', async () => {
    jest.useFakeTimers();
    const Schedule = loadSchedule();
    const worker = jest.fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockResolvedValue('ok');
    const retried = Schedule.retry(worker, {
      maxAttempts: 3,
      delay: 10,
      backoff: 'linear',
      retryOn: (_err, attempt) => attempt < 3
    });

    await Promise.resolve();
    expect(worker).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(10);
    await jest.advanceTimersByTimeAsync(20);
    await expect(retried).resolves.toBe('ok');

    const limited = Schedule.rateLimit((value) => value, { maxPerSecond: 1 });
    await expect(limited('a')).resolves.toBe('a');
    await expect(limited('b')).rejects.toThrow('Rate limit exceeded');

    const queuedFn = jest.fn((value) => value);
    const queued = Schedule.rateLimit(queuedFn, { maxPerSecond: 1, queue: true });
    const first = queued('x');
    const second = queued('y');
    await expect(first).resolves.toBe('x');
    await jest.advanceTimersByTimeAsync(1000);
    await expect(second).resolves.toBe('y');
    expect(queuedFn).toHaveBeenCalledTimes(2);

    expect(() => Schedule.parseDuration('bad-value')).toThrow(/Invalid duration/);
    expect(() => Schedule.parseCron('*/0 * * * *')).toThrow(/Invalid cron step/);
    expect(() => Schedule.nextCron('0 0 31 2 *', new Date(2024, 1, 1))).toThrow(/Unable to find next cron occurrence/);
  });

  test('interval, delay, at, and cron jobs support pause resume and immediate execution', async () => {
    jest.useFakeTimers();
    const Schedule = loadSchedule();
    const intervalSpy = jest.fn();
    const intervalJob = Schedule.interval(100, intervalSpy, { paused: true, startDate: new Date(Date.now() + 50), maxRuns: 1 });
    intervalJob.start();
    await jest.advanceTimersByTimeAsync(49);
    expect(intervalSpy).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(intervalSpy).toHaveBeenCalledTimes(1);

    const delaySpy = jest.fn();
    const delayJob = Schedule.delay(100, delaySpy, { paused: true });
    delayJob.start();
    await jest.advanceTimersByTimeAsync(40);
    delayJob.pause();
    await jest.advanceTimersByTimeAsync(100);
    expect(delaySpy).not.toHaveBeenCalled();
    delayJob.resume();
    await jest.advanceTimersByTimeAsync(60);
    expect(delaySpy).toHaveBeenCalledTimes(1);

    const when = new Date(Date.now() + 500);
    const atSpy = jest.fn();
    const atJob = Schedule.at(when, atSpy, { paused: true });
    expect(atJob.when.getTime()).toBe(when.getTime());
    atJob.start();
    atJob.stop();
    expect(atJob.isRunning()).toBe(false);

    const cronSpy = jest.fn();
    const cronJob = Schedule.cron('* * * * * *', cronSpy, { immediate: true, maxRuns: 2 });
    await jest.advanceTimersByTimeAsync(0);
    expect(cronSpy).toHaveBeenCalledTimes(1);
    cronJob.pause();
    cronJob.resume();
    await jest.advanceTimersByTimeAsync(1000);
    expect(cronSpy).toHaveBeenCalledTimes(2);
    expect(cronJob.isRunning()).toBe(false);
  });

  test('queue honors priority emits events and clears pending work', async () => {
    jest.useFakeTimers();
    const Schedule = loadSchedule();
    const drainSpy = jest.fn();
    const errorSpy = jest.fn();
    const queue = Schedule.queue({ concurrency: 1, onDrain: drainSpy, onError: errorSpy });
    const seen = [];
    queue.on('active', ({ id }) => seen.push('active:' + id));
    queue.on('complete', ({ id }) => seen.push('complete:' + id));
    queue.on('error', ({ id }) => seen.push('error:' + id));
    queue.pause();

    const low = queue.add(() => 'low', { priority: 'low' });
    const high = queue.add(() => 'high', { priority: 'high' });
    queue.resume();
    await expect(high.promise).resolves.toBe('high');
    await expect(low.promise).resolves.toBe('low');

    const invalid = queue.add(null);
    await expect(invalid.promise).rejects.toThrow('Queue job must be a function');

    queue.pause();
    const delayed = queue.add(() => 'later', { delay: '1s' });
    const delayedTwo = queue.add(() => 'later2', { delay: '1s' });
    queue.clear();
    await expect(delayed.promise).rejects.toThrow('Queue cleared');
    await expect(delayedTwo.promise).rejects.toThrow('Queue cleared');

    const boom = queue.add(() => Promise.reject(new Error('boom')), { priority: 'critical' });
    queue.resume();
    await expect(boom.promise).rejects.toThrow('boom');

    expect(seen[0]).toContain('active:job-2');
    expect(seen).toEqual(expect.arrayContaining([expect.stringContaining('complete:job-1'), expect.stringContaining('error:job-')]));
    expect(errorSpy).toHaveBeenCalled();
    expect(drainSpy).toHaveBeenCalled();
  });

  test('scheduler builds jobs from configs emits events and destroys managed jobs', async () => {
    jest.useFakeTimers();
    const Schedule = loadSchedule();
    const events = [];
    const scheduler = Schedule.scheduler();
    scheduler.on('add', ({ name }) => events.push('add:' + name));
    scheduler.on('remove', ({ name }) => events.push('remove:' + name));
    scheduler.on('start', ({ name }) => events.push('start:' + name));
    scheduler.on('pause', ({ name }) => events.push('pause:' + name));
    scheduler.on('resume', ({ name }) => events.push('resume:' + name));
    scheduler.on('stop', ({ name }) => events.push('stop:' + name));

    const pulseSpy = jest.fn();
    scheduler.add('pulse', { type: 'interval', ms: 50, fn: pulseSpy, paused: true });
    scheduler.add('once', { date: new Date(Date.now() + 10), fn: jest.fn(), paused: true });
    expect(() => scheduler.add('bad', { foo: 'bar', fn: jest.fn() })).toThrow(/Unknown scheduler job type/);

    scheduler.startAll();
    await jest.advanceTimersByTimeAsync(60);
    expect(pulseSpy).toHaveBeenCalled();
    scheduler.pauseAll();
    scheduler.resumeAll();
    scheduler.stopAll();

    expect(scheduler.list().map((entry) => entry.name).sort()).toEqual(['once', 'pulse']);
    scheduler.remove('once');
    scheduler.destroy();

    expect(events).toEqual(expect.arrayContaining([
      'add:pulse',
      'add:once',
      'start:pulse',
      'pause:pulse',
      'resume:pulse',
      'stop:pulse',
      'remove:once'
    ]));
  });
});

describe('branch coverage - Schedule', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('utility guards cover invalid inputs formatting and short-circuit retries', async () => {
    jest.useFakeTimers();
    const Schedule = loadSchedule();

    expect(() => Schedule.parseCron('')).toThrow(/Cron expression/);
    expect(() => Schedule.parseDuration('')).toThrow(/Invalid duration/);
    expect(Schedule.formatDuration(0)).toBe('0ms');
    expect(Schedule.formatDuration(-1500)).toBe('-1s 500ms');
    await expect(Schedule.deadline('ok', 0)).resolves.toBe('ok');
    await expect(Schedule.deadline(Promise.reject(new Error('boom')), 0)).rejects.toThrow('boom');

    const worker = jest.fn().mockRejectedValue(new Error('stop'));
    await expect(Schedule.retry(worker, { maxAttempts: 4, delay: 10, retryOn: () => false })).rejects.toThrow('stop');
    expect(worker).toHaveBeenCalledTimes(1);

    const scheduler = Schedule.scheduler();
    expect(() => scheduler.add()).toThrow('Scheduler job name required');
  });

  test('debounce throttle and rate limiting cover cancel flush leading and minute windows', async () => {
    jest.useFakeTimers();
    const Schedule = loadSchedule();
    const fn = jest.fn((value) => value);
    const debounced = Schedule.debounce(fn, 50, { leading: false, trailing: true, maxWait: 100 });

    debounced('a');
    debounced('b');
    expect(debounced.flush()).toBe('b');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('b');
    debounced('c');
    debounced.cancel();
    await jest.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(1);

    const throttledFn = jest.fn();
    const throttled = Schedule.throttle(throttledFn, 50, { leading: false, trailing: true });
    throttled('x');
    expect(throttledFn).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(50);
    expect(throttledFn).toHaveBeenCalledWith('x');

    const limited = Schedule.rateLimit((value) => value, { maxPerSecond: 1, maxPerMinute: 2, queue: true });
    const first = limited('a');
    const second = limited('b');
    const third = limited('c');
    await expect(first).resolves.toBe('a');
    await jest.advanceTimersByTimeAsync(1000);
    await expect(second).resolves.toBe('b');
    await jest.advanceTimersByTimeAsync(59000);
    await expect(third).resolves.toBe('c');
  });

  test('queue timeout scheduler replacement and timezone cron branches work', async () => {
    jest.useFakeTimers();
    const Schedule = loadSchedule();
    const errors = [];
    const queue = Schedule.queue({ concurrency: 1, retries: 1, retryDelay: 5, timeout: 10, onError: (err) => errors.push(err.message) });

    const stuck = queue.add(() => new Promise(() => {}));
    await jest.advanceTimersByTimeAsync(10);
    await jest.advanceTimersByTimeAsync(5);
    await jest.advanceTimersByTimeAsync(10);
    await expect(stuck.promise).rejects.toThrow('Deadline exceeded');
    expect(errors).toContain('Deadline exceeded');

    queue.pause();
    const pausedJob = queue.add(() => 'ok');
    queue.resume();
    await expect(pausedJob.promise).resolves.toBe('ok');

    const scheduler = Schedule.scheduler();
    const firstStop = jest.fn();
    scheduler.add('dup', { start: jest.fn(), stop: firstStop, __type: 'job', __status: 'running' });
    scheduler.add('dup', { start: jest.fn(), cancel: jest.fn(), __type: 'job', __status: 'stopped' });
    expect(firstStop).toHaveBeenCalled();
    expect(scheduler.remove('missing')).toBeNull();

    const cron = Schedule.cron('0 0 * * *', jest.fn(), { paused: true, timezone: 'Etc/UTC' });
    expect(cron.next()).toBeInstanceOf(Date);
    expect(Schedule.matchesCron('0 0 * * *', new Date('2024-01-01T00:00:00Z'), 'Etc/UTC')).toBe(true);

    const noFnJob = Schedule.interval(5, null, { maxRuns: 1 });
    await jest.advanceTimersByTimeAsync(5);
    expect(noFnJob.runCount).toBe(1);
  });
});
