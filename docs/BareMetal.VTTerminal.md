# BareMetal.VTTerminal

Scrollable, dependency-free VT100/ANSI terminal driver for WebSocket, Web
Worker or application output.

```js
const terminal = BareMetal.VTTerminal.create({
  element: '#terminal',
  cols: 120,
  rows: 32,
  maxLines: 5000
});

terminal.write('\u001b[32mconnected\u001b[0m\r\n');
terminal.openWebSocket('wss://host/terminal');
terminal.onInput(text => socket.send(text));
```

Supports CR/LF, backspace, tabs, cursor movement, erase display/line,
save/restore cursor, 16/256/truecolor ANSI styles, Unicode text and scrollback.
