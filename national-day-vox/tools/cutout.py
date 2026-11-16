# اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
# cutout.py — قص تلقائي للأشخاص/المنتجات (rembg) → نسخة <الاسم>_cut.png جنب الأصل (الأصل ما يتعدّل).
# المحرك يستخدم النسخة المقصوصة تلقائياً إذا الصورة بقائمة CUT بـdata.js (أو STYLE.cutout = true)، والإطار الأبيض يلف على حدود الشكل كأنه مقصوص بمقص.
#   python tools/cutout.py assets/img/person.jpg assets/img/phone.png [--model u2netp|u2net|isnet-general-use]
#   u2netp = صغير (5MB، ينزل أول مرة) · isnet-general-use = أدق (170MB)
import sys, os
from PIL import Image
from rembg import remove, new_session

args = [a for a in sys.argv[1:] if not a.startswith('--')]
model = 'u2netp'
if '--model' in sys.argv: model = sys.argv[sys.argv.index('--model') + 1]; args = [a for a in args if a != model]
sess = new_session(model)
for f in args:
    im = Image.open(f).convert('RGBA')
    out = remove(im, session=sess, post_process_mask=True)
    a = out.split()[-1].point(lambda v: 0 if v < 24 else v)   # نشيل الهالة الخفيفة
    out.putalpha(a)
    bb = a.getbbox()
    if bb: out = out.crop((max(0, bb[0] - 4), max(0, bb[1] - 4), min(out.width, bb[2] + 4), min(out.height, bb[3] + 4)))
    dst = os.path.splitext(f)[0] + '_cut.png'
    out.save(dst)
    print('OK', dst, out.size)
