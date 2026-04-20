/**
 * BareMetalCharts — Lightweight SVG chart renderer
 * Renders bar, line, sparkline, donut, and gauge charts into SVG.
 * Themed via BareMetalStyles CSS custom properties. Zero dependencies.
 */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Charts = (() => {
  'use strict';

  // --- Helpers ---
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, children) {
    const e = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    if (children) children.forEach(c => { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
    return e;
  }

  function svg(w, h, children, cls) {
    const s = el('svg', { xmlns: SVG_NS, viewBox: `0 0 ${w} ${h}`, width: '100%', preserveAspectRatio: 'xMidYMid meet' }, children);
    if (cls) s.setAttribute('class', cls);
    return s;
  }

  function resolveColor(color) {
    if (color.startsWith('--')) return `var(${color})`;
    return color;
  }

  const PALETTE = ['--bs-primary', '--bs-success', '--bs-danger', '--bs-warning', '--bs-info', '--bs-secondary'];

  function colorAt(i, colors) {
    const c = (colors && colors[i]) || PALETTE[i % PALETTE.length];
    return resolveColor(c);
  }

  function mount(target, node) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('BareMetalCharts: target not found');
    container.innerHTML = '';
    container.appendChild(node);
    return container;
  }

  function defaults(opts, defs) { return Object.assign({}, defs, opts); }

  // --- Bar Chart ---
  function bar(target, data, opts) {
    opts = defaults(opts, { width: 400, height: 250, gap: 4, padding: 40, horizontal: false, showValues: true, showLabels: true, colors: null, animate: true });
    const { width, height, gap, padding, horizontal, showValues, showLabels, colors, animate } = opts;

    const values = data.map(d => (typeof d === 'number') ? d : d.value);
    const labels = data.map(d => (typeof d === 'object') ? (d.label || '') : '');
    const max = Math.max(...values, 1);
    const n = values.length;

    const children = [];

    if (horizontal) {
      const barH = (height - padding) / n - gap;
      const chartW = width - padding * 2;

      values.forEach((v, i) => {
        const y = padding / 2 + i * (barH + gap);
        const w = (v / max) * chartW;

        const rect = el('rect', { x: padding, y, width: animate ? 0 : w, height: barH, fill: colorAt(i, colors), rx: 3 });
        if (animate) {
          const anim = el('animate', { attributeName: 'width', from: 0, to: w, dur: '0.6s', fill: 'freeze', begin: `${i * 0.05}s` });
          rect.appendChild(anim);
        }
        children.push(rect);

        if (showLabels && labels[i]) {
          children.push(el('text', { x: padding - 4, y: y + barH / 2, 'text-anchor': 'end', 'dominant-baseline': 'middle', 'font-size': '11', fill: 'currentColor' }, [labels[i]]));
        }
        if (showValues) {
          children.push(el('text', { x: padding + w + 4, y: y + barH / 2, 'dominant-baseline': 'middle', 'font-size': '10', fill: 'currentColor', opacity: '.7' }, [String(v)]));
        }
      });
    } else {
      const barW = (width - padding * 2) / n - gap;
      const chartH = height - padding * 1.5;

      // axis line
      children.push(el('line', { x1: padding, y1: chartH, x2: width - padding / 2, y2: chartH, stroke: 'currentColor', 'stroke-opacity': '.2', 'stroke-width': 1 }));

      values.forEach((v, i) => {
        const x = padding + i * (barW + gap) + gap / 2;
        const h = (v / max) * (chartH - padding / 2);
        const y = chartH - h;

        const rect = el('rect', { x, y: animate ? chartH : y, width: barW, height: animate ? 0 : h, fill: colorAt(i, colors), rx: 3 });
        if (animate) {
          rect.appendChild(el('animate', { attributeName: 'y', from: chartH, to: y, dur: '0.5s', fill: 'freeze', begin: `${i * 0.05}s` }));
          rect.appendChild(el('animate', { attributeName: 'height', from: 0, to: h, dur: '0.5s', fill: 'freeze', begin: `${i * 0.05}s` }));
        }
        children.push(rect);

        if (showLabels && labels[i]) {
          children.push(el('text', { x: x + barW / 2, y: chartH + 14, 'text-anchor': 'middle', 'font-size': '11', fill: 'currentColor' }, [labels[i]]));
        }
        if (showValues) {
          children.push(el('text', { x: x + barW / 2, y: y - 4, 'text-anchor': 'middle', 'font-size': '10', fill: 'currentColor', opacity: '.7' }, [String(v)]));
        }
      });
    }

    return mount(target, svg(width, height, children, 'bm-chart bm-bar'));
  }

  // --- Line Chart ---
  function line(target, data, opts) {
    opts = defaults(opts, { width: 400, height: 250, padding: 40, fill: true, dots: true, smooth: false, colors: null, showLabels: true, animate: true });
    const { width, height, padding, fill, dots, smooth, colors, showLabels, animate } = opts;

    // data can be array of numbers, or array of {label, value}, or array of series [{name, values}]
    const series = Array.isArray(data[0]?.values) ? data : [{ name: '', values: data.map(d => typeof d === 'number' ? d : d.value) }];
    const labels = Array.isArray(data[0]?.values) ? (opts.labels || []) : data.map(d => typeof d === 'object' ? (d.label || '') : '');

    const allVals = series.flatMap(s => s.values);
    const max = Math.max(...allVals, 1);
    const min = Math.min(...allVals, 0);
    const range = max - min || 1;
    const n = series[0].values.length;

    const chartW = width - padding * 2;
    const chartH = height - padding * 1.5;
    const children = [];

    // grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding / 2 + (chartH * i) / 4;
      children.push(el('line', { x1: padding, y1: y, x2: width - padding / 2, y2: y, stroke: 'currentColor', 'stroke-opacity': '.1', 'stroke-width': 1 }));
      const val = max - (range * i) / 4;
      children.push(el('text', { x: padding - 6, y: y + 3, 'text-anchor': 'end', 'font-size': '9', fill: 'currentColor', opacity: '.5' }, [val % 1 === 0 ? String(val) : val.toFixed(1)]));
    }

    series.forEach((s, si) => {
      const points = s.values.map((v, i) => {
        const x = padding + (i / Math.max(n - 1, 1)) * chartW;
        const y = padding / 2 + chartH - ((v - min) / range) * chartH;
        return { x, y };
      });

      let pathD;
      if (smooth && points.length > 2) {
        pathD = `M${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
          const cp = (points[i + 1].x - points[i].x) / 3;
          pathD += ` C${points[i].x + cp},${points[i].y} ${points[i + 1].x - cp},${points[i + 1].y} ${points[i + 1].x},${points[i + 1].y}`;
        }
      } else {
        pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      }

      const color = colorAt(si, colors);

      if (fill) {
        const fillPath = pathD + ` L${points[points.length - 1].x},${padding / 2 + chartH} L${points[0].x},${padding / 2 + chartH} Z`;
        children.push(el('path', { d: fillPath, fill: color, 'fill-opacity': '.1' }));
      }

      const lineEl = el('path', { d: pathD, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      if (animate) {
        const len = points.reduce((acc, p, i) => i === 0 ? 0 : acc + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y), 0);
        lineEl.setAttribute('stroke-dasharray', len);
        lineEl.setAttribute('stroke-dashoffset', len);
        lineEl.appendChild(el('animate', { attributeName: 'stroke-dashoffset', from: len, to: 0, dur: '1s', fill: 'freeze' }));
      }
      children.push(lineEl);

      if (dots) {
        points.forEach(p => {
          children.push(el('circle', { cx: p.x, cy: p.y, r: 3, fill: color, stroke: 'var(--bs-body-bg, #fff)', 'stroke-width': 1.5 }));
        });
      }
    });

    // x-axis labels
    if (showLabels && labels.length) {
      labels.forEach((lbl, i) => {
        if (!lbl) return;
        const x = padding + (i / Math.max(n - 1, 1)) * chartW;
        children.push(el('text', { x, y: padding / 2 + chartH + 14, 'text-anchor': 'middle', 'font-size': '10', fill: 'currentColor' }, [lbl]));
      });
    }

    return mount(target, svg(width, height, children, 'bm-chart bm-line'));
  }

  // --- Sparkline ---
  function sparkline(target, values, opts) {
    opts = defaults(opts, { width: 120, height: 32, color: '--bs-primary', strokeWidth: 1.5, fill: false });
    const { width, height, color, strokeWidth, fill: doFill } = opts;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const pad = 2;

    const points = values.map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
      const y = pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2);
      return { x, y };
    });

    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const col = resolveColor(color);
    const children = [];

    if (doFill) {
      const fillD = d + ` L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`;
      children.push(el('path', { d: fillD, fill: col, 'fill-opacity': '.15' }));
    }
    children.push(el('path', { d, fill: 'none', stroke: col, 'stroke-width': strokeWidth, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

    return mount(target, svg(width, height, children, 'bm-chart bm-sparkline'));
  }

  // --- Donut / Pie ---
  function donut(target, data, opts) {
    opts = defaults(opts, { size: 200, thickness: 40, colors: null, showLabels: true, animate: true, startAngle: -90 });
    const { size, thickness, colors, showLabels, animate, startAngle } = opts;

    const total = data.reduce((s, d) => s + (typeof d === 'number' ? d : d.value), 0) || 1;
    const cx = size / 2, cy = size / 2, r = (size - thickness) / 2;
    const circ = 2 * Math.PI * r;
    const children = [];

    // bg ring
    children.push(el('circle', { cx, cy, r, fill: 'none', stroke: 'currentColor', 'stroke-opacity': '.08', 'stroke-width': thickness }));

    let angle = startAngle;
    data.forEach((d, i) => {
      const val = typeof d === 'number' ? d : d.value;
      const label = typeof d === 'object' ? (d.label || '') : '';
      const frac = val / total;
      const dashLen = frac * circ;
      const dashGap = circ - dashLen;
      const rotation = angle;

      const circle = el('circle', {
        cx, cy, r, fill: 'none',
        stroke: colorAt(i, colors), 'stroke-width': thickness,
        'stroke-dasharray': `${dashLen} ${dashGap}`,
        'stroke-dashoffset': 0,
        transform: `rotate(${rotation} ${cx} ${cy})`,
        'stroke-linecap': 'butt'
      });

      if (animate) {
        circle.setAttribute('stroke-dasharray', `0 ${circ}`);
        circle.appendChild(el('animate', {
          attributeName: 'stroke-dasharray', from: `0 ${circ}`, to: `${dashLen} ${dashGap}`,
          dur: '0.8s', fill: 'freeze', begin: `${i * 0.1}s`
        }));
      }
      children.push(circle);

      // label
      if (showLabels && label) {
        const midAngle = (rotation + (frac * 360) / 2) * (Math.PI / 180);
        const lx = cx + (r + thickness / 2 + 14) * Math.cos(midAngle);
        const ly = cy + (r + thickness / 2 + 14) * Math.sin(midAngle);
        children.push(el('text', { x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': '10', fill: 'currentColor' }, [label]));
      }

      angle += frac * 360;
    });

    // center text (total)
    if (opts.centerText !== undefined) {
      children.push(el('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', 'font-size': '22', 'font-weight': '600', fill: 'currentColor' }, [String(opts.centerText)]));
      if (opts.centerLabel) {
        children.push(el('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', 'font-size': '10', fill: 'currentColor', opacity: '.6' }, [opts.centerLabel]));
      }
    }

    return mount(target, svg(size, size, children, 'bm-chart bm-donut'));
  }

  // --- Gauge ---
  function gauge(target, value, opts) {
    opts = defaults(opts, { size: 200, min: 0, max: 100, thickness: 20, color: null, animate: true, label: '', showValue: true, zones: null });
    const { size, min, max, thickness, animate, label, showValue, zones } = opts;

    const range = max - min || 1;
    const frac = Math.min(Math.max((value - min) / range, 0), 1);
    const cx = size / 2, cy = size * 0.55;
    const r = (size - thickness * 2) / 2;
    const startAngle = 180;
    const sweep = 180;
    const circ = Math.PI * r; // semicircle

    function arcPoint(angleDeg) {
      const rad = angleDeg * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    const children = [];

    // bg arc
    const bgStart = arcPoint(startAngle);
    const bgEnd = arcPoint(startAngle + sweep);
    children.push(el('path', {
      d: `M${bgStart.x},${bgStart.y} A${r},${r} 0 0 1 ${bgEnd.x},${bgEnd.y}`,
      fill: 'none', stroke: 'currentColor', 'stroke-opacity': '.1', 'stroke-width': thickness, 'stroke-linecap': 'round'
    }));

    // zone arcs
    if (zones && zones.length) {
      zones.forEach(z => {
        const zStart = Math.min(Math.max((z.from - min) / range, 0), 1);
        const zEnd = Math.min(Math.max((z.to - min) / range, 0), 1);
        const a1 = startAngle + zStart * sweep;
        const a2 = startAngle + zEnd * sweep;
        const p1 = arcPoint(a1);
        const p2 = arcPoint(a2);
        const largeArc = (a2 - a1) > 180 ? 1 : 0;
        children.push(el('path', {
          d: `M${p1.x},${p1.y} A${r},${r} 0 ${largeArc} 1 ${p2.x},${p2.y}`,
          fill: 'none', stroke: resolveColor(z.color || '--bs-secondary'), 'stroke-width': thickness - 4, 'stroke-opacity': '.3', 'stroke-linecap': 'butt'
        }));
      });
    }

    // value arc
    const valAngle = startAngle + frac * sweep;
    const valEnd = arcPoint(valAngle);
    const largeArc = frac > 0.5 ? 1 : 0;
    const color = opts.color ? resolveColor(opts.color)
      : (frac < 0.33 ? resolveColor('--bs-success') : frac < 0.66 ? resolveColor('--bs-warning') : resolveColor('--bs-danger'));

    if (frac > 0.001) {
      const valPath = el('path', {
        d: `M${bgStart.x},${bgStart.y} A${r},${r} 0 ${largeArc} 1 ${valEnd.x},${valEnd.y}`,
        fill: 'none', stroke: color, 'stroke-width': thickness, 'stroke-linecap': 'round'
      });
      if (animate) {
        valPath.setAttribute('stroke-dasharray', circ);
        valPath.setAttribute('stroke-dashoffset', circ);
        valPath.appendChild(el('animate', {
          attributeName: 'stroke-dashoffset', from: circ, to: circ * (1 - frac),
          dur: '0.8s', fill: 'freeze'
        }));
      }
      children.push(valPath);
    }

    // needle
    const needleAngle = (startAngle + frac * sweep) * Math.PI / 180;
    const needleLen = r - thickness / 2;
    const nx = cx + needleLen * Math.cos(needleAngle);
    const ny = cy + needleLen * Math.sin(needleAngle);
    children.push(el('line', { x1: cx, y1: cy, x2: nx, y2: ny, stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round' }));
    children.push(el('circle', { cx, cy, r: 4, fill: color }));

    // value text
    if (showValue) {
      children.push(el('text', { x: cx, y: cy + 20, 'text-anchor': 'middle', 'font-size': '24', 'font-weight': '600', fill: 'currentColor' }, [String(value)]));
    }
    if (label) {
      children.push(el('text', { x: cx, y: cy + 36, 'text-anchor': 'middle', 'font-size': '11', fill: 'currentColor', opacity: '.6' }, [label]));
    }

    // min/max labels
    children.push(el('text', { x: bgStart.x + 4, y: cy + 14, 'font-size': '9', fill: 'currentColor', opacity: '.4' }, [String(min)]));
    children.push(el('text', { x: bgEnd.x - 4, y: cy + 14, 'text-anchor': 'end', 'font-size': '9', fill: 'currentColor', opacity: '.4' }, [String(max)]));

    return mount(target, svg(size, size * 0.65, children, 'bm-chart bm-gauge'));
  }

  // --- Public API ---
  return { bar, line, sparkline, donut, gauge };
})();
