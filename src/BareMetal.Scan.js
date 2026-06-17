var root = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
root.BareMetal = root.BareMetal || {};
var BareMetal = root.BareMetal;

BareMetal.Scan = (function () {
  'use strict';

  var g = root;
  var historyStore = [];
  var scanListeners = [];
  var decoderRegistry = {};
  var maxHistory = 50;
  var finderPattern = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
  ];
  var code128Patterns = [
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
  var code128ByPattern = (function () {
    var out = {};
    var i;
    for (i = 0; i < code128Patterns.length; i++) out[code128Patterns[i]] = i;
    return out;
  })();
  var ocrFont = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
    '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
    D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
    J: ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111']
  };

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function copy(a, b) {
    var out = {}, key;
    for (key in (a || {})) if (own(a, key)) out[key] = a[key];
    for (key in (b || {})) if (own(b, key)) out[key] = b[key];
    return out;
  }
  function toArray(value) { return Array.prototype.slice.call(value || []); }
  function isFn(value) { return typeof value === 'function'; }
  function isNum(value) { return typeof value === 'number' && isFinite(value); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function now() { return Date.now ? Date.now() : +new Date(); }
  function noop() {}
  function doc() { return g.document || null; }
  function raf(fn) { return g.requestAnimationFrame ? g.requestAnimationFrame(fn) : setTimeout(fn, 16); }
  function caf(id) { if (g.cancelAnimationFrame) g.cancelAnimationFrame(id); else clearTimeout(id); }
  function createCanvas(width, height) {
    var d = doc();
    var canvas = d && d.createElement ? d.createElement('canvas') : null;
    if (!canvas) return null;
    canvas.width = width || 1;
    canvas.height = height || 1;
    return canvas;
  }
  function makeImageData(width, height, data) {
    var pixels = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data || width * height * 4);
    try {
      if (typeof g.ImageData === 'function') return new g.ImageData(pixels, width, height);
    } catch (_) {}
    return { data: pixels, width: width, height: height };
  }
  function isImageDataLike(value) {
    return !!value && isNum(value.width) && isNum(value.height) && value.data && typeof value.data.length === 'number';
  }
  function grayscale(image) {
    var out = new Uint8Array(image.width * image.height);
    var data = image.data;
    var i;
    var j = 0;
    for (i = 0; i < data.length; i += 4) out[j++] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    return out;
  }
  function average(values) {
    var i, sum = 0;
    if (!values || !values.length) return 0;
    for (i = 0; i < values.length; i++) sum += values[i];
    return sum / values.length;
  }
  function autoThreshold(gray) {
    var i, min = 255, max = 0;
    for (i = 0; i < gray.length; i++) {
      if (gray[i] < min) min = gray[i];
      if (gray[i] > max) max = gray[i];
    }
    return Math.round((min + max) / 2);
  }
  function binarize(image, threshold) {
    var gray = grayscale(image);
    var limit = isNum(threshold) ? threshold : autoThreshold(gray);
    var out = new Uint8Array(gray.length);
    var i;
    for (i = 0; i < gray.length; i++) out[i] = gray[i] <= limit ? 1 : 0;
    return { width: image.width, height: image.height, data: out, threshold: limit };
  }
  function darkBounds(binary) {
    var x, y, idx, minX = binary.width, minY = binary.height, maxX = -1, maxY = -1;
    for (y = 0; y < binary.height; y++) {
      for (x = 0; x < binary.width; x++) {
        idx = y * binary.width + x;
        if (!binary.data[idx]) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }
  function readPixel(binary, x, y) {
    x = clamp(Math.round(x), 0, binary.width - 1);
    y = clamp(Math.round(y), 0, binary.height - 1);
    return binary.data[y * binary.width + x] ? 1 : 0;
  }
  function sampleRegion(binary, x, y, w, h) {
    var maxX = x + w;
    var maxY = y + h;
    var px, py, total = 0, dark = 0;
    for (py = y; py < maxY; py++) {
      for (px = x; px < maxX; px++) {
        total++;
        dark += readPixel(binary, px, py);
      }
    }
    return total ? dark / total : 0;
  }
  function sampleGridCell(binary, quad, gridSize, gx, gy) {
    var u = (gx + 0.5) / gridSize;
    var v = (gy + 0.5) / gridSize;
    var x = quad.tl.x * (1 - u) * (1 - v) + quad.tr.x * u * (1 - v) + quad.br.x * u * v + quad.bl.x * (1 - u) * v;
    var y = quad.tl.y * (1 - u) * (1 - v) + quad.tr.y * u * (1 - v) + quad.br.y * u * v + quad.bl.y * (1 - u) * v;
    return readPixel(binary, x, y);
  }
  function finderScore(binary, quad, gridSize, startX, startY) {
    var score = 0;
    var x, y, want, got;
    for (y = 0; y < 7; y++) {
      for (x = 0; x < 7; x++) {
        want = finderPattern[y][x];
        got = sampleGridCell(binary, quad, gridSize, startX + x, startY + y);
        score += Math.abs(want - got);
      }
    }
    return score;
  }
  function qrReserved(size, x, y) {
    if (x < 8 && y < 8) return true;
    if (x >= size - 8 && y < 8) return true;
    if (x < 8 && y >= size - 8) return true;
    if (x === 6 || y === 6) return true;
    return false;
  }
  function bytesToBits(bytes) {
    var bits = [];
    var i, bit;
    for (i = 0; i < bytes.length; i++) {
      for (bit = 7; bit >= 0; bit--) bits.push((bytes[i] >> bit) & 1);
    }
    return bits;
  }
  function bitsToBytes(bits) {
    var out = [];
    var i, bit, value;
    for (i = 0; i < bits.length; i += 8) {
      value = 0;
      for (bit = 0; bit < 8; bit++) value = (value << 1) | (bits[i + bit] ? 1 : 0);
      out.push(value);
    }
    return out;
  }
  function checksum(bytes) {
    var i, sum = 0;
    for (i = 0; i < bytes.length; i++) sum = (sum + bytes[i]) & 255;
    return sum;
  }
  function asciiFromBytes(bytes) {
    var i, out = '';
    for (i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    return out;
  }
  function normalizeImage(source) {
    if (isImageDataLike(source)) return Promise.resolve(source);
    if (source && (source.tagName || source.nodeName)) return Promise.resolve(fromImage(source));
    if (typeof Blob !== 'undefined' && source instanceof Blob) return fromBlob(source);
    return Promise.reject(new Error('Unsupported image source'));
  }
  function stopTracks(stream) {
    toArray(stream && stream.getTracks && stream.getTracks()).forEach(function (track) {
      try { track && track.stop && track.stop(); } catch (_) {}
    });
  }
  function stopVideo(video) {
    try { video && video.pause && video.pause(); } catch (_) {}
    try { if (video) video.srcObject = null; } catch (_) {}
  }
  function createVideo(stream) {
    var d = doc();
    var video = d && d.createElement ? d.createElement('video') : null;
    if (!video) return Promise.reject(new Error('document is not available'));
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream || null;
    return Promise.resolve(video.play && video.play()).catch(function () {}).then(function () { return video; });
  }
  function mediaDevices() {
    return (g.navigator && g.navigator.mediaDevices) || {};
  }
  function videoConstraints(opts) {
    var out = {};
    if (opts && opts.width != null) out.width = opts.width;
    if (opts && opts.height != null) out.height = opts.height;
    if (opts && opts.facing) out.facingMode = opts.facing;
    return Object.keys(out).length ? out : true;
  }
  function frameFromElement(el, width, height) {
    var w = width || el.videoWidth || el.naturalWidth || el.width || el.clientWidth || 1;
    var h = height || el.videoHeight || el.naturalHeight || el.height || el.clientHeight || 1;
    var canvas = createCanvas(w, h);
    var ctx;
    if (!canvas) return makeImageData(w, h);
    ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return makeImageData(w, h);
    try { ctx.drawImage(el, 0, 0, w, h); } catch (_) {}
    try {
      if (ctx.getImageData) return ctx.getImageData(0, 0, w, h);
    } catch (_) {}
    return makeImageData(w, h);
  }
  function pushHistory(result, mapped) {
    var entry;
    if (!result || result.value == null) return null;
    entry = {
      timestamp: now(),
      type: result.type || result.format || 'scan',
      value: String(result.value),
      mapped: mapped || null
    };
    historyStore.push(entry);
    while (historyStore.length > maxHistory) historyStore.shift();
    scanListeners.slice().forEach(function (fn) {
      try { fn(copy(entry)); } catch (_) {}
    });
    return entry;
  }
  function annotateHistory(result, mapped) {
    var i;
    if (!result || result.value == null || !mapped) return;
    for (i = historyStore.length - 1; i >= 0; i--) {
      if (historyStore[i].value === String(result.value)) {
        historyStore[i].mapped = mapped;
        return;
      }
    }
    pushHistory(result, mapped);
  }
  function beep() {
    var AC = g.AudioContext || g.webkitAudioContext;
    var ctx, osc, gain;
    if (!AC) return false;
    try {
      ctx = new AC();
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
      if (ctx.close) setTimeout(function () { try { ctx.close(); } catch (_) {} }, 120);
      return true;
    } catch (_) {
      return false;
    }
  }
  function nearestPattern(widths, expectDigits) {
    var best = null;
    var bestDistance = Infinity;
    var pattern, i, j, distance;
    for (i = 0; i < code128Patterns.length; i++) {
      pattern = code128Patterns[i];
      if (pattern.length !== expectDigits) continue;
      distance = 0;
      for (j = 0; j < pattern.length; j++) distance += Math.abs((+pattern.charAt(j)) - widths[j]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { code: i, pattern: pattern, distance: distance };
      }
    }
    return best;
  }
  function decodeCode128Runs(runs) {
    var unit = Infinity;
    var widths = [];
    var pos = 0;
    var symbols = [];
    var i, j, chunk, best, stopFound = false, checksumValue, checksumCalc, text = '', set = 'B';
    for (i = 0; i < runs.length; i++) if (runs[i] > 0 && runs[i] < unit) unit = runs[i];
    if (!isFinite(unit) || unit <= 0) return null;
    for (i = 0; i < runs.length; i++) widths.push(Math.max(1, Math.round(runs[i] / unit)));
    while (pos < widths.length) {
      if (pos + 7 <= widths.length && widths.length - (pos + 7) <= 2) {
        chunk = widths.slice(pos, pos + 7);
        best = nearestPattern(chunk, 7);
        if (best && best.code === 106 && best.distance <= 2) {
          symbols.push(best.code);
          pos += 7;
          stopFound = true;
          break;
        }
      }
      if (pos + 6 > widths.length) break;
      chunk = widths.slice(pos, pos + 6);
      best = nearestPattern(chunk, 6);
      if (!best || best.distance > 2) return null;
      symbols.push(best.code);
      pos += 6;
    }
    if (!stopFound || symbols.length < 4) return null;
    if (symbols[0] !== 104 && symbols[0] !== 103 && symbols[0] !== 105) return null;
    checksumValue = symbols[symbols.length - 2];
    checksumCalc = symbols[0];
    for (i = 1; i < symbols.length - 2; i++) checksumCalc += symbols[i] * i;
    checksumCalc = checksumCalc % 103;
    if (checksumCalc !== checksumValue) return null;
    if (symbols[0] === 105) set = 'C';
    else if (symbols[0] === 103) set = 'A';
    for (i = 1; i < symbols.length - 2; i++) {
      if (set === 'B') text += String.fromCharCode(symbols[i] + 32);
      else if (set === 'A') text += String.fromCharCode(symbols[i] < 64 ? symbols[i] + 32 : symbols[i] - 64);
      else if (set === 'C') {
        j = symbols[i];
        text += (j < 10 ? '0' : '') + String(j);
      }
    }
    return { value: text, format: 'code128' };
  }
  function inferBounds(binary) {
    var bounds = darkBounds(binary);
    return bounds || { x: 0, y: 0, w: binary.width, h: binary.height };
  }
  function matchTemplate(sample, allowed) {
    var chars = Object.keys(ocrFont).filter(function (ch) {
      if (!allowed) return true;
      if (allowed === 'numeric') return /[0-9]/.test(ch);
      if (allowed === 'alphanumeric') return /[0-9A-Z]/.test(ch);
      return true;
    });
    var best = { text: '', diff: Infinity, confidence: 0 };
    var ch, glyph, y, x, diff;
    for (x = 0; x < chars.length; x++) {
      ch = chars[x];
      glyph = ocrFont[ch];
      diff = 0;
      for (y = 0; y < 7; y++) diff += hamming(sample[y], glyph[y]);
      if (diff < best.diff) best = { text: ch, diff: diff, confidence: 1 - diff / 35 };
    }
    return best;
  }
  function hamming(a, b) {
    var i, diff = 0;
    for (i = 0; i < Math.max(a.length, b.length); i++) if ((a.charAt(i) || '0') !== (b.charAt(i) || '0')) diff++;
    return diff;
  }
  function normalizeGlyph(binary, bounds) {
    var x, y, cellW = bounds.w / 5, cellH = bounds.h / 7;
    var out = [];
    for (y = 0; y < 7; y++) {
      var row = '';
      for (x = 0; x < 5; x++) row += sampleRegion(binary, bounds.x + x * cellW, bounds.y + y * cellH, cellW, cellH) >= 0.5 ? '1' : '0';
      out.push(row);
    }
    return out;
  }
  function splitSegments(binary, start, end, axis) {
    var segments = [];
    var pos, filled, began = null, i;
    for (pos = start; pos <= end; pos++) {
      filled = 0;
      if (axis === 'x') {
        for (i = 0; i < binary.height; i++) filled += readPixel(binary, pos, i);
      } else {
        for (i = 0; i < binary.width; i++) filled += readPixel(binary, i, pos);
      }
      if (filled && began == null) began = pos;
      if (!filled && began != null) {
        segments.push({ start: began, end: pos - 1 });
        began = null;
      }
    }
    if (began != null) segments.push({ start: began, end: end });
    return segments;
  }
  function parseKV(raw, delimiter) {
    var out = {};
    var tokens = String(raw || '').split(delimiter || /[|&;\n]+/);
    var i, parts, key;
    for (i = 0; i < tokens.length; i++) {
      parts = tokens[i].split('=');
      if (!parts[0]) continue;
      key = parts.shift().trim();
      out[key] = parts.join('=').trim();
    }
    return out;
  }
  function parseDelimited(raw, delimiter) {
    return String(raw || '').split(delimiter || '|').map(function (item) { return item.trim(); });
  }
  function guessFormat(raw, opts) {
    if (opts && opts.format) return opts.format;
    if (typeof raw !== 'string') return 'object';
    if (/^\s*[{[]/.test(raw)) return 'json';
    if (/=/.test(raw)) return 'kv';
    if ((opts && opts.delimiter) || /[|,;\t]/.test(raw)) return 'delimited';
    return 'positional';
  }
  function normalizeSchema(schema) {
    var out = [];
    var keys, i, key, rule;
    if (schema && Array.isArray(schema.fields)) return normalizeSchema(schema.fields);
    if (Array.isArray(schema)) {
      for (i = 0; i < schema.length; i++) {
        rule = schema[i];
        if (typeof rule === 'string') out.push({ field: rule, index: i });
        else if (rule) out.push(copy(rule, { field: rule.field || rule.name || String(i), index: rule.index != null ? rule.index : i }));
      }
      return out;
    }
    keys = Object.keys(schema || {});
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (key === 'mapOptions' || key === 'format' || key === 'delimiter' || key === 'rules' || key === 'fields') continue;
      rule = schema[key];
      if (rule && typeof rule === 'object' && !Array.isArray(rule)) out.push(copy(rule, { field: key }));
      else out.push({ field: key, type: rule });
    }
    return out;
  }
  function coerce(value, rule) {
    if (value == null) return value;
    if (rule && isFn(rule.transform)) value = rule.transform(value, rule);
    if (!rule || value == null) return value;
    if (rule.type === 'number' || rule.type === 'integer') {
      var num = Number(value);
      return isFinite(num) ? (rule.type === 'integer' ? Math.round(num) : num) : value;
    }
    if (rule.type === 'boolean') {
      if (value === true || value === false) return value;
      return /^(true|1|yes|y)$/i.test(String(value));
    }
    if (rule.type === 'date') {
      var dt = new Date(value);
      return isNaN(dt.getTime()) ? value : dt;
    }
    return value;
  }
  function validateRule(value, rule, field, root, errors) {
    var pattern, num;
    if (!rule) return;
    if (rule.required && (value == null || value === '')) errors.push({ field: field, code: 'required', message: 'Field is required' });
    if (value == null || value === '') return;
    if (rule.type === 'number' || rule.type === 'integer') {
      if (typeof value !== 'number' || !isFinite(value)) errors.push({ field: field, code: 'type', message: 'Expected number' });
    }
    if (rule.type === 'boolean' && typeof value !== 'boolean') errors.push({ field: field, code: 'type', message: 'Expected boolean' });
    if (rule.min != null && typeof value === 'number' && value < rule.min) errors.push({ field: field, code: 'min', message: 'Must be at least ' + rule.min });
    if (rule.max != null && typeof value === 'number' && value > rule.max) errors.push({ field: field, code: 'max', message: 'Must be at most ' + rule.max });
    if (rule.minLength != null && String(value).length < rule.minLength) errors.push({ field: field, code: 'minLength', message: 'Too short' });
    if (rule.maxLength != null && String(value).length > rule.maxLength) errors.push({ field: field, code: 'maxLength', message: 'Too long' });
    if (rule.pattern != null) {
      pattern = rule.pattern instanceof RegExp ? new RegExp(rule.pattern.source, rule.pattern.flags.replace(/g/g, '')) : new RegExp(rule.pattern);
      if (!pattern.test(String(value))) errors.push({ field: field, code: 'pattern', message: 'Invalid format' });
    }
    if (Array.isArray(rule.enum) && rule.enum.indexOf(value) === -1) errors.push({ field: field, code: 'enum', message: 'Unexpected value' });
    if (isFn(rule.custom)) {
      num = rule.custom(value, root, field, rule);
      if (typeof num === 'string' && num) errors.push({ field: field, code: 'custom', message: num });
    }
  }
  function ensureDecodeShape(name, result) {
    if (!result) return null;
    return {
      type: result.type || result.format || name,
      value: result.value,
      raw: result.raw != null ? result.raw : result.value,
      confidence: result.confidence != null ? result.confidence : 0.9,
      bounds: result.bounds || null,
      version: result.version,
      ecLevel: result.ecLevel,
      format: result.format || name
    };
  }

  function fromImage(imgEl) {
    if (isImageDataLike(imgEl)) return imgEl;
    if (!imgEl) return makeImageData(1, 1);
    return frameFromElement(imgEl);
  }

  function fromBlob(blob) {
    if (!blob) return Promise.reject(new Error('Blob is required'));
    if (blob.__imageData && isImageDataLike(blob.__imageData)) return Promise.resolve(blob.__imageData);
    if (g.createImageBitmap) {
      return Promise.resolve(g.createImageBitmap(blob)).then(function (bitmap) {
        return fromImage(bitmap);
      });
    }
    return new Promise(function (resolve, reject) {
      var d = doc();
      var ImageCtor = g.Image;
      var image;
      var url;
      if (!d || !ImageCtor || !g.URL || !g.URL.createObjectURL) return reject(new Error('Image loading is not supported'));
      image = new ImageCtor();
      image.onload = function () {
        try { resolve(fromImage(image)); }
        catch (err) { reject(err); }
        finally {
          try { g.URL.revokeObjectURL(url); } catch (_) {}
        }
      };
      image.onerror = function () {
        try { g.URL.revokeObjectURL(url); } catch (_) {}
        reject(new Error('Failed to load image blob'));
      };
      url = g.URL.createObjectURL(blob);
      image.src = url;
    });
  }

  function captureCamera(opts) {
    var devices = mediaDevices();
    if (!devices.getUserMedia) return Promise.reject(new Error('getUserMedia is not available'));
    return devices.getUserMedia({ video: videoConstraints(opts || {}), audio: false }).then(function (stream) {
      return createVideo(stream).then(function (video) {
        var image = frameFromElement(video, opts && opts.width, opts && opts.height);
        var metadata = {
          width: image.width,
          height: image.height,
          timestamp: now(),
          source: 'camera'
        };
        stopVideo(video);
        stopTracks(stream);
        return { image: image, metadata: metadata };
      }, function (err) {
        stopTracks(stream);
        throw err;
      });
    });
  }

  function captureFile(opts) {
    var d = doc();
    var file = opts && opts.file;
    if (file) {
      return fromBlob(file).then(function (image) {
        return { image: image, metadata: { width: image.width, height: image.height, timestamp: now(), source: 'file' } };
      });
    }
    if (!d || !d.createElement) return Promise.reject(new Error('document is not available'));
    return new Promise(function (resolve, reject) {
      var input = d.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.onchange = function () {
        var chosen = input.files && input.files[0];
        if (!chosen) return reject(new Error('No file selected'));
        fromBlob(chosen).then(function (image) {
          resolve({ image: image, metadata: { width: image.width, height: image.height, timestamp: now(), source: 'file' } });
        }, reject);
      };
      if (d.body && d.body.appendChild) d.body.appendChild(input);
      try { input.click(); } catch (err) { reject(err); }
    });
  }

  function captureClipboard() {
    var clipboard = g.navigator && g.navigator.clipboard;
    if (!clipboard || !clipboard.read) return Promise.reject(new Error('Clipboard image read is not available'));
    return clipboard.read().then(function (items) {
      var i, j, type, getter;
      for (i = 0; i < items.length; i++) {
        for (j = 0; j < items[i].types.length; j++) {
          type = items[i].types[j];
          if (type.indexOf('image/') === 0 && items[i].getType) {
            getter = items[i].getType(type);
            return Promise.resolve(getter).then(function (blob) {
              return fromBlob(blob).then(function (image) {
                return { image: image, metadata: { width: image.width, height: image.height, timestamp: now(), source: 'clipboard' } };
              });
            });
          }
        }
      }
      throw new Error('Clipboard does not contain an image');
    });
  }

  function capture(opts) {
    var o = opts || {};
    if (o.source === 'file') return captureFile(o);
    if (o.source === 'clipboard') return captureClipboard(o);
    return captureCamera(o);
  }

  function stream(opts) {
    var o = opts || {};
    var devices = mediaDevices();
    var state = { stopped: false, callbacks: [], lastFrame: null, lastTick: 0, rafId: 0, overlayCanvas: null, stream: null };
    function makeFrame() {
      try {
        state.lastFrame = frameFromElement(state.video, o.width, o.height);
      } catch (_) {
        state.lastFrame = makeImageData(o.width || 1, o.height || 1);
      }
      return state.lastFrame;
    }
    function loop(ts) {
      var frame;
      if (state.stopped) return;
      if (!o.fps || !state.lastTick || ts - state.lastTick >= 1000 / o.fps) {
        state.lastTick = ts || now();
        frame = makeFrame();
        state.callbacks.slice().forEach(function (cb) {
          try { cb(frame); } catch (_) {}
        });
      }
      state.rafId = raf(loop);
    }
    if (!devices.getUserMedia) throw new Error('getUserMedia is not available');
    state.video = doc() && doc().createElement ? doc().createElement('video') : null;
    if (!state.video) throw new Error('document is not available');
    state.video.autoplay = true;
    state.video.playsInline = true;
    state.video.muted = true;
    devices.getUserMedia({ video: videoConstraints(o), audio: false }).then(function (mediaStream) {
      state.stream = mediaStream;
      state.video.srcObject = mediaStream;
      Promise.resolve(state.video.play && state.video.play()).catch(noop);
      if (o.overlay) state.overlayCanvas = overlay(state.video, null, { color: '#00ff88', lineWidth: 2, label: '' });
      state.rafId = raf(loop);
    }, function () {
      state.stopped = true;
    });
    return {
      video: state.video,
      onFrame: function (cb) {
        if (isFn(cb)) state.callbacks.push(cb);
        return function () {
          var i = state.callbacks.indexOf(cb);
          if (i >= 0) state.callbacks.splice(i, 1);
        };
      },
      stop: function () {
        state.stopped = true;
        caf(state.rafId);
        stopVideo(state.video);
        stopTracks(state.stream);
        if (state.overlayCanvas && state.overlayCanvas.parentNode) state.overlayCanvas.parentNode.removeChild(state.overlayCanvas);
      },
      getFrame: function () {
        return state.lastFrame || makeFrame();
      }
    };
  }

  function decodeQR(imageData) {
    return normalizeImage(imageData).then(function (image) {
      var binary = binarize(image);
      var bounds = darkBounds(binary);
      var candidates = [];
      var size, quad, score, best, matrix, x, y, bits = [], packed = [], rawBytes, length, sum, payload, errors = 0, triplets = 0;
      if (!bounds) return null;
      for (size = 21; size <= 41; size += 4) {
        quad = {
          tl: { x: bounds.x, y: bounds.y },
          tr: { x: bounds.x + bounds.w - 1, y: bounds.y },
          br: { x: bounds.x + bounds.w - 1, y: bounds.y + bounds.h - 1 },
          bl: { x: bounds.x, y: bounds.y + bounds.h - 1 }
        };
        score = finderScore(binary, quad, size, 0, 0) + finderScore(binary, quad, size, size - 7, 0) + finderScore(binary, quad, size, 0, size - 7);
        candidates.push({ size: size, quad: quad, score: score });
      }
      candidates.sort(function (a, b) { return a.score - b.score; });
      best = candidates[0];
      if (!best || best.score > 40) return null;
      matrix = [];
      for (y = 0; y < best.size; y++) {
        var row = [];
        for (x = 0; x < best.size; x++) row.push(sampleGridCell(binary, best.quad, best.size, x, y));
        matrix.push(row);
      }
      for (y = 0; y < best.size; y++) {
        for (x = 0; x < best.size; x++) {
          if (qrReserved(best.size, x, y)) continue;
          bits.push(matrix[y][x] ? 1 : 0);
        }
      }
      for (x = 0; x + 2 < bits.length; x += 3) {
        packed.push((bits[x] + bits[x + 1] + bits[x + 2]) >= 2 ? 1 : 0);
        triplets++;
        if (!(bits[x] === bits[x + 1] && bits[x + 1] === bits[x + 2])) errors++;
      }
      rawBytes = bitsToBytes(packed);
      length = rawBytes[0] || 0;
      sum = rawBytes[1] || 0;
      payload = rawBytes.slice(2, 2 + length);
      if (!length || payload.length !== length) return null;
      if (checksum(payload) !== sum) return null;
      return {
        type: 'qr',
        value: asciiFromBytes(payload),
        raw: payload,
        version: 1,
        ecLevel: 'R3',
        confidence: clamp(1 - (errors / Math.max(1, triplets)), 0, 1),
        bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h }
      };
    });
  }

  function decodeBarcode(imageData, format) {
    return normalizeImage(imageData).then(function (image) {
      var binary = binarize(image);
      var bounds = inferBounds(binary);
      var y = clamp(Math.round(bounds.y + bounds.h / 2), 0, binary.height - 1);
      var x;
      var inBar = false;
      var started = false;
      var current = 0;
      var runs = [];
      var decoded;
      for (x = 0; x < binary.width; x++) {
        var dark = readPixel(binary, x, y);
        if (!started) {
          if (!dark) continue;
          started = true;
          inBar = true;
          current = 1;
          continue;
        }
        if ((dark ? 1 : 0) === (inBar ? 1 : 0)) current++;
        else {
          runs.push(current);
          current = 1;
          inBar = !inBar;
        }
      }
      if (current) runs.push(current);
      decoded = decodeCode128Runs(runs);
      if (!decoded || (format && format !== 'code128')) return null;
      decoded.bounds = { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
      decoded.type = decoded.format;
      decoded.raw = decoded.value;
      decoded.confidence = 0.95;
      return decoded;
    });
  }

  function decode(imageData, opts) {
    var o = opts || {};
    var names = o.formats && o.formats.length ? o.formats.slice() : ['qr', 'code128', 'ean13', 'upc', 'datamatrix'];
    var results = [];
    function runAt(index) {
      var name = names[index];
      var decoder = decoderRegistry[name];
      if (!decoder) return Promise.resolve(null);
      return Promise.resolve(decoder(imageData, o)).then(function (result) {
        var shaped = ensureDecodeShape(name, result);
        if (shaped) results.push(shaped);
        if (o.multiple) return null;
        return shaped || (index + 1 < names.length ? runAt(index + 1) : null);
      });
    }
    return Promise.resolve().then(function () {
      if (!o.multiple) return runAt(0);
      return names.reduce(function (p, name) {
        return p.then(function () {
          var decoder = decoderRegistry[name];
          if (!decoder) return null;
          return Promise.resolve(decoder(imageData, o)).then(function (result) {
            if (Array.isArray(result)) result.forEach(function (item) { item = ensureDecodeShape(name, item); if (item) results.push(item); });
            else {
              result = ensureDecodeShape(name, result);
              if (result) results.push(result);
            }
          });
        });
      }, Promise.resolve()).then(function () { return results; });
    }).then(function (result) {
      if (o.track === false) return result;
      if (Array.isArray(result)) result.forEach(function (item) { pushHistory(item); });
      else if (result) pushHistory(result);
      return result;
    });
  }

  function ocr(imageData, opts) {
    return normalizeImage(imageData).then(function (image) {
      var binary = binarize(image, opts && opts.threshold);
      var rowSegments = splitSegments(binary, 0, binary.height - 1, 'y');
      var lines = [];
      var words = [];
      var li, cols, ci, bounds, glyph, text = '', lineText, gap, prevEnd, currentWord, currentStart, subBinary;
      for (li = 0; li < rowSegments.length; li++) {
        subBinary = {
          width: binary.width,
          height: rowSegments[li].end - rowSegments[li].start + 1,
          data: (function () {
            var out = new Uint8Array(binary.width * (rowSegments[li].end - rowSegments[li].start + 1));
            var x, y, idx = 0;
            for (y = rowSegments[li].start; y <= rowSegments[li].end; y++) {
              for (x = 0; x < binary.width; x++) out[idx++] = readPixel(binary, x, y);
            }
            return out;
          })()
        };
        cols = splitSegments(subBinary, 0, binary.width - 1, 'x');
        lineText = '';
        prevEnd = null;
        currentWord = '';
        currentStart = null;
        for (ci = 0; ci < cols.length; ci++) {
          bounds = { x: cols[ci].start, y: rowSegments[li].start, w: cols[ci].end - cols[ci].start + 1, h: rowSegments[li].end - rowSegments[li].start + 1 };
          glyph = matchTemplate(normalizeGlyph(binary, bounds), opts && opts.charset);
          if (prevEnd != null) {
            gap = cols[ci].start - prevEnd - 1;
            if (gap > Math.max(1, Math.round(bounds.w * 0.8))) {
              if (currentWord) words.push({ text: currentWord, bounds: { x: currentStart, y: rowSegments[li].start, w: prevEnd - currentStart + 1, h: bounds.h }, confidence: 0.9 });
              lineText += ' ';
              currentWord = '';
              currentStart = null;
            }
          }
          if (currentStart == null) currentStart = cols[ci].start;
          lineText += glyph.text;
          currentWord += glyph.text;
          prevEnd = cols[ci].end;
        }
        if (lineText) {
          if (currentWord) words.push({ text: currentWord, bounds: { x: currentStart, y: rowSegments[li].start, w: prevEnd - currentStart + 1, h: rowSegments[li].end - rowSegments[li].start + 1 }, confidence: 0.9 });
          lines.push({ text: lineText, bounds: { x: 0, y: rowSegments[li].start, w: binary.width, h: rowSegments[li].end - rowSegments[li].start + 1 }, confidence: 0.9 });
          text += (text ? '\n' : '') + lineText;
        }
      }
      return { text: text, words: words, lines: lines, threshold: binary.threshold };
    });
  }

  function map(schema, decoded, opts) {
    var o = opts || {};
    var raw = decoded && decoded.value != null ? decoded.value : decoded;
    var parsed = raw;
    var fields = normalizeSchema(schema);
    var format = guessFormat(raw, o);
    var out = {};
    var i, rule, value, rules, match, keyList;
    if (format === 'json' && typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch (_) { parsed = {}; }
    } else if (format === 'kv') parsed = parseKV(raw, o.delimiter);
    else if (format === 'delimited') parsed = parseDelimited(raw, o.delimiter);
    else if (format === 'positional') parsed = typeof raw === 'string' ? parseDelimited(raw, o.delimiter || /\s+/) : raw;
    if (Array.isArray(parsed)) {
      for (i = 0; i < fields.length; i++) {
        rule = fields[i];
        value = parsed[rule.index != null ? rule.index : i];
        out[rule.field] = coerce(value, rule);
      }
    } else if (parsed && typeof parsed === 'object') {
      keyList = Object.keys(parsed);
      for (i = 0; i < fields.length; i++) {
        rule = fields[i];
        value = parsed[rule.key || rule.field];
        if (value == null && rule.index != null) value = parsed[keyList[rule.index]];
        out[rule.field] = coerce(value, rule);
      }
    } else {
      for (i = 0; i < fields.length; i++) {
        rule = fields[i];
        out[rule.field] = coerce(raw, rule);
      }
    }
    rules = o.rules || [];
    for (i = 0; i < rules.length; i++) {
      match = (rules[i].pattern instanceof RegExp ? rules[i].pattern : new RegExp(rules[i].pattern)).exec(String(raw || ''));
      if (!match) continue;
      value = match[1] != null ? match[1] : match[0];
      out[rules[i].field] = isFn(rules[i].transform) ? rules[i].transform(value, decoded, match) : value;
    }
    return out;
  }

  function validate(decoded, schema) {
    var mapped = map(schema, decoded, schema && schema.mapOptions ? schema.mapOptions : {});
    var rules = normalizeSchema(schema);
    var errors = [];
    var i;
    for (i = 0; i < rules.length; i++) validateRule(mapped[rules[i].field], rules[i], rules[i].field, mapped, errors);
    annotateHistory(decoded && decoded.value != null ? decoded : { value: JSON.stringify(mapped), type: 'mapped' }, mapped);
    return { valid: !errors.length, errors: errors, mapped: mapped };
  }

  function continuous(opts, callback) {
    var o = copy(opts, {});
    var lastSeen = {};
    var scanStream = api.stream(o);
    var active = true;
    var pending = false;
    function seenRecently(key) {
      var ts = lastSeen[key];
      if (!ts) return false;
      return now() - ts < (o.cooldown == null ? 2000 : o.cooldown);
    }
    scanStream.onFrame(function (frame) {
      if (!active || pending) return;
      pending = true;
      Promise.resolve(api.decode(frame, { formats: o.formats, track: false })).then(function (result) {
        var item = Array.isArray(result) ? result[0] : result;
        if (!item || item.value == null) return;
        if (seenRecently(item.type + ':' + item.value)) return;
        lastSeen[item.type + ':' + item.value] = now();
        if (o.highlight && item.bounds) overlay(scanStream.video, item.bounds, { label: item.type, color: '#00ff88', lineWidth: 2 });
        if (o.beep) beep();
        pushHistory(item);
        if (isFn(callback)) callback(item);
      }).finally(function () {
        pending = false;
      });
    });
    return {
      stop: function () {
        active = false;
        scanStream.stop();
      }
    };
  }

  function overlay(videoEl, bounds, opts) {
    var d = doc();
    var o = opts || {};
    var canvas = videoEl && videoEl.__bareMetalScanOverlay;
    var ctx;
    var rect = bounds || { x: 10, y: 10, w: Math.max(20, (videoEl && (videoEl.videoWidth || videoEl.clientWidth || 100) * 0.5) || 80), h: Math.max(20, (videoEl && (videoEl.videoHeight || videoEl.clientHeight || 100) * 0.5) || 80) };
    if (!d || !videoEl) return null;
    if (!canvas) {
      canvas = d.createElement('canvas');
      canvas.width = videoEl.videoWidth || videoEl.clientWidth || 320;
      canvas.height = videoEl.videoHeight || videoEl.clientHeight || 240;
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.pointerEvents = 'none';
      if (videoEl.parentNode) videoEl.parentNode.appendChild(canvas);
      videoEl.__bareMetalScanOverlay = canvas;
    }
    ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = o.color || '#00ff88';
    ctx.lineWidth = o.lineWidth || 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (o.label) {
      ctx.fillStyle = o.color || '#00ff88';
      ctx.font = '12px sans-serif';
      try { ctx.fillText(o.label, rect.x, Math.max(10, rect.y - 4)); } catch (_) {}
    }
    return canvas;
  }

  function history() {
    return historyStore.map(function (item) { return copy(item); });
  }

  function clearHistory() {
    historyStore.length = 0;
  }

  function onScan(callback) {
    if (!isFn(callback)) return noop;
    scanListeners.push(callback);
    return function () {
      var index = scanListeners.indexOf(callback);
      if (index >= 0) scanListeners.splice(index, 1);
    };
  }

  function registerFormat(name, decodeFn) {
    if (typeof name !== 'string' || !name || !isFn(decodeFn)) return formatsApi;
    decoderRegistry[name] = decodeFn;
    return formatsApi;
  }

  var formatsApi = {
    register: registerFormat,
    list: function () { return Object.keys(decoderRegistry).sort(); }
  };

  registerFormat('qr', function (imageData) { return decodeQR(imageData); });
  registerFormat('code128', function (imageData) { return decodeBarcode(imageData, 'code128'); });
  registerFormat('ean13', function () { return null; });
  registerFormat('upc', function () { return null; });
  registerFormat('datamatrix', function () { return null; });

  var api = {
    capture: capture,
    stream: stream,
    decode: decode,
    decodeQR: decodeQR,
    decodeBarcode: decodeBarcode,
    ocr: ocr,
    map: map,
    validate: validate,
    continuous: continuous,
    overlay: overlay,
    history: history,
    clearHistory: clearHistory,
    onScan: onScan,
    fromImage: fromImage,
    fromBlob: fromBlob,
    formats: formatsApi
  };

  return api;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Scan;
