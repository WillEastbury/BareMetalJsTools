BareMetal.TestRunner.installGlobals();

describe('BareMetal.VTTerminal', function () {
  it('writes text and parses ANSI colour and cursor commands', function () {
    var element = document.createElement('div');
    document.body.append(element);
    var terminal = BareMetal.VTTerminal.create({ element: element, cols: 20, rows: 5 });
    terminal.write('\x1b[31mRed\x1b[0m\r\nNext');
    expect(terminal.getLines()[0]).toContain('Red');
    expect(terminal.getLines()[1]).toContain('Next');
    terminal.clear();
    expect(terminal.getLines()).toEqual([]);
    terminal.destroy();
  });
});
