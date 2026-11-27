// "I Just Don't Like You" (Lee Iacocca): layout, clocks, one continuous camera, light by place, lens, kicks, shake.
// Everything is timed to the narration (shorts/iacocca/voice: words.json): wf(line, word) = start frame of that word.
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
export const wf = (line: string, word?: string, nth = 0): number => {
  const ws = WORDS_T.filter((w) => w.line === line);
  if (!word) return Math.round(ws[0].s * FPS);
  const hit = ws.filter((w) => w.w.replace(/[^a-z0-9']/gi, "").toLowerCase().startsWith(word.toLowerCase()))[nth];
  return Math.round((hit ?? ws[0]).s * FPS);
};
export const TOTAL = Math.round((VT as { total: number }).total * FPS);
/** is a word of phrase `line` being spoken at frame f (lip sync) */
export const speaking = (f: number, line: string) => WORDS_T.some((w) => w.line === line && f >= w.s * FPS - 1 && f < w.e * FPS);

// ---------------- clocks ----------------
export const T = {
  five: wf("hook", "five"), quote: wf("quote"), you: wf("quote", "you"), q: ["I", "just", "don't", "like", "you"].map((w) => wf("quote", w)),
  walked: wf("walked"), company: wf("walked", "company"), billion: wf("walked", "billion"), turned: wf("turned"), around: wf("turned", "around"),
  yousee: wf("yousee"), mustang: wf("yousee", "mustang"), fired: wf("fired"), anyway: wf("fired", "anyway"),
  dying: wf("dying"), chrysler: wf("dying", "chrysler"), dyingW: wf("dying", "dying"),
  salary: wf("salary"), dollar: wf("dollar"), dollarW: wf("dollar", "dollar"),
  worse: wf("worse"), beg: wf("beg"), begW: wf("beg", "beg"), congress: wf("beg", "congress"), billion15: wf("beg", "billion"),
  critics: wf("critics"), letdie: wf("letdie"), yes: wf("yes"), yesW: wf("yes", "yes"), catchL: wf("catch"), catchW: wf("catch", "catch"),
  find: wf("find"), own: wf("find", "own"), found: wf("found"), paid: wf("paid"), paidW: wf("paid", "paid"), back: wf("paid", "back"),
  seven: wf("seven"), early: wf("seven", "early"), later: wf("later"), profit: wf("profit"), profitW: wf("profit", "profit"),
  boss: wf("boss"), like: wf("like"), should: wf("should"), firedEnd: wf("should", "fired"), him: wf("should", "him", 0),
};

// ---------------- world layout: every place is its own island ----------------
export const BRD: V3 = [0, 0, 0];          // Ford's boardroom
export const TWR: V3 = [3000, 0, 0];       // the plaza outside the glass tower
export const FAC: V3 = [-3000, 0, 0];      // Chrysler's plant
export const SHW: V3 = [0, 0, 3000];       // the showroom
export const OFF: V3 = [0, 0, -3000];      // his office at Chrysler
export const CON: V3 = [-3000, 0, 3000];   // the hearing hall
export const BNK: V3 = [3000, 0, 3000];    // the bank
/** boardroom layout (relative to BRD) */
export const BOSS: V3 = [0, 0, -3.1];      // the old man stands behind the desk
export const LAMP: V3 = [1.05, 0.8, -2.15];
export const CUP: V3 = [-0.75, 0.8, -1.95];

export const CUT = {
  plaza: T.quote + 40, factory: T.company - 4, show: T.yousee, plaza2: T.fired - 3, factory2: T.dying, office: T.salary, congress: T.worse,
  montage: T.found, bank: T.paid + 4, factory3: T.later, board2: T.boss,
};

// ---------------- the hook's machinery ----------------
/** the plant's loss counter: climbs past a billion on "losing over a billion"; on "turned it around" it runs back;
 *  in the payoff it reads the $2.4 billion profit in green */
export const counterAt = (f: number) => {
  if (f < CUT.show) {
    const up = glide((f - CUT.factory) / (T.billion + 8 - CUT.factory)), back = glide((f - T.turned) / 18);
    return { v: -1_100_000_000 * up * (1 - back), green: false };
  }
  return { v: 2_400_000_000 * glide((f - T.profit) / 22), green: true };
};
/** red ink pouring down the plant's walls (0..1 of the wall height), drawn back up on "turned it around" */
export const inkAt = (f: number) => (f < CUT.show ? smooth((f - CUT.factory) / 30) * (1 - smooth((f - T.turned) / 16)) : f >= CUT.factory2 && f < CUT.office ? 0.55 : 0);
/** the desk lamp pops on "you" */
export const lampPop = (f: number) => f >= T.you + 2 && f < CUT.board2;
/** the hero's flight out of the glass doors: 0..1 */
export const throwAt = (f: number) => clamp01((f - CUT.plaza - 2) / 14);
/** the cars on the line stall one after another (index -> frame) */
export const stallAt = (i: number) => T.company + 6 + i * 3;
/** five ticks over the boss, one per word of the insult */
export const ticksAt = (f: number) => T.q.filter((q) => f >= q).length;

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
export const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

const KEYS: Key[] = [
  // HOOK 1: low across the walnut desk at the old man; he raises one finger. Creep in.
  { f: 0, s: (f) => dolly(add(BRD, [0.5, 1.2, 1.3]), add(BRD, [0.1, 1.7, -3.1]), pushK(f, 0, 0.007), { fov: 40, roll: 0.03 }) },
  // the insult: slam in close on his face, the lamp beside him
  { f: T.quote - 2, cut: true, s: (f) => dolly(add(BRD, [0.62, 1.52, -0.6]), add(BRD, [0.18, 1.6, -3.1]), pushK(f, T.quote - 2, 0.01), { fov: 36, roll: -0.04 }) },
  // HOOK 2: smash cut, low on the wet plaza: he comes flying out of the glass doors at the lens
  { f: CUT.plaza, cut: true, s: (f) => dolly(add(TWR, [1.1, 0.45, 1.8]), add(TWR, [0, 1.0, -5.5]), pushK(f, CUT.plaza, 0.004), { fov: 48, roll: 0.06 }) },
  // HOOK 3: whip-pan onto the plant's wall: the loss counter and the red ink
  { f: CUT.factory, cut: true, s: () => ({ pos: add(FAC, [-7, 2.4, 6]), look: add(FAC, [-6, 4.6, -12]), fov: 52, roll: -0.08 }) },
  { f: CUT.factory + 1, dur: 8, s: (f) => dolly(add(FAC, [0.2, 2.2, 7.5]), add(FAC, [0, 5.0, -12]), pushK(f, CUT.factory + 9, 0.004), { fov: 50, roll: 0.0 }) },
  // "and turned it around": crash zoom onto him standing in front of the wall as the counter runs back
  { f: T.turned - 1, dur: 6, s: () => ({ pos: add(FAC, [0.35, 1.15, 2.4]), look: add(FAC, [0, 3.4, -6]), fov: 46, roll: 0.02 }) },
  // ---- the rest of the film (refined scene by scene) ----
  { f: CUT.show, cut: true, s: (f) => dolly(add(SHW, [3.2, 1.0, 6.5]), add(SHW, [0, 1.2, 0]), pushK(f, CUT.show, 0.004), { fov: 42 }) },
  { f: CUT.plaza2, cut: true, s: () => ({ pos: add(TWR, [1.8, 0.25, 1.2]), look: add(TWR, [0.6, 0.15, -2.5]), fov: 40 }) },
  { f: CUT.factory2, cut: true, s: (f) => dolly(add(FAC, [0, 1.6, 4]), add(FAC, [0, 1.8, 10]), pushK(f, CUT.factory2, 0.004), { fov: 46 }) },
  { f: CUT.office, cut: true, s: (f) => dolly(add(OFF, [0.4, 1.5, 2.4]), add(OFF, [0, 1.1, -0.4]), pushK(f, CUT.office, 0.005), { fov: 40 }) },
  { f: CUT.congress, cut: true, s: (f) => dolly(add(CON, [0, 2.2, 9]), add(CON, [0, 2.4, -4]), pushK(f, CUT.congress, 0.004), { fov: 46 }) },
  { f: CUT.montage, cut: true, s: (f) => dolly(add(OFF, [-0.6, 1.5, 2.2]), add(OFF, [0, 1.2, -0.4]), pushK(f, CUT.montage, 0.006), { fov: 40 }) },
  { f: CUT.bank, cut: true, s: (f) => dolly(add(BNK, [0.6, 1.5, 2.6]), add(BNK, [0, 1.0, -0.4]), pushK(f, CUT.bank, 0.005), { fov: 40 }) },
  { f: CUT.factory3, cut: true, s: (f) => dolly(add(FAC, [-4, 2.0, 6]), add(FAC, [0, 2.4, -6]), pushK(f, CUT.factory3, 0.004), { fov: 50 }) },
  { f: CUT.board2, cut: true, s: (f) => dolly(add(BRD, [-1.6, 1.5, 0.6]), add(BRD, [0, 1.6, -3.1]), pushK(f, CUT.board2, 0.006), { fov: 36 }) },
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
/** camera motion blur strength per shot (1 = full) */
export const blurScale = (f: number) => (f >= CUT.factory && f < CUT.factory + 10 ? 1.3 : 1);
export const isCut = (f: number) => KEYS.some((k) => k.cut && (f === k.f || f === k.f + 1));
// impact kicks: the image jolts, flipping sign every frame and decaying over 7 frames
const KICKS: [number, number][] = [[0, 0.5], [T.you + 2, 0.6], [CUT.plaza + 15, 0.7], [T.billion, 0.4], [T.turned, 0.5]];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) { const n = f - f0; if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
const SHAKES: [number, number, number][] = [[CUT.factory + 4, T.turned, 0.8]];
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
export const placeAt = (f: number): Place => {
  if (f < CUT.plaza) return "board";
  if (f < CUT.factory) return "plaza";
  if (f < CUT.show) return "factory";
  if (f < CUT.plaza2) return "show";
  if (f < CUT.factory2) return "plaza";
  if (f < CUT.office) return "factory";
  if (f < CUT.congress) return "office";
  if (f < CUT.montage) return "congress";
  if (f < CUT.bank) return "office";
  if (f < CUT.factory3) return "bank";
  if (f < CUT.board2) return "factory";
  return "board";
};
/** key light direction per place, world space */
export const SUN_OF: Record<Place, V3> = {
  board: [0.55, 0.55, 0.62], plaza: [0.3, 0.9, 0.35], factory: [0.35, 0.85, 0.4], show: [0.2, 0.95, 0.25], office: [0.6, 0.6, 0.5], congress: [0.25, 0.92, 0.3], bank: [0.45, 0.8, 0.4],
};
export const sunAt = (_f: number, place: Place): V3 => SUN_OF[place];

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const DOF: Dof[] = [
  { f: 0, cInf: 8, focus: () => add(BRD, [0, 1.65, -3.1]) },
  { f: T.quote - 2, cInf: 12, focus: () => add(BRD, [0, 1.65, -3.0]) },
  { f: CUT.plaza, cInf: 7, focus: (f) => add(TWR, [0, 0.9, lerp(-7.4, -3.2, throwAt(f))]) },
  { f: CUT.factory, cInf: 3 },
  { f: T.turned - 1, dur: 6, cInf: 6, focus: () => add(FAC, [0, 1.62, -2.2]) },
  { f: CUT.show, cInf: 4 },
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
