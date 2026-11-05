




(() => {
'use strict';
const K = window.KIT, AR = K.AR, D = K.DARK;
const { clamp, lerp, smooth, fmtInt } = K;
const DATA = window.KIT_DATA || {}, S = DATA.sama;
if (!S) return;
const ease = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
const fs = W => W < 420 ? 10.5 : W < 620 ? 11.5 : 12.5;          
const big = W => clamp(W * 0.06, 20, 46);
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const dayName = iso => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + (AR ? MON_AR : MON_EN)[m - 1] + ' ' + y; };

function pen(sc, c) {
  const W = sc.W, X = x => (AR ? W - x : x);
  return {
    X,
    rect(x, y, w, h, col, a) { if (a <= 0.002 || w <= 0 || h <= 0) return; c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.fillRect(AR ? W - x - w : x, y, w, h); },
    box(x, y, w, h, col, a, lw = 1) { if (a <= 0.002) return; c.globalAlpha = Math.min(1, a); c.strokeStyle = col; c.lineWidth = lw; c.strokeRect((AR ? W - x - w : x) + lw / 2, y + lw / 2, w - lw, h - lw); },
    line(pts, col, a, lw = 1, dash) {
      if (a <= 0.002 || pts.length < 2) return;
      c.globalAlpha = Math.min(1, a); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.lineJoin = 'round'; c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), y) : c.moveTo(X(x), y))); c.stroke(); c.setLineDash([]);
    },
    dot(x, y, r, col, a) { if (a <= 0.002) return; c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.arc(X(x), y, r, 0, 6.2832); c.fill(); },
    tick(x, y, s, col, a) {           
      if (a <= 0.002) return; c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = Math.max(1.3, s * 0.16); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      c.moveTo(X(x - s * 0.42), y); c.lineTo(X(x - s * 0.12), y + s * 0.3); c.lineTo(X(x + s * 0.45), y - s * 0.38); c.stroke(); c.lineCap = 'butt';
    },
    cross(x, y, s, col, a) {
      if (a <= 0.002) return; c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = Math.max(1.4, s * 0.17); c.lineCap = 'round'; c.beginPath();
      c.moveTo(X(x - s * 0.35), y - s * 0.35); c.lineTo(X(x + s * 0.35), y + s * 0.35); c.moveTo(X(x + s * 0.35), y - s * 0.35); c.lineTo(X(x - s * 0.35), y + s * 0.35); c.stroke(); c.lineCap = 'butt';
    },
    hatch(x, y, w, h, col, a, gap = 4) {       
      if (a <= 0.002 || w <= 0 || h <= 0) return;
      c.save(); c.beginPath(); c.rect(AR ? W - x - w : x, y, w, h); c.clip();
      c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
      const x0 = AR ? W - x - w : x;
      for (let k = -h; k < w + h; k += gap) { c.moveTo(x0 + k, y + h); c.lineTo(x0 + k + h, y); }
      c.stroke(); c.restore();
    },
  };
}





const LON0 = 34.4, LON1 = 55.9, LAT0 = 16.1, LAT1 = 32.4, COS = Math.cos(24 * Math.PI / 180);
const yearsT = iso => { const [y, m, d] = iso.split('-').map(Number); return y + (m - 1) / 12 + ((d || 1) - 1) / 365; };
const S1 = {
  dur: 3.7,
  aria: {
    en: 'Real SAMA data: a map of Saudi Arabia where the portal’s 60 cities light up as their files arrive, 13 groups of five places a month for 34 months: 442 files and 1,021 days, 3,924,724 figures with none empty. Under it, the three sources on one timeline: the monthly table for 2016 to 2023, 315 weekly PDF reports from June 2020, and the daily data from 1 January 2024.',
    ar: 'بيانات ساما الحقيقية: خريطة السعودية تضيء فيها مدن البوابة الستون كلما وصلت ملفاتها، 13 مجموعة من خمسة أماكن في الشهر طوال 34 شهرًا: 442 ملفًا و1,021 يومًا، و3,924,724 رقمًا لا خانة فارغة فيها. وتحتها المصادر الثلاثة على خط زمني واحد: الجدول الشهري من 2016 إلى 2023، و315 تقريرًا أسبوعيًا منذ يونيو 2020، والبيانات اليومية منذ 1 يناير 2024.',
  },
  build(W, H) {
    const pad = W < 420 ? 14 : 22, f = fs(W);
    const m = { pad, f };
    const stripH = Math.round(f * 1.25 + 9), axisH = f + 10;
    m.sy = H - pad - axisH - 3 * stripH;                         
    const mapW = Math.min(W * 0.58, (m.sy - pad - 8) * (19.64 / 16.3) * 1.0);
    const mapH = mapW * 16.3 / 19.64;
    m.map = { x: pad, y: pad + 4, w: mapW, h: mapH };
    m.k = mapW / ((LON1 - LON0) * COS);
    m.stripH = stripH; m.axisH = axisH;
    m.t0 = 2016; m.t1 = 2026.92;
    m.tx = yr => pad + (yr - m.t0) / (m.t1 - m.t0) * (W - 2 * pad);
    
    const vmax = Math.max(...S.map.cities.map(c => c[5]));
    m.pts = S.map.cities.map(([en, ar, lon, lat, g, v]) => ({ en, ar, g, x: (lon - LON0) * COS * m.k, y: (LAT1 - lat) * m.k, r: 1.4 + 4.6 * Math.sqrt(v / vmax) }));
    m.pdfT = S.pdf.dates.map(yearsT);
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, P = pen(sc, c), f = m.f, pad = m.pad, M = m.map;
    
    const mx = AR ? W - M.x - M.w : M.x;
    const outA = smooth(t / 0.5);
    c.globalAlpha = 0.07 * outA; c.fillStyle = D.ink; c.beginPath();
    S.map.border.forEach(([lo, la], i) => { const x = mx + (lo - LON0) * COS * m.k, y = M.y + (LAT1 - la) * m.k; i ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.closePath(); c.fill();
    c.globalAlpha = 0.55 * outA; c.strokeStyle = D.mute; c.lineWidth = 1; c.stroke();
    
    const months = S.map.months.length, groups = S.map.groups;
    const D0 = 1.15, D1 = 3.0;
    const fileU = clamp((t - D0) / (D1 - D0), 0, 1);
    
    const firstEnd = 0.32, filesIn = fileU < firstEnd ? (fileU / firstEnd) * groups : groups + (fileU - firstEnd) / (1 - firstEnd) * (S.map.files - groups);
    const groupsIn = Math.min(groups, filesIn);
    for (const p of m.pts) {
      const lit = smooth((groupsIn - (p.g - 1)) / 0.9);
      const x = mx + p.x, y = M.y + p.y;
      c.globalAlpha = 0.5 * outA * (1 - lit); c.fillStyle = D.page; c.beginPath(); c.arc(x, y, Math.max(1.3, p.r * 0.7), 0, 6.2832); c.fill();
      if (lit > 0) {
        c.globalAlpha = 0.9 * lit; c.fillStyle = D.ink; c.beginPath(); c.arc(x, y, p.r * (0.6 + 0.4 * lit), 0, 6.2832); c.fill();
        const ring = clamp((groupsIn - (p.g - 1)) / 1.4, 0, 1), ringA = 1 - smooth((fileU - firstEnd) / 0.08);
        if (ring > 0 && ring < 1 && ringA > 0) { c.globalAlpha = 0.5 * (1 - ring) * ringA; c.strokeStyle = D.ink; c.lineWidth = 1; c.beginPath(); c.arc(x, y, p.r + 2 + ring * 7, 0, 6.2832); c.stroke(); }
      }
    }
    
    const nameA = smooth((t - 2.0) / 0.4);
    if (nameA > 0) for (const en of ['Riyadh', 'Jeddah', 'Dammam']) {
      const p = m.pts.find(q => q.en === en); if (!p) continue;
      c.globalAlpha = nameA * 0.9; c.fillStyle = D.mute; c.font = `500 ${f}px ${K.FACE}`; c.textBaseline = 'alphabetic';
      c.direction = AR ? 'rtl' : 'ltr';
      const lab = AR ? p.ar : p.en, w = c.measureText(lab).width, x = mx + p.x, y = M.y + p.y;
      const right = en === 'Dammam';
      c.textAlign = right ? 'right' : 'left';
      c.fillText(lab, right ? x - p.r - 6 : x + p.r + 4, y + (en === 'Jeddah' ? 12 : en === 'Dammam' ? -9 : -4));
    }
    
    const L = AR ? {
      files: 'ملفًا من البوابة', grp: '13 مجموعة من خمسة أماكن، 34 شهرًا', days: 'يومًا', cities: 'مدينة على الخريطة',
      fig: '3,924,724 رقمًا يوميًا', none: 'لا خانة فارغة فيها',
      s: ['الجدول الشهري، 2016 إلى 2023: 96 شهرًا', 'التقارير الأسبوعية PDF منذ يونيو 2020: 315 تقريرًا', 'البيانات اليومية من البوابة منذ 1 يناير 2024'],
      tag: 'بيانات ساما الحقيقية',
    } : {
      files: 'portal files', grp: '13 groups of five places, 34 months', days: 'days', cities: 'cities on the map',
      fig: '3,924,724 daily figures', none: 'none of them empty',
      s: ['Monthly table, 2016 to 2023: 96 months', 'Weekly PDF reports from June 2020: 315', 'Daily data from the portal, from 1 January 2024'],
      tag: 'Real SAMA data',
    };
    const cx = M.x + M.w + (W < 420 ? 12 : 26), cw = W - pad - cx, B = big(W) * (W < 420 ? 0.82 : 0.9);
    const ca = smooth((t - D0) / 0.3);
    const nFiles = Math.round(clamp(filesIn, 0, S.map.files)), nDays = Math.round(S.map.days * clamp(filesIn / S.map.files, 0, 1));
    const nCities = m.pts.filter(p => p.g <= Math.floor(groupsIn + 0.01)).length;
    let y = M.y + B * 0.95 + (W < 420 ? f + 6 : 0);
    sc.text(fmtInt(nFiles), cx, y, { size: B, w: 800, stretch: 'semi-condensed', a: ca });
    y += f + 5; sc.text(L.files, cx, y, { size: f + 0.5, a: ca });
    y += f + 2; const ng = sc.para(L.grp, cx, y, cw, f + 3, { size: f - 0.5, color: D.mute, a: ca }); y += (ng - 1) * (f + 3);
    const nb = { size: B * 0.8, w: 800, stretch: 'semi-condensed' };
    y += B * 0.95 + 8; sc.text(fmtInt(nCities), cx, y, Object.assign({ a: ca }, nb));
    sc.text(L.cities, cx + sc.measure(fmtInt(nCities), nb) + 8, y, { size: f, color: D.mute, a: ca });
    y += B * 0.8 + 6; sc.text(fmtInt(nDays), cx, y, Object.assign({ a: ca }, nb));
    sc.text(L.days, cx + sc.measure(fmtInt(nDays), nb) + 8, y, { size: f, color: D.mute, a: ca });
    const endA = smooth((t - (D1 + 0.05)) / 0.4);
    y += f + 14; const nf = sc.para(L.fig, cx, y, cw, f + 4, { size: f + 0.5, w: 650, a: endA });
    sc.para(L.none, cx, y + nf * (f + 4), cw, f + 4, { size: f, color: D.mute, a: endA });
    
    const sy = m.sy, sh = m.stripH, bh = Math.max(5, sh - f - 7);
    const axA = smooth((t - 0.1) / 0.4);
    const strip = (i, u0, u1, label, a) => { const yy = sy + i * sh; sc.text(label, pad, yy + f, { size: f - 0.5, color: D.mute, a }); return yy + f + 4; };
    
    const mA = smooth((t - 0.25) / 0.3), mU = clamp((t - 0.3) / 0.7, 0, 1);
    let by = strip(0, 0, 0, L.s[0], mA);
    const x16 = m.tx(2016), x24 = m.tx(2024);
    for (let k = 0; k < 96 * mU; k++) { const x = lerp(x16, x24, k / 96), w = (x24 - x16) / 96; P.rect(x, by, Math.max(1, w - 0.8), bh, D.ink, 0.6 * mA); }
    
    const pA = smooth((t - 0.55) / 0.3), pU = clamp((t - 0.6) / 0.9, 0, 1);
    by = strip(1, 0, 0, L.s[1], pA);
    const nP = Math.floor(m.pdfT.length * pU);
    for (let k = 0; k < nP; k++) P.rect(m.tx(m.pdfT[k]), by, 1, bh, D.ink, 0.75 * pA);
    
    const dA = smooth((t - 0.95) / 0.3);
    by = strip(2, 0, 0, L.s[2], dA);
    const xD0 = m.tx(2024), xD1 = m.tx(yearsT(S.map.day1));
    const monthsIn = filesIn / groups;
    for (let k = 0; k < months; k++) {
      const u = clamp(monthsIn - k, 0, 1); if (u <= 0) break;
      const x = lerp(xD0, xD1, k / months), w = (xD1 - xD0) / months;
      P.rect(x, by + bh * (1 - u), Math.max(1, w - 0.6), bh * u, D.ink, 0.95 * dA);
    }
    
    for (let yr = 2016; yr <= 2026; yr += 2) {
      const x = m.tx(yr);
      P.rect(x, H - pad - m.axisH + 2, 1, 5, D.mute, 0.6 * axA);
      sc.text(String(yr), x + 3, H - pad - 1, { size: f - 1, w: 600, color: D.mute, a: axA });
    }
    sc.text(L.tag, W - pad, pad + f - 2, { size: f - 1, color: D.mute, al: 'end', a: 0.9 });
  },
};




const CHECKS_EN = ['every week ends on a Saturday', 'no week missing in any series', 'the cities add up to the kingdom', 'the activities add up to the kingdom', 'no zero or negative value', 'one row per series and week'];
const CHECKS_AR = ['كل أسبوع ينتهي يوم سبت', 'لا أسبوع ناقص في أي سلسلة', 'مجموع المدن يساوي المملكة', 'مجموع الأنشطة يساوي المملكة', 'لا قيمة صفرية أو سالبة', 'صف واحد لكل سلسلة وأسبوع'];
const S2 = {
  dur: 3.9,
  aria: {
    en: 'Real project files: SAMA’s 315 weekly PDF reports, from 12 June 2020 to 20 October 2026, turn one by one into rows of one weekly table of 14,073 rows; then 46 SQL checks tick one by one, such as every week ends on a Saturday and the cities add up to the kingdom, and the table is saved only when all 46 pass.',
    ar: 'ملفات المشروع الحقيقية: تقارير ساما الأسبوعية الـ315 من 12 يونيو 2020 إلى 20 أكتوبر 2026 تتحول واحدًا بعد آخر إلى صفوف جدول أسبوعي واحد من 14,073 صفًا، ثم تُجتاز 46 فحصًا بلغة SQL واحدًا بعد آخر، مثل أن كل أسبوع ينتهي يوم سبت وأن مجموع المدن يساوي المملكة، ولا يُحفظ الجدول إلا إذا نجحت كلها.',
  },
  build(W, H) {
    const pad = W < 420 ? 14 : 22, f = fs(W);
    const m = { pad, f };
    m.checkH = Math.round(f * 3.2 + (W < 420 ? 30 : 38));                 
    m.top = pad + f + 10;
    m.bot = H - pad - m.checkH;
    
    m.cnt = big(W) * 0.95 * 0.75 + 16 + 24 + f + 10;
    const sheetH = Math.min(m.bot - m.top - 26 - m.cnt, W * 0.36), sheetW = sheetH * 0.72;
    m.sheet = { x: pad + 6, y: m.top + 14, w: sheetW, h: sheetH };
    m.tbl = { x: W * (W < 420 ? 0.5 : 0.52), y: m.top + 14, w: W - pad - W * (W < 420 ? 0.5 : 0.52), h: m.bot - m.top - 20 };
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, P = pen(sc, c), f = m.f, pad = m.pad, Sh = m.sheet, Tb = m.tbl;
    const L = AR ? { rep: 'تقريرًا أسبوعيًا PDF', tbl: 'جدول أسبوعي واحد', rows: 'صفًا', cols: ['الأسبوع', 'السلسلة', 'العدد', 'القيمة'], figs: 'العدد والقيمة',
      chk: 'فحصًا بلغة SQL', pass: 'نجحت كلها: حُفظ الجدول', tag: 'ملفات المشروع الحقيقية' }
      : { rep: 'weekly PDF reports', tbl: 'one weekly table', rows: 'rows', cols: ['week', 'series', 'number', 'value'], figs: 'number, value',
      chk: 'SQL checks', pass: 'all pass: the table is saved', tag: 'Real project files' };
    const T0 = 0.2, T1 = 2.3;
    const u = clamp((t - T0) / (T1 - T0), 0, 1), n = Math.round(S.pdf.n * u);
    
    const pileA = smooth(t / 0.4) * (1 - 0.35 * smooth((t - T1) / 0.4));
    const shown = 5;
    const sheet = (x, y, w, h, a, lines) => {
      P.rect(x, y, w, h, D.page, a); P.rect(x, y, w, h * 0.09, D.mute, a * 0.55);
      const rows = lines || 9;
      for (let r = 0; r < rows; r++) { const yy = y + h * 0.18 + r * h * 0.075; P.rect(x + w * 0.08, yy, w * 0.84 * (r % 3 === 0 ? 0.55 : 1), Math.max(1, h * 0.022), D.ink, a * (r % 3 === 0 ? 0.55 : 0.28)); }
      P.rect(x + w * 0.08, y + h * 0.88, w * 0.3, Math.max(1, h * 0.02), D.mute, a * 0.5);
    };
    for (let k = shown - 1; k >= 0; k--) sheet(Sh.x + k * 4, Sh.y + k * 4, Sh.w, Sh.h, pileA * (1 - k * 0.12));
    
    const per = (T1 - T0) / 14;                          
    if (t > T0 && t < T1 + 0.2) {
      const k = (t - T0) / per, fu = k - Math.floor(k), e = ease(fu / 0.85);
      const rowsNow = Math.min(1, u);
      const tx = Tb.x, ty = Tb.y + 22 + (Tb.h - 30) * rowsNow, x = lerp(Sh.x, tx, e), y = lerp(Sh.y, ty - 4, e) - Math.sin(Math.PI * e) * 18;
      const w = lerp(Sh.w, Tb.w, e), h = lerp(Sh.h, 6, e);
      if (t < T1) sheet(x, y, w, h, 0.9 * (1 - smooth((fu - 0.85) / 0.15)), 9);
    }
    
    const tA = smooth((t - 0.1) / 0.4);
    sc.text(L.tbl, Tb.x, m.top + 2, { size: f + 0.5, w: 700, a: tA });
    const cw = [0.24, 0.36, 0.2, 0.2];
    let cx = Tb.x;
    for (let j = 0; j < 4; j++) { if (!(W < 420 && j === 3)) sc.text(W < 420 && j === 2 ? L.figs : L.cols[j], cx + 2, Tb.y + 12, { size: f - 1.5, color: D.mute, a: tA }); cx += Tb.w * cw[j]; }
    P.rect(Tb.x, Tb.y + 17, Tb.w, 1, D.mute, 0.6 * tA);
    const rowsH = (Tb.h - 26) * u, rh = Math.max(2.2, Math.min(5, (Tb.h - 26) / 60));
    for (let yy = 0; yy + rh <= rowsH; yy += rh) {
      let x = Tb.x;
      for (let j = 0; j < 4; j++) { const w = Tb.w * cw[j]; P.rect(x + 2, Tb.y + 22 + yy, (w - 6) * (j < 2 ? 0.8 : 0.55 + 0.4 * (((yy / rh) * 7 + j * 3) % 5) / 5), Math.max(1, rh - 1.4), D.ink, 0.42); x += w; }
    }
    
    const B = big(W) * 0.95, ca = smooth((t - T0) / 0.3);
    const ky = Sh.y + Sh.h + 16 + 24 + B * 0.75;          
    sc.text(fmtInt(n), pad, ky, { size: B, w: 800, stretch: 'semi-condensed', a: ca });
    sc.text(L.rep, pad + sc.measure(fmtInt(n), { size: B, w: 800, stretch: 'semi-condensed' }) + 8, ky, { size: f, a: ca });
    if (n > 0) sc.text(dayName(S.pdf.dates[0]) + (AR ? ' إلى ' : ' to ') + dayName(S.pdf.dates[Math.min(S.pdf.dates.length - 1, n - 1)]), pad, ky + f + 6, { size: f - 0.5, color: D.mute, a: ca });
    
    const fa = smooth((t - T0) / 0.4), ay = Sh.y + Sh.h * 0.45;
    P.line([[Sh.x + Sh.w + 22, ay], [Tb.x - 14, ay]], D.mute, 0.6 * fa, 1, [2, 4]);
    P.line([[Tb.x - 20, ay - 4], [Tb.x - 14, ay], [Tb.x - 20, ay + 4]], D.mute, 0.6 * fa, 1);
    const rA = smooth((t - T1 + 0.3) / 0.4);
    sc.text(fmtInt(Math.round(S.pdf.rows * u)) + ' ' + L.rows, Tb.x + Tb.w, m.top + 2, { size: f, w: 650, al: 'end', a: rA * 0.95 });
    
    const C0 = 2.35, C1 = 3.45, cu = clamp((t - C0) / (C1 - C0), 0, 1), nc = Math.floor(S.pdf.checks * cu + 1e-6);
    const cy0 = H - pad - m.checkH + 10, chA = smooth((t - C0 + 0.25) / 0.3);
    const perRow = W < 420 ? 23 : 46, rowsC = Math.ceil(S.pdf.checks / perRow);
    const bs = Math.min(15, (W - 2 * pad - (perRow - 1) * 3) / perRow), g = bs + 3;
    sc.text(fmtInt(nc) + ' / 46 ' + L.chk, pad, cy0 + f, { size: f + 0.5, w: 700, a: chA });
    const list = AR ? CHECKS_AR : CHECKS_EN;
    if (cu > 0 && cu < 1) sc.text(list[Math.min(list.length - 1, Math.floor(cu * list.length))], pad + sc.measure('46 / 46 ' + L.chk, { size: f + 0.5, w: 700 }) + 14, cy0 + f, { size: f, color: D.mute, a: chA });
    const passA = smooth((t - C1) / 0.35);
    if (passA > 0) sc.text(L.pass, W - pad, cy0 + f, { size: f, w: 650, al: 'end', a: passA });
    for (let k = 0; k < S.pdf.checks; k++) {
      const x = pad + (k % perRow) * g, y = cy0 + f + 10 + Math.floor(k / perRow) * g;
      P.rect(x, y, bs, bs, D.page, chA);
      if (k < nc) { P.rect(x, y, bs, bs, D.ink, 0.16); P.tick(x + bs / 2, y + bs / 2, bs * 0.8, D.ink, 0.95); }
    }
    sc.text(L.tag, W - pad, pad + f - 2, { size: f - 1, color: D.mute, al: 'end' });
  },
};





const S3 = {
  dur: 3.9,
  aria: {
    en: 'Real SAMA data: the portal’s days, summed into Sunday-to-Saturday weeks, meet SAMA’s weekly PDF weeks on one bar of 145 weeks from 7 January 2024 to 17 October 2026: 9,816 of 9,836 weekly city figures agree within rounding. The one week that differs, 24 to 30 March 2024, is amber; opened, it shows the ten cities’ seven days from the portal and the PDF short by about half of Saturday 30 March.',
    ar: 'بيانات ساما الحقيقية: أيام البوابة مجموعةً في أسابيع من الأحد إلى السبت تلتقي بأسابيع تقرير ساما على شريط واحد من 145 أسبوعًا من 7 يناير 2024 إلى 17 أكتوبر 2026: 9,816 من 9,836 رقمًا أسبوعيًا للمدن متطابقة في حدود التقريب. والأسبوع الوحيد المختلف، 24 إلى 30 مارس 2024، كهرماني، وإذا فُتح ظهرت أيام المدن العشر السبعة من البوابة، والتقرير ينقصه نحو نصف يوم السبت 30 مارس.',
  },
  build(W, H) {
    const pad = W < 420 ? 14 : 22, f = fs(W);
    const m = { pad, f, nw: S.grid.weeks, bad: S.grid.miss[0][1] };
    m.x0 = pad; m.x1 = W - pad; m.cw = (m.x1 - m.x0) / m.nw;
    m.dayY = pad + f * 2 + 10;                           
    m.dq = Math.max(1.6, Math.min(m.cw - 0.8, 4.2)); m.dayH = 7 * (m.dq + 0.8);
    if (W < 420) { m.dayY -= 4; }
    m.barY = m.dayY + m.dayH + f + 16;                   
    m.barH = Math.max(10, Math.min(20, H * 0.05));
    m.pdfY = m.barY + m.barH + f + 18;                   
    m.pdfH = Math.max(8, m.dayH * 0.55);
    m.inY = m.pdfY + m.pdfH + f + 22;                    
    m.inH = H - pad - m.inY;
    
    const ct = DATA.cities, i0 = Math.round((Date.UTC(2024, 2, 24) - Date.parse(ct.start + 'T00:00:00Z')) / 864e5);
    m.days = [0, 1, 2, 3, 4, 5, 6].map(d => ct.rows.reduce((a, r) => a + r.v[i0 + d], 0));
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, P = pen(sc, c), f = m.f, pad = m.pad;
    const L = AR ? { days: 'أيام البوابة، من الأحد إلى السبت', pdf: 'أسابيع تقرير ساما', bar: '145 أسبوعًا، كل المدن', match: 'من 9,836 رقمًا أسبوعيًا للمدن متطابقة',
      wk: '24 إلى 30 مارس 2024', d: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'], miss: 'ينقص التقرير نحو نصف يوم السبت 30 مارس', missS: 'ينقص التقرير نحو نصف السبت', key: 'الأعمدة: أيام المدن العشر من البوابة. والمخطط: ما ليس في التقرير.', portal: 'البوابة', inPdf: 'في التقرير', tag: 'بيانات ساما الحقيقية' }
      : { days: 'The portal’s days, Sunday to Saturday', pdf: 'SAMA’s weekly PDF weeks', bar: '145 weeks, every city', match: 'of 9,836 weekly city figures agree',
      wk: '24 to 30 Mar 2024', d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], miss: 'The PDF is short by about half of Saturday 30 March', missS: 'The PDF is short by about half of Saturday', key: 'Bars: the ten cities’ days from the portal. Hatched: what the PDF leaves out.', portal: 'portal', inPdf: 'in the PDF', tag: 'Real SAMA data' };
    const la = smooth(t / 0.4);
    sc.text(L.days, pad, m.dayY - 8, { size: f, color: D.mute, a: la });
    sc.text(L.pdf, pad, m.pdfY + m.pdfH + f + 4, { size: f, color: D.mute, a: la });
    sc.text(L.tag, W - pad, pad + f - 2, { size: f - 1, color: D.mute, al: 'end' });
    const T0 = 0.45, T1 = 2.35, su = clamp((t - T0) / (T1 - T0), 0, 1), sx = su * (m.nw + 8) - 4;
    let ok = 0;
    for (let w = 0; w < m.nw; w++) {
      const x = m.x0 + w * m.cw, mu = ease((sx - w) / 4);      
      const bad = w === m.bad;
      
      for (let d = 0; d < 7; d++) {
        const y0 = m.dayY + d * (m.dq + 0.8), y = lerp(y0, m.barY + m.barH / 2 - m.dq / 2, mu);
        P.rect(x + (m.cw - m.dq) / 2, y0, m.dq, m.dq, D.ink, la * 0.24);                  
        if (mu > 0 && mu < 1) P.rect(x + (m.cw - m.dq) / 2, y, m.dq, m.dq, D.ink, la * 0.7 * (1 - smooth((mu - 0.75) / 0.25)));
      }
      
      const py = lerp(m.pdfY, m.barY, mu), ph = lerp(m.pdfH, m.barH, mu);
      P.rect(x + 0.4, m.pdfY, Math.max(1, m.cw - 0.8), m.pdfH, D.mute, la * 0.3);
      if (mu > 0 && mu < 1) P.rect(x + 0.4, py, Math.max(1, m.cw - 0.8), ph, D.mute, la * 0.6 * (1 - smooth((mu - 0.75) / 0.25)));
      
      P.rect(x + 0.4, m.barY, Math.max(1, m.cw - 0.8), m.barH, D.page, la * 0.8);
      const met = smooth((mu - 0.7) / 0.3);
      if (met > 0) P.rect(x + 0.4, m.barY, Math.max(1, m.cw - 0.8), m.barH, bad ? D.acc : D.ink, met * (bad ? 1 : 0.85));
      if (mu >= 1) ok += bad ? 0 : 1;
    }
    
    const G = S.grid; let figs = 0;
    const done = Math.floor(clamp(sx - 4, -1, m.nw - 1));
    for (const r of G.rows) { const a = r.start, b = Math.min(r.end, done); if (b >= a) figs += 2 * (b - a + 1); }
    figs -= 2 * G.miss.filter(([, w]) => w <= done).length;
    const ca = smooth((t - T0) / 0.3);
    const B = big(W) * 0.8;
    sc.text(fmtInt(Math.max(0, figs)) + ' ' + L.match, W - pad, m.barY + m.barH + f + 4, { size: f + 0.5, w: 650, a: ca, al: 'end' });
    
    const flag = smooth((sx - m.bad - 4) / 1.2);
    const bx = m.x0 + m.bad * m.cw + m.cw / 2;
    if (flag > 0) sc.text(L.wk, bx - 3, m.barY - 6, { size: f, w: 700, color: D.acc, a: flag });
    const op = smooth((t - (T1 + 0.05)) / 0.5);
    if (op > 0 && m.inH > 40) {
      const ix = pad, iw = Math.min(W - 2 * pad, W < 420 ? W - 2 * pad : W * 0.62), iy = m.inY, ih = m.inH;
      P.line([[bx, m.barY + m.barH + 1], [bx, iy - 4]], D.acc, 0.7 * op, 1, [2, 3]);
      P.rect(ix, iy, iw, ih, D.page, 0.55 * op);
      const top = iy + (W < 420 ? 2 * f + 16 : f + 12), bot = iy + ih - f - 10, bw = (iw - 24) / 7, vmax = Math.max(...m.days);
      sc.text(L.wk, ix + 10, iy + f + 4, { size: f, w: 700, color: D.acc, a: op });
      for (let d = 0; d < 7; d++) {
        const x = ix + 12 + d * bw, h = (bot - top) * m.days[d] / vmax * ease((t - T1 - 0.1 - d * 0.05) / 0.5);
        const sat = d === 6;
        if (!sat) P.rect(x + bw * 0.18, bot - h, bw * 0.64, h, D.ink, 0.85 * op);
        else {
          
          const keep = h * 0.52;
          P.rect(x + bw * 0.18, bot - keep, bw * 0.64, keep, D.ink, 0.85 * op);
          P.rect(x + bw * 0.18, bot - h, bw * 0.64, h - keep, D.acc, 0.25 * op);
          P.hatch(x + bw * 0.18, bot - h, bw * 0.64, h - keep, D.acc, 0.9 * op, 4);
          P.box(x + bw * 0.18, bot - h, bw * 0.64, h - keep, D.acc, 0.9 * op);
        }
        sc.text(L.d[d], x + bw / 2, bot + f + 3, { size: f - 1, color: sat ? D.acc : D.mute, a: op, al: 'center' });
      }
      const nx = W < 420 ? null : ix + iw + 14;
      if (nx) {
        const nn = sc.para(L.miss, nx, iy + f + 4, W - pad - nx, f + 4, { size: f, w: 650, color: D.acc, a: smooth((t - T1 - 0.5) / 0.4) });
        sc.para(L.key, nx, iy + f + 4 + nn * (f + 4) + 8, W - pad - nx, f + 3, { size: f - 1, color: D.mute, a: smooth((t - T1 - 0.6) / 0.4) });
      }
      else sc.text(L.missS, ix + 10, iy + 2 * f + 8, { size: f - 1, w: 600, color: D.acc, a: smooth((t - T1 - 0.5) / 0.4) });
    }
  },
};





const S4 = {
  dur: 3.9,
  aria: {
    en: 'The real model: fact_daily, one row per day, place and activity, joins dim_date, dim_city, dim_activity and City activity on their keys. Under it the one command, run_all.py, as a chain: pull the new week, clean with 46 checks, build the model, refresh the dashboard, check every page. A normal week passes every check and is published; if a check fails, the run stops there and the model and the dashboard stay as they were.',
    ar: 'النموذج الحقيقي: fact_daily، صف لكل يوم ومكان ونشاط، يرتبط بـ dim_date و dim_city و dim_activity و City activity عبر مفاتيحها. وتحته الأمر الواحد run_all.py سلسلةً من المراحل: سحب الأسبوع الجديد، والتنظيف مع 46 فحصًا، وبناء النموذج، وإعادة بناء اللوحة، وفحص كل صفحة. الأسبوع العادي يجتاز كل الفحوص ويُنشر، وإن فشل فحص توقف التشغيل عنده وبقي النموذج واللوحة كما كانا.',
  },
  build(W, H) {
    const pad = W < 420 ? 14 : 22, f = fs(W);
    const m = { pad, f };
    m.split = Math.round(H * (W < 420 ? 0.5 : 0.53));
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, P = pen(sc, c), f = m.f, pad = m.pad, ln = f + 5;
    const L = AR ? { grain: 'صف لكل يوم ومكان ونشاط', cmd: 'أمر واحد', stages: ['سحب الأسبوع', 'التنظيف و46 فحصًا', 'بناء النموذج', 'إعادة بناء اللوحة', 'فحص كل صفحة'],
      run1: 'أسبوع عادي', run2: 'إن فشل فحص', both: 'الأسبوع العادي يُنشر، وإن فشل فحص توقف وبقي كل شيء كما كان', pub: 'يُنشر', stop: 'يتوقف، فيبقى النموذج واللوحة كما كانا', loop: 'كل أسبوع', tag: 'النموذج الحقيقي' }
      : { grain: 'one row per day, place and activity', cmd: 'one command', stages: ['Pull the week', 'Clean, 46 checks', 'Build the model', 'Refresh the dashboard', 'Check every page'],
      run1: 'A normal week', run2: 'If a check fails', both: 'A normal week is published; if a check fails, it stops and nothing changes', pub: 'published', stop: 'it stops; the model and dashboard stay as they were', loop: 'every week', tag: 'The real model' };
    sc.text(L.tag, W - pad, pad + f - 2, { size: f - 1, color: D.mute, al: 'end' });
    
    const top = pad + f + 8, bot = m.split - 12;
    const fw = Math.min(W * 0.34, 210), fh = ln * 6 + 8, fx = (W - fw) / 2, fy = (top + bot) / 2 - fh / 2;
    const dw = Math.min(W * 0.27, 170), dh = ln * 2 + 8;
    const dims = [['dim_date', 'date_key', pad, top + 4], ['dim_city', 'city_key', pad, bot - dh], ['dim_activity', 'activity_key', W - pad - dw, top + 4], ['City activity', 'cell_key', W - pad - dw, bot - dh]];
    const keys = ['date_key', 'city_key', 'activity_key', 'cell_key'];
    const tb = (x, y, w, h, name, rows, a, fact) => {
      P.rect(x, y, w, h, fact ? D.ink : D.page, a * (fact ? 0.12 : 0.9));
      P.rect(x, y, w, ln + 3, fact ? D.ink : D.mute, a * (fact ? 0.9 : 0.35));
      c.save(); sc.text(name, x + 7, y + ln - 2, { size: f - 0.5, w: 700, color: fact ? D.surf : D.ink, a }); c.restore();
      rows.forEach(([s, key], i) => sc.text(s, x + 7, y + ln * (i + 2) - 1, { size: f - 1, w: key ? 650 : 400, color: key ? D.ink : D.mute, a }));
    };
    const fa = smooth((t - 0.1) / 0.45);
    
    const fyy = fy + (1 - ease((t - 0.1) / 0.5)) * 10;
    tb(fx, fyy, fw, fh, 'fact_daily', [...keys.map(k => [k, 1]), ['payments, value_sar', 0]], fa, true);
    dims.forEach(([name, key, x, y], i) => {
      const a = smooth((t - 0.45 - i * 0.18) / 0.4), off = (1 - ease((t - 0.45 - i * 0.18) / 0.5)) * (i < 2 ? -16 : 16);
      tb(x + off, y, dw, dh, name, [[key, 1]], a, false);
      
      const la = smooth((t - 0.75 - i * 0.18) / 0.4);
      const fyk = fyy + ln * (i + 2) - f * 0.35, dyk = y + ln * 2 - f * 0.35;
      const xa = i < 2 ? fx : fx + fw, xb = i < 2 ? x + dw : x, xm = (xa + xb) / 2;
      const pts = [[xa, fyk], [xm, fyk], [xm, dyk], [xb, dyk]];
      
      const segs = [], tot = Math.abs(xm - xa) + Math.abs(dyk - fyk) + Math.abs(xb - xm); let left = tot * ease((t - 0.75 - i * 0.18) / 0.5);
      segs.push(pts[0]);
      for (let k = 1; k < 4 && left > 0; k++) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], d = Math.abs(x1 - x0) + Math.abs(y1 - y0); const u = Math.min(1, left / Math.max(1e-6, d)); segs.push([lerp(x0, x1, u), lerp(y0, y1, u)]); left -= d; }
      P.line(segs, D.ink, 0.75 * la, 1.2);
      if (la > 0.95) { P.dot(xb + (i < 2 ? 0 : 0), dyk, 2, D.ink, la); }
    });
    sc.text(L.grain, fx + fw / 2, fyy + fh + f + 4, { size: f - 1, color: D.mute, a: smooth((t - 1.2) / 0.4), al: 'center' });
    
    const ra = smooth((t - 1.35) / 0.4);
    const cy = m.split + 6;
    P.rect(pad, cy - 2, W - 2 * pad, 1, D.mute, 0.35 * ra);
    sc.text('run_all.py', pad, cy + f + 6, { size: f + 0.5, w: 700, a: ra });
    sc.text(L.cmd, pad + sc.measure('run_all.py', { size: f + 0.5, w: 700 }) + 8, cy + f + 6, { size: f - 0.5, color: D.mute, a: ra });
    const labW = W < 420 ? 0 : Math.min(150, W * 0.22);
    const cx0 = pad + labW, cxw = (W - pad - cx0) / 5, bh = Math.max(f * 2.8, W < 420 ? 30 : 32), by = cy + f + (W < 420 ? 16 : 26);
    for (let k = 0; k < 5; k++) {
      const x = cx0 + k * cxw;
      P.rect(x + 2, by, cxw - 8, bh, D.page, ra * 0.95);
      sc.para(L.stages[k], x + 8, by + f + 2, cxw - 18, f + 1, { size: f - 1.5, w: 600, a: ra });
      if (k < 4) P.line([[x + cxw - 6, by + bh / 2], [x + cxw + 2, by + bh / 2]], D.mute, ra * 0.8, 1);
    }
    
    const lb = by - 6;
    P.line([[cx0 + 4.5 * cxw - 2, by], [cx0 + 4.5 * cxw - 2, lb], [cx0 + 0.5 * cxw, lb], [cx0 + 0.5 * cxw, by]], D.mute, 0.5 * ra, 1, [2, 3]);
    if (labW) sc.text(L.loop, cx0 + 2.5 * cxw, lb - 4, { size: f - 1.5, color: D.mute, a: ra, al: 'center' });
    
    const runs = [[L.run1, 5, false], [L.run2, 2, true]];
    runs.forEach(([name, n, fail], j) => {
      const ry = labW ? by + bh + f + 8 + j * (f * 2 + 22) : by + bh + f + 2 + j * (f + 10), R0 = 1.75 + j * 0.95;
      const a = smooth((t - R0 + 0.2) / 0.3);
      if (labW) sc.text(name, pad, ry + f * 0.4, { size: f - 1, color: fail ? D.acc : D.ink, a, w: 600 });
      for (let k = 0; k < n; k++) {
        const ka = smooth((t - R0 - k * 0.16) / 0.15), x = cx0 + k * cxw + (cxw - 6) / 2;
        if (fail && k === n - 1) P.cross(x, ry, f * 1.0, D.acc, ka);
        else P.tick(x, ry, f * 1.0, D.ink, ka);
      }
      if (fail) for (let k = n; k < 5; k++) { const x = cx0 + k * cxw + (cxw - 6) / 2; P.rect(x - f * 0.35, ry - 0.5, f * 0.7, 1.4, D.mute, 0.6 * smooth((t - R0 - n * 0.16) / 0.3)); }
      const ea = smooth((t - R0 - n * 0.16 - 0.05) / 0.3);
      const msg = fail ? L.stop : L.pub;
      if (!labW && fail) sc.para(L.both, pad, ry + f + 6, W - 2 * pad, f + 1, { size: f - 1.5, color: D.acc, a: ea });
      else if (labW) sc.para(msg, pad, ry + f + 6, labW - 10, f + 2, { size: f - 1.5, color: fail ? D.acc : D.mute, a: ea });
    });
  },
};





const PAGES = [
  ['Home', 'الرئيسية', [[0, 0, .36, .62, 'card'], [.38, 0, .62, .62, 'map'], [0, .66, 1, .34, 'bars']]],
  ['Summary', 'الملخص', [[0, 0, .24, .2, 'kpi'], [.25, 0, .24, .2, 'kpi'], [.5, 0, .24, .2, 'kpi'], [.75, 0, .25, .2, 'kpi'], [0, .24, .6, .76, 'line'], [.62, .24, .38, .76, 'bars']]],
  ['Cities', 'المدن', [[0, 0, .45, .7, 'map'], [.47, 0, .53, .7, 'curve'], [0, .74, 1, .26, 'table']]],
  ['Activities', 'الأنشطة', [[0, 0, .48, 1, 'scatter'], [.5, 0, .5, 1, 'tree']]],
  ['City × activity', 'المدن × الأنشطة', [[0, 0, .3, 1, 'table'], [.32, 0, .4, 1, 'bars'], [.74, 0, .26, 1, 'line']]],
  ['Key dates', 'المواسم', [[0, 0, 1, .42, 'line'], [0, .46, .4, .54, 'map'], [.42, .46, .58, .54, 'table']]],
  ['Long-term', 'على المدى الطويل', [[0, 0, .64, .62, 'bars'], [.66, 0, .34, .62, 'donut'], [0, .66, 1, .34, 'table']]],
  ['Forecast', 'التوقعات', [[0, 0, .24, .2, 'kpi'], [.25, 0, .24, .2, 'kpi'], [0, .24, 1, .44, 'band'], [0, .72, 1, .28, 'bars']]],
  ['About', 'عن البيانات', [[0, 0, .6, 1, 'text'], [.62, 0, .38, .5, 'card'], [.62, .54, .38, .46, 'text']]],
];
const S5 = {
  dur: 5.5,
  aria: {
    en: 'The dashboard: its nine pages drawn as wireframes in its night look, one after another (Home, Summary, Cities, Activities, City × activity, Key dates, Long-term, Forecast, About), then the same page in Arabic, mirrored from inside; then the spending tree opens along one path: the kingdom, SAR 736.7 billion in the last 52 weeks, its 13 regions and the cities outside the 60, the ten cities of the Riyadh region, and the 19 activities of the city of Riyadh.',
    ar: 'اللوحة: صفحاتها التسع مرسومة هياكلَ بمظهرها الليلي، واحدة بعد أخرى (الرئيسية، الملخص، المدن، الأنشطة، المدن × الأنشطة، المواسم، على المدى الطويل، التوقعات، عن البيانات)، ثم الصفحة نفسها بالإنجليزية، معكوسة من الداخل؛ ثم تنفتح شجرة الإنفاق على مسار واحد: المملكة، 736.7 مليار ريال في آخر 52 أسبوعًا، ومناطقها الثلاث عشرة والمدن خارج الستين، ومدن منطقة الرياض العشر، وأنشطة مدينة الرياض التسعة عشر.',
  },
  build(W, H) {
    const pad = W < 420 ? 12 : 20, f = fs(W);
    return { pad, f };
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, f = m.f, pad = m.pad;
    const T = S.tree;
    
    const fx = pad, fy = pad + f + 8, fw = W - 2 * pad, fh = H - fy - pad;
    const flip0 = 2.95, flip1 = 3.35, back0 = 3.75, back1 = 4.05, tree0 = 4.1;
    const nP = PAGES.length, per = (flip0 - 0.25) / nP;
    const pi = t < flip0 ? clamp(Math.floor((t - 0.25) / per), 0, nP - 1) : 4;
    
    const fu = clamp((t - flip0) / (flip1 - flip0), 0, 1), bu = clamp((t - back0) / (back1 - back0), 0, 1);
    const sx = Math.abs(Math.cos(Math.PI * (bu > 0 ? bu : fu))), other = fu >= 0.5 && bu < 0.5;
    const rtl = AR !== other;                                 
    const cx = fx + fw / 2;
    
    const Xf = x => { const lx = rtl ? fx + fw - (x - fx) : x; return cx + (lx - cx) * sx; };
    const rect = (x, y, w, h, col, a) => { if (a <= 0.002 || w <= 0 || h <= 0) return; const xa = Xf(x), xb = Xf(x + w); c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.fillRect(Math.min(xa, xb), y, Math.abs(xb - xa), h); };
    const txt = (s, x, y, o) => {
      
      if (sx < 0.35) return;
      c.save(); c.globalAlpha = (o.a == null ? 1 : o.a) * smooth((sx - 0.35) / 0.3); c.fillStyle = o.color || D.ink;
      c.font = `${o.w || 500} ${o.size}px ${K.FACE}`; c.direction = rtl ? 'rtl' : 'ltr'; c.textBaseline = 'alphabetic';
      const al = o.al || 'start'; c.textAlign = al === 'center' ? 'center' : ((al === 'start') !== rtl ? 'left' : 'right');
      let str = rtl && AR ? K.arDigits(s) : s;
      if (o.maxW) { while (str.length > 2 && c.measureText(str).width > o.maxW) str = str.slice(0, -2); if (str !== s && str !== K.arDigits(s)) str = str.replace(/[\s,&]+$/, '') + '…'; }
      const xx = Xf(x); c.translate(xx, y); c.scale(sx, 1); c.fillText(str, 0, 0); c.restore();
    };
    const a0 = smooth(t / 0.4);
    
    const L = AR ? { title: 'الإنفاق بالبطاقات في السعودية', tree: 'شجرة الإنفاق', king: 'المملكة', bn: 'مليار ريال', flip: 'والصفحة نفسها بالإنجليزية', tag: 'اللوحة الحقيقية' }
      : { title: 'Saudi card spending', tree: 'The spending tree', king: 'Kingdom', bn: 'SAR bn', flip: 'The same page in Arabic, right to left', tag: 'The real dashboard' };
    const nameNow = t < tree0 ? (rtl ? PAGES[pi][1] : PAGES[pi][0]) : L.tree;
    sc.text(t < flip0 ? String(pi + 1) + ' / 9  ' + (AR ? PAGES[pi][1] : PAGES[pi][0]) : t < back1 ? L.flip : L.tree, pad, pad + f, { size: f, w: 650, a: a0 });
    sc.text(L.tag, W - pad, pad + f, { size: f - 1, color: D.mute, al: 'end', a: a0 });
    
    rect(fx, fy, fw, fh, '#141311', a0);
    const nav = Math.max(f + 12, fh * 0.11);
    rect(fx, fy, fw, nav, D.page, a0 * 0.9);
    txt(rtl ? 'الإنفاق بالبطاقات' : 'Card spending', fx + 10, fy + nav / 2 + f * 0.35, { size: f - 0.5, w: 700, a: a0 });
    
    const tabX0 = fx + Math.min(fw * 0.3, 150), tabW = (fx + fw - 8 - tabX0) / nP;
    for (let k = 0; k < nP; k++) {
      const x = tabX0 + k * tabW, on = t < tree0 ? k === pi : k === 4;
      rect(x + 2, fy + nav * 0.25, tabW - 4, nav * 0.5, on ? D.ink : D.mute, a0 * (on ? 0.8 : 0.18));
    }
    
    const px = fx + 10, py = fy + nav + 10, pw = fw - 20, ph = fh - nav - 20;
    if (t < tree0) {
      const pg = PAGES[pi][2], pa = a0 * (t < 0.25 ? 0 : 1);
      const fl = (t - 0.25) / per - pi;                                       
      const ins = t < flip0 ? smooth(fl / 0.22) : 1;
      txt(rtl ? PAGES[pi][1] : PAGES[pi][0], px, py + f, { size: f + 1, w: 700, a: pa * ins });
      const by0 = py + f + 10, bh0 = ph - f - 10;
      pg.forEach(([x, y, w, h, kind], j) => {
        const bx = px + x * pw, byy = by0 + y * bh0, bw = w * pw - 6, bh = h * bh0 - 6, a = pa * smooth(ins * 1.4 - j * 0.12);
        rect(bx, byy, bw, bh, D.page, a * 0.95);
        const ia = a * 0.55;
        if (kind === 'kpi' || kind === 'card') { rect(bx + 8, byy + 8, bw * 0.4, Math.min(5, bh * 0.12), D.mute, ia); rect(bx + 8, byy + 18, bw * 0.6, Math.min(12, bh * 0.25), D.ink, ia); }
        if (kind === 'bars') { const n = 12; for (let q = 0; q < n; q++) { const hh = bh * (0.25 + 0.6 * ((Math.sin(q * 1.7 + j) + 1) / 2)) * 0.8; rect(bx + 8 + q * (bw - 16) / n, byy + bh - 6 - hh, (bw - 16) / n - 3, hh, D.ink, ia); } }
        if (kind === 'line' || kind === 'band' || kind === 'curve') {
          c.globalAlpha = ia; c.strokeStyle = D.ink; c.lineWidth = 1.2; c.beginPath();
          for (let q = 0; q <= 40; q++) { const u = q / 40, yy = kind === 'curve' ? byy + bh - 8 - (bh - 16) * Math.sqrt(u) : byy + bh * 0.55 + Math.sin(u * 13 + j) * bh * 0.16 - u * bh * 0.12; const xx = Xf(bx + 8 + u * (bw - 16)); q ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
          c.stroke();
          if (kind === 'band') rect(bx + bw * 0.7, byy + bh * 0.2, bw * 0.28, bh * 0.6, D.ink, ia * 0.25);
        }
        if (kind === 'map') { c.globalAlpha = ia; c.fillStyle = D.ink; for (let q = 0; q < 14; q++) { const u = ((q * 37) % 14) / 14, v = ((q * 53) % 11) / 11; c.beginPath(); c.arc(Xf(bx + bw * (0.2 + 0.6 * u)), byy + bh * (0.2 + 0.6 * v), 1.5 + (q % 4), 0, 6.2832); c.fill(); } }
        if (kind === 'table') for (let q = 0; q < Math.floor((bh - 10) / 8); q++) rect(bx + 8, byy + 8 + q * 8, (bw - 16) * (q % 2 ? 0.8 : 1), 2, D.ink, ia * 0.7);
        if (kind === 'scatter') { c.globalAlpha = ia; c.fillStyle = D.ink; for (let q = 0; q < 19; q++) { c.beginPath(); c.arc(Xf(bx + bw * (0.1 + 0.8 * ((q * 29) % 19) / 19)), byy + bh * (0.15 + 0.7 * ((q * 13) % 17) / 17), 2 + (q % 5), 0, 6.2832); c.fill(); } }
        if (kind === 'tree') { rect(bx + 6, byy + 6, bw * 0.55 - 8, bh * 0.6 - 8, D.ink, ia * 0.45); rect(bx + bw * 0.55, byy + 6, bw * 0.45 - 6, bh * 0.35 - 8, D.ink, ia * 0.3); rect(bx + 6, byy + bh * 0.6, bw * 0.4, bh * 0.4 - 6, D.ink, ia * 0.25); rect(bx + bw * 0.55, byy + bh * 0.35, bw * 0.45 - 6, bh * 0.65 - 6, D.ink, ia * 0.38); }
        if (kind === 'donut') { c.globalAlpha = ia; c.strokeStyle = D.ink; c.lineWidth = Math.min(bw, bh) * 0.12; c.beginPath(); c.arc(Xf(bx + bw / 2), byy + bh / 2, Math.min(bw, bh) * 0.3, 0, 4.6); c.stroke(); }
        if (kind === 'text') for (let q = 0; q < Math.floor((bh - 10) / 9); q++) rect(bx + 8, byy + 8 + q * 9, (bw - 16) * (q % 4 === 3 ? 0.5 : 0.92), 2, D.mute, ia * 0.8);
      });
    } else {
      
      const ta = smooth((t - tree0) / 0.3);
      txt(rtl ? 'المدن × الأنشطة' : 'City × activity', px, py + f, { size: f + 1, w: 700, a: ta });
      const top = py + f + 12, hh = ph - f - 12, colG = 10, colW = (pw - 3 * colG) / 4;
      const cols = [[[L.king, T.kingdom]].map(([n, v]) => [n, n, v]), T.regions, T.cities, T.acts];
      const pick = [0, 0, 0, -1];
      cols.forEach((rows, ci) => {
        const ca = smooth((t - tree0 - 0.1 - ci * 0.28) / 0.3); if (ca <= 0) return;
        const x = px + ci * (colW + colG), n = rows.length, rh = Math.min(hh / n, ci === 0 ? 46 : 24), vmax = Math.max(...rows.map(r => r[2]));
        const y0 = ci === 0 ? top + hh * 0.38 : top;
        rows.forEach(([en, ar, v], k) => {
          const y = y0 + k * rh, on = pick[ci] === k, ra = ca * smooth((t - tree0 - 0.1 - ci * 0.28 - k * 0.012) / 0.2);
          rect(x, y + 1, colW, rh - 2, on ? D.ink : D.page, ra * (on ? 0.2 : 0.9));
          rect(x, y + rh - 4, colW * v / vmax, 2.2, D.ink, ra * (on ? 1 : 0.7));
          if (rh >= f + 1) txt(ci === 0 ? (rtl ? 'المملكة' : 'Kingdom') : (rtl ? ar : en), x + 5, y + Math.min(rh - 5, f * 0.95 + 1), { size: Math.min(f - 1.5, rh - 3), w: on ? 700 : 500, color: D.ink, a: ra, maxW: colW - 10 });
          if (ci === 0 && rh > f * 2.6) txt(K.fmtInt ? (rtl ? v + ' مليار ريال' : 'SAR ' + v + 'bn') : '', x + 5, y + f * 2.2 + 2, { size: f - 1.5, color: D.mute, a: ra });
        });
        
        if (ci < 3) {
          const ny = (ci + 1 === 3 ? top : top), la = smooth((t - tree0 - 0.1 - (ci + 1) * 0.28) / 0.3);
          const yA = y0 + pick[ci] * rh + rh / 2;
          c.globalAlpha = 0.7 * la; c.strokeStyle = D.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(Xf(x + colW), yA); c.lineTo(Xf(x + colW + colG), ny + 6); c.stroke();
        }
      });
    }
  },
};

K.STEPS.sama = [S1, S2, S3, S4, S5];
})();
