"""Sound for "The Plimsoll Line": original synthesized score + SFX timed to the narration words, mixed under the voice.
Everything is generated here (no samples). usage (from shorts/plimsoll): python3 audio/make_audio.py [seconds]
Writes audio/sfx.wav, audio/music.wav, audio/amb.wav (48 kHz stems). The mix is done with ffmpeg (see mix() at the end).
Event times come from voice/words.json with the same word lookups as studio/src/videos/plimsoll/story.ts."""
import json, re, subprocess, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)
W = json.load(open("voice/words.json"))
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else json.load(open("voice/timing.json"))["total"]
N = int(DUR * SR)

def wt(line, word=None, nth=0):
    ws = [w for w in W if w["line"] == line]
    if word is None: return ws[0]["s"]
    hits = [w for w in ws if re.sub(r"[^a-z0-9']", "", w["w"].lower()).startswith(word.lower())]
    return (hits[nth] if len(hits) > nth else ws[0])["s"]

T = dict(parliament=wt("hook", "parliament"), villains=wt("hook", "villains"), over=wt("hook", "over"), ships=wt("hook", "ships"),
         bottom=wt("hook", "bottom"), sea=wt("hook", "sea"))
F = lambda fr: fr / 30.0
CRANE, WINDOW, DIVE = T["villains"] + F(8), T["villains"] + F(14), T["bottom"] - F(1)

# ---------------- synth helpers ----------------
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def lp1(x, cut):  # one-pole low-pass, constant cutoff (vectorised through scipy-free recursion in chunks)
    a = np.exp(-2 * np.pi * cut / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def lpv(x, cut):  # time-varying cutoff
    cut = np.broadcast_to(np.asarray(cut, dtype=np.float64), x.shape); a = np.exp(-2 * np.pi * cut / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y
def hp(x, cut): return x - lp1(x, cut)
def place(tr, clip, at, g=1.0):
    i = int(max(at, 0) * SR)
    if i >= len(tr): return
    n = min(len(clip), len(tr) - i); tr[i:i + n] += clip[:n] * g
def env(d, a=0.005, k=8.0): x = tt(d); return np.minimum(x / max(a, 1e-4), 1) * np.exp(-x * k)
def fade(d, a, r): x = tt(d); return np.minimum(1, x / a) * np.minimum(1, (d - x) / r)

def impact(big=1.0):
    d = 0.9; x = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-x * 2.2) + 32) / SR) * np.exp(-x * 4)
    return ((sub * 0.9 + lp1(noise(d), 1200) * np.exp(-x * 12) * 1.6 + noise(d) * np.exp(-x * 400) * 0.4) * big).astype(np.float32)
def whoosh(d=0.7, up=True):
    x = tt(d); c = 300 + 3800 * (x / d if up else 1 - x / d) ** 1.5
    return (lpv(noise(d), c) * np.sin(np.pi * x / d) ** 1.4 * 0.9).astype(np.float32)
def creak(d=0.45):
    x = tt(d); f = 140 + 60 * np.sin(2 * np.pi * 3 * x) + 40 * x / d
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return (lp1(saw * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * x)), 1800) * fade(d, 0.03, 0.12) * 0.35).astype(np.float32)
def gasp(d=0.9):  # a room of MPs going "ooh!": breathy noise swell through two formants
    x = tt(d); n = noise(d); e = np.minimum(1, x / 0.08) * np.exp(-np.maximum(0, x - 0.15) * 3.2)
    f1 = lp1(n, 900) - lp1(n, 420); f2 = lp1(n, 1500) - lp1(n, 1000)
    return ((f1 * 1.4 + f2 * 0.7) * e * 1.6).astype(np.float32)
def murmur(d):  # crowd hubbub bed: many low babble-like modulated noise bands
    x = tt(d); out = np.zeros(len(x), np.float32)
    for k in range(6):
        band = lp1(noise(d), 500 + 140 * k) - lp1(noise(d), 260 + 120 * k)
        out += band * (0.5 + 0.5 * np.sin(2 * np.pi * (3.1 + 1.7 * k) * x + k)) ** 2
    return (out * 0.5).astype(np.float32)
def splash(d=1.2):
    x = tt(d); n = noise(d)
    body = lpv(n, 6000 * np.exp(-x * 3) + 400) * np.exp(-x * 5) * 1.4
    thump = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-x * 6) + 40) / SR) * np.exp(-x * 7) * 0.9
    return (body + thump).astype(np.float32)
def plop(f0=700, d=0.16):
    x = tt(d); f = f0 * np.exp(-x * 16) + 220
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, 28) * 0.5).astype(np.float32)
def twinkle(d=1.4):  # gold sparkle: bright bell partials, randomly re-struck
    x = tt(d); out = np.zeros(len(x), np.float32)
    for k in range(9):
        t0 = k * 0.12 + rng.uniform(0, 0.05); f = rng.choice([1760, 2093, 2637, 3136, 3520]) * rng.uniform(0.99, 1.01)
        seg = x - t0; m = seg >= 0
        out[m] += (np.sin(2 * np.pi * f * seg[m]) + 0.4 * np.sin(2 * np.pi * f * 2.76 * seg[m])) * np.exp(-seg[m] * 7) * 0.12
    return out
def gull(d=0.55):
    x = tt(d); f = 1300 + 700 * np.sin(np.pi * x / d) ** 2 - 400 * x / d
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return (lp1(s, 3000) * fade(d, 0.04, 0.2) * (0.7 + 0.3 * np.sin(2 * np.pi * 14 * x)) * 0.12).astype(np.float32)
def lap(d):  # water lapping against a hull
    x = tt(d); n = lp1(noise(d), 700)
    return (n * (0.4 + 0.6 * np.sin(2 * np.pi * 0.9 * x) ** 4) * 0.35).astype(np.float32)
def creakwood(d=1.2):
    x = tt(d); f = 70 + 25 * np.sin(2 * np.pi * 1.3 * x)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return (lp1(saw, 600) * np.sin(np.pi * x / d) * 0.25).astype(np.float32)

# ---------------- music: a cheeky Victorian pizzicato march (D minor, 116 BPM), muffled under water ----------------
BPM = 116; BEAT = 60 / BPM
def pluck(f, d=0.5, bright=0.5):  # Karplus-Strong string pluck
    n = int(SR / f); buf = rng.uniform(-1, 1, n).astype(np.float32); out = np.zeros(int(d * SR), np.float32); i = 0
    for k in range(len(out)):
        out[k] = buf[i]; nxt = (i + 1) % n; buf[i] = 0.996 * (bright * buf[i] + (1 - bright) * buf[nxt]); i = nxt
    return out * env(d, 0.002, 3.5)
def tuba(f, d):
    x = tt(d); s = np.sin(2 * np.pi * f * x) + 0.5 * np.sin(4 * np.pi * f * x) + 0.25 * np.sin(6 * np.pi * f * x)
    return (lp1(s, 900) * np.minimum(1, x / 0.02) * np.exp(-x * 2.2) * 0.45).astype(np.float32)
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [(50, [62, 65, 69]), (55, [62, 67, 70]), (57, [61, 64, 69]), (50, [62, 65, 69])]  # Dm, Gm, A, Dm
music = np.zeros(N, np.float32)
t0 = 0.0; bar = 0
while t0 < DUR:
    root, ch = prog[bar % 4]
    for b in range(4):
        tb = t0 + b * BEAT
        place(music, tuba(NOTE(root - 12 + (7 if b % 2 else 0)), BEAT * 0.9), tb, 0.9)
        place(music, pluck(NOTE(ch[(b + bar) % 3] + 12), 0.45, 0.45), tb + BEAT * 0.5, 0.55)
        if b % 2 == 0: place(music, pluck(NOTE(ch[0]), 0.4, 0.5), tb, 0.4)
        x = tt(0.05); place(music, (noise(0.05) * np.exp(-x * 90) * 0.15).astype(np.float32), tb)  # tick
    t0 += 4 * BEAT; bar += 1
# under water: the score is muffled from the plunge on
i0 = int(DIVE * SR)
if i0 < N: music[i0:] = lpv(music[i0:], 500)

# ---------------- sfx + ambience ----------------
sfx = np.zeros(N, np.float32); amb = np.zeros(N, np.float32)
# chamber: hubbub under the shout, a gasp on "villains", the stamp/impact on "villains"
place(amb, murmur(min(DUR, CRANE + 0.3)) * fade(min(DUR, CRANE + 0.3), 0.2, 0.4), 0, 0.5)
place(sfx, impact(0.9), T["villains"] - 0.03, 0.8)
place(sfx, gasp(), T["villains"] + 0.05, 0.9)
# crane up, the casements creak open, out over the river
place(sfx, whoosh(0.75, True), CRANE - 0.05, 0.9)
place(sfx, creak(0.5), WINDOW + 0.1, 0.7)
place(sfx, whoosh(0.9, False), T["ships"] + 0.15, 0.7)
river_d = max(0.1, DIVE - (WINDOW + 0.3))
place(amb, lap(river_d) * fade(river_d, 0.3, 0.1), WINDOW + 0.3, 0.8)
place(amb, creakwood(1.2), T["ships"] + 0.3, 0.6)
for k, dt in enumerate([0.2, 0.9, 1.4]): place(sfx, gull(0.5 + 0.1 * k), WINDOW + dt, 0.8)
# the plunge: splash, then muffled bubbles, the gold sparkles on "sea"
place(sfx, splash(), DIVE - 0.02, 1.0)
for k in range(14): place(sfx, plop(rng.uniform(450, 1100)), DIVE + 0.15 + k * rng.uniform(0.04, 0.1), 0.5)
und = max(0.1, DUR - DIVE)
place(amb, (lp1(noise(und), 220) * 0.6 * fade(und, 0.15, 0.3)).astype(np.float32), DIVE, 0.9)
place(sfx, twinkle(1.5), T["sea"] - 0.1, 0.9)
place(sfx, impact(0.5), T["sea"] - 0.05, 0.35)

def wav(path, x):
    x = np.clip(x, -1, 1); w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
for name, tr in (("sfx", sfx), ("music", music), ("amb", amb)): wav(f"audio/{name}.wav", tr / max(1e-6, np.abs(tr).max()) * 0.9)

def mix(out="audio/mix.wav"):
    flt = ("[0:a]aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=0.1:ratio=3:attack=5:release=80:makeup=4,asplit=2[v][vk];"
           "[1:a]volume=0.32[m];[m][vk]sidechaincompress=threshold=0.04:ratio=5:attack=10:release=250[md];"
           "[2:a]volume=0.85[s];[3:a]volume=0.45[a];"
           "[v][md][s][a]amix=inputs=4:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=7")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voice/voice.wav", "-i", "audio/music.wav", "-i", "audio/sfx.wav", "-i", "audio/amb.wav",
                    "-filter_complex", flt, "-t", str(DUR), "-ar", "48000", out], check=True)
mix()
print("audio done", round(DUR, 2), "s; dive at", round(DIVE, 2))
