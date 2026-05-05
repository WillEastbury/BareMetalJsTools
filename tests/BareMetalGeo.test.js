/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Geo.js');

function loadGeo() {
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Geo;');
  return fn();
}

function setGeo(value) {
  Object.defineProperty(global.navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value
  });
}

describe('BareMetal.Geo', () => {
  const originalGeo = global.navigator.geolocation;
  const originalFetch = global.fetch;

  beforeEach(() => {
    setGeo(undefined);
    global.fetch = undefined;
    jest.restoreAllMocks();
  });

  afterEach(() => {
    setGeo(originalGeo);
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('getCurrentPosition normalises browser coordinates', async () => {
    const getCurrentPosition = jest.fn((success) => success({
      coords: {
        latitude: 51.5007,
        longitude: -0.1246,
        accuracy: 8,
        altitude: 15,
        heading: 180,
        speed: 3.2
      },
      timestamp: 12345
    }));
    setGeo({ getCurrentPosition });
    const Geo = loadGeo();

    await expect(Geo.getCurrentPosition({ enableHighAccuracy: true })).resolves.toEqual({
      lat: 51.5007,
      lng: -0.1246,
      accuracy: 8,
      altitude: 15,
      heading: 180,
      speed: 3.2,
      timestamp: 12345
    });
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { enableHighAccuracy: true });
  });

  test('watchPosition and clearWatch proxy geolocation updates', () => {
    const successHandlers = [];
    const watchPosition = jest.fn((success) => {
      successHandlers.push(success);
      return 99;
    });
    const clearWatch = jest.fn();
    const spy = jest.fn();
    setGeo({ watchPosition, clearWatch });
    const Geo = loadGeo();

    const id = Geo.watchPosition(spy, { maximumAge: 10 });
    successHandlers[0]({
      coords: { latitude: 40.7, longitude: -74, accuracy: 5, altitude: null, heading: null, speed: null },
      timestamp: 500
    });
    Geo.clearWatch(id);

    expect(id).toBe(99);
    expect(spy).toHaveBeenCalledWith({
      lat: 40.7,
      lng: -74,
      accuracy: 5,
      altitude: null,
      heading: null,
      speed: null,
      timestamp: 500
    });
    expect(watchPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { maximumAge: 10 });
    expect(clearWatch).toHaveBeenCalledWith(99);
  });

  test('distance, bearing and midpoint return known values', () => {
    const Geo = loadGeo();
    const d = Geo.distance({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    const b = Geo.bearing({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    const m = Geo.midpoint({ lat: 0, lng: 0 }, { lat: 0, lng: 2 });

    expect(d).toBeGreaterThan(111100);
    expect(d).toBeLessThan(111300);
    expect(b).toBeCloseTo(0, 5);
    expect(m.lat).toBeCloseTo(0, 6);
    expect(m.lng).toBeCloseTo(1, 6);
  });

  test('boundingBox expands around a centre point', () => {
    const Geo = loadGeo();
    const box = Geo.boundingBox({ lat: 0, lng: 0 }, 111195);

    expect(box.north).toBeCloseTo(1, 1);
    expect(box.south).toBeCloseTo(-1, 1);
    expect(box.east).toBeCloseTo(1, 1);
    expect(box.west).toBeCloseTo(-1, 1);
  });

  test('isInside uses ray casting for polygons', () => {
    const Geo = loadGeo();
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 10, lng: 10 },
      { lat: 10, lng: 0 }
    ];

    expect(Geo.isInside({ lat: 5, lng: 5 }, square)).toBe(true);
    expect(Geo.isInside({ lat: 10, lng: 5 }, square)).toBe(true);
    expect(Geo.isInside({ lat: -1, lng: 5 }, square)).toBe(false);
  });

  test('encode and decode geohash values', () => {
    const Geo = loadGeo();
    const hash = Geo.encode(57.64911, 10.40744, 11);
    const decoded = Geo.decode(hash);

    expect(hash).toBe('u4pruydqqvj');
    expect(decoded.lat).toBeCloseTo(57.64911, 3);
    expect(decoded.lng).toBeCloseTo(10.40744, 3);
    expect(decoded.error).toEqual(expect.objectContaining({ lat: expect.any(Number), lng: expect.any(Number) }));
  });

  test('track accumulates path and distance with start stop lifecycle', () => {
    const successHandlers = [];
    const watchPosition = jest.fn((success) => {
      successHandlers.push(success);
      return 7;
    });
    const clearWatch = jest.fn();
    setGeo({ watchPosition, clearWatch });
    const Geo = loadGeo();
    const seen = [];
    const tracker = Geo.track();
    tracker.onUpdate((state) => seen.push(state));

    tracker.start();
    tracker.start();
    successHandlers[0]({ coords: { latitude: 0, longitude: 0, accuracy: 1, altitude: null, heading: null, speed: null }, timestamp: 1 });
    successHandlers[0]({ coords: { latitude: 0, longitude: 1, accuracy: 1, altitude: null, heading: null, speed: null }, timestamp: 2 });
    tracker.stop();

    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(clearWatch).toHaveBeenCalledWith(7);
    expect(tracker.getPath()).toHaveLength(2);
    expect(tracker.getDistance()).toBeGreaterThan(111100);
    expect(tracker.getDistance()).toBeLessThan(111300);
    expect(seen).toHaveLength(2);
    expect(seen[1]).toEqual(expect.objectContaining({
      distance: tracker.getDistance(),
      point: expect.objectContaining({ lat: 0, lng: 1 })
    }));
  });

  test('geocode and reverseGeocode use Nominatim responses', async () => {
    const fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '51.5', lon: '-0.12', display_name: 'London', boundingbox: ['51.2', '51.8', '-0.5', '0.2'], type: 'city', class: 'place' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lat: '51.5', lon: '-0.12', display_name: 'London', type: 'city', class: 'place' })
      });
    global.fetch = fetch;
    const Geo = loadGeo();

    await expect(Geo.geocode('10 Downing Street')).resolves.toEqual([
      expect.objectContaining({ lat: 51.5, lng: -0.12, displayName: 'London' })
    ]);
    await expect(Geo.reverseGeocode(51.5, -0.12)).resolves.toEqual(
      expect.objectContaining({ lat: 51.5, lng: -0.12, displayName: 'London' })
    );
    expect(fetch.mock.calls[0][0]).toContain('search?format=jsonv2');
    expect(fetch.mock.calls[0][0]).toContain('10%20Downing%20Street');
    expect(fetch.mock.calls[1][0]).toContain('reverse?format=jsonv2');
  });
});
