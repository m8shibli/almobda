#!/usr/bin/env bash
# Full pipeline: frames -> video segments, cue sheet -> audio, then mux to MP4.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build output
node render.js build 30 4
python3 sfx.py build/cues.json build/audio.wav
ffmpeg -y -loglevel error -f concat -safe 0 -i build/segments.txt -i build/audio.wav \
  -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart output/sana-promo.mp4
echo "done: output/sana-promo.mp4"
