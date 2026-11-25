"""Generate the voice track, sound effects and word timings for a version 2 Short.

Usage: python voice.py <short.json> <out_dir> <kokoro_model_dir>
  short.json  one Short from scripts.js (exported by make.js)
Writes <out_dir>/<id>.wav and <out_dir>/<id>.timing.json
"""
import json, re, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

spec_path, out_dir, model_dir = sys.argv[1:4]
spec = json.load(open(spec_path))
k = Kokoro(f'{model_dir}/kokoro-v1.0.onnx', f'{model_dir}/voices-v1.0.bin')
SR = 24000
LEAD, GAP, TAIL = 0.15, 0.22, 0.35


def trim(a, thr=0.008):
    idx = np.where(np.abs(a) > thr)[0]
    return a[max(idx[0] - 240, 0): idx[-1] + 480] if len(idx) else a


def pop(freq0=900, freq1=1500, dur=0.07, vol=0.18):
    t = np.linspace(0, dur, int(SR * dur), False)
    f = np.linspace(freq0, freq1, len(t))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * vol).astype(np.float32)


def whoosh(dur=0.25, vol=0.07):
    n = int(SR * dur)
    noise = np.random.default_rng(1).standard_normal(n).astype(np.float32)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    sm = np.convolve(noise, np.ones(30) / 30, mode='same')
    return (sm * env * vol * 4).astype(np.float32)


SFX = {'user': pop(700, 1000), 'ai': pop(1000, 1400), 'react': pop(500, 1800, 0.12, 0.22),
       'card': whoosh(), 'split': whoosh(), 'list': whoosh(), 'clear': whoosh(0.18, 0.05)}

clips, beats, t = [], [], LEAD
for b in spec['beats']:
    a, sr = k.create(b['say'], voice=spec.get('voice', 'af_heart'), speed=1.12, lang='en-us')
    a = trim(np.asarray(a, dtype=np.float32))
    dur = len(a) / SR
    # word timings: spread over the clip in proportion to word length (+ pauses after punctuation)
    words = b['say'].split()
    weights = [len(re.sub(r'\W', '', w)) + 2 + (3 if re.search(r'[.,!?;:]$', w) else 0) for w in words]
    total = sum(weights)
    acc, wt = 0.0, []
    for w, wg in zip(words, weights):
        start = t + dur * acc / total
        acc += wg
        wt.append({'w': w, 's': round(start, 3), 'e': round(t + dur * acc / total, 3)})
    beats.append({'start': round(t, 3), 'dur': round(dur, 3), 'words': wt})
    clips.append((t, a))
    t += dur + GAP

total = t - GAP + TAIL
mix = np.zeros(int(total * SR) + SR, dtype=np.float32)
for start, a in clips:
    i = int(start * SR); mix[i:i + len(a)] += a
for b, info in zip(spec['beats'], beats):
    for act in b['do']:
        kind = next((k for k in SFX if k in act), None)
        if kind:
            fx = SFX[kind]; i = int(max(info['start'] - 0.05, 0) * SR); mix[i:i + len(fx)] += fx[: len(mix) - i]
mix = mix[: int(total * SR)]
mix = mix / max(1.0, np.abs(mix).max() / 0.95)
sf.write(f"{out_dir}/{spec['id']}.wav", mix, SR)
json.dump({'total': round(total, 3), 'beats': beats}, open(f"{out_dir}/{spec['id']}.timing.json", 'w'))
print(spec['id'], 'voice', round(total, 2), 's')
