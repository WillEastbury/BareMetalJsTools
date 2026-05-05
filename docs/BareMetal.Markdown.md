# BareMetal.Markdown

> GFM-style Markdown-to-HTML renderer with TOC, front matter, inline rendering, and optional sanitization.

**Size:** 17.66 KB source / 10.58 KB minified  
**Dependencies:** None

## Quick Start

```html
<script src="BareMetal.Markdown.min.js"></script>
<div id="preview"></div>
<script>
  var md = [
    '# Release Notes',
    '',
    '- Fast startup',
    '- **Zero** runtime dependencies',
    '',
    '[Read more](guide/getting-started.md)'
  ].join('\n');

  var html = BareMetal.Markdown.render(md, {
    baseUrl: '/docs/',
    linkTarget: '_blank'
  });

  document.getElementById('preview').innerHTML = html;
</script>
```

## API Reference

### `render(input, options)` → `string`

Renders a full Markdown document into HTML, including headings, lists, tables, blockquotes, fenced code blocks, footnotes, links, images, and paragraphs.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | string | — | Markdown source to render. |
| options | object | `{}` | Rendering options; see the options table below. |

**Example:**
```js
var html = BareMetal.Markdown.render('# Hello\n\nVisit [Docs](guide.md)', {
  baseUrl: '/help/'
});
```

### `inline(input, options)` → `string`

Renders only inline Markdown features such as emphasis, links, code spans, autolinks, strikethrough, and smart punctuation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | string | — | Inline Markdown source. |
| options | object | `{}` | Rendering options. |

**Example:**
```js
BareMetal.Markdown.inline('Status: **ok** — see https://example.com');
```

### `renderTo(el, input, options)` → `Element|null`

Renders Markdown and assigns the resulting HTML to `el.innerHTML`. Returns the same element.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Target element. |
| input | string | — | Markdown source. |
| options | object | `{}` | Rendering options. |

**Example:**
```js
BareMetal.Markdown.renderTo(document.getElementById('preview'), '## Inline preview');
```

### `renderSafe(el, input, options)` → `Element|null`

Like `renderTo()`, but forces `sanitize: true` so raw HTML tags are stripped before rendering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| el | Element | — | Target element. |
| input | string | — | Markdown source. |
| options | object | `{}` | Rendering options merged with `sanitize: true`. |

**Example:**
```js
BareMetal.Markdown.renderSafe(document.getElementById('preview'), '<script>alert(1)</script>\n\nHello');
```

### `createRenderer(options)` → `{ write, flush }`

Creates a tiny buffered renderer for streaming or chunked input. `write(chunk)` appends text, and `flush()` renders everything collected so far and clears the buffer.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | object | `{}` | Rendering options used when `flush()` runs. |

**Example:**
```js
var r = BareMetal.Markdown.createRenderer({ headerPrefix: 'doc-' });
r.write('# Part 1\n');
r.write('## Part 2\n');
var html = r.flush();
```

### `toc(input, options)` → `Array<{ level, text, id }>`

Builds a table of contents from headings in the Markdown source. Front matter is ignored, and fenced code blocks do not contribute headings.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | string | — | Markdown source. |
| options | object | `{}` | Rendering options used for heading ID generation. |

**Example:**
```js
BareMetal.Markdown.toc('# Intro\n## Install');
// [{ level: 1, text: 'Intro', id: 'intro' }, { level: 2, text: 'Install', id: 'install' }]
```

### `frontMatter(input)` → `{ meta, content }`

Extracts YAML-like front matter from the top of a document and returns the parsed metadata plus the remaining content.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| input | string | — | Markdown source that may start with `---` metadata. |

**Example:**
```js
BareMetal.Markdown.frontMatter('---\ntitle: Hello\ntags:\n- one\n- two\n---\n# Body');
```

### `escape(value)` → `string`

Escapes HTML-sensitive characters for safe text output.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| value | any | — | Value to HTML-escape. |

**Example:**
```js
BareMetal.Markdown.escape('<b>Hello</b>');
// '&lt;b&gt;Hello&lt;/b&gt;'
```

## Configuration / Options

These options are shared by `render()`, `inline()`, `renderTo()`, `renderSafe()`, `createRenderer()`, and `toc()` where applicable.

| Option | Type | Default | Description |
|-------|------|---------|-------------|
| `sanitize` | boolean | `false` | Removes raw HTML tags before rendering. |
| `breaks` | boolean | `false` | Converts every newline inside inline text into `<br>`. |
| `linkTarget` | string\|null | `null` | Adds `target` and `rel="noopener noreferrer"` to links. |
| `highlight` | function\|null | `null` | Called as `(code, lang)` for block code highlighting. |
| `baseUrl` | string | `''` | Prefix applied to relative links and images. |
| `headerIds` | boolean | `true` | Enables automatic heading IDs. |
| `headerPrefix` | string | `''` | Prefix added to generated heading IDs. |
| `smartypants` | boolean | `false` | Converts quotes, dashes, and ellipses in text nodes. |
| `renderers` | object\|null | `null` | Custom render hooks for `heading`, `link`, `image`, `code`, and `table`. |

### Custom renderer hooks

| Hook | Signature |
|------|-----------|
| `heading` | `(text, level, id)` |
| `link` | `(href, title, text)` |
| `image` | `(src, alt, title)` |
| `code` | `(escapedCode, lang)` |
| `table` | `(theadHtml, tbodyHtml)` |

**Example:**
```js
var html = BareMetal.Markdown.render('## [Doc](page)', {
  renderers: {
    heading: function (text, level, id) {
      return '<h' + level + ' data-id="' + id + '">' + text + '</h' + level + '>';
    },
    link: function (href, title, text) {
      return '<a class="doc-link" href="' + href + '">' + text + '</a>';
    }
  }
});
```

## Notes
- Supports headings, blockquotes, ordered/unordered lists, task lists, tables, fenced code blocks, indented code blocks, images, links, autolinks, footnotes, and horizontal rules.
- Repeated headings get stable incremented IDs like `intro`, `intro-1`, `intro-2`.
- `frontMatter()` parses scalars (`true`, `false`, `null`, numbers, quoted strings) and simple `- item` arrays.
- `renderSafe()` strips tags but keeps their text content, so `<script>alert(1)</script>` becomes `alert(1)`.
- `createRenderer().flush()` clears its internal buffer after returning HTML.