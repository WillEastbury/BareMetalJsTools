/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Clipboard.js');

function loadClipboard() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Clipboard.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
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

describe('BareMetal.Clipboard additional coverage', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('copyFrom and copyImage support rich content and notifications', async () => {
    jest.useFakeTimers();
    const write = jest.fn().mockResolvedValue();
    const blob = new Blob(['img'], { type: 'image/png' });
    setNav('clipboard', { write });
    Object.defineProperty(global, 'isSecureContext', { configurable: true, writable: true, value: true });
    global.ClipboardItem = function ClipboardItem(items) { this.items = items; };
    const Clipboard = loadClipboard();
    const originalCreateElement = document.createElement.bind(document);
    const element = document.createElement('div');
    element.innerHTML = '<strong>Hello</strong>';
    element.textContent = 'Hello';

    await expect(Clipboard.copyFrom(element, { html: true, notify: true, notifyDuration: 250 })).resolves.toBe(true);
    expect(document.body.textContent).toContain('Copied!');
    await jest.advanceTimersByTimeAsync(500);
    expect(document.body.textContent).not.toContain('Copied!');

    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (String(tagName).toLowerCase() === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: jest.fn() }),
          toBlob: (cb) => cb(blob)
        };
      }
      return originalCreateElement(tagName);
    });

    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 20 });
    Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 10 });

    await expect(Clipboard.copyImage(img)).resolves.toBe(true);
    expect(write).toHaveBeenCalledTimes(2);
  });

  test('readImage, paste helpers, cut fallback, and permission requests cover legacy paths', async () => {
    const imageFile = new File(['img'], 'clip.png', { type: 'image/png' });
    const textFile = new File(['txt'], 'note.txt', { type: 'text/plain' });
    const writeText = jest.fn().mockResolvedValue();
    const read = jest.fn().mockResolvedValue([
      { types: ['image/png'], getType: jest.fn().mockResolvedValue(imageFile) }
    ]);
    const readText = jest.fn().mockResolvedValue('granted');
    setNav('clipboard', { writeText, readText, read });
    setNav('permissions', { query: jest.fn().mockResolvedValue({ state: 'prompt' }) });
    document.execCommand = jest.fn(() => false);
    const Clipboard = loadClipboard();

    await expect(Clipboard.readImage()).resolves.toBe(imageFile);

    const el = document.createElement('div');
    const filesSpy = jest.fn();
    const imageSpy = jest.fn();
    const offFiles = Clipboard.onPasteFiles(el, filesSpy);
    const offImage = Clipboard.onPasteImage(el, imageSpy);
    const event = new Event('paste', { bubbles: true });
    Object.defineProperty(event, 'clipboardData', {
      configurable: true,
      value: {
        getData: () => '',
        files: [textFile, imageFile],
        items: []
      }
    });
    el.dispatchEvent(event);
    expect(filesSpy).toHaveBeenCalledWith([textFile, imageFile], event);
    expect(imageSpy).toHaveBeenCalledWith(imageFile, event);
    offFiles();
    offImage();

    const input = document.createElement('input');
    input.value = 'legacy text';
    await expect(Clipboard.cut(input)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('legacy text');
    expect(input.value).toBe('');

    await expect(Clipboard.requestPermission('read')).resolves.toBe(true);
    await expect(Clipboard.requestPermission('write')).resolves.toBe(true);
    setNav('permissions', { query: jest.fn().mockResolvedValue({ state: 'denied' }) });
    await expect(Clipboard.requestPermission('read')).resolves.toBe(false);
  });

  test('read falls back to text blobs and image helpers handle empty clipboard data', async () => {
    const readText = jest.fn().mockResolvedValue('plain text');
    setNav('clipboard', { readText });
    const Clipboard = loadClipboard();

    await expect(Clipboard.read()).resolves.toEqual([
      { type: 'text/plain', data: expect.any(Blob) }
    ]);
    await expect(Clipboard.readImage()).resolves.toBeNull();
    await expect(Clipboard.copyImage(null)).resolves.toBe(false);
  });

  test('writeText and readText fall back cleanly when clipboard APIs fail', async () => {
    setNav('clipboard', {
      writeText: jest.fn().mockRejectedValue(new Error('nope')),
      readText: jest.fn().mockRejectedValue(new Error('nope'))
    });
    document.execCommand = jest.fn((cmd) => cmd === 'copy' ? false : true);
    const Clipboard = loadClipboard();

    await expect(Clipboard.writeText('fallback')).resolves.toBe(false);
    await expect(Clipboard.readText()).resolves.toBe('');
  });

  test('copyFrom text mode and write with empty input return safe fallbacks', async () => {
    document.execCommand = jest.fn(() => true);
    const Clipboard = loadClipboard();
    const el = document.createElement('div');
    el.textContent = 'Just text';

    await expect(Clipboard.copyFrom(el, { notify: false })).resolves.toBe(true);
    await expect(Clipboard.write([])).resolves.toBeUndefined();
    await expect(Clipboard.copyFrom(null)).resolves.toBe(false);
  });

  test('permission and paste listeners use document-level fallbacks when optional APIs are absent', async () => {
    setNav('permissions', undefined);
    setNav('clipboard', undefined);
    const Clipboard = loadClipboard();
    const seen = jest.fn();
    const off = Clipboard.onPaste(seen);
    const event = new Event('paste', { bubbles: true });
    Object.defineProperty(event, 'clipboardData', {
      configurable: true,
      value: { getData: () => 'doc', files: [], items: [] }
    });
    document.dispatchEvent(event);
    off();

    expect(seen).toHaveBeenCalled();
    await expect(Clipboard.checkPermission('write')).resolves.toBe('prompt');
    await expect(Clipboard.requestPermission('read')).resolves.toBe(false);
  });
});
