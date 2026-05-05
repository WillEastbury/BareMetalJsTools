# BareMetal.Auth

> OIDC/OAuth2 PKCE client for SPAs with silent refresh and ready-made auth UI helpers.

**Size:** 28.61 KB source / 16.04 KB minified  
**Dependencies:** None; `BareMetal.Communications` is optional for `attachToRest()`

## Quick Start

```html
<script src="BareMetal.Auth.min.js"></script>
<div id="auth"></div>
<script>
  (async () => {
    BareMetal.Auth.configure({
      authority: 'https://login.example.com',
      clientId: 'spa-client',
      redirectUri: location.origin + '/callback.html',
      silentRedirectUri: location.origin + '/silent-refresh.html',
      scopes: 'openid profile email',
      storage: 'session'
    });

    await BareMetal.Auth.initialize();

    if (location.search.includes('code=')) {
      await BareMetal.Auth.handleCallback();
      console.log(BareMetal.Auth.getUser());
    } else {
      BareMetal.Auth.renderLogin('#auth');
    }
  })();
</script>
```

## API Reference

### `configure(options)` → `void`

Sets authority, client id, redirect URIs, scopes, and storage mode. This resets cached discovery data and in-memory transaction state.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | — | Auth configuration |

### `initialize()` → `Promise<void>`

Fetches the provider discovery document from `{authority}/.well-known/openid-configuration`.

### `login(extraParams)` → `Promise<void>`

Starts an authorization code + PKCE login by redirecting to the provider authorization endpoint.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| extraParams | object | `{}` | Safe OIDC request parameters; see table below |

**Example:**
```js
await BareMetal.Auth.login({ prompt: 'login', login_hint: 'ada@example.com' });
```

### `handleCallback(url)` → `Promise<{ user: object, accessToken: string, idToken: string }>`

Exchanges the authorization code for tokens, validates the nonce, stores tokens, and removes query parameters from the current URL.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| url | string | `window.location.href` | Callback URL to process |

### `logout()` → `void`

Clears tokens and redirects to `end_session_endpoint` when the discovery document exposes one.

### `clearSession()` → `void`

Clears locally stored tokens without redirecting.

### `getToken()` → `Promise<string|null>`

Returns the access token. If the token is expired and a refresh token exists, it attempts a token refresh first.

### `getIdToken()` → `string|null`

Returns the current raw ID token.

### `silentRefresh()` → `Promise<void>`

Starts silent refresh through a hidden iframe using `prompt=none`.

### `handleSilentCallback()` → `void`

Used inside the silent refresh page to post `{ code, state, error }` back to the parent window.

### `getUser()` → `object|null`

Parses the current ID token payload and returns the claims object.

### `getUserInfo()` → `Promise<object>`

Calls the provider `userinfo_endpoint` with the current bearer token.

### `isAuthenticated()` → `boolean`

Returns `true` when an access token exists.

### `onAuthChange(callback)` → `() => void`

Subscribes to auth state changes and returns an unsubscribe function.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| callback | function | — | Called with `true`/`false` auth state |

**Example:**
```js
const unsubscribe = BareMetal.Auth.onAuthChange((authed) => {
  console.log('Authenticated?', authed);
});
```

### `attachToRest()` → `void`

Monkey-patches `BareMetal.Communications.call` to request a bearer token before each request and attempt a silent refresh on retry.

### `_setRedirect(fn)` → `void`

Internal testing hook that replaces the redirect function used by `login()` and `logout()`.

### `renderLogin(container, options)` → `HTMLElement|null`

Renders a sign-in card or compact button group.

### `renderLogout(container, options)` → `HTMLButtonElement|null`

Renders a sign-out button.

### `renderWhoami(container, options)` → `HTMLElement|null`

Renders the current user card and keeps it updated when auth state changes.

### `renderTokenInspector(container, options)` → `HTMLElement|null`

Renders expandable token details for the current session.

### `renderUserTiles(container, options)` → `HTMLElement|null`

Renders a clickable grid of profile/account tiles.

### `renderAuthGate(container, options)` → `HTMLElement|null`

Renders `renderWhoami()` when authenticated, otherwise `renderLogin()`, and auto-updates on auth changes.

## Configuration / Options

### `configure()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| authority | string | — | Provider base URL without trailing slash |
| clientId | string | — | OAuth client id |
| redirectUri | string | — | Main callback URL |
| scopes | string | `'openid profile'` | Space-separated scopes |
| silentRedirectUri | string\|null | `null` | Callback page for silent refresh |
| storage | string | `'memory'` | `'memory'` or `'session'` |
| postLogoutRedirectUri | string\|null | `null` | Logout return URL |

### `login()` safe extra params

Only these keys are forwarded from `extraParams`:

| Key |
|---|
| `prompt` |
| `login_hint` |
| `acr_values` |
| `ui_locales` |
| `display` |
| `max_age` |
| `id_token_hint` |

### `renderLogin()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| title | string | `'Sign In'` | Card title |
| subtitle | string | — | Optional supporting text |
| theme | string | `'light'` | `'light'` or `'dark'` |
| compact | boolean | `false` | Renders buttons without the card wrapper |
| className | string | `''` | Extra class names |
| logo | string | — | Image URL or inline SVG string |
| providers | object[] | `[]` | Button presets/items |
| onLogin | function | — | Called after a successful local callback parse |

Provider objects may use `id`, `name`, `color`, `bgColor`, and `icon`.

### `renderLogout()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| label | string | `'Sign Out'` | Button label |
| className | string | `'bt bt-er'` | Button classes |
| confirm | boolean | `false` | Asks for confirmation before logout |
| onLogout | function | — | Callback after logout is triggered |

### `renderWhoami()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| theme | string | `'light'` | `'light'` or `'dark'` |
| fields | string[] | `['name', 'email', 'picture']` | Claim names to show |
| showAvatar | boolean | `true` | Shows `picture` when available |
| showLogout | boolean | `true` | Shows logout action |
| compact | boolean | `false` | Inline presentation |
| className | string | `''` | Extra class names |
| onLogout | function | — | Callback after logout |

### `renderTokenInspector()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| showIdToken | boolean | `true` | Include ID token section |
| showAccessToken | boolean | `true` | Include access token section |
| showRefreshToken | boolean | `false` | Include refresh token section |
| showExpiry | boolean | `true` | Show expiration hints |
| theme | string | `'light'` | `'light'` or `'dark'` |

### `renderUserTiles()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| columns | number | `2` | CSS grid column count |
| theme | string | `'light'` | `'light'` or `'dark'` |
| tiles | object[] | built-in defaults | Tile descriptors with `id`, `title`, `icon`, `description`, `onClick` |

### `renderAuthGate()` options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| loginOpts | object | current options | Options forwarded to `renderLogin()` |
| whoamiOpts | object | current options | Options forwarded to `renderWhoami()` |

## Examples

### Example 1: Callback page
```html
<script src="BareMetal.Auth.min.js"></script>
<script>
  (async () => {
    BareMetal.Auth.configure({
      authority: 'https://login.example.com',
      clientId: 'spa-client',
      redirectUri: location.origin + '/callback.html',
      storage: 'session'
    });

    await BareMetal.Auth.initialize();
    const result = await BareMetal.Auth.handleCallback();
    console.log(result.user.email);
    location.href = '/';
  })();
</script>
```

### Example 2: Auth-aware UI and REST integration
```js
BareMetal.Auth.attachToRest();
BareMetal.Auth.renderAuthGate('#auth-slot', {
  loginOpts: {
    title: 'Sign in to Admin',
    providers: [{ id: 'github', name: 'GitHub' }]
  },
  whoamiOpts: {
    compact: true,
    showLogout: true
  }
});
```

## Notes
- JWT parsing in `getUser()` and the token inspector does not verify signatures; it only decodes token payloads.
- `storage: 'session'` persists tokens in `sessionStorage`; `'memory'` keeps them only for the current page lifetime.
- Silent refresh requires `silentRedirectUri` plus a page that calls `handleSilentCallback()`.
- Provider presets in `renderLogin()` affect button appearance; `login()` itself only forwards the safe OIDC parameters listed above.
