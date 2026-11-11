#!/usr/bin/env bash
# Creality Oman video: grade -> Arabic subtitles + motion-graphic end card -> audio mix -> MP4
# Usage: ./build.sh <source.mov>
set -euo pipefail
cd "$(dirname "$0")"
SRC="$1"; FR=build/frames
mkdir -p "$FR" output
GRADE="hqdn3d=1:1:2:2,curves=master='0/0.015 0.25/0.225 0.5/0.5 0.75/0.775 1/0.985',eq=saturation=1.08:contrast=1.03,vibrance=intensity=0.12,unsharp=5:5:0.45:5:5:0,vignette=angle=PI/6"
[ -f "$FR/00001.jpg" ] || ffmpeg -loglevel error -y -i "$SRC" -vf "$GRADE" -q:v 2 "$FR/%05d.jpg"
node render.js "$FR" build 4
ffmpeg -loglevel error -y -i "$SRC" -vn -af "highpass=f=60,afftdn=nr=6:nf=-42,loudnorm=I=-15:TP=-2:LRA=9" -ar 48000 -ac 2 build/voice.wav
python3 audio.py build/voice.wav build/cues.json build/audio.wav
ffmpeg -loglevel error -y -f concat -safe 0 -i build/segments.txt -i build/audio.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart output/creality-oman.mp4
echo "done: output/creality-oman.mp4"
