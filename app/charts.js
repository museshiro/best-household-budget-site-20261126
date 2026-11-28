/* Anggaran Rumah Tangga Kita — 4 chart canvas 2D murni, tanpa library.
   Palet di-hardcode di sini dan HARUS cocok dengan :root di style.css. */
'use strict';

const PALETTE = {
  ink: '#1A1A1A', ink2: '#4A4540', paper: '#FBF6E9', surface: '#FFFCF2',
  line: '#E4DCC6', lineStrong: '#D6CCB4', forest: '#1F4E3D', forestDeep: '#143528',
  forestMid: '#4A8172', terra: '#B85C3C', gold: '#C9A227', success: '#2D7A4F',
  warning: '#B8761C', danger: '#A8311F', muted: '#A8A79E',
};
const MONO = "12px ui-monospace, 'SF Mono', Consolas, 'Courier New', monospace";
const MONO_SM = "11px ui-monospace, 'SF Mono', Consolas, 'Courier New', monospace";
const SANS = "13px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/* Siapkan canvas DPR-aware; kembalikan ctx + ukuran CSS.
   Tinggi canvas diatur per chart agar label luar donut tidak terpotong. */
function prepCanvas(canvas, heightCss) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || canvas.parentElement.clientWidth || 560;
  const h = heightCss;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/* 1. Donut komposisi outflow: 5 slice + label luar + total di tengah.
   Label luar di-stagger vertikal per sisi supaya slice kecil yang
   berdekatan tidak bertabrakan; nama dipendekkan, nilai lengkap ada di
   teks fallback di bawah canvas. */
function drawDonut(canvas, slices, totalLabel) {
  const { ctx, w, h } = prepCanvas(canvas, 340);
  const cx = w / 2, cy = h / 2 + 6, rOut = 92, rIn = 60;
  const total = slices.reduce((s, x) => s + x.value, 0);
  let a = -Math.PI / 2;
  const mids = [];
  slices.forEach((s) => {
    const span = (s.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rOut, a, a + span);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    mids.push(a + span / 2);
    a += span;
  });
  /* Lubang tengah */
  ctx.beginPath();
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.surface;
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "600 15px ui-monospace, Consolas, monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(totalLabel, cx, cy - 9);
  ctx.fillStyle = PALETTE.ink2;
  ctx.font = MONO_SM;
  ctx.fillText('100% dari gaji', cx, cy + 11);
  /* Label luar: kumpulkan dulu, stagger vertikal per sisi, baru digambar. */
  const items = slices.map((s, i) => {
    const mid = mids[i];
    const left = Math.cos(mid) < 0;
    const ex = cx + Math.cos(mid) * (rOut + 4);
    const ey = cy + Math.sin(mid) * (rOut + 4);
    const ax = cx + Math.cos(mid) * (rOut + 22);
    const ay = cy + Math.sin(mid) * (rOut + 22);
    return { s, left, ex, ey, ax, ay, lx: ax + (left ? -22 : 22), ly: ay };
  });
  [true, false].forEach((side) => {
    const group = items.filter((it) => it.left === side).sort((p, q) => p.ly - q.ly);
    for (let i = 1; i < group.length; i++) {
      if (group[i].ly < group[i - 1].ly + 32) group[i].ly = group[i - 1].ly + 32;
    }
  });
  ctx.font = MONO_SM;
  items.forEach((it) => {
    /* Siku memakai ly hasil stagger, bukan ay asli: ruas horizontal tepat
       setinggi label, jadi garis tidak menyerong menembus label tetangga. */
    ctx.strokeStyle = PALETTE.lineStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(it.ex, it.ey);
    ctx.lineTo(it.ax, it.ly);
    ctx.lineTo(it.lx, it.ly);
    ctx.stroke();
    ctx.textAlign = it.left ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(it.s.label, it.lx, it.ly - 7);
    ctx.fillStyle = PALETTE.ink2;
    ctx.fillText(it.s.valueLabel + ' · ' + it.s.pct, it.lx, it.ly + 7);
  });
}

/* 2. Bar target vs aktual 50/30/20 (grouped), label nilai di atas batang. */
function drawTargetActual(canvas, groups) {
  const { ctx, w, h } = prepCanvas(canvas, 340);
  const padL = 8, padR = 8, padT = 30, padB = 34;
  const maxV = Math.max.apply(null, groups.map((g) => Math.max(g.target, g.actual))) * 1.18;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const groupW = plotW / groups.length;
  const barW = Math.min(44, groupW / 3.4);
  ctx.strokeStyle = PALETTE.lineStrong;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT + plotH);
  ctx.lineTo(w - padR, padT + plotH);
  ctx.stroke();
  groups.forEach((g, gi) => {
    const gx = padL + gi * groupW + groupW / 2;
    const pairs = [
      { v: g.target, color: '#CFC7B0', label: 'target' },
      { v: g.actual, color: g.actual > g.target ? PALETTE.danger : PALETTE.success, label: 'aktual' },
    ];
    pairs.forEach((p, pi) => {
      const bh = (p.v / maxV) * plotH;
      const bx = gx + (pi === 0 ? -barW - 4 : 4);
      const by = padT + plotH - bh;
      ctx.fillStyle = p.color;
      ctx.fillRect(bx, by, barW, bh);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = MONO_SM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(g.fmt(p.v), bx + barW / 2, by - 4);
    });
    ctx.fillStyle = PALETTE.ink;
    ctx.font = SANS;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(g.label, gx, padT + plotH + 8);
    ctx.fillStyle = g.actual > g.target ? PALETTE.danger : PALETTE.success;
    ctx.font = MONO_SM;
    ctx.fillText(g.deltaLabel, gx, padT + plotH + 24);
  });
  /* Legenda kecil */
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = MONO_SM;
  ctx.fillStyle = '#CFC7B0';
  ctx.fillRect(padL, 8, 12, 12);
  ctx.fillStyle = PALETTE.ink2;
  ctx.fillText('target', padL + 17, 14);
  ctx.fillStyle = PALETTE.success;
  ctx.fillRect(padL + 72, 8, 12, 12);
  ctx.fillStyle = PALETTE.ink2;
  ctx.fillText('aktual (≤ target = hijau, over = merah)', padL + 89, 14);
}

/* 3. Line proyeksi tabungan 12 bulan + garis target putus-putus. */
function drawProjectionLine(canvas, months, values, targetValue, endLabel) {
  const { ctx, w, h } = prepCanvas(canvas, 320);
  const padL = 64, padR = 16, padT = 26, padB = 30;
  const maxV = Math.max(targetValue, values[values.length - 1]) * 1.08;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const x = (i) => padL + (i / (months.length - 1)) * plotW;
  const y = (v) => padT + plotH - (v / maxV) * plotH;
  /* Grid + label sumbu Y */
  ctx.font = MONO_SM;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
    const gy = padT + plotH - f * plotH;
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(w - padR, gy);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink2;
    ctx.fillText('Rp' + (maxV * f / 1000000).toFixed(0).replace('.', ',') + ' jt', padL - 8, gy);
  });
  /* Garis target putus-putus */
  ctx.strokeStyle = PALETTE.terra;
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, y(targetValue));
  ctx.lineTo(w - padR, y(targetValue));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = PALETTE.terra;
  ctx.textAlign = 'left';
  ctx.fillText('target Rp120 jt', padL + 6, y(targetValue) - 9);
  /* Area fill + garis proyeksi */
  const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  grad.addColorStop(0, 'rgba(31,78,61,0.16)');
  grad.addColorStop(1, 'rgba(31,78,61,0.01)');
  ctx.beginPath();
  ctx.moveTo(x(0), y(values[0]));
  values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
  ctx.lineTo(x(values.length - 1), padT + plotH);
  ctx.lineTo(x(0), padT + plotH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  values.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))));
  ctx.strokeStyle = PALETTE.forest;
  ctx.lineWidth = 2;
  ctx.stroke();
  values.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(x(i), y(v), 2.5, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.forest;
    ctx.fill();
  });
  /* Label sumbu X + label akhir */
  ctx.font = MONO_SM;
  ctx.fillStyle = PALETTE.ink2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  months.forEach((m, i) => {
    if (i % 2 === 0 || i === months.length - 1) ctx.fillText(m, x(i), padT + plotH + 8);
  });
  ctx.fillStyle = PALETTE.forest;
  ctx.font = "600 11px ui-monospace, Consolas, monospace";
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(endLabel, x(values.length - 1) - 4, y(values[values.length - 1]) - 8);
}

/* 4. Bar horizontal per kategori kebutuhan, urut menurun. */
function drawCategoryBars(canvas, rows) {
  const rowH = 34, padT = 8, padB = 8;
  const { ctx, w, h } = prepCanvas(canvas, padT + padB + rows.length * rowH);
  const labelW = 168, valueW = 92;
  const maxV = Math.max.apply(null, rows.map((r) => r.value));
  const plotX = labelW, plotW = w - labelW - valueW;
  rows.forEach((r, i) => {
    const y = padT + i * rowH;
    const bw = Math.max(2, (r.value / maxV) * plotW);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = SANS;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.label, 4, y + rowH / 2);
    ctx.fillStyle = r.over ? PALETTE.danger : PALETTE.forest;
    ctx.fillRect(plotX, y + 7, bw, 18);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = MONO;
    ctx.textAlign = 'left';
    ctx.fillText(r.valueLabel, plotX + bw + 8, y + rowH / 2);
  });
}

window.AHRT_CHARTS = { drawDonut, drawTargetActual, drawProjectionLine, drawCategoryBars, PALETTE };
