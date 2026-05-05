# BareMetal.PicoScript

> BASIC-style protocol compiler that turns event-driven PicoScript into bytecode, jump graphs, runtime traces, and portable handler code.

**Size:** 107 KB source / 51 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.PicoScript.min.js"></script>
<script>
var source = [
  'ON CONNECT:',
  '  EMIT("HTTP/1.1 200 OK")',
  '  EMIT_CRLF()',
  '  EMIT("Content-Type: text/plain")',
  '  EMIT_CRLF()',
  '  EMIT_CRLF()',
  '  EMIT("hello from PicoScript")',
  'END ON'
].join('\n');

var compiled = BareMetal.PicoScript.compile(source);
var result = BareMetal.PicoScript.dispatch(compiled, 'connect', { vars: {} });

console.log(new TextDecoder().decode(result.emitBuffer));
console.log(BareMetal.PicoScript.cfg(compiled));
</script>
```

## API Reference

### `tokenize(source)` → `Array`

Splits PicoScript source into lexer tokens with `type`, `value`, `line`, and `col` metadata.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | `string` | `''` | Raw PicoScript source |

**Example:**
```js
var tokens = BareMetal.PicoScript.tokenize('LET X = 42');
console.log(tokens[0]);
```

### `parse(sourceOrTokens)` → `AST`

Parses source text or a token array into a `Program` AST.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sourceOrTokens` | `string \| Array` | — | Raw source or the array returned by `tokenize()` |

**Example:**
```js
var tokens = BareMetal.PicoScript.tokenize('PRINT "hi"');
var ast = BareMetal.PicoScript.parse(tokens);
console.log(ast.type, ast.body.length);
```

### `compile(sourceOrAst)` → `CompiledProgram`

Compiles PicoScript into bytecode plus symbol tables, labels, event entries, and source maps.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sourceOrAst` | `string \| object` | — | PicoScript source or a parsed AST |

`CompiledProgram` includes `bytecode`, `data`, `symbols`, `_symbols`, `labels`, `sourceMap`, `callArgs`, `builtinEntries`, `userFunctions`, and `entries`.

**Example:**
```js
var compiled = BareMetal.PicoScript.compile([
  'LET COUNT = 1',
  'ON TICK:',
  '  LET COUNT = COUNT + 1',
  'END ON'
].join('\n'));

console.log(compiled.entries, compiled.labels);
```

### `run(bytecodeObj, opts)` → `Result | Promise<Result>`

Runs a compiled program from its `main` entry.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `bytecodeObj` | `object` | — | Compiled program returned by `compile()` or `assemble()` |
| `opts` | `object` | `{}` | VM options such as `maxCycles`, `inputFn`, `printFn`, `trace`, and `async` |

`Result` includes `vars`, `output`, `emitBuffer`, `cycles`, `halted`, `haltReason`, `trace`, and `error`.

**Example:**
```js
var compiled = BareMetal.PicoScript.compile('LET X = 2 + 3\nPRINT X');
var result = BareMetal.PicoScript.run(compiled);
console.log(result.output, result.vars);
```

### `dispatch(bytecodeObj, event, context, opts)` → `Result | Promise<Result>`

Runs a specific event entry such as `data`, `tick`, `connect`, or `close` with protocol safety rails enabled.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `bytecodeObj` | `object` | — | Compiled program |
| `event` | `string` | `'main'` | Event name looked up in `compiled.entries` |
| `context` | `object` | `{}` | Event context with `buffer` and optional `vars` |
| `opts` | `object` | `{}` | Overrides for `maxCycles`, `maxBlocksPerEvent`, `maxEmitBytes`, `maxSlices`, `strict`, `trace`, and `async` |

`dispatch()` injects the incoming buffer as `DATA$` and `_BUFFER`, returns emitted bytes as `emitBuffer`, and strips the internal buffer variables from `vars`.

**Example:**
```js
var source = [
  'ON DATA:',
  '  IF BUF_LEN(DATA$) > 0 THEN EMIT(PEEK(DATA$, 0))',
  'END ON'
].join('\n');

var compiled = BareMetal.PicoScript.compile(source);
var result = BareMetal.PicoScript.dispatch(compiled, 'data', {
  buffer: new Uint8Array([65])
}, { trace: true });

console.log(Array.from(result.emitBuffer), result.trace);
```

### `exec(source, opts)` → `Result | Promise<Result>`

Convenience helper that compiles source and immediately runs it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | `string` | `''` | PicoScript source to compile and run |
| `opts` | `object` | `{}` | Same options accepted by `run()` |

**Example:**
```js
var result = BareMetal.PicoScript.exec('PRINT 1 + 1');
console.log(result.output);
```

### `assemble(asmSource)` → `CompiledProgram`

Builds a compiled program from PicoScript assembly text.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `asmSource` | `string` | `''` | Assembly text containing opcodes, labels, and optional `DATA` lines |

**Example:**
```js
var program = BareMetal.PicoScript.assemble([
  'PUSH_STR "OK"',
  'PRINT',
  'HALT'
].join('\n'));

console.log(program.bytecode);
```

### `disassemble(bytecodeObj)` → `string`

Turns compiled bytecode back into readable assembly annotated with source lines.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `bytecodeObj` | `object` | — | Compiled program |

**Example:**
```js
var compiled = BareMetal.PicoScript.compile('PRINT "hello"');
console.log(BareMetal.PicoScript.disassemble(compiled));
```

### `createVM(opts)` → `VM`

Creates a low-level VM instance for manual stepping, variable injection, and custom execution control.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `opts` | `object` | `{}` | VM config including `maxCycles`, `maxBlocksPerEvent`, `maxEmitBytes`, `maxSlices`, `strict`, `inputFn`, `printFn`, `trace`, `async`, and `startPc` |

A `VM` exposes `load()`, `step()`, `run()`, `reset()`, `getState()`, `setVariable()`, `setInternalVariable()`, `getVariable()`, `emit()`, `emitU8()`, `emitU16()`, `emitU32()`, and `emitString()`.

**Example:**
```js
var vm = BareMetal.PicoScript.createVM({ trace: true });
vm.load(BareMetal.PicoScript.compile('LET X = 7\nPRINT X'));
console.log(vm.step());
console.log(vm.run());
```

### `cfg(bytecodeObj)` → `{ blocks, entry, leaders, blockLeaders }`

Extracts a control-flow graph from compiled bytecode.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `bytecodeObj` | `object` | — | Compiled program |

Each block includes `id`, `start`, `end`, `sourceLine`, `edges`, and `isTarget`.

**Example:**
```js
var compiled = BareMetal.PicoScript.compile('IF 1 THEN PRINT "A" ELSE PRINT "B"');
console.log(BareMetal.PicoScript.cfg(compiled).blocks);
```

### `toCSharp(source)` → `string`

Transpiles PicoScript into a C# `ProtocolHandler` class skeleton.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | `string` | `''` | PicoScript source |

**Example:**
```js
var csharp = BareMetal.PicoScript.toCSharp('ON CONNECT:\n  EMIT("OK")\nEND ON');
console.log(csharp);
```

### `toC(source)` → `string`

Transpiles PicoScript into a C protocol handler using a `proto_ctx_t` emit buffer.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | `string` | `''` | PicoScript source |

**Example:**
```js
var cCode = BareMetal.PicoScript.toC('ON DATA:\n  EMIT(PEEK(DATA$, 0))\nEND ON');
console.log(cCode);
```

### `format(source)` → `string`

Formats PicoScript into normalized, pretty-printed source.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | `string` | `''` | PicoScript source |

**Example:**
```js
var pretty = BareMetal.PicoScript.format('if 1 then print "x"');
console.log(pretty);
```

### `validate(source)` → `{ valid, errors }`

Compiles source in validation mode and returns structured compile errors.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | `string` | `''` | PicoScript source |

**Example:**
```js
var result = BareMetal.PicoScript.validate('IF THEN');
console.log(result.valid, result.errors[0]);
```

### `OPCODES` → `object`

Opcode name-to-byte lookup table used by the compiler, assembler, and disassembler.

**Example:**
```js
console.log(BareMetal.PicoScript.OPCODES.HALT);
```

### `VERSION` → `string`

Current module version string.

**Example:**
```js
console.log(BareMetal.PicoScript.VERSION);
```

## Notes
- Event blocks compile to separate entry points under `compiled.entries`, including `main`, `data`, `tick`, `connect`, and `close`.
- Protocol builtins include `EMIT`, `EMIT_U8`, `EMIT_U16`, `EMIT_U32`, `EMIT_STR`, `EMIT_CRLF`, `PEEK`, `PEEK_U16`, `PEEK_U32`, `SLICE`, and `BUF_LEN`.
- `dispatch()` enables strict mode and safety rails by default: `maxBlocksPerEvent`, `maxEmitBytes`, and `maxSlices`.
- `SLEEP` only works when the VM is created or run with `async: true`.
- `EMIT()` writes raw bytes; `EMIT_STR()` writes a length-prefixed string payload.
