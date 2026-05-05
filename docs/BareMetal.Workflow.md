# BareMetal.Workflow

> Declarative workflow engine for data loading, branching, loops, HTTP calls, persistence, and a built-in visual designer.

**Size:** 22.37 KB source / 11.54 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Workflow.min.js"></script>
<script>
  BareMetal.Workflow.create('orderTotal', [
    { type: 'SET', name: 'sum', value: 0 },
    { type: 'SET', name: 'items', value: [5, 10, 15] },
    { type: 'FOREACH', var: 'item', in: 'items' },
      { type: 'SET', name: 'sum', expr: 'sum + item' },
    { type: 'END' },
    { type: 'IF', condition: 'sum >= 30' },
      { type: 'SET', name: 'status', value: 'approved' },
    { type: 'ELSE' },
      { type: 'SET', name: 'status', value: 'review' },
    { type: 'END' }
  ]);

  BareMetal.Workflow.run('orderTotal').then(function (context) {
    console.log(context.sum, context.status);
  });
</script>
```

## API Reference

### `create(name, steps)` → `object[]`

Registers a named workflow and stores a cloned copy of its step list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Workflow name. |
| steps | object[] | `[]` | Workflow step definitions. |

**Example:**
```js
BareMetal.Workflow.create('smoke', [
  { type: 'SET', name: 'count', value: 1 }
]);
```

### `run(name, initialContext)` → `Promise<object>`

Executes a previously registered workflow by name and returns the final context object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Registered workflow name. |
| initialContext | object | `{}` | Starting context values. |

**Example:**
```js
var result = await BareMetal.Workflow.run('smoke', { tenantId: 42 });
```

### `exec(steps, initialContext)` → `Promise<object>`

Executes an ad hoc array of steps without registering a named workflow.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| steps | object[] | `[]` | Workflow step definitions. |
| initialContext | object | `{}` | Starting context values. |

**Example:**
```js
var result = await BareMetal.Workflow.exec([
  { type: 'SET', name: 'value', value: 2 },
  { type: 'SET', name: 'double', expr: 'value * 2' }
]);
```

### `list()` → `string[]`

Returns the names of all registered workflows.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.Workflow.list());
```

### `get(name)` → `object[]|null`

Returns a cloned copy of a named workflow's steps.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Workflow name. |

**Example:**
```js
var steps = BareMetal.Workflow.get('smoke');
```

### `remove(name)` → `boolean`

Deletes a registered workflow and returns whether it existed.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Workflow name. |

**Example:**
```js
BareMetal.Workflow.remove('old-workflow');
```

### `onStep(fn)` → `function`

Subscribes to step execution notifications. Returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Called with `{ step, context, index, name }`. |

**Example:**
```js
var stop = BareMetal.Workflow.onStep(function (info) {
  console.log(info.index, info.step.type);
});
```

### `onError(fn)` → `function`

Subscribes to workflow step errors. Returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Called with `{ step, error, context, index, name }`. |

**Example:**
```js
BareMetal.Workflow.onError(function (info) {
  console.error(info.step.type, info.error.message);
});
```

### `onComplete(fn)` → `function`

Subscribes to top-level workflow completion notifications. Returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Called with `{ name, context, duration }`. |

**Example:**
```js
BareMetal.Workflow.onComplete(function (info) {
  console.log(info.name, info.duration);
});
```

### `toJSON(name)` → `string`

Serializes a named workflow into pretty-printed JSON.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Workflow name. |

**Example:**
```js
var json = BareMetal.Workflow.toJSON('smoke');
```

### `fromJSON(name, json)` → `object[]`

Parses a JSON workflow definition and registers it under `name`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Workflow name. |
| json | string | — | JSON array of step objects. |

**Example:**
```js
BareMetal.Workflow.fromJSON('design', '[{"type":"SET","name":"count","value":1}]');
```

### `stepTypes()` → `Array<{ type, params, description }>`

Returns metadata for all built-in workflow step types.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.table(BareMetal.Workflow.stepTypes());
```

### `designer(container, workflowName)` → `object|null`

Renders an in-browser workflow editor with add, edit, delete, reorder, run, and export controls.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| container | Element | — | Host element to replace with the designer UI. |
| workflowName | string | `undefined` | Named workflow to edit. If missing, the designer works with an in-memory step list. |

**Example:**
```js
var ui = BareMetal.Workflow.designer(document.getElementById('designer'), 'smoke');
console.log(ui.getSteps());
```

The returned controller exposes:

| Field | Description |
|-------|-------------|
| `element` | Root designer element. |
| `refresh()` | Re-renders the current workflow. |
| `getSteps()` | Returns a cloned step list. |
| `destroy()` | Removes the UI and tears down sortable bindings. |

## Workflow Step Reference

### Built-in step types

| Type | Core fields | Description |
|------|-------------|-------------|
| `SET` | `name`, `value`, `expr` | Sets `context[name]` from a literal/interpolated value or from a JavaScript expression. |
| `IF` | `condition` | Starts a conditional block. |
| `ELSE` | — | Else branch inside an `IF` block. |
| `END` | — | Ends `IF`, `FOR`, `FOREACH`, or `FOREACHP`. |
| `FOR` | `var`, `from`, `to`, `step` | Counted loop with inclusive bounds. |
| `FOREACH` | `var`, `in` | Sequentially iterates an array expression. |
| `FOREACHP` | `var`, `in`, `concurrency` | Iterates an array in parallel and stores per-item contexts in `_results`. |
| `LOAD` | `name`, `from`, `key`, `url` | Loads data from storage, JSON over HTTP, or another variable. |
| `SAVE` | `name`, `to`, `key` | Saves a context value to storage or another variable. |
| `WEB` | `method`, `url`, `body`, `headers`, `result` | Performs an HTTP request with `fetch()`. |
| `LOG` | `level`, `message` | Writes an interpolated message to `console`. |
| `WAIT` | `ms` | Delays execution. |
| `CALL` | `workflow`, `args` | Calls another registered workflow using the current context. |

### Interpolation and expressions

- Plain strings are interpolated, so `'Hello ${name}'` becomes a string.
- A string that is exactly `${expr}` returns the evaluated value instead of a string.
- `expr`, `condition`, `in`, and similar fields run as JavaScript against the workflow context.

**Example:**
```js
await BareMetal.Workflow.exec([
  { type: 'SET', name: 'name', value: 'Ada' },
  { type: 'SET', name: 'greeting', value: 'Hello ${name}' },
  { type: 'SET', name: 'isLong', expr: 'greeting.length > 5' }
]);
```

### Data movement helpers

| Step | Supported values | Notes |
|------|------------------|-------|
| `LOAD.from` | `localStorage`, `sessionStorage`, `json`, `variable` | `json` uses `fetch(url).json()`. `variable` clones another context value. |
| `SAVE.to` | `localStorage`, `sessionStorage`, `variable` | Storage writes use `JSON.stringify()`. |
| `WEB` | Any HTTP method | Sets `_status` and `_ok`; stores response data in `result` when provided. |

## Designer events

The designer dispatches bubbling `CustomEvent`s from its root element:

| Event | `detail` payload |
|-------|------------------|
| `bm:workflow-change` | `{ name, type, steps }` |
| `bm:workflow-run` | `{ name, context }` |
| `bm:workflow-error` | `{ name, error }` |
| `bm:workflow-export` | `{ name, json }` |

## Notes
- `run()` and `exec()` clone the initial context for top-level execution, so your input object is not mutated.
- `FOREACH` exposes the current loop index as `_index`; `FOREACHP` collects each worker's final local context in `_results`.
- `CALL` merges interpolated `args` into the current context before executing the nested workflow.
- `WEB` errors do not abort the whole workflow by default; they are reported through `onError()` and set `_ok` to `false`.
- The designer works standalone, but if `BareMetal.DragDrop.sortable()` is available it uses it for nicer reordering; otherwise it falls back to native drag and drop.