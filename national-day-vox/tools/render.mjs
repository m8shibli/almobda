// اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
// render.mjs — رندر حتمي فريم فريم بعدة صفحات بالتوازي، ثم ffmpeg.
//   فيديو:  node tools/render.mjs --out renders/final.mp4 [--from 0 --to 43.6 --workers 4 --audio assets/audio/mix.wav --gpu]
//   صور:    node tools/render.mjs --stills 0.5,3,6.2 [--dir renders/stills]
//   أحداث:  node tools/render.mjs --events plan/events.json     (للمؤثرات الصوتية: sfx.py)
//   فحص:   node tools/render.mjs --qa [0.25]   → نصوص متداخلة / نص تغطّيه ورقة / نص برا المنطقة الآمنة → renders/qa_text.json
import http from 'node:http'; import { readFile, writeFile, stat, mkdir, rm } from 'node:fs/promises'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const req = createRequire(path.join(process.cwd(), 'package.json'));
let chromium; try { ({ chromium } = req('playwright')); } catch { ({ chromium } = createRequire(process.env.PW_FROM || path.join(process.cwd(), 'package.json'))('playwright')); }
const a = {}; process.argv.slice(2).forEach((x, i, v) => { if (x.startsWith('--')) a[x.slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[i + 1] : true; });
const root = process.cwd(), types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer(async (q, r) => { try { const p = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!p.startsWith(root) || (await stat(p)).isDirectory()) throw 0;
  r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(await readFile(p)); } catch { r.writeHead(404); r.end(); } });
await new Promise(res => srv.listen(0, '127.0.0.1', res));
const URL0 = `http://127.0.0.1:${srv.address().port}/src/index.html`;
const browser = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--font-render-hinting=none'] });
const { SIZE, FPS, DURATION } = await import('file://' + path.join(root, 'src/data.js').replace(/\\/g, '/'));
async function openPage() { const pg = await browser.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL0); await pg.waitForFunction(() => window.__ready === true, null, { timeout: 120000 }); pg.errs = errs; return pg; }
const save = async (pg, f) => { await pg.evaluate(t => window.renderFrame(t), f.t); if (pg.errs.length) throw new Error(pg.errs.join('; '));
  const d = await pg.evaluate(() => window.grab('image/jpeg')); await writeFile(f.file, Buffer.from(d.split(',')[1], 'base64')); };

if (a.events) { const pg = await openPage(); const ev = await pg.evaluate(() => window.EVENTS()); await writeFile(a.events, JSON.stringify({ duration: DURATION, events: ev }, null, 1)); console.log(ev.length, 'events →', a.events); }
else if (a.qa) { const pg = await openPage(), stp = +(a.qa === true ? .25 : a.qa), bad = []; await pg.evaluate(() => { window.QA_ON = true; });
  const ar = r => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0), ov = (p, q) => ar({ x0: Math.max(p.x0, q.x0), y0: Math.max(p.y0, q.y0), x1: Math.min(p.x1, q.x1), y1: Math.min(p.y1, q.y1) });
  for (let t = 0; t < DURATION; t += stp) { await pg.evaluate(t => window.renderFrame(t), t); const L = (await pg.evaluate(() => window.QA_LIST())).filter(r => r.a > .5);
    const T = L.filter(r => r.k === 'text' || r.k === 'cap'), B = L.filter(r => r.k === 'body'), say = m => bad.push({ t: +t.toFixed(2), m });
    for (let i = 0; i < T.length; i++) { const p = T[i];
      for (let j = i + 1; j < T.length; j++) { const q = T[j], o = ov(p, q); if (o > .2 * Math.min(ar(p), ar(q))) say(`نص فوق نص: «${p.s}» × «${q.s}»`); }
      for (const b of B) if (b.n > p.n && ov(p, b) > .3 * ar(p)) { say(`ورقة تغطي النص «${p.s}»`); break; }
      if (p.k === 'text' && (p.x0 < SIZE[0] * .03 || p.x1 > SIZE[0] * .97 || p.y0 < SIZE[1] * .05 || p.y1 > SIZE[1] * .8)) say(`نص برا المنطقة الآمنة «${p.s}»`); } }
  // نخلي بس المشاكل اللي تستمر عيّنتين ورا بعض (العناصر وهي داخلة من برا الشاشة مو مشكلة)
  const key = b => b.m + '@' + Math.round(b.t / stp), has = new Set(bad.map(key)), real = bad.filter(b => has.has(b.m + '@' + (Math.round(b.t / stp) + 1)));
  const seen = new Set(), uniq = real.filter(b => { const k = b.m; if (seen.has(k)) return false; seen.add(k); return true; });
  await writeFile('renders/qa_text.json', JSON.stringify(bad, null, 1)); uniq.forEach(b => console.log(b.t.toFixed(2).padStart(6), b.m)); console.log(`${uniq.length} مشكلة مستمرة → renders/qa_text.json`); }
else if (a.stills) { const dir = a.dir || 'renders/stills'; await mkdir(dir, { recursive: true }); const pg = await openPage();
  for (const t of String(a.stills).split(',').map(Number)) await save(pg, { t, file: path.join(dir, `s_${t.toFixed(2)}.jpg`) }); console.log('✔ stills →', dir); }
else {
  const from = +(a.from ?? 0), to = +(a.to ?? DURATION), fps = +(a.fps ?? FPS), n = Math.round((to - from) * fps), nw = +(a.workers ?? 4);
  const out = a.out || 'renders/final.mp4', dir = path.join(path.dirname(out), '_frames'); await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });
  const t0 = Date.now(); let doneN = 0;
  await Promise.all(Array.from({ length: nw }, async (_, w) => { const pg = await openPage();
    for (let i = w; i < n; i += nw) { await save(pg, { t: from + i / fps, file: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`) });
      if (++doneN % 48 === 0) process.stdout.write(`\r${doneN}/${n} · ${((Date.now() - t0) / doneN).toFixed(0)} ms/frame   `); } }));
  const venc = a.gpu ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '20'] : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18'];
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.jpg')];
  if (a.audio) args.push('-ss', String(from), '-t', String(to - from), '-i', a.audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k');
  args.push(...venc, '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-frames:v', String(n), '-movflags', '+faststart', out);
  await new Promise((ok, no) => spawn('ffmpeg', args, { stdio: 'inherit' }).on('close', c => (c ? no(new Error('ffmpeg ' + c)) : ok())));
  console.log(`\n✔ ${out}  (${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
await browser.close(); srv.close();
