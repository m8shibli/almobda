// وين تروح في اليوم الوطني؟ — أول 8 ثواني (لقطة 1 السؤال + لقطة 2 قلعة صحار). توقيت مسودة بدون صوت.
export const SIZE = [1080, 1920];
export const FPS = 24;
export const DURATION = 8.6;
export const WORDS = 'plan/words.json';
export const CAPTIONS = true;
export const STYLE = { motion: 'smooth', speed: .75, camera: 'one', images: 'color', halftone: 0, outline: 'white', blur: 5,
  backgrounds: ['aged', 'kraft', 'map', 'cork'], transitions: ['pan', 'folder', 'curl', 'route', 'zoom'] };
const P = f => 'assets/places/' + f;
export const IMAGES = ['01_sohar_fort.jpg', '03_mosque_night.jpg', '04_wadi_waterfall.jpg', '07_beach_hill_tower.jpg', '05_musannah_festival.jpg', '06_palm_walkway.jpg', '02_lagoon_park_aerial.jpg', '09_nizwa_souq.jpg', '10_jabal_akhdar.jpg', '11_oman_across_ages.jpg', '12_bahla_wall.jpg', '13_misfat.jpg', '14_ferris_wheel.jpg'].map(P);
export const SHOTLIST = [
  { type: 'statement', start: 0, seed: 11, bg: 'aged', kicker: { t: 'رحلة عبر عُمان', w: 0 },
    lines: [{ t: 'وين تروح', ws: [0, 1] }, { t: 'في اليوم الوطني؟', ws: [2, 3, 4], hl: 'red' }], size: 104, stamp: { t: 'عُمان', w: 4 } },
  { type: 'hero', start: 5.0, tr: 'pan', go: 'left', seed: 12, bg: 'kraft', w0: 5, img: P('01_sohar_fort.jpg'), label: { t: 'قلعة صحار', w: 6 } },
];
