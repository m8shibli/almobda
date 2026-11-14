"""Synthesizes all sound effects + a light music bed from the cue sheet exported by render.js.
Usage: python3 sfx.py build/cues.json build/audio.wav
Everything is generated procedurally (no external samples) so it is royalty-free.
"""
import json, sys, wave
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(42)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, r=None, curve=6.0):
    """attack + exponential decay envelope"""
    x = np.arange(n) / SR
    e = np.exp(-curve * x / (r or (n / SR)))
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def sweep_filter(noise, f0, f1, q=1.2):
    """time-varying band-pass via short overlapping blocks"""
    n = len(noise); out = np.zeros(n); blk = 1024
    win = np.hanning(blk * 2)
    for i in range(0, n, blk):
        p = i / max(1, n - 1)
        fc = f0 * (f1 / f0) ** p
        lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 - 100)
        seg = noise[max(0, i - blk):i + blk]
        y = bp(seg, max(30, lo), hi)
        w = win[:len(y)] if len(y) == blk * 2 else np.hanning(len(y))
        s = max(0, i - blk)
        out[s:s + len(y)] += y * w
    return out


def stereo(m, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([m * l, m * r], 1)


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


# ---------------- effects ----------------
def whoosh(dur=0.7, vol=1.0, **_):
    n = int(dur * SR)
    x = sweep_filter(rng.standard_normal(n), 300, 5000, q=1.5)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    m = norm(x * shape, 0.55 * vol)
    pan = np.linspace(-0.7, 0.7, n)
    return np.stack([m * np.cos((pan + 1) * np.pi / 4), m * np.sin((pan + 1) * np.pi / 4)], 1)


def swoosh(dur=0.4, vol=1.0, **_):
    n = int(dur * SR)
    x = sweep_filter(rng.standard_normal(n), 2500, 600, q=2)
    shape = np.linspace(0, 1, n) ** 0.5 * np.linspace(1, 0, n) ** 1.5
    return stereo(norm(x * shape, 0.4 * vol), 0.2)


def pop(pitch=1.0, vol=1.0, **_):
    d = 0.16; tt = t_(d)
    f = 900 * pitch * np.exp(-tt * 22) + 260 * pitch
    ph = 2 * np.pi * np.cumsum(f) / SR
    m = np.sin(ph) * env(len(tt), 0.002, d, 7)
    click = hp(rng.standard_normal(len(tt)), 3000) * env(len(tt), 0.0005, 0.01, 8) * 0.15
    return stereo(norm(m + click, 0.55 * vol))


def tick(vol=1.0, **_):
    d = 0.05; tt = t_(d)
    m = np.sin(2 * np.pi * 2400 * tt) * env(len(tt), 0.0005, d, 9)
    return stereo(m * 0.18 * vol)


def impact(vol=1.0, **_):
    d = 1.2; tt = t_(d)
    sub = np.sin(2 * np.pi * (48 + 60 * np.exp(-tt * 18)) * tt) * env(len(tt), 0.002, d, 5)
    nz = lp(rng.standard_normal(len(tt)), 1800) * env(len(tt), 0.001, 0.25, 6)
    m = norm(sub * 1.0 + nz * 0.5, 0.85 * vol)
    return reverb(stereo(m), 0.18)


def boom(vol=1.0, **_):
    d = 2.2; tt = t_(d)
    sub = np.sin(2 * np.pi * (36 + 90 * np.exp(-tt * 14)) * tt) * env(len(tt), 0.002, d, 4)
    nz = lp(rng.standard_normal(len(tt)), 2500) * env(len(tt), 0.001, 0.5, 6)
    crack = hp(rng.standard_normal(len(tt)), 2000) * env(len(tt), 0.0005, 0.08, 7) * 0.4
    m = norm(sub + nz * 0.6 + crack, 1.0 * vol)
    return reverb(stereo(m), 0.3)


def riser(dur=1.2, vol=1.0, **_):
    n = int(dur * SR); tt = np.arange(n) / SR
    nz = sweep_filter(rng.standard_normal(n), 400, 8000, q=1.3)
    f = 180 * (6 ** (tt / dur))
    tone = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.15
    tone = lp(tone, 3000)
    shape = (tt / dur) ** 2.2
    return stereo(norm((nz + tone) * shape, 0.55 * vol))


def tension(dur=2.4, vol=1.0, **_):
    n = int(dur * SR); tt = np.arange(n) / SR
    m = sum(np.sin(2 * np.pi * f * tt) for f in (110, 116.5, 220.5))
    m *= (1 - np.exp(-tt * 2)) * np.minimum(1, (dur - tt) * 3)
    m = lp(m, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * tt))
    return reverb(stereo(norm(m, 0.25 * vol)), 0.2)


def bellnote(f, d=1.6, amp=1.0):
    tt = t_(d)
    parts = [(1, 1), (2.0, .5), (3.01, .25), (4.2, .12), (5.4, .06)]
    m = sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (2.5 + k * 1.6)) for k, a in parts)
    m[:120] *= np.linspace(0, 1, 120)
    return m * amp


def ding(vol=1.0, **_):
    return reverb(stereo(norm(bellnote(1568, 1.4), 0.4 * vol)), 0.25)


def success(vol=1.0, **_):
    out = np.zeros(int(1.8 * SR))
    for i, f in enumerate((1046.5, 1318.5, 1568, 2093)):
        b = bellnote(f, 1.2, 1.0); s = int(i * 0.09 * SR)
        out[s:s + len(b)] += b[:len(out) - s]
    return reverb(stereo(norm(out, 0.42 * vol)), 0.3)


def sparkle(vol=1.0, **_):
    out = np.zeros(int(1.4 * SR))
    for i in range(14):
        f = rng.uniform(2500, 6000); s = int(rng.uniform(0, 0.7) * SR)
        b = bellnote(f, 0.5, rng.uniform(.3, 1))
        out[s:s + len(b)] += b[:len(out) - s]
    m = norm(out, 0.22 * vol)
    return reverb(np.stack([m * rng.uniform(.6, 1), np.roll(m, 300)], 1), 0.3)


magic = sparkle


def key(seed=0, vol=1.0, **_):
    r = np.random.default_rng(seed + 100)
    d = 0.045; n = int(d * SR)
    x = bp(r.standard_normal(n), 1500 + r.uniform(-400, 600), 6000) * env(n, 0.0005, d, 10)
    body = np.sin(2 * np.pi * r.uniform(180, 260) * np.arange(n) / SR) * env(n, 0.0005, 0.02, 8) * 0.3
    return stereo(norm(x + body, 0.22 * vol * r.uniform(.75, 1)), r.uniform(-.2, .2))


def click(vol=1.0, **_):
    d = 0.05; n = int(d * SR)
    x = bp(rng.standard_normal(n), 800, 5000) * env(n, 0.0005, 0.02, 10)
    return stereo(norm(x, 0.35 * vol))


def send(vol=1.0, **_):
    d = 0.35; tt = t_(d)
    f = 500 + 1400 * (tt / d) ** 1.5
    m = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.005, d, 3) * np.linspace(1, 0, len(tt))
    return reverb(stereo(norm(m, 0.3 * vol)), 0.2)


def coin(pitch=1.0, vol=1.0, **_):
    d = 0.5; tt = t_(d)
    a = np.sin(2 * np.pi * 1975 * pitch * tt) + .6 * np.sin(2 * np.pi * 2637 * pitch * tt)
    m = a * env(len(tt), 0.001, d, 5)
    m[int(0.06 * SR):] += (np.sin(2 * np.pi * 2637 * pitch * tt) * env(len(tt), .001, d, 5))[:len(tt) - int(0.06 * SR)]
    return reverb(stereo(norm(m, 0.2 * vol), rng.uniform(-.5, .5)), 0.15)


def cash(vol=1.0, **_):
    out = np.zeros(int(1.6 * SR))
    b = bellnote(2349, 1.4); out[:len(b)] += b
    b = bellnote(3136, 1.2, .8); s = int(.08 * SR); out[s:s + len(b)] += b
    chk = bp(rng.standard_normal(int(.08 * SR)), 2000, 7000) * env(int(.08 * SR), .001, .08, 6)
    out[:len(chk)] += chk * 2
    return reverb(stereo(norm(out, 0.4 * vol)), 0.25)


def thud(vol=1.0, **_):
    d = 0.3; tt = t_(d)
    m = np.sin(2 * np.pi * (70 + 80 * np.exp(-tt * 30)) * tt) * env(len(tt), .001, d, 6)
    return stereo(norm(m, 0.6 * vol))


def stamp(vol=1.0, **_):
    d = 0.6; tt = t_(d)
    m = np.sin(2 * np.pi * (60 + 120 * np.exp(-tt * 40)) * tt) * env(len(tt), .001, d, 7)
    nz = bp(rng.standard_normal(len(tt)), 300, 3000) * env(len(tt), .0005, .06, 6)
    return reverb(stereo(norm(m + nz * .8, 0.85 * vol)), 0.2)


def heart(vol=1.0, **_):
    out = np.zeros(int(0.9 * SR))
    for s in (0, 0.22):
        d = 0.25; tt = t_(d)
        b = np.sin(2 * np.pi * (55 + 40 * np.exp(-tt * 25)) * tt) * env(len(tt), .002, d, 6)
        i = int(s * SR); out[i:i + len(b)] += b
    return stereo(norm(out, 0.7 * vol))


def bell(vol=1.0, **_):
    out = np.zeros(int(2.2 * SR))
    for i, f in enumerate((1318.5, 1760)):
        b = bellnote(f, 1.8); s = int(i * 0.15 * SR); out[s:s + len(b)] += b
    return reverb(stereo(norm(out, 0.42 * vol)), 0.35)


def outro(dur=1.6, vol=1.0, **_):
    n = int(2.5 * SR); tt = np.arange(n) / SR
    m = sum(np.sin(2 * np.pi * f * tt) for f in (220, 277.2, 329.6, 440))
    m *= np.exp(-tt * 1.2) * (1 - np.exp(-tt * 30))
    return reverb(stereo(norm(m, 0.3 * vol)), 0.4)


def reverb(x, wet=0.25, length=1.6):
    n = int(length * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / SR * 4.5)[:, None]
    ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
    ir /= np.sqrt(np.sum(ir ** 2, 0))
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c]) for c in range(2)], 1)
    out = np.zeros_like(y); out[:len(x)] = x
    return out + y * wet


# ---------------- music bed ----------------
def music(total):
    """A-minor pad + pluck arp + soft drums, 120 bpm. Drums enter with the logo reveal."""
    bpm = 120; beat = 60 / bpm; n = int(total * SR)
    mix = np.zeros((n, 2))
    chords = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G
    mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = 4 * beat; chord_len = 2 * bar
    tt_all = np.arange(n) / SR
    pad = np.zeros(n)
    for ci in range(int(total / chord_len) + 1):
        s = int(ci * chord_len * SR); e = min(n, int((ci + 1) * chord_len * SR) + int(.4 * SR))
        if s >= n: break
        tt = np.arange(e - s) / SR
        ch = chords[ci % 4]; seg = np.zeros(e - s)
        for m in ch:
            for det in (-0.08, 0.08):
                f = mtof(m) * 2 ** (det / 12)
                seg += sum(np.sin(2 * np.pi * f * k * tt) / k ** 1.6 for k in range(1, 7))
        fade = np.minimum(1, tt / .6) * np.minimum(1, (len(tt) / SR - tt) / .4)
        pad[s:e] += seg * fade
    pad = lp(pad, 1400) * 0.05
    mix += stereo(pad)
    # sub bass
    bass = np.zeros(n)
    for ci in range(int(total / chord_len) + 1):
        root = chords[ci % 4][0] - 24
        for b8 in range(16):
            st = ci * chord_len + b8 * beat / 2
            if st >= total: break
            d = beat / 2 * 0.9; tt = t_(d); s = int(st * SR)
            nn = np.sin(2 * np.pi * mtof(root) * tt) * env(len(tt), .004, d, 3)
            bass[s:s + len(nn)] += nn[:n - s]
    drums_in = 11.8
    bass_gain = np.where(tt_all < drums_in, 0.35, 1.0)
    mix += stereo(bass * 0.11 * bass_gain)
    # pluck arp
    arp = np.zeros(n)
    for ci in range(int(total / chord_len) + 1):
        ch = chords[ci % 4]; notes = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24]
        for k in range(16):
            st = ci * chord_len + k * beat / 2
            if st >= total: break
            f = mtof(notes[k % 4]); d = .35; tt = t_(d); s = int(st * SR)
            nn = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt)) * env(len(tt), .002, d, 6)
            arp[s:s + len(nn)] += nn[:n - s]
    arp_env = np.clip((tt_all - 3.4) / 1.0, 0, 1)
    mix += reverb(np.stack([arp * .6, np.roll(arp, int(.18 * SR)) * .6], 1) * 0.035, .35)[:n] * arp_env[:, None]
    # drums
    k_d = 0.4; kt = t_(k_d)
    kick = np.sin(2 * np.pi * (50 + 110 * np.exp(-kt * 30)) * kt) * env(len(kt), .001, k_d, 6)
    hat_n = int(.05 * SR); hat = hp(rng.standard_normal(hat_n), 7000) * env(hat_n, .0005, .05, 8)
    clap_n = int(.2 * SR); clap = bp(rng.standard_normal(clap_n), 900, 4000) * env(clap_n, .001, .2, 7)
    b = 0; drum = np.zeros(n)
    while b * beat < total:
        st = b * beat
        if st >= drums_in and st < total - 2.5:
            s = int(st * SR); drum[s:s + len(kick)] += (kick * .5)[:n - s]
            if b % 2 == 1:
                drum[s:s + clap_n] += (clap * .12)[:n - s]
            s2 = int((st + beat / 2) * SR)
            if s2 < n: drum[s2:s2 + hat_n] += (hat * .08)[:n - s2]
        b += 1
    mix += reverb(stereo(drum), .12)[:n] * 0.5
    # sidechain-ish pump on pad (gentle) after drums enter
    pump = 1 - 0.25 * np.exp(-((tt_all - drums_in) % beat) * 10) * (tt_all >= drums_in)
    mix *= pump[:, None]
    # global fades
    mix *= np.minimum(1, tt_all / 1.5)[:, None] * np.clip((total - tt_all) / 2.5, 0, 1)[:, None]
    return mix


def main(cue_path, out_path):
    data = json.load(open(cue_path))
    total = data['duration'] + 0.5
    n = int(total * SR)
    fx = np.zeros((n + 5 * SR, 2))
    gen = {k: v for k, v in globals().items() if callable(v)}
    for c in data['cues']:
        kind = c.pop('type'); t0 = c.pop('t')
        y = gen[kind](**c)
        s = max(0, int(t0 * SR)); fx[s:s + len(y)] += y
    fx = fx[:n]
    mus = music(total)
    mix = mus * 0.9 + fx * 0.85
    # soft limiter
    mix = np.tanh(mix * 1.15) / np.tanh(1.15)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.93
    pcm = (mix * 32767).astype(np.int16)
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('wrote', out_path, f'{total:.1f}s')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
