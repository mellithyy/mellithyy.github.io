












(() => {
'use strict';
const K = window.KIT;
if (!K) return;
const { AR, clamp, lerp, smooth } = K;
const D = K.DARK;
const fade = (t, a, d) => smooth((t - a) / (d || 0.3));
const LATIN = '"Switzer", sans-serif';
const T = (en, ar) => AR ? ar : en;


function lat(sc, s, x, y, size, o = {}) {
  const c = sc.ctx;
  c.font = `${o.w || 600} ${size}px ${LATIN}`; try { c.fontStretch = 'normal'; } catch (e) {}
  c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const w = c.measureText(s).width;
  if (o.measure) return w;
  const X = sc.X(x), al = o.al || 'start';
  const lx = al === 'center' ? X - w / 2 : (al === 'start') !== AR ? X : X - w;
  c.globalAlpha = o.a == null ? 1 : o.a; c.fillStyle = o.color || D.ink; c.fillText(s, lx, y);
  return w;
}
const latW = (sc, s, size, w) => lat(sc, s, 0, 0, size, { measure: true, w });

function latFit(sc, s, maxW, size, w) {
  let z = size; const min = Math.max(8, size * 0.75);
  while (z > min && latW(sc, s, z, w) > maxW) z -= 0.5;
  let out = s;
  while (out.length > 3 && latW(sc, out, z, w) > maxW) out = out.slice(0, -2) + '…';
  return { s: out, z };
}

function fit(sc, forms, maxW, o) {
  for (const s of forms) if (sc.measure(s, o) <= maxW) return s;
  let s = forms[forms.length - 1];
  while (s.length > 2 && sc.measure(s + '…', o) > maxW) s = s.slice(0, -1);
  return s + '…';
}


const ROWS = [
  ['C01', 'Line', ['Region A', 'المنطقة أ'], 'E01', '100 * `CS_OK` / `CS_ATT`', 'line'],
  ['C02', 'Overlay', ['Region A', 'المنطقة أ'], 'E02', '`DL_GB` + `UL_GB`', 'overlay'],
  ['C03', 'Stacked Bar', ['A; B', 'أ؛ ب'], 'E03–E05', '`TRAF_2G` | `TRAF_3G` | `TRAF_4G`', 'stacked'],
  ['C04', 'Line', ['Region B', 'المنطقة ب'], 'E09', '100 * `DROPS` / `CS_SUCES`', 'bad'],
  ['C05', 'Line-Area', ['Region B', 'المنطقة ب'], 'E06; E07', '`DL_GB` + `UL_GB` | 100 * `DROPS` / `CS_OK`', 'area'],
  ['C06', 'Pie', ['Region A', 'المنطقة أ'], 'E08', '100 * `AV_OK` / `AV_ALL`', 'pie'],
];
const BADK = '`CS_SUCES`';

const LINE = [0.62, 0.66, 0.6, 0.7, 0.68, 0.74, 0.71, 0.76, 0.73, 0.8, 0.78, 0.84];
const OV = [[0.2, 0.16, 0.12, 0.1, 0.1, 0.14, 0.26, 0.42, 0.55, 0.6, 0.62, 0.64, 0.66, 0.64, 0.63, 0.66, 0.7, 0.76, 0.84, 0.9, 0.88, 0.74, 0.52, 0.32],
            [0.18, 0.14, 0.11, 0.09, 0.1, 0.13, 0.22, 0.36, 0.48, 0.54, 0.56, 0.57, 0.6, 0.58, 0.57, 0.6, 0.63, 0.68, 0.74, 0.78, 0.76, 0.64, 0.46, 0.28],
            [0.16, 0.13, 0.1, 0.08, 0.08, 0.12, 0.2, 0.32, 0.43, 0.48, 0.5, 0.51, 0.53, 0.52, 0.51, 0.53, 0.56, 0.6, 0.65, 0.69, 0.67, 0.57, 0.41, 0.25]];
const STK = [[0.18, 0.32], [0.17, 0.31], [0.16, 0.3], [0.15, 0.3], [0.14, 0.29], [0.14, 0.28], [0.13, 0.27]];   
const AREA = [0.3, 0.36, 0.34, 0.42, 0.46, 0.44, 0.52, 0.56, 0.54, 0.6];
const ALINE = [0.5, 0.46, 0.55, 0.48, 0.52, 0.44, 0.47, 0.42, 0.45, 0.4];
const VALS = { line: [0.62, 0.66, 0.6, 0.7, 0.68, 0.74, 0.71], overlay: [0.3, 0.5, 0.62, 0.66, 0.84, 0.9, 0.5], stacked: [0.7, 0.68, 0.69, 0.7, 0.71, 0.7, 0.7],
               area: [0.3, 0.36, 0.34, 0.42, 0.46, 0.44, 0.52], pie: [0.97, 0.98, 0.97, 0.99, 0.98, 0.98, 0.99] };

const R0 = 0.95, PER = 0.7, END = R0 + 6 * PER + 0.3;   

const S_DRG = {
  dur: 6.2,
  build(W, H) {
    const wd = W / H > 1.25;
    const s = wd ? clamp(W / 1150, 0.5, 1.2) : clamp(W / 380, 0.75, 1.3);
    const f = z => Math.max(8.5, Math.round(z * s * 10) / 10);
    const pad = Math.round(wd ? clamp(W * 0.018, 12, 26) : clamp(W * 0.036, 10, 18));
    const m = { wd, s, f, pad };
    m.capF = f(wd ? 14 : 12.5);
    m.hF = f(wd ? 11.5 : 10.5);
    m.cF = f(wd ? 11 : 9.6);
    m.footF = f(wd ? 11.5 : 10);
    if (wd) {
      m.compact = W < 760;
      m.top = pad + m.capF + Math.round(30 * s);
      const y0 = m.top + m.hF + Math.round(12 * s), gap = Math.round(W * 0.03);
      const foot = m.footF + Math.round(18 * s);
      const sw = Math.round(W * (m.compact ? 0.34 : 0.33));
      
      const ax = pad + sw + gap, aw = W - pad - ax, ah = H - pad - foot - y0;
      
      
      const slw = aw, slh = Math.min(ah, slw / 1.5), dy = Math.max(0, Math.round((ah - slh) / 2));
      m.sl = { x: ax, y: y0 + dy, w: slw, h: slh };
      
      const rowsH = m.compact ? slh : Math.min(slh * 0.62, (m.cF + 12 * s) * 7.4);
      m.sh = { x: pad, y: y0 + dy, w: sw, h: rowsH };
      m.ev = m.compact ? null : { x: pad, y: y0 + dy + rowsH + Math.round(16 * s) + m.hF, w: sw, h: 0 };
      if (m.ev) m.ev.h = y0 + dy + slh - m.ev.y;
      m.cols = m.compact ? [0.05, 0.27, null, 0.66] : [0.04, 0.2, 0.46, 0.73];
      m.footY = y0 + dy + slh + m.footF + Math.round(12 * s);
    } else {
      m.top = pad + m.capF * 2.6 + 12;
      const y0 = m.top + m.hF + 6, foot = m.footF + 14;
      const avail = H - pad - foot - y0;
      const shH = Math.round(avail * 0.4);
      m.sh = { x: pad, y: y0, w: W - 2 * pad, h: shH };
      const sy = y0 + shH + m.hF + Math.round(18 * s), ah = H - pad - foot - sy, aw = W - 2 * pad;
      const slw = aw, slh = Math.min(ah, slw / 1.5);   
      m.sl = { x: pad, y: sy, w: slw, h: slh };
      m.ev = null;
      m.cols = W >= 340 ? [0.04, 0.2, 0.47, 0.74] : [0.05, 0.26, null, 0.66];
      m.footY = sy + slh + m.footF + 10;
    }
    
    const sl = m.sl, ip = Math.max(5, Math.round(sl.w * 0.03)), th = Math.max(m.cF + 6, Math.round(sl.h * 0.13)), g = Math.max(4, Math.round(sl.w * 0.022));
    m.slT = th; m.slIp = ip;
    const pw = (sl.w - 2 * ip - 2 * g) / 3, phh = (sl.h - th - ip - g) / 2;
    m.ph = ROWS.map((_, i) => ({ x: sl.x + ip + (i % 3) * (pw + g), y: sl.y + th + Math.floor(i / 3) * (phh + g), w: pw, h: phh }));
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, wd = m.wd, s = m.s, f = m.f, pad = m.pad;
    const R = (x, y, w, h) => c.fillRect(AR ? W - x - w : x, y, w, h);
    const SR = (x, y, w, h) => c.strokeRect(Math.round(AR ? W - x - w : x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
    const L = AR ? {
      caps: [[0, 'ورقة الإعدادات: صف لكل رسم، ومكان محجوز لكل صف'], [R0, 'تُحسب معادلة كل صف على بيانات المؤشرات، ثم يُرسم في مكانه'], [R0 + 3 * PER, 'المعادلة الخاطئة تعطي رسم تحذير، لا رسمًا خاطئًا'], [R0 + 4 * PER, 'تُحسب معادلة كل صف على بيانات المؤشرات، ثم يُرسم في مكانه'], [END, 'العرض جاهز: امتلأ كل مكان محجوز']],
      sh: 'ورقة الإعدادات · الرسوم', sl: 'قالب العرض', slT: 'مؤشرات يومية', heads: [['المُعرّف'], ['النوع'], ['المجموعات'], ['المعادلات', 'المعادلة']],
      ev: 'حساب المعادلة', evOn: 'على بيانات المؤشرات', evBad: 'هذا المؤشر غير موجود في البيانات', warn: 'تحذير', warnL: ['مؤشر غير موجود', 'غير موجود'],
      done: 'حُفظ العرض: 5 رسوم وتحذير واحد', syn: 'بيانات توضيحية',
    } : {
      caps: [[0, 'The settings sheet: one row per chart, one placeholder each'], [R0, 'Each row’s equation is worked out on the KPI data, then drawn in place'], [R0 + 3 * PER, 'A bad equation gets a warning chart, not a wrong chart'], [R0 + 4 * PER, 'Each row’s equation is worked out on the KPI data, then drawn in place'], [END, 'The deck is ready: every placeholder filled']],
      sh: 'Settings sheet · charts', sl: 'Deck template', slT: 'Daily KPIs', heads: [['Chart id', 'Id'], ['Type'], ['Site groups', 'Groups'], ['Equations', 'Eq.']],
      ev: 'Working out the equation', evOn: 'on the KPI data', evBad: 'not a KPI in the data', warn: 'Warning', warnL: ['KPI not in the data', 'KPI not found', 'Not found'],
      done: 'Deck saved: 5 charts and 1 warning', syn: 'Illustrative data',
    };
    const sk = fade(t, 0, 0.45);
    
    let si = 0; for (let k = 0; k < L.caps.length; k++) if (t >= L.caps[k][0]) si = k;
    const capW = wd ? W * 0.66 : W - 2 * pad;
    L.caps.forEach(([at, txt], k) => {
      const a = k === si ? (k === 0 ? sk : smooth((t - at - 0.1) / 0.25)) : (k === si - 1 ? 1 - smooth((t - L.caps[si][0]) / 0.12) : 0);
      if (a > 0.01) sc.para(txt, pad, pad + m.capF, capW, Math.round(m.capF * 1.3), { size: m.capF, w: 650, a });
    });
    if (wd) sc.text(L.syn, W - pad, pad + m.capF, { size: f(11), color: D.mute, al: 'end', a: sk });

    const cF = m.cF, hF = m.hF;
    const rowAt = i => R0 + i * PER;
    
    const cur = t < R0 ? -1 : Math.min(6, Math.floor((t - R0) / PER));

    
    const sh = m.sh, cols = m.cols, sa = fade(t, 0.1, 0.4);
    const shHead = fit(sc, [L.sh], sh.w - latW(sc, 'xlsx', hF, 600) - 12, { size: hF, w: 700 });
    sc.text(shHead, sh.x, sh.y - Math.round(10 * s), { size: hF, w: 700, a: sa });
    lat(sc, 'xlsx', sh.x + sh.w, sh.y - Math.round(10 * s), hF, { w: 600, color: D.mute, al: 'end', a: sa });
    const drop = (1 - smooth((t - 0.1) / 0.5)) * 12 * s;
    c.globalAlpha = sa; c.fillStyle = D.page; R(sh.x, sh.y - drop, sh.w, sh.h);
    const rh = sh.h / 7, rF = Math.min(cF, rh * 0.62);
    const colW = k => { const nx = cols.slice(k + 1).find(v => v != null); return sh.w * ((nx == null ? 0.98 : nx) - cols[k]) - 6; };
    
    cols.forEach((cx, k) => {
      if (cx == null) return;
      sc.text(fit(sc, L.heads[k], colW(k), { size: rF * 0.95, w: 650 }), sh.x + sh.w * cx, sh.y - drop + rh * 0.5 + rF * 0.35, { size: rF * 0.95, w: 650, color: D.mute, a: sa });
    });
    c.globalAlpha = sa * 0.5; c.fillStyle = D.mute; R(sh.x + 4, sh.y - drop + rh, sh.w - 8, 1);
    ROWS.forEach((r, i) => {
      const y = sh.y - drop + rh * (i + 1), by = y + rh * 0.5 + rF * 0.35;
      const ra = sa * fade(t, 0.25 + i * 0.06, 0.25);
      const on = i === cur, done = i < cur, bad = r[5] === 'bad';
      if (on) { c.globalAlpha = ra * 0.9; c.fillStyle = '#4a4640'; R(sh.x + 2, y + 1, sh.w - 4, rh - 2); }
      if (on || (done && bad)) { c.globalAlpha = ra; c.fillStyle = bad && t > rowAt(i) + 0.3 ? D.acc : D.ink; R(sh.x + 2, y + 2, 3, rh - 4); }
      const dim = done || on || cur < 0 ? 1 : 0.62;
      const idS = latFit(sc, r[0], colW(0), rF, 700);
      lat(sc, idS.s, sh.x + sh.w * cols[0], by, idS.z, { w: 700, a: ra * dim });
      const tyS = latFit(sc, r[1], colW(1), rF, 500);
      lat(sc, tyS.s, sh.x + sh.w * cols[1], by, tyS.z, { w: 500, a: ra * dim });
      if (cols[2] != null) sc.text(fit(sc, [T(r[2][0], r[2][1])], colW(2), { size: rF }), sh.x + sh.w * cols[2], by, { size: rF, a: ra * dim * 0.9 });
      const eqS = latFit(sc, r[3], colW(3) - (done ? rF * 1.4 : 0), rF, 500);
      lat(sc, eqS.s, sh.x + sh.w * cols[3], by, eqS.z, { w: 500, color: bad && t > rowAt(i) + 0.3 ? D.acc : D.ink, a: ra * dim });
      
      if (done) {
        const ex = sh.x + sh.w - rF * 0.9, ey = y + rh / 2, k2 = Math.min(rh * 0.42, 9 * Math.max(0.8, s));
        if (bad) { sc.text('!', ex, ey + rF * 0.38, { size: rF * 1.15, w: 800, color: D.acc, al: 'center', a: ra }); }
        else {
          
          const X = sc.X(ex) - k2 / 2;
          c.globalAlpha = ra * 0.85; c.strokeStyle = D.ink; c.lineWidth = 1.4; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(X, ey); c.lineTo(X + k2 * 0.35, ey + k2 * 0.35); c.lineTo(X + k2, ey - k2 * 0.45); c.stroke(); c.lineCap = 'butt';
        }
      }
    });

    
    const ev = m.ev;
    if (ev && ev.h > cF * 4) {
      const ea = fade(t, 0.45, 0.4);
      sc.text(fit(sc, [L.ev], ev.w, { size: hF, w: 700 }), ev.x, ev.y - Math.round(10 * s), { size: hF, w: 700, a: ea });
      c.globalAlpha = ea * 0.55; c.fillStyle = D.page; R(ev.x, ev.y, ev.w, ev.h);
      const ip = Math.round(clamp(ev.w * 0.04, 8, 16));
      const i = clamp(cur, 0, 5), r = ROWS[i], t0 = rowAt(i);
      
      const sw = cur < 0 ? 0 : cur > 5 ? 1 : Math.min(fade(t, t0, 0.15), 1 - fade(t, t0 + PER - 0.08, 0.08) * (cur < 5 ? 1 : 0));
      const a = ea * sw, bad = r[5] === 'bad';
      const fF = Math.min(cF * 1.05, ev.h * 0.2);
      
      const line = r[3] + ' = ' + r[4];
      const ff = latFit(sc, line, ev.w - 2 * ip, fF, 600);
      if (bad && ff.s === line) {
        const k = line.indexOf(BADK), pre = line.slice(0, k);
        const w0 = latW(sc, line, ff.z, 600), wPre = latW(sc, pre, ff.z, 600);
        
        
        const lx = AR ? W - ev.x - ip - w0 : ev.x + ip;
        c.font = `600 ${ff.z}px ${LATIN}`; c.direction = 'ltr'; c.textAlign = 'left'; c.globalAlpha = a;
        c.fillStyle = D.ink; c.fillText(pre, lx, ev.y + ip + ff.z);
        c.fillStyle = D.acc; c.fillText(line.slice(k), lx + wPre, ev.y + ip + ff.z);
      } else lat(sc, ff.s, ev.x + ip, ev.y + ip + ff.z, ff.z, { w: 600, a });
      
      const vy0 = ev.y + ip + ff.z + Math.round(12 * s), vy1 = ev.y + ev.h - ip - cF - 8 * s;
      if (bad) {
        const ba = a * fade(t, t0 + 0.2, 0.2);
        sc.text(fit(sc, [L.evBad], ev.w - 2 * ip, { size: cF, w: 700 }), ev.x + ip, vy0 + cF, { size: cF, w: 700, color: D.acc, a: ba });
      } else if (vy1 - vy0 > 8) {
        const vals = VALS[r[5]], n = vals.length, bw = (ev.w - 2 * ip) / n;
        vals.forEach((v, k) => {
          const u = cur > i ? 1 : fade(t, t0 + 0.08 + k * 0.03, 0.12), hh = (vy1 - vy0) * v * u;
          c.globalAlpha = a * 0.85; c.fillStyle = D.ink; R(ev.x + ip + k * bw + bw * 0.18, vy1 - hh, bw * 0.64, hh);
        });
      }
      sc.text(fit(sc, [L.evOn + (bad ? '' : T(', ', '، ') + T(r[2][0], r[2][1]))], ev.w - 2 * ip, { size: cF }), ev.x + ip, ev.y + ev.h - ip, { size: cF, color: D.mute, a: ea * (cur < 0 ? 0 : 1) });
    }

    
    const sl = m.sl, la = fade(t, 0.3, 0.45);
    const slHead = fit(sc, [L.sl], sl.w - latW(sc, 'pptx', hF, 600) - 12, { size: hF, w: 700 });
    sc.text(slHead, sl.x, sl.y - Math.round(10 * s), { size: hF, w: 700, a: la });
    
    if (wd) lat(sc, 'pptx', sl.x + sl.w, sl.y - Math.round(10 * s), hF, { w: 600, color: D.mute, al: 'end', a: la });
    else sc.text(L.syn, sl.x + sl.w, sl.y - Math.round(10 * s), { size: f(9.5), color: D.mute, al: 'end', a: sk });
    c.globalAlpha = la; c.fillStyle = D.page; R(sl.x, sl.y, sl.w, sl.h);
    
    const stF = Math.min(f(wd ? 12 : 10.5), m.slT * 0.5);
    sc.text(fit(sc, [L.slT], sl.w * 0.6, { size: stF, w: 700 }), sl.x + m.slIp, sl.y + m.slT * 0.62, { size: stF, w: 700, a: la });
    c.globalAlpha = la * 0.45; c.fillStyle = D.mute; R(sl.x + m.slIp, sl.y + m.slT * 0.82, sl.w - 2 * m.slIp, 1);
    const idF = Math.max(8, Math.min(cF * 0.9, m.ph[0].h * 0.17));
    m.ph.forEach((p, i) => {
      const r = ROWS[i], kind = r[5], t0 = rowAt(i), u = fade(t, t0 + 0.42, 0.55), on = fade(t, t0 + 0.38, 0.12);
      const pa = la * fade(t, 0.45 + i * 0.05, 0.3);
      
      if (on < 1) {
        c.save(); c.globalAlpha = pa * (1 - on) * 0.8; c.strokeStyle = D.mute; c.lineWidth = 1; c.setLineDash([3, 3]); SR(p.x, p.y, p.w, p.h); c.restore();
        lat(sc, r[0], p.x + p.w / 2, p.y + p.h / 2 + idF * 0.35, idF * 1.1, { w: 700, color: D.mute, al: 'center', a: pa * (1 - on) });
      }
      if (on > 0) {
        c.globalAlpha = pa * on; c.fillStyle = '#34312d'; R(p.x, p.y, p.w, p.h);
        lat(sc, r[0], p.x + 4, p.y + idF + 3, idF, { w: 700, color: kind === 'bad' ? D.acc : D.mute, a: pa * on });
        const ib = { x: p.x + p.w * 0.1, y: p.y + idF + 7, w: p.w * 0.8, h: p.h - idF - 12 };
        drawKind(sc, c, kind, ib, u, pa * on, L, R, SR, idF);
      }
    });
    
    ROWS.forEach((r, i) => {
      const t0 = rowAt(i), uu = (t - (t0 + 0.12)) / 0.3; if (uu <= 0 || uu >= 1) return;
      const e = smooth(uu), p = m.ph[i];
      const x0 = ev ? ev.x + ev.w - 6 : sh.x + sh.w - 6, y0 = ev ? ev.y + ev.h * 0.5 : sh.y + sh.h / 7 * (i + 1.5);
      const x1 = p.x + p.w / 2, y1 = p.y + p.h / 2, mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 24 * s;
      for (let k = 0; k < 4; k++) {
        const ek = clamp(e - k * 0.06, 0, 1);
        const x = (1 - ek) * (1 - ek) * x0 + 2 * (1 - ek) * ek * mx + ek * ek * x1, y = (1 - ek) * (1 - ek) * y0 + 2 * (1 - ek) * ek * my + ek * ek * y1;
        c.globalAlpha = 0.85 * (1 - Math.max(0, ek - 0.85) * 6); c.fillStyle = r[5] === 'bad' ? D.acc : D.ink;
        c.beginPath(); c.arc(sc.X(x), y, 2 * Math.max(0.8, s), 0, 6.2832); c.fill();
      }
    });
    
    const da = fade(t, END, 0.35);
    if (da > 0) {
      const dF = m.footF, sw2 = sc.measure(L.done, { size: dF, w: 700 });
      const txt = fit(sc, [L.done], sl.w - 20, { size: dF, w: 700 });
      const tx = sl.x + sl.w, ty = m.footY;
      sc.text(txt, tx, ty, { size: dF, w: 700, al: 'end', a: da });
      const w2 = Math.min(sw2, sl.w - 20), k2 = 8 * Math.max(0.8, s), X = AR ? W - tx + w2 + 6 : tx - w2 - 14, yy = ty - dF * 0.35;
      c.globalAlpha = da; c.strokeStyle = D.ink; c.lineWidth = 1.5; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(X, yy); c.lineTo(X + k2 * 0.35, yy + k2 * 0.35); c.lineTo(X + k2, yy - k2 * 0.45); c.stroke(); c.lineCap = 'butt';
    }
  },
};


function drawKind(sc, c, kind, b, u, a, L, R, SR, idF) {
  if (b.w < 8 || b.h < 8) return;
  const X = x => sc.X(x);
  const ax = (left, right) => {
    c.globalAlpha = a * 0.6; c.fillStyle = D.mute;
    R(b.x, b.y + b.h, b.w, 1);
    if (left) R(b.x, b.y, 1, b.h);
    if (right) R(b.x + b.w - 1, b.y, 1, b.h);
  };
  const poly = (pts, n) => {
    c.beginPath();
    const last = Math.max(0, Math.min(pts.length - 1, n));
    for (let k = 0; k <= Math.floor(last); k++) { const [x, y] = pts[k]; if (k === 0) c.moveTo(X(x), y); else c.lineTo(X(x), y); }
    const fl = Math.floor(last);
    if (fl < pts.length - 1 && last > fl) { const [x1, y1] = pts[fl], [x2, y2] = pts[fl + 1], q = last - fl; c.lineTo(X(x1 + (x2 - x1) * q), y1 + (y2 - y1) * q); }
  };
  const ser = (vals, lo, hi) => vals.map((v, k) => [b.x + b.w * (k / (vals.length - 1)), b.y + b.h - (v - lo) / (hi - lo) * b.h]);
  if (kind === 'line') {
    ax(true, false);
    const pts = ser(LINE, 0.5, 0.9);
    c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = 1.6; c.lineJoin = 'round'; poly(pts, u * (pts.length - 1)); c.stroke();
  } else if (kind === 'overlay') {
    ax(true, false);
    const sty = [[D.ink, 1.6, []], [D.mute, 1.1, []], [D.mute, 1.1, [3, 2]]];
    for (let j = 2; j >= 0; j--) {
      const pts = ser(OV[j], 0, 1);
      c.save(); c.globalAlpha = a * (j ? 0.9 : 1); c.strokeStyle = sty[j][0]; c.lineWidth = sty[j][1]; c.setLineDash(sty[j][2]); c.lineJoin = 'round';
      poly(pts, clamp(u * 1.25 - j * 0.12, 0, 1) * (pts.length - 1)); c.stroke(); c.restore();
    }
  } else if (kind === 'stacked') {
    ax(false, false);
    const n = STK.length, bw = b.w / n;
    STK.forEach(([p1, p2], k) => {
      const uk = clamp(u * 1.4 - k * 0.06, 0, 1); if (uk <= 0) return;
      const x = b.x + k * bw + bw * 0.16, w = bw * 0.68, H0 = b.h * uk, y1 = b.y + b.h;
      c.globalAlpha = a; c.fillStyle = '#6b665d'; R(x, y1 - H0 * p1, w, H0 * p1);
      c.fillStyle = D.mute; R(x, y1 - H0 * p2, w, H0 * (p2 - p1));
      c.fillStyle = D.ink; R(x, y1 - H0, w, H0 * (1 - p2));
    });
  } else if (kind === 'area') {
    ax(true, true);
    const pa = ser(AREA, 0, 0.7), pl = ser(ALINE, 0.2, 0.7), n = u * (pa.length - 1);
    
    c.save(); c.beginPath(); c.rect(Math.min(X(b.x), X(b.x + b.w * u)), b.y - 2, b.w * u, b.h + 3); c.clip();
    c.globalAlpha = a * 0.32; c.fillStyle = D.ink; c.beginPath(); c.moveTo(X(pa[0][0]), b.y + b.h);
    pa.forEach(([x, y]) => c.lineTo(X(x), y)); c.lineTo(X(pa[pa.length - 1][0]), b.y + b.h); c.closePath(); c.fill(); c.restore();
    
    c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = 1.6; c.lineJoin = 'round'; poly(pl, n); c.stroke();
    
    c.globalAlpha = a * 0.7; c.fillStyle = D.mute;
    for (let k = 1; k <= 3; k++) { const y = b.y + b.h * (1 - k / 4); R(b.x - 3, y, 3, 1); R(b.x + b.w, y, 3, 1); }
  } else if (kind === 'pie') {
    const r = Math.min(b.w, b.h) * 0.46, cx = b.x + b.w / 2, cy = b.y + b.h / 2, lw = Math.max(3, r * 0.34);
    c.globalAlpha = a * 0.5; c.strokeStyle = D.mute; c.lineWidth = lw; c.beginPath(); c.arc(X(cx), cy, Math.max(0.5, r - lw / 2), 0, 6.2832); c.stroke();
    const end = -Math.PI / 2 + 6.2832 * 0.87 * u;
    c.globalAlpha = a; c.strokeStyle = D.ink; c.beginPath();
    if (AR) c.arc(X(cx), cy, Math.max(0.5, r - lw / 2), -Math.PI / 2, -Math.PI / 2 - 6.2832 * 0.87 * u, true); else c.arc(X(cx), cy, Math.max(0.5, r - lw / 2), -Math.PI / 2, end);
    c.stroke();
  } else if (kind === 'bad') {
    
    const ua = smooth(u * 1.6);
    c.globalAlpha = a * ua; c.strokeStyle = D.acc; c.lineWidth = 1.4; SR(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
    const tz = Math.min(b.h * 0.42, b.w * 0.22), tx = b.x + b.w * 0.5, ty = b.y + b.h * (b.h > 40 ? 0.42 : 0.5);
    c.beginPath(); c.moveTo(X(tx), ty - tz * 0.55); c.lineTo(X(tx + tz * 0.6), ty + tz * 0.45); c.lineTo(X(tx - tz * 0.6), ty + tz * 0.45); c.closePath(); c.stroke();
    sc.text('!', tx, ty + tz * 0.32, { size: Math.max(8, tz * 0.62), w: 800, color: D.acc, al: 'center', a: a * ua });
    if (b.h > idF * 3.2) {
      const wf = Math.max(8, idF * 0.95);
      const s1 = fit(sc, [L.warn + ': ' + L.warnL[0]].concat(L.warnL.slice(1)), b.w + 4, { size: wf, w: 650 });
      sc.text(s1, tx, Math.min(b.y + b.h, ty + tz * 0.45 + wf + 3), { size: wf, w: 650, color: D.acc, al: 'center', a: a * ua });
    }
  }
}

K.SPECS['nokia-drg'] = S_DRG;
K.ARIA['nokia-drg'] = K.arDigits(AR
  ? 'رسم متحرك ببيانات توضيحية: ورقة إعدادات فيها صف لكل رسم، المُعرّف ونوع الرسم ومجموعات المواقع والمعادلات، وبجانبها شريحة ' + 'PowerPoint' + ' فيها ستة أماكن محجوزة فارغة تحمل المُعرّفات نفسها. يضيء كل صف بدوره، وتُحسب معادلته على بيانات المؤشرات، ثم يرسم الرسم نفسه في مكانه: خط، وتراكب الساعات، وأعمدة مكدّسة إلى 100%، وخط مع مساحة على محورين، ورسم دائري. والصف C04 يذكر مؤشرًا غير موجود في البيانات، فيظهر في مكانه رسم تحذير بالكهرماني بدل رسم خاطئ، ويستمر العمل. وفي النهاية تكتمل الشريحة: خمسة رسوم وتحذير واحد.'
  : 'Animation on illustrative data: a settings sheet with one row per chart, its id, chart type, site groups and equations, beside a PowerPoint slide with six empty placeholders named with the same ids. Each row lights in turn, its equation is worked out on the KPI data, and the chart draws itself into its placeholder: a line, an hourly overlay, a 100% stacked bar, a line with an area on two axes and a doughnut. Row C04 names a KPI that is not in the data, so its placeholder gets an amber warning chart instead of a wrong chart, and the run goes on. The slide ends complete: five charts and one warning.');
})();
