// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export type LightName = "day" | "golden" | "overcast" | "desert" | "candle" | "dusk" | "under" | "fog" | "storm" | "night" | "dawn" | "club";
export const LIGHTS: Record<LightName, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
  // Las Vegas noon: high hot sun, deeper sky, warm bounce
  desert: {
    az: 70, el: 58,
    lit: [1.66, 1.52, 1.28], shade: [0.3, 0.28, 0.38], lift: [0.06, 0.06, 0.12], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.95, 0.9], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.93, 0.9, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#2f72d6", hor: "#cfe0f2", skyCurve: [0.0, 0.5, 0.6], fog: "#d6e2ee", fogNear: 40, fogFar: 520, sunDisc: "#000000",
    sunCol: "#fff1d8", sunI: 3.0, sky: "#dcecff", ground: "#c9a57e", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  // London rain: no sun, flat grey light, short fog
  overcast: {
    az: 60, el: 60,
    lit: [0.82, 0.86, 0.95], shade: [0.5, 0.53, 0.62], lift: [0.06, 0.07, 0.1], lambert: 0.25, sideK: 0.9, term: 0.3,
    charTint: [0.78, 0.82, 0.9], charShade: 0.92, charGrad: 0.05, bodyGrad: 0.12, sideTint: [0.92, 0.93, 0.98],
    blob: [0.7, 0.72, 0.8], actorShadow: false,
    top: "#6b7482", hor: "#9aa2ad", skyCurve: [0.0, 0.5, 0.6], fog: "#8f97a2", fogNear: 6, fogFar: 90, sunDisc: "#000000",
    sunCol: "#dfe6f0", sunI: 0.5, sky: "#c8d0dc", ground: "#6a6a72", hemiI: 1.1,
    bias: -0.00025, normalBias: 0.015,
  },
  // House of Commons by candle and chandelier: warm amber key from above, deep violet-brown shade
  candle: {
    az: 40, el: 55,
    lit: [1.62, 1.12, 0.62], shade: [0.2, 0.13, 0.22], lift: [0.05, 0.03, 0.07], lambert: 0.4, sideK: 0.8, term: 0.12,
    charTint: [1.0, 0.88, 0.7], charShade: 0.84, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.9, 0.82, 0.88],
    blob: [0.55, 0.45, 0.45], actorShadow: true,
    top: "#3a2c4a", hor: "#ffb070", skyCurve: [0.0, 0.5, 0.6], fog: "#3e2618", fogNear: 12, fogFar: 70, sunDisc: "#000000",
    sunCol: "#ffc98a", sunI: 3.0, sky: "#ffd9a8", ground: "#4a3020", hemiI: 0.6,
    bias: -0.0004, normalBias: 0.02,
  },
  // the Thames at dusk: sun low in the west behind the far bank, violet shadows, warm haze
  dusk: {
    az: 8, el: 5,
    lit: [1.5, 0.74, 0.4], shade: [0.15, 0.14, 0.32], lift: [0.05, 0.05, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.76, 0.6], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.8, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#3e3d6e", hor: "#ffb070", skyCurve: [0.05, 0.6, 1.0], fog: "#b88a8c", fogNear: 40, fogFar: 340, sunDisc: "#ffcf9e",
    sunCol: "#ff9a55", sunI: 4.6, sky: "#c8a0b8", ground: "#5a4a60", hemiI: 0.55,
    bias: -0.0006, normalBias: 0.03,
  },
  // under the river: green light from above, short green fog
  under: {
    az: 0, el: 80,
    lit: [0.62, 1.18, 1.02], shade: [0.07, 0.2, 0.21], lift: [0.02, 0.07, 0.07], lambert: 0.35, sideK: 0.85, term: 0.15,
    charTint: [0.62, 0.95, 0.9], charShade: 0.86, charGrad: 0.08, bodyGrad: 0.2, sideTint: [0.8, 0.95, 0.95],
    blob: [0.5, 0.62, 0.6], actorShadow: false,
    top: "#7fc4a0", hor: "#1d4f4a", skyCurve: [0.0, 0.5, 0.6], fog: "#1f5a52", fogNear: 2, fogFar: 30, sunDisc: "#000000",
    sunCol: "#bdf5d8", sunI: 2.0, sky: "#9fe0c8", ground: "#1a3a35", hemiI: 0.8,
    bias: -0.0004, normalBias: 0.02,
  },
  // the dock on a cold grey morning: soft flat light, thick fog swallowing the far end
  fog: {
    az: 60, el: 50,
    lit: [1.08, 1.1, 1.14], shade: [0.42, 0.45, 0.56], lift: [0.06, 0.07, 0.1], lambert: 0.3, sideK: 0.88, term: 0.25,
    charTint: [0.94, 0.96, 1.0], charShade: 0.9, charGrad: 0.06, bodyGrad: 0.16, sideTint: [0.9, 0.92, 0.98],
    blob: [0.66, 0.68, 0.75], actorShadow: false,
    top: "#8a9bad", hor: "#b6c0ca", skyCurve: [0.0, 0.5, 0.6], fog: "#a9b3bd", fogNear: 2.5, fogFar: 46, sunDisc: "#000000",
    sunCol: "#e6eef8", sunI: 1.7, sky: "#d7e2ee", ground: "#6a6a6a", hemiI: 0.95,
    bias: -0.0003, normalBias: 0.02,
  },
  // the storm at sea, night: blue-black, everything lit by the moonless sky and the lightning
  storm: {
    az: 40, el: 60,
    lit: [0.55, 0.66, 1.0], shade: [0.07, 0.09, 0.2], lift: [0.03, 0.04, 0.1], lambert: 0.3, sideK: 0.85, term: 0.15,
    charTint: [0.62, 0.72, 1.0], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.2, sideTint: [0.8, 0.85, 1.0],
    blob: [0.5, 0.55, 0.7], actorShadow: false,
    top: "#0b1226", hor: "#22304e", skyCurve: [0.0, 0.5, 0.6], fog: "#1b2440", fogNear: 12, fogFar: 130, sunDisc: "#000000",
    sunCol: "#9fb6ff", sunI: 1.5, sky: "#3a4a7a", ground: "#0e1426", hemiI: 0.75,
    bias: -0.0003, normalBias: 0.02,
  },
  // the dock at night in the rain: cold blue with the gas lamps glowing warm
  night: {
    az: 50, el: 55,
    lit: [0.62, 0.68, 1.0], shade: [0.1, 0.11, 0.24], lift: [0.04, 0.04, 0.11], lambert: 0.3, sideK: 0.86, term: 0.18,
    charTint: [0.72, 0.78, 1.0], charShade: 0.88, charGrad: 0.09, bodyGrad: 0.22, sideTint: [0.85, 0.88, 1.0],
    blob: [0.5, 0.55, 0.7], actorShadow: false,
    top: "#0d1428", hor: "#26304a", skyCurve: [0.0, 0.5, 0.6], fog: "#222a40", fogNear: 6, fogFar: 62, sunDisc: "#000000",
    sunCol: "#a8bcff", sunI: 1.4, sky: "#3c4a78", ground: "#141a2c", hemiI: 0.8,
    bias: -0.0003, normalBias: 0.02,
  },

  // pink-gold dawn after the storm: low warm sun from the east, lavender shade, rosy haze
  dawn: {
    az: 70, el: 12,
    lit: [1.6, 1.0, 0.82], shade: [0.24, 0.19, 0.38], lift: [0.05, 0.04, 0.11], lambert: 0.35, sideK: 0.82, term: 0.1,
    charTint: [1.0, 0.86, 0.8], charShade: 0.86, charGrad: 0.1, bodyGrad: 0.24, sideTint: [0.88, 0.82, 0.95],
    blob: [0.7, 0.62, 0.8], actorShadow: true,
    top: "#7e86b8", hor: "#ffd1a0", skyCurve: [0.05, 0.6, 1.0], fog: "#e6b2aa", fogNear: 12, fogFar: 150, sunDisc: "#ffd9b0",
    sunCol: "#ffc79a", sunI: 3.4, sky: "#ffd8c8", ground: "#6a5060", hemiI: 0.7,
    bias: -0.0005, normalBias: 0.025,
  },

  // the shipowners' club: firelight and gas lamps, red shade, a haze of cigar smoke
  club: {
    az: 60, el: 25,
    lit: [1.6, 0.98, 0.6], shade: [0.24, 0.1, 0.13], lift: [0.06, 0.03, 0.04], lambert: 0.4, sideK: 0.8, term: 0.12,
    charTint: [1.0, 0.84, 0.7], charShade: 0.84, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.92, 0.8, 0.82],
    blob: [0.55, 0.42, 0.42], actorShadow: true,
    top: "#2a1410", hor: "#5a2a1c", skyCurve: [0.0, 0.5, 0.6], fog: "#3a1c14", fogNear: 6, fogFar: 42, sunDisc: "#000000",
    sunCol: "#ffb070", sunI: 3.2, sky: "#ffcf9a", ground: "#3a1a12", hemiI: 0.55,
    bias: -0.0004, normalBias: 0.02,
  },

};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LightName, WorldLook> = {
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
  desert: {
    sky: { c: ["#cfe0f2", "#a9c9ee", "#6ea3e6", "#4b88dd", "#2f6fd0"], e: [0, 3, 8, 16, 40] },
    water: { near: "#2fc6d6", mid: "#19a5cf", far: "#1480c0", crest: "#b8f4fb", trough: "#0f6fa8", glint: "#ffffff", shade: [0.55, 0.6, 0.75] },
    cloud: { lit: "#fbf8f1", mid: "#e8ebf5", shade: "#c8d0ea" },
    bounce: [0.02, 0.01, 0],
    sat: 1.12,
  },
  overcast: {
    sky: { c: ["#9aa2ad", "#8c95a2", "#7c8694", "#6f7988", "#636d7c"], e: [0, 4, 10, 20, 40] },
    water: { near: "#5d6b7a", mid: "#56626f", far: "#7b8592", crest: "#a9b3bf", trough: "#3f4a57", glint: "#d7dde4", shade: [0.7, 0.72, 0.8] },
    cloud: { lit: "#b9bec7", mid: "#a2a8b2", shade: "#8a919c" },
    bounce: [0, 0, 0],
    sat: 0.85,
  },
  candle: { // seen only through the hook window: the sunset outside
    sky: { c: ["#ffb070", "#f08a6a", "#c06a7e", "#7a5a8c", "#3e3d6e"], e: [0, 4, 10, 20, 40] },
    water: { near: "#2a3558", mid: "#3f4f80", far: "#c98a7a", crest: "#e8a98a", trough: "#1b2340", glint: "#ffd7a0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.05, 0.02, 0.0],
    sat: 1.12,
  },
  dusk: {
    sky: { c: ["#ffb070", "#f08a6a", "#c06a7e", "#7a5a8c", "#3e3d6e"], e: [0, 4, 10, 20, 40] },
    water: { near: "#2a3558", mid: "#3f4f80", far: "#c98a7a", crest: "#e8a98a", trough: "#1b2340", glint: "#ffd7a0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffc89a", mid: "#e98f86", shade: "#8f78b0" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.12,
  },
  under: { // looking up from the riverbed: dark teal at the horizon, bright green toward the surface
    sky: { c: ["#123f3c", "#1d554e", "#2f6f62", "#4f9a80", "#86cfa8"], e: [0, 6, 14, 28, 60] },
    water: { near: "#1f5a52", mid: "#1f5a52", far: "#1f5a52", crest: "#6fc0a0", trough: "#123f3c", glint: "#d8ffe8", shade: [0.6, 0.8, 0.8] },
    cloud: { lit: "#9fe0c8", mid: "#6fc0a0", shade: "#3f8a76" },
    bounce: [0.0, 0.03, 0.03],
    sat: 1.05,
  },
  fog: {
    sky: { c: ["#b6c0ca", "#aab6c2", "#9eacba", "#93a3b3", "#8a9bad"], e: [0, 4, 10, 20, 40] },
    water: { near: "#4f6d6a", mid: "#4f6d6a", far: "#7f9496", crest: "#c8d6d2", trough: "#334a48", glint: "#e6f0ee", shade: [0.6, 0.65, 0.72] },
    cloud: { lit: "#c9d2dc", mid: "#b3bec9", shade: "#9aa6b3" },
    bounce: [0, 0, 0],
    sat: 1.0,
  },
  storm: {
    sky: { c: ["#2a3a5e", "#22304e", "#1b2846", "#151f3a", "#0b1226"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1d3346", mid: "#1d3346", far: "#2a3a5e", crest: "#d8e6ee", trough: "#0e1a26", glint: "#c8d8ff", shade: [0.5, 0.55, 0.75] },
    cloud: { lit: "#4a5a80", mid: "#34426a", shade: "#1e2848" },
    bounce: [0, 0, 0.02],
    sat: 1.05,
  },
  night: {
    sky: { c: ["#26304a", "#1f2840", "#182036", "#121a2e", "#0d1428"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1f2a3a", mid: "#1f2a3a", far: "#26304a", crest: "#9fb0c8", trough: "#121a26", glint: "#ffd7a0", shade: [0.5, 0.55, 0.75] },
    cloud: { lit: "#3e4a6a", mid: "#2e3858", shade: "#1e2640" },
    bounce: [0.02, 0.01, 0.0],
    sat: 1.05,
  },
  dawn: {
    sky: { c: ["#ffd1a0", "#f7b09a", "#e391a0", "#b98aac", "#7e86b8"], e: [0, 4, 10, 20, 40] },
    water: { near: "#5a6f8a", mid: "#7a86a8", far: "#e8a8a0", crest: "#ffd8c0", trough: "#3a4a68", glint: "#ffe6c8", shade: [0.5, 0.5, 0.75] },
    cloud: { lit: "#ffd8c0", mid: "#f3a7a4", shade: "#a58fc0" },
    bounce: [0.04, 0.02, 0.02],
    sat: 1.12,
  },
  club: {
    sky: { c: ["#5a2a1c", "#4a2218", "#3a1a12", "#2a1410", "#1e0e0a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#3a1c14", mid: "#3a1c14", far: "#3a1c14", crest: "#a8763a", trough: "#2a1410", glint: "#ffd7a0", shade: [0.5, 0.4, 0.4] },
    cloud: { lit: "#5a2a1c", mid: "#4a2218", shade: "#3a1a12" },
    bounce: [0.06, 0.02, 0.0],
    sat: 1.12,
  },
};
