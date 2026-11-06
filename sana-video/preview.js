// Usage: node preview.js out_dir t1 t2 ...   -> PNG stills at given times (for checking)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, ...times] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'scene.html'));
  await p.evaluate(() => document.fonts.ready);
  for (const t of times) {
    await p.evaluate(t => window.render(t), +t);
    await p.screenshot({ path: `${out}/t_${t}.png` });
  }
  await b.close();
})();
