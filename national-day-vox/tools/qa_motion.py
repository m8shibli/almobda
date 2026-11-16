# اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
# qa_motion.py — فحص الحركة تلقائياً على الفيديو بعد الرندر:
#   1) صفايح فريمات كثيفة (كل فريم، 1.5 ث) حول كل انتقال → qa/tr_XX_T.jpg
#   2) حركات قصيرة جداً (< 8 فريمات) = سريعة زيادة/نطّة
#   3) «ورقة فاضية»: فترات > 0.7 ث وسط الشاشة ما فيه تفاصيل (بس خلفية)
#   python tools/qa_motion.py renders/draft.mp4 plan/events.json [qa]
import sys, os, json, subprocess
import numpy as np, cv2

vid, evf = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(vid) or '.', 'qa')
os.makedirs(out, exist_ok=True)
ev = json.load(open(evf, encoding='utf-8'))['events']
TR = {'pan', 'tear', 'flip', 'folder'}
cap = cv2.VideoCapture(vid); fps = cap.get(cv2.CAP_PROP_FPS) or 24
diffs, detail, prev = [], [], None
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (180, 320)), cv2.COLOR_BGR2GRAY).astype(np.float32)
    if prev is not None: diffs.append(float(np.mean(np.abs(g - prev))))
    else: diffs.append(0.)
    prev = g
    c = g[40:200, 20:160].astype(np.uint8)          # منطقة المحتوى (فوق الكابشن)
    detail.append(float(cv2.Canny(c, 60, 140).mean()))
diffs, detail = np.array(diffs), np.array(detail); n = len(diffs)
rep = [f'video {vid}: {n} frames @ {fps:.0f}fps']
# 2) مقاطع الحركة
thr = max(2.0, np.percentile(diffs, 60) * 1.5); mov = diffs > thr; i = 0
while i < n:
    if mov[i]:
        j = i
        while j < n and mov[j]: j += 1
        if j - i < 8 and diffs[i:j].max() > thr * 2.5: rep.append(f'SHORT MOTION {i/fps:6.2f}s  {j-i} frames (peak {diffs[i:j].max():.1f}) — سريعة/نطّة؟')
        i = j
    else: i += 1
# 3) فراغ
low = detail < max(1.2, np.percentile(detail, 15) * .8); i = 0
while i < n:
    if low[i]:
        j = i
        while j < n and low[j]: j += 1
        if (j - i) / fps > .7: rep.append(f'EMPTY {i/fps:6.2f}-{j/fps:6.2f}s — وسط الشاشة فاضي (ورقة بدون عناصر)')
        i = j
    else: i += 1
# 1) صفايح حول الانتقالات
k = 0
for e in ev:
    if e['k'] not in TR: continue
    t0 = max(0, e['t'] - .3); k += 1
    dst = os.path.join(out, f"tr_{k:02d}_{e['t']:.2f}.jpg")
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', f'{t0:.3f}', '-t', '1.5', '-i', vid, '-vf', 'scale=180:-1,tile=9x4', '-frames:v', '1', dst])
rep.append(f'{k} transition sheets → {out}')
open(os.path.join(out, 'report.txt'), 'w', encoding='utf-8').write('\n'.join(rep))
sys.stdout.reconfigure(encoding='utf-8'); print('\n'.join(rep))
