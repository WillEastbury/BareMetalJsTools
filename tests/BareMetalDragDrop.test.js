/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.DragDrop.js');

function loadDragDrop() {
  delete require.cache[SRC];
  return require(SRC);
}

function dispatchPointer(target, type, props) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const extra = Object.assign({}, props);
  delete extra.target;
  Object.assign(event, { pointerId: 1, button: 0, clientX: 0, clientY: 0, pointerType: 'mouse' }, extra);
  target.dispatchEvent(event);
  return event;
}

describe('BareMetal.DragDrop', () => {
  let DragDrop;
  let originalElementFromPoint;

  beforeEach(() => {
    document.body.innerHTML = '';
    originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = jest.fn();
    DragDrop = loadDragDrop();
  });

  afterEach(() => {
    document.elementFromPoint = originalElementFromPoint;
    jest.restoreAllMocks();
  });

  function preparePointerApis(el) {
    el.setPointerCapture = jest.fn();
    el.releasePointerCapture = jest.fn();
  }

  test('exports draggable, droppable and sortable helpers', () => {
    expect(Object.keys(DragDrop)).toEqual(['draggable', 'droppable', 'sortable']);
  });

  test('draggable returns a noop handle for invalid elements', () => {
    expect(DragDrop.draggable(null)).toEqual({ destroy: expect.any(Function) });
  });

  test('draggable emits start and end events and invokes callbacks', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    preparePointerApis(el);
    const starts = jest.fn();
    const ends = jest.fn();
    const dragStart = jest.fn();
    const dragEnd = jest.fn();
    el.addEventListener('bm:dragstart', dragStart);
    el.addEventListener('bm:dragend', dragEnd);

    DragDrop.draggable(el, { onStart: starts, onEnd: ends, dragClass: 'dragging' });
    document.elementFromPoint.mockReturnValue(null);
    dispatchPointer(el, 'pointerdown', { clientX: 10, clientY: 10 });
    expect(starts).toHaveBeenCalled();
    expect(el.classList.contains('dragging')).toBe(true);
    dispatchPointer(el, 'pointerup', { clientX: 15, clientY: 15 });

    expect(ends).toHaveBeenCalled();
    expect(dragStart).toHaveBeenCalled();
    expect(dragEnd).toHaveBeenCalled();
    expect(el.classList.contains('dragging')).toBe(false);
  });

  test('draggable uses default payload data from element attributes', () => {
    const el = document.createElement('div');
    el.id = 'card-1';
    el.setAttribute('data-type', 'card');
    el.textContent = 'Card text';
    document.body.appendChild(el);
    preparePointerApis(el);
    const ends = jest.fn();

    DragDrop.draggable(el, { onEnd: ends });
    document.elementFromPoint.mockReturnValue(null);
    dispatchPointer(el, 'pointerdown', {});
    dispatchPointer(el, 'pointerup', {});

    expect(ends.mock.calls[0][0]).toEqual({ type: 'card', id: 'card-1', text: 'Card text' });
  });

  test('draggable uses data functions and handle selectors', () => {
    const el = document.createElement('div');
    const handle = document.createElement('span');
    handle.className = 'handle';
    el.appendChild(handle);
    document.body.appendChild(el);
    preparePointerApis(el);
    const start = jest.fn();

    DragDrop.draggable(el, {
      handle: '.handle',
      data: () => ({ kind: 'custom' }),
      onStart: start
    });

    dispatchPointer(el, 'pointerdown', { target: el });
    expect(start).not.toHaveBeenCalled();

    dispatchPointer(handle, 'pointerdown', { target: handle });
    expect(start.mock.calls[0][0]).toEqual({ kind: 'custom' });
  });

  test('droppable accepts matching string payloads and fires onDrop', () => {
    const source = document.createElement('div');
    source.setAttribute('data-type', 'task');
    const drop = document.createElement('div');
    document.body.append(source, drop);
    preparePointerApis(source);
    const onDrop = jest.fn();
    const droppedEvent = jest.fn();
    drop.addEventListener('bm:drop', droppedEvent);

    DragDrop.droppable(drop, { accept: 'task', onDrop, overClass: 'over' });
    DragDrop.draggable(source, { dragClass: 'dragging' });
    document.elementFromPoint.mockReturnValue(drop);
    dispatchPointer(source, 'pointerdown', { clientX: 1, clientY: 1 });
    dispatchPointer(source, 'pointermove', { clientX: 2, clientY: 2 });
    expect(drop.classList.contains('over')).toBe(true);
    dispatchPointer(source, 'pointerup', { clientX: 2, clientY: 2 });

    expect(onDrop).toHaveBeenCalled();
    expect(droppedEvent).toHaveBeenCalled();
    expect(drop.classList.contains('over')).toBe(false);
  });

  test('droppable can filter using a function rule', () => {
    const source = document.createElement('div');
    const drop = document.createElement('div');
    document.body.append(source, drop);
    preparePointerApis(source);
    const onDrop = jest.fn();

    DragDrop.droppable(drop, { accept: (data) => data.kind === 'ok', onDrop });
    DragDrop.draggable(source, { data: { kind: 'nope' } });
    document.elementFromPoint.mockReturnValue(drop);
    dispatchPointer(source, 'pointerdown', {});
    dispatchPointer(source, 'pointermove', {});
    dispatchPointer(source, 'pointerup', {});

    expect(onDrop).not.toHaveBeenCalled();
  });

  test('droppable destroy unregisters a drop target', () => {
    const drop = document.createElement('div');
    const handle = DragDrop.droppable(drop, { overClass: 'over' });
    expect(() => handle.destroy()).not.toThrow();
  });

  test('sortable returns a noop handle for invalid containers', () => {
    expect(DragDrop.sortable(null).getOrder()).toEqual([]);
  });

  test('sortable exposes the current order', () => {
    const container = document.createElement('div');
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.id = 'a';
    b.id = 'b';
    container.append(a, b);

    const sortable = DragDrop.sortable(container);
    expect(sortable.getOrder()).toEqual(['a', 'b']);
  });

  test('sortable reorders items and emits a reorder event', () => {
    const container = document.createElement('div');
    const a = document.createElement('div');
    const b = document.createElement('div');
    const c = document.createElement('div');
    [a, b, c].forEach((el, index) => {
      el.id = String.fromCharCode(97 + index);
      preparePointerApis(el);
      Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 10 });
      Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 10 });
    });
    b.getBoundingClientRect = () => ({ left: 0, top: 20, width: 20, height: 20 });
    container.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 100 });
    container.append(a, b, c);
    document.body.appendChild(container);
    const reorder = jest.fn();
    container.addEventListener('bm:reorder', reorder);
    const onReorder = jest.fn();
    const sortable = DragDrop.sortable(container, { onReorder });

    document.elementFromPoint.mockReturnValue(c);
    dispatchPointer(a, 'pointerdown', { target: a, clientY: 5 });
    dispatchPointer(a, 'pointermove', { clientY: 50 });
    dispatchPointer(a, 'pointerup', { clientY: 50 });

    expect(sortable.getOrder()).toEqual(['b', 'c', 'a']);
    expect(reorder).toHaveBeenCalled();
    expect(onReorder).toHaveBeenCalledWith(['b', 'c', 'a'], a, expect.any(Event), undefined);
  });

  test('sortable handle selectors restrict drag start', () => {
    const container = document.createElement('div');
    const item = document.createElement('div');
    const handle = document.createElement('span');
    handle.className = 'handle';
    item.appendChild(handle);
    item.id = 'a';
    preparePointerApis(item);
    Object.defineProperty(item, 'offsetWidth', { configurable: true, value: 10 });
    Object.defineProperty(item, 'offsetHeight', { configurable: true, value: 10 });
    container.appendChild(item);
    document.body.appendChild(container);
    const sortable = DragDrop.sortable(container, { handle: '.handle' });

    dispatchPointer(item, 'pointerdown', { target: item });
    expect(sortable.getOrder()).toEqual(['a']);

    dispatchPointer(handle, 'pointerdown', { target: handle });
    dispatchPointer(item, 'pointercancel', {});
  });

  test('sortable supports horizontal comparisons', () => {
    const container = document.createElement('div');
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.id = 'a';
    b.id = 'b';
    [a, b].forEach((el) => {
      preparePointerApis(el);
      Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 10 });
      Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 10 });
    });
    b.getBoundingClientRect = () => ({ left: 50, top: 0, width: 20, height: 20 });
    container.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 40 });
    container.append(a, b);
    document.body.appendChild(container);
    const sortable = DragDrop.sortable(container, { direction: 'horizontal' });

    document.elementFromPoint.mockReturnValue(b);
    dispatchPointer(a, 'pointerdown', { target: a, clientX: 5 });
    dispatchPointer(a, 'pointermove', { clientX: 100 });
    dispatchPointer(a, 'pointerup', { clientX: 100 });

    expect(sortable.getOrder()).toEqual(['b', 'a']);
  });

  test('sortable destroy removes listeners safely', () => {
    const container = document.createElement('div');
    const item = document.createElement('div');
    item.id = 'a';
    preparePointerApis(item);
    Object.defineProperty(item, 'offsetWidth', { configurable: true, value: 10 });
    Object.defineProperty(item, 'offsetHeight', { configurable: true, value: 10 });
    container.appendChild(item);

    const sortable = DragDrop.sortable(container);
    expect(() => sortable.destroy()).not.toThrow();
  });
});
