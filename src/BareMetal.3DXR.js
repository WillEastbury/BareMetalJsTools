/* BareMetal.3DXR — small WebGL/WebXR video-tile renderer.
 * No framework or renderer dependency; uses browser WebGL, WebXR and media APIs.
 */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal['3DXR'] = (function () {
  'use strict';

  const VERTEX_SHADER_1 = `
    attribute vec3 a_position;
    attribute vec2 a_uv;
    uniform mat4 u_mvp;
    uniform bool u_is_solid;
    uniform int u_spiral;
    uniform float u_time;
    uniform float u_spiral_speed;
    uniform float u_spiral_turns;
    uniform vec3 u_spiral_a;
    uniform vec3 u_spiral_b;
    varying vec2 v_uv;
    void main() {
      gl_Position = u_is_solid ? vec4(a_position, 1.0) : u_mvp * vec4(a_position, 1.0);
      v_uv = a_uv;
    }
  `;
  const FRAGMENT_SHADER_1 = `
    precision mediump float;
    uniform sampler2D u_video;
    uniform bool u_is_solid;
    uniform vec4 u_solid_color;
    uniform int u_spiral;
    uniform float u_time;
    uniform float u_spiral_speed;
    uniform float u_spiral_turns;
    uniform vec3 u_spiral_a;
    uniform vec3 u_spiral_b;
    varying vec2 v_uv;
    void main() {
      if (u_is_solid) { gl_FragColor = u_solid_color; return; }
      if (u_spiral == 1) {
        vec2 p = vec2((v_uv.x - 0.5) * 2.0, v_uv.y - 0.5);
        float angle = atan(p.y, p.x);
        float radius = length(p);
        float wave = sin(radius * 58.0 - angle * u_spiral_turns + u_time * u_spiral_speed);
        float blend = smoothstep(-0.25, 0.25, wave);
        float glow = 1.0 - smoothstep(0.05, 0.72, radius) * 0.38;
        gl_FragColor = vec4(mix(u_spiral_a, u_spiral_b, blend) * glow, 1.0);
        return;
      }
      gl_FragColor = texture2D(u_video, v_uv);
    }
  `;
  const VERTEX_SHADER_2 = `#version 300 es
    in vec3 a_position;
    in vec2 a_uv;
    uniform mat4 u_mvp;
    uniform bool u_is_solid;
    uniform int u_spiral;
    uniform float u_time;
    uniform float u_spiral_speed;
    uniform float u_spiral_turns;
    uniform vec3 u_spiral_a;
    uniform vec3 u_spiral_b;
    out vec2 v_uv;
    void main() {
      gl_Position = u_is_solid ? vec4(a_position, 1.0) : u_mvp * vec4(a_position, 1.0);
      v_uv = a_uv;
    }
  `;
  const FRAGMENT_SHADER_2 = `#version 300 es
    precision mediump float;
    uniform sampler2D u_video;
    uniform bool u_is_solid;
    uniform vec4 u_solid_color;
    uniform int u_spiral;
    uniform float u_time;
    uniform float u_spiral_speed;
    uniform float u_spiral_turns;
    uniform vec3 u_spiral_a;
    uniform vec3 u_spiral_b;
    in vec2 v_uv;
    out vec4 out_color;
    void main() {
      if (u_is_solid) { out_color = u_solid_color; return; }
      if (u_spiral == 1) {
        vec2 p = vec2((v_uv.x - 0.5) * 2.0, v_uv.y - 0.5);
        float angle = atan(p.y, p.x);
        float radius = length(p);
        float wave = sin(radius * 58.0 - angle * u_spiral_turns + u_time * u_spiral_speed);
        float blend = smoothstep(-0.25, 0.25, wave);
        float glow = 1.0 - smoothstep(0.05, 0.72, radius) * 0.38;
        out_color = vec4(mix(u_spiral_a, u_spiral_b, blend) * glow, 1.0);
        return;
      }
      out_color = texture(u_video, v_uv);
    }
  `;
  const QUAD = new Float32Array([
    -0.5, -0.5, 0, 0, 1,   0.5, -0.5, 0, 1, 1,   0.5,  0.5, 0, 1, 0,
    -0.5, -0.5, 0, 0, 1,   0.5,  0.5, 0, 1, 0,  -0.5,  0.5, 0, 0, 0
  ]);
  const RETICLE = new Float32Array([
    -0.018, 0, 0, 0, 0,  0.018, 0, 0, 0, 0,
    0, -0.028, 0, 0, 0,  0, 0.028, 0, 0, 0
  ]);
  function makeSphere(rows, columns, radius) {
    const data = [];
    for (let row = 0; row <= rows; row++) {
      const v = row / rows, theta = v * Math.PI;
      for (let col = 0; col <= columns; col++) {
        const u = col / columns, phi = u * Math.PI * 2;
        const x = Math.sin(theta) * Math.cos(phi), y = Math.cos(theta), z = Math.sin(theta) * Math.sin(phi);
        data.push(x * radius, y * radius, z * radius, u, v);
      }
    }
    const vertices = [];
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const a = row * (columns + 1) + col, b = a + columns + 1;
      for (const index of [a, b, a + 1, a + 1, b, b + 1]) vertices.push(...data.slice(index * 5, index * 5 + 5));
    }
    return new Float32Array(vertices);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function vec3(value, fallback) {
    return Array.isArray(value) && value.length >= 3
      ? [Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0]
      : fallback.slice();
  }
  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const reason = gl.getShaderInfoLog(shader) || 'shader compilation failed';
      gl.deleteShader(shader);
      throw new Error('BareMetal.3DXR: ' + reason);
    }
    return shader;
  }
  function makeProgram(gl, webgl2) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, webgl2 ? VERTEX_SHADER_2 : VERTEX_SHADER_1));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, webgl2 ? FRAGMENT_SHADER_2 : FRAGMENT_SHADER_1));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const reason = gl.getProgramInfoLog(program) || 'program link failed';
      gl.deleteProgram(program);
      throw new Error('BareMetal.3DXR: ' + reason);
    }
    return program;
  }
  function multiply4(out, a, b) {
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  }
  function perspective(out, fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    return out;
  }
  function normalize(v) {
    const length = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
  }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function lookAt(out, eye, direction) {
    const z = normalize([-direction[0], -direction[1], -direction[2]]);
    const x = normalize(cross([0, 1, 0], z));
    const y = cross(z, x);
    out[0] = x[0]; out[1] = y[0]; out[2] = z[0]; out[3] = 0;
    out[4] = x[1]; out[5] = y[1]; out[6] = z[1]; out[7] = 0;
    out[8] = x[2]; out[9] = y[2]; out[10] = z[2]; out[11] = 0;
    out[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
    out[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
    out[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
    out[15] = 1;
    return out;
  }
  function modelMatrix(out, tile) {
    const yaw = tile.yaw, pitch = tile.pitch;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    out[0] = cy * tile.width; out[1] = 0; out[2] = -sy * tile.width; out[3] = 0;
    out[4] = sy * sp * tile.height; out[5] = cp * tile.height; out[6] = cy * sp * tile.height; out[7] = 0;
    out[8] = sy * cp; out[9] = -sp; out[10] = cy * cp; out[11] = 0;
    out[12] = tile.position[0]; out[13] = tile.position[1]; out[14] = tile.position[2]; out[15] = 1;
    return out;
  }
  function sourceUrl(source) {
    if (typeof source === 'string') return source;
    return source && (source.src || source.url || source.video) || '';
  }
  function hexColor(value) {
    if (Array.isArray(value)) return [clamp(+value[0] || 0, 0, 1), clamp(+value[1] || 0, 0, 1), clamp(+value[2] || 0, 0, 1)];
    const match = /^#?([0-9a-f]{6})$/i.exec(value || '090510');
    if (!match) return [0.035, 0.02, 0.063];
    const n = parseInt(match[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  class Renderer {
    constructor(canvas, options) {
      if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('BareMetal.3DXR.create requires a canvas');
      this.canvas = canvas;
      this.options = Object.assign({ fov: 70, maxTiles: 16, background: '#090510', reticle: true, desktopLook: true }, options || {});
      this.gl = canvas.getContext('webgl2', { alpha: false, antialias: true, xrCompatible: true }) ||
        canvas.getContext('webgl', { alpha: false, antialias: true, xrCompatible: true });
      if (!this.gl) throw new Error('BareMetal.3DXR: WebGL is unavailable');
      this.webgl2 = typeof WebGL2RenderingContext !== 'undefined' && this.gl instanceof WebGL2RenderingContext;
      this.program = makeProgram(this.gl, this.webgl2);
      this.positionLoc = this.gl.getAttribLocation(this.program, 'a_position');
      this.uvLoc = this.gl.getAttribLocation(this.program, 'a_uv');
      this.mvpLoc = this.gl.getUniformLocation(this.program, 'u_mvp');
      this.textureLoc = this.gl.getUniformLocation(this.program, 'u_video');
      this.solidLoc = this.gl.getUniformLocation(this.program, 'u_is_solid');
      this.solidColorLoc = this.gl.getUniformLocation(this.program, 'u_solid_color');
      this.spiralLoc = this.gl.getUniformLocation(this.program, 'u_spiral');
      this.timeLoc = this.gl.getUniformLocation(this.program, 'u_time');
      this.spiralSpeedLoc = this.gl.getUniformLocation(this.program, 'u_spiral_speed');
      this.spiralTurnsLoc = this.gl.getUniformLocation(this.program, 'u_spiral_turns');
      this.spiralALoc = this.gl.getUniformLocation(this.program, 'u_spiral_a');
      this.spiralBLoc = this.gl.getUniformLocation(this.program, 'u_spiral_b');
      this.buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, QUAD, this.gl.STATIC_DRAW);
      this.reticleBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.reticleBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, RETICLE, this.gl.STATIC_DRAW);
      this.backgroundBuffer = this.gl.createBuffer();
      const backgroundVertices = makeSphere(32, 64, 45);
      this.backgroundVertexCount = backgroundVertices.length / 5;
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.backgroundBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, backgroundVertices, this.gl.STATIC_DRAW);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.LEQUAL);
      this.gl.clearColor(...hexColor(this.options.background), 1);
      this.tiles = [];
      this.events = Object.create(null);
      this.yaw = 0;
      this.pitch = 0;
      this.running = false;
      this.audioUnlocked = false;
      this.focusedId = null;
      this.frameHandle = 0;
      this.xrSession = null;
      this.xrLayer = null;
      this.referenceSpace = null;
      this.ambient = null;
      this.ambientVolume = 0.25;
      this.backgroundMode = 'flat';
      this.backgroundSource = null;
      this.backgroundOwned = false;
      this.backgroundTexture = null;
      this.spiralOptions = { colors: ['#160924', '#ff2b9d'], speed: 0.8, turns: 7 };
      this.backgroundModel = new Float32Array(16);
      this.backgroundMvp = new Float32Array(16);
      this.startedAt = performance.now();
      this.viewMatrix = new Float32Array(16);
      this.projectionMatrix = new Float32Array(16);
      this.model = new Float32Array(16);
      this.mvp = new Float32Array(16);
      this._pointer = null;
      this._onPointerDown = this._pointerDown.bind(this);
      this._onPointerMove = this._pointerMove.bind(this);
      this._onPointerUp = this._pointerUp.bind(this);
      this._onContextLostBound = this._onContextLost.bind(this);
      canvas.addEventListener('pointerdown', this._onPointerDown);
      canvas.addEventListener('pointermove', this._onPointerMove);
      canvas.addEventListener('pointerup', this._onPointerUp);
      canvas.addEventListener('pointercancel', this._onPointerUp);
      canvas.addEventListener('webglcontextlost', this._onContextLostBound, false);
      this.reticle = this.options.reticle ? this._makeReticle() : null;
      this.start();
    }

    on(name, callback) {
      if (typeof callback !== 'function') throw new TypeError('event callback must be a function');
      (this.events[name] || (this.events[name] = new Set())).add(callback);
      return () => this.off(name, callback);
    }
    off(name, callback) { if (this.events[name]) this.events[name].delete(callback); return this; }
    _emit(name, detail) { (this.events[name] || []).forEach(fn => fn(detail)); }

    addVideo(config) {
      config = config || {};
      if (this.tiles.length >= this.options.maxTiles) throw new Error('BareMetal.3DXR: maxTiles limit reached');
      const id = String(config.id || 'video-' + (this.tiles.length + 1));
      if (this.tiles.some(item => item.id === id)) throw new Error('BareMetal.3DXR: duplicate video tile id ' + id);
      const video = config.video || document.createElement('video');
      if (!config.video) {
        video.crossOrigin = config.crossOrigin || 'anonymous';
        video.preload = config.preload || 'auto';
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.muted = true;
        video.src = sourceUrl(config.src || (config.playlist && config.playlist[0]));
        if (!video.src) throw new TypeError('addVideo requires src, video, or a non-empty playlist');
      } else {
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.muted = true;
      }
      video.loop = false;
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([18, 12, 24, 255]));
      const playlist = (config.playlist || []).slice();
      const initialSource = sourceUrl(config.src || playlist[0]);
      const initialIndex = playlist.findIndex(source => sourceUrl(source) === initialSource);
      const tile = {
        id, video, texture,
        position: vec3(config.position, [0, 1.6, -3]),
        width: Math.max(0.05, Number(config.width) || 1.6),
        height: Math.max(0.05, Number(config.height) || 0.9),
        yaw: Number(config.yaw) || 0, pitch: Number(config.pitch) || 0,
        uploadedTime: -1, hasTextureFrame: false, textureErrorSource: '',
        playlist, shuffle: !!config.shuffle, playlistIndex: playlist.length ? (initialIndex + 1) % playlist.length : 0,
        previousSource: initialSource, onEnded: config.onEnded || null
      };
      video.muted = true;
      video.addEventListener('ended', () => this._advance(tile));
      this.tiles.push(tile);
      const play = video.play();
      if (play && typeof play.catch === 'function') play.catch(error => this._emit('autoplayblocked', { id: tile.id, error }));
      return tile.id;
    }

    removeVideo(id) {
      const index = this.tiles.findIndex(tile => tile.id === String(id));
      if (index < 0) return false;
      const tile = this.tiles[index];
      tile.video.pause();
      tile.video.removeAttribute('src');
      tile.video.load();
      this.gl.deleteTexture(tile.texture);
      this.tiles.splice(index, 1);
      if (this.focusedId === tile.id) this._setFocus(null);
      return true;
    }

    replaceVideo(id, source) {
      const tile = this.tiles.find(item => item.id === String(id));
      if (!tile) return false;
      const url = sourceUrl(source);
      if (!url) throw new TypeError('replaceVideo requires a URL or source object');
      tile.video.pause();
      tile.video.src = url;
      tile.previousSource = url;
      tile.uploadedTime = -1;
      tile.hasTextureFrame = false;
      tile.textureErrorSource = '';
      const playlistIndex = tile.playlist.findIndex(entry => sourceUrl(entry) === url);
      if (playlistIndex >= 0) tile.playlistIndex = (playlistIndex + 1) % tile.playlist.length;
      tile.video.load();
      const play = tile.video.play();
      if (play && typeof play.catch === 'function') play.catch(error => this._emit('autoplayblocked', { id: tile.id, error }));
      return true;
    }

    setPlaylist(id, playlist, options) {
      const tile = this.tiles.find(item => item.id === String(id));
      if (!tile) return false;
      tile.playlist = Array.isArray(playlist) ? playlist.slice() : [];
      tile.playlistIndex = 0;
      if (options && options.shuffle != null) tile.shuffle = !!options.shuffle;
      return true;
    }

    _advance(tile) {
      this._emit('tileended', { id: tile.id, video: tile.video });
      if (typeof tile.onEnded === 'function') tile.onEnded(tile.id, this);
      if (!tile.playlist.length) return;
      let index;
      if (tile.shuffle && tile.playlist.length > 1) {
        const choices = tile.playlist.map((entry, i) => ({ entry, i }))
          .filter(item => sourceUrl(item.entry) !== tile.previousSource);
        index = choices.length
          ? choices[Math.floor(Math.random() * choices.length)].i
          : Math.floor(Math.random() * tile.playlist.length);
      } else {
        index = tile.playlistIndex % tile.playlist.length;
        tile.playlistIndex++;
      }
      this.replaceVideo(tile.id, tile.playlist[index]);
    }

    setBackground(color) {
      this.options.background = color;
      this.gl.clearColor(...hexColor(color), 1);
      return this;
    }

    setBackgroundPanorama(source, options) {
      options = options || {};
      const descriptor = source && typeof source === 'object' && !('tagName' in source) ? source : null;
      const input = descriptor ? (descriptor.src || descriptor.url || descriptor.video) : source;
      const type = options.type || (descriptor && descriptor.type) || '';
      if (!input) throw new TypeError('setBackgroundPanorama requires a URL or image/video/canvas element');
      this._releaseBackgroundSource();
      let media = input, owned = false;
      if (typeof input === 'string') {
        owned = true;
        const mediaType = type.toLowerCase();
        if (mediaType === 'video') {
          media = document.createElement('video');
          media.crossOrigin = options.crossOrigin || 'anonymous';
          media.muted = options.muted !== false;
          media.loop = options.loop !== false;
          media.playsInline = true;
          media.setAttribute('playsinline', '');
          media.preload = 'auto';
          media.src = input;
          media.addEventListener('error', () => this._emit('backgrounderror', { source: input, error: media.error }), { once: true });
          const play = media.play();
          if (play && typeof play.catch === 'function') play.catch(error => this._emit('backgroundblocked', { source: input, error }));
        } else {
          media = new Image();
          media.crossOrigin = options.crossOrigin || 'anonymous';
          media.onload = () => this._emit('backgroundready', { source: input, type: 'image' });
          media.onerror = error => this._emit('backgrounderror', { source: input, error });
          media.src = input;
        }
      } else if (input && input.tagName && input.tagName.toLowerCase() === 'video') {
        media = input;
        media.muted = options.muted !== false;
        media.loop = options.loop !== false;
        media.playsInline = true;
        const play = media.play();
        if (play && typeof play.catch === 'function') play.catch(error => this._emit('backgroundblocked', { source: media.currentSrc, error }));
      }
      if (!media || typeof media !== 'object') throw new TypeError('Unsupported panorama source');
      this.backgroundSource = media;
      this.backgroundOwned = owned;
      this.backgroundMode = 'panorama';
      this.backgroundTexture = this._newTexture();
      this.backgroundUploadedTime = -1;
      this.backgroundUploadFailed = false;
      return this;
    }

    setProceduralBackground(style, options) {
      if (style !== 'spiral') throw new TypeError('Supported procedural background: spiral');
      options = options || {};
      this._releaseBackgroundSource();
      const colors = options.colors || ['#160924', '#ff2b9d'];
      this.spiralOptions = {
        colors: [hexColor(colors[0]), hexColor(colors[1])],
        speed: Number.isFinite(Number(options.speed)) ? Number(options.speed) : 0.8,
        turns: Number.isFinite(Number(options.turns)) ? Number(options.turns) : 7
      };
      this.backgroundMode = 'spiral';
      return this;
    }

    clearBackgroundPanorama() {
      this._releaseBackgroundSource();
      this.backgroundMode = 'flat';
      return this;
    }

    _newTexture() {
      const gl = this.gl, texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([18, 12, 24, 255]));
      return texture;
    }

    _releaseBackgroundSource() {
      if (this.backgroundTexture) this.gl.deleteTexture(this.backgroundTexture);
      if (this.backgroundOwned && this.backgroundSource && this.backgroundSource.tagName && this.backgroundSource.tagName.toLowerCase() === 'video') {
        this.backgroundSource.pause();
        this.backgroundSource.removeAttribute('src');
        this.backgroundSource.load();
      }
      this.backgroundTexture = null;
      this.backgroundSource = null;
      this.backgroundOwned = false;
    }

    async setAmbientTrack(source, options) {
      options = options || {};
      if (this.ambient) { this.ambient.pause(); this.ambient.removeAttribute('src'); }
      this.ambient = new Audio();
      this.ambient.crossOrigin = options.crossOrigin || 'anonymous';
      this.ambient.loop = options.loop !== false;
      this.ambient.preload = 'auto';
      this.ambient.src = sourceUrl(source);
      this.setAmbientVolume(options.volume == null ? this.ambientVolume : options.volume);
      this.ambient.load();
      if (this.audioUnlocked) await this.ambient.play();
      return this.ambient;
    }

    setAmbientVolume(volume) {
      this.ambientVolume = clamp(Number(volume) || 0, 0, 1);
      if (this.ambient) this.ambient.volume = this.ambientVolume;
      return this;
    }

    async isXRSupported() {
      return !!(typeof navigator !== 'undefined' && navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'));
    }

    async enterVR(options) {
      if (typeof navigator === 'undefined' || !navigator.xr) throw new Error('BareMetal.3DXR: WebXR is unavailable');
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: (options && options.optionalFeatures) || ['local-floor']
      });
      this.audioUnlocked = true;
      let layer, referenceSpace;
      try {
        await this.gl.makeXRCompatible();
        layer = new XRWebGLLayer(session, this.gl);
        session.updateRenderState({ baseLayer: layer });
        try { referenceSpace = await session.requestReferenceSpace('local-floor'); }
        catch (_) { referenceSpace = await session.requestReferenceSpace('local'); }
      } catch (error) {
        await session.end();
        throw error;
      }
      this.xrSession = session;
      this.xrLayer = layer;
      this.referenceSpace = referenceSpace;
      session.addEventListener('end', () => {
        this.xrSession = null;
        this.xrLayer = null;
        this.referenceSpace = null;
        if (this.running) this.frameHandle = requestAnimationFrame(this._desktopFrame.bind(this));
        this._emit('xrend', {});
      }, { once: true });
      this._unlockAudio();
      this._emit('xrstart', { session });
      session.requestAnimationFrame(this._xrFrame.bind(this));
      return session;
    }

    start() {
      if (this.running) return this;
      this.running = true;
      if (this.xrSession) this.xrSession.requestAnimationFrame(this._xrFrame.bind(this));
      else this.frameHandle = requestAnimationFrame(this._desktopFrame.bind(this));
      return this;
    }

    stop() {
      this.running = false;
      if (this.frameHandle) cancelAnimationFrame(this.frameHandle);
      this.frameHandle = 0;
      return this;
    }

    dispose() {
      this.stop();
      if (this.xrSession) this.xrSession.end();
      this.tiles.slice().forEach(tile => this.removeVideo(tile.id));
      if (this.ambient) { this.ambient.pause(); this.ambient.removeAttribute('src'); }
      this.canvas.removeEventListener('pointerdown', this._onPointerDown);
      this.canvas.removeEventListener('pointermove', this._onPointerMove);
      this.canvas.removeEventListener('pointerup', this._onPointerUp);
      this.canvas.removeEventListener('pointercancel', this._onPointerUp);
      this.canvas.removeEventListener('webglcontextlost', this._onContextLostBound, false);
      if (this.reticle && this.reticle.parentNode) this.reticle.parentNode.removeChild(this.reticle);
      this.gl.deleteBuffer(this.buffer);
      this.gl.deleteBuffer(this.reticleBuffer);
      this.gl.deleteBuffer(this.backgroundBuffer);
      this._releaseBackgroundSource();
      this.gl.deleteProgram(this.program);
      this.events = Object.create(null);
    }

    _makeReticle() {
      const reticle = document.createElement('div');
      reticle.className = 'bm-3dxr-reticle';
      reticle.setAttribute('aria-hidden', 'true');
      reticle.textContent = '+';
      const parent = this.canvas.parentElement;
      if (parent) {
        if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
        parent.appendChild(reticle);
      }
      return reticle;
    }

    _pointerDown(event) {
      if (!this.options.desktopLook) return;
      this.audioUnlocked = true;
      this._unlockAudio();
      this._pointer = [event.clientX, event.clientY];
      try { this.canvas.setPointerCapture(event.pointerId); } catch (_) { /* optional */ }
    }
    _pointerMove(event) {
      if (!this._pointer || !this.options.desktopLook) return;
      const dx = event.clientX - this._pointer[0], dy = event.clientY - this._pointer[1];
      this._pointer = [event.clientX, event.clientY];
      this.yaw -= dx * 0.003;
      this.pitch = clamp(this.pitch + dy * 0.003, -1.45, 1.45);
    }
    _pointerUp() { this._pointer = null; }

    _unlockAudio() {
      this.tiles.forEach(tile => {
        tile.video.muted = tile.id !== this.focusedId;
        const play = tile.video.play();
        if (play && typeof play.catch === 'function') play.catch(error => this._emit('autoplayblocked', { id: tile.id, error }));
      });
      if (this.ambient && this.ambient.paused) this.ambient.play().catch(error => this._emit('ambientblocked', { error }));
      if (this.backgroundMode === 'panorama' && this.backgroundSource && this.backgroundSource.tagName &&
          this.backgroundSource.tagName.toLowerCase() === 'video' && this.backgroundSource.paused) {
        const play = this.backgroundSource.play();
        if (play && typeof play.catch === 'function') play.catch(error => this._emit('backgroundblocked', { source: this.backgroundSource.currentSrc, error }));
      }
    }

    _setFocus(id) {
      if (id === this.focusedId) return;
      this.focusedId = id;
      this.tiles.forEach(tile => { tile.video.muted = !this.audioUnlocked || tile.id !== id; });
      this._emit('focuschange', { id, tile: this.tiles.find(tile => tile.id === id) || null });
    }

    _hitTest(origin, direction) {
      let nearest = null, nearestT = Infinity;
      this.tiles.forEach(tile => {
        const yaw = tile.yaw, pitch = tile.pitch;
        const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        const normal = [sy * cp, -sp, cy * cp];
        const denom = direction[0] * normal[0] + direction[1] * normal[1] + direction[2] * normal[2];
        if (Math.abs(denom) < 1e-5) return;
        const delta = [tile.position[0] - origin[0], tile.position[1] - origin[1], tile.position[2] - origin[2]];
        const t = (delta[0] * normal[0] + delta[1] * normal[1] + delta[2] * normal[2]) / denom;
        if (t <= 0 || t >= nearestT) return;
        const hit = [origin[0] + direction[0] * t - tile.position[0], origin[1] + direction[1] * t - tile.position[1], origin[2] + direction[2] * t - tile.position[2]];
        const right = [cy, 0, -sy];
        const up = [sy * sp, cp, cy * sp];
        const x = hit[0] * right[0] + hit[1] * right[1] + hit[2] * right[2];
        const y = hit[0] * up[0] + hit[1] * up[1] + hit[2] * up[2];
        if (Math.abs(x) <= tile.width / 2 && Math.abs(y) <= tile.height / 2) { nearest = tile; nearestT = t; }
      });
      this._setFocus(nearest ? nearest.id : null);
    }

    _drawView(projection, view, eye, direction, viewport, updateFocus) {
      const gl = this.gl;
      if (viewport) gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      this._drawBackground(projection, view, eye);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.positionLoc);
      gl.vertexAttribPointer(this.positionLoc, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(this.uvLoc);
      gl.vertexAttribPointer(this.uvLoc, 2, gl.FLOAT, false, 20, 12);
      gl.uniform1i(this.textureLoc, 0);
      gl.uniform1i(this.solidLoc, 0);
      gl.uniform1i(this.spiralLoc, 0);
      if (updateFocus !== false) this._hitTest(eye, direction);
      this.tiles.forEach(tile => {
        gl.bindTexture(gl.TEXTURE_2D, tile.texture);
        modelMatrix(this.model, tile);
        multiply4(this.mvp, view, this.model);
        multiply4(this.mvp, projection, this.mvp);
        gl.uniformMatrix4fv(this.mvpLoc, false, this.mvp);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      });
      if (updateFocus === false) this._drawReticle();
    }

    _drawBackground(projection, view, eye) {
      if (this.backgroundMode === 'flat') return;
      const gl = this.gl;
      if (this.backgroundMode === 'panorama' && !this.backgroundTexture) return;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.backgroundBuffer);
      gl.enableVertexAttribArray(this.positionLoc);
      gl.vertexAttribPointer(this.positionLoc, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(this.uvLoc);
      gl.vertexAttribPointer(this.uvLoc, 2, gl.FLOAT, false, 20, 12);
      gl.uniform1i(this.solidLoc, 0);
      gl.uniform1i(this.textureLoc, 0);
      gl.uniform1i(this.spiralLoc, this.backgroundMode === 'spiral' ? 1 : 0);
      gl.uniform1f(this.timeLoc, (performance.now() - this.startedAt) / 1000);
      gl.uniform1f(this.spiralSpeedLoc, this.spiralOptions.speed);
      gl.uniform1f(this.spiralTurnsLoc, this.spiralOptions.turns);
      gl.uniform3fv(this.spiralALoc, this.spiralOptions.colors[0]);
      gl.uniform3fv(this.spiralBLoc, this.spiralOptions.colors[1]);
      if (this.backgroundMode === 'panorama') gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
      this.backgroundModel.fill(0);
      this.backgroundModel[0] = this.backgroundModel[5] = this.backgroundModel[10] = this.backgroundModel[15] = 1;
      this.backgroundModel[12] = eye[0]; this.backgroundModel[13] = eye[1]; this.backgroundModel[14] = eye[2];
      multiply4(this.backgroundMvp, view, this.backgroundModel);
      multiply4(this.backgroundMvp, projection, this.backgroundMvp);
      gl.uniformMatrix4fv(this.mvpLoc, false, this.backgroundMvp);
      gl.drawArrays(gl.TRIANGLES, 0, this.backgroundVertexCount);
      gl.enable(gl.DEPTH_TEST);
    }

    _drawReticle() {
      const gl = this.gl;
      gl.disable(gl.DEPTH_TEST);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.reticleBuffer);
      gl.vertexAttribPointer(this.positionLoc, 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(this.uvLoc, 2, gl.FLOAT, false, 20, 12);
      gl.uniform1i(this.solidLoc, 1);
      gl.uniform4f(this.solidColorLoc, 1, 1, 1, 0.92);
      gl.drawArrays(gl.LINES, 0, 4);
      gl.uniform1i(this.solidLoc, 0);
      gl.enable(gl.DEPTH_TEST);
    }

    _updateTextures() {
      const gl = this.gl;
      if (this.backgroundMode === 'panorama' && this.backgroundSource) {
        const source = this.backgroundSource;
        const tag = source.tagName && source.tagName.toLowerCase();
        const ready = tag === 'video' ? (source.readyState >= 2 && source.videoWidth > 0) :
          tag === 'img' ? (source.complete && source.naturalWidth > 0) :
            ((source.width || source.videoWidth || 0) > 0 && (source.height || source.videoHeight || 0) > 0);
        const currentTime = tag === 'video' ? source.currentTime : 0;
        const shouldUpload = tag === 'video' ? currentTime !== this.backgroundUploadedTime :
          tag === 'img' ? this.backgroundUploadedTime < 0 : true;
        if (ready && shouldUpload) {
          gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
          try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            this.backgroundUploadedTime = currentTime;
            this.backgroundUploadFailed = false;
            this._emit('backgroundready', { source: source.currentSrc || source.src || '', type: tag || 'canvas' });
          } catch (error) {
            if (!this.backgroundUploadFailed) this._emit('backgrounderror', { source: source.currentSrc || source.src || '', error });
            this.backgroundUploadFailed = true;
          }
        }
      }
      this.tiles.forEach(tile => {
        const video = tile.video;
        if (video.readyState < 2 || video.videoWidth === 0 ||
            (tile.hasTextureFrame && tile.uploadedTime === video.currentTime)) return;
        gl.bindTexture(gl.TEXTURE_2D, tile.texture);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          tile.uploadedTime = video.currentTime;
          tile.hasTextureFrame = true;
        } catch (error) {
          if (tile.textureErrorSource !== video.currentSrc) {
            tile.textureErrorSource = video.currentSrc;
            this._emit('textureerror', { id: tile.id, error });
          }
        }
      });
    }

    _desktopFrame() {
      if (!this.running || this.xrSession) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
      if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
      const cp = Math.cos(this.pitch);
      const direction = [Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp];
      perspective(this.projectionMatrix, Number(this.options.fov) * Math.PI / 180, width / height, 0.05, 100);
      lookAt(this.viewMatrix, [0, 0, 0], direction);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this._updateTextures();
      this._drawView(this.projectionMatrix, this.viewMatrix, [0, 0, 0], direction, { x: 0, y: 0, width, height });
      this.frameHandle = requestAnimationFrame(this._desktopFrame.bind(this));
    }

    _xrFrame(time, frame) {
      if (!this.running || !this.xrSession) return;
      const pose = frame.getViewerPose(this.referenceSpace);
      if (pose) {
        const transform = pose.transform;
        const p = transform.position;
        const q = transform.orientation;
        const direction = [
          -2 * (q[0] * q[2] + q[3] * q[1]),
          -2 * (q[1] * q[2] - q[3] * q[0]),
          -(1 - 2 * (q[0] * q[0] + q[1] * q[1]))
        ];
        this._hitTest([p.x, p.y, p.z], direction);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.xrLayer.framebuffer);
        this._updateTextures();
        pose.views.forEach(view => {
          const viewport = this.xrLayer.getViewport(view);
          const viewPosition = view.transform.position;
          this._drawView(view.projectionMatrix, view.transform.inverse.matrix,
            [viewPosition.x, viewPosition.y, viewPosition.z], direction, viewport, false);
        });
      }
      this.xrSession.requestAnimationFrame(this._xrFrame.bind(this));
    }

    _onContextLost(event) {
      event.preventDefault();
      this.stop();
      this._emit('contextlost', {});
    }
  }

  return {
    VERSION: '0.1.0',
    create: function (canvas, options) { return new Renderer(canvas, options); },
    isSupported: function () { return typeof document !== 'undefined' && !!(document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')); }
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal['3DXR'];
