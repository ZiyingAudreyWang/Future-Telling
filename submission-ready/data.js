(function () {
  const icon = (id) => `assets/icons/${id}.png`;

  const ingredients = [
    { id: 'milk', name: 'Fresh Milk', shortName: 'Milk', category: 'Dairy & Drinks', image: icon('milk'), quantity: 500, unit: 'ml', expiryOffset: 4, storageZone: 'Top shelf', restockThreshold: 250, suggestedBuy: 1000, note: 'A quiet morning essential.' },
    { id: 'orange-juice', name: 'Orange Juice', category: 'Dairy & Drinks', image: icon('orange-juice'), quantity: 600, unit: 'ml', expiryOffset: 7, storageZone: 'Top shelf', restockThreshold: 250, suggestedBuy: 1000 },
    { id: 'blueberry-yogurt', name: 'Blueberry Yogurt', category: 'Dairy & Drinks', image: icon('blueberry-yogurt'), quantity: 1, unit: 'cup', expiryOffset: -1, storageZone: 'Top shelf', restockThreshold: 1, suggestedBuy: 2 },
    { id: 'strawberry-yogurt', name: 'Strawberry Yogurt', category: 'Dairy & Drinks', image: icon('strawberry-yogurt'), quantity: 2, unit: 'cups', expiryOffset: 8, storageZone: 'Top shelf', restockThreshold: 1, suggestedBuy: 2 },
    { id: 'cheese', name: 'Golden Cheese', shortName: 'Cheese', category: 'Dairy & Drinks', image: icon('cheese'), quantity: 180, unit: 'g', expiryOffset: 12, storageZone: 'Top shelf', restockThreshold: 80, suggestedBuy: 200 },
    { id: 'butter', name: 'Butter', category: 'Dairy & Drinks', image: icon('butter'), quantity: 120, unit: 'g', expiryOffset: 18, storageZone: 'Top shelf', restockThreshold: 50, suggestedBuy: 200 },
    { id: 'eggs', name: 'Farm Eggs', shortName: 'Eggs', category: 'Meat & Protein', image: icon('eggs'), quantity: 6, unit: 'pcs', expiryOffset: 9, storageZone: 'Middle shelf', restockThreshold: 3, suggestedBuy: 6 },
    { id: 'tofu', name: 'Silken Tofu', shortName: 'Tofu', category: 'Meat & Protein', image: icon('tofu'), quantity: 300, unit: 'g', expiryOffset: 7, storageZone: 'Middle shelf', restockThreshold: 150, suggestedBuy: 300 },
    { id: 'leftover-curry', name: 'Leftover Curry', category: 'Others', image: icon('leftover-curry'), quantity: 350, unit: 'g', expiryOffset: 1, storageZone: 'Middle shelf', restockThreshold: 0, suggestedBuy: 400, note: 'Use me tonight if you can.' },
    { id: 'fresh-meat', name: 'Fresh Pork', shortName: 'Fresh Meat', category: 'Meat & Protein', image: icon('fresh-meat'), quantity: 400, unit: 'g', expiryOffset: 7, storageZone: 'Middle shelf', restockThreshold: 150, suggestedBuy: 500 },
    { id: 'jam', name: 'Strawberry Jam', shortName: 'Jam', category: 'Others', image: icon('jam'), quantity: 140, unit: 'g', expiryOffset: 30, storageZone: 'Middle shelf', restockThreshold: 60, suggestedBuy: 250 },
    { id: 'bread', name: 'Milk Bread', shortName: 'Bread', category: 'Others', image: icon('bread'), quantity: 6, unit: 'slices', expiryOffset: 4, storageZone: 'Lower shelf', restockThreshold: 3, suggestedBuy: 8 },
    { id: 'apples', name: 'Red Apples', shortName: 'Apples', category: 'Fruits', image: icon('apples'), quantity: 2, unit: 'pcs', expiryOffset: 8, storageZone: 'Lower shelf', restockThreshold: 2, suggestedBuy: 4 },
    { id: 'strawberries', name: 'Strawberries', category: 'Fruits', image: icon('strawberries'), quantity: 8, unit: 'pcs', expiryOffset: 2, storageZone: 'Lower shelf', restockThreshold: 4, suggestedBuy: 12 },
    { id: 'grapes', name: 'Green Grapes', shortName: 'Grapes', category: 'Fruits', image: icon('grapes'), quantity: 300, unit: 'g', expiryOffset: 5, storageZone: 'Lower shelf', restockThreshold: 120, suggestedBuy: 400 },
    { id: 'dessert-cup', name: 'Berry Dessert Cup', shortName: 'Dessert Cup', category: 'Others', image: icon('dessert-cup'), quantity: 1, unit: 'cup', expiryOffset: 7, storageZone: 'Lower shelf', restockThreshold: 0, suggestedBuy: 2 },
    { id: 'lettuce', name: 'Leafy Lettuce', shortName: 'Lettuce', category: 'Vegetables', image: icon('lettuce'), quantity: 1, unit: 'head', expiryOffset: 7, storageZone: 'Crisper drawer', restockThreshold: 0, suggestedBuy: 1 },
    { id: 'spinach', name: 'Baby Spinach', shortName: 'Spinach', category: 'Vegetables', image: icon('spinach'), quantity: 180, unit: 'g', expiryOffset: 2, storageZone: 'Crisper drawer', restockThreshold: 80, suggestedBuy: 250 },
    { id: 'zucchini', name: 'Zucchini', category: 'Vegetables', image: icon('zucchini'), quantity: 2, unit: 'pcs', expiryOffset: 8, storageZone: 'Crisper drawer', restockThreshold: 1, suggestedBuy: 3 },
    { id: 'broccoli', name: 'Broccoli', category: 'Vegetables', image: icon('broccoli'), quantity: 250, unit: 'g', expiryOffset: 7, storageZone: 'Crisper drawer', restockThreshold: 120, suggestedBuy: 300 },
    { id: 'tomatoes', name: 'Vine Tomatoes', shortName: 'Tomatoes', category: 'Vegetables', image: icon('tomatoes'), quantity: 4, unit: 'pcs', expiryOffset: 4, storageZone: 'Crisper drawer', restockThreshold: 2, suggestedBuy: 6 },
    { id: 'carrots', name: 'Garden Carrots', shortName: 'Carrots', category: 'Vegetables', image: icon('carrots'), quantity: 3, unit: 'pcs', expiryOffset: 10, storageZone: 'Crisper drawer', restockThreshold: 2, suggestedBuy: 6 },
    { id: 'mushrooms', name: 'Brown Mushrooms', shortName: 'Mushrooms', category: 'Vegetables', image: icon('mushrooms'), quantity: 180, unit: 'g', expiryOffset: 7, storageZone: 'Crisper drawer', restockThreshold: 80, suggestedBuy: 250 },
    { id: 'corn', name: 'Sweet Corn', shortName: 'Corn', category: 'Vegetables', image: icon('corn'), quantity: 1, unit: 'cob', expiryOffset: 8, storageZone: 'Crisper drawer', restockThreshold: 0, suggestedBuy: 2 },
    { id: 'purple-sweet-potatoes', name: 'Purple Sweet Potatoes', category: 'Vegetables', image: icon('purple-sweet-potatoes'), quantity: 3, unit: 'pcs', expiryOffset: 15, storageZone: 'Crisper drawer', restockThreshold: 1, suggestedBuy: 4 },
    { id: 'frozen-dumplings', name: 'Frozen Dumplings', category: 'Frozen Food', image: icon('frozen-dumplings'), quantity: 8, unit: 'pcs', expiryOffset: 45, storageZone: 'Freezer', restockThreshold: 4, suggestedBuy: 12 },
    { id: 'frozen-salmon', name: 'Frozen Salmon', category: 'Frozen Food', image: icon('frozen-salmon'), quantity: 2, unit: 'fillets', expiryOffset: 50, storageZone: 'Freezer', restockThreshold: 1, suggestedBuy: 4 },
    { id: 'ice-cream', name: 'Strawberry Ice Cream', shortName: 'Ice Cream', category: 'Frozen Food', image: icon('ice-cream'), quantity: 350, unit: 'ml', expiryOffset: 60, storageZone: 'Freezer', restockThreshold: 120, suggestedBuy: 500 },
    { id: 'frozen-berries', name: 'Frozen Berries', category: 'Frozen Food', image: icon('frozen-berries'), quantity: 280, unit: 'g', expiryOffset: 55, storageZone: 'Freezer', restockThreshold: 120, suggestedBuy: 400 },
    { id: 'popsicles', name: 'Fruit Popsicles', shortName: 'Popsicles', category: 'Frozen Food', image: icon('popsicles'), quantity: 2, unit: 'pcs', expiryOffset: 70, storageZone: 'Freezer', restockThreshold: 2, suggestedBuy: 6 },
    { id: 'frozen-meat', name: 'Frozen Pork', shortName: 'Frozen Meat', category: 'Frozen Food', image: icon('frozen-meat'), quantity: 450, unit: 'g', expiryOffset: 40, storageZone: 'Freezer', restockThreshold: 200, suggestedBuy: 500 },
    { id: 'frozen-vegetables', name: 'Frozen Vegetables', category: 'Frozen Food', image: icon('frozen-vegetables'), quantity: 400, unit: 'g', expiryOffset: 65, storageZone: 'Freezer', restockThreshold: 150, suggestedBuy: 500 },
    { id: 'frozen-lasagna', name: 'Frozen Lasagna', category: 'Frozen Food', image: icon('frozen-lasagna'), quantity: 1, unit: 'tray', expiryOffset: 80, storageZone: 'Freezer', restockThreshold: 0, suggestedBuy: 1 },
    { id: 'rice', name: 'Japanese Rice', shortName: 'Rice', category: 'Others', image: icon('rice'), quantity: 0, unit: 'g', expiryOffset: 120, storageZone: 'Pantry', restockThreshold: 300, suggestedBuy: 1000, note: 'A pantry staple, currently missing.' }
  ];

  const hotspots = [
    { id: 'milk', x: 11.8, y: 4.8, w: 11.5, h: 15.2 },
    { id: 'orange-juice', x: 25.5, y: 6.0, w: 10.5, h: 14.3 },
    { id: 'blueberry-yogurt', x: 41.0, y: 9.2, w: 10.8, h: 9.6 },
    { id: 'strawberry-yogurt', x: 38.2, y: 13.4, w: 12.8, h: 7.5 },
    { id: 'cheese', x: 55.0, y: 12.5, w: 14.5, h: 7.4 },
    { id: 'butter', x: 72.3, y: 12.8, w: 17.0, h: 7.6 },
    { id: 'eggs', x: 7.4, y: 24.2, w: 19.0, h: 9.5 },
    { id: 'tofu', x: 27.5, y: 27.0, w: 13.8, h: 6.5 },
    { id: 'leftover-curry', x: 42.0, y: 24.7, w: 20.0, h: 8.8 },
    { id: 'fresh-meat', x: 63.0, y: 26.2, w: 18.5, h: 6.9 },
    { id: 'jam', x: 83.0, y: 25.0, w: 9.0, h: 8.3 },
    { id: 'bread', x: 8.6, y: 36.2, w: 21.0, h: 12.0 },
    { id: 'apples', x: 29.5, y: 38.0, w: 18.8, h: 10.5 },
    { id: 'strawberries', x: 48.0, y: 37.4, w: 15.5, h: 10.7 },
    { id: 'grapes', x: 63.0, y: 37.0, w: 17.2, h: 10.5 },
    { id: 'dessert-cup', x: 81.2, y: 38.0, w: 10.7, h: 10.0 },
    { id: 'lettuce', x: 3.8, y: 51.5, w: 16.5, h: 13.5 },
    { id: 'spinach', x: 18.3, y: 51.2, w: 15.5, h: 13.8 },
    { id: 'zucchini', x: 29.0, y: 56.7, w: 14.5, h: 7.5 },
    { id: 'broccoli', x: 35.0, y: 51.2, w: 14.2, h: 13.8 },
    { id: 'tomatoes', x: 52.5, y: 52.0, w: 13.3, h: 12.7 },
    { id: 'carrots', x: 61.5, y: 52.5, w: 10.0, h: 12.0 },
    { id: 'mushrooms', x: 67.0, y: 57.3, w: 13.0, h: 7.5 },
    { id: 'corn', x: 78.0, y: 51.0, w: 10.0, h: 13.0 },
    { id: 'purple-sweet-potatoes', x: 83.2, y: 56.0, w: 14.5, h: 9.0 },
    { id: 'frozen-dumplings', x: 7.5, y: 72.5, w: 21.5, h: 10.3 },
    { id: 'frozen-salmon', x: 30.2, y: 73.0, w: 21.5, h: 9.8 },
    { id: 'ice-cream', x: 52.0, y: 72.5, w: 20.5, h: 10.6 },
    { id: 'frozen-berries', x: 74.0, y: 71.8, w: 21.5, h: 11.0 },
    { id: 'popsicles', x: 6.0, y: 85.0, w: 19.5, h: 10.0 },
    { id: 'frozen-meat', x: 25.8, y: 85.5, w: 21.8, h: 9.5 },
    { id: 'frozen-vegetables', x: 48.7, y: 84.7, w: 21.3, h: 10.8 },
    { id: 'frozen-lasagna', x: 71.0, y: 85.5, w: 22.0, h: 9.5 }
  ];

  const recipes = [
    { id: 'tomato-egg', name: 'Tomato & Egg Stir-fry', time: 10, tags: ['quick', 'healthy', 'use-soon'], requirements: { tomatoes: 2, eggs: 2 }, steps: ['Slice the tomatoes and whisk the eggs.', 'Softly scramble the eggs, then set aside.', 'Cook tomatoes until glossy and tender.', 'Fold the eggs back in and season gently.'], note: 'The tomatoes are happiest when used soon.' },
    { id: 'strawberry-yogurt-bowl', name: 'Strawberry Yogurt Bowl', time: 5, tags: ['quick', 'healthy', 'use-soon'], requirements: { 'strawberry-yogurt': 1, strawberries: 5, 'frozen-berries': 40 }, steps: ['Spoon yogurt into your favorite bowl.', 'Slice the fresh strawberries.', 'Scatter fresh and frozen berries on top.'], note: 'A five-minute bowl for the berries nearing their best.' },
    { id: 'french-toast', name: 'Soft French Toast', time: 15, tags: ['quick', 'comfort'], requirements: { bread: 2, eggs: 1, milk: 80, butter: 10 }, steps: ['Whisk egg and milk in a shallow bowl.', 'Soak both sides of the bread.', 'Warm butter in a pan.', 'Cook until each side is softly golden.'], note: 'A cozy way to use bread and milk together.' },
    { id: 'vegetable-stir-fry', name: 'Garden Vegetable Stir-fry', time: 18, tags: ['healthy', 'use-soon'], requirements: { spinach: 60, zucchini: 1, broccoli: 100, carrots: 1, mushrooms: 80 }, steps: ['Wash and cut all vegetables.', 'Start with carrots and broccoli in a warm pan.', 'Add zucchini and mushrooms.', 'Fold in spinach at the very end.'], note: 'A colorful clear-out for the crisper drawer.' },
    { id: 'tofu-tomato', name: 'Tofu & Tomato Bowl', time: 16, tags: ['healthy', 'use-soon'], requirements: { tofu: 180, tomatoes: 2, spinach: 40 }, steps: ['Pat the tofu dry and cut into cubes.', 'Pan-sear until the edges are golden.', 'Add chopped tomatoes and simmer briefly.', 'Serve over a small nest of spinach.'], note: 'Tofu and tomatoes are both ready for their moment.' },
    { id: 'salmon-vegetables', name: 'Salmon with Vegetables', time: 25, tags: ['healthy'], requirements: { 'frozen-salmon': 1, broccoli: 120, carrots: 1 }, steps: ['Thaw the salmon safely.', 'Arrange salmon and vegetables on a tray.', 'Season and roast until the salmon flakes.', 'Rest for two minutes before serving.'], note: 'A balanced freezer-to-table supper.' },
    { id: 'mushroom-toast', name: 'Creamy Mushroom Toast', time: 15, tags: ['quick', 'comfort', 'use-soon'], requirements: { mushrooms: 120, bread: 2, milk: 60, butter: 10 }, steps: ['Toast the bread until crisp at the edges.', 'Sauté mushrooms in butter.', 'Add milk and reduce to a silky coating.', 'Spoon the mushrooms over warm toast.'], note: 'The mushrooms and bread are best enjoyed soon.' },
    { id: 'curry-rice', name: 'Leftover Curry Rice', time: 8, tags: ['quick', 'comfort', 'use-soon'], requirements: { 'leftover-curry': 250, rice: 180 }, steps: ['Warm the curry slowly until steaming.', 'Cook or reheat the rice.', 'Spoon curry beside the rice.', 'Finish with anything green from the fridge.'], note: 'Tonight’s kindest choice for yesterday’s curry.' }
  ];

  // Living Fridge demo data. Dates stay editable through each ingredient's
  // expiryOffset above; Reset demo recreates dates relative to the day it runs.
  const livingProfiles = {
    milk: { dateType: 'use-by', storedDays: 3, visualCue: 'sparkle' },
    'orange-juice': { dateType: 'best-before', storedDays: 2 },
    'blueberry-yogurt': { dateType: 'use-by', storedDays: 8 },
    'strawberry-yogurt': { dateType: 'use-by', storedDays: 4 },
    cheese: { dateType: 'best-before', storedDays: 5 },
    butter: { dateType: 'best-before', storedDays: 9 },
    eggs: { dateType: 'best-before', storedDays: 4 },
    tofu: { dateType: 'use-by', storedDays: 3 },
    'leftover-curry': { dateType: 'use-by', storedDays: 3, visualCue: 'fly' },
    'fresh-meat': { dateType: 'use-by', storedDays: 2 },
    jam: { dateType: 'best-before', storedDays: 14 },
    bread: { dateType: 'best-before', storedDays: 2, visualCue: 'sparkle' },
    apples: { dateType: 'best-before', storedDays: 4 },
    strawberries: { dateType: 'best-before', storedDays: 5, visualCue: 'fly' },
    grapes: { dateType: 'best-before', storedDays: 3, visualCue: 'sparkle' },
    'dessert-cup': { dateType: 'use-by', storedDays: 4 },
    lettuce: { dateType: 'best-before', storedDays: 3 },
    spinach: { dateType: 'best-before', storedDays: 5, visualCue: 'fly' },
    zucchini: { dateType: 'best-before', storedDays: 3 },
    broccoli: { dateType: 'best-before', storedDays: 4 },
    tomatoes: { dateType: 'best-before', storedDays: 4, visualCue: 'sparkle' },
    carrots: { dateType: 'best-before', storedDays: 5 },
    mushrooms: { dateType: 'best-before', storedDays: 4 },
    corn: { dateType: 'best-before', storedDays: 3 },
    'purple-sweet-potatoes': { dateType: 'best-before', storedDays: 8 },
    'frozen-dumplings': { dateType: 'best-before', storedDays: 18 },
    'frozen-salmon': { dateType: 'best-before', storedDays: 12, visualCue: 'breathe' },
    'ice-cream': { dateType: 'best-before', storedDays: 20 },
    'frozen-berries': { dateType: 'best-before', storedDays: 16 },
    popsicles: { dateType: 'best-before', storedDays: 24 },
    'frozen-meat': { dateType: 'best-before', storedDays: 22 },
    'frozen-vegetables': { dateType: 'best-before', storedDays: 14 },
    'frozen-lasagna': { forcedFreshnessState: 'forgotten', dateType: 'best-before', storedDays: 52, visualCue: 'sleep' },
    rice: { dateType: 'best-before', storedDays: 20 }
  };

  const freshnessStateFromOffset = (offset) => {
    if (offset < 0) return 'past-date';
    if (offset <= 2) return 'near-expiry';
    if (offset <= 6) return 'best-window';
    return 'fresh';
  };

  const shelfLifeDefaults = {
    'Dairy & Drinks': 10,
    'Meat & Protein': 7,
    Fruits: 10,
    Vegetables: 10,
    'Frozen Food': 90,
    Others: 14
  };
  const shelfLifeOverrides = {
    milk: 7,
    'blueberry-yogurt': 10,
    'strawberry-yogurt': 10,
    tofu: 7,
    'leftover-curry': 3,
    'fresh-meat': 3,
    bread: 5,
    strawberries: 3,
    'dessert-cup': 5,
    lettuce: 5,
    spinach: 5,
    mushrooms: 5,
    rice: 180
  };

  ingredients.forEach((item) => {
    Object.assign(item, livingProfiles[item.id] || {});
    item.freshnessState = item.forcedFreshnessState || freshnessStateFromOffset(item.expiryOffset);
    item.shelfLifeDays = shelfLifeOverrides[item.id] || shelfLifeDefaults[item.category];
  });

  window.DearFridgeData = { ingredients, hotspots, recipes, livingProfiles, freshnessStateFromOffset };
})();
