# BareMetal.WorkflowPico

> Compiles `BareMetal.Workflow` step lists into PicoScript (English dialect) so the visual workflow designer becomes a PicoScript frontend.

**Size:** ~16 KB source / ~7.5 KB minified
**Dependencies:** `BareMetal.PicoScript` (only for `toWords()` / `run()`); `BareMetal.Workflow` (optional, for compiling by name and the designer button)

## What it does

The visual [`BareMetal.Workflow`](./BareMetal.Workflow.md) designer produces a flat list of step objects (`SET / IF / ELSE / END / FOR / FOREACH / FOREACHP / LOAD / SAVE / WEB / LOG / WAIT / CALL`). This module lowers that step list to **PicoScript English-dialect source**, which the bundled [`BareMetal.PicoScript`](./BareMetal.PicoScript.md) compiler turns into bytecode that runs on any PicoScript VM — the browser VM, the RP2350/PIOS VM, or the C# VM.

In effect, the workflow designer is now another PicoScript dialect: draw a workflow, compile it to deterministic PicoScript bytecode, run it anywhere.

The PicoScript VM is a **deterministic integer machine**. The arithmetic / control-flow subset lowers faithfully; data and IO steps that the integer VM cannot execute are lowered to host-hook calls or annotated comments and reported through the returned `warnings` array (see [Lowering reference](#lowering-reference)).

## Quick start

```html
<script src="BareMetal.Workflow.min.js"></script>
<script src="BareMetal.PicoScript.js"></script>
<script src="BareMetal.WorkflowPico.min.js"></script>
<script>
  var steps = [
    { type: 'SET', name: 'sum', value: 0 },
    { type: 'FOR', var: 'i', from: 1, to: 5 },
      { type: 'SET', name: 'sum', expr: 'sum + i' },
    { type: 'END' },
    { type: 'IF', condition: 'sum >= 15' },
      { type: 'SET', name: 'status', value: 1 },
    { type: 'ELSE' },
      { type: 'SET', name: 'status', value: 2 },
    { type: 'END' },
    { type: 'LOG', message: 'status' }
  ];

  // 1) Just the source:
  console.log(BareMetal.WorkflowPico.compile(steps).source);

  // 2) Compile + run on the bundled VM:
  var result = BareMetal.WorkflowPico.run(steps);
  console.log(result.output, result.warnings);
</script>
```

The generated English source for the workflow above:

```
Set sum to 0.
For each i from 1 to 5:
    Set sum to sum + i.
If sum >= 15:
    Set status to 1.
Otherwise:
    Set status to 2.
Print status.
```

## API Reference

### `compile(stepsOrName)` → `{ source, warnings }`

Lowers a step array (or a registered `BareMetal.Workflow` name) to English PicoScript source. Never throws on unrepresentable steps — it emits a comment and records a `warnings` entry.

| Param | Type | Description |
|-------|------|-------------|
| stepsOrName | `object[] \| string` | Workflow steps, or the name of a workflow registered with `BareMetal.Workflow`. |

`compileWorkflow` is an alias of `compile`.

### `toWords(stepsOrName, opts)` → `{ source, words, warnings }`

Compiles to source, then to PicoScript bytecode via `BareMetal.PicoScript.compileEnglish()`.

| Option | Type | Description |
|--------|------|-------------|
| `pico` | object | PicoScript module to use. Defaults to the global `BareMetal.PicoScript`. Required in Node/CommonJS, where modules do not share the `BareMetal` global. |

Throws if no PicoScript instance is available.

### `run(stepsOrName, opts)` → `{ source, words, output, vm, warnings }`

Compiles, lowers to bytecode, and executes on a fresh `PicoScript.VM`. `output` is the VM output buffer (bytes); the English `Print` statement writes a value as a 4-byte big-endian integer.

| Option | Type | Description |
|--------|------|-------------|
| `pico` | object | PicoScript module (see `toWords`). |
| `vmOptions` | object | Passed to the `PicoScript.VM` constructor. |

### `translateExpr(expr)` → `string`

Translates a JS-ish expression to the English operator dialect (`==`/`===` → `is`, `&&` → `and`, `||` → `or`; string literals are preserved). Exposed for tooling/tests.

### `attachToDesigner(controller, opts)` → `HTMLButtonElement | null`

Adds a **Compile to PicoScript** button to a designer returned by `BareMetal.Workflow.designer()`. On click it compiles the designer's current steps and dispatches a bubbling `bm:workflow-pico` `CustomEvent`.

| Option | Type | Description |
|--------|------|-------------|
| `label` | string | Button text. Default `'Compile to PicoScript'`. |
| `run` | boolean | When true, also runs on the VM and includes `output`/`words` in the event detail. |
| `onResult` | function | Called with the event detail. When omitted, the source is shown via `window.prompt`. |
| `pico`, `vmOptions` | — | Forwarded to `run()`. |

**Example:**
```js
var ui = BareMetal.Workflow.designer(document.getElementById('designer'), 'orderTotal');
BareMetal.WorkflowPico.attachToDesigner(ui, { run: true });
ui.element.addEventListener('bm:workflow-pico', function (e) {
  console.log(e.detail.source);   // PicoScript source
  console.log(e.detail.output);   // VM output (run:true)
  console.log(e.detail.warnings); // lowering warnings
});
```

Emits `bm:workflow-pico-error` (`detail.error`) if compilation throws.

## Lowering reference

| Workflow step | PicoScript (English) | Notes |
|---------------|----------------------|-------|
| `SET name value` / `SET name expr` | `Set <name> to <rhs>.` | `expr` is operator-translated; `${expr}` values become expressions. |
| `IF` / `ELSE` / `END` | `If <cond>:` / `Otherwise:` + indentation | Empty blocks get a `Set _nop to 0.` filler. |
| `FOR var from to step` | `For each <var> from <from> to <to> by <step>:` | Inclusive bounds, matching the Workflow engine. |
| `FOREACH` / `FOREACHP` | `For each <var> from 0 to <len-1>:` | Integer VM has no arrays: `<var>` is bound to the **index**, not the element. Non-literal arrays lower to a single iteration. Always warns. |
| `LOG message` | `Print <value>.` | Numeric / identifier / `${expr}` messages print; free-text strings become a comment + warning. |
| `WAIT ms` | `Timer.After(<ms>).` | Non-blocking on the VM (warns). |
| `WEB` / `LOAD` / `SAVE` | `# …` comment | Require host transport/storage hooks; not executed by the integer VM (warns). |
| `CALL workflow` | `# CALL <workflow>` | Nested workflows are not linked; compile them separately (warns). |

### Representable vs. host-only

- **Faithful:** integer variables, arithmetic (`+ - * / %`), comparisons (`> < >= <= == !=`), boolean `and`/`or`, `IF`/`ELSE`, `FOR`, nested blocks, `LOG` of numbers/variables.
- **Best-effort with warnings:** `FOREACH`/`FOREACHP` (index only), `WAIT` (non-blocking), string values (quoted but not numerically meaningful).
- **Host-only (comments + warnings):** `WEB`, `LOAD`, `SAVE`, `CALL`, string interpolation, non-scalar values.

## Notes

- **Always check `warnings`.** An empty array means every step lowered faithfully.
- Identifiers are sanitized to `[A-Za-z0-9_]` (leading digits are prefixed with `_`).
- In Node/CommonJS each module gets its own `BareMetal` namespace, so pass `opts.pico` to `toWords()`/`run()`. In the browser the shared `BareMetal` global is auto-detected.
- The English dialect uses indentation for blocks (no `END` keyword) and terminates statements with `.`; this module owns that formatting so hand-editing the output is optional.
