// Empat chart canvas 2D murni — tanpa library, tanpa CDN.
// Semua fungsi menerima data sebagai argumen; tidak ada variabel global yang dibayangi di sini.

export function fmtJt(nilai) {
  if (nilai >= 1000000) return 'Rp' + (nilai / 1000000).toFixed(nilai % 1000000 === 0 ? 0 : 1).replace('.', ',') + ' jt';
  if (nilai >= 1000) return 'Rp' + Math.round(nilai / 1000) + ' rb';
  return 'Rp' + nilai;
}

function siapkanCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // Ukuran backing store mengikuti lebar tampil kartu (x2 untuk ketajaman),
  // supaya koordinat gambar 1:1 dengan piksel CSS dan teks tidak mengecil.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 640;
  const cssH = 300;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.height = cssH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.font = '13px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  return { ctx, lebar: cssW, tinggi: cssH };
}

// 1. Donut komposisi outflow.
export function drawDonut(canvas, kelompok) {
  const s = siapkanCanvas(canvas);
  if (!s) return false;
  const { ctx, lebar, tinggi } = s;
  const total = kelompok.reduce((a, k) => a + k.total, 0);
  const cx = lebar * 0.28;
  const cy = tinggi / 2;
  const r = Math.min(lebar * 0.22, tinggi / 2 - 14);
  let sudut = -Math.PI / 2;
  for (const k of kelompok) {
    const porsi = (k.total / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, sudut, sudut + porsi);
    ctx.closePath();
    ctx.fillStyle = k.warna;
    ctx.fill();
    sudut += porsi;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('Rp 18,5 jt', cx, cy - 2);
  ctx.font = '12px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('total / bulan', cx, cy + 16);
  // Legenda di kanan (nama singkat + %; angka lengkap ada di figcaption).
  ctx.textAlign = 'left';
  ctx.font = '13px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  let y = 34;
  const namaSingkat = {
    'Kebutuhan': 'Kebutuhan', 'Keinginan': 'Keinginan', 'Zakat & sedekah': 'Zakat',
    'Tabungan & investasi': 'Tabungan', 'Belum teralokasi': 'Fleksibel',
  };
  for (const k of kelompok) {
    ctx.fillStyle = k.warna;
    ctx.fillRect(lebar * 0.56, y - 10, 12, 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillText((namaSingkat[k.kelompok] || k.kelompok) + ' ' + ((k.total / total) * 100).toFixed(1).replace('.', ',') + '%', lebar * 0.56 + 18, y);
    y += 30;
  }
  return true;
}

// 2. Bar grouped 50/30/20 target vs aktual.
export function drawBar503020(canvas, pilar) {
  const s = siapkanCanvas(canvas);
  if (!s) return false;
  const { ctx, lebar, tinggi } = s;
  const maks = Math.max(...pilar.flatMap(p => [p.target, p.aktual])) * 1.18;
  const dasar = tinggi - 34;
  const area = dasar - 34;
  const grupLebar = lebar / 3;
  const barLebar = 36;
  ctx.textAlign = 'center';
  ctx.font = '12px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  pilar.forEach((p, i) => {
    const x0 = i * grupLebar + grupLebar / 2;
    const tTinggi = (p.target / maks) * area;
    const aTinggi = (p.aktual / maks) * area;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x0 - barLebar - 4, dasar - tTinggi, barLebar, tTinggi);
    ctx.fillStyle = p.aktual > p.target ? '#dc2626' : '#16a34a';
    ctx.fillRect(x0 + 4, dasar - aTinggi, barLebar, aTinggi);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(fmtJt(p.target), x0 - barLebar / 2 - 4, dasar - tTinggi - 6);
    ctx.fillText(fmtJt(p.aktual), x0 + barLebar / 2 + 4, dasar - aTinggi - 6);
    ctx.fillStyle = '#475569';
    ctx.fillText(p.nama, x0, dasar + 16);
  });
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath(); ctx.moveTo(8, dasar); ctx.lineTo(lebar - 8, dasar); ctx.stroke();
  // Keterangan warna ada di figcaption di bawah grafik.
  return true;
}

// 3. Line proyeksi tabungan 12 bulan + garis target putus-putus.
export function drawLine(canvas, nilai, labelBulan, target) {
  const s = siapkanCanvas(canvas);
  if (!s) return false;
  const { ctx, lebar, tinggi } = s;
  const kiri = 66, kanan = 16, atas = 30, bawah = 32;
  const w = lebar - kiri - kanan;
  const h = tinggi - atas - bawah;
  const maks = target;
  const x = i => kiri + (i / (nilai.length - 1)) * w;
  const y = v => atas + h - (v / maks) * h;
  // Grid + label sumbu Y.
  ctx.strokeStyle = '#e2e8f0';
  ctx.fillStyle = '#475569';
  ctx.font = '12px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'right';
  [0, 40000000, 80000000, 120000000].forEach(v => {
    ctx.beginPath(); ctx.moveTo(kiri, y(v)); ctx.lineTo(lebar - kanan, y(v)); ctx.stroke();
    ctx.fillText(fmtJt(v), kiri - 6, y(v) + 4);
  });
  // Garis target putus-putus + label di ujung kanan (tidak menabrak label sumbu).
  ctx.strokeStyle = '#dc2626';
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(kiri, y(target)); ctx.lineTo(lebar - kanan, y(target)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#dc2626';
  ctx.textAlign = 'right';
  ctx.font = '13px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillText('Target Rp120 jt', lebar - kanan, y(target) + 16);
  // Garis proyeksi.
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  nilai.forEach((v, i) => { if (i === 0) ctx.moveTo(x(i), y(v)); else ctx.lineTo(x(i), y(v)); });
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#16a34a';
  nilai.forEach((v, i) => { ctx.beginPath(); ctx.arc(x(i), y(v), 3, 0, Math.PI * 2); ctx.fill(); });
  // Label bulan (semua 12) + nilai akhir di atas titik terakhir.
  ctx.fillStyle = '#475569';
  ctx.font = '12px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  labelBulan.forEach((b, i) => { ctx.fillText(b, x(i), tinggi - 10); });
  ctx.fillStyle = '#1e293b';
  ctx.font = '13px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Des: Rp24.557.711', lebar - kanan, y(nilai[nilai.length - 1]) - 10);
  return true;
}

// 4. Bar horizontal per kategori kebutuhan, urut menurun.
export function drawNeedsBar(canvas, item) {
  const s = siapkanCanvas(canvas);
  if (!s) return false;
  const { ctx, lebar, tinggi } = s;
  const terurut = [...item].sort((a, b) => b.nominal - a.nominal);
  const maks = terurut[0].nominal * 1.22;
  const barTinggi = 22;
  const gap = (tinggi - 20 - terurut.length * barTinggi) / (terurut.length + 1);
  ctx.textAlign = 'left';
  terurut.forEach((it, i) => {
    const y = 16 + gap + i * (barTinggi + gap);
    const barLebar = (it.nominal / maks) * (lebar - 210);
    ctx.fillStyle = '#475569';
    ctx.fillText(it.nama, 8, y + 15);
    ctx.fillStyle = it.nama.includes('KPR') ? '#dc2626' : '#16a34a';
    ctx.fillRect(150, y, barLebar, barTinggi);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(fmtJt(it.nominal), 150 + barLebar + 8, y + 15);
  });
  return true;
}
