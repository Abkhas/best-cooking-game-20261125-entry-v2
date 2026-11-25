// Sizzle & Serve — Warung Rush, v2: the order board and the shift clock.
// Tickets arrive, wait with a draining patience bar, and leave happy or
// angry. Halfway through the shift the LUNCH RUSH hits: tickets arrive
// faster and patience runs shorter, so the cook must plan routes that
// share ingredients — one egg run can feed two tickets at once.

import { dishesUnlocked } from './menu.js';

export const SHIFT_SECONDS = 180;
export const RUSH_AT = 90; // seconds in: the lunch rush begins

export class OrderBoard {
  constructor() {
    this.tickets = [];
    this.nextId = 1;
    this.spawnIn = 2.0;
    this.served = 0;
    this.lost = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboLeft = 0;
    this.rushAnnounced = false;
  }

  get maxTickets() { return 4; }
  get inRush() { return this._elapsed >= RUSH_AT; }

  spawnGap(elapsedSec) {
    // Rush halves the gap: 13s early, ~8s late, ~5s in the rush.
    const base = Math.max(7, 13 - elapsedSec / 22);
    return elapsedSec >= RUSH_AT ? base * 0.6 : base;
  }

  patienceFor(elapsedSec) {
    const base = Math.max(28, 46 - elapsedSec / 11);
    return elapsedSec >= RUSH_AT ? base * 0.8 : base;
  }

  spawnTicket(elapsedSec) {
    const pool = dishesUnlocked(elapsedSec);
    const recipe = pool[Math.floor(Math.random() * pool.length)];
    const patience = this.patienceFor(elapsedSec);
    this.tickets.push({
      id: this.nextId++, recipe, patience, patienceMax: patience,
      born: elapsedSec, flash: 0, served: false,
    });
  }

  /** Advance the board one frame. Returns how many tickets expired. */
  update(dt, elapsedSec) {
    this._elapsed = elapsedSec;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.tickets.length < this.maxTickets) {
      this.spawnTicket(elapsedSec);
      this.spawnIn = this.spawnGap(elapsedSec);
    }
    if (this.comboLeft > 0) {
      this.comboLeft -= dt;
      if (this.comboLeft <= 0) this.combo = 0;
    }
    for (const t of this.tickets) {
      t.patience -= dt;
      if (t.flash > 0) t.flash -= dt;
    }
    const expired = this.tickets.filter((t) => t.patience <= 0);
    this.lost += expired.length;
    this.tickets = this.tickets.filter((t) => t.patience > 0);
    return expired.length;
  }

  /** Serve a finished dish. Pays more the faster it arrives, plus combo. */
  serveDish(recipeId) {
    const idx = this.tickets.findIndex((t) => t.recipe.id === recipeId);
    if (idx < 0) return { coins: 0, served: false };
    const ticket = this.tickets[idx];
    const speed = Math.max(0, ticket.patience / ticket.patienceMax);
    const earned = Math.round(ticket.recipe.price * (0.6 + 0.4 * speed)) + this.combo * 10;
    this.tickets.splice(idx, 1);
    this.served++;
    this.coins += earned;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboLeft = 20;
    return { coins: earned, served: true, ticketId: ticket.id };
  }

  /** A wrong dish at the window: the hungriest ticket loses patience. */
  wrongServe() {
    if (this.tickets.length === 0) return;
    let worst = this.tickets[0];
    for (const t of this.tickets) if (t.patience < worst.patience) worst = t;
    worst.patience = Math.max(1, worst.patience - 12);
    worst.flash = 0.6;
  }
}
