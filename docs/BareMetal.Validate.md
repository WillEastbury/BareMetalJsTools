# BareMetal.Validate

> Tiny schema validator for forms and payloads with nested objects, arrays, and custom rules.

**Size:** 4.0 KB source / 2.6 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Validate.min.js"></script>
<script>
var schema = {
  email: { required: true, email: true },
  password: { required: true, minLength: 12 },
  profile: {
    type: 'object',
    schema: {
      website: { url: true }
    }
  }
};

var result = BareMetal.Validate.validate(schema, {
  email: 'dev@example.com',
  password: 'CorrectHorseBatteryStaple',
  profile: { website: 'https://example.com' }
});

console.log(result.valid, result.errors);
</script>
```

## API Reference

### `validate(schema, data)` → `{ valid, errors }`

Validates a data object against a field schema and returns a boolean plus an array of error objects.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| schema | object | `{}` | Top-level field schema map |
| data | object | `{}` | Data to validate |

**Example:**
```js
var result = BareMetal.Validate.validate({
  age: { type: 'number', min: 18 }
}, {
  age: 16
});

console.log(result.errors[0]);
// { path: 'age', code: 'min', message: 'Must be at least 18.' }
```

### `addRule(name, fn)` → `function`

Registers a reusable named rule. The returned function removes it again.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | Rule property name to add to schemas |
| fn | function | — | Validator called as `(value, ruleValue, root, path, rule)` |

**Example:**
```js
var removeHex = BareMetal.Validate.addRule('hexColour', function (value, enabled) {
  if (!enabled) return;
  return /^#[0-9a-f]{6}$/i.test(value) ? '' : 'Expected a 6-digit hex colour.';
});
```

## Configuration / Options

### Built-in rule keys

| Rule | Type | Description |
|------|------|-------------|
| `required` | boolean | Fails when the value is `null`, `undefined`, or a blank string |
| `type` | string | `string`, `number`, `boolean`, `object`, or `array` |
| `min` | number | Minimum numeric value |
| `max` | number | Maximum numeric value |
| `minLength` | number | Minimum string length |
| `maxLength` | number | Maximum string length |
| `pattern` | string \| RegExp | String/regex pattern for string values |
| `email` | boolean | Basic email validation |
| `url` | boolean | URL validation via `new URL()` |
| `custom` | function | Inline validator called as `(value, root, path, rule)` |
| `schema` | object | Nested field schema for `type: 'object'` |
| `items` | object | Per-item schema for `type: 'array'` |

### Validation result shape

| Field | Type | Description |
|-------|------|-------------|
| `valid` | boolean | `true` when `errors.length === 0` |
| `errors` | array | List of `{ path, code, message }` entries |

## Examples

### Example 1: Nested object and array validation
```html
<script src="BareMetal.Validate.min.js"></script>
<script>
var schema = {
  customer: {
    type: 'object',
    schema: {
      email: { required: true, email: true }
    }
  },
  items: {
    type: 'array',
    items: {
      type: 'object',
      schema: {
        sku: { required: true },
        qty: { type: 'number', min: 1 }
      }
    }
  }
};

console.log(BareMetal.Validate.validate(schema, {
  customer: { email: 'bad-address' },
  items: [{ sku: '', qty: 0 }]
}).errors);
</script>
```

### Example 2: Reusable custom rule
```js
BareMetal.Validate.addRule('startsWith', function (value, prefix) {
  if (typeof value !== 'string') return 'Expected a string.';
  return value.indexOf(prefix) === 0 ? '' : 'Must start with ' + prefix + '.';
});

var result = BareMetal.Validate.validate({
  code: { startsWith: 'BM-' }
}, {
  code: 'APP-100'
});
```

## Notes
- Top-level schemas are field maps: each property in `schema` validates the property with the same name in `data`.
- Blank strings are treated as missing values for `required` checks.
- Nested object paths use dot notation like `customer.email`; arrays use brackets like `items[0]`.
- Custom validators may return an error string or any falsy value for success.
- Exceptions inside custom validators are swallowed so validation can continue.
- `addRule()` will not overwrite built-in rule names.
