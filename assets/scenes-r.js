





(() => {
'use strict';
const K = window.KIT, CELLS = window.R_G4CELLS;
if (!K || !CELLS) return;
const { AR, clamp, lerp, smooth, spring, mkRnd } = K;

function scatterInto(n, W, H, rnd, sx, sy, sz) {
  for (let i = 0; i < n; i++) { sx[i] = W * (0.02 + 0.96 * rnd()); sy[i] = H * (0.05 + 0.9 * (rnd() * 0.6 + rnd() * 0.4)); sz[i] = rnd(); }
}

function pt(c, x, y, org, z, a, size, col, t, i) {
  const loose = 1 - org;
  const dx = loose * 3.2 * Math.sin(t * 0.8 + i * 1.7), dy = loose * 2.4 * Math.cos(t * 0.6 + i * 2.3);
  const s = size + loose * z * z * 6.5;
  c.globalAlpha = clamp(a * (1 - loose * (0.45 + 0.4 * z)), 0, 1); c.fillStyle = col;
  if (s > 2.6) { c.beginPath(); c.arc(x + dx, y + dy, s / 2, 0, 6.2832); c.fill(); } else c.fillRect(x + dx - s / 2, y + dy - s / 2, s, s);
}
function caps(sc, list, t, x, y, o) {
  let si = 0; for (let k = 0; k < list.length; k++) if (t >= list[k][0]) si = k;
  list.forEach(([at, s], k) => {
    const a = k === si ? (k === 0 ? 1 : smooth((t - at - 0.1) / 0.2)) : (k === si - 1 ? 1 - smooth((t - list[si][0]) / 0.1) : 0);
    if (a <= 0.002) return;
    const oo = Object.assign({}, o, { a });
    if (o.maxW) sc.para(s, x, y, o.maxW, Math.round((o.size || 13) * 1.35), oo); else sc.text(s, x, y, oo);
  });
}
const wide = (W, H) => W / H > 1.25;

const S_G4R = {
  dur: 3.8,
  build(W, H) {
    const rnd = mkRnd(4);
    const wd = wide(W, H), pad = wd ? 24 : 16, N = wd ? 2400 : 1300;
    const m = { wd, pad, N };
    
    let bx0, bx1, by0, by1;
    if (wd) { const lx0 = W * 0.42, lx1 = W - pad; bx0 = AR ? W - lx1 : lx0; bx1 = AR ? W - lx0 : lx1; by0 = pad; by1 = H - pad; }
    else {
      
      const big = clamp(W * 0.09, 24, 34);
      bx0 = pad; bx1 = W - pad; by0 = pad + 14 + big + 14; by1 = H - 56;
    }
    
    let a0 = 1e9, a1 = -1e9, o0 = 1e9, o1 = -1e9;
    for (const [a, o] of CELLS) { a0 = Math.min(a0, a); a1 = Math.max(a1, a); o0 = Math.min(o0, o); o1 = Math.max(o1, o); }
    const kx = Math.cos(24.7 * Math.PI / 180), cols = (o1 - o0 + 1) * kx, rows = a1 - a0 + 1;
    const cs = Math.min((bx1 - bx0) / cols, (by1 - by0) / rows);          
    const ox = bx0 + ((bx1 - bx0) - cols * cs) / 2, oy = by0 + ((by1 - by0) - rows * cs) / 2;
    m.cw = kx * cs; m.ch = cs;
    m.cells = []; let wsum = 0;
    for (const [a, o, n] of CELLS) {
      const x = ox + (o - o0) * kx * cs, y = oy + (a1 - a) * cs;
      const w = Math.pow(n, 0.55); wsum += w;
      m.cells.push({ x, y, n, w, cum: wsum, k: 0 });
    }
    m.nmax = Math.max(...m.cells.map(c => c.n));
    m.sx = new Float32Array(N); m.sy = new Float32Array(N); m.sz = new Float32Array(N);
    scatterInto(N, W, H, rnd, m.sx, m.sy, m.sz);
    m.tx = new Float32Array(N); m.ty = new Float32Array(N); m.cx = new Float32Array(N); m.cy = new Float32Array(N);
    m.dl = new Float32Array(N); m.sent = new Uint8Array(N); m.ft = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      const r = rnd() * wsum; let lo = 0, hi = m.cells.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (m.cells[mid].cum < r) lo = mid + 1; else hi = mid; }
      const c = m.cells[lo];
      m.tx[k] = c.x + (0.15 + rnd() * 0.7) * m.cw; m.ty[k] = c.y + (0.15 + rnd() * 0.7) * m.ch;
      m.cx[k] = c.x + m.cw / 2; m.cy[k] = c.y + m.ch / 2;
      m.dl[k] = 0.05 + rnd() * 0.85;
      m.sent[k] = rnd() < 0.236 ? 1 : 0;      
      m.ft[k] = 1.65 + rnd() * 0.45;
    }
    return m;
  },
  draw(sc, c, m, t) {
    const C = sc.opts && sc.opts.paper ? K.PAPER : K.DARK;
    const { W, H } = sc, wd = m.wd, pad = m.pad;
    const gridA = smooth((t - 0.45) / 0.5), denU = smooth((t - 2.55) / 0.7);
    for (const cell of m.cells) {
      c.globalAlpha = gridA * 0.9; c.fillStyle = C.page; c.fillRect(cell.x, cell.y, Math.max(1, m.cw - 0.8), Math.max(1, m.ch - 0.8));
      if (denU > 0) { c.globalAlpha = denU * (0.06 + 0.92 * Math.pow(Math.log1p(cell.n) / Math.log1p(m.nmax), 2.2)); c.fillStyle = C.ink; c.fillRect(cell.x, cell.y, Math.max(1, m.cw - 0.8), Math.max(1, m.ch - 0.8)); }
    }
    const yel = smooth((t - 1.35) / 0.2), size = Math.max(1.3, Math.min(1.9, m.cw * 0.42));
    for (let k = 0; k < m.N; k++) {
      const s = clamp(spring(t - m.dl[k], 0.85, 0.82), -0.2, 1.25);
      let x = lerp(m.sx[k], m.tx[k], s), y = lerp(m.sy[k], m.ty[k], s), a = 0.85, col = C.ink;
      if (m.sent[k]) {
        if (yel > 0.5) col = C.acc;
        const ft = t - m.ft[k];
        if (ft > 0) { y += 0.5 * 1100 * ft * ft; a *= 1 - smooth(ft / 0.55); }
        if (a < 0.01 || y > H + 10) continue;
      } else if (denU > 0) {
        x = lerp(x, m.cx[k], denU); y = lerp(y, m.cy[k], denU); a *= 1 - denU;
        if (a < 0.01) continue;
      }
      pt(c, x, y, clamp(s, 0, 1), m.sz[k], a, size, col, t, k);
    }
    const ui = AR ? {
      caps: [[0, '2,725,353 قراءة من الهواتف، قبل وضعها'], [0.6, 'وُضعت على خلايا الرياض الحقيقية، 1 كم لكل خلية'], [1.35, 'قيم حارسة: 2147483647 تعني لا قراءة'], [2.5, 'القراءات الباقية في كل خلية بعد التدقيق']],
      
      lab: 'قيم حارسة، حُذفت أولًا', find: 'الاختبار المنصف: إشارة أقوى، بلا حركة أكثر', sub: 'إشارة أقوى بـ١٠ ديسيبل في الخلية والساعة نفسها: حركة أقل بـ٢٫٤٪، و p = ٠٫٥٧',
      tag: 'خلايا حقيقية من وسط الرياض، 2 إلى 4 نوفمبر 2019',
    } : {
      caps: [[0, '2,725,353 handset readings, not placed'], [0.6, 'Placed on Riyadh’s real 1 km cells'], [1.35, 'Sentinel values: 2147483647 means no reading'], [2.5, 'Readings left in each cell after the audit']],
      lab: 'sentinel values, removed first', find: 'The fair test: better signal, no more traffic', sub: '+10 dB signal, same cell and hour: −2.4% traffic, p = 0.57',
      tag: 'Real 1 km cells of central Riyadh, 2 to 4 Nov 2019',
    };
    const pc = (23.6 * smooth((t - 1.45) / 0.8)).toFixed(1) + (AR ? '٪' : '%'), pa = smooth((t - 1.45) / 0.25), fa = smooth((t - 2.75) / 0.4);
    if (wd) {
      const big = clamp(W * 0.074, 30, 56), tw = W * 0.37 - pad;
      caps(sc, ui.caps, t, pad, pad + 13, { size: 13, maxW: tw });
      sc.text(pc, pad, H * 0.40, { size: big, w: 800, stretch: 'semi-condensed', color: C.acc, a: pa });
      sc.text(ui.lab, pad, H * 0.40 + 22, { size: 13.5, color: C.acc, a: pa });
      const n = sc.para(ui.find, pad, H * 0.62, tw, 27, { size: clamp(W * 0.034, 18, 25), w: 750, a: fa });
      sc.para(ui.sub, pad, H * 0.62 + n * 27 + 4, tw, 17, { size: 12.5, color: C.ink, a: fa * 0.85 });
      sc.para(ui.tag, pad, H - pad, tw, 16, { size: 12, color: C.mute });
    } else {
      const big = clamp(W * 0.09, 24, 34);
      caps(sc, ui.caps, t, pad, pad + 10, { size: 12.5 });
      sc.text(pc, pad, pad + 14 + big, { size: big, w: 800, stretch: 'semi-condensed', color: C.acc, a: pa });
      const bw = sc.measure(pc, { size: big, w: 800, stretch: 'semi-condensed' });
      sc.text(ui.lab, pad + bw + 12, pad + 14 + big - 6, { size: 12, color: C.acc, a: pa });
      let ffz = 15; while (ffz > 11 && sc.measure(ui.find, { size: ffz, w: 750 }) > W - 2 * pad) ffz -= 0.5;   
      sc.text(ui.find, pad, H - 34, { size: ffz, w: 750, a: fa });
      let sfz = 11; while (sfz > 8.5 && sc.measure(ui.sub, { size: sfz }) > W - 2 * pad) sfz -= 0.5;
      sc.text(ui.sub, pad, H - pad + 1, { size: sfz, color: C.ink, a: fa * 0.85 });
      sc.text(ui.tag, pad, H - pad + 1, { size: 11, color: C.mute, a: 1 - fa });
    }
  },
};
K.SPECS['riyadh-4g'] = S_G4R;
K.ARIA['riyadh-4g'] = K.arDigits(AR
  ? 'رسم متحرك على خلايا حقيقية من وسط الرياض: قراءات الهواتف تستقر على خلايا من 1 كم؛ 23.6٪ قيم حارسة تسقط؛ ثم تبقى القراءات في كل خلية، وأكثفها في الوسط.'
  : 'Animation on real 1 km cells of central Riyadh: handset readings settle on the grid; the 23.6% sentinel values fall out; then the readings left in each cell remain, densest in the centre.');
})();
