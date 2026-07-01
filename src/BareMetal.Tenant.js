/* istanbul ignore next */
var __bmTenantRoot = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
var BareMetal = __bmTenantRoot.BareMetal || {};
__bmTenantRoot.BareMetal = BareMetal;
BareMetal.Tenant = (function(root) {
  'use strict';

  var registry = {};
  var currentTenantId = null;
  var switchListeners = [];
  var changeListeners = [];
  var globalConfig = {};
  var isolatedStores = {};

  function own(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function isObject(value) {
    return !!value && Object.prototype.toString.call(value) === '[object Object]';
  }

  function clone(value) {
    var out;
    var key;
    var i;
    if (value == null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out[i] = clone(value[i]);
      return out;
    }
    out = {};
    for (key in value) if (own(value, key)) out[key] = clone(value[key]);
    return out;
  }

  function copy(a, b) {
    var out = clone(a || {});
    var key;
    for (key in (b || {})) if (own(b, key)) out[key] = clone(b[key]);
    return out;
  }

  function merge(target, source) {
    var key;
    if (!isObject(target) || !isObject(source)) return target;
    for (key in source) if (own(source, key)) target[key] = clone(source[key]);
    return target;
  }

  function toList(value) {
    if (value == null) return [];
    return Array.isArray(value) ? value.slice() : [value];
  }

  function dedupe(list) {
    var out = [];
    var seen = {};
    var value;
    var key;
    var i;
    list = toList(list);
    for (i = 0; i < list.length; i++) {
      value = list[i];
      if (value == null || value === '') continue;
      key = String(value);
      if (own(seen, key)) continue;
      seen[key] = true;
      out.push(key);
    }
    return out;
  }

  function listAdd(list, cb) {
    if (typeof cb !== 'function') return function() {};
    list.push(cb);
    return function() {
      var i;
      for (i = list.length - 1; i >= 0; i--) {
        if (list[i] === cb) {
          list.splice(i, 1);
          break;
        }
      }
    };
  }

  function emit(list, args) {
    var entries = list.slice();
    var i;
    for (i = 0; i < entries.length; i++) {
      try { entries[i].apply(null, args); } catch (_) {}
    }
  }

  function normalizeTenantId(value) {
    if (value && typeof value === 'object' && own(value, 'id')) return String(value.id);
    if (value == null || value === '') return null;
    return String(value);
  }

  function normalizeLimitValue(value) {
    var num;
    if (value == null || value === '') return null;
    num = Number(value);
    return isFinite(num) && num >= 0 ? num : null;
  }

  function normalizeUsageValue(value) {
    var num = Number(value);
    return isFinite(num) && num >= 0 ? num : 0;
  }

  function normalizeLimits(input) {
    input = input || {};
    return {
      maxStorage: normalizeLimitValue(input.maxStorage),
      maxUsers: normalizeLimitValue(input.maxUsers),
      maxRequests: normalizeLimitValue(input.maxRequests),
      features: dedupe(input.features || [])
    };
  }

  function normalizeUsage(input) {
    input = input || {};
    return {
      storage: normalizeUsageValue(input.storage),
      users: normalizeUsageValue(input.users),
      requests: normalizeUsageValue(input.requests)
    };
  }

  function deepFreeze(value) {
    var key;
    var i;
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    if (Array.isArray(value)) {
      for (i = 0; i < value.length; i++) deepFreeze(value[i]);
      Object.freeze(value);
      return value;
    }
    for (key in value) if (own(value, key)) deepFreeze(value[key]);
    Object.freeze(value);
    return value;
  }

  function applySeal(tenant) {
    tenant.sealed = true;
    deepFreeze(tenant.config);
    deepFreeze(tenant.metadata);
    deepFreeze(tenant.limits);
    deepFreeze(tenant.features);
    deepFreeze(tenant.usage);
    deepFreeze(tenant);
    return tenant;
  }

  function syncTenantFeatures(tenant) {
    if (!tenant || tenant.sealed) return tenant;
    tenant.features = dedupe(tenant.features || []);
    tenant.limits = tenant.limits || normalizeLimits();
    tenant.limits.features = tenant.features.slice();
    return tenant;
  }

  function buildTenant(id, opts) {
    var options = opts || {};
    var limits = normalizeLimits(options.limits);
    var tenant = {
      id: String(id),
      name: options.name || String(id),
      config: clone(options.config || {}),
      metadata: clone(options.metadata || {}),
      parent: normalizeTenantId(options.parent),
      status: options.status === 'suspended' ? 'suspended' : 'active',
      created: options.created ? new Date(options.created) : new Date(),
      limits: limits,
      usage: normalizeUsage(options.usage),
      features: dedupe(options.features || limits.features || []),
      sealed: !!options.sealed
    };
    syncTenantFeatures(tenant);
    if (tenant.sealed) applySeal(tenant);
    return tenant;
  }

  function describeTenant(tenant) {
    return tenant ? tenant.id : String(tenant);
  }

  function requireTenant(ref) {
    var id = normalizeTenantId(ref);
    var tenant = id ? registry[id] : null;
    if (!tenant) throw new Error('Unknown tenant: ' + describeTenant(ref));
    return tenant;
  }

  function requireActiveTenant(ref) {
    var tenant = requireTenant(ref);
    if (tenant.status === 'suspended') throw new Error('Tenant is suspended: ' + tenant.id);
    return tenant;
  }

  function requireWritableTenant(ref) {
    var tenant = requireActiveTenant(ref);
    if (tenant.sealed) throw new Error('Tenant is sealed: ' + tenant.id);
    return tenant;
  }

  function requireManageableTenant(ref) {
    var tenant = requireTenant(ref);
    if (tenant.sealed) throw new Error('Tenant is sealed: ' + tenant.id);
    return tenant;
  }

  function upsertTenant(tenant, silent) {
    var next = buildTenant(tenant.id, tenant);
    var existing = registry[next.id];
    if (existing && existing.sealed) throw new Error('Tenant is sealed: ' + next.id);
    registry[next.id] = next;
    if (!silent) emitChange('add', next, { replaced: !!existing });
    return next;
  }

  function getCurrentTenant() {
    return currentTenantId ? (registry[currentTenantId] || null) : null;
  }

  function emitSwitch(next, previous, reason) {
    if ((previous ? previous.id : null) === (next ? next.id : null)) return next;
    emit(switchListeners, [next || null, previous || null, { reason: reason || 'set', timestamp: Date.now() }]);
    return next;
  }

  function emitChange(type, tenant, detail) {
    emit(changeListeners, [{ type: type, tenant: tenant || null, detail: detail || null, timestamp: Date.now() }]);
    return tenant;
  }

  function setCurrentTenant(ref, reason) {
    var previous = getCurrentTenant();
    var next = null;
    if (ref != null) {
      if (typeof ref === 'object' && own(ref, 'id') && !registry[String(ref.id)]) next = upsertTenant(ref, true);
      else next = requireTenant(ref);
    }
    currentTenantId = next ? next.id : null;
    emitSwitch(next, previous, reason || 'set');
    return next;
  }

  function isPromiseLike(value) {
    return !!value && typeof value.then === 'function';
  }

  function scope(tenantId, fn, reason) {
    var previous = getCurrentTenant();
    var target = tenantId == null ? previous : requireActiveTenant(tenantId);
    var changed = (previous ? previous.id : null) !== (target ? target.id : null);
    var result;

    if (typeof fn !== 'function') return target;
    if (changed) setCurrentTenant(target, reason || 'scope');

    try {
      result = fn(target || null);
    } catch (err) {
      if (changed) setCurrentTenant(previous, 'restore');
      throw err;
    }

    if (isPromiseLike(result)) {
      return Promise.resolve(result).then(function(value) {
        if (changed) setCurrentTenant(previous, 'restore');
        return value;
      }, function(err) {
        if (changed) setCurrentTenant(previous, 'restore');
        throw err;
      });
    }

    if (changed) setCurrentTenant(previous, 'restore');
    return result;
  }

  function middleware(fn) {
    if (typeof fn !== 'function') return function() {};
    return function() {
      var tenant = getCurrentTenant();
      var args = Array.prototype.slice.call(arguments);
      args.unshift(tenant ? tenant.id : null);
      if (!tenant) return fn.apply(this, args);
      return scope(tenant.id, function() {
        return fn.apply(this, args);
      }.bind(this), 'middleware');
    };
  }

  function storeAdd(tenant) {
    if (!tenant || !own(tenant, 'id')) throw new Error('Tenant must have an id');
    return upsertTenant(tenant, false);
  }

  function storeGet(id) {
    return registry[normalizeTenantId(id)] || null;
  }

  function storeRemove(id) {
    var tenant = requireManageableTenant(id);
    var previousCurrent = getCurrentTenant();
    delete registry[tenant.id];
    if (previousCurrent && previousCurrent.id === tenant.id) {
      currentTenantId = null;
      emitSwitch(null, previousCurrent, 'remove');
    }
    emitChange('remove', tenant);
  }

  function storeList(opts) {
    var options = opts || {};
    var out = [];
    var key;
    for (key in registry) if (own(registry, key)) {
      if (options.status && registry[key].status !== options.status) continue;
      if (options.parent != null && registry[key].parent !== normalizeTenantId(options.parent)) continue;
      out.push(registry[key]);
    }
    return out;
  }

  function storeFind(predicate) {
    var list = storeList();
    var i;
    if (typeof predicate !== 'function') return null;
    for (i = 0; i < list.length; i++) if (predicate(list[i])) return list[i];
    return null;
  }

  function storeCount() {
    return storeList().length;
  }

  function resolveConfigObject(tenant, seen) {
    var merged = clone(globalConfig);
    var marker = seen || {};
    var parent;
    if (!tenant) return merged;
    if (tenant.parent && !own(marker, tenant.parent) && registry[tenant.parent]) {
      marker[tenant.parent] = true;
      parent = resolveConfigObject(registry[tenant.parent], marker);
      merge(merged, parent);
    }
    merge(merged, tenant.config || {});
    return merged;
  }

  function resolveConfigValue(tenant, key, seen) {
    var marker = seen || {};
    var parentValue;
    if (tenant && tenant.config && own(tenant.config, key)) return clone(tenant.config[key]);
    if (tenant && tenant.parent && !own(marker, tenant.parent) && registry[tenant.parent]) {
      marker[tenant.parent] = true;
      parentValue = resolveConfigValue(registry[tenant.parent], key, marker);
      if (typeof parentValue !== 'undefined') return parentValue;
    }
    return own(globalConfig, key) ? clone(globalConfig[key]) : undefined;
  }

  function config(tenantId, key, value) {
    var tenant;
    var writable;
    var changes;
    if (tenantId == null || tenantId === 'global') {
      if (arguments.length === 1) return clone(globalConfig);
      if (isObject(key)) {
        globalConfig = copy(globalConfig, key);
        emitChange('config', null, { scope: 'global' });
        return clone(globalConfig);
      }
      if (typeof value === 'undefined') return own(globalConfig, key) ? clone(globalConfig[key]) : undefined;
      globalConfig[key] = clone(value);
      emitChange('config', null, { scope: 'global', key: key });
      return clone(globalConfig[key]);
    }

    tenant = typeof tenantId === 'undefined' ? requireActiveTenant(getCurrentTenant()) : requireActiveTenant(tenantId);
    writable = isObject(key) || typeof value !== 'undefined';
    if (writable && tenant.sealed) throw new Error('Tenant is sealed: ' + tenant.id);

    if (arguments.length === 1 || typeof key === 'undefined') return resolveConfigObject(tenant);
    if (isObject(key)) {
      changes = clone(key);
      tenant.config = copy(tenant.config, changes);
      emitChange('config', tenant, { keys: Object.keys(changes) });
      return resolveConfigObject(tenant);
    }
    if (typeof value === 'undefined') return resolveConfigValue(tenant, key);
    tenant.config[key] = clone(value);
    emitChange('config', tenant, { key: key });
    return clone(tenant.config[key]);
  }

  function current(tenant) {
    if (!arguments.length) return getCurrentTenant();
    return setCurrentTenant(tenant, 'set');
  }

  function currentScopedTenant(writable) {
    var tenant = getCurrentTenant();
    if (!tenant) throw new Error('No current tenant context');
    return writable ? requireWritableTenant(tenant) : requireActiveTenant(tenant);
  }

  function isolate(namespace) {
    var name = String(namespace || 'default');
    var store = isolatedStores[name] = isolatedStores[name] || {};

    function prefix(tenant, key) {
      return tenant.id + ':' + String(key == null ? '' : key);
    }

    return {
      get: function(key) {
        var tenant = currentScopedTenant(false);
        return clone(store[prefix(tenant, key)]);
      },
      set: function(key, value) {
        var tenant = currentScopedTenant(true);
        store[prefix(tenant, key)] = clone(value);
        return clone(value);
      },
      delete: function(key) {
        var tenant = currentScopedTenant(true);
        delete store[prefix(tenant, key)];
      },
      keys: function() {
        var tenant = currentScopedTenant(false);
        var list = [];
        var marker = tenant.id + ':';
        var item;
        for (item in store) if (own(store, item) && item.indexOf(marker) === 0) list.push(item.slice(marker.length));
        return list;
      },
      clear: function() {
        var tenant = currentScopedTenant(true);
        var marker = tenant.id + ':';
        var item;
        for (item in store) if (own(store, item) && item.indexOf(marker) === 0) delete store[item];
      }
    };
  }

  function compareId(a, b) {
    return String(a) === String(b);
  }

  function partition(collection, tenantField) {
    var list = Array.isArray(collection) ? collection : [];
    var field = tenantField || 'tenantId';

    return {
      query: function(tenantId, filter) {
        var tenant = requireActiveTenant(tenantId == null ? getCurrentTenant() : tenantId);
        var out = [];
        var i;
        for (i = 0; i < list.length; i++) {
          if (!list[i] || list[i][field] !== tenant.id) continue;
          if (typeof filter === 'function' && !filter(list[i])) continue;
          out.push(list[i]);
        }
        return out;
      },
      add: function(tenantId, item) {
        var tenant = requireWritableTenant(tenantId == null ? getCurrentTenant() : tenantId);
        var next = clone(item || {});
        next[field] = tenant.id;
        list.push(next);
        return next;
      },
      move: function(itemId, fromTenant, toTenant) {
        var source = requireWritableTenant(fromTenant);
        var target = requireWritableTenant(toTenant);
        var i;
        for (i = 0; i < list.length; i++) {
          if (!list[i] || !compareId(list[i].id, itemId) || list[i][field] !== source.id) continue;
          list[i][field] = target.id;
          return list[i];
        }
        return null;
      },
      counts: function() {
        var out = {};
        var i;
        var tenantId;
        for (i = 0; i < list.length; i++) {
          tenantId = list[i] && list[i][field] != null ? String(list[i][field]) : '';
          if (!tenantId) continue;
          out[tenantId] = (out[tenantId] || 0) + 1;
        }
        return out;
      }
    };
  }

  function hierarchy(tenantId) {
    var tenant = requireTenant(tenantId == null ? getCurrentTenant() : tenantId);
    var ancestors = [];
    var descendants = [];
    var children = storeList({ parent: tenant.id });
    var parent = tenant.parent ? storeGet(tenant.parent) : null;
    var walkSeen = {};
    var next = parent;

    while (next && !own(walkSeen, next.id)) {
      walkSeen[next.id] = true;
      ancestors.push(next);
      next = next.parent ? storeGet(next.parent) : null;
    }

    walkSeen = {};
    (function walk(parentId) {
      var branch = storeList({ parent: parentId });
      var i;
      for (i = 0; i < branch.length; i++) {
        if (own(walkSeen, branch[i].id)) continue;
        walkSeen[branch[i].id] = true;
        descendants.push(branch[i]);
        walk(branch[i].id);
      }
    })(tenant.id);

    return {
      ancestors: ancestors,
      descendants: descendants,
      parent: parent,
      children: children
    };
  }

  function limitKeys(resource) {
    var name = String(resource == null ? '' : resource).toLowerCase();
    if (name === 'storage' || name === 'maxstorage') return { limit: 'maxStorage', usage: 'storage' };
    if (name === 'user' || name === 'users' || name === 'maxusers') return { limit: 'maxUsers', usage: 'users' };
    return { limit: 'maxRequests', usage: 'requests' };
  }

  function remainingValue(limit, usage) {
    if (limit == null) return Infinity;
    return limit - usage > 0 ? limit - usage : 0;
  }

  function limitStatus(tenant, resource, amount, projected) {
    var keys = limitKeys(resource);
    var limit = tenant.limits[keys.limit];
    var currentUsage = tenant.usage[keys.usage] || 0;
    var requested = typeof amount === 'undefined' ? 0 : normalizeUsageValue(amount);
    var nextUsage = projected ? currentUsage + requested : currentUsage;
    if (limit == null) {
      return { allowed: true, remaining: Infinity, limit: null };
    }
    return {
      allowed: nextUsage <= limit,
      remaining: remainingValue(limit, nextUsage),
      limit: limit
    };
  }

  function limits(tenantId, nextLimits) {
    var tenant = requireTenant(tenantId == null ? getCurrentTenant() : tenantId);
    if (typeof nextLimits !== 'undefined') {
      requireManageableTenant(tenant);
      tenant.limits = copy(tenant.limits, normalizeLimits(nextLimits));
      if (own(nextLimits, 'features')) tenant.features = dedupe(nextLimits.features || []);
      syncTenantFeatures(tenant);
      emitChange('limits', tenant);
    }
    return {
      maxStorage: tenant.limits.maxStorage,
      maxUsers: tenant.limits.maxUsers,
      maxRequests: tenant.limits.maxRequests,
      features: clone(tenant.features),
      check: function(resource, amount) {
        return limitStatus(requireActiveTenant(tenant.id), resource, amount, true);
      },
      consume: function(resource, amount) {
        var live = requireWritableTenant(tenant.id);
        var keys = limitKeys(resource);
        var requested = typeof amount === 'undefined' ? 1 : normalizeUsageValue(amount);
        var status = limitStatus(live, resource, requested, true);
        if (!status.allowed) return status;
        live.usage[keys.usage] = (live.usage[keys.usage] || 0) + requested;
        emitChange('limits', live, { resource: keys.usage, amount: requested });
        return limitStatus(live, resource, 0, false);
      },
      reset: function(resource) {
        var live = requireWritableTenant(tenant.id);
        var keys;
        if (typeof resource === 'undefined') {
          live.usage = normalizeUsage();
          emitChange('limits', live, { reset: 'all' });
          return;
        }
        keys = limitKeys(resource);
        live.usage[keys.usage] = 0;
        emitChange('limits', live, { reset: keys.usage });
      }
    };
  }

  function features(tenantId) {
    var tenant = requireTenant(tenantId == null ? getCurrentTenant() : tenantId);
    return {
      has: function(feature) {
        var live = requireActiveTenant(tenant.id);
        return live.features.indexOf(String(feature)) > -1;
      },
      list: function() {
        var live = requireActiveTenant(tenant.id);
        return live.features.slice();
      },
      enable: function(feature) {
        var live = requireWritableTenant(tenant.id);
        live.features.push(String(feature));
        syncTenantFeatures(live);
        emitChange('features', live, { feature: String(feature), enabled: true });
        return live.features.slice();
      },
      disable: function(feature) {
        var live = requireWritableTenant(tenant.id);
        var target = String(feature);
        var i;
        for (i = live.features.length - 1; i >= 0; i--) if (live.features[i] === target) live.features.splice(i, 1);
        syncTenantFeatures(live);
        emitChange('features', live, { feature: target, enabled: false });
        return live.features.slice();
      }
    };
  }

  function onSwitch(callback) {
    return listAdd(switchListeners, callback);
  }

  function onChange(callback) {
    return listAdd(changeListeners, callback);
  }

  function impersonate(tenantId, fn) {
    return scope(tenantId, fn, 'impersonate');
  }

  function exportTenant(tenantId) {
    var tenant = requireTenant(tenantId == null ? getCurrentTenant() : tenantId);
    return {
      id: tenant.id,
      name: tenant.name,
      parent: tenant.parent,
      status: tenant.status,
      created: tenant.created instanceof Date ? tenant.created.toISOString() : tenant.created,
      config: clone(tenant.config),
      metadata: clone(tenant.metadata),
      limits: clone(tenant.limits),
      usage: clone(tenant.usage),
      features: clone(tenant.features),
      sealed: !!tenant.sealed
    };
  }

  function importTenant(data) {
    if (!data || !data.id) throw new Error('Tenant import requires an id');
    return upsertTenant(data, false);
  }

  function slug(value) {
    return String(value == null ? '' : value).toLowerCase().replace(/^\s+|\s+$/g, '');
  }

  function resolveByValue(value) {
    var key = normalizeTenantId(value);
    var token = slug(value);
    var found = null;
    if (key && registry[key]) return registry[key];
    found = storeFind(function(tenant) {
      return slug(tenant.name) === token || slug(tenant.metadata.subdomain) === token;
    });
    return found || null;
  }

  function extractHeaderValue(identifier) {
    var headers = identifier && identifier.headers;
    var name = identifier && identifier.header;
    var key;
    if (headers && typeof headers === 'object') {
      if (own(headers, name)) return headers[name];
      for (key in headers) if (own(headers, key) && slug(key) === slug(name)) return headers[key];
    }
    return name;
  }

  function extractPathValue(pathValue) {
    var value = String(pathValue == null ? '' : pathValue);
    var match = value.match(/\/t\/([^/?#]+)/i);
    var parts;
    if (match && match[1]) return decodeURIComponent(match[1]);
    parts = value.split('/');
    return parts.length ? parts[parts.length - 1] : value;
  }

  function extractClaimValue(identifier) {
    var claims = identifier && (identifier.claims || identifier.token);
    var claim = identifier && identifier.claim;
    var key;
    if (claims && typeof claims === 'object') {
      if (own(claims, claim)) return claims[claim];
      for (key in claims) if (own(claims, key) && slug(key) === slug(claim)) return claims[key];
    }
    return claim;
  }

  function resolve(identifier) {
    var headerName;
    var tenant;
    if (identifier == null) return getCurrentTenant();
    if (typeof identifier === 'string') return resolveByValue(identifier);
    if (own(identifier, 'subdomain')) return resolveByValue(identifier.subdomain);
    if (own(identifier, 'header')) {
      tenant = resolveByValue(extractHeaderValue(identifier));
      if (tenant) return tenant;
      headerName = slug(identifier.header);
      return storeFind(function(entry) {
        return slug(entry.metadata.header) === headerName || dedupe(entry.metadata.headers || []).indexOf(String(identifier.header)) > -1;
      });
    }
    if (own(identifier, 'path')) return resolveByValue(extractPathValue(identifier.path));
    if (own(identifier, 'claim')) {
      tenant = resolveByValue(extractClaimValue(identifier));
      if (tenant) return tenant;
      return storeFind(function(entry) {
        return slug(entry.metadata.claim) === slug(identifier.claim);
      });
    }
    return null;
  }

  function seal(tenantId) {
    var tenant = requireManageableTenant(tenantId == null ? getCurrentTenant() : tenantId);
    if (tenant.sealed) return tenant;
    tenant = buildTenant(tenant.id, copy(tenant, { sealed: true }));
    registry[tenant.id] = tenant;
    emitChange('seal', tenant);
    return tenant;
  }

  function suspend(tenantId) {
    var tenant = requireManageableTenant(tenantId == null ? getCurrentTenant() : tenantId);
    tenant.status = 'suspended';
    emitChange('status', tenant, { status: 'suspended' });
    return tenant;
  }

  function activate(tenantId) {
    var tenant = requireManageableTenant(tenantId == null ? getCurrentTenant() : tenantId);
    tenant.status = 'active';
    emitChange('status', tenant, { status: 'active' });
    return tenant;
  }

  return {
    create: function(id, opts) {
      if (id == null || id === '') throw new Error('Tenant id is required');
      return buildTenant(id, opts || {});
    },
    current: current,
    scope: scope,
    middleware: middleware,
    store: {
      add: storeAdd,
      get: storeGet,
      remove: storeRemove,
      list: storeList,
      find: storeFind,
      count: storeCount
    },
    config: config,
    isolate: isolate,
    partition: partition,
    hierarchy: hierarchy,
    limits: limits,
    features: features,
    onSwitch: onSwitch,
    onChange: onChange,
    impersonate: impersonate,
    export: exportTenant,
    import: importTenant,
    resolve: resolve,
    seal: seal,
    suspend: suspend,
    activate: activate
  };
})(__bmTenantRoot);
if (typeof module !== 'undefined') module.exports = BareMetal.Tenant;
