BareMetal.TestRunner.installGlobals();

describe('BareMetal.AI', function () {
  function streamResponse(chunks, status) {
    var encoder = new TextEncoder();
    var bytes = chunks.map(function (chunk) { return encoder.encode(chunk); });
    return new Response(new ReadableStream({
      start: function (controller) {
        bytes.forEach(function (chunk) { controller.enqueue(chunk); });
        controller.close();
      }
    }), {
      status: status || 200,
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }

  function event(value) {
    return 'data: ' + JSON.stringify(value) + '\n\n';
  }

  it('streams content across arbitrarily split SSE frames', async function () {
    var payload = event({ choices: [{ delta: { content: 'Hello ' } }] }) +
      event({ choices: [{ delta: { content: 'from streaming' }, finish_reason: 'stop' }] }) +
      'data: [DONE]\n\n';
    var chunks = [];
    for (var index = 0; index < payload.length; index += 11) chunks.push(payload.slice(index, index + 11));
    var deltas = [];
    var client = BareMetal.AI.create({
      endpoint: '/api/ai',
      model: 'browser-safe-model',
      fetch: function (url, request) {
        expect(url).toBe('/api/ai');
        expect(JSON.parse(request.body).stream).toBe(true);
        return Promise.resolve(streamResponse(chunks));
      }
    });
    var result = await client.stream([{ role: 'user', content: 'Say hello' }], {
      onDelta: function (text) { deltas.push(text); }
    });
    expect(result.message.content).toBe('Hello from streaming');
    expect(deltas.join('')).toBe('Hello from streaming');
    expect(result.finishReason).toBe('stop');
  });

  it('accepts a JSON completion when an endpoint does not stream', async function () {
    var client = BareMetal.AI.create({
      endpoint: '/api/ai',
      fetch: function () {
        return Promise.resolve(new Response(JSON.stringify({
          choices: [{ message: { role: 'assistant', content: 'JSON fallback' }, finish_reason: 'stop' }],
          usage: { total_tokens: 4 }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
    });
    var result = await client.stream([{ role: 'user', content: 'Hello' }]);
    expect(result.message.content).toBe('JSON fallback');
    expect(result.usage.total_tokens).toBe(4);
  });

  it('runs registered tools and resumes the streamed assistant turn', async function () {
    var requests = [];
    var toolArgs = null;
    var toolEvents = [];
    var responses = [
      streamResponse([
        event({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'call-1', type: 'function', function: { name: 'lookup_order', arguments: '{"id":' } }] } }] }),
        event({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"PO-1"}' } }] }, finish_reason: 'tool_calls' }] }),
        'data: [DONE]\n\n'
      ]),
      streamResponse([
        event({ choices: [{ delta: { content: 'Order PO-1 is approved.' }, finish_reason: 'stop' }] }),
        'data: [DONE]\n\n'
      ])
    ];
    var client = BareMetal.AI.create({
      endpoint: '/api/ai',
      model: 'browser-safe-model',
      fetch: function (url, request) {
        requests.push(JSON.parse(request.body));
        return Promise.resolve(responses.shift());
      },
      tools: [{
        name: 'lookup_order',
        description: 'Read an ERP purchase order',
        parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        execute: function (args) {
          toolArgs = args;
          return { id: args.id, status: 'approved' };
        }
      }]
    });
    var result = await client.run([{ role: 'user', content: 'Check PO-1' }], {
      onEvent: function (item) { if (item.type.indexOf('tool-') === 0) toolEvents.push(item.type); }
    });
    expect(toolArgs.id).toBe('PO-1');
    expect(requests.length).toBe(2);
    expect(requests[0].tools[0].function.name).toBe('lookup_order');
    expect(requests[1].messages.some(function (message) {
      return message.role === 'tool' && message.tool_call_id === 'call-1' && message.content.indexOf('approved') >= 0;
    })).toBe(true);
    expect(result.message.content).toBe('Order PO-1 is approved.');
    expect(toolEvents.join(',')).toBe('tool-call,tool-result');
  });

  it('rejects tools that fail the host authorization hook', async function () {
    var executed = false;
    var response = streamResponse([
      event({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'call-private', type: 'function', function: { name: 'read_private', arguments: '{}' } }] } }] }),
      event({ choices: [{ delta: {}, finish_reason: 'tool_calls' }] }),
      'data: [DONE]\n\n'
    ]);
    var client = BareMetal.AI.create({
      endpoint: '/api/ai',
      fetch: function () { return Promise.resolve(response); },
      tools: [{
        name: 'read_private',
        parameters: { type: 'object', properties: {} },
        authorize: function () { return Promise.resolve(false); },
        execute: function () { executed = true; return 'private'; }
      }]
    });
    var rejected = false;
    try { await client.run([{ role: 'user', content: 'Read private data' }]); }
    catch (error) { rejected = error.message.indexOf('not authorized') >= 0; }
    expect(rejected).toBe(true);
    expect(executed).toBe(false);
  });

  it('surfaces endpoint HTTP errors with their status code', async function () {
    var client = BareMetal.AI.create({
      endpoint: '/api/ai',
      fetch: function () { return Promise.resolve(new Response('unauthorized', { status: 401 })); }
    });
    var status = 0;
    try { await client.stream([{ role: 'user', content: 'Hello' }]); }
    catch (error) { status = error.status; }
    expect(status).toBe(401);
  });
});
