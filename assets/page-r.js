








(() => {
'use strict';
const K = window.KIT;
const { AR, RM, SEEKING, clamp, lerp, arDigits } = K;

const COL = { ink: '#1b1a17', mute: '#645f56', grid: '#ddd7cb', acc: '#a8641a', accT: '#8f5413', sage: '#6d7b68', stone: '#aca291', pale: '#d6cec0', band: 'rgba(109, 123, 104, .13)', bg: '#f2efe8' };
const FACE = AR ? '"Beiruti", "Switzer", sans-serif' : '"Switzer", sans-serif';
const fz = z => AR ? Math.round(z * 1.08 * 10) / 10 : z;
const ease = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
const smooth01 = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const LRI = '⁦', PDI = '⁩';
const MINUS = '−', PCT = AR ? '٪' : '%';


const ad = s => { s = arDigits(s); return AR && s != null ? String(s).replace(/([٠-٩])\s?%/g, '$1٪').replace(/(^|[\s(])-(?=[٠-٩])/g, '$1−') : s; };
const SEP = AR ? '، ' : ', ';                       
let L = {}, DATA = {};


function nice(lo, hi, n, zero) {
  if (zero) lo = Math.min(0, lo);
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : (f <= 2.5 && p >= 10) ? 2.5 : f <= 5 ? 5 : 10) * p;
  const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const ticks = []; for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(dec + 3));
  return { lo: a, hi: b, ticks, dec, step };
}

const fmt = (v, dec = 0) => ad((v < 0 ? MINUS : '') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }));


class Chart {
  constructor(cv, i) {
    this.cv = cv; this.c = cv.getContext('2d'); this.kc = cv.dataset.rc;
    this.u = 0; this.start = -1; this.done = false; this.delay = 0; this.flat = false;
  }
  size() {
    const b = this.cv.getBoundingClientRect();
    this.W = Math.max(1, b.width); this.H = Math.max(1, b.height);
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
  }
  
  X(x) { return AR && !this.flat ? this.W - x : x; }
  font(o) { return `${o.w || 650} ${fz(o.size || 12)}px ${FACE}`; }
  measure(s, o = {}) { this.c.font = this.font(o); return this.c.measureText(ad(s)).width; }
  text(s, x, y, o = {}) {
    const c = this.c; c.font = this.font(o); c.fillStyle = o.color || COL.ink; c.globalAlpha = o.a == null ? 1 : o.a;
    const rtl = AR && !this.flat;
    c.direction = AR ? 'rtl' : 'ltr';
    const al = o.al || 'start';
    c.textAlign = al === 'center' ? 'center' : ((al === 'start') !== rtl ? 'left' : 'right');
    if (!rtl && AR && al !== 'center') c.textAlign = al === 'start' ? 'left' : 'right';
    s = ad(s);
    const w = c.measureText(s).width, lx = al === 'center' ? x - w / 2 : al === 'start' ? x : x - w;
    if (lx < 2) x += 2 - lx; else if (lx + w > this.W - 2) x -= lx + w - (this.W - 2);
    c.textBaseline = 'alphabetic'; c.fillText(s, this.X(x), y); c.globalAlpha = 1;
  }
  frame(yt, o = {}) {
    const tw = Math.max(...yt.ticks.map(v => this.measure(o.yfmt ? o.yfmt(v) : fmt(v, yt.dec))));
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
  axes(F, yt, xt, o = {}) {
    for (const v of yt.ticks) {
      const y = Math.round(F.yv(v)) + 0.5;
      if (v !== yt.lo) this.hline(F.x0, F.x1, y, COL.grid, 1);
      this.text(o.yfmt ? o.yfmt(v) : fmt(v, yt.dec), F.x0 - 8, y + 4, { al: 'end' });
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
  dot(x, y, r, col, a = 1) { const c = this.c; c.fillStyle = col; c.globalAlpha = a; c.beginPath(); c.arc(this.X(x), y, r, 0, 6.2832); c.fill(); c.globalAlpha = 1; }
  rect(x, y, w, h, col, a = 1) { const c = this.c; c.fillStyle = col; c.globalAlpha = a; c.fillRect(AR && !this.flat ? this.W - x - w : x, y, w, h); c.globalAlpha = 1; }
  render() {
    const c = this.c; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.globalAlpha = 1;
    c.fillStyle = COL.bg; c.fillRect(0, 0, this.W, this.H);
    c.lineJoin = 'round'; c.lineCap = 'butt';
    const f = KINDS[this.kc]; if (f) f(this, ease(this.u), this.u);
  }
}
const hatch = (g, x, y, w, h, col, a) => {
  const c = g.c; c.save(); c.beginPath(); c.rect(AR && !g.flat ? g.W - x - w : x, y, w, h); c.clip();
  c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = 1;
  for (let k = -h; k < w + h; k += 5) { c.beginPath(); c.moveTo(g.X(x + k), y + h); c.lineTo(g.X(x + k + h), y); c.stroke(); }
  c.restore(); c.globalAlpha = 1;
};

const KINDS = {
  
  hist(g, e, u) {
    const s = DATA.hist, n = s.length, lo = -140, step = 2;
    const yt = nice(0, Math.max(...s) / 1000 * 1.06, 4, true);
    const F = g.frame(yt, { padT: 30 });
    const bw = (F.x1 - F.x0) / n, xv = v => F.x0 + (v - lo) / (n * step) * (F.x1 - F.x0);
    g.text(L.thou || 'thousands', F.x0 - 8, 14, { size: 11.5, color: COL.mute, al: 'start', w: 600 });
    g.axes(F, yt, [-140, -120, -100, -80, -60, -40].map(v => [xv(v), fmt(v)]));
    const spikeBin = DATA.spikes.map(v => Math.floor((v - lo) / step));
    for (let i = 0; i < n; i++) {
      const k = clamp(u * 1.4 - i / n * 0.4, 0, 1), h = (F.y1 - F.yv(s[i] / 1000)) * ease(k);
      const hot = spikeBin.includes(i);
      g.rect(F.x0 + i * bw + 0.5, F.y1 - h, Math.max(1, bw - 1), h, hot ? COL.acc : COL.ink, hot ? 1 : 0.72);
    }
    if (u > 0.85) {
      const a = smooth01((u - 0.85) / 0.15);
      spikeBin.forEach((b, j) => {
        const x = F.x0 + (b + 0.5) * bw, y = F.yv(s[b] / 1000);
        g.text(fmt(DATA.spikes[j]), x, y - 7, { size: 12, color: COL.accT, al: 'center', a, w: 700 });
      });
    }
  },
  
  dumb(g, e, u) {
    const ops = ['A', 'B', 'C'], d = DATA.dl;
    const xt = nice(0, Math.max(...ops.map(o => d[o].all)) * 1.08, 4, true);
    const lab = o => (L.op || 'Operator') + ' ' + LRI + o + PDI;
    const lw = Math.max(...ops.map(o => g.measure(lab(o), { w: 700 })));
    const x0 = Math.ceil(lw + 18), x1 = g.W - 14, y0 = 16, y1 = g.H - 26;
    const xv = v => x0 + (v - xt.lo) / (xt.hi - xt.lo) * (x1 - x0), rh = (y1 - y0) / ops.length;
    for (const v of xt.ticks) { if (v !== xt.lo) g.vline(xv(v), y0, y1, COL.grid, 1); g.vline(xv(v), y1, y1 + 4, COL.ink, 1.5); g.text(fmt(v), xv(v), y1 + 18, { al: 'center' }); }
    g.hline(x0, x1, y1, COL.ink, 1.5); g.vline(x0, y0 - 2, y1, COL.ink, 1.5);
    const c = g.c;
    ops.forEach((o, i) => {
      const yc = y0 + (i + 0.5) * rh, a = d[o].all, b = d[o].clean, moved = Math.abs(a - b) > 1;
      g.text(lab(o), x0 - 12, yc + 4, { al: 'end', w: 700 });
      const k1 = ease(clamp(u * 2.2 - i * 0.15, 0, 1));
      const k2 = ease(clamp((u - 0.45) / 0.45, 0, 1));
      if (k1 <= 0) return;
      
      const xa = lerp(x0, xv(a), k1);
      if (moved) {
        const xb = lerp(xv(a), xv(b), k2);
        if (k2 > 0) { c.strokeStyle = COL.acc; c.lineWidth = 3; c.beginPath(); c.moveTo(g.X(xb), yc); c.lineTo(g.X(xa), yc); c.stroke(); }
        g.dot(xa, yc, 7, COL.stone);
        if (k2 > 0) g.dot(xb, yc, 7, COL.ink);
        if (u > 0.92) {
          const al = smooth01((u - 0.92) / 0.08);
          g.text(fmt(a), xa, yc - 13, { al: 'center', a: al, color: COL.mute });
          g.text(fmt(b), xb, yc - 13, { al: 'center', a: al });
          g.text('4.1×', (xa + xb) / 2, yc + 21, { al: 'center', a: al, color: COL.accT, w: 750, size: 12.5 });
        }
      } else {
        g.dot(xa, yc, 7, COL.stone);
        if (k2 > 0) g.dot(xa, yc, 7 * k2, COL.ink);
        if (u > 0.92) g.text(fmt(a), xa, yc - 13, { al: 'center', a: smooth01((u - 0.92) / 0.08) });
      }
    });
  },
  
  map(g, e, u) {
    g.flat = true;                                   
    const foot = DATA.foot, fair = DATA.fair;
    
    let la0 = 99, la1 = -99, lo0 = 999, lo1 = -999;
    for (const [la, lo] of fair) { la0 = Math.min(la0, la); la1 = Math.max(la1, la); lo0 = Math.min(lo0, lo); lo1 = Math.max(lo1, lo); }
    const mg = 0.07; la0 -= mg; lo0 -= mg; la1 += 0.01 + mg; lo1 += 0.01 + mg;
    const kx = Math.cos(24.7 * Math.PI / 180);
    const pad = 8, pb = 26, sw = (lo1 - lo0) * kx, sh = la1 - la0;
    const sc = Math.min((g.W - 2 * pad) / sw, (g.H - pad - pb) / sh);
    const ox = (g.W - sw * sc) / 2, oy = pad + ((g.H - pad - pb) - sh * sc) / 2;
    const px = lo => ox + (lo - lo0) * kx * sc, py = la => oy + (la1 - la - 0.01) * sc, cw = 0.01 * kx * sc, ch = 0.01 * sc;
    const cx = g.W / 2, cy = g.H / 2, R = Math.hypot(g.W, g.H) / 2;
    const col = [COL.stone, COL.sage, COL.ink];
    const reach = d => smooth01((u * 1.25 - d / R * 0.55) * 2.2);
    g.c.save(); g.c.beginPath(); g.c.rect(ox, oy, sw * sc, sh * sc); g.c.clip();
    for (const [la, lo] of foot) {
      const x = px(lo), y = py(la), k = reach(Math.hypot(x - cx, y - cy));
      if (k > 0) g.rect(x, y, Math.max(1, cw - 0.6), Math.max(1, ch - 0.6), COL.pale, 0.75 * k);
    }
    for (const [la, lo, w] of fair) {
      const x = px(lo), y = py(la), k = reach(Math.hypot(x - cx, y - cy) + R * 0.25);
      if (k > 0) g.rect(x, y, Math.max(1, cw - 0.6), Math.max(1, ch - 0.6), col[w], k);
    }
    g.c.restore();
    
    const km5 = 5 / 111.32 * sc;                   
    const bx = AR ? g.W - pad - km5 : pad, by = g.H - 10, a = smooth01((u - 0.6) / 0.4);
    const c = g.c; c.globalAlpha = a; c.strokeStyle = COL.ink; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(bx, by - 4); c.lineTo(bx, by); c.lineTo(bx + km5, by); c.lineTo(bx + km5, by - 4); c.stroke(); c.globalAlpha = 1;
    c.font = g.font({ size: 11.5 }); c.fillStyle = COL.ink; c.globalAlpha = a; c.direction = AR ? 'rtl' : 'ltr';
    c.textAlign = AR ? 'right' : 'left'; c.fillText(ad(L.km || '5 km'), AR ? bx - 8 : bx + km5 + 8, by + 1); c.globalAlpha = 1;
    g.flat = false;
  },
  
  forest(g, e, u) {
    const rows = DATA.eff, names = DATA.effRows;
    const xt = nice(-35, 30, 6);
    const x0 = 10, x1 = g.W - 10, y0 = 34, y1 = g.H - 26;
    const xv = v => x0 + (v - xt.lo) / (xt.hi - xt.lo) * (x1 - x0), rh = (y1 - y0) / rows.length;
    for (const v of xt.ticks) { if (v) g.vline(xv(v), y0 - 6, y1, COL.grid, 1); g.vline(xv(v), y1, y1 + 4, COL.ink, 1.5); g.text((v > 0 ? '+' : '') + fmt(v), xv(v), y1 + 18, { al: 'center' }); }
    g.hline(x0, x1, y1, COL.ink, 1.5);
    g.vline(xv(0), y0 - 22, y1, COL.mute, 1.5, [5, 4]);
    g.text(L.zero || 'no effect', xv(0) + 6, y0 - 12, { size: 12, color: COL.mute });
    const c = g.c;
    rows.forEach((r, i) => {
      const [, , est, lo, hi, p] = r, hot = i === 0;
      const yc = y0 + (i + 0.62) * rh, k = ease(clamp(u * 1.6 - i * 0.18, 0, 1));
      g.text(names[i], x0, yc - 13, { size: 12.5, w: hot ? 750 : 600, color: hot ? COL.accT : COL.ink });
      if (k <= 0) return;
      const col = hot ? COL.acc : COL.ink;
      c.strokeStyle = col; c.lineWidth = hot ? 3 : 2; c.globalAlpha = 1;
      c.beginPath(); c.moveTo(g.X(lerp(xv(est), xv(lo), k)), yc); c.lineTo(g.X(lerp(xv(est), xv(hi), k)), yc); c.stroke();
      [lo, hi].forEach(v => { const xx = lerp(xv(est), xv(v), k); c.beginPath(); c.moveTo(g.X(xx), yc - 5); c.lineTo(g.X(xx), yc + 5); c.stroke(); });
      g.dot(xv(est), yc, hot ? 5.5 : 4.5, col);
      if (k > 0.95) {
        
        
        const ps = 'p = ' + fmt(p, p < 0.1 ? 3 : 2);
        const t = (est > 0 ? '+' : '') + fmt(est, 1) + PCT + '   ' + ps, tc = hot ? COL.accT : col;
        const tx = xv(hi) + 10, room = x1 - tx;
        if (room > g.measure(t, { size: 12 }) + 4) g.text(t, tx, yc + 4, { size: 12, color: tc, w: hot ? 750 : 600 });
        else g.text(t, x1, yc - 13, { size: 12, color: tc, w: hot ? 750 : 600, al: 'end' });
      }
    });
  },
  
  fan(g, e, u) {
    const F0 = DATA.fore, obs = F0.obs, n = obs.length, m = F0.y.length, N = n + m;
    const yt = nice(0, Math.max(...obs, ...F0.hi) * 1.04, 4, true), F = g.frame(yt, { padT: 24 });
    const xh = h => F.x0 + (h + 0.5) / N * (F.x1 - F.x0), c = g.c;
    g.axes(F, yt, [[xh(12), L.d2 || '2 Nov'], [xh(36), L.d3 || '3 Nov'], [xh(60), L.d4 || '4 Nov'], [xh(84), L.d5 || '5 Nov']]);
    [24, 48, 72].forEach(h => g.vline(xh(h - 0.5), F.y0, F.y1, COL.grid, 1));
    const xs = xh(n - 0.5);
    g.vline(xs, F.y0 - 14, F.y1, COL.mute, 1.25, [2, 3]);
    g.text(L.fcl || 'forecast', xs + 6, F.y0 - 6, { size: 12, color: COL.mute });
    g.clipTo(F, e);
    
    const band = [...F0.hi.map((v, i) => [xh(n + i), F.yv(v)]), ...F0.lo.map((v, i) => [xh(n + i), F.yv(v)]).reverse()];
    g.path(band, true); c.fillStyle = COL.pale; c.globalAlpha = 0.8; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = COL.ink; c.lineWidth = 1.6; g.path(obs.map((v, h) => [xh(h), F.yv(v)])); c.stroke();
    c.strokeStyle = COL.sage; c.lineWidth = 2; c.setLineDash([5, 4]); g.path([[xh(n - 1), F.yv(obs[n - 1])], ...F0.y.map((v, i) => [xh(n + i), F.yv(v)])]); c.stroke(); c.setLineDash([]);
    c.restore();
  },
  
  mase(g, e, u) {
    const rows = DATA.mase, xt = nice(0, 1, 5, true);
    const nw = Math.max(...rows.map(r => g.measure(r[0], { w: 650 })));
    const x0 = Math.ceil(nw + 14), x1 = g.W - 44, y0 = 24, y1 = g.H - 26, c = g.c;
    const xv = v => x0 + (v - xt.lo) / (xt.hi - xt.lo) * (x1 - x0), rh = (y1 - y0) / rows.length, bh = Math.min(20, rh * 0.56);
    for (const v of xt.ticks) { if (v !== xt.lo) g.vline(xv(v), y0, y1, COL.grid, 1); g.vline(xv(v), y1, y1 + 4, COL.ink, 1.5); g.text(fmt(v, xt.dec), xv(v), y1 + 18, { al: 'center' }); }
    g.hline(x0 - 0.75, x1, y1, COL.ink, 1.5); g.vline(x0, y0 - 2, y1, COL.ink, 1.5);
    rows.forEach(([nm, v, key], i) => {
      const yc = y0 + (i + 0.5) * rh, k = ease(clamp(u * 1.3 - i * 0.06, 0, 1)), hot = key === 'SARIMA', w = (xv(v) - x0) * k;
      g.text(nm, x0 - 8, yc + 4, { al: 'end', w: hot ? 750 : 650, color: hot ? COL.accT : COL.ink });
      g.rect(x0, yc - bh / 2, w, bh, hot ? COL.acc : COL.ink, hot ? 1 : 0.72);
      if (k > 0.95) g.text(fmt(v, 2), x0 + w + 6, yc + 4, { color: hot ? COL.accT : COL.ink, w: hot ? 750 : 650 });
    });
    g.vline(xv(1), y0 - 8, y1, COL.mute, 1.25, [5, 4]);
  },
  
  flow(g, e, u) {
    const f = DATA.flow, c = g.c;
    const narrow = g.W < 520;
    const bwL = narrow ? Math.min(150, g.W * 0.44) : Math.min(190, g.W * 0.36), bwR = narrow ? Math.min(130, g.W * 0.38) : Math.min(170, g.W * 0.32);
    const xL = 2, xR = g.W - bwR - 2, top = 6, gap = 8;
    const hL = (g.H - top - 6 - gap * 5) / 6, yL = i => top + i * (hL + gap);
    
    const feeds = [[0], [1, 2, 3], [4, 5]], hR = Math.min(hL * 1.15, 64);
    const yR = j => { const a = feeds[j][0], b = feeds[j][feeds[j].length - 1]; return (yL(a) + yL(b) + hL) / 2 - hR / 2; };
    const role = [[0, 0, 1], [1, 1, 1], [2, 1, 0], [3, 1, 0], [4, 2, 1], [5, 2, 0]];   
    
    role.forEach(([i, j, main], q) => {
      const k = ease(clamp(u * 1.5 - 0.25 - q * 0.06, 0, 1));
      if (k <= 0) return;
      const sx = xL + bwL, sy = yL(i) + hL / 2, ex = xR, ey = yR(j) + hR / 2, mx = (sx + ex) / 2;
      c.save(); c.beginPath(); const cw = (ex - sx) * k; c.rect(AR ? g.W - sx - cw : sx, 0, cw, g.H); c.clip();
      c.strokeStyle = main ? COL.ink : COL.stone; c.lineWidth = main ? 2.5 : 1.5; c.setLineDash(main ? [] : [4, 4]);
      c.beginPath(); c.moveTo(g.X(sx), sy); c.bezierCurveTo(g.X(mx), sy, g.X(mx), ey, g.X(ex), ey); c.stroke(); c.restore();
    });
    
    const box = (x, y, w, h, name, n, strong, a) => {
      g.rect(x, y, w, h, strong ? COL.ink : '#e8e4da', a);
      const tc = strong ? COL.bg : COL.ink;
      g.text(LRI + name + PDI, x + 10, y + h / 2 - 2, { size: narrow ? 11 : 12.5, w: 700, color: tc, a });
      g.text(fmt(n) + ' ' + (L.rows || 'rows'), x + 10, y + h / 2 + 14, { size: narrow ? 11 : 12, w: 550, color: strong ? '#cdc7bb' : COL.mute, a });
    };
    f.ln.forEach((nm, i) => box(xL, yL(i), bwL, hL, nm, f.l[i], false, smooth01(u * 3 - i * 0.2)));
    f.rn.forEach((nm, j) => box(xR, yR(j), bwR, hR, nm, f.r[j], true, smooth01((u - 0.55) * 3 - j * 0.2)));
    
    if (u > 0.85) {
      const a = smooth01((u - 0.85) / 0.15), y = yR(2) + hR + 16;
      g.text(fmt(f.out) + ' ' + (L.out || 'older versions, left out'), xR, y, { size: 11.5, color: COL.mute, a });
    }
  },
  
  month(g, e, u) {
    const s = DATA.monthly, n = s.length, c = g.c;
    const yt = nice(0, Math.max(...s.map(r => r[1])) / 1e6 * 1.06, 4, true), F = g.frame(yt, { padT: 12 });
    const step = (F.x1 - F.x0) / n, bw = Math.max(2, step * 0.7), xd = i => F.x0 + (i + 0.5) * step;
    const xt = []; s.forEach((r, i) => { if (r[0].endsWith('-01')) xt.push([xd(i), r[0].slice(0, 4)]); });
    g.axes(F, yt, xt);
    s.forEach((r, i) => {
      const k = ease(clamp(u * 1.4 - i / n * 0.4, 0, 1)), h = (F.y1 - F.yv(r[1] / 1e6)) * k, x = xd(i) - bw / 2;
      const partial = i === 0 || i === n - 1;
      if (partial) { g.rect(x, F.y1 - h, bw, h, COL.pale, 1); hatch(g, x, F.y1 - h, bw, h, COL.mute, 0.6); }
      else g.rect(x, F.y1 - h, bw, h, COL.ink, 0.78);
    });
  },
  
  seg(g, e, u) {
    const rows = DATA.seg, tot = DATA.segTot;
    
    const raw = rows.map(r => r[1] / tot * 100), base = raw.map(Math.floor); let left = 100 - base.reduce((a, b) => a + b, 0);
    raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
    const cells = []; base.forEach((n, i) => { for (let k = 0; k < n; k++) cells.push(i); });
    const cols = [COL.ink, COL.stone, COL.sage];
    const side = Math.min((g.H - 8) / 10, (g.W * 0.6) / 10), gp = Math.max(2, side * 0.14), sq = side - gp;
    const ox = 2, oy = 4;
    cells.forEach((w, q) => {
      const r = Math.floor(q / 10), cc = q % 10, k = smooth01((u * 1.5 - q / 100 * 0.5) * 2.4);
      if (k <= 0) return;
      const z = sq * (0.5 + 0.5 * k);
      g.rect(ox + cc * side + (sq - z) / 2, oy + r * side + (sq - z) / 2, z, z, cols[w], k);
    });
    
    if (u > 0.8) {
      const a = smooth01((u - 0.8) / 0.2), lx = ox + 10 * side + 14; let q = 0;
      const ys = base.map(n => { const r0 = Math.floor(q / 10), r1 = Math.floor((q + n - 1) / 10); q += n; return oy + (r0 + r1) / 2 * side + sq / 2; });
      for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + 40);
      const over = ys[ys.length - 1] + 24 - g.H; if (over > 0) for (let i = 0; i < ys.length; i++) ys[i] -= over;
      for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - 40);
      base.forEach((n, i) => {
        g.text(fmt(n) + PCT, lx, ys[i] + 2, { size: 20, w: 800, color: COL.ink, a });
        g.text(rows[i][0] + SEP + fmt(rows[i][1]), lx, ys[i] + 20, { size: 12.5, w: 600, color: COL.mute, a });
      });
    }
  },
};

const DUR = { map: 1.5, flow: 1.4, seg: 1.3 };


function htmlCharts(finished) {
  const els = [...document.querySelectorAll('.hc')];
  if (finished) { els.forEach(e => e.classList.add('rc-on')); return; }
  const io = new IntersectionObserver(es => {
    for (const en of es) if (en.isIntersecting) { en.target.classList.add('rc-on'); io.unobserve(en.target); }
  }, { threshold: 0.3 });
  els.forEach(e => io.observe(e));
}


function starLinks(finished) {
  const fig = document.querySelector('.star'); if (!fig) return;
  const g = fig.querySelector('.star-g'), svg = fig.querySelector('.star-ln'), NS = 'http://www.w3.org/2000/svg';
  const pairs = [['customer_key', 'dim_customers'], ['product_key', 'dim_products']];
  let drawn = finished;
  function draw() {
    const gb = g.getBoundingClientRect();
    svg.setAttribute('width', gb.width); svg.setAttribute('height', gb.height); svg.setAttribute('viewBox', `0 0 ${gb.width} ${gb.height}`);
    svg.innerHTML = '';
    for (const [col, dim] of pairs) {
      const a = g.querySelector(`.tb.fact li[data-col="${col}"]`), b = g.querySelector(`.tb[data-t="${dim}"] li[data-col="${col}"]`);
      if (!a || !b) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      
      if (!(rb.right <= ra.left || rb.left >= ra.right)) continue;
      const left = rb.right <= ra.left;
      const sx = (left ? ra.left : ra.right) - gb.left, sy = ra.top + ra.height / 2 - gb.top;
      const ex = (left ? rb.right : rb.left) - gb.left, ey = rb.top + rb.height / 2 - gb.top;
      const mx = (sx + ex) / 2, dir = left ? -1 : 1;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`);
      p.setAttribute('class', 'ln');
      svg.appendChild(p);
      
      const foot = document.createElementNS(NS, 'path');
      foot.setAttribute('d', `M${sx + dir * 12},${sy} L${sx},${sy - 6} M${sx + dir * 12},${sy} L${sx},${sy + 6} M${sx + dir * 12},${sy} L${sx},${sy}`);
      foot.setAttribute('class', 'mk');
      const bar = document.createElementNS(NS, 'path');
      bar.setAttribute('d', `M${ex - dir * 8},${ey - 6} L${ex - dir * 8},${ey + 6}`);
      bar.setAttribute('class', 'mk');
      svg.appendChild(foot); svg.appendChild(bar);
    }
    svg.classList.toggle('rc-on', drawn);
  }
  draw();
  if (document.fonts) document.fonts.ready.then(draw);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(draw, 120); });
  if (!finished) {
    const io = new IntersectionObserver(es => { for (const en of es) if (en.isIntersecting) { drawn = true; svg.classList.add('rc-on'); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(fig);
  }
}


const charts = [];
let raf = 0;
function loop() {
  raf = 0;
  const t = performance.now() / 1000; let busy = false;
  for (const ch of charts) {
    if (ch.start < 0 || ch.done) continue;
    ch.u = clamp((t - ch.start) / (DUR[ch.kc] || 1.0), 0, 1);
    ch.render(); if (ch.u >= 1) ch.done = true; else busy = true;
  }
  if (busy) raf = requestAnimationFrame(loop);
}
function init(labels, data) {
  L = labels || {}; DATA = data || {};
  document.querySelectorAll('canvas[data-rc]').forEach((cv, i) => charts.push(new Chart(cv, i)));
  const all = () => charts.forEach(ch => { ch.size(); ch.render(); });
  const finished = RM || SEEKING || !('IntersectionObserver' in window);
  if (finished) charts.forEach(ch => { ch.u = 1; ch.done = true; });
  all();
  if (document.fonts) document.fonts.ready.then(all);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(all, 120); });
  htmlCharts(finished);
  starLinks(finished);
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
window.RC = { init, charts };
})();
