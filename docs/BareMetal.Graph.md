# BareMetal.Graph

> Interactive SVG force-directed graph visualisation with drag, zoom, and grouping.

**Size:** 18.39 KB source / 9.65 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Graph.min.js"></script>
<div id="graph" style="width:800px;height:500px;"></div>
<script>
  BareMetal.Graph.create('#graph', {
    nodes: [
      { id: 'api', label: 'API' },
      { id: 'db', label: 'Database' },
      { id: 'auth', label: 'Auth' }
    ],
    edges: [
      ['api', 'db'],
      { source: 'api', target: 'auth', label: 'JWT' }
    ]
  }, { directed: true });
</script>
```

## API Reference

### `create(target, data, options)` → `graphHandle`

Builds a graph in the target container and starts the force simulation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| target | string\|HTMLElement | — | Container selector or element |
| data | object | — | Graph data with `nodes` and `edges` |
| options | object | `{}` | Rendering and physics options |

**Example:**
```js
const graph = BareMetal.Graph.create('#services', {
  nodes: [
    { id: 'gateway', label: 'Gateway', group: 'edge' },
    { id: 'orders', label: 'Orders', group: 'services', detail: 'Handles checkout' },
    { id: 'postgres', label: 'Postgres', group: 'data', pinned: true }
  ],
  edges: [
    { source: 'gateway', target: 'orders', label: 'HTTP', weight: 2 },
    { source: 'orders', target: 'postgres', label: 'SQL' }
  ]
}, {
  directed: true,
  groupField: 'group'
});
```

### `graphHandle.svg` → `SVGElement`

The mounted SVG element.

### `graphHandle.simulation` → `Simulation`

The internal simulation instance.

### `graphHandle.nodes` → `object[]`

Live node array used by the simulation.

### `graphHandle.edges` → `object[]`

Live edge array used by the simulation.

### `graphHandle.addNode(node)` → `graphHandle`

Adds a node and reheats the simulation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| node | string\|object | — | Node id string or node object |

### `graphHandle.addEdge(edge)` → `graphHandle`

Adds an edge and reheats the simulation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| edge | array\|object | — | `[source, target]` or `{ source, target, ... }` |

### `graphHandle.removeNode(id)` → `graphHandle`

Removes a node and any connected edges.

### `graphHandle.removeEdge(source, target)` → `graphHandle`

Removes the first matching edge.

### `graphHandle.pin(id)` → `graphHandle`

Pins a node in place.

### `graphHandle.unpin(id)` → `graphHandle`

Releases a pinned node and restarts movement.

### `graphHandle.stop()` → `graphHandle`

Stops the animation loop.

### `graphHandle.restart()` → `graphHandle`

Restarts the animation loop.

### `graphHandle.destroy()` → `void`

Stops the simulation and clears the target container.

## Configuration / Options

### Data shape

#### Nodes

Nodes can be strings or objects.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Required unique identifier |
| label | string | Display label when `labelField` is `'label'` |
| radius | number | Node-specific radius override |
| color | string | Fixed fill color or CSS variable name |
| detail | string | Hover text shown above the node |
| pinned | boolean | Starts the node pinned |
| x / y | number | Optional starting position |
| group field | any | Used when `groupField` is configured |

#### Edges

Edges can be `[source, target]` arrays or objects.

| Field | Type | Description |
|-------|------|-------------|
| source | string | Source node id |
| target | string | Target node id |
| label | string | Optional edge label |
| weight | number | Stroke width override |

### Create options

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| width | number | `800` | SVG viewBox width |
| height | number | `500` | SVG viewBox height |
| nodeRadius | number | `20` | Default node radius |
| colors | string[]\|null | `null` | Palette override |
| directed | boolean | `false` | Shows arrow markers |
| showLabels | boolean | `true` | Draws node labels |
| labelField | string | `'label'` | Node property used for labels |
| draggable | boolean | `true` | Enables node dragging |
| zoomable | boolean | `true` | Enables wheel zoom and pan |
| repulsion | number | `800` | Node repulsion force |
| springLen | number | `120` | Ideal link distance |
| springK | number | `0.05` | Spring stiffness |
| damping | number | `0.85` | Velocity damping |
| centerForce | number | `0.01` | Pull toward center |
| groupField | string\|null | `null` | Node property used for grouping |
| groupColors | string[]\|null | `null` | Palette used with `groupField` |

## Examples

### Example 1: Grouped service map
```html
<script src="BareMetal.Graph.min.js"></script>
<div id="svc-graph" style="width:900px;height:520px;"></div>
<script>
  BareMetal.Graph.create('#svc-graph', {
    nodes: [
      { id: 'ui', label: 'Frontend', team: 'ui' },
      { id: 'api', label: 'API', team: 'platform' },
      { id: 'worker', label: 'Worker', team: 'platform' },
      { id: 'db', label: 'Database', team: 'data', pinned: true }
    ],
    edges: [
      ['ui', 'api'],
      ['api', 'worker'],
      ['api', 'db'],
      ['worker', 'db']
    ]
  }, {
    directed: true,
    groupField: 'team',
    groupColors: ['--bs-primary', '--bs-success', '--bs-warning']
  });
</script>
```

### Example 2: Mutate the graph after creation
```js
const handle = BareMetal.Graph.create('#graph', {
  nodes: ['A', 'B'],
  edges: [['A', 'B']]
});

handle
  .addNode({ id: 'C', label: 'Cache' })
  .addEdge({ source: 'B', target: 'C', weight: 2 })
  .pin('A');
```

## Notes
- The target container is cleared before the SVG is appended.
- Hovering highlights connected edges and optional `detail` text.
- Zoom uses the mouse wheel; panning is done by dragging the SVG background.
- The simulation auto-settles when kinetic energy stays low for several frames.
