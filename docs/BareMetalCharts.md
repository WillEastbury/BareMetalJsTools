# BareMetalCharts

Lightweight SVG chart renderer. Zero dependencies. Themed via BareMetalStyles CSS custom properties.

## Quick start

```html
<script src="BareMetalCharts.js"></script>
<div id="my-chart"></div>
<script>
  BareMetalCharts.bar('#my-chart', [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 55 },
    { label: 'Mar', value: 42 }
  ]);
</script>
```

## API

### `BareMetalCharts.bar(target, data, opts)`

Vertical or horizontal bar chart.

| Option | Default | Description |
|---|---|---|
| `width` | 400 | SVG width |
| `height` | 250 | SVG height |
| `horizontal` | false | Horizontal bars |
| `gap` | 4 | Gap between bars |
| `showValues` | true | Show value labels |
| `showLabels` | true | Show axis labels |
| `colors` | palette | Array of CSS colors or custom property names |
| `animate` | true | Animate bars on render |

Data: array of `{ label, value }` or plain numbers.

### `BareMetalCharts.line(target, data, opts)`

Line chart with optional area fill, dots, and smooth curves.

| Option | Default | Description |
|---|---|---|
| `width` | 400 | SVG width |
| `height` | 250 | SVG height |
| `fill` | true | Area fill under line |
| `dots` | true | Show data point circles |
| `smooth` | false | Bezier curve smoothing |
| `colors` | palette | Color per series |
| `animate` | true | Draw-on animation |

Data: array of `{ label, value }`, plain numbers, or multi-series `[{ name, values: [...] }]`.

### `BareMetalCharts.sparkline(target, values, opts)`

Minimal inline chart — no axes, no labels.

| Option | Default | Description |
|---|---|---|
| `width` | 120 | SVG width |
| `height` | 32 | SVG height |
| `color` | `--bs-primary` | Stroke color |
| `strokeWidth` | 1.5 | Line width |
| `fill` | false | Area fill |

Data: plain array of numbers.

### `BareMetalCharts.donut(target, data, opts)`

Donut or pie chart with animated segments.

| Option | Default | Description |
|---|---|---|
| `size` | 200 | Diameter |
| `thickness` | 40 | Ring thickness (0 = full pie) |
| `centerText` | — | Large center label |
| `centerLabel` | — | Small center subtitle |
| `showLabels` | true | Segment labels |
| `animate` | true | Segment draw animation |

Data: array of `{ label, value }` or plain numbers.

### `BareMetalCharts.gauge(target, value, opts)`

Semicircular gauge with needle.

| Option | Default | Description |
|---|---|---|
| `size` | 200 | Diameter |
| `min` | 0 | Minimum value |
| `max` | 100 | Maximum value |
| `thickness` | 20 | Arc thickness |
| `color` | auto | Auto green→yellow→red, or fixed color |
| `label` | — | Label below value |
| `zones` | — | Array of `{ from, to, color }` for background zones |
| `animate` | true | Sweep animation |

## Theming

All charts use `currentColor` for text/axes and the BareMetalStyles palette (`--bs-primary`, `--bs-success`, etc.) for data colors. Override via the `colors` option or CSS custom properties.
