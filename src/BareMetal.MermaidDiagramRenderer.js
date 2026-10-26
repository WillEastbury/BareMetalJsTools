/* Small, dependency-free Mermaid subset renderer for safe inline SVG output. */
window.BareMetal = window.BareMetal || {};
var BareMetal = window.BareMetal;

BareMetal.MermaidDiagramRenderer = (function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';
  var nextId = 0;
  var limits = { source: 12000, lines: 100, nodes: 48, edges: 96, label: 128 };

  function svgElement(name, attrs, parent) {
    var el = document.createElementNS(SVG, name);
    Object.keys(attrs || {}).forEach(function (key) { el.setAttribute(key, String(attrs[key])); });
    if (parent) parent.appendChild(el);
    return el;
  }
  function text(parent, value, attrs) {
    var el = svgElement('text', attrs, parent);
    el.textContent = value;
    return el;
  }
  function cleanLines(source) {
    if (typeof source !== 'string' || source.length > limits.source) return null;
    var lines = source.replace(/\r/g, '').split('\n');
    if (lines.length > limits.lines) return null;
    return lines.map(function (line) { return line.trim(); }).filter(function (line) {
      return line && !/^%%/.test(line);
    });
  }
  function readNode(token) {
    var match = /^([A-Za-z][A-Za-z0-9_]*)\s*(?:\[([^\]\n]*)\]|\(([^)\n]*)\)|\{([^}\n]*)\}|\(\(([^)\n]*)\)\))?$/.exec(token.trim());
    if (!match) return null;
    var label = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : match[5] !== undefined ? match[5] : match[1];
    if (label.length > limits.label) return null;
    return { id: match[1], label: label, shape: match[2] !== undefined ? 'rect' : match[3] !== undefined ? 'round' : match[4] !== undefined ? 'diamond' : match[5] !== undefined ? 'circle' : 'rect' };
  }
  function addNode(nodes, candidate) {
    if (!nodes[candidate.id]) {
      if (Object.keys(nodes).length >= limits.nodes) return false;
      nodes[candidate.id] = candidate;
    } else if (candidate.label !== candidate.id) nodes[candidate.id] = candidate;
    return true;
  }
  function parseFlow(lines) {
    var head = /^(?:flowchart|graph)\s+(TD|TB|BT|LR|RL)$/i.exec(lines[0]);
    if (!head) return null;
    var nodes = Object.create(null), edges = [];
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i], edge, a, b;
      if (/^(?:style|classDef|class|click|subgraph|end|direction|linkStyle|%%)/i.test(line) || /^title\b/i.test(line)) return null;
      edge = /^([A-Za-z][A-Za-z0-9_]*)\s*--\|([^|\n]{0,128})\|-->\s*([A-Za-z][A-Za-z0-9_]*)$/.exec(line);
      if (edge) { a = edge[1]; b = edge[3]; edges.push({ from: a, to: b, label: edge[2], arrow: true, dashed: false }); }
      else {
        edge = /^([A-Za-z][A-Za-z0-9_]*)\s*(-->|---|==>|-.->)\s*([A-Za-z][A-Za-z0-9_]*)$/.exec(line);
        if (edge) { a = edge[1]; b = edge[3]; edges.push({ from: a, to: b, label: '', arrow: edge[2] !== '---', dashed: edge[2] === '-.->' }); }
        else {
          var node = readNode(line);
          if (!node || !addNode(nodes, node)) return null;
        }
      }
      if (edges.length > limits.edges) return null;
      if (edge) {
        if (!addNode(nodes, { id: a, label: a, shape: 'rect' }) || !addNode(nodes, { id: b, label: b, shape: 'rect' })) return null;
      }
    }
    if (!Object.keys(nodes).length) return null;
    return { kind: 'flow', direction: head[1].toUpperCase(), nodes: Object.keys(nodes).map(function (id) { return nodes[id]; }), edges: edges };
  }
  function parseSequence(lines) {
    if (!/^sequenceDiagram$/i.test(lines[0])) return null;
    var participants = Object.create(null), order = [], messages = [];
    function participant(id, label) {
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(id) || label.length > limits.label) return false;
      if (!participants[id]) {
        if (order.length >= 12) return false;
        participants[id] = label; order.push(id);
      } else if (label !== id) participants[id] = label;
      return true;
    }
    for (var i = 1; i < lines.length; i++) {
      var declaration = /^participant\s+([A-Za-z][A-Za-z0-9_]*)(?:\s+as\s+(.{1,128}))?$/i.exec(lines[i]);
      if (declaration) { if (!participant(declaration[1], declaration[2] || declaration[1])) return null; continue; }
      var message = /^([A-Za-z][A-Za-z0-9_]*)\s*(-->>|->>|-->|->)\s*([A-Za-z][A-Za-z0-9_]*):\s*(.{1,128})$/.exec(lines[i]);
      if (!message || messages.length >= limits.edges || !participant(message[1], message[1]) || !participant(message[3], message[3])) return null;
      messages.push({ from: message[1], to: message[3], label: message[4], dashed: message[2].indexOf('--') === 0 });
    }
    if (!order.length || !messages.length) return null;
    return { kind: 'sequence', order: order, participants: participants, messages: messages };
  }
  function makeSvg(root, width, height, label) {
    var svg = svgElement('svg', { viewBox: '0 0 ' + width + ' ' + height, width: '100%', height: height, role: 'img', 'aria-label': label, class: 'bm-mermaid-diagram', focusable: 'false' });
    var defs = svgElement('defs', {}, svg), marker = svgElement('marker', { id: 'bm-mermaid-arrow-' + (++nextId), viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    svgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'currentColor' }, marker);
    root.replaceWith(svg);
    return { svg: svg, arrow: marker.id };
  }
  function nodeSize(node) {
    var lines = node.label.split('\n');
    return { width: Math.max(108, Math.min(280, Math.max.apply(null, lines.map(function (line) { return line.length; })) * 8 + 28)), height: Math.max(52, lines.length * 20 + 24) };
  }
  function drawFlow(pre, chart) {
    var horizontal = chart.direction === 'LR' || chart.direction === 'RL', reverse = chart.direction === 'BT' || chart.direction === 'RL';
    var gap = 70, positions = Object.create(null), maxW = 0, maxH = 0;
    chart.nodes.forEach(function (node, index) {
      var size = nodeSize(node), lane = index;
      positions[node.id] = { x: horizontal ? 48 + lane * (size.width + gap) : 48 + (lane % 3) * 250, y: horizontal ? 90 : 48 + Math.floor(lane / 3) * 130, width: size.width, height: size.height, node: node };
      maxW = Math.max(maxW, positions[node.id].x + size.width + 48); maxH = Math.max(maxH, positions[node.id].y + size.height + 48);
    });
    if (reverse) chart.nodes.forEach(function (node) {
      var p = positions[node.id];
      if (horizontal) p.x = maxW - p.x - p.width; else p.y = maxH - p.y - p.height;
    });
    var result = makeSvg(pre, Math.max(280, maxW), Math.max(150, maxH), 'Mermaid flowchart');
    chart.edges.forEach(function (edge) {
      var from = positions[edge.from], to = positions[edge.to], x1 = from.x + from.width / 2, y1 = from.y + from.height / 2, x2 = to.x + to.width / 2, y2 = to.y + to.height / 2;
      var line = svgElement('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'bm-mermaid-edge'+(edge.dashed?' bm-mermaid-dashed':'') }, result.svg);
      if (edge.arrow) line.setAttribute('marker-end', 'url(#' + result.arrow + ')');
      if (edge.label) text(result.svg, edge.label, { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 7, class: 'bm-mermaid-edge-label', 'text-anchor': 'middle' });
    });
    chart.nodes.forEach(function (node) {
      var p = positions[node.id], group = svgElement('g', { class: 'bm-mermaid-node' }, result.svg), x = p.x, y = p.y, w = p.width, h = p.height;
      if (node.shape === 'diamond') svgElement('polygon', { points: (x+w/2)+','+y+' '+(x+w)+','+(y+h/2)+' '+(x+w/2)+','+(y+h)+' '+x+','+(y+h/2), class: 'bm-mermaid-shape' }, group);
      else if (node.shape === 'circle') svgElement('ellipse', { cx: x+w/2, cy: y+h/2, rx: w/2, ry: h/2, class: 'bm-mermaid-shape' }, group);
      else svgElement('rect', { x: x, y: y, width: w, height: h, rx: node.shape === 'round' ? 20 : 6, class: 'bm-mermaid-shape' }, group);
      node.label.split('\n').forEach(function (line, index, lines) { text(group, line, { x: x+w/2, y: y+h/2+(index-(lines.length-1)/2)*20+5, class: 'bm-mermaid-label', 'text-anchor': 'middle' }); });
    });
  }
  function drawSequence(pre, chart) {
    var width = Math.max(360, chart.order.length * 180 + 40), height = Math.max(160, chart.messages.length * 58 + 100), top = 44, bottom = height - 24, centers = Object.create(null);
    var result = makeSvg(pre, width, height, 'Mermaid sequence diagram');
    chart.order.forEach(function (id, index) {
      var x = (index + 0.5) * (width / chart.order.length); centers[id] = x;
      svgElement('rect', { x: x-62, y: top, width: 124, height: 38, rx: 6, class: 'bm-mermaid-shape' }, result.svg);
      text(result.svg, chart.participants[id], { x: x, y: top+24, class: 'bm-mermaid-label', 'text-anchor': 'middle' });
      svgElement('line', { x1: x, y1: top+38, x2: x, y2: bottom, class: 'bm-mermaid-lifeline' }, result.svg);
    });
    chart.messages.forEach(function (message, index) {
      var y = top + 70 + index * 58, x1 = centers[message.from], x2 = centers[message.to], left = Math.min(x1, x2), right = Math.max(x1, x2), d = message.from === message.to ? 'M '+x1+' '+y+' h 42 v 24 h -34' : 'M '+x1+' '+y+' L '+x2+' '+y;
      svgElement('path', { d: d, class: 'bm-mermaid-edge'+(message.dashed?' bm-mermaid-dashed':''), 'marker-end': 'url(#'+result.arrow+')' }, result.svg);
      text(result.svg, message.label, { x: message.from === message.to ? x1+21 : (left+right)/2, y: y-8, class: 'bm-mermaid-edge-label', 'text-anchor': 'middle' });
    });
  }
  function renderBlock(pre) {
    var code = pre.querySelector('code.language-mermaid, code.lang-mermaid');
    if (!code) return false;
    var lines = cleanLines(code.textContent || '');
    if (!lines || !lines.length) return false;
    var chart = parseFlow(lines);
    if (chart) { drawFlow(pre, chart); return true; }
    chart = parseSequence(lines);
    if (chart) { drawSequence(pre, chart); return true; }
    return false;
  }
  function render(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return 0;
    var blocks = Array.prototype.slice.call(root.querySelectorAll('pre'));
    return blocks.reduce(function (count, pre) { return renderBlock(pre) ? count + 1 : count; }, 0);
  }
  return { render: render, supported: ['flowchart TD/TB/BT/LR/RL with simple labeled nodes and arrows', 'sequenceDiagram with participant declarations and simple messages'], limits: limits };
}());

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.MermaidDiagramRenderer;
