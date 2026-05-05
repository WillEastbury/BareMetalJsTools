/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

// Helper: create a minimal JWT with given payload
function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return header + '.' + body + '.fakesig';
}

const DISCOVERY = {
  authorization_endpoint: 'https://idp.example.com/authorize',
  token_endpoint: 'https://idp.example.com/token',
  userinfo_endpoint: 'https://idp.example.com/userinfo',
  end_session_endpoint: 'https://idp.example.com/logout',
  jwks_uri: 'https://idp.example.com/.well-known/jwks'
};

function loadAuth(mockRest) {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Auth.js'), 'utf8');
  const bm = {};
  if (mockRest) bm.Communications = mockRest;
  const fn = new Function('BareMetal', code + '\nreturn BareMetal;');
  return fn(bm).Auth;
}

function mockDiscoveryFetch() {
  return jest.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(DISCOVERY)
  });
}

// Polyfill crypto.subtle for jsdom (Node's webcrypto)
const { webcrypto } = require('crypto');
if (!global.crypto || !global.crypto.subtle) {
  Object.defineProperty(global, 'crypto', { value: webcrypto, writable: true });
}

// Helper to mock redirect
function mockLocationAssign() {
  const assignMock = jest.fn();
  return { assignMock };
}

// Helper: run login flow and return state/nonce from redirect URL
async function loginAndCapture(Auth) {
  const assignMock = jest.fn();
  Auth._setRedirect(assignMock);
  const discoveryFetch = mockDiscoveryFetch();
  global.fetch = discoveryFetch;
  Auth.configure({ authority: 'https://idp.example.com', clientId: 'myapp', redirectUri: 'https://app/cb' });
  await Auth.initialize();
  await Auth.login();
  const redirectUrl = new URL(assignMock.mock.calls[0][0]);
  const state = redirectUrl.searchParams.get('state');
  const nonce = redirectUrl.searchParams.get('nonce');
  return { state, nonce, assignMock };
}

// Helper: complete callback with token exchange
async function completeCallback(Auth, state, nonce, accessToken) {
  accessToken = accessToken || 'at_123';
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      access_token: accessToken,
      id_token: makeJwt({ sub: 'user1', nonce: nonce, name: 'Test User' }),
      expires_in: 3600
    })
  });
  const origReplace = (global.history || {}).replaceState;
  global.history = { replaceState: jest.fn() };
  const result = await Auth.handleCallback('https://app/cb?code=authcode&state=' + state);
  return result;
}

describe('BareMetal.Auth', () => {
  let Auth;
  let origFetch;

  beforeEach(() => {
    jest.restoreAllMocks();
    origFetch = global.fetch;
    Auth = loadAuth();
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  test('configure() stores options', () => {
    Auth.configure({
      authority: 'https://idp.example.com',
      clientId: 'myapp',
      redirectUri: 'https://app.example.com/callback'
    });
    // After configure, not authenticated
    expect(Auth.isAuthenticated()).toBe(false);
  });

  test('initialize() fetches discovery document', async () => {
    const mockFetch = mockDiscoveryFetch();
    global.fetch = mockFetch;

    Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
    await Auth.initialize();

    expect(mockFetch).toHaveBeenCalledWith('https://idp.example.com/.well-known/openid-configuration');
  });

  test('login() generates PKCE and redirects', async () => {
    const { assignMock } = await loginAndCapture(Auth);
    const url = assignMock.mock.calls[0][0];
    expect(url).toContain('https://idp.example.com/authorize?');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=myapp');
  });

  test('handleCallback() exchanges code for tokens', async () => {
    const { state, nonce } = await loginAndCapture(Auth);
    const result = await completeCallback(Auth, state, nonce, 'at_123');

    expect(result.accessToken).toBe('at_123');
    expect(result.user.sub).toBe('user1');
    expect(Auth.isAuthenticated()).toBe(true);
  });

  test('handleCallback() validates state matches pending transaction', async () => {
    global.fetch = mockDiscoveryFetch();
    Auth.configure({ authority: 'https://idp.example.com', clientId: 'myapp', redirectUri: 'https://app/cb' });
    await Auth.initialize();

    await expect(Auth.handleCallback('https://app/cb?code=abc&state=badstate'))
      .rejects.toThrow('no pending transaction');
  });

  test('getToken() returns stored token', async () => {
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, 'my_access_token');

    const token = await Auth.getToken();
    expect(token).toBe('my_access_token');
  });

  test('getToken() returns null when not authenticated', async () => {
    Auth.configure({ authority: 'https://idp.example.com', clientId: 'myapp', redirectUri: 'https://app/cb' });
    const token = await Auth.getToken();
    expect(token).toBeNull();
  });

  test('isAuthenticated() reflects auth state', () => {
    Auth.configure({ authority: 'https://idp.example.com', clientId: 'myapp', redirectUri: 'https://app/cb' });
    expect(Auth.isAuthenticated()).toBe(false);
  });

  test('getUser() parses id_token claims', async () => {
    const { state, nonce } = await loginAndCapture(Auth);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        access_token: 'at',
        id_token: makeJwt({ sub: 'user42', nonce: nonce, name: 'Alice' }),
        expires_in: 3600
      })
    });
    global.history = { replaceState: jest.fn() };
    await Auth.handleCallback('https://app/cb?code=c&state=' + state);

    const user = Auth.getUser();
    expect(user.sub).toBe('user42');
    expect(user.name).toBe('Alice');
  });

  test('clearSession() removes tokens', async () => {
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce);
    expect(Auth.isAuthenticated()).toBe(true);

    Auth.clearSession();
    expect(Auth.isAuthenticated()).toBe(false);
    expect(Auth.getUser()).toBeNull();
  });

  test('onAuthChange() fires on login/logout', async () => {
    const events = [];
    const assignMock = jest.fn();
    Auth._setRedirect(assignMock);
    global.fetch = mockDiscoveryFetch();
    Auth.configure({ authority: 'https://idp.example.com', clientId: 'myapp', redirectUri: 'https://app/cb' });
    const unsub = Auth.onAuthChange(v => events.push(v));
    await Auth.initialize();
    await Auth.login();

    const redirectUrl = new URL(assignMock.mock.calls[0][0]);
    const state = redirectUrl.searchParams.get('state');
    const nonce = redirectUrl.searchParams.get('nonce');

    await completeCallback(Auth, state, nonce);
    expect(events).toContain(true);

    Auth.clearSession();
    expect(events).toContain(false);

    unsub();
  });

  test('attachToRest() adds auth header via Communications', async () => {
    const callLog = [];
    const mockRest = {
      call: jest.fn(async (method, url, body, headers) => {
        callLog.push({ method, url, headers });
        return { status: 200 };
      })
    };

    Auth = loadAuth(mockRest);
    const { state, nonce } = await loginAndCapture(Auth);
    await completeCallback(Auth, state, nonce, 'bearer_tok');

    Auth.attachToRest();
    await mockRest.call('GET', '/api/data');

    expect(callLog[0].headers).toBeDefined();
    expect(callLog[0].headers['Authorization']).toBe('Bearer bearer_tok');
  });

  // ── UI Rendering Tests ──

  describe('renderLogin', () => {
    test('creates card with provider buttons', () => {
      Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
      const container = document.createElement('div');
      const root = Auth.renderLogin(container, {
        providers: [{ id: 'google' }, { id: 'github' }]
      });
      expect(root).toBeTruthy();
      expect(root.classList.contains('cd')).toBe(true);
      const buttons = root.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Sign in with Google');
      expect(buttons[1].textContent).toContain('Sign in with GitHub');
    });

    test('applies built-in provider presets (google, microsoft, github)', () => {
      Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
      const container = document.createElement('div');
      Auth.renderLogin(container, {
        providers: [{ id: 'google' }, { id: 'microsoft' }, { id: 'github' }]
      });
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(3);
      // Google button has white bg
      expect(buttons[0].style.background).toBe('rgb(255, 255, 255)');
      // Microsoft has dark bg
      expect(buttons[1].style.background).toBe('rgb(47, 47, 47)');
      // Each button has an SVG icon
      buttons.forEach(b => expect(b.querySelector('svg')).toBeTruthy());
    });

    test('compact mode renders without card wrapper', () => {
      Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
      const container = document.createElement('div');
      const root = Auth.renderLogin(container, { compact: true, providers: [{ id: 'google' }] });
      expect(root.classList.contains('cd')).toBe(false);
      expect(container.querySelectorAll('button').length).toBe(1);
    });

    test('renders single Sign In button when no providers', () => {
      Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
      const container = document.createElement('div');
      Auth.renderLogin(container);
      const btn = container.querySelector('button');
      expect(btn.textContent).toBe('Sign In');
    });
  });

  describe('renderLogout', () => {
    test('creates a logout button', () => {
      Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
      const container = document.createElement('div');
      const btn = Auth.renderLogout(container);
      expect(btn.tagName).toBe('BUTTON');
      expect(btn.textContent).toBe('Sign Out');
      expect(btn.classList.contains('bt-er')).toBe(true);
    });

    test('uses custom label', () => {
      Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
      const container = document.createElement('div');
      const btn = Auth.renderLogout(container, { label: 'Log Out' });
      expect(btn.textContent).toBe('Log Out');
    });
  });

  describe('renderWhoami', () => {
    test('shows user info when authenticated', async () => {
      const { state, nonce } = await loginAndCapture(Auth);
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'at', expires_in: 3600,
          id_token: makeJwt({ sub: 'u1', nonce, name: 'Alice', email: 'alice@test.com' })
        })
      });
      global.history = { replaceState: jest.fn() };
      await Auth.handleCallback('https://app/cb?code=c&state=' + state);

      const container = document.createElement('div');
      Auth.renderWhoami(container);
      expect(container.querySelector('h5').textContent).toBe('Alice');
      expect(container.querySelector('.tx-mu').textContent).toBe('alice@test.com');
    });

    test('compact mode renders inline span', async () => {
      const { state, nonce } = await loginAndCapture(Auth);
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'at', expires_in: 3600,
          id_token: makeJwt({ sub: 'u1', nonce, name: 'Bob' })
        })
      });
      global.history = { replaceState: jest.fn() };
      await Auth.handleCallback('https://app/cb?code=c&state=' + state);

      const container = document.createElement('div');
      Auth.renderWhoami(container, { compact: true });
      expect(container.querySelector('span')).toBeTruthy();
      expect(container.textContent).toContain('Bob');
    });
  });

  describe('renderTokenInspector', () => {
    test('decodes JWT and shows token details', async () => {
      const { state, nonce } = await loginAndCapture(Auth);
      const idToken = makeJwt({ sub: 'u1', nonce, name: 'Test', exp: Math.floor(Date.now() / 1000) + 3600 });
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'at_opaque', id_token: idToken, expires_in: 3600 })
      });
      global.history = { replaceState: jest.fn() };
      await Auth.handleCallback('https://app/cb?code=c&state=' + state);

      const container = document.createElement('div');
      Auth.renderTokenInspector(container);
      expect(container.querySelector('strong').textContent).toBe('Token Inspector');
      const details = container.querySelectorAll('details');
      expect(details.length).toBeGreaterThanOrEqual(2);
      const pre = details[0].querySelector('pre');
      expect(pre.textContent).toContain('"sub"');
    });
  });

  describe('renderAuthGate', () => {
    test('shows login when not authenticated', () => {
      Auth.configure({ authority: 'https://idp.example.com', clientId: 'c', redirectUri: 'https://app/cb' });
      const container = document.createElement('div');
      Auth.renderAuthGate(container, { loginOpts: { title: 'Welcome' } });
      expect(container.querySelector('h3').textContent).toBe('Welcome');
      expect(container.querySelector('button')).toBeTruthy();
    });

    test('shows whoami when authenticated', async () => {
      const { state, nonce } = await loginAndCapture(Auth);
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'at', expires_in: 3600,
          id_token: makeJwt({ sub: 'u1', nonce, name: 'Charlie' })
        })
      });
      global.history = { replaceState: jest.fn() };
      await Auth.handleCallback('https://app/cb?code=c&state=' + state);

      const container = document.createElement('div');
      Auth.renderAuthGate(container);
      expect(container.querySelector('h5').textContent).toBe('Charlie');
    });
  });

  describe('renderUserTiles', () => {
    test('creates grid of default tiles', () => {
      const container = document.createElement('div');
      Auth.renderUserTiles(container);
      const grid = container.firstChild;
      expect(grid.style.display).toBe('grid');
      expect(grid.children.length).toBe(4);
      expect(grid.children[0].textContent).toContain('Profile');
      expect(grid.children[1].textContent).toContain('Security');
    });

    test('respects custom tiles and columns', () => {
      const container = document.createElement('div');
      Auth.renderUserTiles(container, {
        columns: 3,
        tiles: [{ id: 'a', title: 'Alpha', icon: '🅰️' }, { id: 'b', title: 'Beta', icon: '🅱️' }]
      });
      const grid = container.firstChild;
      expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
      expect(grid.children.length).toBe(2);
    });
  });
});
