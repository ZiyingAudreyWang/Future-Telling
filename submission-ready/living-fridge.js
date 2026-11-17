(function () {
  const flyTimers = new Set();
  let effectLayer;

  const quietMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spotFor = (id) => window.DearFridgeData.hotspots.find((spot) => spot.id === id);

  function ensureLayer() {
    const wrap = document.querySelector('.fridge-art-wrap');
    if (!wrap) return false;
    effectLayer = document.createElement('div');
    effectLayer.className = 'living-effect-layer';
    wrap.appendChild(effectLayer);
    return true;
  }

  function clearFlyTimers() {
    flyTimers.forEach((timer) => window.clearTimeout(timer));
    flyTimers.clear();
  }

  function shellFor(item, spot, className) {
    const shell = document.createElement('div');
    shell.className = `food-effect ${className}`;
    shell.dataset.id = item.id;
    shell.style.cssText = `left:${spot.x}%;top:${spot.y}%;width:${spot.w}%;height:${spot.h}%;`;
    return shell;
  }

  function randomizeFlyPath(fly) {
    const range = (amount) => `${Math.round((Math.random() * 2 - 1) * amount)}px`;
    ['1', '2', '3', '4'].forEach((step) => {
      fly.style.setProperty(`--fly-x${step}`, range(22));
      fly.style.setProperty(`--fly-y${step}`, range(16));
    });
  }

  function scareFly(event) {
    event.preventDefault();
    event.stopPropagation();
    const fly = event.currentTarget;
    if (fly.classList.contains('is-away')) return;
    const angle = Math.random() * Math.PI * 2;
    const distance = 65 + Math.random() * 45;
    fly.classList.add('is-away');
    if (!quietMotion()) {
      const escapeAnimation = fly.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(.45) rotate(25deg)`, opacity: 0 }
      ], { duration: 360, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'forwards' });
      fly.escapeAnimation = escapeAnimation;
      escapeAnimation.onfinish = () => { fly.style.visibility = 'hidden'; };
    } else {
      fly.style.visibility = 'hidden';
    }
    const delay = 3000 + Math.random() * 2000;
    const timer = window.setTimeout(() => {
      flyTimers.delete(timer);
      const item = DearFridge.getItem(fly.dataset.foodId);
      if (!fly.isConnected || !item || item.quantity <= 0) return;
      randomizeFlyPath(fly);
      fly.escapeAnimation?.cancel();
      fly.escapeAnimation = null;
      fly.style.visibility = '';
      fly.classList.remove('is-away');
      if (!quietMotion()) fly.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260 });
    }, delay);
    flyTimers.add(timer);
  }

  function flyEffect(item, spot) {
    const shell = shellFor(item, spot, 'fly-effect');
    const count = item.id === 'leftover-curry' ? 2 : 1;
    for (let index = 0; index < count; index += 1) {
      const fly = document.createElement('button');
      fly.type = 'button';
      fly.className = 'tiny-fly';
      fly.dataset.foodId = item.id;
      fly.setAttribute('aria-label', `Shoo the tiny reminder near ${item.shortName || item.name}`);
      fly.style.setProperty('--fly-delay', `${index * -1.7}s`);
      fly.style.left = `${45 + index * 18}%`;
      fly.style.top = `${18 + index * 26}%`;
      randomizeFlyPath(fly);
      fly.innerHTML = '<i></i><b></b>';
      fly.addEventListener('animationiteration', () => randomizeFlyPath(fly));
      fly.addEventListener('click', scareFly);
      shell.appendChild(fly);
    }
    return shell;
  }

  function freshnessEffect(item, spot) {
    // Visual storytelling is intentionally locked to the original art direction.
    // It should not thin out merely because the viewer opens the demo on a later date.
    const lockedState = item.freshnessState;
    if (item.visualCue === 'fly' && lockedState === 'near-expiry') return flyEffect(item, spot);
    if (item.visualCue === 'sparkle' && lockedState === 'best-window') return shellFor(item, spot, 'sparkle-effect');
    if (item.visualCue === 'sleep' && lockedState === 'forgotten') {
      const shell = shellFor(item, spot, 'sleep-effect');
      shell.innerHTML = '<span>Z</span><span>z</span><span>z</span>';
      return shell;
    }
    if (item.visualCue === 'breathe' && lockedState === 'fresh') return shellFor(item, spot, 'breathe-effect');
    return null;
  }

  function renderEffects() {
    if (!effectLayer) return;
    clearFlyTimers();
    effectLayer.replaceChildren();
    const inventory = DearFridge.getInventory().filter((item) => item.quantity > 0 && spotFor(item.id));
    inventory.forEach((item) => {
      const effect = freshnessEffect(item, spotFor(item.id));
      if (effect) effectLayer.appendChild(effect);
    });
    const nearExpiry = inventory.filter((item) => item.freshnessState === 'near-expiry');
    const bestWindow = inventory.filter((item) => item.freshnessState === 'best-window');
    document.getElementById('mode-hint').textContent = `${nearExpiry.length} foods need attention · ${bestWindow.length} are in their best eating window.`;
    effectLayer.dataset.effectCount = String(effectLayer.childElementCount);
    effectLayer.classList.remove('layer-enter');
    void effectLayer.offsetWidth;
    effectLayer.classList.add('layer-enter');
  }

  function init() {
    if (document.body.dataset.page !== 'fridge' || !ensureLayer()) return;
    document.body.dataset.fridgeMode = 'freshness';
    const hotspots = document.getElementById('hotspot-layer');
    hotspots.addEventListener('pointerover', (event) => {
      const hotspot = event.target.closest('.hotspot');
      if (hotspot) effectLayer.querySelector(`.food-effect[data-id="${hotspot.dataset.id}"]`)?.classList.add('is-hovered');
    });
    hotspots.addEventListener('pointerout', (event) => {
      const hotspot = event.target.closest('.hotspot');
      if (hotspot) effectLayer.querySelector(`.food-effect[data-id="${hotspot.dataset.id}"]`)?.classList.remove('is-hovered');
    });
    window.addEventListener('dearfridge:inventory', renderEffects);
    renderEffects();
  }

  window.DearFridgeLiving = { renderEffects };
  document.addEventListener('DOMContentLoaded', init);
})();
