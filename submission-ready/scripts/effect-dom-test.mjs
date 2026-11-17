import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storage = new Map();
const localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};
const baseDocument = { addEventListener() {}, querySelectorAll: () => [] };
const windowObject = {
  localStorage,
  dispatchEvent() {},
  addEventListener() {},
  matchMedia: () => ({ matches: false }),
  setTimeout,
  clearTimeout,
  location: { search: '', href: '' }
};
const context = vm.createContext({
  window: windowObject,
  localStorage,
  document: baseDocument,
  CustomEvent: class CustomEvent {},
  URLSearchParams,
  Intl,
  Date,
  Map,
  Set,
  Math,
  Number,
  JSON,
  console
});

for (const file of ['data.js', 'script.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });

class ClassList {
  constructor(owner) { this.owner = owner; this.values = new Set(); }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  toggle(value, force) { if (force ?? !this.values.has(value)) this.values.add(value); else this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.style = { setProperty: (name, value) => { this.style[name] = value; } };
    this.classList = new ClassList(this);
    this.textContent = '';
  }
  set className(value) { value.split(/\s+/).filter(Boolean).forEach((name) => this.classList.add(name)); }
  get className() { return [...this.classList.values].join(' '); }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  appendChild(child) { this.children.push(child); child.parent = this; return child; }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  get childElementCount() { return this.children.length; }
  get offsetWidth() { return 800; }
}

const wrap = new FakeElement('div');
const hotspotLayer = new FakeElement('div');
const modeHint = new FakeElement('p');
const modeButtons = ['freshness', 'nutrition', 'recipes'].map((mode) => {
  const button = new FakeElement('button');
  button.dataset.fridgeMode = mode;
  return button;
});
let livingInit;
const fakeDocument = {
  body: { dataset: { page: 'fridge' } },
  createElement: (tagName) => new FakeElement(tagName),
  createElementNS: (_namespace, tagName) => new FakeElement(tagName),
  addEventListener: (name, listener) => { if (name === 'DOMContentLoaded') livingInit = listener; },
  querySelector: (selector) => selector === '.fridge-art-wrap' ? wrap : null,
  querySelectorAll: (selector) => selector === '[data-fridge-mode]' ? modeButtons : [],
  getElementById: (id) => ({ 'hotspot-layer': hotspotLayer, 'mode-hint': modeHint }[id] || null)
};
context.document = fakeDocument;
context.DearFridge = windowObject.DearFridge;
vm.runInContext(fs.readFileSync(path.join(root, 'living-fridge.js'), 'utf8'), context, { filename: 'living-fridge.js' });
assert.equal(typeof livingInit, 'function', 'Living Fridge should register its initializer');
livingInit();

const effectLayer = wrap.children.find((child) => child.classList.contains('living-effect-layer'));
assert.ok(effectLayer, 'freshness effect layer should be attached to the refrigerator');
const effectCounts = effectLayer.children.reduce((counts, child) => {
  const type = [...child.classList.values].find((name) => name.endsWith('-effect') && name !== 'food-effect');
  counts[type] = (counts[type] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(effectCounts, {
  'sparkle-effect': 4,
  'muted-effect': 1,
  'fly-effect': 3,
  'breathe-effect': 1,
  'sleep-effect': 1
});
const flies = effectLayer.children.filter((child) => child.classList.contains('fly-effect')).flatMap((child) => child.children).filter((child) => child.classList.contains('tiny-fly'));
assert.equal(flies.length, 4, 'three near-expiry foods should render four clickable flies');
const sparkleGlows = effectLayer.children.filter((child) => child.classList.contains('sparkle-effect'));
assert.equal(sparkleGlows.length, 4, 'four best-window foods should render wrapped sweep glows');
sparkleGlows.forEach((glow) => assert.equal(glow.children.length, 0, 'best-window glow should not use loose particles'));
assert.equal(effectLayer.dataset.effectCount, '10');
assert.match(modeHint.textContent, /3 foods need attention/);

console.log('Living Fridge effect DOM test passed: 10 freshness overlays and 4 clickable flies were generated.');
