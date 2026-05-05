/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.FileIO.js');

class MockFile {
  constructor(parts, name, opts) {
    const buffers = (parts || []).map(part => {
      if (Buffer.isBuffer(part)) return part;
      if (part instanceof ArrayBuffer) return Buffer.from(part);
      if (ArrayBuffer.isView(part)) return Buffer.from(part.buffer, part.byteOffset, part.byteLength);
      return Buffer.from(String(part));
    });
    this._buffer = Buffer.concat(buffers);
    this.name = name;
    this.type = (opts && opts.type) || '';
    this.size = this._buffer.length;
    this.lastModified = Date.now();
  }
  text() {
    return Promise.resolve(this._buffer.toString());
  }
  arrayBuffer() {
    const buf = this._buffer;
    return Promise.resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  slice(start, end) {
    return new MockFile([this._buffer.slice(start || 0, end == null ? this._buffer.length : end)], this.name, { type: this.type });
  }
}

class MockFileReader {
  readAsText(file) {
    Promise.resolve(file.text()).then(text => {
      this.result = text;
      if (this.onload) this.onload({ target: this });
    }).catch(() => this.onerror && this.onerror(new Error('read error')));
  }
  readAsArrayBuffer(file) {
    Promise.resolve(file.arrayBuffer()).then(buffer => {
      this.result = buffer;
      if (this.onload) this.onload({ target: this });
    }).catch(() => this.onerror && this.onerror(new Error('read error')));
  }
  readAsDataURL(file) {
    Promise.resolve(file.arrayBuffer()).then(buffer => {
      const base64 = Buffer.from(buffer).toString('base64');
      this.result = 'data:' + (file.type || 'application/octet-stream') + ';base64,' + base64;
      if (this.onload) this.onload({ target: this });
    }).catch(() => this.onerror && this.onerror(new Error('read error')));
  }
}

function loadFileIO() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const fn = new Function('BareMetal', 'document', 'window', 'FileReader', 'File', 'Blob', 'URL', 'setTimeout', 'clearTimeout', code + '\nreturn BareMetal.FileIO;');
  return fn({}, global.document, global.window, global.FileReader, global.File, global.Blob, global.URL, setTimeout, clearTimeout);
}

describe('BareMetal.FileIO', () => {
  let FileIO;
  let origFileReader;
  let origFile;
  let origCreateObjectURL;
  let origRevokeObjectURL;
  let clickSpy;

  beforeEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
    origFileReader = global.FileReader;
    origFile = global.File;
    origCreateObjectURL = global.URL.createObjectURL;
    origRevokeObjectURL = global.URL.revokeObjectURL;
    global.FileReader = MockFileReader;
    global.File = MockFile;
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    FileIO = loadFileIO();
  });

  afterEach(() => {
    global.FileReader = origFileReader;
    global.File = origFile;
    global.URL.createObjectURL = origCreateObjectURL;
    global.URL.revokeObjectURL = origRevokeObjectURL;
    if (clickSpy) clickSpy.mockRestore();
  });

  test('formatSize and ext utilities work', () => {
    expect(FileIO.formatSize(0)).toBe('0 B');
    expect(FileIO.formatSize(1536)).toBe('1.5 KB');
    expect(FileIO.formatSize(1024 * 1024)).toBe('1 MB');
    expect(FileIO.ext('data.json')).toBe('json');
    expect(FileIO.ext('archive.tar.gz')).toBe('gz');
    expect(FileIO.ext('README')).toBe('');
  });

  test('media type helpers detect common types', () => {
    expect(FileIO.isImage({ type: 'image/png', name: 'a.png' })).toBe(true);
    expect(FileIO.isVideo({ type: 'video/mp4', name: 'a.mp4' })).toBe(true);
    expect(FileIO.isAudio({ type: 'audio/mpeg', name: 'a.mp3' })).toBe(true);
    expect(FileIO.isPDF({ type: 'application/pdf', name: 'a.pdf' })).toBe(true);
    expect(FileIO.isImage({ type: 'text/plain', name: 'a.txt' })).toBe(false);
  });

  test('readAsText reads file contents via FileReader', async () => {
    const file = new MockFile(['hello world'], 'hello.txt', { type: 'text/plain' });
    await expect(FileIO.readAsText(file)).resolves.toBe('hello world');
  });

  test('readAsJSON parses JSON file contents via FileReader', async () => {
    const file = new MockFile([JSON.stringify({ ok: true, count: 2 })], 'data.json', { type: 'application/json' });
    await expect(FileIO.readAsJSON(file)).resolves.toEqual({ ok: true, count: 2 });
  });

  test('dropZone attaches listeners and destroy removes them', () => {
    const element = document.createElement('div');
    const onDrop = jest.fn();
    const onDragOver = jest.fn();
    const onDragLeave = jest.fn();
    document.body.appendChild(element);

    const zone = FileIO.dropZone(element, {
      accept: ['image/*'],
      multiple: true,
      onDrop,
      onDragOver,
      onDragLeave,
      highlight: true
    });

    const dragEnter = new Event('dragenter', { bubbles: true, cancelable: true });
    Object.defineProperty(dragEnter, 'dataTransfer', { value: { files: [] } });
    element.dispatchEvent(dragEnter);
    expect(onDragOver).toHaveBeenCalled();
    expect(element.classList.contains('bm-drop-active')).toBe(true);

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [new MockFile(['img'], 'photo.png', { type: 'image/png' })] }
    });
    element.dispatchEvent(dropEvent);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0][0]).toHaveLength(1);
    expect(element.classList.contains('bm-drop-active')).toBe(false);

    const dragLeave = new Event('dragleave', { bubbles: true, cancelable: true });
    Object.defineProperty(dragLeave, 'dataTransfer', { value: { files: [] } });
    element.dispatchEvent(dragLeave);
    expect(onDragLeave).toHaveBeenCalled();

    zone.destroy();
    onDragOver.mockClear();
    element.dispatchEvent(new Event('dragenter', { bubbles: true, cancelable: true }));
    expect(onDragOver).not.toHaveBeenCalled();
  });

  test('download creates and clicks an anchor', () => {
    FileIO.download('hello', 'hello.txt', 'text/plain');
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    const link = document.querySelector('a[download="hello.txt"]');
    expect(link).toBeNull();
  });

  test('feature detection reflects available APIs', () => {
    delete global.showOpenFilePicker;
    delete global.showSaveFilePicker;
    expect(FileIO.hasFileSystemAccess()).toBe(false);
    global.showOpenFilePicker = jest.fn();
    global.showSaveFilePicker = jest.fn();
    expect(FileIO.hasFileSystemAccess()).toBe(true);
    expect(typeof FileIO.hasDragDrop()).toBe('boolean');
    expect(FileIO.hasDragDrop()).toBe(true);
  });
});
