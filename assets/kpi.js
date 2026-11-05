








(() => {
'use strict';
const K = window.KIT;
const { AR, RM, SEEKING, clamp, lerp, mkRnd, arDigits } = K;

const COL = { ink: '#1b1a17', mute: '#645f56', grid: '#ddd7cb', acc: '#a8641a', accT: '#8f5413', sage: '#6d7b68', stone: '#aca291', pale: '#d6cec0', band: 'rgba(109, 123, 104, .13)', bg: '#f2efe8' };
const FACE = AR ? '"Beiruti", "Switzer", sans-serif' : '"Switzer", sans-serif';
const fz = z => AR ? Math.round(z * 1.08 * 10) / 10 : z;     
const ease = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
const D = K.nokiaData();
let L = {};
const LRI = '⁦', PDI = '⁩';                        


const ad = s => { s = arDigits(s); return AR && s != null ? String(s).replace(/([٠-٩])\s?%/g, '$1٪').replace(/(^|[\s(])-(?=[٠-٩])/g, '$1−') : s; };


function nice(lo, hi, n, zero) {
  if (zero) lo = Math.min(0, lo);
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : (f <= 2.5 && p >= 10) ? 2.5 : f <= 5 ? 5 : 10) * p;
  const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const ticks = []; for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(dec + 3));
  return { lo: a, hi: b, ticks, dec, step };
}
const fmt = (v, dec) => ad(v.toFixed(dec));


function series() {
  const rnd = mkRnd(4471), n = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  
  
  const cd = (h, c) => { const x = Math.abs(h - c) % 24; return Math.min(x, 24 - x); };
  const prof = h => 0.2 + 0.32 * Math.exp(-Math.pow(cd(h, 12.5) / 4.2, 2)) + 0.62 * Math.exp(-Math.pow(cd(h, 21.6) / 3.2, 2));
  const S = {};
  
  S.tech = D.reg[0].traffic.map((t, d) => { const g2 = 0.03, g3 = 0.15 - 0.03 * d / 29, g5 = 0.07 + 0.06 * d / 29; return [t * g2, t * g3, t * (1 - g2 - g3 - g5), t * g5]; });
  
  S.lastWeek = []; S.today = [];
  for (let h = 0; h < 24; h++) { const v = 900 * prof(h) * (1 + 0.025 * n()); S.lastWeek.push(v); S.today.push(v * 1.04 * (1 + 0.025 * n())); }
  S.now = 15; S.latest = 13;
  
  S.ref = []; S.act = [];
  for (let h = 0; h < 72; h++) {
    const r = 1250 * prof(h % 24) * (1 + 0.018 * n());
    const k = h - 38;                                   
    let f = 1;
    if (k >= 0 && k < 4) f = 1 - 0.48 * smooth01((k + 1) / 4);
    else if (k >= 4 && k < 10) f = 0.52 + 0.04 * (k - 4) / 6;
    else if (k >= 10 && k < 22) f = lerp(0.56, 1, smooth01((k - 10) / 12));
    S.ref.push(r); S.act.push(h === 42 ? r * 0.52 : r * f * (1 + 0.012 * n()));
  }
  S.worst = 42;
  
  S.ctrl = [['BSC 1', 0.44], ['BSC 2', 0.39], ['BSC 3', 0.52], ['RNC 1', 0.48], ['RNC 2', 3.12], ['RNC 3', 0.41]];
  
  S.hist = [];
  for (let k = 0; k < 150; k++) {
    if (k >= 120) { S.hist.push(D.reg[3].traffic[k - 120]); continue; }
    const wd = ((k - 120) % 7 + 7) % 7;
    S.hist.push((9.6 + 3.9 * k / 119) * (wd === 4 ? 1.08 : wd >= 5 ? 1.18 : 1) * (1 + 0.025 * n()));
  }
  
  S.avail = []; for (let d = 0; d < 14; d++) S.avail.push(d === 8 ? null : 99.8 + 0.06 * n() - (d === 3 ? 0.12 : 0));
  return S;
}
function smooth01(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }

function spread(items, gap, lo, hi) {
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++) if (items[i].ly < items[i - 1].ly + gap) items[i].ly = items[i - 1].ly + gap;
  const over = items.length ? items[items.length - 1].ly - hi : 0;
  if (over > 0) { items[items.length - 1].ly -= over; for (let i = items.length - 2; i >= 0; i--) if (items[i].ly > items[i + 1].ly - gap) items[i].ly = items[i + 1].ly - gap; }
  if (items.length && items[0].ly < lo) { const d = lo - items[0].ly; items.forEach(t => { t.ly += d; }); }
  return items;
}
const S = series();


class Chart {
  constructor(cv) {
    this.cv = cv; this.c = cv.getContext('2d'); this.kc = cv.dataset.kc; this.r = +(cv.dataset.r || 0);
    this.u = 0; this.start = -1; this.done = false;
    this.delay = cv.dataset.row != null ? (+cv.dataset.row * 0.12 + this.r * 0.09) : 0;
  }
  size() {
    const b = this.cv.getBoundingClientRect();
    this.W = Math.max(1, b.width); this.H = Math.max(1, b.height);
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
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
    const tw = Math.max(...yt.ticks.map(v => this.measure(fmt(v, yt.dec))));
    const x0 = Math.ceil(tw + 10), x1 = this.W - (o.padR != null ? o.padR : 6), y0 = o.padT != null ? o.padT : 10, y1 = this.H - (o.padB != null ? o.padB : 24);
    return { x0, x1, y0, y1, yv: v => y1 - (v - yt.lo) / (yt.hi - yt.lo) * (y1 - y0) };
  }
  hline(x0, x1, y, col, w, dash) {
    const c = this.c; c.save(); c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []);
    c.beginPath(); c.moveTo(this.X(x0), y); c.lineTo(this.X(x1), y); c.stroke(); c.restore();
  }
  vline(x, y0, y1, col, w, dash) {
    const c = this.c; c.save(); c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []);
    c.beginPath(); c.moveTo(this.X(x), y0); c.lineTo(this.X(x), y1); c.stroke(); c.restore();
  }
  
  axes(F, yt, xt) {
    for (const v of yt.ticks) {
      const y = Math.round(F.yv(v)) + 0.5;
      if (v !== yt.lo) this.hline(F.x0, F.x1, y, COL.grid, 1);
      this.text(fmt(v, yt.dec), F.x0 - 8, y + 4, { al: 'end' });
    }
    this.vline(F.x0, F.y0 - 2, F.y1, COL.ink, 1.5);
    this.hline(F.x0 - 0.75, F.x1, F.y1, COL.ink, 1.5);
    
    for (const [x, s] of xt) { this.vline(x, F.y1, F.y1 + 4, COL.ink, 1.5); const w = this.measure(s) / 2 + 1; this.text(s, clamp(x, w, this.W - w), F.y1 + 18, { al: 'center' }); }
  }
  
  path(pts, close) {
    const c = this.c; let on = false; c.beginPath();
    for (const p of pts) { if (!p) { on = false; continue; } if (on) c.lineTo(this.X(p[0]), p[1]); else { c.moveTo(this.X(p[0]), p[1]); on = true; } }
    if (close) c.closePath();
  }
  
  clipTo(F, u) { const c = this.c, w = (F.x1 - F.x0 + 8) * u; c.save(); c.beginPath(); c.rect(AR ? this.W - F.x0 - w + 4 : F.x0 - 4, 0, w, this.H); c.clip(); }
  dot(x, y, r, col) { const c = this.c; c.fillStyle = col; c.globalAlpha = 1; c.beginPath(); c.arc(this.X(x), y, r, 0, 6.2832); c.fill(); }
  render() {
    const c = this.c; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.globalAlpha = 1;
    c.fillStyle = COL.bg; c.fillRect(0, 0, this.W, this.H);
    c.lineJoin = 'round'; c.lineCap = 'butt';
    const f = KINDS[this.kc]; if (f) f(this, ease(this.u), this.u);
  }
}


const dayTicks = (F, xd, n, every, first) => { const out = []; for (let d = 0; d < n; d += every) out.push([xd(d), d === 0 ? first : String(d + 1)]); return out; };
const isBad = (r, d) => r === D.badReg && d === D.bad;


const ROWYT = {
  traffic: r => { const s = D.reg[r].traffic; return nice(0, Math.max(...s) * 1.04, 3, true); },
  cssr: r => { const s = D.reg[r].cssr, lo0 = Math.min(...s, D.target), hi0 = Math.max(...s), sp = hi0 - lo0; return nice(lo0 - sp * 0.08, hi0 + sp * 0.12, 3); },
  drop: r => { const s = D.reg[r].drop; return nice(0, Math.max(...s, D.dropMax) * 1.06, 3, true); },
};
const ROWDEC = {};
for (const k in ROWYT) ROWDEC[k] = Math.max(...[0, 1, 2, 3].map(r => ROWYT[k](r).dec));
const rowYt = (k, r) => Object.assign(ROWYT[k](r), { dec: ROWDEC[k] });

const KINDS = {
  
  traffic(g, e) {
    const s = D.reg[g.r].traffic, yt = rowYt('traffic', g.r), F = g.frame(yt);
    const xd = d => F.x0 + (d + 0.5) / s.length * (F.x1 - F.x0);
    g.axes(F, yt, dayTicks(F, xd, s.length, 7, L.day1 || '1'));
    const c = g.c, pts = s.map((v, d) => [xd(d), lerp(F.y1, F.yv(v), e)]);
    g.path([[xd(0), F.y1], ...pts, [xd(s.length - 1), F.y1]], true); c.globalAlpha = 0.14; c.fillStyle = COL.ink; c.fill();
    c.globalAlpha = 1; g.path(pts); c.strokeStyle = COL.ink; c.lineWidth = 1.75; c.stroke();
    if (g.r === D.badReg && e > 0.85) g.dot(xd(D.bad), pts[D.bad][1], 3.6, COL.acc);
  },
  
  cssr(g, e, u) {
    const s = D.reg[g.r].cssr, yt = rowYt('cssr', g.r), F = g.frame(yt);
    const xd = d => F.x0 + (d + 0.5) / s.length * (F.x1 - F.x0), c = g.c;
    const ty = F.yv(D.target);
    c.fillStyle = COL.band; c.globalAlpha = 1; c.fillRect(Math.min(g.X(F.x0), g.X(F.x1)), F.y0, F.x1 - F.x0, Math.max(0, ty - F.y0));
    g.axes(F, yt, dayTicks(F, xd, s.length, 7, L.day1 || '1'));
    g.hline(F.x0, F.x1, ty, COL.mute, 1.25, [5, 4]);
    g.clipTo(F, e);
    c.strokeStyle = COL.ink; c.lineWidth = 1.75; g.path(s.map((v, d) => [xd(d), F.yv(v)])); c.stroke();
    if (g.r === D.badReg) {
      const b = D.bad; c.strokeStyle = COL.acc; c.lineWidth = 2.25;
      g.path([[xd(b - 1), F.yv(s[b - 1])], [xd(b), F.yv(s[b])], [xd(b + 1), F.yv(s[b + 1])]]); c.stroke();
      g.dot(xd(b), F.yv(s[b]), 3.6, COL.acc);
    }
    c.restore();
    if (g.r === D.badReg && u > 0.9) g.text(fmt(s[D.bad], 1), xd(D.bad) + 8, F.yv(s[D.bad]) + 4, { color: COL.accT, a: smooth01((u - 0.9) / 0.1) });
  },
  
  drop(g, e, u) {
    const s = D.reg[g.r].drop, yt = rowYt('drop', g.r), F = g.frame(yt, { padT: 14 });
    const n = s.length, step = (F.x1 - F.x0) / n, bw = Math.max(2, step * 0.62), xd = d => F.x0 + (d + 0.5) * step, c = g.c;
    g.axes(F, yt, dayTicks(F, xd, n, 7, L.day1 || '1'));
    for (let d = 0; d < n; d++) {
      const k = clamp(u * 1.35 - d / n * 0.35, 0, 1), h = (F.y1 - F.yv(s[d])) * ease(k);
      c.fillStyle = isBad(g.r, d) ? COL.acc : COL.ink; c.globalAlpha = isBad(g.r, d) ? 1 : 0.72;
      c.fillRect(g.X(xd(d)) - bw / 2, F.y1 - h, bw, h);
    }
    c.globalAlpha = 1;
    g.hline(F.x0, F.x1, F.yv(D.dropMax), COL.mute, 1.25, [5, 4]);
    if (g.r === D.badReg && u > 0.9) g.text(fmt(s[D.bad], 2), xd(D.bad) + bw / 2 + 5, F.yv(s[D.bad]) + 9, { color: COL.accT, a: smooth01((u - 0.9) / 0.1) });
  },
  
  
  tech(g, e, u) {
    const s = S.tech, tot = s.map(v => v[0] + v[1] + v[2] + v[3]), yt = nice(0, Math.max(...tot) * 1.04, 4, true);
    const names = ['2G', '3G', '4G', '5G'], lo = { size: 12, w: 700 };
    const lw = Math.max(...names.map(n => g.measure(n, lo)));
    const F = g.frame(yt, { padR: lw + 16 });
    const xd = d => F.x0 + d / (s.length - 1) * (F.x1 - F.x0), c = g.c, last = s.length - 1;
    g.axes(F, yt, [[xd(0), L.day1 || '1'], [xd(7), '8'], [xd(14), '15'], [xd(21), '22'], [xd(29), '30']]);
    const cols = [COL.pale, COL.stone, COL.sage, COL.ink];
    let lowY = s.map(() => F.y1);
    const mids = [];
    for (let k = 0; k < 4; k++) {
      const topY = s.map((v, d) => { let cum = 0; for (let q = 0; q <= k; q++) cum += v[q]; return lerp(F.y1, F.yv(cum), e); });
      const pts = topY.map((y, d) => [xd(d), y]), back = lowY.map((y, d) => [xd(d), y]).reverse();
      g.path([...pts, ...back], true); c.globalAlpha = 1; c.fillStyle = cols[k]; c.fill();
      mids.push({ k, y: (topY[last] + lowY[last]) / 2, ly: (topY[last] + lowY[last]) / 2 });
      lowY = topY;
    }
    
    for (let k = 0; k < 3; k++) {
      const topY = s.map((v, d) => { let cum = 0; for (let q = 0; q <= k; q++) cum += v[q]; return lerp(F.y1, F.yv(cum), e); });
      c.strokeStyle = COL.bg; c.lineWidth = 1.5; g.path(topY.map((y, d) => [xd(d), y])); c.stroke();
    }
    g.hline(F.x0 - 0.75, F.x1, F.y1, COL.ink, 1.5);
    
    const la = clamp((u - 0.6) / 0.3, 0, 1);
    if (la <= 0) return;
    spread(mids, 14, F.y0 + 4, F.y1 - 2).forEach(m => {
      if (Math.abs(m.ly - m.y) > 6) { c.globalAlpha = la; g.hline(F.x1 + 2, F.x1 + 6, m.y, COL.mute, 1); g.vline(F.x1 + 6, m.y, m.ly, COL.mute, 1); }
      g.text(names[m.k], F.x1 + 9, m.ly + 4, Object.assign({ a: la, color: m.k === 0 ? COL.mute : COL.ink }, lo));
    });
  },
  
  hourly(g, e, u) {
    const yt = nice(0, Math.max(...S.lastWeek, ...S.today) * 1.08, 4, true), F = g.frame(yt, { padT: 26 });
    const xd = h => F.x0 + h / 23 * (F.x1 - F.x0), c = g.c;
    g.axes(F, yt, [0, 6, 12, 18].map(h => [xd(h), (h < 10 ? '0' : '') + h + ':00']));
    
    g.vline(xd(S.now), F.y0 - 6, F.y1, COL.mute, 1.25, [2, 3]);
    g.text(L.now || '15:00', xd(S.now) + 6, F.y0 - 10, { size: 12, color: COL.mute, a: 1 });
    g.clipTo(F, e);
    c.strokeStyle = COL.sage; c.lineWidth = 1.75; c.setLineDash([5, 4]); g.path(S.lastWeek.map((v, h) => [xd(h), F.yv(v)])); c.stroke(); c.setLineDash([]);
    c.strokeStyle = COL.ink; c.lineWidth = 2.25; g.path(S.today.slice(0, S.latest + 1).map((v, h) => [xd(h), F.yv(v)])); c.stroke();
    c.restore();
    if (u > 0.75) {
      const a = smooth01((u - 0.75) / 0.25), x = xd(S.latest), y = F.yv(S.today[S.latest]);
      c.globalAlpha = a; g.dot(x, y, 3.6, COL.ink);
      g.text(L.latest || '13:00', x - 8, y - 12, { size: 12, al: 'end', a });
    }
  },
  
  incident(g, e, u) {
    const yt = nice(0, Math.max(...S.ref, ...S.act) * 1.12, 4, true), F = g.frame(yt, { padT: 26 });
    const xd = h => F.x0 + h / 71 * (F.x1 - F.x0), c = g.c;
    g.axes(F, yt, [[xd(12), L.d17 || 'day 17'], [xd(36), L.d18 || 'day 18'], [xd(60), L.d19 || 'day 19']]);
    g.vline(xd(24), F.y0, F.y1, COL.grid, 1); g.vline(xd(48), F.y0, F.y1, COL.grid, 1);
    if (u > 0.55) {
      
      const a = smooth01((u - 0.55) / 0.3), top = [], bot = [];
      for (let h = 0; h < 72; h++) if (S.act[h] < S.ref[h] * 0.95) { top.push([xd(h), F.yv(S.ref[h])]); bot.push([xd(h), F.yv(S.act[h])]); }
      if (top.length) { g.path([...top, ...bot.reverse()], true); c.globalAlpha = 0.3 * a; c.fillStyle = COL.acc; c.fill(); c.globalAlpha = 1; }
    }
    g.clipTo(F, e);
    c.strokeStyle = COL.sage; c.lineWidth = 1.75; c.setLineDash([5, 4]); g.path(S.ref.map((v, h) => [xd(h), F.yv(v)])); c.stroke(); c.setLineDash([]);
    c.strokeStyle = COL.ink; c.lineWidth = 2; g.path(S.act.map((v, h) => [xd(h), F.yv(v)])); c.stroke();
    c.restore();
    if (u > 0.85) {
      const a = smooth01((u - 0.85) / 0.15), x = xd(S.worst), y = F.yv(S.act[S.worst]);
      
      c.globalAlpha = a; g.vline(x, F.y0 - 4, y - 6, COL.acc, 1.25, [2, 3]); g.dot(x, y, 4, COL.acc);
      g.text(L.worst || '−48%', x, F.y0 - 10, { size: 12.5, w: 700, color: COL.accT, a, al: 'center' });
    }
  },
  
  ctrl(g, e, u) {
    const rows = S.ctrl, names = rows.map(r => LRI + r[0] + PDI);
    const nw = Math.max(...names.map(s => g.measure(s)));
    const xt = nice(0, Math.max(...rows.map(r => r[1])) * 1.1, 4, true);
    const x0 = Math.ceil(nw + 14), x1 = g.W - 42, y0 = 22, y1 = g.H - 24, c = g.c;
    const xv = v => x0 + (v - xt.lo) / (xt.hi - xt.lo) * (x1 - x0), rh = (y1 - y0) / rows.length, bh = Math.min(22, rh * 0.58);
    for (const v of xt.ticks) { if (v !== xt.lo) g.vline(xv(v), y0, y1, COL.grid, 1); g.vline(xv(v), y1, y1 + 4, COL.ink, 1.5); g.text(fmt(v, xt.dec), xv(v), y1 + 18, { al: 'center' }); }
    g.hline(x0 - 0.75, x1, y1, COL.ink, 1.5); g.vline(x0, y0 - 2, y1, COL.ink, 1.5);
    rows.forEach(([nm, v], i) => {
      const yc = y0 + (i + 0.5) * rh, k = ease(clamp(u * 1.3 - i * 0.06, 0, 1)), hot = v > D.dropMax, w = (xv(v) - x0) * k;
      g.text(names[i], x0 - 8, yc + 4, { al: 'end' });
      c.fillStyle = hot ? COL.acc : COL.ink; c.globalAlpha = hot ? 1 : 0.72; c.fillRect(AR ? g.W - x0 - w : x0, yc - bh / 2, w, bh); c.globalAlpha = 1;
      if (k > 0.95) g.text(fmt(v, 2), x0 + w + 6, yc + 4, { color: hot ? COL.accT : COL.ink });
    });
    g.vline(xv(D.dropMax), y0 - 6, y1, COL.mute, 1.25, [5, 4]);
    g.text((L.thr || 'threshold') + ' ' + fmt(D.dropMax, 1), xv(D.dropMax) + 6, y0 - 8, { size: 12, color: COL.mute });
  },
  
  history(g, e) {
    
    const narrow = g.W < 520, s = S.hist, yt = nice(Math.min(...s) * 0.92, Math.max(...s) * 1.04, 4), F = g.frame(yt, { padT: narrow ? 42 : 26 });
    const xd = k => F.x0 + k / (s.length - 1) * (F.x1 - F.x0), c = g.c;
    g.axes(F, yt, [[xd(0), L.day1 || '1'], [xd(29), '30'], [xd(59), '60'], [xd(89), '90'], [xd(119), '120'], [xd(149), '150']]);
    const seam = xd(119.5);
    g.vline(seam, F.y0 - (narrow ? 22 : 6), F.y1, COL.mute, 1.25, [2, 3]);
    g.text(L.hist || 'history file', seam - 8, F.y0 - 10, { size: 12, color: COL.sage, al: 'end' });
    if (narrow) g.text(L.fresh || 'fresh exports', g.W - 2, F.y0 - 26, { size: 12, al: 'end' });
    else g.text(L.fresh || 'fresh exports', seam + 8, F.y0 - 10, { size: 12 });
    g.clipTo(F, e);
    c.strokeStyle = COL.sage; c.lineWidth = 1.5; g.path(s.slice(0, 121).map((v, k) => [xd(k), F.yv(v)])); c.stroke();
    c.strokeStyle = COL.ink; c.lineWidth = 2; g.path(s.slice(120).map((v, k) => [xd(k + 120), F.yv(v)])); c.stroke();
    c.restore();
  },
  
  
  
  
  gap(g, e, u) {
    const c = g.c, narrow = g.W < 520, sz = narrow ? 11.5 : 12.5, lh = narrow ? 15 : 17;
    const Lg = AR ? { look: 'المحاولة ', apart: 'بفارق ١٠ دقائق', apartS: 'بفارق ١٠ دقائق',
                      stop: 'أحدث ملف لم يصل بعد: يتوقف التشغيل، ولا تقرير نصف فارغ', stopS: 'لم يصل: يتوقف التشغيل، ولا تقرير نصف فارغ', stopXS: 'يتوقف التشغيل، ولا تقرير نصف فارغ',
                      rerun: 'يُعاد التشغيل يدويًا حين تصل البيانات: أُرسل', rerunS: 'يُعاد يدويًا حين تصل البيانات: أُرسل',
                      fail: 'تعطّل رسم واحد، وأُرسلت الرسوم الـ 11 الباقية', failS: 'تعطّل 1، وأُرسل 11', gap: 'اليوم 9: لا ملف، تُرك فراغًا' }
      : { look: 'look ', apart: '10 minutes apart', apartS: '10 min apart',
          stop: 'newest export still missing: the run stops; no half-empty report', stopS: 'still missing: the run stops; no half-empty report', stopXS: 'the run stops; no half-empty report',
          rerun: 'rerun by hand once the data is in: sent', rerunS: 'rerun by hand once data is in: sent',
          fail: '1 chart failed; the other 11 still went out', failS: '1 failed, 11 sent', gap: 'day 9: no export, left as a gap' };
    
    const fa = k => smooth01((u - 0.2 - k * 0.13) / 0.22);
    const pick = (a, b, x, o, z) => x + g.measure(a, o) <= g.W - 4 ? a : (z == null || x + g.measure(b, o) <= g.W - 4) ? b : z;
    const to = { size: sz, w: 650 }, tm = { size: sz, color: COL.mute };
    
    const y1 = narrow ? 13 : 14, r = narrow ? 3.4 : 3.8;
    let x = 2;
    for (let k = 0; k < 3; k++) {
      const a = fa(k);
      c.globalAlpha = a; c.strokeStyle = COL.ink; c.lineWidth = 1.4; c.beginPath(); c.arc(g.X(x + r), y1 - r - 0.5, r, 0, 6.2832); c.stroke();
      x += 2 * r + 5;
      const s = Lg.look + (k + 1);
      g.text(s, x, y1, Object.assign({ a }, to)); x += g.measure(s, to);
      if (k < 2) { c.globalAlpha = a * 0.7; g.hline(x + 5, x + 17, y1 - r - 0.5, COL.mute, 1, [2, 2]); x += 22; }
    }
    g.text(pick(Lg.apart, Lg.apartS, x + 10, tm), x + 10, y1, Object.assign({ a: fa(2) }, tm));
    
    const y2 = y1 + lh, a2 = fa(3);
    c.globalAlpha = a2; c.fillStyle = COL.ink; c.fillRect(g.X(2 + r) - r + 0.5, y2 - 2 * r - 0.5, 2 * r - 1, 2 * r - 1);
    g.text(pick(Lg.stop, Lg.stopS, 2 * r + 7, to, Lg.stopXS), 2 * r + 7, y2, Object.assign({ a: a2 }, to));
    
    const y3 = y2 + lh, a3 = fa(4), tl = AR ? g.W - 2 - 2 * r : 2;
    c.globalAlpha = a3; c.strokeStyle = COL.ink; c.lineWidth = 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(tl, y3 - r); c.lineTo(tl + r * 0.7, y3 - r * 0.3); c.lineTo(tl + 2 * r, y3 - 2 * r - 1); c.stroke(); c.lineCap = 'butt';
    g.text(pick(Lg.rerun, Lg.rerunS, 2 * r + 7, to), 2 * r + 7, y3, Object.assign({ a: a3 }, to));
    
    const n = 12, tw = narrow ? 12 : 17, th = Math.round(tw * 0.62), tg = narrow ? 3 : 4, yp = y3 + (narrow ? 6 : 7), FAIL = 7;
    for (let k = 0; k < n; k++) {
      const px0 = 2 + k * (tw + tg), px = AR ? g.W - px0 - tw : px0, a = fa(5) * clamp(u * 3 - 1.6 - k * 0.04, 0, 1);
      if (a <= 0) continue;
      c.globalAlpha = a;
      if (k === FAIL) {
        c.strokeStyle = COL.acc; c.lineWidth = 1.25; c.strokeRect(px + 0.5, yp + 0.5, tw - 1, th - 1);
        c.beginPath(); c.moveTo(px + 3, yp + 2.5); c.lineTo(px + tw - 3, yp + th - 2.5); c.moveTo(px + tw - 3, yp + 2.5); c.lineTo(px + 3, yp + th - 2.5); c.stroke();
      } else {
        c.fillStyle = COL.pale; c.fillRect(px, yp, tw, th);
        c.strokeStyle = COL.ink; c.lineWidth = 1; c.beginPath();
        const w0 = [0.62, 0.4, 0.55, 0.3, 0.5][k % 5];
        c.moveTo(px + 2, yp + th * w0); c.lineTo(px + tw * 0.4, yp + th * (1 - w0) * 0.9); c.lineTo(px + tw - 2, yp + th * 0.45); c.stroke();
      }
    }
    c.globalAlpha = 1;
    const fx = 2 + n * (tw + tg) + 6, fo = { size: narrow ? 11 : 12, color: COL.mute };
    g.text(pick(Lg.fail, Lg.failS, fx, fo), fx, yp + th - 1, Object.assign({ a: fa(5) }, fo));
    
    const rule = yp + th + (narrow ? 7 : 9);
    c.globalAlpha = fa(5); g.hline(0, g.W, rule + 0.5, COL.grid, 1); c.globalAlpha = 1;

    
    const s = S.avail, vals = s.filter(v => v != null), yt = nice(Math.min(...vals, 99.5) - 0.12, Math.max(...vals) + 0.08, 4);
    const F = g.frame(yt, { padT: rule + (narrow ? 12 : 16), padB: 40 });
    const nd = s.length, step = (F.x1 - F.x0) / nd, xd = d => F.x0 + (d + 0.5) * step;
    const ty = F.yv(99.5);
    c.fillStyle = COL.band; c.fillRect(Math.min(g.X(F.x0), g.X(F.x1)), F.y0, F.x1 - F.x0, Math.max(0, ty - F.y0));
    
    for (let d = 0; d < nd; d++) g.vline(xd(d), F.y1, F.y1 + 3, COL.mute, 1);
    g.axes(F, yt, [0, 3, 6, 9, 12].map(d => [xd(d), d === 0 ? (L.day1 || '1') : String(d + 1)]));
    g.hline(F.x0, F.x1, ty, COL.mute, 1.25, [5, 4]);
    g.text(Lg.gap, xd(8), F.y1 + 34, { size: narrow ? 11 : 11.5, w: 600, color: COL.mute, al: 'center', a: smooth01((u - 0.7) / 0.3) });
    g.clipTo(F, e);
    c.strokeStyle = COL.ink; c.lineWidth = 2; g.path(s.map((v, d) => v == null ? null : [xd(d), F.yv(v)])); c.stroke();
    s.forEach((v, d) => { if (v != null) g.dot(xd(d), F.yv(v), 2.6, COL.ink); });
    c.restore();
  },
};


const charts = [];
let raf = 0;
function loop() {
  raf = 0;
  const t = performance.now() / 1000; let busy = false;
  for (const ch of charts) {
    if (ch.start < 0 || ch.done) continue;
    ch.u = clamp((t - ch.start) / 1.0, 0, 1);
    ch.render(); if (ch.u >= 1) ch.done = true; else busy = true;
  }
  if (busy) raf = requestAnimationFrame(loop);
}
function init(labels) {
  L = labels || {};
  document.querySelectorAll('canvas[data-kc]').forEach(cv => charts.push(new Chart(cv)));
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
      ch.start = performance.now() / 1000 + ch.delay; io.unobserve(en.target);
      if (!raf) raf = requestAnimationFrame(loop);
    }
  }, { threshold: 0.35 });
  charts.forEach(ch => io.observe(ch.cv));
}
window.KPI = { init, charts };
})();
