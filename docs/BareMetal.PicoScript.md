# BareMetal.PicoScript

> The real PicoScript 16-opcode ISA compiler + VM, bundled as a single BareMetalJsTools module.

This is a self-contained bundle of the [PicoScript](https://github.com/WillEastbury/picoscript) toolchain — the same deterministic bytecode compiler and VM that runs on bare metal (RP2350), PIOS, and in the browser. It replaces the old protocol-BASIC compiler with the full 16-opcode ISA.

## What's inside

| Component | Origin | Purpose |
|-----------|--------|---------|
| `pico_hooks.js` | auto-generated | 456 hook codes for 63 namespaces |
| `picocompress.js` | vendored | PicoCompress RLE codec |
| `picobrotli.js` | vendored | Brotli encoder/decoder |
| `picoc.js` | compiler | 4-frontend compiler (C, BASIC, Python, English) |
| `picovm.js` | VM | 16-opcode deterministic VM with full host-hook surface |

## Quick start

```html
<script src="BareMetal.PicoScript.js"></script>
<script>
  var ps = BareMetal.PicoScript;

  // Compile C-syntax PicoScript
  var result = ps.compileC('int x = 42; Io.WriteByte(x);');

  // Run it
  var vm = new ps.VM();
  vm.run(result.words);
  console.log(vm.output); // [42]
</script>
```

## API

### Compiler

| Method | Description |
|--------|-------------|
| `compile(source, lang)` | Compile source in any language (`"c"`, `"basic"`, `"python"`, `"english"`) |
| `compileC(source)` | Compile C-syntax PicoScript |
| `compileBasic(source)` | Compile BASIC-syntax PicoScript |
| `compilePython(source)` | Compile Python-syntax PicoScript |
| `compileEnglish(source)` | Compile English-syntax PicoScript |
| `compileDebug(source, lang)` | Compile with debug info (source maps) |

All compile methods return `{ words: number[], ... }`.

### VM

```js
var vm = new ps.VM(opts);
vm.run(words);         // execute bytecode
vm.step();             // single-step (for debuggers)
vm.regs                // register file (R0-R15)
vm.output              // output buffer (bytes)
vm.halted              // true when execution complete
vm.steps               // instruction count
```

Constructor options: `{ maxSteps, caps, seed, noAlloc, cards, cardStore, gpioProvider }`.

### Hook table (for editor completions)

```js
ps.hooks.BY_CODE        // { 0x280: "Process.Self", 0x290: "Timer.After", ... }
ps.namespaces()         // ["Attention","Auth","BitLinear","Bits","Capsule","Capability",...]
ps.methods("Process")   // ["Args","Exit","Kill","Parent","Self","Spawn","Status","Wait"]
ps.methods("Timer")     // ["After","Cancel","Elapsed","Every"]
ps.hookCode("Process", "Self")  // 0x280
```

### Sub-modules

```js
ps.PicoCompress.compress(data)    // PicoCompress RLE
ps.PicoBrotli                     // Brotli encoder/decoder
```

## Namespaces (63 total, 456 hooks)

The full namespace surface includes:

- **Core:** `Math`, `Flow`, `Thread`, `Dsp`, `Net`, `Kernel`
- **Memory:** `Memory`, `Span`, `Descriptor`, `Arena`, `Lease`
- **I/O:** `Io`, `Utf8Writer`, `Utf8Reader`, `Json`, `Xml`, `TextRender`
- **Storage:** `Storage`, `Query`, `Search`
- **Text:** `String`, `Number`, `Maths`, `Template`
- **System:** `DateTime`, `Locale`, `Environment`, `Context`
- **Security:** `Crypto`, `X509`, `Auth`
- **HTTP:** `Http`, `Html`, `Req`, `Resp`
- **Hardware:** `Gpio`, `Device`, `Stream`, `Dot8`
- **Capsules:** `Pack`, `Card`, `Fifo`, `Capsule`
- **UI:** `Ui`, `Event`, `Assert`
- **AI:** `Tensor`, `BitLinear`, `Quant`, `Attention`, `Tokenizer`, `Model`, `Kv`, `Sampling`
- **OS-worker:** `Process`, `Env`, `Timer`, `Scheduler`, `Principal`, `Capability`, `Sandbox`, `Error`
- **Codec:** `Compress`

## Replaces

This module replaces the old `BareMetal.PicoScript` protocol-BASIC compiler and `BareMetal.PicoScript.Editor` 4-pane IDE. Those compiled a different instruction set (EMIT/PEEK/GOSUB BASIC DSL). This is the real PicoScript 16-opcode ISA used by PIOS.

## Size

~322 KB source (includes all 5 sub-modules). The entire compiler + VM + codec suite in one file.
