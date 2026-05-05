/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Media.js');

function loadMedia() {
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Media;');
  return fn();
}

function setMediaDevices(value) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value
  });
}

function makeTrack(kind, overrides) {
  const track = {
    kind,
    label: kind + '-track',
    stop: jest.fn(),
    applyConstraints: jest.fn().mockResolvedValue(undefined),
    getConstraints: jest.fn(() => kind === 'video' ? { width: 640, height: 480 } : { echoCancellation: true }),
    getSettings: jest.fn(() => kind === 'video' ? { width: 640, height: 480 } : { sampleRate: 44100 }),
    getCapabilities: jest.fn(() => kind === 'video' ? { torch: true } : {}),
    ...overrides
  };
  return track;
}

function makeStream(items) {
  const tracks = items.slice();
  return {
    getTracks: () => tracks.slice(),
    getVideoTracks: () => tracks.filter(track => track.kind === 'video'),
    getAudioTracks: () => tracks.filter(track => track.kind === 'audio'),
    addTrack: (track) => { tracks.push(track); },
    removeTrack: (track) => {
      const index = tracks.indexOf(track);
      if (index >= 0) tracks.splice(index, 1);
    }
  };
}

describe('BareMetal.Media', () => {
  const originalMediaDevices = global.navigator.mediaDevices;
  const originalAudioContext = global.AudioContext;
  const originalWebkitAudioContext = global.webkitAudioContext;
  const originalMediaRecorder = global.MediaRecorder;
  const originalImageCapture = global.ImageCapture;
  let Media;
  let analyserFactory;
  let MockAudioContext;
  let MockMediaRecorder;
  let MockImageCapture;
  let playSpy;
  let pauseSpy;
  let drawImage;
  let toBlobSpy;
  let toDataURLSpy;

  beforeEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
    analyserFactory = () => ({
      frequencyBinCount: 4,
      fftSize: 4,
      getByteFrequencyData: jest.fn((arr) => arr.set([1, 2, 3, 4])),
      getByteTimeDomainData: jest.fn((arr) => arr.set([128, 255, 0, 128]))
    });
    MockAudioContext = class {
      constructor() {
        this.close = jest.fn().mockResolvedValue(undefined);
        this._source = { connect: jest.fn() };
        this._analyser = analyserFactory();
      }
      createMediaStreamSource() { return this._source; }
      createAnalyser() { return this._analyser; }
    };
    MockMediaRecorder = class {
      constructor(stream, opts) {
        this.stream = stream;
        this.opts = opts;
        this.mimeType = (opts && opts.mimeType) || 'video/webm';
        this.state = 'inactive';
        this.start = jest.fn((timeslice) => {
          this.timeslice = timeslice;
          this.state = 'recording';
        });
        this.pause = jest.fn(() => { this.state = 'paused'; });
        this.resume = jest.fn(() => { this.state = 'recording'; });
        this.stop = jest.fn(() => {
          this.state = 'inactive';
          if (this.ondataavailable) this.ondataavailable({ data: new Blob(['chunk'], { type: this.mimeType }) });
          if (this.onstop) this.onstop({});
        });
      }
    };
    MockImageCapture = class {
      constructor(track) { this.track = track; }
      getPhotoCapabilities() { return Promise.resolve({ torch: true }); }
    };
    global.AudioContext = MockAudioContext;
    global.webkitAudioContext = undefined;
    global.MediaRecorder = MockMediaRecorder;
    global.ImageCapture = MockImageCapture;
    playSpy = jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pauseSpy = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    drawImage = jest.fn();
    toBlobSpy = jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function(cb, type) {
      cb(new Blob(['snap'], { type: type || 'image/png' }));
    });
    toDataURLSpy = jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((type) => 'data:' + (type || 'image/png') + ';base64,AAAA');
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ drawImage }));
    setMediaDevices({});
    Media = loadMedia();
  });

  afterEach(() => {
    setMediaDevices(originalMediaDevices);
    global.AudioContext = originalAudioContext;
    global.webkitAudioContext = originalWebkitAudioContext;
    global.MediaRecorder = originalMediaRecorder;
    global.ImageCapture = originalImageCapture;
    if (playSpy) playSpy.mockRestore();
    if (pauseSpy) pauseSpy.mockRestore();
    if (toBlobSpy) toBlobSpy.mockRestore();
    if (toDataURLSpy) toDataURLSpy.mockRestore();
  });

  test('camera requests video, builds preview element, and cleans up tracks', async () => {
    const videoTrack = makeTrack('video');
    const stream = makeStream([videoTrack]);
    const getUserMedia = jest.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia });
    Media = loadMedia();

    const result = await Media.camera({ width: 1280, height: 720, facingMode: 'environment', frameRate: 30 });

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { width: 1280, height: 720, facingMode: 'environment', frameRate: 30 },
      audio: false
    });
    expect(result.video).toBeInstanceOf(HTMLVideoElement);
    expect(result.video.srcObject).toBe(stream);
    expect(playSpy).toHaveBeenCalled();

    result.stop();
    expect(videoTrack.stop).toHaveBeenCalledTimes(1);
    expect(pauseSpy).toHaveBeenCalled();
    expect(result.video.srcObject).toBeNull();
  });

  test('camera rejects when getUserMedia fails', async () => {
    setMediaDevices({ getUserMedia: jest.fn().mockRejectedValue(new Error('denied')) });
    Media = loadMedia();
    await expect(Media.camera()).rejects.toThrow('denied');
  });

  test('microphone creates analyser helpers and cleans up audio context', async () => {
    const audioTrack = makeTrack('audio');
    const stream = makeStream([audioTrack]);
    const getUserMedia = jest.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia });
    Media = loadMedia();

    const result = await Media.microphone({ echoCancellation: true });

    expect(getUserMedia).toHaveBeenCalledWith({ video: false, audio: { echoCancellation: true } });
    expect(result.getLevel()).toBeGreaterThan(0.6);
    result.stop();
    expect(audioTrack.stop).toHaveBeenCalledTimes(1);
    expect(result.stream).toBe(stream);
  });

  test('screen capture uses getDisplayMedia', async () => {
    const stream = makeStream([makeTrack('video')]);
    const getDisplayMedia = jest.fn().mockResolvedValue(stream);
    setMediaDevices({ getDisplayMedia });
    Media = loadMedia();

    const result = await Media.screen({ width: 1920, height: 1080, audio: true });

    expect(getDisplayMedia).toHaveBeenCalledWith({
      video: { width: 1920, height: 1080 },
      audio: true
    });
    result.stop();
    expect(stream.getVideoTracks()[0].stop).toHaveBeenCalledTimes(1);
  });

  test('snapshot draws to canvas and can return blob or data url', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 320 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 240 });

    const canvas = Media.snapshot(video);
    const blob = await Media.snapshot(video, { as: 'blob', format: 'image/jpeg', quality: 0.8 });
    const dataUrl = Media.snapshot(video, { as: 'dataURL', format: 'image/webp' });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBe(320);
    expect(canvas.height).toBe(240);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 320, 240);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
    expect(dataUrl).toBe('data:image/webp;base64,AAAA');
  });

  test('record wraps MediaRecorder lifecycle and accumulates chunks', async () => {
    const stream = makeStream([makeTrack('video')]);
    const rec = Media.record(stream, { mimeType: 'video/webm', timeslice: 250 });
    const onData = jest.fn();
    rec.onData(onData);

    rec.start().pause().resume();
    const blob = await rec.stop();

    expect(rec.recorder.start).toHaveBeenCalledWith(250);
    expect(rec.recorder.pause).toHaveBeenCalled();
    expect(rec.recorder.resume).toHaveBeenCalled();
    expect(onData).toHaveBeenCalledTimes(1);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('video/webm');
    expect(rec.getBlob()).toBeInstanceOf(Blob);
  });

  test('devices groups inputs and switchCamera replaces the video track', async () => {
    const oldVideo = makeTrack('video', { getConstraints: jest.fn(() => ({ width: 640, height: 480 })) });
    const audio = makeTrack('audio');
    const stream = makeStream([oldVideo, audio]);
    const nextVideo = makeTrack('video', { label: 'replacement' });
    const nextStream = makeStream([nextVideo]);
    const enumerateDevices = jest.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'cam1' },
      { kind: 'audioinput', deviceId: 'mic1' },
      { kind: 'audiooutput', deviceId: 'spk1' }
    ]);
    const getUserMedia = jest.fn().mockResolvedValue(nextStream);
    setMediaDevices({ enumerateDevices, getUserMedia });
    Media = loadMedia();

    await expect(Media.devices()).resolves.toEqual({
      cameras: [{ kind: 'videoinput', deviceId: 'cam1' }],
      microphones: [{ kind: 'audioinput', deviceId: 'mic1' }],
      speakers: [{ kind: 'audiooutput', deviceId: 'spk1' }]
    });

    const swapped = await Media.switchCamera(stream, 'cam2');

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { width: 640, height: 480, deviceId: { exact: 'cam2' } },
      audio: false
    });
    expect(swapped).toBe(stream);
    expect(stream.getVideoTracks()).toEqual([nextVideo]);
    expect(stream.getAudioTracks()).toEqual([audio]);
    expect(oldVideo.stop).toHaveBeenCalledTimes(1);
  });

  test('pip, torch, preview, constraints, and audioContext expose media helpers', async () => {
    const videoTrack = makeTrack('video');
    const audioTrack = makeTrack('audio');
    const stream = makeStream([videoTrack, audioTrack]);
    const video = document.createElement('video');
    video.requestPictureInPicture = jest.fn().mockResolvedValue('pip');

    await expect(Media.pip(video)).resolves.toBe('pip');
    await expect(Media.torch(stream, true)).resolves.toBe(true);
    expect(videoTrack.applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });

    const host = document.createElement('div');
    document.body.appendChild(host);
    const preview = Media.preview(stream, host, { mirror: true, fit: 'contain', className: 'preview' });
    expect(host.contains(preview.el)).toBe(true);
    expect(preview.el.className).toBe('preview');
    expect(preview.el.style.transform).toBe('scaleX(-1)');
    expect(preview.el.style.objectFit).toBe('contain');

    const info = Media.constraints(stream);
    expect(info.video[0]).toEqual(expect.objectContaining({
      kind: 'video',
      constraints: { width: 640, height: 480 },
      settings: { width: 640, height: 480 },
      capabilities: { torch: true }
    }));
    expect(info.audio[0]).toEqual(expect.objectContaining({ kind: 'audio' }));

    const ac = Media.audioContext(stream);
    expect(Array.from(ac.getFrequency())).toEqual([1, 2, 3, 4]);
    expect(Array.from(ac.getWaveform())).toEqual([128, 255, 0, 128]);

    preview.destroy();
    expect(host.children).toHaveLength(0);
  });
});
