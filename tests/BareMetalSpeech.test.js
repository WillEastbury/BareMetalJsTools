/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Speech.js');

function loadSpeech() {
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Speech;');
  return fn();
}

describe('BareMetal.Speech', () => {
  const originalSynthesis = global.speechSynthesis;
  const originalUtterance = global.SpeechSynthesisUtterance;
  const originalRecognition = global.SpeechRecognition;
  const originalWebkitRecognition = global.webkitSpeechRecognition;
  const originalGrammarList = global.SpeechGrammarList;
  const originalWebkitGrammarList = global.webkitSpeechGrammarList;
  let utterances;
  let recognitions;
  let voices;

  function makeResult(transcript, isFinal, confidence) {
    return {
      0: { transcript, confidence: confidence == null ? 0.9 : confidence },
      length: 1,
      isFinal: !!isFinal
    };
  }

  beforeEach(() => {
    utterances = [];
    recognitions = [];
    voices = [
      { name: 'Alice', lang: 'en-US', voiceURI: 'alice' },
      { name: 'Bob', lang: 'fr-FR', voiceURI: 'bob' }
    ];

    global.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
    };

    global.speechSynthesis = {
      speaking: false,
      pending: false,
      paused: false,
      speak: jest.fn((utterance) => {
        utterances.push(utterance);
        global.speechSynthesis.speaking = true;
        setTimeout(() => {
          global.speechSynthesis.speaking = false;
          if (utterance.onend) utterance.onend({ type: 'end' });
        }, 0);
      }),
      pause: jest.fn(() => { global.speechSynthesis.paused = true; }),
      resume: jest.fn(() => { global.speechSynthesis.paused = false; }),
      cancel: jest.fn(() => {
        global.speechSynthesis.speaking = false;
        global.speechSynthesis.pending = false;
      }),
      getVoices: jest.fn(() => voices)
    };

    global.SpeechGrammarList = function SpeechGrammarList() {
      this.items = [];
      this.addFromString = (src, weight) => this.items.push({ src, weight });
    };

    global.SpeechRecognition = function SpeechRecognition() {
      this.lang = '';
      this.continuous = false;
      this.interimResults = false;
      this.maxAlternatives = 1;
      this.grammars = null;
      this.start = jest.fn(() => {
        this.started = true;
      });
      this.stop = jest.fn(() => {
        this.stopped = true;
      });
      this.abort = jest.fn(() => {
        this.aborted = true;
      });
      recognitions.push(this);
    };

    delete global.webkitSpeechRecognition;
    delete global.webkitSpeechGrammarList;
  });

  afterEach(() => {
    global.speechSynthesis = originalSynthesis;
    global.SpeechSynthesisUtterance = originalUtterance;
    global.SpeechRecognition = originalRecognition;
    global.webkitSpeechRecognition = originalWebkitRecognition;
    global.SpeechGrammarList = originalGrammarList;
    global.webkitSpeechGrammarList = originalWebkitGrammarList;
    jest.restoreAllMocks();
  });

  test('speak queues utterance with configured properties', async () => {
    const Speech = loadSpeech();
    const onBoundary = jest.fn();
    const onMark = jest.fn();

    await expect(Speech.speak('Hello world', {
      voice: 'Alice',
      lang: 'en-GB',
      rate: 1.2,
      pitch: 0.8,
      volume: 0.5,
      onBoundary,
      onMark
    })).resolves.toBeUndefined();

    expect(global.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(utterances[0].text).toBe('Hello world');
    expect(utterances[0].voice).toEqual(voices[0]);
    expect(utterances[0].lang).toBe('en-GB');
    expect(utterances[0].rate).toBe(1.2);
    expect(utterances[0].pitch).toBe(0.8);
    expect(utterances[0].volume).toBe(0.5);

    utterances[0].onboundary({ charIndex: 3 });
    utterances[0].onmark({ name: 'tick' });
    expect(onBoundary).toHaveBeenCalledWith({ charIndex: 3 }, utterances[0]);
    expect(onMark).toHaveBeenCalledWith({ name: 'tick' }, utterances[0]);
  });

  test('voices filters by language', () => {
    const Speech = loadSpeech();

    expect(Speech.voices().map((v) => v.name)).toEqual(['Alice', 'Bob']);
    expect(Speech.voices('en').map((v) => v.name)).toEqual(['Alice']);
    expect(Speech.voices('fr-FR').map((v) => v.name)).toEqual(['Bob']);
  });

  test('listen starts recognition with supplied options', () => {
    const Speech = loadSpeech();
    const session = Speech.listen({
      lang: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      grammars: ['#JSGF V1.0; grammar cmd; public <cmd> = hello ;']
    });
    const recognition = recognitions[0];
    const onResult = jest.fn();
    const onInterim = jest.fn();
    const onEnd = jest.fn();
    const onError = jest.fn();

    session.onResult(onResult).onInterim(onInterim).onEnd(onEnd).onError(onError);

    expect(recognition.start).toHaveBeenCalledTimes(1);
    expect(recognition.lang).toBe('en-US');
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(recognition.maxAlternatives).toBe(3);
    expect(recognition.grammars.items).toEqual([
      { src: '#JSGF V1.0; grammar cmd; public <cmd> = hello ;', weight: 1 }
    ]);

    recognition.onresult({ resultIndex: 0, results: [makeResult('working', false, 0.4)] });
    recognition.onresult({ resultIndex: 0, results: [makeResult('done', true, 0.9)] });
    recognition.onerror({ error: 'network' });
    recognition.onend({ type: 'end' });

    expect(onInterim).toHaveBeenCalledWith(expect.objectContaining({ transcript: 'working', isFinal: false }), expect.any(Object), recognition);
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ transcript: 'done', isFinal: true, confidence: 0.9 }), expect.any(Object), recognition);
    expect(onError).toHaveBeenCalledWith({ error: 'network' }, recognition);
    expect(onEnd).toHaveBeenCalledWith({ type: 'end' }, recognition);

    session.stop();
    session.abort();
    expect(recognition.stop).toHaveBeenCalledTimes(1);
    expect(recognition.abort).toHaveBeenCalledTimes(1);
  });

  test('command matches phrases from final transcripts', () => {
    const Speech = loadSpeech();
    const callback = jest.fn();
    const session = Speech.command(['turn on lights', 'play music'], callback, { lang: 'en-US' });
    const recognition = recognitions[0];

    recognition.onresult({ resultIndex: 0, results: [makeResult('please turn on lights now', true, 0.77)] });
    recognition.onresult({ resultIndex: 0, results: [makeResult('random chatter', true, 0.2)] });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('turn on lights', 0.77, 'please turn on lights now', expect.objectContaining({ transcript: 'please turn on lights now' }));

    session.stop();
    expect(recognition.stop).toHaveBeenCalledTimes(1);
  });

  test('dictate accumulates transcripts and can clear text', () => {
    const Speech = loadSpeech();
    const dictation = Speech.dictate({ lang: 'en-US' });
    const recognition = recognitions[0];
    const onText = jest.fn();

    dictation.onText(onText);

    recognition.onresult({ resultIndex: 0, results: [makeResult('hello', true, 0.8)] });
    recognition.onresult({ resultIndex: 0, results: [makeResult('world', false, 0.6)] });
    recognition.onresult({ resultIndex: 0, results: [makeResult('again', true, 0.7)] });

    expect(dictation.getText()).toBe('hello again');
    expect(onText).toHaveBeenNthCalledWith(1, expect.objectContaining({ text: 'hello', transcript: 'hello', final: true }), 'hello', 'hello');
    expect(onText).toHaveBeenNthCalledWith(2, expect.objectContaining({ text: 'hello world', transcript: 'world', final: false }), 'hello world', 'world');
    expect(onText).toHaveBeenNthCalledWith(3, expect.objectContaining({ text: 'hello again', transcript: 'again', final: true }), 'hello again', 'again');

    dictation.clear();
    expect(dictation.getText()).toBe('');
    dictation.stop();
    expect(recognition.stop).toHaveBeenCalledTimes(1);
  });

  test('queue speaks items sequentially with progress updates', async () => {
    const Speech = loadSpeech();
    const progress = jest.fn();
    const queue = Speech.queue([
      { text: 'first' },
      { text: 'second', opts: { rate: 1.5 } }
    ]).onProgress(progress);

    await expect(queue.start()).resolves.toBeUndefined();

    expect(global.speechSynthesis.speak).toHaveBeenCalledTimes(2);
    expect(utterances.map((u) => u.text)).toEqual(['first', 'second']);
    expect(utterances[1].rate).toBe(1.5);
    expect(progress).toHaveBeenNthCalledWith(1, expect.objectContaining({ index: 0, status: 'start' }));
    expect(progress).toHaveBeenNthCalledWith(2, expect.objectContaining({ index: 0, status: 'spoken' }));
    expect(progress).toHaveBeenNthCalledWith(3, expect.objectContaining({ index: 1, status: 'start' }));
    expect(progress).toHaveBeenNthCalledWith(4, expect.objectContaining({ index: 1, status: 'spoken' }));
    expect(progress).toHaveBeenLastCalledWith(expect.objectContaining({ done: true, total: 2 }));
  });

  test('speech helpers proxy synthesis state', () => {
    const Speech = loadSpeech();

    expect(Speech.canSpeak()).toBe(true);
    expect(Speech.canRecognize()).toBe(true);
    global.speechSynthesis.pending = true;
    expect(Speech.isSpeaking()).toBe(true);

    Speech.pause();
    Speech.resume();
    Speech.cancel();

    expect(global.speechSynthesis.pause).toHaveBeenCalledTimes(1);
    expect(global.speechSynthesis.resume).toHaveBeenCalledTimes(1);
    expect(global.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });
});
