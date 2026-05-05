var window = typeof globalThis !== 'undefined' ? (globalThis.window = globalThis.window || globalThis) : this;
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.Schema = (function () {
  'use strict';

  var customValidators = {};
  var OMIT = { __omit: true };

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function isArray(value) { return Array.isArray(value); }
  function isDate(value) { return value instanceof Date && !isNaN(value.getTime()); }
  function isRegExp(value) { return value instanceof RegExp; }
  function isPlainObject(value) {
    if (!value || typeof value !== 'object' || isArray(value) || isDate(value) || isRegExp(value)) return false;
    var proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }
  function cloneValue(value) {
    var out, key, i;
    if (isDate(value)) return new Date(value.getTime());
    if (isRegExp(value)) return new RegExp(value.source, value.flags);
    if (isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(cloneValue(value[i]));
      return out;
    }
    if (isPlainObject(value)) {
      out = {};
      for (key in value) if (own(value, key)) out[key] = cloneValue(value[key]);
      return out;
    }
    return value;
  }
  function cloneMigrations(list) {
    var out = [], i, item, copy, key;
    for (i = 0; i < (list || []).length; i++) {
      item = list[i] || {};
      copy = {};
      for (key in item) if (own(item, key)) copy[key] = item[key];
      out.push(copy);
    }
    return out;
  }
  function base(type, opts) {
    var out = { type: type };
    var key;
    opts = opts || {};
    for (key in opts) if (own(opts, key)) out[key] = cloneValue(opts[key]);
    return out;
  }
  function isSchema(schema) {
    return !!schema && typeof schema === 'object' && typeof schema.type === 'string';
  }
  function cloneSchema(schema) {
    var out, key, i;
    if (!isSchema(schema)) return schema;
    out = {};
    for (key in schema) {
      if (!own(schema, key) || key === 'shape' || key === 'item' || key === 'schemas' || key === 'schema' || key === 'migrations' || key === 'migrate') continue;
      out[key] = key === 'validateFn' ? schema[key] : cloneValue(schema[key]);
    }
    if (schema.type === 'array') out.item = cloneSchema(schema.item);
    if (schema.type === 'object') {
      out.shape = {};
      for (key in (schema.shape || {})) if (own(schema.shape, key)) out.shape[key] = cloneSchema(schema.shape[key]);
    }
    if (schema.type === 'oneOf') {
      out.schemas = [];
      for (i = 0; i < (schema.schemas || []).length; i++) out.schemas.push(cloneSchema(schema.schemas[i]));
    }
    if (schema.type === 'version') {
      out.schema = cloneSchema(schema.schema);
      out.migrations = cloneMigrations(schema.migrations);
      out.migrate = function (data, fromV, toV) { return migrateVersion(out, data, fromV, toV); };
    }
    return out;
  }
  function indexOf(list, value) {
    var i;
    for (i = 0; i < (list || []).length; i++) if (same(list[i], value)) return i;
    return -1;
  }
  function same(a, b) {
    return a === b || (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b));
  }
  function pathKey(basePath, key) { return basePath ? basePath + '.' + key : key; }
  function pathIndex(basePath, index) { return (basePath || '') + '[' + index + ']'; }
  function addError(state, path, code, message) {
    if (!state.collect) return;
    state.errors.push({ path: path || '', message: message, code: code });
  }
  function typeLabel(schema) {
    if (!schema) return 'value';
    if (schema.type === 'custom') return schema.name || 'custom value';
    if (schema.type === 'oneOf') return 'one of the allowed types';
    if (schema.type === 'version') return typeLabel(schema.schema);
    return schema.type;
  }
  function toNumber(value, strong) {
    var text;
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
      text = value.trim();
      if (text !== '' && isFinite(Number(text))) return Number(text);
    }
    if (strong && typeof value === 'boolean') return value ? 1 : 0;
    return value;
  }
  function toBoolean(value) {
    var text;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === 'string') {
      text = value.trim().toLowerCase();
      if (text === 'true' || text === '1' || text === 'yes' || text === 'y' || text === 'on') return true;
      if (text === 'false' || text === '0' || text === 'no' || text === 'n' || text === 'off') return false;
    }
    return value;
  }
  function toDate(value) {
    var date;
    if (isDate(value)) return new Date(value.getTime());
    if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
      if (isDate(date)) return date;
    }
    return value;
  }
  function cleanPattern(pattern) {
    if (isRegExp(pattern)) return new RegExp(pattern.source, pattern.flags.replace(/g/g, ''));
    if (isPlainObject(pattern) && typeof pattern.source === 'string') return new RegExp(pattern.source, (pattern.flags || '').replace(/g/g, ''));
    if (typeof pattern === 'string') return new RegExp(pattern);
    return null;
  }
  function matchesFormat(raw, format) {
    if (!format || format === 'any') return true;
    if (format === 'iso') return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(raw);
    if (format === 'date') return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw);
    if (format === 'timestamp') return typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw.trim()));
    return true;
  }
  function signature(value) {
    var keys, i, out;
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (isDate(value)) return 'date:' + value.toISOString();
    if (isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(signature(value[i]));
      return 'array:[' + out.join('|') + ']';
    }
    if (isPlainObject(value)) {
      keys = Object.keys(value).sort();
      out = [];
      for (i = 0; i < keys.length; i++) out.push(keys[i] + ':' + signature(value[keys[i]]));
      return 'object:{' + out.join('|') + '}';
    }
    return typeof value + ':' + String(value);
  }
  function mergeDefaults(schema, baseValue) {
    var out, key, childDefault, has = false;
    if (!isSchema(schema)) return undefined;
    if (schema.type === 'version') return mergeDefaults(schema.schema, baseValue);
    if (schema.type === 'oneOf') {
      if (own(schema, 'default')) return cloneValue(schema.default);
      return schema.schemas && schema.schemas.length ? mergeDefaults(schema.schemas[0]) : undefined;
    }
    if (schema.type !== 'object') {
      if (own(schema, 'default')) return cloneValue(schema.default);
      return undefined;
    }
    out = isPlainObject(baseValue) ? cloneValue(baseValue) : {};
    has = isPlainObject(baseValue);
    if (own(schema, 'default')) {
      if (isPlainObject(schema.default)) {
        out = cloneValue(schema.default);
        has = true;
      } else return cloneValue(schema.default);
    }
    for (key in (schema.shape || {})) {
      if (!own(schema.shape, key)) continue;
      childDefault = mergeDefaults(schema.shape[key]);
      if (childDefault !== undefined && !own(out, key)) {
        out[key] = childDefault;
        has = true;
      }
    }
    return has ? out : undefined;
  }
  function runBranch(schema, value, path, hasValue, mode) {
    var state = { mode: mode, errors: [], collect: true };
    var result = walk(schema, value, path, hasValue, state);
    return { value: result, errors: state.errors };
  }
  function walk(schema, value, path, hasValue, state) {
    var current, out, key, i, extra, seen, parsed, raw, validator, verdict, branch, branchMode, minDate, maxDate;

    if (!isSchema(schema)) return value;
    if (schema.type === 'version') return walk(schema.schema, value, path, hasValue, state);

    if (!hasValue || value === undefined) {
      current = mergeDefaults(schema);
      if (current !== undefined) {
        if (state.mode === 'validate' && schema.type !== 'object' && schema.type !== 'array' && schema.type !== 'oneOf') return OMIT;
        value = cloneValue(current);
        hasValue = true;
      } else if (schema.optional) return OMIT;
      else {
        addError(state, path, 'required', 'Value is required.');
        return OMIT;
      }
    }

    if (value === null) {
      if (schema.nullable) return null;
      addError(state, path, 'type', 'Expected ' + typeLabel(schema) + '.');
      return value;
    }

    if (schema.type === 'oneOf') {
      branchMode = state.mode === 'validate' ? 'validate' : state.mode;
      for (i = 0; i < (schema.schemas || []).length; i++) {
        branch = runBranch(schema.schemas[i], value, path, true, branchMode === 'transform' ? 'parse' : branchMode);
        if (!branch.errors.length) return branch.value;
      }
      if (state.mode === 'coerce' || state.mode === 'transform') {
        if (schema.schemas && schema.schemas.length) return walk(schema.schemas[0], value, path, true, { mode: state.mode, errors: [], collect: false });
        return value;
      }
      addError(state, path, 'oneOf', 'Value must match at least one schema.');
      return value;
    }

    if (schema.type === 'string') {
      current = value;
      if (state.mode === 'coerce' && current !== null && current !== undefined && typeof current !== 'string' && (typeof current === 'number' || typeof current === 'boolean')) current = String(current);
      if (typeof current !== 'string') {
        addError(state, path, 'type', 'Expected string.');
        return current;
      }
      if (state.mode !== 'validate') {
        if (schema.trim) current = current.trim();
        if (schema.lowercase) current = current.toLowerCase();
        if (schema.uppercase) current = current.toUpperCase();
      }
      if (schema.min != null && current.length < schema.min) addError(state, path, 'min', 'Must be at least ' + schema.min + ' characters.');
      if (schema.max != null && current.length > schema.max) addError(state, path, 'max', 'Must be at most ' + schema.max + ' characters.');
      if (schema.enum && schema.enum.length && indexOf(schema.enum, current) === -1) addError(state, path, 'enum', 'Must be one of: ' + schema.enum.join(', ') + '.');
      if (schema.pattern != null) {
        parsed = cleanPattern(schema.pattern);
        if (parsed && !parsed.test(current)) addError(state, path, 'pattern', 'Invalid format.');
      }
      return current;
    }

    if (schema.type === 'number') {
      current = state.mode === 'validate' ? value : toNumber(value, state.mode === 'coerce');
      if (typeof current !== 'number' || !isFinite(current)) {
        addError(state, path, 'type', 'Expected number.');
        return current;
      }
      if (schema.integer && current % 1 !== 0) addError(state, path, 'integer', 'Must be an integer.');
      if (schema.positive && current <= 0) addError(state, path, 'positive', 'Must be positive.');
      if (schema.min != null && current < schema.min) addError(state, path, 'min', 'Must be at least ' + schema.min + '.');
      if (schema.max != null && current > schema.max) addError(state, path, 'max', 'Must be at most ' + schema.max + '.');
      return current;
    }

    if (schema.type === 'boolean') {
      current = (state.mode === 'coerce' || (state.mode !== 'validate' && schema.coerce)) ? toBoolean(value) : value;
      if (typeof current !== 'boolean') {
        addError(state, path, 'type', 'Expected boolean.');
        return current;
      }
      return current;
    }

    if (schema.type === 'date') {
      raw = value;
      current = state.mode === 'validate' ? value : toDate(value);
      parsed = state.mode === 'validate' ? toDate(value) : current;
      if (!isDate(parsed)) {
        addError(state, path, 'type', 'Expected date.');
        return current;
      }
      if (!matchesFormat(raw, schema.format) && typeof raw !== 'object') addError(state, path, 'format', 'Date must match format ' + schema.format + '.');
      minDate = schema.min != null ? toDate(schema.min) : null;
      maxDate = schema.max != null ? toDate(schema.max) : null;
      if (isDate(minDate) && parsed.getTime() < minDate.getTime()) addError(state, path, 'min', 'Date must be on or after ' + minDate.toISOString() + '.');
      if (isDate(maxDate) && parsed.getTime() > maxDate.getTime()) addError(state, path, 'max', 'Date must be on or before ' + maxDate.toISOString() + '.');
      return state.mode === 'validate' ? value : parsed;
    }

    if (schema.type === 'array') {
      current = value;
      if (!isArray(current)) {
        if (state.mode === 'coerce' && current !== undefined && current !== null) current = [current];
        else {
          addError(state, path, 'type', 'Expected array.');
          return current;
        }
      }
      out = [];
      if (schema.min != null && current.length < schema.min) addError(state, path, 'min', 'Must contain at least ' + schema.min + ' items.');
      if (schema.max != null && current.length > schema.max) addError(state, path, 'max', 'Must contain at most ' + schema.max + ' items.');
      for (i = 0; i < current.length; i++) {
        out.push(walk(schema.item, current[i], pathIndex(path, i), true, state));
      }
      if (schema.unique) {
        seen = {};
        for (i = 0; i < out.length; i++) {
          extra = signature(out[i]);
          if (own(seen, extra)) addError(state, pathIndex(path, i), 'unique', 'Array items must be unique.');
          else seen[extra] = 1;
        }
      }
      return out;
    }

    if (schema.type === 'object') {
      current = value;
      if (!isPlainObject(current)) {
        addError(state, path, 'type', 'Expected object.');
        return current;
      }
      out = state.mode !== 'validate' && isPlainObject(schema.default) ? cloneValue(schema.default) : {};
      if (!schema.strict) for (key in current) if (own(current, key)) out[key] = current[key];
      for (key in (schema.shape || {})) {
        if (!own(schema.shape, key)) continue;
        extra = walk(schema.shape[key], own(current, key) ? current[key] : undefined, pathKey(path, key), own(current, key), state);
        if (extra !== OMIT) out[key] = extra;
      }
      if (schema.strict) {
        for (key in current) if (own(current, key) && !own(schema.shape || {}, key)) addError(state, pathKey(path, key), 'strict', 'Unexpected field.');
      }
      return out;
    }

    if (schema.type === 'custom') {
      validator = typeof schema.validateFn === 'function' ? schema.validateFn : customValidators[schema.name];
      if (typeof validator !== 'function') validator = function () { return 'Unknown custom validator: ' + schema.name + '.'; };
      try { verdict = validator(value, schema); }
      catch (err) { verdict = err && err.message ? err.message : 'Custom validation failed.'; }
      if (verdict !== true && verdict !== undefined && verdict !== null) addError(state, path, 'custom', typeof verdict === 'string' ? verdict : 'Custom validation failed.');
      return value;
    }

    return value;
  }

  function execute(schema, data, mode) {
    var state = { mode: mode, errors: [], collect: mode === 'parse' || mode === 'validate' };
    var value = walk(schema, data, '', data !== undefined, state);
    return { value: value === OMIT ? undefined : value, errors: state.errors };
  }

  function string(opts) { return base('string', opts); }
  function number(opts) { return base('number', opts); }
  function boolean(opts) { return base('boolean', opts); }
  function array(itemSchema, opts) {
    var out = base('array', opts);
    out.item = cloneSchema(itemSchema);
    return out;
  }
  function object(shape, opts) {
    var out = base('object', opts);
    var key;
    out.shape = {};
    for (key in (shape || {})) if (own(shape, key)) out.shape[key] = cloneSchema(shape[key]);
    return out;
  }
  function date(opts) { return base('date', opts); }
  function oneOf(schemas) {
    var out = { type: 'oneOf', schemas: [] };
    var i;
    for (i = 0; i < (schemas || []).length; i++) out.schemas.push(cloneSchema(schemas[i]));
    return out;
  }
  function nullable(schema) {
    var out = cloneSchema(schema);
    out.nullable = true;
    return out;
  }
  function optional(schema) {
    var out = cloneSchema(schema);
    out.optional = true;
    return out;
  }
  function custom(name, validateFn, opts) {
    var out = base('custom', opts);
    out.name = name;
    out.validateFn = typeof validateFn === 'function' ? validateFn : customValidators[name];
    if (typeof validateFn === 'function') customValidators[name] = validateFn;
    return out;
  }
  function parse(schema, data) {
    var result = execute(schema, data, 'parse');
    return result.errors.length ? { ok: false, errors: result.errors } : { ok: true, value: result.value };
  }
  function validate(schema, data) {
    var result = execute(schema, data, 'validate');
    return { valid: !result.errors.length, errors: result.errors };
  }
  function transform(schema, data) {
    return execute(schema, data, 'transform').value;
  }
  function coerce(schema, data) {
    return execute(schema, data, 'coerce').value;
  }
  function defaults(schema) {
    return mergeDefaults(schema);
  }
  function unwrapObjectSchema(schema) {
    return schema && schema.type === 'version' ? schema.schema : schema;
  }
  function extend(baseSchema, overrides) {
    var source = unwrapObjectSchema(baseSchema);
    var out = cloneSchema(source);
    var key;
    if (!out || out.type !== 'object') return object(overrides || {});
    for (key in (overrides || {})) if (own(overrides, key)) out.shape[key] = cloneSchema(overrides[key]);
    return out;
  }
  function pick(schema, keys) {
    var source = unwrapObjectSchema(schema);
    var out, i, key;
    if (!source || source.type !== 'object') return cloneSchema(source);
    out = cloneSchema(source);
    out.shape = {};
    for (i = 0; i < (keys || []).length; i++) {
      key = keys[i];
      if (own(source.shape, key)) out.shape[key] = cloneSchema(source.shape[key]);
    }
    return out;
  }
  function omit(schema, keys) {
    var blocked = {};
    var source = unwrapObjectSchema(schema);
    var out, key, i;
    if (!source || source.type !== 'object') return cloneSchema(source);
    for (i = 0; i < (keys || []).length; i++) blocked[keys[i]] = 1;
    out = cloneSchema(source);
    out.shape = {};
    for (key in source.shape) if (own(source.shape, key) && !blocked[key]) out.shape[key] = cloneSchema(source.shape[key]);
    return out;
  }
  function partial(schema) {
    var source = unwrapObjectSchema(schema);
    var out = cloneSchema(source);
    var key;
    if (!out || out.type !== 'object') return cloneSchema(source);
    for (key in out.shape) if (own(out.shape, key)) out.shape[key] = optional(out.shape[key]);
    return out;
  }
  function findMigration(node, version, direction) {
    var i, step;
    for (i = 0; i < (node.migrations || []).length; i++) {
      step = node.migrations[i];
      if (direction === 'up' && step.from === version) return step;
      if (direction === 'down' && step.to === version) return step;
    }
    return null;
  }
  function migrateVersion(node, data, fromV, toV) {
    var current = cloneValue(data);
    var now = fromV;
    var direction = fromV <= toV ? 'up' : 'down';
    var step;
    var guard = 0;
    if (fromV === toV) return current;
    while (now !== toV) {
      guard += 1;
      if (guard > (node.migrations || []).length + 5) throw new Error('Migration path not found.');
      step = findMigration(node, now, direction);
      if (!step) throw new Error('Migration path not found.');
      if (direction === 'up') {
        if (typeof step.up !== 'function') throw new Error('Missing up migration from ' + step.from + ' to ' + step.to + '.');
        current = step.up(cloneValue(current));
        now = step.to;
      } else {
        if (typeof step.down !== 'function') throw new Error('Missing down migration from ' + step.from + ' to ' + step.to + '.');
        current = step.down(cloneValue(current));
        now = step.from;
      }
    }
    return current;
  }
  function version(schema, v, migrations) {
    var out = { type: 'version', schema: cloneSchema(schema), version: v, migrations: cloneMigrations(migrations) };
    out.migrate = function (data, fromV, toV) { return migrateVersion(out, data, fromV, toV); };
    return out;
  }
  function encodeValue(value) {
    var out, key, i;
    if (isDate(value)) return { __type: 'date', value: value.toISOString() };
    if (isRegExp(value)) return { __type: 'regexp', source: value.source, flags: value.flags };
    if (isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(encodeValue(value[i]));
      return out;
    }
    if (isPlainObject(value)) {
      out = {};
      for (key in value) if (own(value, key)) out[key] = encodeValue(value[key]);
      return out;
    }
    return value;
  }
  function decodeValue(value) {
    var out, key, i;
    if (isPlainObject(value) && value.__type === 'date') return new Date(value.value);
    if (isPlainObject(value) && value.__type === 'regexp') return new RegExp(value.source, value.flags || '');
    if (isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(decodeValue(value[i]));
      return out;
    }
    if (isPlainObject(value)) {
      out = {};
      for (key in value) if (own(value, key)) out[key] = decodeValue(value[key]);
      return out;
    }
    return value;
  }
  function copyDescriptorOptions(schema, descriptor, skip) {
    var key;
    for (key in schema) {
      if (!own(schema, key) || key === 'type' || skip[key] || key === 'validateFn' || key === 'migrate') continue;
      descriptor[key] = encodeValue(schema[key]);
    }
    if (schema.nullable) descriptor.nullable = true;
    if (schema.optional) descriptor.optional = true;
    return descriptor;
  }
  function toJSON(schema) {
    var descriptor, key, i;
    if (!isSchema(schema)) return null;
    if (schema.type === 'array') {
      descriptor = copyDescriptorOptions(schema, { type: 'array', item: toJSON(schema.item) }, { item: 1, nullable: 1, optional: 1 });
      return descriptor;
    }
    if (schema.type === 'object') {
      descriptor = copyDescriptorOptions(schema, { type: 'object', shape: {} }, { shape: 1, nullable: 1, optional: 1 });
      for (key in schema.shape) if (own(schema.shape, key)) descriptor.shape[key] = toJSON(schema.shape[key]);
      return descriptor;
    }
    if (schema.type === 'oneOf') {
      descriptor = copyDescriptorOptions(schema, { type: 'oneOf', schemas: [] }, { schemas: 1, nullable: 1, optional: 1 });
      for (i = 0; i < (schema.schemas || []).length; i++) descriptor.schemas.push(toJSON(schema.schemas[i]));
      return descriptor;
    }
    if (schema.type === 'version') {
      descriptor = copyDescriptorOptions(schema, { type: 'version', schema: toJSON(schema.schema), migrations: [] }, { schema: 1, migrations: 1, nullable: 1, optional: 1 });
      for (i = 0; i < (schema.migrations || []).length; i++) descriptor.migrations.push({ from: schema.migrations[i].from, to: schema.migrations[i].to });
      return descriptor;
    }
    return copyDescriptorOptions(schema, { type: schema.type }, { nullable: 1, optional: 1 });
  }
  function fromJSON(descriptor) {
    var schema, opts, key, i, validator;
    if (!descriptor || typeof descriptor !== 'object' || typeof descriptor.type !== 'string') return null;
    opts = {};
    for (key in descriptor) {
      if (!own(descriptor, key) || key === 'type' || key === 'shape' || key === 'item' || key === 'schemas' || key === 'schema' || key === 'migrations') continue;
      opts[key] = decodeValue(descriptor[key]);
    }
    if (descriptor.type === 'string') schema = string(opts);
    else if (descriptor.type === 'number') schema = number(opts);
    else if (descriptor.type === 'boolean') schema = boolean(opts);
    else if (descriptor.type === 'date') schema = date(opts);
    else if (descriptor.type === 'array') schema = array(fromJSON(descriptor.item), opts);
    else if (descriptor.type === 'object') {
      schema = object({}, opts);
      for (key in (descriptor.shape || {})) if (own(descriptor.shape, key)) schema.shape[key] = fromJSON(descriptor.shape[key]);
    } else if (descriptor.type === 'oneOf') {
      schema = oneOf([]);
      schema.schemas = [];
      for (i = 0; i < (descriptor.schemas || []).length; i++) schema.schemas.push(fromJSON(descriptor.schemas[i]));
      for (key in opts) if (own(opts, key)) schema[key] = opts[key];
    } else if (descriptor.type === 'custom') {
      validator = customValidators[opts.name];
      schema = custom(opts.name, validator, opts);
    } else if (descriptor.type === 'version') {
      schema = version(fromJSON(descriptor.schema), opts.version, descriptor.migrations || []);
      for (key in opts) if (own(opts, key) && key !== 'version') schema[key] = opts[key];
    } else schema = base(descriptor.type, opts);
    if (descriptor.nullable) schema.nullable = true;
    if (descriptor.optional) schema.optional = true;
    return schema;
  }

  // Binary alignment — bridge to BareMetal.Binary schema format
  // wireType map: schema type+opts → Binary wireType
  var _wireTypes = {
    'string': 'String', 'boolean': 'Bool', 'date': 'DateTime'
  };
  var _numWire = {
    'int8': 'SByte', 'uint8': 'Byte', 'int16': 'Int16', 'uint16': 'UInt16',
    'int32': 'Int32', 'uint32': 'UInt32', 'int64': 'Int64', 'uint64': 'UInt64',
    'float32': 'Float32', 'float64': 'Float64', 'decimal': 'Decimal'
  };
  function resolveWireType(node) {
    if (node.wireType) return node.wireType; // explicit override
    if (node.type === 'number') return _numWire[node.wire || node.encoding || 'float64'] || 'Float64';
    if (node.type === 'string' && node.format === 'guid') return 'Guid';
    if (node.type === 'string' && node.format === 'identifier') return 'Identifier';
    if (node.type === 'date' && node.format === 'dateonly') return 'DateOnly';
    if (node.type === 'date' && node.format === 'timeonly') return 'TimeOnly';
    if (node.type === 'date' && node.format === 'offset') return 'DateTimeOffset';
    return _wireTypes[node.type] || 'String';
  }
  function toBinary(schema, opts) {
    // Convert an object schema to BareMetal.Binary format: {members:[{name,wireType,isNullable,enumUnderlying}], version}
    if (!schema || schema.type !== 'object' || !schema.shape) throw new Error('toBinary requires an object schema');
    opts = opts || {};
    var members = [], key, node, member;
    for (key in schema.shape) {
      if (!own(schema.shape, key)) continue;
      node = schema.shape[key];
      member = { name: key, wireType: resolveWireType(node), isNullable: !!(node.nullable || node.optional) };
      if (node.enumUnderlying) { member.wireType = 'Enum'; member.enumUnderlying = node.enumUnderlying; }
      if (node.enumValues) member.enumValues = node.enumValues;
      if (node.ordinal !== undefined) member.ordinal = node.ordinal;
      members.push(member);
    }
    // Sort by ordinal if present
    if (members.length && members[0].ordinal !== undefined) members.sort(function(a,b){return (a.ordinal||0)-(b.ordinal||0);});
    return { members: members, version: opts.version || schema.version || 1, schemaHash: opts.schemaHash || 0 };
  }
  function fromBinary(binarySchema) {
    // Convert BareMetal.Binary schema {members:[...]} back to a Schema object() definition
    var shape = {}, i, m, node, wireToType;
    wireToType = {
      'Bool': function(){return {type:'boolean'};},
      'Byte': function(){return {type:'number',wire:'uint8'};},
      'SByte': function(){return {type:'number',wire:'int8'};},
      'Int16': function(){return {type:'number',wire:'int16'};},
      'UInt16': function(){return {type:'number',wire:'uint16'};},
      'Int32': function(){return {type:'number',wire:'int32'};},
      'UInt32': function(){return {type:'number',wire:'uint32'};},
      'Int64': function(){return {type:'number',wire:'int64'};},
      'UInt64': function(){return {type:'number',wire:'uint64'};},
      'Float32': function(){return {type:'number',wire:'float32'};},
      'Float64': function(){return {type:'number',wire:'float64'};},
      'Decimal': function(){return {type:'number',wire:'decimal'};},
      'String': function(){return {type:'string'};},
      'Char': function(){return {type:'string',max:1};},
      'Guid': function(){return {type:'string',format:'guid'};},
      'Identifier': function(){return {type:'string',format:'identifier'};},
      'DateTime': function(){return {type:'date'};},
      'DateOnly': function(){return {type:'date',format:'dateonly'};},
      'TimeOnly': function(){return {type:'date',format:'timeonly'};},
      'DateTimeOffset': function(){return {type:'date',format:'offset'};},
      'TimeSpan': function(){return {type:'number',wire:'int64'};},
      'Enum': function(mem){return {type:'number',wire:mem.enumUnderlying||'int32',enumUnderlying:mem.enumUnderlying||'Int32',enumValues:mem.enumValues};}
    };
    for (i = 0; i < (binarySchema.members || []).length; i++) {
      m = binarySchema.members[i];
      node = (wireToType[m.wireType] || wireToType['String'])(m);
      if (m.isNullable) node.nullable = true;
      if (m.ordinal !== undefined) node.ordinal = m.ordinal;
      node.wireType = m.wireType;
      shape[m.name] = node;
    }
    return object(shape);
  }

  return {
    string: string,
    number: number,
    boolean: boolean,
    array: array,
    object: object,
    date: date,
    oneOf: oneOf,
    nullable: nullable,
    optional: optional,
    parse: parse,
    validate: validate,
    transform: transform,
    coerce: coerce,
    defaults: defaults,
    extend: extend,
    pick: pick,
    omit: omit,
    partial: partial,
    version: version,
    toJSON: toJSON,
    fromJSON: fromJSON,
    custom: custom,
    toBinary: toBinary,
    fromBinary: fromBinary
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Schema;
else if (typeof exports !== 'undefined') exports.Schema = BareMetal.Schema;
