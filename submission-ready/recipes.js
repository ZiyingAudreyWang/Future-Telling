(function () {
  let activeFilter = 'all';
  let selectedRecipe = null;

  function evaluate(recipe) {
    const inventory = DearFridge.getInventory();
    const check = DearFridge.canMake(recipe.requirements);
    const ids = Object.keys(recipe.requirements);
    const urgent = ids.some((id) => {
      const item = inventory.find((entry) => entry.id === id);
      return item && DearFridge.freshnessFor(item).state === 'near-expiry';
    });
    const owned = ids.length - check.missing.length;
    return { ...check, urgent, owned, total: ids.length };
  }

  function recommendation(recipe, result) {
    if (result.ready && result.urgent) return 'Everything is here — and one ingredient would love to be used soon.';
    if (result.ready) return 'Everything you need is already here!';
    if (result.missing.length === 1) return `Just missing ${result.missing[0].item.shortName || result.missing[0].item.name}.`;
    return `${result.owned} of ${result.total} ingredients are waiting in your kitchen.`;
  }

  function recipeIcons(recipe, large = false) {
    return `<div class="recipe-collage ${large ? 'large' : ''}">${Object.keys(recipe.requirements).slice(0, 4).map((id, index) => {
      const item = DearFridge.catalog.find((entry) => entry.id === id);
      return `<span style="--collage-rotate:${(index - 1.5) * 8}deg">${DearFridge.iconMarkup(item)}</span>`;
    }).join('')}</div>`;
  }

  function sortedRecipes() {
    const focus = new URLSearchParams(window.location.search).get('ingredient');
    return [...window.DearFridgeData.recipes].filter((recipe) => {
      if (activeFilter === 'all') return true;
      return recipe.tags.includes(activeFilter);
    }).sort((a, b) => {
      const aResult = evaluate(a);
      const bResult = evaluate(b);
      const aFocus = focus && Object.hasOwn(a.requirements, focus) ? 1 : 0;
      const bFocus = focus && Object.hasOwn(b.requirements, focus) ? 1 : 0;
      return bFocus - aFocus || Number(bResult.ready) - Number(aResult.ready) || Number(bResult.urgent) - Number(aResult.urgent) || a.time - b.time;
    });
  }

  function renderRecipes() {
    const host = document.getElementById('recipe-list');
    if (!host) return;
    const focus = new URLSearchParams(window.location.search).get('ingredient');
    host.innerHTML = sortedRecipes().map((recipe, index) => {
      const result = evaluate(recipe);
      const missingNames = result.missing.map((entry) => entry.item.shortName || entry.item.name).join(', ');
      const focused = focus && Object.hasOwn(recipe.requirements, focus);
      return `<article class="recipe-card ${result.ready ? 'recipe-ready' : ''} ${focused ? 'recipe-focused' : ''}" style="--card-tilt:${index % 2 ? '0.45deg' : '-0.45deg'};--card-hover-tilt:${index % 2 ? '-0.45deg' : '0.45deg'}">
        <div class="recipe-number">${String(index + 1).padStart(2, '0')}</div>
        ${focused ? '<span class="focus-ribbon">From your fridge →</span>' : ''}
        ${recipeIcons(recipe)}
        <div class="recipe-card-copy">
          <p class="hand-label">${result.ready ? 'ready to make' : 'almost there'}</p>
          <h2>${recipe.name}</h2>
          <p class="recipe-reason">${recommendation(recipe, result)}</p>
          <div class="recipe-meta"><span>${recipe.time} min</span><span>${result.owned}/${result.total} ingredients</span></div>
          ${result.missing.length ? `<p class="missing-line"><span>Missing</span> ${missingNames}</p>` : '<p class="ready-line">Your shelves have it all.</p>'}
          <button class="paper-button recipe-open" type="button" data-recipe="${recipe.id}">Open recipe <span aria-hidden="true">→</span></button>
        </div>
      </article>`;
    }).join('');
    host.querySelectorAll('[data-recipe]').forEach((button) => button.addEventListener('click', () => openRecipe(button.dataset.recipe)));
  }

  function requirementRow(id, amount) {
    const item = DearFridge.getItem(id);
    const enough = item.quantity >= amount;
    return `<li class="${enough ? 'have-it' : 'need-it'}">
      ${DearFridge.iconMarkup(item)}
      <span><strong>${item.shortName || item.name}</strong><small>Need ${DearFridge.formatQuantity(item, amount)} · Have ${DearFridge.formatQuantity(item)}</small></span>
      <b aria-label="${enough ? 'available' : 'missing'}">${enough ? '✓' : '＋'}</b>
    </li>`;
  }

  function openRecipe(id) {
    selectedRecipe = window.DearFridgeData.recipes.find((recipe) => recipe.id === id);
    if (!selectedRecipe) return;
    const result = evaluate(selectedRecipe);
    const dialog = document.getElementById('recipe-dialog');
    const content = dialog.querySelector('.dialog-content');
    content.innerHTML = `
      <button class="dialog-close" type="button" aria-label="Close recipe">×</button>
      <div class="recipe-spread">
        <section class="recipe-spread-art">
          <p class="hand-label">Dear kitchen, today we made…</p>
          ${recipeIcons(selectedRecipe, true)}
          <p class="scribble-note">${selectedRecipe.note}</p>
        </section>
        <section class="recipe-spread-copy">
          <p class="eyebrow">Recipe no. ${String(window.DearFridgeData.recipes.indexOf(selectedRecipe) + 1).padStart(2, '0')}</p>
          <h2>${selectedRecipe.name}</h2>
          <p class="recipe-reason">${recommendation(selectedRecipe, result)} Ready in ${selectedRecipe.time} minutes.</p>
          <h3>From the kitchen</h3>
          <ul class="requirement-list">${Object.entries(selectedRecipe.requirements).map(([itemId, amount]) => requirementRow(itemId, amount)).join('')}</ul>
          <h3>A little method</h3>
          <ol class="recipe-steps">${selectedRecipe.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
          <div class="dialog-actions">
            ${result.missing.length ? '<button class="paper-button warm" type="button" data-add-missing>Add missing ingredients to basket</button>' : ''}
            <button class="paper-button primary" type="button" data-made ${result.ready ? '' : 'disabled'}>I made this!</button>
          </div>
        </section>
      </div>`;
    content.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    content.querySelector('[data-add-missing]')?.addEventListener('click', () => {
      const current = evaluate(selectedRecipe);
      current.missing.forEach((entry) => DearFridge.addToBasket(entry.id, Math.max(entry.item.suggestedBuy, entry.shortfall), 'recipe'));
      DearFridge.toast('Missing ingredients tucked into your shopping list.');
    });
    content.querySelector('[data-made]').addEventListener('click', openCookConfirmation);
    dialog.showModal();
  }

  function openCookConfirmation() {
    const check = evaluate(selectedRecipe);
    if (!check.ready) {
      DearFridge.toast('A few ingredients are still missing.');
      return;
    }
    const dialog = document.getElementById('cook-dialog');
    dialog.querySelector('.cook-summary').innerHTML = `
      <div class="celebration-mark" aria-hidden="true">✦</div>
      <p class="hand-label">You made something delicious!</p>
      <h2>${selectedRecipe.name}</h2>
      <p>We’ll gently update your fridge by using:</p>
      <ul>${Object.entries(selectedRecipe.requirements).map(([id, amount]) => {
        const item = DearFridge.getItem(id);
        return `<li>${DearFridge.iconMarkup(item)}<span>${item.shortName || item.name}</span><strong>− ${DearFridge.formatQuantity(item, amount)}</strong></li>`;
      }).join('')}</ul>
      <div class="dialog-actions"><button class="text-link" type="button" data-cancel>Not yet</button><button class="paper-button primary" type="button" data-confirm-cook>Yes, update my fridge</button></div>`;
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close(), { once: true });
    dialog.querySelector('[data-confirm-cook]').addEventListener('click', (event) => {
      event.currentTarget.disabled = true;
      const result = DearFridge.consume(selectedRecipe.requirements);
      if (result.ready) {
        dialog.close();
        document.getElementById('recipe-dialog').close();
        renderRecipes();
        DearFridge.toast('Your fridge remembers what you cooked.');
      }
    }, { once: true });
    dialog.showModal();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page !== 'recipes') return;
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((entry) => {
        entry.classList.toggle('active', entry === button);
        entry.setAttribute('aria-pressed', String(entry === button));
      });
      renderRecipes();
    }));
    document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    }));
    renderRecipes();
  });
})();
