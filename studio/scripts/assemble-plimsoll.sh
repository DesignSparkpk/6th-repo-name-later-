#!/bin/bash
# Collects the rendered parts (local render-out/ + the render-plimsoll-p* branches), joins them, checks frame count and
# broken frames, muxes the mix and writes shorts/plimsoll/plimsoll-final.mp4.   usage: studio/scripts/assemble-plimsoll.sh
set -e
cd "$(dirname "$0")/../.."
mkdir -p render-out
for p in 2 3 4 5 6; do
  git fetch -q origin render-plimsoll-p$p 2>/dev/null || { echo "part $p: branch not pushed yet"; continue; }
  f=$(git ls-tree --name-only -r FETCH_HEAD render-out/ | head -1)
  [ -n "$f" ] && [ ! -s "$f" ] && git show FETCH_HEAD:"$f" > "$f" && echo "part $p: $f"
done
ls render-out/plimsoll_[0-9]*-[0-9]*.mp4
ls render-out/plimsoll_[0-9]*-[0-9]*.mp4 | sort | sed "s#^#file '$PWD/#;s#\$#'#" > render-out/list.txt
[ $(wc -l < render-out/list.txt) -eq 6 ] || { echo "only $(wc -l < render-out/list.txt) of 6 parts"; exit 1; }
ffmpeg -v error -y -f concat -safe 0 -i render-out/list.txt -map 0:v -c copy render-out/plimsoll_silent.mp4
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 render-out/plimsoll_silent.mp4 | tr -dc 0-9)
echo "frames $NF (expected 1857)"; [ "$NF" = 1857 ] || exit 1
# flashes and cuts are allowed to differ from their neighbours
python3 studio/qa/glitch_scan.py render-out/plimsoll_silent.mp4 123,151,158,421,431,442,458,475,488,503,511,723,728,733,872,1376,1384,1410,1426,1565,1570,1575,1614,1619,1687
# the parts are full-range BT.601 (Remotion's jpeg frames): re-encode once to standard limited-range BT.709 for YouTube/phones
ffmpeg -v error -y -i render-out/plimsoll_silent.mp4 -i shorts/plimsoll/audio/mix.wav -map 0:v -map 1:a \
  -vf "scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=pc:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart shorts/plimsoll/plimsoll-final.mp4
ffprobe -v error -show_entries format=duration,size -of csv=p=0 shorts/plimsoll/plimsoll-final.mp4
ffmpeg -v info -i shorts/plimsoll/plimsoll-final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo ASSEMBLED
