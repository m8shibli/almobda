from faster_whisper import WhisperModel
import json, wave, numpy as np
w=wave.open("work/audio16k.wav");a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
m=WhisperModel("medium",device="cpu",compute_type="int8")
off=20.0; seg=a[int(off*16000):int(57*16000)]
segs,_=m.transcribe(seg,language="en",word_timestamps=True,beam_size=5)
out=[]
for s in segs:
    print(f"[{s.start+off:6.2f}-{s.end+off:6.2f}] {s.text}")
    out.append({"start":s.start+off,"end":s.end+off,"text":s.text,"words":[{"s":x.start+off,"e":x.end+off,"w":x.word} for x in s.words]})
json.dump(out,open("work/transcript_en.json","w"),indent=1)
