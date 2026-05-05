# BareMetal.PicoScript.Editor

> Four-pane PicoScript IDE for editing source, inspecting bytecode IR, browsing CFGs, and tracing protocol dispatches.

**Size:** 31 KB source / 31 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.PicoScript.min.js"></script>
<script src="BareMetal.PicoScript.Editor.min.js"></script>

<div id="pico-editor" style="height: 600px;"></div>

<script>
var editor = BareMetal.PicoScript.Editor.create(
  document.getElementById('pico-editor'),
  {
    theme: 'dark',
    source: [
      'ON DATA:',
      '  IF BUF_LEN(DATA$) > 0 THEN EMIT(PEEK(DATA$, 0))',
      'END ON'
    ].join('\n')
  }
);

editor.compile();
editor.dispatch('data', 'A').then(function (trace) {
  console.log(trace.trace, Array.from(trace.emitBuffer));
});
</script>
```

## API Reference

### `create(container, opts)` → `EditorInstance`

Mounts the editor UI into a container element.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `HTMLElement` | — | Host element that receives the IDE layout |
| `opts` | `object` | `{}` | Optional editor settings |

Common `opts` fields: `theme`, `fontSize`, `source`, `height`, `maxCycles`, `maxBlocksPerEvent`, `maxEmitBytes`, `onCompile`, `onDispatch`, `onStep`, and `onChange`.

The UI is split into four panes: **Source**, **Bytecode IR**, **Jump Graph**, and **Trace + Emit**.

**Example:**
```js
var editor = BareMetal.PicoScript.Editor.create(host, {
  theme: 'light',
  fontSize: 14,
  height: '480px',
  source: 'PRINT "hello"'
});
```

### `editor.compile()` → `CompiledProgram`

Validates the current source, compiles it with `BareMetal.PicoScript`, refreshes the IR pane, and rebuilds the CFG view.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
var compiled = editor.compile();
console.log(compiled.entries);
```

### `editor.dispatch(event, buffer)` → `Promise<object>`

Runs an event dispatch with trace collection and updates the Trace + Emit pane.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `event` | `string` | current UI event | Event name such as `data`, `connect`, `tick`, or `close` |
| `buffer` | `string \| Array \| Uint8Array` | current UI buffer | Buffer payload passed into PicoScript dispatch |

Resolved objects include `event`, `buffer`, `trace`, `emitBuffer`, `vars`, `cycles`, `error`, and `haltReason`.

**Example:**
```js
editor.dispatch('data', new Uint8Array([72, 73])).then(function (result) {
  console.log(result.vars, result.trace);
});
```

### `editor.step()` → `Promise<object>`

Single-steps the active VM session, honoring breakpoints and updating linked highlighting across panes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
editor.compile();
editor.step().then(function (state) {
  console.log(state.pc, state.currentLine);
});
```

### `editor.reset()` → `object`

Clears the active VM session and returns the current editor state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
var state = editor.reset();
console.log(state.breakpoints);
```

### `editor.getSource()` → `string`

Returns the current source text.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(editor.getSource());
```

### `editor.setSource(source)` → `void`

Replaces the source pane contents and invalidates the compiled/trace state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | `string` | `''` | New PicoScript source |

**Example:**
```js
editor.setSource('ON CONNECT:\n  EMIT("OK")\nEND ON');
```

### `editor.getCompiled()` → `object | null`

Returns the most recent compiled program, if any.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(editor.getCompiled());
```

### `editor.getCfg()` → `object | null`

Returns the current CFG model used by the Jump Graph pane.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(editor.getCfg().blocks);
```

### `editor.getTrace()` → `object`

Returns the most recent dispatch trace snapshot.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(editor.getTrace().emitBuffer);
```

### `editor.setTheme(theme)` → `void`

Switches between the built-in `dark` and `light` themes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `'dark' \| 'light'` | current theme | Theme name |

**Example:**
```js
editor.setTheme('light');
```

### `editor.destroy()` → `void`

Removes the mounted editor UI and unregisters window-level event listeners.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
editor.destroy();
```

### `editor.setBreakpoint(line)` → `number[]`

Toggles a breakpoint for a 1-based source line and returns the sorted breakpoint list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `line` | `number` | — | 1-based line number |

**Example:**
```js
console.log(editor.setBreakpoint(3));
```

### `editor.getState()` → `object`

Returns a compact snapshot of editor and debugger state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

The returned object includes `source`, `breakpoints`, `compiled`, `currentLine`, `selectedLine`, `pc`, `cycles`, `variables`, `trace`, and `currentBlock`.

**Example:**
```js
console.log(editor.getState());
```

## Notes
- The four panes are Source, Bytecode IR, Jump Graph (SVG CFG), and Trace + Emit.
- Syntax highlighting, line numbers, linked highlighting, breakpoint toggles, and theme switching are built in.
- `compile()`, `dispatch()`, and `step()` require `BareMetal.PicoScript` to be loaded on the page.
- The shipped instance API uses `getSource()` / `setSource()` and `dispatch()` / `reset()`; there are no separate `getValue()` / `setValue()` / `run()` / `stop()` aliases in the current source file.
- `dispatch()` and `step()` always return promises from the public editor wrapper, even when the underlying VM work completes synchronously.
