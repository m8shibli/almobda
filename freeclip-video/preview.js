// node preview.js <framesDir> <outDir> t1 t2 ...
const { chromium } = require('playwright');const path=require('path');
(async()=>{const [fr,out,...ts]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.error('page error:',e.message));p.on('console',m=>console.log('console:',m.text()));
await p.goto('file://'+path.resolve(__dirname,'edit.html')+'?frames='+encodeURIComponent('file://'+path.resolve(fr)));await p.evaluate(()=>document.fonts.ready);
for(const t of ts){await p.evaluate(t=>window.render(t),+t);await p.screenshot({path:`${out}/p_${t}.jpg`,type:'jpeg',quality:80});}
await b.close();})();
