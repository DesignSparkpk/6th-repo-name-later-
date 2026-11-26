// "The Architect Who Built Two Death Rays": shot plan, cameras, lens, kicks. Everything is timed to the narration
// (words.json from shorts/death-ray/voice/make_voice.py): wf(line, word) gives the frame a word starts.
import WORDS from "./words.json";
import VT from "./voicetiming.json";
import type { LightName } from "./lights";

export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

type W = { w: string; s: number; e: number; line: string };
const WL = WORDS as W[];
/** frame at which `word` (prefix match, case-insensitive) starts inside narration line `line` (nth occurrence) */
export const wf = (line: string, word?: string, nth = 0): number => {
  const ws = WL.filter((w) => w.line === line);
  if (!word) return Math.round(ws[0].s * FPS);
  const hit = ws.filter((w) => w.w.replace(/[^a-z0-9']/gi, "").toLowerCase().startsWith(word.toLowerCase()))[nth];
  return Math.round((hit ?? ws[0]).s * FPS);
};
export const lineEnd = (line: string) => Math.round((VT as { lines: { key: string; e: number }[] }).lines.find((l) => l.key === line)!.e * FPS);
export const WORDS_T = WL;
export const TOTAL = Math.round(((VT as { total: number }).total - 0.12) * FPS);

// ---------------- world layout ----------------
/** Las Vegas set around the origin: pool, deck, curved hotel to the north (-z) */
export const POOL = { x0: -12, x1: 12, z0: -5, z1: 5 };
export const HOTEL = { cx: 0, cz: 40, r: 78, depth: 24, a0: 214, a1: 326, h: 118 };
export const GUEST: V3 = [3, 0, 9.2];
export const TABLE: V3 = [4.65, 0, 8.7];
export const BAR: V3 = [-15.5, 0, 9.5];
/** London street, shifted along x */
export const LX = 600;
export const TOWER = { x: LX, z: -12, h: 155, hw0: 21, hw1: 30, lean: 15, back: -52 };
export const CAR: V3 = [LX + 4, 0, 3.25];
export const SPOT: V3 = [LX + 4.2, 0, 4.6];
export const SHOP: V3 = [LX + 12.5, 0, 8.55];
export const PAN: V3 = [LX + 7.6, 0, 6.7];
/** park for the magnifying-glass insert */
export const PX = 1200;
export const LEAF: V3 = [PX + 0.42, 0, 0.55];

// ---------------- shots ----------------
export type SetName = "vegas" | "london" | "park";
export type ShotDef = { id: number; a: number; b: number; light: LightName; set: SetName; sunAz?: number; sunEl?: number };
const F = (k: string) => wf(k);
const S_ = [
  { set: "london", light: "day", a: 0, sunAz: 120, sunEl: 40 },            // 1 hook: melting mirror ECU
  { set: "london", light: "day", a: F("hook2"), sunAz: 140 },              // 2 proud architect + tower
  { set: "vegas", light: "desert", a: F("vegas") },                        // 3 aerial down the curved hotel to the pool
  { set: "vegas", light: "desert", a: F("hair1"), sunAz: 150, sunEl: 60 }, // 4 guest on the lounger
  { set: "vegas", light: "desert", a: F("cups"), sunAz: 130 },             // 5 table insert: bag + cups
  { set: "vegas", light: "desert", a: F("complain"), sunAz: 120 },         // 6 bar: the staff giggle
  { set: "vegas", light: "desert", a: F("umb1"), sunAz: 110 },             // 7 bigger umbrellas
  { set: "london", light: "day", a: F("london"), sunAz: 160, sunEl: 45 },  // 8 tilt up the tower
  { set: "london", light: "day", a: F("park"), sunAz: 120 },               // 9 the Jaguar parks
  { set: "london", light: "day", a: F("melt"), sunAz: 120 },               // 10 melted x3
  { set: "london", light: "day", a: F("carpet"), sunAz: 130 },             // 11 scorched carpet
  { set: "london", light: "day", a: F("egg"), sunAz: 120 },                // 12 reporter + pan
  { set: "london", light: "day", a: F("wait") - 4, sunAz: 120 },           // 13 egg ECU
  { set: "park", light: "day", a: F("yousee"), sunAz: 120, sunEl: 52 },    // 14 kid + magnifying glass
  { set: "london", light: "day", a: F("explain"), sunAz: 150, sunEl: 42 }, // 15 the rays converge
  { set: "london", light: "day", a: F("shades"), sunAz: 150 },             // 16 sunshades slide on
  { set: "london", light: "day", a: F("excuse"), sunAz: 120 },             // 17 architect shrugs
  { set: "london", light: "day", a: F("quote"), sunAz: 100, sunEl: 40 },   // 18 the quote, squinting at the sun
  { set: "london", light: "overcast", a: F("end") - 3 },                   // 19 "In London." pouring rain
] as const;
export const SHOTS: ShotDef[] = S_.map((s, i) => ({ ...(s as unknown as ShotDef), id: i + 1, b: i + 1 < S_.length ? S_[i + 1].a : TOTAL }));
/** crossfades (frames) INTO shot id, at place changes; everything else is a cut (the hook flash covers 2 -> 3) */
export const XFADE: Record<number, number> = { 8: 6, 14: 8, 15: 8 };
export const FLASH_AT = SHOTS[2].a;
export const FLASHES = [SHOTS[2].a, SHOTS[7].a];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  const s = shotAt(f), x = XFADE[s.id];
  if (x && f < s.a + x && s.id > 1) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: smooth((f - s.a + 1) / (x + 1)) }];
  return [{ id: s.id, alpha: 1 }];
};

// ---------------- story clocks (all in frames) ----------------
export const T = {
  mirrorMelt0: -20, mirrorMelt1: wf("hook1", "car") + 6,
  ribbon: wf("vegas", "opens"),
  sniff: wf("hair1", "burning"), own: wf("hair2", "own"),
  bag: wf("cups", "bag"), cups: wf("cups", "cups"),
  giggle: wf("complain", "giggle"), staff: wf("staff"),
  bigger: wf("umb2", "bigger"),
  wave: wf("london", "architect"), curve: wf("london", "curve"),
  parks: wf("park", "parks"), walkOff: wf("park", "street") - 8,
  back: wf("melt", "back"), mMirror: wf("melt", "melted", 0), mBadge: wf("melt", "melted", 1), mPanels: wf("melt", "melted", 2),
  scorch: wf("carpet", "scorched"),
  pan: wf("egg", "frying"), cooks: wf("egg", "cooks"), eggIn: wf("egg", "egg"),
  wait: wf("wait"), leaf: wf("leaf", "leaf"), trick: wf("leaf", "trick"),
  catches: wf("explain", "catches"), squeezes: wf("explain", "squeezes"), spot: wf("explain", "spot"), fifteen: wf("explain", "fifteen"),
  bolting: wf("shades", "bolting"), shrug: wf("excuse", "explanation"), sunny: wf("quote", "sunny"), rain: wf("end"),
};
/** melt progress of the car parts 0..1 (the mirror starts mid-melt on frame 0 of the hook) */
export const meltAt = (f: number, part: "mirror" | "badge" | "panels"): number => {
  if (f < SHOTS[7].a) return part === "mirror" ? 0.35 + 0.65 * smooth((f - T.mirrorMelt0) / (T.mirrorMelt1 - T.mirrorMelt0)) : 0.4;
  if (f < T.back) return 0; // flashback: the car is fine until he comes back
  const t0 = part === "mirror" ? T.mMirror - 18 : part === "badge" ? T.mBadge - 18 : T.mPanels - 18;
  return 0.55 + 0.45 * smooth((f - t0) / 24);
};
/** hot spot strength on the London street 0..1 (fades after the sunshades) */
export const londonSpot = (f: number) => {
  if (f >= SHOTS[18].a) return 0;
  if (f >= T.bolting) return 1 - smooth((f - T.bolting - 20) / 40);
  return 1;
};

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** subject grows ~rate per frame since f0 (every hold creeps); punch raises it for n frames with soft edges */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 30) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** mirror on the near (south, +z) side of the car, at the front of the cabin */
export const MIRROR: V3 = [CAR[0] + 0.95, 1.08, CAR[2] + 0.98];
export const BADGE: V3 = [CAR[0] + 2.36, 0.78, CAR[2]];
export const PANEL: V3 = [CAR[0] - 0.4, 0.62, CAR[2] + 0.93];
const ARCH2: V3 = [LX - 5.5, 0, 7.4];
export const ARCH_Q: V3 = [LX - 1.5, 0, 7.2];
const KID: V3 = [PX, 0, 0];

const s1 = SHOTS[0], s3 = SHOTS[2], s8 = SHOTS[7], s10 = SHOTS[9], s15 = SHOTS[14];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => dolly(add(MIRROR, [1.75, 0.75, 1.55]), add(MIRROR, [-0.35, -0.3, -0.25]), pushK(f, 0, 0.005, 0.013, 28), { fov: 42, roll: -0.05 }) }],
  2: [{ f: SHOTS[1].a, s: (f) => dolly(add(ARCH2, [0.4, 1.25, 4.1]), add(ARCH2, [0.1, 1.55, 0]), pushK(f, SHOTS[1].a, 0.0035, 0.01, 20), { fov: 40, roll: 0.04 }) }],
  3: [
    { f: s3.a, s: (f) => ({ pos: [6, 96 - (f - s3.a) * 0.05, 82], look: [0, 64, -38], fov: 42 }) },
    { f: s3.a + 40, dur: 90, s: (f) => ({ pos: [2, 8, 30 - (f - s3.a - 40) * 0.01], look: [0, 3, -4], fov: 42 }) },
    { f: T.ribbon + 8, dur: 30, s: (f) => dolly([1.5, 2.2, 15.5], [0, 1.5, 7.6], pushK(f, T.ribbon + 8, 0.003), { fov: 40 }) },
  ],
  4: [
    { f: SHOTS[3].a, s: (f) => dolly(add(GUEST, [-0.6, 1.25, 3.4]), add(GUEST, [0.05, 0.85, 0]), pushK(f, SHOTS[3].a, 0.003), { fov: 40, roll: 0.03 }) },
    { f: T.own - 2, dur: 10, s: (f) => dolly(add(GUEST, [-0.35, 1.25, 2.2]), add(GUEST, [0.05, 1.15, 0]), pushK(f, T.own - 2, 0.004), { fov: 38, roll: -0.04 }) },
  ],
  5: [{ f: SHOTS[4].a, s: (f) => dolly(add(TABLE, [0.15, 1.05, 1.35]), add(TABLE, [0, 0.62, 0]), pushK(f, SHOTS[4].a, 0.004, 0.012, 20), { fov: 38, roll: 0.05 }) }],
  6: [
    { f: SHOTS[5].a, s: (f) => dolly(add(BAR, [2.2, 1.6, 4.2]), add(BAR, [0.9, 1.35, 0]), pushK(f, SHOTS[5].a, 0.0025), { fov: 40 }) },
    { f: T.staff - 2, dur: 18, s: (f) => dolly(add(BAR, [1.9, 1.7, 3.7]), add(BAR, [1.1, 1.45, -0.3]), pushK(f, T.staff - 2, 0.004), { fov: 42, roll: 0.04 }) },
  ],
  7: [
    { f: SHOTS[6].a, s: (f) => dolly(add(GUEST, [1.5, 2.6, 8.0]), add(GUEST, [-0.3, 1.6, 0]), pushK(f, SHOTS[6].a, 0.002), { fov: 42 }) },
    { f: T.bigger - 2, dur: 20, s: (f) => dolly(add(GUEST, [1.4, 3.6, 10.0]), add(GUEST, [-0.2, 2.6, 0]), pushK(f, T.bigger - 2, 0.002), { fov: 44, roll: -0.06 }) },
  ],
  8: [
    { f: s8.a, s: (f) => ({ pos: [LX + 2.5, 1.5, 7.6], look: [LX, 14, -20], fov: 46, roll: 0.02 }) },
    { f: s8.a + 10, dur: 70, s: (f) => ({ pos: [LX + 2.5, 1.4, 7.8], look: [LX, 120, -16], fov: 52, roll: -0.06 }) },
    { f: T.curve - 3, dur: 14, s: (f) => zoom([LX + 2.5, 1.4, 7.8], [LX - 2, 110, -12], 36, pushK(f, T.curve - 3, 0.004), { roll: -0.07 }) },
  ],
  9: [{ f: SHOTS[8].a, s: (f) => dolly([CAR[0] + 6.5, 1.7, 11.4], [CAR[0] + 0.6, 1.0, 4.8], pushK(f, SHOTS[8].a, 0.0022), { fov: 42, roll: 0.02 }) }],
  10: [
    { f: s10.a, s: (f) => dolly([CAR[0] + 4.6, 1.6, 9.6], [CAR[0] + 1.2, 1.25, 5.2], pushK(f, s10.a, 0.003), { fov: 42 }) },
    { f: T.mMirror - 6, cut: true, s: (f) => dolly(add(MIRROR, [0.5, 0.28, 1.0]), MIRROR, pushK(f, T.mMirror - 6, 0.005), { fov: 36, roll: 0.06 }) },
    { f: T.mBadge - 6, cut: true, s: (f) => dolly(add(BADGE, [1.25, 0.32, 0.55]), BADGE, pushK(f, T.mBadge - 6, 0.005), { fov: 36, roll: -0.06 }) },
    { f: T.mPanels - 6, cut: true, s: (f) => dolly(add(PANEL, [0.4, 0.45, 2.3]), PANEL, pushK(f, T.mPanels - 6, 0.004), { fov: 38, roll: 0.05 }) },
  ],
  11: [{ f: SHOTS[10].a, s: (f) => dolly(add(SHOP, [-1.2, 1.4, -3.6]), add(SHOP, [0, 0.9, 0]), pushK(f, SHOTS[10].a, 0.004), { fov: 40, roll: -0.04 }) }],
  12: [
    { f: SHOTS[11].a, s: (f) => dolly(add(PAN, [-2.6, 1.6, -3.8]), add(PAN, [0.6, 1.0, 0]), pushK(f, SHOTS[11].a, 0.0025), { fov: 42 }) },
    { f: T.cooks - 4, dur: 18, s: (f) => dolly(add(PAN, [-1.1, 1.0, -1.7]), add(PAN, [0.35, 0.3, 0]), pushK(f, T.cooks - 4, 0.004), { fov: 38, roll: 0.05 }) },
  ],
  13: [{ f: SHOTS[12].a, s: (f) => dolly(add(PAN, [-0.25, 0.62, -0.7]), add(PAN, [0, 0.05, 0]), pushK(f, SHOTS[12].a, 0.006, 0.014, 16), { fov: 34, roll: -0.05 }) }],
  14: [
    { f: SHOTS[13].a, s: (f) => dolly(add(KID, [1.6, 1.0, 3.0]), add(KID, [0.3, 0.75, 0.3]), pushK(f, SHOTS[13].a, 0.0025), { fov: 40 }) },
    { f: T.leaf - 6, dur: 16, s: (f) => dolly(add(LEAF, [0.35, 0.55, 1.1]), add(LEAF, [0, 0.05, 0]), pushK(f, T.leaf - 6, 0.004), { fov: 36, roll: 0.05 }) },
    { f: T.trick - 4, dur: 14, s: (f) => dolly(add(KID, [1.1, 1.0, 2.2]), add(KID, [0.25, 1.0, 0.2]), pushK(f, T.trick - 4, 0.004), { fov: 38 }) },
  ],
  15: [
    { f: s15.a, s: (f) => ({ pos: [LX + 34, 24, 46], look: [LX + 2, 22, -6], fov: 50 }) },
    { f: T.squeezes - 10, dur: 40, s: (f) => dolly([LX + 22, 9, 26], [SPOT[0], 1.2, SPOT[2]], pushK(f, T.squeezes - 10, 0.0015), { fov: 46 }) },
    { f: T.fifteen - 3, dur: 16, s: (f) => dolly([SPOT[0] + 5, 2.6, SPOT[2] + 8], [SPOT[0], 0.6, SPOT[2]], pushK(f, T.fifteen - 3, 0.003, 0.01, 18), { fov: 42, roll: -0.05 }) },
  ],
  16: [{ f: SHOTS[15].a, s: (f) => ({ pos: [LX + 26, 30, 40], look: [LX, 70 + (f - SHOTS[15].a) * 0.05, -14], fov: 50, roll: 0.03 }) }],
  17: [{ f: SHOTS[16].a, s: (f) => dolly(add(ARCH_Q, [0.6, 1.3, 3.7]), add(ARCH_Q, [0.05, 1.5, 0]), pushK(f, SHOTS[16].a, 0.003), { fov: 40 }) }],
  18: [{ f: SHOTS[17].a, s: (f) => dolly(add(ARCH_Q, [-0.4, 1.0, 2.9]), add(ARCH_Q, [0.0, 1.6, 0]), pushK(f, SHOTS[17].a, 0.0022, 0.006, 20), { fov: 38, roll: -0.03 }) }],
  19: [{ f: SHOTS[18].a, s: (f) => dolly(add(ARCH_Q, [0.2, 1.45, 3.4]), add(ARCH_Q, [0.0, 1.45, 0]), pushK(f, SHOTS[18].a, 0.004), { fov: 40 }) }],
};

// impact kicks: image offset flips sign every frame and decays over 7 f
const KICKS: [number, number][] = [
  [wf("hook1", "melted"), 0.8], [wf("hook2", "death"), 0.6], [T.own, 0.9], [T.bigger, 1.0], [T.curve, 0.5],
  [T.mMirror, 1.0], [T.mBadge, 1.0], [T.mPanels, 1.2], [T.scorch, 0.6], [T.eggIn, 0.5], [T.wait, 0.8], [T.trick, 0.5],
  [T.fifteen, 1.0], [T.bolting, 0.6], [T.rain, 1.2],
];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) { const n = f - f0; if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const at = (p: V3, dy = 0) => (): V3 => [p[0], p[1] + dy, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 15 },                                          // mirror ECU
  { f: SHOTS[1].a, cInf: 12, focus: at(ARCH2, 1.6) },         // architect MS
  { f: SHOTS[2].a, cInf: 0 },                                  // aerial
  { f: T.ribbon + 8, dur: 30, cInf: 9, focus: () => [0, 1.6, 7.6] },
  { f: SHOTS[3].a, cInf: 12, focus: at(GUEST, 1.1) },         // guest MS
  { f: SHOTS[4].a, cInf: 15 },                                 // table insert
  { f: SHOTS[5].a, cInf: 11, focus: () => [BAR[0] + 0.6, 1.5, BAR[2]] },
  { f: SHOTS[6].a, cInf: 6 },                                  // umbrellas
  { f: SHOTS[7].a, cInf: 0 },                                  // tower tilt
  { f: SHOTS[8].a, cInf: 6 },                                  // parking
  { f: SHOTS[9].a, cInf: 10 },                                 // owner returns + inserts
  { f: T.mMirror - 6, cInf: 15 },
  { f: SHOTS[10].a, cInf: 12 },                                // carpet
  { f: SHOTS[11].a, cInf: 10 },                                // reporter
  { f: SHOTS[12].a, cInf: 16 },                                // egg ECU
  { f: SHOTS[13].a, cInf: 11 },                                // kid
  { f: T.leaf - 6, cInf: 15 },
  { f: T.trick - 4, cInf: 11 },
  { f: SHOTS[14].a, cInf: 0 },                                 // explanation wide
  { f: T.fifteen - 3, dur: 16, cInf: 9 },
  { f: SHOTS[15].a, cInf: 0 },                                 // sunshades
  { f: SHOTS[16].a, cInf: 12, focus: at(ARCH_Q, 1.6) },       // architect MS / CU
  { f: SHOTS[18].a, cInf: 9, focus: at(ARCH_Q, 1.6) },        // rain
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
