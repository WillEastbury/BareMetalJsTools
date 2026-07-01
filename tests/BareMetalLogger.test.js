/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.Logger.js');

function loadLogger() {
  delete require.cache[SRC];
  delete global.BareMetal;
  if (global.window) delete global.window.BareMetal;
  return require(SRC);
}

describe('BareMetal.Logger', () => {
  let Logger;
  let originalSendBeacon;

  beforeEach(() => {
    jest.useFakeTimers();
    Logger = loadLogger();
    originalSendBeacon = navigator.sendBeacon;
  });

  afterEach(() => {
    navigator.sendBeacon = originalSendBeacon;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('exports create, console and beacon helpers', () => {
    expect(Logger).toEqual({
      create: expect.any(Function),
      console: expect.any(Function),
      beacon: expect.any(Function)
    });
  });

  test('logs through a custom transport', () => {
    const transport = jest.fn();
    const logger = Logger.create({ transports: [transport] });
    logger.info('Saved', { id: 1 });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toMatchObject({
      level: 'info',
      msg: 'Saved',
      data: { id: 1 },
      context: {}
    });
    expect(typeof transport.mock.calls[0][0].ts).toBe('string');
  });

  test('defaults invalid levels to info filtering', () => {
    const transport = jest.fn();
    const logger = Logger.create({ level: 'bogus', transports: [transport] });

    logger.debug('hidden');
    logger.info('visible');

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0].msg).toBe('visible');
  });

  test('supports numeric levels', () => {
    const transport = jest.fn();
    const logger = Logger.create({ level: 2, transports: [transport] });

    logger.info('ignored');
    logger.warn('shown');

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0].level).toBe('warn');
  });

  test('converts null messages to empty strings', () => {
    const transport = jest.fn();
    const logger = Logger.create({ transports: [transport] });

    logger.info(null);

    expect(transport.mock.calls[0][0].msg).toBe('');
  });

  test('merges context objects into each log record', () => {
    const transport = jest.fn();
    const logger = Logger.create({ context: { area: 'auth' }, transports: [transport] });

    logger.warn('oops');

    expect(transport.mock.calls[0][0].context).toEqual({ area: 'auth' });
  });

  test('child logger inherits level and merges context', () => {
    const transport = jest.fn();
    const logger = Logger.create({ level: 'warn', context: { app: 'bm' }, transports: [transport] });
    const child = logger.child({ requestId: 'r1' });

    child.info('ignored');
    child.error('boom');

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0].context).toEqual({ app: 'bm', requestId: 'r1' });
  });

  test('setLevel changes the current threshold', () => {
    const transport = jest.fn();
    const logger = Logger.create({ level: 'error', transports: [transport] });

    expect(logger.setLevel('debug')).toBe(0);
    logger.debug('now visible');

    expect(transport).toHaveBeenCalledTimes(1);
  });

  test('addTransport appends a transport and remover detaches it', () => {
    const first = jest.fn();
    const second = jest.fn();
    const logger = Logger.create({ transports: [first] });

    const remove = logger.addTransport(second);
    logger.info('hello');
    remove();
    logger.info('world');

    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('addTransport ignores invalid transport arguments', () => {
    const logger = Logger.create({ transports: [] });
    expect(() => logger.addTransport(null)()).not.toThrow();
  });

  test('swallows transport exceptions and keeps logging', () => {
    const exploding = jest.fn(() => {
      throw new Error('transport failed');
    });
    const safe = jest.fn();
    const logger = Logger.create({ transports: [exploding, safe] });

    expect(() => logger.error('boom')).not.toThrow();
    expect(safe).toHaveBeenCalledTimes(1);
  });

  test('console transport uses console.log for info and debug', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    Logger.console({ level: 'info', ts: '2025-01-01T00:00:00.000Z', msg: 'hello', context: {}, data: 1 });

    expect(log).toHaveBeenCalledWith('[2025-01-01T00:00:00.000Z] INFO hello', 1);
  });

  test('console transport uses console.warn and console.error for higher levels', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    Logger.console({ level: 'warn', ts: 't', msg: 'careful', context: { x: 1 } });
    Logger.console({ level: 'error', ts: 't', msg: 'bad', context: {} });

    expect(warn).toHaveBeenCalledWith('[t] WARN careful', { x: 1 });
    expect(error).toHaveBeenCalledWith('[t] ERROR bad');
  });

  test('beacon transport batches and flushes after a timeout', () => {
    navigator.sendBeacon = jest.fn(() => true);
    const logger = Logger.create({ transports: [Logger.beacon('/logs')] });

    logger.info('one', { id: 1 });
    logger.warn('two');
    jest.advanceTimersByTime(1000);

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    expect(navigator.sendBeacon.mock.calls[0][0]).toBe('/logs');
    expect(navigator.sendBeacon.mock.calls[0][1]).toContain('"msg":"one"');
    expect(navigator.sendBeacon.mock.calls[0][1]).toContain('"msg":"two"');
  });

  test('beacon transport flushes immediately when queue reaches ten records', () => {
    navigator.sendBeacon = jest.fn(() => true);
    const logger = Logger.create({ transports: [Logger.beacon('/bulk')] });

    for (let i = 0; i < 10; i++) logger.info('m' + i);

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    expect(navigator.sendBeacon.mock.calls[0][1]).toContain('"msg":"m9"');
  });

  test('beacon transport flushes on visibilitychange when document becomes hidden', () => {
    navigator.sendBeacon = jest.fn(() => true);
    const logger = Logger.create({ transports: [Logger.beacon('/hidden')] });
    logger.info('pending');

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden'
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });

  test('beacon transport flushes on pagehide and unload', () => {
    navigator.sendBeacon = jest.fn(() => true);
    const logger = Logger.create({ transports: [Logger.beacon('/events')] });

    logger.info('pagehide');
    window.dispatchEvent(new Event('pagehide'));
    logger.info('unload');
    window.dispatchEvent(new Event('unload'));

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(2);
  });

  test('beacon transport is safe when sendBeacon is unavailable', () => {
    navigator.sendBeacon = undefined;
    const logger = Logger.create({ transports: [Logger.beacon('/noop')] });

    expect(() => {
      logger.info('safe');
      jest.advanceTimersByTime(1000);
    }).not.toThrow();
  });

  test('beacon payload serializes circular data safely', () => {
    navigator.sendBeacon = jest.fn(() => true);
    const logger = Logger.create({ transports: [Logger.beacon('/circular')] });
    const data = {};
    data.self = data;

    logger.info('circular', data);
    jest.advanceTimersByTime(1000);

    expect(navigator.sendBeacon.mock.calls[0][1]).toContain('[Circular]');
  });

  test('create accepts a single transport function', () => {
    const transport = jest.fn();
    const logger = Logger.create({ transports: transport });

    logger.error('single');

    expect(transport).toHaveBeenCalledTimes(1);
  });
});
