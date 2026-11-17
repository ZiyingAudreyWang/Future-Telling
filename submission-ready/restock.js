(function () {
  const automaticSources = new Set(['automatic', 'low-stock', 'out-of-stock', 'date-passed']);

  function suggestionFor(item) {
    return DearFridge.restockSuggestionFor(item);
  }

  function listEntries() {
    const inventory = DearFridge.getInventory();
    const state = DearFridge.getBasket();
    const suggestions = new Map(inventory.map((item) => [item.id, suggestionFor(item)]).filter(([, suggestion]) => suggestion));
    state.items = state.items.filter((entry) => !automaticSources.has(entry.source) || suggestions.has(entry.id));
    const byId = new Map(state.items.map((entry) => [entry.id, entry]));
    inventory.forEach((item) => {
      const suggestion = suggestions.get(item.id);
      if (!suggestion || state.dismissed.includes(item.id)) return;
      const existing = byId.get(item.id);
      if (existing && automaticSources.has(existing.source)) {
        existing.source = suggestion.source;
        existing.priority = suggestion.priority;
      } else if (!existing) {
        const entry = { id: item.id, purchaseQuantity: item.suggestedBuy, checked: false, source: suggestion.source, priority: suggestion.priority };
        state.items.push(entry);
        byId.set(item.id, entry);
      }
    });
    state.items.sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
    DearFridge.saveBasket(state);
    return state.items;
  }

  function sourceLabel(source) {
    return {
      'date-passed': 'date review',
      'out-of-stock': 'all gone',
      'low-stock': 'running low',
      recipe: 'for a recipe',
      manual: 'added by you'
    }[source] || 'fridge note';
  }

  function rowMarkup(entry, index) {
    const item = DearFridge.getItem(entry.id);
    if (!item) return '';
    const search = encodeURIComponent(item.shortName || item.name);
    return `<li class="shopping-row ${entry.checked ? 'checked' : ''}" data-id="${entry.id}" style="--row-tilt:${index % 2 ? '0.2deg' : '-0.2deg'}">
      <label class="drawn-check">
        <input type="checkbox" ${entry.checked ? 'checked' : ''} aria-label="Mark ${item.name} for purchase">
        <span aria-hidden="true"></span>
      </label>
      <div class="shopping-icon">${DearFridge.iconMarkup(item)}</div>
      <div class="shopping-copy">
        <div class="shopping-name"><h2>${item.shortName || item.name}</h2><span class="list-source ${automaticSources.has(entry.source) ? 'automatic' : ''}">${sourceLabel(entry.source)}</span></div>
        <p>${entry.source === 'date-passed' ? `Simulated ${item.dateType} date passed · replace after review` : `${DearFridge.formatQuantity(item)} left`} <span aria-hidden="true">·</span> <strong>Suggested: ${DearFridge.formatQuantity(item, entry.purchaseQuantity)}</strong></p>
      </div>
      <label class="quantity-edit"><span>Buy</span><input type="number" min="0.1" step="${item.unit === 'ml' || item.unit === 'g' ? 50 : 1}" value="${entry.purchaseQuantity}" aria-label="Purchase quantity for ${item.name}"><small>${item.unit}</small></label>
      <div class="shopping-actions">
        <a class="shop-link" href="https://www.walmart.com/search?q=${search}" target="_blank" rel="noopener">Shop now ↗</a>
        <button class="remove-link" type="button">Remove</button>
      </div>
    </li>`;
  }

  function renderList() {
    const host = document.getElementById('shopping-list');
    const empty = document.getElementById('empty-list');
    if (!host) return;
    const entries = listEntries();
    host.innerHTML = entries.map(rowMarkup).join('');
    empty.hidden = entries.length > 0;
    document.getElementById('basket-count').textContent = String(entries.length);
    document.getElementById('purchase-button').disabled = !entries.some((entry) => entry.checked);

    host.querySelectorAll('.shopping-row').forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('input[type="checkbox"]').addEventListener('change', (event) => {
        const state = DearFridge.getBasket();
        const entry = state.items.find((item) => item.id === id);
        if (entry) entry.checked = event.currentTarget.checked;
        DearFridge.saveBasket(state);
        row.classList.toggle('checked', event.currentTarget.checked);
        document.getElementById('purchase-button').disabled = !state.items.some((item) => item.checked);
      });
      row.querySelector('input[type="number"]').addEventListener('change', (event) => {
        const value = Number(event.currentTarget.value);
        const state = DearFridge.getBasket();
        const entry = state.items.find((item) => item.id === id);
        if (entry && value > 0) entry.purchaseQuantity = value;
        DearFridge.saveBasket(state);
        renderList();
      });
      row.querySelector('.remove-link').addEventListener('click', () => {
        const state = DearFridge.getBasket();
        const removed = state.items.find((item) => item.id === id);
        state.items = state.items.filter((item) => item.id !== id);
        if (removed && automaticSources.has(removed.source) && !state.dismissed.includes(id)) state.dismissed.push(id);
        DearFridge.saveBasket(state);
        renderList();
        DearFridge.toast('Removed from this shopping list.');
      });
    });
  }

  function populateIngredientPicker() {
    const select = document.getElementById('manual-ingredient');
    DearFridge.catalog.filter((item) => item.id !== 'rice').forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.shortName || item.name;
      select.appendChild(option);
    });
  }

  function addManualItem() {
    const select = document.getElementById('manual-ingredient');
    const id = select.value;
    if (!id) return DearFridge.toast('Choose an ingredient first.');
    const item = DearFridge.getItem(id);
    DearFridge.addToBasket(id, item.suggestedBuy, 'manual');
    select.value = '';
    renderList();
    DearFridge.toast(`${item.shortName || item.name} added to the page.`);
  }

  function openPurchaseDialog() {
    const state = DearFridge.getBasket();
    const checked = state.items.filter((item) => item.checked);
    if (!checked.length) return;
    const dialog = document.getElementById('purchase-dialog');
    dialog.querySelector('.purchase-summary').innerHTML = `
      <p class="hand-label">Back from the market?</p>
      <h2>Put these away</h2>
      <p>These amounts will be added to your shared fridge inventory.</p>
      <ul>${checked.map((entry) => {
        const item = DearFridge.getItem(entry.id);
        return `<li>${DearFridge.iconMarkup(item)}<span>${item.shortName || item.name}</span><strong>+ ${DearFridge.formatQuantity(item, entry.purchaseQuantity)}</strong></li>`;
      }).join('')}</ul>
      <div class="dialog-actions"><button class="text-link" type="button" data-cancel>Not yet</button><button class="paper-button primary" type="button" data-confirm>Yes, restock my fridge</button></div>`;
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close(), { once: true });
    dialog.querySelector('[data-confirm]').addEventListener('click', () => {
      const latest = DearFridge.getBasket();
      latest.items.filter((entry) => entry.checked).forEach((entry) => {
        const item = DearFridge.getItem(entry.id);
        DearFridge.restockItem(entry.id, entry.purchaseQuantity);
      });
      latest.items = latest.items.filter((entry) => !entry.checked);
      DearFridge.saveBasket(latest);
      dialog.close();
      renderList();
      DearFridge.toast('Everything is tucked back into the fridge.');
    }, { once: true });
    dialog.showModal();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'restock') return;
    populateIngredientPicker();
    renderList();
    document.getElementById('manual-add').addEventListener('click', addManualItem);
    document.getElementById('purchase-button').addEventListener('click', openPurchaseDialog);
    document.getElementById('purchase-dialog').addEventListener('click', (event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
  });
})();
