# اختيار ذكي · ikhtiardhaki.com — سكل Vox بالكود (ikhtiar-dhaki-vox)
# mix.py — دمج ثابت: الصوت فوق، المؤثرات تحته. بدون loudnorm ولا ducking (ما يقطّع الصوت ولا ياكل آخر كلمة).
# usage: python tools/mix.py assets/audio/vo.wav assets/audio/sfx.wav assets/audio/mix.wav [duration]
#        python tools/mix.py - assets/audio/sfx.wav assets/audio/mix.wav 43.6      (بدون صوت، للتجربة)
import subprocess, sys
vo, sfx, out = sys.argv[1:4]; dur = sys.argv[4] if len(sys.argv) > 4 else None
if vo == '-':
    fc = '[0]volume=1.0,apad=pad_dur=2,alimiter=limit=0.89:level=false[a]'; ins = ['-i', sfx]
else:
    ins = ['-i', vo, '-i', sfx]
    fc = ('[0]aresample=48000,volume=8dB,acompressor=threshold=-16dB:ratio=2.5:attack=20:release=300:knee=8,apad=pad_dur=3[v];'
          '[1]volume=0.42,apad=pad_dur=3[s];[v][s]amix=inputs=2:normalize=0:duration=longest,volume=4dB,alimiter=limit=0.89:attack=7:release=80:level=false[a]')
if dur: fc = fc[:-3] + f',atrim=0:{dur},afade=t=out:st={float(dur) - .4}:d=0.4[a]'
args = ['ffmpeg', '-nostdin', '-y', '-loglevel', 'error', *ins, '-filter_complex', fc, '-map', '[a]', '-ar', '48000']
subprocess.run(args + [out], check=True)
r = subprocess.run(['ffmpeg', '-nostdin', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf8', errors='replace').stderr
print(out, '·', [l.strip() for l in r.splitlines() if l.strip().startswith('I:')][-1:], '(الهدف ‎-14…-16 LUFS: عدّل volume=8dB)')
