# BareMetal.Speech

> Web Speech API wrapper for speech synthesis, speech recognition, command matching, dictation, and queued utterances.

**Size:** 8 KB source / 6 KB minified  
**Dependencies:** None

## Quick Start

```html
<button id="talkBtn">Speak</button>
<button id="listenBtn">Listen</button>

<script src="BareMetal.Speech.min.js"></script>
<script>
  document.getElementById('talkBtn').addEventListener('click', function () {
    BareMetal.Speech.speak('Hello from BareMetal', { lang: 'en-GB', rate: 1 });
  });

  document.getElementById('listenBtn').addEventListener('click', function () {
    const session = BareMetal.Speech.listen({ lang: 'en-US', interimResults: true });
    session
      .onInterim(function (result) { console.log('Interim:', result.transcript); })
      .onResult(function (result) { console.log('Final:', result.transcript); });
  });
</script>
```

## API Reference

### `speak(text, opts)` → `Promise<void>`

Speaks text with `SpeechSynthesisUtterance`. Supports `voice`, `lang`, `rate`, `pitch`, `volume`, `onBoundary`, and `onMark`.

### `pause()` / `resume()` / `cancel()`

Proxy helpers for `speechSynthesis.pause()`, `resume()`, and `cancel()`.

### `voices(lang)` → `Array<SpeechSynthesisVoice>`

Returns available voices, optionally filtered by language prefix such as `en` or `en-GB`.

### `isSpeaking()` / `canSpeak()`

Reports current synthesis activity and feature support.

### `listen(opts)` → session

Starts a recognition session and returns:

- `stop()`
- `abort()`
- `onResult(cb)`
- `onEnd(cb)`
- `onError(cb)`
- `onInterim(cb)`

Options: `lang`, `continuous`, `interimResults`, `maxAlternatives`, `grammars`.

### `command(phrases, callback, opts)` → `{ stop() }`

Runs continuous recognition, matches final transcripts against the supplied phrase list, and calls `callback(matchedPhrase, confidence, transcript, result)`.

### `dictate(opts)` → `{ stop(), onText(cb), getText(), clear() }`

Accumulates final transcript text over time while optionally emitting interim updates to `onText()` subscribers.

### `queue(items)` → `{ start(), stop(), onProgress(cb) }`

Speaks an array of `{ text, opts }` items sequentially and emits progress objects such as `{ index, total, status }` and a final `{ done: true }` notification.

## Notes

- Speech recognition support typically comes from `SpeechRecognition` or `webkitSpeechRecognition`.
- Voice availability can load asynchronously in some browsers; call `voices()` after `voiceschanged` if you need the full list.
- Browser support for the Web Speech API varies, so check `canSpeak()` and `canRecognize()` before enabling UI.
