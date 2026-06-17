var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Search = (function(root) {
  'use strict';

  var DEFAULT_STOP_WORDS = [
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
    'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were', 'will', 'with'
  ];

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function assign(a, b) {
    var out = {}, key;
    for (key in (a || {})) if (own(a, key)) out[key] = a[key];
    for (key in (b || {})) if (own(b, key)) out[key] = b[key];
    return out;
  }
  function toArray(value) {
    if (value == null) return [];
    return Array.isArray(value) ? value.slice() : [value];
  }
  function objectKeys(obj) {
    var out = [], key;
    for (key in (obj || {})) if (own(obj, key)) out.push(key);
    return out;
  }
  function unique(list) {
    var out = [];
    var seen = {};
    var i;
    var key;
    for (i = 0; i < (list || []).length; i++) {
      key = String(list[i]);
      if (seen[key]) continue;
      seen[key] = true;
      out.push(list[i]);
    }
    return out;
  }
  function clone(value) {
    var out;
    var key;
    var i;
    if (Array.isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(clone(value[i]));
      return out;
    }
    if (value && typeof value === 'object') {
      out = {};
      for (key in value) if (own(value, key)) out[key] = clone(value[key]);
      return out;
    }
    return value;
  }
  function toText(value) {
    if (value == null) return '';
    if (Array.isArray(value)) return value.map(toText).join(' ');
    if (typeof value === 'object') {
      try { return JSON.stringify(value); }
      catch (_) { return String(value); }
    }
    return String(value);
  }
  function escapeRegExp(text) { return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function sortByCount(a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return String(a.value).localeCompare(String(b.value));
  }
  function defaultStopWords() { return DEFAULT_STOP_WORDS.slice(); }
  function buildStopWordMap(list) {
    var map = {};
    var i;
    list = list === false ? [] : (list == null ? defaultStopWords() : toArray(list));
    for (i = 0; i < list.length; i++) map[String(list[i]).toLowerCase()] = true;
    return map;
  }
  function stripHtml(text) { return String(text == null ? '' : text).replace(/<[^>]*>/g, ' '); }
  function stripPunctuation(text) {
    return String(text == null ? '' : text)
      .replace(/[’']/g, '')
      .replace(/[^A-Za-z0-9*_\s]+/g, ' ')
      .replace(/_/g, ' ');
  }
  function splitWords(text) {
    var matches = String(text == null ? '' : text).match(/[A-Za-z0-9*]+/g);
    return matches ? matches.slice() : [];
  }
  function dedupeStem(word) {
    var keep = { ss: true, ll: true, zz: true };
    if (word.length > 3 && word.charAt(word.length - 1) === word.charAt(word.length - 2)) {
      if (!keep[word.slice(-2)]) word = word.slice(0, -1);
    }
    return word;
  }
  function stemWord(word) {
    word = String(word == null ? '' : word).toLowerCase();
    if (word.length < 3) return word;
    if (word.length > 5 && /ies$/.test(word)) return word.slice(0, -3) + 'y';
    if (word.length > 4 && /sses$/.test(word)) return word.slice(0, -2);
    if (word.length > 5 && /ing$/.test(word)) return dedupeStem(word.slice(0, -3));
    if (word.length > 4 && /ed$/.test(word)) return dedupeStem(word.slice(0, -2));
    if (word.length > 4 && /ers$/.test(word)) return dedupeStem(word.slice(0, -3));
    if (word.length > 3 && /er$/.test(word)) return dedupeStem(word.slice(0, -2));
    if (word.length > 4 && /ly$/.test(word)) return word.slice(0, -2);
    if (word.length > 4 && /es$/.test(word)) return dedupeStem(word.slice(0, -2));
    if (word.length > 3 && /s$/.test(word) && !/ss$/.test(word)) return word.slice(0, -1);
    return word;
  }
  function tokenizeValue(value) {
    return Array.isArray(value) ? value.map(toText).join(' ') : toText(value);
  }
  function resolveStep(step) {
    if (typeof step === 'function') return step;
    if (typeof step === 'string') {
      if (step === 'lowercase') return function(input) {
        if (Array.isArray(input)) return input.map(function(token) { return String(token).toLowerCase(); });
        return String(input == null ? '' : input).toLowerCase();
      };
      if (step === 'stripHtml') return function(input) {
        return Array.isArray(input) ? input.slice() : stripHtml(input);
      };
      if (step === 'stripPunctuation') return function(input) {
        if (Array.isArray(input)) return input.map(function(token) { return stripPunctuation(token); }).join(' ');
        return stripPunctuation(input);
      };
      if (step === 'stopWords') return function(input, ctx) {
        var map = (ctx && ctx.stopWordMap) || buildStopWordMap();
        var list = Array.isArray(input) ? input.slice() : splitWords(input);
        return list.filter(function(token) { return token && !map[String(token).toLowerCase()]; });
      };
      if (step === 'stem') return function(input) {
        var list = Array.isArray(input) ? input.slice() : splitWords(input);
        return list.map(function(token) { return stemWord(token); }).filter(Boolean);
      };
    }
    if (step && step.type === 'ngram') return function(input) {
      var size = Math.max(2, Number(step.size || step.n || 2) || 2);
      var list = Array.isArray(input) ? input.slice() : splitWords(input);
      var out = list.slice();
      var i;
      for (i = 0; i <= list.length - size; i++) out.push(list.slice(i, i + size).join(' '));
      return out;
    };
    if (step && step.type === 'synonym') return function(input) {
      var map = step.map || {};
      var list = Array.isArray(input) ? input.slice() : splitWords(input);
      var out = [];
      var i;
      var values;
      for (i = 0; i < list.length; i++) {
        out.push(list[i]);
        values = map[list[i]] || map[String(list[i]).toLowerCase()];
        if (values == null) continue;
        out = out.concat(Array.isArray(values) ? values : [values]);
      }
      return out;
    };
    return null;
  }
  function pipeline(steps) {
    var list = Array.isArray(steps) ? steps.slice() : [];
    list = list.map(resolveStep).filter(Boolean);
    return function(input, opts) {
      var ctx = assign({ stopWordMap: buildStopWordMap(opts && own(opts, 'stopWords') ? opts.stopWords : null) }, opts || {});
      var value = input;
      var i;
      for (i = 0; i < list.length; i++) value = list[i](value, ctx);
      if (typeof value === 'string') value = splitWords(value);
      if (!Array.isArray(value)) value = value == null ? [] : [String(value)];
      return value.map(function(token) { return String(token).trim(); }).filter(Boolean);
    };
  }
  pipeline.ngram = function(n) { return { type: 'ngram', n: n }; };
  pipeline.synonym = function(map) { return { type: 'synonym', map: map || {} }; };
  function defaultTokenPipeline(opts) {
    var steps = ['stripHtml'];
    if (!opts.caseSensitive) steps.push('lowercase');
    steps.push('stripPunctuation');
    if (opts.stopWords !== false) steps.push('stopWords');
    if (opts.stemming || opts.tokenizer === 'porter') steps.push('stem');
    return pipeline(steps);
  }
  function tokenize(text, opts) {
    var config = assign({ tokenizer: 'simple', stopWords: null, stemming: false, caseSensitive: false }, opts || {});
    var runner = typeof config.pipeline === 'function' ? config.pipeline : defaultTokenPipeline(config);
    return runner(tokenizeValue(text), config);
  }
  function stem(word) { return stemWord(word); }
  function normalizePhraseText(text, caseSensitive) {
    text = stripPunctuation(stripHtml(text)).replace(/\s+/g, ' ').trim();
    return caseSensitive ? text : text.toLowerCase();
  }
  function snippetAroundMatch(text, index, opts) {
    var maxLength = Math.max(0, Number(opts && opts.maxLength || 0) || 0);
    var contextWords = Math.max(1, Number(opts && opts.contextWords || 5) || 5);
    var words = String(text).split(/\s+/);
    var offset = 0;
    var wordIndex = 0;
    var start = 0;
    var end;
    var i;
    if (!words.length) return String(text);
    for (i = 0; i < words.length; i++) {
      if (index <= offset + words[i].length) { wordIndex = i; break; }
      offset += words[i].length + 1;
      wordIndex = i;
    }
    start = Math.max(0, wordIndex - contextWords);
    end = Math.min(words.length, wordIndex + contextWords + 1);
    text = words.slice(start, end).join(' ');
    if (start > 0) text = '… ' + text;
    if (end < words.length) text += ' …';
    if (maxLength && text.length > maxLength) text = text.slice(0, Math.max(1, maxLength - 1)).replace(/\s+\S*$/, '') + '…';
    return text;
  }
  function markTerms(text, terms, tag) {
    var pattern;
    var sorted = unique((terms || []).filter(Boolean)).sort(function(a, b) { return String(b).length - String(a).length; });
    if (!sorted.length) return escapeHtml(text);
    pattern = new RegExp('(' + sorted.map(function(term) { return escapeRegExp(term); }).join('|') + ')', 'gi');
    return escapeHtml(text).replace(pattern, '<' + tag + '>$1</' + tag + '>');
  }
  function highlight(text, terms, opts) {
    var tag = (opts && opts.tag) || 'mark';
    var source = toText(text);
    var list = unique((terms || []).map(function(term) { return String(term); }).filter(Boolean));
    var lower = source.toLowerCase();
    var first = -1;
    var i;
    var idx;
    if (!list.length) return escapeHtml(source);
    for (i = 0; i < list.length; i++) {
      idx = lower.indexOf(String(list[i]).toLowerCase());
      if (idx > -1 && (first === -1 || idx < first)) first = idx;
    }
    if ((opts && opts.maxLength) || (opts && opts.contextWords && first > -1)) source = snippetAroundMatch(source, Math.max(0, first), opts || {});
    return markTerms(source, list, tag);
  }
  function queryTokens(text) {
    var out = [];
    var i = 0;
    var current = '';
    var quote = false;
    text = String(text == null ? '' : text);
    while (i < text.length) {
      if (text.charAt(i) === '"') {
        current += '"';
        quote = !quote;
        i++;
        continue;
      }
      if (!quote && /\s/.test(text.charAt(i))) {
        if (current) out.push(current);
        current = '';
        i++;
        continue;
      }
      current += text.charAt(i);
      i++;
    }
    if (current) out.push(current);
    return out;
  }
  function parseClause(token, forcedNot) {
    var raw = String(token == null ? '' : token);
    var negated = !!forcedNot;
    var field = null;
    var value = raw;
    var colon = -1;
    var quoteAt = raw.indexOf('"');
    if (value.charAt(0) === '-') {
      negated = true;
      value = value.slice(1);
      raw = value;
      quoteAt = raw.indexOf('"');
    }
    colon = raw.indexOf(':');
    if (colon > 0 && (quoteAt === -1 || colon < quoteAt)) {
      field = raw.slice(0, colon);
      value = raw.slice(colon + 1);
    }
    var phrase = value.charAt(0) === '"' && value.charAt(value.length - 1) === '"';
    if (phrase) value = value.slice(1, -1);
    var wildcard = /\*$/.test(value);
    if (wildcard) value = value.replace(/\*+$/, '');
    return {
      raw: token,
      value: value,
      field: field,
      phrase: phrase,
      wildcard: wildcard,
      negated: negated,
      operator: negated ? 'NOT' : 'AND'
    };
  }
  function parseQuery(queryString) {
    var rawTokens = queryTokens(queryString);
    var groups = [];
    var clauses = [];
    var current = { include: [], exclude: [] };
    var expectNot = false;
    var i;
    var token;
    var upper;
    var clause;
    function pushCurrent() {
      groups.push({ include: current.include.slice(), exclude: current.exclude.slice() });
      current = { include: [], exclude: [] };
    }
    for (i = 0; i < rawTokens.length; i++) {
      token = rawTokens[i];
      upper = String(token).toUpperCase();
      if (upper === 'AND') continue;
      if (upper === 'OR') {
        pushCurrent();
        expectNot = false;
        continue;
      }
      if (upper === 'NOT') {
        expectNot = true;
        continue;
      }
      clause = parseClause(token, expectNot);
      expectNot = false;
      clauses.push(clause);
      if (clause.negated) current.exclude.push(clause);
      else current.include.push(clause);
    }
    if (!groups.length || current.include.length || current.exclude.length) pushCurrent();
    return {
      raw: String(queryString == null ? '' : queryString),
      tokens: rawTokens,
      clauses: clauses,
      groups: groups,
      hasOr: groups.length > 1
    };
  }
  function levenshtein(a, b, limit) {
    var m = String(a);
    var n = String(b);
    var al = m.length;
    var bl = n.length;
    var prev = [];
    var curr = [];
    var i;
    var j;
    var min;
    if (m === n) return 0;
    if (!al) return bl;
    if (!bl) return al;
    if (limit != null && Math.abs(al - bl) > limit) return limit + 1;
    for (j = 0; j <= bl; j++) prev[j] = j;
    for (i = 1; i <= al; i++) {
      curr[0] = i;
      min = curr[0];
      for (j = 1; j <= bl; j++) {
        curr[j] = Math.min(
          curr[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + (m.charAt(i - 1) === n.charAt(j - 1) ? 0 : 1)
        );
        if (curr[j] < min) min = curr[j];
      }
      if (limit != null && min > limit) return limit + 1;
      prev = curr.slice();
    }
    return prev[bl];
  }
  function createIndex(opts) {
    var config = assign({ fields: ['title', 'body'], tokenizer: 'simple', stopWords: null, stemming: false, caseSensitive: false }, opts || {});
    var docs = {};
    var order = [];
    var records = {};
    var inverted = {};
    var totals = {};
    var api;
    function isIndexedField(field) {
      var i;
      for (i = 0; i < config.fields.length; i++) if (config.fields[i] === field) return true;
      return false;
    }
    function initField(field) {
      if (!inverted[field]) inverted[field] = {};
      if (!totals[field]) totals[field] = {};
    }
    function normalizeQueryToken(value) {
      var tokens = tokenize(value, assign(config, { stopWords: false }));
      return tokens.length ? tokens[0] : normalizePhraseText(value, config.caseSensitive);
    }
    function fieldRecord(field, value) {
      var tokens = tokenize(value, config);
      var counts = {};
      var i;
      for (i = 0; i < tokens.length; i++) counts[tokens[i]] = (counts[tokens[i]] || 0) + 1;
      return {
        text: toText(value),
        normalizedText: normalizePhraseText(value, config.caseSensitive),
        tokens: tokens,
        counts: counts,
        length: tokens.length
      };
    }
    function addPosting(field, term, id, freq) {
      initField(field);
      if (!inverted[field][term]) inverted[field][term] = { df: 0, postings: {} };
      if (!own(inverted[field][term].postings, id)) inverted[field][term].df += 1;
      inverted[field][term].postings[id] = freq;
      totals[field][term] = (totals[field][term] || 0) + freq;
    }
    function removePosting(field, term, id, freq) {
      if (!inverted[field] || !inverted[field][term]) return;
      if (own(inverted[field][term].postings, id)) {
        delete inverted[field][term].postings[id];
        inverted[field][term].df -= 1;
      }
      totals[field][term] = Math.max(0, (totals[field][term] || 0) - freq);
      if (!totals[field][term]) delete totals[field][term];
      if (inverted[field][term].df <= 0 || !objectKeys(inverted[field][term].postings).length) delete inverted[field][term];
    }
    function collectTerms(field) { return objectKeys(inverted[field] || {}); }
    function getDocIds() { return order.filter(function(id) { return own(docs, id); }); }
    function remove(id) {
      var record = records[id];
      var fields;
      var field;
      var terms;
      var i;
      if (!record) return;
      fields = objectKeys(record.fields);
      for (i = 0; i < fields.length; i++) {
        field = fields[i];
        terms = objectKeys(record.fields[field].counts);
        terms.forEach(function(term) {
          removePosting(field, term, id, record.fields[field].counts[term]);
        });
      }
      delete docs[id];
      delete records[id];
    }
    function add(id, doc) {
      var record;
      var field;
      var counts;
      var terms;
      var i;
      if (id == null) return;
      id = String(id);
      if (own(docs, id)) remove(id);
      if (order.indexOf(id) === -1) order.push(id);
      docs[id] = clone(doc || {});
      record = { id: id, fields: {}, length: 0 };
      for (i = 0; i < config.fields.length; i++) {
        field = config.fields[i];
        initField(field);
        record.fields[field] = fieldRecord(field, doc && own(doc, field) ? doc[field] : '');
        counts = record.fields[field].counts;
        terms = objectKeys(counts);
        terms.forEach(function(term) { addPosting(field, term, id, counts[term]); });
        record.length += record.fields[field].length;
      }
      records[id] = record;
    }
    function addAll(list, idField) {
      var i;
      idField = idField || 'id';
      list = Array.isArray(list) ? list : [];
      for (i = 0; i < list.length; i++) add(list[i] && list[i][idField], list[i]);
    }
    function update(id, doc) {
      remove(id);
      add(id, doc);
    }
    function clear() {
      docs = {};
      order = [];
      records = {};
      inverted = {};
      totals = {};
      config.fields.forEach(initField);
    }
    function idf(field, term) {
      var df = inverted[field] && inverted[field][term] ? inverted[field][term].df : 0;
      var count = getDocIds().length;
      return Math.log(1 + ((count + 1) / (df + 1))) + 1;
    }
    function resolveClauseFields(clause, searchFields) {
      return clause.field ? [clause.field] : searchFields;
    }
    function resolveClauseTerms(clause, searchFields, searchOpts) {
      var resolved = {};
      var fields = resolveClauseFields(clause, searchFields);
      var exact = normalizeQueryToken(clause.value);
      var fuzzy = Math.max(0, Number(searchOpts && searchOpts.fuzzy || 0) || 0);
      var prefix = !!(clause.wildcard || (searchOpts && searchOpts.prefix));
      var i;
      var field;
      var vocab;
      var j;
      var term;
      var distance;
      fields.forEach(function(name) { resolved[name] = []; });
      for (i = 0; i < fields.length; i++) {
        field = fields[i];
        if (!isIndexedField(field)) continue;
        vocab = collectTerms(field);
        for (j = 0; j < vocab.length; j++) {
          term = vocab[j];
          if (prefix && term.indexOf(exact) === 0) resolved[field].push({ term: term, distance: term === exact ? 0 : 0.25 });
          else if (term === exact) resolved[field].push({ term: term, distance: 0 });
          else if (fuzzy > 0) {
            distance = levenshtein(term, exact, fuzzy);
            if (distance <= fuzzy) resolved[field].push({ term: term, distance: distance });
          }
        }
      }
      return resolved;
    }
    function setFromIds(ids) {
      var map = {};
      var i;
      for (i = 0; i < ids.length; i++) map[ids[i]] = true;
      return map;
    }
    function idsFromSet(set) {
      return objectKeys(set || {});
    }
    function intersectSets(a, b) {
      var out = {};
      var keys = objectKeys(a);
      var i;
      for (i = 0; i < keys.length; i++) if (b[keys[i]]) out[keys[i]] = true;
      return out;
    }
    function subtractSets(a, b) {
      var out = {};
      var keys = objectKeys(a);
      var i;
      for (i = 0; i < keys.length; i++) if (!b[keys[i]]) out[keys[i]] = true;
      return out;
    }
    function unionInto(target, source) {
      var keys = objectKeys(source);
      var i;
      for (i = 0; i < keys.length; i++) target[keys[i]] = true;
      return target;
    }
    function phraseMatchesField(text, phrase) {
      return normalizePhraseText(text, config.caseSensitive).indexOf(normalizePhraseText(phrase, config.caseSensitive)) > -1;
    }
    function valueMatchesClause(value, clause, searchOpts) {
      var tokens;
      var exact;
      var i;
      if (clause.phrase) return phraseMatchesField(value, clause.value);
      tokens = tokenize(value, assign(config, { stopWords: false }));
      exact = normalizeQueryToken(clause.value);
      for (i = 0; i < tokens.length; i++) {
        if (clause.wildcard || (searchOpts && searchOpts.prefix)) {
          if (tokens[i].indexOf(exact) === 0) return true;
        } else if (tokens[i] === exact) return true;
        if ((searchOpts && searchOpts.fuzzy) > 0 && levenshtein(tokens[i], exact, searchOpts.fuzzy) <= searchOpts.fuzzy) return true;
      }
      if (Array.isArray(value)) {
        for (i = 0; i < value.length; i++) if (String(value[i]) === clause.value) return true;
      }
      return String(value) === clause.value;
    }
    function clauseDocSet(clause, searchFields, searchOpts, baseSet) {
      var out = {};
      var fields = resolveClauseFields(clause, searchFields);
      var resolved;
      var field;
      var ids;
      var i;
      var j;
      var postings;
      if (!clause.value) return out;
      if (clause.phrase || (clause.field && !isIndexedField(clause.field))) {
        ids = baseSet ? idsFromSet(baseSet) : getDocIds();
        for (i = 0; i < ids.length; i++) {
          for (j = 0; j < fields.length; j++) {
            field = fields[j];
            if (docs[ids[i]] && valueMatchesClause(docs[ids[i]][field], clause, searchOpts)) {
              out[ids[i]] = true;
              break;
            }
          }
        }
        return out;
      }
      resolved = resolveClauseTerms(clause, searchFields, searchOpts);
      for (i = 0; i < fields.length; i++) {
        field = fields[i];
        if (!isIndexedField(field)) continue;
        (resolved[field] || []).forEach(function(match) {
          postings = inverted[field] && inverted[field][match.term] ? inverted[field][match.term].postings : {};
          objectKeys(postings).forEach(function(id) {
            if (!baseSet || baseSet[id]) out[id] = true;
          });
        });
      }
      return out;
    }
    function matchesFilter(doc, filter) {
      var keys = objectKeys(filter || {});
      var i;
      var field;
      var value;
      for (i = 0; i < keys.length; i++) {
        field = keys[i];
        value = filter[field];
        if (Array.isArray(doc[field])) {
          if (doc[field].indexOf(value) === -1) return false;
        } else if (doc[field] !== value) return false;
      }
      return true;
    }
    function matchedTermsForDoc(id, parsed, searchFields, searchOpts) {
      var matched = {};
      var groups = parsed.groups || [];
      var g;
      var clause;
      var fields;
      var f;
      var resolved;
      for (g = 0; g < groups.length; g++) {
        for (f = 0; f < groups[g].include.length; f++) {
          clause = groups[g].include[f];
          fields = resolveClauseFields(clause, searchFields);
          if (clause.phrase) {
            fields.forEach(function(field) {
              if (docs[id] && valueMatchesClause(docs[id][field], clause, searchOpts)) {
                matched[field] = matched[field] || [];
                matched[field] = matched[field].concat(tokenize(clause.value, assign(config, { stopWords: false })));
              }
            });
          } else {
            resolved = resolveClauseTerms(clause, searchFields, searchOpts);
            fields.forEach(function(field) {
              var list = resolved[field] || [];
              var i;
              for (i = 0; i < list.length; i++) {
                if (records[id] && records[id].fields[field] && records[id].fields[field].counts[list[i].term]) {
                  matched[field] = matched[field] || [];
                  matched[field].push(list[i].term);
                }
              }
            });
          }
        }
      }
      objectKeys(matched).forEach(function(field) { matched[field] = unique(matched[field]); });
      return matched;
    }
    function scoreDoc(id, parsed, searchFields, searchOpts) {
      var score = 0;
      var boost = (searchOpts && searchOpts.boost) || {};
      var groups = parsed.groups || [];
      var g;
      var c;
      var clause;
      var fields;
      var field;
      var resolved;
      var list;
      var i;
      var record;
      var base;
      for (g = 0; g < groups.length; g++) {
        base = 0;
        for (c = 0; c < groups[g].include.length; c++) {
          clause = groups[g].include[c];
          fields = resolveClauseFields(clause, searchFields);
          if (clause.phrase) {
            for (i = 0; i < fields.length; i++) {
              field = fields[i];
              if (!docs[id] || !valueMatchesClause(docs[id][field], clause, searchOpts)) continue;
              base += ((boost[field] || 1) * Math.max(1, tokenize(clause.value, assign(config, { stopWords: false })).length) * 2.5);
            }
            continue;
          }
          resolved = resolveClauseTerms(clause, searchFields, searchOpts);
          for (i = 0; i < fields.length; i++) {
            field = fields[i];
            list = resolved[field] || [];
            record = records[id] && records[id].fields[field];
            if (!record) continue;
            list.forEach(function(match) {
              var freq = record.counts[match.term] || 0;
              if (!freq) return;
              var weight = (boost[field] || 1) * (1 / (1 + match.distance));
              var tf = freq / (0.25 + (record.length / 8));
              base += tf * idf(field, match.term) * weight;
            });
          }
        }
        score = Math.max(score, base);
      }
      return score;
    }
    function sortResults(rows, searchOpts) {
      var sort = searchOpts && searchOpts.sort;
      if (typeof sort === 'function') {
        rows.sort(sort);
        return rows;
      }
      if (typeof sort === 'string' && sort && sort !== 'score') {
        var desc = /:desc$/i.test(sort) || sort.charAt(0) === '-';
        var field = sort.replace(/^[-+]/, '').replace(/:(asc|desc)$/i, '');
        rows.sort(function(a, b) {
          var av = docs[a.id] ? docs[a.id][field] : undefined;
          var bv = docs[b.id] ? docs[b.id][field] : undefined;
          if (av === bv) return b.score - a.score;
          if (av == null) return 1;
          if (bv == null) return -1;
          return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
        });
        return rows;
      }
      rows.sort(function(a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.id).localeCompare(String(b.id));
      });
      return rows;
    }
    function computeFacets(field, ids) {
      var counts = {};
      var source = ids || getDocIds();
      var i;
      var values;
      var j;
      for (i = 0; i < source.length; i++) {
        if (!docs[source[i]]) continue;
        values = toArray(docs[source[i]][field]).filter(function(value) { return value != null && value !== ''; });
        for (j = 0; j < values.length; j++) counts[String(values[j])] = (counts[String(values[j])] || 0) + 1;
      }
      return objectKeys(counts).map(function(value) { return { value: value, count: counts[value] }; }).sort(sortByCount);
    }
    function search(query, opts) {
      var searchOpts = assign({ limit: 10, offset: 0, boost: {}, facets: [], filter: null }, opts || {});
      var parsed = typeof query === 'string' ? parseQuery(query) : (query || parseQuery(''));
      var searchFields = Array.isArray(searchOpts.fields) && searchOpts.fields.length ? searchOpts.fields.slice() : config.fields.slice();
      var baseIds = getDocIds().filter(function(id) { return !searchOpts.filter || matchesFilter(docs[id], searchOpts.filter); });
      var baseSet = setFromIds(baseIds);
      var groups = parsed.groups || [];
      var matched = {};
      var groupSet;
      var includeSet;
      var excludeSet;
      var g;
      var i;
      var results;
      if (!parsed.clauses || !parsed.clauses.length) matched = baseSet;
      for (g = 0; g < groups.length; g++) {
        groupSet = baseSet;
        for (i = 0; i < groups[g].include.length; i++) {
          includeSet = clauseDocSet(groups[g].include[i], searchFields, searchOpts, groupSet);
          groupSet = intersectSets(groupSet, includeSet);
        }
        for (i = 0; i < groups[g].exclude.length; i++) {
          excludeSet = clauseDocSet(groups[g].exclude[i], searchFields, searchOpts, groupSet);
          groupSet = subtractSets(groupSet, excludeSet);
        }
        unionInto(matched, groupSet);
      }
      results = idsFromSet(matched).map(function(id) {
        var terms = matchedTermsForDoc(id, parsed, searchFields, searchOpts);
        var row = { id: id, score: scoreDoc(id, parsed, searchFields, searchOpts), highlights: {} };
        objectKeys(terms).forEach(function(field) {
          row.highlights[field] = highlight(docs[id][field], terms[field], searchOpts.highlight || { contextWords: 5, maxLength: 180 });
        });
        return row;
      });
      sortResults(results, searchOpts);
      return {
        results: results.slice(Math.max(0, searchOpts.offset || 0), Math.max(0, searchOpts.offset || 0) + Math.max(0, Number(searchOpts.limit || results.length) || results.length)),
        total: results.length,
        facets: (searchOpts.facets || []).reduce(function(out, field) {
          out[field] = computeFacets(field, results.map(function(item) { return item.id; }));
          return out;
        }, {})
      };
    }
    function suggest(prefix, opts) {
      var cfg = assign({ limit: 10, fuzzy: 0, field: null }, opts || {});
      var normalized = normalizeQueryToken(prefix);
      var fields = cfg.field ? [cfg.field] : config.fields.slice();
      var counts = {};
      var score = {};
      var i;
      var j;
      var field;
      var terms;
      var term;
      var distance;
      for (i = 0; i < fields.length; i++) {
        field = fields[i];
        if (!isIndexedField(field)) continue;
        terms = collectTerms(field);
        for (j = 0; j < terms.length; j++) {
          term = terms[j];
          distance = term.indexOf(normalized) === 0 ? 0 : levenshtein(term, normalized, cfg.fuzzy || 0);
          if (term.indexOf(normalized) !== 0 && (!(cfg.fuzzy > 0) || distance > cfg.fuzzy)) continue;
          counts[term] = (counts[term] || 0) + (inverted[field][term] ? inverted[field][term].df : 0);
          score[term] = (score[term] || 0) + (totals[field][term] || 0) * (distance === 0 ? 2 : 1 / (1 + distance));
        }
      }
      return objectKeys(counts)
        .map(function(term) { return { term: term, score: Number((score[term] || 0).toFixed(4)), count: counts[term] }; })
        .sort(function(a, b) {
          if (b.score !== a.score) return b.score - a.score;
          return a.term.localeCompare(b.term);
        })
        .slice(0, Math.max(1, cfg.limit || 10));
    }
    function facets(field) { return computeFacets(field); }
    function filter(predicate) {
      var ids = getDocIds();
      if (typeof predicate !== 'function') return ids;
      return ids.filter(function(id) {
        try { return !!predicate(clone(docs[id]), id); }
        catch (_) { return false; }
      });
    }
    function exportIndex() {
      return {
        config: clone(config),
        docs: getDocIds().map(function(id) {
          var doc = clone(docs[id]);
          doc.id = own(doc, 'id') ? doc.id : id;
          return doc;
        })
      };
    }
    function importIndex(data) {
      var snapshot = data || {};
      clear();
      if (snapshot.config) {
        config = assign(config, snapshot.config);
        config.fields = Array.isArray(config.fields) && config.fields.length ? config.fields.slice() : ['title', 'body'];
      }
      (snapshot.docs || []).forEach(function(doc) {
        var id = own(doc, 'id') ? doc.id : null;
        add(id, doc);
      });
    }
    function stats() {
      var ids = getDocIds();
      var termMap = {};
      var indexSize = 0;
      var totalLength = 0;
      config.fields.forEach(function(field) {
        objectKeys(inverted[field] || {}).forEach(function(term) {
          termMap[term] = true;
          indexSize += objectKeys(inverted[field][term].postings).length;
        });
      });
      ids.forEach(function(id) { totalLength += records[id] ? records[id].length : 0; });
      return {
        docCount: ids.length,
        termCount: objectKeys(termMap).length,
        avgDocLength: ids.length ? totalLength / ids.length : 0,
        indexSize: indexSize
      };
    }
    function buildVector(id, opts) {
      var fields = Array.isArray(opts && opts.fields) && opts.fields.length ? opts.fields : config.fields;
      var boost = opts && opts.boost || {};
      var vector = {};
      fields.forEach(function(field) {
        var record = records[id] && records[id].fields[field];
        if (!record) return;
        objectKeys(record.counts).forEach(function(term) {
          vector[term] = (vector[term] || 0) + ((record.counts[term] / Math.max(1, record.length)) * idf(field, term) * (boost[field] || 1));
        });
      });
      return vector;
    }
    function vectorMagnitude(vector) {
      var total = 0;
      objectKeys(vector).forEach(function(key) { total += vector[key] * vector[key]; });
      return Math.sqrt(total);
    }
    function similar(id, opts) {
      var cfg = assign({ limit: 5, boost: {}, fields: null }, opts || {});
      var target = String(id);
      var source = buildVector(target, cfg);
      var sourceMagnitude = vectorMagnitude(source);
      var ids = getDocIds();
      var scores = [];
      var i;
      var other;
      var vector;
      var dot;
      var magnitude;
      if (!records[target] || !sourceMagnitude) return [];
      for (i = 0; i < ids.length; i++) {
        other = ids[i];
        if (other === target) continue;
        vector = buildVector(other, cfg);
        magnitude = vectorMagnitude(vector);
        if (!magnitude) continue;
        dot = 0;
        objectKeys(source).forEach(function(term) {
          if (vector[term]) dot += source[term] * vector[term];
        });
        if (dot > 0) scores.push({ id: other, score: dot / (sourceMagnitude * magnitude) });
      }
      scores.sort(function(a, b) { return b.score - a.score; });
      return scores.slice(0, Math.max(1, cfg.limit || 5));
    }
    config.fields = Array.isArray(config.fields) && config.fields.length ? config.fields.slice() : ['title', 'body'];
    clear();
    api = {
      add: add,
      addAll: addAll,
      remove: remove,
      update: update,
      search: search,
      suggest: suggest,
      facets: facets,
      filter: filter,
      clear: clear,
      import: importIndex,
      export: exportIndex,
      stats: stats,
      similar: similar,
      options: function() { return clone(config); }
    };
    return api;
  }

  var api = {
    createIndex: createIndex,
    tokenize: tokenize,
    stem: stem,
    highlight: highlight,
    pipeline: pipeline,
    query: { parse: parseQuery }
  };

  if (root && typeof root === 'object') root.BareMetal = BareMetal;
  return api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
if (typeof window !== 'undefined') window.BareMetal = BareMetal;
if (typeof module !== 'undefined') module.exports = BareMetal.Search;
else if (typeof exports !== 'undefined') exports.BareMetalSearch = BareMetal.Search;
