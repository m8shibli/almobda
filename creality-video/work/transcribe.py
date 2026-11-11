from faster_whisper import WhisperModel
import json, wave, numpy as np
w=wave.open("work/audio16k.wav");audio=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = m.transcribe(audio, word_timestamps=True, vad_filter=False, beam_size=5)
print("lang", info.language, info.language_probability)
out=[]
for s in segs:
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}")
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"s":w.start,"e":w.end,"w":w.word} for w in s.words]})
json.dump(out, open("work/transcript.json","w"), ensure_ascii=False, indent=1)
