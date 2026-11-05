






(() => {
'use strict';
const K = window.KIT, AR = K.AR, D = K.DARK;
const { clamp, lerp, smooth, spring, mkRnd, fmtInt } = K;
const ND = K.nokiaData();
const REG = ND.names;
const T = (en, ar) => AR ? ar : en;
const TECH = ['2G', '3G', '4G', '5G'];


function geo(W, H) {
  const sf = clamp(W / 704, 0.4, 1.28), mn = W < 420 ? 10.5 : 11;
  return { W, H, sf, narrow: W < 560, pad: Math.round(clamp(W * 0.042, 14, 34)), f: z => Math.max(mn, Math.round(z * sf * 10) / 10) };
}

const R = (sc, c, x, y, w, h) => c.fillRect(AR ? sc.W - x - w : x, y, w, h);
const SR = (sc, c, x, y, w, h) => c.strokeRect(AR ? sc.W - x - w : x, y, w, h);
function seg(sc, c, x1, y1, x2, y2) { c.beginPath(); c.moveTo(sc.X(x1), y1); c.lineTo(sc.X(x2), y2); c.stroke(); }

function latin(sc, c, parts, x, y, size, o = {}) {
  c.font = `${o.w || 500} ${size}px "Switzer", sans-serif`;
  try { c.fontStretch = 'normal'; } catch (e) {}
  c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const ws = parts.map(p => c.measureText(p[0]).width), tot = ws.reduce((a, b) => a + b, 0);
  if (o.measure) return tot;
  let lx = o.al === 'end' ? (AR ? sc.W - x : x - tot) : (AR ? sc.W - x - tot : x);
  parts.forEach((p, i) => { c.globalAlpha = (p[2] == null ? 1 : p[2]) * (o.a == null ? 1 : o.a); c.fillStyle = p[1] || D.ink; c.fillText(p[0], lx, y); lx += ws[i]; });
  c.globalAlpha = 1;
  return tot;
}

function zipf(sc, c, x, y, w, h, col, a) {
  const k = Math.min(w, h) * 0.34;
  c.globalAlpha = a; c.fillStyle = col;
  c.beginPath(); c.moveTo(sc.X(x), y); c.lineTo(sc.X(x + w - k), y); c.lineTo(sc.X(x + w), y + k); c.lineTo(sc.X(x + w), y + h); c.lineTo(sc.X(x), y + h); c.closePath(); c.fill();
  if (w < 6) return;
  const tw = Math.max(1, Math.round(w * 0.15)), zx = x + w * 0.42 - tw / 2;
  c.fillStyle = D.surf;
  for (let i = 0; (i + 1) * tw <= h * 0.62; i++) R(sc, c, zx + (i % 2 ? tw : 0), y + 1 + i * tw, tw, tw);
}
function dashRect(sc, c, x, y, w, h, col, a, lw) {
  c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw || 1.25; c.setLineDash([4, 3]);
  SR(sc, c, x + 0.5, y + 0.5, w - 1, h - 1); c.restore();
}

function tick(sc, c, x, y, s, col, a) {
  const L = AR ? sc.W - x - s : x;
  c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(L, y); c.lineTo(L + s * 0.35, y + s * 0.35); c.lineTo(L + s, y - s * 0.45); c.stroke(); c.lineCap = 'butt';
}

const PCT = AR ? '٪' : '%', TBU = AR ? ' تيرابايت' : ' TB', GBU = AR ? ' جيجابايت' : ' GB';

function note(sc, g) { sc.text(T('Illustrative data', 'بيانات توضيحية'), g.pad, sc.H - Math.round(g.pad * 0.6), { size: g.f(11), color: D.mute }); }
const fade = (t, a, d) => smooth((t - a) / (d || 0.3));


const N30 = (() => {
  const r = ND.reg[0], d = 29;
  const att = 61240, ok = Math.round(att * r.cssr[d] / 100), calls = 52480, drops = Math.round(calls * r.drop[d] / 100), gb = Math.round(r.traffic[d] * 1000);
  return { att, ok, calls, drops, gb, cssr: (100 * ok / att).toFixed(2), drop: (100 * drops / calls).toFixed(2), tb: (gb / 1000).toFixed(1) };
})();




const CSV = [30, 28, 36, 20];
const S1 = {
  dur: 3.4,
  aria: { en: 'Illustrative data: a shared folder fills hour by hour; for each of 24 hours one zipped file arrives for 2G, 3G, 4G and 5G, 96 zipped files holding 2,736 CSV files in one day.',
          ar: 'بيانات توضيحية: مجلد مشترك يمتلئ ساعة بساعة؛ في كل ساعة من 24 ساعة يصل ملف مضغوط لكل جيل، الثاني والثالث والرابع والخامس، أي 96 ملفًا مضغوطًا فيها 2,736 ملف CSV في يوم واحد.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad;
    const hh = g.f(26) + g.f(12) + 16;
    const lw = Math.round(g.f(12) * 2.4);
    const x0 = p + lw, x1 = W - p, y0 = p + hh + 8;
    const gh = Math.round(clamp((W - 2 * p) / 36 * 0.8, 6, 16) * 1.3);
    const inside = g.f(11) + 8 + 18 + g.f(12) + 10 + gh;       
    const y1 = y0 + (H - p - g.f(11) - 14 - y0 - inside) * 0.98;
    const cw = (x1 - x0) / 24, rh = (y1 - y0) / 4;
    const fw = Math.max(5, Math.min(cw * 0.62, rh * 0.5)), fh = Math.min(fw * 1.3, rh * 0.72);
    const iy = y1 + g.f(11) + 8 + 18 + g.f(12), gw = gh / 1.3;
    return { g, x0, x1, y0, y1, cw, rh, fw, fh, iy, gh, gw };
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, at = h => 0.35 + h * 0.104;
    const sk = fade(t, 0, 0.35);
    
    sc.text(T('Shared folder', 'المجلد المشترك'), p, p + g.f(15), { size: g.f(15), w: 700, a: sk });
    sc.text(T('one day of hourly exports', 'ملفات يوم واحد، ساعة بساعة'), p, p + g.f(15) + g.f(12) + 7, { size: g.f(12), color: D.mute, a: sk });
    let zips = 0, csv = 0;
    for (let h = 0; h < 24; h++) for (let r = 0; r < 4; r++) if (t >= at(h) + r * 0.03 + 0.09) { zips++; csv += CSV[r]; }
    const done = fade(t, at(23) + 0.3, 0.35);
    const ny = p + g.f(24), ly = ny + g.f(12) + 6;
    const big = g.f(24), xEnd = sc.W - p;
    sc.text(fmtInt(csv), xEnd, ny, { size: big, w: 700, al: 'end', a: sk * (1 - done) });
    sc.text(fmtInt(csv), xEnd, ny, { size: big, w: 700, al: 'end', color: D.acc, a: sk * done });
    const csvL = T('CSV files', 'ملفات CSV');
    sc.text(csvL, xEnd, ly, { size: g.f(12), color: D.mute, al: 'end', a: sk });
    const w2 = Math.max(sc.measure(fmtInt(2736), { size: big, w: 700 }), sc.measure(csvL, { size: g.f(12) })) + g.f(18);
    sc.text(String(zips), xEnd - w2, ny, { size: big, w: 700, al: 'end', a: sk });
    sc.text(T('zipped files', 'ملفات مضغوطة'), xEnd - w2, ly, { size: g.f(12), color: D.mute, al: 'end', a: sk });
    
    for (let r = 0; r < 4; r++) {
      const cy = m.y0 + (r + 0.5) * m.rh;
      sc.text(TECH[r], p, cy + g.f(12) * 0.36, { size: g.f(12), w: 650, a: sk });
      for (let h = 0; h < 24; h++) {
        const cx = m.x0 + (h + 0.5) * m.cw, u = smooth((t - at(h) - r * 0.03) / 0.18);
        if (u < 1) { c.globalAlpha = 0.5 * sk * (1 - u); c.fillStyle = D.page; R(sc, c, cx - 1.5, cy - 1.5, 3, 3); }
        if (u <= 0) continue;
        
        const fresh = 1 - smooth((t - at(h) - 0.25) / 0.35);
        zipf(sc, c, cx - m.fw / 2, cy - m.fh / 2 - (1 - u) * 9, m.fw, m.fh, D.ink, u * (0.62 + 0.38 * fresh));
      }
    }
    
    for (const h of [0, 6, 12, 18, 23]) {
      const s = (h < 10 ? '0' : '') + h + ':00', cx = m.x0 + (h + 0.5) * m.cw, w = sc.measure(s, { size: g.f(11) }) / 2;
      sc.text(s, clamp(cx, m.x0 + w - m.cw * 0.5, sc.W - p - w), m.y1 + g.f(11) + 8, { size: g.f(11), w: 600, color: D.mute, al: 'center', a: sk });
    }
    
    const op = smooth((t - 1.9) / 0.6), oa = fade(t, 1.85, 0.3);
    if (oa > 0) {
      const sx = m.x0 + 13.5 * m.cw, sy = m.y0 + 2.5 * m.rh;
      c.globalAlpha = oa; c.strokeStyle = D.ink; c.lineWidth = 1.25;
      SR(sc, c, sx - m.fw / 2 - 3.5, sy - m.fh / 2 - 3.5, m.fw + 7, m.fh + 7);
      const nw = latin(sc, c, [['4G_hourly_1300.csv.zip', D.ink]], p, m.iy, g.f(12), { w: 650, a: oa });
      sc.text(T('holds 36 CSV files', 'فيه 36 ملف CSV'), p + nw + 8, m.iy, { size: g.f(12), color: D.mute, a: oa });
      const step = (sc.W - 2 * p) / 36, gy = m.iy + 10;
      for (let i = 0; i < 36; i++) {
        const u = clamp(op * 1.5 - i / 36 * 0.5, 0, 1); if (u <= 0) continue;
        const e = smooth(u), x = lerp(sx - m.gw / 2, p + i * step + (step - m.gw) / 2, e), y = lerp(sy - m.gh / 2, gy, e);
        const k = Math.min(m.gw, m.gh) * 0.34;
        c.globalAlpha = 0.25 + 0.6 * e; c.fillStyle = D.ink;
        c.beginPath(); c.moveTo(sc.X(x), y); c.lineTo(sc.X(x + m.gw - k), y); c.lineTo(sc.X(x + m.gw), y + k); c.lineTo(sc.X(x + m.gw), y + m.gh); c.lineTo(sc.X(x), y + m.gh); c.closePath(); c.fill();
        c.fillStyle = D.surf; c.globalAlpha = 0.55 * e;
        for (let q = 0; q < 3; q++) R(sc, c, x + m.gw * 0.18, y + m.gh * (0.42 + q * 0.17), m.gw * 0.62, 1);
      }
    }
    note(sc, g);
  },
};




const S2 = {
  dur: 3.4,
  aria: { en: 'Illustrative data: the hourly report due at 15:00 needs the four 13:00 files. Look 1 at 15:00: the 5G file is missing. After 10 minutes, look 2 at 15:10: all four are in and the report goes on. Look 3 at 15:20 is not needed.',
          ar: 'بيانات توضيحية: التقرير الساعي في 15:00 يحتاج ملفات الساعة 13:00 الأربعة. المحاولة الأولى في 15:00: ملف الجيل الخامس لم يصل. بعد 10 دقائق، المحاولة الثانية في 15:10: وصلت الأربعة فيكمل التقرير. المحاولة الثالثة في 15:20 لا حاجة إليها.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad;
    const hh = g.f(15) + g.f(12) + 14;
    const ax = H - p - g.f(11) * 2 - 16;              
    const top = p + hh + 10, bot = ax - g.f(11) - 14;
    const gap = Math.round(clamp(W * 0.025, 8, 20)), cw = (W - 2 * p - 2 * gap) / 3;
    const cols = [0, 1, 2].map(k => ({ x: p + k * (cw + gap), w: cw }));
    return { g, hh, ax, top, bot, cols, gap };
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, sk = fade(t, 0, 0.3);
    sc.text(T('Hourly report due at 15:00', 'التقرير الساعي، موعده 15:00'), p, p + g.f(15), { size: g.f(15), w: 700, a: sk });
    sc.text(T('it needs the four files of 13:00', 'يحتاج ملفات الساعة 13:00 الأربعة'), p, p + g.f(15) + g.f(12) + 7, { size: g.f(12), color: D.mute, a: sk });
    const looks = [{ at: 0.3, time: '15:00' }, { at: 1.85, time: '15:10' }, { at: 2.75, time: '15:20' }];
    const ip = Math.round(clamp(m.cols[0].w * 0.08, 8, 18));
    const headH = g.f(13) + g.f(12) + 14, resH = g.f(12) + 14;
    const sy0 = m.top + headH, sh = (m.bot - resH - sy0) / 4;
    const fh = Math.min(sh * 0.62, g.f(28)), fw = fh * 0.78, fs = g.f(14);
    m.cols.forEach((col, k) => {
      const third = k === 2, ca = third ? 0.38 * fade(t, 2.75, 0.4) : sk;
      if (ca <= 0) return;
      c.globalAlpha = (third ? 0.5 : 0.55) * ca; c.fillStyle = D.page; R(sc, c, col.x, m.top, col.w, m.bot - m.top);
      sc.text(T('look ', 'المحاولة ') + (AR ? ['الأولى', 'الثانية', 'الثالثة'][k] : String(k + 1)), col.x + ip, m.top + g.f(13) + 8, { size: g.f(13), w: 700, a: ca });
      sc.text(looks[k].time, col.x + ip, m.top + g.f(13) + g.f(12) + 13, { size: g.f(12), color: D.mute, a: ca });
      
      for (let r = 0; r < 4; r++) {
        const y = sy0 + r * sh + (sh - fh) / 2, missing = k === 0 && r === 3;
        const u = third ? 1 : fade(t, looks[k].at + r * 0.1 + (k === 1 && r === 3 ? 0.25 : 0), 0.22);
        const lx = col.x + ip + fw + Math.round(fw * 0.8);
        sc.text(TECH[r], lx, y + fh * 0.5 + fs * 0.36, { size: fs, w: 650, a: ca * (third ? 1 : Math.max(0.35, u)) });
        if (missing) {
          dashRect(sc, c, col.x + ip, y, fw, fh, D.acc, ca * u, 1.25);
          sc.text(T('not in', 'لم يصل'), lx + sc.measure('5G', { size: fs, w: 650 }) + 8, y + fh * 0.5 + fs * 0.36, { size: g.f(12), w: 650, color: D.acc, a: ca * u });
        } else if (third) {
          dashRect(sc, c, col.x + ip, y, fw, fh, D.mute, ca, 1);
        } else {
          zipf(sc, c, col.x + ip, y - (1 - u) * 7, fw, fh, D.ink, ca * u * 0.9);
        }
      }
      
      const res = [T('not all in', 'لم يكتمل'), T('all in: go on', 'اكتمل: يكمل'), T('not needed', 'لا حاجة إليها')][k];
      const ra = third ? ca : sk * fade(t, k === 0 ? 0.95 : 2.45, 0.3);
      sc.text(res, col.x + ip, m.bot - 11, { size: g.f(12), w: k === 1 ? 700 : 500, color: k === 1 ? D.ink : D.mute, a: ra });
      if (k === 1 && ra > 0) tick(sc, c, col.x + col.w - ip - g.f(12), m.bot - 11 - g.f(12) * 0.35, g.f(12), D.ink, ra);
    });
    
    const cx = m.cols.map(col => col.x + col.w / 2), ay = m.ax;
    c.globalAlpha = 0.9 * sk; c.strokeStyle = D.mute; c.lineWidth = 1.25; seg(sc, c, cx[0], ay, cx[1], ay);
    c.save(); c.setLineDash([3, 4]); c.globalAlpha = 0.6 * sk; seg(sc, c, cx[1], ay, cx[2], ay); c.restore();
    cx.forEach((x, k) => {
      c.globalAlpha = sk * (k === 2 ? 0.5 : 1); c.strokeStyle = D.mute; c.lineWidth = 1.25; seg(sc, c, x, ay - 4, x, ay + 4);
      sc.text(looks[k].time, x, ay + g.f(11) + 9, { size: g.f(11), w: 600, color: D.mute, al: 'center', a: sk * (k === 2 ? 0.6 : 1) });
    });
    for (let k = 0; k < 2; k++) sc.text(T('10 min', '10 دقائق'), (cx[k] + cx[k + 1]) / 2, ay - 7, { size: g.f(11), color: D.mute, al: 'center', a: sk * (k ? 0.6 : 1) });
    
    const mv = smooth((t - 1.0) / 0.8), mx = lerp(cx[0], cx[1], mv);
    if (t > 0.3) {
      c.globalAlpha = 0.9 * sk; c.strokeStyle = D.ink; c.lineWidth = 2; seg(sc, c, cx[0], ay, mx, ay);
      c.globalAlpha = sk; c.fillStyle = D.ink; c.beginPath(); c.arc(sc.X(mx), ay, 3.6, 0, 6.2832); c.fill();
    }
    note(sc, g);
  },
};




const S3 = {
  dur: 3.6,
  aria: { en: 'Illustrative data: four tables, 2G, 3G, 4G and 5G. The history file adds days 1 to 120, the fresh exports days 121 to 150. The 4G row for 13:00 came in two exports, 812 GB in the 14:05 export and 846 GB in the 14:40 export: the older copy is dropped, the newest is kept.',
          ar: 'بيانات توضيحية: أربعة جداول للأجيال الثاني والثالث والرابع والخامس. الملف التاريخي يضيف الأيام من 1 إلى 120، والملفات الجديدة الأيام من 121 إلى 150. صف الجيل الرابع للساعة 13:00 جاء في ملفين، 812 جيجابايت في ملف 14:05 و846 في ملف 14:40: تُحذف النسخة الأقدم ويبقى الأحدث.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad, rnd = mkRnd(3303);
    const lw = Math.round(g.f(12) * 2.4), x0 = p + lw, x1 = W - p;
    const hl = g.f(12) * 2 + 12, sy0 = p + hl + 6, sy1 = p + (H - 2 * p) * 0.5;
    const seam = Math.round(6 * g.sf + 4), xs = x0 + (x1 - x0) * 0.6;
    const sh = (sy1 - sy0) / 4, bh = Math.min(sh * 0.58, g.f(18));
    const fx0 = xs + seam / 2, dw = (x1 - fx0) / 30;
    const blocks = [];
    for (let r = 0; r < 4; r++) for (let d = 0; d < 30; d++) blocks.push({ r, d, sx: W * (0.1 + 0.8 * rnd()), sy: sy0 + (H * 0.6) * rnd(), dl: 0.55 + r * 0.09 + d / 30 * 0.6 + rnd() * 0.1 });
    
    const tb0 = sy1 + g.f(12) + 22, tb1 = H - p - g.f(11) - 14, rowH = clamp((tb1 - tb0) / 3.3, g.f(13) * 1.9, g.f(13) * 3);
    return { g, x0, x1, sy0, sy1, xs, seam, sh, bh, fx0, dw, blocks, ty0: tb0 + Math.max(0, (tb1 - tb0 - rowH * 3.3) * 0.35), rowH };
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, sk = fade(t, 0, 0.3);
    
    const ha = fade(t, 0.45, 0.35), fa = fade(t, 0.7, 0.35), ly = p + g.f(12);
    sc.text(T('history file', 'الملف التاريخي'), m.x0, ly, { size: g.f(12), w: 650, a: ha });
    sc.text(T('days 1 to 120', 'الأيام 1 إلى 120'), m.x0, ly + g.f(12) + 5, { size: g.f(11), color: D.mute, a: ha });
    sc.text(T('fresh exports', 'الملفات الجديدة'), m.fx0, ly, { size: g.f(12), w: 650, a: fa });
    sc.text(T('days 121 to 150', 'الأيام 121 إلى 150'), m.fx0, ly + g.f(12) + 5, { size: g.f(11), color: D.mute, a: fa });
    const keep = fade(t, 2.65, 0.45);
    for (let r = 0; r < 4; r++) {
      const cy = m.sy0 + (r + 0.5) * m.sh, y = cy - m.bh / 2;
      sc.text(TECH[r], p, cy + g.f(12) * 0.36, { size: g.f(12), w: 650, a: sk });
      
      c.globalAlpha = 0.35 * sk; c.fillStyle = D.page; R(sc, c, m.x0, y, m.x1 - m.x0, m.bh);
      
      const hw = (m.xs - m.seam / 2 - m.x0) * smooth((t - 0.2 - r * 0.06) / 0.85);
      c.globalAlpha = 0.95; c.fillStyle = '#4a4741'; R(sc, c, m.x0, y, hw, m.bh);
      c.fillStyle = D.surf; c.globalAlpha = 0.5;
      for (let k = 1; k < 4; k++) { const x = m.x0 + (m.xs - m.seam / 2 - m.x0) * k / 4; if (x < m.x0 + hw) R(sc, c, x, y, 1, m.bh); }
    }
    
    for (const b of m.blocks) {
      const s1 = clamp(spring(t - b.dl, 0.55, 0.85), -0.2, 1.15);
      if (t < b.dl) continue;
      const kept = b.r === 2 && b.d === 29;
      const tx = m.fx0 + b.d * m.dw + m.dw * 0.12, ty = m.sy0 + (b.r + 0.5) * m.sh - m.bh / 2;
      if (kept) { if (keep <= 0) continue; }
      const x = kept ? tx : lerp(b.sx, tx, s1), y = kept ? ty : lerp(b.sy, ty, s1);
      c.globalAlpha = kept ? keep : clamp(0.25 + 0.6 * s1, 0, 0.85); c.fillStyle = kept ? D.acc : D.ink;
      R(sc, c, x, y, Math.max(1.5, m.dw * 0.76), m.bh);
    }
    
    const ta = fade(t, 1.5, 0.35), y0 = m.ty0, rowH = m.rowH;
    sc.text(T('the 4G row for 13:00, in two exports', 'صف الجيل الرابع للساعة 13:00، في ملفين'), p, y0, { size: g.f(12), w: 650, a: ta });
    const tw = sc.W - 2 * p, cx = [p, p + tw * 0.28, p + tw * 0.5];
    const hy = y0 + rowH * 0.9;
    [T('exported at', 'وقت التصدير'), T('hour', 'الساعة'), T('traffic, GB', 'الحركة، جيجابايت')].forEach((s, k) => sc.text(s, cx[k], hy, { size: g.f(11), color: D.mute, a: ta }));
    const rows = [['14:05', '13:00', '812'], ['14:40', '13:00', '846']];
    const drop = fade(t, 2.2, 0.4);
    rows.forEach((row, k) => {
      const y = hy + (k + 1) * rowH, ra = fade(t, 1.6 + k * 0.2, 0.3);
      const a = k === 0 ? ra * (1 - 0.6 * drop) : ra;
      const bandH = Math.min(rowH - 4, g.f(13) * 2.2), bandY = y - 4 - g.f(13) * 0.36 - bandH / 2;
      if (k === 1) { c.globalAlpha = ra * 0.5; c.fillStyle = D.page; R(sc, c, p - 6, bandY, tw + 12, bandH); }
      row.forEach((s, j) => sc.text(s, cx[j], y - 4, { size: g.f(13), w: 650, a }));
      if (k === 0 && drop > 0) {
        c.globalAlpha = drop; c.strokeStyle = D.mute; c.lineWidth = 1.25;
        seg(sc, c, p - 2, y - 4 - g.f(13) * 0.33, p - 2 + (cx[2] - p + sc.measure('812', { size: g.f(13), w: 650 }) + 4) * drop, y - 4 - g.f(13) * 0.33);
        sc.text(T('older: dropped', 'الأقدم: يُحذف'), sc.W - p, y - 4, { size: g.f(12), color: D.mute, al: 'end', a: drop });
      }
      if (k === 1) {
        sc.text(T('newest: kept', 'الأحدث: يبقى'), sc.W - p, y - 4, { size: g.f(12), w: 700, color: D.acc, al: 'end', a: fade(t, 2.45, 0.3) });
        c.globalAlpha = fade(t, 2.45, 0.3); c.fillStyle = D.acc; R(sc, c, p - 6, bandY, 2.5, bandH);
      }
    });
    
    const fly = smooth((t - 2.6) / 0.5);
    if (fly > 0 && fly < 1) {
      const fx = lerp(sc.W - p - 40, m.fx0 + 29 * m.dw, fly), fy = lerp(hy + 2 * rowH - g.f(13), m.sy0 + 2.5 * m.sh - m.bh / 2, fly);
      c.globalAlpha = 0.9; c.fillStyle = D.acc; R(sc, c, fx, fy, Math.max(4, m.dw * 0.76), m.bh);
    }
    note(sc, g);
  },
};


const FORM = [
  [['cssr', D.ink], [' = 100 * setup_ok / setup_att', D.ink]],
  [['drop_rate', D.ink], [' = 100 * drops / calls', D.ink]],
  [['traffic_tb', D.ink], [' = volume_gb / 1000', D.ink]],
];
const S4 = {
  dur: 3.6,
  aria: { en: `Illustrative data: the config file kpi_formulas holds three formula lines written by the team. North, day 30, worked out with them from the export counters: call setup success 100 x ${fmtInt(N30.ok)} / ${fmtInt(N30.att)} = ${N30.cssr}%, call drop rate 100 x ${fmtInt(N30.drops)} / ${fmtInt(N30.calls)} = ${N30.drop}%, traffic ${fmtInt(N30.gb)} GB = ${N30.tb} TB. The report code only reads the file; no KPI formula is written in it.`,
          ar: `بيانات توضيحية: ملف الإعدادات kpi_formulas فيه ثلاثة أسطر لمعادلات كتبها الفريق. الشمال، اليوم 30، محسوبًا بها من عدّادات الملفات: نجاح إنشاء المكالمات ${N30.cssr}٪، ونسبة المكالمات المنقطعة ${N30.drop}٪، وحجم الحركة ${N30.tb} تيرابايت. وكود التقرير يقرأ الملف فقط، ولا معادلة مكتوبة فيه.` },
  build(W, H) {
    const g = geo(W, H), p = g.pad;
    const ff = g.f(15), tabH = g.f(12) + 16, lh = ff * 1.85, fileH = tabH + 3 * lh + 12;
    const vf = g.f(15), rowH = vf * 1.85, vh = g.f(12) + 12 + 3 * rowH;
    const cf = g.f(13), codeH = g.f(12) + 16 + cf * 1.9 + 6;
    const avail = H - 2 * p - g.f(11) - 10, free = avail - fileH - vh - codeH;
    const gp = clamp(free / 3, 10, 30 * g.sf + 6);
    const y0 = p + Math.max(0, (free - 2 * gp) * 0.35), vy = y0 + fileH + gp, cy = vy + vh + gp;
    return { g, ff, tabH, lh, fileH, vf, rowH, vh, cf, codeH, y0, vy, cy };
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, sk = fade(t, 0, 0.35);
    
    const tabW = latin(sc, c, [['kpi_formulas', D.ink]], 0, 0, g.f(12), { w: 650, measure: true }) + 20;
    c.globalAlpha = sk; c.fillStyle = '#34312d'; R(sc, c, p, m.y0, tabW, m.tabH);
    R(sc, c, p, m.y0 + m.tabH, W - 2 * p, m.fileH - m.tabH);
    latin(sc, c, [['kpi_formulas', D.acc]], p + 10, m.y0 + m.tabH - 6, g.f(12), { w: 650, a: sk });
    sc.text(T('config file, written by the team', 'ملف إعدادات يكتبه الفريق'), W - p, m.y0 + m.tabH - 6, { size: g.f(11), color: D.mute, al: 'end', a: sk });
    
    const vals = [[T('Call setup success', 'نجاح إنشاء المكالمات'), `${fmtInt(N30.ok)} / ${fmtInt(N30.att)}`, N30.cssr + PCT],
                  [T('Call drop rate', 'نسبة المكالمات المنقطعة'), `${fmtInt(N30.drops)} / ${fmtInt(N30.calls)}`, N30.drop + PCT],
                  [T('Traffic', 'حجم الحركة'), fmtInt(N30.gb) + GBU, N30.tb + TBU]];
    const read = k => 1.1 + k * 0.5;
    FORM.forEach((parts, k) => {
      const y = m.y0 + m.tabH + 6 + (k + 0.5) * m.lh + m.ff * 0.36, a = fade(t, 0.3 + k * 0.15, 0.3);
      const lit = fade(t, read(k), 0.2) * (1 - fade(t, read(k) + 0.55, 0.3));
      if (lit > 0) { c.globalAlpha = 0.2 * lit; c.fillStyle = D.acc; R(sc, c, p + 4, y - m.ff * 0.36 - m.lh / 2 + 2, W - 2 * p - 8, m.lh - 4); }
      c.globalAlpha = a * fade(t, read(k), 0.2); c.fillStyle = D.acc; R(sc, c, p + 6, y - m.ff * 0.95, 2.5, m.ff * 1.15);
      latin(sc, c, parts, p + 16, y, m.ff, { w: 500, a });
    });
    
    const va = fade(t, 0.9, 0.3), hy = m.vy + g.f(12), mid = p + (W - 2 * p) * (g.narrow ? 0.52 : 0.46);
    sc.text(T('North, day 30', 'الشمال، اليوم 30'), p, hy, { size: g.f(12), w: 650, color: D.mute, a: va });
    sc.text(T('counters from the exports', 'العدّادات من الملفات'), mid, hy, { size: g.f(11), color: D.mute, a: va });
    vals.forEach((v, k) => {
      const y = hy + 12 + (k + 0.5) * m.rowH + m.vf * 0.36, a = fade(t, read(k) + 0.15, 0.35);
      if (k) { c.globalAlpha = va * 0.6; c.fillStyle = D.page; R(sc, c, p, hy + 12 + k * m.rowH, W - 2 * p, 1); }
      sc.text(v[0], p, y, { size: m.vf, w: 600, a });
      sc.text(v[1], mid, y, { size: g.f(13), color: D.mute, a });
      sc.text(v[2], W - p, y, { size: m.vf, w: 700, al: 'end', a });
    });
    
    const ca = fade(t, 2.65, 0.4);
    c.globalAlpha = ca; c.strokeStyle = '#4a4741'; c.lineWidth = 1; SR(sc, c, p + 0.5, m.cy + 0.5, W - 2 * p - 1, m.codeH - 1);
    sc.text(T('report code', 'كود التقرير'), p + 10, m.cy + g.f(12) + 9, { size: g.f(12), w: 650, color: D.mute, a: ca });
    sc.text(T('no KPI formula written here', 'لا معادلة مكتوبة هنا'), W - p - 10, m.cy + g.f(12) + 9, { size: g.f(11), color: D.mute, al: 'end', a: ca });
    latin(sc, c, [['formulas = read_config(', D.ink], ['"kpi_formulas"', D.acc], [')', D.ink]], p + 10, m.cy + g.f(12) + 14 + m.cf * 1.25, m.cf, { a: ca });
    note(sc, g);
  },
};




const S5 = {
  dur: 3.8,
  aria: { en: `Illustrative data: the team_template.pptx file has 6 pages. Page 2, North, has three empty slots: traffic by technology, a KPI table and traffic per hour. Each chart is drawn and put into its slot: 30 days of traffic by technology, the day 30 values ${N30.tb} TB, ${N30.cssr}% and ${N30.drop}%, and traffic per hour.`,
          ar: 'بيانات توضيحية: ملف team_template.pptx فيه 6 صفحات. في الصفحة 2، الشمال، ثلاث خانات فارغة: الحركة حسب الجيل، وجدول المؤشرات، والحركة كل ساعة. يُرسم كل رسم ويوضع في خانته: 30 يومًا من الحركة حسب الجيل، وقيم اليوم 30، والحركة كل ساعة.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad;
    const m = { g };
    
    const ly = p + g.f(12), tw = Math.round(clamp((W - 2 * p) * 0.1, 30, 84)), th = tw * 9 / 16, tg = Math.round(clamp(tw * 0.16, 5, 12));
    m.ly = ly;
    m.thumbs = [0, 1, 2, 3, 4, 5].map(k => ({ x: p + 3 + k * (tw + tg), y: ly + 12, w: tw, h: th }));
    const sy = ly + 12 + th + Math.round(clamp(14 * g.sf, 10, 18)), sw = W - 2 * p, sh = Math.min(sw * 9 / 16, H - sy - p - g.f(11) - 12);
    m.slide = { x: p, y: sy, w: sh * 16 / 9, h: sh };
    const s = m.slide, hd = Math.max(g.f(12) + 12, s.h * 0.12), ip = Math.max(6, s.w * 0.03);
    m.head = hd;
    const top = { x: s.x + ip, y: s.y + hd + ip * 0.6, w: s.w - 2 * ip, h: (s.h - hd - ip * 2.2) * 0.5 };
    const by = top.y + top.h + ip * 0.6, bh = s.y + s.h - ip - by, bw = (s.w - 3 * ip) / 2;
    m.slots = [top, { x: s.x + ip, y: by, w: bw, h: bh }, { x: s.x + 2 * ip + bw, y: by, w: bw, h: bh }];
    
    m.tech = ND.reg[0].traffic.map((v, d) => { const g2 = 0.03, g3 = 0.15 - 0.03 * d / 29, g5 = 0.07 + 0.06 * d / 29; return [v * g2, v * g3, v * (1 - g2 - g3 - g5), v * g5]; });
    const cd = (h, cc) => { const x = Math.abs(h - cc) % 24; return Math.min(x, 24 - x); };
    m.hour = Array.from({ length: 24 }, (_, h) => 0.2 + 0.32 * Math.exp(-Math.pow(cd(h, 12.5) / 4.2, 2)) + 0.62 * Math.exp(-Math.pow(cd(h, 21.6) / 3.2, 2)));
    return m;
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, sk = fade(t, 0, 0.35), s = m.slide;
    
    const nw = latin(sc, c, [['team_template.pptx', D.ink]], p, m.ly, g.f(12), { w: 650, a: sk });
    sc.text(T('the team’s template, 6 pages', 'قالب الفريق، 6 صفحات'), p + nw + 10, m.ly, { size: g.f(11), color: D.mute, a: sk });
    m.thumbs.forEach((b, k) => {
      c.globalAlpha = sk * (k === 1 ? 1 : 0.6); c.fillStyle = D.page; R(sc, c, b.x, b.y, b.w, b.h);
      c.globalAlpha = sk * 0.5; c.fillStyle = '#4a4741';
      R(sc, c, b.x, b.y, b.w, Math.max(2, b.h * 0.14));
      const lay = [[[0.08, 0.26, 0.84, 0.66]], [[0.08, 0.24, 0.84, 0.32], [0.08, 0.62, 0.4, 0.3], [0.52, 0.62, 0.4, 0.3]], [[0.08, 0.26, 0.4, 0.66], [0.52, 0.26, 0.4, 0.66]],
                   [[0.08, 0.26, 0.84, 0.3], [0.08, 0.62, 0.84, 0.3]], [[0.08, 0.26, 0.26, 0.66], [0.37, 0.26, 0.26, 0.66], [0.66, 0.26, 0.26, 0.66]], [[0.08, 0.26, 0.84, 0.66]]][k];
      c.globalAlpha = sk * 0.55;
      for (const q of lay) R(sc, c, b.x + q[0] * b.w, b.y + q[1] * b.h, q[2] * b.w, q[3] * b.h);
      if (k === 1) { c.globalAlpha = sk; c.strokeStyle = D.ink; c.lineWidth = 1.25; SR(sc, c, b.x - 2.5, b.y - 2.5, b.w + 5, b.h + 5); }
    });
    
    const pa = fade(t, 0.2, 0.4);
    c.globalAlpha = pa; c.fillStyle = D.page; R(sc, c, s.x, s.y, s.w, s.h);
    c.fillStyle = '#34312d'; R(sc, c, s.x, s.y, s.w, m.head);
    sc.text(T('North, daily KPIs', 'الشمال، المؤشرات اليومية'), s.x + 10, s.y + m.head * 0.5 + g.f(12) * 0.36, { size: g.f(12), w: 700, a: pa });
    sc.text(T('page 2 of 6', 'صفحة 2 من 6'), s.x + s.w - 10, s.y + m.head * 0.5 + g.f(12) * 0.36, { size: g.f(11), color: D.mute, al: 'end', a: pa });
    const names = [T('traffic by technology', 'الحركة حسب الجيل'), T('KPI table', 'جدول المؤشرات'), T('traffic per hour', 'الحركة كل ساعة')];
    const T0 = 0.75, STEP = 0.95;
    m.slots.forEach((b, k) => {
      const drawU = clamp((t - (T0 + k * STEP)) / 0.5, 0, 1), land = smooth((t - (T0 + k * STEP + 0.5)) / 0.35);
      
      const ea = pa * (1 - land);
      if (ea > 0.01) {
        dashRect(sc, c, b.x, b.y, b.w, b.h, D.acc, ea, 1.25);
        sc.text(names[k], b.x + b.w / 2, b.y + b.h / 2 + 4, { size: g.f(11), color: D.acc, al: 'center', a: ea * (drawU > 0 ? 1 - smooth(drawU * 2) : 1) });
      }
      if (drawU <= 0) return;
      
      const lift = (1 - land) * Math.max(10, b.h * 0.16), sx = 1 + 0.05 * (1 - land);
      const bx = b.x + b.w / 2 - b.w * sx / 2, by = b.y - lift + b.h / 2 - b.h * sx / 2;
      this.chart(sc, c, m, k, { x: bx, y: by, w: b.w * sx, h: b.h * sx }, drawU, g, smooth(drawU * 1.6));
    });
    note(sc, g);
  },
  chart(sc, c, m, k, b, u, g, a) {
    c.globalAlpha = a; c.fillStyle = '#34312d'; R(sc, c, b.x, b.y, b.w, b.h);
    const ip = Math.max(5, b.w * 0.04), x0 = b.x + ip, x1 = b.x + b.w - ip, y0 = b.y + ip, y1 = b.y + b.h - ip;
    if (k === 0) {
      
      const hi = Math.max(...m.tech.map(v => v[0] + v[1] + v[2] + v[3])) * 1.05, bw = (x1 - x0) / 30, tones = [0.22, 0.4, 0.62, 1];
      for (let d = 0; d < 30; d++) {
        const gu = clamp(u * 1.4 - d / 30 * 0.4, 0, 1); let cum = 0;
        for (let q = 0; q < 4; q++) {
          const h = m.tech[d][q] / hi * (y1 - y0) * gu;
          c.globalAlpha = a * tones[q]; c.fillStyle = D.ink; R(sc, c, x0 + d * bw + bw * 0.14, y1 - cum - h, bw * 0.72, h); cum += h;
        }
      }
    } else if (k === 1) {
      
      const rows = [[T('Traffic', 'الحركة'), N30.tb + TBU], [T('Setup success', 'نجاح الإنشاء'), N30.cssr + PCT], [T('Drop rate', 'الانقطاع'), N30.drop + PCT]];
      const rh = (y1 - y0) / 3, fs = clamp(rh * 0.5, 9, g.f(13));
      rows.forEach((r, i) => {
        const ra = a * clamp(u * 3 - i, 0, 1), y = y0 + (i + 0.5) * rh + fs * 0.36;
        sc.text(r[0], x0, y, { size: fs, color: D.mute, a: ra });
        sc.text(r[1], x1, y, { size: fs, w: 700, al: 'end', a: ra });
        if (i) { c.globalAlpha = ra * 0.5; c.fillStyle = '#4a4741'; R(sc, c, x0, y0 + i * rh, x1 - x0, 1); }
      });
    } else {
      
      const hi = Math.max(...m.hour) * 1.08, n = Math.max(1, Math.round(u * 23));
      c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = 1.6; c.lineJoin = 'round'; c.beginPath();
      for (let h = 0; h <= n; h++) { const x = sc.X(x0 + h / 23 * (x1 - x0)), y = y1 - m.hour[h] / hi * (y1 - y0); h ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    c.globalAlpha = 1;
  },
};





const KINDS = [T('daily', 'يومي'), T('hourly', 'ساعي'), T('incident', 'عطل'), T('per controller', 'لكل وحدة تحكّم')];
const COUNT = [[1, 18, 0, 0], [1, 18, 0, 0], [1, 18, 1, 1], [1, 18, 0, 0]];
const WHEN = ['08:00', T('06:00 to 23:00', '06:00 إلى 23:00'), T('19:00, on request', '19:00، عند الطلب'), '17:00'];
const WHEN_S = ['08:00', '06:00-23:00', '19:00', '17:00'];
const S6 = {
  dur: 3.6,
  aria: { en: 'Illustrative data, day 18: the North, South and West teams each get 1 daily report and 18 hourly reports; the East team gets 1 daily, 18 hourly, 1 incident report and 1 report per controller.',
          ar: 'بيانات توضيحية، اليوم 18: فرق الشمال والجنوب والغرب يصل كلًّا منها تقرير يومي و18 تقريرًا ساعيًا؛ وفريق الشرق يصله تقرير يومي و18 ساعيًا وتقرير عطل واحد وتقرير لكل وحدة تحكّم.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad;
    return { g, lw: null };
  },
  
  lay(sc, m) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H;
    const names = g.narrow ? REG.slice() : REG.map(r => T(r + ' team', 'فريق ' + r));
    const lw = Math.max(...names.map(s => sc.measure(s, { size: g.f(13), w: 650 }))) + g.f(16);
    
    const x0 = p + lw, wt = [0.8, 1.18, 1.18, 0.84], unit = (W - p - x0) / 4;
    const cws = wt.map(v => v * unit), cxs = cws.map((v, k) => x0 + cws.slice(0, k).reduce((a, b) => a + b, 0)), cw = unit;
    const heads = KINDS.map((s, k) => sc.wrap(s, cws[k] - 8, { size: g.f(12), w: 650 }));
    const hl = Math.max(...heads.map(h => h.length));
    const hy = p + g.f(12) + 14, hy2 = hy + g.f(12) + 12 + (hl - 1) * g.f(12) * 1.25;
    const ry0 = hy2 + 12, ry1 = H - p - g.f(11) - 12, rh = (ry1 - ry0) / 4;
    return { names, lw, x0, cw, cws, cxs, heads, hy, hy2, ry0, rh };
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, sk = fade(t, 0, 0.35);
    if (!m.L || m.L.W !== W) { m.L = this.lay(sc, m); m.L.W = W; }
    const L = m.L;
    sc.text(T('Mails sent on day 18', 'الرسائل المرسلة في اليوم 18'), p, p + g.f(12), { size: g.f(12), w: 650, color: D.mute, a: sk });
    
    L.heads.forEach((lines, k) => lines.forEach((s, i) => sc.text(s, L.cxs[k] + 4, L.hy + g.f(12) + i * g.f(12) * 1.25, { size: g.f(12), w: 650, color: k === 2 ? D.acc : D.ink, a: sk })));
    c.globalAlpha = sk * 0.8; c.fillStyle = '#4a4741'; R(sc, c, p, L.hy2, W - 2 * p, 1);
    
    const start = [0.45, 1.0, 2.05, 2.85], len = [0.3, 0.9, 0.3, 0.3];
    L.names.forEach((nm, r) => {
      const cy = L.ry0 + (r + 0.5) * L.rh, east = r === ND.badReg;
      if (r) { c.globalAlpha = sk * 0.5; c.fillStyle = D.page; R(sc, c, p, L.ry0 + r * L.rh, W - 2 * p, 1); }
      sc.text(nm, p, cy + g.f(13) * 0.36, { size: g.f(13), w: 650, a: sk });
      for (let k = 0; k < 4; k++) {
        const n = COUNT[r][k], x = L.cxs[k] + 4, cwk = L.cws[k];
        if (!n) { c.globalAlpha = sk * 0.6; c.fillStyle = D.page; R(sc, c, x, cy - 1, Math.min(18, cwk * 0.3), 2); continue; }
        const u = clamp((t - start[k] - r * 0.06) / len[k], 0, 1);
        if (u <= 0) continue;
        const shown = Math.max(1, Math.round(n * smooth(u))), col = k === 2 ? D.acc : D.ink;
        
        const fits = sc.measure(WHEN[k], { size: g.f(11) }) <= cwk - 8, ws = fits || AR ? WHEN[k] : WHEN_S[k];
        const wl = sc.wrap(ws, cwk - 6, { size: g.f(11) }), wh = g.f(11) * 1.3, cyy = cy - (wl.length * wh) / 2 + 2;
        
        const ew = Math.round(clamp(cwk * 0.2, 11, 20)), eh = Math.round(ew * 0.66), deep = Math.min(3, shown);
        const arrive = smooth(u * 4);
        for (let q = deep - 1; q >= 0; q--) {
          const ex = x + q * 2.5, ey = cyy - eh / 2 - q * 2.5 - (1 - arrive) * 8;
          c.globalAlpha = arrive * (q ? 0.45 : 1); c.fillStyle = q ? '#4a4741' : (k === 2 ? D.acc : '#5a5650'); R(sc, c, ex, ey, ew, eh);
          if (!q) {
            c.globalAlpha = arrive; c.strokeStyle = k === 2 ? D.surf : D.ink; c.lineWidth = 1;
            c.beginPath(); c.moveTo(sc.X(ex + 1.5), ey + 1.5); c.lineTo(sc.X(ex + ew / 2), ey + eh * 0.58); c.lineTo(sc.X(ex + ew - 1.5), ey + 1.5); c.stroke();
          }
        }
        sc.text(String(shown), x + ew + 7 + 5, cyy + g.f(13) * 0.36, { size: g.f(13), w: 700, color: col, a: arrive });
        wl.forEach((ln, i) => sc.text(ln, x, cyy + eh / 2 + 6 + g.f(11) + i * wh, { size: g.f(11), color: D.mute, a: arrive }));
      }
      if (east) {
        
        c.globalAlpha = fade(t, 2.05, 0.3); c.fillStyle = D.acc; R(sc, c, p - Math.min(8, p * 0.5), cy - L.rh * 0.3, 2.5, L.rh * 0.6);
      }
    });
    note(sc, g);
  },
};

K.STEPS['nokia-kpi'] = [S1, S2, S3, S4, S5, S6];
})();
