"""Scan a rendered video for broken frames: isolated outliers (a frame unlike both neighbours while the neighbours match
each other - the tiled/garbled frames parallel swangle tabs produce) and black frames.
usage: python3 studio/qa/glitch_scan.py video.mp4 [allow_frames_csv]   (allow = known flash/cut frames, +-2 each)"""
import subprocess, sys
import numpy as np
path = sys.argv[1]
allow = set()
if len(sys.argv) > 2 and sys.argv[2]:
    for a in sys.argv[2].split(","):
        allow.update(range(int(a) - 2, int(a) + 3))
W, H = 135, 240
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(fr)
print("frames", n)
d = lambda a, b: float(np.mean(np.abs(fr[a] - fr[b])))
bad = []
for i in range(n):
    if fr[i].mean() < 6: bad.append((i, "black", fr[i].mean()))
for i in range(1, n - 1):
    p, q, nb = d(i, i - 1), d(i, i + 1), d(i - 1, i + 1)
    if p > 12 and q > 12 and nb < 0.35 * min(p, q) and i not in allow:
        bad.append((i, "outlier", round(p, 1), round(q, 1), round(nb, 1)))
for b in bad: print("BAD", *b)
print("OK" if not bad else f"{len(bad)} suspicious frames")
