/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

function loadTenant() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Tenant.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Tenant', () => {
  let Tenant;

  function addTenant(id, opts) {
    const tenant = Tenant.create(id, opts);
    Tenant.store.add(tenant);
    return tenant;
  }

  beforeEach(() => {
    Tenant = loadTenant();
  });

  test('create, add, get, remove, list, find and count work', () => {
    addTenant('root', { name: 'Root Org' });
    addTenant('child', { parent: 'root' });

    expect(Tenant.store.get('root')).toMatchObject({ id: 'root', name: 'Root Org', status: 'active' });
    expect(Tenant.store.list({ parent: 'root' }).map((tenant) => tenant.id)).toEqual(['child']);
    expect(Tenant.store.find((tenant) => tenant.id === 'root').id).toBe('root');
    expect(Tenant.store.count()).toBe(2);

    Tenant.store.remove('child');

    expect(Tenant.store.get('child')).toBeNull();
    expect(Tenant.store.count()).toBe(1);
  });

  test('current gets and sets tenant context', () => {
    addTenant('alpha');
    addTenant('beta');

    Tenant.current('alpha');
    expect(Tenant.current().id).toBe('alpha');

    Tenant.current('beta');
    expect(Tenant.current().id).toBe('beta');
  });

  test('scope isolates context and restores after sync work', () => {
    addTenant('alpha');
    addTenant('beta');
    Tenant.current('alpha');

    const active = Tenant.scope('beta', () => Tenant.current().id);

    expect(active).toBe('beta');
    expect(Tenant.current().id).toBe('alpha');
  });

  test('scope preserves context for promises and restores after async work', async () => {
    addTenant('alpha');
    addTenant('beta');
    Tenant.current('alpha');

    const seen = [];
    const result = await Tenant.scope('beta', () => {
      seen.push(Tenant.current().id);
      return Promise.resolve().then(() => {
        seen.push(Tenant.current().id);
        return 'done';
      });
    });

    expect(result).toBe('done');
    expect(seen).toEqual(['beta', 'beta']);
    expect(Tenant.current().id).toBe('alpha');
  });

  test('config inherits from parent and falls back to global defaults', () => {
    Tenant.config(null, 'timezone', 'UTC');
    addTenant('org', { config: { theme: 'dark', region: 'eu' } });
    addTenant('team', { parent: 'org', config: { region: 'us' } });

    expect(Tenant.config('team', 'theme')).toBe('dark');
    expect(Tenant.config('team', 'timezone')).toBe('UTC');
    expect(Tenant.config('team', 'region')).toBe('us');
  });

  test('isolate prefixes keys by current tenant', () => {
    addTenant('alpha');
    addTenant('beta');
    const cache = Tenant.isolate('cache');

    Tenant.current('alpha');
    cache.set('token', 'a1');

    Tenant.current('beta');
    cache.set('token', 'b1');

    Tenant.current('alpha');
    expect(cache.get('token')).toBe('a1');
    expect(cache.keys()).toEqual(['token']);

    Tenant.current('beta');
    expect(cache.get('token')).toBe('b1');
  });

  test('partition query filters items by tenant and supports add and move', () => {
    addTenant('alpha');
    addTenant('beta');
    const records = [
      { id: 1, tenantId: 'alpha', value: 'A' },
      { id: 2, tenantId: 'beta', value: 'B' }
    ];
    const partition = Tenant.partition(records, 'tenantId');

    expect(partition.query('alpha').map((item) => item.id)).toEqual([1]);

    partition.add('alpha', { id: 3, value: 'C' });
    partition.move(3, 'alpha', 'beta');

    expect(partition.query('beta').map((item) => item.id)).toEqual([2, 3]);
    expect(partition.counts()).toEqual({ alpha: 1, beta: 2 });
  });

  test('hierarchy returns parent, children, ancestors and descendants', () => {
    addTenant('org');
    addTenant('division', { parent: 'org' });
    addTenant('team', { parent: 'division' });

    const teamHierarchy = Tenant.hierarchy('team');
    const orgHierarchy = Tenant.hierarchy('org');

    expect(teamHierarchy.parent.id).toBe('division');
    expect(teamHierarchy.ancestors.map((tenant) => tenant.id)).toEqual(['division', 'org']);
    expect(orgHierarchy.children.map((tenant) => tenant.id)).toEqual(['division']);
    expect(orgHierarchy.descendants.map((tenant) => tenant.id)).toEqual(['division', 'team']);
  });

  test('limits check, consume and remaining values work per tenant', () => {
    addTenant('alpha');
    const limiter = Tenant.limits('alpha', { maxRequests: 5, maxUsers: 2 });

    expect(limiter.check('requests', 2)).toEqual({ allowed: true, remaining: 3, limit: 5 });
    expect(limiter.consume('requests', 2)).toEqual({ allowed: true, remaining: 3, limit: 5 });
    expect(Tenant.limits('alpha').check('requests', 4)).toEqual({ allowed: false, remaining: 0, limit: 5 });
  });

  test('features can be enabled, disabled and queried', () => {
    addTenant('alpha');
    const featureFlags = Tenant.features('alpha');

    featureFlags.enable('search');
    featureFlags.enable('export');

    expect(featureFlags.has('search')).toBe(true);
    expect(featureFlags.list()).toEqual(['search', 'export']);

    featureFlags.disable('search');
    expect(featureFlags.has('search')).toBe(false);
    expect(featureFlags.list()).toEqual(['export']);
  });

  test('onSwitch fires when tenant context changes', () => {
    addTenant('alpha');
    addTenant('beta');
    const switched = jest.fn();
    Tenant.onSwitch(switched);

    Tenant.current('alpha');
    Tenant.scope('beta', () => Tenant.current().id);

    expect(switched).toHaveBeenCalledTimes(3);
    expect(switched).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'alpha' }),
      null,
      expect.objectContaining({ reason: 'set' })
    );
    expect(switched).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'beta' }),
      expect.objectContaining({ id: 'alpha' }),
      expect.objectContaining({ reason: 'scope' })
    );
    expect(switched).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ id: 'alpha' }),
      expect.objectContaining({ id: 'beta' }),
      expect.objectContaining({ reason: 'restore' })
    );
  });

  test('resolve finds tenants from subdomain and header identifiers', () => {
    addTenant('alpha', { metadata: { subdomain: 'acme', header: 'X-Tenant-ID' } });

    expect(Tenant.resolve({ subdomain: 'acme' }).id).toBe('alpha');
    expect(Tenant.resolve({ header: 'X-Tenant-ID', headers: { 'X-Tenant-ID': 'alpha' } }).id).toBe('alpha');
  });

  test('suspend blocks tenant-scoped operations and activate restores them', () => {
    addTenant('alpha');

    Tenant.suspend('alpha');
    expect(() => Tenant.scope('alpha', () => 'nope')).toThrow(/suspended/);
    expect(() => Tenant.config('alpha', 'theme')).toThrow(/suspended/);

    Tenant.activate('alpha');
    expect(Tenant.scope('alpha', () => Tenant.current().id)).toBe('alpha');
  });

  test('seal makes tenant read-only', () => {
    addTenant('alpha');
    Tenant.config('alpha', 'theme', 'dark');
    Tenant.seal('alpha');

    expect(Tenant.config('alpha', 'theme')).toBe('dark');
    expect(() => Tenant.config('alpha', 'theme', 'light')).toThrow(/sealed/);
    expect(() => Tenant.features('alpha').enable('search')).toThrow(/sealed/);
  });

  test('export and import round-trip tenant data', () => {
    addTenant('alpha', {
      name: 'Alpha',
      config: { theme: 'dark' },
      metadata: { subdomain: 'acme' }
    });
    Tenant.limits('alpha', { maxStorage: 100, maxRequests: 10, features: ['search'] });
    Tenant.features('alpha').enable('export');

    const snapshot = Tenant.export('alpha');
    const ImportedTenant = loadTenant();
    ImportedTenant.import(snapshot);

    expect(ImportedTenant.store.get('alpha')).toMatchObject({ id: 'alpha', name: 'Alpha', status: 'active' });
    expect(ImportedTenant.config('alpha', 'theme')).toBe('dark');
    expect(ImportedTenant.resolve({ subdomain: 'acme' }).id).toBe('alpha');
    expect(ImportedTenant.limits('alpha').check('storage', 25)).toEqual({ allowed: true, remaining: 75, limit: 100 });
    expect(ImportedTenant.features('alpha').list().sort()).toEqual(['export', 'search']);
    expect(typeof snapshot.created).toBe('string');
  });
});

describe('branch coverage - Tenant', () => {
  let Tenant;

  function addTenant(id, opts) {
    const tenant = Tenant.create(id, opts);
    Tenant.store.add(tenant);
    return tenant;
  }

  beforeEach(() => {
    Tenant = loadTenant();
  });

  test('current, scope, middleware, and store removal cover missing and restore branches', () => {
    expect(Tenant.current()).toBeNull();
    expect(() => Tenant.create()).toThrow('Tenant id is required');

    addTenant('alpha');
    addTenant('beta', { parent: 'alpha' });

    expect(Tenant.scope('alpha').id).toBe('alpha');
    Tenant.current('alpha');
    expect(Tenant.resolve(null).id).toBe('alpha');
    expect(Tenant.middleware((tenantId, value) => ({ tenantId, current: Tenant.current().id, value }))('x'))
      .toEqual({ tenantId: 'alpha', current: 'alpha', value: 'x' });
    expect(() => Tenant.scope('beta', () => { throw new Error('boom'); })).toThrow('boom');
    expect(Tenant.current().id).toBe('alpha');
    expect(Tenant.impersonate('beta', () => Tenant.current().id)).toBe('beta');
    expect(Tenant.current().id).toBe('alpha');

    Tenant.store.remove('alpha');
    expect(Tenant.current()).toBeNull();
    expect(() => Tenant.current('missing')).toThrow(/Unknown tenant/);
  });

  test('tenant-scoped storage and config cover no-context, global, inheritance, and mutation branches', () => {
    const changes = [];
    const cache = Tenant.isolate('session');
    const offChange = Tenant.onChange((event) => changes.push(event.type));

    addTenant('org', {
      config: { theme: 'dark' },
      metadata: { subdomain: 'acme', header: 'X-Tenant-ID', headers: ['x-tenant-id'], claim: 'tid' }
    });
    addTenant('team', { parent: 'org', config: { region: 'eu' } });

    expect(() => cache.get('token')).toThrow(/No current tenant context/);

    Tenant.config(null, { locale: 'en-GB' });
    expect(Tenant.config('team')).toEqual({ locale: 'en-GB', theme: 'dark', region: 'eu' });
    expect(Tenant.config('team', 'theme')).toBe('dark');
    expect(Tenant.config('team', { theme: 'light', timezone: 'UTC' })).toEqual({
      locale: 'en-GB',
      theme: 'light',
      region: 'eu',
      timezone: 'UTC'
    });
    expect(Tenant.config('team', 'timezone')).toBe('UTC');

    Tenant.current('team');
    cache.set('token', 't1');
    cache.set('temp', { ok: true });
    cache.delete('temp');
    expect(cache.keys()).toEqual(['token']);
    expect(cache.get('token')).toBe('t1');
    cache.clear();
    expect(cache.keys()).toEqual([]);

    expect(Tenant.resolve({ path: '/t/acme' }).id).toBe('org');
    expect(Tenant.resolve({ header: 'x-tenant-id', headers: { 'X-Tenant-ID': 'org' } }).id).toBe('org');
    expect(Tenant.resolve({ claim: 'tid', claims: { TID: 'org' } }).id).toBe('org');
    expect(changes).toContain('config');

    offChange();
  });

  test('partition, hierarchy, limits, features, and import cover fallback and reset branches', () => {
    addTenant('root', { limits: { maxStorage: 10, features: ['search'] }, usage: { storage: 9 } });
    addTenant('child', { parent: 'root' });

    Tenant.current('root');
    expect(Tenant.hierarchy().children.map((tenant) => tenant.id)).toEqual(['child']);

    const partition = Tenant.partition([{ id: 1, tenantId: 'root' }]);
    expect(partition.move(99, 'root', 'child')).toBeNull();
    expect(partition.query('root', (item) => item.id === 1)).toEqual([{ id: 1, tenantId: 'root' }]);

    const limiter = Tenant.limits('root');
    expect(limiter.check('storage', 2)).toEqual({ allowed: false, remaining: 0, limit: 10 });
    expect(limiter.check('users', 1)).toEqual({ allowed: true, remaining: Infinity, limit: null });
    limiter.reset('storage');
    expect(Tenant.limits('root').check('storage', 1)).toEqual({ allowed: true, remaining: 9, limit: 10 });
    Tenant.limits('root', { maxUsers: '3', features: ['search', 'export'] });
    expect(Tenant.features('root').enable('search')).toEqual(['search', 'export']);
    expect(Tenant.features('root').disable('search')).toEqual(['export']);

    expect(() => Tenant.import({})).toThrow('Tenant import requires an id');

    const sealed = Tenant.seal('root');
    expect(sealed.sealed).toBe(true);
    expect(() => Tenant.store.add({ id: 'root', sealed: false })).toThrow(/sealed/);
  });
});
