var __bmAIRoot = typeof window !== 'undefined' ? window :
  (typeof globalThis !== 'undefined' ? globalThis : this);
__bmAIRoot.BareMetal = __bmAIRoot.BareMetal ||
  ((typeof BareMetal !== 'undefined' && BareMetal) ? BareMetal : {});
var BareMetal = __bmAIRoot.BareMetal;

BareMetal.AI = (function () {
  'use strict';

  function clone(value) {
    var output;
    var index;
    var key;
    if (value == null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) {
      output = [];
      for (index = 0; index < value.length; index++) output.push(clone(value[index]));
      return output;
    }
    output = {};
    for (key in value) if (Object.prototype.hasOwnProperty.call(value, key)) output[key] = clone(value[key]);
    return output;
  }

  function isObject(value) {
    return !!value && Object.prototype.toString.call(value) === '[object Object]';
  }

  function emit(options, event) {
    if (options && typeof options.onEvent === 'function') options.onEvent(clone(event));
  }

  function normalizeTools(tools) {
    var seen = {};
    return (Array.isArray(tools) ? tools : []).map(function (tool) {
      if (!tool || !/^[a-zA-Z0-9_-]{1,64}$/.test(String(tool.name || ''))) {
        throw new TypeError('AI tools require a 1-64 character name using letters, numbers, underscores, or hyphens');
      }
      if (seen[tool.name]) throw new Error('Duplicate AI tool name: ' + tool.name);
      if (typeof tool.execute !== 'function') throw new TypeError('AI tool ' + tool.name + ' requires an execute function');
      seen[tool.name] = true;
      return {
        name: tool.name,
        description: String(tool.description || ''),
        parameters: clone(tool.parameters || { type: 'object', properties: {} }),
        authorize: typeof tool.authorize === 'function' ? tool.authorize : null,
        authorize: typeof tool.authorize === 'function' ? tool.authorize : null,
        execute: tool.execute
      };
    });
  }

  function toolDefinitions(tools) {
    return tools.map(function (tool) {
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: clone(tool.parameters)
        }
      };
    });
  }

  function sseChunks(response, onChunk, signal) {
    var contentType = response.headers && response.headers.get ? response.headers.get('content-type') || '' : '';
    if (/application\/json/i.test(contentType)) return response.json().then(function (body) { onChunk(body); });
    if (!response.body || typeof response.body.getReader !== 'function') {
      return response.json().then(function (body) { onChunk(body); });
    }
    if (typeof TextDecoder === 'undefined') throw new Error('TextDecoder is required for streamed AI responses');
    var reader = response.body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buffer = '';
    function processEvent(block) {
      var data = block.split(/\r?\n/).filter(function (line) { return line.indexOf('data:') === 0; })
        .map(function (line) { return line.slice(5).replace(/^ /, ''); }).join('\n');
      if (!data || data === '[DONE]') return;
      onChunk(JSON.parse(data));
    }
    function drain(final) {
      buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      var separator;
      while ((separator = buffer.indexOf('\n\n')) >= 0) {
        processEvent(buffer.slice(0, separator));
        buffer = buffer.slice(separator + 2);
      }
      if (final && buffer.trim()) {
        processEvent(buffer);
        buffer = '';
      }
    }
    function read() {
      if (signal && signal.aborted) {
        var abortError = signal.reason instanceof Error ? signal.reason : new Error('AI stream aborted');
        abortError.name = 'AbortError';
        return Promise.reject(abortError);
      }
      return reader.read().then(function (result) {
        if (result.done) {
          buffer += decoder.decode();
          drain(true);
          return;
        }
        buffer += decoder.decode(result.value, { stream: true });
        drain(false);
        return read();
      });
    }
    return read().finally(function () {
      if (reader.releaseLock) reader.releaseLock();
    });
  }

  function create(options) {
    var cfg = options || {};
    var endpoint = cfg.endpoint;
    var fetcher = cfg.fetch || (__bmAIRoot && __bmAIRoot.fetch);
    if (typeof endpoint !== 'string' || !endpoint) throw new TypeError('AI endpoint is required');
    if (typeof fetcher !== 'function') throw new Error('Fetch is unavailable; provide options.fetch');

    function buildRequest(messages, tools, callOptions) {
      var opts = callOptions || {};
      var body = clone(opts.request || {});
      body.model = opts.model || cfg.model;
      body.messages = clone(messages);
      body.stream = true;
      if (tools.length) body.tools = toolDefinitions(tools);
      else if (opts.tools === false) body.tools = [];
      ['temperature', 'top_p', 'max_tokens', 'stop', 'tool_choice', 'response_format'].forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(opts, key)) body[key] = clone(opts[key]);
        else if (Object.prototype.hasOwnProperty.call(cfg, key)) body[key] = clone(cfg[key]);
      });
      if (!body.model) delete body.model;
      return body;
    }

    async function stream(messages, callOptions) {
      if (!Array.isArray(messages)) throw new TypeError('AI messages must be an array');
      var opts = callOptions || {};
      var tools = normalizeTools(opts.tools === false ? [] : (opts.tools || cfg.tools));
      var body = buildRequest(messages, tools, opts);
      var headers = Object.assign({ 'Content-Type': 'application/json', 'Accept': 'text/event-stream, application/json' },
        cfg.headers || {}, opts.headers || {});
      var response = await fetcher(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: opts.signal
      });
      if (!response || typeof response.ok !== 'boolean') throw new TypeError('AI fetch must return a Response-like object');
      if (!response.ok) {
        var errorBody = '';
        try { errorBody = await response.text(); }
        catch (error) { errorBody = error.message || String(error); }
        var error = new Error('AI request failed with HTTP ' + response.status + (errorBody ? ': ' + errorBody : ''));
        error.status = response.status;
        throw error;
      }

      var content = '';
      var calls = {};
      var usage = null;
      var finishReason = null;
      function consume(chunk) {
        if (!chunk || typeof chunk !== 'object') return;
        if (chunk.usage) usage = clone(chunk.usage);
        var choice = chunk.choices && chunk.choices[0];
        if (!choice) return;
        var delta = choice.delta || choice.message || {};
        if (typeof delta.content === 'string' && delta.content) {
          content += delta.content;
          if (typeof opts.onDelta === 'function') opts.onDelta(delta.content, clone(chunk));
          emit(opts, { type: 'delta', text: delta.content });
        }
        (delta.tool_calls || []).forEach(function (part, position) {
          var index = part.index == null ? position : Number(part.index);
          if (!isFinite(index)) index = position;
          var call = calls[index] || (calls[index] = {
            id: '',
            type: 'function',
            function: { name: '', arguments: '' }
          });
          if (part.id) call.id = part.id;
          if (part.type) call.type = part.type;
          if (part.function) {
            call.function.name += part.function.name || '';
            call.function.arguments += part.function.arguments || '';
          }
        });
        if (choice.finish_reason) finishReason = choice.finish_reason;
      }

      await sseChunks(response, consume, opts.signal);
      var toolCalls = Object.keys(calls).sort(function (a, b) { return Number(a) - Number(b); }).map(function (key, index) {
        var call = calls[key];
        if (!call.id) call.id = 'tool-call-' + index;
        return call;
      });
      return {
        message: { role: 'assistant', content: content, tool_calls: toolCalls },
        usage: usage,
        finishReason: finishReason
      };
    }

    async function run(messages, callOptions) {
      var opts = callOptions || {};
      var tools = normalizeTools(opts.tools === false ? [] : (opts.tools || cfg.tools));
      var toolMap = {};
      tools.forEach(function (tool) { toolMap[tool.name] = tool; });
      var conversation = clone(messages);
      var roundsValue = Number(opts.maxToolRounds == null ? cfg.maxToolRounds : opts.maxToolRounds);
      var callsValue = Number(opts.maxToolCalls == null ? cfg.maxToolCalls : opts.maxToolCalls);
      var maxToolRounds = isFinite(roundsValue) && roundsValue >= 0 ? Math.floor(roundsValue) : 4;
      var maxToolCalls = isFinite(callsValue) && callsValue >= 1 ? Math.floor(callsValue) : 8;
      var usage = null;
      var round;
      for (round = 0; round <= maxToolRounds; round++) {
        var result = await stream(conversation, Object.assign({}, opts, { tools: tools }));
        usage = result.usage || usage;
        conversation.push(clone(result.message));
        if (!result.message.tool_calls.length) {
          return {
            message: result.message,
            messages: conversation,
            usage: usage,
            toolRounds: round
          };
        }
        if (round >= maxToolRounds) throw new RangeError('AI tool-call round limit reached');
        if (result.message.tool_calls.length > maxToolCalls) throw new RangeError('AI tool-call count limit exceeded');
        for (var index = 0; index < result.message.tool_calls.length; index++) {
          var call = result.message.tool_calls[index];
          var toolName = call.function && call.function.name;
          var tool = toolMap[toolName];
          if (!tool) throw new Error('AI requested an unregistered tool: ' + toolName);
          var args;
          try { args = JSON.parse(call.function.arguments || '{}'); }
          catch (error) { throw new Error('AI tool arguments were invalid JSON for ' + toolName + ': ' + error.message); }
          if (!isObject(args)) throw new TypeError('AI tool arguments must be a JSON object for ' + toolName);
          emit(opts, { type: 'tool-call', id: call.id, name: toolName, arguments: args });
          var authorize = tool.authorize || opts.authorizeTool || cfg.authorizeTool;
          if (typeof authorize === 'function') {
            var allowed = await authorize({ name: toolName, arguments: clone(args), call: clone(call) });
            if (allowed !== true) {
              emit(opts, { type: 'tool-rejected', id: call.id, name: toolName });
              throw new Error('AI tool call was not authorized: ' + toolName);
            }
          }
          var toolResult = await tool.execute(clone(args), {
            messages: clone(conversation),
            signal: opts.signal
          });
          emit(opts, { type: 'tool-result', id: call.id, name: toolName, result: toolResult });
          var toolContent = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
          conversation.push({
            role: 'tool',
            tool_call_id: call.id,
            name: toolName,
            content: toolContent === undefined ? 'null' : toolContent
          });
        }
      }
      throw new Error('AI request ended without a final assistant message');
    }

    return {
      stream: stream,
      run: run
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.AI;
