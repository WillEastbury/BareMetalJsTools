/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadRBAC() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.RBAC.js'), 'utf8');
  const bm = {};
  const fn = new Function('BareMetal', 'document', 'localStorage', 'sessionStorage', 'setTimeout', 'clearTimeout', code + '\nreturn BareMetal;');
  return fn(bm, global.document, global.localStorage, global.sessionStorage, setTimeout, clearTimeout).RBAC;
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
