# BareMetal.Charts

> Lightweight SVG chart rendering for bars, lines, sparklines, donuts, and gauges.

**Size:** 16.30 KB source / 8.50 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Charts.min.js"></script>
<div id="sales-chart"></div>
<script>
  BareMetal.Charts.bar('#sales-chart', [
    { label: 'Jan', value: 42 },
    { label: 'Feb', value: 57 },
    { label: 'Mar', value: 51 }
  ]);
</script>
```

## API Reference

All chart functions accept a CSS selector or DOM element as `target`, replace its contents, and return the mounted container element.

### `bar(target, data, options)` → `HTMLElement`

Renders a vertical or horizontal bar chart.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | string\|HTMLElement | — | Container selector or element |
| data | number[]\|object[] | — | Numbers or `{ label, value }` items |
| options | object | `{}` | Bar chart options |

**Example:**
```js
BareMetal.Charts.bar('#revenue', [
  { label: 'Q1', value: 120000 },
  { label: 'Q2', value: 156000 },
  { label: 'Q3', value: 149000 }
], { showValues: true, colors: ['--bs-primary'] });
```

### `line(target, data, options)` → `HTMLElement`

Renders a single-series or multi-series line chart.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | string\|HTMLElement | — | Container selector or element |
| data | number[]\|object[]\|series[] | — | Numbers, `{ label, value }`, or `[{ name, values }]` |
| options | object | `{}` | Line chart options |

**Example:**
```js
BareMetal.Charts.line('#traffic', [
  { label: 'Mon', value: 240 },
  { label: 'Tue', value: 280 },
  { label: 'Wed', value: 260 }
], { fill: true, smooth: true });
```

### `sparkline(target, values, options)` → `HTMLElement`

Renders a compact inline trend chart.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | string\|HTMLElement | — | Container selector or element |
| values | number[] | — | Raw numeric series |
| options | object | `{}` | Sparkline options |

### `donut(target, data, options)` → `HTMLElement`

Renders a donut or pie chart with optional labels and center text.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | string\|HTMLElement | — | Container selector or element |
| data | number[]\|object[] | — | Numbers or `{ label, value }` items |
| options | object | `{}` | Donut options |

**Example:**
```js
BareMetal.Charts.donut('#share', [
  { label: 'API', value: 54 },
  { label: 'Web', value: 28 },
  { label: 'Batch', value: 18 }
], { centerText: '54%', centerLabel: 'API' });
```

### `gauge(target, value, options)` → `HTMLElement`

Renders a semi-circular gauge with optional colored zones.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | string\|HTMLElement | — | Container selector or element |
| value | number | — | Current gauge value |
| options | object | `{}` | Gauge options |

**Example:**
```js
BareMetal.Charts.gauge('#health', 74, {
  min: 0,
  max: 100,
  label: 'Service health',
  zones: [
    { from: 0, to: 50, color: '--bs-danger' },
    { from: 50, to: 80, color: '--bs-warning' },
    { from: 80, to: 100, color: '--bs-success' }
  ]
});
```

## Configuration / Options

### Bar chart options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| width | number | `400` | ViewBox width |
| height | number | `250` | ViewBox height |
| gap | number | `4` | Space between bars |
| padding | number | `40` | Outer chart padding |
| horizontal | boolean | `false` | Switches to horizontal layout |
| showValues | boolean | `true` | Displays value labels |
| showLabels | boolean | `true` | Displays category labels |
| colors | string[]\|null | `null` | Per-bar colors or CSS variable names |
| animate | boolean | `true` | Animates bar growth |

### Line chart options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| width | number | `400` | ViewBox width |
| height | number | `250` | ViewBox height |
| padding | number | `40` | Outer chart padding |
| fill | boolean | `true` | Fills the area under each line |
| dots | boolean | `true` | Draws point markers |
| smooth | boolean | `false` | Uses bezier curves |
| colors | string[]\|null | `null` | Per-series colors |
| showLabels | boolean | `true` | Shows x-axis labels |
| animate | boolean | `true` | Animates line drawing |
| labels | string[] | `[]` | X-axis labels for multi-series input |

### Sparkline options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| width | number | `120` | ViewBox width |
| height | number | `32` | ViewBox height |
| color | string | `'--bs-primary'` | Stroke color |
| strokeWidth | number | `1.5` | Line thickness |
| fill | boolean | `false` | Fills the area under the line |

### Donut options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| size | number | `200` | Diameter |
| thickness | number | `40` | Ring thickness; use `0` for a full pie look |
| colors | string[]\|null | `null` | Per-slice colors |
| showLabels | boolean | `true` | Draws outer labels |
| animate | boolean | `true` | Animates slice drawing |
| startAngle | number | `-90` | Rotation in degrees |
| centerText | string\|number | — | Large text in the center |
| centerLabel | string | — | Small secondary center label |

### Gauge options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| size | number | `200` | Gauge diameter |
| min | number | `0` | Minimum value |
| max | number | `100` | Maximum value |
| thickness | number | `20` | Arc thickness |
| color | string\|null | `null` | Fixed color; otherwise auto green/yellow/red |
| animate | boolean | `true` | Animates the value arc |
| label | string | `''` | Caption under the value |
| showValue | boolean | `true` | Shows the numeric value |
| zones | object[]\|null | `null` | Background bands as `{ from, to, color }` |

## Examples

### Example 1: KPI dashboard row
```html
<script src="BareMetal.Charts.min.js"></script>
<div id="trend"></div>
<div id="spark"></div>
<div id="target"></div>
<script>
  BareMetal.Charts.line('#trend', [
    { label: 'Week 1', value: 11 },
    { label: 'Week 2', value: 14 },
    { label: 'Week 3', value: 13 },
    { label: 'Week 4', value: 17 }
  ], { smooth: true });

  BareMetal.Charts.sparkline('#spark', [11, 14, 13, 17, 19, 18], { fill: true });
  BareMetal.Charts.gauge('#target', 82, { label: 'Quota %' });
</script>
```

### Example 2: Multi-series trend chart
```js
BareMetal.Charts.line('#capacity', [
  { name: 'CPU', values: [48, 52, 61, 58, 67] },
  { name: 'Memory', values: [72, 69, 75, 77, 74] }
], {
  labels: ['09:00', '10:00', '11:00', '12:00', '13:00'],
  dots: false,
  fill: false
});
```

## Notes
- Colors beginning with `--` are emitted as CSS custom properties like `var(--bs-primary)`.
- Each render clears the target container before mounting a new SVG.
- Text and axis elements use `currentColor`, so the host element controls chart text color.
- The module only renders SVG; it does not manage resizing observers or live data updates.
