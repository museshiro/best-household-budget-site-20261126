# Anggaran Rumah Tangga Kita

[![Competition](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/museshiro/best-household-budget-site-20261126/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/museshiro/best-household-budget-site-20261126/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

Situs anggaran rumah tangga Indonesia untuk keluarga 2 anak di Jakarta — satu halaman penuh dengan 10 kalkulator yang semuanya benar-benar menghitung, data contoh yang konsisten secara aritmetika, 4 grafik, tracker pengeluaran, dan laporan bulanan.

**Kompetisi:** [Make the best household budget site — best-household-budget-site-20261126-1457](https://make.fun/bounty/best-household-budget-site-20261126-1457)

## Yang bisa dilakukan situs ini

- **Dashboard Ringkasan** — pemasukan, pengeluaran, sisa, % tabungan, dan skor kesehatan anggaran 0–100 (contoh: 70, "Cukup") dengan diagnosis satu kalimat.
- **Atur Pemasukan & Target** — gaji suami/istri, pemasukan lain, target dana darurat dan tabungan pendidikan; tersimpan di browser.
- **Kalkulator Anggaran 50/30/20** — target vs aktual per pilar dengan progress bar dan saran otomatis. Jujur: kebutuhan contoh 73,2% (over Rp4.300.000) karena cicilan KPR.
- **Tracker Pengeluaran** — tambah, edit, hapus transaksi; filter kelompok dan bulan; total berjalan. 20 transaksi contoh November 2026, total pas Rp18.500.000.
- **4 Grafik** — donut komposisi, bar 50/30/20 target vs aktual, garis proyeksi tabungan 12 bulan, dan bar kategori kebutuhan.
- **6 Kalkulator Keuangan** — dana darurat (target Rp81.300.000, tercapai 58 bulan), target tabungan bunga majemuk (Rp120.000.000 dalam 54 bulan, saldo akhir Rp120.833.977), cicilan KPR anuitas (Rp2.866.956/bulan + biaya = Rp3.200.000), zakat penghasilan 2,5% dengan nisab 85 gram emas (Rp462.500/bulan), inflasi & daya beli, dan pelunasan utang (Rp10.000.000 lunas 11 bulan, bunga Rp589.849).
- **Laporan Bulanan** — anggaran vs aktual per kategori, export CSV, dan cetak dengan stylesheet print-friendly. Dana pensiun juga ditandai: target ideal 30% gaji belum tercapai, dengan saran naik bertahap 1%/tahun.
- **Tips & Checklist Hemat** — 8 tips kontekstual Jakarta + checklist harian yang tersimpan di browser.

## Data contoh (konsisten, sudah diverifikasi)

Pemasukan Rp18.500.000/bulan (gaji suami Rp12.000.000 + gaji istri Rp6.500.000) dan total outflow Rp18.500.000 — sisa Rp0, setiap rupiah sudah punya tempat. Dana darurat target Rp81.300.000 (6 × Rp13.550.000 pengeluaran esensial), saldo awal Rp24.000.000.

## Cara menjalankan

```sh
node serve.ts
# buka http://localhost:8080
```

Atau buka langsung `app/index.html` di browser. Situs ini murni HTML/CSS/JS tanpa CDN, tanpa font eksternal, tanpa fetch — semua data tersimpan lokal di browser, tidak dikirim ke server mana pun.

## Struktur

```
main.ts            # menyalin app/ + screenshots/ ke /output, menulis dossier.json
serve.ts           # server statis lokal (pengembangan)
vendor/makefun-frontend.ts  # salinan kit, tidak diubah
app/
  index.html       # satu halaman: header, nav, 8 seksi, footer
  style.css        # font sistem, grid responsif, @media print
  data.js          # data contoh kanonis
  charts.js        # 4 chart canvas 2D murni
  app.js           # state, localStorage, 10 tools, export CSV
screenshots/       # 4 screenshot situs yang sedang berjalan
```

## Lisensi

MIT — lihat [LICENSE](LICENSE).
