/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CORE_SRC = path.resolve(__dirname, '../src/BareMetal.PicoScript.js');
const EDITOR_SRC = path.resolve(__dirname, '../src/BareMetal.PicoScript.Editor.js');

function loadSuite(withCore) {
  const bare = {};
  if (withCore !== false) {
    const coreCode = fs.readFileSync(CORE_SRC, 'utf8');
    new Function('BareMetal', coreCode + '\nreturn BareMetal;')(bare);
  }
  const editorCode = fs.readFileSync(EDITOR_SRC, 'utf8');
  const Editor = new Function('document', 'window', 'BareMetal', editorCode + '\nreturn BareMetal.PicoScript.Editor;')(global.document, global.window, bare);
  return { Editor, BareMetal: bare };
}

function makeHost() {
  const host = document.createElement('div');
  host.style.width = '1200px';
  host.style.height = '800px';
  document.body.appendChild(host);
  return host;
}

const SAMPLE = [
  'ON DATA:',
  '  LET x = PEEK(DATA$, 0)',
  '  IF x = 71 THEN',
  '    EMIT_STR("200 OK")',
  '  ELSE',
  '    EMIT_STR("404")',
  '  END IF',
  'END ON'
].join('\n');

describe('BareMetal.PicoScript.Editor', () => {
  test('creates 4-pane compiler IDE, compiles source, and supports breakpoints', () => {
    const { Editor } = loadSuite(true);
    const host = makeHost();
    const editor = Editor.create(host, { source: SAMPLE, height: '640px' });

    const compiled = editor.compile();

    expect(compiled.entries.data).toBeGreaterThanOrEqual(0);
    expect(editor.getCompiled()).toBe(compiled);
    expect(editor.getCfg().blocks.length).toBeGreaterThan(0);
    expect(host.querySelector('textarea')).toBeTruthy();
    expect(host.querySelector('svg')).toBeTruthy();
    expect(host.textContent).toContain('① SOURCE');
    expect(host.textContent).toContain('② BYTECODE (IR)');
    expect(host.textContent).toContain('③ JUMP GRAPH (CFG)');
    expect(host.textContent).toContain('④ TRACE + OUTPUT');
    expect(host.textContent).toContain('=== ON DATA');

    editor.setBreakpoint(3);
    expect(editor.getState().breakpoints).toContain(3);

    const textarea = host.querySelector('textarea');
    textarea.selectionStart = SAMPLE.indexOf('IF x = 71 THEN');
    textarea.selectionEnd = textarea.selectionStart;
    textarea.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(editor.getState().selectedLine).toBe(3);
  });

  test('dispatches, traces blocks, emits output, and steps VM', async () => {
    const { Editor } = loadSuite(true);
    const host = makeHost();
    const editor = Editor.create(host, { source: SAMPLE });

    editor.compile();
    const result = await editor.dispatch('data', '47');

    expect(Array.from(result.emitBuffer)).not.toHaveLength(0);
    expect(editor.getTrace().trace.length).toBeGreaterThan(0);
    expect(host.textContent).toContain('Emit');
    expect(host.textContent).toContain('200 OK');

    editor.reset();
    const stepState = await editor.step();
    expect(stepState.pc).not.toBeNull();
    expect(editor.getState().currentLine).toBeGreaterThan(0);
    expect(editor.getState().trace.length).toBeGreaterThan(0);

    editor.setTheme('light');
    expect(host.firstChild.style.background).toBe('rgb(255, 255, 255)');
  });

  test('surfaces compile failures and missing core errors', async () => {
    const { Editor } = loadSuite(true);
    const host = makeHost();
    const editor = Editor.create(host, { source: 'ON DATA:\n  LET x =\nEND ON' });

    expect(() => editor.compile()).toThrow('Expected expression');
    expect(host.textContent).toContain('Error');

    const missing = loadSuite(false).Editor;
    const host2 = makeHost();
    const editor2 = missing.create(host2, { source: 'ON DATA:\n  EMIT_U8(65)\nEND ON' });
    await expect(editor2.dispatch('data', '')).rejects.toThrow('core module not loaded');
  });
});
