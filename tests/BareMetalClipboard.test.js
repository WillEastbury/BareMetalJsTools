/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Clipboard.js');

function loadClipboard() {
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Clipboard;');
  return fn();
}

function setNav(name, value) {
  Object.defineProperty(global.navigator, name, {
    configurable: true,
    writable: true,
    value
  });
}

describe('BareMetal.Clipboard', () => {
  const originalClipboard = global.navigator.clipboard;
  const originalPermissions = global.navigator.permissions;
  const originalClipboardItem = global.ClipboardItem;
  const originalSecure = global.isSecureContext;
  const originalExecCommand = document.execCommand;

  beforeEach(() => {
    document.body.innerHTML = '';
    setNav('clipboard', undefined);
    setNav('permissions', undefined);
    document.execCommand = undefined;
    Object.defineProperty(global, 'isSecureContext', { configurable: true, writable: true, value: true });
    global.ClipboardItem = function ClipboardItem(items) { this.items = items; };
  });

  afterEach(() => {
    setNav('clipboard', originalClipboard);
    setNav('permissions', originalPermissions);
    document.execCommand = originalExecCommand;
    Object.defineProperty(global, 'isSecureContext', { configurable: true, writable: true, value: originalSecure });
    global.ClipboardItem = originalClipboardItem;
    jest.restoreAllMocks();
  });

  test('uses navigator.clipboard.writeText and readText when available', async () => {
    const writeText = jest.fn().mockResolvedValue();
    const readText = jest.fn().mockResolvedValue('hello');
    setNav('clipboard', { writeText, readText });
    const Clipboard = loadClipboard();

    await expect(Clipboard.writeText('hello')).resolves.toBeUndefined();
    await expect(Clipboard.readText()).resolves.toBe('hello');
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(readText).toHaveBeenCalled();
  });

  test('write() builds ClipboardItem payloads for rich content', async () => {
    const write = jest.fn().mockResolvedValue();
    setNav('clipboard', { write });
    const Clipboard = loadClipboard();

    await expect(Clipboard.write([
      { type: 'text/plain', data: 'Hello' },
      { type: 'text/html', data: '<b>Hello</b>' }
    ])).resolves.toBeUndefined();

    expect(write).toHaveBeenCalledTimes(1);
    const item = write.mock.calls[0][0][0];
    expect(item.items['text/plain']).toBeInstanceOf(Promise);
    await expect(item.items['text/plain']).resolves.toBeInstanceOf(Blob);
  });

  test('falls back to document.execCommand for copy', async () => {
    document.execCommand = jest.fn((cmd) => cmd === 'copy');
    const Clipboard = loadClipboard();

    await expect(Clipboard.copy('legacy', { notify: false })).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  test('onPaste forwards text, html, files and items', () => {
    const Clipboard = loadClipboard();
    const el = document.createElement('div');
    const file = new File(['img'], 'clip.png', { type: 'image/png' });
    const spy = jest.fn();
    const off = Clipboard.onPaste(el, spy);
    const event = new Event('paste', { bubbles: true });

    Object.defineProperty(event, 'clipboardData', {
      configurable: true,
      value: {
        getData: (type) => type === 'text/plain' ? 'Hello' : '<b>Hello</b>',
        files: [file],
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }]
      }
    });

    el.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      text: 'Hello',
      html: '<b>Hello</b>',
      files: [file],
      items: expect.any(Array)
    }), event);

    off();
  });

  test('checkPermission maps read permission queries', async () => {
    const query = jest.fn().mockResolvedValue({ state: 'granted' });
    setNav('permissions', { query });
    const Clipboard = loadClipboard();

    await expect(Clipboard.checkPermission('read')).resolves.toBe('granted');
    expect(query).toHaveBeenCalledWith({ name: 'clipboard-read' });
  });

  test('reports clipboard support and secure context state', () => {
    setNav('clipboard', { writeText: jest.fn() });
    const Clipboard = loadClipboard();

    expect(Clipboard.isSupported()).toBe(true);
    expect(Clipboard.isSecureContext()).toBe(true);

    setNav('clipboard', undefined);
    document.execCommand = undefined;
    Object.defineProperty(global, 'isSecureContext', { configurable: true, writable: true, value: false });

    expect(Clipboard.isSupported()).toBe(false);
    expect(Clipboard.isSecureContext()).toBe(false);
  });
});
