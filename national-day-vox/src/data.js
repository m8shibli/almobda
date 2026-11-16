// وين تروح في اليوم الوطني؟ — نسخة 30 ثانية. مولَّد من tools/gen15.py (توقيت مسودة بدون صوت).
export const SIZE = [1080, 1920];
export const FPS = 24;
export const DURATION = 30.0;
export const WORDS = 'plan/words.json';
export const CAPTIONS = true;
export const WM = 'assets/places/15_logo_almobda.jpg';   // شعار حقوق صغير على كامل الفيديو
export const STYLE = { motion: 'smooth', speed: 1.0, camera: 'one', images: 'color', halftone: 0, outline: 'white', blur: 5 };
const P = f => 'assets/places/' + f;
export const IMAGES = ['01_sohar_fort.jpg', '03_mosque_night.jpg', '04_wadi_waterfall.jpg', '16_suwaiq_kayak.jpg', '05_musannah_festival.jpg', '06_palm_walkway.jpg', '07_beach_hill_tower.jpg', '09_nizwa_souq.jpg', '10_jabal_akhdar.jpg', '11_oman_across_ages.jpg', '12_bahla_wall.jpg', '13_misfat.jpg', '17_bidiyah_dunes.jpg', '14_ferris_wheel.jpg', '02_lagoon_park_aerial.jpg', '15_logo_almobda.jpg'].map(P);
export const SHOTLIST = [
  { type: 'statement', start: 0, seed: 11, bg: 'aged', size: 104, lines: [{ t: 'وين تروح', ws: [0, 1] }, { t: 'في اليوم الوطني؟', ws: [2, 3, 4], hl: 'red' }] },
  { type: 'cards', start: 3.73, tr: 'slide', go: 'left', seed: 12, bg: 'kraft', items: [{ img: P('01_sohar_fort.jpg'), label: 'قلعة صحار', w: 6 }, { img: P('02_lagoon_park_aerial.jpg'), label: 'منتجع اليوبيل', w: 9 }] },
  { type: 'cards', start: 5.81, tr: 'pan', go: 'up', seed: 13, bg: 'cork', items: [{ img: P('03_mosque_night.jpg'), label: 'عين الكسفة', w: 11 }, { img: P('04_wadi_waterfall.jpg'), label: 'وادي الحوقين', w: 13 }] },
  { type: 'hero', start: 7.90, tr: 'slide', go: 'right', seed: 14, bg: 'map', w0: 15, img: P('16_suwaiq_kayak.jpg'), label: { t: 'شاطئ الشريسة', w: 16 } },
  { type: 'hero', start: 9.77, tr: 'zoom', go: 'left', seed: 15, bg: 'kraft', w0: 18, img: P('05_musannah_festival.jpg'), label: { t: 'مهرجان المصنعة', w: 19 } },
  { type: 'hero', start: 11.64, tr: 'pan', go: 'down', seed: 16, bg: 'aged', w0: 21, img: P('06_palm_walkway.jpg'), label: { t: 'حجرة الشيخ', w: 23 } },
  { type: 'hero', start: 13.51, tr: 'slide', go: 'left', seed: 17, bg: 'map', w0: 25, img: P('07_beach_hill_tower.jpg'), label: { t: 'شاطئ السوادي', w: 26 } },
  { type: 'cards', start: 15.37, tr: 'zoom', go: 'up', seed: 18, bg: 'kraft', items: [{ img: P('09_nizwa_souq.jpg'), label: 'سوق نزوى', w: 29 }, { img: P('10_jabal_akhdar.jpg'), label: 'الجبل الأخضر', w: 31 }] },
  { type: 'hero', start: 17.46, tr: 'pan', go: 'right', seed: 19, bg: 'aged', w0: 33, img: P('11_oman_across_ages.jpg'), label: { t: 'متحف عمان عبر الزمان', w: 34 } },
  { type: 'callout', start: 19.44, tr: 'slide', go: 'left', seed: 20, bg: 'kraft', w0: 38, img: P('12_bahla_wall.jpg'), circle: { x: .5, y: .55, rx: .3, ry: .22, w: 39, t: 'سور بهلاء', tw: 40 } },
  { type: 'hero', start: 21.20, tr: 'zoom', go: 'down', seed: 21, bg: 'map', w0: 41, img: P('13_misfat.jpg'), label: { t: 'مسفاة العبريين', w: 42 } },
  { type: 'hero', start: 23.07, tr: 'pan', go: 'left', seed: 22, bg: 'kraft', w0: 44, img: P('17_bidiyah_dunes.jpg'), label: { t: 'رمال بدية', w: 45 } },
  { type: 'hero', start: 24.83, tr: 'slide', go: 'right', seed: 23, bg: 'cork', w0: 47, img: P('14_ferris_wheel.jpg'), label: { t: 'عين صلالة', w: 48 } },
  { type: 'statement', start: 26.58, tr: 'zoom', go: 'left', seed: 24, bg: 'dark', size: 130, lines: [{ t: 'اختر وجهتك', ws: [50, 51] }, { t: 'وعيّد فيها', ws: [52, 53], hl: 'red' }], stamp: { t: 'اليوم الوطني', w: 53 } },
];
