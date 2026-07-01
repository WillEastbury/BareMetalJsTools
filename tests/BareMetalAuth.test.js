/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const { webcrypto } = require('crypto');

const SRC = path.resolve(__dirname, '../src/BareMetal.Auth.js');
const DISCOVERY = {
  authorization_endpoint: 'https://idp.example.com/authorize',
  token_endpoint: 'https://idp.example.com/token',
  userinfo_endpoint: 'https://idp.example.com/userinfo',
  end_session_endpoint: 'https://idp.example.com/logout'
};

function loadAuth() {
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

function fakeJwt(payload, header) {
  const h = Buffer.from(JSON.stringify(header || { alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return h + '.' + b + '.fakesig';
}

async function setupDiscovery(Auth, opts) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => DISCOVERY
  });
  Auth.configure(Object.assign({
    authority: 'https://idp.example.com/',
    clientId: 'client-123',
    redirectUri: 'https://app.example.com/callback',
    storage: 'session'
  }, opts || {}));
  await Auth.initialize();
}

async function loginAndCapture(Auth, extraParams) {
  const redirect = jest.fn();
  Auth._setRedirect(redirect);
  await Auth.login(extraParams);
  const url = new URL(redirect.mock.calls[0][0]);
  return { redirect, url, state: url.searchParams.get('state'), nonce: url.searchParams.get('nonce') };
}

async function completeCallback(Auth, state, nonce, overrides) {
  const data = Object.assign({
    access_token: 'access-token',
    id_token: fakeJwt({ sub: 'user-1', nonce, name: 'Alice', email: 'alice@example.com' }),
    refresh_token: 'refresh-token',
    expires_in: 3600
  }, overrides || {});
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data });
  jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  return Auth.handleCallback('https://app.example.com/callback?code=abc123&state=' + encodeURIComponent(state));
}

describe('BareMetal.Auth', () => {
  let Auth;
  let originalCrypto;
  let originalFetch;

  beforeEach(() => {
    jest.resetModules();
    originalCrypto = global.crypto;
    originalFetch = global.fetch;
    Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true, writable: true });
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
    Auth = loadAuth();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch === undefined) delete global.fetch;
    else global.fetch = originalFetch;
    Object.defineProperty(global, 'crypto', { value: originalCrypto, configurable: true, writable: true });
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  test('exports the expected public API', () => {
    [
      'configure', 'initialize', 'login', 'handleCallback', 'logout', 'clearSession', 'getToken', 'getIdToken',
      'silentRefresh', 'handleSilentCallback', 'getUser', 'getUserInfo', 'isAuthenticated', 'onAuthChange',
      'attachToRest', '_setRedirect', 'parseJwt', 'createPkce', 'decodeJwtParts', 'renderLogin', 'renderAuthGate'
    ].forEach((key) => expect(typeof Auth[key]).toBe('function'));
  });

  test('parseJwt decodes a valid token payload', () => {
    expect(Auth.parseJwt(fakeJwt({ sub: 'abc', role: 'admin' }))).toEqual({ sub: 'abc', role: 'admin' });
  });

  test('parseJwt returns null for missing or malformed tokens', () => {
    expect(Auth.parseJwt('')).toBeNull();
    expect(Auth.parseJwt('one-part')).toBeNull();
    expect(Auth.parseJwt('a.invalid-json.c')).toBeNull();
  });

  test('decodeJwtParts returns decoded header and payload', () => {
    const token = fakeJwt({ sub: 'abc' }, { alg: 'HS256', typ: 'JWT' });
    expect(Auth.decodeJwtParts(token)).toEqual({
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: 'abc' }
    });
  });

  test('decodeJwtParts returns null for invalid tokens', () => {
    expect(Auth.decodeJwtParts(null)).toBeNull();
    expect(Auth.decodeJwtParts('broken')).toBeNull();
  });

  test('createPkce returns verifier and challenge strings', async () => {
    const pkce = await Auth.createPkce();
    expect(pkce.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.verifier).not.toBe(pkce.challenge);
  });

  test('configure trims authority and resets authentication state', async () => {
    Auth.configure({ authority: 'https://idp.example.com///', clientId: 'c', redirectUri: 'https://app/cb', storage: 'session' });
    expect(Auth.isAuthenticated()).toBe(false);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => DISCOVERY });
    await Auth.initialize();
    expect(global.fetch).toHaveBeenCalledWith('https://idp.example.com/.well-known/openid-configuration');
  });

  test('initialize throws when configure was not called', async () => {
    await expect(Auth.initialize()).rejects.toThrow('Auth: call configure() first');
  });

  test('initialize throws when discovery fetch fails', async () => {
    Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(Auth.initialize()).rejects.toThrow('Auth: discovery fetch failed (503)');
  });

  test('login throws until initialize has run', async () => {
    Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
    await expect(Auth.login()).rejects.toThrow('Auth: call initialize() first');
  });

  test('login redirects with PKCE, state, nonce, and safe extra params only', async () => {
    await setupDiscovery(Auth);
    const { redirect, url } = await loginAndCapture(Auth, { prompt: 'login', login_hint: 'alice@example.com', unsafe: 'ignored' });
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(url.origin + url.pathname).toBe(DISCOVERY.authorization_endpoint);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('nonce')).toBeTruthy();
    expect(url.searchParams.get('prompt')).toBe('login');
    expect(url.searchParams.get('login_hint')).toBe('alice@example.com');
    expect(url.searchParams.get('unsafe')).toBeNull();
  });

  test('handleCallback throws when provider returned an error', async () => {
    await setupDiscovery(Auth);
    await expect(Auth.handleCallback('https://app.example.com/callback?error=access_denied')).rejects.toThrow('Auth callback error: access_denied');
  });

  test('handleCallback throws when callback is missing code or state', async () => {
    await setupDiscovery(Auth);
    await expect(Auth.handleCallback('https://app.example.com/callback?code=abc')).rejects.toThrow('Auth: missing code or state in callback');
  });

  test('handleCallback throws when state has no pending transaction', async () => {
    await setupDiscovery(Auth);
    await expect(Auth.handleCallback('https://app.example.com/callback?code=abc&state=missing')).rejects.toThrow('Auth: no pending transaction for state');
  });

  test('handleCallback stores tokens and updates getters', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    const result = await completeCallback(Auth, state, nonce);
    expect(result.user.sub).toBe('user-1');
    await expect(Auth.getToken()).resolves.toBe('access-token');
    expect(Auth.getIdToken()).toContain('.');
    expect(Auth.getUser().email).toBe('alice@example.com');
    expect(Auth.isAuthenticated()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem('bm_auth_tokens')).access_token).toBe('access-token');
  });

  test('handleCallback rejects nonce mismatches', async () => {
    await setupDiscovery(Auth);
    const { state } = await loginAndCapture(Auth);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'x', id_token: fakeJwt({ sub: 'user-1', nonce: 'wrong' }), expires_in: 3600 })
    });
    await expect(Auth.handleCallback('https://app.example.com/callback?code=abc&state=' + state)).rejects.toThrow('Auth: nonce mismatch');
  });

  test('clearSession clears stored tokens and sessionStorage', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce);
    Auth.clearSession();
    expect(Auth.isAuthenticated()).toBe(false);
    expect(Auth.getUser()).toBeNull();
    expect(sessionStorage.getItem('bm_auth_tokens')).toBeNull();
  });

  test('getToken returns null when unauthenticated', async () => {
    expect(await Auth.getToken()).toBeNull();
  });

  test('getToken returns null when token is expired without a refresh token', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, { refresh_token: null, expires_in: -1 });
    expect(await Auth.getToken()).toBeNull();
  });

  test('getToken refreshes expired tokens when a refresh token exists', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, { access_token: 'old-token', refresh_token: 'refresh-me', expires_in: -1 });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-token', id_token: fakeJwt({ sub: 'user-1', nonce }), refresh_token: 'refresh-me', expires_in: 1200 })
    });
    await expect(Auth.getToken()).resolves.toBe('new-token');
    expect(Auth.isAuthenticated()).toBe(true);
  });

  test('getToken clears tokens when refresh fails', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, { access_token: 'old-token', refresh_token: 'refresh-me', expires_in: -1 });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(Auth.getToken()).resolves.toBeNull();
    expect(Auth.isAuthenticated()).toBe(false);
  });

  test('getUserInfo fetches user info with bearer token', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ department: 'Engineering' }) });
    await expect(Auth.getUserInfo()).resolves.toEqual({ department: 'Engineering' });
    expect(global.fetch).toHaveBeenCalledWith(DISCOVERY.userinfo_endpoint, {
      headers: { Authorization: 'Bearer access-token' }
    });
  });

  test('getUserInfo throws when discovery has no userinfo endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authorization_endpoint: DISCOVERY.authorization_endpoint, token_endpoint: DISCOVERY.token_endpoint })
    });
    Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
    await Auth.initialize();
    await expect(Auth.getUserInfo()).rejects.toThrow('Auth: no userinfo_endpoint');
  });

  test('onAuthChange notifies listeners and unsubscribe stops future notifications', async () => {
    await setupDiscovery(Auth);
    const listener = jest.fn();
    const unsub = Auth.onAuthChange(listener);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce);
    expect(listener).toHaveBeenLastCalledWith(true);
    unsub();
    Auth.clearSession();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('attachToRest is a no-op when Communications is absent', () => {
    expect(() => Auth.attachToRest()).not.toThrow();
  });

  test('logout clears tokens and redirects to end session endpoint', async () => {
    await setupDiscovery(Auth, { postLogoutRedirectUri: 'https://app.example.com/post-logout' });
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce);
    const redirect = jest.fn();
    Auth._setRedirect(redirect);
    Auth.logout();
    const url = new URL(redirect.mock.calls[0][0]);
    expect(Auth.isAuthenticated()).toBe(false);
    expect(url.origin + url.pathname).toBe(DISCOVERY.end_session_endpoint);
    expect(url.searchParams.get('id_token_hint')).toContain('.');
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe('https://app.example.com/post-logout');
  });

  test('silentRefresh clears tokens when silent refresh is not configured', async () => {
    await setupDiscovery(Auth, { silentRedirectUri: null });
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce);
    await Auth.silentRefresh();
    expect(Auth.isAuthenticated()).toBe(false);
  });

  test('renderLogin returns null for missing containers', () => {
    expect(Auth.renderLogin('#does-not-exist')).toBeNull();
  });

  test('renderLogin renders a default sign-in button', () => {
    const container = document.createElement('div');
    const root = Auth.renderLogin(container);
    expect(root.querySelector('button').textContent).toBe('Sign In');
  });

  test('renderLogin renders provider buttons, title, subtitle, and dark theme', () => {
    const container = document.createElement('div');
    const root = Auth.renderLogin(container, {
      title: 'Welcome',
      subtitle: 'Use a provider',
      theme: 'dark',
      logo: '<svg viewBox="0 0 1 1"><path d="M0 0h1v1H0z" onclick="bad()"/></svg>',
      providers: [{ id: 'google' }, { id: 'github', name: 'GitHub Enterprise' }]
    });
    expect(root.style.background).toBe('rgb(30, 30, 30)');
    expect(container.querySelector('h3').textContent).toBe('Welcome');
    expect(container.querySelector('p').textContent).toBe('Use a provider');
    expect(container.querySelectorAll('button')).toHaveLength(2);
    expect(container.querySelector('svg').querySelector('[onclick]')).toBeNull();
  });

  test('renderWhoami renders compact user info and logout callback', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, { id_token: fakeJwt({ sub: 'user-1', nonce, name: 'Bob', picture: 'https://img', team: 'Core' }) });
    const onLogout = jest.fn();
    const container = document.createElement('div');
    Auth.renderWhoami(container, { compact: true, onLogout });
    expect(container.textContent).toContain('Bob');
    container.querySelector('a').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(Auth.isAuthenticated()).toBe(false);
  });

  test('renderTokenInspector shows decoded token content', async () => {
    await setupDiscovery(Auth);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, {
      id_token: fakeJwt({ sub: 'user-1', nonce, exp: Math.floor(Date.now() / 1000) + 600 }),
      access_token: fakeJwt({ scope: 'openid' })
    });
    const container = document.createElement('div');
    Auth.renderTokenInspector(container, { showRefreshToken: true });
    const summaries = Array.from(container.querySelectorAll('summary')).map((el) => el.textContent);
    expect(summaries[0]).toContain('ID Token');
    expect(container.querySelector('pre').textContent).toContain('"sub": "user-1"');
  });

  test('renderUserTiles renders custom tiles and click handlers', () => {
    const click = jest.fn();
    const container = document.createElement('div');
    const grid = Auth.renderUserTiles(container, {
      columns: 3,
      tiles: [{ id: 'profile', title: 'Profile', icon: 'P', description: 'Desc', onClick: click }]
    });
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
    grid.firstChild.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  test('renderAuthGate auto-updates from login view to whoami view on auth change', async () => {
    await setupDiscovery(Auth);
    const container = document.createElement('div');
    Auth.renderAuthGate(container, { title: 'Please sign in' });
    expect(container.textContent).toContain('Please sign in');
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, { id_token: fakeJwt({ sub: 'user-1', nonce, name: 'Charlie' }) });
    expect(container.textContent).toContain('Charlie');
  });
});
