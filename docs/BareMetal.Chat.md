# BareMetal.Chat

`BareMetal.Chat.css` provides theme aware layout primitives for chat and coding
interfaces. It supplies the sidebar, conversation list, transcript, composer,
status line, and response controls. Applications keep their own authentication,
conversation state, request flow, and product specific panels.

Load the file after `BareMetalStyles.css` and the selected theme:

```html
<link rel="stylesheet" href="src/BareMetalStyles.css">
<link rel="stylesheet" href="src/themes/wavefunction.css">
<link rel="stylesheet" href="src/BareMetal.Chat.css">
```

Apply the layout classes to existing elements:

```html
<body class="bm-chat-layout">
  <aside class="bm-chat-sidebar">
    <nav class="bm-chat-conversations">
      <div class="bm-chat-conversation-row">
        <button class="bm-chat-conversation-open">Conversation title</button>
        <div class="bm-chat-conversation-actions"><button>Rename</button></div>
      </div>
    </nav>
  </aside>
  <main class="bm-chat-main">
    <header class="bm-chat-header">Model selection</header>
    <section class="bm-chat-log bm-chat-transcript" aria-live="polite">
      <article class="bm-chat-message bm-chat-bubble bm-chat-bot">
        <span class="bm-chat-message-label">Assistant</span>
        <div class="bm-chat-body bm-chat-message-body">Hello.</div>
      </article>
    </section>
    <form class="bm-chat-composer">
      <textarea class="bm-chat-prompt" aria-label="Message"></textarea>
      <button type="submit">Send</button>
    </form>
  </main>
</body>
```

The layout uses BareMetal theme tokens and adapts below 700px. Keep user text in
`textContent`; use a separately reviewed Markdown renderer when rich replies are
needed. This stylesheet does not own network calls or trust decisions.
