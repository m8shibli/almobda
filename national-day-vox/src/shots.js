// اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
// shots.js — أنواع اللقطات بستايل «ملف التحقيق». كل لقطة: draw(ctx, lt, sh, env) + events(sh, env) للمؤثرات.
// lt = الوقت داخل اللقطة. env.at(i) = وقت الكلمة i داخل اللقطة.
// الحركة: العناصر «تنسحب» من برا الشاشة بسرعة (مع motion blur من المُركِّب) وتستقر بارتداد خفيف، أو «تنصفع» من فوق.
// الدبابيس تنضغط بعد ما تستقر الورقة، والشريط اللاصق يطير وينلصق.
import { P, eo, eio, lerp, hash, cl, rng, markerEllipse, markerLine, tornPath, MOTION, step } from './vox.js';
import { C, HEAD, SANS, OPT, mk, fnt, sheet, prep, photo, note, pin, string, tape, txt, tw, typeLabel, clipping, stampBox, headline, paperBG, mapCanvas } from './collage.js';

const SPD = () => MOTION.speed || 1;
const COL = { red: C.red, mustard: C.mustard, yellow: C.mustard, ink: C.ink, navy: C.navy, white: C.white, paper: C.paper, tan: C.tan, kraft: C.kraft, slip: C.slip };
const when = (env, w, i, gap = .3) => (w != null ? env.at(w) : .15 + i * gap / SPD());
const DIRS = [[1, 0], [-1, 0], [0, -1], [0, 1], [.8, -.6], [-.8, -.6]];
const backSoft = x => { const c = .9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
// دخول عنصر. kind: slide (من برا الشاشة) · slap (ينصفع من فوق) · drop (Vox الكلاسيكي على اثنين)
function enter(lt, a, seed, kind = 'slide', dist = 1100, dir = null) {
  if (lt < a) return { vis: false }; if (lt < a + .7 / SPD()) MOTION.busy = true;
  if (MOTION.mode === 'twos') { const p = P(lt, a, .25); return { vis: true, x: 0, y: (1 - backSoft(p)) * -240, r: (1 - eo(p)) * (hash(seed) - .5) * .5, k: 1, lift: 1 - p, skew: 0, p }; }
  if (kind === 'slap') { const p = P(lt, a, .3 / SPD()), e = eo(p); return { vis: true, x: 0, y: 0, r: (1 - e) * (hash(seed) - .5) * .3, k: 1 + (1 - e) * .32, lift: 1 - e, skew: 0, p, a: cl(p * 12) }; }
  const p = P(lt, a, .62 / SPD()), e = backSoft(p), [dx, dy] = dir || DIRS[Math.floor(hash(seed * 7 + 3) * 4)], m = 1 - e;
  return { vis: true, x: dx * m * dist, y: dy * m * dist, r: m * (hash(seed) - .5) * .7, k: 1 + (1 - eo(p)) * .05, lift: 1 - eo(p), skew: (1 - eo(p)) * .22 * (dx || dy), p };
}
const isLogo = f => /\.svg$/i.test(f || '');
// مصدر الصورة: ملف، أو خريطة بالكود 'map:1'
function srcOf(env, f, cut) { if (!f) return null; if (f.startsWith('map:')) return mapCanvas(+f.slice(4) || 0); return (cut !== false && env.IMG[f + '#cut']) || env.IMG[f]; }
// لون/أبيض وأسود: الشعارات دايماً بألوانها. مكس = الصور أبيض وأسود والخرائط/لقطات الشاشة (color:true) ملوّنة
function isBW(f, o) { if (isLogo(f)) return false; if (o.bw != null) return o.bw; if (OPT.images === 'bw') return true; if (OPT.images === 'color') return false; return !(o.color || f.startsWith('map:')); }
// قص تلقائي (10): إذا فيه نسخة _cut.png (من tools/cutout.py) تنستخدم، والإطار الأبيض يمشي على حدود الشخص/المنتج كأنه مقصوص بمقص
const pic = (env, f, o = {}) => { const im = srcOf(env, f, o.cut); if (!im) return null; return prep(im, { bw: isBW(f, o), border: o.border ?? (isLogo(f) ? 22 : 16), outline: o.outline, torn: o.torn ?? null, key: f + (im === env.IMG[f] ? '' : '#cut') }); };
const fitH = (pr, w, h) => (pr ? Math.min(h, w * pr.h / pr.w) : h);
function T(ctx, d, cx, cy) { ctx.translate(cx + d.x, cy + d.y); if (d.skew) ctx.transform(1, d.skew * .3, d.skew, 1, 0, 0); ctx.scale(d.k, d.k); if (d.a != null) ctx.globalAlpha = d.a; }

function grid(n, cols, box, gap = 34) {
  cols = cols || (n <= 1 ? 1 : n <= 4 ? 2 : 3); const rows = Math.ceil(n / cols);
  const w = (box.x1 - box.x0 - gap * (cols - 1)) / cols, h = Math.min(w * 1.05, (box.y1 - box.y0 - gap * (rows - 1)) / rows);
  const top = (box.y0 + box.y1) / 2 - (rows * h + (rows - 1) * gap) / 2, out = [];
  for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
    const left = (box.x0 + box.x1) / 2 - (inRow * w + (inRow - 1) * gap) / 2;
    out.push({ cx: left + (inRow - 1 - c) * (w + gap) + w / 2, cy: top + r * (h + gap) + h / 2, w, h }); }
  return out;
}
// عنصر على اللوحة. phase: 0 = الجسم، 1 = الشريط المكتوب والدبوس، 2 = الاثنين
function item(ctx, env, it, cx, cy, w, h, lt, a, seed, phase = 2) {
  const d = enter(lt, a, seed, it.img ? 'slide' : 'slap'); if (!d.vis) return null; const rot = (hash(seed * 3) - .5) * .09 + d.r, pr = pic(env, it.img, it);
  let ih = h, iw = w; if (pr) { ih = fitH(pr, w, h * (it.label ? .82 : 1)); iw = ih * pr.w / pr.h; } else { h = Math.min(h, w * .62); ih = h * .8; }
  const oy = pr && it.label ? -h * .07 : 0;
  ctx.save(); T(ctx, d, cx, cy);
  if (phase !== 1) { if (pr) photo(ctx, pr, 0, oy, { h: ih, rot, lift: d.lift });
    else { note(ctx, 0, 0, w, ih, { rot, seed: seed * 5, fill: COL[it.fill] || C.white, t: lt, lift: d.lift, lines: it.lines });
      let sz = it.size || Math.min(w * .2, 92); while (tw(ctx, it.text || it.label, HEAD, sz) > w * .84 && sz > 22) sz -= 2;
      ctx.save(); ctx.rotate(rot); txt(ctx, it.text || it.label, 0, 0, { size: sz, color: it.fill === 'ink' || it.fill === 'red' || it.fill === 'navy' ? C.white : C.ink }); if (it.sub) txt(ctx, it.sub, 0, sz * .9, { fam: `'Type'`, size: sz * .42, weight: 400 }); ctx.restore(); }
    if (it.tape !== false && !it.pin) tape(ctx, (hash(seed) - .5) * iw * .3, oy - ih / 2 + 4, Math.min(190, w * .42), (hash(seed + 1) - .5) * .6, seed, { prog: P(lt, a + .32 / SPD(), .3 / SPD()) }); }
  if (phase !== 0) { if (it.pin) pin(ctx, 0, oy - ih / 2 + 30, { press: P(lt, a + .35 / SPD(), .22 / SPD()) });
    if (pr && it.label) { const la = a + .4 / SPD(), ld = enter(lt, la, seed + 9, 'slap'); if (ld.vis) { ctx.save(); ctx.translate(0, ih / 2 + oy - 6); ctx.scale(ld.k, ld.k); typeLabel(ctx, it.label, (hash(seed + 2) - .5) * w * .15, 0, { size: Math.min(62, w * .15), rot: (hash(seed + 4) - .5) * .08, seed, maxW: w * 1.05, t: lt, lift: ld.lift }); ctx.restore(); } } }
  ctx.restore();
  return { x: cx, y: cy + oy - ih / 2 + 30, w: iw, h: ih };
}

export const SHOTS = {
  // ① عنوان: قصاصات جرايد عريضة بحد أحمر تنسحب من الجنب (style:'serif' = كلمات serif كبيرة كلمة كلمة)
  statement: {
    draw(ctx, lt, sh, env) {
      const L = sh.lines, maxW = env.box.x1 - env.box.x0, dark = sh.bg === 'dark';
      if (sh.kicker) { const a = when(env, sh.kicker.w, 0) - .1, d = enter(lt, a, sh.seed + 50, 'slap'); if (d.vis) { ctx.save(); T(ctx, d, env.cx, env.box.y0 + 40); typeLabel(ctx, sh.kicker.t, 0, 0, { size: 52, rot: -.02, seed: sh.seed, t: lt, lift: d.lift }); ctx.restore(); } }
      if (sh.style === 'serif') {
        const size = sh.size || (env.portrait ? 150 : 128); let total = 0; const blocks = L.map(l => { const n = Math.max(1, Math.ceil(tw(ctx, l.t, HEAD, l.size || size) / maxW)); const h = n * (l.size || size) * 1.22; total += h; return h; });
        let y = env.cy - total / 2 + (sh.kicker ? 40 : 0);
        L.forEach((l, i) => { const r = headline(ctx, l.t, env.cx, y + blocks[i] / 2, lt, { at: when(env, l.w, i), size: l.size || size, maxW, hl: l.hl, seed: sh.seed * 9 + i, times: l.ws && l.ws.map(w => env.at(w)), color: dark ? C.paper : C.ink }); y += blocks[i]; });
        if (sh.stamp) stampBox(ctx, sh.stamp.t, env.cx + .2 * maxW, y + 90, P(lt, when(env, sh.stamp.w, L.length), .3), { color: COL[sh.stamp.c] || C.red, size: sh.stamp.size || 92 });
        return;
      }
      const size = sh.size || (env.portrait ? 118 : 104), gap = size * 2.05, y0 = env.cy - (L.length - 1) * gap / 2 + (sh.kicker ? 40 : 0);
      L.forEach((l, i) => { const a = l.ws ? env.at(l.ws[0]) : when(env, l.w, i), d = enter(lt, a, sh.seed + i, 'slide', 1300, [i % 2 ? -1 : 1, 0]); if (!d.vis) return;
        ctx.save(); T(ctx, d, env.cx + (i % 2 ? -1 : 1) * 18, y0 + i * gap); clipping(ctx, l.t, 0, 0, { size: l.size || size, rot: (hash(sh.seed * 7 + i) - .5) * .07 + d.r * .4, seed: sh.seed * 13 + i, maxW, t: lt, lift: d.lift, hl: l.hl, outline: l.outline !== false }); ctx.restore();
        if (l.tape !== false) tape(ctx, env.cx + (i % 2 ? -1 : 1) * maxW * .36, y0 + i * gap - size * .7, 150, (i % 2 ? -.5 : .5), sh.seed + i, { prog: P(lt, a + .35 / SPD(), .3 / SPD()) }); });
      if (sh.stamp) { const a = when(env, sh.stamp.w, L.length); stampBox(ctx, sh.stamp.t, env.cx + (sh.stamp.x ?? .22) * maxW, y0 + (L.length - .35) * gap + size * .2, P(lt, a, .3 / SPD()), { color: COL[sh.stamp.c] || C.red, size: sh.stamp.size || 88, rot: -.09 }); }
    },
    events(sh, env) { const e = []; if (sh.kicker) e.push(['paper', when(env, sh.kicker.w, 0) - .1]); sh.lines.forEach((l, i) => { const a = l.ws ? env.at(l.ws[0]) : when(env, l.w, i); e.push(['slide', a]); e.push(['paper', a + .4 / SPD()]); if (l.tape !== false && sh.style !== 'serif') e.push(['tape', a + .4 / SPD()]); }); if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, sh.lines.length)]); return e; },
  },

  // ② كروت: صور مقصوصة/قصاصات مع شريط لاصق وشريط مكتوب. ختم أو شطب لكل واحد
  cards: {
    draw(ctx, lt, sh, env) {
      const n = sh.items.length, b = env.box, bw = b.x1 - b.x0, bh = b.y1 - b.y0;
      const G = env.portrait && !sh.cols && n <= 4 ? Array.from({ length: n }, (_, i) => ({ cx: b.x0 + bw * (i % 2 ? .34 : .66), cy: b.y0 + bh * ((i + .5) / n), w: bw * .7, h: bh / n * 1.75 })) : grid(n, sh.cols, b, 50);
      const R = sh.free ? G.map(g => ({ ...g, w: g.w * .92, h: g.h * .92 })) : relax(env, sh.items, G.map(g => ({ cx: g.cx, cy: g.cy, w: g.w * .92, h: g.h * .92 })), { key: sh });
      sh.items.forEach((it, i) => { const g = R[i]; item(ctx, env, it, g.cx, g.cy, g.w, g.h, lt, when(env, it.w, i), sh.seed * 17 + i, 0); });
      sh.items.forEach((it, i) => { const g = R[i], a = when(env, it.w, i); item(ctx, env, it, g.cx, g.cy, g.w, g.h, lt, a, sh.seed * 17 + i, 1);
        if (it.stamp) stampBox(ctx, it.stamp, g.cx - g.w * .3, g.cy - g.h * .22, P(lt, when(env, it.sw, i + .5), .3 / SPD()), { size: Math.min(66, g.w * .14), color: COL[it.sc] || C.red, rot: -.1 + hash(i) * .1 });
        if (it.strike) markerLine(ctx, g.cx + g.w * .36, g.cy - g.h * .12, g.cx - g.w * .36, g.cy + g.h * .16, P(lt, when(env, it.kw, i + .5), .33), { seed: i + 2, width: 14 }); });
    },
    events(sh, env) { const e = []; sh.items.forEach((it, i) => { const a = when(env, it.w, i); e.push([it.img ? 'slide' : 'paper', a]); e.push([it.pin ? 'pin' : 'tape', a + .35 / SPD()]); if (it.stamp) e.push(['stamp', when(env, it.sw, i + .5)]); if (it.strike) e.push(['marker', when(env, it.kw, i + .5)]); }); return e; },
  },

  // ③ لوحة تحقيق: عناصر مدبّسة، والخيط الأحمر يوصل بينها بالترتيب
  // الكاميرا (2) تتبع الخيط: تقرّب على كل عنصر لحظة دخوله، وبعد آخر عنصر ترجع تبين اللوحة كاملة. sh.cam = false يلغيها
  board: {
    lay(sh, env) { const b = env.box, bw = b.x1 - b.x0, bh = b.y1 - b.y0, sz = sh.size || (env.portrait ? .46 : .28);
      const auto = env.portrait ? [[.7, .14], [.3, .36], [.7, .58], [.3, .8], [.7, .98], [.3, .1]] : [[.15, .3], [.4, .7], [.62, .28], [.86, .66], [.5, .5], [.85, .2]];
      const G = sh.items.map((it, i) => { const [fx, fy] = it.at || auto[i % auto.length]; return { cx: b.x0 + fx * bw, cy: b.y0 + fy * bh, w: bw * sz, h: bw * sz * .95 }; });
      return sh.free ? G : relax(env, sh.items.map(it => ({ ...it, pin: false })), G, { key: sh, overlap: .14 }); },
    cam(lt, sh, env) { const G = this.lay(sh, env), ts = sh.items.map((it, i) => when(env, it.w, i, .5)), k = sh.camK || 1.24, K = [{ x: env.DW / 2, y: env.DH / 2, k: 1 }], fy = g => g.cy + g.h * .3;   // نطالع تحت العنصر شوي عشان شريطه ما يروح تحت الكابشن
      G.forEach((g, i) => { if (!i) K.push({ t: ts[0] - .15, x: lerp(env.DW / 2, g.cx, .75), y: fy(g), k, d: .6 }); else K.push({ t: ts[i] - .12, x: lerp(env.DW / 2, lerp(G[i - 1].cx, g.cx, .7), .75), y: lerp(fy(G[i - 1]), fy(g), .7), k, d: .55 }); });
      const out = Math.min(ts[ts.length - 1] + 1.5 / SPD(), sh.stamp ? when(env, sh.stamp.w, sh.items.length) - .4 : 1e9); K.push({ t: out, x: env.DW / 2, y: env.DH / 2, k: 1, d: .9 }); return camTrack(lt, K); },
    draw(ctx, lt, sh, env) {
      const b = env.box, G = this.lay(sh, env), pts = [], ts = [];
      sh.items.forEach((it, i) => { const g = G[i], a = when(env, it.w, i, .5);
        const r = item(ctx, env, { ...it, pin: false, tape: false }, g.cx, g.cy, g.w, g.h, lt, a, sh.seed * 13 + i);
        pts.push([g.cx, r ? r.y : g.cy - g.h * .4]); ts.push(a); });
      for (let i = 1; i < pts.length; i++) { const a = ts[i] + .45 / SPD(), p = P(lt, a, .45 / SPD()); if (p > 0) string(ctx, [pts[i - 1], pts[i]], eo(p), { seed: sh.seed + i, curl: i === pts.length - 1 && sh.curl !== false }); }
      pts.forEach((q, i) => pin(ctx, q[0], q[1], { press: P(lt, ts[i] + .38 / SPD(), .22 / SPD()) }));
      if (sh.stamp) stampBox(ctx, sh.stamp.t, env.cx, b.y1 - 40, P(lt, when(env, sh.stamp.w, n), .3 / SPD()), { size: 90, rot: -.06 });
    },
    events(sh, env) { const e = []; sh.items.forEach((it, i) => { const a = when(env, it.w, i, .5); e.push(['slide', a]); e.push(['pin', a + .38 / SPD()]); if (i) e.push(['string', a + .45 / SPD()]); }); if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, sh.items.length)]); return e; },
  },

  // ④ بطل اللقطة: صورة كبيرة بالنص، والعالم وراه يتبدّل على الكلمات
  hero: {
    draw(ctx, lt, sh, env) {
      const sc = sh.scenes || [];
      sc.forEach((s, i) => { const a = i === 0 ? -1 : when(env, s.w, i, .8); if (lt < a) return; const p = i === 0 ? 1 : eo(P(lt, a, .35 / SPD())), pr = pic(env, s.img, { border: 0, color: s.color, bw: s.bw });
        if (!pr) return; ctx.save(); const R = 40, y = env.DH * (1 - p);
        if (i > 0) { tornPath(ctx, -R, y - R, env.DW + R * 2, env.DH + R * 2, sh.seed + i * 7, 24, 36); ctx.clip(); }
        const k = Math.max(env.DW / pr.w, env.DH / pr.h) * (1.06 - .06 * p); ctx.drawImage(pr.cv, env.DW / 2 - pr.w * k / 2, env.DH / 2 - pr.h * k / 2, pr.w * k, pr.h * k); ctx.restore(); });
      const a = when(env, sh.w0, 0), d = enter(lt, a, sh.seed, 'slap'), pr = pic(env, sh.img, sh); if (!d.vis || !pr) return;
      const h = sh.h || (env.box.y1 - env.box.y0) * .92, ph = fitH(pr, (env.box.x1 - env.box.x0) * 1.02, h);
      ctx.save(); T(ctx, d, env.cx, env.cy + 20); photo(ctx, pr, 0, 0, { h: ph, rot: d.r * .4 + (sh.rot || 0), lift: d.lift }); ctx.restore();
      if (sh.label) { const la = when(env, sh.label.w, 1), ld = enter(lt, la, sh.seed + 3, 'slap'); if (ld.vis) { ctx.save(); T(ctx, ld, env.cx, env.cy + ph / 2 - 10); typeLabel(ctx, sh.label.t, 0, 0, { size: 76, rot: -.03, seed: sh.seed, t: lt, lift: ld.lift }); ctx.restore(); } }
      if (sh.stamp) stampBox(ctx, sh.stamp.t, env.cx + (env.box.x1 - env.box.x0) * .22, env.cy - ph * .3, P(lt, when(env, sh.stamp.w, 2), .3 / SPD()), { size: 90, rot: .08 });
    },
    events(sh, env) { const e = [['paper', when(env, sh.w0, 0)]]; (sh.scenes || []).forEach((s, i) => { if (i) e.push(['tear', when(env, s.w, i, .8)]); }); if (sh.label) e.push(['paper', when(env, sh.label.w, 1)]); if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, 2)]); return e; },
  },

  // ⑤ قبل / بعد
  beforeafter: {
    draw(ctx, lt, sh, env) {
      const w = (env.box.x1 - env.box.x0) * 1.02, h = w * .9, cx = env.cx, cy = env.cy + 30, a = when(env, sh.w0, 0), d = enter(lt, a, sh.seed);
      if (!d.vis) return; const f = when(env, sh.w, 1), fp = P(lt, f - .15, .3), after = lt >= f, side = after ? sh.after : sh.before;
      const pr = pic(env, side.img, side), ph = pr ? fitH(pr, w, h) : h;
      ctx.save(); T(ctx, d, cx, cy);
      if (pr) photo(ctx, pr, 0, 0, { h: ph, rot: d.r + (after ? .02 : -.02), lift: d.lift }); else note(ctx, 0, 0, w, h, { rot: d.r, seed: sh.seed * 5 + (after ? 1 : 0), fill: COL[side.fill] || C.white, t: lt, lift: d.lift });
      if (side.text) { if (pr) typeLabel(ctx, side.text, 0, ph * .45, { size: 84, seed: sh.seed + (after ? 1 : 0), t: lt }); else txt(ctx, side.text, 0, 0, { size: side.size || 130 }); }
      tape(ctx, -w * .3, -ph / 2 + 4, 170, -.5, sh.seed, { prog: P(lt, a + .35, .3) });
      ctx.restore();
      const sy = Math.abs(Math.cos(fp * Math.PI)), chip = fp < .5 ? sh.before.chip : sh.after.chip;
      ctx.save(); ctx.translate(cx + w * .2, cy - ph / 2 - 10); ctx.scale(1, Math.max(.06, sy)); stampBox(ctx, chip, 0, 0, P(lt, a + .3, .3), { size: 100, color: fp < .5 ? C.ink : C.red, rot: -.06 }); ctx.restore();
      if (after && sh.after.stamp) stampBox(ctx, sh.after.stamp, cx - w * .26, cy - ph * .3, P(lt, f + .1, .3), { size: 80, rot: .07 });
      if (!after && sh.before.strike != null) markerLine(ctx, cx + w * .4, cy - h * .25, cx - w * .4, cy + h * .25, P(lt, env.at(sh.before.strike), .33), { width: 14 });
    },
    events(sh, env) { const e = [['slide', when(env, sh.w0, 0)], ['tape', when(env, sh.w0, 0) + .35], ['flip', when(env, sh.w, 1) - .15]]; if (sh.after.stamp) e.push(['stamp', when(env, sh.w, 1) + .1]); if (sh.before.strike != null) e.push(['marker', env.at(sh.before.strike)]); return e; },
  },

  // ⑥ تسمية داخل صورة: صورة كبيرة، دائرة ماركر تنرسم، ثم شريط ملاحظة
  callout: {
    draw(ctx, lt, sh, env) {
      const w = (env.box.x1 - env.box.x0) * 1.04, a = when(env, sh.w0, 0), d = enter(lt, a, sh.seed); if (!d.vis) return;
      const pr = pic(env, sh.img, sh), h = pr ? fitH(pr, w, sh.h || (env.box.y1 - env.box.y0) * .8) : (sh.h || w * .7), cx = env.cx, cy = env.cy;
      ctx.save(); T(ctx, d, cx, cy);
      let pw = w; if (pr) pw = photo(ctx, pr, 0, 0, { h, rot: d.r * .5, lift: d.lift }).w; else note(ctx, 0, 0, w, h, { rot: d.r * .5, seed: sh.seed * 9, fill: COL[sh.fill] || C.white, t: lt, lift: d.lift });
      if (sh.label) { let sz = sh.size || 150; while (tw(ctx, sh.label, HEAD, sz) > w * .85) sz -= 6; txt(ctx, sh.label, 0, 0, { size: sz, color: sh.fill === 'ink' || sh.fill === 'navy' || sh.fill === 'red' ? C.white : C.ink }); }
      ctx.restore();
      if (!sh.pin) tape(ctx, cx - pw * .32, cy - h / 2 + 4, 170, -.4, sh.seed, { prog: P(lt, a + .35 / SPD(), .3 / SPD()) }); else pin(ctx, cx, cy - h / 2 + 30, { press: P(lt, a + .38 / SPD(), .22 / SPD()) });
      const c = sh.circle; if (c) { const ox = cx + (c.x - .5) * pw, oy = cy + (c.y - .5) * h, ca = when(env, c.w, 1);
        markerEllipse(ctx, ox, oy, c.rx * pw, c.ry * h, P(lt, ca, .5 / SPD()), { seed: sh.seed, width: 12 });
        if (c.t) { const na = when(env, c.tw ?? c.w, 1.5) + (c.tw == null ? .5 : 0), nd = enter(lt, na, sh.seed + 3, 'slap'), ny = oy + (c.ny ?? (oy > cy ? -1 : 1)) * (c.ry * h + 90);
          if (nd.vis) { ctx.save(); T(ctx, nd, ox, ny); typeLabel(ctx, c.t, 0, 0, { size: 80, rot: -.04, seed: sh.seed + 40, t: lt, lift: nd.lift }); ctx.restore(); } } }
      if (sh.stamp) stampBox(ctx, sh.stamp.t, cx + pw * .22, cy - h * .36, P(lt, when(env, sh.stamp.w, 2), .3 / SPD()), { size: 84 });
    },
    events(sh, env) { const a = when(env, sh.w0, 0), e = [['slide', a], [sh.pin ? 'pin' : 'tape', a + .36 / SPD()]]; if (sh.circle) { e.push(['marker', when(env, sh.circle.w, 1)]); if (sh.circle.t) e.push(['paper', when(env, sh.circle.tw ?? sh.circle.w, 1.5) + (sh.circle.tw == null ? .5 : 0)]); } if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, 2)]); return e; },
  },

  // ⑦ عدّاد: رقم ضخم على قصاصة، محسوب بالكود، ثم خط ماركر تحته
  counter: {
    draw(ctx, lt, sh, env) {
      const a = when(env, sh.w0, 0), b = sh.w1 != null ? env.at(sh.w1) : a + 1, d = enter(lt, a - .25, sh.seed, 'slap'); if (!d.vis) return;
      const p = P(MOTION.t0 != null ? MOTION.t0 - sh.start : lt, a, Math.max(.25, b - a)), v =  // الرقم من لحظة الفريم نفسها (بدون blur عشان ما تتداخل الأرقام)
        Math.round(lerp(sh.from || 0, sh.to, Math.min(1, eo(p)))), s = (sh.prefix || '') + v.toLocaleString('en-US') + (sh.suffix || '');
      const w = (env.box.x1 - env.box.x0) * .96, h = w * .8, cx = env.cx, cy = env.cy - 40;
      ctx.save(); T(ctx, d, cx, cy); note(ctx, 0, 0, w, h, { rot: d.r - .02, seed: sh.seed, fill: C.white, t: lt, lift: d.lift });
      let sz = 360; while (tw(ctx, s, HEAD, sz) > w * .84) sz -= 10; txt(ctx, s, 0, sz * .06, { size: sz, color: p >= 1 ? C.red : C.ink, dir: 'ltr' }); ctx.restore();
      tape(ctx, cx, cy - h / 2, 200, .05, sh.seed, { prog: P(lt, a + .1, .3) });
      if (p >= 1) { const uw = Math.min(w * .8, tw(ctx, s, HEAD, sz)); markerLine(ctx, cx + uw / 2, cy + sz * .45, cx - uw / 2, cy + sz * .5, P(lt, b + .05, .3), { width: 14, seed: 5 }); }
      if (sh.label) { const la = when(env, sh.wl, 1), ld = enter(lt, la, sh.seed + 1, 'slap'); if (ld.vis) { ctx.save(); T(ctx, ld, cx, cy + h / 2 + 90); typeLabel(ctx, sh.label, 0, 0, { size: 84, rot: .03, seed: sh.seed + 7, t: lt, lift: ld.lift }); ctx.restore(); } }
      if (sh.stamp) stampBox(ctx, sh.stamp.t, cx + w * .28, cy - h * .38, P(lt, when(env, sh.stamp.w, 2), .3), { size: 76, rot: .1 });
    },
    events(sh, env) { const a = when(env, sh.w0, 0), b = sh.w1 != null ? env.at(sh.w1) : a + 1, e = [['paper', a - .25], ['tape', a + .1], ['count', a], ['marker', b + .05]]; if (sh.label) e.push(['paper', when(env, sh.wl, 1)]); if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, 2)]); return e; },
  },

  // ⑧ شبكة: كلها نفس الشي، ثم وحدة تكسر النمط
  grid: {
    draw(ctx, lt, sh, env) {
      const n = sh.rows * sh.cols, G = grid(n, sh.cols, env.box, 26), oa = when(env, sh.w, 2), pr = pic(env, sh.img, { ...sh, border: 10 });
      G.forEach((g, i) => { const a = .1 + (i % sh.cols + Math.floor(i / sh.cols)) * .06 / SPD(), d = enter(lt, a, i, 'slap'); if (!d.vis) return;
        const odd = i === sh.odd && lt >= oa, fade = lt >= oa && !odd;
        ctx.save(); ctx.globalAlpha = fade ? .45 : 1; T(ctx, d, g.cx, g.cy); const k = odd ? lerp(1.35, 1.15, eo(P(lt, oa, .3))) : 1; ctx.scale(k, k);
        if (odd) { note(ctx, 0, 0, g.w * .9, g.h * .9, { rot: .06, seed: i + 1, fill: C.red, t: lt }); const lab = sh.oddLabel || '؟'; let sz = g.w * .32; while (tw(ctx, lab, HEAD, sz) > g.w * .78) sz -= 2; txt(ctx, lab, 0, 0, { size: sz, color: C.white }); }
        else if (pr) photo(ctx, pr, 0, 0, { h: fitH(pr, g.w * .9, g.h * .9), rot: (hash(i * 3) - .5) * .1, lift: d.lift });
        else { note(ctx, 0, 0, g.w * .9, g.h * .9, { rot: (hash(i * 3) - .5) * .08, seed: i + 1, t: lt, lift: d.lift }); if (sh.label) { let sz = g.w * .28; while (tw(ctx, sh.label, HEAD, sz) > g.w * .78) sz -= 2; txt(ctx, sh.label, 0, 0, { size: sz }); } }
        ctx.restore(); });
      if (sh.stamp && lt >= oa) { const g = G[sh.odd]; stampBox(ctx, sh.stamp, g.cx, g.cy + g.h * .78, P(lt, oa + .2, .3), { size: 72 }); }
    },
    events(sh, env) { const e = [['paper', .1], ['paper', .3], ['paper', .5], ['hit', when(env, sh.w, 2)]]; if (sh.stamp) e.push(['stamp', when(env, sh.w, 2) + .2]); return e; },
  },

  // ⑨ قائمة: شرايط مكتوبة تنلصق وحدة وحدة برقم ختم
  list: {
    draw(ctx, lt, sh, env) {
      const n = sh.items.length, gap = Math.min(sh.gapY || (env.portrait ? 240 : 170), (env.box.y1 - env.box.y0) / n), y0 = env.cy - (n - 1) * gap / 2, w = (env.box.x1 - env.box.x0);
      sh.items.forEach((it, i) => { const a = when(env, it.w, i, sh.gap || .3), d = enter(lt, a, sh.seed + i, 'slide', 1200, [i % 2 ? -1 : 1, 0]); if (!d.vis) return;
        const y = y0 + i * gap, x = env.cx - 40; ctx.save(); T(ctx, d, x, y);
        const lw = typeLabel(ctx, it.t, 0, 0, { size: sh.size || 56, rot: (hash(i + 9) - .5) * .05, seed: sh.seed + i, maxW: w - 170, t: lt, lift: d.lift }); ctx.restore();
        tape(ctx, x + lw / 2 - 10, y - 18, 90, .6, i + 4, { prog: P(lt, a + .35 / SPD(), .25 / SPD()) });
        stampBox(ctx, String(i + 1), x + lw / 2 + 70, y, P(lt, a + .2 / SPD(), .3), { size: 44, color: it.c ? COL[it.c] : C.red, rot: (hash(i) - .5) * .2 });
        if (it.strike != null) markerLine(ctx, x + lw / 2, y, x - lw / 2, y + 4, P(lt, env.at(it.strike), .3), { width: 10, seed: i }); });
    },
    events(sh, env) { const e = []; sh.items.forEach((it, i) => { const a = when(env, it.w, i, sh.gap || .3); e.push(['slide', a]); e.push(['tape', a + .35 / SPD()]); if (it.strike != null) e.push(['marker', env.at(it.strike)]); }); return e; },
  },

  // ⑩ اقتباس: قصاصة جريدة بعلامة تنصيص حمراء
  quote: {
    draw(ctx, lt, sh, env) {
      const a = when(env, sh.w, 0), d = enter(lt, a, sh.seed); if (!d.vis) return; const w = (env.box.x1 - env.box.x0) * .95, h = w * .78;
      ctx.save(); T(ctx, d, env.cx, env.cy); note(ctx, 0, 0, w, h, { rot: d.r - .02, seed: sh.seed, fill: C.paper, t: lt, lift: d.lift, lines: true });
      txt(ctx, '”', w * .38, -h * .3, { size: 280, color: C.red, dir: 'ltr' }); headline(ctx, sh.text, 0, 0, 99, { size: sh.size || 84, maxW: w * .8 });
      if (sh.who) typeLabel(ctx, '— ' + sh.who, -w * .2, h * .42, { size: 40, t: lt }); ctx.restore();
      tape(ctx, env.cx + w * .3, env.cy - h / 2, 170, .4, 2, { prog: P(lt, a + .35, .3) });
    },
    events(sh, env) { const a = when(env, sh.w, 0); return [['slide', a], ['tape', a + .35]]; },
  },
};

// خلفية اللقطة (طبقة بعيدة): ورق/فلّين/خشب... — تتحرك أبطأ (parallax)
export function bgLayer(ctx, sh, env) { paperBG(ctx, sh.bg || autoBg(sh), sh.seed || 1, env.DW, env.DH); }
// طبقة الديكور (نص المسافة)
export function decorLayer(ctx, sh, env) { decor(ctx, sh, env); }
// floor + window: جزء من المحتوى (نفس سرعة اللقطة)
export function contentBg(ctx, sh, env) {
  const { DW, DH } = env;
  if (sh.floor) { const f = typeof sh.floor === 'string' ? { img: sh.floor } : sh.floor, pr = pic(env, f.img, { border: 0, color: f.color, bw: f.bw }); if (pr) { const top = DH * (1 - (f.h ?? (env.portrait ? .34 : .3)));
    ctx.save(); ctx.shadowColor = 'rgba(25,15,5,.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = -6; tornPath(ctx, -40, top - 12, DW + 80, DH - top + 80, (sh.seed || 1) * 5 + 2, 16, 26); ctx.fillStyle = C.white; ctx.fill(); ctx.restore();
    ctx.save(); tornPath(ctx, -40, top, DW + 80, DH - top + 80, (sh.seed || 1) * 5 + 3, 14, 24); ctx.clip(); const k = Math.max(DW / pr.w, (DH - top) / pr.h); ctx.drawImage(pr.cv, DW / 2 - pr.w * k / 2, top + (DH - top) / 2 - pr.h * k / 2 + (f.dy || 0) * pr.h * k, pr.w * k, pr.h * k); ctx.restore(); } }
  if (sh.window) { const wdw = sh.window, pr = pic(env, wdw.img, { border: 0, color: wdw.color }); if (pr) { const x = (wdw.x ?? .1) * DW, y = (wdw.y ?? .12) * DH, w = (wdw.w ?? .8) * DW, h = (wdw.h ?? .35) * DH;
    ctx.save(); ctx.shadowColor = 'rgba(25,15,5,.35)'; ctx.shadowBlur = 18; tornPath(ctx, x, y, w, h, (sh.seed || 1) * 11, 14, 22); ctx.fillStyle = C.white; ctx.fill(); ctx.restore();
    ctx.save(); tornPath(ctx, x + 10, y + 10, w - 20, h - 20, (sh.seed || 1) * 11 + 1, 12, 20); ctx.clip(); const k = Math.max(w / pr.w, h / pr.h); ctx.drawImage(pr.cv, x + w / 2 - pr.w * k / 2, y + h / 2 - pr.h * k / 2, pr.w * k, pr.h * k); ctx.restore(); } }
}
export function background(ctx, sh, env, lt) { bgLayer(ctx, sh, env); if (!sh.nodecor && OPT.decor !== false) decor(ctx, sh, env); contentBg(ctx, sh, env); }

// ديكور الطاولة: قصاصة جرايد + قطعة خريطة + لزيق + دبوس وخيط، تحت الكابشن بالطولي (بدون نص)، عشان ما يبان ورق فاضي.
// تتحرك مع الكاميرا لأنها جزء من الورقة. sh.nodecor = true يلغيها للقطة.
function decor(ctx, sh, env) {
  const { DW, DH } = env; if (DH <= DW * 1.2) return; const sd = (sh.seed || 1) * 13, R = k => hash(sd + k), flip = (sh.seed || 1) % 2 ? 1 : -1, y0 = 1350;
  const ax = DW / 2 - flip * DW * (.22 + R(1) * .08), ay = y0 + 300 + R(2) * 70;
  note(ctx, ax, ay, 600, 400, { rot: (R(3) - .5) * .28, seed: sd % 97 + 3, lines: true, fill: '#E4D9C2', lift: .1 });
  const mp = pic(env, 'map:' + ((sh.seed || 1) % 3), { border: 14 });
  const bx = DW / 2 + flip * DW * (.26 + R(4) * .06), by = y0 + 330 + R(5) * 60;
  if (mp) photo(ctx, mp, bx, by, { h: 400, rot: (R(6) - .5) * .4, lift: .15 });
  tape(ctx, bx - flip * 60, by - 190, 160, (R(7) - .5) * .7, sd + 2);
  const px = ax + flip * 120, py = ay - 120; pin(ctx, px, py, { r: 15 });
  string(ctx, [[px, py], [bx, by - 60], [bx + flip * 400, by + 260]], 1, { sag: 30, seed: sd });
}

// خلفية حسب سياق اللقطة (إذا ما حددت bg): لوحة تحقيق = فلّين، كروت/قبل وبعد = طاولة خشب، تسمية = كرافت، بطل = ورق مجعّد...
// STYLE.backgrounds = مصفوفة تدور بدل هذا (مثلاً ['news','cork','wood']) أو 'auto'.
const BY_TYPE = { board: 'cork', cards: 'wood', beforeafter: 'wood', callout: 'kraft', counter: 'kraft', hero: 'crumpled', list: 'grey', grid: 'grey', quote: 'aged', redact: 'dark', frontpage: 'wood', timeline: 'cork', polaroids: 'wood' };
function autoBg(sh) {
  const b = OPT.backgrounds; if (Array.isArray(b) && b.length) return b[((sh.seed || 1) - 1) % b.length];
  return BY_TYPE[sh.type] || ((sh.seed || 1) % 2 ? 'news' : 'aged');
}

// ---------- تخطيط بدون تداخل (9): نقيس كل عنصر (الصورة + شريطها المكتوب) ونبعدهم عن بعض داخل المنطقة ----------
const QX = mk(8, 8).getContext('2d'), LAY = new WeakMap();
function measure(env, it, w, h) {
  const pr = pic(env, it.img, it); let ih = h, iw = w; if (pr) { ih = fitH(pr, w, h * (it.label ? .82 : 1)); iw = ih * pr.w / pr.h; } else { ih = Math.min(h, w * .62) * .8; iw = w; }
  const oy = pr && it.label ? -h * .07 : 0, body = { x0: -iw / 2, x1: iw / 2, y0: oy - ih / 2, y1: oy + ih / 2 }; let lab = null;
  if (pr && it.label) { const sz = Math.min(62, w * .15), lw = Math.min(tw(QX, it.label, /[؀-ۿ]/.test(it.label) ? HEAD : `'Type'`, sz, 400) + sz * 1.3, w * 1.05), ly = ih / 2 + oy - 6, lh = sz * 1.8; lab = { x0: -lw / 2, x1: lw / 2, y0: ly - lh / 2, y1: ly + lh / 2 }; }
  return { body, lab, all: lab ? { x0: Math.min(body.x0, lab.x0), x1: Math.max(body.x1, lab.x1), y0: body.y0, y1: Math.max(body.y1, lab.y1) } : body };
}
const mv = (r, p) => r && { x0: r.x0 + p.cx, x1: r.x1 + p.cx, y0: r.y0 + p.cy, y1: r.y1 + p.cy };
const ovl = (a, b, m = 0) => (a && b ? [Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + m, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) + m] : [0, 0]);
const shrink = (r, f) => { const dx = (r.x1 - r.x0) * f, dy = (r.y1 - r.y0) * f; return { x0: r.x0 + dx, x1: r.x1 - dx, y0: r.y0 + dy, y1: r.y1 - dy }; };
export function relax(env, items, G, { overlap = .1, key = null } = {}) {
  if (key && LAY.has(key)) return LAY.get(key);
  const b = env.box, lim = { x0: b.x0 - 30, x1: b.x1 + 30, y0: b.y0 - 50, y1: (env.capY || b.y1 + 200) - 70 }; let best = null;
  for (let round = 0, sc = 1; round < 7; round++, sc *= .93) {
    const P0 = G.map(g => ({ cx: g.cx, cy: g.cy, w: g.w * sc, h: g.h * sc })), M = items.map((it, i) => measure(env, it, P0[i].w, P0[i].h));
    let bad = 0;
    for (let it = 0; it < 80; it++) { bad = 0;
      for (let i = 0; i < P0.length; i++) for (let j = i + 1; j < P0.length; j++) {
        const A = mv(M[i].all, P0[i]), B = mv(M[j].all, P0[j]);
        // الشريط المكتوب ما يغطي ولا يتغطى (هامش 14) · الصور تتداخل شوي بس (ستايل كولاج)
        const tests = [ovl(mv(M[i].lab, P0[i]), B, 14), ovl(mv(M[j].lab, P0[j]), A, 14), ovl(shrink(A, overlap), shrink(B, overlap))];
        for (const [ox, oy] of tests) { if (ox <= 0 || oy <= 0) continue; bad++;
          const vert = env.portrait ? oy < ox * 1.8 : oy < ox; const d = (vert ? oy : ox) / 2 + .5, s1 = vert ? Math.sign(P0[j].cy - P0[i].cy || 1) : Math.sign(P0[j].cx - P0[i].cx || 1);
          if (vert) { P0[i].cy -= d * s1; P0[j].cy += d * s1; } else { P0[i].cx -= d * s1; P0[j].cx += d * s1; } } }
      P0.forEach((p, i) => { const r = mv(M[i].all, p); if (r.x0 < lim.x0) p.cx += lim.x0 - r.x0; if (r.x1 > lim.x1) p.cx -= r.x1 - lim.x1; if (r.y0 < lim.y0) p.cy += lim.y0 - r.y0; if (r.y1 > lim.y1) p.cy -= r.y1 - lim.y1; });
      if (!bad) break; }
    best = P0; if (!bad) break;
  }
  if (key) LAY.set(key, best); return best;
}

// كاميرا تتبع: مفاتيح {t, x, y, k, d} — كل مفتاح ينعم من الحالة السابقة (eio)
function camTrack(lt, keys) {
  let c = { ...keys[0] }; for (let i = 1; i < keys.length; i++) { const K = keys[i]; if (lt < K.t) break; const p = P(lt, K.t, K.d || .6), e = eio(p); if (p > 0 && p < 1) MOTION.busy = true;
    c = { x: lerp(c.x, K.x, e), y: lerp(c.y, K.y, e), k: lerp(c.k, K.k, e), free: K.free || c.free }; } return c;
}

// ورقة مستند تتعبّى: سطور بخط الآلة الكاتبة؛ red = مشطوب بالأسود وينكشف على كلمته · hl = تظليل بعده · bar = شطب دايم
function docLines(ctx, sh, env, lt, w, h, fs) {
  const L = sh.lines, lh = fs * 1.95, top = -h / 2 + (sh.title ? fs * 3.1 : fs * 1.4);
  L.forEach((l, i) => { const y = top + i * lh + fs * .6, rtl = /[؀-ۿ]/.test(l.t || 'ا'), fam = rtl ? HEAD : `'Type'`, X = rtl ? w / 2 - fs * 1.1 : -w / 2 + fs * 1.1;
    if (l.bar) { const bw = (w - fs * 2.2) * l.bar; ctx.save(); tornPath(ctx, rtl ? X - bw : X, y - fs * .55, bw, fs * 1.1, sh.seed * 9 + i, 2, 10); ctx.fillStyle = '#141210'; ctx.fill(); ctx.restore(); return; }
    const at = l.w != null ? env.at(l.w) : -9, show = l.red ? 1 : cl((lt - at + .2) / .25); if (show <= 0) return;
    const tw0 = tw(ctx, l.t, fam, fs, rtl ? 700 : 400), x0 = rtl ? X - tw0 : X;
    if (l.hl) { const hp = eo(P(lt, at + (l.red ? .45 : .1) / SPD(), .35 / SPD())); if (hp > 0) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(226,176,52,.8)'; const hw = (tw0 + 16) * hp; ctx.fillRect(rtl ? X + 8 - hw : x0 - 8, y - fs * .5, hw, fs * 1.0); ctx.restore(); } }
    ctx.save(); ctx.globalAlpha *= show; txt(ctx, l.t, X, y + fs * .05, { fam, size: fs, weight: rtl ? 700 : 400, align: rtl ? 'right' : 'left', color: l.c ? COL[l.c] : C.ink }); ctx.restore();
    if (l.red) { const rp = eo(P(lt, at - .05, .45 / SPD())), bw = (tw0 + 20) * (1 - rp); if (bw > 1) { if (rp > 0 && rp < 1) MOTION.busy = true;
      ctx.save(); tornPath(ctx, rtl ? X + 10 - (tw0 + 20) : x0 - 10, y - fs * .58, bw, fs * 1.16, sh.seed * 9 + i, 2, 10); ctx.fillStyle = '#141210'; ctx.fill(); ctx.restore(); } } });
  return top + L.length * lh;
}
const NEWSHOTS = {
  // ⑪ مستند مشطوب: الشطب الأسود ينشال كلمة كلمة ويبان النص، وبعده تظليل
  redact: {
    draw(ctx, lt, sh, env) {
      const b = env.box, w = (b.x1 - b.x0) * .98, fs = sh.size || (env.portrait ? 50 : 42), h = Math.min(env.portrait ? 1130 : 820, (sh.title ? fs * 3.1 : fs * 1.4) + sh.lines.length * fs * 1.95 + fs * 1.6);
      const a0 = when(env, sh.w0 ?? sh.lines.find(l => l.w != null)?.w, 0) - .25, d = enter(lt, a0, sh.seed, 'slide', 1400, [0, 1]); if (!d.vis) return;
      ctx.save(); T(ctx, d, env.cx, env.cy); ctx.rotate(-.012 + d.r * .3);
      note(ctx, 0, 0, w, h, { seed: sh.seed, fill: '#F2EDE1', t: lt, lift: d.lift, irr: .6 });
      if (sh.title) { txt(ctx, sh.title, 0, -h / 2 + fs * 1.45, { fam: SANS, size: fs * 1.1, weight: 900 }); ctx.fillStyle = 'rgba(28,26,22,.8)'; ctx.fillRect(-w / 2 + fs, -h / 2 + fs * 2.3, w - fs * 2, 3); }
      docLines(ctx, sh, env, lt, w, h, fs);
      if (sh.doc) typeLabel(ctx, sh.doc, w * .26, h / 2 - fs * .9, { size: fs * .62, rot: .02, seed: sh.seed + 3, t: lt });
      ctx.restore();
      tape(ctx, env.cx + w * .32, env.cy - h / 2, 170, .45, sh.seed, { prog: P(lt, a0 + .4 / SPD(), .3 / SPD()) });
      if (sh.stamp) stampBox(ctx, sh.stamp.t, env.cx - w * .22, env.cy + h / 2 - 40, P(lt, when(env, sh.stamp.w, 3), .3 / SPD()), { size: sh.stamp.size || 78, rot: -.12, color: COL[sh.stamp.c] || C.red });
    },
    events(sh, env) { const a0 = when(env, sh.w0 ?? sh.lines.find(l => l.w != null)?.w, 0) - .25, e = [['slide', a0], ['tape', a0 + .4 / SPD()]];
      sh.lines.forEach(l => { if (l.red && l.w != null) e.push(['tape', env.at(l.w) - .05]); if (l.hl && l.w != null) e.push(['marker', env.at(l.w) + (l.red ? .45 : .1) / SPD()]); }); if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, 3)]); return e; },
  },

  // ⑫ صفحة جريدة أولى: الصفحة تنزل، والكاميرا تقرّب على العنوان كلمة كلمة، وبعدين ترجع للصورة
  frontpage: {
    nodecor: true,
    lay(sh, env) { const b = env.box, w = (b.x1 - b.x0) * (env.portrait ? 1.04 : .8), h = env.portrait ? Math.min(1180, w * 1.3) : (b.y1 - b.y0) * 1.08, cy = env.portrait ? b.y0 - 30 + h / 2 : env.cy;
      const mh = w * .155, hs = sh.size || w * .1, hy = -h / 2 + mh + 40 + hs * 1.15, py0 = hy + hs * 1.45 + (sh.sub ? w * .07 : 0), py1 = h / 2 - h * .2;
      return { w, h, cx: env.cx, cy, mh, hs, hy, py0, py1 }; },
    cam(lt, sh, env) { const L = this.lay(sh, env), ha = env.at(sh.headline.ws ? sh.headline.ws[0] : sh.headline.w), z = sh.camK || 1.6;
      const end = sh.sub && sh.sub.w != null ? env.at(sh.sub.w) : ha + 1.6;
      return camTrack(lt, [{ x: env.DW / 2, y: env.DH / 2, k: 1 }, { t: ha - .35, x: L.cx, y: L.cy + L.hy, k: z, d: .7 }, { t: end, x: L.cx, y: L.cy + (L.py0 + L.py1) / 2, k: 1.12, d: .9 }]); },
    draw(ctx, lt, sh, env) {
      const L = this.lay(sh, env), { w, h } = L, a0 = when(env, sh.w0 ?? (sh.headline.ws ? sh.headline.ws[0] : sh.headline.w), 0) - .6, d = enter(lt, a0, sh.seed, 'slide', 1500, [0, 1]); if (!d.vis) return;
      ctx.save(); T(ctx, d, L.cx, L.cy); ctx.rotate(.008 + d.r * .3);
      const mast = sh.masthead || 'اختيار ذكي اليوم', date = sh.date || '';
      sheet(ctx, w, h, sh.seed * 3, '#EDE6D3', { lift: d.lift, amp: 3, jag: 14, crumple: .5, shape: sh.seed * 3, irr: .35, ikey: 'FP' + mast + date, inner: q => {
        q.save(); q.fillStyle = C.ink; q.font = fnt(HEAD, w * .088, 700); q.textAlign = 'center'; q.textBaseline = 'middle'; q.direction = 'rtl'; q.fillText(mast, 0, -h / 2 + L.mh * .5);
        q.fillRect(-w / 2 + 30, -h / 2 + L.mh - 8, w - 60, 5); q.fillRect(-w / 2 + 30, -h / 2 + L.mh + 2, w - 60, 2);
        q.font = fnt(`'Type'`, w * .026, 400); q.direction = 'rtl'; q.fillText(date, 0, -h / 2 + L.mh + 26); q.fillRect(-w / 2 + 30, -h / 2 + L.mh + 46, w - 60, 2);
        const R = rng(sh.seed * 5), cols = 4, gw = (w - 60) / cols; q.fillStyle = 'rgba(40,32,22,.42)';
        for (let c0 = 0; c0 < cols; c0++) { const x0 = -w / 2 + 30 + c0 * gw + 10, cw = gw - 20; for (let y = L.py1 + 26; y < h / 2 - 26; y += 11) q.fillRect(x0, y, R() < .1 ? cw * (.3 + R() * .5) : cw, 3.6); if (c0) q.fillRect(x0 - 10, L.py1 + 20, 1.5, h / 2 - L.py1 - 40); }
        q.globalAlpha = .5; q.fillRect(-2, -h / 2, 4, h); q.restore(); } });
      headline(ctx, sh.headline.t, 0, L.hy, lt, { at: env.at(sh.headline.w ?? sh.headline.ws?.[0]), times: sh.headline.ws && sh.headline.ws.map(n => env.at(n)), size: L.hs, maxW: w * .9, hl: sh.headline.hl, seed: sh.seed });
      if (sh.sub) { const sa = when(env, sh.sub.w, 1), sp = cl((lt - sa + .1) / .25); if (sp > 0) { ctx.save(); ctx.globalAlpha *= sp; txt(ctx, sh.sub.t, 0, L.hy + L.hs * 1.2, { fam: HEAD, size: w * .042, weight: 700, color: '#3A3128' }); ctx.restore(); } }
      const pr = pic(env, sh.img, { border: 0, bw: sh.bw ?? true, color: sh.color }); if (pr) { const pw = w * .9, ph = L.py1 - L.py0 - 20, k = Math.max(pw / (pr.w - pr.pad * 2), ph / (pr.h - pr.pad * 2));
        ctx.save(); ctx.beginPath(); ctx.rect(-pw / 2, L.py0, pw, ph); ctx.clip(); ctx.drawImage(pr.cv, -pr.w * k / 2, L.py0 + ph / 2 - pr.h * k / 2, pr.w * k, pr.h * k); ctx.restore();
        ctx.strokeStyle = 'rgba(28,26,22,.7)'; ctx.lineWidth = 2; ctx.strokeRect(-pw / 2, L.py0, pw, ph); if (sh.caption) txt(ctx, sh.caption, pw / 2, L.py1 - 2, { fam: `'Type'`, size: w * .022, weight: 400, align: 'right' }); }
      ctx.restore();
      if (sh.stamp) stampBox(ctx, sh.stamp.t, L.cx - w * .28, L.cy + L.py0 + 70, P(lt, when(env, sh.stamp.w, 2), .3 / SPD()), { size: sh.stamp.size || 80, rot: .12, color: COL[sh.stamp.c] || C.red });
    },
    events(sh, env) { const hw = sh.headline.ws ? sh.headline.ws[0] : sh.headline.w, a0 = when(env, sh.w0 ?? hw, 0) - .6, e = [['slide', a0], ['flip', a0 + .1], ['pan', env.at(hw) - .35]]; if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, 2)]); return e; },
  },

  // ⑬ خط زمني على خيط: الخيط ينزل من تاريخ لتاريخ، دبوس على كل محطة، والكاميرا تمشي معه
  timeline: {
    nodecor: true,
    lay(sh, env) { const n = sh.items.length, b = env.box, gap = sh.gap || (env.portrait ? 400 : 470), P0 = [];
      for (let i = 0; i < n; i++) P0.push(env.portrait ? { x: env.DW / 2, y: b.y0 + 170 + i * gap } : { x: b.x0 + 160 + i * gap, y: env.DH / 2 }); return { P0, gap }; },
    cam(lt, sh, env) { const { P0 } = this.lay(sh, env), K = [{ x: env.DW / 2, y: env.DH / 2, k: sh.camK || 1, free: true }];
      sh.items.forEach((it, i) => { const a = when(env, it.w, i, .6); K.push(env.portrait ? { t: a - .35, x: env.DW / 2, y: Math.max(env.DH / 2, P0[i].y + 120), k: sh.camK || 1, d: .7, free: true } : { t: a - .35, x: Math.max(env.DW / 2, P0[i].x), y: env.DH / 2, k: sh.camK || 1, d: .7 }); });
      return camTrack(lt, K); },
    draw(ctx, lt, sh, env) {
      const { P0 } = this.lay(sh, env), por = env.portrait, ts = sh.items.map((it, i) => when(env, it.w, i, .6)), top = por ? [env.DW / 2, env.box.y0 - 260] : [env.box.x0 - 260, env.DH / 2];
      let reached = 0; ts.forEach((a, i) => { reached = Math.max(reached, i + eo(P(lt, a - .4, .4 / SPD()))); });
      string(ctx, [top, ...P0.map(p => [p.x, p.y])], reached / P0.length, { sag: 14, seed: sh.seed, width: 6 });
      sh.items.forEach((it, i) => { const p = P0[i], a = ts[i], side = i % 2 ? -1 : 1, cw = por ? 430 : 400;
        const d = enter(lt, a, sh.seed * 7 + i, 'slide', 900, por ? [side, 0] : [0, side]); if (d.vis) { const cx = por ? p.x + side * 255 : p.x, cy = por ? p.y : p.y + side * 250;
          ctx.save(); T(ctx, d, cx, cy); const rot = (hash(sh.seed + i) - .5) * .08 + d.r;
          const pr = pic(env, it.img, it); if (pr) { const ph = fitH(pr, cw, 300); photo(ctx, pr, 0, -20, { h: ph, rot, lift: d.lift }); if (it.t) typeLabel(ctx, it.t, 0, ph / 2 - 10, { size: 46, rot: rot * .5, seed: sh.seed + i, maxW: cw * 1.05, t: lt }); }
          else { note(ctx, 0, 0, cw, 220, { rot, seed: sh.seed * 5 + i, fill: COL[it.fill] || C.white, t: lt, lift: d.lift, lines: it.lines }); let sz = 54; while (tw(ctx, it.t, HEAD, sz) > cw * .84 && sz > 24) sz -= 2; ctx.save(); ctx.rotate(rot); txt(ctx, it.t, 0, 0, { size: sz }); ctx.restore(); }
          ctx.restore(); }
        const da = enter(lt, a - .15, sh.seed + i * 3, 'slap'); if (da.vis) { ctx.save(); T(ctx, da, por ? p.x - side * 150 : p.x, por ? p.y : p.y - side * 120); typeLabel(ctx, it.date, 0, 0, { size: 58, fill: C.red, color: C.white, rot: (hash(i + 3) - .5) * .1, seed: sh.seed + i + 20, t: lt, lift: da.lift }); ctx.restore(); }
        pin(ctx, p.x, p.y, { press: P(lt, a - .05, .22 / SPD()), color: 'red', r: 17 }); });
    },
    events(sh, env) { const e = []; sh.items.forEach((it, i) => { const a = when(env, it.w, i, .6); e.push(['string', a - .4], ['paper', a - .15], ['pin', a - .05], ['slide', a]); }); return e; },
  },

  // ⑭ بولارويد: صور فورية تنصفع فوق بعض بزوايا مختلفة، وتحت كل وحدة كلمة بخط اليد
  polaroids: {
    draw(ctx, lt, sh, env) {
      const n = sh.items.length, b = env.box, bw = b.x1 - b.x0, por = env.portrait, w = sh.w || (por ? bw * .62 : Math.min(bw / n * 1.05, 520)), h = w * 1.2;
      sh.items.forEach((it, i) => { const a = when(env, it.w, i, .5), d = enter(lt, a, sh.seed * 11 + i, 'slap'); if (!d.vis) return;
        const ox = por ? (hash(sh.seed + i * 3) - .5) * bw * .26 : (i - (n - 1) / 2) * w * .82, oy = por ? -(i - (n - 1) / 2) * Math.min(190, (b.y1 - b.y0 - h) / Math.max(1, n - 1) + 60) + (hash(sh.seed + i * 5) - .5) * 30 : (hash(i * 7) - .5) * 80, rot = (hash(sh.seed * 3 + i) - .5) * .34 + d.r;
        ctx.save(); T(ctx, d, env.cx + ox, env.cy + oy); ctx.rotate(rot);
        sheet(ctx, w, h, sh.seed * 17 + i, '#F7F4EC', { lift: d.lift, amp: 1.2, jag: 16, lip: false, crumple: .3, irr: .2 });
        const m = w * .065, ph = h - m - h * .2, pw = w - m * 2, pr = pic(env, it.img, { border: 0, bw: it.bw, color: it.color });
        ctx.save(); ctx.beginPath(); ctx.rect(-pw / 2, -h / 2 + m, pw, ph); ctx.fillStyle = '#25221E'; ctx.fill(); ctx.clip();
        if (pr) { const k = Math.max(pw / (pr.w - pr.pad * 2), ph / (pr.h - pr.pad * 2)); ctx.drawImage(pr.cv, -pr.w * k / 2, -h / 2 + m + ph / 2 - pr.h * k / 2, pr.w * k, pr.h * k); }
        const g = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 + ph); g.addColorStop(0, 'rgba(255,240,210,.12)'); g.addColorStop(1, 'rgba(40,20,0,.18)'); ctx.fillStyle = g; ctx.fillRect(-pw / 2, -h / 2 + m, pw, ph); ctx.restore();
        if (it.t) { let sz = w * .085; while (tw(ctx, it.t, HEAD, sz) > pw * .9 && sz > 20) sz -= 2; txt(ctx, it.t, 0, h / 2 - h * .1, { size: sz, color: '#2A2620', weight: 700 }); }
        ctx.restore(); });
      if (sh.stamp) stampBox(ctx, sh.stamp.t, env.cx + bw * .25, env.cy - h * .45, P(lt, when(env, sh.stamp.w, n), .3 / SPD()), { size: sh.stamp.size || 80, rot: .1, color: COL[sh.stamp.c] || C.red });
    },
    events(sh, env) { const e = []; sh.items.forEach((it, i) => e.push(['paper', when(env, it.w, i, .5)])); if (sh.stamp) e.push(['stamp', when(env, sh.stamp.w, sh.items.length)]); return e; },
  },
};
Object.assign(SHOTS, NEWSHOTS);
