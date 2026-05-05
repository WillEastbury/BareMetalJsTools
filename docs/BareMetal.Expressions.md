# BareMetal.Expressions

> Prebuilt regex validators and extractors for common web-facing data formats.

**Size:** 24.16 KB source / 16.51 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Expressions.min.js"></script>
<script>
  const email = BareMetal.Expressions.email.extract(' first.last@example.com ');
  const detected = BareMetal.Expressions.detect('550e8400-e29b-41d4-a716-446655440000');

  console.log(email.domain);   // example.com
  console.log(detected);       // ['uuid']
</script>
```

## API Reference

### `list()` → `string[]`

Returns all registered pattern names in registration order.

**Example:**
```js
const names = BareMetal.Expressions.list();
```

### `info(name)` → `object | null`

Returns summary metadata for a pattern.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | — | Registered pattern name |

**Example:**
```js
const meta = BareMetal.Expressions.info('iban');
// { name, description, pattern, examples }
```

### `detect(value)` → `string[]`

Tests a value against all detectable patterns and returns matching names.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `any` | — | Value to inspect |

**Example:**
```js
BareMetal.Expressions.detect('https://example.com');
// ['url']
```

### `register(name, cfg)` → `PatternEntry | null`

Registers a custom pattern.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | — | Property name added to `BareMetal.Expressions` |
| `cfg` | `object` | — | Pattern configuration |

**Example:**
```js
BareMetal.Expressions.register('sku', {
  pattern: /^(?<prefix>[A-Z]{3})-(?<id>\d{5})$/,
  description: 'Inventory SKU',
  examples: ['ABC-12345'],
  extract(value, match) {
    return { prefix: match.groups.prefix, id: Number(match.groups.id) };
  }
});
```

### Built-in pattern properties like `email`, `uuid`, and `jwt` → `PatternEntry`

Each built-in property exposes the same shape:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pattern` | `RegExp` | — | Raw regular expression |
| `description` | `string` | `''` | Human-readable description |
| `examples` | `string[]` | `[]` | Example valid values |
| `detectable` | `boolean` | `true` | Included by `detect()` when true |
| `test(value)` | `Function` | — | Returns `true` for a valid value |
| `extract(value)` | `Function` | — | Returns a normalized object or `null` |

**Built-in patterns:**

| Property | Description | Detectable |
|----------|-------------|------------|
| `email` | Email address | Yes |
| `phone` | International phone number with separators | Yes |
| `phoneStrict` | Strict E.164 phone number | No |
| `url` | HTTP/HTTPS URL | Yes |
| `ipv4` | IPv4 address | Yes |
| `ipv6` | IPv6 address | Yes |
| `macAddress` | MAC address | Yes |
| `zipUS` | US ZIP code | Yes |
| `zipUK` | UK postcode | Yes |
| `zipCA` | Canadian postal code | Yes |
| `zipDE` | German postal code | Yes |
| `zipFR` | French postal code | Yes |
| `zipAU` | Australian postcode | Yes |
| `zipGeneric` | Generic international postal code | No |
| `latLong` | Decimal latitude/longitude pair | Yes |
| `creditCard` | Credit card number with Luhn check | Yes |
| `iban` | International Bank Account Number | Yes |
| `swift` | SWIFT/BIC code | Yes |
| `cvv` | Card security code | Yes |
| `ssn` | US Social Security Number | Yes |
| `nino` | UK National Insurance Number | Yes |
| `passport` | Generic passport number | Yes |
| `dateISO` | ISO `YYYY-MM-DD` date | Yes |
| `dateUS` | US `MM/DD/YYYY` date | Yes |
| `dateEU` | EU `DD/MM/YYYY` date | Yes |
| `time24` | 24-hour time | Yes |
| `time12` | 12-hour time | Yes |
| `datetime` | ISO-8601 datetime | Yes |
| `hex` | Hex string | Yes |
| `hexColour` | Hex colour literal | Yes |
| `uuid` | UUID v4 | Yes |
| `semver` | Semantic version | Yes |
| `jwt` | JSON Web Token | Yes |
| `base64` | Base64 string | No |
| `slug` | Lowercase URL slug | No |
| `domain` | Domain name | Yes |
| `hashtag` | Social hashtag | Yes |
| `mention` | User mention | Yes |
| `alphanumeric` | Letters and digits only | No |
| `alpha` | Letters only, including Unicode | No |
| `numeric` | Signed decimal number | No |
| `integer` | Signed integer | No |
| `whitespace` | Whitespace only | No |
| `noWhitespace` | Non-whitespace only | No |
| `strongPassword` | Password with upper/lower/digit/symbol | No |
| `username` | Username 3-20 chars | No |
| `htmlTag` | HTML/XML tag | Yes |
| `cssSelector` | Basic CSS selector | No |
| `jsonString` | JSON string literal | Yes |
| `markdownLink` | Markdown inline link | Yes |
| `dataUri` | Base64 data URI | Yes |

**Example:**
```js
if (BareMetal.Expressions.creditCard.test(input.value)) {
  const card = BareMetal.Expressions.creditCard.extract(input.value);
  console.log(card.formatted);
}
```

## Configuration / Options

### `register()` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pattern` | `RegExp` | — | Required. Pattern used by `test()` / `extract()` |
| `description` | `string` | `''` | Human-readable label |
| `examples` | `string[]` | `[]` | Sample valid values |
| `prepare` | `Function` | `trimmed` | Preprocesses incoming values before matching |
| `detect` | `boolean` | `true` | Include this pattern in `detect()` |
| `validate` | `Function` | `null` | Additional validation after regex match |
| `extract` | `Function` | `null` | Custom extractor `(value, match) => object` |

## Examples

### Example 1: Validate a signup form
```html
<form id="signupForm">
  <input id="email" placeholder="Email">
  <input id="phone" placeholder="Phone (+44 7911 123456)">
  <input id="password" type="password" placeholder="Password">
</form>

<script src="BareMetal.Expressions.min.js"></script>
<script>
  signupForm.addEventListener('submit', e => {
    e.preventDefault();

    const errors = [];
    if (!BareMetal.Expressions.email.test(email.value)) errors.push('Email is invalid');
    if (!BareMetal.Expressions.phone.test(phone.value)) errors.push('Phone number is invalid');
    if (!BareMetal.Expressions.strongPassword.test(password.value)) errors.push('Password is too weak');

    if (errors.length) alert(errors.join('\n'));
  });
</script>
```

### Example 2: Detect what a pasted value contains
```js
const value = clipboardText.trim();
const matches = BareMetal.Expressions.detect(value);

if (matches.includes('jwt')) {
  const parsed = BareMetal.Expressions.jwt.extract(value);
  console.log(parsed.payload);
} else if (matches.includes('iban')) {
  console.log(BareMetal.Expressions.iban.extract(value).formatted);
}
```

## Notes
- Inputs are trimmed before matching unless a pattern overrides `prepare`.
- `extract()` often normalizes values, for example lowercasing domains or removing phone separators.
- `jwt`, `base64`, and `dataUri` decoding use `Buffer` when available, otherwise `atob`.
- `register()` returns `null` if `name` is invalid or `cfg.pattern` is not a `RegExp`.
