# BareMetal.Story

> Authoring editor for interactive stories: stories, interactions (nodes), options (choices), personas, and templates, stored as PicoWAL JSON rows.

**Size:** 46 KB source / 27 KB minified  
**Dependencies:** `BareMetal.Bind`, `BareMetal.Template`, `BareMetal.Metadata`, `BareMetal.Graph`, `BareMetal.Markdown`, `BareMetal.UndoRedo`, `BareMetal.Notify`  
**Styles:** [`BareMetal.Story.css`](../src/BareMetal.Story.css) plus `BareMetalStyles` and a theme (`wavefunction` is typical)

An interaction is a node. An option is a choice. The reader that plays these rows is [`BareMetal.Play`](BareMetal.Play.md). A live demo is [`examples/story-editor.html`](../examples/story-editor.html).

## Quick Start

Serve from loopback against a PicoWAL HTTP host (same routes as Play):

```html
<link rel="stylesheet" href="BareMetalStyles.css">
<link rel="stylesheet" href="fonts/fonts.css">
<link rel="stylesheet" href="themes/wavefunction.css">
<link rel="stylesheet" href="BareMetal.Story.css">
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

Or seed an in-memory store (no server, works from `file://`):

```js
BareMetal.Story.mount("#app", {
  client: BareMetal.Story.memoryClient({
    stories: [{ id: 1, slug: "paper-lantern", title: "The Paper Lantern", tags: ["sample", "fiction"] }],
    nodes: [{ id: 1, story_id: 1, key: "yard", text: "The lantern sits on warm stones." }],
    choices: [],
    personas: [],
    templates: []
  })
});
```

Default packs: `1` stories, `2` nodes, `3` choices, `4` personas, `5` templates, `6` user_progress. Record 0 is the id watermark. Row payloads stay at or under 4096 bytes. HTTP details are in [`BareMetal.Play`](BareMetal.Play.md#picowal-http-host).

## How to author a story

1. **New story** — slug, title, description, comma-separated tags.
2. **Map** — add an interaction. `key` is stable (`yard`). `text` is Markdown; a leading `![alt](/art/yard.jpg)` is the scene picture. Mark endings with `is_ending`.
3. **Options** on that interaction — label the player sees, target interaction key, optional conditions and effects.
4. **Personas** — narrator (`base_facts.sign` is shown to the player) and protagonist (`base_facts` merge into `state.facts`).
5. **Templates** — `email` or `sms` body with `{{placeholders}}`. Name a template from an interaction's triggers: `[{"template":"yard-letter","to":"the courtyard"}]`.
6. **Read** — open the Play page on the same host. Begin again after changing opening copy.

Conditions: `$contains` and `$gte` only. Effects: `add`, `set`, `add_item`, `remove_item`, `append`. Triggers are not sent as mail or SMS; Play shows them as a letter or a note.

Deleting a story removes its interactions, options, story-owned personas, and that story's progress. Shared personas (no `story_id`) and templates stay.

## Host CSS classes

`BareMetal.Story.css` styles: `.se-shell`, `.se-top`, `.se-mark`, `.se-stories`, `.se-main`, `.se-side`, `.se-bar`, `.se-list`, `.se-stage`, `.se-graph`, `.se-item`, `.se-inspector`, `.se-help`, `.se-preview`.

## API Reference

### `PACKS`

Same map as `BareMetal.Play`.

### `mount(target, options?)`

Builds the editor in `target`. Loads all six packs, edits rows, and draws the interaction graph.

| Option | Meaning |
| --- | --- |
| `client` | Object with `list`, `create`, `put`, `remove`, `ping`. Skip the loopback check when this is set. `ping` may resolve to HTML; a non-JSON 200 still counts as success. |

### `memoryClient(seed)` → `client`

In-memory PicoWAL stand-in. Same seed shape as `BareMetal.Play.memoryClient`.

### `validateConditions(value)` → `{ ok, value?, error? }`

JSON object of `$contains` / `$gte` clauses, or empty.

### `validateEffects(value)` → `{ ok, value?, error? }`

JSON array of `add`, `set`, `add_item`, `remove_item`, `append`.

### `validateTriggers(value)` → `{ ok, value?, error? }`

JSON array of `{template, to}`.

### `validateBaseFacts(value)` → `{ ok, value?, error? }`

JSON object. Empty becomes `{}`.

### `graphData(nodes, choices)` → `{ nodes, edges }`

Force-graph payload. Node ids are `"n" + recordId`.

## Row shapes

| Table | Fields |
| --- | --- |
| stories | `slug`, `title`, `description`, `tags`, `author_id` |
| nodes | `story_id`, `key`, `text`, `is_ending`, `conditions`, `triggers` |
| choices | `node_id`, `label`, `target_node_key`, `conditions`, `effects` |
| personas | `story_id` (omit when shared), `key`, `role` (`protagonist` / `subject` / `narrator`), `system_prompt`, `base_facts` |
| templates | `key`, `channel` (`email` / `sms`), `subject`, `body` |
| user_progress | loaded so deleting a story can remove that story's progress |

JSON examples live in [`BareMetal.Play`](BareMetal.Play.md#row-shapes).
