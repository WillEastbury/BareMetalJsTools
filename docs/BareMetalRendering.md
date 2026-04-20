# BareMetalRendering

Glues `BareMetalRest`, `BareMetalBind`, and `BareMetalTemplate` together to render a full entity (form or list) into a DOM node.

Depends on (load first): `BareMetalRest`, `BareMetalBind`, `BareMetalTemplate`.

## API

| Function | Description |
|---|---|
| `createEntity(slug)` | Fetch metadata for `slug`, hydrate lookup options, return an entity object with `renderUI(rootSelector)`. |
| `listEntities()`     | Fetch the list of available entities (cached). |

## `window.minibind` (declarative façade)

Equivalent surface for hand-written pages:

```js
minibind.setRoot('/api/');
const e = await minibind.createNewEntity('customer');
e.renderUI('app');                  // injects form into #app
```

`minibind` re-exports `setRoot`, `getRoot`, `createNewEntity` (= `createEntity`) and `listEntities`.

## Behaviour of `createEntity(slug)`

1. Fetches `/api/<slug>/$meta` (schema + layout).
2. Walks every field with a `lookupUrl` and `GET`s it, replacing `field.options` with `{value, label}` pairs.
3. Returns:

```js
{
  slug,
  schema,                 // raw metadata
  state,                  // BareMetalBind reactive state, keyed by field name
  renderUI(rootSel),      // builds form via BareMetalTemplate, binds via BareMetalBind
  save() / load(id)       // proxies to BareMetalRest.entity(slug)
}
```

## Example

```html
<div id="app"></div>
<script src="src/BareMetalRest.js"></script>
<script src="src/BareMetalBind.js"></script>
<script src="src/BareMetalTemplate.js"></script>
<script src="src/BareMetalRendering.js"></script>
<script>
  (async () => {
    BareMetalRest.setRoot('/api/');
    const e = await BareMetalRendering.createEntity('customer');
    e.renderUI('#app');
  })();
</script>
```

## Notes

* Lookup hydration is concurrent (`Promise.all`), so a form with N lookups still renders in one round-trip after the metadata fetch.
* Entity list cache is process-lifetime; call `listEntities(true)` to force refresh (if supported by the server).
