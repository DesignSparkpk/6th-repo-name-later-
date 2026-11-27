"""The film's last picture: an emission nebula in the Hubble palette, generated (no photo). usage: python3 studio/scripts/make_nebula.py
Writes studio/public/assets/hubble/nebula.jpg (1080 x 1920). Gas = domain-warped fractal noise in three emission lines
(sulphur -> red/gold, hydrogen -> gold/green, oxygen -> teal), a bright cavity carved by a young cluster, dark dust columns with
sunlit rims, and stars with the telescope's four-point diffraction spikes."""
import os
import numpy as np
from scipy import ndimage
from PIL import Image

OW, OH, PAD = 1080, 1920, 160
W, H = OW + 2 * PAD, OH + 2 * PAD
rng = np.random.default_rng(1990)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

def smooth_noise(scale, seed):
    r = np.random.default_rng(seed)
    h, w = int(np.ceil(H / scale)) + 3, int(np.ceil(W / scale)) + 3
    small = r.standard_normal((h, w)).astype(np.float32)
    big = ndimage.zoom(small, scale, order=3)[:H, :W]
    return big
def fbm(seed, base=420.0, octaves=6, gain=0.55):
    out = np.zeros((H, W), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        out += amp * smooth_noise(max(2.0, base / 2 ** o), seed * 31 + o); tot += amp; amp *= gain
    return out / tot
def warp(img, dx, dy):
    return ndimage.map_coordinates(img, [np.clip(yy + dy, 0, H - 1), np.clip(xx + dx, 0, W - 1)], order=1)

# domain warp: swirling, filamentary gas
wx, wy = fbm(11, 380) * 140, fbm(12, 380) * 140
def gas(seed, base, bias):
    n = warp(fbm(seed, base), wx, wy)
    return np.clip(n * 1.6 + bias, 0, None) ** 1.6

cx, cy = 560 + PAD, 820 + PAD
rad = np.sqrt(((xx - cx) / 1.0) ** 2 + ((yy - cy) / 1.25) ** 2)
cavity = np.exp(-(rad / 380) ** 2)            # the glow around the young cluster
outer = np.exp(-(rad / 900) ** 2)
S = gas(21, 360, 0.05) * (0.35 + 0.9 * outer)
Hh = gas(22, 300, 0.15) * (0.3 + 1.1 * outer) + 0.9 * cavity
O = gas(23, 460, 0.10) * (0.5 + 0.6 * outer) + 0.45 * cavity * np.clip((rad - 60) / 220, 0, 1)
# Hubble palette (SHO -> RGB)
R = 1.0 * S + 0.78 * Hh + 0.04 * O
G = 0.22 * S + 0.6 * Hh + 0.5 * O
B = 0.05 * S + 0.14 * Hh + 1.05 * O
img = np.stack([R, G, B], -1)

# dust: columns rising from the lower left, soft but structured, lit along their upper edges
d = warp(fbm(41, 260), wx * 0.6, wy * 0.6)
st = lambda y0: np.clip((yy - y0) / 260, 0, 1) ** 2 * (3 - 2 * np.clip((yy - y0) / 260, 0, 1))
col = np.exp(-((xx - (330 + PAD + 0.28 * (H - yy))) / 150) ** 2) * st(980 + PAD) + np.exp(-((xx - (770 + PAD - 0.12 * (H - yy))) / 110) ** 2) * st(1260 + PAD)
dust = np.clip(col * (0.75 + 0.6 * d) + np.clip(d - 0.55, 0, None) * 1.2, 0, 1)
dust = ndimage.gaussian_filter(dust, 3)
rim = ndimage.gaussian_filter(np.clip(ndimage.gaussian_filter(dust, 3) - ndimage.shift(ndimage.gaussian_filter(dust, 3), (10, 4), order=1), 0, None), 2) * 2.6
img = img * (1 - 0.92 * dust[..., None]) + rim[..., None] * np.array([1.4, 0.95, 0.55])

# tone map (soft shoulder), a touch of contrast
img = 1 - np.exp(-img * 0.95)
img = np.clip(img, 0, 1) ** 1.08

# stars: faint field, cluster stars round the cavity, a few big ones with diffraction spikes
def star(y, x, b, s, spikes=0.0):
    r0 = int(max(6, s * 6 + spikes * 90))
    y0, y1, x0, x1 = max(0, y - r0), min(H, y + r0 + 1), max(0, x - r0), min(W, x + r0 + 1)
    gy, gx = np.mgrid[y0:y1, x0:x1]; dy, dx = gy - y, gx - x
    p = np.exp(-(dx * dx + dy * dy) / (2 * s * s))
    if spikes: p = p + spikes * (np.exp(-np.abs(dy) / 0.9) * np.exp(-np.abs(dx) / (60 * spikes + 8)) + np.exp(-np.abs(dx) / 0.9) * np.exp(-np.abs(dy) / (60 * spikes + 8)))
    img[y0:y1, x0:x1] += (b * p)[..., None] * np.array([1.0, 0.97, 0.92])
for _ in range(2600): star(int(rng.integers(0, H)), int(rng.integers(0, W)), float(rng.uniform(0.05, 0.5)) ** 1.5, float(rng.uniform(0.5, 1.1)))
for _ in range(90):
    a, r = rng.uniform(0, 2 * np.pi), abs(rng.normal(0, 120)); star(int(cy + np.sin(a) * r * 1.25), int(cx + np.cos(a) * r), float(rng.uniform(0.3, 0.9)), float(rng.uniform(0.8, 1.6)))
for _ in range(10): star(int(rng.integers(80, H - 80)), int(rng.integers(80, W - 80)), float(rng.uniform(0.8, 1.3)), 2.2, float(rng.uniform(0.35, 0.8)))
img = np.clip(img, 0, 1)[PAD:PAD + OH, PAD:PAD + OW]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "hubble", "nebula.jpg")
Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(out, quality=93)
print("wrote", out)
