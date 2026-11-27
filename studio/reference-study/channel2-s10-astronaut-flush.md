# Channel 2, short #10 (latest): "Why Astronauts Can't Flush in Space", frame-by-frame study
769K views. 720x1280, 30 fps, 1837 frames, 61.2 s. Studied at 6 fps contact sheets (every 5th frame, 368 thumbs),
per-frame measurements, a word-timed transcript (faster-whisper) and full-res frames. Private study only: no frames are stored.

## 1. Script structure (word timings)
| t (s) | Beat | Line |
|---|---|---|
| 0.0-3.6 | **HOOK: paradox with stakes** | "If you flush the toilet on a spaceship, you'll never make it back to Earth." |
| 3.9-7.8 | Setup ("You see,") | Mission Control tells astronauts exactly when they're allowed to flush. |
| 8.0-13.4 | Character + conflict | The new guy rolls his eyes. *"It's a toilet! What's it gonna do?"* (in-character line) |
| 13.6-17.1 | Rule broken | That night... he floats to the back and flushes. |
| 17.5-25.1 | **Mystery / rehook 1** | Hundreds of new stars glittering beside the ship. "Stars that aren't on any map." |
| 25.4-28.6 | Escalation + dialogue | Radio crackles: *"You're drifting off course! Who flushed?"* |
| 28.9-32.7 | Stakes climb | Every hour, another few thousand miles from home. |
| 32.9-35.0 | **Question / rehook 2** | "But how do you get lost from one flush?" |
| 35.4-51.8 | Explanation (real science) | No pipes, a hose vents to space, so every flush is a tiny rocket. The spray boils and freezes into ice crystals that glitter like stars. |
| 51.9-60.8 | **Twist payoff** (ties back to the hook) | Astronauts can't tell fake stars from real, and there is no GPS, so the only way home is lining up the real stars. |

- The voice starts at frame 0 and ends at 60.8 s, so the video ends on the last word. Speed is 3.36 words/s, 204 words.
- There are only 13 pauses over 0.25 s, the longest 0.56 s, for a total of about 4.5 s of air.
- Structure: a paradox hook, then a **story with a named everyman** (the new guy) that breaks the rule, then a visible
  consequence (fake stars), then 2 rehook questions, then the science, then a payoff that loops back to the hook's claim.
- The comedy comes from character attitude (an eye-roll, "What's it gonna do?"), not jokes.

## 2. Picture
- **Sets** (each rebuilt in full detail): ship bathroom with a checker floor, a hatch view, an exterior ship over Earth,
  Mission Control with a world-map screen, timers and consoles, the crew lounge (hanging bags, a HEAD sign, a monitor),
  sleeping bags at night, the cockpit glass, the radio console, the vent pipe interior, the hull exterior, a GPS phone close-up, and a sextant/scope view.
  **Every frame is packed with props.**
- **Diegetic text inside the 3D world** carries story beats: the 3-2-1 / GO / NO GO countdown on the big screen,
  "NO FLUSHING TONIGHT", "OFF COURSE", "WASTE VENT", the ship name "LODESTAR", the "HEAD" sign, and a "No GPS Signal" phone.
  These are screens and signs in the scene, not captions.
- **Characters:** white round heads. Role costumes: the captain has a navy cap with a star badge, a red polo and a ketchup bottle.
  The new guy has a yellow tee with a "NEW GUY" badge and holds a drink pouch. The navigator has a brown bun hat, a pencil in her mouth and a clipboard.
  Mission Control wears a white shirt and headset. Long thin ink legs, small round ink hands, a deadpan face as default.
  In zero-g they float with dangling legs, and their hard cast shadows fall on the floor.
- **Expressions change on the word:** rolls eyes on "rolls", shock eyes on "stars", a yelling mouth on "off course".
- **Lighting moods by place:** a bright white bathroom, cool blue Mission Control, a warm grey lounge, a deep blue night,
  black space with a sun glow and bloom, red NO-GO and OFF COURSE screens, and a gold scope.
- **Colour (measured):** a space story, so it is dark: luma p50 0.16, crushed blacks (p5 0.007), sat p50 0.36,
  strong vignette 0.50. The mood decides the grade, so night and space shorts are far darker than daytime ones.
- **Loudness:** -14.0 LUFS integrated, LRA 0.8 LU (very compressed, steady).

## 3. Camera and editing
- Moving almost all the time: only 2 % of frames are still, and the median frame change is 4.8 grey levels.
- **Only about 8 hard cuts in 61 s.** Every other place change is a *motivated transition*:
  - 1.2 s: the camera pulls back out through the bathroom **hatch**, then the exterior ship over Earth (a fly-out through an opening).
  - 4-5 s: the ship flies off and becomes a **dot on Mission Control's screen**, then the camera pulls back into the room (screen match-cut).
  - 9-10 s: the NO FLUSHING screen in Control becomes the **monitor inside the ship lounge** (screen-to-screen transfer).
  - 13.8 s: a dissolve into the night, then a **crossfade** into the bathroom on "flushes".
  - 23-25 s: the glittering stars resolve into a **star map** taped to the glass.
  - 32-34 s: the exterior ship **push-in through the window** into the bathroom.
  - 37-40 s: a **follow-the-object** move down the vent hose, the pipe, out of the nozzle, into space (whip-fast at 39.5-40 s; motion peak of 30 grey levels/frame).
  - 46-50 s: the droplet then **follows the spray** as it boils, becomes a snowflake, and turns into ice crystals that glitter with the sun.
- Motion bursts land on key words ("spaceship" 1.2 s, "Earth" 4 s, "flushes" 9-10 s, "pipes/hose" 37-40 s).
- Slow push-ins and tilts during dialogue holds, and a low eye-level camera on characters.

## 4. Lessons for our pipeline
1. **Transitions must travel:** through a hatch or window, screen-to-screen, follow the object. Max ~8 hard cuts per minute.
2. **Diegetic signs and screens** for key beats (allowed: it is not a caption). Example for Death Ray: a hotel sign, a "DEATH RAY" staff joke sign, a news van screen.
3. **Story with a named everyman** who breaks or ignores the rule, plus 1-2 in-character lines.
4. **Two rehook questions** (a mystery at about 40 % and "But how...?" at about 55 %), then a payoff that **loops back to the hook**.
5. **Mood per place** (bright interior, cool blue, night, black space). Grade targets depend on mood, not on one global number.
6. **Props in every hand:** drink, pencil, clipboard, ketchup. Badges on clothing name the role.
7. 3.3-3.7 words/s, almost no pauses, -14 LUFS with LRA under 1.
