"""Mix for the talking-head edit: cleaned voice + procedural SFX (from sfx.py) + a quiet music bed ducked under the voice.
Usage: python3 edit_audio.py <voice.wav (48k stereo, already cleaned)> <cues.json> <out.wav>
"""
import json, sys, wave
import numpy as np
from scipy import signal
import sfx

SR = sfx.SR


def read_wav(p):
    w = wave.open(p)
    assert w.getframerate() == SR and w.getsampwidth() == 2
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    return a.reshape(-1, w.getnchannels()) if w.getnchannels() == 2 else np.stack([a, a], 1)


def main(voice_p, cue_p, out_p):
    voice = read_wav(voice_p)
    n = len(voice)
    data = json.load(open(cue_p))
    fx = np.zeros((n + 5 * SR, 2))
    for c in data['cues']:
        kind = c.pop('type'); t0 = c.pop('t')
        y = getattr(sfx, kind)(**c)
        s = max(0, int(t0 * SR)); fx[s:s + len(y)] += y
    fx = fx[:n]

    total = n / SR
    music = sfx.music(total)[:n]
    if len(music) < n:
        music = np.pad(music, ((0, n - len(music)), (0, 0)))
    # duck music under speech (envelope follower on the voice)
    env = np.abs(voice).mean(1)
    sos = signal.butter(2, 4, fs=SR, output='sos')
    env = signal.sosfiltfilt(sos, env)
    env = env / (env.max() + 1e-9)
    duck = 1 - 0.6 * np.clip(env * 6, 0, 1)

    mix = voice * 1.0 + fx * 0.45 + music[:, :] * (0.32 * duck)[:, None]
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.93
    with wave.open(out_p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print('wrote', out_p)


if __name__ == '__main__':
    main(*sys.argv[1:4])
