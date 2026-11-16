# اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
# draft_words.py — توقيت تقريبي للكلمات من السكربت (قبل ما يجهز الصوت) عشان تبني وتجرب الصور.
# usage: python tools/draft_words.py plan/script.txt plan/words.json [words_per_sec=2.6]
# كل سطر بالسكربت = لقطة. بين السطور وقفة 0.45 ث. يطبع بداية كل سطر ورقم أول كلمة فيه.
import json, sys
src, out = sys.argv[1], sys.argv[2]; wps = float(sys.argv[3]) if len(sys.argv) > 3 else 2.6
t, W = 0.3, []
for n, line in enumerate(l.strip() for l in open(src, encoding='utf8') if l.strip()):
    first = len(W)
    for w in line.split():
        d = max(.22, len(w) / 5.2 / wps * 1.9)
        W.append({'w': w, 's': round(t, 3), 'e': round(t + d * .9, 3)}); t += d
    print(f'line {n + 1}: start {W[first]["s"]:.2f}s  first word #{first}  «{line[:40]}»')
    t += .45
json.dump(W, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print(len(W), 'words, ends', round(t, 2))
