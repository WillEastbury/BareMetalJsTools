/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadPipeline() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Pipeline.js'), 'utf8');
  const fn = new Function('BareMetal', 'module', code + '\nreturn BareMetal.Pipeline;');
  return fn({}, { exports: {} });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < (timeoutMs || 250)) {
    if (predicate()) return;
    await sleep(5);
  }
  throw new Error('Timed out waiting for condition');
}

describe('BareMetal.Pipeline', () => {
  let Pipeline;

  beforeEach(() => {
    Pipeline = loadPipeline();
  });

  test('executes sync and async stages in order', async () => {
    const stages = [];
    const pipeline = Pipeline.create(
      function addOne(value) { return value + 1; },
      async function double(value) { await sleep(5); return value * 2; }
    );

    const result = await pipeline.execute(2, {
      onStage(index, name, input, output) {
        stages.push([index, name, input, output]);
      }
    });

    expect(result).toBe(6);
    expect(stages).toEqual([
      [0, 'addOne', 2, 3],
      [1, 'double', 3, 6]
    ]);
  });

  test('pipe and prepend chain stages immutably', async () => {
    const base = Pipeline.create(function addTwo(value) { return value + 2; });
    const chained = base.pipe(function triple(value) { return value * 3; }).prepend(function minusOne(value) { return value - 1; });

    await expect(base.execute(4)).resolves.toBe(6);
    await expect(chained.execute(4)).resolves.toBe(15);
  });

  test('tap sees values without modifying them', async () => {
    const seen = [];
    const pipeline = Pipeline.create()
      .tap((value) => seen.push(value))
      .pipe((value) => value + 1);

    await expect(pipeline.execute(4)).resolves.toBe(5);
    expect(seen).toEqual([4]);
  });

  test('filter drops values and short-circuits later stages', async () => {
    const seen = jest.fn();
    const pipeline = Pipeline.create()
      .filter((value) => value > 2)
      .tap(seen)
      .pipe((value) => value * 2);

    await expect(pipeline.execute(1)).resolves.toBeUndefined();
    await expect(pipeline.execute(3)).resolves.toBe(6);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledWith(3);
  });

  test('branch routes to the correct branch', async () => {
    const pipeline = Pipeline.create().branch(
      (value) => value >= 0,
      (value) => 'pos:' + value,
      (value) => 'neg:' + value
    );

    await expect(pipeline.execute(3)).resolves.toBe('pos:3');
    await expect(pipeline.execute(-2)).resolves.toBe('neg:-2');
  });

  test('retry retries failing stages using the supplied policy', async () => {
    const stage = jest.fn(async (value) => {
      if (stage.mock.calls.length < 3) throw new Error('nope');
      return value * 2;
    });
    const pipeline = Pipeline.create().retry(stage, { maxAttempts: 3, delay: 1, backoff: 1 });

    await expect(pipeline.execute(5)).resolves.toBe(10);
    expect(stage).toHaveBeenCalledTimes(3);
  });

  test('timeout rejects long-running stages', async () => {
    const pipeline = Pipeline.create().timeout(async (value) => {
      await sleep(30);
      return value;
    }, 10);

    await expect(pipeline.execute('slow')).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  test('parallel stage runs all stages against the same input', async () => {
    const pipeline = Pipeline.create().parallel([
      (value) => value + 1,
      async (value) => { await sleep(5); return value * 2; }
    ]);

    await expect(pipeline.execute(3)).resolves.toEqual([4, 6]);
  });

  test('batch accumulates inputs and flushes them together', async () => {
    const flushed = [];
    const pipeline = Pipeline.create().batch(3, (values) => {
      flushed.push(values.slice());
      return values.reduce((sum, value) => sum + value, 0);
    });

    const first = pipeline.execute(1);
    const second = pipeline.execute(2);
    const third = pipeline.execute(3);

    await expect(Promise.all([first, second, third])).resolves.toEqual([6, 6, 6]);
    expect(flushed).toEqual([[1, 2, 3]]);
  });

  test('stream supports map, filter, reduce, take, chunk, and collect', async () => {
    const collected = await Pipeline.stream([1, 2, 3, 4, 5])
      .map((value) => value * 2)
      .filter((value) => value > 4)
      .take(2)
      .collect();
    const reduced = await Pipeline.stream([1, 2, 3, 4])
      .map((value) => value + 1)
      .reduce((acc, value) => acc + value, 0);
    const chunks = await Pipeline.stream([1, 2, 3, 4, 5]).chunk(2).collect();

    expect(collected).toEqual([6, 8]);
    expect(reduced).toBe(14);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('compose composes right to left', () => {
    const order = [];
    const fn = Pipeline.compose(
      (value) => { order.push('left'); return value + 1; },
      (value) => { order.push('middle'); return value * 2; },
      (value) => { order.push('right'); return value - 3; }
    );

    expect(fn(10)).toBe(15);
    expect(order).toEqual(['right', 'middle', 'left']);
  });

  test('series, parallel, and waterfall helpers compose functions', async () => {
    const waterfall = Pipeline.waterfall([
      (previous, original) => previous + original,
      (previous, original) => previous * original
    ]);

    await expect(Pipeline.series([(value) => value + 1, async (value) => value * 2], 3)).resolves.toBe(8);
    await expect(Pipeline.parallel([(value) => value + 1, async (value) => value * 2], 3)).resolves.toEqual([4, 6]);
    await expect(waterfall(2)).resolves.toBe(8);
  });

  test('execute honours AbortSignal cancellation', async () => {
    const controller = new AbortController();
    const pipeline = Pipeline.create(async (value) => {
      await sleep(40);
      return value + 1;
    });
    const promise = pipeline.execute(1, { signal: controller.signal });

    setTimeout(() => controller.abort(), 5);

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('backpressure supports pause and resume', async () => {
    const consumed = [];
    const events = [];
    let controller;

    controller = Pipeline.backpressure(async (push, state) => {
      let value = 1;
      while (value <= 5) {
        await state.wait();
        if (!push(value++)) await state.wait();
      }
    }, async (item) => {
      consumed.push(item);
      if (item === 1) {
        controller.pause();
        setTimeout(() => controller.resume(), 15);
      }
      await sleep(5);
    }, {
      highWaterMark: 2,
      lowWaterMark: 1,
      onPressure(size) { events.push('pressure:' + size); },
      onDrain(size) { events.push('drain:' + size); }
    });

    controller.start();
    await waitFor(() => consumed.length === 5, 250);
    controller.stop();

    expect(consumed).toEqual([1, 2, 3, 4, 5]);
    expect(events).toContain('pressure:2');
    expect(events.some((entry) => entry.indexOf('drain:') === 0)).toBe(true);
  });
});
