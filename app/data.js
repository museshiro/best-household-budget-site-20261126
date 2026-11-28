/* Anggaran Rumah Tangga Kita — data contoh kanonis, November 2026.
   Keluarga 2 anak di Jakarta. Semua angka terverifikasi dan dipakai
   persis oleh dashboard, kalkulator, grafik, dan laporan. Situs ini
   tidak pernah mengambil data dari jaringan. */
'use strict';

const AHRT = {
  monthLabel: 'November 2026',
  monthKey: '2026-11',
  family: 'Keluarga 4 orang di Jakarta — suami, istri, dan dua anak.',

  profile: {
    income: 18500000,
    sources: [
      { label: 'Gaji suami', amount: 12000000 },
      { label: 'Gaji istri (guru + freelance)', amount: 6500000 },
    ],
  },

  /* Anggaran bulanan. Total outflow Rp18.500.000, PAS dengan pemasukan. */
  pillars: {
    kebutuhan: { label: 'Kebutuhan', amount: 13550000 },
    keinginan: { label: 'Keinginan', amount: 900000 },
    zakat: { label: 'Zakat & sedekah', amount: 500000 },
    tabungan: { label: 'Tabungan & investasi', amount: 3350000 },
    fleksibel: { label: 'Belum teralokasi', amount: 200000 },
  },

  /* 7 pos kebutuhan (urut menurun) + rincian pilar lain. */
  categories: [
    { key: 'makan', label: 'Makan & minum (belanja dapur)', pillar: 'kebutuhan', budget: 4500000 },
    { key: 'kpr', label: 'Cicilan KPR', pillar: 'kebutuhan', budget: 3200000 },
    { key: 'transport', label: 'Transportasi (bensin + KRL)', pillar: 'kebutuhan', budget: 1800000 },
    { key: 'pendidikan', label: 'Pendidikan anak (SPP 2 anak)', pillar: 'kebutuhan', budget: 1500000 },
    { key: 'rumah', label: 'Belanja rumah tangga', pillar: 'kebutuhan', budget: 1200000 },
    { key: 'listrik', label: 'Listrik, air, internet', pillar: 'kebutuhan', budget: 850000 },
    { key: 'kesehatan', label: 'Kesehatan + BPJS', pillar: 'kebutuhan', budget: 500000 },
    { key: 'pulsa', label: 'Pulsa & kuota', pillar: 'keinginan', budget: 300000 },
    { key: 'hiburan', label: 'Hiburan/streaming', pillar: 'keinginan', budget: 600000 },
    { key: 'zakat', label: 'Zakat & sedekah', pillar: 'zakat', budget: 500000, note: 'zakat 462.500 + sedekah 37.500' },
    { key: 'darurat', label: 'Dana darurat', pillar: 'tabungan', budget: 1000000 },
    { key: 'pendidikan-tab', label: 'Tabungan pendidikan anak', pillar: 'tabungan', budget: 2000000 },
    { key: 'investasi', label: 'Investasi (reksa dana)', pillar: 'tabungan', budget: 350000 },
    { key: 'fleksibel', label: 'Belum teralokasi', pillar: 'fleksibel', budget: 200000 },
  ],

  /* Target dana darurat: 6 x belanja esensial. Saldo awal Rp24.000.000. */
  emergency: { essentialMonthly: 13550000, balance: 24000000, deposit: 1000000, coverMonths: 6 },

  /* Target tabungan pendidikan: Rp120jt dalam 5 tahun, bunga 5%/tahun. */
  savingsGoal: { target: 120000000, deposit: 2000000, rateYear: 5, startBalance: 0 },

  /* KPR: pokok 300jt, bunga 8%/tahun, tenor 180 bulan, biaya 333.043/bln. */
  mortgage: { principal: 300000000, rateYear: 8, months: 180, extraMonthly: 333043 },

  /* Zakat: nisab 85 gram emas. Harga emas default Rp1.500.000/gram. */
  zakat: { goldPerGram: 1500000, debtMonthly: 0 },

  /* Inflasi: nominal Rp10jt, inflasi 4%/tahun, 5 tahun. */
  inflation: { present: 10000000, rateYear: 4, years: 5 },

  /* Pelunasan utang: saldo Rp10jt, bunga 12%/tahun, cicilan Rp1jt/bln. */
  debt: { balance: 10000000, rateYear: 12, payment: 1000000 },
};

/* 20 transaksi contoh — November 2026. Total pemasukan Rp18.500.000,
   total outflow Rp18.500.000 (PAS). Kelompok: Pendapatan, Kebutuhan,
   Keinginan, Kewajiban (zakat), Tabungan, Fleksibel. */
AHRT.transactions = [
  { id: 't01', date: '2026-11-01', desc: 'Gaji suami', group: 'Pendapatan', category: 'Gaji suami', kind: 'in', amount: 12000000 },
  { id: 't02', date: '2026-11-01', desc: 'Gaji istri (guru + freelance)', group: 'Pendapatan', category: 'Gaji istri', kind: 'in', amount: 6500000 },
  { id: 't03', date: '2026-11-02', desc: 'Cicilan KPR', group: 'Kebutuhan', category: 'Cicilan KPR', kind: 'out', amount: 3200000 },
  { id: 't04', date: '2026-11-02', desc: 'Zakat penghasilan 2,5%', group: 'Kewajiban', category: 'Zakat & sedekah', kind: 'out', amount: 462500 },
  { id: 't05', date: '2026-11-03', desc: 'Listrik, air, internet', group: 'Kebutuhan', category: 'Listrik, air, internet', kind: 'out', amount: 850000 },
  { id: 't06', date: '2026-11-03', desc: 'Transfer dana darurat', group: 'Tabungan', category: 'Dana darurat', kind: 'out', amount: 1000000 },
  { id: 't07', date: '2026-11-05', desc: 'Belanja dapur mingguan 1', group: 'Kebutuhan', category: 'Makan & minum (belanja dapur)', kind: 'out', amount: 1200000 },
  { id: 't08', date: '2026-11-06', desc: 'Belanja rumah tangga', group: 'Kebutuhan', category: 'Belanja rumah tangga', kind: 'out', amount: 1200000 },
  { id: 't09', date: '2026-11-07', desc: 'Transportasi (bensin + KRL)', group: 'Kebutuhan', category: 'Transportasi (bensin + KRL)', kind: 'out', amount: 1800000 },
  { id: 't10', date: '2026-11-08', desc: 'Pulsa & kuota', group: 'Keinginan', category: 'Pulsa & kuota', kind: 'out', amount: 300000 },
  { id: 't11', date: '2026-11-10', desc: 'SPP 2 anak', group: 'Kebutuhan', category: 'Pendidikan anak (SPP 2 anak)', kind: 'out', amount: 1500000 },
  { id: 't12', date: '2026-11-12', desc: 'Belanja dapur mingguan 2', group: 'Kebutuhan', category: 'Makan & minum (belanja dapur)', kind: 'out', amount: 1100000 },
  { id: 't13', date: '2026-11-15', desc: 'BPJS + obat', group: 'Kebutuhan', category: 'Kesehatan + BPJS', kind: 'out', amount: 500000 },
  { id: 't14', date: '2026-11-16', desc: 'Streaming & hiburan', group: 'Keinginan', category: 'Hiburan/streaming', kind: 'out', amount: 600000 },
  { id: 't15', date: '2026-11-19', desc: 'Belanja dapur mingguan 3', group: 'Kebutuhan', category: 'Makan & minum (belanja dapur)', kind: 'out', amount: 1100000 },
  { id: 't16', date: '2026-11-20', desc: 'Sedekah', group: 'Kewajiban', category: 'Zakat & sedekah', kind: 'out', amount: 37500 },
  { id: 't17', date: '2026-11-25', desc: 'Tabungan pendidikan anak', group: 'Tabungan', category: 'Tabungan pendidikan anak', kind: 'out', amount: 2000000 },
  { id: 't18', date: '2026-11-26', desc: 'Belanja dapur mingguan 4', group: 'Kebutuhan', category: 'Makan & minum (belanja dapur)', kind: 'out', amount: 1100000 },
  { id: 't19', date: '2026-11-28', desc: 'Reksa dana', group: 'Tabungan', category: 'Investasi (reksa dana)', kind: 'out', amount: 350000 },
  { id: 't20', date: '2026-11-30', desc: 'Dana fleksibel', group: 'Fleksibel', category: 'Belum teralokasi', kind: 'out', amount: 200000 },
];

AHRT.groups = ['Pendapatan', 'Kebutuhan', 'Keinginan', 'Kewajiban', 'Tabungan', 'Fleksibel'];

/* Rencana Aksi Bulan Ini — 4 aksi, semua angka dihitung dari data di atas
   lewat fungsi murni, supaya angka kartu selalu sama dengan kalkulator. */
AHRT.actions = [
  {
    id: 'a1', eyebrow: 'AKSI 1 · DANA DARURAT',
    text: 'Naikkan setoran dana darurat Rp1jt menjadi Rp1,5jt per bulan.',
    nowLabel: '58 bulan', targetLabel: '39 bulan', saveLabel: 'Hemat 19 bulan',
    apply: { calc: 'darurat', deposit: 1500000 },
  },
  {
    id: 'a2', eyebrow: 'AKSI 2 · TABUNGAN',
    text: 'Alihkan sisa fleksibel Rp200rb ke tabungan bulanan — tabungan naik dari Rp3,35jt (18,1%) menjadi Rp3,55jt (19,2%).',
    nowLabel: '90,5% dari target 20%', targetLabel: '96% dari target 20%', saveLabel: 'Capaian +5,4 poin',
    apply: { calc: 'tabungan', deposit: 2200000 },
  },
  {
    id: 'a3', eyebrow: 'AKSI 3 · KEINGINAN',
    text: 'Pangkas keinginan Rp100rb/bln (Rp900rb menjadi Rp800rb, turun 11,1%), alihkan ke dana darurat.',
    nowLabel: '39 bulan', targetLabel: '36 bulan', saveLabel: 'Hemat 3 bulan lagi',
    apply: { calc: 'darurat', deposit: 1600000 },
  },
  {
    id: 'a4', eyebrow: 'AKSI 4 · KEBUTUHAN',
    text: 'Pangkas kebutuhan 1% (Rp185rb/bln), alihkan ke dana darurat.',
    nowLabel: '39 bulan', targetLabel: '35 bulan', saveLabel: 'Hemat 4 bulan lagi',
    apply: { calc: 'darurat', deposit: 1685000 },
  },
];

/* Checklist tips hemat (seed untuk localStorage ahrt-checklist). */
AHRT.tips = [
  { id: 'tip1', text: 'Belanja dapur seminggu sekali dengan daftar — jangan tiap hari ke warung.' },
  { id: 'tip2', text: 'Masak bekal 4 hari seminggu; jajan makan siang maksimal Rp25rb.' },
  { id: 'tip3', text: 'Cek langganan streaming: yang tidak ditonton 2 minggu, berhenti dulu.' },
  { id: 'tip4', text: 'Naik KRL + jalan kaki untuk jarak di bawah 2 km, hemat bensin.' },
  { id: 'tip5', text: 'Pisahkan uang belanja harian ke amplop mingguan Rp1,1jt.' },
  { id: 'tip6', text: 'Bandingkan harga listrik: matikan AC 1 jam lebih awal tiap malam.' },
  { id: 'tip7', text: 'Beli kebutuhan rumah tangga saat promo bulanan, bukan saat habis.' },
  { id: 'tip8', text: 'Review anggaran tiap tanggal 1 — 15 menit saja, bareng pasangan.' },
];

/* ---- Format helpers (Intl id-ID, tanpa locale lain) ----
   Semua Rupiah dibulatkan ke rupiah terdekat saat ditampilkan. */
const _idr = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const _num = new Intl.NumberFormat('id-ID');
const _pct = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
AHRT.fmtIdr = (v) => 'Rp' + _idr.format(Math.round(v));
AHRT.fmtNum = (v) => _num.format(Math.round(v));
AHRT.fmtPct = (v) => _pct.format(v);
AHRT.fmtJt = (v) => {
  if (v >= 1000000) {
    const jt = v / 1000000;
    const s = _pct.format(jt).replace(/,0$/, '');
    return 'Rp' + s + ' jt';
  }
  if (v >= 1000) return 'Rp' + _num.format(Math.round(v / 1000)) + ' rb';
  return 'Rp' + _idr.format(Math.round(v));
};
AHRT.fmtDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
};

window.AHRT = AHRT;
