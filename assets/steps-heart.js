






(() => {
  'use strict';
  const K = window.KIT, AR = K.AR, D = K.DARK;
  const { clamp, lerp, smooth, spring, fmtInt } = K;
  const T = (en, ar) => AR ? ar : en;
  
  
  
  const LR = s => AR ? '⁦‎' + s + '‎⁩' : s;
  const ramp = (t, t0, d) => smooth((t - t0) / d);
  
  const fr = (sc, c, x, y, w, h) => c.fillRect(AR ? sc.W - x - w : x, y, w, h);
  const sr = (sc, c, x, y, w, h) => c.strokeRect((AR ? sc.W - x - w : x) + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
  const line = (sc, c, x1, y1, x2, y2) => { c.beginPath(); c.moveTo(sc.X(x1), y1); c.lineTo(sc.X(x2), y2); c.stroke(); };
  const set = (c, a, col) => { c.globalAlpha = clamp(a, 0, 1); c.fillStyle = col; c.strokeStyle = col; };
  const sizes = (W, H) => { const wd = K.wide(W, H); return { wd, pad: wd ? clamp(W * 0.04, 18, 34) : 14, f: wd ? clamp(W * 0.017, 11, 14) : 10.5 }; };

  const YEARS = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  
  const ZIP = [125.5, 91.0, 123.0, 68.9, 94.3, 79.5, 101.8, 69.5, 93.4, 64.4, 77.8, 80.7, 88.9, 79.2, 61.6];
  
  const ROWS = [506467, 475687, 491773, 464664, 441456, 486303, 450016, 437436, 418268, 401958, 438693, 445132, 433323, 457670, 356158];
  
  const KNOWN = [501905, 471812, 487155, 460539, 437514, 482178, 445872, 433466, 413943, 398387, 434058, 440111, 428738, 452464, 352145];

  
  const S1 = { dur: 3.4,
    aria: { en: 'The 15 yearly CDC files, LLCP2011XPT.zip to LLCP2025XPT.zip, downloading one after another: 126 MB for 2011 down to 62 MB for 2025, 1.3 GB zipped in all, 6,705,004 rows.',
            ar: 'ملفات CDC السنوية الخمسة عشر، من LLCP2011XPT.zip إلى LLCP2025XPT.zip، تُنزَّل واحدًا بعد الآخر: من 126 ميجابايت لعام 2011 إلى 62 ميجابايت لعام 2025، والمجموع 1.3 جيجابايت مضغوطة، و6,705,004 صفوف.' },
    build(W, H) {
      const z = sizes(W, H), m = { ...z };
      m.big = z.wd ? clamp(W * 0.062, 30, 52) : 26;
      m.top = z.pad + m.big * 0.86;                         
      m.y0 = m.top + (z.wd ? 34 : 26);                      
      m.rh = (H - z.pad - m.y0) / 16;                        
      m.showRows = z.wd;
      return m;
    },
    draw(sc, c, m, t) {
      const { W } = sc, f = m.f, pad = m.pad;
      const nameW = sc.measure('LLCP2011XPT.zip', { size: f, w: 500 }) + 14;
      const mbW = Math.max(sc.measure('126', { size: f }), sc.measure(T('zipped, MB', 'مضغوط، ميجابايت'), { size: f - 0.5 })) + 12;
      const rowsW = m.showRows ? sc.measure('506,467', { size: f }) + 16 : 0;
      const x0 = pad, xb = x0 + nameW, xm = W - pad - rowsW, bw = xm - mbW - xb;
      const st = k => 0.2 + k * 0.13;                        
      let done = 0;
      
      const hy = m.y0 + m.rh * 0.62, ha = ramp(t, 0.05, 0.3);
      sc.text(T('yearly file', 'الملف السنوي'), x0, hy, { size: f - 0.5, color: D.mute, a: ha });
      sc.text(T('zipped, MB', 'مضغوط، ميجابايت'), xm, hy, { size: f - 0.5, color: D.mute, a: ha, al: 'end' });
      if (m.showRows) sc.text(T('rows', 'الصفوف'), W - pad, hy, { size: f - 0.5, color: D.mute, a: ha, al: 'end' });
      const th = clamp(m.rh * 0.36, 3, 9);
      YEARS.forEach((y, k) => {
        const yy = m.y0 + m.rh * (k + 1), base = yy + m.rh * 0.62, mid = yy + m.rh * 0.5;
        const a = ramp(t, st(k) - 0.05, 0.25), u = clamp(spring(t - st(k), 0.75, 0.95), 0, 1);
        done += ZIP[k] * u;
        
        set(c, 0.55, D.page); fr(sc, c, xb, mid - th / 2, bw, th);
        if (a <= 0) { sc.text('LLCP' + y + 'XPT.zip', x0, base, { size: f, color: D.mute, a: 0.25 }); return; }
        sc.text('LLCP' + y + 'XPT.zip', x0, base, { size: f, w: 500, color: D.ink, a: lerp(0.25, 0.95, a) });
        set(c, 0.92, D.ink); fr(sc, c, xb, mid - th / 2, bw * (ZIP[k] / ZIP[0]) * u, th);
        sc.text(String(Math.round(ZIP[k] * u)), xm, base, { size: f, color: D.ink, a: a, al: 'end' });
        if (m.showRows) sc.text(fmtInt(ROWS[k]), W - pad, base, { size: f, color: D.mute, a: a * clamp((u - 0.6) / 0.4, 0, 1), al: 'end' });
      });
      
      const fin = ramp(t, st(14) + 0.55, 0.35), gb = done / 1024;
      const big = m.big, tx = pad;
      sc.text(T(gb.toFixed(1) + ' GB', gb.toFixed(1) + ' جيجابايت'), tx, m.top, { size: big, w: 800, stretch: 'semi-condensed', color: fin > 0.5 ? D.acc : D.ink, a: ramp(t, 0.1, 0.3) });
      const bwid = sc.measure(T(gb.toFixed(1) + ' GB', gb.toFixed(1) + ' جيجابايت'), { size: big, w: 800, stretch: 'semi-condensed' });
      const nIn = YEARS.filter((_, k) => t >= st(k) + 0.45).length;
      const sub = m.wd ? T(nIn + ' of 15 files, zipped', nIn + ' من 15 ملفًا، مضغوطة') : T(nIn + ' of 15 files', nIn + ' من 15 ملفًا');
      sc.text(sub, tx + bwid + 12, m.top, { size: f + 1, color: D.ink, a: ramp(t, 0.1, 0.3) * 0.9 });
      if (m.wd) sc.text(T('from cdc.gov/brfss/annual_data', 'من cdc.gov/brfss/annual_data'), W - pad, m.top, { size: f - 0.5, color: D.mute, a: ramp(t, 0.1, 0.3), al: 'end' });
    } };

  
  
  const MAP = [
    { std: 'diabetes', ch: [['DIABETE3', '2011-18'], ['DIABETE4', '2019-25']] },
    { std: 'income', ch: [['INCOME2', '2011-20'], ['INCOME3', '2021-25']], note: { en: '11 brackets to 8', ar: '11 شريحة إلى 8' } },
    { std: 'race', ch: [['_IMPRACE', T('2011-14, 2017-25', '2011-14، 2017-25')], ['_RACE', '2015-16']], note: { en: '8 groups to 6', ar: '8 مجموعات إلى 6' } },
    { std: 'copd', ch: [['CHCCOPD', '2011'], ['CHCCOPD1', '2012-18'], ['CHCCOPD2', '2019-20'], ['CHCCOPD3', '2021-25']] },
    { std: 'kidney_disease', ch: [['CHCKIDNY', '2011-17'], ['CHCKDNY1', '2018'], ['CHCKDNY2', '2019-25']] },
  ];
  
  const COLS = ['year', 'state', 'weight', 'heart_attack', 'coronary_heart_disease', 'stroke', 'high_blood_pressure', 'high_cholesterol', 'diabetes',
    'smoked_100', 'heavy_drinker', 'exercise', 'bmi', 'sleep_hours', 'age_group', 'gender', 'race', 'gen_health', 'phys_days', 'ment_days', 'diff_walking',
    'asthma', 'kidney_disease', 'copd', 'depression', 'arthritis', 'income', 'education', 'last_checkup', 'cost_barrier', 'heart_disease'];
  const S2 = { dur: 3.5,
    aria: { en: 'The harmonisation map: DIABETE3 and DIABETE4 become diabetes; INCOME2 and INCOME3 become income, 11 brackets to 8; _IMPRACE and _RACE become race, 8 groups to 6; four COPD names become copd; three kidney names become kidney_disease. Every year ends in the same 31 columns.',
            ar: 'خريطة التوحيد: DIABETE3 وDIABETE4 تصير diabetes، وINCOME2 وINCOME3 تصير income من 11 شريحة إلى 8، و_IMPRACE و_RACE تصير race من 8 مجموعات إلى 6، وأربعة أسماء للانسداد الرئوي تصير copd، وثلاثة أسماء للكلى تصير kidney_disease. وكل سنة تنتهي في الأعمدة الواحد والثلاثين نفسها.' },
    build(W, H) {
      const z = sizes(W, H), m = { ...z };
      m.stripH = z.wd ? clamp(H * 0.05, 14, 28) : 13;
      m.stripY = H - z.pad - m.stripH - (z.wd ? 4 : 0);
      m.top = z.pad + (z.wd ? 14 : 12);
      const avail = m.stripY - (z.wd ? 34 : 26) - m.top - 8;
      
      let nv = z.wd ? 6 : 4;
      const need = n => { const rows = MAP.slice(0, n).reduce((a, v) => a + v.ch.length, 0); return rows * (z.f + 6) + (n - 1) * 8; };
      while (nv > 3 && need(nv) > avail) nv--;
      m.vars = MAP.slice(0, nv);
      const rows = m.vars.reduce((a, v) => a + v.ch.length, 0), gaps = nv - 1;
      m.ch = Math.min(z.wd ? 30 : 18, (avail - gaps * 8) / rows);
      m.gap = Math.min(z.wd ? 16 : 10, (avail - rows * m.ch) / Math.max(1, gaps));
      return m;
    },
    draw(sc, c, m, t) {
      const { W } = sc, f = m.f, pad = m.pad, wd = m.wd;
      
      const nmW = Math.max(...m.vars.flatMap(v => v.ch.map(q => sc.measure(LR(q[0]), { size: f, w: 600 }))));
      const yrW = Math.max(...m.vars.flatMap(v => v.ch.map(q => sc.measure(q[1], { size: f - 0.5 }))));
      const chipW = nmW + yrW + 22, x0 = pad, xc = x0 + chipW;
      const stdW = Math.max(...m.vars.map(v => sc.measure(LR(v.std), { size: f + 0.5, w: 650 }))) + 18;
      const noteW = wd ? Math.max(...m.vars.map(v => v.note ? sc.measure(T('codes: ', 'الرموز: ') + (AR ? v.note.ar : v.note.en), { size: f - 0.5 }) : 0)) : 0;
      const xs = W - pad - Math.max(stdW, noteW);              
      const ha = ramp(t, 0, 0.3);
      sc.text(T('raw names in the yearly files', 'الأسماء الخام في الملفات السنوية'), x0, m.top, { size: f - 0.5, color: D.mute, a: ha });
      sc.text(T('one column', 'عمود واحد'), xs, m.top, { size: f - 0.5, color: D.mute, a: ha });
      let y = m.top + (wd ? 16 : 12), k = 0;
      m.vars.forEach((v, vi) => {
        const y0 = y, n = v.ch.length, hgt = n * m.ch, cy = y0 + hgt / 2;
        const ts = 1.25 + vi * 0.12, sa = ramp(t, ts + 0.45, 0.3);
        v.ch.forEach((q, j) => {
          const a = ramp(t, 0.15 + k * 0.06, 0.3), dx = (1 - a) * -16, yy = y0 + j * m.ch, base = yy + m.ch * 0.5 + f * 0.36;
          set(c, 0.18 + 0.5 * a, D.page); fr(sc, c, x0 + dx, yy + 1.5, chipW, m.ch - 3);
          sc.text(LR(q[0]), x0 + 9 + dx, base, { size: f, w: 600, color: D.ink, a: lerp(0.15, 0.95, a) });
          sc.text(q[1], x0 + chipW - 9 + dx, base, { size: f - 0.5, color: D.mute, a: a, al: 'end' });
          
          const u = ramp(t, ts + j * 0.05, 0.5);
          if (u > 0) {
            const ya = yy + m.ch / 2, xm = lerp(xc, xs - 10, 0.55);
            set(c, 0.55, D.mute); c.lineWidth = 1;
            c.beginPath(); c.moveTo(sc.X(xc), ya);
            const steps = 18;
            for (let s = 1; s <= steps * u; s++) {
              const p = s / steps, bx = (1 - p) ** 3 * xc + 3 * (1 - p) ** 2 * p * xm + 3 * (1 - p) * p * p * xm + p ** 3 * (xs - 8);
              const by = (1 - p) ** 3 * ya + 3 * (1 - p) ** 2 * p * ya + 3 * (1 - p) * p * p * cy + p ** 3 * cy;
              c.lineTo(sc.X(bx), by);
            }
            c.stroke();
          }
          k++;
        });
        
        if (sa > 0) {
          set(c, sa * 0.9, D.ink); fr(sc, c, xs - 8, cy - 1, 3, 3);
          const ny = v.note && wd ? cy - 1 : cy + f * 0.36;
          sc.text(LR(v.std), xs, ny, { size: f + 0.5, w: 650, color: D.ink, a: sa });
          if (v.note && wd) sc.text(T('codes: ', 'الرموز: ') + (AR ? v.note.ar : v.note.en), xs, cy + f + 2, { size: f - 0.5, color: D.mute, a: sa });
        }
        y += hgt + m.gap;
      });
      
      const sy = m.stripY, sh = m.stripH, gw = wd ? 3 : 2, cw = (W - 2 * pad - 30 * gw) / 31;
      const lit = new Set(m.vars.map(v => v.std));
      const fa = ramp(t, 2.35, 0.3);
      COLS.forEach((col, i) => {
        const a = ramp(t, 2.2 + i * 0.022, 0.25);
        const on = lit.has(col);
        set(c, on ? lerp(0.2, 0.95, a) : lerp(0.2, 0.55, a), on ? D.ink : D.page);
        fr(sc, c, pad + i * (cw + gw), sy, cw, sh);
      });
      const ly = sy - (wd ? 9 : 6);
      sc.text(T('31 columns', '31 عمودًا'), pad, ly, { size: f + 1, w: 700, color: D.acc, a: fa });
      const lw = sc.measure(T('31 columns', '31 عمودًا'), { size: f + 1, w: 700 });
      sc.text(T('the dataset, ' + fmtInt(6705004) + ' rows', 'مجموعة البيانات، ' + fmtInt(6705004) + ' صفوف'), pad + lw + 10, ly, { size: f - 0.5, color: D.mute, a: fa });
    } };

  
  
  const MISS = {
    state: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], weight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    heart_attack: [0.5, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.6, 0.5, 0.6, 0.7, 0.6, 0.7, 0.6],
    coronary_heart_disease: [0.9, 0.8, 0.9, 0.9, 0.9, 0.8, 0.9, 0.8, 1, 0.8, 1, 1, 1, 1, 1],
    stroke: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    high_blood_pressure: [0.3, 100, 0.3, 100, 0.3, 100, 0.3, 100, 0.4, 100, 0.4, 100, 0.4, 100, 1.2],
    high_cholesterol: [2.7, 100, 2.6, 100, 3, 100, 1.2, 100, 1.2, 100, 7.4, 100, 6.9, 100, 7.3],
    diabetes: [0.4, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
    smoked_100: [0.5, 2, 3, 4.5, 4, 4, 4.1, 3.8, 4.4, 5.1, 5.6, 7.9, 5.2, 6.9, 5.7],
    heavy_drinker: [7.3, 4, 4.9, 6.4, 5.8, 6, 6.7, 6.2, 6.6, 7.6, 8, 11.2, 7.6, 10.2, 8.1],
    exercise: [4.5, 0.3, 6.9, 0.4, 8.6, 0.2, 7.6, 0.2, 5.3, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3],
    bmi: [5.5, 5.4, 5.4, 6.6, 8.2, 8.1, 8.1, 8.1, 8.7, 10.3, 10.7, 11, 9.4, 9.4, 9.1],
    sleep_hours: [100, 100, 1.5, 1.4, 100, 1.2, 89, 1.2, 100, 1.2, 100, 1.2, 100, 100, 7.7],
    age_group: [1, 1, 1, 1.2, 1.2, 1.4, 1.4, 1.9, 1.6, 2.1, 2.2, 2, 1.8, 1.8, 1.9],
    gender: [0, 0, 0, 0, 0, 0, 0.1, 0.3, 0, 0, 0, 0, 0, 0, 0],
    race: [0, 0, 0, 0, 1.7, 1.8, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    gen_health: [0.4, 0.3, 0.4, 0.4, 0.3, 0.3, 0.3, 0.3, 0.3, 0.2, 0.3, 0.3, 0.3, 0.3, 0.3],
    phys_days: [2.4, 2.1, 2.2, 2.2, 2.2, 2.1, 2.1, 2, 2.5, 2.2, 2.2, 2.5, 2.5, 2.4, 2.3],
    ment_days: [1.9, 1.7, 1.8, 1.7, 1.7, 1.6, 1.6, 1.6, 2.1, 2, 1.8, 2, 1.9, 1.8, 1.8],
    diff_walking: [100, 100, 2.6, 4.1, 3.3, 3.4, 3.5, 3, 3.7, 4.2, 4.5, 5.4, 4.1, 4.5, 4.5],
    asthma: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.4, 0.3, 0.4, 0.4, 0.4, 0.4, 0.4],
    kidney_disease: [0.6, 0.3, 0.3, 0.4, 0.4, 0.3, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
    copd: [0.8, 0.5, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    depression: [0.7, 0.4, 0.5, 0.5, 0.5, 0.4, 0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6],
    arthritis: [0.9, 0.5, 0.6, 0.5, 0.6, 0.5, 0.6, 0.6, 0.6, 0.6, 0.7, 0.6, 0.6, 0.6, 0.6],
    income: [14.5, 14, 14.5, 15.4, 18, 16.7, 16.7, 17.4, 19.1, 19.9, 21.5, 21.6, 20, 19.1, 19.9],
    education: [0.4, 0.4, 0.5, 0.8, 0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.6, 0.5, 0.5, 0.5, 0.6],
    last_checkup: [1.3, 1.3, 1.3, 1.4, 1.4, 1.3, 1.3, 1.3, 1.2, 1.3, 1.3, 1.3, 1.3, 1.2, 1.1],
    cost_barrier: [0.3, 0.3, 0.2, 0.3, 0.3, 0.3, 0.3, 0.5, 0.3, 0.3, 0.3, 0.4, 0.4, 0.4, 0.3],
    heart_disease: [0.9, 0.8, 0.9, 0.9, 0.9, 0.8, 0.9, 0.9, 1, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1],
  };
  
  const PRIORITY = ['heart_disease', 'high_blood_pressure', 'high_cholesterol', 'sleep_hours', 'diff_walking', 'income', 'bmi', 'heavy_drinker', 'exercise',
    'smoked_100', 'race', 'gender', 'diabetes', 'age_group', 'stroke', 'gen_health', 'phys_days', 'ment_days', 'kidney_disease', 'copd', 'depression',
    'arthritis', 'asthma', 'education', 'heart_attack', 'coronary_heart_disease', 'last_checkup', 'cost_barrier', 'state', 'weight'];
  const ORDER = Object.keys(MISS);
  const tone = p => p >= 50 ? 0 : p > 10 ? 0.26 : p > 2 ? 0.55 : 0.92;   
  const S3 = { dur: 3.6,
    aria: { en: 'The data-quality report as a grid of variables by year, 2011 to 2025: most answers complete; blood pressure and cholesterol asked in odd years only; sleep in some years; walking difficulty from 2013; income 14 to 22% missing. The heart disease target matches CDC’s own _MICHD for 352,145 of 352,145 people in 2025.',
            ar: 'تقرير جودة البيانات شبكةً من المتغيّرات والسنوات من 2011 إلى 2025: معظم الإجابات كاملة، والضغط والكوليسترول في السنوات الفردية فقط، والنوم في بعض السنوات، وصعوبة المشي من 2013، والدخل ناقص بنسبة 14 إلى 22٪. والمتغيّر الهدف يطابق _MICHD من CDC لـ352,145 من 352,145 شخصًا في 2025.' },
    build(W, H) {
      const z = sizes(W, H), m = { ...z };
      m.top = z.pad + (z.wd ? 14 : 12);
      m.legH = z.wd ? 46 : 44;
      m.yg = m.top + (z.wd ? 22 : 16);
      const avail = H - z.pad - m.legH - m.yg;
      const minR = z.wd ? 13 : 12.2;
      const n = clamp(Math.floor(avail / minR), 6, 30);
      const keep = new Set(PRIORITY.slice(0, n));
      m.rows = ORDER.filter(v => keep.has(v) && v !== 'heart_disease').concat('heart_disease');
      m.rh = Math.min(z.wd ? 22 : 16, avail / m.rows.length);
      return m;
    },
    draw(sc, c, m, t) {
      const { W, H } = sc, f = m.f, pad = m.pad, wd = m.wd;
      const lf = wd ? clamp(m.rh * 0.78, 11, 13) : 10.5;
      const labW = Math.max(...m.rows.map(v => sc.measure(LR(v), { size: lf, w: 700 }))) + 10;
      const noteW = wd ? sc.measure(T('odd years only', 'الفردية فقط'), { size: f - 0.5 }) + 12 : 0;
      const gx = pad + labW, gw = W - pad - noteW - gx, cw = gw / 15, chh = m.rh - (wd ? 3 : 2.4), cwd = cw - (wd ? 4 : 2.4);
      const ha = ramp(t, 0, 0.3);
      sc.text(wd ? T('missing share per variable and year, from harmonisation_by_year.csv', 'نسبة الناقص لكل متغيّر وسنة، من ' + LR('harmonisation_by_year.csv'))
                 : T('missing share, by year', 'نسبة الناقص، لكل سنة'), pad, m.top, { size: f - 0.5, color: D.mute, a: ha });
      
      const yl = m.yg - (wd ? 6 : 4);
      [0, 14].concat(wd ? [2, 4, 6, 8, 10, 12] : [7]).forEach(i => sc.text(String(YEARS[i]), gx + cw * i + cw / 2, yl, { size: f - 1 < 10.5 ? 10.5 : f - 1, color: D.mute, a: ha, al: 'center' }));
      const colAt = i => 0.25 + i * 0.1;                     
      m.rows.forEach((v, r) => {
        const y = m.yg + r * m.rh, cy = y + m.rh / 2, tgt = v === 'heart_disease';
        if (tgt) { set(c, 0.6 * ha, D.page); fr(sc, c, pad, y - 1, W - 2 * pad, 1); }
        sc.text(LR(v), pad, cy + lf * 0.36, { size: lf, w: tgt ? 700 : 500, color: tgt ? D.ink : D.mute, a: ha });
        MISS[v].forEach((p, i) => {
          const a = ramp(t, colAt(i) + r * 0.006, 0.2), x = gx + cw * i + (cw - cwd) / 2, yy = cy - chh / 2;
          const hot = tgt && i === 14 && t > 2.05;
          if (a <= 0) { set(c, 0.3, D.page); fr(sc, c, x, yy, cwd, chh); return; }
          const tn = tone(p);
          if (tn === 0) { set(c, 0.55 * a, D.mute); c.lineWidth = 1; sr(sc, c, x, yy, cwd, chh); }
          else { set(c, tn * a, hot ? D.acc : D.ink); fr(sc, c, x, yy, cwd, chh); }
        });
        if (wd && (v === 'high_blood_pressure' || v === 'high_cholesterol')) {
          const na = ramp(t, 1.85, 0.3);
          sc.text(T('odd years only', 'الفردية فقط'), W - pad, cy + f * 0.34, { size: f - 0.5, color: D.ink, a: na * 0.85, al: 'end' });
        }
      });
      
      const ly = H - pad - m.legH + (wd ? 18 : 15), sw = wd ? 10 : 9;
      const items = [[0.92, T('up to 2% missing', 'ناقص حتى 2٪')], [0.55, T('over 2 to 10%', 'فوق 2 حتى 10٪')], [0.26, T('over 10%', 'أكثر من 10٪')], [0, T('not asked', 'لم يُسأل')]];
      let lx = pad;
      const la = ramp(t, 1.7, 0.4);
      items.forEach(([tn, s]) => {
        if (tn === 0) { set(c, la * 0.55, D.mute); c.lineWidth = 1; sr(sc, c, lx, ly - sw + 1, sw, sw); } else { set(c, tn * la, D.ink); fr(sc, c, lx, ly - sw + 1, sw, sw); }
        sc.text(s, lx + sw + 5, ly, { size: f - 0.5, color: D.mute, a: la });
        lx += sw + 5 + sc.measure(s, { size: f - 0.5 }) + (wd ? 16 : 9);
      });
      
      const ma = ramp(t, 2.05, 0.3), cnt = Math.round(352145 * clamp((t - 2.1) / 0.8, 0, 1));
      const my = H - pad - (wd ? 2 : 0);
      if (ma > 0) {
        const s = T('heart_disease = CDC’s _MICHD in 2025: ' + fmtInt(cnt) + ' of 352,145', LR('heart_disease') + ' يطابق ' + LR('_MICHD') + ' من CDC في 2025: ' + fmtInt(cnt) + ' من 352,145');
        sc.text(s, pad, my, { size: wd ? f + 0.5 : 10.5, w: 650, color: D.acc, a: ma });
      }
    } };

  
  const S4 = { dur: 3.4,
    aria: { en: 'A year strip from 2011 to 2025 in two rows, odd years above, even years below. The six odd years 2011 to 2021 light up with their answers, 501,905 to 434,058, adding to 2,720,447. 2023, 428,738 answers, is the tuning year: 4 settings, PR-AUC 0.362 to 0.363. The even years have no blood pressure or cholesterol questions and are not used; 2025 is held back.',
            ar: 'شريط السنوات من 2011 إلى 2025 في صفّين، الفردية في الأعلى والزوجية في الأسفل. تضيء السنوات الفردية الست من 2011 إلى 2021 بإجاباتها، من 501,905 إلى 434,058، ومجموعها 2,720,447. و2023 بـ428,738 إجابة سنة الضبط: 4 إعدادات، و' + 'PR-AUC من 0.362 إلى 0.363. والسنوات الزوجية بلا سؤالي الضغط والكوليسترول فلم تُستخدم، و2025 محجوزة.' },
    build(W, H) {
      const z = sizes(W, H), m = { ...z };
      m.big = z.wd ? clamp(W * 0.062, 30, 52) : 26;
      m.tw = (W - 2 * z.pad - 7 * (z.wd ? 8 : 4)) / 8;      
      m.th = z.wd ? clamp(H * 0.2, 50, 130) : 42;
      m.eh = z.wd ? clamp(m.th * 0.42, 26, 50) : 24;
      
      const lh = z.wd ? z.f + 5 : 13.5, gapT = z.wd ? clamp(H * 0.1, 44, 80) : 34;
      const notes = z.wd ? 2 * lh + 4 + 22 : 4 * lh + 4 + 16;
      const tot = m.big * 0.86 + gapT + m.th + (z.wd ? 12 : 8) + m.eh + notes;
      m.top = Math.max(z.pad + m.big * 0.86, (H - tot) / 2 + m.big * 0.86);
      m.ty = m.top + gapT;                                   
      m.ey = m.ty + m.th + (z.wd ? 12 : 8);                 
      return m;
    },
    draw(sc, c, m, t) {
      const { W, H } = sc, f = m.f, pad = m.pad, wd = m.wd, gap = wd ? 8 : 4;
      const odd = [0, 2, 4, 6, 8, 10, 12, 14];               
      const lightAt = j => 0.3 + j * 0.2;                    
      let sum = 0;
      odd.forEach((yi, j) => {
        const x = pad + j * (m.tw + gap), y = m.ty, train = j < 6, tune = j === 6;
        const a = train ? ramp(t, lightAt(j), 0.3) : tune ? ramp(t, 1.75, 0.35) : ramp(t, 2.0, 0.4);
        if (train) sum += KNOWN[yi] * clamp((t - lightAt(j)) / 0.3, 0, 1);
        
        set(c, 0.5, D.page); c.lineWidth = 1; sr(sc, c, x, y, m.tw, m.th);
        if (train) { set(c, lerp(0, 1, a), D.page); fr(sc, c, x, y, m.tw, m.th); set(c, a, D.ink); fr(sc, c, x, y, m.tw, 2); }
        if (tune) { set(c, a, D.ink); c.lineWidth = 1.5; sr(sc, c, x, y, m.tw, m.th); }
        if (j === 7) { set(c, a * 0.8, D.mute); c.setLineDash([3, 3]); c.lineWidth = 1; sr(sc, c, x, y, m.tw, m.th); c.setLineDash([]); }
        const yf = wd ? f + 1 : 10.5, nf = wd ? f : 10.5;
        sc.text(String(YEARS[yi]), x + (wd ? 8 : 4), y + 6 + yf, { size: yf, w: 700, color: train || tune ? D.ink : D.mute, a: lerp(0.35, 1, a) });
        const cnt = wd ? fmtInt(KNOWN[yi]) : String(Math.round(KNOWN[yi] / 1000));
        if (j < 7) sc.text(cnt, x + (wd ? 8 : 4), y + m.th - (wd ? 9 : 6), { size: nf, color: train ? D.ink : D.ink, a: a * (train ? 0.9 : 0.75) });
        else if (wd && sc.measure(T('held back', 'محجوزة'), { size: nf }) < m.tw - 14) sc.text(T('held back', 'محجوزة'), x + 8, y + m.th - 9, { size: nf, color: D.mute, a: a });
      });
      
      const ea = ramp(t, 2.0, 0.4);
      for (let j = 0; j < 7; j++) {
        const x = pad + (m.tw + gap) * (j + 0.5), yi = 2 * j + 1;
        set(c, 0.5, D.page); c.lineWidth = 1; sr(sc, c, x, m.ey, m.tw, m.eh);
        sc.text(String(YEARS[yi]), x + (wd ? 8 : 4), m.ey + m.eh / 2 + (wd ? f : 10.5) * 0.36, { size: wd ? f - 0.5 : 10.5, color: D.mute, a: lerp(0.35, 0.8, ea) });
      }
      
      const ba = ramp(t, 1.45, 0.3), bx0 = pad, bx1 = pad + 6 * m.tw + 5 * gap, by = m.ty - (wd ? 10 : 7);
      if (ba > 0) {
        set(c, ba, D.ink); c.lineWidth = 1;
        c.beginPath(); c.moveTo(sc.X(bx0), by + 5); c.lineTo(sc.X(bx0), by); c.lineTo(sc.X(bx1), by); c.lineTo(sc.X(bx1), by + 5); c.stroke();
        sc.text(T('train', 'التدريب'), bx0, by - 6, { size: f, w: 650, color: D.ink, a: ba });
        const tx = pad + 6 * (m.tw + gap);
        set(c, ramp(t, 1.75, 0.35), D.ink);
        c.beginPath(); c.moveTo(sc.X(tx), by + 5); c.lineTo(sc.X(tx), by); c.lineTo(sc.X(tx + m.tw), by); c.lineTo(sc.X(tx + m.tw), by + 5); c.stroke();
        sc.text(T('tune', 'الضبط'), tx, by - 6, { size: f, w: 650, color: D.ink, a: ramp(t, 1.75, 0.35) });
      }
      
      const fin = ramp(t, lightAt(5) + 0.35, 0.3);
      const big = m.big, s = fmtInt(sum);
      sc.text(s, pad, m.top, { size: big, w: 800, stretch: 'semi-condensed', color: fin > 0.5 ? D.acc : D.ink, a: ramp(t, 0.2, 0.3) });
      const bw = sc.measure(fmtInt(2720447), { size: big, w: 800, stretch: 'semi-condensed' });
      sc.text(T('answers to train on', 'إجابة للتدريب'), pad + bw + 12, m.top, { size: f + 1, color: D.ink, a: ramp(t, 0.2, 0.3) * 0.9 });
      
      let ny = m.ey + m.eh + (wd ? 22 : 16);
      const nt = ramp(t, 2.0, 0.4), tn = ramp(t, 2.15, 0.4), lh = wd ? f + 5 : 13.5, mw = W - 2 * pad;
      ny += lh * sc.para(T('Even years: the other questionnaire, no blood pressure or cholesterol questions, not used.', 'السنوات الزوجية: الاستبيان الآخر، بلا سؤالي الضغط والكوليسترول، فلم تُستخدم.'), pad, ny, mw, lh, { size: f - 0.5, color: D.mute, a: nt });
      ny += 4;
      ny += lh * sc.para(T('2023: 4 model settings compared, PR-AUC 0.362 to 0.363.', '2023: مقارنة 4 إعدادات للنموذج، PR-AUC من 0.362 إلى 0.363.'), pad, ny, mw, lh, { size: f - 0.5, color: D.ink, a: tn * 0.9 });
      if (!wd) sc.para(T('Answers per year in thousands; 2025 held back.', 'الإجابات في كل سنة بالآلاف، و2025 محجوزة.'), pad, Math.min(H - pad, ny + 4), mw, lh, { size: 10.5, color: D.mute, a: ramp(t, 0.6, 0.4) });
    } };

  
  const REFIT = [0, 2, 4, 6, 8, 10, 12];                    
  const S5 = { dur: 3.6,
    aria: { en: 'Two blocks sized by answers: the refit on the odd years 2011 to 2023, 3,149,185 answers, and, apart, 2025: 352,145 people the model never saw, tested once. ROC-AUC 0.851; 9.0% of them, 31,687, reported heart disease.',
            ar: 'كتلتان بحجم الإجابات: إعادة التدريب على السنوات الفردية من 2011 إلى 2023، 3,149,185 إجابة، وبعيدًا عنها 2025: 352,145 شخصًا لم يرهم النموذج، اختُبروا مرة واحدة. ' + 'ROC-AUC 0.851، و9.0٪ منهم، 31,687، أبلغوا عن مرض القلب.' },
    build(W, H) {
      const z = sizes(W, H), m = { ...z };
      m.barH = z.wd ? clamp(H * 0.3, 40, 210) : 46;
      m.by = z.wd ? z.pad + clamp(H * 0.12, 48, 90) : z.pad + 40;
      m.gapW = z.wd ? clamp(W * 0.05, 22, 46) : 16;
      const span = W - 2 * z.pad - m.gapW, tot = 3149185 + 352145;
      m.rw = span * 3149185 / tot; m.tw = span * 352145 / tot;
      
      return m;
    },
    draw(sc, c, m, t) {
      const { W, H } = sc, f = m.f, pad = m.pad, wd = m.wd;
      const by = m.by, bh = m.barH;
      
      const mg = ramp(t, 0.9, 0.6);
      let x = pad;
      const segs = REFIT.map(yi => { const w = m.rw * KNOWN[yi] / 3149185; const s = { x, w, yi }; x += w; return s; });
      segs.forEach((s, j) => {
        const a = ramp(t, 0.15 + j * 0.08, 0.3), spread = (1 - mg) * (j - 3) * (wd ? 7 : 4);
        set(c, 0.5, D.page); fr(sc, c, s.x + spread, by, s.w - 1, bh);
        set(c, a * 0.92, D.ink); fr(sc, c, s.x + spread + (mg > 0.98 ? 0 : 0.5), by, s.w - (mg > 0.98 ? 0 : 1.5), bh);
        if (wd || j === 0 || j === 6) {
          const lab = String(YEARS[s.yi]);
          sc.text(lab, s.x + spread + (j === 6 && !wd ? s.w : 0), by + bh + (wd ? 16 : 14), { size: wd ? f - 0.5 : 10.5, color: D.mute, a: a, al: j === 6 && !wd ? 'end' : 'start' });
        }
      });
      
      if (mg > 0.98) { set(c, 0.18, D.surf); segs.slice(1).forEach(s => fr(sc, c, s.x - 0.5, by, 1, bh)); }
      const ra = ramp(t, 1.35, 0.35);
      sc.text(T('refit', 'إعادة التدريب'), pad, by - (wd ? 30 : 24), { size: f, w: 650, color: D.ink, a: ra });
      sc.text(T(fmtInt(3149185) + ' answers, odd years 2011 to 2023', fmtInt(3149185) + ' إجابة، السنوات الفردية من 2011 إلى 2023'), pad, by - (wd ? 11 : 8), { size: wd ? f - 0.5 : 10.5, color: D.mute, a: ra });
      
      const tx = pad + m.rw + m.gapW, wa = ramp(t, 1.5, 0.3);
      set(c, wa * 0.7, D.mute); c.setLineDash([3, 4]); c.lineWidth = 1;
      line(sc, c, pad + m.rw + m.gapW / 2, by - (wd ? 18 : 12), pad + m.rw + m.gapW / 2, by + bh + (wd ? 18 : 12)); c.setLineDash([]);
      set(c, wa, D.acc); c.lineWidth = 1.5; sr(sc, c, tx, by, m.tw, bh);
      
      const sw = clamp((t - 2.0) / 0.55, 0, 1);
      if (sw > 0) { set(c, 0.95, D.acc); fr(sc, c, tx, by, m.tw * sw, bh); }
      if (sw > 0 && sw < 1) { set(c, 1, D.ink); fr(sc, c, tx + m.tw * sw - 1, by - 4, 2, bh + 8); }
      const la = ramp(t, 1.6, 0.3);
      sc.text('2025', tx + m.tw, by - (wd ? 30 : 24), { size: f, w: 700, color: D.acc, a: la, al: 'end' });
      
      const ty = by + bh + (wd ? 40 : 34);
      sc.text(fmtInt(352145), W - pad, ty, { size: wd ? f + 4 : 13, w: 750, color: D.acc, a: la, al: 'end' });
      sc.text(T('people, never seen', 'شخصًا لم يرهم'), W - pad, ty + (wd ? f + 6 : 15), { size: wd ? f - 0.5 : 10.5, color: D.acc, a: la * 0.9, al: 'end' });
      sc.text(T('tested once', 'اختبار واحد'), W - pad, ty + 2 * (wd ? f + 6 : 15), { size: wd ? f - 0.5 : 10.5, color: D.mute, a: ramp(t, 2.0, 0.3), al: 'end' });
      
      const sa = ramp(t, 2.55, 0.35);
      const big = wd ? clamp(W * 0.1, 40, 84) : 40;
      const r0 = by + bh + 30, blockH = big * 0.78 + 40;
      const sy = wd ? r0 + Math.max(0, (H - pad - r0 - blockH) / 2) + big * 0.78 : H - pad - 30;
      sc.text('0.851', pad, sy, { size: big, w: 800, stretch: 'semi-condensed', color: D.acc, a: sa });
      sc.text(T('ROC-AUC on 2025', 'ROC-AUC على 2025'), pad, sy + (wd ? 20 : 17), { size: wd ? f + 0.5 : 11, w: 600, color: D.ink, a: sa });
      sc.text(T('9.0% of them, ' + fmtInt(31687) + ', reported heart disease', '9.0٪ منهم، ' + fmtInt(31687) + '، أبلغوا عن مرض القلب'), pad, sy + (wd ? 38 : 31), { size: wd ? f - 0.5 : 10.5, color: D.mute, a: sa });
    } };

  
  
  const FILES = [['brfss_gradient_boosting.joblib', T('985 KB, the saved model', '985 كيلوبايت، النموذج المحفوظ')], ['brfss_metadata.json', T('5 KB', '5 كيلوبايت')],
    ['brfss_model.json', T('7 KB', '7 كيلوبايت')], ['brfss_trends.json', T('11 KB', '11 كيلوبايت')]];
  
  
  
  const S6 = { dur: 3.6,
    aria: { en: 'A wireframe of the Streamlit app as it opens: the answers on one side (age group 55-59, gender, height 170 cm, weight 78 kg, health conditions, lifestyle, wellbeing) and the estimate on the other, 0.6%, against 6.2% for females aged 55-59 and 6.6% for all US adults. Beside it, the four files it loads: the saved model, 985 KB, and three JSON files of 5, 7 and 11 KB, 1.0 MB in all, against the 79 MB dataset of 6,705,004 rows that it does not load.',
            ar: 'رسم تخطيطي لتطبيق Streamlit كما يفتح: الإجابات في جانب (الفئة العمرية 55-59، والنوع، والطول 170 سم، والوزن 78 كجم، والحالات الصحية، ونمط الحياة، والعافية) والتقدير في الجانب الآخر، 0.6٪ مقابل 6.2٪ للإناث بين 55 و59 و6.6٪ لكل البالغين في أمريكا. وبجانبه الملفات الأربعة التي يحمّلها: النموذج المحفوظ 985 كيلوبايت وثلاثة ملفات JSON من 5 و7 و11 كيلوبايت، 1.0 ميجابايت كلها، مقابل مجموعة بيانات 79 ميجابايت من 6,705,004 صفوف لا يحمّلها.' },
    build(W, H) {
      const z = sizes(W, H), m = { ...z };
      if (z.wd) { m.fx = z.pad; m.fy = z.pad; m.fw = W * (W < 600 ? 0.48 : 0.53); m.fh = H - 2 * z.pad; m.rx = m.fx + m.fw + clamp(W * 0.035, 16, 36); }
      else { m.fx = z.pad; m.fy = z.pad; m.fw = W - 2 * z.pad; m.fh = H * 0.52; m.rx = z.pad; }
      return m;
    },
    draw(sc, c, m, t) {
      const { W, H } = sc, f = m.f, pad = m.pad, wd = m.wd;
      const fa = ramp(t, 0.1, 0.4);
      const fx = m.fx, fy = m.fy, fw = m.fw, fh = m.fh;
      
      set(c, 0.9, D.page); c.lineWidth = 1; sr(sc, c, fx, fy, fw, fh);
      const sbw = fw * (wd ? 0.5 : 0.47);
      set(c, 0.45 * fa, D.page); fr(sc, c, fx + 1, fy + 1, sbw, fh - 2);
      const lf = wd ? clamp(fw * 0.029, 11, 12.5) : 10.5, lh = wd ? clamp(fh * 0.066, 16, 30) : 14.5;
      const sx = fx + (wd ? 10 : 7), sw = sbw - (wd ? 20 : 14);
      const SB = wd ? [
        ['h', T('Your answers', 'إجاباتك')], ['s', T('About you', 'عنك')], ['f', T('Age group', 'الفئة العمرية'), '55-59'], ['f', T('Gender', 'النوع'), T('Female', 'أنثى')],
        ['f', T('Height, cm', 'الطول، سم'), '170'], ['f', T('Weight, kg', 'الوزن، كجم'), '78'], ['s', T('Health conditions', 'الحالات الصحية')],
        ['f', T('High blood pressure', 'ارتفاع الضغط'), T('No', 'لا')], ['f', T('Diabetes', 'السكري'), T('No', 'لا')], ['s', T('Lifestyle', 'نمط الحياة')],
        ['s', T('Wellbeing', 'العافية')], ['f', T('General health', 'الصحة العامة'), T('Very good', 'جيدة جدًا')]]
        : [['h', T('Your answers', 'إجاباتك')], ['f', T('Age group', 'العمر'), '55-59'], ['f', T('Gender', 'النوع'), T('Female', 'أنثى')], ['s', T('Health conditions', 'الحالات الصحية')],
           ['s', T('Lifestyle', 'نمط الحياة')], ['s', T('Wellbeing', 'العافية')]];
      let y = fy + lh * 0.95;
      const rows = Math.floor((fh - lh * 0.5) / lh);
      const fits = r => r[0] !== 'f' || sc.measure(r[1], { size: lf }) + sc.measure(r[2], { size: lf }) + 26 <= sw;
      SB.filter(fits).slice(0, rows).forEach((r, i) => {
        const a = ramp(t, 0.15 + i * 0.07, 0.3);
        if (r[0] === 'h') sc.text(r[1], sx, y, { size: lf + 1, w: 700, color: D.ink, a });
        else if (r[0] === 's') sc.text(r[1], sx, y, { size: lf, w: 600, color: D.ink, a: a * 0.85 });
        else {
          const vw = sc.measure(r[2], { size: lf }) + 10;
          sc.text(r[1], sx + 5, y, { size: lf, color: D.mute, a });
          const bh = Math.min(lf + 6, lh - 3); set(c, a * 0.8, D.mute); c.lineWidth = 1; sr(sc, c, sx + sw - vw, y - lf + (lf + 6 - bh) / 2 - 1, vw, bh);
          sc.text(r[2], sx + sw - 5, y + 0.5, { size: lf, color: D.ink, a, al: 'end' });
        }
        y += lh;
      });
      
      const mx = fx + sbw + (wd ? 14 : 9), mw = fx + fw - (wd ? 12 : 8) - mx, ea = ramp(t, 0.95, 0.4), sa = ramp(t, 1.2, 0.4);
      let my = fy + lh * 0.95;
      sc.text(T('Estimated probability', 'الاحتمال المقدَّر'), mx, my, { size: lf, color: D.mute, a: ea });
      const est = wd ? clamp(fw * 0.1, 28, 48) : 24;
      my += est + 2;
      sc.text(T('0.6%', '0.6٪'), mx, my, { size: est, w: 800, stretch: 'semi-condensed', color: D.ink, a: ea });
      my += wd ? 16 : 11;
      const th = wd ? 5 : 4;
      set(c, sa * 0.8, D.page); fr(sc, c, mx, my, mw, th);
      const pin = (v, col) => { set(c, sa, col); fr(sc, c, mx + mw * v / 0.25 - 1, my - (wd ? 5 : 4), 2, th + (wd ? 10 : 8)); };
      pin(0.0616, D.ink); pin(0.0663, D.mute);
      set(c, sa, D.ink); c.beginPath(); c.arc(sc.X(mx + mw * 0.0062 / 0.25 + 4), my + th / 2, wd ? 4.5 : 3.5, 0, 6.2832); c.fill();
      my += wd ? 26 : 18;
      const pl = wd ? lf + 4 : 13;
      my += pl * sc.para(T('Females aged 55-59: 6.2%', 'الإناث بين 55 و59: 6.2٪'), mx, my, mw, pl, { size: lf, color: D.ink, a: sa * 0.9 });
      if (wd) {
        my += pl * sc.para(T('All US adults: 6.6%', 'كل البالغين في أمريكا: 6.6٪'), mx, my, mw, pl, { size: lf, color: D.mute, a: sa });
        
        const wa = ramp(t, 1.4, 0.4);
        my += 16;
        if (my + 5 * pl < fy + fh - 24) {
          my += pl * sc.para(T('What moves your estimate', 'ما الذي يحرّك تقديرك'), mx, my, mw, pl, { size: lf, w: 600, color: D.ink, a: wa }) + 4;
          [[T('General health: Excellent (-0.2)', 'الصحة العامة: ممتازة، أقل بـ0.2 نقطة'), 0.21], [T('BMI of 24.9 (-0.0)', 'مؤشر كتلة 24.9، فرق دون 0.1 نقطة'), 0.04]].forEach(([s, v]) => {
            my += pl * sc.para(s, mx, my, mw, pl, { size: lf, color: D.mute, a: wa }) - pl + 6;
            set(c, wa * 0.9, D.ink); fr(sc, c, mx, my, Math.max(2, mw * 0.8 * v / 0.21), 6); my += pl + 4;
          });
        }
      }
      sc.text(T('Streamlit app, 22 answers', 'تطبيق Streamlit، 22 إجابة'), fx + fw - 8, fy + fh - 8, { size: wd ? clamp(f - 1, 11, 13) : 10.5, color: D.mute, a: fa, al: 'end' });

      
      const rx = m.rx, rw = W - pad - rx;
      const la = ramp(t, 1.45, 0.3);
      
      const ratio = Math.sqrt(83165744 / 1031769), da = ramp(t, 2.0, 0.4), aa = ramp(t, 2.45, 0.35);
      if (wd) {
        let ff = 12.5; while (ff > 10.5 && sc.measure(LR(FILES[0][0]), { size: ff, w: 600 }) + 18 > rw) ff -= 0.5;
        let ry = pad + 12;
        sc.text(T('what it loads', 'ما يحمّله'), rx, ry, { size: clamp(f - 0.5, 11, 13), color: D.mute, a: la }); ry += ff + 14;
        FILES.forEach((q, i) => {
          const a = ramp(t, 1.5 + i * 0.12, 0.3);
          
          const iw = 9, ih = 12, iy = ry - ih + 1;
          set(c, a * 0.9, D.ink); c.lineWidth = 1;
          c.beginPath(); c.moveTo(sc.X(rx), iy); c.lineTo(sc.X(rx + iw - 3), iy); c.lineTo(sc.X(rx + iw), iy + 3); c.lineTo(sc.X(rx + iw), iy + ih); c.lineTo(sc.X(rx), iy + ih); c.closePath(); c.stroke();
          sc.text(LR(q[0]), rx + iw + 8, ry, { size: ff, w: 600, color: D.ink, a });
          sc.text(q[1], rx + iw + 8, ry + ff + 4, { size: Math.max(11, ff - 0.5), color: D.mute, a });
          ry += ff * 2 + (H > 450 ? 18 : 10);
        });
        const lh2 = ff + 5, room = H - pad - ry - 3 * lh2 - 16;
        const big = clamp(Math.min(rw * 0.62, room), 40, 260), small = big / ratio, qx = rx, qy = ry + 6;
        set(c, da * 0.85, D.mute); c.setLineDash([3, 3]); c.lineWidth = 1; sr(sc, c, qx, qy, big, big); c.setLineDash([]);
        set(c, aa, D.acc); fr(sc, c, qx, qy + big - small, small, small);
        let ty = qy + big + lh2 + 4;
        sc.text(T('1.0 MB: everything the app loads', '1.0 ميجابايت: كل ما يحمّله التطبيق'), rx, ty, { size: ff + 0.5, w: 650, color: D.acc, a: aa }); ty += lh2 + 2;
        sc.para(T('brfss_2011_2025.parquet, 79 MB, ' + fmtInt(6705004) + ' rows: not loaded', LR('brfss_2011_2025.parquet') + '، 79 ميجابايت، ' + fmtInt(6705004) + ' صفوف: لا يُحمَّل'), rx, ty, rw, lh2, { size: ff, color: D.mute, a: da });
      } else {
        const top = fy + fh + 12, big = Math.min(H - pad - top, 108), small = big / ratio, qx = pad, qy = H - pad - big;
        set(c, da * 0.85, D.mute); c.setLineDash([3, 3]); c.lineWidth = 1; sr(sc, c, qx, qy, big, big); c.setLineDash([]);
        set(c, aa, D.acc); fr(sc, c, qx, qy + big - small, small, small);
        const tx = qx + big + 12, tw = W - pad - tx, lh2 = 13.5;
        let ty = qy + 11;
        sc.text(T('1.0 MB: what it loads', '1.0 ميجابايت: ما يحمّله'), tx, ty, { size: 11, w: 650, color: D.acc, a: aa }); ty += lh2;
        ty += lh2 * sc.para(T('the saved model, 985 KB, and 3 JSON files', 'النموذج المحفوظ 985 كيلوبايت، و3 ملفات JSON'), tx, ty, tw, lh2, { size: 10.5, color: D.ink, a: aa * 0.9 }) + 4;
        sc.text(LR('brfss_2011_2025.parquet'), tx, ty, { size: 10.5, color: D.mute, a: da }); ty += lh2;
        sc.para(T('79 MB, ' + fmtInt(6705004) + ' rows: not loaded', '79 ميجابايت، ' + fmtInt(6705004) + ' صفوف: لا يُحمَّل'), tx, ty, tw, lh2, { size: 10.5, color: D.mute, a: da });
      }
    } };

  K.STEPS['heart'] = [S1, S2, S3, S4, S5, S6];
})();
