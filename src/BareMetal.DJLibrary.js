/* BareMetal.DJLibrary - IndexedDB-backed DJ track, cue, loop and playlist library. */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.DJLibrary = (function () {
  'use strict';

  function openDatabase(options) {
    options = options || {};
    var databaseName = options.databaseName || 'BareMetalDJ';
    var version = options.version || 1;
    return new Promise(function (resolve, reject) {
      if (!indexedDB) return reject(new Error('IndexedDB is unavailable'));
      var request = indexedDB.open(databaseName, version);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains('tracks')) {
          var tracks = db.createObjectStore('tracks', { keyPath: 'id' });
          tracks.createIndex('title', 'title', { unique: false });
          tracks.createIndex('artist', 'artist', { unique: false });
          tracks.createIndex('bpm', 'bpm', { unique: false });
          tracks.createIndex('key', 'key', { unique: false });
        }
        if (!db.objectStoreNames.contains('cues')) db.createObjectStore('cues', { keyPath: 'trackId' });
        if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('IndexedDB open failed')); };
    });
  }

  function create(options) {
    options = options || {};
    var dbPromise = openDatabase(options);

    function transaction(storeName, mode, action) {
      return dbPromise.then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(storeName, mode);
          var store = tx.objectStore(storeName);
          var request = action(store);
          var result = request;
          tx.oncomplete = function () { resolve(result && result.result !== undefined ? result.result : result); };
          tx.onerror = function () { reject(tx.error || request.error || new Error('IndexedDB transaction failed')); };
        });
      });
    }

    function saveTrack(track) {
      var record = Object.assign({}, track);
      record.id = record.id || record.src || record.url || ('track-' + Date.now());
      record.updatedAt = Date.now();
      return transaction('tracks', 'readwrite', function (store) { return store.put(record); });
    }

    function getTrack(id) {
      return transaction('tracks', 'readonly', function (store) { return store.get(String(id)); });
    }

    function listTracks() {
      return transaction('tracks', 'readonly', function (store) { return store.getAll(); });
    }

    function deleteTrack(id) {
      return transaction('tracks', 'readwrite', function (store) { return store.delete(String(id)); });
    }

    function search(query, filters) {
      query = String(query || '').toLower();
      filters = filters || {};
      return listTracks().then(function (tracks) {
        return tracks.filter(function (track) {
          var text = [track.title, track.artist, track.album, track.genre, track.key, track.tags]
            .concat(track.bpm == null ? '' : String(track.bpm))
            .join(' ').toLower();
          if (query && text.indexOf(query) < 0) return false;
          if (filters.artist && String(track.artist || '').toLower() !== String(filters.artist).toLower()) return false;
          if (filters.genre && String(track.genre || '').toLower() !== String(filters.genre).toLower()) return false;
          if (filters.key && String(track.key || '').toLower() !== String(filters.key).toLower()) return false;
          if (filters.minBpm != null && Number(track.bpm) < Number(filters.minBpm)) return false;
          if (filters.maxBpm != null && Number(track.bpm) > Number(filters.maxBpm)) return false;
          return true;
        });
      });
    }

    function saveCues(trackId, cues) {
      return transaction('cues', 'readwrite', function (store) {
        return store.put({ trackId: String(trackId), hotCues: cues.hotCues || [], loops: cues.loops || [], beatGrid: cues.beatGrid || [], cuePoint: cues.cuePoint || 0, updatedAt: Date.now() });
      });
    }

    function getCues(trackId) {
      return transaction('cues', 'readonly', function (store) { return store.get(String(trackId)); });
    }

    function savePlaylist(id, tracks) {
      return transaction('playlists', 'readwrite', function (store) {
        return store.put({ id: String(id), tracks: tracks || [], updatedAt: Date.now() });
      });
    }

    function getPlaylist(id) {
      return transaction('playlists', 'readonly', function (store) { return store.get(String(id)); });
    }

    function saveSetting(id, value) {
      return transaction('settings', 'readwrite', function (store) { return store.put({ id: String(id), value: value, updatedAt: Date.now() }); });
    }

    function getSetting(id) {
      return transaction('settings', 'readonly', function (store) { return store.get(String(id)); });
    }

    return {
      saveTrack: saveTrack,
      getTrack: getTrack,
      listTracks: listTracks,
      deleteTrack: deleteTrack,
      search: search,
      saveCues: saveCues,
      getCues: getCues,
      savePlaylist: savePlaylist,
      getPlaylist: getPlaylist,
      saveSetting: saveSetting,
      getSetting: getSetting
    };
  }

  return { create: create };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.DJLibrary;
