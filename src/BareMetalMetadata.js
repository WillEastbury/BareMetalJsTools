// BareMetalMetadata — client-side entity schema registry
const BareMetalMetadata = (() => {
  'use strict';

  const registry = {};

  function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function normalizeType(type) {
    if (!type) return 'text';
    const lower = type.toLowerCase();
    if (lower === 'country') return 'Country';
    if (lower === 'email') return 'Email';
    if (lower === 'select') return 'select';
    if (lower === 'number' || lower === 'integer' || lower === 'decimal' || lower === 'money') return 'number';
    if (lower === 'boolean' || lower === 'bool') return 'boolean';
    if (lower === 'date') return 'date';
    if (lower === 'datetime' || lower === 'datetime-local') return 'datetime-local';
    if (lower === 'textarea') return 'textarea';
    if (lower === 'file') return 'file';
    if (lower === 'hidden') return 'hidden';
    return type;
  }

  function convertRichFormat(meta) {
    const slug = meta.slug || toSlug(meta.name);
    const fields = {};
    const layoutFields = [];
    const initialData = {};

    for (const f of meta.fields) {
      const fd = {
        type: normalizeType(f.type),
        label: f.label || f.name
      };
      if (f.required) fd.required = true;
      if (f.readOnly || f.isIdField) fd.readOnly = true;
      if (f.isIdField) fd.hidden = true;
      if (f.enumValues && f.enumValues.length) {
        fd.type = 'select';
        fd.options = f.enumValues.map(v => ({ value: v, label: v }));
      }
      if (f.list !== undefined) fd.list = f.list;
      if (f.edit !== undefined) fd.edit = f.edit;
      if (f.create !== undefined) fd.create = f.create;

      fields[f.name] = fd;

      if (!fd.hidden) layoutFields.push(f.name);
      initialData[f.name] = fd.type === 'number' ? 0 : fd.type === 'checkbox' ? false : '';
    }

    return {
      name: meta.name,
      slug: slug,
      endpoint: meta.endpoint || '/api/' + slug,
      fields: fields,
      layout: { type: 'form', columns: 1, fields: layoutFields },
      initialData: initialData
    };
  }

  function normalizeSimpleFormat(meta) {
    const slug = meta.slug || toSlug(meta.name);
    const fields = meta.schema && meta.schema.fields ? meta.schema.fields : {};
    const layoutFields = meta.layout && meta.layout.fields
      ? meta.layout.fields
      : Object.keys(fields);
    const initialData = meta.initialData || {};
    for (const k of Object.keys(fields)) {
      if (!(k in initialData)) initialData[k] = '';
    }
    return {
      name: meta.name,
      slug: slug,
      endpoint: meta.endpoint || '/api/' + slug,
      fields: fields,
      layout: {
        type: (meta.layout && meta.layout.type) || 'form',
        columns: (meta.layout && meta.layout.columns) || 1,
        fields: layoutFields
      },
      initialData: initialData
    };
  }

  function isRichFormat(meta) {
    return Array.isArray(meta.fields);
  }

  function register(meta) {
    const normalized = isRichFormat(meta) ? convertRichFormat(meta) : normalizeSimpleFormat(meta);
    registry[normalized.slug] = normalized;
    return normalized;
  }

  function get(slug) {
    return registry[slug] || null;
  }

  function list() {
    return Object.keys(registry);
  }

  function remove(slug) {
    const existed = slug in registry;
    delete registry[slug];
    return existed;
  }

  function scanInline() {
    const tags = document.querySelectorAll('script[type="application/bm-meta"]');
    const results = [];
    for (const tag of tags) {
      try {
        const meta = JSON.parse(tag.textContent);
        results.push(register(meta));
      } catch (e) {
        // skip malformed tags
      }
    }
    return results;
  }

  function fetchAndRegister(url) {
    var promise;
    if (typeof BareMetalRest !== 'undefined') {
      promise = BareMetalRest.call(url, 'GET');
    } else {
      promise = fetch(url).then(function (r) { return r.json(); });
    }
    return promise.then(function (data) {
      return register(data);
    });
  }

  function toTemplateFields(meta) {
    if (typeof meta === 'string') meta = get(meta);
    if (!meta) return null;
    return { fields: meta.fields, layout: meta.layout };
  }

  function renderForm(slug, rootElement, state, watch) {
    var meta = typeof slug === 'string' ? get(slug) : slug;
    if (!meta) throw new Error('Unknown entity: ' + slug);

    var form = null;
    if (typeof BareMetalTemplate !== 'undefined') {
      form = BareMetalTemplate.buildForm(meta.layout, meta.fields);
      rootElement.appendChild(form);
    }

    if (!state && typeof BareMetalBind !== 'undefined') {
      var pair = BareMetalBind.create
        ? BareMetalBind.create(Object.assign({}, meta.initialData))
        : { state: Object.assign({}, meta.initialData), watch: function () {} };
      state = pair.state;
      watch = pair.watch || watch;
    }

    if (state && watch && typeof BareMetalBind !== 'undefined') {
      BareMetalBind.bind(rootElement, state, watch);
    }

    return { form: form, state: state || null, watch: watch || null };
  }

  function renderTable(slug, rootElement, items, callbacks) {
    var meta = typeof slug === 'string' ? get(slug) : slug;
    if (!meta) throw new Error('Unknown entity: ' + slug);

    var table = null;
    if (typeof BareMetalTemplate !== 'undefined') {
      table = BareMetalTemplate.buildTable(meta.fields, items, callbacks);
      rootElement.appendChild(table);
    }
    return table;
  }

  const PACK0_HEADER = [0x7D, 0xCA, 0x01, 0x00];
  const TYPE_MAP = {
    1: 'text',
    2: 'number',
    3: 'number',
    4: 'checkbox',
    5: 'date',
    6: 'datetime-local',
    7: 'text'
  };

  function fromBinary(buffer) {
    if (typeof BareMetalBinary === 'undefined') {
      throw new Error('BareMetalBinary is required for fromBinary');
    }

    var view = new DataView(buffer);
    for (var i = 0; i < 4; i++) {
      if (view.getUint8(i) !== PACK0_HEADER[i]) {
        throw new Error('Invalid Pack-0 header');
      }
    }

    var offset = 4;

    // ord 0: pack name (length-prefixed ASCII)
    var nameLen = view.getUint8(offset++);
    var packName = '';
    for (var j = 0; j < nameLen; j++) {
      packName += String.fromCharCode(view.getUint8(offset++));
    }

    // ord 1: field count
    var fieldCount = view.getUint8(offset++);

    // ord 2: field defs, 3 bytes each [ord, type, maxlen]
    var fieldDefs = [];
    for (var k = 0; k < fieldCount; k++) {
      fieldDefs.push({
        ord: view.getUint8(offset),
        typeByte: view.getUint8(offset + 1),
        maxLen: view.getUint8(offset + 2)
      });
      offset += 3;
    }

    // ord 5: field names (\0-separated ASCII)
    var namesRaw = '';
    while (offset < buffer.byteLength) {
      var ch = view.getUint8(offset++);
      namesRaw += ch === 0 ? '\0' : String.fromCharCode(ch);
    }
    var fieldNames = namesRaw.split('\0').filter(function (n) { return n.length > 0; });

    var slug = toSlug(packName);
    var fields = {};
    var layoutFields = [];
    var initialData = {};

    for (var m = 0; m < fieldCount; m++) {
      var def = fieldDefs[m];
      var fname = fieldNames[m] || ('field' + m);
      var ftype = TYPE_MAP[def.typeByte] || 'text';
      fields[fname] = {
        type: ftype,
        label: fname.charAt(0).toUpperCase() + fname.slice(1)
      };
      if (def.maxLen > 0) fields[fname].maxLength = def.maxLen;
      layoutFields.push(fname);
      initialData[fname] = ftype === 'number' ? 0 : ftype === 'checkbox' ? false : '';
    }

    var meta = {
      name: packName,
      slug: slug,
      endpoint: '/api/' + slug,
      fields: fields,
      layout: { type: 'form', columns: 1, fields: layoutFields },
      initialData: initialData
    };

    register(meta);
    return meta;
  }

  return {
    register: register,
    get: get,
    list: list,
    remove: remove,
    scanInline: scanInline,
    fetchAndRegister: fetchAndRegister,
    renderForm: renderForm,
    renderTable: renderTable,
    toTemplateFields: toTemplateFields,
    fromBinary: fromBinary
  };
})();