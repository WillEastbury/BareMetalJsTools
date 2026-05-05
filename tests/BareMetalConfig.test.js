/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadConfigModule() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Config.js'), 'utf8');
  const fn = new Function('BareMetal', 'module', code + '\nreturn { namespace: BareMetal.Config, exported: module.exports };');
  return fn({}, { exports: {} });
}

describe('BareMetal.Config', () => {
  let Config;

  beforeEach(() => {
    jest.useRealTimers();
    const loaded = loadConfigModule();
    Config = loaded.namespace;
    expect(loaded.exported).toBe(loaded.namespace);
  });

  test('resolves values by layer priority and supports defaults', () => {
    const config = Config.create({
      schema: {
        port: { type: 'number', default: 8080 }
      },
      layers: [
        { name: 'defaults', data: { api: { host: 'defaults.local' }, mode: 'dev' } },
        { name: 'file', data: { api: { host: 'file.local' } } },
        { name: 'runtime', data: { api: { host: 'runtime.local' } } }
      ]
    });

    expect(config.get('api.host')).toBe('runtime.local');
    expect(config.get('mode')).toBe('dev');
    expect(config.get('port')).toBe(8080);
    expect(config.get('missing', 'fallback')).toBe('fallback');
    expect(config.getLayers().map((layer) => layer.name)).toEqual(['defaults', 'env', 'file', 'runtime', 'override']);
  });

  test('set, delete, reset, getLayer and has work per layer', () => {
    const config = Config.create({
      layers: [
        { name: 'defaults', data: { theme: 'light' } },
        { name: 'runtime', data: { theme: 'dark' } }
      ]
    });

    config.set('port', 3000, 'runtime');
    expect(config.get('port')).toBe(3000);
    expect(config.has('theme')).toBe(true);
    expect(config.getLayer('runtime')).toEqual({ theme: 'dark', port: 3000 });

    config.delete('theme', 'runtime');
    expect(config.get('theme')).toBe('light');

    config.reset('runtime');
    expect(config.get('port')).toBeUndefined();
    expect(config.get('theme')).toBe('light');
    expect(config.getLayer('runtime')).toEqual({});
  });

  test('validate checks required, type and enum rules', () => {
    const config = Config.create({
      schema: {
        mode: { required: true, enum: ['dev', 'prod'] },
        port: { required: true, type: 'number' },
        region: { required: true }
      }
    });

    config.set('mode', 'test');
    config.set('port', '3000');
    const result = config.validate();
    const codes = result.errors.map((error) => error.code).sort();

    expect(result.valid).toBe(false);
    expect(codes).toEqual(['enum', 'required', 'type']);
  });

  test('override applies and auto-reverts with timers', () => {
    jest.useFakeTimers();
    const config = Config.create({
      layers: [{ name: 'defaults', data: { feature: false } }]
    });

    config.override({ feature: true }, 1000);
    expect(config.get('feature')).toBe(true);

    jest.advanceTimersByTime(1000);
    expect(config.get('feature')).toBe(false);
  });

  test('scope prefixes gets and sets', () => {
    const config = Config.create();
    const db = config.scope('db');

    db.set('host', 'localhost');
    db.set('port', 5432);

    expect(db.get('host')).toBe('localhost');
    expect(config.get('db.port')).toBe(5432);
    expect(db.getAll()).toEqual({ host: 'localhost', port: 5432 });
  });

  test('freeze prevents writes', () => {
    const config = Config.create();

    config.freeze();

    expect(config.set('mode', 'prod')).toBe(false);
    expect(config.get('mode')).toBeUndefined();
  });

  test('onChange and onAnyChange fire when resolved values change', () => {
    const config = Config.create();
    const specific = jest.fn();
    const any = jest.fn();

    config.onChange('theme', specific);
    config.onAnyChange(any);
    config.set('theme', 'dark');

    expect(specific).toHaveBeenCalledWith('dark', 'runtime', 'theme');
    expect(any).toHaveBeenCalledWith('theme', 'dark', 'runtime');
  });

  test('toEnv and fromEnv round-trip values', () => {
    const config = Config.create();
    config.merge({ db: { host: 'localhost' }, port: 8080, enabled: true, tags: ['a', 'b'] });

    const env = config.toEnv();
    const restored = Config.create();
    restored.fromEnv(env);

    expect(env).toEqual({ DB_HOST: 'localhost', PORT: 8080, ENABLED: true, TAGS: '["a","b"]' });
    expect(restored.getAll()).toEqual(config.getAll());
  });

  test('merge performs a deep merge into a layer', () => {
    const config = Config.create({
      layers: [{ name: 'file', data: { db: { host: 'localhost', options: { ssl: false } }, retries: 1 } }]
    });

    config.merge({ db: { options: { ssl: true, pool: 5 } }, retries: 2 }, 'file');

    expect(config.getLayer('file')).toEqual({
      db: { host: 'localhost', options: { ssl: true, pool: 5 } },
      retries: 2
    });
  });

  test('export and import restore a snapshot', () => {
    const config = Config.create({
      schema: { port: { type: 'number', default: 80 } },
      layers: [{ name: 'runtime', data: { api: { host: 'localhost' } } }]
    });

    const snapshot = config.export();
    const restored = Config.create();
    restored.import(snapshot);

    expect(restored.export()).toEqual(snapshot);
    expect(restored.getAll()).toEqual({ api: { host: 'localhost' }, port: 80 });
  });

  test('getAll returns a merged flattened configuration object', () => {
    const config = Config.create({
      layers: [
        { name: 'defaults', data: { a: 1, nested: { one: 1, two: 1 } } },
        { name: 'file', data: { nested: { two: 2 } } },
        { name: 'runtime', data: { b: 2 } }
      ]
    });

    expect(config.getAll()).toEqual({
      a: 1,
      b: 2,
      nested: { one: 1, two: 2 }
    });
  });
});
