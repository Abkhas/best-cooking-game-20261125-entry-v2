// Sizzle & Serve — Warung Rush, v2: the warung's menu.
// Every dish is a set of ingredients. Each ingredient says whether it
// must be chopped first ('chop') or can go straight in ('raw').
// Most dishes ride the wok; gado-gado is a cold plate — chop its veg,
// stack everything on a plate, and it is ready with no wok at all.
// That split is the route puzzle: some orders want the wok, one skips it.

export const INGREDIENTS = {
  rice:    { name: 'Rice',    color: '#fff3d6', prep: 'raw',  draw: 'rice' },
  noodle:  { name: 'Noodle',  color: '#ffcf4d', prep: 'raw',  draw: 'noodle' },
  egg:     { name: 'Egg',     color: '#ffe08a', prep: 'raw',  draw: 'egg' },
  chicken: { name: 'Chicken', color: '#f2a06b', prep: 'chop', draw: 'chicken' },
  veg:     { name: 'Veg',     color: '#7cc47f', prep: 'chop', draw: 'veg' },
  chili:   { name: 'Chili',   color: '#e8402f', prep: 'raw',  draw: 'chili' },
};

export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', price: 60,  wok: true,  cookSecs: 6,
    needs: ['rice', 'egg', 'chili'],
    note: 'Fried rice with egg and chili — the warung classic.' },
  { id: 'mie-goreng', name: 'Mie Goreng', price: 70, wok: true, cookSecs: 7,
    needs: ['noodle', 'egg', 'veg'],
    note: 'Fried noodles, egg and chopped veg.' },
  { id: 'ayam-geprek', name: 'Ayam Geprek', price: 90, wok: true, cookSecs: 8,
    needs: ['chicken', 'chili', 'rice'],
    note: 'Smashed fried chicken with chili over rice.' },
  { id: 'soto-ayam', name: 'Soto Ayam', price: 100, wok: true, cookSecs: 9,
    needs: ['chicken', 'veg', 'rice'],
    note: 'Chicken soup with veg, ladled over rice.' },
  { id: 'gado-gado', name: 'Gado-Gado', price: 80, wok: false, cookSecs: 0,
    needs: ['veg', 'egg', 'chili'],
    note: 'Cold veg, egg and chili — no wok, straight to the plate.' },
];

/** Dishes the kitchen may be asked for at this point in the shift. */
export function dishesUnlocked(elapsedSec) {
  if (elapsedSec < 40) return RECIPES.slice(0, 2);
  if (elapsedSec < 80) return RECIPES.slice(0, 3);
  if (elapsedSec < 120) return RECIPES.slice(0, 4);
  return RECIPES;
}

/** The recipe whose ingredient set equals the carried ids, or null. */
export function recipeFor(carriedIds) {
  const key = [...carriedIds].sort().join('+');
  return RECIPES.find((r) => [...r.needs].sort().join('+') === key) ?? null;
}

/** True when every carried item is already prepped (or needs no prep). */
export function allPrepped(carried) {
  return carried.every((c) => c.prepped || INGREDIENTS[c.id].prep === 'raw');
}
