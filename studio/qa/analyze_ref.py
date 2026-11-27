"""Frame-by-frame (30 fps) study of one short. Private study: outputs go to a scratch dir, never to the repo.
usage: python3 -I studio/qa/analyze_ref.py <video.mp4> <outdir>
writes: words.json (word timings), frames.csv (per frame: global dx, dy, zoom, change, luma, sat, cut flag),
        sheets/s_XX.jpg (30 fps contact sheets, 2 s = 60 frames each, frame number burned in), summary.txt"""
import json, os, subprocess, sys
import numpy as np

src, out = sys.argv[1], sys.argv[2]
os.makedirs(f"{out}/sheets", exist_ok=True)

# ---- transcript with word timings ----
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
from faster_whisper import WhisperModel
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(np.frombuffer(raw, np.int16).astype(np.float32) / 32768, word_timestamps=True)
W = [(round(w.start, 2), round(w.end, 2), w.word.strip()) for s in segs for w in s.words]
json.dump(W, open(f"{out}/words.json", "w"))

# ---- per-frame measurements ----
w, h = 180, 320
v = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
rgb = np.frombuffer(v, np.uint8).reshape(-1, h, w, 3).astype(np.float32) / 255
n = len(rgb)
Y = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
cap = slice(int(h * 0.64), int(h * 0.76))           # burned-in caption band: masked for motion
g = Y.copy(); g[:, cap] = g[:, cap].mean()
mx, mn = rgb.max(-1), rgb.min(-1); S = np.where(mx > 0.15, (mx - mn) / np.maximum(mx, 1e-6), np.nan)
win = np.outer(np.hanning(h), np.hanning(w)).astype(np.float32)

def shift(a, b):
    A, B = np.fft.fft2((a - a.mean()) * win), np.fft.fft2((b - b.mean()) * win)
    R = A * np.conj(B); R /= np.abs(R) + 1e-9
    c = np.fft.ifft2(R).real; p = np.unravel_index(c.argmax(), c.shape)
    dy, dx = [((q + m // 2) % m) - m // 2 for q, m in zip(p, c.shape)]
    return dx, dy, float(c.max())

def zoom(a, b):  # radial scale between frames from the log-polar of the magnitude spectra (coarse)
    ca, cb = a[h // 4:3 * h // 4, w // 4:3 * w // 4], b[h // 4:3 * h // 4, w // 4:3 * w // 4]
    best, bz = 1e9, 1.0
    for z in (0.97, 0.98, 0.99, 0.995, 1.0, 1.005, 1.01, 1.02, 1.03):
        hh, ww = ca.shape; yy, xx = np.mgrid[0:hh, 0:ww]
        ys = np.clip(((yy - hh / 2) / z + hh / 2).astype(int), 0, hh - 1); xs = np.clip(((xx - ww / 2) / z + ww / 2).astype(int), 0, ww - 1)
        e = np.abs(ca[ys, xs] - cb).mean()
        if e < best: best, bz = e, z
    return bz

def hist(x): return np.histogram(x, 32, (0, 1))[0] / x.size
rows = ["f,t,dx720,dy720,zoom,change,peak,luma,sat,cut"]
sc = 720 / w
for i in range(n):
    if i == 0: rows.append(f"0,0,0,0,1,0,1,{Y[0].mean():.3f},{np.nanmedian(S[0]):.3f},0"); continue
    dx, dy, pk = shift(g[i - 1], g[i]); ch = float(np.abs(g[i] - g[i - 1]).mean() * 255)
    hd = np.abs(hist(g[i]) - hist(g[i - 1])).sum()
    cut = int(hd > 0.35 and ch > 15 and pk < 0.25)
    z = zoom(g[i - 1], g[i]) if not cut else 1.0
    rows.append(f"{i},{i / 30:.3f},{dx * sc:.1f},{dy * sc:.1f},{z:.3f},{ch:.2f},{pk:.2f},{Y[i].mean():.3f},{np.nanmedian(S[i]):.3f},{cut}")
open(f"{out}/frames.csv", "w").write("\n".join(rows))

# ---- 30 fps contact sheets (2 s each) ----
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf",
    "scale=108:192,drawtext=text='%{n}':x=2:y=2:fontsize=13:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=15x4",
    "-vsync", "0", f"{out}/sheets/s_%02d.jpg"])

# ---- summary ----
a = np.genfromtxt(f"{out}/frames.csv", delimiter=",", names=True)
sp = np.hypot(a["dx720"], a["dy720"]) + np.abs(a["zoom"] - 1) * 734
cuts = a["f"][a["cut"] == 1].astype(int).tolist()
loud = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
I = [l.strip() for l in loud.split("Summary")[-1].splitlines() if l.strip().startswith(("I:", "LRA:"))]
gaps = [(W[i][1], round(W[i + 1][0] - W[i][1], 2)) for i in range(len(W) - 1) if W[i + 1][0] - W[i][1] > 0.25]
sents, cur, t0 = [], [], None
for s0, e0, word in W:
    t0 = s0 if t0 is None else t0; cur.append(word)
    if word[-1:] in ".?!": sents.append(f"{t0:5.1f}-{e0:5.1f}  {' '.join(cur)}"); cur, t0 = [], None
summ = [f"frames {n}  duration {n / 30:.2f}s  words {len(W)}  rate {len(W) / max(W[-1][1], 1):.2f} w/s  first word {W[0][0]}s  last word end {W[-1][1]}s",
        f"loudness {' '.join(I)}",
        f"hard cuts ({len(cuts)}): " + ", ".join(f"{c}({c / 30:.2f}s)" for c in cuts),
        f"camera speed px/f @720: median {np.median(sp):.1f}  p90 {np.percentile(sp, 90):.1f}  still(<0.3) {100 * (sp < 0.3).mean():.0f}%  moving(>=2) {100 * (sp >= 2).mean():.0f}%",
        f"luma median {np.median(a['luma']):.3f}  sat median {np.nanmedian(a['sat']):.3f}",
        "luma per second: " + " ".join(f"{a['luma'][k * 30:(k + 1) * 30].mean():.2f}" for k in range(n // 30)),
        "motion per second (px/f): " + " ".join(f"{sp[k * 30:(k + 1) * 30].mean():.0f}" for k in range(n // 30)),
        f"pauses >0.25s: {gaps}", "", "SENTENCES:"] + sents
open(f"{out}/summary.txt", "w").write("\n".join(summ))
print("\n".join(summ))
