"""Synth voices shared by the shorts (built on shorts/plimsoll/audio/synth.py): kicks, swells, pads, booms, beeps, roars,
choirs, a synth bass and a simple groove. Import with `from voices import *` after putting this folder on sys.path."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "plimsoll", "audio"))
from synth import *  # noqa: F401,F403
BPM = 126; BEAT = 60 / BPM
# ================= extra voices for this film =================
def saw(f):  # naive saw from a (possibly gliding) frequency track
    return 2 * ((np.cumsum(f) / SR) % 1) - 1
def kick(g=1.0):
    d = 0.45; x = tt(d)
    y = np.sin(sweep(130 * np.exp(-x * 30) + 46)) * np.exp(-x * 7) + hp1(noise(d), 2000) * np.exp(-x * 400) * 0.3
    return norm(sat(y, 2.2), g)
def swell(ms, d, up=12, bright=0.7):
    """a string/synth section gliding up `up` semitones as it swells (the classic riser into a reveal)"""
    x = tt(d); y = np.zeros(len(x)); k = (x / d) ** 1.6
    for m in ms:
        for det in (-0.004, 0.0, 0.004):
            y += saw(NOTE(m) * (1 + det) * 2 ** (up * k / 12))
    y = lpv(y, 500 + 5000 * bright * k)
    return y * (0.08 + 0.92 * k ** 1.3) / (3 * len(ms)) * 0.6
def pad(ms, d, att=0.6, rel=0.8, bright=0.35):
    """a soft synth pad: detuned saws through a gentle low-pass, slow attack"""
    x = tt(d); y = np.zeros(len(x))
    for m in ms:
        for det in (-0.003, 0.003):
            y += saw(np.full(len(x), NOTE(m) * (1 + det)))
    y = blp(y, 400 + 3000 * bright, 2)
    return y * np.minimum(1, x / att) * np.clip((d - x) / rel, 0, 1) / (2 * len(ms)) * 0.5
def subdrop(d=2.6, f0=62, f1=29):  # the floor falling away under a reveal
    x = tt(d); y = np.sin(sweep(f1 + (f0 - f1) * np.exp(-x * 2.2))) * np.exp(-x * 1.3)
    return sat(y * np.minimum(1, x / 0.004), 1.6) * 0.9
def boom(g=1.0):  # the big cinematic hit: a punchy impact, a long sub drop, a crash with a tail
    y = np.zeros(int(3.0 * SR))
    put(y, impact(1.0), 0, 1.0); put(y, subdrop(), 0, 0.9); put(y, cymbal(2.6), 0.005, 0.7); put(y, crack(0.08, 1200, 6000, 60), 0, 0.8)
    return norm(y, g)
def shower(d):
    """a hotel shower: streams breaking on skin and tile (irregular mid-band splash), thousands of tiny drops (the cue that
    makes it read as water, not hiss) and a low splatter on the tray; nothing above ~6 kHz"""
    x = tt(d); n = len(x)
    flut = np.clip(0.55 + 0.9 * lp1(np.abs(rng.standard_normal(n)), 14), 0.15, 1.5)
    body = bbp(noise(d), 500, 4200, 2) * flut
    pat = np.zeros(n); L = 420; xs = np.arange(L) / SR
    for i0 in rng.integers(0, n - L, int(1100 * d)):
        f = rng.uniform(1200, 5200); pat[i0:i0 + L] += np.sin(2 * np.pi * f * xs + rng.uniform(0, 6.28)) * np.exp(-xs * rng.uniform(250, 600)) * rng.uniform(0.04, 0.3)
    low = bbp(noise(d), 160, 650, 2) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * x))
    return blp(body * 0.32 + pat * 0.55 + low * 0.55, 6000)
def traffic(d):  # a city at night far below: a low rumble with slow swells, no hiss
    x = tt(d); sw = 0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * x + 0.5) ** 2
    return blp(noise(d), 260) * sw * 1.3 + bbp(noise(d), 300, 1100, 2) * sw * 0.12
def carpass(d=1.8):  # a car swishing past on a wet street: tyre hiss band rising and falling, the engine dropping in pitch
    x = tt(d); u = x / d; e = np.exp(-((u - 0.45) / 0.2) ** 2)
    tyre = lpv(bbp(noise(d), 250, 3000, 2), 700 + 2200 * e) * e
    eng = blp(saw(70 * (1.06 - 0.12 * u)), 500) * e * 0.35
    return (tyre + eng) * 0.8
def cloudpass(d=0.6):  # flying through a cloud deck: a soft, wet, low "whoomp"
    x = tt(d); return lpv(noise(d), 180 + 900 * np.sin(np.pi * x / d) ** 2) * np.sin(np.pi * x / d) ** 2 * 1.4
def drone(d):  # space: a deep hum with a slow swell (felt more than heard)
    x = tt(d)
    lo = np.sin(2 * np.pi * 41.2 * x) + 0.6 * np.sin(2 * np.pi * 82.6 * x + 0.3) + 0.3 * np.sin(2 * np.pi * 123.9 * x)
    return lo * 0.5 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * x))

# ---- more voices for the rest of the film ----
def beep(f0=1000, d=0.09): x = tt(d); return np.sin(2 * np.pi * f0 * x) * fade(d, 0.004, 0.02) * 0.3
def roar(d, k=1.0):  # a rocket: a deep rumble with crackle on top
    x = tt(d); y = blp(noise(d), 170) * 2.0 + bbp(noise(d), 170, 900, 2) * 0.55
    cr = np.zeros(len(x)); L = 240
    for i0 in rng.integers(0, max(1, len(x) - L), int(45 * d)): cr[i0:i0 + L] += hp1(rng.standard_normal(L), 900) * np.exp(-np.arange(L) / 45) * rng.uniform(0.2, 0.9)
    return sat((y + cr * 0.6) * np.minimum(1, x / 0.12), 1.4) * k
def sad_trombone():  # wah, wah, wah, waaaah
    y = np.zeros(int(3.0 * SR))
    for k, (m, d) in enumerate(((55, 0.42), (54, 0.42), (53, 0.42), (52, 1.5))):
        x = tt(d); vib = 1 + (0.03 * np.sin(2 * np.pi * 6 * x) * np.minimum(1, x / 0.35) if k == 3 else 0.004 * np.sin(2 * np.pi * 5 * x)); ph = sweep(NOTE(m) * vib)
        v = sum(np.sin(j * ph) / j * np.exp(-(j - 1) / 3.2) for j in range(1, 12))
        put(y, lp1(v, 1500) * np.minimum(1, x / 0.05) * np.clip((d - x) / 0.14, 0, 1) * (0.6 + 0.4 * np.minimum(1, x / 0.15)) * 0.3, k * 0.45)
    return y
def rimshot():  # ba-dum-tss
    y = np.zeros(int(1.6 * SR)); put(y, timp(50, 0.3), 0, 0.7); put(y, timp(55, 0.3), 0.15, 0.7); put(y, snare(), 0.33, 1.2); put(y, cymbal(1.2), 0.33, 0.9); return y
def gobble(d=0.65):  # a turkey
    x = tt(d); f = 470 + 200 * np.sin(2 * np.pi * 17 * x) + 110 * np.sin(2 * np.pi * 2.6 * x); ph = sweep(f)
    v = (np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)) * (0.55 + 0.45 * np.sin(2 * np.pi * 17 * x))
    return bbp(v, 300, 3200, 2) * fade(d, 0.02, 0.12) * 0.4
def shutter():  # a press camera: shutter clack and the flash recharging
    y = np.zeros(int(0.6 * SR)); c = hp1(noise(0.012), 1500) * np.exp(-tt(0.012) * 420); put(y, c, 0, 0.7); put(y, c, 0.045, 0.55)
    x = tt(0.45); put(y, np.sin(sweep(2200 + 4200 * x / 0.45)) * np.exp(-x * 7) * 0.035, 0.06); return y
def scratch():  # the record stops
    d = 0.32; x = tt(d); f = 250 + 1700 * np.abs(np.sin(2 * np.pi * 3.2 * x)) * (1 - x / d)
    return (bbp(noise(d), 500, 3500, 2) * 0.7 + np.sin(sweep(f)) * 0.12) * np.sin(np.pi * x / d) ** 0.7
def servo(d=0.5, up=True):  # a small motor
    x = tt(d); f = 170 + (230 if up else -50) * x / d + 25 * np.sin(2 * np.pi * 9 * x)
    return (blp(saw(f), 1500) * 0.22 + bbp(noise(d), 1500, 4500, 2) * 0.025) * fade(d, 0.03, 0.08)
def clunk():  # something heavy locking home
    y = np.zeros(int(1.0 * SR)); put(y, impact(0.55), 0, 0.8); put(y, clank(), 0.0, 1.4); put(y, knock((210, 480, 1250), (16, 24, 40), (1.0, 0.5, 0.3), 0.6), 0, 0.8); return norm(sat(y, 1.4), 0.95)
def heartbeat(): y = np.zeros(int(0.8 * SR)); put(y, thud(1.0, 52), 0, 0.9); put(y, thud(0.7, 48), 0.21, 0.7); return y
def crickets(d):
    y = np.zeros(int(d * SR))
    for t0 in np.arange(0, d - 0.3, 0.33):
        for k in range(3): x = tt(0.03); put(y, np.sin(2 * np.pi * 4600 * x) * np.sin(np.pi * x / 0.03) * 0.05, t0 + k * 0.045 + rng.uniform(0, 0.02))
    return y
def footstep():  # a wet step
    d = 0.16; x = tt(d); return bbp(noise(d), 300, 2600, 2) * np.exp(-x * 34) * 0.9 + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 40) * 0.5
def ding(m=91): y = glock(m, 2.0) * 1.2; y[: len(ping(3136))] += ping(3136) * 1.5; return y
def boing(d=0.6): x = tt(d); f = 160 * (1 + 0.55 * np.exp(-x * 5) * np.sin(2 * np.pi * 11 * x)); return np.sin(sweep(f)) * np.exp(-x * 4) * np.minimum(1, x / 0.004) * 0.5
def choir(ms, d, att=0.5):  # an "aah" section: saws through two vowel formants, slow swell
    x = tt(d); y = np.zeros(len(x))
    for m in ms:
        for det in (-0.004, 0.004):
            src = saw(np.full(len(x), NOTE(m) * (1 + det)) * (1 + 0.005 * np.sin(2 * np.pi * 5.2 * x + m)))
            y += reso(src, 750, 5) + 0.7 * reso(src, 1150, 6) + 0.25 * reso(src, 2600, 9)
    return lp1(y, 3500) * np.minimum(1, x / att) * np.clip((d - x) / 0.4, 0, 1) / (2 * len(ms)) * 0.05
def sbass(m, d): x = tt(d); return blp(saw(np.full(len(x), NOTE(m))), 420) * env(d, 0.004, 3.5) * 0.55
def beats(t0, t1): return [b for b in range(int(t0 / BEAT), int(t1 / BEAT) + 2) if t0 - 1e-6 <= b * BEAT < t1]
EMIN = [(40, [64, 67, 71]), (36, [64, 67, 72]), (43, [62, 67, 71]), (38, [62, 66, 69])]   # Em C G D
GMAJ = [(43, [67, 71, 74]), (38, [66, 69, 74]), (40, [64, 67, 71]), (36, [64, 67, 72])]   # G D Em C
def groove(buf, t0, t1, prog, drums=1.0, arp=0.5, bass=0.7, snare_g=0.0, glk=0.0):
    for b in beats(t0, t1):
        bar, bb = divmod(b, 4); root, ch = prog[bar % 4]; tb = b * BEAT
        if drums: put(buf, kick(0.9), tb, 0.55 * drums)
        if snare_g and bb % 2 == 1: put(buf, snare(), tb, snare_g)
        put(buf, tick(), tb + BEAT / 2, 0.3 * drums); put(buf, tick(), tb, 0.18 * drums)
        for h in (0, 1): put(buf, sbass(root - 12, BEAT / 2 * 0.9), tb + h * BEAT / 2, bass)
        for k in range(4): put(buf, pluck(ch[(k + bb) % 3] + 12, 0.25, 0.55), tb + k * BEAT / 4, arp * (0.8 if k else 1.0))
        if glk and bb == 0: put(buf, glock(ch[2] + 24, 1.2), tb, glk)
