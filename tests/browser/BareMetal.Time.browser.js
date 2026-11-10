BareMetal.TestRunner.installGlobals();

describe('BareMetal.Time', function () {
  var T = BareMetal.Time;

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

  test('now() returns valid dt shape', function () { dtShape(T.now()); });
  test('utcNow() returns valid dt shape', function () { dtShape(T.utcNow()); });

  test('parse from ISO string', function () {
    var dt = T.parse('2024-06-15T10:30:00');
    dtShape(dt);
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(6);
    expect(dt.day).toBe(15);
  });

  test('parse from timestamp', function () {
    var ts = new Date(2024, 5, 15, 10, 30).getTime();
    var dt = T.parse(ts);
    dtShape(dt);
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(6);
  });

  test('parse from Date instance', function () {
    var dt = T.parse(new Date(2024, 0, 1));
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(1);
    expect(dt.day).toBe(1);
  });

  test('create uses 1-based months', function () {
    var dt = T.create(2024, 3, 15);
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(3);
    expect(dt.day).toBe(15);
    expect(dt.hour).toBe(0);
  });

  test('create with time components', function () {
    var dt = T.create(2024, 12, 25, 14, 30, 45, 123);
    expect(dt.hour).toBe(14);
    expect(dt.minute).toBe(30);
    expect(dt.second).toBe(45);
    expect(dt.ms).toBe(123);
  });

  test('format YYYY-MM-DD HH:mm', function () {
    expect(T.format(T.create(2026, 4, 20, 17, 29), 'YYYY-MM-DD HH:mm')).toBe('2026-04-20 17:29');
  });

  test('format full month and day names', function () {
    expect(T.format(T.create(2024, 1, 1), 'dddd, MMMM DD')).toBe('Monday, January 01');
  });

  test('format short month and day names', function () {
    expect(T.format(T.create(2024, 1, 1), 'ddd, MMM DD')).toBe('Mon, Jan 01');
  });

  test('formatRelative recent past', function () {
    var base = T.create(2024, 6, 15, 12, 0, 0);
    var dt = T.create(2024, 6, 15, 11, 57, 0);
    expect(T.formatRelative(dt, base)).toMatch(/3 minutes ago/);
  });

  test('formatRelative future', function () {
    var base = T.create(2024, 6, 15, 12, 0, 0);
    var dt = T.create(2024, 6, 15, 14, 0, 0);
    expect(T.formatRelative(dt, base)).toMatch(/2 hours/i);
  });

  test('add days is immutable', function () {
    var dt = T.create(2024, 1, 15);
    var dt2 = T.add(dt, 10, 'days');
    expect(dt.day).toBe(15);
    expect(dt2.day).toBe(25);
  });

  test('add months', function () {
    var dt2 = T.add(T.create(2024, 1, 15), 1, 'months');
    expect(dt2.month).toBe(2);
    expect(dt2.day).toBe(15);
  });

  test('subtract hours', function () {
    expect(T.subtract(T.create(2024, 6, 15, 10), 3, 'hours').hour).toBe(7);
  });

  test('add years', function () {
    expect(T.add(T.create(2024, 6, 15), 2, 'years').year).toBe(2026);
  });

  test('startOf day', function () {
    var s = T.startOf(T.create(2024, 6, 15, 14, 30, 45, 123), 'day');
    expect(s.hour).toBe(0);
    expect(s.minute).toBe(0);
    expect(s.second).toBe(0);
    expect(s.ms).toBe(0);
    expect(s.day).toBe(15);
  });

  test('endOf month leap year', function () {
    var e = T.endOf(T.create(2024, 2, 10), 'month');
    expect(e.day).toBe(29);
    expect(e.hour).toBe(23);
    expect(e.minute).toBe(59);
  });

  test('startOf month', function () {
    var s = T.startOf(T.create(2024, 6, 15), 'month');
    expect(s.day).toBe(1);
    expect(s.hour).toBe(0);
  });

  test('isBefore / isAfter / isSame / isBetween', function () {
    var a = T.create(2024, 6, 15, 10, 0);
    var b = T.create(2024, 6, 15, 14, 0);
    var c = T.create(2024, 6, 15, 18, 0);
    expect(T.isBefore(a, b)).toBe(true);
    expect(T.isBefore(b, a)).toBe(false);
    expect(T.isAfter(b, a)).toBe(true);
    expect(T.isSame(a, a)).toBe(true);
    expect(T.isSame(a, b)).toBe(false);
    expect(T.isSame(a, b, 'day')).toBe(true);
    expect(T.isSame(a, b, 'hour')).toBe(false);
    expect(T.isBetween(b, a, c)).toBe(true);
    expect(T.isBetween(a, b, c)).toBe(false);
  });

  test('diff in ms hours and days', function () {
    expect(T.diff(T.create(2024, 6, 15, 12, 0, 0), T.create(2024, 6, 15, 10, 0, 0))).toBe(7200000);
    expect(T.diff(T.create(2024, 6, 15, 12, 0, 0), T.create(2024, 6, 15, 10, 0, 0), 'hours')).toBe(2);
    expect(T.diff(T.create(2024, 6, 20), T.create(2024, 6, 15), 'days')).toBe(5);
  });
});
