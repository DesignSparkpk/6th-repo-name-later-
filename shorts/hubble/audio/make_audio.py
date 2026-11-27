"""Sound for "Why NASA's Telescope Had to Wear Glasses": an original synthesized score + SFX timed to the picture, mixed under
the voice. Everything is generated with the Plimsoll synth kit (shorts/plimsoll/audio/synth.py; no samples).
usage (from shorts/hubble): python3 audio/make_audio.py [--end FRAME]   (--end: mix only up to that frame, for scene tests)
Writes audio/music.wav, audio/sfx.wav, audio/amb.wav (48 kHz float stems) and audio/mix.wav (voice + stems, -14 LUFS).
Event frames are read straight out of studio/src/videos/hubble/story.ts (its T clocks and CUT table), so picture and sound
can never drift apart."""
import json, os, re, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "plimsoll", "audio"))
from synth import *  # noqa: F401,F403  (SR, rng, put, every instrument and effect)

FPS = 30
W = json.load(open("voice/words.json"))
TOTAL = int(np.floor(json.load(open("voice/timing.json"))["total"] * FPS + 0.5))
END = int(sys.argv[sys.argv.index("--end") + 1]) if "--end" in sys.argv else TOTAL
DUR = END / FPS
N = int((TOTAL / FPS + 0.6) * SR)
S = lambda fr: fr / FPS  # frame -> seconds

def wf(line, word=None, nth=0):  # start frame of a word, exactly as story.ts wf()
    ws = [w for w in W if w["line"] == line]; hit = ws[0]
    if word is not None:
        hits = [w for w in ws if re.sub(r"[^a-zA-Z0-9']", "", w["w"]).lower().startswith(word.lower())]
        if len(hits) > nth: hit = hits[nth]
    return int(np.floor(hit["s"] * FPS + 0.5))

# ---- the clocks, parsed from story.ts ----
STORY = open(os.path.join(HERE, "..", "..", "..", "studio", "src", "videos", "hubble", "story.ts")).read()
tblock = STORY[STORY.index("export const T = {"):]; tblock = tblock[:tblock.index("};")]
T = {}
for name, line, word, nth in re.findall(r"(\w+): wf\(\"(\w+)\"(?:, \"([\w']+)\")?(?:, (\d+))?\)", tblock):
    T[name] = wf(line, word or None, int(nth or 0))
cblock = STORY[STORY.index("export const CUT = {"):]; cblock = cblock[:cblock.index("};")]
CUT = {}
for name, expr in re.findall(r"(\w+):\s*([^,]+)", re.sub(r"//[^\n]*", "", cblock.split("{", 1)[1])):
    CUT[name] = int(eval(re.sub(r"T\.(\w+)", r'T["\1"]', expr.strip())))
assert T["telescope"] == 119 and CUT["space"] == 102, (T["telescope"], CUT)

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

# ================= score =================
BPM = 100; BEAT = 60 / BPM
music = np.zeros(N)

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
def section(t0, t1, fn, g=1.0, fin=0.012, fout=0.15, **kw):
    """render one stretch of score into its own buffer and window it to [t0, t1] (tails ring out for fout)"""
    global music
    buf = np.zeros(N); fn(buf, t0, t1, **kw)
    w = np.zeros(N); i0, i1 = int(t0 * SR), min(N, int(t1 * SR))
    a = max(0, i0 - int(fin * SR)); w[a:i0] = np.linspace(0, 1, i0 - a); w[i0:i1] = 1
    b = min(N, i1 + int(fout * SR)); w[i1:b] = np.linspace(1, 0, b - i1)
    music += buf * w * g

# ---- hook, part 1: the deadpan stare. A dry "thinking" plink (tick-tock), a low pad; the chrome head gets a ding ----
def m_stare(buf, t0, t1):
    put(buf, pad([40, 52, 59, 67], t1 - t0 + 0.4, 0.25, 0.3, 0.25), t0, 0.9)
    q = BEAT / 2
    for k in range(int((t1 - t0) / q) + 1):
        tb = t0 + k * q
        put(buf, pluck(76 if k % 2 == 0 else 71, 0.32, 0.6), tb, 0.55 if k % 2 == 0 else 0.4)
        put(buf, tick(), tb, 0.35 if k % 2 else 0.2)
    put(buf, glock(91, 1.6), S(T["showerH"] + 6), 0.5); put(buf, glock(98, 1.2), S(T["showerH"] + 7), 0.18)
section(0, S(T["saves"] - 4), m_stare, 1.0, 0.0, 0.25)

# ---- hook, part 2: out of the window and up into the clouds, everything rising into the cut ----
def m_rise(buf, t0, t1):
    d = t1 - t0
    put(buf, swell([40, 47, 52, 55, 59], d, 12, 0.8), t0, 1.0)
    put(buf, riser(d), t0, 0.5)
    # timpani roll accelerating into the cut: 8ths -> 32nds, crescendo
    t = t0; k = 0
    while t < t1 - 0.02:
        u = (t - t0) / d; put(buf, timp(40, 0.6), t, 0.15 + 0.6 * u ** 1.5); t += (BEAT / 2) * (1 - 0.82 * u); k += 1
    for j in range(int(d / (BEAT / 4))):
        tb = t0 + j * BEAT / 4; put(buf, tick(), tb, 0.12 + 0.3 * (tb - t0) / d)
section(S(T["saves"] - 4), S(CUT["space"]), m_rise, 1.0, 0.05, 0.02)

# ---- hook, part 3: orbit. The reveal chord (E minor add 9), sparkles, and a stab on "telescope" ----
def m_reveal(buf, t0, t1):
    d = t1 - t0
    put(buf, brass([40, 47, 52, 55, 59, 66], d), t0, 0.9)
    put(buf, strings([64, 67, 71, 74, 78], d, 0.0, 0.35, 0.7), t0, 1.0)
    put(buf, pad([28, 40], d, 0.05, 0.8, 0.2), t0, 0.8)
    for k, m in enumerate((88, 91, 95, 98, 100, 103, 98, 95)): put(buf, glock(m, 1.6), t0 + 0.12 + k * BEAT / 4, 0.22 - 0.015 * k)
    ts = S(T["telescope"])
    put(buf, brass([40, 47, 52, 55, 59], 0.7), ts, 0.8); put(buf, timp(40, 1.8), ts, 0.9); put(buf, kick(1.0), ts, 0.8)
    for k, m in enumerate((100, 95, 91)): put(buf, glock(m, 1.4), ts + 0.3 + k * 0.1, 0.15)
section(S(CUT["space"]), S(T["yousee"]) + 0.03, m_reveal, 1.0, 0.005, 0.25)

# ---- "You see, in 1990": a driving groove under the countdown; it drops out for the roar; brass when it lifts ----
def m_launch(buf, t0, t1):
    put(buf, kick(1.0), t0, 0.9); put(buf, cymbal(1.4), t0, 0.35)
    groove(buf, t0, S(T["nasa"] - 2), EMIN, 1.0, 0.45, 0.75, 0.5)
    tl = S(T["launches"] + 2)
    put(buf, brass([43, 55, 59, 62, 67, 71], t1 - tl + 0.6), tl, 0.95); put(buf, strings([67, 71, 74, 79], t1 - tl + 0.6, 0, 0.2, 0.8), tl, 0.9); put(buf, cymbal(2.2), tl, 0.6)
    for k, m in enumerate((67, 71, 74, 79)): put(buf, brass([m, m + 12], BEAT * 0.55), S(T["hubble"]) + k * BEAT / 2, 0.7)
section(S(T["yousee"]), S(CUT["control"]), m_launch, 1.0, 0.004, 0.12)
# ---- the control room: a low pulse and a clock while it loads... then the sad trombone ----
def m_wait(buf, t0, t1):
    put(buf, strings([40, 47], t1 - t0 + 0.3, 7.5, 0.4, 0.3), t0, 1.0); put(buf, pad([52, 59, 64], t1 - t0 + 0.3, 0.6, 0.3, 0.3), t0, 0.7)
    for b in beats(t0, t1): put(buf, tick(), b * BEAT, 0.45); put(buf, tick(False), b * BEAT + BEAT / 2, 0.25)
    put(buf, swell([52, 59, 64], S(T["completely"]) - t0, 3, 0.6), t0, 0.5)
section(S(CUT["control"]), S(T["blurry"]) - 0.03, m_wait, 1.0, 0.01, 0.05)
section(S(T["blurry"]), S(CUT["tube"]), lambda buf, t0, t1: put(buf, sad_trombone(), t0, 1.3), 1.0, 0.0, 0.3)
# ---- inside the telescope: mysterious; a dissonant sting on "off"; a pinpoint on the strip; out to the hair ----
def m_tube(buf, t0, t1):
    put(buf, pad([40, 52, 59, 66], t1 - t0 + 0.4, 0.4, 0.4, 0.35), t0, 1.0)
    for b in beats(t0, t1): put(buf, glock([88, 83, 86, 91, 90, 83][b % 6], 1.3), b * BEAT, 0.16)
    put(buf, strings([64, 65, 70, 71], 1.4, 11, 0.04, 0.9), S(T["off"]), 0.9); put(buf, timp(40, 1.4), S(T["off"]), 0.6)
    put(buf, glock(100, 1.6), S(T["fiftieth"]) + 0.35, 0.35); put(buf, glock(107, 1.2), S(T["fiftieth"]) + 0.38, 0.12)
    put(buf, strings([52, 59, 64, 71], S(T["roast"]) - S(T["human"]), 0, 0.3, 0.6), S(T["human"]), 0.7)
section(S(CUT["tube"]), S(CUT["studio"]), m_tube, 1.0, 0.01, 0.1)
# ---- the TV roast: a brassy show band, a rimshot on "roast it"; the Senate: a pompous fanfare, a gobble ----
def m_roast(buf, t0, t1):
    for k, (dt, ch) in enumerate(((0, [58, 62, 65, 68]), (0.3, [58, 62, 65, 68]), (0.75, [60, 64, 67, 70]))): put(buf, brass(ch, 0.22), t0 + dt, 0.8)
    groove(buf, t0, S(T["roastW"]), GMAJ, 0.7, 0.3, 0.55, 0.45)
    put(buf, rimshot(), S(T["roastW"]) + 0.12, 1.0)
section(S(CUT["studio"]), S(CUT["senate"]), m_roast, 1.0, 0.004, 0.6)
def m_senate(buf, t0, t1):
    for k, m in enumerate((55, 59, 62, 67)): put(buf, brass([m, m + 12], BEAT * (0.5 if k < 3 else 1.6)), t0 + k * BEAT / 2, 0.75)
    put(buf, timp(43, 1.2), t0 + 1.5 * BEAT, 0.6); put(buf, strings([55, 62, 67, 71], S(T["turkey"]) - t0, 0, 0.6, 0.5), t0 + 0.6, 0.45)
    put(buf, tuba(31, 0.5), S(T["turkey"]) + 0.2, 0.9); put(buf, tuba(30, 0.8), S(T["turkey"]) + 0.62, 0.9)
section(S(CUT["senate"]), S(CUT["orbit2"]) - 0.02, m_senate, 1.0, 0.004, 0.1)
# ---- "And it gets worse": dun, dun, DUNNN; then a lonely pad as Hubble shrinks; the ladder: sneaky pizzicato ----
def m_worse(buf, t0, t1):
    for k, (f0, L) in enumerate(((T["worse"], 0.35), (T["worseW"] - 5, 0.35), (T["worseW"], 1.6))):
        put(buf, brass([28, 40, 47], L), S(f0), 0.95); put(buf, timp(28 + (k == 2) * 0, 1.4 if k == 2 else 0.6), S(f0), 0.9)
    put(buf, cymbal(2.0), S(T["worseW"]), 0.4)
    put(buf, strings([64, 71, 76, 79], t1 - S(T["worseW"]) - 0.3, 0, 0.8, 0.45), S(T["worseW"]) + 0.3, 0.7); put(buf, pad([28, 40], t1 - t0, 0.5, 0.5, 0.2), t0, 0.7)
section(S(CUT["orbit2"]), S(CUT["field"]), m_worse, 1.0, 0.004, 0.15)
def m_field(buf, t0, t1):
    for b in beats(t0, t1): put(buf, pluck([52, 55, 59, 58, 57, 60, 59, 47][b % 8], 0.3, 0.3), b * BEAT, 0.7)
    put(buf, slide(0.5, True), S(T["fix"]) - 0.1, 1.0); put(buf, slide(0.4, False), S(T["fix"]) + 0.45, 1.0)
section(S(CUT["field"]), S(CUT["street"]), m_field, 1.0, 0.01, 0.1)
# ---- Munich at night: a gentle, hopeful line in the rain; a harp sweep up to the window ----
def m_night(buf, t0, t1):
    put(buf, pad([40, 52, 59, 67], t1 - t0 + 0.5, 0.5, 0.5, 0.3), t0, 0.9)
    for k, m in enumerate((71, 67, 64, 66, 67, 71, 74)): put(buf, pluck(m, 0.9, 0.35), t0 + 0.15 + k * BEAT * 0.75, 0.55)
    tg = S(T["german"] - 2)
    for k in range(14): put(buf, pluck([64, 67, 71, 74, 76, 79, 83][k % 7] + 12 * (k // 7), 0.5, 0.7), tg + k * 0.035, 0.32)
section(S(CUT["street"]), S(CUT["bath2"]), m_night, 1.0, 0.01, 0.2)
# ---- back in the shower: the tick-tock plink; a slide-whistle up the rail; a boing on "tilt" ----
def m_shower2(buf, t0, t1):
    put(buf, pad([40, 52, 59, 67], t1 - t0 + 0.2, 0.3, 0.1, 0.25), t0, 0.85)
    q = BEAT / 2
    for k in range(int((t1 - t0) / q)): put(buf, pluck(76 if k % 2 == 0 else 71, 0.32, 0.6), t0 + k * q, 0.5 if k % 2 == 0 else 0.38)
    put(buf, slide(0.55, True), S(T["slide"]) + 0.05, 1.1); put(buf, boing(0.6), S(T["tilt"]) + 0.05, 1.0)
section(S(CUT["bath2"]), S(T["freeze"]) - 0.02, m_shower2, 1.0, 0.01, 0.01)
# ---- the idea: a chime on "freezes", then a choir swells under "Mirrors... on little arms" ----
def m_idea(buf, t0, t1):
    for k, m in enumerate((79, 83, 86, 91, 95)): put(buf, glock(m, 1.6), t0 + 0.12 + k * 0.06, 0.32)
    tm = S(T["mirrors"]) - 0.1
    put(buf, choir([55, 62, 67, 71, 74], t1 - tm + 0.3, 0.7), tm, 1.0); put(buf, strings([67, 71, 74, 79, 83], t1 - tm + 0.3, 0, 0.9, 0.6), tm, 0.55)
section(S(T["freeze"]), S(CUT["clean"]), m_idea, 1.0, 0.0, 0.2)
# ---- the blueprint: an inventive groove; it resolves with the rays on "reverse"; "Glasses." boing, ta-da ----
def m_build(buf, t0, t1):
    groove(buf, t0, t1, GMAJ, 0.8, 0.45, 0.55, 0.35, 0.2)
    tr = S(T["reverse"])
    put(buf, brass([43, 55, 59, 62, 67], 1.2), tr, 0.8); put(buf, cymbal(1.6), tr, 0.45); put(buf, timp(43, 1.2), tr, 0.7)
section(S(CUT["clean"]), S(CUT["glasses"]), m_build, 1.0, 0.004, 0.1)
def m_glasses(buf, t0, t1):
    put(buf, pad([43, 55, 62, 67], t1 - t0, 0.2, 0.4, 0.3), t0, 0.7)
    tf = S(T["forW"]); put(buf, brass([55, 62, 67], 0.2), tf, 0.8); put(buf, brass([62, 66, 69], 0.2), tf + 0.22, 0.8); put(buf, brass([55, 59, 62, 67], 0.8), tf + 0.44, 0.9)
section(S(CUT["glasses"]), S(CUT["nightpad"]), m_glasses, 1.0, 0.004, 0.1)
# ---- 1993: epic, driving low strings and drums under the launch and the spacewalk ----
def m_epic(buf, t0, t1):
    for b in beats(t0, t1):
        bar, bb = divmod(b, 4); root, ch = EMIN[bar % 4]; tb = b * BEAT
        for k in range(4): put(buf, pluck(root + 12 + (7 if k % 2 else 0), 0.16, 0.25), tb + k * BEAT / 4, 0.6)
        put(buf, timp(root, 0.8), tb, 0.45 if bb in (0, 2) else 0.25)
        if bb == 0: put(buf, strings([n - 12 for n in ch] + ch, BEAT * 3.9, 0, 0.3, 0.6), tb, 0.6)
    put(buf, brass([40, 52, 55, 59], 1.6), t0, 0.8)
section(S(CUT["nightpad"]), S(T["one"]) - 0.02, m_epic, 1.0, 0.004, 0.08)
# ---- "One slip": everything drops to one held high note; "...dead": a low blow ----
def m_slip(buf, t0, t1):
    put(buf, strings([88], t1 - t0, 0, 0.05, 0.4), t0, 0.35); put(buf, strings([40], t1 - t0, 0, 0.8, 0.2), t0, 0.4)
    put(buf, brass([28, 35], 2.0), S(T["dead"]), 0.7); put(buf, timp(28, 2.2), S(T["dead"]), 0.85)
section(S(T["one"]), S(T["slideL"]), m_slip, 1.0, 0.004, 0.3)
# ---- sunrise: hope; the box goes home (clunk); the arms unfold; the rays meet ----
def m_hope(buf, t0, t1):
    put(buf, strings([43, 50, 55, 59, 62, 67], t1 - t0 + 0.3, 0, 0.9, 0.55), t0, 0.9); put(buf, pad([43, 55], t1 - t0, 0.8, 0.4, 0.3), t0, 0.6)
    for k, m in enumerate((79, 83, 86, 91, 86, 83)): put(buf, glock(m, 1.4), t0 + 0.4 + k * BEAT, 0.16)
    put(buf, glock(98, 2.0), S(T["unfold"]) + 0.15, 0.4)
section(S(T["slideL"]), S(CUT["control2"]), m_hope, 1.0, 0.05, 0.1)
# ---- the new picture loads: rising tension... razor sharp: the hit, then the triumphant theme to the end ----
def m_load(buf, t0, t1):
    d = t1 - t0; put(buf, swell([52, 59, 64], d, 7, 0.7), t0, 1.0); put(buf, strings([40, 47], d, 9, 0.4, 0.3), t0, 0.7)
    t = t0
    while t < t1 - 0.02: u = (t - t0) / d; put(buf, timp(40, 0.5), t, 0.1 + 0.5 * u ** 1.5); t += (BEAT / 2) * (1 - 0.8 * u)
    put(buf, riser(0.8), t1 - 0.8, 0.6)
section(S(CUT["control2"]), S(T["razor"]) - 0.01, m_load, 1.0, 0.004, 0.01)
def m_triumph(buf, t0, t1):
    put(buf, brass([31, 43, 55, 59, 62, 67, 71], 1.8), t0, 0.75); put(buf, timp(43, 2.0), t0, 0.8); put(buf, kick(1.0), t0, 0.8); put(buf, cymbal(2.6), t0, 0.55)
    put(buf, choir([55, 62, 67, 71], 2.2, 0.1), t0, 0.8)
    tq = S(T["trouble"]) - 0.1                      # quieter under her line
    groove(buf, t0 + 1.2, tq, GMAJ, 0.7, 0.32, 0.5, 0.35, 0.18)
    mel = [74, 76, 78, 79, 81, 79, 78, 74, 76, 74, 71, 74]
    for k, m in enumerate(mel):
        tb = t0 + 1.2 + k * BEAT
        if tb < tq: put(buf, brass([m - 12, m], BEAT * 0.9), tb, 0.42)
    put(buf, strings([55, 62, 67, 71, 74], S(CUT["neb"]) - tq, 0, 0.5, 0.45), tq, 0.6)
    tn = S(CUT["neb"])                              # into the picture: the final chord, sparkling
    put(buf, brass([31, 43, 50, 55, 59, 62, 67, 69], t1 - tn + 0.2), tn, 0.9); put(buf, strings([67, 71, 74, 79, 81, 86], t1 - tn + 0.2, 0, 0.15, 0.8), tn, 0.8)
    put(buf, choir([55, 62, 67, 71, 74], t1 - tn + 0.2, 0.2), tn, 1.0); put(buf, cymbal(2.4), tn, 0.6); put(buf, timp(43, 2.2), tn, 0.9)
    for k, m in enumerate((91, 95, 98, 103, 98, 107)): put(buf, glock(m, 1.6), tn + 0.1 + k * 0.08, 0.2)
section(S(T["razor"]), DUR + 0.1, m_triumph, 1.0, 0.004, 0.05)
music += reverb(music, 1.1) * 0.22

# ================= SFX and ambience =================
sfx = np.zeros(N); amb = np.zeros(N)
def bed(clip, f0, f1, g=1.0, a=0.15, r=0.25):  # an ambience bed between two frames
    d = S(f1) - S(f0); put(amb, clip(d) * fade(d, a, r), S(f0), g)
# ---- hook: the shower, the whip to the head, out of the window, Munich at night, the crane up through the clouds ----
bed(shower, 0, T["saves"] - 2, 1.0, 0.01, 0.35)
put(sfx, whoosh(0.32, True, 500, 4500), S(T["showerH"] - 4), 0.6)                    # whip past his face onto the head
put(sfx, ping(2600), S(T["showerH"] + 6), 0.4)                                       # chrome glint
put(sfx, whoosh(0.45, False, 400, 3500), S(T["saves"] - 16), 0.45)                   # swing to the window
put(sfx, whoosh(0.7, True, 300, 3500), S(T["saves"] - 5), 0.9)                       # out through it
bed(traffic, T["saves"] - 6, CUT["space"] - 4, 1.0, 0.15, 0.5)
put(amb, carpass(1.8), S(T["saves"] - 8), 0.9)
bed(wind, T["saves"] + 4, CUT["space"], 0.9, 0.4, 0.2)
put(sfx, whoosh(0.75, True, 250, 3000), S(T["saves"] + 5), 0.5)                     # rising off the street
toll = blp(bell(165, 3.5), 1800); put(amb, toll + reverb(toll, 1.4) * 0.6, S(T["saves"] + 14), 0.5)        # the cathedral tolls
put(sfx, whoosh(0.55, True, 200, 2600), S(88), 0.5)                                  # crane up into the cloud deck
put(sfx, cloudpass(0.5), S(CUT["space"] - 7), 0.8)
put(sfx, boom(1.0), S(CUT["space"]) - 0.01, 1.0)                                     # ORBIT
bed(drone, CUT["space"], T["yousee"] + 10, 0.35, 0.05, 0.4)
put(sfx, impact(0.8), S(T["telescope"]) - 0.01, 0.9); put(sfx, crack(0.06), S(T["telescope"]), 0.5)   # "telescope" (camera kick)

# ---- 1990, the pad: the countdown beeps, the engines light, the boosters light (the big one), the crowd ----
LS, LB = T["nasa"] - 2, T["launches"] + 1                     # main engines, boosters (story.ts LAUNCHES[0])
for f0 in range(LB - 5, CUT["pad"], -5): put(sfx, beep(1046, 0.08), S(f0), 0.5)
put(sfx, beep(784, 0.3), S(LB), 0.6)
put(sfx, whoosh(0.3, True, 400, 4000), S(T["nasa"] - 6), 0.45)
put(sfx, roar(1.2, 0.5) * fade(1.2, 0.08, 0.3), S(LS), 0.5); put(sfx, hiss(0.8), S(LS), 0.5)
put(sfx, boom(1.0), S(LB) - 0.01, 0.95); put(sfx, roar(2.3, 1.0) * fade(2.3, 0.02, 0.35), S(LB), 0.85)
put(sfx, crowd(2.2, 12, "cheer"), S(T["launches"] + 4), 0.75)
put(sfx, whoosh(0.35, True, 300, 3000), S(T["hubble"] - 2), 0.4)
# ---- the control room: telemetry chirps while it loads, a double beep when it lands, the mug goes over ----
for k in range(14): put(sfx, beep(1500 + 400 * (k % 3), 0.05), S(T["picture"]) + k * 0.19, 0.18)
put(sfx, beep(1320, 0.07), S(T["completely"]) - 0.12, 0.45); put(sfx, beep(1320, 0.07), S(T["completely"]) - 0.02, 0.45)
put(sfx, knock((2350, 3780, 5100), (30, 42, 60), (1.0, 0.6, 0.3), 0.3), S(T["blurry"] + 4), 0.42); put(sfx, knock((1900, 3100), (36, 50), (0.8, 0.5), 0.25), S(T["blurry"] + 7), 0.3)
put(sfx, splash(0.7) * 0.35, S(T["blurry"] + 6), 0.6)
# ---- inside the telescope: rushing air down the tube, a warning pulse on "off", a glassy tick on the strip, out ----
put(sfx, whoosh(1.0, True, 200, 2600), S(CUT["tube"]), 0.5); bed(lambda d: blp(noise(d), 120) * 0.8, CUT["tube"], T["fiftieth"], 0.6, 0.2, 0.2)
for k in range(2): put(sfx, beep(440, 0.16) * 1.4, S(T["off"]) + 0.05 + k * 0.28, 0.5)
put(sfx, ping(4200), S(T["fiftieth"]) + 0.35, 0.8); put(sfx, whoosh(0.7, False, 300, 3000), S(T["human"]) - 0.1, 0.5)
# ---- the roast: the studio audience laughs; the Senate: a murmur, a gobble, the press laughs, shutters ----
put(sfx, crowd(1.4, 14, "laugh"), S(CUT["studio"]) + 0.1, 0.8); put(sfx, crowd(1.6, 14, "laugh"), S(T["roastW"]) + 0.25, 0.9)
bed(lambda d: murmur(d, 0.9) * 0.6, CUT["senate"], CUT["orbit2"], 0.5, 0.2, 0.2)
put(sfx, gobble(0.65), S(T["turkey"]) + 0.55, 0.8); put(sfx, crowd(1.2, 8, "laugh"), S(T["turkey"]) + 0.8, 0.55)
FL = [T["turkey"] + 2, T["turkey"] + 7, T["turkey"] + 13, T["turkey"] + 19]
for f0 in FL: put(sfx, shutter(), S(f0), 0.7)
# ---- it gets worse: the pull-back away from Hubble; the field at dusk, crickets, the ladder creaks and sways ----
put(sfx, whoosh(1.6, False, 200, 1800), S(T["orbit"]) - 0.4, 0.5); bed(lambda d: drone(d), CUT["orbit2"] + 8, CUT["field"], 0.3, 0.4, 0.2)
bed(crickets, CUT["field"], CUT["street"], 0.9, 0.2, 0.15); bed(wind, CUT["field"], CUT["street"], 0.35, 0.2, 0.15)
for f0 in (T["climb"], T["fix"] - 4, T["fix"] + 6): put(sfx, creak(0.45), S(f0), 0.6)
put(sfx, whoosh(0.8, False, 250, 2500), S(T["climb"]) + 0.05, 0.4)
# ---- Munich, night: soft rain, his wet footsteps, the taxi leaving, the crane up to the window (the shower, muffled) ----
bed(lambda d: rain(d, 220) * 0.6, CUT["street"], CUT["bath2"], 0.7, 0.2, 0.3)
for k in range(10): put(sfx, footstep(), S(CUT["street"]) + 0.15 + k * 0.48, 0.45)
put(amb, carpass(2.2), S(CUT["street"]) + 0.1, 0.7)
put(sfx, whoosh(0.9, True, 250, 2600), S(T["german"] - 2), 0.45)
bed(lambda d: blp(shower(d), 900), T["german"] + 6, CUT["bath2"], 0.6, 0.3, 0.05)
# ---- back in the shower: the water, the slide, the tilt; a record scratch on "freezes"; the idea chimes ----
bed(shower, CUT["bath2"], CUT["clean"], 1.0, 0.03, 0.3)
put(sfx, rsqueak(0.25), S(T["slide"]) + 0.1, 0.6); put(sfx, knock((900, 1700), (40, 70), (1.0, 0.5), 0.25), S(T["tilt"]) + 0.05, 0.7)
put(sfx, scratch(), S(T["freeze"]) - 0.05, 1.0); put(sfx, twinkle(1.5), S(T["freeze"]) + 0.12, 0.8)
# ---- the blueprint: a drafting pen, the arms' motors, a ding when the rays meet; "Glasses." boing; "telescope" glint ----
put(sfx, scribble(0.9), S(CUT["clean"]) + 0.05, 0.5)
for f0, d in ((T["tiny"], 0.4), (T["reverse"] - 9, 0.35)): put(sfx, servo(d), S(f0), 0.8)
put(sfx, ding(91), S(T["reverse"]) + 0.02, 0.42); put(sfx, twinkle(1.2), S(T["reverse"]) + 0.08, 0.5)
put(sfx, boing(0.6), S(T["glasses"]) - 0.02, 1.7); put(sfx, ping(3600), S(T["telescope2"]) + 0.1, 0.7)
# ---- 1993: the night launch roars; radio beeps; a slip, a clink, a heartbeat; "dead": the deep blow ----
put(sfx, roar(1.6, 0.9) * fade(1.6, 0.02, 0.5), S(CUT["nightpad"]), 0.75); put(sfx, whoosh(0.4, True, 300, 3000), S(CUT["walk"]) - 0.1, 0.35)
for f0 in (CUT["walk"] + 2, T["install"] - 3, T["slideL"] + 2): put(sfx, beep(2525, 0.25), S(f0), 0.35)
put(sfx, ping(3000), S(T["slip"]) + 0.03, 0.8); put(sfx, knock((2600, 4100), (50, 70), (0.8, 0.4), 0.2), S(T["slip"]), 0.6)
for f0 in (T["slip"] + 2, T["slip"] + 22): put(sfx, heartbeat(), S(f0), 0.9)
put(sfx, boom(0.8), S(T["dead"]) - 0.02, 0.75)
# ---- the box slides home: a grinding slide, the clunk on "in", a latch; the arms' motors; a ding ----
put(sfx, servo(0.45, False) * 1.4, S(T["slide"]), 0.7); put(sfx, clunk(), S(T["inW"]) - 0.01, 0.95); put(sfx, tick(False) * 3, S(T["inW"]) + 0.2, 0.6)
for k in range(3): put(sfx, servo(0.25, True), S(T["little2"]) + k * 0.3, 0.6)
put(sfx, ding(98), S(T["unfold"]) + 0.12, 0.6)
# ---- the new picture: chirps while it loads; razor sharp: the hit; the room erupts, papers fly ----
for k in range(12): put(sfx, beep(1500 + 300 * (k % 4), 0.05), S(T["loads"]) + k * 0.18, 0.18)
put(sfx, boom(1.0), S(T["razor"]) - 0.01, 2.0); put(sfx, crowd(2.4, 14, "cheer"), S(T["razor"]) + 0.15, 0.6)
put(sfx, paper(0.8), S(T["razor"]) + 0.2, 0.5)
# ---- the press conference: shutters and flashes, a murmur; under the white flash into the picture, a shimmer ----
bed(lambda d: murmur(d, 1.0) * 0.5, CUT["press"], CUT["neb"], 0.45, 0.2, 0.3)
for f0 in [T["holds"] + d for d in (2, 5, 9, 14, 18, 23, 29, 34)] + [T["cameras"] + 4, T["cameras"] + 9, T["troubleW"] + 3, T["hubble2"] + 2, T["over"] - 3]: put(sfx, shutter(), S(f0), 0.6)
put(sfx, riser(0.5), S(CUT["neb"]) - 0.5, 0.6); put(sfx, twinkle(1.6), S(CUT["neb"]), 0.7)
sfx += reverb(sfx, 0.9) * 0.08
sfx = hp1(hp1(sfx, 35), 35)

# ---- calibration: SFX levels judged the way a phone plays them (nothing below ~300 Hz), against the processed narration ----
from scipy.signal import butter, sosfilt
VCHAIN = "aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=0.1:ratio=4:attack=2:release=80:makeup=4"
phone = lambda x: sosfilt(butter(4, 300, "high", fs=SR, output="sos"), x)
dbr = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
vproc = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "voice/voice.wav", "-af", VCHAIN, "-ac", "1", "-f", "f64le", "-"], capture_output=True).stdout, np.float64)
vph = phone(vproc); VREF = dbr(vph[np.abs(vph) > 1e-3])
HITS = {"whip whoosh": T["showerH"] - 4, "out the window": T["saves"] - 5, "ORBIT boom": CUT["space"], "telescope hit": T["telescope"], "booster ignition": T["launches"] + 1,
        "mug": T["blurry"] + 4, "rimshot": T["roastW"], "gobble": T["turkey"] + 17, "record scratch": T["freeze"] - 2, "ding (rays)": T["reverse"], "boing": T["glasses"],
        "slip clink": T["slip"], "dead": T["dead"], "clunk": T["inW"], "razor hit": T["razor"]}
def hit_db(tr, f): i = int(S(f) * SR); return dbr(phone(tr[i:i + int(0.15 * SR)]) * 0.85) - VREF
def sfx_cal(tr):  # the orbit boom sits 1 dB under the narration on a phone (before ducking); the rest keep their relative gains
    k = 10 ** ((-1.0 - hit_db(tr, CUT["space"])) / 20)
    for n, f in HITS.items(): print(f"   {n:16s} {hit_db(tr * k, f):+6.1f} dB vs narration (phone)")
    return k

# ================= write stems and mix =================
def f32wav(path, x):
    x = x[: int((DUR + 0.3) * SR)].astype(np.float32)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", path], input=x.tobytes(), check=True)
hook = slice(0, int(S(T["yousee"]) * SR))
SPANS = [("hook", 0, CUT["pad"]), ("pad", CUT["pad"], CUT["control"]), ("ctl", CUT["control"], CUT["tube"]), ("tube", CUT["tube"], CUT["studio"]), ("roast", CUT["studio"], CUT["orbit2"]),
         ("worse", CUT["orbit2"], CUT["street"]), ("street", CUT["street"], CUT["bath2"]), ("bath", CUT["bath2"], CUT["clean"]), ("clean", CUT["clean"], CUT["nightpad"]),
         ("epic", CUT["nightpad"], T["one"]), ("slip", T["one"], T["slideL"]), ("hope", T["slideL"], CUT["control2"]), ("load", CUT["control2"], T["razor"]), ("win", T["razor"], CUT["press"]), ("press", CUT["press"], TOTAL)]
shw = slice(int(0.1 * SR), int(S(T["saves"] - 8) * SR))
for name, tr in (("sfx", sfx), ("music", music), ("amb", amb)):
    if name == "amb": tr *= 10 ** (-20 / 20) / np.sqrt(np.mean(tr[shw] ** 2))   # the shower bed sets the ambience level
    elif name == "sfx": tr *= sfx_cal(tr)
    else: tr *= 0.9 / np.abs(tr[hook]).max()
    print(f"{name:5s} peak {np.abs(tr).max():.2f} |", " ".join(f"{n}:{20 * np.log10(np.sqrt(np.mean(tr[int(S(a) * SR):int(S(b) * SR)] ** 2)) + 1e-9):.0f}" for n, a, b in SPANS))
    f32wav(f"audio/{name}.wav", tr)

MIXGRAPH = ("[0:a]" + VCHAIN + ",asplit=3[v][vk][vk2];"
            "[1:a]volume=0.34[m];[m][vk]sidechaincompress=threshold=0.04:ratio=5:attack=10:release=250[md];"
            "[2:a]volume=0.85[s0];[s0][vk2]sidechaincompress=threshold=0.25:ratio=2:attack=5:release=150[s];[3:a]volume=0.45[a];"
            "[v][md][s][a]amix=inputs=4:normalize=0,volume=0.78")
def mix(out="audio/mix.wav"):
    """voice chain + music ducked under the voice + SFX + ambience; one exact gain to -14 LUFS, then a single peak limiter"""
    ins = ["-i", "voice/voice.wav", "-i", "audio/music.wav", "-i", "audio/sfx.wav", "-i", "audio/amb.wav"]
    def loud(graph):
        r = subprocess.run(["ffmpeg", "-v", "info", "-y", *ins, "-filter_complex", graph + ",ebur128=peak=true", "-t", str(DUR), "-f", "null", "-"], capture_output=True, text=True)
        tail = r.stderr[r.stderr.rindex("Summary:"):]
        return float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1))
    lim = ",alimiter=limit=0.8:attack=3:release=60:level=disabled"
    gain = -14.0 - loud(MIXGRAPH + lim)[0]
    for _ in range(2):
        i_out, tp = loud(MIXGRAPH + f",volume={gain:.2f}dB" + lim); gain += -14.0 - i_out
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", MIXGRAPH + f",volume={gain:.2f}dB" + lim + ",afade=t=out:st=" + str(round(DUR - 0.08, 3)) + ":d=0.08",
                    "-t", str(DUR), "-ar", "48000", "-ac", "2", out], check=True)
    print(f"mix: gain {gain:+.2f} dB -> {loud(MIXGRAPH + f',volume={gain:.2f}dB' + lim)[0]:.1f} LUFS")
mix()
print("audio done", round(DUR, 2), "s")
