# BareMetalRouting

A History-API single-page-app router exposed as the global `BMRouter`. No dependencies.

## API

| Method | Description |
|---|---|
| `BMRouter.on(pattern, handler)`              | Register a route. |
| `BMRouter.notFound(handler)`                 | Fallback handler when no pattern matches. |
| `BMRouter.start()`                           | Match the current URL and start listening to `popstate`. |
| `BMRouter.navigate(path, state?, replace?)`  | Programmatic navigation. `replace=true` uses `replaceState` instead of `pushState`. |

## Patterns

* Literal segments: `/users/profile`
* Named parameters: `/users/:id`
* Catch-all: `/files/*`

Routes are matched in **registration order**. Register more-specific patterns first.

Handlers are invoked with a context object:

```js
{
  path:    '/users/42',
  params:  { id: '42' },
  query:   { tab: 'orders' },
  state:   <history state>
}
```

## Example

```js
BMRouter.on('/',                () => render('home'));
BMRouter.on('/:entity',         ctx => renderList(ctx.params.entity));
BMRouter.on('/:entity/create',  ctx => renderCreate(ctx.params.entity));
BMRouter.on('/:entity/:id',     ctx => renderDetail(ctx.params.entity, ctx.params.id));
BMRouter.notFound(()           => render('404'));
BMRouter.start();

document.querySelector('a.products').addEventListener('click', e => {
  e.preventDefault();
  BMRouter.navigate('/product');
});
```

## Notes

* No hash-mode — uses `pushState` exclusively. Configure your server to serve the SPA shell for unknown URLs.
* Query strings are auto-parsed into `ctx.query`.
* Anchor interception is **not** automatic — call `navigate()` from your own click handlers, or wire up a delegated `<a>` listener if desired.
