# اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
# words_from_whisperx.py — يحوّل JSON حق WhisperX إلى plan/words.json [{w,s,e}] ويطبع كل كلمة برقمها (عشان تحط w: بالـdata.js).
# usage: python tools/words_from_whisperx.py vo.json plan/words.json
# قبلها: whisperx vo.wav --language ar --model large-v3 --output_format json   (للعربي لا تستخدم موديل small.en)
import json, sys
src, out = sys.argv[1:3]
d = json.load(open(src, encoding='utf8')); W = []
for seg in d['segments']:
    for w in seg.get('words', []):
        if 'start' not in w:                       # كلمة بدون توقيت (رقم غالباً): خذ نهاية اللي قبلها
            w['start'] = W[-1]['e'] if W else seg['start']; w['end'] = w['start'] + .3
        W.append({'w': w['word'].strip(), 's': round(w['start'], 3), 'e': round(w['end'], 3)})
json.dump(W, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print('  '.join(f'{i}:{w["w"]}@{w["s"]:.2f}' for i, w in enumerate(W)))
print(len(W), 'words, last ends', W[-1]['e'])
