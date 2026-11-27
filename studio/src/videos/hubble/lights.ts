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
export type LightName = "bath" | "city" | "space" | "pad" | "control" | "tube" | "studio" | "senate" | "field" | "street" | "clean" | "nightpad" | "press";
const P = (o: Partial<LightPreset> & Pick<LightPreset, "lit" | "shade" | "lift" | "charTint" | "fog" | "fogNear" | "fogFar">): LightPreset => ({
  az: 50, el: 50, lambert: 0.35, sideK: 0.84, term: 0.16, charShade: 0.86, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.9, 0.9, 0.98],
  blob: [0.55, 0.55, 0.62], actorShadow: true, top: "#000000", hor: "#000000", skyCurve: [0, 0.5, 0.6], sunDisc: "#000000",
  sunCol: "#ffffff", sunI: 2.4, sky: "#cfd8e8", ground: "#4a4650", hemiI: 0.6, bias: -0.0003, normalBias: 0.02, ...o,
});
export const LIGHTS: Record<LightName, LightPreset> = {
  // hotel bathroom at night: warm vanity light from above, cool moonlight from the window, steam haze
  bath: P({ lit: [1.55, 1.38, 1.15], shade: [0.3, 0.34, 0.46], lift: [0.06, 0.07, 0.1], lambert: 0.35, term: 0.24, charTint: [1.0, 0.95, 0.9], fog: "#1b2036", fogNear: 60, fogFar: 1100 }),
  // Munich old town by night: moonlit blue, warm windows and lamps (emissive, they bloom)
  city: P({ lit: [0.62, 0.68, 1.02], shade: [0.1, 0.11, 0.22], lift: [0.03, 0.04, 0.1], charTint: [0.75, 0.8, 1.0], fog: "#1b2036", fogNear: 70, fogFar: 1100, actorShadow: false }),
  // orbit: one hard white sun, near-black shade lifted by blue earthshine, no air
  space: P({ lit: [1.75, 1.7, 1.62], shade: [0.035, 0.045, 0.085], lift: [0.03, 0.05, 0.11], lambert: 0.55, sideK: 0.7, term: 0.06, charTint: [1.0, 0.99, 0.97], charShade: 0.7,
    fog: "#000000", fogNear: 4000, fogFar: 6000, sunI: 3.2, actorShadow: true }),
  // Florida, 24 April 1990, 8:33 a.m.: low gold sun from the east, clean blue sky
  pad: P({ lit: [1.62, 1.3, 0.92], shade: [0.2, 0.21, 0.36], lift: [0.05, 0.06, 0.13], charTint: [1.0, 0.9, 0.78], fog: "#e9cfae", fogNear: 120, fogFar: 2200, actorShadow: false }),
  // mission control: dim cool room, the light comes from the screens
  control: P({ lit: [0.95, 1.05, 1.15], shade: [0.11, 0.14, 0.2], lift: [0.03, 0.05, 0.08], charTint: [0.86, 0.95, 1.0], charShade: 0.8, fog: "#0b1620", fogNear: 9, fogFar: 46 }),
  // inside the telescope tube: black baffles, one shaft of starlight down the tube
  tube: P({ lit: [1.55, 1.5, 1.45], shade: [0.025, 0.03, 0.05], lift: [0.015, 0.02, 0.04], lambert: 0.5, term: 0.06, charTint: [1, 1, 1], fog: "#000000", fogNear: 60, fogFar: 200, actorShadow: false }),
  // late-night TV studio: warm key spots, purple-blue set
  studio: P({ lit: [1.6, 1.34, 1.08], shade: [0.24, 0.17, 0.32], lift: [0.06, 0.04, 0.08], charTint: [1.0, 0.92, 0.84], fog: "#20142c", fogNear: 7, fogFar: 34 }),
  // Senate hearing room: warm wood, soft overhead
  senate: P({ lit: [1.52, 1.28, 0.98], shade: [0.27, 0.2, 0.24], lift: [0.05, 0.04, 0.05], charTint: [1.0, 0.92, 0.82], fog: "#3a2a22", fogNear: 12, fogFar: 60 }),
  // a Maryland field at dusk (the ladder gag): pink-orange sky, lavender shade
  field: P({ lit: [1.4, 0.95, 0.78], shade: [0.16, 0.14, 0.3], lift: [0.05, 0.05, 0.14], charTint: [1.0, 0.86, 0.8], fog: "#a88aa8", fogNear: 60, fogFar: 900, actorShadow: false }),
  // Munich street in drizzle: blue night, sodium lamps, wet cobbles
  street: P({ lit: [0.7, 0.72, 0.98], shade: [0.1, 0.1, 0.2], lift: [0.04, 0.04, 0.1], charTint: [0.8, 0.82, 1.0], fog: "#232338", fogNear: 12, fogFar: 160 }),
  // blueprint space for the mirrors: dark blue paper, glowing light paths
  clean: P({ lit: [0.95, 1.05, 1.25], shade: [0.1, 0.14, 0.3], lift: [0.04, 0.06, 0.14], charTint: [0.85, 0.92, 1.0], fog: "#0d1a3a", fogNear: 30, fogFar: 140, actorShadow: false }),
  // Kennedy Space Center, 2 December 1993, 4:27 a.m.: black night lit orange by the flame
  nightpad: P({ lit: [1.75, 1.05, 0.5], shade: [0.05, 0.06, 0.13], lift: [0.03, 0.03, 0.08], charTint: [1.0, 0.8, 0.62], fog: "#140d10", fogNear: 120, fogFar: 1800, actorShadow: false, sunI: 3.4 }),
  // press conference: clean white light; camera flashes pop on top
  press: P({ lit: [1.42, 1.4, 1.36], shade: [0.3, 0.3, 0.4], lift: [0.06, 0.06, 0.09], charTint: [1.0, 0.98, 0.96], fog: "#2a2e3a", fogNear: 10, fogFar: 50 }),
};

export type WorldLook = { sky: { c: string[]; e: number[] }; bounce: C3; sat: number; cloud: { lit: string; mid: string; shade: string } };
const NIGHT_CLOUD = { lit: "#c8d2ee", mid: "#8a96bc", shade: "#4a5476" };
export const LOOK: Record<LightName, WorldLook> = {
  bath: { sky: { c: ["#2a2f4a", "#1f2440", "#171c36", "#10142a", "#0a0d1e"], e: [0, 4, 10, 20, 40] }, bounce: [0.02, 0.02, 0.03], sat: 1.0, cloud: NIGHT_CLOUD },
  city: { sky: { c: ["#3a3452", "#2a2a4a", "#1c2040", "#111530", "#080b1e"], e: [0, 3, 9, 20, 45] }, bounce: [0, 0, 0], sat: 1.05, cloud: NIGHT_CLOUD },
  space: { sky: { c: ["#000004", "#000003", "#000002", "#000001", "#000000"], e: [0, 4, 10, 20, 40] }, bounce: [0, 0.01, 0.03], sat: 1.05, cloud: NIGHT_CLOUD },
  pad: { sky: { c: ["#ffd9a8", "#f4c494", "#b5cbe8", "#7aa3dc", "#3f72c6"], e: [0, 3, 9, 20, 45] }, bounce: [0.05, 0.03, 0.0], sat: 1.08, cloud: { lit: "#fff0dc", mid: "#f2d2c0", shade: "#b8b0d4" } },
  control: { sky: { c: ["#0b1620", "#0b1620", "#0b1620", "#0b1620", "#0b1620"], e: [0, 4, 10, 20, 40] }, bounce: [0, 0.02, 0.03], sat: 1.0, cloud: NIGHT_CLOUD },
  tube: { sky: { c: ["#000000", "#000000", "#000000", "#000000", "#000000"], e: [0, 4, 10, 20, 40] }, bounce: [0, 0, 0], sat: 1.0, cloud: NIGHT_CLOUD },
  studio: { sky: { c: ["#20142c", "#20142c", "#20142c", "#20142c", "#20142c"], e: [0, 4, 10, 20, 40] }, bounce: [0.03, 0.0, 0.03], sat: 1.05, cloud: NIGHT_CLOUD },
  senate: { sky: { c: ["#3a2a22", "#3a2a22", "#3a2a22", "#3a2a22", "#3a2a22"], e: [0, 4, 10, 20, 40] }, bounce: [0.04, 0.02, 0.0], sat: 1.0, cloud: NIGHT_CLOUD },
  field: { sky: { c: ["#ffb486", "#f29a84", "#c07a98", "#6e5c96", "#2e3468"], e: [0, 3, 8, 18, 40] }, bounce: [0.04, 0.02, 0.02], sat: 1.06, cloud: { lit: "#ffc8a0", mid: "#d98aa0", shade: "#7a6a9e" } },
  street: { sky: { c: ["#3a3452", "#2a2a4a", "#1c2040", "#111530", "#080b1e"], e: [0, 3, 9, 20, 45] }, bounce: [0, 0, 0], sat: 1.0, cloud: NIGHT_CLOUD },
  clean: { sky: { c: ["#0d1a3a", "#0d1a3a", "#0d1a3a", "#0d1a3a", "#0d1a3a"], e: [0, 4, 10, 20, 40] }, bounce: [0, 0.01, 0.04], sat: 1.0, cloud: NIGHT_CLOUD },
  nightpad: { sky: { c: ["#2a1810", "#1a1018", "#100c18", "#08070f", "#040308"], e: [0, 3, 9, 20, 45] }, bounce: [0.06, 0.03, 0.0], sat: 1.05, cloud: { lit: "#ffb070", mid: "#8a5a50", shade: "#2a2030" } },
  press: { sky: { c: ["#2a2e3a", "#2a2e3a", "#2a2e3a", "#2a2e3a", "#2a2e3a"], e: [0, 4, 10, 20, 40] }, bounce: [0, 0, 0], sat: 1.0, cloud: NIGHT_CLOUD },
};

/** character rim light per place (cardshade uRimCol / uRimK): the colour of the light that wraps their silhouettes */
export const RIM: Record<LightName, [number, number, number, number]> = {
  bath: [0.85, 0.92, 1.0, 0.28], city: [0.5, 0.62, 1.0, 0.35], space: [0.75, 0.86, 1.0, 0.5], pad: [1.0, 0.62, 0.28, 0.5],
  control: [0.35, 0.85, 1.0, 0.65], tube: [1, 1, 1, 0.3], studio: [1.0, 0.45, 0.85, 0.55], senate: [1.0, 0.72, 0.42, 0.35],
  field: [1.0, 0.55, 0.35, 0.6], street: [1.0, 0.7, 0.4, 0.45], clean: [0.4, 0.72, 1.0, 0.55], nightpad: [1.0, 0.55, 0.2, 0.85], press: [1.0, 1.0, 1.0, 0.35],
};
