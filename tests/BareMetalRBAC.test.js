/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.RBAC.js');

function loadRBAC() {
  delete require.cache[SRC];
  return require(SRC);
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fakeJwt(payload) {
  return base64url({ alg: 'none', typ: 'JWT' }) + '.' + base64url(payload) + '.';
}

describe('BareMetal.RBAC', () => {
  let RBAC;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.body.innerHTML = '';
    RBAC = loadRBAC();
    RBAC.clearToken();
    RBAC.configure({
      tokenSource: 'localStorage',
      tokenKey: 'auth_token',
      claimMapping: {},
      rolePermissions: {},
      groupRoles: {},
      superRoles: [],
      onChange: null
    });
  });

  test('builds identity from mapped claims and inherited permissions', () => {
    const token = fakeJwt({
      sub: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      tid: 'org-1',
      realm_access: { roles: ['editor'] },
      groups: ['Engineering'],
      scope: 'openid profile api',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    localStorage.setItem('auth_token', token);
    RBAC.configure({
      tokenSource: 'localStorage',
      tokenKey: 'auth_token',
      claimMapping: { roles: 'realm_access.roles' },
      rolePermissions: { editor: ['write'] },
      groupRoles: { Engineering: ['editor'] }
    });

    expect(RBAC.WARNING).toBe('Client-side RBAC is for UI hints only. Always enforce permissions server-side.');
    expect(RBAC.isAuthenticated()).toBe(true);
    expect(RBAC.identity()).toEqual(expect.objectContaining({
      userId: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      tenant: 'org-1',
      roles: ['editor'],
      groups: ['Engineering'],
      permissions: expect.arrayContaining(['openid', 'profile', 'api', 'write']),
      scopes: ['openid', 'profile', 'api']
    }));
    expect(RBAC.hasRole('editor')).toBe(true);
    expect(RBAC.can('write')).toBe(true);
    expect(RBAC.hasScope('api')).toBe(true);
    expect(RBAC.check({ roles: ['editor'], permissions: ['write'], groups: ['Engineering'], scopes: ['api'] })).toBe(true);
    expect(RBAC.checkAny({ roles: ['admin'], permissions: ['write'] })).toBe(true);
    expect(RBAC.isTenant('org-1')).toBe(true);
  });

  test('applyDOM toggles visibility, disabled state, and classes', () => {
    const token = fakeJwt({
      sub: 'admin-1',
      roles: ['admin'],
      permissions: ['delete'],
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    localStorage.setItem('auth_token', token);
    RBAC.refresh();
    document.body.innerHTML = [
      '<button id="show" data-rbac-show="role:admin"></button>',
      '<button id="hide" data-rbac-hide="role:admin"></button>',
      '<button id="disable" data-rbac-disable="perm:manage-users"></button>',
      '<div id="classy" data-rbac-class="role:admin=admin-view"></div>'
    ].join('');

    RBAC.applyDOM(document.body);

    expect(document.getElementById('show').style.display).toBe('');
    expect(document.getElementById('hide').style.display).toBe('none');
    expect(document.getElementById('disable').getAttribute('disabled')).toBe('disabled');
    expect(document.getElementById('disable').getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById('classy').classList.contains('admin-view')).toBe(true);
  });
});

describe('branch coverage - RBAC', () => {
  let RBAC;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.body.innerHTML = '';
    RBAC = loadRBAC();
    RBAC.clearToken();
    RBAC.configure({
      tokenSource: 'localStorage',
      tokenKey: 'auth_token',
      claimMapping: {},
      rolePermissions: {},
      groupRoles: {},
      superRoles: [],
      onChange: null
    });
  });

  test('manual tokens, empty role checks, and super roles cover permission branches', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;

    RBAC.configure({ tokenSource: 'manual', superRoles: [] });
    RBAC.setToken(fakeJwt({ sub: 'plain-user', exp: future }));
    expect(RBAC.identity()).toEqual(expect.objectContaining({
      userId: 'plain-user',
      roles: [],
      groups: [],
      permissions: [],
      scopes: []
    }));
    expect(RBAC.hasRole('admin')).toBe(false);
    expect(RBAC.hasAnyRole([])).toBe(false);
    expect(RBAC.hasAllRoles([])).toBe(true);
    expect(RBAC.check({ roles: ['admin'] })).toBe(false);
    expect(RBAC.checkAny({})).toBe(false);

    RBAC.configure({ tokenSource: 'manual', superRoles: ['admin'] });
    RBAC.setToken(fakeJwt({
      role: 'admin',
      permissions: 'read write',
      group: 'ops',
      given_name: 'Ada',
      family_name: 'Lovelace',
      tid: 'tenant-1',
      exp: future
    }));

    expect(RBAC.identity()).toEqual(expect.objectContaining({
      name: 'Ada Lovelace',
      roles: ['admin'],
      groups: ['ops'],
      tenant: 'tenant-1',
      permissions: expect.arrayContaining(['read', 'write'])
    }));
    expect(RBAC.can('delete-anything')).toBe(true);
    expect(RBAC.inAnyGroup(['sales', 'ops'])).toBe(true);
    expect(RBAC.canAny(['missing'])).toBe(true);
    expect(RBAC.canAll(['missing'])).toBe(true);
    expect(RBAC.guard({ tenant: ['tenant-1'] })()).toBe(true);
    expect(RBAC.check({ tenant: ['tenant-1', 'tenant-2'] })).toBe(true);
    expect(RBAC.checkAny({ tenant: ['tenant-2', 'tenant-1'] })).toBe(true);
  });

  test('token sources, expiry handling, and DOM edge cases cover fallback paths', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const cookieToken = fakeJwt({ sub: 'cookie-user', permissions: ['view'], exp: future });
    const sessionToken = fakeJwt({ sub: 'session-user', roles: ['reviewer'], exp: future });

    document.cookie = 'auth_token=' + encodeURIComponent(cookieToken) + '; path=/';
    sessionStorage.setItem('auth_token', sessionToken);

    RBAC.configure({ tokenSource: 'cookie' });
    expect(RBAC.identity().userId).toBe('cookie-user');

    RBAC.configure({ tokenSource: 'sessionStorage' });
    expect(RBAC.identity().userId).toBe('session-user');
    expect(RBAC.hasRole('reviewer')).toBe(true);

    RBAC.configure({ tokenSource: 'manual' });
    RBAC.setToken(fakeJwt({ roles: ['viewer'], permissions: ['read'], exp: future }));
    expect(RBAC.applyDOM({})).toBe(0);

    const root = document.createElement('section');
    root.setAttribute('data-rbac-show', 'role:viewer');
    root.setAttribute('data-rbac-class', 'role:admin=admin-only,perm:read=reader');
    document.body.appendChild(root);
    expect(RBAC.applyDOM(root)).toBe(1);
    expect(root.style.display).toBe('');
    expect(root.classList.contains('reader')).toBe(true);
    expect(root.classList.contains('admin-only')).toBe(false);

    RBAC.setToken('not-a-jwt');
    expect(RBAC.identity()).toBeNull();

    RBAC.setToken(fakeJwt({ sub: 'expired', exp: Math.floor(Date.now() / 1000) - 1 }));
    expect(RBAC.isAuthenticated()).toBe(false);
  });

  test('expiry listeners fire when a token times out', () => {
    const changeSpy = jest.fn();
    const expirySpy = jest.fn();

    jest.useFakeTimers();
    try {
      RBAC = loadRBAC();
      RBAC.clearToken();
      RBAC.configure({ tokenSource: 'manual', onChange: changeSpy });
      const offExpiry = RBAC.onExpiry(expirySpy);

      RBAC.setToken(fakeJwt({
        sub: 'soon-expired',
        exp: Math.floor(Date.now() / 1000) + 1
      }));

      jest.advanceTimersByTime(1100);

      expect(expirySpy).toHaveBeenCalledWith(expect.objectContaining({ userId: 'soon-expired' }));
      expect(changeSpy).toHaveBeenLastCalledWith(null);
      expect(RBAC.identity()).toBeNull();

      offExpiry();
    } finally {
      jest.useRealTimers();
    }
  });
});
