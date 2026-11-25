// Sizzle & Serve — Warung Rush, v2: boot, the game loop, and input.
// Title -> playing -> shift over. The loop owns timing and input only;
// the cook, the board, and the painter each own their own job.

import { Chef, VIEW_W, VIEW_H } from './chef.js';
import { OrderBoard, SHIFT_SECONDS, RUSH_AT } from './board.js';
import { drawGame, tickFloaters, floatText, spawnSteam } from './paint.js';
import { Sfx } from './sound.js';
import { applyShot, runSelfTest } from './scenes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sfx = new Sfx();
const chef = new Chef();
const board = new OrderBoard();

const game = {
  phase: 'title', // 'title' | 'playing' | 'over'
  elapsed: 0,
  hearts: 3,
  chef, board,
  floaters: [],
  lastServeAt: 0,
  servedTable: 0,
  lastDish: null,
  passDish: null, // recipe id of the dish mid-garnish on the pass
  tableDishes: {}, // table index -> recipe id landed there by a serve
};

const keys = new Set();
let clickTarget = null;

function shout(text, x, y, color) {
  floatText(game, text, x, y, color);
}

function resetShift() {
  chef.x = 640; chef.y = 600;
  chef.carrying = []; chef.chopping = null; chef.plateDish = null;
  chef.wok = { items: [], cooking: 0, cookSecs: 0, ready: false, burnt: false, recipe: null, overSecs: 0 };
  chef.wok2 = { items: [], cooking: 0, cookSecs: 0, ready: false, burnt: false, recipe: null, overSecs: 0 };
  board.tickets = []; board.served = 0; board.lost = 0;
  board.coins = 0; board.combo = 0; board.bestCombo = 0; board.comboLeft = 0;
  board.spawnIn = 2.0; board.nextId = 1; board.rushAnnounced = false;
  board._elapsed = 0;
  game.elapsed = 0;
  game.hearts = 3;
  game.floaters = [];
  game.lastServeAt = 0;
  game.passDish = null;
  game.tableDishes = {};
  game.phase = 'playing';
}

function startShift() {
  sfx.ensure();
  resetShift();
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (e.repeat) return;
  sfx.ensure();
  const k = e.key.toLowerCase();
  if (k === 'm') { sfx.muted = !sfx.muted; return; }
  if (k === 'r' && game.phase !== 'title') { startShift(); return; }
  if (game.phase === 'title' && (k === 'enter' || k === ' ')) { startShift(); return; }
  if (game.phase !== 'playing') return;
  if (k === 'e' || k === ' ') {
    const before = board.coins;
    const servedBefore = board.served;
    const dishInHand = chef.carrying.find((c) => c.id.startsWith('dish:'));
    chef.interact(board, sfx, shout);
    if (board.served > servedBefore) {
      game.lastServeAt = performance.now();
      game.servedTable = (board.served - 1) % 3;
      game.lastDish = dishInHand ? dishInHand.id.slice(5) : null;
      // The served dish lands on its table, where its customer eats it.
      game.tableDishes[game.servedTable] = game.lastDish;
    }
    if (board.coins > before) floatText(game, `+$${board.coins - before}`, chef.x, chef.y - 80, '#69f0ae');
    return;
  }
  keys.add(k);
});

window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

canvas.addEventListener('pointerdown', (e) => {
  sfx.ensure();
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
  if (game.phase === 'title') { startShift(); return; }
  if (game.phase !== 'playing') return;
  clickTarget = { x, y };
  const dx = x - chef.x;
  const dy = y - chef.y;
  if (Math.hypot(dx, dy) < 60) {
    chef.interact(board, sfx, shout);
    clickTarget = null;
  }
});

let last = performance.now();
let steamIn = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.phase === 'playing') {
    game.elapsed += dt;
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (dx !== 0 || dy !== 0) {
      clickTarget = null;
      chef.move(dx, dy, dt);
    } else if (clickTarget) {
      chef.moveToward(clickTarget.x, clickTarget.y, dt);
    }
    chef.tick(dt);
    const wasRush = board.inRush;
    const expired = board.update(dt, game.elapsed);
    if (!wasRush && board.inRush) {
      sfx.bell();
      floatText(game, 'LUNCH RUSH!', 640, 260, '#ff5252');
    }
    if (expired > 0) {
      game.hearts -= expired;
      sfx.bell();
    }
    steamIn -= dt;
    if (steamIn <= 0) {
      steamIn = 0.5;
      if (chef.wok.cooking > 0 && !chef.wok.ready) spawnSteam(game, 590, 180);
      if (chef.wok2.cooking > 0 && !chef.wok2.ready) spawnSteam(game, 770, 180);
    }
    if (game.elapsed >= SHIFT_SECONDS || game.hearts <= 0) {
      game.phase = 'over';
      sfx.bell();
    }
  }
  tickFloaters(game, dt);
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}

// Staged screenshots (?shot=cover) and the scripted self-test (?selftest=1)
// are real renders of this same code, with the kitchen put in a fixed state.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(game, shot);
  drawGame(ctx, game);
} else if (params.get('selftest') === '1') {
  game.phase = 'playing';
  runSelfTest(game);
  drawGame(ctx, game);
}
requestAnimationFrame(frame);
