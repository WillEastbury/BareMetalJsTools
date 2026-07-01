/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.Graph.js');

function loadGraph() {
  delete require.cache[SRC];
  return require(SRC);
}

describe('BareMetal.Graph', () => {
  let Graph;
  let realRAF;
  let realCancelRAF;
  let realCreateSVGPoint;
  let realGetScreenCTM;
  let handles;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '<div id="graph"></div>';
    handles = [];
    realRAF = global.requestAnimationFrame;
    realCancelRAF = global.cancelAnimationFrame;
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    realCreateSVGPoint = SVGSVGElement.prototype.createSVGPoint;
    realGetScreenCTM = SVGElement.prototype.getScreenCTM;
    SVGSVGElement.prototype.createSVGPoint = function () {
      return {
        x: 0,
        y: 0,
        matrixTransform() {
          return { x: this.x, y: this.y };
        }
      };
    };
    SVGElement.prototype.getScreenCTM = function () {
      return { inverse: () => ({}) };
    };
    Graph = loadGraph();
  });

  afterEach(() => {
    handles.forEach((handle) => {
      try {
        handle.stop();
        handle.destroy();
      } catch (_) {}
    });
    SVGSVGElement.prototype.createSVGPoint = realCreateSVGPoint;
    SVGElement.prototype.getScreenCTM = realGetScreenCTM;
    global.requestAnimationFrame = realRAF;
    global.cancelAnimationFrame = realCancelRAF;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function createHandle(opts) {
    const handle = Graph.create(document.getElementById('graph'), {
      nodes: [
        { id: 'a', label: 'A', detail: 'detail-a', group: 'x' },
        { id: 'b', label: 'B', group: 'y' }
      ],
      edges: [{ source: 'a', target: 'b', label: 'A->B', weight: 2 }]
    }, Object.assign({ width: 300, height: 200 }, opts));
    handles.push(handle);
    jest.advanceTimersByTime(5);
    return handle;
  }

  test('exports a create function', () => {
    expect(Graph).toEqual({ create: expect.any(Function) });
  });

  test('create renders an svg with nodes and edges', () => {
    const handle = createHandle();
    const container = document.getElementById('graph');

    expect(container.querySelector('svg.bm-graph')).toBe(handle.svg);
    expect(container.querySelectorAll('.bm-node')).toHaveLength(2);
    expect(container.querySelectorAll('.bm-edges line')).toHaveLength(1);
  });

  test('create throws when the target is missing', () => {
    expect(() => Graph.create('#missing', { nodes: [], edges: [] })).toThrow('BareMetalGraph: target not found');
  });

  test('directed graphs add arrow markers to edges', () => {
    createHandle({ directed: true });
    expect(document.querySelector('marker#bm-arrow')).toBeTruthy();
    expect(document.querySelector('.bm-edges line').getAttribute('marker-end')).toBe('url(#bm-arrow)');
  });

  test('showLabels false omits node label text', () => {
    createHandle({ showLabels: false });
    expect(Array.from(document.querySelectorAll('.bm-node text')).some((el) => el.textContent === 'A')).toBe(false);
  });

  test('group colors are applied using the group field', () => {
    createHandle({ groupField: 'group', groupColors: ['red', 'blue'] });
    const fills = Array.from(document.querySelectorAll('.bm-node circle')).map((el) => el.getAttribute('fill'));
    expect(fills).toEqual(['red', 'blue']);
  });

  test('hovering a node highlights the node, detail and connected edge', () => {
    createHandle();
    const node = document.querySelector('.bm-node');
    const circle = node.querySelector('circle');
    const detail = Array.from(node.querySelectorAll('text')).find((el) => el.textContent === 'detail-a');
    const edge = document.querySelector('.bm-edges line');

    node.dispatchEvent(new Event('mouseenter'));
    expect(circle.getAttribute('stroke-width')).toBe('3');
    expect(detail.getAttribute('opacity')).toBe('.8');
    expect(edge.getAttribute('stroke-opacity')).toBe('.7');

    node.dispatchEvent(new Event('mouseleave'));
    expect(circle.getAttribute('stroke-width')).toBe('2');
    expect(detail.getAttribute('opacity')).toBe('0');
    expect(edge.getAttribute('stroke-opacity')).toBe('.3');
  });

  test('addNode appends a new node and returns the handle', () => {
    const handle = createHandle();
    expect(handle.addNode({ id: 'c', label: 'C' })).toBe(handle);
    expect(handle.nodes.map((node) => node.id)).toContain('c');
    expect(document.querySelectorAll('.bm-node')).toHaveLength(3);
  });

  test('addEdge appends a new edge and returns the handle', () => {
    const handle = createHandle({ directed: true });
    expect(handle.addEdge(['b', 'a'])).toBe(handle);
    expect(handle.edges).toHaveLength(2);
    expect(document.querySelectorAll('.bm-edges line')).toHaveLength(2);
  });

  test('removeNode removes connected edges', () => {
    const handle = createHandle();
    handle.removeNode('a');

    expect(handle.nodes.map((node) => node.id)).toEqual(['b']);
    expect(handle.edges).toHaveLength(0);
    expect(document.querySelectorAll('.bm-node')).toHaveLength(1);
  });

  test('removeEdge removes an edge and returns the handle', () => {
    const handle = createHandle();
    expect(handle.removeEdge('a', 'b')).toBe(handle);
    expect(handle.edges).toHaveLength(0);
    expect(document.querySelectorAll('.bm-edges line')).toHaveLength(0);
  });

  test('pin and unpin update node pinned state', () => {
    const handle = createHandle();
    handle.pin('a');
    expect(handle.nodes.find((node) => node.id === 'a').pinned).toBe(true);

    handle.unpin('a');
    expect(handle.nodes.find((node) => node.id === 'a').pinned).toBe(false);
  });

  test('stop and restart control the simulation', () => {
    const handle = createHandle();
    handle.stop();
    expect(handle.simulation.running).toBe(false);
    handle.restart();
    expect(handle.simulation.running).toBe(true);
  });

  test('destroy clears the container', () => {
    const handle = createHandle();
    handle.destroy();
    expect(document.getElementById('graph').innerHTML).toBe('');
  });

  test('dragging a node moves it using svg coordinates', () => {
    const handle = createHandle();
    const node = document.querySelector('.bm-node');
    const originalX = handle.nodes[0].x;

    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
    handle.svg.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 60 }));
    handle.svg.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 50, clientY: 60 }));

    expect(handle.nodes[0].x).not.toBe(originalX);
  });

  test('wheel events zoom and background dragging pans the root transform', () => {
    const handle = createHandle();
    handle.svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 200 });
    const root = handle.svg.querySelector('g');

    handle.svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -120, clientX: 150, clientY: 100 }));
    expect(root.getAttribute('transform')).toContain('scale(');

    handle.svg.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 20 }));
    handle.svg.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 40, clientY: 60 }));
    handle.svg.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 40, clientY: 60 }));

    expect(root.getAttribute('transform')).toContain('translate(');
  });

  test('non-zoomable graphs ignore wheel transforms', () => {
    const handle = createHandle({ zoomable: false });
    const root = handle.svg.querySelector('g');
    handle.svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -120, clientX: 10, clientY: 10 }));
    expect(root.getAttribute('transform')).toBeNull();
  });
});
