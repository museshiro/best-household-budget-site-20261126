/* Anggaran Rumah Tangga Kita — logika aplikasi.
   State di localStorage (ahrt-setup, ahrt-transactions, ahrt-checklist).
   Semua hitungan memakai fungsi murni di bawah; tidak ada jaringan. */
'use strict';

const D = window.AHRT;
const fmt = D.fmtIdr, fmtPct = D.fmtPct, fmtJt = D.fmtJt;
const $ = (id) => document.getElementById(id);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/* ---------- state ---------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* penyimpanan penuh: abaikan */ }
}
let setup = loadJSON('ahrt-setup', { husband: 12000000, wife: 6500000 });
let transactions = loadJSON('ahrt-transactions', null);
let checklist = loadJSON('ahrt-checklist', {});
let seededSample = false;
if (!Array.isArray(transactions) || transactions.length === 0) {
  transactions = D.transactions.map((t) => ({ ...t }));
  saveJSON('ahrt-transactions', transactions);
  seededSample = true;
}
const income = () => (Number(setup.husband) || 0) + (Number(setup.wife) || 0);
const sumOut = (list) => list.filter((t) => t.kind === 'out').reduce((s, t) => s + t.amount, 0);
const sumIn = (list) => list.filter((t) => t.kind === 'in').reduce((s, t) => s + t.amount, 0);
const pillarTotal = (pillar) => D.categories.filter((c) => c.pillar === pillar)
  .reduce((s, c) => s + c.budget, 0);

/* ---------- fungsi hitung murni (dipakai kalkulator + kartu aksi) ---------- */
function calcEmergency(essential, balance, deposit, coverMonths) {
  const target = essential * coverMonths;
  const gap = Math.max(0, target - balance);
  const months = deposit > 0 ? Math.ceil(gap / deposit) : Infinity;
  return { target, gap, months, pct: target > 0 ? (balance / target) * 100 : 0 };
}
/* Bunga majemuk: bunga dihitung atas saldo awal bulan, setoran masuk di akhir
   bulan (konvensi contoh benar: 54 bulan, saldo akhir Rp120.833.977). */
function calcCompound(target, deposit, rateYear, startBalance) {
  const r = rateYear / 100 / 12;
  let months;
  if (deposit <= 0) months = Infinity;
  else if (r === 0) months = Math.ceil((target - startBalance) / deposit);
  else months = Math.ceil(Math.log(1 + (target - startBalance) * r / deposit) / Math.log(1 + r));
  if (months === Infinity || months < 0) months = 0;
  /* Simulasi bulanan sampai target tercapai; tabel tahunan selalu 5 tahun
     (tahun 1–5), jadi simulasi dilanjutkan sampai 60 bulan bila perlu. */
  let bal = startBalance;
  let finalBal = startBalance;
  const yearly = [];
  const horizon = Math.max(months, 60);
  for (let m = 1; m <= horizon; m++) {
    bal = bal * (1 + r) + deposit;
    if (m === months) finalBal = bal;
    if (m % 12 === 0) yearly.push({ month: m, balance: Math.round(bal) });
  }
  const totalDeposit = months * deposit;
  return { months, finalBalance: Math.round(finalBal), totalDeposit, interest: Math.round(finalBal) - totalDeposit - startBalance, yearly };
}
function calcMortgage(principal, rateYear, months, extra) {
  const r = rateYear / 100 / 12;
  const raw = r === 0 ? principal / months
    : principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  /* Angsuran dibulatkan KE ATAS ke rupiah terdekat (praktik bank): 2.866.956,25
     menjadi Rp2.866.957, sehingga cicilan total pas Rp3.200.000. Total bayar
     dan total bunga tetap dihitung dari nilai mentah. */
  const installment = Math.ceil(raw);
  const totalPay = Math.round(raw * months);
  const rows = [];
  let bal = principal;
  [1, 12, 60, 120, 180].forEach((m) => {
    if (m > months) return;
    let b = principal;
    for (let i = 1; i < m; i++) { const intr = b * r; b = b - (installment - intr); }
    const intr = b * r;
    rows.push({ month: m, interest: Math.round(intr), principal: Math.round(installment - intr), balance: Math.round(b - (installment - intr)) });
  });
  return { installment: Math.round(installment), totalPay: Math.round(totalPay), totalInterest: Math.round(totalPay - principal), monthlyTotal: Math.round(installment) + extra, rows };
}
function calcZakat(salary, goldPerGram, debt) {
  const nisabYear = 85 * goldPerGram;
  const nisabMonth = nisabYear / 12;
  const basis = salary - debt;
  const due = basis >= nisabMonth;
  return { nisabYear, nisabMonth, basis, due, monthly: due ? 0.025 * basis : 0, yearly: due ? 0.025 * basis * 12 : 0 };
}
function calcInflation(present, rateYear, years) {
  const i = rateYear / 100;
  const future = present * Math.pow(1 + i, years);
  const real = present / Math.pow(1 + i, years);
  const table = [];
  for (let y = 1; y <= years; y++) {
    table.push({ year: y, future: Math.round(present * Math.pow(1 + i, y)), real: Math.round(present / Math.pow(1 + i, y)) });
  }
  return { future: Math.round(future), real: Math.round(real), table };
}
function calcDebt(balance, rateYear, payment) {
  const r = rateYear / 100 / 12;
  const minPayment = balance * r;
  if (payment <= minPayment) {
    return { never: true, minPayment: Math.floor(minPayment) + 1, months: Infinity, totalInterest: 0, totalPay: 0, schedule: [] };
  }
  const months = Math.ceil(-Math.log(1 - balance * r / payment) / Math.log(1 + r));
  let bal = balance, totalInterest = 0;
  const schedule = [];
  for (let m = 1; m <= months && m <= 600; m++) {
    const intr = bal * r;
    const pay = Math.min(payment, bal + intr);
    totalInterest += intr;
    bal = bal + intr - pay;
    if (m === 1 || m === months || m % 3 === 0) schedule.push({ month: m, interest: Math.round(intr), payment: Math.round(pay), balance: Math.max(0, Math.round(bal)) });
  }
  return { never: false, minPayment: Math.floor(minPayment) + 1, months, totalInterest: Math.round(totalInterest), totalPay: Math.round(balance + totalInterest), schedule };
}
function calcHealth() {
  const inc = income();
  const needPct = (pillarTotal('kebutuhan') / inc) * 100;
  const savePct = (pillarTotal('tabungan') / inc) * 100;
  const overCat = D.categories.some((c) => {
    const actual = sumOut(transactions.filter((t) => t.category === c.label));
    return c.budget > 0 && actual > c.budget * 1.2;
  });
  const remaining = sumIn(transactions) - sumOut(transactions);
  let score = 100;
  if (needPct > 60) score -= 30;
  if (savePct < 10) score -= 20;
  if (overCat) score -= 15;
  if (remaining < 0) score -= 10;
  const label = score >= 80 ? 'Sehat' : score >= 60 ? 'Cukup' : score >= 40 ? 'Waspada' : 'Kritis';
  return { score, label, needPct, savePct, remaining };
}
function monthName(offset) {
  const base = new Date(2026, 10, 1); /* November 2026 = bulan contoh */
  const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
}

/* ---------- render dashboard ---------- */
function renderDashboard() {
  const inc = income();
  const need = pillarTotal('kebutuhan'), want = pillarTotal('keinginan');
  const zakat = pillarTotal('zakat'), save = pillarTotal('tabungan'), flex = pillarTotal('fleksibel');
  const belanja = need + want;
  const set = (id, v) => { const n = $(id); if (n) n.textContent = v; };
  set('kas-income', fmt(inc));
  set('kas-belanja', fmt(belanja));
  set('kas-belanja-pct', fmtPct(belanja / inc * 100) + '%');
  set('kas-zakat', fmt(zakat));
  set('kas-zakat-pct', fmtPct(zakat / inc * 100) + '%');
  set('kas-tabung', fmt(save));
  set('kas-tabung-pct', fmtPct(save / inc * 100) + '%');
  set('kas-fleksibel', fmt(flex));
  set('kas-fleksibel-pct', fmtPct(flex / inc * 100) + '%');
  set('kas-total', fmt(inc));
  set('kas-sources', 'gaji suami ' + fmt(Number(setup.husband) || 0) + ' · gaji istri ' + fmt(Number(setup.wife) || 0));

  const health = calcHealth();
  set('kpi-score', String(health.score));
  set('kpi-score-label', health.label);
  const ring = $('kpi-ring-fg');
  if (ring) ring.setAttribute('stroke-dasharray', (health.score * 2.51).toFixed(1) + ' 251.2');
  const em = calcEmergency(D.emergency.essentialMonthly, D.emergency.balance, D.emergency.deposit, D.emergency.coverMonths);
  set('kpi-darurat', fmt(D.emergency.balance));
  set('kpi-darurat-target', 'dari ' + fmt(em.target) + ' (6× belanja)');
  set('kpi-darurat-pct', fmtPct(em.pct) + '%');
  const bar = $('kpi-darurat-bar');
  if (bar) bar.style.width = Math.min(100, em.pct).toFixed(1) + '%';
  set('kpi-darurat-note', '≈' + em.months + ' bulan lagi bila menabung ' + fmtJt(D.emergency.deposit) + '/bln');
  const over5320 = Math.max(0, need - inc * 0.5);
  set('kpi-pilar', '1 dari 3');
  set('kpi-pilar-note', 'Kebutuhan over ' + fmt(over5320) + ' dari target 50%');

  /* Bar anggaran vs aktual per kategori kebutuhan */
  const wrap = $('budget-bars');
  if (wrap) {
    wrap.innerHTML = '';
    D.categories.filter((c) => c.pillar === 'kebutuhan').forEach((c) => {
      const actual = sumOut(transactions.filter((t) => t.category === c.label));
      const pct = c.budget > 0 ? (actual / c.budget) * 100 : 0;
      const row = document.createElement('div');
      row.className = 'bar-row';
      const name = document.createElement('span');
      name.className = 'bar-name';
      name.textContent = c.label;
      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill ' + (pct > 100 ? 'over' : 'ok');
      fill.style.width = Math.min(100, pct).toFixed(1) + '%';
      track.appendChild(fill);
      const val = document.createElement('span');
      val.className = 'bar-val';
      val.textContent = fmt(actual) + ' / ' + fmt(c.budget);
      const badge = document.createElement('span');
      badge.className = 'badge ok';
      badge.textContent = pct > 100 ? 'lewat ' + fmtPct(pct - 100) + '%' : 'pas';
      row.appendChild(name); row.appendChild(track); row.appendChild(val); row.appendChild(badge);
      wrap.appendChild(row);
    });
  }
  renderActions();
}

function renderActions() {
  const grid = $('action-grid');
  if (!grid) return;
  grid.innerHTML = '';
  D.actions.forEach((a) => {
    const card = document.createElement('article');
    card.className = 'action-card';
    const eye = document.createElement('p');
    eye.className = 'eyebrow terra';
    eye.textContent = a.eyebrow;
    const txt = document.createElement('p');
    txt.className = 'action-text';
    txt.textContent = a.text;
    const flow = document.createElement('p');
    flow.className = 'action-flow';
    flow.textContent = a.nowLabel + ' → ' + a.targetLabel + ' · ' + a.saveLabel;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn secondary';
    btn.textContent = 'Terapkan ke Kalkulator';
    btn.addEventListener('click', () => applyAction(a));
    card.appendChild(eye); card.appendChild(txt); card.appendChild(flow); card.appendChild(btn);
    grid.appendChild(card);
  });
}

function applyAction(a) {
  if (a.apply.calc === 'darurat') {
    $('in-setoran-darurat').value = a.apply.deposit;
    calcDarurat();
    document.getElementById('kalk-darurat').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    $('in-setoran-tab').value = a.apply.deposit;
    calcTabungan();
    document.getElementById('kalk-tabungan').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* ---------- render grafik ---------- */
function renderCharts() {
  const C = window.AHRT_CHARTS;
  const inc = income();
  const slices = [
    { label: 'Kebutuhan', value: pillarTotal('kebutuhan'), valueLabel: fmt(pillarTotal('kebutuhan')), pct: fmtPct(pillarTotal('kebutuhan') / inc * 100) + '%', color: C.PALETTE.forestDeep },
    { label: 'Tabungan', value: pillarTotal('tabungan'), valueLabel: fmt(pillarTotal('tabungan')), pct: fmtPct(pillarTotal('tabungan') / inc * 100) + '%', color: C.PALETTE.forestMid },
    { label: 'Keinginan', value: pillarTotal('keinginan'), valueLabel: fmt(pillarTotal('keinginan')), pct: fmtPct(pillarTotal('keinginan') / inc * 100) + '%', color: C.PALETTE.terra },
    { label: 'Zakat', value: pillarTotal('zakat'), valueLabel: fmt(pillarTotal('zakat')), pct: fmtPct(pillarTotal('zakat') / inc * 100) + '%', color: C.PALETTE.gold },
    { label: 'Fleksibel', value: pillarTotal('fleksibel'), valueLabel: fmt(pillarTotal('fleksibel')), pct: fmtPct(pillarTotal('fleksibel') / inc * 100) + '%', color: C.PALETTE.muted },
  ];
  const donut = $('chart-donut');
  if (donut) C.drawDonut(donut, slices, fmtJt(inc));
  const donutMini = $('chart-donut-mini');
  if (donutMini) C.drawDonut(donutMini, slices, fmtJt(inc));
  const groups = [
    { label: 'Kebutuhan', target: inc * 0.5, actual: pillarTotal('kebutuhan'), deltaLabel: '+Rp4.300.000', fmt: (v) => fmtJt(v) },
    { label: 'Keinginan', target: inc * 0.3, actual: pillarTotal('keinginan'), deltaLabel: '−Rp4.650.000', fmt: (v) => fmtJt(v) },
    { label: 'Tabungan', target: inc * 0.2, actual: pillarTotal('tabungan'), deltaLabel: '−Rp350.000', fmt: (v) => fmtJt(v) },
  ];
  const bar = $('chart-target');
  if (bar) C.drawTargetActual(bar, groups);
  const barMini = $('chart-target-mini');
  if (barMini) C.drawTargetActual(barMini, groups);
  /* Proyeksi tabungan pendidikan: 2 jt/bln, 5%/thn, 12 bulan. */
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  let bal = 0;
  const r = 0.05 / 12;
  const values = months.map(() => { bal = bal * (1 + r) + 2000000; return Math.round(bal); });
  const line = $('chart-line');
  if (line) C.drawProjectionLine(line, months, values, 120000000, 'Rp24.557.711 · Des 2027');
  const rows = D.categories.filter((c) => c.pillar === 'kebutuhan')
    .slice().sort((a, b) => b.budget - a.budget)
    .map((c) => {
      const actual = sumOut(transactions.filter((t) => t.category === c.label));
      return { label: c.label.replace(' (belanja dapur)', '').replace(' (bensin + KRL)', '').replace(' (SPP 2 anak)', ''), value: actual, valueLabel: fmtJt(actual), over: actual > c.budget };
    });
  const cat = $('chart-cats');
  if (cat) C.drawCategoryBars(cat, rows);
}

/* ---------- render tracker ---------- */
let editId = null;
function filteredTx() {
  const g = $('filter-group').value;
  const m = $('filter-month').value;
  return transactions.filter((t) => (g === 'semua' || t.group === g) && (m === 'semua' || t.date.slice(0, 7) === m));
}
function renderTracker() {
  const body = $('tx-body');
  if (!body) return;
  const list = filteredTx().slice().sort((a, b) => a.date.localeCompare(b.date));
  body.innerHTML = '';
  list.forEach((t) => {
    const tr = document.createElement('tr');
    const tdDate = document.createElement('td'); tdDate.textContent = D.fmtDate(t.date);
    const tdDesc = document.createElement('td'); tdDesc.textContent = t.desc;
    const tdGroup = document.createElement('td'); tdGroup.textContent = t.group;
    const tdCat = document.createElement('td'); tdCat.textContent = t.category;
    const tdKind = document.createElement('td'); tdKind.textContent = t.kind === 'in' ? 'Masuk' : 'Keluar';
    const tdAmt = document.createElement('td');
    tdAmt.className = 'num ' + (t.kind === 'in' ? 'in' : 'out');
    tdAmt.textContent = (t.kind === 'in' ? '+' : '−') + fmt(t.amount);
    const tdAct = document.createElement('td');
    const bEdit = document.createElement('button');
    bEdit.type = 'button'; bEdit.className = 'btn mini'; bEdit.textContent = 'Ubah';
    bEdit.addEventListener('click', () => startEdit(t.id));
    const bDel = document.createElement('button');
    bDel.type = 'button'; bDel.className = 'btn mini danger'; bDel.textContent = 'Hapus';
    bDel.addEventListener('click', () => {
      if (window.confirm('Hapus transaksi "' + t.desc + '"?')) {
        transactions = transactions.filter((x) => x.id !== t.id);
        saveJSON('ahrt-transactions', transactions);
        renderTracker(); renderDashboard(); renderCharts(); renderReport();
      }
    });
    tdAct.appendChild(bEdit); tdAct.appendChild(bDel);
    [tdDate, tdDesc, tdGroup, tdCat, tdKind, tdAmt, tdAct].forEach((td) => tr.appendChild(td));
    body.appendChild(tr);
  });
  const inSum = sumIn(list), outSum = sumOut(list);
  $('tx-count').textContent = list.length + ' transaksi';
  $('tx-in').textContent = fmt(inSum);
  $('tx-out').textContent = fmt(outSum);
  $('tx-sisa').textContent = fmt(inSum - outSum);
  const perGroup = {};
  list.forEach((t) => { perGroup[t.group] = (perGroup[t.group] || 0) + (t.kind === 'in' ? t.amount : -t.amount); });
  const pg = $('tx-per-group');
  if (pg) {
    pg.innerHTML = '';
    D.groups.forEach((g) => {
      if (perGroup[g] === undefined) return;
      const li = document.createElement('li');
      li.textContent = g + ': ' + fmt(Math.abs(perGroup[g])) + (perGroup[g] < 0 ? ' keluar' : ' masuk');
      pg.appendChild(li);
    });
  }
}
function startEdit(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;
  editId = id;
  $('tx-date').value = t.date;
  $('tx-desc').value = t.desc;
  $('tx-group').value = t.group;
  $('tx-category').value = t.category;
  $('tx-kind').value = t.kind;
  $('tx-amount').value = t.amount;
  $('tx-submit').textContent = 'Simpan Perubahan';
  $('tx-form-title').textContent = 'Ubah transaksi';
  $('tx-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function submitTx(e) {
  e.preventDefault();
  const err = $('tx-error');
  const date = $('tx-date').value;
  const amount = Number($('tx-amount').value);
  if (!date || isNaN(new Date(date).getTime())) { err.textContent = 'Tanggal tidak valid — isi tanggal yang benar.'; return; }
  if (!Number.isFinite(amount) || amount <= 0) { err.textContent = 'Nominal harus angka lebih dari 0.'; return; }
  err.textContent = '';
  const data = { date, desc: $('tx-desc').value.trim() || 'Transaksi', group: $('tx-group').value, category: $('tx-category').value.trim() || $('tx-group').value, kind: $('tx-kind').value, amount };
  if (editId) {
    const t = transactions.find((x) => x.id === editId);
    Object.assign(t, data);
    editId = null;
    $('tx-submit').textContent = 'Tambah Transaksi';
    $('tx-form-title').textContent = 'Tambah transaksi';
  } else {
    transactions.push({ id: 't' + Date.now().toString(36), ...data });
  }
  saveJSON('ahrt-transactions', transactions);
  $('tx-form').reset();
  $('tx-date').value = '2026-11-30';
  renderTracker(); renderDashboard(); renderCharts(); renderReport();
}

/* ---------- render anggaran (tabel) ---------- */
function renderBudget() {
  const body = $('budget-body');
  if (!body) return;
  body.innerHTML = '';
  D.categories.forEach((c) => {
    const actual = sumOut(transactions.filter((t) => t.category === c.label));
    const tr = document.createElement('tr');
    const tdL = document.createElement('td'); tdL.textContent = c.label;
    const tdP = document.createElement('td'); tdP.textContent = D.pillars[c.pillar].label;
    const tdB = document.createElement('td'); tdB.className = 'num'; tdB.textContent = fmt(c.budget);
    const tdA = document.createElement('td'); tdA.className = 'num'; tdA.textContent = fmt(actual);
    const tdS = document.createElement('td'); tdS.className = 'num'; tdS.textContent = fmt(c.budget - actual);
    [tdL, tdP, tdB, tdA, tdS].forEach((td) => tr.appendChild(td));
    body.appendChild(tr);
  });
}

/* ---------- render laporan ---------- */
function renderReport() {
  const inSum = sumIn(transactions), outSum = sumOut(transactions);
  const set = (id, v) => { const n = $(id); if (n) n.textContent = v; };
  set('rep-in', fmt(inSum));
  set('rep-out', fmt(outSum));
  set('rep-sisa', fmt(inSum - outSum));
  set('rep-save-pct', fmtPct(pillarTotal('tabungan') / income() * 100) + '% dari pemasukan ditabung');
  const health = calcHealth();
  set('rep-score', 'Skor kesehatan ' + health.score + ' (' + health.label + ')');
}
function buildCsvRows() {
  const rows = [['Laporan Bulanan - November 2026'], ['Tanggal', 'Keterangan', 'Kelompok', 'Kategori', 'Jenis', 'Nominal (Rp)']];
  transactions.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => {
    rows.push([t.date, t.desc, t.group, t.category, t.kind === 'in' ? 'Masuk' : 'Keluar', String(t.amount)]);
  });
  const inSum = sumIn(transactions), outSum = sumOut(transactions);
  rows.push(['', 'TOTAL PEMASUKAN', '', '', '', String(inSum)]);
  rows.push(['', 'TOTAL PENGELUARAN', '', '', '', String(outSum)]);
  rows.push(['', 'SISA', '', '', '', String(inSum - outSum)]);
  return rows;
}
function exportCsv() {
  const rows = buildCsvRows();
  const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'laporan-november-2026.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $('csv-status').textContent = 'CSV diunduh: 25 baris (20 transaksi + total pemasukan, total pengeluaran, dan sisa)';
}

/* ---------- kalkulator ---------- */
function readNum(id, min, allowZero) {
  const el = $(id);
  const v = Number(el.value);
  if (el.value === '' || !Number.isFinite(v) || v < 0 || (!allowZero && v === 0)) return { ok: false, el };
  if (min !== undefined && v < min) return { ok: false, el };
  return { ok: true, value: v };
}
function setErr(id, msg) { const n = $(id); if (n) n.textContent = msg; }

function calc5320() {
  const g = readNum('in-gaji5320');
  if (!g.ok) { setErr('err-5320', 'Isi gaji bulanan dengan angka lebih dari 0.'); return; }
  setErr('err-5320', '');
  const inc = g.value;
  const tNeed = inc * 0.5, tWant = inc * 0.3, tSave = inc * 0.2;
  const aNeed = pillarTotal('kebutuhan'), aWant = pillarTotal('keinginan'), aSave = pillarTotal('tabungan');
  const row = (label, target, actual) => {
    const pct = actual / inc * 100, tpct = target / inc * 100;
    const diff = actual - target;
    const status = diff > 0 ? 'over ' + fmt(diff) : diff < 0 ? 'kurang ' + fmt(-diff) : 'pas';
    return { label, target, actual, pct, tpct, diff, status };
  };
  const rows = [row('Kebutuhan', tNeed, aNeed), row('Keinginan', tWant, aWant), row('Tabungan', tSave, aSave)];
  const out = $('out-5320');
  out.innerHTML = '';
  rows.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'pillar-row';
    const name = document.createElement('span');
    name.className = 'pillar-name';
    name.textContent = r.label + ' — target ' + fmt(r.target) + ' (' + fmtPct(r.tpct) + '%)';
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill ' + (r.diff > 0 ? 'over' : 'ok');
    fill.style.width = Math.min(100, r.pct / r.tpct * 100).toFixed(1) + '%';
    track.appendChild(fill);
    const val = document.createElement('span');
    val.className = 'bar-val';
    val.textContent = fmt(r.actual) + ' (' + fmtPct(r.pct) + '%) · ' + r.status;
    div.appendChild(name); div.appendChild(track); div.appendChild(val);
    out.appendChild(div);
  });
  const health = calcHealth();
  const note = document.createElement('p');
  note.className = 'calc-note';
  note.textContent = 'Skor kesehatan anggaran: ' + health.score + ' (' + health.label + '). '
    + 'Kebutuhan ' + fmtPct(health.needPct) + '% dari gaji — di atas batas 50%. '
    + 'Zakat ' + fmt(pillarTotal('zakat')) + ' dan dana fleksibel ' + fmt(pillarTotal('fleksibel'))
    + ' dihitung di luar 3 pilar ini: zakat adalah kewajiban, fleksibel adalah sisa yang belum dialokasikan.';
  out.appendChild(note);
}
function calcDarurat() {
  const es = readNum('in-esensial'), sa = readNum('in-saldo-darurat', undefined, true),
    st = readNum('in-setoran-darurat'), cv = Number($('in-cover').value);
  if (!es.ok || !sa.ok || !st.ok) { setErr('err-darurat', 'Isi semua angka dengan benar (saldo boleh 0, setoran harus lebih dari 0).'); return; }
  setErr('err-darurat', '');
  const r = calcEmergency(es.value, sa.value, st.value, cv);
  const alt = calcEmergency(es.value, sa.value, pillarTotal('tabungan'), cv);
  $('out-darurat').innerHTML = '';
  const lines = [
    'Target dana darurat (' + cv + '× belanja esensial): ' + fmt(r.target),
    'Saldo saat ini: ' + fmt(sa.value) + ' (' + fmtPct(r.pct) + '% dari target)',
    'Kekurangan: ' + fmt(r.gap),
    'Waktu tercapai dengan setoran ' + fmt(st.value) + '/bln: ' + r.months + ' bulan (sekitar ' + monthName(r.months) + ')',
    'Bila memakai seluruh sisa tabungan ' + fmt(pillarTotal('tabungan')) + '/bln: ' + alt.months + ' bulan',
  ];
  lines.forEach((t) => { const p = document.createElement('p'); p.className = 'calc-line'; p.textContent = t; $('out-darurat').appendChild(p); });
}
function calcTabungan() {
  const tg = readNum('in-target-tab'), st = readNum('in-setoran-tab'),
    bg = readNum('in-bunga-tab', undefined, true), aw = readNum('in-awal-tab', undefined, true);
  if (!tg.ok || !st.ok || !bg.ok || !aw.ok) { setErr('err-tabungan', 'Isi semua angka dengan benar (bunga dan saldo awal boleh 0).'); return; }
  setErr('err-tabungan', '');
  const r = calcCompound(tg.value, st.value, bg.value, aw.value);
  const out = $('out-tabungan');
  out.innerHTML = '';
  const lines = [
    'Waktu tercapai: ' + r.months + ' bulan (sekitar ' + monthName(r.months) + ')',
    'Saldo akhir: ' + fmt(r.finalBalance),
    'Total setoran: ' + fmt(r.totalDeposit),
    'Total bunga: ' + fmt(r.interest),
  ];
  lines.forEach((t) => { const p = document.createElement('p'); p.className = 'calc-line'; p.textContent = t; out.appendChild(p); });
  const tb = $('tbody-tabungan');
  tb.innerHTML = '';
  const years = {};
  r.yearly.forEach((y) => { years[Math.ceil(y.month / 12)] = y.balance; });
  Object.keys(years).slice(0, 5).forEach((y) => {
    const tr = document.createElement('tr');
    const a = document.createElement('td'); a.textContent = 'Tahun ' + y;
    const b = document.createElement('td'); b.className = 'num'; b.textContent = fmt(years[y]);
    tr.appendChild(a); tr.appendChild(b); tb.appendChild(tr);
  });
}
function calcKpr() {
  const pk = readNum('in-pokok'), bg = readNum('in-bunga-kpr', undefined, true),
    tn = readNum('in-tenor'), bi = readNum('in-biaya-kpr', undefined, true);
  if (!pk.ok || !bg.ok || !tn.ok || !bi.ok) { setErr('err-kpr', 'Isi semua angka dengan benar (bunga dan biaya tambahan boleh 0).'); return; }
  setErr('err-kpr', '');
  const r = calcMortgage(pk.value, bg.value, tn.value, bi.value);
  const out = $('out-kpr');
  out.innerHTML = '';
  const lines = [
    'Angsuran pokok + bunga: ' + fmt(r.installment) + '/bln',
    'Cicilan total (angsuran + biaya tambahan): ' + fmt(r.monthlyTotal) + '/bln',
    'Total bayar selama ' + tn.value + ' bulan: ' + fmt(r.totalPay),
    'Total bunga: ' + fmt(r.totalInterest),
  ];
  lines.forEach((t) => { const p = document.createElement('p'); p.className = 'calc-line'; p.textContent = t; out.appendChild(p); });
  const warn = document.createElement('p');
  warn.className = 'calc-note ' + (r.monthlyTotal > income() * 0.3 ? 'warn' : '');
  warn.textContent = r.monthlyTotal > income() * 0.3
    ? 'Peringatan: cicilan ' + fmtPct(r.monthlyTotal / income() * 100) + '% dari gaji — di atas batas aman 30%.'
    : 'Cicilan ' + fmtPct(r.monthlyTotal / income() * 100) + '% dari gaji — masih di bawah batas aman 30%.';
  out.appendChild(warn);
  const tb = $('tbody-kpr');
  tb.innerHTML = '';
  r.rows.forEach((row) => {
    const tr = document.createElement('tr');
    const cells = ['Bulan ' + row.month, fmt(row.interest), fmt(row.principal), fmt(row.balance)];
    cells.forEach((text, ci) => {
      const td = document.createElement('td');
      td.textContent = text;
      if (ci > 0) td.className = 'num';
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}
function calcZakatTool() {
  const gj = readNum('in-gaji-zakat'), em = readNum('in-emas'), ut = readNum('in-utang-zakat', undefined, true);
  if (!gj.ok || !em.ok || !ut.ok) { setErr('err-zakat', 'Isi semua angka dengan benar (utang boleh 0).'); return; }
  setErr('err-zakat', '');
  const r = calcZakat(gj.value, em.value, ut.value);
  const out = $('out-zakat');
  out.innerHTML = '';
  const lines = [
    'Nisab tahunan (85 gram emas): ' + fmt(r.nisabYear),
    'Nisab bulanan: ' + fmt(r.nisabMonth),
    'Basis zakat (gaji − utang jatuh tempo): ' + fmt(r.basis),
    r.due
      ? 'Zakat penghasilan: ' + fmt(r.monthly) + '/bulan = ' + fmt(r.yearly) + '/tahun'
      : 'Belum wajib (di bawah nisab) — zakat Rp0, sedekah tetap dianjurkan.',
  ];
  lines.forEach((t) => { const p = document.createElement('p'); p.className = 'calc-line'; p.textContent = t; out.appendChild(p); });
}
function calcInflasi() {
  const nm = readNum('in-nominal'), inf = readNum('in-inflasi', undefined, true), th = Number($('in-tahun').value);
  if (!nm.ok || !inf.ok || !Number.isFinite(th) || th < 1 || th > 20) { setErr('err-inflasi', 'Isi nominal dengan benar dan pilih jangka 1–20 tahun.'); return; }
  setErr('err-inflasi', '');
  $('tahun-label').textContent = th + ' tahun';
  const r = calcInflation(nm.value, inf.value, th);
  const out = $('out-inflasi');
  out.innerHTML = '';
  const lines = [
    'Biaya di masa depan (' + th + ' tahun lagi): ' + fmt(r.future),
    'Nilai riil uang hari ini: ' + fmt(r.real),
    'Artinya: uang ' + fmt(nm.value) + ' hari ini hanya setara ' + fmt(r.real) + ' dalam daya beli ' + th + ' tahun lagi.',  ];
  lines.forEach((t) => { const p = document.createElement('p'); p.className = 'calc-line'; p.textContent = t; out.appendChild(p); });
  const tb = $('tbody-inflasi');
  tb.innerHTML = '';
  r.table.forEach((row) => {
    const tr = document.createElement('tr');
    const a = document.createElement('td'); a.textContent = 'Tahun ' + row.year;
    const b = document.createElement('td'); b.className = 'num'; b.textContent = fmt(row.future);
    const c = document.createElement('td'); c.className = 'num'; c.textContent = fmt(row.real);
    tr.appendChild(a); tr.appendChild(b); tr.appendChild(c); tb.appendChild(tr);
  });
}
function calcUtang() {
  const sd = readNum('in-saldo-utang'), bg = readNum('in-bunga-utang', undefined, true), ci = readNum('in-cicilan-utang');
  if (!sd.ok || !bg.ok || !ci.ok) { setErr('err-utang', 'Isi semua angka dengan benar (bunga boleh 0, cicilan harus lebih dari 0).'); return; }
  setErr('err-utang', '');
  const r = calcDebt(sd.value, bg.value, ci.value);
  const out = $('out-utang');
  out.innerHTML = '';
  if (r.never) {
    const p = document.createElement('p');
    p.className = 'calc-line warn';
    p.textContent = 'Tidak pernah lunas — cicilan ' + fmt(ci.value) + ' tidak menutup bunga bulanan ' + fmt(Math.round(sd.value * bg.value / 100 / 12)) + '. Cicilan minimum: ' + fmt(r.minPayment) + '/bln.';
    out.appendChild(p);
    return;
  }
  const lines = [
    'Lunas dalam: ' + r.months + ' bulan (sekitar ' + monthName(r.months) + ')',
    'Total bayar: ' + fmt(r.totalPay),
    'Total bunga: ' + fmt(r.totalInterest),
  ];
  lines.forEach((t) => { const p = document.createElement('p'); p.className = 'calc-line'; p.textContent = t; out.appendChild(p); });
  const tb = $('tbody-utang');
  tb.innerHTML = '';
  r.schedule.forEach((row) => {
    const tr = document.createElement('tr');
    const a = document.createElement('td'); a.textContent = 'Bulan ' + row.month;
    const b = document.createElement('td'); b.className = 'num'; b.textContent = fmt(row.interest);
    const c = document.createElement('td'); c.className = 'num'; c.textContent = fmt(row.payment);
    const d = document.createElement('td'); d.className = 'num'; d.textContent = fmt(row.balance);
    tr.appendChild(a); tr.appendChild(b); tr.appendChild(c); tr.appendChild(d); tb.appendChild(tr);
  });
}

/* ---------- checklist tips ---------- */
function renderTips() {
  const list = $('tips-list');
  if (!list) return;
  list.innerHTML = '';
  D.tips.forEach((t) => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    label.className = 'tip-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!checklist[t.id];
    cb.addEventListener('change', () => {
      checklist[t.id] = cb.checked;
      saveJSON('ahrt-checklist', checklist);
      renderTipsCount();
    });
    const span = document.createElement('span');
    span.textContent = t.text;
    label.appendChild(cb); label.appendChild(span);
    li.appendChild(label);
    list.appendChild(li);
  });
  renderTipsCount();
}
function renderTipsCount() {
  const done = D.tips.filter((t) => checklist[t.id]).length;
  const n = $('tips-count');
  if (n) n.textContent = done + ' dari ' + D.tips.length + ' tips sudah dicentang';
}

/* ---------- setup ---------- */
function bindSetup() {
  $('in-suami').value = setup.husband;
  $('in-istri').value = setup.wife;
  $('setup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const h = Number($('in-suami').value), w = Number($('in-istri').value);
    if (!Number.isFinite(h) || h < 0 || !Number.isFinite(w) || w < 0 || h + w <= 0) {
      $('setup-error').textContent = 'Isi kedua gaji dengan angka 0 atau lebih, total harus lebih dari 0.';
      return;
    }
    $('setup-error').textContent = '';
    setup = { husband: h, wife: w };
    saveJSON('ahrt-setup', setup);
    $('setup-status').textContent = 'Tersimpan — pemasukan ' + fmt(income()) + '/bulan. Semua alat ikut berhitung ulang.';
    renderDashboard(); renderCharts(); renderReport(); calc5320(); calcZakatTool();
  });
  $('reset-data').addEventListener('click', () => {
    if (!window.confirm('Kembalikan semua data ke contoh awal?')) return;
    setup = { husband: 12000000, wife: 6500000 };
    transactions = D.transactions.map((t) => ({ ...t }));
    checklist = {};
    saveJSON('ahrt-setup', setup);
    saveJSON('ahrt-transactions', transactions);
    saveJSON('ahrt-checklist', checklist);
    $('in-suami').value = setup.husband;
    $('in-istri').value = setup.wife;
    renderAll();
    $('setup-status').textContent = 'Data contoh dimuat kembali.';
  });
}

/* ---------- init ---------- */
function renderAll() {
  renderDashboard();
  renderBudget();
  renderTracker();
  renderCharts();
  renderReport();
  renderTips();
  calc5320(); calcDarurat(); calcTabungan(); calcKpr(); calcZakatTool(); calcInflasi(); calcUtang();
}
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderCharts, 150);
});
document.addEventListener('DOMContentLoaded', () => {
  const banner = $('sample-banner');
  if (banner && seededSample) banner.hidden = false;
  bindSetup();
  $('tx-form').addEventListener('submit', submitTx);
  $('filter-group').addEventListener('change', renderTracker);
  $('filter-month').addEventListener('change', renderTracker);
  ['in-gaji5320'].forEach((id) => $(id).addEventListener('input', calc5320));
  ['in-esensial', 'in-saldo-darurat', 'in-setoran-darurat', 'in-cover'].forEach((id) => $(id).addEventListener('input', calcDarurat));
  ['in-target-tab', 'in-setoran-tab', 'in-bunga-tab', 'in-awal-tab'].forEach((id) => $(id).addEventListener('input', calcTabungan));
  ['in-pokok', 'in-bunga-kpr', 'in-tenor', 'in-biaya-kpr'].forEach((id) => $(id).addEventListener('input', calcKpr));
  ['in-gaji-zakat', 'in-emas', 'in-utang-zakat'].forEach((id) => $(id).addEventListener('input', calcZakatTool));
  ['in-nominal', 'in-inflasi', 'in-tahun'].forEach((id) => $(id).addEventListener('input', calcInflasi));
  ['in-saldo-utang', 'in-bunga-utang', 'in-cicilan-utang'].forEach((id) => $(id).addEventListener('input', calcUtang));
  $('btn-csv').addEventListener('click', exportCsv);
  $('btn-print').addEventListener('click', () => window.print());
  renderAll();
  window.__shotReady = true;
});
