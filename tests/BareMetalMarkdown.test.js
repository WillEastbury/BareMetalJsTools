/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadMarkdown() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Markdown.js'), 'utf8');
  const fn = new Function('document', code + '\nreturn BareMetal.Markdown;');
  return fn(global.document);
}

describe('BareMetal.Markdown', () => {
  let M;

  beforeAll(() => {
    M = loadMarkdown();
  });

  test('renders basic markdown', () => {
    expect(M.render('# Hello\n\nThis is **bold** and *italic*.')).toBe('<h1 id="hello">Hello</h1>\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>');
  });

  test('supports tables, lists, blockquotes, code, links, images and footnotes', () => {
    const md = [
      '# Title',
      '',
      '> Quote',
      '> > Nested',
      '',
      '- [x] done',
      '- item',
      '  - nested',
      '1. first',
      '2. second',
      '',
      '| Name | Qty |',
      '| :--- | ---: |',
      '| apples | 3 |',
      '',
      '```js',
      'const x = 1 < 2;',
      '```',
      '',
      '    indented();',
      '',
      '[Link](guide "Guide") and ![Alt](img.png)',
      '',
      'A footnote.[^1]',
      '',
      '[^1]: Footnote text'
    ].join('\n');
    const html = M.render(md, { baseUrl: '/docs/', linkTarget: '_blank' });
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<blockquote>\n<p>Nested</p>\n</blockquote>');
    expect(html).toContain('<li class="task-list-item"><p><input type="checkbox" disabled checked> done</p></li>');
    expect(html).toContain('<ul>\n<li><p>nested</p></li>\n</ul>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<table>');
    expect(html).toContain('style="text-align:left"');
    expect(html).toContain('style="text-align:right"');
    expect(html).toContain('<code class="language-js">const x = 1 &lt; 2;</code>');
    expect(html).toContain('<pre><code>indented();</code></pre>');
    expect(html).toContain('<a href="/docs/guide" title="Guide" target="_blank" rel="noopener noreferrer">Link</a>');
    expect(html).toContain('<img src="/docs/img.png" alt="Alt">');
    expect(html).toContain('<section class="footnotes">');
  });

  test('supports inline, frontMatter, toc and streaming', () => {
    expect(M.inline('This is **bold** and [a link](url).', { baseUrl: '/docs/' })).toBe('This is <strong>bold</strong> and <a href="/docs/url">a link</a>.');
    expect(M.inline('Visit https://example.com\nline', { breaks: true })).toBe('Visit <a href="https://example.com">https://example.com</a><br>\nline');
    expect(M.inline('\\*no\\*')).toBe('*no*');
    expect(M.inline('"quote" -- wow...', { smartypants: true })).toBe('“quote” – wow…');
    expect(M.frontMatter('---\ntitle: Hello\ntags:\n- one\n- two\n---\n# Content')).toEqual({ meta: { title: 'Hello', tags: ['one', 'two'] }, content: '# Content' });
    expect(M.toc('# Hello\n## World')).toEqual([
      { level: 1, text: 'Hello', id: 'hello' },
      { level: 2, text: 'World', id: 'world' }
    ]);
    const r = M.createRenderer();
    r.write('# Part 1\n');
    r.write('Some text\n\n');
    r.write('## Part 2\n');
    expect(r.flush()).toContain('<h2 id="part-2">Part 2</h2>');
  });

  test('supports sanitize, custom renderers, heading prefixes and DOM helpers', () => {
    const div = document.createElement('div');
    M.renderTo(div, '# Hi');
    expect(div.innerHTML).toBe('<h1 id="hi">Hi</h1>');

    M.renderSafe(div, '<script>alert(1)</script>\n\nHello');
    expect(div.innerHTML).toBe('<p>alert(1)</p>\n<p>Hello</p>');

    expect(M.render('# A\n# A')).toContain('<h1 id="a-1">A</h1>');

    const html = M.render('## [Doc](page)\n\n```js\n1 < 2\n```', {
      headerPrefix: 'doc-',
      renderers: {
        heading: (text, level, id) => '<h' + level + ' data-id="' + id + '">' + text + '</h' + level + '>',
        link: (href, title, text) => '<a class="link" href="' + href + '">' + text + '</a>',
        code: (code, lang) => '<pre class="lang-' + lang + '"><code>' + code + '</code></pre>'
      }
    });
    expect(html).toContain('<h2 data-id="doc-doc">');
    expect(html).toContain('<a class="link" href="page">Doc</a>');
    expect(html).toContain('<pre class="lang-js"><code>1 &lt; 2</code></pre>');
    expect(M.escape('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
