/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Diagnostics.js');

function loadDiagnostics() {
  const code = fs.readFileSync(SRC, 'utf8');
  window.BareMetal = {};
  const fn = new Function('module', code + '\nreturn window.BareMetal.Diagnostics;');
  return fn({ exports: {} });
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
