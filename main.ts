// Anggaran Rumah Tangga Kita — penyerahan entry (Node 22, standard library saja).
// Situsnya adalah file statis di app/ (index.html + CSS + JS, tanpa build step,
// tanpa permintaan jaringan). Program ini menyalin app/ dan screenshots/ dari
// sebelah file ini ke direktori output, lalu menulis /output/dossier.json —
// ringkasan yang dibaca juri — dengan library make.fun yang di-vendor.
//
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Vendor tidak disentuh: dossier.json harus byte-per-byte sama dengan yang
// ditulis buildDossier dari vendor/makefun-frontend.ts.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Batas scorer (gate): hanya text_max_bytes yang membentuk byte dossier;
// batas lain menolak entry yang memang akan ditolak scorer (lebih dari 4
// screenshot atau satu di atas 256 KiB; app/ di atas 993 entri atau 16 MiB).
// Output TIDAK pernah dihapus di sini — main.ts hanya menambah ke dalamnya.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

console.log(`dossier written to ${join(out, 'dossier.json')}`);
