// اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
// main.js — المُركِّب: كاميرا ← لقطة ← انتقال (pan/tear/hole/slide/zoom) ← motion blur ← كابشن ← طبقة الفيلم.
// window.seek(t) يرسم اللحظة بالضبط (حتمي).
import { step, pose, P, eo, eio, hash, cl, lerp, buildTextures, finish, tornPath, textW, paperFill, MOTION } from './vox.js';
import { SHOTS, bgLayer, decorLayer, contentBg } from './shots.js';
import { C, OPT, QA, buildCollage, ripLine, fiberEdge, mk, stampBox, loadTex, fgScrap, mapCanvas, pin, folderCover, PERF } from './collage.js';
import * as D from './data.js';

// ---------- الإعدادات (من أسئلة البداية) ----------
// قوالب جاهزة بكلمة وحدة (7): STYLE.preset = 'investigation'|'breaking'|'history'|'tech' (أو تحقيق/خبر عاجل/تاريخ/تقنية). أي إعداد بـSTYLE يغلب القالب.
const PRESETS = {
  investigation: { backgrounds: ['cork', 'wood', 'kraft', 'dark'], transitions: ['pan', 'folder', 'tear', 'route', 'pan', 'curl'], images: 'mix', halftone: .18 },
  breaking: { backgrounds: ['news', 'dark', 'news', 'grey'], transitions: ['tear', 'slide', 'zoom', 'tear', 'pan'], speed: 1.2, images: 'mix', halftone: .2 },
  history: { backgrounds: ['aged', 'map', 'crumpled', 'aged'], transitions: ['curl', 'route', 'pan', 'curl', 'hole'], images: 'bw', halftone: .25, speed: .85 },
  tech: { backgrounds: ['grey', 'white', 'dark', 'grey'], transitions: ['slide', 'zoom', 'pan', 'slide'], images: 'color', halftone: .1 },
};
const PRESET_AR = { 'تحقيق': 'investigation', 'خبر عاجل': 'breaking', 'عاجل': 'breaking', 'تاريخ': 'history', 'تقنية': 'tech' };
const PR0 = D.STYLE && D.STYLE.preset ? PRESETS[PRESET_AR[D.STYLE.preset] || D.STYLE.preset] || {} : {};
const ST = Object.assign({ motion: 'smooth', speed: 1, camera: 'one', images: 'mix', halftone: .18, outline: 'red', transitions: null, blur: 5, captions: D.CAPTIONS ?? true, fg: true, parallax: true }, PR0, D.STYLE || {});
MOTION.mode = ST.motion; MOTION.speed = ST.speed; OPT.images = ST.images; OPT.halftone = ST.halftone; OPT.outline = ST.outline; OPT.decor = ST.decor; OPT.backgrounds = ST.backgrounds;
const TRS = ST.transitions || (ST.camera === 'one' ? ['pan', 'pan', 'tear', 'pan', 'zoom', 'pan', 'hole'] : ['tear', 'slide', 'hole', 'zoom', 'slide']);
const BLUR = ST.motion === 'twos' ? 1 : Math.max(1, ST.blur | 0), FPS = D.FPS || 24;

const [W, H] = D.SIZE, c = document.getElementById('c'); c.width = W; c.height = H;
const ctx = c.getContext('2d');
const s = Math.min(W, H) / 1080, DW = W / s, DH = H / s, portrait = H > W;
const BOX = portrait ? { x0: 70, x1: DW - 70, y0: 230, y1: 1150 } : { x0: 170, x1: DW - 170, y0: 90, y1: 840 };
const CAPY = portrait ? 1262 : 965;
let WORDS = [], IMG = {};
const SB = mk(W, H), sx = SB.getContext('2d'), OB = mk(W, H), ox = OB.getContext('2d');

// ---------- الكابشن ----------
let GROUPS = [];
function buildGroups() {
  GROUPS = []; let g = [];
  WORDS.forEach((w, i) => { g.push(i); const txt = g.map(k => WORDS[k].w).join(' '), nx = WORDS[i + 1];
    const brk = g.length >= 3 || txt.length > 17 || /[.،؟!?,]$/.test(w.w) || !nx || nx.s - w.e > .45 || D.SHOTLIST.some(sh => nx && sh.start > w.s && sh.start <= nx.s);
    if (brk) { GROUPS.push(g); g = []; } });
}
function drawCaption(t) {
  if (!ST.captions || !WORDS.length) return;
  const gi = GROUPS.findIndex((g, i) => t >= WORDS[g[0]].s - .05 && t < Math.min(GROUPS[i + 1] ? WORDS[GROUPS[i + 1][0]].s - .05 : 1e9, WORDS[g[g.length - 1]].e + .6));
  if (gi < 0) return; const g = GROUPS[gi], size = portrait ? 66 : 56, a0 = WORDS[g[0]].s, pin = eo(P(t, a0 - .05, .18));
  const parts = g.map(k => WORDS[k].w.replace(/[.،,]$/, '')), full = parts.join(' ');
  ctx.save(); const w = textW(ctx, full, size) + size * 1.1, h = size * 1.6, rot = (hash(gi) - .5) * .04;
  ctx.translate(DW / 2, CAPY); ctx.rotate(rot); ctx.scale(1.15 - .15 * pin, 1.15 - .15 * pin); ctx.globalAlpha = pin > 0 ? 1 : 0;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; tornPath(ctx, -w / 2, -h / 2, w, h, gi * 7, 4, 14); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore();
  ctx.font = `900 ${size}px Cairo`; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.textAlign = 'right';
  let x = w / 2 - size * .55;
  // ترتيب العرض: الكلمات الإنجليزية المتتالية تنقرأ يسار←يمين داخل سطر عربي (After Effects مو Effects After)
  const lat = j => /^[A-Za-z0-9+.#\-]+$/.test(parts[j]), ord = [];
  for (let j = 0; j < g.length;) { if (lat(j)) { let e = j; while (e + 1 < g.length && lat(e + 1)) e++; for (let q = e; q >= j; q--) ord.push(q); j = e + 1; } else ord.push(j++); }
  ord.forEach(j => { const k = g[j]; const on = t >= WORDS[k].s - .03; ctx.fillStyle = on && t < WORDS[k].e + .08 ? '#E8B83A' : on ? C.white : 'rgba(247,242,230,.45)';
    ctx.fillText(parts[j], x, size * .05); x -= textW(ctx, parts[j] + ' ', size); });
  QA.rect(ctx, 'cap', full, -w / 2, -h / 2, w / 2, h / 2);
  ctx.restore();
}

// ---------- لقطة + كاميرا ----------
// LEAD: أول عناصر اللقطة (كلماتها خلال أول 1.5 ث) تدخل مع الكاميرا وقت الانتقال، عشان ما توصل الكاميرا على ورقة فاضية.
// باقي العناصر تطلع على كلمتها بالضبط. اللقطة الأولى: العناصر اللي خلال أول 3.6 ث تطلع من أول فريم (الهوك).
const WREF = sh => { const out = new Set(); const walk = o => { if (!o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) {
  if (k === 'stamps') continue; if (['w', 'w0', 'tw', 'sw', 'kw', 'wl'].includes(k) && typeof v === 'number') out.add(v); else if (k === 'ws' && Array.isArray(v)) v.forEach(n => out.add(n)); else if (v && typeof v === 'object') walk(v); } };
  walk(sh); return [...out].sort((a, b) => a - b); };
let LEAD = null;
const leadOf = i => { if (!LEAD) LEAD = D.SHOTLIST.map((sh, k) => { const win = k === 0 ? 3.6 : 1.5, m = new Map(); let j = 0;
  if (ST.lead === false) return m;
  for (const n of WREF(sh)) { if (!WORDS[n] || WORDS[n].s - sh.start > win) continue; m.set(n, k === 0 ? .08 + j * .28 : -trDur(trOf(k), k) * .32 + j * .16); j++; } return m; }); return LEAD[i]; };
const envOf = sh => { const L = leadOf(D.SHOTLIST.indexOf(sh)); return { W, H, DW, DH, s, IMG, portrait, box: BOX, capY: CAPY, cx: DW / 2, cy: (BOX.y0 + BOX.y1) / 2, at: i => (L.has(i) ? L.get(i) : (WORDS[i] ? WORDS[i].s : 0) - sh.start) }; };
const durOf = i => (D.SHOTLIST[i + 1] ? D.SHOTLIST[i + 1].start : D.DURATION) - D.SHOTLIST[i].start;
// يرسم لقطة i على x (بإحداثيات التصميم). pre = تحويل إضافي للانتقال. part = 'all' | 'bg' (الورقة + الديكور) | 'fg' (المحتوى)
// عمق (6): الخلفية تتحرك أبطأ من المحتوى مع كاميرا اللقطة (cam) والانجراف، والديكور بالنص.
const clampCam = c => { const k = Math.max(1, c.k), hx = DW / (2 * k), hy = DH / (2 * k);
  return { k, x: cl(c.x, hx, DW - hx), y: c.free ? Math.max(hy, c.y) : cl(c.y, hy, DH - hy) }; };
function drawShot(x, i, t, pre = null, part = 'all') {
  const sh = D.SHOTLIST[i], lt = step(t - sh.start), env = envOf(sh), du = durOf(i), q = cl(lt / Math.max(1, du));
  x.save(); if (pre) pre(x);
  // كاميرا: دفع بطيء + انجراف ناعم (camera:'one') أو دفع خفيف بس (cuts)
  const one = ST.camera === 'one', k = (sh.zoom || 1) * (1 + (one ? .06 : .03) * eio(q)), r = one ? Math.sin(lt * .35 + sh.seed) * .006 : 0;
  const dx = one ? Math.sin(lt * .32 + sh.seed * 2) * 12 : 0, dy = one ? Math.cos(lt * .27 + sh.seed) * 9 : 0;
  const S0 = SHOTS[sh.type], cam = S0.cam && sh.cam !== false ? clampCam(S0.cam(lt, sh, env)) : null;
  const layer = (f, fn) => { x.save(); const pf = ST.parallax ? f : 1;
    x.translate(DW / 2 + dx * pf, DH / 2 + dy * pf); x.rotate(r); x.scale(k, k); x.translate(-DW / 2, -DH / 2);
    if (cam) { const kk = 1 + (cam.k - 1) * pf, lim = f < 1 ? .12 : 9, ox = cl((cam.x - DW / 2) * pf, -lim * DW, lim * DW), oy = cl((cam.y - DH / 2) * pf, -lim * DH, lim * DH);
      x.translate(DW / 2, DH / 2); x.scale(kk, kk); x.translate(-DW / 2 - ox, -DH / 2 - oy); }
    fn(); x.restore(); };
  if (part !== 'fg') {
    layer(.45, () => { if (ST.parallax) { x.translate(DW / 2, DH / 2); x.scale(1.28, 1.28); x.translate(-DW / 2, -DH / 2); } bgLayer(x, sh, env, lt); });
    if (!sh.nodecor && OPT.decor !== false && !S0.nodecor) layer(.8, () => decorLayer(x, sh, env));
  }
  if (part !== 'bg') layer(1, () => { contentBg(x, sh, env, lt); S0.draw(x, lt, sh, env);
    // stamps: أختام إضافية فوق أي لقطة {t, w, x, y (نسبة من المنطقة), c, size}
    (sh.stamps || []).forEach((m, j) => stampBox(x, m.t, BOX.x0 + (m.x ?? .5) * (BOX.x1 - BOX.x0), BOX.y0 + (m.y ?? .5) * (BOX.y1 - BOX.y0), P(lt, env.at(m.w), .3 / (ST.speed || 1)), { size: m.size || 80, color: m.c === 'ink' ? C.ink : C.red, rot: m.rot ?? (hash(j + sh.seed) - .5) * .25 })); });
  x.restore();
}
const GO = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] };
const trOf = i => D.SHOTLIST[i].tr || TRS[(i - 1) % TRS.length];
// مدة الانتقال: sh.trd يغلب الافتراضي (بالثواني)
const trDur = (tr, i) => (i != null && D.SHOTLIST[i] && D.SHOTLIST[i].trd) || trDur0(tr);
const trDur0 = tr => ({ pan: .9, tear: 1.05, hole: .95, zoom: .75, slide: .8, curl: 1.0, folder: 1.35, route: 1.75 }[tr] || .9) / (ST.speed || 1);
function tileClip(x, ox0, oy0, seed) { tornPath(x, ox0 - 20, oy0 - 20, DW + 40, DH + 40, seed, 18, 30); }

// يرسم فريم واحد (بدون blur) على x
function frame(x, t) {
  x.setTransform(s, 0, 0, s, 0, 0);
  let i = 0; D.SHOTLIST.forEach((sh, k) => { if (t >= sh.start) i = k; });
  // هل إحنا داخل نافذة انتقال؟ (تبدأ قبل اللقطة بنص المدة)
  let ti = -1; for (let k = 1; k < D.SHOTLIST.length; k++) { const d = trDur(trOf(k), k), a = D.SHOTLIST[k].start - d * .5; if (t >= a && t < a + d) ti = k; }
  if (ti < 0) { drawShot(x, i, t); return; }
  const sh = D.SHOTLIST[ti], tr = trOf(ti), d = trDur(tr, ti), p = cl((t - (sh.start - d * .5)) / d), seed = sh.seed * 3 + 1;
  const [gx, gy] = GO[sh.go || 'left'];
  if (tr === 'pan' || tr === 'slide') {
    // pan بعمق (6): المحتوى يسبق، والورقة (الخلفية) تلحقه، وقصاصة مغبّشة قريبة من الكاميرا تعبر أسرع
    const deep = tr === 'pan' && ST.parallax, eC = tr === 'pan' ? eio(deep ? cl(p / .86) : p) : eo(p), eB = tr === 'pan' ? eio(deep ? cl((p - .14) / .86) : p) : eo(p);
    const z = tr === 'pan' ? 1 - .09 * Math.sin(Math.PI * p) : 1, cx = DW / 2, cy = DH / 2;
    const camT = (off, zz) => x2 => { x2.translate(cx, cy); x2.scale(zz, zz); x2.translate(-cx + off[0], -cy + off[1]); };
    const oldOff = e => (tr === 'pan' ? [-gx * e * DW * 1.04, -gy * e * DH * 1.04] : [0, 0]), newOff = e => [gx * (1 - e) * DW * 1.04, gy * (1 - e) * DH * 1.04];
    const zo = tr === 'slide' ? 1 - .05 * eC : z;
    drawShot(x, ti - 1, t, camT(oldOff(eB), zo), deep ? 'bg' : 'all');
    if (tr === 'slide') { x.save(); x.fillStyle = `rgba(20,12,4,${.3 * eC})`; x.fillRect(0, 0, DW, DH); x.restore(); }
    x.save(); x.translate(cx, cy); x.scale(z, z); x.translate(-cx + newOff(eB)[0], -cy + newOff(eB)[1]);
    if (tr === 'slide') { const sk = (1 - eB) * .12 * (gx || gy); x.transform(1, 0, sk, 1, 0, 0); }
    x.save(); x.shadowColor = 'rgba(20,12,4,.5)'; x.shadowBlur = 40; x.shadowOffsetX = gx * 20; x.shadowOffsetY = 16; tileClip(x, 0, 0, seed); x.fillStyle = C.paper; x.fill(); x.restore();
    tileClip(x, 0, 0, seed); x.clip(); drawShot(x, ti, t, null, deep ? 'bg' : 'all'); x.restore();
    if (deep) { drawShot(x, ti - 1, t, camT(oldOff(eC), zo), 'fg'); drawShot(x, ti, t, camT(newOff(eC), z), 'fg');
      if (ST.fg !== false) { const sc = fgScrap(seed), u = lerp(1.4, -1.4, eio(p)), px = cx + (gx || 0) * u * DW, py = (gy ? cy + gy * u * DH : DH * (.22 + hash(seed + 4) * .5)), pxx = gx ? px : DW * (.25 + hash(seed + 6) * .5);
        x.save(); x.translate(pxx, py); x.rotate((hash(seed + 5) - .5) * .8); x.scale(1.5, 1.5); x.globalAlpha = .92; x.drawImage(sc, -sc.width / 2, -sc.height / 2); x.restore(); } }
    MOTION.busy = true;
    return;
  }
  if (tr === 'zoom') {
    const e = eio(p); drawShot(x, ti, Math.max(t, sh.start), x2 => { const k = 1.35 - .35 * eo(p); x2.translate(DW / 2, DH / 2); x2.scale(k, k); x2.translate(-DW / 2, -DH / 2); });
    x.save(); x.globalAlpha = 1 - cl((p - .35) / .35); const k = 1 + 1.6 * Math.pow(p, 2); x.translate(DW / 2, DH * .45); x.scale(k, k); x.translate(-DW / 2, -DH * .45); drawShot(x, ti - 1, t); x.restore();
    return;
  }
  if (tr === 'curl') return curlTr(x, ti, t, p, gx, gy, seed);
  if (tr === 'folder') return folderTr(x, ti, t, p, seed, sh);
  if (tr === 'route') return routeTr(x, ti, t, p, seed, sh);
  // tear / hole: القديمة في OB، الجديدة تحت
  drawShot(x, ti, Math.max(t, sh.start), x2 => { const k = 1.1 - .1 * eo(p); x2.translate(DW / 2, DH / 2); x2.scale(k, k); x2.translate(-DW / 2, -DH / 2); });
  ox.setTransform(s, 0, 0, s, 0, 0); ox.clearRect(0, 0, DW, DH); drawShot(ox, ti - 1, t);
  ox.setTransform(1, 0, 0, 1, 0, 0);
  const e = Math.pow(eio(p), 1.6);
  if (tr === 'tear') {
    const vert = gx !== 0, pts = vert ? ripLine(DW * .5 + (hash(seed) - .5) * 160, -60, DW * .5 + (hash(seed + 1) - .5) * 160, DH + 60, seed, 40, 24) : ripLine(-60, DH * .5, DW + 60, DH * .5 + (hash(seed) - .5) * 200, seed, 40, 24);
    // مرحلتين: الشق يمشي على الورقة (الثلث الأول) وبعدين النصين ينفصلون ويطيرون
    const crack = cl(p / .34), e2 = eio(cl((p - .3) / .7));
    if (crack < 1 && p < .3) { x.drawImage(OB, 0, 0, DW, DH); const n = Math.max(2, Math.round(pts.length * eo(crack))); x.save(); x.shadowColor = 'rgba(20,12,4,.35)'; x.shadowBlur = 8; fiberEdge(x, pts.slice(0, n), { width: 10 + 6 * crack, seed }); x.restore(); return; }
    const half = (sideSign) => { x.save(); const m = (8 + e2 * (vert ? DW : DH) * .85) * sideSign; x.translate(vert ? m : 0, vert ? Math.abs(m) * .08 : m); x.translate(DW / 2, DH / 2); x.rotate(e2 * .12 * sideSign); x.translate(-DW / 2, -DH / 2);
      x.beginPath(); pts.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b)));
      if (vert) { const ex = sideSign < 0 ? -200 : DW + 200; x.lineTo(ex, DH + 60); x.lineTo(ex, -60); } else { const ey = sideSign < 0 ? -200 : DH + 200; x.lineTo(DW + 60, ey); x.lineTo(-60, ey); }
      x.closePath(); x.save(); x.shadowColor = 'rgba(20,12,4,.45)'; x.shadowBlur = 30; x.fillStyle = C.paper; x.fill(); x.restore(); x.clip(); x.drawImage(OB, 0, 0, DW, DH); x.restore();
      x.save(); x.translate(vert ? m : 0, vert ? Math.abs(m) * .08 : m); x.translate(DW / 2, DH / 2); x.rotate(e2 * .12 * sideSign); x.translate(-DW / 2, -DH / 2); fiberEdge(x, pts, { width: 14, seed: seed + (sideSign > 0 ? 1 : 2) }); x.restore(); };
    half(-1); half(1); return;
  }
  // hole: فتحة ممزّقة تكبر من النص
  const R0 = e * Math.hypot(DW, DH) * .62, cx = DW / 2, cy = DH * .45, N = 70, rr = [];
  for (let k = 0; k <= N; k++) { const a = k / N * Math.PI * 2, j = 1 + (hash(seed * 31 + k) - .5) * .18 + Math.sin(a * 5 + seed) * .05; rr.push([cx + Math.cos(a) * R0 * j, cy + Math.sin(a) * R0 * j]); }
  x.save(); x.beginPath(); x.rect(-50, -50, DW + 100, DH + 100); rr.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.clip('evenodd'); x.drawImage(OB, 0, 0, DW, DH); x.restore();
  if (R0 > 2) fiberEdge(x, rr, { width: 16, seed });
}

// ---------- انتقالات جديدة (5): curl · folder · route ----------
const oldToOB = (ti, t) => { ox.setTransform(s, 0, 0, s, 0, 0); ox.clearRect(0, 0, DW, DH); drawShot(ox, ti - 1, t); ox.setTransform(1, 0, 0, 1, 0, 0); };
const poly = (x, pts) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); };
// curl: الصفحة تنقلب من الزاوية مع طيّة، ظهر الورقة يبان، وظل على الصفحة الجديدة
function curlTr(x, ti, t, p, gx, gy, seed) {
  const sh = D.SHOTLIST[ti]; drawShot(x, ti, Math.max(t, sh.start), x2 => { const k = 1.04 - .04 * eo(p); x2.translate(DW / 2, DH / 2); x2.scale(k, k); x2.translate(-DW / 2, -DH / 2); });
  oldToOB(ti, t);
  let nx = gx || .3, ny = gy || .55; const L = Math.hypot(nx, ny); nx /= L; ny /= L;      // اتجاه التقشير (افتراضياً من الزاوية تحت يمين)
  const cs = [[0, 0], [DW, 0], [DW, DH], [0, DH]], dots = cs.map(([a, b]) => a * nx + b * ny), mx = Math.max(...dots) + 4, mn = Math.min(...dots) - 4;
  const sl = lerp(mx, mn, eio(p));                                     // خط الطيّة: dot(p,n) = sl
  const half = keepNeg => { const out = []; for (let i = 0; i < 4; i++) { const A = cs[i], B = cs[(i + 1) % 4], da = A[0] * nx + A[1] * ny - sl, db = B[0] * nx + B[1] * ny - sl, ia = keepNeg ? da <= 0 : da >= 0, ib = keepNeg ? db <= 0 : db >= 0;
    if (ia) out.push(A); if (ia !== ib) { const f = da / (da - db); out.push([lerp(A[0], B[0], f), lerp(A[1], B[1], f)]); } } return out; };
  const keep = half(true), flap = half(false).map(([a, b]) => { const d = a * nx + b * ny - sl; return [a - 2 * d * nx, b - 2 * d * ny]; });
  if (keep.length > 2) { x.save(); x.shadowColor = 'rgba(20,12,4,.45)'; x.shadowBlur = 30; x.shadowOffsetX = nx * 14; x.shadowOffsetY = ny * 14; poly(x, keep); x.fillStyle = C.paper; x.fill(); x.restore();
    x.save(); poly(x, keep); x.clip(); x.drawImage(OB, 0, 0, DW, DH);
    const g = x.createLinearGradient(sl * nx, sl * ny, (sl - 90) * nx, (sl - 90) * ny); g.addColorStop(0, 'rgba(20,12,4,.3)'); g.addColorStop(1, 'rgba(20,12,4,0)'); x.fillStyle = g; x.fillRect(0, 0, DW, DH); x.restore(); }
  if (flap.length > 2) { x.save(); x.shadowColor = 'rgba(20,12,4,.42)'; x.shadowBlur = 28; x.shadowOffsetX = -nx * 12; x.shadowOffsetY = -ny * 12 + 6; poly(x, flap); x.fillStyle = '#ECE4D0'; x.fill(); x.restore();
    x.save(); poly(x, flap); x.clip(); x.globalAlpha = .1; x.scale(-1, 1); x.drawImage(OB, -DW, 0, DW, DH); x.restore();
    x.save(); poly(x, flap); x.clip(); const fw = Math.max(60, (mx - sl) * .9), g = x.createLinearGradient(sl * nx, sl * ny, (sl - fw) * nx, (sl - fw) * ny);
    g.addColorStop(0, 'rgba(90,60,25,.38)'); g.addColorStop(.2, 'rgba(255,250,235,.3)'); g.addColorStop(1, 'rgba(90,60,25,.14)'); x.fillStyle = g; x.fillRect(-DW, -DH, DW * 3, DH * 3); x.restore(); }
  if (p > 0 && p < 1) MOTION.busy = true;
}
// folder: ملف كرافت يطلع من تحت ويغطي، وبعدين غطاه ينفتح (يلف على المفصلة اليسار) على اللقطة الجديدة
function folderTr(x, ti, t, p, seed, sh) {
  const A = cl(p / .38), B = cl((p - .42) / .58), eA = eio(A), eB = eio(B), lab = sh.folderLabel || 'ملف القضية', y = (1 - eA) * DH * 1.08;
  if (B <= 0) { drawShot(x, ti - 1, t); x.save(); x.translate(0, y); folderCover(x, DW, DH, seed, lab, 'back'); x.restore(); }
  else { drawShot(x, ti, Math.max(t, sh.start), x2 => { const k = .9 + .1 * eB; x2.translate(DW / 2, DH / 2); x2.scale(k, k); x2.translate(-DW / 2, -DH / 2); });
    x.save(); x.globalAlpha = .5 * (1 - eB); x.fillStyle = '#3B2A16'; x.fillRect(0, 0, DW, DH); x.restore(); }
  const th = eB * Math.PI, c = Math.cos(th);
  if (c > -.97) { x.save(); x.translate(0, y); x.transform(c, -Math.sin(th) * .12, 0, 1, 0, 0);
    folderCover(x, DW, DH, seed, lab, c >= 0 ? 'front' : 'inside'); if (B > 0) { x.fillStyle = `rgba(20,12,4,${.4 * (1 - Math.abs(c))})`; x.fillRect(0, 0, DW, DH); } x.restore(); }
  if (p > 0 && p < 1) MOTION.busy = true;
}
// route: خريطة تنزل، خط أحمر متقطع يرسم الطريق، وبعدين zoom-through من نهاية الطريق للقطة الجديدة
function routeTr(x, ti, t, p, seed, sh) {
  const A = cl(p / .28), Rp = cl((p - .2) / .38), Z = cl((p - .6) / .4), eZ = Math.pow(eio(Z), 1.5), mp = mapCanvas(seed % 2);
  const R = k => hash(seed * 7 + k), S = [DW * (.2 + R(1) * .15), DH * (.66 + R(2) * .1)], E = [DW * (.55 + R(3) * .15), DH * (.36 + R(4) * .08)];
  const pts = []; for (let i = 0; i <= 48; i++) { const f = i / 48, w = Math.sin(f * Math.PI) * (R(5) - .5) * DW * .55 + Math.sin(f * Math.PI * 3 + R(6) * 6) * 36; pts.push([lerp(S[0], E[0], f) + w, lerp(S[1], E[1], f) + w * .3]); }
  if (Z <= 0) drawShot(x, ti - 1, t); else drawShot(x, ti, Math.max(t, sh.start), x2 => { const k = 1.25 - .25 * eo(Z); x2.translate(DW / 2, DH / 2); x2.scale(k, k); x2.translate(-DW / 2, -DH / 2); });
  if (Z >= 1) return;
  const zk = 1 + 16 * eZ, r0 = Z > 0 ? 4 + 110 * eio(Z) : 0, ring = Array.from({ length: 41 }, (_, k) => { const a = k / 40 * 6.283, j = 1 + (hash(seed * 13 + k) - .5) * .3; return [E[0] + Math.cos(a) * r0 * j, E[1] + Math.sin(a) * r0 * j]; });
  x.save(); x.translate(E[0], E[1]); x.scale(zk, zk); x.rotate((1 - eo(A)) * .05); x.translate(-E[0], -E[1] + (1 - eo(A)) * DH * 1.1);
  if (r0 > 0) { x.beginPath(); x.rect(-80, -80, DW + 160, DH + 160); ring.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.clip('evenodd'); }
  x.save(); x.shadowColor = 'rgba(20,12,4,.5)'; x.shadowBlur = 36; x.shadowOffsetY = 14; tileClip(x, 0, 0, seed + 3); x.fillStyle = '#EDE3C8'; x.fill(); x.restore();
  x.save(); tileClip(x, 0, 0, seed + 3); x.clip(); if (mp) x.drawImage(mp, -40, -40, DW + 80, DH + 80); x.restore();
  const n = Math.round(pts.length * eo(Rp)); if (n > 1) { x.save(); x.lineCap = 'round'; x.setLineDash([26, 18]); x.strokeStyle = 'rgba(30,15,5,.22)'; x.lineWidth = 12; x.beginPath(); pts.slice(0, n).forEach(([a, b], i) => (i ? x.lineTo(a + 4, b + 6) : x.moveTo(a + 4, b + 6))); x.stroke();
    x.strokeStyle = C.red; x.lineWidth = 11; x.beginPath(); pts.slice(0, n).forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); x.restore(); }
  pin(x, S[0], S[1], { press: cl(Rp * 4), color: 'red', r: 20 });
  if (p > .55) { x.save(); x.strokeStyle = C.red; x.lineWidth = 10; x.lineCap = 'round'; const q = 30 * eo(cl((p - .55) / .06)); x.beginPath(); x.moveTo(E[0] - q, E[1] - q); x.lineTo(E[0] + q, E[1] + q); x.moveTo(E[0] + q, E[1] - q); x.lineTo(E[0] - q, E[1] + q); x.stroke(); x.restore(); }
  if (r0 > 0) fiberEdge(x, ring, { width: 4, seed });
  x.restore(); if (p > 0 && p < 1) MOTION.busy = true;
}

function render(t) {
  t = Math.max(0, t); const T = step(t); MOTION.t0 = T;
  if (BLUR <= 1) { frame(ctx, T); }
  else { const sh = .55 / FPS;                         // shutter: نص فريم تقريباً
    // وقت الانتقال الحركة كبيرة → ضعف العيّنات عشان ما تطلع نسخ متقطعة
    const inTr = D.SHOTLIST.some((S, k) => k > 0 && Math.abs(T - S.start) < trDur(trOf(k), k) * .5 + .04), NB = inTr ? BLUR * 2 : BLUR;
    // سرعة (1): العيّنة الأولى تقول هل فيه شي يتحرك؛ إذا لا (ولا انتقال) نكتفي فيها بدل 5 عيّنات
    let n = NB; for (let k = 0; k < n; k++) { const tk = Math.max(0, T - sh * (k / (NB - 1))); sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, W, H);
      if (k === 0) { MOTION.busy = false; QA.on = !!window.QA_ON && !inTr; QA.list.length = 0; } frame(sx, tk); QA.on = false;
      if (k === 0 && !inTr && !MOTION.busy) n = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(SB, 0, 0); }
    window.__samples = n;
    ctx.globalAlpha = 1; }
  ctx.setTransform(s, 0, 0, s, 0, 0); QA.on = !!window.QA_ON; drawCaption(T); QA.on = false;
  { const im = IMG[D.WM]; if (im && im.width) { const z = 150, x = DW - z - 46, y = 58; ctx.save(); ctx.globalAlpha = .9; ctx.beginPath(); ctx.roundRect(x, y, z, z, 22); ctx.clip(); ctx.drawImage(im, x, y, z, z); ctx.restore(); } }   // شعار حقوق
  ctx.setTransform(1, 0, 0, 1, 0, 0); finish(ctx, c, T, W, H);
}

// ---------- أحداث الصوت ----------
function events() {
  const ev = [];
  D.SHOTLIST.forEach((sh, i) => {
    if (i > 0) { const tr = trOf(i), d = trDur(tr, i), a = sh.start - d * .5, E = (k, f) => ev.push({ k, t: +(a + d * f).toFixed(3) });
      if (tr === 'tear' || tr === 'hole') E('tear', 0); else if (tr === 'curl') E('flip', 0); else if (tr === 'folder') { E('slide', 0); E('paper', .36); E('folder', .42); }
      else if (tr === 'route') { E('paper', 0); E('marker', .2); E('pin', .22); E('pan', .58); } else E('pan', 0);
      if (tr === 'slide') E('paper', .8); }
    else ev.push({ k: 'hit', t: 0 });
    if (sh.type === 'board' || sh.folder) ev.push({ k: 'folder', t: +Math.max(0, sh.start - .05).toFixed(3) });   // ملف التحقيق ينفتح
    (sh.stamps || []).forEach(m => ev.push({ k: 'stamp', t: +(envOf(sh).at(m.w) + sh.start).toFixed(3) }));
    SHOTS[sh.type].events(sh, envOf(sh)).forEach(([k, lt]) => ev.push({ k, t: +(sh.start + Math.max(0, lt)).toFixed(3) })); });
  ev.push({ k: 'lift', t: D.SHOTLIST[D.SHOTLIST.length - 1].start });
  return ev.filter(e => e.t < D.DURATION).sort((a, b) => a.t - b.t);
}

window.seek = async t => { render(t); };
window.renderFrame = t => render(t);
window.grab = (type = 'image/jpeg') => c.toDataURL(type, .93);
window.EVENTS = events; window.QA_LIST = () => QA.list.slice(); window.PERF = PERF;
window.DURATION = D.DURATION;
(async () => {
  for (const f of ['900 60px Cairo', '700 60px Cairo', '700 60px Head', '400 60px Type']) { await document.fonts.load(f); await document.fonts.load(f, 'سؤال'); }
  await document.fonts.ready;
  try { WORDS = await (await fetch('../' + D.WORDS)).json(); } catch { WORDS = []; }
  buildGroups();
  const load = async f => { const im = new Image(); im.src = '../' + f; try { await im.decode(); return im; } catch { return null; } };
  await Promise.all([...(D.IMAGES || []), ...(D.WM ? [D.WM] : [])].map(async f => { IMG[f] = await load(f) || new Image();
    if ((D.CUT || []).includes(f) || ST.cutout) { const cf = f.replace(/\.(png|jpe?g|webp)$/i, '_cut.png'), c2 = await load(cf); if (c2) IMG[f + '#cut'] = c2; } }));
  await loadTex('../assets/tex/'); buildTextures(W, H); buildCollage(DW, DH);
  const q = new URLSearchParams(location.search); render(+(q.get('t') || 0));
  window.__ready = true;
})();
