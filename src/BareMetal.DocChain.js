var __bmDocChainRoot = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
__bmDocChainRoot.BareMetal = __bmDocChainRoot.BareMetal || ((typeof BareMetal !== 'undefined' && BareMetal) ? BareMetal : {});
var BareMetal = __bmDocChainRoot.BareMetal;

BareMetal.DocChain = (function(){
  'use strict';

  var typeDefs = {};
  var typeTemplates = {};
  var docs = {};
  var linksStore = [];
  var transitionHooks = [];
  var createHooks = [];
  var deriveHooks = [];
  var docSeq = 0;
  var linkSeq = 0;

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isArray(v) { return Array.isArray(v); }
  function isObject(v) { return !!v && Object.prototype.toString.call(v) === '[object Object]'; }
  function now(ts) { return ts == null ? Date.now() : ts; }
  function clone(v) {
    var out, i, k;
    if (v == null || typeof v !== 'object') return v;
    if (v instanceof Date) return new Date(v.getTime());
    if (isArray(v)) {
      out = [];
      for (i = 0; i < v.length; i++) out[i] = clone(v[i]);
      return out;
    }
    out = {};
    for (k in v) if (own(v, k)) out[k] = clone(v[k]);
    return out;
  }
  function merge(a, b) {
    var out = clone(a) || {};
    var k;
    for (k in (b || {})) if (own(b, k)) out[k] = clone(b[k]);
    return out;
  }
  function list(v) { return isArray(v) ? v.slice() : []; }
  function unique(listIn) {
    var out = [], seen = {}, i, key;
    for (i = 0; i < (listIn || []).length; i++) {
      key = String(listIn[i]);
      if (!seen[key]) {
        seen[key] = true;
        out.push(listIn[i]);
      }
    }
    return out;
  }
  function indexOf(listIn, value) {
    var i;
    for (i = 0; i < listIn.length; i++) if (listIn[i] === value) return i;
    return -1;
  }
  function removeAt(listIn, value) {
    var i = indexOf(listIn, value);
    if (i >= 0) listIn.splice(i, 1);
  }
  function sanitizeName(name) {
    return String(name == null ? '' : name).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'doc';
  }
  function makeId(type) {
    docSeq += 1;
    return sanitizeName(type) + '-' + docSeq;
  }
  function makeLinkId() {
    linkSeq += 1;
    return 'link-' + linkSeq;
  }
  function resolveDoc(doc) {
    if (!doc) return null;
    if (typeof doc === 'string') return docs[doc] || null;
    if (doc && doc.id && docs[doc.id]) return docs[doc.id];
    return doc && doc.id ? doc : null;
  }
  function ensureDoc(doc) {
    var found = resolveDoc(doc);
    if (!found) throw new Error('Document not found');
    return found;
  }
  function ensureType(name) {
    var key = String(name || '');
    if (!key || !typeDefs[key]) throw new Error('Unknown document type: ' + key);
    return typeDefs[key];
  }
  function normalizeLifecycle(rules) {
    var out = { initial: 'draft', terminal: [], transitions: {} };
    var k;
    if (!isObject(rules)) return out;
    if (typeof rules.initial === 'string' && rules.initial) out.initial = rules.initial;
    out.terminal = unique(list(rules.terminal));
    if (isObject(rules.transitions)) {
      for (k in rules.transitions) if (own(rules.transitions, k)) out.transitions[k] = unique(list(rules.transitions[k]));
    }
    return out;
  }
  function normalizeTypeOpts(opts) {
    var cfg = isObject(opts) ? opts : {};
    return {
      name: cfg.name || null,
      fields: clone(cfg.fields) || {},
      allowedChildren: unique(list(cfg.allowedChildren)),
      allowedTransitions: unique(list(cfg.allowedTransitions)),
      meta: clone(cfg.meta) || {},
      lifecycle: normalizeLifecycle(cfg.lifecycle)
    };
  }
  function defaultStatus(typeDef) {
    return typeDef.lifecycle && typeDef.lifecycle.initial ? typeDef.lifecycle.initial : 'draft';
  }
  function touch(doc, timestamp) {
    doc.updated = now(timestamp);
    doc.version = (doc.version || 0) + 1;
    return doc;
  }
  function record(doc, entry) {
    doc.auditTrail = doc.auditTrail || [];
    doc.auditTrail.push({
      timestamp: now(entry && entry.timestamp),
      action: entry && entry.action || 'change',
      from: own(entry || {}, 'from') ? clone(entry.from) : null,
      to: own(entry || {}, 'to') ? clone(entry.to) : null,
      actor: entry && entry.actor || null,
      reason: entry && entry.reason || null
    });
    return doc.auditTrail[doc.auditTrail.length - 1];
  }
  function fire(listIn, payload) {
    var i;
    for (i = 0; i < listIn.length; i++) {
      try { listIn[i](payload); } catch (_) {}
    }
  }
  function hookMatch(expected, actual) {
    return expected == null || expected === '*' || expected === actual;
  }
  function canTransition(doc, newStatus) {
    var typeDef = ensureType(doc.type);
    var rules = typeDef.lifecycle || normalizeLifecycle();
    var allowed = own(rules.transitions, doc.status) ? list(rules.transitions[doc.status]) : list(typeDef.allowedTransitions);
    if (doc.status === newStatus) return { valid: false, reason: 'Document is already ' + newStatus };
    if (indexOf(list(rules.terminal), doc.status) >= 0) return { valid: false, reason: 'Document is in terminal state ' + doc.status };
    if (!allowed.length) return { valid: false, reason: 'No transitions are allowed for ' + doc.type };
    if (indexOf(allowed, newStatus) < 0) return { valid: false, reason: 'Transition to ' + newStatus + ' is not allowed' };
    return { valid: true };
  }
  function fieldTypeMatches(expected, value) {
    if (expected == null || expected === 'any') return true;
    if (expected === 'array') return isArray(value);
    if (expected === 'date') return value instanceof Date || Object.prototype.toString.call(value) === '[object Date]' || typeof value === 'string' || typeof value === 'number';
    if (expected === 'object') return isObject(value);
    if (typeof expected === 'string') return typeof value === expected;
    if (typeof expected === 'function') return value instanceof expected;
    return true;
  }
  function collectFieldErrors(doc, errors) {
    var typeDef = ensureType(doc.type);
    var fields = typeDef.fields;
    var names, i, name, spec, required, value, expectedType;
    if (isArray(fields)) {
      for (i = 0; i < fields.length; i++) {
        name = fields[i];
        if (doc.data[name] == null) errors.push('Missing required field: ' + name);
      }
      return;
    }
    if (!isObject(fields)) return;
    names = Object.keys(fields);
    for (i = 0; i < names.length; i++) {
      name = names[i];
      spec = fields[name];
      value = doc.data[name];
      required = spec === true;
      expectedType = null;
      if (typeof spec === 'string') expectedType = spec;
      else if (typeof spec === 'function') expectedType = spec;
      else if (isObject(spec)) {
        expectedType = own(spec, 'type') ? spec.type : null;
        required = !!spec.required;
      }
      if (required && (value == null || value === '')) errors.push('Missing required field: ' + name);
      else if (value != null && expectedType && !fieldTypeMatches(expectedType, value)) errors.push('Field ' + name + ' should be ' + expectedType);
    }
  }
  function validate(doc, rules) {
    var target = ensureDoc(doc);
    var cfg = isObject(rules) ? rules : {};
    var errors = [];
    var parent;
    collectFieldErrors(target, errors);
    if (target.parentId) {
      parent = docs[target.parentId];
      if (!parent) errors.push('Parent document not found');
      else if (indexOf(ensureType(parent.type).allowedChildren, target.type) < 0) errors.push('Parent type ' + parent.type + ' cannot create child type ' + target.type);
    }
    if (cfg.newStatus || cfg.to || cfg.status) {
      parent = canTransition(target, cfg.newStatus || cfg.to || cfg.status);
      if (!parent.valid) errors.push(parent.reason);
    }
    return { valid: !errors.length, errors: errors };
  }
  function storeAdd(doc) {
    if (!doc || !doc.id) throw new Error('Document must have an id');
    docs[doc.id] = doc;
    if (doc.parentId && docs[doc.parentId]) {
      if (indexOf(docs[doc.parentId].children, doc.id) < 0) docs[doc.parentId].children.push(doc.id);
    }
    return doc;
  }
  function unlinkFromParent(doc) {
    var parent = doc && doc.parentId ? docs[doc.parentId] : null;
    if (parent) removeAt(parent.children, doc.id);
  }
  function storeRemove(id) {
    var doc = resolveDoc(id), children, i;
    if (!doc) return null;
    children = list(doc.children);
    for (i = 0; i < children.length; i++) storeRemove(children[i]);
    unlinkFromParent(doc);
    linksStore = findLinks(doc, 'both', true);
    delete docs[doc.id];
    return doc;
  }
  function allDocs() {
    var out = [], k;
    for (k in docs) if (own(docs, k)) out.push(docs[k]);
    out.sort(function(a, b) { return (a.created || 0) - (b.created || 0); });
    return out;
  }
  function byParent(parentId) {
    var id = typeof parentId === 'string' ? parentId : (parentId && parentId.id);
    return allDocs().filter(function(doc) { return doc.parentId === id; });
  }
  function findLinks(doc, direction, internalPurge) {
    var target = ensureDoc(doc);
    var mode = direction || 'both';
    var out = [];
    var kept = [];
    var i, link;
    for (i = 0; i < linksStore.length; i++) {
      link = linksStore[i];
      if (internalPurge) {
        if (link.from !== target.id && link.to !== target.id) kept.push(link);
        continue;
      }
      if ((mode === 'from' || mode === 'both') && link.from === target.id) out.push(clone(link));
      else if ((mode === 'to' || mode === 'both') && link.to === target.id) out.push(clone(link));
    }
    if (internalPurge) {
      linksStore = kept;
      return kept;
    }
    return out;
  }
  function storeClear() {
    docs = {};
    linksStore = [];
    docSeq = 0;
    linkSeq = 0;
    return api.store;
  }
  function createDoc(type, data, opts) {
    var typeDef = ensureType(type);
    var cfg = isObject(opts) ? opts : {};
    var parent = cfg.parent ? ensureDoc(cfg.parent) : null;
    var timestamp = now(cfg.timestamp);
    var doc = {
      id: cfg.id || makeId(type),
      type: String(type),
      data: clone(data) || {},
      status: cfg.status || defaultStatus(typeDef),
      parentId: parent ? parent.id : null,
      children: [],
      created: timestamp,
      updated: timestamp,
      version: 1,
      meta: merge(typeDef.meta, cfg.meta),
      auditTrail: []
    };
    if (parent && indexOf(ensureType(parent.type).allowedChildren, doc.type) < 0) throw new Error('Child type ' + doc.type + ' is not allowed for parent type ' + parent.type);
    storeAdd(doc);
    record(doc, { timestamp: timestamp, action: 'create', to: doc.status, actor: cfg.actor || null, reason: cfg.reason || null });
    fire(createHooks.filter(function(entry) { return hookMatch(entry.type, doc.type); }).map(function(entry) { return entry.handler; }), { doc: doc, parent: parent });
    return doc;
  }
  function derive(parent, childType, data, opts) {
    var source = ensureDoc(parent);
    var cfg = isObject(opts) ? opts : {};
    var typeDef = ensureType(source.type);
    var inherited = {};
    var inherit = list(cfg.inherit);
    var transform = isObject(cfg.transform) ? cfg.transform : {};
    var payload = clone(data) || {};
    var i, field, child;
    if (indexOf(typeDef.allowedChildren, childType) < 0) throw new Error('Child type ' + childType + ' is not allowed for parent type ' + source.type);
    for (i = 0; i < inherit.length; i++) {
      field = inherit[i];
      if (own(source.data, field) && !own(payload, field)) inherited[field] = clone(source.data[field]);
    }
    payload = merge(inherited, payload);
    for (field in transform) if (own(transform, field) && typeof transform[field] === 'function') payload[field] = transform[field](clone(source.data[field]), source, clone(payload));
    child = createDoc(childType, payload, {
      id: cfg.id,
      parent: source,
      status: cfg.status,
      meta: cfg.meta,
      timestamp: cfg.timestamp,
      actor: cfg.actor,
      reason: cfg.reason
    });
    record(child, { timestamp: cfg.timestamp, action: 'derive', from: source.id, to: child.id, actor: cfg.actor || null, reason: cfg.reason || null });
    fire(deriveHooks.filter(function(entry) {
      return hookMatch(entry.parentType, source.type) && hookMatch(entry.childType, child.type);
    }).map(function(entry) { return entry.handler; }), { parent: source, child: child });
    return child;
  }
  function transition(doc, newStatus, opts) {
    var target = ensureDoc(doc);
    var cfg = isObject(opts) ? opts : {};
    var result = canTransition(target, newStatus);
    var previous;
    if (!result.valid) throw new Error(result.reason);
    previous = target.status;
    target.status = newStatus;
    touch(target, cfg.timestamp);
    record(target, { timestamp: cfg.timestamp, action: 'transition', from: previous, to: newStatus, actor: cfg.actor || null, reason: cfg.reason || null });
    fire(transitionHooks.filter(function(entry) {
      return hookMatch(entry.type, target.type) && hookMatch(entry.from, previous) && hookMatch(entry.to, newStatus);
    }).map(function(entry) { return entry.handler; }), {
      doc: target,
      from: previous,
      to: newStatus,
      actor: cfg.actor || null,
      reason: cfg.reason || null,
      timestamp: now(cfg.timestamp)
    });
    return target;
  }
  function chain(doc) {
    var current = ensureDoc(doc);
    var out = [];
    while (current) {
      out.push(current);
      current = current.parentId ? docs[current.parentId] : null;
    }
    out.reverse();
    return out.map(function(item, index) { return { doc: item, depth: index }; });
  }
  function lineage(doc) {
    return chain(doc).slice(0, -1).map(function(entry) { return entry.doc; });
  }
  function descendants(doc, opts) {
    var root = ensureDoc(doc);
    var cfg = isObject(opts) ? opts : {};
    var maxDepth = cfg.depth == null ? Infinity : cfg.depth;
    var out = [];
    walk(root, 0);
    return out;

    function walk(node, depth) {
      var i, child;
      if (depth >= maxDepth) return;
      for (i = 0; i < node.children.length; i++) {
        child = docs[node.children[i]];
        if (!child) continue;
        if ((cfg.type == null || child.type === cfg.type) && (cfg.status == null || child.status === cfg.status)) out.push(child);
        walk(child, depth + 1);
      }
    }
  }
  function tree(rootDoc) {
    var root = ensureDoc(rootDoc);
    return build(root);
    function build(doc) {
      return {
        doc: doc,
        children: doc.children.map(function(id) { return docs[id]; }).filter(Boolean).map(build)
      };
    }
  }
  function find(predicate) {
    return allDocs().filter(function(doc, index) {
      return typeof predicate === 'function' ? !!predicate(doc, index) : false;
    });
  }
  function query(opts) {
    var cfg = isObject(opts) ? opts : {};
    return allDocs().filter(function(doc) {
      if (cfg.type != null && doc.type !== cfg.type) return false;
      if (cfg.status != null && doc.status !== cfg.status) return false;
      if (cfg.parentId != null && doc.parentId !== cfg.parentId) return false;
      if (cfg.createdAfter != null && doc.created <= cfg.createdAfter) return false;
      if (cfg.createdBefore != null && doc.created >= cfg.createdBefore) return false;
      if (cfg.hasChildren === true && !doc.children.length) return false;
      if (cfg.hasChildren === false && !!doc.children.length) return false;
      return true;
    });
  }
  function link(docA, docB, relation) {
    var from = ensureDoc(docA);
    var to = ensureDoc(docB);
    var rel = relation || 'references';
    var item = { id: makeLinkId(), from: from.id, to: to.id, relation: rel, created: Date.now() };
    linksStore.push(item);
    record(from, { action: 'link', from: from.id, to: to.id, reason: rel });
    record(to, { action: 'link', from: from.id, to: to.id, reason: rel });
    return clone(item);
  }
  function labelFor(doc) {
    var source = doc.data || {};
    return source.title || source.name || source.number || source.invoiceNo || source.poNumber || (doc.type + ' [' + doc.status + ']');
  }
  function visualize(rootDoc) {
    var root = ensureDoc(rootDoc);
    var nodes = [];
    var edges = [];
    var seen = {};
    var included = {};
    walk(root, 0);
    appendLinks();
    return { nodes: nodes, edges: edges };

    function walk(doc, depth) {
      var i, child;
      if (seen[doc.id]) return;
      seen[doc.id] = true;
      included[doc.id] = true;
      nodes.push({ id: doc.id, label: labelFor(doc), type: doc.type, status: doc.status, depth: depth });
      for (i = 0; i < doc.children.length; i++) {
        child = docs[doc.children[i]];
        if (!child) continue;
        edges.push({ from: doc.id, to: child.id, source: doc.id, target: child.id, relation: 'child' });
        walk(child, depth + 1);
      }
    }
    function appendLinks() {
      var i, item;
      for (i = 0; i < linksStore.length; i++) {
        item = linksStore[i];
        if (included[item.from] && included[item.to]) edges.push({ from: item.from, to: item.to, source: item.from, target: item.to, relation: item.relation });
      }
    }
  }
  function audit(doc) {
    return clone(ensureDoc(doc).auditTrail || []);
  }
  function lifecycle(type, rules) {
    var typeDef = ensureType(type);
    if (rules === undefined) return clone(typeDef.lifecycle);
    typeDef.lifecycle = normalizeLifecycle(rules);
    return clone(typeDef.lifecycle);
  }
  function serialize(input) {
    var root = null;
    var seen = {};
    var chainDocs = [];
    var usedTypes = {};
    if (isArray(input)) chainDocs = input.map(ensureDoc);
    else if (input && input.doc && input.children) chainDocs = flattenTree(input);
    else {
      root = ensureDoc(input);
      root = chain(root)[0].doc;
      chainDocs = [root].concat(descendants(root));
    }
    chainDocs.forEach(function(doc) { usedTypes[doc.type] = true; });
    return {
      rootId: root ? root.id : (chainDocs[0] ? chainDocs[0].id : null),
      docs: chainDocs.map(snapshotDoc),
      types: Object.keys(usedTypes).reduce(function(out, typeName) {
        out[typeName] = clone(typeDefs[typeName]);
        return out;
      }, {}),
      links: linksStore.filter(function(item) {
        return !!findDoc(chainDocs, item.from) && !!findDoc(chainDocs, item.to);
      }).map(clone)
    };

    function flattenTree(node) {
      var out = [ensureDoc(node.doc)], i;
      for (i = 0; i < node.children.length; i++) out = out.concat(flattenTree(node.children[i]));
      return out;
    }
  }
  function snapshotDoc(doc) {
    return {
      id: doc.id,
      type: doc.type,
      data: clone(doc.data),
      status: doc.status,
      parentId: doc.parentId,
      children: list(doc.children),
      created: doc.created,
      updated: doc.updated,
      version: doc.version,
      meta: clone(doc.meta),
      auditTrail: clone(doc.auditTrail || [])
    };
  }
  function findDoc(listIn, id) {
    var i;
    for (i = 0; i < listIn.length; i++) if (listIn[i].id === id) return listIn[i];
    return null;
  }
  function deserialize(data) {
    var payload = isObject(data) ? data : {};
    var docList = list(payload.docs);
    var types = isObject(payload.types) ? payload.types : {};
    var i, name, raw, doc, match;
    for (name in types) if (own(types, name)) defineType(name, types[name]);
    for (i = 0; i < docList.length; i++) {
      raw = docList[i];
      doc = {
        id: raw.id,
        type: raw.type,
        data: clone(raw.data) || {},
        status: raw.status,
        parentId: raw.parentId || null,
        children: list(raw.children),
        created: raw.created,
        updated: raw.updated,
        version: raw.version || 1,
        meta: clone(raw.meta) || {},
        auditTrail: clone(raw.auditTrail) || []
      };
      match = /-(\d+)$/.exec(doc.id);
      if (match) docSeq = Math.max(docSeq, parseInt(match[1], 10));
      storeAdd(doc);
    }
    if (isArray(payload.links)) {
      payload.links.forEach(function(item) {
        match = /^link-(\d+)$/.exec(item.id || '');
        if (match) linkSeq = Math.max(linkSeq, parseInt(match[1], 10));
        linksStore.push(clone(item));
      });
    }
    return payload.rootId ? docs[payload.rootId] || null : (docList[0] ? docs[docList[0].id] : null);
  }
  function onTransition(type, from, to, handler) {
    var entry = { type: type, from: from, to: to, handler: handler };
    if (typeof handler !== 'function') return function() {};
    transitionHooks.push(entry);
    return function() { removeAt(transitionHooks, entry); };
  }
  function onCreate(type, handler) {
    var entry = { type: type, handler: handler };
    if (typeof handler !== 'function') return function() {};
    createHooks.push(entry);
    return function() { removeAt(createHooks, entry); };
  }
  function onDerive(parentType, childType, handler) {
    var entry = { parentType: parentType, childType: childType, handler: handler };
    if (typeof handler !== 'function') return function() {};
    deriveHooks.push(entry);
    return function() { removeAt(deriveHooks, entry); };
  }
  function template(type, defaults) {
    var typeDef = ensureType(type);
    var base = {};
    var fields = typeDef.fields;
    var names, i, key, spec;
    if (defaults !== undefined) typeTemplates[type] = clone(defaults) || {};
    if (isObject(fields)) {
      names = Object.keys(fields);
      for (i = 0; i < names.length; i++) {
        key = names[i];
        spec = fields[key];
        if (isObject(spec) && own(spec, 'default')) base[key] = clone(spec.default);
      }
    }
    base = merge(base, typeTemplates[type] || {});
    return { type: type, data: base, status: defaultStatus(typeDef), meta: clone(typeDef.meta) };
  }
  function cloneDoc(doc, opts) {
    var source = ensureDoc(doc);
    var cfg = isObject(opts) ? opts : {};
    return copyNode(source, null);

    function copyNode(node, parentCopy) {
      var copied = {
        id: makeId(node.type),
        type: node.type,
        data: clone(node.data),
        status: cfg.resetStatus ? defaultStatus(ensureType(node.type)) : node.status,
        parentId: parentCopy ? parentCopy.id : null,
        children: [],
        created: Date.now(),
        updated: Date.now(),
        version: 1,
        meta: clone(node.meta) || {},
        auditTrail: clone(node.auditTrail || [])
      };
      storeAdd(copied);
      if (cfg.includeChildren) {
        node.children.map(function(id) { return docs[id]; }).filter(Boolean).forEach(function(child) {
          copyNode(child, copied);
        });
      }
      return copied;
    }
  }
  function combineValue(left, right) {
    var out, key;
    if (right == null) return clone(left);
    if (left == null) return clone(right);
    if (isArray(left) && isArray(right)) return unique(left.concat(right).map(clone));
    if (isObject(left) && isObject(right)) {
      out = clone(left);
      for (key in right) if (own(right, key)) out[key] = own(out, key) ? combineValue(out[key], right[key]) : clone(right[key]);
      return out;
    }
    if (left === right) return clone(left);
    return unique([left, right]);
  }
  function mergeDocs(docList, strategy) {
    var items = isArray(docList) ? docList.map(ensureDoc) : [];
    var mode = typeof strategy === 'string' ? strategy : 'custom';
    var resolver = typeof strategy === 'function' ? strategy : null;
    var base, mergedData, i;
    if (!items.length) throw new Error('At least one document is required');
    if (resolver) return resolver(items.slice());
    base = items[0];
    if (mode === 'first') mergedData = clone(items[0].data);
    else if (mode === 'last') mergedData = clone(items[items.length - 1].data);
    else {
      mergedData = {};
      for (i = 0; i < items.length; i++) mergedData = combineValue(mergedData, items[i].data);
    }
    return createDoc(base.type, mergedData, {
      status: base.status,
      meta: merge(base.meta, { mergedFrom: items.map(function(doc) { return doc.id; }) })
    });
  }
  function defineType(name, opts) {
    var key = String(name || '');
    if (!key) throw new Error('Type name is required');
    typeDefs[key] = normalizeTypeOpts(opts);
    typeDefs[key].name = key;
    return clone(typeDefs[key]);
  }

  var api = {
    defineType: defineType,
    create: createDoc,
    derive: derive,
    transition: transition,
    chain: chain,
    lineage: lineage,
    descendants: descendants,
    tree: tree,
    find: find,
    query: query,
    link: link,
    links: function(doc, direction) { return findLinks(doc, direction || 'both', false); },
    visualize: visualize,
    audit: audit,
    lifecycle: lifecycle,
    validate: validate,
    serialize: serialize,
    deserialize: deserialize,
    onTransition: onTransition,
    onCreate: onCreate,
    onDerive: onDerive,
    template: template,
    clone: cloneDoc,
    merge: mergeDocs,
    store: {
      add: storeAdd,
      get: function(id) { return docs[id] || null; },
      remove: storeRemove,
      all: allDocs,
      clear: storeClear,
      byType: function(type) { return allDocs().filter(function(doc) { return doc.type === type; }); },
      byStatus: function(status) { return allDocs().filter(function(doc) { return doc.status === status; }); },
      byParent: byParent,
      roots: function() { return allDocs().filter(function(doc) { return !doc.parentId; }); }
    }
  };

  return api;
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.DocChain;
else if (typeof exports !== 'undefined') exports.DocChain = BareMetal.DocChain;
