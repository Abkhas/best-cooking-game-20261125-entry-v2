// Sizzle & Serve — Warung Rush, v2: everything the player sees.
// One canvas, drawn shapes only — the food is drawn so it looks worth
// serving, and every counter reads at a glance: ticket patience bars,
// wok progress rings, and a shift timer that changes colour as the
// shift runs out. The cover shot is staged to show all of it at once.

import { INGREDIENTS, RECIPES, recipeFor } from './menu.js';
import { STATIONS, stationCenter } from './chef.js';
import { SHIFT_SECONDS, RUSH_AT } from './board.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

const CREAM = '#fff6e3';
const WOOD = '#b07d4f';
const DARK = '#263238';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** One ingredient's icon, drawn at (x, y) with radius r. */
export function drawIngredient(ctx, kind, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'rice') {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.85, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * r * 0.3, -r * 0.25, r * 0.14, 0, 7); ctx.fill(); }
  } else if (kind === 'noodle') {
    ctx.strokeStyle = '#ffcf4d'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.4 + i * r * 0.42);
      ctx.quadraticCurveTo(0, -r * 0.75 + i * r * 0.42, r * 0.8, -r * 0.4 + i * r * 0.42);
      ctx.stroke();
    }
  } else if (kind === 'egg') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.75, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf4d';
    ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.05, r * 0.26, 0, 7); ctx.fill();
  } else if (kind === 'chicken') {
    ctx.fillStyle = '#f2a06b';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.7, r * 0.6, -0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#e07b39';
    ctx.beginPath(); ctx.arc(-r * 0.45, r * 0.35, r * 0.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.55, r * 0.45); ctx.lineTo(-r * 0.95, r * 0.85); ctx.stroke();
  } else if (kind === 'veg') {
    ctx.fillStyle = '#57ab5a';
    for (const a of [-0.5, 0.3, 1.1]) {
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4 - r * 0.1, r * 0.55, r * 0.3, a, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath(); ctx.arc(0, r * 0.45, r * 0.2, 0, 7); ctx.fill();
  } else if (kind === 'chili') {
    ctx.strokeStyle = '#e8402f'; ctx.lineWidth = r * 0.42; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.3); ctx.quadraticCurveTo(0, r * 0.9, r * 0.75, -r * 0.35); ctx.stroke();
    ctx.fillStyle = '#57ab5a';
    ctx.beginPath(); ctx.ellipse(r * 0.75, -r * 0.45, r * 0.35, r * 0.16, 0.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/** A finished dish on a plate: white plate, food mound, garnish. */
function drawDish(ctx, recipeId, x, y, r) {
  const recipe = RECIPES.find((d) => d.id === recipeId);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.72, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.78, r * 0.55, 0, 0, 7); ctx.fill();
  const mound = { 'nasi-goreng': '#e8a04c', 'mie-goreng': '#ffcf4d', 'ayam-geprek': '#c65f33', 'soto-ayam': '#f2c14e', 'gado-gado': '#7cc47f' }[recipeId] || '#e8a04c';
  ctx.fillStyle = mound;
  ctx.beginPath(); ctx.arc(x, y - r * 0.12, r * 0.55, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.3, r * 0.12, 0, 7); ctx.fill();
  if (recipe && recipe.needs.includes('chili')) drawIngredient(ctx, 'chili', x + r * 0.32, y - r * 0.28, r * 0.22);
  if (recipe && recipe.needs.includes('veg')) drawIngredient(ctx, 'veg', x - r * 0.38, y - r * 0.2, r * 0.2);
}

function patienceColor(share) {
  return share > 0.5 ? '#43a047' : share > 0.25 ? '#fb8c00' : '#e53935';
}

function drawTicket(ctx, t, x, y, w, h, chef) {
  const share = Math.max(0, t.patience / t.patienceMax);
  const urgent = share < 0.25 || t.flash > 0;
  ctx.fillStyle = urgent && Math.floor(performance.now() / 250) % 2 === 0 ? '#ffebee' : '#ffffff';
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = urgent ? '#e53935' : '#ffb300';
  ctx.stroke();
  text(ctx, t.recipe.name.toUpperCase(), x + 10, y + 16, 14, '#263238', 'bold', 'left');
  text(ctx, `$${t.recipe.price}`, x + w - 10, y + 16, 14, '#2e7d32', 'bold', 'right');
  let ix = x + 16;
  for (const need of t.recipe.needs) {
    drawIngredient(ctx, INGREDIENTS[need].draw, ix + 12, y + 40, 11);
    ix += 30;
  }
  if (!t.recipe.wok) text(ctx, 'NO WOK', x + w - 10, y + 40, 10, '#2e7d32', 'bold', 'right');
  // Per-order progress: how much of this ticket is already in hand.
  // Short, out of the icons' way; the fast-serve tip rides the bar's
  // seconds line instead, where it never collides with anything.
  let matched = 0;
  if (chef) {
    const dish = chef.carrying.find((c) => c.id === `dish:${t.recipe.id}`);
    matched = dish ? t.recipe.needs.length
      : t.recipe.needs.filter((n) => chef.carrying.some((c) => c.id === n)).length;
  }
  if (matched > 0) {
    const label = `✓ ${matched}/${t.recipe.needs.length}`;
    if (t.recipe.wok) text(ctx, label, x + w - 10, y + 40, 10, '#2e7d32', 'bold', 'right');
    else text(ctx, label, x + w / 2, y + 40, 10, '#2e7d32', 'bold');
  }
  ctx.fillStyle = '#e0e0e0';
  rr(ctx, x + 10, y + h - 14, w - 20, 10, 5); ctx.fill();
  ctx.fillStyle = patienceColor(share);
  rr(ctx, x + 10, y + h - 14, (w - 20) * share, 10, 5); ctx.fill();
  const fastTip = matched === 0 && share > 0.6 ? Math.round(t.recipe.price * 0.4 * share) : 0;
  text(ctx, fastTip > 0 ? `${Math.ceil(t.patience)}s • FAST +$${fastTip}` : `${Math.ceil(t.patience)}s`, x + w / 2, y + h - 9, 9, '#ffffff');
}

function drawWok(ctx, wok, s, label) {
  ctx.fillStyle = '#37474f';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2 + 6, 46, 30, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#455a64';
  ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2 + 2, 46, 28, 0, 0, 7); ctx.fill();
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2 + 2;
  if (wok.burnt) {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 7); ctx.fill();
    text(ctx, 'BURNT!', cx, cy - 26, 13, '#ff7043');
  } else if (wok.ready) {
    drawDish(ctx, wok.recipe.id, cx, cy, 30);
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 180);
    ctx.globalAlpha = pulse;
    text(ctx, `READY! +$${wok.recipe.price}`, cx, cy - 34, 13, '#ffd54f');
    ctx.globalAlpha = 1;
    if (wok.overSecs > 3) {
      // About to burn: smoke, a red drain bar, and a flashing warning
      // under the wok — the grab-it-now pressure reads at a glance.
      ctx.fillStyle = 'rgba(120,120,120,0.55)';
      ctx.beginPath(); ctx.arc(cx - 14, cy - 42, 9, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 10, cy - 50, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#546e7a';
      rr(ctx, cx - 50, s.y + s.h + 4, 100, 6, 3); ctx.fill();
      ctx.fillStyle = '#e53935';
      rr(ctx, cx - 50, s.y + s.h + 4, 100 * Math.min(1, wok.overSecs / 6), 6, 3); ctx.fill();
      const flash = Math.floor(performance.now() / 200) % 2 === 0;
      const warn = `🔥 BURN IN ${Math.max(0, Math.ceil(6 - wok.overSecs))}s — GRAB IT!`;
      ctx.font = 'bold 12px system-ui, sans-serif';
      const ww = ctx.measureText(warn).width;
      ctx.fillStyle = 'rgba(38,50,56,0.88)';
      rr(ctx, cx - ww / 2 - 8, s.y + s.h + 14, ww + 16, 20, 10); ctx.fill();
      text(ctx, warn, cx, s.y + s.h + 24, 12, flash ? '#ff5252' : '#ff8a65');
    }
  } else if (wok.cooking > 0) {
    const share = Math.min(1, wok.cooking / wok.cookSecs);
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.fill();
    ctx.strokeStyle = '#69f0ae'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2); ctx.stroke();
    text(ctx, `${Math.ceil(wok.cookSecs - wok.cooking)}s`, cx, cy - 1, 13, '#263238');
    text(ctx, `${Math.round(share * 100)}%`, cx, cy + 13, 9, '#263238');
  } else {
    ctx.fillStyle = '#546e7a';
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.fill();
  }
  text(ctx, label, cx, s.y + s.h - 12, 12, '#eceff1');
}

function drawChef(ctx, chef) {
  const { x, y } = chef;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(x, y + 26, 22, 7, 0, 0, 7); ctx.fill();
  // body: white coat, red scarf
  ctx.fillStyle = '#ffffff';
  rr(ctx, x - 14, y - 6, 28, 34, 9); ctx.fill();
  ctx.fillStyle = '#e53935';
  ctx.fillRect(x - 14, y + 2, 28, 6);
  // head + tall chef hat
  ctx.fillStyle = '#ffcc9e';
  ctx.beginPath(); ctx.arc(x, y - 14, 11, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x, y - 26, 12, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 12, y - 28, 24, 6);
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(x - 4, y - 15, 1.6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4, y - 15, 1.6, 0, 7); ctx.fill();
  // carried items float above the hat
  let ix = x - (chef.carrying.length - 1) * 15;
  for (const c of chef.carrying) {
    if (c.id.startsWith('dish:')) {
      drawDish(ctx, c.id.slice(5), ix, y - 52, 15);
      if (c.garnished) text(ctx, '✦', ix + 14, y - 66, 14, '#aed581');
    } else if (c.id === 'burnt') {
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(ix, y - 52, 11, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = c.prepped ? '#ffffff' : '#ffe0b2';
      ctx.beginPath(); ctx.arc(ix, y - 52, 13, 0, 7); ctx.fill();
      drawIngredient(ctx, INGREDIENTS[c.id].draw, ix, y - 52, 10);
    }
    ix += 30;
  }
  // chopping progress ring
  if (chef.chopping) {
    const share = chef.chopping.done / chef.chopping.total;
    ctx.strokeStyle = '#69f0ae'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(x, y - 52, 20, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2); ctx.stroke();
    text(ctx, 'CHOP!', x, y - 78, 13, '#aed581');
  }
}

function drawCustomer(ctx, x, y, mood, dishId) {
  ctx.fillStyle = '#8d6e63';
  ctx.beginPath(); ctx.ellipse(x, y + 34, 52, 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.beginPath(); ctx.ellipse(x, y + 30, 40, 8, 0, 0, 7); ctx.fill();
  // customer: head, shoulders, plate
  ctx.fillStyle = '#ffcc9e';
  ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.beginPath(); ctx.arc(x, y - 6, 16, Math.PI, 0); ctx.fill();
  ctx.fillStyle = mood === 'happy' ? '#7e57c2' : '#8d6e63';
  rr(ctx, x - 20, y + 14, 40, 16, 8); ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(x - 6, y - 1, 2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6, y - 1, 2, 0, 7); ctx.fill();
  if (mood === 'happy') {
    ctx.strokeStyle = '#263238'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 4, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (dishId) drawDish(ctx, dishId, x + 34, y + 26, 13);
  } else if (mood === 'waiting') {
    ctx.strokeStyle = '#263238'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 5, y + 7); ctx.lineTo(x + 5, y + 7); ctx.stroke();
  } else {
    ctx.strokeStyle = '#263238'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 2, 6, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
  }
}

export function drawGame(ctx, game) {
  const { chef, board } = game;
  // floor: warm checker tiles
  ctx.fillStyle = '#f0c08a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#eab87e';
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 13; tx++) {
      if ((tx + ty) % 2 === 0) ctx.fillRect(tx * 100, ty * 100 + 60, 100, 100);
    }
  }
  // wall band + order board shelf
  ctx.fillStyle = '#8d5a2b';
  ctx.fillRect(0, 0, VIEW_W, 66);
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(0, 60, VIEW_W, 8);

  // ---- HUD ----
  text(ctx, 'WARUNG BU SARI', 24, 24, 24, '#ffd54f', 'bold', 'left');
  text(ctx, 'GANG MAWAR • EST. 1987', 24, 46, 11, '#ffcc80', 'bold', 'left');
  const remain = Math.max(0, SHIFT_SECONDS - game.elapsed);
  const mm = Math.floor(remain / 60);
  const ss = String(Math.floor(remain % 60)).padStart(2, '0');
  const timeShare = remain / SHIFT_SECONDS;
  const timeColor = timeShare > 0.5 ? '#69f0ae' : timeShare > 0.2 ? '#ffb300' : '#ff5252';
  const pulse = timeShare <= 0.2 ? 0.7 + 0.3 * Math.sin(performance.now() / 150) : 1;
  ctx.globalAlpha = pulse;
  text(ctx, `SHIFT ${mm}:${ss}`, 470, 26, 24, timeColor);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#546e7a';
  rr(ctx, 560, 14, 300, 20, 10); ctx.fill();
  ctx.fillStyle = timeColor;
  rr(ctx, 560, 14, 300 * timeShare, 20, 10); ctx.fill();
  if (remain <= 30 && game.phase === 'playing') text(ctx, 'LAST ORDERS!', 710, 46, 12, '#ff5252');
  text(ctx, `🪙 ${board.coins}`, 900, 26, 20, '#ffd54f', 'bold', 'left');
  text(ctx, board.combo > 1 ? `COMBO x${board.combo}` : 'COMBO —', 1010, 26, 16, board.combo > 1 ? '#ff7043' : '#b0bec5', 'bold', 'left');
  text(ctx, `SERVED ${board.served}`, 1130, 26, 16, '#eceff1', 'bold', 'left');
  text(ctx, `MISSED ${board.lost}`, 1130, 46, 11, board.lost > 0 ? '#ff8a65' : '#90a4ae', 'bold', 'left');
  for (let i = 0; i < 3; i++) {
    text(ctx, '♥', 1210 + i * 20, 26, 16, i < game.hearts ? '#ff5252' : '#546e7a');
  }

  // ---- order board ----
  text(ctx, 'ORDER BOARD', 24, 82, 12, '#5d4037', 'bold', 'left');
  if (board.inRush) {
    ctx.fillStyle = '#e53935';
    rr(ctx, 1056, 74, 200, 26, 8); ctx.fill();
    text(ctx, '🔥 LUNCH RUSH!', 1156, 87, 13, '#ffffff');
  }
  board.tickets.forEach((t, i) => drawTicket(ctx, t, 24 + i * 300, 96, 284, 56, chef));
  if (board.tickets.length === 0) text(ctx, 'No orders — breathe!', 170, 124, 14, '#8d6e63', 'normal', 'left');

  // ---- ingredient crates ----
  for (const [id, ing] of Object.entries(INGREDIENTS)) {
    const s = STATIONS[id];
    ctx.fillStyle = '#8d6e63';
    rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
    ctx.fillStyle = '#6d4c41';
    rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 8); ctx.fill();
    drawIngredient(ctx, ing.draw, s.x + s.w / 2, s.y + 34, 20);
    text(ctx, ing.name.toUpperCase(), s.x + s.w / 2, s.y + s.h - 14, 12, '#fff3d6');
    if (ing.prep === 'chop') text(ctx, '✂ chop', s.x + s.w / 2, s.y + s.h - 28, 9, '#aed581');
  }

  // ---- chop board, woks, plate ----
  const chop = STATIONS.chop;
  ctx.fillStyle = '#d7a86c';
  rr(ctx, chop.x, chop.y, chop.w, chop.h, 10); ctx.fill();
  ctx.fillStyle = '#b07d4f';
  ctx.fillRect(chop.x + 20, chop.y + 36, chop.w - 40, 6);
  text(ctx, 'CHOP', chop.x + chop.w / 2, chop.y + chop.h - 12, 12, '#5d4037');
  drawWok(ctx, chef.wok, STATIONS.wok1, 'WOK 1');
  drawWok(ctx, chef.wok2, STATIONS.wok2, 'WOK 2');
  const plate = STATIONS.plate;
  ctx.fillStyle = '#eceff1';
  rr(ctx, plate.x, plate.y, plate.w, plate.h, 10); ctx.fill();
  if (chef.plateDish) drawDish(ctx, chef.plateDish, plate.x + plate.w / 2, plate.y + 40, 30);
  else {
    ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(plate.x + plate.w / 2, plate.y + 40, 30, 20, 0, 0, 7); ctx.stroke();
  }
  text(ctx, 'PLATE', plate.x + plate.w / 2, plate.y + plate.h - 12, 12, '#546e7a');

  // ---- serve window + trash ----
  const serve = STATIONS.serve;
  ctx.fillStyle = '#2e7d32';
  rr(ctx, serve.x, serve.y, serve.w, serve.h, 12); ctx.fill();
  ctx.fillStyle = '#a5d6a7';
  rr(ctx, serve.x + 10, serve.y + 10, serve.w - 20, 44, 8); ctx.fill();
  text(ctx, 'SERVE', serve.x + serve.w / 2, serve.y + 32, 20, '#1b5e20');
  text(ctx, 'WINDOW', serve.x + serve.w / 2, serve.y + 76, 13, '#e8f5e9');
  text(ctx, 'E to serve', serve.x + serve.w / 2, serve.y + 104, 12, '#c8e6c9');
  text(ctx, 'the dish', serve.x + serve.w / 2, serve.y + 122, 12, '#c8e6c9');
  const trash = STATIONS.trash;
  ctx.fillStyle = '#616161';
  rr(ctx, trash.x, trash.y, trash.w, trash.h, 10); ctx.fill();
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath(); ctx.moveTo(trash.x + 28, trash.y + 18); ctx.lineTo(trash.x + 62, trash.y + 18);
  ctx.lineTo(trash.x + 56, trash.y + 58); ctx.lineTo(trash.x + 34, trash.y + 58); ctx.closePath(); ctx.fill();
  text(ctx, 'TRASH', trash.x + trash.w / 2, trash.y + trash.h - 8, 10, '#e0e0e0');

  // ---- garnish pass: fills the old empty middle band ----
  // A dark-wood finishing counter with four garnish bowls and one dish
  // mid-garnish, so the band shows work in progress, not bare floor.
  const pass = { x: 280, y: 300, w: 780, h: 92 };
  ctx.fillStyle = '#4e342e';
  rr(ctx, pass.x, pass.y, pass.w, pass.h, 14); ctx.fill();
  ctx.fillStyle = '#6d4c41';
  rr(ctx, pass.x + 6, pass.y + 6, pass.w - 12, pass.h - 12, 10); ctx.fill();
  ctx.fillStyle = '#ffb300';
  ctx.fillRect(pass.x + 6, pass.y + 6, pass.w - 12, 4);
  text(ctx, 'GARNISH PASS', pass.x + 18, pass.y + 24, 13, '#ffd54f', 'bold', 'left');
  const handDish = chef.carrying.find((c) => c.id.startsWith('dish:'));
  const taburHot = handDish && !handDish.garnished;
  text(ctx, taburHot ? 'TABUR NOW! +$15 TIP [E]' : 'TABUR +$15 TIP [E]', pass.x + 18, pass.y + 46, 11, taburHot ? '#aed581' : '#d7ccc8', 'bold', 'left');
  text(ctx, 'bawang • sambal • jeruk • daun bawang', pass.x + 18, pass.y + 66, 10, '#bcaaa4', 'normal', 'left');
  for (const b of [
    { x: 560, label: 'BAWANG', color: '#ffcf4d' },
    { x: 660, label: 'SAMBAL', color: '#e8402f' },
    { x: 760, label: 'JERUK', color: '#8bc34a' },
    { x: 860, label: 'DAUN BAWANG', color: '#57ab5a' },
  ]) {
    ctx.fillStyle = '#3e2723';
    ctx.beginPath(); ctx.arc(b.x, pass.y + 40, 19, 0, 7); ctx.fill();
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, pass.y + 36, 13, Math.PI, 0); ctx.fill();
    text(ctx, b.label, b.x, pass.y + 72, 9, '#d7ccc8');
  }
  if (game.passDish) {
    drawDish(ctx, game.passDish, 930, pass.y + 42, 26);
    text(ctx, 'TABUR…', 930, pass.y + 16, 10, '#aed581', 'bold');
    text(ctx, '✦', 956, pass.y + 20, 13, '#ffd54f');
  }
  // Batik runner under the pass, so the band reads as dressed floor.
  ctx.fillStyle = '#7f3b2e';
  ctx.fillRect(280, 396, 780, 30);
  ctx.fillStyle = '#ffb300';
  for (let rx = 300; rx < 1060; rx += 48) {
    ctx.save();
    ctx.translate(rx, 411);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }

  // ---- station state lines: the next move reads at a glance ----
  // A dark pill behind each line, so pale text never sits on bare floor.
  const stateLine = (s, line, color) => {
    ctx.font = 'bold 11px system-ui, sans-serif';
    const w = ctx.measureText(line).width;
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h + 14;
    ctx.fillStyle = 'rgba(38,50,56,0.85)';
    rr(ctx, cx - w / 2 - 7, cy - 9, w + 14, 18, 9); ctx.fill();
    text(ctx, line, cx, cy, 11, color);
  };
  if (chef.chopping) {
    stateLine(STATIONS.chop, `CHOPPING ${Math.round((chef.chopping.done / chef.chopping.total) * 100)}%`, '#aed581');
  } else {
    stateLine(STATIONS.chop, 'CHOP [E]', '#b0bec5');
  }
  for (const [wok, s] of [[chef.wok, STATIONS.wok1], [chef.wok2, STATIONS.wok2]]) {
    if (wok.burnt) stateLine(s, 'BURNT — TRASH IT', '#ff7043');
    else if (wok.ready) {
      if (wok.overSecs <= 3) stateLine(s, `READY +$${wok.recipe.price} — GRAB [E]`, '#ffd54f');
    } else if (wok.cooking > 0) stateLine(s, `SEARING ${Math.round((wok.cooking / wok.cookSecs) * 100)}%`, '#ffcc80');
    else stateLine(s, 'EMPTY — BRING RACIK', '#b0bec5');
  }
  if (chef.plateDish) {
    const pr = RECIPES.find((r) => r.id === chef.plateDish);
    stateLine(STATIONS.plate, `${pr.name.toUpperCase()} $${pr.price} — READY`, '#ffd54f');
  } else {
    stateLine(STATIONS.plate, 'PLATE [E]', '#b0bec5');
  }

  // ---- prep island: what the cook is carrying, laid out ----
  ctx.fillStyle = 'rgba(93,64,55,0.55)';
  rr(ctx, 280, 430, 720, 100, 16); ctx.fill();
  ctx.fillStyle = '#6d4c41';
  rr(ctx, 292, 442, 696, 76, 12); ctx.fill();
  text(ctx, 'PREP ISLAND', 308, 462, 11, '#d7ccc8', 'bold', 'left');
  // Mid-assembly counter: what the carried ingredients add up to so far.
  const rawIds = chef.carrying.filter((c) => !c.id.startsWith('dish:') && c.id !== 'burnt').map((c) => c.id);
  const exact = recipeFor(rawIds);
  let racik = 'RACIK —';
  const carriedDish = chef.carrying.find((c) => c.id.startsWith('dish:'));
  if (exact) {
    racik = `RACIK: ${exact.name.toUpperCase()} ${rawIds.length}/${exact.needs.length} ✓`;
  } else if (carriedDish) {
    // A finished dish in hand is a completed assembly.
    const done = RECIPES.find((r) => r.id === carriedDish.id.slice(5));
    if (done) racik = `RACIK: ${done.name.toUpperCase()} ${done.needs.length}/${done.needs.length} ✓`;
  } else if (rawIds.length > 0) {
    let best = null;
    let bestHit = 0;
    for (const r of RECIPES) {
      const hit = rawIds.filter((id) => r.needs.includes(id)).length;
      if (hit > bestHit) { bestHit = hit; best = r; }
    }
    if (best) racik = `RACIK: ${best.name.toUpperCase()} ${bestHit}/${best.needs.length}`;
    else racik = `RACIK ${rawIds.length}/4`;
  }
  text(ctx, racik, 972, 462, 11, '#aed581', 'bold', 'right');
  chef.carrying.forEach((c, i) => {
    const x = 340 + i * 110;
    const y = 492;
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill();
    if (c.id.startsWith('dish:')) {
      drawDish(ctx, c.id.slice(5), x, y, 24);
      if (c.garnished) text(ctx, '✦', x + 20, y - 20, 14, '#ffd54f');
    }
    else if (c.id === 'burnt') { ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill(); }
    else drawIngredient(ctx, INGREDIENTS[c.id].draw, x, y, 20);
    if (!c.prepped && INGREDIENTS[c.id]) text(ctx, 'RAW', x, y + 34, 9, '#ff8a65');
  });
  if (chef.carrying.length === 0) text(ctx, 'hands empty — grab ingredients from the crates', 640, 492, 13, '#bcaaa4');

  // ---- the cook, on top of the floor and stations ----
  drawChef(ctx, chef);

  // ---- dining tables with customers ----
  // A served dish lands on its table and its customer eats it: the
  // service loop closes visibly instead of vanishing at the window.
  const happy = game.lastServeAt && performance.now() - game.lastServeAt < 3000;
  const tableXs = [380, 700, 1020];
  tableXs.forEach((tx, i) => {
    ctx.fillStyle = '#bcaaa4';
    rr(ctx, tx - 110, 600, 220, 90, 12); ctx.fill();
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(tx - 100, 690, 16, 30);
    ctx.fillRect(tx + 84, 690, 16, 30);
    const servedDish = game.tableDishes && game.tableDishes[i];
    const mood = servedDish ? 'happy' : (happy && i === (game.servedTable ?? 0) ? 'happy' : (board.tickets.length > i ? 'waiting' : 'idle'));
    drawCustomer(ctx, tx, 566, mood, servedDish || (happy && i === (game.servedTable ?? 0) ? game.lastDish : null));
  });

  // ---- today's menu card ----
  ctx.fillStyle = '#fff8e7';
  rr(ctx, 1090, 560, 166, 150, 10); ctx.fill();
  ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'MENU BU SARI', 1173, 578, 12, '#e65100');
  RECIPES.forEach((r, i) => {
    text(ctx, `${r.name} $${r.price}`, 1100, 600 + i * 18, 11, '#5d4037', 'normal', 'left');
  });
  text(ctx, '✦ GARNISH +$15 TIP', 1100, 694, 10, '#2e7d32', 'bold', 'left');

  // ---- floaters ----
  for (const f of game.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 18, f.color, 'bold');
    ctx.globalAlpha = 1;
  }

  // ---- rush announcement ----
  if (board.inRush && game.elapsed - RUSH_AT < 4 && game.phase === 'playing') {
    ctx.fillStyle = 'rgba(229,57,53,0.92)';
    rr(ctx, 390, 300, 500, 64, 14); ctx.fill();
    text(ctx, '🔥 LUNCH RUSH! Orders are coming faster!', 640, 332, 22, '#ffffff');
  }

  // ---- title / game over ----
  if (game.phase === 'title') {
    ctx.fillStyle = 'rgba(38,50,56,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'WARUNG BU SARI', 640, 250, 64, '#ffd54f');
    text(ctx, '— Gang Mawar’s busiest kitchen —', 640, 310, 26, '#ffcc80');
    text(ctx, 'Cook the tickets before patience runs out.', 640, 360, 20, '#ffffff');
    text(ctx, 'Arrows / WASD to move • E or Space to use a station • Click a station to walk to it', 640, 400, 16, '#eceff1');
    text(ctx, 'Chop → wok → plate → serve. Gado-gado skips the wok.', 640, 430, 16, '#eceff1');
    text(ctx, 'Press ENTER or click to start the shift', 640, 490, 20, '#69f0ae');
  }
  if (game.phase === 'over') {
    ctx.fillStyle = 'rgba(38,50,56,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'SHIFT OVER!', 640, 300, 56, '#ffd54f');
    text(ctx, `Served ${board.served} dishes • Best combo x${board.bestCombo} • Earned $${board.coins}`, 640, 370, 22, '#ffffff');
    text(ctx, 'Press R to cook another shift', 640, 430, 20, '#69f0ae');
  }

  // footer hint
  text(ctx, 'WASD / arrows to move  •  E to use a station  •  M to mute  •  R to restart', 640, 786, 12, '#5d4037');
}

/** Steam puffs above a cooking wok, for the live game. */
export function spawnSteam(game, x, y) {
  game.floaters.push({ text: '〜', x: x + (Math.random() - 0.5) * 30, y, life: 0.9, max: 0.9, color: 'rgba(255,255,255,0.7)' });
}

export function floatText(game, textStr, x, y, color) {
  game.floaters.push({ text: textStr, x, y, life: 1.4, max: 1.4, color: color || '#fff' });
}

export function tickFloaters(game, dt) {
  for (const f of game.floaters) { f.life -= dt; f.y -= 26 * dt; }
  game.floaters = game.floaters.filter((f) => f.life > 0);
}
