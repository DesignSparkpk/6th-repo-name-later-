"""Kokoro narration: one clip per line, joined with short gaps; writes voice.wav, words.json, lines.json timings."""
import json, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
VOICE, SPEED = sys.argv[1], float(sys.argv[2])
k = Kokoro('/opt/kokoro/kokoro-v1.0.onnx', '/opt/kokoro/voices-v1.0.bin')
lines = json.load(open('voice/lines.json'))
GAP = {"hook1": 0.12, "hair1": 0.28, "complain": 0.2, "umb1": 0.3, "egg": 0.3, "wait": 0.12, "explain": 0.2, "excuse": 0.35, "quote": 0.55}
SR = 24000; out = []; t = 0.08; words = []; meta = []
def trim(a, thr=0.006):
    i = np.where(np.abs(a) > thr)[0]; return a[max(i[0]-120, 0): i[-1]+240]
for key, text in lines:
    a, _ = k.create(text, voice=VOICE, speed=SPEED, lang='en-us'); a = trim(np.asarray(a, np.float32)); d = len(a)/SR
    ws = text.split(); wt = [len(re.sub(r'\W', '', w)) + 1.5 + (3 if re.search(r'[.,?!:]$', w) else 0) for w in ws]; tot = sum(wt); acc = 0
    for w, g in zip(ws, wt):
        s = t + d*acc/tot; acc += g; words.append({"w": w, "s": round(s, 3), "e": round(t + d*acc/tot, 3), "line": key})
    meta.append({"key": key, "s": round(t, 3), "e": round(t+d, 3)}); out.append((t, a)); t += d + GAP.get(key, 0.06)
total = t + 0.25
buf = np.zeros(int(total*SR)+1, np.float32)
for s, a in out: i = int(s*SR); buf[i:i+len(a)] += a
sf.write('voice/voice.wav', buf, SR)
json.dump(words, open('voice/words.json', 'w'), indent=0); json.dump({"total": round(total, 3), "lines": meta}, open('voice/timing.json', 'w'), indent=1)
n = sum(len(x[1].split()) for x in lines); print(VOICE, SPEED, 'total', round(total, 2), 's', n, 'words', round(n/total, 2), 'w/s')
