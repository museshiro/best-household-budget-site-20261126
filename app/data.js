// Data contoh kanonis "Anggaran Rumah Tangga Kita" — keluarga 2 anak di Jakarta.
// Semua angka sudah konsisten secara aritmetika: pemasukan = outflow = Rp18.500.000.
// File ini hanya konstanta; situs tidak pernah mengambil (fetch) data dari mana pun.

export const SAMPLE_SETUP = {
  gajiSuami: 12000000,
  gajiIstri: 6500000,
  pemasukanLain: 0,
  bulanDanaDarurat: 6,
  targetTabungan: 120000000,
  targetPendidikan: 120000000,
  tahunPendidikan: 5,
};

// Anggaran per kategori (Rp/bulan). Total outflow = Rp18.500.000, sisa Rp0.
export const BUDGET_CATEGORIES = [
  { id: 'makan',        kelompok: 'Kebutuhan', kategori: 'Makan & minum (belanja dapur)',      nominal: 4500000 },
  { id: 'transportasi', kelompok: 'Kebutuhan', kategori: 'Transportasi (bensin + KRL)',         nominal: 1800000 },
  { id: 'kpr',          kelompok: 'Kebutuhan', kategori: 'Cicilan KPR',                         nominal: 3200000 },
  { id: 'listrik',      kelompok: 'Kebutuhan', kategori: 'Listrik, air, internet',              nominal: 850000 },
  { id: 'pendidikan',   kelompok: 'Kebutuhan', kategori: 'Pendidikan anak (SPP 2 anak)',        nominal: 1500000 },
  { id: 'belanja-rt',   kelompok: 'Kebutuhan', kategori: 'Belanja rumah tangga',                 nominal: 1200000 },
  { id: 'kesehatan',    kelompok: 'Kebutuhan', kategori: 'Kesehatan + BPJS',                    nominal: 500000 },
  { id: 'pulsa',        kelompok: 'Keinginan', kategori: 'Pulsa & kuota',                       nominal: 300000 },
  { id: 'hiburan',      kelompok: 'Keinginan', kategori: 'Hiburan / streaming',                  nominal: 600000 },
  { id: 'zakat',        kelompok: 'Kewajiban', kategori: 'Zakat & sedekah',                     nominal: 500000 },
  { id: 'dana-darurat', kelompok: 'Tabungan',  kategori: 'Dana darurat',                        nominal: 1000000 },
  { id: 'pendidikan-tab', kelompok: 'Tabungan', kategori: 'Tabungan pendidikan anak',            nominal: 2000000 },
  { id: 'investasi',    kelompok: 'Tabungan',  kategori: 'Investasi (reksa dana)',              nominal: 350000 },
  { id: 'fleksibel',    kelompok: 'Fleksibel', kategori: 'Belum teralokasi (dana fleksibel)',   nominal: 200000 },
];

// Rincian dua pos anggaran yang dijabarkan di kalkulator:
// KPR Rp3.200.000 = anuitas Rp2.866.957 + asuransi/admin Rp333.043;
// zakat & sedekah Rp500.000 = zakat penghasilan Rp462.500 + sedekah Rp37.500.
export const KPR_BREAKDOWN = { anuitas: 2866957, asuransiAdmin: 333043, total: 3200000 };
export const ZAKAT_BREAKDOWN = { zakat: 462500, sedekah: 37500, total: 500000 };

// Kelompok untuk donut chart.
export const GROUP_TOTALS = [
  { kelompok: 'Kebutuhan',            total: 13550000, warna: '#16a34a' },
  { kelompok: 'Keinginan',            total: 900000,   warna: '#d97706' },
  { kelompok: 'Zakat & sedekah',      total: 500000,   warna: '#0e7490' },
  { kelompok: 'Tabungan & investasi', total: 3350000,  warna: '#2563eb' },
  { kelompok: 'Belum teralokasi',     total: 200000,   warna: '#94a3b8' },
];

// 20 transaksi contoh, November 2026. Pemasukan 18,5 jt; outflow 18,5 jt (PAS).
export const SAMPLE_TRANSACTIONS = [
  { id: 't01', tanggal: '2026-11-01', jenis: 'pemasukan',   kelompok: 'Pendapatan', kategori: 'Gaji suami',                 keterangan: 'Gaji suami',                 nominal: 12000000 },
  { id: 't02', tanggal: '2026-11-01', jenis: 'pemasukan',   kelompok: 'Pendapatan', kategori: 'Gaji istri',                 keterangan: 'Gaji istri (guru + freelance)', nominal: 6500000 },
  { id: 't03', tanggal: '2026-11-02', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Cicilan KPR',               keterangan: 'Cicilan KPR',               nominal: 3200000 },
  { id: 't04', tanggal: '2026-11-02', jenis: 'pengeluaran', kelompok: 'Kewajiban',  kategori: 'Zakat & sedekah',           keterangan: 'Zakat penghasilan 2,5%',    nominal: 462500 },
  { id: 't05', tanggal: '2026-11-03', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Listrik, air, internet',    keterangan: 'Listrik, air, internet',    nominal: 850000 },
  { id: 't06', tanggal: '2026-11-03', jenis: 'pengeluaran', kelompok: 'Tabungan',   kategori: 'Dana darurat',              keterangan: 'Transfer dana darurat',     nominal: 1000000 },
  { id: 't07', tanggal: '2026-11-05', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Makan & minum',             keterangan: 'Belanja dapur mingguan 1',  nominal: 1200000 },
  { id: 't08', tanggal: '2026-11-06', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Belanja rumah tangga',      keterangan: 'Belanja rumah tangga',      nominal: 1200000 },
  { id: 't09', tanggal: '2026-11-07', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Transportasi',              keterangan: 'Transportasi',              nominal: 1800000 },
  { id: 't10', tanggal: '2026-11-08', jenis: 'pengeluaran', kelompok: 'Keinginan',  kategori: 'Pulsa & kuota',             keterangan: 'Pulsa & kuota',             nominal: 300000 },
  { id: 't11', tanggal: '2026-11-10', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Pendidikan anak',           keterangan: 'SPP 2 anak',                nominal: 1500000 },
  { id: 't12', tanggal: '2026-11-12', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Makan & minum',             keterangan: 'Belanja dapur mingguan 2',  nominal: 1100000 },
  { id: 't13', tanggal: '2026-11-15', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Kesehatan + BPJS',          keterangan: 'BPJS + obat',               nominal: 500000 },
  { id: 't14', tanggal: '2026-11-16', jenis: 'pengeluaran', kelompok: 'Keinginan',  kategori: 'Hiburan / streaming',       keterangan: 'Streaming & hiburan',       nominal: 600000 },
  { id: 't15', tanggal: '2026-11-19', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Makan & minum',             keterangan: 'Belanja dapur mingguan 3',  nominal: 1100000 },
  { id: 't16', tanggal: '2026-11-20', jenis: 'pengeluaran', kelompok: 'Kewajiban',  kategori: 'Zakat & sedekah',           keterangan: 'Sedekah',                   nominal: 37500 },
  { id: 't17', tanggal: '2026-11-25', jenis: 'pengeluaran', kelompok: 'Tabungan',   kategori: 'Tabungan pendidikan anak',  keterangan: 'Tabungan pendidikan anak',  nominal: 2000000 },
  { id: 't18', tanggal: '2026-11-26', jenis: 'pengeluaran', kelompok: 'Kebutuhan',  kategori: 'Makan & minum',             keterangan: 'Belanja dapur mingguan 4',  nominal: 1100000 },
  { id: 't19', tanggal: '2026-11-28', jenis: 'pengeluaran', kelompok: 'Tabungan',   kategori: 'Investasi (reksa dana)',    keterangan: 'Reksa dana',                nominal: 350000 },
  { id: 't20', tanggal: '2026-11-30', jenis: 'pengeluaran', kelompok: 'Fleksibel',  kategori: 'Belum teralokasi',          keterangan: 'Dana fleksibel',             nominal: 200000 },
];

// Proyeksi tabungan 12 bulan: setoran Rp2.000.000/bln, bunga 5%/tahun (dihitung bulanan).
export const SAVINGS_PROJECTION = (() => {
  const r = 0.05 / 12;
  let saldo = 0;
  const out = [];
  for (let b = 0; b < 12; b++) { saldo = saldo * (1 + r) + 2000000; out.push(Math.round(saldo)); }
  return out;
})();

export const SAVINGS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// 8 tips hemat kontekstual untuk keluarga di Jakarta.
export const TIPS = [
  { judul: 'Belanja dapur seminggu sekali', isi: 'Susun menu mingguan, belanja di pasar tradisional pagi hari, dan bawa daftar — keluarga contoh menghemat sampai Rp300.000/bulan dibanding belanja harian tanpa daftar.' },
  { judul: 'Masak bekal, kurangi jajan', isi: 'Bekal untuk suami dan bekal sekolah anak memangkas jajan harian. Satu kali makan di luar sekeluarga bisa setara belanja dapur dua hari.' },
  { judul: 'Naik KRL, isi bensin terjadwal', isi: 'KRL untuk rute tetap lebih murah daripada bensin + parkir harian. Tetapkan jatah bensin mingguan dan catat setiap isi.' },
  { judul: 'Matikan AC dan lampu tak terpakai', isi: 'Listrik Rp850.000/bulan bisa turun 10–15% hanya dengan mematikan AC saat ruangan kosong dan memakai kipas di malam hari.' },
  { judul: 'Langganan streaming cukup satu', isi: 'Satu layanan streaming yang benar-benar ditonton cukup untuk keluarga. Rotasi langganan tiap bulan bila ingin ganti tontonan.' },
  { judul: 'Otomatiskan transfer di tanggal gajian', isi: 'Pindahkan dana darurat dan tabungan pendidikan di tanggal 1, sebelum uang sempat terpakai. Yang tidak terlihat, tidak tergoda dipakai.' },
  { judul: 'Beli seragam dan buku di awal tahun ajaran', isi: 'Harga kebutuhan sekolah naik menjelang masuk sekolah. Beli lebih awal dan manfaatkan diskon toko buku untuk SPP 2 anak yang sudah Rp1.500.000/bulan.' },
  { judul: 'Cek promo BPJS dan obat generik', isi: 'Obat generik dengan zat aktif sama jauh lebih murah. Manfaatkan fasilitas BPJS untuk kontrol rutin sebelum membeli obat di luar.' },
];

// Checklist hemat — id stabil untuk localStorage.
export const CHECKLIST_ITEMS = [
  { id: 'c1', teks: 'Susun menu dan daftar belanja mingguan' },
  { id: 'c2', teks: 'Transfer dana darurat setiap tanggal 1' },
  { id: 'c3', teks: 'Transfer tabungan pendidikan setiap tanggal 1' },
  { id: 'c4', teks: 'Catat semua pengeluaran hari ini di tracker' },
  { id: 'c5', teks: 'Matikan lampu dan AC ruangan kosong' },
  { id: 'c6', teks: 'Bawa bekal, jangan jajan di luar' },
  { id: 'c7', teks: 'Cek saldo rekening dan tagihan jatuh tempo' },
  { id: 'c8', teks: 'Review anggaran mingguan bersama pasangan' },
];
