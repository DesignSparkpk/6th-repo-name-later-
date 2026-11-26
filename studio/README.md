# Cartoon studio (Remotion + three.js)

Runs the `cartoon-3d-short` skill (`SKILL.md`, from github.com/mromidev/claude-animated-shorts, MIT, see `LICENSE-template-MIT`).

- `src/videos/bridge/` the skill's template (the bridge short), used as the starting point for every new short
- `public/bridge/kenney/` Kenney Nature Kit + Fantasy Town Kit models (CC0, from OpenGameArt)
- `scripts/stills.mjs` test stills: `REMOTION_TMP=/tmp/remotion-tmp node scripts/stills.mjs out/x_ 60,400 0.5` (`COMP=`, `INPUT_PROPS=` optional)
- `scripts/render.mjs` full render: `node scripts/render.mjs <Comp> out/video.mp4 <scale> [from-to] [concurrency]`

Setup: `npm install --legacy-peer-deps` (needs React 18 + @react-three/fiber 8 + @react-three/postprocessing 2; with React 19 / R3F 9 the EffectComposer renders an empty frame).
Speed in this cloud container (4 CPUs, software WebGL): about 6.6 s per 1080p frame, so a 60 s short takes about 3 h at 1080p and 5-6 h at 2K.
