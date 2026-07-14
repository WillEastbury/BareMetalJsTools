#!/usr/bin/env python3
"""Rebuild BareMetal.PicoScript.js from picoscript/vm sources."""
import os

VM_DIR = r"C:\source\picoscript\vm"
OUT = r"C:\source\BareMetalJsTools\src\BareMetal.PicoScript.js"

def read(name):
    return open(os.path.join(VM_DIR, name), "r", encoding="utf-8").read()

hooks = read("pico_hooks.js")
compress = read("picocompress.js")
brotli = read("picobrotli.js")
compiler = read("picoc.js")
vm = read("picovm.js")

# Patch hooks
hooks = hooks.replace(
    'if (typeof module !== "undefined" && module.exports) { module.exports = H; }\n  else { root.PV_HOOKS = H; }',
    'root.PV_HOOKS = H;')
hooks = hooks.replace('})(typeof globalThis !== "undefined" ? globalThis : this);', '})(_root);')

# Patch picocompress
compress = compress.replace(
    '(function (root, factory) {\n  var P = factory();\n  if (typeof module !== "undefined" && module.exports) module.exports = P;\n  else root.PicoCompress = P;\n})(typeof globalThis !== "undefined" ? globalThis : this, function () {',
    '(function (root, factory) {\n  root.PicoCompress = factory();\n})(_root, function () {')

# Patch picobrotli
brotli = brotli.replace(
    '(function (root, factory) {\n  var P = factory();\n  if (typeof module !== "undefined" && module.exports) module.exports = P;\n  else root.PicoBrotli = P;\n})(typeof globalThis !== "undefined" ? globalThis : this, function () {',
    '(function (root, factory) {\n  root.PicoBrotli = factory();\n})(_root, function () {')

# Patch picoc.js
compiler = compiler.replace(
    '(function (root, factory) {\n  var hooks = (typeof module !== "undefined" && module.exports)\n    ? require("./pico_hooks.js") : root.PV_HOOKS;\n  var P = factory(hooks);\n  if (typeof module !== "undefined" && module.exports) module.exports = P;\n  else root.PicoCompile = P;\n})(typeof globalThis !== "undefined" ? globalThis : this, function (PV_HOOKS) {',
    '(function (root, factory) {\n  var P = factory(root.PV_HOOKS);\n  root.PicoCompile = P;\n})(_root, function (PV_HOOKS) {')

# Patch picovm.js
vm = vm.replace(
    '(function (root, factory) {\n  var node = (typeof module !== "undefined" && module.exports);\n  var hooks = node ? require("./pico_hooks.js") : root.PV_HOOKS;\n  var pcz = node ? require("./picocompress.js") : root.PicoCompress;\n  var pbz = node ? require("./picobrotli.js") : root.PicoBrotli;\n  var PicoVM = factory(hooks, pcz, pbz);\n  if (node) module.exports = PicoVM;\n  else root.PicoVM = PicoVM;\n})(typeof globalThis !== "undefined" ? globalThis : this, function (PV_HOOKS, PicoCompress, PicoBrotli) {',
    '(function (root, factory) {\n  var PicoVM = factory(root.PV_HOOKS, root.PicoCompress, root.PicoBrotli);\n  root.PicoVM = PicoVM;\n})(_root, function (PV_HOOKS, PicoCompress, PicoBrotli) {')

vm = vm.replace(
    '    if (typeof module !== "undefined" && module.exports) return require("./picostore.js");',
    '    if (false) return null; /* bundled */')

header = """// BareMetal.PicoScript.js — PicoScript 16-opcode ISA compiler + VM bundle.
//
// Bundles the real PicoScript toolchain from github.com/WillEastbury/picoscript:
//   - pico_hooks.js   (533 hook codes, auto-generated)
//   - picocompress.js  (PicoCompress RLE codec)
//   - picobrotli.js    (Brotli encoder/decoder)
//   - picoc.js         (4-frontend compiler: C, BASIC, Python, English)
//   - picovm.js        (16-opcode deterministic VM with full host-hook surface)
//
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.PicoScript = (function () {
  'use strict';
  var _root = {};

"""

footer = """
  var hooks = _root.PV_HOOKS;
  var Compiler = _root.PicoCompile;
  var VM = _root.PicoVM;
  function namespaces() { var ns = {}, bc = hooks.BY_CODE; for (var code in bc) { var dot = bc[code].indexOf('.'); if (dot > 0) ns[bc[code].slice(0, dot)] = true; } return Object.keys(ns).sort(); }
  function methods(namespace) { var out = [], bc = hooks.BY_CODE, prefix = namespace + '.'; for (var code in bc) { if (bc[code].indexOf(prefix) === 0) out.push(bc[code].slice(prefix.length)); } return out.sort(); }
  function hookCode(ns, method) { var name = ns + '.' + method, bc = hooks.BY_CODE; for (var code in bc) { if (bc[code] === name) return parseInt(code, 10); } return -1; }
  return {
    compile: Compiler.compile, compileC: Compiler.compileC, compileBasic: Compiler.compileBasic,
    compilePython: Compiler.compilePython, compileEnglish: Compiler.compileEnglish,
    compileDebug: Compiler.compileDebug, compileWithDebug: Compiler.compileWithDebug,
    symbolize: Compiler.symbolize, FAULT_NAMES: Compiler.FAULT_NAMES,
    VM: VM, hooks: hooks, namespaces: namespaces, methods: methods, hookCode: hookCode,
    PicoCompress: _root.PicoCompress, PicoBrotli: _root.PicoBrotli, VERSION: '2.0.0'
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.PicoScript;
"""

bundle = header + hooks + "\n" + compress + "\n" + brotli + "\n" + compiler + "\n" + vm + "\n" + footer
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(bundle)
print(f"Written: {len(bundle)//1024}KB")
