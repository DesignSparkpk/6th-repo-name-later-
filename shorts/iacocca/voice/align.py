"""Word timings per phrase: each phrase was generated separately (voice/timing.json has its exact span), so faster-whisper
runs on one phrase at a time and its words are matched onto the script words (difflib); anything it misses is spread
by letter count inside the phrase. writes voice/words.json: [{w, s, e, line}] (caption text = script spelling)."""
import json, re, difflib, subprocess
import numpy as np
from faster_whisper import WhisperModel
lines = json.load(open("voice/lines.json")); timing = {l["key"]: l for l in json.load(open("voice/timing.json"))["lines"]}
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice/voice.wav", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
A = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
M = WhisperModel("small.en", device="cpu", compute_type="int8")
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
out = []
for L in lines:
    s0, e0 = timing[L["key"]]["s"], timing[L["key"]]["e"]; words = L["text"].split()
    seg = A[int(s0 * 16000): int(e0 * 16000) + 1600]
    hs, _ = M.transcribe(seg, word_timestamps=True, initial_prompt=L.get("say", L["text"]))
    H = [(s0 + w.start, s0 + w.end, w.word.strip()) for h in hs for w in h.words]
    # proportional fallback by letters
    lens = np.array([max(1, len(norm(w))) for w in words], float); c = np.concatenate([[0], np.cumsum(lens)]) / lens.sum()
    T = [(s0 + (e0 - s0) * c[i], s0 + (e0 - s0) * c[i + 1]) for i in range(len(words))]
    if len(H) == len(words): T = [(h[0], h[1]) for h in H]
    else:
        sm = difflib.SequenceMatcher(a=[norm(w) for w in words], b=[norm(h[2]) for h in H], autojunk=False)
        for tag, i0, i1, j0, j1 in sm.get_opcodes():
            if tag == "equal": T[i0:i1] = [(H[j][0], H[j][1]) for j in range(j0, j1)]
    for w, (a, b) in zip(words, T): out.append({"w": w, "s": round(max(a, s0), 3), "e": round(min(max(b, a + 0.05), e0 + 0.05), 3), "line": L["key"]})
for i in range(len(out) - 1):  # keep words in order: a word may not start after the next one
    if out[i]["s"] > out[i + 1]["s"]: out[i]["s"] = round(out[i - 1]["e"] if i else 0, 3)
json.dump(out, open("voice/words.json", "w"), indent=0)
print(len(out), "words")
for o in out: print(f'{o["s"]:6.2f} {o["e"]:6.2f} {o["line"]:8s} {o["w"]}')
