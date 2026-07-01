/* istanbul ignore next */
var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.Print = (function () {
  'use strict';

  var CODE128_PATTERNS = [
    [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],[1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
    [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],[1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
    [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],[3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
    [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],[1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
    [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],[1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
    [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],[3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
    [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],[1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
    [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],[2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
    [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],[1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
    [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],[1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
    [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],[2,1,1,2,3,2],[2,3,3,1,1,1,2]
  ];
  var EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  var EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  var EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  var EAN_PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  var QR_ALIGNMENT = {
    1: [6], 2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30], 6: [6,34], 7: [6,22,38], 8: [6,24,42], 9: [6,26,46], 10: [6,28,50]
  };

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function isArray(value) { return Array.isArray(value); }
  function isObject(value) { return !!value && Object.prototype.toString.call(value) === '[object Object]'; }
  function isDate(value) { return value instanceof Date && !isNaN(value.getTime()); }
  function clone(value) {
    var out, key, i;
    if (!value || typeof value !== 'object') return value;
    if (isDate(value)) return new Date(value.getTime());
    if (isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(clone(value[i]));
      return out;
    }
    out = {};
    for (key in value) if (own(value, key)) out[key] = clone(value[key]);
    return out;
  }
  function merge(a, b) {
    var out = clone(a) || {};
    var key;
    for (key in (b || {})) if (own(b, key)) out[key] = clone(b[key]);
    return out;
  }
  function list(value) { return isArray(value) ? value.slice() : (value == null ? [] : [value]); }
  function repeat(ch, count) {
    var out = '';
    while (count-- > 0) out += ch;
    return out;
  }
  function padLeft(text, width, ch) {
    text = String(text == null ? '' : text);
    return text.length >= width ? text : repeat(ch || ' ', width - text.length) + text;
  }
  function padRight(text, width, ch) {
    text = String(text == null ? '' : text);
    return text.length >= width ? text : text + repeat(ch || ' ', width - text.length);
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function attr(value) { return escapeHtml(value); }
  function labelize(key) {
    return String(key == null ? '' : key)
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^./, function (m) { return m.toUpperCase(); })
      .trim();
  }
  function cssUnit(value, fallback) {
    if (value == null || value === '') return fallback || '0';
    return typeof value === 'number' ? value + 'px' : String(value);
  }
  function numberValue(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : (fallback == null ? 0 : fallback);
  }
  function formatCurrency(value, currency, locale) {
    var amount = numberValue(value, 0);
    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      try { return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: currency || 'USD' }).format(amount); }
      catch (_) {}
    }
    return (currency || 'USD') + ' ' + amount.toFixed(2);
  }
  function stripTags(html) {
    var text = String(html == null ? '' : html)
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
    return text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function utf8Bytes(text) {
    var i, out, encoded, part;
    text = String(text == null ? '' : text);
    if (typeof TextEncoder !== 'undefined') return Array.prototype.slice.call(new TextEncoder().encode(text));
    encoded = unescape(encodeURIComponent(text));
    out = [];
    for (i = 0; i < encoded.length; i++) out.push(encoded.charCodeAt(i));
    return out;
  }
  function block(kind, html, height, attrs) {
    var key;
    var attrText = '';
    var size = Math.max(1, Math.round(numberValue(height, 24)));
    for (key in (attrs || {})) if (own(attrs, key) && attrs[key] != null) attrText += ' ' + key + '="' + attr(attrs[key]) + '"';
    return '<!--bm:block:' + kind + ':' + size + '--><div class="bm-print-block bm-print-' + kind + '" data-bm-kind="' + attr(kind) + '" data-bm-height="' + size + '"' + attrText + '>' + html + '</div><!--/bm:block-->';
  }
  function renderAny(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return escapeHtml(value);
    if (isArray(value)) return value.map(renderAny).join('');
    if (isObject(value) && typeof value.html === 'string') return value.html;
    return escapeHtml(String(value));
  }
  function extractFields(schema) {
    if (!schema) return {};
    if (schema.type === 'object' && isObject(schema.shape)) return schema.shape;
    if (isObject(schema.fields)) return schema.fields;
    if (isObject(schema.shape)) return schema.shape;
    return isObject(schema) ? schema : {};
  }
  function normalizeField(name, spec) {
    var out;
    if (spec === true) out = { required: true };
    else if (typeof spec === 'string') out = { type: spec };
    else if (typeof spec === 'function') out = { type: spec.name || 'value' };
    else out = isObject(spec) ? clone(spec) : {};
    out.name = name;
    if (!out.label) out.label = labelize(name);
    return out;
  }
  function fieldEntries(schema) {
    var fields = extractFields(schema);
    return Object.keys(fields).map(function (key) { return { key: key, spec: normalizeField(key, fields[key]) }; });
  }
  function inferSchemaFromRows(rows) {
    var fields = {};
    var source = rows && rows.length ? rows[0] : {};
    Object.keys(source || {}).forEach(function (key) { fields[key] = { label: labelize(key) }; });
    return { fields: fields };
  }
  function plainText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (isDate(value)) return value.toISOString();
    if (isArray(value)) return value.map(plainText).join(', ');
    if (isObject(value)) return JSON.stringify(value);
    return String(value);
  }
  function formatValueHtml(key, spec, value, opts) {
    var formatters = opts && opts.format;
    var formatter = formatters && formatters[key];
    var nestedKeys, nestedHtml;
    if (typeof formatter === 'function') return String(formatter(value, spec, opts && opts.data));
    if (value == null || value === '') return '<span class="bm-print-empty">—</span>';
    if (spec && (spec.type === 'currency' || spec.format === 'currency' || spec.money)) return escapeHtml(formatCurrency(value, spec.currency || (opts && opts.currency), opts && opts.locale));
    if (spec && spec.type === 'date') {
      try { return escapeHtml(new Date(value).toLocaleDateString()); } catch (_) {}
    }
    if (typeof value === 'boolean') return escapeHtml(value ? 'Yes' : 'No');
    if (isArray(value)) {
      if (value.length && isObject(value[0])) return tableHtml(spec && spec.item ? { fields: extractFields(spec.item) } : inferSchemaFromRows(value), value, { compact: true, bordered: true });
      return escapeHtml(value.map(plainText).join(', '));
    }
    if (isObject(value)) {
      nestedKeys = Object.keys(value);
      nestedHtml = nestedKeys.map(function (childKey) {
        return '<div class="bm-print-subpair"><span class="bm-print-subkey">' + escapeHtml(labelize(childKey)) + '</span><span class="bm-print-subvalue">' + escapeHtml(plainText(value[childKey])) + '</span></div>';
      }).join('');
      return '<div class="bm-print-subpairs">' + nestedHtml + '</div>';
    }
    return escapeHtml(String(value));
  }
  function pairsHtml(entries, data, opts) {
    return entries.map(function (entry) {
      return '<div class="bm-print-pair"><div class="bm-print-label">' + escapeHtml(entry.spec.label || labelize(entry.key)) + '</div><div class="bm-print-value">' + formatValueHtml(entry.key, entry.spec, data ? data[entry.key] : undefined, merge(opts || {}, { data: data })) + '</div></div>';
    }).join('');
  }
  function tableHtml(schema, rows, opts) {
    var cfg = opts || {};
    var items = isArray(rows) ? rows.slice() : [];
    var columns = isArray(schema) ? schema.map(function (entry) {
      return typeof entry === 'string' ? { key: entry, spec: { label: labelize(entry) } } : { key: entry.name || entry.key, spec: normalizeField(entry.name || entry.key, entry) };
    }) : fieldEntries(schema && Object.keys(extractFields(schema)).length ? schema : inferSchemaFromRows(items));
    if (cfg.sortBy) {
      items.sort(function (a, b) {
        var left = plainText(a && a[cfg.sortBy]);
        var right = plainText(b && b[cfg.sortBy]);
        return left < right ? -1 : left > right ? 1 : 0;
      });
    }
    return '<table class="bm-print-table' + (cfg.striped ? ' striped' : '') + (cfg.bordered === false ? '' : ' bordered') + (cfg.compact ? ' compact' : '') + '"><thead><tr>' + columns.map(function (col) {
      return '<th>' + escapeHtml(col.spec.label || labelize(col.key)) + '</th>';
    }).join('') + '</tr></thead><tbody>' + items.map(function (row) {
      return '<tr>' + columns.map(function (col) {
        return '<td>' + formatValueHtml(col.key, col.spec, row ? row[col.key] : undefined, cfg) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
  }
  function gridHtml(items, cols, opts) {
    var cfg = opts || {};
    var count = Math.max(1, parseInt(cols || 2, 10));
    return '<div class="bm-print-grid" style="grid-template-columns:repeat(' + count + ',minmax(0,1fr));gap:' + cssUnit(cfg.gap, '12px') + ';">' + list(items).map(function (item) {
      return '<div class="bm-print-grid-cell"' + (cfg.cellStyle ? ' style="' + attr(cfg.cellStyle) + '"' : '') + '>' + renderAny(item) + '</div>';
    }).join('') + '</div>';
  }
  function columnsHtml(items, opts) {
    var cfg = opts || {};
    var count = Math.max(1, parseInt(cfg.count || cfg.columns || 2, 10));
    return '<div class="bm-print-columns" style="column-count:' + count + ';column-gap:' + cssUnit(cfg.gap, '18px') + ';">' + list(items).map(function (item) {
      return '<div class="bm-print-column-item">' + renderAny(item) + '</div>';
    }).join('') + '</div>';
  }
  function imageHtml(src, opts) {
    var cfg = opts || {};
    return '<figure class="bm-print-image"><img src="' + attr(src || '') + '" alt=""' + (cfg.width ? ' style="width:' + attr(cssUnit(cfg.width)) + ';' + (cfg.height ? 'height:' + attr(cssUnit(cfg.height)) + ';object-fit:contain;' : '') + '"' : (cfg.height ? ' style="height:' + attr(cssUnit(cfg.height)) + ';object-fit:contain;"' : '')) + ' />' + (cfg.caption ? '<figcaption>' + escapeHtml(cfg.caption) + '</figcaption>' : '') + '</figure>';
  }
  function barcodeBitsEan13(value) {
    var digits = String(value == null ? '' : value).replace(/\D/g, '');
    var parity, bits, i, patternSet, digit;
    if (digits.length === 12) digits += eanChecksum(digits);
    if (digits.length !== 13) throw new Error('EAN13 barcode requires 12 or 13 digits');
    parity = EAN_PARITY[parseInt(digits.charAt(0), 10)];
    bits = '101';
    for (i = 1; i <= 6; i++) {
      digit = parseInt(digits.charAt(i), 10);
      patternSet = parity.charAt(i - 1) === 'L' ? EAN_L : EAN_G;
      bits += patternSet[digit];
    }
    bits += '01010';
    for (i = 7; i <= 12; i++) bits += EAN_R[parseInt(digits.charAt(i), 10)];
    bits += '101';
    return { bits: bits, text: digits };
  }
  function upcChecksum(value) {
    var digits = String(value == null ? '' : value).replace(/\D/g, '');
    var i, sum = 0;
    for (i = 0; i < 11; i++) sum += parseInt(digits.charAt(i), 10) * (i % 2 === 0 ? 3 : 1);
    return String((10 - (sum % 10)) % 10);
  }
  function eanChecksum(value) {
    var digits = String(value == null ? '' : value).replace(/\D/g, '');
    var i, sum = 0, weight;
    for (i = digits.length - 1; i >= 0; i--) {
      weight = ((digits.length - i) % 2 === 1) ? 3 : 1;
      sum += parseInt(digits.charAt(i), 10) * weight;
    }
    return String((10 - (sum % 10)) % 10);
  }
  function barcodeBitsUpc(value) {
    var digits = String(value == null ? '' : value).replace(/\D/g, '');
    var bits = '101';
    var i;
    if (digits.length === 11) digits += upcChecksum(digits);
    if (digits.length !== 12) throw new Error('UPC barcode requires 11 or 12 digits');
    for (i = 0; i < 6; i++) bits += EAN_L[parseInt(digits.charAt(i), 10)];
    bits += '01010';
    for (i = 6; i < 12; i++) bits += EAN_R[parseInt(digits.charAt(i), 10)];
    bits += '101';
    return { bits: bits, text: digits };
  }
  function barcodeBitsCode128(value) {
    var text = String(value == null ? '' : value);
    var codes = [104];
    var checksum = 104;
    var i, code, pattern, weight;
    for (i = 0; i < text.length; i++) {
      code = text.charCodeAt(i) - 32;
      if (code < 0 || code > 95) code = 0;
      codes.push(code);
      checksum += code * (i + 1);
    }
    codes.push(checksum % 103);
    codes.push(106);
    pattern = [];
    for (i = 0; i < codes.length; i++) pattern = pattern.concat(CODE128_PATTERNS[codes[i]]);
    return { pattern: pattern, text: text };
  }
  function barcodeSvg(value, opts) {
    var cfg = opts || {};
    var format = String(cfg.format || 'code128').toLowerCase();
    var moduleWidth = Math.max(1, numberValue(cfg.width, format === 'code128' ? 2 : 1));
    var barHeight = Math.max(24, numberValue(cfg.height, 64));
    var showText = cfg.showText !== false;
    var quiet = Math.max(8, numberValue(cfg.quiet, format === 'code128' ? 10 : 7));
    var source, x, i, rects, totalModules, yText, textContent;
    if (format === 'ean13') source = barcodeBitsEan13(value);
    else if (format === 'upc') source = barcodeBitsUpc(value);
    else source = barcodeBitsCode128(value);
    rects = '';
    if (source.bits) {
      totalModules = source.bits.length;
      x = quiet * moduleWidth;
      for (i = 0; i < source.bits.length; i++) {
        if (source.bits.charAt(i) === '1') rects += '<rect x="' + x + '" y="0" width="' + moduleWidth + '" height="' + barHeight + '" />';
        x += moduleWidth;
      }
    } else {
      totalModules = 0;
      x = quiet * moduleWidth;
      for (i = 0; i < source.pattern.length; i++) {
        if (i % 2 === 0) rects += '<rect x="' + x + '" y="0" width="' + (source.pattern[i] * moduleWidth) + '" height="' + barHeight + '" />';
        x += source.pattern[i] * moduleWidth;
        totalModules += source.pattern[i];
      }
    }
    yText = barHeight + 18;
    textContent = showText ? '<text x="50%" y="' + yText + '" text-anchor="middle" font-family="monospace" font-size="14">' + escapeHtml(source.text) + '</text>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + ((totalModules + quiet * 2) * moduleWidth) + ' ' + (barHeight + (showText ? 22 : 0)) + '" class="bm-print-barcode-svg" role="img" aria-label="Barcode"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">' + rects + '</g>' + textContent + '</svg>';
  }
  function qrMatrix(value, opts) {
    var cfg = opts || {};
    var bytes = utf8Bytes(String(value == null ? '' : value));
    var version = Math.max(1, Math.min(10, cfg.version || (bytes.length <= 17 ? 1 : bytes.length <= 32 ? 2 : bytes.length <= 53 ? 4 : bytes.length <= 78 ? 6 : bytes.length <= 110 ? 8 : 10)));
    var size = 17 + version * 4;
    var matrix = [];
    var reserved = [];
    var dataCoords = [];
    var bits = [];
    var i, r, c, coords, byteIndex = 0;
    for (r = 0; r < size; r++) {
      matrix[r] = [];
      reserved[r] = [];
      for (c = 0; c < size; c++) { matrix[r][c] = false; reserved[r][c] = false; }
    }
    placeFinder(0, 0);
    placeFinder(size - 7, 0);
    placeFinder(0, size - 7);
    placeTiming();
    placeAlignment(version);
    reserveFormat();
    matrix[size - 8][8] = true;
    reserved[size - 8][8] = true;
    appendBits(0x4, 4);
    appendBits(bytes.length > 255 ? 255 : bytes.length, version < 10 ? 8 : 16);
    for (i = 0; i < bytes.length; i++) appendBits(bytes[i], 8);
    appendBits(0, 4);
    while (bits.length % 8 !== 0) bits.push(0);
    while (bits.length < collectDataCoords().length) {
      appendBits(byteIndex % 2 === 0 ? 0xEC : 0x11, 8);
      byteIndex += 1;
    }
    coords = dataCoords;
    for (i = 0; i < coords.length; i++) {
      r = coords[i][0];
      c = coords[i][1];
      matrix[r][c] = !!bits[i];
      if ((r + c) % 2 === 0) matrix[r][c] = !matrix[r][c];
    }
    placeFormatBits(formatBits(cfg.ecLevel || 'M', 0));
    return { matrix: matrix, size: size, version: version };

    function setCell(row, col, on, lock) {
      if (row < 0 || col < 0 || row >= size || col >= size) return;
      matrix[row][col] = !!on;
      if (lock !== false) reserved[row][col] = true;
    }
    function placeFinder(left, top) {
      var x, y, dx, dy;
      for (dy = -1; dy <= 7; dy++) {
        for (dx = -1; dx <= 7; dx++) {
          x = left + dx;
          y = top + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          if (dx === -1 || dy === -1 || dx === 7 || dy === 7) setCell(y, x, false);
          else if (dx === 0 || dy === 0 || dx === 6 || dy === 6) setCell(y, x, true);
          else if (dx === 1 || dy === 1 || dx === 5 || dy === 5) setCell(y, x, false);
          else setCell(y, x, true);
        }
      }
    }
    function placeTiming() {
      for (i = 8; i < size - 8; i++) {
        if (!reserved[6][i]) setCell(6, i, i % 2 === 0);
        if (!reserved[i][6]) setCell(i, 6, i % 2 === 0);
      }
    }
    function alignmentPositions(v) {
      return QR_ALIGNMENT[v] || [6, size - 7];
    }
    function placeAlignment(v) {
      var pos = alignmentPositions(v);
      var a, b, cx, cy, dx, dy;
      if (v < 2) return;
      for (a = 0; a < pos.length; a++) {
        for (b = 0; b < pos.length; b++) {
          cx = pos[a];
          cy = pos[b];
          if ((cx < 9 && cy < 9) || (cx > size - 10 && cy < 9) || (cx < 9 && cy > size - 10)) continue;
          for (dy = -2; dy <= 2; dy++) {
            for (dx = -2; dx <= 2; dx++) {
              setCell(cy + dy, cx + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
            }
          }
        }
      }
    }
    function reserveFormat() {
      for (i = 0; i < 9; i++) {
        if (i !== 6) reserved[8][i] = true;
        if (i !== 6) reserved[i][8] = true;
        reserved[8][size - 1 - i] = true;
        if (size - 1 - i !== 6) reserved[size - 1 - i][8] = true;
      }
    }
    function appendBits(valueBits, width) {
      for (var bit = width - 1; bit >= 0; bit--) bits.push((valueBits >>> bit) & 1);
    }
    function collectDataCoords() {
      var upward = true;
      var row, col, offset;
      if (dataCoords.length) return dataCoords;
      for (col = size - 1; col > 0; col -= 2) {
        if (col === 6) col -= 1;
        for (offset = 0; offset < size; offset++) {
          row = upward ? size - 1 - offset : offset;
          if (!reserved[row][col]) dataCoords.push([row, col]);
          if (!reserved[row][col - 1]) dataCoords.push([row, col - 1]);
        }
        upward = !upward;
      }
      return dataCoords;
    }
    function formatBits(level, mask) {
      var map = { L: 1, M: 0, Q: 3, H: 2 };
      var data = ((map[level] == null ? 0 : map[level]) << 3) | (mask & 7);
      var rem = data << 10;
      var poly = 0x537;
      var k;
      for (k = 14; k >= 10; k--) if ((rem >>> k) & 1) rem ^= poly << (k - 10);
      return ((data << 10) | rem) ^ 0x5412;
    }
    function placeFormatBits(bits15) {
      var p1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
      var p2 = [[size-1,8],[size-2,8],[size-3,8],[size-4,8],[size-5,8],[size-6,8],[size-7,8],[8,size-8],[8,size-7],[8,size-6],[8,size-5],[8,size-4],[8,size-3],[8,size-2],[8,size-1]];
      var bit, j;
      for (j = 0; j < 15; j++) {
        bit = ((bits15 >>> j) & 1) === 1;
        matrix[p1[j][0]][p1[j][1]] = bit;
        matrix[p2[j][0]][p2[j][1]] = bit;
        reserved[p1[j][0]][p1[j][1]] = true;
        reserved[p2[j][0]][p2[j][1]] = true;
      }
    }
  }
  function qrSvg(value, opts) {
    var cfg = opts || {};
    var quiet = Math.max(1, numberValue(cfg.quiet, 2));
    var scale = Math.max(2, numberValue(cfg.size, 168) / (qrMatrix(value, cfg).size + quiet * 2));
    var info = qrMatrix(value, cfg);
    var modules = '';
    var r, c;
    for (r = 0; r < info.size; r++) {
      for (c = 0; c < info.size; c++) if (info.matrix[r][c]) modules += '<rect x="' + ((c + quiet) * scale) + '" y="' + ((r + quiet) * scale) + '" width="' + scale + '" height="' + scale + '" />';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + ((info.size + quiet * 2) * scale) + ' ' + ((info.size + quiet * 2) * scale) + '" class="bm-print-qr-svg" role="img" aria-label="QR code"><desc>' + escapeHtml(String(value == null ? '' : value)) + '</desc><rect width="100%" height="100%" fill="#fff"/><g fill="#000">' + modules + '</g></svg>';
  }
  function grid(items, cols, opts) {
    return block('grid', gridHtml(items, cols, opts), Math.ceil(list(items).length / Math.max(1, cols || 2)) * 48 + 16, { 'data-cols': cols || 2 });
  }
  function table(schema, rows, opts) {
    return block('table', tableHtml(schema, rows, opts), 48 + list(rows).length * ((opts && opts.compact) ? 18 : 24), { 'data-rows': list(rows).length });
  }
  function barcode(value, opts) {
    return block('barcode', barcodeSvg(value, opts), Math.max(60, numberValue(opts && opts.height, 64)) + ((opts && opts.showText === false) ? 10 : 28));
  }
  function qr(value, opts) {
    return block('qr', qrSvg(value, opts), numberValue(opts && opts.size, 168) + 12);
  }
  function label(fields, data, opts) {
    var entries = list(fields).map(function (field) {
      if (typeof field === 'string') return { key: field, spec: { label: labelize(field) } };
      return { key: field.name || field.key, spec: normalizeField(field.name || field.key, field) };
    });
    var html = '<div class="bm-print-label-sheet">' + pairsHtml(entries, data || {}, opts) + '</div>';
    return block('label', html, Math.max(60, entries.length * 26 + 18));
  }
  function header(text, opts) {
    var cfg = opts || {};
    var html = '<div class="bm-print-header-inner">' + (cfg.logo ? '<img class="bm-print-logo" src="' + attr(cfg.logo) + '" alt="" />' : '') + '<div class="bm-print-header-copy"><div class="bm-print-header-title">' + escapeHtml(text || '') + '</div>' + (cfg.subtitle ? '<div class="bm-print-header-subtitle">' + escapeHtml(cfg.subtitle) + '</div>' : '') + (cfg.date ? '<div class="bm-print-header-date">' + escapeHtml(String(cfg.date)) + '</div>' : '') + '</div></div>';
    return block('header', html, 84);
  }
  function footer(text, opts) {
    var cfg = opts || {};
    var suffix = cfg.pageNumbers === false ? '' : '<span class="bm-print-footer-pages">Page {{page}} / {{pages}}</span>';
    return block('footer', '<div class="bm-print-footer-inner"><span>' + escapeHtml(text || '') + '</span>' + suffix + '</div>', 42);
  }
  function section(title, content) {
    var body = renderAny(content);
    return block('section', '<div class="bm-print-section-title">' + escapeHtml(title || '') + '</div><div class="bm-print-section-body">' + body + '</div>', Math.max(38, Math.ceil(stripTags(body).length / 80) * 18 + 34));
  }
  function columns(items, opts) {
    return block('columns', columnsHtml(items, opts), Math.max(40, list(items).length * 22));
  }
  function image(src, opts) {
    return block('image', imageHtml(src, opts), numberValue(opts && opts.height, 120) + ((opts && opts.caption) ? 24 : 8));
  }
  function spacer(height) {
    return block('spacer', '<div style="height:' + cssUnit(height, '12px') + ';"></div>', numberValue(height, 12));
  }
  function documentLayout(schema, data, opts) {
    var cfg = opts || {};
    var exclude = {};
    var entries = fieldEntries(schema);
    var groups = [];
    var grouped = {};
    var output = '';
    list(cfg.exclude).forEach(function (name) { exclude[name] = true; });
    entries = entries.filter(function (entry) { return !exclude[entry.key]; });
    if (cfg.sections && cfg.sections.length) {
      groups = cfg.sections.map(function (sectionCfg) {
        return {
          title: sectionCfg.title || 'Section',
          fields: list(sectionCfg.fields).map(function (name) { return entries.filter(function (entry) { return entry.key === name; })[0]; }).filter(Boolean)
        };
      }).filter(function (group) { return group.fields.length; });
    } else {
      entries.forEach(function (entry) {
        var title = entry.spec.section || cfg.title || 'Details';
        grouped[title] = grouped[title] || [];
        grouped[title].push(entry);
      });
      groups = Object.keys(grouped).map(function (title) { return { title: title, fields: grouped[title] }; });
    }
    groups.forEach(function (group) {
      output += section(group.title, '<div class="bm-print-pairs">' + pairsHtml(group.fields, data || {}, cfg) + '</div>');
    });
    return output;
  }
  function computeTotals(items, taxRate) {
    var subtotal = 0;
    var tax;
    list(items).forEach(function (item) {
      var qty = numberValue(item && (item.qty != null ? item.qty : item.quantity), 1);
      var unit = numberValue(item && (item.price != null ? item.price : item.unitPrice != null ? item.unitPrice : item.amount), 0);
      subtotal += numberValue(item && item.total, qty * unit);
    });
    tax = subtotal * numberValue(taxRate, 0);
    return { subtotal: subtotal, tax: tax, total: subtotal + tax };
  }
  function invoice(schema, data, opts) {
    var cfg = opts || {};
    var payload = data || {};
    var company = payload.company || payload.from || payload.seller || payload.vendor || {};
    var customer = payload.customer || payload.billTo || payload.to || payload.client || {};
    var items = payload.items || payload.lines || payload.lineItems || [];
    var totals = computeTotals(items, cfg.taxRate != null ? cfg.taxRate : payload.taxRate);
    var totalValue = payload.total != null ? payload.total : totals.total;
    var taxValue = payload.tax != null ? payload.tax : totals.tax;
    var itemSchema = schema && extractFields(schema.items && schema.items.item ? schema.items.item : schema.item) ? schema.items && schema.items.item : inferSchemaFromRows(items);
    var parties = '<div class="bm-print-two-up">' +
      '<div class="bm-print-card"><div class="bm-print-card-title">Company</div><div>' + escapeHtml(plainText(company.name || company.company || payload.companyName || '')) + '</div><div>' + escapeHtml(plainText(company.address || company.line1 || '')) + '</div><div>' + escapeHtml(plainText(company.email || company.phone || '')) + '</div></div>' +
      '<div class="bm-print-card"><div class="bm-print-card-title">Customer</div><div>' + escapeHtml(plainText(customer.name || customer.company || payload.customerName || '')) + '</div><div>' + escapeHtml(plainText(customer.address || customer.line1 || '')) + '</div><div>' + escapeHtml(plainText(customer.email || customer.phone || '')) + '</div></div>' +
      '</div>';
    var totalsHtml = '<div class="bm-print-totals">' +
      '<div class="bm-print-total-row"><span>Subtotal</span><strong>' + escapeHtml(formatCurrency(payload.subtotal != null ? payload.subtotal : totals.subtotal, cfg.currency || payload.currency || 'USD', cfg.locale)) + '</strong></div>' +
      '<div class="bm-print-total-row"><span>Tax</span><strong>' + escapeHtml(formatCurrency(taxValue, cfg.currency || payload.currency || 'USD', cfg.locale)) + '</strong></div>' +
      '<div class="bm-print-total-row grand"><span>Total</span><strong>' + escapeHtml(formatCurrency(totalValue, cfg.currency || payload.currency || 'USD', cfg.locale)) + '</strong></div>' +
      '</div>';
    return header('Invoice', { logo: cfg.logo, subtitle: payload.invoiceNo || payload.number || payload.id || '', date: payload.date || payload.issuedAt || '' }) +
      section('Company / Customer', parties) +
      section('Line Items', tableHtml(itemSchema, items, { bordered: true, striped: true })) +
      section('Totals', totalsHtml) +
      (cfg.terms || payload.terms ? section('Terms', '<div class="bm-print-note">' + escapeHtml(cfg.terms || payload.terms) + '</div>') : '') +
      (cfg.bankDetails || payload.bankDetails ? section('Payment', '<div class="bm-print-note">' + escapeHtml(cfg.bankDetails || payload.bankDetails) + '</div>') : '');
  }
  function collectBlocks(content) {
    var text = String(content == null ? '' : content);
    var regex = /<!--bm:block:([^:]+):(\d+)-->([\s\S]*?)<!--\/bm:block-->/g;
    var match;
    var blocks = [];
    while ((match = regex.exec(text))) blocks.push({ kind: match[1], height: parseInt(match[2], 10) || 1, html: match[0] });
    return blocks;
  }
  function paginate(content, opts) {
    var cfg = opts || {};
    var pageHeight = numberValue(cfg.pageHeight, 1122);
    var margins = cfg.margins || {};
    var available = pageHeight - numberValue(margins.top, 40) - numberValue(margins.bottom, 40) - numberValue(cfg.headerHeight, 0) - numberValue(cfg.footerHeight, 0);
    var blocks = collectBlocks(content);
    var pages = [];
    var current = [];
    var used = 0;
    if (!blocks.length) return ['<div class="bm-print-page-body">' + String(content == null ? '' : content) + '</div>'];
    blocks.forEach(function (item) {
      if (current.length && used + item.height > available) {
        pages.push('<div class="bm-print-page-body">' + current.join('') + '</div>');
        current = [];
        used = 0;
      }
      current.push(item.html);
      used += item.height;
    });
    if (current.length) pages.push('<div class="bm-print-page-body">' + current.join('') + '</div>');
    return pages;
  }
  function applyPageTokens(html, page, total) {
    return String(html == null ? '' : html).replace(/\{\{page\}\}/g, String(page)).replace(/\{\{pages\}\}/g, String(total));
  }
  function stylesheet(opts) {
    var cfg = opts || {};
    var size = cfg.pageSize || 'A4';
    var orientation = cfg.orientation || 'portrait';
    var margins = cfg.margins || { top: '12mm', right: '12mm', bottom: '14mm', left: '12mm' };
    var fontFamily = cfg.fontFamily || 'Arial, Helvetica, sans-serif';
    var fontSize = cfg.fontSize || '12px';
    if (size === 'receipt') size = orientation === 'landscape' ? '80mm auto' : '80mm auto';
    return '@page{size:' + size + ' ' + orientation + ';margin:' + cssUnit(margins.top || margins, '12mm') + ' ' + cssUnit(margins.right || margins, '12mm') + ' ' + cssUnit(margins.bottom || margins, '14mm') + ' ' + cssUnit(margins.left || margins, '12mm') + ';}' +
      'html,body{margin:0;padding:0;background:#f4f4f4;font-family:' + fontFamily + ';font-size:' + fontSize + ';color:#111;}' +
      '.bm-print-root{padding:12px;box-sizing:border-box;}' +
      '.bm-print-page{position:relative;background:#fff;box-sizing:border-box;width:100%;max-width:210mm;margin:0 auto 16px;border:1px solid #ddd;box-shadow:0 1px 2px rgba(0,0,0,.08);padding:18mm 14mm 18mm 14mm;page-break-after:always;}' +
      '.bm-print-page:last-child{page-break-after:auto;}' +
      '.bm-print-page-header,.bm-print-page-footer{width:100%;}' +
      '.bm-print-page-content{min-height:60mm;}' +
      '.bm-print-block{break-inside:avoid;page-break-inside:avoid;margin:0 0 12px 0;}' +
      '.bm-print-header-inner,.bm-print-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
      '.bm-print-header-title{font-size:20px;font-weight:700;}.bm-print-header-subtitle,.bm-print-header-date,.bm-print-footer-inner{font-size:11px;color:#555;}' +
      '.bm-print-logo{max-height:42px;max-width:140px;object-fit:contain;}' +
      '.bm-print-section-title{font-size:14px;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #ddd;}' +
      '.bm-print-pairs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;}.bm-print-pair{display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:start;}.bm-print-label{font-weight:700;color:#333;}.bm-print-value{color:#111;min-width:0;}.bm-print-empty{color:#888;}' +
      '.bm-print-subpairs{display:grid;gap:4px;}.bm-print-subpair{display:grid;grid-template-columns:100px 1fr;gap:8px;font-size:11px;}.bm-print-subkey{font-weight:700;color:#555;}' +
      '.bm-print-grid{display:grid;}.bm-print-grid-cell,.bm-print-card,.bm-print-label-sheet{border:1px solid #ddd;padding:8px;border-radius:4px;box-sizing:border-box;}' +
      '.bm-print-columns{}.bm-print-column-item{break-inside:avoid;margin:0 0 12px;}' +
      '.bm-print-two-up{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}.bm-print-card-title{font-weight:700;margin-bottom:6px;}' +
      '.bm-print-table{width:100%;border-collapse:collapse;font-size:11px;}.bm-print-table th,.bm-print-table td{padding:6px 8px;vertical-align:top;text-align:left;}.bm-print-table.bordered th,.bm-print-table.bordered td,.bm-print-table th,.bm-print-table td{border:1px solid #d9d9d9;}.bm-print-table.striped tbody tr:nth-child(even){background:#f8f8f8;}.bm-print-table.compact th,.bm-print-table.compact td{padding:4px 6px;}' +
      '.bm-print-totals{margin-left:auto;max-width:280px;display:grid;gap:6px;}.bm-print-total-row{display:flex;justify-content:space-between;gap:12px;}.bm-print-total-row.grand{font-size:14px;padding-top:6px;border-top:1px solid #ccc;}' +
      '.bm-print-note{white-space:pre-wrap;line-height:1.4;}.bm-print-image{margin:0;display:grid;gap:6px;}.bm-print-image img{display:block;max-width:100%;}.bm-print-image figcaption{font-size:11px;color:#555;}' +
      '.bm-print-docchain{display:grid;gap:12px;}.bm-print-chain-branch{position:relative;padding-left:18px;}.bm-print-chain-branch:before{content:"";position:absolute;left:6px;top:0;bottom:0;border-left:1px solid #bbb;}.bm-print-chain-node{border:1px solid #ccc;border-radius:6px;padding:8px;background:#fff;position:relative;}.bm-print-chain-node:before{content:"";position:absolute;left:-13px;top:14px;width:12px;border-top:1px solid #bbb;}.bm-print-chain-node.root:before{display:none;}.bm-print-chain-title{font-weight:700;}.bm-print-chain-meta{font-size:11px;color:#666;margin-top:4px;}' +
      '.bm-print-preview{transform-origin:top left;overflow:auto;background:#e9e9e9;padding:12px;}.bm-print-preview-scale{transform:scale(.8);transform-origin:top left;}' +
      '@media print{html,body{background:#fff;}.bm-print-root{padding:0;}.bm-print-page{margin:0;border:0;box-shadow:none;max-width:none;}}';
  }
  function render(schema, data, opts) {
    var cfg = opts || {};
    var css = stylesheet(cfg) + (cfg.styles || '');
    var title = cfg.title || schema && schema.title || 'Document';
    var content = typeof cfg.layout === 'function' ? String(cfg.layout(schema, data, api) || '') : (typeof cfg.layout === 'string' ? cfg.layout : documentLayout(schema, data, cfg));
    var pages = paginate(content, {
      pageHeight: cfg.pageHeight,
      pageWidth: cfg.pageWidth,
      margins: cfg.margins || cfg.margin,
      headerHeight: numberValue(cfg.headerHeight, cfg.header ? 84 : 0),
      footerHeight: numberValue(cfg.footerHeight, cfg.footer ? 42 : 0)
    });
    var headerHtml = cfg.header ? (typeof cfg.header === 'string' ? header(cfg.header, { subtitle: cfg.title || '' }) : header(cfg.header.text || title, cfg.header)) : '';
    var footerHtml = cfg.footer ? (typeof cfg.footer === 'string' ? footer(cfg.footer) : footer(cfg.footer.text || '', cfg.footer)) : '';
    var pageMarkup = pages.map(function (pageHtml, index) {
      var contentHtml = applyPageTokens(pageHtml, index + 1, pages.length);
      return '<section class="bm-print-page" data-page="' + (index + 1) + '">' +
        (headerHtml ? '<div class="bm-print-page-header">' + applyPageTokens(headerHtml, index + 1, pages.length) + '</div>' : '') +
        '<div class="bm-print-page-content">' + contentHtml + '</div>' +
        (footerHtml ? '<div class="bm-print-page-footer">' + applyPageTokens(footerHtml, index + 1, pages.length) + '</div>' : '') +
        '</section>';
    }).join('');
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title><style>' + css + '</style></head><body class="bm-print-root">' + pageMarkup + '</body></html>';
  }
  function wrapText(text, width) {
    var words = String(text == null ? '' : text).split(/\s+/);
    var lines = [];
    var line = '';
    var next;
    while (words.length) {
      next = words.shift();
      if (!next) continue;
      if (!line) line = next;
      else if ((line + ' ' + next).length <= width) line += ' ' + next;
      else {
        lines.push(line);
        line = next;
      }
      while (line.length > width) {
        lines.push(line.slice(0, width));
        line = line.slice(width);
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }
  function fitLine(left, right, width) {
    left = String(left == null ? '' : left);
    right = String(right == null ? '' : right);
    if (left.length + right.length + 1 > width) left = left.slice(0, Math.max(0, width - right.length - 1));
    return left + repeat(' ', Math.max(1, width - left.length - right.length)) + right;
  }
  function receipt(items, opts) {
    var cfg = opts || {};
    var width = Math.max(24, parseInt(cfg.width || 48, 10));
    var separator = repeat((cfg.separator || '-').charAt(0) || '-', width);
    var rows = list(items);
    var totals = computeTotals(rows, cfg.taxRate);
    var totalValue = cfg.total != null ? numberValue(cfg.total, totals.total) : totals.total;
    var lines = [];
    function pushLines(input) { list(input).forEach(function (line) { wrapText(line, width).forEach(function (piece) { lines.push(piece); }); }); }
    if (cfg.header) pushLines(cfg.header);
    if (cfg.header) lines.push(separator);
    rows.forEach(function (item) {
      var label = item && (item.label || item.name || item.description || item.id) || '';
      var qty = numberValue(item && (item.qty != null ? item.qty : item.quantity), 1);
      var unit = numberValue(item && (item.price != null ? item.price : item.unitPrice != null ? item.unitPrice : item.amount), 0);
      var lineTotal = item && item.total != null ? numberValue(item.total, qty * unit) : qty * unit;
      wrapText(label, width - 10).forEach(function (piece, index) {
        lines.push(index === 0 ? fitLine(piece, lineTotal.toFixed(2), width) : piece);
      });
      if (qty !== 1 || unit) lines.push(fitLine('  ' + qty + ' x ' + unit.toFixed(2), '', width));
    });
    lines.push(separator);
    lines.push(fitLine('Subtotal', totals.subtotal.toFixed(2), width));
    if (cfg.tax != null || cfg.taxRate != null) lines.push(fitLine('Tax', numberValue(cfg.tax, totals.tax).toFixed(2), width));
    lines.push(fitLine('Total', totalValue.toFixed(2), width));
    if (cfg.footer) {
      lines.push(separator);
      pushLines(cfg.footer);
    }
    return lines.map(function (line) { return line.length > width ? line.slice(0, width) : padRight(line, width); }).join('\n');
  }
  function htmlToThermalText(html, width) {
    return stripTags(html).split(/\n+/).map(function (line) {
      return wrapText(line, width).map(function (part) { return padRight(part, width); }).join('\n');
    }).join('\n').trim();
  }
  function print(html, opts) {
    var cfg = opts || {};
    var device = cfg.device || 'browser';
    if (device === 'pdf') {
      if (typeof Blob !== 'undefined') return new Blob([String(html == null ? '' : html)], { type: 'application/pdf' });
      return { type: 'application/pdf', content: String(html == null ? '' : html) };
    }
    if (device === 'thermal') {
      if (isArray(html)) return receipt(html, cfg);
      if (cfg.items) return receipt(cfg.items, cfg);
      return htmlToThermalText(String(html == null ? '' : html), Math.max(24, parseInt(cfg.width || 48, 10)));
    }
    if (typeof document === 'undefined' || typeof window === 'undefined' || !document.createElement) return String(html == null ? '' : html);
    var frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);
    frame.contentWindow.document.open();
    frame.contentWindow.document.write(String(html == null ? '' : html));
    frame.contentWindow.document.close();
    if (cfg.silent !== true && frame.contentWindow.print) frame.contentWindow.print();
    return frame;
  }
  function preview(html, container) {
    var target = typeof container === 'string' && typeof document !== 'undefined' ? document.querySelector(container) : container;
    if (!target) return null;
    target.innerHTML = '<div class="bm-print-preview"><div class="bm-print-preview-scale">' + String(html == null ? '' : html) + '</div></div>';
    return target;
  }
  function pickNodeFields(data) {
    var keys = Object.keys(data || {}).filter(function (key) {
      var value = data[key];
      return value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    }).slice(0, 4);
    return keys.map(function (key) { return '<div><strong>' + escapeHtml(labelize(key)) + ':</strong> ' + escapeHtml(plainText(data[key])) + '</div>'; }).join('');
  }
  function docChainTree(input) {
    if (isArray(input)) {
      return { doc: { id: 'root', type: 'chain', status: '', data: {} }, children: input.map(function (entry) {
        var doc = entry && entry.doc ? entry.doc : entry;
        return { doc: doc, children: [] };
      }) };
    }
    if (input && input.doc && isArray(input.children)) return input;
    if (input && isArray(input.docs) && input.rootId) {
      var map = {};
      input.docs.forEach(function (doc) { map[doc.id] = { doc: doc, children: [] }; });
      input.docs.forEach(function (doc) { if (doc.parentId && map[doc.parentId]) map[doc.parentId].children.push(map[doc.id]); });
      return map[input.rootId] || null;
    }
    if (input && isArray(input.nodes) && isArray(input.edges)) {
      var nodes = {};
      var root = null;
      input.nodes.forEach(function (node) { nodes[node.id] = { doc: node, children: [] }; });
      input.edges.forEach(function (edge) {
        if (edge.relation === 'child' && nodes[edge.from] && nodes[edge.to]) nodes[edge.from].children.push(nodes[edge.to]);
      });
      input.nodes.forEach(function (node) { if (!input.edges.some(function (edge) { return edge.relation === 'child' && edge.to === node.id; })) root = nodes[node.id]; });
      return root;
    }
    return input || null;
  }
  function fromDocChain(chain, opts) {
    var cfg = opts || {};
    var tree = docChainTree(chain);
    if (!tree) return block('docchain', '<div class="bm-print-docchain"></div>', 24);
    return block('docchain', '<div class="bm-print-docchain">' + renderBranch(tree, true) + '</div>', 120 + countBranches(tree) * 28);

    function renderBranch(node, isRoot) {
      var doc = node.doc || {};
      var title = doc.title || doc.label || doc.type || doc.id || 'Document';
      var meta = '<div class="bm-print-chain-meta">' + escapeHtml(String(doc.id || '')) + (doc.status ? ' • ' + escapeHtml(String(doc.status)) : '') + '</div>';
      var body = pickNodeFields(doc.data || doc);
      return '<div class="bm-print-chain-branch"><div class="bm-print-chain-node' + (isRoot ? ' root' : '') + '"><div class="bm-print-chain-title">' + escapeHtml(title) + '</div>' + meta + (body ? '<div class="bm-print-chain-fields">' + body + '</div>' : '') + '</div>' + list(node.children).map(function (child) { return renderBranch(child, false); }).join('') + '</div>';
    }
    function countBranches(node) {
      return 1 + list(node.children).reduce(function (sum, child) { return sum + countBranches(child); }, 0);
    }
  }

  var api = {
    render: render,
    paginate: paginate,
    print: print,
    preview: preview,
    stylesheet: stylesheet,
    receipt: receipt,
    invoice: invoice,
    document: documentLayout,
    fromDocChain: fromDocChain,
    grid: grid,
    table: table,
    barcode: barcode,
    qr: qr,
    label: label,
    header: header,
    footer: footer,
    section: section,
    columns: columns,
    image: image,
    spacer: spacer,
    _internals: {
      tableHtml: tableHtml,
      barcodeSvg: barcodeSvg,
      qrSvg: qrSvg,
      qrMatrix: qrMatrix,
      collectBlocks: collectBlocks,
      htmlToThermalText: htmlToThermalText
    }
  };

  return api;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Print;
else if (typeof exports !== 'undefined') exports.Print = BareMetal.Print;
