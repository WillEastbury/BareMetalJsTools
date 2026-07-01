/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Diagnostics.js');

function loadDiagnostics() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

describe('BareMetal.Diagnostics', () => {
  let Diagnostics;

  beforeEach(() => {
    jest.useFakeTimers();
    Diagnostics = loadDiagnostics();
    Diagnostics.enable();
    Diagnostics.timeline().clear();
    Diagnostics.perf.clear();
  });

  afterEach(() => {
    Diagnostics.disable();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('trace wraps functions and records duration in the timeline', () => {
    const wrapped = Diagnostics.trace('math.sum', (a, b) => a + b);
    const value = wrapped(2, 3);
    const events = Diagnostics.timeline().getEvents();
    const endEvent = events.find((entry) => entry.name === 'trace.end');

    expect(value).toBe(5);
    expect(events.map((entry) => entry.name)).toEqual(
      expect.arrayContaining(['span.start', 'trace.start', 'span.end', 'trace.end'])
    );
    expect(endEvent.data).toEqual(expect.objectContaining({ name: 'math.sum', duration: expect.any(Number) }));
  });

  test('span records attributes, parentage, and events', () => {
    const parent = Diagnostics.span('request');
    const span = Diagnostics.span('db.query', { parent, attributes: { kind: 'sql' } });

    span.addEvent('prepared', { id: 7 }).setAttribute('rows', 3);
    const context = span.end({ ok: true });
    parent.end();

    expect(context).toEqual(expect.objectContaining({
      name: 'db.query',
      parentId: parent.context.id,
      duration: expect.any(Number),
      attributes: expect.objectContaining({ kind: 'sql', rows: 3 }),
      events: [expect.objectContaining({ name: 'prepared', data: { id: 7 } })]
    }));
  });

  test('timeline records events, marks, measures, and export data', () => {
    const timeline = Diagnostics.timeline();

    timeline.record('boot', { ready: false });
    timeline.mark('start');
    timeline.mark('end');
    const measure = timeline.measure('boot.total', 'start', 'end');
    const exported = timeline.export();

    expect(timeline.getEvents('boot')).toEqual([
      expect.objectContaining({ type: 'event', name: 'boot', data: { ready: false } })
    ]);
    expect(measure.duration).toBe(timeline.getDuration('start', 'end'));
    expect(exported).toEqual(expect.objectContaining({
      marks: expect.objectContaining({ start: expect.any(Number), end: expect.any(Number) }),
      measures: [expect.objectContaining({ name: 'boot.total', duration: expect.any(Number) })]
    }));

    timeline.clear();
    expect(timeline.getEvents()).toEqual([]);
  });

  test('inspect reports type information for objects, arrays, circular values, and frozen objects', () => {
    const frozen = Object.freeze({ ok: true });
    const circular = { name: 'loop' };
    circular.self = circular;

    expect(Diagnostics.inspect({ nested: { value: 1 } })).toEqual(expect.objectContaining({
      type: 'object',
      keys: ['nested'],
      size: 1,
      circular: false,
      depth: 2,
      frozen: false,
      sealed: false
    }));
    expect(Diagnostics.inspect([1, 2, 3])).toEqual(expect.objectContaining({ type: 'array', size: 3 }));
    expect(Diagnostics.inspect(circular)).toEqual(expect.objectContaining({ circular: true }));
    expect(Diagnostics.inspect(frozen)).toEqual(expect.objectContaining({ frozen: true, sealed: true }));
  });

  test('watch fires on deep changes and why returns mutation history', () => {
    const model = { user: { name: 'Alice' } };
    const spy = jest.fn();
    const unwatch = Diagnostics.watch(model, 'user.name', spy);

    model.user.name = 'Bob';
    model.user = { name: 'Cara' };
    unwatch();
    model.user.name = 'Drew';

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, expect.objectContaining({
      old: 'Alice',
      new: 'Bob',
      path: 'user.name',
      timestamp: expect.any(Number)
    }));
    expect(spy).toHaveBeenNthCalledWith(2, expect.objectContaining({ old: 'Bob', new: 'Cara' }));
    expect(Diagnostics.why('user.name')).toHaveLength(2);
  });

  test('perf captures marks, measures, and aggregates', () => {
    Diagnostics.perf.mark('render:start');
    Diagnostics.perf.mark('render:end');
    Diagnostics.perf.measure('render', 0, 10);
    Diagnostics.perf.measure('render', 0, 20);
    Diagnostics.perf.measure('render', 0, 30);

    expect(Diagnostics.perf.getMarks()).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'render:start' }),
      expect.objectContaining({ name: 'render:end' })
    ]));
    expect(Diagnostics.perf.getMeasures()).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'render', duration: 10 }),
      expect.objectContaining({ name: 'render', duration: 20 }),
      expect.objectContaining({ name: 'render', duration: 30 })
    ]));
    expect(Diagnostics.perf.aggregate('render')).toEqual({
      count: 3,
      avg: 20,
      min: 10,
      max: 30,
      p50: 20,
      p95: 30,
      p99: 30
    });

    Diagnostics.perf.clear();
    expect(Diagnostics.perf.getMarks()).toEqual([]);
    expect(Diagnostics.perf.getMeasures()).toEqual([]);
  });

  test('counter increments, decrements, and resets', () => {
    const counter = Diagnostics.counter('jobs');

    expect(counter.increment()).toBe(1);
    expect(counter.increment(4)).toBe(5);
    expect(counter.decrement(2)).toBe(3);
    expect(counter.value()).toBe(3);
    expect(counter.reset()).toBe(0);
  });

  test('enable and disable toggle diagnostics operations to no-op mode', () => {
    const timeline = Diagnostics.timeline();
    const counter = Diagnostics.counter('disabled');
    const wrapped = Diagnostics.trace('noop.trace', (value) => value * 2);

    Diagnostics.disable();

    expect(wrapped(4)).toBe(8);
    timeline.record('disabled.event');
    timeline.mark('disabled.mark');
    Diagnostics.perf.mark('disabled.perf');
    counter.increment();

    expect(timeline.getEvents()).toEqual([]);
    expect(Diagnostics.perf.getMarks()).toEqual([]);
    expect(counter.value()).toBe(0);

    Diagnostics.enable();
    counter.increment();
    expect(counter.value()).toBe(1);
  });

  test('report includes timeline, counters, gauges, spans, and measures', () => {
    let gaugeValue = 0;
    const counter = Diagnostics.counter('requests');
    const gauge = Diagnostics.gauge('queue', () => ++gaugeValue);
    const span = Diagnostics.span('render', { attributes: { component: 'card' } });

    Diagnostics.timeline().record('custom.event', { ok: true });
    Diagnostics.perf.measure('paint', 10, 25);
    counter.increment(2);
    gauge.sample();
    span.end();

    const report = Diagnostics.report();

    expect(report.timeline.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'custom.event' })
    ]));
    expect(report.counters).toEqual(expect.objectContaining({ requests: 2 }));
    expect(report.gauges.queue).toEqual(expect.objectContaining({
      current: 2,
      samples: expect.any(Array)
    }));
    expect(report.spans).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'render', attributes: expect.objectContaining({ component: 'card' }) })
    ]));
    expect(report.measures).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'paint', duration: 15 })
    ]));
  });

  test('hook auto-instruments module methods with trace', () => {
    const math = {
      add(a, b) {
        return a + b;
      },
      label: 'math'
    };

    Diagnostics.hook('Math', math);

    expect(math.add(5, 7)).toBe(12);
    expect(Diagnostics.timeline().getEvents('trace.end')).toEqual(expect.arrayContaining([
      expect.objectContaining({ data: expect.objectContaining({ name: 'Math.add' }) })
    ]));
  });
});

describe('branch coverage - Diagnostics', () => {
  test('spans, traces, and perf helpers cover unnamed, disabled, async, and mocked performance paths', async () => {
    jest.useFakeTimers();
    const originalPerformance = global.performance;
    const mockPerformance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn()
    };

    Object.defineProperty(global, 'performance', { configurable: true, writable: true, value: mockPerformance });

    let Diagnostics;
    try {
      Diagnostics = loadDiagnostics();
      Diagnostics.enable();

      const unnamed = Diagnostics.span();
      const firstEnd = unnamed.end({ ok: true });
      expect(firstEnd.name).toBe('');
      expect(unnamed.end({ ignored: true })).toBe(firstEnd);

      const rejected = Diagnostics.trace('trace.reject', () => Promise.reject(new Error('nope')));
      await expect(rejected()).rejects.toThrow('nope');
      expect(Diagnostics.timeline().getEvents('trace.end')).toEqual(expect.arrayContaining([
        expect.objectContaining({ data: expect.objectContaining({ name: 'trace.reject', error: true }) })
      ]));

      Diagnostics.perf.mark();
      Diagnostics.perf.measure('missing-marks', 'start', 'end');
      Diagnostics.perf.clear();

      expect(mockPerformance.mark).toHaveBeenCalledWith('');
      expect(mockPerformance.measure).toHaveBeenCalledWith('missing-marks', 'start', 'end');
      expect(mockPerformance.clearMarks).toHaveBeenCalled();
      expect(mockPerformance.clearMeasures).toHaveBeenCalled();

      Diagnostics.disable();
      const noopSpan = Diagnostics.span('noop');
      expect(noopSpan.addEvent('ignored').setAttribute('a', 1).end()).toEqual({});
      expect(Diagnostics.trace('noop-trace')()).toBeUndefined();
    } finally {
      Object.defineProperty(global, 'performance', { configurable: true, writable: true, value: originalPerformance });
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  test('inspect, why, watch, and gauges cover maps, sets, typed arrays, chains, and failures', () => {
    const Diagnostics = loadDiagnostics();
    Diagnostics.enable();

    expect(Diagnostics.inspect(new Map([[1, 'a']]))).toEqual(expect.objectContaining({ type: 'map', size: 1 }));
    expect(Diagnostics.inspect(new Set(['x', 'y']))).toEqual(expect.objectContaining({ type: 'set', size: 2 }));
    expect(Diagnostics.inspect(new Uint8Array([1, 2, 3]))).toEqual(expect.objectContaining({ type: 'typed-array', size: 3 }));
    expect(Diagnostics.inspect({ deep: { child: { leaf: true } } }, { maxDepth: 1 }).depth).toBe(1);

    const observed = { count: 0 };
    const changes = [];
    const off = Diagnostics.watch(observed, 'count', (change) => changes.push(change));
    observed.count = 1;
    observed.count = 2;
    off();
    observed.count = 3;

    expect(changes).toHaveLength(2);
    expect(Diagnostics.why('count').map((entry) => entry.new)).toEqual([1, 2]);
    expect(Diagnostics.why(2).map((entry) => entry.new)).toEqual([1, 2]);

    const locked = {};
    Object.defineProperty(locked, 'value', { configurable: false, writable: true, value: 1 });
    const lockedSpy = jest.fn();
    const offLocked = Diagnostics.watch(locked, 'value', lockedSpy);
    locked.value = 2;
    offLocked();
    expect(lockedSpy).not.toHaveBeenCalled();

    const unstable = Diagnostics.gauge('unstable', () => { throw new Error('boom'); });
    expect(unstable.sample()).toBeUndefined();

    const steady = Diagnostics.gauge('steady', () => 3);
    expect(steady.value()).toBe(3);
    expect(steady.history().length).toBeGreaterThan(0);
  });

  test('hook avoids double wrapping and handles non-objects', () => {
    const Diagnostics = loadDiagnostics();
    Diagnostics.enable();

    const tool = {
      add(a, b) {
        return a + b;
      }
    };

    expect(Diagnostics.hook('noop', null)).toBeNull();
    Diagnostics.hook('Tool', tool);
    const wrapped = tool.add;
    Diagnostics.hook('Tool', tool);

    expect(tool.add).toBe(wrapped);
    expect(tool.add(1, 2)).toBe(3);
    expect(Diagnostics.report().spans).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Tool.add' })
    ]));
  });
});
