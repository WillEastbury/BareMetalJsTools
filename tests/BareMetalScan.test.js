/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Scan.js');
const finderPattern = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1]
];
const code128Patterns = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];
const digitFont = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110']
};

function loadScan() {
  delete global.BareMetal;
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Scan;');
  return fn();
}

function makeImage(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  const value = fill == null ? 255 : fill;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  return typeof global.ImageData === 'function' ? new global.ImageData(data, width, height) : { data, width, height };
}

function setPixel(image, x, y, dark) {
  const idx = (y * image.width + x) * 4;
  const value = dark ? 0 : 255;
  image.data[idx] = value;
  image.data[idx + 1] = value;
  image.data[idx + 2] = value;
  image.data[idx + 3] = 255;
}

function fillRect(image, x, y, w, h, dark) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(image, xx, yy, dark);
  }
}

function qrReserved(size, x, y) {
  return (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8) || x === 6 || y === 6;
}

function checksum(bytes) {
  return bytes.reduce((sum, value) => (sum + value) & 255, 0);
}

function encodePseudoQR(text, moduleSize = 4, quiet = 2) {
  const size = 21;
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  function drawFinder(startX, startY) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) grid[startY + y][startX + x] = finderPattern[y][x];
    }
  }
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 ? 0 : 1;
    grid[i][6] = i % 2 ? 0 : 1;
  }
  const bytes = Array.from(text).map((ch) => ch.charCodeAt(0));
  const payload = [bytes.length, checksum(bytes), ...bytes];
  const bits = payload.flatMap((byte) => Array.from({ length: 8 }, (_, bit) => (byte >> (7 - bit)) & 1));
  const repeated = bits.flatMap((bit) => [bit, bit, bit]);
  let bitIndex = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qrReserved(size, x, y)) continue;
      grid[y][x] = repeated[bitIndex++] || 0;
    }
  }
  const image = makeImage((size + quiet * 2) * moduleSize, (size + quiet * 2) * moduleSize);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      fillRect(image, (x + quiet) * moduleSize, (y + quiet) * moduleSize, moduleSize, moduleSize, !!grid[y][x]);
    }
  }
  return image;
}

function encodeCode128(text, moduleSize = 2, height = 60, quiet = 10) {
  const dataCodes = Array.from(text).map((ch) => ch.charCodeAt(0) - 32);
  let checksumValue = 104;
  dataCodes.forEach((code, index) => { checksumValue += code * (index + 1); });
  checksumValue %= 103;
  const symbols = [104, ...dataCodes, checksumValue, 106];
  const modules = symbols.map((code) => code128Patterns[code]).join('');
  const totalWidth = (quiet * 2 + modules.split('').reduce((sum, n) => sum + Number(n), 0)) * moduleSize;
  const image = makeImage(totalWidth, height);
  let x = quiet * moduleSize;
  let dark = true;
  for (const width of modules) {
    const span = Number(width) * moduleSize;
    if (dark) fillRect(image, x, 0, span, height, true);
    x += span;
    dark = !dark;
  }
  return image;
}

function renderDigits(text, scale = 3, gap = 2, margin = 2) {
  const width = margin * 2 + text.length * (5 * scale) + Math.max(0, text.length - 1) * gap;
  const height = margin * 2 + 7 * scale;
  const image = makeImage(width, height);
  let cursor = margin;
  for (const ch of text) {
    const glyph = digitFont[ch];
    for (let y = 0; y < glyph.length; y++) {
      for (let x = 0; x < glyph[y].length; x++) {
        if (glyph[y][x] === '1') fillRect(image, cursor + x * scale, margin + y * scale, scale, scale, true);
      }
    }
    cursor += 5 * scale + gap;
  }
  return image;
}

function setMediaDevices(value) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value
  });
}

function makeTrack(kind) {
  return { kind, stop: jest.fn() };
}

function makeStream(tracks) {
  return {
    getTracks: () => tracks.slice(),
    getVideoTracks: () => tracks.filter((track) => track.kind === 'video'),
    getAudioTracks: () => tracks.filter((track) => track.kind === 'audio')
  };
}

describe('BareMetal.Scan', () => {
  let Scan;
  let originalMediaDevices;
  let originalCreateImageBitmap;
  let originalRAF;
  let originalCAF;
  let currentImageData;
  let drawImage;
  let playSpy;
  let pauseSpy;
  let getContextSpy;
  let rafQueue;

  beforeEach(() => {
    document.body.innerHTML = '';
    rafQueue = [];
    currentImageData = makeImage(4, 4);
    originalMediaDevices = global.navigator.mediaDevices;
    originalCreateImageBitmap = global.createImageBitmap;
    originalRAF = global.requestAnimationFrame;
    originalCAF = global.cancelAnimationFrame;
    setMediaDevices({});
    global.requestAnimationFrame = jest.fn((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    global.cancelAnimationFrame = jest.fn();
    drawImage = jest.fn();
    playSpy = jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pauseSpy = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    getContextSpy = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      drawImage,
      getImageData: jest.fn(() => currentImageData),
      clearRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      beginPath: jest.fn()
    }));
    Scan = loadScan();
  });

  afterEach(() => {
    setMediaDevices(originalMediaDevices);
    global.createImageBitmap = originalCreateImageBitmap;
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
    if (playSpy) playSpy.mockRestore();
    if (pauseSpy) pauseSpy.mockRestore();
    if (getContextSpy) getContextSpy.mockRestore();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('capture camera and stream use mediaDevices and frame extraction', async () => {
    const track = makeTrack('video');
    const stream = makeStream([track]);
    const getUserMedia = jest.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia });
    Scan = loadScan();

    const capture = await Scan.capture({ source: 'camera', facing: 'environment', width: 4, height: 4 });
    const live = Scan.stream({ facing: 'user', width: 4, height: 4, overlay: true });
    const onFrame = jest.fn();
    live.onFrame(onFrame);
    await Promise.resolve();
    await Promise.resolve();
    rafQueue.shift()(16);

    expect(getUserMedia).toHaveBeenNthCalledWith(1, {
      video: { width: 4, height: 4, facingMode: 'environment' },
      audio: false
    });
    expect(getUserMedia).toHaveBeenNthCalledWith(2, {
      video: { width: 4, height: 4, facingMode: 'user' },
      audio: false
    });
    expect(capture.metadata).toEqual(expect.objectContaining({ width: 4, height: 4, source: 'camera' }));
    expect(onFrame).toHaveBeenCalledWith(currentImageData);
    expect(live.getFrame()).toBe(currentImageData);

    live.stop();
    expect(track.stop).toHaveBeenCalled();
    expect(drawImage).toHaveBeenCalled();
  });

  test('decodeQR and decode track synthetic QR payloads and history', async () => {
    const qrImage = encodePseudoQR('INV42');

    const qr = await Scan.decodeQR(qrImage);
    const decoded = await Scan.decode(qrImage, { formats: ['qr'] });

    expect(qr.value).toBe('INV42');
    expect(qr.version).toBe(1);
    expect(decoded).toMatchObject({ type: 'qr', value: 'INV42' });
    expect(Scan.history()).toEqual([expect.objectContaining({ type: 'qr', value: 'INV42', mapped: null })]);
  });

  test('decodeBarcode decodes synthetic Code128 bars', async () => {
    const barcode = encodeCode128('ABC123');

    const decoded = await Scan.decodeBarcode(barcode, 'code128');

    expect(decoded).toMatchObject({ format: 'code128', value: 'ABC123' });
    expect(decoded.bounds.w).toBeGreaterThan(0);
  });

  test('ocr recognizes numeric bitmap glyphs', async () => {
    const image = renderDigits('123');

    const result = await Scan.ocr(image, { charset: 'numeric' });

    expect(result.text).toBe('123');
    expect(result.words[0]).toEqual(expect.objectContaining({ text: '123' }));
  });

  test('map supports delimited, json and key value payloads', () => {
    expect(Scan.map({ invoiceNo: { index: 0 }, amount: { index: 1, type: 'number' }, dueDate: { index: 2 } }, { value: 'INV-2024-001|5000|2024-02-01' }, { delimiter: '|' })).toEqual({
      invoiceNo: 'INV-2024-001',
      amount: 5000,
      dueDate: '2024-02-01'
    });
    expect(Scan.map({ invoiceNo: {}, amount: { type: 'number' } }, { value: '{"invoiceNo":"INV-9","amount":42}' }, { format: 'json' })).toEqual({
      invoiceNo: 'INV-9',
      amount: 42
    });
    expect(Scan.map({ invoiceNo: {}, amount: { type: 'number' } }, { value: 'invoiceNo=INV-8|amount=11' }, { format: 'kv' })).toEqual({
      invoiceNo: 'INV-8',
      amount: 11
    });
  });

  test('validate maps and validates decoded payloads', () => {
    const schema = {
      invoiceNo: { index: 0, required: true, pattern: '^INV-' },
      amount: { index: 1, type: 'number', min: 1 },
      dueDate: { index: 2, required: true },
      mapOptions: { delimiter: '|' }
    };
    const decoded = { type: 'qr', value: 'INV-2024-001|5000|2024-02-01' };

    const result = Scan.validate(decoded, schema);

    expect(result.valid).toBe(true);
    expect(result.mapped).toEqual({ invoiceNo: 'INV-2024-001', amount: 5000, dueDate: '2024-02-01' });
    expect(result.errors).toEqual([]);
  });

  test('continuous deduplicates repeated scans within cooldown', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const frameHandlers = [];
    const stop = jest.fn();
    const callback = jest.fn();
    Scan.stream = jest.fn(() => ({
      video: document.createElement('video'),
      onFrame(fn) {
        frameHandlers.push(fn);
        return () => {};
      },
      stop,
      getFrame() { return currentImageData; }
    }));
    Scan.decode = jest.fn().mockResolvedValue({ type: 'qr', value: 'DUP', bounds: { x: 1, y: 1, w: 2, h: 2 } });

    const control = Scan.continuous({ cooldown: 2000, highlight: false, beep: false }, callback);

    frameHandlers[0](currentImageData);
    await Promise.resolve();
    frameHandlers[0](currentImageData);
    await Promise.resolve();
    jest.setSystemTime(new Date('2024-01-01T00:00:03Z'));
    frameHandlers[0](currentImageData);
    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(2);
    control.stop();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  test('history, onScan and clearHistory manage scan events', async () => {
    const seen = [];
    const unsub = Scan.onScan((entry) => seen.push(entry));
    const qrImage = encodePseudoQR('EVT1');

    const decoded = await Scan.decode(qrImage, { formats: ['qr'] });
    const validation = Scan.validate(decoded, {
      code: { required: true },
      mapOptions: { format: 'object' },
      fields: [{ field: 'code', transform: () => decoded.value }]
    });

    expect(seen).toHaveLength(1);
    expect(Scan.history()[0]).toEqual(expect.objectContaining({ value: 'EVT1' }));
    expect(validation.mapped.code).toBe('EVT1');

    unsub();
    Scan.clearHistory();
    expect(Scan.history()).toEqual([]);
  });

  test('fromBlob uses createImageBitmap conversion path', async () => {
    const blob = new Blob(['fake'], { type: 'image/png' });
    global.createImageBitmap = jest.fn().mockResolvedValue({ width: 4, height: 4, nodeName: 'IMG' });
    Scan = loadScan();

    const image = await Scan.fromBlob(blob);

    expect(global.createImageBitmap).toHaveBeenCalledWith(blob);
    expect(image).toBe(currentImageData);
  });

  test('formats registry allows custom decoders', async () => {
    const custom = jest.fn().mockResolvedValue({ type: 'custom', value: 'OK', confidence: 1, bounds: { x: 0, y: 0, w: 1, h: 1 } });
    Scan.formats.register('custom', custom);

    const result = await Scan.decode(makeImage(1, 1), { formats: ['custom'] });

    expect(Scan.formats.list()).toContain('custom');
    expect(custom).toHaveBeenCalled();
    expect(result).toMatchObject({ type: 'custom', value: 'OK' });
  });
});
