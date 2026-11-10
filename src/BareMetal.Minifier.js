/* BareMetal.Minifier.js - dependency-free JS/CSS minifier (lexical compaction). */
(function (root) {
  "use strict";

  var REGEX_KW = {
    return: 1, throw: 1, case: 1, typeof: 1, void: 1, delete: 1, new: 1,
    in: 1, instanceof: 1, of: 1, await: 1, yield: 1, else: 1, do: 1,
    debugger: 1, with: 1
  };
  var ASI_KW = { return: 1, throw: 1, break: 1, continue: 1, yield: 1, debugger: 1 };
  var IDENT_RE = /[A-Za-z_$]/;
  var IDENT2_RE = /[A-Za-z0-9_$]/;

  function isSpace(c) {
    return c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f" || c === "\v" ||
      c === "\u2028" || c === "\u2029";
  }

  function hasLineTerminator(s) {
    return s.indexOf("\n") >= 0 || s.indexOf("\r") >= 0 ||
      s.indexOf("\u2028") >= 0 || s.indexOf("\u2029") >= 0;
  }

  /* `/` after ) ] } ++ -- is division. Regex after `}` is vanishingly rare vs `{} / n`. */
  var REGEX_PUNCT = {
    "(": 1, "[": 1, "{": 1, ";": 1, ",": 1, ":": 1, "?": 1, "=": 1, "!": 1, "~": 1,
    "&": 1, "|": 1, "^": 1, "%": 1, "+": 1, "-": 1, "*": 1, "<": 1, ">": 1,
    "==": 1, "!=": 1, "===": 1, "!==": 1, "<=": 1, ">=": 1, "&&": 1, "||": 1,
    "+=": 1, "-=": 1, "*=": 1, "/=": 1, "%=": 1, "&=": 1, "|=": 1, "^=": 1,
    "<<": 1, ">>": 1, ">>>": 1, "<<=": 1, ">>=": 1, ">>>=": 1, "=>": 1, "**": 1,
    "**=": 1, "??": 1, "?.": 1, "||=": 1, "&&=": 1, "??=": 1
  };

  /* Keep a line break for restricted ASI and so `f\\n(2)` / `a\\n[i]` stay calls/indexes. Never insert `;`. */
  function linebreakAction(source, i, lastWord, lastPunct, lastKind) {
    var n = source.length;
    while (i < n && isSpace(source[i]) && source[i] !== "\n" && source[i] !== "\r" &&
      source[i] !== "\u2028" && source[i] !== "\u2029") i++;
    var a = source[i];
    var b = source[i + 1];
    if (ASI_KW[lastWord]) return "nl";
    if ((a === "+" && b === "+") || (a === "-" && b === "-")) return "nl";
    if ((lastKind === "ident" || lastKind === "number" || lastKind === "string" || lastKind === "regex" ||
        lastPunct === ")" || lastPunct === "]" || lastPunct === "++" || lastPunct === "--") &&
        (a === "(" || a === "[")) return "nl";
    return "";
  }

  function regexAfter(kind, word, punct) {
    if (kind === "start") return "yes";
    if (kind === "ident" && REGEX_KW[word]) return "yes";
    if (kind === "punct") {
      if (REGEX_PUNCT[punct]) return "yes";
      return "no";
    }
    return "no";
  }

  function needsSpace(a, b) {
    if (!a || !b) return false;
    if (IDENT2_RE.test(a) && IDENT2_RE.test(b)) return true;
    if ((a === "+" && b === "+") || (a === "-" && b === "-") || (a === "+" && b === "=") || (a === "-" && b === "=")) return true;
    if ((a === "<" && (b === "<" || b === "=")) || (a === ">" && (b === ">" || b === "="))) return true;
    if (a === "/" && b === "/") return true;
    if (a === "/" && b === "*") return true;
    if (a === "*" && b === "/") return true;
    if ((a === "&" && b === "&") || (a === "|" && b === "|") || (a === "=" && b === "=") || (a === "!" && b === "=")) return true;
    return false;
  }

  function scanString(src, i, quote) {
    var n = src.length;
    var start = i;
    i++;
    while (i < n) {
      var c = src[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) {
        return { end: i + 1, ok: true, text: src.slice(start, i + 1) };
      }
      if (quote !== "`" && (c === "\n" || c === "\r")) {
        return { end: i, ok: false, text: src.slice(start, i), error: "unterminated string" };
      }
      i++;
    }
    return { end: n, ok: false, text: src.slice(start), error: "unterminated string" };
  }

  function scanRegex(src, i) {
    var n = src.length;
    var start = i;
    i++;
    var inClass = false;
    while (i < n) {
      var c = src[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === "[" && !inClass) {
        inClass = true;
        i++;
        continue;
      }
      if (c === "]" && inClass) {
        inClass = false;
        i++;
        continue;
      }
      if (c === "/" && !inClass) {
        i++;
        while (i < n && /[gimsuyd]/.test(src[i])) i++;
        return { end: i, ok: true, text: src.slice(start, i) };
      }
      if (c === "\n" || c === "\r") {
        return { end: i, ok: false, text: src.slice(start, i), error: "unterminated regex" };
      }
      i++;
    }
    return { end: n, ok: false, text: src.slice(start), error: "unterminated regex" };
  }

  function scanLineComment(src, i) {
    var n = src.length;
    var start = i;
    while (i < n && src[i] !== "\n" && src[i] !== "\r") i++;
    return { end: i, text: src.slice(start, i) };
  }

  function scanBlockComment(src, i) {
    var n = src.length;
    var start = i;
    i += 2;
    while (i < n) {
      if (src[i] === "*" && src[i + 1] === "/") {
        return { end: i + 2, ok: true, text: src.slice(start, i + 2) };
      }
      i++;
    }
    return { end: n, ok: false, text: src.slice(start), error: "unterminated comment" };
  }

  function preserveComment(text) {
    return text.indexOf("/*!") === 0 ||
      /@preserve|@license|@cc_on/i.test(text);
  }

  function minifyJS(source, options) {
    options = options || {};
    source = source == null ? "" : String(source);
    var n = source.length;
    var i = 0;
    var out = "";
    var errors = [];
    var lastKind = "start";
    var lastWord = "";
    var lastChar = "";
    var lastPunct = "";
    var mode = "code";
    var interp = [];

    function fail(msg) {
      errors.push(msg);
      return { code: source, errors: errors, unsupported: true };
    }

    function emit(text, kind, word) {
      if (!text) return;
      if (lastKind === "number" && text.charAt(0) === "." && /[0-9]/.test(lastChar)) out += " ";
      else if (out.length && needsSpace(lastChar, text.charAt(0))) out += " ";
      out += text;
      lastChar = text.charAt(text.length - 1);
      lastKind = kind;
      if (kind === "ident") lastWord = word || text;
      else lastWord = "";
      lastPunct = kind === "punct" ? text : "";
    }

    function emitNL() {
      if (out.length && out.charAt(out.length - 1) !== "\n") out += "\n";
      lastChar = "\n";
    }

    function applyLinebreak(src, idx) {
      if (linebreakAction(src, idx, lastWord, lastPunct, lastKind) === "nl") emitNL();
    }

    function interpTop() {
      return interp.length ? interp[interp.length - 1] : null;
    }

    while (i < n) {
      var c = source[i];
      var next = source[i + 1];

      if (mode === "template") {
        if (c === "\\") {
          out += c + (next || "");
          lastChar = next || c;
          i += next ? 2 : 1;
          continue;
        }
        if (c === "`") {
          out += c;
          lastChar = c;
          lastKind = "string";
          lastWord = "";
          lastPunct = "";
          mode = "code";
          i++;
          continue;
        }
        if (c === "$" && next === "{") {
          out += "${";
          lastChar = "{";
          lastKind = "punct";
          lastWord = "";
          lastPunct = "{";
          interp.push(1);
          mode = "code";
          i += 2;
          continue;
        }
        out += c;
        lastChar = c;
        i++;
        continue;
      }

      if (isSpace(c)) {
        var sawNL = false;
        while (i < n && isSpace(source[i])) {
          if (hasLineTerminator(source[i])) sawNL = true;
          i++;
        }
        if (sawNL) applyLinebreak(source, i);
        continue;
      }

      if (c === "/" && next === "/") {
        var lc = scanLineComment(source, i);
        if (preserveComment(lc.text)) emit(lc.text, "punct");
        else applyLinebreak(source, lc.end);
        i = lc.end;
        continue;
      }

      if (c === "/" && next === "*") {
        var bc = scanBlockComment(source, i);
        if (!bc.ok) return fail(bc.error);
        if (preserveComment(bc.text)) emit(bc.text, "punct");
        else if (hasLineTerminator(bc.text)) applyLinebreak(source, bc.end);
        i = bc.end;
        continue;
      }

      if (c === "'" || c === '"') {
        var st = scanString(source, i, c);
        if (!st.ok) return fail(st.error);
        emit(st.text, "string");
        i = st.end;
        continue;
      }

      if (c === "`") {
        out += c;
        lastChar = c;
        lastKind = "string";
        lastWord = "";
        lastPunct = "";
        mode = "template";
        i++;
        continue;
      }

      if (c === "/") {
        var rxMode = regexAfter(lastKind, lastWord, lastPunct);
        if (rxMode === "yes") {
          var rx = scanRegex(source, i);
          if (!rx.ok) return fail(rx.error || "unterminated regex");
          emit(rx.text, "regex");
          i = rx.end;
          continue;
        }
      }

      if (IDENT_RE.test(c)) {
        var j = i + 1;
        while (j < n && IDENT2_RE.test(source[j])) j++;
        var word = source.slice(i, j);
        emit(word, "ident", word);
        i = j;
        continue;
      }

      if (c >= "0" && c <= "9") {
        var k = i + 1;
        while (k < n && /[0-9a-fA-FxXoObBn._]/.test(source[k])) k++;
        emit(source.slice(i, k), "number");
        i = k;
        continue;
      }

      if (c === "{") {
        emit("{", "punct");
        if (interpTop()) interp[interp.length - 1]++;
        i++;
        continue;
      }

      if (c === "}") {
        if (interpTop()) {
          interp[interp.length - 1]--;
          if (interp[interp.length - 1] === 0) {
            interp.pop();
            out += "}";
            lastChar = "}";
            lastKind = "string";
            lastWord = "";
            lastPunct = "";
            mode = "template";
            i++;
            continue;
          }
        }
        emit("}", "punct");
        i++;
        continue;
      }

      var two = c + (next || "");
      if (two === "==" || two === "!=" || two === "<=" || two === ">=" || two === "&&" || two === "||" ||
          two === "++" || two === "--" || two === "+=" || two === "-=" || two === "*=" || two === "/=" ||
          two === "%=" || two === "&=" || two === "|=" || two === "^=" || two === "<<" || two === ">>" ||
          two === "=>" || two === "**" || two === "??" || two === "?." ) {
        var three = two + (source[i + 2] || "");
        var op = two;
        var adv = 2;
        if (three === "===" || three === "!==" || three === ">>>" || three === "**=" || three === "<<=" || three === ">>=" || three === "||=" || three === "&&=" || three === "??=") {
          op = three;
          adv = 3;
        }
        if (op === ">>>" && source[i + 3] === "=") {
          op = ">>>=";
          adv = 4;
        }
        emit(op, "punct");
        i += adv;
        continue;
      }

      emit(c, "punct");
      i++;
    }

    if (mode === "template" || interp.length) {
      errors.push("unterminated template");
      return { code: source, errors: errors, unsupported: true };
    }

    return { code: out, errors: errors };
  }

  function minifyCSS(source, options) {
    options = options || {};
    source = source == null ? "" : String(source);
    var n = source.length;
    var i = 0;
    var out = "";
    var errors = [];
    var last = "";
    var paren = 0;

    function push(ch) {
      out += ch;
      last = ch;
    }

    function skipSpace() {
      while (i < n && isSpace(source[i])) i++;
    }

    function spaceOk() {
      return last && last !== "{" && last !== "}" && last !== ";" && last !== "," && last !== ":" && last !== "(";
    }

    while (i < n) {
      var c = source[i];
      var next = source[i + 1];

      if (c === "/" && next === "*") {
        var bc = scanBlockComment(source, i);
        if (!bc.ok) {
          errors.push(bc.error);
          return { code: source, errors: errors, unsupported: true };
        }
        if (preserveComment(bc.text)) {
          out += bc.text;
          last = "/";
        }
        i = bc.end;
        continue;
      }

      if (c === '"' || c === "'") {
        var st = scanString(source, i, c);
        if (!st.ok) {
          errors.push(st.error);
          return { code: source, errors: errors, unsupported: true };
        }
        out += st.text;
        last = c;
        i = st.end;
        continue;
      }

      if ((c === "u" || c === "U") && source.slice(i, i + 4).toLowerCase() === "url(" &&
          (i === 0 || !IDENT2_RE.test(source[i - 1]))) {
        out += source.slice(i, i + 4);
        i += 4;
        last = "(";
        paren++;
        skipSpace();
        if (source[i] === '"' || source[i] === "'") continue;
        while (i < n && source[i] !== ")") {
          out += source[i];
          last = source[i];
          i++;
        }
        continue;
      }

      if (isSpace(c)) {
        skipSpace();
        if (paren > 0) {
          if (spaceOk() && i < n && source[i] !== ")" && source[i] !== "," && source[i] !== ";") {
            push(" ");
          }
        } else if (spaceOk() && i < n) {
          var nx = source[i];
          if (nx !== "{" && nx !== "}" && nx !== ";" && nx !== "," && nx !== ":" && nx !== ")") {
            if (IDENT2_RE.test(last) && (IDENT2_RE.test(nx) || nx === "." || nx === "#" || nx === "[" || nx === "*" || nx === ":" || nx === "-")) {
              push(" ");
            } else if (last === ")" && (IDENT2_RE.test(nx) || nx === "." || nx === "#" || nx === "[")) {
              push(" ");
            } else if (nx === "!" ) {
              push(" ");
            }
          }
        }
        continue;
      }

      if (c === "}") {
        if (last === ";") out = out.slice(0, -1);
        push("}");
        i++;
        continue;
      }
      if (c === "(") paren++;
      if (c === ")" && paren > 0) paren--;
      push(c);
      i++;
    }

    return { code: out.trim(), errors: errors };
  }

  async function compressGzip(source) {
    if (typeof CompressionStream === "undefined") throw new Error("CompressionStream(gzip) is unavailable");
    var bytes = typeof source === "string" ? new TextEncoder().encode(source) : new Uint8Array(source);
    var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function decompressGzip(source) {
    if (typeof DecompressionStream === "undefined") throw new Error("DecompressionStream(gzip) is unavailable");
    var bytes = typeof source === "string" ? new TextEncoder().encode(source) : new Uint8Array(source);
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  var api = {
    minifyJS: minifyJS,
    minifyCSS: minifyCSS,
    compressGzip: compressGzip,
    decompressGzip: decompressGzip
  };
  if (typeof root !== "undefined") {
    root.BareMetal = root.BareMetal || {};
    root.BareMetal.Minifier = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
