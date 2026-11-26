#!/bin/bash
# usage: scripts/render-chunks.sh <Comp> <outdir> <total_frames> [chunk] [concurrency]
# renders [a, b] chunks to <outdir>/chunk_<a>.mp4, skipping chunks that already exist, then concatenates them
COMP=$1; OUT=$2; TOT=$3; CH=${4:-240}; CONC=${5:-1}  # >1 tabs under swangle produce tiled glitch frames
mkdir -p $OUT
for ((a=0; a<TOT; a+=CH)); do
  b=$((a+CH-1)); [ $b -ge $TOT ] && b=$((TOT-1))
  f=$OUT/chunk_$(printf %05d $a).mp4
  [ -s $f ] && continue
  for try in 1 2; do
    node scripts/render.mjs $COMP $f.tmp.mp4 1 "$a-$b" $CONC > $OUT/log_$a.txt 2>&1 && mv $f.tmp.mp4 $f && break
    echo "chunk $a failed (try $try)"
  done
  [ -s $f ] && echo "chunk $a-$b ok" || { echo "chunk $a-$b FAILED"; exit 1; }
done
ls $OUT/chunk_*.mp4 | sed "s#^#file '#;s#\$#'#" > $OUT/list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i $OUT/list.txt -c copy $OUT/video_silent.mp4 && echo "ALL DONE"
