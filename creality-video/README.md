# فيديو Creality × Salem MENA — عُمان

- `input/source.mov` — الفيديو الأصلي (لا يُرفع إلى المستودع).
- `scene.html` — الترجمة العربية لكلام المتحدثة (جدول `SUBS`) + بطاقة الاسم + الخاتمة بموشن جرافيك (3 بوسترات + بطاقة التواصل)، بخط Thick Naskh Swash.
- `render.js` — يصوّر الإطارات عبر Playwright ويرمّزها بـ ffmpeg.
- `audio.py` + `sfx.py` — صوت الأصل منقّى + مؤثرات + موسيقى خلفية للخاتمة (مولّدة برمجياً، بدون حقوق).
- `build.sh <source.mov>` — يبني كل شيء ويخرج `output/creality-oman.mp4` و`output/creality-oman-ar.srt`.
