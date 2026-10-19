# BareMetal.Document

> Semantic HTML editor (`contenteditable`). Not RTF. Scripts and `javascript:` URLs are stripped.

**Dependencies:** None. Pair with `BareMetal.Ribbon` and `BareMetal.DocumentWAL`.

## Quick Start

```html
<script src="BareMetal.Document.js"></script>
<div id="doc" style="height:24rem"></div>
<script>
  const doc = BareMetal.Document.create('#doc', {
    html: '<h1>Notes</h1><p>Semantic HTML.</p>',
    onChange(html, prev) { console.log(html); }
  });
  doc.bold();
</script>
```

Demo: [`examples/document-app.html`](../examples/document-app.html).

## API

`create(target, { html, onChange })` → `{ getHTML, setHTML, command, bold, italic, underline, heading, paragraph, list, color, hilite, font, fontSize, query, page }`.

`sanitize(html)` is exported for tests.
