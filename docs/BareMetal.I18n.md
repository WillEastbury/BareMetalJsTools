# BareMetal.I18n

> Lightweight translation helper with locale fallback chains, interpolation, pluralisation, and RTL detection.

**Size:** 5.0 KB source / 2.5 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.I18n.min.js"></script>
<script>
BareMetal.I18n.configure({ defaultLocale: 'en', fallbackLocale: 'en' });
BareMetal.I18n.addMessages('en', {
  nav: { home: 'Home' },
  cart_zero: 'No items',
  cart_one: '{count} item',
  cart_other: '{count} items'
});

BareMetal.I18n.setLocale('en-GB');
console.log(BareMetal.I18n.t('nav.home'));
console.log(BareMetal.I18n.t('cart', { count: 3 }));
</script>
```

## API Reference

### `setLocale(code)` → `string`

Sets the active locale. Subscribers are notified only when the locale actually changes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| code | string | `'en'` | Locale code such as `en`, `en-GB`, or `fr` |

**Example:**
```js
BareMetal.I18n.setLocale('fr-CA');
```

### `getLocale()` → `string`

Returns the current active locale code.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters |

**Example:**
```js
console.log(BareMetal.I18n.getLocale());
```

### `configure(opts)` → `{ defaultLocale, fallbackLocale }`

Configures the default and fallback locale chain.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | object | `{}` | Locale settings |

**Example:**
```js
BareMetal.I18n.configure({
  defaultLocale: 'en',
  fallbackLocale: 'en-GB'
});
```

### `addMessages(locale, messages)` → `object`

Merges message data into a locale table. Nested objects are flattened to dot-path keys.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| locale | string | — | Target locale |
| messages | object | — | Message tree or flat map |

**Example:**
```js
BareMetal.I18n.addMessages('en', {
  common: { save: 'Save', cancel: 'Cancel' }
});

console.log(BareMetal.I18n.t('common.save'));
```

### `t(key, params)` → `string`

Translates a key using the active locale chain, applies interpolation, and supports plural suffixes when `params.count` is present.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| key | string | — | Message key |
| params | object | — | Interpolation and plural parameters |

**Example:**
```js
BareMetal.I18n.addMessages('en', {
  greeting: 'Hello {name}',
  task_one: '{count} task',
  task_other: '{count} tasks'
});

BareMetal.I18n.t('greeting', { name: 'Will' });
BareMetal.I18n.t('task', { count: 4 });
```

### `loadMessages(locale, url)` → `Promise<object>`

Fetches JSON from a URL and merges it into the locale table.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| locale | string | — | Target locale |
| url | string | — | JSON endpoint |

**Example:**
```js
BareMetal.I18n.loadMessages('de', '/i18n/de.json').then(function () {
  BareMetal.I18n.setLocale('de');
});
```

### `isRTL(locale)` → `boolean`

Detects whether a locale should be rendered right-to-left.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| locale | string | current locale | Locale to test |

**Example:**
```js
document.documentElement.dir = BareMetal.I18n.isRTL('ar') ? 'rtl' : 'ltr';
```

### `subscribe(fn)` → `function`

Subscribes to locale changes. The returned function removes the subscription.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| fn | function | — | Called with the new locale code |

**Example:**
```js
var stop = BareMetal.I18n.subscribe(function (locale) {
  console.log('Locale changed to', locale);
});
```

## Configuration / Options

### `configure()` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultLocale` | string | `'en'` | Final locale in the lookup chain |
| `fallbackLocale` | string | `'en'` | Locale checked before `defaultLocale` |

### Message conventions

| Pattern | Meaning |
|---------|---------|
| `nav.home` | Nested keys are flattened with dot notation |
| `cart_zero` | Used first when `params.count === 0` |
| `cart_one`, `cart_other`, etc. | Plural category keys selected by `Intl.PluralRules` |
| `Hello {name}` | Placeholder interpolation; missing params become empty strings |

### Fallback lookup order

1. Active locale, e.g. `en-GB`
2. Parent locales, e.g. `en`
3. `fallbackLocale`
4. `defaultLocale`

## Examples

### Example 1: Nested messages with plural forms
```html
<script src="BareMetal.I18n.min.js"></script>
<script>
BareMetal.I18n.addMessages('en', {
  dashboard: { title: 'Dashboard' },
  alerts_zero: 'No alerts',
  alerts_one: '{count} alert',
  alerts_other: '{count} alerts'
});

console.log(BareMetal.I18n.t('dashboard.title'));
console.log(BareMetal.I18n.t('alerts', { count: 12 }));
</script>
```

### Example 2: Update document direction on locale changes
```js
BareMetal.I18n.subscribe(function (locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = BareMetal.I18n.isRTL(locale) ? 'rtl' : 'ltr';
});

BareMetal.I18n.setLocale('ar');
```

## Notes
- `addMessages()` stringifies non-null message values before storing them.
- `loadMessages()` resolves with the locale table even if the fetch fails; failures do not reject by design.
- If no translation is found, `t()` returns the original key.
- This module handles message lookup only; number/date formatting still belongs to `Intl` or `BareMetal.Time`.
