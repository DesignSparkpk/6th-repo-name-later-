#!/bin/bash
# Collects the rendered parts of the Hubble short (render-out/hubble_*.mp4 from the render-hubble-p* branches, plus any
# local parts already in render-out/), joins them, checks frame count and broken frames, muxes the mix and writes
# shorts/hubble/hubble-final.mp4 (BT.709 limited range for YouTube/phones).   usage: studio/scripts/assemble-hubble.sh
set -e
cd "$(dirname "$0")/../.."
mkdir -p render-out
for p in 1 2 3 4 5 6; do
  git fetch -q origin render-hubble-p$p 2>/dev/null || { echo "part $p: branch not pushed yet"; continue; }
  f=$(git ls-tree --name-only -r FETCH_HEAD render-out/ | grep hubble_ | head -1)
  [ -n "$f" ] && [ ! -s "$f" ] && git show FETCH_HEAD:"$f" > "$f" && echo "part $p: $f"
done
ls render-out/hubble_[0-9]*-[0-9]*.mp4 | sort > render-out/hubble_parts.txt
cat render-out/hubble_parts.txt
# the parts must tile 0..1417 exactly
python3 - <<'PY'
import re
r = [tuple(map(int, re.findall(r"hubble_(\d+)-(\d+)", l)[0])) for l in open("render-out/hubble_parts.txt")]
r.sort(); e = 0
for a, b in r:
    assert a == e, f"gap or overlap at {e}: next part starts {a}"; e = b + 1
assert e == 1418, f"parts end at {e - 1}, expected 1417"
print("parts tile 0-1417")
PY
sed "s#^#file '$PWD/#;s#\$#'#" render-out/hubble_parts.txt > render-out/hubble_list.txt
ffmpeg -v error -y -f concat -safe 0 -i render-out/hubble_list.txt -map 0:v -c copy render-out/hubble_silent.mp4
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 render-out/hubble_silent.mp4 | tr -dc 0-9)
echo "frames $NF (expected 1418)"; [ "$NF" = 1418 ] || exit 1
# cuts, flashes and the cloud pass are allowed to differ from their neighbours
python3 studio/qa/glitch_scan.py render-out/hubble_silent.mp4 102,150,186,196,205,218,251,265,290,330,382,415,442,469,530,586,670,713,773,821,924,971,991,1054,1083,1104,1132,1157,1195,1229,1251,1259,1274,1346,1364,1399
ffmpeg -v error -y -i render-out/hubble_silent.mp4 -i shorts/hubble/audio/mix.wav -map 0:v -map 1:a \
  -vf "scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=pc:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart shorts/hubble/hubble-final.mp4
ffprobe -v error -show_entries format=duration,size -of csv=p=0 shorts/hubble/hubble-final.mp4
ffmpeg -v info -i shorts/hubble/hubble-final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo ASSEMBLED
