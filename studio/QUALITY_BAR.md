# Quality bar: every short must pass this before render

Source: the skill's private study of the reference channel (20 shorts, 32,337 frames). The full reports are in
`reference-study/`. Reference frames are never stored or published, and the channel is never named.
Automatic check: `python3 qa/measure.py <video.mp4>`. Run it on stills and test renders **before** the full 2.5 h render.

## A. Picture (measured targets)
| Metric | Reference | Death Ray v1 | |
|---|---|---|---|
| Lighting mix across the video | 44 % interior, 29 % day ext, 18 % night, 9 % golden | 100 % day exterior | FAIL |
| Luma p50 | 0.45 (0.40-0.58) | 0.58 | FAIL, too bright and washed |
| HSV saturation p50 | 0.47 (0.40-0.62) | 0.26 | FAIL, much too pale |
| Lit chroma C* p50 | 32 (28-40) | 20 | FAIL |
| Vignette corner/centre | 0.72 | 0.94 | FAIL, no vignette |
| Camera-still frames | 10 % (1-27) | 32 % | FAIL |
| Near-white p99 / lifted darks p5 | 0.94 / 0.14 | 0.94 / 0.21 | pass |

## B. Frame content (checked by eye on a 1-fps contact sheet)
1. **Every frame is full.** There are no shots of a plain wall, glass or sky. Each frame has a subject, a mid-ground with props and a detailed background.
   (Death Ray v1: about 15 of 62 s were plain glass facade.)
2. **The subject reads in 0.5 s.** A close-up only comes after a wide that shows where it is. (v1 hook: a mirror ECU that nobody can read as a car.)
3. **Living world.** There are 3-12 extra characters in public places (pool, street, crowd). They stand still unless they act on a beat. No looping idles.
4. **Mood changes with the story.** Each new place or beat changes the light: noon to sunset to night to interior lamp.
   Sunset shadows are violet-blue, and night has warm windows and lamps with glow.
5. **Painted detail.** Wood grain, mortar, tiles, rivets and worn edges, with thin dark painted lines of 3-5 px at 1080p. Surfaces have 2-4 flat colour fields, never one flat tone.
6. **Crisp 2D effects.** Smoke, sparks, speed lines, glows and stars are drawn as cartoon sprites, never blurry grey blobs.

## C. Motion (from `reference-study/motion.md`)
- The camera almost always moves. Holds push in at 0.14-0.35 %/frame, and emphasis pushes run at about 0.6 %/frame for about 35 frames.
- Moves are symmetric ease-in-out: about 10 frames in and 10 out, peaking at about 15 px/frame at 720p. Anything bigger than half a frame is a cut.
- 6 moves per 10 s. Roll moves run about 3.6° over 18 frames. Impact kicks flip sign every frame and last 6-7 frames.
- Whip pans (45-93 px/frame) need strong motion blur. Use 6-8 frame crossfades when the place changes.
- Characters are animated on ones. An acting beat lands 0-3 frames **before** its word. There is no squash and stretch.
- Walk: a step every 9-12 frames, body bob 3-7 % of height, lean 1-7°, planted feet with a contact shadow.
- Blinks every 0.5-2.3 s, 4 frames each (half, shut, shut, half), plus a blink on every expression swap.
- Body acting on every beat: lean, point, arms up, shrug, recoil. **Never a face-only change on a frozen body.**
  (v1: the pool guest's body stays frozen for 2 s and only the face changes.)

## D. Render pipeline
- `scripts/render-chunks.sh` must run with concurrency 1. Parallel swangle tabs produce tiled glitch frames.
- After render, scan for glitches (single frames that snap back), black frames, length and -14 LUFS.
