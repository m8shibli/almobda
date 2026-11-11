"""Final mix: original (cleaned) audio for the footage + SFX + music bed under the end card.
Usage: python3 audio.py <voice.wav 48k stereo> <cues.json> <out.wav>
"""
import json, sys, wave
import numpy as np
import sfx

SR = sfx.SR


def read_wav(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    return a.reshape(-1, 2)


def main(voice_p, cue_p, out_p):
    voice = read_wav(voice_p)
    data = json.load(open(cue_p))
    total = data['duration']; n = int(total * SR)
    main_len = len(voice) / SR
    out = np.zeros((n + 6 * SR, 2))
    v = voice.copy(); fo = int(.35 * SR); v[-fo:] *= np.linspace(1, 0, fo)[:, None]
    out[:len(v)] += v
    for c in data['cues']:
        kind = c.pop('type'); t0 = c.pop('t')
        y = getattr(sfx, kind)(**c) * 0.5
        s = max(0, int(t0 * SR)); out[s:s + len(y)] += y
    # music bed for the end card: starts on the impact, drums kick in with the first poster
    m_start = main_len - 0.2
    mus = sfx.music(total - m_start + 0.3, drums_in=0.6)
    s = int(m_start * SR); out[s:s + len(mus)] += mus * 0.75
    out = out[:n]
    out = np.tanh(out * 1.1) / np.tanh(1.1)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.93
    with wave.open(out_p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
    print('wrote', out_p, f'{total:.2f}s')


if __name__ == '__main__':
    main(*sys.argv[1:4])
