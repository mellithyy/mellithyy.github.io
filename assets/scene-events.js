












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

function fit(sc, forms, maxW, o) {
  for (const s of forms) if (sc.measure(s, o) <= maxW) return s;
  let s = forms[forms.length - 1];
  while (s.length > 2 && sc.measure(s + '…', o) > maxW) s = s.slice(0, -1);
  return s + '…';
}


const HOURS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00'];
const NOW = 4;                                        
const TECH = ['2G', '3G', '4G', '5G'];


const ROWS = [
  [3, 0, [1, 1, 1, 1]], [3, 1, [1, 1, 1, 1]], [3, 2, [1, 1, 1, 0]],
  [4, 0, [1, 1, 1, 1]], [4, 1, [1, 1, 1, 1]], [4, 2, [1, 1, 1, 0]],
  [5, 0, [1, 1, 1, 0]], [5, 1, [0, 0, 0, 0]], [5, 2, [0, 0, 0, 0]],
];

const KPIS = [
  ['4G', [[[T('Data traffic, GB', 'حركة البيانات، جيجابايت'), T('Traffic, GB', 'الحركة')], '1,284.6', '+38.3%', 'VOL', 0],
          [[T('Dropped calls, %', 'المكالمات المنقطعة، %'), T('Drops, %', 'الانقطاع')], '0.41', '+0.03', 'DROP', 0]]],
  ['3G', [[[T('Call setup success, %', 'نجاح إنشاء المكالمات، %'), T('Call setup, %', 'نجاح المكالمات')], '97.12', '−2.36', 'CSSR', 1],
          [[T('Voice traffic, Erl', 'حركة المكالمات، إرلانج'), T('Voice, Erl', 'المكالمات')], '3,412', '+21.4%', 'ERL', 0]]],
  ['2G', [[[T('Call setup success, %', 'نجاح إنشاء المكالمات، %'), T('Call setup, %', 'نجاح المكالمات')], '99.31', '+0.04', 'CSSR', 0],
          [[T('Dropped calls, %', 'المكالمات المنقطعة، %'), T('Drops, %', 'الانقطاع')], '0.62', '−0.05', 'DROP', 0]]],
  ['5G', [[[T('Data traffic, GB', 'حركة البيانات، جيجابايت'), T('Traffic, GB', 'الحركة')], '318.9', '+44.7%', 'VOL', 0],
          [[T('Availability, %', 'الإتاحة، %'), T('Available, %', 'الإتاحة')], '99.98', '0.00', 'AVAIL', 0]]],
];

const S_EV = {
  dur: 6.1,
  build(W, H) {
    const wd = W / H > 1.25;
    const s = wd ? clamp(W / 1150, 0.5, 1.2) : clamp(W / 380, 0.75, 1.3);
    const f = z => Math.max(wd ? 9 : 11, Math.round(z * s * 10) / 10);
    const pad = Math.round(wd ? clamp(W * 0.018, 12, 26) : clamp(W * 0.036, 10, 18));
    const m = { wd, s, f, pad };
    m.capF = f(wd ? 18 : 13.5);
    m.top = pad + (wd ? m.capF + Math.round(30 * s) : m.capF * 2.6 + 12);
    
    m.tlF = f(wd ? 12.5 : 11);
    m.tlY = Math.round(H - pad - m.tlF - (wd ? 12 : 8) * s);
    const mb = Math.round(m.tlY - m.tlF - (wd ? 40 : 20) * s);
    m.hF = f(wd ? 15 : 12);                   
    m.cF = f(wd ? 13 : 11);                   
    if (wd) {
      const gap = Math.round(W * 0.04), y0 = m.top + m.hF + Math.round(16 * s);
      m.mt = { x: pad, y: y0, w: Math.round(W * 0.42), h: mb - y0 - Math.round((m.cF + 8) * 2.4) };
      m.tp = { x: m.mt.x + m.mt.w + gap, y: y0 }; m.tp.w = W - pad - m.tp.x; m.tp.h = mb - y0;
      
      m.compact = W < 760;
      m.rows = m.compact ? ROWS.slice(3) : ROWS; m.nr = m.compact ? 1 : 2; m.groupCol = !m.compact;
      if (m.compact) m.mt.h = mb - y0;
    } else {
      const y0 = m.top + m.hF + 10;
      const r1 = Math.round((mb - y0) * (W > 520 ? 0.4 : 0.36));
      m.mt = { x: pad, y: y0, w: W - 2 * pad, h: r1 };
      const y1 = y0 + r1 + m.hF + Math.round(22 * s);
      m.tp = { x: pad, y: y1, w: W - 2 * pad, h: mb - y1 };
      m.rows = ROWS.slice(3, 8); m.nr = W > 520 ? 2 : 1; m.groupCol = false; m.nb = 2;   
    }
    
    m.tlx0 = pad + Math.round(m.tlF * 1.7); m.tlx1 = W - pad - Math.round(m.tlF * 1.7);
    m.hx = HOURS.map((_, i) => lerp(m.tlx0, m.tlx1, i / (HOURS.length - 1)));
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, wd = m.wd, s = m.s, f = m.f, pad = m.pad;
    const R = (x, y, w, h) => c.fillRect(AR ? W - x - w : x, y, w, h);
    const SR = (x, y, w, h) => c.strokeRect(Math.round(AR ? W - x - w : x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
    const L = AR ? {
      caps: [[0, 'يصل ملف المؤشرات كل ساعة: ورقة لكل جيل'], [1.25, 'دمج على الساعة ومجموعة المواقع، واختيار آخر ساعة مكتملة'], [2.75, 'قالب المنطقة يمتلئ، خلية بعد خلية'], [4.75, 'تقرير كل ساعة، طوال الحدث']],
      wb: 'ملف المؤشرات، 23:04، بعد الدمج', wbS: 'ملف المؤشرات، 23:04', mt: 'جدول واحد بعد الدمج', tp: 'قالب المنطقة أ', sep: '، ', hour: 'الساعة', grp: 'المجموعة', g: n => 'المجموعة ' + n,
      kpi: 'المؤشر', now: 'الآن', vs: 'مقابل قبل 7 أيام', vsS: 'قبل 7 أيام', date: 'التاريخ', dateV: '12 يونيو', time: 'الساعة', block: k => 'مؤشرات ' + k,
      pick: 'آخر ساعة مكتملة: 22:00', filling: 'ما زالت تمتلئ', outer: 'دمج خارجي: المجموعة بلا 5G تبقى', sent: 'أُرسل إلى فريق المنطقة', night: 'ليلة الحدث', syn: 'بيانات توضيحية', drop: 'انخفاض',
    } : {
      caps: [[0, 'The hourly KPI export arrives: one sheet per technology'], [1.25, 'Merged on hour and site group; the latest complete hour is picked'], [2.75, 'The region’s template fills, cell by cell'], [4.75, 'A report every hour, through the whole event']],
      wb: 'KPI export · 23:04, merged', wbS: 'KPI export · 23:04', mt: 'One table after the merge', tp: 'Region A template', sep: ' · ', hour: 'Hour', grp: 'Group', g: n => 'Group ' + n,
      kpi: 'KPI', now: 'Now', vs: 'vs 7 days before', vsS: 'vs 7 days', date: 'Date', dateV: '12 Jun', time: 'Time', block: k => k + ' KPIs',
      pick: 'Latest complete hour: 22:00', filling: 'still filling', outer: 'Outer merge: a group with no 5G stays', sent: 'Sent to the region’s team', night: 'Event night', syn: 'Illustrative data', drop: 'dropped',
    };
    const sk = fade(t, 0, 0.45);
    
    let si = 0; for (let k = 0; k < L.caps.length; k++) if (t >= L.caps[k][0]) si = k;
    const capW = wd ? W * 0.62 : W - 2 * pad;
    L.caps.forEach(([at, txt], k) => {
      const a = k === si ? (k === 0 ? sk : smooth((t - at - 0.1) / 0.25)) : (k === si - 1 ? 1 - smooth((t - L.caps[si][0]) / 0.12) : 0);
      if (a > 0.01) sc.para(txt, pad, pad + m.capF, capW, Math.round(m.capF * 1.3), { size: m.capF, w: 650, a });
    });
    if (wd) sc.text(L.syn, W - pad, pad + m.capF, { size: f(12.5), color: D.mute, al: 'end', a: sk });
    else sc.text(L.syn, W - pad, m.tlY - m.tlF - 8, { size: f(11), color: D.mute, al: 'end', a: sk });

    
    const cF = m.cF, hF = m.hF, mt0 = m.mt;
    const wa = fade(t, 0.15, 0.4);
    const ACT0 = 0.5, PER = 0.2;
    const act = t < ACT0 ? -1 : Math.min(3, Math.floor((t - ACT0) / PER));
    
    const tabW = Math.round(cF * 2.6 + 6 * s), tabH = Math.round(cF + 11 * s), tabG = Math.round(5 * s);
    const tabY = mt0.y - Math.round(10 * s) - hF * 0.75 - tabH / 2 + hF * 0.35;
    const tabX = k => mt0.x + mt0.w - (4 - k) * tabW - (3 - k) * tabG;
    TECH.forEach((tk, k) => {
      const x = tabX(k), on = k === act && t < ACT0 + 4 * PER + 0.4, done = act > k || t >= ACT0 + 4 * PER;
      c.globalAlpha = wa; c.fillStyle = on ? '#4a4640' : D.page; R(x, tabY, tabW, tabH);
      lat(sc, tk, x + tabW / 2, tabY + tabH / 2 + cF * 0.34, cF, { w: on ? 750 : 600, color: on || done ? D.ink : D.mute, al: 'center', a: wa });
    });
    const body = { tabs: true };

    
    const mt = m.mt, rows = m.rows, gc = m.groupCol;
    const ma = fade(t, 0.35, 0.4);
    sc.text(fit(sc, [L.wb, L.wbS], mt.w - 4 * (tabW + tabG) - 8 * s, { size: hF, w: 700 }), mt.x, mt.y - Math.round(10 * s), { size: hF, w: 700, a: wa });
    c.globalAlpha = ma * 0.55; c.fillStyle = D.page; R(mt.x, mt.y, mt.w, mt.h);
    const cols = gc ? [0.03, 0.25, 0.5, 0.62, 0.74, 0.86] : [0.04, null, 0.34, 0.5, 0.66, 0.82];
    const cw = gc ? 0.11 : 0.14;
    const headH = cF + 12 * s, gapH = wd ? 6 * s : 3 * s;
    const rh = (mt.h - headH - 6 * s - gapH * 2) / rows.length;
    const hy = mt.y + headH * 0.5 + cF * 0.35 + 2;
    sc.text(L.hour, mt.x + mt.w * cols[0], hy, { size: cF, w: 650, color: D.mute, a: ma });
    if (gc) sc.text(L.grp, mt.x + mt.w * cols[1], hy, { size: cF, w: 650, color: D.mute, a: ma });
    TECH.forEach((tk, k) => lat(sc, tk, mt.x + mt.w * (cols[2 + k] + cw / 2), hy, cF, { w: 700, color: k === act && t < ACT0 + 4 * PER + 0.4 ? D.ink : D.mute, al: 'center', a: ma }));
    c.globalAlpha = ma * 0.5; c.fillStyle = D.mute; R(mt.x + 6 * s, mt.y + headH, mt.w - 12 * s, 1);
    const rowY = rows.map((r, i) => mt.y + headH + 3 * s + i * rh + (r[0] - rows[0][0]) * gapH);
    const pickU = fade(t, 2.15, 0.35);
    
    const land = (k, i) => ACT0 + k * PER + 0.32 + i * 0.018;
    rows.forEach((r, i) => {
      const [hi, g, pres] = r, y = rowY[i] + rh / 2, latest = hi === NOW, newer = hi > NOW;
      const dim = newer ? 1 - 0.6 * pickU : 1;
      const ra = ma * dim;
      if (i === 0 || rows[i - 1][0] !== hi) sc.text(HOURS[hi], mt.x + mt.w * cols[0], y + cF * 0.35, { size: cF, w: 650, a: ra * (latest ? 1 : 0.8) });
      if (gc) sc.text(L.g(g + 1), mt.x + mt.w * cols[1], y + cF * 0.35, { size: cF, a: ra * 0.85 });
      pres.forEach((p, k) => {
        const u = fade(t, land(k, i), 0.12); if (u <= 0) return;
        const x = mt.x + mt.w * cols[2 + k], w = mt.w * cw;
        if (p) { c.globalAlpha = ra * u * 0.8; c.fillStyle = D.ink; R(x + w * 0.12, y - 2 * s, w * (0.45 + 0.35 * (((i + 1) * (k + 3)) % 5) / 4), Math.max(2.5, 4 * s)); }
        else { c.globalAlpha = ra * u * 0.7; c.strokeStyle = D.mute; c.lineWidth = 1; c.setLineDash([2, 2]); SR(x + w * 0.12, y - 3 * s, w * 0.7, 6 * s); c.setLineDash([]); }
      });
    });
    
    const li = rows.map((r, i) => r[0] === NOW ? i : -1).filter(i => i >= 0);
    if (pickU > 0 && li.length) {
      const y0 = rowY[li[0]] - 2, y1 = rowY[li[li.length - 1]] + rh + 2, x = mt.x + 3 * s, w = mt.w - 6 * s;
      c.globalAlpha = pickU * 0.08; c.fillStyle = D.ink; R(x, y0, w, y1 - y0);
      c.globalAlpha = pickU * 0.9; c.strokeStyle = D.ink; c.lineWidth = 1.3; SR(x, y0, w, y1 - y0);
      
      const ni = rows.findIndex(r => r[0] > NOW);
      if (ni >= 0 && rows[ni + 1]) sc.text(fit(sc, [L.filling], mt.w * (gc ? 0.21 : 0.3), { size: cF * 0.92, w: 650 }), mt.x + mt.w * cols[0], rowY[ni + 1] + rh / 2 + cF * 0.35, { size: cF * 0.92, w: 650, color: D.mute, a: pickU });
    }
    
    if (wd && !m.compact) {
      const ly = mt.y + mt.h + cF + 12 * s;
      sc.text(fit(sc, [L.pick], mt.w, { size: cF + 0.5, w: 700 }), mt.x, ly, { size: cF + 0.5, w: 700, a: pickU });
      sc.text(fit(sc, [L.outer], mt.w, { size: cF, w: 500 }), mt.x, ly + cF + 9 * s, { size: cF, color: D.mute, a: fade(t, 1.3, 0.4) });
    }
    
    for (let k = 0; k < 4; k++) rows.forEach((r, i) => {
      if (!r[2][k]) return;
      const t1 = land(k, i), u = (t - (t1 - 0.3)) / 0.3; if (u <= 0 || u >= 1) return;
      const e = smooth(u), x0 = tabX(k) + tabW / 2, y0 = tabY + tabH;
      const x1 = mt.x + mt.w * (cols[2 + k] + 0.02), y1 = rowY[i] + rh / 2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * mx + e * e * x1, y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * my + e * e * y1;
      c.globalAlpha = 0.85 * (1 - Math.max(0, u - 0.8) * 3); c.fillStyle = D.ink; const zz = Math.max(2.6, 3 * s); c.fillRect(sc.X(x) - zz / 2, y - zz / 2, zz, zz);
    });

    
    const tp = m.tp, ta = fade(t, 0.55, 0.45);
    sc.text(wd ? L.tp : L.tp + L.sep + HOURS[NOW], tp.x, tp.y - Math.round(10 * s), { size: hF, w: 700, a: ta });
    if (wd) lat(sc, 'xlsx', tp.x + tp.w, tp.y - Math.round(10 * s), hF, { w: 600, color: D.mute, al: 'end', a: ta });
    c.globalAlpha = ta; c.fillStyle = D.page; R(tp.x, tp.y, tp.w, tp.h);
    
    const blocks = KPIS.slice(0, m.nb || 4), ip = Math.round(clamp(tp.w * 0.035, 8, 18)), noDT = !wd, nL = (noDT ? 1 : 2) + blocks.length * (1 + m.nr);
    const tl = (tp.h - ip * 1.2) / (nL + 0.4), tF = Math.max(wd ? 9 : 11, Math.min(f(wd ? 15 : 12.5), tl * 0.68));
    const xL = tp.x + ip, xNow = tp.x + tp.w * (wd ? 0.66 : 0.62), xVs = tp.x + tp.w - ip;
    let ly = tp.y + ip * 0.6;
    const base = () => ly + tl * 0.5 + tF * 0.35;
    
    const dt = fade(t, 2.8, 0.25);
    if (!noDT) {
    sc.text(L.date, xL, base(), { size: tF, color: D.mute, w: 600, a: ta });
    const dW = sc.measure(L.date, { size: tF, w: 600 }) + tF * 0.8;
    sc.text(L.dateV, xL + dW, base(), { size: tF, w: 700, a: ta * dt });
    if (dt < 1) lat(sc, '{{date}}', xL + dW, base(), tF * 0.92, { w: 500, color: D.mute, a: ta * (1 - dt) * 0.8 });
    sc.text(L.time, xNow - (wd ? tp.w * 0.12 : tp.w * 0.14), base(), { size: tF, color: D.mute, w: 600, a: ta, al: 'end' });
    sc.text(HOURS[NOW], xVs, base(), { size: tF, w: 750, al: 'end', a: ta * dt });
    if (dt < 1) lat(sc, '{{time}}', xVs, base(), tF * 0.92, { w: 500, color: D.mute, al: 'end', a: ta * (1 - dt) * 0.8 });
    ly += tl;
    }
    
    const vsLab = sc.measure(L.vs, { size: tF * 0.92, w: 600 }) <= (xVs - xNow) - tF ? L.vs : L.vsS;
    sc.text(L.kpi, xL, base(), { size: tF * 0.92, color: D.mute, w: 600, a: ta });
    sc.text(L.now, xNow, base(), { size: tF * 0.92, color: D.mute, w: 600, al: 'end', a: ta });
    sc.text(vsLab, xVs, base(), { size: tF * 0.92, color: D.mute, w: 600, al: 'end', a: ta });
    c.globalAlpha = ta * 0.45; c.fillStyle = D.mute; R(xL, ly + tl - 1, tp.w - 2 * ip, 1);
    ly += tl;
    
    const cells = [];
    let n = 0;
    blocks.forEach(([tk, list]) => {
      sc.text(L.block(tk), xL, base(), { size: tF, w: 750, a: ta });
      ly += tl;
      list.slice(0, m.nr).forEach(([labs, v, ch, tok, dropped]) => {
        const t0 = 2.95 + n * (wd ? 0.15 : 0.26), y = base(), u = fade(t, t0, 0.18), u2 = fade(t, t0 + 0.07, 0.18);
        const labW = xNow - xL - sc.measure('0,000.0', { size: tF, w: 700 }) - tF;
        sc.text(fit(sc, labs, labW, { size: tF }), xL + tF * 0.6, y, { size: tF, a: ta * 0.9 });
        
        if (u < 1) lat(sc, '{{' + tok + '}}', xNow, y, tF * 0.9, { w: 500, color: D.mute, al: 'end', a: ta * (1 - u) * 0.75 });
        const pl = '{{' + tok + '}}:{{7d' + (ch.endsWith('%') ? '%' : '') + '}}';
        const plFits = lat(sc, pl, 0, 0, tF * 0.9, { measure: true, w: 500 }) < xVs - xNow - tF;
        if (u2 < 1) lat(sc, plFits ? pl : '{{…}}', xVs, y, tF * 0.9, { w: 500, color: D.mute, al: 'end', a: ta * (1 - u2) * 0.75 });
        sc.text(v, xNow, y, { size: tF, w: 700, al: 'end', a: ta * u });
        sc.text(ch, xVs, y, { size: tF, w: 750, al: 'end', color: dropped ? D.acc : D.ink, a: ta * u2 });
        if (dropped && u2 > 0) {
          
          const cw2 = sc.measure(ch, { size: tF, w: 750 });
          c.globalAlpha = ta * u2; c.fillStyle = D.acc; R(xL - ip * 0.55, y - tF * 0.75, 3, tF * 0.95);
          R(xVs - cw2, y + 4 * s, cw2, 1.5);
        }
        cells.push({ t0, x: (xNow + xVs) / 2, y: y - tF * 0.35 });
        ly += tl; n++;
      });
    });
    
    if (li.length) {
      const sx = mt.x + mt.w * 0.7, sy = (rowY[li[0]] + rowY[li[li.length - 1]] + rh) / 2;
      cells.forEach((cl, k) => {
        const u = (t - (cl.t0 - 0.28)) / 0.28; if (u <= 0 || u >= 1) return;
        const e = smooth(u), mx = (sx + cl.x) / 2, my = Math.min(sy, cl.y) - (wd ? 40 : 16) * s;
        const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * cl.x, y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * cl.y;
        c.globalAlpha = 0.9; c.fillStyle = KPIS[Math.floor(k / m.nr)][1][k % m.nr][4] ? D.acc : D.ink;
        c.beginPath(); c.arc(sc.X(x), y, 2.2 * Math.max(0.8, s), 0, 6.2832); c.fill();
      });
    }

    
    const tla = fade(t, 0.1, 0.4), hx = m.hx, ty2 = m.tlY;
    sc.text(L.night, m.tlx0, ty2 - Math.round(12 * s), { size: m.tlF, w: 700, color: D.mute, a: tla });
    c.globalAlpha = tla * 0.6; c.fillStyle = D.mute; R(m.tlx0, ty2, m.tlx1 - m.tlx0, 1);
    
    const SEND = 4.2, FLY = 0.55, arrive = SEND + FLY;
    const sweep = clamp((t - (arrive + 0.15)) / 1.05, 0, 1), sweepI = NOW + sweep * (HOURS.length - 1 - NOW);
    HOURS.forEach((h, i) => {
      const x = hx[i];
      const sent = i < NOW ? fade(t, 0.25 + i * 0.14, 0.2) : i === NOW ? fade(t, arrive, 0.15) : clamp((sweepI - i) * 3 + 1, 0, 1) * (sweep > 0 ? 1 : 0);
      const r = Math.max(2.6, 3.6 * s);
      c.globalAlpha = tla; c.strokeStyle = D.mute; c.lineWidth = 1; c.beginPath(); c.arc(sc.X(x), ty2, r, 0, 6.2832); c.fillStyle = D.surf; c.fill(); c.stroke();
      if (sent > 0) { c.globalAlpha = tla * sent; c.fillStyle = D.ink; c.beginPath(); c.arc(sc.X(x), ty2, r, 0, 6.2832); c.fill(); }
      const every = (!wd && W < 420) || m.compact ? 2 : 1;
      if (i % every === 0 || i === NOW) sc.text(h, x, ty2 + m.tlF + 9 * s, { size: m.tlF, w: i === NOW ? 750 : 550, color: i === NOW ? D.ink : D.mute, al: 'center', a: tla });
      if (i === NOW && sent > 0) {
        
        c.globalAlpha = tla * sent; c.strokeStyle = D.acc; c.lineWidth = 1.5; c.beginPath(); c.arc(sc.X(x), ty2, r + 4 * Math.max(0.8, s), 0, 6.2832); c.stroke();
      }
    });
    
    const ph = lerp(hx[NOW], hx[HOURS.length - 1], smooth(sweep));
    c.globalAlpha = tla * 0.8 * (1 - fade(t, arrive + 1.25, 0.3)); c.fillStyle = D.ink; R(ph - 0.75, ty2 - 9 * s, 1.5, 6 * s);
    
    const sa = fade(t, arrive, 0.3);
    if (sa > 0) {
      const sy2 = wd ? tp.y + tp.h + m.tlF + 10 * s : tp.y - Math.round(10 * s), sx2 = tp.x + tp.w;
      const sF = wd ? m.tlF + 0.5 : hF * 0.95, sw = sc.measure(L.sent, { size: sF, w: 700 });
      sc.text(L.sent, sx2, sy2, { size: sF, w: 700, al: 'end', a: sa });
      
      const tx = AR ? W - sx2 + sw + 6 : sx2 - sw - 14, tyy = sy2 - sF * 0.35, k2 = 8 * Math.max(0.8, s);
      c.globalAlpha = sa; c.strokeStyle = D.ink; c.lineWidth = 1.5; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(tx, tyy); c.lineTo(tx + k2 * 0.35, tyy + k2 * 0.35); c.lineTo(tx + k2, tyy - k2 * 0.45); c.stroke(); c.lineCap = 'butt';
    }
    const fu = (t - SEND) / FLY;
    if (fu > 0 && fu < 1) {
      const e = smooth(fu), x0 = tp.x + tp.w - 20 * s, y0 = tp.y + tp.h * 0.15, x1 = hx[NOW], y1 = ty2;
      const mx = lerp(x0, x1, 0.5) + 40 * s, my = Math.min(y0, y1) - 30 * s;
      const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * mx + e * e * x1, y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * my + e * e * y1;
      const ew = (wd ? 26 : 18) * Math.max(0.7, s) * (1 - 0.5 * e), eh = ew * 0.66, X = sc.X(x);
      c.globalAlpha = 1; c.fillStyle = D.ink; c.fillRect(X - ew / 2, y - eh / 2, ew, eh);
      c.strokeStyle = D.surf; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X - ew / 2, y - eh / 2); c.lineTo(X, y + eh * 0.1); c.lineTo(X + ew / 2, y - eh / 2); c.stroke();
    }
  },
};

K.SPECS['nokia-events'] = S_EV;
K.ARIA['nokia-events'] = K.arDigits(AR
  ? 'رسم متحرك ببيانات توضيحية: يصل ملف مؤشرات الشبكة بعد كل ساعة، وفيه ورقة لكل جيل من 2G إلى 5G، فتُقرأ الأوراق واحدة بعد الأخرى وتُدمج في جدول واحد على الساعة ومجموعة المواقع. الساعة الأحدث ما زالت تمتلئ، فتُختار آخر ساعة مكتملة، 22:00. ثم يمتلئ قالب المنطقة خلية بعد خلية: قيمة كل مؤشر الآن وتغيّره مقابل الساعة نفسها قبل 7 أيام، ويضيء بالكهرماني مؤشر واحد انخفض، نجاح إنشاء المكالمات في 3G. ثم يُرسَل التقرير إلى فريق المنطقة، ويمتلئ خط ليلة الحدث ساعة بعد ساعة.'
  : 'Animation on illustrative data: the network’s KPI export arrives after each hour with one sheet per technology, 2G to 5G; the sheets are read in turn and merged into one table on hour and site group. The newest hour is still filling, so the latest complete hour, 22:00, is picked. The region’s template then fills cell by cell: each KPI’s value now and its change against the same hour seven days before; one KPI that dropped, 3G call setup success, lights amber. The report goes to the region’s team, and the event night’s timeline fills hour by hour.');
})();
