# Dear Fridge — When Food Speaks Through Motion

An interactive three-page watercolor kitchen diary. Food freshness appears as quiet motion around the original illustrated food, while one shared demo inventory continues to drive the existing recipe book and restocking pages.

## Run locally

Serve the project over HTTP so browser storage and page navigation behave consistently:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Pages and files

- `index.html` — full illustrated fridge, responsive hotspots, and category view.
- `recipes.html` / `recipes.js` — inventory-aware recipe book and cooking flow.
- `restock.html` / `restock.js` — low-stock suggestions, manual list editing, shopping links, and simulated restocking.
- `data.js` — the ingredient catalog, unchanged hotspot map, existing recipes, and freshness metadata.
- `script.js` — shared `localStorage` inventory, basket, practical food notes, and fridge interactions.
- `living-fridge.js` — the freshness overlay, including flies, wrapped sweep glows, sleeping reminders, and quiet breathing.
- `style.css` — responsive paper, watercolor, note, book, and list styling.
- `assets/icons/` — 33 transparent watercolor ingredient crops plus a matching generated rice icon.
- `scripts/crop_ingredients.py` — reproducible Pillow crop script for `ingredients-sheet.png`.
- `reflection.md` — course reflection draft.

## Inventory and synchronization

Every ingredient is defined once in `data.js`, including its ID, display name, category, icon, starting quantity, unit, expiry offset, storage zone, restock threshold, and suggested purchase quantity. `livingProfiles` adds only freshness-related metadata: date type, stored days, and visual cue. Freshness state is derived from the date offset so the two cannot drift apart. The browser creates expiry dates relative to the first run and stores the shared inventory under `dearFridge.inventory.v5`.

All three pages use that same record. Using food on the fridge page, cooking a recipe, or marking shopping as purchased updates the shared inventory immediately. Use **Reset demo** in the header to restore the original quantities, dates, and basket.

## Adjusting hotspots

Hotspots live in the `hotspots` array in `data.js`. Coordinates are percentages of the original 1122 × 1402 fridge image:

```js
{ id: 'milk', x: 11.8, y: 4.8, w: 11.5, h: 15.2 }
```

Open `index.html?debug=1` to show every hotspot boundary and label while tuning. The image is never cropped, so these percentage positions scale with it.

## Re-cropping icons

With Pillow installed, run:

```powershell
python scripts/crop_ingredients.py
```

The script uses hand-tuned bounding boxes, trims each crop to its alpha channel, adds transparent padding, and writes optimized RGBA PNGs to `assets/icons/`.

## Adjusting demo dates

Edit `expiryOffset` on an ingredient in `data.js`, then use **Reset demo** in the header. Offsets are days relative to the reset date: `-1` is yesterday, `1–2` becomes near expiry, `3–6` becomes the best eating window, and `7+` stays fresh. Set `visualCue` in `livingProfiles` to `fly`, `sparkle`, `sleep`, or `breathe` to choose the visible demo treatment. The special `forgotten` state uses `forcedFreshnessState: 'forgotten'`.

The default presentation plan is deliberately limited and internally checked:

- Date passed: blueberry yogurt (`-1`), shown only through its written status without covering the artwork.
- Near expiry: leftover curry (`+1`), strawberries (`+2`), and spinach (`+2`), all with flies.
- Best window: milk, bread, grapes, and tomatoes (`+4` to `+5`), all with a wrapped golden glow and moving light sweep.
- Fresh example: frozen salmon with a quiet breathing glow.
- Forgotten example: frozen lasagna with the sleeping indicator.

Restocking uses `shelfLifeDays`, not the presentation offset. A purchased replacement receives a new future date, resets its stored-day counter, and wakes a forgotten food. Near-expiry food is intentionally not suggested for early repurchase; it enters the basket only after it is consumed, runs low outside the near-expiry window, or passes a use-by date and needs review.

## Core behaviors

- Keyboard-accessible food hotspots and two synchronized fridge views.
- Freshness mode with clickable returning flies, golden best-window sparkles, a sleeping forgotten-food cue, and a quiet fresh-food breath.
- A single freshness experience with no nutrition particles, recipe connections, or mode switching.
- Practical handwritten notes with date type, remaining time, storage guidance, consume, and shopping actions.
- Quantity-aware recipe scoring, missing-ingredient checks, use-soon priority, and one-time confirmed inventory deduction.
- Computed restock suggestions, custom purchase quantities, removable list items, and real Walmart search links.
- Shared, persistent `localStorage` state and responsive desktop/mobile layouts. Reduced-motion preferences suppress decorative movement without hiding information.

## Artwork

`fridge-full.png` and `ingredients-sheet.png` are the original supplied watercolor assets. The website preserves the full refrigerator composition and derives all ingredient icons directly from the supplied transparent sheet; no replacement artwork is generated.
