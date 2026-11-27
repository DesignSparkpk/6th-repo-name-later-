"""Per-scene finishing grade for the Plimsoll short (applied to the assembled render, before the final encode).
The 3D grade left the candle-lit Commons and the club too dark and over-saturated next to the reference look (luma p50 0.45,
lifted darks p5 0.14, saturation 0.47), and the fog dock too pale. Each zone gets a lift + gamma curve solved from its measured
median luma (p50 / p5) to a target, then a chroma scale. Continuous camera journeys crossfade the grade; cuts switch on the cut frame.
usage (repo root): python3 shorts/plimsoll/grade.py stats <per_frame.npy> <small.rgb>   (tune on a 180x320 proxy)
                   python3 shorts/plimsoll/grade.py render <in.mp4> <mix.wav> <out.mp4>"""
import subprocess, sys
import numpy as np

# zone: (first frame, last frame + 1, lift, gamma, chroma scale). Hand-tuned against before/after frames: forcing the reference's
# median luma (0.45) onto the night interiors with a pure curve made them milky, so the dark interiors get a gentle lift that
# keeps their contrast and colour, and the pale fog dock gets more colour.
ZONES = [
    ("chamber-hook", 0, 72, 0.015, 1.35, 0.93),
    ("river", 72, 123, 0.010, 1.25, 1.00),
    ("under", 123, 158, 0.0, 1.00, 1.00),
    ("dock", 158, 421, 0.0, 1.00, 1.45),
    ("storm", 421, 442, 0.010, 1.30, 0.95),
    ("night", 442, 475, 0.025, 1.08, 1.00),
    ("storm2", 475, 511, 0.010, 1.22, 1.00),
    ("dawn", 511, 728, 0.012, 1.10, 1.00),
    ("club", 728, 822, 0.015, 1.40, 1.00),
    ("chamber", 822, 1384, 0.015, 1.35, 0.93),
    ("press", 1384, 1426, 0.030, 1.05, 1.10),
    ("square", 1426, 1570, 0.012, 1.10, 1.00),
    ("caves", 1570, 1619, 0.015, 1.35, 0.93),
    ("harbour", 1619, 1687, 0.012, 1.15, 1.00),
    ("gym", 1687, 1857, 0.0, 1.00, 0.95),
]
# boundaries that are one continuous camera journey (no cut to hide a grade change): crossfade over +-n frames
BLEND = {72: 8, 123: 4, 822: 10}

def solve(a, b, t5, t50):
    """lift L and exponent k with t = L + (1 - L) * v**k: p50 b lands exactly on t50 (midtones are what reads as brightness);
    the lift is chosen so p5 a lands as close to t5 as the curve allows (never below it: lifted darks are part of the look)"""
    if abs(a - t5) < 1e-4 and abs(b - t50) < 1e-4: return 0.0, 1.0
    best = (9, 0.0, 1.0)
    for L in np.linspace(0, min(t5, t50) * 0.995, 4000):
        k = np.log((t50 - L) / (1 - L)) / np.log(b)
        if k <= 0: continue
        e = abs(L + (1 - L) * a ** k - t5)
        if e < best[0]: best = (e, L, k)
    return best[1], best[2]

PARAMS = [(n, f0, f1, L, 1 / g, c) for n, f0, f1, L, g, c in ZONES]

def params_at(f):
    for i, (n, f0, f1, L, k, s) in enumerate(PARAMS):
        if f0 <= f < f1: break
    cur = np.array([L, k, s])
    for edge, w in BLEND.items():  # crossfade across a continuous boundary
        if abs(f - edge) < w:
            j = next(j for j, p in enumerate(PARAMS) if p[1] == edge)
            A, B = np.array(PARAMS[j - 1][3:]), np.array(PARAMS[j][3:])
            u = (f - (edge - w)) / (2 * w); u = u * u * (3 - 2 * u)
            cur = A + (B - A) * u
    return cur

CHROMA_ALL = 1.0  # with the luma-weighted factor below: shadows calmer (reference saturation p50 0.47, ours ran ~0.63)
_masks = {}
def vignette(h, w):
    """corners -16 %, edge midpoints ~-6 %, centre untouched: the lift above had flattened the render's own vignette
    (corner/centre 0.87 -> 0.92; the reference sits at 0.72)"""
    if (h, w) not in _masks:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - (w - 1) / 2) / (w / 2)) ** 2 + ((yy - (h - 1) / 2) / (h / 2)) ** 2)
        _masks[(h, w)] = (1 - 0.16 * np.clip((r - 0.55) / (1.414 - 0.55), 0, 1) ** 1.6)[..., None].astype(np.float32)
    return _masks[(h, w)]

def grade(img, f):
    L, k, s = params_at(f)
    lut = (L + (1 - L) * (np.arange(256) / 255.0) ** k).astype(np.float32)
    x = lut[img]
    y = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    s = s * CHROMA_ALL * (0.90 + 0.18 * y)  # calmer shadows, lit colours kept vivid
    x = (y + s * (x - y)) * vignette(*img.shape[:2])
    return (np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8)

if __name__ == "__main__":
    mode = sys.argv[1]
    for n, f0, f1, L, k, s in PARAMS: print(f"{n:13s} lift {L:.3f} gamma {1 / k:.2f} chroma x{s:.2f}")
    if mode == "stats":  # grade the 180x320 proxy and report per-zone numbers
        W, H = 180, 320
        fr = np.fromfile(sys.argv[3], np.uint8).reshape(-1, H, W, 3)
        out = np.stack([grade(fr[i], i) for i in range(len(fr))]).astype(np.float32) / 255
        Y = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]
        mx, mn = out.max(-1), out.min(-1); Sat = np.where(mx > 0.02, (mx - mn) / np.maximum(mx, 1e-6), 0)
        per = np.stack([np.percentile(Y.reshape(len(Y), -1), 50, 1), np.percentile(Y.reshape(len(Y), -1), 5, 1), np.median(Sat.reshape(len(Y), -1), 1)], 1)
        for n, f0, f1, *_ in PARAMS:
            m = np.median(per[f0:f1], 0); print(f"  after {n:13s} luma50 {m[0]:.3f}  luma5 {m[1]:.3f}  sat {m[2]:.2f}")
        m = np.median(per, 0); print(f"  after ALL           luma50 {m[0]:.3f}  luma5 {m[1]:.3f}  sat {m[2]:.2f}   (reference 0.449 / 0.137 / 0.467)")
    else:  # full-resolution: decode -> grade -> encode (limited-range BT.709) with the mix
        src, mix, dst = sys.argv[2:5]; W, H = 1080, 1920
        dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30", "-i", "-", "-i", mix,
                                "-map", "0:v", "-map", "1:a", "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
                                "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high",
                                "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
                                "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", dst], stdin=subprocess.PIPE)
        f = 0
        while True:
            buf = dec.stdout.read(W * H * 3)
            if len(buf) < W * H * 3: break
            enc.stdin.write(grade(np.frombuffer(buf, np.uint8).reshape(H, W, 3), f).tobytes()); f += 1
            if f % 300 == 0: print("graded", f, flush=True)
        enc.stdin.close(); enc.wait(); dec.wait()
        print("frames", f)
