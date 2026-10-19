# BareMetal.Play

> Interactive story reader over PicoWAL story packs. Conditions gate options, effects change player state, personas fill scene Markdown, and node triggers render as letters or notes.

**Size:** 25 KB source / 13 KB minified  
**Dependencies:** `BareMetal.Markdown` (optional; scenes fall back to plain text)

The host page supplies CSS (theme plus scene/choice layout). This module does not call an LLM, mail, or SMS host.

## Quick Start

```html
<link rel="stylesheet" href="BareMetalStyles.css">
<link rel="stylesheet" href="themes/candy.css">
<script src="BareMetal.Markdown.js"></script>
<script src="BareMetal.Play.js"></script>
<div id="app"></div>
<script>
  BareMetal.Play.mount("#app");
</script>
```

The page must be served from loopback (`127.0.0.1`, `localhost`, or `::1`). Same-origin routes:

| Method | Path | Pack |
| --- | --- | --- |
| GET | `/list/{pack}` | list records |
| POST | `/{pack}` | create |
| PUT | `/{pack}/{id}` | replace |

Default packs: `1` stories, `2` nodes, `3` choices, `4` personas, `5` templates, `6` user_progress. Record 0 of each pack is the id watermark and is not a row.

## API Reference

### `PACKS`

```js
{ stories: 1, nodes: 2, choices: 3, personas: 4, templates: 5, user_progress: 6 }
```

### `mount(target)`

Builds the reader in `target` (selector or element). Lists stories, opens a play, offers gated choices, and stores progress for a browser-local player id (`localStorage` key `storybook.player`).

### `freshState()` → `{ inventory: [], facts: {}, log: [] }`

### `matchConditions(state, conditions)` → `boolean`

Empty or missing conditions pass. `$contains` is array membership. `$gte` is numeric. A dotted path walks `state`. Any other operator fails.

### `applyEffects(state, effects)` → `state`

Ops: `add`, `set`, `add_item`, `remove_item`, `append`. `add_item` always pushes.

### `entryNode(nodes, choices, state)` → `node|null`

First untargeted keyed node whose conditions match, else the first keyed match.

### `offeredChoices(node, nodes, choices, state)` → `choice[]`

Choices on `node` whose conditions match and whose target node exists and matches.

### `fillText(text, ctx)` → `string`

Replaces `{{path}}` from `ctx`. Arrays join with `", "` or become `"nothing"`.

### `sceneText(node, progress, persona)` → `string`

Uses `progress.generated_texts[node.key]` when that value is a non-empty string. Otherwise fills placeholders in `node.text`.

### `withPersonaFacts(state, personas, storyId)` → `state`

Merges the story's protagonist `base_facts` into `state.facts` when a key is missing.

### `narratorOf(personas, storyId)` → `persona|null`

Narrator for the story, else the first story or shared persona.

### `slipsFor(node, templates, progress, persona)` → `slip[]`

Renders `node.triggers` (`{template, to}`) against template rows. Channel `email` is a letter; `sms` is a note.

Placeholder paths: `{{state.inventory}}`, `{{state.facts.notice}}`, `{{persona.base_facts.weather}}`, `{{history_summary}}`, `{{to}}`, `{{mail.held}}`, `{{sms.held}}`. Held mail and SMS are `{"messages":[]}` until those hosts exist.

## Notes

- `generated_texts` is a per-player cache. A missing entry is filled from authored Markdown plus persona facts.
- `base_facts.sign` is the player-facing narrator line on the shelf and story page.
- Fiction labeling and theme CSS belong to the host page.
