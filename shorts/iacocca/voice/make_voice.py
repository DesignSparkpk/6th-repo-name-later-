"""Expressive Kokoro narration: every phrase has its own speed, loudness, pitch and pause, and quoted lines are spoken
by a second, deeper voice (the boss, the critics). Loud phrases get a little saturation and presence so they sound
pushed, not just turned up. usage (from shorts/iacocca): /opt/kokoro/venv/bin/python voice/make_voice.py [narrator] [speed scale]
writes voice/voice.wav (24 kHz) and voice/timing.json (phrase spans)."""
import json, subprocess, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
NARR = sys.argv[1] if len(sys.argv) > 1 else "am_fenrir"
SCALE = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
OUT = sys.argv[3] if len(sys.argv) > 3 else "voice/voice.wav"
k = Kokoro('/opt/kokoro/kokoro-v1.0.onnx', '/opt/kokoro/voices-v1.0.bin')
lines = json.load(open('voice/lines.json'))
SR = 24000
def trim(a, thr=0.006):
    i = np.where(np.abs(a) > thr)[0]; return a[max(i[0] - 60, 0): i[-1] + 200]
def pitch(a, st):  # formant-safe pitch shift, tempo kept (ffmpeg rubberband)
    if abs(st) < 0.05: return a
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", f"rubberband=pitch={2 ** (st / 12):.5f}:formant=preserved",
                        "-f", "f32le", "-"], input=a.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32)
def push(a, g):  # louder phrases: gain plus gentle saturation and a presence lift so they read as "said louder"
    a = a * 10 ** (g / 20)
    if g >= 2:
        d = 1 + 0.25 * g; a = np.tanh(a * d) / np.tanh(d) * np.abs(a).max()
    return a
out, meta, t = [], [], 0.0
for L in lines:
    v = L.get("voice", NARR)
    a, _ = k.create(L.get("say", L["text"]), voice=v, speed=L.get("speed", 1.15) * SCALE, lang='en-us')
    a = trim(np.asarray(a, np.float32)); a = pitch(a, L.get("pitch", 0.0)); a = push(a, L.get("gain", 0.0))
    d = len(a) / SR; meta.append({"key": L["key"], "s": round(t, 3), "e": round(t + d, 3)}); out.append((t, a)); t += d + L.get("gap", 0.08)
total = t + 0.2
buf = np.zeros(int(total * SR) + 1, np.float32)
for s, a in out: i = int(s * SR); buf[i:i + len(a)] += a
buf *= 0.9 / np.abs(buf).max()
sf.write(OUT, buf, SR)
if OUT == "voice/voice.wav": json.dump({"total": round(total, 3), "lines": meta}, open('voice/timing.json', 'w'), indent=1)
n = sum(len(L.get("say", L["text"]).split()) for L in lines)
print(NARR, SCALE, 'total', round(total, 2), 's', n, 'words', round(n / total, 2), 'w/s')
