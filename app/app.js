// Anggaran Rumah Tangga Kita — logika situs (state, 10 tools, render, export CSV).
// Tanpa network sama sekali; semua data dari data.js + localStorage.
import {
  SAMPLE_SETUP, BUDGET_CATEGORIES, GROUP_TOTALS,
  SAMPLE_TRANSACTIONS, SAVINGS_PROJECTION, SAVINGS_MONTHS,
  TIPS, CHECKLIST_ITEMS, KPR_BREAKDOWN, ZAKAT_BREAKDOWN,
} from './data.js';
import { drawDonut, drawBar503020, drawLine, drawNeedsBar, fmtJt } from './charts.js';

const fmtAngka = new Intl.NumberFormat('id-ID');
const fmtRp = n => {
  const bulat = Math.round(n);
  if (bulat < 0) return '−Rp' + fmtAngka.format(-bulat);
  return 'Rp' + fmtAngka.format(bulat);
};
const fmtPersen = n => (Math.round(n * 10) / 10).toString().replace('.', ',') + '%';

const KEY_SETUP = 'ahrt-setup';
const KEY_TRANSACTIONS = 'ahrt-transactions';
const KEY_CHECKLIST = 'ahrt-checklist';

const $ = id => document.getElementById(id);
const el = (tag, teks, kelas) => {
  const n = document.createElement(tag);
  if (teks !== undefined) n.textContent = teks;
  if (kelas) n.className = kelas;
  return n;
};

let appState = {
  setup: { ...SAMPLE_SETUP },
  transactions: SAMPLE_TRANSACTIONS.map(t => ({ ...t })),
  checklist: {},
};
let editingId = null;

function simpanLocal() {
  try {
    localStorage.setItem(KEY_SETUP, JSON.stringify(appState.setup));
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(appState.transactions));
    localStorage.setItem(KEY_CHECKLIST, JSON.stringify(appState.checklist));
  } catch (e) { /* penyimpanan penuh / privat: situs tetap jalan dari memori */ }
}

function muatLocal() {
  try {
    const s = localStorage.getItem(KEY_SETUP);
    const t = localStorage.getItem(KEY_TRANSACTIONS);
    const c = localStorage.getItem(KEY_CHECKLIST);
    if (s) appState.setup = { ...SAMPLE_SETUP, ...JSON.parse(s) };
    if (t) appState.transactions = JSON.parse(t);
    if (c) appState.checklist = JSON.parse(c);
    return Boolean(s || t);
  } catch (e) { return false; }
}

function muatDataContoh() {
  appState.setup = { ...SAMPLE_SETUP };
  appState.transactions = SAMPLE_TRANSACTIONS.map(t => ({ ...t }));
  appState.checklist = {};
  editingId = null;
  simpanLocal();
  isiFormSetup();
  renderSemua();
}

function totalPemasukan() {
  return appState.setup.gajiSuami + appState.setup.gajiIstri + appState.setup.pemasukanLain;
}

function jumlahKelompok(kelompok) {
  return BUDGET_CATEGORIES.filter(k => k.kelompok === kelompok)
    .reduce((a, k) => a + k.nominal, 0);
}

function totalPengeluaranTracker() {
  return appState.transactions.filter(t => t.jenis === 'pengeluaran')
    .reduce((a, t) => a + t.nominal, 0);
}

function totalPemasukanTracker() {
  return appState.transactions.filter(t => t.jenis === 'pemasukan')
    .reduce((a, t) => a + t.nominal, 0);
}

// ---------- Skor kesehatan (0–100) ----------
function hitungSkor() {
  const pemasukan = totalPemasukan();
  const kebutuhan = jumlahKelompok('Kebutuhan');
  const tabungan = jumlahKelompok('Tabungan');
  const sisa = totalPemasukanTracker() - totalPengeluaranTracker();
  let skor = 100;
  const alasan = [];
  if (pemasukan > 0 && kebutuhan / pemasukan > 0.6) { skor -= 30; alasan.push('kebutuhan ' + fmtPersen(kebutuhan / pemasukan * 100) + ' dari pemasukan, di atas batas sehat 60%'); }
  if (pemasukan > 0 && tabungan / pemasukan < 0.1) { skor -= 20; alasan.push('tabungan di bawah 10% pemasukan'); }
  const over = kategoriOverAnggaran();
  if (over.length > 0) { skor -= 15; alasan.push('kategori ' + over.join(', ') + ' melebihi 120% anggaran'); }
  if (sisa < 0) { skor -= 10; alasan.push('sisa negatif'); }
  const label = skor >= 80 ? 'Sehat' : skor >= 60 ? 'Cukup' : skor >= 40 ? 'Waspada' : 'Kritis';
  return { skor: Math.max(0, skor), label, alasan };
}

function kategoriOverAnggaran() {
  const aktual = aktualPerKategori();
  return BUDGET_CATEGORIES.filter(k => (aktual[k.id] || 0) > k.nominal * 1.2).map(k => k.kategori);
}

const PETA_KATEGORI = {
  'Gaji suami': 'pendapatan', 'Gaji istri': 'pendapatan',
  'Makan & minum': 'makan', 'Transportasi': 'transportasi', 'Cicilan KPR': 'kpr',
  'Listrik, air, internet': 'listrik', 'Pendidikan anak': 'pendidikan',
  'Belanja rumah tangga': 'belanja-rt', 'Kesehatan + BPJS': 'kesehatan',
  'Pulsa & kuota': 'pulsa', 'Hiburan / streaming': 'hiburan',
  'Zakat & sedekah': 'zakat', 'Dana darurat': 'dana-darurat',
  'Tabungan pendidikan anak': 'pendidikan-tab', 'Investasi (reksa dana)': 'investasi',
  'Belum teralokasi': 'fleksibel',
};

function aktualPerKategori() {
  const out = {};
  for (const t of appState.transactions) {
    if (t.jenis !== 'pengeluaran') continue;
    const id = PETA_KATEGORI[t.kategori];
    if (id) out[id] = (out[id] || 0) + t.nominal;
  }
  return out;
}

// ---------- Render: dashboard ----------
function renderDashboard() {
  const masuk = totalPemasukanTracker();
  const keluar = totalPengeluaranTracker();
  const sisa = masuk - keluar;
  const tabungan = jumlahKelompok('Tabungan');
  const pemasukan = totalPemasukan();
  $('kpi-pemasukan').textContent = fmtRp(masuk);
  $('kpi-pengeluaran').textContent = fmtRp(keluar);
  $('kpi-sisa').textContent = fmtRp(sisa);
  $('kpi-sisa').className = 'angka ' + (sisa < 0 ? 'buruk' : sisa === 0 ? '' : 'baik');
  $('kpi-tabungan').textContent = fmtRp(tabungan);
  $('kpi-tabungan-sub').textContent = pemasukan > 0 ? fmtPersen(tabungan / pemasukan * 100) + ' dari pemasukan' : '—';
  const { skor, label, alasan } = hitungSkor();
  $('skor-angka').textContent = String(skor);
  $('skor-label').textContent = label;
  $('skor-diagnosis').textContent = alasan.length > 0
    ? 'Skor ' + skor + ' (' + label + '): ' + alasan.join('; ') + '.'
    : 'Skor ' + skor + ' (' + label + '): anggaran sehat — kebutuhan, tabungan, dan sisa semuanya dalam batas.';
  const kebutuhan = jumlahKelompok('Kebutuhan');
  $('peringatan-overbudget').hidden = !(pemasukan > 0 && kebutuhan / pemasukan > 0.6);
  $('peringatan-teks').textContent = 'Kebutuhan mencapai ' + fmtPersen(kebutuhan / pemasukan * 100) +
    ' dari pemasukan — jauh di atas batas sehat 50%. Pendorong utamanya cicilan KPR Rp3.200.000/bulan.';
  $('peringatan-sisa').hidden = sisa >= 0;
  $('peringatan-ok').hidden = (pemasukan > 0 && kebutuhan / pemasukan > 0.6) || sisa < 0;
  $('lap-skor').textContent = skor + ' (' + label + ')';
  $('lap-sisa').textContent = fmtRp(sisa);
}

// ---------- Render: setup ----------
function isiFormSetup() {
  $('setup-gaji-suami').value = appState.setup.gajiSuami;
  $('setup-gaji-istri').value = appState.setup.gajiIstri;
  $('setup-lain').value = appState.setup.pemasukanLain;
  $('setup-bulan-darurat').value = String(appState.setup.bulanDarurat);
  $('setup-target-tabungan').value = appState.setup.targetTabungan;
  $('setup-tahun-pendidikan').value = appState.setup.tahunPendidikan;
}

function bacaAngka(input, nama) {
  const v = Number(input.value);
  if (input.value === '' || Number.isNaN(v) || v < 0) throw new Error(nama + ' harus angka 0 atau lebih.');
  return v;
}

// ---------- Render: 50/30/20 + tabel anggaran ----------
function renderAnggaran() {
  const pemasukan = totalPemasukan();
  const kebutuhan = jumlahKelompok('Kebutuhan');
  const keinginan = jumlahKelompok('Keinginan');
  const tabungan = jumlahKelompok('Tabungan');
  const pilar = [
    { nama: 'Kebutuhan', target: pemasukan * 0.5, aktual: kebutuhan, kunci: 'kebutuhan' },
    { nama: 'Keinginan', target: pemasukan * 0.3, aktual: keinginan, kunci: 'keinginan' },
    { nama: 'Tabungan', target: pemasukan * 0.2, aktual: tabungan, kunci: 'tabungan' },
  ];
  for (const p of pilar) {
    $('pilar-' + p.kunci + '-target').textContent = fmtRp(p.target);
    $('pilar-' + p.kunci + '-aktual').textContent = fmtRp(p.aktual) + ' (' + fmtPersen(pemasukan > 0 ? p.aktual / pemasukan * 100 : 0) + ')';
    const bar = $('bar-' + p.kunci);
    bar.style.width = Math.min(100, pemasukan > 0 ? (p.aktual / pemasukan) * 100 : 0) + '%';
    bar.classList.toggle('over', p.aktual > p.target);
    bar.classList.toggle('waspada', p.aktual <= p.target && p.aktual < p.target * 0.95 && p.kunci === 'tabungan');
    const selisih = p.aktual - p.target;
    const st = $('pilar-' + p.kunci + '-status');
    if (selisih > 0) { st.textContent = 'Over ' + fmtRp(selisih) + ' dari target'; st.className = 'buruk'; }
    else if (selisih < 0) { st.textContent = (p.kunci === 'keinginan' ? 'Di bawah target ' : 'Kurang ') + fmtRp(-selisih) + ' dari target' + (p.kunci === 'keinginan' ? ' — hemat di sini' : ''); st.className = p.kunci === 'keinginan' ? 'baik' : ''; }
    else { st.textContent = 'Pas dengan target'; st.className = 'baik'; }
  }
  $('saran-503020').textContent = kebutuhan / pemasukan > 0.6
    ? 'Kebutuhan ' + fmtPersen(kebutuhan / pemasukan * 100) + ' terlalu besar — didorong cicilan KPR. Pertahankan keinginan tetap rendah dan naikkan tabungan bertahap Rp100.000/bulan sampai mencapai 20%.'
    : 'Anggaran sudah mengikuti 50/30/20 dengan baik. Pertahankan dan tinjau tiap bulan.';
  const tbody = $('anggaran-tbody');
  tbody.textContent = '';
  let terakhir = '';
  for (const k of BUDGET_CATEGORIES) {
    const tr = document.createElement('tr');
    if (k.kelompok !== terakhir) { terakhir = k.kelompok; }
    tr.append(el('td', k.kelompok), el('td', k.kategori), el('td', fmtRp(k.nominal), 'angka'), el('td', fmtPersen(pemasukan > 0 ? k.nominal / pemasukan * 100 : 0), 'angka'));
    tbody.append(tr);
  }
  $('anggaran-total').textContent = fmtRp(BUDGET_CATEGORIES.reduce((a, k) => a + k.nominal, 0));
}

// ---------- Render: tracker ----------
function transaksiTerfilter() {
  const kel = $('filter-kelompok').value;
  const bln = $('filter-bulan').value;
  return appState.transactions.filter(t =>
    (!kel || t.kelompok === kel) && (!bln || t.tanggal.startsWith(bln)));
}

function renderTracker() {
  const daftar = transaksiTerfilter();
  const tbody = $('tracker-tbody');
  tbody.textContent = '';
  let masuk = 0, keluar = 0;
  const terurut = [...daftar].sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id.localeCompare(b.id));
  for (const t of terurut) {
    if (t.jenis === 'pemasukan') masuk += t.nominal; else keluar += t.nominal;
    const tr = document.createElement('tr');
    const tdTanggal = el('td', t.tanggal.split('-').reverse().join('/'));
    const tdKet = el('td', t.keterangan + ' — ' + t.kategori);
    const tdKel = el('td', t.kelompok);
    const tdNom = el('td', (t.jenis === 'pemasukan' ? '+' : '−') + fmtRp(t.nominal), 'angka');
    tdNom.style.color = t.jenis === 'pemasukan' ? '#15803d' : '#1e293b';
    const tdAksi = document.createElement('td');
    const bEdit = el('button', 'Edit', 'tombol-kecil');
    bEdit.type = 'button';
    bEdit.addEventListener('click', () => mulaiEdit(t.id));
    const bHapus = el('button', 'Hapus', 'tombol-kecil');
    bHapus.type = 'button';
    bHapus.addEventListener('click', () => hapusTransaksi(t.id));
    tdAksi.append(bEdit, bHapus);
    tr.append(tdTanggal, tdKet, tdKel, tdNom, tdAksi);
    tbody.append(tr);
  }
  $('tracker-total-masuk').textContent = fmtRp(masuk);
  $('tracker-total-keluar').textContent = fmtRp(keluar);
  $('tracker-sisa').textContent = fmtRp(masuk - keluar);
  $('tracker-jumlah').textContent = daftar.length + ' transaksi';
}

function mulaiEdit(id) {
  const t = appState.transactions.find(x => x.id === id);
  if (!t) return;
  editingId = id;
  $('tr-tanggal').value = t.tanggal;
  $('tr-jenis').value = t.jenis;
  $('tr-kelompok').value = t.kelompok;
  $('tr-kategori').value = t.kategori;
  $('tr-keterangan').value = t.keterangan;
  $('tr-nominal').value = t.nominal;
  $('btn-tambah').textContent = 'Simpan Perubahan';
  $('btn-batal-edit').hidden = false;
  $('form-transaksi').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hapusTransaksi(id) {
  const t = appState.transactions.find(x => x.id === id);
  if (!t) return;
  if (!window.confirm('Hapus transaksi "' + t.keterangan + '" (' + fmtRp(t.nominal) + ')?')) return;
  appState.transactions = appState.transactions.filter(x => x.id !== id);
  simpanLocal();
  renderSemua();
}

// ---------- Render: grafik ----------
// Catatan: fungsi ini sengaja tidak mendeklarasikan variabel lokal bernama `state`.
function renderCharts() {
  const pemasukan = totalPemasukan();
  const donutOk = drawDonut($('chart-donut'), GROUP_TOTALS);
  const pilar = [
    { nama: 'Kebutuhan', target: pemasukan * 0.5, aktual: jumlahKelompok('Kebutuhan') },
    { nama: 'Keinginan', target: pemasukan * 0.3, aktual: jumlahKelompok('Keinginan') },
    { nama: 'Tabungan', target: pemasukan * 0.2, aktual: jumlahKelompok('Tabungan') },
  ];
  const barOk = drawBar503020($('chart-503020'), pilar);
  const lineOk = drawLine($('chart-line'), SAVINGS_PROJECTION, SAVINGS_MONTHS, 120000000);
  const kebutuhanItem = BUDGET_CATEGORIES.filter(k => k.kelompok === 'Kebutuhan')
    .map(k => ({ nama: k.kategori.replace(' (belanja dapur)', '').replace(' (bensin + KRL)', '').replace(' (SPP 2 anak)', '').replace(', air, internet', ''), nominal: k.nominal }));
  const needsOk = drawNeedsBar($('chart-kebutuhan'), kebutuhanItem);
  window.__chartsOk = { donut: donutOk, bar503020: barOk, line: lineOk, needs: needsOk };
}

// ---------- Render: laporan ----------
function renderLaporan() {
  const aktual = aktualPerKategori();
  const tbody = $('laporan-tbody');
  tbody.textContent = '';
  let totAnggaran = 0, totAktual = 0;
  for (const k of BUDGET_CATEGORIES) {
    const a = aktual[k.id] || 0;
    totAnggaran += k.nominal;
    totAktual += a;
    const tr = document.createElement('tr');
    tr.append(el('td', k.kategori), el('td', fmtRp(k.nominal), 'angka'), el('td', fmtRp(a), 'angka'), el('td', fmtRp(k.nominal - a), 'angka'));
    tbody.append(tr);
  }
  const masuk = totalPemasukanTracker();
  $('lap-masuk-aktual').textContent = fmtRp(masuk);
  $('lap-masuk-selisih').textContent = fmtRp(totalPemasukan() - masuk);
  $('lap-keluar-anggaran').textContent = fmtRp(totAnggaran);
  $('lap-keluar-aktual').textContent = fmtRp(totAktual);
  $('lap-keluar-selisih').textContent = fmtRp(totAnggaran - totAktual);
  $('lap-sisa-selisih').textContent = fmtRp((totalPemasukan() - totAnggaran) - (masuk - totAktual));
}

// ---------- Render: tips + checklist ----------
function renderTips() {
  const grid = $('tips-grid');
  grid.textContent = '';
  for (const tip of TIPS) {
    const card = el('article', undefined, 'kartu');
    card.append(el('h3', tip.judul), el('p', tip.isi));
    grid.append(card);
  }
  const ul = $('checklist');
  ul.textContent = '';
  let selesai = 0;
  for (const item of CHECKLIST_ITEMS) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = Boolean(appState.checklist[item.id]);
    if (cb.checked) selesai++;
    cb.addEventListener('change', () => {
      appState.checklist[item.id] = cb.checked;
      simpanLocal();
      renderTips();
    });
    label.append(cb, el('span', item.teks));
    li.append(label);
    ul.append(li);
  }
  $('checklist-progress').textContent = selesai + ' dari ' + CHECKLIST_ITEMS.length + ' selesai';
}

function renderSemua() {
  renderDashboard();
  renderAnggaran();
  renderTracker();
  renderCharts();
  renderLaporan();
  renderTips();
}

// ---------- Kalkulator 1: dana darurat ----------
function hitungDanaDarurat() {
  const err = $('dd-error');
  err.textContent = '';
  try {
    const esensial = bacaAngka($('dd-esensial'), 'Pengeluaran esensial');
    const saldo = bacaAngka($('dd-saldo'), 'Saldo dana darurat');
    const setoran = bacaAngka($('dd-setoran'), 'Setoran');
    if (setoran <= 0) throw new Error('Setoran harus lebih dari Rp0.');
    const bulan = Number($('dd-bulan').value);
    const target = esensial * bulan;
    const kekurangan = Math.max(0, target - saldo);
    const bulanTercapai = kekurangan === 0 ? 0 : Math.ceil(kekurangan / setoran);
    const persen = target > 0 ? (saldo / target) * 100 : 100;
    const altBulan = kekurangan === 0 ? 0 : Math.ceil(kekurangan / 3350000);
    const tanggal = new Date();
    tanggal.setMonth(tanggal.getMonth() + bulanTercapai);
    const hasil = $('dd-hasil');
    hasil.hidden = false;
    $('dd-output').textContent = bulanTercapai === 0
      ? 'Dana darurat sudah tercapai: ' + fmtRp(target) + ' (' + fmtPersen(persen) + ').'
      : 'Tercapai dalam ' + bulanTercapai + ' bulan — ' + fmtRp(target) + ' (' + fmtPersen(persen) + ' tercapai).';
    $('dd-bar').style.width = Math.min(100, persen) + '%';
    $('dd-bar').className = 'bar-dalam' + (persen >= 100 ? '' : persen >= 50 ? ' waspada' : ' over');
    const dl = $('dd-dl');
    dl.textContent = '';
    const baris = [
      ['Target (' + bulan + ' bulan esensial)', fmtRp(target)],
      ['Saldo saat ini', fmtRp(saldo)],
      ['Kekurangan', fmtRp(kekurangan)],
      ['Bulan sampai tercapai', bulanTercapai + ' bulan'],
      ['Perkiraan tercapai', tanggal.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })],
      ['Bila seluruh tabungan dipakai (Rp3.350.000/bln)', altBulan + ' bulan'],
    ];
    for (const [k, v] of baris) { dl.append(el('dt', k), el('dd', v)); }
    $('dd-kalimat').textContent = kekurangan === 0
      ? 'Selamat, dana daruratmu sudah cukup untuk ' + bulan + ' bulan. Pertahankan dan tinjau tiap tahun.'
      : 'Dengan setoran ' + fmtRp(setoran) + '/bulan, kekurangan ' + fmtRp(kekurangan) + ' tertutup dalam ' + bulanTercapai + ' bulan. Bila seluruh sisa tabungan Rp3.350.000/bulan dipakai, cukup ' + altBulan + ' bulan.';
    return { target, kekurangan, bulanTercapai, persen, altBulan };
  } catch (e) { err.textContent = e.message; return null; }
}

// ---------- Kalkulator 2: target tabungan ----------
function hitungTargetTabungan() {
  const err = $('tt-error');
  err.textContent = '';
  try {
    const target = bacaAngka($('tt-target'), 'Target tabungan');
    const setoran = bacaAngka($('tt-setoran'), 'Setoran');
    if (setoran <= 0) throw new Error('Setoran harus lebih dari Rp0.');
    const bunga = Number($('tt-bunga').value);
    if (Number.isNaN(bunga) || bunga < 0) throw new Error('Bunga harus angka 0 atau lebih.');
    const awal = bacaAngka($('tt-saldo'), 'Saldo awal');
    const r = bunga / 100 / 12;
    let bulan = 0;
    if (target > awal) {
      bulan = r === 0
        ? Math.ceil((target - awal) / setoran)
        : Math.ceil(Math.log(1 + (target - awal) * r / setoran) / Math.log(1 + r));
    }
    let saldo = awal;
    const tahunan = [];
    for (let b = 1; b <= bulan; b++) {
      saldo = saldo * (1 + r) + setoran;
      if (b % 12 === 0 || b === bulan) tahunan.push({ tahun: Math.ceil(b / 12), saldo: Math.round(saldo), bulan: b });
    }
    const totalSetoran = setoran * bulan;
    const totalBunga = Math.round(saldo - awal - totalSetoran);
    const tanggal = new Date();
    tanggal.setMonth(tanggal.getMonth() + bulan);
    const hasil = $('tt-hasil');
    hasil.hidden = false;
    $('tt-output').textContent = bulan === 0
      ? 'Target sudah tercapai.'
      : 'Tercapai dalam ' + bulan + ' bulan (' + (bulan / 12).toFixed(1).replace('.', ',') + ' tahun) — saldo akhir ' + fmtRp(saldo) + '.';
    const dl = $('tt-dl');
    dl.textContent = '';
    const baris = [
      ['Bulan sampai target', bulan + ' bulan'],
      ['Perkiraan tercapai', tanggal.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })],
      ['Saldo akhir', fmtRp(saldo)],
      ['Total setoran', fmtRp(totalSetoran)],
      ['Total bunga', fmtRp(totalBunga)],
    ];
    for (const [k, v] of baris) { dl.append(el('dt', k), el('dd', v)); }
    const tb = $('tt-tabel');
    tb.textContent = '';
    const perTahun = {};
    for (const t of tahunan) perTahun[t.tahun] = t.saldo;
    for (const th of Object.keys(perTahun).map(Number).sort((a, b) => a - b)) {
      const tr = document.createElement('tr');
      tr.append(el('td', 'Tahun ' + th), el('td', fmtRp(perTahun[th]), 'angka'));
      tb.append(tr);
    }
    return { bulan, saldoAkhir: Math.round(saldo), totalSetoran, totalBunga };
  } catch (e) { err.textContent = e.message; return null; }
}

// ---------- Kalkulator 3: KPR ----------
function hitungKPR() {
  const err = $('kpr-error');
  err.textContent = '';
  try {
    const pokok = bacaAngka($('kpr-pokok'), 'Pokok pinjaman');
    const bunga = Number($('kpr-bunga').value);
    if (Number.isNaN(bunga) || bunga < 0) throw new Error('Bunga harus angka 0 atau lebih.');
    const tenor = Number($('kpr-tenor').value);
    if (!Number.isInteger(tenor) || tenor < 1) throw new Error('Tenor harus bilangan bulan 1 atau lebih.');
    const biaya = bacaAngka($('kpr-biaya'), 'Biaya tambahan');
    const r = bunga / 100 / 12;
    const angsuran = r === 0 ? pokok / tenor : pokok * r * Math.pow(1 + r, tenor) / (Math.pow(1 + r, tenor) - 1);
    const totalBayar = angsuran * tenor;
    const totalBunga = totalBayar - pokok;
    const cicilanTotal = angsuran + biaya;
    const hasil = $('kpr-hasil');
    hasil.hidden = false;
    $('kpr-output').textContent = 'Angsuran ' + fmtRp(angsuran) + '/bulan — cicilan total ' + fmtRp(cicilanTotal) + '/bulan.';
    const dl = $('kpr-dl');
    dl.textContent = '';
    const baris = [
      ['Angsuran pokok + bunga', fmtRp(angsuran) + '/bulan'],
      ['Biaya tambahan (asuransi + admin)', fmtRp(biaya) + '/bulan'],
      ['Cicilan total', fmtRp(cicilanTotal) + '/bulan'],
      ['Total bayar (' + tenor + ' bulan)', fmtRp(totalBayar)],
      ['Total bunga', fmtRp(totalBunga)],
    ];
    for (const [k, v] of baris) { dl.append(el('dt', k), el('dd', v)); }
    // Tabel amortisasi: bulan 1, 12, 60, 120, 180 (yang masih dalam tenor).
    const tb = $('kpr-tabel');
    tb.textContent = '';
    let sisaPokok = pokok;
    const titik = [1, 12, 60, 120, 180].filter(b => b <= tenor);
    for (let b = 1; b <= tenor; b++) {
      const bungaBulan = sisaPokok * r;
      const pokokBulan = angsuran - bungaBulan;
      sisaPokok = Math.max(0, sisaPokok - pokokBulan);
      if (titik.includes(b)) {
        const tr = document.createElement('tr');
        tr.append(el('td', 'Bulan ' + b), el('td', fmtRp(bungaBulan), 'angka'), el('td', fmtRp(pokokBulan), 'angka'), el('td', fmtRp(sisaPokok), 'angka'));
        tb.append(tr);
      }
    }
    const rasio = totalPemasukan() > 0 ? cicilanTotal / totalPemasukan() : 0;
    $('kpr-peringatan').textContent = rasio > 0.3
      ? 'Peringatan: cicilan ' + fmtPersen(rasio * 100) + ' dari pemasukan — di atas batas aman 30%. Pertimbangkan tenor lebih panjang atau uang muka lebih besar.'
      : 'Cicilan ' + fmtPersen(rasio * 100) + ' dari pemasukan — masih dalam batas aman 30%.';
    $('kpr-peringatan').className = rasio > 0.3 ? 'buruk' : 'baik';
    return { angsuran, totalBayar, totalBunga, cicilanTotal };
  } catch (e) { err.textContent = e.message; return null; }
}

// ---------- Kalkulator 4: zakat ----------
function hitungZakat() {
  const err = $('zakat-error');
  err.textContent = '';
  try {
    const gaji = bacaAngka($('zakat-gaji'), 'Penghasilan');
    const emas = bacaAngka($('zakat-emas'), 'Harga emas');
    if (emas <= 0) throw new Error('Harga emas harus lebih dari Rp0.');
    const utang = bacaAngka($('zakat-utang'), 'Utang jatuh tempo');
    const nisabTahunan = 85 * emas;
    const nisabBulanan = nisabTahunan / 12;
    const basis = Math.max(0, gaji - utang);
    const wajib = basis >= nisabBulanan;
    const zakat = wajib ? basis * 0.025 : 0;
    const hasil = $('zakat-hasil');
    hasil.hidden = false;
    $('zakat-output').textContent = wajib
      ? 'Zakat penghasilan: ' + fmtRp(zakat) + '/bulan.'
      : 'Belum wajib zakat — penghasilan di bawah nisab.';
    const dl = $('zakat-dl');
    dl.textContent = '';
    const baris = [
      ['Nisab tahunan (85 gram emas)', fmtRp(nisabTahunan)],
      ['Nisab bulanan', fmtRp(nisabBulanan)],
      ['Penghasilan setelah utang', fmtRp(basis)],
      ['Zakat / bulan (2,5%)', fmtRp(zakat)],
      ['Zakat / tahun', fmtRp(zakat * 12)],
    ];
    for (const [k, v] of baris) { dl.append(el('dt', k), el('dd', v)); }
    $('zakat-kalimat').textContent = wajib
      ? 'Penghasilan ' + fmtRp(gaji) + ' di atas nisab bulanan ' + fmtRp(nisabBulanan) + ', jadi zakat 2,5% wajib dibayar: ' + fmtRp(zakat) + ' per bulan atau ' + fmtRp(zakat * 12) + ' per tahun.'
      : 'Penghasilan setelah utang (' + fmtRp(basis) + ') masih di bawah nisab bulanan ' + fmtRp(nisabBulanan) + ', jadi belum wajib zakat. Sedekah tetap dianjurkan.';
    return { nisabTahunan, nisabBulanan, zakat, wajib };
  } catch (e) { err.textContent = e.message; return null; }
}

// ---------- Kalkulator 5: inflasi ----------
function hitungInflasi() {
  const err = $('inf-error');
  err.textContent = '';
  try {
    const pv = bacaAngka($('inf-nominal'), 'Nominal sekarang');
    const inflasi = Number($('inf-inflasi').value);
    if (Number.isNaN(inflasi)) throw new Error('Inflasi harus angka.');
    const tahun = Number($('inf-tahun').value);
    $('inf-tahun-nilai').textContent = String(tahun);
    const i = inflasi / 100;
    const masaDepan = pv * Math.pow(1 + i, tahun);
    const nilaiRiil = pv / Math.pow(1 + i, tahun);
    const hasil = $('inf-hasil');
    hasil.hidden = false;
    $('inf-output').textContent = 'Dalam ' + tahun + ' tahun: biaya ' + fmtRp(masaDepan) + ' · nilai uangmu ' + fmtRp(nilaiRiil) + '.';
    const dl = $('inf-dl');
    dl.textContent = '';
    const baris = [
      ['Biaya masa depan', fmtRp(masaDepan)],
      ['Kenaikan harga', fmtRp(masaDepan - pv)],
      ['Nilai riil uang sekarang', fmtRp(nilaiRiil)],
      ['Penurunan daya beli', fmtRp(pv - nilaiRiil)],
    ];
    for (const [k, v] of baris) { dl.append(el('dt', k), el('dd', v)); }
    const tb = $('inf-tabel');
    tb.textContent = '';
    for (let t = 1; t <= tahun; t++) {
      const tr = document.createElement('tr');
      tr.append(el('td', 'Tahun ' + t), el('td', fmtRp(pv * Math.pow(1 + i, t)), 'angka'));
      tb.append(tr);
    }
    return { masaDepan, nilaiRiil };
  } catch (e) { err.textContent = e.message; return null; }
}

// ---------- Kalkulator 6: pelunasan utang ----------
function hitungUtang() {
  const err = $('utang-error');
  err.textContent = '';
  try {
    const saldoAwal = bacaAngka($('utang-saldo'), 'Saldo utang');
    const bunga = Number($('utang-bunga').value);
    if (Number.isNaN(bunga) || bunga < 0) throw new Error('Bunga harus angka 0 atau lebih.');
    const cicilan = bacaAngka($('utang-cicilan'), 'Cicilan');
    if (cicilan <= 0) throw new Error('Cicilan harus lebih dari Rp0.');
    const r = bunga / 100 / 12;
    const hasil = $('utang-hasil');
    hasil.hidden = false;
    if (r > 0 && cicilan <= saldoAwal * r) {
      const minimum = saldoAwal * r + 1;
      $('utang-output').textContent = 'Tidak pernah lunas dengan cicilan ini.';
      const dl = $('utang-dl');
      dl.textContent = '';
      dl.append(el('dt', 'Bunga bulanan'), el('dd', fmtRp(saldoAwal * r)));
      dl.append(el('dt', 'Cicilan minimum'), el('dd', fmtRp(minimum) + '/bulan'));
      $('utang-kalimat').textContent = 'Cicilan ' + fmtRp(cicilan) + ' hanya menutup bunga ' + fmtRp(saldoAwal * r) + ' per bulan — pokok tidak berkurang. Naikkan cicilan minimal menjadi ' + fmtRp(minimum) + ' per bulan.';
      $('utang-kalimat').className = 'buruk';
      return { bulan: Infinity, totalBunga: Infinity };
    }
    const bulan = r === 0
      ? Math.ceil(saldoAwal / cicilan)
      : Math.ceil(-Math.log(1 - saldoAwal * r / cicilan) / Math.log(1 + r));
    let sisa = saldoAwal;
    let totalBayar = 0;
    let bayarAkhir = 0;
    for (let b = 1; b <= bulan && b <= 600; b++) {
      const bungaBulan = sisa * r;
      const bayar = Math.min(cicilan, sisa + bungaBulan);
      totalBayar += bayar;
      sisa = sisa + bungaBulan - bayar;
      if (b === bulan) bayarAkhir = bayar;
    }
    const totalBunga = totalBayar - saldoAwal;
    const tanggal = new Date();
    tanggal.setMonth(tanggal.getMonth() + bulan);
    $('utang-output').textContent = 'Lunas dalam ' + bulan + ' bulan — total bunga ' + fmtRp(totalBunga) + '.';
    const dl = $('utang-dl');
    dl.textContent = '';
    const baris = [
      ['Bulan sampai lunas', bulan + ' bulan'],
      ['Tanggal lunas', tanggal.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })],
      ['Pembayaran terakhir', fmtRp(bayarAkhir)],
      ['Total bayar', fmtRp(totalBayar)],
      ['Total bunga', fmtRp(totalBunga)],
    ];
    for (const [k, v] of baris) { dl.append(el('dt', k), el('dd', v)); }
    $('utang-kalimat').textContent = 'Dengan cicilan ' + fmtRp(cicilan) + '/bulan, utang ' + fmtRp(saldoAwal) + ' lunas dalam ' + bulan + ' bulan. Pembayaran terakhir hanya ' + fmtRp(bayarAkhir) + ' karena sisa pokok sudah kecil.';
    $('utang-kalimat').className = '';
    return { bulan, totalBayar, totalBunga, bayarAkhir };
  } catch (e) { err.textContent = e.message; return null; }
}

// ---------- Export CSV + cetak ----------
function exportCSV() {
  const baris = [];
  baris.push(['Laporan Bulanan - November 2026']);
  baris.push(['Tanggal', 'Keterangan', 'Kelompok', 'Kategori', 'Jenis', 'Nominal (Rp)']);
  const terurut = [...appState.transactions].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  for (const t of terurut) {
    baris.push([t.tanggal, '"' + t.keterangan.replace(/"/g, '""') + '"', t.kelompok, '"' + t.kategori.replace(/"/g, '""') + '"', t.jenis, String(t.nominal)]);
  }
  const masuk = totalPemasukanTracker();
  const keluar = totalPengeluaranTracker();
  baris.push(['', 'TOTAL PEMASUKAN', '', '', '', String(masuk)]);
  baris.push(['', 'TOTAL PENGELUARAN', '', '', '', String(keluar)]);
  baris.push(['', 'SISA', '', '', '', String(masuk - keluar)]);
  const isi = baris.map(r => r.join(',')).join('\n');
  const blob = new Blob([isi], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'laporan-november-2026.csv';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('csv-status').textContent = 'CSV diunduh: ' + baris.length + ' baris (' + appState.transactions.length + ' transaksi + total pemasukan, total pengeluaran, dan sisa).';
  return { baris: baris.length, masuk, keluar, sisa: masuk - keluar };
}

// ---------- Event ----------
function pasangEvent() {
  $('form-setup').addEventListener('submit', ev => {
    ev.preventDefault();
    const err = $('setup-error');
    err.textContent = '';
    try {
      appState.setup.gajiSuami = bacaAngka($('setup-gaji-suami'), 'Gaji suami');
      appState.setup.gajiIstri = bacaAngka($('setup-gaji-istri'), 'Gaji istri');
      appState.setup.pemasukanLain = bacaAngka($('setup-lain'), 'Pemasukan lain');
      appState.setup.bulanDanaDarurat = Number($('setup-bulan-darurat').value);
      appState.setup.targetTabungan = bacaAngka($('setup-target-tabungan'), 'Target tabungan');
      appState.setup.tahunPendidikan = Number($('setup-tahun-pendidikan').value);
      if (!Number.isInteger(appState.setup.tahunPendidikan) || appState.setup.tahunPendidikan < 1) throw new Error('Jangka waktu pendidikan harus 1 tahun atau lebih.');
      simpanLocal();
      renderSemua();
      $('setup-status').textContent = 'Tersimpan. Semua kalkulator memakai angka baru ini.';
    } catch (e) { err.textContent = e.message; }
  });
  $('btn-contoh').addEventListener('click', muatDataContoh);
  $('btn-contoh-atas').addEventListener('click', muatDataContoh);
  $('btn-reset').addEventListener('click', () => { muatDataContoh(); $('setup-status').textContent = 'Data dikembalikan ke contoh.'; });
  $('btn-reset-atas').addEventListener('click', () => { muatDataContoh(); });
  $('form-transaksi').addEventListener('submit', ev => {
    ev.preventDefault();
    const err = $('tr-error');
    err.textContent = '';
    try {
      const tanggal = $('tr-tanggal').value;
      if (!tanggal || Number.isNaN(Date.parse(tanggal))) throw new Error('Tanggal tidak valid.');
      const nominal = Number($('tr-nominal').value);
      if ($('tr-nominal').value === '' || Number.isNaN(nominal) || nominal <= 0) throw new Error('Nominal harus angka lebih dari Rp0.');
      const kategori = $('tr-kategori').value.trim();
      if (!kategori) throw new Error('Kategori wajib diisi.');
      const data = {
        tanggal,
        jenis: $('tr-jenis').value,
        kelompok: $('tr-kelompok').value,
        kategori,
        keterangan: $('tr-keterangan').value.trim() || kategori,
        nominal,
      };
      if (editingId) {
        const idx = appState.transactions.findIndex(x => x.id === editingId);
        if (idx >= 0) appState.transactions[idx] = { ...data, id: editingId };
        editingId = null;
        $('btn-tambah').textContent = 'Tambah Transaksi';
        $('btn-batal-edit').hidden = true;
      } else {
        appState.transactions.push({ ...data, id: 't' + Date.now().toString(36) });
      }
      simpanLocal();
      renderSemua();
      $('form-transaksi').reset();
      $('tr-tanggal').value = '2026-11-26';
      $('tr-jenis').value = 'pengeluaran';
    } catch (e) { err.textContent = e.message; }
  });
  $('btn-batal-edit').addEventListener('click', () => {
    editingId = null;
    $('btn-tambah').textContent = 'Tambah Transaksi';
    $('btn-batal-edit').hidden = true;
    $('form-transaksi').reset();
  });
  $('filter-kelompok').addEventListener('change', renderTracker);
  $('filter-bulan').addEventListener('change', renderTracker);
  $('btn-dd').addEventListener('click', hitungDanaDarurat);
  $('btn-tt').addEventListener('click', hitungTargetTabungan);
  $('btn-kpr').addEventListener('click', hitungKPR);
  $('btn-zakat').addEventListener('click', hitungZakat);
  $('btn-inf').addEventListener('click', hitungInflasi);
  $('btn-utang').addEventListener('click', hitungUtang);
  $('inf-tahun').addEventListener('input', () => { $('inf-tahun-nilai').textContent = $('inf-tahun').value; });
  $('btn-csv').addEventListener('click', exportCSV);
  $('btn-cetak').addEventListener('click', () => window.print());
  window.addEventListener('resize', () => { renderCharts(); });
}

// ---------- Init ----------
const adaDataTersimpan = muatLocal();
if (!adaDataTersimpan) { $('banner-contoh').hidden = false; } else { $('banner-contoh').hidden = true; }
isiFormSetup();
pasangEvent();
renderSemua();
hitungDanaDarurat();
hitungTargetTabungan();
hitungKPR();
hitungZakat();
hitungInflasi();
hitungUtang();
window.__shotReady = true;
window.__ahrt = {
  hitungDanaDarurat, hitungTargetTabungan, hitungKPR, hitungZakat, hitungInflasi, hitungUtang,
  hitungSkor, exportCSV, muatDataContoh,
  get transactions() { return appState.transactions; },
  get setup() { return appState.setup; },
};
