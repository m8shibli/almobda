const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await p.goto('file://'+process.cwd()+'/banner.html');await p.evaluate(()=>document.fonts.ready);
await p.screenshot({path:'banner.png'});await b.close()})()
