var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Capabilities = (function(){
  'use strict';

  var root = (typeof window !== 'undefined' && window) ? window : ((typeof globalThis !== 'undefined' && globalThis) ? globalThis : this);
  var custom = {};
  var watchers = [];
  var teardown = [];
  var batteryState = { level: null, charging: null };
  var batteryPromise = null;
  var api;

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function arr(v) { return Array.isArray(v) ? v : (v == null ? [] : [v]); }
  function lower(v) { return String(v == null ? '' : v).toLowerCase(); }
  function safe(fn, fallback) { try { return fn(); } catch (_) { return fallback; } }
  function normalizeFeature(name) { return lower(name).replace(/[\s_-]+/g, ''); }
  function getNavigator() { return (root && root.navigator) || (typeof navigator !== 'undefined' ? navigator : null); }
  function getDocument() { return (root && root.document) || (typeof document !== 'undefined' ? document : null); }
  function getScreen() { return (root && root.screen) || (typeof screen !== 'undefined' ? screen : null); }
  function getConnection() {
    var nav = getNavigator();
    return nav && (nav.connection || nav.mozConnection || nav.webkitConnection) || null;
  }
  function getUserAgent() {
    var nav = getNavigator();
    return nav && nav.userAgent ? String(nav.userAgent) : '';
  }
  function getMatchMedia() {
    return root && typeof root.matchMedia === 'function' ? root.matchMedia : null;
  }
  function queryMedia(q) {
    var mm = getMatchMedia();
    return mm ? safe(function() { return mm.call(root, q); }, null) : null;
  }
  function mediaMatches(q) {
    var m = queryMedia(q);
    return !!(m && m.matches);
  }
  function createCanvas() {
    var doc = getDocument();
    return doc && doc.createElement ? safe(function() { return doc.createElement('canvas'); }, null) : null;
  }
  function getWebGLContext() {
    var canvas = createCanvas();
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    return safe(function() { return canvas.getContext('webgl') || canvas.getContext('experimental-webgl'); }, null);
  }
  function getGPUInfo() {
    var gl = getWebGLContext();
    var ext;
    if (!gl || typeof gl.getParameter !== 'function') return null;
    ext = safe(function() { return gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info'); }, null);
    if (ext && ext.UNMASKED_RENDERER_WEBGL != null) {
      return safe(function() { return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL); }, null) || safe(function() { return gl.getParameter(ext.UNMASKED_VENDOR_WEBGL); }, null);
    }
    return gl.RENDERER != null ? safe(function() { return gl.getParameter(gl.RENDERER); }, null) : null;
  }
  function touchSupported() {
    var nav = getNavigator();
    return !!((nav && nav.maxTouchPoints > 0) || (root && typeof root.ontouchstart !== 'undefined') || mediaMatches('(pointer: coarse)'));
  }
  function parseBrowser() {
    var ua = getUserAgent();
    var out = { browser: 'Unknown', version: '' };
    var match;
    if (!ua) return out;
    if ((match = ua.match(/Edg\/([\d.]+)/))) return { browser: 'Edge', version: match[1] };
    if ((match = ua.match(/OPR\/([\d.]+)/))) return { browser: 'Opera', version: match[1] };
    if ((match = ua.match(/Chrome\/([\d.]+)/))) return { browser: 'Chrome', version: match[1] };
    if ((match = ua.match(/Firefox\/([\d.]+)/))) return { browser: 'Firefox', version: match[1] };
    if (/Safari\//.test(ua) && (match = ua.match(/Version\/([\d.]+)/))) return { browser: 'Safari', version: match[1] };
    if ((match = ua.match(/MSIE\s([\d.]+)/))) return { browser: 'IE', version: match[1] };
    if ((match = ua.match(/Trident\/.*rv:([\d.]+)/))) return { browser: 'IE', version: match[1] };
    return out;
  }
  function parseOS() {
    var ua = getUserAgent();
    if (/Windows NT/i.test(ua)) return 'Windows';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Unknown';
  }
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(getUserAgent());
  }
  function getMemory() {
    var nav = getNavigator();
    var perf = root && root.performance;
    if (nav && nav.deviceMemory != null) return +nav.deviceMemory;
    if (perf && perf.memory && perf.memory.jsHeapSizeLimit != null) {
      return Math.round((perf.memory.jsHeapSizeLimit / 1073741824) * 10) / 10;
    }
    return null;
  }
  function normalizeState(state) {
    state = lower(state);
    if (state === 'granted' || state === 'denied' || state === 'prompt') return state;
    return state === 'default' ? 'prompt' : 'prompt';
  }
  function normalizePermissionName(name) {
    var map = {
      notification: 'notifications',
      notifications: 'notifications',
      clipboard: 'clipboard-read',
      clipboardread: 'clipboard-read',
      clipboardwrite: 'clipboard-write',
      geo: 'geolocation',
      geolocation: 'geolocation',
      mic: 'microphone',
      microphone: 'microphone',
      camera: 'camera'
    };
    var key = normalizeFeature(name);
    return map[key] || lower(name);
  }
  function collectFeatures(levels) {
    var out = [];
    var seen = {};
    var i, j, req;
    for (i = 0; i < (levels || []).length; i++) {
      req = arr(levels[i] && levels[i].requires);
      for (j = 0; j < req.length; j++) {
        if (!seen[req[j]]) {
          seen[req[j]] = true;
          out.push(req[j]);
        }
      }
    }
    return out;
  }
  function availabilityMap(available, features) {
    var map = {};
    var i, key, wanted;
    if (!available) return detectAll(features || []);
    if (Array.isArray(available)) {
      wanted = {};
      for (i = 0; i < available.length; i++) wanted[normalizeFeature(available[i])] = true;
      for (i = 0; i < (features || available).length; i++) {
        key = features && features[i] != null ? features[i] : available[i];
        map[key] = !!wanted[normalizeFeature(key)];
      }
      return map;
    }
    if (typeof available === 'object') {
      for (key in available) if (own(available, key)) map[key] = !!available[key];
      if (features) for (i = 0; i < features.length; i++) if (!own(map, features[i])) map[features[i]] = detect(features[i]);
      return map;
    }
    return detectAll(features || []);
  }
  function isOptionSupported(option) {
    if (option == null) return false;
    if (typeof option === 'string') return detect(option);
    if (typeof option === 'function' && option.feature) return detect(option.feature);
    if (typeof option === 'object' && option.feature) return detect(option.feature);
    if (typeof option === 'object' && typeof option.detect === 'function') return !!safe(function() { return option.detect(api); }, false);
    if (typeof option === 'object' && typeof option.test === 'function') return !!safe(function() { return option.test(api); }, false);
    if (typeof option === 'object' && own(option, 'supported')) return !!option.supported;
    return true;
  }
  function resolveOption(option) {
    if (!isOptionSupported(option)) return { supported: false, value: null };
    if (option && typeof option === 'object') {
      if (own(option, 'value')) return { supported: true, value: option.value };
      if (own(option, 'use')) return { supported: true, value: option.use };
    }
    return { supported: true, value: option };
  }
  function ensureBattery() {
    var nav = getNavigator();
    if (batteryPromise || !nav || typeof nav.getBattery !== 'function') return batteryPromise;
    batteryPromise = Promise.resolve().then(function() {
      return nav.getBattery();
    }).then(function(battery) {
      function update() {
        batteryState.level = battery && battery.level != null ? battery.level : null;
        batteryState.charging = battery && battery.charging != null ? !!battery.charging : null;
      }
      if (!battery) return null;
      update();
      if (typeof battery.addEventListener === 'function') {
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
      }
      return battery;
    }).catch(function() { return null; });
    return batteryPromise;
  }
  function featureChecks() {
    var nav = getNavigator();
    return {
      canvas: function() {
        var canvas = createCanvas();
        return !!(canvas && typeof canvas.getContext === 'function');
      },
      clipboard: function() { return !!(nav && nav.clipboard); },
      geolocation: function() { return !!(nav && nav.geolocation && typeof nav.geolocation.getCurrentPosition === 'function'); },
      webgl: function() { return !!getWebGLContext(); },
      webgpu: function() { return !!(nav && nav.gpu); },
      serviceworker: function() { return !!(nav && nav.serviceWorker); },
      indexeddb: function() { return !!((root && root.indexedDB) || (typeof indexedDB !== 'undefined' && indexedDB)); },
      websocket: function() { return !!(root && root.WebSocket); },
      fetch: function() { return !!(root && typeof root.fetch === 'function'); },
      crypto: function() { return !!(root && root.crypto); },
      speechrecognition: function() { return !!(root && (root.SpeechRecognition || root.webkitSpeechRecognition)); },
      speechsynthesis: function() { return !!(root && root.speechSynthesis); },
      gamepad: function() { return !!(nav && typeof nav.getGamepads === 'function'); },
      mediadevices: function() { return !!(nav && nav.mediaDevices); },
      notifications: function() { return !!(root && root.Notification); },
      payment: function() { return !!(root && root.PaymentRequest); },
      bluetooth: function() { return !!(nav && nav.bluetooth); },
      usb: function() { return !!(nav && nav.usb); },
      serial: function() { return !!(nav && nav.serial); },
      hid: function() { return !!(nav && nav.hid); },
      share: function() { return !!(nav && typeof nav.share === 'function'); },
      wakelock: function() { return !!(nav && nav.wakeLock && typeof nav.wakeLock.request === 'function'); },
      vibration: function() { return !!(nav && typeof nav.vibrate === 'function'); },
      permissions: function() { return !!(nav && nav.permissions && typeof nav.permissions.query === 'function'); },
      battery: function() { return !!(nav && typeof nav.getBattery === 'function'); }
    };
  }
  function detect(feature) {
    var checks = featureChecks();
    var key = normalizeFeature(feature);
    if (own(custom, key)) return !!safe(function() { return custom[key](api); }, false);
    if (own(checks, key)) return !!safe(checks[key], false);
    return false;
  }
  function detectAll(features) {
    var list = arr(features);
    var out = {};
    var checks = featureChecks();
    var key;
    if (!list.length) {
      for (key in checks) if (own(checks, key)) out[key] = detect(key);
      for (key in custom) if (own(custom, key)) out[key] = detect(key);
      return out;
    }
    for (key = 0; key < list.length; key++) out[list[key]] = detect(list[key]);
    return out;
  }
  function profile() {
    var browser = parseBrowser();
    var screen = getScreen();
    var connection = getConnection();
    var nav = getNavigator();
    ensureBattery();
    return {
      browser: browser.browser,
      version: browser.version,
      os: parseOS(),
      mobile: isMobile(),
      touch: touchSupported(),
      screen: {
        width: screen && screen.width != null ? screen.width : null,
        height: screen && screen.height != null ? screen.height : null,
        dpr: root && root.devicePixelRatio != null ? root.devicePixelRatio : 1,
        colorDepth: screen && screen.colorDepth != null ? screen.colorDepth : null
      },
      connection: {
        type: connection ? (connection.effectiveType || connection.type || null) : null,
        downlink: connection && connection.downlink != null ? connection.downlink : null,
        saveData: !!(connection && connection.saveData)
      },
      memory: getMemory(),
      cores: nav && nav.hardwareConcurrency != null ? nav.hardwareConcurrency : null,
      gpu: getGPUInfo(),
      language: nav ? (nav.language || (nav.languages && nav.languages[0]) || null) : null,
      timezone: safe(function() { return Intl.DateTimeFormat().resolvedOptions().timeZone; }, null),
      darkMode: mediaMatches('(prefers-color-scheme: dark)'),
      reducedMotion: mediaMatches('(prefers-reduced-motion: reduce)'),
      prefersContrast: mediaMatches('(prefers-contrast: more)')
    };
  }
  function supports(feature, fallbackValue) {
    if (detect(feature)) return true;
    if (arguments.length < 2) return false;
    if (typeof fallbackValue === 'function' && !fallbackValue.feature) return fallbackValue();
    return fallback(fallbackValue);
  }
  function fallback() {
    var options = Array.prototype.slice.call(arguments);
    var i, candidate;
    for (i = 0; i < options.length; i++) {
      candidate = resolveOption(options[i]);
      if (candidate.supported) return candidate.value;
    }
    return null;
  }
  function permission(name) {
    var nav = getNavigator();
    var key = normalizePermissionName(name);
    if (key === 'notifications' && root && root.Notification) {
      return Promise.resolve(normalizeState(root.Notification.permission));
    }
    if (nav && nav.permissions && typeof nav.permissions.query === 'function') {
      return Promise.resolve().then(function() {
        return nav.permissions.query({ name: key });
      }).then(function(result) {
        return normalizeState(result && result.state);
      }).catch(function() {
        return 'prompt';
      });
    }
    return Promise.resolve('prompt');
  }
  function requestPermission(name) {
    var nav = getNavigator();
    var key = normalizePermissionName(name);
    if (key === 'notifications' && root && root.Notification) {
      if (typeof root.Notification.requestPermission === 'function') {
        return Promise.resolve(root.Notification.requestPermission()).then(function(state) {
          return normalizeState(state) === 'granted' ? 'granted' : 'denied';
        });
      }
      return Promise.resolve(root.Notification.permission === 'granted' ? 'granted' : 'denied');
    }
    if (key === 'geolocation' && nav && nav.geolocation && typeof nav.geolocation.getCurrentPosition === 'function') {
      return new Promise(function(resolve) {
        nav.geolocation.getCurrentPosition(function() { resolve('granted'); }, function() { resolve('denied'); });
      });
    }
    if ((key === 'camera' || key === 'microphone') && nav && nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function') {
      return nav.mediaDevices.getUserMedia(key === 'camera' ? { video: true } : { audio: true }).then(function(stream) {
        var tracks = stream && typeof stream.getTracks === 'function' ? stream.getTracks() : [];
        var i;
        for (i = 0; i < tracks.length; i++) if (tracks[i] && typeof tracks[i].stop === 'function') tracks[i].stop();
        return 'granted';
      }).catch(function() {
        return 'denied';
      });
    }
    return permission(name).then(function(state) {
      return state === 'granted' ? 'granted' : 'denied';
    });
  }
  function register(name, detectFn) {
    if (typeof detectFn === 'function') custom[normalizeFeature(name)] = detectFn;
    return api;
  }
  function requireFeatures(features) {
    var list = arr(features);
    var result = { supported: [], missing: [], ok: true };
    var i;
    for (i = 0; i < list.length; i++) {
      if (detect(list[i])) result.supported.push(list[i]);
      else result.missing.push(list[i]);
    }
    result.ok = !result.missing.length;
    return result;
  }
  function degrade(features, levels) {
    var list = levels;
    var available = features;
    var i, j, level, req, missing;
    if (!Array.isArray(levels) && Array.isArray(features) && features.length && typeof features[0] === 'object') {
      list = features;
      available = null;
    }
    list = Array.isArray(list) ? list : [];
    if (Array.isArray(available)) available = detectAll(available);
    else available = availabilityMap(available, collectFeatures(list));
    for (i = 0; i < list.length; i++) {
      level = list[i] || {};
      req = arr(level.requires);
      missing = [];
      for (j = 0; j < req.length; j++) if (!available[req[j]]) missing.push(req[j]);
      if (!missing.length) return { name: level.name || ('level-' + i), requires: req.slice(), missing: [], ok: true };
    }
    if (!list.length) return null;
    level = list[list.length - 1] || {};
    req = arr(level.requires);
    missing = [];
    for (j = 0; j < req.length; j++) if (!available[req[j]]) missing.push(req[j]);
    return { name: level.name || ('level-' + (list.length - 1)), requires: req.slice(), missing: missing, ok: !missing.length };
  }
  function emitChange(type, event) {
    var snapshot = profile();
    var list = watchers.slice();
    var i;
    for (i = 0; i < list.length; i++) {
      try { list[i](snapshot, { type: type, event: event || null }); } catch (_) {}
    }
  }
  function addManagedListener(target, eventName, handler) {
    if (!target || typeof handler !== 'function') return;
    if (typeof target.addEventListener === 'function') {
      target.addEventListener(eventName, handler);
      teardown.push(function() { safe(function() { target.removeEventListener(eventName, handler); }); });
      return;
    }
    if (typeof target.addListener === 'function') {
      target.addListener(handler);
      teardown.push(function() { safe(function() { target.removeListener(handler); }); });
    }
  }
  function attachWatchers() {
    var connection = getConnection();
    var dark = queryMedia('(prefers-color-scheme: dark)');
    var motion = queryMedia('(prefers-reduced-motion: reduce)');
    var contrast = queryMedia('(prefers-contrast: more)');
    if (teardown.length) return;
    addManagedListener(connection, 'change', function(ev) { emitChange('connection', ev); });
    addManagedListener(dark, 'change', function(ev) { emitChange('darkMode', ev); });
    addManagedListener(motion, 'change', function(ev) { emitChange('reducedMotion', ev); });
    addManagedListener(contrast, 'change', function(ev) { emitChange('contrast', ev); });
    addManagedListener(root, 'online', function(ev) { emitChange('online', ev); });
    addManagedListener(root, 'offline', function(ev) { emitChange('offline', ev); });
    addManagedListener(root, 'resize', function(ev) { emitChange('resize', ev); });
  }
  function clearWatchers() {
    var list = teardown.slice();
    var i;
    teardown = [];
    for (i = 0; i < list.length; i++) safe(list[i]);
  }
  function onChange(callback) {
    if (typeof callback !== 'function') return function() {};
    watchers.push(callback);
    attachWatchers();
    return function() {
      var i;
      for (i = watchers.length - 1; i >= 0; i--) if (watchers[i] === callback) watchers.splice(i, 1);
      if (!watchers.length) clearWatchers();
    };
  }
  function constraints() {
    var info = profile();
    var cores = info.cores != null ? info.cores : 1;
    ensureBattery();
    return {
      maxWorkers: cores > 1 ? cores - 1 : 1,
      maxMemory: info.memory,
      connection: info.connection,
      battery: {
        level: batteryState.level,
        charging: batteryState.charging
      }
    };
  }
  function score() {
    var weights = {
      fetch: 8,
      websocket: 7,
      indexeddb: 7,
      crypto: 8,
      canvas: 6,
      webgl: 8,
      webgpu: 6,
      serviceworker: 8,
      mediadevices: 6,
      notifications: 4,
      geolocation: 4,
      clipboard: 4,
      share: 2,
      speechrecognition: 3,
      speechsynthesis: 3,
      bluetooth: 2,
      usb: 2,
      serial: 2,
      hid: 2,
      wakelock: 2,
      vibration: 1,
      payment: 2,
      gamepad: 2
    };
    var total = 0;
    var max = 0;
    var key;
    var info = profile();
    for (key in weights) if (own(weights, key)) {
      max += weights[key];
      if (detect(key)) total += weights[key];
    }
    max += 14;
    if (info.cores >= 8) total += 4;
    else if (info.cores >= 4) total += 3;
    else if (info.cores >= 2) total += 2;
    else if (info.cores >= 1) total += 1;
    if (info.memory >= 8) total += 4;
    else if (info.memory >= 4) total += 3;
    else if (info.memory >= 2) total += 2;
    else if (info.memory >= 1) total += 1;
    if (info.connection && info.connection.downlink >= 20) total += 3;
    else if (info.connection && info.connection.downlink >= 5) total += 2;
    else if (info.connection && info.connection.downlink >= 1) total += 1;
    if (info.gpu) total += 3;
    return Math.max(0, Math.min(100, Math.round((total / max) * 100)));
  }
  function compare(required, available) {
    var req = Array.isArray(required) ? required.slice() : arr(required && (required.required || required.requires || required.features));
    var opt = Array.isArray(required) ? [] : arr(required && required.optional);
    var map = availabilityMap(available, req.concat(opt));
    var missing = [];
    var optional = [];
    var i;
    for (i = 0; i < req.length; i++) if (!map[req[i]]) missing.push(req[i]);
    for (i = 0; i < opt.length; i++) if (!map[opt[i]]) optional.push(opt[i]);
    return {
      compatible: !missing.length,
      missing: missing,
      optional: optional
    };
  }

  api = {
    detect: detect,
    detectAll: detectAll,
    profile: profile,
    supports: supports,
    fallback: fallback,
    permission: permission,
    requestPermission: requestPermission,
    register: register,
    require: requireFeatures,
    degrade: degrade,
    onChange: onChange,
    constraints: constraints,
    score: score,
    compare: compare
  };
  return api;
})();
if (typeof window !== 'undefined') {
  window.BareMetal = window.BareMetal || BareMetal;
  window.BareMetal.Capabilities = BareMetal.Capabilities;
}
if(typeof module!=='undefined') module.exports = BareMetal.Capabilities;
