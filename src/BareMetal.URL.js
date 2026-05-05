var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.URL = (function() {
  'use strict';

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function isArray(value) { return Object.prototype.toString.call(value) === '[object Array]'; }
  function isObject(value) { return !!value && typeof value === 'object' && !isArray(value); }
  function isNumericToken(token) { return /^\d+$/.test(String(token)); }
  function toText(value) { return value == null ? '' : String(value); }
  function ensureProtocol(protocol) {
    protocol = toText(protocol);
    if (!protocol) return '';
    return protocol.charAt(protocol.length - 1) === ':' ? protocol : protocol + ':';
  }
  function trimHash(value) {
    value = toText(value);
    return value.charAt(0) === '#' ? value.slice(1) : value;
  }
  function trimSlashes(value) {
    return toText(value).replace(/^\/+|\/+$/g, '');
  }
  function splitSegments(pathname) {
    var clean = trimSlashes(pathname);
    return clean ? clean.split('/').filter(function(part) { return part.length > 0; }) : [];
  }
  function clone(value) {
    var out, keys, i;
    if (isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(clone(value[i]));
      return out;
    }
    if (isObject(value)) {
      out = {};
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) out[keys[i]] = clone(value[keys[i]]);
      return out;
    }
    return value;
  }
  function mergeLeaf(existing, value) {
    if (typeof existing === 'undefined') return value;
    if (isArray(existing)) {
      existing.push(value);
      return existing;
    }
    return [existing, value];
  }
  function sortDeep(value) {
    var out, keys, i;
    if (isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(sortDeep(value[i]));
      if (out.every(function(item) { return !isObject(item) && !isArray(item); })) {
        out.sort(function(a, b) {
          a = toText(a);
          b = toText(b);
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        });
      }
      return out;
    }
    if (isObject(value)) {
      out = {};
      keys = Object.keys(value).sort();
      for (i = 0; i < keys.length; i++) out[keys[i]] = sortDeep(value[keys[i]]);
      return out;
    }
    return value;
  }
  function mergeObjects(target, source) {
    var keys, i, key, sourceValue;
    target = isObject(target) ? target : {};
    if (!isObject(source)) return target;
    keys = Object.keys(source);
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      sourceValue = source[key];
      if (typeof sourceValue === 'undefined') continue;
      if (isObject(sourceValue)) target[key] = mergeObjects(isObject(target[key]) ? target[key] : {}, sourceValue);
      else target[key] = clone(sourceValue);
    }
    return target;
  }
  function parseAuthority(host) {
    var hostname = host || '';
    var port = '';
    var end, index;
    if (!host) return { hostname: '', port: '' };
    if (host.charAt(0) === '[') {
      end = host.indexOf(']');
      if (end > -1) {
        hostname = host.substring(0, end + 1);
        if (host.charAt(end + 1) === ':') port = host.substring(end + 2);
        return { hostname: hostname, port: port };
      }
    }
    index = host.lastIndexOf(':');
    if (index > -1 && host.indexOf(':') === index && /^\d+$/.test(host.substring(index + 1))) {
      hostname = host.substring(0, index);
      port = host.substring(index + 1);
    }
    return { hostname: hostname, port: port };
  }
  function removeDotSegments(pathname) {
    var leading = pathname.charAt(0) === '/';
    var trailing = pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/';
    var parts = pathname.split('/');
    var out = [];
    var i, part;
    for (i = 0; i < parts.length; i++) {
      part = parts[i];
      if (!part || part === '.') continue;
      if (part === '..') {
        if (out.length && out[out.length - 1] !== '..') out.pop();
        else if (!leading) out.push('..');
      } else out.push(part);
    }
    pathname = (leading ? '/' : '') + out.join('/');
    if (!pathname && leading) pathname = '/';
    if (trailing && pathname && pathname !== '/') pathname += '/';
    return pathname;
  }
  function dirname(pathname) {
    var segments;
    if (!pathname) return '';
    if (pathname === '/') return '/';
    segments = splitSegments(pathname);
    if (pathname.charAt(pathname.length - 1) !== '/') segments.pop();
    if (!segments.length) return pathname.charAt(0) === '/' ? '/' : '';
    return (pathname.charAt(0) === '/' ? '/' : '') + segments.join('/');
  }
  function tokenizeKey(key) {
    var tokens = [];
    String(key).replace(/([^\[\]]+)|\[(.*?)\]/g, function(_, bare, bracket) {
      tokens.push(typeof bare === 'string' && bare !== '' ? bare : bracket || '');
      return _;
    });
    return tokens.length ? tokens : [String(key)];
  }
  function createContainer(nextToken) {
    return nextToken === '' || isNumericToken(nextToken) ? [] : {};
  }
  function setNested(target, tokens, value, index) {
    var token = tokens[index];
    var nextToken = tokens[index + 1];
    var slot;
    if (index === tokens.length - 1) {
      if (token === '') {
        if (isArray(target)) target.push(value);
        return;
      }
      if (isArray(target) && isNumericToken(token)) {
        target[Number(token)] = mergeLeaf(target[Number(token)], value);
        return;
      }
      target[token] = mergeLeaf(target[token], value);
      return;
    }
    if (token === '') {
      if (!isArray(target)) return;
      slot = createContainer(nextToken);
      target.push(slot);
      setNested(slot, tokens, value, index + 1);
      return;
    }
    if (isArray(target) && isNumericToken(token)) {
      if (typeof target[Number(token)] === 'undefined' || !target[Number(token)] || typeof target[Number(token)] !== 'object') {
        target[Number(token)] = createContainer(nextToken);
      }
      setNested(target[Number(token)], tokens, value, index + 1);
      return;
    }
    if (!own(target, token) || !target[token] || typeof target[token] !== 'object') target[token] = createContainer(nextToken);
    setNested(target[token], tokens, value, index + 1);
  }
  function deleteNested(target, tokens, index) {
    var token = tokens[index];
    var child;
    if (!target || typeof target !== 'object') return;
    if (index === tokens.length - 1) {
      if (isArray(target) && isNumericToken(token)) target.splice(Number(token), 1);
      else delete target[token];
      return;
    }
    child = isArray(target) && isNumericToken(token) ? target[Number(token)] : target[token];
    deleteNested(child, tokens, index + 1);
    if (child && isArray(child) && !child.length) {
      if (isArray(target) && isNumericToken(token)) target.splice(Number(token), 1);
      else delete target[token];
    }
    if (child && isObject(child) && !Object.keys(child).length) {
      if (isArray(target) && isNumericToken(token)) target.splice(Number(token), 1);
      else delete target[token];
    }
  }
  function encodeValue(value) {
    return encodeURIComponent(toText(value)).replace(/[!'()*]/g, function(chr) {
      return '%' + chr.charCodeAt(0).toString(16).toUpperCase();
    });
  }
  function decodeValue(value) {
    value = toText(value);
    try { return decodeURIComponent(value); }
    catch (_) { return value; }
  }
  function encodeQueryValue(key, value, pairs) {
    var keys, i;
    if (typeof value === 'undefined') return;
    if (value === null) {
      pairs.push(encodeValue(key));
      return;
    }
    if (isArray(value)) {
      for (i = 0; i < value.length; i++) {
        if (isObject(value[i]) || isArray(value[i])) encodeQueryValue(key + '[' + i + ']', value[i], pairs);
        else if (value[i] === null) pairs.push(encodeValue(key));
        else pairs.push(encodeValue(key) + '=' + encodeValue(value[i]));
      }
      return;
    }
    if (isObject(value)) {
      keys = Object.keys(value);
      for (i = 0; i < keys.length; i++) encodeQueryValue(key ? key + '[' + keys[i] + ']' : keys[i], value[keys[i]], pairs);
      return;
    }
    if (!key) return;
    pairs.push(encodeValue(key) + '=' + encodeValue(value));
  }
  function encodeQuery(obj) {
    var pairs = [];
    var keys, i;
    if (obj == null) return '';
    if (isArray(obj)) {
      for (i = 0; i < obj.length; i++) encodeQueryValue(String(i), obj[i], pairs);
    } else if (isObject(obj)) {
      keys = Object.keys(obj);
      for (i = 0; i < keys.length; i++) encodeQueryValue(keys[i], obj[keys[i]], pairs);
    }
    return pairs.join('&');
  }
  function decodeQuery(queryString) {
    var output = {};
    var text = toText(queryString).replace(/^\?/, '');
    var pairs, i, pair, index, key, value, tokens;
    if (!text) return output;
    pairs = text.split('&');
    for (i = 0; i < pairs.length; i++) {
      pair = pairs[i];
      if (!pair) continue;
      index = pair.indexOf('=');
      if (index < 0) {
        key = decodeValue(pair.replace(/\+/g, ' '));
        value = null;
      } else {
        key = decodeValue(pair.substring(0, index).replace(/\+/g, ' '));
        value = decodeValue(pair.substring(index + 1).replace(/\+/g, ' '));
      }
      tokens = tokenizeKey(key);
      setNested(output, tokens, value, 0);
    }
    return output;
  }
  function parse(url) {
    var input = toText(url);
    var match = /^([a-zA-Z][a-zA-Z0-9+.-]*:)?(?:\/\/([^/?#]*))?([^?#]*)(\?[^#]*)?(#.*)?$/.exec(input);
    var parsed = {
      protocol: '',
      host: '',
      hostname: '',
      port: '',
      pathname: '',
      search: '',
      hash: '',
      origin: '',
      params: {},
      segments: []
    };
    var authority;
    if (!match) return parsed;
    parsed.protocol = match[1] || '';
    parsed.host = match[2] || '';
    parsed.pathname = match[3] || '';
    parsed.search = match[4] || '';
    parsed.hash = match[5] || '';
    if (parsed.host) {
      authority = parseAuthority(parsed.host);
      parsed.hostname = authority.hostname;
      parsed.port = authority.port;
      parsed.origin = (parsed.protocol ? parsed.protocol + '//' : '//') + parsed.host;
      if (!parsed.pathname) parsed.pathname = '/';
    }
    parsed.params = decodeQuery(parsed.search);
    parsed.segments = splitSegments(parsed.pathname);
    return parsed;
  }
  function build(parts) {
    var protocol = ensureProtocol(parts && parts.protocol);
    var host = parts && parts.host ? toText(parts.host) : '';
    var pathname = parts && own(parts, 'pathname') ? toText(parts.pathname) : '';
    var search = '';
    var hash = '';
    var originParts;
    if (!host && parts && parts.origin) {
      originParts = parse(parts.origin);
      protocol = protocol || originParts.protocol;
      host = originParts.host;
    }
    if (!host && parts && parts.hostname) host = toText(parts.hostname) + (parts.port ? ':' + parts.port : '');
    if (!pathname && parts && isArray(parts.segments) && parts.segments.length) pathname = (parts.leadingSlash === false ? '' : '/') + parts.segments.join('/');
    if (host && !pathname) pathname = '/';
    if (parts && parts.params && (!parts.search || parts.search === '?')) {
      search = encodeQuery(parts.params);
      search = search ? '?' + search : '';
    } else if (parts && parts.search) {
      search = toText(parts.search);
      if (search && search.charAt(0) !== '?') search = '?' + search;
    }
    if (parts && parts.hash) {
      hash = toText(parts.hash);
      if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
    }
    if (host) return (protocol ? protocol + '//' : '//') + host + pathname + search + hash;
    return pathname + search + hash;
  }
  function join() {
    var pieces = [];
    var i, text, match, prefix, leadingSlash, trailingSlash, segments, j, part;
    for (i = 0; i < arguments.length; i++) {
      if (arguments[i] == null) continue;
      text = toText(arguments[i]);
      if (text) pieces.push(text);
    }
    if (!pieces.length) return '';
    prefix = '';
    match = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]*|\/\/[^/]*)(.*)$/.exec(pieces[0]);
    if (match) {
      prefix = match[1];
      pieces[0] = match[2] || '';
    }
    leadingSlash = !prefix && pieces[0] && pieces[0].charAt(0) === '/';
    trailingSlash = /\/$/.test(pieces[pieces.length - 1]);
    segments = [];
    for (i = 0; i < pieces.length; i++) {
      text = pieces[i].replace(/\\/g, '/');
      part = text.split('/');
      for (j = 0; j < part.length; j++) if (part[j]) segments.push(part[j]);
    }
    text = segments.join('/');
    if (prefix) text = prefix + (text ? '/' + text : '/');
    else if (leadingSlash) text = '/' + text;
    if (!text && leadingSlash) text = '/';
    if (trailingSlash && text && text.charAt(text.length - 1) !== '/') text += '/';
    return text || '';
  }
  function params(pattern, url) {
    var patternSegments = splitSegments(parse(pattern).pathname || pattern);
    var urlSegments = splitSegments(parse(url).pathname);
    var output = {};
    var i, token;
    if (!patternSegments.length && !urlSegments.length) return output;
    for (i = 0; i < patternSegments.length; i++) {
      token = patternSegments[i];
      if (token === '*') {
        output['*'] = urlSegments.slice(i).join('/');
        return output;
      }
      if (i >= urlSegments.length) return null;
      if (token.charAt(0) === ':') output[token.slice(1)] = decodeValue(urlSegments[i]);
      else if (token !== urlSegments[i]) return null;
    }
    return patternSegments.length === urlSegments.length ? output : null;
  }
  function template(pattern, data) {
    data = data || {};
    return toText(pattern).replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, function(match, key) {
      return own(data, key) ? encodeValue(data[key]) : '';
    });
  }
  function isAbsolute(url) {
    return /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(toText(url));
  }
  function isRelative(url) {
    return !!toText(url) && !isAbsolute(url);
  }
  function resolve(base, relative) {
    var baseParts = parse(base);
    var relativeParts = parse(relative);
    var output;
    if (!toText(relative)) return normalize(base);
    if (isAbsolute(relative)) return normalize(relative);
    output = {
      protocol: baseParts.protocol,
      host: baseParts.host,
      hostname: baseParts.hostname,
      port: baseParts.port,
      pathname: baseParts.pathname,
      params: {},
      search: baseParts.search,
      hash: ''
    };
    if (relative.charAt(0) === '#') {
      output.hash = relativeParts.hash;
    } else if (relative.charAt(0) === '?') {
      output.search = relativeParts.search;
      output.hash = relativeParts.hash;
    } else {
      if (relativeParts.pathname.charAt(0) === '/') output.pathname = relativeParts.pathname;
      else output.pathname = join(dirname(baseParts.pathname || '/'), relativeParts.pathname || '');
      output.search = relativeParts.search;
      output.hash = relativeParts.hash;
    }
    return normalize(build(output));
  }
  function normalize(url) {
    var parts = parse(url);
    var protocol = parts.protocol ? parts.protocol.toLowerCase() : '';
    var pathname = removeDotSegments(parts.pathname || (parts.host ? '/' : ''));
    var paramsObject = sortDeep(parts.params);
    var encodedQuery = encodeQuery(paramsObject);
    if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/') pathname = pathname.slice(0, -1);
    parts.protocol = protocol;
    if (parts.host) {
      parts.hostname = parts.hostname.toLowerCase();
      if ((protocol === 'http:' && parts.port === '80') || (protocol === 'https:' && parts.port === '443') || (protocol === 'ws:' && parts.port === '80') || (protocol === 'wss:' && parts.port === '443')) parts.port = '';
      parts.host = parts.hostname + (parts.port ? ':' + parts.port : '');
      parts.origin = (parts.protocol ? parts.protocol + '//' : '//') + parts.host;
    }
    parts.pathname = pathname || (parts.host ? '/' : '');
    parts.search = encodedQuery ? '?' + encodedQuery : '';
    return build(parts);
  }
  function compare(a, b) {
    return normalize(a) === normalize(b);
  }
  function slug(text) {
    return toText(text)
      .normalize ? toText(text).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-') : toText(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
  }
  function origin(url) {
    return parse(url).origin;
  }
  function isValid(url) {
    var text = toText(url);
    if (!text) return false;
    if (/\s/.test(text) && isAbsolute(text)) return false;
    try {
      if (isAbsolute(text) && typeof URL !== 'undefined') new URL(text.indexOf('//') === 0 ? 'http:' + text : text);
      parse(text);
      return true;
    } catch (_) {
      return false;
    }
  }
  function relative(from, to) {
    var fromParts = parse(normalize(from));
    var toParts = parse(normalize(to));
    var fromSegments = splitSegments(fromParts.pathname);
    var toSegments = splitSegments(toParts.pathname);
    var output = [];
    var i = 0;
    var j;
    var path;
    if (fromParts.origin && toParts.origin && fromParts.origin !== toParts.origin) return build(toParts);
    if (fromParts.pathname && fromParts.pathname.charAt(fromParts.pathname.length - 1) !== '/') fromSegments.pop();
    while (i < fromSegments.length && i < toSegments.length && fromSegments[i] === toSegments[i]) i++;
    for (j = i; j < fromSegments.length; j++) output.push('..');
    for (j = i; j < toSegments.length; j++) output.push(toSegments[j]);
    path = output.join('/');
    if (!path && toParts.pathname !== fromParts.pathname) path = '.';
    return path + (toParts.search || '') + (toParts.hash || '');
  }
  function mergeQuery(url, paramsObject) {
    var parts = parse(url);
    parts.params = mergeObjects(clone(parts.params), paramsObject || {});
    delete parts.search;
    return build(parts);
  }
  function removeQuery(url, keys) {
    var parts = parse(url);
    var list = isArray(keys) ? keys : [keys];
    var i, tokenList;
    parts.params = clone(parts.params);
    for (i = 0; i < list.length; i++) {
      if (list[i] == null) continue;
      tokenList = tokenizeKey(list[i]);
      deleteNested(parts.params, tokenList, 0);
    }
    delete parts.search;
    return build(parts);
  }
  function getHash(url) {
    return trimHash(parse(url).hash);
  }
  function setHash(url, value) {
    var parts = parse(url);
    parts.hash = value == null || value === '' ? '' : '#' + trimHash(value);
    return build(parts);
  }

  return {
    parse: parse,
    build: build,
    query: {
      encode: encodeQuery,
      decode: decodeQuery,
      merge: mergeQuery,
      remove: removeQuery
    },
    params: params,
    template: template,
    join: join,
    normalize: normalize,
    isAbsolute: isAbsolute,
    isRelative: isRelative,
    resolve: resolve,
    compare: compare,
    slug: slug,
    encode: encodeValue,
    decode: decodeValue,
    hash: {
      get: getHash,
      set: setHash
    },
    origin: origin,
    isValid: isValid,
    relative: relative
  };
})();
if (typeof window !== 'undefined') {
  window.BareMetal = window.BareMetal || BareMetal;
  window.BareMetal.URL = BareMetal.URL;
}
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.URL;
