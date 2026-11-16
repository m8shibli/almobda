# gen15.py — يولّد plan/script.txt + plan/words.json + src/data.js لنسخة الـ15 ثانية (توقيت مسودة بدون صوت)
import json
TOTAL = 15.0
# (سطر، نوع اللقطة، إعدادات) — الأرقام تنحسب تلقائياً من الكلمات
LINES = [
 ('وين تروح في اليوم الوطني؟', 1.75),
 ('صحار: قلعة صحار ومنتجع اليوبيل', .95),
 ('الرستاق: عين الكسفة ووادي الحوقين', .95),
 ('السويق: شاطئ الشريسة', .85),
 ('المصنعة: مهرجان المصنعة', .85),
 ('وادي المعاول: حجرة الشيخ', .85),
 ('بركاء: شاطئ السوادي', .85),
 ('نزوى: سوق نزوى والجبل الأخضر', .95),
 ('منح: متحف عمان عبر الزمان', .9),
 ('بهلاء: سور بهلاء', .8),
 ('الحمراء: مسفاة العبريين', .85),
 ('بدية: رمال بدية', .8),
 ('صلالة: عين صلالة', .8),
 ('اختر وجهتك وعيّد فيها', 1.5),
]
open('plan/script.txt', 'w', encoding='utf8').write('\n'.join(l for l, _ in LINES) + '\n')
K = TOTAL / sum(d for _, d in LINES); LINES = [(l, d * K) for l, d in LINES]
W, starts, first, t = [], [], [], 0.0
for line, dur in LINES:
    ws = line.split(); starts.append(t); first.append(len(W)); step = dur * .8 / len(ws)
    for k, w in enumerate(ws): s = t + .08 + k * step; W.append({'w': w, 's': round(s, 3), 'e': round(s + step * .9, 3)})
    t += dur
print('total', round(t, 2))
json.dump(W, open('plan/words.json', 'w', encoding='utf8'), ensure_ascii=False, indent=0)
F = first; S = starts; P = lambda f: f"P('{f}')"
def hero(i, tr, go, img, label, lw, bg, seed, extra=''):   # lw = رقم الكلمة داخل السطر
    return f"  {{ type: 'hero', start: {S[i]-.12:.2f}, tr: '{tr}', go: '{go}', seed: {seed}, bg: '{bg}', w0: {F[i]}, img: {P(img)}, label: {{ t: '{label}', w: {F[i]+lw} }}{extra} }},"
def cards(i, tr, go, items, bg, seed):
    it = ', '.join(f"{{ img: {P(f)}, label: '{l}', w: {F[i]+k} }}" for f, l, k in items)
    return f"  {{ type: 'cards', start: {S[i]-.12:.2f}, tr: '{tr}', go: '{go}', seed: {seed}, bg: '{bg}', items: [{it}] }},"
shots = [
 f"  {{ type: 'statement', start: 0, seed: 11, bg: 'aged', size: 104, lines: [{{ t: 'وين تروح', ws: [0, 1] }}, {{ t: 'في اليوم الوطني؟', ws: [2, 3, 4], hl: 'red' }}] }},",
 cards(1, 'slide', 'left', [('01_sohar_fort.jpg', 'قلعة صحار', 1), ('02_lagoon_park_aerial.jpg', 'منتجع اليوبيل', 4)], 'kraft', 12),
 cards(2, 'pan', 'up', [('03_mosque_night.jpg', 'عين الكسفة', 1), ('04_wadi_waterfall.jpg', 'وادي الحوقين', 3)], 'cork', 13),
 hero(3, 'slide', 'right', '16_suwaiq_kayak.jpg', 'شاطئ الشريسة', 1, 'map', 14),
 hero(4, 'zoom', 'left', '05_musannah_festival.jpg', 'مهرجان المصنعة', 1, 'kraft', 15),
 hero(5, 'pan', 'down', '06_palm_walkway.jpg', 'حجرة الشيخ', 2, 'aged', 16),
 hero(6, 'slide', 'left', '07_beach_hill_tower.jpg', 'شاطئ السوادي', 1, 'map', 17),
 cards(7, 'zoom', 'up', [('09_nizwa_souq.jpg', 'سوق نزوى', 1), ('10_jabal_akhdar.jpg', 'الجبل الأخضر', 3)], 'kraft', 18),
 hero(8, 'pan', 'right', '11_oman_across_ages.jpg', 'متحف عمان عبر الزمان', 1, 'aged', 19),
 f"  {{ type: 'callout', start: {S[9]-.12:.2f}, tr: 'slide', go: 'left', seed: 20, bg: 'kraft', w0: {F[9]}, img: {P('12_bahla_wall.jpg')}, circle: {{ x: .5, y: .55, rx: .3, ry: .22, w: {F[9]+1}, t: 'سور بهلاء', tw: {F[9]+2} }} }},",
 hero(10, 'zoom', 'down', '13_misfat.jpg', 'مسفاة العبريين', 1, 'map', 21),
 hero(11, 'pan', 'left', '17_bidiyah_dunes.jpg', 'رمال بدية', 1, 'kraft', 22),
 hero(12, 'slide', 'right', '14_ferris_wheel.jpg', 'عين صلالة', 1, 'cork', 23),
 f"  {{ type: 'statement', start: {S[13]-.12:.2f}, tr: 'zoom', go: 'left', seed: 24, bg: 'dark', size: 130, lines: [{{ t: 'اختر وجهتك', ws: [{F[13]}, {F[13]+1}] }}, {{ t: 'وعيّد فيها', ws: [{F[13]+2}, {F[13]+3}], hl: 'red' }}], stamp: {{ t: 'اليوم الوطني', w: {F[13]+3} }} }},",
]
imgs = ['01_sohar_fort','03_mosque_night','04_wadi_waterfall','16_suwaiq_kayak','05_musannah_festival','06_palm_walkway','07_beach_hill_tower','09_nizwa_souq','10_jabal_akhdar','11_oman_across_ages','12_bahla_wall','13_misfat','17_bidiyah_dunes','14_ferris_wheel','02_lagoon_park_aerial','15_logo_almobda']
open('src/data.js', 'w', encoding='utf8').write(f"""// وين تروح في اليوم الوطني؟ — نسخة 15 ثانية سريعة. مولَّد من tools/gen15.py (توقيت مسودة بدون صوت).
export const SIZE = [1080, 1920];
export const FPS = 24;
export const DURATION = {TOTAL};
export const WORDS = 'plan/words.json';
export const CAPTIONS = true;
export const WM = 'assets/places/15_logo_almobda.jpg';   // شعار حقوق صغير على كامل الفيديو
export const STYLE = {{ motion: 'smooth', speed: 1.5, camera: 'one', images: 'color', halftone: 0, outline: 'white', blur: 5 }};
const P = f => 'assets/places/' + f;
export const IMAGES = [{', '.join("'%s.jpg'" % i for i in imgs)}].map(P);
export const SHOTLIST = [
""" + '\n'.join(shots) + "\n];\n")
