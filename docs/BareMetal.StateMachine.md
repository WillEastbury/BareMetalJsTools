# BareMetal.StateMachine

> Minimal finite state machine with guarded transitions, actions, entry/exit hooks, and mutable context replacement.

**Size:** 2.9 KB source / 1.4 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.StateMachine.min.js"></script>
<script>
var upload = BareMetal.StateMachine.create({
  initial: 'idle',
  context: { attempts: 0 },
  states: {
    idle: {
      on: {
        START: { target: 'uploading' }
      }
    },
    uploading: {
      on: {
        FAIL: {
          target: 'idle',
          action: function (ctx) {
            return { attempts: ctx.attempts + 1 };
          }
        },
        DONE: 'success'
      }
    },
    success: {}
  }
});

upload.send('START');
upload.send('DONE');
console.log(upload.getState());
</script>
```

## API Reference

### `create(config)` → `machine`

Creates a machine instance. If `initial` is missing or invalid, the first state key is used.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| config | object | `{}` | Machine definition |

**Example:**
```js
var wizard = BareMetal.StateMachine.create({
  initial: 'step1',
  context: { valid: false },
  states: {
    step1: {
      on: {
        NEXT: {
          target: 'step2',
          guard: function (ctx) { return ctx.valid; }
        }
      }
    },
    step2: {}
  }
});
```

### `machine.send(event)` → `{ changed, state, context }`

Sends an event into the machine. `event` may be a string like `'SAVE'` or an object like `{ type: 'SAVE', payload: ... }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| event | string \| object | — | Event type or event object |

**Example:**
```js
var result = wizard.send({ type: 'NEXT', source: 'button' });
console.log(result.changed, result.state);
```

### `machine.getState()` → `string`

Returns the current state name.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(wizard.getState());
```

### `machine.getContext()` → `object`

Returns the current context object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(wizard.getContext());
```

### `machine.matches(stateName)` → `boolean`

Checks whether the machine is currently in a specific state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| stateName | string | — | State to compare |

**Example:**
```js
if (wizard.matches('step2')) {
  console.log('Ready to submit');
}
```

### `machine.subscribe(fn)` → `function`

Subscribes to successful state transitions. The callback receives `{ state, context, event }`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Transition listener |

**Example:**
```js
var stop = wizard.subscribe(function (snapshot) {
  console.log(snapshot.state, snapshot.context);
});
```

## Configuration / Options

### Machine config shape

| Field | Type | Description |
|-------|------|-------------|
| `initial` | string | Initial state name |
| `context` | object | Initial context copy |
| `states` | object | Map of state definitions |

### State definition

| Field | Type | Description |
|-------|------|-------------|
| `entry` | function | Called on state entry as `(context, event)` |
| `exit` | function | Called on state exit as `(context, event)` |
| `on` | object | Event map for outgoing transitions |

### Transition definition

| Form | Description |
|------|-------------|
| `'nextState'` | Shorthand for `{ target: 'nextState' }` |
| `{ target, guard, action }` | Full transition descriptor |

### Transition callbacks

| Callback | Signature | Notes |
|----------|-----------|-------|
| `guard` | `(context, event)` | Must return truthy to allow the transition |
| `action` | `(context, event)` | If it returns an object, that object replaces the current context |
| `entry` / `exit` | `(context, event)` | Side-effect hooks; return values are ignored |

## Examples

### Example 1: String shorthand transitions
```html
<script src="BareMetal.StateMachine.min.js"></script>
<script>
var auth = BareMetal.StateMachine.create({
  initial: 'loggedOut',
  states: {
    loggedOut: { on: { LOGIN: 'loggedIn' } },
    loggedIn: { on: { LOGOUT: 'loggedOut' } }
  }
});
</script>
```

### Example 2: Guarded transition with context updates
```js
var order = BareMetal.StateMachine.create({
  initial: 'draft',
  context: { paid: false },
  states: {
    draft: {
      on: {
        PAY: {
          target: 'paid',
          action: function () { return { paid: true }; }
        }
      }
    },
    paid: {
      on: {
        SHIP: {
          target: 'shipped',
          guard: function (ctx) { return ctx.paid; }
        }
      }
    },
    shipped: {}
  }
});
```

## Notes
- Invalid events and blocked guards return `{ changed: false, state, context }`.
- `entry()` is called once for the initial state with `{ type: '@@init' }`.
- Subscriber callbacks run only after successful transitions.
- Exceptions inside guards, actions, entry hooks, exit hooks, and subscribers are swallowed.
