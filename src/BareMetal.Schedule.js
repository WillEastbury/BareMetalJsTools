var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Schedule = (function(){
  'use strict';

  var CRON_ALIASES = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *'
  };
  var MONTH_NAMES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var DAY_NAMES = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  var DURATION_UNITS = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  var TZ_CACHE = {};

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function noop() {}
  function isFn(value) { return typeof value === 'function'; }
  function toNumber(value, fallback) { return typeof value === 'number' && isFinite(value) ? value : fallback; }
  function contains(list, value) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i] === value) return true;
    return false;
  }
  function copy(a, b) {
    var out = {}, key;
    for (key in (a || {})) if (own(a, key)) out[key] = a[key];
    for (key in (b || {})) if (own(b, key)) out[key] = b[key];
    return out;
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function toDate(value) {
    var date;
    if (value == null) return null;
    date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date;
  }
  function setStatus(job, status) {
    job.__status = status;
    return job;
  }
  function nextMatch(values, current) {
    var i;
    for (i = 0; i < values.length; i++) if (values[i] > current) return { value: values[i], wrapped: false };
    return { value: values[0], wrapped: true };
  }
  function callAsync(fn, ctx, args) {
    try { return Promise.resolve(fn.apply(ctx, args || [])); }
    catch (err) { return Promise.reject(err); }
  }
  function createEmitter() {
    var handlers = {};
    return {
      on: function(event, cb) {
        var list;
        if (!isFn(cb)) return function() {};
        list = handlers[event] = handlers[event] || [];
        list.push(cb);
        return function() {
          var i;
          for (i = list.length - 1; i >= 0; i--) if (list[i] === cb) list.splice(i, 1);
        };
      },
      emit: function(event, payload) {
        var list = handlers[event] ? handlers[event].slice() : [];
        var i;
        for (i = 0; i < list.length; i++) {
          try { list[i](payload, event); } catch (_) {}
        }
      },
      clear: function() { handlers = {}; }
    };
  }

  function parseDuration(value) {
    var input, total, re, match, remainder;
    if (typeof value === 'number' && isFinite(value)) return Math.round(value);
    input = String(value == null ? '' : value).trim().toLowerCase();
    if (!input) throw new Error('Invalid duration');
    total = 0;
    re = /([+-]?\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)/g;
    while ((match = re.exec(input))) total += parseFloat(match[1]) * DURATION_UNITS[match[2]];
    remainder = input.replace(/([+-]?\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)/g, '').replace(/\s+/g, '');
    if (remainder) throw new Error('Invalid duration: ' + value);
    return Math.round(total);
  }

  function formatDuration(ms) {
    var sign = ms < 0 ? '-' : '';
    var remaining = Math.abs(Math.round(ms));
    var parts = [];
    var units = [
      ['w', 604800000],
      ['d', 86400000],
      ['h', 3600000],
      ['m', 60000],
      ['s', 1000],
      ['ms', 1]
    ];
    var i, amount;
    if (!remaining) return '0ms';
    for (i = 0; i < units.length; i++) {
      if (remaining < units[i][1] && !(units[i][1] === 1 && !parts.length)) continue;
      amount = Math.floor(remaining / units[i][1]);
      if (!amount && units[i][1] !== 1) continue;
      parts.push(amount + units[i][0]);
      remaining -= amount * units[i][1];
    }
    return sign + parts.join(' ');
  }

  function normalizeCronExpression(expression) {
    var expr = String(expression == null ? '' : expression).trim().toLowerCase();
    return own(CRON_ALIASES, expr) ? CRON_ALIASES[expr] : expr;
  }

  function normalizeCronValue(token, names, isDow) {
    var lower = String(token).trim().toLowerCase();
    var value;
    if (!lower) throw new Error('Invalid cron token');
    if (names && own(names, lower)) value = names[lower];
    else {
      value = parseInt(lower, 10);
      if (isNaN(value)) throw new Error('Invalid cron token: ' + token);
    }
    if (isDow && value === 7) value = 0;
    return value;
  }

  function parseCronField(text, min, max, names, isDow) {
    var input = String(text == null ? '' : text).trim().toLowerCase();
    var parts, values, any, i;
    if (!input) throw new Error('Invalid cron field');
    parts = input.split(',');
    values = {};
    any = input === '*' || input === '?';
    for (i = 0; i < parts.length; i++) {
      var piece = parts[i];
      var step = 1;
      var range = piece;
      var bounds, start, end, value;
      if (!piece) throw new Error('Invalid cron field: ' + text);
      if (piece.indexOf('/') > -1) {
        bounds = piece.split('/');
        if (bounds.length !== 2) throw new Error('Invalid cron step: ' + piece);
        range = bounds[0] || '*';
        step = parseInt(bounds[1], 10);
        if (!step || step < 1) throw new Error('Invalid cron step: ' + piece);
      }
      if (range === '*' || range === '?') {
        start = min;
        end = max;
        any = true;
      } else if (range.indexOf('-') > -1) {
        bounds = range.split('-');
        if (bounds.length !== 2) throw new Error('Invalid cron range: ' + piece);
        start = normalizeCronValue(bounds[0], names, isDow);
        end = normalizeCronValue(bounds[1], names, isDow);
        if (start > end) throw new Error('Invalid cron range: ' + piece);
      } else {
        start = normalizeCronValue(range, names, isDow);
        end = step > 1 ? max : start;
      }
      for (value = start; value <= end; value += step) {
        var normalized = isDow && value === 7 ? 0 : value;
        if (normalized < min || normalized > (isDow ? 6 : max)) {
          if (!(isDow && normalized === 0)) throw new Error('Cron field out of range: ' + piece);
        }
        values[normalized] = true;
      }
    }
    return {
      values: Object.keys(values).map(function(key) { return parseInt(key, 10); }).sort(function(a, b) { return a - b; }),
      any: any
    };
  }

  function parseCron(expression) {
    var expr = normalizeCronExpression(expression);
    var parts = expr.split(/\s+/);
    var hasSeconds = parts.length === 6;
    var offset;
    var seconds;
    var minutes;
    var hours;
    var days;
    var months;
    var weekdays;
    if (parts.length !== 5 && parts.length !== 6) throw new Error('Cron expression must have 5 or 6 fields');
    offset = hasSeconds ? 1 : 0;
    seconds = hasSeconds ? parseCronField(parts[0], 0, 59, null, false) : { values: [0], any: true };
    minutes = parseCronField(parts[offset], 0, 59, null, false);
    hours = parseCronField(parts[offset + 1], 0, 23, null, false);
    days = parseCronField(parts[offset + 2], 1, 31, null, false);
    months = parseCronField(parts[offset + 3], 1, 12, MONTH_NAMES, false);
    weekdays = parseCronField(parts[offset + 4], 0, 7, DAY_NAMES, true);
    return {
      expression: expr,
      hasSeconds: hasSeconds,
      seconds: seconds.values,
      minutes: minutes.values,
      hours: hours.values,
      days: days.values,
      months: months.values,
      weekdays: weekdays.values,
      anyDays: days.any,
      anyWeekdays: weekdays.any
    };
  }

  function getLocalParts(date) {
    return {
      second: date.getSeconds(),
      minute: date.getMinutes(),
      hour: date.getHours(),
      day: date.getDate(),
      month: date.getMonth() + 1,
      weekday: date.getDay()
    };
  }

  function getTimezoneFormatter(timezone) {
    if (!timezone || typeof Intl === 'undefined' || !Intl.DateTimeFormat) return null;
    if (!TZ_CACHE[timezone]) {
      TZ_CACHE[timezone] = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        hourCycle: 'h23'
      });
    }
    return TZ_CACHE[timezone];
  }

  function getTimezoneParts(date, timezone) {
    var formatter = getTimezoneFormatter(timezone);
    var parts, out = {}, i, key;
    if (!formatter || !formatter.formatToParts) return getLocalParts(date);
    parts = formatter.formatToParts(date);
    for (i = 0; i < parts.length; i++) {
      key = parts[i].type;
      if (key === 'literal') continue;
      out[key] = parts[i].value;
    }
    return {
      second: parseInt(out.second, 10),
      minute: parseInt(out.minute, 10),
      hour: parseInt(out.hour, 10) % 24,
      day: parseInt(out.day, 10),
      month: parseInt(out.month, 10),
      weekday: DAY_NAMES[String(out.weekday || '').slice(0, 3).toLowerCase()]
    };
  }

  function matchesDay(parsed, parts) {
    var dayMatch = contains(parsed.days, parts.day);
    var weekdayMatch = contains(parsed.weekdays, parts.weekday);
    if (parsed.anyDays && parsed.anyWeekdays) return true;
    if (parsed.anyDays) return weekdayMatch;
    if (parsed.anyWeekdays) return dayMatch;
    return dayMatch || weekdayMatch;
  }

  function matchesParsed(parsed, date, timezone) {
    var parts = timezone ? getTimezoneParts(date, timezone) : getLocalParts(date);
    if (parsed.hasSeconds && !contains(parsed.seconds, parts.second)) return false;
    if (!contains(parsed.minutes, parts.minute)) return false;
    if (!contains(parsed.hours, parts.hour)) return false;
    if (!contains(parsed.months, parts.month)) return false;
    return matchesDay(parsed, parts);
  }

  function matchesCron(expression, date, timezone) {
    return matchesParsed(parseCron(expression), toDate(date || new Date()), timezone || null);
  }

  function advanceMonth(date, parsed) {
    var next = nextMatch(parsed.months, date.getMonth() + 1);
    if (next.wrapped) date.setFullYear(date.getFullYear() + 1);
    date.setMonth(next.value - 1, 1);
    date.setHours(parsed.hours[0], parsed.minutes[0], parsed.hasSeconds ? parsed.seconds[0] : 0, 0);
  }

  function advanceDay(date, parsed) {
    date.setDate(date.getDate() + 1);
    date.setHours(parsed.hours[0], parsed.minutes[0], parsed.hasSeconds ? parsed.seconds[0] : 0, 0);
  }

  function advanceHour(date, parsed) {
    var next = nextMatch(parsed.hours, date.getHours());
    if (next.wrapped) date.setDate(date.getDate() + 1);
    date.setHours(next.value, parsed.minutes[0], parsed.hasSeconds ? parsed.seconds[0] : 0, 0);
  }

  function advanceMinute(date, parsed) {
    var next = nextMatch(parsed.minutes, date.getMinutes());
    if (next.wrapped) date.setHours(date.getHours() + 1, next.value, parsed.hasSeconds ? parsed.seconds[0] : 0, 0);
    else date.setMinutes(next.value, parsed.hasSeconds ? parsed.seconds[0] : 0, 0);
  }

  function advanceSecond(date, parsed) {
    var next = nextMatch(parsed.seconds, date.getSeconds());
    if (next.wrapped) date.setMinutes(date.getMinutes() + 1, next.value, 0);
    else date.setSeconds(next.value, 0);
  }

  function nextCronParsed(parsed, after, timezone) {
    var date = toDate(after || new Date());
    var step = parsed.hasSeconds ? 1000 : 60000;
    var limit;
    var guard = 0;
    if (timezone) {
      date = new Date(date.getTime() + step);
      if (parsed.hasSeconds) date.setMilliseconds(0);
      else date.setSeconds(0, 0);
      limit = date.getTime() + 157680000000;
      while (date.getTime() <= limit && guard++ < 5000000) {
        if (matchesParsed(parsed, date, timezone)) return new Date(date.getTime());
        date = new Date(date.getTime() + step);
      }
      throw new Error('Unable to find next cron occurrence');
    }
    date = new Date(date.getTime() + step);
    if (parsed.hasSeconds) date.setMilliseconds(0);
    else date.setSeconds(0, 0);
    while (guard++ < 500000) {
      if (!contains(parsed.months, date.getMonth() + 1)) {
        advanceMonth(date, parsed);
        continue;
      }
      if (!matchesDay(parsed, getLocalParts(date))) {
        advanceDay(date, parsed);
        continue;
      }
      if (!contains(parsed.hours, date.getHours())) {
        advanceHour(date, parsed);
        continue;
      }
      if (!contains(parsed.minutes, date.getMinutes())) {
        advanceMinute(date, parsed);
        continue;
      }
      if (parsed.hasSeconds && !contains(parsed.seconds, date.getSeconds())) {
        advanceSecond(date, parsed);
        continue;
      }
      return new Date(date.getTime());
    }
    throw new Error('Unable to find next cron occurrence');
  }

  function nextCron(expression, after, timezone) {
    return nextCronParsed(parseCron(expression), after, timezone || null);
  }

  function runHandler(fn, job) {
    if (!isFn(fn)) return Promise.resolve();
    return callAsync(fn, null, [job]).catch(noop);
  }

  function deadline(fn, ms) {
    var wait = Math.max(0, toNumber(ms, 0));
    return new Promise(function(resolve, reject) {
      var settled = false;
      var timer = setTimeout(function() {
        if (settled) return;
        settled = true;
        reject(new Error('Deadline exceeded'));
      }, wait);
      Promise.resolve().then(function() {
        return isFn(fn) ? fn() : fn;
      }).then(function(value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      }, function(err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function retry(fn, opts) {
    var cfg = opts || {};
    var maxAttempts = Math.max(1, toNumber(cfg.maxAttempts, 3));
    var baseDelay = Math.max(0, toNumber(cfg.delay, 0));
    var retryOn = isFn(cfg.retryOn) ? cfg.retryOn : function() { return true; };
    var mode = String(cfg.backoff || 'exponential').toLowerCase();
    function waitFor(ms) {
      return new Promise(function(resolve) { setTimeout(resolve, Math.max(0, ms)); });
    }
    function nextDelay(attempt) {
      if (!baseDelay) return 0;
      if (mode === 'linear') return baseDelay * attempt;
      return baseDelay * Math.pow(2, attempt - 1);
    }
    function run(attempt) {
      return Promise.resolve().then(function() {
        return fn(attempt);
      }).catch(function(err) {
        if (attempt >= maxAttempts || !retryOn(err, attempt)) throw err;
        return waitFor(nextDelay(attempt)).then(function() { return run(attempt + 1); });
      });
    }
    return run(1);
  }

  function debounce(fn, wait, opts) {
    var cfg = opts || {};
    var delayMs = Math.max(0, toNumber(wait, 0));
    var leading = !!cfg.leading;
    var trailing = !own(cfg, 'trailing') || !!cfg.trailing;
    var maxWait = cfg.maxWait == null ? null : Math.max(delayMs, toNumber(cfg.maxWait, delayMs));
    var timer = null;
    var lastArgs;
    var lastThis;
    var result;
    var lastCallTime = 0;
    var lastInvokeTime = 0;

    function invoke(time) {
      lastInvokeTime = time;
      result = fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
      return result;
    }
    function startTimer(ms) {
      timer = setTimeout(timerExpired, ms);
    }
    function shouldInvoke(time) {
      var sinceCall = time - lastCallTime;
      var sinceInvoke = time - lastInvokeTime;
      return !lastCallTime || sinceCall >= delayMs || sinceCall < 0 || (maxWait != null && sinceInvoke >= maxWait);
    }
    function remainingWait(time) {
      var sinceCall = time - lastCallTime;
      var sinceInvoke = time - lastInvokeTime;
      var timeLeft = delayMs - sinceCall;
      return maxWait == null ? timeLeft : Math.min(timeLeft, maxWait - sinceInvoke);
    }
    function trailingEdge(time) {
      timer = null;
      if (trailing && lastArgs) return invoke(time);
      lastArgs = lastThis = null;
      return result;
    }
    function timerExpired() {
      var time = Date.now();
      if (shouldInvoke(time)) return trailingEdge(time);
      startTimer(remainingWait(time));
    }
    function debounced() {
      var time = Date.now();
      var invokeNow = shouldInvoke(time);
      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;
      if (invokeNow) {
        if (timer == null) {
          startTimer(delayMs);
          return leading ? invoke(time) : result;
        }
        if (maxWait != null) {
          clearTimeout(timer);
          startTimer(delayMs);
          return invoke(time);
        }
      }
      if (timer == null) startTimer(delayMs);
      return result;
    }
    debounced.cancel = function() {
      if (timer != null) clearTimeout(timer);
      timer = null;
      lastArgs = lastThis = null;
      lastCallTime = 0;
      lastInvokeTime = 0;
    };
    debounced.flush = function() {
      return timer == null ? result : trailingEdge(Date.now());
    };
    return debounced;
  }

  function throttle(fn, wait, opts) {
    var cfg = opts || {};
    return debounce(fn, wait, {
      leading: !own(cfg, 'leading') || !!cfg.leading,
      trailing: !own(cfg, 'trailing') || !!cfg.trailing,
      maxWait: Math.max(0, toNumber(wait, 0))
    });
  }

  function rateLimit(fn, opts) {
    var cfg = opts || {};
    var perSecond = cfg.maxPerSecond == null ? Infinity : Math.max(1, toNumber(cfg.maxPerSecond, 1));
    var perMinute = cfg.maxPerMinute == null ? Infinity : Math.max(1, toNumber(cfg.maxPerMinute, 1));
    var useQueue = !!cfg.queue;
    var secondHits = [];
    var minuteHits = [];
    var pending = [];
    var timer = null;

    function prune(now) {
      while (secondHits.length && secondHits[0] <= now - 1000) secondHits.shift();
      while (minuteHits.length && minuteHits[0] <= now - 60000) minuteHits.shift();
    }
    function canRun(now) {
      prune(now);
      return secondHits.length < perSecond && minuteHits.length < perMinute;
    }
    function nextWait(now) {
      var wait = 0;
      prune(now);
      if (secondHits.length >= perSecond) wait = Math.max(wait, 1000 - (now - secondHits[0]));
      if (minuteHits.length >= perMinute) wait = Math.max(wait, 60000 - (now - minuteHits[0]));
      return Math.max(0, wait);
    }
    function clearScheduled() {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    }
    function scheduleDrain() {
      var now;
      clearScheduled();
      if (!pending.length) return;
      now = Date.now();
      if (canRun(now)) return drain();
      timer = setTimeout(drain, nextWait(now));
    }
    function execute(entry) {
      var now = Date.now();
      prune(now);
      secondHits.push(now);
      minuteHits.push(now);
      Promise.resolve().then(function() {
        return fn.apply(entry.ctx, entry.args);
      }).then(entry.resolve, entry.reject).then(function() {
        if (useQueue && pending.length) scheduleDrain();
      });
    }
    function drain() {
      clearScheduled();
      while (pending.length && canRun(Date.now())) execute(pending.shift());
      if (pending.length) scheduleDrain();
    }
    return function() {
      var args = arguments;
      var ctx = this;
      return new Promise(function(resolve, reject) {
        var entry = { args: args, ctx: ctx, resolve: resolve, reject: reject };
        if (canRun(Date.now())) return execute(entry);
        if (!useQueue) return reject(new Error('Rate limit exceeded'));
        pending.push(entry);
        scheduleDrain();
      });
    };
  }

  function createTimedJob(type, wait, fn, opts) {
    var cfg = opts || {};
    var baseWait = Math.max(0, toNumber(wait, 0));
    var maxRuns = cfg.maxRuns == null ? Infinity : Math.max(0, toNumber(cfg.maxRuns, 0));
    var jitter = Math.max(0, toNumber(cfg.jitter, 0));
    var startDate = toDate(cfg.startDate);
    var endDate = toDate(cfg.endDate);
    var timer = null;
    var nextRun = null;
    var plannedAt = null;
    var remaining = null;
    var job = {
      name: cfg.name || null,
      lastRun: null,
      runCount: 0,
      __type: type,
      __status: 'stopped'
    };

    function clearTimer() {
      if (timer != null) clearTimeout(timer);
      timer = null;
      nextRun = null;
    }
    function offset() {
      return Math.max(0, baseWait + (jitter ? Math.round((Math.random() * 2 - 1) * jitter) : 0));
    }
    function stop() {
      clearTimer();
      remaining = null;
      return setStatus(job, 'stopped');
    }
    function scheduleAt(ts) {
      clearTimer();
      plannedAt = ts;
      nextRun = new Date(ts);
      if (endDate && nextRun.getTime() > endDate.getTime()) return stop();
      timer = setTimeout(fire, Math.max(0, ts - Date.now()));
      return setStatus(job, 'running');
    }
    function scheduleFrom(baseTs) {
      return scheduleAt(baseTs + offset());
    }
    function fire() {
      clearTimer();
      remaining = null;
      if (startDate && Date.now() < startDate.getTime()) return scheduleAt(startDate.getTime());
      if (endDate && Date.now() > endDate.getTime()) return stop();
      job.lastRun = new Date();
      job.runCount += 1;
      runHandler(fn, job);
      if (job.runCount >= maxRuns) return stop();
      return scheduleFrom(plannedAt != null ? plannedAt : Date.now());
    }
    function start() {
      clearTimer();
      remaining = null;
      if (!maxRuns) return stop();
      if (startDate && startDate.getTime() > Date.now()) return scheduleAt(startDate.getTime());
      if (cfg.immediate) {
        plannedAt = Date.now();
        nextRun = new Date(plannedAt);
        timer = setTimeout(fire, 0);
        return setStatus(job, 'running');
      }
      return scheduleFrom(Date.now());
    }
    function pause() {
      if (timer == null) return job;
      remaining = nextRun ? Math.max(0, nextRun.getTime() - Date.now()) : 0;
      clearTimer();
      return setStatus(job, 'paused');
    }
    function resume() {
      if (job.__status !== 'paused') return job;
      if (startDate && startDate.getTime() > Date.now()) return scheduleAt(startDate.getTime());
      if (remaining != null) {
        var ms = remaining;
        remaining = null;
        return scheduleAt(Date.now() + ms);
      }
      return scheduleFrom(Date.now());
    }

    job.start = start;
    job.stop = stop;
    job.pause = pause;
    job.resume = resume;
    job.next = function() { return nextRun ? new Date(nextRun.getTime()) : null; };
    job.isRunning = function() { return job.__status === 'running'; };

    if (!cfg.paused) start();
    else setStatus(job, 'paused');
    return job;
  }

  function interval(ms, fn, opts) {
    return createTimedJob('interval', ms, fn, opts);
  }

  function delay(ms, fn, opts) {
    var cfg = opts || {};
    var wait = Math.max(0, toNumber(ms, 0));
    var timer = null;
    var nextRun = null;
    var remaining = null;
    var job = {
      name: cfg.name || null,
      lastRun: null,
      runCount: 0,
      __type: 'delay',
      __status: 'stopped'
    };

    function clearTimer() {
      if (timer != null) clearTimeout(timer);
      timer = null;
      nextRun = null;
    }
    function fire() {
      clearTimer();
      remaining = null;
      job.lastRun = new Date();
      job.runCount += 1;
      setStatus(job, 'stopped');
      runHandler(fn, job);
    }
    function schedule(delayMs) {
      clearTimer();
      remaining = null;
      wait = Math.max(0, toNumber(delayMs, 0));
      nextRun = new Date(Date.now() + wait);
      timer = setTimeout(fire, wait);
      return setStatus(job, 'running');
    }
    function cancel() {
      clearTimer();
      remaining = null;
      return setStatus(job, 'stopped');
    }
    function pause() {
      if (timer == null) return job;
      remaining = nextRun ? Math.max(0, nextRun.getTime() - Date.now()) : 0;
      clearTimer();
      return setStatus(job, 'paused');
    }
    function resume() {
      if (job.__status !== 'paused') return job;
      return schedule(remaining != null ? remaining : wait);
    }

    job.start = function() { return schedule(wait); };
    job.stop = cancel;
    job.pause = pause;
    job.resume = resume;
    job.cancel = cancel;
    job.reschedule = function(newMs) { return schedule(newMs); };
    job.next = function() { return nextRun ? new Date(nextRun.getTime()) : null; };
    job.isRunning = function() { return job.__status === 'running'; };

    if (!cfg.paused) schedule(wait);
    else setStatus(job, 'paused');
    return job;
  }

  function at(date, fn, opts) {
    var target = toDate(date);
    var job = delay(Math.max(0, target.getTime() - Date.now()), fn, opts);
    job.__type = 'at';
    job.when = new Date(target.getTime());
    return job;
  }

  function every(duration, fn, opts) {
    var job = interval(parseDuration(duration), fn, opts);
    job.__type = 'every';
    return job;
  }

  function cron(expression, fn, opts) {
    var cfg = opts || {};
    var parsed = parseCron(expression);
    var maxRuns = cfg.maxRuns == null ? Infinity : Math.max(0, toNumber(cfg.maxRuns, 0));
    var startDate = toDate(cfg.startDate);
    var endDate = toDate(cfg.endDate);
    var timer = null;
    var nextRun = null;
    var job = {
      name: cfg.name || null,
      lastRun: null,
      runCount: 0,
      __type: 'cron',
      __status: 'stopped'
    };

    function clearTimer() {
      if (timer != null) clearTimeout(timer);
      timer = null;
      nextRun = null;
    }
    function stop() {
      clearTimer();
      return setStatus(job, 'stopped');
    }
    function scheduleFrom(base) {
      var from = toDate(base || new Date());
      clearTimer();
      if (!maxRuns) return stop();
      if (startDate && from.getTime() < startDate.getTime()) from = new Date(startDate.getTime() - 1);
      try { nextRun = nextCronParsed(parsed, from, cfg.timezone || null); }
      catch (_) { return stop(); }
      if (endDate && nextRun.getTime() > endDate.getTime()) return stop();
      timer = setTimeout(fire, Math.max(0, nextRun.getTime() - Date.now()));
      return setStatus(job, 'running');
    }
    function fire() {
      clearTimer();
      if (startDate && Date.now() < startDate.getTime()) return scheduleFrom(startDate);
      if (endDate && Date.now() > endDate.getTime()) return stop();
      job.lastRun = new Date();
      job.runCount += 1;
      runHandler(fn, job);
      if (job.runCount >= maxRuns) return stop();
      return scheduleFrom(job.lastRun);
    }
    function start() {
      if (!maxRuns) return stop();
      if (startDate && startDate.getTime() > Date.now()) return scheduleFrom(new Date(startDate.getTime() - 1));
      if (cfg.immediate) {
        clearTimer();
        nextRun = new Date();
        timer = setTimeout(fire, 0);
        return setStatus(job, 'running');
      }
      return scheduleFrom(new Date());
    }

    job.start = start;
    job.stop = stop;
    job.pause = function() {
      clearTimer();
      return setStatus(job, 'paused');
    };
    job.resume = function() {
      if (job.__status !== 'paused') return job;
      return scheduleFrom(new Date());
    };
    job.next = function() {
      if (nextRun) return new Date(nextRun.getTime());
      try {
        return nextCronParsed(parsed, startDate && startDate.getTime() > Date.now() ? new Date(startDate.getTime() - 1) : new Date(), cfg.timezone || null);
      } catch (_) {
        return null;
      }
    };
    job.isRunning = function() { return job.__status === 'running'; };

    if (!cfg.paused) start();
    else setStatus(job, 'paused');
    return job;
  }

  function queue(opts) {
    var cfg = opts || {};
    var concurrency = Math.max(1, toNumber(cfg.concurrency, 1));
    var retries = Math.max(0, toNumber(cfg.retries, 0));
    var retryDelay = Math.max(0, parseDuration(cfg.retryDelay == null ? 1000 : cfg.retryDelay));
    var timeout = cfg.timeout == null ? 0 : Math.max(0, parseDuration(cfg.timeout));
    var paused = false;
    var activeCount = 0;
    var sequence = 0;
    var wakeTimer = null;
    var drained = true;
    var pending = [];
    var events = createEmitter();
    var priorityMap = { critical: 4, high: 3, normal: 2, low: 1, idle: 0 };

    function priorityOf(value) {
      if (value == null) return 0;
      if (typeof value === 'number' && isFinite(value)) return value;
      value = String(value).toLowerCase();
      return own(priorityMap, value) ? priorityMap[value] : 0;
    }
    function clearWake() {
      if (wakeTimer != null) clearTimeout(wakeTimer);
      wakeTimer = null;
    }
    function maybeDrain() {
      if (!drained && activeCount === 0 && !pending.length) {
        drained = true;
        if (isFn(cfg.onDrain)) {
          try { cfg.onDrain(); } catch (_) {}
        }
        events.emit('drain');
      }
    }
    function fail(err, item) {
      if (isFn(cfg.onError)) {
        try { cfg.onError(err, item); } catch (_) {}
      }
      events.emit('error', { error: err, id: item.id, item: item });
    }
    function nextReadyIndex(now) {
      var best = -1;
      var i;
      for (i = 0; i < pending.length; i++) {
        if (pending[i].availableAt > now) continue;
        if (best === -1 || pending[i].priority > pending[best].priority || (pending[i].priority === pending[best].priority && pending[i].seq < pending[best].seq)) best = i;
      }
      return best;
    }
    function earliestAvailable() {
      var i, min = null;
      for (i = 0; i < pending.length; i++) if (min == null || pending[i].availableAt < min) min = pending[i].availableAt;
      return min;
    }
    function runItem(item) {
      var work = function() {
        return item.fn(item.options && own(item.options, 'data') ? item.options.data : undefined, item);
      };
      activeCount += 1;
      events.emit('active', { id: item.id, item: item });
      (timeout ? deadline(work, timeout) : Promise.resolve().then(work)).then(function(value) {
        activeCount -= 1;
        item.resolve(value);
        events.emit('complete', { id: item.id, item: item, value: value });
        schedule();
      }, function(err) {
        activeCount -= 1;
        if (item.attempt < retries) {
          item.attempt += 1;
          item.availableAt = Date.now() + retryDelay;
          pending.push(item);
          drained = false;
          fail(err, item);
          schedule();
          return;
        }
        item.reject(err);
        fail(err, item);
        schedule();
      });
    }
    function schedule() {
      var now;
      var index;
      clearWake();
      if (!paused) {
        now = Date.now();
        while (activeCount < concurrency) {
          index = nextReadyIndex(now);
          if (index === -1) break;
          runItem(pending.splice(index, 1)[0]);
          now = Date.now();
        }
      }
      if (!paused && activeCount < concurrency && pending.length) {
        var at = earliestAvailable();
        if (at != null) wakeTimer = setTimeout(schedule, Math.max(0, at - Date.now()));
      }
      maybeDrain();
    }
    function add(fn, options) {
      var opts = options || {};
      var id = 'job-' + (++sequence);
      var item;
      if (!isFn(fn)) {
        return {
          id: id,
          promise: Promise.reject(new Error('Queue job must be a function'))
        };
      }
      drained = false;
      item = {
        id: id,
        fn: fn,
        name: opts.name || id,
        seq: sequence,
        attempt: 0,
        priority: priorityOf(opts.priority),
        availableAt: Date.now() + Math.max(0, parseDuration(opts.delay || 0)),
        options: opts
      };
      item.promise = new Promise(function(resolve, reject) {
        item.resolve = resolve;
        item.reject = reject;
      });
      pending.push(item);
      schedule();
      return { id: id, promise: item.promise };
    }

    return {
      add: add,
      pause: function() { paused = true; clearWake(); return this; },
      resume: function() { paused = false; schedule(); return this; },
      clear: function() {
        var list = pending.slice();
        var i;
        pending.length = 0;
        clearWake();
        for (i = 0; i < list.length; i++) list[i].reject(new Error('Queue cleared'));
        maybeDrain();
        return this;
      },
      size: function() { return pending.length + activeCount; },
      pending: function() { return pending.length; },
      active: function() { return activeCount; },
      on: events.on
    };
  }

  function buildJob(config) {
    var cfg = copy(config || {}, {});
    var type = String(cfg.type || cfg.kind || (cfg.expression ? 'cron' : cfg.duration ? 'every' : cfg.date ? 'at' : cfg.ms != null ? (cfg.once ? 'delay' : 'interval') : '')).toLowerCase();
    if (type === 'cron') return cron(cfg.expression, cfg.fn, cfg);
    if (type === 'interval') return interval(cfg.ms, cfg.fn, cfg);
    if (type === 'delay') return delay(cfg.ms, cfg.fn, cfg);
    if (type === 'at') return at(cfg.date, cfg.fn, cfg);
    if (type === 'every') return every(cfg.duration, cfg.fn, cfg);
    throw new Error('Unknown scheduler job type');
  }

  function scheduler() {
    var jobs = {};
    var events = createEmitter();
    var api;

    function each(method, eventName) {
      var name;
      var job;
      for (name in jobs) if (own(jobs, name)) {
        job = jobs[name];
        if (isFn(job[method])) job[method]();
        events.emit(eventName, { name: name, job: job });
      }
      return api;
    }

    api = {
      add: function(name, jobOrConfig) {
        var job;
        if (!name) throw new Error('Scheduler job name required');
        if (jobs[name]) this.remove(name);
        job = jobOrConfig && isFn(jobOrConfig.start) ? jobOrConfig : buildJob(copy(jobOrConfig || {}, { name: name }));
        if (!job.name) job.name = name;
        jobs[name] = job;
        events.emit('add', { name: name, job: job });
        return job;
      },
      remove: function(name) {
        var job = jobs[name];
        if (!job) return null;
        if (isFn(job.stop)) job.stop();
        else if (isFn(job.cancel)) job.cancel();
        delete jobs[name];
        events.emit('remove', { name: name, job: job });
        return job;
      },
      get: function(name) { return jobs[name] || null; },
      list: function() {
        var out = [];
        var name;
        var job;
        for (name in jobs) if (own(jobs, name)) {
          job = jobs[name];
          out.push({
            name: name,
            type: job.__type || 'job',
            status: job.__status || (isFn(job.isRunning) && job.isRunning() ? 'running' : 'stopped'),
            nextRun: isFn(job.next) ? job.next() : null,
            lastRun: job.lastRun || null,
            runCount: job.runCount || 0
          });
        }
        return out;
      },
      startAll: function() { return each('start', 'start'); },
      stopAll: function() { return each('stop', 'stop'); },
      pauseAll: function() { return each('pause', 'pause'); },
      resumeAll: function() { return each('resume', 'resume'); },
      on: events.on,
      destroy: function() {
        this.stopAll();
        jobs = {};
        events.clear();
      }
    };
    return api;
  }

  return {
    cron: cron,
    interval: interval,
    delay: delay,
    at: at,
    every: every,
    queue: queue,
    scheduler: scheduler,
    parseCron: parseCron,
    nextCron: nextCron,
    matchesCron: matchesCron,
    parseDuration: parseDuration,
    formatDuration: formatDuration,
    debounce: debounce,
    throttle: throttle,
    rateLimit: rateLimit,
    retry: retry,
    deadline: deadline
  };
})();
if (typeof module !== 'undefined') module.exports = BareMetal.Schedule;
