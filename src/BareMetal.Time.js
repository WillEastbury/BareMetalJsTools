// BareMetal.Time — sensible date/time abstraction
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Time = (() => {
  'use strict';

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function _pad(n, len) { return String(n).padStart(len || 2, '0'); }

  function _hasTemporal() { return typeof Temporal !== 'undefined' && Temporal.PlainDateTime; }

  function _fromDate(d) {
    return _build(d.getFullYear(), d.getMonth() + 1, d.getDate(),
      d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  }

  function _toDate(dt) {
    return new Date(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute, dt.second, dt.ms);
  }

  function _build(year, month, day, hour, minute, second, ms) {
    hour = hour || 0; minute = minute || 0; second = second || 0; ms = ms || 0;
    var d = new Date(year, month - 1, day, hour, minute, second, ms);
    if (year >= 0 && year < 100) d.setFullYear(year);
    return {
      year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
      hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds(), ms: d.getMilliseconds(),
      iso: d.toISOString(), ts: d.getTime()
    };
  }

  function now() { return _fromDate(new Date()); }

  function utcNow() {
    var d = new Date();
    return _build(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
      d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
  }

  function parse(input) {
    if (input == null) throw new Error('Cannot parse null/undefined');
    if (typeof input === 'object' && typeof input.year === 'number') return _build(input.year, input.month, input.day, input.hour, input.minute, input.second, input.ms);
    if (_hasTemporal()) {
      if (input instanceof Temporal.PlainDateTime) return fromTemporal(input);
      if (input instanceof Temporal.ZonedDateTime) return fromTemporal(input.toPlainDateTime());
    }
    if (input instanceof Date) return _fromDate(input);
    if (typeof input === 'number') return _fromDate(new Date(input));
    if (typeof input === 'string') {
      var d = new Date(input);
      if (isNaN(d.getTime())) throw new Error('Invalid date string: ' + input);
      return _fromDate(d);
    }
    throw new Error('Unsupported input type');
  }

  function create(year, month, day, hour, minute, second, ms) {
    return _build(year, month, day, hour, minute, second, ms);
  }

  function fromDate(date) { return _fromDate(date); }

  function format(dt, pattern) {
    var d = _toDate(dt);
    var dow = (d.getDay() + 6) % 7; // 0=Mon
    return pattern
      .replace('YYYY', _pad(dt.year, 4))
      .replace('MMMM', MONTHS[dt.month - 1])
      .replace('MMM', MONTHS_SHORT[dt.month - 1])
      .replace('MM', _pad(dt.month))
      .replace('dddd', DAYS[dow])
      .replace('ddd', DAYS_SHORT[dow])
      .replace('DD', _pad(dt.day))
      .replace('HH', _pad(dt.hour))
      .replace('mm', _pad(dt.minute))
      .replace('ss', _pad(dt.second));
  }

  function formatRelative(dt, base) {
    base = base || now();
    var diffMs = _toDate(dt).getTime() - _toDate(base).getTime();
    var abs = Math.abs(diffMs);
    var future = diffMs > 0;
    var seconds = Math.round(abs / 1000);
    var minutes = Math.round(abs / 60000);
    var hours = Math.round(abs / 3600000);
    var days = Math.round(abs / 86400000);
    var weeks = Math.round(abs / 604800000);

    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      var rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      var sign = future ? 1 : -1;
      if (seconds < 60) return rtf.format(sign * seconds, 'second');
      if (minutes < 60) return rtf.format(sign * minutes, 'minute');
      if (hours < 24) return rtf.format(sign * hours, 'hour');
      if (days < 7) return rtf.format(sign * days, 'day');
      if (weeks < 5) return rtf.format(sign * weeks, 'week');
      return rtf.format(sign * Math.round(days / 30), 'month');
    }
    // Manual fallback
    var suffix = future ? 'from now' : 'ago';
    if (seconds < 60) return seconds + ' seconds ' + suffix;
    if (minutes < 60) return minutes + ' minutes ' + suffix;
    if (hours < 24) return hours + ' hours ' + suffix;
    if (days < 7) return days + ' days ' + suffix;
    return weeks + ' weeks ' + suffix;
  }

  function toISO(dt) { return dt.iso; }
  function toDate(dt) { return _toDate(dt); }

  function add(dt, amount, unit) {
    var d = _toDate(dt);
    switch (unit) {
      case 'years':   return _build(dt.year + amount, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.ms);
      case 'months':  return _fromDate(new Date(d.getFullYear(), d.getMonth() + amount, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));
      case 'days':    d.setDate(d.getDate() + amount); return _fromDate(d);
      case 'hours':   d.setHours(d.getHours() + amount); return _fromDate(d);
      case 'minutes': d.setMinutes(d.getMinutes() + amount); return _fromDate(d);
      case 'seconds': d.setSeconds(d.getSeconds() + amount); return _fromDate(d);
      case 'ms':      d.setMilliseconds(d.getMilliseconds() + amount); return _fromDate(d);
      default: throw new Error('Unknown unit: ' + unit);
    }
  }

  function subtract(dt, amount, unit) { return add(dt, -amount, unit); }

  function startOf(dt, unit) {
    switch (unit) {
      case 'year':   return _build(dt.year, 1, 1);
      case 'month':  return _build(dt.year, dt.month, 1);
      case 'day':    return _build(dt.year, dt.month, dt.day);
      case 'hour':   return _build(dt.year, dt.month, dt.day, dt.hour);
      case 'minute': return _build(dt.year, dt.month, dt.day, dt.hour, dt.minute);
      default: throw new Error('Unknown unit: ' + unit);
    }
  }

  function endOf(dt, unit) {
    switch (unit) {
      case 'year':   return _build(dt.year, 12, 31, 23, 59, 59, 999);
      case 'month':  return _build(dt.year, dt.month, daysInMonth(dt.year, dt.month), 23, 59, 59, 999);
      case 'day':    return _build(dt.year, dt.month, dt.day, 23, 59, 59, 999);
      case 'hour':   return _build(dt.year, dt.month, dt.day, dt.hour, 59, 59, 999);
      case 'minute': return _build(dt.year, dt.month, dt.day, dt.hour, dt.minute, 59, 999);
      default: throw new Error('Unknown unit: ' + unit);
    }
  }

  function isBefore(a, b) { return a.ts < b.ts; }
  function isAfter(a, b) { return a.ts > b.ts; }

  function isSame(a, b, precision) {
    if (!precision) return a.ts === b.ts;
    switch (precision) {
      case 'year':   return a.year === b.year;
      case 'month':  return a.year === b.year && a.month === b.month;
      case 'day':    return a.year === b.year && a.month === b.month && a.day === b.day;
      case 'hour':   return a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour;
      case 'minute': return a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.minute === b.minute;
      default: return a.ts === b.ts;
    }
  }

  function isBetween(dt, start, end) { return dt.ts >= start.ts && dt.ts <= end.ts; }

  function diff(a, b, unit) {
    var ms = a.ts - b.ts;
    switch (unit) {
      case 'seconds': return ms / 1000;
      case 'minutes': return ms / 60000;
      case 'hours':   return ms / 3600000;
      case 'days':    return ms / 86400000;
      default: return ms;
    }
  }

  function duration(ms) {
    var abs = Math.abs(ms);
    var days = Math.floor(abs / 86400000); abs -= days * 86400000;
    var hours = Math.floor(abs / 3600000); abs -= hours * 3600000;
    var minutes = Math.floor(abs / 60000); abs -= minutes * 60000;
    var seconds = Math.floor(abs / 1000); abs -= seconds * 1000;
    return { days: days, hours: hours, minutes: minutes, seconds: seconds, ms: abs, total: ms };
  }

  function formatDuration(ms, opts) {
    var short = !opts || opts.short !== false;
    var dur = duration(ms);
    var parts = [];
    if (dur.days) parts.push(short ? dur.days + 'd' : dur.days + ' day' + (dur.days !== 1 ? 's' : ''));
    if (dur.hours) parts.push(short ? dur.hours + 'h' : dur.hours + ' hour' + (dur.hours !== 1 ? 's' : ''));
    if (dur.minutes) parts.push(short ? dur.minutes + 'm' : dur.minutes + ' minute' + (dur.minutes !== 1 ? 's' : ''));
    if (dur.seconds) parts.push(short ? dur.seconds + 's' : dur.seconds + ' second' + (dur.seconds !== 1 ? 's' : ''));
    if (!parts.length) return short ? '0s' : '0 seconds';
    return short ? parts.join(' ') : parts.join(', ');
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  function dayOfWeek(dt) {
    var dow = _toDate(dt).getDay();
    return dow === 0 ? 7 : dow; // 1=Mon..7=Sun
  }

  function dayOfWeekName(dt) { return DAYS[dayOfWeek(dt) - 1]; }

  function weekNumber(dt) {
    var d = _toDate(dt);
    var temp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    temp.setUTCDate(temp.getUTCDate() + 4 - (temp.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    return Math.ceil(((temp - yearStart) / 86400000 + 1) / 7);
  }

  function toTimezone(dt, tz) {
    var d = _toDate(dt);
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      fractionalSecondDigits: 3
    });
    var parts = {};
    fmt.formatToParts(d).forEach(function(p) { parts[p.type] = p.value; });
    var hour = parseInt(parts.hour, 10);
    if (hour === 24) hour = 0;
    return _build(parseInt(parts.year, 10), parseInt(parts.month, 10), parseInt(parts.day, 10),
      hour, parseInt(parts.minute, 10), parseInt(parts.second, 10), parseInt(parts.fractionalSecond || '0', 10));
  }

  function getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  function hasTemporal() { return _hasTemporal(); }

  function toTemporal(dt) {
    if (!_hasTemporal()) throw new Error('Temporal API not available');
    return new Temporal.PlainDateTime(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.ms);
  }

  function fromTemporal(t) {
    return _build(t.year, t.month, t.day, t.hour, t.minute, t.second, t.millisecond || 0);
  }

  return {
    now: now, utcNow: utcNow, parse: parse, create: create, fromDate: fromDate,
    format: format, formatRelative: formatRelative, toISO: toISO, toDate: toDate,
    add: add, subtract: subtract, startOf: startOf, endOf: endOf,
    isBefore: isBefore, isAfter: isAfter, isSame: isSame, isBetween: isBetween,
    diff: diff, duration: duration, formatDuration: formatDuration,
    daysInMonth: daysInMonth, isLeapYear: isLeapYear,
    dayOfWeek: dayOfWeek, dayOfWeekName: dayOfWeekName, weekNumber: weekNumber,
    toTimezone: toTimezone, getTimezone: getTimezone,
    hasTemporal: hasTemporal, toTemporal: toTemporal, fromTemporal: fromTemporal
  };
})();
