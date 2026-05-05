# BareMetal.TestRunner

> Tiny in-browser test runner with Jest-like assertions, hooks, mocks, and report formatting.

**Size:** 17.71 KB source / 9.17 KB minified  
**Dependencies:** None; runs in a browser or jsdom-like environment

## Quick Start

```html
<script src="BareMetal.TestRunner.min.js"></script>
<script>
  const restore = BareMetal.TestRunner.installGlobals();

  describe('math', () => {
    it('adds numbers', () => {
      expect(2 + 2).toBe(4);
    });
  });

  run().then(result => {
    console.log(BareMetal.TestRunner.toTAP(result));
    restore();
  });
</script>
```

## API Reference

### `describe(name, fn)` → `void`

Defines a suite. Supports nested suites.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | — | Suite name |
| `fn` | `Function` | — | Callback that registers nested suites/tests |

Related helpers:

| Helper | Description |
|--------|-------------|
| `describe.skip(name, fn)` | Registers a skipped suite |
| `describe.only(name, fn)` | Runs only this suite (and other `only` items) |

**Example:**
```js
describe('cart totals', () => {
  describe('with tax', () => {
    it('rounds to 2 decimals', () => {
      expect(totalWithTax(19.99, 0.2)).toBeCloseTo(23.99, 2);
    });
  });
});
```

### `it(name, fn, timeout)` → `void`

Defines a test case.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | — | Test name |
| `fn` | `Function` | — | Sync or async test body |
| `timeout` | `number` | `5000` | Per-test timeout in milliseconds |

Related helpers:

| Helper | Description |
|--------|-------------|
| `it.skip(name, fn)` | Marks a test as skipped |
| `it.only(name, fn, timeout)` | Runs only this test |

**Example:**
```js
it('loads customers from the API', async () => {
  const rows = await loadCustomers();
  expect(rows).toHaveLength(3);
}, 10000);
```

### `test(name, fn, timeout)` → `void`

Alias for `it()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | — | Test name |
| `fn` | `Function` | — | Sync or async test body |
| `timeout` | `number` | `5000` | Per-test timeout in milliseconds |

Related helpers: `test.skip(...)`, `test.only(...)`

**Example:**
```js
test('renders the empty state', () => {
  expect(view.textContent).toContain('No invoices');
});
```

### `expect(value)` → `AssertionChain`

Creates a chainable assertion object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `any` | — | Value, function, spy, or promise to assert against |

Built-in matchers:

- `not`
- `toBe`, `toEqual`
- `toBeTruthy`, `toBeFalsy`, `toBeNull`, `toBeUndefined`, `toBeDefined`, `toBeNaN`
- `toContain`, `toMatch`, `toHaveLength`, `toHaveProperty`
- `toBeInstanceOf`
- `toBeGreaterThan`, `toBeGreaterThanOrEqual`, `toBeLessThan`, `toBeLessThanOrEqual`, `toBeCloseTo`
- `toThrow`
- `toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`
- `resolves.toBe`, `resolves.toEqual`
- `rejects.toThrow`

**Example:**
```js
await expect(fetchUser()).resolves.toEqual({ name: 'Ada' });
expect(() => JSON.parse('{')).toThrow('Unexpected');
```

### `beforeEach(fn)` → `void`
### `afterEach(fn)` → `void`
### `beforeAll(fn)` → `void`
### `afterAll(fn)` → `void`

Registers suite hooks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `fn` | `Function` | — | Sync or async hook |

**Example:**
```js
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

afterEach(() => {
  document.body.innerHTML = '';
});
```

### `mock.fn(impl)` → `Function`

Creates a spy function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `impl` | `Function` | — | Optional implementation used when the spy is called |

Spy properties:

| Property | Description |
|----------|-------------|
| `calls` | Array of argument arrays |
| `lastCall` | Most recent call arguments |
| `returnValue` | Most recent return value |
| `error` | Most recent thrown error |
| `reset()` | Clears recorded state |

**Example:**
```js
const save = BareMetal.TestRunner.mock.fn(record => ({ id: 42, ...record }));
save({ name: 'Ada' });
expect(save).toHaveBeenCalledWith({ name: 'Ada' });
```

### `mock.fetch(responses)` → `Function`

Temporarily replaces `globalThis.fetch` with predictable responses.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `responses` | `Array \| Object` | — | Queue or URL map of mock response specs |

A response spec can be a plain value, an object with `status`, `ok`, `headers`, `body`/`json`/`text`, a function, or an `Error`.

**Example:**
```js
const restoreFetch = BareMetal.TestRunner.mock.fetch({
  '/api/customers': { status: 200, json: [{ id: 1, name: 'Ada' }] }
});
```

### `run(opts)` → `Promise<Result>`

Runs the queued suites and prints a console summary.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `opts` | `object` | `{}` | Optional run settings |

`Result` contains `passed`, `failed`, `skipped`, `pending`, `results`, and `duration`.

**Example:**
```js
const result = await BareMetal.TestRunner.run({ bail: true, slow: 100 });
if (result.failed) console.error('Test run failed');
```

### `configure(opts)` → `void`

Updates default runner settings used by subsequent `run()` calls.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `opts` | `object` | `{}` | Persistent configuration |

**Example:**
```js
BareMetal.TestRunner.configure({ grep: 'auth', retries: 1, slow: 50 });
```

### `toTAP(res)` → `string`

Formats a `run()` result as TAP version 13.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `res` | `object` | — | Result object returned by `run()` |

**Example:**
```js
const tap = BareMetal.TestRunner.toTAP(result);
console.log(tap);
```

### `toMarkdown(res, opts)` → `string`

Formats a `run()` result as a Markdown report.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `res` | `object` | — | Result object returned by `run()` |
| `opts` | `object` | `{}` | Report options |

**Example:**
```js
const md = BareMetal.TestRunner.toMarkdown(result, {
  title: 'Checkout smoke tests',
  timestamp: true
});
```

### `installGlobals()` → `Function`

Installs the public API on `globalThis` (`describe`, `it`, `test`, `expect`, hooks, `mock`, `run`) and returns a restore function.

**Example:**
```js
const restore = BareMetal.TestRunner.installGlobals();
// ...register tests...
restore();
```

## Configuration / Options

### `run()` / `configure()` options

| Option | Default | Description |
|--------|---------|-------------|
| `grep` | `null` | String or `RegExp` filter applied to full test names |
| `bail` | `false` | Stop after the first failure |
| `slow` | `75` | Duration threshold in ms for slow-test highlighting |
| `retries` | `0` | Number of retry attempts for failing tests |
| `reporter` | `null` | Custom reporter with `pass`, `fail`, `skip`, `pending` callbacks |

### Markdown report options

| Option | Default | Description |
|--------|---------|-------------|
| `title` | `'Test Results'` | Heading used in the generated report |
| `timestamp` | `true` | Include an ISO timestamp when not set to `false` |

## Examples

### Example 1: DOM test with a mocked API
```html
<script src="BareMetal.TestRunner.min.js"></script>
<script>
  const T = BareMetal.TestRunner;

  T.describe('customer list', () => {
    let restoreFetch;

    T.beforeEach(() => {
      document.body.innerHTML = '<ul id="customers"></ul>';
      restoreFetch = T.mock.fetch({
        '/api/customers': { json: [{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }] }
      });
    });

    T.afterEach(() => {
      restoreFetch();
      document.body.innerHTML = '';
    });

    T.it('renders server data', async () => {
      const response = await fetch('/api/customers');
      const customers = await response.json();
      const list = document.getElementById('customers');
      list.innerHTML = customers.map(c => `<li>${c.name}</li>`).join('');
      T.expect(list.children).toHaveLength(2);
      T.expect(list.textContent).toContain('Ada');
    });
  });

  T.run();
</script>
```

### Example 2: Generate TAP and Markdown output
```js
const result = await BareMetal.TestRunner.run({ slow: 40 });
console.log(BareMetal.TestRunner.toTAP(result));
console.log(BareMetal.TestRunner.toMarkdown(result, { title: 'UI smoke tests' }));
```

## Notes
- Calling `it('name')` without a function creates a pending test.
- `only` mode applies across the whole registered tree.
- Async tests and hooks are supported via promises.
- `mock.fetch()` returns a restore function and can simulate rejected fetches by supplying an `Error`.
