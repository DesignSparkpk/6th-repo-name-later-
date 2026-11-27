"""Measure a rendered short against the reference-channel numbers (from the skill's private study, 20 videos / 32k frames).
usage: python3 studio/qa/measure.py video.mp4   -> prints a pass/fail table. Reference frames are never stored here."""
import subprocess, sys, numpy as np
REF = {  # per-frame medians, reference "all" (day+golden+night+interior) unless noted
 "luma p50": (0.449, 0.40, 0.58), "luma p99 (near-white)": (0.943, 0.90, 1.0), "luma p5 (lifted darks)": (0.137, 0.08, 0.24),
 "HSV sat p50": (0.467, 0.40, 0.62), "lit chroma C* p50": (31.9, 28, 40), "vignette corner/centre": (0.72, 0.6, 0.9),
 "camera-still frames %": (10, 1, 27), "moving frames %": (65, 34, 94),
}
def frames(fn, w, h, fps=None, fmt="rgb24"):
    vf = (f"fps={fps}," if fps else "") + f"scale={w}:{h}"
    raw = subprocess.run(["ffmpeg","-v","error","-i",fn,"-vf",vf,"-f","rawvideo","-pix_fmt",fmt,"-"],capture_output=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,h,w,3 if fmt=="rgb24" else 1)[...,:].astype(np.float32)/255
def lab_c(rgb):
    lin = np.where(rgb<=0.04045, rgb/12.92, ((rgb+0.055)/1.055)**2.4)
    M = np.array([[0.4124,0.3576,0.1805],[0.2126,0.7152,0.0722],[0.0193,0.1192,0.9505]]); xyz = lin@M.T/np.array([0.9505,1,1.089])
    f = np.where(xyz>0.008856, np.cbrt(xyz), 7.787*xyz+16/116)
    L = 116*f[...,1]-16; a = 500*(f[...,0]-f[...,1]); b = 200*(f[...,1]-f[...,2]); return L, np.hypot(a,b)
def main(fn):
    v = frames(fn, 135, 240, fps=2)
    Y = v@np.array([0.2126,0.7152,0.0722],np.float32)
    mx, mn = v.max(-1), v.min(-1); S = np.where(mx>0.15,(mx-mn)/np.maximum(mx,1e-6),np.nan)
    L, C = lab_c(v); lit = np.where((L>40)&(L<85), C, np.nan)
    yy, xx = np.mgrid[0:240,0:135]; r = np.hypot((xx-67)/67,(yy-120)/120)/np.sqrt(2)
    vig = np.median([Y[i][r>=0.9*r.max()].mean()/Y[i][r<0.3*r.max()].mean() for i in range(len(Y))])
    g = frames(fn, 90, 160, fmt="gray")[...,0]
    # global motion per frame via phase correlation of consecutive frames (px at 720p)
    sp = []
    for i in range(1,len(g)):
        A, B = np.fft.fft2(g[i-1]-g[i-1].mean()), np.fft.fft2(g[i]-g[i].mean()); R = A*np.conj(B); R /= np.abs(R)+1e-9
        c = np.fft.ifft2(R).real; p = np.unravel_index(c.argmax(), c.shape); dy, dx = [(q+n//2)%n-n//2 for q,n in zip(p,c.shape)]
        diff = np.abs(g[i]-g[i-1]).mean()
        sp.append(0 if diff < 0.004 else max(np.hypot(dx,dy)*8, diff*400))  # crude: shift, or content change as motion proxy
    sp = np.array(sp)
    got = {"luma p50": np.median(np.percentile(Y,50,axis=(1,2))), "luma p99 (near-white)": np.median(np.percentile(Y,99,axis=(1,2))),
      "luma p5 (lifted darks)": np.median(np.percentile(Y,5,axis=(1,2))), "HSV sat p50": np.median(np.nanmedian(S.reshape(len(S),-1),axis=1)),
      "lit chroma C* p50": np.nanmedian(lit), "vignette corner/centre": vig,
      "camera-still frames %": 100*(sp<0.3).mean(), "moving frames %": 100*(sp>=2).mean()}
    print(f"{'metric':26s} {'ref':>7s} {'ok range':>13s} {'ours':>7s}")
    for k,(ref,lo,hi) in REF.items():
        x = float(got[k]); print(f"{k:26s} {ref:7.3g} {f'{lo:g}-{hi:g}':>13s} {x:7.3g}  {'PASS' if lo<=x<=hi else 'FAIL'}")
main(sys.argv[1])
