var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.PicoScript = (function(){
  'use strict';

  var VERSION = '1.0.0';
  var OPCODES = {
    PUSH_NUM: 0x01,
    PUSH_STR: 0x02,
    PUSH_TRUE: 0x03,
    PUSH_FALSE: 0x04,
    LOAD: 0x10,
    STORE: 0x11,
    LOAD_ARR: 0x12,
    STORE_ARR: 0x13,
    ADD: 0x20,
    SUB: 0x21,
    MUL: 0x22,
    DIV: 0x23,
    MOD: 0x24,
    POW: 0x25,
    NEG: 0x26,
    NOT: 0x27,
    EQ: 0x30,
    NE: 0x31,
    LT: 0x32,
    GT: 0x33,
    LE: 0x34,
    GE: 0x35,
    AND: 0x36,
    OR: 0x37,
    JMP: 0x40,
    JZ: 0x41,
    JNZ: 0x42,
    CALL: 0x43,
    RET: 0x44,
    PRINT: 0x50,
    PRINTLN: 0x51,
    INPUT: 0x52,
    READ: 0x53,
    RESTORE: 0x54,
    DIM: 0x55,
    BUILTIN: 0x60,
    HALT: 0x70,
    NOP: 0x71,
    POP: 0x72,
    DUP: 0x73,
    SLEEP: 0x74
  };
  var OPCODE_NAMES = {};
  var KEYWORDS = {
    LET: 1, PRINT: 1, INPUT: 1, IF: 1, THEN: 1, ELSE: 1, END: 1, FOR: 1, TO: 1,
    STEP: 1, NEXT: 1, WHILE: 1, WEND: 1, DO: 1, LOOP: 1, UNTIL: 1, GOTO: 1,
    GOSUB: 1, RETURN: 1, DIM: 1, DATA: 1, READ: 1, RESTORE: 1, REM: 1,
    DEF: 1, FN: 1, AND: 1, OR: 1, NOT: 1, MOD: 1, TRUE: 1, FALSE: 1, SLEEP: 1, ON: 1
  };
  var BUILTIN_LIST = [
    'ABS', 'INT', 'FIX', 'SGN', 'SQR', 'RND', 'SIN', 'COS', 'TAN', 'ATN', 'LOG', 'EXP',
    'MIN', 'MAX', 'LEN', 'MID$', 'LEFT$', 'RIGHT$', 'CHR$', 'ASC', 'STR$', 'VAL',
    'UPPER$', 'LOWER$', 'INSTR', 'TRIM$', 'PUSH', 'POP', 'SHIFT',
    'EMIT', 'EMIT_U8', 'EMIT_U16', 'EMIT_U32', 'EMIT_STR', 'EMIT_CRLF', 'PEEK', 'PEEK_U16', 'PEEK_U32', 'SLICE', 'BUF_LEN'
  ];
  var BUILTIN_IDS = {};
  var DEFAULT_BUILTINS = [];
  var i;

  for (i = 0; i < BUILTIN_LIST.length; i++) BUILTIN_IDS[BUILTIN_LIST[i]] = i;
  for (i in OPCODES) if (Object.prototype.hasOwnProperty.call(OPCODES, i)) OPCODE_NAMES[OPCODES[i]] = i;

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function normName(name) { return String(name == null ? '' : name).trim().toUpperCase(); }
  function isDigit(ch) { return ch >= '0' && ch <= '9'; }
  function isIdStart(ch) { return /[A-Za-z_]/.test(ch); }
  function isIdPart(ch) { return /[A-Za-z0-9_$]/.test(ch); }
  function trimLineTokens(tokens) {
    var out = [];
    var idx = 0;
    if (!tokens || !tokens.length) return [];
    if (tokens[0].type === 'COMMENT') return [tokens[0]];
    for (idx = 0; idx < tokens.length; idx++) {
      if (tokens[idx].type === 'COMMENT') break;
      out.push(tokens[idx]);
    }
    return out;
  }
  function fail(line, message) {
    var err = new Error('Line ' + (line || 0) + ': ' + message);
    err.line = line || 0;
    throw err;
  }
  function toNumber(value) {
    value = Number(value);
    return isFinite(value) ? value : 0;
  }
  function toIndex(value) {
    value = Math.floor(toNumber(value));
    return value < 0 ? 0 : value;
  }
  function boolValue(value) { return value ? 1 : 0; }
  function valueToString(value) {
    if (value == null) return '';
    if (Array.isArray(value)) return value.join(',');
    if (isUint8Array(value)) return Array.prototype.join.call(value, ',');
    return String(value);
  }
  function cloneValue(value) {
    var out;
    var key;
    if (value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.slice();
    if (isUint8Array(value)) return value.slice ? value.slice(0) : new Uint8Array(value);
    out = {};
    for (key in value) if (own(value, key)) out[key] = cloneValue(value[key]);
    return out;
  }
  function isUint8Array(value) {
    return typeof Uint8Array !== 'undefined' && !!value && (value instanceof Uint8Array || Object.prototype.toString.call(value) === '[object Uint8Array]');
  }
  function asUint8Array(value) {
    if (isUint8Array(value)) return value;
    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return new Uint8Array(value);
    return null;
  }
  function bufferLength(value) {
    if (value == null) return 0;
    if (typeof value === 'string') return value.length;
    if (Array.isArray(value) || isUint8Array(value)) return value.length;
    return String(value).length;
  }
  function readBufferByte(value, offset) {
    var arr = asUint8Array(value);
    var item;
    offset = toIndex(offset);
    if (typeof value === 'string') return offset < value.length ? (value.charCodeAt(offset) & 255) : null;
    if (Array.isArray(value) || arr) {
      value = arr || value;
      if (offset >= value.length) return null;
      item = value[offset];
      return item == null ? 0 : (toIndex(item) & 255);
    }
    return null;
  }
  function sliceBufferValue(value, start, length) {
    var arr = asUint8Array(value);
    start = toIndex(start);
    if (length == null) length = Math.max(0, bufferLength(value) - start);
    else length = Math.max(0, toIndex(length));
    if (typeof value === 'string') return value.substr(start, length);
    if (Array.isArray(value)) return value.slice(start, start + length);
    if (arr) return arr.slice ? arr.slice(start, start + length) : new Uint8Array(arr.subarray(start, start + length));
    return valueToString(value).substr(start, length);
  }
  function valueToBytes(value) {
    var arr = asUint8Array(value);
    var out = [];
    var idx;
    if (arr) return Array.prototype.slice.call(arr);
    if (Array.isArray(value)) {
      for (idx = 0; idx < value.length; idx++) out.push(toIndex(value[idx]) & 255);
      return out;
    }
    if (typeof value === 'string') {
      for (idx = 0; idx < value.length; idx++) out.push(value.charCodeAt(idx) & 255);
      return out;
    }
    if (value == null) return out;
    return [toIndex(value) & 255];
  }
  function quoteString(value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }
  function formatLiteral(value) {
    if (typeof value === 'string') return quoteString(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  }
  function lineStarts(tokens, words) {
    var idx;
    if (!tokens || tokens.length < words.length) return false;
    for (idx = 0; idx < words.length; idx++) if (!tokens[idx] || tokens[idx].value !== words[idx]) return false;
    return true;
  }
  function findTopLevel(tokens, value) {
    var depth = 0;
    var idx;
    var token;
    for (idx = 0; idx < tokens.length; idx++) {
      token = tokens[idx];
      if (token.value === '(' || token.value === '[') depth++;
      else if (token.value === ')' || token.value === ']') depth--;
      else if (depth === 0 && token.value === value) return idx;
    }
    return -1;
  }
  function splitTopLevel(tokens, separators, allowTrailing) {
    var items = [];
    var seps = [];
    var depth = 0;
    var start = 0;
    var idx;
    var token;
    for (idx = 0; idx < tokens.length; idx++) {
      token = tokens[idx];
      if (token.value === '(' || token.value === '[') depth++;
      else if (token.value === ')' || token.value === ']') depth--;
      else if (depth === 0 && own(separators, token.value)) {
        items.push(tokens.slice(start, idx));
        seps.push(token.value);
        start = idx + 1;
      }
    }
    items.push(tokens.slice(start));
    if (!allowTrailing && items.length) {
      for (idx = 0; idx < items.length; idx++) if (!items[idx].length) return null;
    }
    return { items: items, seps: seps };
  }
  function parseCsvValues(text, line) {
    var tokens = tokenize(String(text || ''));
    var lines = groupLines(tokens);
    var content = lines.length ? trimLineTokens(lines[0].tokens) : [];
    if (!content.length) return [];
    var split = splitTopLevel(content, { ',': 1 }, false);
    if (!split) fail(line || 0, 'Invalid comma separated values');
    return split.items.map(function(item) { return parseExpressionTokens(item, line || 0); });
  }

  function tokenize(source) {
    var tokens = [];
    var lines;
    var lineNo;
    var line;
    var len;
    var idx;
    var ch;
    var start;
    var raw;
    var upper;
    var str;
    source = String(source == null ? '' : source).replace(/\r\n?/g, '\n');
    lines = source.split('\n');
    for (lineNo = 0; lineNo < lines.length; lineNo++) {
      line = lines[lineNo];
      len = line.length;
      idx = 0;
      while (idx < len) {
        ch = line.charAt(idx);
        if (ch === ' ' || ch === '\t' || ch === '\f') { idx++; continue; }
        if (ch === '\'') {
          tokens.push({ type: 'COMMENT', value: line.slice(idx + 1), line: lineNo + 1, col: idx + 1 });
          idx = len;
          break;
        }
        if (ch === '"') {
          var closed = false;
          start = idx + 1;
          idx++;
          str = '';
          while (idx < len) {
            ch = line.charAt(idx);
            if (ch === '"') {
              if (line.charAt(idx + 1) === '"') { str += '"'; idx += 2; continue; }
              idx++;
              closed = true;
              break;
            }
            str += ch;
            idx++;
          }
          if (!closed) fail(lineNo + 1, 'Unterminated string literal');
          tokens.push({ type: 'STRING', value: str, raw: str, line: lineNo + 1, col: start });
          continue;
        }
        if (isDigit(ch) || (ch === '.' && isDigit(line.charAt(idx + 1)))) {
          start = idx;
          idx++;
          while (idx < len && isDigit(line.charAt(idx))) idx++;
          if (line.charAt(idx) === '.') {
            idx++;
            while (idx < len && isDigit(line.charAt(idx))) idx++;
          }
          if (/[Ee]/.test(line.charAt(idx))) {
            idx++;
            if (line.charAt(idx) === '+' || line.charAt(idx) === '-') idx++;
            while (idx < len && isDigit(line.charAt(idx))) idx++;
          }
          raw = line.slice(start, idx);
          tokens.push({ type: 'NUMBER', value: raw, raw: raw, line: lineNo + 1, col: start + 1 });
          continue;
        }
        if (isIdStart(ch)) {
          start = idx;
          idx++;
          while (idx < len && isIdPart(line.charAt(idx))) idx++;
          raw = line.slice(start, idx);
          upper = normName(raw);
          if (upper === 'REM') {
            tokens.push({ type: 'COMMENT', value: line.slice(idx).replace(/^\s+/, ''), line: lineNo + 1, col: start + 1 });
            idx = len;
            break;
          }
          tokens.push({ type: KEYWORDS[upper] ? 'KEYWORD' : 'IDENT', value: upper, raw: raw, line: lineNo + 1, col: start + 1 });
          continue;
        }
        if ((ch === '<' || ch === '>') && line.charAt(idx + 1) === '=') {
          tokens.push({ type: 'OP', value: ch + '=', line: lineNo + 1, col: idx + 1 });
          idx += 2;
          continue;
        }
        if (ch === '<' && line.charAt(idx + 1) === '>') {
          tokens.push({ type: 'OP', value: '<>', line: lineNo + 1, col: idx + 1 });
          idx += 2;
          continue;
        }
        if ('=<>+-*/^(),;:[]'.indexOf(ch) >= 0) {
          tokens.push({ type: 'OP', value: ch, line: lineNo + 1, col: idx + 1 });
          idx++;
          continue;
        }
        fail(lineNo + 1, 'Unexpected character ' + ch);
      }
      tokens.push({ type: 'EOL', value: '\n', line: lineNo + 1, col: len + 1 });
    }
    return tokens;
  }

  function groupLines(tokens) {
    var lines = [];
    var current = [];
    var idx;
    var token;
    for (idx = 0; idx < tokens.length; idx++) {
      token = tokens[idx];
      if (token.type === 'EOL') {
        lines.push({ line: token.line, tokens: current });
        current = [];
      } else current.push(token);
    }
    if (current.length) lines.push({ line: current[0].line || 0, tokens: current });
    return lines;
  }

  function TokenCursor(tokens, line) {
    this.tokens = tokens || [];
    this.pos = 0;
    this.line = line || (this.tokens[0] ? this.tokens[0].line : 0);
  }
  TokenCursor.prototype.peek = function(offset) { return this.tokens[this.pos + (offset || 0)] || null; };
  TokenCursor.prototype.next = function() { return this.tokens[this.pos++] || null; };
  TokenCursor.prototype.match = function(value) {
    var token = this.peek();
    if (token && token.value === value) { this.pos++; return true; }
    return false;
  };
  TokenCursor.prototype.expect = function(value) {
    var token = this.next();
    if (!token || token.value !== value) fail(this.line, 'Expected ' + value);
    return token;
  };
  TokenCursor.prototype.end = function() { return this.pos >= this.tokens.length; };

  function parsePrimary(cursor) {
    var token = cursor.next();
    var name;
    var open;
    var close;
    var args;
    if (!token) fail(cursor.line, 'Expected expression');
    if (token.type === 'NUMBER') return { type: 'Number', value: parseFloat(token.raw), line: token.line };
    if (token.type === 'STRING') return { type: 'String', value: token.value, line: token.line };
    if (token.value === 'TRUE') return { type: 'Boolean', value: true, line: token.line };
    if (token.value === 'FALSE') return { type: 'Boolean', value: false, line: token.line };
    if (token.value === '(') {
      args = parseExpressionCursor(cursor);
      cursor.expect(')');
      return args;
    }
    if (token.type === 'IDENT' || token.type === 'KEYWORD') {
      name = token.value;
      if (cursor.peek() && (cursor.peek().value === '(' || cursor.peek().value === '[')) {
        open = cursor.next().value;
        close = open === '(' ? ')' : ']';
        args = [];
        if (!cursor.match(close)) {
          do {
            args.push(parseExpressionCursor(cursor));
          } while (cursor.match(','));
          cursor.expect(close);
        }
        return { type: 'Access', name: name, args: args, bracket: open, line: token.line };
      }
      return { type: 'Var', name: name, line: token.line };
    }
    fail(token.line, 'Unexpected token ' + token.value);
  }
  function parseUnary(cursor) {
    var token = cursor.peek();
    if (token && (token.value === '-' || token.value === 'NOT')) {
      cursor.next();
      return { type: 'Unary', op: token.value, expr: parseUnary(cursor), line: token.line };
    }
    return parsePrimary(cursor);
  }
  function parsePow(cursor) {
    var left = parseUnary(cursor);
    var token = cursor.peek();
    if (token && token.value === '^') {
      cursor.next();
      return { type: 'Binary', op: '^', left: left, right: parsePow(cursor), line: token.line };
    }
    return left;
  }
  function parseMul(cursor) {
    var left = parsePow(cursor);
    var token;
    while ((token = cursor.peek()) && (token.value === '*' || token.value === '/' || token.value === 'MOD')) {
      cursor.next();
      left = { type: 'Binary', op: token.value, left: left, right: parsePow(cursor), line: token.line };
    }
    return left;
  }
  function parseAdd(cursor) {
    var left = parseMul(cursor);
    var token;
    while ((token = cursor.peek()) && (token.value === '+' || token.value === '-')) {
      cursor.next();
      left = { type: 'Binary', op: token.value, left: left, right: parseMul(cursor), line: token.line };
    }
    return left;
  }
  function parseCompare(cursor) {
    var left = parseAdd(cursor);
    var token;
    while ((token = cursor.peek()) && (token.value === '=' || token.value === '<>' || token.value === '<' || token.value === '>' || token.value === '<=' || token.value === '>=')) {
      cursor.next();
      left = { type: 'Binary', op: token.value, left: left, right: parseAdd(cursor), line: token.line };
    }
    return left;
  }
  function parseAnd(cursor) {
    var left = parseCompare(cursor);
    var token;
    while ((token = cursor.peek()) && token.value === 'AND') {
      cursor.next();
      left = { type: 'Binary', op: 'AND', left: left, right: parseCompare(cursor), line: token.line };
    }
    return left;
  }
  function parseOr(cursor) {
    var left = parseAnd(cursor);
    var token;
    while ((token = cursor.peek()) && token.value === 'OR') {
      cursor.next();
      left = { type: 'Binary', op: 'OR', left: left, right: parseAnd(cursor), line: token.line };
    }
    return left;
  }
  function parseExpressionCursor(cursor) { return parseOr(cursor); }
  function parseExpressionTokens(tokens, line) {
    var cursor = new TokenCursor(tokens, line);
    var expr = parseExpressionCursor(cursor);
    if (!cursor.end()) fail(line, 'Unexpected token ' + cursor.peek().value);
    return expr;
  }

  function parseAssignmentTarget(tokens, line) {
    var cursor = new TokenCursor(tokens, line);
    var token = cursor.next();
    var open;
    var close;
    var expr;
    if (!token || token.type !== 'IDENT') fail(line, 'Expected variable name');
    if (!cursor.end() && (cursor.peek().value === '(' || cursor.peek().value === '[')) {
      open = cursor.next().value;
      close = open === '(' ? ')' : ']';
      expr = parseExpressionCursor(cursor);
      cursor.expect(close);
      if (!cursor.end()) fail(line, 'Unexpected token in assignment target');
      return { type: 'Index', name: token.value, index: expr, line: line };
    }
    if (!cursor.end()) fail(line, 'Unexpected token in assignment target');
    return { type: 'Var', name: token.value, line: line };
  }

  function looksLikeAssignment(tokens) {
    return tokens.length > 2 && tokens[0].type === 'IDENT' && findTopLevel(tokens, '=') > 0;
  }

  function parsePrint(tokens, line) {
    var rest = tokens.slice(1);
    var split;
    var trailing = null;
    var items = [];
    var idx;
    if (!rest.length) return { type: 'Print', items: [], trailingSep: null, line: line };
    split = splitTopLevel(rest, { ',': 1, ';': 1 }, true);
    if (!split) fail(line, 'Invalid PRINT syntax');
    if (split.items.length && !split.items[split.items.length - 1].length && split.seps.length) {
      trailing = split.seps.pop();
      split.items.pop();
    }
    for (idx = 0; idx < split.items.length; idx++) {
      if (!split.items[idx].length) fail(line, 'PRINT expects an expression');
      items.push({ expr: parseExpressionTokens(split.items[idx], line), sep: split.seps[idx] || null });
    }
    return { type: 'Print', items: items, trailingSep: trailing, line: line };
  }

  function parseRead(tokens, line) {
    var rest = tokens.slice(1);
    var split = splitTopLevel(rest, { ',': 1 }, false);
    return {
      type: 'Read',
      targets: split && split.items.length ? split.items.map(function(item) { return parseAssignmentTarget(item, line); }) : [],
      line: line
    };
  }

  function parseDim(tokens, line) {
    return { type: 'Dim', target: parseAssignmentTarget(tokens.slice(1), line), line: line };
  }

  function parseData(tokens, line) {
    var rest = tokens.slice(1);
    var split = splitTopLevel(rest, { ',': 1 }, false);
    var items = [];
    var idx;
    if (!rest.length) fail(line, 'DATA requires at least one value');
    if (!split) fail(line, 'Invalid DATA list');
    for (idx = 0; idx < split.items.length; idx++) items.push(parseExpressionTokens(split.items[idx], line));
    return { type: 'Data', items: items, line: line };
  }

  function parseDefFn(tokens, line) {
    var cursor = new TokenCursor(tokens.slice(2), line);
    var name = cursor.next();
    var params = [];
    if (!name || name.type !== 'IDENT') fail(line, 'Expected function name');
    cursor.expect('(');
    if (!cursor.match(')')) {
      do {
        var param = cursor.next();
        if (!param || param.type !== 'IDENT') fail(line, 'Expected parameter name');
        params.push(param.value);
      } while (cursor.match(','));
      cursor.expect(')');
    }
    cursor.expect('=');
    return {
      type: 'DefFn',
      name: name.value,
      params: params,
      expr: parseExpressionTokens(cursor.tokens.slice(cursor.pos), line),
      line: line
    };
  }

  function parseInlineIf(tokens, line) {
    var thenIndex = findTopLevel(tokens, 'THEN');
    var test;
    var tail;
    var elseIndex;
    var thenStmt;
    var elseStmt;
    if (thenIndex < 0) fail(line, 'IF requires THEN');
    test = parseExpressionTokens(tokens.slice(1, thenIndex), line);
    tail = tokens.slice(thenIndex + 1);
    if (!tail.length) fail(line, 'Inline IF requires a statement after THEN');
    elseIndex = findTopLevel(tail, 'ELSE');
    thenStmt = parseSimpleStatement(elseIndex >= 0 ? tail.slice(0, elseIndex) : tail, line, false);
    elseStmt = elseIndex >= 0 ? parseSimpleStatement(tail.slice(elseIndex + 1), line, false) : null;
    return { type: 'If', test: test, thenBody: thenStmt ? [thenStmt] : [], elseBody: elseStmt ? [elseStmt] : [], singleLine: true, line: line };
  }

  function parseSimpleStatement(tokens, line, allowBlocks) {
    var eq;
    var toIndexPos;
    var stepPos;
    var rest;
    var loopMode;
    tokens = trimLineTokens(tokens);
    if (!tokens.length) return null;
    if (tokens[0].type === 'COMMENT') return { type: 'Comment', text: tokens[0].value, line: line };
    if (tokens[0].value === 'LET') {
      eq = findTopLevel(tokens, '=');
      if (eq < 0) fail(line, 'LET requires =');
      return { type: 'Assign', target: parseAssignmentTarget(tokens.slice(1, eq), line), value: parseExpressionTokens(tokens.slice(eq + 1), line), line: line };
    }
    if (tokens[0].value === 'PRINT') return parsePrint(tokens, line);
    if (tokens[0].value === 'INPUT') return { type: 'Input', target: parseAssignmentTarget(tokens.slice(1), line), line: line };
    if (tokens[0].value === 'GOTO') return { type: 'Goto', label: tokens[1] ? tokens[1].value : '', line: line };
    if (tokens[0].value === 'GOSUB') return { type: 'Gosub', label: tokens[1] ? tokens[1].value : '', line: line };
    if (tokens[0].value === 'RETURN') return { type: 'Return', line: line };
    if (tokens[0].value === 'RESTORE') return { type: 'Restore', line: line };
    if (tokens[0].value === 'READ') return parseRead(tokens, line);
    if (tokens[0].value === 'DATA') return parseData(tokens, line);
    if (tokens[0].value === 'DIM') return parseDim(tokens, line);
    if (tokens[0].value === 'SLEEP') return { type: 'Sleep', expr: parseExpressionTokens(tokens.slice(1), line), line: line };
    if (tokens[0].value === 'END' && tokens.length === 1) return { type: 'End', line: line };
    if (tokens[0].value === 'DEF' && tokens[1] && tokens[1].value === 'FN') return parseDefFn(tokens, line);
    if (tokens[0].value === 'IF') return parseInlineIf(tokens, line);
    if (allowBlocks && tokens[0].value === 'FOR') {
      toIndexPos = findTopLevel(tokens, 'TO');
      stepPos = findTopLevel(tokens, 'STEP');
      if (toIndexPos < 0) fail(line, 'FOR requires TO');
      eq = findTopLevel(tokens, '=');
      if (eq !== 2 || tokens[1].type !== 'IDENT') fail(line, 'Invalid FOR syntax');
      return {
        type: 'ForHeader',
        name: tokens[1].value,
        start: parseExpressionTokens(tokens.slice(3, toIndexPos), line),
        end: parseExpressionTokens(tokens.slice(toIndexPos + 1, stepPos >= 0 ? stepPos : tokens.length), line),
        step: stepPos >= 0 ? parseExpressionTokens(tokens.slice(stepPos + 1), line) : { type: 'Number', value: 1, line: line },
        line: line
      };
    }
    if (allowBlocks && tokens[0].value === 'WHILE') return { type: 'WhileHeader', test: parseExpressionTokens(tokens.slice(1), line), line: line };
    if (allowBlocks && tokens[0].value === 'DO') return { type: 'DoHeader', line: line };
    if (looksLikeAssignment(tokens)) {
      eq = findTopLevel(tokens, '=');
      return { type: 'Assign', target: parseAssignmentTarget(tokens.slice(0, eq), line), value: parseExpressionTokens(tokens.slice(eq + 1), line), line: line };
    }
    if ((tokens[0].type === 'IDENT' || tokens[0].type === 'KEYWORD') && tokens[1] && (tokens[1].value === '(' || tokens[1].value === '[')) {
      return { type: 'Expr', expr: parseExpressionTokens(tokens, line), line: line };
    }
    if (tokens[0].value === 'LOOP') {
      loopMode = tokens[1] ? tokens[1].value : null;
      rest = tokens.slice(2);
      return { type: 'LoopTail', mode: loopMode, test: rest.length ? parseExpressionTokens(rest, line) : null, line: line };
    }
    fail(line, 'Unknown statement ' + tokens[0].value);
  }

  function parseOnBlock(lines, index, allowEvents) {
    var current = lines[index];
    var tokens = trimLineTokens(current.tokens);
    var eventToken = tokens[1];
    var body;
    var stop;
    if (!allowEvents) fail(current.line, 'ON blocks are only allowed at the top level');
    if (!eventToken || (eventToken.type !== 'IDENT' && eventToken.type !== 'KEYWORD')) fail(current.line, 'ON requires an event name');
    if (!tokens[2] || tokens[2].value !== ':' || tokens.length !== 3) fail(current.line, 'ON requires ON <event>:');
    body = parseBlock(lines, index + 1, function(lineTokens) { return lineStarts(lineTokens, ['END', 'ON']); }, false);
    index = body.index;
    if (index >= lines.length) fail(current.line, 'Missing END ON');
    stop = trimLineTokens(lines[index].tokens);
    if (!lineStarts(stop, ['END', 'ON']) || stop.length !== 2) fail(lines[index].line, 'Expected END ON');
    return { node: { type: 'OnEvent', event: eventToken.value.toLowerCase(), body: body.body, line: current.line }, index: index + 1 };
  }

  function parseBlock(lines, index, stopFn, allowEvents) {
    var body = [];
    var current;
    var tokens;
    var parsed;
    if (allowEvents == null) allowEvents = true;
    while (index < lines.length) {
      current = lines[index];
      tokens = trimLineTokens(current.tokens);
      if (!tokens.length) { index++; continue; }
      if (stopFn && stopFn(tokens)) break;
      if (tokens[0].type === 'COMMENT') {
        body.push({ type: 'Comment', text: tokens[0].value, line: current.line });
        index++;
        continue;
      }
      if (tokens[0].value === 'ON') {
        parsed = parseOnBlock(lines, index, allowEvents);
        body.push(parsed.node);
        index = parsed.index;
        continue;
      }
      if (tokens[0].type === 'IDENT' && tokens[1] && tokens[1].value === ':') {
        body.push({ type: 'Label', name: tokens[0].value, line: current.line });
        tokens = trimLineTokens(tokens.slice(2));
        if (!tokens.length) { index++; continue; }
        parsed = parseSimpleStatement(tokens, current.line, false);
        if (parsed) body.push(parsed);
        index++;
        continue;
      }
      if (tokens[0].value === 'IF') {
        parsed = parseIfBlock(lines, index);
        body.push(parsed.node);
        index = parsed.index;
        continue;
      }
      if (tokens[0].value === 'FOR') {
        parsed = parseForBlock(lines, index);
        body.push(parsed.node);
        index = parsed.index;
        continue;
      }
      if (tokens[0].value === 'WHILE') {
        parsed = parseWhileBlock(lines, index);
        body.push(parsed.node);
        index = parsed.index;
        continue;
      }
      if (tokens[0].value === 'DO') {
        parsed = parseDoBlock(lines, index);
        body.push(parsed.node);
        index = parsed.index;
        continue;
      }
      body.push(parseSimpleStatement(tokens, current.line, true));
      index++;
    }
    return { body: body, index: index };
  }

  function parseIfBlock(lines, index) {
    var current = lines[index];
    var tokens = trimLineTokens(current.tokens);
    var thenIndex = findTopLevel(tokens, 'THEN');
    var thenBlock;
    var elseBlock = [];
    var stop;
    if (thenIndex < 0) fail(current.line, 'IF requires THEN');
    if (tokens.length > thenIndex + 1) return { node: parseInlineIf(tokens, current.line), index: index + 1 };
    thenBlock = parseBlock(lines, index + 1, function(lineTokens) {
      return lineStarts(lineTokens, ['ELSE']) || lineStarts(lineTokens, ['END', 'IF']);
    }, false);
    index = thenBlock.index;
    if (index >= lines.length) fail(current.line, 'Missing END IF');
    stop = trimLineTokens(lines[index].tokens);
    if (lineStarts(stop, ['ELSE'])) {
      var parsedElse = parseBlock(lines, index + 1, function(lineTokens) { return lineStarts(lineTokens, ['END', 'IF']); }, false);
      elseBlock = parsedElse.body;
      index = parsedElse.index;
      if (index >= lines.length) fail(current.line, 'Missing END IF');
      stop = trimLineTokens(lines[index].tokens);
    }
    if (!lineStarts(stop, ['END', 'IF'])) fail(lines[index].line, 'Expected END IF');
    return {
      node: { type: 'If', test: parseExpressionTokens(tokens.slice(1, thenIndex), current.line), thenBody: thenBlock.body, elseBody: elseBlock, singleLine: false, line: current.line },
      index: index + 1
    };
  }

  function parseForBlock(lines, index) {
    var current = lines[index];
    var header = parseSimpleStatement(trimLineTokens(current.tokens), current.line, true);
    var body = parseBlock(lines, index + 1, function(tokens) { return lineStarts(tokens, ['NEXT']); }, false);
    var nextTokens = trimLineTokens(lines[body.index] ? lines[body.index].tokens : []);
    if (!nextTokens.length || nextTokens[0].value !== 'NEXT') fail(current.line, 'Missing NEXT ' + header.name);
    if (nextTokens[1] && nextTokens[1].type === 'IDENT' && nextTokens[1].value !== header.name) fail(lines[body.index].line, 'NEXT variable does not match FOR');
    return { node: { type: 'For', name: header.name, start: header.start, end: header.end, step: header.step, body: body.body, line: current.line }, index: body.index + 1 };
  }

  function parseWhileBlock(lines, index) {
    var current = lines[index];
    var header = parseSimpleStatement(trimLineTokens(current.tokens), current.line, true);
    var body = parseBlock(lines, index + 1, function(tokens) { return lineStarts(tokens, ['WEND']); }, false);
    var tail = trimLineTokens(lines[body.index] ? lines[body.index].tokens : []);
    if (!tail.length || tail[0].value !== 'WEND') fail(current.line, 'Missing WEND');
    return { node: { type: 'While', test: header.test, body: body.body, line: current.line }, index: body.index + 1 };
  }

  function parseDoBlock(lines, index) {
    var current = lines[index];
    var body = parseBlock(lines, index + 1, function(tokens) { return lineStarts(tokens, ['LOOP']); }, false);
    var tail = parseSimpleStatement(trimLineTokens(lines[body.index] ? lines[body.index].tokens : []), lines[body.index] ? lines[body.index].line : current.line, false);
    if (!tail || tail.type !== 'LoopTail') fail(current.line, 'Missing LOOP');
    if (tail.mode && tail.mode !== 'WHILE' && tail.mode !== 'UNTIL') fail(tail.line, 'LOOP only supports WHILE or UNTIL');
    return { node: { type: 'DoLoop', mode: tail.mode || null, test: tail.test, body: body.body, line: current.line }, index: body.index + 1 };
  }

  function parse(source) {
    var tokens = Array.isArray(source) ? source : tokenize(source);
    var grouped = groupLines(tokens);
    var parsed = parseBlock(grouped, 0, null, true);
    if (parsed.index !== grouped.length) fail(grouped[parsed.index].line, 'Unexpected trailing content');
    return { type: 'Program', body: parsed.body, tokens: tokens };
  }

  function constEval(node) {
    var left;
    var right;
    if (!node) return { ok: false };
    if (node.type === 'Number') return { ok: true, value: node.value };
    if (node.type === 'String') return { ok: true, value: node.value };
    if (node.type === 'Boolean') return { ok: true, value: node.value ? 1 : 0 };
    if (node.type === 'Unary') {
      left = constEval(node.expr);
      if (!left.ok) return left;
      if (node.op === '-') return { ok: true, value: -toNumber(left.value) };
      if (node.op === 'NOT') return { ok: true, value: boolValue(!left.value) };
      return { ok: false };
    }
    if (node.type === 'Binary') {
      left = constEval(node.left);
      right = constEval(node.right);
      if (!left.ok || !right.ok) return { ok: false };
      switch (node.op) {
        case '+': return { ok: true, value: (typeof left.value === 'string' || typeof right.value === 'string') ? String(left.value) + String(right.value) : toNumber(left.value) + toNumber(right.value) };
        case '-': return { ok: true, value: toNumber(left.value) - toNumber(right.value) };
        case '*': return { ok: true, value: toNumber(left.value) * toNumber(right.value) };
        case '/': return { ok: true, value: toNumber(left.value) / toNumber(right.value) };
        case 'MOD': return { ok: true, value: toNumber(left.value) % toNumber(right.value) };
        case '^': return { ok: true, value: Math.pow(toNumber(left.value), toNumber(right.value)) };
        case '=': return { ok: true, value: boolValue(left.value === right.value) };
        case '<>': return { ok: true, value: boolValue(left.value !== right.value) };
        case '<': return { ok: true, value: boolValue(left.value < right.value) };
        case '>': return { ok: true, value: boolValue(left.value > right.value) };
        case '<=': return { ok: true, value: boolValue(left.value <= right.value) };
        case '>=': return { ok: true, value: boolValue(left.value >= right.value) };
        case 'AND': return { ok: true, value: boolValue(left.value && right.value) };
        case 'OR': return { ok: true, value: boolValue(left.value || right.value) };
      }
    }
    return { ok: false };
  }

  function makeBuiltinEntries() {
    var entries = [];
    function arrayValue(value) { return Array.isArray(value) ? value : []; }
    function firstChar(value) { value = valueToString(value); return value ? value.charCodeAt(0) : 0; }
    function trunc(value) { value = toNumber(value); return value < 0 ? Math.ceil(value) : Math.floor(value); }
    function add(name, impl) { entries[BUILTIN_IDS[name]] = { type: 'builtin', name: name, impl: impl }; }
    add('ABS', function(args) { return Math.abs(toNumber(args[0])); });
    add('INT', function(args) { return Math.floor(toNumber(args[0])); });
    add('FIX', function(args) { return trunc(args[0]); });
    add('SGN', function(args) { var n = toNumber(args[0]); return n > 0 ? 1 : (n < 0 ? -1 : 0); });
    add('SQR', function(args) { return Math.sqrt(toNumber(args[0])); });
    add('RND', function() { return Math.random(); });
    add('SIN', function(args) { return Math.sin(toNumber(args[0])); });
    add('COS', function(args) { return Math.cos(toNumber(args[0])); });
    add('TAN', function(args) { return Math.tan(toNumber(args[0])); });
    add('ATN', function(args) { return Math.atan(toNumber(args[0])); });
    add('LOG', function(args) { return Math.log(toNumber(args[0])); });
    add('EXP', function(args) { return Math.exp(toNumber(args[0])); });
    add('MIN', function(args) { return Math.min.apply(Math, args.map(toNumber)); });
    add('MAX', function(args) { return Math.max.apply(Math, args.map(toNumber)); });
    add('LEN', function(args) {
      var value = args[0];
      if (Array.isArray(value) || typeof value === 'string') return value.length;
      if (value == null) return 0;
      return String(value).length;
    });
    add('MID$', function(args) {
      var value = valueToString(args[0]);
      var start = Math.max(0, trunc(args[1]) - 1);
      var length = args.length > 2 ? Math.max(0, trunc(args[2])) : undefined;
      return value.substr(start, length);
    });
    add('LEFT$', function(args) { return valueToString(args[0]).slice(0, Math.max(0, trunc(args[1]))); });
    add('RIGHT$', function(args) { var v = valueToString(args[0]); return v.slice(Math.max(0, v.length - Math.max(0, trunc(args[1])))); });
    add('CHR$', function(args) { return String.fromCharCode(trunc(args[0]) & 65535); });
    add('ASC', function(args) { return firstChar(args[0]); });
    add('STR$', function(args) { return String(toNumber(args[0])); });
    add('VAL', function(args) { var n = parseFloat(valueToString(args[0]).trim()); return isNaN(n) ? 0 : n; });
    add('UPPER$', function(args) { return valueToString(args[0]).toUpperCase(); });
    add('LOWER$', function(args) { return valueToString(args[0]).toLowerCase(); });
    add('INSTR', function(args) { var idx = valueToString(args[0]).indexOf(valueToString(args[1])); return idx < 0 ? 0 : idx + 1; });
    add('TRIM$', function(args) { return valueToString(args[0]).trim(); });
    add('PUSH', function(args) { var arr = arrayValue(args[0]); arr.push(args[1]); return arr.length; });
    add('POP', function(args) { return arrayValue(args[0]).pop(); });
    add('SHIFT', function(args) { return arrayValue(args[0]).shift(); });
    add('EMIT', function(args, api) { return api.emit(args[0]); });
    add('EMIT_U8', function(args, api) { return api.emitU8(args[0]); });
    add('EMIT_U16', function(args, api) { return api.emitU16(args[0]); });
    add('EMIT_U32', function(args, api) { return api.emitU32(args[0]); });
    add('EMIT_STR', function(args, api) { return api.emitString(args[0]); });
    add('EMIT_CRLF', function(args, api) { api.emitU8(13); return api.emitU8(10); });
    add('PEEK', function(args) {
      var value = readBufferByte(args[0], args[1]);
      if (value == null) throw new Error('Buffer read out of bounds');
      return value;
    });
    add('PEEK_U16', function(args) {
      var b0 = readBufferByte(args[0], args[1]);
      var b1 = readBufferByte(args[0], toIndex(args[1]) + 1);
      if (b0 == null || b1 == null) throw new Error('Buffer read out of bounds');
      return b0 | (b1 << 8);
    });
    add('PEEK_U32', function(args) {
      var base = toIndex(args[1]);
      var b0 = readBufferByte(args[0], base);
      var b1 = readBufferByte(args[0], base + 1);
      var b2 = readBufferByte(args[0], base + 2);
      var b3 = readBufferByte(args[0], base + 3);
      if (b0 == null || b1 == null || b2 == null || b3 == null) throw new Error('Buffer read out of bounds');
      return ((b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0);
    });
    add('SLICE', function(args) { return sliceBufferValue(args[0], args[1], args[2]); });
    add('BUF_LEN', function(args) { return bufferLength(args[0]); });
    return entries;
  }
  DEFAULT_BUILTINS = makeBuiltinEntries();

  function compile(source) {
    var ast = typeof source === 'string' ? parse(source) : source;
    var bytes = [];
    var sourceMap = [];
    var data = [];
    var publicSymbols = {};
    var allSymbols = {};
    var internalSymbols = {};
    var labels = {};
    var unresolved = [];
    var callArgs = {};
    var builtinEntries = DEFAULT_BUILTINS.slice();
    var userFunctions = {};
    var nextVar = 0;
    var loopCounter = 0;
    var entries = { main: 0 };
    var needsLandingPad = false;
    var i;

    function offset() { return bytes.length; }
    function mapLine(line) { sourceMap.push({ offset: bytes.length, line: line || 0 }); }
    function emitByte(value) { bytes.push(value & 255); }
    function emitU16(value) { bytes.push(value & 255, (value >> 8) & 255); }
    function emitF64(value) {
      var buffer = new ArrayBuffer(8);
      var view = new DataView(buffer);
      var arr = new Uint8Array(buffer);
      var idx;
      view.setFloat64(0, Number(value), true);
      for (idx = 0; idx < arr.length; idx++) bytes.push(arr[idx]);
    }
    function emitString(value) {
      var text = String(value);
      var idx;
      if (text.length > 65535) fail(0, 'String literal too long');
      emitU16(text.length);
      for (idx = 0; idx < text.length; idx++) emitByte(text.charCodeAt(idx) & 255);
    }
    function emitOp(code, line) { mapLine(line); emitByte(code); return bytes.length - 1; }
    function emitJump(code, line) { emitOp(code, line); emitU16(0); return bytes.length - 2; }
    function patch(pos, target) {
      if (target > 65535) fail(0, 'Program too large for 16-bit address space');
      bytes[pos] = target & 255;
      bytes[pos + 1] = (target >> 8) & 255;
    }
    function allocVar(name, internal) {
      var key = normName(name);
      if (!own(allSymbols, key)) allSymbols[key] = nextVar++;
      if (internal) internalSymbols[key] = 1;
      else publicSymbols[key] = allSymbols[key];
      return allSymbols[key];
    }
    function getVar(name) { return allocVar(name, false); }
    function getInternal(name) { return allocVar(name, true); }
    function collectFunctions(list) {
      var idx;
      var node;
      for (idx = 0; idx < list.length; idx++) {
        node = list[idx];
        if (!node) continue;
        if (node.type === 'DefFn') userFunctions[node.name] = { name: node.name, params: node.params.slice(), expr: node.expr, line: node.line };
        if (node.thenBody) collectFunctions(node.thenBody);
        if (node.elseBody) collectFunctions(node.elseBody);
        if (node.body) collectFunctions(node.body);
      }
    }
    function registerFunctions() {
      var name;
      for (name in userFunctions) if (own(userFunctions, name)) builtinEntries.push({ type: 'user', name: name, fn: userFunctions[name] });
    }
    function builtinId(name) {
      var idx;
      name = normName(name);
      if (own(BUILTIN_IDS, name)) return BUILTIN_IDS[name];
      for (idx = 0; idx < builtinEntries.length; idx++) if (builtinEntries[idx] && builtinEntries[idx].type === 'user' && builtinEntries[idx].name === name) return idx;
      return -1;
    }
    function compileCall(name, args, line) {
      var idx;
      var id = builtinId(name);
      if (id < 0) fail(line, 'Unknown function ' + name);
      for (idx = 0; idx < args.length; idx++) compileExpr(args[idx]);
      callArgs[emitOp(OPCODES.BUILTIN, line)] = args.length;
      emitByte(id);
    }
    function compileExpr(node) {
      var idx;
      var info;
      if (!node) fail(0, 'Missing expression');
      switch (node.type) {
        case 'Number': emitOp(OPCODES.PUSH_NUM, node.line); emitF64(node.value); break;
        case 'String': emitOp(OPCODES.PUSH_STR, node.line); emitString(node.value); break;
        case 'Boolean': emitOp(node.value ? OPCODES.PUSH_TRUE : OPCODES.PUSH_FALSE, node.line); break;
        case 'Var': emitOp(OPCODES.LOAD, node.line); emitU16(getVar(node.name)); break;
        case 'Access':
          if (node.args.length === 1 && builtinId(node.name) < 0) {
            compileExpr(node.args[0]);
            emitOp(OPCODES.LOAD_ARR, node.line);
            emitU16(getVar(node.name));
          } else compileCall(node.name, node.args, node.line);
          break;
        case 'Unary':
          compileExpr(node.expr);
          emitOp(node.op === '-' ? OPCODES.NEG : OPCODES.NOT, node.line);
          break;
        case 'Binary':
          compileExpr(node.left);
          compileExpr(node.right);
          info = {
            '+': OPCODES.ADD, '-': OPCODES.SUB, '*': OPCODES.MUL, '/': OPCODES.DIV,
            MOD: OPCODES.MOD, '^': OPCODES.POW, '=': OPCODES.EQ, '<>': OPCODES.NE,
            '<': OPCODES.LT, '>': OPCODES.GT, '<=': OPCODES.LE, '>=': OPCODES.GE,
            AND: OPCODES.AND, OR: OPCODES.OR
          };
          emitOp(info[node.op], node.line);
          break;
        default:
          fail(node.line || 0, 'Cannot compile expression type ' + node.type);
      }
    }
    function compileStatement(node) {
      var idx;
      var condFalse;
      var endJump;
      var loopStart;
      var loopEnd;
      var endIdx;
      var stepIdx;
      var negJump;
      var afterCompare;
      var size;
      var literal;
      switch (node.type) {
        case 'Comment':
          break;
        case 'Label':
          if (own(labels, node.name)) fail(node.line, 'Duplicate label ' + node.name);
          labels[node.name] = offset();
          break;
        case 'Expr':
          compileExpr(node.expr);
          emitOp(OPCODES.POP, node.line);
          break;
        case 'Assign':
          if (node.target.type === 'Index') {
            compileExpr(node.target.index);
            compileExpr(node.value);
            emitOp(OPCODES.STORE_ARR, node.line);
            emitU16(getVar(node.target.name));
          } else {
            compileExpr(node.value);
            emitOp(OPCODES.STORE, node.line);
            emitU16(getVar(node.target.name));
          }
          break;
        case 'Print':
          if (!node.items.length) emitOp(OPCODES.PRINTLN, node.line);
          for (idx = 0; idx < node.items.length; idx++) {
            compileExpr(node.items[idx].expr);
            emitOp(OPCODES.PRINT, node.line);
            if (node.items[idx].sep === ',') {
              emitOp(OPCODES.PUSH_STR, node.line);
              emitString(' ');
              emitOp(OPCODES.PRINT, node.line);
            }
          }
          if (!node.trailingSep) emitOp(OPCODES.PRINTLN, node.line);
          break;
        case 'Input':
          if (node.target.type === 'Index') {
            compileExpr(node.target.index);
            emitOp(OPCODES.INPUT, node.line);
            emitOp(OPCODES.STORE_ARR, node.line);
            emitU16(getVar(node.target.name));
          } else {
            emitOp(OPCODES.INPUT, node.line);
            emitOp(OPCODES.STORE, node.line);
            emitU16(getVar(node.target.name));
          }
          break;
        case 'If':
          compileExpr(node.test);
          condFalse = emitJump(OPCODES.JZ, node.line);
          for (idx = 0; idx < node.thenBody.length; idx++) compileStatement(node.thenBody[idx]);
          if (node.elseBody && node.elseBody.length) {
            endJump = emitJump(OPCODES.JMP, node.line);
            patch(condFalse, offset());
            for (idx = 0; idx < node.elseBody.length; idx++) compileStatement(node.elseBody[idx]);
            patch(endJump, offset());
          } else patch(condFalse, offset());
          break;
        case 'For':
          endIdx = getInternal('~FOR_END_' + (loopCounter + 1));
          stepIdx = getInternal('~FOR_STEP_' + (loopCounter + 1));
          loopCounter++;
          compileExpr(node.start);
          emitOp(OPCODES.STORE, node.line); emitU16(getVar(node.name));
          compileExpr(node.end);
          emitOp(OPCODES.STORE, node.line); emitU16(endIdx);
          compileExpr(node.step);
          emitOp(OPCODES.STORE, node.line); emitU16(stepIdx);
          loopStart = offset();
          emitOp(OPCODES.LOAD, node.line); emitU16(stepIdx);
          emitOp(OPCODES.PUSH_NUM, node.line); emitF64(0);
          emitOp(OPCODES.GT, node.line);
          negJump = emitJump(OPCODES.JZ, node.line);
          emitOp(OPCODES.LOAD, node.line); emitU16(getVar(node.name));
          emitOp(OPCODES.LOAD, node.line); emitU16(endIdx);
          emitOp(OPCODES.LE, node.line);
          afterCompare = emitJump(OPCODES.JMP, node.line);
          patch(negJump, offset());
          emitOp(OPCODES.LOAD, node.line); emitU16(getVar(node.name));
          emitOp(OPCODES.LOAD, node.line); emitU16(endIdx);
          emitOp(OPCODES.GE, node.line);
          patch(afterCompare, offset());
          loopEnd = emitJump(OPCODES.JZ, node.line);
          for (idx = 0; idx < node.body.length; idx++) compileStatement(node.body[idx]);
          emitOp(OPCODES.LOAD, node.line); emitU16(getVar(node.name));
          emitOp(OPCODES.LOAD, node.line); emitU16(stepIdx);
          emitOp(OPCODES.ADD, node.line);
          emitOp(OPCODES.STORE, node.line); emitU16(getVar(node.name));
          emitOp(OPCODES.JMP, node.line); emitU16(loopStart);
          patch(loopEnd, offset());
          break;
        case 'While':
          loopStart = offset();
          compileExpr(node.test);
          loopEnd = emitJump(OPCODES.JZ, node.line);
          for (idx = 0; idx < node.body.length; idx++) compileStatement(node.body[idx]);
          emitOp(OPCODES.JMP, node.line); emitU16(loopStart);
          patch(loopEnd, offset());
          break;
        case 'DoLoop':
          loopStart = offset();
          for (idx = 0; idx < node.body.length; idx++) compileStatement(node.body[idx]);
          if (!node.mode) {
            emitOp(OPCODES.JMP, node.line); emitU16(loopStart);
          } else {
            compileExpr(node.test);
            emitOp(node.mode === 'WHILE' ? OPCODES.JNZ : OPCODES.JZ, node.line);
            emitU16(loopStart);
          }
          break;
        case 'Goto':
          emitOp(OPCODES.JMP, node.line);
          unresolved.push({ pos: offset(), label: node.label, line: node.line });
          emitU16(0);
          break;
        case 'Gosub':
          emitOp(OPCODES.CALL, node.line);
          unresolved.push({ pos: offset(), label: node.label, line: node.line });
          emitU16(0);
          break;
        case 'Return':
          emitOp(OPCODES.RET, node.line);
          break;
        case 'Dim':
          if (node.target.type !== 'Index') fail(node.line, 'DIM requires array syntax');
          size = constEval(node.target.index);
          if (!size.ok) fail(node.line, 'DIM size must be a constant expression');
          emitOp(OPCODES.DIM, node.line);
          emitU16(getVar(node.target.name));
          emitU16(Math.max(0, toIndex(size.value)));
          break;
        case 'Data':
          for (idx = 0; idx < node.items.length; idx++) {
            literal = constEval(node.items[idx]);
            if (!literal.ok) fail(node.line, 'DATA only supports literal values');
            data.push(literal.value);
          }
          break;
        case 'Read':
          for (idx = 0; idx < node.targets.length; idx++) {
            if (node.targets[idx].type === 'Index') {
              compileExpr(node.targets[idx].index);
              emitOp(OPCODES.READ, node.line);
              emitOp(OPCODES.STORE_ARR, node.line);
              emitU16(getVar(node.targets[idx].name));
            } else {
              emitOp(OPCODES.READ, node.line);
              emitOp(OPCODES.STORE, node.line);
              emitU16(getVar(node.targets[idx].name));
            }
          }
          break;
        case 'Restore':
          emitOp(OPCODES.RESTORE, node.line);
          break;
        case 'DefFn':
          break;
        case 'OnEvent':
          if (own(entries, node.event)) fail(node.line, 'Duplicate event handler ' + node.event);
          endJump = emitJump(OPCODES.JMP, node.line);
          entries[node.event] = offset();
          for (idx = 0; idx < node.body.length; idx++) compileStatement(node.body[idx]);
          emitOp(OPCODES.HALT, node.line);
          patch(endJump, offset());
          break;
        case 'End':
          emitOp(OPCODES.HALT, node.line);
          break;
        case 'Sleep':
          compileExpr(node.expr);
          emitOp(OPCODES.SLEEP, node.line);
          break;
        default:
          fail(node.line || 0, 'Unknown statement type ' + node.type);
      }
    }

    collectFunctions(ast.body);
    registerFunctions();
    for (i = 0; i < ast.body.length; i++) {
      compileStatement(ast.body[i]);
      if (!ast.body[i]) continue;
      if (ast.body[i].type === 'OnEvent') needsLandingPad = true;
      else if (ast.body[i].type !== 'Comment' && ast.body[i].type !== 'DefFn' && ast.body[i].type !== 'Label') needsLandingPad = false;
    }
    if (needsLandingPad || !bytes.length || bytes[bytes.length - 1] !== OPCODES.HALT) emitOp(OPCODES.HALT, 0);
    for (i = 0; i < unresolved.length; i++) {
      if (!own(labels, unresolved[i].label)) fail(unresolved[i].line, 'Unknown label ' + unresolved[i].label);
      patch(unresolved[i].pos, labels[unresolved[i].label]);
    }
    return {
      bytecode: new Uint8Array(bytes),
      data: data,
      symbols: publicSymbols,
      _symbols: allSymbols,
      labels: labels,
      sourceMap: sourceMap,
      callArgs: callArgs,
      builtinEntries: builtinEntries,
      userFunctions: userFunctions,
      entries: entries
    };
  }

  function lineForOffset(map, pc) {
    var line = 0;
    var idx;
    map = Array.isArray(map) ? map : [];
    for (idx = 0; idx < map.length; idx++) {
      if (map[idx].offset > pc) break;
      line = map[idx].line;
    }
    return line;
  }

  function disassembleInstruction(bytecodeObj, pc) {
    var code = bytecodeObj.bytecode || new Uint8Array(0);
    var entries = bytecodeObj.builtinEntries || DEFAULT_BUILTINS;
    var callArgs = bytecodeObj.callArgs || {};
    var start = pc;
    var op = code[pc++];
    var view;
    var len;
    var text = OPCODE_NAMES[op] || ('DB ' + op);
    function readU16() { var value = code[pc] | (code[pc + 1] << 8); pc += 2; return value; }
    function readF64() {
      var buffer = new ArrayBuffer(8);
      var arr = new Uint8Array(buffer);
      var idx;
      view = new DataView(buffer);
      for (idx = 0; idx < 8; idx++) arr[idx] = code[pc + idx];
      pc += 8;
      return view.getFloat64(0, true);
    }
    function readStr() {
      var out = '';
      var idx;
      len = readU16();
      for (idx = 0; idx < len; idx++) out += String.fromCharCode(code[pc + idx]);
      pc += len;
      return out;
    }
    switch (op) {
      case OPCODES.PUSH_NUM: text += ' ' + readF64(); break;
      case OPCODES.PUSH_STR: text += ' ' + quoteString(readStr()); break;
      case OPCODES.LOAD:
      case OPCODES.STORE:
      case OPCODES.LOAD_ARR:
      case OPCODES.STORE_ARR:
      case OPCODES.JMP:
      case OPCODES.JZ:
      case OPCODES.JNZ:
      case OPCODES.CALL:
        text += ' ' + readU16();
        break;
      case OPCODES.DIM:
        text += ' ' + readU16() + ' ' + readU16();
        break;
      case OPCODES.BUILTIN:
        var id = code[pc++];
        text += ' ' + ((entries[id] && entries[id].name) || id);
        if (own(callArgs, start)) text += ' ' + callArgs[start];
        break;
    }
    return { nextPc: pc, text: ('0000' + start).slice(-4) + ': ' + text, offset: start };
  }

  function createVM(opts) {
    opts = opts || {};
    var config = {
      maxCycles: opts.maxCycles == null ? 1000000 : opts.maxCycles,
      maxBlocksPerEvent: opts.maxBlocksPerEvent == null ? null : opts.maxBlocksPerEvent,
      maxEmitBytes: opts.maxEmitBytes == null ? 65536 : opts.maxEmitBytes,
      maxSlices: opts.maxSlices == null ? 16 : opts.maxSlices,
      strict: opts.strict !== false,
      inputFn: typeof opts.inputFn === 'function' ? opts.inputFn : function() { return ''; },
      printFn: typeof opts.printFn === 'function' ? opts.printFn : function() {},
      trace: !!opts.trace,
      async: !!opts.async,
      startPc: opts.startPc == null ? null : opts.startPc,
      blockMeta: opts.blockMeta || opts.blockLeaders || null
    };
    var program = null;
    var bytecode = new Uint8Array(0);
    var builtins = DEFAULT_BUILTINS.slice();
    var publicSymbols = {};
    var allSymbols = {};
    var reverseSymbols = [];
    var variables = [];
    var stack = [];
    var callStack = [];
    var data = [];
    var output = [];
    var emitBuffer = [];
    var pc = 0;
    var cycles = 0;
    var halted = true;
    var dataPos = 0;
    var haltReason = null;
    var lastError = null;
    var emitCount = 0;
    var blockVisits = 0;
    var currentBlock = null;
    var blockTrace = [];
    var blockMeta = null;
    var currentInstructionOffset = 0;

    function readU16() { var value = bytecode[pc] | (bytecode[pc + 1] << 8); pc += 2; return value; }
    function readF64() {
      var buffer = new ArrayBuffer(8);
      var arr = new Uint8Array(buffer);
      var view = new DataView(buffer);
      var idx;
      for (idx = 0; idx < 8; idx++) arr[idx] = bytecode[pc + idx];
      pc += 8;
      return view.getFloat64(0, true);
    }
    function readStr() {
      var len = readU16();
      var out = '';
      var idx;
      for (idx = 0; idx < len; idx++) out += String.fromCharCode(bytecode[pc + idx]);
      pc += len;
      return out;
    }
    function runtimeError(message, at, reason) {
      var line = lineForOffset(program && program.sourceMap, at == null ? pc : at);
      var err = new Error('Line ' + (line || 0) + ': ' + message);
      err.line = line || 0;
      err.runtime = true;
      err.reason = reason || 'strict_error';
      throw err;
    }
    function currentVariables() {
      var out = {};
      var name;
      for (name in publicSymbols) if (own(publicSymbols, name)) out[name] = cloneValue(variables[publicSymbols[name]]);
      return out;
    }
    function getVarByName(name) {
      name = normName(name);
      return own(allSymbols, name) ? variables[allSymbols[name]] : undefined;
    }
    function setVarByName(name, value, internalOnly) {
      var key = normName(name);
      if (own(allSymbols, key)) variables[allSymbols[key]] = cloneValue(value);
      else {
        allSymbols[key] = variables.length;
        reverseSymbols[variables.length] = key;
        variables.push(cloneValue(value));
      }
      if (!internalOnly && !own(publicSymbols, key)) publicSymbols[key] = allSymbols[key];
    }
    function invokeByName(name, args, at, depth, locals) {
      var idx;
      name = normName(name);
      for (idx = 0; idx < builtins.length; idx++) if (builtins[idx] && builtins[idx].name === name) return invokeBuiltin(idx, args, at, depth, locals);
      runtimeError('Unknown function ' + name, at);
    }
    function evaluateUserExpr(node, locals, at, depth) {
      var left;
      var right;
      var arr;
      var idx;
      if (depth > 128) runtimeError('Function recursion too deep', at);
      switch (node.type) {
        case 'Number': return node.value;
        case 'String': return node.value;
        case 'Boolean': return node.value ? 1 : 0;
        case 'Var': return own(locals, node.name) ? locals[node.name] : getVarByName(node.name);
        case 'Access':
          if (node.args.length === 1 && !own(BUILTIN_IDS, node.name) && !(program && program.userFunctions && own(program.userFunctions, node.name))) {
            arr = own(locals, node.name) ? locals[node.name] : getVarByName(node.name);
            idx = toIndex(evaluateUserExpr(node.args[0], locals, at, depth + 1));
            return (Array.isArray(arr) || isUint8Array(arr)) ? arr[idx] : 0;
          }
          return invokeByName(node.name, node.args.map(function(arg) { return evaluateUserExpr(arg, locals, at, depth + 1); }), at, depth + 1, locals);
        case 'Unary':
          left = evaluateUserExpr(node.expr, locals, at, depth + 1);
          return node.op === '-' ? -toNumber(left) : boolValue(!left);
        case 'Binary':
          left = evaluateUserExpr(node.left, locals, at, depth + 1);
          right = evaluateUserExpr(node.right, locals, at, depth + 1);
          switch (node.op) {
            case '+': return (typeof left === 'string' || typeof right === 'string') ? String(left) + String(right) : toNumber(left) + toNumber(right);
            case '-': return toNumber(left) - toNumber(right);
            case '*': return toNumber(left) * toNumber(right);
            case '/': return toNumber(left) / toNumber(right);
            case 'MOD': return toNumber(left) % toNumber(right);
            case '^': return Math.pow(toNumber(left), toNumber(right));
            case '=': return boolValue(left === right);
            case '<>': return boolValue(left !== right);
            case '<': return boolValue(left < right);
            case '>': return boolValue(left > right);
            case '<=': return boolValue(left <= right);
            case '>=': return boolValue(left >= right);
            case 'AND': return boolValue(left && right);
            case 'OR': return boolValue(left || right);
          }
      }
      runtimeError('Unsupported user function expression', at);
    }
    function invokeBuiltin(id, args, at, depth, locals) {
      var entry = builtins[id];
      var values = args || [];
      var localMap;
      var idx;
      if (!entry) runtimeError('Unknown builtin #' + id, at);
      if (entry.type === 'user') {
        localMap = {};
        for (idx = 0; idx < entry.fn.params.length; idx++) localMap[entry.fn.params[idx]] = values[idx];
        if (locals) for (idx in locals) if (own(locals, idx) && !own(localMap, idx)) localMap[idx] = locals[idx];
        return evaluateUserExpr(entry.fn.expr, localMap, at, depth || 0);
      }
      try {
        return entry.impl(values, api);
      } catch (err) {
        if (err && err.runtime) throw err;
        runtimeError(err && err.message ? err.message : String(err), at);
      }
    }
    function findBlockId(position) {
      var leaders;
      var lo;
      var hi;
      var mid;
      if (!blockMeta) return null;
      leaders = blockMeta.leaders || [];
      if (!leaders.length || position < leaders[0]) return null;
      lo = 0;
      hi = leaders.length - 1;
      while (lo <= hi) {
        mid = (lo + hi) >> 1;
        if (leaders[mid] <= position) lo = mid + 1;
        else hi = mid - 1;
      }
      return blockMeta.blockIds[leaders[hi]] || null;
    }
    function recordBlock(position) {
      var blockId;
      if (!(config.trace || config.maxBlocksPerEvent != null)) return;
      if (!blockMeta) blockMeta = config.blockMeta || getBlockMeta(program || { bytecode: bytecode, sourceMap: [] });
      blockId = findBlockId(position);
      if (!blockId || blockId === currentBlock) return;
      currentBlock = blockId;
      blockVisits++;
      if (config.trace) blockTrace.push(blockId);
      if (config.maxBlocksPerEvent != null && blockVisits > config.maxBlocksPerEvent) runtimeError('Maximum block count exceeded', position, 'block_limit');
    }
    function pushEmit(bytes) {
      var idx;
      if (config.maxEmitBytes != null && emitBuffer.length + bytes.length > config.maxEmitBytes) runtimeError('Maximum emit size exceeded', currentInstructionOffset, 'emit_limit');
      for (idx = 0; idx < bytes.length; idx++) emitBuffer.push(bytes[idx] & 255);
      return bytes.length;
    }
    function countEmitSlice() {
      emitCount++;
      if (config.maxSlices != null && emitCount > config.maxSlices) runtimeError('Maximum emit call count exceeded', currentInstructionOffset, 'slice_limit');
    }
    function emitRaw(value) {
      var bytes = valueToBytes(value);
      countEmitSlice();
      return pushEmit(bytes);
    }
    function emitInteger(value, size) {
      var bytes = [];
      var num = Math.floor(toNumber(value));
      var idx;
      countEmitSlice();
      for (idx = 0; idx < size; idx++) bytes.push((num >>> (idx * 8)) & 255);
      return pushEmit(bytes);
    }
    function emitStringValue(value) {
      var text = valueToString(value);
      var bytes = [];
      var idx;
      if (text.length > 65535) runtimeError('String emit too long', currentInstructionOffset, 'strict_error');
      countEmitSlice();
      bytes.push(text.length & 255, (text.length >> 8) & 255);
      for (idx = 0; idx < text.length; idx++) bytes.push(text.charCodeAt(idx) & 255);
      return pushEmit(bytes);
    }
    function buildResult() {
      var vars = currentVariables();
      return {
        output: output.slice(),
        variables: vars,
        vars: vars,
        emitBuffer: new Uint8Array(emitBuffer),
        cycles: cycles,
        halted: !!haltReason,
        haltReason: haltReason,
        trace: config.trace ? blockTrace.slice() : undefined,
        error: lastError ? (lastError.message || String(lastError)) : null
      };
    }
    function handleRuntimeFailure(err) {
      if (err && err.runtime && config.strict) {
        halted = true;
        haltReason = err.reason || 'strict_error';
        lastError = err;
        return buildResult();
      }
      throw err;
    }
    function executeInstruction() {
      var at = pc;
      var op;
      var idx;
      var a;
      var b;
      var value;
      var args;
      var argc;
      var id;
      if (halted) return null;
      recordBlock(at);
      if (at >= bytecode.length) { halted = true; return null; }
      if (cycles >= config.maxCycles) runtimeError('Maximum cycle count exceeded', at, 'cycle_limit');
      cycles++;
      currentInstructionOffset = at;
      op = bytecode[pc++];
      switch (op) {
        case OPCODES.PUSH_NUM: stack.push(readF64()); break;
        case OPCODES.PUSH_STR: stack.push(readStr()); break;
        case OPCODES.PUSH_TRUE: stack.push(1); break;
        case OPCODES.PUSH_FALSE: stack.push(0); break;
        case OPCODES.LOAD:
          idx = readU16();
          value = variables[idx];
          stack.push(value === undefined ? 0 : value);
          break;
        case OPCODES.STORE: idx = readU16(); variables[idx] = stack.pop(); break;
        case OPCODES.LOAD_ARR:
          idx = readU16();
          value = variables[idx];
          b = toIndex(stack.pop());
          a = (Array.isArray(value) || isUint8Array(value)) ? value[b] : 0;
          stack.push(a === undefined ? 0 : a);
          break;
        case OPCODES.STORE_ARR:
          idx = readU16();
          a = stack.pop();
          b = toIndex(stack.pop());
          if (!Array.isArray(variables[idx])) variables[idx] = [];
          variables[idx][b] = a;
          break;
        case OPCODES.ADD: b = stack.pop(); a = stack.pop(); stack.push((typeof a === 'string' || typeof b === 'string') ? String(a) + String(b) : toNumber(a) + toNumber(b)); break;
        case OPCODES.SUB: b = toNumber(stack.pop()); a = toNumber(stack.pop()); stack.push(a - b); break;
        case OPCODES.MUL: b = toNumber(stack.pop()); a = toNumber(stack.pop()); stack.push(a * b); break;
        case OPCODES.DIV: b = toNumber(stack.pop()); a = toNumber(stack.pop()); stack.push(a / b); break;
        case OPCODES.MOD: b = toNumber(stack.pop()); a = toNumber(stack.pop()); stack.push(a % b); break;
        case OPCODES.POW: b = toNumber(stack.pop()); a = toNumber(stack.pop()); stack.push(Math.pow(a, b)); break;
        case OPCODES.NEG: stack.push(-toNumber(stack.pop())); break;
        case OPCODES.NOT: stack.push(boolValue(!stack.pop())); break;
        case OPCODES.EQ: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a === b)); break;
        case OPCODES.NE: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a !== b)); break;
        case OPCODES.LT: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a < b)); break;
        case OPCODES.GT: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a > b)); break;
        case OPCODES.LE: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a <= b)); break;
        case OPCODES.GE: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a >= b)); break;
        case OPCODES.AND: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a && b)); break;
        case OPCODES.OR: b = stack.pop(); a = stack.pop(); stack.push(boolValue(a || b)); break;
        case OPCODES.JMP: pc = readU16(); break;
        case OPCODES.JZ: idx = readU16(); if (!stack.pop()) pc = idx; break;
        case OPCODES.JNZ: idx = readU16(); if (stack.pop()) pc = idx; break;
        case OPCODES.CALL: callStack.push(pc + 2); pc = readU16(); break;
        case OPCODES.RET: if (!callStack.length) runtimeError('RETURN without GOSUB', at); pc = callStack.pop(); break;
        case OPCODES.PRINT: value = valueToString(stack.pop()); output.push(value); config.printFn(value); break;
        case OPCODES.PRINTLN: output.push('\n'); config.printFn('\n'); break;
        case OPCODES.INPUT:
          value = config.inputFn();
          if (/^[-+]?\d+(?:\.\d+)?(?:[Ee][-+]?\d+)?$/.test(String(value).trim())) value = parseFloat(value);
          stack.push(value);
          break;
        case OPCODES.READ:
          if (dataPos >= data.length) runtimeError('READ past end of DATA', at);
          stack.push(data[dataPos++]);
          break;
        case OPCODES.RESTORE: dataPos = 0; break;
        case OPCODES.DIM: idx = readU16(); variables[idx] = new Array(readU16()); for (a = 0; a < variables[idx].length; a++) variables[idx][a] = 0; break;
        case OPCODES.BUILTIN:
          id = bytecode[pc++];
          argc = program && program.callArgs && own(program.callArgs, at) ? program.callArgs[at] : 0;
          args = [];
          while (argc-- > 0) args.unshift(stack.pop());
          stack.push(invokeBuiltin(id, args, at, 0, null));
          break;
        case OPCODES.HALT: halted = true; break;
        case OPCODES.NOP: break;
        case OPCODES.POP: stack.pop(); break;
        case OPCODES.DUP: stack.push(stack.length ? stack[stack.length - 1] : undefined); break;
        case OPCODES.SLEEP:
          value = Math.max(0, toNumber(stack.pop()));
          if (!config.async) runtimeError('SLEEP requires async: true', at);
          return new Promise(function(resolve) { setTimeout(resolve, value); });
        default:
          runtimeError('Unknown opcode ' + op, at);
      }
      return null;
    }
    function runSync() {
      var wait;
      try {
        while (!halted) {
          wait = executeInstruction();
          if (wait && typeof wait.then === 'function') runtimeError('SLEEP requires async: true', pc);
        }
      } catch (err) {
        return handleRuntimeFailure(err);
      }
      return buildResult();
    }
    async function runAsync() {
      var wait;
      try {
        while (!halted) {
          wait = executeInstruction();
          if (wait && typeof wait.then === 'function') await wait;
        }
      } catch (err) {
        return handleRuntimeFailure(err);
      }
      return buildResult();
    }
    var api = {
      load: function(bytecodeObj) {
        var name;
        program = bytecodeObj || { bytecode: new Uint8Array(0), symbols: {}, _symbols: {}, entries: { main: 0 } };
        bytecode = program.bytecode || new Uint8Array(0);
        builtins = (program.builtinEntries || DEFAULT_BUILTINS).slice();
        publicSymbols = program.symbols || {};
        allSymbols = program._symbols || publicSymbols;
        reverseSymbols = [];
        for (name in allSymbols) if (own(allSymbols, name)) reverseSymbols[allSymbols[name]] = name;
        blockMeta = config.blockMeta || ((config.trace || config.maxBlocksPerEvent != null) ? getBlockMeta(program) : null);
        api.reset();
        return api;
      },
      step: function() {
        try {
          var wait = executeInstruction();
          if (wait && typeof wait.then === 'function') {
            if (!config.async) runtimeError('SLEEP requires async: true', pc);
            return wait.then(function() { return api.getState(); });
          }
          return api.getState();
        } catch (err) {
          handleRuntimeFailure(err);
          return api.getState();
        }
      },
      run: function() { return config.async ? runAsync() : runSync(); },
      reset: function() {
        variables = [];
        stack = [];
        callStack = [];
        data = program && program.data ? program.data.slice() : [];
        output = [];
        emitBuffer = [];
        pc = config.startPc != null ? config.startPc : ((program && program.entries && own(program.entries, 'main')) ? program.entries.main : 0);
        cycles = 0;
        halted = false;
        dataPos = 0;
        haltReason = null;
        lastError = null;
        emitCount = 0;
        blockVisits = 0;
        currentBlock = null;
        blockTrace = [];
        currentInstructionOffset = 0;
        return api;
      },
      getState: function() {
        return {
          pc: pc,
          stack: stack.slice(),
          variables: currentVariables(),
          vars: currentVariables(),
          output: output.slice(),
          emitBuffer: new Uint8Array(emitBuffer),
          halted: halted,
          haltReason: haltReason,
          cycles: cycles,
          trace: config.trace ? blockTrace.slice() : undefined
        };
      },
      setVariable: function(name, value) { setVarByName(name, value, false); return api; },
      setInternalVariable: function(name, value) { setVarByName(name, value, true); return api; },
      getVariable: function(name) { return getVarByName(name); },
      emit: function(value) { return emitRaw(value); },
      emitU8: function(value) { return emitInteger(value, 1); },
      emitU16: function(value) { return emitInteger(value, 2); },
      emitU32: function(value) { return emitInteger(value, 4); },
      emitString: function(value) { return emitStringValue(value); }
    };
    if (program) api.load(program);
    return api;
  }

  function prepareRunOptions(bytecodeObj, opts, startPc, defaults) {
    var prepared = {};
    var key;
    opts = opts || {};
    defaults = defaults || {};
    for (key in defaults) if (own(defaults, key)) prepared[key] = defaults[key];
    for (key in opts) if (own(opts, key)) prepared[key] = opts[key];
    if (startPc != null) prepared.startPc = startPc;
    if ((prepared.trace || prepared.maxBlocksPerEvent != null) && !prepared.blockMeta && !prepared.blockLeaders) prepared.blockMeta = getBlockMeta(bytecodeObj);
    return prepared;
  }

  function run(bytecodeObj, opts) {
    var vm = createVM(prepareRunOptions(bytecodeObj, opts, null, { maxBlocksPerEvent: null }));
    vm.load(bytecodeObj);
    return vm.run();
  }

  function dispatch(bytecodeObj, event, context, opts) {
    var entries = bytecodeObj && bytecodeObj.entries ? bytecodeObj.entries : { main: 0 };
    var eventName = String(event == null ? 'main' : event).toLowerCase();
    var entry = own(entries, eventName) ? entries[eventName] : (eventName === 'main' ? 0 : null);
    var vm;
    var result;
    var vars;
    var name;
    var buffer = asUint8Array(context && context.buffer);
    function finalize(out) {
      if (out && out.variables) {
        delete out.variables['DATA$'];
        delete out.variables['_BUFFER'];
        out.vars = out.variables;
      }
      return out;
    }
    if (!buffer) buffer = new Uint8Array(valueToBytes(context && context.buffer));
    if (entry == null) {
      vars = cloneValue((context && context.vars) || {});
      return {
        output: [],
        variables: vars,
        vars: vars,
        emitBuffer: new Uint8Array(0),
        cycles: 0,
        halted: true,
        haltReason: 'strict_error',
        trace: opts && opts.trace ? [] : undefined,
        error: 'Unknown event ' + eventName
      };
    }
    vm = createVM(prepareRunOptions(bytecodeObj, opts, entry, { maxBlocksPerEvent: 256, maxEmitBytes: 65536, maxSlices: 16, strict: true }));
    vm.load(bytecodeObj);
    vars = (context && context.vars) || {};
    for (name in vars) if (own(vars, name)) vm.setVariable(name, vars[name]);
    vm.setVariable('DATA$', buffer);
    vm.setInternalVariable('_BUFFER', buffer);
    result = vm.run();
    if (result && typeof result.then === 'function') return result.then(finalize);
    return finalize(result);
  }

  function exec(source, opts) {
    return run(compile(source), opts || {});
  }

  function disassemble(bytecodeObj) {
    var lines = [];
    var pc = 0;
    while (pc < bytecodeObj.bytecode.length) {
      var ins = disassembleInstruction(bytecodeObj, pc);
      lines.push(ins.text + ' ; line ' + lineForOffset(bytecodeObj.sourceMap, ins.offset));
      pc = ins.nextPc;
    }
    if (bytecodeObj.data && bytecodeObj.data.length) lines.push('DATA ' + bytecodeObj.data.map(formatLiteral).join(', '));
    return lines.join('\n');
  }

  function stripAsmComment(line) {
    var out = '';
    var idx;
    var quote = false;
    for (idx = 0; idx < line.length; idx++) {
      if (line.charAt(idx) === '"') quote = !quote;
      if (!quote && (line.charAt(idx) === ';' || line.charAt(idx) === '#')) break;
      out += line.charAt(idx);
    }
    return out;
  }
  function splitAsmParts(text) {
    var parts = [];
    var current = '';
    var idx;
    var quote = false;
    for (idx = 0; idx < text.length; idx++) {
      if (text.charAt(idx) === '"') quote = !quote;
      if (!quote && /\s/.test(text.charAt(idx))) {
        if (current) { parts.push(current); current = ''; }
      } else current += text.charAt(idx);
    }
    if (current) parts.push(current);
    return parts;
  }
  function parseAsmString(text) {
    if (!/^"/.test(text)) return text;
    text = text.replace(/^"|"$/g, '');
    return text.replace(/""/g, '"');
  }
  function assemble(asmSource) {
    var lines = String(asmSource == null ? '' : asmSource).replace(/\r\n?/g, '\n').split('\n');
    var bytes = [];
    var labels = {};
    var unresolved = [];
    var sourceMap = [];
    var data = [];
    var callArgs = {};
    var builtins = DEFAULT_BUILTINS.slice();
    var lineNo;
    var line;
    var text;
    var match;
    var parts;
    var op;
    var pos;
    function emit(v) { bytes.push(v & 255); }
    function emitU16(v) { bytes.push(v & 255, (v >> 8) & 255); }
    function emitF(v) {
      var buffer = new ArrayBuffer(8);
      var view = new DataView(buffer);
      var arr = new Uint8Array(buffer);
      var idx;
      view.setFloat64(0, Number(v), true);
      for (idx = 0; idx < arr.length; idx++) bytes.push(arr[idx]);
    }
    function emitS(v) {
      var idx;
      v = String(v);
      emitU16(v.length);
      for (idx = 0; idx < v.length; idx++) emit(v.charCodeAt(idx));
    }
    for (lineNo = 0; lineNo < lines.length; lineNo++) {
      line = lines[lineNo];
      text = stripAsmComment(line).trim();
      if (!text) continue;
      text = text.replace(/^\d{4,}:\s*/, '');
      if (!text) continue;
      match = text.match(/^([A-Za-z_][A-Za-z0-9_$]*):\s*(.*)$/);
      if (match) {
        labels[normName(match[1])] = bytes.length;
        text = match[2].trim();
        if (!text) continue;
      }
      if (/^DATA\b/i.test(text)) {
        data = data.concat(parseCsvValues(text.replace(/^DATA\b/i, ''), lineNo + 1).map(function(node) {
          var literal = constEval(node);
          if (!literal.ok) fail(lineNo + 1, 'DATA requires literal values');
          return literal.value;
        }));
        continue;
      }
      parts = splitAsmParts(text);
      op = normName(parts.shift());
      sourceMap.push({ offset: bytes.length, line: lineNo + 1 });
      switch (op) {
        case 'PUSH_NUM': emit(OPCODES.PUSH_NUM); emitF(parseFloat(parts[0])); break;
        case 'PUSH_STR': emit(OPCODES.PUSH_STR); emitS(parseAsmString(parts.join(' '))); break;
        case 'PUSH_TRUE': emit(OPCODES.PUSH_TRUE); break;
        case 'PUSH_FALSE': emit(OPCODES.PUSH_FALSE); break;
        case 'LOAD': emit(OPCODES.LOAD); emitU16(parseInt(parts[0], 10)); break;
        case 'STORE': emit(OPCODES.STORE); emitU16(parseInt(parts[0], 10)); break;
        case 'LOAD_ARR': emit(OPCODES.LOAD_ARR); emitU16(parseInt(parts[0], 10)); break;
        case 'STORE_ARR': emit(OPCODES.STORE_ARR); emitU16(parseInt(parts[0], 10)); break;
        case 'ADD': emit(OPCODES.ADD); break;
        case 'SUB': emit(OPCODES.SUB); break;
        case 'MUL': emit(OPCODES.MUL); break;
        case 'DIV': emit(OPCODES.DIV); break;
        case 'MOD': emit(OPCODES.MOD); break;
        case 'POW': emit(OPCODES.POW); break;
        case 'NEG': emit(OPCODES.NEG); break;
        case 'NOT': emit(OPCODES.NOT); break;
        case 'EQ': emit(OPCODES.EQ); break;
        case 'NE': emit(OPCODES.NE); break;
        case 'LT': emit(OPCODES.LT); break;
        case 'GT': emit(OPCODES.GT); break;
        case 'LE': emit(OPCODES.LE); break;
        case 'GE': emit(OPCODES.GE); break;
        case 'AND': emit(OPCODES.AND); break;
        case 'OR': emit(OPCODES.OR); break;
        case 'JMP':
        case 'JZ':
        case 'JNZ':
        case 'CALL':
          emit(OPCODES[op]);
          pos = bytes.length;
          emitU16(0);
          if (/^\d+$/.test(parts[0])) bytes[pos] = parseInt(parts[0], 10) & 255, bytes[pos + 1] = (parseInt(parts[0], 10) >> 8) & 255;
          else unresolved.push({ pos: pos, label: normName(parts[0]), line: lineNo + 1 });
          break;
        case 'RET': emit(OPCODES.RET); break;
        case 'PRINT': emit(OPCODES.PRINT); break;
        case 'PRINTLN': emit(OPCODES.PRINTLN); break;
        case 'INPUT': emit(OPCODES.INPUT); break;
        case 'READ': emit(OPCODES.READ); break;
        case 'RESTORE': emit(OPCODES.RESTORE); break;
        case 'DIM': emit(OPCODES.DIM); emitU16(parseInt(parts[0], 10)); emitU16(parseInt(parts[1], 10)); break;
        case 'BUILTIN':
          emit(OPCODES.BUILTIN);
          pos = own(BUILTIN_IDS, normName(parts[0])) ? BUILTIN_IDS[normName(parts[0])] : parseInt(parts[0], 10);
          emit(pos);
          if (parts[1] != null) callArgs[bytes.length - 2] = parseInt(parts[1], 10);
          break;
        case 'HALT': emit(OPCODES.HALT); break;
        case 'NOP': emit(OPCODES.NOP); break;
        case 'POP': emit(OPCODES.POP); break;
        case 'DUP': emit(OPCODES.DUP); break;
        case 'SLEEP': emit(OPCODES.SLEEP); break;
        default: fail(lineNo + 1, 'Unknown assembly opcode ' + op);
      }
    }
    for (lineNo = 0; lineNo < unresolved.length; lineNo++) {
      if (!own(labels, unresolved[lineNo].label)) fail(unresolved[lineNo].line, 'Unknown label ' + unresolved[lineNo].label);
      bytes[unresolved[lineNo].pos] = labels[unresolved[lineNo].label] & 255;
      bytes[unresolved[lineNo].pos + 1] = (labels[unresolved[lineNo].label] >> 8) & 255;
    }
    return { bytecode: new Uint8Array(bytes), data: data, symbols: {}, _symbols: {}, labels: labels, sourceMap: sourceMap, callArgs: callArgs, builtinEntries: builtins, userFunctions: {}, entries: { main: 0 } };
  }

  function exprToString(node, parentPrec) {
    var prec;
    var text;
    var map = { OR: 1, AND: 2, '=': 3, '<>': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '+': 4, '-': 4, '*': 5, '/': 5, MOD: 5, '^': 6 };
    parentPrec = parentPrec || 0;
    switch (node.type) {
      case 'Number': return String(node.value);
      case 'String': return quoteString(node.value);
      case 'Boolean': return node.value ? 'TRUE' : 'FALSE';
      case 'Var': return node.name;
      case 'Access': return node.name + '(' + node.args.map(function(arg) { return exprToString(arg, 0); }).join(', ') + ')';
      case 'Unary':
        text = (node.op === 'NOT' ? 'NOT ' : '-') + exprToString(node.expr, 7);
        return 7 < parentPrec ? '(' + text + ')' : text;
      case 'Binary':
        prec = map[node.op] || 0;
        text = exprToString(node.left, prec) + ' ' + node.op + ' ' + exprToString(node.right, node.op === '^' ? prec : prec + 1);
        return prec < parentPrec ? '(' + text + ')' : text;
    }
    return '';
  }
  function renderStatement(node, indent) {
    var pad = new Array(indent + 1).join('  ');
    var lines = [];
    var idx;
    switch (node.type) {
      case 'Comment': return pad + 'REM ' + node.text;
      case 'Label': return pad + node.name + ':';
      case 'Assign': return pad + 'LET ' + (node.target.type === 'Index' ? node.target.name + '(' + exprToString(node.target.index, 0) + ')' : node.target.name) + ' = ' + exprToString(node.value, 0);
      case 'Print':
        return pad + 'PRINT' + (node.items.length ? ' ' + node.items.map(function(item, index) {
          return (index ? (node.items[index - 1].sep || ',') + ' ' : '') + exprToString(item.expr, 0);
        }).join('') + (node.trailingSep || '') : '');
      case 'Input': return pad + 'INPUT ' + (node.target.type === 'Index' ? node.target.name + '(' + exprToString(node.target.index, 0) + ')' : node.target.name);
      case 'If':
        if (node.singleLine) return pad + 'IF ' + exprToString(node.test, 0) + ' THEN ' + renderStatement(node.thenBody[0], 0).trim() + (node.elseBody && node.elseBody.length ? ' ELSE ' + renderStatement(node.elseBody[0], 0).trim() : '');
        lines.push(pad + 'IF ' + exprToString(node.test, 0) + ' THEN');
        for (idx = 0; idx < node.thenBody.length; idx++) lines.push(renderStatement(node.thenBody[idx], indent + 1));
        if (node.elseBody && node.elseBody.length) {
          lines.push(pad + 'ELSE');
          for (idx = 0; idx < node.elseBody.length; idx++) lines.push(renderStatement(node.elseBody[idx], indent + 1));
        }
        lines.push(pad + 'END IF');
        return lines.join('\n');
      case 'For':
        lines.push(pad + 'FOR ' + node.name + ' = ' + exprToString(node.start, 0) + ' TO ' + exprToString(node.end, 0) + (node.step && !(node.step.type === 'Number' && node.step.value === 1) ? ' STEP ' + exprToString(node.step, 0) : ''));
        for (idx = 0; idx < node.body.length; idx++) lines.push(renderStatement(node.body[idx], indent + 1));
        lines.push(pad + 'NEXT ' + node.name);
        return lines.join('\n');
      case 'While':
        lines.push(pad + 'WHILE ' + exprToString(node.test, 0));
        for (idx = 0; idx < node.body.length; idx++) lines.push(renderStatement(node.body[idx], indent + 1));
        lines.push(pad + 'WEND');
        return lines.join('\n');
      case 'DoLoop':
        lines.push(pad + 'DO');
        for (idx = 0; idx < node.body.length; idx++) lines.push(renderStatement(node.body[idx], indent + 1));
        lines.push(pad + 'LOOP' + (node.mode ? ' ' + node.mode + ' ' + exprToString(node.test, 0) : ''));
        return lines.join('\n');
      case 'Goto': return pad + 'GOTO ' + node.label;
      case 'Gosub': return pad + 'GOSUB ' + node.label;
      case 'Return': return pad + 'RETURN';
      case 'Dim': return pad + 'DIM ' + node.target.name + '(' + exprToString(node.target.index, 0) + ')';
      case 'Data': return pad + 'DATA ' + node.items.map(function(item) { var v = constEval(item); return v.ok ? formatLiteral(v.value) : exprToString(item, 0); }).join(', ');
      case 'Read': return pad + 'READ ' + node.targets.map(function(target) { return target.type === 'Index' ? target.name + '(' + exprToString(target.index, 0) + ')' : target.name; }).join(', ');
      case 'Restore': return pad + 'RESTORE';
      case 'DefFn': return pad + 'DEF FN ' + node.name + '(' + node.params.join(', ') + ') = ' + exprToString(node.expr, 0);
      case 'Expr': return pad + exprToString(node.expr, 0);
      case 'OnEvent':
        lines.push(pad + 'ON ' + String(node.event || '').toUpperCase() + ':');
        for (idx = 0; idx < node.body.length; idx++) lines.push(renderStatement(node.body[idx], indent + 1));
        lines.push(pad + 'END ON');
        return lines.join('\n');
      case 'End': return pad + 'END';
      case 'Sleep': return pad + 'SLEEP ' + exprToString(node.expr, 0);
    }
    return '';
  }
  function format(source) {
    var ast = parse(source);
    return ast.body.map(function(node) { return renderStatement(node, 0); }).join('\n');
  }

  function validate(source) {
    var errors = [];
    try { compile(source); }
    catch (err) { errors.push({ line: err.line || 0, message: err.message || String(err) }); }
    return { valid: !errors.length, errors: errors };
  }

  function instructionSize(bc, pos) {
    var op = bc[pos];
    if (op === OPCODES.PUSH_NUM) return 9;
    if (op === OPCODES.PUSH_STR) return 3 + (bc[pos + 1] | (bc[pos + 2] << 8));
    if (op === OPCODES.LOAD || op === OPCODES.STORE || op === OPCODES.LOAD_ARR || op === OPCODES.STORE_ARR || op === OPCODES.JMP || op === OPCODES.JZ || op === OPCODES.JNZ || op === OPCODES.CALL) return 3;
    if (op === OPCODES.DIM) return 5;
    if (op === OPCODES.BUILTIN) return 2;
    return 1;
  }

  function getBlockMeta(bytecodeObj) {
    var bc = bytecodeObj && bytecodeObj.bytecode ? bytecodeObj.bytecode : new Uint8Array(0);
    var leaders = { 0: true };
    var jumpTargets = {};
    var sortedLeaders;
    var blockIds = {};
    var i = 0;
    var op;
    var addr;
    var size;

    function readU16(pos) { return bc[pos] | (bc[pos + 1] << 8); }

    while (i < bc.length) {
      op = bc[i];
      size = instructionSize(bc, i);
      if (op === OPCODES.JMP || op === OPCODES.JZ || op === OPCODES.JNZ || op === OPCODES.CALL) {
        addr = readU16(i + 1);
        if (addr < bc.length) {
          leaders[addr] = true;
          jumpTargets[addr] = (jumpTargets[addr] || 0) + 1;
        }
        if (i + size < bc.length) leaders[i + size] = true;
      } else if (op === OPCODES.RET || op === OPCODES.HALT) {
        if (i + size < bc.length) leaders[i + size] = true;
      }
      i += size;
    }

    sortedLeaders = Object.keys(leaders).map(Number).filter(function(pos) { return pos >= 0 && pos < bc.length; }).sort(function(a, b) { return a - b; });
    for (i = 0; i < sortedLeaders.length; i++) blockIds[sortedLeaders[i]] = 'B' + i;
    return { leaders: sortedLeaders, blockIds: blockIds, jumpTargets: jumpTargets };
  }

  // CFG extraction — splits bytecode into basic blocks + edges (jump graph)
  function cfg(bytecodeObj) {
    var bc = bytecodeObj.bytecode;
    var sm = bytecodeObj.sourceMap || [];
    var meta = getBlockMeta(bytecodeObj);
    var sortedLeaders = meta.leaders;
    var jumpTargets = meta.jumpTargets;
    var blocks = [];
    var blockMap = {};
    var i;
    var b;
    var op;
    var addr;

    function readU16(pos) { return bc[pos] | (bc[pos + 1] << 8); }

    for (b = 0; b < sortedLeaders.length; b++) {
      var start = sortedLeaders[b];
      var end = (b + 1 < sortedLeaders.length) ? sortedLeaders[b + 1] : bc.length;
      var srcLine = null;
      var s;
      var block;
      if (start >= bc.length) continue;
      for (s = 0; s < sm.length; s++) {
        if (sm[s] && sm[s].offset !== undefined && sm[s].offset >= start && sm[s].offset < end) {
          srcLine = sm[s].line;
          break;
        }
      }
      block = { id: meta.blockIds[start], start: start, end: end, sourceLine: srcLine, edges: [], isTarget: !!jumpTargets[start] };
      blocks.push(block);
      blockMap[start] = block;
    }

    for (b = 0; b < blocks.length; b++) {
      var blk = blocks[b];
      var lastI = blk.start;
      i = blk.start;
      while (i < blk.end) {
        lastI = i;
        i += instructionSize(bc, i);
      }
      op = bc[lastI];
      if (op === OPCODES.JMP) {
        addr = readU16(lastI + 1);
        if (blockMap[addr]) blk.edges.push({ to: blockMap[addr].id, type: 'jump' });
      } else if (op === OPCODES.JZ || op === OPCODES.JNZ) {
        addr = readU16(lastI + 1);
        if (blockMap[addr]) blk.edges.push({ to: blockMap[addr].id, type: op === OPCODES.JZ ? 'false' : 'true' });
        if (b + 1 < blocks.length) blk.edges.push({ to: blocks[b + 1].id, type: op === OPCODES.JZ ? 'true' : 'false' });
      } else if (op === OPCODES.CALL) {
        addr = readU16(lastI + 1);
        if (blockMap[addr]) blk.edges.push({ to: blockMap[addr].id, type: 'call' });
        if (b + 1 < blocks.length) blk.edges.push({ to: blocks[b + 1].id, type: 'return' });
      } else if (op !== OPCODES.HALT && op !== OPCODES.RET) {
        if (b + 1 < blocks.length) blk.edges.push({ to: blocks[b + 1].id, type: 'fall' });
      }
    }

    return { blocks: blocks, entry: blocks.length ? blocks[0].id : null, leaders: sortedLeaders.slice(), blockLeaders: sortedLeaders.slice() };
  }

  // === Cross-transpilation: PicoScript AST -> C# / C ===

  function toCSharp(source) {
    var ast = parse(source);
    var out = [];
    var indent = 0;
    function ln(s) { out.push('    '.repeat(indent) + s); }
    function escStr(s) { return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"'; }

    ln('using System;');
    ln('using System.Collections.Generic;');
    ln('using System.Text;');
    ln('');
    ln('public class ProtocolHandler');
    ln('{');
    indent++;
    ln('private List<byte> _emit = new();');
    ln('private ReadOnlyMemory<byte> _buffer;');
    ln('');

    var events = {};
    var mainBody = [];
    var declaredVars = {};
    collectVars(ast.body, declaredVars);
    for (var i = 0; i < ast.body.length; i++) {
      var node = ast.body[i];
      if (node.type === 'OnEvent') { events[node.event] = node.body; }
      else { mainBody.push(node); }
    }
    var varKeys = Object.keys(declaredVars);
    for (var vi = 0; vi < varKeys.length; vi++) ln('private double ' + csVar(varKeys[vi]) + ' = 0;');
    if (varKeys.length) ln('');

    if (mainBody.length) { ln('public void Init()'); ln('{'); indent++; emitBody(mainBody); indent--; ln('}'); ln(''); }

    var evNames = Object.keys(events);
    for (var e = 0; e < evNames.length; e++) {
      var evName = evNames[e];
      var paramStr = evName === 'data' ? 'ReadOnlyMemory<byte> buffer' : '';
      ln('public byte[] On' + evName.charAt(0).toUpperCase() + evName.slice(1) + '(' + paramStr + ')');
      ln('{'); indent++;
      if (evName === 'data') ln('_buffer = buffer;');
      ln('_emit.Clear();');
      emitBody(events[evName]);
      ln('return _emit.ToArray();');
      indent--; ln('}');
      if (e < evNames.length - 1) ln('');
    }
    indent--; ln('}');

    function collectVars(body, map) {
      if (!body) return;
      for (var j = 0; j < body.length; j++) {
        var n = body[j];
        if (n.type === 'Assign' && n.target && n.target.name) map[n.target.name] = true;
        if (n.type === 'For') { if (n.name) map[n.name] = true; collectVars(n.body, map); }
        if (n.type === 'If') { collectVars(n.thenBody, map); collectVars(n.elseBody, map); }
        if (n.type === 'While') collectVars(n.body, map);
        if (n.type === 'OnEvent') collectVars(n.body, map);
      }
    }
    function csVar(n) { return '_' + n.toLowerCase().replace(/\$/g, ''); }
    function emitBody(body) { if (!body) return; for (var j = 0; j < body.length; j++) emitNode(body[j]); }

    function expr(node) {
      if (!node) return '0';
      switch (node.type) {
        case 'Number': return node.value.toString();
        case 'String': return escStr(node.value);
        case 'Boolean': return node.value ? 'true' : 'false';
        case 'Var': return csVar(node.name);
        case 'Binary':
          var opMap = {'=':'==','<>':'!=','AND':'&&','OR':'||','MOD':'%'};
          var op = opMap[node.op] || node.op;
          if (node.op === '^') return 'Math.Pow(' + expr(node.left) + ', ' + expr(node.right) + ')';
          return '(' + expr(node.left) + ' ' + op + ' ' + expr(node.right) + ')';
        case 'Unary':
          if (node.op === 'NOT') return '!(' + expr(node.expr || node.operand) + ')';
          return '(-' + expr(node.expr || node.operand) + ')';
        case 'Access': return callExpr(node);
        case 'ArrayAccess': return csVar(node.name) + '[(int)' + expr(node.index) + ']';
        default: return '0';
      }
    }

    function callExpr(node) {
      var args = (node.args || []).map(expr);
      switch (node.name) {
        case 'PEEK': return '_buffer.Span[(int)' + args[1] + ']';
        case 'PEEK_U16': return 'BitConverter.ToUInt16(_buffer.Span.Slice((int)' + args[1] + ', 2))';
        case 'PEEK_U32': return 'BitConverter.ToUInt32(_buffer.Span.Slice((int)' + args[1] + ', 4))';
        case 'BUF_LEN': return '_buffer.Length';
        case 'SLICE': return 'Encoding.UTF8.GetString(_buffer.Span.Slice((int)' + args[1] + ', (int)' + args[2] + '))';
        case 'LEN': return args[0] + '.Length';
        case 'ABS': return 'Math.Abs(' + args[0] + ')';
        case 'INT': case 'FIX': return '(int)(' + args[0] + ')';
        default: return node.name + '(' + args.join(', ') + ')';
      }
    }

    function emitCall(name, args) {
      var ca = args.map(expr);
      switch (name) {
        case 'EMIT_STR': ln('_emit.AddRange(Encoding.UTF8.GetBytes(' + ca[0] + '));'); break;
        case 'EMIT_U8': ln('_emit.Add((byte)(' + ca[0] + '));'); break;
        case 'EMIT_U16': ln('_emit.AddRange(BitConverter.GetBytes((ushort)(' + ca[0] + ')));'); break;
        case 'EMIT_U32': ln('_emit.AddRange(BitConverter.GetBytes((uint)(' + ca[0] + ')));'); break;
        case 'EMIT_CRLF': ln('_emit.Add(13); _emit.Add(10);'); break;
        case 'EMIT': ln('_emit.AddRange(Encoding.UTF8.GetBytes((' + ca[0] + ').ToString()));'); break;
        default: ln(name + '(' + ca.join(', ') + ');'); break;
      }
    }

    function emitNode(node) {
      if (!node) return;
      switch (node.type) {
        case 'Comment': ln('// ' + (node.text || node.value || '')); break;
        case 'Assign':
          var tgt = node.target.type === 'ArrayAccess' ? csVar(node.target.name) + '[(int)' + expr(node.target.index) + ']' : csVar(node.target.name);
          ln(tgt + ' = ' + expr(node.value) + ';'); break;
        case 'Print':
          var parts = (node.items || []).map(function(it) { return expr(it.expr); });
          ln('Console.WriteLine(' + (parts.length ? parts.join(' + " " + ') : '""') + ');'); break;
        case 'If':
          ln('if (' + expr(node.test) + ')'); ln('{'); indent++;
          emitBody(node.thenBody); indent--;
          if (node.elseBody && node.elseBody.length) { ln('}'); ln('else'); ln('{'); indent++; emitBody(node.elseBody); indent--; }
          ln('}'); break;
        case 'For':
          var v = csVar(node.name); var step = node.step ? expr(node.step) : '1';
          ln('for (var ' + v + ' = ' + expr(node.start) + '; ' + v + ' <= ' + expr(node.end) + '; ' + v + ' += ' + step + ')');
          ln('{'); indent++; emitBody(node.body); indent--; ln('}'); break;
        case 'While':
          ln('while (' + expr(node.test) + ')'); ln('{'); indent++; emitBody(node.body); indent--; ln('}'); break;
        case 'Expr':
          if (node.expr && node.expr.type === 'Access') emitCall(node.expr.name, node.expr.args || []);
          break;
        case 'Label': ln('// label: ' + node.name); break;
        default: ln('// [' + node.type + ']'); break;
      }
    }
    return out.join('\n');
  }

  function toC(source) {
    var ast = parse(source);
    var out = [];
    var indent = 0;
    function ln(s) { out.push('    '.repeat(indent) + s); }
    function escStr(s) { return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"'; }

    ln('#include <stdint.h>');
    ln('#include <string.h>');
    ln('#include <stdio.h>');
    ln('#include <math.h>');
    ln('');
    ln('#define MAX_EMIT 65536');
    ln('');
    ln('typedef struct {');
    indent++; ln('uint8_t emit_buf[MAX_EMIT];'); ln('size_t emit_len;'); ln('const uint8_t *buffer;'); ln('size_t buf_len;');
    indent--; ln('} proto_ctx_t;');
    ln('');
    ln('static inline void emit_u8(proto_ctx_t *ctx, uint8_t v) { if (ctx->emit_len < MAX_EMIT) ctx->emit_buf[ctx->emit_len++] = v; }');
    ln('static inline void emit_u16(proto_ctx_t *ctx, uint16_t v) { emit_u8(ctx, v & 0xFF); emit_u8(ctx, (v >> 8) & 0xFF); }');
    ln('static inline void emit_u32(proto_ctx_t *ctx, uint32_t v) { emit_u16(ctx, v & 0xFFFF); emit_u16(ctx, (v >> 16) & 0xFFFF); }');
    ln('static inline void emit_str(proto_ctx_t *ctx, const char *s) { while (*s && ctx->emit_len < MAX_EMIT) ctx->emit_buf[ctx->emit_len++] = (uint8_t)*s++; }');
    ln('static inline void emit_crlf(proto_ctx_t *ctx) { emit_u8(ctx, 13); emit_u8(ctx, 10); }');
    ln('');

    var events = {};
    var mainBody = [];
    var declaredVars = {};
    collectVars(ast.body, declaredVars);
    for (var i = 0; i < ast.body.length; i++) {
      var node = ast.body[i];
      if (node.type === 'OnEvent') { events[node.event] = node.body; }
      else { mainBody.push(node); }
    }
    var varKeys = Object.keys(declaredVars);
    if (varKeys.length) { ln('/* Protocol state */'); for (var vi = 0; vi < varKeys.length; vi++) ln('static double ' + cVar(varKeys[vi]) + ' = 0;'); ln(''); }

    var evNames = Object.keys(events);
    for (var e = 0; e < evNames.length; e++) {
      var evName = evNames[e];
      var sig = evName === 'data' ? 'size_t on_' + evName + '(proto_ctx_t *ctx, const uint8_t *buf, size_t len)' : 'size_t on_' + evName + '(proto_ctx_t *ctx)';
      ln(sig); ln('{'); indent++;
      if (evName === 'data') ln('ctx->buffer = buf; ctx->buf_len = len;');
      ln('ctx->emit_len = 0;');
      emitBody(events[evName]);
      ln('return ctx->emit_len;');
      indent--; ln('}');
      if (e < evNames.length - 1) ln('');
    }

    function collectVars(body, map) {
      if (!body) return;
      for (var j = 0; j < body.length; j++) {
        var n = body[j];
        if (n.type === 'Assign' && n.target && n.target.name) map[n.target.name] = true;
        if (n.type === 'For') { if (n.name) map[n.name] = true; collectVars(n.body, map); }
        if (n.type === 'If') { collectVars(n.thenBody, map); collectVars(n.elseBody, map); }
        if (n.type === 'While') collectVars(n.body, map);
        if (n.type === 'OnEvent') collectVars(n.body, map);
      }
    }
    function cVar(n) { return 'v_' + n.toLowerCase().replace(/\$/g, ''); }
    function emitBody(body) { if (!body) return; for (var j = 0; j < body.length; j++) emitNode(body[j]); }

    function expr(node) {
      if (!node) return '0';
      switch (node.type) {
        case 'Number': return node.value.toString();
        case 'String': return escStr(node.value);
        case 'Boolean': return node.value ? '1' : '0';
        case 'Var': return cVar(node.name);
        case 'Binary':
          var opMap = {'=':'==','<>':'!=','AND':'&&','OR':'||','MOD':'%'};
          var op = opMap[node.op] || node.op;
          if (node.op === '^') return 'pow(' + expr(node.left) + ', ' + expr(node.right) + ')';
          return '(' + expr(node.left) + ' ' + op + ' ' + expr(node.right) + ')';
        case 'Unary':
          if (node.op === 'NOT') return '!(' + expr(node.expr || node.operand) + ')';
          return '(-' + expr(node.expr || node.operand) + ')';
        case 'Access': return callExpr(node);
        case 'ArrayAccess': return cVar(node.name) + '[(int)' + expr(node.index) + ']';
        default: return '0';
      }
    }

    function callExpr(node) {
      var args = (node.args || []).map(expr);
      switch (node.name) {
        case 'PEEK': return 'ctx->buffer[(size_t)' + args[1] + ']';
        case 'PEEK_U16': return '(*(uint16_t*)(ctx->buffer + (size_t)' + args[1] + '))';
        case 'PEEK_U32': return '(*(uint32_t*)(ctx->buffer + (size_t)' + args[1] + '))';
        case 'BUF_LEN': return 'ctx->buf_len';
        case 'LEN': return 'strlen(' + args[0] + ')';
        case 'ABS': return 'fabs(' + args[0] + ')';
        case 'INT': case 'FIX': return '(int)(' + args[0] + ')';
        default: return node.name.toLowerCase() + '(' + args.join(', ') + ')';
      }
    }

    function emitCall(name, args) {
      var ca = args.map(expr);
      switch (name) {
        case 'EMIT_STR': ln('emit_str(ctx, ' + ca[0] + ');'); break;
        case 'EMIT_U8': ln('emit_u8(ctx, (uint8_t)(' + ca[0] + '));'); break;
        case 'EMIT_U16': ln('emit_u16(ctx, (uint16_t)(' + ca[0] + '));'); break;
        case 'EMIT_U32': ln('emit_u32(ctx, (uint32_t)(' + ca[0] + '));'); break;
        case 'EMIT_CRLF': ln('emit_crlf(ctx);'); break;
        case 'EMIT': ln('emit_str(ctx, ' + ca[0] + ');'); break;
        default: ln(name.toLowerCase() + '(' + ca.join(', ') + ');'); break;
      }
    }

    function emitNode(node) {
      if (!node) return;
      switch (node.type) {
        case 'Comment': ln('/* ' + (node.text || node.value || '') + ' */'); break;
        case 'Assign':
          var tgt = node.target.type === 'ArrayAccess' ? cVar(node.target.name) + '[(int)' + expr(node.target.index) + ']' : cVar(node.target.name);
          ln(tgt + ' = ' + expr(node.value) + ';'); break;
        case 'If':
          ln('if (' + expr(node.test) + ') {'); indent++;
          emitBody(node.thenBody); indent--;
          if (node.elseBody && node.elseBody.length) { ln('} else {'); indent++; emitBody(node.elseBody); indent--; }
          ln('}'); break;
        case 'For':
          var v = cVar(node.name); var step = node.step ? expr(node.step) : '1';
          ln('for (' + v + ' = ' + expr(node.start) + '; ' + v + ' <= ' + expr(node.end) + '; ' + v + ' += ' + step + ') {');
          indent++; emitBody(node.body); indent--; ln('}'); break;
        case 'While':
          ln('while (' + expr(node.test) + ') {'); indent++; emitBody(node.body); indent--; ln('}'); break;
        case 'Expr':
          if (node.expr && node.expr.type === 'Access') emitCall(node.expr.name, node.expr.args || []);
          break;
        case 'Label': ln(node.name + ':;'); break;
        default: ln('/* [' + node.type + '] */'); break;
      }
    }
    return out.join('\n');
  }

  return {
    tokenize: function(source) { return tokenize(source); },
    parse: function(source) { return parse(source); },
    compile: function(source) { return compile(source); },
    run: function(bytecodeObj, opts) { return run(bytecodeObj, opts); },
    dispatch: function(bytecodeObj, event, context, opts) { return dispatch(bytecodeObj, event, context, opts); },
    exec: function(source, opts) { return exec(source, opts); },
    disassemble: function(bytecodeObj) { return disassemble(bytecodeObj); },
    assemble: function(asmSource) { return assemble(asmSource); },
    createVM: function(opts) { return createVM(opts); },
    cfg: function(bytecodeObj) { return cfg(bytecodeObj); },
    toCSharp: function(source) { return toCSharp(source); },
    toC: function(source) { return toC(source); },
    format: function(source) { return format(source); },
    validate: function(source) { return validate(source); },
    OPCODES: OPCODES,
    VERSION: VERSION
  };
})();
if(typeof module!=='undefined') module.exports = BareMetal.PicoScript;
