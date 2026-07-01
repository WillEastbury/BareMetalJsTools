/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.I18n.js');

function loadI18n() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  delete global.BareMetal;
  if (global.window) delete global.window.BareMetal;
  return require(SRC);
}

describe('BareMetal.I18n', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('defaults to the en locale', () => {
    const I18n = loadI18n();
    expect(I18n.getLocale()).toBe('en');
  });

  test('setLocale updates and getLocale returns the active locale', () => {
    const I18n = loadI18n();
    expect(I18n.setLocale('fr-CA')).toBe('fr-CA');
    expect(I18n.getLocale()).toBe('fr-CA');
  });

  test('subscribe is notified only when the locale actually changes', () => {
    const I18n = loadI18n();
    const spy = jest.fn();
    I18n.subscribe(spy);

    I18n.setLocale('de');
    I18n.setLocale('de');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('de');
  });

  test('unsubscribe stops locale change notifications', () => {
    const I18n = loadI18n();
    const spy = jest.fn();
    const unsubscribe = I18n.subscribe(spy);

    unsubscribe();
    I18n.setLocale('es');

    expect(spy).not.toHaveBeenCalled();
  });

  test('subscribe returns a noop for invalid listeners', () => {
    const I18n = loadI18n();
    expect(() => I18n.subscribe(null)()).not.toThrow();
  });

  test('configure updates default and fallback locales', () => {
    const I18n = loadI18n();
    const config = I18n.configure({ defaultLocale: 'en-GB', fallbackLocale: 'fr' });

    expect(config).toEqual({ defaultLocale: 'en-GB', fallbackLocale: 'fr' });
  });

  test('configure ignores invalid values and preserves previous settings', () => {
    const I18n = loadI18n();
    I18n.configure({ defaultLocale: 'en-GB', fallbackLocale: 'fr' });

    expect(I18n.configure({ defaultLocale: '', fallbackLocale: null })).toEqual({
      defaultLocale: 'en-GB',
      fallbackLocale: 'fr'
    });
  });

  test('addMessages flattens nested message objects', () => {
    const I18n = loadI18n();
    I18n.addMessages('en', { app: { title: 'BareMetal', subtitle: null } });

    expect(I18n.t('app.title')).toBe('BareMetal');
    expect(I18n.t('app.subtitle')).toBe('app.subtitle');
  });

  test('translates a direct key with interpolation', () => {
    const I18n = loadI18n();
    I18n.addMessages('en', { hello: 'Hello {name}!' });

    expect(I18n.t('hello', { name: 'Ada' })).toBe('Hello Ada!');
  });

  test('missing interpolation values become empty strings', () => {
    const I18n = loadI18n();
    I18n.addMessages('en', { hello: 'Hello {name} {missing}' });

    expect(I18n.t('hello', { name: 'Ada' })).toBe('Hello Ada ');
  });

  test('supports zero plural translations', () => {
    const I18n = loadI18n();
    I18n.addMessages('en', {
      inbox_zero: 'No messages',
      inbox_one: '{count} message',
      inbox_other: '{count} messages'
    });

    expect(I18n.t('inbox', { count: 0 })).toBe('No messages');
  });

  test('supports one and other plural translations', () => {
    const I18n = loadI18n();
    I18n.addMessages('en', {
      inbox_one: '{count} message',
      inbox_other: '{count} messages'
    });

    expect(I18n.t('inbox', { count: 1 })).toBe('1 message');
    expect(I18n.t('inbox', { count: 4 })).toBe('4 messages');
  });

  test('converts count values to numbers for plural selection', () => {
    const I18n = loadI18n();
    I18n.addMessages('en', {
      file_one: '{count} file',
      file_other: '{count} files'
    });

    expect(I18n.t('file', { count: '1' })).toBe('1 file');
  });

  test('falls back from region locale to base locale', () => {
    const I18n = loadI18n();
    I18n.addMessages('en', { greeting: 'Hello' });
    I18n.setLocale('en-US');

    expect(I18n.t('greeting')).toBe('Hello');
  });

  test('falls back from locale to configured fallback locale', () => {
    const I18n = loadI18n();
    I18n.configure({ fallbackLocale: 'fr', defaultLocale: 'en' });
    I18n.addMessages('fr', { greeting: 'Bonjour' });
    I18n.setLocale('es-MX');

    expect(I18n.t('greeting')).toBe('Bonjour');
  });

  test('falls back to configured default locale last', () => {
    const I18n = loadI18n();
    I18n.configure({ fallbackLocale: 'fr', defaultLocale: 'en-GB' });
    I18n.addMessages('en-GB', { greeting: 'Hello there' });
    I18n.setLocale('it');

    expect(I18n.t('greeting')).toBe('Hello there');
  });

  test('returns the key when no translation exists', () => {
    const I18n = loadI18n();
    expect(I18n.t('missing.key')).toBe('missing.key');
    expect(I18n.t('')).toBe('');
  });

  test('loadMessages fetches JSON and merges the locale table', async () => {
    const I18n = loadI18n();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ greeting: 'Hola', nested: { value: 'Sí' } })
    });

    const messages = await I18n.loadMessages('es', '/messages/es.json');

    expect(global.fetch).toHaveBeenCalledWith('/messages/es.json');
    expect(messages.greeting).toBe('Hola');
    expect(I18n.t('nested.value')).toBe('nested.value');
    I18n.setLocale('es');
    expect(I18n.t('greeting')).toBe('Hola');
    expect(I18n.t('nested.value')).toBe('Sí');
  });

  test('loadMessages handles non-ok responses by keeping the locale table empty', async () => {
    const I18n = loadI18n();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: jest.fn() });

    const messages = await I18n.loadMessages('es', '/bad.json');

    expect(messages).toEqual({});
  });

  test('loadMessages handles fetch rejection', async () => {
    const I18n = loadI18n();
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));

    await expect(I18n.loadMessages('es', '/down.json')).resolves.toEqual({});
  });

  test('loadMessages resolves safely when fetch is unavailable or url is invalid', async () => {
    const I18n = loadI18n();
    global.fetch = undefined;

    await expect(I18n.loadMessages('en', '')).resolves.toEqual({});
  });

  test('detects RTL locales with regex fallback', () => {
    const I18n = loadI18n();
    expect(I18n.isRTL('ar')).toBe(true);
    expect(I18n.isRTL('en')).toBe(false);
  });

  test('uses Intl.Locale text direction when available', () => {
    const I18n = loadI18n();
    const RealLocale = Intl.Locale;
    Intl.Locale = function MockLocale(locale) {
      this.locale = locale;
      this.textInfo = { direction: locale === 'zz' ? 'rtl' : 'ltr' };
    };

    try {
      expect(I18n.isRTL('zz')).toBe(true);
      expect(I18n.isRTL('yy')).toBe(false);
    } finally {
      Intl.Locale = RealLocale;
    }
  });
});
