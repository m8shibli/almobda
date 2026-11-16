// اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
// data.js — جدول اللقطات (مثال يستعرض كل الأنواع بستايل «كولاج الجرايد»).
// w = رقم الكلمة في plan/words.json (العنصر يطلع على نطقها بالضبط). ws = رقم كلمة لكل كلمة بالعنوان (تزامن كلمة بكلمة).
// انواع اللقطات: statement · hero · cards · board · beforeafter · callout · counter · grid · list · quote
// bg: aged (ورق قديم، الافتراضي) · news (جرايد) · kraft · white · dark   ·   go (اتجاه دخول الورقة): left · right · up · down   ·   tr: pan · tear · hole · zoom · slide
// الصور: jpg/png = حسب STYLE.images (أبيض وأسود halftone بإطار أبيض وخط أحمر) · 'map:N' = خريطة ملوّنة جاهزة · svg (شعارات) = بألوانها دايماً · color:true = ملوّنة غصب
export const SIZE = [1080, 1920];          // 1080×1920 ريلز/شورت · 1920×1080 يوتيوب · 1080×1350 لينكدإن
export const FPS = 24;                     // على اثنين = 12 وضعية بالثانية
export const DURATION = 43.6;              // آخر كلمة + 0.5 ث تقريباً
export const WORDS = 'plan/words.json';    // [{w,s,e}] من WhisperX (أو draft_words.py للتجربة)
export const CAPTIONS = true;
// STYLE = أجوبة أسئلة البداية (شوف SKILL.md · المرحلة 1):
//   motion: 'smooth' (ناعم + motion blur) · 'twos' (مقطّع على اثنين)   speed: 0.75 هادي · 1 عادي · 1.35 سريع
//   camera: 'one' (كاميرا وحدة تمشي بين الأوراق) · 'cuts' (ورقة فوق ورقة / تمزيق)
//   images: 'mix' (صور أبيض وأسود + خرائط/شعارات ملوّنة) · 'bw' · 'color'   halftone: 0..0.3   outline: 'red' | 'white' | null
//   transitions: null (تلقائي) أو مصفوفة تدور: ['pan','tear','hole','zoom','slide']   — أو حط tr على أي لقطة
export const STYLE = { motion: 'smooth', speed: 1, camera: 'one', images: 'mix', halftone: .18, outline: 'red', blur: 5 };
const I = f => 'assets/img/' + f;
export const IMAGES = ['claudecode-color.svg', 'claude-color.svg', '06_server_aisle.jpg', '18_riyadh_rooftop.jpg', '36_map_room.jpg', '37_mountain_dawn.jpg', '50_field_tree.jpg', '24_race_start.jpg', '11_saudi_majlis.jpg'].map(I);

export const SHOTLIST = [
  { type: 'statement', start: 0, seed: 1, bg: 'news', kicker: { t: 'عدد خاص · اختيار ذكي', w: 0 },
    lines: [{ t: 'ليش فيديوهات الشرح', ws: [0, 1, 2] }, { t: 'كلها ورق ممزّق؟', ws: [4, 5, 6], hl: 'yellow' }], stamp: { t: 'سؤال', w: 6 } },
  { type: 'hero', start: 5.15, tr: 'pan', go: 'left', seed: 2, w0: 7, img: I('claudecode-color.svg'),
    scenes: [{ img: I('37_mountain_dawn.jpg'), w: 7 }, { img: I('06_server_aisle.jpg'), w: 13 }], label: { t: 'كود 100%', w: 14 } },
  { type: 'cards', start: 11.05, tr: 'tear', go: 'up', seed: 3,
    items: [{ img: I('50_field_tree.jpg'), label: 'كروت', w: 16 }, { text: 'أختام', w: 17 },
            { img: I('18_riyadh_rooftop.jpg'), label: 'حقيقة + مصدر', w: 19, stamp: 'مصدر ✓', sw: 21 }, { text: 'مخترَع', w: 20, strike: true, kw: 21 }] },
  { type: 'beforeafter', start: 16.0, tr: 'pan', go: 'right', seed: 4, w0: 22, w: 25,
    before: { chip: '2019', text: 'قبل', img: I('06_server_aisle.jpg') }, after: { chip: '2026', text: 'بعد', img: I('18_riyadh_rooftop.jpg'), stamp: 'انقلبت' } },
  { type: 'callout', start: 20.7, tr: 'zoom', go: 'down', seed: 5, bg: 'kraft', w0: 28, img: I('36_map_room.jpg'),
    circle: { x: .5, y: .45, rx: .26, ry: .2, w: 30, t: 'المهم هنا', tw: 33, ny: 1 } },
  { type: 'counter', start: 25.2, tr: 'hole', go: 'left', seed: 6, bg: 'kraft', from: 0, to: 100, w0: 35, w1: 37, label: 'بالضبط', wl: 38 },
  { type: 'grid', start: 29.15, tr: 'slide', go: 'up', seed: 7, rows: 4, cols: 3, img: I('claude-color.svg'), odd: 7, oddLabel: 'غير', w: 45, stamp: 'مختلف' },
  { type: 'board', start: 34.1, tr: 'pan', go: 'right', seed: 8,
    items: [{ text: 'السؤال', w: 47 }, { img: I('36_map_room.jpg'), label: 'الحقائق', w: 48 }, { text: 'سطر لكل لقطة', w: 49 },
            { img: I('claudecode-color.svg'), label: 'نوع اللقطة', w: 50 }, { text: 'الرندر', w: 51 }] },
  { type: 'statement', start: 38.5, tr: 'tear', bg: 'dark', go: 'left', seed: 9, size: 170,
    lines: [{ t: 'سؤال واحد', ws: [54, 55] }, { t: 'فيلم كامل', ws: [56, 57], hl: 'red' }], stamp: { t: 'VOX', w: 57 } },
];
