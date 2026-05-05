/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.PicoScript.Editor.js');

function loadEditor(coreFactory) {
  const code = fs.readFileSync(SRC, 'utf8');
  const core = coreFactory ? coreFactory() : {};
  const fn = new Function('document', 'window', 'BareMetal', code + '\nreturn BareMetal.PicoScript.Editor;');
  return fn(global.document, global.window, { PicoScript: core });
}

function makeCore() {
  return {
    validate(source) {
      if (source.indexOf('BAD') > -1) return { valid: false, errors: [{ line: 2, message: 'Syntax error' }] };
      return { valid: true, errors: [] };
    },
    compile(source) {
      return { instructions: source.split(/\r?\n/).filter(Boolean).map((line, i) => ({ op: line, line: i + 1 })) };
    },
    disassemble(bytecode) {
      return bytecode.instructions.map((inst, i) => i + ': ' + inst.op).join('\n');
    },
    createVM(opts) {
      let pc = 0;
      let halted = false;
      let cycles = 0;
      const vars = {};
      const lines = opts.bytecode.instructions.slice();
      return {
        step() {
          if (halted || pc >= lines.length) {
            halted = true;
            return { pc, cycles, line: lines.length ? lines[lines.length - 1].line : 1, halted, variables: vars, stack: [] };
          }
          const inst = lines[pc];
          cycles++;
          if (/LET\s+(\w+)\s*=\s*(\d+)/i.test(inst.op)) {
            const m = inst.op.match(/LET\s+(\w+)\s*=\s*(\d+)/i);
            vars[m[1]] = Number(m[2]);
          }
          if (/PRINT\s+/i.test(inst.op)) opts.output(inst.op.replace(/^PRINT\s+/i, ''));
          pc++;
          if (pc >= lines.length) halted = true;
          return { pc, cycles, line: halted ? inst.line : lines[Math.min(pc, lines.length - 1)].line, halted, variables: vars, stack: [pc], dataPointer: 0 };
        },
        reset() { pc = 0; cycles = 0; halted = false; },
        getState() { return { pc, cycles, line: lines[Math.min(pc, Math.max(lines.length - 1, 0))] ? lines[Math.min(pc, Math.max(lines.length - 1, 0))].line : 1, halted, variables: vars, stack: [pc], dataPointer: 0 }; }
      };
    },
    run() { return {}; }
  };
}

describe('BareMetal.PicoScript.Editor', () => {
  test('creates editor, highlights code and supports breakpoints', () => {
    const Editor = loadEditor(makeCore);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = Editor.create(host, { source: 'start:\nLET X = 10\nPRINT "hi"', showDebug: true });

    expect(host.querySelector('textarea')).toBeTruthy();
    expect(host.querySelector('code').textContent).toContain('LET X = 10');
    expect(host.textContent).toContain('Variables');

    editor.setBreakpoint(2);
    expect(editor.getState().breakpoints).toContain(2);
  });

  test('runs program and updates output/status', async () => {
    const Editor = loadEditor(makeCore);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = Editor.create(host, { source: 'LET X = 10\nPRINT 20', showDebug: true });

    await editor.run();

    const output = editor.getOutput().map(x => x.text);
    expect(output).toContain('20');
    expect(output.some(x => x.indexOf('Program halted after') === 0)).toBe(true);
    expect(editor.getState().variables.X).toBe(10);
  });

  test('surfaces compile and missing-core errors', async () => {
    const Editor = loadEditor(makeCore);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = Editor.create(host, { source: 'LET X = 1\nBAD TOKEN' });

    await expect(editor.run()).rejects.toThrow('Syntax error');
    expect(editor.getOutput().some(x => x.text === 'Syntax error')).toBe(true);

    const Missing = loadEditor();
    const host2 = document.createElement('div');
    document.body.appendChild(host2);
    const editor2 = Missing.create(host2, { source: 'PRINT 1' });
    await expect(editor2.run()).rejects.toThrow('core module not loaded');
  });
});
