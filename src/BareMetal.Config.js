var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Config = (function(){
  'use strict';

  var PRIORITIES = {
    defaults: 0,
    env: 10,
    file: 20,
    runtime: 30,
    override: 40
  };

  function own(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function isPlainObject(value) {
    return !!value && Object.prototype.toString.call(value) === '[object Object]';
  }

  function hasKeys(obj) {
    var key;
    for (key in obj) if (own(obj, key)) return true;
    return false;
  }

  function clone(value) {
    var out, i, key;
    if (Array.isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(clone(value[i]));
      return out;
    }
    if (value instanceof Date) return new Date(value.getTime());
    if (isPlainObject(value)) {
      out = {};
      for (key in value) if (own(value, key)) out[key] = clone(value[key]);
      return out;
    }
    return value;
  }

  function sameValue(a, b) {
    var aKeys, bKeys, i;
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (i = 0; i < a.length; i++) if (!sameValue(a[i], b[i])) return false;
      return true;
    }
    if (isPlainObject(a) && isPlainObject(b)) {
      aKeys = Object.keys(a);
      bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      for (i = 0; i < aKeys.length; i++) {
        if (!own(b, aKeys[i]) || !sameValue(a[aKeys[i]], b[aKeys[i]])) return false;
      }
      return true;
    }
    return false;
  }

  function splitPath(path) {
    return path == null || path === '' ? [] : String(path).split('.');
  }

  function getPath(obj, path) {
    var parts = splitPath(path);
    var cur = obj;
    var i;
    if (!parts.length) return cur;
    for (i = 0; i < parts.length; i++) {
      if (cur == null || !own(cur, parts[i])) return void 0;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function hasPath(obj, path) {
    var parts = splitPath(path);
    var cur = obj;
    var i;
    if (!parts.length) return true;
    for (i = 0; i < parts.length; i++) {
      if (cur == null || !own(cur, parts[i])) return false;
      cur = cur[parts[i]];
    }
    return true;
  }

  function setPath(obj, path, value) {
    var parts = splitPath(path);
    var cur = obj;
    var i;
    if (!parts.length) return obj;
    for (i = 0; i < parts.length - 1; i++) {
      if (!isPlainObject(cur[parts[i]])) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = clone(value);
    return obj;
  }

  function deletePath(obj, path) {
    var parts = splitPath(path);
    return !!parts.length && deleteAt(obj, parts, 0);
  }

  function deleteAt(obj, parts, index) {
    var key = parts[index];
    var child;
    if (!isPlainObject(obj) || !own(obj, key)) return false;
    if (index === parts.length - 1) {
      delete obj[key];
      return true;
    }
    child = obj[key];
    if (!deleteAt(child, parts, index + 1)) return false;
    if (isPlainObject(child) && !hasKeys(child)) delete obj[key];
    return true;
  }

  function deepMerge(target, source) {
    var key;
    var value;
    if (!isPlainObject(target)) target = {};
    if (!isPlainObject(source)) return target;
    for (key in source) if (own(source, key)) {
      value = source[key];
      if (isPlainObject(value)) {
        if (!isPlainObject(target[key])) target[key] = {};
        deepMerge(target[key], value);
      } else {
        target[key] = clone(value);
      }
    }
    return target;
  }

  function flattenObject(obj, prefix, out) {
    var key;
    if (!isPlainObject(obj)) {
      if (prefix) out[prefix] = clone(obj);
      return out;
    }
    for (key in obj) if (own(obj, key)) flattenObject(obj[key], prefix ? prefix + '.' + key : key, out);
    return out;
  }

  function envName(path) {
    return String(path || '').replace(/\./g, '_').toUpperCase();
  }

  function envPath(name) {
    return String(name || '').toLowerCase().replace(/_/g, '.');
  }

  function isType(type, value) {
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return isPlainObject(value);
    if (type === 'number') return typeof value === 'number' && isFinite(value);
    if (type === 'integer') return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    if (type === 'null') return value === null;
    if (type === 'date') return value instanceof Date;
    return typeof value === type;
  }

  function addError(errors, key, code, message, value) {
    errors.push({ key: key, code: code, message: message, value: clone(value) });
  }

  function validateRule(key, rule, value, errors) {
    var i;
    var found;
    if (!isPlainObject(rule)) return;
    if (value === void 0 && own(rule, 'default')) value = clone(rule.default);
    if (rule.required && (value === void 0 || value === null || value === '')) {
      addError(errors, key, 'required', 'Configuration key is required.', value);
      return;
    }
    if (value === void 0 || value === null) return;
    if (rule.type && !isType(rule.type, value)) {
      addError(errors, key, 'type', 'Expected ' + rule.type + '.', value);
      return;
    }
    if (rule.enum && rule.enum.length) {
      found = false;
      for (i = 0; i < rule.enum.length; i++) if (sameValue(rule.enum[i], value)) {
        found = true;
        break;
      }
      if (!found) addError(errors, key, 'enum', 'Expected one of: ' + rule.enum.join(', ') + '.', value);
    }
    if (rule.min != null) {
      if (typeof value === 'number' && value < rule.min) addError(errors, key, 'min', 'Must be at least ' + rule.min + '.', value);
      if ((typeof value === 'string' || Array.isArray(value)) && value.length < rule.min) addError(errors, key, 'min', 'Must be at least ' + rule.min + ' items.', value);
    }
    if (rule.max != null) {
      if (typeof value === 'number' && value > rule.max) addError(errors, key, 'max', 'Must be at most ' + rule.max + '.', value);
      if ((typeof value === 'string' || Array.isArray(value)) && value.length > rule.max) addError(errors, key, 'max', 'Must be at most ' + rule.max + ' items.', value);
    }
  }

  function create(opts) {
    var options = opts || {};
    var layers = [];
    var schemaDef = isPlainObject(options.schema) ? clone(options.schema) : {};
    var strict = !!options.strict;
    var frozen = false;
    var anyListeners = [];
    var keyListeners = {};
    var externalChange = typeof options.onChange === 'function' ? options.onChange : null;
    var overrideEntries = [];
    var layerOrder = 0;
    var overrideId = 0;
    var api;

    function priorityFor(name) {
      return own(PRIORITIES, name) ? PRIORITIES[name] : 0;
    }

    function sortedLayers() {
      return layers.slice().sort(function(a, b) {
        if (a.priority === b.priority) return a.order - b.order;
        return a.priority - b.priority;
      });
    }

    function findLayer(name) {
      var i;
      for (i = 0; i < layers.length; i++) if (layers[i].name === name) return layers[i];
      return null;
    }

    function ensureLayer(name, priority) {
      var entry = findLayer(name);
      if (entry) {
        if (priority != null) entry.priority = priority;
        return entry;
      }
      entry = {
        name: name,
        priority: priority != null ? priority : priorityFor(name),
        order: ++layerOrder,
        data: {}
      };
      if (name === 'override') entry.baseData = {};
      layers.push(entry);
      return entry;
    }

    function clearOverrideTimers() {
      var i;
      for (i = 0; i < overrideEntries.length; i++) if (overrideEntries[i].timer) clearTimeout(overrideEntries[i].timer);
      overrideEntries = [];
    }

    function syncOverrideLayer() {
      var entry = ensureLayer('override', priorityFor('override'));
      var merged = clone(entry.baseData || {});
      var i;
      for (i = 0; i < overrideEntries.length; i++) deepMerge(merged, overrideEntries[i].data);
      entry.data = merged;
    }

    function schemaDefaults() {
      var out = {};
      var key;
      var rule;
      for (key in schemaDef) if (own(schemaDef, key)) {
        rule = schemaDef[key];
        if (isPlainObject(rule) && own(rule, 'default')) setPath(out, key, rule.default);
      }
      return out;
    }

    function resolveAll() {
      var out = schemaDefaults();
      var list = sortedLayers();
      var i;
      for (i = 0; i < list.length; i++) deepMerge(out, list[i].data);
      return out;
    }

    function notify(key, value, layerName) {
      var list = keyListeners[key] || [];
      var i;
      var next = clone(value);
      for (i = 0; i < list.length; i++) {
        try { list[i](clone(next), layerName, key); } catch (_) {}
      }
      for (i = 0; i < anyListeners.length; i++) {
        try { anyListeners[i](key, clone(next), layerName); } catch (_) {}
      }
      if (externalChange) {
        try { externalChange(key, clone(next), layerName); } catch (_) {}
      }
    }

    function diffAndNotify(before, after, layerName) {
      var beforeFlat = {};
      var afterFlat = {};
      var seen = {};
      var key;
      flattenObject(before, '', beforeFlat);
      flattenObject(after, '', afterFlat);
      for (key in beforeFlat) if (own(beforeFlat, key)) seen[key] = true;
      for (key in afterFlat) if (own(afterFlat, key)) seen[key] = true;
      for (key in seen) if (own(seen, key) && !sameValue(beforeFlat[key], afterFlat[key])) notify(key, afterFlat[key], layerName);
    }

    function mutate(layerName, worker) {
      var before;
      var after;
      if (frozen) return false;
      before = resolveAll();
      if (worker() === false) return false;
      after = resolveAll();
      diffAndNotify(before, after, layerName);
      return true;
    }

    function validateMutationObject(obj, prefix) {
      var errors = [];
      var flat = {};
      var key;
      if (!strict || !hasKeys(schemaDef)) return errors;
      flattenObject(obj, prefix || '', flat);
      for (key in flat) if (own(flat, key)) {
        if (!own(schemaDef, key)) {
          addError(errors, key, 'unknown', 'Unknown configuration key.', flat[key]);
          continue;
        }
        validateRule(key, schemaDef[key], flat[key], errors);
      }
      return errors;
    }

    function get(key, defaultValue) {
      var list;
      var i;
      if (key == null || key === '') return resolveAll();
      list = sortedLayers();
      for (i = list.length - 1; i >= 0; i--) {
        if (hasPath(list[i].data, key)) return clone(getPath(list[i].data, key));
      }
      if (own(schemaDef, key) && isPlainObject(schemaDef[key]) && own(schemaDef[key], 'default')) return clone(schemaDef[key].default);
      return clone(defaultValue);
    }

    function set(key, value, layerName) {
      var payload = {};
      var errors;
      layerName = layerName || 'runtime';
      if (typeof key !== 'string' || !key) return false;
      setPath(payload, key, value);
      errors = validateMutationObject(payload, '');
      if (errors.length) return false;
      return mutate(layerName, function() {
        var entry = ensureLayer(layerName);
        if (layerName === 'override') {
          setPath(entry.baseData, key, value);
          syncOverrideLayer();
        } else {
          setPath(entry.data, key, value);
        }
      }) ? api : false;
    }

    function has(key) {
      var list;
      var i;
      if (key == null || key === '') return true;
      list = sortedLayers();
      for (i = list.length - 1; i >= 0; i--) if (hasPath(list[i].data, key)) return true;
      return own(schemaDef, key) && isPlainObject(schemaDef[key]) && own(schemaDef[key], 'default');
    }

    function getAll() {
      return resolveAll();
    }

    function remove(key, layerName) {
      layerName = layerName || 'runtime';
      if (typeof key !== 'string' || !key) return false;
      return mutate(layerName, function() {
        var entry = ensureLayer(layerName);
        if (layerName === 'override') {
          deletePath(entry.baseData, key);
          syncOverrideLayer();
        } else {
          deletePath(entry.data, key);
        }
      }) ? api : false;
    }

    function reset(layerName) {
      layerName = layerName || 'runtime';
      return mutate(layerName, function() {
        var entry = ensureLayer(layerName);
        if (layerName === 'override') {
          clearOverrideTimers();
          entry.baseData = {};
          syncOverrideLayer();
        } else {
          entry.data = {};
        }
      }) ? api : false;
    }

    function applyLayer(name, data, priority) {
      var entry = ensureLayer(name, priority);
      if (priority != null) entry.priority = priority;
      if (name === 'override') {
        entry.baseData = isPlainObject(data) ? clone(data) : {};
        syncOverrideLayer();
      } else {
        entry.data = isPlainObject(data) ? clone(data) : {};
      }
      return entry;
    }

    function addLayer(name, data, priority) {
      var errors = validateMutationObject(data || {}, '');
      if (errors.length) return false;
      return mutate(name, function() {
        applyLayer(name, data, priority);
      }) ? api : false;
    }

    function getLayer(name) {
      var entry = findLayer(name);
      return entry ? clone(entry.data) : void 0;
    }

    function getLayers() {
      var list = sortedLayers();
      var out = [];
      var i;
      for (i = 0; i < list.length; i++) out.push({ name: list[i].name, priority: list[i].priority, data: clone(list[i].data) });
      return out;
    }

    function validate() {
      var errors = [];
      var merged = getAll();
      var flat = {};
      var key;
      for (key in schemaDef) if (own(schemaDef, key)) validateRule(key, schemaDef[key], get(key), errors);
      if (strict) {
        flattenObject(merged, '', flat);
        for (key in flat) if (own(flat, key) && !own(schemaDef, key)) addError(errors, key, 'unknown', 'Unknown configuration key.', flat[key]);
      }
      return { valid: !errors.length, errors: errors };
    }

    function setSchema(definition) {
      return mutate('schema', function() {
        schemaDef = isPlainObject(definition) ? clone(definition) : {};
      }) ? api : false;
    }

    function override(overrides, duration) {
      var record;
      var cancelled = false;
      if (frozen) return false;
      record = { id: ++overrideId, data: isPlainObject(overrides) ? clone(overrides) : {}, timer: null };
      mutate('override', function() {
        ensureLayer('override', priorityFor('override'));
        overrideEntries.push(record);
        syncOverrideLayer();
      });
      function cancel() {
        var i;
        if (cancelled) return false;
        cancelled = true;
        if (record.timer) clearTimeout(record.timer);
        return mutate('override', function() {
          for (i = overrideEntries.length - 1; i >= 0; i--) if (overrideEntries[i].id === record.id) overrideEntries.splice(i, 1);
          syncOverrideLayer();
        });
      }
      if (duration != null && duration >= 0) record.timer = setTimeout(cancel, duration);
      return cancel;
    }

    function freeze() {
      frozen = true;
      return api;
    }

    function onChange(key, cb) {
      if (typeof key !== 'string' || !key || typeof cb !== 'function') return function() {};
      (keyListeners[key] = keyListeners[key] || []).push(cb);
      return function() {
        var list = keyListeners[key] || [];
        var i;
        for (i = list.length - 1; i >= 0; i--) if (list[i] === cb) list.splice(i, 1);
      };
    }

    function onAnyChange(cb) {
      if (typeof cb !== 'function') return function() {};
      anyListeners.push(cb);
      return function() {
        var i;
        for (i = anyListeners.length - 1; i >= 0; i--) if (anyListeners[i] === cb) anyListeners.splice(i, 1);
      };
    }

    function toEnv() {
      var flat = {};
      var out = {};
      var key;
      var value;
      flattenObject(getAll(), '', flat);
      for (key in flat) if (own(flat, key) && flat[key] !== void 0) {
        value = flat[key];
        if (Array.isArray(value) || isPlainObject(value)) value = JSON.stringify(value);
        out[envName(key)] = clone(value);
      }
      return out;
    }

    function parseEnvValue(key, value) {
      var rule = schemaDef[key];
      var text;
      if (value == null) return value;
      if (rule && rule.type === 'number' && typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) return Number(value);
      if (rule && rule.type === 'integer' && typeof value === 'string' && /^-?\d+$/.test(value)) return parseInt(value, 10);
      if (rule && rule.type === 'boolean' && typeof value === 'string') return value === 'true';
      if (rule && (rule.type === 'array' || rule.type === 'object') && typeof value === 'string') {
        try { return JSON.parse(value); } catch (_) { return value; }
      }
      if (typeof value !== 'string') return clone(value);
      text = value.replace(/^\s+|\s+$/g, '');
      if (text === 'true') return true;
      if (text === 'false') return false;
      if (text === 'null') return null;
      if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
      if ((text.charAt(0) === '{' && text.charAt(text.length - 1) === '}') || (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']')) {
        try { return JSON.parse(text); } catch (_) {}
      }
      return value;
    }

    function fromEnv(env) {
      var out = {};
      var key;
      if (!isPlainObject(env)) return false;
      for (key in env) if (own(env, key)) setPath(out, envPath(key), parseEnvValue(envPath(key), env[key]));
      return merge(out, 'env');
    }

    function merge(obj, layerName) {
      var payload = isPlainObject(obj) ? obj : {};
      var errors = validateMutationObject(payload, '');
      layerName = layerName || 'runtime';
      if (errors.length) return false;
      return mutate(layerName, function() {
        var entry = ensureLayer(layerName);
        if (layerName === 'override') {
          deepMerge(entry.baseData, payload);
          syncOverrideLayer();
        } else {
          deepMerge(entry.data, payload);
        }
      }) ? api : false;
    }

    function exportSnapshot() {
      return {
        version: 1,
        strict: strict,
        frozen: frozen,
        schema: clone(schemaDef),
        layers: getLayers()
      };
    }

    function importSnapshot(snapshot) {
      if (!isPlainObject(snapshot)) return false;
      return mutate('import', function() {
        var list = Array.isArray(snapshot.layers) ? snapshot.layers : [];
        var i;
        clearOverrideTimers();
        layers = [];
        layerOrder = 0;
        schemaDef = isPlainObject(snapshot.schema) ? clone(snapshot.schema) : {};
        strict = !!snapshot.strict;
        ensureLayer('defaults', priorityFor('defaults'));
        ensureLayer('env', priorityFor('env'));
        ensureLayer('file', priorityFor('file'));
        ensureLayer('runtime', priorityFor('runtime'));
        ensureLayer('override', priorityFor('override'));
        for (i = 0; i < list.length; i++) if (list[i] && list[i].name) applyLayer(list[i].name, list[i].data, list[i].priority);
        syncOverrideLayer();
        frozen = !!snapshot.frozen;
      }) ? api : false;
    }

    function scope(prefix) {
      var base = prefix == null ? '' : String(prefix);
      var scoped;

      function join(key) {
        if (key == null || key === '') return base;
        return base ? base + '.' + key : String(key);
      }

      function trim(key) {
        if (!base) return key;
        if (key === base) return '';
        return key.indexOf(base + '.') === 0 ? key.slice(base.length + 1) : key;
      }

      scoped = {
        get: function(key, defaultValue) { return get(join(key), defaultValue); },
        set: function(key, value, layerName) { return set(join(key), value, layerName) ? scoped : false; },
        has: function(key) { return has(join(key)); },
        getAll: function() {
          var value = base ? get(base) : getAll();
          if (value === void 0) return {};
          return clone(value);
        },
        delete: function(key, layerName) { return remove(join(key), layerName) ? scoped : false; },
        reset: function(layerName) { return base ? remove(base, layerName) ? scoped : false : reset(layerName) ? scoped : false; },
        layer: function(name, data, priority) {
          var current = getLayer(name) || {};
          var next = clone(current);
          if (!base) return addLayer(name, data, priority) ? scoped : false;
          setPath(next, base, data);
          return addLayer(name, next, priority) ? scoped : false;
        },
        getLayer: function(name) {
          var value = getLayer(name);
          return base ? clone(getPath(value || {}, base)) : value;
        },
        getLayers: function() {
          var list = getLayers();
          var i;
          for (i = 0; i < list.length; i++) list[i].data = base ? clone(getPath(list[i].data || {}, base)) : list[i].data;
          return list;
        },
        validate: function() {
          var result = validate();
          if (!base) return result;
          return {
            valid: !result.errors.filter(function(err) { return err.key === base || err.key.indexOf(base + '.') === 0; }).length,
            errors: result.errors.filter(function(err) { return err.key === base || err.key.indexOf(base + '.') === 0; }).map(function(err) {
              return { key: trim(err.key), code: err.code, message: err.message, value: clone(err.value) };
            })
          };
        },
        schema: function(definition) {
          var next = clone(schemaDef);
          var key;
          if (!base) return setSchema(definition) ? scoped : false;
          for (key in definition) if (own(definition, key)) next[join(key)] = clone(definition[key]);
          return setSchema(next) ? scoped : false;
        },
        override: function(overrides, duration) {
          var next = {};
          if (!base) return override(overrides, duration);
          setPath(next, base, overrides || {});
          return override(next, duration);
        },
        scope: function(next) { return scope(join(next)); },
        freeze: function() { freeze(); return scoped; },
        onChange: function(key, cb) {
          return onChange(join(key), function(value, layerName, changedKey) {
            cb(clone(value), layerName, trim(changedKey));
          });
        },
        onAnyChange: function(cb) {
          return onAnyChange(function(key, value, layerName) {
            if (!base || key === base || key.indexOf(base + '.') === 0) cb(trim(key), clone(value), layerName);
          });
        },
        toEnv: function() {
          var flat = {};
          var env = {};
          var value = scoped.getAll();
          var key;
          flattenObject(value, '', flat);
          for (key in flat) if (own(flat, key) && flat[key] !== void 0) env[envName(key)] = Array.isArray(flat[key]) || isPlainObject(flat[key]) ? JSON.stringify(flat[key]) : clone(flat[key]);
          return env;
        },
        fromEnv: function(env) {
          var out = {};
          var key;
          if (!isPlainObject(env)) return false;
          for (key in env) if (own(env, key)) setPath(out, envPath(key), parseEnvValue(envPath(key), env[key]));
          return scoped.merge(out, 'env');
        },
        merge: function(obj, layerName) {
          var next = {};
          if (!base) return merge(obj, layerName) ? scoped : false;
          setPath(next, base, obj || {});
          return merge(next, layerName) ? scoped : false;
        },
        export: exportSnapshot,
        import: importSnapshot
      };
      return scoped;
    }

    ensureLayer('defaults', priorityFor('defaults'));
    ensureLayer('env', priorityFor('env'));
    ensureLayer('file', priorityFor('file'));
    ensureLayer('runtime', priorityFor('runtime'));
    ensureLayer('override', priorityFor('override'));

    if (Array.isArray(options.layers)) {
      options.layers.forEach(function(entry) {
        if (entry && entry.name) applyLayer(entry.name, entry.data, entry.priority);
      });
    }
    syncOverrideLayer();

    api = {
      get: get,
      set: set,
      has: has,
      getAll: getAll,
      delete: remove,
      reset: reset,
      layer: addLayer,
      getLayer: getLayer,
      getLayers: getLayers,
      validate: validate,
      schema: setSchema,
      override: override,
      scope: scope,
      freeze: freeze,
      onChange: onChange,
      onAnyChange: onAnyChange,
      toEnv: toEnv,
      fromEnv: fromEnv,
      merge: merge,
      export: exportSnapshot,
      import: importSnapshot
    };

    return api;
  }

  return {
    create: create,
    priorities: clone(PRIORITIES)
  };
})();
if (typeof module !== 'undefined') module.exports = BareMetal.Config;
