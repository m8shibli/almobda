// Renders logo.html to PNG files: node render.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'logo.html'));
  await page.evaluate(() => document.fonts.ready);

  await page.setViewportSize({ width: 1080, height: 1080 });
  await page.locator('#icon').screenshot({ path: path.join(__dirname, 'almobda3d-profile.png'), omitBackground: true });

  await page.evaluate(() => document.body.classList.add('full'));
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.locator('#full').screenshot({ path: path.join(__dirname, 'almobda3d-logo-wide.png') });

  await browser.close();
})();
