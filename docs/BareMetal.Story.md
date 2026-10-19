# BareMetal.Story

> Authoring editor for interactive stories: stories, interactions (nodes), options (choices), personas, and templates, stored as PicoWAL JSON rows.

**Size:** 44 KB source / 25 KB minified  
**Dependencies:** `BareMetal.Bind`, `BareMetal.Template`, `BareMetal.Metadata`, `BareMetal.Graph`, `BareMetal.Markdown`, `BareMetal.UndoRedo`, `BareMetal.Notify`

The host page supplies CSS. An interaction is a node. An option is a choice.

## Quick Start

```html
<link rel="stylesheet" href="BareMetalStyles.css">
<link rel="stylesheet" href="themes/wavefunction.css">
<script src="BareMetal.Bind.js"></script>
<script src="BareMetal.Template.js"></script>
<script src="BareMetal.Metadata.js"></script>
<script src="BareMetal.Graph.js"></script>
<script src="BareMetal.Markdown.js"></script>
<script src="BareMetal.UndoRedo.js"></script>
<script src="BareMetal.Notify.js"></script>
<script src="BareMetal.Story.js"></script>
<div id="app"></div>
<script>
  BareMetal.Story.mount("#app");
</script>
```

The page must be served from loopback. Same-origin PicoWAL routes as `BareMetal.Play`. Default packs: `1` stories, `2` nodes, `3` choices, `4` personas, `5` templates, `6` user_progress.

## API Reference

### `PACKS`

Same map as `BareMetal.Play`.

### `mount(target)`

Builds the editor in `target`. Loads all six packs, edits rows, and draws the interaction graph.

### `validateConditions(value)` → `{ ok, value?, error? }`

JSON object of `$contains` / `$gte` clauses, or empty.

### `validateEffects(value)` → `{ ok, value?, error? }`

JSON array of `add`, `set`, `add_item`, `remove_item`, `append`.

### `validateTriggers(value)` → `{ ok, value?, error? }`

JSON array of `{template, to}`.

### `validateBaseFacts(value)` → `{ ok, value?, error? }`

JSON object. Empty becomes `{}`.

### `graphData(nodes, choices)` → `{ nodes, edges }`

Force-graph payload for the current story.

## Row shapes

| Table | Fields |
| --- | --- |
| stories | `slug`, `title`, `description`, `tags`, `author_id` |
| nodes | `story_id`, `key`, `text`, `is_ending`, `conditions`, `triggers` |
| choices | `node_id`, `label`, `target_node_key`, `conditions`, `effects` |
| personas | `story_id` (omit when shared), `key`, `role` (`protagonist` / `subject` / `narrator`), `system_prompt`, `base_facts` |
| templates | `key`, `channel` (`email` / `sms`), `subject`, `body` |
| user_progress | loaded so deleting a story can remove that story's progress |

Shared personas and templates stay when a story is deleted. Record payloads stay at or under 4096 bytes.
