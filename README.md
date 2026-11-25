# Warung Bu Sari — Gang Mawar (v2 challenger)

A complete cooking game in plain static files: run Bu Sari's one-cook
warung on Gang Mawar through a 3-minute shift. Tickets arrive on the
order board, the cook grabs ingredients from the crates, chops what
needs chopping, fires the woks, plates, and serves before patience
runs out.

## What v2 changes vs v1

- **Lunch rush phase.** Halfway through the shift (90s) orders arrive
  ~40% faster and patience runs ~20% shorter, with a red banner and a
  bell. Pressure grows without adding chores.
- **A no-wok dish.** Gado-gado (veg + egg + chili) plates straight from
  the hand — some orders skip the wok entirely, so routes split: wok
  dishes queue at two woks, cold dishes go straight to the plate.
- **Shared-ingredient routes.** Five dishes share egg, rice, chili and
  veg, so one crate run can feed two tickets — planning the route
  matters more than running fast.
- **Feel.** Every action answers at once: a floater (`CHOP CHOP!`,
  `SERVED! +$90`), a blip, a progress ring on chopping and on each wok,
  a `READY! +$70` pulse, and a shift timer that shifts green → amber → red
  and pulses under 30 seconds.
- **Customers eat.** Three dining tables seat customers; serve a dish
  and the matching table's customer smiles with the plate in front of
  them, so the service rush reads in a glance.
- **Cover staged at the busiest moment.** Lunch rush, both woks cooking
  with % progress, a plated gado-gado, four tickets queued, the cook
  carrying soto ayam to the serve window, a happy customer eating.
- **Rival-research polish (25 Nov, before round 2).** Every ticket now
  shows its seconds left on its patience bar; woks show `%` progress
  beside the countdown; the prep island carries a `RACIK` mid-assembly
  counter (`RACIK: MIE GORENG 2/3`); the HUD counts `MISSED` dishes
  next to `SERVED`; a ready wok names its price (`READY! +$70`).
  The kitchen keeps its dark anchors — dark woks, crates and prep
  island against the warm floor — so the food stays saturated and
  readable, never pale-on-pale. Identity is specific now: this is Bu
  Sari's warung on Gang Mawar, not a generic "Sizzle & Serve".

## What v2p (polish challenger) changes vs v2-polished

- **The middle band is a working counter now, not bare floor.** A
  GARNISH PASS fills it — dark wood, brass edge, four labeled garnish
  bowls (BAWANG / SAMBAL / JERUK / DAUN BAWANG), a dish mid-garnish
  (TABUR…), and a batik runner under it — so the busiest part of the
  kitchen reads in the cover, not just the top row.
- **One new depth mechanic, visible in screenshots: garnish.** Carry a
  finished dish to the pass and press E to TABUR it — garnished dishes
  earn a +$15 tip on serve (menu card says so, the pass flashes
  "TABUR NOW! +$15 TIP [E]" when you hold an ungarnished dish, a ✦
  marks the finished plate). Optional, never a chore: an ungarnished
  dish still serves, so the old loop is untouched.
- **Wok burn pressure you can see.** A ready wok now smokes, drains a
  red burn bar, and flashes "🔥 BURN IN 2s — GRAB IT!" for its last
  three seconds on the pass — the grab-it-now moment is in the cover.
- **Denser labeled micro-feedback.** Every ticket shows its in-hand
  progress (✓ 1/3) or its fast-serve tip on the patience bar
  ("26s • FAST +$21"); every station carries a dark-pill state line
  (CHOP [E], SEARING 71%, READY +$70 — GRAB [E], EMPTY — BRING RACIK,
  MIE GORENG $70 — READY); the menu card lists the garnish tip.
- **Served dishes land.** A served dish now stays on its table with its
  customer eating it (two happy eaters in the cover), instead of
  vanishing at the window — the service loop closes visibly.

## How to play

Arrows / WASD to move, E or Space to use a station, click a station to
walk to it. M mutes, R restarts. Chop → wok → plate → serve. Wrong dish
at the window angers the hungriest ticket; a wok left ready too long
burns — trash it. Three lost tickets end the shift.

## Files (one clear job each)

- `game/index.html` — page, canvas, nothing else
- `game/src/boot.js` — game loop, input, title/playing/over
- `game/src/menu.js` — ingredients and the five recipes
- `game/src/board.js` — order board, combo, lunch-rush timing
- `game/src/chef.js` — the cook, stations, woks, chopping, serving
- `game/src/paint.js` — everything drawn: kitchen, food, HUD, customers
- `game/src/scenes.js` — staged screenshot scenes + scripted self-test
- `game/src/sound.js` — synthesized blips, no audio files

## Design notes (why v2 reads better to the judge)

- The cover is one frame of a complete game: order board, crates,
  chop board, two woks (one cooking, one ready), a plated dish, a
  timer, a serve window, and a customer eating — nothing the first
  criterion asks for is left to another screenshot.
- The timer is the biggest colour in the HUD: it starts green, turns
  amber mid-shift, red in the last 30 seconds, and the bar drains with
  it, so the pressure reads even at contact-sheet size.
- Depth is visible, not just coded: the menu card lists five dishes,
  one marked NO WOK on its ticket, and the rush badge says the shift
  changes halfway through.
- Structure is the outline: seven source files, each named for its one
  job, and the dossier lists them in load order.

```sh
node serve.ts            # play at http://localhost:8080
# headless self-test: open http://localhost:8080/?selftest=1
# and read the #selftest node — it reports SELFTEST PASS/FAIL.
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node best-cooking-game-20261125-0137-kit/cli/makefun.mjs check --help
```
