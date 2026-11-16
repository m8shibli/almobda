// اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
// vox.js — نواة الرسم: ورق ممزّق، halftone، حبيبات، حركة مقطّعة «على اثنين»، نص عربي، ماركر، أختام، عدّادات.
// كل شي حتمي: نفس الوقت = نفس الفريم. لا Math.random ولا Date.now.

export const PAL = { red: '#B8312A', cream: '#F1E6D0', paper: '#FBF7EE', navy: '#14213D', yellow: '#F2C230', ink: '#1B1B1B' };
export const FONT = `'Cairo', sans-serif`;

// ---------- الوقت والحركة ----------
export const POSES = 12;                       // 24fps على اثنين = 12 وضعية بالثانية
export const MOTION = { mode: 'smooth', speed: 1 };     // smooth = حركة ناعمة 24fps كاملة · twos = مقطّعة على اثنين (Vox الكلاسيكي)
export const step = t => (MOTION.mode === 'twos' ? Math.floor(t * POSES + 1e-6) / POSES : t);
export const boil = t => (MOTION.mode === 'twos' ? Math.floor(t * POSES + 1e-6) % 2 : 0);
export const pose = t => Math.floor(t * POSES + 1e-6);
export const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const P = (t, a, d) => cl((t - a) / d);  // تقدّم 0..1
export const eo = x => 1 - Math.pow(1 - x, 3);
export const eio = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const back = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const lerp = (a, b, x) => a + (b - a) * x;
export function hash(n) { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
export function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---------- نسيج الورق والحبيبات (تنحسب مرة وحدة) ----------
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let TEX = null;
export function buildTextures(W, H) {
  const R = rng(7);
  // ورق: ألياف + بقع خفيفة (multiply)
  const paper = mk(512, 512), p = paper.getContext('2d');
  p.fillStyle = '#fff'; p.fillRect(0, 0, 512, 512);
  const id = p.getImageData(0, 0, 512, 512), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = 236 + R() * 19; d[i] = v; d[i + 1] = v - 2; d[i + 2] = v - 6; }
  p.putImageData(id, 0, 0);
  p.globalAlpha = .07; p.strokeStyle = '#7a6a50';
  for (let i = 0; i < 260; i++) { const x = R() * 512, y = R() * 512, a = R() * 6.28, l = 6 + R() * 22; p.lineWidth = .6 + R(); p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
  p.globalAlpha = .022; p.fillStyle = '#6b5a3c';
  for (let i = 0; i < 40; i++) { p.beginPath(); p.arc(R() * 512, R() * 512, 8 + R() * 40, 0, 6.28); p.fill(); }
  // halftone: نقاط منتظمة مائلة 45°
  const ht = mk(24, 24), h = ht.getContext('2d');
  h.fillStyle = 'rgba(20,33,61,.22)'; h.beginPath(); h.arc(6, 6, 2.6, 0, 6.28); h.arc(18, 18, 2.6, 0, 6.28); h.fill();
  // حبيبات فيلم: 6 نسخ تتبدّل كل وضعية
  const grain = [];
  for (let k = 0; k < 6; k++) {
    const g = mk(384, 384), gx = g.getContext('2d'), gi = gx.createImageData(384, 384), gd = gi.data, Rg = rng(100 + k);
    for (let i = 0; i < gd.length; i += 4) { const v = Rg() * 255; gd[i] = gd[i + 1] = gd[i + 2] = v; gd[i + 3] = 34; }
    gx.putImageData(gi, 0, 0); grain.push(g);
  }
  // vignette
  const vig = mk(W, H), v = vig.getContext('2d'), gr = v.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .6);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(25,15,5,.42)'); v.fillStyle = gr; v.fillRect(0, 0, W, H);
  // قناع الأطراف (لتشتت الألوان على الأطراف فقط)
  const edge = mk(W, H), e = edge.getContext('2d'), ge = e.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .42, W / 2, H / 2, Math.hypot(W, H) * .55);
  ge.addColorStop(0, 'rgba(0,0,0,0)'); ge.addColorStop(1, 'rgba(0,0,0,1)'); e.fillStyle = ge; e.fillRect(0, 0, W, H);
  TEX = { paper, ht, grain, vig, edge, tmp: mk(W, H) };
  return TEX;
}

// ---------- أشكال الورق الممزّق ----------
// مسار مستطيل بحواف ممزّقة. boil = يتغيّر شوي كل وضعية (إحساس الرسم باليد)
export function tornPath(ctx, x, y, w, h, seed, amp = 7, jag = 16) {
  const R = rng(seed), pts = [];
  const side = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / jag)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    for (let i = 0; i < n; i++) { const f = i / n, o = (R() - .5) * 2 * amp; pts.push([lerp(x0, x1, f) + nx * o, lerp(y0, y1, f) + ny * o]); } };
  side(x, y, x + w, y); side(x + w, y, x + w, y + h); side(x + w, y + h, x, y + h); side(x, y + h, x, y);
  ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath();
}
export function paperFill(ctx, alpha = 1) {
  if (!TEX) return; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = alpha;
  ctx.fillStyle = ctx.createPattern(TEX.paper, 'repeat'); ctx.fill(); ctx.restore();
}
export function halftoneFill(ctx, alpha = 1) {
  if (!TEX) return; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = ctx.createPattern(TEX.ht, 'repeat'); ctx.fill(); ctx.restore();
}
// كرت ورق: ظل صغير + لون + نسيج. (cx,cy) = المركز
export function card(ctx, { cx, cy, w, h, rot = 0, seed = 1, fill = PAL.paper, shadow = .28, amp = 6, ht = false, t = 0 }) {
  const s = seed * 31 + boil(t);           // boil خفيف (بوضع twos بس)
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.save(); ctx.translate(9, 12); tornPath(ctx, -w / 2, -h / 2, w, h, s, amp); ctx.fillStyle = `rgba(30,20,10,${shadow})`; ctx.fill(); ctx.restore();
  tornPath(ctx, -w / 2, -h / 2, w, h, s, amp); ctx.fillStyle = fill; ctx.fill(); paperFill(ctx, .9); if (ht) halftoneFill(ctx, .8);
  ctx.restore();
}
// شريط لاصق
export function tape(ctx, cx, cy, w, rot, seed = 3) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); tornPath(ctx, -w / 2, -w * .16, w, w * .32, seed, 3, 9);
  ctx.fillStyle = 'rgba(242,194,48,.62)'; ctx.fill(); ctx.restore();
}

// ---------- النص ----------
export function font(size, weight = 900) { return `${weight} ${size}px ${FONT}`; }
export function textW(ctx, s, size, weight = 900) { ctx.save(); ctx.font = font(size, weight); const w = ctx.measureText(s).width; ctx.restore(); return w; }
export function text(ctx, s, x, y, { size = 80, color = PAL.ink, align = 'center', weight = 900, dir = 'rtl', base = 'middle' } = {}) {
  ctx.save(); ctx.font = font(size, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.direction = dir; ctx.fillText(s, x, y); ctx.restore();
}
// شريحة ورق ممزّقة عليها سطر (Kinetic statement). يرجّع العرض
export function strip(ctx, s, cx, cy, { size = 96, fill = PAL.paper, color = PAL.ink, rot = 0, seed = 5, pad = .45, t = 0, dir = 'rtl', maxW = 980 } = {}) {
  let sz = size; while (textW(ctx, s, sz) > maxW - sz * pad * 2 && sz > 30) sz -= 4;
  const w = textW(ctx, s, sz) + sz * pad * 2, h = sz * 1.55;
  card(ctx, { cx, cy, w, h, rot, seed, fill, shadow: .3, amp: 5, t });
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); text(ctx, s, 0, sz * .06, { size: sz, color, dir }); ctx.restore();
  return w;
}

// ---------- ماركر يدوي (دائرة/خط تحت/شطب) ----------
export function markerEllipse(ctx, cx, cy, rx, ry, prog, { color = PAL.red, width = 10, seed = 9 } = {}) {
  if (prog <= 0) return; const R = rng(seed), N = 60, end = Math.floor(N * 1.12 * prog), a0 = -2.2 + R() * .4;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= end; i++) { const f = i / N, a = a0 + f * 6.6, wob = 1 + Math.sin(f * 9 + seed) * .03 + (f > 1 ? (f - 1) * .25 : 0);
    const x = cx + Math.cos(a) * rx * wob, y = cy + Math.sin(a) * ry * wob; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.restore();
}
export function markerLine(ctx, x0, y0, x1, y1, prog, { color = PAL.red, width = 12, seed = 4 } = {}) {
  if (prog <= 0) return; const R = rng(seed), N = 20, end = Math.ceil(N * prog);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i <= end; i++) { const f = Math.min(1, i / N); const x = lerp(x0, x1, f), y = lerp(y0, y1, f) + (R() - .5) * width * .5; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.restore();
}
// ختم: يطيح من كبير لحجمه خلال 3 وضعيات
export function stamp(ctx, s, cx, cy, prog, { color = PAL.red, size = 58, rot = -.12, seed = 11 } = {}) {
  if (prog <= 0) return; const k = prog < .34 ? 1.7 : prog < .67 ? 1.15 : 1;
  const w = textW(ctx, s, size) + size * .9, h = size * 1.5;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(k, k); ctx.globalAlpha = prog < .34 ? .6 : .92;
  ctx.strokeStyle = color; ctx.lineWidth = size * .11; tornPath(ctx, -w / 2, -h / 2, w, h, seed, 2.5, 12); ctx.stroke();
  text(ctx, s, 0, size * .05, { size, color }); ctx.restore();
}
// صورة داخل كرت (تملأ الكرت مع هامش)
export function imgIn(ctx, im, cx, cy, w, h, pad = .1) {
  if (!im || !im.naturalWidth) return; const k = Math.min(w * (1 - pad * 2) / im.naturalWidth, h * (1 - pad * 2) / im.naturalHeight);
  const iw = im.naturalWidth * k, ih = im.naturalHeight * k; ctx.drawImage(im, cx - iw / 2, cy - ih / 2, iw, ih);
}

// ---------- طبقة الفيلم النهائية ----------
export function finish(ctx, c, t, W, H) {
  if (!TEX) return;
  // تشتت ألوان على الأطراف فقط
  const tmp = TEX.tmp, x = tmp.getContext('2d');
  for (const [dx, col] of [[4, 'rgb(255,0,0)'], [-4, 'rgb(0,90,255)']]) {
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); x.drawImage(c, dx, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(TEX.edge, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .35; ctx.drawImage(tmp, 0, 0); ctx.restore();
  }
  ctx.drawImage(TEX.vig, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(TEX.grain[pose(t) % 6], 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}
