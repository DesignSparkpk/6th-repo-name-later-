"""Sound for "The Plimsoll Line": an original synthesized score + SFX timed to the picture, mixed under the voice.
Everything is generated (audio/synth.py, no samples). usage (from shorts/plimsoll): python3 audio/make_audio.py
Writes audio/music.wav, audio/sfx.wav, audio/amb.wav (48 kHz float stems) and audio/mix.wav (voice + stems, -14 LUFS).
Event frames mirror studio/src/videos/plimsoll/story.ts (T clocks, CUT, DROPS, STRIKES) through the same word lookups."""
import json, os, re, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synth import *  # noqa: F401,F403  (SR, rng, put, every instrument and effect)

FPS = 30
W = json.load(open("voice/words.json"))
TOTAL = int(np.floor(json.load(open("voice/timing.json"))["total"] * FPS + 0.5))
DUR = TOTAL / FPS
N = int((DUR + 0.6) * SR)

def wf(line, word=None, nth=0):  # start frame of a word, exactly as story.ts wf()
    ws = [w for w in W if w["line"] == line]; hit = ws[0]
    if word is not None:
        hits = [w for w in ws if re.sub(r"[^a-zA-Z0-9']", "", w["w"]).lower().startswith(word.lower())]
        if len(hits) > nth: hit = hits[nth]
    return int(np.floor(hit["s"] * FPS + 0.5))

T = {k: wf(*v) for k, v in dict(
    parliament=("hook", "parliament"), villains=("hook", "villains"), ships=("hook", "ships"), bottom=("hook", "bottom"), sea=("hook", "sea"),
    yousee=("yousee",), owners=("yousee", "shipowners"), nasty=("yousee", "nasty"), insure=("trick", "over"), rotting=("trick", "rotting"), old=("trick", "old"),
    cram=("trick", "cram"), withC=("trick", "with"), cargo=("trick", "cargo"), until=("trick", "until"), floating=("trick", "floating"),
    makes=("rich", "makes"), rich=("rich", "rich"), ifSinks=("rich", "if", 1), sinks=("rich", "sinks"), richer=("rich", "richer"),
    coffin=("coffin",), cships=("coffin", "ships"), fix=("fix",), pushes=("fix", "pushes"), simple=("fix", "simple"), paint=("fix", "paint"),
    everyHull=("fix", "hull"), water=("fix", "water"), stays=("fix", "stays"), home=("fix", "home"),
    laugh=("laugh",), laughW=("laugh", "laugh"), my=("laugh", "my"), worse=("worse",), plenty=("worse", "plenty"),
    snaps=("snaps",), dropped=("snaps", "dropped"), plimSnap=("snaps", "plimsoll"), snapW=("snaps", "snaps"),
    stamps=("yell", "stamps"), foot=("yell", "foot"), table=("yell", "table"), fistW=("yell", "fist"), quoteI=("yell", "i"), villains2=("yell", "villains"),
    orders=("refuse", "orders"), back=("refuse", "back"), refuses=("refuse", "refuses"), wife=("wife",), handing=("wife", "handing"), reporters=("wife", "reporters"),
    papers=("papers",), every=("papers", "every"), wordW=("papers", "word"), jokes=("papers", "jokes"), bite=("papers", "bite"), mps=("papers", "mps"),
    caves=("caves",), cavesW=("caves", "caves"), yearA=("caves", "a"), wear=("caves", "wear"),
    shoes=("shoes",), gym=("shoes", "gym"), got=("shoes", "got"), name=("shoes", "name"), plimsolls=("shoes", "plimsolls")).items()}
CUT = dict(dock=T["yousee"] + 6, storm1=T["ifSinks"], night=T["richer"] - 16, storm2=T["coffin"], dawn=T["fix"], club=T["laugh"], snaps=T["snaps"],
           papers=T["papers"], square=T["wordW"] + 11, caves=T["caves"], year=T["yearA"], shoes=T["shoes"])
DROPS = [T["cram"], T["withC"], T["cargo"]] + [T["cargo"] + 6 + i * 2 for i in range(11)]
DIVE, CRANE, WINDOW = T["bottom"] - 1, T["villains"] + 8, T["villains"] + 14
S = lambda fr: fr / FPS  # frame -> seconds

# ================= score: one cheeky Victorian theme (116 BPM) re-orchestrated per place =================
BPM = 116; BEAT = 60 / BPM
MIN = [(50, [62, 65, 69]), (55, [62, 67, 70]), (57, [61, 64, 69]), (50, [62, 65, 69])]   # Dm Gm A Dm
MAJ = [(50, [62, 66, 69]), (55, [62, 67, 71]), (57, [61, 64, 69]), (50, [62, 66, 69])]   # D G A D
DRV = [(50, [62, 65, 69]), (46, [62, 65, 70]), (48, [64, 67, 72]), (45, [61, 64, 69])]   # Dm Bb C A
DRVM = [(50, [62, 66, 69]), (47, [62, 66, 71]), (43, [62, 67, 71]), (45, [61, 64, 69])]  # D Bm G A
MEL_MIN = [[74, 76, 77, 81], [82, 81, 79, 74], [73, 76, 81, 76], [77, 76, 74, None]]
MEL_MAJ = [[74, 76, 78, 81], [83, 81, 79, 74], [73, 76, 81, 76], [78, 76, 74, None]]
SNEAK = [50, 53, 57, 56, 55, 58, 57, 45]
music = np.zeros(N)

def beats(t0, t1): return [b for b in range(int(t0 / BEAT), int(t1 / BEAT) + 2) if t0 - 1e-6 <= b * BEAT < t1]
def section(t0, t1, fn, g=1.0, fin=0.012, fout=0.15, **kw):
    """render one stretch of score into its own buffer and window it to [t0, t1] (tails ring out for fout)"""
    global music
    buf = np.zeros(N); fn(buf, t0, t1, **kw)
    w = np.zeros(N); i0, i1 = int(t0 * SR), min(N, int(t1 * SR))
    a = max(0, i0 - int(fin * SR)); w[a:i0] = np.linspace(0, 1, i0 - a); w[i0:i1] = 1
    b = min(N, i1 + int(fout * SR)); w[i1:b] = np.linspace(1, 0, b - i1)
    music += buf * w * g

def m_march(buf, t0, t1, prog=MIN, mel=None, melg=0.35, ticks=1.0, chords=0.0):
    for b in beats(t0, t1):
        bar, bb = divmod(b, 4); root, ch = prog[bar % 4]; tb = b * BEAT
        put(buf, tuba(root - 12 + (7 if bb % 2 else 0), BEAT * 0.9), tb, 0.9)
        put(buf, pluck(ch[(bb + bar) % 3] + 12, 0.45, 0.45), tb + BEAT / 2, 0.55)
        if bb % 2 == 0: put(buf, pluck(ch[0], 0.4, 0.5), tb, 0.4)
        put(buf, tick(), tb, 0.6 * ticks)
        if mel and mel[bar % 4][bb]: put(buf, glock(mel[bar % 4][bb], 1.0), tb, melg)
        if chords and bb == 0: put(buf, brass(ch + [root], BEAT * 3.7), tb, chords)
def m_sneak(buf, t0, t1, glk=0.0):
    for b in beats(t0, t1):
        tb = b * BEAT
        put(buf, pluck(SNEAK[b % 8], 0.28, 0.3), tb, 0.75)
        if b % 2 == 1: put(buf, pluck(86 if (b // 2) % 2 else 81, 0.2, 0.6), tb + BEAT / 2, 0.25)
        if b % 8 == 0: put(buf, tuba(38, BEAT * 1.6), tb, 0.5)
        put(buf, tick(), tb + BEAT / 2, 0.45)
        if glk and b % 4 == 3: put(buf, glock(93 if (b // 4) % 2 else 89, 0.8), tb + BEAT / 2, glk)
def m_storm(buf, t0, t1):
    put(buf, strings([38, 45, 50], t1 - t0 + 0.3, trem=7.5, att=0.15, bright=0.4), t0, 1.4)
    for b in beats(t0, t1):
        if b % 2 == 0: put(buf, timp(38, 1.2), b * BEAT, 0.5)
def m_hope(buf, t0, t1, glk=0.38, light=False):
    for b in beats(t0, t1):
        bar, bb = divmod(b, 4); root, ch = MAJ[bar % 4]; tb = b * BEAT
        if bb in (0, 2): put(buf, tuba(root - 12 + (7 if bb == 2 else 0), BEAT * 1.6), tb, 0.45 if light else 0.6)
        arp = [ch[0], ch[1], ch[2], ch[0] + 12]
        for e in range(2): put(buf, pluck(arp[(bb * 2 + e) % 4] + 12, 0.35, 0.55), tb + e * BEAT / 2, 0.32)
        if light: put(buf, tick(), tb + BEAT / 2, 0.4)
        if MEL_MAJ[bar % 4][bb]: put(buf, glock(MEL_MAJ[bar % 4][bb], 1.2), tb, glk)
def m_club(buf, t0, t1, pomp=0.0):
    for b in beats(t0, t1):
        bar, bb = divmod(b, 4); root, ch = MIN[bar % 4]; tb = b * BEAT
        if bb % 2 == 0: put(buf, tuba(root - 12 + (7 if bb == 2 else 0), BEAT * 0.8), tb, 0.95)
        else:
            for c in ch: put(buf, pluck(c, 0.25, 0.4), tb, 0.3)
        if MEL_MIN[bar % 4][bb]: put(buf, clar(MEL_MIN[bar % 4][bb] - 12, BEAT * 0.7), tb, 0.55)
        if pomp and bb == 0: put(buf, brass(ch, BEAT * 1.8), tb, pomp)
def m_tension(buf, t0, t1, rise=True):
    d = t1 - t0 + 0.2; x = tt(d)
    put(buf, strings([50, 57, 62], d, trem=11, att=0.4, bright=0.5) * ((0.25 + 0.75 * (x / d) ** 1.5) if rise else 0.5), t0, 1.2)
    for b in beats(t0, t1):
        put(buf, tick(hi=b % 2 == 1), b * BEAT, 0.9)
        put(buf, lp1(tuba(38, BEAT * 0.5), 300), b * BEAT, 0.6)
def m_drive(buf, t0, t1, prog=DRV, brassg=0.5):
    for b in beats(t0, t1):
        bar, bb = divmod(b, 4); root, ch = prog[bar % 4]; tb = b * BEAT
        for e in range(2): put(buf, strings([root - 12], BEAT * 0.45, att=0.01, bright=0.8), tb + e * BEAT / 2, 1.0)
        if bb in (0, 2): put(buf, timp(root - 12, 1.0), tb, 0.7)
        if bb in (1, 3): put(buf, snare(), tb, 0.5)
        put(buf, tick(), tb + BEAT / 2, 0.6)
        if bb == 0 and bar % 2 == 0 and brassg: put(buf, brass(ch, BEAT * 3.6), tb, brassg)
        if bb == 3: put(buf, pluck(ch[2] + 12, 0.3, 0.6), tb + BEAT / 2, 0.4)

def sting_villain(buf, t):  # a sinister diminished chord for "nasty trick"
    put(buf, strings([50, 53, 56, 59], 1.1, trem=9, att=0.02, bright=0.7), t, 1.6); put(buf, tuba(38, 0.9), t, 0.8)
def sting_tada(buf, t, g=1.0):  # brass "ta-da"
    put(buf, brass([62, 66, 69], 0.16), t, 0.8 * g); put(buf, brass([62, 66, 69, 74], 0.9), t + 0.17, 1.0 * g); put(buf, timp(38, 1.2), t + 0.17, 0.7 * g)
def sting_dun(buf, t):  # "and it gets worse": dun, dun, DUNNN
    for k, (m, d) in enumerate(((38, 0.2), (37, 0.2), (36, 1.0))): put(buf, tuba(m, d), t + k * 0.22, 1.1); put(buf, tuba(m + 12, d), t + k * 0.22, 0.5)
    put(buf, timp(36, 1.2), t + 0.44, 0.6)

c = CUT
# hook: the full march in the chamber; muffled once we plunge under the river
section(0, S(c["dock"] - 7), m_march, prog=MIN, ticks=1.0)
i0 = int(S(DIVE) * SR); i1 = int(S(c["dock"] - 7) * SR) + int(0.2 * SR)
music[i0:i1] = lpv(music[i0:i1], 500)
# the dock in the fog: the sneaky trick
section(S(c["dock"] - 4), S(c["storm1"]), m_sneak, g=0.95)
v = np.zeros(N); sting_villain(v, S(T["nasty"])); music += v * 0.55
v = np.zeros(N)  # "they get rich": an upward pizz flourish + glock
for k, m in enumerate((62, 66, 69, 74, 78, 81)): put(v, pluck(m + 12, 0.35, 0.7), S(T["rich"]) + k * 0.045, 0.5)
put(v, glock(86, 1.2), S(T["rich"]) + 0.27, 0.45); music += v
# storm / night / storm: a dark tremolo drone with timpani; a cheeky flourish on "richer"; a funeral bell for "coffin ships"
section(S(c["storm1"]), S(c["dawn"] - 8), m_storm, g=0.9)
v = np.zeros(N)
for k, m in enumerate((62, 65, 69, 74)): put(v, pluck(m + 12, 0.3, 0.7), S(T["richer"]) + 0.05 + k * 0.05, 0.45)
put(v, bell(196, 4.0), S(c["storm2"] + 4), 0.9); put(v, bell(196, 3.0), S(c["storm2"] + 24), 0.45)
for s0 in (c["storm1"], c["night"], c["storm2"]): put(v, timp(38, 1.6), S(s0), 0.9)
music += v
# dawn: hope, in D major, the glockenspiel takes the tune; "stays home": ta-da
section(S(c["dawn"] - 6), S(c["club"]), m_hope)
v = np.zeros(N); sting_tada(v, S(T["stays"] + 3) - 0.17); music += v
# the shipowners' club: a pompous oom-pah with a clarinet; "and it gets worse"; owners tipping hats in the Commons
section(S(c["club"]), S(T["worse"]), m_club, g=0.95)
v = np.zeros(N); sting_dun(v, S(T["worse"])); music += v
section(S(T["worse"]) + 0.66, S(c["snaps"]), m_club, g=0.8, pomp=0.35)
# the Commons: the bill dropped (tick-tock tension, rising), then Plimsoll snaps: drive
section(S(c["snaps"]), S(T["snapW"]), m_tension)
v = np.zeros(N); put(v, cymbal(2.4), S(T["snapW"]), 1.0); put(v, timp(38, 1.6), S(T["snapW"]), 1.0); music += v
section(S(T["snapW"]), S(T["refuses"]) + 0.05, m_drive, fout=0.05)
v = np.zeros(N)
put(v, brass([38, 45, 50], 0.55), S(T["orders"]), 0.9)                                   # the Speaker: stern brass
put(v, timp(38, 1.8), S(T["refuses"]), 1.0); put(v, brass([50, 57, 62, 65], 0.9), S(T["refuses"]), 0.7)  # defiance, then a beat of silence
music += v
# meanwhile, in the gallery: tiptoe pizzicato with glock
section(S(T["wife"]), S(c["papers"] - 8), m_sneak, glk=0.25)
# the press: driving, major; the square: the march in D major with the tune
section(S(c["papers"] - 8), S(c["square"] - 16), m_drive, prog=DRVM, brassg=0.45)
section(S(c["square"] - 16), S(c["caves"]), m_march, prog=MAJ, mel=MEL_MAJ, melg=0.3)
# Parliament caves: ticking stamps, then the emergency act: brass + cymbal
section(S(c["caves"]), S(T["cavesW"]), m_tension, rise=False)
v = np.zeros(N); put(v, brass([50, 62, 66, 69, 74], 1.6), S(T["cavesW"]), 1.1); put(v, cymbal(2.2), S(T["cavesW"]), 0.8); put(v, timp(38, 1.6), S(T["cavesW"]), 0.9)
music += v
# a year later: the triumphant march; then the gym: light and playful, building to the final sting on "Plimsolls"
section(S(c["year"]), S(c["shoes"]), m_march, prog=MAJ, mel=MEL_MAJ, melg=0.4, chords=0.45)
v = np.zeros(N); put(v, cymbal(2.0), S(c["year"]), 0.6); music += v
section(S(c["shoes"]), S(T["plimsolls"]), m_hope, glk=0.3, light=True)
v = np.zeros(N); t = S(T["plimsolls"])
for k in range(16): put(v, snare(), t - 0.75 + k * 0.047, 0.12 + 0.03 * k)                 # a little roll into the button
put(v, brass([50, 62, 66, 69, 74, 78], 1.6), t, 1.2); put(v, timp(38, 1.6), t, 1.0); put(v, cymbal(2.0), t, 0.8)
for k, m in enumerate((86, 90, 93, 98)): put(v, glock(m, 1.2), t + 0.04 * k, 0.45)
music += v
music += reverb(music, 1.0) * 0.15

# ================= SFX and ambience =================
sfx = np.zeros(N); amb = np.zeros(N)
def bed(clip, f0, f1, g=1.0, a=0.15, r=0.25):  # an ambience bed between two frames
    d = S(f1) - S(f0); put(amb, clip(d) * fade(d, a, r), S(f0), g)
# ---- hook: chamber hubbub, the shout, crane through the window, river, plunge, gold ----
put(sfx, impact(0.9), S(T["villains"]) - 0.03, 1.2); put(sfx, gasp(), S(T["villains"]) + 0.05, 0.7)
put(sfx, whoosh(0.75, True), S(CRANE) - 0.05, 0.9); put(sfx, creak(0.5), S(WINDOW) + 0.1, 0.7); put(sfx, whoosh(0.9, False), S(T["ships"]) + 0.15, 0.7)
bed(lap, WINDOW + 9, DIVE, 0.6, 0.3, 0.1); put(amb, creakwood(1.2), S(T["ships"]) + 0.3, 0.6)
for k, dt in enumerate([0.2, 0.9, 1.4]): put(sfx, gull(0.5 + 0.1 * k), S(WINDOW) + dt, 0.8)
put(sfx, splash(), S(DIVE) - 0.02, 0.8)
for k in range(14): put(sfx, plop(rng.uniform(450, 1100)), S(DIVE) + 0.15 + k * rng.uniform(0.04, 0.1), 0.5)
bed(lambda d: blp(noise(d), 160) * 0.9, DIVE, c["dock"], 0.9, 0.15, 0.2)
put(sfx, twinkle(1.5), S(T["sea"]) - 0.1, 0.9); put(sfx, impact(0.5), S(T["sea"]) - 0.05, 0.35)
# ---- bubble wipe up to the foggy dock ----
for k in range(9): put(sfx, plop(500 + 110 * k), S(c["dock"] - 7) + k * 0.045, 0.55)
put(sfx, whoosh(0.5, True), S(c["dock"] - 7), 0.7); put(sfx, splash(0.6) * 0.5, S(c["dock"]), 0.5)
bed(lap, c["dock"], c["dock"] + 80, 0.5, 0.15, 1.4)  # sets the scene, then gives way to the music
put(amb, foghorn(2.4), S(c["dock"] + 10), 0.38); put(amb, foghorn(1.8), S(T["rotting"] + 6), 0.2)
put(amb, bell(1250, 1.6), S(c["dock"] + 48), 0.12)
for k in range(6): put(sfx, gull(rng.uniform(0.45, 0.65)), S(c["dock"]) + 0.6 + k * 1.35 + rng.uniform(0, 0.4), 0.45)
for f0 in (c["dock"] + 30, T["old"] + 20, T["makes"] - 10): put(amb, creakwood(1.3, 60), S(f0), 0.5)
put(sfx, puff(), S(T["nasty"] - 2), 0.6)
put(sfx, whoosh(0.22, False, 300, 2500), S(T["insure"] + 3), 0.35); put(sfx, woodstamp(1.0), S(T["insure"] + 9) - 0.01, 1.0)
put(sfx, whoosh(0.5, True), S(T["rotting"] - 3), 0.45); put(sfx, paper(0.7), S(T["rotting"] - 3), 0.7); put(sfx, wetslap(), S(T["rotting"] + 17), 0.6)
put(sfx, squeak(), S(T["old"]), 0.8); put(sfx, squeak(3200), S(T["old"] + 9), 0.6)
put(sfx, squeak(3000, 0.2), S(T["floating"] - 4), 0.8); put(sfx, whoosh(0.4, True, 400, 3000), S(T["floating"] - 4), 0.3)
for k, f0 in enumerate(DROPS):  # crates hitting the deck, the hull groaning lower
    put(sfx, crate(0.85 if k < 3 else 0.3 + 0.07 * rng.random(), heavy=k < 3), S(f0), 1.0)
put(amb, creakwood(1.4, 52), S(T["cargo"] + 4), 0.8); put(sfx, slosh(1.1), S(T["until"]), 0.55)
put(sfx, paper(0.6, 20, 200, 1500), S(T["makes"] - 2), 0.8); put(sfx, whoosh(0.8, False, 200, 1500), S(T["makes"] - 2), 0.4)
put(sfx, kaching(), S(T["rich"]) + 0.02, 0.8); put(sfx, twinkle(1.2), S(T["rich"]), 0.6)
for k in range(28):  # each coin lands in the hat
    put(sfx, coin(), S(T["rich"]) + (k % 14) * 0.045 + (k // 14) * 0.4 + 0.25, 0.7)
# ---- storm / night / storm ----
for s0, g in ((c["storm1"], 1.0), (c["storm1"] + 10, 0.55), (c["night"], 0.9), (T["richer"], 0.35), (c["storm2"], 1.0), (T["cships"] - 3, 0.45)):
    put(sfx, thunder(3.0), S(s0), g * 0.65)
for f0, f1 in ((c["storm1"], c["night"]), (c["storm2"], c["dawn"] - 4)):
    bed(waves, f0, f1, 0.3, 0.02, 0.2); bed(wind, f0, f1, 0.2, 0.02, 0.2); bed(lambda d: rain(d, 600), f0, f1, 0.3, 0.02, 0.2)
bed(lambda d: rain(d, 900), c["night"], c["storm2"], 0.35, 0.02, 0.05)
put(sfx, creakwood(1.5, 45), S(T["sinks"]) - 0.1, 1.0); put(sfx, splash(1.4), S(T["sinks"]) + 0.15, 0.6)
for k in range(10): put(sfx, plop(rng.uniform(300, 700)), S(T["sinks"]) + 0.4 + k * 0.06, 0.4)
put(sfx, slide(0.27, False), S(T["richer"] - 8), 0.8); put(sfx, thud(1.3, 60), S(T["richer"]), 1.0)
for k in range(8): put(sfx, coin(), S(T["richer"]) + 0.03 + k * 0.03, 0.6)
put(sfx, fft_(), S(T["cships"]), 0.9)
# ---- cloud wipe into dawn ----
put(sfx, whoosh(0.8, True, 400, 5000), S(c["dawn"] - 8), 0.7)
for k, m in enumerate((86, 90, 93)): put(sfx, glock(m, 1.0), S(c["dawn"] - 2) + k * 0.06, 0.3)
bed(lap, c["dawn"], c["dawn"] + 80, 0.45, 0.15, 1.4)
for k in range(14): put(amb, chirp(), S(c["dawn"]) + 0.2 + k * 0.5 + rng.uniform(0, 0.25), 0.7)
for k in range(2): put(sfx, gull(0.6), S(c["dawn"]) + 1.0 + k * 2.6, 0.35)
for n in range(1, 7):  # Plimsoll's boots down the quay, the paint pot clinking
    f0 = T["fix"] + n * 30 * 0.5 / 1.6
    if T["fix"] + 8 <= f0 <= T["pushes"] - 4: put(sfx, step(), S(f0), 0.8); put(sfx, clink(), S(f0) + 0.02, 0.8)
put(sfx, glock(91, 1.6), S(T["simple"] - 1), 0.55); put(sfx, glock(98, 1.2), S(T["simple"] - 1), 0.2)   # the idea
put(sfx, wetslap(), S(T["paint"]), 0.6)
for k in range(8): put(sfx, swish(rng.uniform(0.12, 0.18)), S(T["paint"]) + k * 5 / FPS, 0.7)
for i in range(10): put(sfx, crate(0.65 if i < 2 else 0.32, heavy=i < 2), S(T["water"] - 4 + i * 2), 1.0)
put(amb, creakwood(1.3, 55), S(T["water"]) + 0.1, 0.7); put(sfx, slosh(1.2), S(T["water"]), 0.8)
put(sfx, woodstamp(1.3), S(T["stays"] + 3), 0.6); put(sfx, impact(0.7), S(T["stays"] + 3), 0.35)
put(sfx, crowd(1.5, 5, "cheer"), S(T["home"]) - 0.05, 0.8)
for k in range(3): put(sfx, whoosh(0.3, True, 500, 3500), S(T["home"] + k * 2), 0.25)
# ---- whip into the club ----
put(sfx, whoosh(0.32, True, 500, 6000), S(c["club"] - 5), 0.9)
bed(crackle, c["club"], T["plenty"] - 11, 0.6)
put(sfx, crowd(1.7, 3, "laugh"), S(T["laughW"] - 6), 0.75)
put(sfx, ping(), S(T["laughW"] - 2), 0.8); put(sfx, slide(0.4, True), S(T["laughW"] - 2), 0.5); put(sfx, ping(2600), S(T["laughW"] + 20), 0.5)
put(sfx, pop(), S(T["laughW"] + 2), 0.7); put(sfx, whoosh(0.35, True, 500, 3000), S(T["laughW"] + 2), 0.3)
put(sfx, crowd(0.7, 3, "laugh"), S(T["my"]) + 0.25, 0.6)
put(sfx, creak(0.3), S(T["worse"] + 4), 0.6)
for f0 in (T["worse"] + 7, T["worse"] + 14, T["worse"] + 21): put(sfx, step(1.2), S(f0), 0.8)
put(sfx, creak(0.9), S(T["worse"] + 12), 0.45)
for k in range(7): put(sfx, pop(), S(T["plenty"] + 4 + k * 3), 0.35)
put(sfx, crowd(0.8, 3, "laugh"), S(T["plenty"] + 8), 0.35)
# ---- the Commons climax ----
put(sfx, whoosh(0.3, False, 400, 2500), S(T["dropped"] - 2), 0.4); put(sfx, binthud(), S(T["dropped"] + 6), 1.0)
put(sfx, kettle(S(T["stamps"] + 10) - S(T["plimSnap"] - 4)), S(T["plimSnap"] - 4), 0.8)
put(sfx, impact(1.0), S(T["snapW"]), 0.75)
put(sfx, impact(1.3), S(T["foot"]), 0.75); put(sfx, thud(1.2, 55), S(T["foot"]), 0.6)
put(sfx, slap(), S(T["table"]), 1.2); put(sfx, impact(0.8), S(T["table"]), 0.6); put(sfx, paper(0.7, 36), S(T["table"]) + 0.03, 0.8)
for k in range(4): put(sfx, whoosh(0.16, k % 2 == 0, 400, 2500), S(T["fistW"] + k * 5), 0.4)
put(sfx, impact(0.5), S(T["quoteI"]), 0.4)
put(sfx, impact(1.0), S(T["villains2"]), 0.9); put(sfx, gasp(1.0), S(T["villains2"]) + 0.05, 0.7)
put(sfx, pop(), S(T["villains2"] + 1), 0.8); put(sfx, whoosh(0.5, True, 400, 3000), S(T["villains2"] + 2), 0.35)
put(sfx, impact(0.4), S(T["back"]), 0.4); put(sfx, impact(0.7), S(T["refuses"]), 0.6)
put(sfx, whoosh(0.7, True, 300, 3000), S(T["wife"]), 0.5)
for n in range(7): put(sfx, flick(), S(T["handing"] + n * 8), 0.8)
put(sfx, scribble(S(c["papers"]) - S(T["reporters"] - 25)), S(T["reporters"] - 25), 0.7)
# ---- paper wipe into the press ----
put(sfx, paper(0.5, 40), S(c["papers"] - 8), 0.8); put(sfx, whoosh(0.45, True, 400, 5000), S(c["papers"] - 8), 0.6)
bed(whirr, c["papers"], c["square"] - 14, 1.0, 0.05, 0.1)
for b in beats(S(c["papers"]), S(c["square"] - 16)):
    put(sfx, clank(), b * BEAT, 0.7); put(sfx, chug(), b * BEAT + BEAT / 2, 0.6)
put(sfx, hiss(0.6), S(c["papers"] + 6), 0.7)
for k in range(3): put(sfx, whoosh(0.3, True, 500, 5000), S(T["every"] - 4 + k * 3), 0.45); put(sfx, flick(), S(T["every"] + 3 + k * 3), 0.4)
put(sfx, spin(0.5), S(c["square"] - 16), 0.9); put(sfx, slap(), S(c["square"] - 2), 0.9); put(sfx, whoosh(0.25, False, 300, 2500), S(c["square"] + 4), 0.3)
# ---- the square at dusk: the crowd, the joke, the chomp, the roar ----
put(sfx, crowd(2.0, 10, "laugh"), S(T["jokes"] - 3), 0.4)
put(sfx, chomp(), S(T["bite"]), 1.0); put(sfx, crowd(1.6, 12, "laugh"), S(T["bite"]) + 0.08, 0.8)
put(sfx, crowd(1.5, 12, "cheer"), S(T["mps"]), 0.8)
for k in range(4): put(sfx, whoosh(0.35, True, 500, 3500), S(T["mps"] + k * 2), 0.3)
# ---- whip into the Commons: Parliament caves ----
put(sfx, whoosh(0.32, True, 500, 6000), S(c["caves"] - 5), 0.9)
for ph in (0, 4):
    for n in range(3):
        f0 = c["caves"] + ph + 14 * n + 4
        if f0 < T["cavesW"] - 4: put(sfx, woodstamp(0.45), S(f0), 0.8)
put(sfx, woodstamp(1.4), S(T["cavesW"]), 0.55); put(sfx, impact(1.0), S(T["cavesW"]), 0.3); put(sfx, gasp(1.0, 0.7), S(T["cavesW"]) + 0.1, 0.6)
# ---- sun glare into the harbour, a year later ----
put(sfx, riser(0.6), S(c["year"]) - 0.6, 0.7)
for k, m in enumerate((86, 90, 93, 98)): put(sfx, glock(m, 1.4), S(c["year"] - 2) + k * 0.05, 0.3)
bed(lap, c["year"], c["year"] + 45, 0.45, 0.15, 1.0)
for k in range(3): put(sfx, gull(0.6), S(c["year"]) + 0.4 + k * 0.7, 0.4)
put(amb, bell(1250, 1.6), S(c["year"] + 14), 0.15); put(amb, bell(1250, 1.6), S(c["year"] + 22), 0.12)
put(sfx, crowd(1.8, 6, "cheer"), S(c["year"] + 4), 0.45)
# ---- match cut into the gym ----
put(sfx, rsqueak(0.2), S(c["shoes"]), 0.8)
put(sfx, rsqueak(0.14), S(T["gym"] + 6), 0.4)
put(sfx, whistle(0.55), S(T["got"] - 4), 0.8)
put(sfx, whoosh(0.3, True, 500, 3500), S(T["plimsolls"] - 2), 0.4); put(sfx, rsqueak(0.2), S(T["plimsolls"] + 14), 0.9)
# ---- every fast camera move gets air, every action a hit (moves found from the rendered picture's motion peaks) ----
for f0, d, up, g in ((180, 0.5, True, 0.45), (238, 0.3, True, 0.5), (297, 0.45, True, 0.45), (326, 0.4, False, 0.4), (368, 0.6, True, 0.45),
                     (513, 0.5, False, 0.35), (566, 0.5, True, 0.5), (612, 0.3, True, 0.45), (803, 0.4, True, 0.4), (826, 0.5, False, 0.4),
                     (869, 0.35, True, 0.5), (884, 0.4, False, 0.3), (928, 0.3, True, 0.6), (954, 0.35, False, 0.55), (987, 0.3, True, 0.5),
                     (1039, 0.3, True, 0.45), (1066, 0.35, True, 0.45), (1147, 0.3, True, 0.55), (1201, 0.3, False, 0.4), (1248, 0.6, True, 0.4),
                     (1650, 0.5, True, 0.4), (1669, 0.5, False, 0.4), (1726, 0.5, False, 0.4), (1760, 0.45, True, 0.4), (1804, 0.4, True, 0.4)):
    put(sfx, whoosh(d, up, 400, 5000), S(f0), g)
put(sfx, impact(0.5), 0.0, 1.4)                                                  # the cold open lands on a hit
for k, f0 in enumerate((2, 8, 14, 20)): put(sfx, whoosh(0.15, k % 2 == 0, 400, 2500), S(f0), 0.35)  # the fist shaking
put(sfx, impact(0.35), S(T["parliament"]), 1.0)
put(sfx, knock((880, 1650), (45, 70), (1.0, 0.4), 0.3), S(T["my"]), 0.5)        # "On MY ship?": a wood-block bonk
v = np.zeros(N); put(v, tuba(38, 0.25), S(T["owners"]), 0.9)                     # the shipowner reveal: a cheeky stab
for m in (62, 65, 69): put(v, pluck(m + 12, 0.3, 0.6), S(T["owners"]), 0.35)
music += v
sfx += reverb(sfx, 0.8) * 0.08
sfx = hp1(hp1(sfx, 40), 40)

# ---- calibration: SFX levels judged the way a phone plays them (nothing below ~300 Hz), against the processed narration ----
from scipy.signal import butter, sosfilt
VCHAIN = "aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=0.1:ratio=4:attack=2:release=80:makeup=4"
phone = lambda x: sosfilt(butter(4, 300, "high", fs=SR, output="sos"), x)
dbr = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
vproc = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "voice/voice.wav", "-af", VCHAIN, "-ac", "1", "-f", "f64le", "-"], capture_output=True).stdout, np.float64)
vph = phone(vproc); VREF = dbr(vph[np.abs(vph) > 1e-3])
HITS = {"cold open": 0, "villains (hook)": T["villains"], "insurance stamp": T["insure"] + 9, "crate: cram": T["cram"], "crate: cargo": T["cargo"],
        "crate: time-lapse": T["cargo"] + 10, "money bag": T["richer"], "dawn crate": T["water"] - 4, "STAYS IN PORT board": T["stays"] + 3,
        "bill in the bin": T["dropped"] + 6, "snaps crash": T["snapW"], "foot stomp": T["foot"], "table slam": T["table"], "villains (climax)": T["villains2"],
        "newspaper lands": c["square"] - 2, "small stamp": c["caves"] + 4, "act stamp": T["cavesW"], "whoosh: snaps whip": 928, "whoosh: Speaker": 1147}
def hit_db(tr, f): i = int(S(f) * SR); return dbr(phone(tr[i:i + int(0.15 * SR)]) * 0.85) - VREF
def sfx_cal(tr):  # the climax "villains" hit sits 2 dB under the narration on a phone (before ducking); the rest keep their relative gains
    k = 10 ** ((-2.0 - hit_db(tr, T["villains2"])) / 20)
    for n, f in HITS.items(): print(f"   {n:22s} {hit_db(tr * k, f):+6.1f} dB vs narration (phone)")
    pk = np.abs(tr * k * 0.85); top = sorted({int(i / SR * FPS) for i in np.argsort(pk)[-4000:]})
    print("   loudest sfx frames:", [f for j, f in enumerate(top) if j == 0 or f - top[j - 1] > 3][:8], "peak", round(float(pk.max()), 2))
    return k

# ================= write stems and mix =================
def f32wav(path, x):
    x = x[: int((DUR + 0.3) * SR)].astype(np.float32)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", path], input=x.tobytes(), check=True)
# each stem is scaled so the hook matches the approved hook-test balance (stems were peak-normalised over the hook there)
hook = slice(0, int(S(c["dock"] - 7) * SR))
spans = [("hook", 0, c["dock"]), ("dock", c["dock"], c["storm1"]), ("storm", c["storm1"], c["dawn"]), ("dawn", c["dawn"], c["club"]),
         ("club", c["club"], c["snaps"]), ("tension", c["snaps"], T["snapW"]), ("drive", T["snapW"], T["wife"]), ("gallery", T["wife"], c["papers"]),
         ("press", c["papers"], c["square"]), ("square", c["square"], c["caves"]), ("caves", c["caves"], c["year"]), ("harbour", c["year"], c["shoes"]),
         ("gym", c["shoes"], TOTAL)]
storm = slice(int(S(c["storm1"]) * SR), int(S(c["dawn"] - 8) * SR))
for name, tr in (("sfx", sfx), ("music", music), ("amb", amb)):
    if name == "amb": tr *= 10 ** (-19 / 20) / np.sqrt(np.mean(tr[storm] ** 2))
    elif name == "sfx": tr *= sfx_cal(tr)
    else: tr *= 0.9 / np.abs(tr[hook]).max()
    rms = lambda a, b: 20 * np.log10(np.sqrt(np.mean(tr[int(S(a) * SR):int(S(b) * SR)] ** 2)) + 1e-9)
    print(f"{name:5s} peak {np.abs(tr).max():.2f} |", " ".join(f"{n} {rms(a, b):.0f}" for n, a, b in spans))
    f32wav(f"audio/{name}.wav", tr)

# the mix bus. The narration ducks the music (deep, slow) and the SFX (light, fast: a hit's attack gets through, its tail dips
# under the word it lands on). The voice compressor catches its own peaks so the final limiter only shaves transients.
VCHAIN = "aresample=48000,highpass=f=80,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=0.1:ratio=4:attack=2:release=80:makeup=4"
MIXGRAPH = ("[0:a]" + VCHAIN + ",asplit=3[v][vk][vk2];"
            "[1:a]volume=0.32[m];[m][vk]sidechaincompress=threshold=0.04:ratio=5:attack=10:release=250[md];"
            "[2:a]volume=0.85[s0];[s0][vk2]sidechaincompress=threshold=0.25:ratio=2:attack=5:release=150[s];[3:a]volume=0.45[a];"
            "[v][md][s][a]amix=inputs=4:normalize=0,volume=0.78")

def mix(out="audio/mix.wav"):
    """voice chain + music ducked under the voice + SFX + ambience; one exact gain to -14 LUFS, then a single peak limiter last
    (the old chain drove the limiter ~2 dB too hard and let loudnorm undo it)"""
    pre = MIXGRAPH
    ins = ["-i", "voice/voice.wav", "-i", "audio/music.wav", "-i", "audio/sfx.wav", "-i", "audio/amb.wav"]
    def loud(graph):
        r = subprocess.run(["ffmpeg", "-v", "info", "-y", *ins, "-filter_complex", graph + ",ebur128=peak=true", "-t", str(DUR), "-f", "null", "-"], capture_output=True, text=True)
        tail = r.stderr[r.stderr.rindex("Summary:"):]
        return float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1))
    lim = ",alimiter=limit=0.8:attack=3:release=60:level=disabled"
    gain = -14.0 - loud(pre + lim)[0]
    for _ in range(2):  # the limiter shaves a little loudness off the peaks: settle the gain
        i_out, tp = loud(pre + f",volume={gain:.2f}dB" + lim); gain += -14.0 - i_out
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", pre + f",volume={gain:.2f}dB" + lim + ",afade=t=out:st=" + str(round(DUR - 0.06, 3)) + ":d=0.06",
                    "-t", str(DUR), "-ar", "48000", "-ac", "2", out], check=True)
    print(f"mix: gain {gain:+.2f} dB -> {loud('[0:a]anull' if False else pre + f',volume={gain:.2f}dB' + lim)[0]:.1f} LUFS")
mix()
print("audio done", round(DUR, 2), "s;", {k: round(S(v), 2) for k, v in CUT.items()})
