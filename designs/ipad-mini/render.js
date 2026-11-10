const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:2});
for(const n of ['specs','prices']){await p.goto('file://'+__dirname+'/'+n+'.html',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.screenshot({path:__dirname+'/ipad-mini-'+n+'.png'});
const o=await p.evaluate(()=>[document.body.scrollHeight,[...document.querySelectorAll('.footer,.bottom,.note')].map(e=>Math.round(e.getBoundingClientRect().bottom))]);console.log(n,JSON.stringify(o));}
await b.close();})();
