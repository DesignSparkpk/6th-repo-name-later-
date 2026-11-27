// "Why NASA's Telescope Had to Wear Glasses": layout, clocks, one continuous camera, light by place, lens, kicks, shake.
// Everything is timed to the narration (shorts/hubble/voice: words.json): wf(line, word) = start frame of that word.
import WORDS from "./words.json";
import VT from "./voicetiming.json";
import type { LightName } from "./lights";

export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

type W = { w: string; s: number; e: number; line: string };
export const WORDS_T = WORDS as W[];
/** frame at which `word` (prefix match on letters/digits, case-insensitive) starts inside narration line `line` (nth hit) */
export const wf = (line: string, word?: string, nth = 0): number => {
  const ws = WORDS_T.filter((w) => w.line === line);
  if (!word) return Math.round(ws[0].s * FPS);
  const hit = ws.filter((w) => w.w.replace(/[^a-z0-9']/gi, "").toLowerCase().startsWith(word.toLowerCase()))[nth];
  return Math.round((hit ?? ws[0]).s * FPS);
};
export const TOTAL = Math.round((VT as { total: number }).total * FPS);
export const talking = (f: number) => WORDS_T.some((w) => f >= w.s * FPS - 1 && f < w.e * FPS);
/** is a word of narration line `line` being spoken at frame f (lip sync for the in-character lines) */
export const speaking = (f: number, line: string) => WORDS_T.some((w) => w.line === line && f >= w.s * FPS - 1 && f < w.e * FPS);

// ---------------- clocks ----------------
export const T = {
  stares: wf("hook", "stares"), showerH: wf("hook", "shower"), saves: wf("hook", "saves"), billion: wf("hook", "billion"), telescope: wf("hook", "telescope"),
  yousee: wf("yousee"), y1990: wf("yousee", "1990"), nasa: wf("yousee", "nasa"), launches: wf("yousee", "launches"), hubble: wf("yousee", "hubble"),
  blurryL: wf("blurry"), picture: wf("blurry", "picture"), back: wf("blurry", "back"), completely: wf("blurry", "completely"), blurry: wf("blurry", "blurry"),
  mirrorL: wf("mirror"), mirror: wf("mirror", "mirror"), off: wf("mirror", "off"), fiftieth: wf("mirror", "onefiftieth"), human: wf("mirror", "human"), hair: wf("mirror", "hair"),
  roast: wf("roast"), roastW: wf("roast", "roast"), senatorA: wf("roast", "senator"), calls: wf("roast", "calls"), turkey: wf("roast", "technoturkey"),
  worse: wf("worse"), worseW: wf("worse", "worse"), orbit: wf("worse", "orbit"), nobody: wf("worse", "nobody"), climb: wf("worse", "climb"), fix: wf("worse", "fix"),
  crocker: wf("crocker"), jim: wf("crocker", "jim"), checks: wf("crocker", "checks"), german: wf("crocker", "german"), hotel: wf("crocker", "hotel"),
  showerL: wf("shower"), watches: wf("shower", "watches"), head2: wf("shower", "head"), slide: wf("shower", "slide"), rail: wf("shower", "rail"), tilt: wf("shower", "tilt"),
  freeze: wf("freeze"), mirrors: wf("freeze", "mirrors"), little: wf("freeze", "little"), arms: wf("freeze", "arms"),
  glassesL: wf("glasses"), builds: wf("glasses", "builds"), tiny: wf("glasses", "tiny"), flaw: wf("glasses", "flaw"), reverse: wf("glasses", "reverse"),
  glasses: wf("glasses", "glasses"), forW: wf("glasses", "for"), telescope2: wf("glasses", "telescope"),
  risk: wf("risk"), astronauts: wf("risk", "astronauts"), riskW: wf("risk", "risk"), five: wf("risk", "five"), install: wf("risk", "install"),
  one: wf("risk", "one"), slip: wf("risk", "slip"), dead: wf("risk", "dead"),
  slideL: wf("slide"), inW: wf("slide", "in"), little2: wf("slide", "little"), unfold: wf("slide", "unfold"),
  photo: wf("photo"), earth: wf("photo", "earth"), photoW: wf("photo", "photo"), loads: wf("photo", "loads"), razor: wf("photo", "razor"), sharp: wf("photo", "sharp"),
  senator: wf("senator"), calledW: wf("senator", "called"), turkey2: wf("senator", "turkey"), holds: wf("senator", "holds"), cameras: wf("senator", "cameras"),
  trouble: wf("trouble"), troubleW: wf("trouble", "trouble"), hubble2: wf("trouble", "hubble"), over: wf("trouble", "over"),
};

// ---------------- world layout (metres; every place is its own island, far apart) ----------------
/** the Munich hotel: the bathroom on the 5th floor, its window in the street facade (z = 6), the city in front (+z) */
export const HB = 15.2;
export const BATH = { x0: -1.4, x1: 1.4, z0: 3.2, z1: 6.0, h: 2.6 };
export const CROC: V3 = [-0.85, HB, 3.9];                         // Crocker in the shower, facing +z
export const RAIL = { x: -0.42, z: 3.25, y0: HB + 1.32, y1: HB + 2.18 };  // the slide rail on the shower wall, beside him
export const WIN = { x: 0.55, y0: HB + 1.0, y1: HB + 2.45, z: 6.0, w: 1.1 };  // matches the painted facade grid
export const FACADE_Z = 6.3;                                        // outer face of the hotel's street wall
export const CHURCH: V3 = [60, 0, 230];                             // the twin-domed cathedral the crane rises toward
export const CLOUD_Y = 300;
/** the shower head's height and tilt: slid up in the hook; slides on "slide", tilts on "tilt" */
export const showerHead = (f: number) => {
  const hook = smooth(f / 26) * 0.18;
  const later = f >= T.showerL - 10 ? smooth((f - T.slide) / 22) * 0.2 : 0;
  const tilt = f >= T.showerL - 10 ? smooth((f - T.tilt) / 10) * 0.75 : 0.12;
  return { y: (f >= T.showerL - 10 ? RAIL.y0 + 0.4 + later : RAIL.y0 + 0.42 + hook), tilt };
};
/** orbit: Hubble at HUB (long axis along x, aperture toward +x), the Earth below */
export const SPX = 30000;
export const HUB: V3 = [SPX, 0, 0];
export const RE = 700;
export const EARTH_C: V3 = [SPX, -760, 0];
/** the other islands */
/** the point of the Earth under Hubble in the hook (lat, lon degrees) and its drift per second */
export const EARTH_BELOW = { lat: 24, lon: -76, drift: 0.35 };
export const PAD: V3 = [-30000, 0, 0];
export const CTL: V3 = [0, 0, 30000];
export const TUB: V3 = [0, 0, -30000];
export const STU: V3 = [30000, 0, 30000];
export const SEN: V3 = [-30000, 0, 30000];
export const FLD: V3 = [30000, 0, -30000];
export const CLN: V3 = [-30000, 0, -30000];
export const PRS: V3 = [0, 0, 60000];

/** hidden cuts */
export const CUT = {
  space: 102,                         // under the cloud pass: the crane out of Munich ends in orbit
  pad: T.yousee,                      // whip to Florida, 1990
  control: T.blurryL, tube: T.mirrorL, studio: T.roast, senate: T.senatorA - 2, orbit2: T.worse, field: T.nobody - 2,
  street: T.crocker, bath2: T.showerL, clean: T.glassesL, glasses: T.glasses - 2, nightpad: T.risk, walk: T.astronauts,
  control2: T.photo, press: T.senator,
};

// ---------------- camera: one path, keys blended with an ease-in-out glide ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const mixC = (a: Cam, b: Cam, t: number): Cam => ({
  pos: [lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t)],
  look: [lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t)],
  fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll, b.roll, t),
});
/** holds always creep in: the subject grows ~rate per frame since f0 */
export const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** slow orbit around a point: angle a0 + rate * (f - f0) radians, radius r, height h */
const orbitAt = (c: V3, r: number, h: number, a0: number, rate: number, f: number, f0: number): V3 =>
  [c[0] + r * Math.cos(a0 + rate * (f - f0)), c[1] + h, c[2] + r * Math.sin(a0 + rate * (f - f0))];

const CROC_HEAD = add(CROC, [0, 1.6, 0]);
const KEYS: Key[] = [
  // HOOK: through the steamy shower glass, waist-up on Crocker staring at the shower head, creeping in
  { f: 0, s: (f) => dolly([0.5, HB + 1.45, 5.72], add(CROC_HEAD, [0.2, 0.1, 0]), pushK(f, 0, 0.0035), { fov: 44, roll: 0.02 }) },
  // "shower head": whip past his face onto the chrome head on its rail
  { f: T.showerH - 4, dur: 10, s: (f) => { const hy = showerHead(f).y; return { pos: [RAIL.x + 0.2, hy - 0.16, RAIL.z + 0.72], look: [RAIL.x, hy, RAIL.z + 0.2], fov: 38, roll: -0.05 }; } },
  // "and saves": pull back and swing round to the open window, steam pouring out of it
  { f: T.saves - 16, dur: 13, s: () => ({ pos: [-0.15, HB + 1.66, 4.75], look: [WIN.x, HB + 1.55, 6.8], fov: 44, roll: 0.03 }) },
  // out through the window: the wet street below, lamps, the taxi
  { f: T.saves - 4, dur: 12, s: () => ({ pos: [WIN.x, HB + 1.6, 7.6], look: [14, HB - 6, 22], fov: 50, roll: -0.03 }) },
  // rise straight up above the street, the old town opening out
  { f: T.saves + 6, dur: 14, s: () => ({ pos: [3, 36, 12], look: [CHURCH[0], 34, CHURCH[2]], fov: 50, roll: 0.02 }) },
  // "a $1.5": glide out over the rooftops toward the floodlit twin domes
  { f: T.saves + 16, dur: 18, s: () => ({ pos: [14, 60, 64], look: [CHURCH[0], 52, CHURCH[2]], fov: 50, roll: 0.03 }) },
  // "billion": tilt up and crane straight into the cloud deck
  { f: 88, dur: 14, s: () => ({ pos: [28, 236, 112], look: [44, 720, 182], fov: 58, roll: -0.05 }) },
  // ---- orbit (the cloud pass hides the cut): Hubble over the night side of the Earth, the sun coming up on the limb ----
  { f: CUT.space, cut: true, s: (f) => ({ pos: add(HUB, [-34 + (f - CUT.space) * 0.2, 13, 58]), look: add(HUB, [2, -3, 0]), fov: 46, roll: -0.04 }) },
  { f: CUT.space + 2, dur: 40, s: (f) => dolly(add(HUB, [-20.5, 7.5, 35.5]), add(HUB, [0.2, -1.4, 0]), pushK(f, CUT.space + 42, 0.003), { fov: 40, roll: -0.26 }) },
  // ---- placeholders for the rest of the film (refined scene by scene) ----
  { f: CUT.pad, cut: true, s: (f) => ({ pos: add(PAD, [-120, 14, 160]), look: add(PAD, [0, 40 + (f - CUT.pad) * 0.1, 0]), fov: 44 }) },
  { f: CUT.control, cut: true, s: () => ({ pos: add(CTL, [0, 2.4, 9]), look: add(CTL, [0, 2.6, -6]), fov: 44 }) },
  { f: CUT.tube, cut: true, s: () => ({ pos: add(TUB, [0, 0, 9]), look: add(TUB, [0, 0, -4]), fov: 44 }) },
  { f: CUT.studio, cut: true, s: () => ({ pos: add(STU, [0, 1.5, 5]), look: add(STU, [0, 1.3, 0]), fov: 42 }) },
  { f: CUT.senate, cut: true, s: () => ({ pos: add(SEN, [0, 1.6, 5]), look: add(SEN, [0, 1.5, 0]), fov: 42 }) },
  { f: CUT.orbit2, cut: true, s: (f) => ({ pos: orbitAt(HUB, 22, 4, 2.2, 0.004, f, CUT.orbit2), look: HUB, fov: 42 }) },
  { f: CUT.field, cut: true, s: () => ({ pos: add(FLD, [0, 2, 12]), look: add(FLD, [0, 5, 0]), fov: 46 }) },
  { f: CUT.street, cut: true, s: () => ({ pos: [4, 1.7, 15], look: [0, 1.6, FACADE_Z], fov: 44 }) },
  { f: CUT.bath2, cut: true, s: (f) => { const hy = showerHead(f).y; return { pos: [RAIL.x + 0.2, hy - 0.16, RAIL.z + 0.72], look: [RAIL.x, hy, RAIL.z + 0.2], fov: 38 }; } },
  { f: CUT.clean, cut: true, s: () => ({ pos: add(CLN, [0, 2, 8]), look: add(CLN, [0, 1.5, 0]), fov: 44 }) },
  { f: CUT.glasses, cut: true, s: (f) => ({ pos: orbitAt(HUB, 20, 2, 1.4, 0.004, f, CUT.glasses), look: HUB, fov: 42 }) },
  { f: CUT.nightpad, cut: true, s: () => ({ pos: add(PAD, [-120, 14, 160]), look: add(PAD, [0, 40, 0]), fov: 44 }) },
  { f: CUT.walk, cut: true, s: (f) => ({ pos: orbitAt(HUB, 14, 3, 1.9, 0.003, f, CUT.walk), look: HUB, fov: 42 }) },
  { f: CUT.control2, cut: true, s: () => ({ pos: add(CTL, [0, 2.4, 9]), look: add(CTL, [0, 2.6, -6]), fov: 44 }) },
  { f: CUT.press, cut: true, s: () => ({ pos: add(PRS, [0, 1.6, 5]), look: add(PRS, [0, 1.5, 0]), fov: 42 }) },
];
const run = (f: number) => {
  let cur = full(KEYS[0].s(f));
  for (let i = 1; i < KEYS.length; i++) {
    const k = KEYS[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** true on frames where a hard cut lands (no motion blur across a cut) */
export const isCut = (f: number) => KEYS.some((k) => k.cut && (f === k.f || f === k.f + 1));
// impact kicks: the image jolts, flipping sign every frame and decaying over 7 frames
const KICKS: [number, number][] = [[T.telescope, 0.4]];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) { const n = f - f0; if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
/** handheld / tension shake: [from, to, amplitude in degrees-ish] */
const SHAKES: [number, number, number][] = [];
const shakeAt = (f: number) => {
  let a = 0;
  for (const [f0, f1, g] of SHAKES) if (f >= f0 && f < f1) a = Math.max(a, g * Math.min(1, (f - f0) / 6, (f1 - f) / 6));
  return a;
};
export const camAt = (f: number): Cam => {
  const c = run(f), a = kickAt(f), sh = shakeAt(f);
  if (!a && !sh) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  const n1 = sh ? sh * 0.004 * L * (Math.sin(f * 1.7) + 0.6 * Math.sin(f * 3.1 + 1.3)) : 0, n2 = sh ? sh * 0.004 * L * (Math.sin(f * 2.3 + 0.7) + 0.5 * Math.sin(f * 4.3)) : 0;
  return { ...c, look: [c.look[0] - (d[2] / h) * (m + n1), c.look[1] + 0.6 * m + n2, c.look[2] + (d[0] / h) * (m + n1)], roll: c.roll + a * 0.004 + sh * 0.002 * Math.sin(f * 1.1) };
};

// ---------------- light follows the camera's place ----------------
export type Place = LightName;
const inBath = (p: V3) => p[0] > BATH.x0 - 0.05 && p[0] < BATH.x1 + 0.05 && p[2] > BATH.z0 - 0.05 && p[2] < BATH.z1 + 0.02 && p[1] > HB && p[1] < HB + BATH.h;
export const placeAt = (f: number): Place => {
  const c = run(f);
  if (f < CUT.space) return inBath(c.pos) ? "bath" : "city";
  if (f < CUT.pad) return "space";
  if (f < CUT.control) return "pad";
  if (f < CUT.tube) return "control";
  if (f < CUT.studio) return "tube";
  if (f < CUT.senate) return "studio";
  if (f < CUT.orbit2) return "senate";
  if (f < CUT.field) return "space";
  if (f < CUT.street) return "field";
  if (f < CUT.bath2) return inBath(c.pos) ? "bath" : "street";
  if (f < CUT.clean) return "bath";
  if (f < CUT.glasses) return "clean";
  if (f < CUT.nightpad) return "space";
  if (f < CUT.walk) return "nightpad";
  if (f < CUT.control2) return "space";
  if (f < CUT.press) return "control";
  return "press";
};
/** sun direction per place, world space */
export const SUN_OF: Record<Place, V3> = {
  bath: [0.5, 0.85, 0.3], city: [-0.25, 0.3, 0.92], space: [0.85, 0.22, 0.48], pad: [0.85, 0.3, 0.42], control: [0.2, 0.9, 0.4], tube: [0.97, 0.15, 0.1],
  studio: [0.45, 0.8, 0.4], senate: [0.4, 0.85, 0.35], field: [-0.8, 0.25, -0.55], street: [0.3, 0.8, 0.5], clean: [0.3, 0.8, 0.5], nightpad: [0.2, -0.15, 0.97], press: [0.2, 0.85, 0.5],
};

/** orbit: the sun moves per frame (a sunrise on the limb in the hook; orbital sunset on "dead", sunrise on "slide") */
const SPACE_SUN: [number, number, V3, V3][] = [
  [0, CUT.pad, [0.5, 0.62, 0.6], [0.5, 0.62, 0.6]],                         // high morning sun: the whole cap below is day, bright blue limb
  [CUT.orbit2, CUT.walk, [0.55, 0.62, 0.56], [0.55, 0.62, 0.56]],          // day
  [CUT.walk, T.slip, [0.5, 0.6, 0.62], [0.5, 0.6, 0.62]],
  [T.slip, T.dead + 4, [0.5, 0.6, 0.62], [0.7, -0.45, 0.55]],              // orbital sunset as the wrench drifts off
  [T.dead + 4, T.slideL - 2, [0.7, -0.45, 0.55], [0.7, -0.45, 0.55]],
  [T.slideL - 2, T.slideL + 12, [0.7, -0.45, 0.55], [0.5, 0.6, 0.62]],     // sunrise as they slide the mirrors in
  [T.slideL + 12, 1e9, [0.5, 0.6, 0.62], [0.5, 0.6, 0.62]],
];
export const sunAt = (f: number, place: Place): V3 => {
  if (place !== "space") return SUN_OF[place];
  const seg = SPACE_SUN.find(([a, b]) => f >= a && f < b) ?? SPACE_SUN[0];
  const u = smooth((f - seg[0]) / Math.max(1, seg[1] - seg[0]));
  const v: V3 = [lerp(seg[2][0], seg[3][0], u), lerp(seg[2][1], seg[3][1], u), lerp(seg[2][2], seg[3][2], u)];
  const n = Math.hypot(...v); return [v[0] / n, v[1] / n, v[2] / n];
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 10, focus: () => CROC_HEAD },                                          // the steamy bathroom behind him goes soft
  { f: T.showerH - 4, dur: 8, cInf: 14, focus: (f) => [RAIL.x, showerHead(f).y, RAIL.z + 0.24] },  // macro: only the shower head is sharp
  { f: T.saves - 16, dur: 10, cInf: 5 },
  { f: T.saves - 4, dur: 10, cInf: 1 },                                                  // the city: everything sharp
  { f: CUT.space, cInf: 16, focus: () => add(HUB, [60, -10, 0]) },                        // orbit: Hubble arrives out of focus...
  { f: T.telescope - 3, dur: 7, cInf: 7, focus: () => HUB },                             // ...and snaps sharp on "telescope"
  { f: CUT.pad, cInf: 2 },
];
export const dofAt = (f: number) => {
  let cur = { cInf: DOF[0].cInf, focus: DOF[0].focus };
  for (const d of DOF) {
    if (f < d.f) break;
    const u = d.dur ? glide((f - d.f) / d.dur) : 1;
    cur = { cInf: cur.cInf + (d.cInf - cur.cInf) * u, focus: d.focus ?? (u < 0.5 ? cur.focus : undefined) };
  }
  return cur;
};
