var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.RBAC = (function() {
  'use strict';

  var WARNING = 'Client-side RBAC is for UI hints only. Always enforce permissions server-side.';
  var DEFAULTS = {
    tokenSource: 'localStorage',
    tokenKey: 'auth_token',
    claimMapping: {},
    rolePermissions: {},
    groupRoles: {},
    superRoles: [],
    onChange: null
  };
  var CLAIMS = {
    roles: ['roles', 'role', 'realm_access.roles', 'cognito:groups', 'https://namespace/roles'],
    groups: ['groups', 'group', 'memberOf', 'cognito:groups'],
    permissions: ['permissions', 'scope', 'scp', 'authorities'],
    scopes: ['scope', 'scp'],
    userId: ['sub', 'oid', 'user_id', 'uid'],
    email: ['email', 'preferred_username', 'upn'],
    tenant: ['tid', 'tenant_id', 'org_id']
  };

  var config = copy(DEFAULTS);
  config.claimMapping = {};
  config.rolePermissions = {};
  config.groupRoles = {};
  config.superRoles = [];

  var manualToken = null;
  var cachedToken = null;
  var cachedIdentity = null;
  var cacheVersion = -1;
  var configVersion = 0;
  var expiryTimer = null;
  var expiryListeners = [];

  function copy(obj) {
    var out = {};
    var key;
    for (key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
    return out;
  }

  function arrayify(value, split) {
    var out = [];
    var i;
    if (value == null) return out;
    if (Array.isArray(value)) {
      for (i = 0; i < value.length; i++) out = out.concat(arrayify(value[i], split));
      return uniq(out);
    }
    if (typeof value === 'string') {
      value = value.trim();
      if (!value) return out;
      if (split) return uniq(value.split(/\s+/).filter(Boolean));
      return [value];
    }
    return [String(value)];
  }

  function uniq(values) {
    var seen = {};
    var out = [];
    var i;
    var key;
    for (i = 0; i < (values || []).length; i++) {
      key = String(values[i]);
      if (!key || seen[key]) continue;
      seen[key] = true;
      out.push(key);
    }
    return out;
  }

  function getStorage(name) {
    try {
      if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name];
      if (typeof window !== 'undefined' && window[name]) return window[name];
    } catch (e) { }
    return null;
  }

  function readStorage(name, key) {
    var storage = getStorage(name);
    if (!storage || !storage.getItem) return null;
    try { return storage.getItem(key); } catch (e) { return null; }
  }

  function readCookie(name) {
    var cookie, parts, i, item, eq, key, value;
    if (typeof document === 'undefined' || typeof document.cookie !== 'string') return null;
    cookie = document.cookie || '';
    parts = cookie ? cookie.split(';') : [];
    for (i = 0; i < parts.length; i++) {
      item = parts[i].replace(/^\s+|\s+$/g, '');
      if (!item) continue;
      eq = item.indexOf('=');
      key = eq < 0 ? item : item.slice(0, eq);
      value = eq < 0 ? '' : item.slice(eq + 1);
      if (key === name) {
        try { return decodeURIComponent(value); } catch (e) { return value; }
      }
    }
    return null;
  }

  function sourceOrder() {
    var order = ['localStorage', 'sessionStorage', 'cookie', 'manual'];
    var first = config.tokenSource;
    var out = [];
    var i;
    if (order.indexOf(first) >= 0) out.push(first);
    for (i = 0; i < order.length; i++) if (order[i] !== first) out.push(order[i]);
    return out;
  }

  function getToken() {
    var order = sourceOrder();
    var i;
    var source;
    var token;
    for (i = 0; i < order.length; i++) {
      source = order[i];
      token = null;
      if (source === 'localStorage') token = readStorage('localStorage', config.tokenKey);
      else if (source === 'sessionStorage') token = readStorage('sessionStorage', config.tokenKey);
      else if (source === 'cookie') token = readCookie(config.tokenKey);
      else if (source === 'manual') token = manualToken;
      if (typeof token === 'string' && token) return token;
    }
    return null;
  }

  function decodeText(base64) {
    var bytes;
    var i;
    if (typeof Buffer !== 'undefined') return Buffer.from(base64, 'base64').toString('utf8');
    if (typeof atob === 'undefined') return '';
    bytes = atob(base64);
    if (typeof TextDecoder !== 'undefined') {
      var arr = new Uint8Array(bytes.length);
      for (i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      return new TextDecoder().decode(arr);
    }
    return bytes;
  }

  function decodePayload(token) {
    var parts, body;
    if (typeof token !== 'string') return null;
    parts = token.split('.');
    if (parts.length < 2) return null;
    body = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (body.length % 4) body += '=';
    try { return JSON.parse(decodeText(body)); } catch (e) { return null; }
  }

  function getPath(obj, path) {
    var parts;
    var i;
    var cur = obj;
    if (!obj || !path) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
    parts = String(path).split('.');
    for (i = 0; i < parts.length; i++) {
      if (!cur || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, parts[i])) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function mappingPaths(key) {
    var custom = config.claimMapping && config.claimMapping[key];
    var defaults = CLAIMS[key] || [];
    var out = [];
    if (custom != null) out = out.concat(Array.isArray(custom) ? custom : [custom]);
    return uniq(out.concat(defaults));
  }

  function resolveValue(payload, key) {
    var paths = mappingPaths(key);
    var i;
    var value;
    for (i = 0; i < paths.length; i++) {
      value = getPath(payload, paths[i]);
      if (value != null && value !== '') return value;
    }
    return null;
  }

  function resolveList(payload, key) {
    return arrayify(resolveValue(payload, key), key === 'permissions' || key === 'scopes');
  }

  function resolveName(payload) {
    var configured = config.claimMapping && config.claimMapping.name;
    var name = configured ? resolveValue(payload, 'name') : null;
    if (!name) name = getPath(payload, 'name');
    if (!name) {
      var given = getPath(payload, 'given_name');
      var family = getPath(payload, 'family_name');
      name = [given, family].filter(Boolean).join(' ').replace(/^\s+|\s+$/g, '');
    }
    if (!name) name = getPath(payload, 'nickname');
    return name || null;
  }

  function rolePermissions(roles) {
    var out = [];
    var map = config.rolePermissions || {};
    var i;
    for (i = 0; i < roles.length; i++) out = out.concat(arrayify(map[roles[i]], true));
    return uniq(out);
  }

  function groupRoles(groups) {
    var out = [];
    var map = config.groupRoles || {};
    var i;
    for (i = 0; i < groups.length; i++) out = out.concat(arrayify(map[groups[i]], false));
    return uniq(out);
  }

  function expired(payload) {
    var exp = payload && payload.exp != null ? Number(payload.exp) : 0;
    return !!(exp && isFinite(exp) && exp <= Math.floor(Date.now() / 1000));
  }

  function emitChange(identity) {
    if (typeof config.onChange === 'function') {
      try { config.onChange(identity); } catch (e) { }
    }
  }

  function emitExpiry(identity) {
    var i;
    for (i = 0; i < expiryListeners.length; i++) {
      try { expiryListeners[i](identity); } catch (e) { }
    }
  }

  function clearExpiryTimer() {
    if (expiryTimer && typeof clearTimeout === 'function') clearTimeout(expiryTimer);
    expiryTimer = null;
  }

  function handleExpiry(identity) {
    clearExpiryTimer();
    cachedIdentity = null;
    emitChange(null);
    emitExpiry(identity || null);
  }

  function scheduleExpiry(identity) {
    var ms;
    clearExpiryTimer();
    if (!identity || !identity.raw || !identity.raw.exp || typeof setTimeout !== 'function') return;
    ms = (Number(identity.raw.exp) * 1000) - Date.now();
    if (!isFinite(ms)) return;
    if (ms <= 0) {
      handleExpiry(identity);
      return;
    }
    expiryTimer = setTimeout(function() { handleExpiry(identity); }, ms);
    if (expiryTimer && typeof expiryTimer.unref === 'function') expiryTimer.unref();
  }

  function buildIdentity(payload) {
    var groups = resolveList(payload, 'groups');
    var roles = uniq(resolveList(payload, 'roles').concat(groupRoles(groups)));
    return {
      userId: resolveValue(payload, 'userId'),
      email: resolveValue(payload, 'email'),
      name: resolveName(payload),
      tenant: resolveValue(payload, 'tenant'),
      roles: roles,
      groups: groups,
      permissions: uniq(resolveList(payload, 'permissions').concat(rolePermissions(roles))),
      scopes: resolveList(payload, 'scopes'),
      raw: payload
    };
  }

  function refresh(force) {
    var token = getToken();
    var prevToken = cachedToken;
    var prevIdentity = cachedIdentity;
    var payload;
    if (!force && token === cachedToken && cacheVersion === configVersion) {
      if (cachedIdentity && expired(cachedIdentity.raw)) handleExpiry(cachedIdentity);
      return cachedIdentity;
    }
    cachedToken = token || null;
    cacheVersion = configVersion;
    cachedIdentity = null;
    clearExpiryTimer();
    if (!token) {
      if (force || prevToken || prevIdentity) emitChange(null);
      return null;
    }
    payload = decodePayload(token);
    if (!payload || expired(payload)) {
      if (force || prevToken !== token || prevIdentity) emitChange(null);
      return null;
    }
    cachedIdentity = buildIdentity(payload);
    scheduleExpiry(cachedIdentity);
    if (force || prevToken !== token || prevIdentity !== cachedIdentity) emitChange(cachedIdentity);
    return cachedIdentity;
  }

  function currentIdentity() {
    return refresh(false);
  }

  function hasItems(actual, wanted, mode) {
    var need = arrayify(wanted, false);
    var set = {};
    var i;
    if (!need.length) return mode !== 'any';
    for (i = 0; i < actual.length; i++) set[actual[i]] = true;
    if (mode === 'all') {
      for (i = 0; i < need.length; i++) if (!set[need[i]]) return false;
      return true;
    }
    for (i = 0; i < need.length; i++) if (set[need[i]]) return true;
    return false;
  }

  function hasSuperRole(identity) {
    return !!identity && hasItems(identity.roles || [], config.superRoles || [], 'any');
  }

  function isAuthenticated() {
    return !!currentIdentity();
  }

  function identity() {
    return currentIdentity();
  }

  function hasRole(role) {
    var me = currentIdentity();
    return !!me && hasItems(me.roles || [], [role], 'all');
  }

  function hasAnyRole(roles) {
    var me = currentIdentity();
    return !!me && hasItems(me.roles || [], roles, 'any');
  }

  function hasAllRoles(roles) {
    var me = currentIdentity();
    return !!me && hasItems(me.roles || [], roles, 'all');
  }

  function inGroup(group) {
    var me = currentIdentity();
    return !!me && hasItems(me.groups || [], [group], 'all');
  }

  function inAnyGroup(groups) {
    var me = currentIdentity();
    return !!me && hasItems(me.groups || [], groups, 'any');
  }

  function inAllGroups(groups) {
    var me = currentIdentity();
    return !!me && hasItems(me.groups || [], groups, 'all');
  }

  function can(permission) {
    var me = currentIdentity();
    return !!me && (hasSuperRole(me) || hasItems(me.permissions || [], [permission], 'all'));
  }

  function canAny(permissions) {
    var me = currentIdentity();
    return !!me && (hasSuperRole(me) || hasItems(me.permissions || [], permissions, 'any'));
  }

  function canAll(permissions) {
    var me = currentIdentity();
    return !!me && (hasSuperRole(me) || hasItems(me.permissions || [], permissions, 'all'));
  }

  function hasScope(scope) {
    var me = currentIdentity();
    return !!me && hasItems(me.scopes || [], [scope], 'all');
  }

  function hasAnyScope(scopes) {
    var me = currentIdentity();
    return !!me && hasItems(me.scopes || [], scopes, 'any');
  }

  function hasAllScopes(scopes) {
    var me = currentIdentity();
    return !!me && hasItems(me.scopes || [], scopes, 'all');
  }

  function tenant() {
    var me = currentIdentity();
    return me ? me.tenant : null;
  }

  function isTenant(value) {
    var me = currentIdentity();
    return !!me && me.tenant === value;
  }

  function check(criteria) {
    criteria = criteria || {};
    if (criteria.auth && !isAuthenticated()) return false;
    if (criteria.roles && !hasAllRoles(criteria.roles)) return false;
    if (criteria.groups && !inAllGroups(criteria.groups)) return false;
    if (criteria.permissions && !canAll(criteria.permissions)) return false;
    if (criteria.scopes && !hasAllScopes(criteria.scopes)) return false;
    if (criteria.tenant) {
      if (Array.isArray(criteria.tenant)) {
        if (!criteria.tenant.length || criteria.tenant.indexOf(tenant()) < 0) return false;
      } else if (!isTenant(criteria.tenant)) return false;
    }
    return true;
  }

  function checkAny(criteria) {
    var ok = false;
    criteria = criteria || {};
    if (criteria.auth) ok = ok || isAuthenticated();
    if (criteria.roles) ok = ok || hasAnyRole(criteria.roles);
    if (criteria.groups) ok = ok || inAnyGroup(criteria.groups);
    if (criteria.permissions) ok = ok || canAny(criteria.permissions);
    if (criteria.scopes) ok = ok || hasAnyScope(criteria.scopes);
    if (criteria.tenant) ok = ok || (Array.isArray(criteria.tenant) ? criteria.tenant.indexOf(tenant()) >= 0 : isTenant(criteria.tenant));
    return ok;
  }

  function guard(criteria) {
    return function() { return check(criteria); };
  }

  function evaluateRule(rule) {
    var text = String(rule || '').replace(/^\s+|\s+$/g, '');
    var idx;
    var type;
    var value;
    if (!text) return false;
    if (text === 'auth') return isAuthenticated();
    idx = text.indexOf(':');
    type = idx < 0 ? text : text.slice(0, idx);
    value = idx < 0 ? '' : text.slice(idx + 1);
    if (type === 'role') return hasRole(value);
    if (type === 'perm') return can(value);
    if (type === 'group') return inGroup(value);
    if (type === 'scope') return hasScope(value);
    if (type === 'tenant') return isTenant(value);
    if (type === 'auth') return isAuthenticated();
    return false;
  }

  function evaluateAny(rules) {
    var parts = String(rules || '').split(',');
    var i;
    for (i = 0; i < parts.length; i++) if (evaluateRule(parts[i])) return true;
    return false;
  }

  function applyDOM(rootElement) {
    var root = rootElement || (typeof document !== 'undefined' ? document : null);
    var nodes = [];
    var found;
    var i;
    if (!root || !root.querySelectorAll) return 0;
    if (root.getAttribute && (root.getAttribute('data-rbac-show') != null || root.getAttribute('data-rbac-hide') != null || root.getAttribute('data-rbac-disable') != null || root.getAttribute('data-rbac-class') != null)) nodes.push(root);
    found = root.querySelectorAll('[data-rbac-show],[data-rbac-hide],[data-rbac-disable],[data-rbac-class]');
    for (i = 0; i < found.length; i++) nodes.push(found[i]);
    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var show = el.getAttribute('data-rbac-show');
      var hide = el.getAttribute('data-rbac-hide');
      var disable = el.getAttribute('data-rbac-disable');
      var classRule = el.getAttribute('data-rbac-class');
      if (show != null) el.style.display = evaluateAny(show) ? '' : 'none';
      if (hide != null) el.style.display = evaluateAny(hide) ? 'none' : '';
      if (disable != null) {
        if (evaluateAny(disable)) {
          el.removeAttribute('disabled');
          el.removeAttribute('aria-disabled');
        } else {
          el.setAttribute('disabled', 'disabled');
          el.setAttribute('aria-disabled', 'true');
        }
      }
      if (classRule != null && el.classList) {
        var rules = classRule.split(',');
        var j;
        for (j = 0; j < rules.length; j++) {
          var rule = rules[j].replace(/^\s+|\s+$/g, '');
          var eq = rule.indexOf('=');
          var cond = eq < 0 ? rule : rule.slice(0, eq);
          var className = eq < 0 ? '' : rule.slice(eq + 1);
          if (!className) continue;
          if (evaluateRule(cond)) el.classList.add(className);
          else el.classList.remove(className);
        }
      }
    }
    return nodes.length;
  }

  function configure(opts) {
    opts = opts || {};
    config.tokenSource = opts.tokenSource || config.tokenSource || DEFAULTS.tokenSource;
    config.tokenKey = opts.tokenKey || config.tokenKey || DEFAULTS.tokenKey;
    config.claimMapping = copy(opts.claimMapping || config.claimMapping || {});
    config.rolePermissions = copy(opts.rolePermissions || config.rolePermissions || {});
    config.groupRoles = copy(opts.groupRoles || config.groupRoles || {});
    config.superRoles = arrayify(opts.superRoles != null ? opts.superRoles : config.superRoles, false);
    config.onChange = typeof opts.onChange === 'function' ? opts.onChange : (opts.onChange === null ? null : config.onChange);
    configVersion++;
    return refresh(true);
  }

  function setToken(token) {
    manualToken = typeof token === 'string' && token ? token : null;
    return refresh(true);
  }

  function clearToken() {
    manualToken = null;
    cachedToken = null;
    cachedIdentity = null;
    cacheVersion = configVersion;
    clearExpiryTimer();
    emitChange(null);
    return null;
  }

  function onExpiry(callback) {
    if (typeof callback !== 'function') return function() { };
    expiryListeners.push(callback);
    return function() {
      var i = expiryListeners.indexOf(callback);
      if (i >= 0) expiryListeners.splice(i, 1);
    };
  }

  return {
    WARNING: WARNING,
    configure: configure,
    identity: identity,
    isAuthenticated: isAuthenticated,
    hasRole: hasRole,
    hasAnyRole: hasAnyRole,
    hasAllRoles: hasAllRoles,
    inGroup: inGroup,
    inAnyGroup: inAnyGroup,
    inAllGroups: inAllGroups,
    can: can,
    canAny: canAny,
    canAll: canAll,
    hasScope: hasScope,
    hasAnyScope: hasAnyScope,
    check: check,
    checkAny: checkAny,
    guard: guard,
    applyDOM: applyDOM,
    setToken: setToken,
    clearToken: clearToken,
    refresh: function() { return refresh(true); },
    onExpiry: onExpiry,
    tenant: tenant,
    isTenant: isTenant
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.RBAC;
