/* BareMetal.MusicPlayer — dependency-free playlist and crossfade controller. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.MusicPlayer = (function () {
  'use strict';

  function urlOf(entry) {
    return typeof entry === 'string' ? entry : entry && (entry.src || entry.url || entry.audio) || '';
  }

  class Player {
    constructor(options) {
      this.options = Object.assign({ volume: 0.25, crossfade: 2, repeat: 'all', shuffle: false, crossOrigin: 'anonymous' }, options || {});
      this.playlist = [];
      this.shufflePlayed = new Set();
      this.index = -1;
      this.active = 0;
      this.decks = [new Audio(), new Audio()];
      this.events = Object.create(null);
      this.volume = clamp(this.options.volume);
      this.crossfade = Math.max(0, Number(this.options.crossfade) || 0);
      this.repeat = ['none', 'all', 'one'].includes(this.options.repeat) ? this.options.repeat : 'all';
      this.shuffle = !!this.options.shuffle;
      this.fadeHandle = 0;
      this.destroyed = false;
      this.decks.forEach((audio, deck) => {
        audio.preload = 'auto';
        audio.crossOrigin = this.options.crossOrigin;
        audio.volume = deck === this.active ? this.volume : 0;
        audio.addEventListener('ended', () => { if (deck === this.active) this._ended(); });
        audio.addEventListener('timeupdate', () => { if (deck === this.active) this._emit('timeupdate', this.state()); });
        audio.addEventListener('error', () => this._emit('error', { index: this.index, source: audio.currentSrc, error: audio.error }));
      });
      this._mediaSession();
    }

    on(name, callback) {
      if (typeof callback !== 'function') throw new TypeError('event callback must be a function');
      (this.events[name] || (this.events[name] = new Set())).add(callback);
      return () => this.off(name, callback);
    }
    off(name, callback) { if (this.events[name]) this.events[name].delete(callback); return this; }
    _emit(name, detail) { (this.events[name] || []).forEach(fn => fn(detail)); }

    setPlaylist(entries, options) {
      options = options || {};
      if (!Array.isArray(entries)) throw new TypeError('setPlaylist requires an array');
      this.playlist = entries.slice();
      if (options.shuffle != null) this.shuffle = !!options.shuffle;
      if (options.repeat) this.setRepeat(options.repeat);
      const index = Math.max(0, Math.min(this.playlist.length - 1, Number(options.index) || 0));
      this.shufflePlayed = new Set(this.playlist.length ? [index] : []);
      if (!this.playlist.length) { this.stop(); this.index = -1; return this; }
      this.load(index, { autoplay: !!options.autoplay });
      return this;
    }

    load(index, options) {
      options = options || {};
      if (!Number.isInteger(index) || index < 0 || index >= this.playlist.length) throw new RangeError('playlist index is out of range');
      this._cancelFade();
      if (!options.keepShuffle) this.shufflePlayed = new Set([index]);
      const audio = this.decks[this.active];
      const entry = this.playlist[index], src = urlOf(entry);
      if (!src) throw new TypeError('playlist entry requires a src or url');
      this.decks[1 - this.active].pause();
      this.decks[1 - this.active].removeAttribute('src');
      audio.pause();
      audio.crossOrigin = (entry && entry.crossOrigin) || this.options.crossOrigin;
      audio.src = src;
      audio.volume = this.volume;
      audio.load();
      this.index = index;
      this._updateMediaMetadata(entry);
      this._emit('trackchange', { index, entry, source: src });
      if (options.autoplay) return this.play();
      return this;
    }

    play() {
      if (this.index < 0 && this.playlist.length) this.load(0);
      const audio = this.decks[this.active];
      if (!audio.src) return Promise.resolve(false);
      return audio.play().then(() => { this._emit('play', this.state()); return true; }, error => {
        this._emit('autoplayblocked', { error, index: this.index });
        throw error;
      });
    }

    pause() {
      this.decks.forEach(audio => audio.pause());
      this._cancelFade();
      this._emit('pause', this.state());
      return this;
    }

    stop() {
      this.pause();
      this.decks.forEach(audio => { audio.currentTime = 0; });
      this._emit('stop', this.state());
      return this;
    }

    next(options) {
      options = options || {};
      const nextIndex = this._nextIndex();
      if (nextIndex < 0) { this.stop(); return Promise.resolve(false); }
      if (options.crossfade === false || this.crossfade <= 0) {
        this.load(nextIndex, { keepShuffle: true });
        return this.play();
      }
      return this._crossfadeTo(nextIndex);
    }

    previous() {
      if (this.index <= 0) return this.load(this.playlist.length - 1, { autoplay: true });
      this.load(this.index - 1);
      return this.play();
    }

    seek(seconds) {
      const audio = this.decks[this.active];
      if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, Number(seconds) || 0));
      return this;
    }

    setVolume(value) {
      this.volume = clamp(value);
      this.decks.forEach(audio => { if (audio === this.decks[this.active]) audio.volume = this.volume; });
      this._emit('volumechange', { volume: this.volume });
      return this;
    }

    setCrossfade(seconds) { this.crossfade = Math.max(0, Number(seconds) || 0); return this; }

    setRepeat(mode) {
      if (!['none', 'all', 'one'].includes(mode)) throw new TypeError('repeat must be none, all, or one');
      this.repeat = mode;
      this._emit('modechange', { repeat: this.repeat, shuffle: this.shuffle });
      return this;
    }

    setShuffle(enabled) {
      this.shuffle = !!enabled;
      this._emit('modechange', { repeat: this.repeat, shuffle: this.shuffle });
      return this;
    }

    state() {
      const audio = this.decks[this.active];
      return { index: this.index, entry: this.playlist[this.index] || null, playing: !audio.paused,
        currentTime: audio.currentTime || 0, duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        volume: this.volume, repeat: this.repeat, shuffle: this.shuffle };
    }

    destroy() {
      this.destroyed = true;
      this._cancelFade();
      this.decks.forEach(audio => { audio.pause(); audio.removeAttribute('src'); audio.load(); });
      if (typeof navigator !== 'undefined' && navigator.mediaSession) {
        try { navigator.mediaSession.setActionHandler('play', null); navigator.mediaSession.setActionHandler('pause', null); } catch (_) { /* optional API */ }
      }
      this.events = Object.create(null);
    }

    _ended() {
      if (this.repeat === 'one') { this.seek(0); this.play(); return; }
      const nextIndex = this._nextIndex();
      if (nextIndex < 0) { this._emit('ended', this.state()); return; }
      this.next();
    }

    _nextIndex() {
      if (!this.playlist.length) return -1;
      if (this.shuffle && this.playlist.length > 1) {
        this.shufflePlayed.add(this.index);
        let choices = this.playlist.map((_, index) => index).filter(index => !this.shufflePlayed.has(index));
        if (!choices.length && this.repeat === 'all') {
          this.shufflePlayed = new Set([this.index]);
          choices = this.playlist.map((_, index) => index).filter(index => index !== this.index);
        }
        if (!choices.length) return -1;
        return choices[Math.floor(Math.random() * choices.length)];
      }
      if (this.index + 1 < this.playlist.length) return this.index + 1;
      return this.repeat === 'all' ? 0 : -1;
    }

    _crossfadeTo(index) {
      this._cancelFade();
      const oldDeck = this.active, newDeck = 1 - oldDeck;
      const outgoing = this.decks[oldDeck], incoming = this.decks[newDeck];
      const entry = this.playlist[index], src = urlOf(entry);
      if (!src) return Promise.reject(new TypeError('playlist entry requires a src or url'));
      incoming.pause();
      incoming.crossOrigin = (entry && entry.crossOrigin) || this.options.crossOrigin;
      incoming.src = src;
      incoming.currentTime = 0;
      incoming.volume = 0;
      incoming.load();
      this.index = index;
      this.active = newDeck;
      this._updateMediaMetadata(entry);
      this._emit('trackchange', { index, entry, source: src, crossfade: true });
      return incoming.play().then(() => new Promise(resolve => {
        const start = performance.now(), duration = this.crossfade * 1000;
        const tick = now => {
          if (this.destroyed || this.active !== newDeck) { resolve(false); return; }
          const progress = duration ? Math.min(1, (now - start) / duration) : 1;
          incoming.volume = this.volume * progress;
          outgoing.volume = this.volume * (1 - progress);
          if (progress >= 1) {
            outgoing.pause();
            outgoing.currentTime = 0;
            outgoing.volume = 0;
            incoming.volume = this.volume;
            this.fadeHandle = 0;
            this._emit('crossfadeend', this.state());
            resolve(true);
          } else this.fadeHandle = requestAnimationFrame(tick);
        };
        this.fadeHandle = requestAnimationFrame(tick);
      }), error => {
        this.active = oldDeck;
        this.index = this.playlist.findIndex(item => urlOf(item) === outgoing.currentSrc || urlOf(item) === outgoing.src);
        this._emit('autoplayblocked', { error, index });
        throw error;
      });
    }

    _cancelFade() {
      if (this.fadeHandle) cancelAnimationFrame(this.fadeHandle);
      this.fadeHandle = 0;
      this.decks.forEach((audio, index) => { audio.volume = index === this.active ? this.volume : 0; });
    }

    _mediaSession() {
      if (typeof navigator === 'undefined' || !navigator.mediaSession) return;
      try {
        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
        navigator.mediaSession.setActionHandler('seekto', event => this.seek(event.seekTime));
      } catch (_) { /* optional API */ }
    }

    _updateMediaMetadata(entry) {
      if (typeof navigator === 'undefined' || !navigator.mediaSession || typeof MediaMetadata === 'undefined') return;
      const meta = entry && typeof entry === 'object' ? entry : {};
      try { navigator.mediaSession.metadata = new MediaMetadata({ title: meta.title || urlOf(entry), artist: meta.artist || '', album: meta.album || '' }); }
      catch (_) { /* optional API */ }
    }
  }

  function clamp(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
  return { VERSION: '0.1.0', create: options => new Player(options) };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.MusicPlayer;
