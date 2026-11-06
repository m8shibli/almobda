// Renders scene.html frame-by-frame into an MP4 (video only) + exports the sound cue sheet.
// Usage: node render.js [outDir] [fps] [workers]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(process.argv[2] || 'build');
const FPS = +(process.argv[3] || 30);
const WORKERS = +(process.argv[4] || 4);
fs.mkdirSync(outDir, { recursive: true });

async function openPage(browser) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('page error:', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'scene.html'));
  await p.evaluate(() => document.fonts.ready);
  return p;
}

(async () => {
  const browser = await chromium.launch();
  const probe = await openPage(browser);
  const { cues, duration } = await probe.evaluate(() => ({ cues: window.CUES, duration: window.DURATION }));
  fs.writeFileSync(path.join(outDir, 'cues.json'), JSON.stringify({ duration, cues }, null, 1));
  await probe.close();

  const total = Math.round(duration * FPS);
  const per = Math.ceil(total / WORKERS);
  console.log(`frames: ${total} @ ${FPS}fps, ${WORKERS} workers`);
  let done = 0;
  const segs = [];
  await Promise.all([...Array(WORKERS)].map(async (_, w) => {
    const a = w * per, b = Math.min(total, a + per);
    if (a >= b) return;
    const seg = path.join(outDir, `seg_${w}.mp4`); segs[w] = seg;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg]);
    ff.stderr.on('data', d => process.stderr.write(d));
    const p = await openPage(browser);
    for (let f = a; f < b; f++) {
      await p.evaluate(t => window.render(t), f / FPS);
      const buf = await p.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 100 === 0) console.log(`  ${done}/${total}`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    await p.close();
  }));
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'segments.txt'), segs.filter(Boolean).map(s => `file '${s}'`).join('\n'));
  console.log('video segments done');
})();
