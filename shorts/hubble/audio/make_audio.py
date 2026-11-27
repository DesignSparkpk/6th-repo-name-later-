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
section(S(CUT["space"]), S(T["yousee"]) + 0.6, m_reveal, 1.0, 0.005, 0.4)
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
sfx += reverb(sfx, 0.9) * 0.08
sfx = hp1(hp1(sfx, 35), 35)

# ---- calibration: SFX levels judged the way a phone plays them (nothing below ~300 Hz), against the processed narration ----
from scipy.signal import butter, sosfilt
VCHAIN = "aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=0.1:ratio=4:attack=2:release=80:makeup=4"
phone = lambda x: sosfilt(butter(4, 300, "high", fs=SR, output="sos"), x)
dbr = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
vproc = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "voice/voice.wav", "-af", VCHAIN, "-ac", "1", "-f", "f64le", "-"], capture_output=True).stdout, np.float64)
vph = phone(vproc); VREF = dbr(vph[np.abs(vph) > 1e-3])
HITS = {"whip whoosh": T["showerH"] - 4, "out the window": T["saves"] - 5, "cloud pass": CUT["space"] - 7, "ORBIT boom": CUT["space"], "telescope hit": T["telescope"]}
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
shw = slice(int(0.1 * SR), int(S(T["saves"] - 8) * SR))
for name, tr in (("sfx", sfx), ("music", music), ("amb", amb)):
    if name == "amb": tr *= 10 ** (-20 / 20) / np.sqrt(np.mean(tr[shw] ** 2))   # the shower bed sets the ambience level
    elif name == "sfx": tr *= sfx_cal(tr)
    else: tr *= 0.9 / np.abs(tr[hook]).max()
    print(f"{name:5s} peak {np.abs(tr).max():.2f}")
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
