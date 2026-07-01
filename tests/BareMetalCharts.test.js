/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const SRC = path.resolve(__dirname, '../src/BareMetal.Charts.js');

function loadCharts() {
  delete require.cache[SRC];
  return require(SRC);
}

describe('BareMetal.Charts', () => {
  let Charts;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="target"></div>';
    container = document.getElementById('target');
    Charts = loadCharts();
  });

  test('exports all chart renderers', () => {
    expect(Object.keys(Charts)).toEqual(['bar', 'line', 'sparkline', 'donut', 'gauge']);
  });

  test('bar renders a vertical chart with bars, axis and labels', () => {
    Charts.bar(container, [{ label: 'A', value: 3 }, { label: 'B', value: 6 }], { animate: false });

    expect(container.querySelector('svg.bm-bar')).toBeTruthy();
    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(container.querySelectorAll('line')).toHaveLength(1);
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('6');
  });

  test('bar renders a horizontal chart with animated widths', () => {
    Charts.bar(container, [2, 4], { horizontal: true, animate: true });

    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(container.querySelectorAll('animate[attributeName="width"]')).toHaveLength(2);
  });

  test('bar accepts a selector target', () => {
    const result = Charts.bar('#target', [1], { animate: false });
    expect(result).toBe(container);
  });

  test('bar throws when the target is missing', () => {
    expect(() => Charts.bar('#missing', [1])).toThrow('BareMetalCharts: target not found');
  });

  test('line renders grid lines, a stroke path and dots', () => {
    Charts.line(container, [1, 4, 2], { animate: false });

    expect(container.querySelector('svg.bm-line')).toBeTruthy();
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(container.querySelectorAll('line')).toHaveLength(5);
  });

  test('line supports smooth multi-series charts', () => {
    Charts.line(container, [
      { name: 'A', values: [1, 2, 3] },
      { name: 'B', values: [2, 1, 4] }
    ], { smooth: true, fill: false, dots: false, animate: false, labels: ['Jan', 'Feb', 'Mar'] });

    const paths = Array.from(container.querySelectorAll('path')).map((el) => el.getAttribute('d') || '');
    expect(paths.some((d) => d.includes(' C'))).toBe(true);
    expect(container.textContent).toContain('Jan');
  });

  test('line adds animation stroke metadata when enabled', () => {
    Charts.line(container, [1, 2, 3], { animate: true });
    expect(container.querySelector('animate[attributeName="stroke-dashoffset"]')).toBeTruthy();
  });

  test('sparkline renders a compact chart', () => {
    Charts.sparkline(container, [1, 3, 2, 5], { fill: false });

    const svg = container.querySelector('svg.bm-sparkline');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 120 32');
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  test('sparkline can render a filled area', () => {
    Charts.sparkline(container, [1, 3, 2], { fill: true });
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  test('donut renders ring segments and labels', () => {
    Charts.donut(container, [
      { label: 'A', value: 2 },
      { label: 'B', value: 1 }
    ], { animate: false, centerText: 3, centerLabel: 'Total' });

    expect(container.querySelector('svg.bm-donut')).toBeTruthy();
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('Total');
  });

  test('donut adds animate nodes when animation is enabled', () => {
    Charts.donut(container, [1, 2], { animate: true });
    expect(container.querySelectorAll('animate[attributeName="stroke-dasharray"]')).toHaveLength(2);
  });

  test('gauge renders arcs, needle and value text', () => {
    Charts.gauge(container, 75, { animate: false, label: 'CPU' });

    expect(container.querySelector('svg.bm-gauge')).toBeTruthy();
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll('line')).toHaveLength(1);
    expect(container.textContent).toContain('75');
    expect(container.textContent).toContain('CPU');
  });

  test('gauge renders configured zones', () => {
    Charts.gauge(container, 40, {
      animate: false,
      zones: [
        { from: 0, to: 30, color: '--bs-success' },
        { from: 30, to: 60, color: '--bs-warning' }
      ]
    });

    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(3);
  });

  test('gauge adds animation to the value arc when enabled', () => {
    Charts.gauge(container, 80, { animate: true });
    expect(container.querySelector('animate[attributeName="stroke-dashoffset"]')).toBeTruthy();
  });

  test('gauge omits the value arc for values near zero', () => {
    Charts.gauge(container, 0, { animate: false });
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });
});
