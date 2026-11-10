const {chromium}=require('playwright');const fs=require('fs');const {execFileSync}=require('child_process');
const FPS=30, DUR=+process.env.DUR||8;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const n of (process.env.ONLY||'specs,prices').split(',')){
 const dir=process.env.TMPF+'/'+n;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
 await p.goto('file://'+__dirname+'/'+n+'-motion.html',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>document.getAnimations().forEach(a=>a.pause()));
 const frames=process.env.FRAMES?process.env.FRAMES.split(',').map(Number):[...Array(FPS*DUR).keys()];
 for(const f of frames){const t=f/FPS;
  await p.evaluate(t=>{document.getAnimations().forEach(a=>a.currentTime=t*1000);seek(t)},t);
  await p.screenshot({path:`${dir}/f${String(f).padStart(4,'0')}.png`});}
 if(!process.env.FRAMES){execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',''+FPS,'-i',`${dir}/f%04d.png`,'-c:v','libx264','-pix_fmt','yuv420p','-crf','17','-preset','slow','-movflags','+faststart',__dirname+`/ipad-mini-${n}-motion.mp4`]);}
 console.log(n,'done');}
await b.close();})();
