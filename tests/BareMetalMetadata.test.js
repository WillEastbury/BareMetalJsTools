/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs   = require('fs');

function loadMetadata() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Metadata.js'), 'utf8');
  const bm = {};
  const fn = new Function('document', 'BareMetal', code + '\nreturn BareMetal;');
  return fn(global.document, bm).Metadata;
}

describe('BareMetalMetadata – register & get', () => {
  let meta;
  beforeEach(() => { meta = loadMetadata(); });

  test('registers simple format and retrieves by slug', () => {
    meta.register({
      name: 'Customer',
      schema: { fields: { name: { type: 'text', label: 'Name' } } },
      layout: { fields: ['name'] }
    });
    const c = meta.get('customer');
    expect(c).not.toBeNull();
    expect(c.name).toBe('Customer');
    expect(c.slug).toBe('customer');
    expect(c.fields.name.label).toBe('Name');
  });

  test('registers rich format (array fields)', () => {
    meta.register({
      name: 'Order',
      fields: [
        { name: 'id', type: 'hidden', isIdField: true },
        { name: 'total', type: 'money', label: 'Total', required: true },
        { name: 'status', type: 'text', label: 'Status', enumValues: ['open', 'closed'] }
      ]
    });
    const o = meta.get('order');
    expect(o.fields.total.type).toBe('number');
    expect(o.fields.total.required).toBe(true);
    expect(o.fields.status.type).toBe('select');
    expect(o.fields.status.options).toHaveLength(2);
    expect(o.fields.id.hidden).toBe(true);
  });

  test('normalizeType preserves Country and Email casing', () => {
    meta.register({
      name: 'Contact',
      fields: [
        { name: 'country', type: 'Country' },
        { name: 'email', type: 'Email' }
      ]
    });
    const c = meta.get('contact');
    expect(c.fields.country.type).toBe('Country');
    expect(c.fields.email.type).toBe('Email');
  });

  test('list() returns registered slugs', () => {
    meta.register({ name: 'Alpha', schema: { fields: {} }, layout: { fields: [] } });
    meta.register({ name: 'Beta', schema: { fields: {} }, layout: { fields: [] } });
    expect(meta.list()).toContain('alpha');
    expect(meta.list()).toContain('beta');
  });

  test('remove() deletes entity', () => {
    meta.register({ name: 'Temp', schema: { fields: {} }, layout: { fields: [] } });
    expect(meta.remove('temp')).toBe(true);
    expect(meta.get('temp')).toBeNull();
    expect(meta.remove('temp')).toBe(false);
  });

  test('get() returns null for unknown slug', () => {
    expect(meta.get('nonexistent')).toBeNull();
  });

  test('generates default endpoint from slug', () => {
    meta.register({ name: 'Product', schema: { fields: {} }, layout: { fields: [] } });
    expect(meta.get('product').endpoint).toBe('/api/product');
  });

  test('custom endpoint is preserved', () => {
    meta.register({ name: 'Item', endpoint: '/v2/items', schema: { fields: {} }, layout: { fields: [] } });
    expect(meta.get('item').endpoint).toBe('/v2/items');
  });

  test('generates initialData with sensible defaults', () => {
    meta.register({
      name: 'Widget',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'count', type: 'number' },
        { name: 'active', type: 'boolean' }
      ]
    });
    const w = meta.get('widget');
    expect(w.initialData.label).toBe('');
    expect(w.initialData.count).toBe(0);
    expect(w.initialData.active).toBe(false);
  });
});

describe('BareMetalMetadata – scanInline', () => {
  let meta;
  beforeEach(() => { meta = loadMetadata(); });

  test('scans script[type=application/bm-meta] tags', () => {
    const script = document.createElement('script');
    script.type = 'application/bm-meta';
    script.textContent = JSON.stringify({
      name: 'InlineEntity',
      schema: { fields: { title: { type: 'text', label: 'Title' } } },
      layout: { fields: ['title'] }
    });
    document.body.appendChild(script);
    const results = meta.scanInline();
    expect(results.length).toBe(1);
    expect(meta.get('inlineentity')).not.toBeNull();
    document.body.removeChild(script);
  });

  test('skips malformed JSON tags', () => {
    const script = document.createElement('script');
    script.type = 'application/bm-meta';
    script.textContent = '{ broken json';
    document.body.appendChild(script);
    expect(() => meta.scanInline()).not.toThrow();
    document.body.removeChild(script);
  });
});

describe('BareMetalMetadata – toTemplateFields', () => {
  let meta;
  beforeEach(() => { meta = loadMetadata(); });

  test('returns fields and layout from slug', () => {
    meta.register({
      name: 'Task',
      schema: { fields: { name: { type: 'text' } } },
      layout: { fields: ['name'], columns: 2 }
    });
    const tf = meta.toTemplateFields('task');
    expect(tf.fields).toBeDefined();
    expect(tf.layout).toBeDefined();
    expect(tf.layout.columns).toBe(2);
  });

  test('returns null for unknown slug', () => {
    expect(meta.toTemplateFields('nope')).toBeNull();
  });
});
