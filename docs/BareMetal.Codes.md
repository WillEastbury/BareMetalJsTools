# BareMetal.Codes

> Reference-data collections for countries, currencies, languages, timezones, HTTP, MIME types, colours, payment cards, and unit conversions.

**Size:** 28.24 KB source / 28.79 KB minified  
**Dependencies:** None; `subdivisions()` optionally uses `fetch`

## Quick Start

```html
<script src="BareMetal.Codes.min.js"></script>
<script>
  const country = BareMetal.Codes.countries.get('GB');
  const mime = BareMetal.Codes.mime.get('pdf');
  const miles = BareMetal.Codes.units.convert(10, 'km', 'mi');

  console.log(country.name, mime.type, miles);
</script>
```

## API Reference

Most collection properties expose the same basic API:

| Method | Description |
|--------|-------------|
| `list()` | Returns all entries |
| `get(key)` | Returns one entry or `null` |
| `search(query)` | Case-insensitive substring search |

### `countries` → `Collection`

Country reference data keyed by ISO-style country code.

| Item shape | Key |
|------------|-----|
| `{ code, name, currency, phone }` | `code` |

**Example:**
```js
const gb = BareMetal.Codes.countries.get('GB');
const matches = BareMetal.Codes.countries.search('united');
```

### `currencies` → `Collection`

Currency reference data keyed by currency code.

| Item shape | Key |
|------------|-----|
| `{ code, name, symbol, decimals }` | `code` |

**Example:**
```js
const usd = BareMetal.Codes.currencies.get('USD');
```

### `days` → `Collection`

Weekday data keyed by day number.

| Item shape | Key |
|------------|-----|
| `{ name, abbr, num }` | `num` |

**Example:**
```js
const monday = BareMetal.Codes.days.get(1);
```

### `months` → `Collection`

Month data keyed by month number.

| Item shape | Key |
|------------|-----|
| `{ name, abbr, num, days }` | `num` |

**Example:**
```js
const february = BareMetal.Codes.months.get(2);
```

### `languages` → `Collection`

Language data keyed by language code.

| Item shape | Key |
|------------|-----|
| `{ code, name, native }` | `code` |

**Example:**
```js
const english = BareMetal.Codes.languages.get('en');
```

### `timezones` → `Collection`

Timezone reference data keyed by timezone ID.

| Item shape | Key |
|------------|-----|
| `{ id, offset, description }` | `id` |

**Example:**
```js
const london = BareMetal.Codes.timezones.get('Europe/London');
```

### `http` → `Collection`

HTTP status metadata keyed by numeric status code.

| Item shape | Key |
|------------|-----|
| `{ code, phrase, category }` | `code` |

**Example:**
```js
const notFound = BareMetal.Codes.http.get(404);
```

### `mime` → `Collection`

MIME reference data keyed by file extension.

| Method | Description |
|--------|-------------|
| `list()` | Returns `{ ext, type }` entries |
| `get(ext)` | Looks up by file extension |
| `fromType(type)` | Returns the first matching extension entry for a MIME type |
| `search(query)` | Searches extension and MIME type |

**Example:**
```js
const pdf = BareMetal.Codes.mime.get('pdf');
const jpeg = BareMetal.Codes.mime.fromType('image/jpeg');
```

### `colours` → `Collection`

Named CSS colours keyed by colour name.

| Item shape | Key |
|------------|-----|
| `{ name, hex }` | `name` |

**Example:**
```js
const slate = BareMetal.Codes.colours.get('slateblue');
```

### `cards` → `Collection`

Payment card brand reference data keyed by brand name.

| Method | Description |
|--------|-------------|
| `list()` | Returns `{ name, pattern, lengths, cvv, regex }` entries |
| `get(name)` | Looks up a brand by name |
| `search(query)` | Searches by brand name |
| `detect(number)` | Detects a card brand from a card number |

**Example:**
```js
const brand = BareMetal.Codes.cards.detect('4111 1111 1111 1111');
console.log(brand.name, brand.cvv);
```

### `units` → `Collection`

Unit-conversion reference data.

| Method | Description |
|--------|-------------|
| `list()` | Returns `{ category, from, to, factor?, formula? }` entries |
| `get('from>to')` | Looks up a conversion rule |
| `search(query)` | Searches by category and unit symbols |
| `convert(value, from, to)` | Converts a numeric value |

**Example:**
```js
const cToF = BareMetal.Codes.units.convert(21, 'c', 'f');
const kmToMi = BareMetal.Codes.units.convert(5, 'km', 'mi');
```

### `subdivisions(code)` → `Promise<object[]>`

Loads subdivision data from `codes/<CODE>.json` and caches the result in memory.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `code` | `string` | — | Country code, uppercased internally |

**Example:**
```js
const provinces = await BareMetal.Codes.subdivisions('CA');
```

## Configuration / Options

This module has no runtime configuration.

## Examples

### Example 1: Populate location selectors
```html
<select id="country"></select>
<select id="timezone"></select>

<script src="BareMetal.Codes.min.js"></script>
<script>
  country.innerHTML = BareMetal.Codes.countries.list()
    .map(c => `<option value="${c.code}">${c.name}</option>`)
    .join('');

  timezone.innerHTML = BareMetal.Codes.timezones.search('Europe')
    .map(t => `<option value="${t.id}">${t.description} (${t.offset})</option>`)
    .join('');
</script>
```

### Example 2: Validate uploads and card details
```js
const fileType = BareMetal.Codes.mime.get(file.name.split('.').pop());
const cardBrand = BareMetal.Codes.cards.detect(cardNumberInput.value);

if (fileType && fileType.type === 'application/pdf') {
  console.log('PDF upload allowed');
}

if (cardBrand) {
  console.log('Expected CVV length:', cardBrand.cvv);
}
```

## Notes
- Searches are case-insensitive substring matches.
- Collections are parsed lazily on first use.
- `cards.detect()` strips non-digits before matching.
- `units.convert()` throws when no conversion rule exists.
- `subdivisions()` resolves to `[]` when `fetch` is unavailable, the code is empty, or the request fails.
