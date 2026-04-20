/**
 * BareMetalGraph — Force-directed graph visualiser
 * Renders interactive node/edge diagrams into SVG with auto-layout.
 * Supports drag, zoom, labels, directional edges, grouping, and theming
 * via BareMetalStyles CSS custom properties. Zero dependencies.
 */
const BareMetalGraph = (() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, children) {
    const e = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    if (children) children.forEach(c => { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
    return e;
  }

  function resolveColor(c) { return c && c.startsWith('--') ? `var(${c})` : c; }

  const PALETTE = ['--bs-primary', '--bs-success', '--bs-danger', '--bs-warning', '--bs-info', '--bs-secondary'];
  function colorAt(i, colors) { return resolveColor((colors && colors[i]) || PALETTE[i % PALETTE.length]); }

  // --- Force simulation ---
  class Simulation {
    constructor(nodes, edges, opts) {
      this.nodes = nodes;
      this.edges = edges;
      this.repulsion = opts.repulsion || 800;
      this.springLen = opts.springLen || 120;
      this.springK = opts.springK || 0.05;
      this.damping = opts.damping || 0.85;
      this.centerForce = opts.centerForce || 0.01;
      this.cx = opts.width / 2;
      this.cy = opts.height / 2;
      this.running = false;
      this._raf = null;
      this._onTick = null;
      this._settled = 0;

      // init positions
      nodes.forEach((n, i) => {
        if (n.x == null) n.x = this.cx + (Math.random() - 0.5) * opts.width * 0.5;
        if (n.y == null) n.y = this.cy + (Math.random() - 0.5) * opts.height * 0.5;
        n.vx = 0; n.vy = 0;
        n._pinned = n.pinned || false;
      });

      // build adjacency lookup
      this._edgeMap = new Map();
      edges.forEach(e => {
        const key = e.source + '|' + e.target;
        this._edgeMap.set(key, e);
      });
    }

    step() {
      const { nodes, edges, repulsion, springLen, springK, damping, centerForce, cx, cy } = this;

      // repulsion (Coulomb)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[j].x - nodes[i].x;
          let dy = nodes[j].y - nodes[i].y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          let force = repulsion / (dist * dist);
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          if (!nodes[i]._pinned) { nodes[i].vx -= fx; nodes[i].vy -= fy; }
          if (!nodes[j]._pinned) { nodes[j].vx += fx; nodes[j].vy += fy; }
        }
      }

      // spring (Hooke)
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      edges.forEach(e => {
        const a = nodeMap.get(e.source), b = nodeMap.get(e.target);
        if (!a || !b) return;
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let displacement = dist - springLen;
        let fx = (dx / dist) * displacement * springK;
        let fy = (dy / dist) * displacement * springK;
        if (!a._pinned) { a.vx += fx; a.vy += fy; }
        if (!b._pinned) { b.vx -= fx; b.vy -= fy; }
      });

      // center gravity
      let totalKE = 0;
      nodes.forEach(n => {
        if (n._pinned) return;
        n.vx += (cx - n.x) * centerForce;
        n.vy += (cy - n.y) * centerForce;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        totalKE += n.vx * n.vx + n.vy * n.vy;
      });

      return totalKE;
    }

    start(onTick) {
      this._onTick = onTick;
      this.running = true;
      this._settled = 0;
      const tick = () => {
        if (!this.running) return;
        const ke = this.step();
        if (this._onTick) this._onTick();
        if (ke < 0.01) {
          this._settled++;
          if (this._settled > 30) { this.running = false; return; }
        } else {
          this._settled = 0;
        }
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }

    stop() {
      this.running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    reheat() {
      this._settled = 0;
      if (!this.running) this.start(this._onTick);
    }
  }

  // --- Renderer ---
  function create(target, data, opts) {
    opts = Object.assign({
      width: 800, height: 500,
      nodeRadius: 20, colors: null, directed: false,
      showLabels: true, labelField: 'label',
      draggable: true, zoomable: true,
      repulsion: 800, springLen: 120, springK: 0.05, damping: 0.85, centerForce: 0.01,
      groupField: null, groupColors: null
    }, opts);

    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('BareMetalGraph: target not found');
    container.innerHTML = '';

    const { width, height, nodeRadius, directed, showLabels, labelField, draggable, zoomable, groupField, groupColors } = opts;

    // normalise data
    const nodes = data.nodes.map(n => typeof n === 'string' ? { id: n, [labelField]: n } : { ...n });
    const edges = data.edges.map(e => {
      if (Array.isArray(e)) return { source: e[0], target: e[1] };
      return { ...e };
    });

    // group colors
    const groups = new Map();
    if (groupField) {
      let gi = 0;
      nodes.forEach(n => {
        const g = n[groupField] || 'default';
        if (!groups.has(g)) groups.set(g, gi++);
      });
    }

    function nodeColor(n, i) {
      if (n.color) return resolveColor(n.color);
      if (groupField) return colorAt(groups.get(n[groupField] || 'default'), groupColors || opts.colors);
      return colorAt(i, opts.colors);
    }

    // create SVG
    const defs = el('defs', null, directed ? [
      el('marker', { id: 'bm-arrow', viewBox: '0 0 10 10', refX: '10', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, [
        el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'currentColor', opacity: '.4' })
      ])
    ] : []);

    const edgeGroup = el('g', { class: 'bm-edges' });
    const nodeGroup = el('g', { class: 'bm-nodes' });
    const root = el('g', null, [edgeGroup, nodeGroup]);
    const svgEl = el('svg', {
      xmlns: SVG_NS, viewBox: `0 0 ${width} ${height}`, width: '100%',
      style: 'user-select:none; cursor:grab;', class: 'bm-graph'
    }, [defs, root]);

    container.appendChild(svgEl);

    // build edge elements
    const edgeEls = edges.map(e => {
      const attrs = { stroke: 'currentColor', 'stroke-opacity': '.3', 'stroke-width': e.weight || 1.5, fill: 'none' };
      if (directed) attrs['marker-end'] = 'url(#bm-arrow)';
      const line = el('line', attrs);
      if (e.label) {
        const txt = el('text', { 'font-size': '9', fill: 'currentColor', opacity: '.5', 'text-anchor': 'middle' }, [e.label]);
        edgeGroup.appendChild(txt);
        e._labelEl = txt;
      }
      edgeGroup.appendChild(line);
      return { data: e, el: line };
    });

    // build node elements
    const nodeEls = nodes.map((n, i) => {
      const g = el('g', { class: 'bm-node', style: 'cursor: grab;' });
      const r = n.radius || nodeRadius;
      const circle = el('circle', { r, fill: nodeColor(n, i), stroke: 'var(--bs-body-bg, #fff)', 'stroke-width': 2, opacity: '.9' });
      g.appendChild(circle);

      if (showLabels) {
        const label = n[labelField] || n.id;
        g.appendChild(el('text', {
          y: r + 14, 'text-anchor': 'middle', 'font-size': '11', fill: 'currentColor', 'pointer-events': 'none'
        }, [label]));
      }

      if (n.detail) {
        const detailEl = el('text', {
          y: -(r + 6), 'text-anchor': 'middle', 'font-size': '9', fill: 'currentColor', opacity: '0',
          'pointer-events': 'none', 'transition': 'opacity 0.2s'
        }, [n.detail]);
        g.appendChild(detailEl);
        n._detailEl = detailEl;
      }

      nodeGroup.appendChild(g);
      return { data: n, el: g, circle };
    });

    // hover highlight
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    nodeEls.forEach(ne => {
      ne.el.addEventListener('mouseenter', () => {
        ne.circle.setAttribute('opacity', '1');
        ne.circle.setAttribute('stroke-width', '3');
        if (ne.data._detailEl) ne.data._detailEl.setAttribute('opacity', '.8');
        // highlight connected edges
        edgeEls.forEach(ee => {
          if (ee.data.source === ne.data.id || ee.data.target === ne.data.id) {
            ee.el.setAttribute('stroke-opacity', '.7');
            ee.el.setAttribute('stroke-width', (ee.data.weight || 1.5) + 1);
          }
        });
      });
      ne.el.addEventListener('mouseleave', () => {
        ne.circle.setAttribute('opacity', '.9');
        ne.circle.setAttribute('stroke-width', '2');
        if (ne.data._detailEl) ne.data._detailEl.setAttribute('opacity', '0');
        edgeEls.forEach(ee => {
          ee.el.setAttribute('stroke-opacity', '.3');
          ee.el.setAttribute('stroke-width', ee.data.weight || 1.5);
        });
      });
    });

    // simulation
    const sim = new Simulation(nodes, edges, opts);

    function render() {
      const nm = new Map(nodes.map(n => [n.id, n]));
      edgeEls.forEach(ee => {
        const a = nm.get(ee.data.source), b = nm.get(ee.data.target);
        if (!a || !b) return;
        // shorten line to stop at node edge
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const rA = a.radius || nodeRadius, rB = b.radius || nodeRadius;
        ee.el.setAttribute('x1', a.x + (dx / dist) * rA);
        ee.el.setAttribute('y1', a.y + (dy / dist) * rA);
        ee.el.setAttribute('x2', b.x - (dx / dist) * rB);
        ee.el.setAttribute('y2', b.y - (dy / dist) * rB);
        if (ee.data._labelEl) {
          ee.data._labelEl.setAttribute('x', (a.x + b.x) / 2);
          ee.data._labelEl.setAttribute('y', (a.y + b.y) / 2 - 4);
        }
      });
      nodeEls.forEach(ne => {
        ne.el.setAttribute('transform', `translate(${ne.data.x},${ne.data.y})`);
      });
    }

    sim.start(render);

    // dragging
    if (draggable) {
      let dragNode = null, dragOffset = { x: 0, y: 0 };

      function getSVGPoint(evt) {
        const pt = svgEl.createSVGPoint();
        pt.x = evt.clientX; pt.y = evt.clientY;
        const ctm = root.getScreenCTM().inverse();
        return pt.matrixTransform(ctm);
      }

      nodeEls.forEach(ne => {
        ne.el.addEventListener('mousedown', e => {
          e.stopPropagation();
          dragNode = ne.data;
          dragNode._pinned = true;
          const pt = getSVGPoint(e);
          dragOffset.x = dragNode.x - pt.x;
          dragOffset.y = dragNode.y - pt.y;
          svgEl.style.cursor = 'grabbing';
        });
      });

      svgEl.addEventListener('mousemove', e => {
        if (!dragNode) return;
        const pt = getSVGPoint(e);
        dragNode.x = pt.x + dragOffset.x;
        dragNode.y = pt.y + dragOffset.y;
        dragNode.vx = 0; dragNode.vy = 0;
        sim.reheat();
      });

      svgEl.addEventListener('mouseup', () => {
        if (dragNode) {
          dragNode._pinned = dragNode.pinned || false;
          dragNode = null;
          svgEl.style.cursor = 'grab';
        }
      });

      svgEl.addEventListener('mouseleave', () => {
        if (dragNode) {
          dragNode._pinned = dragNode.pinned || false;
          dragNode = null;
          svgEl.style.cursor = 'grab';
        }
      });
    }

    // zoom / pan
    if (zoomable) {
      let scale = 1, tx = 0, ty = 0, panning = false, panStart = { x: 0, y: 0 };

      function applyTransform() {
        root.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
      }

      svgEl.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(scale * delta, 0.2), 5);
        // zoom toward cursor
        const rect = svgEl.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width * width;
        const my = (e.clientY - rect.top) / rect.height * height;
        tx = mx - (mx - tx) * (newScale / scale);
        ty = my - (my - ty) * (newScale / scale);
        scale = newScale;
        applyTransform();
      }, { passive: false });

      svgEl.addEventListener('mousedown', e => {
        if (e.target === svgEl || e.target.tagName === 'svg') {
          panning = true;
          panStart = { x: e.clientX - tx, y: e.clientY - ty };
          svgEl.style.cursor = 'grabbing';
        }
      });

      svgEl.addEventListener('mousemove', e => {
        if (panning) {
          tx = e.clientX - panStart.x;
          ty = e.clientY - panStart.y;
          applyTransform();
        }
      });

      svgEl.addEventListener('mouseup', () => { panning = false; svgEl.style.cursor = 'grab'; });
    }

    // public handle
    const handle = {
      svg: svgEl,
      simulation: sim,
      nodes,
      edges,

      addNode(n) {
        const node = typeof n === 'string' ? { id: n, [labelField]: n } : { ...n };
        node.x = opts.width / 2 + (Math.random() - 0.5) * 80;
        node.y = opts.height / 2 + (Math.random() - 0.5) * 80;
        node.vx = 0; node.vy = 0; node._pinned = node.pinned || false;
        nodes.push(node);
        const i = nodes.length - 1;
        const g = el('g', { class: 'bm-node', style: 'cursor: grab;' });
        const r = node.radius || nodeRadius;
        const circle = el('circle', { r, fill: nodeColor(node, i), stroke: 'var(--bs-body-bg, #fff)', 'stroke-width': 2, opacity: '.9' });
        g.appendChild(circle);
        if (showLabels) g.appendChild(el('text', { y: r + 14, 'text-anchor': 'middle', 'font-size': '11', fill: 'currentColor', 'pointer-events': 'none' }, [node[labelField] || node.id]));
        nodeGroup.appendChild(g);
        const ne = { data: node, el: g, circle };
        nodeEls.push(ne);
        if (draggable) _addDragToNode(ne);
        _addHoverToNode(ne);
        sim.reheat();
        return handle;
      },

      addEdge(e) {
        const edge = Array.isArray(e) ? { source: e[0], target: e[1] } : { ...e };
        edges.push(edge);
        const attrs = { stroke: 'currentColor', 'stroke-opacity': '.3', 'stroke-width': edge.weight || 1.5, fill: 'none' };
        if (directed) attrs['marker-end'] = 'url(#bm-arrow)';
        const line = el('line', attrs);
        edgeGroup.appendChild(line);
        edgeEls.push({ data: edge, el: line });
        sim.reheat();
        return handle;
      },

      removeNode(id) {
        const idx = nodes.findIndex(n => n.id === id);
        if (idx === -1) return handle;
        nodes.splice(idx, 1);
        nodeGroup.removeChild(nodeEls[idx].el);
        nodeEls.splice(idx, 1);
        // remove connected edges
        for (let i = edgeEls.length - 1; i >= 0; i--) {
          if (edgeEls[i].data.source === id || edgeEls[i].data.target === id) {
            edgeGroup.removeChild(edgeEls[i].el);
            if (edgeEls[i].data._labelEl) edgeGroup.removeChild(edgeEls[i].data._labelEl);
            edges.splice(i, 1);
            edgeEls.splice(i, 1);
          }
        }
        sim.reheat();
        return handle;
      },

      removeEdge(source, target) {
        const idx = edgeEls.findIndex(ee => ee.data.source === source && ee.data.target === target);
        if (idx === -1) return handle;
        edgeGroup.removeChild(edgeEls[idx].el);
        if (edgeEls[idx].data._labelEl) edgeGroup.removeChild(edgeEls[idx].data._labelEl);
        edges.splice(idx, 1);
        edgeEls.splice(idx, 1);
        sim.reheat();
        return handle;
      },

      pin(id) { const n = nodes.find(n => n.id === id); if (n) { n._pinned = true; n.pinned = true; } return handle; },
      unpin(id) { const n = nodes.find(n => n.id === id); if (n) { n._pinned = false; n.pinned = false; } sim.reheat(); return handle; },

      stop() { sim.stop(); return handle; },
      restart() { sim.start(render); return handle; },
      destroy() { sim.stop(); container.innerHTML = ''; }
    };

    // reusable internal helpers
    function _addDragToNode(ne) {
      let dragOffset = { x: 0, y: 0 };
      ne.el.addEventListener('mousedown', e => {
        e.stopPropagation();
        ne.data._pinned = true;
        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const ctm = root.getScreenCTM().inverse();
        const svgPt = pt.matrixTransform(ctm);
        dragOffset.x = ne.data.x - svgPt.x;
        dragOffset.y = ne.data.y - svgPt.y;
        const onMove = ev => {
          pt.x = ev.clientX; pt.y = ev.clientY;
          const p = pt.matrixTransform(root.getScreenCTM().inverse());
          ne.data.x = p.x + dragOffset.x;
          ne.data.y = p.y + dragOffset.y;
          ne.data.vx = 0; ne.data.vy = 0;
          sim.reheat();
        };
        const onUp = () => {
          ne.data._pinned = ne.data.pinned || false;
          svgEl.removeEventListener('mousemove', onMove);
          svgEl.removeEventListener('mouseup', onUp);
        };
        svgEl.addEventListener('mousemove', onMove);
        svgEl.addEventListener('mouseup', onUp);
      });
    }

    function _addHoverToNode(ne) {
      ne.el.addEventListener('mouseenter', () => {
        ne.circle.setAttribute('opacity', '1');
        ne.circle.setAttribute('stroke-width', '3');
        edgeEls.forEach(ee => {
          if (ee.data.source === ne.data.id || ee.data.target === ne.data.id) {
            ee.el.setAttribute('stroke-opacity', '.7');
            ee.el.setAttribute('stroke-width', (ee.data.weight || 1.5) + 1);
          }
        });
      });
      ne.el.addEventListener('mouseleave', () => {
        ne.circle.setAttribute('opacity', '.9');
        ne.circle.setAttribute('stroke-width', '2');
        edgeEls.forEach(ee => {
          ee.el.setAttribute('stroke-opacity', '.3');
          ee.el.setAttribute('stroke-width', ee.data.weight || 1.5);
        });
      });
    }

    return handle;
  }

  return { create };
})();
