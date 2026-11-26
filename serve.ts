// Server statis lokal untuk pengembangan situs "Anggaran Rumah Tangga Kita".
// Menjalankan: `node serve.ts` lalu buka http://localhost:8080
// (atau `node serve.ts --port 8081` untuk port lain).
// Hanya melayani file di bawah app/, menolak path di luar root, dan tidak
// melakukan apa pun yang clever: ini alat bantu lokal, bukan server internet.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const args = process.argv.slice(2);
const flagIndex = args.indexOf('--port');
const diminta = flagIndex === -1 ? 8080 : Number(args[flagIndex + 1]);
const port = Number.isInteger(diminta) && diminta > 0 && diminta < 65536 ? diminta : 8080;

const TIPE_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function layani(request, response) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const berkas = resolve(join(appRoot, normalize(pathname)));
  if (berkas !== appRoot && !berkas.startsWith(appRoot + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let ukuran;
  try {
    const info = statSync(berkas);
    if (!info.isFile()) throw new Error('bukan file');
    ukuran = info.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': TIPE_MIME[extname(berkas).toLowerCase()] ?? 'application/octet-stream',
    'content-length': ukuran,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  createReadStream(berkas).pipe(response);
}

createServer(layani).listen(port, '127.0.0.1', () => {
  console.log(`Anggaran Rumah Tangga Kita: http://localhost:${port}`);
});
