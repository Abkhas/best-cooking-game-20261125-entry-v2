// Sizzle & Serve — Warung Rush, v2: the cook, the stations, and the wok.
// One cook, two woks, one chopping board, one plate, one serve window.
// The loop is a route: crate -> chop board -> wok -> plate -> window.
// Gado-gado skips the wok. A wok left too long burns, and burnt food
// goes in the trash. Every action answers at once: a floater, a sound,
// and a progress ring the moment it starts.

import { INGREDIENTS, recipeFor, allPrepped } from './menu.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Station hit-boxes: {x, y, w, h} in view pixels. The painter draws
// exactly these boxes, so what you see is where you stand.
export const STATIONS = {
  rice:    { x: 24,  y: 150, w: 112, h: 92 },
  noodle:  { x: 24,  y: 258, w: 112, h: 92 },
  egg:     { x: 24,  y: 366, w: 112, h: 92 },
  chicken: { x: 148, y: 150, w: 112, h: 92 },
  veg:     { x: 148, y: 258, w: 112, h: 92 },
  chili:   { x: 148, y: 366, w: 112, h: 92 },
  chop:    { x: 300, y: 170, w: 140, h: 84 },
  wok1:    { x: 520, y: 170, w: 140, h: 84 },
  wok2:    { x: 700, y: 170, w: 140, h: 84 },
  plate:   { x: 880, y: 170, w: 140, h: 84 },
  serve:   { x: 1090, y: 250, w: 166, h: 180 },
  trash:   { x: 1090, y: 470, w: 90, h: 76 },
};

export function stationCenter(name) {
  const s = STATIONS[name];
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

function newWok() {
  return { items: [], cooking: 0, cookSecs: 0, ready: false, burnt: false, recipe: null, overSecs: 0 };
}

export class Chef {
  constructor() {
    this.x = 640;
    this.y = 600;
    this.speed = 310;
    this.carrying = []; // {id, prepped} or {id:'dish:<recipe>'}
    this.chopping = null; // {item, done, total}
    this.plateDish = null; // recipe id waiting on the plate station
    this.wok = newWok();
    this.wok2 = newWok();
    this.dir = 1;
  }

  get maxCarry() { return 4; }

  move(dx, dy, dt) {
    if (dx === 0 && dy === 0) return;
    const len = Math.hypot(dx, dy);
    this.x = Math.min(1252, Math.max(28, this.x + (dx / len) * this.speed * dt));
    this.y = Math.min(768, Math.max(150, this.y + (dy / len) * this.speed * dt));
    if (dx !== 0) this.dir = dx > 0 ? 1 : -1;
  }

  moveToward(tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    if (Math.hypot(dx, dy) < 6) return;
    this.move(dx, dy, dt);
  }

  tick(dt) {
    if (this.chopping) {
      this.chopping.done += dt;
      if (this.chopping.done >= this.chopping.total) {
        this.chopping.item.prepped = true;
        this.chopping = null;
      }
    }
    for (const w of [this.wok, this.wok2]) {
      if (w.cooking > 0 && !w.ready) {
        w.cooking += dt;
        if (w.cooking >= w.cookSecs) { w.ready = true; w.overSecs = 0; }
      } else if (w.ready && !w.burnt) {
        w.overSecs += dt;
        if (w.overSecs > 6) { w.burnt = true; }
      }
    }
  }

  nearestStation() {
    let best = null;
    let bestD = 120;
    for (const [name, s] of Object.entries(STATIONS)) {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const d = Math.hypot(this.x - cx, this.y - cy);
      if (d < bestD) { bestD = d; best = name; }
    }
    return best;
  }

  /** Use the nearest station. shout(text, color) is the instant feedback. */
  interact(board, sfx, shout) {
    const say = (t, c) => { if (shout) shout(t, this.x, this.y - 56, c || '#fff'); };
    const blip = (f) => { if (sfx) sfx.blip(f); };
    const station = this.nearestStation();
    if (!station) return;

    if (INGREDIENTS[station]) {
      if (this.carrying.length >= this.maxCarry) { say('HANDS FULL!', '#ff8a65'); return; }
      this.carrying.push({ id: station, prepped: INGREDIENTS[station].prep === 'raw' });
      say(`+ ${INGREDIENTS[station].name}`, '#ffe082');
      blip(520);
      return;
    }

    if (station === 'chop') {
      const raw = this.carrying.find((c) => !c.prepped && INGREDIENTS[c.id].prep === 'chop');
      if (!raw) { say('NOTHING TO CHOP', '#b0bec5'); return; }
      if (this.chopping) return;
      this.chopping = { item: raw, done: 0, total: 1.6 };
      say('CHOP CHOP!', '#aed581');
      blip(700);
      return;
    }

    if (station === 'wok1' || station === 'wok2') {
      const wok = station === 'wok1' ? this.wok : this.wok2;
      if (wok.burnt) {
        this.carrying.push({ id: 'burnt', prepped: true });
        Object.assign(wok, newWok());
        say('BURNT! TRASH IT', '#ff7043');
        blip(180);
        return;
      }
      if (wok.ready) {
        if (this.carrying.length >= this.maxCarry) { say('HANDS FULL!', '#ff8a65'); return; }
        this.carrying.push({ id: `dish:${wok.recipe.id}`, prepped: true });
        say(`${wok.recipe.name.toUpperCase()} READY!`, '#ffd54f');
        Object.assign(wok, newWok());
        blip(880);
        return;
      }
      if (wok.cooking > 0) { say('STILL COOKING…', '#b0bec5'); return; }
      const ids = this.carrying.filter((c) => !c.id.startsWith('dish:')).map((c) => c.id);
      const recipe = recipeFor(ids);
      if (!recipe || !recipe.wok) { say('NO RECIPE IN HAND', '#b0bec5'); return; }
      if (!allPrepped(this.carrying.filter((c) => !c.id.startsWith('dish:')))) {
        say('CHOP IT FIRST!', '#ff8a65');
        return;
      }
      wok.items = this.carrying.filter((c) => !c.id.startsWith('dish:'));
      this.carrying = this.carrying.filter((c) => c.id.startsWith('dish:'));
      wok.recipe = recipe;
      wok.cookSecs = recipe.cookSecs;
      wok.cooking = 0.01;
      say(`IN THE WOK: ${recipe.name.toUpperCase()}`, '#ffcc80');
      blip(440);
      return;
    }

    if (station === 'plate') {
      if (this.plateDish) {
        if (this.carrying.length >= this.maxCarry) { say('HANDS FULL!', '#ff8a65'); return; }
        this.carrying.push({ id: `dish:${this.plateDish}`, prepped: true });
        this.plateDish = null;
        say('PLATED UP!', '#ffd54f');
        blip(880);
        return;
      }
      const dish = this.carrying.find((c) => c.id.startsWith('dish:'));
      if (dish) {
        this.plateDish = dish.id.slice(5);
        this.carrying = this.carrying.filter((c) => c !== dish);
        say('ON THE PLATE', '#fff');
        blip(660);
        return;
      }
      const ids = this.carrying.map((c) => c.id);
      const recipe = recipeFor(ids);
      if (recipe && !recipe.wok && allPrepped(this.carrying)) {
        this.plateDish = recipe.id;
        this.carrying = [];
        say(`${recipe.name.toUpperCase()} — NO WOK NEEDED!`, '#aed581');
        blip(880);
        return;
      }
      say('NOTHING TO PLATE', '#b0bec5');
      return;
    }

    if (station === 'serve') {
      const dish = this.carrying.find((c) => c.id.startsWith('dish:'));
      if (!dish) { say('BRING A DISH!', '#b0bec5'); return; }
      const recipeId = dish.id.slice(5);
      const res = board.serveDish(recipeId);
      this.carrying = this.carrying.filter((c) => c !== dish);
      if (res.served) {
        say(`SERVED! +$${res.coins}`, '#69f0ae');
        if (sfx) sfx.served();
      } else {
        say('NO ONE ORDERED THAT!', '#ff8a65');
        board.wrongServe();
        if (sfx) sfx.wrong();
      }
      return;
    }

    if (station === 'trash') {
      if (this.carrying.length === 0) { say('NOTHING TO TRASH', '#b0bec5'); return; }
      this.carrying = [];
      this.chopping = null;
      say('TOSSED', '#b0bec5');
      blip(220);
    }
  }
}
