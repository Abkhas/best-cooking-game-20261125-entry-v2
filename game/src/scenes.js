// Sizzle & Serve — Warung Rush, v2: staged scenes for screenshots and a
// scripted end-to-end self-test. A shot is a real render of the game's own
// code with the kitchen put into a fixed mid-shift state (?shot=cover and
// friends); the self-test (?selftest=1) plays one full order through the
// same functions the keyboard uses, then reports the result in the page
// so a headless run can read it.

import { RECIPES } from './menu.js';
import { stationCenter } from './chef.js';

function ticket(id, recipeId, patience, patienceMax) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id, recipe, patience, patienceMax, born: 0, flash: 0 };
}

function setWok(wok, recipeId, cooking, cookSecs, ready, burnt) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  wok.items = recipe ? recipe.needs.map((n) => ({ id: n, prepped: true })) : [];
  wok.recipe = recipe ?? null;
  wok.cooking = cooking;
  wok.cookSecs = cookSecs;
  wok.ready = ready;
  wok.burnt = burnt;
  wok.overSecs = 0;
}

/** Put the game into a fixed mid-shift scene for a screenshot. */
export function applyShot(game, name) {
  const { chef, board } = game;
  game.phase = 'playing';
  game.elapsed = 75;
  game.hearts = 3;
  game.lastServeAt = 0;
  game.servedTable = 0;
  game.lastDish = null;
  board.tickets = [];
  board.coins = 0;
  board.combo = 0;
  board.served = 0;
  board._elapsed = 75;
  chef.carrying = [];
  chef.plateDish = null;
  chef.chopping = null;
  setWok(chef.wok, null, 0, 0, false, false);
  setWok(chef.wok2, null, 0, 0, false, false);

  if (name === 'cover') {
    // The busiest, most complete moment: lunch rush, BOTH woks cooking
    // with % progress showing, a plated dish, four tickets queued with
    // their seconds left, the cook carrying a finished dish toward the
    // serve window, a happy customer eating.
    game.elapsed = 112;
    board._elapsed = 112;
    board.coins = 540; board.combo = 4; board.served = 8;
    board.tickets = [
      ticket(1, 'nasi-goreng', 14, 36),
      ticket(2, 'mie-goreng', 26, 34),
      ticket(3, 'ayam-geprek', 9, 32),
      ticket(4, 'gado-gado', 30, 38),
    ];
    const c = stationCenter('serve');
    chef.x = c.x - 190; chef.y = c.y + 60;
    chef.carrying = [{ id: 'dish:soto-ayam', prepped: true }];
    setWok(chef.wok, 'nasi-goreng', 4.2, 6, false, false);
    setWok(chef.wok2, 'mie-goreng', 5.6, 7, false, false);
    chef.plateDish = 'gado-gado';
    game.lastServeAt = performance.now();
    game.servedTable = 1;
    game.lastDish = 'ayam-geprek';
  } else if (name === 'orders') {
    game.elapsed = 20;
    board._elapsed = 20;
    board.coins = 60; board.combo = 0; board.served = 1;
    board.tickets = [
      ticket(1, 'nasi-goreng', 40, 46),
      ticket(2, 'mie-goreng', 30, 44),
      ticket(3, 'soto-ayam', 44, 48),
      ticket(4, 'ayam-geprek', 20, 42),
    ];
    const c = stationCenter('egg');
    chef.x = c.x + 60; chef.y = c.y + 20;
    chef.carrying = [{ id: 'rice', prepped: true }];
  } else if (name === 'cooking') {
    game.elapsed = 100;
    board._elapsed = 100;
    board.coins = 210; board.combo = 2; board.served = 3;
    board.tickets = [
      ticket(1, 'ayam-geprek', 18, 36),
      ticket(2, 'soto-ayam', 30, 38),
    ];
    const c = stationCenter('chop');
    chef.x = c.x; chef.y = c.y + 90;
    chef.carrying = [{ id: 'chicken', prepped: false }];
    chef.chopping = { item: chef.carrying[0], done: 1.2, total: 1.6 };
    setWok(chef.wok, 'mie-goreng', 2.8, 7, false, false);
    setWok(chef.wok2, 'nasi-goreng', 6, 6, true, false);
  } else if (name === 'plating') {
    game.elapsed = 150;
    board._elapsed = 150;
    board.coins = 480; board.combo = 4; board.served = 7;
    board.tickets = [
      ticket(1, 'soto-ayam', 22, 34),
      ticket(2, 'nasi-goreng', 8, 32),
    ];
    const c = stationCenter('plate');
    chef.x = c.x + 110; chef.y = c.y + 80;
    chef.carrying = [{ id: 'dish:ayam-geprek', prepped: true }];
    chef.plateDish = 'mie-goreng';
    setWok(chef.wok, 'soto-ayam', 5.4, 9, false, false);
    game.lastServeAt = performance.now();
    game.servedTable = 0;
    game.lastDish = 'nasi-goreng';
  }
}

/** Play one full order through the real interact path and report it. */
export function runSelfTest(game) {
  const { chef, board } = game;
  const log = [];
  const at = (name) => {
    const c = stationCenter(name);
    chef.x = c.x; chef.y = c.y;
  };
  const pressE = () => chef.interact(board, null, null);
  const step = (n) => { for (let i = 0; i < n; i++) chef.tick(0.1); };

  game.phase = 'playing';
  game.elapsed = 10;
  board._elapsed = 10;
  board.tickets = [ticket(1, 'nasi-goreng', 45, 45)];
  board.coins = 0; board.served = 0;

  // Pick rice, egg, chili from the crates.
  at('rice'); pressE();
  at('egg'); pressE();
  at('chili'); pressE();
  log.push(`carrying after crates: ${chef.carrying.map((c) => c.id).join(',')}`);
  // Start cooking at wok 1.
  at('wok1'); pressE();
  log.push(`wok cooking: ${chef.wok.cooking > 0}, recipe: ${chef.wok.recipe?.id}`);
  // Fast-forward the cook time, take the dish, plate it, serve it.
  step(70);
  log.push(`wok ready: ${chef.wok.ready}`);
  pressE();
  log.push(`carrying dish: ${chef.carrying.map((c) => c.id).join(',')}`);
  at('plate'); pressE();
  log.push(`plate: ${chef.plateDish}`);
  at('plate'); pressE();
  log.push(`carrying after plate pickup: ${chef.carrying.map((c) => c.id).join(',')}`);
  at('serve'); pressE();
  log.push(`served: ${board.served}, coins: ${board.coins}`);
  // Chopping path: raw chicken must chop before the wok takes it.
  at('chicken'); pressE();
  log.push(`chicken prepped before chop: ${chef.carrying[0]?.prepped}`);
  at('chop'); pressE();
  step(30);
  const chopOk = chef.carrying[0]?.prepped === true;
  log.push(`chicken prepped after chop: ${chef.carrying[0]?.prepped}`);
  // No-wok path: gado-gado plates straight from the hand.
  chef.carrying = [];
  at('veg'); pressE();
  at('egg'); pressE();
  at('chili'); pressE();
  at('chop'); pressE();
  step(30);
  at('plate'); pressE();
  log.push(`gado-gado plated: ${chef.plateDish}`);

  const passed = board.served === 1 && board.coins > 0
    && chopOk && chef.plateDish === 'gado-gado';
  const result = { passed, served: board.served, coins: board.coins, log };
  const node = document.getElementById('selftest');
  if (node) node.textContent = JSON.stringify(result);
  document.title = passed ? 'SELFTEST PASS' : 'SELFTEST FAIL';
  return result;
}
