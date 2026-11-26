"""Sound for "The Architect Who Built Two Death Rays": original synthesized score + SFX timed to the narration words,
mixed under the Kokoro voice. Everything is generated here (no samples). Writes mix.wav (48 kHz) and stems.

Event times come from voice/words.json with the same word lookups as studio/src/videos/deathray/story.ts.
"""
import json, re
import numpy as np
import soundfile as sf

SR = 48000
FPS = 30
rng = np.random.default_rng(11)
W = json.load(open("voice/words.json"))
VT = json.load(open("voice/timing.json"))
TOTAL = VT["total"] - 0.12


def wt(line, word=None, nth=0):
    ws = [w for w in W if w["line"] == line]
    if word is None: return ws[0]["s"]
    hits = [w for w in ws if re.sub(r"[^a-z0-9']", "", w["w"].lower()).startswith(word.lower())]
    return (hits[nth] if len(hits) > nth else ws[0])["s"]


# shot starts (same list as story.ts) and story clocks
shots = [0, wt("hook2"), wt("vegas"), wt("hair1"), wt("cups"), wt("complain"), wt("umb1"), wt("london"), wt("park"), wt("melt"),
         wt("carpet"), wt("egg"), wt("wait") - 4 / FPS, wt("yousee"), wt("explain"), wt("shades"), wt("excuse"), wt("quote"), wt("end") - 3 / FPS]
T = dict(melted=wt("hook1", "melted"), death=wt("hook2", "death"), ribbon=wt("vegas", "opens"), sniff=wt("hair1", "burning"), own=wt("hair2", "own"),
         bag=wt("cups", "bag"), cups=wt("cups", "cups"), giggle=wt("complain", "giggle"), bigger=wt("umb2", "bigger"),
         parks=wt("park", "parks"), back=wt("melt", "back"), m1=wt("melt", "melted", 0), m2=wt("melt", "melted", 1), m3=wt("melt", "melted", 2),
         scorch=wt("carpet", "scorched"), cooks=wt("egg", "cooks"), egg=wt("egg", "egg"), wait=wt("wait"), leaf=wt("leaf", "leaf"), trick=wt("leaf", "trick"),
         catches=wt("explain", "catches"), fifteen=wt("explain", "fifteen"), bolting=wt("shades", "bolting"), sunny=wt("quote", "sunny"), rain=wt("end"))


# ---------------- synth helpers ----------------
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def lp(x, cut):
    cut = np.broadcast_to(np.asarray(cut, dtype=np.float64), x.shape); a = np.exp(-2 * np.pi * cut / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y
def hp(x, cut): return x - lp(x, cut)
def place(tr, clip, at, g=1.0):
    i = int(max(at, 0) * SR)
    if i >= len(tr): return
    n = min(len(clip), len(tr) - i); tr[i:i + n] += clip[:n] * g
def env_ad(d, a=0.005, k=8.0): x = tt(d); return np.minimum(x / a, 1) * np.exp(-x * k)

def sizzle(d):
    x = tt(d); n = hp(noise(d), 3000)
    crack = np.zeros_like(n); idx = rng.integers(0, len(n), int(d * 90)); crack[idx] = rng.uniform(0.4, 1, len(idx))
    crack = np.convolve(crack, np.exp(-np.arange(120) / 18), mode="same")
    return ((n * 0.25 + hp(crack * rng.choice([-1, 1], len(crack)), 2000) * 0.8) * np.minimum(1, x * 8) * np.minimum(1, (d - x) * 6)).astype(np.float32)
def plop(f0=900):
    x = tt(0.18); f = f0 * np.exp(-x * 14) + 180
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(0.18, 0.002, 26) * 0.6).astype(np.float32)
def impact(big=True):
    d = 1.0 if big else 0.5; x = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-x * 1.8) + 30) / SR) * np.exp(-x * (3.5 if big else 7))
    return (sub * 0.9 + lp(noise(d), 900) * np.exp(-x * 10) * 2 + noise(d) * np.exp(-x * 500) * 0.5).astype(np.float32) * (1 if big else 0.6)
def whoosh(d=0.35):
    x = tt(d); p = x / d
    return (lp(noise(d), 300 + 6500 * np.sin(np.pi * p) ** 2) * np.sin(np.pi * p) ** 1.5 * 2.2).astype(np.float32)
def snip():
    out = np.zeros(int(0.25 * SR), np.float32)
    for k, at in enumerate([0, 0.07]):
        c = hp(noise(0.03), 4000) * env_ad(0.03, 0.001, 90) * 1.5; i = int(at * SR); out[i:i + len(c)] += c
    return out
def boing():
    x = tt(0.5); f = 220 + 160 * np.sin(2 * np.pi * 6 * x) * np.exp(-x * 4)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(0.5, 0.004, 5) * 0.55).astype(np.float32)
def bwomp():
    x = tt(0.6); f = 300 * np.exp(-x * 2.2) + 60
    return (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25 * lp(np.ones(len(x)), 1200)[0] * env_ad(0.6, 0.01, 4)).astype(np.float32)
def crinkle(d=0.6):
    out = np.zeros(int(d * SR), np.float32)
    for _ in range(40):
        c = hp(noise(0.012), 3000) * env_ad(0.012, 0.0005, 300); i = rng.integers(0, len(out) - len(c)); out[i:i + len(c)] += c * rng.uniform(0.3, 1)
    return out
def beep2():
    out = np.zeros(int(0.5 * SR), np.float32)
    for at in (0, 0.18):
        x = tt(0.1); c = (np.sign(np.sin(2 * np.pi * 1850 * x)) * 0.18 * np.minimum(1, (0.1 - x) * 60)).astype(np.float32); i = int(at * SR); out[i:i + len(c)] += c
    return out
def clunk():
    x = tt(0.35); return ((np.sin(2 * np.pi * 140 * x) * 0.6 + lp(noise(0.35), 1500) * 1.2) * env_ad(0.35, 0.002, 16)).astype(np.float32)
def crack_egg():
    x = tt(0.25); return (hp(noise(0.25), 1500) * env_ad(0.25, 0.001, 35) * 1.2 + np.sin(2 * np.pi * 420 * x) * env_ad(0.25, 0.001, 30) * 0.3).astype(np.float32)
def ding(f=1318.5):
    x = tt(1.0); return ((np.sin(2 * np.pi * f * x) * 0.5 + np.sin(2 * np.pi * f * 1.5 * x) * 0.25 + np.sin(2 * np.pi * f * 2 * x) * 0.12) * np.exp(-x * 4.5) * 0.5).astype(np.float32)
def shimmer(d):
    x = tt(d); p = x / d; out = np.zeros(len(x), np.float32)
    for k, f in enumerate([1568, 1976, 2349, 2637, 3136]): out += np.sin(2 * np.pi * f * x + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (7 + k) * x)) * 0.08
    return (out * p ** 1.5 + lp(noise(d), 600 + 6000 * p) * p ** 2 * 0.5).astype(np.float32)
def rattle(d):
    x = tt(d); m = (np.sin(2 * np.pi * 9 * x) > 0.6).astype(np.float32)
    return (lp(noise(d), 2500) * (0.25 + 0.6 * m) * np.minimum(1, x * 6) * np.minimum(1, (d - x) * 6) * 0.5).astype(np.float32)
def thunder():
    d = 3.2; x = tt(d)
    crack = hp(noise(d), 800) * np.exp(-x * 9) * 1.4
    roll = lp(noise(d), 160) * (np.exp(-x * 0.9) * (1 + 0.6 * np.sin(2 * np.pi * 1.3 * x))) * 5
    return (crack + roll).astype(np.float32)
def stomp():
    x = tt(0.2); return ((np.sin(2 * np.pi * 85 * x) + lp(noise(0.2), 700) * 1.5) * env_ad(0.2, 0.002, 22) * 0.6).astype(np.float32)

# ---------------- SFX track ----------------
N = int(TOTAL * SR) + SR
fx = np.zeros(N, np.float32)
amb = np.zeros(N, np.float32)
# hook: the mirror sizzles and drips from frame 0, impacts on "melted" and "death ray"
place(fx, sizzle(shots[1] + 0.2), 0, 0.5)
for k in range(5): place(fx, plop(700 + 120 * k), 0.25 + k * 0.33, 0.4)
place(fx, impact(), T["melted"], 0.7); place(fx, impact(False), T["death"], 0.6)
# whooshes on every cut, sparkle + whoosh on the two flashes
for i, s in enumerate(shots[1:], 1):
    if i in (2, 7): place(fx, whoosh(0.5), s - 0.3, 0.9); place(fx, shimmer(0.4), s - 0.3, 0.6)
    elif i != 18: place(fx, whoosh(0.28), s - 0.16, 0.45)
place(fx, snip(), T["ribbon"], 0.9)
# Vegas pool ambience: water lapping + distant crowd hum
v0, v1 = shots[2], shots[7]
amb_v = lp(noise(v1 - v0), 500) * 0.12 + hp(lp(noise(v1 - v0), 2400), 600) * 0.05
place(amb, amb_v.astype(np.float32), v0)
place(fx, sizzle(1.6), T["sniff"], 0.45); place(fx, boing(), T["own"], 0.8)
place(fx, crinkle(0.8), T["bag"], 0.8); place(fx, bwomp(), T["cups"] + 0.05, 0.7); place(fx, bwomp(), T["cups"] + 0.35, 0.5)
place(fx, rattle(1.5), T["bigger"] - 1.6, 0.8); place(fx, impact(False), T["bigger"], 0.9); place(fx, whoosh(0.4), T["bigger"] - 0.05, 0.6)
# London ambience: traffic hum, the odd far horn, pigeons are left out (keeps the voice clean)
l0 = shots[7]
amb_l = (lp(noise(TOTAL - l0), 220) * 0.35 + hp(lp(noise(TOTAL - l0), 1800), 500) * 0.04).astype(np.float32)
for s0, s1 in [(shots[7], shots[13]), (shots[14], shots[18])]:
    seg = amb_l[int((s0 - l0) * SR): int((s1 - l0) * SR)]; place(amb, seg, s0)
place(fx, beep2(), T["parks"] + 0.4, 0.7)
for k, m in enumerate([T["m1"], T["m2"], T["m3"]]):
    place(fx, sizzle(0.9), m - 0.3, 0.5); place(fx, plop(800 - 80 * k), m + 0.05, 0.6); place(fx, impact(k == 2), m, 0.7)
place(fx, sizzle(1.3), shots[10], 0.45)
for k in range(5): place(fx, stomp(), T["scorch"] - 0.05 + k * 0.31, 0.8)
place(fx, crack_egg(), T["egg"] - 0.08, 0.9); place(fx, sizzle(shots[13] - T["egg"]), T["egg"], 0.7)
place(fx, impact(False), T["wait"], 0.6)
place(fx, sizzle(1.2), T["leaf"] - 0.1, 0.45); place(fx, ding(1568), T["trick"], 0.6)
place(fx, shimmer(T["fifteen"] - T["catches"]), T["catches"], 0.7); place(fx, impact(), T["fifteen"], 0.7)
for k in range(14): place(fx, clunk(), T["bolting"] + (k * 3 + 18) / FPS, 0.35)
place(fx, ding(2093), T["sunny"], 0.45)
# the end: thunder + rain, music stops
place(fx, thunder(), T["rain"] - 0.1, 1.0)
r0 = shots[18] - 0.05
rainA = (hp(noise(TOTAL - r0 + 0.5), 1200) * 0.18 + lp(noise(TOTAL - r0 + 0.5), 400) * 0.25).astype(np.float32)
place(amb, rainA, r0)

# ---------------- music: bouncy original cue, 118 BPM, C major, stops dead at the cut to rain ----------------
BPM = 118; beat = 60 / BPM
mus = np.zeros(N, np.float32)
prog = [(130.81, [261.63, 329.63, 392.0]), (174.61, [261.63, 349.23, 440.0]), (196.0, [246.94, 293.66, 392.0]), (130.81, [261.63, 329.63, 392.0]),
        (220.0, [261.63, 329.63, 440.0]), (174.61, [261.63, 349.23, 440.0]), (196.0, [293.66, 349.23, 392.0]), (196.0, [246.94, 293.66, 392.0])]
def pluck(f, d=0.28, v=0.3):
    x = tt(d); s = np.sin(2 * np.pi * f * x) + 0.4 * np.sin(4 * np.pi * f * x) + 0.15 * np.sin(6 * np.pi * f * x)
    return (s * np.exp(-x * 14) * v).astype(np.float32)
def kick():
    x = tt(0.3); return (np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-x * 30)) / SR) * np.exp(-x * 9) * 0.8).astype(np.float32)
def hat():
    x = tt(0.05); return (hp(noise(0.05), 7000) * np.exp(-x * 80) * 0.3).astype(np.float32)
def snap_():
    x = tt(0.12); return (hp(noise(0.12), 1800) * np.exp(-x * 40) * 0.5).astype(np.float32)
melody = [0, 2, 4, 2, 7, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2]
scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.5]
m_end = shots[18] - 0.02
nb = int(m_end / beat) + 1
for b in range(nb):
    t0 = b * beat
    if t0 >= m_end: break
    bar = (b // 4) % len(prog); root, ch = prog[bar]
    place(mus, kick(), t0, 0.55 if b % 2 == 0 else 0.35)
    place(mus, hat(), t0 + beat / 2, 0.6)
    if b % 2 == 1: place(mus, snap_(), t0, 0.5)
    place(mus, pluck(root, 0.35, 0.45), t0); place(mus, pluck(root * 2, 0.2, 0.18), t0 + beat * 0.5)
    for k, f in enumerate(ch): place(mus, pluck(f, 0.22, 0.12), t0 + beat * (0.5 + 0.08 * k))
    if b % 8 >= 4: place(mus, pluck(scale[melody[(b * 2) % 16]], 0.3, 0.13), t0); place(mus, pluck(scale[melody[(b * 2 + 1) % 16]], 0.3, 0.1), t0 + beat / 2)
cut = int(m_end * SR); mus[cut:] = 0; mus[cut - 240:cut] *= np.linspace(1, 0, 240)

for arr, name in [(fx, "sfx"), (amb, "amb"), (mus, "music")]:
    arr = arr[: int(TOTAL * SR)]; arr /= max(1e-6, np.abs(arr).max()) / 0.9
    sf.write(f"audio/{name}.wav", arr, SR)
print("events ok, total", round(TOTAL, 2), "s")
