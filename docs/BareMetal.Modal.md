# BareMetal.Modal

Reusable native dialog component. Load BareMetalStyles.css, BareMetal.Modal.css and BareMetal.Modal.js.

```js
const modal = BareMetal.Modal.create({title: 'Sign in', content: loginForm});
modal.open();
modal.setBusy(true); // Blocks Escape and close while a request is pending.
modal.setBusy(false);
modal.close();
```

`adopt(dialog, options)` also supports existing dialog elements. Options include `initialFocus` (selector), `onClose` (callback), `parent` and `closeLabel`. Titles use textContent. Content is an existing DOM node. Native dialog handles focus trapping, the backdrop and Escape; the component restores focus to the opener. `destroy()` closes and removes the dialog.
