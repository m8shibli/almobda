import re
MOTION_CSS = """
.stage{width:420px;height:450px;border-radius:34px;background:#000;position:relative;overflow:hidden;flex:none;
 box-shadow:0 30px 60px rgba(11,16,32,.25);margin-left:-6px}
.stage .glow{position:absolute;inset:0;background:radial-gradient(60% 45% at 50% 100%,var(--accent) 0%,rgba(0,0,0,0) 70%);opacity:.55}
.stage .float{position:absolute;inset:0}
.stage img{position:absolute;left:0;bottom:0;width:100%;height:100%;object-fit:cover;object-position:center top;mix-blend-mode:lighten}
.stage .shine{position:absolute;top:-20%;bottom:-20%;width:30%;left:0;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.18),rgba(255,255,255,0))}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes side{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:none}}
@keyframes pop{0%{opacity:0;transform:scale(.4)}65%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes stageIn{from{opacity:0;transform:translateX(-80px) scale(.88);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@keyframes zoom{from{transform:scale(1.18)}to{transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-12px) rotate(-.6deg)}}
@keyframes shine{0%{transform:translateX(-150%) skewX(-20deg)}40%,100%{transform:translateX(420%) skewX(-20deg)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes ring{0%{box-shadow:0 0 0 0 var(--ring)}100%{box-shadow:0 0 0 18px rgba(0,0,0,0)}}
@keyframes glowp{0%,100%{opacity:.4}50%{opacity:.75}}
.a{animation:up .8s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--d)*1s)}
.a.side{animation-name:side}
.a.pop{animation-name:pop;animation-duration:.7s}
.stage.a{animation-name:stageIn;animation-duration:1.2s}
.stage img{animation:zoom 2.4s cubic-bezier(.2,.8,.2,1) both;animation-delay:.3s}
.stage .float{animation:float 4s ease-in-out 1.5s infinite}
.stage .shine{animation:shine 3s ease-in-out 1.6s infinite}
.stage .glow{animation:glowp 3s ease-in-out 1s infinite}
.ic{animation:pop .7s cubic-bezier(.2,.8,.2,1) both,pulse 2.4s ease-in-out infinite,ring 2.4s ease-out infinite;
 animation-delay:calc(var(--d)*1s + .15s),calc(var(--d)*1s + 1.6s),calc(var(--d)*1s + 1.6s)}
.ic svg *{stroke-dasharray:1;animation:draw 1s ease-out both;animation-delay:calc(var(--d)*1s + .35s)}
.handle .ig{animation:pulse 2s ease-in-out infinite;animation-delay:4.5s}
"""
SCRIPT = """<script>
document.querySelectorAll('.ic svg *').forEach(e=>e.setAttribute('pathLength',1));
const ease=x=>1-Math.pow(1-x,3);
window.seek=t=>{document.querySelectorAll('[data-to]').forEach(e=>{const s=+e.dataset.s,d=+(e.dataset.dur||.8);
 const p=Math.min(1,Math.max(0,(t-s)/d));e.textContent=Math.round(ease(p)*(+e.dataset.to));});};
window.seek(0);
</script>"""

def stage(d=.3):
    return f'<div class="stage a" style="--d:{d}"><div class="glow"></div><div class="float"><img src="ipad-orig.png" alt=""></div><div class="shine"></div></div>'

def cls(html, old, new, n=1):
    assert old in html, old
    return html.replace(old, new, n)

# ---------- SPECS ----------
s = open('specs.html', encoding='utf-8').read()
s = re.sub(r'<svg class="device".*?</svg>\n?', stage(), s, flags=re.S)
s = s.replace('</style>', MOTION_CSS + '\n.ic{--ring:rgba(255,90,31,.35)}\n</style>')
s = cls(s, '<span class="pill">', '<span class="pill a side" style="--d:.2">')
s = cls(s, '<h1>', '<h1 class="a" style="--d:.4">')
s = cls(s, '<div class="chip">', '<div class="chip a" style="--d:.6">')
s = cls(s, '<div class="stat">', '<div class="stat a pop" style="--d:.9">')
s = cls(s, '<div class="stat">', '<div class="stat a pop" style="--d:1.05">')
for i in range(6):
    d = 1.3 + i*0.18
    s = s.replace('<div class="card"><div class="top"><div class="ic">', f'<div class="card a" style="--d:{d:.2f}"><div class="top"><div class="ic" style="--d:{d:.2f}">', 1)
# list items stagger
def li_stagger(m):
    d=float(m.group(1)); k=[0]
    def rep(x):
        k[0]+=1; return f'<li class="a side" style="--d:{d+.35+k[0]*.09:.2f}">'
    return re.sub(r'<li>', rep, m.group(0))
s = re.sub(r'<div class="card a" style="--d:([\d.]+)">.*?</ul></div>', li_stagger, s, flags=re.S)
s = cls(s, '<div class="extra">', '<div class="extra a" style="--d:2.5">')
k=[0]
def tag(m):
    k[0]+=1; return f'<span class="tag a pop" style="--d:{2.7+k[0]*.1:.2f}"'
s = re.sub(r'<span class="tag', tag, s)
s = cls(s, '<div class="price">', '<div class="price a pop" style="--d:2.6">')
s = cls(s, '<span class="n">319</span>', '<span class="n" data-to="319" data-s="2.75" data-dur="1.1">319</span>')
s = cls(s, '<div class="footer">', '<div class="footer a" style="--d:3.4">')
s = s.replace('</body>', SCRIPT + '</body>')
open('specs-motion.html','w',encoding='utf-8').write(s)

# ---------- PRICES ----------
p = open('prices.html', encoding='utf-8').read()
p = re.sub(r'<svg class="device".*?</svg>\n?', stage(), p, flags=re.S)
p = p.replace('</style>', MOTION_CSS + """
.ic{--ring:rgba(31,91,255,.4);width:40px;height:40px;border-radius:12px;background:rgba(94,200,255,.14);display:grid;place-items:center;flex:none}
.ic svg{width:24px;height:24px;stroke:var(--accent2);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.th h3{display:flex;align-items:center;gap:12px}
.from{position:relative;overflow:hidden}
.from::after{content:"";position:absolute;top:-20%;bottom:-20%;width:30%;left:0;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.35),rgba(255,255,255,0));animation:shine 3s ease-in-out 2s infinite}
</style>""")
p = cls(p, '<span class="pill">', '<span class="pill a side" style="--d:.2">')
p = cls(p, '<h1>', '<h1 class="a" style="--d:.4">')
p = cls(p, '<div class="chip">', '<div class="chip a" style="--d:.6">')
p = cls(p, '<div class="from">', '<div class="from a pop" style="--d:.9">')
p = cls(p, '<span class="n">319</span>', '<span class="n" data-to="319" data-s="1.0" data-dur="1.2">319</span>')
GLASS='<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 9l4-3M8 14l8-6M12 17l4-3"/></svg>'
SPARK='<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/></svg>'
tbl_d=[1.4,2.4]
p = p.replace('<div class="tbl">', f'<div class="tbl a" style="--d:{tbl_d[0]}">', 1)
p = p.replace('<div class="tbl">', f'<div class="tbl a" style="--d:{tbl_d[1]}">', 1)
p = cls(p, '<h3>الزجاج القياسي</h3>', f'<h3><span class="ic" style="--d:{tbl_d[0]}">{GLASS}</span>الزجاج القياسي</h3>')
p = cls(p, '<h3>زجاج <span class="ltr">Nano-texture</span></h3>', f'<h3><span class="ic" style="--d:{tbl_d[1]}">{SPARK}</span>زجاج <span class="ltr">Nano-texture</span></h3>')
# rows
parts = p.split('<div class="tbl a"')
out=[parts[0]]
for bi,part in enumerate(parts[1:]):
    base=tbl_d[bi]; r=[0]
    def row(m):
        r[0]+=1; d=base+.25+r[0]*.15
        return f'<div class="row a side" style="--d:{d:.2f}"><div class="cap"><span class="ltr">{m.group(1)}</span></div><div class="p" data-to="{m.group(2)}" data-s="{d+.1:.2f}">{m.group(2)}</div><div class="p" data-to="{m.group(3)}" data-s="{d+.2:.2f}">{m.group(3)}</div></div>'
    part = re.sub(r'<div class="row"><div class="cap"><span class="ltr">(\w+)</span></div><div class="p">(\d+)</div><div class="p">(\d+)</div></div>', row, part)
    out.append(part)
p = '<div class="tbl a"'.join(out)
p = cls(p, '<div class="note">', '<div class="note a" style="--d:3.3">')
p = cls(p, '<div class="footer">', '<div class="footer a" style="--d:3.5">')
p = p.replace('</body>', SCRIPT + '</body>')
open('prices-motion.html','w',encoding='utf-8').write(p)
print('built')
