#!/usr/bin/env python3
"""Build 'The 114th Step' YouTube Short (1080x1920) from voiceover + 3 stills.

Usage: python3 build.py   (run from this folder; needs ffmpeg with libass)
"""
import json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")
TMP = os.path.join(HERE, "build")
os.makedirs(TMP, exist_ok=True)
FPS = 30
VOICE_END = 59.72
TOTAL = 60.6
W, H = 1080, 1920

def run(cmd):
    subprocess.run(cmd, check=True)

# ---------------------------------------------------------------- segments
# (start, end, image|None, crop centre x in 1280-wide source, zoom from, zoom to, extra filter)
FLICKER = "eq=eval=frame:brightness='if(lt(mod(t*9,1),0.25),0.18,-0.12)'"
GLIMPSE = "eq=eval=frame:brightness='if(lt(mod(t*6,1),0.35),-0.05,-0.6)':saturation=0.4"
SEGMENTS = [
    (0.00,  8.06, "lighthouse", 350, 1.00, 1.20, None),
    (8.06, 14.20, "lamproom",   430, 1.18, 1.00, None),
    (14.20, 16.24, "lamproom",  1030, 1.00, 1.12, None),
    (16.24, 18.56, "lighthouse", 1000, 1.10, 1.30, FLICKER),
    (18.56, 38.88, None, 0, 1, 1, None),              # pitch black: the counting
    (38.88, 40.42, "smile",     640, 1.25, 1.40, GLIMPSE),   # "in his voice" glimpse
    (40.42, 46.34, "lamproom",  430, 1.00, 1.35, None),
    (46.34, 50.76, "smile",     640, 1.00, 1.40, "colorbalance=rs=0.15:rm=0.08"),
    (50.76, 56.28, "lighthouse", 350, 1.25, 1.00, "eq=saturation=0.5"),
    (56.28, 59.25, None, 0, 1, 1, None),
    (59.25, TOTAL, "smile",     640, 1.45, 1.55, "eq=brightness=0.02:contrast=1.25,colorbalance=rs=0.2:rm=0.1"),  # loop-scare
]

parts = []
for i, (s, e, img, cx, z0, z1, extra) in enumerate(SEGMENTS):
    n = round((e - s) * FPS)
    out = os.path.join(TMP, f"seg{i:02d}.mp4")
    parts_cached = os.path.exists(out) and os.environ.get("REUSE") == "1"
    if parts_cached:
        parts.append(out); continue
    if img is None:
        cmd = ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
               f"color=c=black:s={W}x{H}:r={FPS}", "-frames:v", str(n)]
    else:
        cw = 405  # 9:16 slice of a 1280x720 still
        x0 = max(0, min(1280 - cw, cx - cw // 2))
        vf = (f"crop={cw}:720:{x0}:0,scale=2160:3840:flags=lanczos,"
              f"zoompan=z='{z0}+({z1}-{z0})*on/{n}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2'"
              f":d=1:s={W}x{H}:fps={FPS}")
        if extra:
            vf += "," + extra
        cmd = ["ffmpeg", "-y", "-v", "error", "-loop", "1", "-framerate", str(FPS),
               "-i", os.path.join(A, img + ".png"), "-vf", vf, "-frames:v", str(n)]
    cmd += ["-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", out]
    run(cmd)
    parts.append(out)
    print("segment", i, "done")

with open(os.path.join(TMP, "list.txt"), "w") as f:
    for p in parts:
        f.write(f"file '{p}'\n")
base = os.path.join(TMP, "base.mp4")
run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i",
     os.path.join(TMP, "list.txt"), "-c", "copy", base])

# ---------------------------------------------------------------- captions (ASS)
def ts(t):
    t = max(0, t)
    h = int(t // 3600); m = int(t % 3600 // 60); sec = t % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

words = json.load(open(os.path.join(A, "words.json")))
BIG = {  # spoken numbers in the dark section become giant centre-screen numbers
    21.58: ("111", "Big", 23.90), 23.98: ("112", "Big", 25.45), 25.50: ("113", "Big", 26.25),
    28.60: ("114", "BigRed", 30.55), 35.64: ("115", "BigRed", 37.15), 37.22: ("116", "BigRed", 38.85),
}
RED = {"114.", "113", "pitch", "black.", "voice.", "face.", "late.", "count", "them."}
YELLOW = {"113", "114.", "11", "power,", "someone", "smiled.", "burning,", "never", "down."}

ev = []
# group remaining words into short punchy chunks
chunk = []
def flush():
    if not chunk:
        return
    st = chunk[0][0]; en = chunk[-1][1] + 0.15
    txt = []
    for _, _, w in chunk:
        lw = w.lower()
        up = w.upper()
        if w in RED or lw in RED:
            txt.append(r"{\c&H2A2AE8&}" + up + r"{\c&HFFFFFF&}")
        elif w in YELLOW or lw in YELLOW:
            txt.append(r"{\c&H00D7FF&}" + up + r"{\c&HFFFFFF&}")
        else:
            txt.append(up)
    ev.append((st, en, "Cap", r"{\fscx80\fscy80\t(0,90,\fscx100\fscy100)}" + " ".join(txt)))
    chunk.clear()

for st, en, w in words:
    if any(abs(st - k) < 0.05 for k in BIG):
        flush(); continue
    if st >= 56.2:  # ending handled by the title card
        flush(); continue
    chunk.append((st, en, w))
    if len(chunk) >= 3 or w[-1] in ".,?!":
        flush()
flush()
# cap the end of each caption at the start of the next
ev.sort()
for i in range(len(ev) - 1):
    if ev[i][1] > ev[i + 1][0]:
        ev[i] = (ev[i][0], ev[i + 1][0], ev[i][2], ev[i][3])

for st, (txt, style, en) in BIG.items():
    anim = r"{\fscx140\fscy140\alpha&HFF&\t(0,120,\fscx100\fscy100\alpha&H00&)}"
    if txt == "114":
        anim = r"{\fscx60\fscy60\t(0,140,\fscx115\fscy115)\t(140,1800,\fscx125\fscy125)}"
    ev.append((st, en, style, anim + txt))

# hook label + ending card
ev.append((0.0, 4.5, "Tag", r"{\fad(200,300)}UNSEEN LORE"))
ev.append((56.28, 58.75, "End", r"{\fad(250,0)}NEXT TIME YOU CLIMB\NSTAIRS IN THE DARK..."))
ev.append((58.75, 59.25, "BigRed", r"{\fscx70\fscy70\t(0,120,\fscx100\fscy100)}COUNT\NTHEM."))

ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Anton,104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,1,0,1,7,4,2,70,70,560,1
Style: Big,Anton,420,&H00F0F0F0,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,6,0,5,40,40,0,1
Style: BigRed,Anton,420,&H002A2AE8,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,6,0,5,40,40,0,1
Style: End,Anton,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,5,0,5,60,60,0,1
Style: Tag,Anton,54,&H00D0D0D0,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,8,0,1,3,0,8,40,40,160,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
for st, en, style, txt in sorted(ev):
    ass += f"Dialogue: 0,{ts(st)},{ts(en)},{style},,0,0,0,,{txt}\n"
assf = os.path.join(TMP, "captions.ass")
open(assf, "w").write(ass)

# ---------------------------------------------------------------- sound design
D = TOTAL
inside = "between(t,18.56,40.42)"   # inside the dark tower: muffle the storm
storm_vol = f"if({inside},0.25,1)*if(gt(t,{VOICE_END}),max(0,1-(t-{VOICE_END})*1.2),1)"
def boom(T, amp=0.9):
    return f"if(between(t,{T},{T}+2.2),{amp}*sin(2*PI*(58-18*(t-{T}))*(t-{T}))*exp(-2.2*(t-{T})),0)"
thunder_env = "(if(between(t,0,3),exp(-1.6*t),0)+if(between(t,16.24,19),1.2*exp(-1.6*(t-16.24)),0))"
drone = "0.10*sin(2*PI*55*t)+0.07*sin(2*PI*82.41*t)*(0.6+0.4*sin(2*PI*0.15*t))+0.04*sin(2*PI*110.3*t)"
hits = "+".join([boom(28.6), boom(46.34, 0.8), boom(18.56, 0.5), boom(59.25, 1.0)])

final = os.path.join(HERE, "The_114th_Step_UnseenLore_Short.mp4")
fc = (
    f"[0:v]vignette=PI/4.2,noise=alls=5:allf=t,"
    f"ass={assf}:fontsdir={os.path.join(HERE, 'fonts')}[v];"
    f"anoisesrc=c=brown:r=48000:a=0.6:d={D},lowpass=f=700,highpass=f=40,"
    f"volume='0.55*{storm_vol}':eval=frame[storm];"
    f"anoisesrc=c=pink:r=48000:a=0.25:d={D},highpass=f=2500,lowpass=f=9000,"
    f"volume='0.25*{storm_vol}':eval=frame[rain];"
    f"anoisesrc=c=brown:r=48000:a=0.9:d={D},lowpass=f=260,"
    f"volume='1.6*{thunder_env}':eval=frame[thunder];"
    f"aevalsrc='{drone}':s=48000:d={D}[drone];"
    f"aevalsrc='{hits}':s=48000:d={D}[hits];"
    f"[storm][rain][thunder][drone][hits]amix=inputs=5:normalize=0,volume=0.55[bed];"
    f"[1:a]aresample=48000,highpass=f=70,acompressor=threshold=-18dB:ratio=3:makeup=2,"
    f"apad=whole_dur={D}[vo];"
    f"[vo]asplit=2[vo1][vo2];"
    f"[bed][vo1]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300[duck];"
    f"[duck][vo2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,atrim=0:{D}[a]"
)
run(["ffmpeg", "-y", "-v", "error", "-i", base, "-i", os.path.join(A, "voice.mp3"),
     "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
     "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "6M", "-bufsize", "12M", "-pix_fmt", "yuv420p",
     "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
     "-t", str(D), final])
print("DONE ->", final)
