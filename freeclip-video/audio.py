"""Audio mix for the FreeClip 2S edit.
voice (cleaned) + procedural SFX (sfx.py) + crowd/street ambience under the noise-isolation line + luxury music bed ducked under speech.
Usage: python3 audio.py <voice.wav 48k stereo> <cues.json> <out.wav>
Everything is synthesised here (no external samples).
"""
import json, sys, wave
import numpy as np
from scipy import signal
import sfx
from sfx import SR, lp, hp, bp, env, reverb, stereo, norm

rng = np.random.default_rng(11)


def read_wav(p):
    w = wave.open(p)
    assert w.getframerate() == SR and w.getsampwidth() == 2
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    return a.reshape(-1, w.getnchannels()) if w.getnchannels() == 2 else np.stack([a, a], 1)


# ---------------- extra SFX ----------------
def shimmer(vol=1.0, **_):
    """bright rising bell cluster for title reveals"""
    n = int(2.2 * SR); out = np.zeros(n)
    for k, f in enumerate([1318.5, 1760, 2093, 2637, 3136, 3520]):
        s = int(k * .045 * SR); tt = np.arange(n - s) / SR
        out[s:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.2) * (1 - np.exp(-tt * 200)) / (1 + k * .25)
    return reverb(stereo(norm(out, .22 * vol)), .55, 2.2)


sfx.shimmer = shimmer


# ---------------- ambience: crowd chatter + street ----------------
def crowd(voice_mono, dur):
    """Babble made from many re-pitched, partly reversed snippets of speech, so no words are intelligible."""
    n = int(dur * SR); out = np.zeros((n, 2))
    L = len(voice_mono)
    for k in range(22):
        ln = int(rng.uniform(1.2, 2.6) * SR)
        st = rng.integers(0, L - ln)
        seg = voice_mono[st:st + ln].copy()
        if k % 2: seg = seg[::-1]
        fac = rng.uniform(.78, 1.28)                    # different "people"
        seg = signal.resample(seg, int(len(seg) / fac))
        seg *= np.hanning(len(seg)) ** .3
        pos = int(rng.uniform(-.4, dur - .8) * SR)
        a, b = max(0, pos), min(n, pos + len(seg))
        if b <= a: continue
        pan = rng.uniform(-.9, .9)
        out[a:b] += stereo(seg[a - pos:b - pos], pan) * rng.uniform(.5, 1)
    out[:, 0] = bp(out[:, 0], 220, 3800); out[:, 1] = bp(out[:, 1], 220, 3800)
    return reverb(out, .6, 1.4)[:n]


def street(dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    brown = np.cumsum(rng.standard_normal(n)); brown -= lp(brown, 8); brown = norm(lp(brown, 260))
    rumble = stereo(brown * .55)
    hiss = np.stack([bp(rng.standard_normal(n), 500, 4000), bp(rng.standard_normal(n), 500, 4000)], 1) * .05
    out = rumble + hiss
    # passing cars
    for t0, pan_dir, d in [(.5, 1, 2.6), (1.9, -1, 2.2)]:
        g = np.exp(-((tt - t0 - d / 2) / (d / 4)) ** 2)
        car = sfx.sweep_filter(rng.standard_normal(n), 900, 380, q=.9) * g
        pan = np.clip((tt - t0 - d / 2) / (d / 2), -1, 1) * pan_dir
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        out += np.stack([car * l, car * r], 1) * 1.6
    # distant horn
    s = int(2.3 * SR); hl = int(.38 * SR); ht = np.arange(hl) / SR
    horn = (signal.square(2 * np.pi * 415 * ht) + signal.square(2 * np.pi * 523 * ht)) * env(hl, .01, .38, 1.5)
    horn = lp(horn, 1800) * .12
    out[s:s + hl] += stereo(horn, .5)
    out = reverb(out, .35, 1.0)[:n]
    return out


def ambience(voice_mono, dur):
    a = norm(crowd(voice_mono, dur), 1) * .8 + norm(street(dur), 1) * .6
    n = len(a); tt = np.arange(n) / SR
    fade = np.clip(tt / .55, 0, 1) * np.clip((dur - tt) / .7, 0, 1)
    return a * fade[:, None]


# ---------------- luxury music bed ----------------
def music(total):
    bpm = 84; beat = 60 / bpm; n = int(total * SR); tt_all = np.arange(n) / SR
    mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [(50, 57, 61, 64, 66), (47, 54, 57, 62, 66), (43, 50, 54, 59, 62), (45, 52, 57, 61, 64)]  # Dmaj9 Bm9 Gmaj7 A
    bar = 4 * beat; cl = 2 * bar
    pad = np.zeros(n)
    for ci in range(int(total / cl) + 1):
        s = int(ci * cl * SR); e = min(n, int(((ci + 1) * cl + .6) * SR))
        if s >= n: break
        tt = np.arange(e - s) / SR; seg = np.zeros(e - s)
        for m in chords[ci % 4]:
            for det in (-.07, .07):
                f = mtof(m) * 2 ** (det / 12)
                seg += sum(np.sin(2 * np.pi * f * k * tt + k) / k ** 2 for k in range(1, 5))
        seg *= np.minimum(1, tt / 1.0) * np.minimum(1, (len(tt) / SR - tt) / .6)
        pad[s:e] += seg
    pad = lp(pad, 1100) * .045
    mix = stereo(pad)
    # soft "piano" motif
    pn = np.zeros(n); pat = [0, 2, 3, 4, 3, 2, 4, 1]
    for ci in range(int(total / cl) + 1):
        ch = chords[ci % 4]
        for k in range(16):
            st = ci * cl + k * beat / 2
            if st >= total: break
            if k % 4 == 3: continue
            m = ch[pat[k % 8]] + 12; f = mtof(m); d = 1.2; tt = sfx.t_(d); s = int(st * SR)
            note = (np.sin(2 * np.pi * f * tt) + .35 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 6) + .1 * np.sin(6 * np.pi * f * tt)) * env(len(tt), .003, d, 5)
            pn[s:s + len(note)] += note[:n - s] * (.8 if k % 2 else 1)
    pe = np.clip((tt_all - 1.0) / 2.0, 0, 1)
    mix += reverb(np.stack([pn, np.roll(pn, int(.21 * SR)) * .8], 1) * .03, .45, 2.2)[:n] * pe[:, None]
    # sub + gentle beat after the 2S reveal
    drums_in = 12.94
    bass = np.zeros(n)
    for ci in range(int(total / cl) + 1):
        root = chords[ci % 4][0] - 12
        for b in range(8):
            st = ci * cl + b * beat
            if st >= total: break
            d = beat * .95; tt = sfx.t_(d); s = int(st * SR)
            note = np.sin(2 * np.pi * mtof(root) * tt) * env(len(tt), .01, d, 2.5)
            bass[s:s + len(note)] += note[:n - s]
    mix += stereo(bass * .07 * np.where(tt_all < drums_in, .3, 1))
    kd = .45; kt = sfx.t_(kd)
    kick = np.sin(2 * np.pi * (45 + 90 * np.exp(-kt * 28)) * kt) * env(len(kt), .001, kd, 6)
    sn = int(.25 * SR); snap = bp(rng.standard_normal(sn), 1500, 6000) * env(sn, .001, .25, 9)
    hn = int(.04 * SR); hat = hp(rng.standard_normal(hn), 8000) * env(hn, .0005, .04, 8)
    drum = np.zeros(n); b = 0
    while b * beat < total - 2:
        st = b * beat
        if st >= drums_in:
            s = int(st * SR)
            if b % 4 in (0, 2) or (b % 8 == 7): drum[s:s + len(kick)] += kick[:n - s] * .5
            if b % 4 in (1, 3): drum[s:s + sn] += snap[:n - s] * .09
            for h in (0, .5):
                s2 = int((st + h * beat) * SR)
                if s2 < n: drum[s2:s2 + hn] += hat[:n - s2] * .05
        b += 1
    mix += reverb(stereo(drum), .18)[:n] * .55
    mix *= np.minimum(1, tt_all / 2)[:, None] * np.clip((total - tt_all) / 2.2, 0, 1)[:, None]
    return mix


def main(voice_p, cue_p, out_p):
    voice = read_wav(voice_p); n = len(voice)
    data = json.load(open(cue_p))
    fx = np.zeros((n + 6 * SR, 2)); amb = np.zeros((n + 6 * SR, 2))
    vm = voice.mean(1)
    for c in data['cues']:
        kind = c.pop('type'); t0 = c.pop('t'); s = max(0, int(t0 * SR))
        if kind == 'ambience':
            y = ambience(vm, c['dur'])
            # level it ~12 dB under the speech in that window
            seg = vm[s:s + len(y)]; vr = np.sqrt(np.mean(seg ** 2)) + 1e-9
            y = y / (np.sqrt(np.mean(y ** 2)) + 1e-9) * vr * 10 ** (-12 / 20)
            amb[s:s + len(y)] += y
            continue
        y = getattr(sfx, kind)(**c)
        fx[s:s + len(y)] += y
    fx, amb = fx[:n], amb[:n]
    mus = music(n / SR)[:n]
    if len(mus) < n: mus = np.pad(mus, ((0, n - len(mus)), (0, 0)))
    e = np.abs(vm); e = signal.sosfiltfilt(signal.butter(2, 4, fs=SR, output='sos'), e); e /= e.max() + 1e-9
    duck = 1 - .55 * np.clip(e * 6, 0, 1)
    ambduck = 1 - .6 * (np.abs(amb).mean(1) > 1e-4)          # pull music back while the ambience plays
    ambduck = signal.sosfiltfilt(signal.butter(1, 2, fs=SR, output='sos'), ambduck)
    mix = voice + fx * .42 + amb + mus * (.42 * duck * ambduck)[:, None]
    mix = np.tanh(mix * 1.05) / np.tanh(1.05)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * .93
    with wave.open(out_p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print('wrote', out_p)


if __name__ == '__main__':
    main(*sys.argv[1:4])
