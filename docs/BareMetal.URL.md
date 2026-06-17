# BareMetal.URL

> URL parsing, building, query handling, routing, and normalization utilities.

**Size:** 20 KB source / 9 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.URL.min.js"></script>
<script>
  const info = BareMetal.URL.parse('https://example.com/shop/items?id=42#specs');
  const clean = BareMetal.URL.normalize('HTTPS://Example.com:443/shop/../shop/items?id=42');
  console.log(info.params.id, clean);
</script>
```

## API Reference

### `parse(url)` → `object`

Parses a URL into origin, path, query, hash, and path segment parts.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL or path to parse. |

**Example:**
```js
const parsed = BareMetal.URL.parse('/orders/42?tab=items#totals');
console.log(parsed.pathname, parsed.params.tab, parsed.hash);
```

### `build(parts)` → `string`

Builds a URL string from parsed parts.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| parts | object | — | URL pieces such as `protocol`, `host`, `pathname`, `segments`, `params`, and `hash`. |

**Example:**
```js
const href = BareMetal.URL.build({
  protocol: 'https',
  host: 'example.com',
  pathname: '/orders/42',
  params: { tab: 'items' },
  hash: 'totals'
});
```

### `query.encode(obj)` → `string`

Encodes an object into a query string.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| obj | object | — | Query input, including arrays and nested objects. |

**Example:**
```js
BareMetal.URL.query.encode({ q: 'desk lamp', tags: ['sale', 'new'] });
```

### `query.decode(queryString)` → `object`

Decodes a query string into an object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| queryString | string | — | Query string with or without a leading `?`. |

**Example:**
```js
const params = BareMetal.URL.query.decode('?page=2&filter=active');
```

### `query.merge(url, paramsObject)` → `string`

Merges query params into an existing URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | Base URL. |
| paramsObject | object | — | Params to add or replace. |

**Example:**
```js
const next = BareMetal.URL.query.merge('/products?page=1', { page: 2, sort: 'price' });
```

### `query.remove(url, keys)` → `string`

Removes one or more query keys from a URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to edit. |
| keys | string \| array | — | Query key or keys to remove. |

**Example:**
```js
BareMetal.URL.query.remove('/products?page=2&debug=1', ['debug']);
```

### `params(pattern, url)` → `object | null`

Extracts named route params from a URL path.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| pattern | string | — | Route template such as `/orders/:id`. |
| url | string | — | URL or path to match. |

**Example:**
```js
const match = BareMetal.URL.params('/teams/:teamId/users/:userId', '/teams/7/users/22');
```

### `template(pattern, data)` → `string`

Fills `:param` tokens in a route template.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| pattern | string | — | Template path containing `:name` placeholders. |
| data | object | — | Replacement values. |

**Example:**
```js
BareMetal.URL.template('/orders/:id/items/:itemId', { id: 42, itemId: 9 });
```

### `join(...parts)` → `string`

Joins URL or path segments without double slashes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| parts | string[] | — | Path or URL segments to join. |

**Example:**
```js
BareMetal.URL.join('https://example.com/', '/api/', 'orders', '42');
```

### `normalize(url)` → `string`

Normalizes case, path segments, ports, and query ordering for reliable comparisons.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to normalize. |

**Example:**
```js
BareMetal.URL.normalize('HTTPS://Example.com:443/shop/../items?b=2&a=1');
```

### `isAbsolute(url)` → `boolean`

Returns `true` when a URL includes a protocol or network-path prefix.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to inspect. |

**Example:**
```js
BareMetal.URL.isAbsolute('https://example.com/app');
```

### `isRelative(url)` → `boolean`

Returns `true` for relative paths.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to inspect. |

**Example:**
```js
BareMetal.URL.isRelative('../images/logo.svg');
```

### `resolve(base, relative)` → `string`

Resolves a relative path or URL against a base URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| base | string | — | Base URL. |
| relative | string | — | Relative or absolute target. |

**Example:**
```js
BareMetal.URL.resolve('https://example.com/app/users/', '../settings');
```

### `compare(a, b)` → `boolean`

Compares two URLs after normalization.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| a | string | — | First URL. |
| b | string | — | Second URL. |

**Example:**
```js
BareMetal.URL.compare('https://example.com:443/a?b=2&a=1', 'https://example.com/a?a=1&b=2');
```

### `slug(text)` → `string`

Creates a URL-safe slug from free text.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| text | string | — | Source text. |

**Example:**
```js
BareMetal.URL.slug('Café Specials & Launch Notes');
```

### `encode(value)` → `string`

Safely encodes a URL component.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | string | — | Raw value. |

**Example:**
```js
BareMetal.URL.encode('spring sale');
```

### `decode(value)` → `string`

Safely decodes a URL component.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | string | — | Encoded value. |

**Example:**
```js
BareMetal.URL.decode('spring%20sale');
```

### `hash.get(url)` → `string`

Returns the hash fragment without modifying the rest of the URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to inspect. |

**Example:**
```js
BareMetal.URL.hash.get('/docs/api#examples');
```

### `hash.set(url, value)` → `string`

Adds or replaces a URL hash fragment.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to update. |
| value | string | — | New hash value without `#`. |

**Example:**
```js
BareMetal.URL.hash.set('/docs/api', 'examples');
```

### `origin(url)` → `string`

Returns just the origin portion of a URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to inspect. |

**Example:**
```js
BareMetal.URL.origin('https://example.com:8443/app/users');
```

### `isValid(url)` → `boolean`

Checks whether a URL can be parsed successfully.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | — | URL to validate. |

**Example:**
```js
BareMetal.URL.isValid('https://example.com/products');
```

### `relative(from, to)` → `string`

Builds a same-origin relative path from one URL to another.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | string | — | Starting URL. |
| to | string | — | Destination URL. |

**Example:**
```js
BareMetal.URL.relative('https://example.com/app/orders/', 'https://example.com/app/settings/profile');
```

## Notes
- `query.encode()` supports nested objects and arrays using bracket notation.
- `query.decode()` preserves keys without values by returning `null` for that key.
- `normalize()` strips default ports for `http`, `https`, `ws`, and `wss`.
- `params()` supports named segments and a trailing `*` catch-all, but not regex route patterns.
