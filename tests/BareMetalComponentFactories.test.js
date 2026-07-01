/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.ComponentFactories.js');

function loadFactories() {
  delete require.cache[SRC];
  return require(SRC);
}

describe('BareMetal.ComponentFactories', () => {
  let Factories;
  let timeSpy;

  beforeEach(() => {
    timeSpy = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('12:34');
    Factories = loadFactories();
  });

  afterEach(() => {
    timeSpy.mockRestore();
    jest.restoreAllMocks();
  });

  test('create.message builds a default user message', () => {
    expect(Factories.create.message('Hello')).toEqual({
      text: 'Hello',
      from: 'user',
      time: '12:34'
    });
  });

  test('create.message merges options overrides', () => {
    expect(Factories.create.message('Hello', { from: 'system', id: 1 })).toEqual({
      text: 'Hello',
      from: 'system',
      time: '12:34',
      id: 1
    });
  });

  test('create.botMessage defaults to bot sender', () => {
    expect(Factories.create.botMessage('Hi')).toEqual({
      text: 'Hi',
      from: 'bot',
      time: '12:34'
    });
  });

  test('create.toast provides default type and duration', () => {
    expect(Factories.create.toast('Saved')).toEqual({
      message: 'Saved',
      type: 'info',
      duration: '5s'
    });
  });

  test('create.calendarEvent maps date and label', () => {
    expect(Factories.create.calendarEvent('2026-07-01', 'Launch', { color: 'red' })).toEqual({
      date: '2026-07-01',
      label: 'Launch',
      color: 'red'
    });
  });

  test('create.ganttTask includes progress default', () => {
    expect(Factories.create.ganttTask('Build', '2026-07-01', '2026-07-02')).toEqual({
      label: 'Build',
      start: '2026-07-01',
      end: '2026-07-02',
      progress: 0
    });
  });

  test('create.treeNode includes default children array', () => {
    expect(Factories.create.treeNode('Root')).toEqual({
      label: 'Root',
      children: []
    });
  });

  test('create.treeNode allows overriding children', () => {
    const child = { label: 'Child' };
    expect(Factories.create.treeNode('Root', { children: [child], expanded: true })).toEqual({
      label: 'Root',
      children: [child],
      expanded: true
    });
  });

  test('create.tableRow clones the provided object', () => {
    const row = { id: 1, name: 'Ada' };
    const created = Factories.create.tableRow(row);

    expect(created).toEqual(row);
    expect(created).not.toBe(row);
  });

  test('create.navLink defaults href to hash', () => {
    expect(Factories.create.navLink('Home')).toEqual({
      text: 'Home',
      href: '#'
    });
  });

  test('create.navDropdown returns a title followed by links', () => {
    expect(Factories.create.navDropdown('Menu', { text: 'A' }, { text: 'B' })).toEqual([
      'Menu',
      { text: 'A' },
      { text: 'B' }
    ]);
  });

  test('create.listItem merges id with supplied data', () => {
    expect(Factories.create.listItem('k1', { value: 3 })).toEqual({
      id: 'k1',
      value: 3
    });
  });

  test('chatEndpoint returns a curried sender function', () => {
    const send = Factories.chatEndpoint('chat.messages', '/chat');
    const state = { chat: { messages: [] } };
    const invoke = send(state);

    expect(typeof invoke).toBe('function');
    invoke('Hi there');
    expect(state.chat.messages).toHaveLength(1);
  });

  test('chatEndpoint appends a default user message using fallback path lookup', () => {
    const state = { chat: { messages: [] } };
    Factories.chatEndpoint('chat.messages', '/chat')(state)('Hello');

    expect(state.chat.messages[0]).toEqual({
      text: 'Hello',
      from: 'user',
      time: '12:34'
    });
  });

  test('chatEndpoint does nothing when the messages path is not an array', () => {
    const state = { chat: { messages: null } };
    expect(() => Factories.chatEndpoint('chat.messages', '/chat')(state)('Hello')).not.toThrow();
    expect(state.chat.messages).toBeNull();
  });

  test('chatEndpoint does not attempt network calls without shared BareMetal communications', () => {
    const state = { messages: [] };
    Factories.chatEndpoint('messages', '/chat', { method: 'PUT' })(state)('Ping');

    expect(state.messages).toEqual([{
      text: 'Ping',
      from: 'user',
      time: '12:34'
    }]);
  });
});
