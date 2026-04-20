# BareMetalGraph

Force-directed graph visualiser. Renders interactive node/edge diagrams into SVG with auto-layout, drag, zoom, and hover highlighting. Zero dependencies.

## Quick start

```html
<script src="BareMetalGraph.js"></script>
<div id="graph" style="width:800px; height:500px;"></div>
<script>
  const g = BareMetalGraph.create('#graph', {
    nodes: [
      { id: 'auth', label: 'Auth Service' },
      { id: 'api', label: 'API Gateway' },
      { id: 'db', label: 'Database' },
      { id: 'cache', label: 'Redis Cache' }
    ],
    edges: [
      { source: 'api', target: 'auth', label: 'JWT' },
      { source: 'api', target: 'db' },
      { source: 'api', target: 'cache' },
      { source: 'auth', target: 'db' }
    ]
  }, { directed: true });
</script>
```

## API

### `BareMetalGraph.create(target, data, opts)` → handle

Creates a graph visualisation.

**Data format:**

```js
{
  nodes: [
    { id: 'a', label: 'Node A', group: 'services', detail: 'Extra info on hover' },
    { id: 'b', label: 'Node B', color: '--bs-danger', radius: 30, pinned: true }
  ],
  edges: [
    { source: 'a', target: 'b', label: 'calls', weight: 2 },
    ['a', 'b']  // shorthand
  ]
}
```

Nodes can also be plain strings: `nodes: ['a', 'b', 'c']`

**Options:**

| Option | Default | Description |
|---|---|---|
| `width` | 800 | SVG viewBox width |
| `height` | 500 | SVG viewBox height |
| `nodeRadius` | 20 | Default node radius |
| `directed` | false | Show arrow markers on edges |
| `showLabels` | true | Show node labels below |
| `labelField` | 'label' | Node property for label text |
| `draggable` | true | Enable node dragging |
| `zoomable` | true | Enable scroll zoom + pan |
| `groupField` | null | Property name to group/color nodes by |
| `colors` | palette | Custom color array |
| `repulsion` | 800 | Coulomb repulsion strength |
| `springLen` | 120 | Ideal edge length |
| `springK` | 0.05 | Spring stiffness |
| `damping` | 0.85 | Velocity damping (0–1) |
| `centerForce` | 0.01 | Pull toward center |

### Handle methods

| Method | Description |
|---|---|
| `handle.addNode(node)` | Add a node dynamically |
| `handle.addEdge(edge)` | Add an edge dynamically |
| `handle.removeNode(id)` | Remove node and its edges |
| `handle.removeEdge(source, target)` | Remove a specific edge |
| `handle.pin(id)` | Pin a node in place |
| `handle.unpin(id)` | Release a pinned node |
| `handle.stop()` | Pause simulation |
| `handle.restart()` | Resume simulation |
| `handle.destroy()` | Remove SVG and stop |

All mutating methods return the handle for chaining:
```js
g.addNode({ id: 'new', label: 'New' }).addEdge(['api', 'new']);
```

## Interactions

- **Drag** nodes to rearrange — simulation reheats on drag
- **Hover** a node to highlight it and its connected edges
- **Scroll** to zoom in/out (zooms toward cursor)
- **Click + drag** background to pan
- Nodes with `detail` property show detail text on hover

## Grouping

Color nodes by group automatically:

```js
BareMetalGraph.create('#graph', data, {
  groupField: 'team',
  groupColors: ['--bs-primary', '--bs-success', '--bs-warning']
});
```

## Physics tuning

Adjust the force simulation for different graph sizes:

```js
// Dense graph — more repulsion, shorter springs
{ repulsion: 1500, springLen: 80, springK: 0.08 }

// Sparse graph — gentle forces
{ repulsion: 400, springLen: 200, springK: 0.02 }
```

The simulation auto-settles when kinetic energy drops below threshold.
