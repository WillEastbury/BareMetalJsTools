/* BareMetal.VTTerminal - dependency-free scrollback VT100/ANSI terminal driver. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.VTTerminal = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var root = typeof document !== 'undefined' ? document : null;
    var element = typeof options.element === 'string' && root ? root.querySelector(options.element) : options.element;
    if (!element && root) {
      element = root.createElement('div');
    }
    element.className = (element.className ? element.className + ' ' : '') + 'bm-vt-terminal';
    element.setAttribute('role', 'log');
    element.setAttribute('tabindex', '0');
    element.style.overflow = 'auto';

    var maxLines = Math.max(100, Number(options.maxLines) || 5000);
    var cols = Math.max(20, Number(options.cols) || 80);
    var rows = Math.max(1, Number(options.rows) || 24);
    var lines = [];
    var cursorRow = 0;
    var cursorCol = 0;
    var savedCursor = { row: 0, col: 0 };
    var state = { fg: null, bg: null, bold: false, dim: false, inverse: false, underline: false, hidden: false };
    var listeners = new Set();
    var socket = null;

    function ensureRow(row) {
      while (lines.length <= row) lines.push({ text: '', segments: [] });
      return lines[row];
    }

    function emit(text) {
      listeners.forEach(function (listener) {
        try { listener(text); } catch (_) {}
      });
    }

    function styleForSegment(segment) {
      var style = {};
      if (segment.fg) style.color = segment.fg;
      if (segment.bg) style.background = segment.bg;
      if (segment.bold) style.fontWeight = 'bold';
      if (segment.dim) style.opacity = '0.65';
      if (segment.underline) style.textDecoration = 'underline';
      if (segment.inverse) {
        style.color = segment.bg || '#111827';
        style.background = segment.fg || '#e5e7eb';
      }
      return style;
    }

    function ansiColor(code, bright) {
      var palette = options.palette || [
        '#111827', '#ef4444', '#22c55e', '#eab308',
        '#3b82f6', '#a855f7', '#06b6d4', '#d1d5db',
        '#4b5563', '#f87171', '#4ade80', '#facc15',
        '#60a5fa', '#c084fc', '#22d3ee', '#ffffff'
      ];
      if (code >= 0 && code < 16) return palette[(bright ? 8 : 0) + code % 8];
      if (code >= 16 && code <= 231) {
        var index = code - 16;
        var r = Math.floor(index / 36);
        var g = Math.floor((index % 36) / 6);
        var b = index % 6;
        var levels = [0, 95, 135, 175, 215, 255];
        return 'rgb(' + levels[r] + ',' + levels[g] + ',' + levels[b] + ')';
      }
      if (code >= 232 && code <= 255) {
        var gray = 8 + (code - 232) * 10;
        return 'rgb(' + gray + ',' + gray + ',' + gray + ')';
      }
      return null;
    }

    function currentSegment() {
      return {
        fg: state.fg,
        bg: state.bg,
        bold: state.bold,
        dim: state.dim,
        inverse: state.inverse,
        underline: state.underline
      };
    }

    function put(text) {
      var row = ensureRow(cursorRow);
      for (var i = 0; i < text.length; i++) {
        var char = text[i];
        if (char === '\r') {
          cursorCol = 0;
          continue;
        }
        if (char === '\b') {
          cursorCol = Math.max(0, cursorCol - 1);
          continue;
        }
        if (char === '\t') {
          cursorCol = Math.min(cols - 1, cursorCol + (8 - cursorCol % 8));
          continue;
        }
        if (char === '\n') {
          cursorRow++;
          cursorCol = 0;
          row = ensureRow(cursorRow);
          if (lines.length > maxLines) lines.splice(0, lines.length - maxLines);
          continue;
        }
        if (cursorCol >= cols) {
          cursorRow++;
          cursorCol = 0;
          row = ensureRow(cursorRow);
        }
        var segment = currentSegment();
        while (row.text.length < cursorCol) row.text += ' ';
        row.text = row.text.slice(0, cursorCol) + char + row.text.slice(cursorCol + 1);
        var existing = row.segments[cursorCol] || {};
        row.segments[cursorCol] = Object.assign({}, existing, segment);
        cursorCol++;
      }
      emit(text);
    }

    function eraseDisplay(mode) {
      mode = Number(mode) || 0;
      if (mode === 2 || mode === 3) {
        lines = [];
        cursorRow = 0;
        cursorCol = 0;
      } else if (mode === 0) {
        ensureRow(cursorRow).text = ensureRow(cursorRow).text.slice(0, cursorCol);
        ensureRow(cursorRow).segments = ensureRow(cursorRow).segments.slice(0, cursorCol);
        lines = lines.slice(0, cursorRow + 1);
      } else if (mode === 1) {
        for (var i = 0; i <= cursorRow; i++) {
          ensureRow(i).text = i === cursorRow ? ensureRow(i).text.slice(cursorCol) : '';
          ensureRow(i).segments = i === cursorRow ? ensureRow(i).segments.slice(cursorCol) : [];
        }
      }
    }

    function eraseLine(mode) {
      mode = Number(mode) || 0;
      var row = ensureRow(cursorRow);
      if (mode === 2) {
        row.text = '';
        row.segments = [];
      } else if (mode === 0) {
        row.text = row.text.slice(0, cursorCol);
        row.segments = row.segments.slice(0, cursorCol);
      } else if (mode === 1) {
        row.text = row.text.slice(cursorCol);
        row.segments = row.segments.slice(cursorCol);
      }
    }

    function setSgr(params) {
      if (!params.length) params = [0];
      for (var i = 0; i < params.length; i++) {
        var code = params[i];
        if (code === 0) {
          state = { fg: null, bg: null, bold: false, dim: false, inverse: false, underline: false, hidden: false };
        } else if (code === 1) state.bold = true;
        else if (code === 2) state.dim = true;
        else if (code === 7) state.inverse = true;
        else if (code === 22) { state.bold = false; state.dim = false; }
        else if (code === 24) state.underline = false;
        else if (code === 4) state.underline = true;
        else if (code >= 30 && code <= 37) state.fg = ansiColor(code - 30, false);
        else if (code >= 90 && code <= 97) state.fg = ansiColor(code - 90, true);
        else if (code >= 40 && code <= 47) state.bg = ansiColor(code - 40, false);
        else if (code >= 100 && code <= 107) state.bg = ansiColor(code - 100, true);
        else if (code === 38 && params[i + 1] === 5) {
          state.fg = ansiColor(Number(params[i + 2]) || 0, false);
          i += 2;
        } else if (code === 48 && params[i + 1] === 5) {
          state.bg = ansiColor(Number(params[i + 2]) || 0, false);
          i += 2;
        } else if (code === 38 && params[i + 1] === 2) {
          state.fg = 'rgb(' + (params[i + 2] || 0) + ',' + (params[i + 3] || 0) + ',' + (params[i + 4] || 0) + ')';
          i += 4;
        } else if (code === 48 && params[i + 1] === 2) {
          state.bg = 'rgb(' + (params[i + 2] || 0) + ',' + (params[i + 3] || 0) + ',' + (params[i + 4] || 0) + ')';
          i += 4;
        } else if (code === 39) state.fg = null;
        else if (code === 49) state.bg = null;
      }
    }

    function parseCsi(sequence) {
      var match = /^([0-?]*)([ -\/]*)([@-~])$/.exec(sequence);
      if (!match) return;
      var params = match[1] ? match[1].split(';').map(function (value) { return value === '' ? 0 : parseInt(value, 10); }) : [];
      var command = match[3];
      if (command === 'm') setSgr(params);
      else if (command === 'A') cursorRow = Math.max(0, cursorRow - (params[0] || 1));
      else if (command === 'B') cursorRow = Math.min(rows - 1, cursorRow + (params[0] || 1));
      else if (command === 'C') cursorCol = Math.min(cols - 1, cursorCol + (params[0] || 1));
      else if (command === 'D') cursorCol = Math.max(0, cursorCol - (params[0] || 1));
      else if (command === 'G') cursorCol = Math.max(0, Math.min(cols - 1, (params[0] || 1) - 1));
      else if (command === 'H' || command === 'f') {
        cursorRow = Math.max(0, Math.min(rows - 1, (params[0] || 1) - 1));
        cursorCol = Math.max(0, Math.min(cols - 1, (params[1] || 1) - 1));
      } else if (command === 'J') eraseDisplay(params[0]);
      else if (command === 'K') eraseLine(params[0]);
      else if (command === 's') savedCursor = { row: cursorRow, col: cursorCol };
      else if (command === 'u') { cursorRow = savedCursor.row; cursorCol = savedCursor.col; }
    }

    function write(text) {
      text = String(text == null ? '' : text);
      var plain = '';
      for (var i = 0; i < text.length;) {
        var char = text[i];
        if (char === '\x1b' && text[i + 1] === '[') {
          if (plain) { put(plain); plain = ''; }
          var end = i + 2;
          while (end < text.length && !/[A-Za-z@~]/.test(text[end])) end++;
          if (end < text.length) {
            parseCsi(text.slice(i + 2, end + 1));
            i = end + 1;
            continue;
          }
        }
        plain += char;
        i++;
      }
      if (plain) put(plain);
      render();
    }

    function render() {
      element.replaceChildren();
      var visible = lines;
      visible.forEach(function (line) {
        var div = root.createElement('div');
        div.className = 'bm-vt-line';
        var current = null;
        var segmentText = '';
        for (var i = 0; i < line.text.length; i++) {
          var seg = line.segments[i] || {};
          var key = JSON.stringify(seg);
          if (key !== current) {
            if (segmentText) {
              var span = root.createElement('span');
              var style = styleForSegment(JSON.parse(current));
              Object.keys(style).forEach(function (name) { span.style[name] = style[name]; });
              span.textContent = segmentText;
              div.append(span);
            }
            current = key;
            segmentText = '';
          }
          segmentText += line.text[i] || ' ';
        }
        if (segmentText) {
          var span = root.createElement('span');
          var style = styleForSegment(JSON.parse(current));
          Object.keys(style).forEach(function (name) { span.style[name] = style[name]; });
          span.textContent = segmentText;
          div.append(span);
        }
        element.append(div);
      });
      element.scrollTop = element.scrollHeight;
    }

    function clear() { lines = []; cursorRow = 0; cursorCol = 0; render(); }

    function resize(nextCols, nextRows) {
      cols = Math.max(20, Number(nextCols) || cols);
      rows = Math.max(1, Number(nextRows) || rows);
      if (options.onResize) options.onResize({ cols: cols, rows: rows });
      return { cols: cols, rows: rows };
    }

    function openWebSocket(url, socketOptions) {
      socketOptions = socketOptions || {};
      var Ctor = socketOptions.WebSocket || WebSocket;
      if (!Ctor) throw new Error('WebSocket is unavailable');
      socket = new Ctor(url);
      socket.onmessage = function (event) {
        if (typeof event.data === 'string') write(event.data);
        else if (event.data && event.data.text) event.data.text().then(write);
      };
      socket.onclose = function () { if (socketOptions.onClose) socketOptions.onClose(); };
      socket.onerror = function (error) { if (socketOptions.onError) socketOptions.onError(error); };
      socket.onopen = function () { if (socketOptions.onOpen) socketOptions.onOpen(socket); };
      return socket;
    }

    function send(text) {
      if (socket && socket.readyState === 1) { socket.send(text); return true; }
      emit(text);
      return false;
    }

    function onInput(listener) {
      if (typeof listener !== 'function') throw new TypeError('listener must be a function');
      listeners.add(listener);
      element.addEventListener('keydown', function (event) {
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) send(event.key);
        else if (event.key === 'Enter') send('\r');
        else if (event.key === 'Backspace') send('\b');
      });
      return function () { listeners.delete(listener); };
    }

    function destroy() {
      if (socket) socket.close();
      listeners.clear();
      element.replaceChildren();
    }

    render();

    return {
      element: element,
      write: write,
      clear: clear,
      resize: resize,
      send: send,
      openWebSocket: openWebSocket,
      onInput: onInput,
      getLines: function () { return lines.map(function (line) { return line.text; }); },
      destroy: destroy
    };
  }

  return { create: create };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.VTTerminal;
