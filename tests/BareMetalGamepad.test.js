/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Gamepad.js');

function loadGamepad() {
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function(code + '\nreturn BareMetal.Gamepad;');
  return fn();
}

function setNav(name, value) {
  Object.defineProperty(global.navigator, name, {
    configurable: true,
    writable: true,
    value
  });
}

function makeButton(value) {
  if (typeof value === 'object') return value;
  return { pressed: !!value, touched: !!value, value: value ? 1 : 0 };
}

function makePad(overrides = {}) {
  const buttons = (overrides.buttons || [0, 0, 0, 0, 0, 0, 0, 0]).map(makeButton);
  return {
    id: 'Xbox Wireless Controller',
    index: 0,
    buttons,
    axes: overrides.axes || [0, 0, 0, 0],
    connected: overrides.connected !== false,
    timestamp: overrides.timestamp || Date.now(),
    mapping: overrides.mapping == null ? 'standard' : overrides.mapping,
    ...overrides,
    buttons
  };
}

describe('BareMetal.Gamepad', () => {
  const originalGetGamepads = global.navigator.getGamepads;
  let originalRAF;
  let originalCAF;

  beforeEach(() => {
    originalRAF = global.requestAnimationFrame;
    originalCAF = global.cancelAnimationFrame;
    setNav('getGamepads', jest.fn(() => []));
  });

  afterEach(() => {
    setNav('getGamepads', originalGetGamepads);
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('deadzone rescales axis values', () => {
    const Gamepad = loadGamepad();

    expect(Gamepad.deadzone(0.05, 0.1)).toBe(0);
    expect(Gamepad.deadzone(0.5, 0.1)).toBeCloseTo((0.5 - 0.1) / 0.9, 5);
    expect(Gamepad.deadzone(-0.5, 0.1)).toBeCloseTo(-(0.5 - 0.1) / 0.9, 5);
  });

  test('poll returns connected states and button helpers reflect current state', () => {
    const pad = makePad({ buttons: [1, 0, 0, 0], axes: [0.4, 0] });
    setNav('getGamepads', jest.fn(() => [pad]));
    const Gamepad = loadGamepad();

    const states = Gamepad.poll();

    expect(states).toHaveLength(1);
    expect(states[0]).toEqual(expect.objectContaining({
      id: 'Xbox Wireless Controller',
      index: 0,
      connected: true,
      mapping: 'standard'
    }));
    expect(states[0].buttons[0]).toEqual(expect.objectContaining({ pressed: true, name: 'A' }));
    expect(Gamepad.getState(0)).toEqual(expect.objectContaining({ index: 0 }));
    expect(Gamepad.isPressed(0, 0)).toBe(true);
    expect(Gamepad.isPressed(0, 'a')).toBe(true);
  });

  test('getAxis applies configured deadzone', () => {
    const pad = makePad({ axes: [0.15, 0.5] });
    setNav('getGamepads', jest.fn(() => [pad]));
    const Gamepad = loadGamepad();

    Gamepad.start({ deadzone: 0.2, pollRate: 16 });
    Gamepad.stop();

    expect(Gamepad.getAxis(0, 0)).toBe(0);
    expect(Gamepad.getAxis(0, 1)).toBeCloseTo((0.5 - 0.2) / 0.8, 5);
  });

  test('emits connect, disconnect, button and axis events during polling', async () => {
    jest.useFakeTimers();
    let pads = [];
    setNav('getGamepads', jest.fn(() => pads));
    global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    const Gamepad = loadGamepad();
    const connect = jest.fn();
    const disconnect = jest.fn();
    const down = jest.fn();
    const up = jest.fn();
    const axis = jest.fn();

    Gamepad.on('connect', connect);
    Gamepad.on('disconnect', disconnect);
    Gamepad.on('buttondown', down);
    Gamepad.on('buttonup', up);
    Gamepad.on('axismove', axis);

    Gamepad.start({ pollRate: 16, deadzone: 0.1 });
    expect(connect).not.toHaveBeenCalled();

    pads = [makePad({ buttons: [1, 0, 0], axes: [0.6, 0], timestamp: 10 })];
    await jest.advanceTimersByTimeAsync(16);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(down).toHaveBeenCalledWith(expect.objectContaining({ button: 0, name: 'A' }));
    expect(axis).toHaveBeenCalledWith(expect.objectContaining({ axis: 0 }));

    pads = [makePad({ buttons: [0, 0, 0], axes: [0, 0], timestamp: 20 })];
    await jest.advanceTimersByTimeAsync(16);
    expect(up).toHaveBeenCalledWith(expect.objectContaining({ button: 0, name: 'A' }));

    pads = [];
    await jest.advanceTimersByTimeAsync(16);
    expect(disconnect).toHaveBeenCalledTimes(1);

    Gamepad.stop();
  });

  test('combo detects button sequences in order', () => {
    const Gamepad = loadGamepad();
    const hit = jest.fn();
    const cancel = Gamepad.combo(0, [0, 1, 2], hit, { timeout: 250 });
    let pad = makePad({ buttons: [0, 0, 0], timestamp: 1 });
    setNav('getGamepads', jest.fn(() => [pad]));

    Gamepad.poll();
    pad = makePad({ buttons: [1, 0, 0], timestamp: 10 });
    setNav('getGamepads', jest.fn(() => [pad]));
    Gamepad.poll();
    pad = makePad({ buttons: [0, 1, 0], timestamp: 20 });
    setNav('getGamepads', jest.fn(() => [pad]));
    Gamepad.poll();
    pad = makePad({ buttons: [0, 0, 1], timestamp: 30 });
    setNav('getGamepads', jest.fn(() => [pad]));
    Gamepad.poll();

    expect(hit).toHaveBeenCalledWith(expect.objectContaining({ index: 0, sequence: [0, 1, 2] }));
    cancel.cancel();
  });

  test('normalizes non-standard pads and maps actions', () => {
    const pad = makePad({
      id: 'Wireless Controller',
      mapping: '',
      buttons: [1, 0, 0, 0, 0, 0, 0, 1],
      axes: [0.3, -0.4]
    });
    setNav('getGamepads', jest.fn(() => [pad]));
    const Gamepad = loadGamepad();

    const normalized = Gamepad.normalize(pad);
    const mapped = Gamepad.map(0, { jump: 0, fire: 7, moveX: 0, moveY: 1 });

    expect(Gamepad.profiles.xbox.buttons[0]).toBe('A');
    expect(Gamepad.profiles.ps.buttons[0]).toBe('Cross');
    expect(normalized.profile).toBe('ps');
    expect(normalized.buttons[0]).toEqual(expect.objectContaining({ name: 'Cross', pressed: true }));
    expect(mapped).toEqual(expect.objectContaining({
      jump: true,
      fire: true,
      moveX: expect.any(Number),
      moveY: expect.any(Number)
    }));
    expect(mapped.moveX).toBeCloseTo((0.3 - 0.1) / 0.9, 5);
  });

  test('vibrate uses vibrationActuator and hapticActuators', async () => {
    const vibrationActuator = { playEffect: jest.fn().mockResolvedValue('complete') };
    const pulse = jest.fn().mockResolvedValue(true);
    const withActuator = makePad({ vibrationActuator });
    const withHaptics = makePad({ index: 1, hapticActuators: [{ pulse }] });
    setNav('getGamepads', jest.fn(() => [withActuator, withHaptics]));
    const Gamepad = loadGamepad();

    Gamepad.poll();

    await expect(Gamepad.vibrate(0, { duration: 120, weakMagnitude: 0.25, strongMagnitude: 0.75 })).resolves.toBe('complete');
    await expect(Gamepad.vibrate(1, { duration: 90, weakMagnitude: 0.2, strongMagnitude: 0.4 })).resolves.toBe(true);
    expect(vibrationActuator.playEffect).toHaveBeenCalledWith('dual-rumble', expect.objectContaining({
      duration: 120,
      weakMagnitude: 0.25,
      strongMagnitude: 0.75
    }));
    expect(pulse).toHaveBeenCalledWith(0.4, 90);
  });
});
