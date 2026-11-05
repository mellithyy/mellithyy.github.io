







(() => {
'use strict';
const K = window.KIT;
const { AR, RM, SEEKING, clamp, lerp, mkRnd, arDigits } = K;

const COL = { ink: '#1b1a17', mute: '#645f56', grid: '#ddd7cb', acc: '#a8641a', accT: '#8f5413', sage: '#6d7b68', stone: '#aca291', pale: '#d6cec0', bg: '#f2efe8' };
const FACE = AR ? '"Beiruti", "Switzer", sans-serif' : '"Switzer", sans-serif';
const fz = z => AR ? Math.round(z * 1.08 * 10) / 10 : z;
const ease = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);


const ad = s => { s = arDigits(s); return AR && s != null ? String(s).replace(/([٠-٩])\s?%/g, '$1٪').replace(/(^|[\s(])-(?=[٠-٩])/g, '$1−') : s; };
const pct = (v, d = 1) => ad((v * 100).toFixed(d) + '%');
let L = {};

function nice(lo, hi, n) {
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : (f <= 2.5 && p >= 10) ? 2.5 : f <= 5 ? 5 : 10) * p;
  const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const ticks = []; for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(dec + 3));
  return { lo: a, hi: b, ticks, dec, step };
}
const fmt = (v, dec) => ad(v.toFixed(dec));

class Chart {
  constructor(cv) { this.cv = cv; this.c = cv.getContext('2d'); this.id = cv.dataset.ch; this.u = 0; this.start = -1; this.done = false; }
  size() {
    const b = this.cv.getBoundingClientRect();
    this.W = Math.max(1, b.width); this.H = Math.max(1, b.height); this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.narrow = this.W < 420;
  }
  X(x) { return AR ? this.W - x : x; }
  font(o) { return `${o.w || 650} ${fz(o.size || 12)}px ${FACE}`; }
  measure(s, o = {}) { this.c.font = this.font(o); return this.c.measureText(ad(s)).width; }
  text(s, x, y, o = {}) {
    const c = this.c; c.font = this.font(o); c.fillStyle = o.color || COL.ink; c.globalAlpha = o.a == null ? 1 : o.a;
    c.direction = AR ? 'rtl' : 'ltr';
    const al = o.al || 'start';
    c.textAlign = al === 'center' ? 'center' : ((al === 'start') !== AR ? 'left' : 'right');
    s = ad(s);
    const w = c.measureText(s).width, lx = al === 'center' ? x - w / 2 : al === 'start' ? x : x - w;
    if (lx < 2) x += 2 - lx; else if (lx + w > this.W - 2) x -= lx + w - (this.W - 2);
    c.textBaseline = 'alphabetic'; c.fillText(s, this.X(x), y); c.globalAlpha = 1;
  }
  frame(yt, o = {}) {
    const tw = Math.max(...yt.ticks.map(v => this.measure((o.yf || (x => fmt(x, yt.dec)))(v))));
    const x0 = (o.padL != null ? o.padL : 0) + Math.ceil(tw + 10), x1 = this.W - (o.padR != null ? o.padR : 6);
    const y0 = o.padT != null ? o.padT : 10, y1 = this.H - (o.padB != null ? o.padB : 24);
    return { x0, x1, y0, y1, yv: v => y1 - (v - yt.lo) / (yt.hi - yt.lo) * (y1 - y0) };
  }
  hline(x0, x1, y, col, w, dash) { const c = this.c; c.save(); c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); c.moveTo(this.X(x0), y); c.lineTo(this.X(x1), y); c.stroke(); c.restore(); }
  vline(x, y0, y1, col, w, dash) { const c = this.c; c.save(); c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); c.moveTo(this.X(x), y0); c.lineTo(this.X(x), y1); c.stroke(); c.restore(); }
  yaxis(F, yt, yf) {
    for (const v of yt.ticks) {
      const y = Math.round(F.yv(v)) + 0.5;
      if (v !== yt.lo) this.hline(F.x0, F.x1, y, COL.grid, 1);
      this.text((yf || (x => fmt(x, yt.dec)))(v), F.x0 - 8, y + 4, { al: 'end' });
    }
    this.vline(F.x0, F.y0 - 2, F.y1, COL.ink, 1.5);
    this.hline(F.x0 - 0.75, F.x1, F.y1, COL.ink, 1.5);
  }
  xticks(F, xt) { for (const [x, s] of xt) { this.vline(x, F.y1, F.y1 + 4, COL.ink, 1.5); const w = this.measure(s) / 2 + 1; this.text(s, clamp(x, w, this.W - w), F.y1 + 18, { al: 'center' }); } }
  path(pts) { const c = this.c; let on = false; c.beginPath(); for (const p of pts) { if (!p) { on = false; continue; } if (on) c.lineTo(this.X(p[0]), p[1]); else { c.moveTo(this.X(p[0]), p[1]); on = true; } } }
  clipTo(F, u) { const c = this.c, w = (F.x1 - F.x0 + 12) * u; c.save(); c.beginPath(); c.rect(AR ? this.W - F.x0 - w + 6 : F.x0 - 6, 0, w, this.H); c.clip(); }
  dot(x, y, r, col, a) { const c = this.c; c.fillStyle = col; c.globalAlpha = a == null ? 1 : a; c.beginPath(); c.arc(this.X(x), y, r, 0, 6.2832); c.fill(); c.globalAlpha = 1; }
  ring(x, y, r, col, w) { const c = this.c; c.strokeStyle = col; c.lineWidth = w || 1.5; c.beginPath(); c.arc(this.X(x), y, r, 0, 6.2832); c.stroke(); }
  bar(x0, x1, y0, y1, col, a) { const c = this.c; c.fillStyle = col; c.globalAlpha = a == null ? 1 : a; const xa = this.X(x0), xb = this.X(x1); c.fillRect(Math.min(xa, xb), Math.min(y0, y1), Math.abs(xb - xa), Math.abs(y1 - y0)); c.globalAlpha = 1; }
  render() {
    const c = this.c; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.globalAlpha = 1;
    c.fillStyle = COL.bg; c.fillRect(0, 0, this.W, this.H);
    const f = DRAW[this.id]; if (f) f(this, this.done ? 1 : this.u);
  }
}


function spread(items, gap, lo, hi) {
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++) if (items[i].ly < items[i - 1].ly + gap) items[i].ly = items[i - 1].ly + gap;
  const over = items.length ? items[items.length - 1].ly - hi : 0;
  if (over > 0) { items[items.length - 1].ly -= over; for (let i = items.length - 2; i >= 0; i--) if (items[i].ly > items[i + 1].ly - gap) items[i].ly = items[i + 1].ly - gap; }
  if (items.length && items[0].ly < lo) { const d = lo - items[0].ly; items.forEach(t => { t.ly += d; }); }
  return items;
}

const DRAW = {};
const yearsAxis = (ch, F, xs, years, every) => ch.xticks(F, years.map((y, i) => [xs(i), String(y)]).filter((_, i) => i % every === 0 || i === years.length - 1));


DRAW.recon = (ch, u) => {
  const R = window.SAMA_RECON; if (!R) return;
  const n = R.weeks.length, yt = { lo: -9, hi: 1, ticks: [-8, -6, -4, -2, 0], dec: 0 };
  const yf = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '%';      
  const F = ch.frame(yt, { padT: 14, padB: 26, padR: 10, yf });
  ch.yaxis(F, yt, yf);
  const xs = i => F.x0 + (i + 0.5) / n * (F.x1 - F.x0), ww = (F.x1 - F.x0) / n;
  
  const ticks = [];
  R.weeks.forEach((w, i) => { const pw = i ? R.weeks[i - 1] : null; if (!pw || w.slice(0, 4) !== pw.slice(0, 4)) ticks.push([xs(i), w.slice(0, 4)]); });
  ch.xticks(F, ticks);
  
  const bi = R.weeks.indexOf('2025-06-29');
  if (bi > 0) {
    ch.vline(xs(bi) - ww / 2, F.y0, F.y1, COL.stone, 1, [3, 3]);
    if (!ch.narrow) ch.text(AR ? 'من يونيو 2025: المدن الستون كلها' : 'From June 2025: all 60 cities', xs(bi) + 6, F.y0 + 12, { size: 11.5, w: 600, color: COL.mute });
  }
  const c = ch.c, rnd = mkRnd(11);
  const shown = ease(u), lastW = Math.floor(shown * n);
  for (let i = 0; i < n; i++) {
    const vals = R.v[i], wa = clamp(shown * n - i, 0, 1);
    if (wa <= 0) { for (let j = 0; j < vals.length; j++) rnd(); continue; }
    c.fillStyle = COL.ink;
    for (let j = 0; j < vals.length; j++) {
      const x = xs(i) + (rnd() - 0.5) * ww * 0.7, y = F.yv(vals[j] / 100);
      c.globalAlpha = 0.28 * wa; c.fillRect(ch.X(x) - 1, y - 1, 2, 2);
    }
  }
  c.globalAlpha = 1;
  
  const miss = R.miss, mi = miss.length ? miss[0][0] : -1;
  const ma = mi >= 0 ? clamp((shown * n - mi) / 3, 0, 1) : 0;
  if (ma > 0) {
    const rm = mkRnd(7);
    let lo = 0, hi = -100;
    for (const [i, v] of miss) { const y = F.yv(lerp(0, v, ease(ma))); lo = Math.min(lo, v); hi = Math.max(hi, v); ch.dot(xs(i) + (rm() - 0.5) * ww * 0.9, y, 2.6, COL.acc, ma); }
    const la = clamp((u - 0.75) / 0.25, 0, 1);
    if (la > 0) {
      const yb = F.yv(hi) - 4, xl = xs(mi) + 12;
      const lines = AR ? ['24 إلى 30 مارس 2024: المدن العشر', 'ينقص التقرير ' + arDigits(Math.abs(hi).toFixed(1)) + '% إلى ' + arDigits(Math.abs(lo).toFixed(1)) + '%']
                       : ['24 to 30 Mar 2024: the ten cities', 'the PDF is ' + Math.abs(hi).toFixed(1) + '% to ' + Math.abs(lo).toFixed(1) + '% short'];
      ch.text(lines[0], xl, F.yv(-4.2), { size: 12.5, w: 700, color: COL.accT, a: la });
      ch.text(lines[1], xl, F.yv(-4.2) + 17, { size: 12, w: 600, color: COL.accT, a: la });
      ch.vline(xs(mi), F.yv(-4.2) + 24, yb, COL.acc, 1, [2, 3]);
    }
  }
  
  if (u > 0.98 && !ch.narrow) ch.text(AR ? '9,816 من 9,836 في حدود التقريب' : '9,816 of 9,836 within rounding', F.x1 - 4, F.yv(0) - 8, { size: 12, w: 650, al: 'end' });
};


DRAW.trend = (ch, u) => {
  const D = window.HEART_DATA; if (!D) return;
  
  const yt = nice(4, 8, 4), Y = D.years, n = Y.length;
  const F = ch.frame(yt, { padT: 16, padR: ch.narrow ? 40 : 46, padB: 26 });
  ch.yaxis(F, yt);
  const xs = i => F.x0 + 8 + i / (n - 1) * (F.x1 - F.x0 - 16);
  yearsAxis(ch, F, xs, Y, ch.narrow ? 7 : 2);
  const e = ease(u);
  ch.clipTo(F, e);
  const c = ch.c;
  for (const [key, col, w] of [['crude', COL.stone, 2], ['adj', COL.ink, 2.6]]) {
    c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round';
    ch.path(D[key].map((v, i) => [xs(i), F.yv(v * 100)])); c.stroke();
    D[key].forEach((v, i) => ch.dot(xs(i), F.yv(v * 100), key === 'adj' ? 3 : 2.4, col));
  }
  c.restore();
  const la = clamp((u - 0.8) / 0.2, 0, 1);
  if (la > 0) {
    const a0 = D.adj[0], a1 = D.adj[n - 1], c0 = D.crude[0], c1 = D.crude[n - 1];
    ch.text(pct(c1), xs(n - 1) + 8, F.yv(c1 * 100) + 4, { size: 12.5, w: 700, color: COL.mute, a: la });
    ch.text(pct(a1), xs(n - 1) + 8, F.yv(a1 * 100) + 4, { size: 12.5, w: 750, color: COL.accT, a: la });
    ch.dot(xs(n - 1), F.yv(a1 * 100), 4.2, COL.acc, la);
    ch.text(pct(a0), xs(0) + 2, F.yv(a0 * 100) - 10, { size: 12.5, w: 700, a: la });
  }
};


DRAW.factors = (ch, u) => {
  const D = window.HEART_DATA; if (!D) return;
  const keys = ['obesity', 'bp', 'diabetes', 'depression', 'inactive', 'smoking'];
  
  const lw = Math.max(...keys.map(k => ch.measure(pct(D.factors[k][D.factors[k].length - 1][1]) + '  ' + (L.fl ? L.fl[k] : k), { size: 12, w: 650 }))) - 40 + 30;   
  const xa = ch.narrow ? 70 : 88, xb = ch.W - lw - (ch.narrow ? 46 : 58), y0 = 26, y1 = ch.H - 14;
  const yv = v => y1 - v / 0.5 * (y1 - y0);
  ch.text('2011', xa, 14, { size: 12.5, w: 750, al: 'center' }); ch.text('2025', xb, 14, { size: 12.5, w: 750, al: 'center' });
  ch.vline(xa, y0 - 4, y1, COL.grid, 1); ch.vline(xb, y0 - 4, y1, COL.grid, 1);
  const rows = keys.map(k => { const s = D.factors[k], a = s[0][1], b = s[s.length - 1][1]; return { k, a, b, up: b > a }; });
  const e = ease(u), c = ch.c;
  rows.forEach((r, i) => {
    const col = r.up ? COL.ink : COL.acc, t = clamp(e * 1.25 - i * 0.05, 0, 1);
    if (t <= 0) return;
    const xe = lerp(xa, xb, t), ye = lerp(yv(r.a), yv(r.b), t);
    c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); c.moveTo(ch.X(xa), yv(r.a)); c.lineTo(ch.X(xe), ye); c.stroke();
    ch.dot(xa, yv(r.a), 3.4, col); ch.dot(xe, ye, 3.4, col);
  });
  const la = clamp((u - 0.7) / 0.3, 0, 1);
  if (la <= 0) return;
  
  
  const leader = (x0, y0_, x1, y1_, col) => { c.globalAlpha = la * 0.55; c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
    c.moveTo(ch.X(x0), y0_); c.lineTo(ch.X(x0 + (x1 - x0) * 0.45), y0_); c.lineTo(ch.X(x0 + (x1 - x0) * 0.8), y1_); c.lineTo(ch.X(x1), y1_); c.stroke(); c.globalAlpha = 1; };
  const L1 = spread(rows.map(r => ({ r, y: yv(r.a), ly: yv(r.a) })), 22, y0, y1);
  L1.forEach(t => { const col = t.r.up ? COL.ink : COL.accT; leader(xa - 5, t.y, xa - 30, t.ly, col);
    ch.text(pct(t.r.a), xa - 34, t.ly + 4, { size: 12, w: 650, al: 'end', a: la, color: col }); });
  
  const L2 = rows.map(r => ({ r, y: yv(r.b) })).sort((p, q) => p.y - q.y).map((t, i, a) => ({ ...t, ly: y0 + 6 + i * (y1 - y0 - 12) / Math.max(1, a.length - 1) }));
  L2.forEach(t => { const col = t.r.up ? COL.ink : COL.accT; leader(xb + 5, t.y, xb + 30, t.ly, col);
    ch.text(pct(t.r.b) + '  ' + (L.fl ? L.fl[t.r.k] : t.r.k), xb + 34, t.ly + 4, { size: 12, w: 650, a: la, color: col }); });
};


DRAW.odds = (ch, u) => {
  const D = window.HEART_DATA; if (!D) return;
  const keys = Object.keys(D.or).map(k => { const s = D.or[k]; return { k, a: s[0][1], b: s[s.length - 1][1] }; }).sort((p, q) => q.b - p.b);
  const ease_ = ease(u);
  const lab = Math.max(...keys.map(r => ch.measure(L.fl ? L.fl[r.k] : r.k, { size: 12.5 }))) + 14;
  const xt = { lo: 1, hi: 5, ticks: [1, 2, 3, 4, 5], dec: 0 };
  const x0 = lab, x1 = ch.W - 12, y0 = 8, y1 = ch.H - 24, rh = (y1 - y0) / keys.length;
  const xv = v => x0 + (v - xt.lo) / (xt.hi - xt.lo) * (x1 - x0);
  for (const v of xt.ticks) { ch.vline(xv(v), y0, y1, v === 1 ? COL.ink : COL.grid, v === 1 ? 1.5 : 1); ch.text(fmt(v, 0), xv(v), y1 + 17, { al: 'center' }); }
  const big = keys.reduce((m, r) => (r.b / r.a < m.b / m.a ? r : m), keys[0]);       
  keys.forEach((r, i) => {
    const y = y0 + (i + 0.5) * rh, t = clamp(ease_ * 1.3 - i * 0.04, 0, 1), col = r === big ? COL.acc : COL.ink;
    ch.text(L.fl ? L.fl[r.k] : r.k, x0 - 12, y + 4, { size: 12.5, w: 650, al: 'end', color: r === big ? COL.accT : COL.ink });
    if (t <= 0) return;
    const xb = lerp(xv(r.a), xv(r.b), t);
    ch.hline(Math.min(xv(r.a), xb), Math.max(xv(r.a), xb), y, r === big ? COL.acc : COL.stone, 2);
    ch.dot(xv(r.a), y, 4, COL.stone); ch.dot(xb, y, 4.6, col);
    if (t > 0.98 && !ch.narrow) ch.text(fmt(r.b, 1), xb + (r.b >= r.a ? 10 : -10), y + 4, { size: 11.5, w: 650, al: r.b >= r.a ? 'start' : 'end', color: col === COL.acc ? COL.accT : col });
  });
};


DRAW.unseen = (ch, u) => {
  const D = window.HEART_DATA; if (!D) return;
  const rows = D.unseen, n = rows.length, yt = { lo: 0.8, hi: 0.9, ticks: [0.8, 0.82, 0.84, 0.86, 0.88, 0.9], dec: 2 };
  const F = ch.frame(yt, { padT: 16, padB: 26, padR: 10 });
  ch.yaxis(F, yt);
  const xs = i => F.x0 + (i + 0.5) / n * (F.x1 - F.x0);
  ch.xticks(F, rows.map((r, i) => [xs(i), ch.narrow && i % 2 && i !== n - 1 ? '' : String(r[0])]).filter(t => t[1]));
  
  
  
  const lo = Math.min(...rows.map(r => r[1])), hi = Math.max(...rows.map(r => r[1]));
  const e = ease(u);
  ch.bar(F.x0, F.x1, F.yv(hi), F.yv(lo), COL.sage, 0.13 * e);
  ch.vline((xs(n - 2) + xs(n - 1)) / 2, F.y0 + 4, F.y1, COL.grid, 1, [3, 3]);
  rows.forEach((r, i) => {
    const t = clamp(e * 1.4 - i * 0.05, 0, 1); if (t <= 0) return;
    const last = i === n - 1, y = lerp(F.y1, F.yv(r[1]), ease(t));
    ch.vline(xs(i), y, F.y1, last ? COL.stone : COL.pale, 1.5);
    ch.dot(xs(i), y, last ? 5 : 4.2, last ? COL.stone : COL.ink);
    if (last) ch.ring(xs(i), y, 7.5, COL.stone, 1.25);
    if (t > 0.98) ch.text(fmt(r[1], 3), xs(i), y - (last ? 13 : 10), { size: ch.narrow ? 10.5 : 11.5, w: 650, al: 'center', color: last ? COL.mute : COL.ink });
  });
  const na = clamp((u - 0.8) / 0.2, 0, 1);
  if (na > 0) {
    const note = AR ? 'النموذج الكامل يسجّل 0.851 على 2025' : 'the full model scores 0.851 on 2025';
    ch.text(note, xs(n - 1) + 8, F.yv(0.876), { size: ch.narrow ? 11 : 11.5, w: 600, al: 'end', color: COL.mute, a: na });
  }
};


DRAW.calib = (ch, u) => {
  const D = window.HEART_DATA; if (!D) return;
  const P = D.calib.predicted, O = D.calib.observed, yt = { lo: 0, hi: 0.5, ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5], dec: 0 };
  const F = ch.frame(yt, { padT: 12, padB: 26, padR: 14, yf: v => arDigits(String(Math.round(v * 100))) });
  ch.yaxis(F, yt, v => arDigits(String(Math.round(v * 100))));
  const xv = v => F.x0 + v / 0.5 * (F.x1 - F.x0);
  ch.xticks(F, yt.ticks.map(v => [xv(v), arDigits(String(Math.round(v * 100)))]));
  const c = ch.c; c.save(); c.strokeStyle = COL.stone; c.lineWidth = 1.5; c.setLineDash([5, 4]);
  c.beginPath(); c.moveTo(ch.X(xv(0)), F.yv(0)); c.lineTo(ch.X(xv(0.5)), F.yv(0.5)); c.stroke(); c.restore();
  const e = ease(u);
  c.strokeStyle = COL.ink; c.lineWidth = 1.4;
  const k = Math.floor(e * P.length);
  ch.path(P.slice(0, Math.max(1, k)).map((p, i) => [xv(p), F.yv(O[i])])); c.stroke();
  P.forEach((p, i) => { const t = clamp(e * P.length - i, 0, 1); if (t > 0) ch.dot(xv(p), F.yv(O[i]), 3.6, COL.ink, t); });
  
  const j = P.reduce((b, p, i) => (Math.abs(p - 0.2) < Math.abs(P[b] - 0.2) ? i : b), 0), la = clamp((u - 0.85) / 0.15, 0, 1);
  if (la > 0) {
    ch.ring(xv(P[j]), F.yv(O[j]), 8, COL.acc, 1.8);
    const s = AR ? 'قال ' + pct(P[j]) + '، والواقع ' + pct(O[j]) : 'said ' + pct(P[j]) + ', reality ' + pct(O[j]);
    ch.text(s, xv(P[j]) + 14, F.yv(O[j]) + 22, { size: 12, w: 700, color: COL.accT, a: la });
  }
};


DRAW.whatif = (ch, u) => {
  const D = window.HEART_DATA; if (!D || !L.wi) return;
  const base = D.whatif.base, rows = D.whatif.rows.slice().sort((a, b) => a[1] - b[1]);
  const lab = Math.min(ch.W * 0.46, Math.max(...rows.map(r => ch.measure(L.wi[r[0]], { size: 12.5 }))) + 16);
  const xt = nice(0, Math.max(...rows.map(r => r[1])) * 100, 4);
  const x0 = lab, x1 = ch.W - (ch.narrow ? 40 : 48), y0 = 22, y1 = ch.H - 24, rh = (y1 - y0) / rows.length;
  const xv = v => x0 + v / xt.hi * (x1 - x0);
  for (const v of xt.ticks) { ch.vline(xv(v), y0, y1, v === 0 ? COL.ink : COL.grid, v === 0 ? 1.5 : 1); ch.text(fmt(v, 0), xv(v), y1 + 17, { al: 'center' }); }
  const e = ease(u);
  rows.forEach(([k, v], i) => {
    const y = y0 + (i + 0.5) * rh, wrong = k === 'exercise', up = v > base;
    const col = wrong ? COL.acc : up ? COL.stone : COL.ink, t = clamp(e * 1.3 - i * 0.05, 0, 1);
    ch.text(L.wi[k], x0 - 12, y + 4, { size: 12.5, w: 650, al: 'end', color: wrong ? COL.accT : COL.ink });
    if (t <= 0) return;
    const xe = lerp(xv(base * 100), xv(v * 100), t), h = Math.min(16, rh * 0.56);
    ch.bar(xv(base * 100), xe, y - h / 2, y + h / 2, col);
    
    if (t > 0.98) ch.text(pct(v), up ? xe + 6 : xv(base * 100) + 6, y + 4, { size: 11.5, w: 700, al: 'start', color: col === COL.stone ? COL.mute : col === COL.acc ? COL.accT : col });
  });
  const xb = xv(base * 100);
  ch.vline(xb, y0 - 6, y1, COL.ink, 1.5, [4, 3]);
  ch.text((L.wi.base || 'Now') + ' ' + pct(base), xb, 13, { size: 12, w: 750, al: 'center' });
};


DRAW.leak = (ch, u) => {
  const D = window.HEART_DATA; if (!D) return;
  const rows = D.audit, yt = { lo: 0, hi: 1, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], dec: 1 };
  const F = ch.frame(yt, { padT: 18, padB: ch.narrow ? 40 : 30, padR: 8 });
  ch.yaxis(F, yt);
  const n = rows.length, bw = Math.min(90, (F.x1 - F.x0) / n * 0.5), xs = i => F.x0 + (i + 0.5) / n * (F.x1 - F.x0);
  const cols = [COL.stone, COL.acc, COL.ink], e = ease(u);
  rows.forEach((r, i) => {
    const t = clamp(e * 1.25 - i * 0.12, 0, 1), y = lerp(F.y1, F.yv(r[1]), ease(t));
    ch.bar(xs(i) - bw / 2, xs(i) + bw / 2, y, F.y1, cols[i]);
    if (t > 0.98) ch.text(fmt(r[1], 3), xs(i), y - 8, { size: 13, w: 750, al: 'center', color: cols[i] === COL.stone ? COL.mute : cols[i] === COL.acc ? COL.accT : cols[i] });
    const s = (L.lk || [])[i] || ''; const parts = ch.narrow ? s.split(/[،,] /) : [s];
    parts.forEach((p, j) => ch.text(p, xs(i), F.y1 + 18 + j * 15, { size: ch.narrow ? 11 : 12, w: 600, al: 'center', color: COL.mute }));
  });
};



const XRUN = [1.2, 2.9, 10.3, 6.5];                   
const XOLD = 360;                                     
const nf = v => ad(Math.round(v).toLocaleString('en-US'));
DRAW.xrun = (ch, u) => {
  const X = L.x; if (!X) return;
  const c = ch.c, tot = XRUN.reduce((a, b) => a + b, 0), nar = ch.narrow;
  
  
  const lab = Math.max(ch.measure(X.old, { size: 12.5, w: 700 }), ch.measure(X.tool, { size: 12.5, w: 700 })) + 14;
  const x0 = lab, x1 = ch.W - 8, xv = m => x0 + m / XOLD * (x1 - x0);
  const yA = 8, yB = 40, bh = 20;
  const e1 = ease(u / 0.35), e2 = ease((u - 0.3) / 0.25), e3 = ease((u - 0.5) / 0.15), e4 = ease((u - 0.6) / 0.4);
  ch.text(X.old, 0, yA + 15, { size: 12.5, w: 700, al: 'start', color: COL.mute });
  ch.text(X.tool, 0, yB + 15, { size: 12.5, w: 700, al: 'start' });
  
  c.save(); c.strokeStyle = COL.stone; c.lineWidth = 1.5; c.setLineDash([5, 4]);
  const ow = (x1 - x0) * e1; if (ow > 1) c.strokeRect(AR ? ch.W - x0 - ow : x0, yA + 0.5, ow, bh); c.restore();
  if (e1 > 0.95) ch.text(X.old_v, x1 - 10, yA + 15, { size: 12.5, w: 700, al: 'end', color: COL.mute });
  
  let acc = 0;
  XRUN.forEach((m, i) => { const a = xv(acc), b = xv(acc + m * e2); if (b > a) ch.bar(a, b, yB, yB + bh, i % 2 ? '#5a554c' : COL.ink); acc += m; });
  if (e2 > 0.95) ch.text(X.tool_v, xv(tot) + 8, yB + 15, { size: 12.5, w: 750, color: COL.accT });
  
  const ty = yB + bh + 16;
  for (let h = 0; h <= 6; h++) {
    if (nar && h % 2) continue;
    ch.vline(xv(h * 60), yB + bh + 3, yB + bh + 7, COL.mute, 1);
    ch.text(h ? ad(h + ' ' + X.h) : X.h0, xv(h * 60), ty, { size: 11, w: 600, al: 'center', color: COL.mute });
  }
  
  const pY = ty + 12, b0 = ch.H - 22, top = pY + 24;
  if (e3 > 0) {
    c.save(); c.globalAlpha = e3; c.strokeStyle = COL.stone; c.lineWidth = 1; c.setLineDash([2, 3]);
    c.beginPath(); c.moveTo(ch.X(xv(0)), yB + bh + 1); c.lineTo(ch.X(x0), pY); c.moveTo(ch.X(xv(tot)), yB + bh + 1); c.lineTo(ch.X(x1), pY); c.stroke(); c.restore();
    ch.hline(x0, x1, pY, COL.grid, 1);
    ch.text(X.zoom, x0 + 2, pY + 15, { size: 11.5, w: 650, color: COL.mute, a: e3 });
  }
  
  const n = XRUN.length, cw = (x1 - x0) / n, bw = Math.min(64, cw * 0.46), yv = m => b0 - m / 11 * (b0 - top - 18);
  ch.hline(x0, x1, b0, COL.ink, 1.5);
  XRUN.forEach((m, i) => {
    const cx = x0 + (i + 0.5) * cw, t = clamp(e4 * 1.3 - i * 0.1, 0, 1), y = lerp(b0, yv(m), ease(t));
    ch.text(X.tech[i], cx, b0 + 16, { size: 12, w: 650, al: 'center' });
    if (t <= 0) return;
    ch.bar(cx - bw / 2, cx + bw / 2, y, b0, i % 2 ? '#5a554c' : COL.ink);
    if (t > 0.98) ch.text(ad(m.toFixed(1)) + ' ' + X.min, cx, y - 7, { size: 12, w: 700, al: 'center' });
  });
};

const XSUM = [['MRBTS', 640, 0, 0], ['LNCEL', 86, 12, 0], ['BTS', 41, 0, 6], ['WCEL', 23, 4, 0], ['ADCE', 9, 0, 14], ['BSC', 2, 0, 0]];
DRAW.xsum = (ch, u) => {
  const X = L.x; if (!X) return;
  const lab = Math.max(...XSUM.map(r => ch.measure(r[0], { size: 12, w: 650 }))) + 12;
  const xt = nice(0, 700, ch.narrow ? 3 : 4), x0 = lab, x1 = ch.W - 40, y0 = 6, y1 = ch.H - 40;
  const xv = v => x0 + v / xt.hi * (x1 - x0), rh = (y1 - y0) / XSUM.length, e = ease(u);
  for (const v of xt.ticks) { ch.vline(xv(v), y0, y1, v === 0 ? COL.ink : COL.grid, v === 0 ? 1.5 : 1); ch.text(nf(v), xv(v), y1 + 16, { size: 11, al: 'center', color: COL.mute }); }
  const cols = [COL.ink, COL.stone, COL.pale];
  XSUM.forEach((r, i) => {
    const y = y0 + (i + 0.5) * rh, h = Math.min(16, rh * 0.56), t = ease(clamp(e * 1.3 - i * 0.06, 0, 1));
    ch.text(r[0], x0 - 10, y + 4, { size: 12, w: 650, al: 'end' });
    let a = 0;
    for (let k = 1; k <= 3; k++) { if (!r[k]) continue; ch.bar(xv(a), xv(a + r[k] * t), y - h / 2, y + h / 2, cols[k - 1]); a += r[k] * t; }
    if (t > 0.98) { const sum = r[1] + r[2] + r[3]; ch.text(nf(sum), xv(sum) + 6, y + 4, { size: 11.5, w: 700, color: i ? COL.ink : COL.accT }); }
  });
  
  const la = clamp((u - 0.85) / 0.15, 0, 1);
  if (la > 0) {
    const y = y0 + 0.5 * rh;
    ch.bar(xv(640) - 3, xv(640), y - 9, y + 9, COL.acc, la);
    ch.text(AR ? 'كلها في حقل واحد' : 'all in one field', xv(640) - 10, y + 4, { size: 11.5, w: 700, al: 'end', color: COL.bg, a: la });
  }
  ch.text(X.made, 0, ch.H - 4, { size: 11, w: 600, al: 'start', color: COL.mute });
};

const XFIX = [[356, 3], [51, 1], [12260, 1273], [6952, 509], [12645, 4166], [55401, 3917]];   
DRAW.xfix = (ch, u) => {
  const X = L.x; if (!X) return;
  const names = X.fix, nar = ch.narrow;
  const lab = Math.max(...names.map(s => ch.measure(s, { size: 12.5, w: 650 }))) + 18;
  const x0 = lab + 6, x1 = ch.W - (nar ? 18 : 40), y0 = 10, y1 = ch.H - 28, lo = 0, hi = 5;
  const xv = v => x0 + (Math.log10(Math.max(1, v)) - lo) / (hi - lo) * (x1 - x0), rh = (y1 - y0) / XFIX.length;
  
  for (let k = lo; k <= hi; k++) {
    ch.vline(xv(10 ** k), y0, y1, k === lo ? COL.ink : COL.grid, k === lo ? 1.5 : 1);
    if (nar && k % 2) continue;
    ch.text(nf(10 ** k), xv(10 ** k), y1 + 17, { size: 11, w: 600, al: 'center', color: COL.mute });
  }
  const e = ease(u), c = ch.c;
  XFIX.forEach(([a, b], i) => {
    const y = y0 + (i + 0.5) * rh, t = ease(clamp(e * 1.35 - i * 0.07, 0, 1));
    ch.text(names[i], x0 - 14, y + 4, { size: 12.5, w: 650, al: 'end' });
    const xa = xv(a), xb = lerp(xa, xv(b), t);
    if (t > 0) { c.strokeStyle = COL.pale; c.lineWidth = 3; c.beginPath(); c.moveTo(ch.X(xa), y); c.lineTo(ch.X(xb), y); c.stroke(); }
    ch.dot(xa, y, 5, COL.stone);
    ch.text(nf(a), xa + 10, y + 4, { size: 11.5, w: 650, color: COL.mute });
    if (t > 0) ch.dot(xb, y, 6, COL.acc);
    
    if (t > 0.98) { const tight = xv(b) - x0 < 30; ch.text(nf(b), tight ? xb + 11 : xb - 11, tight ? y - 9 : y + 4, { size: 12.5, w: 750, al: tight ? 'start' : 'end', color: COL.accT }); }
  });
  

};





const EV_NOW = [99.31, 99.24, 99.12, 98.94, 97.12, 98.61, 99.02, 99.21, 99.33, 99.41, 99.44];
const EV_REF = [99.36, 99.4, 99.38, 99.42, 99.48, 99.45, 99.43, 99.47, 99.5, 99.52, 99.51];
DRAW.evnight = (ch, u) => {
  const E = L.e; if (!E) return;
  const hrs = E.hours, n = hrs.length, yt = nice(96.5, 100, 4);
  const F = ch.frame(yt, { padT: 14, padB: 26, padR: ch.narrow ? 10 : 18, yf: v => fmt(v, 1) });
  const xs = i => F.x0 + 10 + i / (n - 1) * (F.x1 - F.x0 - 20);
  ch.yaxis(F, yt, v => fmt(v, 1));
  ch.xticks(F, hrs.map((h, i) => [xs(i), h]).filter((_, i) => !ch.narrow || i % 2 === 0));
  const c = ch.c;
  
  c.save(); c.strokeStyle = COL.mute; c.lineWidth = 1.6; c.setLineDash([5, 4]);
  ch.path(EV_REF.map((v, i) => [xs(i), F.yv(v)])); c.stroke(); c.restore();
  
  ch.clipTo(F, ease(u));
  c.strokeStyle = COL.ink; c.lineWidth = 2.2; c.lineJoin = 'round';
  ch.path(EV_NOW.map((v, i) => [xs(i), F.yv(v)])); c.stroke();
  EV_NOW.forEach((v, i) => { if (i !== 4) ch.dot(xs(i), F.yv(v), 3, COL.ink); });
  c.restore();
  
  const la = clamp((u - 0.55) / 0.3, 0, 1);
  if (la > 0) {
    const x = xs(4), y = F.yv(EV_NOW[4]), yr = F.yv(EV_REF[4]);
    ch.vline(x, yr + 4, y - 7, COL.acc, 1.5, [2, 2]);
    ch.dot(x, y, 5.5, COL.acc, la); ch.ring(x, y, 9, COL.acc, 1.4);
    const s1 = E.flag, s2 = E.flag2, w = Math.max(ch.measure(s1, { size: 12.5, w: 750 }), ch.measure(s2, { size: 11.5, w: 600 }));
    const tx = x + 16 + w > F.x1 ? x - 16 - w : x + 16;
    ch.text(s1, tx, y + 4, { size: 12.5, w: 750, color: COL.accT, a: la });
    ch.text(s2, tx, y + 20, { size: 11.5, w: 600, color: COL.mute, a: la });
  }
};

const EV_LATE = [[1, 7], [3, 5]];
DRAW.evhours = (ch, u) => {
  const E = L.e; if (!E) return;
  const regs = E.regs, hrs = E.hours, n = hrs.length, nar = ch.narrow;
  const lab = Math.max(...regs.map(r => ch.measure(r, { size: 12, w: 650 }))) + 14;
  const x0 = lab, x1 = ch.W - 4, y0 = 6, y1 = ch.H - 30, cw = (x1 - x0) / n, rh = (y1 - y0) / regs.length;
  const s = Math.min(cw, rh) * 0.62, e = u * (n + 1.5);
  regs.forEach((r, j) => ch.text(r, 0, y0 + (j + 0.5) * rh + 4, { size: 12, w: 650 }));
  hrs.forEach((h, i) => { if (!nar || i % 2 === 0) ch.text(h, x0 + (i + 0.5) * cw, y1 + 18, { size: 11, w: 600, al: 'center', color: COL.mute }); });
  for (let i = 0; i < n; i++) for (let j = 0; j < regs.length; j++) {
    const cx = x0 + (i + 0.5) * cw, cy = y0 + (j + 0.5) * rh, t = clamp(e - i - j * 0.12, 0, 1);
    ch.bar(cx - s / 2, cx + s / 2, cy - s / 2, cy + s / 2, COL.grid);
    if (t <= 0) continue;
    const late = EV_LATE.some(([a, b]) => a === j && b === i);
    const k = s * (0.4 + 0.6 * ease(t));
    ch.bar(cx - k / 2, cx + k / 2, cy - k / 2, cy + k / 2, late ? COL.stone : COL.ink);
  }
};

const EV_HAND = [3, 2, 16, 4], EV_TOOL = 0.5;
DRAW.evmin = (ch, u) => {
  const E = L.e; if (!E) return;
  const nar = ch.narrow, tot = EV_HAND.reduce((a, b) => a + b, 0);
  const lab = Math.max(ch.measure(E.hand, { size: 12.5, w: 700 }), ch.measure(E.tool, { size: 12.5, w: 700 })) + 16;
  const x0 = lab, x1 = ch.W - (nar ? 14 : 70), xv = m => x0 + m / 25 * (x1 - x0);
  const yA = 18, bh = nar ? 30 : 38, yB = yA + bh + (nar ? 52 : 46), ax = yB + bh + 16;
  const e1 = ease(u / 0.6), e2 = ease((u - 0.55) / 0.3), e3 = clamp((u - 0.8) / 0.2, 0, 1);
  ch.text(E.hand, 0, yA + bh / 2 + 5, { size: 12.5, w: 700, color: COL.mute });
  ch.text(E.tool, 0, yB + bh / 2 + 5, { size: 12.5, w: 700 });
  
  let a = 0;
  EV_HAND.forEach((m, i) => {
    const b = Math.min(a + m, tot * e1);
    if (b > a) ch.bar(xv(a) + (i ? 1 : 0), xv(b), yA, yA + bh, i % 2 ? COL.pale : COL.stone);
    const w = xv(a + m) - xv(a), s = E.parts[i];
    if (e1 > 0.98 && !nar && ch.measure(s, { size: 11, w: 600 }) < w - 8) ch.text(s, xv(a) + 6, yA + bh + 15, { size: 11, w: 600, color: COL.mute });
    a += m;
  });
  if (e1 > 0.98) ch.text(ad(String(tot)) + ' ' + E.min, xv(tot) + 8, yA + bh / 2 + 5, { size: 13, w: 750, color: COL.mute });
  
  if (e2 > 0) ch.bar(x0, xv(EV_TOOL * e2), yB, yB + bh, COL.ink);
  if (e2 > 0.95) ch.text(E.tool_v, xv(EV_TOOL) + 10, yB + bh / 2 + 5, { size: 13, w: 750 });
  
  for (let m = 0; m <= 25; m += 5) {
    ch.vline(xv(m), ax - 6, ax - 2, COL.mute, 1);
    if (!nar || m % 10 === 0) ch.text(ad(String(m)), xv(m), ax + 12, { size: 11, w: 600, al: 'center', color: COL.mute });
  }
  ch.hline(x0, x1, ax - 4, COL.grid, 1);
  
  if (e3 > 0) {
    const big = nar ? 30 : 42, s = ad('−98%'), x = nar ? x1 - 4 : ch.W - 4;
    ch.text(s, x, yB + bh / 2 + big * 0.36, { size: big, w: 750, al: 'end', color: COL.accT, a: e3 });
  }
};




const DRG_DUSK = '#8f897d';

const DRG_DECKS = [[8, 4, 3, 2, 3, 0], [5, 6, 2, 0, 2, 1], [4, 2, 2, 1, 1, 0], [3, 0, 1, 1, 1, 0]];
DRAW.drgdeck = (ch, u) => {
  const E = L.d; if (!E) return;
  const nar = ch.narrow, cols = [COL.ink, COL.sage, COL.stone, COL.pale, DRG_DUSK, COL.acc];
  const lab = Math.max(...E.decks.map(s => ch.measure(s, { size: 12.5, w: 700 }))) + 14;
  const endW = Math.max(ch.measure('20 ' + E.charts, { size: 12, w: 750 }), 40) + (nar ? 4 : 14);
  const x0 = nar ? 0 : lab, x1 = ch.W - endW, top = 8, axH = 22;
  const n = DRG_DECKS.length, rowH = (ch.H - top - axH) / n, bh = Math.min(nar ? 18 : 26, rowH * (nar ? 0.38 : 0.52));
  const xv = v => x0 + v / 20 * (x1 - x0);
  for (let v = 0; v <= 20; v += 5) {
    if (v) ch.vline(xv(v), top, ch.H - axH, COL.grid, 1);
    ch.text(ad(String(v)), xv(v), ch.H - 6, { size: 11, w: 600, al: 'center', color: COL.mute });
  }
  DRG_DECKS.forEach((d, j) => {
    const yc = top + (j + 0.5) * rowH + (nar ? 8 : 0), y0 = yc - bh / 2, e = ease((u - j * 0.12) / 0.55);
    if (nar) ch.text(E.decks[j], 0, y0 - 7, { size: 12, w: 700 });
    else ch.text(E.decks[j], 0, yc + 4.5, { size: 12.5, w: 700 });
    const tot = d.reduce((a, b) => a + b, 0);
    let a = 0;
    d.forEach((v, k) => {
      if (!v) return;
      const b = Math.min(a + v, tot * e);
      if (b > a) ch.bar(xv(a) + (a ? 1 : 0), xv(b), y0, y0 + bh, cols[k]);
      a += v;
    });
    if (e > 0.98) {
      ch.text(ad(String(tot)) + ' ' + E.charts, xv(tot) + 8, yc + 4.5, { size: 12, w: 750 });
      if (d[5]) ch.text(E.warn, xv(tot) + 8, yc + 4.5 + 15, { size: 11, w: 700, color: COL.accT });
    }
  });
};

DRAW.drgtypes = (ch, u) => {
  const E = L.d; if (!E) return;
  const nar = ch.narrow, cols = nar ? 2 : 5, rows = 10 / cols, c = ch.c;
  const gx = nar ? 14 : 18, gy = nar ? 12 : 14, labH = 30;
  const cw = (ch.W - gx * (cols - 1)) / cols, chh = (ch.H - gy * (rows - 1)) / rows;
  for (let i = 0; i < 10; i++) {
    const cx = (i % cols) * (cw + gx), cy = Math.floor(i / cols) * (chh + gy), e = ease((u - i * 0.06) / 0.45);
    const b = { x: cx + 8, y: cy + 8, w: cw - 16, h: chh - labH - 12 };
    ch.bar(cx, cx + cw, cy, cy + chh - labH + 2, '#e8e4da');
    
    let s = E.lay[i]; while (s.length > 3 && ch.measure(s, { size: 12, w: 650 }) > cw - 4) s = s.slice(0, -2) + '…';
    ch.text(s, cx + 2, cy + chh - 9, { size: 12, w: 650, color: COL.ink });
    if (e <= 0) continue;
    const X = x => ch.X(x), pts = (vals, lo, hi) => vals.map((v, k) => [b.x + b.w * k / (vals.length - 1), b.y + b.h - (v - lo) / (hi - lo) * b.h]);
    const line = (p, col, w, dash) => { c.save(); c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.lineJoin = 'round'; ch.path(p); c.stroke(); c.restore(); };
    const axes = (l, r) => { ch.hline(b.x, b.x + b.w, b.y + b.h, COL.ink, 1); if (l) ch.vline(b.x, b.y, b.y + b.h, COL.ink, 1); if (r) ch.vline(b.x + b.w, b.y, b.y + b.h, COL.ink, 1); };
    ch.clipTo({ x0: b.x + 4, x1: b.x + b.w + 6 }, e);   
    if (i === 0) { axes(1); line(pts([0.5, 0.56, 0.52, 0.62, 0.6, 0.7, 0.66, 0.74, 0.72, 0.8], 0.4, 0.9), COL.ink, 2); }
    else if (i === 1) { axes(1); line(pts([0.2, 0.12, 0.1, 0.18, 0.42, 0.58, 0.62, 0.66, 0.7, 0.84, 0.9, 0.6, 0.3], 0, 1), COL.mute, 1.4, [4, 3]); line(pts([0.18, 0.1, 0.09, 0.2, 0.5, 0.66, 0.7, 0.72, 0.78, 0.92, 0.98, 0.7, 0.34], 0, 1), COL.ink, 2); }
    else if (i === 2) { axes(1); line(pts([0.3, 0.34, 0.32, 0.4, 0.38, 0.44, 0.42], 0, 1), COL.stone, 1.8); line(pts([0.5, 0.52, 0.56, 0.54, 0.6, 0.58, 0.64], 0, 1), COL.sage, 1.8); line(pts([0.72, 0.76, 0.74, 0.8, 0.78, 0.84, 0.86], 0, 1), COL.ink, 2); }
    else if (i === 3 || i === 7) {
      axes(1, 1);
      if (i === 3) { const p = pts([0.3, 0.36, 0.34, 0.42, 0.46, 0.44, 0.52, 0.56], 0, 0.8); c.fillStyle = COL.pale; c.beginPath(); c.moveTo(X(p[0][0]), b.y + b.h); p.forEach(([x, y]) => c.lineTo(X(x), y)); c.lineTo(X(p[p.length - 1][0]), b.y + b.h); c.closePath(); c.fill(); }
      else line(pts([0.3, 0.36, 0.34, 0.42, 0.46, 0.44, 0.52, 0.56], 0, 0.8), COL.sage, 1.8);
      line(pts([0.6, 0.55, 0.62, 0.52, 0.57, 0.48, 0.5, 0.44], 0.2, 0.8), COL.ink, 2);
      for (let k = 1; k <= 3; k++) { const y = b.y + b.h * (1 - k / 4); ch.hline(b.x - 3, b.x, y, COL.ink, 1); ch.hline(b.x + b.w, b.x + b.w + 3, y, COL.ink, 1); }
    }
    else if (i === 4) { const r = Math.min(b.w, b.h) * 0.45, x = b.x + b.w / 2, y = b.y + b.h / 2, lw = r * 0.34; c.lineWidth = lw; c.strokeStyle = COL.pale; c.beginPath(); c.arc(X(x), y, Math.max(0.5, r - lw / 2), 0, 6.2832); c.stroke(); c.strokeStyle = COL.ink; c.beginPath(); c.arc(X(x), y, Math.max(0.5, r - lw / 2), -Math.PI / 2, -Math.PI / 2 + (AR ? -1 : 1) * 6.2832 * 0.8, AR); c.stroke(); }
    else if (i === 5) { const S = [[0.2, 0.36], [0.18, 0.34], [0.17, 0.33], [0.15, 0.31], [0.14, 0.3], [0.13, 0.28]], bw = b.w / S.length; axes(0); S.forEach(([p1, p2], k) => { const x = b.x + k * bw + bw * 0.15, w = bw * 0.7, y1 = b.y + b.h; ch.bar(x, x + w, y1 - b.h * p1, y1, COL.stone); ch.bar(x, x + w, y1 - b.h * p2, y1 - b.h * p1, COL.pale); ch.bar(x, x + w, b.y, y1 - b.h * p2, COL.ink); }); }
    else if (i === 6) { ch.bar(b.x, b.x + b.w, b.y + b.h * 0.12, b.y + b.h * 0.88, COL.bg); [0.3, 0.5, 0.7].forEach((f, k) => ch.bar(b.x + 8, b.x + 8 + (b.w - 16) * (k === 2 ? 0.55 : 0.9), b.y + b.h * f - 1.5, b.y + b.h * f + 1.5, k ? COL.stone : COL.ink)); }
    else if (i === 8 || i === 9) {
      const nr = i === 8 ? 4 : 1, rh = Math.min(b.h / (nr + 1), 16), y0 = b.y + (b.h - rh * (nr + 1)) / 2;
      ch.bar(b.x, b.x + b.w, y0, y0 + rh, COL.ink);
      for (let r = 0; r < nr; r++) { const y = y0 + rh * (r + 1); ch.hline(b.x, b.x + b.w, y + rh, COL.grid, 1); for (let k = 0; k < 3; k++) ch.bar(b.x + 6 + k * b.w / 3, b.x + 6 + k * b.w / 3 + b.w * 0.18, y + rh / 2 - 1.5, y + rh / 2 + 1.5, COL.stone); }
    }
    c.restore();
  }
};

function drgWrap(ch, s, maxW, o) {
  const words = s.split(' '), out = []; let ln = '';
  for (const w of words) { const tr = ln ? ln + ' ' + w : w; if (ch.measure(tr, o) > maxW && ln) { out.push(ln); ln = w; } else ln = tr; }
  if (ln) out.push(ln); return out;
}
DRAW.drgflow = (ch, u) => {
  const E = L.d; if (!E) return;
  const nar = ch.narrow, c = ch.c, fs = nar ? 12 : 13;
  const lanes = [[E.before, E.b_steps, COL.stone, COL.ink], [E.after, E.a_steps, COL.ink, COL.bg]];
  const box = (x, y, w, h, s, fill, col, a, mark) => {
    c.globalAlpha = a; ch.bar(x, x + w, y, y + h, fill, a);
    const ls = drgWrap(ch, s, w - 16, { size: fs, w: 650 }).slice(0, 3), lh = fs * 1.25, y0 = y + h / 2 - (ls.length - 1) * lh / 2 + fs * 0.35;
    ls.forEach((l, k) => ch.text(l, x + w / 2, y0 + k * lh, { size: fs, w: 650, color: col, al: 'center', a }));
    if (mark) { c.save(); c.globalAlpha = a; c.strokeStyle = COL.acc; c.lineWidth = 2; const xa = ch.X(x), xb = ch.X(x + w); c.strokeRect(Math.min(xa, xb) - 3, y - 3, w + 6, h + 6); c.restore(); }
  };
  const arrow = (xa, ya, xb, yb, a) => {
    c.save(); c.globalAlpha = a; c.strokeStyle = COL.mute; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ch.X(xa), ya); c.lineTo(ch.X(xb), yb); c.stroke();
    const dx = Math.sign(ch.X(xb) - ch.X(xa)), dy = Math.sign(yb - ya);
    c.beginPath(); if (dx) { c.moveTo(ch.X(xb) - dx * 6, yb - 4); c.lineTo(ch.X(xb), yb); c.lineTo(ch.X(xb) - dx * 6, yb + 4); } else { c.moveTo(ch.X(xb) - 4, yb - dy * 6); c.lineTo(ch.X(xb), yb); c.lineTo(ch.X(xb) + 4, yb - dy * 6); } c.stroke(); c.restore();
  };
  if (!nar) {
    const lab = Math.max(...lanes.map(l => ch.measure(l[0], { size: 13, w: 750 }))) + 18, n = 4, gap = 34;
    const bw = (ch.W - lab - gap * (n - 1)) / n, bh = Math.min(58, (ch.H - 60) / 2), ys = [10, 10 + bh + 44];
    lanes.forEach(([name, steps, fill, col], j) => {
      const y = ys[j];
      ch.text(name, 0, y + bh / 2 + 5, { size: 13, w: 750, color: j ? COL.ink : COL.mute });
      steps.forEach((s, k) => {
        const a = clamp((u - j * 0.42 - k * 0.09) / 0.12, 0, 1); if (a <= 0) return;
        const x = lab + k * (bw + gap);
        box(x, y, bw, bh, s, k === n - 1 ? (j ? COL.ink : COL.stone) : fill, k === n - 1 && !j ? COL.ink : col, a);
        if (k) arrow(x - gap + 6, y + bh / 2, x - 6, y + bh / 2, a);
      });
    });
    
    const na = clamp((u - 0.88) / 0.12, 0, 1);
    if (na > 0) {
      const x = lab + (bw + gap), yA = ys[0] + bh, yB = ys[1];
      c.save(); c.globalAlpha = na; c.strokeStyle = COL.acc; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(ch.X(x + bw / 2), yA + 4); c.lineTo(ch.X(x + bw / 2), yB - 4); c.stroke(); c.restore();
      ch.text(E.nocode, x + bw / 2 + 8, (yA + yB) / 2 + 4, { size: 12.5, w: 750, color: COL.accT, a: na });
    }
  } else {
    
    const gap = 14, cw = (ch.W - gap) / 2, top = 26, n = 4, vg = 22, bh = (ch.H - top - vg * (n - 1) - 30) / n;
    lanes.forEach(([name, steps, fill, col], j) => {
      const x = j * (cw + gap);
      ch.text(name, x + cw / 2, 14, { size: 12.5, w: 750, al: 'center', color: j ? COL.ink : COL.mute });
      steps.forEach((s, k) => {
        const a = clamp((u - j * 0.42 - k * 0.09) / 0.12, 0, 1); if (a <= 0) return;
        const y = top + k * (bh + vg);
        box(x, y, cw, bh, s, k === n - 1 ? (j ? COL.ink : COL.stone) : fill, k === n - 1 && !j ? COL.ink : col, a, j === 0 && k === 1 && u > 0.88);
        if (k) arrow(x + cw / 2, y - vg + 4, x + cw / 2, y - 4, a);
      });
    });
    const na = clamp((u - 0.88) / 0.12, 0, 1);
    if (na > 0) ch.text(E.nocode, cw + gap + cw / 2, ch.H - 6, { size: 12, w: 750, al: 'center', color: COL.accT, a: na });
  }
};


const charts = [];
let raf = 0;
function loop() {
  raf = 0; const t = performance.now() / 1000; let busy = false;
  for (const ch of charts) {
    if (ch.start < 0 || ch.done) continue;
    ch.u = clamp((t - ch.start) / (ch.id === 'recon' ? 1.6 : ch.id === 'xrun' || ch.id === 'xfix' || ch.id === 'evnight' || ch.id === 'evmin' || ch.id === 'drgflow' || ch.id === 'drgtypes' ? 1.8 : 1.1), 0, 1);
    if (ch.u >= 1) ch.done = true; else busy = true;
    ch.render();
  }
  if (busy) raf = requestAnimationFrame(loop);
}
function init(labels) {
  L = labels || {};
  document.querySelectorAll('canvas[data-ch]').forEach(cv => charts.push(new Chart(cv)));
  const all = () => charts.forEach(ch => { ch.size(); ch.render(); });
  const finished = RM || SEEKING || !('IntersectionObserver' in window);
  if (finished) charts.forEach(ch => { ch.u = 1; ch.done = true; });
  all();
  if (document.fonts) document.fonts.ready.then(all);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(all, 120); });
  if (finished) return;
  const io = new IntersectionObserver(es => {
    for (const en of es) {
      if (!en.isIntersecting) continue;
      const ch = charts.find(c => c.cv === en.target); if (!ch || ch.start >= 0) continue;
      ch.start = performance.now() / 1000 + 0.15; io.unobserve(en.target);
      if (!raf) raf = requestAnimationFrame(loop);
    }
  }, { threshold: 0.35 });
  charts.forEach(ch => io.observe(ch.cv));
}





function erd(el) {
  if (!el) return;
  const svg = el.querySelector('.erd-ln'), NS = 'http://www.w3.org/2000/svg';
  const rels = JSON.parse(el.dataset.rels || '[]');
  let drawn = false;
  function layout() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (getComputedStyle(svg).display === 'none') return;
    const R = el.getBoundingClientRect(); svg.setAttribute('width', R.width); svg.setAttribute('height', R.height);
    svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
    const row = (t, c) => el.querySelector(`.erd-t[data-t="${t}"] li[data-c="${c}"]`), box = t => el.querySelector(`.erd-t[data-t="${t}"]`);
    const items = rels.map(([f, fc, t, tc]) => {
      const a = row(f, fc), b = row(t, tc), ba = box(f).getBoundingClientRect(), bb = box(t).getBoundingClientRect();
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const right = bb.left > ba.left;                         
      const xa = (right ? ba.right : ba.left) - R.left, xb = (right ? bb.left : bb.right) - R.left;
      return { f, t, xa, ya: ra.top + ra.height / 2 - R.top, xb, yb: rb.top + rb.height / 2 - R.top, g: Math.round(Math.min(xa, xb)) + ':' + Math.round(Math.max(xa, xb)) };
    });
    const gut = {}; items.forEach(it => { (gut[it.g] = gut[it.g] || []).push(it); });
    Object.values(gut).forEach(list => {
      list.sort((p, q) => (p.yb - q.yb) || (p.ya - q.ya));
      list.forEach((it, k) => { const lo = Math.min(it.xa, it.xb), hi = Math.max(it.xa, it.xb); it.lx = lo + (k + 1) / (list.length + 1) * (hi - lo); });
    });
    items.forEach((it, i) => {
      const r = Math.min(7, Math.abs(it.yb - it.ya) / 2), sa = Math.sign(it.lx - it.xa), sb = Math.sign(it.xb - it.lx), sy = Math.sign(it.yb - it.ya);
      const d = Math.abs(it.yb - it.ya) < 1 ? `M${it.xa},${it.ya} H${it.xb}`
        : `M${it.xa},${it.ya} H${it.lx - sa * r} Q${it.lx},${it.ya} ${it.lx},${it.ya + sy * r} V${it.yb - sy * r} Q${it.lx},${it.yb} ${it.lx + sb * r},${it.yb} H${it.xb}`;
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.style.setProperty('--d', (i * 70) + 'ms'); svg.appendChild(p);
      const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = drawn ? 0 : len;
      
      const m = (x, y, s, dir) => { const tx = document.createElementNS(NS, 'text'); tx.setAttribute('x', x + dir * 7); tx.setAttribute('y', y - 4); tx.setAttribute('text-anchor', dir > 0 ? 'start' : 'end'); tx.textContent = s; svg.appendChild(tx); };
      m(it.xa, it.ya, '*', sa); m(it.xb, it.yb, '1', -sb);
    });
  }
  const run = () => { if (drawn) return; drawn = true; svg.querySelectorAll('path').forEach(p => { p.style.strokeDashoffset = 0; }); el.classList.add('erd-on'); };
  layout();
  if (document.fonts) document.fonts.ready.then(layout);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 120); });
  if (RM || SEEKING || !('IntersectionObserver' in window)) { el.classList.add('erd-still'); run(); return; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(run, 350); } }, { threshold: 0.3 });
  io.observe(el);
}

window.CH = { init, erd, charts };
})();
