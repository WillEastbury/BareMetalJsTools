/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.UndoRedo.js');

function loadUndoRedo(platform) {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const fn = new Function('BareMetal', 'module', 'document', 'navigator', code + '\nreturn BareMetal.UndoRedo;');
  return fn({}, { exports: {} }, global.document, { platform: platform || 'Win32' });
}

describe('BareMetal.UndoRedo', () => {
  test('push, undo and redo basic flow', () => {
    const UndoRedo = loadUndoRedo();
    const state = { value: 0 };
    const history = UndoRedo.create();

    history.exec({
      name: 'Set One',
      execute: function() { state.value = 1; },
      undo: function() { state.value = 0; }
    });

    expect(state.value).toBe(1);
    expect(history.undo()).toBe(true);
    expect(state.value).toBe(0);
    expect(history.redo()).toBe(true);
    expect(state.value).toBe(1);
  });

  test('tracks canUndo and canRedo state changes', () => {
    const UndoRedo = loadUndoRedo();
    const undoChanges = [];
    const redoChanges = [];
    const history = UndoRedo.create({
      onCanUndoChange: function(can) { undoChanges.push(can); },
      onCanRedoChange: function(can) { redoChanges.push(can); }
    });

    history.push({ name: 'A', execute: function() {}, undo: function() {} });
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(history.undoName()).toBe('A');

    history.undo();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
    expect(history.redoName()).toBe('A');

    history.redo();
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(undoChanges).toEqual([true, false, true]);
    expect(redoChanges).toEqual([true, false]);
  });

  test('clears redo stack on new push', () => {
    const UndoRedo = loadUndoRedo();
    const state = { value: 0 };
    const history = UndoRedo.create();

    history.exec({
      name: 'One',
      execute: function() { state.value = 1; },
      undo: function() { state.value = 0; }
    });
    history.undo();
    history.exec({
      name: 'Two',
      execute: function() { state.value = 2; },
      undo: function() { state.value = 0; }
    });

    expect(history.canRedo()).toBe(false);
    expect(history.redoName()).toBe(null);
    expect(history.undoName()).toBe('Two');
  });

  test('grouping undoes multiple commands as one step', () => {
    const UndoRedo = loadUndoRedo();
    const state = { list: [] };
    const history = UndoRedo.create();

    history.group('Batch Edit', function() {
      history.exec({
        name: 'A',
        execute: function() { state.list.push('a'); },
        undo: function() { state.list.pop(); }
      });
      history.exec({
        name: 'B',
        execute: function() { state.list.push('b'); },
        undo: function() { state.list.pop(); }
      });
      history.exec({
        name: 'C',
        execute: function() { state.list.push('c'); },
        undo: function() { state.list.pop(); }
      });
    });

    expect(state.list).toEqual(['a', 'b', 'c']);
    expect(history.undoName()).toBe('Batch Edit');
    expect(history.undo()).toBe(true);
    expect(state.list).toEqual([]);
    expect(history.redo()).toBe(true);
    expect(state.list).toEqual(['a', 'b', 'c']);
  });

  test('enforces maxSize limit', () => {
    const UndoRedo = loadUndoRedo();
    const history = UndoRedo.create({ maxSize: 2 });

    history.push({ name: 'One', execute: function() {}, undo: function() {} });
    history.push({ name: 'Two', execute: function() {}, undo: function() {} });
    history.push({ name: 'Three', execute: function() {}, undo: function() {} });

    expect(history.size()).toBe(2);
    expect(history.undoName()).toBe('Three');
    expect(history.undo()).toBe(true);
    expect(history.undoName()).toBe('Two');
    expect(history.undo()).toBe(true);
    expect(history.canUndo()).toBe(false);
  });

  test('snapshot mode stores and restores cloned states', () => {
    const UndoRedo = loadUndoRedo();
    const snapHistory = UndoRedo.createSnap();

    snapHistory.snapshot({ count: 1, nested: { ok: true } });
    snapHistory.snapshot({ count: 2, nested: { ok: false } });

    const prev = snapHistory.undo();
    prev.nested.ok = false;

    expect(prev).toEqual({ count: 1, nested: { ok: false } });
    expect(snapHistory.current()).toEqual({ count: 1, nested: { ok: true } });
    expect(snapHistory.redo()).toEqual({ count: 2, nested: { ok: false } });
  });

  test('checkpoint and revertTo undo back to a marked point', () => {
    const UndoRedo = loadUndoRedo();
    const state = { value: 0 };
    const history = UndoRedo.create();
    const checkpoint = history.checkpoint();

    history.exec({
      name: 'One',
      execute: function() { state.value = 1; },
      undo: function() { state.value = 0; }
    });
    history.exec({
      name: 'Two',
      execute: function() { state.value = 2; },
      undo: function() { state.value = 1; }
    });

    expect(state.value).toBe(2);
    expect(history.revertTo(checkpoint)).toBe(true);
    expect(state.value).toBe(0);
    expect(history.canRedo()).toBe(true);
  });

  test('supports event hooks and off()', () => {
    const UndoRedo = loadUndoRedo();
    const history = UndoRedo.create();
    const pushSpy = jest.fn();
    const undoSpy = jest.fn();
    const redoSpy = jest.fn();
    const clearSpy = jest.fn();

    history.on('push', pushSpy);
    history.on('undo', undoSpy);
    history.on('redo', redoSpy);
    history.on('clear', clearSpy);

    history.push({ name: 'A', execute: function() {}, undo: function() {} });
    history.undo();
    history.redo();
    history.off('push', pushSpy);
    history.push({ name: 'B', execute: function() {}, undo: function() {} });
    history.clear();

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(undoSpy).toHaveBeenCalledTimes(1);
    expect(redoSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  test('clear and clearRedo reset history state', () => {
    const UndoRedo = loadUndoRedo();
    const history = UndoRedo.create();

    history.push({ name: 'A', execute: function() {}, undo: function() {} });
    history.undo();
    history.clearRedo();
    expect(history.canRedo()).toBe(false);
    expect(history.size()).toBe(0);

    history.push({ name: 'B', execute: function() {}, undo: function() {} });
    history.clear();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.size()).toBe(0);
  });

  test('serializes and restores history stacks', () => {
    const UndoRedo = loadUndoRedo();
    const history = UndoRedo.create();

    history.push({ name: 'A', execute: function() {}, undo: function() {}, data: { id: 1 } });
    history.push({ name: 'B', execute: function() {}, undo: function() {}, data: { id: 2 } });
    history.undo();

    const json = history.toJSON();
    const restored = UndoRedo.create();
    restored.fromJSON(json);

    expect(JSON.parse(restored.toJSON())).toEqual(JSON.parse(json));
    expect(restored.canUndo()).toBe(true);
    expect(restored.canRedo()).toBe(true);
    expect(restored.undoName()).toBe('A');
    expect(restored.redoName()).toBe('B');
    expect(restored.size()).toBe(2);
    expect(restored.index()).toBe(1);
  });

  test('bindKeys handles undo and redo shortcuts', () => {
    const UndoRedo = loadUndoRedo();
    const state = { value: 0 };
    const history = UndoRedo.create();
    const host = document.createElement('div');
    const unbind = history.bindKeys(host);

    history.exec({
      name: 'Set',
      execute: function() { state.value = 1; },
      undo: function() { state.value = 0; }
    });

    const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true });
    host.dispatchEvent(undoEvent);
    expect(state.value).toBe(0);
    expect(undoEvent.defaultPrevented).toBe(true);

    const redoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true });
    host.dispatchEvent(redoEvent);
    expect(state.value).toBe(1);

    unbind();
    const staleEvent = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true, cancelable: true });
    host.dispatchEvent(staleEvent);
    expect(state.value).toBe(1);
  });

  test('bindKeys uses metaKey shortcuts on Mac', () => {
    const UndoRedo = loadUndoRedo('MacIntel');
    const state = { value: 0 };
    const history = UndoRedo.create();
    const host = document.createElement('div');

    history.exec({
      name: 'Set',
      execute: function() { state.value = 5; },
      undo: function() { state.value = 0; }
    });

    host.focus();
    history.bindKeys(host);
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true }));
    expect(state.value).toBe(0);
  });
});
