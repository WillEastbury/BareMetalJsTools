const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
const { JSDOM, VirtualConsole } = require('jsdom');
const { indexedDB } = require('fake-indexeddb');
const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

const repoRoot = process.cwd();
const htmlPath = path.join(repoRoot, 'examples', 'uber-demo.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/(src|href)="\.\.\/src\/([^"]+)"/g, (_, attr, rel) => {
  const abs = 'file:///' + path.join(repoRoot, 'src', rel).replace(/\\/g, '/');
  return `${attr}="${abs}"`;
});

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', err => errors.push(String(err && err.stack || err)));
vc.on('error', msg => errors.push(String(msg)));

const dom = new JSDOM(html, {
  url: 'http://localhost/examples/uber-demo.html?tab=dashboard',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(win) {
    win.TextEncoder = TextEncoder;
    win.TextDecoder = TextDecoder;
    win.indexedDB = indexedDB;
    win.IDBKeyRange = FDBKeyRange;
    win.fetch = global.fetch.bind(global);
    win.Response = global.Response;
    win.Request = global.Request;
    win.Headers = global.Headers;
    win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    win.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 16);
    win.cancelAnimationFrame = id => clearTimeout(id);
    win.navigator.clipboard = { readText: async () => '', writeText: async () => {} };
    win.navigator.mediaDevices = { getUserMedia: async () => { throw new Error('not available'); } };
    win.navigator.geolocation = { getCurrentPosition: (_, reject) => reject && reject({ message: 'not available' }) };
    win.Notification = function () {};
    win.Notification.permission = 'denied';
    win.Notification.requestPermission = async () => 'denied';
    win.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; } };
    win.alert = () => {};
    win.confirm = () => true;
    win.prompt = () => '';
    win.open = () => null;
    Object.defineProperty(win.HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value() {
        return {
          clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {}, closePath() {},
          save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, fillText() {}, strokeText() {}, setLineDash() {}, measureText(txt) { return { width: String(txt).length * 8 }; },
          createLinearGradient() { return { addColorStop() {} }; }, createRadialGradient() { return { addColorStop() {} }; }
        };
      }
    });
  }
});

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await wait(2500);
  const { document } = dom.window;
  const title = document.querySelector('.hero-title')?.textContent?.trim();
  const active = document.querySelector('.spa-section.active')?.getAttribute('data-tab');
  const tabCount = document.querySelectorAll('.tab-link').length;
  const sectionCount = document.querySelectorAll('.spa-section').length;
  if (!title || !/BareMetalJsTools/.test(title)) throw new Error(`Unexpected hero title: ${title}`);
  if (tabCount !== 10) throw new Error(`Expected 10 tabs, got ${tabCount}`);
  if (sectionCount !== 10) throw new Error(`Expected 10 sections, got ${sectionCount}`);
  if (!active) throw new Error('No active section after boot');
  if (errors.length) throw new Error('Runtime errors:\n' + errors.join('\n---\n'));
  console.log('SMOKE_OK');
  console.log('HERO_TITLE=' + title);
  console.log('ACTIVE_TAB=' + active);
  console.log('TAB_COUNT=' + tabCount);
  console.log('SECTION_COUNT=' + sectionCount);
})().catch(err => {
  console.error(err && err.stack || err);
  process.exit(1);
});
