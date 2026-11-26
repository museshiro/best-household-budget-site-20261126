// Entry "Anggaran Rumah Tangga Kita" — best-household-budget-site-20261126-1457.
// Menyerahkan situs: menyalin app/ dan screenshots/ dari repo ini ke direktori
// output, lalu menulis /output/dossier.json memakai buildDossier dari
// vendor/makefun-frontend.ts (salinan kit, tidak diubah).
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   MAKEFUN_OUTPUT_DIR=/tmp/out-test-budget node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function salinSumber() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  const shots = join(repoRoot, 'screenshots');
  if (existsSync(shots)) cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
}

function laporkanIsi() {
  const appFiles = readdirSync(join(outDir, 'app'));
  const shotFiles = readdirSync(join(outDir, 'screenshots'))
    .filter(f => statSync(join(outDir, 'screenshots', f)).isFile())
    .map(f => f + ' (' + statSync(join(outDir, 'screenshots', f)).size + ' byte)');
  console.log(`app/: ${appFiles.length} entri; screenshots/: ${shotFiles.join(', ')}`);
}

salinSumber();
laporkanIsi();

// Batas scorer (lihat kit RULES.txt): dossier teks maks 160 KiB, maks 4 screenshot
// @ 256 KiB, app/ maks 993 file dan 16 MiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`dossier.json ditulis: ${dossier.length} byte -> ${outDir}`);
