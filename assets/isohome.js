









(() => {
'use strict';
const Q = new URLSearchParams(location.search);

if (Q.get('topl')) window.ISO_TOPL = +Q.get('topl');
if (Q.has('capfoot')) document.documentElement.classList.add('capfoot');



const LOWN = Q.has('low');
if (LOWN) document.documentElement.classList.add('nmlow');

if (Q.get('az')) window.ISO_VIEW = Object.assign(window.ISO_VIEW || {}, { az: +Q.get('az') });
if (Q.get('el')) window.ISO_VIEW = Object.assign(window.ISO_VIEW || {}, { el: +Q.get('el') });
const CAPR = Q.has('capr'); if (CAPR) document.documentElement.classList.add('capr');
if (!Q.has('nolowa')) document.documentElement.classList.add('nmlowa');   
const CARDPTR = !Q.has('nocardptr');   
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PIC = Q.has('t') || Q.has('still') || Q.has('settled');    
const STILL = RM || Q.has('still') || Q.has('settled');         
const SEEKING = PIC;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const easeOut = u => { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); };
const mkRnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const boxEl = $('isobox'), canvas = $('isoscene'), labelsEl = $('isolabels'), tipEl = $('isotip'), keysEl = $('isokeys'), heroEl = $('hero');
const ctx = canvas.getContext('2d');


const BG = [18, 17, 16], INK = [236, 232, 223], ACC = [217, 164, 65];
const mixc = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const rgb = (c, a) => a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
const ink = u => mixc(BG, INK, u);


const AR = document.documentElement.lang === 'ar';
const MIR = AR ? -1 : 1;           
const WORDS = AR ? {
  exports: ['بيانات الأنظمة', 'عدّادات الشبكة وملفات البوابة، تُسحب آليًا في مواعيدها ولا تُنسخ يدويًا.'],
  db: ['قاعدة البيانات', 'جداول التاريخ والمرجع التي تُطابَق عليها كل دفعة جديدة.'],
  files: ['ملفات التقارير', 'تقارير PDF وExcel الأسبوعية، يقرؤها سكربت ويحوّلها إلى جداول نظيفة.'],
  check: ['الفحص', 'كل صف يُختبر، والصفوف الخاطئة تتوقف قبل أن تصل إلى أي تقرير.'],
  match: ['المطابقة', 'تُربط المصادر بمفاتيح مشتركة، وتُسجَّل أي فجوة بينها.'],
  warehouse: ['مستودع البيانات', 'نموذج SQL واحد: جداول حقائق وأبعاد في مخطط نجمي.'],
  model: ['النموذج', 'تنبؤات ودرجات خطر تُختبر على بيانات لم يرها النموذج من قبل.'],
  dash: ['لوحة البيانات', 'رسوم حيّة يستخدمها الناس ليجيبوا عن أسئلتهم بأنفسهم.'],
  outbox: ['البريد الصادر', 'التقرير اليومي يُبنى ويُرسل وحده في موعده، دون أي خطوة يدوية.'],
} : {
  exports: ['Exports', 'Network counters and portal files, pulled on a schedule, never copied by hand.'],
  db: ['Database', 'History and reference tables that every new run is matched against.'],
  files: ['Report files', 'Weekly PDF and Excel reports, read into clean tables by a script.'],
  check: ['Check', 'Every row tested; bad rows stopped before they reach a report.'],
  match: ['Match', 'The sources joined on shared keys, and any gap between them listed.'],
  warehouse: ['Warehouse', 'One SQL model: facts and dimensions in a star schema.'],
  model: ['Model', 'Forecasts and risk scores, tested on data the model never saw.'],
  dash: ['Dashboard', 'Live charts people use to answer their own questions.'],
  outbox: ['Outbox', 'The daily report builds and sends itself on a schedule, with no manual steps.'],
};
const HINT = AR ? (FINE ? 'مرّر المؤشر على أي جزء لترى ما يفعله.' : 'المس أي جزء لترى ما يفعله.') : (FINE ? 'Point at any part to see what it does.' : 'Tap any part to see what it does.');
const ARIA = AR ? 'رسم لطريقة سير العمل: ملفات التقارير وبيانات الأنظمة وقاعدة البيانات تمر عبر بوابة فحص تتوقف عندها الصفوف الخاطئة، ثم تُطابَق وتُخزَّن في مستودع بيانات، وتمر بنموذج، وتخرج لوحة بيانات حيّة وتقريرًا يُرسل في موعده.'
  : 'A drawing of how the work runs: report files, network exports and a database pass a check gate where bad rows stop, are matched, stored in a warehouse, passed through a model, and come out as a live dashboard and a report sent on a schedule.';
const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const bidi = t => AR ? esc(t).replace(/[A-Za-z][A-Za-z ]*[A-Za-z]|[A-Za-z]/g, m => `<bdi lang="en">${m}</bdi>`) : esc(t);   




const AD = s => AR ? String(s).replace(/(\d),(\d)/g, '$1٬$2').replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]) : String(s);
const en = s => `<bdi lang="en" dir="ltr">${esc(s)}</bdi>`;
const CT = AR ? {
  notes: { exports: 'سُحبت صفوف جديدة', db: 'قُرئت جداول المرجع', files: 'قُرئت 3 ملفات', check: 'أُوقفت 3 صفوف خاطئة', match: 'رُبطت بقائمة المرجع',
    warehouse: 'خُزّنت في مخطط نجمي', model: 'حُسب خط الاتجاه', dash: 'حُدّث الرسم المباشر', outbox: 'أُرسل التقرير الساعة 07:00' },
  db: [['الرقم', 'الصنف', 'المنطقة'], ['1001', 'صنف أ', 'الشمال'], ['1002', 'صنف ب', 'الجنوب'], ['1003', 'صنف ج', 'الشرق'], ['1004', 'صنف د', 'الغرب']],
  check: [['2 مارس', 'الشمال', '1,204', ''], ['2 مارس', 'الجنوب', '', 'قيمة فارغة'], ['3 مارس', 'الشمال', '987', ''], ['31 فبراير', 'الشرق', '1,051', 'تاريخ خاطئ'],
    ['3 مارس', 'الجنوب', '1,130', ''], ['3 مارس', 'الجنوب', '1,130', 'صف مكرر']],
  checkSum: 'مرّت 3 صفوف، وأُوقفت 3 مع ذكر السبب',
  match: { a: 'في البيانات', b: 'قائمة المرجع', left: ['فرع أ', 'فرع ب', 'فرع ج', 'فرع س'], right: ['فرع ب', 'فرع أ', 'فرع ج'], flag: 'فرع س ليس في القائمة، فسُجّل' },
  find: 'أعلى يوم', past: 'الماضي', next: 'التوقّع', report: 'التقرير اليومي', sent: 'أُرسل', time: '07:00',
} : {
  notes: { exports: 'new rows pulled', db: 'reference tables read', files: '3 files read', check: '3 bad rows stopped', match: 'joined to the reference list',
    warehouse: 'stored in a star schema', model: 'trend fitted', dash: 'live chart refreshed', outbox: 'report sent at 07:00' },
  db: [['id', 'item', 'region'], ['1001', 'Item A', 'North'], ['1002', 'Item B', 'South'], ['1003', 'Item C', 'East'], ['1004', 'Item D', 'West']],
  check: [['02 Mar', 'North', '1,204', ''], ['02 Mar', 'South', '', 'empty value'], ['03 Mar', 'North', '987', ''], ['31 Feb', 'East', '1,051', 'wrong date'],
    ['03 Mar', 'South', '1,130', ''], ['03 Mar', 'South', '1,130', 'duplicate']],
  checkSum: '3 rows passed, 3 stopped with a reason',
  match: { a: 'In the data', b: 'Reference list', left: ['Store A', 'Store B', 'Store C', 'Store X'], right: ['Store B', 'Store A', 'Store C'], flag: 'Store X is not in the list, so it is flagged' },
  find: 'Busiest day', past: 'past', next: 'forecast', report: 'Daily report', sent: 'Sent', time: '07:00',
};
const FILES = ['daily_sales.csv', 'stock_levels.xlsx', 'weekly_report.pdf'];
let EXPORTS = [['06:00', 'export_0600.zip'], ['06:15', 'export_0615.zip'], ['06:30', 'export_0630.zip'], ['06:45', 'export_0645.zip']];

const API = window.ISO_API !== false;

const SYM = new URLSearchParams(location.search).has('sym');   
const WR = SYM ? 0.86 : 1.15, WL = SYM ? 3 : 4, DK = SYM ? 0.66 : 1;   
if (API) {
  WORDS.exports = AR ? ['واجهة API', 'بيانات تُسحب من خدمات الويب في مواعيدها، دون أي نسخ يدوي.'] : ['API', 'Data pulled from web services on a schedule, never copied by hand.'];
  EXPORTS = [['06:00', 'GET /sales  200'], ['06:15', 'GET /stock  200'], ['06:30', 'GET /orders  200'], ['06:45', 'GET /returns  200']];
}
const DOC = '<svg class="ic-doc" viewBox="0 0 12 14" aria-hidden="true"><path d="M1.5 .5h6l3 3v10h-9z M7.5 .5v3h3"/></svg>';

const A = (...p) => `data-a="${p.map(([ms, c]) => `${Math.round(ms)}:${c || 'on'}`).join('|')}"`;
const rectP = (cx, cy, w, h) => `M${cx - w / 2} ${cy - h / 2}H${cx + w / 2}V${cy + h / 2}H${cx - w / 2}Z`;
function cardHtml(p) {
  const id = p.id; let v = '';
  if (id === 'files') {   
    v = `<ul class="ic-list">${FILES.map((n, i) => `<li class="fx" ${A([120 + i * 300])}>${DOC}<span>${en(n)}</span><i class="ic-ok fo" ${A([420 + i * 300])}>✓</i></li>`).join('')}</ul>`;
  } else if (id === 'db') {   
    v = `<table class="ic-tab"><thead><tr>${CT.db[0].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${CT.db.slice(1).map((r, i) =>
      `<tr>${r.map((c, j) => `<td class="fo" ${A([200 + i * 320 + j * 80])}>${AD(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  } else if (id === 'exports') {   
    v = `<ul class="ic-list ic-times">${EXPORTS.map(([tm, n], i) => `<li class="fx" ${A([150 + i * 420])}><b>${AD(tm)}</b><span>${en(n)}</span><i class="ic-ok fo" ${A([470 + i * 420])}>✓</i></li>`).join('')}</ul>`;
  } else if (id === 'check') {   
    v = `<div class="ic-rows">${CT.check.map(([d, r, n, why], i) => { const t = 150 + i * 330;
      return `<div class="ic-r${why ? ' bad' : ''}" ${A([t, 'in'], [t + 300, 'done'], ...(why ? [[t + 1150, 'out']] : []))}><div><div class="ic-rr"><span>${AD(d)}</span><span>${r}</span><span class="n">${n ? AD(n) : '—'}</span><span class="m">${why ? '✕ ' + why : '✓'}</span></div></div></div>`; }).join('')}</div>
      <p class="ic-sum fo" ${A([150 + CT.check.length * 330 + 1050])}>${AD(CT.checkSum)}</p>`;
  } else if (id === 'match') {   
    const m = CT.match, map = [1, 0, 2, -1], y = i => 11 + 22 * i;
    v = `<div class="ic-match"><p class="ic-mh">${m.a}</p><span></span><p class="ic-mh">${m.b}</p>
      <ul>${m.left.map((n, i) => `<li class="fx${map[i] < 0 ? ' x' : ''}" ${map[i] < 0 ? A([100 + i * 150], [1700, 'bad']) : A([100 + i * 150])}>${n}</li>`).join('')}</ul>
      <svg class="mir" viewBox="0 0 76 88" width="76" height="88" aria-hidden="true">${m.left.map((n, i) => map[i] < 0
        ? `<path class="dr amb" pathLength="1" d="M2 ${y(i)}H24" ${A([1700])}/><path class="fo amb" d="M27 ${y(i) - 3}l6 6m0 -6l-6 6" ${A([1850])}/>`
        : `<path class="dr" pathLength="1" d="M2 ${y(i)}C38 ${y(i)} 38 ${y(map[i])} 74 ${y(map[i])}" ${A([800 + i * 200])}/>`).join('')}</svg>
      <ul>${m.right.map((n, j) => `<li class="fx r" ${A([380 + j * 150])}>${n}</li>`).join('')}</ul></div>
      <p class="ic-flag fo" ${A([1900])}>${m.flag}</p>`;
  } else if (id === 'warehouse') {   
    const dims = [[134, 16, 'dim_date', 'M134 53V27'], [36, 66, 'dim_store', 'M93 66H68'], [232, 66, 'dim_item', 'M175 66H200'], [134, 116, 'dim_region', 'M134 79V105']];
    v = `<svg class="ic-star" viewBox="0 0 268 132" width="268" height="132" aria-hidden="true"><path class="dr" pathLength="1" d="${rectP(134, 66, 82, 26)}" ${A([60])}/>
      <text class="fo" x="134" y="70" ${A([420])}>fact_sales</text>${dims.map(([x, yy, nm, ln], k) => `<path class="dr" pathLength="1" d="${ln}" ${A([560 + k * 230])}/>
      <path class="dr" pathLength="1" d="${rectP(x, yy, 64, 22)}" ${A([700 + k * 230])}/><text class="fo t2" x="${x}" y="${yy + 3.5}" ${A([860 + k * 230])}>${nm}</text>`).join('')}</svg>`;
  } else if (id === 'model') {   
    const rnd = mkRnd(77), base = i => 80 - i * 2.9, X = i => 10 + i * 12;
    const dots = Array.from({ length: 14 }, (_, i) => [X(i), base(i) + (rnd() - 0.5) * 16]);
    const xe = X(13), seg = [];
    for (let x = xe; x < 258; x += 9) seg.push([x, Math.min(x + 5, 258)]);
    const yl = x => base((x - 10) / 12);
    v = `<svg class="ic-ch mir" viewBox="0 0 268 104" width="268" height="104" aria-hidden="true"><path class="ax" d="M6 96H262"/><path class="ax dsh" d="M${xe} 8V96"/>
      <path class="band fo" d="M${xe} ${yl(xe)}L258 ${yl(258) - 26}L258 ${yl(258) + 22}Z" ${A([1250])}/>
      ${dots.map(([x, yy], i) => `<circle class="pop" cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="2.3" ${A([100 + i * 45])}/>`).join('')}
      <path class="dr" pathLength="1" d="M10 ${yl(10)}L${xe} ${yl(xe)}" ${A([820])}/>
      ${seg.map(([a, b], k) => `<path class="fo" d="M${a} ${yl(a).toFixed(1)}L${b} ${yl(b).toFixed(1)}" ${A([1350 + k * 55])}/>`).join('')}</svg>
      <p class="ic-leg"><span>${CT.past}</span><span>${CT.next}</span></p>`;
  } else if (id === 'dash') {   
    const S12 = [0.3, 0.37, 0.33, 0.42, 0.4, 0.47, 0.44, 0.57, 0.52, 0.86, 0.62, 0.66], X = i => 10 + i * (248 / 11), Y = q => 92 - q * 80;
    const pk = 9, px = X(pk), py = Y(S12[pk]), lx = AR ? 268 - px : px;
    v = `<div class="ic-dw"><svg class="ic-ch mir" viewBox="0 0 268 104" width="268" height="104" aria-hidden="true"><path class="ax" d="M6 96H262"/><path class="ax dsh" d="M6 56H262M6 16H262"/>
      <path class="dr slow" pathLength="1" d="${S12.map((q, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(q).toFixed(1)}`).join('')}" ${A([150])}/>
      <path class="fo amb dsh" d="M${px} ${py + 6}V96" ${A([1350])}/><circle class="ring fo" cx="${px}" cy="${py}" r="7" ${A([1350])}/><circle class="pop amb" cx="${px}" cy="${py}" r="3.4" ${A([1300])}/></svg>
      <span class="ic-find fo" style="left:${(lx / 268 * 100).toFixed(1)}%;top:${(py - 24).toFixed(0)}px" ${A([1450])}>${CT.find}</span></div>`;
  } else if (id === 'outbox') {   
    v = `<div class="ic-out"><svg class="mir" viewBox="0 0 150 92" width="150" height="92" aria-hidden="true">
      <g class="ic-sheet" ${A([150])}><path d="M34 54L96 54L109 45L47 45Z"/><path class="ln" d="M54 48H90M50 51H78"/></g>
      <path d="M22 56L118 56L134 42L38 42Z M22 56V74H118V56 M118 74L134 60V42" /><path class="ln" d="M22 74L38 60V42 M38 60H134" /></svg>
      <div class="ic-sent fo" ${A([1000])}><span>${CT.report}</span><b><svg class="ic-clock" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5"/><path d="M10 10V3.6 M10 10L6.6 15.9"/></svg>${CT.sent} ${AD(CT.time)}</b></div></div>`;
  }
  return `<p class="ic-h">${esc(p.label)}</p><div class="ic-v icv-${id}">${v}</div><p class="ic-f">${bidi(p.text)}</p>`;
}





function solid(v, faces, o = {}) {
  const em = new Map(), edges = [];
  faces.forEach((f, fi) => { const I = f.i; for (let k = 0; k < I.length; k++) {
    const a = I[k], b = I[(k + 1) % I.length], key = a < b ? a * 8192 + b : b * 8192 + a, e = em.get(key);
    if (e) e.f2 = fi; else { const ne = { a, b, f1: fi, f2: -1, k: 0 }; em.set(key, ne); edges.push(ne); } } });
  for (const e of edges) {
    const fa = faces[e.f1], fb = e.f2 >= 0 ? faces[e.f2] : null;
    e.sharp = !(fa.side && fb && fb.side);
    if (v[e.b][2] < v[e.a][2] - 1e-6) { const t = e.a; e.a = e.b; e.b = t; }   
  }
  let c = [0, 0, 0], zmin = Infinity, zmax = -Infinity;
  for (const p of v) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; zmin = Math.min(zmin, p[2]); zmax = Math.max(zmax, p[2]); }
  c = c.map(q => q / v.length);
  return Object.assign({ v, faces, edges, c, zmin, zmax, kind: 'poly', sx: new Float32Array(v.length), sy: new Float32Array(v.length), front: new Uint8Array(faces.length) }, o);
}

function cuboid(x0, y0, z0, w, d, h, o = {}) {
  let v = [[x0, y0, z0], [x0 + w, y0, z0], [x0 + w, y0 + d, z0], [x0, y0 + d, z0], [x0, y0, z0 + h], [x0 + w, y0, z0 + h], [x0 + w, y0 + d, z0 + h], [x0, y0 + d, z0 + h]];
  let F = [{ i: [0, 3, 2, 1], n: [0, 0, -1] }, { i: [4, 5, 6, 7], n: [0, 0, 1] }, { i: [0, 1, 5, 4], n: [0, -1, 0] }, { i: [1, 2, 6, 5], n: [1, 0, 0] }, { i: [2, 3, 7, 6], n: [0, 1, 0] }, { i: [3, 0, 4, 7], n: [-1, 0, 0] }];
  if (o.rot) { const R = rotor(x0 + w / 2, y0 + d / 2, o.rot); v = v.map(R); F = F.map(f => ({ i: f.i, n: [f.n[0] * Math.cos(o.rot) - f.n[1] * Math.sin(o.rot), f.n[0] * Math.sin(o.rot) + f.n[1] * Math.cos(o.rot), f.n[2]] })); }
  return solid(v, F, o);
}
const rotor = (cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return ([x, y, z]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c, z]; };

function drum(cx, cy, z0, r, h, o = {}) {
  const n = o.n || 64, v = [], F = [];
  for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; v.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + k * h]); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, am = (i + 0.5) / n * 2 * Math.PI; F.push({ i: [i, j, n + j, n + i], n: [Math.cos(am), Math.sin(am), 0], side: 1 }); }
  F.push({ i: Array.from({ length: n }, (_, i) => n + i), n: [0, 0, 1] });
  F.push({ i: Array.from({ length: n }, (_, i) => n - 1 - i), n: [0, 0, -1] });
  const s = solid(v, F, Object.assign({ kind: 'cyl', n, cx, cy, r }, o));
  for (const e of s.edges) if (Math.abs(v[e.a][2] - v[e.b][2]) < 1e-6) e.k = ((Math.min(e.a, e.b) % n) / n) * 0.3;   
  return s;
}

function drumX(cx, cy, cz, r, d, o = {}) {   
  const n = o.n || 48, v = [], F = [];
  for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; v.push([cx + (k ? d / 2 : -d / 2), cy + r * Math.cos(a), cz + r * Math.sin(a)]); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, am = (i + 0.5) / n * 2 * Math.PI; F.push({ i: [i, j, n + j, n + i], n: [0, Math.cos(am), Math.sin(am)], side: 1 }); }
  F.push({ i: Array.from({ length: n }, (_, i) => n + i), n: [1, 0, 0] });
  F.push({ i: Array.from({ length: n }, (_, i) => n - 1 - i), n: [-1, 0, 0] });
  const s = solid(v, F, Object.assign({ kind: 'cyl', n }, o));
  for (const e of s.edges) if (Math.abs(v[e.a][0] - v[e.b][0]) < 1e-6) e.k = ((Math.min(e.a, e.b) % n) / n) * 0.3;
  return s;
}


function route(pts, r = 0.42) {
  const out = [pts[0].slice()];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const d1 = [(b[0] - a[0]) / l1, (b[1] - a[1]) / l1], d2 = [(c[0] - b[0]) / l2, (c[1] - b[1]) / l2];
    const rr = Math.min(r, l1 / 2, l2 / 2), p1 = [b[0] - d1[0] * rr, b[1] - d1[1] * rr];
    const ctr = [p1[0] + d2[0] * rr, p1[1] + d2[1] * rr];
    let a0 = Math.atan2(p1[1] - ctr[1], p1[0] - ctr[0]), a1 = Math.atan2(b[1] + d2[1] * rr - ctr[1], b[0] + d2[0] * rr - ctr[0]);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    for (let k = 0; k <= 10; k++) out.push([ctr[0] + rr * Math.cos(a0 + da * k / 10), ctr[1] + rr * Math.sin(a0 + da * k / 10)]);
  }
  out.push(pts[pts.length - 1].slice());
  const cum = [0]; for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { p: out, cum, L: cum[cum.length - 1] };
}
function at(rt, s) {
  s = clamp(s, 0, rt.L); const c = rt.cum; let lo = 0, hi = c.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; }
  const f = (s - c[lo]) / Math.max(1e-9, c[hi] - c[lo]), a = rt.p[lo], b = rt.p[hi];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}



let UPS = {};
function build(compact) {
  const parts = [], pipes = [], routes = {};
  const part = (id, lead) => { const p = { id, label: WORDS[id][0], text: WORDS[id][1], prims: [], decor: [], lead: lead || 30, lit: 0, boost: 0 }; parts.push(p); return p; };
  const add = (p, s) => { p.prims.push(s); s.part = p; return s; };
  
  const deco = (p, s, face, o) => { p.decor.push(Object.assign({ s, face, tone: 0.5, w: 1 }, o)); };

  function apiAt(x, y) {   
    const p = part('exports', 30);
    add(p, cuboid(x - 0.66, y - 0.66, 0, 1.32, 1.32, 0.06));
    const b = add(p, cuboid(x - 0.6, y - 0.6, 0.06, 1.2, 1.2, 0.82));   
    const z = 0.881, mk = [
      [[x + 0.22, y - 0.3, z], [x, y - 0.42, z], [x - 0.22, y - 0.3, z]],      
      [[x + 0.22, y + 0.3, z], [x, y + 0.42, z], [x - 0.22, y + 0.3, z]],      
      [[x + 0.26, y + 0.08, z], [x - 0.26, y - 0.08, z]]];                     
    deco(p, b, 1, { lines: mk, tone: 0.5 });
    const fx = x + 0.6 + 0.002;
    deco(p, b, 3, { lines: [[[fx, y + 0.34, 0.3], [fx, y - 0.34, 0.3]], [[fx, y + 0.34, 0.5], [fx, y - 0.34, 0.5]], [[fx, y + 0.34, 0.7], [fx, y - 0.34, 0.7]]], tone: 0.36 });
    deco(p, b, 3, { dots: t => [[[fx, y + 0.44, 0.4], ((t * 0.55) % 1) < 0.12 ? 1 : 0.35]], r: 1.6 });
    p.anchor = [x, y, 0.88]; return p;
  }
  function exportsAt(x, y) {
    if (API) return apiAt(x, y);
    const p = part('exports', 30);
    add(p, cuboid(x - 0.72, y - 0.82, 0, 1.44, 1.64, 0.08));
    const b = add(p, cuboid(x - 0.62, y - 0.72, 0.08, 1.24, 1.44, 2.12));
    const fx = x + 0.62 + 0.002, units = [];
    for (let k = 0; k < 6; k++) {
      const z0 = 0.26 + k * 0.32, z1 = z0 + 0.22;
      units.push([[fx, y + 0.58, z0], [fx, y - 0.58, z0], [fx, y - 0.58, z1], [fx, y + 0.58, z1], [fx, y + 0.58, z0]]);
      units.push([[fx, y + 0.1, z0 + 0.11], [fx, y - 0.42, z0 + 0.11]]);
    }
    deco(p, b, 3, { lines: units, tone: 0.42 });
    
    deco(p, b, 3, { dots: t => Array.from({ length: 6 }, (_, k) => { const ph = (t * 0.55 + k * 0.381) % 1; return [[fx, y + 0.42, 0.37 + k * 0.32], ph < 0.1 ? 1 : 0.35]; }), r: 1.5 });
    deco(p, b, 1, { lines: [[[x - 0.36, y - 0.5, 2.2 + 0.001], [x - 0.36, y + 0.5, 2.2 + 0.001]], [[x - 0.12, y - 0.5, 2.2 + 0.001], [x - 0.12, y + 0.5, 2.2 + 0.001]], [[x + 0.12, y - 0.5, 2.2 + 0.001], [x + 0.12, y + 0.5, 2.2 + 0.001]]], tone: 0.3 });
    p.anchor = [x, y, 2.2]; return p;
  }
  function dbAt(x, y) {
    const p = part('db', 26);
    if (API) { for (let k = 0; k < 3; k++) add(p, drum(x, y, k * 0.3, 0.82, 0.27)); p.anchor = [x, y, 0.87]; return p; }   
    for (let k = 0; k < 3; k++) add(p, drum(x, y, k * 0.5, 0.7, 0.42));
    p.anchor = [x, y, 1.42]; return p;
  }
  function filesAt(x, y) {
    const p = part('files', 26);
    const rots = [0.0, 0.035, -0.03, 0.05, -0.085], dx = [0, 0.03, -0.025, 0.02, 0.05], dy = [0, -0.03, 0.02, 0.04, -0.03];
    let top;
    const NS = API ? 9 : 5, st = API ? 0.1 : 0.085, fw = API ? 1.1 : 1.04, fd = API ? 1.24 : 1.44;   
    const ri = k => rots[k % 5] * (API ? 0.6 : 1), xi = k => dx[k % 5], yi = k => dy[k % 5];
    for (let k = 0; k < NS; k++) top = add(p, cuboid(x - fw / 2 + xi(k), y - fd / 2 + yi(k), k * st, fw, fd, 0.05, { rot: ri(k) }));
    const kt = NS - 1, R = rotor(x + xi(kt), y + yi(kt), ri(kt)), zt = kt * st + 0.05 + 0.001, L = [];
    const x0 = x + xi(kt) - 0.36, y0 = y + yi(kt) - (API ? 0.44 : 0.5);
    L.push([[x0, y0, zt], [x0 + 0.42, y0, zt]].map(R));
    for (let j = 0; j < 6; j++) L.push([[x0, y0 + 0.22 + j * 0.13, zt], [x0 + (j === 5 ? 0.44 : 0.72), y0 + 0.22 + j * 0.13, zt]].map(R));
    deco(p, top, 1, { lines: L, tone: 0.4 });
    p.anchor = [x, y, zt]; return p;
  }
  
  function gateAt(x, lanes) {
    const p = part('check', 34);
    
    const sp = lanes[1] - lanes[0], ya = lanes[0] - sp * 0.85, yb = lanes[lanes.length - 1] + sp * 0.85, hh = +(Q.get('gh') || 1.42), zl = 0.07 + hh;
    const sill = add(p, cuboid(x - 0.11, ya, 0, 0.22, yb - ya, 0.07));
    add(p, cuboid(x - 0.1, ya, 0.07, 0.2, 0.18, hh)); add(p, cuboid(x - 0.1, yb - 0.18, 0.07, 0.2, 0.18, hh));
    
    
    add(p, cuboid(x - 0.12, ya - 0.03, zl, 0.24, yb - ya + 0.06, 0.2)).bias = 100;
    for (const ly of lanes) add(p, cuboid(x - 0.08, ly - 0.09, zl - 0.12, 0.16, 0.18, 0.12));
    const zb = zl + 0.2, mesh = [];
    for (let y = ya + 0.28; y < yb - 0.22; y += 0.11) mesh.push([[x, y, 0.07], [x, y, zl - 0.14]]);
    deco(p, sill, -1, { lines: mesh, tone: 0.34 });
    deco(p, sill, -1, { draw: (t, lit, dim) => {
      
      if (!STILL && !frameAct) { const cc = chainAt(t); if (cc ? (cc.on && !cc.reached.has('check')) : (!CH.skip && t < CH.t0)) return; }
      for (const k of M.pk || []) {
        if (k.out) continue;
        const d = k.x - x, stopped = k.stop != null, a = stopped ? (1 - smooth((k.stop - STOP) / FADE)) : Math.exp(-(d * d) / 0.05);
        if (a < 0.02) continue;
        const X = pjx(x, k.y, 0.09), Y0 = pjy(x, k.y, 0.09), Y1 = pjy(x, k.y, zl - 0.12);
        const c = stopped ? ACC : mixc(INK, ACC, 0.12);
        ctx.save(); ctx.shadowColor = rgb(c, 0.85 * a); ctx.shadowBlur = (stopped ? 12 : 7) * DPR;
        ctx.strokeStyle = rgb(c, (stopped ? 1 : 0.7) * a * (1 - 0.5 * dim)); ctx.lineWidth = stopped ? 1.6 : 1.2;
        ctx.beginPath(); ctx.moveTo(X, Y0); ctx.lineTo(X, Y1); ctx.stroke(); ctx.restore();
      }
    } });
    p.anchors = [[x, (ya + yb) / 2, zb], [x, ya + 0.1, zb], [x, yb - 0.1, zb]];
    p.anchor = p.anchors[1]; p.gateX = x; return p;
  }
  function matchAt(x, y) {
    const p = part('match', 26);
    add(p, drum(x, y, 0, 0.86, 0.46));   
    const cap = add(p, drum(x, y, 0.46, 0.5, 0.1));
    const ring = (cx, cy) => Array.from({ length: 41 }, (_, k) => { const a = k / 40 * 2 * Math.PI; return [cx + 0.15 * Math.cos(a), cy + 0.15 * Math.sin(a), 0.561]; });
    deco(p, cap, cap.n, { lines: [ring(x - 0.07, y + 0.07), ring(x + 0.07, y - 0.07)], tone: 0.62, boost: true });
    p.anchor = [x, y, 0.56]; return p;
  }
  function warehouseAt(x, y) {
    const p = part('warehouse', 30);
    let top;
    for (let k = 0; k < WL; k++) top = add(p, drum(x, y, k * 0.38, WR, 0.3, { n: 96 }));
    const zt = (WL - 1) * 0.38 + 0.3, dd = 0.7 * WR / 1.15;
    const dims = [[dd, 0], [-dd, 0], [0, dd], [0, -dd]];
    deco(p, top, top.n, { lines: dims.map(([u, v]) => [[x, y, zt + 0.001], [x + u, y + v, zt + 0.001]]), tone: 0.55 });
    add(p, cuboid(x - 0.22, y - 0.22, zt, 0.44, 0.44, 0.2));
    for (const [u, v] of dims) add(p, cuboid(x + u - 0.14, y + v - 0.14, zt, 0.28, 0.28, 0.13));
    p.anchor = [x, y, zt + 0.2]; return p;
  }
  function modelAt(x, y) {
    const p = part('model', 30);
    const wx = SYM ? 1.0 : 1.1, wy = SYM ? 1.25 : 1.62, h = SYM ? 0.9 : 1.12;
    add(p, cuboid(x - wx / 2 - 0.1, y - wy / 2 - 0.1, 0, wx + 0.2, wy + 0.2, 0.07));
    const b = add(p, cuboid(x - wx / 2, y - wy / 2, 0.07, wx, wy, h));
    const zt = 0.07 + h + 0.001, q = 0.16;
    deco(p, b, 1, { lines: [[[x - wx / 2 + q, y - wy / 2 + q, zt], [x + wx / 2 - q, y - wy / 2 + q, zt], [x + wx / 2 - q, y + wy / 2 - q, zt], [x - wx / 2 + q, y + wy / 2 - q, zt], [x - wx / 2 + q, y - wy / 2 + q, zt]]], tone: 0.3 });
    
    const fx = x + wx / 2 + 0.002, ya = y + wy / 2 - 0.2, yb = y - wy / 2 + 0.2, z0 = 0.3, H = h - 0.42;
    const f = u => 0.08 + 0.3 * u + 0.06 * Math.sin(u * 9.5) * (1 - u) + 0.36 * u * u;
    const pt = (u, df = 0) => [fx, lerp(ya, yb, u), z0 + H * clamp(f(u) + df, 0, 1.02)];
    const hist = [], fc = [], hi = [], lo = [], cut = 0.6;
    for (let k = 0; k <= 48; k++) hist.push(pt(cut * k / 48));
    for (let k = 0; k <= 18; k++) { const u = cut + (1 - cut) * k / 18; fc.push(pt(u)); hi.push(pt(u, 0.5 * (u - cut))); lo.push(pt(u, -0.42 * (u - cut))); }
    deco(p, b, 3, { lines: [[[fx, ya + 0.06, z0 - 0.06], [fx, yb - 0.06, z0 - 0.06]], [[fx, ya + 0.06, z0 - 0.06], [fx, ya + 0.06, z0 + H + 0.04]]], tone: 0.3 });
    deco(p, b, 3, { lines: [hi, lo], tone: 0.3 });
    deco(p, b, 3, { lines: [hist], tone: 0.9, w: 1.2, boost: true });
    deco(p, b, 3, { lines: [fc], tone: 0.9, w: 1.2, dash: [3, 3], flow: true, boost: true });
    p.anchor = [x, y, zt]; return p;
  }
  function dashAt(x, y) {
    const p = part('dash', 30);
    add(p, cuboid(x - 0.62, y - 0.75, 0, 1.24, 1.5, 0.06));
    add(p, cuboid(x - 0.13, y - 0.08, 0.06, 0.16, 0.16, 0.92 * DK));
    const scr = add(p, cuboid(x + 0.03, y - 1.5 * DK, 0.96 * DK, 0.12, 3.0 * DK, 2.06 * DK));
    const fx = x + 0.15 + 0.002, ya = y + 1.26 * DK, yb = y - 1.26 * DK, za = 0.96 * DK + 0.24 * DK, zb = 0.96 * DK + 1.86 * DK;
    deco(p, scr, 3, { lines: [[[fx, ya, za], [fx, yb, za]]], tone: 0.42 });
    deco(p, scr, 3, { lines: [[[fx, ya, za + 0.5], [fx, yb, za + 0.5]], [[fx, ya, za + 1.0], [fx, yb, za + 1.0]]], tone: 0.24, dash: [2, 3] });
    deco(p, scr, 3, { lines: [[[fx, ya, zb + 0.06], [fx, ya - 0.5, zb + 0.06]]], tone: 0.55 });
    
    const rnd = mkRnd(905), S = []; let v = 0.4; for (let k = 0; k < 400; k++) { v = clamp(v + (rnd() - 0.47) * 0.22, 0.12, 0.92); S.push(v); }
    const NPT = 9, step = (ya - yb) / (NPT - 1);
    
    const chart = t => {
      const n = p.arrivals ? p.arrivals(t) : { n: 60, f: 1 };
      const sh = easeOut(n.f), raw = [], out = [];
      for (let k = 0; k <= NPT; k++) raw.push([fx, ya - (k - sh) * step, za + 0.1 + 1.36 * S[(n.n + k) % S.length]]);
      const inside = a => a[1] <= ya + 1e-9 && a[1] >= yb - 1e-9;
      raw.forEach((a, i) => {
        if (i) { const b = raw[i - 1]; for (const e of [ya, yb]) if ((b[1] - e) * (a[1] - e) < 0) { const f = (e - b[1]) / (a[1] - b[1]); out.push([fx, e, b[2] + (a[2] - b[2]) * f]); } }
        if (inside(a)) out.push(a);
      });
      return out;
    };
    deco(p, scr, 3, { tone: 0.88, w: 1.25, fn: t => { const c = chart(t); return c.length > 1 ? [c] : []; } });
    deco(p, scr, 3, { r: 1.7, tone: 0.9, dots: t => { const c = chart(t); return c.length ? [[c[c.length - 1], 1]] : []; } });
    
    deco(p, scr, 3, { draw: (t, lit, dim) => {
      const c = chart(t); if (c.length < 3) return;
      let k = 1; for (let i = 1; i < c.length - 1; i++) if (c[i][2] > c[k][2]) k = i;
      const q = c[k], X = pjx(...q), Y = pjy(...q), YB = pjy(q[0], q[1], za), a = (1 - 0.5 * dim) * smooth(Math.min(q[1] - yb, ya - q[1]) / 0.25);
      ctx.save(); ctx.strokeStyle = rgb(ACC, 0.55 * a); ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X, Y + 4); ctx.lineTo(X, YB); ctx.stroke(); ctx.setLineDash([]);
      ctx.shadowColor = rgb(ACC, 0.8 * a); ctx.shadowBlur = 8 * DPR; ctx.fillStyle = rgb(ACC, a);
      ctx.beginPath(); ctx.arc(X, Y, 2.4 * (S / 40 + 0.4), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.strokeStyle = rgb(ACC, 0.45 * a); ctx.beginPath(); ctx.arc(X, Y, 5.5 * (S / 40 + 0.4), 0, Math.PI * 2); ctx.stroke();
    } });
    p.anchor = [x + 0.09, y, (0.96 + 2.06) * DK]; p.chart = true; return p;
  }
  function outboxAt(x, y, clockAt) {
    const p = part('outbox', 26);
    const wx = 1.5, wy = 1.3, hw = 0.36, t1 = 0.05;
    add(p, cuboid(x - wx / 2, y - wy / 2, 0, wx, wy, 0.05));
    add(p, cuboid(x - wx / 2, y - wy / 2, 0.05, t1, wy, hw));
    add(p, cuboid(x - wx / 2 + t1, y - wy / 2, 0.05, wx - 2 * t1, t1, hw));
    add(p, cuboid(x - 0.55, y - 0.48, 0.05, 1.1, 0.96, 0.035));
    const topS = add(p, cuboid(x - 0.54, y - 0.46, 0.085, 1.1, 0.96, 0.035, { rot: 0.04 }));
    
    const fall = add(p, cuboid(x - 0.54, y - 0.46, 0.085, 1.1, 0.96, 0.035, { rot: 0.04 }));
    const Rr = rotor(x + 0.01, y + 0.02, 0.04), zl = 0.12 + 0.001, txt = [];
    txt.push([[x - 0.36, y - 0.3, zl], [x - 0.36, y + 0.02, zl]].map(Rr));
    for (let j = 0; j < 4; j++) txt.push([[x - 0.18 + j * 0.14, y - 0.3, zl], [x - 0.18 + j * 0.14, y + (j === 3 ? 0.1 : 0.34), zl]].map(Rr));
    deco(p, topS, 1, { lines: txt, tone: 0.36 });
    deco(p, fall, 1, { lines: txt, tone: 0.42 });
    
    fall.dyn = t => { const a = p.arrivals ? p.arrivals(t + 0.32) : { n: 60, f: 1 }; const u = a.f * 0.9 / 0.75; if (u >= 1) return null; return { dz: 0.7 * (1 - easeOut(u)), a: smooth(u / 0.3) }; };
    add(p, cuboid(x + wx / 2 - t1, y - wy / 2, 0.05, t1, wy, hw));
    add(p, cuboid(x - wx / 2 + t1, y + wy / 2 - t1, 0.05, wx - 2 * t1, t1, hw));
    
    const [cx, cy] = clockAt, cz = 1.12, r = 0.36;
    add(p, cuboid(cx - 0.18, cy - 0.18, 0, 0.36, 0.36, 0.05));
    add(p, cuboid(cx - 0.05, cy - 0.05, 0.05, 0.1, 0.1, cz - r - 0.03));
    const face = add(p, drumX(cx, cy, cz, r, 0.12));
    const fx = cx + 0.06 + 0.002, hand = (th, len) => [[fx, cy, cz], [fx, cy - MIR * len * Math.sin(th), cz + len * Math.cos(th)]];   
    const ticks = []; for (let k = 0; k < 12; k++) { const th = k / 12 * 2 * Math.PI, a = k % 3 ? 0.84 : 0.74; ticks.push([[fx, cy - MIR * r * a * Math.sin(th), cz + r * a * Math.cos(th)], [fx, cy - MIR * r * 0.92 * Math.sin(th), cz + r * 0.92 * Math.cos(th)]]); }
    deco(p, face, face.n, { lines: ticks, tone: 0.5 });
    const turn = t => { if (STILL || t < T_FLOW || !p.arrivals) return 2 / 12; const u = (t - T_FLOW - (p.lag || 0)) / OUT.per; return u - Math.floor(u); };
    deco(p, face, face.n, { tone: 0.88, w: 1.3, fn: t => { const m = turn(t), h = 10 / 12 + m / 12; return [hand(h * 2 * Math.PI, r * 0.5), hand(m * 2 * Math.PI, r * 0.74)]; } });
    deco(p, face, face.n, { r: 1.3, tone: 0.9, dots: () => [[[fx, cy, cz], 1]] });
    p.anchor = [x, y, 0.42]; p.anchors = [[x, y, 0.42], [cx, cy, cz + r]]; return p;
  }

  let ws;
  const pipe = (pts, from, to) => { const r = route(pts); r.from = from; r.to = to; pipes.push(r); return r; };
  if (!compact && window.ISO_NOMATCH !== false) {   
    
    
    
    const G = 1.4, G1 = +(Q.get('g1') || 1.8), gx = +(Q.get('gx') || 3.6), wx = gx + 0.12 + G1 + WR, mdx = wx + WR + G + 0.65,   
     _g = 0, sx = mdx + 0.65 + 0.75, ox = sx + 1.8;
    const yB = 2.45, yM = 5.0, yF = 7.55, L1 = 4.4, L3 = 5.6, yD = 3.6, yO = +(Q.get('yo') || 8.1), cS = 1, oxO = ox;   
    const eE = 0.62, eD = 0.7, eF = 0.52, bx = 2.2;
    exportsAt(0, yB); dbAt(0, yM); filesAt(0, yF);
    gateAt(gx, [L1, yM, L3]);
    ws = warehouseAt(wx, yM);
    modelAt(mdx, yM);
    dashAt(ox, yD); outboxAt(oxO, yO, [oxO - 0.25, yO + 1.3 * cS]);
    routes.exports = route([[eE, yB], [bx, yB], [bx, L1], [wx, L1]]);
    routes.db = route([[eD, yM], [wx, yM]]);
    routes.files = route([[eF, yF], [bx, yF], [bx, L3], [wx, L3]]);
    routes.dash = route([[wx, yM], [sx, yM], [sx, yD], [ox, yD]]);
    routes.outbox = route([[wx, yM], [sx, yM], [sx, yO], [oxO, yO]]);
    pipe([[eE, yB], [bx, yB], [bx, L1], [gx, L1]], 'exports', 'check'); pipe([[gx, L1], [wx - 0.9, L1]], 'check', 'warehouse');
    pipe([[eD, yM], [gx, yM]], 'db', 'check'); pipe([[gx, yM], [wx - 0.9, yM]], 'check', 'warehouse');
    pipe([[eF, yF], [bx, yF], [bx, L3], [gx, L3]], 'files', 'check'); pipe([[gx, L3], [wx - 0.9, L3]], 'check', 'warehouse');
    pipe([[wx, yM], [mdx, yM]], 'warehouse', 'model');
    pipe([[mdx, yM], [sx, yM], [sx, yD], [ox - 0.5, yD]], 'model', 'dash'); pipe([[mdx, yM], [sx, yM], [sx, yO], [oxO - 0.7, yO]], 'model', 'outbox');
    UPS = { check: ['exports', 'db', 'files'], warehouse: ['check'], model: ['warehouse'], dash: ['model'], outbox: ['model'] };
  } else if (!compact && window.ISO_ALIGN !== false) {   
    
    const yB = 2.6, yM = 5.0, yF = 7.4, gx = 3.3, L1 = 4.4, L3 = 5.6, jx = 4.95,   
     _u = 0, wx = 8.0, mdx = 10.7, sx = 12.1, ox = 13.9, yD = 3.6, yO = 7.5, cS = 1, oxO = ox;
    const eE = 0.62, eD = 0.7, eF = 0.52, bx = 2.2;   
    exportsAt(0, yB); dbAt(0, yM); filesAt(0, yF);
    gateAt(gx, [L1, yM, L3]);
    matchAt(jx, yM);
    ws = warehouseAt(wx, yM);
    modelAt(mdx, yM);
    dashAt(ox, yD); outboxAt(oxO, yO, [oxO - 0.25, yO + 1.3 * cS]);
        routes.exports = route([[eE, yB], [bx, yB], [bx, L1], [jx, L1], [jx, yM], [wx, yM]]);
    routes.db = route([[eD, yM], [wx, yM]]);
    routes.files = route([[eF, yF], [bx, yF], [bx, L3], [jx, L3], [jx, yM], [wx, yM]]);
    routes.dash = route([[wx, yM], [sx, yM], [sx, yD], [ox, yD]]);
    routes.outbox = route([[wx, yM], [sx, yM], [sx, yO], [oxO, yO]]);
    pipe([[eE, yB], [bx, yB], [bx, L1], [gx, L1]], 'exports', 'check'); pipe([[gx, L1], [jx, L1]], 'check', 'match');
    pipe([[eD, yM], [gx, yM]], 'db', 'check'); pipe([[gx, yM], [jx, yM]], 'check', 'match');
    pipe([[eF, yF], [bx, yF], [bx, L3], [gx, L3]], 'files', 'check'); pipe([[gx, L3], [jx, L3]], 'check', 'match');
    pipe([[jx, yM], [wx, yM]], 'match', 'warehouse'); pipe([[wx, yM], [mdx, yM]], 'warehouse', 'model');
    pipe([[mdx, yM], [sx, yM], [sx, yD], [ox - 0.5, yD]], 'model', 'dash'); pipe([[mdx, yM], [sx, yM], [sx, yO], [oxO - 0.7, yO]], 'model', 'outbox');
    UPS = { check: ['exports', 'db', 'files'], match: ['check'], warehouse: ['match'], model: ['warehouse'], dash: ['model'], outbox: ['model'] };
  } else if (!compact) {
    const yB = 2.6, yM = 5.0, yF = 7.4, gx = 3.7, L1 = 4.4, L3 = 5.6, jx = 5.5, wx = 8.0, mdx = 10.7, sx = 12.1, ox = 13.9, yD = 3.6, yO = 7.5, cS = 1, oxO = ox;
    exportsAt(0, yB); dbAt(0.6, yM); filesAt(1.55, yF);
    gateAt(gx, [L1, yM, L3]);
    matchAt(jx, yM);
    ws = warehouseAt(wx, yM);
    modelAt(mdx, yM);
    dashAt(ox, yD); outboxAt(oxO, yO, [oxO - 0.25, yO + 1.3 * cS]);
    routes.exports = route([[0.62, yB], [2.2, yB], [2.2, L1], [jx, L1], [jx, yM], [wx, yM]]);
    routes.db = route([[1.3, yM], [wx, yM]]);
    routes.files = route([[2.07, yF], [2.75, yF], [2.75, L3], [jx, L3], [jx, yM], [wx, yM]]);
    routes.dash = route([[wx, yM], [sx, yM], [sx, yD], [ox, yD]]);
    routes.outbox = route([[wx, yM], [sx, yM], [sx, yO], [oxO, yO]]);
    pipe([[0.62, yB], [2.2, yB], [2.2, L1], [gx, L1]], 'exports', 'check'); pipe([[gx, L1], [jx, L1]], 'check', 'match');
    pipe([[1.3, yM], [gx, yM]], 'db', 'check'); pipe([[gx, yM], [jx, yM]], 'check', 'match');
    pipe([[2.07, yF], [2.75, yF], [2.75, L3], [gx, L3]], 'files', 'check'); pipe([[gx, L3], [jx, L3]], 'check', 'match');
    pipe([[jx, yM], [wx, yM]], 'match', 'warehouse'); pipe([[wx, yM], [mdx, yM]], 'warehouse', 'model');
    pipe([[mdx, yM], [sx, yM], [sx, yD], [ox - 0.5, yD]], 'model', 'dash'); pipe([[mdx, yM], [sx, yM], [sx, yO], [oxO - 0.7, yO]], 'model', 'outbox');
    UPS = { check: ['exports', 'db', 'files'], match: ['check'], warehouse: ['match'], model: ['warehouse'], dash: ['model'], outbox: ['model'] };
  } else {
    const yB = 3.0, yF = 5.2, gx = 2.9, L1 = 3.8, L2 = 4.4, wx = 5.6, yM = 4.1, mdx = 8.4, sx = 9.9, ox = 11.5, yD = 2.9, yO = 5.4;
    exportsAt(0, yB); filesAt(0.7, yF);
    gateAt(gx, [L1, L2]);
    ws = warehouseAt(wx, yM);
    modelAt(mdx, yM);
    dashAt(ox, yD); outboxAt(ox, yO, [ox - 0.25, yO + 1.3]);
    routes.exports = route([[0.62, yB], [1.9, yB], [1.9, L1], [wx, L1]]);
    routes.files = route([[1.22, yF], [2.1, yF], [2.1, L2], [wx, L2]]);
    routes.dash = route([[wx, yM], [sx, yM], [sx, yD], [ox, yD]]);
    routes.outbox = route([[wx, yM], [sx, yM], [sx, yO], [ox, yO]]);
    pipe([[0.62, yB], [1.9, yB], [1.9, L1], [gx, L1]], 'exports', 'check'); pipe([[gx, L1], [wx - 0.9, L1]], 'check', 'warehouse');
    pipe([[1.22, yF], [2.1, yF], [2.1, L2], [gx, L2]], 'files', 'check'); pipe([[gx, L2], [wx - 0.9, L2]], 'check', 'warehouse');
    pipe([[wx, yM], [mdx, yM]], 'warehouse', 'model');
    pipe([[mdx, yM], [sx, yM], [sx, yD], [ox - 0.5, yD]], 'model', 'dash'); pipe([[mdx, yM], [sx, yM], [sx, yO], [ox - 0.7, yO]], 'model', 'outbox');
    UPS = { check: ['exports', 'files'], warehouse: ['check'], model: ['warehouse'], dash: ['model'], outbox: ['model'] };
  }
  
  for (const q of parts) {
    const P = []; for (const so of q.prims) for (const v of so.v) P.push([v[0], v[1]]);
    const h = hull(P), cx = h.reduce((a, v) => a + v[0], 0) / h.length, cy = h.reduce((a, v) => a + v[1], 0) / h.length;
    const zt = Math.max(...q.prims.map(so => so.zmax)), off = 0.1 + 0.06 * zt;
    q.shadow = h.map(([x, y]) => [cx + (x - cx) * 1.06 + off, cy + (y - cy) * 1.06 + off]);
  }
  return { parts, pipes, routes, ws };
}


const T_DRAW = 2.5;                 
const T_FLOW = 2.35;                
const SPEED = 1.55;                 

const SRC = { exports: { per: 3.4, ph: 0.0, bad: k => k % 4 === 1 }, db: { per: 3.4, ph: 1.15, bad: () => false }, files: { per: 3.4, ph: 2.3, bad: k => k % 5 === 3 } };
const OUT = { per: 3.6, ph: { dash: 0.3, outbox: 2.1 } };
const STOP = 1.5, FADE = 0.55;      


const AZ0 = (window.ISO_VIEW && window.ISO_VIEW.az != null) ? window.ISO_VIEW.az : 42, EL0 = (window.ISO_VIEW && window.ISO_VIEW.el != null) ? window.ISO_VIEW.el : 30;   
let az = AZ0, el = EL0, R = [0, 0, 0], U = [0, 0, 0], F = [0, 0, 0];
function setView(a, e) {
  az = a; el = e; const A = a * Math.PI / 180, E = e * Math.PI / 180;
  R = [Math.sin(A), -Math.cos(A), 0];
  U = [-Math.sin(E) * Math.cos(A), -Math.sin(E) * Math.sin(A), Math.cos(E)];
  F = [Math.cos(E) * Math.cos(A), Math.cos(E) * Math.sin(A), Math.sin(E)];
}
let PIV = [0, 0, 0], S = 30, OX = 0, OY = 0;
const pjx = (x, y, z) => OX + MIR * S * ((x - PIV[0]) * R[0] + (y - PIV[1]) * R[1]);
const pjy = (x, y, z) => OY - S * ((x - PIV[0]) * U[0] + (y - PIV[1]) * U[1] + (z - PIV[2]) * U[2]);
const dep = (x, y, z) => (x - PIV[0]) * F[0] + (y - PIV[1]) * F[1] + (z - PIV[2]) * F[2];


let W = 1, H = 1, DPR = 1, NARROW = false, COMPACT = false, M = null, FR = [0, 0, 1, 1];
let labs = [], keys = [], OBST = [];

function obstacles(cr0) {
  const out = [], add = r => { if (r.width > 0 && r.height > 0) out.push([r.left - cr0.left, r.top - cr0.top, r.right - cr0.left, r.bottom - cr0.top]); };
  
  const cx2 = document.createElement('canvas').getContext('2d');
  const glyphs = el => { if (!el) return; const rg = document.createRange(); rg.selectNodeContents(el);
    cx2.font = getComputedStyle(el).font; const t = cx2.measureText(el.textContent || ''), fa = t.fontBoundingBoxAscent, fd = t.fontBoundingBoxDescent;
    for (const r of rg.getClientRects()) { if (!fa) { add(r); continue; } const o = r.top + (r.height - fa - fd) / 2 + fa, top = o - t.actualBoundingBoxAscent, bot = o + t.actualBoundingBoxDescent;
      add({ left: r.left, right: r.right, width: r.width, top: Math.max(r.top, top), bottom: Math.min(r.bottom, bot), height: Math.min(r.bottom, bot) - Math.max(r.top, top) }); } };
  $('name').querySelectorAll('span').forEach(glyphs);
  glyphs(document.querySelector('.roleline') || $('lead'));
  glyphs(document.querySelector('.htitle p'));   
  
  for (const b of [...($('actions') ? $('actions').children : []), $('cue')]) if (b) add(b.getBoundingClientRect());
  document.querySelectorAll('.top-wrap .who, .top-wrap nav').forEach(e => add(e.getBoundingClientRect()));
  if (LOWN && !CAPR && $('isocap')) add($('isocap').getBoundingClientRect());
  return out;
}
const hitRect = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
function polyHitsRect(P, r) {   
  if (P.length < 3) return false;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  if (x1 < r[0] || x0 > r[2] || y1 < r[1] || y0 > r[3]) return false;
  const C = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], nx = a[1] - b[1], ny = b[0] - a[0];
    let pmin = Infinity, pmax = -Infinity, cmin = Infinity, cmax = -Infinity;
    for (const p of P) { const d = p[0] * nx + p[1] * ny; pmin = Math.min(pmin, d); pmax = Math.max(pmax, d); }
    for (const c of C) { const d = c[0] * nx + c[1] * ny; cmin = Math.min(cmin, d); cmax = Math.max(cmax, d); }
    if (cmax < pmin || cmin > pmax) return false;
  }
  return true;
}
function measure() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  NARROW = innerWidth <= 1100;
  const compact = innerWidth < 760;
  if (!M || compact !== COMPACT) { COMPACT = compact; M = build(COMPACT); timing(); makeDom(); }
  labs.forEach(l => { l._w = l.offsetWidth; l._h = l.offsetHeight; });
  
  
  if (innerWidth > 1100) { const tw = document.querySelector('.top-wrap'), hh = tw ? Math.max(0, heroEl.getBoundingClientRect().top - tw.getBoundingClientRect().top) : 0; boxEl.style.top = -hh + 'px'; boxEl.dataset.up = hh; }
  else { boxEl.style.top = ''; boxEl.dataset.up = 0; }
  W = boxEl.clientWidth;
  const cr0 = boxEl.getBoundingClientRect();
  const rel = el => { const r = el.getBoundingClientRect(); return { l: r.left - cr0.left, r: r.right - cr0.left, t: r.top - cr0.top, b: r.bottom - cr0.top }; };
  
  setView(AZ0, EL0); S = 1; OX = 0; OY = 0;
  let c = [0, 0, 0], nc = 0;
  for (const p of M.parts) for (const s of p.prims) for (const v of s.v) { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; nc++; }
  PIV = [c[0] / nc, c[1] / nc, 0.6];
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const pts = M.parts.map(() => []);
  for (const a of [AZ0 - 3, AZ0 + 3, AZ0]) {   
    setView(a, EL0);
    M.parts.forEach((p, i) => { for (const s of p.prims) for (const v of s.v) { const X = pjx(v[0], v[1], v[2]), Y = pjy(v[0], v[1], v[2]); pts[i].push([X, Y]); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } });
  }
  M.parts.forEach((p, i) => { p.uHull = hull(pts[i]); p.upAs = p.upAs || (p.anchors || [p.anchor]).map(a => a.slice()); p.uAs = p.upAs.map(a => [pjx(...a), pjy(...a)]); });   
  
  setView(AZ0, EL0);
  for (const p of M.parts) { let best = null, by = -Infinity; for (const so of p.prims) for (const v of so.v) { const yv = pjy(...v); if (yv > by + 1e-6) { by = yv; best = v; } } p.downA = best.slice(); p.uDown = [pjx(...best), by]; }
  const m = clamp(innerWidth * 0.032, 20, 64);
  const LAB = 46;   
  if (NARROW) {
    const wAvail = W - 2 * m;
    S = clamp(wAvail / (x1 - x0), 10, 48);
    H = Math.round((y1 - y0) * S + LAB + (COMPACT ? 14 : 22));
    if (Math.abs(boxEl.clientHeight - H) > 1) boxEl.style.setProperty('--isoph', H + 'px');
    FR = [m, 0, W - m, H]; OBST = [];
    OX = m + (wAvail - (x1 - x0) * S) / 2 - x0 * S;   
    OY = LAB - y0 * S;
  } else {
    H = boxEl.clientHeight;
    OBST = obstacles(cr0);
    const ac = rel($('actions') || $('cue') || $('name')), cap = rel($('isocap')), hero = rel(heroEl), nm = rel($('name'));
    const gap = clamp(W * 0.034, 44, 78);
    const zone = OBST.map(r => [r[0] - gap, r[1] - gap * 0.6, r[2] + gap, r[3] + gap * 0.6]);
    
    const twB = (tw => tw ? tw.getBoundingClientRect().bottom - cr0.top : 0)(document.querySelector('.top-wrap'));
    const topL = window.ISO_TOPL || (Q.has('underbar') ? Math.max(14, Math.round(twB) + 8) : 14), botL = (LOWN && !CAPR ? boxEl.clientHeight - 14 : cap.t - 12), rightL = W - m - 6, leftL = m + 6;   
    
    let n0 = Infinity, n1 = -Infinity; $('name').querySelectorAll('span').forEach(sp => { const rg = document.createRange(); rg.selectNodeContents(sp); for (const r of rg.getClientRects()) { n0 = Math.min(n0, r.top - cr0.top); n1 = Math.max(n1, r.bottom - cr0.top); } });
    
    
    const midName = (topL + LAB + botL) / 2;
    FR = [leftL, topL, rightL, botL];
    
    
    
    const place = (s, shift = 0) => {
      const gh = (y1 - y0) * s, lo = topL + LAB, hi2 = botL - gh;
      if (hi2 < lo) return false;
      const mid = clamp(midName - gh / 2, lo, hi2), tops = [mid];
      for (let d = 8; d <= hi2 - lo + 8; d += 8) { if (mid - d >= lo) tops.push(mid - d); if (mid + d <= hi2) tops.push(mid + d); }
      for (const top of tops) if (fits(s, shift, top)) return true;
      return false;
    };
    const fits = (s, shift, top) => {
      S = s; OX = (AR ? leftL - x0 * s : rightL - x1 * s) + shift;
      OY = top - y0 * s;
      for (const p of M.parts) { const P = p.uHull.map(q => [OX + q[0] * s, OY + q[1] * s]); for (const z of zone) if (polyHitsRect(P, z)) return false; }
      
      const cxU = (x0 + x1) / 2;
      for (let i = 0; i < M.parts.length; i++) { const a = M.parts[i].uAs[0], ax = OX + a[0] * s, ay = OY + a[1] * s, w = labs[i]._w || 70, h = labs[i]._h || 14, top = ay - 6 - LEADER;
        const toName = AR ? a[0] > cxU : a[0] < cxU; if (!toName) continue;
        const box = AR ? [ax + 2, top - h / 2 - 4, ax + 8 + w + 5, top + h / 2 + 4] : [ax - 8 - w - 5, top - h / 2 - 4, ax - 2, top + h / 2 + 4];
        for (const r of OBST) if (overlap(box, [r[0] - 34, r[1] - 14, r[2] + 34, r[3] + 14]) > 0) return false; }
      return (y1 - y0) * s + LAB <= botL - topL;
    };
    let lo = 14, hi = 120;   
    if (!place(lo)) lo = 10;
    for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (place(mid)) lo = mid; else hi = mid; }
    
    let tEdge = AR ? Infinity : -Infinity;
    for (const el of [...$('name').querySelectorAll('span'), document.querySelector('.roleline') || $('lead'), document.querySelector('.htitle p'), ...($('actions') ? $('actions').children : []), $('cue')].filter(Boolean)) {
      const rg = document.createRange(); rg.selectNodeContents(el); for (const r of rg.getClientRects()) tEdge = AR ? Math.min(tEdge, r.left - cr0.left) : Math.max(tEdge, r.right - cr0.left); }
    const wPl = (x1 - x0) * lo, spare = AR ? (rightL - (leftL + wPl)) - (W - tEdge - leftL) - gap : (rightL - wPl) - tEdge - gap;
    let sh = 0;
    if (isFinite(tEdge) && spare > 12) { let a = 0, b = spare / 2; for (let i = 0; i < 12; i++) { const mid = (a + b) / 2; if (place(lo, AR ? mid : -mid)) a = mid; else b = mid; } sh = AR ? a : -a; }
    
    
    const HX = new URLSearchParams(location.search).get('hx') || '0';   
    if (HX !== '0') {
      if (!AR) { const t = HX === 'l' ? leftL - (rightL - wPl) : (W - wPl) / 2 - (rightL - wPl); for (let d = t; d < sh; d += 6) if (place(lo, d)) { sh = d; break; } }
      else { const t = HX === 'l' ? (rightL - wPl) - leftL : (W - wPl) / 2 - leftL; for (let d = t; d > sh; d -= 6) if (place(lo, d)) { sh = d; break; } }
    }
    place(lo, sh);
  }
  solveLabels();
  
  
  if (NARROW) for (let k = 0; k < 6; k++) {
    setView(AZ0, EL0); let over = 0;
    M.parts.forEach((p, i) => { const X = pjx(...p.anchor), w = labs[i]._w || 70, sd = p.side || 'r', l = sd === 'c' ? X - w / 2 : sd === 'l' ? X - 10 - w : X + 10; over = Math.max(over, l + w - (W - 6), 6 - l); });
    if (over <= 0.5) break;
    const wAvail = W - 2 * m; S = S * Math.max(0.6, (wAvail - 2 * over - 4) / wAvail);
    H = Math.round((y1 - y0) * S + LAB + (COMPACT ? 14 : 22)); if (Math.abs(boxEl.clientHeight - H) > 1) boxEl.style.setProperty('--isoph', H + 'px');
    FR = [m, 0, W - m, H]; OX = m + (wAvail - (x1 - x0) * S) / 2 - x0 * S; OY = LAB - y0 * S;
    solveLabels();
  }
  canvas.width = Math.round(W * DPR); canvas.height = Math.round((NARROW ? H : boxEl.clientHeight) * DPR);
  H = canvas.height / DPR;
  layoutKeys();
  CH.mode = {};   
  
  if (cardFor) {
    if (NARROW) { if (cardEl.parentNode !== slotIn) slotIn.appendChild(cardEl); cardEl.style.transform = ''; slotEl.classList.add('open'); }
    else { if (cardEl.parentNode !== boxEl) boxEl.appendChild(cardEl); slotEl.classList.remove('open'); cardEl._replace = true; }   
  } else slotEl.classList.remove('open');
}


const LEADER = 30;
let HDRB = 0;
function solveLabels() {
  { const tw = document.querySelector('.top-wrap'); HDRB = tw && !NARROW ? tw.getBoundingClientRect().bottom - boxEl.getBoundingClientRect().top : 0; }
  const hulls = M.parts.map(p => p.uHull.map(q => [OX + q[0] * S, OY + q[1] * S]));
  const placed = [];
  setView(AZ0, EL0);
  const rails = []; for (const r of M.pipes) for (let s = 0; s <= r.L; s += 0.12) { const q = at(r, s); rails.push([pjx(q[0], q[1], 0), pjy(q[0], q[1], 0)]); }
  const order = M.parts.map((p, i) => i).sort((a, b) => M.parts[a].uAs[0][1] - M.parts[b].uAs[0][1]);
  let cxP = 0; { let lo = Infinity, hi = -Infinity; for (const P of hulls) for (const q of P) { lo = Math.min(lo, q[0]); hi = Math.max(hi, q[0]); } cxP = (lo + hi) / 2; }
  for (const i of order) {
    const p = M.parts[i], w = labs[i]._w || 60, h = labs[i]._h || 14;
    let best = null, bestCost = Infinity;
    
    
    const ow = (OX + p.uAs[0][0] * S) < cxP ? 'l' : 'r', out = [ow, ow === 'l' ? 'r' : 'l'];
    
    
    const ne = notes[p.id], nw = ne ? (ne.offsetWidth || 90) : 0;
    const cands = [];
    for (let ai = 0; ai < p.uAs.length; ai++) cands.push([p.uAs[ai], ai, -1]);
    if (p.id === 'match') cands.push([p.uDown, -1, 1]);   
    for (const [ua, ai, dir] of cands) for (const lead of [LEADER, LEADER * 1.8, LEADER * 2.5]) for (const side of out) {
      const ax = OX + ua[0] * S, ay = OY + ua[1] * S;
      const top = ay + dir * (6 + lead);
      const box = side === 'c' ? [ax - w / 2 - 5, top - 6 - h - 3, ax + w / 2 + 5, top - 2]
        : side === 'l' ? [ax - 8 - w - 5, top - h / 2 - 4, ax - 2, top + h / 2 + 4] : [ax + 2, top - h / 2 - 4, ax + 8 + w + 5, top + h / 2 + 4];
      let cost = (lead > LEADER * 2 ? 9 : lead > LEADER ? 4 : 0) + (side === ow ? 0 : 0.9) + Math.max(0, ai) * 0.2 + (dir > 0 ? (p.id === 'match' ? -6 : 40) : 0);   
      const mg = clamp(innerWidth * 0.032, 20, 64) - 4;
      if (box[0] < mg || box[2] > W - mg) cost += 60;   
      if (p.id === 'dash' && lead === LEADER) cost += 50;   
      if (p.id === 'outbox' && side !== 'l') cost += 50;   
      const air = [box[0] - 6, box[1] - 4, box[2] + 6, box[3] + 4];
      hulls.forEach(P => { if (polyHitsRect(P, air)) cost += 5000; });   
      const air2 = [box[0] - 16, box[1] - 10, box[2] + 16, box[3] + 10];
      hulls.forEach((P, j) => { if (j !== i && polyHitsRect(P, air2)) cost += 14; });   
      for (let k = 1; k <= 4; k++) { const yy = ay + dir * (6 + lead * k / 4); hulls.forEach((P, j) => { if (j !== i && P.length > 2 && inHull(P, ax, yy, 0)) cost += 12; }); }
      const nb = !nw ? null : side === 'l' ? [box[0] - 12 - nw, box[1], box[0] - 2, box[3]] : [box[2] + 2, box[1], box[2] + 12 + nw, box[3]];
      if (nb) {
        hulls.forEach(P => { if (polyHitsRect(P, nb)) cost += 40; });
        for (const q of placed) cost += overlap(nb, q) * 0.5;
        for (const r of OBST) cost += overlap(nb, [r[0] - 20, r[1] - 10, r[2] + 20, r[3] + 10]) * 0.5;
        if (nb[0] < 20 || nb[2] > W - 20) cost += 30;
      }
      for (const q of placed) cost += overlap(box, q) * 0.5;
      for (const [rx, ry] of rails) if (hitRect(air, rx, ry)) cost += 30;   
      for (const r of OBST) cost += overlap(box, [r[0] - 36, r[1] - 16, r[2] + 36, r[3] + 16]) * 0.5;   
      if (box[1] < 2) cost += 40;
      if (!NARROW && box[1] < HDRB - 18) cost += 35;   
      if (cost < bestCost) { bestCost = cost; best = { lead, box, ai, side, dir, nb }; }
    }
    p.lead = best.lead; p.side = best.side; p.dir = best.dir; p.anchor = best.dir > 0 ? p.downA : p.upAs[best.ai]; placed.push(best.box); if (best.nb) placed.push(best.nb);
  }
}


function timing() {
  setView(AZ0, EL0); PIV = [0, 0, 0]; S = 1; OX = 0; OY = 0;
  const sxOf = p => { let a = 0, n = 0; for (const s of p.prims) { a += X0(s.c[0], s.c[1]); n++; } return a / n; };
  let lo = Infinity, hi = -Infinity; for (const p of M.parts) { p.sx = sxOf(p); lo = Math.min(lo, p.sx); hi = Math.max(hi, p.sx); }
  const wave = sx => 0.12 + 1.45 * clamp((sx - lo) / (hi - lo), -0.1, 1.1);
  M.wave = wave;
  for (const p of M.parts) {
    p.t0 = wave(p.sx);
    const zt = Math.max(...p.prims.map(s => s.zmax)) || 1;
    p.prims.forEach((s, i) => { s.t0 = p.t0 + 0.16 * (s.zmin / zt) + 0.02 * i; });
    
    
    const tLast = Math.max(...p.prims.map(s => s.t0));
    for (const d of p.decor) d.t0 = d.face === -1 ? Math.max((d.s ? d.s.t0 : p.t0) + 0.42, tLast + 0.55) : (d.s ? d.s.t0 : p.t0) + 0.42;
  }
  for (const r of M.pipes) {
    const a = r.p[0], b = r.p[r.p.length - 1];
    r.t0 = wave(X0(a[0], a[1])) + 0.1; r.t1 = Math.max(r.t0 + 0.45, wave(X0(b[0], b[1])) + 0.15);
  }
  
  const arr = (rt, per, ph) => { const lag = ph + rt.L / SPEED, n0 = Math.floor(-lag / per);
    return t => { if (STILL || t < T_FLOW) return { n: n0 + 60, f: 1 };
      const n = Math.floor((t - T_FLOW - lag) / per), ta = T_FLOW + lag + n * per;
      return { n: n + 60, f: ta < T_FLOW ? 1 : (t - ta) / 0.9 }; }; };
  for (const p of M.parts) {
    if (p.id === 'dash') p.arrivals = arr(M.routes.dash, OUT.per, OUT.ph.dash);
    if (p.id === 'outbox') { p.arrivals = arr(M.routes.outbox, OUT.per, OUT.ph.outbox); p.lag = OUT.ph.outbox + M.routes.outbox.L / SPEED - 0.32; }
  }
}


function makeDom() {
  labelsEl.textContent = ''; keysEl.textContent = '';
  labs = M.parts.map(p => { const e = document.createElement('div'); e.className = 'lab iso-lab'; e.textContent = p.label; labelsEl.appendChild(e); return e; });
  notes = {};
  for (const p of M.parts) if (CT.notes[p.id]) { const e = document.createElement('div'); e.className = 'iso-note'; e.innerHTML = `<span><i aria-hidden="true">✓</i>${esc(AD(CT.notes[p.id]))}</span>`; labelsEl.appendChild(e); notes[p.id] = e; }
  chainStages();
  keys = M.parts.map(p => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = p.label + ': ' + p.text; b.setAttribute('aria-label', p.label + '. ' + p.text);
    b.addEventListener('focus', () => { focusId = p.id; wake(); });
    b.addEventListener('blur', () => { if (focusId === p.id) focusId = null; wake(); });
    b.addEventListener('click', () => { togglePin(p.id); wake(); });
    keysEl.appendChild(b); return b;
  });
  canvas.setAttribute('aria-label', ARIA);
}
function layoutKeys() {
  if (!M) return;
  const hr = heroEl.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
  frameHulls();
  M.parts.forEach((p, i) => { const b = p.bb; if (!b) return; const k = keys[i];
    k.style.transform = `translate(${(b[0] + cr.left - hr.left - 6).toFixed(1)}px, ${(b[1] + cr.top - hr.top - 6).toFixed(1)}px)`;
    k.style.width = (b[2] - b[0] + 12).toFixed(1) + 'px'; k.style.height = (b[3] - b[1] + 12).toFixed(1) + 'px'; });
}


const STEP = 0.34, HOLD = 3.0;   
const CH = { t0: T_DRAW + 0.35, stages: [], end: 0, cancel: false, rm0: 0, mode: {} };
function chainStages() {
  const have = new Set(M.parts.map(p => p.id));
  CH.stages = [['exports', 'db', 'files'], ['check'], ['match'], ['warehouse'], ['model'], ['dash'], ['outbox']].map(s => s.filter(id => have.has(id))).filter(s => s.length);
  
  CH.step = 6 * STEP / Math.max(1, CH.stages.length - 1); CH.end = (CH.stages.length - 1) * CH.step; CH.mode = {};
}


function chainClock(t) { if (STILL) return PIC || !CH.rm0 ? -1 : now() - CH.rm0; return t - CH.t0; }
function chainAt(t) {
  if (!M) return null;
  
  
  const c = CH.skip ? CH.end + HOLD + 1 : chainClock(t);
  if (c < 0) return null;
  
  
  
  
  if (c > CH.end + HOLD && Q.has('quiet')) return { c, k: CH.stages.length - 1, reached: new Set(['dash']), since: { dash: 9 }, head: new Set(), on: true, quiet: true };
  const k = Math.min(CH.stages.length - 1, Math.floor(c / CH.step + 1e-6)), reached = new Set(), since = {};
  CH.stages.slice(0, k + 1).forEach((s, j) => s.forEach(id => { reached.add(id); since[id] = c - j * CH.step; }));
  return { c, k, reached, since, head: new Set(CH.stages[k]), on: true };
}
const chainRest = () => CH.t0 + CH.end + HOLD + 0.5;   



const cardEl = document.createElement('div'); cardEl.className = 'isocard'; cardEl.setAttribute('aria-hidden', 'true');
const slotEl = document.createElement('div'); slotEl.className = 'isoslot'; const slotIn = document.createElement('div'); slotIn.className = 'isoslot-in'; slotEl.appendChild(slotIn);
boxEl.after(slotEl);
let cardFor = null, cardT = [], hideT = 0, hidePend = false, notes = {};
function playCard() {
  cardT.forEach(clearTimeout); cardT = [];
  cardEl.querySelectorAll('[data-a]').forEach(e => e.dataset.a.split('|').forEach(s => { const [ms, c] = s.split(':'); if (RM) e.classList.add(c); else cardT.push(setTimeout(() => e.classList.add(c), +ms)); }));
}
function showCard(id, lit, keep = false) {
  clearTimeout(hideT); hidePend = false;
  const rideNow = CARDPTR && !NARROW && PTR && id === hoverId;
  if (id === cardFor && (!rideNow || cardEl._ptr)) return;
  const wasRiding = rideOn && cardEl._ptr && cardEl.classList.contains('on');
  cardFor = id; cardEl._lit = lit;
  const p = M.parts.find(q => q.id === id); if (!p) return;
  cardT.forEach(clearTimeout); cardT = [];
  if (!wasRiding) cardEl.classList.remove('on'); cardEl.classList.toggle('rm', RM);
  cardEl.innerHTML = cardHtml(p); cardEl.dataset.part = id;
  if (NARROW) { if (cardEl.parentNode !== slotIn) slotIn.appendChild(cardEl); cardEl.style.transform = ''; slotEl.classList.add('open'); }
  else { if (cardEl.parentNode !== boxEl) boxEl.appendChild(cardEl); slotEl.classList.remove('open');
    
    if (rideNow) { cardEl._p = p;
      
      if (!wasRiding) { cardEl.style.transition = 'none'; cardEl.style.opacity = '0'; void cardEl.offsetWidth; cardEl.style.transition = ''; cardEl.style.opacity = ''; rideOn = false; rideXY = null; }
      ride(true); }
    else { const up = keep && usePre(cardEl, id); if (up) syncCards(); else placeCard(p, lit); } }
  void cardEl.offsetWidth; cardEl.classList.add('on'); playCard();
}
function hideCard(now_) {
  if (!cardFor) return;
  const go = () => { hidePend = false; cardFor = null; cardEl._pinFor = null; cardEl._hold = false; cardEl.classList.remove('on'); slotEl.classList.remove('open'); cardT.forEach(clearTimeout); cardT = []; };
  if (now_) { clearTimeout(hideT); go(); } else if (!hidePend) { hidePend = true; hideT = setTimeout(go, 140); }   
}


const card2El = document.createElement('div'); card2El.className = 'isocard'; card2El.setAttribute('aria-hidden', 'true');
let card2For = null, card2T = [];
function showCard2(id, keep = false) {
  if (id === card2For) return;
  const p = M.parts.find(q => q.id === id); if (!p) return;
  card2For = id; card2T.forEach(clearTimeout); card2T = [];
  card2El.classList.remove('on'); card2El.classList.toggle('rm', RM);
  card2El.innerHTML = cardHtml(p); card2El.dataset.part = id;
  if (card2El.parentNode !== boxEl) boxEl.appendChild(card2El);
  const up2 = keep && usePre(card2El, id); if (up2) syncCards(); else placeCard(p, new Set(M.parts.map(q => q.id)), card2El, [cardEl]);
  void card2El.offsetWidth; card2El.classList.add('on');
  card2El.querySelectorAll('[data-a]').forEach(e => e.dataset.a.split('|').forEach(s => { const [ms, c] = s.split(':'); if (RM) e.classList.add(c); else card2T.push(setTimeout(() => e.classList.add(c), +ms + 250)); }));
}




function anchorOf(p) {
  if (!p.c3) { const n = p.prims.length; p.c3 = p.prims.reduce((a, q) => [a[0] + q.c[0] / n, a[1] + q.c[1] / n, a[2] + q.c[2] / n], [0, 0, 0]); }
  return [pjx(p.c3[0], p.c3[1], p.c3[2]), pjy(p.c3[0], p.c3[1], p.c3[2])];
}
function syncCards() {
  if (NARROW) return;
  for (const el of [cardEl, card2El]) {
    if (!el._p || !el.classList.contains('on') || el._bx == null || el._ptr) continue;
    const a = anchorOf(el._p), x = el._bx + a[0] - el._a[0], y = el._by + a[1] - el._a[1];
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  }
}


function arrangeCards(lit, id1 = cardFor, id2 = card2For) {
  const q = M.parts.find(x => x.id === id1), q2 = M.parts.find(x => x.id === id2); if (!q || !q2) return;
  const pad = e => [e._bx - 22, e._by - 16, e._bx + e.offsetWidth + 22, e._by + e.offsetHeight + 16];
  for (let it = 0; it < 4; it++) {
    
    placeCard(q, lit, cardEl, [], it === 0); placeCard(q2, lit, card2El, [cardEl], it === 0); swapIfCrossed(q, q2);
    NOTE_AVOID = [pad(cardEl), pad(card2El)];
    CH.mode = {}; chooseNotes();
    let bad = false;
    M.parts.forEach((p, i) => { const e = notes[p.id]; if (!e || !p._lab) return;
      const [x, y] = noteBox(p, i, CH.mode[p.id] || 'out'); e.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`; e._x = x; e._y = y;
      const R0 = [x, y, x + e.offsetWidth, y + e.offsetHeight]; if (NOTE_AVOID.some(r => overlap(R0, r) > 0)) bad = true; });
    if (!bad) break;
  }
}


function* prearrangeSteps() {   
  const all = new Set(M.parts.map(q => q.id)), pd = M.parts.find(q => q.id === 'dash'), po = M.parts.find(q => q.id === 'outbox');
  if (!pd || !po) return;
  for (const [el, p] of [[cardEl, pd], [card2El, po]]) { if (!el.classList.contains('on') || el.dataset.part !== p.id) { el.innerHTML = cardHtml(p); el.dataset.part = p.id; } if (el.parentNode !== boxEl) boxEl.appendChild(el); }
  yield;
  CH.mode = {}; chooseNotes(); yield;
  
  
  const iD = M.parts.indexOf(pd), iO = M.parts.indexOf(po), mg = clamp(innerWidth * 0.032, 20, 64);
  const row = (p, i) => { const L = p._lab, e = notes[p.id], r = [L[0], L[1], L[0] + L[2], L[1] + L[3]];
    if (e) { const [x, y] = noteBox(p, i, 'out'); r[0] = Math.min(r[0], x); r[1] = Math.min(r[1], y); r[2] = Math.max(r[2], x + e.offsetWidth); r[3] = Math.max(r[3], y + e.offsetHeight); }
    return r; };
  const cap = (() => { const c = $('isocap'), r0 = boxEl.getBoundingClientRect(); return c ? c.getBoundingClientRect().top - r0.top : boxEl.clientHeight; })();
  const tw = document.querySelector('.top-wrap'), hdr = tw ? tw.getBoundingClientRect().bottom - boxEl.getBoundingClientRect().top : 0;
  const set = (el, p, x, y) => { el._bx = x; el._by = y; el._p = p; el._a = anchorOf(p); el.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
  frameHulls();
  
  
  const why = [];
  const txtR = () => { const out = []; M.parts.forEach((q, i) => { if (q._lab) out.push([q._lab[0] - 5, q._lab[1] - 4, q._lab[0] + q._lab[2] + 5, q._lab[1] + q._lab[3] + 4]);
    const e = notes[q.id]; if (e && q._lab && FIN(q.id)) { const [x, y] = noteBox(q, i, CH.mode[q.id] || 'out'); out.push([x - 10, y - 8, x + e.offsetWidth + 10, y + e.offsetHeight + 8]); } }); return out; };
  const free = (R, other) => {
    if (R[0] < mg - 2 || R[2] > W - mg + 2 || R[1] < 60 || R[3] > cap - 8) { why.push(['box', R.map(Math.round), mg, W, cap]); return false; }
    const inf = q => [q[0] - 12, q[1] - 10, q[2] + 12, q[3] + 10];
    { const o = OBST.find(o => overlap(R, inf(o)) > 0); if (o) { why.push(['obst', R.map(Math.round), o.map(Math.round)]); return false; } }
    { const q = M.parts.find(q => q.hull && polyHitsRect(q.hull, inf(R))); if (q) { why.push(['hull', q.id]); return false; } }
    if (M.parts.some((q, i) => { if (q._lab && overlap(inf(R), [q._lab[0], q._lab[1], q._lab[0] + q._lab[2], q._lab[1] + q._lab[3]]) > 0) { why.push(['lab', q.id]); return true; }
      const e = notes[q.id]; if (!e || !q._lab || !FIN(q.id)) return false;   
      const [x, y] = noteBox(q, i, CH.mode[q.id] || 'out'); const hit = overlap(inf(R), [x, y, x + e.offsetWidth, y + e.offsetHeight]) > 0; if (hit) why.push(['note', q.id, [x, y, x + e.offsetWidth, y + e.offsetHeight].map(Math.round)]); return hit; })) return false;
    if (other && other._bx != null && overlap(inf(R), [other._bx, other._by, other._bx + other.offsetWidth, other._by + other.offsetHeight]) > 0) return false;
    return true; };
  { const r = row(pd, iD), cw = cardEl.offsetWidth, chh = cardEl.offsetHeight;
    const x = AR ? mg : W - mg - cw, y = Math.min(r[1], pd.bb[1]) - 34 - chh;   
    
    const top = 100, cx2 = AR ? mg : W - mg - cw;
    const tries = [[x, y], [cx2, top], [cx2, top + 20]];
    const ok = tries.find(([tx, ty]) => free([tx, ty, tx + cw, ty + chh]));
    if (ok) set(cardEl, pd, ok[0], ok[1]); else placeCard(pd, all, cardEl, [], false, txtR(), true); }
  yield;
  { const r = row(po, iO), cw = card2El.offsetWidth, chh = card2El.offsetHeight;
    const ob = po.bb, x = (AR ? Math.max(ob[2], r[2]) + 26 : Math.min(ob[0], r[0]) - 26 - cw),   
      _y0 = 0, y = Math.min((ob[1] + ob[3]) / 2 - chh / 2, cap - 10 - chh);   
    
    const top = 100, cx1 = AR ? W - mg - cw : mg;
    const tries = [[x, y], [cx1, top], [cx1, top + 20], [cx1, top + 40]];
    const ok = tries.find(([tx, ty]) => free([tx, ty, tx + cw, ty + chh], cardEl));
    if (ok) set(card2El, po, ok[0], ok[1]); else placeCard(po, all, card2El, [cardEl], false, txtR(), true); }
  const pad = e => [e._bx - 22, e._by - 16, e._bx + e.offsetWidth + 22, e._by + e.offsetHeight + 16];
  NOTE_AVOID = [pad(cardEl), pad(card2El)]; CH.mode = {}; chooseNotes(); yield;
  CH.prePos = {}; for (const el of [cardEl, card2El]) CH.prePos[el.dataset.part] = { bx: el._bx, by: el._by, a: el._a, p: el._p };
  CH.preModes = { ...CH.mode }; CH.preAvoid = NOTE_AVOID;
  
  for (const el of [cardEl, card2El]) { if (el.classList.contains('on')) { const f = el === cardEl ? cardFor : card2For; if (f && f !== el.dataset.part) { el.innerHTML = cardHtml(M.parts.find(q => q.id === f)); el.dataset.part = f; } usePre(el, f); } else el.innerHTML = ''; }
}
function usePre(el, id) {
  const q = CH.prePos && CH.prePos[id]; if (!q || q.bx == null) return false;
  el._bx = q.bx; el._by = q.by; el._a = q.a; el._p = q.p; return true;
}
function swapIfCrossed(p1, p2) {
  const r0 = boxEl.getBoundingClientRect(), c = e => { const r = e.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; };
  const m = p => [(p.bb[0] + p.bb[2]) / 2, (p.bb[1] + p.bb[3]) / 2], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const a = c(cardEl), b = c(card2El), A = m(p1), B = m(p2);
  if (d(a, B) + d(b, A) + 40 < d(a, A) + d(b, B)) {
    const t1 = cardEl.style.transform, t2 = card2El.style.transform, h1 = cardEl.offsetHeight, h2 = card2El.offsetHeight;
    const y = tr => +tr.match(/,\s*(-?[\d.]+)px/)[1], x = tr => +tr.match(/\((-?[\d.]+)px/)[1];
    
    const lim = (yy, h) => Math.max(8, Math.min(yy, boxEl.clientHeight - h - 10));
    const b1 = [x(t2), lim(y(t2), h1)], b2 = [x(t1), lim(y(t1), h2)], A1 = anchorOf(p1), A2 = anchorOf(p2);
    cardEl._bx = b1[0]; cardEl._by = b1[1]; cardEl._a = A1; card2El._bx = b2[0]; card2El._by = b2[1]; card2El._a = A2;
    cardEl.style.transform = `translate(${b1[0]}px, ${b1[1]}px)`; card2El.style.transform = `translate(${b2[0]}px, ${b2[1]}px)`;
  }
}
function hideCard2() { if (!card2For) return; card2For = null; card2El.classList.remove('on'); card2T.forEach(clearTimeout); card2T = []; }



const SIDE = AR ? { exports: 'lr', db: 'r', files: 'r', check: 'D', model: 'D', outbox: 'r', warehouse: 'D', match: 'D' } : { exports: 'rl', db: 'l', files: 'l', check: 'D', model: 'D', outbox: 'l', warehouse: 'D', match: 'D' };   
function placeCard(p, lit, el = cardEl, avoid = [], noNotes = false, hardR = [], fast = false) {
  frameHulls();
  const cw = el.offsetWidth, chh = el.offsetHeight, cr0 = boxEl.getBoundingClientRect();
  const rel = r => [r.left - cr0.left, r.top - cr0.top, r.right - cr0.left, r.bottom - cr0.top];
  const mg = clamp(innerWidth * 0.032, 20, 64);
  const tw = document.querySelector('.top-wrap'), hdrB = tw ? rel(tw.getBoundingClientRect())[3] : 0;
  const cap = rel($('isocap').getBoundingClientRect());
  
  const navB = (() => { const n = document.querySelector('.top nav, .top-wrap nav'); return n ? n.getBoundingClientRect().bottom - cr0.top : hdrB; })();
  const yMin = Math.max(8, Math.min(hdrB, navB) + 10), yMax = Math.min(boxEl.clientHeight, cap[1]) - 10 - chh;
  const hard = OBST.map(r => [r[0] - 22, r[1] - 18, r[2] + 22, r[3] + 18]).concat([[cap[0] - 10, cap[1] - 10, cap[2] + 10, cap[3]]]).concat(avoid.map(e => { const q = rel(e.getBoundingClientRect()); return [q[0] - 16, q[1] - 16, q[2] + 16, q[3] + 16]; })).concat(hardR);
  const litH = [], soft = [], litR = [], softR = [], noteR = [];
  M.parts.forEach((q, i) => {
    (lit.has(q.id) ? litH : soft).push(q.hull);
    const lr = labs[i].getBoundingClientRect(); if (lr.width && +labs[i].style.opacity > 0.05) (lit.has(q.id) ? litR : softR).push(rel(lr));
  });
  if (!noNotes) { const lo = labelsEl.getBoundingClientRect(), ox = lo.left - cr0.left, oy = lo.top - cr0.top;
    M.parts.forEach((q, i) => { const e = notes[q.id]; if (!e || !q._lab) return;
      if (!fast) { if (e.classList.contains('on')) litR.push(rel(e.getBoundingClientRect())); return; }   
      if (!FIN(q.id)) return;   
      if (CH.mode[q.id]) { const [x, y] = noteBox(q, i, CH.mode[q.id]); noteR.push([x + ox - 8, y + oy - 6, x + ox + e.offsetWidth + 8, y + oy + e.offsetHeight + 6]); }
      else if (e.classList.contains('on')) { const r = rel(e.getBoundingClientRect()); noteR.push([r[0] - 8, r[1] - 6, r[2] + 8, r[3] + 6]); } }); }
  const rails = [];
  for (const r of M.pipes) if (lit.has(r.from) && lit.has(r.to)) for (let s = 0; s <= r.L; s += 0.15) { const q = at(r, s); rails.push([pjx(q[0], q[1], 0), pjy(q[0], q[1], 0)]); }
  const b = p.bb, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  let best = null, bc = Infinity;
  
  
  const bbOf = P => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const q of P) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } return [x0, y0, x1, y1]; };
  const litB = litH.map(bbOf), softB = soft.map(bbOf);
  const costAt = (x, y) => {
    const R0 = [x, y, x + cw, y + chh], Rp = [x - 14, y - 14, x + cw + 14, y + chh + 14];
    for (const r of hard) if (overlap(R0, r) > 0) return Infinity;
    let c = 0;
    litH.forEach((P, k) => { if (overlap(Rp, litB[k]) > 0 && polyHitsRect(P, Rp)) c += 1e5; });
    for (const r of litR) if (overlap(Rp, r) > 0) c += 1e5;
    for (const r of noteR) if (overlap(R0, r) > 0) c += 3e4;   
    const Rr = [x - 8, y - 8, x + cw + 8, y + chh + 8];
    for (const [rx, ry] of rails) if (hitRect(Rr, rx, ry)) { c += 5e4; break; }
    soft.forEach((P, k) => { if (overlap(R0, softB[k]) > 0 && polyHitsRect(P, R0)) c += 900; });
    for (const r of softR) c += overlap(R0, r) * 2;
    
    const want = SIDE[p.id];
    if (want === 'D') {   
      const mx = x + cw / 2 - cx, my = y + chh / 2 - cy, sx = AR ? 1 : -1;
      if (!(sx * mx > 0 && my > 0 && y >= cy)) c += 4000;
      c += 12 * Math.abs(sx * mx - my);
    } else if (want) { const okR = x >= b[2] - 12, okL = x + cw <= b[0] + 12, okB = y >= b[3] - 12, okA = y + chh <= b[1] + 12;
      if (!((want.includes('r') && okR) || (want.includes('l') && okL) || (want.includes('b') && okB) || (want.includes('a') && okA))) c += 4000;
    }
    
    
    if (want !== 'D') { const L = x + cw <= b[0] + 12, Rt = x >= b[2] - 12;
      c += (L || Rt) ? 12 * Math.abs(y + chh / 2 - cy) : 12 * Math.abs(x + cw / 2 - cx); }
    if (p.id === 'exports') { const gap = AR ? x - b[2] : b[0] - (x + cw); if (gap >= -12 && gap < 130) c += 40 * (130 - gap); }   
    const dx = Math.max(b[0] - (x + cw), x - b[2], 0), dy = Math.max(b[1] - (y + chh), y - b[3], 0);
    return c + 4 * Math.hypot(dx, dy) + 0.15 * Math.hypot(x + cw / 2 - cx, y + chh / 2 - cy);   
  };
  const yHi = Math.max(yMin, yMax), xHi = W - mg - cw;
  
  const st = fast ? 30 : 10;
  for (let y = yMin; y <= yHi; y += st) for (let x = mg; x <= xHi; x += st) { const c = costAt(x, y); if (c < bc) { bc = c; best = [x, y]; } }
  if (best && fast) { const [bx0, by0] = best;
    for (let y = Math.max(yMin, by0 - 30); y <= Math.min(yHi, by0 + 30); y += 6) for (let x = Math.max(mg, bx0 - 30); x <= Math.min(xHi, bx0 + 30); x += 6) { const c = costAt(x, y); if (c < bc) { bc = c; best = [x, y]; } } }
  if (!best) best = [W - mg - cw, yMin];
  el.style.transform = `translate(${best[0]}px, ${best[1]}px)`;
  el.dataset.cost = Math.round(bc);
  el._bx = best[0]; el._by = best[1]; el._p = p; el._a = anchorOf(p);   
}

function noteBox(p, i, mode) {
  const L = p._lab; if (!L) return null;
  if (mode.includes('@')) { const [m, d] = mode.split('@'), q = noteBox(p, i, m); return [q[0], q[1] + +d]; }   
  const e = notes[p.id], nw = e._w || e.offsetWidth, nh = e._h || e.offsetHeight, [lx, ly, w, h, sd] = L;
  const right = sd === 'l' ? lx + w : lx;
  if (mode === 'out') return sd === 'l' ? [lx - 12 - nw, ly + (h - nh) / 2] : [lx + w + 12, ly + (h - nh) / 2];
  if (mode === 'in') return sd === 'l' ? [lx + w + 20, ly + (h - nh) / 2] : [lx - 20 - nw, ly + (h - nh) / 2];   
  if (mode === 'below') return [sd === 'l' ? right - nw : lx, ly + h + 5];
  if (mode === 'outup' || mode === 'outdn') { const [x, y] = noteBox(p, i, 'out'); return [x, y + (mode === 'outup' ? -(nh + 6) : nh + 6)]; }
  return [sd === 'l' ? right - nw : lx, ly - nh - 5];
}
let NOTE_AVOID = [];   
function chooseNotes() {
  const taken = [];
  M.parts.forEach((p, i) => { const L = p._lab; if (L) { const r = [L[0], L[1], L[0] + L[2], L[1] + L[3]]; r.own = p.id; taken.push(r); } });
  const leads = M.parts.filter(p => p._ld).map(p => { const r = [p._ld[0] - 3, p._ld[1] - 3, p._ld[0] + 3, p._ld[2]]; r.own = p.id; return r; });
  const MODES = ['out', 'below', 'above', 'outup', 'outdn', 'in'];
  for (const m of ['out', 'in']) for (let d = -14; d <= 14; d += 2) if (d) MODES.push(m + '@' + d);
  const mg = clamp(innerWidth * 0.032, 20, 64) - 4;
  const ordIdx = M.parts.map((p, i) => i).sort((a, b) => (FIN(M.parts[b].id) ? 1 : 0) - (FIN(M.parts[a].id) ? 1 : 0));
  ordIdx.forEach(i => { const p = M.parts[i];
    const e = notes[p.id]; if (!e || !p._lab) return;
    e._w = e.offsetWidth; e._h = e.offsetHeight;
    let best = 'out', bc = Infinity;
    
    MODES.forEach((m, k) => {
      const [x, y] = noteBox(p, i, m), R0 = [x - 1, y - 1, x + e._w + 1, y + e._h + 1];
      let c = k < 6 ? k * 6 : 4 + 2.5 * Math.abs(+m.split('@')[1]) + (m.startsWith('in') ? 30 : 0);
      if ((p.id === 'outbox' || p.id === 'dash') && m !== 'out') c += 400;
      
      for (const q of M.parts) if (q.hull && polyHitsRect(q.hull, R0)) { let n = 0; for (let a = 0; a < 7; a++) for (let b = 0; b < 3; b++) if (inHull(q.hull, R0[0] + (R0[2] - R0[0]) * a / 6, R0[1] + (R0[3] - R0[1]) * b / 2, 0)) n++; c += 600 + 3000 * n / 21; }   
      for (const r of OBST) if (overlap(R0, [r[0] - 16, r[1] - 10, r[2] + 16, r[3] + 10]) > 0) c += 5000;
      for (const r of taken) if (r.own !== p.id && overlap(R0, [r[0] - 4, r[1] - 1, r[2] + 4, r[3] + 1]) > 0) c += 800 + overlap(R0, r) * 10;   
      for (const r of leads) if (r.own !== p.id && overlap(R0, r) > 0) c += 300;   
      if (R0[0] < mg || R0[2] > W - mg || R0[1] < 2) c += 2000;
      for (const r of NOTE_AVOID) if (overlap(R0, r) > 0) c += 6000;
      if (c < bc) { bc = c; best = m; }
    });
    CH.mode[p.id] = best; const [x, y] = noteBox(p, i, best); taken.push([x, y, x + e._w, y + e._h]);
  });
}


let hoverId = null, focusId = Q.get('lit') || null, pinId = null, pinBoth = false;


const FIN = x => x === 'dash' || x === 'outbox', OTHER = x => x === 'dash' ? 'outbox' : 'dash';
function togglePin(id) {
  if (!id) { pinId = null; pinBoth = false; return; }
  if (pinBoth && FIN(id)) { pinBoth = false; pinId = OTHER(id); return; }
  if (pinId && FIN(pinId) && FIN(id) && id !== pinId) { pinBoth = true; return; }
  pinBoth = false; pinId = pinId === id ? null : id;
}

const activeId = () => focusId || (CARDPTR && pinId ? pinId : (hoverId || pinId));
let dimAmt = 0;
const orbit = { a: 0, e: 0, va: 0, ve: 0, drag: null };


const DUR = 0.34;
function project(s, t) {
  let dx = 0, dy = 0, dz = 0, alpha = 1;
  if (s.dyn) { const d = s.dyn(t); if (!d) { s.hidden = true; return; } dz = d.dz; alpha = d.a; }
  s.hidden = alpha <= 0.003; s.alpha = alpha;
  const v = s.v;
  for (let i = 0; i < v.length; i++) { s.sx[i] = pjx(v[i][0] + dx, v[i][1] + dy, v[i][2] + dz); s.sy[i] = pjy(v[i][0] + dx, v[i][1] + dy, v[i][2] + dz); }
  for (let f = 0; f < s.faces.length; f++) { const n = s.faces[f].n; s.front[f] = (n[0] * F[0] + n[1] * F[1] + n[2] * F[2]) > 1e-4 ? 1 : 0; }
  s.depth = dep(s.c[0], s.c[1], s.c[2] + dz);
  s.dz = dz;
}

function shade(n, lit) {
  const base = n[2] > 0.5 ? 0.066 : n[2] < -0.5 ? 0.01 : 0.022 + 0.02 * clamp(0.5 + 0.5 * (n[1] * 0.85 - n[0] * 0.25), 0, 1);
  return lit > 0 ? mixc(mixc(BG, INK, base), mixc(BG, ACC, base * 1.9), lit) : mixc(BG, INK, base);
}
function fillSolid(s, a, lit) {
  if (a <= 0.004) return;
  ctx.globalAlpha = a * s.alpha;
  const X = s.sx, Y = s.sy;
  if (s.kind === 'cyl') {
    const n = s.n, fr = s.front;
    let st = -1; for (let i = 0; i < n; i++) if (fr[i] && !fr[(i + n - 1) % n]) { st = i; break; }
    if (st >= 0) {
      ctx.beginPath(); let i = st, cnt = 0; ctx.moveTo(X[i], Y[i]);
      while (fr[i] && cnt < n) { i = (i + 1) % n; ctx.lineTo(X[i], Y[i]); cnt++; }
      for (let k = 0; k <= cnt; k++) { const j = (st + cnt - k) % n; ctx.lineTo(X[n + j], Y[n + j]); }
      ctx.closePath(); ctx.fillStyle = rgb(shade([0.3, 0.7, 0], lit)); ctx.fill();
    }
    for (const f of [n, n + 1]) if (fr[f]) { const I = s.faces[f].i; ctx.beginPath(); ctx.moveTo(X[I[0]], Y[I[0]]); for (let k = 1; k < I.length; k++) ctx.lineTo(X[I[k]], Y[I[k]]); ctx.closePath(); ctx.fillStyle = rgb(shade(s.faces[f].n, lit)); ctx.fill(); }
  } else {
    for (let f = 0; f < s.faces.length; f++) if (s.front[f]) {
      const I = s.faces[f].i; ctx.beginPath(); ctx.moveTo(X[I[0]], Y[I[0]]); for (let k = 1; k < I.length; k++) ctx.lineTo(X[I[k]], Y[I[k]]); ctx.closePath();
      ctx.fillStyle = rgb(shade(s.faces[f].n, lit)); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function strokeSolid(s, t, col, colIn) {
  const X = s.sx, Y = s.sy, fr = s.front, span = Math.max(1e-6, s.zmax - s.zmin);
  const out = new Path2D(), inn = new Path2D(); let any = false;
  for (const e of s.edges) {
    const f1 = fr[e.f1], f2 = e.f2 >= 0 ? fr[e.f2] : 0, sil = f1 !== f2;
    if (!(sil || (f1 && f2 && e.sharp))) continue;
    const z = Math.min(s.v[e.a][2], s.v[e.b][2]);
    const u = STILL ? 1 : clamp((t - s.t0 - e.k - 0.22 * (z - s.zmin) / span) / DUR, 0, 1);
    if (u <= 0) continue;
    const q = easeOut(u), P = sil ? out : inn;
    P.moveTo(X[e.a], Y[e.a]); P.lineTo(X[e.a] + (X[e.b] - X[e.a]) * q, Y[e.a] + (Y[e.b] - Y[e.a]) * q); any = true;
  }
  if (!any) return;
  ctx.globalAlpha = s.alpha;
  ctx.lineWidth = 0.85; ctx.strokeStyle = colIn; ctx.stroke(inn);
  ctx.lineWidth = 1.25; ctx.strokeStyle = col; ctx.stroke(out);
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}
function polyPart(pts, u) {   
  const P = pts.map(p => [pjx(p[0], p[1], p[2]), pjy(p[0], p[1], p[2])]);
  if (u >= 1) return P;
  let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(l); L += l; }
  let left = L * u; const out = [P[0]];
  for (let i = 1; i < P.length && left > 0; i++) { if (seg[i - 1] <= left) { out.push(P[i]); left -= seg[i - 1]; } else { const f = left / seg[i - 1]; out.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]); left = 0; } }
  return out;
}
function drawDecor(d, t, litMix, dim, bo) {
  if (d.face >= 0 && !d.s.front[d.face]) return;
  if (d.s.hidden) return;
  const u = STILL ? 1 : clamp((t - d.t0) / 0.5, 0, 1);
  if (u <= 0) return;
  if (d.draw) { if (u >= 1) d.draw(t, litMix, dim); return; }
  const tone = Math.min(1, d.tone * (1 - 0.5 * dim) + (d.boost ? 0.3 * (bo || 0) : 0));
  const dz = d.s.dz || 0;
  if (dz || d.s.alpha < 1) { ctx.save(); ctx.globalAlpha = d.s.alpha; ctx.translate(0, -dz * S * U[2]); }
  const col = rgb(mixc(ink(tone), ACC, litMix * 0.9));
  if (d.lines || d.fn) {
    const L = d.lines || d.fn(t);
    ctx.lineWidth = d.w; ctx.strokeStyle = col;
    if (d.dash) { ctx.setLineDash(d.dash); ctx.lineDashOffset = d.flow && !STILL ? -t * 6 : 0; }
    ctx.beginPath();
    for (const line of L) { const P = polyPart(line, u); if (P.length < 2) continue; ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); }
    ctx.stroke(); if (d.dash) ctx.setLineDash([]); ctx.lineWidth = 1;
  }
  if (dz || d.s.alpha < 1) ctx.restore();
  if (d.dots) {
    for (const [p, b] of d.dots(t)) {
      const X = pjx(p[0], p[1], p[2]), Y = pjy(p[0], p[1], p[2]);
      ctx.beginPath(); ctx.arc(X, Y, d.r * (S / 40 + 0.4), 0, Math.PI * 2);
      ctx.fillStyle = rgb(mixc(ink(lerp(0.3, 0.95, b) * (1 - 0.5 * dim)), ACC, litMix * 0.9), u); ctx.fill();
    }
  }
}

const X0 = (x, y) => (x - y) * Math.SQRT1_2;   


const RAIL = 0.1;
function drawPipe(r, t, dim) {
  const u = STILL ? 1 : clamp((t - r.t0) / (r.t1 - r.t0), 0, 1);
  if (u <= 0) return;
  
  if ((r.pl || 0) > 0.05 && !STILL && u >= 1) {
    ctx.save(); ctx.setLineDash([2.5, 7]); ctx.lineDashOffset = -t * 26; ctx.strokeStyle = rgb(ACC, 0.85 * r.pl); ctx.lineWidth = 1.3;
    ctx.beginPath(); r.p.forEach((q, i) => { const X = pjx(q[0], q[1], 0), Y = pjy(q[0], q[1], 0); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore();
  }
  const q = easeOut(u), sEnd = r.L * q, P = r.p, cum = r.cum, pl = r.pl || 0;
  ctx.strokeStyle = rgb(mixc(ink(0.3 * (1 - 0.45 * dim * (1 - pl))), ACC, 0.7 * pl)); ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    for (let i = 0; i < P.length; i++) {
      if (cum[i] > sEnd) {   
        const f = (sEnd - cum[i - 1]) / (cum[i] - cum[i - 1]), x = P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, y = P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f;
        const [nx, ny] = nrm(P, i - 1); ctx.lineTo(pjx(x + nx * RAIL * side, y + ny * RAIL * side, 0), pjy(x + nx * RAIL * side, y + ny * RAIL * side, 0)); break;
      }
      const [nx, ny] = nrm(P, i), X = pjx(P[i][0] + nx * RAIL * side, P[i][1] + ny * RAIL * side, 0), Y = pjy(P[i][0] + nx * RAIL * side, P[i][1] + ny * RAIL * side, 0);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
}
function nrm(P, i) {
  const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l];
}


function packets(t) {
  const out = [];
  if (STILL || t < T_FLOW - 0.01) return out;
  const fadeIn = smooth((t - T_FLOW) / 0.7);
  const gateX = (M.parts.find(p => p.id === 'check') || {}).gateX;
  for (const id in SRC) {
    const rt = M.routes[id]; if (!rt) continue;
    const { per, ph, bad } = SRC[id];
    if (rt.sG == null) { rt.sG = Infinity; if (gateX != null) for (let s2 = 0; s2 <= rt.L; s2 += 0.02) { if (at(rt, s2)[0] >= gateX - 0.2) { rt.sG = s2; break; } } }
    const sGate = rt.sG;
    const kHi = Math.floor((t - T_FLOW - ph) / per), kLo = Math.ceil((t - T_FLOW - ph - (rt.L / SPEED) - STOP - FADE) / per) - 1;
    for (let k = Math.max(kLo, -40); k <= kHi; k++) {
      const te = T_FLOW + ph + k * per, age = t - te;
      if (age < 0) continue;
      let s = age * SPEED;
      const isBad = bad(k + 40);
      if (isBad && s >= sGate) {
        const d = age - sGate / SPEED; if (d > STOP + FADE) continue;
        out.push({ rt, s: sGate, stop: d, a: fadeIn * (1 - smooth((d - STOP) / FADE)), bad: true });
        continue;
      }
      if (s > rt.L) continue;
      out.push({ rt, s, a: fadeIn, end: rt.L - s });
    }
  }
  for (const id of ['dash', 'outbox']) {
    const rt = M.routes[id]; if (!rt) continue;
    const per = OUT.per, ph = OUT.ph[id];
    const kHi = Math.floor((t - T_FLOW - ph) / per), kLo = Math.ceil((t - T_FLOW - ph - rt.L / SPEED) / per) - 1;
    for (let k = Math.max(kLo, -40); k <= kHi; k++) {
      const age = t - (T_FLOW + ph + k * per); if (age < 0) continue;
      const s = age * SPEED; if (s > rt.L) continue;
      out.push({ rt, s, a: fadeIn, out: true });
    }
  }
  return out;
}
function drawPackets(list, dim) {
  for (const k of list) {
    const x = k.x, y = k.y, X = pjx(x, y, 0.02), Y = pjy(x, y, 0.02);
    if (k.stop != null) {   
      const g = 0.6 + 0.4 * Math.exp(-k.stop * 2.2);
      const R = 16 * g, gr = ctx.createRadialGradient(X, Y, 0, X, Y, R);
      gr.addColorStop(0, rgb(ACC, 0.5 * k.a)); gr.addColorStop(1, rgb(ACC, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgb(mixc(ACC, INK, 0.2), k.a); ctx.beginPath(); ctx.arc(X, Y, 3, 0, Math.PI * 2); ctx.fill();
      if (k.stop < 0.8) { const u = k.stop / 0.8; ctx.strokeStyle = rgb(ACC, 0.7 * (1 - u) * k.a); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(X, Y, 4 + 20 * easeOut(u), (4 + 20 * easeOut(u)) * Math.sin(el * Math.PI / 180), 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
      continue;
    }
    
    const tail = 0.75, n = 8;
    let px = X, py = Y;
    for (let i = 1; i <= n; i++) {
      const [tx, ty] = at(k.rt, k.s - tail * i / n), TX = pjx(tx, ty, 0.02), TY = pjy(tx, ty, 0.02);
      ctx.strokeStyle = rgb(k.out ? ACC : INK, k.a * 0.55 * (1 - i / n) * (1 - 0.4 * dim)); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(TX, TY); ctx.stroke(); px = TX; py = TY;
    }
    const gr = ctx.createRadialGradient(X, Y, 0, X, Y, 7);
    gr.addColorStop(0, rgb(k.out ? ACC : INK, 0.32 * k.a)); gr.addColorStop(1, rgb(k.out ? ACC : INK, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgb(k.out ? mixc(ACC, INK, 0.2) : INK, k.a); ctx.beginPath(); ctx.arc(X, Y, 1.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineWidth = 1;
}


function sAt(rt, x, y) { let best = 0, bd = Infinity; rt.p.forEach((q, i) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = rt.cum[i]; } }); return best; }
function arrivalBoost(t) {
  if (STILL || t < T_FLOW) return {};
  const b = {};
  
  const since = (rt, per, ph, bad, sT) => { const tt = t - T_FLOW - ph - sT / SPEED; const k = Math.floor(tt / per); if (bad && bad(k + 40)) return 9; return tt - k * per; };
  const glow = (dt, tau) => dt < 0 ? 0 : Math.exp(-dt / tau);
  const mt = M.parts.find(p => p.id === 'match'), md = M.parts.find(p => p.id === 'model');
  let w = 0, j = 0;
  for (const id in SRC) { const rt = M.routes[id]; if (!rt) continue;
    w = Math.max(w, glow(since(rt, SRC[id].per, SRC[id].ph, SRC[id].bad, rt.L), 0.35));
    if (mt) { rt.sM = rt.sM != null ? rt.sM : sAt(rt, (mt.upAs || [mt.anchor])[0][0], (mt.upAs || [mt.anchor])[0][1]); j = Math.max(j, glow(since(rt, SRC[id].per, SRC[id].ph, SRC[id].bad, rt.sM), 0.3)); } }
  b.warehouse = w; b.match = j;
  let mo = 0;
  for (const id of ['dash', 'outbox']) { const rt = M.routes[id]; if (!rt) continue;
    b[id] = glow(since(rt, OUT.per, OUT.ph[id], null, rt.L), 0.4);
    if (md) { rt.sM = rt.sM != null ? rt.sM : sAt(rt, (md.upAs || [md.anchor])[0][0], (md.upAs || [md.anchor])[0][1]); mo = Math.max(mo, glow(since(rt, OUT.per, OUT.ph[id], null, rt.sM), 0.35)); } }
  b.model = mo;
  return b;
}

function frameHulls() {   
  for (const p of M.parts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; const pts = [];
    for (const s of p.prims) for (const v of s.v) { const X = pjx(v[0], v[1], v[2]), Y = pjy(v[0], v[1], v[2]); pts.push([X, Y]); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
    p.bb = [x0, y0, x1, y1]; p.hull = hull(pts);
    p.depthC = p.prims.reduce((a, s) => a + dep(s.c[0], s.c[1], s.c[2]), 0) / p.prims.length;
  }
}
function hull(P) {
  P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P[i]) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function inHull(h, x, y, pad) {
  let inside = true;
  for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length]; const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1; if ((ex * (y - a[1]) - ey * (x - a[0])) / l < -pad) { inside = false; break; } }
  return inside;
}


function drawShadows(t) {
  const OFF = 30000;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = Math.max(6, 0.34 * S) * DPR; ctx.shadowOffsetX = OFF * DPR; ctx.shadowOffsetY = 0; ctx.fillStyle = '#000';
  for (const p of M.parts) {
    const u = STILL ? 1 : smooth((t - p.t0 - 0.05) / 0.6); if (u <= 0.01 || !p.shadow) continue;
    ctx.globalAlpha = u;
    ctx.beginPath(); p.shadow.forEach(([x, y], i) => { const X = pjx(x, y, 0) - OFF, Y = pjy(x, y, 0); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
const ancestors = id => { const out = new Set(), st = [id]; while (st.length) { const c = st.pop(); for (const u of (UPS[c] || [])) if (!out.has(u)) { out.add(u); st.push(u); } } return out; };

let FRAMES = 0, lastF = null, frameAct = null;
function frame(t) {
  if (!M) return;
  FRAMES++;
  
  const sway = 0;   
  setView(AZ0 + sway + orbit.a, EL0 + orbit.e);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1;

  const act = activeId(); frameAct = act;
  if (act) { everLit = true; CH.skip = true; }   
  
  
  const ch = act ? null : chainAt(t), chOn = !!(ch && ch.on);
  const path = act ? ancestors(act) : null, onPath = id => act ? (id === act || path.has(id)) : chOn && ch.reached.has(id);
  const BOTH = pinBoth && FIN(act);   
  if (BOTH) { for (const id of ['dash', 'outbox']) { path.add(id); ancestors(id).forEach(x => path.add(x)); } }
  const tr = now(), dtF = lastF == null ? 1 : Math.min(0.1, tr - lastF); lastF = tr;
  const kF = SEEKING ? 1 : 1 - Math.exp(-dtF / 0.055);   
  const ease2 = (v, tg) => { const n = lerp(v || 0, tg, kF); return Math.abs(n - tg) < 0.004 ? tg : n; };
  for (const p of M.parts) {
    p._tl = act ? (p.id === act || (BOTH && FIN(p.id)) ? 1 : 0) : chOn && ch.reached.has(p.id) && (ch.since[p.id] < 0.5 || p.id === 'dash' || p.id === 'outbox') ? 1 : 0;
    p._tp = act ? (path.has(p.id) ? 1 : 0) : chOn && ch.reached.has(p.id) ? 1 : 0;
    p.lit = ease2(p.lit, p._tl); p.pl = ease2(p.pl, p._tp);
  }
  for (const r of M.pipes) { r._tp = onPath(r.from) && onPath(r.to) ? 1 : 0; r.pl = ease2(r.pl, r._tp); }
  const dTarget = act || (chOn && !ch.quiet) ? 1 : 0; dimAmt = ease2(dimAmt, dTarget);
  const boost = arrivalBoost(t);

  
  drawShadows(t);
  for (const r of M.pipes.slice().sort((a, b) => (a.pl || 0) - (b.pl || 0))) drawPipe(r, t, dimAmt);   
  const litP = M.parts.find(p => p.lit > 0.01);
  if (litP) {   
    const b = litP.bb || [0, 0, 0, 0], cx = (b[0] + b[2]) / 2, rr = Math.max(40, (b[2] - b[0]) * 0.75);
    const fy = pjy(...(litP.upAs || [litP.anchor])[0].slice(0, 2), 0);
    ctx.save(); ctx.translate(cx, fy); ctx.scale(1, Math.sin(el * Math.PI / 180));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, rgb(ACC, 0.11 * litP.lit)); g.addColorStop(1, rgb(ACC, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  M.pk = packets(t); let warn = 0; for (const k of M.pk) { const q = at(k.rt, k.s); k.x = q[0]; k.y = q[1]; if (k.stop != null) warn = Math.max(warn, k.a * (1 - smooth((k.stop - 0.9) / 0.8))); }
  drawPackets(M.pk, dimAmt);

  
  for (const p of M.parts) { for (const s of p.prims) project(s, t); p.depthC = p.prims.reduce((a, s) => a + s.depth, 0) / p.prims.length; }
  const order = M.parts.slice().sort((a, b) => a.depthC - b.depthC);
  for (const p of order) {
    const lit = p.lit, pl = p.pl || 0, on = Math.max(lit, pl), dim = dimAmt * (1 - on), bo = (boost[p.id] || 0) * (1 - lit);
    const eTone = lerp(0.84, 0.4, dim) + 0.14 * bo;
    
    const amb = Math.max(lit, 0.72 * pl, p.id === 'check' ? 0.42 * warn * (1 - lit) : 0);
    const col = rgb(mixc(ink(eTone), ACC, amb)), colIn = rgb(mixc(ink(eTone * 0.8), ACC, amb));
    const fillA = STILL ? 1 : smooth((t - p.t0 - 0.1) / 0.5);
    
    const prims = p.prims.slice().sort((a, b) => (a.depth + (a.bias || 0)) - (b.depth + (b.bias || 0)));
    if (lit > 0.01) ctx.shadowColor = rgb(ACC, 0.55 * lit);
    for (const s of prims) {
      if (s.hidden) continue;
      ctx.shadowBlur = 0; fillSolid(s, fillA, Math.max(lit, 0.45 * pl));
      if (lit > 0.01) ctx.shadowBlur = 9 * lit * DPR;
      strokeSolid(s, t, col, colIn);
      ctx.shadowBlur = 0;
      for (const d of p.decor) if (d.s === s) drawDecor(d, t, Math.max(lit, 0.72 * pl), dim, bo);
    }

    ctx.shadowBlur = 0;
  }

  
  const showAll = !COMPACT;
  M.parts.forEach((p, i) => {
    const a = p.anchor, X = pjx(a[0], a[1], a[2]), Y = pjy(a[0], a[1], a[2]);
    const u = STILL ? 1 : clamp((t - p.t0 - 0.35) / 0.45, 0, 1);
    const show = showAll || p.lit > 0.01;
    const lab = labs[i], on = Math.max(p.lit, p.pl || 0);
    const vis = (showAll ? u : p.lit) * (showAll ? 1 - 0.55 * dimAmt * (1 - on) : 1);
    if (u > 0) {   
      const dr = p.dir || -1, top = Y + dr * (6 + p.lead * easeOut(u)), sd = p.side || 'r';
      const lx = sd === 'c' ? X - lab._w / 2 : sd === 'l' ? X - 10 - lab._w : X + 10, ly = sd === 'c' ? (dr > 0 ? top + 6 : top - 6 - lab._h) : top - lab._h / 2 - 0.5;
      p._lab = [lx, ly, lab._w, lab._h, sd]; p._ld = [X, Math.min(top, Y), Math.max(top, Y)];
    }
    if (u > 0 && show) {
      const dr = p.dir || -1, top = Y + dr * (6 + p.lead * easeOut(u));
      ctx.strokeStyle = rgb(mixc(ink(0.4 * (1 - 0.5 * dimAmt * (1 - on))), ACC, Math.max(p.lit, 0.6 * (p.pl || 0)))); ctx.lineWidth = 1;
      const sd = p.side || 'r', tick = sd === 'c' ? 0 : 6 * easeOut(u);
      ctx.beginPath(); ctx.moveTo(X, Y + dr * 5);
      if (tick && p.id === 'match') { const ex = X + (sd === 'l' ? -tick : tick); ctx.arcTo(X, top, ex, top, Math.min(5, tick)); ctx.lineTo(ex, top); }   
      else { ctx.lineTo(X, top); if (tick) ctx.lineTo(X + (sd === 'l' ? -tick : tick), top); }
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(X, Y + dr * 3.5, 1.3, 0, Math.PI * 2); ctx.fill();
      const lx = sd === 'c' ? X - lab._w / 2 : sd === 'l' ? X - 10 - lab._w : X + 10, ly = sd === 'c' ? (dr > 0 ? top + 6 : top - 6 - lab._h) : top - lab._h / 2 - 0.5;
      lab.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
    }
    lab.style.opacity = show ? vis.toFixed(3) : '0';
    lab.classList.toggle('on', p.lit > 0.5 || (chOn && ch.reached.has(p.id)) || (!!act && path.has(p.id)));
  });
  
  
  
  if ((chOn || act) && !Object.keys(CH.mode).length) chooseNotes();
  M.parts.forEach((p, i) => { const e = notes[p.id]; if (!e) return;
    const vis = !NARROW && (chOn ? !ch.quiet && ch.reached.has(p.id) : !!act && (p.id === act || path.has(p.id))) && p._lab && +labs[i].style.opacity > 0.3;
    if (vis) { const [x, y] = noteBox(p, i, CH.mode[p.id] || 'out'); e.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`; e._x = x; e._y = y; }
    e.classList.toggle('on', !!vis); });
  
  
  if (!act && !NARROW && !CH.preDone && M.parts.every(p => !notes[p.id] || p._lab)) { if (!CH.preGen) CH.preGen = prearrangeSteps(); if (CH.preGen.next().done) { CH.preDone = true; CH.pre = true; } }
  if (!act && chOn && CH.pre && CH.preModes && CH.modeIsPair) { CH.mode = { ...CH.preModes }; NOTE_AVOID = CH.preAvoid; CH.modeIsPair = false; if (cardFor) usePre(cardEl, cardFor); if (card2For) usePre(card2El, card2For); }
  if (cardEl._replace && cardFor && !NARROW) { cardEl._replace = false;
    if (!act) { CH.preDone = false; CH.preGen = null; }   
    else if (card2For) arrangeCards(cardEl._lit || new Set(M.parts.map(x => x.id))); else { const q = M.parts.find(x => x.id === cardFor); if (q) placeCard(q, cardEl._lit || new Set()); } }
  
  const restOk = !CARDPTR || (!PTRIN && performance.now() - HOVT > 800);   
  const want = act || (!CARDPTR && restOk && chOn && ch.reached.has('dash') && !(ch.quiet && CH.noRestCard) ? 'dash' : null);   
  if (want) showCard(want, act ? new Set([act, ...path]) : new Set(M.parts.map(q => q.id)), !act);   
  else hideCard();
  const pair = BOTH;
  
  const want2 = NARROW ? null : pair ? (act === 'dash' ? 'outbox' : 'dash') : null;   
  if (want2) { const fresh = card2For !== want2; showCard2(want2, !act); if (fresh && pair) { arrangeCards(new Set([...path])); CH.modeIsPair = true; } } else hideCard2();
  if (act && act !== 'dash' && act !== 'outbox' && CH.preModes) {   }
  
  
  if (chOn && ch.quiet && !act && cardFor === 'dash' && cardEl._bx != null && !cardEl._qfix && !NARROW) {
    cardEl._qfix = true;
    const b0 = boxEl.getBoundingClientRect(), cw = cardEl.offsetWidth, chh = cardEl.offsetHeight, iD = M.parts.findIndex(x => x.id === 'dash');
    const obs = M.parts.map(q => q.bb).concat(labs.filter(e => +e.style.opacity > 0.3).map(e => { const r = e.getBoundingClientRect(); return [r.left - b0.left, r.top - b0.top, r.right - b0.left, r.bottom - b0.top]; }));
    const freeAt = (x, y) => y >= 60 && x >= 8 && x + cw <= boxEl.clientWidth - 8 && !obs.some(o => overlap([x - 10, y - 10, x + cw + 10, y + chh + 10], o) > 0);
    if (!freeAt(cardEl._bx, cardEl._by)) {
      const L = iD >= 0 ? labs[iD].getBoundingClientRect() : null, up = L ? L.top - b0.top - 16 - chh : -1;
      if (L && freeAt(cardEl._bx, up)) { cardEl._by = up; cardEl._a = anchorOf(cardEl._p); }
      else { placeCard(M.parts[iD], new Set(M.parts.map(x => x.id)), cardEl, [], true);
        const d = M.parts[iD].bb, far = Math.hypot(cardEl._bx + cw / 2 - (d[0] + d[2]) / 2, cardEl._by + chh / 2 - (d[1] + d[3]) / 2) > boxEl.clientWidth * 0.3;
        if (!freeAt(cardEl._bx, cardEl._by) || far) CH.noRestCard = true; }   
    }
  }
  syncCards();

  
  
  let sk = chOn ? ch.k : -1; while (sk > 0 && !CH.stages[sk].some(id => CT.notes[id])) sk--;   
  const tipKey = NARROW && chOn ? 'ch' + sk : HINT;
  if (tipFor !== tipKey) {
    tipFor = tipKey;
    if (tipKey === HINT) { tipEl.textContent = HINT; tipEl.classList.remove('on'); }
    else { tipEl.innerHTML = '<b>✓</b> ' + CH.stages[sk].map(id => { const q = M.parts.find(x => x.id === id); return CT.notes[id] ? `${esc(q.label)}: ${esc(AD(CT.notes[id]))}` : esc(q.label); }).join(' · '); tipEl.classList.add('on'); }
  }
  hintTick(t);
}
let tipFor, everLit = false, lastInteract = performance.now() / 1000;
function hintTick(t) {   
  if (activeId()) { tipEl.classList.remove('show'); return; }
  const nowS = performance.now() / 1000;
  
  const rest = CH.cancel ? T_DRAW + 2.5 : chainRest();
  const drawn = PIC ? t >= rest + 1.5 : (STILL ? CH.rm0 > 0 && nowS - Math.max(lastInteract, CH.rm0 + CH.end + HOLD + 0.5) > 1.5 : started && nowS - t0 > rest && nowS - Math.max(lastInteract, t0 + rest) > 1.5);
  tipEl.classList.toggle('show', !everLit && drawn);
}
setInterval(() => { if (M && !PIC) hintTick(0); }, 500);


let ptr = null;
function pick(x, y) {
  frameHulls();
  let best = null;
  for (const p of M.parts) if (p.hull && inHull(p.hull, x, y, 7)) { if (!best || p.depthC > best.depthC) best = p; }
  if (!best && !COMPACT) M.parts.forEach((p, i) => { const r = labs[i].getBoundingClientRect(), c = canvas.getBoundingClientRect(); const lx = r.left - c.left, ly = r.top - c.top; if (x >= lx - 4 && x <= lx + r.width + 4 && y >= ly - 4 && y <= ly + r.height + 4) best = p; });
  return best;
}
const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };


let PTR = null, rideXY = null, rideOn = false, PTRIN = false, HOVT = -1e9;
function ride(force) {
  const put = () => { cardEl.style.transform = `translate3d(${rideXY[0].toFixed(2)}px, ${rideXY[1].toFixed(2)}px, 0)`; };
  
  
  const pos = () => {
    const cr = canvas.getBoundingClientRect(), br = boxEl.getBoundingClientRect(), px = PTR[0] + cr.left - br.left, py = PTR[1] + cr.top - br.top;
    const cw = cardEl.offsetWidth, chh = cardEl.offsetHeight, bw = boxEl.clientWidth, bh = boxEl.clientHeight, OFF = 20;
    let tx = AR ? px - OFF - cw : px + OFF; if (tx + cw > bw - 8 || tx < 8) tx = AR ? px + OFF : px - OFF - cw;
    let ty = py + OFF; if (ty + chh > bh - 8) ty = py - OFF - chh;
    return [clamp(tx, 8, bw - cw - 8), clamp(ty, 8, bh - chh - 8)];
  };
  if (!CARDPTR || NARROW || !PTR) return;
  
  const pinned = !!(pinId && !pinBoth && cardFor === pinId && (force || cardEl.classList.contains('on')));
  if (pinned) { if (cardEl._pinFor !== cardFor) { cardEl._pinFor = cardFor; rideXY = pos(); rideOn = true; cardEl._ptr = true; cardEl._hold = false; put(); } return; }
  if (cardEl._pinFor) { cardEl._pinFor = null; cardEl._hold = hoverId !== cardFor; }   
  if (cardEl._hold) { if (cardFor && hoverId !== cardFor) return; cardEl._hold = false; }
  
  
  const on = PTR && cardFor && (force || cardEl.classList.contains('on')) && (hoverId === cardFor || (rideOn && (hidePend || !hoverId)));
  if (!on) { if (rideOn) { rideOn = false; cardEl._ptr = false; rideXY = null;
    
    setTimeout(() => { if (rideOn || !cardFor || hidePend || !cardEl.classList.contains('on')) return; const p = M.parts.find(q => q.id === cardFor); if (p) { placeCard(p, cardEl._lit); syncCards(); } }, 220); } return; }
  const t = pos();
  if (!rideOn || !rideXY) { rideXY = t; rideOn = true; cardEl._ptr = true; }
  else { rideXY[0] += (t[0] - rideXY[0]) * 0.16; rideXY[1] += (t[1] - rideXY[1]) * 0.16; }
  put();
}
if (CARDPTR) (function loop() { ride(); requestAnimationFrame(loop); })();
const inPlant = (x, y) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of M.parts) if (p.bb) { x0 = Math.min(x0, p.bb[0]); y0 = Math.min(y0, p.bb[1]); x1 = Math.max(x1, p.bb[2]); y1 = Math.max(y1, p.bb[3]); } return x >= x0 - 30 && x <= x1 + 30 && y >= y0 - 50 && y <= y1 + 30; };
const onUi = e => e.target.closest && e.target.closest('a, button, input, .intro, .isocap, .top-wrap, .mpanel, .mbtn');
document.addEventListener('pointermove', e => {
  if (!M || PIC && !Q.has('live')) return;
  const [x, y] = local(e);
  if (orbit.drag && e.pointerId === orbit.drag.id) {
    const d = orbit.drag, dx = x - d.x, dy = y - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    if (d.moved) {
      const rb = (v, lim) => { const a = Math.abs(v); return Math.sign(v) * (a < lim ? a : lim + (a - lim) / (1 + (a - lim) / lim)); };   
      const na = rb(d.a0 + dx * 0.09 * MIR, 14), ne = rb(d.e0 + dy * 0.05, 6), now = performance.now() / 1000, dt = Math.max(1 / 240, now - d.tp);
      orbit.va = (na - orbit.a) / dt; orbit.ve = (ne - orbit.e) / dt; orbit.a = na; orbit.e = ne; d.tp = now;
      heroEl.style.cursor = 'grabbing'; wake(); return;
    }
  }
  if (x >= 0 && y >= 0 && x <= W && y <= H && inPlant(x, y)) lastInteract = performance.now() / 1000;
  if (e.pointerType !== 'mouse') return;
  PTR = [x, y]; const pin_ = inPlant(x, y); if (pin_ !== PTRIN) { PTRIN = pin_; if (!pin_) setTimeout(wake, 850); }
  const p = onUi(e) ? null : pick(x, y);
  const id = p ? p.id : null;
  if (id) HOVT = performance.now(); else if (hoverId) { HOVT = performance.now(); setTimeout(wake, 850); }
  if (id !== hoverId) { hoverId = id; wake(); }
  heroEl.style.cursor = id ? 'pointer' : (inPlant(x, y) && !onUi(e) ? 'grab' : '');
}, { passive: true });
document.addEventListener('pointerdown', e => {
  if (!M || onUi(e) || RM || (PIC && !Q.has('live'))) return;
  const [x, y] = local(e);
  if (x < 0 || y < 0 || x > W || y > H || !inPlant(x, y)) return;
  orbit.drag = { id: e.pointerId, x, y, a0: orbit.a, e0: orbit.e, moved: false, tp: performance.now() / 1000 };
  
  if (e.pointerType === 'mouse') e.preventDefault(); document.documentElement.classList.add('isodrag'); const sel = getSelection(); if (sel) sel.removeAllRanges();
}, { passive: false });
const endDrag = e => {
  const d = orbit.drag; if (!d || e.pointerId !== d.id) return;
  orbit.drag = null; heroEl.style.cursor = ''; document.documentElement.classList.remove('isodrag');
  if (!d.moved && e.type === 'pointerup') {   
    const [x, y] = local(e); const p = pick(x, y);
    togglePin(p ? p.id : null); if (e.pointerType !== 'mouse') hoverId = null;
  }
  wake();
};
document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);




const unpinAt = e => { if (!M || !pinId || orbit.drag) return; if (cardEl && cardEl.contains(e.target)) return; const [x, y] = local(e); if (onUi(e) || x < 0 || y < 0 || x > W || y > H || !pick(x, y)) { pinId = null; pinBoth = false; wake(); } };
let tapAt = null;
document.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') unpinAt(e); else tapAt = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { passive: true });
document.addEventListener('pointerup', e => { if (e.pointerType === 'mouse' || !tapAt) return; const still = Math.hypot(e.clientX - tapAt.x, e.clientY - tapAt.y) < 10 && performance.now() - tapAt.t < 600; tapAt = null; if (still) unpinAt(e); }, { passive: true });
document.addEventListener('pointercancel', () => { tapAt = null; }, { passive: true });
addEventListener('keydown', e => { if (e.key === 'Escape' && (pinId || focusId || hoverId)) { pinId = null; pinBoth = false; hoverId = null; if (document.activeElement && keysEl.contains(document.activeElement)) document.activeElement.blur(); focusId = null; wake(); } });
document.addEventListener('mouseout', e => { if (!e.relatedTarget && hoverId) { hoverId = null; wake(); } });


const now = () => performance.now() / 1000;
let t0 = now(), started = false, running = false, visible = true, last = now(), hiddenAt = 0;
function springs(dt) {   
  if (orbit.drag) return false;
  const w = 2 * Math.PI / 0.55;
  for (const [x, v] of [['a', 'va'], ['e', 've']]) { const acc = -w * w * orbit[x] - 2 * w * orbit[v]; orbit[v] += acc * dt; orbit[x] += orbit[v] * dt; }
  if (Math.abs(orbit.a) + Math.abs(orbit.e) + Math.abs(orbit.va) * 0.05 + Math.abs(orbit.ve) * 0.05 < 0.002) { orbit.a = orbit.e = orbit.va = orbit.ve = 0; return false; }
  return true;
}
function tick() {
  const tn = now(), dt = Math.min(0.05, tn - last); last = tn;
  const moving = springs(dt);
  const t = STILL ? T_DRAW + 0.5 : tn - t0;
  const settling = M && (M.parts.some(p => p.lit !== (p._tl || 0) || (p.pl || 0) !== (p._tp || 0)) || M.pipes.some(r => (r.pl || 0) !== (r._tp || 0)) || dimAmt !== (activeId() || (chainAt(t) || {}).on ? 1 : 0) || activeId() !== frameAct);
  const live = STILL && !PIC && !CH.cancel && CH.rm0 && chainClock(t) < CH.end + HOLD + 1;
  const need = visible && (!STILL || moving || settling || orbit.drag || live);
  if (need) frame(t);
  if (need) requestAnimationFrame(tick); else running = false;
}
function wake() { if (!running && started) { running = true; last = now(); requestAnimationFrame(tick); } else if (!started && PIC) frame(seekT()); }
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {   
  const v = es[0].isIntersecting;
  if (!v && visible) hiddenAt = now(); if (v && !visible && hiddenAt) t0 += now() - hiddenAt;
  visible = v; if (v) wake();
}) : null;
if (io && !SEEKING) io.observe(boxEl);

const seekT = () => STILL ? T_DRAW + 0.5 : (parseFloat(Q.get('t')) || 0);
window.__seek = sec => { frame(sec); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); };
window.__hulls = () => { frameHulls(); const r = canvas.getBoundingClientRect(); return M.parts.map(p => [p.id, (p.hull || []).map(q => [Math.round(q[0] + r.left), Math.round(q[1] + r.top)])]); };
window.__info = () => { frameHulls(); const r = canvas.getBoundingClientRect(); return { parts: M.parts.map(p => p.id), bb: Object.fromEntries(M.parts.map(p => [p.id, p.bb.map((v, i) => Math.round(v + (i % 2 ? r.top : r.left)))])), S, W, H, compact: COMPACT, narrow: NARROW, active: activeId(), orbit: [orbit.a, orbit.e], frames: FRAMES, tip: tipEl.textContent, sw: document.documentElement.scrollWidth, chain: started && !STILL ? +(now() - t0 - CH.t0).toFixed(2) : null, chainEnd: CH.end, card: cardFor, cardRect: cardFor ? (r => [r.left, r.top, r.right, r.bottom].map(Math.round))(cardEl.getBoundingClientRect()) : null, mode: CH.mode, notesOn: Object.keys(notes).filter(k => notes[k].classList.contains('on')) }; };

measure();
const FACE = (window.KIT && KIT.FACE) || '"Mona Sans", sans-serif';
const ready = document.fonts && document.fonts.ready ? Promise.all([document.fonts.ready, document.fonts.load(`500 13px ${FACE}`)]).catch(() => {}) : Promise.resolve();
const helloOut = window.KIT && KIT.hello ? KIT.hello() : Promise.resolve();
const LEAD = 0.5;   
function startLive() { if (started) return; started = true; t0 = now() + LEAD; running = true; last = now(); requestAnimationFrame(tick); }
if (PIC) {
  frame(seekT());
  ready.then(() => { measure(); frame(seekT()); started = Q.has('live'); if (started) { t0 = now() - seekT(); running = true; requestAnimationFrame(tick); } });
} else if (RM) {   
  ready.then(() => { measure(); started = true; frame(T_DRAW + 0.5); CH.rm0 = now() + 0.6; wake(); });
  frame(T_DRAW + 0.5);
} else {
  frame(-1);
  const fontsOr = Promise.race([ready, new Promise(r => setTimeout(r, 1500))]);
  fontsOr.then(() => measure());
  
  
  
  const settled = () => { const mn = document.querySelector('main'), h = document.documentElement.classList;
    return !h.contains('tx-in') && !document.querySelector('.ldc.on') && !document.querySelector('[data-ent]') && !(mn && mn.style.transform); };
  const afterRise = fn => { const go = () => settled() ? fn() : setTimeout(go, 80); go(); };
  Promise.all([fontsOr, Promise.race([helloOut, new Promise(r => setTimeout(r, 4000))])]).then(() => afterRise(() => { measure(); startLive(); }));   
}
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { cardEl._qfix = false; CH.noRestCard = false; measure(); frame(PIC ? seekT() : STILL ? T_DRAW + 0.5 : (started ? now() - t0 : -1)); }, 140); });


if (!RM && !Q.has('flat')) {
  const head = document.querySelector('.head');
  let pend = false;
  const apply = () => { pend = false; if (innerWidth <= 1100) { boxEl.style.transform = ''; boxEl.style.opacity = ''; return; } const y = scrollY, Hh = head ? head.offsetHeight : innerHeight, k = innerWidth < 700 ? 0.5 : 1, u = clamp(y / Math.max(1, Hh), 0, 1);
    boxEl.style.transform = u > 0 ? `translate3d(0, ${(Math.min(y, Hh) * 0.6 * k).toFixed(1)}px, 0)` : ''; boxEl.style.opacity = u > 0 ? (1 - u * 0.6).toFixed(3) : ''; };
  addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(apply); } }, { passive: true });
}


{ const m0 = measure; measure = function () { const tf = boxEl.style.transform; boxEl.style.transform = ''; try { return m0.apply(this, arguments); } finally { boxEl.style.transform = tf; } }; }
})();



(() => {
  const hero = document.getElementById('hero'), box = document.getElementById('isoscene');
  if (!('ResizeObserver' in window) || !hero) return;
  let t = 0;
  const again = () => { clearTimeout(t); t = setTimeout(() => window.dispatchEvent(new Event('resize')), 60); };
  const ro = new ResizeObserver(again); ro.observe(hero); if (box) ro.observe(box);
  addEventListener('load', again);
  addEventListener('pageshow', again);
})();
