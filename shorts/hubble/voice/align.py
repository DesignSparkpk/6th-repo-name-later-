"""Exact word timings: faster-whisper on voice.wav, mapped onto the script tokens (difflib on normalised words).
writes voice/words.json: [{w, s, e, line}] in script order (caption text = script spelling)."""
import json, re, difflib
import numpy as np, subprocess
from faster_whisper import WhisperModel
lines = json.load(open("voice/lines.json")); timing = json.load(open("voice/timing.json"))
sr = 0
if sr != 16000:
    pass
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice/voice.wav", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a, word_timestamps=True, initial_prompt="Hubble, NASA, Jim Crocker, techno-turkey, spacewalks, $1.5 billion.")
H = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
S = [(w, k) for k, t, *_ in lines for w in t.split()]
sm = difflib.SequenceMatcher(a=[norm(w) for w, _ in S], b=[norm(w) for _, _, w in H], autojunk=False)
T = [None] * len(S)
for tag, i0, i1, j0, j1 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and i1 - i0 == j1 - j0):
        for k in range(i1 - i0): T[i0 + k] = (H[j0 + k][0], H[j0 + k][1])
    elif tag == "replace" and j1 > j0:  # spread the hypothesis span over the script words
        s0, e0 = H[j0][0], H[j1 - 1][1]
        for k in range(i1 - i0): T[i0 + k] = (s0 + (e0 - s0) * k / (i1 - i0), s0 + (e0 - s0) * (k + 1) / (i1 - i0))
# fill gaps (words whisper skipped) inside their line by interpolation
line_span = {l["key"]: (l["s"], l["e"]) for l in timing["lines"]}
for i in range(len(S)):
    if T[i] is None:
        p = next((T[j][1] for j in range(i - 1, -1, -1) if T[j]), line_span[S[i][1]][0])
        n = next((T[j][0] for j in range(i + 1, len(S)) if T[j]), line_span[S[i][1]][1])
        T[i] = (p, max(p + 0.05, (p + n) / 2))
out = [{"w": w, "s": round(t[0], 3), "e": round(t[1], 3), "line": k} for (w, k), t in zip(S, T)]
json.dump(out, open("voice/words.json", "w"), indent=0)
miss = sum(1 for tag, i0, i1, *_ in sm.get_opcodes() if tag != "equal" for _ in range(i1 - i0))
print(len(out), "words aligned;", miss, "not exact matches")
for o in out[:22]: print(o["s"], o["e"], o["w"])
