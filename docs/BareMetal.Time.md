# BareMetal.Time

> Small date/time helper for parsing, formatting, arithmetic, relative output, durations, timezones, and Temporal interop.

**Size:** 11.7 KB source / 6.9 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Time.min.js"></script>
<script>
var meeting = BareMetal.Time.parse('2026-04-20T17:30:00');
var reminder = BareMetal.Time.subtract(meeting, 15, 'minutes');

console.log(BareMetal.Time.format(reminder, 'YYYY-MM-DD HH:mm'));
console.log(BareMetal.Time.formatRelative(meeting));
</script>
```

## API Reference

All methods work with the module's plain date-time object:

```js
{
  year: 2026,
  month: 4,
  day: 20,
  hour: 17,
  minute: 30,
  second: 0,
  ms: 0,
  iso: '2026-04-20T16:30:00.000Z',
  ts: 1776702600000
}
```

### `now()` → `DateTimeObject`

Returns the current local date/time.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
var dt = BareMetal.Time.now();
```

### `utcNow()` → `DateTimeObject`

Builds a date/time object from the current UTC calendar parts.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
var dt = BareMetal.Time.utcNow();
```

### `parse(input)` → `DateTimeObject`

Parses a module date object, `Date`, timestamp, ISO-like string, or Temporal date-time object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | object \| Date \| number \| string | — | Value to parse |

**Example:**
```js
var dt = BareMetal.Time.parse('2024-06-15T10:30:00');
```

### `create(year, month, day, hour, minute, second, ms)` → `DateTimeObject`

Creates a date/time object. Months are **1-based**.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| year | number | — | Full year |
| month | number | — | Month `1-12` |
| day | number | — | Day of month |
| hour | number | `0` | Hour |
| minute | number | `0` | Minute |
| second | number | `0` | Second |
| ms | number | `0` | Milliseconds |

**Example:**
```js
var dt = BareMetal.Time.create(2024, 12, 25, 14, 30, 45, 123);
```

### `fromDate(date)` → `DateTimeObject`

Converts a native `Date` into the module shape.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| date | Date | — | Native date |

**Example:**
```js
var dt = BareMetal.Time.fromDate(new Date());
```

### `format(dt, pattern)` → `string`

Formats a date/time object using a small token set.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Date/time object |
| pattern | string | — | Output format |

**Example:**
```js
BareMetal.Time.format(dt, 'dddd, MMMM DD YYYY HH:mm');
```

### `formatRelative(dt, base)` → `string`

Returns an English relative-time string such as `3 minutes ago` or `in 2 hours`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Target date/time |
| base | object | `now()` | Comparison point |

**Example:**
```js
BareMetal.Time.formatRelative(deadline, BareMetal.Time.now());
```

### `toISO(dt)` → `string`

Returns the stored ISO string for a date/time object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Date/time object |

**Example:**
```js
var iso = BareMetal.Time.toISO(dt);
```

### `toDate(dt)` → `Date`

Converts the module shape back to a native `Date`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Date/time object |

**Example:**
```js
var nativeDate = BareMetal.Time.toDate(dt);
```

### `add(dt, amount, unit)` → `DateTimeObject`

Returns a new date/time object with time added.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Base date/time |
| amount | number | — | Amount to add |
| unit | string | — | `years`, `months`, `days`, `hours`, `minutes`, `seconds`, or `ms` |

**Example:**
```js
var due = BareMetal.Time.add(dt, 30, 'days');
```

### `subtract(dt, amount, unit)` → `DateTimeObject`

Returns a new date/time object with time subtracted.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Base date/time |
| amount | number | — | Amount to subtract |
| unit | string | — | Same units as `add()` |

**Example:**
```js
var start = BareMetal.Time.subtract(deadline, 2, 'hours');
```

### `startOf(dt, unit)` → `DateTimeObject`

Returns the start of a `year`, `month`, `day`, `hour`, or `minute`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Base date/time |
| unit | string | — | Precision unit |

**Example:**
```js
var monthStart = BareMetal.Time.startOf(dt, 'month');
```

### `endOf(dt, unit)` → `DateTimeObject`

Returns the inclusive end of a `year`, `month`, `day`, `hour`, or `minute`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Base date/time |
| unit | string | — | Precision unit |

**Example:**
```js
var dayEnd = BareMetal.Time.endOf(dt, 'day');
```

### `isBefore(a, b)` → `boolean`

Checks whether `a.ts < b.ts`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| a | object | — | First date/time |
| b | object | — | Second date/time |

**Example:**
```js
BareMetal.Time.isBefore(start, end);
```

### `isAfter(a, b)` → `boolean`

Checks whether `a.ts > b.ts`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| a | object | — | First date/time |
| b | object | — | Second date/time |

**Example:**
```js
BareMetal.Time.isAfter(deadline, now);
```

### `isSame(a, b, precision)` → `boolean`

Compares two dates exactly, or by `year`, `month`, `day`, `hour`, or `minute`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| a | object | — | First date/time |
| b | object | — | Second date/time |
| precision | string | exact | Optional comparison precision |

**Example:**
```js
BareMetal.Time.isSame(a, b, 'day');
```

### `isBetween(dt, start, end)` → `boolean`

Inclusive range test using `ts` values.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Value to test |
| start | object | — | Range start |
| end | object | — | Range end |

**Example:**
```js
BareMetal.Time.isBetween(slot, windowStart, windowEnd);
```

### `diff(a, b, unit)` → `number`

Returns `a - b` in milliseconds by default, or in `seconds`, `minutes`, `hours`, or `days`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| a | object | — | Left-hand date/time |
| b | object | — | Right-hand date/time |
| unit | string | `'ms'` | Output unit |

**Example:**
```js
var hours = BareMetal.Time.diff(end, start, 'hours');
```

### `duration(ms)` → `object`

Breaks a millisecond value into `days`, `hours`, `minutes`, `seconds`, `ms`, and `total`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| ms | number | — | Duration in milliseconds |

**Example:**
```js
var d = BareMetal.Time.duration(93784500);
```

### `formatDuration(ms, opts)` → `string`

Formats a duration as short output like `2h 15m 30s` or long output like `3 days, 4 hours`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| ms | number | — | Duration in milliseconds |
| opts | object | `{ short: true }` | Formatting options |

**Example:**
```js
BareMetal.Time.formatDuration(3 * 86400000 + 4 * 3600000, { short: false });
```

### `daysInMonth(year, month)` → `number`

Returns the number of days in a 1-based month.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| year | number | — | Full year |
| month | number | — | Month `1-12` |

**Example:**
```js
BareMetal.Time.daysInMonth(2024, 2); // 29
```

### `isLeapYear(year)` → `boolean`

Checks Gregorian leap-year rules.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| year | number | — | Full year |

**Example:**
```js
BareMetal.Time.isLeapYear(2024);
```

### `dayOfWeek(dt)` → `number`

Returns ISO-style day numbers where Monday is `1` and Sunday is `7`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Date/time object |

**Example:**
```js
BareMetal.Time.dayOfWeek(BareMetal.Time.create(2024, 1, 1)); // 1
```

### `dayOfWeekName(dt)` → `string`

Returns full English day names such as `Monday`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Date/time object |

**Example:**
```js
BareMetal.Time.dayOfWeekName(dt);
```

### `weekNumber(dt)` → `number`

Returns the ISO week number.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Date/time object |

**Example:**
```js
BareMetal.Time.weekNumber(BareMetal.Time.create(2024, 1, 1)); // 1
```

### `toTimezone(dt, tz)` → `DateTimeObject`

Projects a date/time into another IANA timezone and returns a new object with that wall-clock time.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Source date/time |
| tz | string | — | IANA timezone, e.g. `Europe/London` |

**Example:**
```js
var london = BareMetal.Time.toTimezone(dt, 'Europe/London');
```

### `getTimezone()` → `string`

Returns the browser's current IANA timezone.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(BareMetal.Time.getTimezone());
```

### `hasTemporal()` → `boolean`

Checks whether the Temporal API is available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
if (BareMetal.Time.hasTemporal()) {
  console.log('Temporal is available');
}
```

### `toTemporal(dt)` → `Temporal.PlainDateTime`

Converts a module date/time object into `Temporal.PlainDateTime`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dt | object | — | Date/time object |

**Example:**
```js
var t = BareMetal.Time.toTemporal(dt);
```

### `fromTemporal(t)` → `DateTimeObject`

Converts `Temporal.PlainDateTime` or similar plain Temporal values back into the module shape.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| t | object | — | Temporal object with date/time fields |

**Example:**
```js
var dt = BareMetal.Time.fromTemporal(Temporal.PlainDateTime.from('2026-04-20T17:30:00'));
```

## Configuration / Options

### Format tokens

| Token | Meaning |
|-------|---------|
| `YYYY` | 4-digit year |
| `MMMM` | Full month name |
| `MMM` | Short month name |
| `MM` | 2-digit month |
| `dddd` | Full weekday name |
| `ddd` | Short weekday name |
| `DD` | 2-digit day |
| `HH` | 2-digit 24-hour |
| `mm` | 2-digit minute |
| `ss` | 2-digit second |

### Supported units

| Method | Units |
|--------|-------|
| `add()` / `subtract()` | `years`, `months`, `days`, `hours`, `minutes`, `seconds`, `ms` |
| `startOf()` / `endOf()` | `year`, `month`, `day`, `hour`, `minute` |
| `diff()` | `seconds`, `minutes`, `hours`, `days`, or omitted for milliseconds |
| `isSame()` | `year`, `month`, `day`, `hour`, `minute`, or omitted for exact compare |
| `formatDuration()` | `{ short: true|false }` |

## Examples

### Example 1: Build a delivery window
```html
<script src="BareMetal.Time.min.js"></script>
<script>
var slot = BareMetal.Time.parse('2026-05-05T09:30:00');
var windowStart = BareMetal.Time.startOf(slot, 'hour');
var windowEnd = BareMetal.Time.endOf(slot, 'hour');

console.log(BareMetal.Time.format(windowStart, 'YYYY-MM-DD HH:mm'));
console.log(BareMetal.Time.format(windowEnd, 'YYYY-MM-DD HH:mm'));
</script>
```

### Example 2: Show another timezone and a human duration
```js
var call = BareMetal.Time.parse('2026-05-05T16:00:00Z');
var sydney = BareMetal.Time.toTimezone(call, 'Australia/Sydney');
var untilCall = BareMetal.Time.diff(call, BareMetal.Time.now());

console.log(BareMetal.Time.format(sydney, 'dddd HH:mm'));
console.log(BareMetal.Time.formatDuration(untilCall));
```

## Notes
- `parse()` throws for invalid strings, `null`/`undefined`, and unsupported input types.
- The object shape is timezone-light: `toTimezone()` returns converted wall-clock fields, but no timezone identifier is stored on the result.
- `formatRelative()` always uses English output.
- `formatDuration()` does not include sub-second fragments in the human-readable string.
- `toTemporal()` throws if Temporal is not available in the runtime.
