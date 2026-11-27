// "The Plimsoll Line": layout, one continuous camera for the film, light by place, lens, kicks.
// Everything is timed to the narration (words.json from shorts/plimsoll/voice/align.py): wf(line, word) = start frame.
import WORDS from "./words.json";
import VT from "./voicetiming.json";
import type { LightName } from "./lights";

export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };

type W = { w: string; s: number; e: number; line: string };
export const WORDS_T = WORDS as W[];
/** frame at which `word` (prefix match, case-insensitive) starts inside narration line `line` (nth occurrence) */
export const wf = (line: string, word?: string, nth = 0): number => {
  const ws = WORDS_T.filter((w) => w.line === line);
  if (!word) return Math.round(ws[0].s * FPS);
  const hit = ws.filter((w) => w.w.replace(/[^a-z0-9']/gi, "").toLowerCase().startsWith(word.toLowerCase()))[nth];
  return Math.round((hit ?? ws[0]).s * FPS);
};
export const TOTAL = Math.round((VT as { total: number }).total * FPS);
export const talking = (f: number) => WORDS_T.some((w) => f >= w.s * FPS - 1 && f < w.e * FPS);

// ---------------- world layout ----------------
export const WATER = -6;                 // Thames surface
export const BED = -24;                  // riverbed
export const PLIM: V3 = [-1.55, 0, 3.0]; // Plimsoll on his feet in front of the first bench (west side)
export const WIN = { x: -7.4, y: 7.5, z: 3.0 };   // the hook window in the west wall
export const COFFIN: V3 = [-34, WATER + 0.35, 2];  // the overloaded ship below the window (deck barely above water)
export const HOARD: V3 = [-44, BED, 4];             // burst sack of insurance gold on the riverbed
export const WRECK: V3 = [-52.7, BED + 1.7, 8.8];   // the sunken ship on its side, right behind the hoard in the final framing

// ---------------- clocks ----------------
export const T = {
  parliament: wf("hook", "parliament"), villains: wf("hook", "villains"), over: wf("hook", "over"), ships: wf("hook", "ships"),
  bottom: wf("hook", "bottom"), sea: wf("hook", "sea"), yousee: wf("yousee"),
};

// ---------------- camera: one continuous path, keys blended with an ease-in-out glide ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixC = (a: Cam, b: Cam, t: number): Cam => ({
  pos: [lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t)],
  look: [lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t)],
  fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll, b.roll, t),
});
/** subject grows ~rate per frame since f0 (holds always creep in) */
const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const HEAD = add(PLIM, [0, 1.5, 0]);
const KEYS: Key[] = [
  // HOOK 1: medium on Plimsoll mid-shout, creeping in; the bench rows of recoiling MPs recede behind him
  { f: 0, s: (f) => dolly(add(PLIM, [1.95, 1.55, 2.65]), add(HEAD, [-0.05, -0.12, 0]), pushK(f, 0, 0.0028), { fov: 40, roll: 0.03 }) },
  // HOOK 2 ("over ships"): crane up over his head straight at the west window, casements swinging open
  { f: T.villains + 8, dur: 10, s: () => ({ pos: [-0.6, 5.3, 5.0], look: [WIN.x, WIN.y - 0.6, WIN.z], fov: 42, roll: -0.06 }) },   // whip up to the glowing window
  { f: T.villains + 13, dur: 24, s: () => ({ pos: [-6.7, WIN.y - 0.15, WIN.z + 0.05], look: [-14, WIN.y - 1.6, WIN.z - 0.2], fov: 44, roll: -0.04 }) },
  // HOOK 3 ("worth more"): out over the Thames at dusk, dropping toward the coffin ship sitting low in the water
  { f: T.ships + 7, dur: 20, s: () => ({ pos: [-17, 3.2, 2.9], look: [COFFIN[0] - 2, WATER + 0.2, COFFIN[2] - 1.5], fov: 46, roll: 0.05 }) },
  // HOOK 4 ("bottom"): dive in beside its hull and down through the green water
  { f: T.bottom - 11, dur: 17, s: () => ({ pos: [COFFIN[0] + 2.0, WATER - 3.4, COFFIN[2] + 3.2], look: [HOARD[0] + 1, BED + 1, HOARD[2]], fov: 46, roll: -0.03 }) },
  // HOOK 5 ("of the sea"): glide down onto the burst sack of gold on the riverbed, then a slow push
  { f: T.bottom + 4, dur: 22, s: (f) => dolly([HOARD[0] + 4.4, BED + 3.6, HOARD[2] - 2.6], [HOARD[0] - 0.6, BED + 0.6, HOARD[2] + 0.3], pushK(f, T.bottom + 26, 0.004), { fov: 44, roll: 0.02 }) },
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
// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [[T.villains, 1.1], [T.parliament, 0.4], [T.bottom + 1, 0.6]];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) { const n = f - f0; if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
export const camAt = (f: number): Cam => {
  const c = run(f), a = kickAt(f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- light follows the camera: inside the chamber, out over the river, under the water ----------------
export type Place = "chamber" | "river" | "under";
export const placeAt = (f: number): Place => {
  const c = run(f);
  if (c.pos[1] < WATER) return "under";
  return c.pos[0] > WIN.x - 0.15 ? "chamber" : "river";
};
export const LIGHT_OF: Record<Place, LightName> = { chamber: "candle", river: "dusk", under: "under" };
/** sun direction per place, world space (fixed: the camera moves continuously through each place) */
export const SUN_OF: Record<Place, V3> = { chamber: [0.55, 0.8, 0.25], river: [-0.6, 0.24, -0.76], under: [-0.15, 0.97, 0.1] };

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 11, focus: () => HEAD },                 // Plimsoll medium: the MPs behind go soft
  { f: T.villains + 9, dur: 10, cInf: 1 },               // the crane and the flight: everything sharp
  { f: T.bottom + 4, dur: 18, cInf: 7, focus: () => [HOARD[0] - 0.2, BED + 0.4, HOARD[2]] },
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
