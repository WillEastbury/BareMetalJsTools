/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

function loadInbox() {
  const srcPath = path.resolve(__dirname, '../src/BareMetal.Inbox.js');
  jest.resetModules();
  delete require.cache[require.resolve(srcPath)];
  return require(srcPath);
}

describe('BareMetal.Inbox', () => {
  let Inbox;
  let realLocalStorage;

  beforeEach(() => {
    Inbox = loadInbox();
    realLocalStorage = globalThis.localStorage;
  });

  afterEach(() => {
    if (jest.isMockFunction(Date.now)) Date.now.mockRestore();
    if (globalThis.localStorage !== realLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', { value: realLocalStorage, configurable: true, writable: true });
    }
    jest.useRealTimers();
  });

  test('push adds item with defaults', () => {
    const onNew = jest.fn();
    const inbox = Inbox.create({ onNew });

    const item = inbox.push({ title: 'Build finished' });

    expect(item).toEqual(expect.objectContaining({
      channel: 'general',
      title: 'Build finished',
      body: '',
      priority: 'normal',
      read: false,
      dismissed: false,
      pinned: false
    }));
    expect(typeof item.id).toBe('string');
    expect(typeof item.timestamp).toBe('number');
    expect(inbox.get(item.id)).toEqual(item);
    expect(onNew).toHaveBeenCalledWith(expect.objectContaining({ id: item.id }));
  });

  test('markRead and markAllRead update state', () => {
    const onRead = jest.fn();
    const inbox = Inbox.create({ onRead });
    const alpha = inbox.push({ channel: 'alpha', title: 'One' });
    const beta = inbox.push({ channel: 'beta', title: 'Two' });

    inbox.markRead(alpha.id);
    inbox.markAllRead('beta');

    expect(inbox.get(alpha.id).read).toBe(true);
    expect(inbox.get(beta.id).read).toBe(true);
    expect(onRead).toHaveBeenCalledTimes(2);
  });

  test('unread and unreadCount support channel filtering', () => {
    const inbox = Inbox.create();
    const a1 = inbox.push({ channel: 'alpha', title: 'One' });
    const a2 = inbox.push({ channel: 'alpha', title: 'Two' });
    const b1 = inbox.push({ channel: 'beta', title: 'Three' });

    inbox.markRead(a1.id);
    inbox.dismiss(b1.id);

    expect(inbox.unread().map((item) => item.id)).toEqual([a2.id]);
    expect(inbox.unread('alpha').map((item) => item.id)).toEqual([a2.id]);
    expect(inbox.unreadCount('alpha')).toBe(1);
    expect(inbox.unreadCount('beta')).toBe(0);
  });

  test('channels reports per-channel counts', () => {
    const inbox = Inbox.create({ channels: ['ops'] });
    const ops = inbox.push({ channel: 'ops', title: 'Pager' });
    inbox.push({ channel: 'sales', title: 'Lead' });
    inbox.markRead(ops.id);

    expect(inbox.channels()).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'ops', unread: 0, total: 1 }),
      expect.objectContaining({ name: 'sales', unread: 1, total: 1 })
    ]));
  });

  test('mute suppresses onNew callback but still stores items', () => {
    const onNew = jest.fn();
    const inbox = Inbox.create({ onNew });

    inbox.mute('ops');
    const item = inbox.push({ channel: 'ops', title: 'Muted alert' });

    expect(onNew).not.toHaveBeenCalled();
    expect(inbox.get(item.id)).toEqual(expect.objectContaining({ channel: 'ops', title: 'Muted alert' }));
  });

  test('preferences quiet hours suppress sound and onNew', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T23:30:00'));
    const onNew = jest.fn();
    const inbox = Inbox.create({ onNew });

    inbox.preferences({ quiet: { from: '22:00', to: '07:00' } });
    inbox.push({ channel: 'alerts', title: 'Night shift' });

    expect(inbox.sound('alerts')).toBe(false);
    expect(onNew).not.toHaveBeenCalled();
  });

  test('subscribe fires on push for the matching channel', () => {
    const inbox = Inbox.create();
    const seen = jest.fn();
    const unsub = inbox.subscribe('deploy', seen);

    inbox.push({ channel: 'deploy', title: 'Start' });
    inbox.push({ channel: 'ops', title: 'Ignore' });
    unsub();
    inbox.push({ channel: 'deploy', title: 'Stop' });

    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ channel: 'deploy', title: 'Start' }));
  });

  test('group and collapse summarise grouped notifications', () => {
    const inbox = Inbox.create();

    inbox.push({ channel: 'deploy', title: 'Started', priority: 'low', group: 'release-1' });
    inbox.push({ channel: 'deploy', title: 'Failed', priority: 'urgent', group: 'release-1' });

    expect(inbox.group('release-1').map((item) => item.title)).toEqual(['Failed', 'Started']);
    expect(inbox.collapse('release-1')).toEqual(expect.objectContaining({
      group: 'release-1',
      priority: 'urgent',
      summary: true,
      read: false
    }));
    expect(inbox.collapse('release-1').data).toEqual(expect.objectContaining({ count: 2, unread: 2 }));
  });

  test('clear removes notifications older than a timestamp', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T10:00:00'));
    const inbox = Inbox.create();
    const oldItem = inbox.push({ title: 'Old' });

    jest.setSystemTime(new Date('2024-01-01T12:00:00'));
    const freshItem = inbox.push({ title: 'Fresh' });

    inbox.clear({ olderThan: new Date('2024-01-01T11:00:00') });

    expect(inbox.get(oldItem.id)).toBeNull();
    expect(inbox.get(freshItem.id)).toEqual(expect.objectContaining({ title: 'Fresh' }));
  });

  test('export and import round-trip inbox state', () => {
    const inbox = Inbox.create();
    const item = inbox.push({ channel: 'ops', title: 'Persist me', group: 'batch' });
    inbox.addChannel('ops', { muted: true, color: 'red' });
    inbox.preferences({ channels: { ops: { sound: false, badge: false } } });
    inbox.markRead(item.id);
    inbox.pin(item.id);
    const snapshot = inbox.export();

    const restored = Inbox.create();
    restored.import(snapshot);

    expect(restored.export()).toEqual(snapshot);
  });

  test('badge counts honour channel badge preferences', () => {
    const inbox = Inbox.create();
    inbox.push({ channel: 'ops', title: 'One' });
    inbox.push({ channel: 'sales', title: 'Two' });
    inbox.preferences({ channels: { sales: { badge: false } } });

    expect(inbox.badge()).toEqual({ count: 1, channels: { ops: 1, sales: 0 } });
  });

  test('search matches title and body text', () => {
    const inbox = Inbox.create();
    const titleHit = inbox.push({ title: 'Server down', body: 'CPU steady' });
    const bodyHit = inbox.push({ title: 'Healthy', body: 'Investigate noisy fan' });

    expect(inbox.search('server').map((item) => item.id)).toEqual([titleHit.id]);
    expect(inbox.search('noisy fan').map((item) => item.id)).toEqual([bodyHit.id]);
  });

  test('pin and unpin affect ordering', () => {
    const inbox = Inbox.create();
    const first = inbox.push({ title: 'First', priority: 'low' });
    const second = inbox.push({ title: 'Second', priority: 'urgent' });

    inbox.pin(first.id);
    expect(inbox.all().map((item) => item.id)[0]).toBe(first.id);

    inbox.unpin(first.id);
    expect(inbox.all().map((item) => item.id)[0]).toBe(second.id);
  });

  test('priority ordering is urgent then high then normal then low', () => {
    const inbox = Inbox.create();
    inbox.push({ title: 'Normal', priority: 'normal' });
    inbox.push({ title: 'Low', priority: 'low' });
    inbox.push({ title: 'Urgent', priority: 'urgent' });
    inbox.push({ title: 'High', priority: 'high' });

    expect(inbox.all().map((item) => item.title)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  });

  test('localStorage persistence reloads saved notifications', () => {
    const store = {};
    const mockStorage = {
      getItem: jest.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
      setItem: jest.fn((key, value) => { store[key] = String(value); }),
      removeItem: jest.fn((key) => { delete store[key]; })
    };
    Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, configurable: true, writable: true });

    const first = Inbox.create({ persist: 'localStorage', key: 'BareMetal.Inbox:test' });
    const item = first.push({ channel: 'persisted', title: 'Saved' });
    const second = Inbox.create({ persist: 'localStorage', key: 'BareMetal.Inbox:test' });

    expect(mockStorage.setItem).toHaveBeenCalled();
    expect(second.get(item.id)).toEqual(expect.objectContaining({ channel: 'persisted', title: 'Saved' }));
  });
});
