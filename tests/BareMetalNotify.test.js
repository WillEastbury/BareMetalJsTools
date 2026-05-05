/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

function loadNotify() {
  const code = fs.readFileSync(path.resolve(__dirname, '../src/BareMetal.Notify.js'), 'utf8');
  const fn = new Function('BareMetal', 'module', code + '\nreturn BareMetal.Notify;');
  return fn({}, { exports: {} });
}

describe('BareMetal.Notify', () => {
  let Notify;
  let realRAF;
  let realMatchMedia;
  let createSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    realRAF = global.requestAnimationFrame;
    realMatchMedia = global.matchMedia;
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    global.matchMedia = jest.fn().mockReturnValue({ matches: false });
    global.Notification = function Notification(title, opts) {
      this.title = title;
      this.options = opts;
    };
    global.Notification.permission = 'default';
    global.Notification.requestPermission = jest.fn().mockResolvedValue('granted');
    createSpy = jest.spyOn(document, 'createElement');
    Notify = loadNotify();
    Notify.configure({ maxVisible: 5, defaultDuration: 3000, defaultPosition: 'top-right', gap: 8, animate: true, zIndex: 99999, theme: 'auto' });
  });

  afterEach(() => {
    Notify.dismissAll();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.requestAnimationFrame = realRAF;
    global.matchMedia = realMatchMedia;
    createSpy.mockRestore();
    delete global.Notification;
  });

  test('creates and dismisses a toast', () => {
    const t = Notify.toast('Hello world', { title: 'Hi', duration: 0 });
    expect(createSpy).toHaveBeenCalledWith('div');
    expect(Notify.count()).toBe(1);
    expect(document.body.textContent).toContain('Hello world');
    expect(document.querySelector('[data-bm-notify-id="' + t.id + '"]')).toBeTruthy();

    t.dismiss();
    jest.advanceTimersByTime(250);
    expect(Notify.count()).toBe(0);
    expect(document.querySelector('[data-bm-notify-id="' + t.id + '"]')).toBeNull();
  });

  test('queues toasts when maxVisible is reached', () => {
    Notify.configure({ maxVisible: 1 });
    const first = Notify.toast('First', { duration: 0 });
    const second = Notify.toast('Second', { duration: 0 });

    expect(Notify.count()).toBe(2);
    expect(document.body.textContent).toContain('First');
    expect(document.body.textContent).not.toContain('Second');

    first.dismiss();
    jest.advanceTimersByTime(250);
    expect(document.body.textContent).toContain('Second');
    expect(document.querySelector('[data-bm-notify-id="' + second.id + '"]')).toBeTruthy();
  });

  test('configure updates defaults', () => {
    Notify.configure({ defaultDuration: 1500, defaultPosition: 'bottom-left', gap: 12, maxVisible: 2, zIndex: 1234 });
    Notify.toast('Configured');
    const container = document.querySelector('[data-bm-notify-container="toast:bottom-left"]');
    expect(container).toBeTruthy();
    expect(container.style.bottom).toBe('16px');
    expect(container.style.gap).toBe('12px');
    expect(container.style.zIndex).toBe('1234');

    jest.advanceTimersByTime(1700);
    expect(document.body.textContent).not.toContain('Configured');
  });

  test('progress notifications update complete and error', () => {
    const p = Notify.progress('Uploading...', { position: 'bottom-right' });
    const toast = document.querySelector('[data-bm-notify-id="' + p.id + '"]');
    const bar = toast.lastChild;

    p.update(0.5, 'Half way');
    expect(bar.style.width).toBe('50%');
    expect(toast.textContent).toContain('Half way');

    p.complete('Done!');
    expect(toast.getAttribute('data-bm-notify-type')).toBe('success');
    expect(bar.style.width).toBe('100%');
    expect(toast.textContent).toContain('Done!');

    const p2 = Notify.progress('Working');
    const toast2 = document.querySelector('[data-bm-notify-id="' + p2.id + '"]');
    p2.error('Failed');
    expect(toast2.getAttribute('data-bm-notify-type')).toBe('error');
    expect(toast2.textContent).toContain('Failed');
  });

  test('creates a banner notification', () => {
    const action = jest.fn();
    const b = Notify.banner('Saved changes', { position: 'bottom', action: { text: 'Undo', onClick: action }, sticky: true });
    const banner = document.querySelector('[data-bm-notify-id="' + b.id + '"]');
    expect(banner).toBeTruthy();
    expect(document.querySelector('[data-bm-notify-container="banner:bottom"]')).toBeTruthy();
    expect(banner.textContent).toContain('Saved changes');
    banner.querySelector('button').click();
    expect(action).toHaveBeenCalled();
  });

  test('permission helpers reflect Notification state', async () => {
    global.Notification.permission = 'granted';
    expect(Notify.permission()).toBe('granted');
    await expect(Notify.requestPermission()).resolves.toBe('granted');
  });

  test('convenience methods create typed toasts', () => {
    Notify.success('Good', { duration: 0 });
    Notify.error('Bad', { duration: 0 });
    Notify.warning('Careful', { duration: 0 });
    Notify.info('FYI', { duration: 0 });

    expect(document.querySelector('[data-bm-notify-type="success"]')).toBeTruthy();
    expect(document.querySelector('[data-bm-notify-type="error"]')).toBeTruthy();
    expect(document.querySelector('[data-bm-notify-type="warning"]')).toBeTruthy();
    expect(document.querySelector('[data-bm-notify-type="info"]')).toBeTruthy();
  });
});
