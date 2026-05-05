/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadPicoScript() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.PicoScript.js'), 'utf8');
  const fn = new Function('BareMetal', code + '\nreturn BareMetal.PicoScript;');
  return fn({});
}

function outputOf(result) {
  return result.output.join('');
}

describe('BareMetal.PicoScript', () => {
  let P;

  beforeAll(() => {
    P = loadPicoScript();
  });

  test('executes hello world and exposes versioned API', () => {
    expect(P.VERSION).toBe('1.0.0');
    expect(outputOf(P.exec('PRINT "Hello, World!"'))).toBe('Hello, World!\n');
  });

  test('runs BASIC examples for loops arrays data and gosub', () => {
    expect(outputOf(P.exec([
      'DATA 10, 20, 30, "hello"',
      'READ x',
      'READ y',
      'READ z',
      'READ name$',
      'PRINT x + y + z',
      'PRINT name$'
    ].join('\n')))).toBe('60\nhello\n');

    expect(outputOf(P.exec([
      'LET x = 5',
      'GOSUB double',
      'PRINT x',
      'END',
      '',
      'double:',
      '  LET x = x * 2',
      'RETURN'
    ].join('\n')))).toBe('10\n');

    expect(outputOf(P.exec([
      'DIM scores(5)',
      'FOR i = 0 TO 4',
      '  LET scores(i) = (i + 1) * 10',
      'NEXT i',
      'LET total = 0',
      'FOR i = 0 TO 4',
      '  LET total = total + scores(i)',
      'NEXT i',
      'PRINT "Average: "; total / 5'
    ].join('\n')))).toBe('Average: 30\n');
  });

  test('supports conditionals loops goto and user functions', () => {
    expect(outputOf(P.exec('LET x = 2\nIF x > 1 THEN PRINT "yes" ELSE PRINT "no"'))).toBe('yes\n');
    expect(outputOf(P.exec('LET i = 0\nWHILE i < 3\nPRINT i\nLET i = i + 1\nWEND'))).toBe('0\n1\n2\n');
    expect(outputOf(P.exec('LET i = 0\nDO\nPRINT i\nLET i = i + 1\nLOOP WHILE i < 3'))).toBe('0\n1\n2\n');
    expect(outputOf(P.exec('GOTO done\nPRINT "bad"\ndone:\nPRINT "ok"'))).toBe('ok\n');
    expect(outputOf(P.exec('DEF FN DOUBLE(x) = x * 2\nPRINT DOUBLE(5)'))).toBe('10\n');
  });

  test('compiles disassembles assembles and runs through VM API', () => {
    const compiled = P.compile('INPUT x\nPRINT x + 1');
    const vm = P.createVM({ inputFn: () => '7' });
    vm.load(compiled);
    expect(outputOf(vm.run())).toBe('8\n');
    expect(vm.getVariable('x')).toBe(7);

    const asm = P.disassemble(P.compile('PRINT 41 + 1'));
    const rebuilt = P.assemble(asm);
    expect(outputOf(P.run(rebuilt))).toBe('42\n');
    expect(compiled.bytecode).toBeInstanceOf(Uint8Array);
  });

  test('formats validates and supports async sleep', async () => {
    expect(P.validate('LET x = ').valid).toBe(false);
    expect(P.format('let x=1\nif x then print "ok" else print "bad"')).toContain('LET X = 1');

    const result = await P.exec('PRINT "A"\nSLEEP 1\nPRINT "B"', { async: true });
    expect(outputOf(result)).toBe('A\nB\n');
  });
});
