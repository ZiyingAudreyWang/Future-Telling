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
storage.set('dearFridge.inventory.v3', '[]');
storage.set('dearFridge.basket.v2', JSON.stringify({ items: [{ id: 'milk', source: 'automatic' }], dismissed: [] }));
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
  CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
  document: { addEventListener() {}, querySelectorAll: () => [] },
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

for (const file of ['data.js', 'script.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const data = windowObject.DearFridgeData;
const fridge = windowObject.DearFridge;
const ids = new Set(data.ingredients.map((item) => item.id));
const hotspotIds = data.hotspots.map((spot) => spot.id);

assert.equal(data.ingredients.length, 34, 'catalog should keep all 33 fridge foods plus pantry rice');
assert.equal(data.hotspots.length, 33, 'all original visible hotspots should remain');
assert.equal(new Set(hotspotIds).size, hotspotIds.length, 'hotspot IDs should be unique');
hotspotIds.forEach((id) => assert.ok(ids.has(id), `hotspot ${id} must map to a catalog item`));
data.ingredients.forEach((item) => assert.ok(Number.isInteger(item.shelfLifeDays) && item.shelfLifeDays > 0, `${item.id} needs a replacement shelf life`));
data.recipes.forEach((recipe) => Object.keys(recipe.requirements).forEach((id) => assert.ok(ids.has(id), `${recipe.id} uses known ingredient ${id}`)));

const inventory = fridge.getInventory();
const state = (id) => fridge.freshnessFor(inventory.find((item) => item.id === id)).state;
const visibleStates = inventory.filter((item) => hotspotIds.includes(item.id)).reduce((counts, item) => {
  const itemState = fridge.freshnessFor(item).state;
  counts[itemState] = (counts[itemState] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(JSON.parse(JSON.stringify(visibleStates)), { 'past-date': 1, fresh: 24, 'near-expiry': 3, 'best-window': 4, forgotten: 1 });
assert.equal(state('blueberry-yogurt'), 'past-date');
assert.equal(state('strawberries'), 'near-expiry');
assert.equal(state('tomatoes'), 'best-window');
assert.equal(state('frozen-salmon'), 'fresh');
assert.equal(state('frozen-lasagna'), 'forgotten');
assert.equal(data.livingProfiles.strawberries.visualCue, 'fly');
assert.equal(data.livingProfiles.tomatoes.visualCue, 'sparkle');
assert.equal(storage.has('dearFridge.inventory.v3'), false, 'legacy inventory should be cleared');
fridge.getBasket();
assert.equal(storage.has('dearFridge.basket.v2'), false, 'legacy restock basket should be cleared');

const cueStates = { fly: 'near-expiry', sparkle: 'best-window', muted: 'past-date', sleep: 'forgotten', breathe: 'fresh' };
const cueCounts = {};
inventory.filter((item) => item.visualCue).forEach((item) => {
  assert.equal(state(item.id), cueStates[item.visualCue], `${item.id} cue must match its date-driven state`);
  cueCounts[item.visualCue] = (cueCounts[item.visualCue] || 0) + 1;
});
assert.deepEqual(JSON.parse(JSON.stringify(cueCounts)), { sparkle: 4, muted: 1, fly: 3, breathe: 1, sleep: 1 });
data.ingredients.forEach((item) => {
  if (item.freshnessState !== 'forgotten') assert.equal(item.freshnessState, data.freshnessStateFromOffset(item.expiryOffset), `${item.id} plan should derive from its date`);
});

assert.equal(fridge.restockSuggestionFor(fridge.getItem('blueberry-yogurt')).source, 'date-passed');
assert.equal(fridge.restockSuggestionFor(fridge.getItem('apples')).source, 'low-stock');
assert.equal(fridge.restockSuggestionFor(fridge.getItem('popsicles')).source, 'low-stock');
assert.equal(fridge.restockSuggestionFor(fridge.getItem('rice')).source, 'out-of-stock');
assert.equal(fridge.restockSuggestionFor(fridge.getItem('milk')), null);
for (const id of ['leftover-curry', 'strawberries', 'spinach']) assert.equal(fridge.restockSuggestionFor(fridge.getItem(id)), null, `${id} should be used soon, not restocked early`);

fridge.restockItem('blueberry-yogurt', 2);
assert.equal(fridge.freshnessFor(fridge.getItem('blueberry-yogurt')).state, 'fresh', 'replacement yogurt should receive a new date');
assert.equal(fridge.daysUntil(fridge.getItem('blueberry-yogurt').expiryDate), 10);
fridge.restockItem('frozen-lasagna', 1);
assert.equal(fridge.freshnessFor(fridge.getItem('frozen-lasagna')).state, 'fresh', 'restocked forgotten food should wake up');

fridge.setQuantity('strawberries', 0);
assert.equal(fridge.freshnessFor(fridge.getItem('strawberries')).state, 'consumed');

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const reference of ['style.css', 'data.js', 'script.js', 'living-fridge.js', 'fridge-full.png']) {
  assert.ok(index.includes(reference), `index should reference ${reference}`);
  assert.ok(fs.existsSync(path.join(root, reference)), `${reference} should exist`);
}
assert.ok(!/sensory(?:-data)?\.js/.test(index), 'obsolete sensory scripts should not be loaded');

for (const page of ['index.html', 'recipes.html', 'restock.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|#)/.test(reference)) continue;
    const localPath = reference.split('?')[0];
    assert.ok(fs.existsSync(path.join(root, localPath)), `${page} references missing file ${localPath}`);
  }
}

const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'CSS braces should be balanced');

console.log('Living Fridge smoke test passed: data, states, recipes, assets, and consumption behavior are consistent.');
