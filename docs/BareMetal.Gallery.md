# Responsive media gallery

Load `BareMetal.Gallery.js` and `BareMetal.Gallery.css` after BareMetalStyles and
your chosen theme. It uses theme tokens, native form controls and native media
players. No network, database, framework or build step is required.

```html
<link rel="stylesheet" href="BareMetal.Gallery.css">
<script src="BareMetal.Gallery.js"></script>
<section id="library"></section>
<script>
const gallery = BareMetal.Gallery.create({
  label: 'Your media',
  onFavourite: async (id, favourite) => {
    // Persist through your authenticated application API.
    return {favourite};
  },
  onError: error => console.error(error.message)
});
document.querySelector('#library').append(gallery.element);
const card = gallery.card('clip-1', 'Summer walk', {
  kind: 'video', category: 'Nature', tags: ['forest', 'summer'],
  description: 'A gentle walk through the woods',
  state: 'done', created: Date.now(), favourite: false
});
card.preview.append(gallery.media({
  url: '/media/walk.mp4', mime: 'video/mp4', name: 'Summer walk'
}));
</script>
```

## Behaviour and API

- `element` is the complete control; `grid` is its card container. Existing
  `card`, `cards`, `heading`, `preview`, `status`, `progress` and `actions`
  handles remain available. Append custom actions to a card's `actions`.
- `card(id, title, metadata)` returns an existing card or creates one.
- `update(id, metadata, render=true)` merges metadata without replacing players.
  Use `false` for batch updates, then call `refresh()` once.
- `setFilters({search, kind, category, tag, state, favourite, sort, view})`
  combines filters. Search is case insensitive; every word must match the
  title, description, prompt, tags or category. Kind is image/video/audio;
  edit and music aliases are accepted in metadata.
- Category and tag options are populated from current metadata; chips apply
  filters. Sort accepts newest/oldest/title; view accepts grid/list.
- `media({url,mime,name})` returns an accessible image/audio/video element.
  Image loading is lazy; video/audio use native controls without autoplay.
  URLs accept HTTP(S), blob URLs or root-relative paths. Acquire private URLs
  through your application API; the gallery never fetches credentials.
- `open(asset)` displays a larger native dialog with Escape dismissal and
  focus restoration. `remove(id)`, `clear()` and `destroy()` clean up the UI.
  The caller owns object URLs and must revoke them when removing media.
- `onFavourite(id, boolean)` resolves to persisted metadata. Failed saves
  retain the previous value. Without the callback, favourite buttons are hidden.
- `onFilter(filters)` receives filter changes. `onError(error)` handles failed
  favourite saves. `emptyText` customizes the initial empty message.

Filtering pauses hidden players. Selections survive metadata refreshes.
Responsive grid/list layouts adapt to container width, including narrow mobile
panels. Controls have visible labels; counts announce changes without repeated
polling announcements. Metadata is always rendered as text.

CommonJS exports: `require('baremetal-js-tools/gallery')` and stylesheet
`baremetal-js-tools/gallery.css`. Include the CSS in browser deployments.

Run `npm test -- --runInBand BareMetalGallery` for filtering, sort, persistence
callbacks, safe rendering, player controls, lifecycle and dialog tests.
