# اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
# soundboard.py — لوحة أصوات: فيديو فيه كل صوت بالمكتبة مع اسمه، عشان تسمعها وتختار/تحذف.
#   python tools/soundboard.py [renders/soundboard.mp4]
import os, sys, glob, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'renders', 'soundboard.mp4')
tmp = os.path.join(os.path.dirname(out), '_sb'); os.makedirs(tmp, exist_ok=True)
DESC = dict(slide='paper slides in', pan='camera move (soft)', paper='paper lands', pin='push pin', tape='tape stick / peel', stamp='rubber stamp',
            tear='paper tear', flip='page flip / newspaper', folder='folder open/close')
files = sorted(glob.glob(os.path.join(root, 'assets', 'sfx', '*.wav')))
SR = 48000; GAP = .55; audio = []; segs = []
def rd(f):
    w = wave.open(f); n = w.getnframes(); ch = w.getnchannels(); sw = w.getsampwidth(); sr = w.getframerate(); d = w.readframes(n); w.close()
    a = np.frombuffer(d, dtype={1: np.int8, 2: np.int16, 4: np.int32}[sw]).astype(np.float32) / (2 ** (8 * sw - 1))
    if ch > 1: a = a.reshape(-1, ch).mean(1)
    if sr != SR: a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a)
    return a
try: F = ImageFont.truetype('arialbd.ttf', 92); F2 = ImageFont.truetype('arial.ttf', 52)
except Exception: F = F2 = ImageFont.load_default()
for i, f in enumerate(files):
    a = rd(f); a = a / max(1e-4, np.abs(a).max()) * .7; seg = np.concatenate([np.zeros(int(.15 * SR)), a, np.zeros(int(GAP * SR))]); audio.append(seg)
    name = os.path.splitext(os.path.basename(f))[0]; kind = name.split('_')[0]
    im = Image.new('RGB', (1080, 1080), (34, 32, 28)); d = ImageDraw.Draw(im)
    d.rectangle([90, 380, 990, 700], fill=(237, 226, 200)); d.text((540, 480), name, font=F, fill=(28, 26, 22), anchor='mm'); d.text((540, 600), DESC.get(kind, ''), font=F2, fill=(184, 35, 27), anchor='mm')
    d.text((540, 940), f'{i + 1}/{len(files)}', font=F2, fill=(200, 190, 170), anchor='mm')
    p = os.path.join(tmp, f'{i:03d}.png'); im.save(p); segs.append((p, len(seg) / SR))
A = np.concatenate(audio); wav = os.path.join(tmp, 'a.wav')
with wave.open(wav, 'w') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(A, -1, 1) * 32767).astype(np.int16).tobytes())
lst = os.path.join(tmp, 'list.txt')
with open(lst, 'w') as L:
    for p, d in segs: L.write(f"file '{p}'\nduration {d:.4f}\n")
    L.write(f"file '{segs[-1][0]}'\n")
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-i', wav, '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-crf', '24', '-c:a', 'aac', '-b:a', '160k', '-shortest', out], check=True)
print('OK', out, f'{len(files)} sounds, {len(A) / SR:.1f}s')
