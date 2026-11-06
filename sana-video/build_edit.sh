#!/usr/bin/env bash
# Talking-head edit: colour grade -> overlays/captions -> voice clean + SFX + music -> MP4
# Usage: ./build_edit.sh <source.mov>
set -euo pipefail
cd "$(dirname "$0")"
SRC="$1"; FR=build_edit/frames
mkdir -p "$FR" output
GRADE="hqdn3d=1.2:1.2:3:3,curves=master='0/0.02 0.25/0.21 0.5/0.5 0.75/0.79 1/0.98',colorbalance=rs=-0.05:bs=0.06:rm=0.03:gm=0.01:bm=-0.035,eq=saturation=1.15:contrast=1.04,vibrance=intensity=0.18,scale=1080:1920:flags=lanczos,unsharp=5:5:0.5:5:5:0,vignette=angle=PI/5"
ffmpeg -loglevel error -y -i "$SRC" -vf "$GRADE" -q:v 2 "$FR/%05d.jpg"
node render_edit.js "$FR" build_edit 4
ffmpeg -loglevel error -y -i "$SRC" -af "highpass=f=75,lowpass=f=15000,afftdn=nr=8:nf=-40,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,equalizer=f=3200:t=q:w=1.2:g=2,loudnorm=I=-16:TP=-2:LRA=7" -ar 48000 -ac 2 build_edit/voice.wav
python3 edit_audio.py build_edit/voice.wav build_edit/cues.json build_edit/audio.wav
ffmpeg -loglevel error -y -f concat -safe 0 -i build_edit/segments.txt -i build_edit/audio.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart output/sana-edit.mp4
echo "done: output/sana-edit.mp4"
