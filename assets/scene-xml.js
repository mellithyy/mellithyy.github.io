








(() => {
'use strict';
const K = window.KIT;
if (!K) return;
const { AR, clamp, lerp, smooth, spring, mkRnd } = K;
const D = K.DARK;
const fade = (t, a, d) => smooth((t - a) / (d || 0.3));
const LATIN = '"Switzer", sans-serif';


const CLASSES = [['BSC', 'BSC-%'], ['BCF', 'BSC-%/BCF-%'], ['BTS', 'BSC-%/BCF-%/BTS-%'], ['ADCE', 'BSC-%/BCF-%/BTS-%/ADCE-%'],
  ['WBTS', 'RNC-%/WBTS-%'], ['WCEL', 'RNC-%/WBTS-%/WCEL-%'], ['MRBTS', 'MRBTS-%'], ['LNBTS', 'MRBTS-%/LNBTS-%'],
  ['LNCEL', 'MRBTS-%/LNBTS-%/LNCEL-%'], ['LNREL', 'MRBTS-%/LNBTS-%/LNCEL-%/LNREL-%'], ['NRBTS', 'MRBTS-%/NRBTS-%'], ['NRCELL', 'MRBTS-%/NRBTS-%/NRCELL-%']];
const PARAMS = [['name', 'HILL_2'], ['pMax', '430'], ['dlChBw', '20'], ['swRelease', 'S22.1'], ['bcch', '62'], ['lac', '41207'], ['tac', '3105'], ['earfcnDL', '1650'], ['version', 'S22'], ['administrativeState', '1']];
function dumpLines(n, rnd) {
  const out = [];
  while (out.length < n) {
    const ci = Math.floor(rnd() * CLASSES.length), [cls, pat] = CLASSES[ci];
    const dn = 'PLMN-PLMN/' + pat.replace(/%/g, () => String(1 + Math.floor(rnd() * (rnd() < 0.5 ? 40 : 900))));
    out.push({ k: 'o', ci, cls, dn });
    const np = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < np; i++) { const p = PARAMS[Math.floor(rnd() * PARAMS.length)]; out.push({ k: 'p', n: p[0], v: p[1] }); }
    if (rnd() < 0.25) out.push({ k: 'l' });
    out.push({ k: 'c' });
  }
  return out;
}

const TNAMES = CLASSES.map(c => c[0]);

const S_XML = {
  dur: 5.3,
  build(W, H) {
    
    
    const rnd = mkRnd(4802), wd = W / H > 1.25, s = wd ? clamp(W / 1150, 0.62, 1.25) : clamp(Math.min(W, H * 1.1) / 400, 0.8, 1.75);
    
    const f = n => n * s, ft = n => Math.max(11, n * s), pad = wd ? f(24) : f(14);
    const m = { wd, pad, f, ft };
    m.lines = dumpLines(220, rnd);
    if (wd) {
      m.top = pad + f(46);
      m.xp = { x: pad, y: m.top, w: Math.round(W * 0.36), h: Math.round(H * 0.5 - m.top) };
      m.grid = { x0: Math.round(W * 0.415), x1: W - pad, y0: m.top + f(18), y1: H - pad - f(30), cols: 4, rows: 3 };
      
      const below = H - pad - f(10) - (m.xp.y + m.xp.h), lw = f(190);
      const ccx = Math.round(m.xp.x + m.xp.w / 2);
      const cr = Math.round(clamp(Math.min(below / 2 - f(10), (m.xp.w - lw - f(24)) / 2), 26, 200));
      m.clk = { cx: ccx, cy: Math.round(m.xp.y + m.xp.h + below / 2 + f(4)), r: cr };
      m.fs = clamp(f(12.5), 10.5, 15); m.lh = Math.round(m.fs * 1.55);
    } else {
      
      
      m.top = pad + ft(26);
      m.xp = { x: pad, y: m.top, w: W - 2 * pad, h: Math.round(H * (W < 420 ? 0.22 : 0.25)) };
      const cr = Math.round(clamp(H * 0.095, 24, 70)), half = Math.max(cr, f(30));
      const ccy = Math.round(H - pad - f(10) - half);
      m.grid = { x0: pad, x1: W - pad, y0: Math.round(m.xp.y + m.xp.h + f(12)), y1: Math.round(ccy - half - f(12)), cols: 4, rows: 3 };
      m.clk = { cx: pad + cr + 2, cy: ccy, r: cr };
      m.fs = clamp(f(10.5), 10.5, 15); m.lh = Math.round(m.fs * 1.5);
    }
    
    m.readY = m.xp.y + m.xp.h * 0.62;
    
    const G = m.grid, gap = f(wd ? 12 : 7);
    m.bw = (G.x1 - G.x0 - gap * (G.cols - 1)) / G.cols; m.bh = (G.y1 - G.y0 - gap * (G.rows - 1)) / G.rows;
    m.blocks = [];
    for (let r = 0; r < G.rows; r++) for (let c = 0; c < G.cols; c++) {
      const k = m.blocks.length;
      
      const n = 4 + Math.floor(rnd() * 4), widths = [];
      for (let i = 0; i < n; i++) widths.push([0.55 + 0.4 * rnd(), 0.35 + 0.6 * rnd(), 0.3 + 0.65 * rnd()]);
      m.blocks.push({ x: G.x0 + c * (m.bw + gap), y: G.y0 + r * (m.bh + gap), n, widths, s: 0.55 + (c / G.cols) * 0.5 + rnd() * 1.7, d: 0.6 + rnd() * 0.6, name: k < TNAMES.length ? TNAMES[k] : '' });
    }
    
    const pick = [3, 6, 9];
    m.hot = pick.filter(k => k < m.blocks.length).map(k => ({ k, row: wd ? 1 + Math.floor(rnd() * (m.blocks[k].n - 1)) : k % 2, col: 1 + (k % 2) }));
    
    const P = wd ? 170 : 110;
    m.pts = [];
    for (let i = 0; i < P; i++) {
      const te = 0.45 + 2.75 * (i / P) + rnd() * 0.08, b = Math.floor(rnd() * m.blocks.length);
      m.pts.push({ te, b, z: rnd(), oy: (rnd() - 0.5) * 18, bend: (rnd() - 0.5) * (wd ? 120 : 50) });
    }
    return m;
  },
  draw(sc, c, m, t) {
    const { W, H } = sc, wd = m.wd, pad = m.pad, xp = m.xp, G = m.grid, f = m.f, ft = m.ft;
    const R = (x, y, w, h) => c.fillRect(AR ? W - x - w : x, y, w, h);
    const L = AR ? {
      caps: [[0, 'ملف إعدادات يوم كامل، يُقرأ عنصرًا بعد عنصر'], [1.3, 'كل فئة تملأ جدولها في القالب'], [3.35, 'مقارنة خلية بخلية مع قاعدة الأداة القديمة']],
      dump: 'ملف اليوم · XML', size: '4.8 جيجابايت', tables: 'جداول القالب', more: 'أكثر من 1,000 نوع',
      old: 'الاستيراد القديم', oldv: 'نحو 6 ساعات', tool: 'هذه الأداة', toolv: 'نحو 20 دقيقة', left: 'خلايا قليلة باقية، كلها معروفة السبب', syn: 'بيانات توضيحية',
    } : {
      caps: [[0, 'A day’s configuration dump, read object by object'], [1.3, 'Each class fills its table in the template'], [3.35, 'Compared cell by cell with the old tool’s database']],
      dump: 'Daily dump · XML', size: '4.8 GB', tables: 'Template tables', more: 'over 1,000 types',
      old: 'Old import', oldv: 'about 6 hours', tool: 'This tool', toolv: 'about 20 minutes', left: 'a few cells left, each one known', syn: 'Illustrative data',
    };
    const sk = fade(t, 0, 0.45);
    
    let si = 0; for (let k = 0; k < L.caps.length; k++) if (t >= L.caps[k][0]) si = k;
    L.caps.forEach(([at, s], k) => {
      const a = k === si ? (k === 0 ? sk : smooth((t - at - 0.1) / 0.25)) : (k === si - 1 ? 1 - smooth((t - L.caps[si][0]) / 0.12) : 0);
      if (a > 0.01) sc.text(s, pad, pad + f(wd ? 18 : 12), { size: ft(wd ? 18 : 13), w: 650, a });
    });
    
    c.globalAlpha = sk; c.fillStyle = D.page; R(xp.x, xp.y, xp.w, xp.h);
    const hy = xp.y + f(wd ? 24 : 16);
    sc.text(L.dump, xp.x + f(12), hy, { size: ft(wd ? 15 : 12), w: 650, a: sk });
    sc.text(L.size, xp.x + xp.w - f(12), hy, { size: ft(wd ? 13.5 : 11.5), w: 600, color: D.mute, al: 'end', a: sk });
    const bodyY = xp.y + f(wd ? 36 : 24), bodyH = xp.y + xp.h - bodyY;
    const scrollT = clamp((t - 0.25) / 3.05, 0, 1);
    
    const off = (1 - Math.pow(1 - scrollT, 2.2)) * (m.lines.length - bodyH / m.lh - 2) * m.lh;
    const sx = AR ? W - xp.x - xp.w : xp.x;
    c.save(); c.beginPath(); c.rect(sx, bodyY, xp.w, bodyH); c.clip();
    c.font = `500 ${m.fs}px ${LATIN}`; c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const first = Math.max(0, Math.floor(off / m.lh) - 1);
    for (let i = first; i < m.lines.length; i++) {
      const y = bodyY + 6 + m.fs + i * m.lh - off;
      if (y > bodyY + bodyH + m.lh) break;
      const ln = m.lines[i], edge = Math.min(1, (y - bodyY - m.fs * 0.6) / (m.lh * 0.8), (bodyY + bodyH - y) / 24);
      const hw = m.lh * 2.1, dy = Math.abs(y - m.fs * 0.35 - m.readY), near = dy <= hw ? 1 : 1 - clamp((dy - hw) / (m.lh * 1.2), 0, 1);
      const a = sk * clamp(edge, 0, 1) * (0.5 + 0.5 * near);
      if (a <= 0.01) continue;
      let x = sx + 10;
      const put = (s, col, al) => { c.globalAlpha = a * (al == null ? 1 : al); c.fillStyle = col; c.fillText(s, x, y); x += c.measureText(s).width; };
      if (ln.k === 'o') {
        
        const room = xp.w - 20, head = '<managedObject class="' + ln.cls + '" distName="', tail = '">';
        let dn = ln.dn, parts = dn.split('/');
        while (parts.length > 1 && c.measureText(head + dn + tail).width > room) { parts = parts.slice(1); dn = '…/' + parts.join('/'); }
        if (c.measureText(head + dn + tail).width > room) { put('<managedObject ', D.mute); put('class="', D.mute, 0.8); put(ln.cls, D.ink); put('"', D.mute, 0.8); put('>', D.mute); }
        else { put('<managedObject ', D.mute); put('class="', D.mute, 0.8); put(ln.cls, D.ink); put('" distName="', D.mute, 0.8); put(dn, D.ink, 0.85); put('">', D.mute); }
      }
      else if (ln.k === 'p') { x += m.fs * 1.4; put('<p name="', D.mute, 0.8); put(ln.n, D.ink, 0.9); put('">', D.mute, 0.8); put(ln.v, D.ink); put('</p>', D.mute, 0.8); }
      else if (ln.k === 'l') { x += m.fs * 1.4; const full = c.measureText('<list name="bandList"><p>900</p><p>1800</p></list>').width < xp.w - 20 - m.fs * 1.4;
        put('<list name="', D.mute, 0.8); put('bandList', D.ink, 0.9); put(full ? '"><p>900</p><p>1800</p></list>' : '">…</list>', D.mute, 0.8); }
      else put('</managedObject>', D.mute, 0.8);
    }
    c.restore();
    
    
    
    const rl = sk * (1 - fade(t, 3.3, 0.6));
    if (rl > 0.01) {
      const hw = m.lh * 2.1, wx = sc.X(xp.x + 5) - (AR ? xp.w - 10 : 0), ww = xp.w - 10, wy = m.readY - hw, wh = hw * 2;
      c.globalAlpha = 0.07 * rl; c.fillStyle = D.ink; R(xp.x + 5, wy, ww, wh);
      c.globalAlpha = 0.55 * rl; c.strokeStyle = D.ink; c.lineWidth = 1; c.strokeRect(Math.round(wx) + 0.5, Math.round(wy) + 0.5, Math.round(ww) - 1, Math.round(wh) - 1);
      
      const k = f(wd ? 11 : 8); c.globalAlpha = 0.95 * rl; c.lineWidth = 2;
      for (const [cx0, cy0, sx, sy] of [[wx, wy, 1, 1], [wx + ww, wy, -1, 1], [wx, wy + wh, 1, -1], [wx + ww, wy + wh, -1, -1]]) {
        c.beginPath(); c.moveTo(cx0 + sx * k, cy0); c.lineTo(cx0, cy0); c.lineTo(cx0, cy0 + sy * k); c.stroke();
      }
    }
    
    const ga = fade(t, 0.15, 0.5);
    if (wd) {
      sc.text(L.tables, G.x0, G.y0 - f(12), { size: ft(15), w: 650, a: ga });
      sc.text(L.more, G.x1, G.y0 - f(12), { size: ft(13.5), w: 600, color: D.mute, al: 'end', a: ga });
    }
    const sweep = clamp((t - 3.35) / 1.0, 0, 1), sweepX = lerp(G.x0 - 6, G.x1 + 6, smooth(sweep));
    m.blocks.forEach((b, k) => {
      const fb = smooth((t - b.s) / b.d);
      c.globalAlpha = ga * (0.55 + 0.45 * fb); c.fillStyle = D.page; R(b.x, b.y, m.bw, m.bh);
      const ix = f(wd ? 12 : 6), nz = ft(wd ? 14 : 11.5), hb = nz + f(wd ? 16 : 8), top = b.y + hb + f(wd ? 6 : 3);
      const ih = b.y + m.bh - f(wd ? 26 : 6) - top, nr = wd ? b.n : clamp(Math.floor(ih / 7), 1, b.n), rowH = ih / nr, cw = (m.bw - 2 * ix) / 3;
      if (b.name) sc.text(b.name, b.x + ix, b.y + nz + f(wd ? 8 : 4), { size: nz, w: 650, color: D.ink, a: ga });
      c.globalAlpha = ga * 0.5; c.fillStyle = '#4a4640'; R(b.x + ix, b.y + hb, m.bw - 2 * ix, 1);
      const fu = smooth((t - b.s) / b.d), shown = fu * nr, bh = Math.max(2, Math.min(f(5), rowH * 0.32));
      for (let i = 0; i < nr; i++) {
        const u = clamp(shown - i, 0, 1); if (u <= 0) break;
        const y = top + i * rowH + rowH * 0.5 - bh / 2;
        for (let q = 0; q < 3; q++) {
          const hot = m.hot.find(h => h.k === k && h.row === i && h.col === q);
          const lit = hot && sweep > 0 && b.x + m.bw / 2 <= sweepX;
          const ww = (cw - f(8)) * b.widths[i][q] * (0.4 + 0.6 * u);
          c.globalAlpha = (lit ? 1 : q ? 0.45 : 0.75) * u; c.fillStyle = lit ? D.acc : D.ink;
          R(b.x + ix + q * cw, y, ww, bh);
          if (lit) {
            
            c.globalAlpha = 0.95; c.strokeStyle = D.acc; c.lineWidth = Math.max(1.2, f(1.4));
            c.beginPath(); c.arc(sc.X(b.x + ix + q * cw + ww + f(8)), y + bh / 2, f(wd ? 5 : 3.5), 0, 6.2832); c.stroke();
          }
        }
      }
      
      if (sweep > 0 && b.x + m.bw * 0.6 <= sweepX && wd) {
        const a = fade(t, 3.35 + ((b.x - G.x0) / (G.x1 - G.x0)) * 1.0, 0.2);
        const z = f(12), tx = sc.X(b.x + m.bw - f(12) - z / 2), ty = b.y + m.bh - f(14);
        c.globalAlpha = a * 0.85; c.strokeStyle = D.ink; c.lineWidth = Math.max(1.3, f(1.5)); c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(tx - z * 0.42, ty); c.lineTo(tx - z * 0.12, ty + z * 0.3); c.lineTo(tx + z * 0.45, ty - z * 0.36); c.stroke(); c.lineCap = 'butt';
      }
    });
    
    if (sweep > 0 && sweep < 1) { c.globalAlpha = 0.7 * Math.sin(Math.PI * sweep); c.fillStyle = D.ink; R(sweepX, G.y0 - 4, 1.5, G.y1 - G.y0 + 8); }
    if (sweep >= 1 || t > 4.4) {
      const a = fade(t, 4.35, 0.4);
      if (wd) sc.text(L.left, G.x1, G.y1 + f(24), { size: ft(15), w: 650, color: D.acc, al: 'end', a });
      else {
        
        const o = { size: ft(11.5), w: 650, color: D.acc, al: 'end', a };
        const lw2 = Math.max(sc.measure(L.oldv, { size: ft(13), w: 700 }), sc.measure(L.toolv, { size: ft(13), w: 750 }));
        const mw = Math.max(80, W - pad - (m.clk.cx + m.clk.r + f(10) + lw2) - f(14)), lh2 = f(11.5) * 1.3;
        const n = sc.wrap(L.left, mw, o).length;
        sc.para(L.left, G.x1, m.clk.cy - f(6) - (n - 1) * lh2 / 2, mw, lh2, o);
      }
    }
    
    const ex = xp.x + xp.w;
    for (let i = 0; i < m.pts.length; i++) {
      const p = m.pts[i], u = (t - p.te) / 0.6;
      if (u <= 0 || u >= 1.15) continue;
      const b = m.blocks[p.b], e = smooth(clamp(u, 0, 1));
      const x0 = wd ? ex - 6 : xp.x + xp.w * (0.15 + 0.7 * p.z), y0 = wd ? m.readY + p.oy * 0.3 : xp.y + xp.h;
      const x1 = b.x + m.bw / 2, y1 = b.y + m.bh / 2;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + p.bend;
      const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * mx + e * e * x1, y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * my + e * e * y1;
      const a = u < 1 ? 0.9 : 0.9 * (1 - (u - 1) / 0.15), s = (wd ? f(2.6) : 1.8) + (1 - e) * p.z * 2.2;
      c.globalAlpha = clamp(a, 0, 1); c.fillStyle = D.ink;
      if (s > 2.6) { c.beginPath(); c.arc(sc.X(x), y, s / 2, 0, 6.2832); c.fill(); } else c.fillRect(sc.X(x) - s / 2, y - s / 2, s, s);
    }
    
    
    
    if (m.wd && m.clkDx == null) {
      const fvw = ft(22), fzw = ft(14);
      c.save(); c.font = `750 ${fvw}px ${AR ? '"Beiruti", ' : ''}${LATIN}`;
      let lw = Math.max(c.measureText(L.oldv).width, c.measureText(L.toolv).width);
      c.font = `600 ${fzw}px ${AR ? '"Beiruti", ' : ''}${LATIN}`; lw = Math.max(lw, c.measureText(L.old).width, c.measureText(L.tool).width); c.restore();
      m.clkDx = -Math.round((f(20) + lw) / 2) + 14;   
    }
    const k = m.wd ? { ...m.clk, cx: m.clk.cx + m.clkDx } : m.clk, cx = sc.X(k.cx), cy = k.cy, r = k.r, ca = fade(t, 0.35, 0.5);
    c.globalAlpha = ca; c.fillStyle = D.page; c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
    c.strokeStyle = D.mute; c.lineWidth = 1;
    for (let h = 0; h < 12; h++) {
      const an = -Math.PI / 2 + h / 12 * 2 * Math.PI, r0 = r * (h % 3 ? 0.86 : 0.78);
      c.globalAlpha = ca * (h % 3 ? 0.5 : 0.9); c.lineWidth = h % 3 ? 1 : Math.max(1.2, f(1.6)); c.beginPath(); c.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); c.lineTo(cx + Math.cos(an) * r * 0.94, cy + Math.sin(an) * r * 0.94); c.stroke();
    }
    const A0 = -Math.PI / 2;
    const oldU = smooth((t - 0.6) / 1.4);
    if (oldU > 0) {
      c.save(); c.globalAlpha = ca * 0.85; c.strokeStyle = D.mute; c.lineWidth = wd ? f(2.4) : 1.8; c.setLineDash([f(5), f(5)]);
      c.beginPath(); c.arc(cx, cy, r * 0.66, A0, A0 + Math.PI * oldU); c.stroke(); c.restore();
    }
    const toolU = smooth((t - 1.2) / 2.0), toolA = (20 / 720) * 2 * Math.PI * toolU;
    if (toolU > 0) {
      c.globalAlpha = ca; c.fillStyle = D.ink; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r * 0.9, A0, A0 + Math.max(toolA, 0.002)); c.closePath(); c.fill();
    }
    
    const ha = A0 + toolA;
    c.globalAlpha = ca; c.strokeStyle = D.ink; c.lineWidth = wd ? f(2.4) : 1.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ha) * r * 0.9, cy + Math.sin(ha) * r * 0.9); c.stroke(); c.lineCap = 'butt';
    c.beginPath(); c.arc(cx, cy, wd ? f(3.6) : 2.4, 0, 6.2832); c.fillStyle = D.ink; c.fill();
    
    const lx = k.cx + r + f(wd ? 20 : 10), fz = ft(wd ? 14 : 11), fv = ft(wd ? 22 : 13);
    const blk = 2 * (fz * 1.25 + fv * 1.2) + fv * 0.5, up = blk / 2 - fz, dn = -blk / 2 + fz * 1.25 + fv * 1.2 + fv * 0.5 + fz;
    const la = fade(t, 1.0, 0.5), lb = fade(t, 3.0, 0.5);
    const kx = sc.X(lx - f(wd ? 11 : 6)), ks = f(wd ? 9 : 5);
    c.save(); c.globalAlpha = la; c.strokeStyle = D.mute; c.lineWidth = Math.max(1.6, f(2)); c.setLineDash([f(3), f(2)]);
    c.beginPath(); c.moveTo(kx - ks / 2, cy - up - fz * 0.35); c.lineTo(kx + ks / 2, cy - up - fz * 0.35); c.stroke(); c.restore();
    c.globalAlpha = lb; c.fillStyle = D.ink; c.fillRect(kx - ks / 2, cy + dn - fz * 0.35 - f(2.5), ks, f(5));
    sc.text(L.old, lx, cy - up, { size: fz, color: D.mute, w: 600, a: la });
    sc.text(L.oldv, lx, cy - up + fv * 1.2, { size: fv, w: 700, color: D.mute, a: la });
    sc.text(L.tool, lx, cy + dn, { size: fz, w: 600, a: lb });
    sc.text(L.toolv, lx, cy + dn + fv * 1.2, { size: fv, w: 750, a: lb });
    
    if (wd) sc.text(L.syn, G.x0, H - pad + f(6), { size: ft(12.5), color: D.mute, a: sk });
    else sc.text(L.syn, W - pad, H - pad + f(3), { size: ft(11), color: D.mute, al: 'end', a: sk });
  },
};

K.SPECS['nokia-xml'] = S_XML;
K.ARIA['nokia-xml'] = K.arDigits(AR
  ? 'رسم متحرك ببيانات توضيحية: ملف إعدادات الشبكة بصيغة XML يُقرأ عنصرًا بعد عنصر، ويصير كل عنصر نقطة تنزل صفًا في جدولها، حتى تمتلئ شبكة من جداول القالب. وقرص ساعة من 12 ساعة يُظهر الاستيراد القديم نصف دائرة، نحو 6 ساعات، وهذه الأداة شريحة رفيعة، نحو 20 دقيقة. ثم يمر فحص على الجداول وتضيء بالكهرماني الخلايا القليلة التي ما زالت مختلفة.'
  : 'Animation on illustrative data: a network configuration dump in XML is read object by object; each object becomes a point that lands as a row in its table, until a field of template tables is full. A 12-hour dial shows the old import as a half circle, about 6 hours, and this tool as a thin wedge, about 20 minutes. Then a check sweeps across the tables and the few cells that still differ light up in amber.');
})();
