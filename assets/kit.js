



(() => {
'use strict';
const Q = new URLSearchParams(location.search);
const html = document.documentElement;

const AR = html.lang === 'ar';
const SEEKING = Q.has('t') || Q.has('settled');
if (SEEKING) html.classList.add('seek');          
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

const COARSE = matchMedia('(pointer: coarse)').matches;

const DATA = new Proxy({}, { get: (t, k) => (window.KIT_DATA || {})[k] });
const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };


const AD = '٠١٢٣٤٥٦٧٨٩';


function arDigits(s) {
  if (!AR || s == null) return s;
  return String(s).split(/(⁦[^⁩]*⁩)/).map((part, i) => i % 2 ? part : part.replace(/(^|[^A-Za-z\d.,])(\d[\d.,]*\d|\d)(?![A-Za-z\d])/g, (m, pre, num, off, all) =>
    (pre === '-' && off > 0 && /[A-Za-z]/.test(all[off - 1])) ? m :
    pre + num.replace(/(\d)\.(?=\d)/g, '$1٫').replace(/(\d),(?=\d)/g, '$1٬').replace(/\d/g, d => AD[d]))
    .replace(/%/g, '٪').replace(/(^|[\s(])-(?=[٠-٩])/g, '$1−')).join('');
}

const NF = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const fmtInt = n => NF.format(Math.round(n));

function spring(tau, resp, z) {
  if (tau <= 0) return 0;
  const w = 2 * Math.PI / resp;
  if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + z * w / wd * Math.sin(wd * tau));
}

const mkRnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
};






const FACE = AR ? '"Beiruti", "Switzer", sans-serif' : '"Switzer", sans-serif';

const arSize = z => AR && z < 20 ? Math.round(z * 1.1 * 10) / 10 : z;
const DARK = { ink: '#ece8df', acc: '#d9a441', mute: '#a39d90', surf: '#1b1a18', page: '#2a2825' };
const PAPER = { ink: '#1b1a17', acc: '#a8641a', mute: '#645f56', surf: '#e8e4da', page: '#dcd7cb' };
let C = DARK;      

const MEASURE = new Map(), WRAPS = new Map();
if (document.fonts) {
  const forget = () => { MEASURE.clear(); WRAPS.clear(); };
  try { document.fonts.addEventListener('loadingdone', forget); } catch (e) {}
  document.fonts.ready.then(forget);
}

class Scene {
  constructor(cv, spec, opts = {}) {
    this.cv = cv; this.ctx = cv.getContext('2d'); this.spec = spec; this.opts = opts;
    this.mode = 'wait'; this.start = 0; this.speed = 1; this.rewFrom = 0; this.lastT = -1; this.m = null;
  }
  resize() {
    
    
    
    const bc = this.opts.size ? null : this.cv.getBoundingClientRect();
    const r = this.opts.size ? { width: this.opts.size[0], height: this.opts.size[1] } : { width: this.cv.offsetWidth || bc.width, height: this.cv.offsetHeight || bc.height };
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
    this.dpr = Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 2);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.m = this.spec.build(this.W, this.H);
    this.lastT = -1;
  }
  X(x) { return AR ? this.W - x : x; }
  draw(t) {
    if (!this.m) this.resize();
    const c = this.ctx;
    C = this.opts.paper ? PAPER : DARK;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.globalAlpha = 1; c.fillStyle = this.opts.bg || C.surf; c.fillRect(0, 0, this.W, this.H);
    this.spec.draw(this, c, this.m, t);
    c.globalAlpha = 1;
    this.lastT = t;
  }
  
  
  setFont(o) {
    const c = this.ctx, st = (!AR && o.stretch) ? o.stretch : '';
    const f = `${o.w || 500} ${st ? st + ' ' : ''}${arSize(o.size || 13)}px ${FACE}`;
    c.font = f; try { c.fontStretch = st || 'normal'; } catch (e) {}
    return f;
  }
  text(s, x, y, o = {}) {
    const c = this.ctx;
    this.setFont(o);
    c.fillStyle = o.color || C.ink; c.globalAlpha = o.a == null ? 1 : o.a;
    c.direction = AR ? 'rtl' : 'ltr';
    const al = o.al || 'start';
    c.textAlign = al === 'center' ? 'center' : ((al === 'start') !== AR ? 'left' : 'right');
    c.textBaseline = o.base || 'alphabetic';
    c.fillText(arDigits(s), this.X(x), y);
  }
  
  measure(s, o = {}) {
    const f = this.setFont(o), k = f + '|' + s;
    let v = MEASURE.get(k);
    if (v == null) { v = this.ctx.measureText(arDigits(s)).width; if (MEASURE.size > 4000) MEASURE.clear(); MEASURE.set(k, v); }
    return v;
  }
  wrap(s, maxW, o = {}) {
    const k = this.setFont(o) + '|' + Math.round(maxW) + '|' + s;
    const hit = WRAPS.get(k); if (hit) return hit;
    const words = s.split(' '), out = []; let line = '';
    for (const w of words) { const tr = line ? line + ' ' + w : w; if (this.measure(tr, o) > maxW && line) { out.push(line); line = w; } else line = tr; }
    if (line) out.push(line);
    if (WRAPS.size > 1000) WRAPS.clear();
    WRAPS.set(k, out);
    return out;
  }
  para(s, x, y, maxW, lh, o) { const ls = this.wrap(s, maxW, o); ls.forEach((l, i) => this.text(l, x, y + i * lh, o)); return ls.length; }
}


function scatterInto(n, W, H, rnd, sx, sy, sz, off = 0) {
  for (let i = off; i < off + n; i++) {
    sx[i] = W * (0.02 + 0.96 * rnd());
    sy[i] = H * (0.05 + 0.9 * (rnd() * 0.6 + rnd() * 0.4));
    sz[i] = rnd();
  }
}

function pt(sc, x, y, org, z, a, size, col, t, i) {
  const c = sc.ctx;
  const loose = 1 - org;
  const dx = loose * 3.2 * Math.sin(t * 0.8 + i * 1.7), dy = loose * 2.4 * Math.cos(t * 0.6 + i * 2.3);
  const s = size + loose * z * z * 6.5;
  c.globalAlpha = clamp(a * (1 - loose * (0.45 + 0.4 * z)), 0, 1);
  c.fillStyle = col;
  const X = sc.X(x + dx), Y = y + dy;
  if (s > 2.6) { c.beginPath(); c.arc(X, Y, s / 2, 0, 6.2832); c.fill(); }
  else c.fillRect(X - s / 2, Y - s / 2, s, s);
}
function caps(sc, list, t, x, y, o) {
  
  let si = 0; for (let k = 0; k < list.length; k++) if (t >= list[k][0]) si = k;
  list.forEach(([at, s], k) => {
    let a = k === si ? (k === 0 ? 1 : smooth((t - at - 0.1) / 0.2)) : (k === si - 1 ? 1 - smooth((t - list[si][0]) / 0.1) : 0);
    if (a <= 0.002) return;
    const oo = Object.assign({}, o, { a: a * (o.a == null ? 1 : o.a) });
    if (o.maxW) sc.para(s, x, y, o.maxW, Math.round((o.size || 13) * 1.35), oo); else sc.text(s, x, y, oo);
  });
}
const wide = (W, H) => W / H > 1.25;





const REG = AR ? ['الشمال', 'الجنوب', 'الشرق', 'الغرب'] : ['North', 'South', 'East', 'West'];
let NK = null;
function nokiaData() {
  if (NK) return NK;
  const rnd = mkRnd(2407), DAYS = 30, BAD = 17;           
  const n = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;    
  const wkd = d => d % 7;                                  
  const traffic = [                                        
    d => 38 * (1 + 0.04 * d / 29) * (wkd(d) >= 5 ? 1.12 : wkd(d) === 4 ? 1.05 : 1) * (1 + 0.012 * n()),
    d => 21 * [1, 1.03, 1.06, 1.05, 1.01, 0.9, 0.93][wkd(d)] * (1 + 0.018 * n()),
    d => 29 * (wkd(d) >= 5 ? 1.04 : 1) * (d === BAD ? 0.72 : d === BAD + 1 ? 0.93 : 1) * (1 + 0.012 * n()),
    d => 13.5 * (1 + 0.22 * d / 29) * (wkd(d) === 4 ? 1.08 : wkd(d) >= 5 ? 1.18 : 1) * (1 + 0.022 * n()),
  ];
  const cssr = [                                           
    d => 99.42 - (wkd(d) === 5 ? 0.06 : 0) + 0.04 * n(),
    d => 99.1 + 0.09 * n() - (d === 8 ? 0.3 : 0),
    d => d === BAD ? 96.9 : d === BAD + 1 ? 98.62 : 99.3 + 0.05 * n(),
    d => 98.72 + 0.5 * smooth(d / 29) + 0.06 * n(),
  ];
  const drop = [                                           
    d => 0.42 + (wkd(d) >= 5 ? 0.05 : 0) + 0.025 * n(),
    d => 0.58 + 0.06 * n(),
    d => d === BAD ? 1.62 : d === BAD + 1 ? 0.71 : 0.36 + 0.025 * n(),
    d => 0.74 - 0.27 * smooth(d / 29) + 0.035 * n(),
  ];
  const reg = [0, 1, 2, 3].map(r => {
    const o = { traffic: [], cssr: [], drop: [] };
    for (let d = 0; d < DAYS; d++) { o.traffic.push(traffic[r](d)); o.cssr.push(cssr[r](d)); o.drop.push(drop[r](d)); }
    return o;
  });
  NK = { reg, names: REG, days: DAYS, bad: BAD, badReg: 2, target: 98.5, dropMax: 1.0 };
  return NK;
}
const S_NOKIA = {
  
  
  
  dur: 4.7,
  build(W, H) {
    const D = nokiaData(), rnd = mkRnd(612);
    const wd = wide(W, H), s = wd ? clamp(W / 1150, 0.62, 1.25) : clamp(Math.min(W, H * 1.1) / 400, 0.8, 1.75);
    const f = n => wd ? n * s : Math.max(11, n * s);
    const pad = wd ? 24 * s : 14 * s;
    const m = { wd, pad, D, s, f };
    
    const top = pad + f(wd ? 42 : 30);
    const Lr = wd ? { x0: pad, x1: W * 0.7, y0: top, y1: H - pad - f(26) } : { x0: pad, x1: W - pad, y0: top, y1: H - pad - f(52) };
    const g = f(wd ? 12 : 7), pw = (Lr.x1 - Lr.x0 - g) / 2, ph = (Lr.y1 - Lr.y0 - g) / 2;
    m.pages = [0, 1, 2, 3].map(r => ({ x: Lr.x0 + (r % 2) * (pw + g), y: Lr.y0 + Math.floor(r / 2) * (ph + g), w: pw, h: ph }));
    
    m.lab = wd || W > 520;
    m.ch = m.pages.map(p => {
      const ix = f(wd ? 14 : 8), head = f(wd ? 40 : 24), gap = f(wd ? 26 : 8), bot = f(wd ? 12 : 7), lb = m.lab ? f(18) : 0;
      const hh = p.h - head - bot - gap - 2 * lb, h0 = hh * 0.55, h1 = hh - h0;
      const y0 = p.y + head + lb, y1 = y0 + h0 + gap + lb;
      return [{ x0: p.x + ix, x1: p.x + p.w - ix, y0, y1: y0 + h0 }, { x0: p.x + ix, x1: p.x + p.w - ix, y0: y1, y1: y1 + h1 }];
    });
    const Y = (ch, v, lo, hi) => ch.y1 - (v - lo) / (hi - lo) * (ch.y1 - ch.y0);
    m.vy = [];
    for (let r = 0; r < 4; r++) {
      const sr = D.reg[r], c = m.ch[r];
      const tHi = Math.max(...sr.traffic) * 1.1, dHi = Math.max(...sr.drop, D.dropMax) * 1.08;
      m.vy.push([sr.traffic.map(v => Y(c[0], v, 0, tHi)), sr.drop.map(v => Y(c[1], v, 0, dHi))]);
    }
    m.xd = (ch, d) => ch.x0 + (d + 0.5) / D.days * (ch.x1 - ch.x0);
    
    m.N = 4 * 2 * D.days;
    m.sx = new Float32Array(m.N); m.sy = new Float32Array(m.N); m.sz = new Float32Array(m.N); m.dl = new Float32Array(m.N);
    scatterInto(m.N, W, H, rnd, m.sx, m.sy, m.sz);
    for (let r = 0, i = 0; r < 4; r++) for (let k = 0; k < 2; k++) for (let d = 0; d < D.days; d++, i++) m.dl[i] = 0.25 + r * 0.16 + k * 0.12 + d / D.days * 0.35 + rnd() * 0.12;
    
    if (wd) {
      const x0 = W * 0.735, x1 = W - pad, y0 = top + f(58), y1 = Lr.y1 - f(44), rowH = (y1 - y0) / 4;
      m.box = { x0, x1, y0: top, rowH, y1 };
      m.slot = [0, 1, 2, 3].map(r => ({ x: x0, y: y0 + r * rowH + rowH * 0.5 - f(14), w: f(40), h: f(28) }));
    } else {
      const y = H - pad - f(36), x0 = pad, cw = (W - 2 * pad) / 4;
      m.box = { x0, x1: W - pad, y0: y, cw };
      m.slot = [0, 1, 2, 3].map(r => ({ x: x0 + r * cw, y, w: f(24), h: f(16), cw }));
    }
    return m;
  },
  draw(sc, c, m, t) {
    const { W } = sc, D = m.D, wd = m.wd, pad = m.pad, f = m.f;
    const L = AR ? { box: 'البريد الصادر', to: 'تقرير لكل فريق', rep: 'تقرير المؤشرات اليومي', sent: 'أُرسل 07:00', count: 'أُرسلت 4 من 4', syn: 'بيانات توضيحية', day: 'اليوم 18', tr: 'الحركة', dr: 'نسبة الانقطاع' }
      : { box: 'Outbox', to: 'one report per team', rep: 'Daily KPI report', sent: 'Sent 07:00', count: '4 of 4 sent', syn: 'Illustrative data', day: 'day 18', tr: 'Traffic', dr: 'Drop rate' };
    const X = x => sc.X(x);
    const rect = (x, y, w, h) => c.fillRect(AR ? W - x - w : x, y, w, h);
    const TS = 2.85, GAP = 0.3, FLY = 0.6;            
    const shapeU = r => smooth((t - 1.5 - r * 0.12) / 0.7);
    const hotOn = smooth((t - 2.25) / 0.3);
    const tickAt = (x, y, z, a) => { c.globalAlpha = a; c.strokeStyle = C.ink; c.lineWidth = Math.max(1.5, z * 0.16); c.lineCap = 'round'; c.lineJoin = 'round';
      
      const ox = X(x); c.beginPath(); c.moveTo(ox - z * 0.42, y); c.lineTo(ox - z * 0.12, y + z * 0.3); c.lineTo(ox + z * 0.45, y - z * 0.36); c.stroke(); c.lineCap = 'butt'; };
    
    const pageA = smooth((t - 0.05) / 0.45);
    m.pages.forEach((p, r) => {
      c.globalAlpha = pageA; c.fillStyle = C.page;
      const sz = 0.97 + 0.03 * pageA;
      rect(p.x + p.w * (1 - sz) / 2, p.y + p.h * (1 - sz) / 2, p.w * sz, p.h * sz);
      const nameA = smooth((t - 0.35) / 0.4), ix = f(wd ? 14 : 8), ny = p.y + f(wd ? 27 : 17), fs = f(wd ? 17 : 13);
      sc.text(REG[r], p.x + ix, ny, { size: fs, w: 650, a: nameA });
      if (r === D.badReg && hotOn > 0) sc.text(L.day, p.x + ix + sc.measure(REG[r], { size: fs, w: 650 }) + f(10), ny, { size: f(wd ? 14 : 11.5), w: 600, color: C.acc, a: hotOn });
      
      const sent = smooth((t - (TS + r * GAP + FLY)) / 0.25);
      if (sent > 0) tickAt(p.x + p.w - ix - f(8), ny - fs * 0.38, f(wd ? 15 : 11), sent);
      if (m.lab) { const la = nameA * 0.95;
        sc.text(L.tr, p.x + ix, m.ch[r][0].y0 - f(7), { size: f(12), color: C.mute, a: la });
        sc.text(L.dr, p.x + ix, m.ch[r][1].y0 - f(7), { size: f(12), color: C.mute, a: la }); }
    });
    
    for (let r = 0; r < 4; r++) {
      const u = shapeU(r); if (u <= 0) continue;
      const ch = m.ch[r], vy = m.vy[r];
      const a0 = ch[0].y1;
      c.globalAlpha = 0.14 * u; c.fillStyle = C.ink; c.beginPath(); c.moveTo(X(m.xd(ch[0], 0)), a0);
      for (let d = 0; d < D.days; d++) c.lineTo(X(m.xd(ch[0], d)), lerp(a0, vy[0][d], u));
      c.lineTo(X(m.xd(ch[0], D.days - 1)), a0); c.closePath(); c.fill();
      c.lineJoin = 'round'; c.lineWidth = wd ? Math.max(1.3, f(1.5)) : 1.3;
      const last = u * (D.days - 1);
      for (let d = 0; d < Math.ceil(last); d++) {
        const hot = r === D.badReg && (d === D.bad || d + 1 === D.bad) && hotOn > 0.5, fr = Math.min(1, last - d);
        const x1 = m.xd(ch[0], d), y1 = vy[0][d], x2 = m.xd(ch[0], d + 1), y2 = vy[0][d + 1];
        c.globalAlpha = 0.9; c.strokeStyle = hot ? C.acc : C.ink;
        c.beginPath(); c.moveTo(X(x1), y1); c.lineTo(X(lerp(x1, x2, fr)), lerp(y1, y2, fr)); c.stroke();
      }
      const bw = Math.max(1.5, (ch[1].x1 - ch[1].x0) / D.days * 0.62);
      for (let d = 0; d < D.days; d++) {
        const hot = r === D.badReg && d === D.bad, b = ch[1].y1, h = (b - vy[1][d]) * clamp(u * 1.4 - d / D.days * 0.4, 0, 1);
        c.globalAlpha = hot ? 0.95 : 0.55; c.fillStyle = hot && hotOn > 0 ? C.acc : C.ink;
        rect(m.xd(ch[1], d) - bw / 2, b - h, bw, h);
      }
    }
    
    let i = 0;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) for (let d = 0; d < D.days; d++, i++) {
      const s1 = clamp(spring(t - m.dl[i], 0.8, 0.82), -0.2, 1.25);
      const ch = m.ch[r][k], hot = r === D.badReg && d === D.bad && hotOn > 0.2;
      const x = lerp(m.sx[i], m.xd(ch, d), s1), y = lerp(m.sy[i], m.vy[r][k][d], s1);
      const a = hot ? 1 : 0.9 - 0.85 * shapeU(r);
      if (a < 0.02) continue;
      pt(sc, x, y, clamp(s1, 0, 1), m.sz[i], a, hot ? (wd ? f(3.8) : 3) : 1.7, hot ? C.acc : C.ink, t, i);
    }
    
    const boxA = smooth((t - 0.4) / 0.4);
    if (wd) {
      sc.text(L.box, m.box.x0, m.box.y0 + f(16), { size: f(17), w: 650, a: boxA });
      sc.text(L.to, m.box.x0, m.box.y0 + f(36), { size: f(13), color: C.mute, a: boxA });
    }
    const env = (x, y, w, h, a) => {
      c.globalAlpha = a; c.fillStyle = C.page; rect(x, y, w, h);
      c.strokeStyle = C.ink; c.lineWidth = wd ? Math.max(1.1, f(1.3)) : 1.1; c.globalAlpha = a * 0.75; c.beginPath();
      c.moveTo(X(x + 2), y + 2); c.lineTo(X(x + w / 2), y + h * 0.58); c.lineTo(X(x + w - 2), y + 2); c.stroke();
    };
    for (let r = 0; r < 4; r++) {
      const sl = m.slot[r], p = m.pages[r], ts = TS + r * GAP;
      const land = smooth((t - ts - FLY) / 0.2);
      
      if (t < ts + FLY) { c.globalAlpha = 0.18 * boxA; c.fillStyle = C.page; rect(sl.x, sl.y, sl.w, sl.h); }
      const u = clamp((t - ts) / FLY, 0, 1);
      if (u > 0 && u < 1) {
        
        const e = u * u * (3 - 2 * u), lift = Math.sin(Math.PI * e) * (wd ? f(26) : 18);
        const w = lerp(p.w * 0.9, sl.w, e), h = lerp(p.h * 0.9, sl.h, e);
        const cx = lerp(p.x + p.w / 2, sl.x + sl.w / 2, e), cy = lerp(p.y + p.h / 2, sl.y + sl.h / 2, e) - lift;
        c.globalAlpha = 0.85; c.fillStyle = '#3a3733'; rect(cx - w / 2, cy - h / 2, w, h);
        c.globalAlpha = 0.5 * (1 - e); c.fillStyle = C.ink;
        for (let q = 0; q < 3; q++) rect(cx - w * 0.38, cy - h * 0.3 + q * h * 0.25, w * 0.76 * (q === 1 ? 0.7 : 1), Math.max(1, h * 0.05));
      }
      if (land > 0) {
        env(sl.x, sl.y, sl.w, sl.h, land);
        if (wd) {
          const tx = sl.x + sl.w + f(14);
          sc.text(REG[r], tx, sl.y + f(11), { size: f(16), w: 650, a: land });
          sc.text(L.rep, tx, sl.y + f(30), { size: f(13), color: C.mute, a: land });
          sc.text(L.sent, m.box.x1, sl.y + f(11), { size: f(14), w: 600, a: land, al: 'end' });
        } else {
          
          const room = sl.cw - sl.w - f(6) - 4;
          let fz = f(12.5); while (fz > 11 && sc.measure(REG[r], { size: fz, w: 650 }) > room) fz -= 0.5;
          sc.text(REG[r], sl.x + sl.w + f(6), sl.y + sl.h * 0.5 + fz * 0.36, { size: fz, w: 650, a: land });
          const tm = sc.measure(L.sent, { size: f(11.5) }) <= sl.cw - 4 ? L.sent : '07:00';
          sc.text(tm, sl.x, sl.y + sl.h + f(15), { size: f(11.5), color: C.mute, a: land });
        }
      }
    }
    const allIn = smooth((t - (TS + 3 * GAP + FLY + 0.25)) / 0.3);
    if (wd && allIn > 0) { tickAt(m.box.x0 + f(7), m.box.y1 + f(18), f(14), allIn); sc.text(L.count, m.box.x0 + f(24), m.box.y1 + f(24), { size: f(15), w: 650, a: allIn }); }
    
    if (wd) {
      caps(sc, this.capList(), t, pad, pad + f(18), { size: f(18), w: 650, color: C.ink, maxW: W * 0.68 - pad });
      sc.text(L.syn, pad, sc.H - pad + f(4), { size: f(12.5), color: C.mute });
    } else {
      caps(sc, this.capList(), t, pad, pad + f(13), { size: f(13.5), w: 650, color: C.ink, maxW: W - 2 * pad - sc.measure(L.syn, { size: f(11.5) }) - f(10) });
      sc.text(L.syn, W - pad, pad + f(13), { size: f(11.5), color: C.mute, al: 'end' });
    }
  },
  capList() {
    return AR ? [[0, 'ملفات اصطناعية من أربع مناطق'], [1.0, 'معادلات الفريق تصير رسومًا'], [2.8, 'تقرير كل منطقة يذهب إلى فريقها']]
      : [[0, 'Illustrative exports from four regions'], [1.0, 'The team’s KPI formulas become charts'], [2.8, 'Each region’s report goes to its team']];
  },
};








const S_SAMA = {
  dur: 4.4,
  build(W, H) {
    const G = DATA.sama.grid;
    const wd = wide(W, H), pad = wd ? 24 : 16;
    const R = G.rows.length, nw = G.weeks, nLong = G.rows.filter(r => r.start === 0).length;
    const m = { wd, pad, R, nw, nLong, G };
    m.bad = new Set(G.miss.map(([r, w]) => r * 1000 + w));
    m.badW = [...new Set(G.miss.map(x => x[1]))];
    const gapB = wd ? 7 : 5;                                     
    if (wd) {
      
      const nameW = clamp(W * 0.1, 64, 104);
      m.gx0 = pad + nameW; m.gx1 = W - pad;
      m.cw = (m.gx1 - m.gx0) / nw;
      m.gy0 = pad + 62;
      const maxH = H - m.gy0 - pad - 34;                          
      m.ch = Math.min(m.cw * 1.3, (maxH - gapB) / R);             
    } else {
      
      
      const L0 = G.late0, span = Math.max(L0, nw - L0);
      m.gx0 = pad; m.gx1 = W - pad;
      m.cw = (m.gx1 - m.gx0) / span;
      const big = clamp(W * 0.088, 24, 34), gyA = pad + 14 + big + 6 + 22;
      m.showNote = W >= 480 && H >= 480;
      const nl = Math.min(4, Math.ceil(112 * 6.2 / (W - 2 * pad)));
      const reserve = 13 + (m.showNote ? 18 + nl * 14 + 6 : 8) + 14 + pad;   
      const mid = 36;                                                       
      const avail = H - reserve - gyA - mid - gapB;
      m.ch = Math.min(m.cw * 1.1, avail / (nLong + R));
      const used = (nLong + R) * m.ch;
      const y0 = gyA + Math.max(0, (avail - used) / 2);
      m.segs = [{ w0: 0, y0, h: nLong * m.ch }, { w0: L0, y0: y0 + nLong * m.ch + mid, h: R * m.ch + gapB }];
      m.gy0 = y0;
    }
    m.gapB = gapB;
    const sg = w => (m.segs && w >= m.segs[1].w0) ? 1 : 0;
    m.sg = sg;
    m.ry = (r, w) => m.segs ? m.segs[sg(w || 0)].y0 + r * m.ch + (sg(w || 0) === 1 && r >= nLong ? gapB : 0)
                            : m.gy0 + r * m.ch + (r >= nLong ? gapB : 0);
    m.sy0 = w => m.segs ? m.segs[sg(w)].y0 : m.gy0;
    m.gy1 = m.segs ? m.segs[1].y0 + m.segs[1].h : m.ry(R - 1) + m.ch;
    m.sy1 = w => m.segs ? m.segs[sg(w)].y0 + m.segs[sg(w)].h : m.gy1;
    m.wx = w => m.gx0 + (w - (m.segs ? m.segs[sg(w)].w0 : 0)) * m.cw;
    
    m.years = []; let py = 0;
    const d0 = Date.parse(G.w0 + 'T00:00:00Z');
    for (let w = 0; w < nw; w++) { const y = new Date(d0 + w * 7 * 864e5).getUTCFullYear(); if (y !== py) { m.years.push([w, String(y)]); py = y; } }
    
    m.colOk = []; let tot = 0;
    for (let w = 0; w < nw; w++) { let n = 0; for (let r = 0; r < R; r++) { const g = G.rows[r]; if (w >= g.start && w <= g.end) n += m.bad.has(r * 1000 + w) ? 0 : 2; } tot += n; m.colOk.push(tot); }
    
    m.match = tot; m.total = 2 * G.rows.reduce((a, g) => a + g.end - g.start + 1, 0);
    m.matchS = fmtInt(m.match); m.totalS = fmtInt(m.total);
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, wd = m.wd, pad = m.pad, G = m.G, X = x => sc.X(x);
    const rect = (x, y, w, h) => c.fillRect(AR ? W - x - w : x, y, w, h);
    const T0 = 0.75, TS = 2.3;                                    
    const slots = smooth(t / 0.55);
    const sweep = clamp((t - T0) / TS, 0, 1), sx = sweep * (m.nw + 6) - 3;   
    const cw = m.cw, sw = Math.max(1, cw - (cw > 3.2 ? 1 : 0.6)), sh = Math.max(1, m.ch - (m.ch > 3.2 ? 1 : 0.6));
    
    for (const w of m.badW) {
      const on = smooth((sx - w - 0.5) / 1.6);
      if (on <= 0) continue;
      c.globalAlpha = 0.16 * on; c.fillStyle = C.acc;
      const by0 = m.sy0(w);
      rect(m.wx(w) - cw * 0.9, by0 - 6, cw * 2.8, m.ry(m.nLong - 1, w) + m.ch - by0 + 12);
    }
    
    
    const Q = 24, bins = new Map();
    const add = (col, a, x, y) => { if (a <= 0.004) return; const k = col + (Math.round(a * Q)); let b = bins.get(k); if (!b) { b = { col, a: Math.round(a * Q) / Q, xs: [] }; bins.set(k, b); } b.xs.push(AR ? W - x - sw : x, y); };
    for (let r = 0; r < m.R; r++) {
      const g = G.rows[r], yr0 = m.ry(r) + (m.ch - sh) / 2;
      const ra = clamp(slots * 1.6 - r / m.R * 0.6, 0, 1);
      for (let w = g.start; w <= g.end; w++) {
        const x = m.wx(w) + (cw - sw) / 2, y = m.segs ? m.ry(r, w) + (m.ch - sh) / 2 : yr0;
        const f = smooth((sx - w - r / m.R * 0.9) / 1.2);
        const bad = m.bad.has(r * 1000 + w);
        if (f < 1) add(C.page, 0.5 * ra * (1 - f), x, y);
        if (f > 0) add(bad ? C.acc : C.ink, bad ? f : 0.86 * f, x, y);
      }
    }
    const order = [...bins.values()].sort((p, q) => (p.col === C.page ? 0 : 1) - (q.col === C.page ? 0 : 1));
    for (const b of order) {
      c.globalAlpha = b.a; c.fillStyle = b.col; c.beginPath();
      for (let i = 0; i < b.xs.length; i += 2) c.rect(b.xs[i], b.xs[i + 1], sw, sh);
      c.fill();
    }
    
    if (sweep > 0 && sweep < 1) {
      const sw0 = clamp(sx, 0, m.nw), x = X(m.wx(sw0));
      c.globalAlpha = 0.6; c.strokeStyle = C.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(x, m.sy0(sw0) - 8); c.lineTo(x, m.sy1(sw0) + 6); c.stroke();
    }
    
    const ax = smooth((t - 0.2) / 0.5);
    const yy = wd ? m.gy0 - 9 : m.gy1 + 13;
    for (const [w, y] of m.years) {
      sc.text(y, m.wx(w) + (wd ? 3 : 0), wd ? yy : m.sy1(w) + 13, { size: wd ? 11.5 : 10, w: 650, color: C.mute, a: ax, al: 'start' });
      if (wd) { c.globalAlpha = 0.5 * ax; c.fillStyle = C.mute; rect(m.wx(w), yy - 10, 1, 13); }
    }
    const lx = m.wx(G.late0);
    if (wd) {
      c.globalAlpha = 0.55 * ax; c.strokeStyle = C.mute; c.lineWidth = 1; c.setLineDash([2, 3]);
      c.beginPath(); c.moveTo(X(lx - 1.5), m.ry(m.nLong) - 3); c.lineTo(X(lx - 1.5), m.gy1 + 3); c.stroke(); c.setLineDash([]);
    }
    const L = AR ? {
      caps: [[0, 'مربع لكل مدينة وأسبوع: تقرير ساما الأسبوعي مقابل أيام البوابة'], [T0, 'مطابقة أسبوعًا بأسبوع مع تقارير ساما']],
      of: 'من ' + m.totalS + ' رقمًا أسبوعيًا للمدن تساوي تقارير ساما', each: 'في كل مربع رقمان: عدد العمليات وقيمتها',
      wk: '24 إلى 30 مارس 2024', late: 'منذ 29 يونيو 2025 يسرد التقرير 50 مدينة أخرى و«خارج الستين»',
      lateS: '51 صفًا آخر منذ يونيو 2025', lateQ: 'منذ يونيو 2025: المدن العشر و51 صفًا آخر', ten: ['10 مدن', 'في التقرير منذ 2020', '10 مدن، كل أسبوع منذ يناير 2024'],
      note: 'العشرون الباقية أسبوع واحد، 24 إلى 30 مارس 2024: ينقص التقرير نحو نصف يوم السبت 30 مارس.',
      lg: ['يساوي التقرير في حدود التقريب', 'يختلف'], tag: 'بيانات ساما الحقيقية',
    } : {
      caps: [[0, 'One square per city and week: SAMA’s weekly PDF against the portal’s days'], [T0, 'Checked week by week against SAMA’s PDFs']],
      of: 'of ' + m.totalS + ' weekly city figures equal SAMA’s PDFs', each: 'Each square holds two: the number of payments and their value.',
      wk: '24 to 30 Mar 2024', late: 'From 29 Jun 2025 the PDF lists 50 more cities and “outside the 60”',
      lateS: '51 more rows from Jun 2025', lateQ: 'From Jun 2025: the 10 cities and 51 more rows', ten: ['10 cities', 'in the PDF since 2020', '10 cities, every week from Jan 2024'],
      note: 'The 20 that do not are one week, 24 to 30 Mar 2024: the PDF is short by about half of Saturday 30 March.',
      lg: ['Equals the PDF within rounding', 'Differs'], tag: 'Real SAMA data',
    };
    
    const na = smooth((t - 0.15) / 0.5);
    if (wd) {
      const yT = m.gy0, yB = m.ry(m.nLong - 1) + m.ch, xb = m.gx0 - 7;
      c.globalAlpha = 0.6 * na; c.fillStyle = C.mute; rect(xb, yT, 1, yB - yT); rect(xb, yT, 4, 1); rect(xb, yB - 1, 4, 1);
      const ls = sc.wrap(L.ten[1], xb - 7 - pad, { size: 11 }), y0 = (yT + yB) / 2 - (ls.length * 13) / 2 + 3;
      sc.text(L.ten[0], xb - 7, y0, { size: 12, w: 650, color: C.ink, a: na, al: 'end' });
      ls.forEach((l, i) => sc.text(l, xb - 7, y0 + 14 + i * 13, { size: 11, color: C.mute, a: na, al: 'end' }));
    } else {
      sc.text(L.ten[2], m.gx0, m.gy0 - 6, { size: 10, color: C.mute, a: na, al: 'start' });
    }
    const flag = smooth((sx - m.badW[0] - 1.5) / 1.4);
    const cnt = Math.round(m.colOk[clamp(Math.floor(sx), -1, m.nw - 1)] || 0);
    const ca = smooth((t - T0) / 0.35), noteA = smooth((t - (T0 + TS + 0.15)) / 0.45);
    const lgA = smooth((t - (T0 + TS * 0.4)) / 0.4);
    const legend = (x, y, fs) => {
      const q = Math.round(fs * 0.75);
      c.globalAlpha = lgA * 0.86; c.fillStyle = C.ink; rect(x, y - q + 1, q, q);
      sc.text(L.lg[0], x + q + 7, y, { size: fs, color: C.ink, a: lgA });
      const x2 = x + q + 7 + sc.measure(L.lg[0], { size: fs }) + 18;
      c.globalAlpha = lgA; c.fillStyle = C.acc; rect(x2, y - q + 1, q, q);
      sc.text(L.lg[1], x2 + q + 7, y, { size: fs, color: C.acc, a: lgA });
    };
    if (wd) {
      caps(sc, L.caps, t, pad, pad + 14, { size: 13, maxW: W - 2 * pad });
      
      if (flag > 0) {
        sc.text(L.wk, m.wx(m.badW[0]) - 4, m.gy0 - 30, { size: 12, w: 700, color: C.acc, a: flag, al: 'start' });
        c.globalAlpha = 0.7 * flag; c.fillStyle = C.acc; rect(m.wx(m.badW[0]) + m.cw / 2 - 0.5, m.gy0 - 25, 1, 7);
      }
      
      
      const eT = m.ry(m.nLong) + 10, eB = m.gy1 - 44, eW = lx - pad - 40, eH = eB - eT;
      const k = clamp(Math.min(eW / 560, eH / 330), 1, 1.75);
      const bx = pad + (lx - 24 - pad) / 2, bw = Math.min(eW, 560 * k)    , big = clamp(Math.min(eH * 0.3, eW * 0.2), 30, 150);
      const f1 = 13.5 * k, f2 = 12 * k, f3 = 13 * k, l1 = f1 * 1.35, l2 = f2 * 1.35, l3 = f3 * 1.4;
      const c1 = sc.wrap(L.of, bw, { size: f1 }).length, c2 = sc.wrap(L.each, bw, { size: f2 }).length, c3 = sc.wrap(L.note, bw, { size: f3, w: 600 }).length;
      const g1 = big * 0.2 + 8 * k, g3 = 22 * k, hB = big * 0.86 + g1 + c1 * l1 + 2 + c2 * l2 + g3 + c3 * l3;
      const by = eT + Math.max(0, (eH - hB) / 2) + big * 0.86;
      sc.text(fmtInt(cnt), bx, by, { size: big, w: 800, stretch: 'semi-condensed', a: ca, al: 'center' });
      const n1 = sc.para(L.of, bx, by + g1 + f1, bw, l1, { size: f1, a: ca, al: 'center' });
      const n2 = sc.para(L.each, bx, by + g1 + f1 + n1 * l1 + 2, bw, l2, { size: f2, color: C.mute, a: ca, al: 'center' });
      sc.para(L.note, bx, by + g1 + f1 + n1 * l1 + n2 * l2 + g3, bw, l3, { size: f3, w: 600, color: C.acc, a: noteA, al: 'center' });
      
      const lw = Math.min(lx - pad - 30, 230), ln = sc.wrap(L.late, lw, { size: 11.5 }).length;
      sc.para(L.late, lx - 12 - lw, m.gy1 - (ln - 1) * 15 - 2, lw, 15, { size: 11.5, color: C.mute, a: ax });
      legend(pad, H - pad - 2, 12);
      sc.text(L.tag, W - pad, H - pad - 2, { size: 11.5, color: C.mute, al: 'end' });
    } else {
      caps(sc, L.caps, t, pad, pad + 10, { size: 12, maxW: W - 2 * pad });
      const big = clamp(W * 0.088, 24, 34), by = pad + 14 + big + 6;
      sc.text(fmtInt(cnt), pad, by, { size: big, w: 800, stretch: 'semi-condensed', a: ca });
      const bw = sc.measure(m.matchS, { size: big, w: 800, stretch: 'semi-condensed' });
      sc.para(L.of, pad + bw + 10, by - big * 0.55, W - 2 * pad - bw - 10, 14, { size: 11, a: ca });
      
      const yA = m.sy1(0) + 13;
      if (flag > 0) sc.text(L.wk, m.wx(m.badW[0]), yA, { size: 10.5, w: 700, color: C.acc, a: flag, al: 'start' });
      c.globalAlpha = 0.7 * flag; c.fillStyle = C.acc; rect(m.wx(m.badW[0]) + m.cw / 2 - 0.5, m.sy1(0) + 1, 1, 3);
      sc.text(L.lateQ, m.gx0, m.segs[1].y0 - 6, { size: 10, color: C.mute, a: ax * 0.9, al: 'start' });
      const ny = yy + 18;
      const nl = m.showNote ? sc.para(L.note, pad, ny, W - 2 * pad, 14, { size: 11, w: 600, color: C.acc, a: noteA }) : 0;
      legend(pad, m.showNote ? Math.min(H - pad + 2, ny + nl * 14 + 14) : Math.min(H - pad + 2, yy + 20), 10.5);
    }
  },
};





const S_HEART = {
  dur: 4.1,
  build(W, H) {
    const rnd = mkRnd(2025);
    const wd = wide(W, H), pad = wd ? 24 : 16;
    const per = wd ? 1000 : 2000;
    const counts = DATA.heart.map(([y, n]) => Math.round(n / per));
    const N = counts.reduce((a, b) => a + b, 0);
    const m = { wd, pad, per, N, counts };
    if (wd) { m.x0 = W * 0.42; m.x1 = W - pad; m.y0 = pad + 22; m.y1 = H - pad - 40; }
    else {
      
      const big = clamp(W * 0.07, 19, 28), cw3 = (W - 2 * pad) / 3, nl = clamp(Math.ceil(195 / (cw3 - 8)), 2, 4);
      m.x0 = pad; m.x1 = W - pad; m.y0 = pad + 18 + big + 16 + nl * 13 + 12; m.y1 = H - pad - 38;
    }
    const zw = m.x1 - m.x0, zh = m.y1 - m.y0;
    m.sx = new Float32Array(N); m.sy = new Float32Array(N); m.sz = new Float32Array(N);
    scatterInto(N, W, H, rnd, m.sx, m.sy, m.sz);
    const Y = counts.length, g = wd ? 6 : 4, gap25 = wd ? 14 : 10, cmax = Math.max(...counts);
    let best = { p2: 0, kk: 3 };
    for (let kk = 3; kk <= 12; kk++) { const p2 = Math.min((zw - (Y - 1) * g - gap25) / (Y * kk), zh / Math.ceil(cmax / kk)); if (p2 > best.p2) best = { p2, kk }; }
    const { p2, kk } = best; m.p2 = p2; m.kk = kk;
    
    const py = wd ? p2 : Math.min(zh / Math.ceil(cmax / kk), p2 * 1.3); m.py = py;
    const colW = kk * p2, totW = Y * colW + (Y - 1) * g + gap25, yx0 = m.x0 + (zw - totW) / 2;
    m.yx = new Float32Array(N); m.yy = new Float32Array(N); m.dl = new Float32Array(N); m.yr = new Int8Array(N);
    m.colX = []; m.colW = colW;
    let k = 0;
    counts.forEach((n, yi) => {
      const cx = yx0 + yi * (colW + g) + (yi === Y - 1 ? gap25 : 0); m.colX.push(cx);
      for (let j = 0; j < n; j++, k++) {
        m.yx[k] = cx + (j % kk) * p2 + p2 / 2; m.yy[k] = m.y1 - Math.floor(j / kk) * py - py / 2;
        m.dl[k] = 0.15 + yi * 0.07 + rnd() * 0.45; m.yr[k] = yi;
      }
    });
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, wd = m.wd, pad = m.pad, N = m.N, Y = m.counts.length;
    const lit = smooth((t - 2.35) / 0.6);               
    const ds = Math.max(1.2, m.p2 * 0.64);
    for (let k = 0; k < N; k++) {
      const s = clamp(spring(t - m.dl[k], 0.85, 0.86), -0.2, 1.25), org = clamp(s, 0, 1);
      const x = lerp(m.sx[k], m.yx[k], s), y = lerp(m.sy[k], m.yy[k], s), yi = m.yr[k];
      const last = yi === Y - 1, odd = yi % 2 === 0 && !last;
      const a = lerp(0.72, last ? 1 : odd ? 0.92 : 0.26, lit);
      pt(sc, x, y, org, m.sz[k], a, ds, last && lit > 0.5 ? C.acc : C.ink, t, k);
    }
    const la = smooth((t - 1.7) / 0.4), ba = smooth((t - 2.6) / 0.4);
    const yl = m.y1 + 16;
    if (la > 0) {
      sc.text('2011', m.colX[0], yl, { size: 11, w: 650, color: C.mute, a: la });
      sc.text('2025', m.colX[Y - 1] + m.colW, yl, { size: 11, w: 700, color: ba > 0.5 ? C.acc : C.mute, a: la, al: 'end' });
    }
    if (ba > 0) {
      
      const xa = m.colX[0], xb = m.colX[Y - 3] + m.colW, yb = yl + 9;
      c.globalAlpha = ba; c.strokeStyle = C.ink; c.lineWidth = 1;
      c.beginPath(); c.moveTo(sc.X(xa), yb - 4); c.lineTo(sc.X(xa), yb); c.lineTo(sc.X(xb), yb); c.lineTo(sc.X(xb), yb - 4); c.stroke();
      sc.text(AR ? 'تعلّم من السنوات الفردية' : 'learned from the odd years', (xa + xb) / 2, yb + 14, { size: wd ? 11.5 : 10.5, w: 600, a: ba, al: 'center' });
      sc.text(AR ? 'اختُبر مرة' : 'tested once', m.colX[Y - 1] + m.colW, yb + 14, { size: wd ? 11.5 : 10.5, w: 700, color: C.acc, a: ba, al: 'end' });
    }
    const ui = AR ? {
      caps: [[0, fmtInt(DATA.heartTotal) + ' بالغًا، من 2011 إلى 2025'], [0.8, 'كل نقطة ' + fmtInt(m.per) + ' إجابة استبيان'], [1.6, 'عمود لكل استبيان سنوي من CDC'], [2.4, 'تعلّم من السنوات الفردية، واختُبر مرة على 2025']],
      f: [[wd ? fmtInt(DATA.heartTotal) : '6.7 مليون', 'بالغ في مجموعة بيانات واحدة'], ['15', 'استبيانًا سنويًا، من 2011 إلى 2025'], ['0.851', 'ROC-AUC على 2025، سنة لم يرها']],
    } : {
      caps: [[0, fmtInt(DATA.heartTotal) + ' adults, 2011 to 2025'], [0.8, 'One dot is ' + fmtInt(m.per) + ' survey answers'], [1.6, 'One column per yearly CDC survey'], [2.4, 'Learned from the odd years, tested once on 2025']],
      f: [[wd ? fmtInt(DATA.heartTotal) : '6.7M', 'adults in one dataset'], ['15', 'yearly surveys, 2011 to 2025'], ['0.851', 'ROC-AUC on 2025, a year it never saw']],
    };
    const fA = [smooth((t - 0.4) / 0.35), smooth((t - 1.6) / 0.35), smooth((t - 2.95) / 0.35)], cols = [C.ink, C.ink, C.acc];
    if (wd) {
      const big = clamp(W * 0.06, 26, 46), tw = W * 0.37 - pad;
      caps(sc, ui.caps, t, pad, pad + 13, { size: 13, maxW: tw });
      [H * 0.37, H * 0.58, H * 0.79].forEach((y, i) => { if (fA[i] > 0) { sc.text(ui.f[i][0], pad, y, { size: big, w: 800, stretch: 'semi-condensed', color: cols[i], a: fA[i] }); sc.text(ui.f[i][1], pad, y + 19, { size: 13, color: i === 2 ? C.acc : C.ink, a: fA[i] * 0.92 }); } });
    } else {
      const big = clamp(W * 0.07, 19, 28), cw = (W - 2 * pad) / 3;
      caps(sc, ui.caps, t, pad, pad + 10, { size: 12.5 });
      [0, 1, 2].forEach(i => { if (fA[i] > 0) { const x = pad + i * cw; sc.text(ui.f[i][0], x, pad + 18 + big, { size: big, w: 800, stretch: 'semi-condensed', color: cols[i], a: fA[i] }); sc.para(ui.f[i][1], x, pad + 18 + big + 16, cw - 8, 13, { size: 10.5, color: i === 2 ? C.acc : C.ink, a: fA[i] * 0.92 }); } });
    }
  },
};


const S_G4 = {
  dur: 3.8,
  build(W, H) {
    const rnd = mkRnd(4);
    const wd = wide(W, H), pad = wd ? 24 : 16;
    const N = wd ? 2400 : 1300;
    const m = { wd, pad, N };
    if (wd) { m.x0 = W * 0.42; m.x1 = W - pad; m.y0 = pad; m.y1 = H - pad; }
    else { m.x0 = pad; m.x1 = W - pad; m.y0 = H * 0.27; m.y1 = H - 58; }
    const C = wd ? 26 : 24, R = wd ? 20 : 15;
    const cs = Math.min((m.x1 - m.x0) / C, (m.y1 - m.y0) / R);
    m.cs = cs; m.C = C; m.R = R; m.gx = m.x0 + ((m.x1 - m.x0) - C * cs) / 2; m.gy = m.y0 + ((m.y1 - m.y0) - R * cs) / 2;
    
    const lobes = [[0.5, 0.48, 0.36, 0.40, 1], [0.27, 0.27, 0.16, 0.15, 1], [0.58, 0.84, 0.17, 0.12, 1], [0.79, 0.52, 0.12, 0.2, 1], [0.36, 0.72, 0.13, 0.12, 1]];
    const inside = (u, v) => lobes.some(([cx, cy, rx, ry]) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 < 1);
    const dens = (u, v) => 1.0 * Math.exp(-((u - 0.5) ** 2 + (v - 0.45) ** 2) / 0.02) + 0.55 * Math.exp(-((u - 0.4) ** 2 + (v - 0.63) ** 2) / 0.012) + 0.5 * Math.exp(-((u - 0.62) ** 2 + (v - 0.3) ** 2) / 0.01) + 0.06;
    m.cells = []; let wsum = 0;
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const u = (i + 0.5) / C, v = (j + 0.5) / R;
      const jitter = (rnd() - 0.5) * 0.06;
      if (!inside(u + jitter, v + jitter)) continue;
      const w = dens(u, v); wsum += w; m.cells.push({ i, j, w, cum: wsum, n: 0 });
    }
    m.sx = new Float32Array(N); m.sy = new Float32Array(N); m.sz = new Float32Array(N);
    scatterInto(N, W, H, rnd, m.sx, m.sy, m.sz);
    m.tx = new Float32Array(N); m.ty = new Float32Array(N); m.cx = new Float32Array(N); m.cy = new Float32Array(N);
    m.dl = new Float32Array(N); m.sent = new Uint8Array(N); m.ft = new Float32Array(N); m.cell = new Int16Array(N);
    for (let k = 0; k < N; k++) {
      const r = rnd() * wsum; let lo = 0, hi = m.cells.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (m.cells[mid].cum < r) lo = mid + 1; else hi = mid; }
      const cell = m.cells[lo];
      m.cell[k] = lo;
      m.tx[k] = m.gx + (cell.i + 0.15 + rnd() * 0.7) * cs; m.ty[k] = m.gy + (cell.j + 0.15 + rnd() * 0.7) * cs;
      m.cx[k] = m.gx + (cell.i + 0.5) * cs; m.cy[k] = m.gy + (cell.j + 0.5) * cs;
      m.dl[k] = 0.05 + rnd() * 0.85;
      m.sent[k] = rnd() < 0.236 ? 1 : 0;      
      m.ft[k] = 1.65 + rnd() * 0.45;
      if (!m.sent[k]) cell.n++;
    }
    m.nmax = Math.max(...m.cells.map(c => c.n));
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, wd = m.wd, pad = m.pad, cs = m.cs;
    
    const gridA = smooth((t - 0.45) / 0.5), denU = smooth((t - 2.55) / 0.7);
    for (const cell of m.cells) {
      const x = m.gx + cell.i * cs, y = m.gy + cell.j * cs;
      c.globalAlpha = gridA; c.fillStyle = C.page; c.fillRect(sc.X(AR ? x + cs - 1 : x), y, cs - 1, cs - 1);
      if (denU > 0) { c.globalAlpha = denU * (0.06 + 0.86 * Math.pow(cell.n / m.nmax, 0.75)); c.fillStyle = C.ink; c.fillRect(sc.X(AR ? x + cs - 1 : x), y, cs - 1, cs - 1); }
    }
    const yel = smooth((t - 1.35) / 0.2);
    for (let k = 0; k < m.N; k++) {
      const s = clamp(spring(t - m.dl[k], 0.85, 0.82), -0.2, 1.25);
      let x = lerp(m.sx[k], m.tx[k], s), y = lerp(m.sy[k], m.ty[k], s);
      let a = 0.85, col = C.ink;
      if (m.sent[k]) {
        if (yel > 0.5) col = C.acc;
        const ft = t - m.ft[k];
        if (ft > 0) { y += 0.5 * 1100 * ft * ft; a *= 1 - smooth(ft / 0.55); }
        if (a < 0.01 || y > H + 10) continue;
      } else if (denU > 0) {
        x = lerp(x, m.cx[k], denU); y = lerp(y, m.cy[k], denU); a *= 1 - denU;
        if (a < 0.01) continue;
      }
      pt(sc, x, y, clamp(s, 0, 1), m.sz[k], a, 1.7, col, t, k);
    }
    const ui = AR ? {
      caps: [[0, '2,725,353 قراءة من الهواتف، قبل وضعها'], [0.6, 'وُضعت على شبكة خلايا 1 كم'], [1.35, 'قيم حارسة: 2147483647 تعني لا قراءة'], [2.5, 'القراءات في كل خلية بعد التنظيف']],
      lab: 'قيم حارسة، حُذفت أولًا', find: 'حركة البيانات تتبع الكثافة السكانية', sub: '⁦+10 dB⁩ في الإشارة، الخلية والساعة نفسها: ⁦−2.4%⁩ في الحركة، ⁦p = 0.57⁩',
      tag: 'المواقع توضيحية، والأرقام من التدقيق الحقيقي',
    } : {
      caps: [[0, '2,725,353 handset readings, not placed'], [0.6, 'Placed on a 1 km grid'], [1.35, 'Sentinel values: 2147483647 means no reading'], [2.5, 'Readings left in each cell']],
      lab: 'sentinel values, removed first', find: 'Traffic follows population density', sub: '+10 dB signal, same cell and hour: −2.4% traffic, p = 0.57',
      tag: 'Positions illustrative, numbers from the real audit',
    };
    const pc = (23.6 * smooth((t - 1.45) / 0.8)).toFixed(1) + '%', pa = smooth((t - 1.45) / 0.25), fa = smooth((t - 2.75) / 0.4);
    if (wd) {
      const big = clamp(W * 0.074, 30, 56), tw = W * 0.37 - pad;
      caps(sc, ui.caps, t, pad, pad + 13, { size: 13, maxW: tw });
      sc.text(pc, pad, H * 0.40, { size: big, w: 800, stretch: 'semi-condensed', color: C.acc, a: pa });
      sc.text(ui.lab, pad, H * 0.40 + 22, { size: 13.5, color: C.acc, a: pa });
      const n = sc.para(ui.find, pad, H * 0.62, tw, 27, { size: clamp(W * 0.034, 18, 25), w: 750, a: fa });
      sc.para(ui.sub, pad, H * 0.62 + n * 27 + 4, tw, 17, { size: 12.5, color: C.ink, a: fa * 0.85 });
      sc.para(ui.tag, pad, H - pad, tw, 16, { size: 12, color: C.mute });
    } else {
      const big = clamp(W * 0.09, 24, 34);
      caps(sc, ui.caps, t, pad, pad + 10, { size: 12.5 });
      sc.text(pc, pad, pad + 14 + big, { size: big, w: 800, stretch: 'semi-condensed', color: C.acc, a: pa });
      const bw = sc.measure('23.6%', { size: big, w: 800, stretch: 'semi-condensed' });
      sc.text(ui.lab, pad + bw + 12, pad + 14 + big - 6, { size: 12, color: C.acc, a: pa });
      sc.text(ui.find, pad, H - 34, { size: 15, w: 750, a: fa });
      sc.text(ui.sub, pad, H - pad + 1, { size: 11, color: C.ink, a: fa * 0.85 });
      sc.text(ui.tag, pad, H - pad + 1, { size: 11, color: C.mute, a: 1 - fa });
    }
  },
};


const S_WEEK = {
  dur: 1.6,
  build(W, H) {
    const rnd = mkRnd(1110);
    const v = DATA.week.value_k, per = 50000;
    const counts = v.map(x => Math.round(x / per));
    const N = counts.reduce((a, b) => a + b, 0);
    const m = { N, counts };
    m.sx = new Float32Array(N); m.sy = new Float32Array(N); m.sz = new Float32Array(N);
    scatterInto(N, W, H - 16, rnd, m.sx, m.sy, m.sz);
    m.tx = new Float32Array(N); m.ty = new Float32Array(N); m.dl = new Float32Array(N);
    const colW = W / 7, p = Math.min(4.2, (colW - 10) / 3), base = H - 20;
    let k = 0;
    counts.forEach((n, d) => { const cx = colW * d + colW / 2 - p * 1.5; for (let j = 0; j < n; j++, k++) {
      m.tx[k] = cx + (j % 3) * p + p / 2; m.ty[k] = base - Math.floor(j / 3) * p - p / 2; m.dl[k] = 0.05 + d * 0.08 + rnd() * 0.25;
    } });
    m.p = p; m.colW = colW;
    return m;
  },
  draw(sc, c, m, t) {
    for (let k = 0; k < m.N; k++) {
      const s = clamp(spring(t - m.dl[k], 0.75, 0.85), -0.2, 1.25);
      pt(sc, lerp(m.sx[k], m.tx[k], s), lerp(m.sy[k], m.ty[k], s), clamp(s, 0, 1), m.sz[k] * 0.4, 0.9, m.p * 0.6, C.ink, t, k);
    }
    const days = AR ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach((d, i) => sc.text(d, m.colW * i + m.colW / 2, sc.H - 3, { size: 11, color: C.mute, al: 'center', a: smooth((t - 0.6) / 0.4) }));
  },
};






const SQLF = [   
  ['CRM customers', 'عملاء CRM', 'cust_info.csv', 18494, 18484, '10 rows dropped', 'حُذف 10 صفوف', 'c'],
  ['ERP customers', 'عملاء ERP', 'CUST_AZ12.csv', 18484, 18484, '“NAS” off 11,042 IDs', 'حُذفت «NAS» من 11,042 معرّفًا', 'c'],
  ['ERP locations', 'مواقع ERP', 'LOC_A101.csv', 18484, 18484, 'dashes out of every ID', 'حُذفت الشرطات من كل معرّف', 'c'],
  ['CRM sales', 'مبيعات CRM', 'sales_details.csv', 60398, 60398, '23 sales recomputed', 'أُعيد حساب 23 مبيعة', 's'],
  ['CRM products', 'منتجات CRM', 'prd_info.csv', 397, 397, '200 end dates recomputed', 'أُعيد حساب 200 تاريخ نهاية', 'p'],
  ['ERP categories', 'فئات ERP', 'PX_CAT_G1V2.csv', 37, 37, '', '', 'p'],
];
const SRC_ROWS = SQLF.reduce((a, r) => a + r[3], 0);   


const SQLG = {
  c: ['dim_customers', 18484, ['customer_key', 'customer_number', 'first_name', 'last_name', 'country', 'gender', 'birthdate']],
  s: ['fact_sales', 60398, ['order_number', 'customer_key', 'product_key', 'order_date', 'shipping_date', 'due_date', 'sales_amount', 'quantity', 'price']],
  p: ['dim_products', 295, ['product_key', 'product_name', 'category', 'subcategory', 'cost', 'product_line']],
};
const S_SQL = {
  dur: 4.6,
  build(W, H) {
    const wd = wide(W, H), m = { wd };
    if (wd) {
      const s = clamp(W / 1150, 0.62, 1.25), pad = 26 * s;
      Object.assign(m, { s, pad });
      const top = pad + 52 * s, bot = H - pad, av = W - 2 * pad, gap = av * 0.06;
      const wB = av * 0.235, wS = av * 0.215, wG = av - wB - wS - 2 * gap;
      m.P = [{ x: pad, w: wB }, { x: pad + wB + gap, w: wS }, { x: pad + wB + wS + 2 * gap, w: wG }];
      m.top = top; m.bot = bot;
      const rT = top + 70 * s, rB = bot - 64 * s, rowH = (rB - rT) / 6;
      m.rT = rT; m.rB = rB; m.rowH = rowH; m.yc = SQLF.map((r, i) => rT + (i + 0.5) * rowH);
      
      
      const G = m.P[2], gx0 = G.x + 18 * s, gx1 = G.x + G.w - 18 * s, gw = gx1 - gx0;
      const dimW = gw * 0.42, factW = gw * 0.42, ys = m.yc[3], gh = 13 * s, head = 58 * s, tail = 10 * s;
      const lh = Math.min(22 * s, (ys - gh - (top + 62 * s) - head - tail) / 7, (bot - 40 * s - (ys + gh) - head - tail) / 6, (bot - top - 110 * s - head - tail) / 9);
      m.lh = lh; m.head = head;
      const hC = head + 7 * lh + tail, hP = head + 6 * lh + tail, hS = head + 9 * lh + tail;
      m.card = {
        c: { x: gx0, y: ys - gh - hC, w: dimW, h: hC },
        p: { x: gx0, y: ys + gh, w: dimW, h: hP },
        
        s: { x: gx1 - factW, y: clamp(ys - 4 * s - head - 2.22 * lh + 4 * s, top + 62 * s, bot - 40 * s - hS), w: factW, h: hS },
      };
    } else {
      const s = clamp(Math.min(W, H * 1.1) / 400, 0.8, 1.75), pad = 15 * s;
      Object.assign(m, { s, pad });
      m.fz = n => Math.max(11, n * s);
    }
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, s = m.s;
    const X = x => sc.X(x);
    const rr = (x, y, w, h, r) => { const x0 = AR ? W - x - w : x; c.beginPath(); if (c.roundRect) c.roundRect(x0, y, w, h, r); else c.rect(x0, y, w, h); };
    const T = AR ? {
      title: 'ستة ملفات خام تصير نموذجًا نجميًا واحدًا، مفحوصًا بعد كل طبقة',
      st: [['البرونزي', 'خام، كما وصلت'], ['الفضي', 'منظّفة وموحّدة'], ['الذهبي', 'نموذج نجمي']],
      rows: 'صفًا', tot: 'صفًا في 6 ملفات من نظامين', chk: 'كل فحص: 0 صفوف عائدة', clean: 'قُصّت المسافات، وصُحّحت الأنواع، وأُزيل التكرار',
      link: 'كل مبيعة مرتبطة بعميلها ومنتجها', short: { c: 'العملاء', s: 'المبيعات', p: 'المنتجات' },
    } : {
      title: 'Six raw files become one star schema, checked after every layer',
      st: [['Bronze', 'raw, as they arrive'], ['Silver', 'cleaned and standardised'], ['Gold', 'star schema']],
      rows: 'rows', tot: 'rows in 6 files from 2 systems', chk: 'Every check: 0 rows back', clean: 'Trimmed, typed, deduplicated',
      link: 'Every sale linked to its customer and product', short: { c: 'Customers', s: 'Sales', p: 'Products' },
    };
    const ink = C.ink, mute = C.mute, acc = C.acc, edge = '#4a4640', card = '#1f1e1b';
    const segs = pts => { let L = 0; const sg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); sg.push(l); L += l; } return [sg, L]; };
    const at = (pts, sg, q) => { let k = 0; while (k < sg.length - 1 && q > sg[k]) { q -= sg[k]; k++; } const v = sg[k] ? clamp(q / sg[k], 0, 1) : 0;
      return [lerp(pts[k][0], pts[k + 1][0], v), lerp(pts[k][1], pts[k + 1][1], v)]; };
    
    const dots = (pts, a, z = 1.5, step = 5) => { if (a <= 0) return; const [sg, L] = segs(pts); c.globalAlpha = a; c.fillStyle = ink;
      for (let d = 0; d <= L; d += step) { const [x, y] = at(pts, sg, d); c.fillRect(X(x) - z / 2, y - z / 2, z, z); } };
    const curve = (x1, y1, x2, y2, n = 18) => { const out = []; for (let i = 0; i <= n; i++) { const u = i / n, e = u * u * (3 - 2 * u); out.push([lerp(x1, x2, u), lerp(y1, y2, e)]); } return out; };
    
    const flow = (pts, t0, n, dur = 0.55, z = 2.6) => { const [sg, L] = segs(pts);
      for (let j = 0; j < n; j++) { const u = (t - t0 - j * 0.07) / dur; if (u <= 0 || u >= 1) continue;
        const [x, y] = at(pts, sg, smooth(u) * L); c.globalAlpha = 0.95 * Math.pow(Math.sin(Math.PI * u), 0.4); c.fillStyle = ink;
        c.beginPath(); c.arc(X(x), y, z, 0, 6.2832); c.fill(); } };
    const tick = (x, y, z, a, col) => { if (a <= 0) return; c.globalAlpha = a; c.strokeStyle = col || ink; c.lineWidth = Math.max(1.4, z * 0.15); c.lineCap = 'round'; c.lineJoin = 'round';
      const o = X(x), d = AR ? -1 : 1; c.beginPath(); c.moveTo(o - z * 0.42, y - z * 0.02); c.lineTo(o - z * 0.12, y + z * 0.28); c.lineTo(o + z * 0.45, y - z * 0.36); c.stroke(); c.lineCap = 'butt'; return d; };
    const nFor = n => Math.max(2, Math.round(Math.log10(n) * 2.2));          
    const count = (n, t0, d = 0.6) => fmtInt(n * smooth((t - t0) / d));
    const ttl = smooth((t - 0.05) / 0.4);

    if (m.wd) {
      const P = m.P, f = n => n * s;
      sc.text(T.title, m.pad, m.pad + f(19), { size: f(20), w: 650, a: ttl });
      const T0 = [0.25, 1.35, 2.5];
      
      P.forEach((p, k) => {
        const a = smooth((t - T0[k] + 0.2) / 0.4); if (a <= 0) return;
        c.globalAlpha = a; c.fillStyle = C.page; rr(p.x, m.top, p.w, m.bot - m.top, f(8)); c.fill();
        sc.text(T.st[k][0], p.x + f(16), m.top + f(30), { size: f(17), w: 650, a });
        sc.text(T.st[k][1], p.x + f(16), m.top + f(50), { size: f(13), color: mute, a });
      });
      const B = P[0], S = P[1];
      
      SQLF.forEach((r, i) => {
        const y = m.yc[i], t0 = T0[0] + 0.15 + i * 0.1, a = smooth((t - t0) / 0.35); if (a <= 0) return;
        sc.text(AR ? r[1] : r[0], B.x + f(16), y - f(8), { size: f(14.5), w: 600, a });
        sc.text(count(r[3], t0), B.x + B.w - f(16), y - f(8), { size: f(14.5), w: 600, a, al: 'end' });
        sc.text(r[2], B.x + f(16), y + f(11), { size: f(12), color: mute, a });
        const bw = (B.w - f(32)) * Math.max(0.012, r[3] / 60398) * smooth((t - t0 - 0.1) / 0.5);
        c.globalAlpha = 0.55 * a; c.fillStyle = ink; c.fillRect(AR ? W - (B.x + f(16)) - bw : B.x + f(16), y + f(19), bw, Math.max(2, f(3)));
      });
      const totA = smooth((t - 1.0) / 0.4);
      sc.text(fmtInt(SRC_ROWS), B.x + f(16), m.bot - f(30), { size: f(26), w: 600, a: totA });
      sc.text(T.tot, B.x + f(16), m.bot - f(12), { size: f(12.5), color: mute, a: totA });
      
      SQLF.forEach((r, i) => {
        const y = m.yc[i] - f(4), pts = [[B.x + B.w + f(6), y], [S.x - f(6), y]], t0 = T0[1] - 0.25 + i * 0.06;
        flow(pts, t0, nFor(r[3]));
        dots(pts, 0.4 * smooth((t - t0 - 0.4) / 0.4), Math.max(1.2, f(1.4)));
      });
      
      SQLF.forEach((r, i) => {
        const y = m.yc[i], t0 = T0[1] + 0.25 + i * 0.08, a = smooth((t - t0) / 0.35); if (a <= 0) return;
        tick(S.x + f(24), y - f(13), f(13), a);
        sc.text(fmtInt(r[4]), S.x + f(40), y - f(8), { size: f(14.5), w: 600, a });
        if (r[5]) sc.text(AR ? r[6] : r[5], S.x + f(40), y + f(11), { size: f(12), color: mute, a });
      });
      const ckA = smooth((t - 2.15) / 0.4);
      tick(S.x + f(24), m.bot - f(35), f(13), ckA);
      sc.text(T.chk, S.x + f(40), m.bot - f(30), { size: f(13.5), w: 600, a: ckA });
      sc.text(T.clean, S.x + f(16), m.bot - f(12), { size: f(12.5), color: mute, a: ckA });
      
      const cd = m.card, gA = n => smooth((t - T0[2] - n * 0.18) / 0.45);
      SQLF.forEach((r, i) => {
        const tb = cd[r[7]], y0 = m.yc[i] - f(4), y1 = r[7] === 's' ? y0 : tb.y + m.head * 0.55 + (r[7] === 'c' ? i : i - 4) * m.lh * 0.6;
        const pts = r[7] === 's' ? [[S.x + S.w + f(6), y0], [tb.x - f(6), y0]] : curve(S.x + S.w + f(6), y0, tb.x - f(6), y1);
        const t0 = T0[2] - 0.35 + i * 0.05;
        flow(pts, t0, nFor(r[4]), r[7] === 's' ? 0.75 : 0.55);
        dots(pts, 0.4 * smooth((t - t0 - 0.45) / 0.4), Math.max(1.2, f(1.4)));
      });
      
      ['c', 'p', 's'].forEach((k, n) => {
        const b = cd[k], a = gA(k === 's' ? 2 : n), fact = k === 's', g = SQLG[k]; if (a <= 0) return;
        const yy = b.y + (1 - a) * f(10);
        c.globalAlpha = a; c.fillStyle = card; rr(b.x, yy, b.w, b.h, f(6)); c.fill();
        c.strokeStyle = fact ? acc : edge; c.lineWidth = fact ? Math.max(1.5, f(1.6)) : 1; c.stroke();
        sc.text(g[0], b.x + f(12), yy + f(24), { size: f(15), w: 650, a, color: fact ? acc : ink });
        sc.text(fmtInt(g[1]) + ' ' + T.rows, b.x + f(12), yy + f(42), { size: f(12.5), a, color: fact ? acc : mute });
        c.globalAlpha = a * 0.7; c.fillStyle = edge; c.fillRect(AR ? W - b.x - b.w + f(10) : b.x + f(10), yy + m.head - f(6), b.w - f(20), 1);
        g[2].forEach((col, j) => {
          const ca = a * smooth((t - T0[2] - 0.3 - j * 0.05) / 0.3), key = /_key$/.test(col);
          sc.text(col, b.x + f(12), yy + m.head + (j + 0.72) * m.lh, { size: Math.max(11, f(12.5)), w: key ? 650 : 450, a: ca, color: key ? ink : mute });
        });
      });
      
      const kA = smooth((t - 3.6) / 0.5);
      if (kA > 0) {
        const s0 = cd.s, xm = (cd.c.x + cd.c.w + s0.x) / 2, yS = m.yc[3] - f(4);
        const yc0 = cd.c.y + m.head + 0.72 * m.lh - f(4.4), yp0 = cd.p.y + m.head + 0.72 * m.lh - f(4.4);
        const yfc = s0.y + m.head + 1.72 * m.lh - f(4.4), yfp = s0.y + m.head + 2.72 * m.lh - f(4.4);
        c.strokeStyle = ink; c.lineWidth = Math.max(1.2, f(1.3)); c.globalAlpha = 0.85;
        const el = (xa, ya, xb, yb, xmid) => { const L = Math.abs(xmid - xa) + Math.abs(yb - ya) + Math.abs(xb - xmid);
          c.setLineDash([L * kA, L + 1]); c.beginPath(); c.moveTo(X(xa), ya); c.lineTo(X(xmid), ya); c.lineTo(X(xmid), yb); c.lineTo(X(xb), yb); c.stroke(); c.setLineDash([]); };
        el(cd.c.x + cd.c.w, yc0, s0.x, yfc, xm - f(7));
        el(cd.p.x + cd.p.w, yp0, s0.x, yfp, xm + f(7));
        c.globalAlpha = kA; c.fillStyle = ink;
        [[s0.x, yfc], [s0.x, yfp]].forEach(([x, y]) => { c.beginPath(); c.arc(X(x), y, f(3), 0, 6.2832); c.fill(); });
      }
      const lA = smooth((t - 3.9) / 0.4);
      tick(P[2].x + f(24), m.bot - f(17), f(13), lA);
      sc.text(T.link, P[2].x + f(40), m.bot - f(12), { size: f(13.5), w: 600, a: lA });
    } else {
      
      const fz = m.fz, pad = m.pad, x0 = pad, x1 = W - pad, w = x1 - x0, ip = fz(10);
      let y = pad + fz(15);
      const tl = sc.wrap(T.title, w, { size: fz(15), w: 650 });
      tl.forEach((l, i) => sc.text(l, x0, y + i * fz(19), { size: fz(15), w: 650, a: ttl }));
      y += (tl.length - 1) * fz(19) + fz(14);
      
      const chipH = fz(24), chipG = fz(6), hB = fz(30) + 2 * chipH + chipG + ip, hS = fz(30) + fz(12.5) * 2.9 + ip;
      const avail = H - pad - y, gap = clamp(avail * 0.05, 12, fz(16)), hG = avail - hB - hS - 2 * gap;
      const bands = [{ y, h: hB }, { y: y + hB + gap, h: hS }, { y: y + hB + hS + 2 * gap, h: hG }], T0 = [0.25, 1.3, 2.4];
      bands.forEach((b, k) => { const a = smooth((t - T0[k] + 0.2) / 0.4); if (a <= 0) return;
        c.globalAlpha = a; c.fillStyle = C.page; rr(x0, b.y, w, b.h, fz(6)); c.fill();
        sc.text(T.st[k][0], x0 + ip, b.y + fz(20), { size: fz(14), w: 650, a });
        const nw = sc.measure(T.st[k][0], { size: fz(14), w: 650 }), rw = k === 0 ? sc.measure(fmtInt(SRC_ROWS) + ' ' + T.rows, { size: fz(13), w: 600 }) : 0;
        if (nw + rw + sc.measure(T.st[k][1], { size: fz(12) }) + fz(40) < w) sc.text(T.st[k][1], x0 + fz(18) + nw, b.y + fz(20), { size: fz(12), color: mute, a }); });
      
      const bb = bands[0], bA = smooth((t - 0.45) / 0.4);
      sc.text(fmtInt(SRC_ROWS) + ' ' + T.rows, x1 - ip, bb.y + fz(20), { size: fz(13), w: 600, a: bA, al: 'end' });
      const cwB = (w - 2 * ip - 2 * chipG) / 3, zz = fz(11.5);
      
      const allFit = SQLF.every(r => sc.measure(AR ? r[1] : r[0], { size: zz, w: 600 }) + sc.measure(fmtInt(r[3]), { size: zz }) + fz(26) < cwB);
      SQLF.forEach((r, i) => { const a = smooth((t - 0.4 - i * 0.08) / 0.35); if (a <= 0) return;
        const cx = x0 + ip + (i % 3) * (cwB + chipG), cy = bb.y + fz(30) + Math.floor(i / 3) * (chipH + chipG);
        c.globalAlpha = a; c.fillStyle = card; rr(cx, cy, cwB, chipH, fz(4)); c.fill();
        const nm = AR ? r[1] : r[0], n = fmtInt(r[3]), both = allFit;
        sc.text(nm, cx + fz(7), cy + chipH / 2 + zz * 0.36, { size: zz, w: 600, a });
        if (both) sc.text(n, cx + cwB - fz(7), cy + chipH / 2 + zz * 0.36, { size: zz, color: mute, a, al: 'end' }); });
      
      const sb = bands[1], sA = smooth((t - 1.6) / 0.4), sz = fz(12.5);
      const yck = sb.y + fz(30) + sz * 1.05;
      tick(x0 + fz(18), yck - sz * 0.35, sz, sA);
      sc.text(T.chk, x0 + fz(30), yck, { size: sz, w: 600, a: sA });
      sc.text(T.clean, x0 + ip, yck + sz * 1.55, { size: fz(12), color: mute, a: sA });
      
      for (let k = 0; k < 2; k++) { const ya = bands[k].y + bands[k].h + 3, yb = bands[k + 1].y - 3;
        for (let q = 0; q < 3; q++) { const xx = x0 + w * (0.3 + q * 0.2), pts = [[xx, ya], [xx, yb]], t0 = T0[k + 1] - 0.4 + q * 0.06;
          flow(pts, t0, 4, 0.45, fz(2.2)); dots(pts, 0.45 * smooth((t - t0 - 0.3) / 0.3), 1.6, 4); } }
      
      const gb = bands[2], gy0 = gb.y + fz(32), gy1 = gb.y + gb.h - ip, gh = gy1 - gy0;
      const big = w > 440 && Math.floor((gh - fz(52)) / fz(16.5)) >= 2, gg = fz(big ? 18 : 10), cw = (w - 2 * ip - 2 * gg) / 3, lhC = fz(16.5);
      const order = ['c', 's', 'p'], xs = order.map((k, n) => x0 + ip + n * (cw + gg));
      const need = k => fz(44) + (big ? Math.min(SQLG[k][2].length, Math.floor((gh - fz(52)) / lhC)) * lhC + fz(8) : 0);
      order.forEach((k, n) => {
        const a = smooth((t - T0[2] - (k === 's' ? 0.45 : n * 0.12)) / 0.45); if (a <= 0) return;
        const fact = k === 's', g = SQLG[k], ch = Math.min(gh, need(k)), yy = gy0 + (gh - ch) / 2 + (1 - a) * 8;
        c.globalAlpha = a; c.fillStyle = card; rr(xs[n], yy, cw, ch, fz(5)); c.fill();
        c.strokeStyle = fact ? acc : edge; c.lineWidth = fact ? 1.6 : 1; c.stroke();
        const nz = fz(big ? 13.5 : 13), nm = big && sc.measure(g[0], { size: nz, w: 650 }) <= cw - fz(14) ? g[0] : T.short[k];
        sc.text(nm, xs[n] + fz(8), yy + fz(19), { size: nz, w: 650, a, color: fact ? acc : ink });
        sc.text(fmtInt(g[1]) + (big ? ' ' + T.rows : ''), xs[n] + fz(8), yy + fz(35), { size: fz(12), a, color: fact ? acc : mute });
        if (big) { const room = Math.floor((ch - fz(52)) / lhC);
          
          (k === 's' ? ['customer_key', 'product_key'].concat(g[2].filter(x => !/_key$/.test(x))) : g[2]).slice(0, room).forEach((col, j) => { const key = /_key$/.test(col);
            sc.text(col, xs[n] + fz(8), yy + fz(56) + j * lhC, { size: fz(11.5), a: a * smooth((t - 2.9 - j * 0.05) / 0.3), color: key ? ink : mute, w: key ? 650 : 450 }); }); }
      });
      const kA = smooth((t - 3.5) / 0.45);
      if (kA > 0) { const ym = gy0 + gh / 2; c.globalAlpha = kA; c.strokeStyle = ink; c.lineWidth = 1.4;
        [[xs[0] + cw, xs[1]], [xs[2], xs[1] + cw]].forEach(([xa, xb]) => { c.beginPath(); c.moveTo(X(xa), ym); c.lineTo(X(lerp(xa, xb, kA)), ym); c.stroke(); }); }
    }
  },
};

const SPECS = { 'nokia-kpi': S_NOKIA, sama: S_SAMA, heart: S_HEART, 'riyadh-4g': S_G4, 'sql-dwh': S_SQL };
const ARIA = AR ? {
  'nokia-kpi': 'رسم متحرك ببيانات توضيحية: صفحات تقارير أربع مناطق تمتلئ برسومها، الحركة ونسبة المكالمات المنقطعة، ولكل منطقة شكلها، ويوم سيئ واحد في الشرق باللون الكهرماني، ثم يُرسَل تقرير كل منطقة إلى فريقها في 07:00.',
  sama: 'رسم متحرك ببيانات ساما الحقيقية: شبكة فيها مربع لكل مدينة وأسبوع، المدن العشر منذ يناير 2024 والمدن الباقية منذ يونيو 2025، يمسحها فحص من أولها إلى آخرها: كل مربع يتطابق فيه تقرير ساما الأسبوعي مع أيام البوابة يصير أبيض دافئًا، و9,816 من 9,836 رقمًا متطابقة. والعمود الوحيد المختلف، أسبوع 24 إلى 30 مارس 2024، يصير كهرمانيًا: ينقص التقرير نحو نصف يوم السبت 30 مارس.',
  heart: 'رسم متحرك: 6,705,004 بالغين، نقطة لكل ألف إجابة، تتجمع في عمود لكل استبيان سنوي من 2011 إلى 2025؛ تضيء السنوات الفردية التي تعلّم منها النموذج، وتتحول 2025، سنة الاختبار الوحيد، إلى الكهرماني مع ROC-AUC بقيمة 0.851.',
  'riyadh-4g': 'رسم متحرك: قراءات الهواتف تستقر على شبكة 1 كم في الرياض (مواقع توضيحية)؛ 23.6% قيم حارسة تسقط؛ ثم كثافة القراءات.',
  'sql-dwh': 'رسم متحرك: ستة ملفات خام، 116,294 صفًا، تمر بالطبقة البرونزية كما وصلت، ثم الفضية منظّفة، وكل فحص يعيد 0 صفوف، ثم تصير في الذهبية نموذجًا نجميًا: fact_sales بـ60,398 صفًا مرتبطًا بـ dim_customers وdim_products.',
} : {
  'nokia-kpi': 'Animation on illustrative data: four region pages fill with their own charts (traffic and drop rate), each region with its own shape and one bad day in the East in amber; then each region’s report is sent to its team at 07:00.',
  sama: 'Animation on real SAMA data: a grid with one square per city and week, the ten long-listed cities from January 2024 and the rest from June 2025. A check sweeps across once: every square where SAMA’s weekly PDF equals the portal’s days turns warm white, 9,816 of 9,836 figures. The one column that differs, the week of 24 to 30 March 2024, turns amber: the PDF is short by about half of Saturday 30 March.',
  heart: 'Animation: 6,705,004 adults, one dot per 1,000 answers, gather into one column per yearly survey from 2011 to 2025; the odd years the model learned from light up, and 2025, the one test year, turns amber with ROC-AUC 0.851.',
  'riyadh-4g': 'Animation: handset readings settle on a 1 km grid of Riyadh (illustrative positions); 23.6% sentinel values fall out; the readings per cell remain.',
  'sql-dwh': 'Animation: six raw files, 116,294 rows, pass through bronze as they arrive, then silver, cleaned, with every check returning 0 rows, and become one star schema in gold: fact_sales, 60,398 rows, linked to dim_customers and dim_products.',
};
for (const k in ARIA) ARIA[k] = arDigits(ARIA[k]);

SPECS.week = S_WEEK;
Object.defineProperty(ARIA, 'week', { get() {
  const w = DATA.week; if (!w) return '';
  const v = w.value_k, hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v)), bn = x => (x / 1e6).toFixed(2);
  const dn = AR ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = i => new Date(w.days[i] + 'T00:00:00Z').getUTCDay();
  return arDigits(AR ? `الإنفاق في كل يوم من أيام الأسبوع، نقطة لكل 50 مليون ريال: أعلاه يوم ${dn[d(hi)]} بـ${bn(v[hi])} مليار ريال، وأقله يوم ${dn[d(lo)]} بـ${bn(v[lo])} مليار ريال.`
    : `Spending on each day of the week, one point per 50 million riyals: highest on ${dn[d(hi)]}, SAR ${bn(v[hi])} billion, lowest on ${dn[d(lo)]}, SAR ${bn(v[lo])} billion.`);
} });

function week() {
  const cv = document.getElementById('wkc'); if (!cv || !DATA.week) return;
  playScenes([{ cv, id: 'week', box: cv, opts: { paper: true, bg: '#e8e4da' } }]);
}








let HELLO = null;
function hello() {
  if (HELLO) return HELLO;
  const HL = window.__hello = { shown: html.classList.contains('hello-on'), start: performance.now() };
  const lifted = HL.shown && getComputedStyle(document.body, '::before').visibility === 'hidden';   
  if (HL.shown && (lifted || performance.now() > 1500) && !Q.has('hello')) { html.classList.remove('hello-on'); HL.shown = false; HL.late = true; }
  if (!HL.shown) return (HELLO = Promise.resolve(false));
  try { localStorage.setItem('me.hello', String(Date.now())); } catch (e) {}
  const el = document.createElement('div'); el.className = 'hello'; el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  html.classList.remove('hello-on');
  let outRes0; const out = HELLO = new Promise(r => { outRes0 = r; });
  const enter = document.body.classList.contains('home') && !RM ? homeEnter() : () => {};
  const outRes = v => { enter(); outRes0(v); };
  const words = AR ? ['أهلاً', 'Hello'] : ['Hello', 'أهلاً'];
  const fontOf = (w, px) => /[a-z]/i.test(w) ? `800 ${px}px "Switzer", system-ui, sans-serif` : `800 ${px}px "Beiruti", "Segoe UI", Tahoma, sans-serif`;
  let done = false;
  const finish = () => { if (done) return; done = true; HL.end = performance.now(); outRes(true); const keep = () => { el.remove(); if (window.__lgOpen) window.__lgOpen(); }; if (lgEl && flown) setTimeout(keep, 1200); else keep(); };
  
  const keys = e => { if ([' ', 'Spacebar', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) e.preventDefault(); };
  addEventListener('keydown', keys, { capture: true });
  out.then(() => removeEventListener('keydown', keys, { capture: true }));
  if (RM) {
    
    el.innerHTML = `<div class="hello-still"><span>${words[0]}</span><span>${words[1]}</span></div>`;
    const go = () => { outRes(true); el.classList.add('gone'); setTimeout(finish, 260); };
    const tm = setTimeout(go, 500);
    const skip = () => { clearTimeout(tm); go(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(e => addEventListener(e, skip, { once: true, passive: true }));
    return out;
  }
  const cv = document.createElement('canvas'); el.appendChild(cv);
  const ctx = cv.getContext('2d');
  
  const hdrLogo = [...document.querySelectorAll('.who.lgo')].find(e => e.getBoundingClientRect().width > 0) || document.querySelector('.who.lgo');
  let lgEl = null;
  if (hdrLogo) { lgEl = document.createElement('div'); lgEl.className = 'hello-logo who lgo'; lgEl.innerHTML = hdrLogo.innerHTML; el.appendChild(lgEl); }
  const W = innerWidth, H = innerHeight, DPR = Math.min(devicePixelRatio || 1, 2), PH = Math.min(W, H) < 600;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  const N = PH ? 560 : 900, rnd = mkRnd(311);
  const P = { sx: new Float32Array(N), sy: new Float32Array(N), sz: new Float32Array(N), ax: new Float32Array(N), ay: new Float32Array(N),
    bx: new Float32Array(N), by: new Float32Array(N), fx: new Float32Array(N), fy: new Float32Array(N), d1: new Float32Array(N), d2: new Float32Array(N), d3: new Float32Array(N) };
  for (let i = 0; i < N; i++) { P.sx[i] = W * (0.04 + 0.92 * rnd()); P.sy[i] = H * (0.08 + 0.84 * rnd()); P.sz[i] = rnd(); P.d1[i] = rnd() * 0.16; P.d3[i] = rnd() * 0.08; }
  
  const hero = document.getElementById('hero'), hb = hero ? hero.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
  const fz = W > 1100 ? [hb.left + hb.width * 0.45, hb.top + hb.height * 0.2, hb.left + hb.width * 0.97, hb.top + hb.height * 0.85] : [W * 0.05, H * 0.62, W * 0.95, H * 0.98];
  for (let i = 0; i < N; i++) { P.fx[i] = lerp(fz[0], fz[2], rnd()); P.fy[i] = lerp(fz[1], fz[3], rnd()); }
  
  function sample(word, ox, oy) {
    const fs = Math.round(clamp(Math.min(W * (PH ? 0.27 : 0.2), H * 0.3), 70, 250) * (/[a-z]/i.test(word) ? 1 : 1.12));
    const c = document.createElement('canvas'), w = Math.round(W), h = Math.round(H);
    c.width = w; c.height = h; const g = c.getContext('2d');
    g.font = fontOf(word, fs);
    try { g.fontStretch = /[a-z]/i.test(word) ? 'condensed' : 'normal'; } catch (e) {}
    g.direction = /[a-z]/i.test(word) ? 'ltr' : 'rtl';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(word, w / 2, h / 2 - (lgEl ? fs * 0.24 : 0));   
    const d = g.getImageData(0, 0, w, h).data, cand = [];
    
    let ink = 0; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 140) ink += 4;
    const step = Math.max(2, Math.sqrt(ink / N));
    for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) { const xi = Math.round(x), yi = Math.round(y); if (d[(yi * w + xi) * 4 + 3] > 140) cand.push([xi + (rnd() - 0.5) * step * 0.7, yi + (rnd() - 0.5) * step * 0.7]); }
    if (!cand.length) for (let i = 0; i < N; i++) cand.push([W / 2 + (rnd() - 0.5) * 200, H / 2 + (rnd() - 0.5) * 60]);
    const pick = [];
    
    for (let i = 0; i < N; i++) { const q = cand[Math.floor(i * cand.length / N)]; pick.push([q[0] + (cand.length < N ? (rnd() - 0.5) * step * 0.6 : 0), q[1]]); }
    pick.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
    return pick;
  }
  let A = null, B = null, t0 = performance.now() / 1000, T0 = null, skipAt = null;
  
  
  const OUT = 2.3, END = 3.3, SWAP = 1.0;   
  const fonts = document.fonts ? Promise.all(words.map(w => document.fonts.load(fontOf(w, 120), w))).catch(() => {}) : Promise.resolve();
  const begin = () => {
    if (T0 != null) return;
    A = sample(words[0]); B = sample(words[1]);
    
    for (let i = 0; i < N; i++) { P.ax[i] = A[i][0]; P.ay[i] = A[i][1]; P.bx[i] = B[i][0]; P.by[i] = B[i][1]; P.d2[i] = (A[i][0] / W) * 0.12; }
    
    T0 = Math.min(performance.now(), HL.start + 300) / 1000; HL.T0 = performance.now();
  };
  if (lgEl) { const fs0 = Math.round(clamp(Math.min(W * (PH ? 0.27 : 0.2), H * 0.3), 70, 250)); lgEl.style.fontSize = Math.round(fs0 * 0.3) + 'px'; lgEl.style.top = Math.round(H / 2 + fs0 * 0.3) + 'px'; }
  let flown = false;
  const fly = () => {   
    if (flown || !lgEl || !hdrLogo) return; flown = true;
    
    
    const am = lgEl.querySelector('.lgw') || lgEl, bm = hdrLogo.querySelector('.lgw') || hdrLogo;
    const a = am.getBoundingClientRect(), bb = bm.getBoundingClientRect(), k = bb.width / a.width;
    const dx = (bb.left + bb.width / 2) - (a.left + a.width / 2), dy = (bb.top + bb.height / 2) - (a.top + a.height / 2);
    const tw = lgEl.style.transform || 'translate(-50%, 0)';
    
    const anim = lgEl.animate([{ transform: `${tw} translate(0, 0) scale(1)` }, { transform: `${tw} translate(${dx}px, ${dy}px) scale(${k})` }],
      { duration: 1150, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' });
    anim.onfinish = () => { lgEl.style.opacity = '0'; if (window.__lgOpen) window.__lgOpen(); };
  };
  fonts.then(begin); setTimeout(begin, 200);    
  const skip = () => { if (T0 == null) begin(); const T = performance.now() / 1000 - T0; if (T < OUT) skipAt = T; };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(e => addEventListener(e, skip, { once: true, passive: true }));
  let outSent = false;
  function frame() {
    const now = performance.now() / 1000;
    let T = T0 == null ? -1 : now - T0;
    
    if (skipAt != null && T >= 0) T = T - skipAt + OUT;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const bgA = 1 - smooth((T - OUT) / (END - OUT));
    ctx.globalAlpha = bgA; ctx.fillStyle = '#121110'; ctx.fillRect(0, 0, W, H);
    if (T >= OUT && !outSent) { outSent = true; HL.out = performance.now(); outRes(true); fly(); }
    ctx.fillStyle = '#ece8df';
    for (let i = 0; i < N; i++) {
      let x = P.sx[i] + 4 * Math.sin(now * 0.9 + i), y = P.sy[i] + 3 * Math.cos(now * 0.7 + i * 1.3), org = 0;
      if (T >= 0) {
        const s1 = clamp(spring(T - P.d1[i], 0.62, 0.84), -0.2, 1.2), s2 = clamp(spring(T - SWAP - P.d2[i], 0.62, 0.9), -0.2, 1.2);
        x = lerp(x, P.ax[i], s1); y = lerp(y, P.ay[i], s1); org = clamp(s1, 0, 1);
        if (s2 !== 0) { x = lerp(x, P.bx[i], s2); y = lerp(y, P.by[i], s2); org = 1 - 0.55 * Math.sin(Math.PI * clamp(s2, 0, 1)); }
        const s3 = smooth((T - OUT - P.d3[i]) / 0.7);
        if (s3 > 0) { x = lerp(x, P.fx[i], s3 * s3); y = lerp(y, P.fy[i], s3 * s3); org = 1 - s3; }
      }
      const loose = 1 - org, sz = 2.4 + loose * P.sz[i] * P.sz[i] * 5.5;
      const a = (1 - loose * (0.45 + 0.35 * P.sz[i])) * (T >= OUT ? 1 - smooth((T - OUT - 0.15) / 0.6) : 1);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      if (sz > 2.6) { ctx.beginPath(); ctx.arc(x, y, sz / 2, 0, 6.2832); ctx.fill(); } else ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    if (T < END) requestAnimationFrame(frame); else finish();
  }
  requestAnimationFrame(frame);
  setTimeout(finish, 3600);                          
  return out;
}









function circleMagnets() {
  if (!FINE || RM || innerWidth <= 540) return;
  document.querySelectorAll('[data-mag-d]').forEach(el => {
    const S = +el.dataset.magD || 100, inner = el.querySelector('.mag-in');
    const st = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, mode: 'rest' };
    let raf = 0, last = 0;
    const tick = now => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      let busy = false;
      for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty']]) {
        if (st.mode === 'follow') {                       
          st[p] += (st[t] - st[p]) * (1 - Math.exp(-dt * 6)); st[v] = 0;
        } else {                                          
          const w = 2 * Math.PI / 0.55, z = 0.28;
          st[v] += (-w * w * st[p] - 2 * z * w * st[v]) * dt; st[p] += st[v] * dt;
        }
        if (Math.abs(st[p] - (st.mode === 'follow' ? st[t] : 0)) > 0.05 || Math.abs(st[v]) > 0.05) busy = true;
      }
      el.style.translate = `${st.x.toFixed(2)}px ${st.y.toFixed(2)}px`;
      if (inner) inner.style.translate = `${(st.x * 0.5).toFixed(2)}px ${(st.y * 0.5).toFixed(2)}px`;
      raf = busy ? requestAnimationFrame(tick) : 0;
    };
    const go = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      
      const cx = r.left - st.x, cy = r.top - st.y;
      st.tx = ((e.clientX - cx) / el.offsetWidth - 0.5) * S; st.ty = ((e.clientY - cy) / el.offsetHeight - 0.5) * S;
      st.mode = 'follow'; go();
    });
    el.addEventListener('pointerleave', () => { st.mode = 'back'; st.vx = st.vy = 0; go(); });
  });
}

function magnets(root = document) {
  if (!FINE || RM || SEEKING) return;
  const list = [...root.querySelectorAll('[data-mag]')].map(el => ({ el, inner: el.querySelector('.mag-in'), x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    pad: +(el.dataset.magPad || 22), max: +(el.dataset.mag || 8) }));
  if (!list.length) return;
  let run = false, last = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    for (const m of list) {
      const r = m.el.getBoundingClientRect(), cx = r.left + r.width / 2 - m.x, cy = r.top + r.height / 2 - m.y;
      const hw = r.width / 2 + m.pad, hh = r.height / 2 + m.pad, dx = e.clientX - cx, dy = e.clientY - cy;
      if (Math.abs(dx) < hw && Math.abs(dy) < hh) { m.tx = clamp(dx * 0.32, -m.max, m.max); m.ty = clamp(dy * 0.4, -m.max * 0.7, m.max * 0.7); }
      else { m.tx = 0; m.ty = 0; }
    }
    if (!run) { run = true; last = performance.now(); requestAnimationFrame(step); }
  }, { passive: true });
  addEventListener('pointerleave', () => list.forEach(m => { m.tx = 0; m.ty = 0; }));
  document.addEventListener('mouseleave', () => list.forEach(m => { m.tx = 0; m.ty = 0; }));
  const w = 2 * Math.PI / 0.42;                       
  function step(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    let busy = false;
    for (const m of list) {
      for (const [p, v, tg] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty']]) {
        const a = -w * w * (m[p] - m[tg]) - 2 * w * m[v];   
        m[v] += a * dt; m[p] += m[v] * dt;
        if (Math.abs(m[p] - m[tg]) > 0.02 || Math.abs(m[v]) > 0.02) busy = true;
      }
      m.el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      if (m.inner) m.inner.style.translate = `${(m.x * 0.45).toFixed(2)}px ${(m.y * 0.45).toFixed(2)}px`;
    }
    if (busy) requestAnimationFrame(step); else run = false;
  }
}









const TX_OUT = 0.4, TX_HOLD = 0.15, TX_IN = 0.5, TX_BACK = 0.3, TX_COL = '#1b1a18';


const WEEKS52 = [0.0, 0.81, 0.38, 0.26, 0.15, 0.64, 0.52, 0.3, 0.15, 0.25, 1.0, 0.47, 0.43, 0.16, 0.81, 0.83, 0.68, 0.42, 0.53, 0.83, 0.84, 0.58, 0.24, 0.57, 0.32, 0.12, 0.07, 0.93, 0.47, 0.37, 0.48, 0.51, 0.39, 0.29, 0.13, 0.17, 0.98, 0.48, 0.25, 0.11, 0.87, 0.55, 0.47, 0.47, 0.77, 0.78, 0.39, 0.23, 0.32, 0.9, 0.34, 0.17];
let txc = null, txg = null, txW = 0, txH = 0, txD = 1, txJit = null;
function txCanvas() {
  if (txc) return;
  txc = document.createElement('canvas'); txc.className = 'txc'; txc.setAttribute('aria-hidden', 'true');
  document.body.appendChild(txc); txg = txc.getContext('2d');
  txW = innerWidth; txH = innerHeight; txD = Math.min(devicePixelRatio || 1, 2);
  txc.width = Math.round(txW * txD); txc.height = Math.round(txH * txD);
  const r = mkRnd(77), n = Math.ceil(txW / 6) + 2;
  txJit = Array.from({ length: n }, (_, i) => {
    
    let u = clamp((i * 6) / txW, 0, 1); if (AR) u = 1 - u;
    const f = u * (WEEKS52.length - 1), k = Math.floor(f), v = lerp(WEEKS52[k], WEEKS52[Math.min(k + 1, WEEKS52.length - 1)], f - k);
    return (0.5 - v) * 2 + (r() - 0.5) * 0.25;      
  });
}

function txDraw(phase, dir, p, label) {
  const g = txg; g.setTransform(txD, 0, 0, txD, 0, 0); g.clearRect(0, 0, txW, txH);
  const e = dir === 'up' ? txH * (1 - p) : txH * p;          
  const below = (phase === 'cover') === (dir === 'up');      
  const y0 = below ? e : 0, y1 = below ? txH : e;
  if (y1 - y0 < 0.5 && phase === 'open') return;
  g.globalAlpha = 1; g.fillStyle = TX_COL; g.fillRect(0, y0, txW, y1 - y0);
  
  const amp = 22 * Math.sin(Math.PI * clamp(p, 0, 1));
  g.fillStyle = '#ece8df';
  for (let i = 0, x = 3; x < txW; i++, x += 6) {
    const y = e + txJit[i] * amp, z = Math.min(1, Math.abs(txJit[i]));
    g.globalAlpha = 0.9 - 0.3 * z * amp / 22;
    const s = 1.8 + z * amp * 0.06;
    g.fillRect(x - s / 2, y - s / 2, s, s);
  }
  if (label) {
    const a = phase === 'cover' ? smooth((p - 0.3) / 0.45) : 1 - smooth((p - 0.2) / 0.4);
    if (a > 0.01) {
      g.save(); g.beginPath(); g.rect(0, y0, txW, y1 - y0); g.clip();
      g.globalAlpha = a; g.fillStyle = '#ece8df';
      const lat = /[a-z]/i.test(label), fs = Math.round(clamp(txW * 0.05, 30, 64));
      g.font = lat ? `800 ${fs}px "Switzer", sans-serif` : `800 ${fs}px "Beiruti", "Switzer", sans-serif`;
      try { g.fontStretch = lat ? 'condensed' : 'normal'; } catch (err) {}
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = lat ? 'ltr' : 'rtl';
      g.fillText(lat ? label.toUpperCase() : label, txW / 2, txH / 2);
      g.restore();
    }
  }
}
function txRun(phase, dir, dur, label, done) {
  txCanvas();
  const t0 = performance.now();
  
  const ease = phase === 'cover' ? (u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2) : (u => 1 - Math.pow(1 - u, 3));
  function f(now) {
    const u = clamp((now - t0) / 1000 / dur, 0, 1);
    txDraw(phase, dir, ease(u), label);
    if (u < 1) requestAnimationFrame(f); else done && done();
  }
  txDraw(phase, dir, 0, label);
  requestAnimationFrame(f);
}
function txClear() { if (txc) { txc.remove(); txc = null; } }





const LD_IN = 'cubic-bezier(.76,0,.24,1)', LD_UP = 'cubic-bezier(.895,.03,.685,.22)', LD_RISE = 'cubic-bezier(.16,1,.3,1)';
let ldc = null;
function ldBuild(label) {
  
  ldc = document.querySelector('.ldc');
  if (!ldc) { ldc = document.createElement('div'); ldc.className = 'ldc'; ldc.setAttribute('aria-hidden', 'true');
    ldc.innerHTML = '<div class="lds"><div class="ldr top"><div></div></div><div class="ldw"><span class="ldt"></span></div><div class="ldr bottom"><div></div></div></div>';
    document.body.appendChild(ldc); }
  ldc.classList.add('on');
  ldc.querySelector('.ldt').textContent = label || '';
  ldc.querySelector('.ldw').style.display = label ? '' : 'none';
  return ldc;
}
function ldHide() { if (!ldc) return; ldc.classList.remove('on'); ldc.querySelectorAll('*').forEach(e => e.removeAttribute('style')); ldc = null; }



function homeEnter() {
  const hs = ['#name', '.hero .htitle', '#cue', '#isocap'].map(q => document.querySelector(q)).filter(Boolean);
  hs.forEach(e => { e.dataset.ent = '1'; e.style.transition = 'none'; e.style.opacity = '0'; e.style.transform = 'translateY(48px)'; });
  let gone = false;
  return () => { if (gone) return; gone = true; hs.forEach((e, k) => {
    void e.offsetWidth;
    e.style.transition = `opacity .7s ease ${k * 0.07}s, transform 1.1s ${LD_RISE} ${k * 0.07}s`; e.style.opacity = ''; e.style.transform = '';
    setTimeout(() => { e.style.transition = ''; delete e.dataset.ent; }, 1150 + k * 70);
  }); };
}
function ldOnceIn() {
  
  
  
  
  
  
  if (document.body.classList.contains('home')) return homeEnter();
  const els = [document.querySelector('main')].filter(Boolean);
  const far = innerWidth > 540 ? '50vh' : '10vh';   
  els.forEach(e => { e.style.transition = 'none'; e.style.transform = `translateY(${far})`; });
  return () => els.forEach((e, k) => {
    void e.offsetWidth;
    e.style.transition = `transform 1.5s ${LD_RISE} ${k * 0.07}s`; e.style.transform = '';
    
    setTimeout(() => { e.style.transition = 'none'; e.style.transform = 'none'; void e.offsetWidth; e.style.transform = ''; e.style.transition = ''; }, 1700 + k * 70);
  });
}
function txLeave(href, label) {
  if (RM) {
    const c = ldBuild(''); c.style.opacity = '0'; c.style.transition = 'opacity .14s linear'; requestAnimationFrame(() => { c.style.opacity = '1'; });
    store.set('me.tx', JSON.stringify({ ts: Date.now(), dir: 'up', label: '' }));
    setTimeout(() => { location.href = href; }, 150);
    return;
  }
  const c = ldBuild(label), sc = c.querySelector('.lds'), top = c.querySelector('.ldr.top'), w = c.querySelector('.ldw');
  sc.style.transform = 'translateY(100%)'; top.style.height = '0'; w.style.opacity = '0'; w.style.transform = 'translate(-50%, -50%)';
  void sc.offsetWidth;
  sc.style.transition = `transform .5s ${LD_UP}`; sc.style.transform = 'translateY(0)';
  top.style.transition = `height .4s ${LD_UP}`; top.style.height = innerWidth > 540 ? '10vh' : '5vh';
  setTimeout(() => { w.style.transition = 'opacity .8s cubic-bezier(.165,.84,.44,1), transform .8s cubic-bezier(.165,.84,.44,1)'; w.style.opacity = '1'; w.style.transform = 'translate(-50%, calc(-50% - 50px))'; }, 50);
  setTimeout(() => {
    store.set('me.tx', JSON.stringify({ ts: Date.now(), dir: 'up', label }));
    location.href = href;
  }, label ? 560 : 420);
}
function txArrive(dir, label) {
  const rise = ldOnceIn();
  if (RM) { rise(); html.classList.remove('tx-in'); return; }
  const c = ldBuild(label), sc = c.querySelector('.lds'), bot = c.querySelector('.ldr.bottom'), w = c.querySelector('.ldw');
  sc.style.transform = 'translateY(0)'; bot.style.height = innerWidth > 540 ? '10vh' : '5vh';
  w.style.opacity = label ? '1' : '0'; w.style.transform = 'translate(-50%, calc(-50% - 50px))';
  html.classList.remove('tx-in');              
  const wait = label ? 500 : 80;
  
  html.classList.add('ld-busy'); setTimeout(() => html.classList.remove('ld-busy'), wait + 300 + 1000);
  setTimeout(() => {
    sc.style.transition = `transform .8s ${LD_IN}`; sc.style.transform = 'translateY(-100%)';
    bot.style.transition = `height 1s ${LD_IN}`; bot.style.height = '0';
    w.style.transition = 'opacity .3s linear'; w.style.opacity = '0';
    setTimeout(rise, 300);
    setTimeout(ldHide, 1100);
  }, wait);
}
function transitions() {
  if (SEEKING) { html.classList.remove('tx-in'); return; }
  
  if (html.classList.contains('tx-in') && getComputedStyle(document.body, '::after').visibility === 'hidden') html.classList.remove('tx-in');
  if (html.classList.contains('tx-in')) txArrive(html.dataset.txdir || 'up', html.dataset.txlabel || '');
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    
    const hr = a.getAttribute('href');
    if (hr.length > 1 && hr[0] === '#') { const el = document.getElementById(hr.slice(1)); if (el) { e.preventDefault(); goTo(el, hr); } return; }
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/(\/|\.html|\/[^\/.]+)$/.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    
    if (/\/work\/[^\/.]+(\.html)?$/.test(u.pathname)) { if (e.detail === 0 && a.closest('.list')) store.set('me.back', location.pathname + '|' + hr); return; }
    e.preventDefault();
    
    if (e.detail === 0 && a.closest('.list')) store.set('me.back', location.pathname + '|' + hr);
    txLeave(u.href, /\/work(\.html|\/(index\.html)?)$/.test(u.pathname) ? (AR ? 'الأعمال' : 'Work') : (a.dataset.tx || ''));
  });
  const backFocus = () => {
    const v = store.get('me.back'); if (!v) return; store.del('me.back');
    const [p, hr] = v.split('|'); if (p !== location.pathname) return;
    const a = [...document.querySelectorAll('.list a')].find(x => x.getAttribute('href') === hr);
    if (a) a.focus({ preventScroll: true });
  };
  
  addEventListener('pageshow', e => { if (e.persisted && ldc) txArrive('down', ''); if (e.persisted) backFocus(); });
  try { const n = performance.getEntriesByType('navigation')[0]; if (n && n.type === 'back_forward') backFocus(); } catch (err) {}
  
  addEventListener('pagehide', () => { if (ldc) { const t = ldc.querySelector('.ldt'); if (t) t.textContent = ''; } if (window.__list) window.__list.hoverRow(null); });
}


let GOING = false;
function goTo(el, hash) {
  const sheet = document.querySelector('.sheet'), tr = sheet ? sheet.style.transform : '';
  if (sheet && tr) sheet.style.transform = 'none';
  const y = el.getBoundingClientRect().top + scrollY - (el.id === 'main' ? 0 : 20);
  if (sheet && tr) sheet.style.transform = tr;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  GOING = true; el.focus({ preventScroll: true }); GOING = false;
  try { history.replaceState(null, '', hash); } catch (e) {}
  if (smoothTarget) smoothTarget(y); else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
}





let smoothTarget = null;
function smoothWheel() {
  if (!FINE || RM || SEEKING || Q.has('nosmooth')) return;
  let target = scrollY, cur = scrollY, active = false, last = 0, set = -1;
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  function loop(now) {
    if (!active) return;
    
    if (set >= 0 && Math.abs(scrollY - set) > 2) { active = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    cur = lerp(cur, target, 1 - Math.pow(1 - 0.2, dt * 60));        
    if (Math.abs(target - cur) < 0.4) { cur = target; active = false; }
    window.scrollTo(0, cur); set = scrollY;
    if (active) requestAnimationFrame(loop);
  }
  const go = y => { if (!active) { cur = scrollY; set = -1; active = true; last = performance.now(); requestAnimationFrame(loop); } target = clamp(y, 0, maxY()); };
  
  const onWheel = e => {
    if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.target.closest && e.target.closest('[data-native-scroll]')) return;
    e.preventDefault();
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    go((active ? target : scrollY) + e.deltaY * k);
  };
  const arm = () => addEventListener('wheel', onWheel, { passive: false });
  if (document.readyState === 'complete') arm(); else addEventListener('load', arm, { once: true });
  addEventListener('scroll', () => {
    if (active && Math.abs(scrollY - cur) > 3) { active = false; }     
  }, { passive: true });
  
  smoothTarget = go;
}















const HEAD_BG = '#scene, #labels, [data-bg]';
function layers() {
  const head = document.querySelector('.head');
  const sheet = document.querySelector('.sheet');
  const foot = document.querySelector('.foot'), fin = foot && foot.querySelector('.foot-in');
  const curve = document.querySelector('.curve span');
  if (!sheet) return;
  if (RM || Q.has('flat')) { html.classList.add('flat'); return; }
  const bgs = head ? [...head.querySelectorAll(HEAD_BG)] : [];
  bgs.forEach(el => el.classList.add('hbg'));
  let pend = false, padTop = 80;
  const measure = () => { if (fin) padTop = parseFloat(getComputedStyle(fin).paddingTop) || 80; };
  function apply() {
    pend = false;
    const y = scrollY, vh = innerHeight, k = innerWidth < 700 ? 0.5 : 1;
    if (head && bgs.length) {
      const H = head.offsetHeight, u = clamp(y / Math.max(1, H), 0, 1);
      const tr = u > 0 ? `translate3d(0, ${(Math.min(y, H) * 0.6 * k).toFixed(1)}px, 0)` : '', op = u > 0 ? (1 - u * 0.6).toFixed(3) : '';
      for (const el of bgs) { el.style.transform = tr; el.style.opacity = op; }
    }
    
    const span = Math.max(1, Math.min(vh, head ? head.offsetHeight : vh) * 0.9);
    const lp = clamp(y / span, 0, 1), le = 1 - Math.pow(1 - lp, 3);
    
    if (le >= 0.999) { sheet.style.transform = ''; sheet.style.borderRadius = ''; sheet.style.willChange = ''; }
    else {
      sheet.style.willChange = 'transform';
      sheet.style.transform = `scale(${(1 - 0.14 * k * (1 - le)).toFixed(4)})`;
      const r = ((1 - le) * 48 * k).toFixed(1); sheet.style.borderRadius = `${r}px ${r}px 0 0`;
    }
    if (foot && curve) {
      const r = foot.getBoundingClientRect(), F = Math.min(foot.offsetHeight, vh);
      const p = clamp((vh - r.top) / Math.max(1, F), 0, 1);
      
      const maxH = Math.max(0, Math.min(vh * (k < 1 ? 0.07 : 0.12), padTop - 16));
      
      
      curve.style.height = `${((1 - p) * maxH).toFixed(1)}px`;   
    }
  }
  const req = () => { if (!pend) { pend = true; requestAnimationFrame(apply); } };
  
  
  document.addEventListener('focusin', e => {
    
    if (GOING || !sheet.contains(e.target) || !sheet.style.transform || !e.target.matches(':focus-visible')) return;
    sheet.style.transform = ''; sheet.style.borderRadius = ''; sheet.style.willChange = '';
    requestAnimationFrame(() => { e.target.scrollIntoView({ block: 'center' }); req(); });
  });
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { measure(); req(); });
  measure(); apply();
  if (document.fonts) document.fonts.ready.then(() => { measure(); apply(); });
  KIT.layersApply = apply;
}







const BASE = 1.3;
const now = () => performance.now() / 1000;
const live = [];
let loopOn = false;
function sceneTime(sc, tn) {
  if (RM) return 99;
  if (SEEKING) return sc.seekT;
  if (sc.mode === 'wait') return 0;
  if (sc.start == null) return 0;                 
  return (tn - sc.start) * sc.speed * BASE;
}
function sceneLoop() {
  const tn = now(); let busy = false;
  for (const sc of live) {
    if (!sc.m || sc.hiddenNow) continue;
    if (sc.mode === 'play' && sc.start == null) sc.start = tn;
    const t = sceneTime(sc, tn);
    const done = sc.mode === 'play' && t > sc.spec.dur + 0.4 && sc.lastT > sc.spec.dur + 0.4;
    if (!done && t !== sc.lastT) { sc.draw(t); busy = true; }
    if (sc.mode !== 'wait' && !done) busy = true;
  }
  if (busy) requestAnimationFrame(sceneLoop); else loopOn = false;
}
const kickScenes = () => { if (!loopOn) { loopOn = true; requestAnimationFrame(sceneLoop); } };

function playScenes(items) {
  
  
  items = items.filter(it => it.cv && SPECS[it.id]);
  const out = items.map(it => {
    const sc = new Scene(it.cv, SPECS[it.id], it.opts || {}); sc.box = it.box || it.cv; sc.id = it.id;
    it.cv.setAttribute('role', 'img'); it.cv.setAttribute('aria-label', ARIA[it.id] || '');
    sc.seekT = SEEKING ? (Q.has('settled') ? 99 : parseFloat(Q.get('t')) * BASE || 0) : 0;
    live.push(sc); return sc;
  });
  const fontsIn = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  out.forEach(sc => { sc.resize(); sc.draw(RM ? 99 : SEEKING ? sc.seekT : 0); });
  fontsIn.then(() => out.forEach(sc => { sc.resize(); sc.draw(sceneTime(sc, now())); }));
  if (SEEKING || RM) return out;
  if ('IntersectionObserver' in window) {
    
    const solo = items.length && items[0].solo;
    const io = new IntersectionObserver(es => {
      for (const e of es) {
        const sc = out.find(s => s.box === e.target); if (!sc) continue;
        if (e.isIntersecting && e.intersectionRatio >= (solo ? 0.6 : 0.3) && sc.mode === 'wait') {
          if (solo) out.forEach(o => { if (o !== sc && o.mode === 'play') o.start = now() - (o.spec.dur + 1) / BASE; });
          
          const go = () => { if (html.classList.contains('ld-busy')) { setTimeout(go, 80); return; } sc.mode = 'play'; sc.start = null; sc.speed = 1; kickScenes(); };
          sc.mode = 'queued'; go();
        }
      }
    }, { threshold: [0, 0.3, 0.6] });
    out.forEach(sc => io.observe(sc.box));
  } else out.forEach(sc => { sc.mode = 'play'; sc.start = now(); kickScenes(); });
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { out.forEach(sc => { sc.resize(); sc.draw(sceneTime(sc, now())); }); }, 140); });
  return out;
}






function workList(rowsEl) {
  const rows = [...rowsEl.querySelectorAll('.row')];
  
  if (!FINE || SEEKING && Q.has('touch')) {
    html.classList.add('touch');
    
    
    playScenes(rows.map(r => ({ cv: r.querySelector('.rscene canvas'), id: r.dataset.id, box: r.querySelector('.rscene'), solo: true })))
      .forEach(sc => { sc.cv.removeAttribute('role'); sc.cv.removeAttribute('aria-label'); });
    return { rows, hoverRow() {} };
  }
  const pv = document.querySelector('.pv'), pvCv = pv.querySelector('canvas');
  
  
  
  const pvv = document.querySelector('.pvv');
  const cv2 = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, s: 0, vs: 0 };
  
  
  const ONPTR = true;   
  const PVS = () => innerWidth < 1101 ? 300 : 360;   
  let size = PVS();
  const scenes = {};
  const sceneOf = id => { if (!SPECS[id]) return null; if (!scenes[id]) { scenes[id] = new Scene(pvCv, SPECS[id], { size: [size, size], bg: '#161513' }); scenes[id].resize(); } return scenes[id]; };
  const st = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, s: 0, vs: 0, ts: 0, on: false, placed: false, cur: null, start: 0 };
  let ptr = null, raf = 0, last = now();
  pv.style.width = pv.style.height = size + 'px';
  
  
  function target(cx, cy, row) {
    const half = size / 2;
    let x = cx - half, y;
    if (ONPTR) y = cy - half;
    else if (row) {
      const r = row.getBoundingClientRect();
      y = r.top - 14 - size;
      if (y < 12) y = r.bottom + 14;
      if (y + size > innerHeight - 12) y = Math.max(12, r.top - 14 - size);
    } else y = cy - half;
    st.tx = clamp(x, 12, innerWidth - size - 12);
    st.ty = clamp(y, 12, innerHeight - size - 12);
    if (!st.placed) { st.x = st.tx; st.y = st.ty; st.placed = true; cv2.snap = true; }
    if (pvv) {
      const PIN = 26;   
      
      
      
      const half = size / 2, gap = 18, CW = 270;
      let side = AR ? -1 : 1;
      if (side > 0 && cx + half + gap + CW > innerWidth - 12) side = -1; else if (side < 0 && cx - half - gap - CW < 12) side = 1;
      pvv.classList.toggle('flip', side < 0); void PIN;
      cv2.tx = cx + side * (half + gap); cv2.ty = clamp(cy - half + 26, 40, innerHeight - 140);
      if (cv2.snap) { cv2.x = cv2.tx; cv2.y = cv2.ty; cv2.snap = false; }
    }
  }
  let dimByMouse = false;
  function hoverRow(row) {
    rows.forEach(r => r.classList.toggle('on', r === row));
    
    rowsEl.classList.toggle('hov', !!row && dimByMouse);
    if (!row) { st.ts = 0; kick(); return; }
    st.ts = 1;
    const id = row.dataset.id;
    if (st.cur !== id) { st.cur = id; st.start = now(); pvCv.setAttribute('aria-label', ARIA[id] || ''); const k = pvv && pvv.querySelector('.tk'); if (k) k.textContent = row.dataset.k || ''; }
    kick();
  }
  rowsEl.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const row = e.target.closest('.row');
    ptr = [e.clientX, e.clientY];
    if (!st.on) st.placed = false;
    dimByMouse = true;
    target(e.clientX, e.clientY, row);
    hoverRow(row);
  });
  rowsEl.addEventListener('pointerleave', () => { ptr = null; hoverRow(null); });
  rowsEl.addEventListener('focusin', e => {
    const row = e.target.closest('.row'); if (!row) return;
    dimByMouse = false;
    const r = row.getBoundingClientRect(); st.placed = false; target(AR ? r.right - 260 : r.left + 260, r.top + r.height / 2, row); hoverRow(row);
  });
  rowsEl.addEventListener('focusout', () => { if (!ptr) hoverRow(null); });
  
  addEventListener('keydown', e => { if (e.key === 'Escape' && rowsEl.querySelector('.row.on')) hoverRow(null); });
  
  addEventListener('scroll', () => { if (ptr || rowsEl.classList.contains('hov')) { ptr = null; hoverRow(null); } }, { passive: true });
  function kick() { if (!raf) { last = now(); raf = requestAnimationFrame(tick); } }
  function tick() {
    raf = 0;
    const tn = now(), dt = Math.min(0.05, tn - last); last = tn;
    let busy = false;
    const w = 2 * Math.PI / 0.32, ws = 2 * Math.PI / 0.38;
    if (RM) { st.x = st.tx; st.y = st.ty; st.s = st.ts; }
    else {
      for (const [p, v, tg] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty']]) { const a = -w * w * (st[p] - st[tg]) - 2 * w * st[v]; st[v] += a * dt; st[p] += st[v] * dt; }
      const as = -ws * ws * (st.s - st.ts) - 2 * 0.9 * ws * st.vs; st.vs += as * dt; st.s += st.vs * dt;
      busy = Math.abs(st.x - st.tx) + Math.abs(st.y - st.ty) > 0.3 || Math.abs(st.s - st.ts) > 0.002 || Math.abs(st.vs) > 0.01;
    }
    if (pvv) {
      const vOn = st.ts > 0 && dimByMouse ? 1 : 0;
      if (RM) { cv2.x = cv2.tx; cv2.y = cv2.ty; cv2.s = vOn; }
      else {
        const wc = 2 * Math.PI / 0.46, wv = 2 * Math.PI / 0.42;   
        for (const [p, v, tg] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty']]) { const a = -wc * wc * (cv2[p] - cv2[tg]) - 2 * wc * cv2[v]; cv2[v] += a * dt; cv2[p] += cv2[v] * dt; }
        const av = -wv * wv * (cv2.s - vOn) - 2 * 0.8 * wv * cv2.vs; cv2.vs += av * dt; cv2.s += cv2.vs * dt;
        if (Math.abs(cv2.x - cv2.tx) + Math.abs(cv2.y - cv2.ty) > 0.3 || Math.abs(cv2.s - vOn) > 0.002 || Math.abs(cv2.vs) > 0.01) busy = true;
      }
      const ks = RM ? 1 : clamp(cv2.s, 0, 1.08);
      pvv.style.visibility = cv2.s > 0.01 ? 'visible' : 'hidden';
      pvv.style.opacity = RM ? String(vOn) : clamp(cv2.s * 1.4, 0, 1).toFixed(3);
      pvv.style.transform = `translate3d(${cv2.x.toFixed(1)}px, ${cv2.y.toFixed(1)}px, 0) scale(${ks.toFixed(3)})`;
    }
    st.on = st.s > 0.02;
    const k = clamp(0.55 + 0.45 * st.s, 0, 1.05);
    pv.style.opacity = clamp(st.s * 1.6, 0, 1).toFixed(3);
    pv.style.visibility = st.s > 0.004 ? 'visible' : 'hidden';
    pv.style.transform = `translate3d(${st.x.toFixed(1)}px, ${st.y.toFixed(1)}px, 0) scale(${k.toFixed(3)})`;
    if (st.cur && st.on) {
      
      const sc = sceneOf(st.cur), t = RM ? 99 : 0.3 + (tn - st.start) * 1.6;
      if (sc && sc.lastT !== t && !(sc.lastT > sc.spec.dur + 0.4 && t > sc.spec.dur + 0.4 && sc.drawnFor === st.cur)) { sc.draw(t); sc.drawnFor = st.cur; }
      if (sc && t < sc.spec.dur + 0.5) busy = true;
    }
    if (busy || st.ts > 0) raf = requestAnimationFrame(tick);
  }
  addEventListener('resize', () => { const n = PVS(); if (n !== size) { size = n; pv.style.width = pv.style.height = n + 'px'; for (const id in scenes) delete scenes[id]; } });
  if (document.fonts) document.fonts.ready.then(() => { for (const id in scenes) scenes[id].resize(); });
  const api = { rows, hoverRow, show: id => { const r = rows.find(x => x.dataset.id === id); const b = r.getBoundingClientRect(); st.placed = false; target(AR ? b.right - b.width * 0.45 : b.left + b.width * 0.45, b.top + b.height / 2, r); hoverRow(r); } };
  window.__list = api;
  return api;
}







function homeRows(rowsEl) {
  if (!rowsEl) return;
  const rows = [...rowsEl.querySelectorAll('.row')];
  let mouse = false, touchDown = false;
  const on = row => {
    rows.forEach(r => r.classList.toggle('on', r === row));
    rowsEl.classList.toggle('hov', !!row && mouse);   
  };
  rowsEl.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mouse = true;
    const row = e.target.closest('.row');
    if (row && !row.classList.contains('on')) on(row);
  });
  rowsEl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') on(null); });
  
  rowsEl.addEventListener('focusin', e => { if (touchDown) return; mouse = false; on(e.target.closest('.row')); });
  rowsEl.addEventListener('focusout', e => { if (!rowsEl.contains(e.relatedTarget)) on(null); });
  
  rowsEl.addEventListener('pointerdown', e => { touchDown = e.pointerType !== 'mouse'; });
  rowsEl.addEventListener('click', e => {
    const row = e.target.closest('.row'), touchy = touchDown;
    touchDown = false;                       
    if (!row || !touchy) return;
    if (!row.classList.contains('on')) { e.preventDefault(); mouse = false; on(row); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') on(null); });
  addEventListener('pagehide', () => on(null));
}


function workFilters(rowsEl, btns, stat, gridEl) {
  const rows = [...rowsEl.querySelectorAll('.row')];
  
  const cards = gridEl ? [...gridEl.querySelectorAll('.gcard')] : [];
  
  const soon = rowsEl.querySelectorAll('.soonrow').length;
  btns.forEach(b => { const f = b.dataset.f; b.querySelector('sup').textContent = arDigits(String(f === 'all' ? rows.length : f === 'ai' ? soon : rows.filter(r => r.dataset.tags.split(' ').includes(f)).length)); });
  function apply(f, animate = true, say = true) {
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
    if (window.__list) window.__list.hoverRow(null);
    const items = cards.length && html.classList.contains('wk-grid') ? cards : rows;
    const before = new Map(items.filter(r => !r.hidden).map(r => { const b = r.getBoundingClientRect(); return [r, [b.left, b.top]]; }));
    rows.concat(cards).forEach(r => { r.hidden = !(f === 'all' || r.dataset.tags.split(' ').includes(f)); });
    
    document.querySelectorAll('.soonrow, .gsoon').forEach(e => { e.hidden = !(f === 'all' || f === 'ai'); });
    
    const n = rows.filter(r => !r.hidden).length || (f === 'ai' ? soon : 0);
    if (stat && say) stat.textContent = arDigits(AR ? `يظهر ${n} من ${rows.length} مشاريع` : `Showing ${n} of ${rows.length} projects`);
    if (cards.length) dispatchEvent(new Event('resize'));   
    if (!animate || RM || !rows[0].animate) return;
    items.filter(r => !r.hidden).forEach((r, i) => {
      const b = r.getBoundingClientRect();
      if (before.has(r)) { const [x0, y0] = before.get(r), dx = x0 - b.left, dy = y0 - b.top; if (Math.abs(dy) + Math.abs(dx) > 1) r.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.2,.9,.25,1)' }); }
      else r.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 40 + i * 30, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'backwards' });
    });
    if (KIT.layersApply) KIT.layersApply();
  }
  btns.forEach(b => b.addEventListener('click', () => {
    apply(b.dataset.f);
    try { const u = new URL(location.href); if (b.dataset.f === 'all') u.searchParams.delete('f'); else u.searchParams.set('f', b.dataset.f); history.replaceState(null, '', u); } catch (e) {}
  }));
  const f0 = Q.get('f'); if (f0 && btns.some(b => b.dataset.f === f0)) apply(f0, false, false);
  window.__filter = apply;
}








function featUnder() {
  const go = () => document.querySelectorAll('section.sec').forEach(s => {
    const h2 = s.querySelector(':scope > h2.md'), h3 = s.querySelector(':scope > .feat > h3.c-l3'); if (!h2 || !h3) return;
    const r = document.createRange(); r.selectNodeContents(h2);
    
    
    h3.style.width = 'max-content'; const nat = h3.offsetWidth; h3.style.width = '';   
    const col = h3.parentElement.offsetWidth * 0.4;
    h3.style.setProperty('--h2w', Math.ceil(Math.max(r.getBoundingClientRect().width, Math.min(nat + 1, col))) + 'px');
    h3.style.setProperty('--h2h', Math.ceil(h2.getBoundingClientRect().height) + 'px');   
  });
  go(); addEventListener('resize', go); if (document.fonts) document.fonts.ready.then(go);
}


document.addEventListener('click', e => { const c = e.target.closest('[data-mailcap]'); if (c && !e.target.closest('.ft2-copy, a')) { const a = c.querySelector('.ft-addr'); if (a) a.click(); } });

function deckSwitch() {
  document.querySelectorAll('.deck-sw').forEach(sw => sw.addEventListener('click', e => {
    const b = e.target.closest('button[data-krow]'); if (!b) return;
    const deck = sw.closest('.deck'), k = b.dataset.krow;
    sw.querySelectorAll('button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    deck.querySelectorAll('.deck-r').forEach(r => r.classList.toggle('on', r.id === 'deckr' + k));
    dispatchEvent(new Event('resize'));
  }));
}

function noteFit() {
  const go = () => document.querySelectorAll('.pjnote').forEach(n => { n.classList.remove('pjnote2'); if (n.scrollWidth > n.clientWidth + 1) n.classList.add('pjnote2'); });
  go(); addEventListener('resize', go); if (document.fonts) document.fonts.ready.then(go);
}
function workView(rowsEl, gridEl, btns) {
  if (!gridEl || !btns.length) return;
  
  
  if (FINE) gridEl.querySelectorAll('.gscene').forEach(sc => {
    const tip = sc.querySelector('.gtip'); if (!tip) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, first = true;
    const step = () => { x += (tx - x) * 0.22; y += (ty - y) * 0.22; tip.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.4) ? requestAnimationFrame(step) : 0; };
    sc.parentElement.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = sc.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, px = e.clientX - r.left, py = e.clientY - r.top;
      tx = px + 18 + w > r.width - 10 ? px - 18 - w : px + 18;          
      ty = py + 18 + h > r.height - 10 ? py - 18 - h : py + 18;         
      tx = clamp(tx, 10, r.width - w - 10); ty = clamp(ty, 10, r.height - h - 10);
      if (first) { x = tx; y = ty; first = false; }
      if (!raf) raf = requestAnimationFrame(step);
    });
    sc.parentElement.addEventListener('pointerleave', () => { first = true; });
  });
  let played = false;
  function playGrid() {
    if (played) return; played = true;
    playScenes([...gridEl.querySelectorAll('.gcard')].map(c => ({ cv: c.querySelector('.gscene canvas'), id: c.dataset.id, box: c.querySelector('.gscene') })))
      .forEach(sc => { sc.cv.removeAttribute('role'); sc.cv.removeAttribute('aria-label'); });   
  }
  function set(v, save) {
    const grid = v === 'grid';
    if (window.__list) window.__list.hoverRow(null);
    html.classList.toggle('wk-grid', grid);
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    if (save) try { localStorage.setItem('me.workView', v); } catch (e) {}
    if (grid) playGrid();
    else dispatchEvent(new Event('resize'));          
    if (KIT.layersApply) KIT.layersApply();
  }
  btns.forEach(b => b.addEventListener('click', () => { if (b.getAttribute('aria-pressed') !== 'true') set(b.dataset.v, true); }));
  set(html.classList.contains('wk-grid') ? 'grid' : 'list', false);
}





function reveal() {
  const els = [...document.querySelectorAll('[data-rv]')];
  html.classList.add('rv-ok');           
  if (RM || SEEKING || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('rv-in')); return; }
  const io = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  els.forEach(e => {
    
    const sec = (e.parentElement && e.parentElement.closest('section, header, footer, .head, .row, ul, ol')) || document.body;
    const sib = [...sec.querySelectorAll('[data-rv]')];
    e.style.setProperty('--rvd', (Math.min(6, sib.indexOf(e)) * 70) + 'ms');
    io.observe(e);
  });
  
}


function clock() {
  const els = [...document.querySelectorAll('.ktime')];
  if (!els.length) return;
  let fmt;
  try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return; }
  const put = () => { const s = arDigits(fmt.format(new Date())); els.forEach(e => { e.textContent = s; }); };
  put(); setInterval(put, 20000);
}












const STEPS = {};
function howSteps(sec, specs) {
  if (!sec || !specs || !specs.length) return null;
  const items = [...sec.querySelectorAll('.steps > li')];
  const stg = sec.querySelector('.stg');
  const all = [];
  
  
  if (stg) stg.setAttribute('aria-hidden', 'true');
  items.forEach((li, k) => { const sp = specs[k]; if (sp && sp.aria) { const d = document.createElement('span'); d.className = 'vh'; d.textContent = arDigits(AR ? sp.aria.ar : sp.aria.en); li.appendChild(d); } });
  const make = (cv, k) => {
    const sp = specs[k]; if (!sp) return null;
    const sc = new Scene(cv, sp, { bg: DARK.surf }); sc.k = k; sc.box = cv;
    sc.seekT = Q.has('st') ? parseFloat(Q.get('st')) * BASE : 99;     
    all.push(sc); live.push(sc); return sc;
  };
  const desk = stg ? [...stg.querySelectorAll('canvas')].map((cv, k) => make(cv, k)) : [];
  const inl = items.map((li, k) => {
    const fig = document.createElement('figure'); fig.className = 'stage-m'; fig.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas'); fig.appendChild(cv); li.appendChild(fig);
    return make(cv, k);
  });
  
  let near = SEEKING || RM || !('IntersectionObserver' in window);
  const shown = sc => sc && sc.cv.getClientRects().length > 0 && sc.cv.getBoundingClientRect().width > 4;
  
  const fg = sec.querySelector('.stage');
  const fit = () => { if (fg && fg.offsetHeight) sec.style.setProperty('--stH', fg.offsetHeight + 'px'); if (stg && stg.offsetHeight) sec.style.setProperty('--sgH', stg.offsetHeight + 'px'); if (!near) { all.forEach(sc => { sc.hiddenNow = true; }); return; } all.forEach(sc => {
    sc.hiddenNow = !shown(sc);
    if (!sc.hiddenNow) { sc.resize(); sc.draw(sceneTime(sc, now())); }
  }); };
  const start = sc => {
    if (!sc || sc.mode !== 'wait' || SEEKING || RM) return;
    sc.mode = 'play'; sc.start = null; sc.speed = 1; kickScenes();
  };
  
  
  let cur = -1, stageOn = false, hold = 0;
  const setCur = k => {
    if (k !== cur) {
      cur = k;
      items.forEach((li, j) => li.classList.toggle('cur', j === k));
      desk.forEach((sc, j) => { if (!sc) return; sc.cv.classList.toggle('on', j === k); });
      clearTimeout(hold);
      hold = setTimeout(() => { if (stageOn && cur === k && desk[k] && !desk[k].hiddenNow) start(desk[k]); }, SEEKING ? 0 : 400);
    }
  };
  
  
  const pick = () => {
    if (!stg || innerWidth < 1101) return;
    
    
    const g = stg.getBoundingClientRect(), line = (g.top + g.bottom) / 2 + g.height / 2; let best = 0;   
    items.forEach((el, j) => { const x = el.querySelector('.stx') || el, r = x.getBoundingClientRect(); if ((r.top + r.bottom) / 2 <= line) best = j; });
    setCur(best);
    
    
    const mid = (g.top + g.bottom) / 2, span = g.height * 0.55;
    items.forEach(el => { const x = el.querySelector('.stx'); if (!x) return; const r = x.getBoundingClientRect();
      const d = Math.min(1, Math.abs((r.top + r.bottom) / 2 - mid) / span); x.style.opacity = (1 - 0.82 * d * d).toFixed(3); });
  };
  fit(); pick();
  const fontsIn = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsIn.then(fit);
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { fit(); pick(); }, 140); });
  addEventListener('scroll', pick, { passive: true });   
  if (SEEKING || RM || !('IntersectionObserver' in window)) { stageOn = true; if (!SEEKING && !RM) all.forEach(start); }
  else {
    new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { near = true; fit(); pick(); o.disconnect(); } }, { rootMargin: '900px 0px' }).observe(sec);
    
    if (stg) new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { stageOn = true; cur = -1; pick(); } }, { threshold: 0.35 }).observe(stg);
    
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { const sc = inl.find(s => s && s.cv === e.target); if (sc && !sc.hiddenNow) start(sc); } }, { threshold: 0.45 });
    inl.forEach(sc => sc && io.observe(sc.cv));
  }
  const api = { show: k => { stageOn = true; setCur(k); }, get cur() { return cur; }, n: items.length, scenes: all };
  (window.__how = window.__how || []).push(api);
  return api;
}






function returnBar() {
  const bar = document.querySelector('.rbar'); if (!bar) return;
  const head = document.querySelector('.head');
  const own = document.querySelector('.top-wrap');          
  let lastY = scrollY, run = 0, shown = false;
  const set = (on, snap) => {
    if (on === shown) return; shown = on;
    if (snap) { bar.classList.add('snap'); requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.remove('snap'))); }
    bar.classList.toggle('show', on);
    if (on) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
    
    if (own) { if (on) own.setAttribute('inert', ''); else own.removeAttribute('inert'); }
  };
  const onScroll = () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    if (y <= 0.5) { run = 0; set(false, true); return; }                 
    const end = head ? head.offsetHeight - 60 : innerHeight * 0.9;
    if (y < end) { run = 0; set(true, !shown); return; }                    
    if (dy === 0) return;
    run = (Math.sign(dy) === Math.sign(run) ? run : 0) + dy;
    if (run <= -4) set(true);
    else if (run >= 56) set(false);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}







function contact() {
  const num = [66, 45, 45, 38, 45, 31, 17, 10, 52, 10, 52, 66].map(x => (x - 3) / 7).join('');
  document.querySelectorAll('[data-wa]').forEach(a => { a.href = 'https://wa.me/' + num; a.target = '_blank'; a.rel = 'noopener'; });
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const note = b.parentElement.querySelector('.ft-note'), txt = b.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
      try { const t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove(); } catch (e2) {}
    }
    if (!note) return;
    note.textContent = ok ? b.dataset.done : txt; note.classList.add('on');
    clearTimeout(b._t); b._t = setTimeout(() => note.classList.remove('on'), ok ? 2400 : 8000);
  }));
}






function logoHead() {
  const Ls = [...document.querySelectorAll('.who.lgo')]; if (!Ls.length) return;
  const measure = L => { const xs = [...L.querySelectorAll('.lg-x')], y = L.querySelector('.lg-y');
    const was = L.classList.contains('full'); L.classList.add('now'); L.classList.remove('full');
    xs.forEach(x => { x.style.width = 'auto'; const w = x.getBoundingClientRect().width; if (w) x.style.setProperty('--w', w.toFixed(2) + 'px'); x.style.width = ''; });
    if (y) { y.style.width = 'auto'; const w = y.getBoundingClientRect().width; if (w) y.style.setProperty('--wy', w.toFixed(2) + 'px'); y.style.width = 'var(--wy)'; }
    L.classList.toggle('full', was); void L.offsetWidth; L.classList.remove('now'); };
  const all = () => Ls.forEach(measure);
  all();
  let first = false; try { first = !sessionStorage.getItem('me.lg'); sessionStorage.setItem('me.lg', '1'); } catch (e) {}
  
  
  
  const viaHello = (html.classList.contains('hello-on') || !!document.querySelector('.hello .hello-logo')) && ME && ME.dataset.hello && !RM;
  if (viaHello) {
    first = false;
    Ls.forEach(L => { L.style.visibility = 'hidden'; });
    window.__lgOpen = () => { if (window.__lgOpened) return; window.__lgOpened = true;
      Ls.forEach(L => { L.style.visibility = ''; measure(L); setTimeout(() => L.classList.add('full'), 250); setTimeout(() => L.classList.remove('full'), 2000); }); };
    setTimeout(() => window.__lgOpen && window.__lgOpen(), 6000);   
  }
  Ls.forEach(L => {
    
    if (first && !RM && !SEEKING) {
      L.classList.add('now', 'full'); void L.offsetWidth; L.classList.remove('now');
      const go = () => { if (html.classList.contains('ld-busy') || html.classList.contains('tx-in')) return setTimeout(go, 200); setTimeout(() => L.classList.remove('full'), 1400); };
      setTimeout(go, ME && ME.dataset.hello ? 2600 : 400);
    }
    if (matchMedia('(hover: hover) and (min-width: 541px)').matches) {
      L.addEventListener('mouseenter', () => { measure(L); L.classList.add('full'); });
      L.addEventListener('mouseleave', () => L.classList.remove('full'));
    }
    L.addEventListener('focus', () => L.classList.add('full')); L.addEventListener('blur', () => L.classList.remove('full'));
  });
  if (document.fonts) document.fonts.ready.then(all);
  addEventListener('resize', all);
}
function credit() {
  const set = () => document.querySelectorAll('.who').forEach(w => {
    const a = w.querySelector('.who-a'), b = w.querySelector('.who-b'), c = w.querySelector('.who-c');
    if (!a || !b || !c) return;
    const wa = a.getBoundingClientRect().width, wb = b.getBoundingClientRect().width, wc = c.getBoundingClientRect().width;
    if (!wa) return;
    w.style.setProperty('--w0', (wa + wb).toFixed(2) + 'px');
    w.style.setProperty('--w1', (wb + wc).toFixed(2) + 'px');
    w.style.setProperty('--dx', ((AR ? 1 : -1) * wa).toFixed(2) + 'px');
    w.classList.add('mx');
  });
  set();
  if (document.fonts) document.fonts.ready.then(set);
  addEventListener('resize', set);
}


function contactForm(f) {
  if (!f) return;
  const W = JSON.parse(f.dataset.words || '{}'), v = n => (f.elements[n] ? f.elements[n].value.trim() : '');
  f.addEventListener('submit', e => {
    e.preventDefault();
    const name = v('name'), need = v('need');
    const subj = W.subj + ': ' + name + (need ? ' (' + need + ')' : '');
    const lines = [v('msg'), '', '--', W.name + ': ' + name, W.email + ': ' + v('email')];
    if (v('org')) lines.push(W.org + ': ' + v('org'));
    if (need) lines.push(W.need + ': ' + need);
    const mail = () => { location.href = 'mailto:' + f.dataset.to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(lines.join('\n')); };
    
    const key = f.dataset.key, st = f.querySelector('.ctd-sn'), btn = f.querySelector('button[type=submit]');
    if (!key) return mail();
    if (f.elements.botcheck && f.elements.botcheck.checked) return;
    if (st) st.textContent = W.go; if (btn) btn.disabled = true;
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: key, subject: subj, from_name: name, name, email: v('email'), replyto: v('email'),
        organization: v('org'), need, message: v('msg') }) })
      .then(r => r.json()).then(j => { if (!j.success) throw 0; if (st) st.textContent = W.ok; f.reset(); })
      .catch(() => { if (st) st.textContent = W.bad; setTimeout(mail, 900); })
      .finally(() => { if (btn) btn.disabled = false; });
  });
}


function nextScene() {
  const a = document.querySelector('.pnd, .pn-next'); if (!a) return;
  const box = a.querySelector('.pnd-scene, .pn-scene'), cv = box && box.querySelector('canvas'), id = a.dataset.id;
  if (!cv || !SPECS[id]) return;
  
  
  if (a.classList.contains('pnd')) {
    let sc = null, raf = 0, start = 0, on = false;
    const mk = () => { if (!sc) { const r = cv.getBoundingClientRect(); sc = new Scene(cv, SPECS[id], { size: [r.width, r.height], bg: '#161513' }); sc.resize(); cv.setAttribute('aria-label', ARIA[id] || ''); } };
    const tick = () => { raf = 0; const t = 0.3 + (now() - start) * 1.6; sc.draw(t); if (t < sc.spec.dur + 0.5) raf = requestAnimationFrame(tick); };
    const play = () => { mk(); if (RM || SEEKING) { sc.draw(sc.spec.dur + 1); return; } start = now(); if (!raf) raf = requestAnimationFrame(tick); };
    if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); on = true; play(); } }, { threshold: 0.3 }).observe(box);
    else play();
    a.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && on) play(); });
    addEventListener('resize', () => { if (sc) { sc.resize(); sc.draw(sc.spec.dur + 1); } });
    return;
  }
  if (!FINE || RM || SEEKING) return;
  let sc = null, raf = 0, start = 0;
  const tick = () => { raf = 0; const t = 0.3 + (now() - start) * 1.6; sc.draw(t); if (t < sc.spec.dur + 0.5 && a.classList.contains('show')) raf = requestAnimationFrame(tick); };
  a.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    if (!sc) { const r = box.getBoundingClientRect(); sc = new Scene(cv, SPECS[id], { size: [r.width, r.height], bg: '#161513' }); sc.resize(); cv.setAttribute('aria-label', ARIA[id] || ''); }
    a.classList.add('show'); start = now(); if (!raf) raf = requestAnimationFrame(tick);
  });
  a.addEventListener('pointerleave', () => a.classList.remove('show'));
}

const KIT = window.KIT = { Q, AR, SEEKING, RM, FINE, FACE, clamp, lerp, smooth, spring, mkRnd, fmtInt, arDigits, store, Scene, SPECS, ARIA, S_WEEK, PAPER, DARK, nokiaData,
  hello, magnets, circleMagnets, transitions, smoothWheel, layers, playScenes, workList, homeRows, workFilters, workView, reveal, clock, howSteps, STEPS, returnBar, contact, credit, contactForm, nextScene, week, goTo,
  
  pt, scatterInto, caps, wide, sceneTime,
  smoothTo: y => smoothTarget ? smoothTarget(y) : window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }) };
html.classList.add('js');

const ME = document.currentScript;
if (ME && ME.dataset.early) { transitions(); layers(); reveal(); returnBar(); clock(); contact(); credit(); logoHead(); featUnder(); noteFit(); deckSwitch(); if (ME.dataset.hello) hello(); }
})();
