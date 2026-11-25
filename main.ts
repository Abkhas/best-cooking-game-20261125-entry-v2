// Sizzle & Serve — Warung Rush, v2: the hand-in program (Node 22, stdlib only).
// The game is plain static files under game/ — a canvas warung kitchen that
// runs offline in desktop Chrome — and this program hands it in: it copies
// game/ and screenshots/ from beside this file into the output directory
// and writes dossier.json with the kit's vendored library, which the
// scorer rebuilds byte for byte. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own: more than 4 screenshots or one over
// 256 KiB, more than 993 game entries or 48 MiB, or a game path over
// 1000 bytes would be refused by the scorer itself.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
