[![Make.fun competition](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/museshiro/best-household-budget-site-20261126/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/museshiro/best-household-budget-site-20261126/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

# Anggaran Rumah Tangga Kita — buku kas keluarga

Situs anggaran rumah tangga untuk keluarga 4 orang di Jakarta: ke mana Rp18,5 juta pergi setiap bulan, dan bagaimana mengaturnya. Dibuat untuk [kompetisi make.fun "Make the best household budget site"](https://make.fun/bounty/best-household-budget-site-20261126-1457).

## Yang ada di situs

- **Dashboard** — Papan Kas (pemasukan Rp18.500.000 dibagi belanja Rp14.450.000, zakat Rp500.000, ditabung Rp3.350.000, sisa fleksibel Rp200.000), skor kesehatan anggaran 70 ("Cukup"), dana darurat, bar anggaran-vs-aktual per kategori, dan **Rencana Aksi Bulan Ini** (4 aksi berangka, tombolnya benar-benar mengubah kalkulator).
- **Atur Pemasukan** — ubah gaji suami/istri; semua alat ikut berhitung ulang.
- **Anggaran 50/30/20** — kalkulator target vs aktual + tabel 14 pos anggaran.
- **Tracker** — 20 transaksi contoh November 2026; tambah, ubah, hapus, filter kelompok dan bulan; tersimpan di `localStorage`.
- **Grafik** — 4 chart canvas tanpa library: donut komposisi, bar target vs aktual, line proyeksi tabungan 12 bulan, bar per kategori kebutuhan.
- **Kalkulator** — 10 alat: 50/30/20, tracker, dana darurat (58 bulan), target tabungan bunga majemuk (54 bulan, Rp120.833.977), cicilan KPR anuitas (Rp2.866.957/bln), zakat penghasilan (Rp462.500/bln), inflasi (Rp12.166.529 dalam 5 tahun), pelunasan utang (11 bulan), dashboard otomatis, export CSV + cetak.
- **Laporan** — CSV 25 baris (20 transaksi + 3 total) dan cetak.
- **Tips Hemat** — 8 tips dengan checklist tersimpan lokal.

## Cara menjalankan

```sh
node serve.ts
# buka http://localhost:8080
```

Tidak ada build step, tidak ada dependensi, tidak ada permintaan jaringan — semua file statis di `app/`, font sistem saja.

## Data

Semua angka contoh adalah data keluarga fiktif (lihat `app/data.js`). Pemasukan Rp18.500.000/bulan; anggaran total Rp18.500.000 — pas, sisa Rp0. Semua Rupiah diformat `id-ID`. Kompetisi ditutup 29 November 2026.

## Lisensi

MIT — lihat [LICENSE](LICENSE).

## Struktur repo

```
app/
  index.html   satu halaman: header, nav, 8 seksi, footer
  style.css    sistem visual "buku kas" — kertas krem, hijau hutan, terakota
  data.js      data contoh kanonis + format Rupiah id-ID
  charts.js    4 chart canvas 2D murni
  app.js       state, 10 alat, render, export CSV
main.ts        menyalin app/ + screenshots/ ke output, menulis dossier.json
serve.ts       server statis lokal (pengembangan saja)
vendor/        makefun-frontend.ts (library make.fun, tidak diubah)
screenshots/   4 tangkapan layar situs yang sedang berjalan
```
