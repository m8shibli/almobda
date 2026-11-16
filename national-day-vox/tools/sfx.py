# اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
# sfx.py — مؤثرات Vox: أصوات حقيقية (CC0) من assets/sfx/ (ورق، دبوس، لزيق، ختم، تمزيق، ملف، قلب صفحة)،
# وإذا الصوت ناقص يرجع للمولّد بالكود. بدون موسيقى ولا لحن ولا آلات. كل حدث ياخذ نسخة مختلفة + فرق بسيط بالطبقة والعلو.
# usage: python tools/sfx.py plan/events.json assets/audio/sfx.wav [bed=1]
import json, sys, wave, glob, os
import numpy as np
SR = 48000
R = np.random.default_rng(7)

def band(x, lo, hi):                                   # فلتر تمرير نطاق عن طريق FFT
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def env(n, a, d):                                      # هجوم/اضمحلال
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def nz(sec): return R.standard_normal(int(sec * SR))
def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak

def paper():      # ورقة تنحط: خشخشة قصيرة + نقرة خفيفة منخفضة
    n = int(.22 * SR); x = band(nz(.22), 1800, 7000) * env(n, .004, .05) * (1 + .6 * np.sin(np.arange(n) / SR * 2 * np.pi * 31))
    th = band(nz(.22), 60, 300) * env(n, .002, .03); return norm(x + th * .8, .5)
def tear():       # تمزيق ورق: ضوضاء متقطعة يرتفع نطاقها
    n = int(.34 * SR); x = nz(.34); out = np.zeros(n)
    for i, (lo, hi) in enumerate([(700, 2500), (1200, 4000), (2000, 6500), (3000, 9000)]):
        s = slice(i * n // 4, (i + 1) * n // 4); out[s] = band(x, lo, hi)[s]
    g = (R.random(n) > .55).astype(float); g = np.convolve(g, np.ones(90) / 90, 'same')
    return norm(out * g * env(n, .01, .18), .45)
def thud():       # ورقة كبيرة تستقر
    n = int(.3 * SR); t = np.arange(n) / SR; return norm(np.sin(2 * np.pi * (70 - 30 * t) * t) * env(n, .003, .07) + band(nz(.3), 100, 900) * env(n, .001, .02) * .5, .55)
def hit():        # ضربة البداية
    n = int(.6 * SR); t = np.arange(n) / SR; return norm(np.sin(2 * np.pi * (55 - 20 * t) * t) * env(n, .002, .16) + band(nz(.6), 80, 2500) * env(n, .001, .05) * .7, .75)
def stamp():      # ختم: ضربة جافة + خبطة خشب
    n = int(.25 * SR); t = np.arange(n) / SR; return norm(band(nz(.25), 300, 3500) * env(n, .001, .025) + np.sin(2 * np.pi * 110 * t) * env(n, .001, .05) * .8, .7)
def marker():     # ماركر يرسم: خربشة
    n = int(.5 * SR); t = np.arange(n) / SR; x = band(nz(.5), 2500, 8000) * (.55 + .45 * np.sin(2 * np.pi * 14 * t)) * np.minimum(1, t / .03) * np.minimum(1, (.5 - t) / .08)
    return norm(x, .32)
def flip():       # شارة تنقلب: نفخة قصيرة
    n = int(.3 * SR); return norm(band(nz(.3), 600, 4000) * np.hanning(n), .35)
def count():      # عدّاد: سحبة ناعمة (مو تكات تحت الكلام)
    n = int(.8 * SR); t = np.arange(n) / SR; return norm(band(nz(.8), 900, 5000) * np.hanning(n) * (.6 + .4 * t / .8), .22)
def lift():       # رفعة الخاتمة: نفخ يرتفع ويختفي (بدون نغمة)
    n = int(1.4 * SR); t = np.arange(n) / SR; x = nz(1.4); a = band(x, 300, 1500) * (1 - t / 1.4) + band(x, 1500, 7000) * (t / 1.4)
    return norm(a * np.sin(np.pi * t / 1.4) ** 2, .35)
def pin():        # دبوس ينغرز: نقرة جافة صغيرة
    n = int(.12 * SR); t = np.arange(n) / SR; return norm(band(nz(.12), 1500, 6000) * env(n, .0005, .008) + np.sin(2 * np.pi * 240 * t) * env(n, .001, .02) * .5, .45)
def tapes():      # شريط لاصق ينسحب وينلصق
    n = int(.28 * SR); t = np.arange(n) / SR; x = band(nz(.28), 900, 5000) * (.5 + .5 * (R.random(n) > .7)) * np.hanning(n); return norm(x, .3)
def stringz():    # خيط ينشد: سحبة ناعمة
    n = int(.4 * SR); return norm(band(nz(.4), 1200, 4500) * np.hanning(n) ** 2, .2)
def whoosh():     # ورقة تنسحب بسرعة: نفخة تمرّ (بدون نغمة)
    n = int(.45 * SR); t = np.arange(n) / SR; x = nz(.45); lo = band(x, 250, 1400); hi = band(x, 1400, 6000); m = t / .45
    return norm((lo * (1 - m) + hi * m) * np.sin(np.pi * m) ** 1.5, .42)
KIT = dict(slide=whoosh, pan=whoosh, folder=thud, paper=paper, tear=tear, thud=thud, hit=hit, stamp=stamp, marker=marker, flip=flip, count=count, lift=lift, pin=pin, tape=tapes, string=stringz, whoosh=whoosh)

def bed(sec):     # هواء غرفة خفيف (ضوضاء بنية مفلترة) — بدون إيقاع
    x = np.cumsum(R.standard_normal(int(sec * SR))); x -= np.convolve(x, np.ones(4800) / 4800, 'same'); x = band(x, 40, 1200)
    t = np.arange(len(x)) / SR; return norm(x * (1 + .15 * np.sin(2 * np.pi * .07 * t)), .05)

# ---------- الأصوات الحقيقية ----------
HERE = os.path.dirname(os.path.abspath(__file__)); SDIR = os.path.join(HERE, '..', 'assets', 'sfx')
# علو كل نوع (الراوي فوق كل شي). slide = دخول ورقة: خفيف عشان ما يزعج
GAIN = dict(slide=.28, pan=.32, paper=.55, pin=.7, tape=.45, stamp=.85, tear=.6, flip=.4, folder=.6, string=.0, whoosh=.3)
def load(f):
    with wave.open(f) as w: n = w.getnframes(); x = np.frombuffer(w.readframes(n), '<i2').astype(np.float32) / 32768; ch = w.getnchannels()
    return x.reshape(-1, ch).mean(1) if ch > 1 else x
SAMPLES = {}
for f in sorted(glob.glob(os.path.join(SDIR, '*.wav'))):
    k = os.path.basename(f).rsplit('_', 1)[0]; SAMPLES.setdefault(k, []).append(load(f))
ALIAS = dict(whoosh='slide')
def real(k, t, i):
    k2 = ALIAS.get(k, k); v = SAMPLES.get(k2)
    if not v: return None
    x = v[(i * 7 + int(t * 10)) % len(v)]
    sp = 1 + (((i * 37) % 11) - 5) * .006                 # ±3% طبقة
    x = np.interp(np.arange(0, len(x) - 1, sp), np.arange(len(x)), x)
    g = GAIN.get(k2, .5) * (1 + (((i * 53) % 9) - 4) * .03) # ±1 dB
    return x / (np.abs(x).max() + 1e-9) * g

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]; use_bed = (sys.argv[3] if len(sys.argv) > 3 else '1') != '0'
    data = json.load(open(src, encoding='utf8')); dur = data['duration'] + 1
    mix = np.zeros(int(dur * SR)); cache = {}; last = {}
    for e in data['events']:
        k, t = e['k'], e['t']
        if t - last.get(k, -9) < .12: continue           # لا تكرار ملتصق
        last[k] = t; n_ev = len(last) + int(t * 100)
        s = real(k, t, n_ev)
        if s is None:
            if GAIN.get(k, 1) == 0: continue
            s = cache.setdefault(k, KIT[k]())
        i = int(t * SR); j = min(len(mix), i + len(s)); mix[i:j] += s[: j - i]
    if use_bed: mix += bed(dur)
    mix = np.tanh(mix * 1.1) * .89
    pcm = (mix * 32767).astype('<i2')
    with wave.open(out, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(len(data['events']), 'events ->', out, f'{dur:.1f}s')
