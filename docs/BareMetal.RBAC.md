# BareMetal.RBAC

> Client-side role-based access control for JWT-backed UI checks, permission helpers, and DOM gating.

**Size:** 18.65 KB source / 8.88 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.RBAC.min.js"></script>
<script>
  var tokenFromServer = 'header.payload.signature';

  BareMetal.RBAC.configure({
    tokenSource: 'manual',
    claimMapping: { roles: 'realm_access.roles' },
    rolePermissions: {
      editor: ['article:read', 'article:write']
    },
    groupRoles: {
      Marketing: ['editor']
    },
    superRoles: ['admin']
  });

  BareMetal.RBAC.setToken(tokenFromServer);

  if (BareMetal.RBAC.can('article:write')) {
    console.log('Show edit button');
  }
</script>
```

## API Reference

### `WARNING` → `string`

Built-in reminder that this module is only for client-side UI hints and must not be trusted for real authorization.

**Example:**
```js
console.warn(BareMetal.RBAC.WARNING);
```

### `configure(options)` → `object|null`

Configures token lookup, claim mapping, role inheritance, super roles, and the optional change callback. The module immediately refreshes the cached identity and returns it.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | RBAC configuration; see the options table below. |

**Example:**
```js
BareMetal.RBAC.configure({
  tokenSource: 'localStorage',
  tokenKey: 'auth_token',
  claimMapping: { roles: 'realm_access.roles' },
  rolePermissions: { editor: ['docs:write'] },
  groupRoles: { Engineering: ['editor'] }
});
```

### `identity()` → `object|null`

Returns the current derived identity, including `userId`, `email`, `name`, `tenant`, `roles`, `groups`, `permissions`, `scopes`, and the raw JWT payload.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
var me = BareMetal.RBAC.identity();
console.log(me && me.roles);
```

### `isAuthenticated()` → `boolean`

Returns `true` when a non-expired token is available from the configured sources.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
if (BareMetal.RBAC.isAuthenticated()) console.log('Signed in');
```

### `hasRole(role)` → `boolean`

Checks whether the current identity has a specific role.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| role | string | — | Required role name. |

**Example:**
```js
BareMetal.RBAC.hasRole('editor');
```

### `hasAnyRole(roles)` → `boolean`

Checks whether the current identity has at least one role from the supplied list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| roles | string[] | — | Candidate roles. |

**Example:**
```js
BareMetal.RBAC.hasAnyRole(['editor', 'reviewer']);
```

### `hasAllRoles(roles)` → `boolean`

Checks whether the current identity has every role in the supplied list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| roles | string[] | — | Required roles. |

**Example:**
```js
BareMetal.RBAC.hasAllRoles(['editor', 'publisher']);
```

### `inGroup(group)` → `boolean`

Checks whether the current identity belongs to a specific group.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| group | string | — | Group name. |

**Example:**
```js
BareMetal.RBAC.inGroup('Engineering');
```

### `inAnyGroup(groups)` → `boolean`

Checks whether the current identity belongs to at least one group in the list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| groups | string[] | — | Candidate groups. |

**Example:**
```js
BareMetal.RBAC.inAnyGroup(['Sales', 'Engineering']);
```

### `inAllGroups(groups)` → `boolean`

Checks whether the current identity belongs to every group in the list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| groups | string[] | — | Required groups. |

**Example:**
```js
BareMetal.RBAC.inAllGroups(['Engineering', 'OnCall']);
```

### `can(permission)` → `boolean`

Checks whether the current identity has a permission, either directly from claims or inherited through `rolePermissions`. `superRoles` automatically pass permission checks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| permission | string | — | Required permission. |

**Example:**
```js
BareMetal.RBAC.can('article:delete');
```

### `canAny(permissions)` → `boolean`

Checks whether the current identity has at least one permission in the list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| permissions | string[] | — | Candidate permissions. |

**Example:**
```js
BareMetal.RBAC.canAny(['article:write', 'article:publish']);
```

### `canAll(permissions)` → `boolean`

Checks whether the current identity has every permission in the list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| permissions | string[] | — | Required permissions. |

**Example:**
```js
BareMetal.RBAC.canAll(['article:read', 'article:write']);
```

### `hasScope(scope)` → `boolean`

Checks whether the current identity contains a specific OAuth scope.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| scope | string | — | Scope value. |

**Example:**
```js
BareMetal.RBAC.hasScope('api');
```

### `hasAnyScope(scopes)` → `boolean`

Checks whether the current identity contains at least one scope in the list.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| scopes | string[] | — | Candidate scopes. |

**Example:**
```js
BareMetal.RBAC.hasAnyScope(['profile', 'api']);
```

### `check(criteria)` → `boolean`

Runs a combined all-of check over auth state, roles, groups, permissions, scopes, and tenant. Arrays inside `criteria` are treated as "must have all".

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| criteria | object | `{}` | Composite rules object. |

**Example:**
```js
BareMetal.RBAC.check({
  roles: ['editor'],
  permissions: ['article:write'],
  scopes: ['api']
});
```

### `checkAny(criteria)` → `boolean`

Runs a combined any-of check. If any supplied category matches, the result is `true`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| criteria | object | `{}` | Composite rules object. |

**Example:**
```js
BareMetal.RBAC.checkAny({
  roles: ['admin'],
  permissions: ['article:write']
});
```

### `guard(criteria)` → `function`

Returns a zero-argument function that re-runs `check(criteria)` when called.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| criteria | object | `{}` | Composite rules object. |

**Example:**
```js
var canPublish = BareMetal.RBAC.guard({ permissions: ['article:publish'] });
if (canPublish()) console.log('Publish is allowed');
```

### `applyDOM(rootElement)` → `number`

Applies RBAC rules to `data-rbac-*` attributes under `rootElement` and returns the number of processed nodes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| rootElement | Element\|Document | `document` | Root node to scan. |

**Example:**
```js
BareMetal.RBAC.applyDOM(document.body);
```

### `setToken(token)` → `object|null`

Sets the in-memory manual token and refreshes the cached identity.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| token | string | — | JWT string to use as the manual token. |

**Example:**
```js
BareMetal.RBAC.configure({ tokenSource: 'manual' });
BareMetal.RBAC.setToken(tokenFromServer);
```

### `clearToken()` → `null`

Clears the manual token, cached identity, and expiry timer.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
BareMetal.RBAC.clearToken();
```

### `refresh()` → `object|null`

Forces a re-read of the configured token sources and rebuilds the cached identity.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
localStorage.setItem('auth_token', tokenFromServer);
BareMetal.RBAC.refresh();
```

### `onExpiry(callback)` → `function`

Registers a callback that fires when the cached token expires. Returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Called with the last identity snapshot. |

**Example:**
```js
var stop = BareMetal.RBAC.onExpiry(function () {
  console.log('Token expired');
});
```

### `tenant()` → `string|null`

Returns the current tenant identifier, if one can be resolved from the token.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(BareMetal.RBAC.tenant());
```

### `isTenant(value)` → `boolean`

Checks whether the current identity belongs to a specific tenant.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | string | — | Tenant identifier to compare. |

**Example:**
```js
BareMetal.RBAC.isTenant('org-1');
```

## Configuration / Options

### `configure()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| `tokenSource` | string | `'localStorage'` | Preferred lookup source: `localStorage`, `sessionStorage`, `cookie`, or `manual`. |
| `tokenKey` | string | `'auth_token'` | Storage key or cookie name. |
| `claimMapping` | object | `{}` | Overrides claim paths for `roles`, `groups`, `permissions`, `scopes`, `userId`, `email`, `tenant`, and `name`. |
| `rolePermissions` | object | `{}` | Maps roles to inherited permissions. |
| `groupRoles` | object | `{}` | Maps groups to inherited roles. |
| `superRoles` | string[] | `[]` | Roles that automatically satisfy permission checks. |
| `onChange` | function\|null | `null` | Called with the refreshed identity or `null`. |

### Supported DOM attributes

| Attribute | Example | Effect |
|-----------|---------|--------|
| `data-rbac-show` | `role:admin,perm:docs:write` | Shows the element when any listed rule matches. |
| `data-rbac-hide` | `role:guest` | Hides the element when any listed rule matches. |
| `data-rbac-disable` | `perm:dangerous-action` | Keeps the element enabled only when a listed rule matches. |
| `data-rbac-class` | `role:admin=admin-view,perm:edit=editable` | Adds or removes classes per rule. |

### Rule formats

Use these rule prefixes in DOM attributes:

| Rule | Meaning |
|------|---------|
| `auth` | User is authenticated |
| `role:name` | Has role |
| `perm:name` | Has permission |
| `group:name` | In group |
| `scope:name` | Has OAuth scope |
| `tenant:id` | Matches tenant |

## Notes
- JWT payloads are decoded client-side without signature verification. Treat results as presentation hints only.
- Token lookup order starts with `tokenSource`, then falls back through the other built-in sources.
- `scope` and `scp` claims are split on whitespace, so `'openid profile api'` becomes three scopes.
- `permissions` are the union of direct permission claims plus anything inherited through `rolePermissions`.
- Expired tokens clear the cached identity, trigger `onChange(null)`, and notify `onExpiry()` listeners.