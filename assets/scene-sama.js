








(() => {
'use strict';
const K = window.KIT;
if (!K) return;
const { AR, clamp, smooth } = K;
const D = K.DARK;
const fade = (t, a, d) => smooth((t - a) / (d || 0.3));
const W0 = Date.UTC(2024, 0, 7), DAY = 864e5;
const V = [12.35,10.61,11.04,14.33,11.87,11.97,12.14,16.21,14.77,11.69,11.46,15.15,16.54,11.35,10.14,10.85,14.47,12.52,11.65,11.21,15.22,13.64,14.23,8.34,12.35,13.32,11.99,10.93,11.24,14.71,13.09,13.57,11.66,14.05,13.35,12.2,11.97,13.39,13.74,12.28,11.36,11.1,15.16,13.44,13.23,11.5,14.33,14.23,12.85,11.8,13.83,15.1,13.4,11.78,11.17,15.5,13.73,13.32,13.05,17.58,13.1,13.62,14.48,20.1,10.54,12.3,11.45,11.37,15.48,13.1,12.39,11.71,15.58,14.12,11.12,10.94,13.62,14.3,13.13,12.19,11.87,15.61,13.68,13.47,13.41,15.8,14.95,13.11,12.4,12.77,16.15,13.42,12.21,11.69,16.03,13.71,13.08,12.5,15.1,14.45,13.31,12.49,13.03,17.02,14.2,14.01,12.52,16,16.11,15.34,13.9,14.53,16.14,16.15,14.79,12.97,14.71,13.37,12.31,12.08,16.63,14.17,13.68,14.26,14.38,13.77,13.23,12.37,12.6,16.93,14.24,13.02,12.26,16.31,14.6,14.19,14.17,15.8,15.84,13.79,12.92,13.37,16.51,13.53,12.6];

const RAM = [['2024-03-11', '2024-04-09', 2024], ['2025-03-01', '2025-03-29', 2025], ['2026-02-18', '2026-03-19', 2026]];
const dayOf = s => (Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) - W0) / DAY;
const ramOf = V.map((_, i) => { const a = i * 7, b = a + 6; for (const [s, e, y] of RAM) { const n = Math.min(b, dayOf(e)) - Math.max(a, dayOf(s)) + 1; if (n >= 3) return y; } return 0; });
const PEAK = V.indexOf(Math.max(...V));

const AVG = V.map((_, i) => { let s = 0, n = 0; for (let k = i - 6; k <= i + 6; k++) if (k >= 0 && k < V.length) { s += V[k]; n++; } return s / n; });
const yearAt = y => (Date.UTC(y, 0, 1) - W0) / DAY / 7;   
const W_ = {
  en: { t: 'In-store card payments in Saudi Arabia, week by week', ts: 'Card payments, week by week',
        u: 'Billion riyals, Jan 2024 to Oct 2026', us: 'Billion riyals', ram: 'Ramadan', ramw: 'Ramadan weeks', avg: '13-week average',
        pk: y => `Busiest week: ${V[PEAK].toFixed(1)} billion riyals`, pk2: 'the last week of Ramadan 2025',
        ck: 'Checked against SAMA’s weekly reports', ck2: '9,816 of 9,836 city figures match', cks: '9,816 / 9,836 match' },
  ar: { t: 'مدفوعات البطاقات في نقاط البيع بالسعودية، أسبوعًا بأسبوع', ts: 'مدفوعات البطاقات، أسبوعًا بأسبوع',
        u: 'بالمليار ريال، من يناير 2024 حتى أكتوبر 2026', us: 'بالمليار ريال', ram: 'رمضان', ramw: 'أسابيع رمضان', avg: 'متوسط 13 أسبوعًا',
        pk: y => `أعلى أسبوع: ${V[PEAK].toFixed(1)} مليار ريال`, pk2: 'آخر أسبوع في رمضان 2025',
        ck: 'مطابَقة مع تقارير ساما الأسبوعية', ck2: '9,816 من 9,836 رقمًا للمدن متطابقة', cks: '9,816 / 9,836 متطابقة' }
}[AR ? 'ar' : 'en'];

const S_SAMA2 = {
  dur: 4.2,
  build(W, H) {
    const wd = W / H > 1.25, sm = Math.min(W, H) < 380, pad = wd ? clamp(W * 0.03, 18, 40) : clamp(W * 0.055, 14, 26);
    const m = { wd, sm, pad, W, H };
    m.fT = wd ? clamp(W * 0.016, 13, 21) : clamp(W * 0.042, 12, 17);       
    m.fS = wd ? clamp(W * 0.0105, 10.5, 14) : clamp(W * 0.032, 10, 12.5);  
    
    m.top = wd ? pad + m.fT * 1.2 + m.fS * 1.6 * 2 + m.fS * 2.6 : pad + m.fT * 1.2 + m.fS * 1.9;
    m.badgeH = wd ? m.fS * 3.4 : m.fS * 2.6;
    m.bot = H - pad - m.fS * 1.9 - (wd ? 0 : m.badgeH + 6);                 
    m.yl = pad + (wd ? m.fS * 2.6 : m.fS * 2.2);                            
    m.x0 = m.yl; m.x1 = W - pad;
    m.vmax = 22;
    m.y = v => m.bot - (m.bot - m.top) * v / m.vmax;
    const n = V.length, slot = (m.x1 - m.x0) / n; m.slot = slot; m.bw = Math.max(1, slot * 0.62);
    m.cx = i => m.x0 + slot * (i + 0.5);
    return m;
  },
  draw(sc, c, m, t) {
    const { pad, W, H } = m, ink = D.ink, acc = D.acc, mute = D.mute;
    const a0 = fade(t, 0.05, 0.4);
    
    sc.text(m.wd ? W_.t : W_.ts, pad, pad + m.fT, { size: m.fT, w: 550, color: ink, a: a0 });
    sc.text(m.wd ? W_.u : W_.us, pad, pad + m.fT + m.fS * 1.55, { size: m.fS, w: 450, color: mute, a: a0 });
    if (m.wd) {   
      const lx = pad + sc.measure(W_.u, { size: m.fS, w: 450 }) + 22, ly = pad + m.fT + m.fS * 1.55 - m.fS * 0.32;
      c.globalAlpha = a0; c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(sc.X(lx), ly); c.lineTo(sc.X(lx + 18), ly); c.stroke();
      sc.text(W_.avg, lx + 24, ly + m.fS * 0.32, { size: m.fS, w: 450, color: mute, a: a0 });
      const rx = lx + 24 + sc.measure(W_.avg, { size: m.fS, w: 450 }) + 20;
      c.globalAlpha = a0 * 0.85; c.fillStyle = acc; const q = m.fS * 0.7; c.fillRect(Math.min(sc.X(rx), sc.X(rx + q)), ly - q / 2, q, q);
      sc.text(W_.ramw, rx + q + 6, ly + m.fS * 0.32, { size: m.fS, w: 450, color: mute, a: a0 });
    }
    
    c.lineWidth = 1;
    for (const g of [0, 5, 10, 15, 20]) {
      const y = Math.round(m.y(g)) + 0.5;
      c.globalAlpha = a0 * (g ? 0.13 : 0.32); c.strokeStyle = ink;
      c.beginPath(); c.moveTo(sc.X(m.x0), y); c.lineTo(sc.X(m.x1), y); c.stroke();
      if (!m.sm || g % 10 === 0) sc.text(String(g), m.yl - 6, y + m.fS * 0.35, { size: m.fS * 0.92, w: 450, color: mute, a: a0, al: 'end' });
    }
    
    for (const y of [2024, 2025, 2026]) {
      const wk = Math.max(0, yearAt(y)), x = m.x0 + m.slot * wk;
      if (y > 2024) { c.globalAlpha = a0 * 0.22; c.strokeStyle = ink; c.beginPath(); c.moveTo(sc.X(x) + 0.5, m.bot); c.lineTo(sc.X(x) + 0.5, m.bot + 5); c.stroke(); }
      sc.text(String(y), x + (y > 2024 ? 5 : 0), m.bot + m.fS * 1.35, { size: m.fS, w: 450, color: mute, a: a0 });
    }
    
    const grow = i => smooth((t - 0.25 - (i / V.length) * 1.9) / 0.35);
    for (const [s, e, yr] of RAM) {
      const i0 = ramOf.indexOf(yr), i1 = ramOf.lastIndexOf(yr); if (i0 < 0) continue;
      const xa = m.x0 + m.slot * i0, xb = m.x0 + m.slot * (i1 + 1), a = grow(i1);
      c.globalAlpha = 0.1 * a; c.fillStyle = acc;
      const L = Math.min(sc.X(xa), sc.X(xb)); c.fillRect(L, m.top - 4, Math.abs(sc.X(xb) - sc.X(xa)), m.bot - m.top + 4);
      if (m.wd) sc.text(W_.ram + ' ' + yr, (xa + xb) / 2, m.top - 8, { size: m.fS * 0.9, w: 550, color: acc, a, al: 'center' });   
    }
    
    for (let i = 0; i < V.length; i++) {
      const g = grow(i); if (g <= 0) continue;
      const x = m.cx(i), y = m.y(V[i] * g), r = ramOf[i];
      c.globalAlpha = i === PEAK ? 1 : r ? 0.85 : 0.34; c.fillStyle = r ? acc : ink;
      const X = sc.X(x) - m.bw / 2; c.fillRect(X, y, m.bw, m.bot - y);
    }
    
    const la = smooth((t - 1.7) / 1.1);
    if (la > 0) {
      c.globalAlpha = 0.95; c.strokeStyle = ink; c.lineWidth = m.wd ? 1.6 : 1.3; c.lineJoin = 'round';
      const nn = Math.max(2, Math.round(V.length * la));
      c.beginPath(); for (let i = 0; i < nn; i++) { const x = sc.X(m.cx(i)), y = m.y(AVG[i]); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    }
    
    const pa = fade(t, 2.7, 0.45);
    if (pa > 0) {
      const x = m.cx(PEAK), y = m.y(V[PEAK]);
      c.globalAlpha = pa; c.fillStyle = acc; c.beginPath(); c.arc(sc.X(x), y - 6, 3, 0, Math.PI * 2); c.fill();
      const lx = x + m.slot * 2.2, ly = y - 4;
      c.globalAlpha = pa * 0.6; c.strokeStyle = acc; c.lineWidth = 1; c.beginPath(); c.moveTo(sc.X(x) + (AR ? -5 : 5), y - 6); c.lineTo(sc.X(lx) + (AR ? 4 : -4), ly - m.fS * 0.35); c.stroke();
      sc.text(W_.pk(), lx, ly, { size: m.fS, w: 600, color: acc, a: pa });
      if (!m.sm) sc.text(W_.pk2, lx, ly + m.fS * 1.35, { size: m.fS * 0.92, w: 450, color: ink, a: pa * 0.8 });
    }
    
    const ba = fade(t, 3.0, 0.45);
    if (ba > 0) {
      const bx = pad, by = m.wd ? pad + m.fT + m.fS * 1.55 + m.fS * 1.9 : H - pad - m.badgeH + m.fS;
      const tk = smooth((t - 3.0) / 0.5), r = m.fS * 0.75, cx = bx + r, cy = by + m.fS * 0.2;
      c.globalAlpha = ba; c.strokeStyle = acc; c.lineWidth = 1.4; c.beginPath(); c.arc(sc.X(cx), cy, r, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath();
      const p0 = [cx - r * 0.45, cy + r * 0.02], p1 = [cx - r * 0.1, cy + r * 0.38], p2 = [cx + r * 0.5, cy - r * 0.35];
      c.moveTo(sc.X(p0[0]), p0[1]);
      if (tk < 0.4) { const f = tk / 0.4; c.lineTo(sc.X(p0[0] + (p1[0] - p0[0]) * f), p0[1] + (p1[1] - p0[1]) * f); }
      else { const f = (tk - 0.4) / 0.6; c.lineTo(sc.X(p1[0]), p1[1]); c.lineTo(sc.X(p1[0] + (p2[0] - p1[0]) * f), p1[1] + (p2[1] - p1[1]) * f); }
      c.stroke(); c.lineCap = 'butt';
      const tx = bx + r * 2 + 9;
      if (m.wd) sc.text(W_.ck + ': ' + W_.ck2, tx, cy + m.fS * 0.35, { size: m.fS, w: 550, color: ink, a: ba });
      else sc.text(m.sm ? W_.cks : W_.ck2, tx, cy + m.fS * 0.35, { size: m.fS * 0.95, w: 550, color: ink, a: ba });
    }
    c.globalAlpha = 1;
  }
};




const G = () => (window.KIT_DATA && window.KIT_DATA.sama && window.KIT_DATA.sama.grid) || null;
const MON = (AR ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
const TX = AR ? {
  big: 'من 9,836 رقمًا أسبوعيًا للمدن تساوي تقارير ساما', big1: 'من 9,836 رقمًا أسبوعيًا للمدن', big2: 'تساوي تقارير ساما', odd: 'بالكهرماني: أسبوع 24 إلى 30 مارس 2024، ملف ساما ناقص فيه وبيانات البوابة كاملة', oddk: 'أسبوع 24 إلى 30 مارس 2024: ملف ساما ناقص فيه، وبيانات البوابة كاملة', parts: [['145', 'أسبوعًا'], ['60', 'مدينة، وما سواها'], ['2', 'رقمان لكل منها: العمليات وقيمتها']],
  more: '51 مدينة أخرى', short: '9,816 / 9,836 متطابقة', dots: 'كل أسبوع مطابَق مع تقرير ساما', dsub: 'حجم النقطة: عدد المدن في تقرير الأسبوع، 10 ثم 61 من يونيو 2025',
  zt: 'مصدران يلتقيان أسبوعًا بأسبوع', za: 'البوابة: كل يوم', zb: 'ملف ساما: كل أسبوع', zodd: 'هنا ينقص ملف ساما نصف يوم سبت، وتُعتمد البوابة' }
 : {
  big: 'of 9,836 weekly city figures equal SAMA’s reports', big1: 'of 9,836 weekly city figures', big2: 'equal SAMA’s reports', odd: 'In amber: the week of 24 to 30 Mar 2024, where SAMA’s PDF is short and the portal is complete', oddk: 'The week of 24 to 30 Mar 2024: SAMA’s PDF is short, the portal is complete', parts: [['145', 'weeks'], ['60', 'cities, plus the rest'], ['2', 'figures each: payments and value']],
  more: '51 more cities', short: '9,816 / 9,836 match', dots: 'Every week, checked against SAMA’s report', dsub: 'Dot size: the cities in that week’s report, 10, then 61 from Jun 2025',
  zt: 'Two sources, matched week by week', za: 'Portal: every day', zb: 'SAMA’s PDF: every week', zodd: 'Here SAMA’s PDF misses half a Saturday; the portal is kept' };
const monthOfWeek = i => { const d = new Date(W0 + i * 7 * DAY); return (d.getUTCFullYear() - 2024) * 12 + d.getUTCMonth(); };
const NM = monthOfWeek(144) + 1;

const wrapT = (sc, s, w, o) => { const out = []; let cur = ''; for (const wd of s.split(' ')) { const nx = cur ? cur + ' ' + wd : wd; if (cur && sc.measure(nx, o) > w) { out.push(cur); cur = wd; } else cur = nx; } if (cur) out.push(cur); return out; };

const S_G1 = {
  dur: 4.0,
  build(W, H) {
    const g = G(), wd = W / H > 1.25, pad = wd ? clamp(W * 0.03, 18, 40) : clamp(W * 0.06, 14, 26);
    const m = { wd, pad, W, H };
    const long = g ? g.rows.filter(r => r.start === 0) : [];
    m.rows = long.map(r => AR ? r.ar : r.en).concat([TX.more]);
    m.late = monthOfWeek(g ? g.late0 : 77);
    m.fS = wd ? clamp(W * 0.0105, 10.5, 14) : clamp(W * 0.032, 10, 12.5);
    m.tx0 = pad; m.tx1 = wd ? pad + W * 0.2 : 0;   
    m.nameW = wd ? clamp(W * 0.075, 70, 110) : clamp(W * 0.2, 54, 80);
    m.gx0 = (wd ? m.tx1 + W * 0.025 : pad) + m.nameW; m.gx1 = W - pad;
    m.gy0 = wd ? pad + H * 0.12 : pad + m.fS * 3.4; m.gy1 = H - pad - m.fS * 2.6;
    m.cw = (m.gx1 - m.gx0) / NM; m.ch = (m.gy1 - m.gy0) / m.rows.length; m.sq = Math.min(m.cw, m.ch) * 0.7;
    return m;
  },
  draw(sc, c, m, t) {
    const ink = D.ink, acc = D.acc, mute = D.mute, n = m.rows.length, a0 = fade(t, 0.05, 0.4);
    for (let r = 0; r < n; r++) sc.text(m.rows[r], m.gx0 - 10, m.gy0 + m.ch * (r + 0.5) + m.fS * 0.35, { size: m.fS * (r === n - 1 ? 0.9 : 1), w: 450, color: r === n - 1 ? mute : ink, a: a0 * (r === n - 1 ? 0.8 : 0.72), al: 'end' });
    for (let j = 0; j < NM; j += 12) sc.text(String(2024 + j / 12), m.gx0 + m.cw * j, m.gy1 + m.fS * 1.6, { size: m.fS, w: 450, color: mute, a: a0 });
    for (let j = 0; j < NM; j++) {
      const ta = 0.35 + j * (2.0 / NM), u = smooth((t - ta) / 0.35); if (u <= 0) continue;
      const fresh = 1 - smooth((t - ta - 0.35) / 0.6);
      for (let r = 0; r < n; r++) {
        if (r === n - 1 && j < m.late) continue;
        const bad = r < n - 1 && j === 2, x = m.gx0 + m.cw * (j + 0.5), y = m.gy0 + m.ch * (r + 0.5), q = m.sq * (0.6 + 0.4 * u);
        c.globalAlpha = bad ? u : u * (0.13 + 0.22 * fresh); c.fillStyle = bad ? acc : ink;
        const X = sc.X(x) - q / 2; c.beginPath(); if (c.roundRect) c.roundRect(X, y - q / 2, q, q, Math.min(3, q * 0.18)); else c.rect(X, y - q / 2, q, q); c.fill();
      }
    }
    const ta = fade(t, 2.3, 0.6);
    if (m.wd) {
      
      
      const fb = clamp(m.W * 0.06, 40, 100), ax0 = m.pad, ax1 = m.gx0 - m.nameW - 12, cx = (ax0 + ax1) / 2, ww = ax1 - ax0 - 8;
      const fo = { size: m.fS * 1.05, w: 450 }, no = { size: m.fS, w: 450 };
      
      { const w0 = sc.measure(TX.big, fo); if (w0 > ww) fo.size = Math.max(m.fS * 0.82, fo.size * ww / w0); }
      const lines = wrapT(sc, TX.big, ww + 2, fo), gap = fb * 0.36 + m.fS * 1.5;
      const gh = fb * 0.95 + gap + (lines.length - 1) * m.fS * 1.6, y0 = (m.gy0 + m.gy1) / 2 - gh / 2;
      sc.text('9,816', cx, y0 + fb * 0.95, { size: fb, w: 500, color: ink, a: ta, al: 'center' });
      lines.forEach((l, k) => sc.text(l, cx, y0 + fb * 0.95 + gap + k * m.fS * 1.6, { ...fo, color: mute, a: ta, al: 'center' }));
      const na = fade(t, 2.7, 0.5), q = m.fS * 0.72, notes = wrapT(sc, TX.oddk, ax1 - ax0 - q - 10, no);
      notes.forEach((l, k) => { const y = m.gy1 - (notes.length - 1 - k) * m.fS * 1.55;
        if (!k) { c.globalAlpha = na; c.fillStyle = acc; c.fillRect(Math.min(sc.X(m.tx0), sc.X(m.tx0 + q)), y - m.fS * 0.66, q, q); }
        sc.text(l, m.tx0 + q + 9, y, { ...no, color: ink, a: na * 0.78 }); });
    } else sc.text(TX.short, m.pad, m.pad + m.fS * 1.6, { size: m.fS * 1.15, w: 550, color: ink, a: ta });
    c.globalAlpha = 1;
  }
};

const S_DOTS = {
  dur: 4.2,
  build(W, H) {
    const g = G(), wd = W / H > 1.25, pad = wd ? clamp(W * 0.03, 18, 40) : clamp(W * 0.06, 14, 26);
    const m = { wd, pad, W, H, late0: g ? g.late0 : 77 };
    m.fT = wd ? clamp(W * 0.016, 13, 21) : clamp(W * 0.045, 12, 17); m.fS = wd ? clamp(W * 0.0105, 10.5, 14) : clamp(W * 0.032, 10, 12.5);
    m.top = pad + m.fT * 1.2 + m.fS * (wd ? 3.6 : 2.2);
    m.yearW = wd ? clamp(W * 0.05, 46, 70) : 40;
    m.x0 = pad + m.yearW; m.x1 = W - pad; m.cols = 53;
    m.rowH = (H - pad - m.fS * 2.4 - m.top) / 3;
    m.cw = (m.x1 - m.x0) / m.cols;
    m.pos = V.map((_, i) => { const d = new Date(W0 + i * 7 * DAY), y0 = Date.UTC(d.getUTCFullYear(), 0, 1); return [d.getUTCFullYear() - 2024, Math.floor((d - y0) / DAY / 7)]; });
    m.rMax = Math.min(m.cw, m.rowH) * 0.42; m.rMin = m.rMax * Math.sqrt(10 / 61);
    return m;
  },
  draw(sc, c, m, t) {
    const ink = D.ink, acc = D.acc, mute = D.mute, a0 = fade(t, 0.05, 0.4);
    sc.text(m.wd ? TX.dots : TX.short, m.pad, m.pad + m.fT, { size: m.fT, w: 550, color: ink, a: a0 });
    if (m.wd) sc.text(TX.dsub, m.pad, m.pad + m.fT + m.fS * 1.6, { size: m.fS, w: 450, color: mute, a: a0 });
    for (let y = 0; y < 3; y++) sc.text(String(2024 + y), m.pad, m.top + m.rowH * (y + 0.5) + m.fS * 0.35, { size: m.fS, w: 500, color: mute, a: a0 });
    if (m.wd) for (let k = 0; k < 12; k++) sc.text(MON[k], m.x0 + m.cw * (k * 52 / 12), m.top - m.fS * 0.4, { size: m.fS * 0.85, w: 450, color: mute, a: a0 * 0.8 });
    for (let i = 0; i < V.length; i++) {
      const [yr, wk] = m.pos[i], u = smooth((t - 0.3 - i * (2.2 / V.length)) / 0.3); if (u <= 0) continue;
      const bad = i === 11, r = (i >= m.late0 ? m.rMax : m.rMin) * (0.4 + 0.6 * u), x = sc.X(m.x0 + m.cw * (wk + 0.5)), y = m.top + m.rowH * (yr + 0.5);
      c.globalAlpha = bad ? u : u * 0.42; c.fillStyle = bad ? acc : ink; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      if (bad) { const pa = fade(t, 2.7, 0.5); c.globalAlpha = pa * 0.7; c.strokeStyle = acc; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r + 7, 0, Math.PI * 2); c.stroke();
        if (m.wd) sc.text(TX.odd, m.x0 + m.cw * (wk + 0.5) + 18, y + m.rowH * 0.44, { size: m.fS * 0.95, w: 450, color: acc, a: pa }); }
    }
    if (m.wd) sc.text('9,816 / 9,836', m.x1, m.pad + m.fT, { size: m.fT, w: 600, color: ink, a: fade(t, 2.9, 0.5), al: 'end' });
    c.globalAlpha = 1;
  }
};

const S_ZIP = {
  dur: 4.6,
  build(W, H) {
    const wd = W / H > 1.25, pad = wd ? clamp(W * 0.03, 18, 40) : clamp(W * 0.06, 14, 26);
    const m = { wd, pad, W, H };
    m.fT = wd ? clamp(W * 0.016, 13, 21) : clamp(W * 0.045, 12, 17); m.fS = wd ? clamp(W * 0.0105, 10.5, 14) : clamp(W * 0.032, 10, 12.5);
    m.lw = wd ? clamp(W * 0.12, 90, 170) : 0;
    m.x0 = pad + m.lw; m.x1 = W - pad;
    m.mid = H * (wd ? 0.56 : 0.52); m.gap = H * 0.2;
    m.n = wd ? V.length : 52;
    m.cw = (m.x1 - m.x0) / m.n;
    return m;
  },
  draw(sc, c, m, t) {
    const ink = D.ink, acc = D.acc, mute = D.mute, a0 = fade(t, 0.05, 0.4);
    sc.text(TX.zt, m.pad, m.pad + m.fT, { size: m.fT, w: 550, color: ink, a: a0 });
    if (m.wd) { sc.text(TX.za, m.pad, m.mid - m.gap * 0.55, { size: m.fS, w: 450, color: mute, a: a0 }); sc.text(TX.zb, m.pad, m.mid + m.gap * 0.65, { size: m.fS, w: 450, color: mute, a: a0 }); }
    const hT = m.gap * 0.5, bw = m.cw * 0.7;
    for (let i = 0; i < m.n; i++) {
      const t0 = 0.4 + i * (2.4 / m.n), u = smooth((t - t0) / 0.6), x = m.x0 + m.cw * (i + 0.5), bad = i === 11;
      
      const yT = m.mid - m.gap + (m.gap - hT - 2) * u;
      for (let d = 0; d < 7; d++) {
        if (bad && d === 6 && u > 0.6) continue;
        const dx = (d - 3) * (bw / 7) * (1 + (1 - u) * 0.8);
        c.globalAlpha = 0.22 + 0.4 * u; c.fillStyle = ink; c.fillRect(sc.X(x + dx) - 0.6, yT, 1.2, hT);
      }
      
      const yB = m.mid + m.gap - (m.gap - 2) * u;
      c.globalAlpha = bad ? 0.95 : 0.18 + 0.3 * u; c.fillStyle = bad ? acc : ink; c.fillRect(sc.X(x) - bw / 2, yB, bw, hT * 0.6);
    }
    
    const sa = smooth((t - 2.9) / 0.6); if (sa > 0) { c.globalAlpha = 0.6 * sa; c.fillStyle = acc; const L = Math.min(sc.X(m.x0), sc.X(m.x1)); c.fillRect(L, m.mid - 0.5, Math.abs(sc.X(m.x1) - sc.X(m.x0)), 1); }
    const pa = fade(t, 3.2, 0.5);
    if (m.wd && pa > 0) { const x = m.x0 + m.cw * 11.5; c.globalAlpha = pa; c.strokeStyle = acc; c.lineWidth = 1; c.beginPath(); c.moveTo(sc.X(x), m.mid + m.gap * 0.45); c.lineTo(sc.X(x), m.mid + m.gap * 1.05); c.stroke();
      sc.text(TX.zodd, x + 8, m.mid + m.gap * 1.05 + m.fS * 0.3, { size: m.fS, w: 450, color: acc, a: pa }); }
    sc.text(TX.short, m.x1, m.H - m.pad, { size: m.fS * 1.2, w: 600, color: ink, a: fade(t, 3.4, 0.5), al: 'end' });
    c.globalAlpha = 1;
  }
};

const SV = new URLSearchParams(location.search).get('sv');
const VARS = { bars: S_SAMA2, g1: S_G1, g2: S_DOTS, z: S_ZIP };

if (SV !== 'old') K.SPECS.sama = VARS[SV] || S_G1;
if (SV !== 'old' && SV !== 'bars') K.ARIA.sama = K.arDigits(AR
  ? 'رسم بيانات حقيقية: كل رقم أسبوعي للمدن مطابَق مع تقارير ساما الأسبوعية من يناير 2024 حتى أكتوبر 2026، مربع لكل مدينة وشهر للمدن العشر، وصف واحد لـ51 مدينة أخرى من يونيو 2025. 9,816 من 9,836 رقمًا متطابقة. وبالكهرماني أسبوع 24 إلى 30 مارس 2024، ملف ساما ناقص فيه وبيانات البوابة كاملة.'
  : 'Chart of real data: every weekly city figure checked against SAMA’s weekly reports from January 2024 to October 2026, one square per city and month for the ten cities, and one row for 51 more cities from June 2025. 9,816 of 9,836 figures match. In amber: the week of 24 to 30 March 2024, where SAMA’s PDF is short and the portal is complete.');
if (SV === 'bars') K.ARIA.sama = K.arDigits(AR
  ? 'رسم بيانات حقيقية: مدفوعات البطاقات في نقاط البيع بالسعودية لكل أسبوع من يناير 2024 حتى أكتوبر 2026، عمود لكل أسبوع بالمليار ريال، وأسابيع رمضان الثلاثة بالكهرماني، وخط متوسط 13 أسبوعًا. أعلى أسبوع 20.1 مليار ريال، آخر أسبوع في رمضان 2025. والأرقام مطابَقة مع تقارير ساما الأسبوعية: 9,816 من 9,836 رقمًا للمدن.'
  : 'Chart of real data: in-store card payments in Saudi Arabia for every week from January 2024 to October 2026, one column per week in billions of riyals, the three Ramadans in amber and a 13-week average line. The busiest week was 20.1 billion riyals, the last week of Ramadan 2025. The figures are checked against SAMA’s weekly reports: 9,816 of 9,836 city figures match.');
})();
