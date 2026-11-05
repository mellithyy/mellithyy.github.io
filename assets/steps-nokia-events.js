





(() => {
'use strict';
const K = window.KIT, AR = K.AR, D = K.DARK;
const { clamp, lerp, smooth, fmtInt } = K;
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
const TECH = ['2G', '3G', '4G', '5G'];
const top0 = (g, extra) => g.pad + g.f(15) + g.f(12) * (g.narrow ? 2.4 : 1) + (extra || 30);


const ROWS1 = [2310, 2290, 2150, 170];
const S1 = {
  dur: 3.4,
  aria: { en: 'Illustrative data: the hourly export is one workbook with a sheet per technology, 2G, 3G, 4G and 5G, each with KPIs per site group, hour by hour, seven days back. The four sheets are read one after another and each gets a tick with its row count; the report’s own notes sheets are skipped.',
          ar: 'بيانات توضيحية: الملف الذي يصل كل ساعة مصنّف واحد فيه ورقة لكل جيل، 2G و 3G و 4G و 5G، وفي كل ورقة مؤشرات كل مجموعة مواقع ساعة بساعة لسبعة أيام مضت. تُقرأ الأوراق الأربع واحدة بعد الأخرى وتأخذ كل منها علامة صح وعدد صفوفها، وتُترك أوراق الملاحظات الخاصة بالتقرير.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12);
    header(sc, g, T('One sheet per technology', 'ورقة لكل جيل'), T('the hourly export: KPIs per site group, hour by hour, 7 days back', 'ملف كل ساعة: مؤشرات كل مجموعة مواقع، ساعة بساعة، لسبعة أيام مضت'), sk);
    const n = 4, cols = g.narrow ? 2 : 4, gap = 14 * g.sf + 6, bot = H - p - g.f(11) - small * (g.narrow ? 3.4 : 2) - 26;
    const sw = (W - 2 * p - gap * (cols - 1)) / cols, rowsN = g.narrow ? 2 : 1, sh = (bot - m.top - gap * (rowsN - 1)) / rowsN;
    TECH.forEach((tk, k) => {
      const cx = k % cols, cy = Math.floor(k / cols), x = p + cx * (sw + gap), y = m.top + cy * (sh + gap);
      const at = 0.4 + k * 0.5, u = fade(t, at, 0.35), done = fade(t, at + 0.35, 0.2);
      c.globalAlpha = sk * (0.45 + 0.55 * Math.max(u, 0.2)); c.fillStyle = D.page; R(sc, c, x, y, sw, sh);
      
      latin(sc, c, [[tk, D.ink]], x + 10, y + small + 8, small + 1, { w: 750, a: sk });
      
      const hy = y + small * (g.narrow ? 1.4 : 2) + 18;
      if (!g.narrow) [T('Hour', 'الساعة'), T('Group', 'المجموعة')].forEach((h, j) => sc.text(h, x + 10 + j * sw * 0.36, hy, { size: g.f(10.5), color: D.mute, w: 600, a: sk }));
      const nl = g.narrow ? 0 : Math.max(1, Math.floor((sh - (hy - y) - small * 2 - 14) / (small * 0.95)));
      for (let i = 0; i < nl; i++) {
        const yy = hy + 10 + i * (small * 0.95), lit = clamp((t - at) / 0.35 * nl - i, 0, 1);
        c.globalAlpha = sk * (0.25 + 0.55 * lit); c.fillStyle = D.ink;
        R(sc, c, x + 10, yy, sw * 0.22, 2); R(sc, c, x + 10 + sw * 0.36, yy, sw * 0.18, 2); R(sc, c, x + 10 + sw * 0.62, yy, sw * (0.12 + 0.12 * ((i * 3 + k) % 4) / 3), 2);
      }
      sc.text(fmtInt(ROWS1[k]) + T(' rows', ' صف'), x + 10, y + sh - 12, { size: small, w: 700, a: sk * done });
      tick(sc, c, x + sw - 24, y + small + 4, 11, D.ink, sk * done);
    });
    
    const ky = H - p - g.f(11) - small - 16, ka = fade(t, 2.5, 0.35);
    const skipped = [T('Report execution', 'تنفيذ التقرير'), T('Documentation', 'التوثيق')];
    let x = p;
    skipped.forEach(s => {
      const w = sc.measure(s, { size: small }) + 22;
      c.globalAlpha = sk * ka * 0.4; c.fillStyle = D.page; R(sc, c, x, ky - small - 6, w, small + 14);
      sc.text(s, x + 11, ky + 1, { size: small, color: D.mute, a: sk * ka });
      c.globalAlpha = sk * ka * 0.8; c.fillStyle = D.mute; R(sc, c, x + 8, ky - small * 0.35, w - 16, 1.2);
      x += w + 10;
    });
    
    if (g.narrow) sc.text(T('skipped: not KPIs', 'تُترك: ليست مؤشرات'), p, ky - small - 16, { size: small, w: 650, color: D.mute, a: sk * ka });
    else sc.text(T('skipped: not KPIs', 'تُترك: ليست مؤشرات'), x + 4, ky + 1, { size: small, w: 650, color: D.mute, a: sk * ka });
    note(sc, g);
  },
};


const S2 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: four small tables, one per technology, each keyed by hour and site group. They are joined into one table with a column per technology. Group 3 has no 5G: an inner merge would drop the group from every technology, the outer merge keeps it with an empty 5G cell.',
          ar: 'بيانات توضيحية: أربعة جداول صغيرة، جدول لكل جيل، مفتاح كل منها الساعة ومجموعة المواقع. تُربط في جدول واحد فيه عمود لكل جيل. المجموعة 3 بلا 5G: الدمج الداخلي كان سيحذف المجموعة من كل الأجيال، أما الدمج الخارجي فيبقيها مع خلية 5G فارغة.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12), cf = g.f(11.5);
    header(sc, g, T('Merged on hour and site group', 'دمج على الساعة ومجموعة المواقع'), T('one row per hour and group, one column per technology; an outer merge keeps every group', 'صف لكل ساعة ومجموعة، وعمود لكل جيل؛ والدمج الخارجي يُبقي كل مجموعة'), sk);
    const bot = H - p - g.f(11) - small * 3 - 30;
    
    const lw = g.narrow ? W - 2 * p : (W - 2 * p) * 0.34, rx = g.narrow ? p : p + lw + 30 * g.sf;
    const srcH = g.narrow ? (bot - m.top) * 0.3 : bot - m.top, sh = (srcH - 18) / 4;
    TECH.forEach((tk, k) => {
      const y = m.top + k * (sh + 6), u = fade(t, 0.3 + k * 0.18, 0.3), w = g.narrow ? (W - 2 * p - 18) / 4 : lw, x = g.narrow ? p + k * (w + 6) : p;
      const yy = g.narrow ? m.top : y, hh = g.narrow ? srcH : sh;
      c.globalAlpha = sk * u * 0.55; c.fillStyle = D.page; R(sc, c, x, yy, w, hh);
      latin(sc, c, [[tk, D.ink]], x + 8, yy + cf + 6, cf, { w: 750, a: sk * u });
      
      const mr = g.narrow ? 3 : Math.min(3, Math.floor((hh - cf - 16) / 9));
      for (let i = 0; i < mr; i++) { const ry = yy + cf + 16 + i * (g.narrow ? (hh - cf - 22) / 3 : 9); c.globalAlpha = sk * u * 0.55; c.fillStyle = D.ink;
        R(sc, c, x + 8, ry, w * 0.16, 2); R(sc, c, x + 8 + w * 0.24, ry, w * 0.2, 2); if (!(k === 3 && i === 2)) R(sc, c, x + 8 + w * 0.52, ry, w * (0.14 + 0.06 * ((i + k) % 3)), 2); }
      if (!g.narrow) {
        const kx = x + 8 + LWd(sc, c, '5G', cf, 750) + 14;
        if (AR) sc.text('الساعة، المجموعة، المؤشرات', kx, yy + cf + 6, { size: cf - 0.5, color: D.mute, a: sk * u });
        else latin(sc, c, [['hour · group · ', D.mute], ['KPI…', D.ink]], kx, yy + cf + 6, cf - 0.5, { a: sk * u });
        const groups = k === 3 ? 2 : 3;
        sc.text(T(groups + ' groups', groups === 2 ? 'مجموعتان' : 'ثلاث مجموعات'), x + w - 8, yy + cf + 6, { size: cf, w: k === 3 ? 700 : 500, color: k === 3 ? D.ink : D.mute, al: 'end', a: sk * u });
      }
    });
    
    const ty = g.narrow ? m.top + srcH + 18 : m.top, tw = g.narrow ? W - 2 * p : W - p - rx, th = bot - ty;
    const ma = fade(t, 1.0, 0.35);
    c.globalAlpha = sk * ma * 0.55; c.fillStyle = D.page; R(sc, c, rx, ty, tw, th);
    const cx = [0.04, 0.2, 0.45, 0.59, 0.73, 0.87].map(v => rx + tw * v);
    const heads = [T('Hour', 'الساعة'), T('Group', 'المجموعة')];
    const rh = Math.min(small * 3, (th - small * 2 - 16) / (g.narrow ? 3 : 6));
    const hy = ty + small + 10;
    heads.forEach((h, j) => sc.text(h, cx[j], hy, { size: cf, w: 650, color: D.mute, a: sk * ma }));
    TECH.forEach((tk, k) => latin(sc, c, [[tk, D.mute]], cx[2 + k], hy, cf, { w: 700, a: sk * ma }));
    
    if (!g.narrow) TECH.forEach((tk, k) => {
      const y = m.top + k * (sh + 6) + sh / 2, la = fade(t, 0.8 + k * 0.1, 0.3), x0 = p + lw + 4, x1 = cx[2 + k] + 6;
      c.save(); c.globalAlpha = sk * la * 0.45; c.strokeStyle = D.mute; c.lineWidth = 1; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(sc.X(x0), y); c.lineTo(sc.X(rx - 6), y); c.lineTo(sc.X(rx - 6), ty + 8); c.stroke(); c.restore();
    });
    const vals = [[['0.6', '98.9', '1,042', '271'], ['0.5', '99.1', '988', '240'], ['0.7', '98.7', '1,284', null]],
                  [['0.6', '99.0', '1,101', '288'], ['0.4', '99.2', '1,016', '252'], ['0.6', '97.1', '1,318', null]]];
    
    for (let h = g.narrow ? 1 : 0; h < 2; h++) for (let gi = 0; gi < 3; gi++) {
      const i = h * 3 + gi, ii = g.narrow ? gi : i, y = hy + 10 + (ii + 0.6) * rh + (h && !g.narrow ? 6 : 0), u = fade(t, 1.2 + i * 0.12, 0.25);
      if (gi === 0) sc.text(h ? '22:00' : '21:00', cx[0], y, { size: cf, w: 650, a: sk * u });
      sc.text(T('Group ', 'المجموعة ') + (gi + 1), cx[1], y, { size: cf, a: sk * u * 0.9 });
      vals[h][gi].forEach((v, k) => {
        if (v) sc.text(v, cx[2 + k], y, { size: cf, w: 600, a: sk * u });
        else {
          const kept = fade(t, 2.3, 0.35);
          c.save(); c.globalAlpha = sk * u; c.strokeStyle = D.mute; c.setLineDash([2, 2]); c.lineWidth = 1; SR(sc, c, cx[2 + k], y - cf * 0.85, tw * 0.09, cf * 1.15); c.restore();
          if (kept > 0 && gi === 2) { c.globalAlpha = sk * kept; c.fillStyle = D.acc; R(sc, c, rx + 3, y - cf * 0.8, 3, cf); }
        }
      });
    }
    
    const ia = fade(t, 2.4, 0.35), iy = bot + small + 14;
    sc.text(T('Inner merge: Group 3 is dropped from every technology', 'الدمج الداخلي: تُحذف المجموعة 3 من كل الأجيال'), p, iy, { size: small, color: D.mute, a: sk * ia });
    sc.text(T('Outer merge: Group 3 stays, its 5G cell empty', 'الدمج الخارجي: تبقى المجموعة 3، وخلية 5G فارغة'), p, iy + small + 9, { size: small, w: 700, color: D.acc, a: sk * fade(t, 2.7, 0.35) });
    note(sc, g);
  },
};


const S3 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: a grid of hours from 17:00 to 23:00 by six site groups. Every hour is full except the newest, 23:00, where three groups have no data yet. The check starts at the newest hour, finds it still filling, steps back to 22:00, finds every group there, and picks it.',
          ar: 'بيانات توضيحية: شبكة من الساعات، من 17:00 إلى 23:00، في ست مجموعات مواقع. كل الساعات مكتملة إلا الأحدث، 23:00، فثلاث مجموعات بلا بيانات بعد. يبدأ الفحص من الساعة الأحدث فيجدها ما زالت تمتلئ، ثم يرجع إلى 22:00 فيجد كل المجموعات، فيختارها.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g, 40) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12);
    header(sc, g, T('The latest complete hour', 'آخر ساعة مكتملة'), T('the newest hour is often still filling, so the report uses the last hour every group has', 'الساعة الأحدث كثيرًا ما تكون في طور الامتلاء، فيستخدم التقرير آخر ساعة لدى كل المجموعات'), sk);
    const hours = g.narrow ? ['19:00', '20:00', '21:00', '22:00', '23:00'] : ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
    const G = 6, labW = sc.measure(T('Group 6', 'المجموعة 6'), { size: small }) + 14;
    const bot = H - p - g.f(11) - small * 2 - 30;
    const gx = p + labW, gw = W - p - gx, cw = gw / hours.length, gy = m.top + small + 10, ch = (bot - gy) / G;
    hours.forEach((h, i) => sc.text(h, gx + (i + 0.5) * cw, m.top + small, { size: g.f(11), w: 650, color: i === hours.length - 2 ? D.ink : D.mute, al: 'center', a: sk }));
    for (let r = 0; r < G; r++) sc.text(T('Group ', 'المجموعة ') + (r + 1), p, gy + (r + 0.5) * ch + small * 0.35, { size: small, color: D.mute, a: sk });
    const last = hours.length - 1, miss = new Set([1, 3, 4]);
    
    const s1 = fade(t, 1.0, 0.3), back = fade(t, 1.9, 0.35), pk = fade(t, 2.4, 0.3);
    hours.forEach((h, i) => {
      for (let r = 0; r < G; r++) {
        const x = gx + i * cw + 3, y = gy + r * ch + 3, w = cw - 6, hh = ch - 6, u = fade(t, 0.2 + i * 0.07 + r * 0.02, 0.2);
        const empty = i === last && miss.has(r);
        if (empty) { c.save(); c.globalAlpha = sk * u * 0.7; c.strokeStyle = D.mute; c.setLineDash([3, 3]); c.lineWidth = 1; SR(sc, c, x, y, w, hh); c.restore(); }
        else { const pick = i === last - 1 ? pk : 0; c.globalAlpha = sk * u * (0.6 + 0.4 * pick) * (i < last - 1 ? 1 - 0.35 * pk : 1); c.fillStyle = D.page; R(sc, c, x, y, w, hh);
          c.globalAlpha = sk * u * (0.6 + 0.4 * pick) * (i < last - 1 ? 1 - 0.35 * pk : 1); c.fillStyle = D.ink; R(sc, c, x + w * 0.2, y + hh / 2 - 1, w * 0.5, 2 + pick); }
      }
    });
    
    const fx = lerp(gx + last * cw, gx + (last - 1) * cw, back);
    if (s1 > 0) { c.globalAlpha = sk * s1; c.strokeStyle = D.ink; c.lineWidth = 2; SR(sc, c, fx, gy - 4, cw, G * ch + 8); }
    const ly = bot + small + 14;
    sc.text(T('23:00: three groups have no data yet, still filling', '23:00: ثلاث مجموعات بلا بيانات بعد، ما زالت تمتلئ'), p, ly, { size: small, color: D.mute, a: sk * fade(t, 1.3, 0.3) });
    sc.text(T('22:00: every group is there, so the report uses 22:00', '22:00: كل المجموعات موجودة، فيستخدم التقرير 22:00'), p, ly + small + 9, { size: small, w: 700, a: sk * pk });
    note(sc, g);
  },
};


const FILL = [
  { lab: ['Data traffic, GB', 'حركة البيانات، جيجابايت'], ph: '{{DL_VOL + UL_VOL}}', calc: null, out: '1,284.6' },
  { lab: ['Traffic vs 7 days before', 'الحركة مقابل قبل 7 أيام'], ph: '{{DL_VOL + UL_VOL}}:{{7d%}}', calc: ['1,284.6 / 929.1 − 1', '1284.6 / 929.1 − 1'], out: '+38.3%' },
  { lab: ['Call setup success vs 7 days', 'نجاح إنشاء المكالمات مقابل قبل 7 أيام'], ph: '{{CSSR}}:{{7d}}', calc: ['97.12 − 99.48', '97.12 − 99.48'], out: '−2.36', hot: 1 },
];
const S4 = {
  dur: 4.0,
  aria: { en: 'Illustrative data: a region’s template. Under the 4G KPIs heading it reads the site groups, and each cell holds a placeholder. {{DL_VOL + UL_VOL}} becomes the value now, 1,284.6; with :{{7d%}} it becomes the change against the same hour seven days before, 1,284.6 over 929.1 minus one, +38.3%; {{CSSR}}:{{7d}} becomes 97.12 minus 99.48, −2.36, a drop.',
          ar: 'بيانات توضيحية: قالب منطقة. تحت عنوان مؤشرات 4G تقرأ الأداة مجموعات المواقع، وفي كل خلية عنصر نائب. {{DL_VOL + UL_VOL}} يصير القيمة الآن، 1,284.6؛ ومع :{{7d%}} يصير التغيّر مقابل الساعة نفسها قبل سبعة أيام: 1,284.6 على 929.1 ناقص واحد، +38.3%؛ و {{CSSR}}:{{7d}} يصير 97.12 ناقص 99.48، أي −2.36، وهو انخفاض.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12), fs = g.f(g.narrow ? 12 : 14);
    header(sc, g, T('Placeholders become numbers', 'العناصر النائبة تصير أرقامًا'), T('the value now, or its change against the same hour 7 days before', 'القيمة الآن، أو تغيّرها مقابل الساعة نفسها قبل 7 أيام'), sk);
    
    let y = m.top + small;
    if (!g.narrow) sc.text(T('4G KPIs', 'مؤشرات 4G'), p, y, { size: small + 1, w: 750, a: sk });
    const ga = fade(t, 0.3, 0.3);
    
    const gw = g.narrow ? 0 : latin(sc, c, [['grp_01', D.ink], ['    ', D.ink], ['grp_02 > ', D.mute], ['Main stage', D.ink]], p + sc.measure(T('4G KPIs', 'مؤشرات 4G'), { size: small + 1, w: 750 }) + 24, y, small, { w: 600, a: sk * ga });
    if (!g.narrow) sc.text(T('site groups under the block; “>” gives a friendly name', 'مجموعات المواقع تحت العنوان؛ و “>” تعطي اسمًا أوضح'), W - p, y, { size: g.f(11), color: D.mute, al: 'end', a: sk * ga * (W - 2 * p - gw > 380 * g.sf ? 1 : 0) });
    y = g.narrow ? m.top - 12 : y + small + 22;
    
    const bot = H - p - g.f(11) - 20, rh = (bot - y) / FILL.length;
    FILL.forEach((r, i) => {
      const yy = y + i * rh, at = 0.7 + i * 0.75, u = fade(t, at, 0.3), v = fade(t, at + 0.35, 0.3), w2 = fade(t, at + 0.55, 0.25);
      c.globalAlpha = sk * 0.5; c.fillStyle = D.page; R(sc, c, p, yy, W - 2 * p, rh - 10);
      const gp = g.narrow ? 8 : 14, ch = small + gp + fs, oy = yy + Math.max(8, (rh - 10 - ch) / 2);
      sc.text(T(r.lab[0], r.lab[1]), p + 12, oy + small, { size: small, color: D.mute, w: 600, a: sk });
      const ly = oy + small + gp + fs;
      const pw = latin(sc, c, [[r.ph, D.ink]], p + 12, ly, fs, { w: 600, a: sk * Math.max(0.35, u) * (1 - 0.45 * w2) });
      if (r.calc && !g.narrow) latin(sc, c, [['=  ' + r.calc[0], D.mute]], p + 12 + pw + 18, ly, fs * 0.9, { w: 500, a: sk * v });
      sc.text(r.out, W - p - 12, ly, { size: fs + 3, w: 750, al: 'end', color: r.hot ? D.acc : D.ink, a: sk * w2 });
      if (r.hot && w2 > 0.5 && !g.narrow) sc.text(T('a drop', 'انخفاض'), W - p - 12, ly + fs + 6, { size: g.f(11), w: 700, al: 'end', color: D.acc, a: sk * w2 });
    });
    note(sc, g);
  },
};


const ERR = [
  { lab: ['Traffic, 4G', 'الحركة، 4G'], out: '1,284.6' },
  { lab: ['Success rate, 3G', 'نسبة النجاح، 3G'], out: 'Error: Div by Zero', why: ['no attempts in this hour', 'لا محاولات في هذه الساعة'], err: 1 },
  { lab: ['Drops vs 7 days, 2G', 'الانقطاع مقابل قبل 7 أيام، 2G'], out: 'Error: Not enough History!', why: ['the export holds fewer than 7 days for this group', 'الملف فيه أقل من 7 أيام لهذه المجموعة'], err: 1 },
  { lab: ['Traffic, 5G', 'الحركة، 5G'], out: '318.9' },
  { lab: ['Availability, grp_09', 'الإتاحة، ⁦grp_09⁩'], out: 'Error: Unknown Working Set!', why: ['no such site group in the export', 'لا توجد مجموعة بهذا الاسم في الملف'], err: 1 },
];
const S5 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: five cells of a report. Two fill with numbers and get a tick. Three cannot be worked out, and each shows its reason in the cell instead of stopping the report: Error: Div by Zero, no attempts in this hour; Error: Not enough History!, fewer than 7 days in the export; Error: Unknown Working Set!, no such site group. The rest of the report still fills.',
          ar: 'بيانات توضيحية: خمس خلايا من تقرير. خليتان تمتلئان بأرقام وتأخذان علامة صح. وثلاث لا يمكن حسابها، فتعرض كل منها سببها داخل الخلية بدل أن يتوقف التقرير: Error: Div by Zero أي لا محاولات في هذه الساعة؛ و Error: Not enough History! أي أقل من 7 أيام في الملف؛ و Error: Unknown Working Set! أي لا توجد مجموعة بهذا الاسم. وبقية التقرير تمتلئ.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12);
    header(sc, g, T('A problem stays in its cell', 'المشكلة تبقى في خليتها'), T('a cell that cannot be worked out says why; the report still fills', 'الخلية التي لا يمكن حسابها تقول السبب، والتقرير يمتلئ'), sk);
    const bot = H - p - g.f(11) - small * 2 - 24, rh = (bot - m.top) / ERR.length;
    const vx = g.narrow ? p + 12 : p + (W - 2 * p) * 0.42;
    ERR.forEach((r, i) => {
      const y = m.top + i * rh, at = 0.4 + i * 0.4, u = fade(t, at, 0.25), ya = y + (g.narrow ? small + 6 : rh / 2 + small * 0.35 - (r.err ? small * 0.6 : 0));
      c.globalAlpha = sk * 0.5; c.fillStyle = D.page; R(sc, c, p, y + 2, W - 2 * p, rh - 6);
      sc.text(T(r.lab[0], r.lab[1]), p + 12, y + rh / 2 + small * 0.35 - (g.narrow ? 2 : 0), { size: small, color: D.mute, w: 600, a: sk });
      const oy = ya;
      if (g.narrow) {
        
        const yy = y + rh / 2 + small * 0.35 - 2;
        if (r.err) latin(sc, c, [[r.out.replace('Error: ', ''), D.acc]], W - p - 12, yy, small - 0.5, { w: 700, al: 'end', a: sk * u });
        else sc.text(r.out, W - p - 12, yy, { size: small + 1, w: 750, al: 'end', a: sk * u });
      } else if (r.err) {
        latin(sc, c, [[r.out, D.acc]], vx, oy, small, { w: 700, a: sk * u });
        if (!g.narrow || rh > small * 4) sc.text(T(r.why[0], r.why[1]), vx, oy + small + 6, { size: g.f(11), color: D.mute, a: sk * u });
      } else {
        sc.text(r.out, vx, oy, { size: small + 1, w: 750, a: sk * u });
        tick(sc, c, W - p - 26, oy - small * 0.4, 11, D.ink, sk * u);
      }
    });
    const ly = bot + small + 14;
    sc.text(T('3 cells explain themselves; the other cells and the sending go on', 'ثلاث خلايا تشرح نفسها، وبقية الخلايا والإرسال يستمران'), p, ly, { size: small, w: 700, a: sk * fade(t, 2.6, 0.35) });
    note(sc, g);
  },
};


const S6 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: four regions by the hours of an event night, from 18:00 to 04:00. Each hour, each region’s report is saved with its hour in the name, such as Region A report_22_00.xlsx, and an envelope fills its cell as it goes out to that region’s team.',
          ar: 'بيانات توضيحية: أربع مناطق في ساعات ليلة الحدث، من 18:00 إلى 04:00. في كل ساعة يُحفظ تقرير كل منطقة وفي اسمه الساعة، مثل Region A report_22_00.xlsx، ويملأ ظرف خليته حين يُرسَل إلى فريق تلك المنطقة.' },
  build(W, H) { const g = geo(W, H); return { g, top: top0(g, 34) }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12);
    header(sc, g, T('Every region, every hour', 'كل منطقة، كل ساعة'), T('each report saved with its hour in the name and sent to the region’s team', 'كل تقرير يُحفظ وفي اسمه الساعة ويُرسَل إلى فريق المنطقة'), sk);
    const hours = g.narrow ? ['18', '20', '22', '00', '02', '04'] : ['18', '19', '20', '21', '22', '23', '00', '01', '02', '03', '04'];
    const regs = [T('Region A', 'المنطقة أ'), T('Region B', 'المنطقة ب'), T('Region C', 'المنطقة ج'), T('Region D', 'المنطقة د')];
    const labW = Math.max(...regs.map(r => sc.measure(r, { size: small }))) + 14;
    const fy = H - p - g.f(11) - small * 2 - 22, gx = p + labW, gw = W - p - gx, cw = gw / hours.length;
    const gy = m.top + small + 12, ch = (fy - gy - 10) / regs.length;
    hours.forEach((h, i) => sc.text(h + ':00', gx + (i + 0.5) * cw, m.top + small, { size: g.f(10.5), w: 600, color: D.mute, al: 'center', a: sk }));
    regs.forEach((r, j) => sc.text(r, p, gy + (j + 0.5) * ch + small * 0.35, { size: small, color: D.mute, a: sk }));
    const sweep = clamp((t - 0.4) / 2.6, 0, 1) * (hours.length + 0.6);
    hours.forEach((h, i) => regs.forEach((r, j) => {
      const u = clamp(sweep - i - j * 0.15, 0, 1), cx = gx + (i + 0.5) * cw, cy = gy + (j + 0.5) * ch;
      const ew = Math.min(cw * 0.56, ch * 0.8, 30 * g.sf + 8), eh = ew * 0.64, X = sc.X(cx);
      c.globalAlpha = sk * 0.35; c.strokeStyle = D.mute; c.lineWidth = 1; c.strokeRect(X - ew / 2 + 0.5, cy - eh / 2 + 0.5, ew - 1, eh - 1);
      if (u > 0) {
        c.globalAlpha = sk * u; c.fillStyle = D.ink; c.fillRect(X - ew / 2, cy - eh / 2 + (1 - u) * 6, ew, eh);
        c.strokeStyle = D.surf; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X - ew / 2, cy - eh / 2 + (1 - u) * 6); c.lineTo(X, cy + eh * 0.1 + (1 - u) * 6); c.lineTo(X + ew / 2, cy - eh / 2 + (1 - u) * 6); c.stroke();
      }
    }));
    
    const fa = fade(t, 2.4, 0.35), ly = fy + small + 12;
    latin(sc, c, [['Region A report', D.ink], ['_22_00', D.ink], ['.xlsx', D.mute]], p, ly, small, { w: 650, a: sk * fa });
    sc.text(T('the hour in the file name', 'الساعة في اسم الملف'), p, ly + small + 9, { size: small, color: D.mute, a: sk * fa });
    note(sc, g);
  },
};

K.STEPS['nokia-events'] = [S1, S2, S3, S4, S5, S6];
})();
