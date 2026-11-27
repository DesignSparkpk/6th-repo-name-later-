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
export type LightName = "board" | "plaza" | "factory" | "show" | "office" | "congress" | "bank";
const P = (o: Partial<LightPreset> & Pick<LightPreset, "lit" | "shade" | "lift" | "charTint" | "fog" | "fogNear" | "fogFar">): LightPreset => ({
  az: 50, el: 50, lambert: 0.35, sideK: 0.84, term: 0.16, charShade: 0.86, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.9, 0.9, 0.98],
  blob: [0.55, 0.55, 0.62], actorShadow: true, top: "#000000", hor: "#000000", skyCurve: [0, 0.5, 0.6], sunDisc: "#000000",
  sunCol: "#ffffff", sunI: 2.4, sky: "#cfd8e8", ground: "#4a4650", hemiI: 0.6, bias: -0.0003, normalBias: 0.02, ...o,
});
export const LIGHTS: Record<LightName, LightPreset> = {
  // Ford's boardroom, 1978: dark walnut, one green-shaded desk lamp, dusk through the tall window behind him
  board: P({ lit: [1.45, 1.18, 0.86], shade: [0.12, 0.1, 0.14], lift: [0.03, 0.02, 0.03], lambert: 0.45, term: 0.12, charTint: [1.0, 0.86, 0.7], charShade: 0.72, fog: "#120c0a", fogNear: 14, fogFar: 60 }),
  // outside the glass tower: grey rain, cold daylight, wet stone that mirrors the sky
  plaza: P({ lit: [0.95, 1.0, 1.1], shade: [0.2, 0.23, 0.32], lift: [0.06, 0.07, 0.1], charTint: [0.86, 0.92, 1.0], fog: "#5a6478", fogNear: 25, fogFar: 260 }),
  // Chrysler's plant: sodium-orange work lights, red emergency glow (later green), dusty air
  factory: P({ lit: [1.5, 1.12, 0.82], shade: [0.16, 0.11, 0.14], lift: [0.05, 0.03, 0.04], lambert: 0.4, term: 0.14, charTint: [1.0, 0.86, 0.74], fog: "#2a1612", fogNear: 20, fogFar: 140 }),
  // the 1964 showroom: white spotlights, glossy floor, flashbulbs
  show: P({ lit: [1.65, 1.55, 1.42], shade: [0.3, 0.28, 0.36], lift: [0.08, 0.07, 0.09], charTint: [1.0, 0.97, 0.93], fog: "#2a2430", fogNear: 20, fogFar: 120 }),
  // a 1979 executive office: warm desk lamp, venetian-blind light
  office: P({ lit: [1.5, 1.28, 1.0], shade: [0.2, 0.15, 0.16], lift: [0.05, 0.04, 0.04], charTint: [1.0, 0.92, 0.82], fog: "#2a1e18", fogNear: 10, fogFar: 50 }),
  // a marble hearing hall: cool skylight, cold stone
  congress: P({ lit: [1.35, 1.36, 1.42], shade: [0.22, 0.24, 0.32], lift: [0.06, 0.06, 0.08], charTint: [0.96, 0.97, 1.0], fog: "#3a3e4a", fogNear: 20, fogFar: 120 }),
  // a bank office: clean daylight, polished desk
  bank: P({ lit: [1.55, 1.5, 1.4], shade: [0.24, 0.24, 0.3], lift: [0.06, 0.06, 0.07], charTint: [1.0, 0.98, 0.94], fog: "#40404a", fogNear: 12, fogFar: 60 }),
};

export type WorldLook = { sky: { c: string[]; e: number[] }; bounce: C3; sat: number; cloud: { lit: string; mid: string; shade: string } };
const CL = { lit: "#e8ecf4", mid: "#b8c0d0", shade: "#7a8296" };
const flat = (c: string): { c: string[]; e: number[] } => ({ c: [c, c, c, c, c], e: [0, 4, 10, 20, 40] });
export const LOOK: Record<LightName, WorldLook> = {
  board: { sky: { c: ["#e88a4a", "#c45a3a", "#6a3048", "#2a1a30", "#120c18"], e: [0, 3, 9, 20, 45] }, bounce: [0.03, 0.01, 0.0], sat: 1.05, cloud: CL },
  plaza: { sky: { c: ["#9aa4b6", "#8a94a8", "#7a8498", "#6a7488", "#5a6478"], e: [0, 4, 10, 20, 40] }, bounce: [0.01, 0.01, 0.02], sat: 0.95, cloud: CL },
  factory: { sky: flat("#1a0e0c"), bounce: [0.04, 0.01, 0.0], sat: 1.08, cloud: CL },
  show: { sky: flat("#201a28"), bounce: [0.03, 0.03, 0.03], sat: 1.1, cloud: CL },
  office: { sky: { c: ["#f0c080", "#e0a870", "#a0806a", "#605060", "#302838"], e: [0, 3, 9, 20, 45] }, bounce: [0.03, 0.02, 0.01], sat: 1.04, cloud: CL },
  congress: { sky: flat("#2a2e38"), bounce: [0.02, 0.02, 0.03], sat: 0.98, cloud: CL },
  bank: { sky: { c: ["#c8d8ec", "#b0c8e4", "#90b0dc", "#7098d0", "#5080c4"], e: [0, 3, 9, 20, 45] }, bounce: [0.02, 0.02, 0.02], sat: 1.0, cloud: CL },
};
/** character rim light per place (cardshade uRimCol / uRimK) */
export const RIM: Record<LightName, [number, number, number, number]> = {
  board: [1.0, 0.55, 0.3, 0.6], plaza: [0.7, 0.8, 1.0, 0.35], factory: [1.0, 0.3, 0.2, 0.7], show: [1.0, 1.0, 1.0, 0.45],
  office: [1.0, 0.75, 0.45, 0.4], congress: [0.85, 0.9, 1.0, 0.35], bank: [1.0, 0.95, 0.85, 0.3],
};
