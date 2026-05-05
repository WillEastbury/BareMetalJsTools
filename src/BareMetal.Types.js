var root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
root.BareMetal = root.BareMetal || {};
var BareMetal = root.BareMetal;

BareMetal.Types = (function () {
  'use strict';

  var definitions = {};
  var order = [];
  var builtins = {
    any: 1,
    string: 1,
    number: 1,
    boolean: 1,
    array: 1,
    object: 1,
    date: 1,
    function: 1,
    undefined: 1,
    null: 1,
    regexp: 1,
    symbol: 1,
    bigint: 1,
    map: 1,
    set: 1,
    promise: 1
  };

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function slice(args) { return Array.prototype.slice.call(args); }
  function indexOf(list, value) { return list.indexOf(value); }
  function isArray(value) { return Array.isArray(value); }
  function isDate(value) { return value instanceof Date && !isNaN(value.getTime()); }
  function isRegExp(value) { return value instanceof RegExp; }
  function isMap(value) { return typeof Map !== 'undefined' && value instanceof Map; }
  function isSet(value) { return typeof Set !== 'undefined' && value instanceof Set; }
  function isPromise(value) { return !!value && typeof value.then === 'function'; }
  function isPlainObject(value) {
    if (!value || typeof value !== 'object' || isArray(value) || isDate(value) || isRegExp(value) || isMap(value) || isSet(value)) return false;
    var proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }
  function addName(name) { if (indexOf(order, name) === -1) order.push(name); }
  function removeName(name) {
    var i = indexOf(order, name);
    if (i > -1) order.splice(i, 1);
  }
  function error(path, expected, actual, message) {
    return {
      path: path || '',
      expected: expected,
      actual: actual,
      message: message || ('Expected ' + expected + ' but got ' + actual + '.')
    };
  }
  function pushError(errors, path, expected, actual, message) {
    errors.push(error(path, expected, actual, message));
  }
  function baseOf(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (isDate(value)) return 'date';
    if (isRegExp(value)) return 'regexp';
    if (isMap(value)) return 'map';
    if (isSet(value)) return 'set';
    if (isPromise(value)) return 'promise';
    if (isArray(value)) return 'array';
    return typeof value;
  }
  function typeLabel(type) {
    var resolved = resolve(type);
    var parts = [];
    var i;
    if (!resolved) return 'unknown';
    if (resolved.kind === 'primitive' || resolved.kind === 'named') return resolved.name;
    if (resolved.kind === 'union') {
      for (i = 0; i < resolved.types.length; i++) parts.push(typeLabel(resolved.types[i]));
      return parts.join(' | ');
    }
    if (resolved.kind === 'intersection') {
      for (i = 0; i < resolved.types.length; i++) parts.push(typeLabel(resolved.types[i]));
      return parts.join(' & ');
    }
    if (resolved.kind === 'literal') return JSON.stringify(resolved.value);
    if (resolved.kind === 'tuple') {
      for (i = 0; i < resolved.types.length; i++) parts.push(typeLabel(resolved.types[i]));
      return '[' + parts.join(', ') + ']';
    }
    if (resolved.kind === 'record') return 'record<' + typeLabel(resolved.keyType) + ', ' + typeLabel(resolved.valueType) + '>';
    if (resolved.kind === 'nullable') return typeLabel(resolved.type) + ' | null';
    if (resolved.kind === 'optional') return typeLabel(resolved.type) + ' | undefined';
    return resolved.name || resolved.kind || 'unknown';
  }
  function normalizeField(field) {
    var out = {};
    var key;
    if (typeof field === 'string') out.type = field;
    else if (field && typeof field === 'object') for (key in field) if (own(field, key)) out[key] = field[key];
    else out.type = 'any';
    if (!own(out, 'type')) out.type = 'any';
    out.required = !!out.required;
    return out;
  }
  function normalizeDefinition(name, descriptor) {
    var fields = {};
    var methods = descriptor && descriptor.methods;
    var key;
    descriptor = descriptor || {};
    for (key in (descriptor.fields || {})) if (own(descriptor.fields, key)) fields[key] = normalizeField(descriptor.fields[key]);
    return {
      kind: 'named',
      name: name,
      fields: fields,
      validate: typeof descriptor.validate === 'function' ? descriptor.validate : null,
      serialize: typeof descriptor.serialize === 'function' ? descriptor.serialize : null,
      deserialize: typeof descriptor.deserialize === 'function' ? descriptor.deserialize : null,
      methods: methods || null,
      ancestors: descriptor.ancestors ? (isArray(descriptor.ancestors) ? descriptor.ancestors.slice() : [descriptor.ancestors]) : descriptor.extends ? (isArray(descriptor.extends) ? descriptor.extends.slice() : [descriptor.extends]) : [],
      serializable: descriptor.serializable !== false
    };
  }
  function primitive(name, checkFn, castFn, serializable) {
    return {
      kind: 'primitive',
      name: name,
      check: checkFn,
      cast: castFn,
      fields: {},
      ancestors: [],
      serializable: serializable !== false
    };
  }
  function definePrimitive(name, checkFn, castFn, serializable) {
    definitions[name] = primitive(name, checkFn, castFn, serializable);
    addName(name);
  }
  function resolve(type) {
    if (type === undefined || type === null) return definitions.any;
    if (isArray(type)) return tuple.apply(null, type);
    if (typeof type === 'string') return definitions[type] || null;
    if (type && (type.kind || type.name)) {
      if (type.kind === 'named' || type.kind === 'primitive' || type.kind === 'union' || type.kind === 'intersection' || type.kind === 'literal' || type.kind === 'tuple' || type.kind === 'record' || type.kind === 'nullable' || type.kind === 'optional') return type;
      if (type.name && own(definitions, type.name)) return definitions[type.name];
    }
    if (type && typeof type === 'object' && (type.fields || type.validate || type.serialize || type.deserialize)) return normalizeDefinition(type.name || 'anonymous', type);
    return null;
  }
  function same(a, b) {
    if (a === b) return true;
    return typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b);
  }
  function collectValidateResult(result, path, typeName, errors) {
    var i;
    if (result === undefined || result === null || result === true) return;
    if (result === false) {
      pushError(errors, path, typeName, null, 'Custom validation failed.');
      return;
    }
    if (typeof result === 'string') {
      pushError(errors, path, typeName, null, result);
      return;
    }
    if (isArray(result)) {
      for (i = 0; i < result.length; i++) collectValidateResult(result[i], path, typeName, errors);
      return;
    }
    if (typeof result === 'object') {
      if (result.ok === false && isArray(result.errors)) {
        for (i = 0; i < result.errors.length; i++) collectValidateResult(result.errors[i], path, typeName, errors);
        return;
      }
      errors.push({
        path: own(result, 'path') ? result.path : (path || ''),
        expected: own(result, 'expected') ? result.expected : typeName,
        actual: own(result, 'actual') ? result.actual : null,
        message: result.message || 'Custom validation failed.'
      });
    }
  }
  function checkValue(value, type, path, errors) {
    var resolved = resolve(type);
    var start = errors.length;
    var keys, key, i, field, current, candidate, branchErrors, passed, validateResult;

    if (!resolved) {
      pushError(errors, path, typeLabel(type), baseOf(value), 'Unknown type: ' + type + '.');
      return false;
    }

    if (resolved.kind === 'primitive') {
      if (!resolved.check(value)) pushError(errors, path, resolved.name, baseOf(value));
      return errors.length === start;
    }

    if (resolved.kind === 'named') {
      if (!isPlainObject(value)) {
        pushError(errors, path, resolved.name, baseOf(value));
        return false;
      }
      for (key in resolved.fields) {
        if (!own(resolved.fields, key)) continue;
        field = resolved.fields[key];
        current = value[key];
        if (current === undefined) {
          if (field.required) pushError(errors, path ? path + '.' + key : key, typeLabel(field.type), 'undefined', 'Missing required field.');
          continue;
        }
        checkValue(current, field.type, path ? path + '.' + key : key, errors);
      }
      if (resolved.validate) {
        try { validateResult = resolved.validate(value, resolved); }
        catch (err) { validateResult = err && err.message ? err.message : 'Custom validation failed.'; }
        collectValidateResult(validateResult, path, resolved.name, errors);
      }
      return errors.length === start;
    }

    if (resolved.kind === 'union') {
      passed = false;
      for (i = 0; i < resolved.types.length; i++) {
        branchErrors = [];
        if (checkValue(value, resolved.types[i], path, branchErrors)) {
          passed = true;
          break;
        }
      }
      if (!passed) pushError(errors, path, typeLabel(resolved), baseOf(value), 'Value must match at least one union member.');
      return passed;
    }

    if (resolved.kind === 'intersection') {
      for (i = 0; i < resolved.types.length; i++) checkValue(value, resolved.types[i], path, errors);
      return errors.length === start;
    }

    if (resolved.kind === 'literal') {
      if (!same(value, resolved.value)) pushError(errors, path, typeLabel(resolved), baseOf(value), 'Expected literal ' + JSON.stringify(resolved.value) + '.');
      return errors.length === start;
    }

    if (resolved.kind === 'tuple') {
      if (!isArray(value)) {
        pushError(errors, path, 'array', baseOf(value));
        return false;
      }
      if (value.length !== resolved.types.length) pushError(errors, path, typeLabel(resolved), 'array', 'Expected tuple of length ' + resolved.types.length + '.');
      for (i = 0; i < resolved.types.length; i++) checkValue(value[i], resolved.types[i], (path || 'value') + '[' + i + ']', errors);
      return errors.length === start;
    }

    if (resolved.kind === 'record') {
      if (!isPlainObject(value)) {
        pushError(errors, path, 'object', baseOf(value));
        return false;
      }
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        try { cast(key, resolved.keyType); }
        catch (_) { pushError(errors, path ? path + '.' + key : key, typeLabel(resolved.keyType), 'string', 'Invalid record key.'); }
        checkValue(value[key], resolved.valueType, path ? path + '.' + key : key, errors);
      }
      return errors.length === start;
    }

    if (resolved.kind === 'nullable') {
      if (value === null) return true;
      return checkValue(value, resolved.type, path, errors);
    }

    if (resolved.kind === 'optional') {
      if (value === undefined) return true;
      return checkValue(value, resolved.type, path, errors);
    }

    return false;
  }
  function check(value, type) {
    var errors = [];
    return { ok: checkValue(value, type, '', errors), errors: errors };
  }
  function is(value, type) { return check(value, type).ok; }
  function assert(value, type) {
    var result = check(value, type);
    var err;
    if (result.ok) return value;
    err = new TypeError(result.errors.map(function (item) { return (item.path ? item.path + ': ' : '') + item.message; }).join(' '));
    err.errors = result.errors;
    throw err;
  }
  function defaultValue(field) {
    if (!field || !own(field, 'default')) return undefined;
    return typeof field.default === 'function' ? field.default() : clone(field.default);
  }
  function cast(value, type) {
    var resolved = resolve(type);
    var out, keys, key, i, field, result;

    if (!resolved) throw new TypeError('Unknown type: ' + type + '.');

    if (resolved.kind === 'primitive') return resolved.cast(value);

    if (resolved.kind === 'named') {
      if (!isPlainObject(value)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to ' + resolved.name + '.');
      out = {};
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) out[keys[i]] = clone(value[keys[i]]);
      for (key in resolved.fields) {
        if (!own(resolved.fields, key)) continue;
        field = resolved.fields[key];
        if (value[key] === undefined) {
          if (own(field, 'default')) out[key] = defaultValue(field);
          else if (field.required) throw new TypeError('Missing required field: ' + key + '.');
        } else {
          out[key] = cast(value[key], field.type);
        }
      }
      assert(out, resolved);
      return out;
    }

    if (resolved.kind === 'union') {
      for (i = 0; i < resolved.types.length; i++) {
        try { return cast(value, resolved.types[i]); }
        catch (_) {}
      }
      throw new TypeError('Value does not match union type.');
    }

    if (resolved.kind === 'intersection') {
      result = value;
      for (i = 0; i < resolved.types.length; i++) result = cast(result, resolved.types[i]);
      return result;
    }

    if (resolved.kind === 'literal') {
      if (!same(value, resolved.value)) throw new TypeError('Expected literal ' + JSON.stringify(resolved.value) + '.');
      return value;
    }

    if (resolved.kind === 'tuple') {
      if (!isArray(value) || value.length !== resolved.types.length) throw new TypeError('Expected tuple of length ' + resolved.types.length + '.');
      out = [];
      for (i = 0; i < resolved.types.length; i++) out.push(cast(value[i], resolved.types[i]));
      return out;
    }

    if (resolved.kind === 'record') {
      if (!isPlainObject(value)) throw new TypeError('Expected object for record.');
      out = {};
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) {
        key = String(cast(keys[i], resolved.keyType));
        out[key] = cast(value[keys[i]], resolved.valueType);
      }
      return out;
    }

    if (resolved.kind === 'nullable') {
      if (value === null) return null;
      return cast(value, resolved.type);
    }

    if (resolved.kind === 'optional') {
      if (value === undefined) return undefined;
      return cast(value, resolved.type);
    }

    throw new TypeError('Unsupported type cast.');
  }
  function inferType(value) {
    var i, name;
    for (i = 0; i < order.length; i++) {
      name = order[i];
      if (builtins[name]) continue;
      if (is(value, name)) return name;
    }
    return baseOf(value);
  }
  function of(value) { return inferType(value); }
  function registryRegister(name, descriptor) { return define(name, descriptor); }
  function registryGet(name) { return own(definitions, name) ? definitions[name] : null; }
  function registryHas(name) { return own(definitions, name); }
  function registryList() { return order.slice(); }
  function registryRemove(name) {
    if (!own(definitions, name) || builtins[name]) return false;
    delete definitions[name];
    removeName(name);
    return true;
  }
  function define(name, descriptor) {
    if (typeof name !== 'string' || !name) throw new TypeError('Type name is required.');
    if (builtins[name]) throw new Error('Cannot redefine builtin type: ' + name + '.');
    definitions[name] = normalizeDefinition(name, descriptor);
    addName(name);
    return definitions[name];
  }
  function contract(input, output) {
    var inputType = isArray(input) ? tuple.apply(null, input) : input;
    return function (fn) {
      if (typeof fn !== 'function') throw new TypeError('Contract target must be a function.');
      return function () {
        var args = slice(arguments);
        var result;
        if (inputType && resolve(inputType) && resolve(inputType).kind === 'tuple') assert(args, inputType);
        else if (inputType !== undefined) assert(args[0], inputType);
        result = fn.apply(this, args);
        if (isPromise(result)) {
          return Promise.resolve(result).then(function (value) {
            if (output !== undefined) assert(value, output);
            return value;
          });
        }
        if (output !== undefined) assert(result, output);
        return result;
      };
    };
  }
  function guard(type) {
    return function (value) { return is(value, type); };
  }
  function union() { return { kind: 'union', types: slice(arguments) }; }
  function intersection() { return { kind: 'intersection', types: slice(arguments) }; }
  function literal(value) { return { kind: 'literal', value: value }; }
  function tuple() { return { kind: 'tuple', types: slice(arguments) }; }
  function record(keyType, valueType) { return { kind: 'record', keyType: keyType, valueType: valueType }; }
  function nullable(type) { return { kind: 'nullable', type: type }; }
  function optional(type) { return { kind: 'optional', type: type }; }
  function reflect(typeName) {
    var resolved = resolve(typeName);
    if (!resolved) return null;
    return {
      name: resolved.name || typeLabel(resolved),
      fields: resolved.fields || {},
      methods: resolved.methods ? (isArray(resolved.methods) ? resolved.methods.slice() : Object.keys(resolved.methods)) : [],
      ancestors: resolved.ancestors ? resolved.ancestors.slice() : [],
      serializable: resolved.serializable !== false
    };
  }
  function serialize(value, type) {
    var resolved = type !== undefined ? resolve(type) : resolve(of(value));
    var out, keys, key, i, match;
    if (value === null || value === undefined) return value;
    if (!resolved) return clone(value);
    if (resolved.kind === 'named' && resolved.serialize) return resolved.serialize(value, api);
    if (resolved.kind === 'primitive') {
      if (resolved.name === 'date') return value.toISOString();
      if (resolved.name === 'regexp') return { source: value.source, flags: value.flags };
      if (resolved.name === 'map') {
        out = [];
        value.forEach(function (mapValue, mapKey) { out.push([serialize(mapKey), serialize(mapValue)]); });
        return out;
      }
      if (resolved.name === 'set') {
        out = [];
        value.forEach(function (item) { out.push(serialize(item)); });
        return out;
      }
      if (resolved.name === 'array') return value.map(function (item) { return serialize(item); });
      if (resolved.name === 'object') {
        out = {};
        keys = Object.keys(value);
        for (i = 0; i < keys.length; i++) out[keys[i]] = serialize(value[keys[i]]);
        return out;
      }
      if (resolved.name === 'function') throw new TypeError('Cannot serialize function values.');
      return value;
    }
    if (resolved.kind === 'named') {
      out = {};
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        out[key] = own(resolved.fields, key) ? serialize(value[key], resolved.fields[key].type) : serialize(value[key]);
      }
      return out;
    }
    if (resolved.kind === 'tuple') {
      out = [];
      for (i = 0; i < resolved.types.length; i++) out.push(serialize(value[i], resolved.types[i]));
      return out;
    }
    if (resolved.kind === 'record') {
      out = {};
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) out[keys[i]] = serialize(value[keys[i]], resolved.valueType);
      return out;
    }
    if (resolved.kind === 'nullable' || resolved.kind === 'optional') return value === null || value === undefined ? value : serialize(value, resolved.type);
    if (resolved.kind === 'union') {
      for (i = 0; i < resolved.types.length; i++) if (is(value, resolved.types[i])) return serialize(value, resolved.types[i]);
      throw new TypeError('Value does not match union type.');
    }
    if (resolved.kind === 'intersection') {
      match = value;
      for (i = 0; i < resolved.types.length; i++) match = serialize(match, resolved.types[i]);
      return match;
    }
    return clone(value);
  }
  function deserialize(data, type) {
    var resolved = resolve(type);
    var out, keys, key, i, result;
    if (data === null || data === undefined) return data;
    if (!resolved) return clone(data);
    if (resolved.kind === 'named' && resolved.deserialize) return resolved.deserialize(data, api);
    if (resolved.kind === 'primitive') {
      if (resolved.name === 'date') {
        result = new Date(data);
        if (!isDate(result)) throw new TypeError('Invalid date value.');
        return result;
      }
      if (resolved.name === 'regexp') return new RegExp(data.source, data.flags || '');
      if (resolved.name === 'map') {
        result = new Map();
        for (i = 0; i < data.length; i++) result.set(deserialize(data[i][0]), deserialize(data[i][1]));
        return result;
      }
      if (resolved.name === 'set') {
        result = new Set();
        for (i = 0; i < data.length; i++) result.add(deserialize(data[i]));
        return result;
      }
      if (resolved.name === 'array') return data.map(function (item) { return deserialize(item); });
      if (resolved.name === 'object') {
        out = {};
        keys = Object.keys(data);
        for (i = 0; i < keys.length; i++) out[keys[i]] = deserialize(data[keys[i]]);
        return out;
      }
      return cast(data, resolved);
    }
    if (resolved.kind === 'named') {
      out = {};
      keys = Object.keys(data);
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        out[key] = own(resolved.fields, key) ? deserialize(data[key], resolved.fields[key].type) : deserialize(data[key]);
      }
      for (key in resolved.fields) if (own(resolved.fields, key) && out[key] === undefined && own(resolved.fields[key], 'default')) out[key] = defaultValue(resolved.fields[key]);
      assert(out, resolved);
      return out;
    }
    if (resolved.kind === 'tuple') {
      out = [];
      for (i = 0; i < resolved.types.length; i++) out.push(deserialize(data[i], resolved.types[i]));
      return out;
    }
    if (resolved.kind === 'record') {
      out = {};
      keys = Object.keys(data);
      for (i = 0; i < keys.length; i++) out[keys[i]] = deserialize(data[keys[i]], resolved.valueType);
      return out;
    }
    if (resolved.kind === 'nullable' || resolved.kind === 'optional') return data === null || data === undefined ? data : deserialize(data, resolved.type);
    if (resolved.kind === 'union') {
      for (i = 0; i < resolved.types.length; i++) {
        try {
          result = deserialize(data, resolved.types[i]);
          assert(result, resolved.types[i]);
          return result;
        } catch (_) {}
      }
      throw new TypeError('Value does not match union type.');
    }
    if (resolved.kind === 'intersection') {
      result = data;
      for (i = 0; i < resolved.types.length; i++) result = deserialize(result, resolved.types[i]);
      return result;
    }
    return clone(data);
  }
  function equals(a, b, type) {
    var resolved = type !== undefined ? resolve(type) : null;
    var keysA, keysB, i, key, matched;
    if (resolved && resolved.kind === 'named' && resolved.serialize) return equals(serialize(a, resolved), serialize(b, resolved));
    if (!resolved) {
      if (of(a) !== of(b)) return false;
      resolved = resolve(of(a));
      if (!resolved) return same(a, b);
    }
    if (resolved.kind === 'primitive') {
      if (resolved.name === 'any') return equals(a, b, of(a));
      if (resolved.name === 'date') return isDate(a) && isDate(b) && a.getTime() === b.getTime();
      if (resolved.name === 'regexp') return isRegExp(a) && isRegExp(b) && a.source === b.source && a.flags === b.flags;
      if (resolved.name === 'array') {
        if (!isArray(a) || !isArray(b) || a.length !== b.length) return false;
        for (i = 0; i < a.length; i++) if (!equals(a[i], b[i])) return false;
        return true;
      }
      if (resolved.name === 'map') {
        if (!isMap(a) || !isMap(b) || a.size !== b.size) return false;
        for (var entryA of a.entries()) {
          matched = false;
          for (var entryB of b.entries()) if (equals(entryA[0], entryB[0]) && equals(entryA[1], entryB[1])) { matched = true; break; }
          if (!matched) return false;
        }
        return true;
      }
      if (resolved.name === 'set') {
        if (!isSet(a) || !isSet(b) || a.size !== b.size) return false;
        for (var itemA of a.values()) {
          matched = false;
          for (var itemB of b.values()) if (equals(itemA, itemB)) { matched = true; break; }
          if (!matched) return false;
        }
        return true;
      }
      if (resolved.name === 'object') {
        if (!isPlainObject(a) || !isPlainObject(b)) return false;
        keysA = Object.keys(a);
        keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (i = 0; i < keysA.length; i++) {
          key = keysA[i];
          if (!own(b, key) || !equals(a[key], b[key])) return false;
        }
        return true;
      }
      return same(a, b);
    }
    if (resolved.kind === 'named') {
      if (!is(a, resolved) || !is(b, resolved)) return false;
      keysA = Object.keys(a);
      keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (i = 0; i < keysA.length; i++) {
        key = keysA[i];
        if (!own(b, key)) return false;
        if (own(resolved.fields, key)) {
          if (!equals(a[key], b[key], resolved.fields[key].type)) return false;
        } else if (!equals(a[key], b[key])) return false;
      }
      return true;
    }
    if (resolved.kind === 'union') {
      for (i = 0; i < resolved.types.length; i++) if (is(a, resolved.types[i]) && is(b, resolved.types[i])) return equals(a, b, resolved.types[i]);
      return false;
    }
    if (resolved.kind === 'intersection') {
      for (i = 0; i < resolved.types.length; i++) if (!equals(a, b, resolved.types[i])) return false;
      return true;
    }
    if (resolved.kind === 'literal') return same(a, resolved.value) && same(b, resolved.value);
    if (resolved.kind === 'tuple') {
      if (!isArray(a) || !isArray(b) || a.length !== resolved.types.length || b.length !== resolved.types.length) return false;
      for (i = 0; i < resolved.types.length; i++) if (!equals(a[i], b[i], resolved.types[i])) return false;
      return true;
    }
    if (resolved.kind === 'record') {
      keysA = Object.keys(a || {});
      keysB = Object.keys(b || {});
      if (keysA.length !== keysB.length) return false;
      for (i = 0; i < keysA.length; i++) {
        key = keysA[i];
        if (!own(b, key) || !equals(a[key], b[key], resolved.valueType)) return false;
      }
      return true;
    }
    if (resolved.kind === 'nullable') return a === null && b === null ? true : a !== null && b !== null && equals(a, b, resolved.type);
    if (resolved.kind === 'optional') return a === undefined && b === undefined ? true : a !== undefined && b !== undefined && equals(a, b, resolved.type);
    return same(a, b);
  }
  function clone(value, type) {
    var resolved = type !== undefined ? resolve(type) : resolve(of(value));
    var out, keys, key, i;
    if (value === null || value === undefined) return value;
    if (resolved && resolved.kind === 'named' && (resolved.serialize || resolved.deserialize)) return deserialize(serialize(value, resolved), resolved);
    if (!resolved) resolved = resolve(baseOf(value));
    if (!resolved) return value;
    if (resolved.kind === 'primitive') {
      if (resolved.name === 'date') return new Date(value.getTime());
      if (resolved.name === 'regexp') return new RegExp(value.source, value.flags);
      if (resolved.name === 'array') {
        out = [];
        for (i = 0; i < value.length; i++) out.push(clone(value[i]));
        return out;
      }
      if (resolved.name === 'map') {
        out = new Map();
        value.forEach(function (mapValue, mapKey) { out.set(clone(mapKey), clone(mapValue)); });
        return out;
      }
      if (resolved.name === 'set') {
        out = new Set();
        value.forEach(function (item) { out.add(clone(item)); });
        return out;
      }
      if (resolved.name === 'object') {
        out = {};
        keys = Object.keys(value);
        for (i = 0; i < keys.length; i++) out[keys[i]] = clone(value[keys[i]]);
        return out;
      }
      return value;
    }
    if (resolved.kind === 'named') {
      out = {};
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        out[key] = own(resolved.fields, key) ? clone(value[key], resolved.fields[key].type) : clone(value[key]);
      }
      return out;
    }
    if (resolved.kind === 'tuple') {
      out = [];
      for (i = 0; i < resolved.types.length; i++) out.push(clone(value[i], resolved.types[i]));
      return out;
    }
    if (resolved.kind === 'record') {
      out = {};
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) out[keys[i]] = clone(value[keys[i]], resolved.valueType);
      return out;
    }
    if (resolved.kind === 'nullable' || resolved.kind === 'optional') return value === null || value === undefined ? value : clone(value, resolved.type);
    if (resolved.kind === 'union') {
      for (i = 0; i < resolved.types.length; i++) if (is(value, resolved.types[i])) return clone(value, resolved.types[i]);
      return clone(value, baseOf(value));
    }
    if (resolved.kind === 'intersection') {
      out = value;
      for (i = 0; i < resolved.types.length; i++) out = clone(out, resolved.types[i]);
      return out;
    }
    return value;
  }

  definePrimitive('any', function () { return true; }, function (value) { return value; });
  definePrimitive('string', function (value) { return typeof value === 'string'; }, function (value) {
    if (value === null || value === undefined) throw new TypeError('Cannot cast ' + value + ' to string.');
    return String(value);
  });
  definePrimitive('number', function (value) { return typeof value === 'number' && isFinite(value); }, function (value) {
    var out;
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string' && value.trim() !== '') {
      out = Number(value);
      if (isFinite(out)) return out;
    }
    throw new TypeError('Cannot cast ' + baseOf(value) + ' to number.');
  });
  definePrimitive('boolean', function (value) { return typeof value === 'boolean'; }, function (value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      if (/^(true|1|yes)$/i.test(value)) return true;
      if (/^(false|0|no)$/i.test(value)) return false;
    }
    throw new TypeError('Cannot cast ' + baseOf(value) + ' to boolean.');
  });
  definePrimitive('array', function (value) { return isArray(value); }, function (value) {
    if (!isArray(value)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to array.');
    return clone(value, 'array');
  });
  definePrimitive('object', function (value) { return isPlainObject(value); }, function (value) {
    if (!isPlainObject(value)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to object.');
    return clone(value, 'object');
  });
  definePrimitive('date', function (value) { return isDate(value); }, function (value) {
    var out = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (!isDate(out)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to date.');
    return out;
  });
  definePrimitive('function', function (value) { return typeof value === 'function'; }, function (value) {
    if (typeof value !== 'function') throw new TypeError('Cannot cast ' + baseOf(value) + ' to function.');
    return value;
  }, false);
  definePrimitive('undefined', function (value) { return value === undefined; }, function (value) {
    if (value !== undefined) throw new TypeError('Expected undefined.');
    return undefined;
  }, false);
  definePrimitive('null', function (value) { return value === null; }, function (value) {
    if (value !== null) throw new TypeError('Expected null.');
    return null;
  });
  definePrimitive('regexp', function (value) { return isRegExp(value); }, function (value) {
    if (!isRegExp(value)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to regexp.');
    return new RegExp(value.source, value.flags);
  });
  definePrimitive('symbol', function (value) { return typeof value === 'symbol'; }, function (value) {
    if (typeof value !== 'symbol') throw new TypeError('Cannot cast ' + baseOf(value) + ' to symbol.');
    return value;
  }, false);
  definePrimitive('bigint', function (value) { return typeof value === 'bigint'; }, function (value) {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number' && isFinite(value) && Math.floor(value) === value) return BigInt(value);
    if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
    throw new TypeError('Cannot cast ' + baseOf(value) + ' to bigint.');
  });
  definePrimitive('map', function (value) { return isMap(value); }, function (value) {
    if (!isMap(value)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to map.');
    return clone(value, 'map');
  });
  definePrimitive('set', function (value) { return isSet(value); }, function (value) {
    if (!isSet(value)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to set.');
    return clone(value, 'set');
  });
  definePrimitive('promise', function (value) { return isPromise(value); }, function (value) {
    if (!isPromise(value)) throw new TypeError('Cannot cast ' + baseOf(value) + ' to promise.');
    return Promise.resolve(value);
  }, false);

  var registry = {
    register: registryRegister,
    get: registryGet,
    has: registryHas,
    list: registryList,
    remove: registryRemove
  };
  var api = {
    define: define,
    check: check,
    is: is,
    assert: assert,
    cast: cast,
    of: of,
    registry: registry,
    contract: contract,
    guard: guard,
    union: union,
    intersection: intersection,
    literal: literal,
    tuple: tuple,
    record: record,
    nullable: nullable,
    optional: optional,
    reflect: reflect,
    serialize: serialize,
    deserialize: deserialize,
    equals: equals,
    clone: clone
  };

  return api;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Types;
else if (typeof exports !== 'undefined') exports.BareMetalTypes = BareMetal.Types;
