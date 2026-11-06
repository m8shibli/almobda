// Usage: node preview_edit.js <framesDir> <outDir> t1 t2 ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [frames, out, ...times] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'edit.html') + '?frames=' + encodeURIComponent('file://' + path.resolve(frames)));
  await p.evaluate(() => document.fonts.ready);
  for (const t of times) {
    await p.evaluate(t => window.render(t), +t);
    await p.screenshot({ path: `${out}/e_${t}.png` });
  }
  await b.close();
})();
