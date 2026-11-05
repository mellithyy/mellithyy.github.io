





(() => {
  'use strict';
  const K = window.KIT, AR = K.AR, D = K.DARK;
  const { clamp, lerp, smooth, spring, mkRnd, fmtInt } = K;
  const wide = K.wide, pt = K.pt;
  const T = (en, ar) => AR ? ar : en;
  const ph = (t, a, d) => smooth((t - a) / d);
  
  const box = (sc, c, x, y, w, h, col, a) => { if (a <= 0.003) return; c.globalAlpha = clamp(a, 0, 1); c.fillStyle = col; c.fillRect(AR ? sc.W - x - w : x, y, w, h); };
  const frame = (sc, c, x, y, w, h, col, a, lw = 1) => { if (a <= 0.003) return; c.globalAlpha = clamp(a, 0, 1); c.strokeStyle = col; c.lineWidth = lw; c.strokeRect((AR ? sc.W - x - w : x) + lw / 2, y + lw / 2, w - lw, h - lw); };
  const seg = (sc, c, x1, y1, x2, y2, col, a, lw = 1) => { if (a <= 0.003) return; c.globalAlpha = clamp(a, 0, 1); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(sc.X(x1), y1); c.lineTo(sc.X(x2), y2); c.stroke(); };
  const disc = (sc, c, x, y, r, col, a) => { if (a <= 0.003) return; c.globalAlpha = clamp(a, 0, 1); c.fillStyle = col; c.beginPath(); c.arc(sc.X(x), y, r, 0, 6.2832); c.fill(); };
  const neg = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
  const fsz = (W, k, lo, hi) => clamp(W * k, lo, hi);
  const zz = (sc, z) => Math.round(z * clamp(sc.W / 704, 1, 1.2) * 10) / 10;

  
  
  
  
  
  const SIG = 2725353, TRF = 138469, PER = 2000;
  const HP0 = 0.3, HPD = 2.5;                              
  const hpOf = u => 72 * (smooth(u) * 0.35 + u * 0.65);
  const arrive = s => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const md = (lo + hi) / 2; if (hpOf(md) < s) lo = md; else hi = md; } return HP0 + HPD * hi; };
  const DAYW = [675624, 711483, 588465];
  const PROF = [39212, 44467, 31489, 22826, 22503, 30738, 52336, 89053, 95650, 84961, 84411, 95820, 94302, 96799, 89676, 98859, 140069, 133186, 137899, 110590, 104540, 104128, 103553, 68505];
  const S1 = { dur: 3.4,
    aria: { en: 'Two feeds over three days, 2 to 4 November 2019: RSRP.csv with 2,725,353 signal readings and TrafficVolume.csv with 138,469 traffic records, drawn as dots of 2,000 rows arriving through Saturday, Sunday and Monday.',
            ar: 'ملفان على مدى ثلاثة أيام، من 2 إلى 4 نوفمبر 2019: RSRP.csv فيه 2,725,353 قراءة إشارة، و TrafficVolume.csv فيه 138,469 سجل حركة، مرسومة نقاطًا كل نقطة 2,000 صف تصل عبر السبت والأحد والاثنين.' },
    build(W, H) {
      const wd = wide(W, H), pad = wd ? 24 : 14, rnd = mkRnd(4101);
      const big = wd ? fsz(W, 0.056, 30, 48) : fsz(W, 0.072, 22, 27);
      const head = big * 0.78 + (wd ? 16 : 9);                
      const axis = wd ? 26 : 18, note = wd ? 22 : 16, gap = wd ? 26 : 14;
      const bandH = (H - 2 * pad - 2 * head - gap - axis - note) / 2;
      const m = { wd, pad, big, x0: pad, x1: W - pad, bandH };
      m.c1 = pad + big * 0.78; m.b1 = m.c1 + (wd ? 16 : 9);
      m.c2 = m.b1 + bandH + gap + big * 0.78; m.b2 = m.c2 + (wd ? 16 : 9);
      m.ax = m.b2 + bandH + (wd ? 18 : 13);
      
      const tot = PROF.reduce((s, v) => s + v, 0), dtot = DAYW.reduce((s, v) => s + v, 0);
      const cum = []; let acc = 0;
      for (let d = 0; d < 3; d++) for (let h = 0; h < 24; h++) { acc += DAYW[d] / dtot * PROF[h] / tot; cum.push(acc); }
      const lane = (n, by) => {
        const o = { n, s: new Float32Array(n), ta: new Float32Array(n), x: new Float32Array(n), y: new Float32Array(n), z: new Float32Array(n) };
        for (let i = 0; i < n; i++) {
          const r = rnd() * acc; let k = 0; while (cum[k] < r) k++;
          const s = k + rnd();
          o.s[i] = s; o.ta[i] = arrive(s); o.x[i] = m.x0 + s / 72 * (m.x1 - m.x0);
          o.y[i] = by + 3 + rnd() * (bandH - 6); o.z[i] = rnd();
        }
        return o;
      };
      m.L = [lane(Math.round(SIG / PER), m.b1), lane(Math.round(TRF / PER), m.b2)];
      return m;
    },
    draw(sc, c, m, t) {
      const { W } = sc, wd = m.wd, pad = m.pad;
      const hp = hpOf(clamp((t - HP0) / HPD, 0, 1));
      const sk = ph(t, 0, 0.35);
      
      for (const by of [m.b1, m.b2]) box(sc, c, m.x0, by, m.x1 - m.x0, m.bandH, D.page, 0.32 * sk);
      for (const d of [24, 48]) { const x = m.x0 + d / 72 * (m.x1 - m.x0); for (const by of [m.b1, m.b2]) seg(sc, c, x, by - 3, x, by + m.bandH + 3, D.mute, 0.38 * sk); }
      const days = wd ? T(['Sat 2 Nov', 'Sun 3 Nov', 'Mon 4 Nov'], ['السبت 2 نوفمبر', 'الأحد 3 نوفمبر', 'الاثنين 4 نوفمبر']) : T(['2 Nov', '3 Nov', '4 Nov'], ['2 نوفمبر', '3 نوفمبر', '4 نوفمبر']);
      days.forEach((s, d) => sc.text(s, m.x0 + (d + 0.5) / 3 * (m.x1 - m.x0), m.ax, { size: wd ? zz(sc, 12) : 10.5, w: 600, color: D.mute, al: 'center', a: sk }));
      
      const size = wd ? clamp(W * 0.0034, 2.1, 2.8) : 1.7;
      const shown = [0, 0];
      m.L.forEach((L, li) => {
        for (let i = 0; i < L.n; i++) {
          if (t < L.ta[i]) continue;
          shown[li]++;
          const o = smooth((t - L.ta[i]) / 0.32);
          pt(sc, L.x[i], L.y[i] - (1 - o) * 9, o, L.z[i], 0.92, size, D.ink, t, i + li * 3000);
        }
      });
      
      const xa = m.x0 + hp / 72 * (m.x1 - m.x0), la = ph(t, 0.3, 0.2) * (1 - ph(t, 2.85, 0.35));
      for (const by of [m.b1, m.b2]) seg(sc, c, xa, by - 5, xa, by + m.bandH + 5, D.ink, 0.55 * la, 1);
      
      const v1 = shown[0] === m.L[0].n ? SIG : Math.round(SIG * shown[0] / m.L[0].n), v2 = shown[1] === m.L[1].n ? TRF : Math.round(TRF * shown[1] / m.L[1].n);
      const ca = ph(t, 0.05, 0.3), lab = [[T('signal readings', 'قراءة إشارة'), 'RSRP.csv'], [T('traffic records', 'سجل حركة'), 'TrafficVolume.csv']];
      [[v1, m.c1], [v2, m.c2]].forEach(([v, y], k) => {
        const s = fmtInt(v), bo = { size: m.big, w: 800, stretch: 'semi-condensed' };
        sc.text(s, pad, y, Object.assign({ a: ca }, bo));
        
        const lx = pad + sc.measure(fmtInt(k ? TRF : SIG), bo) + (wd ? 14 : 9);
        if (wd) {
          sc.text(lab[k][0], lx, y - m.big * 0.36, { size: zz(sc, 13.5), w: 650, a: ca });
          sc.text(lab[k][1], lx, y - m.big * 0.36 + zz(sc, 17), { size: zz(sc, 12), color: D.mute, a: ca });
        } else {
          sc.text(lab[k][0], lx, y - m.big * 0.3, { size: 11, w: 650, a: ca });
          sc.text(lab[k][1], lx, y - m.big * 0.3 + 12.5, { size: 10.5, color: D.mute, a: ca });
        }
      });
      const na = ph(t, 2.7, 0.4), ny = sc.H - pad + (wd ? 0 : 3);
      sc.text(T('One dot = 2,000 rows', 'النقطة = 2,000 صف'), pad, ny, { size: wd ? zz(sc, 12) : 10.5, color: D.mute, a: na });
      sc.text(T(wd ? 'Real counts, 2 to 4 Nov 2019' : 'Real counts, 2019', wd ? 'أرقام حقيقية، 2 إلى 4 نوفمبر 2019' : 'أرقام حقيقية، 2019'), W - pad, ny, { size: wd ? zz(sc, 12) : 10.5, color: D.mute, al: 'end', a: na });
    } };

  
  
  const RULES = [
    [474387, 'Kept 4G readings on mobile data', '4G on mobile data only', 'signal strength (RSRP) is a 4G measure',
             'إبقاء قراءات 4G على بيانات الجوال', 'قراءات 4G على بيانات الجوال', 'قوة الإشارة (RSRP) قياس لشبكة 4G وحدها'],
    [1677, 'Dropped exact duplicate rows', 'Exact duplicate rows', 'all 11 columns identical',
           'حذف الصفوف المكرّرة تمامًا', 'صفوف مكرّرة تمامًا', 'الأعمدة الإحدى عشرة متطابقة'],
    [187079, 'Dropped signal outside −140 to −40 dBm', 'Signal outside −140 to −40 dBm', 'outside the range RSRP can take',
             'حذف الإشارة خارج −140 إلى −40 dBm', 'إشارة خارج −140 إلى −40 dBm', 'خارج المدى الذي تأخذه RSRP'],
    [0, 'Kept readings inside Riyadh', 'Inside Riyadh', 'check passed: all inside the city box',
        'إبقاء القراءات داخل الرياض', 'داخل الرياض', 'فحص ناجح: كلها داخل حدود المدينة'],
    [0, 'Read every time with its own UTC offset', 'Each time with its UTC offset', 'check passed: every time stamp read',
        'قراءة كل توقيت مع فرقه عن التوقيت العالمي (UTC)', 'كل توقيت مع فرقه عن التوقيت العالمي', 'فحص ناجح: قُرئ كل توقيت'],
    [64, 'Kept the three full days, 2 to 4 Nov', 'Three full days only', 'time stamps outside the three days',
         'إبقاء الأيام الكاملة الثلاثة، من 2 إلى 4 نوفمبر', 'الأيام الكاملة الثلاثة', 'توقيتات خارج الأيام الثلاثة'],
    [0, 'Gave 38 handset aliases one name', '38 handset aliases, one name', 'renamed only',
        'توحيد اسم 38 جهازًا يحمل أكثر من اسم', 'اسم واحد لـ38 جهازًا', 'إعادة تسمية فقط'],
    [86574, 'One phone under several names: duplicates merged', 'Alias duplicates merged', 'same time, place, operator and signal',
            'هاتف واحد بعدة أسماء: دمج المكرّر', 'دمج مكرّر الأسماء', 'الوقت والمكان والمشغّل والإشارة نفسها'],
    [-1, 'Flagged 6 handset and operator pairs', '6 handset and operator pairs', 'fixed values; kept behind a switch',
         'وسم 6 أزواج من جهاز ومشغّل', '6 أزواج من جهاز ومشغّل', 'قيم ثابتة؛ تبقى خلف مفتاح'],
  ];
  const RAW = 2725353, LEFT = 1975572;
  const S2 = { dur: 3.6,
    aria: { en: 'The audit as a log of nine rules in order, each with the rows it removed and its reason: 4G on mobile data only removes 474,387; exact duplicates 1,677; signal outside −140 to −40 dBm 187,079; days outside 2 to 4 November 64; alias duplicates 86,574; four rules remove nothing and one flags six handset pairs. 2,725,353 rows become 1,975,572: 27.5% removed.',
            ar: 'التدقيق سجلًّا لتسع قواعد بالترتيب، كلٌّ بالصفوف التي حذفها وسببه: قراءات 4G على بيانات الجوال تحذف 474,387، والمكرّر تمامًا 1,677، والإشارة خارج −140 إلى −40 dBm تحذف 187,079، والأيام الناقصة 64، ومكرّر الأسماء 86,574؛ وأربع قواعد لا تحذف شيئًا وواحدة توسم ستة أزواج. فتصبح 2,725,353 صفًا 1,975,572: حُذف 27.5٪.' },
    build(W, H) {
      const wd = wide(W, H), pad = wd ? 24 : 14;
      const big = wd ? fsz(W, 0.06, 32, 50) : fsz(W, 0.072, 22, 26);
      const top = pad + big * 0.8;
      const y0 = top + (wd ? 22 : 12), rowH = (H - pad - y0 + (wd ? 4 : 6)) / 9;
      return { wd, pad, big, top, y0, rowH };
    },
    draw(sc, c, m, t) {
      const { W } = sc, wd = m.wd, pad = m.pad, at = i => 0.4 + i * 0.27;
      
      let val = RAW;
      RULES.forEach((r, i) => { if (r[0] > 0) val -= r[0] * smooth((t - at(i) - 0.04) / 0.24); });
      if (t > at(8) + 0.3) val = LEFT;
      const ca = ph(t, 0, 0.3), bo = { size: m.big, w: 800, stretch: 'semi-condensed' };
      sc.text(fmtInt(val), pad, m.top, Object.assign({ a: ca }, bo));
      const lx = pad + sc.measure(fmtInt(RAW), bo) + (wd ? 12 : 8);
      sc.text(T('rows', 'صف'), lx, m.top, { size: wd ? zz(sc, 14) : 11, color: D.mute, a: ca });
      const fa = ph(t, at(8) + 0.35, 0.35);
      if (wd) {
        sc.text(T('27.5% removed', 'حُذف 27.5٪'), W - pad, m.top - m.big * 0.32, { size: fsz(W, 0.028, 17, 24), w: 750, color: D.acc, al: 'end', a: fa });
        sc.text(T('749,781 rows, each with its rule', '749,781 صفًا، كلٌّ بقاعدته'), W - pad, m.top, { size: zz(sc, 12), color: D.acc, al: 'end', a: fa });
      } else sc.text(T('27.5% removed', 'حُذف 27.5٪'), W - pad, m.top, { size: 12.5, w: 750, color: D.acc, al: 'end', a: fa });
      
      const sm = W < 600, f1 = wd ? (sm ? 12 : fsz(W, 0.019, 13, 15.5)) : 11, f2 = wd ? (sm ? 11 : fsz(W, 0.017, 12, 14)) : 10.5, nx = wd ? (sm ? 20 : 26) : 17;
      for (let i = 0; i < 9; i++) {
        const r = RULES[i], y = m.y0 + i * m.rowH, a = ph(t, at(i), 0.22), dx = (1 - a) * 10;
        seg(sc, c, pad, y - 2, W - pad, y - 2, D.page, 0.9 * ph(t, 0, 0.3));
        const cur = clamp(a, 0, 1) * (1 - ph(t, at(i + 1), 0.25));
        box(sc, c, pad, y - 1, W - 2 * pad, m.rowH - 2, D.page, 0.55 * cur * (i === 8 ? 1 - ph(t, at(8) + 0.35, 0.3) : 1));
        if (a <= 0.003) continue;
        const b1 = y + (wd && !sm ? m.rowH * 0.42 : m.rowH * 0.41), b2 = b1 + (wd ? f2 + (sm ? 2 : 5) : 11.5);
        sc.text(String(i + 1), pad + 4 + dx, b1, { size: f1, w: 650, color: D.mute, a });
        const name = AR ? (wd ? r[4] : r[5]) : (wd ? r[1] : r[2]);
        sc.text(name, pad + nx + dx, b1, { size: f1, w: 650, a });
        sc.text(AR ? r[6] : r[3], pad + nx + dx, b2, { size: f2, color: D.mute, a });
        const n = r[0], cnt = n > 0 ? '−' + fmtInt(n) : n === 0 ? T('none removed', 'لا حذف') : T('flagged, kept', 'وسم فقط');
        sc.text(cnt, W - pad - 4, b1, { size: f1, w: n > 0 ? 700 : 500, color: n > 0 ? D.ink : D.mute, al: 'end', a });
      }
    } };

  
  
  
  
  const BLK = { la0: 24.61, lo0: 46.72, n: [
    [[1448, 142, 224], [1878, 1227, 580], [152, 30, 97], [296, 1108, 103], [1975, 365, 319], [479, 1370, 230]],
    [[2793, 1499, 128], [2100, 1417, 183], [1841, 791, 213], [1346, 960, 274], [856, 411, 46], [735, 717, 90]],
    [[47129, 26, 286], [1768, 399, 348], [935, 1516, 229], [71, 857, 98], [681, 11074, 274], [466, 1640, 138]],
    [[85, 14, 0], [149, 183, 0], [2022, 458, 123], [627, 841, 4], [159, 2301, 343], [580, 4485, 0]]] };
  const S3 = { dur: 3.7,
    aria: { en: 'A close-up of 24 real 1 km cells of central Riyadh: readings fall into their cells and become a count for each operator; the rule then keeps only the cells where operators A, B and C each have 150 readings or more: 10 of these 24, and 306 of the 1,588 cells with readings across Riyadh.',
            ar: 'لقطة قريبة لأربع وعشرين خلية حقيقية من 1 كم في وسط الرياض: تسقط القراءات في خلاياها وتصير عددًا لكل مشغّل؛ ثم تُبقي القاعدة الخلايا التي لكلٍّ من A و B و C فيها 150 قراءة أو أكثر: 10 من هذه الأربع والعشرين، و306 من 1,588 خلية فيها قراءات في الرياض كلها.' },
    build(W, H) {
      const wd = wide(W, H), pad = wd ? 24 : 14, rnd = mkRnd(3303);
      const cols = wd ? 6 : 4, rows = wd ? 4 : 3;
      const topH = wd ? 30 : 22, botH = wd ? 66 : 40;
      const aw = W - 2 * pad, ah = H - 2 * pad - topH - botH;
      let cw, ch;
      if (wd) { ch = Math.min(ah / rows, aw / (cols * 0.908)); cw = ch * 0.908; }   
      else { cw = aw / cols; ch = Math.min(ah / rows, cw * 1.05); }
      const gx = (W - cols * cw) / 2, gy = pad + topH + (ah - rows * ch) / 2;
      const cells = []; let pass = 0;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const n = BLK.n[r][k], ok = n.every(v => v >= 150); if (ok) pass++;
        
        const x = gx + k * cw, y = gy + r * ch;
        const nd = Math.round(clamp(Math.sqrt(n[0] + n[1] + n[2]) / 3.2, 4, 26)), d = [];
        for (let i = 0; i < nd; i++) d.push({ x: x + 5 + rnd() * (cw - 10), y: y + 5 + rnd() * (ch - 10), y0: y - 30 - rnd() * 90, dl: 0.15 + rnd() * 0.75, z: rnd() });
        cells.push({ r, k, x, y, n, ok, d, ord: r * cols + (AR ? cols - 1 - k : k) });
      }
      return { wd, pad, cols, rows, cw, ch, gx, gy, cells, pass, topH, botH, N: rows * cols };
    },
    draw(sc, c, m, t) {
      const { W, H } = sc, wd = m.wd, pad = m.pad;
      const L = x => AR ? W - x : x;                     
      const sk = ph(t, 0, 0.35), num = ph(t, 1.2, 0.6), dotOut = ph(t, 1.25, 0.4);
      const fs = wd ? (W < 600 ? 11 : fsz(W, 0.0185, 12, 15.5)) : 10.5, lh = wd ? fs * 1.45 : 13;
      const la = m.rows === 4 ? 24.58 : 24.59, lo1 = (46.72 + (m.cols - 1) * 0.01).toFixed(2);
      sc.text(wd && W >= 600 ? T(`Readings of each operator in 24 real 1 km cells, ${la} to 24.61 N, 46.72 to ${lo1} E`, `قراءات كل مشغّل في 24 خلية حقيقية من 1 كم، بين خطَّي العرض ${la} و24.61 وخطَّي الطول 46.72 و${lo1}`)
                 : T(`Readings per operator, ${m.N} real cells`, `قراءات كل مشغّل، ${m.N} خلية حقيقية`),
        pad, pad + (wd ? 12 : 9), { size: wd ? zz(sc, 12.5) : 10.5, color: D.mute, a: sk });
      sc.text(T(wd && W >= 600 ? 'underlined: fewer than 150' : 'underlined: under 150', 'تحته خط: أقل من 150'), W - pad, pad + (wd ? 12 : 9), { size: wd ? zz(sc, 12.5) : 10.5, color: D.mute, al: 'end', a: ph(t, 2.1, 0.4) });
      for (const cl of m.cells) {
        const ct = 2.0 + cl.ord / (m.N - 1) * 0.85, chk = ph(t, ct, 0.18);
        
        c.globalAlpha = 0.5 * sk + (cl.ok ? 0.4 * chk : -0.2 * chk); c.fillStyle = D.page;
        c.fillRect(cl.x + 1, cl.y + 1, m.cw - 2, m.ch - 2);
        if (cl.ok && chk > 0) { c.globalAlpha = chk; c.strokeStyle = D.acc; c.lineWidth = 1.5; c.strokeRect(cl.x + 1.75, cl.y + 1.75, m.cw - 3.5, m.ch - 3.5); }
        
        if (dotOut < 1) for (let i = 0; i < cl.d.length; i++) {
          const p = cl.d[i], s = clamp(spring(t - p.dl, 0.7, 0.85), -0.2, 1.2);
          if (t < p.dl) continue;
          c.globalAlpha = 0.85 * (1 - dotOut) * clamp(s * 1.5, 0, 1); c.fillStyle = D.ink;
          c.fillRect(p.x - 1, lerp(p.y0, p.y, s) - 1, 2, 2);
        }
        if (num <= 0) continue;
        const cy = cl.y + m.ch / 2 - lh + fs * 0.36, xs = AR ? cl.x + m.cw - 7 : cl.x + 7, xe = AR ? cl.x + 7 : cl.x + m.cw - 7;
        ['A', 'B', 'C'].forEach((op, j) => {
          const v = cl.n[j], low = v < 150;
          
          const a = num * (cl.ok ? 1 : (low ? 1 : 1 - 0.68 * chk));
          sc.text(op, L(xs), cy + j * lh, { size: fs, w: 600, color: D.mute, a });
          sc.text(fmtInt(Math.round(v * num)), L(xe), cy + j * lh, { size: fs, w: low && chk > 0.5 && !cl.ok ? 800 : 600, color: D.ink, al: 'end', a });
          if (low && !cl.ok && chk > 0) {
            const tw = sc.measure(fmtInt(v), { size: fs, w: 800 }), ux = AR ? xe : xe - tw;
            c.globalAlpha = chk; c.fillStyle = D.ink; c.fillRect(ux, cy + j * lh + (wd ? 3 : 2.5), tw * chk, 1.5);
          }
        });
      }
      
      const ea = ph(t, 2.95, 0.4), by = H - pad - (wd ? 4 : 0);
      if (wd) {
        const big = fsz(W, 0.06, 32, 52);
        sc.text('306', pad, by, { size: big, w: 800, stretch: 'semi-condensed', color: D.acc, a: ea });
        const bw = sc.measure('306', { size: big, w: 800, stretch: 'semi-condensed' }) + 12;
        sc.text(T('fair cells across Riyadh', 'خلية منصفة في الرياض كلها'), pad + bw, by - big * 0.38, { size: zz(sc, 14), w: 650, color: D.acc, a: ea });
        sc.text(T('of 1,588 cells with readings', 'من 1,588 خلية فيها قراءات'), pad + bw, by - big * 0.38 + zz(sc, 18), { size: zz(sc, 12.5), color: D.ink, a: ea });
        sc.text(T(`here ${m.pass} of ${m.N}`, `هنا ${m.pass} من ${m.N}`), W - pad, by - big * 0.38 + zz(sc, 18), { size: zz(sc, 12.5), color: D.mute, al: 'end', a: ea });
      } else {
        sc.text('306', pad, by, { size: 24, w: 800, stretch: 'semi-condensed', color: D.acc, a: ea });
        const bw = sc.measure('306', { size: 24, w: 800, stretch: 'semi-condensed' }) + 7;
        sc.text(T('fair cells in Riyadh', 'خلية منصفة في الرياض'), pad + bw, by - 11, { size: 10.5, w: 650, color: D.acc, a: ea });
        sc.text(T('of 1,588 with readings', 'من 1,588 فيها قراءات'), pad + bw, by + 1, { size: 10.5, color: D.ink, a: ea });
        sc.text(T(`here ${m.pass} of ${m.N}`, `هنا ${m.pass} من ${m.N}`), W - pad, by + 1, { size: 10.5, color: D.mute, al: 'end', a: ea });
      }
    } };

  
  
  
  
  const ACT = [[24.69, 46.77, -93.7, -72.7, -77.4, 'B', -21.0, 6707], [24.58, 46.70, -95.3, -76.0, -76.9, 'B', -19.3, 6050],
    [24.63, 46.66, -103.0, -78.1, -79.7, 'B', -24.9, 624], [24.80, 46.74, -93.7, -83.6, -77.4, 'C', -16.3, 13818],
    [24.64, 46.74, -96.0, -75.3, -77.4, 'B', -20.7, 1536], [24.70, 46.77, -95.7, -83.2, -77.9, 'C', -17.8, 3990],
    [24.62, 46.75, -91.0, -81.7, -72.5, 'C', -18.5, 1744], [24.69, 46.66, -91.8, -89.4, -68.3, 'C', -23.5, 309]];
  const S4 = { dur: 3.6,
    aria: { en: 'Operator A against the best rival in each fair cell. In the cell at 24.69 N, 46.77 E, A reads −93.7 dBm, B −72.7 and C −77.4: A is 21.0 dB behind its best rival, B. A trails in 248 of the 306 fair cells; the action list ranks them by the gap and A’s readings, this cell first.',
            ar: 'المشغّل A أمام أفضل منافس في كل خلية منصفة. في الخلية عند 24.69 شمالًا و46.77 شرقًا يقرأ A ‎−93.7 dBm و B ‎−72.7 و C ‎−77.4: فـA متأخّر 21.0 ديسيبل عن أفضل منافسيه B. ويتأخّر A في 248 من 306 خلايا منصفة؛ وقائمة الإجراءات ترتّبها بالفارق وبقراءات A، وهذه الخلية أولها.' },
    build(W, H) {
      const wd = wide(W, H), pad = wd ? 24 : 14;
      const m = { wd, pad };
      m.lab = pad + (wd ? 13 : 10);
      m.ax = pad + (wd ? 92 : 62);                        
      m.ly = m.ax + (wd ? 76 : 50);                       
      const nr = wd ? 8 : 5;
      m.nr = nr; m.hy = m.ly + (wd ? 26 : 17); m.rh = (H - pad - m.hy - (wd ? 4 : 2)) / nr;
      m.x0 = pad + (wd ? 40 : 18); m.x1 = W - pad - (wd ? 40 : 18);
      m.sx = v => m.x0 + (v + 105) / 40 * (m.x1 - m.x0);  
      return m;
    },
    draw(sc, c, m, t) {
      const { W } = sc, wd = m.wd, pad = m.pad, r0 = ACT[0];
      const sk = ph(t, 0, 0.3), fa = ph(t, 0.25, 0.3), fb = ph(t, 0.55, 0.3), gp = ph(t, 0.95, 0.45), la = ph(t, 1.45, 0.3);
      sc.text(wd ? T('Operator A in one fair cell, 24.69 N 46.77 E', 'المشغّل A في خلية منصفة واحدة، 24.69 شمالًا و46.77 شرقًا')
                 : T('A in one fair cell, 24.69 N 46.77 E', 'A في خلية منصفة، 24.69 شمالًا و46.77 شرقًا'), pad, m.lab, { size: wd ? zz(sc, 12.5) : 10.5, color: D.mute, a: sk });
      
      seg(sc, c, m.x0, m.ax, m.x1, m.ax, D.mute, 0.55 * sk);
      for (const v of [-100, -90, -80, -70]) {
        seg(sc, c, m.sx(v), m.ax - 3, m.sx(v), m.ax + 3, D.mute, 0.55 * sk);
        sc.text('−' + Math.abs(v), m.sx(v), m.ax + (wd ? 18 : 14), { size: wd ? zz(sc, 11.5) : 10.5, color: D.mute, al: 'center', a: sk });
      }
      sc.text('dBm', m.x1 + (wd ? 8 : 4), m.ax + (wd ? 18 : 14), { size: wd ? zz(sc, 11.5) : 10.5, color: D.mute, a: sk });
      
      const xa = m.sx(r0[2]), xb = m.sx(r0[3]), xc = m.sx(r0[4]);
      if (gp > 0) { seg(sc, c, xa, m.ax, lerp(xa, xb, gp), m.ax, D.acc, gp, 3); }
      const rr = wd ? 6 : 4.5;
      disc(sc, c, xc, m.ax, rr, D.mute, fb); disc(sc, c, xb, m.ax, rr, D.ink, fb); disc(sc, c, xa, m.ax, rr, D.ink, fa);
      const fl = wd ? 13 : 10.5, up = wd ? 14 : 10;
      sc.text('A  ' + neg(r0[2]), xa, m.ax - up, { size: fl, w: 700, al: 'center', a: fa });
      sc.text('B  ' + neg(r0[3]), xb, m.ax - up, { size: fl, w: 700, al: 'center', a: fb });
      sc.text('C  ' + neg(r0[4]), xc, m.ax + (wd ? 40 : 29), { size: fl, color: D.mute, al: 'center', a: fb });
      if (wd) sc.text(T('best rival', 'أفضل منافس'), xb, m.ax - up - zz(sc, 18), { size: zz(sc, 11.5), color: D.mute, al: 'center', a: fb });
      sc.text(T('gap ', 'الفارق ') + neg(r0[6]) + T(' dB', ' ديسيبل'), (xa + xb) / 2, m.ax - up - (wd ? 2 : 0), { size: wd ? zz(sc, 15) : 11.5, w: 750, color: D.acc, al: 'center', a: gp });
      
      sc.text(wd ? T('A behind in 248 of 306 fair cells; the first ' + m.nr + ', ranked by gap and readings', `A متأخّر في 248 من 306 خلايا منصفة؛ أول ${m.nr}، مرتّبة بالفارق والقراءات`)
                 : T('A behind in 248 of 306; the first 5 by gap', 'A متأخّر في 248 من 306؛ أول 5 بالفارق'),
        pad, m.ly, { size: wd ? zz(sc, 13.5) : 10.5, w: 650, a: la });
      const cols = wd ? [[0, 'start', '#'], [0.06, 'start', T('cell, N and E', 'الخلية، شمالًا وشرقًا')], [0.48, 'end', T('A, dBm', 'A، dBm')], [0.67, 'end', T('best rival', 'أفضل منافس')], [0.83, 'end', T('gap, dB', 'الفارق، dB')], [1, 'end', T('A readings', 'قراءات A')]]
                      : [[0, 'start', '#'], [0.07, 'start', T('cell, N and E', 'الخلية، شمالًا وشرقًا')], [0.72, 'end', T('gap, dB', 'الفارق')], [1, 'end', T('A readings', 'قراءات A')]];
      const cw = W - 2 * pad, fr = wd ? fsz(W, 0.0185, 12.5, 15) : 10.5, ha = ph(t, 1.6, 0.25);
      cols.forEach(([x, al, s]) => sc.text(s, pad + x * cw, m.hy, { size: wd ? zz(sc, 11.5) : 10.5, color: D.mute, al, a: ha }));
      seg(sc, c, pad, m.hy + (wd ? 7 : 5), W - pad, m.hy + (wd ? 7 : 5), D.page, ha);
      for (let i = 0; i < m.nr; i++) {
        const r = ACT[i], a = ph(t, 1.75 + i * 0.17, 0.25), y = m.hy + (wd ? 7 : 5) + (i + 0.72) * m.rh + (1 - a) * 8;
        if (a <= 0.003) continue;
        if (i === 0) box(sc, c, pad, y - m.rh * 0.72 + 1, cw, m.rh - 2, D.page, 0.75 * a);
        const ll = r[0].toFixed(2) + T(', ', '، ') + r[1].toFixed(2);      
        const vals = wd ? [String(i + 1), ll, neg(r[2]), r[5] + '  ' + neg(r[r[5] === 'B' ? 3 : 4]), neg(r[6]), fmtInt(r[7])]
                        : [String(i + 1), ll, neg(r[6]), fmtInt(r[7])];
        vals.forEach((s, j) => {
          const isGap = wd ? j === 4 : j === 2;
          sc.text(s, pad + cols[j][0] * cw + (j === 0 ? 4 : 0), y, { size: fr, w: isGap ? 750 : (j === 0 ? 600 : 500), color: j === 0 ? D.mute : (isGap && i === 0 ? D.acc : D.ink), al: cols[j][1], a });
        });
      }
    } };

  
  
  
  const MODELS = [['Seasonal naive', 'الساذج الموسمي', 1.0], ['Naive (last hour)', 'الساذج (الساعة الأخيرة)', 0.785], ['Holt-Winters', 'Holt-Winters', 0.867],
                  ['Gradient boosting', 'التعزيز التدرّجي', 0.957], ['Prophet', 'Prophet', 0.782], ['SARIMA', 'SARIMA', 0.756]];
  const S5 = { dur: 3.8,
    aria: { en: 'Left, the fixed-effects test: traffic is compared with signal only inside the same 1 km cell and the same hour; 10 dB more signal comes with 2.4% less downlink traffic, p = 0.57, no real effect. Below, six forecasts scored 24 hours ahead sort themselves by error: SARIMA 0.756, Prophet 0.782, naive 0.785, Holt-Winters 0.867, gradient boosting 0.957, seasonal naive 1.000.',
            ar: 'اختبار التأثيرات الثابتة: تُقارَن الحركة بالإشارة داخل الخلية نفسها من 1 كم والساعة نفسها فقط؛ فزيادة 10 ديسيبل في الإشارة تقابلها حركة تنزيل أقل بـ2.4٪، و p = 0.57، أي لا أثر حقيقي. وتحتها ست طرق توقّع تُقاس قبل 24 ساعة وتترتّب بخطئها: SARIMA ‏0.756، و Prophet ‏0.782، والساذج 0.785، و Holt-Winters ‏0.867، والتعزيز التدرّجي 0.957، والساذج الموسمي 1.000.' },
    build(W, H) {
      const wd = wide(W, H), pad = wd ? 24 : 14;
      const m = { wd, pad };
      m.gr = wd ? 7 : 4;                                  
      m.gw = (W - 2 * pad) * (wd ? 0.52 : 0.5);
      m.gx = pad; m.gy = pad + (wd ? 26 : 19);
      m.bs = m.gw / 24; m.bh = wd ? Math.min(m.bs * 1.35, 24) : Math.min(m.bs * 2.2, 15);
      m.gh = m.gr * m.bh;
      m.ly = m.gy + m.gh + (wd ? 66 : 44);                 
      m.ry0 = m.ly + (wd ? 10 : 5); m.rh = Math.min(wd ? 40 : 22, (H - pad - m.ry0) / 6);
      m.cell = wd ? 3 : 2; m.hour = 18;                   
      return m;
    },
    draw(sc, c, m, t) {
      const { W } = sc, wd = m.wd, pad = m.pad;
      const sk = ph(t, 0, 0.35), rowL = ph(t, 0.45, 0.3), colL = ph(t, 0.75, 0.3), hit = ph(t, 1.05, 0.25), res = ph(t, 1.3, 0.35);
      sc.text(T('1 km cells by hour of the day', 'خلايا 1 كم حسب ساعة اليوم'), pad, pad + (wd ? 12 : 9), { size: wd ? zz(sc, 12.5) : 10.5, color: D.mute, a: sk });
      
      for (let r = 0; r < m.gr; r++) for (let h = 0; h < 24; h++) {
        const inRow = r === m.cell, inCol = h === m.hour;
        const x = m.gx + h * m.bs + 0.6, y = m.gy + r * m.bh + 0.6, w = m.bs - 1.4, hh = m.bh - 1.4;
        box(sc, c, x, y, w, hh, D.page, 0.9 * sk);
        const lit = (inRow ? rowL : 0) + (inCol ? colL : 0);
        if (lit > 0 && !(inRow && inCol)) box(sc, c, x, y, w, hh, D.mute, 0.32 * Math.min(1, lit));
      }
      const hx = m.gx + m.hour * m.bs, hy = m.gy + m.cell * m.bh;
      box(sc, c, hx + 0.6, hy + 0.6, m.bs - 1.4, m.bh - 1.4, D.ink, hit * 0.95);
      const ly = m.gy + m.gh + (wd ? 20 : 14);
      sc.text(T('same cell, same hour', 'الخلية نفسها والساعة نفسها'), m.gx, ly, { size: wd ? zz(sc, 12.5) : 10.5, w: 650, a: hit });
      if (wd) sc.text(T('hours 0 to 23', 'الساعات 0 إلى 23'), m.gx + m.gw, ly, { size: 11.5, color: D.mute, al: 'end', a: sk });
      
      const rx = m.gx + m.gw + (wd ? 30 : 12), big = wd ? fsz(W, 0.058, 32, 50) : 22, ry = m.gy + big * 0.8;
      sc.text(T('−2.4%', '−2.4٪'), rx, ry, { size: big, w: 800, stretch: 'semi-condensed', a: res });
      const sz = wd ? fsz(W, 0.018, 12.5, 15) : 10.5, lh = wd ? sz * 1.38 : 12.5, mw = W - pad - rx;
      const ls = [[wd ? T('downlink traffic for 10 dB more signal', 'في حركة التنزيل مع إشارة أقوى بـ10 ديسيبل') : T('downlink, +10 dB signal', 'التنزيل، إشارة أقوى بـ10 ديسيبل'), D.ink],
                  [T('p = 0.57: no real effect', 'p = 0.57: لا أثر حقيقي'), D.ink], [T('all four estimates below zero', 'التقديرات الأربعة كلها تحت الصفر'), D.mute]];
      let yy = ry + (wd ? 24 : 15);
      ls.forEach(([s, col], i) => { if (!wd && i === 2) return; const n = sc.para(s, rx, yy, mw, lh, { size: sz, w: i === 1 ? 700 : 500, color: col, a: res }); yy += n * lh + (wd ? 4 : 1); });
      
      const fa = ph(t, 1.55, 0.3), fs = wd ? fsz(W, 0.02, 13.5, 17) : 10.5, hs = wd ? 11.5 : 10.5;
      sc.text(T('Six forecasts scored 24 hours ahead', 'ست طرق توقّع، تُقاس قبل 24 ساعة'), pad, m.ly - (wd ? 18 : 13), { size: wd ? zz(sc, 13.5) : 10.5, w: 650, a: fa });
      const xp = W - pad - (wd ? 0.2 : 0.17) * (W - 2 * pad);
      sc.text(T('vs seasonal naive', 'أمام الساذج الموسمي'), xp, m.ly, { size: hs, color: D.mute, al: 'end', a: fa });
      sc.text(wd && W >= 600 ? T('MASE, lower is better', 'MASE، الأقل أفضل') : 'MASE', W - pad - 4, m.ly, { size: hs, color: D.mute, al: 'end', a: fa });
      seg(sc, c, pad, m.ly + (wd ? 7 : 4), W - pad, m.ly + (wd ? 7 : 4), D.page, fa);
      const order = MODELS.map((x, i) => i).sort((a, b) => MODELS[a][2] - MODELS[b][2]);
      MODELS.forEach((md, i) => {
        const fin = order.indexOf(i), mv = clamp(spring(t - 2.15 - (5 - fin) * 0.04, 0.75, 0.8), 0, 1.08);
        const slot = lerp(i, fin, mv), y = m.ry0 + (wd ? 7 : 4) + (slot + 0.68) * m.rh, a = ph(t, 1.65 + i * 0.07, 0.25);
        if (a <= 0.003) return;
        const win = md[2] === 0.756, wa = ph(t, 2.75, 0.3), col = win && wa > 0.5 ? D.acc : D.ink;
        if (win) box(sc, c, pad, y - m.rh * 0.68 + 1, W - 2 * pad, m.rh - 2, D.page, 0.75 * wa);
        sc.text(String(fin + 1), pad + 4, y, { size: fs, w: 650, color: D.mute, a: ph(t, 2.85, 0.3) * a });
        sc.text(AR ? md[1] : md[0], pad + (wd ? 30 : 18), y, { size: fs, w: win ? 750 : 550, color: col, a });
        
        const pv = ((1 - md[2]) * 100).toFixed(1);
        const pc = md[2] === 1 ? T('the yardstick', 'المقياس') : T(pv + '% better', 'أفضل بـ' + pv + '٪');
        sc.text(pc, xp, y, { size: fs, color: md[2] === 1 ? D.mute : col, w: win ? 700 : 500, al: 'end', a });
        sc.text(md[2].toFixed(3), W - pad - 4, y, { size: fs, w: win ? 800 : 600, color: col, al: 'end', a });
      });
    } };

  
  
  
  
  const PAGES = [
    { n: ['Network health', 'صحة الشبكة'], r: [[0, 0, .5, .1], [.5, 0, .25, .1], [.75, 0, .25, .1], [0, .1, .25, .08], [.25, .1, .25, .08], [.5, .1, .25, .08], [.75, .1, .25, .08],
      [0, .19, .66, .3], [.66, .19, .34, .15], [.66, .34, .34, .15], [0, .5, 1, .11], [0, .62, .5, .19], [.5, .62, .5, .19], [0, .82, 1, .18]] },
    { n: ['Coverage and traffic', 'التغطية والحركة'], r: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]] },
    { n: ['Device and data quality', 'الأجهزة وجودة البيانات'], r: [[0, 0, .66, .2], [.66, 0, .34, .2], [0, .2, .6, .17], [.6, .2, .4, .17], [0, .37, .5, .14], [.5, .37, .5, .14],
      [0, .51, .5, .14], [.5, .51, .5, .14], [0, .65, .66, .15], [.66, .65, .34, .15], [0, .8, 1, .11], [0, .91, .33, .09], [.33, .91, .34, .09], [.67, .91, .33, .09]] },
    { n: ['Forecast and impact', 'التوقّع والأثر'], r: [[0, 0, .25, .12], [.25, 0, .25, .12], [.5, 0, .25, .12], [.75, 0, .25, .12], [0, .13, .66, .3], [.66, .13, .34, .3],
      [0, .44, .66, .3], [.66, .44, .34, .3], [0, .75, .33, .25], [.33, .75, .34, .25], [.67, .75, .33, .25]] },
  ];
  const S6 = { dur: 3.7,
    aria: { en: 'One file, dashboard.html, 6.2 MB, opens with no server and no outside calls. It unfolds into its four pages, network health, coverage and traffic, device and data quality, forecast and impact; one filter bar sits over all of them, and switching the operator from A to B redraws every view on every page.',
            ar: 'ملف واحد، dashboard.html، حجمه 6.2 ميجابايت، يُفتح بلا خادم ولا أي اتصال خارجي. ينفتح على صفحاته الأربع: صحة الشبكة، والتغطية والحركة، والأجهزة وجودة البيانات، والتوقّع والأثر؛ وفوقها شريط مرشّحات واحد، فتبديل المشغّل من A إلى B يعيد رسم كل عرض في كل صفحة.' },
    build(W, H) {
      const wd = wide(W, H), pad = wd ? 24 : 14;
      const m = { wd, pad };
      if (wd) {
        m.fw = fsz(W, 0.085, 52, 76); m.fh = m.fw * 1.28; m.fx = pad; m.fy = pad + 8;
        m.ax = pad + Math.max(m.fw, 150) + 26; m.aw = W - pad - m.ax;
        m.bar = pad + 4; m.barH = 24;
        m.py = m.bar + m.barH + 14; m.tg = 22; m.ph = (H - pad - m.py - m.tg * 2 - 10 - 30) / 2;
      } else {
        m.fw = 26; m.fh = 33; m.fx = pad; m.fy = pad;
        m.ax = pad; m.aw = W - 2 * pad;
        m.bar = m.fy + m.fh + 10; m.barH = 19;
        m.py = m.bar + m.barH + 9; m.tg = 15; m.ph = (H - pad - m.py - m.tg * 2 - 6) / 2;
      }
      m.pw = (m.aw - (wd ? 14 : 8)) / 2;
      m.pages = PAGES.map((p, i) => ({ x: m.ax + (i % 2) * (m.pw + (wd ? 14 : 8)), y: m.py + Math.floor(i / 2) * (m.ph + m.tg + (wd ? 10 : 6)) + m.tg }));
      return m;
    },
    draw(sc, c, m, t) {
      const { W } = sc, wd = m.wd, pad = m.pad;
      const fa = ph(t, 0, 0.35), op = ph(t, 0.35, 0.9), flip = ph(t, 2.2, 0.15);
      
      const fx = m.fx, fy = m.fy, fw = m.fw, fh = m.fh, k = fw * 0.26;
      c.globalAlpha = fa; c.fillStyle = D.page; c.beginPath();
      const P = (x, y) => [sc.X(x), y];
      c.moveTo(...P(fx, fy)); c.lineTo(...P(fx + fw - k, fy)); c.lineTo(...P(fx + fw, fy + k)); c.lineTo(...P(fx + fw, fy + fh)); c.lineTo(...P(fx, fy + fh)); c.closePath(); c.fill();
      c.globalAlpha = fa; c.fillStyle = D.mute; c.beginPath(); c.moveTo(...P(fx + fw - k, fy)); c.lineTo(...P(fx + fw - k, fy + k)); c.lineTo(...P(fx + fw, fy + k)); c.closePath(); c.fill();
      sc.text('HTML', fx + fw / 2, fy + fh * 0.66, { size: wd ? zz(sc, 12) : 8.5, w: 750, color: D.ink, al: 'center', a: fa * (wd ? 1 : 0) });
      if (wd) {
        let y = fy + fh + 26;
        sc.text('dashboard.html', fx, y, { size: zz(sc, 14), w: 700, a: fa }); y += zz(sc, 19);
        sc.text(T('6.2 MB, one file', '6.2 ميجابايت، ملف واحد'), fx, y, { size: zz(sc, 12.5), color: D.mute, a: fa }); y += zz(sc, 30);
        const oa = ph(t, 1.3, 0.4);
        sc.text(T('Opens offline', 'يعمل دون اتصال'), fx, y, { size: zz(sc, 14), w: 700, a: oa }); y += zz(sc, 19);
        sc.text(T('no server', 'بلا خادم'), fx, y, { size: zz(sc, 12.5), color: D.mute, a: oa }); y += zz(sc, 17);
        sc.text(T('no map tiles', 'بلا خرائط من الخارج'), fx, y, { size: zz(sc, 12.5), color: D.mute, a: oa }); y += zz(sc, 17);
        sc.text(T('no outside calls', 'بلا أي اتصال خارجي'), fx, y, { size: zz(sc, 12.5), color: D.mute, a: oa });
      } else {
        const tx = fx + fw + 9;
        sc.text('dashboard.html', tx, fy + 12, { size: 11, w: 700, a: fa });
        sc.text(T('6.2 MB, opens offline: no server, no outside calls', '6.2 ميجابايت، يعمل دون اتصال وبلا خادم'), tx, fy + 26, { size: 10.5, color: D.mute, a: fa });
      }
      
      const ba = ph(t, 1.15, 0.35), bx = m.ax, by = m.bar;
      box(sc, c, bx, by, m.aw, m.barH, D.page, 0.55 * ba);
      const cs = wd ? 12 : 10.5, chipW = sc.measure(T('Operator A', 'المشغّل A'), { size: cs, w: 700 }) + (wd ? 18 : 12);
      const lx = bx + (wd ? 10 : 6), lab = T('My network', 'شبكتي'), lw = sc.measure(lab, { size: cs }) + (wd ? 8 : 5);
      sc.text(lab, lx, by + m.barH * 0.68, { size: cs, color: D.mute, a: ba });
      const cx = lx + lw;
      box(sc, c, cx, by + 3, chipW, m.barH - 6, flip > 0.5 ? D.acc : D.ink, ba * (flip > 0.5 ? 0.95 : 0.9) * (flip > 0 && flip < 1 ? 0.6 + 0.4 * Math.abs(1 - 2 * flip) : 1));
      sc.text(flip > 0.5 ? T('Operator B', 'المشغّل B') : T('Operator A', 'المشغّل A'), cx + chipW / 2, by + m.barH * 0.68, { size: cs, w: 700, color: D.surf, al: 'center', a: ba });
      sc.text(T('2 to 4 Nov', '2 إلى 4 نوفمبر'), bx + m.aw - (wd ? 10 : 6), by + m.barH * 0.68, { size: cs, color: D.mute, al: 'end', a: ba });
      
      m.pages.forEach((pg, i) => {
        const pa = ph(t, 0.35 + i * 0.12, 0.6), u = smooth(pa);
        const x = lerp(fx + fw / 2 - m.pw / 2 * 0.2, pg.x, u), y = lerp(fy + fh / 2, pg.y, u), w = m.pw * lerp(0.2, 1, u), h = m.ph * lerp(0.2, 1, u);
        if (pa <= 0.003) return;
        sc.text(PAGES[i].n[AR ? 1 : 0], x, y - (wd ? 8 : 5), { size: wd ? zz(sc, 12.5) : 10.5, w: 650, a: ph(t, 0.75 + i * 0.12, 0.3) });
        frame(sc, c, x, y, w, h, D.mute, 0.5 * pa, 1);
        const ins = wd ? 5 : 3, g = wd ? 2.5 : 1.5;
        PAGES[i].r.forEach((r, j) => {
          const va = ph(t, 0.95 + i * 0.12 + j * 0.025, 0.3);
          
          const wv = t - 2.3 - (i * 0.1 + j * 0.018), pulse = wv > 0 ? Math.exp(-wv * 5.5) * smooth(wv / 0.06) : 0;
          const vx = x + ins + r[0] * (w - 2 * ins) + g / 2, vy = y + ins + r[1] * (h - 2 * ins) + g / 2;
          const vw = r[2] * (w - 2 * ins) - g, vh = r[3] * (h - 2 * ins) - g;
          if (vw <= 0 || vh <= 0) return;
          box(sc, c, vx, vy, vw, vh, D.page, va * 0.95);
          if (vh > (wd ? 14 : 9) && vw > 16) box(sc, c, vx + (wd ? 4 : 2.5), vy + (wd ? 4 : 2.5), Math.min(vw * 0.42, wd ? 60 : 30), wd ? 2 : 1.5, D.mute, va * 0.55);
          box(sc, c, vx, vy, vw, vh, D.ink, va * pulse * 0.6);
        });
      });
      const na = ph(t, 2.95, 0.4);
      if (wd) sc.text(T('One pick redraws every view on all four pages', 'اختيار واحد يعيد رسم كل عرض في الصفحات الأربع'), m.ax, sc.H - pad + 2, { size: 12.5, color: D.mute, a: na });
    } };

  K.STEPS['riyadh-4g'] = [S1, S2, S3, S4, S5, S6];
})();
