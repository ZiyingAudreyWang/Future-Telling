(function () {
  const INVENTORY_KEY = 'dearFridge.inventory.v5';
  const LEGACY_INVENTORY_KEYS = ['dearFridge.inventory.v2', 'dearFridge.inventory.v3', 'dearFridge.inventory.v4'];
  const BASKET_KEY = 'dearFridge.basket.v4';
  const LEGACY_BASKET_KEYS = ['dearFridge.basket.v2', 'dearFridge.basket.v3'];
  const catalog = window.DearFridgeData.ingredients;
  const catalogMap = new Map(catalog.map((item) => [item.id, item]));
  // Keep the classroom demo in its original, carefully composed moment.
  // Freshness labels and visual stories must not drift as the real calendar moves on.
  const DEMO_TODAY = '2026-11-12';

  const demoToday = () => new Date(`${DEMO_TODAY}T12:00:00`);

  const isoFromToday = (offset) => {
    const date = demoToday();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  function seedInventory() {
    const inventory = catalog.map((item) => ({
      ...item,
      expiryDate: isoFromToday(item.expiryOffset)
    }));
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    LEGACY_INVENTORY_KEYS.forEach((key) => localStorage.removeItem(key));
    return inventory;
  }

  function getInventory() {
    try {
      const saved = JSON.parse(localStorage.getItem(INVENTORY_KEY));
      if (!Array.isArray(saved)) return seedInventory();
      return catalog.map((base) => {
        const prior = saved.find((item) => item.id === base.id);
        if (!prior) return { ...base, expiryDate: isoFromToday(base.expiryOffset) };
        return {
          ...base,
          quantity: Number.isFinite(prior.quantity) ? prior.quantity : base.quantity,
          expiryDate: prior.expiryDate || isoFromToday(base.expiryOffset),
          storedDays: Number.isFinite(prior.storedDays) ? prior.storedDays : base.storedDays
        };
      });
    } catch (_) {
      return seedInventory();
    }
  }

  function saveInventory(inventory) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    window.dispatchEvent(new CustomEvent('dearfridge:inventory'));
  }

  function getItem(id) {
    return getInventory().find((item) => item.id === id);
  }

  function setQuantity(id, quantity) {
    const inventory = getInventory();
    const item = inventory.find((entry) => entry.id === id);
    if (!item) return null;
    item.quantity = Math.max(0, Math.round(quantity * 100) / 100);
    saveInventory(inventory);
    return item;
  }

  function changeQuantity(id, delta) {
    const item = getItem(id);
    return item ? setQuantity(id, item.quantity + delta) : null;
  }

  function restockItem(id, purchaseQuantity) {
    const inventory = getInventory();
    const item = inventory.find((entry) => entry.id === id);
    if (!item || purchaseQuantity <= 0) return null;
    const replaceOldStock = freshnessFor(item).state === 'past-date' && item.dateType === 'use-by';
    item.quantity = Math.round((replaceOldStock ? purchaseQuantity : item.quantity + purchaseQuantity) * 100) / 100;
    item.expiryDate = isoFromToday(item.shelfLifeDays || item.expiryOffset);
    item.storedDays = 0;
    saveInventory(inventory);
    return item;
  }

  function daysUntil(dateString) {
    const target = new Date(`${dateString}T12:00:00`);
    return Math.ceil((target - demoToday()) / 86400000);
  }

  function statusFor(item) {
    const freshness = freshnessFor(item);
    if (item.quantity <= 0) return { label: 'All Gone', className: 'status-out' };
    if (freshness.state === 'past-date') return { label: 'Date Passed', className: 'status-past' };
    if (freshness.state === 'near-expiry') return { label: 'Use Soon', className: 'status-soon' };
    if (freshness.state === 'forgotten') return { label: 'Quietly Waiting', className: 'status-forgotten' };
    if (item.restockThreshold > 0 && item.quantity <= item.restockThreshold) return { label: 'Running Low', className: 'status-low' };
    if (freshness.state === 'best-window') return { label: 'Best Time to Eat', className: 'status-best' };
    return { label: 'Fresh & Happy', className: 'status-fresh' };
  }

  function freshnessFor(item) {
    if (item.quantity <= 0) return { state: 'consumed', label: 'Consumed', message: 'This item has been used and its reminder has gone quiet.' };
    const days = daysUntil(item.expiryDate);
    if (days < 0) return { state: 'past-date', label: 'Date passed', message: item.dateType === 'use-by' ? 'The simulated use-by date has passed. Check storage history and official food-safety guidance before deciding what to do.' : 'The simulated best-before date has passed. Quality may decline, but appearance alone cannot determine safety.' };
    if (item.freshnessState === 'forgotten' && item.storedDays >= 30) return { state: 'forgotten', label: 'Forgotten food', message: `Quietly stored for about ${item.storedDays || 'many'} days. Bring it back into a meal plan.` };
    if (days <= 2) return { state: 'near-expiry', label: 'Near its date', message: 'A gentle reminder to plan this food into a meal soon.' };
    if (days <= 6) return { state: 'best-window', label: 'Best eating window', message: 'This is a lovely time to enjoy it.' };
    return { state: 'fresh', label: 'Fresh', message: 'Still comfortably within its estimated storage window.' };
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${dateString}T12:00:00`));
  }

  function isUsableForRecipe(item) {
    if (!item || item.quantity <= 0) return false;
    const freshness = freshnessFor(item);
    return !(freshness.state === 'past-date' && item.dateType === 'use-by');
  }

  function restockSuggestionFor(item) {
    const freshness = freshnessFor(item);
    if (freshness.state === 'past-date' && item.dateType === 'use-by') return { source: 'date-passed', priority: 0 };
    if (item.quantity <= 0 && item.restockThreshold > 0) return { source: 'out-of-stock', priority: 1 };
    const runningLow = item.restockThreshold > 0 && item.quantity <= item.restockThreshold;
    if (runningLow && freshness.state !== 'near-expiry' && freshness.state !== 'past-date') return { source: 'low-stock', priority: 2 };
    return null;
  }

  function formatQuantity(item, value = item.quantity) {
    const number = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
    let unit = item.unit;
    if (number === 1) {
      unit = { cups: 'cup', pcs: 'pc', slices: 'slice', fillets: 'fillet' }[unit] || unit;
    }
    return `${number} ${unit}`;
  }

  function iconMarkup(item, className = '') {
    return item.image
      ? `<img class="ingredient-icon ${className}" src="${item.image}" alt="${item.name} watercolor illustration">`
      : `<span class="ingredient-fallback ${className}" aria-hidden="true">✦</span>`;
  }

  function getBasket() {
    try {
      const state = JSON.parse(localStorage.getItem(BASKET_KEY));
      if (state && Array.isArray(state.items)) return state;
      LEGACY_BASKET_KEYS.forEach((key) => localStorage.removeItem(key));
      return { items: [], dismissed: [] };
    } catch (_) {
      return { items: [], dismissed: [] };
    }
  }

  function saveBasket(state) {
    localStorage.setItem(BASKET_KEY, JSON.stringify(state));
    LEGACY_BASKET_KEYS.forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('dearfridge:basket'));
  }

  function addToBasket(id, purchaseQuantity, source = 'manual') {
    const item = catalogMap.get(id);
    if (!item) return;
    const state = getBasket();
    const existing = state.items.find((entry) => entry.id === id);
    if (existing) {
      existing.purchaseQuantity = Math.max(existing.purchaseQuantity, purchaseQuantity || item.suggestedBuy);
      existing.checked = false;
    } else {
      state.items.push({ id, purchaseQuantity: purchaseQuantity || item.suggestedBuy, checked: false, source });
    }
    state.dismissed = state.dismissed.filter((entryId) => entryId !== id);
    saveBasket(state);
  }

  function canMake(requirements) {
    const inventory = getInventory();
    const missing = [];
    Object.entries(requirements).forEach(([id, amount]) => {
      const item = inventory.find((entry) => entry.id === id) || catalogMap.get(id);
      const have = isUsableForRecipe(item) ? item.quantity : 0;
      if (have < amount) missing.push({ id, amount, have, shortfall: amount - have, item, reason: item && !isUsableForRecipe(item) ? 'date-passed' : 'quantity' });
    });
    return { ready: missing.length === 0, missing };
  }

  function consume(requirements) {
    const check = canMake(requirements);
    if (!check.ready) return check;
    const inventory = getInventory();
    Object.entries(requirements).forEach(([id, amount]) => {
      const item = inventory.find((entry) => entry.id === id);
      item.quantity = Math.max(0, item.quantity - amount);
    });
    saveInventory(inventory);
    return { ready: true, missing: [] };
  }

  function toast(message) {
    let element = document.querySelector('.toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'toast';
      element.setAttribute('role', 'status');
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.add('show');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => element.classList.remove('show'), 2600);
  }

  function prefersQuietMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function floatActionDelta(button, text) {
    if (prefersQuietMotion()) return;
    const rect = button.getBoundingClientRect();
    const note = document.createElement('span');
    note.className = 'action-delta';
    note.textContent = text;
    note.style.left = `${rect.left + rect.width / 2}px`;
    note.style.top = `${rect.top}px`;
    document.body.appendChild(note);
    window.setTimeout(() => note.remove(), 950);
  }

  function drawSelectionTrail(origin) {
    if (prefersQuietMotion() || window.innerWidth <= 780) return;
    const panel = document.getElementById('fridge-detail');
    if (!panel) return;
    document.querySelector('.selection-trail')?.remove();
    const from = origin.getBoundingClientRect();
    const to = panel.getBoundingClientRect();
    const startX = from.left + from.width / 2;
    const startY = from.top + from.height / 2;
    const endX = to.left + 10;
    const endY = Math.min(to.top + 94, to.bottom - 40);
    const distance = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    const trail = document.createElement('span');
    trail.className = 'selection-trail';
    trail.style.left = `${startX}px`;
    trail.style.top = `${startY}px`;
    trail.style.width = `${distance}px`;
    trail.style.transform = `rotate(${angle}deg)`;
    document.body.appendChild(trail);
    window.setTimeout(() => trail.remove(), 1100);
  }

  function resetDemo() {
    localStorage.removeItem(INVENTORY_KEY);
    LEGACY_INVENTORY_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(BASKET_KEY);
    LEGACY_BASKET_KEYS.forEach((key) => localStorage.removeItem(key));
    seedInventory();
    toast('The little kitchen is fresh again.');
    window.setTimeout(() => window.location.reload(), 380);
  }

  function bindCommon() {
    document.querySelectorAll('[data-reset-demo]').forEach((button) => button.addEventListener('click', () => {
      if (window.confirm('Reset all inventory and shopping-list changes?')) resetDemo();
    }));

    const page = document.body.dataset.page;
    document.querySelectorAll('.site-nav a[data-page]').forEach((link) => {
      if (link.dataset.page === page) link.setAttribute('aria-current', 'page');
    });
  }

  function renderFridgeDetail(id) {
    const panel = document.getElementById('fridge-detail');
    const item = getItem(id);
    if (!panel || !item) return;
    const status = statusFor(item);
    const days = daysUntil(item.expiryDate);
    const freshness = freshnessFor(item);
    const dateLabel = item.dateType === 'use-by' ? 'Use by' : 'Best before';
    const remainingLabel = days < 0 ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} past` : days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} left`;
    panel.innerHTML = `
      <div class="note-tape" aria-hidden="true"></div>
      <p class="hand-label">A note from shelf ${item.storageZone.toLowerCase()}</p>
      <div class="detail-heading">
        ${iconMarkup(item, 'detail-icon')}
        <div><h2>${item.name}</h2><span class="status-chip ${status.className}">${status.label}</span></div>
      </div>
      <section class="living-note-section freshness-note">
        <div class="note-section-heading"><span aria-hidden="true">✦</span><h3>Freshness</h3></div>
        <strong>${freshness.label} · ${remainingLabel}</strong>
        <p>${freshness.message}</p>
        <small>${dateLabel}: ${formatDate(item.expiryDate)} · ${formatQuantity(item)} remaining</small>
      </section>
      <div class="detail-actions">
        <button class="paper-button primary" data-action="consume" ${item.quantity <= 0 ? 'disabled' : ''}>Mark as consumed</button>
        <button class="paper-button warm" data-action="basket">Add to basket</button>
      </div>`;

    panel.classList.remove('note-enter');
    void panel.offsetWidth;
    panel.classList.add('note-enter');
    panel.querySelector('[data-action="consume"]').addEventListener('click', (event) => {
      if (item.quantity <= 0) return toast(`${item.shortName || item.name} is already gone.`);
      floatActionDelta(event.currentTarget, 'consumed ✓');
      setQuantity(id, 0);
      renderFridgeDetail(id);
      renderCategoryView();
      toast(`${item.shortName || item.name} marked as consumed. Its reminder is now quiet.`);
    });
    panel.querySelector('[data-action="basket"]').addEventListener('click', () => {
      addToBasket(id, item.suggestedBuy);
      toast(`${item.shortName || item.name} is on the little shopping list.`);
    });
  }

  function renderHotspots() {
    const layer = document.getElementById('hotspot-layer');
    if (!layer) return;
    const debug = new URLSearchParams(window.location.search).get('debug') === '1';
    if (debug) document.body.classList.add('debug-hotspots');
    layer.innerHTML = '';
    const ambientIds = new Set(['milk', 'leftover-curry', 'strawberries', 'tomatoes', 'frozen-salmon']);
    window.DearFridgeData.hotspots.forEach((spot, index) => {
      const item = catalogMap.get(spot.id);
      const button = document.createElement('button');
      button.className = 'hotspot';
      if (ambientIds.has(spot.id)) {
        button.classList.add('ambient-cue');
        button.style.setProperty('--cue-delay', `${index * 0.43}s`);
      }
      button.type = 'button';
      button.dataset.id = spot.id;
      button.setAttribute('aria-label', `View ${item.shortName || item.name}`);
      button.style.cssText = `left:${spot.x}%;top:${spot.y}%;width:${spot.w}%;height:${spot.h}%;`;
      button.innerHTML = `<span>${item.shortName || item.name}</span>`;
      button.addEventListener('click', () => {
        layer.querySelectorAll('.hotspot').forEach((entry) => entry.classList.toggle('selected', entry === button));
        renderFridgeDetail(spot.id);
        window.requestAnimationFrame(() => drawSelectionTrail(button));
      });
      layer.appendChild(button);
    });
  }

  function initFridgeMotion() {
    if (prefersQuietMotion()) return;
    const stage = document.querySelector('.fridge-stage');
    const art = document.querySelector('.fridge-art-wrap');
    const whisper = document.getElementById('fridge-whisper');
    if (!stage || !art) return;

    stage.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 5;
      art.style.setProperty('--drift-x', `${x.toFixed(2)}px`);
      art.style.setProperty('--drift-y', `${y.toFixed(2)}px`);
    });
    stage.addEventListener('pointerleave', () => {
      art.style.setProperty('--drift-x', '0px');
      art.style.setProperty('--drift-y', '0px');
    });

    if (!whisper) return;
    const notes = [
      { text: 'use me soon', x: 8, y: 32 },
      { text: 'something lovely for dinner?', x: 58, y: 43 },
      { text: 'a little color for today', x: 9, y: 67 },
      { text: 'the freezer remembers too', x: 57, y: 84 }
    ];
    let noteIndex = 0;
    const showNextNote = () => {
      whisper.classList.remove('show');
      window.setTimeout(() => {
        const note = notes[noteIndex % notes.length];
        whisper.textContent = note.text;
        whisper.style.setProperty('--whisper-x', `${note.x}%`);
        whisper.style.setProperty('--whisper-y', `${note.y}%`);
        whisper.classList.add('show');
        noteIndex += 1;
      }, 320);
    };
    window.setTimeout(showNextNote, 1300);
    window.setInterval(showNextNote, 4300);
  }

  function renderCategoryView() {
    const host = document.getElementById('category-view');
    if (!host) return;
    const groups = ['Fruits', 'Vegetables', 'Dairy & Drinks', 'Meat & Protein', 'Frozen Food', 'Others'];
    const inventory = getInventory().filter((item) => item.id !== 'rice');
    host.innerHTML = groups.map((group, index) => {
      const items = inventory.filter((item) => item.category === group);
      return `<section class="category-section" style="--tilt:${index % 2 ? '0.35deg' : '-0.35deg'}">
        <div class="category-title"><span>${String(index + 1).padStart(2, '0')}</span><h2>${group}</h2></div>
        <div class="ingredient-ribbon">${items.map((item) => {
          const status = statusFor(item);
          return `<button class="ingredient-card" type="button" data-id="${item.id}">
            <span class="mini-pin" aria-hidden="true"></span>
            ${iconMarkup(item)}
            <strong>${item.shortName || item.name}</strong>
            <small>${formatQuantity(item)}</small>
            <em class="${status.className}">${status.label}</em>
          </button>`;
        }).join('')}</div>
      </section>`;
    }).join('');
    host.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => {
      document.querySelector('[data-view="inside"]')?.click();
      renderFridgeDetail(button.dataset.id);
      const hotspot = document.querySelector(`.hotspot[data-id="${button.dataset.id}"]`);
      document.getElementById('fridge-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function initFridge() {
    if (document.body.dataset.page !== 'fridge') return;
    renderHotspots();
    renderCategoryView();
    const inside = document.getElementById('inside-view');
    const category = document.getElementById('category-view');
    document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
      const showInside = button.dataset.view === 'inside';
      inside.hidden = !showInside;
      category.hidden = showInside;
      const shown = showInside ? inside : category;
      shown.classList.remove('view-reveal');
      void shown.offsetWidth;
      shown.classList.add('view-reveal');
      document.querySelectorAll('[data-view]').forEach((entry) => {
        entry.classList.toggle('active', entry === button);
        entry.setAttribute('aria-pressed', String(entry === button));
      });
    }));
    initFridgeMotion();
  }

  window.DearFridge = {
    catalog,
    getInventory,
    saveInventory,
    getItem,
    setQuantity,
    changeQuantity,
    restockItem,
    daysUntil,
    statusFor,
    freshnessFor,
    formatDate,
    isUsableForRecipe,
    restockSuggestionFor,
    formatQuantity,
    iconMarkup,
    getBasket,
    saveBasket,
    addToBasket,
    canMake,
    consume,
    toast,
    resetDemo,
    renderFridgeDetail
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindCommon();
    initFridge();
  });
})();
