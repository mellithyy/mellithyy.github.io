





(() => {
'use strict';
const K = window.KIT, AR = K.AR, D = K.DARK;
const { clamp, lerp, smooth, mkRnd, fmtInt } = K;
const T = (en, ar) => AR ? ar : en;


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
  let lx = o.al === 'end' ? (AR ? sc.W - x : x - tot) : o.al === 'center' ? (AR ? sc.W - x : x) - tot / 2 : (AR ? sc.W - x - tot : x);
  parts.forEach((p, i) => { c.globalAlpha = (p[2] == null ? 1 : p[2]) * (o.a == null ? 1 : o.a); c.fillStyle = p[1] || D.ink; c.fillText(p[0], lx, y); lx += ws[i]; });
  c.globalAlpha = 1;
  return tot;
}
const LW = (sc, c, s, size, w) => latin(sc, c, [[s]], 0, 0, size, { measure: true, w });
function dashRect(sc, c, x, y, w, h, col, a, lw) {
  c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw || 1.25; c.setLineDash([4, 3]);
  SR(sc, c, x + 0.5, y + 0.5, w - 1, h - 1); c.restore();
}

function tick(sc, c, x, y, s, col, a) {
  const L = AR ? sc.W - x - s : x;
  c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(L, y); c.lineTo(L + s * 0.35, y + s * 0.35); c.lineTo(L + s, y - s * 0.45); c.stroke(); c.lineCap = 'butt';
}
function note(sc, g) { sc.text(T('Illustrative data', 'بيانات توضيحية'), g.pad, sc.H - Math.round(g.pad * 0.6), { size: g.f(11), color: D.mute }); }
function header(sc, g, a, b, al) {
  const p = g.pad;
  sc.text(a, p, p + g.f(15), { size: g.f(15), w: 700, a: al });
  sc.text(b, p, p + g.f(15) + g.f(12) + 7, { size: g.f(12), color: D.mute, a: al });
  return p + g.f(15) + g.f(12) + 18;
}
const fade = (t, a, d) => smooth((t - a) / (d || 0.3));

function cyl(sc, c, x, y, w, h, u, a) {
  const ry = Math.max(3, w * 0.13), X0 = AR ? sc.W - x - w : x;
  c.globalAlpha = a; c.fillStyle = D.page;
  c.beginPath(); c.ellipse(X0 + w / 2, y + h, w / 2, ry, 0, 0, Math.PI); c.lineTo(X0, y); c.ellipse(X0 + w / 2, y, w / 2, ry, 0, Math.PI, 0, true); c.closePath(); c.fill();
  if (u > 0) {
    const fy = y + h - (h - 4) * u;
    c.fillStyle = D.ink; c.globalAlpha = a * 0.55;
    c.beginPath(); c.ellipse(X0 + w / 2, y + h, w / 2 - 3, ry - 1.5, 0, 0, Math.PI); c.lineTo(X0 + 3, fy); c.ellipse(X0 + w / 2, fy, w / 2 - 3, ry - 1.5, 0, Math.PI, 0, true); c.closePath(); c.fill();
  }
  c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(X0 + w / 2, y, w / 2, ry, 0, 0, 2 * Math.PI); c.stroke();
  c.beginPath(); c.moveTo(X0, y); c.lineTo(X0, y + h); c.ellipse(X0 + w / 2, y + h, w / 2, ry, 0, Math.PI, 0, true); c.lineTo(X0 + w, y); c.stroke();
}


const OBJS = [
  { cls: 'BTS', dn: 'PLMN-PLMN/BSC-412/BCF-17/BTS-3', p: [['name', 'HILL_2'], ['bcch', '62']] },
  { cls: 'LNCEL', dn: 'PLMN-PLMN/MRBTS-51/LNBTS-51/LNCEL-1', p: [['pMax', '430'], ['dlChBw', '20']] },
  { cls: 'WCEL', dn: 'PLMN-PLMN/RNC-31/WBTS-208/WCEL-2', p: [['name', 'RIVER_1'], ['lac', '41207']] },
];
const S1 = {
  dur: 3.6,
  aria: { en: 'Illustrative data: a 4.8 GB dump is read once from start to end. One managed object at a time is read, turned into a row of its class (BTS, LNCEL, WCEL) and cleared from memory; the rows of each class pile up while the count of objects read climbs.',
          ar: 'بيانات توضيحية: ملف بحجم 4.8 جيجابايت يُقرأ مرة واحدة من أوله إلى آخره. يُقرأ عنصر مُدار واحد في كل مرة، ويتحوّل إلى صف في فئته (BTS و LNCEL و WCEL) ثم يُحذف من الذاكرة؛ وتتراكم صفوف كل فئة بينما يرتفع عدد العناصر المقروءة.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad;
    const top = p + g.f(15) + g.f(12) + 26, bot = H - p - g.f(11) - 14;
    const fw = Math.round(clamp(W * 0.07, 22, 52));
    const m = { g, top, bot, fw };
    m.file = { x: p, y: top + g.f(11) + 8, w: fw, h: bot - top - g.f(11) * 2 - 22 };
    if (g.narrow) {
      m.zoom = { x: p + fw + 14, y: top, w: W - 2 * p - fw - 14, h: (bot - top) * 0.52 };
      const sy = m.zoom.y + m.zoom.h + 16, sw = (W - 2 * p - fw - 14 - 16) / 3;
      m.stacks = [0, 1, 2].map(k => ({ x: p + fw + 14 + k * (sw + 8), y: sy, w: sw, h: bot - sy }));
    } else {
      m.zoom = { x: p + fw + 24, y: top, w: W * 0.6 - (p + fw + 24), h: bot - top };
      const sx = W * 0.64, sw = W - p - sx, sh = (bot - top - 16) / 3;
      m.stacks = [0, 1, 2].map(k => ({ x: sx, y: top + k * (sh + 8), w: sw, h: sh }));
    }
    const rnd = mkRnd(311);
    m.fileLines = Array.from({ length: 64 }, () => 0.25 + 0.7 * rnd());
    m.stackRows = m.stacks.map(() => Array.from({ length: 14 }, () => 0.35 + 0.6 * rnd()));
    return m;
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, sk = fade(t, 0, 0.35), prog = clamp((t - 0.25) / 3.1, 0, 1);
    header(sc, g, T('Read once, from start to end', 'قراءة واحدة من البداية إلى النهاية'), T('a 4G dump of 4.8 GB, one managed object at a time', 'ملف للجيل الرابع بحجم 4.8 جيجابايت، عنصرًا مُدارًا بعد عنصر'), sk);
    
    const nObj = Math.round(1284516 * smooth(prog));
    if (!g.narrow) {
    sc.text(fmtInt(nObj), sc.W - p, p + g.f(22), { size: g.f(22), w: 700, al: 'end', a: sk });
    sc.text(T('objects read', 'عنصرًا مقروءًا'), sc.W - p, p + g.f(22) + g.f(12) + 6, { size: g.f(12), color: D.mute, al: 'end', a: sk });
    }
    
    const f = m.file;
    sc.text(T('file', 'الملف'), f.x, m.top + g.f(11), { size: g.f(11), w: 650, color: D.mute, a: sk });
    c.globalAlpha = sk; c.fillStyle = D.page; R(sc, c, f.x, f.y, f.w, f.h);
    const lh = f.h / m.fileLines.length, wy = f.y + f.h * prog;
    m.fileLines.forEach((w, i) => { const y = f.y + (i + 0.5) * lh; c.globalAlpha = sk * (y < wy ? 0.18 : 0.55); c.fillStyle = D.ink; R(sc, c, f.x + 4, y, (f.w - 8) * w, Math.max(1, lh * 0.35)); });
    c.globalAlpha = sk; c.strokeStyle = D.ink; c.lineWidth = 1.4; SR(sc, c, f.x - 2, wy - 5, f.w + 4, 10);
    sc.text((4.8 * prog).toFixed(1) + (g.narrow ? ' GB' : T(' GB', ' جيجابايت')), f.x, f.y + f.h + g.f(11) + 10, { size: g.f(11), w: 650, a: sk });
    
    const z = m.zoom, fs = g.f(12), zlh = Math.round(fs * 1.55);
    c.globalAlpha = sk * 0.55; c.fillStyle = D.page; R(sc, c, z.x, z.y, z.w, z.h * (g.narrow ? 1 : 0.62));
    sc.text(T('in memory now: one object', 'في الذاكرة الآن: عنصر واحد'), z.x + 10, z.y + g.f(11) + 8, { size: g.f(11), w: 650, color: D.mute, a: sk });
    
    c.globalAlpha = sk * 0.5; c.strokeStyle = D.mute; c.lineWidth = 1; seg(sc, c, f.x + f.w + 2, wy, z.x, z.y + z.h * 0.25);
    const per = 1.0, j = clamp(Math.floor((t - 0.35) / per), 0, OBJS.length - 1), lt = t - 0.35 - j * per;
    const o = OBJS[j], last = j === OBJS.length - 1, xmlA = sk * fade(lt, 0, 0.15) * (last ? 1 : 1 - fade(lt, 0.55, 0.2));
    const zx0 = AR ? sc.W - z.x - z.w : z.x;
    c.save(); c.beginPath(); c.rect(zx0, z.y, z.w, z.h); c.clip();
    if (t > 0.35 && xmlA > 0.01) {
      const y0 = z.y + g.f(11) + 16 + fs;
      const lines = [[['<managedObject class="', D.mute], [o.cls, D.ink], ['"', D.mute]], [['  distName="', D.mute], [o.dn, D.ink], ['">', D.mute]],
        ...o.p.map(([n, v]) => [['  <p name="', D.mute], [n, D.ink], ['">', D.mute], [v, D.ink], ['</p>', D.mute]]), [['</managedObject>', D.mute]]];
      lines.forEach((ln, i) => latin(sc, c, ln, AR ? z.x + z.w - 10 : z.x + 10, y0 + i * zlh, fs, { a: xmlA * fade(lt, i * 0.04, 0.12), al: AR ? 'end' : 'start' }));
    }
    c.restore();
    
    const rowU = fade(lt, 0.45, 0.2), fly = smooth((lt - 0.7) / 0.28);
    if (t > 0.35 && rowU > 0 && fly < 1) {
      const rh = Math.round(fs * 1.9), rw = Math.min(z.w - 20, g.narrow ? z.w - 20 : 300);
      const rx0 = z.x + 10, ry0 = z.y + z.h * (g.narrow ? 0.62 : 0.72) - rh / 2;
      const st = m.stacks[j], tx = st.x + 4, ty = st.y + g.f(12) + 14;
      const x = lerp(rx0, tx, fly), y = lerp(ry0, ty, fly), w = lerp(rw, st.w - 8, fly), h = lerp(rh, 4, fly);
      c.globalAlpha = sk * rowU; c.fillStyle = '#3a3733'; R(sc, c, x, y, w, h);
      if (fly < 0.3) {
        const a = sk * rowU * (1 - fly / 0.3);
        latin(sc, c, [[o.dn.split('/').slice(1).join('/'), D.ink], ['   ' + o.p.map(q => q[1]).join('  '), D.mute]], AR ? x + w - 8 : x + 8, y + h / 2 + fs * 0.36, Math.max(9, fs - 1), { a, al: AR ? 'end' : 'start' });
      }
    }
    
    const clr = fade(lt, 0.62, 0.15) * (1 - fade(lt, 0.9, 0.1));
    if (t > 0.35 && clr > 0 && !last) sc.text(T('cleared', 'حُذف'), z.x + z.w - 10, z.y + g.f(11) + 8, { size: g.f(11), w: 700, al: 'end', a: sk * clr });
    
    if (!g.narrow) {
      const my = z.y + z.h * 0.86, ma = sk * fade(t, 0.6, 0.4), bw = z.w - 20;
      sc.text(T('the file', 'الملف'), z.x + 10, my - 8, { size: g.f(11), color: D.mute, a: ma });
      c.globalAlpha = ma * 0.45; c.fillStyle = D.ink; R(sc, c, z.x + 10, my, bw * prog, 6);
      sc.text(T('held in memory at any moment', 'ما في الذاكرة في أي لحظة'), z.x + 10, my + 30, { size: g.f(11), color: D.mute, a: ma });
      c.globalAlpha = ma; c.fillStyle = D.ink; R(sc, c, z.x + 10, my + 38, 3, 6);
      sc.text(T('one object', 'عنصر واحد'), z.x + 20, my + 44, { size: g.f(11), w: 650, a: ma });
    }
    
    m.stacks.forEach((st, k) => {
      const ob = OBJS[k];
      c.globalAlpha = sk * 0.55; c.fillStyle = D.page; R(sc, c, st.x, st.y, st.w, st.h);
      latin(sc, c, [[ob.cls, D.ink]], st.x + 8, st.y + g.f(12) + 6, g.f(12), { w: 650, a: sk });
      const rows = m.stackRows[k], n = Math.round(rows.length * clamp(prog * 1.05 - k * 0.02, 0, 1));
      const avail = st.h - g.f(12) - 18, rh = Math.min(7, avail / rows.length);
      for (let i = 0; i < n; i++) { c.globalAlpha = sk * 0.6; c.fillStyle = D.ink; R(sc, c, st.x + 8, st.y + g.f(12) + 14 + i * rh, (st.w - 16) * rows[i], Math.max(1, rh * 0.45)); }
    });
    note(sc, g);
  },
};


const MAP = [['BTS', 'BTS', 0], ['LNCEL', 'LNCEL', 0], ['WCEL', 'WCEL', 0], ['ADCE', 'ADCE', 0], ['BTS', 'BTS_EXT', 1]];
const S2 = {
  dur: 3.6,
  aria: { en: 'Illustrative data: the template’s metadata decides the mapping. XML classes on one side, the template’s tables on the other, and the class-filter rows in the middle join them one by one; one table, BTS_EXT, is filled from another class named in the metadata. Under it an XML name, dlChBw, becomes the column dlChannelBandwidth. Over 1,000 table types, no table-by-table code.',
          ar: 'بيانات توضيحية: البيانات الوصفية في القالب تقرّر الربط. فئات XML في جانب، وجداول القالب في الجانب الآخر، وصفوف مرشّح الفئات في الوسط تربط بينها واحدًا بعد واحد؛ وجدول واحد، BTS_EXT، يُملأ من فئة أخرى مذكورة في البيانات الوصفية. وتحت ذلك يصير الاسم dlChBw في XML العمود dlChannelBandwidth. أكثر من 1,000 نوع من الجداول، دون كود لكل جدول.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad;
    const top = p + g.f(15) + g.f(12) + 30, bot = H - p - g.f(11) - 18;
    const ren = g.f(12) * 2 + 34;                       
    
    const note = g.f(11) + 30;
    const cy0 = top + g.f(11) + 12, cy1 = bot - ren - 10 - note;
    const cw = (W - 2 * p) / 3;
    if (g.narrow) { const c0 = Math.round(W * 0.24); return { g, top, bot, ren, cy0, cy1, cols: [p, p + c0, W], cw: W - 2 * p - c0, rh: (cy1 - cy0) / MAP.length, two: true }; }
    return { g, top, bot, ren, cy0, cy1, cols: [p, p + cw, p + 2 * cw], cw, rh: (cy1 - cy0) / MAP.length };
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, sk = fade(t, 0, 0.35), fs = g.f(12);
    header(sc, g, T('The template decides', 'القالب هو الذي يقرّر'), T('its own metadata tables map every class, table and column', 'جداول البيانات الوصفية فيه تربط كل فئة وجدول وعمود'), sk);
    const heads = [T('XML classes', 'فئات XML'), T('Class filter (metadata)', 'مرشّح الفئات (بيانات وصفية)'), T('Template tables', 'جداول القالب')];
    heads.forEach((h, k) => !(m.two && k === 2) && sc.text(h, m.cols[k] + (k === 1 ? 10 : 0), m.top + g.f(11), { size: g.f(11), w: 650, color: D.mute, a: sk }));
    
    c.globalAlpha = sk * 0.55; c.fillStyle = D.page; R(sc, c, m.cols[1], m.cy0 - 6, m.cw - 8, m.cy1 - m.cy0 + 12);
    MAP.forEach(([cls, tbl, ext], i) => {
      const y = m.cy0 + (i + 0.5) * m.rh, at = 0.35 + i * 0.42, u = fade(t, at, 0.3), v = fade(t, at + 0.2, 0.3);
      const la = Math.max(0.35, u) * sk;
      latin(sc, c, [[cls, D.ink]], m.cols[0], y + fs * 0.36, fs, { w: 650, a: ext ? la * 0.7 : la });
      
      const mx = m.cols[1] + 10;
      latin(sc, c, [[tbl, D.ink], [ext ? '  external_name=' : '  class=', D.mute], [cls, D.ink, 0.8]], mx, y + fs * 0.36, Math.max(9.5, fs - 1), { a: sk * u });
      const tw = latin(sc, c, [[tbl, D.ink]], 0, 0, fs, { measure: true, w: 650 });
      if (!m.two) latin(sc, c, [[tbl, D.ink]], m.cols[2] + m.cw - tw, y + fs * 0.36, fs, { w: 650, a: sk * Math.max(0.3, v) });
      
      const cw0 = latin(sc, c, [[cls]], 0, 0, fs, { measure: true, w: 650 });
      c.save(); c.globalAlpha = sk * u * 0.8; c.strokeStyle = ext ? D.mute : D.ink; c.lineWidth = 1.2; if (ext) c.setLineDash([3, 3]);
      seg(sc, c, m.cols[0] + cw0 + 8, y, lerp(m.cols[0] + cw0 + 8, m.cols[1] - 4, u), y);
      if (v > 0 && !m.two) seg(sc, c, m.cols[1] + m.cw - 4, y, lerp(m.cols[1] + m.cw - 4, m.cols[2] + m.cw - tw - 32, v), y);
      c.restore();
      if (v > 0.9) tick(sc, c, m.two ? sc.W - p - 12 : m.cols[2] + m.cw - tw - 22, y + 1, 10, D.ink, sk * v);
    });
    
    const ra = fade(t, 2.2, 0.35);
    sc.text(T('dashed: filled from another class, named in the metadata', 'الخط المتقطّع: يُملأ من فئة أخرى تذكرها البيانات الوصفية'), m.cols[0], m.cy1 + 6 + 14 + g.f(11), { size: g.f(11), color: D.mute, a: sk * ra });
    
    const ry = m.bot - m.ren + 8, rA = fade(t, 2.45, 0.35);
    c.globalAlpha = sk * rA * 0.55; c.fillStyle = D.page; R(sc, c, p, ry, sc.W - 2 * p, m.ren - 8);
    sc.text(T('Parameter filter: XML name to column', 'مرشّح المعاملات: من اسم XML إلى عمود'), p + 10, ry + g.f(11) + 8, { size: g.f(11), w: 650, color: D.mute, a: sk * rA });
    const ny = ry + g.f(11) + 14 + fs;
    const w1 = latin(sc, c, [['dlChBw', D.ink]], p + 10, ny, fs, { w: 650, a: sk * rA });
    const aw = 26 * g.sf;
    c.globalAlpha = sk * rA; c.strokeStyle = D.ink; c.lineWidth = 1.3; seg(sc, c, p + 18 + w1, ny - fs * 0.35, p + 18 + w1 + aw, ny - fs * 0.35);
    const ax = p + 18 + w1 + aw; seg(sc, c, ax - 5, ny - fs * 0.35 - 4, ax, ny - fs * 0.35); seg(sc, c, ax - 5, ny - fs * 0.35 + 4, ax, ny - fs * 0.35);
    latin(sc, c, [['dlChannelBandwidth', D.ink]], ax + 8, ny, fs, { w: 650, a: sk * rA });
    
    const ca = fade(t, 2.8, 0.4);
    sc.text(T('over 1,000 table types, no code per table', 'أكثر من 1,000 نوع من الجداول، بلا كود لكل جدول'), sc.W - p, ny, { size: g.f(12), w: 700, al: 'end', a: sk * ca * (g.narrow ? 0 : 1) });
    note(sc, g);
  },
};


const S3 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: the name PLMN-PLMN/BSC-412/BCF-17/BTS-3 is matched against the format PLMN-PLMN/BSC-%d/BCF-%d/BTS-%d and splits into three key columns, BSCId 412, BCFId 17 and BTSId 3. A second name ends in ADCE-4321 where the format asks for five digits; it is listed for the team, not loaded.',
          ar: 'بيانات توضيحية: الاسم PLMN-PLMN/BSC-412/BCF-17/BTS-3 يُطابَق مع الصيغة PLMN-PLMN/BSC-%d/BCF-%d/BTS-%d فينقسم إلى ثلاثة أعمدة مفاتيح: BSCId قيمته 412، و BCFId قيمته 17، و BTSId قيمته 3. واسم ثانٍ ينتهي بـ ADCE-4321 حيث تطلب الصيغة خمسة أرقام؛ فيُدرَج في قائمة للفريق ولا يُحمَّل.' },
  build(W, H) { const g = geo(W, H); return { g, top: g.pad + g.f(15) + g.f(12) + 30 }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35);
    header(sc, g, T('One name, three keys', 'اسم واحد وثلاثة مفاتيح'), T('the format comes from the template, one per class', 'الصيغة من القالب، لكل فئة صيغتها'), sk);
    
    const fs = g.f(g.narrow ? 13 : 22), small = g.f(g.narrow ? 12 : 13.5), avail = H - g.pad - 24 - m.top;
    
    const parts = ['PLMN-PLMN', 'BSC-412', 'BCF-17', 'BTS-3'], fmt = ['PLMN-PLMN', 'BSC-%d', 'BCF-%d', 'BTS-%d'];
    const sep = latin(sc, c, [['/']], 0, 0, fs, { measure: true, w: 650 });
    const pw = parts.map((s, i) => Math.max(latin(sc, c, [[s]], 0, 0, fs, { measure: true, w: 650 }), latin(sc, c, [[fmt[i]]], 0, 0, fs, { measure: true, w: 500 })));
    const tot = pw.reduce((a, b) => a + b, 0) + sep * 3 + 18;
    const x0 = Math.max(p, (W - tot) / 2), y1 = m.top + small + fs + Math.max(10, avail * 0.08), y2 = y1 + fs * 1.9;
    sc.text(T('the object’s name', 'اسم العنصر'), x0, y1 - fs - 10, { size: small, w: 650, color: D.mute, a: sk });
    sc.text(T('the format in the template', 'الصيغة في القالب'), x0, y2 + small + 12, { size: small, w: 650, color: D.mute, a: sk * fade(t, 0.4, 0.3) });
    
    const L2R = (x, w) => AR ? W - x - w : x;
    let x = x0; const cx = [];
    parts.forEach((s, i) => {
      const hot = i > 0, u = fade(t, 0.75 + i * 0.22, 0.25);
      if (hot && u > 0) { c.globalAlpha = sk * u * 0.6; c.fillStyle = D.page; R(sc, c, L2R(x - 3, pw[i] + 6), y1 - fs - 2, pw[i] + 6, fs * 1.9 + fs + 6); }
      const sw = latin(sc, c, [[s]], 0, 0, fs, { measure: true, w: 650 });
      latin(sc, c, [[s, D.ink]], L2R(x, sw), y1, fs, { w: 650, a: sk });
      const f = fmt[i], k = f.indexOf('%'), fp = k < 0 ? [[f, D.mute]] : [[f.slice(0, k), D.mute], [f.slice(k), D.ink]];
      latin(sc, c, fp, L2R(x, latin(sc, c, fp, 0, 0, fs, { measure: true, w: 500 })), y2, fs, { w: 500, a: sk * fade(t, 0.4, 0.3) });
      cx.push(x + pw[i] / 2); x += pw[i];
      if (i < parts.length - 1) { latin(sc, c, [['/', D.mute]], L2R(x + 3, sep), y1, fs, { w: 650, a: sk }); latin(sc, c, [['/', D.mute]], L2R(x + 3, sep), y2, fs, { w: 500, a: sk * fade(t, 0.4, 0.3) }); x += sep + 6; }
    });
    
    const ty = y2 + small + Math.max(fs * 1.5, avail * 0.12), th = small * 2.4 + (g.narrow ? 30 : 46), keys = ['BSCId', 'BCFId', 'BTSId'], vals = ['412', '17', '3'];
    const tw = Math.min(W - 2 * p, (g.narrow ? 420 : 560) * g.sf), tx = (W - tw) / 2, kw = tw / 3;
    const ta = fade(t, 1.4, 0.3);
    c.globalAlpha = sk * ta * 0.55; c.fillStyle = D.page; R(sc, c, tx, ty, tw, th);
    keys.forEach((k, i) => {
      const kx = tx + (i + 0.5) * kw, u = smooth((t - 1.55 - i * 0.2) / 0.45);
      const C2 = x => AR ? W - x : x;      
      latin(sc, c, [[k, D.mute]], C2(kx), ty + small + 6, small, { w: 650, al: 'center', a: sk * ta });
      if (i) { c.globalAlpha = sk * ta * 0.6; c.fillStyle = D.ink; c.fillRect(tx + i * kw, ty + 6, 1, th - 12); }
      if (u > 0) {
        const sx = cx[i + 1], vy = lerp(y1, ty + small * 2 + (g.narrow ? 14 : 26), u), vx = lerp(sx, kx, u);
        latin(sc, c, [[vals[i], D.ink]], C2(vx), vy, lerp(fs, g.f(g.narrow ? 15 : 22), u), { w: 750, al: 'center', a: sk });
      }
    });
    
    const by = ty + th + Math.max(small + 22, avail * 0.16), ba = fade(t, 2.6, 0.35);
    if (by + small * 2 + 8 < H - p - 12) {
      c.globalAlpha = sk * ba * 0.5; c.fillStyle = D.page; R(sc, c, p - 10, by - small - 14, W - 2 * p + 20, small * 2 + 36);
      latin(sc, c, [['…/BTS-3/', D.mute], ['ADCE-', D.ink], ['4321', D.acc]], p, by, small + 1, { w: 650, a: sk * ba });
      const w0 = latin(sc, c, [['…/BTS-3/ADCE-4321']], 0, 0, small + 1, { measure: true, w: 650 });
      const fl = T('format', 'الصيغة');
      sc.text(fl, p + w0 + 18, by, { size: small, color: D.mute, a: sk * ba });
      latin(sc, c, [['ADCE-%5d', D.ink]], p + w0 + 26 + sc.measure(fl, { size: small }), by, small, { w: 500, a: sk * ba });
      sc.text(T('four digits where the rule asks for five: listed for the team, not loaded', 'أربعة أرقام حيث تطلب الصيغة خمسة: يُدرَج للفريق ولا يُحمَّل'), p, by + small + 10, { size: small, w: 650, color: D.acc, a: sk * fade(t, 2.85, 0.35) });
    }
    note(sc, g);
  },
};


const TYPES = [['name', 'dbText (40)', 'TEXT(40)'], ['lac', 'dbLong', 'LONG'], ['bcch', 'dbInteger', 'SHORT'], ['siteCode', 'dbText (8)', 'TEXT(8)']];
const S4 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: the name HILL_2 with a space at its end. Without care Access trims the space; so the space is marked before the load and turned back into a space after it, and the name arrives exactly as Plan Editor keeps it. Beside it, each parameter’s declared type sets its Access column: name dbText 40 to TEXT(40), lac dbLong to LONG, bcch dbInteger to SHORT, and a code such as 007 stays text, so its zeros stay.',
          ar: 'بيانات توضيحية: الاسم HILL_2 وفي آخره مسافة. لو تُرك كما هو لحذف Access المسافة؛ لذلك تُعلَّم المسافة قبل التحميل وتعود مسافةً بعده، فيصل الاسم كما يحفظه Plan Editor تمامًا. وبجانبه يحدّد النوع المعرَّف لكل معامل عموده في Access: name من dbText 40 إلى TEXT(40)، و lac من dbLong إلى LONG، و bcch من dbInteger إلى SHORT، ويبقى رمز مثل 007 نصًا فتبقى أصفاره.' },
  build(W, H) {
    const g = geo(W, H), p = g.pad, top = p + g.f(15) + g.f(12) + 30;
    const split = g.narrow ? null : W * 0.5;
    return { g, top, split };
  },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), fs = g.f(g.narrow ? 13 : 15), small = g.f(12);
    header(sc, g, T('Every space kept, every type set', 'كل مسافة محفوظة وكل نوع مضبوط'), T('names exactly as Plan Editor keeps them; types from the declarations', 'الأسماء كما يحفظها Plan Editor تمامًا، والأنواع من التعريفات'), sk);
    const colW = m.split ? m.split - p - 16 : W - 2 * p;
    
    const rows = [[T('in the XML', 'في XML'), 0], [T('marked for the load', 'مُعلَّم للتحميل'), 1], [T('in the database', 'في القاعدة'), 2]];
    const rh = m.split ? (H - m.top - p - 40) / 4.8 : (H - m.top - p) * 0.48 / 3.4;
    sc.text(T('A space at the end of a name', 'مسافة في آخر الاسم'), p, m.top + small, { size: small, w: 700, a: sk });
    rows.forEach(([lab, k], i) => {
      const y = m.top + small + 14 + (i + 0.5) * rh, u = fade(t, 0.4 + i * 0.55, 0.3);
      sc.text(lab, p, y + small * 0.36, { size: small, color: D.mute, a: sk * Math.max(0.3, u) });
      const vx = p + colW * (g.narrow ? 0.42 : 0.48);
      const wn = latin(sc, c, [['HILL_2', D.ink]], vx, y + fs * 0.36, fs, { w: 650, a: sk * u });
      
      const bx = vx + wn + 2, bw = fs * 0.5, bh = fs * 0.9, sx = AR ? W - vx + 2 : bx;
      if (k === 1) { c.globalAlpha = sk * u; c.fillStyle = D.acc; c.beginPath(); c.moveTo(sx + bw / 2, y - bh / 2); c.lineTo(sx + bw, y); c.lineTo(sx + bw / 2, y + bh / 2); c.lineTo(sx, y); c.closePath(); c.fill(); }
      else { c.globalAlpha = sk * u; c.strokeStyle = k === 2 ? D.acc : D.ink; c.lineWidth = 1.2; c.strokeRect(sx + 0.5, y - bh / 2, bw, bh); }
      if (k === 2 && u > 0.9) tick(sc, c, AR ? vx - bw - 22 : bx + bw + 12, y + 1, 10, D.ink, sk * fade(t, 1.9, 0.3));
    });
    const ny = m.top + small + 14 + 3 * rh + small;
    sc.para(T('Access trims a space at the end, so it is marked before the load and turned back into a space after it.', 'يحذف Access المسافة في آخر الاسم، لذلك تُعلَّم قبل التحميل وتعود مسافةً بعده.'),
      p, ny, colW, Math.round(small * 1.4), { size: small, color: D.mute, a: sk * fade(t, 2.0, 0.4) });
    
    const tx = m.split ? m.split + 16 : p, ty = m.split ? m.top : ny + small * 3 + 10, tw = m.split ? W - p - tx : W - 2 * p;
    if (ty + small * 6 < H - p) {
      sc.text(T('Types from the parameter declarations', 'الأنواع من تعريفات المعاملات'), tx, ty + small, { size: small, w: 700, a: sk });
      const trh = Math.min(small * 3.4, (H - p - 40 - ty - small * 2) / (TYPES.length + 1.8));
      const c1 = tx, c2 = tx + tw * 0.34, c3 = tx + tw * 0.72;
      TYPES.forEach(([n, dt, at], i) => {
        const y = ty + small * 2 + 14 + (i + 0.5) * trh, u = fade(t, 0.7 + i * 0.35, 0.3);
        if (i) { c.globalAlpha = sk * 0.35; c.fillStyle = D.page; R(sc, c, tx, y - trh / 2, tw, 1); }
        latin(sc, c, [[n, D.ink]], c1, y + small * 0.36, small, { w: 650, a: sk * u });
        latin(sc, c, [[dt, D.mute]], c2, y + small * 0.36, small, { a: sk * u });
        latin(sc, c, [[at, D.ink]], c3, y + small * 0.36, small, { w: 700, a: sk * fade(t, 0.9 + i * 0.35, 0.3) });
      });
      const zy = ty + small * 2 + 14 + (TYPES.length + 0.9) * trh;
      const za = fade(t, 2.4, 0.35);
      sc.text(T('so a code such as 007 stays 007, never 7', 'فيبقى رمز مثل 007 كما هو، ولا يصير 7'), tx, zy, { size: small, w: 600, color: D.mute, a: sk * za });
    }
    note(sc, g);
  },
};


const LOAD = [['BTS', 12036], ['WCEL', 22918], ['LNCEL', 48210], ['ADCE', 160402], ['LNREL', 391544], ['MRBTS', 4105]];
const S5 = {
  dur: 3.8,
  aria: { en: 'Illustrative data: six tables load one after another. For each, a CSV file and its schema file, then one Jet SQL statement, INSERT INTO the table SELECT everything FROM the CSV, fills the whole table at once; the Access database fills as the row counts appear.',
          ar: 'بيانات توضيحية: ستة جداول تُحمَّل واحدًا بعد الآخر. لكل جدول ملف CSV وملف مخطط، ثم أمر Jet SQL واحد، INSERT INTO للجدول مع SELECT لكل ما في ملف CSV، يملأ الجدول كله دفعة واحدة؛ وتمتلئ قاعدة Access مع ظهور أعداد الصفوف.' },
  build(W, H) { const g = geo(W, H), p = g.pad; return { g, top: p + g.f(15) + g.f(12) + 30 }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12);
    header(sc, g, T('One statement per table', 'أمر واحد لكل جدول'), T('a CSV file and its schema file, loaded by Access in one go', 'ملف CSV وملف مخططه، يحمّلهما Access دفعة واحدة'), sk);
    const per = 0.42, k = clamp(Math.floor((t - 0.3) / per), 0, LOAD.length - 1);
    
    const sy = m.top, sh = small * 2 + 18;
    c.globalAlpha = sk * 0.55; c.fillStyle = D.page; R(sc, c, p, sy, W - 2 * p, sh);
    const tb = LOAD[k][0], fsq = Math.max(9.5, small - (g.narrow ? 1.5 : 0));
    c.save(); c.beginPath(); c.rect(p, sy, W - 2 * p, sh); c.clip();
    latin(sc, c, [['INSERT INTO ', D.mute], [tb, D.ink], [' SELECT * FROM ', D.mute], ['[Text;HDR=Yes].[', D.mute, 0.8], [tb + '.csv', D.ink], [']', D.mute, 0.8]], AR ? W - p - 10 : p + 10, sy + sh / 2 + fsq * 0.36, fsq, { w: 600, a: sk * fade(t, 0.3, 0.2), al: AR ? 'end' : 'start' });
    c.restore();
    
    const ly = sy + sh + 16, dbw = Math.round(clamp(W * 0.16, 56, 120)), lw = W - 2 * p - dbw - 28;
    const rh = Math.min(small * 4.4, (H - p - 34 - ly) / LOAD.length);
    const nameW = Math.max(...LOAD.map(r => latin(sc, c, [[r[0]]], 0, 0, small, { measure: true, w: 650 }))) + 10;
    const csvW = Math.round(small * 3.6);
    let done = 0, all = 0;
    LOAD.forEach(([n, rows], i) => {
      all += rows;
      const y = ly + (i + 0.5) * rh, st = 0.3 + i * per, u = smooth((t - st - 0.08) / (per * 0.75)), a = Math.max(0.35, fade(t, st - 0.1, 0.15));
      latin(sc, c, [[n, D.ink]], p, y + small * 0.36, small, { w: 650, a: sk * a });
      
      const fx = p + nameW, fh = rh * 0.62, fw = fh * 0.78;
      const pg = (x, col, al) => { const k = fw * 0.32; c.globalAlpha = al; c.fillStyle = col; c.beginPath(); c.moveTo(sc.X(x), y - fh / 2); c.lineTo(sc.X(x + fw - k), y - fh / 2); c.lineTo(sc.X(x + fw), y - fh / 2 + k); c.lineTo(sc.X(x + fw), y + fh / 2); c.lineTo(sc.X(x), y + fh / 2); c.closePath(); c.fill(); };
      pg(fx, D.ink, sk * a * 0.85); pg(fx + fw + 4, D.mute, sk * a * 0.6);
      
      const bx = fx + csvW, bw = lw - (bx - p) - small * 5.5;
      c.globalAlpha = sk * 0.5; c.fillStyle = D.page; R(sc, c, bx, y - 4, bw, 8);
      if (u > 0) { c.globalAlpha = sk; c.fillStyle = D.ink; R(sc, c, bx, y - 4, bw * u, 8); }
      if (u > 0.95) { sc.text(fmtInt(rows), p + lw, y + small * 0.36, { size: small, w: 700, al: 'end', a: sk }); done += rows; }
    });
    
    const dx = W - p - dbw, dy = ly + 14, dh = Math.min(dbw * 1.7, rh * LOAD.length - small * 4 - 20);
    cyl(sc, c, dx, dy, dbw, dh, done / all, sk);
    sc.text('Access', dx + dbw / 2, dy + dh + Math.max(6, dbw * 0.13) + small + 8, { size: small, w: 700, al: 'center', a: sk });
    sc.text(fmtInt(done) + T(' rows', ' صف'), dx + dbw / 2, dy + dh + Math.max(6, dbw * 0.13) + small * 2 + 14, { size: small, color: D.mute, al: 'center', a: sk });
    note(sc, g);
  },
};


const PE = [['LNCEL-11', '460', '20'], ['LNCEL-12', '430', '20'], ['LNCEL-13', '430', '10']];
const TL = [['LNCEL-11', '430', '20'], ['LNCEL-12', '430', '20'], ['LNCEL-13', '430', '10']];
const S6 = {
  dur: 4.0,
  aria: { en: 'Illustrative data: the same table from Plan Editor’s database and from this tool, three cells and two parameters each. Both turn into rows of key, parameter and value and are joined; five of six cells match and get a tick, one, LNCEL-11 pMax, 460 against 430, does not. It goes to the Changes sheet in amber, and the Summary sheet counts it: one that does not match, none missing on either side.',
          ar: 'بيانات توضيحية: الجدول نفسه من قاعدة Plan Editor ومن هذه الأداة، ثلاث خلايا ومعاملان لكل منها. يتحوّل الجدولان إلى صفوف من المفتاح والمعامل والقيمة ويُربطان؛ تتطابق خمس خلايا من ست وتأخذ علامة صح، وواحدة لا تتطابق: LNCEL-11 و pMax، القيمة 460 مقابل 430. فتذهب إلى ورقة التغييرات بالكهرماني، وتعدّها ورقة الملخّص: واحدة غير مطابقة، ولا شيء ناقص في أي جانب.' },
  build(W, H) { const g = geo(W, H), p = g.pad; return { g, top: p + g.f(15) + g.f(12) + 30 }; },
  draw(sc, c, m, t) {
    const g = m.g, p = g.pad, W = sc.W, H = sc.H, sk = fade(t, 0, 0.35), small = g.f(12), tiny = Math.max(g.narrow ? 10 : 10.5, small - 1);
    header(sc, g, T('Cell by cell, against Plan Editor', 'خلية بخلية، مقابل Plan Editor'), T('both databases as rows of key, parameter and value', 'القاعدتان صفوفًا من المفتاح والمعامل والقيمة'), sk);
    
    const tw = (W - 2 * p - 16) / 2, th = small * 1.9, ty = m.top;
    const tabs = [[T('Plan Editor', 'Plan Editor'), PE], [T('This tool', 'هذه الأداة'), TL]];
    tabs.forEach(([name, rows], k) => {
      const tx = p + k * (tw + 16);
      sc.text(name, tx, ty + small, { size: small, w: 700, a: sk });
      c.globalAlpha = sk * 0.55; c.fillStyle = D.page; R(sc, c, tx, ty + small + 8, tw, th * 4);
      const cx = [tx + 8, tx + tw * 0.48, tx + tw * 0.76];
      [['LNCEL', 'pMax', 'dlChBw']].concat(rows).forEach((r, i) => {
        const y = ty + small + 8 + (i + 0.62) * th;
        r.forEach((v, j) => latin(sc, c, [[v, i ? D.ink : D.mute]], cx[j], y, tiny, { w: i ? 600 : 650, a: sk }));
      });
    });
    
    const ly = ty + small + 8 + th * 4 + 16, cells = [];
    PE.forEach((r, i) => ['pMax', 'dlChBw'].forEach((pn, j) => cells.push({ key: r[0], pn, a: r[1 + j], b: TL[i][1 + j] })));
    const lh = g.narrow ? 0 : Math.min(small * 2, (H - p - 24 - ly) * 0.6 / cells.length);
    const lx = p, colK = lx + 18, colP = colK + tw * 0.4, colA = colP + tw * 0.38, colB = colA + tw * 0.32;
    if (lh) cells.forEach((cl, i) => {
      const y = ly + (i + 0.6) * lh, u = fade(t, 0.8 + i * 0.22, 0.2), diff = cl.a !== cl.b, res = fade(t, 1.0 + i * 0.22, 0.2);
      const col = diff && res > 0.5 ? D.acc : D.ink;
      latin(sc, c, [[cl.key, D.ink], ['', D.ink]], colK, y, tiny, { w: 600, a: sk * u });
      latin(sc, c, [[cl.pn, D.mute]], colP, y, tiny, { a: sk * u });
      latin(sc, c, [[cl.a, col]], colA, y, tiny, { w: 700, a: sk * u });
      latin(sc, c, [[cl.b, col]], colB, y, tiny, { w: 700, a: sk * u });
      if (!diff) tick(sc, c, lx, y - 3, 9, D.ink, sk * res * 0.85);
      else if (res > 0) { c.globalAlpha = sk * res; c.fillStyle = D.acc; R(sc, c, lx + 2, y - 7, 6, 6); }
    });
    
    const ry = ly + cells.length * lh + (lh ? 18 : 0), ra = fade(t, 2.6, 0.35);
    if (ry + small * 3 < H - p - 6) {
      sc.text(T('Changes', 'التغييرات'), p, ry + small, { size: small, w: 700, a: sk * ra });
      latin(sc, c, [['LNCEL  LNCEL-11  pMax  ', D.ink], ['460', D.acc], ['  ', D.ink], ['430', D.acc]], p, ry + small * 2 + 10, tiny, { w: 600, a: sk * ra });
      const cw = latin(sc, c, [['LNCEL  LNCEL-11  pMax  460  430']], 0, 0, tiny, { measure: true, w: 600 });
      if (!g.narrow) sc.text(T('Doesn’t match', 'غير مطابقة'), p + cw + 14, ry + small * 2 + 10, { size: tiny, w: 700, color: D.acc, a: sk * ra });
      const sx = g.narrow ? p : W * 0.6, sa = fade(t, 3.0, 0.35), syy = g.narrow ? ry + small * 3 + 18 : ry;
      if (syy + small * 3 < H - p) {
        sc.text(T('Summary', 'الملخّص'), sx, syy + small, { size: small, w: 700, a: sk * sa });
        const st = [[T('Doesn’t match', 'غير مطابقة'), '1'], [T('Missing in the tool’s', 'ناقص في الأداة'), '0'], [T('Missing in Plan Editor’s', 'ناقص في Plan Editor'), '0']];
        st.forEach(([s, n], i) => {
          const y = syy + small * 2 + 10 + i * (small + 6);
          if (g.narrow && i) return;
          sc.text(s, sx, y, { size: tiny, color: D.mute, a: sk * sa });
          sc.text(n, W - p, y, { size: tiny, w: 700, al: 'end', color: i ? D.ink : D.acc, a: sk * sa });
        });
      }
    }
    note(sc, g);
  },
};

K.STEPS['nokia-xml'] = [S1, S2, S3, S4, S5, S6];
})();
