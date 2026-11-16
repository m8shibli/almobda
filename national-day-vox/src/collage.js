// اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
// collage.js — ستايل «ملف التحقيق / كولاج الجرايد»:
// ورق قديم بطيّات، خرائط ملوّنة، صور أبيض وأسود بإطار أبيض+أحمر مقصوص، دبابيس نحاس، شريط لاصق شفاف، خيط أحمر مرتخي،
// ختم أحمر بمربع، قصاصات عناوين جرايد، شرايط مكتوبة. كل شي حتمي (نفس الوقت = نفس الفريم).
import { rng, hash, lerp, cl, P, eo, back, boil, tornPath, MOTION } from './vox.js';

export const C = { ink: '#1C1A16', tan: '#E6DCC6', paper: '#EFE6D2', white: '#F7F2E6', red: '#B8231B', mustard: '#D2A53A', navy: '#1F2A3A', kraft: '#C9B48A', dark: '#22201C', slip: '#EDE2C8' };
export const HEAD = `'Head', 'Amiri', serif`;       // عناوين serif: Amiri + Playfair
export const TYPE = `'Type', 'Amiri', monospace`;    // آلة كاتبة: Special Elite + Amiri
export const SANS = `'Cairo', sans-serif`;           // قصاصات العناوين العريضة
const AR = /[؀-ۿ]/;
export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
export const OPT = { images: 'mix', halftone: .18, outline: 'red' };   // تنضبط من STYLE في data.js

// ---------- خامات حقيقية (ambientCG، CC0): حبيبات ورق، تجعيد، رمادي، كرافت، فلّين، خشب ----------
export const TX = {};
export async function loadTex(base) { await Promise.all(['grain', 'grey', 'crumple', 'kraft', 'cork', 'wood'].map(async k => { const im = new Image(); im.src = base + k + '.jpg'; try { await im.decode(); TX[k] = im; } catch {} })); }
const PAT = {};
function texFill(x, k, X, Y, W, H, { scale = 1, alpha = 1, op = 'multiply', seed = 0 } = {}) {
  const im = TX[k]; if (!im) return; const p = PAT[k + (x.canvas ? '' : '')] || (PAT[k] = x.createPattern(im, 'repeat'));
  p.setTransform(new DOMMatrix().translateSelf(X - hash(seed + 1) * 1024 * scale, Y - hash(seed + 2) * 1024 * scale).scaleSelf(scale, scale));
  x.save(); x.globalCompositeOperation = op; x.globalAlpha = alpha; x.fillStyle = p; x.fillRect(X, Y, W, H); x.restore();
}
// ---------- شكل ورق غير منتظم (11) ----------
// الورق الحقيقي مو مستطيل: زوايا مزاحة، زاوية مقطوعة، قضمة بالجنب، أطراف مقوّسة شوي، وحافة ممزّقة.
// shape = بذرة الشكل الكبير (ثابتة)، seed = بذرة الرجفة الصغيرة (تتغير مع boil). irr = قوة عدم الانتظام 0..1.
export function irregularPts(x, y, w, h, shape, seed, amp = 4, jag = 12, irr = 1) {
  const S = rng(shape * 7 + 3), R = rng(seed), m = Math.min(w, h), pts = [];
  const off = () => (S() * .055 - .012) * irr;                 // للداخل غالباً عشان يبقى داخل الصندوق
  const cs = [[x + w * off(), y + h * off()], [x + w - w * off(), y + h * off()], [x + w - w * off(), y + h - h * off()], [x + w * off(), y + h - h * off()]];
  const chop = cs.map(() => (S() < .42 * irr ? m * (.05 + S() * .11) * irr : 0));
  const bite = S() < .35 * irr ? { side: Math.floor(S() * 4), f: .2 + S() * .55, len: .08 + S() * .12, d: m * (.025 + S() * .04) * irr } : null;
  const bows = [0, 1, 2, 3].map(() => (S() - .4) * .022 * irr);
  for (let s = 0; s < 4; s++) {
    let [x0, y0] = cs[s], [x1, y1] = cs[(s + 1) % 4]; const L0 = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L0, uy = (y1 - y0) / L0;
    const c0 = chop[s], c1 = chop[(s + 1) % 4]; x0 += ux * c0; y0 += uy * c0; x1 -= ux * c1; y1 -= uy * c1;
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / jag)), nx = -uy, ny = ux;   // nx,ny = للداخل
    for (let i = 0; i < n; i++) { const f = i / n; let o = (R() - .5) * 2 * amp + Math.sin(f * Math.PI) * bows[s] * L;
      if (bite && bite.side === s) { const q = (f - bite.f) / bite.len; if (q > 0 && q < 1) o += Math.sin(q * Math.PI) ** .7 * bite.d + (R() - .5) * amp * 1.5; }
      pts.push([x0 + (x1 - x0) * f + nx * o, y0 + (y1 - y0) * f + ny * o]); }
  }
  return pts;
}
export function irregularPath(ctx, x, y, w, h, shape, seed, amp, jag, irr) { const p = irregularPts(x, y, w, h, shape, seed, amp, jag, irr); ctx.beginPath(); p.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); }

// ---------- ورقة حقيقية مع كاش (1) ----------
// ظل محيط + ظل تلامس، حافة بيضا ممزّقة (لب الورق يبان)، حبيبات + تجعيد حقيقي، إضاءة انحناء، وسماكة على الحافة.
// الجسم يترسم مرة وحدة بكانفس ويتخزّن (مع ظلّين مغبّشين جاهزين) — كل فريم بس drawImage.
// inner(ctx) يترسم داخل الورقة قبل الإضاءة (مثلاً سطور جريدة) — لازم ikey يميّزه بالكاش.
const SHEETS = new Map(); export const PERF = { hit: 0, miss: 0 };
function sheetSprite(w, h, seed, fill, o) {
  const key = [Math.round(w), Math.round(h), seed, fill, o.amp, o.jag, o.lip, o.crumple, o.ikey, o.shape, o.irr, o.outline].join('|');
  let s = SHEETS.get(key); if (s) { PERF.hit++; return s; } PERF.miss++; if (SHEETS.size > 260) SHEETS.clear();
  const ol = o.outline ? 12 : 0, pad = 8 + ol, W = Math.ceil(w + pad * 2), H = Math.ceil(h + pad * 2), c = mk(W, H), x = c.getContext('2d'); x.translate(W / 2, H / 2);
  const irr = o.irr, sh = o.shape;
  const body = q => irregularPath(q, -w / 2, -h / 2, w, h, sh, seed, o.amp, o.jag, irr);
  const lipP = q => irregularPath(q, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, sh, seed * 13 + 7, o.amp * 1.8, o.jag * .6, irr);
  const outP = q => irregularPath(q, -w / 2 - ol, -h / 2 - ol, w + ol * 2, h + ol * 2, sh, seed * 5 + 1, 6, 14, irr);
  const edge = o.outline ? outP : o.lip ? lipP : body;
  if (o.outline) { outP(x); x.fillStyle = o.outline; x.fill(); }
  if (o.lip) { lipP(x); x.fillStyle = '#FBF8F0'; x.fill(); }
  x.save(); body(x); x.fillStyle = fill; x.fill(); x.clip();
  texFill(x, 'grain', -w / 2, -h / 2, w, h, { scale: .7, alpha: .9, seed });
  texFill(x, 'crumple', -w / 2, -h / 2, w, h, { scale: .55 + hash(seed) * .3, alpha: o.crumple, seed: seed + 5 });
  if (o.inner) o.inner(x);
  const a = hash(seed + 9) * 6.28, dx = Math.cos(a) * w / 2, dy = Math.sin(a) * h / 2, g = x.createLinearGradient(-dx, -dy, dx, dy);
  g.addColorStop(0, 'rgba(255,253,245,.22)'); g.addColorStop(.5, 'rgba(255,253,245,0)'); g.addColorStop(1, 'rgba(70,42,12,.16)'); x.fillStyle = g; x.fillRect(-w / 2 - 20, -h / 2 - 20, w + 40, h + 40);
  x.lineWidth = 7; x.strokeStyle = 'rgba(105,75,35,.13)'; body(x); x.stroke();
  x.restore();
  // ظلّين جاهزين: محيط (ربع الدقة، مغبّش) + تلامس (نص الدقة)
  const shadowOf = (k, blur) => { const SP = Math.ceil(40 * k), sw = Math.ceil(W * k + SP * 2), sh2 = Math.ceil(H * k + SP * 2), q = mk(sw, sh2).getContext('2d');
    q.filter = `blur(${blur}px)`; q.translate(SP, SP); q.scale(k, k); q.translate(W / 2, H / 2); q.fillStyle = 'rgb(35,22,8)'; edge(q); q.fill(); return { c: q.canvas, k, SP }; };
  s = { c, W, H, amb: shadowOf(.25, 3), con: shadowOf(.5, .9) }; SHEETS.set(key, s); return s;
}
// يرسم ظل مخزّن بإزاحة ثابتة على الشاشة (الضوء من فوق يسار مهما دارت الورقة)
function dropSprite(ctx, sp, W, H, dx, dy, alpha, grow = 1) {
  if (alpha <= .005) return; const m = ctx.getTransform(), an = Math.atan2(m.b, m.a), c0 = Math.cos(-an), s0 = Math.sin(-an), lx = dx * c0 - dy * s0, ly = dx * s0 + dy * c0;
  const k = sp.k, dw = sp.c.width / k * grow, dh = sp.c.height / k * grow; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(sp.c, lx - dw / 2, ly - dh / 2, dw, dh); ctx.restore();
}
export function sheet(ctx, w, h, seed, fill, { lift = 0, amp = 4, jag = 12, lip = true, crumple = .5, inner = null, ikey = '', shape = null, irr = 1, outline = null } = {}) {
  const s = sheetSprite(w, h, seed, fill, { amp, jag, lip, crumple, inner, ikey: inner ? ikey || 'i' : '', shape: shape ?? seed, irr, outline });
  dropSprite(ctx, s.amb, s.W, s.H, 8 + lift * 22, 14 + lift * 34, .34 - lift * .1, 1 + lift * .05);
  dropSprite(ctx, s.con, s.W, s.H, 1 + lift * 3, 1.5 + lift * 4, .38 * (1 - lift));
  ctx.drawImage(s.c, -s.W / 2, -s.H / 2); QA.rect(ctx, 'body', '', -w / 2, -h / 2, w / 2, h / 2);
  if (lift > .02) MOTION.busy = true;
}

// ---------- ورق ----------
function noiseFill(x, W, H, R, amt) { const id = x.getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < d.length; i += 4) { const v = (R() - .5) * amt; d[i] += v; d[i + 1] += v; d[i + 2] += v * .85; } x.putImageData(id, 0, 0); }
function fibers(x, W, H, R, n, col, a) { x.save(); x.globalAlpha = a; x.strokeStyle = col; for (let i = 0; i < n; i++) { const px = R() * W, py = R() * H, an = R() * 6.28, l = 5 + R() * 26; x.lineWidth = .5 + R() * .9; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(an) * l, py + Math.sin(an) * l); x.stroke(); } x.restore(); }
function stains(x, W, H, R, n, a = 1) { for (let i = 0; i < n; i++) { const cx = R() * W, cy = R() * H, r = 60 + R() * 280, g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(130,95,45,${(.04 + R() * .06) * a})`); g.addColorStop(.75, `rgba(130,95,45,${(.02 + R() * .03) * a})`); g.addColorStop(1, 'rgba(130,95,45,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); } }
function folds(x, W, H, R) {
  const line = (x0, y0, x1, y1) => { const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny), ox = nx / L, oy = ny / L;
    x.save(); x.lineWidth = 3; x.strokeStyle = 'rgba(255,252,240,.45)'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    x.strokeStyle = 'rgba(90,65,30,.16)'; x.lineWidth = 4; x.beginPath(); x.moveTo(x0 + ox * 3.5, y0 + oy * 3.5); x.lineTo(x1 + ox * 3.5, y1 + oy * 3.5); x.stroke(); x.restore(); };
  line(W / 2 + (R() - .5) * 30, 0, W / 2 + (R() - .5) * 30, H); line(0, H / 2 + (R() - .5) * 40, W, H / 2 + (R() - .5) * 40);
}
function coffee(x, cx, cy, r, R) { x.save(); for (let k = 0; k < 3; k++) { x.strokeStyle = `rgba(120,80,35,${.05 + R() * .05})`; x.lineWidth = 2 + R() * 5; x.beginPath(); const a0 = R() * 6.28; x.arc(cx + (R() - .5) * 5, cy + (R() - .5) * 5, r * (1 - k * .025), a0, a0 + 4.6 + R() * 1.6); x.stroke(); } x.restore(); }
function burn(x, W, H, a = .3) { const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .6); g.addColorStop(0, 'rgba(110,75,30,0)'); g.addColorStop(1, `rgba(110,75,30,${a})`); x.fillStyle = g; x.fillRect(0, 0, W, H); }
function printLines(x, W, H, R, a = .1, cols = 4) {
  const gw = W / cols; x.fillStyle = `rgba(40,32,22,${a})`;
  for (let c0 = 0; c0 < cols; c0++) { let y = 30 + R() * 40; const x0 = c0 * gw + 16, w = gw - 32;
    while (y < H - 30) { if (R() < .05) { x.save(); x.globalAlpha = .7; x.fillRect(x0, y, w, 90 + R() * 160); x.restore(); y += 260; continue; }
      if (R() < .05) { x.fillRect(x0, y, w * (.5 + R() * .4), 14); y += 30; continue; } x.fillRect(x0, y, R() < .12 ? w * (.3 + R() * .5) : w, 3.6); y += 10; if (R() < .06) y += 12; } }
}
export function paperTex(W, H, seed, kind = 'aged') {
  const c = mk(W, H), x = c.getContext('2d'), R = rng(seed);
  const BASE = { news: '#E4D9C0', kraft: C.kraft, dark: C.dark, white: '#F3EEE2', grey: '#DCD6CC', crumpled: '#F2EDE2', cork: '#B98A5E', wood: '#6E4C31' };
  x.fillStyle = BASE[kind] || '#EAE0CB'; x.fillRect(0, 0, W, H);
  if (kind === 'cork' || kind === 'wood') {             // سطح: لوحة فلّين أو طاولة خشب، مع إضاءة لمبة
    texFill(x, kind, 0, 0, W, H, { op: 'source-over', scale: kind === 'wood' ? 1.9 : 1.15, seed });
    if (kind === 'cork') { x.fillStyle = 'rgba(40,22,8,.35)'; for (let i = 0; i < 70; i++) { x.beginPath(); x.arc(R() * W, R() * H, 1.5 + R() * 2, 0, 6.28); x.fill(); } }
    const g = x.createRadialGradient(W * .45, H * .35, 50, W * .5, H * .45, Math.hypot(W, H) * .65); g.addColorStop(0, 'rgba(255,225,170,.18)'); g.addColorStop(1, 'rgba(15,8,2,.55)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (kind === 'wood') coffee(x, W * (.7 + R() * .2), H * (.75 + R() * .15), 70 + R() * 30, R);
    return c;
  }
  if (kind === 'map') { x.drawImage(mapTex(W, H, seed), 0, 0); texFill(x, 'crumple', 0, 0, W, H, { scale: 1.9, alpha: .55, seed }); burn(x, W, H, .3); return c; }
  if (kind === 'kraft') texFill(x, 'kraft', 0, 0, W, H, { op: 'source-over', scale: 1.4, seed });
  if (kind === 'grey') texFill(x, 'grey', 0, 0, W, H, { op: 'source-over', scale: 1.4, seed });
  noiseFill(x, W, H, R, kind === 'dark' ? 10 : 8);
  if (kind !== 'dark') { texFill(x, 'grain', 0, 0, W, H, { scale: 1.1, alpha: .85, seed }); texFill(x, 'crumple', 0, 0, W, H, { scale: 1.9, alpha: kind === 'crumpled' ? 1 : .42, seed: seed + 3 }); }
  if (kind === 'news') printLines(x, W, H, R, .11, W > H ? 6 : 4);
  fibers(x, W, H, R, Math.round(W * H / 2200), kind === 'dark' ? '#000' : '#6b5636', kind === 'dark' ? .25 : .08);
  stains(x, W, H, R, 6, kind === 'white' ? .5 : 1);
  if (kind !== 'dark') folds(x, W, H, R);
  if (kind === 'aged' || kind === 'news') coffee(x, W * (.12 + R() * .3), H * (.6 + R() * .3), 60 + R() * 50, R);
  burn(x, W, H, kind === 'dark' ? .5 : .28);
  return c;
}
// خريطة ملوّنة بالكود
export function mapTex(W, H, seed, labels = []) {
  const c = mk(W, H), x = c.getContext('2d'), R = rng(seed);
  x.fillStyle = '#EDE3C8'; x.fillRect(0, 0, W, H); noiseFill(x, W, H, R, 10);
  x.fillStyle = '#9EC3C9'; x.beginPath(); const side = R() < .5; x.moveTo(side ? W : 0, 0); let px = side ? W * (.6 + R() * .15) : W * (.25 + R() * .15);
  for (let y = 0; y <= H; y += 18) { px += (R() - .5) * 40; x.lineTo(px, y); } x.lineTo(side ? W : 0, H); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(60,110,120,.35)'; x.lineWidth = 2; x.stroke();
  x.fillStyle = 'rgba(140,175,110,.55)'; for (let i = 0; i < 6; i++) { x.beginPath(); const cx = R() * W, cy = R() * H; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, r = 30 + R() * 60; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.fill(); }
  x.strokeStyle = 'rgba(120,100,70,.35)'; x.lineWidth = 1.5; for (let i = 0; i < 70; i++) { const y = R() * H, x0 = R() * W; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + (R() - .5) * 300, y + (R() - .5) * 60); x.stroke(); }
  for (let i = 0; i < 5; i++) { x.beginPath(); let a = R() * W, b = 0; x.moveTo(a, b); while (b < H) { a += (R() - .5) * 120; b += 60 + R() * 60; x.lineTo(a, b); }
    x.strokeStyle = '#B8574A'; x.lineWidth = 7; x.stroke(); x.strokeStyle = '#F0D27A'; x.lineWidth = 4; x.stroke(); }
  x.fillStyle = '#3a2f22'; x.font = `700 ${Math.round(W / 30)}px ${HEAD}`; labels.forEach((l, i) => { x.fillText(l, W * (.15 + R() * .6), H * (.2 + i * .25)); });
  fibers(x, W, H, R, 400, '#6b5636', .08); folds(x, W, H, R); burn(x, W, H, .2);
  return c;
}
let BG = {};
export function buildCollage(DW, DH) { BG = {}; ['aged', 'news', 'kraft', 'dark', 'white', 'grey', 'crumpled', 'cork', 'wood', 'map'].forEach((k, i) => { BG[k] = [0, 1].map(j => paperTex(DW, DH, 40 + i * 7 + j, k)); }); BG.map = [mapTex(DW, DH, 91), mapTex(DW, DH, 92)]; }
export function paperBG(ctx, kind, seed, DW, DH) { const v = BG[kind] || BG.aged; if (v) ctx.drawImage(v[(seed | 0) % v.length], 0, 0, DW, DH); }
export function mapCanvas(seed) { return BG.map ? BG.map[seed % 2] : null; }

// ---------- الصور ----------
const PREP = new Map();
export function prep(src, { bw = null, border = 16, outline = null, max = 1000, torn = null, key = '' } = {}) {
  if (!src) return null; outline = outline ?? OPT.outline; const ht = OPT.halftone;
  const k = (src.src || key || src.width + 'x' + src.height) + '|' + bw + '|' + border + '|' + outline + '|' + max + '|' + torn + '|' + ht; if (PREP.has(k)) return PREP.get(k);
  let iw = src.naturalWidth || src.width || 600, ih = src.naturalHeight || src.height || 600; const sc = Math.min(max / Math.max(iw, ih), Math.max(iw, ih) < 300 ? 4 : 1);
  iw = Math.round(iw * sc); ih = Math.round(ih * sc); const ow = outline && outline !== 'none' && border > 0 ? Math.round(border * .55) : 0, pad = border + ow + 10, W = iw + pad * 2, H = ih + pad * 2;
  const a = mk(W, H), x = a.getContext('2d'); x.drawImage(src, pad, pad, iw, ih);
  const id = x.getImageData(0, 0, W, H), d = id.data;
  const op = [[pad + 2, pad + 2], [pad + iw - 3, pad + 2], [pad + 2, pad + ih - 3], [pad + iw - 3, pad + ih - 3]].every(([px, py]) => d[(py * W + px) * 4 + 3] > 250);
  if (bw) {
    const cell = 5.5, ca = Math.SQRT1_2, R = rng(iw + ih);
    for (let y = 0; y < H; y++) for (let x0 = 0; x0 < W; x0++) { const i = (y * W + x0) * 4; if (!d[i + 3]) continue;
      let l = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; l = cl((l - 128) * 1.25 + 136, 0, 255);
      if (ht > 0) { const u = (x0 * ca + y * ca) / cell, v = (-x0 * ca + y * ca) / cell, dist = Math.hypot(u - Math.floor(u) - .5, v - Math.floor(v) - .5), r = Math.sqrt(1 - l / 255) * .62; l = l * (1 - ht) + (dist < r ? 20 : 250) * ht; }
      l += (R() - .5) * 14; d[i] = cl(l + 8, 0, 255); d[i + 1] = cl(l + 3, 0, 255); d[i + 2] = cl(l * .92, 0, 255); }
    x.putImageData(id, 0, 0);
  }
  if (op || torn) { const m = mk(W, H), mx = m.getContext('2d'); irregularPath(mx, pad, pad, iw, ih, (torn || 1) * 13 + iw, (torn || 1) * 13 + 5, 4, 14, .5); mx.fill(); x.globalCompositeOperation = 'destination-in'; x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-over'; }
  const out = mk(W, H), o = out.getContext('2d');
  if (border > 0) {
    const sil = (col) => { const s = mk(W, H), q = s.getContext('2d'); q.drawImage(a, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = col; q.fillRect(0, 0, W, H); return s; };
    const ring = (cv, r, seed) => { const R = rng(seed); for (let n = 0; n < 32; n++) { const an = n / 32 * 6.283, rr = r * (.82 + R() * .36); o.drawImage(cv, Math.cos(an) * rr, Math.sin(an) * rr); } };
    if (ow) ring(sil(outline === 'red' ? C.red : outline === 'black' ? C.ink : outline), border + ow, iw * 3 + 1);
    ring(sil(C.white), border, iw * 7 + ih); o.drawImage(sil(C.white), 0, 0);
  }
  o.drawImage(a, 0, 0);
  if (TX.crumple && border > 0) {                       // ورق الصورة: حبيبات + تجعيد حقيقي فوق الصورة وإطارها
    const tm = mk(W, H), q = tm.getContext('2d'); texFill(q, 'crumple', 0, 0, W, H, { op: 'source-over', scale: .75, seed: iw }); texFill(q, 'grain', 0, 0, W, H, { scale: .6, seed: ih });
    q.globalCompositeOperation = 'destination-in'; q.drawImage(out, 0, 0); o.save(); o.globalCompositeOperation = 'multiply'; o.globalAlpha = .6; o.drawImage(tm, 0, 0); o.restore(); }
  const res = { cv: out, w: W, h: H, pad }; PREP.set(k, res); return res;
}
export function softShadow(ctx, lift = 0, a = 1) { ctx.shadowColor = `rgba(35,22,8,${(.34 - lift * .1) * a})`; ctx.shadowBlur = 22 + lift * 40; ctx.shadowOffsetX = 8 + lift * 22; ctx.shadowOffsetY = 14 + lift * 34; }
export function photo(ctx, pr, cx, cy, { h = null, w = null, rot = 0, lift = 0 } = {}) {
  if (!pr) return { w: 0, h: 0 }; const k = h ? h / pr.h : w ? w / pr.w : 1, dw = pr.w * k, dh = pr.h * k;
  if (!pr.amb) { const k = .25, SP = 10, q = mk(pr.w * k + SP * 2, pr.h * k + SP * 2).getContext('2d'); q.filter = 'blur(3px)'; q.translate(SP, SP); q.drawImage(pr.cv, 0, 0, pr.w * k, pr.h * k);
    q.filter = 'none'; q.globalCompositeOperation = 'source-in'; q.fillStyle = 'rgb(35,22,8)'; q.fillRect(-SP, -SP, q.canvas.width, q.canvas.height); pr.amb = { c: q.canvas, k, SP }; }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(k, k); dropSprite(ctx, pr.amb, pr.w, pr.h, 8 + lift * 22, 14 + lift * 34, .34 - lift * .1, 1 + lift * .05); ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.drawImage(pr.cv, -dw / 2, -dh / 2, dw, dh); QA.rect(ctx, 'body', 'photo', -dw / 2 + pr.pad * k, -dh / 2 + pr.pad * k, dw / 2 - pr.pad * k, dh / 2 - pr.pad * k); ctx.restore(); if (lift > .02) MOTION.busy = true;
  return { w: dw, h: dh };
}
export function note(ctx, cx, cy, w, h, { rot = 0, seed = 1, fill = C.white, t = 0, lift = 0, kind = 'aged', lines = false, irr = 1 } = {}) {
  const s = seed * 31 + boil(t);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  sheet(ctx, w, h, s, fill, { lift, amp: 3.5, jag: 13, shape: seed * 31, irr, ikey: lines ? 'L' + seed : '', inner: lines ? c => { c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .5; const v = BG.news; if (v) c.drawImage(v[seed % 2], -w / 2 - (hash(seed) * 300), -h / 2 - (hash(seed + 1) * 500)); c.restore(); } : null });
  ctx.restore();
}

// ---------- دبوس نحاسي + خيط أحمر + شريط لاصق ----------
export function pin(ctx, x, y, { color = 'brass', r = 16, press = 1 } = {}) {
  if (press <= 0) return; const e = eo(cl(press)), lift = 1 - e; r *= 1 + lift * .7;
  ctx.save(); ctx.globalAlpha = cl(press * 4); { const sx = x + r * (.55 + lift), sy = y + r * (.75 + lift * 1.5), rr = r * 1.15 + 3 + lift * 7, g0 = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr); g0.addColorStop(0, `rgba(30,18,5,${.34 - lift * .15})`); g0.addColorStop(.6, `rgba(30,18,5,${.2 - lift * .1})`); g0.addColorStop(1, 'rgba(30,18,5,0)');
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(.6); ctx.scale(1, .72); ctx.translate(-sx, -sy); ctx.fillStyle = g0; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 6.28); ctx.fill(); ctx.restore(); } if (lift > .02) MOTION.busy = true;
  const brass = color === 'brass', c0 = brass ? '#FFF3C4' : '#FFD8D0', c1 = brass ? '#D7AE52' : '#C83A2C', c2 = brass ? '#6B4A16' : '#5A100A';
  ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(x + r * .08, y + r * .12, r, 0, 6.28); ctx.fill();
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r); g.addColorStop(0, c0); g.addColorStop(.35, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * .92, 0, 6.28); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x - r * .32, y - r * .38, r * .28, r * .16, -.6, 0, 6.28); ctx.fill();
  ctx.restore();
}
export function string(ctx, pts, prog, { color = C.red, width = 5, sag = 40, curl = false, seed = 1 } = {}) {
  if (prog <= 0 || pts.length < 2) return; const path = [], R = rng(seed);
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), N = Math.max(12, Math.round(L / 10)), q = sag * (.7 + R() * .6), w1 = (R() - .5) * 30;
    for (let j = 0; j <= N; j++) { const f = j / N; path.push([lerp(x0, x1, f) + Math.sin(f * Math.PI * 2) * w1, lerp(y0, y1, f) + Math.sin(f * Math.PI) * q]); } }
  if (curl) { const [ex, ey] = path[path.length - 1]; for (let j = 1; j <= 40; j++) { const a = j / 40 * Math.PI * 2.2, r = 26 * (1 - j / 60); path.push([ex + 20 + Math.cos(a + 3) * r + j * 1.5, ey + 26 + Math.sin(a + 3) * r]); } }
  const end = Math.max(1, Math.floor((path.length - 1) * cl(prog)));
  const stroke = (col, w, dx, dy) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i <= end; i++) { const [x, y] = path[i]; i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy); } ctx.stroke(); };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; stroke('rgba(30,15,5,.1)', width + 7, 5, 8); stroke('rgba(30,15,5,.16)', width + 2, 5, 8);
  stroke('#7A120D', width, 0, 0); stroke(color, width * .62, -.6, -.6); ctx.globalAlpha = .35; stroke('#F07060', width * .2, -1.2, -1.4); ctx.restore();
}
export function tape(ctx, cx, cy, w, rot = 0, seed = 3, { prog = 1 } = {}) {
  if (prog <= 0) return; const e = eo(cl(prog)), h = w * .32, R = rng(seed), lift = 1 - e; if (lift > .02) MOTION.busy = true;
  ctx.save(); ctx.translate(cx + lift * 160, cy - lift * 300); ctx.rotate(rot + lift * 1.3); ctx.scale(1 + lift * .35, 1 + lift * .35); ctx.globalAlpha = cl(prog * 3);
  const path = () => { ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); for (let i = 0; i <= 8; i++) ctx.lineTo(-w / 2 + (i % 2 ? 6 : 0) + (R() - .5) * 3, -h / 2 + i * h / 8);
    ctx.lineTo(w / 2, h / 2); for (let i = 8; i >= 0; i--) ctx.lineTo(w / 2 - (i % 2 ? 6 : 0) + (R() - .5) * 3, -h / 2 + i * h / 8); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(40,25,5,.2)'; ctx.shadowBlur = 5 + lift * 24; ctx.shadowOffsetY = 3 + lift * 24; path(); ctx.fillStyle = 'rgba(232,218,165,.72)'; ctx.fill(); ctx.restore();
  ctx.save(); path(); ctx.clip(); ctx.globalAlpha = .22; ctx.strokeStyle = '#fff'; for (let i = 0; i < 6; i++) { ctx.lineWidth = 1 + R() * 3; ctx.beginPath(); const y = -h / 2 + R() * h; ctx.moveTo(-w / 2, y); ctx.bezierCurveTo(-w / 6, y + (R() - .5) * 8, w / 6, y + (R() - .5) * 8, w / 2, y + (R() - .5) * 6); ctx.stroke(); }
  ctx.globalAlpha = .1; ctx.fillStyle = '#7a6230'; ctx.fillRect(-w / 2, h / 2 - 4, w, 4); ctx.restore();
  ctx.restore();
}

// ---------- النصوص ----------
export function fnt(fam, size, weight = 700) { return `${weight} ${size}px ${fam}`; }
export function tw(ctx, s, fam, size, weight = 700) { ctx.save(); ctx.font = fnt(fam, size, weight); const w = ctx.measureText(s).width; ctx.restore(); return w; }
export function txt(ctx, s, x, y, { fam = HEAD, size = 80, color = C.ink, align = 'center', weight = 700, dir = null, base = 'middle' } = {}) {
  ctx.save(); ctx.font = fnt(fam, size, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.direction = dir || (AR.test(s) ? 'rtl' : 'ltr'); ctx.fillText(s, x, y);
  if (QA.on) { const w = ctx.measureText(s).width, rtl = ctx.direction === 'rtl', right = align === 'right' || (align === 'start' && rtl) || (align === 'end' && !rtl), ax = align === 'center' ? x - w / 2 : right ? x - w : x; QA.rect(ctx, 'text', s, ax, y - size * .45, ax + w, y + size * .45); }
  ctx.restore();
}
export function typeLabel(ctx, s, cx, cy, { size = 46, rot = 0, seed = 5, fill = C.slip, color = C.ink, maxW = 900, t = 0, lift = 0 } = {}) {
  const fam = AR.test(s) ? HEAD : TYPE; let sz = size; while (tw(ctx, s, fam, sz, 400) > maxW - sz * 1.3 && sz > 20) sz -= 2;
  const w = tw(ctx, s, fam, sz, 400) + sz * 1.3, h = sz * (AR.test(s) ? 1.75 : 1.5);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  sheet(ctx, w, h, seed * 7 + boil(t), fill, { lift: lift * .8, amp: 2.2, jag: 10, crumple: .35, shape: seed * 7, irr: .55 });
  txt(ctx, s, 0, sz * .08, { fam, size: sz, color, weight: 400 });
  ctx.restore(); return w;
}
export function clipping(ctx, s, cx, cy, { size = 110, rot = 0, seed = 5, maxW = 940, t = 0, lift = 0, hl = null, color = C.ink, outline = true } = {}) {
  let sz = size; while (tw(ctx, s, SANS, sz, 900) > maxW - sz * .8 && sz > 30) sz -= 4;
  const w = tw(ctx, s, SANS, sz, 900) + sz * .8, h = sz * 1.55;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  sheet(ctx, w, h, seed * 5, '#E9E2D2', { lift, amp: 5, jag: 12, lip: !outline, outline: outline ? C.red : null, irr: .7, ikey: 'N' + seed, crumple: .45, inner: c => { c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .45; const v = BG.news; if (v) c.drawImage(v[seed % 2], -w / 2 - hash(seed) * 300, -h / 2 - hash(seed + 2) * 600); c.restore(); } });
  txt(ctx, s, 0, sz * .06, { fam: SANS, size: sz, weight: 900, color: hl === 'red' ? C.red : color });
  ctx.restore(); return { w, h, size: sz };
}
const STAMP = new Map();
function stampCanvas(s, size, color) {
  const k = s + size + color; if (STAMP.has(k)) return STAMP.get(k); const m = mk(4, 4).getContext('2d');
  const w = tw(m, s, SANS, size, 900) + size * 1.1, h = size * 1.75, pad = 20, c = mk(w + pad * 2, h + pad * 2), x = c.getContext('2d'); x.translate(pad, pad);
  x.strokeStyle = color; x.lineWidth = size * .12; x.strokeRect(size * .06, size * .06, w - size * .12, h - size * .12);
  x.lineWidth = size * .035; x.strokeRect(size * .24, size * .24, w - size * .48, h - size * .48);
  x.font = fnt(SANS, size, 900); x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = AR.test(s) ? 'rtl' : 'ltr'; x.fillText(s, w / 2, h / 2 + size * .06);
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-out'; const R = rng(s.length * 97 + size);
  for (let i = 0; i < (w * h) / 50; i++) { x.globalAlpha = .25 + R() * .75; x.beginPath(); x.arc(R() * c.width, R() * c.height, .6 + R() * 2.4, 0, 6.28); x.fill(); }
  const res = { c, w: c.width, h: c.height }; STAMP.set(k, res); return res;
}
export function stampBox(ctx, s, cx, cy, prog, { color = C.red, size = 64, rot = -.07 } = {}) {
  if (prog <= 0) return; const st = stampCanvas(s, size, color), e = MOTION.mode === 'twos' ? (prog < .34 ? 0 : prog < .67 ? .7 : 1) : eo(cl(prog)), k = 1 + (1 - e) * .6;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(k, k); ctx.globalAlpha = .35 + e * .55; ctx.drawImage(st.c, -st.w / 2, -st.h / 2); ctx.restore();
}
export function layoutWords(ctx, words, fam, size, maxW, gapK = .28) {
  const lines = []; let cur = [], cw = 0; const sp = size * gapK;
  words.forEach(wd => { const w = tw(ctx, wd, fam, size); if (cur.length && cw + sp + w > maxW) { lines.push({ ws: cur, w: cw }); cur = []; cw = 0; } cw += (cur.length ? sp : 0) + w; cur.push({ t: wd, w }); });
  if (cur.length) lines.push({ ws: cur, w: cw }); return lines;
}
export function headline(ctx, text, cx, cy, lt, { at = 0, every = 1 / 12, size = 140, maxW = 900, color = C.ink, hl = null, lineK = 1.22, seed = 1, times = null } = {}) {
  const words = text.split(/\s+/).filter(Boolean), rtl = AR.test(text);
  let sz = size, lines; for (;;) { lines = layoutWords(ctx, words, HEAD, sz, maxW); if (lines.length <= 3 || sz < 50) break; sz -= 8; }
  const lh = sz * lineK, y0 = cy - (lines.length - 1) * lh / 2; let k = 0; const boxes = [], D = .3 / (MOTION.speed || 1);
  lines.forEach((L, li) => { let x = rtl ? cx + L.w / 2 : cx - L.w / 2; const sp = sz * .28;
    L.ws.forEach(wd => { const a = times ? times[k] ?? at + k * every : at + k * every, p = P(lt, a, D); k++;
      const bx = rtl ? x - wd.w : x; x += rtl ? -(wd.w + sp) : wd.w + sp; if (lt < a) return; const e = eo(p), y = y0 + li * lh;
      if (hl === 'mustard' || hl === 'yellow') { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(214,170,60,.75)'; const hw = wd.w * cl(P(lt, a + .1, .3)); ctx.fillRect(rtl ? bx + wd.w - hw : bx, y - sz * .18, hw + 6, sz * .52); ctx.restore(); }
      ctx.save(); ctx.translate(bx + wd.w / 2, y + (1 - e) * 30); const sc = 1 + (1 - e) * .5; ctx.scale(sc, sc); ctx.globalAlpha = cl(p * 3); txt(ctx, wd.t, 0, sz * .02, { fam: HEAD, size: sz, color: hl === 'red' ? C.red : color }); ctx.restore();
      boxes.push({ x: bx, y, w: wd.w, h: sz }); }); });
  return { lines, size: sz, lh, y0, y1: y0 + (lines.length - 1) * lh, boxes };
}
export function ripLine(x0, y0, x1, y1, seed, amp = 34, step = 22) {
  const R = rng(seed), L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / step), nx = -(y1 - y0) / L, ny = (x1 - x0) / L, pts = []; let drift = 0;
  for (let i = 0; i <= n; i++) { const f = i / n; drift += (R() - .5) * amp * .5; drift *= .92; const o = drift + (R() - .5) * amp * .45; pts.push([lerp(x0, x1, f) + nx * o, lerp(y0, y1, f) + ny * o]); }
  return pts;
}
export function fiberEdge(ctx, pts, { width = 16, seed = 1 } = {}) {
  const R = rng(seed); ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [lw, al] of [[width + 22, .07], [width + 12, .1], [width + 4, .12]]) { ctx.strokeStyle = `rgba(30,20,8,${al})`; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + 6, y + 8) : ctx.moveTo(x + 6, y + 8))); ctx.stroke(); }
  ctx.strokeStyle = '#F6F2E8'; ctx.lineWidth = width; ctx.beginPath(); pts.forEach(([x, y], i) => { const j = (R() - .5) * width * .6; i ? ctx.lineTo(x + j, y + j) : ctx.moveTo(x, y); }); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i]; if (R() < .6) { const a = R() * 6.28, l = 4 + R() * 12; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); } }
  ctx.restore();
}

// ---------- QA (3): تسجيل مستطيلات النصوص والأوراق (بإحداثيات الشاشة) عشان نكشف التداخل ----------
export const QA = { on: false, list: [], seq: 0,
  rect(ctx, k, s, x0, y0, x1, y1) { if (!this.on) return; const m = ctx.getTransform(), P4 = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([a, b]) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]);
    const xs = P4.map(q => q[0]), ys = P4.map(q => q[1]); this.list.push({ k, s: String(s).slice(0, 40), x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), a: ctx.globalAlpha, n: this.seq++ }); } };

// ---------- قصاصة قريبة من الكاميرا (مغبّشة) تعبر وقت الـpan (6) ----------
const FG = new Map();
export function fgScrap(seed) {
  const k = seed % 3; if (FG.has(k)) return FG.get(k); const w = 420, h = 560, pad = 60, c = mk(w + pad * 2, h + pad * 2), x = c.getContext('2d');
  x.filter = 'blur(9px)'; x.translate(pad + w / 2, pad + h / 2); x.rotate((hash(k) - .5) * .4);
  x.save(); irregularPath(x, -w / 2, -h / 2, w, h, k * 17 + 3, k + 1, 8, 16, 1); x.fillStyle = '#E8DFC9'; x.fill(); x.clip();
  const v = BG.news; if (v) x.drawImage(v[k % 2], -w / 2 - 200, -h / 2 - 300); x.restore();
  FG.set(k, c); return c;
}

// ---------- غطا ملف كرافت (للانتقال folder) ----------
const FOLD = new Map();
export function folderCover(ctx, W, H, seed, label, side = 'front') {
  const key = side + W + 'x' + H + label + seed; let c = FOLD.get(key);
  if (!c) { c = mk(W + 40, H + 40); const x = c.getContext('2d'), tabW = W * .34, tabX = side === 'back' ? W * .08 : W * .58;
    x.translate(20, 20); const shape = () => { x.beginPath(); x.moveTo(0, 70); x.lineTo(tabX, 70); x.lineTo(tabX + 26, 0); x.lineTo(tabX + tabW - 26, 0); x.lineTo(tabX + tabW, 70); x.lineTo(W, 70); x.lineTo(W, H + 20); x.lineTo(0, H + 20); x.closePath(); };
    x.save(); shape(); x.fillStyle = side === 'inside' ? '#D8C49A' : side === 'back' ? '#B99E6C' : '#C9B07C'; x.fill(); x.clip();
    texFill(x, 'kraft', 0, 0, W, H + 20, { op: 'multiply', scale: 1.3, alpha: .9, seed }); texFill(x, 'crumple', 0, 0, W, H + 20, { scale: 1.8, alpha: .35, seed: seed + 3 });
    if (side !== 'inside') { x.strokeStyle = 'rgba(90,60,25,.25)'; x.lineWidth = 3; for (const yy of [140, 150]) { x.beginPath(); x.moveTo(40, yy); x.lineTo(W - 40, yy); x.stroke(); } }
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(60,35,10,.25)'); g.addColorStop(.12, 'rgba(60,35,10,0)'); g.addColorStop(1, 'rgba(255,240,200,.08)'); x.fillStyle = g; x.fillRect(0, 0, W, H + 20);
    x.restore();
    if (side === 'front') { // ملصق العنوان + ختم سري
      x.save(); x.translate(W / 2, H * .42); x.rotate(-.03); const lw = Math.min(W * .74, tw(x, label, HEAD, 92) + 120), lh = 170;
      irregularPath(x, -lw / 2, -lh / 2, lw, lh, seed + 9, seed, 3, 12, .4); x.fillStyle = '#F4EEDF'; x.fill(); x.strokeStyle = 'rgba(40,30,20,.5)'; x.lineWidth = 3; x.stroke();
      x.font = fnt(HEAD, 92, 700); x.fillStyle = C.ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'rtl'; x.fillText(label, 0, 8); x.restore();
      const st = stampCanvas('سري', 96, C.red); x.save(); x.translate(W * .66, H * .62); x.rotate(-.14); x.globalAlpha = .85; x.drawImage(st.c, -st.w / 2, -st.h / 2); x.restore(); }
    FOLD.set(key, c); }
  ctx.save(); ctx.shadowColor = 'rgba(20,12,4,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = -8; ctx.drawImage(c, -20, -20); ctx.restore();
}
