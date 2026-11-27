"""Kokoro narration, reference pacing (3.4-3.6 w/s, gaps 0.06-0.3 s); word timings from faster-whisper alignment.
usage (from shorts/plimsoll): /opt/kokoro/venv/bin/python voice/make_voice.py am_fenrir 1.15"""
import json, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
VOICE, SPEED = sys.argv[1], float(sys.argv[2])
k = Kokoro('/opt/kokoro/kokoro-v1.0.onnx', '/opt/kokoro/voices-v1.0.bin')
lines = json.load(open('voice/lines.json'))
GAP = {"coffin": 0.22, "refuse": 0.2, "papers": 0.25, "wait": 0.1, "fixed": 0.2}
SR = 24000; out = []; t = 0.0; meta = []
def trim(a, thr=0.006):
    i = np.where(np.abs(a) > thr)[0]; return a[max(i[0]-60, 0): i[-1]+200]
for key, text in lines:
    a, _ = k.create(text, voice=VOICE, speed=SPEED, lang='en-us'); a = trim(np.asarray(a, np.float32)); d = len(a)/SR
    meta.append({"key": key, "s": round(t, 3), "e": round(t+d, 3)}); out.append((t, a)); t += d + GAP.get(key, 0.07)
total = t + 0.15
buf = np.zeros(int(total*SR)+1, np.float32)
for s, a in out: i = int(s*SR); buf[i:i+len(a)] += a
sf.write('voice/voice.wav', buf, SR)
json.dump({"total": round(total, 3), "lines": meta}, open('voice/timing.json', 'w'), indent=1)
n = sum(len(x[1].split()) for x in lines); print(VOICE, SPEED, 'total', round(total, 2), 's', n, 'words', round(n/total, 2), 'w/s')
