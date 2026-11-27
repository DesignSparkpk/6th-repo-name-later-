# Channel 2: "How One Cart Stopped an Entire Army" (10M) and "Why Perfect Railroads Don't Work" (31M), studied at 30 fps
Method: `qa/analyze_ref.py` measures every frame (camera shift, zoom, change, luma, saturation, cut flag), gives a word-timed
transcript (faster-whisper) and 30 fps contact sheets (2 s = 60 frames). Hooks were studied frame by frame, the rest from
1 fps overviews plus the per-second numbers. Private study: no frames are stored in the repo.

## 1. Numbers side by side
| | Cart (10M) | Railroad (31M) | Astronaut (769K) |
|---|---|---|---|
| Length / words / speed | 66.9 s / 235 / 3.53 w/s | 65.2 s / 218 / 3.36 w/s | 61.2 s / 204 / 3.36 w/s |
| First word / ends on last word | 0.0 s / yes | 0.0 s / yes | 0.0 s / yes |
| Pauses > 0.25 s | 10, max 0.42 s | 11, max 0.32 s | 13, max 0.56 s |
| Loudness / LRA | -14.1 LUFS / 2.9 LU | -14.1 / 3.2 | -14.0 / 0.8 |
| Real hard cuts | **2** (2.1 s is a whip pan; one at 26 s) | **2-3** (3.8 s, 10 s, plus the explosion flash at the end) | ~8 |
| Camera speed @720p median / p90 | 4.0 / 29.6 px/f | 5.7 / 38.0 px/f | — |
| Still frames (< 0.3 px/f) | 43 % (holds on dialogue) | 37 % | 2 % |
| Luma median / sat median | 0.41 / 0.41 | 0.45 / 0.49 | 0.16 / 0.36 |
| Light moods | day, then dusk wall, then rain night blue (29-36 s), then dawn sunrise, then bright day | canyon red, blue sky, station interior, sunset magenta rails, explosion | 7 moods |

## 2. HOOK frame by frame (the first 4 s)
**Cart, 0-4 s, one continuous camera journey with no cut:**
- f0-30: medium shot. The hero drills a block (hands move every frame), in deadpan profile, stone wall and banner behind, real-looking grass.
- f30-45: **the camera whips right past his face onto the drill bit** (fast, then decelerating). The caption word is "holes".
- f45-60: close-up of the drill and block: holes pop out with chips, 2-3 frames per hole.
- f60-80: **fast crane up and left along the fort wall**, over the pagoda roof, revealing the valley.
- f80-100: push down the valley. f100-120: the **threat appears** (an army marching under a parasol) on "an army".
- So the hook shows **an action, then its detail, then the threat**, inside 4 s, without a single cut.

**Railroad, 0-4 s:**
- f0-55: the hero saws a rail. **Sparks fly on "gaps"** (f15-25), and a **train headlight is already in the background** (danger inside the first frame).
  A squint and smirk carry the expression.
- f55-80: an orbit move plus a **light change** (the canyon wall lights up orange as the camera swings), revealing a deep red canyon.
- f80-110: the camera rises. **A locomotive passes in the foreground and wipes the frame** (f96-111). This is a natural object-wipe transition
  into the canyon vista (f111+) on "two companies".

## 3. Story structure (both follow the same formula as the astronaut short)
| Beat | Cart | Railroad |
|---|---|---|
| Hook (an odd action plus a number) | "He drilled **82** holes into the wood, because an army is marching..." | "He sawed gaps into a railroad every **39** feet." |
| Mockery (in-character line) | "Are we fighting them or grating cheese?" | Boss's face goes purple: "You're wrecking my railroad!" |
| Rehook | "But it gets weirder." (12.8 s) | "Then summer comes, and something weird happens." (36 s) |
| Escalation | rope nobody may touch, slapped hand, he lies on the cart in the rain | rivals finish first, "clickety-clack line" newspapers, the gaps shrink |
| Second mockery | "One drop gets in there, and we're all dead." | "See? Even your gaps know you were wrong." |
| Payoff | 82 rockets launch, and with the army packed tight "not a single one misses". | The perfect railroad "kicks sideways like a snake, right as a train rolls onto it." |
- **The hero is a misunderstood genius whom everyone mocks.** The payoff proves him right. The ending is a visual climax (explosion or derailment), and the video ends there.
- The numbers in the hook (82, 39) make it concrete. **The "You see," pivot** comes early (railroad at 3.4 s).

## 4. Visual grammar seen in these two
- **Real-looking 3D environments.** Dense instanced grass with blades, stone walls with real depth and bevels, volumetric clouds,
  a sun with light shafts, layered canyon rock, gravel ballast you could count. It looks like a game engine render with bought or scanned assets.
- **2D characters as cards** (white heads, ink limbs) composited in. They cast hard shadows on the ground.
- **Diegetic text** again: newspaper "THE CLICKETY CLACK LINE", "FIRST LINE IN GETS IT ALL!" banner, calendar "MAY / JULY".
- **The weather and time change carry the story:** rain at night on "That night, it pours", sunrise on "The next morning", summer heat haze.
- **Macro inserts of the mechanism:** the rail gap shrinks with a coin, then paper; the fuse splits into 82 flames; rockets from inside the cart.
  Each is shown in close-up with glowing colour coding (yellow/purple rails for heat).
- Crowds: dozens of soldiers in formation (instanced cards), each with a helmet or shield.
- Dialogue holds keep the camera still (37-43 % still frames), and the transitions are big fast moves (p90 30-38 px/f).

## 5. What it means for our tool chain
- The look depends on a **real-time game-engine-grade renderer plus a large asset library**. Their exact software is not visible in the frames.
  - Our three.js + Remotion stack can get much closer with **PBR textures (normal and roughness maps), HDRI skies and lighting,
    instanced grass and realistic models**. Those CC0 assets are now downloaded (`scripts/fetch_polyhaven.py`).
  - Blender 4.2 is installed at `/opt/blender`. On this CPU-only machine a trivial scene takes 30 s per 1080p frame (Cycles) or 64 s (EEVEE via software GL),
    so full videos in Blender are not practical here. Use it to build or convert assets (glTF) and for single stills.
- Script formula and hook rules are summarised in `QUALITY_BAR.md` (add: hook = odd action + number + visible threat in 4 s, one camera move, no cut).
