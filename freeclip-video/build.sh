#!/usr/bin/env bash
# FreeClip 2S edit: light grade -> motion-graphics overlays -> voice clean + SFX + ambience + music -> MP4
# Usage: ./build.sh <source.mov>
set -euo pipefail
cd "$(dirname "$0")"
SRC="$1"; FR=build/frames
mkdir -p "$FR" output
ffmpeg -loglevel error -y -i "$SRC" -vf "eq=contrast=1.03:saturation=1.04,unsharp=5:5:0.35:5:5:0" -q:v 2 "$FR/%05d.jpg"
node render.js "$FR" build 4
ffmpeg -loglevel error -y -i "$SRC" -af "highpass=f=80,afftdn=nr=6:nf=-42,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140:makeup=2,equalizer=f=3200:t=q:w=1.2:g=1.5,loudnorm=I=-16:TP=-2:LRA=7" -ar 48000 -ac 2 build/voice.wav
python3 audio.py build/voice.wav build/cues.json build/audio.wav
ffmpeg -loglevel error -y -f concat -safe 0 -i build/segments.txt -i build/audio.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart output/freeclip-2s-edit.mp4
echo "done: output/freeclip-2s-edit.mp4"
