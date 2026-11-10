# BareMetal.AI

Dependency-free client for OpenAI-compatible streamed chat-completion endpoints, with registered local function tools and a bounded tool-call loop. Point it at an application proxy; never embed a provider secret in browser code.

## Load

```html
<script src="src/BareMetal.AI.js"></script>
```

## Public API

### `create(options)`

Creates a client with an endpoint, optional model/default request parameters, headers, fetch adapter, and registered local tools.

### `client.stream(messages, options)`

Streams one completion and resolves to `{ message, usage, finishReason }`.

### `client.run(messages, options)`

Streams completions and executes registered tool calls until a final assistant message is returned or the tool-round limit is reached.

## Stream a response

```js
const ai = BareMetal.AI.create({
  endpoint: '/api/ai/stream',
  model: 'assistant-model'
});

const result = await ai.stream(
  [{ role: 'user', content: 'Summarize the current order status.' }],
  { onDelta: text => output.append(document.createTextNode(text)) }
);
console.log(result.finishReason, result.usage);
```

`stream()` returns `{ message, usage, finishReason }`. It accepts server-sent event streams and JSON completions, supports `AbortSignal`, and emits text deltas through `onDelta` and structured events through `onEvent`.

## Run registered tools

```js
const agent = BareMetal.AI.create({
  endpoint: '/api/ai/stream',
  model: 'assistant-model',
  tools: [{
    name: 'lookup_order',
    description: 'Read an order by its ID',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id']
    },
    execute: async ({ id }) => orders.get(id)
  }]
});

const result = await agent.run(
  [{ role: 'user', content: 'Check PO-1042 and summarize it.' }],
  { maxToolRounds: 3, onEvent: event => console.log(event.type, event.name || '') }
);
```

`run()` executes only tools explicitly registered by the host, validates that tool arguments are JSON objects, appends tool results to the conversation, and resumes the model until it returns a final answer or the configured round/call limit is reached. Per-tool `authorize(args, context)` or request-level `authorizeTool({ name, arguments, call })` hooks can require explicit approval; an authorization hook must return `true`.

The endpoint must implement an OpenAI-compatible `/chat/completions` streaming protocol, or return a compatible JSON completion. This module does not provide API-key storage, provider-specific authentication, or an AI server.
