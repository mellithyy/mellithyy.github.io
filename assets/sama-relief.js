




(() => {
'use strict';
const Q = new URLSearchParams(location.search);
const AR = KIT.AR;
const FILM = false;
const SETTLED = Q.has('settled');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STILL = RM || SETTLED;                      
const SEEKING = Q.has('t') || SETTLED;            
const $ = id => document.getElementById(id);
const { clamp, lerp, smooth, fmtInt, spring, mkRnd, Scene, S_WEEK, arDigits } = KIT;
const DATA = { space: window.SPACE_DATA.space };




const SP = DATA.space;
const N_DAYS = SP.n;
const MON_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MON_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DOW_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOW_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const day0 = Date.UTC(2024, 0, 1);
const dateOf = i => new Date(day0 + i * 864e5);
const NB = ' ';                                   
const fmtDate = (i, dow) => {
  const d = dateOf(i);
  if (AR) return (dow ? DOW_AR[d.getUTCDay()] + ' ' : '') + d.getUTCDate() + NB + MON_AR[d.getUTCMonth()] + NB + d.getUTCFullYear();
  return (dow ? DOW_EN[d.getUTCDay()] + ' ' : '') + d.getUTCDate() + NB + MON_EN[d.getUTCMonth()] + NB + d.getUTCFullYear();
};
const millions = v => (v / 100).toFixed(1);            
const NAME_EN = { 'Food & Beverages': 'Food and beverages', 'Other Sectors': 'Other sectors', 'Restaurants & Cafés': 'Restaurants and cafés',
  'Apparel, Clothing & Accessories': 'Clothing and accessories', 'Professional & Business Services': 'Professional and business services',
  'Gas Stations': 'Fuel stations', 'Furniture & Home Supplies': 'Furniture and home supplies', 'Construction & Building Materials': 'Building materials',
  'Recreation & Culture': 'Recreation and culture', 'Bakeries & Pastries': 'Bakeries and pastries', 'Electronic & Electric Devices': 'Electronics',
  'Public Utilities & Services': 'Public utilities', 'Laundry Services': 'Laundry' };
const rowName = r => AR ? r.ar : (NAME_EN[r.en] || r.en);


const PHONE = Math.min(innerWidth, innerHeight) < 600 || (matchMedia('(pointer: coarse)').matches && innerWidth < 900);
const NR = PHONE ? 8 : 12;
const ROWS = SP.rows.slice(0, NR);                     
const NP = NR * N_DAYS, ALL = SP.rows.length;
let vmax = 0; for (const r of ROWS) for (const v of r.v) if (v > vmax) vmax = v;
const R0 = ROWS[0]; let PK = 0; R0.v.forEach((v, i) => { if (v > R0.v[PK]) PK = i; });


const T_END = 5.2;          
const CAM_T = 5.0;
const STATUS_AT = [0, 0.75, 1.55, 2.2, 3.3];


const SERIES = r => (AR ? 'سلسلة ' : 'Series ') + (ROWS.indexOf(r) + 1);
const UPDOWN = (r, i) => i > 0 && r.v[i] > r.v[i - 1];
const HT = AR ? {
  status: [fmtInt(NP) + ' سجلًا يوميًا من ساما، قبل الترتيب', 'رُتِّبت حسب التاريخ، من ' + fmtDate(0) + ' إلى ' + fmtDate(N_DAYS - 1),
    'صفّ لكل نشاط', 'الارتفاع: ما أُنفق في ذلك اليوم بالريال', 'تحقّقتُ: في كل الأيام الـ' + fmtInt(N_DAYS) + ' مجموع الأنشطة الـ' + ALL + ' يساوي إجمالي ساما'],
  caption: 'بيانات حقيقية: الإنفاق بالبطاقات في السعودية يومًا بيوم، من 2024 إلى 2026. رمضان باللون الكهرماني.' + (KIT.FINE && !PHONE ? ' مرّر المؤشر على خط لتقرأ اليوم.' : ''),     
  note: [rowName(R0) + '، ' + fmtDate(PK, true), millions(R0.v[PK]) + ' مليون ريال، قبل رمضان بيوم'],
  read: (r, i) => [rowName(r) + '، ' + fmtDate(i, true), millions(r.v[i]) + ' مليون ريال'],
  aria: 'منظر ثلاثي الأبعاد: ' + fmtInt(NP) + ' نقطة، كل واحدة إنفاق يوم في نشاط واحد بالمملكة. في كل الأيام الـ' + fmtInt(N_DAYS) + ' مجموع الأنشطة الـ' + ALL + ' يساوي إجمالي ساما. وأعلى يوم: ' + rowName(R0) + '، ' + fmtDate(PK, true) + '، ' + millions(R0.v[PK]) + ' مليون ريال، قبل رمضان بيوم.',
} : {
  status: [fmtInt(NP) + ' daily records from SAMA, not yet sorted', 'Placed by date, ' + fmtDate(0) + ' to ' + fmtDate(N_DAYS - 1),
    'One row per activity', 'Raised to the riyals spent that day', 'Checked: on all ' + fmtInt(N_DAYS) + ' days the ' + ALL + ' activities add up to SAMA’s total'],
  caption: 'Real data: Saudi card spending by day, 2024 to 2026. Ramadan in amber.' + (KIT.FINE && !PHONE ? ' Point at a line to read the day.' : ''),     
  note: [rowName(R0) + ', ' + fmtDate(PK, true), millions(R0.v[PK]) + ' million riyals, the day before Ramadan'],
  read: (r, i) => [rowName(r) + ', ' + fmtDate(i, true), millions(r.v[i]) + ' million riyals'],
  aria: 'A 3D view of ' + fmtInt(NP) + ' points, each one day of card spending in one activity in Saudi Arabia. On all ' + fmtInt(N_DAYS) + ' days the ' + ALL + ' activities add up to SAMA’s total. The highest day: ' + rowName(R0) + ', ' + fmtDate(PK, true) + ', ' + millions(R0.v[PK]) + ' million riyals, the day before Ramadan.',
};
if (AR) { HT.status = HT.status.map(arDigits); HT.caption = arDigits(HT.caption); HT.note = HT.note.map(arDigits); HT.aria = arDigits(HT.aria); const rd = HT.read; HT.read = (r, i) => rd(r, i).map(arDigits); }
$('caption').textContent = HT.caption;
$('status').innerHTML = HT.status.map(s => `<span>${s}</span>`).join('');
const statusEls = [...$('status').children];
const canvas = $('scene'); canvas.setAttribute('aria-label', HT.aria);

const heroRnd = mkRnd(20240101);
const W3 = 24, H3 = 3.6, D3 = PHONE ? 9 : 11;
const xOf = i => (i / (N_DAYS - 1) - 0.5) * W3;
const zOf = r => (NR > 1 ? r / (NR - 1) - 0.5 : 0) * D3;
const yOf = v => v / vmax * H3;
const aP = new Float32Array(NP * 3), aR = new Float32Array(NP * 4);
{ let k = 0;
  for (let r = 0; r < NR; r++) for (let i = 0; i < N_DAYS; i++, k++) {
    aP[k*3] = i; aP[k*3+1] = r; aP[k*3+2] = ROWS[r].v[i] / vmax;
    aR[k*4] = heroRnd(); aR[k*4+1] = heroRnd(); aR[k*4+2] = heroRnd(); aR[k*4+3] = heroRnd();
  } }


const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
function lookAt(e, c) {
  const z = norm(sub(e, c)), x = norm(cross([0,1,0], z)), y = cross(z, x);
  return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,e),-dot(y,e),-dot(z,e),1];
}
function persp(fovDeg, asp, n, f, sx, sy) {
  const t = 1 / Math.tan(fovDeg * Math.PI / 360);
  
  return [t/asp,0,0,0, 0,t,0,0, -sx,-sy,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0];
}
function mul(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k*4+j] * b[i*4+k]; o[i*4+j] = s; } return o; }

const glide = (u, v0 = 1.15) => { u = clamp(u, 0, 1); return v0*u + (3 - 2*v0)*u*u + (v0 - 2)*u*u*u; };


let FREE = [0.4, 0.05, 0.985, 0.9];
const FIT = { key: '', P: null };
function eyeOf(th, ph, r, L) { th *= Math.PI / 180; ph *= Math.PI / 180; return [L[0] + r*Math.sin(th)*Math.cos(ph), L[1] + r*Math.sin(ph), L[2] + r*Math.cos(th)*Math.cos(ph)]; }
function presets(asp) {
  const key = asp.toFixed(3) + '|' + FREE.join(',');
  if (FIT.key === key) return FIT.P;
  const boxAsp = (FREE[2] - FREE[0]) * asp / Math.max(0.05, FREE[3] - FREE[1]);
  const k = clamp((boxAsp - 0.55) / (1.55 - 0.55), 0, 1);
  const end = { th: lerp(50, 31, k), ph: lerp(30, 30, k), fov: lerp(30, 26, k), L: [0, 1.2, 0] };
  
  if (window.RELIEF_FULL) { end.th = 17; end.ph = 22; end.fov = 24; }
  const box = []; for (const x of [-W3/2, W3/2]) for (const y of [0, H3*0.42]) for (const z of [-D3/2, D3/2]) box.push([x, y, z]);
  const bbox = r => {
    const VP = mul(persp(end.fov, asp, 0.1, 400, 0, 0), lookAt(eyeOf(end.th, end.ph, r, end.L), end.L));
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of box) {
      const x = VP[0]*p[0] + VP[4]*p[1] + VP[8]*p[2] + VP[12], y = VP[1]*p[0] + VP[5]*p[1] + VP[9]*p[2] + VP[13], w = VP[3]*p[0] + VP[7]*p[1] + VP[11]*p[2] + VP[15];
      x0 = Math.min(x0, x/w); x1 = Math.max(x1, x/w); y0 = Math.min(y0, y/w); y1 = Math.max(y1, y/w);
    }
    return [x0, x1, y0, y1];
  };
  const fx0 = FREE[0]*2-1, fx1 = FREE[2]*2-1, fy0 = 1-FREE[3]*2, fy1 = 1-FREE[1]*2;
  let lo = 6, hi = 300;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, b = bbox(m); if (b[1]-b[0] > fx1-fx0 || b[3]-b[2] > fy1-fy0) lo = m; else hi = m; }
  const b = bbox(hi);
  end.r = hi; end.sx = (fx0+fx1)/2 - (b[0]+b[1])/2; end.sy = (fy0+fy1)/2 - (b[2]+b[3])/2;
  FIT.key = key;
  FIT.P = { end, start: { th: -58, ph: 4, r: lerp(9, 9.5, k), fov: 52, L: [-3.2, 1.7, 0.6], sx: 0, sy: 0 } };
  return FIT.P;
}

function idleOff(t) {
  if (t <= T_END || STILL) return { th: 0, ph: 0 };
  
  const tau = t - T_END, ramp = smooth(tau / 4) * (1 - smooth((tau - 22) / 8));
  return { th: ramp * 4.5 * Math.sin(tau * 2 * Math.PI / 40), ph: ramp * 1.3 * Math.sin(tau * 2 * Math.PI / 57) };
}
function camAt(t, asp, off) {
  const P = presets(asp);
  const u = glide(t / CAM_T);
  const a = P.start, b = P.end, idle = idleOff(t);
  const th = (lerp(a.th, b.th, u) + off.th + idle.th) * Math.PI / 180;
  const ph = (lerp(a.ph, b.ph, u) + off.ph + idle.ph) * Math.PI / 180;
  const r = a.r * Math.pow(b.r / a.r, u);
  const L = [lerp(a.L[0], b.L[0], u), lerp(a.L[1], b.L[1], u), lerp(a.L[2], b.L[2], u)];
  const eye = [L[0] + r * Math.sin(th) * Math.cos(ph), L[1] + r * Math.sin(ph), L[2] + r * Math.cos(th) * Math.cos(ph)];
  return { eye, L, r, fov: lerp(a.fov, b.fov, u), sx: lerp(a.sx, b.sx, u), sy: lerp(a.sy, b.sy, u), u };
}

const VS = `
precision highp float;
attribute vec3 aP; attribute vec4 aR; attribute float aF;
uniform mat4 uVP; uniform vec3 uEye; uniform float uT, uN, uR, uSettled;
uniform vec3 uS; uniform float uBase, uFocus, uAp, uCocMax, uMirror;
uniform vec2 uView; uniform vec4 uMask, uMask2, uMask3; uniform float uFeather;
uniform vec2 uFog; uniform float uHiRow, uHiAmt, uDim, uScan, uGain, uLine, uLineAmt, uCurtain, uAccOn, uPk;
varying float vI; varying float vRad; varying float vHi;
float inRect(vec2 px, vec4 m, float f) {
  vec2 c = (m.xy + m.zw) * 0.5, h = (m.zw - m.xy) * 0.5;
  vec2 q = abs(px - c) - h + vec2(f * 0.5);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - f * 0.5;
  return 1.0 - smoothstep(-f * 0.15, f, d);
}
float spring(float tau, float resp, float z) {
  if (tau <= 0.0) return 0.0;
  float w = 6.2831853 / resp; float wd = w * sqrt(1.0 - z*z);
  return 1.0 - exp(-z*w*tau) * (cos(wd*tau) + z*w/wd * sin(wd*tau));
}
void main() {
  float day = aP.x, row = aP.y, val = aP.z;
  vec3 tgt = vec3((day/(uN-1.0) - 0.5)*uS.x, val*uS.y, (uR > 1.5 ? row/(uR-1.0) - 0.5 : 0.0)*uS.z);
  vec3 raw = vec3((aR.x-0.5)*uS.x*1.5, -0.6 + aR.y*uS.y*1.3, (aR.z-0.5)*uS.z*3.0);
  raw += 0.22*vec3(sin(uT*0.55 + aR.w*40.0), sin(uT*0.8 + aR.x*31.0), sin(uT*0.5 + aR.z*27.0));
  vec3 strand = vec3(tgt.x, 2.1 + (aR.y-0.5)*0.55, (aR.z-0.5)*0.7);
  vec3 rows = vec3(tgt.x, 0.0, tgt.z);
  // 1 placed by date, 2 one row per activity (largest first), 3 raised to the riyals spent: a wave from 2024 to 2026
  float s1 = spring(uT - (0.0 + aR.w*0.8), 1.0, 0.86);
  float s2 = spring(uT - (0.8 + row/max(uR-1.0,1.0)*0.6 + aR.x*0.25), 0.9, 0.86);
  float s3 = spring(uT - (1.95 + day/uN*1.2 + aR.z*0.1), 0.85, 0.72);
  if (uSettled > 0.5) { s1 = 1.0; s2 = 1.0; s3 = 1.0; }
  vec3 p = mix(raw, strand, s1);
  p = mix(p, rows, s2);
  p.y += tgt.y * s3;
  if (uCurtain > 0.5 && aF > 0.5) p.y = -0.02;
  vec4 c = uVP * vec4(p, 1.0);
  c.x *= uMirror;
  gl_Position = c;
  float d = distance(p, uEye);
  float rad = uBase * uFocus / max(d, 0.05);
  float coc = min(uAp * abs(d - uFocus) / max(d, 0.05), uCocMax);
  float r2 = sqrt(rad*rad + coc*coc);
  float energy = (rad*rad + 0.35) / (r2*r2 + 0.35);
  float rr = max(r2, 0.7);
  energy *= min(1.0, (r2*r2 + 0.2) / (0.49 + 0.2));
  float fog = 1.0 - smoothstep(uFog.x, uFog.y, d);
  fog = 0.25 + 0.75 * fog;
  float nearFade = smoothstep(0.6, 2.6, d);
  vec2 ndc = c.xy / c.w;
  vec2 px = vec2((ndc.x*0.5+0.5)*uView.x, (0.5-ndc.y*0.5)*uView.y);
  float mask = 1.0 - 0.92*max(max(inRect(px, uMask, uFeather), inRect(px, uMask2, uFeather)), inRect(px, uMask3, uFeather*0.5));
  float hi = (abs(row - uHiRow) < 0.5) ? uHiAmt : 0.0;
  float scan = exp(-pow((day - uScan)/28.0, 2.0));
  float look = fog * mask * (1.0 - uDim*(1.0-hi)*0.35) * (1.0 + 1.3*scan) * (1.0 + 0.6*hi);
  // busy seasons: 11 Mar-9 Apr 2024, 1-29 Mar 2025, 18 Feb-19 Mar 2026 (days from 1 Jan 2024)
  float ram = ((day >= 70.0 && day <= 99.0) || (day >= 425.0 && day <= 453.0) || (day >= 779.0 && day <= 808.0)) ? 1.0 : 0.0;
  vHi = max(ram, hi * (1.0 - step(2.5, abs(day - uPk)))) * uAccOn;
  if (uCurtain > 0.5) { vI = 0.0; vRad = -2.0; gl_PointSize = 1.0; }
  else if (uLine > 0.5) {
    vI = uLineAmt * smoothstep(0.94, 1.0, s2) * look;
    vRad = -1.0;
    gl_PointSize = 1.0;
  } else {
    vI = uGain * energy * nearFade * look;
    vRad = rr;
    gl_PointSize = c.w > 0.0 ? 2.0*rr + 2.0 : 0.0;
  }
}`;
const FS = `
precision mediump float;
varying float vI; varying float vRad; varying float vHi;
uniform vec3 uInk, uAcc, uBg;
void main() {
  if (vRad < -1.5) { gl_FragColor = vec4(uBg, 1.0); return; }
  if (vRad < 0.0) { gl_FragColor = vec4(mix(uInk, uAcc, vHi) * vI * (1.0 + 0.7 * vHi), 1.0); return; }
  float d = length(gl_PointCoord - 0.5) * (2.0*vRad + 2.0);
  float a = clamp(vRad + 0.5 - d, 0.0, 1.0);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(mix(uInk, uAcc, vHi) * vI * (1.0 + 0.7 * vHi) * a, 1.0);
}`;
const VS2 = `
precision highp float;
attribute float aK;
uniform mat4 uVP; uniform vec3 uBase3; uniform float uLen, uGrow, uMirror, uSize;
varying float vA;
void main() {
  vec4 c = uVP * vec4(uBase3 + vec3(0.0, aK*uLen, 0.0), 1.0);
  c.x *= uMirror; gl_Position = c;
  gl_PointSize = uSize;
  vA = step(aK, uGrow);
}`;
const FS2 = `
precision highp float;
varying float vA; uniform vec3 uCol; uniform float uRing, uA, uSize;
void main() {
  float d = length(gl_PointCoord - 0.5) * uSize;
  float r = uSize * 0.5 - 1.0;
  float a = uRing > 0.5 ? clamp(1.0 - abs(d - (r - 1.0)) , 0.0, 1.0) : clamp(r + 0.5 - d, 0.0, 1.0);
  if (a * vA <= 0.0) discard;
  gl_FragColor = vec4(uCol * a * vA * uA, 1.0);
}`;

const gl = canvas.getContext('webgl', { alpha: false, antialias: true, depth: true, premultipliedAlpha: false, preserveDrawingBuffer: SEEKING, powerPreference: 'high-performance' });
let prog, prog2, U = {}, U2 = {}, stemBuf, oneBuf; const STEM_N = 30;
function compile(vs, fs) {
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
const uniforms = (p, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(p, n)]));
let GLOK = false;
function initGL() {
  prog = compile(VS, FS); prog2 = compile(VS2, FS2);
  U = uniforms(prog, ['uVP','uEye','uT','uN','uR','uSettled','uS','uBase','uFocus','uAp','uCocMax','uMirror','uView','uMask','uMask2','uMask3','uFeather','uLine','uLineAmt','uFog','uHiRow','uHiAmt','uDim','uScan','uGain','uInk','uAcc','uBg','uCurtain','uAccOn','uPk']);
  U2 = uniforms(prog2, ['uVP','uBase3','uLen','uGrow','uMirror','uSize','uCol','uRing','uA']);
  const mkb = a => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; };
  prog.bufs = [[gl.getAttribLocation(prog, 'aP'), mkb(aP), 3], [gl.getAttribLocation(prog, 'aR'), mkb(aR), 4]];
  
  const cP = new Float32Array(NP * 6), cR = new Float32Array(NP * 8), cF = new Float32Array(NP * 2);
  for (let k = 0; k < NP; k++) for (let j = 0; j < 2; j++) {
    const q = k * 2 + j;
    cP.set(aP.subarray(k * 3, k * 3 + 3), q * 3); cR.set(aR.subarray(k * 4, k * 4 + 4), q * 4); cF[q] = j;
  }
  prog.cbufs = [[gl.getAttribLocation(prog, 'aP'), mkb(cP), 3], [gl.getAttribLocation(prog, 'aR'), mkb(cR), 4], [gl.getAttribLocation(prog, 'aF'), mkb(cF), 1]];
  prog.locF = gl.getAttribLocation(prog, 'aF');
  const ks = new Float32Array(STEM_N); for (let i = 0; i < STEM_N; i++) ks[i] = i / (STEM_N - 1);
  stemBuf = mkb(ks); oneBuf = mkb(new Float32Array([0]));
  GLOK = true;
}
if (gl) try {
  if (Q.has('nogl')) throw new Error('nogl test');
  initGL();
} catch (e) { console.error(e); GLOK = false; }
let canvas2 = canvas;
if (!GLOK && gl) { canvas2 = canvas.cloneNode(false); canvas.replaceWith(canvas2); }


if (GLOK) canvas.addEventListener('webglcontextlost', e => {
  e.preventDefault(); if (!GLOK) return;
  GLOK = false; canvas2 = canvas.cloneNode(false); canvas.replaceWith(canvas2); ctx2d = null;
  measureHero(); if (typeof kick === 'function') kick();
});

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const BG = hex('#121110'), INK = hex('#ece8df'), ACC = hex('#d9a441');

let VW = 1, VH = 1, DPR = 1, MASK = [0,0,0,0], MASK2 = [0,0,0,0], MASK3 = [0,0,0,0];
function measureHero() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  const cv = GLOK ? canvas : canvas2;
  VW = cv.clientWidth; VH = cv.clientHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  const hr = $('hero').getBoundingClientRect();
  const rel = el => { const r = el.getBoundingClientRect(); return { left: r.left - hr.left, right: r.right - hr.left, top: r.top - hr.top, bottom: r.bottom - hr.top, width: r.width }; };
  const rg = document.createRange(); rg.selectNodeContents($('name'));
  const rn = rg.getBoundingClientRect(); const hn = { left: rn.left - hr.left, right: rn.right - hr.left, top: rn.top - hr.top, bottom: rn.bottom - hr.top };
  const l = rel($('lead')), b = rel($('actions')), st = rel($('scap'));
  MASK = [hn.left - 12, hn.top - 6, hn.right + 12, hn.bottom + 6];
  MASK2 = [Math.min(l.left, b.left) - 12, l.top - 8, Math.max(l.right, b.right) + 12, b.bottom + 10];
  const sw = Math.max(...statusEls.map(e => e.getBoundingClientRect().width), $('caption').getBoundingClientRect().width);
  MASK3 = AR ? [st.right - sw - 8, st.top - 4, st.right + 8, st.bottom + 4] : [st.left - 8, st.top - 4, st.left + sw + 8, st.bottom + 4];
  
  
  
  if (window.RELIEF_FULL) { MASK = MASK2 = [0, 0, 0, 0]; FREE = [0.03, 0.13, 0.97, (st.top - 10) / VH]; }
  else if (VW < 1101) FREE = [0.035, (b.bottom + 78) / VH, 0.965, (st.top - 8) / VH];
  
  else if (window.HERO_WIDE) FREE = [Math.min(0.42, (Math.max(hn.right, l.right, b.right) + hr.left + 20) / VW), 0.03, 0.998, (st.top - 4) / VH];
  else FREE = [0.4, 0.15, 0.975, (st.top - 14) / VH];
  FIT.key = ''; restKey = '';
}

const labelsEl = $('labels');
const mkLab = (cls, html) => { const e = document.createElement('div'); e.className = 'lab ' + cls; e.innerHTML = html; labelsEl.appendChild(e); return e; };
const years = [];
for (let i = 0; i < N_DAYS; i++) { const d = dateOf(i); if (d.getUTCMonth() === 0 && d.getUTCDate() === 1) years.push({ i, el: mkLab('year', arDigits(String(d.getUTCFullYear()))) }); }
const noteEl = mkLab('note', `<b>${HT.note[0]}</b><span>${HT.note[1]}</span>`);
const readEl = mkLab('read', '<b></b><span></span>'); readEl.style.opacity = 0;


const RAMS = [[70, 99, 2024], [425, 453, 2025], [779, 808, 2026]];
const ramEls = window.RELIEF_FULL ? RAMS.map(([a, b, y]) => ({ i: Math.round((a + b) / 2), el: mkLab('ram', (AR ? 'رمضان ' : 'Ramadan ') + arDigits(String(y))) })) : [];
const JR = ROWS.findIndex(r => /ewel/.test(r.en));
let JPK = 0; if (JR >= 0) ROWS[JR].v.forEach((v, i) => { if (v > ROWS[JR].v[JPK]) JPK = i; });
const jewEl = (window.RELIEF_FULL && JR >= 0) ? mkLab('note jew', `<b>${rowName(ROWS[JR])}${AR ? '، ' : ', '}${fmtDate(JPK, true)}</b><span>${millions(ROWS[JR].v[JPK])}${AR ? ' مليون ريال، قبل العيد بيوم' : ' million riyals, the day before Eid'}</span>`) : null;
function project(VP, p) {
  const x = VP[0]*p[0] + VP[4]*p[1] + VP[8]*p[2] + VP[12];
  const y = VP[1]*p[0] + VP[5]*p[1] + VP[9]*p[2] + VP[13];
  const w = VP[3]*p[0] + VP[7]*p[1] + VP[11]*p[2] + VP[15];
  const nx = (AR ? -x : x) / w, ny = y / w;
  return [(nx * 0.5 + 0.5) * VW, (0.5 - ny * 0.5) * VH, w];
}
const place = (el, x, y, o) => { el.style.opacity = o.toFixed(3); el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; };


const off = { th: 0, ph: 0, vth: 0, vph: 0, tth: 0, tph: 0 };
let hover = null, ptr = null, hiAmt = 0;
function springStep(dt) {
  const w = 2 * Math.PI / 0.9;
  for (const [x, v, tg] of [['th', 'vth', 'tth'], ['ph', 'vph', 'tph']]) {
    const a = -w * w * (off[x] - off[tg]) - 2 * w * off[v];
    off[v] += a * dt; off[x] += off[v] * dt;
  }
}
const heroEl = $('hero');
if (!FILM) {
  heroEl.addEventListener('pointermove', e => {
    const r = heroEl.getBoundingClientRect();
    ptr = [e.clientX - r.left, e.clientY - r.top, e.pointerType];
    if (e.pointerType === 'mouse' && !RM) {
      const nx = (e.clientX - r.left) / r.width * 2 - 1, ny = (e.clientY - r.top) / r.height * 2 - 1;
      off.tth = (AR ? 1 : -1) * nx * 5; off.tph = ny * 2.4;
    }
  }, { passive: true });
  heroEl.addEventListener('pointerleave', () => { off.tth = 0; off.tph = 0; ptr = null; });
  heroEl.addEventListener('pointerdown', e => { const r = heroEl.getBoundingClientRect(); ptr = [e.clientX - r.left, e.clientY - r.top, e.pointerType]; });
}
let restXY = null, restKey = '';
function pick(VP) {
  if (!ptr) return null;
  const key = VP.slice(0, 16).map(v => v.toFixed(4)).join(',') + VW + 'x' + VH;
  if (key !== restKey) {
    restKey = key; restXY = restXY && restXY.length === NP * 2 ? restXY : new Float32Array(NP * 2);
    for (let k = 0; k < NP; k++) {
      const i = aP[k*3], r = aP[k*3+1];
      const q = project(VP, [xOf(i), yOf(ROWS[r].v[i]), zOf(r)]);
      restXY[k*2] = q[0]; restXY[k*2+1] = q[1];
    }
  }
  const lim = ptr[2] === 'mouse' ? 16 : 28;
  let best = -1, bd = lim * lim;
  for (let k = 0; k < NP; k++) { const dx = restXY[k*2] - ptr[0], dy = restXY[k*2+1] - ptr[1]; const dd = dx*dx + dy*dy; if (dd < bd) { bd = dd; best = k; } }
  return best < 0 ? null : { r: aP[best*3+1], i: aP[best*3] };
}

function heroFrame(t, live) {
  const asp = VW / VH;
  const cam = camAt(t, asp, live ? off : { th: 0, ph: 0 });
  const VP = mul(persp(cam.fov, asp, 0.1, 200, cam.sx, cam.sy), lookAt(cam.eye, cam.L));
  const settled = t >= T_END;
  const pk = [xOf(PK), yOf(R0.v[PK]) + 0.12, zOf(0)];
  const q0 = project(VP, pk), q1 = project(VP, [pk[0], pk[1] + 1, pk[2]]);
  const ppu = Math.max(1, q0[1] - q1[1]);
  
  const topY = Math.max(q0[1] - (VW < 761 ? 46 : 70), (VW < 1101 ? MASK2[3] + noteEl.offsetHeight + 14 : noteEl.offsetHeight + 34));
  const stemLen = clamp((q0[1] - topY) / ppu, 0, 3);
  hover = (settled && live && ptr) ? pick(VP) : null;
  const noteOn = smooth((t - 4.0) / 0.6);
  hiAmt = live ? lerp(hiAmt, 1, 0.25) : 1;
  const hiRow = hover ? hover.r : 0;
  const scan = t >= 3.3 && t <= 4.5 ? lerp(-60, N_DAYS + 60, (t - 3.3) / 1.1) : -1e4;
  if (GLOK) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(BG[0], BG[1], BG[2], 1); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    const focus = Math.hypot(cam.eye[0] - cam.L[0], cam.eye[1] - cam.L[1], cam.eye[2] - cam.L[2]);
    gl.uniformMatrix4fv(U.uVP, false, VP); gl.uniform3fv(U.uEye, cam.eye);
    gl.uniform1f(U.uT, t); gl.uniform1f(U.uN, N_DAYS); gl.uniform1f(U.uR, NR); gl.uniform1f(U.uSettled, STILL ? 1 : 0);
    gl.uniform3f(U.uS, W3, H3, D3);
    gl.uniform1f(U.uBase, 1.0 * DPR * Math.sqrt(VH / 900) * (PHONE ? 0.85 : 1));
    gl.uniform1f(U.uFocus, focus);
    gl.uniform1f(U.uAp, lerp(10, 1.0, smooth(cam.u * 1.1)) * DPR);
    gl.uniform1f(U.uCocMax, (PHONE ? 9 : 14) * DPR);
    gl.uniform1f(U.uMirror, AR ? -1 : 1);
    gl.uniform2f(U.uView, canvas.width, canvas.height);
    gl.uniform4f(U.uMask, MASK[0] * DPR, MASK[1] * DPR, MASK[2] * DPR, MASK[3] * DPR);
    gl.uniform4f(U.uMask2, MASK2[0] * DPR, MASK2[1] * DPR, MASK2[2] * DPR, MASK2[3] * DPR);
    gl.uniform4f(U.uMask3, MASK3[0] * DPR, MASK3[1] * DPR, MASK3[2] * DPR, MASK3[3] * DPR);
    gl.uniform1f(U.uLine, 0);
    gl.uniform1f(U.uFeather, (PHONE ? 36 : 80) * DPR);
    gl.uniform2f(U.uFog, focus * 1.0, focus * 3.2);
    gl.uniform1f(U.uHiRow, hiRow); gl.uniform1f(U.uHiAmt, hover ? hiAmt : noteOn);
    gl.uniform1f(U.uAccOn, hover ? 0 : 1); gl.uniform1f(U.uPk, PK);               
    gl.uniform1f(U.uDim, hover ? 1 : noteOn); gl.uniform1f(U.uScan, scan);
    gl.uniform1f(U.uGain, (PHONE ? 0.52 : 0.46) * (1 + 0.5 * (1 - smooth((t - 0.3) / 1.4))));
    gl.uniform3fv(U.uInk, INK); gl.uniform3fv(U.uAcc, ACC); gl.uniform3fv(U.uBg, BG);
    const bind = list => { for (const [loc, b, n] of list) { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0); } };
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    if (t >= 1.9 || STILL) {
      bind(prog.cbufs);
      gl.disable(gl.BLEND); gl.depthMask(true);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2, 4);
      gl.uniform1f(U.uCurtain, 1);
      for (let r = 0; r < NR; r++) gl.drawArrays(gl.TRIANGLE_STRIP, r * N_DAYS * 2, N_DAYS * 2);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.uniform1f(U.uCurtain, 0);
      for (const [loc] of prog.cbufs) gl.disableVertexAttribArray(loc);
    }
    bind(prog.bufs); gl.vertexAttrib1f(prog.locF, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.drawArrays(gl.POINTS, 0, NP);
    gl.uniform1f(U.uLine, 1); gl.uniform1f(U.uLineAmt, (PHONE ? 0.18 : 0.17) * DPR * smooth((t - 1.3) / 0.9));
    for (let r = 0; r < NR; r++) gl.drawArrays(gl.LINE_STRIP, r * N_DAYS, N_DAYS);
    for (const [loc] of prog.bufs) gl.disableVertexAttribArray(loc);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(true);
    gl.useProgram(prog2);
    const l2 = gl.getAttribLocation(prog2, 'aK');
    gl.uniformMatrix4fv(U2.uVP, false, VP); gl.uniform1f(U2.uMirror, AR ? -1 : 1);
    if (noteOn > 0 && !hover && stemLen > 0.05) {
      gl.uniform3fv(U2.uCol, ACC);
      gl.bindBuffer(gl.ARRAY_BUFFER, stemBuf); gl.enableVertexAttribArray(l2); gl.vertexAttribPointer(l2, 1, gl.FLOAT, false, 0, 0);
      gl.uniform3f(U2.uBase3, xOf(PK), yOf(R0.v[PK]) + 0.12, zOf(0));
      gl.uniform1f(U2.uLen, stemLen); gl.uniform1f(U2.uGrow, smooth((t - 4.0) / 0.5));
      gl.uniform1f(U2.uSize, 2.2 * DPR); gl.uniform1f(U2.uRing, 0); gl.uniform1f(U2.uA, 0.9);
      gl.drawArrays(gl.POINTS, 0, STEM_N);
    }
    if (hover) {
      gl.uniform3fv(U2.uCol, INK);
      gl.bindBuffer(gl.ARRAY_BUFFER, oneBuf); gl.enableVertexAttribArray(l2); gl.vertexAttribPointer(l2, 1, gl.FLOAT, false, 0, 0);
      gl.uniform3f(U2.uBase3, xOf(hover.i), yOf(ROWS[hover.r].v[hover.i]), zOf(hover.r));
      gl.uniform1f(U2.uLen, 0); gl.uniform1f(U2.uGrow, 1); gl.uniform1f(U2.uSize, 14 * DPR); gl.uniform1f(U2.uRing, 1); gl.uniform1f(U2.uA, 1);
      gl.drawArrays(gl.POINTS, 0, 1);
    }
    gl.disableVertexAttribArray(l2);
  } else drawFallback(VP);

  const yearOn = smooth((t - 3.6) / 0.6);
  for (const y of years) {
    const q = project(VP, [xOf(y.i), 0, zOf(NR - 1) + 0.55]);
    const yw = y.el.offsetWidth, yx = q[0] - yw / 2;
    const okX = yx > 8 && yx + yw < VW - 8;
    
    const inMask = (m) => q[0] > m[0] - 20 && q[0] < m[2] + 20 && q[1] + 6 > m[1] - 10 && q[1] + 6 < m[3] + 10;
    place(y.el, yx, q[1] + 6, (q[2] > 0 && okX && !inMask(MASK2) && !inMask(MASK3) && !inMask(MASK)) ? yearOn : 0);
  }
  for (const r of ramEls) {
    const q = project(VP, [xOf(r.i), 0, zOf(NR - 1) + 0.55]);
    place(r.el, q[0] - r.el.offsetWidth / 2, q[1] + 30, q[2] > 0 ? yearOn : 0);
  }
  if (jewEl) {
    const q = project(VP, [xOf(JPK), yOf(ROWS[JR].v[JPK]), zOf(JR)]);
    const jw = jewEl.offsetWidth, jx = clamp(AR ? q[0] - jw - 14 : q[0] + 14, 12, VW - jw - 12);
    jewEl.style.textAlign = AR ? 'end' : 'start';
    place(jewEl, jx, q[1] - jewEl.offsetHeight - 10, hover ? 0 : smooth((t - 4.6) / 0.5));
  }
  const top = project(VP, [pk[0], pk[1] + stemLen, pk[2]]);
  const noteO = hover ? 0 : smooth((t - 4.25) / 0.5);
  const nw = noteEl.offsetWidth, edge = VW < 761 ? 16 : 12;
  let nEnd = AR;
  if (!AR && top[0] + nw > VW - edge) nEnd = true;
  if (AR && top[0] - nw < edge) nEnd = false;
  noteEl.style.textAlign = nEnd ? 'end' : 'start';
  const nx = clamp(nEnd ? top[0] - nw : top[0], edge, VW - edge - nw);
  place(noteEl, nx, top[1] - noteEl.offsetHeight - 6, noteO);
  if (hover) {
    const r = ROWS[hover.r], [l1, l2b] = HT.read(r, hover.i);
    readEl.firstChild.textContent = l1; readEl.lastChild.textContent = l2b;
    const q = project(VP, [xOf(hover.i), yOf(r.v[hover.i]), zOf(hover.r)]);
    
    const rw = readEl.offsetWidth;
    const toLeft = AR ? q[0] - rw - 20 > 8 : q[0] + rw + 20 > VW - 8;
    place(readEl, toLeft ? q[0] - 16 - rw : q[0] + 16, q[1] - 52, 1);
  } else readEl.style.opacity = 0;

  let si = 0; for (let k = 0; k < STATUS_AT.length; k++) if (t >= STATUS_AT[k]) si = k;
  
  const outAll = smooth((t - 4.7) / 0.45);     
  statusEls.forEach((el, k) => {
    let a = k === si ? (k === 0 ? 1 : smooth((t - STATUS_AT[k] - 0.12) / 0.2)) : (k === si - 1 ? 1 - smooth((t - STATUS_AT[si]) / 0.12) : 0);
    if (k === STATUS_AT.length - 1) a *= 1;
    el.style.opacity = a.toFixed(3);
    el.style.display = a > 0 ? '' : 'none';
  });
  $('caption').style.opacity = smooth((t - 1.5) / 0.6).toFixed(3);       
  $('status').style.opacity = (1 - outAll).toFixed(3);     
}
let ctx2d = null;
function drawFallback(VP) {
  ctx2d = ctx2d || canvas2.getContext('2d');
  if (!ctx2d) return;
  ctx2d.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx2d.fillStyle = '#121110'; ctx2d.fillRect(0, 0, VW, VH);
  for (let r = 0; r < NR; r++) {
    const top = [], flo = [];
    for (let i = 0; i < N_DAYS; i++) { top.push(project(VP, [xOf(i), yOf(ROWS[r].v[i]), zOf(r)])); flo.push(project(VP, [xOf(i), 0, zOf(r)])); }
    ctx2d.beginPath(); top.forEach((q, i) => i ? ctx2d.lineTo(q[0], q[1]) : ctx2d.moveTo(q[0], q[1]));
    for (let i = N_DAYS - 1; i >= 0; i--) ctx2d.lineTo(flo[i][0], flo[i][1]);
    ctx2d.closePath(); ctx2d.fillStyle = '#121110'; ctx2d.fill();
    ctx2d.beginPath(); top.forEach((q, i) => i ? ctx2d.lineTo(q[0], q[1]) : ctx2d.moveTo(q[0], q[1]));
    ctx2d.lineWidth = 0.8; ctx2d.strokeStyle = r === 0 ? 'rgba(217,164,65,0.9)' : 'rgba(236,232,223,0.5)'; ctx2d.stroke();
  }
}






const now = () => performance.now() / 1000;
let heroStart = now(), heroVisible = true, lastNow = now();



let running = false, ptrDirty = false;
function kick() { if (!running && started) { running = true; lastNow = now(); requestAnimationFrame(liveTick); } }
const heroIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; if (heroVisible) kick(); }) : null;
if (heroIO && !SEEKING) heroIO.observe(heroEl);
['pointermove', 'pointerdown', 'pointerleave'].forEach(ev => heroEl.addEventListener(ev, () => { ptrDirty = true; kick(); }, { passive: true }));
function liveTick() {
  const tn = now(), dt = Math.min(0.05, tn - lastNow); lastNow = tn;
  springStep(dt);
  const ht = STILL ? T_END + 0.01 : tn - heroStart;
  const moving = Math.abs(off.th - off.tth) + Math.abs(off.ph - off.tph) + Math.abs(off.vth) + Math.abs(off.vph) > 0.001;
  const playing = !STILL && ht < T_END + 31;
  const need = heroVisible && (playing || moving || ptrDirty || hiAmt < 0.999);
  if (need) heroFrame(ht, true);
  ptrDirty = false;
  if (need) requestAnimationFrame(liveTick); else running = false;
}
function seekAll(T) {
  if (heroEl.getBoundingClientRect().bottom > 0) heroFrame(SETTLED ? T_END + 0.01 : T, false);
}
window.__seek = sec => { seekAll(sec); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); };
window.__info = () => ({ points: NP, rows: NR, gl: GLOK, phone: PHONE, peak: fmtDate(PK) });

function layoutAll() { measureHero(); }
layoutAll();
const FACE = KIT.FACE;
const ready = document.fonts && document.fonts.ready ? Promise.all([document.fonts.ready,
  document.fonts.load(`800 40px ${FACE}`), document.fonts.load(`500 13px ${FACE}`), document.fonts.load(`600 13px ${FACE}`)]).catch(() => {}) : Promise.resolve();

const helloOut = KIT.hello();
let started = false;
function startLive() { if (started) return; started = true; heroStart = now(); kick(); }
if (SEEKING) {
  const T0 = Q.has('t') ? parseFloat(Q.get('t')) || 0 : 99;
  seekAll(T0);
  ready.then(() => { layoutAll(); seekAll(T0); });
} else {
  
  heroFrame(0, true);
  const fontsOr = Promise.race([ready, new Promise(r => setTimeout(r, 1500))]);
  fontsOr.then(() => layoutAll());
  
  Promise.all([fontsOr, helloOut]).then(() => { if (!started) layoutAll(); startLive(); });
}
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layoutAll(); if (SEEKING) seekAll(Q.has('t') ? parseFloat(Q.get('t')) || 0 : 99); else if (started) { heroFrame(STILL ? T_END + 0.01 : now() - heroStart, true); kick(); } }, 120); });
})();
