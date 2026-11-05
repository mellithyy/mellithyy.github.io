




(() => {
  'use strict';
  const K = window.KIT, AR = K.AR, D = K.DARK;
  const { clamp, lerp, smooth, fmtInt } = K;
  const T = (en, ar) => AR ? ar : en;
  const ROWS = T('rows', 'صفًا');
  
  
  const N = s => AR ? K.arDigits(String(s)) : String(s);
  const plus = n => '+' + N(n);

  
  
  function geo(W, H) {
    const k = Math.min(W / 704, H / 528), ph = W < 420, mn = ph ? 10.5 : 11;
    return { W, H, k, ph, wd: K.wide(W, H), pad: ph ? 14 : Math.round(clamp(24 * k, 16, 32)),
      f: (b, lo) => Math.max(lo == null ? mn : lo, Math.min(b * k, b * 1.3)) };
  }
  
  const fnt = o => { const z = o.size || 13; return `${o.w || 500} ${AR && z < 20 ? Math.round(z * 11) / 10 : z}px ${K.FACE}`; };
  function mw(sc, s, o) { const c = sc.ctx; c.font = fnt(o); try { c.fontStretch = 'normal'; } catch (e) {} return c.measureText(s).width; }
  
  
  function lat(sc, s, x, y, o = {}) {
    const c = sc.ctx, w = mw(sc, s, o), al = o.al || 'start';
    const left = al === 'center' ? sc.X(x) - w / 2 : ((al === 'start') !== AR ? sc.X(x) : sc.X(x) - w);
    c.font = fnt(o); c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = o.base || 'alphabetic';
    c.globalAlpha = clamp(o.a == null ? 1 : o.a, 0, 1); c.fillStyle = o.color || D.ink;
    c.fillText(s, left, y);
    return { left, w };
  }
  
  function box(sc, c, x, y, w, h, col, a) {
    if (a <= 0.002) return;
    c.globalAlpha = clamp(a, 0, 1); c.fillStyle = col; c.fillRect(AR ? sc.W - x - w : x, y, w, h);
  }
  
  function poly(sc, c, pts, u, col, a, lw) {
    if (a <= 0.002 || u <= 0) return;
    let L = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let left = L * clamp(u, 0, 1);
    c.globalAlpha = clamp(a, 0, 1); c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sc.X(pts[0][0]), pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const v = Math.min(1, left / seg[i - 1]);
      c.lineTo(sc.X(lerp(pts[i - 1][0], pts[i][0], v)), lerp(pts[i - 1][1], pts[i][1], v));
      left -= seg[i - 1];
    }
    c.stroke();
  }
  const ease = (t, a, d) => smooth((t - a) / d);

  
  
  
  const FILES = [
    { s: 0, f: 'cust_info.csv', h: T('Customers', 'العملاء'), cols: 'cst_id,cst_key,cst_firstname,cst_lastname,cst_marital_status,cst_gndr,cst_create_date', row: '11000,AW00011000, Jon,Yang ,M,M,2025-10-06' },
    { s: 0, f: 'prd_info.csv', h: T('Products', 'المنتجات'), cols: 'prd_id,prd_key,prd_nm,prd_cost,prd_line,prd_start_dt,prd_end_dt', row: '210,CO-RF-FR-R92B-58,HL Road Frame - Black- 58,,R ,2003-07-01,' },
    { s: 0, f: 'sales_details.csv', h: T('Sales lines', 'أسطر المبيعات'), cols: 'sls_ord_num,sls_prd_key,sls_cust_id,sls_order_dt,sls_ship_dt,sls_due_dt,sls_sales,sls_quantity,sls_price', row: 'SO43697,BK-R93R-62,21768,20101229,20110105,20110110,3578,1,3578' },
    { s: 1, f: 'CUST_AZ12.csv', h: T('Birthdates and gender', 'تواريخ الميلاد والنوع'), cols: 'CID,BDATE,GEN', row: 'NASAW00011000,1971-10-06,Male' },
    { s: 1, f: 'LOC_A101.csv', h: T('Locations', 'المواقع'), cols: 'CID,CNTRY', row: 'AW-00011000,Australia' },
    { s: 1, f: 'PX_CAT_G1V2.csv', h: T('Categories', 'الفئات'), cols: 'ID,CAT,SUBCAT,MAINTENANCE', row: 'AC_BR,Accessories,Bike Racks,Yes' },
  ];
  const S1 = {
    dur: 2.9,
    aria: { en: 'The two source systems as folders of three CSV files each. CRM: cust_info.csv holds customers, prd_info.csv products, sales_details.csv sales lines. ERP: CUST_AZ12.csv holds birthdates and gender, LOC_A101.csv locations, PX_CAT_G1V2.csv categories. Each file shows its real header columns.',
            ar: 'النظامان المصدر، لكل منهما ثلاثة ملفات CSV. في CRM: ملف cust_info.csv للعملاء، و prd_info.csv للمنتجات، و sales_details.csv لأسطر المبيعات. وفي ERP: ملف CUST_AZ12.csv لتواريخ الميلاد والنوع، و LOC_A101.csv للمواقع، و PX_CAT_G1V2.csv للفئات. ويظهر في كل ملف أسماء أعمدته الحقيقية.' },
    build(W, H) { return { g: geo(W, H), L: null }; },
    lay(sc, g) {
      const { W, H, pad, f, ph, k } = g;
      const colGap = ph ? 10 : Math.round(18 * k), colW = (W - 2 * pad - colGap) / 2;
      const fs = { sys: f(21, ph ? 14 : 15), sub: f(11.5), hold: f(14, ph ? 11 : 12), file: f(12), chip: f(11) };
      const headH = fs.sys + (ph ? 10 : Math.round(16 * k));
      const top = pad + headH, gap = ph ? 6 : Math.round(10 * k);
      const cardH = (H - pad - top - 2 * gap) / 3;
      const ip = ph ? 7 : Math.round(clamp(12 * k, 8, 15)), fold = ph ? 9 : Math.round(clamp(14 * k, 10, 18));
      const lhH = fs.hold * 1.25, lhF = fs.file * 1.45, chipH = Math.round(fs.chip + (ph ? 6 : 8)), cg = 3;
      const cards = FILES.map((fl, i) => {
        const x = pad + fl.s * (colW + colGap), y = top + (i % 3) * (cardH + gap);
        const holds = sc.wrap(fl.h, colW - 2 * ip - fold, { size: fs.hold, w: 650 });
        const used = ip + holds.length * lhH + lhF + 2;
        
        const names = fl.cols.split(','), cw = n => mw(sc, n, { size: fs.chip }) + (ph ? 8 : 10);
        const room = colW - 2 * ip, rawH = fs.chip * 1.75;
        let need = 1, lx0 = 0;
        names.forEach(n => { const w = cw(n); if (lx0 + w > room) { need++; lx0 = 0; } lx0 += w + cg; });
        const withRaw = !ph && used + need * (chipH + cg) + rawH + ip <= cardH;
        const maxLines = withRaw ? need : clamp(Math.floor((cardH - used - ip + cg) / (chipH + cg)), 0, 3);
        const chips = []; let cx = 0, line = 0;
        for (let j = 0; j < names.length && maxLines > 0; j++) {
          const w = cw(names[j]);
          if (cx + w > room) { line++; cx = 0; }
          if (line >= maxLines) break;
          chips.push({ s: names[j], x: cx, line, w }); cx += w + cg;
        }
        if (chips.length < names.length && maxLines > 0) {
          let more = names.length - chips.length, pw = cw(plus(more));
          
          while (chips.length) {
            const last = chips[chips.length - 1];
            if (last.line === maxLines - 1 && last.x + last.w + cg + pw > room) { chips.pop(); more++; pw = cw(plus(more)); }
            else break;
          }
          const last = chips[chips.length - 1];
          const lx = last ? (last.line === maxLines - 1 || last.x + last.w + cg + pw <= room ? last.x + last.w + cg : 0) : 0;
          const ll = last ? (lx === 0 ? last.line + 1 : last.line) : 0;
          if (ll < maxLines) chips.push({ s: plus(more), x: lx, line: ll, w: pw, more: true });
        }
        
        let raw = null;
        if (withRaw) { raw = fl.row; const rw = s => mw(sc, s, { size: fs.chip }); if (rw(raw) > room) { while (raw.length > 4 && rw(raw + '…') > room) raw = raw.slice(0, -1); raw += '…'; } }
        return { ...fl, x, y, w: colW, h: cardH, holds, chips, used, raw, rawY: used + 4 + need * (chipH + cg) + fs.chip * 1.05 };
      });
      return { fs, colW, colGap, cards, ip, fold, lhH, lhF, chipH, cg, top };
    },
    draw(sc, c, m, t) {
      const g = m.g; if (!m.L) m.L = this.lay(sc, g);
      const L = m.L, { pad } = g, fs = L.fs;
      
      ['CRM', 'ERP'].forEach((s, i) => {
        const a = ease(t, 0.05 + i * 0.75, 0.4), x = pad + i * (L.colW + L.colGap);
        const r = lat(sc, s, x, pad + fs.sys * 0.85, { size: fs.sys, w: 700, a });
        lat(sc, i ? 'source_erp' : 'source_crm', x + r.w + (g.ph ? 7 : 10), pad + fs.sys * 0.85, { size: fs.sub, color: D.mute, a: a * 0.9 });
      });
      L.cards.forEach((cd, i) => {
        const t0 = 0.25 + i * 0.25, a = ease(t, t0, 0.42), dy = (1 - a) * 8;
        
        const x = cd.x, y = cd.y + dy, w = cd.w, h = cd.h, fo = L.fold;
        c.globalAlpha = lerp(0.28, 1, a); c.fillStyle = D.page;
        c.beginPath(); c.moveTo(sc.X(x), y); c.lineTo(sc.X(x + w - fo), y); c.lineTo(sc.X(x + w), y + fo); c.lineTo(sc.X(x + w), y + h); c.lineTo(sc.X(x), y + h); c.closePath(); c.fill();
        c.globalAlpha = 0.45 * a; c.fillStyle = D.mute;
        c.beginPath(); c.moveTo(sc.X(x + w - fo), y); c.lineTo(sc.X(x + w - fo), y + fo); c.lineTo(sc.X(x + w), y + fo); c.closePath(); c.fill();
        if (a <= 0.01) return;
        let yy = y + L.ip + fs.hold * 0.9;
        cd.holds.forEach(l => { sc.text(l, x + L.ip, yy, { size: fs.hold, w: 650, a }); yy += L.lhH; });
        yy += L.lhF - L.lhH + 1;
        lat(sc, cd.f, x + L.ip, yy - 1, { size: fs.file, color: D.mute, a });
        const cy0 = cd.y + cd.used + 4 + dy;
        cd.chips.forEach((ch, j) => {
          const ca = a * ease(t, t0 + 0.28 + j * 0.035, 0.22);
          if (ca <= 0.01) return;
          const cx = x + L.ip + ch.x, cy = cy0 + ch.line * (L.chipH + L.cg);
          box(sc, c, cx, cy, ch.w, L.chipH, D.surf, ca * 0.95);
          lat(sc, ch.s, cx + ch.w / 2, cy + L.chipH / 2 + fs.chip * 0.36, { size: fs.chip, color: ch.more ? D.mute : D.ink, a: ca * (ch.more ? 0.9 : 0.82), al: 'center' });
        });
        if (cd.raw) lat(sc, cd.raw, x + L.ip, cd.y + cd.rawY + dy, { size: fs.chip, color: D.mute, a: a * ease(t, t0 + 0.6, 0.3) });
      });
    },
  };

  
  
  
  
  const LOADS = [['cust_info.csv', 'bronze.crm_cust_info', 18494], ['prd_info.csv', 'bronze.crm_prd_info', 397], ['sales_details.csv', 'bronze.crm_sales_details', 60398],
                 ['CUST_AZ12.csv', 'bronze.erp_cust_az12', 18484], ['LOC_A101.csv', 'bronze.erp_loc_a101', 18484], ['PX_CAT_G1V2.csv', 'bronze.erp_px_cat_g1v2', 37]];
  const B0 = 0.55, BS = 0.36;
  const S2 = {
    dur: 3.2,
    aria: { en: 'One stored procedure, bronze.load_bronze, loads the six CSV files into six bronze tables with BULK INSERT, one after the other, and every table arrives with the same rows as its file: crm_cust_info 18,494, crm_prd_info 397, crm_sales_details 60,398, erp_cust_az12 18,484, erp_loc_a101 18,484, erp_px_cat_g1v2 37. A stopwatch beside each table closes as its load is timed, and one more times the whole run.',
            ar: 'إجراء مخزّن واحد هو bronze.load_bronze يحمّل ملفات CSV الستة في ستة جداول برونزية بأمر BULK INSERT، واحدًا بعد الآخر، ويصل كل جدول بعدد صفوف ملفه نفسه: crm_cust_info فيه 18,494، و crm_prd_info فيه 397، و crm_sales_details فيه 60,398، و erp_cust_az12 فيه 18,484، و erp_loc_a101 فيه 18,484، و erp_px_cat_g1v2 فيه 37. وبجانب كل جدول ساعة توقيت تكتمل حين يُقاس زمن تحميله، وساعة أخرى تقيس التشغيل كله.' },
    build(W, H) { return { g: geo(W, H), L: null }; },
    lay(sc, g) {
      const { W, H, pad, f, ph, k } = g;
      const fs = { ttl: f(14, ph ? 11.5 : 12), hd: f(11), file: f(12), tbl: f(12.5), cnt: f(12) };
      const ip = ph ? 9 : Math.round(clamp(16 * k, 10, 20));
      const x0 = pad + ip, x1 = W - pad - ip;
      const r = ph ? 6.5 : clamp(8 * k, 7, 11);
      const fileW = Math.max(...LOADS.map(l => mw(sc, l[0], { size: fs.file })));
      const tblW = Math.max(...LOADS.map(l => mw(sc, l[1], { size: fs.tbl, w: 600 })));
      const cntW = Math.max(...LOADS.map(l => sc.measure(fmtInt(l[2]) + ' ' + ROWS, { size: fs.cnt })));
      const gp = ph ? 8 : Math.round(clamp(14 * k, 10, 18));
      const ringX = x1 - r;
      const one = fileW + 40 * Math.max(0.6, k) + tblW + cntW + 2 * r + 4 * gp <= x1 - x0;
      let tblX, cntX;
      if (one) { cntX = ringX - r - gp - cntW; tblX = cntX - gp - tblW; } else { tblX = ringX - r - gp - tblW; cntX = tblX; }
      const conn = [x0 + fileW + gp, tblX - gp];
      const titleY = pad + ip + fs.ttl * 0.85;
      const headY = titleY + (ph ? 17 : Math.round(26 * k));
      const footH = ph ? 30 : Math.round(clamp(44 * k, 32, 56));
      const rowsTop = headY + (ph ? 6 : 10), rowsBot = H - pad - footH;
      const rowH = (rowsBot - rowsTop) / 6;
      return { fs, ip, x0, x1, r, fileW, tblW, cntW, gp, ringX, one, tblX, cntX, conn, titleY, headY, rowsTop, rowH, footY: H - pad - footH / 2 };
    },
    draw(sc, c, m, t) {
      const g = m.g; if (!m.L) m.L = this.lay(sc, g);
      const L = m.L, { W, H, pad } = g, fs = L.fs;
      
      box(sc, c, pad, pad, W - 2 * pad, H - 2 * pad, D.page, 0.55 + 0.25 * ease(t, 0, 0.5));
      const ha = ease(t, 0.05, 0.4);
      const tr = lat(sc, 'EXEC bronze.load_bronze', L.x0, L.titleY, { size: fs.ttl, w: 650, a: ha });
      
      const hd = { size: fs.hd, color: D.mute, a: ha };
      sc.text(T('CSV file', 'ملف CSV'), L.x0, L.headY, hd);
      lat(sc, 'BULK INSERT', (L.conn[0] + L.conn[1]) / 2, L.headY, { ...hd, al: 'center' });
      const tH = T('Bronze table', 'الجدول البرونزي');
      if (!g.ph || L.tblX > (L.conn[0] + L.conn[1]) / 2 + mw(sc, 'BULK INSERT', hd) / 2 + 6) sc.text(tH, L.tblX, L.headY, hd);
      const durL = T('Load Duration', 'مدة التحميل');
      if (L.tblX + sc.measure(tH, hd) + 16 < L.x1 - sc.measure(durL, hd)) sc.text(durL, L.x1, L.headY, { ...hd, al: 'end' });
      const ring = (cx, cy, r, u, a, lw) => {
        const X = sc.X(cx);
        c.globalAlpha = a * 0.35; c.strokeStyle = D.mute; c.lineWidth = lw;
        c.beginPath(); c.arc(X, cy, r, 0, 6.2832); c.stroke();
        c.globalAlpha = a * 0.9; c.fillStyle = D.mute; c.fillRect(X - lw, cy - r - lw * 2.6, lw * 2, lw * 1.8);    
        if (u > 0) {
          c.globalAlpha = a; c.strokeStyle = D.ink; c.lineWidth = lw * 1.25;
          c.beginPath(); c.arc(X, cy, r, -Math.PI / 2, -Math.PI / 2 + 6.2832 * clamp(u, 0, 1)); c.stroke();
          
          if (u < 1) {
            const an = -Math.PI / 2 + 6.2832 * u;
            c.lineWidth = lw; c.beginPath(); c.moveTo(X, cy); c.lineTo(X + Math.cos(an) * r * 0.62, cy + Math.sin(an) * r * 0.62); c.stroke();
          } else { c.globalAlpha = a * 0.9; c.fillStyle = D.ink; c.beginPath(); c.arc(X, cy, r * 0.42, 0, 6.2832); c.fill(); }
        }
      };
      const lw = g.ph ? 1.2 : clamp(1.4 * g.k, 1.2, 1.9);
      LOADS.forEach(([file, tbl, n], i) => {
        const yc = L.rowsTop + (i + 0.5) * L.rowH;
        const u = clamp((t - (B0 + i * BS)) / BS, 0, 1), done = u >= 1, on = u > 0;
        const fa = lerp(0.4, 1, ease(t, 0.1 + i * 0.05, 0.35));
        lat(sc, file, L.x0, yc + fs.file * 0.36, { size: fs.file, color: on ? D.ink : D.mute, a: fa });
        
        const [a0, a1] = L.conn;
        
        c.globalAlpha = on ? 0.5 : 0.25; c.fillStyle = on ? D.ink : D.mute;
        for (let x = a0; x <= a1; x += 5) c.fillRect(sc.X(x) - 0.7, yc - 0.7, 1.4, 1.4);
        if (on && !done) for (let j = 0; j < 6; j++) {
          const p = u * 1.5 - j * 0.1;
          if (p <= 0 || p >= 1) continue;
          box(sc, c, lerp(a0, a1, p) - 1.6, yc - 1.6, 3.2, 3.2, D.ink, 0.95);
        }
        const two = !L.one, ty = two ? yc - 1 : yc + fs.tbl * 0.36;
        lat(sc, tbl, L.tblX, ty, { size: fs.tbl, w: 600, color: on ? D.ink : D.mute, a: lerp(0.32, 1, ease(t, B0 + i * BS, 0.2)) });
        if (on) {
          const s = fmtInt(n * smooth(u)) + ' ' + ROWS;
          sc.text(s, two ? L.cntX : L.cntX + L.cntW, two ? yc + fs.cnt * 1.15 : yc + fs.cnt * 0.36, { size: fs.cnt, color: done ? D.ink : D.mute, al: two ? 'start' : 'end' });
        }
        ring(L.ringX, yc, L.r, u, lerp(0.35, 1, ease(t, 0.1, 0.4)), lw);
      });
      
      const U = clamp((t - B0) / (6 * BS), 0, 1), fa = ease(t, 0.2, 0.4);
      const R = L.r * 1.3;
      ring(L.ringX + L.r - R, L.footY, R, U, fa, lw * 1.1);
      sc.text(T('Total Load Duration', 'المدة الكلية للتحميل'), L.ringX + L.r - 2 * R - L.gp, L.footY + fs.hd * 0.36, { size: fs.hd, color: U >= 1 ? D.ink : D.mute, a: fa, al: 'end' });
    },
  };

  
  
  
  const FIXES = [
    { t: 'crm_cust_info', ch: [['cst_firstname', '"  Lauren"', 'Lauren', 'TRIM'], ['cst_marital_status', 'M', 'Married', 'CASE']] },
    { t: 'crm_prd_info', ch: [['prd_line', '"R "', 'Road', 'CASE'], ['prd_cost', 'NULL', N(0), 'ISNULL']] },
    { t: 'crm_sales_details', ch: [['sls_order_dt', '20130520', '2013-05-20', 'CAST'], ['sls_sales', N(35), N(70), N('2 × 35')]] },
    { t: 'erp_cust_az12', ch: [['cid', 'NASAW00012188', 'AW00012188', 'SUBSTRING', [0, 3]], ['bdate', '9999-11-20', 'NULL', '> GETDATE()']] },
    { t: 'erp_loc_a101', ch: [['cid', 'AW-00011237', 'AW00011237', 'REPLACE', [2, 3]], ['cntry', 'DE', 'Germany', 'CASE']] },
    { t: 'erp_px_cat_g1v2', same: [['id', 'AC_BR'], ['cat', 'Accessories'], ['subcat', 'Bike Racks'], ['maintenance', 'Yes']] },
  ];
  const C0 = 0.35, CS = 0.36;
  const S3 = {
    dur: 3.1,
    aria: { en: 'A second stored procedure, silver.load_silver, cleans one table after another. One real row of each: cst_firstname "  Lauren" trimmed to Lauren and marital status M to Married; product line "R " to Road and an empty cost to 0; order date 20130520 to the date 2013-05-20 and sales 35 recomputed as 2 × 35 = 70; the NAS prefix cut from NASAW00012188 and the birthdate 9999-11-20 emptied; the dash taken out of AW-00011237 and DE written as Germany; the category table copied as it is.',
            ar: 'إجراء مخزّن ثانٍ هو silver.load_silver ينظّف الجداول واحدًا بعد الآخر. صف حقيقي من كل جدول: الاسم "  Lauren" بعد حذف المسافات Lauren والحالة M تصير Married؛ وخط المنتج "R " يصير Road والتكلفة الفارغة 0؛ وتاريخ الطلب 20130520 يصير تاريخًا 2013-05-20 والمبيعات 35 تُعاد حسابًا 2 × 35 = 70؛ والبادئة NAS تُحذف من NASAW00012188 وتاريخ الميلاد 9999-11-20 يُفرَّغ؛ والشرطة تُحذف من AW-00011237 و DE تصير Germany؛ وجدول الفئات يُنسخ كما هو.' },
    build(W, H) { return { g: geo(W, H), L: null }; },
    lay(sc, g) {
      const { W, H, pad, f, ph, k, wd } = g;
      const fs = { ttl: f(14, ph ? 11.5 : 12), tbl: f(12.5), col: f(11), val: f(12.5, ph ? 10.5 : 11.5), note: f(11) };
      const cols = wd ? 3 : 2, rows = 6 / cols, gap = ph ? 6 : Math.round(clamp(10 * k, 7, 14));
      const top = pad + fs.ttl + (ph ? 9 : Math.round(14 * k)), bot = H - pad - fs.note - (ph ? 7 : 10);
      const cw = (W - 2 * pad - (cols - 1) * gap) / cols, chh = (bot - top - (rows - 1) * gap) / rows;
      const ip = ph ? 7 : Math.round(clamp(11 * k, 8, 15)), head = fs.tbl * 1.55;
      const inner = chh - 2 * ip - head;
      const n = inner >= 4 * fs.val * 1.42 + fs.val * 0.5 ? 2 : 1;
      
      const lh = fs.val * 1.5, cgap = n > 1 ? clamp((inner - n * 2 * lh) / (n - 0.4), lh * 0.5, lh * 2.2) : 0;
      return { fs, cols, gap, top, bot, cw, chh, ip, lh, cgap, head, n,
        cards: FIXES.map((fx, i) => ({ ...fx, x: pad + (i % cols) * (cw + gap), y: top + Math.floor(i / cols) * (chh + gap) })) };
    },
    draw(sc, c, m, t) {
      const g = m.g; if (!m.L) m.L = this.lay(sc, g);
      const L = m.L, { W, H, pad } = g, fs = L.fs;
      lat(sc, 'EXEC silver.load_silver', pad, pad + fs.ttl * 0.85, { size: fs.ttl, w: 650, a: ease(t, 0.05, 0.4) });
      sc.text(T('One real row of each table, before and after', 'صف حقيقي من كل جدول، قبل التنظيف وبعده'), pad, H - pad, { size: fs.note, color: D.mute, a: ease(t, 0.1, 0.4) });
      L.cards.forEach((cd, i) => {
        const t0 = C0 + i * CS, on = ease(t, t0, 0.3);
        box(sc, c, cd.x, cd.y, L.cw, L.chh, D.page, lerp(0.32, 1, on));
        
        box(sc, c, cd.x, cd.y, 2, L.chh * on, D.ink, 0.5 * on);
        const x0 = cd.x + L.ip, x1 = cd.x + L.cw - L.ip;
        lat(sc, cd.t, x0, cd.y + L.ip + L.fs.tbl * 0.85, { size: fs.tbl, w: 650, color: D.ink, a: lerp(0.4, 1, on) });
        let y = cd.y + L.ip + L.head;
        if (cd.same) {
          
          const k = L.n * 2 - 1;
          cd.same.slice(0, k).forEach(([col, v], j) => {
            const a = ease(t, t0 + 0.1 + j * 0.06, 0.25), yy = y + j * L.lh + fs.val * 0.8;
            lat(sc, col, x0, yy, { size: fs.col, color: D.mute, a });
            lat(sc, v, x1, yy, { size: fs.val, w: 600, a, al: 'end' });
          });
          sc.text(T('Copied as it is', 'يُنسخ كما هو'), x0, y + k * L.lh + fs.val * 0.8, { size: fs.col, color: D.mute, a: ease(t, t0 + 0.35, 0.3) });
          return;
        }
        cd.ch.slice(0, L.n).forEach(([col, before, after, rule, acc], j) => {
          const tb = t0 + 0.08 + j * 0.12;
          const a = ease(t, tb, 0.22), st = ease(t, tb + 0.2, 0.28), aa = ease(t, tb + 0.42, 0.28);
          const y1 = y + fs.val * 0.8, y2 = y1 + L.lh;
          lat(sc, col, x0, y1, { size: fs.col, color: D.mute, a: a * 0.95 });
          
          const bo = { size: fs.val, color: D.mute, a: a * lerp(1, 0.7, st), al: 'end' };
          const r = lat(sc, before, x1, y1, bo);
          if (acc) {
            const pre = mw(sc, before.slice(0, acc[0]), bo), part = before.slice(acc[0], acc[1]);
            c.font = fnt(bo); c.direction = 'ltr'; c.textAlign = 'left'; c.globalAlpha = a; c.fillStyle = D.acc;
            c.fillText(part, r.left + pre, y1);
          }
          if (st > 0) {
            
            const sy = y1 - fs.val * 0.32;
            if (acc) {
              const p0 = r.left + mw(sc, before.slice(0, acc[0]), bo), p1 = r.left + mw(sc, before.slice(0, acc[1]), bo);
              c.globalAlpha = a; c.fillStyle = D.acc; c.fillRect(p0 - 1, sy, (p1 - p0 + 2) * st, 1.4);
            } else { c.globalAlpha = a * 0.85; c.fillStyle = D.mute; c.fillRect(r.left, sy, r.w * st, 1.2); }
          }
          lat(sc, rule, x0, y2, { size: fs.col, color: D.mute, a: aa * 0.75 });
          lat(sc, after, x1, y2 + (1 - aa) * 4, { size: fs.val, w: 650, color: D.ink, a: aa, al: 'end' });
          y += 2 * L.lh + L.cgap;
        });
      });
    },
  };

  
  
  
  const VIEWS = {
    cust: { name: 'gold.dim_customers', n: 18484, role: T('Dimension', 'بُعد'), cells: [['customer_key', N(10769), 0, 1], ['customer_number', 'AW00021768', 1], ['first_name', 'Cole', 1], ['last_name', 'Watson', 2], ['country', 'Canada', 2], ['marital_status', 'Single', 4], ['gender', 'Male', 4]] },
    fact: { name: 'gold.fact_sales', n: 60398, role: T('Fact table', 'جدول الحقائق'), cells: [['order_number', 'SO43697', 1], ['product_key', N(20), 0, 2], ['customer_key', N(10769), 0, 1], ['order_date', '2010-12-29', 2], ['sales_amount', N('3,578'), 1], ['quantity', N(1), 3], ['price', N('3,578'), 3]] },
    prod: { name: 'gold.dim_products', n: 295, role: T('Dimension', 'بُعد'), cells: [['product_key', N(20), 0, 2], ['product_number', 'BK-R93R-62', 2], ['product_name', 'Road-150 Red- 62', 1], ['category', 'Bikes', 1], ['subcategory', 'Road Bikes', 3]] },
  };
  const S4 = {
    dur: 2.9,
    aria: { en: 'Three gold views, each with one real row. gold.fact_sales, 60,398 rows: order SO43697 on 2010-12-29 for 3,578, with product_key 20 and customer_key 10769. Its customer_key finds Cole Watson of Canada in gold.dim_customers, 18,484 rows; its product_key finds the Road-150 Red bike in gold.dim_products, 295 rows.',
            ar: 'ثلاثة عروض ذهبية، في كل منها صف حقيقي. gold.fact_sales فيه 60,398 صفًا: الطلب SO43697 بتاريخ 2010-12-29 بقيمة 3,578، ومفتاحاه product_key 20 و customer_key 10769. يجد customer_key العميل Cole Watson من Canada في gold.dim_customers وفيه 18,484 صفًا، ويجد product_key الدراجة Road-150 Red في gold.dim_products وفيه 295 صفًا.' },
    build(W, H) { return { g: geo(W, H), L: null }; },
    lay(sc, g) {
      const { W, H, pad, f, ph, k } = g;
      const fs = { ttl: f(13.5, ph ? 11.5 : 12), cnt: f(11.5), col: f(11), val: f(13, ph ? 11 : 12) };
      const iw = W - 2 * pad, gapMin = ph ? 8 : Math.round(clamp(14 * k, 10, 18));
      
      const fit = v => {
        let cells = v.cells.map(([col, val, pri, key]) => ({ col, val, pri, key, w: Math.max(mw(sc, col, { size: fs.col }), mw(sc, val, { size: fs.val, w: 600 })) }));
        while (cells.reduce((a, cc) => a + cc.w, 0) + gapMin * (cells.length - 1) > iw) {
          const worst = cells.reduce((b, cc, i) => cc.pri >= cells[b].pri ? i : b, 0);
          cells.splice(worst, 1);
        }
        const sum = cells.reduce((a, cc) => a + cc.w, 0);
        const gp = cells.length > 1 ? Math.min((iw - sum) / (cells.length - 1), gapMin * 2.6) : 0;
        let x = pad; cells.forEach(cc => { cc.x = x; x += cc.w + gp; });
        return cells;
      };
      const lhT = fs.ttl * 1.6, lhC = fs.col * 1.5, lhV = fs.val * 1.5, gh = ph ? 0 : 2;
      const blockH = lhT + lhC + lhV + gh * 7;
      const space = (H - 2 * pad - 3 * blockH) / 2;
      const blocks = {};
      
      let y = pad;
      blocks.cust = { y, title: y + fs.ttl, colY: y + lhT + fs.col, valY: y + lhT + lhC + fs.val, bot: y + blockH, cells: fit(VIEWS.cust) };
      y += blockH + space;
      blocks.fact = { y, title: y + fs.ttl, colY: y + lhT + fs.col, valY: y + lhT + lhC + fs.val, bot: y + blockH, cells: fit(VIEWS.fact) };
      y += blockH + space;
      blocks.prod = { y, colY: y + fs.col, valY: y + lhC + fs.val, title: y + lhC + lhV + gh * 7 + fs.ttl * 1.15, bot: y + blockH, cells: fit(VIEWS.prod) };
      return { fs, blocks, lhT, lhC, lhV, gh, space };
    },
    draw(sc, c, m, t) {
      const g = m.g; if (!m.L) m.L = this.lay(sc, g);
      const L = m.L, fs = L.fs, B = L.blocks;
      const keyOn = ease(t, 1.0, 0.25);
      const writeIn = (b, v, t0, isFact) => {
        const ta = ease(t, t0 - 0.1, 0.3);
        const nm = lat(sc, v.name, g.pad, b.title, { size: fs.ttl, w: 650, a: ta });
        sc.text(fmtInt(v.n) + ' ' + ROWS, g.pad + nm.w + (g.ph ? 8 : 12), b.title, { size: fs.cnt, color: D.mute, a: ta });
        sc.text(v.role, g.W - g.pad, b.title, { size: fs.cnt, color: isFact ? D.ink : D.mute, w: isFact ? 600 : 500, a: ta, al: 'end' });
        b.cells.forEach((cc, j) => {
          const a = ease(t, t0 + j * 0.06, 0.25);
          const lit = cc.key ? (isFact ? keyOn : ease(t, t0 + 0.05, 0.25)) : 0;
          const cx = cc.x;
          lat(sc, cc.col, cx, b.colY, { size: fs.col, color: D.mute, a: a * (1 - lit) });
          lat(sc, cc.val, cx, b.valY, { size: fs.val, w: 600, color: D.ink, a: a * (1 - lit) });
          if (lit > 0) {
            lat(sc, cc.col, cx, b.colY, { size: fs.col, color: D.acc, a: a * lit });
            lat(sc, cc.val, cx, b.valY, { size: fs.val, w: 650, color: D.acc, a: a * lit });
          }
          
          if (L.gh && !(isFact && cc.key) && !(b === B.cust && cc.key)) for (let r = 0; r < 2; r++)
            box(sc, c, cx, b.valY + fs.val * 0.55 + 5 + r * 7, cc.w * (0.55 + 0.35 * ((j * 7 + r * 3) % 5) / 4), L.gh, D.ink, (r ? 0.07 : 0.12) * lerp(0.5, 1, a));
        });
      };
      
      if (L.gh) [B.cust, B.fact, B.prod].forEach(b => b.cells.forEach((cc, j) => box(sc, c, cc.x, b.valY + fs.val * 0.55 + 5, cc.w * 0.6, L.gh, D.ink, 0.06 * (1 - ease(t, 0.2, 0.4)))));
      
      box(sc, c, g.pad - (g.ph ? 6 : 10), B.fact.y - (g.ph ? 6 : 9), g.W - 2 * g.pad + (g.ph ? 12 : 20), B.fact.bot - B.fact.y + (g.ph ? 10 : 14), D.page, lerp(0.35, 1, ease(t, 0.1, 0.4)));
      writeIn(B.fact, VIEWS.fact, 0.3, true);
      
      const fk = k => B.fact.cells.find(cc => cc.key === k), dk = (b, k) => b.cells.find(cc => cc.key === k);
      const link = (a, b, up, t0) => {
        if (!a || !b) return;
        const ax = a.x + mw(sc, a.col, { size: fs.col }) / 2, bx = b.x + mw(sc, b.col, { size: fs.col }) / 2;
        const ya = up ? B.fact.colY - fs.col - 4 : B.fact.valY + fs.val * 0.45 + 4;
        const yb = up ? B.cust.valY + fs.val * 0.45 + 4 : B.prod.colY - fs.col - 4;
        const ym = (ya + yb) / 2;
        poly(sc, c, [[ax, ya], [ax, ym], [bx, ym], [bx, yb]], ease(t, t0, 0.55), D.acc, 0.95, g.ph ? 1.3 : clamp(1.6 * g.k, 1.3, 2.2));
      };
      link(fk(1), dk(B.cust, 1), true, 1.15);
      link(fk(2), dk(B.prod, 2), false, 1.3);
      writeIn(B.cust, VIEWS.cust, 1.62, false);
      writeIn(B.prod, VIEWS.prod, 1.78, false);
    },
  };

  
  
  
  
  
  const SCRIPTS = [
    ['01_database_exploration.sql'], ['02_dimensions_exploration.sql'], ['03_date_range_exploration.sql'], ['04_measures_exploration.sql'],
    ['05_magnitude_analysis.sql'], ['06_ranking_analysis.sql'],
    ['07_change_over_time_analysis.sql', 'time', 'YEAR(), DATETRUNC()'], ['08_cumulative_analysis.sql', 'run', 'SUM() OVER (ORDER BY)'],
    ['09_performance_analysis.sql', 'perf', 'LAG(), AVG() OVER'], ['10_data_segmentation.sql', 'seg', 'CASE WHEN'],
    ['11_part_to_whole_analysis.sql', 'part', 'SUM() OVER ()'],
    ['12_report_customers.sql'], ['13_report_products.sql'],
  ];
  const GLY = {
    time: [7075088, 5842231, 16344878],                       
    run: [43419, 7118507, 12960738, 29305616, 29351258],       
    perf: [104, 137],                                           
    seg: [110, 101, 45, 39],                                    
    part: 0.9646,                                               
  };
  const S5 = {
    dur: 3.2,
    aria: { en: 'The thirteen analysis scripts, 01 to 13, listed by file name. Five light up with their key SQL and a small shape of their real result: 07 change over time (sales by year, highest in 2013), 08 running totals (rising to 29.4 million), 09 performance (product-years above and below their own average), 10 segments (products by cost range), 11 part to whole (bikes, 96.5% of sales).',
            ar: 'ملفات التحليل الثلاثة عشر، من 01 إلى 13، بأسمائها. يضيء منها خمسة مع أمر SQL الأساسي في كل منها وشكل صغير لنتيجته الحقيقية: 07 التغيّر عبر الزمن (المبيعات حسب السنة، وأعلاها في 2013)، و08 المجاميع التراكمية (ترتفع حتى 29.4 مليون)، و09 الأداء (سنوات المنتجات فوق متوسطها وتحته)، و10 الشرائح (المنتجات حسب فئة التكلفة)، و11 نسبة الجزء من الكل (الدراجات 96.5٪ من المبيعات).' },
    build(W, H) { return { g: geo(W, H), L: null }; },
    lay(sc, g) {
      const { W, H, pad, f, ph, k } = g;
      const fs = { name: f(12.5, ph ? 10.5 : 11), sql: f(11), note: f(11) };
      const noteH = fs.note + (ph ? 8 : 12);
      const rowH = (H - 2 * pad - noteH) / SCRIPTS.length;
      const gw = ph ? 34 : Math.round(clamp(64 * k, 44, 84)), gh = Math.min(rowH * 0.72, ph ? 13 : 24 * Math.max(0.8, k));
      const nameW = Math.max(...SCRIPTS.map(s => mw(sc, s[0], { size: fs.name, w: 600 })));
      const sqlW = Math.max(...SCRIPTS.filter(s => s[2]).map(s => mw(sc, s[2], { size: fs.sql })));
      const gap = ph ? 10 : Math.round(clamp(20 * k, 12, 26));
      const showSql = nameW + sqlW + gw + 2 * gap <= W - 2 * pad;
      return { fs, rowH, gw, gh, nameW, sqlW, gap, showSql, gx: W - pad - gw, top: pad };
    },
    draw(sc, c, m, t) {
      const g = m.g; if (!m.L) m.L = this.lay(sc, g);
      const L = m.L, fs = L.fs, { pad, H } = g;
      sc.text(T('Small shapes: each script\u2019s own result on the gold layer', 'الأشكال الصغيرة: نتيجة كل ملف على الطبقة الذهبية'), pad, H - pad, { size: fs.note, color: D.mute, a: ease(t, 1.6, 0.5) });
      let hi = 0;
      SCRIPTS.forEach(([name, kind, sql], i) => {
        const yc = L.top + (i + 0.5) * L.rowH, by = yc + fs.name * 0.36;
        const a = lerp(0.3, 1, ease(t, 0.1 + i * 0.05, 0.3));
        if (!kind) { lat(sc, name, pad, by, { size: fs.name, color: D.mute, a: a * 0.62 }); return; }
        const t0 = 1.0 + hi * 0.24; hi++;
        const on = ease(t, t0, 0.3);
        
        box(sc, c, pad - 6, yc - L.rowH * 0.46, g.W - 2 * pad + 12, L.rowH * 0.92, D.page, 0.85 * on);
        lat(sc, name, pad, by, { size: fs.name, w: 600, color: on > 0.5 ? D.ink : D.mute, a: a * lerp(0.62, 1, on) });
        if (L.showSql) lat(sc, sql, L.gx - L.gap, yc + fs.sql * 0.36, { size: fs.sql, color: D.mute, a: on, al: 'end' });
        this.glyph(sc, c, kind, L.gx, yc, L.gw, L.gh, ease(t, t0 + 0.15, 0.55), on);
      });
    },
    glyph(sc, c, kind, x, yc, w, h, u, a) {
      if (a <= 0.01) return;
      const top = yc - h / 2, bot = yc + h / 2, lw = 1.5;
      if (kind === 'time') {                         
        const mx = Math.max(...GLY.time), bw = w / 3 - 3;
        GLY.time.forEach((v, i) => { const bh = h * v / mx * u; box(sc, c, x + i * (bw + 4.5), bot - bh, bw, bh, D.ink, a * 0.9); });
      } else if (kind === 'run') {                   
        const mx = GLY.run[GLY.run.length - 1];
        poly(sc, c, GLY.run.map((v, i) => [x + w * i / (GLY.run.length - 1), bot - h * v / mx]), u, D.ink, a, lw);
      } else if (kind === 'perf') {                  
        const mx = Math.max(...GLY.perf), bw = w * 0.3;
        poly(sc, c, [[x, yc], [x + w, yc]], 1, D.mute, a * 0.7, 1);
        const up = h / 2 * GLY.perf[0] / mx * u, dn = h / 2 * GLY.perf[1] / mx * u;
        box(sc, c, x + w * 0.14, yc - up, bw, up, D.ink, a * 0.9);
        box(sc, c, x + w * 0.56, yc, bw, dn, D.mute, a * 0.9);
      } else if (kind === 'seg') {                   
        const mx = Math.max(...GLY.seg), bw = w / 4 - 3;
        GLY.seg.forEach((v, i) => { const bh = h * v / mx * u; box(sc, c, x + i * (bw + 4), bot - bh, bw, bh, D.ink, a * (0.95 - i * 0.12)); });
      } else if (kind === 'part') {                  
        const r = h / 2, X = sc.X(x + w / 2);
        c.globalAlpha = a * 0.5; c.strokeStyle = D.mute; c.lineWidth = Math.max(3, r * 0.42);
        c.beginPath(); c.arc(X, yc, r * 0.78, 0, 6.2832); c.stroke();
        c.globalAlpha = a; c.strokeStyle = D.ink;
        const s = -Math.PI / 2, e = s + 6.2832 * GLY.part * u;
        c.beginPath(); AR ? c.arc(X, yc, r * 0.78, s, s - 6.2832 * GLY.part * u, true) : c.arc(X, yc, r * 0.78, s, e); c.stroke();
      }
    },
  };

  
  
  
  
  const REP = [
    { name: 'gold.report_customers', cols: ['customer_key', 'customer_number', 'customer_name', 'age', 'age_group', 'customer_segment', 'last_order_date', 'recency', 'total_orders', 'total_sales', 'total_quantity', 'lifespan', 'avg_order_value', 'avg_monthly_spend'], feed: ['total_orders', 'avg_order_value'] },
    { name: 'gold.report_products', cols: ['product_key', 'product_name', 'category', 'subcategory', 'cost', 'last_sale_date', 'recency_in_months', 'product_segment', 'lifespan', 'total_orders', 'total_sales', 'total_quantity', 'total_customers', 'avg_selling_price', 'avg_order_revenue', 'avg_monthly_revenue'], feed: ['product_segment', 'total_sales'] },
  ];
  const TILES = [
    { v: 0, col: 'total_orders', hd: T('Customers by number of orders', 'العملاء حسب عدد الطلبات'), hs: T('Orders per customer', 'طلبات كل عميل'), bars: [['1', 11617], ['2', 5454], ['3', 1166], ['4+', 245]], lab: T(null, ['1', '2', '3', '4 فأكثر']) },
    { v: 0, col: 'avg_order_value', hd: T('Average order, median customer', 'متوسط الطلب لدى العميل الوسيط'), hs: T('Median customer', 'العميل الوسيط'), big: 157 },
    { v: 1, col: 'product_segment', hd: T('Products sold, by segment', 'المنتجات المبيعة حسب الشريحة'), hs: T('Products by segment', 'المنتجات حسب الشريحة'), bars: [['High', 66], ['Mid', 58], ['Low', 6]], lab: T(null, ['عالٍ', 'متوسط', 'منخفض']) },
    { v: 1, col: 'total_sales', hd: T('Top product', 'المنتج الأول'), hs: T('Top product', 'المنتج الأول'), top: ['Mountain-200 Black- 46', 1373454] },
  ];
  const S6 = {
    dur: 3.2,
    aria: { en: 'Two report views with their real columns, gold.report_customers and gold.report_products, feed four dashboard tiles: customers by number of orders (11,617 with one order, 5,454 with two, 1,166 with three, 245 with four or more), the median avg_order_value of 157, products sold by segment (66 high, 58 mid, 6 low performers), and the top product by total_sales, Mountain-200 Black 46 with 1,373,454.',
            ar: 'عرضان للتقارير بأعمدتهما الحقيقية، gold.report_customers و gold.report_products، يغذّيان أربع بطاقات في لوحة: العملاء حسب عدد الطلبات (11,617 بطلب واحد، و5,454 بطلبين، و1,166 بثلاثة، و245 بأربعة أو أكثر)، والوسيط لـ avg_order_value وهو 157، والمنتجات المبيعة حسب الشريحة (66 أداء عالٍ و58 متوسط و6 منخفض)، والمنتج الأول في total_sales وهو Mountain-200 Black 46 بقيمة 1,373,454.' },
    build(W, H) { return { g: geo(W, H), L: null }; },
    lay(sc, g) {
      const { W, H, pad, f, ph, k, wd } = g;
      const fs = { ttl: f(12.5, ph ? 10.5 : 11.5), chip: f(11), th: f(11), big: f(26, ph ? 16 : 18), val: f(11.5) };
      const side = wd && !ph;                    
      const gap = ph ? 10 : Math.round(clamp(18 * k, 12, 24));
      const vw = side ? (W - 2 * pad - gap) * 0.42 : (W - 2 * pad - gap) / 2;
      const chipH = Math.round(fs.chip + (ph ? 6 : 8)), cg = 3;
      const ip = ph ? 7 : Math.round(clamp(11 * k, 8, 14));
      const views = REP.map((r, i) => {
        
        const x = side ? pad : pad + i * (vw + gap);
        const room = vw - 2 * ip, cw = s => mw(sc, s, { size: fs.chip }) + (ph ? 8 : 10);
        
        const vh = side ? (H - 2 * pad - gap) / 2 : ph ? 2 * ip + fs.ttl * 1.6 + 2 * (chipH + cg) : (H - 2 * pad) * 0.38;
        const y = side ? pad + i * (vh + gap) : pad;
        const lines = ph ? 2 : Math.max(1, Math.floor((vh - 2 * ip - fs.ttl * 1.6 - fs.chip * 1.5 + cg) / (chipH + cg)));
        const order = [...r.feed, ...r.cols.filter(cc => !r.feed.includes(cc))];
        const chips = []; let cx = 0, line = 0;
        for (const s of order) {
          const w = cw(s);
          
          if (cx + w > room || (cx > 0 && chips.length && chips[chips.length - 1].feed)) { line++; cx = 0; }
          if (line >= lines) break;
          chips.push({ s, x: cx, line, w, feed: r.feed.includes(s) }); cx += w + cg;
        }
        return { ...r, x, y, w: vw, h: vh, chips, more: r.cols.length - chips.length };
      });
      
      const dx = side ? pad + vw + gap : pad, dy = side ? pad : pad + views[0].h + gap;
      const dw = side ? W - pad - dx : W - 2 * pad, dh = H - pad - dy;
      const tg = ph ? 6 : Math.round(clamp(10 * k, 7, 14));
      const tw = (dw - tg) / 2, th = (dh - tg) / 2;
      const tiles = TILES.map((tl, i) => ({ ...tl, x: dx + (i % 2) * (tw + tg), y: dy + Math.floor(i / 2) * (th + tg), w: tw, h: th }));
      return { fs, side, gap, chipH, cg, ip, views, tiles, dx, dy, dw, dh };
    },
    draw(sc, c, m, t) {
      const g = m.g; if (!m.L) m.L = this.lay(sc, g);
      const L = m.L, fs = L.fs;
      const chipPos = (v, s) => { const ch = v.chips.find(cc => cc.s === s); if (!ch) return null; return { x: v.x + L.ip + ch.x, y: v.y + L.ip + fs.ttl * 1.6 + ch.line * (L.chipH + L.cg), w: ch.w }; };
      
      L.views.forEach((v, i) => {
        const a = ease(t, 0.15 + i * 0.2, 0.4);
        box(sc, c, v.x, v.y, v.w, v.h, D.page, lerp(0.3, 1, a));
        lat(sc, v.name, v.x + L.ip, v.y + L.ip + fs.ttl * 0.85, { size: fs.ttl, w: 650, a });
        v.chips.forEach((ch, j) => {
          const p = chipPos(v, ch.s), ca = a * ease(t, 0.3 + i * 0.2 + j * 0.03, 0.25);
          const lit = ch.feed ? ease(t, 1.0 + i * 0.12, 0.3) : 0;
          box(sc, c, p.x, p.y, p.w, L.chipH, D.surf, ca);
          if (lit > 0) { c.globalAlpha = ca * lit * 0.8; c.strokeStyle = D.ink; c.lineWidth = 1; c.strokeRect((AR ? g.W - p.x - p.w : p.x) + 0.5, p.y + 0.5, p.w - 1, L.chipH - 1); }
          lat(sc, ch.s, p.x + p.w / 2, p.y + L.chipH / 2 + fs.chip * 0.36, { size: fs.chip, color: ch.feed && lit > 0.5 ? D.ink : D.mute, a: ca, al: 'center' });
        });
        if (v.more > 0 && !g.ph) {
          const last = v.chips[v.chips.length - 1], ly = v.y + L.ip + fs.ttl * 1.6 + (last.line + 1) * (L.chipH + L.cg) + fs.chip * 0.9;
          const n = v.more, more = AR ? (n === 1 ? 'وعمود آخر' : n === 2 ? 'وعمودان آخران' : n <= 10 ? 'و' + n + ' أعمدة أخرى' : 'و' + n + ' عمودًا آخر') : '+' + n + (n === 1 ? ' more column' : ' more columns');
          if (ly < v.y + v.h - 2) sc.text(more, v.x + L.ip, ly, { size: fs.chip, color: D.mute, a: a * 0.9 });
        }
      });
      const da = ease(t, 0.5, 0.4);
      L.tiles.forEach((tl, i) => {
        const a = ease(t, 1.45 + i * 0.14, 0.35), ta = lerp(0.3 * da, 1, a);
        box(sc, c, tl.x, tl.y, tl.w, tl.h, D.page, ta);
        if (a <= 0.01) return;
        const ip = L.ip, x0 = tl.x + ip, x1 = tl.x + tl.w - ip;
        const ttl = sc.wrap(g.ph ? tl.hs : tl.hd, tl.w - 2 * ip, { size: fs.th, w: 600 }).slice(0, g.ph ? 1 : 2);
        let y = tl.y + ip + fs.th * 0.85;
        ttl.forEach(l => { sc.text(l, x0, y, { size: fs.th, w: 600, a }); y += fs.th * 1.3; });
        
        const cwid = mw(sc, tl.col, { size: fs.chip }) + (g.ph ? 8 : 10), cy = y - fs.th * 0.85 + 3;
        box(sc, c, x0, cy, cwid, L.chipH, D.surf, a);
        c.globalAlpha = a * 0.8; c.strokeStyle = D.ink; c.lineWidth = 1; c.strokeRect((AR ? g.W - x0 - cwid : x0) + 0.5, cy + 0.5, cwid - 1, L.chipH - 1);
        lat(sc, tl.col, x0 + cwid / 2, cy + L.chipH / 2 + fs.chip * 0.36, { size: fs.chip, color: D.ink, a, al: 'center' });
        const yb = tl.y + tl.h - ip, top = cy + L.chipH + 2;
        const grow = ease(t, 1.6 + i * 0.14, 0.6);
        if (tl.bars) {
          
          const n = tl.bars.length, mx = Math.max(...tl.bars.map(b => b[1]));
          const lab = fs.val * 1.35, bw = (x1 - x0) / n, avail = Math.max(4, yb - lab - top - fs.val * 1.4);
          tl.bars.forEach(([k, v], j) => {
            const bh = Math.max(1.5, avail * v / mx * grow), bx = x0 + j * bw + bw * 0.14, ww = bw * 0.72;
            box(sc, c, bx, yb - lab - bh, ww, bh, D.ink, a * 0.92);
            sc.text(fmtInt(v * grow), bx + ww / 2, yb - lab - bh - 4, { size: fs.val, a: a * smooth(grow * 3), al: 'center' });
            const kl = tl.lab ? tl.lab[j] : k;
            sc.text(kl, bx + ww / 2, yb - 2, { size: fs.val, color: D.mute, a, al: 'center' });
          });
        } else if (tl.big != null) {
          sc.text(fmtInt(tl.big * grow), x0, yb - 2, { size: fs.big, w: 650, a: a * smooth(grow * 3) });
        } else if (tl.top) {
          const big = Math.min(fs.big, fs.big * (tl.w - 2 * ip) / Math.max(1, sc.measure(fmtInt(tl.top[1]), { size: fs.big, w: 650 })));
          lat(sc, tl.top[0], x0, yb - big * 1.15, { size: fs.val, a });
          sc.text(fmtInt(tl.top[1] * grow), x0, yb - 2, { size: big, w: 650, a: a * smooth(grow * 3) });
        }
      });
    },
  };

  K.STEPS['sql-dwh'] = [S1, S2, S3, S4, S5, S6];
})();
