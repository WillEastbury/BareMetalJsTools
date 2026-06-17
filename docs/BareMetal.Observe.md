# BareMetal.Observe

> Observer wrappers for resize, intersection, mutation, lazy loading, infinite scroll, sticky state, and media-query driven UI.

**Size:** 11 KB source / 8 KB minified  
**Dependencies:** None

## Quick Start

```html
<img data-src="hero.jpg" class="lazy" alt="Hero image">
<div class="card reveal">Hello</div>
<script src="BareMetal.Observe.min.js"></script>
<script>
  BareMetal.Observe.lazyLoad('.lazy');
  BareMetal.Observe.animateOnScroll('.reveal', { class: 'is-visible', once: true });
</script>
```

## API Reference

### `resize(el, callback, opts)` → `{ disconnect() }`

Watches element size changes with `ResizeObserver`, or falls back to window resize events.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Element to observe. |
| callback | function | — | Receives `{ width, height, entry }`. |
| opts | object | `{}` | Supports `box` and `debounce`. |

**Example:**
```js
const watch = BareMetal.Observe.resize(panel, function (size) {
  console.log(size.width, size.height);
}, { debounce: 100 });
```

### `intersection(el, callback, opts)` → `{ disconnect() }`

Watches visibility and intersection ratio for one element.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Element to observe. |
| callback | function | — | Receives `{ isIntersecting, ratio, entry }`. |
| opts | object | `{}` | Supports `root`, `rootMargin`, and `threshold`. |

**Example:**
```js
BareMetal.Observe.intersection(hero, function (state) {
  console.log(state.isIntersecting, state.ratio);
}, { threshold: 0.5 });
```

### `mutation(el, callback, opts)` → `{ disconnect() }`

Watches DOM mutations on an element.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Element to observe. |
| callback | function | — | Receives `(records, observer, element)`. |
| opts | object | `{}` | Supports `childList`, `attributes`, `characterData`, `subtree`, and `attributeFilter`. |

**Example:**
```js
BareMetal.Observe.mutation(list, function (records) {
  console.log(records.length);
}, { childList: true, subtree: true });
```

### `lazyLoad(selector, opts)` → `{ destroy() }`

Lazy-loads images, iframes, and any element using `data-src`, `data-srcset`, and `data-sizes` attributes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| selector | string \| Element \| array-like | — | Target elements or selector. |
| opts | object | `{}` | Supports `root`, `rootMargin`, `threshold`, and `onLoad(el, entry)`. |

**Example:**
```js
BareMetal.Observe.lazyLoad('.lazy-image', {
  onLoad(el) { el.classList.add('ready'); }
});
```

### `infinite(sentinel, loadMore, opts)` → `{ destroy() }`

Triggers `loadMore()` when a sentinel element enters view, with built-in busy-state handling.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| sentinel | Element | — | Element placed at the end of the list. |
| loadMore | function | — | Callback or promise-returning loader. |
| opts | object | `{}` | Same options as `intersection()`. |

**Example:**
```js
BareMetal.Observe.infinite(document.getElementById('sentinel'), async function () {
  await loadNextPage();
});
```

### `sticky(el, opts)` → `{ destroy(), isStuck }`

Tracks sticky state by inserting a hidden sentinel before the element.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Sticky element to monitor. |
| opts | object | `{}` | Supports `root`, `top`, `threshold`, `onStick`, and `onUnstick`. |

**Example:**
```js
const sticky = BareMetal.Observe.sticky(navbar, {
  onStick() { navbar.classList.add('stuck'); },
  onUnstick() { navbar.classList.remove('stuck'); }
});
```

### `viewport(el)` → `Promise<void>`

Resolves once an element enters the viewport.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Element to wait for. |

**Example:**
```js
await BareMetal.Observe.viewport(chartEl);
renderChart();
```

### `trackSize(el, callback, opts)` → `{ disconnect(), getSize() }`

Tracks size changes and keeps the latest size available through `getSize()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Element to watch. |
| callback | function | — | Receives `(size, entry)`. |
| opts | object | `{}` | Supports `box` and `debounce`. |

**Example:**
```js
const tracker = BareMetal.Observe.trackSize(card, function (size) {
  console.log(size.width);
});
```

### `breakpoint(el, breakpoints, callback)` → `{ disconnect() }`

Maps element width to a named breakpoint and only emits when the breakpoint name changes.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Element whose width should be measured. |
| breakpoints | object | — | Map of breakpoint names to minimum widths. |
| callback | function | — | Receives `(name, size)`. |

**Example:**
```js
BareMetal.Observe.breakpoint(panel, { sm: 0, md: 600, lg: 960 }, function (name) {
  console.log('Breakpoint:', name);
});
```

### `animateOnScroll(els, opts)` → `{ destroy() }`

Adds or removes a CSS class when elements enter view.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| els | string \| Element \| array-like | — | Elements or selector to observe. |
| opts | object | `{}` | Supports `class`, `once`, `root`, `rootMargin`, and `threshold`. |

**Example:**
```js
BareMetal.Observe.animateOnScroll('.fade-up', { class: 'in-view', once: true });
```

### `mediaQuery(query, callback)` → `{ destroy(), matches }`

Wraps `matchMedia()` and keeps the latest match state on `.matches`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| query | string | — | Media query string. |
| callback | function | — | Receives `(matches, eventOrQueryList)`. |

**Example:**
```js
const mq = BareMetal.Observe.mediaQuery('(max-width: 767px)', function (matches) {
  document.body.classList.toggle('mobile', matches);
});
```

### `mutationStream(el, opts)` → `async iterator`

Creates an async iterator-like mutation stream with `next()` and `disconnect()`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Element to observe. |
| opts | object | `{}` | Mutation observer options, same shape as `mutation()`. |

**Example:**
```js
const stream = BareMetal.Observe.mutationStream(list, { childList: true });
const first = await stream.next();
console.log(first.value);
```

## Notes

- Most helpers return a small cleanup object with `disconnect()` or `destroy()`.
- `resize()` and `intersection()` fall back to window events when native observers are unavailable.
- `lazyLoad()` adds a `loaded` class after the element finishes loading.
- `sticky()` inserts and later removes an internal sentinel element.
- `mutationStream()` implements `Symbol.asyncIterator` when the platform supports it.
