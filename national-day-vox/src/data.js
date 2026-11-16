// وين تروح في اليوم الوطني؟ — الفيديو كامل (14 لقطة). توقيت مسودة بدون صوت (plan/words.json).
export const SIZE = [1080, 1920];
export const FPS = 24;
export const DURATION = 67.0;
export const WORDS = 'plan/words.json';
export const CAPTIONS = true;
export const STYLE = { motion: 'smooth', speed: .75, camera: 'one', images: 'color', halftone: 0, outline: 'white', blur: 5,
  backgrounds: ['aged', 'kraft', 'map', 'cork'], transitions: ['pan', 'folder', 'curl', 'route', 'zoom'] };
const P = f => 'assets/places/' + f;
export const IMAGES = ['01_sohar_fort.jpg', '03_mosque_night.jpg', '04_wadi_waterfall.jpg', '07_beach_hill_tower.jpg', '05_musannah_festival.jpg', '06_palm_walkway.jpg', '02_lagoon_park_aerial.jpg', '09_nizwa_souq.jpg', '10_jabal_akhdar.jpg', '11_oman_across_ages.jpg', '12_bahla_wall.jpg', '13_misfat.jpg', '14_ferris_wheel.jpg', '15_logo_almobda.jpg'].map(P);
export const SHOTLIST = [
  { type: 'statement', start: 0, seed: 11, bg: 'aged', kicker: { t: 'رحلة عبر عُمان', w: 0 }, size: 104,
    lines: [{ t: 'وين تروح', ws: [0, 1] }, { t: 'في اليوم الوطني؟', ws: [2, 3, 4], hl: 'red' }], stamp: { t: 'عُمان', w: 4 } },
  { type: 'hero', start: 5.0, tr: 'pan', go: 'left', seed: 12, bg: 'kraft', w0: 5, img: P('01_sohar_fort.jpg'), label: { t: 'قلعة صحار', w: 6 } },
  { type: 'cards', start: 8.3, tr: 'folder', folderLabel: 'الرستاق', go: 'up', seed: 13, bg: 'cork',
    items: [{ img: P('03_mosque_night.jpg'), label: 'عين الكسفة', w: 8 }, { img: P('04_wadi_waterfall.jpg'), label: 'وادي الحوقين', w: 10 }] },
  { type: 'hero', start: 15.0, tr: 'pan', go: 'right', seed: 14, bg: 'map', w0: 13, img: P('07_beach_hill_tower.jpg'), label: { t: 'شاطئ الشريسة', w: 14 } },
  { type: 'hero', start: 19.3, tr: 'curl', go: 'left', seed: 15, bg: 'kraft', w0: 16, img: P('05_musannah_festival.jpg'), label: { t: 'مهرجان المصنعة', w: 17 } },
  { type: 'hero', start: 24.3, tr: 'route', go: 'right', seed: 16, bg: 'aged', w0: 19, img: P('06_palm_walkway.jpg'), label: { t: 'حجرة الشيخ', w: 21 } },
  { type: 'hero', start: 29.2, tr: 'pan', go: 'up', seed: 17, bg: 'map', w0: 23, img: P('02_lagoon_park_aerial.jpg'), label: { t: 'شاطئ السوادي', w: 24 } },
  { type: 'cards', start: 33.3, tr: 'zoom', go: 'down', seed: 18, bg: 'kraft',
    items: [{ img: P('09_nizwa_souq.jpg'), label: 'سوق نزوى', w: 26 }, { img: P('10_jabal_akhdar.jpg'), label: 'الجبل الأخضر', w: 29 }] },
  { type: 'hero', start: 38.9, tr: 'curl', go: 'left', seed: 19, bg: 'aged', w0: 32, img: P('11_oman_across_ages.jpg'), label: { t: 'متحف عمان عبر الزمان', w: 33 } },
  { type: 'callout', start: 43.9, tr: 'pan', go: 'right', seed: 20, bg: 'kraft', w0: 36, img: P('12_bahla_wall.jpg'),
    circle: { x: .5, y: .55, rx: .3, ry: .22, w: 37, t: 'سور بهلاء', tw: 38 } },
  { type: 'hero', start: 47.4, tr: 'curl', go: 'left', seed: 21, bg: 'map', w0: 40, img: P('13_misfat.jpg'), label: { t: 'مسفاة العبريين', w: 40 } },
  { type: 'statement', start: 52.3, tr: 'pan', go: 'down', seed: 22, bg: 'map', size: 130,
    lines: [{ t: 'بدية', ws: [42] }, { t: 'رمال بدية', ws: [43, 44], hl: 'red' }] },
  { type: 'hero', start: 55.6, tr: 'route', go: 'right', seed: 23, bg: 'cork', w0: 45, img: P('14_ferris_wheel.jpg'), label: { t: 'عين صلالة', w: 46 } },
  { type: 'statement', start: 59.0, tr: 'zoom', go: 'left', seed: 24, bg: 'dark', size: 130,
    lines: [{ t: 'اختر وجهتك', ws: [48, 49] }, { t: 'وعيّد فيها', ws: [50, 51], hl: 'red' }], stamp: { t: 'اليوم الوطني', w: 51 } },
  { type: 'hero', start: 63.3, tr: 'pan', go: 'left', seed: 25, bg: 'aged', img: P('15_logo_almobda.jpg'), h: 1000, rot: -.02 },
];
