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
/** the macro set: the mirror's rim at hair scale (a hair HAIR_R metres in radius) */
export const MAC: V3 = [0, 0, -30400];
export const HAIR_R = 0.5;
export const STU: V3 = [30000, 0, 30000];
export const SEN: V3 = [-30000, 0, 30000];
export const FLD: V3 = [30000, 0, -30000];
/** the absurd ladder in the field */
export const LADDER_H = 30;
export const CLN: V3 = [-30000, 0, -30000];
export const PRS: V3 = [0, 0, 60000];
/** the final picture (a nebula on a plane facing +z) */
export const NEB: V3 = [0, 0, 90000];

/** hidden cuts */
export const CUT = {
  space: 102,                         // under the cloud pass: the crane out of Munich ends in orbit
  pad: T.yousee,                      // whip to Florida, 1990
  control: T.blurryL, tube: T.mirrorL, studio: T.roast, senate: T.senatorA - 2, orbit2: T.worse, field: T.nobody - 2,
  street: T.crocker, bath2: T.showerL, clean: T.glassesL, glasses: T.glasses - 2, nightpad: T.risk, walk: T.astronauts,
  control2: T.photo, press: T.senator, arms: T.little2 - 2, neb: T.over,
};

// ---------------- the launch pad (1990 by day, 1993 by night) ----------------
/** the stack stands on the mobile launcher deck, DECK metres above the pad surface (stack-local y = 0 there) */
export const DECK = 11.6;
/** marsh level around the pad mound (the mound's top is y = 0) */
export const GROUND = -6;
/** pad layout relative to PAD: x east (the ocean), z south (the press site) */
export const PADL = {
  tower: { x0: -26, x1: -16, z0: -5, z1: 5, h: 82 },
  srbX: 6.7, orbZ: 7.7,
  trench: 46,                                                   // flame-trench mouths at x = +-trench; the smoke rolls out along +-x
  clock: [-232, GROUND, 318] as V3, clockYaw: -0.63,            // the countdown clock at the press site, face toward the camera
  press: [-250, GROUND + 0.6, 330] as V3,                       // the spectators' grass bank
};
/** the countdown clock's face centre and the middle of the stack, world space */
export const CLOCK_FACE: V3 = add(PAD, [PADL.clock[0], GROUND + 2.6, PADL.clock[2]]);
/** ignition frames: main engines, then the boosters (liftoff one frame later) */
export const LAUNCHES = [
  { ssme: T.nasa - 2, srb: T.launches + 1 },                     // 24 April 1990
  { ssme: CUT.nightpad - 26, srb: CUT.nightpad - 20 },           // 2 December 1993: already climbing when we cut in
];
/** engines (0..1 lit), boosters (0..1 lit) and the stack's height above the deck; a stylised, fast climb */
export const launchAt = (f: number) => {
  const L = f < CUT.control ? LAUNCHES[0] : LAUNCHES[1];
  const t = Math.max(0, f - L.srb - 1) / FPS;
  return { ssme: clamp01((f - L.ssme) / 3), srb: clamp01((f - L.srb + 1) / 2), h: 0.5 * 66 * t * t + 3 * t, lit: f >= L.ssme };
};
const STACK_MID = (f: number): V3 => add(PAD, [0, DECK + 32 + launchAt(f).h, 3]);
// ---------------- the control room (1990: the blurry first picture; 1994: the sharp one) ----------------
/** how much of the picture has arrived on the big screen (0..1), and how sharp it is */
export const screenAt = (f: number) => f < CUT.tube
  ? { load: clamp01((f - T.picture) / (T.completely - T.picture - 2)), sharp: 0, label: "HST  WF/PC  FIRST IMAGE" }
  : { load: clamp01((f - T.loads) / (T.razor - T.loads - 1)), sharp: smooth((f - T.razor + 1) / 4), label: "HST  WFPC2  POST-SERVICING" };
/** the mirror's flaw: the red rim glows on "off"; the hair's 1/50 strip lights during "one-fiftieth"; the red step on "human hair" */
export const flawAt = (f: number) => ({ ring: smooth((f - T.off + 1) / 5) * (0.75 + 0.25 * Math.sin(f * 0.5)), strip: smooth((f - T.fiftieth - 6) / 6), step: smooth((f - T.human + 2) / 6) });
/** the ladder sways once he stretches too far (radians about its feet, z axis) */
export const swayAt = (f: number) => (f < T.fix - 6 ? 0 : 0.09 * Math.sin((f - T.fix + 6) * 0.35) * smooth((f - T.fix + 6) / 8));
/** Munich, the night he checks in: where he is on the sidewalk (he walks toward the entrance with his suitcase) */
export const crocWalkX = (f: number) => 3.2 - (f - CUT.street) * 0.105;
/** the blueprint: the side arms fold out on "tiny mirrors", the main arm swings its mirror into the beam on "reverse" */
export const costarAt = (f: number) => f < CUT.walk
  ? { side: smooth((f - T.tiny) / 10), arm: smooth((f - T.reverse + 9) / 9), fix: smooth((f - T.reverse) / 4) }
  : { side: smooth((f - T.little2) / 8), arm: smooth((f - T.unfold + 4) / 8), fix: smooth((f - T.unfold - 4) / 4) };
/** the spectacles pop onto Hubble on "Glasses" (overshoot), and a glint runs across a lens on "telescope" */
export const specsAt = (f: number) => { const u = clamp01((f - T.glasses + 1) / 6); return { s: u * (1 + 0.35 * Math.sin(u * Math.PI)), glint: clamp01((f - T.telescope2) / 10) }; };
/** the spacewalk: the box slides home on "slide... in"; the wrench slips out of the glove on "slip" and tumbles away */
export const EVA_ON = (f: number) => f >= CUT.walk && f < CUT.arms;
export const boxSlide = (f: number) => smooth((f - T.slide) / (T.inW - T.slide + 1));
export const wrenchAt = (f: number) => { const t = Math.max(0, f - T.slip - 1) / FPS; return { d: [0.6 * t, 0.26 * t, 1.0 * t] as V3, spin: [t * 2.1, t * 3.3, t * 1.4] as V3 }; };
/** press camera flashes: frames on which one of the photographers' flashes pops (Senate, press room) */
export const FLASHES = [T.turkey + 2, T.turkey + 7, T.turkey + 13, T.turkey + 19, T.holds + 2, T.holds + 5, T.holds + 9, T.holds + 14, T.holds + 18, T.holds + 23, T.holds + 29, T.holds + 34, T.cameras + 4, T.cameras + 9, T.troubleW + 3, T.hubble2 + 2, T.over - 3];
/** a white flash over the whole frame (hides the cut into the final picture) */
export const whiteFlash = (f: number) => Math.max(0, 1 - Math.abs(f - T.over + 0.5) / 4);
/** the coffee mug: tips over on "blurry", the coffee spreads */
export const mugAt = (f: number) => (f >= CUT.walk ? { tip: 0, spill: 0 } : { tip: smooth((f - T.blurry - 1) / 6) * 1.52, spill: clamp01((f - T.blurry - 5) / 16) });


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
  // ---- 1990, the pad at sunrise. 1: crane up off the countdown clock to the shuttle, racking focus onto it ----
  { f: CUT.pad, cut: true, s: (f) => {
    const u = glide((f - CUT.pad) / 36), w = glide((f - CUT.pad - 4) / 30), b: V3 = [-0.589, 0, 0.808];
    const p0 = add(CLOCK_FACE, [b[0] * 37, 0.9, b[2] * 37]), p1 = add(CLOCK_FACE, [b[0] * 31, 9.5, b[2] * 31]);
    const l0 = add(CLOCK_FACE, [0, 0.25, 0]), l1 = STACK_MID(f);
    return { pos: [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), lerp(p0[2], p1[2], u)], look: [lerp(l0[0], l1[0], w), lerp(l0[1], l1[1], w), lerp(l0[2], l1[2], w)], fov: lerp(30, 23, u), roll: 0.01 };
  } },
  // 2: low on the launcher deck behind the orbiter's tail: the main engines light, the boosters light, it lifts
  { f: T.nasa - 5, cut: true, s: (f) => { const h = launchAt(f).h, k = pushK(f, T.nasa - 5, 0.004);
    return dolly(add(PAD, [40, DECK + 1.2, 33]), add(PAD, [0, DECK + 9.5 + h * 0.8, 7]), k, { fov: 40, roll: -0.04 }); } },
  // 3: the faces at the press site, lit by it
  { f: T.launches + 3, cut: true, s: (f) => { const P = add(PAD, PADL.press), fw: V3 = [0.589, 0, -0.808];
    return { pos: add(P, [fw[0] * 5.4 + 0.1, 0.7 + (f - T.launches - 3) * 0.01, fw[2] * 5.4 + 0.1]), look: add(P, [0, 1.45, 0]), fov: 34, roll: 0.02 }; } },
  // 4: long lens, tracking the orbiter up past the tower
  { f: T.hubble, cut: true, s: (f) => ({ pos: add(PAD, [-150, 6, 152]), look: add(STACK_MID(f), [0, -15, 4]), fov: 19, roll: -0.02 }) },
  // ---- the control room, 1990. 1: behind the back row, over the silhouettes, the picture arriving on the big screen ----
  { f: CUT.control, cut: true, s: (f) => dolly(add(CTL, [0.5, 2.5, 4.9]), add(CTL, [0, 2.55, -9]), pushK(f, CUT.control, 0.0055), { fov: 46, roll: 0.0 }) },
  // 2: "completely": turn round to their faces, lit by it
  { f: T.completely, cut: true, s: (f) => dolly(add(CTL, [-1.6, 1.3, -6.5]), add(CTL, [-1.6, 1.24, -3.7]), pushK(f, T.completely, 0.007), { fov: 31, roll: 0.015 }) },
  // 3: "blurry": down at desk height, the mug between the monitors goes over; the lead behind it, crushed
  { f: T.blurry, cut: true, s: (f) => dolly(add(CTL, [-1.42, 1.13, -5.45]), add(CTL, [-1.47, 1.03, -4.0]), pushK(f, T.blurry, 0.004), { fov: 40, roll: -0.02 }) },
  // ---- inside the telescope: fly down the black tube, past the secondary mirror, onto the primary; its rim glows red on "off" ----
  { f: CUT.tube, cut: true, s: (f) => ({ pos: add(TUB, [0.34, 0.3, 6.4]), look: add(TUB, [0, 0, -7]), fov: 54, roll: 0.12 }) },
  { f: CUT.tube + 1, dur: T.off - CUT.tube - 2, s: (f) => ({ pos: add(TUB, [0.04, 0.03, -1.1 - (f - T.off) * 0.02]), look: add(TUB, [0, 0, -7]), fov: 50, roll: -0.04 }) },
  // the macro: the cut end of a human hair, 50 strips across it, one of them lit; then pull back to the hair on the mirror's rim
  { f: T.fiftieth, cut: true, s: (f) => dolly(add(MAC, [1.25, HAIR_R + 0.08, -2.5 + 0.3]), add(MAC, [0, HAIR_R, -2.5]), pushK(f, T.fiftieth, 0.004), { fov: 40, roll: 0.03 }) },
  { f: T.human - 3, dur: 18, s: () => ({ pos: add(MAC, [6.2, 3.0, 5.4]), look: add(MAC, [-2.8, 0.15, -1.6]), fov: 44, roll: -0.03 }) },
  // ---- the late-night TV roast: over the laughing audience onto the host waving the blurry print; crash zoom on "roast" ----
  { f: CUT.studio, cut: true, s: (f) => dolly(add(STU, [0.5, 1.7, 6.6]), add(STU, [-1.35, 2.1, -2.5]), pushK(f, CUT.studio, 0.004), { fov: 36, roll: 0.02 }) },
  { f: T.roastW + 2, dur: 4, s: (f) => dolly(add(STU, [0.5, 1.7, 6.6]), add(STU, [-1.4, 2.25, -2.5]), pushK(f, CUT.studio, 0.004), { fov: 19, roll: -0.03 }) },
  // ---- the Senate hearing: over the photographers onto the senator; on "techno-turkey" she points at the chart ----
  { f: CUT.senate, cut: true, s: (f) => dolly(add(SEN, [0.7, 1.55, 5.6]), add(SEN, [0, 1.78, -2.7]), pushK(f, CUT.senate, 0.005), { fov: 30, roll: 0.0 }) },
  { f: T.turkey, cut: true, s: (f) => dolly(add(SEN, [-0.8, 1.55, 3.0]), add(SEN, [-0.62, 1.62, -2.2]), pushK(f, T.turkey, 0.004), { fov: 40, roll: -0.02 }) },
  // ---- "already in orbit": pull back from Hubble until it is a glinting speck over the Earth's limb ----
  { f: CUT.orbit2, cut: true, s: (f) => { const u = glide((f - CUT.orbit2) / 58), d = lerp(19, 235, u ** 1.25);
    return { pos: add(HUB, [-0.55 * d, 2 + 0.2 * d, 0.81 * d]), look: add(HUB, [0, -0.18 * d, 0]), fov: 40, roll: 0.02 + 0.06 * u }; } },
  // ---- "nobody can climb inside": a man at the top of a ladder reaching up... pull back: a 30 m ladder in a field, Hubble a speck ----
  { f: CUT.field, cut: true, s: (f) => dolly(add(FLD, [1.0, LADDER_H + 0.15, 2.7]), add(FLD, [0, LADDER_H + 0.4, 0]), pushK(f, CUT.field, 0.004), { fov: 42, roll: 0.03 }) },
  { f: T.climb + 2, dur: 22, s: () => ({ pos: add(FLD, [7.5, 2.2, 23]), look: add(FLD, [-0.4, 14, -2]), fov: 62, roll: -0.04 }) },
  // ---- Munich, night, drizzle: track alongside him and his suitcase toward the hotel; on "German hotel" crane up to the window ----
  { f: CUT.street, cut: true, s: (f) => { const x = crocWalkX(f); return { pos: [x + 1.25, 1.5, 12.6], look: [x - 0.7, 1.95, FACADE_Z], fov: 40, roll: 0.02 }; } },
  { f: T.german - 2, dur: 26, s: () => ({ pos: [3.4, HB + 2.4, 15.5], look: [WIN.x - 0.4, HB + 1.5, FACADE_Z], fov: 50, roll: -0.02 }) },
  // ---- back in the shower (the loop closes): him and the shower head on its rail... ----
  { f: CUT.bath2, cut: true, s: (f) => dolly([0.66, HB + 1.5, 5.7], [-0.55, HB + 1.85, 3.6], pushK(f, CUT.bath2, 0.003), { fov: 46, roll: 0.02 }) },
  // ...then in close on the head as it slides up the rail and tilts
  { f: T.head2, cut: true, s: (f) => { const hy = showerHead(f).y; return { pos: [RAIL.x + 0.24, hy - 0.12, RAIL.z + 0.8], look: [RAIL.x, hy + 0.02, RAIL.z + 0.18], fov: 42, roll: -0.04 }; } },
  // "He freezes": slam in on his face as it hits him
  { f: T.freeze, cut: true, s: (f) => { const k = smooth((f - T.freeze) / 14); return { pos: add(CROC_HEAD, [0.5 - 0.08 * k, -0.1, 1.45 - 0.2 * k]), look: add(CROC_HEAD, [0.02, -0.14, 0]), fov: 42 - 9 * k, roll: 0.03 * k }; } },
  // ---- the idea as a glowing blueprint: the box, its fold-out arms, the beam that will not focus... until the mirror swings in ----
  { f: CUT.clean, cut: true, s: (f) => ({ pos: orbitAt(add(CLN, [0.5, 2.0, 0]), 4.8, 0.4, 0.75, 0.006, f, CUT.clean), look: add(CLN, [0.6, 1.15, 0]), fov: 42, roll: 0.02 }) },
  { f: T.tiny - 2, dur: 10, s: (f) => ({ pos: orbitAt(add(CLN, [0.9, 1.3, 0]), 2.1, 0.2, 0.9, 0.006, f, T.tiny - 2), look: add(CLN, [0.55, 0.95, 0]), fov: 40, roll: -0.02 }) },
  { f: T.flaw - 4, dur: 14, s: (f) => ({ pos: orbitAt(add(CLN, [0.2, 1.4, 0]), 3.9, 1.0, 1.0, 0.004, f, T.flaw - 4), look: add(CLN, [0.25, 0.95, 0]), fov: 46, roll: 0.0 }) },
  // ---- "Glasses. For a telescope.": Hubble in orbit, wearing spectacles ----
  { f: CUT.glasses, cut: true, s: (f) => dolly(add(HUB, [21, 2.2, 6.0]), add(HUB, [6.6, 0.2, 0.0]), pushK(f, CUT.glasses, 0.005), { fov: 38, roll: -0.06 }) },
  // ---- 1993, 4:27 a.m.: the second launch, already climbing on its pillar of fire ----
  { f: CUT.nightpad, cut: true, s: (f) => ({ pos: add(PAD, [-150, 3, 150]), look: add(STACK_MID(f), [0, -16, 4]), fov: 22, roll: -0.02 }) },
  // ---- the spacewalk: two astronauts, the robot arm, the box; Earth below ----
  { f: CUT.walk, cut: true, s: (f) => ({ pos: orbitAt(add(HUB, [-2.6, 0, 3.4]), 15, 4.5, 1.75, 0.004, f, CUT.walk), look: add(HUB, [-2.6, -0.4, 3.4]), fov: 46, roll: 0.04 }) },
  { f: T.install - 1, cut: true, s: (f) => dolly(add(HUB, [2.6, 1.6, 11.5]), add(HUB, [-1.4, 0.2, 4.2]), pushK(f, T.install - 1, 0.004), { fov: 40, roll: -0.03 }) },
  // "One slip": in close on the glove... the wrench gets away
  { f: T.one - 1, cut: true, s: (f) => dolly(add(HUB, [-2.9, 2.9, 6.4]), add(HUB, [-4.3, 2.3, 3.0]), pushK(f, T.one - 1, 0.006), { fov: 36, roll: 0.05 }) },
  // "...and Hubble is dead": the wrench tumbling off into the dark as the orbit carries them into night
  { f: T.slip + 15, cut: true, s: (f) => ({ pos: add(HUB, [-4.35 + 1.55, 2.25 + 0.95, 2.95 + 3.0]), look: add(HUB, [-4.35 + 0.15, 2.25 + 0.05, 2.95 + 0.2]), fov: 40, roll: -0.08 }) },
  // ---- sunrise: they slide the box in (clunk on "in") ----
  { f: T.slideL, cut: true, s: (f) => dolly(add(HUB, [3.4, 1.1, 9.4]), add(HUB, [-1.6, 0.1, 2.5]), pushK(f, T.slideL, 0.005), { fov: 38, roll: 0.02 }) },
  // ---- "the little arms unfold": back inside the schematic, low and close ----
  { f: CUT.arms, cut: true, s: (f) => ({ pos: orbitAt(add(CLN, [0.4, 1.45, 0]), 2.5, -0.15, 0.3, 0.008, f, CUT.arms), look: add(CLN, [0.35, 1.2, 0]), fov: 40, roll: -0.03 }) },
  // ---- 1994, the control room again: the new picture arrives line by line... and snaps razor sharp; the room erupts ----
  { f: CUT.control2, cut: true, s: (f) => dolly(add(CTL, [0.5, 2.5, 4.9]), add(CTL, [0, 2.55, -9]), pushK(f, CUT.control2, 0.005), { fov: 46, roll: 0.0 }) },
  { f: T.loads, cut: true, s: (f) => dolly(add(CTL, [0.25, 2.62, 0.6]), add(CTL, [0, 2.6, -9]), pushK(f, T.loads, 0.004), { fov: 42, roll: 0.01 }) },
  { f: T.razor, dur: 4, s: (f) => dolly(add(CTL, [0.25, 2.62, 0.6]), add(CTL, [0, 2.6, -9]), pushK(f, T.loads, 0.004), { fov: 27, roll: -0.02 }) },
  { f: T.sharp + 3, cut: true, s: (f) => dolly(add(CTL, [-1.55, 1.2, -6.4]), add(CTL, [-1.25, 1.85, -1.2]), pushK(f, T.sharp + 3, 0.004), { fov: 48, roll: 0.03 }) },
  // ---- the press conference: the senator who called it a turkey holds up the before-and-after for the cameras ----
  { f: CUT.press, cut: true, s: (f) => dolly(add(PRS, [0.5, 1.6, 6.2]), add(PRS, [0, 1.75, -1.3]), pushK(f, CUT.press, 0.004), { fov: 34, roll: 0.0 }) },
  { f: T.cameras - 1, cut: true, s: (f) => dolly(add(PRS, [-0.5, 1.75, 2.8]), add(PRS, [0, 1.95, -1.3]), pushK(f, T.cameras - 1, 0.006), { fov: 38, roll: -0.02 }) },
  { f: T.troubleW - 3, cut: true, s: (f) => dolly(add(PRS, [0.45, 1.85, 1.9]), add(PRS, [0.22, 2.0, -1.3]), pushK(f, T.troubleW - 3, 0.006), { fov: 38, roll: 0.02 }) },
  // ---- "...is over": into the sharp picture - a nebula fills the frame ----
  { f: CUT.neb, cut: true, s: (f) => ({ pos: add(NEB, [0, 0, 26.5 - (f - CUT.neb) * 0.22]), look: NEB, fov: 40, roll: 0.0 }) },
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
/** camera motion blur strength per shot (1 = full): a tracking shot keeps its subject crisp, so it gets only a little */
export const blurScale = (f: number) => ((f >= T.hubble && f < CUT.control) || (f >= CUT.nightpad && f < CUT.walk) ? 0.25 : 1);
/** true on frames where a hard cut lands (no motion blur across a cut) */
export const isCut = (f: number) => KEYS.some((k) => k.cut && (f === k.f || f === k.f + 1));
// impact kicks: the image jolts, flipping sign every frame and decaying over 7 frames
const KICKS: [number, number][] = [[T.telescope, 0.4], [LAUNCHES[0].srb, 0.7], [T.freeze, 0.5], [T.glasses, 0.35], [T.slip, 0.45], [T.inW, 0.6], [T.razor, 0.5]];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) { const n = f - f0; if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
/** handheld / tension shake: [from, to, amplitude in degrees-ish] */
const SHAKES: [number, number, number][] = [[LAUNCHES[0].ssme, T.launches + 3, 2.6], [T.launches + 3, T.hubble, 1.1], [T.hubble, CUT.control, 1.3], [CUT.nightpad, CUT.walk, 1.4], [T.one, T.slip + 15, 1.0]];
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
  if (f < CUT.arms) return "space";
  if (f < CUT.control2) return "clean";
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
  { f: CUT.pad, cInf: 7, focus: () => add(CLOCK_FACE, [0, 0.25, 0]) },                 // the clock sharp, the shuttle soft...
  { f: CUT.pad + 12, dur: 16, cInf: 2.2, focus: (f) => STACK_MID(f) },                 // ...rack focus onto the shuttle
  { f: T.nasa - 5, cInf: 3, focus: () => add(PAD, [0, DECK + 8, 8]) },
  { f: T.launches + 3, cInf: 9, focus: () => add(PAD, PADL.press) },                    // faces sharp, background soft
  { f: T.hubble, cInf: 2, focus: (f) => STACK_MID(f) },
  { f: CUT.control, cInf: 4, focus: () => add(CTL, [0, 2.6, -9]) },                     // the screen sharp, the heads in front soft
  { f: T.completely, cInf: 6, focus: () => add(CTL, [-1.6, 1.26, -3.7]) },
  { f: T.blurry, cInf: 8, focus: () => add(CTL, [-1.42, 0.86, -4.34]) },                // the mug sharp, his face just soft behind it
  { f: CUT.tube, cInf: 6, focus: () => add(TUB, [0, 0, -6.7]) },                         // the vanes rush past soft, the mirror sharp
  { f: T.fiftieth, cInf: 7, focus: () => add(MAC, [0, HAIR_R, -2.5]) },
  { f: T.human - 3, dur: 18, cInf: 4, focus: () => add(MAC, [-1.0, 0.3, -1.2]) },
  { f: CUT.studio, cInf: 7, focus: () => add(STU, [-1.4, 1.95, -3.1]) },                 // the host sharp, the audience heads soft
  { f: CUT.senate, cInf: 7, focus: () => add(SEN, [0, 1.85, -2.7]) },
  { f: T.turkey, cInf: 5, focus: () => add(SEN, [0, 1.85, -2.7]) },
  { f: CUT.orbit2, cInf: 3, focus: () => HUB },
  { f: CUT.field, cInf: 6, focus: () => add(FLD, [0, LADDER_H + 0.4, 0]) },
  { f: T.climb + 2, dur: 22, cInf: 1.5, focus: () => add(FLD, [0, 12, 0]) },
  { f: CUT.street, cInf: 5, focus: (f) => [crocWalkX(f), 1.6, 7.4] },
  { f: T.german - 2, dur: 20, cInf: 2, focus: () => [WIN.x, HB + 1.7, FACADE_Z] },
  { f: CUT.bath2, cInf: 9, focus: () => add(CROC_HEAD, [0.2, 0, 0]) },
  { f: T.head2, cInf: 14, focus: (f) => [RAIL.x, showerHead(f).y, RAIL.z + 0.24] },
  { f: T.freeze, cInf: 12, focus: () => add(CROC_HEAD, [0, -0.1, 0.25]) },
  { f: CUT.clean, cInf: 3, focus: () => add(CLN, [0.6, 1.15, 0]) },
  { f: CUT.glasses, cInf: 5, focus: () => add(HUB, [6.9, 0.15, 0]) },
  { f: CUT.nightpad, cInf: 2, focus: (f) => STACK_MID(f) },
  { f: CUT.walk, cInf: 3, focus: () => add(HUB, [-2.6, -0.4, 3.4]) },
  { f: T.install - 1, cInf: 6, focus: () => add(HUB, [-1.4, 0.2, 4.2]) },
  { f: T.one - 1, cInf: 10, focus: () => add(HUB, [-4.35, 2.25, 2.95]) },
  { f: T.slip + 15, cInf: 9, focus: (f) => { const w = wrenchAt(f).d; return add(HUB, [-4.35 + w[0], 2.25 + w[1], 2.95 + w[2]]); } },
  { f: T.slideL, cInf: 5, focus: () => add(HUB, [-1.7, 0.1, 2.4]) },
  { f: CUT.arms, cInf: 4, focus: () => add(CLN, [0.35, 1.2, 0]) },
  { f: CUT.control2, cInf: 4, focus: () => add(CTL, [0, 2.6, -9]) },
  { f: T.sharp + 3, cInf: 6, focus: () => add(CTL, [-1.6, 1.26, -3.7]) },
  { f: CUT.press, cInf: 7, focus: () => add(PRS, [0, 1.75, -1.35]) },
  { f: CUT.neb, cInf: 0 },
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
