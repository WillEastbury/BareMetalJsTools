# BareMetal.Controls

Load `BareMetal.Controls.css` after other BareMetal styles, and load
`BareMetal.Controls.js` before application scripts. Uses existing theme tokens.

- `help(control, text, label)` returns a help button and tooltip. Append it to
  the field container. Supports hover, focus, click/touch and Escape. Associates
  the help text with the control through `aria-describedby`.
- `range(input, {unit, format})` decorates an existing input with a native range
  slider and value output. Set its ID, min, max, step and value first; the parent
  should contain its label. Returns `{input, output, update}`. Call `update()`
  after changing its value programmatically.
- `disclosure(label, open)` returns `{element, summary, content}`. Append
  settings to `content`, then place `element` in the page.

Use `bm-settings-grid` for two columns, stacking into one on narrow screens.
`bm-control` provides label, value and help alignment. `bm-upload-label` aligns
file upload labels and help buttons. Native input validation remains available;
applications must validate independently on the server.
