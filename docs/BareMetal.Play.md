# BareMetal.Play

> Interactive story reader over PicoWAL story packs. Conditions gate options, effects change player state, personas fill scene Markdown, and node triggers render as letters or notes.

**Size:** 27 KB source / 14 KB minified  
**Dependencies:** `BareMetal.Markdown` (optional; scenes fall back to plain text)  
**Styles:** [`BareMetal.Play.css`](../src/BareMetal.Play.css) plus `BareMetalStyles` and a theme (`candy` is typical)

This module does not call an LLM, mail, or SMS host. A live demo is [`examples/story-play.html`](../examples/story-play.html). The matching editor is [`BareMetal.Story`](BareMetal.Story.md).

## Quick Start

Serve the page from loopback and point it at a PicoWAL HTTP host:

```html
<link rel="stylesheet" href="BareMetalStyles.css">
<link rel="stylesheet" href="fonts/fonts.css">
<link rel="stylesheet" href="themes/candy.css">
<link rel="stylesheet" href="BareMetal.Play.css">
<script src="BareMetal.Markdown.js"></script>
<script src="BareMetal.Play.js"></script>
<div id="app"></div>
<script>
  BareMetal.Play.mount("#app");
</script>
```

Or run without a server, using an in-memory seed (works from `file://` too):

```html
<script>
  var client = BareMetal.Play.memoryClient({
    stories: [{ id: 1, slug: "paper-lantern", title: "The Paper Lantern", description: "A courtyard that exists only in this story.", tags: ["sample", "fiction"] }],
    nodes: [
      { id: 1, story_id: 1, key: "yard", text: "The lantern sits on warm stones.\n\nYou notice {{state.facts.notice}}.", triggers: [{ template: "yard-letter", to: "the courtyard" }] },
      { id: 2, story_id: 1, key: "glow", text: "A small blue flame. This path ends.", is_ending: true }
    ],
    choices: [{ id: 1, node_id: 1, label: "Light the lantern", target_node_key: "glow" }],
    personas: [
      { id: 1, story_id: 1, key: "courtyard", role: "narrator", base_facts: { sign: "Told by the courtyard, which exists only in this story.", weather: "damp and still" } },
      { id: 2, story_id: 1, key: "visitor", role: "protagonist", base_facts: { notice: "the wet paint before the lantern" } }
    ],
    templates: [{ id: 1, key: "yard-letter", channel: "email", subject: "The courtyard", body: "For {{to}}. You hold {{state.inventory}}." }]
  });
  BareMetal.Play.mount("#app", { client: client });
</script>
```

## PicoWAL HTTP host

When you omit `options.client`, `mount` talks to the same origin. The host must be loopback (`127.0.0.1`, `localhost`, or `::1`). Default packs:

| Pack | Table |
| --- | --- |
| 1 | stories |
| 2 | nodes |
| 3 | choices |
| 4 | personas |
| 5 | templates |
| 6 | user_progress |

Record 0 of each pack is the next-id watermark. It is not a row. Payloads are JSON objects, at most 4096 bytes.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/list/{pack}` | `{"pack":N,"records":[{"record":1,"data":{...}}],"count":1}` |
| POST | `/{pack}` | `201 {"record":N}` |
| GET | `/{pack}/{id}` | the JSON row |
| PUT | `/{pack}/{id}` | `204` (replace / upsert) |
| DELETE | `/{pack}/{id}` | `204` |

Send `Content-Type: application/json` only. Do not send `X-Requested-With`. List may embed `data` as an object or as a JSON string.

A prototype host that speaks this contract is `python server/serve.py` in [project_storybook](https://github.com/WillEastbury/project_storybook).

## Row shapes

### stories

```json
{ "slug": "paper-lantern", "title": "The Paper Lantern", "description": "A sample.", "tags": ["sample", "fiction"], "author_id": "sample" }
```

### nodes

```json
{
  "story_id": 1,
  "key": "yard",
  "text": "![A paper lantern](/art/yard.jpg)\n\nThe courtyard exists only in this story. You notice {{state.facts.notice}}.",
  "is_ending": false,
  "conditions": null,
  "triggers": [{ "template": "yard-letter", "to": "the courtyard" }]
}
```

`text` is Markdown. A leading image is a scene illustration. `key` is unique. The start node is the lowest-id keyed node that no choice targets.

### choices

```json
{
  "node_id": 1,
  "label": "Light the lantern",
  "target_node_key": "glow",
  "conditions": { "inventory": { "$contains": "a painted key" } },
  "effects": [{ "op": "add_item", "item": "a painted key" }]
}
```

Omit `conditions` / `effects` when the option is always offered and changes nothing.

### personas

```json
{
  "story_id": 1,
  "key": "courtyard",
  "role": "narrator",
  "system_prompt": "Rewrite the scene as fiction. Keep Markdown images. Return only the scene text.",
  "base_facts": { "sign": "Told by the courtyard, which exists only in this story.", "weather": "damp and still" }
}
```

`role` is `narrator`, `protagonist`, or `subject`. Omit `story_id` for a shared persona. `base_facts.sign` is the player-facing line. Protagonist `base_facts` merge into `state.facts` when a play starts. `system_prompt` is for a rewriter and is not shown.

### templates

```json
{ "key": "yard-letter", "channel": "email", "subject": "The courtyard", "body": "For {{to}}. You hold {{state.inventory}}." }
```

`channel` is `email` (letter) or `sms` (note). The reader renders a node's `triggers` on the page. It does not POST mail or SMS.

### user_progress

Written by the reader:

```json
{
  "user_id": "player-abc",
  "story_id": 1,
  "current_node_key": "yard",
  "state": { "inventory": [], "facts": { "notice": "the wet paint before the lantern" }, "log": ["A letter for the courtyard."] },
  "generated_texts": {},
  "history": [{ "node_key": "yard", "choice_id": 1, "timestamp": "2026-10-18T12:00:00.000Z" }]
}
```

Player id is `localStorage` key `storybook.player`.

## Conditions and effects

Conditions gate a node or a choice. Empty or missing conditions pass.

```json
{ "inventory": { "$contains": "a strip of colour" } }
{ "reputation": { "$gte": 5 } }
{ "facts.wearing": { "$contains": "black jacket" } }
```

`$contains` is array membership. `$gte` is numeric. A dotted path walks `state`. Any other operator fails.

Effects run when the player takes a choice:

| `op` | Fields | Result |
| --- | --- | --- |
| `add` | `var`, `value` (number) | add to a number (missing starts at 0) |
| `set` | `var`, `value` | set a flag |
| `add_item` | `item` | push onto `inventory` (duplicates allowed) |
| `remove_item` | `item` | remove the first match |
| `append` | `var`, `value` | push onto an array |

## Placeholders

When `generated_texts[node.key]` is a non-empty string, that cache wins. Otherwise `node.text` and template bodies fill `{{path}}`:

| Token | Value |
| --- | --- |
| `{{state.inventory}}` | joined items, or `nothing` |
| `{{state.facts.notice}}` | a fact |
| `{{persona.base_facts.weather}}` | narrator fact |
| `{{history_summary}}` | node keys visited, or "The story has only just opened." |
| `{{to}}` | trigger address |
| `{{mail.held}}` / `{{sms.held}}` | `{"messages":[]}` until those hosts exist |

## Host CSS classes

`BareMetal.Play.css` styles: `.play-wrap`, `.play-top`, `.play-mark`, `.play-fiction`, `.play-editor`, `.play-h`, `.play-lead`, `.play-voice`, `.play-grid`, `.play-card`, `.play-tags`, `.play-tag`, `.play-paper`, `.play-kicker`, `.play-scene`, `.play-slip`, `.play-choices`, `.play-choice`, `.play-side`, `.play-row`, `.play-note`, `.play-error`.

## API Reference

### `PACKS`

```js
{ stories: 1, nodes: 2, choices: 3, personas: 4, templates: 5, user_progress: 6 }
```

### `mount(target, options?)`

Builds the reader in `target` (selector or element). Lists stories, opens a play, offers gated choices, and stores progress.

| Option | Meaning |
| --- | --- |
| `client` | Object with `list`, `create`, `put` (and optionally `remove`, `ping`). Skip the loopback check when this is set. |

### `memoryClient(seed)` → `client`

In-memory PicoWAL stand-in. `seed` keys are pack numbers or table names (`stories`, `nodes`, …). Rows may include `id`.

### `freshState()` → `{ inventory: [], facts: {}, log: [] }`

### `matchConditions(state, conditions)` → `boolean`

### `applyEffects(state, effects)` → `state`

### `entryNode(nodes, choices, state)` → `node|null`

### `offeredChoices(node, nodes, choices, state)` → `choice[]`

### `fillText(text, ctx)` → `string`

### `sceneText(node, progress, persona)` → `string`

### `withPersonaFacts(state, personas, storyId)` → `state`

### `narratorOf(personas, storyId)` → `persona|null`

### `slipsFor(node, templates, progress, persona)` → `slip[]`

### `fireTriggers(node, templates, progress, persona)` → `slip[]`

Appends a short log line per trigger (`A letter for …` / `A note for …`) and returns the rendered slips.
