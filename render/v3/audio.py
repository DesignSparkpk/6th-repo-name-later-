"""Version 3 audio: Kokoro voice + original synthesized beat + SFX, and the shared event timeline.

Usage: python audio.py <short.json> <out_dir> <kokoro_model_dir>
Writes <id>.voice.wav, <id>.music.wav, <id>.sfx.wav and <id>.timing.json (read by short.html).
All music and sound effects are generated here from scratch (no samples, no copyright issues).
"""
import json, re, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

spec_path, out_dir, model_dir = sys.argv[1:4]
spec = json.load(open(spec_path))
SR = 44100
VSR = 24000
rng = np.random.default_rng(7)
LEAD, GAP, TAIL = 0.12, 0.16, 0.45

# ---------------------------------------------------------------- voice + timeline
k = Kokoro(f'{model_dir}/kokoro-v1.0.onnx', f'{model_dir}/voices-v1.0.bin')
voice = spec['voice']


def trim(a, thr=0.008):
    idx = np.where(np.abs(a) > thr)[0]
    return a[max(idx[0] - 200, 0): idx[-1] + 400] if len(idx) else a


def caption_words(say):
    out, em = [], False
    for tok in say.split():
        starts, ends = tok.startswith('*') or tok.startswith('"*'), tok.rstrip('.,!?;:"').endswith('*')
        clean = tok.replace('*', '')
        if starts: em = True
        out.append((clean, em))
        if ends: em = False
    return out


beats, voice_clips, t = [], [], LEAD
for b in spec['beats']:
    a, _ = k.create(b['say'].replace('*', ''), voice=voice['name'], speed=voice['speed'], lang='en-us')
    a = trim(np.asarray(a, dtype=np.float32))
    dur = len(a) / VSR
    words = caption_words(b['say'])
    weights = [len(re.sub(r'\W', '', w)) + 2 + (4 if re.search(r'[.,!?;:]$', w) else 0) + (3 if w.endswith('...') else 0) for w, _ in words]
    tot, acc, wt = sum(weights), 0.0, []
    for (w, em), wg in zip(words, weights):
        s = t + dur * acc / tot; acc += wg
        wt.append({'w': w, 's': round(s, 3), 'e': round(t + dur * acc / tot, 3), 'em': em})
    beats.append({'start': round(t, 3), 'dur': round(dur, 3), 'end': round(t + dur, 3), 'words': wt})
    voice_clips.append((t, a))
    t += dur + GAP
total = round(t - GAP + TAIL, 3)

vtrack = np.zeros(int(total * VSR) + VSR, dtype=np.float32)
for st, a in voice_clips:
    i = int(st * VSR); vtrack[i:i + len(a)] += a
sf.write(f"{out_dir}/{spec['id']}.voice.wav", vtrack[: int(total * VSR)], VSR)

# events with absolute times
events, hooks, impacts, flashes, whips, rehooks = [], [], [], [], [], []
drop_t = beats[1]['start'] if len(beats) > 1 else beats[0]['end']
for i, (b, bt) in enumerate(zip(spec['beats'], beats)):
    for a in b['do']:
        ev = {'t': bt['start'], 'end': bt['end'], 'a': a}
        events.append(ev)
        if 'hook' in a:
            n = len(a['hook']['lines'])
            lt = [round(bt['start'] + j * bt['dur'] * 0.78 / n, 3) for j in range(n)]
            hooks.append({**a['hook'], 't': bt['start'], 'end': bt['end'] + GAP, 'lineT': lt, 'emojiT': round(lt[-1] + 0.25, 3)})
            impacts += lt; flashes.append(lt[0])
        if 'stamp' in a: impacts.append(bt['start'] + 0.05); flashes.append(bt['start'] + 0.05)
        if a.get('clear') or 'list' in a or ('split' in a and 'good' not in a['split']) or 'cta' in a: whips.append(bt['start'])
        if a.get('rehook') and i + 1 < len(beats):
            rehooks.append((bt['start'], beats[i + 1]['start']))
            impacts.append(beats[i + 1]['start']); flashes.append(beats[i + 1]['start'])
if hooks: whips.append(drop_t); impacts.append(drop_t); flashes.append(drop_t)

json.dump({'total': total, 'beats': beats, 'events': events, 'hooks': hooks, 'drop': drop_t,
           'fx': {'impacts': sorted(set(round(x, 3) for x in impacts)), 'flashes': sorted(set(round(x, 3) for x in flashes)),
                  'whips': sorted(set(round(x, 3) for x in whips))}, 'rehooks': rehooks},
          open(f"{out_dir}/{spec['id']}.timing.json", 'w'))

# ---------------------------------------------------------------- synth helpers
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)


def onepole_lp(x, cut):  # cut: array or float, Hz
    cut = np.broadcast_to(np.asarray(cut, dtype=np.float64), x.shape)
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y


def place(track, clip, at, gain=1.0):
    i = int(max(at, 0) * SR)
    if i >= len(track): return
    n = min(len(clip), len(track) - i); track[i:i + n] += clip[:n] * gain


def kick():
    x = tt(0.42); f = 45 + 115 * np.exp(-x * 32)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7.5) + noise(0.42) * np.exp(-x * 400) * 0.25).astype(np.float32)


def clap():
    x = tt(0.25); n = np.diff(noise(0.25), prepend=0)
    env = sum(np.exp(-np.clip(x - o, 0, None) * 120) * (x >= o) for o in (0, 0.011, 0.022)) * 0.5 + np.exp(-x * 18) * (x >= 0.022)
    return (onepole_lp(n, 6000) * env).astype(np.float32)


def hat():
    x = tt(0.07); return (np.diff(np.diff(noise(0.07), prepend=0), prepend=0) * np.exp(-x * 70) * 0.25).astype(np.float32)


def saw(f, d, harm=7):
    x = tt(d); return sum(np.sin(2 * np.pi * f * h * x) / h for h in range(1, harm + 1)).astype(np.float32)


def impact(big=True):
    d = 1.2 if big else 0.55; x = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-x * 1.5) + 25) / SR) * np.exp(-x * (3 if big else 7))
    body = onepole_lp(noise(d), 900) * np.exp(-x * 9) * 2.2
    click = noise(d) * np.exp(-x * 500) * 0.6
    return ((sub * 0.9 + body + click) * (1.0 if big else 0.6)).astype(np.float32)


def whoosh(d=0.38, up=True):
    x = tt(d); p = x / d
    cut = 300 + 7000 * (np.sin(np.pi * p) ** 2)
    env = np.sin(np.pi * p) ** 1.5
    return (onepole_lp(noise(d), cut) * env * 2.5).astype(np.float32)


def riser(d):
    x = tt(d); p = x / d
    tone = np.sin(2 * np.pi * np.cumsum(180 + 1600 * p ** 2) / SR) * 0.25
    hiss = onepole_lp(noise(d), 400 + 9000 * p) * 0.9
    return ((tone + hiss) * p ** 2.2).astype(np.float32)


def pop(f0=600, f1=1500, d=0.09, v=0.5):
    x = tt(d); f = np.linspace(f0, f1, len(x))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 40) * v).astype(np.float32)


def ding():
    x = tt(0.9)
    return ((np.sin(2 * np.pi * 1318.5 * x) * 0.5 + np.sin(2 * np.pi * 1975.5 * x) * 0.3 + np.sin(2 * np.pi * 2637 * x) * 0.15)
            * np.exp(-x * 5) * 0.45).astype(np.float32)


def scribble():
    x = tt(0.45); am = 0.5 + 0.5 * np.sin(2 * np.pi * 22 * x)
    return (onepole_lp(np.diff(noise(0.45), prepend=0), 5000) * am * np.sin(np.pi * x / 0.45) * 0.9).astype(np.float32)


def click():
    x = tt(0.012); return (np.diff(noise(0.012), prepend=0) * np.exp(-x * 600) * 0.35).astype(np.float32)


# ---------------------------------------------------------------- music (124 BPM, A minor: Am F C G)
BPM = 124; beat = 60 / BPM
music = np.zeros(int(total * SR) + SR, dtype=np.float32)
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (261.63, 329.63, 392.0), (196.0, 246.94, 293.66)]
roots = [110.0, 87.31, 130.81, 98.0]
K, C, H = kick(), clap(), hat()
drums = np.zeros_like(music); bassp = np.zeros_like(music)
n_beats = int((total - drop_t) / beat) + 2
for bi in range(n_beats):
    bt0 = drop_t + bi * beat
    bar = (bi // 4) % 4
    place(drums, K, bt0, 0.95)
    if bi % 2 == 1: place(drums, C, bt0, 0.45)
    place(drums, H, bt0 + beat / 2, 0.5); place(drums, H, bt0 + beat * 0.75, 0.22)
    for e in (0, 0.5):  # bass 8ths
        place(bassp, saw(roots[bar], beat * 0.45, 6) * np.exp(-tt(beat * 0.45) * 6), bt0 + e * beat, 0.32)
    for s in range(4):  # arp 16ths
        f = chords[bar][[0, 1, 2, 1][s]] * 2
        x = tt(0.16); place(bassp, (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 22) * 0.10, bt0 + s * beat / 4)
    if bi % 4 == 0:
        x = tt(beat * 4); pad = sum(saw(f, beat * 4, 4) for f in chords[bar]) * np.minimum(x / 0.25, 1) * np.exp(-x * 0.25)
        place(bassp, pad * 0.05, bt0)
# sidechain pump on bass/pad/arp
tm = np.arange(len(music)) / SR
phase = np.mod(tm - drop_t, beat)
pump = np.where(tm >= drop_t, 1 - 0.65 * np.exp(-phase * 11), 0)
music = drums + bassp * pump
# gates: silence before the drop, dip during rehooks
gain = np.where(tm >= drop_t, 1.0, 0.0)
for a, b in rehooks:
    gain[(tm >= a) & (tm < b)] = 0.12
gain = np.convolve(gain, np.ones(441) / 441, mode='same')
music = music * gain
music = music[: int(total * SR)]
# fade out last 0.3 s
fo = int(0.3 * SR); music[-fo:] *= np.linspace(1, 0, fo)
music /= max(1e-6, np.abs(music).max()) / 0.9
sf.write(f"{out_dir}/{spec['id']}.music.wav", music, SR)

# ---------------------------------------------------------------- SFX
fx = np.zeros(int(total * SR) + SR, dtype=np.float32)
if hooks:
    h = hooks[0]
    for j, lt in enumerate(h['lineT']): place(fx, impact(j == 0), lt, 0.9 if j == 0 else 0.7)
    place(fx, pop(500, 1800, 0.14, 0.6), h['emojiT'])
    rd = max(0.4, drop_t - h['lineT'][0] - 0.1); place(fx, riser(rd), drop_t - rd, 0.55)
    place(fx, impact(True), drop_t, 1.0)
for a, b in rehooks:
    place(fx, riser(b - a), a, 0.6); place(fx, impact(True), b, 0.9)
for w in json.load(open(f"{out_dir}/{spec['id']}.timing.json"))['fx']['whips']:
    place(fx, whoosh(0.36), w - 0.2, 0.8)
for ev in events:
    a, t0 = ev['a'], ev['t']
    if 'user' in a: place(fx, whoosh(0.18), t0 - 0.05, 0.35); place(fx, pop(500, 800, 0.07, 0.35), t0)
    if 'ai' in a:
        place(fx, pop(900, 1400, 0.08, 0.4), t0)
        L = len(a['ai']); cps = max(L / max(0.8, (ev['end'] - t0) * 0.8), 28); d = L / cps
        c = t0 + 0.2
        while c < t0 + 0.15 + d:
            place(fx, click(), c, 0.5 + rng.random() * 0.3); c += 0.045 + rng.random() * 0.05
    if 'mark' in a: place(fx, scribble(), t0 + 0.1, 0.8)
    if 'stamp' in a: place(fx, impact(False), t0 + 0.05, 1.0)
    if 'react' in a: place(fx, pop(400, 1600, 0.12, 0.6), t0 + 0.05)
    if 'hl' in a: place(fx, ding(), t0 + 0.1, 0.8)
    if 'zoom' in a: place(fx, whoosh(0.22), t0 - 0.05, 0.4)
    if 'cta' in a: place(fx, ding(), t0 + 0.25, 0.9)
fx = fx[: int(total * SR)]
fx /= max(1e-6, np.abs(fx).max()) / 0.9
sf.write(f"{out_dir}/{spec['id']}.sfx.wav", fx, SR)
print(spec['id'], 'audio', total, 's')
