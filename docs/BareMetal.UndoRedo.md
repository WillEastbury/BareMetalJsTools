# BareMetal.UndoRedo

> Command-pattern history stack with grouping, checkpoints, snapshots, serialization, and keyboard shortcuts.

**Size:** 6 KB source / 5 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.UndoRedo.min.js"></script>
<script>
  let total = 0;
  const history = BareMetal.UndoRedo.create();

  history.exec({
    name: 'Add 5',
    execute() { total += 5; },
    undo() { total -= 5; }
  });

  console.log(total); // 5
  history.undo();
  console.log(total); // 0
  history.redo();
  console.log(total); // 5
</script>
```

## API Reference

### `create(options)` → `history`

Creates a command-based undo/redo manager.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `undefined` | Optional configuration. Supports `maxSize`, `onChange`, `onCanUndoChange`, and `onCanRedoChange`. |

**Example:**
```js
const history = BareMetal.UndoRedo.create({
  maxSize: 100,
  onChange: state => console.log(state)
});
```

### `createSnap(options)` → `snapshotHistory`

Creates a snapshot stack for plain serializable values.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `undefined` | Optional configuration. Supports `maxSize` and `onChange`. |

**Example:**
```js
const snaps = BareMetal.UndoRedo.createSnap({ maxSize: 20 });
```

### `history.push(cmd)` → `command`

Adds a command to the undo stack without executing it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cmd | object | — | Command object with `name`, `execute()`, `undo()`, and optional `data`. |

**Example:**
```js
history.push({
  name: 'Prepared change',
  execute() {},
  undo() {}
});
```

### `history.exec(cmd)` → `command`

Executes a command immediately, then records it for undo.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cmd | object | — | Command object with `name`, `execute()`, `undo()`, and optional `data`. |

**Example:**
```js
history.exec({
  name: 'Rename item',
  execute() { item.name = 'Updated'; },
  undo() { item.name = 'Original'; },
  data: { id: item.id }
});
```

### `history.undo()` → `boolean`

Undoes the most recent command.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
if (history.undo()) {
  console.log('reverted one step');
}
```

### `history.redo()` → `boolean`

Re-runs the most recently undone command.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
history.redo();
```

### `history.canUndo()` → `boolean`

Reports whether an undo step is available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
saveButton.disabled = !history.canUndo();
```

### `history.canRedo()` → `boolean`

Reports whether a redo step is available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
redoButton.disabled = !history.canRedo();
```

### `history.undoName()` → `string | null`

Returns the display name of the next undoable command.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(history.undoName());
```

### `history.redoName()` → `string | null`

Returns the display name of the next redoable command.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(history.redoName());
```

### `history.size()` → `number`

Returns total history size (`undo + redo`).

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(history.size());
```

### `history.index()` → `number`

Returns the current undo pointer position.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(history.index());
```

### `history.beginGroup(name, data)` → `history`

Starts a group so multiple commands collapse into one undo step.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | `'Group'` | Group label. |
| data | any | `undefined` | Optional metadata stored with the grouped command. |

**Example:**
```js
history.beginGroup('Move shape');
history.exec(moveXCommand);
history.exec(moveYCommand);
history.endGroup();
```

### `history.endGroup()` → `boolean`

Closes the current group and pushes it onto the undo stack.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
history.beginGroup('Bulk edit');
// ...commands...
history.endGroup();
```

### `history.group(name, fn, data)` → `history`

Runs `fn()` inside a temporary group and closes it automatically in a `finally` block.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | `'Group'` | Group label. |
| fn | function | — | Function that pushes or executes commands. |
| data | any | `undefined` | Optional group metadata. |

**Example:**
```js
history.group('Paste row', () => {
  history.exec(insertRowCommand);
  history.exec(selectRowCommand);
});
```

### `history.toJSON()` → `string`

Serializes undo and redo stacks into JSON.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
localStorage.history = history.toJSON();
```

### `history.fromJSON(json)` → `history`

Loads a serialized history payload.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| json | string \| object | — | Output from `toJSON()` or an equivalent parsed object. |

**Example:**
```js
history.fromJSON(localStorage.history);
```

### `history.clear()` → `history`

Removes undo, redo, and any open grouping state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
history.clear();
```

### `history.clearRedo()` → `history`

Drops only the redo stack.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
history.clearRedo();
```

### `history.checkpoint()` → `number`

Captures the current undo index for later comparison or rollback.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const point = history.checkpoint();
```

### `history.revertTo(point)` → `boolean`

Undoes commands until the undo stack reaches `point`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| point | number | — | Index returned by `checkpoint()`. |

**Example:**
```js
const point = history.checkpoint();
history.exec(changeA);
history.exec(changeB);
history.revertTo(point);
```

### `history.bindKeys(el)` → `function`

Binds standard undo/redo shortcuts to an element or document and returns an unbind function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | EventTarget | `document` | Target that supports `addEventListener`. |

**Example:**
```js
const unbind = history.bindKeys(document);
```

### `history.on(name, fn)` → `history`

Registers an event hook.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Hook name such as `push`, `undo`, `redo`, or `clear`. |
| fn | function | — | Listener called with the command payload when available. |

**Example:**
```js
history.on('undo', cmd => {
  console.log('undid', cmd.name);
});
```

### `history.off(name, fn)` → `history`

Removes one hook or all hooks for `name` when `fn` is omitted.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Hook name. |
| fn | function | `undefined` | Specific listener to remove. |

**Example:**
```js
history.off('undo');
```

### `snapshotHistory.snapshot(value)` → `any`

Deep-clones and stores a snapshot, truncating any redo branch first.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Serializable value to capture. |

**Example:**
```js
snaps.snapshot({ count: 1, items: ['a'] });
```

### `snapshotHistory.undo()` → `any | null`

Moves to the previous snapshot and returns it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const prev = snaps.undo();
```

### `snapshotHistory.redo()` → `any | null`

Moves to the next snapshot and returns it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
const next = snaps.redo();
```

### `snapshotHistory.current()` → `any | null`

Returns the current snapshot clone.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(snaps.current());
```

## Notes

- Commands are normalized; missing `execute()` or `undo()` handlers become no-ops.
- `maxSize` trims the oldest undo entries after new pushes.
- `exec()` clears the redo stack whenever a new command is recorded outside an open group.
- `fromJSON()` restores names, metadata, and grouping structure, but restored commands use no-op `execute()`/`undo()` functions.
- `bindKeys()` uses `Ctrl+Z` / `Ctrl+Y` on Windows and `Cmd+Z` / `Cmd+Shift+Z` on macOS.
