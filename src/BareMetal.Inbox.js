/* istanbul ignore next */
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
(function(root){
  'use strict';

  root = root || (typeof globalThis !== 'undefined' ? globalThis : this);
  root.BareMetal = root.BareMetal || BareMetal;
  BareMetal = root.BareMetal;

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function noop() {}
  function now() { return Date.now ? Date.now() : new Date().getTime(); }
  function isFiniteNumber(value) { return typeof value === 'number' && isFinite(value); }
  function normalizeChannel(name) { return String(name == null || name === '' ? 'general' : name); }
  function normalizePriority(value) {
    value = String(value == null ? 'normal' : value).toLowerCase();
    return value === 'low' || value === 'high' || value === 'urgent' ? value : 'normal';
  }
  function priorityWeight(value) {
    if (value === 'urgent') return 4;
    if (value === 'high') return 3;
    if (value === 'normal') return 2;
    return 1;
  }
  function assign(a, b) {
    var out = {}, k;
    for (k in (a || {})) if (own(a, k)) out[k] = a[k];
    for (k in (b || {})) if (own(b, k)) out[k] = b[k];
    return out;
  }
  function deepClone(value) {
    var out, i, k;
    if (value == null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) {
      out = [];
      for (i = 0; i < value.length; i++) out.push(deepClone(value[i]));
      return out;
    }
    out = {};
    for (k in value) if (own(value, k)) out[k] = deepClone(value[k]);
    return out;
  }
  function publicItem(item) {
    var out = deepClone(item);
    if (!out) return null;
    delete out._seq;
    return out;
  }
  function snapshotItem(item) {
    var out = publicItem(item);
    out._seq = item && item._seq || 0;
    return out;
  }
  function toTimestamp(value) {
    var parsed;
    if (value instanceof Date) {
      parsed = value.getTime();
      return isFinite(parsed) ? parsed : null;
    }
    if (isFiniteNumber(value)) return value;
    if (typeof value === 'string' && value) {
      parsed = Date.parse(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }
  function parseClock(value) {
    var parts, h, m;
    if (typeof value !== 'string' || value.indexOf(':') < 0) return null;
    parts = value.split(':');
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }
  function defaultChannelPrefs() {
    return { enabled: true, sound: true, badge: true };
  }
  function defaultPreferences() {
    return { channels: {}, quiet: null, maxPerMinute: 10 };
  }
  function mergePreferences(base, update) {
    var out = deepClone(base || defaultPreferences());
    var source = update || {};
    var key;
    out.channels = out.channels || {};
    if (source.channels && typeof source.channels === 'object') {
      for (key in source.channels) if (own(source.channels, key)) {
        out.channels[normalizeChannel(key)] = assign(defaultChannelPrefs(), assign(out.channels[normalizeChannel(key)] || {}, source.channels[key] || {}));
      }
    }
    if (own(source, 'quiet')) {
      out.quiet = source.quiet ? {
        from: source.quiet.from == null ? null : String(source.quiet.from),
        to: source.quiet.to == null ? null : String(source.quiet.to)
      } : null;
    }
    if (own(source, 'maxPerMinute')) {
      out.maxPerMinute = source.maxPerMinute == null ? 0 : Math.max(0, parseInt(source.maxPerMinute, 10) || 0);
    }
    return out;
  }
  function normalizeAction(action) {
    if (!action || typeof action !== 'object') return null;
    return {
      label: action.label == null ? '' : String(action.label),
      url: action.url == null ? '' : String(action.url)
    };
  }
  function normalizeChannelMeta(name, opts) {
    var out = assign({ name: normalizeChannel(name), icon: null, color: null, muted: false }, opts || {});
    out.name = normalizeChannel(out.name);
    out.muted = !!out.muted;
    return out;
  }
  function normalizeNotification(notification, seqValue) {
    var source = notification || {};
    return {
      id: source.id == null ? null : String(source.id),
      channel: normalizeChannel(source.channel),
      title: source.title == null ? '' : String(source.title),
      body: source.body == null ? '' : String(source.body),
      data: source.data == null ? null : deepClone(source.data),
      priority: normalizePriority(source.priority),
      action: normalizeAction(source.action),
      icon: source.icon == null ? null : String(source.icon),
      group: source.group == null ? null : String(source.group),
      read: !!source.read,
      timestamp: toTimestamp(source.timestamp) || now(),
      dismissed: !!source.dismissed,
      pinned: !!source.pinned,
      _seq: isFiniteNumber(source._seq) ? source._seq : (seqValue || 0)
    };
  }
  function compareItems(a, b) {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    if (priorityWeight(a.priority) !== priorityWeight(b.priority)) return priorityWeight(b.priority) - priorityWeight(a.priority);
    if ((a.timestamp || 0) !== (b.timestamp || 0)) return (b.timestamp || 0) - (a.timestamp || 0);
    return (b._seq || 0) - (a._seq || 0);
  }
  function createPersistence(mode, key) {
    var storage = null;
    if (mode === 'localStorage') {
      try { storage = root && root.localStorage ? root.localStorage : null; }
      catch (_) { storage = null; }
    }
    return {
      load: function() {
        var raw;
        if (!storage) return null;
        try {
          raw = storage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        } catch (_) {
          return null;
        }
      },
      save: function(snapshot) {
        if (!storage) return;
        try { storage.setItem(key, JSON.stringify(snapshot)); } catch (_) {}
      }
    };
  }
  function create(opts) {
    var config = assign({
      maxItems: 1000,
      persist: 'memory',
      key: 'BareMetal.Inbox',
      channels: [],
      onNew: null,
      onRead: null
    }, opts || {});
    var persistence = createPersistence(config.persist, config.key || 'BareMetal.Inbox');
    var state = {
      items: [],
      map: {},
      channels: {},
      prefs: defaultPreferences(),
      seq: 0,
      pushTimes: []
    };
    var anySubscribers = [];
    var channelSubscribers = {};
    var readSubscribers = [];
    var api;

    function trimPushTimes(at) {
      var cutoff = at - 60000;
      while (state.pushTimes.length && state.pushTimes[0] <= cutoff) state.pushTimes.shift();
    }
    function channelPrefs(channel) {
      return assign(defaultChannelPrefs(), state.prefs.channels[normalizeChannel(channel)] || {});
    }
    function ensureChannel(name) {
      name = normalizeChannel(name);
      if (!state.channels[name]) state.channels[name] = normalizeChannelMeta(name, {});
      return state.channels[name];
    }
    function save() {
      persistence.save(exportData());
    }
    function addItem(item) {
      state.items.push(item);
      state.map[item.id] = item;
      ensureChannel(item.channel);
      if ((item._seq || 0) > state.seq) state.seq = item._seq;
    }
    function rebuildMap() {
      var next = {}, i;
      for (i = 0; i < state.items.length; i++) next[state.items[i].id] = state.items[i];
      state.map = next;
    }
    function nextId() {
      state.seq += 1;
      return 'inbox_' + now().toString(36) + '_' + state.seq.toString(36);
    }
    function trimItems() {
      var limit = parseInt(config.maxItems, 10);
      var i, candidateIndex, candidate;
      if (!limit || limit < 1) return;
      while (state.items.length > limit) {
        candidateIndex = -1;
        candidate = null;
        for (i = 0; i < state.items.length; i++) {
          if (state.items[i].pinned) continue;
          if (!candidate || state.items[i].timestamp < candidate.timestamp || (state.items[i].timestamp === candidate.timestamp && state.items[i]._seq < candidate._seq)) {
            candidate = state.items[i];
            candidateIndex = i;
          }
        }
        if (candidateIndex < 0) {
          for (i = 0; i < state.items.length; i++) {
            if (!candidate || state.items[i].timestamp < candidate.timestamp || (state.items[i].timestamp === candidate.timestamp && state.items[i]._seq < candidate._seq)) {
              candidate = state.items[i];
              candidateIndex = i;
            }
          }
        }
        if (candidateIndex < 0) break;
        delete state.map[state.items[candidateIndex].id];
        state.items.splice(candidateIndex, 1);
      }
    }
    function inQuietHours(at) {
      var quiet = state.prefs.quiet;
      var from;
      var to;
      var d;
      var minutes;
      if (!quiet || !quiet.from || !quiet.to) return false;
      from = parseClock(quiet.from);
      to = parseClock(quiet.to);
      if (from == null || to == null || from === to) return false;
      d = new Date(at == null ? now() : at);
      minutes = d.getHours() * 60 + d.getMinutes();
      if (from < to) return minutes >= from && minutes < to;
      return minutes >= from || minutes < to;
    }
    function canTrigger(channel, at) {
      var prefs = channelPrefs(channel);
      var limit = parseInt(state.prefs.maxPerMinute, 10) || 0;
      if (prefs.enabled === false) return false;
      if (state.channels[channel] && state.channels[channel].muted) return false;
      if (inQuietHours(at)) return false;
      trimPushTimes(at);
      state.pushTimes.push(at);
      return !limit || state.pushTimes.length <= limit;
    }
    function notifyRead(item) {
      var payload = publicItem(item);
      var i;
      for (i = 0; i < readSubscribers.length; i++) {
        try { readSubscribers[i](payload); } catch (_) {}
      }
    }
    function emitNew(item) {
      var payload = publicItem(item);
      var list = (channelSubscribers[item.channel] || []).slice();
      var all = anySubscribers.slice();
      var i;
      for (i = 0; i < list.length; i++) {
        try { list[i](payload); } catch (_) {}
      }
      if (!canTrigger(item.channel, item.timestamp)) return;
      for (i = 0; i < all.length; i++) {
        try { all[i](payload); } catch (_) {}
      }
    }
    function listInternal(filter) {
      var out = [];
      var i;
      for (i = 0; i < state.items.length; i++) if (!filter || filter(state.items[i])) out.push(state.items[i]);
      return out.sort(compareItems);
    }
    function applyChannels(list) {
      var i;
      var entry;
      if (!Array.isArray(list)) return;
      for (i = 0; i < list.length; i++) {
        entry = list[i];
        if (typeof entry === 'string') addChannel(entry);
        else if (entry && typeof entry === 'object') addChannel(entry.name, entry);
      }
    }
    function hydrate(snapshot) {
      var data = snapshot || {};
      var list = Array.isArray(data.items) ? data.items : [];
      var channels = data.channels || {};
      var i, key, item;
      state.items = [];
      state.map = {};
      state.channels = {};
      state.seq = 0;
      state.pushTimes = [];
      state.prefs = mergePreferences(defaultPreferences(), data.preferences || data.prefs || {});
      if (Array.isArray(channels)) {
        for (i = 0; i < channels.length; i++) if (channels[i]) addChannel(channels[i].name, channels[i]);
      } else {
        for (key in channels) if (own(channels, key)) addChannel(key, channels[key]);
      }
      for (i = 0; i < list.length; i++) {
        item = normalizeNotification(list[i], i + 1);
        if (!item.id) item.id = 'inbox_import_' + (i + 1);
        addItem(item);
      }
      if (isFiniteNumber(data.seq)) state.seq = Math.max(state.seq, data.seq);
      trimItems();
      rebuildMap();
    }
    function exportData() {
      var items = [];
      var channels = {};
      var i;
      var key;
      for (i = 0; i < state.items.length; i++) items.push(snapshotItem(state.items[i]));
      for (key in state.channels) if (own(state.channels, key)) channels[key] = deepClone(state.channels[key]);
      return {
        version: 1,
        items: items,
        channels: channels,
        preferences: deepClone(state.prefs),
        seq: state.seq,
        maxItems: parseInt(config.maxItems, 10) || 0,
        persist: config.persist,
        key: config.key
      };
    }
    function addChannel(name, opts) {
      var channel = normalizeChannel(name || (opts && opts.name));
      state.channels[channel] = normalizeChannelMeta(channel, assign(state.channels[channel] || {}, opts || {}));
      save();
    }
    function push(notification) {
      var item = normalizeNotification(notification, state.seq + 1);
      item.id = item.id || nextId();
      addItem(item);
      trimItems();
      rebuildMap();
      save();
      emitNew(item);
      return publicItem(item);
    }
    function markRead(id) {
      var item = state.map[id];
      if (!item || item.read) return;
      item.read = true;
      save();
      notifyRead(item);
    }
    function markAllRead(channel) {
      var name = channel == null ? null : normalizeChannel(channel);
      var i;
      for (i = 0; i < state.items.length; i++) {
        if (name && state.items[i].channel !== name) continue;
        if (!state.items[i].read) {
          state.items[i].read = true;
          notifyRead(state.items[i]);
        }
      }
      save();
    }
    function dismiss(id) {
      var item = state.map[id];
      if (!item || item.dismissed) return;
      item.dismissed = true;
      save();
    }
    function dismissAll(channel) {
      var name = channel == null ? null : normalizeChannel(channel);
      var i;
      for (i = 0; i < state.items.length; i++) {
        if (name && state.items[i].channel !== name) continue;
        state.items[i].dismissed = true;
      }
      save();
    }
    function all(options) {
      var opts = options || {};
      var since = own(opts, 'since') ? toTimestamp(opts.since) : null;
      var limit = own(opts, 'limit') ? Math.max(0, parseInt(opts.limit, 10) || 0) : 0;
      var offset = own(opts, 'offset') ? Math.max(0, parseInt(opts.offset, 10) || 0) : 0;
      var list = listInternal(function(item) {
        if (!own(opts, 'dismissed') && item.dismissed) return false;
        if (own(opts, 'dismissed') && !!item.dismissed !== !!opts.dismissed) return false;
        if (own(opts, 'channel') && normalizeChannel(opts.channel) !== item.channel) return false;
        if (own(opts, 'read') && !!opts.read !== !!item.read) return false;
        if (own(opts, 'priority') && normalizePriority(opts.priority) !== item.priority) return false;
        if (own(opts, 'group') && String(opts.group) !== String(item.group)) return false;
        if (since != null && item.timestamp < since) return false;
        return true;
      });
      if (offset) list = list.slice(offset);
      if (limit) list = list.slice(0, limit);
      return list.map(publicItem);
    }
    function unread(channel) {
      var opts = { read: false };
      if (channel != null) opts.channel = channel;
      return all(opts);
    }
    function unreadCount(channel) {
      return unread(channel).length;
    }
    function get(id) {
      return state.map[id] ? publicItem(state.map[id]) : null;
    }
    function listChannels() {
      var counts = {};
      var out = [];
      var i;
      var key;
      for (key in state.channels) if (own(state.channels, key)) counts[key] = { name: key, unread: 0, total: 0 };
      for (i = 0; i < state.items.length; i++) {
        key = state.items[i].channel;
        counts[key] = counts[key] || { name: key, unread: 0, total: 0 };
        if (state.items[i].dismissed) continue;
        counts[key].total += 1;
        if (!state.items[i].read) counts[key].unread += 1;
      }
      for (key in counts) if (own(counts, key)) out.push(counts[key]);
      return out.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
    }
    function mute(channel) {
      ensureChannel(channel).muted = true;
      save();
    }
    function unmute(channel) {
      ensureChannel(channel).muted = false;
      save();
    }
    function preferences(prefs) {
      if (prefs == null) return deepClone(state.prefs);
      state.prefs = mergePreferences(state.prefs, prefs);
      save();
      return deepClone(state.prefs);
    }
    function subscribe(channel, callback) {
      var name = normalizeChannel(channel);
      var list;
      if (typeof callback !== 'function') return noop;
      ensureChannel(name);
      list = channelSubscribers[name] = channelSubscribers[name] || [];
      list.push(callback);
      return function() {
        var i;
        for (i = list.length - 1; i >= 0; i--) if (list[i] === callback) list.splice(i, 1);
      };
    }
    function onNew(callback) {
      if (typeof callback !== 'function') return noop;
      anySubscribers.push(callback);
      return function() {
        var i;
        for (i = anySubscribers.length - 1; i >= 0; i--) if (anySubscribers[i] === callback) anySubscribers.splice(i, 1);
      };
    }
    function group(groupId) {
      return all({ group: groupId });
    }
    function collapse(groupId) {
      var items = listInternal(function(item) {
        return !item.dismissed && String(item.group) === String(groupId);
      });
      var channels = {};
      var highest = 'low';
      var newest = 0;
      var unreadTotal = 0;
      var i;
      var names = [];
      if (!items.length) return null;
      for (i = 0; i < items.length; i++) {
        if (priorityWeight(items[i].priority) > priorityWeight(highest)) highest = items[i].priority;
        if (items[i].timestamp > newest) newest = items[i].timestamp;
        if (!items[i].read) unreadTotal += 1;
        if (!channels[items[i].channel]) {
          channels[items[i].channel] = true;
          names.push(items[i].channel);
        }
      }
      return {
        id: 'group:' + String(groupId),
        channel: names.length === 1 ? names[0] : 'multiple',
        title: items[0].title || String(groupId),
        body: items.length + ' notifications' + (unreadTotal ? ' (' + unreadTotal + ' unread)' : ''),
        data: { group: String(groupId), count: items.length, unread: unreadTotal, channels: names.slice() },
        priority: highest,
        action: null,
        icon: items[0].icon || null,
        group: String(groupId),
        read: unreadTotal === 0,
        timestamp: newest,
        dismissed: false,
        pinned: items[0].pinned || false,
        summary: true,
        items: items.map(publicItem)
      };
    }
    function clear(options) {
      var opts = options || {};
      var olderThan = own(opts, 'olderThan') ? toTimestamp(opts.olderThan) : null;
      var hasFilters = own(opts, 'olderThan') || own(opts, 'channel') || own(opts, 'read');
      var next = [];
      var i;
      function keep(item) {
        var match = true;
        if (olderThan != null) match = match && item.timestamp < olderThan;
        if (own(opts, 'channel')) match = match && item.channel === normalizeChannel(opts.channel);
        if (own(opts, 'read')) match = match && item.read === !!opts.read;
        return !match;
      }
      if (!hasFilters) {
        state.items = [];
        state.map = {};
        save();
        return;
      }
      for (i = 0; i < state.items.length; i++) if (keep(state.items[i])) next.push(state.items[i]);
      state.items = next;
      rebuildMap();
      save();
    }
    function importData(data) {
      hydrate(data || {});
      applyChannels(config.channels);
      save();
    }
    function badge() {
      var result = { count: 0, channels: {} };
      var counts = listChannels();
      var i;
      var prefs;
      for (i = 0; i < counts.length; i++) {
        prefs = channelPrefs(counts[i].name);
        result.channels[counts[i].name] = (prefs.enabled === false || prefs.badge === false) ? 0 : counts[i].unread;
        result.count += result.channels[counts[i].name];
      }
      return result;
    }
    function sound(channel) {
      var name = channel == null ? null : normalizeChannel(channel);
      var prefs = name ? channelPrefs(name) : defaultChannelPrefs();
      if (inQuietHours(now())) return false;
      if (!name) return true;
      if (prefs.enabled === false || prefs.sound === false) return false;
      if (state.channels[name] && state.channels[name].muted) return false;
      return true;
    }
    function search(query) {
      var needle = String(query == null ? '' : query).toLowerCase().trim();
      if (!needle) return all();
      return all().filter(function(item) {
        return (item.title || '').toLowerCase().indexOf(needle) > -1 || (item.body || '').toLowerCase().indexOf(needle) > -1;
      });
    }
    function pin(id) {
      var item = state.map[id];
      if (!item || item.pinned) return;
      item.pinned = true;
      save();
    }
    function unpin(id) {
      var item = state.map[id];
      if (!item || !item.pinned) return;
      item.pinned = false;
      save();
    }

    if (typeof config.onNew === 'function') anySubscribers.push(config.onNew);
    if (typeof config.onRead === 'function') readSubscribers.push(config.onRead);
    hydrate(persistence.load() || {});
    applyChannels(config.channels);
    save();

    api = {
      push: push,
      markRead: markRead,
      markAllRead: markAllRead,
      dismiss: dismiss,
      dismissAll: dismissAll,
      unread: unread,
      unreadCount: unreadCount,
      all: all,
      get: get,
      channels: listChannels,
      addChannel: addChannel,
      mute: mute,
      unmute: unmute,
      preferences: preferences,
      subscribe: subscribe,
      onNew: onNew,
      group: group,
      collapse: collapse,
      clear: clear,
      export: exportData,
      import: importData,
      badge: badge,
      sound: sound,
      search: search,
      pin: pin,
      unpin: unpin
    };
    return api;
  }

  BareMetal.Inbox = { create: create };
  if (typeof module !== 'undefined' && module.exports) module.exports = BareMetal.Inbox;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
