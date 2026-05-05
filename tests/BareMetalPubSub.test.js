/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadPubSub() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.PubSub.js'), 'utf8');
  const fn = new Function('BareMetal', 'module', code + '\nreturn BareMetal.PubSub;');
  return fn({}, { exports: {} });
}

describe('BareMetal.PubSub', () => {
  let PubSub;

  beforeEach(() => {
    PubSub = loadPubSub();
    PubSub.clear();
  });

  test('basic on, emit, and off work', () => {
    const handler = jest.fn();
    const unsub = PubSub.on('user.login', handler);

    PubSub.emit('user.login', { id: 1 }, { source: 'auth' });

    expect(handler).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({ topic: 'user.login', source: 'auth' })
    );

    unsub();
    PubSub.emit('user.login', { id: 2 });
    expect(handler).toHaveBeenCalledTimes(1);

    PubSub.on('user.login', handler);
    PubSub.off('user.login', handler);
    PubSub.emit('user.login', { id: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('once fires once then auto-removes', () => {
    const handler = jest.fn();

    PubSub.once('ready', handler);
    PubSub.emit('ready', 1);
    PubSub.emit('ready', 2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1, expect.objectContaining({ topic: 'ready' }));
  });

  test('wildcards match * and ** with exact match priority', () => {
    const order = [];

    PubSub.on('user.login', () => order.push('exact'));
    PubSub.on('user.*', () => order.push('single'));
    PubSub.on('user.**', () => order.push('deep'));

    PubSub.emit('user.login', {});
    PubSub.emit('user.profile.update', {});

    expect(order).toEqual(['exact', 'single', 'deep', 'deep']);
  });

  test('namespaced unsubscribe removes matching subscriptions', () => {
    const handler = jest.fn();

    PubSub.on('click', handler, { ns: 'myComponent' });
    PubSub.on('hover', handler, { ns: 'myComponent' });
    PubSub.offNs('myComponent');

    PubSub.emit('click', {});
    PubSub.emit('hover', {});

    expect(handler).not.toHaveBeenCalled();
  });

  test('sticky immediately replays the last emitted value to new subscribers', () => {
    const handler = jest.fn();

    PubSub.sticky('settings.loaded', { theme: 'dark' }, { source: 'boot' });
    PubSub.on('settings.loaded', handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      { theme: 'dark' },
      expect.objectContaining({ topic: 'settings.loaded', source: 'boot' })
    );
  });

  test('channel replays buffered history to new subscribers', () => {
    const channel = PubSub.channel('user', { replay: 2 });
    const handler = jest.fn();

    channel.emit({ id: 1 });
    channel.emit({ id: 2 });
    channel.emit({ id: 3 });
    channel.subscribe(handler);

    expect(handler.mock.calls.map((call) => call[0])).toEqual([{ id: 2 }, { id: 3 }]);
    expect(channel.history()).toEqual([{ id: 2 }, { id: 3 }]);
    expect(channel.last()).toEqual({ id: 3 });

    channel.destroy();
  });

  test('channel validate rejects invalid data', () => {
    const channel = PubSub.channel('validated', {
      replay: 1,
      validate: function(data) { return data && data.id; }
    });
    const handler = jest.fn();
    channel.subscribe(handler);

    expect(channel.emit({})).toBe(false);
    expect(handler).not.toHaveBeenCalled();

    expect(channel.emit({ id: 7, name: 'Alice' })).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(channel.last()).toEqual({ id: 7, name: 'Alice' });
  });

  test('request and response pattern resolves returned values', async () => {
    PubSub.handle('api.getUser', function(request) {
      return { id: request.id, name: 'Alice' };
    });

    await expect(PubSub.request('api.getUser', { id: 1 })).resolves.toEqual({ id: 1, name: 'Alice' });
  });

  test('middleware supports blocking and pass-through', () => {
    const handler = jest.fn();
    const seen = [];

    PubSub.use(function(topic, data, next) {
      seen.push(topic + ':' + !!data.authorized);
      next();
    });
    PubSub.use('user.*', function(topic, data, next) {
      if (!data.authorized) return;
      next();
    });
    PubSub.on('user.login', handler);

    PubSub.emit('user.login', { authorized: false });
    PubSub.emit('user.login', { authorized: true });

    expect(seen).toEqual(['user.login:false', 'user.login:true']);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      { authorized: true },
      expect.objectContaining({ topic: 'user.login' })
    );
  });

  test('create returns isolated buses', () => {
    const bus1 = PubSub.create();
    const bus2 = PubSub.create();
    const one = jest.fn();
    const two = jest.fn();

    bus1.on('ping', one);
    bus2.on('ping', two);
    bus1.emit('ping', 1);
    bus2.emit('ping', 2);

    expect(one).toHaveBeenCalledTimes(1);
    expect(one).toHaveBeenCalledWith(1, expect.objectContaining({ topic: 'ping' }));
    expect(two).toHaveBeenCalledTimes(1);
    expect(two).toHaveBeenCalledWith(2, expect.objectContaining({ topic: 'ping' }));
  });

  test('topics, subscribers, and has expose subscriber state', () => {
    PubSub.on('user.login', function() {});
    PubSub.on('user.*', function() {});

    expect(PubSub.topics().sort()).toEqual(['user.*', 'user.login']);
    expect(PubSub.subscribers('user.login')).toBe(2);
    expect(PubSub.has('user.login')).toBe(true);
    expect(PubSub.has('admin.login')).toBe(false);
  });

  test('offAll and clear remove subscriptions', async () => {
    const a = jest.fn();
    const b = jest.fn();

    PubSub.on('alpha', a);
    PubSub.on('beta', b);
    PubSub.offAll('alpha');
    PubSub.emit('alpha', 1);
    PubSub.emit('beta', 2);

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);

    PubSub.handle('api.clear', function() { return 'ok'; });
    PubSub.clear();
    expect(PubSub.topics()).toEqual([]);
    await expect(PubSub.request('api.clear', {})).rejects.toThrow('No handler for api.clear');
  });
});
