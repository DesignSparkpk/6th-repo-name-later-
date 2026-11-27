"""Synth kit for the Plimsoll short: instruments for the score and every sound effect, all generated (no samples).
Mono float64 arrays at SR. Filters run through scipy's lfilter so the whole film renders in seconds."""
import numpy as np
from scipy.signal import lfilter, iirpeak, butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)


# ---------------- basics ----------------
def tt(d): return np.arange(max(1, int(d * SR))) / SR
def noise(d): return rng.standard_normal(max(1, int(d * SR)))
def lp1(x, c): a = np.exp(-2 * np.pi * c / SR); return lfilter([1 - a], [1, -a], x)
def hp1(x, c): return x - lp1(x, c)
def lp2(x, c): return lp1(lp1(x, c), c)
def bp(x, lo, hi): return lp2(hp1(hp1(x, lo), lo), hi)
def blp(x, c, order=4): return sosfilt(butter(order, c, 'low', fs=SR, output='sos'), x)  # steep: no hiss above the cutoff
def bbp(x, lo, hi, order=4): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lpv(x, c, blk=64):  # one-pole low-pass with a time-varying cutoff (block-wise)
    c = np.broadcast_to(np.asarray(c, float), np.shape(x)); y = np.empty(len(x)); z = np.zeros(1)
    for i in range(0, len(x), blk):
        a = np.exp(-2 * np.pi * c[i] / SR); y[i:i + blk], z = lfilter([1 - a], [1, -a], x[i:i + blk], zi=z)
    return y
def reso(x, f, q): b, a = iirpeak(f, q, fs=SR); return lfilter(b, a, x)
def env(d, a=0.005, k=8.0): x = tt(d); return np.minimum(x / max(a, 1e-4), 1) * np.exp(-x * k)
def fade(d, a, r): x = tt(d); return np.clip(np.minimum(x / max(a, 1e-4), (d - x) / max(r, 1e-4)), 0, 1)
def put(tr, clip, t, g=1.0):
    i = int(round(t * SR))
    if i < 0: clip = clip[-i:]; i = 0
    if i >= len(tr) or len(clip) == 0: return
    n = min(len(clip), len(tr) - i); tr[i:i + n] += clip[:n] * g
def sweep(f): return 2 * np.pi * np.cumsum(f) / SR  # phase of a gliding tone


# ---------------- reverb (Schroeder: 4 combs + 2 all-passes, computed block-wise) ----------------
def comb(x, D, g):
    y = np.zeros(len(x) + D)
    for i in range(0, len(x), D):
        n = min(D, len(x) - i); y[i + D:i + D + n] = x[i:i + n] + g * y[i:i + n]
    return y[D:]
def allpass(x, D, g):
    xp = np.concatenate([np.zeros(D), x]); y = np.zeros(len(x) + D)
    for i in range(0, len(x), D):
        n = min(D, len(x) - i); y[i + D:i + D + n] = -g * x[i:i + n] + xp[i:i + n] + g * y[i:i + n]
    return y[D:]
def reverb(x, size=1.0, fb=0.80, damp=4000):
    src = lp1(x, damp)
    ys = sum(comb(src, int(D * size), fb - 0.006 * k) for k, D in enumerate((1694, 1760, 1623, 1548, 1390, 1476, 1293, 1215)))
    y = ys / 8
    for D in (606, 480, 371, 244): y = allpass(y, D, 0.5)
    return lp1(y, 6000)


# ---------------- instruments ----------------
NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)
_cache = {}
def pluck(m, d=0.45, bright=0.5):
    """Karplus-Strong string pluck (pizzicato); three cached takes per note so repeats are not identical"""
    v = int(rng.integers(3)); key = (m, round(d, 3), bright, v)
    if key not in _cache:
        r = np.random.default_rng(m * 1000 + int(d * 100) * 10 + v)
        n = max(2, int(round(SR / NOTE(m) - 0.5)))
        x = np.zeros(int(d * SR)); x[:n] = lp1(r.uniform(-1, 1, n), 800 + 7000 * bright)
        a = np.zeros(n + 2); a[0] = 1; a[n] = a[n + 1] = -0.4985
        y = lfilter([1.0], a, x) * env(d, 0.002, 3.5)
        _cache[key] = y / (np.abs(y).max() + 1e-9)
    return _cache[key]
def tuba(m, d):
    f = NOTE(m); x = tt(d); ph = 2 * np.pi * f * x
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.12 * np.sin(4 * ph)
    return lp1(s, 900) * np.minimum(1, x / 0.02) * np.exp(-x * 2.2) * np.minimum(1, (d - x) / 0.03 + 0.001) * 0.45
def glock(m, d=1.4):
    f = NOTE(m); x = tt(d); y = np.zeros(len(x))
    for r_, a_, k_ in ((1, 1, 2.6), (2.76, 0.35, 6), (5.4, 0.12, 11), (8.93, 0.05, 16)):
        y += a_ * np.sin(2 * np.pi * f * r_ * x) * np.exp(-x * k_)
    return y * np.minimum(1, x / 0.001) * 0.5
def brass(ms, d):
    """a brass section chord: band-limited saws, bright attack settling mellow, gentle vibrato"""
    x = tt(d); y = np.zeros(len(x)); att = np.minimum(1, x / 0.05)
    bright = 0.35 + 0.65 * np.exp(-x * 2.5) * att
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * x) * np.minimum(1, x / 0.3)
    for m in ms:
        f = NOTE(m) * (1 + rng.uniform(-0.002, 0.002)); ph = sweep(f * vib)
        for k in range(1, 15):
            if f * k > 9000: break
            y += np.sin(k * ph) / k * np.exp(-(k - 1) / (1.2 + 7 * bright))
    e = att * np.clip((d - x) / 0.15, 0, 1) * (0.85 + 0.15 * np.exp(-x * 3))
    return y * e / len(ms) * 0.5
def clar(m, d):
    f = NOTE(m); x = tt(d); ph = 2 * np.pi * f * x
    y = sum(np.sin(k * ph) / k for k in (1, 3, 5, 7, 9)) + 0.1 * np.sin(2 * ph)
    return y * np.minimum(1, x / 0.012) * np.exp(-x * 6) * np.clip((d - x) / 0.03, 0, 1) * 0.4
def strings(ms, d, trem=0.0, att=0.25, bright=0.6):
    x = tt(d); y = np.zeros(len(x))
    for m in ms:
        for det in (-0.0015, 0.0015):
            f = NOTE(m) * (1 + det); ph = 2 * np.pi * f * x + rng.uniform(0, 6.28)
            for k in range(1, 11):
                if f * k > 7000: break
                y += np.sin(k * ph) / k * np.exp(-(k - 1) * (1 - bright) * 0.6)
    e = np.minimum(1, x / att) * np.clip((d - x) / 0.3, 0, 1)
    if trem: e = e * (0.6 + 0.4 * np.sin(2 * np.pi * trem * x))
    return lp1(y, 3500) * e / (2 * len(ms)) * 0.4
def timp(m, d=1.6):
    f = NOTE(m); x = tt(d); ph = sweep(f * (1 + 0.04 * np.exp(-x * 30)))
    y = (np.sin(ph) + 0.45 * np.sin(1.5 * ph) + 0.25 * np.sin(1.99 * ph)) * np.exp(-x * 2.6)
    y += lp1(noise(d), 400) * np.exp(-x * 35) * 1.2
    return y * np.minimum(1, x / 0.002) * 0.5
def snare():
    d = 0.3; x = tt(d)
    return (bp(noise(d), 1200, 7000) * np.exp(-x * 16) * 1.4 + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 28) * 0.6) * np.minimum(1, x / 0.001) * 0.5
def cymbal(d=2.2):
    x = tt(d); y = hp1(hp1(noise(d), 4000), 4000) * np.exp(-x * 2.0)
    for f in rng.uniform(3000, 9000, 14): y += np.sin(2 * np.pi * f * x + rng.uniform(0, 6.28)) * np.exp(-x * rng.uniform(2, 5)) * 0.08
    return y * np.minimum(1, x / 0.002) * 0.35
def tick(hi=True):
    d = 0.04; x = tt(d); return hp1(noise(d), 2500 if hi else 900) * np.exp(-x * 140) * 0.25
def bell(f0, d=3.5):
    x = tt(d); y = np.zeros(len(x))
    for r_, a_, k_ in ((0.5, 0.6, 0.8), (1.0, 1.0, 1.2), (1.19, 0.5, 1.6), (1.56, 0.35, 2.0), (2.0, 0.4, 2.4), (2.51, 0.2, 3.0), (3.01, 0.15, 3.6)):
        y += a_ * np.sin(2 * np.pi * f0 * r_ * x) * np.exp(-x * k_)
    return y * np.minimum(1, x / 0.002) * 0.3


# ---------------- sound effects ----------------
def impact(big=1.0):
    d = 0.9; x = tt(d)
    sub = np.sin(sweep(70 * np.exp(-x * 2.2) + 32)) * np.exp(-x * 4)
    return (sub * 0.9 + lp1(noise(d), 1200) * np.exp(-x * 12) * 1.6 + noise(d) * np.exp(-x * 400) * 0.4) * big
def whoosh(d=0.7, up=True, lo=300, hi=4100):
    x = tt(d); c = lo + (hi - lo) * (x / d if up else 1 - x / d) ** 1.5
    return lpv(noise(d), c) * np.sin(np.pi * x / d) ** 1.4 * 0.9
def creak(d=0.45):
    x = tt(d); f = 140 + 60 * np.sin(2 * np.pi * 3 * x) + 40 * x / d
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return lp1(saw * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * x)), 1800) * fade(d, 0.03, 0.12) * 0.35
def gasp(d=0.9, low=1.0):  # a room going "ooh!": breathy noise swell through two formants
    x = tt(d); n = noise(d); e = np.minimum(1, x / 0.08) * np.exp(-np.maximum(0, x - 0.15) * 3.2)
    f1 = lp1(n, 900 * low) - lp1(n, 420 * low); f2 = lp1(n, 1500 * low) - lp1(n, 1000 * low)
    return (f1 * 1.4 + f2 * 0.7) * e * 1.6
def murmur(d, shift=1.0):  # crowd hubbub bed: babble-like modulated noise bands
    x = tt(d); out = np.zeros(len(x))
    for k in range(6):
        band = bbp(noise(d), (260 + 120 * k) * shift, (500 + 140 * k) * shift, 2)
        out += band * (0.5 + 0.5 * np.sin(2 * np.pi * (3.1 + 1.7 * k) * x + k)) ** 2
    return out * 0.5
def splash(d=1.2):
    x = tt(d); n = noise(d)
    body = lpv(n, 6000 * np.exp(-x * 3) + 400) * np.exp(-x * 5) * 1.4
    thump = np.sin(sweep(90 * np.exp(-x * 6) + 40)) * np.exp(-x * 7) * 0.9
    return body + thump
def plop(f0=700, d=0.16):
    x = tt(d); return np.sin(sweep(f0 * np.exp(-x * 16) + 220)) * env(d, 0.002, 28) * 0.5
def twinkle(d=1.4):  # gold sparkle: bright bell partials, re-struck
    x = tt(d); out = np.zeros(len(x))
    for k in range(9):
        t0 = k * 0.12 + rng.uniform(0, 0.05); f = rng.choice([1760, 2093, 2637, 3136, 3520]) * rng.uniform(0.99, 1.01)
        seg = x - t0; m = seg >= 0
        out[m] += (np.sin(2 * np.pi * f * seg[m]) + 0.4 * np.sin(2 * np.pi * f * 2.76 * seg[m])) * np.exp(-seg[m] * 7) * 0.12
    return out
def gull(d=0.55):
    x = tt(d); f = 1300 + 700 * np.sin(np.pi * x / d) ** 2 - 400 * x / d; ph = sweep(f)
    return lp1(np.sin(ph) + 0.3 * np.sin(2 * ph), 3000) * fade(d, 0.04, 0.2) * (0.7 + 0.3 * np.sin(2 * np.pi * 14 * x)) * 0.12
def lap(d):  # water lapping against a hull: a low slosh, steeply filtered so it never hisses
    x = tt(d); return blp(noise(d), 380) * (0.3 + 0.7 * np.sin(2 * np.pi * 0.9 * x) ** 4) * 0.5
def creakwood(d=1.2, f0=70):
    x = tt(d); f = f0 + 25 * np.sin(2 * np.pi * 1.3 * x)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return lp1(saw, 600) * np.sin(np.pi * x / d) * 0.25
def thunder(d=3.0):
    x = tt(d); crack = hp1(noise(d), 1500) * np.exp(-x * 25)
    re_ = lp1(np.abs(noise(d)), 4); re_ /= re_.max() + 1e-9
    rumble = lp2(noise(d), 180) * (0.4 + 1.2 * re_) * np.exp(-x * 1.1) * 3.0
    return (crack + rumble + lp1(noise(d), 700) * np.exp(-x * 5) * 0.8) * np.minimum(1, x / 0.003) * 0.6
def rain(d, dens=500):
    x = tt(d); y = bbp(noise(d), 2500, 7000) * 0.1
    click = hp1(noise(0.004), 3000) * np.exp(-tt(0.004) * 900)
    for i0 in rng.integers(0, max(1, len(x) - 200), int(dens * d)): y[i0:i0 + len(click)] += click[:len(y) - i0] * rng.uniform(0.1, 0.5)
    return y
def waves(d):
    x = tt(d); sw = (0.5 + 0.5 * np.sin(2 * np.pi * 0.23 * x + 1.0)) ** 2
    return blp(noise(d), 350) * (0.4 + sw) * 1.6 + bbp(noise(d), 1200, 4000) * sw * 0.15
def wind(d):
    x = tt(d); c = 500 + 300 * np.sin(2 * np.pi * 0.3 * x) + 200 * np.sin(2 * np.pi * 0.71 * x)
    return blp(lpv(noise(d), c), 1000) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * x)) * 0.8
def foghorn(d=2.2):
    x = tt(d); y = np.zeros(len(x))
    for f in (98.0, 98.7, 147.0):
        ph = 2 * np.pi * f * x
        for k in range(1, 12): y += np.sin(k * ph) / k * (0.6 if f > 120 else 1.0)
    return lp1(y, 700) * np.minimum(1, x / 0.18) * np.clip((d - x) / 0.5, 0, 1) * 0.18
def woodstamp(g=1.0):  # the rubber stamp coming down: click, wood body, a low thump
    d = 0.5; x = tt(d)
    body = np.sin(2 * np.pi * 170 * x) * np.exp(-x * 35) + 0.5 * np.sin(2 * np.pi * 420 * x) * np.exp(-x * 60)
    return (hp1(noise(d), 2000) * np.exp(-x * 300) * 0.8 + body * 1.2 + impact(0.5)[:len(x)] * 0.5) * 0.7 * g
def paper(d=0.6, rate=28, lo=900, hi=6000):  # paper flutter: a rattle of short noise flicks
    y = np.zeros(int(d * SR))
    for _ in range(int(rate * d)):
        L = int(rng.uniform(0.01, 0.035) * SR); i0 = int(rng.uniform(0, max(0.001, d - 0.05)) * SR)
        y[i0:i0 + L] += (bp(rng.standard_normal(L), lo, hi) * np.hanning(L))[:len(y) - i0] * rng.uniform(0.3, 1.0)
    return y * fade(d, 0.03, 0.1) * 0.8
def flick():  # one sheet flicked across
    d = 0.09; x = tt(d); return bp(noise(d), 1200, 7000) * np.sin(np.pi * x / d) ** 2 * 0.7
def squeak(f0=2800, d=0.13):  # a rat
    x = tt(d); ph = sweep(f0 + 500 * np.sin(2 * np.pi * 22 * x) + 300 * x / d)
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.sin(np.pi * x / d) ** 0.7 * 0.25
def thud(g=1.0, f=75):  # a crate landing on a deck
    d = 0.45; x = tt(d); ph = sweep(f * (1 + 0.6 * np.exp(-x * 25)))
    y = np.sin(ph) * np.exp(-x * 12) * 1.2 + lp1(noise(d), 600) * np.exp(-x * 30) * 1.5 + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 45) * 0.6
    return y * np.minimum(1, x / 0.001) * 0.6 * g
def coin():
    d = 0.5; x = tt(d); y = np.zeros(len(x))
    for f, a_, k_ in ((3150, 1, 9), (4230, 0.7, 12), (5870, 0.5, 15), (7400, 0.35, 20)):
        y += a_ * np.sin(2 * np.pi * f * rng.uniform(0.96, 1.04) * x) * np.exp(-x * k_)
    return y * np.minimum(1, x / 0.0005) * 0.12
def kaching():
    y = np.zeros(int(1.4 * SR)); put(y, bell(2093, 1.2), 0.03, 0.6)
    for _ in range(10): put(y, coin(), rng.uniform(0, 0.25), 0.8)
    return y
def fft_():  # a flame snuffed
    d = 0.3; x = tt(d); return lpv(noise(d), 3000 * np.exp(-x * 12) + 200) * np.exp(-x * 9) * 0.6
def chirp():  # a dawn bird
    y = np.zeros(int(0.6 * SR)); t = 0.0
    for k in range(int(rng.integers(2, 5))):
        d = rng.uniform(0.04, 0.08); x = tt(d); f0 = rng.uniform(3200, 4200)
        f = f0 + rng.uniform(800, 1600) * (x / d) * (1 if k % 2 else -0.6)
        put(y, np.sin(sweep(f)) * np.sin(np.pi * x / d) * 0.12, t); t += d + rng.uniform(0.02, 0.06)
    return y
def step(g=1.0):  # a boot on cobbles
    d = 0.18; x = tt(d)
    return (lp1(hp1(noise(d), 400), 3500) * np.exp(-x * 55) * 0.7 + np.sin(2 * np.pi * 95 * x) * np.exp(-x * 40) * 0.5) * 0.6 * g
def clink():
    d = 0.3; x = tt(d); return (np.sin(2 * np.pi * 2350 * x) * np.exp(-x * 18) + 0.5 * np.sin(2 * np.pi * 3710 * x) * np.exp(-x * 24)) * 0.05
def swish(d=0.16):  # a paint brush stroke
    x = tt(d); return bp(noise(d), 700, 3500) * np.sin(np.pi * x / d) ** 1.5 * 0.5
def wetslap():
    d = 0.12; x = tt(d); return lp1(noise(d), 1800) * np.exp(-x * 40) * 0.8
def slosh(d=1.0):
    x = tt(d); return lpv(noise(d), 500 + 400 * np.sin(2 * np.pi * 1.7 * x) ** 2) * np.sin(np.pi * x / d) * 0.9
def crowd(d, n=8, kind="cheer"):
    """voices: glottal saws through 'ah' formants, plus breath; 'cheer' glides up and holds, 'laugh' pulses ha-ha-ha"""
    x = tt(d); y = np.zeros(len(x))
    for _ in range(n):
        f0 = rng.uniform(110, 240) * (1.25 if kind == "cheer" else 1.0)
        if kind == "cheer": glide = 1 + 0.25 * np.minimum(1, x / 0.35)
        else: glide = 1 + 0.08 * np.sin(2 * np.pi * rng.uniform(4.5, 6) * x)
        jit = 1 + 0.03 * lp1(rng.standard_normal(len(x)), 6) / 0.03  # slow natural pitch drift per voice
        ph = np.cumsum(f0 * glide * jit) / SR
        src = lp1(2 * (ph % 1) - 1, 2500) * 0.45 + noise(d) * 0.55  # breathy, not buzzy
        voice = reso(src, rng.uniform(650, 850), 6) + 0.6 * reso(src, rng.uniform(1100, 1400), 8) + 0.25 * reso(src, 2600, 10)
        if kind == "laugh": a = (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(4.5, 6.5) * x + rng.uniform(0, 6.28))) ** 3
        else: a = np.ones(len(x))
        t0 = rng.uniform(0, min(0.3, d * 0.2)); e = np.clip((x - t0) / 0.08, 0, 1) * np.clip((d - x) / (0.35 * d), 0, 1)
        y += voice * a * e * rng.uniform(0.6, 1.0)
    return y / n * 0.9
def ping(f=3400):  # a monocle / small glass
    d = 0.5; x = tt(d); return (np.sin(2 * np.pi * f * x) * np.exp(-x * 14) + 0.5 * np.sin(2 * np.pi * f * 1.5 * x) * np.exp(-x * 20)) * 0.1
def slide(d=0.35, up=True):  # slide whistle
    x = tt(d); f = (700 + 1500 * (x / d)) if up else (2200 - 1600 * (x / d))
    return np.sin(sweep(f * (1 + 0.02 * np.sin(2 * np.pi * 7 * x)))) * np.sin(np.pi * x / d) ** 0.5 * 0.12
def pop():  # a cork / a hat popping off
    d = 0.08; x = tt(d); return (np.sin(sweep(350 + 1400 * (x / d))) * np.exp(-x * 45) + hp1(noise(d), 2000) * np.exp(-x * 300) * 0.5) * 0.35
def binthud():
    d = 0.4; x = tt(d); y = lp1(noise(d), 700) * np.exp(-x * 28) * 1.3 + np.sin(2 * np.pi * 120 * x) * np.exp(-x * 25) * 0.5
    for k in range(9): put(y, hp1(rng.standard_normal(480), 1500) * np.hanning(480) * 0.3, 0.02 + k * 0.015)  # wicker rattle
    return y * 0.6
def kettle(d=1.4):  # steam from the ears: a whistle rising to a shriek, with hiss
    x = tt(d); f = (1900 + 1500 * (x / d) ** 1.2) * (1 + 0.012 * np.sin(2 * np.pi * 7 * x))
    tone = np.sin(sweep(f)) * np.minimum(1, x / 0.25) * (0.4 + 0.6 * x / d)
    return (tone * 0.12 + hp1(noise(d), 3000) * (0.3 + 0.7 * x / d) * 0.15) * np.clip((d - x) / 0.05, 0, 1)
def slap():  # papers slammed on the table
    d = 0.35; x = tt(d)
    return (hp1(noise(d), 700) * np.exp(-x * 70) * 1.4 + np.sin(2 * np.pi * 110 * x) * np.exp(-x * 30) * 0.8 + lp1(noise(d), 300) * np.exp(-x * 20) * 0.8) * 0.6
def scribble(d=1.0):
    x = tt(d); am = (0.5 + 0.5 * np.sin(2 * np.pi * 9 * x + 3 * np.sin(2 * np.pi * 1.3 * x))) ** 2
    return bp(noise(d), 2500, 8000) * am * fade(d, 0.05, 0.1) * 0.25
def clank():  # the press: an iron clank
    d = 0.35; x = tt(d); y = hp1(noise(d), 1500) * np.exp(-x * 120) * 0.6
    for f, k_ in ((523, 14), (1187, 18), (1901, 22), (2713, 28)): y += np.sin(2 * np.pi * f * x) * np.exp(-x * k_) * 0.35
    return y * 0.5
def chug():
    d = 0.22; x = tt(d); return lp1(noise(d), 500) * np.exp(-x * 18) * 0.9 + hp1(noise(d), 3000) * np.exp(-x * 25) * 0.15
def whirr(d):
    x = tt(d); y = sum(np.sin(2 * np.pi * 55 * k * x) / k for k in range(1, 6))
    return lp1(y, 600) * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * x)) * 0.15
def hiss(d=0.5):
    x = tt(d); return hp1(noise(d), 2500) * np.exp(-x * 4) * fade(d, 0.02, 0.1) * 0.3
def spin(d=0.5):  # a newspaper spinning in, slowing as it lands
    x = tt(d); am = 0.5 + 0.5 * np.sin(sweep(22 - 14 * (x / d)))
    return whoosh(d, False) * am * 1.2
def chomp():
    y = np.zeros(int(0.4 * SR))
    for t0, a_ in ((0.0, 1.0), (0.09, 0.8)):
        d = 0.08; x = tt(d); put(y, (hp1(noise(d), 1200) * np.exp(-x * 160) + np.sin(2 * np.pi * 140 * x) * np.exp(-x * 60) * 0.7) * a_, t0)
    put(y, bp(noise(0.15), 800, 3000) * np.exp(-tt(0.15) * 25) * 0.4, 0.1)
    return y * 0.7
def riser(d=0.6):  # a reversed cymbal swelling into a cut
    return cymbal(d + 0.2)[:int(d * SR)][::-1] * 1.2
def rsqueak(d=0.18):  # rubber sole squeak
    x = tt(d); ph = sweep(1500 + 700 * np.sin(2 * np.pi * 30 * x) * (x / d) + 600 * (x / d))
    return (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.sin(np.pi * x / d) ** 0.6 * 0.18
def whistle(d=0.6):  # a pea whistle trill
    x = tt(d); ph = sweep(2900 * (1 + 0.01 * np.sin(2 * np.pi * 28 * x)))
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 28 * x) ** 2
    return ((np.sin(ph) + 0.15 * np.sin(2 * ph)) * am + hp1(noise(d), 3000) * 0.08) * fade(d, 0.02, 0.06) * 0.14
def crackle(d):  # a log fire: just the pops and snaps (no noise floor)
    y = np.zeros(max(1, int(d * SR)))
    click = hp1(noise(0.006), 1500) * np.exp(-tt(0.006) * 600)
    for i0 in rng.integers(0, max(1, len(y) - 400), int(18 * d)): y[i0:i0 + len(click)] += click[:len(y) - i0] * rng.uniform(0.1, 0.6)
    return y
def puff():  # a cigar exhale
    d = 0.45; x = tt(d); return bp(noise(d), 300, 1500) * np.sin(np.pi * x / d) ** 2 * 0.35
