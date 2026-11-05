






(() => {
'use strict';
const K = window.KIT, AR = K.AR, D = K.DARK;
const { clamp, smooth } = K;
const T = (en, ar) => AR ? ar : en;


function geo(W, H) {
  const sf = clamp(W / 704, 0.4, 1.28), mn = W < 420 ? 10.5 : 11;
  return { W, H, sf, narrow: W < 560, pad: Math.round(clamp(W * 0.042, 14, 34)), f: z => Math.max(mn, Math.round(z * sf * 10) / 10) };
}
const R = (sc, c, x, y, w, h) => c.fillRect(AR ? sc.W - x - w : x, y, w, h);
const SR = (sc, c, x, y, w, h) => c.strokeRect(Math.round(AR ? sc.W - x - w : x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
function latin(sc, c, parts, x, y, size, o = {}) {
  c.font = `${o.w || 500} ${size}px "Switzer", sans-serif`;
  try { c.fontStretch = 'normal'; } catch (e) {}
  c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const ws = parts.map(p => c.measureText(p[0]).width), tot = ws.reduce((a, b) => a + b, 0);
  if (o.measure) return tot;
  let lx = o.al === 'end' ? (AR ? sc.W - x : x - tot) : o.al === 'center' ? (AR ? sc.W - x : x) - tot / 2 : (AR ? sc.W - x - tot : x);
  parts.forEach((p, i) => { c.globalAlpha = (p[2] == null ? 1 : p[2]) * (o.a == null ? 1 : o.a); c.fillStyle = p[1] || D.ink; c.fillText(p[0], lx, y); lx += ws[i]; });
  c.globalAlpha = 1;
  return tot;
}
const LWd = (sc, c, s, size, w) => latin(sc, c, [[s]], 0, 0, size, { measure: true, w });

function lfit(sc, c, s, maxW, size, w) {
  let z = size; while (z > size * 0.8 && LWd(sc, c, s, z, w) > maxW) z -= 0.5;
  let o = s; while (o.length > 3 && LWd(sc, c, o, z, w) > maxW) o = o.slice(0, -2) + '…';
  return [o, z];
}
function fitW(sc, s, maxW, o) { if (sc.measure(s, o) <= maxW) return s; while (s.length > 2 && sc.measure(s + '…', o) > maxW) s = s.slice(0, -1); return s + '…'; }
function tick(sc, c, x, y, s, col, a) {
  const L = AR ? sc.W - x - s : x;
  c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(L, y); c.lineTo(L + s * 0.35, y + s * 0.35); c.lineTo(L + s, y - s * 0.45); c.stroke(); c.lineCap = 'butt';
}
function note(sc, g) { sc.text(T('Illustrative data', 'بيانات توضيحية'), g.pad, sc.H - Math.round(g.pad * 0.6), { size: g.f(11), color: D.mute }); }
function header(sc, g, a, b, al) {
  const p = g.pad;
  sc.text(a, p, p + g.f(15), { size: g.f(15), w: 700, a: al });
  sc.para(b, p, p + g.f(15) + g.f(12) + 7, sc.W - 2 * p, Math.round(g.f(12) * 1.35), { size: g.f(12), color: D.mute, a: al });
}
const fade = (t, a, d) => smooth((t - a) / (d || 0.3));
const top0 = (g, extra) => g.pad + g.f(15) + g.f(12) * (g.narrow ? 2.4 : 1) + (extra || 30);


const SL = [0.55, 0.6, 0.57, 0.66, 0.63, 0.7, 0.68, 0.74, 0.71, 0.78];
const SO = [[0.2, 0.12, 0.1, 0.16, 0.4, 0.58, 0.62, 0.64, 0.66, 0.7, 0.82, 0.9, 0.7, 0.4], [0.18, 0.11, 0.09, 0.14, 0.34, 0.5, 0.55, 0.57, 0.6, 0.63, 0.72, 0.78, 0.62, 0.35]];
function mini(sc, c, kind, b, u, a) {
  const X = x => sc.X(x);
  const path = (vals, lo, hi, n) => {
    c.beginPath();
    const pts = vals.map((v, k) => [b.x + b.w * k / (vals.length - 1), b.y + b.h - (v - lo) / (hi - lo) * b.h]);
    const last = n * (pts.length - 1), fl = Math.floor(last);
    pts.slice(0, fl + 1).forEach(([x, y], k) => k ? c.lineTo(X(x), y) : c.moveTo(X(x), y));
    if (fl < pts.length - 1) { const [x1, y1] = pts[fl], [x2, y2] = pts[fl + 1], q = last - fl; c.lineTo(X(x1 + (x2 - x1) * q), y1 + (y2 - y1) * q); }
  };
  c.globalAlpha = a * 0.6; c.fillStyle = D.mute; R(sc, c, b.x, b.y + b.h, b.w, 1);
  if (kind !== 'pie' && kind !== 'stacked') R(sc, c, b.x, b.y, 1, b.h);
  c.lineJoin = 'round';
  if (kind === 'line') { c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = 2; path(SL, 0.45, 0.85, u); c.stroke(); }
  else if (kind === 'overlay') {
    c.save(); c.globalAlpha = a * 0.9; c.strokeStyle = D.mute; c.lineWidth = 1.3; c.setLineDash([4, 3]); path(SO[1], 0, 1, u); c.stroke(); c.restore();
    c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = 2; path(SO[0], 0, 1, u); c.stroke();
  } else if (kind === 'area') {
    R(sc, c, b.x + b.w - 1, b.y, 1, b.h);
    c.save(); c.beginPath(); c.rect(Math.min(X(b.x), X(b.x + b.w * u)), b.y - 2, b.w * u, b.h + 4); c.clip();
    const A = [0.3, 0.36, 0.34, 0.42, 0.46, 0.44, 0.52, 0.56, 0.54, 0.6];
    c.globalAlpha = a * 0.3; c.fillStyle = D.ink; c.beginPath(); c.moveTo(X(b.x), b.y + b.h);
    A.forEach((v, k) => c.lineTo(X(b.x + b.w * k / 9), b.y + b.h - v / 0.7 * b.h)); c.lineTo(X(b.x + b.w), b.y + b.h); c.closePath(); c.fill(); c.restore();
    c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = 2; path([0.5, 0.46, 0.55, 0.48, 0.52, 0.44, 0.47, 0.42, 0.45, 0.4], 0.2, 0.7, u); c.stroke();
    c.globalAlpha = a * 0.7; c.fillStyle = D.mute;
    for (let k = 1; k <= 3; k++) { const y = b.y + b.h * (1 - k / 4); R(sc, c, b.x - 4, y, 4, 1); R(sc, c, b.x + b.w, y, 4, 1); }
  } else if (kind === 'pie') {
    const r = Math.min(b.w, b.h) * 0.46, cx = b.x + b.w / 2, cy = b.y + b.h / 2, lw = Math.max(4, r * 0.32);
    c.globalAlpha = a * 0.5; c.strokeStyle = D.mute; c.lineWidth = lw; c.beginPath(); c.arc(X(cx), cy, Math.max(0.5, r - lw / 2), 0, 6.2832); c.stroke();
    c.globalAlpha = a; c.strokeStyle = D.ink; c.beginPath(); c.arc(X(cx), cy, Math.max(0.5, r - lw / 2), -Math.PI / 2, -Math.PI / 2 + (AR ? -1 : 1) * 6.2832 * 0.86 * u, AR); c.stroke();
  } else if (kind === 'stacked') {
    const S = [[0.18, 0.32], [0.16, 0.31], [0.15, 0.3], [0.14, 0.28], [0.13, 0.27], [0.12, 0.26]], bw = b.w / S.length;
    S.forEach(([p1, p2], k) => {
      const uk = clamp(u * 1.4 - k * 0.07, 0, 1), x = b.x + k * bw + bw * 0.16, w = bw * 0.68, h = b.h * uk, y1 = b.y + b.h;
      c.globalAlpha = a; c.fillStyle = '#6b665d'; R(sc, c, x, y1 - h * p1, w, h * p1); c.fillStyle = D.mute; R(sc, c, x, y1 - h * p2, w, h * (p2 - p1)); c.fillStyle = D.ink; R(sc, c, x, y1 - h, w, h * (1 - p2));
    });
  }
}


const S1 = {
  dur: 3.4,
  aria: { en: 'Illustrative data: a PowerPoint slide in the deck’s own design, with four empty chart placeholders. One after another each placeholder gets a short id as its title, C01 to C04; the engine will look only for those ids, and the design stays the template’s.',
          ar: 'بيانات توضيحية: شريحة PowerPoint بتصميم العرض نفسه، فيها أربعة أماكن محجوزة فارغة للرسوم. يأخذ كل مكان بدوره مُعرّفًا قصيرًا عنوانًا له، من C01 إلى C04؛ فالمحرّك لا يبحث إلا عن هذه المُعرّفات، ويبقى التصميم للقالب.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12);
    header(sc, g, T('The chart’s title is its id', 'عنوان الرسم هو مُعرّفه'), T('the engineer places each chart in PowerPoint and names it; the design stays the template’s', 'يضع المهندس كل رسم في PowerPoint ويسمّيه، ويبقى التصميم للقالب'), sk);
    const bot = H - p - g.f(11) - small - 26;
    const paneW = g.narrow ? 0 : (W - 2 * p) * 0.28, gap = g.narrow ? 0 : 26 * g.sf;
    const aw = W - 2 * p - paneW - gap, ah = bot - m.top - small - 14, sw = Math.min(aw, ah * 16 / 9), sh = Math.min(ah, sw * 0.75), sx = p, sy = m.top;
    c.globalAlpha = sk; c.fillStyle = D.page; R(sc, c, sx, sy, sw, sh);
    
    sc.text(T('Region A · daily KPIs', 'المنطقة أ · مؤشرات يومية'), sx + 14, sy + small + 12, { size: small + 1, w: 700, a: sk });
    c.globalAlpha = sk * 0.5; c.fillStyle = D.mute; R(sc, c, sx + 14, sy + small + 22, sw - 28, 1); R(sc, c, sx, sy + sh - 6, sw, 6);
    const ip = 14, th = small + 34, gg = 12, pw = (sw - 2 * ip - gg) / 2, ph = (sh - th - ip - gg - 6) / 2;
    const ids = ['C01', 'C02', 'C03', 'C04'];
    ids.forEach((id, i) => {
      const x = sx + ip + (i % 2) * (pw + gg), y = sy + th + Math.floor(i / 2) * (ph + gg), at = 0.5 + i * 0.55, u = fade(t, at, 0.3);
      c.save(); c.globalAlpha = sk * 0.8; c.strokeStyle = u > 0.5 ? D.ink : D.mute; c.lineWidth = u > 0.5 ? 1.4 : 1; c.setLineDash(u > 0.5 ? [] : [4, 3]); SR(sc, c, x, y, pw, ph); c.restore();
      
      for (let k = 0; k < 4; k++) { c.globalAlpha = sk * 0.18; c.fillStyle = D.ink; const bh = ph * (0.25 + 0.12 * ((k * 5 + i) % 4)); R(sc, c, x + pw * (0.2 + k * 0.17), y + ph - 8 - bh, pw * 0.1, bh); }
      
      const n = Math.round(clamp((t - at) / 0.3, 0, 1) * id.length);
      if (n > 0) latin(sc, c, [[id.slice(0, n), D.ink]], x + pw / 2, y + ph * 0.42, g.f(16), { w: 750, al: 'center', a: sk });
      if (n > 0 && n < id.length) { c.globalAlpha = sk; c.fillStyle = D.ink; const lw = LWd(sc, c, id.slice(0, n), g.f(16), 750); R(sc, c, x + pw / 2 + lw / 2 + 2, y + ph * 0.42 - g.f(16) * 0.8, 1.5, g.f(16)); }
      
      if (!g.narrow) {
        const py = sy + small + 28 + i * (small * 2.4), done = fade(t, at + 0.3, 0.2);
        latin(sc, c, [['Chart ' + (i + 1), D.mute, 1 - done]], W - p - paneW + 10, py, small, { w: 500, a: sk });
        latin(sc, c, [[id, D.ink, done]], W - p - paneW + 10, py, small, { w: 750, a: sk });
        tick(sc, c, W - p - 22, py - small * 0.4, 10, D.ink, sk * done);
      }
    });
    if (!g.narrow) {
      sc.text(T('Chart titles', 'عناوين الرسوم'), W - p - paneW, sy + small, { size: small, w: 700, color: D.mute, a: sk });
      c.globalAlpha = sk * 0.35; c.fillStyle = D.page; R(sc, c, W - p - paneW, sy + small + 10, paneW, sh - small - 10);
    }
    sc.text(T('Only the ids matter to the engine', 'المحرّك لا يهتم إلا بالمُعرّفات'), p, sy + sh + small + 16, { size: small, w: 700, a: sk * fade(t, 2.7, 0.35) });
    note(sc, g);
  },
};


const CH = [['C01', 'Line', 'day', 'Region A', 'E01', '', ''], ['C02', 'Overlay', 'hour', 'Region A', 'E02', '', ''],
            ['C03', 'Stacked Bar', 'day', 'A; B', 'E03;E04;E05', '', ''], ['C05', 'Line-Area', 'day', 'Region B', 'E06;E07', 'E06', 'E07']];
const EQ = [['E01', '100 * `CS_OK` / `CS_ATT`', 'Call setup %'], ['E02', '`DL_GB` + `UL_GB`', 'Data, GB'], ['E06', '`DL_GB` + `UL_GB`', 'Traffic, GB'], ['E07', '100 * `DROPS` / `CS_OK`', 'Drop rate %']];
const S2 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: the settings file has two sheets. The first, one row per chart: chart_id, chart_type, time_axis, objects, equation_id, primary and secondary, for example C05, Line-Area, day, Region B, equations E06 and E07 with E06 on the primary axis and E07 on the secondary. The second sheet holds each equation’s id, formula and legend name. The real final file held 47 charts and 52 equations.',
          ar: 'بيانات توضيحية: في ملف الإعدادات ورقتان. الأولى صف لكل رسم: chart_id و chart_type و time_axis و objects و equation_id و primary و secondary، مثل C05 بنوع Line-Area يوميًا للمنطقة ب، بالمعادلتين E06 على المحور الأساسي و E07 على الثانوي. وفي الورقة الثانية مُعرّف كل معادلة وصيغتها واسمها في مفتاح الرسم. وكان في الملف النهائي الحقيقي 47 رسمًا و 52 معادلة.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g, 36) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12), cf = g.f(11);
    header(sc, g, T('Two sheets: the charts and the equations', 'ورقتان: الرسوم والمعادلات'), T('one row per chart; its equations by id on the second sheet', 'صف لكل رسم، ومعادلاته بمُعرّفاتها في الورقة الثانية'), sk);
    const bot = H - p - g.f(11) - small - 28, nar = g.narrow;
    
    const rhm = Math.min(small * 2.5, (bot - m.top - small - 18) / (CH.length + EQ.length + 2));
    const w1 = W - 2 * p, h1 = rhm * (CH.length + 1) + 8, x2 = p, y2 = m.top + h1 + small + 20, w2 = W - 2 * p, h2 = rhm * (EQ.length + 1) + 8;
    
    latin(sc, c, [['charts', D.ink]], p, m.top - 8, small, { w: 700, a: sk });
    latin(sc, c, [['equations', D.ink]], x2, y2 - 8, small, { w: 700, a: sk * fade(t, 1.2, 0.3) });
    c.globalAlpha = sk * 0.55; c.fillStyle = D.page; R(sc, c, p, m.top, w1, h1);
    c.globalAlpha = sk * 0.55 * fade(t, 1.2, 0.3); R(sc, c, x2, y2, w2, h2);
    const cols1 = nar ? [['chart_id', 0.03], ['chart_type', 0.24], ['time_axis', 0.52], ['equation_id', 0.72]] :
                        [['chart_id', 0.02], ['chart_type', 0.15], ['time_axis', 0.33], ['objects', 0.47], ['equation_id', 0.63], ['primary', 0.82], ['secondary', 0.91]];
    const idx = nar ? [0, 1, 2, 4] : [0, 1, 2, 3, 4, 5, 6];
    const rh1 = rhm;
    cols1.forEach(([n, x], k) => { const nx = k + 1 < cols1.length ? cols1[k + 1][1] : 1, [s, z] = lfit(sc, c, n, w1 * (nx - x) - 6, cf - 0.5, 600); latin(sc, c, [[s, D.mute]], p + w1 * x, m.top + rh1 * 0.62, z, { w: 600, a: sk }); });
    CH.forEach((r, i) => {
      const y = m.top + rh1 * (i + 1.62), u = fade(t, 0.3 + i * 0.2, 0.25);
      idx.forEach((j, k) => {
        const x = cols1[k][1], nx = k + 1 < cols1.length ? cols1[k + 1][1] : 1, v = r[j]; if (!v) return;
        const [s, z] = lfit(sc, c, v, w1 * (nx - x) - 6, cf, j === 0 ? 700 : 500);
        latin(sc, c, [[s, D.ink]], p + w1 * x, y, z, { w: j === 0 ? 700 : 500, a: sk * u });
      });
    });
    const rh2 = rhm, cols2 = [['equation_id', 0.03], ['formula', 0.22], ['legend_name', 0.74]];
    const ea = fade(t, 1.2, 0.3);
    cols2.forEach(([n, x], k) => { if (nar && k === 2) return; const nx = k + 1 < cols2.length && !(nar && k === 1) ? cols2[k + 1][1] : 1; const [s, z] = lfit(sc, c, n, w2 * (nx - x) - 6, cf - 0.5, 600); latin(sc, c, [[s, D.mute]], x2 + w2 * x, y2 + rh2 * 0.62, z, { w: 600, a: sk * ea }); });
    EQ.forEach((r, i) => {
      const y = y2 + rh2 * (i + 1.62), u = fade(t, 1.4 + i * 0.2, 0.25);
      latin(sc, c, [[r[0], D.ink]], x2 + w2 * 0.03, y, cf, { w: 700, a: sk * u });
      const fw = (nar ? 0.76 : 0.5) * w2, [s, z] = lfit(sc, c, r[1], fw, cf, 500);
      latin(sc, c, [[s, D.ink]], x2 + w2 * 0.22, y, z, { w: 500, a: sk * u });
      if (!nar) { const [s2, z2] = lfit(sc, c, r[2], w2 * 0.24, cf, 500); latin(sc, c, [[s2, D.mute]], x2 + w2 * 0.74, y, z2, { w: 500, a: sk * u }); }
    });
    
    const la = fade(t, 2.3, 0.35);
    if (la > 0) {
      const ry = m.top + rh1 * (3 + 1.62), x0 = p + w1 * (nar ? 0.72 : 0.63);
      c.globalAlpha = sk * la; c.strokeStyle = D.ink; c.lineWidth = 1.3; SR(sc, c, p + 3, ry - cf - 4, w1 - 6, cf + 10);
      [2, 3].forEach(i => { const y = y2 + rh2 * (i + 1.62); SR(sc, c, x2 + 3, y - cf - 4, w2 - 6, cf + 10); });
      void x0;
    }
    const fa = fade(t, 2.8, 0.35);
    sc.text(T('The real final file: 47 charts, 52 equations', 'الملف النهائي الحقيقي: 47 رسمًا و 52 معادلة'), p, Math.min(bot + small + 12, y2 + h2 + small + 16), { size: small, w: 700, a: sk * fa });
    note(sc, g);
  },
};


const KP = [[['01 Jun', '1 يونيو'], 412060, 416210], [['02 Jun', '2 يونيو'], 398540, 402990], [['03 Jun', '3 يونيو'], 455130, 461980], [['04 Jun', '4 يونيو'], 431720, 436050]];
const S3 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: the daily KPI table, prepared from the network exports, with a day, a site group and about 70 KPI columns for 2G to 5G. The formula 100 * CS_OK / CS_ATT is worked out on every row for Region A and gives a new column: 99.00, 98.90, 98.52 and 99.01. A formula that is only one KPI name, such as DL_GB, is copied as it is.',
          ar: 'بيانات توضيحية: جدول المؤشرات اليومي المُعَدّ من ملفات الشبكة، فيه اليوم ومجموعة المواقع ونحو 70 عمودًا من المؤشرات من 2G إلى 5G. تُحسب الصيغة 100 * CS_OK / CS_ATT على كل صف للمنطقة أ فتعطي عمودًا جديدًا: 99.00 و 98.90 و 98.52 و 99.01. والصيغة التي ليست إلا اسم مؤشر واحد، مثل DL_GB، تُنسخ كما هي.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g, 46) }; },
  draw(sc, c, m, t) {
    
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(13), cf = g.f(g.narrow ? 11.5 : 14), nar = g.narrow;
    header(sc, g, T('Each formula, worked out on the data', 'كل صيغة تُحسب على البيانات'), T('the daily and hourly KPI tables: a time, a site group and about 70 KPI columns, 2G to 5G', 'جدولا المؤشرات اليومي وبالساعة: وقت، ومجموعة مواقع، ونحو 70 عمودًا من المؤشرات من 2G إلى 5G'), sk);
    
    const fy = m.top - 6, fa = fade(t, 0.3, 0.3);
    const fw = latin(sc, c, [['E01 = ', D.mute], ['100 * ', D.ink], ['`CS_OK`', D.ink], [' / ', D.ink], ['`CS_ATT`', D.ink]], p, fy, g.f(nar ? 13 : 15), { w: 650, a: sk * fa });
    void fw;
    const bot0 = H - p - g.f(11) - small * 2 - 30, ty = m.top + 10, rh0 = Math.min(cf * 4, (bot0 - ty - 10) / (KP.length + 1.4)), th = rh0 * (KP.length + 1.4) + 10, bot = ty + th;
    c.globalAlpha = sk * 0.55; c.fillStyle = D.page; R(sc, c, p, ty, W - 2 * p, th);
    const cols = nar ? [0.04, 0.3, 0.56, 0.8] : [0.03, 0.17, 0.36, 0.55, 0.76];
    const heads = nar ? [[T('Day', 'اليوم')], ['CS_OK', 1], ['CS_ATT', 1], [T('Result', 'الناتج')]] : [[T('Day', 'اليوم')], [T('Group', 'المجموعة')], ['CS_OK', 1], ['CS_ATT', 1], [T('Result', 'الناتج')]];
    const rh = rh0, hy = ty + rh * 0.7;
    heads.forEach(([h, lat], k) => { const x = p + (W - 2 * p) * cols[k]; if (lat) latin(sc, c, [[h, D.mute]], x, hy, cf - 1, { w: 650, a: sk }); else sc.text(h, x, hy, { size: cf - 1, w: 650, color: D.mute, a: sk }); });
    
    c.globalAlpha = sk * 0.5; c.fillStyle = D.mute; R(sc, c, p + 6, ty + rh, W - 2 * p - 12, 1);
    KP.forEach(([d, ok, att], i) => {
      const y = ty + rh * (i + 1.75), u = fade(t, 0.9 + i * 0.32, 0.25), v = (100 * ok / att).toFixed(2);
      const xs = k => p + (W - 2 * p) * cols[k];
      sc.text(T(d[0], d[1]), xs(0), y, { size: cf, w: 600, a: sk });
      let k = 1;
      if (!nar) { sc.text(T('Region A', 'المنطقة أ'), xs(1), y, { size: cf, a: sk * 0.85 }); k = 2; }
      sc.text(K.fmtInt(ok), xs(k), y, { size: cf, a: sk * (0.6 + 0.4 * u) });
      sc.text(K.fmtInt(att), xs(k + 1), y, { size: cf, a: sk * (0.6 + 0.4 * u) });
      sc.text(v, xs(k + 2), y, { size: cf + 1, w: 750, a: sk * u });
      
      const on = clamp(1 - Math.abs(t - (0.9 + i * 0.32 + 0.1)) / 0.22, 0, 1);
      if (on > 0) { c.globalAlpha = sk * on * 0.8; c.strokeStyle = D.ink; c.lineWidth = 1.2; SR(sc, c, xs(k) - 6, y - cf - 5, xs(k + 2) - xs(k), cf + 11); }
    });
    const ly = bot + small + 12;
    sc.text(T('worked out with pandas, for the chosen site groups', 'تُحسب بمكتبة pandas لمجموعات المواقع المختارة'), p, ly, { size: small, color: D.mute, a: sk * fade(t, 2.3, 0.3) });
    const ca = fade(t, 2.7, 0.3);
    const lw = latin(sc, c, [['`DL_GB`', D.ink]], p, ly + small + 9, small, { w: 650, a: sk * ca });
    sc.text(T('alone: copied as it is', 'وحده: يُنسخ كما هو'), p + lw + 8, ly + small + 9, { size: small, w: 700, a: sk * ca });
    note(sc, g);
  },
};


const TYPES = [['Line', 'line', ['one axis', 'محور واحد']], ['Overlay', 'overlay', ['days on 24 hours', 'أيام على 24 ساعة']], ['Line-Area', 'area', ['two axes', 'محوران']],
               ['Pie', 'pie', ['latest value', 'آخر قيمة']], ['Stacked Bar', 'stacked', ['shares to 100%', 'حصص إلى 100%']]];
const S4 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: the five chart types, each drawn in its placeholder in one shared style: Line on one axis, Overlay with several days on one 24-hour axis, Line-Area with an area on the left axis and a line on the right, Pie with the latest value, and Stacked Bar with shares that add up to 100%. Each picture is made at its placeholder’s size and put where the placeholder was.',
          ar: 'بيانات توضيحية: أنواع الرسوم الخمسة، كل منها مرسوم في مكانه بأسلوب واحد: Line على محور واحد، و Overlay بعدة أيام على محور واحد من 24 ساعة، و Line-Area بمساحة على المحور الأيسر وخط على الأيمن، و Pie بآخر قيمة، و Stacked Bar بحصص مجموعها 100%. وتُصنع كل صورة بحجم مكانها وتوضع في موضعه.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g, 34) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12), nar = g.narrow;
    header(sc, g, T('Five chart types, one style', 'خمسة أنواع من الرسوم، بأسلوب واحد'), T('each made at its placeholder’s size and put where the placeholder was', 'كل رسم يُصنع بحجم مكانه ويوضع في موضعه'), sk);
    const bot = H - p - g.f(11) - 22, cols = nar ? 2 : 3, rows = nar ? 3 : 2, gap = 14 * g.sf + 6;
    const cw = (W - 2 * p - gap * (cols - 1)) / cols, ch = (bot - m.top - gap * (rows - 1)) / rows;
    TYPES.forEach(([nm, kind, opt], i) => {
      const x = p + (i % cols) * (cw + gap), y = m.top + Math.floor(i / cols) * (ch + gap), at = 0.3 + i * 0.4, u = fade(t, at + 0.2, 0.6), on = fade(t, at, 0.25);
      
      c.save(); c.globalAlpha = sk * (1 - on) * 0.8; c.strokeStyle = D.mute; c.setLineDash([4, 3]); c.lineWidth = 1; SR(sc, c, x, y, cw, ch); c.restore();
      c.globalAlpha = sk * on; c.fillStyle = D.page; R(sc, c, x, y, cw, ch);
      latin(sc, c, [[nm, D.ink]], x + 10, y + small + 8, small, { w: 750, a: sk * on });
      const ow = cw - 20 - LWd(sc, c, nm, small, 750) - 12;
      if (ow > 30) sc.text(fitW(sc, T(opt[0], opt[1]), ow, { size: g.f(11) }), x + cw - 10, y + small + 8, { size: g.f(11), color: D.mute, al: 'end', a: sk * on });
      mini(sc, c, kind, { x: x + 16, y: y + small + 20, w: cw - 32, h: ch - small - 32 }, u, sk * on);
    });
    
    if (!nar) {
      const x = p + 2 * (cw + gap), y = m.top + ch + gap, a = sk * fade(t, 2.4, 0.35);
      sc.para(T('One shared style: the same fonts, colours and axes on every chart, whoever set up the deck.', 'أسلوب واحد مشترك: الخطوط والألوان والمحاور نفسها في كل رسم، أيًّا كان من أعدّ العرض.'), x + 4, y + small + 8, cw - 8, Math.round(small * 1.4), { size: small, color: D.mute, a });
    }
    note(sc, g);
  },
};


const CHK = [['A known chart type', 'نوع رسم معروف'], ['Day or hour', 'محور زمني يومي أو بالساعة'], ['Site groups in the data', 'مجموعات المواقع موجودة'],
             ['Equations exist, each with a formula', 'المعادلات موجودة، ولكل منها صيغة'], ['Axes that make sense', 'محاور منطقية'], ['The formula works on the data', 'الصيغة تعمل على البيانات']];
const S5 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: row C04 is checked in order: a known chart type, day or hour, site groups in the data, equations that exist with a formula and axes that make sense each get a tick; the last check fails, because the formula names CS_SUCES, which is not in the data. Instead of a wrong chart, its place gets a warning chart with that reason, the warning is written to the log, and the other charts still draw.',
          ar: 'بيانات توضيحية: يُفحص الصف C04 بالترتيب: نوع رسم معروف، ومحور زمني يومي أو بالساعة، ومجموعات مواقع موجودة، ومعادلات موجودة لها صيغة، ومحاور منطقية، وكلها تأخذ علامة صح؛ ويفشل الفحص الأخير لأن الصيغة تذكر CS_SUCES، وهو غير موجود في البيانات. وبدل رسم خاطئ يظهر في مكانه رسم تحذير بهذا السبب، ويُكتب التحذير في السجل، وتُرسم بقية الرسوم.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g, 34) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12), nar = g.narrow;
    header(sc, g, T('A warning, not a wrong chart', 'تحذير، لا رسم خاطئ'), T('each row is checked in order before anything is drawn', 'يُفحص كل صف بالترتيب قبل أن يُرسم أي شيء'), sk);
    const bot = H - p - g.f(11) - small * 2 - 28;
    latin(sc, c, [['C04', D.ink], ['   Line   Region B   E09', D.mute]], p, m.top, small + 1, { w: 700, a: sk });
    const lw = nar ? W - 2 * p : (W - 2 * p) * 0.5, ly0 = m.top + small + 14, rh = Math.min(small * 2.3, (nar ? (bot - ly0) * 0.56 : bot - ly0) / CHK.length);
    CHK.forEach(([en, ar], i) => {
      const y = ly0 + i * rh + rh * 0.6, at = 0.4 + i * 0.3, u = fade(t, at, 0.2), bad = i === CHK.length - 1;
      sc.text(fitW(sc, T(en, ar), lw - 34, { size: small }), p + 26, y, { size: small, w: bad ? 700 : 500, color: bad && u > 0.5 ? D.acc : D.ink, a: sk * (0.45 + 0.55 * u) });
      if (u > 0) {
        if (bad) { sc.text('×', p + 8, y + 1, { size: small + 4, w: 800, color: D.acc, al: 'center', a: sk * u }); }
        else tick(sc, c, p + 2, y - small * 0.35, 11, D.ink, sk * u);
      }
    });
    
    const wa = fade(t, 2.4, 0.35);
    const bx = nar ? p : p + lw + 24 * g.sf, by = nar ? ly0 + CHK.length * rh + 10 : ly0, bw = nar ? W - 2 * p : W - p - bx, bh = nar ? bot - by : (bot - ly0);
    c.save(); c.globalAlpha = sk * (1 - wa) * 0.8; c.strokeStyle = D.mute; c.setLineDash([4, 3]); SR(sc, c, bx, by, bw, bh); c.restore();
    latin(sc, c, [['C04', wa > 0.5 ? D.acc : D.mute]], bx + 10, by + small + 8, small, { w: 750, a: sk });
    if (wa > 0) {
      c.globalAlpha = sk * wa; c.fillStyle = D.page; R(sc, c, bx, by, bw, bh);
      latin(sc, c, [['C04', D.acc]], bx + 10, by + small + 8, small, { w: 750, a: sk * wa });
      c.strokeStyle = D.acc; c.lineWidth = 1.6; SR(sc, c, bx + 1, by + 1, bw - 2, bh - 2);
      const tz = Math.min(bh * 0.32, 44 * g.sf + 10), cx = bx + bw / 2, cy = by + bh * 0.42, X = sc.X(cx);
      c.beginPath(); c.moveTo(X, cy - tz * 0.55); c.lineTo(X + tz * 0.6, cy + tz * 0.45); c.lineTo(X - tz * 0.6, cy + tz * 0.45); c.closePath(); c.stroke();
      sc.text('!', cx, cy + tz * 0.32, { size: tz * 0.6, w: 800, color: D.acc, al: 'center', a: sk * wa });
      const msg = T('Warning: CS_SUCES is not in the data', 'تحذير: CS_SUCES غير موجود في البيانات');
      sc.text(fitW(sc, msg, bw - 20, { size: small, w: 700 }), cx, Math.min(by + bh - 10, cy + tz * 0.45 + small + 10), { size: small, w: 700, color: D.acc, al: 'center', a: sk * wa });
    }
    const la = fade(t, 2.9, 0.3), yy = bot + small + 12;
    latin(sc, c, [['WARNING  C04: ', D.acc], ['CS_SUCES not found', D.mute]], p, yy, small - 0.5, { w: 600, a: sk * la });
    sc.text(T('written to the log; the other charts still draw', 'يُكتب في السجل، وتُرسم بقية الرسوم'), p, yy + small + 9, { size: small, w: 700, a: sk * la });
    note(sc, g);
  },
};


const GUIDE = [['Template rules', 'قواعد القالب'], ['Settings columns', 'أعمدة الإعدادات'], ['Chart types', 'أنواع الرسوم'], ['Errors and warnings', 'الأخطاء والتحذيرات']];
const TBL = [['No chart type', 'لا يوجد نوع رسم', 'error chart', 'رسم خطأ'], ['Unknown chart type', 'نوع رسم غير معروف', 'warning chart', 'رسم تحذير'],
             ['Site group not in the data', 'مجموعة مواقع غير موجودة', 'chart with the reason', 'رسم فيه السبب'], ['Equation id not found', 'مُعرّف معادلة غير موجود', 'chart with the reason', 'رسم فيه السبب']];
const S6 = {
  dur: 3.6,
  aria: { en: 'A user guide, version 1.0 from August 2025, opens: its cover, then four sections, template rules, settings columns, chart types and errors and warnings. The last section opens on its table: no chart type draws an error chart, an unknown chart type a warning chart, and the other problems a chart with the reason.',
          ar: 'يُفتح دليل المستخدم، الإصدار 1.0 من أغسطس 2025: غلافه، ثم أقسامه الأربعة: قواعد القالب، وأعمدة الإعدادات، وأنواع الرسوم، والأخطاء والتحذيرات. ويُفتح القسم الأخير على جدوله: غياب نوع الرسم يرسم رسم خطأ، والنوع غير المعروف رسم تحذير، وبقية المشكلات رسمًا فيه السبب.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g, 30) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12), nar = g.narrow;
    header(sc, g, T('A guide anyone can follow', 'دليل يستطيع أي أحد اتباعه'), T('so an engineer can build a deck without reading the code', 'ليبني المهندس عرضًا دون أن يقرأ الكود'), sk);
    const bot = H - p - g.f(11) - 22, ph = bot - m.top, pw = Math.min(ph * 0.72, (W - 2 * p) * (nar ? 0.42 : 0.26));
    
    const ca = fade(t, 0.2, 0.35);
    c.globalAlpha = sk * ca; c.fillStyle = D.page; R(sc, c, p, m.top, pw, ph);
    c.fillStyle = D.ink; R(sc, c, p + 12, m.top + 14, pw * 0.25, 3);
    sc.para(T('KPI deck generator', 'مولّد عروض المؤشرات'), p + 12, m.top + 30 + small, pw - 24, Math.round(small * 1.3), { size: small + 1, w: 750, a: sk * ca });
    sc.text(T('User guide', 'دليل المستخدم'), p + 12, m.top + ph * 0.55, { size: small, w: 600, a: sk * ca });
    latin(sc, c, [['v1.0', D.mute]], p + 12, m.top + ph * 0.55 + small + 8, small, { w: 600, a: sk * ca });
    sc.text(T('August 2025', 'أغسطس 2025'), p + 12, m.top + ph - 14, { size: g.f(11), color: D.mute, a: sk * ca });
    
    const sx = p + pw + 18 * g.sf, sw = W - p - sx;
    const lh = nar ? small * 2 : small * 2.2;
    GUIDE.forEach(([en, ar], i) => {
      const y = m.top + small + i * lh, u = fade(t, 0.6 + i * 0.25, 0.25), last = i === GUIDE.length - 1;
      sc.text(String(i + 1), sx, y, { size: small, w: 700, color: D.mute, a: sk * u });
      sc.text(fitW(sc, T(en, ar), sw - 30, { size: small }), sx + 22, y, { size: small, w: last ? 750 : 500, a: sk * u });
    });
    const ty = m.top + small + GUIDE.length * lh + 6, ta = fade(t, 1.9, 0.35);
    if (bot - ty > small * 3) {
      c.globalAlpha = sk * ta * 0.55; c.fillStyle = D.page; R(sc, c, sx, ty, sw, bot - ty);
      const rh = Math.min(small * 2.4, (bot - ty - 8) / TBL.length);
      TBL.forEach(([a1, a2, b1, b2], i) => {
        const y = ty + (i + 0.68) * rh, u = fade(t, 2.1 + i * 0.18, 0.2), warn = i === 1;
        if (nar) {
          sc.text(fitW(sc, T(a1, a2), sw - 20, { size: g.f(11) }), sx + 10, y - small * 0.25, { size: g.f(11), a: sk * u });
          sc.text(T(b1, b2), sx + 10, y + small * 0.85, { size: g.f(11), w: 700, color: warn ? D.acc : D.ink, a: sk * u });
        } else {
          sc.text(fitW(sc, T(a1, a2), sw * 0.55, { size: small }), sx + 10, y, { size: small, a: sk * u });
          sc.text(fitW(sc, T(b1, b2), sw * 0.38, { size: small, w: 700 }), sx + sw - 10, y, { size: small, w: 700, al: 'end', color: warn ? D.acc : D.ink, a: sk * u });
        }
      });
    }
  },
};

K.STEPS['nokia-drg'] = [S1, S2, S3, S4, S5, S6];
})();
