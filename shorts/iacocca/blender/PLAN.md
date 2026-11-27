# Iacocca short: Blender build plan (style approved 2026-11-27)

The owner approved the boardroom stills (gen/board_wide.png, gen/board_close.png) as the target look.

**Voice:** the narrator is am_fenrir (approved). The boss's quote voice is am_eric for now.
1. Regenerate the voice:
   ```
   /opt/kokoro/venv/bin/python voice/make_voice.py am_fenrir
   python3 voice/align.py
   ```
2. Install Pillow into Blender's Python once:
   ```
   /opt/blender/blender-4.2.3-linux-x64/4.2/python/bin/python3.11 -m pip install pillow
   ```
3. Fetch the CC0 assets:
   ```
   python3 shorts/iacocca/blender/fetch.py
   ```

## Pipeline
| File | What it does |
|---|---|
| lib.py | materials, the stick-figure cast (`person()`, `face_png`, `outfit_png`, `toon_mat`, inverted-hull `outline`), modelling helpers |
| sets.py | `build_boardroom()`; add `build_plaza` / `build_factory` / `build_showroom` / `build_office` / `build_congress` / `build_bank` the same way |
| shot_board.py | a still per camera; turn it into the per-scene animation script (keyframe the cameras and the limb points per frame) |

## Fixes before animating
- The hair edge and the hand spheres look low-poly: raise the segment counts (hands 32 x 16) and make the wavy hairline finer.
- Desk papers are still too bright.
- Speed: one HD frame takes 6.5 min (Cycles, 64 spp, volume haze). Target about 1 min:
  - drop the volume haze and use a mist pass in the compositor instead;
  - 16-24 spp with OIDN, adaptive sampling on;
  - Persistent Data on;
  - consider 720x1280 upscaled to 1080x1920.

## Shots (script v5, about 37 s, 30 fps)
The visual beats are listed in SCRIPT.md. Every scene follows the boardroom's quality bar:
- real CC0 props;
- an HDRI outside;
- practical lights.

Render in parts across 6 cloud sessions (studio/scripts/cloud-render-part.sh pattern), then assemble with the music and SFX mix at -14 LUFS.
