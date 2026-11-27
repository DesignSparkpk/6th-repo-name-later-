#!/bin/bash
# usage (from anywhere): [COMP=Hubble] studio/scripts/cloud-render-part.sh <first> <last> [subchunk]
# Renders frames of composition $COMP (default Plimsoll) [first, last] at 1080x1920 in resumable sub-chunks with ONE swangle tab (more tabs give tiled
# glitch frames), joins them into render-out/plimsoll_<first>-<last>.mp4 (video only) and checks the frame count.
set -e
A=$1; B=$2; CH=${3:-105}; COMP=${COMP:-Plimsoll}; PFX=$(echo "$COMP" | tr A-Z a-z)
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT/studio"
[ -d node_modules/@remotion/renderer ] || npm install --legacy-peer-deps --no-audit --no-fund
NAME=${PFX}_$(printf %04d $A)-$(printf %04d $B)
OUT="$ROOT/render-out"; WORK="$ROOT/render-work/$NAME"; mkdir -p "$OUT" "$WORK"
for ((a=A; a<=B; a+=CH)); do
  b=$((a+CH-1)); [ $b -gt $B ] && b=$B
  f="$WORK/c_$(printf %05d $a).mp4"
  [ -s "$f" ] && continue
  for try in 1 2 3; do
    REMOTION_TMP="$WORK/tmp" node scripts/render.mjs "$COMP" "$f.tmp.mp4" 1 "$a-$b" 1 > "$WORK/log_$a.txt" 2>&1 && mv "$f.tmp.mp4" "$f" && break
    echo "sub-chunk $a-$b failed (try $try)"; tail -5 "$WORK/log_$a.txt"
  done
  rm -rf "$WORK/tmp"
  [ -s "$f" ] || { echo "FAILED at $a-$b"; exit 1; }
  echo "ok $a-$b $(date +%T)"
done
ls "$WORK"/c_*.mp4 | sed "s#^#file '#;s#\$#'#" > "$WORK/list.txt"
ffmpeg -loglevel error -y -f concat -safe 0 -i "$WORK/list.txt" -map 0:v -c copy "$OUT/$NAME.mp4"
N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$OUT/$NAME.mp4" | tr -dc 0-9)
echo "frames $N expected $((B-A+1))"
[ "$N" = "$((B-A+1))" ] && echo "PART DONE render-out/$NAME.mp4" || { echo "FRAME COUNT MISMATCH"; exit 1; }
