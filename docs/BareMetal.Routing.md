# BareMetal.Routing

> Lightweight History API router for client-side BareMetal applications.

**Size:** 7.1 KB source / 2.3 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Routing.min.js"></script>
<script>
  BMRouter
    .on('/', () => renderHome())
    .on('/customers', () => renderCustomerList())
    .on('/customers/:id', ({ id }) => renderCustomerDetail(id))
    .notFound(path => renderNotFound(path))
    .start();
</script>
```

## API Reference

### `on(pattern, handler)` → `BMRouter`

Registers a route handler. Patterns support named params like `:id`, a catch-all `*`, and optional trailing slashes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| pattern | string | — | Route pattern such as `/:entity/:id/edit`. |
| handler | function | — | Called as `handler(params, query, state)` when matched. |

**Example:**
```js
BMRouter.on('/projects/:id/edit', ({ id }, query) => openEditor(id, query.tab));
```

### `notFound(handler)` → `BMRouter`

Registers a fallback handler for unmatched routes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| handler | function | — | Called as `handler(pathname, query)`. |

**Example:**
```js
BMRouter.notFound(path => console.warn('No route for', path));
```

### `start()` → `void`

Starts routing by listening for `popstate`, intercepting internal anchor clicks, and dispatching the current URL immediately.

**Example:**
```js
BMRouter.start();
```

### `navigate(path, state, replace)` → `void`

Pushes or replaces a history entry, parses query parameters, and dispatches without a page reload.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| path | string | — | Absolute path, optionally including a query string. |
| state | object | `null` | History state object. |
| replace | boolean | `false` | Uses `replaceState()` when true. |

**Example:**
```js
BMRouter.navigate('/customers/42?tab=notes', { from: 'search' });
```

### `window.BMRouter` → `object`

Global alias for `BareMetal.Routing`.

**Example:**
```js
window.BMRouter.navigate('/orders');
```

## Configuration / Options

### Pattern syntax

| Pattern | Meaning |
|---------|---------|
| `/customers` | Exact path match |
| `/:entity/:id` | Named segments become `params.entity` and `params.id` |
| `/files/*` | Catch-all segment becomes `params['*']` |

### Query parsing behavior

| Input | Result |
|-------|--------|
| `?tab=details` | `{ tab: 'details' }` |
| `?tag=a&tag=b` | `{ tag: ['a', 'b'] }` |
| `?draft` | `{ draft: '' }` |

### Link interception rules

`start()` intercepts same-origin links unless the target path starts with one of these excluded prefixes:

- `/api/`
- `/auth/`
- `/admin/`
- `/login`
- `/logout`
- `/meta/`
- `/status`
- `/metrics`

Anchors with `target="_blank"` are ignored, and `data-replace="true"` switches intercepted navigation to `replaceState()`.

## Examples

### Example 1: CRUD routes
```js
BMRouter
  .on('/', () => showDashboard())
  .on('/:entity', ({ entity }, query) => showList(entity, query.page || 1))
  .on('/:entity/create', ({ entity }) => showCreate(entity))
  .on('/:entity/:id', ({ entity, id }) => showDetail(entity, id))
  .start();
```

### Example 2: Internal links without page reloads
```html
<nav>
  <a href="/projects">Projects</a>
  <a href="/projects?stage=active" data-replace="true">Active projects</a>
</nav>
<script>
  BMRouter.on('/projects', (params, query) => loadProjects(query.stage || 'all')).start();
</script>
```

## Notes
- Routes are matched in registration order, so register specific patterns before generic ones.
- Absolute same-origin URLs are converted to pathname + query before matching.
- Query values are URL-decoded, and repeated keys are collected into arrays.
