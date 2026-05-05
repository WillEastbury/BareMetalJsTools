/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';
const path = require('path');
const fs = require('fs');

function loadTime() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Time.js'), 'utf8');
  const bm = {};
  const fn = new Function('document', 'BareMetal', 'Intl', code + '\nreturn BareMetal;');
  return fn(global.document, bm, global.Intl).Time;
}

let T;
beforeAll(() => { T = loadTime(); });

function dtShape(dt) {
  expect(dt).toHaveProperty('year');
  expect(dt).toHaveProperty('month');
  expect(dt).toHaveProperty('day');
  expect(dt).toHaveProperty('hour');
  expect(dt).toHaveProperty('minute');
  expect(dt).toHaveProperty('second');
  expect(dt).toHaveProperty('ms');
  expect(dt).toHaveProperty('iso');
  expect(dt).toHaveProperty('ts');
  expect(typeof dt.iso).toBe('string');
  expect(typeof dt.ts).toBe('number');
}

describe('now / utcNow', () => {
  test('now() returns valid dt shape', () => dtShape(T.now()));
  test('utcNow() returns valid dt shape', () => dtShape(T.utcNow()));
});

describe('parse', () => {
  test('from ISO string', () => {
    const dt = T.parse('2024-06-15T10:30:00');
    dtShape(dt);
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(6);
    expect(dt.day).toBe(15);
  });

  test('from timestamp', () => {
    const ts = new Date(2024, 5, 15, 10, 30).getTime();
    const dt = T.parse(ts);
    dtShape(dt);
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(6);
  });

  test('from Date instance', () => {
    const dt = T.parse(new Date(2024, 0, 1));
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(1);
    expect(dt.day).toBe(1);
  });
});

describe('create', () => {
  test('1-based months', () => {
    const dt = T.create(2024, 3, 15);
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(3);
    expect(dt.day).toBe(15);
    expect(dt.hour).toBe(0);
  });

  test('with time components', () => {
    const dt = T.create(2024, 12, 25, 14, 30, 45, 123);
    expect(dt.hour).toBe(14);
    expect(dt.minute).toBe(30);
    expect(dt.second).toBe(45);
    expect(dt.ms).toBe(123);
  });
});

describe('format', () => {
  test('YYYY-MM-DD HH:mm', () => {
    const dt = T.create(2026, 4, 20, 17, 29);
    expect(T.format(dt, 'YYYY-MM-DD HH:mm')).toBe('2026-04-20 17:29');
  });

  test('full month and day names', () => {
    const dt = T.create(2024, 1, 1); // Monday Jan 1 2024
    const s = T.format(dt, 'dddd, MMMM DD');
    expect(s).toBe('Monday, January 01');
  });

  test('short month and day names', () => {
    const dt = T.create(2024, 1, 1);
    expect(T.format(dt, 'ddd, MMM DD')).toBe('Mon, Jan 01');
  });
});

describe('formatRelative', () => {
  test('recent past', () => {
    const base = T.create(2024, 6, 15, 12, 0, 0);
    const dt = T.create(2024, 6, 15, 11, 57, 0);
    const s = T.formatRelative(dt, base);
    expect(s).toMatch(/3 minutes ago/);
  });

  test('future', () => {
    const base = T.create(2024, 6, 15, 12, 0, 0);
    const dt = T.create(2024, 6, 15, 14, 0, 0);
    const s = T.formatRelative(dt, base);
    expect(s).toMatch(/2 hours/i);
  });
});

describe('add / subtract', () => {
  test('add days is immutable', () => {
    const dt = T.create(2024, 1, 15);
    const dt2 = T.add(dt, 10, 'days');
    expect(dt.day).toBe(15);
    expect(dt2.day).toBe(25);
  });

  test('add months', () => {
    const dt = T.create(2024, 1, 15);
    const dt2 = T.add(dt, 1, 'months');
    expect(dt2.month).toBe(2);
    expect(dt2.day).toBe(15);
  });

  test('subtract hours', () => {
    const dt = T.create(2024, 6, 15, 10);
    const dt2 = T.subtract(dt, 3, 'hours');
    expect(dt2.hour).toBe(7);
  });

  test('add years', () => {
    const dt = T.create(2024, 6, 15);
    expect(T.add(dt, 2, 'years').year).toBe(2026);
  });
});

describe('startOf / endOf', () => {
  test('startOf day', () => {
    const dt = T.create(2024, 6, 15, 14, 30, 45, 123);
    const s = T.startOf(dt, 'day');
    expect(s.hour).toBe(0);
    expect(s.minute).toBe(0);
    expect(s.second).toBe(0);
    expect(s.ms).toBe(0);
    expect(s.day).toBe(15);
  });

  test('endOf month', () => {
    const dt = T.create(2024, 2, 10);
    const e = T.endOf(dt, 'month');
    expect(e.day).toBe(29); // leap year
    expect(e.hour).toBe(23);
    expect(e.minute).toBe(59);
  });

  test('startOf month', () => {
    const dt = T.create(2024, 6, 15);
    const s = T.startOf(dt, 'month');
    expect(s.day).toBe(1);
    expect(s.hour).toBe(0);
  });
});

describe('comparison', () => {
  let a, b, c;
  beforeAll(() => {
    a = T.create(2024, 6, 15, 10, 0);
    b = T.create(2024, 6, 15, 14, 0);
    c = T.create(2024, 6, 15, 18, 0);
  });

  test('isBefore', () => {
    expect(T.isBefore(a, b)).toBe(true);
    expect(T.isBefore(b, a)).toBe(false);
  });

  test('isAfter', () => {
    expect(T.isAfter(b, a)).toBe(true);
  });

  test('isSame exact', () => {
    expect(T.isSame(a, a)).toBe(true);
    expect(T.isSame(a, b)).toBe(false);
  });

  test('isSame with precision', () => {
    expect(T.isSame(a, b, 'day')).toBe(true);
    expect(T.isSame(a, b, 'hour')).toBe(false);
  });

  test('isBetween', () => {
    expect(T.isBetween(b, a, c)).toBe(true);
    expect(T.isBetween(a, b, c)).toBe(false);
  });
});

describe('diff', () => {
  test('diff in ms (default)', () => {
    const a = T.create(2024, 6, 15, 12, 0, 0);
    const b = T.create(2024, 6, 15, 10, 0, 0);
    expect(T.diff(a, b)).toBe(7200000);
  });

  test('diff in hours', () => {
    const a = T.create(2024, 6, 15, 12, 0, 0);
    const b = T.create(2024, 6, 15, 10, 0, 0);
    expect(T.diff(a, b, 'hours')).toBe(2);
  });

  test('diff in days', () => {
    const a = T.create(2024, 6, 20);
    const b = T.create(2024, 6, 15);
    expect(T.diff(a, b, 'days')).toBe(5);
  });
});

describe('duration', () => {
  test('breakdown', () => {
    const ms = 2 * 86400000 + 3 * 3600000 + 15 * 60000 + 30 * 1000 + 500;
    const d = T.duration(ms);
    expect(d.days).toBe(2);
    expect(d.hours).toBe(3);
    expect(d.minutes).toBe(15);
    expect(d.seconds).toBe(30);
    expect(d.ms).toBe(500);
    expect(d.total).toBe(ms);
  });
});

describe('formatDuration', () => {
  test('short format', () => {
    const ms = 2 * 3600000 + 15 * 60000 + 30 * 1000;
    expect(T.formatDuration(ms)).toBe('2h 15m 30s');
  });

  test('long format', () => {
    const ms = 3 * 86400000 + 4 * 3600000;
    expect(T.formatDuration(ms, { short: false })).toBe('3 days, 4 hours');
  });

  test('zero', () => {
    expect(T.formatDuration(0)).toBe('0s');
  });
});

describe('calendar helpers', () => {
  test('daysInMonth', () => {
    expect(T.daysInMonth(2024, 2)).toBe(29); // leap
    expect(T.daysInMonth(2023, 2)).toBe(28);
    expect(T.daysInMonth(2024, 1)).toBe(31);
    expect(T.daysInMonth(2024, 4)).toBe(30);
  });

  test('isLeapYear', () => {
    expect(T.isLeapYear(2024)).toBe(true);
    expect(T.isLeapYear(2023)).toBe(false);
    expect(T.isLeapYear(2000)).toBe(true);
    expect(T.isLeapYear(1900)).toBe(false);
  });

  test('dayOfWeek returns 1-7', () => {
    const mon = T.create(2024, 1, 1); // Monday
    expect(T.dayOfWeek(mon)).toBe(1);
    const sun = T.create(2024, 1, 7); // Sunday
    expect(T.dayOfWeek(sun)).toBe(7);
  });

  test('dayOfWeekName', () => {
    expect(T.dayOfWeekName(T.create(2024, 1, 1))).toBe('Monday');
  });

  test('weekNumber', () => {
    const dt = T.create(2024, 1, 1);
    expect(T.weekNumber(dt)).toBe(1);
  });
});

describe('toISO round-trip', () => {
  test('round-trip', () => {
    const dt = T.create(2024, 6, 15, 10, 30, 0);
    const iso = T.toISO(dt);
    expect(typeof iso).toBe('string');
    const dt2 = T.parse(iso);
    expect(dt2.year).toBe(2024);
    expect(dt2.month).toBe(6);
    expect(dt2.day).toBe(15);
  });
});

describe('toDate', () => {
  test('returns native Date', () => {
    const dt = T.create(2024, 6, 15);
    const d = T.toDate(dt);
    expect(d instanceof Date).toBe(true);
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5); // 0-based
  });
});
