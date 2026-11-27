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

export const DX = 400;                    // the dock (fog / night / dawn / sunrise)
export const DW = -2.2;                   // dock water level (quay top at y = 0, water for z > 0)
export const DSHIP: V3 = [DX + 2, DW + 1.6, 3.2];  // the rotting ship alongside (deck y moves as it is loaded)
export const OWNER: V3 = [DX - 2.6, 0, -1.6];       // the shipowner on the quay
export const DESK: V3 = [DX + 3.4, 0, -2.4];        // the insurance clerk's desk (a crate) under the office awning
export const CRANE: V3 = [DX - 5.5, 0, -1.0];
export const SX = 1500;                   // the storm at sea
export const PRX = 1900;                  // the printing press
export const QX = 2300;                   // the town square at dusk
export const GX = 2800;                   // the school gym

// ---------------- clocks ----------------
export const T = {
  parliament: wf("hook", "parliament"), villains: wf("hook", "villains"), over: wf("hook", "over"), ships: wf("hook", "ships"),
  bottom: wf("hook", "bottom"), sea: wf("hook", "sea"), yousee: wf("yousee"),
  britain: wf("yousee", "britain"), owners: wf("yousee", "shipowners"), nasty: wf("yousee", "nasty"),
  insure: wf("trick", "over"), rotting: wf("trick", "rotting"), old: wf("trick", "old"), tships: wf("trick", "ships"),
  cram: wf("trick", "cram"), withC: wf("trick", "with"), cargo: wf("trick", "cargo"), until: wf("trick", "until"), floating: wf("trick", "floating"),
  makes: wf("rich", "makes"), rich: wf("rich", "rich"), ifSinks: wf("rich", "if", 1), sinks: wf("rich", "sinks"), richer: wf("rich", "richer"),
  coffin: wf("coffin"), cships: wf("coffin", "ships"), fix: wf("fix"),
  mp: wf("fix", "mp"), plimsoll: wf("fix", "plimsoll"), pushes: wf("fix", "pushes"), simple: wf("fix", "simple"), paint: wf("fix", "paint"),
  everyHull: wf("fix", "hull"), water: wf("fix", "water"), lineQ: wf("fix", "line", 1), stays: wf("fix", "stays"), home: wf("fix", "home"),
  laugh: wf("laugh"), laughW: wf("laugh", "laugh"), linePaint: wf("laugh", "line"), my: wf("laugh", "my"), worse: wf("worse"), plenty: wf("worse", "plenty"),
  parl2: wf("worse", "parliament"), snaps: wf("snaps"),
  bill: wf("snaps", "bill"), dropped: wf("snaps", "dropped"), plimSnap: wf("snaps", "plimsoll"), snapW: wf("snaps", "snaps"),
  yell: wf("yell"), stamps: wf("yell", "stamps"), foot: wf("yell", "foot"), slams: wf("yell", "slams"), table: wf("yell", "table"),
  shakes: wf("yell", "shakes"), fistW: wf("yell", "fist"), yells: wf("yell", "yells"), quoteI: wf("yell", "i"), villains2: wf("yell", "villains"),
  refuse: wf("refuse"), speaker: wf("refuse", "speaker"), orders: wf("refuse", "orders"), back: wf("refuse", "back"), refuses: wf("refuse", "refuses"),
  wife: wf("wife"), gallery: wf("wife", "gallery"), wifeW: wf("wife", "wife"), handing: wf("wife", "handing"), reporters: wf("wife", "reporters"),
  papers: wf("papers"), printW: wf("papers", "print"), every: wf("papers", "every"), wordW: wf("papers", "word"), crowd: wf("papers", "crowd"),
  jokes: wf("papers", "jokes"), ifMr: wf("papers", "if"), mad: wf("papers", "mad"), bite: wf("papers", "bite"), mps: wf("papers", "mps"),
  caves: wf("caves"), cavesW: wf("caves", "caves"), yearA: wf("caves", "a"), british: wf("caves", "british"), wear: wf("caves", "wear"), lineC: wf("caves", "line"),
  shoes: wf("shoes"), rubber: wf("shoes", "rubber"), gym: wf("shoes", "gym"), looked: wf("shoes", "looked"), got: wf("shoes", "got"), name: wf("shoes", "name"),
  plimsolls: wf("shoes", "plimsolls"),
};
/** dawn: Plimsoll strides down the quay toward the camera, stops at the edge with his pot and brush */
export const PL_WALK0: V3 = [DX - 7.2, 0, -1.9], PL_STOP: V3 = [DX - 1.6, 0, -1.25];
export const plimWalk = (f: number): { pos: V3; phase: number; walking: boolean } => {
  const u = smooth((f - (T.fix + 8)) / (T.pushes - 4 - (T.fix + 8)));
  return { pos: [PL_WALK0[0] + (PL_STOP[0] - PL_WALK0[0]) * u, 0, PL_WALK0[2] + (PL_STOP[2] - PL_WALK0[2]) * u], phase: ((f - T.fix) / 30) * 1.6, walking: u > 0.001 && u < 0.999 };
};
/** the mark painted on the sound ship's starboard side (seen from the water), and the harbour master on the quay */
export const MARK: V3 = [DX + 2.4, DW + 1.05, DSHIP[2] + 2.12];
export const HARB: V3 = [DX + 3.6, 0, -1.3];
/** loading at dawn: the water creeps up over the new mark on "Water over the line?" */
export const dawnSink = (f: number) => DW + 1.55 - 0.95 * smooth((f - T.water) / 26);
/** the club: three armchairs by the fire (the main owner first); he gets up on "worse" and strides to the Commons door */
export const CLUB_CHAIRS: [number, number][] = [[-2.2, 19.6], [-2.6, 18.3], [-2.6, 20.9]];
export const ownerWalk = (f: number): { pos: V3; walking: boolean; phase: number } => {
  const u = smooth((f - (T.worse + 6)) / (T.plenty - 11 - (T.worse + 6)));
  return { pos: [-1.6 + 1.4 * u, 0, 19.6 - 3.7 * u], walking: u > 0.001 && u < 0.999, phase: ((f - T.worse) / 30) * 2.2 };
};
/** back in the chamber: he has already taken his seat among the other shipowner MPs (east benches, bar end) */
export const OWNER_SEAT: V3 = [2.21, 0.3, 12.2];
/** the climax in the chamber: the PM at the dispatch box (east), the Speaker's chair (z = -14), the west gallery */
export const PM: V3 = [1.3, 0, 0.25];
export const BIN: V3 = [1.75, 0, 0.95];
export const SPEAKER: V3 = [0, 1.08, -13.85];
export const WIFE: V3 = [-6.35, 4.5, -8.6];
export const REPORTERS: V3[] = [[-6.45, 4.5, -9.6], [-6.25, 4.5, -10.5], [-6.55, 4.5, -7.7]];
/** the ending: the hero pair of plimsolls on the gym floor; Plimsoll on the quay at sunrise */
export const SHOE: V3 = [GX + 0.6, 0, 2.0];
export const PL_OLD: V3 = [DX + 1.2, 0, -0.9];
/** the orator on his crate in the square */
export const ORATOR: V3 = [QX, 0.55, 0];
/** the stamped policy blowing off the clerk's desk and landing against the rotten hull */
export const HULLPT: V3 = [DX + 0.9, DW + 1.05, 1.18];
export const paperAt = (f: number): V3 => {
  const p0: V3 = [DESK[0] - 0.2, 0.92, DESK[2]], c: V3 = [DX + 1.6, 2.6, -0.8], u = glide((f - (T.rotting - 3)) / 20), v = 1 - u;
  return [v * v * p0[0] + 2 * u * v * c[0] + u * u * HULLPT[0], v * v * p0[1] + 2 * u * v * c[1] + u * u * HULLPT[1], v * v * p0[2] + 2 * u * v * c[2] + u * u * HULLPT[2]];
};
/** frames of the hidden cuts: under a rising-bubble wipe into the dock, under lightning flashes in and out of the storm */
export const CUT = { dock: T_DOCK(), storm1: T.ifSinks, night: T.richer - 16, storm2: T.coffin, dawn: T.fix, club: T.laugh, snaps: T.snaps, papers: T.papers,
  square: T.wordW + 11, caves: T.caves, year: T.yearA, shoes: T.shoes };
function T_DOCK() { return wf("yousee") + 6; }
/** crate drops on the beat: [frame, crate index]; plus a fast time-lapse that fills the deck before "until" */
export const DROPS: [number, number][] = [[T.cram, 0], [T.withC, 1], [T.cargo, 2], ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((k, i) => [T.cargo + 6 + i * 2, k] as [number, number])];
/** deck height of the rotting ship: 1.6 m above the water empty, each crate presses it ~0.1 m lower (eased per drop) */
export const shipSink = (f: number) => {
  let d = 0;
  for (const [f0] of DROPS) d += 0.1 * smooth((f - f0) / 5);
  return DW + 1.6 - Math.min(d, 1.35);
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
  // ---- "You see, in Victorian Britain": a rising-bubble wipe hides the cut; rise through the harbour water into the fog ----
  { f: CUT.dock, cut: true, s: (f) => ({ pos: [DX - 9.6, DW - 4.4 + (f - CUT.dock) * 0.05, 4.8], look: [DX - 7.4, DW + 1.2, 1.4], fov: 46, roll: 0.03 }) },
  { f: CUT.dock + 3, dur: 14, s: () => ({ pos: [DX - 8.4, DW + 1.0, 4.2], look: [DX - 3.6, 1.0, -2.2], fov: 44, roll: -0.02 }) },
  // "Britain ... shipowners": arc round the owner onto the quay so his rotting ship looms behind him in the fog
  { f: T.britain - 2, dur: 14, s: () => ({ pos: [DX - 6.6, 1.75, -0.3], look: [OWNER[0], 1.5, OWNER[2]], fov: 42, roll: 0.02 }) },
  { f: T.britain + 12, dur: 16, s: (f) => dolly([DX - 4.8, 1.7, -4.8], [OWNER[0], 1.5, OWNER[2]], pushK(f, T.britain + 28, 0.003), { fov: 40, roll: -0.02 }) },
  // "nasty trick": push into his smug face
  { f: T.nasty - 6, dur: 16, s: () => ({ pos: [DX - 3.7, 1.64, -3.3], look: [OWNER[0], 1.56, OWNER[2]], fov: 38, roll: 0.03 }) },
  // "over-insure": whip right to the clerk's desk, a top-down macro on the policy as the stamp slams
  { f: T.insure - 3, dur: 9, s: (f) => dolly([DESK[0] - 0.22, 1.9, DESK[2] + 0.55], [DESK[0] - 0.22, 0.88, DESK[2]], pushK(f, T.insure + 6, 0.004), { fov: 38, roll: 0.05 }) },
  // "rotting old ships": follow the paper as the wind takes it to the hull; a rat looks out of a hole
  { f: T.rotting - 3, dur: 12, s: (f) => ({ pos: [DX + 3.0, 1.75, -1.0], look: paperAt(f), fov: 42, roll: 0 }) },
  { f: T.old - 2, dur: 14, s: (f) => dolly([DX + 0.35, 0.85, 0.2], [HULLPT[0] + 0.1, HULLPT[1] + 0.05, HULLPT[2]], pushK(f, T.old + 12, 0.004), { fov: 40, roll: -0.05 }) },
  // "then cram them with cargo": up and back over the quay, the crates drop on the beat and the ship sinks
  { f: T.cram - 5, dur: 12, s: (f) => dolly([DX - 2.2, 4.4, -5.4], [DX + 1.8, -0.6, 3.0], pushK(f, T.cram + 8, 0.002), { fov: 46, roll: 0.03 }) },
  // "until they're barely floating": over the gap between quay and hull, then down it to the waterline
  { f: T.until - 3, dur: 10, s: () => ({ pos: [DX + 0.5, 1.2, 0.5], look: [DX + 5, DW + 0.4, 1.1], fov: 44, roll: 0 }) },
  { f: T.until + 5, dur: 12, s: (f) => dolly([DX + 0.5, DW + 0.75, 0.55], [DX + 6, DW + 0.35, 1.15], pushK(f, T.until + 17, 0.003), { fov: 46, roll: -0.04 }) },
  // "If a ship makes it": crane up out of the gap and back over the quay: the owner in front, his ship sailing off behind him
  { f: T.makes - 14, dur: 8, s: () => ({ pos: [DX + 0.5, 1.4, 0.4], look: [DX + 5, 0.5, 2], fov: 44, roll: 0 }) },
  { f: T.makes - 6, dur: 18, s: () => ({ pos: [OWNER[0] - 0.9, 1.7, OWNER[2] - 5.2], look: [OWNER[0] + 0.25, 1.3, OWNER[2] + 1.5], fov: 44, roll: 0.02 }) },
  // "they get rich": in on the owner holding his hat out; coins rain into it
  { f: T.rich - 5, dur: 12, s: (f) => dolly([DX - 1.4, 1.65, -4.4], [OWNER[0], 1.75, OWNER[2]], pushK(f, T.rich + 6, 0.003), { fov: 40 }) },
  // "If it sinks": lightning, the open sea at night, the ship going under
  { f: CUT.storm1, cut: true, s: (f) => dolly([SX - 24, 6.2, 17], [SX, 0.5, 0], pushK(f, CUT.storm1, 0.004), { fov: 44, roll: -0.04 }) },
  // "they get even richer": lightning, the quay at night, the owner catches a bigger bag under his umbrella
  { f: CUT.night, cut: true, s: (f) => dolly([DX - 4.8, 1.55, 0.9], [OWNER[0], 1.5, OWNER[2]], pushK(f, CUT.night, 0.004), { fov: 40, roll: 0.03 }) },
  // "They're called coffin ships": lightning, back at sea, the stern rising like a headstone, the lantern goes out
  { f: CUT.storm2, cut: true, s: (f) => dolly([SX - 13, 2.8, 9.5], [SX + 1, 2.4, 0], pushK(f, CUT.storm2, 0.0035), { fov: 42, roll: 0.05 }) },
  { f: T.cships + 8, dur: 12, s: () => ({ pos: [SX - 13, 3.2, 9.5], look: [SX - 4, 30, -4], fov: 46, roll: 0.0 }) },          // tilt up into the storm clouds
  // ---- "Then an MP named Samuel Plimsoll": a cloud wipe; looking up into a pink dawn sky, tilt down onto the quay ----
  { f: CUT.dawn, cut: true, s: () => ({ pos: [DX + 1.3, 1.55, -0.95], look: [DX - 3, 14, -1.6], fov: 46, roll: 0 }) },
  { f: CUT.dawn + 3, dur: 18, s: () => ({ pos: [DX + 1.5, 1.6, -0.95], look: [PL_WALK0[0] + 1.5, 1.3, PL_WALK0[2]], fov: 42, roll: 0.02 }) },
  // he strides toward us: the camera backs off ahead of him
  { f: CUT.dawn + 22, dur: 40, s: (f) => { const w = plimWalk(f).pos; return { pos: [w[0] + 4.4, 1.62, -0.95], look: [w[0], 1.35, w[2]], fov: 40, roll: 0.02 }; } },
  // "pushes a simple fix": he stops at the quay edge, brush up; the ship behind him
  { f: T.pushes - 4, dur: 14, s: (f) => dolly([PL_STOP[0] + 1.3, 1.62, PL_STOP[2] - 3.6], [PL_STOP[0], 1.45, PL_STOP[2]], pushK(f, T.pushes + 10, 0.003), { fov: 40, roll: -0.03 }) },
  // "Paint a line on every hull": macro on the starboard side from the water, the mark appears stroke by stroke
  { f: T.paint - 5, dur: 10, s: (f) => dolly([MARK[0] + 0.25, MARK[1] + 0.15, MARK[2] + 3.0], [MARK[0], MARK[1] + 0.05, MARK[2]], pushK(f, T.paint + 5, 0.003), { fov: 40, roll: 0.03 }) },
  // "Water over the line?": hold as the water climbs over it
  { f: T.water - 4, dur: 16, s: (f) => dolly([MARK[0] + 0.4, DW + 0.75, MARK[2] + 3.2], [MARK[0], DW + 0.45, MARK[2]], pushK(f, T.water + 12, 0.003), { fov: 40, roll: -0.02 }) },
  // "The ship stays home": the harbour master slams down the board, the sailors cheer
  { f: T.stays - 7, dur: 12, s: (f) => dolly([HARB[0] - 0.6, 1.6, HARB[2] - 4.1], [HARB[0], 1.3, HARB[2]], pushK(f, T.stays + 5, 0.003), { fov: 42, roll: 0.03 }) },
  // ---- "The shipowners just laugh": whip pan into the club, three owners roaring in their armchairs by the fire ----
  { f: CUT.club, cut: true, s: (f) => dolly([3.6, 1.45, 19.75], [-2.3, 1.0, 19.6], pushK(f, CUT.club, 0.003), { fov: 42, roll: -0.02 }) },
  // "A line of paint? On MY ship?": in on the main owner
  { f: T.linePaint - 6, dur: 12, s: (f) => dolly([0.7, 1.22, 19.7], [-2.2, 1.02, 19.6], pushK(f, T.linePaint + 6, 0.003), { fov: 40, roll: 0.03 }) },
  { f: T.my - 4, dur: 9, s: () => ({ pos: [-0.55, 1.18, 19.66], look: [-2.2, 1.06, 19.6], fov: 38, roll: -0.04 }) },
  // "And it gets worse": back off; he gets up and strides off to the door
  { f: T.worse - 6, dur: 12, s: (f) => ({ pos: [3.3, 1.55, 18.9], look: [ownerWalk(f).pos[0] - 0.2, 1.15, ownerWalk(f).pos[2] - 0.6], fov: 42, roll: 0 }) },
  { f: T.worse + 8, dur: 22, s: (f) => ({ pos: [2.9, 1.6, 17.4], look: [ownerWalk(f).pos[0], 1.3, ownerWalk(f).pos[2] - 0.4], fov: 42, roll: 0.02 }) },
  { f: T.plenty - 10, dur: 8, s: () => ({ pos: [1.0, 1.95, 20.8], look: [0, 2.35, 15.4], fov: 44, roll: 0 }) },   // whip to the door: HOUSE OF COMMONS
  // "Plenty of them sit in Parliament": through the door into the chamber, the owners tipping their hats to each other
  { f: T.plenty - 2, dur: 14, s: () => ({ pos: [0.15, 1.62, 13.7], look: [1.4, 1.2, 10.4], fov: 42, roll: 0 }) },
  { f: T.plenty + 10, dur: 16, s: (f) => dolly([0.3, 1.65, 14.5], [OWNER_SEAT[0] + 0.7, 1.05, OWNER_SEAT[2] - 1.3], pushK(f, T.plenty + 26, 0.003), { fov: 44, roll: -0.03 }) },
  // ---- "So when the safety bill gets dropped": glide down the chamber to the PM at the dispatch box; the bill goes in the bin ----
  { f: T.snaps - 4, dur: 22, s: (f) => dolly([-0.55, 1.55, 1.9], [PM[0], 1.3, PM[2] - 0.2], pushK(f, T.snaps + 18, 0.003), { fov: 42, roll: 0.03 }) },
  { f: T.dropped - 6, dur: 10, s: () => ({ pos: [2.35, 1.05, 2.15], look: [BIN[0] - 0.05, 0.45, BIN[2]], fov: 42, roll: 0.06 }) },   // down beside the basket as the folder drops
  // "Plimsoll snaps": whip across the table to his face, eye twitching, steam from his ears
  { f: T.plimSnap - 4, dur: 8, s: (f) => dolly([-0.35, 1.62, 4.25], [PLIM[0], 1.55, PLIM[2]], pushK(f, T.plimSnap + 4, 0.006), { fov: 38, roll: -0.05 }) },
  // "He stamps his foot": drop to the floor for the stamp
  { f: T.stamps - 4, dur: 10, s: () => ({ pos: [-1.22, 0.24, 5.25], look: [PLIM[0] + 0.02, 0.42, PLIM[2]], fov: 46, roll: 0.06 }) },
  // "slams his protest on the table": up to the table edge, papers exploding
  { f: T.slams - 5, dur: 10, s: (f) => dolly([0.75, 1.55, 4.9], [PLIM[0] + 0.22, 1.15, PLIM[2] - 0.1], pushK(f, T.slams + 5, 0.003), { fov: 44, roll: -0.04 }) },
  // "shakes his fist": in on the fist
  { f: T.shakes - 4, dur: 8, s: () => ({ pos: [-0.25, 1.85, 4.25], look: [PLIM[0] + 0.35, 1.82, PLIM[2]], fov: 40, roll: 0.07 }) },
  // the yell: a big close-up, dutch, pushing in; the MPs behind him duck
  { f: T.yells - 4, dur: 10, s: (f) => dolly([-0.6, 1.58, 4.6], [PLIM[0], 1.52, PLIM[2]], pushK(f, T.yells + 6, 0.005), { fov: 40, roll: -0.12 }) },
  // "The Speaker orders him to take it back": low angle on the Speaker under his canopy, pointing down
  { f: T.speaker - 4, dur: 9, s: (f) => dolly([0.2, 1.25, -10.6], [SPEAKER[0], 2.2, SPEAKER[2]], pushK(f, T.speaker + 6, 0.003), { fov: 42, roll: 0.04 }) },
  // "He refuses": back on Plimsoll, arms folded, head turned away
  { f: T.refuses - 6, dur: 9, s: (f) => dolly([-0.15, 1.55, 5.5], [PLIM[0], 1.35, PLIM[2]], pushK(f, T.refuses + 4, 0.003), { fov: 40, roll: 0.02 }) },
  // "Meanwhile, up in the gallery": crane up over the chamber to the west gallery; his wife deals out copies to the reporters
  { f: T.wife + 2, dur: 26, s: () => ({ pos: [-2.6, 5.7, -5.4], look: [WIFE[0], 5.15, WIFE[2] - 0.4], fov: 44, roll: 0 }) },
  { f: T.handing - 8, dur: 18, s: (f) => dolly([-3.6, 5.45, -6.6], [WIFE[0], 5.2, WIFE[2] - 0.5], pushK(f, T.handing + 10, 0.003), { fov: 42, roll: 0.03 }) },
  // ---- "The papers print every word": a flying copy fills the lens; the rollers of a printing press, pulling back ----
  { f: CUT.papers, cut: true, s: () => ({ pos: [PRX + 0.35, 1.55, 1.95], look: [PRX, 1.25, 0.2], fov: 44, roll: 0.05 }) },
  { f: CUT.papers + 6, dur: 22, s: (f) => dolly([PRX + 3.5, 2.05, 5.3], [PRX + 0.2, 1.35, 0.2], pushK(f, CUT.papers + 28, 0.003), { fov: 44, roll: -0.03 }) },
  // ---- the newspaper spins in, then we are in the square: from the paper in the orator's hand, pull back over the crowd ----
  { f: CUT.square, cut: true, s: () => ({ pos: [QX + 0.45, 2.3, 1.55], look: [QX + 0.32, 2.4, 0], fov: 42, roll: 0 }) },
  { f: CUT.square + 4, dur: 30, s: (f) => dolly([QX + 1.6, 2.7, 8.8], [QX, 2.1, 0], pushK(f, CUT.square + 34, 0.0025), { fov: 44, roll: 0.02 }) },
  // the quote: in on the orator; a punch-in on "bite"; out wide as the crowd roars on "MPs!"
  { f: T.ifMr - 4, dur: 24, s: (f) => dolly([QX + 0.8, 2.05, 4.7], [QX, 2.2, 0], pushK(f, T.ifMr + 20, 0.003), { fov: 42, roll: -0.03 }) },
  { f: T.bite - 3, dur: 6, s: () => ({ pos: [QX + 0.45, 2.2, 3.0], look: [QX, 2.32, 0], fov: 40, roll: 0.06 }) },
  { f: T.mps, dur: 14, s: (f) => dolly([QX + 1.7, 2.9, 9.2], [QX, 2.3, 0], pushK(f, T.mps + 14, 0.003), { fov: 44, roll: -0.02 }) },
  // ---- "Within weeks, Parliament caves": whip back into the chamber, the emergency act stamped at the table ----
  { f: CUT.caves, cut: true, s: (f) => dolly([-1.6, 1.68, 0.85], [1.05, 1.1, 0.3], pushK(f, CUT.caves, 0.003), { fov: 42, roll: 0.03 }) },
  { f: T.cavesW - 5, dur: 7, s: () => ({ pos: [0.27, 1.95, 1.02], look: [0.25, 0.955, 0.45], fov: 38, roll: -0.05 }) },   // top-down on the act as the stamp slams
  // ---- "A year later": a sun glare; craning down over the sunrise harbour from the water, every hull wearing the mark ----
  { f: CUT.year, cut: true, s: () => ({ pos: [DX - 12, 9.5, 15], look: [DX + 2, 0.2, 2.5], fov: 46, roll: 0.02 }) },
  { f: T.british - 4, dur: 34, s: () => ({ pos: [MARK[0] + 1.4, MARK[1] + 1.2, MARK[2] + 5.2], look: [MARK[0] - 0.4, MARK[1] + 0.9, MARK[2] - 1.5], fov: 44, roll: -0.02 }) },
  { f: T.wear - 4, dur: 18, s: (f) => dolly([MARK[0] + 0.1, DW + 1.45 - 0.5 + 0.02, MARK[2] + 1.75], [MARK[0], DW + 1.45 - 0.5, MARK[2]], pushK(f, T.wear + 14, 0.004), { fov: 40, roll: 0 }) },
  // ---- MATCH CUT: the hull's line becomes the rubber stripe on a gym shoe; slide along it, then pull back ----
  { f: CUT.shoes, cut: true, s: () => ({ pos: [SHOE[0] + 0.02, 0.024, SHOE[2] + 0.36], look: [SHOE[0] + 0.02, 0.018, SHOE[2]], fov: 40, roll: 0 }) },
  { f: T.rubber, dur: 40, s: () => ({ pos: [SHOE[0] + 0.11, 0.03, SHOE[2] + 0.33], look: [SHOE[0] + 0.09, 0.02, SHOE[2]], fov: 40, roll: 0.02 }) },
  { f: T.looked - 4, dur: 30, s: () => ({ pos: [SHOE[0] + 0.6, 0.32, SHOE[2] + 1.25], look: [SHOE[0] - 1.6, 0.2, SHOE[2] - 0.35], fov: 42, roll: -0.03 }) },   // low along the row of pairs, the kids behind
  { f: T.got - 6, dur: 26, s: (f) => dolly([GX + 0.9, 1.35, 7.3], [GX + 0.2, 1.0, 0], pushK(f, T.got + 20, 0.003), { fov: 44, roll: 0.02 }) },
  // "Plimsolls.": a kid jumps; tilt up to the portrait on the wall
  { f: T.plimsolls - 2, dur: 18, s: () => ({ pos: [GX + 0.15, 4.55, -3.9], look: [GX, 5.3, -7.94], fov: 42, roll: 0 }) },
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
const KICKS: [number, number][] = [[T.villains, 1.1], [T.parliament, 0.4], [T.bottom + 1, 0.6], [T.insure + 9, 1.0],
  [T.cram, 0.8], [T.withC, 0.8], [T.cargo, 1.0], [T.sinks, 0.7], [T.richer, 0.9], [T.stays + 3, 1.0], [T.paint, 0.3], [T.laughW, 0.6], [T.my, 0.5],
  [T.dropped + 4, 0.7], [T.snapW, 0.9], [T.foot, 1.3], [T.table, 1.3], [T.fistW, 0.6], [T.quoteI, 0.6], [T.villains2, 1.2], [T.back, 0.5], [T.refuses, 0.6],
  [T.every, 0.5], [T.jokes, 0.4], [T.bite, 1.3], [T.mps, 0.8], [T.cavesW, 1.1], [T.plimsolls + 8, 0.6]];
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
export type Place = "chamber" | "river" | "under" | "dock" | "storm" | "night" | "dawn" | "club" | "press" | "square" | "harbour" | "gym";
export const placeAt = (f: number): Place => {
  const c = run(f);
  if (f < CUT.dock) {
    if (c.pos[1] < WATER) return "under";
    return c.pos[0] > WIN.x - 0.15 ? "chamber" : "river";
  }
  if (f < CUT.storm1) return c.pos[1] < DW ? "under" : "dock";
  if (f < CUT.night) return "storm";
  if (f < CUT.storm2) return "night";
  if (f < CUT.dawn) return "storm";
  if (f < CUT.club) return "dawn";
  if (f < CUT.snaps) return c.pos[2] > 15.25 ? "club" : "chamber";
  if (f < CUT.papers) return "chamber";
  if (f < CUT.square) return "press";
  if (f < CUT.caves) return "square";
  if (f < CUT.year) return "chamber";
  if (f < CUT.shoes) return "harbour";
  return "gym";
};
export const LIGHT_OF: Record<Place, LightName> = { chamber: "candle", river: "dusk", under: "under", dock: "fog", storm: "storm", night: "night", dawn: "dawn", club: "club", press: "press", square: "lantern", harbour: "sunrise", gym: "gym" };
/** sun direction per place, world space (fixed: the camera moves continuously through each place) */
export const SUN_OF: Record<Place, V3> = {
  chamber: [0.55, 0.8, 0.25], river: [-0.6, 0.24, -0.76], under: [-0.15, 0.97, 0.1],
  dock: [0.35, 0.75, -0.56], storm: [0.3, 0.8, 0.5], night: [0.3, 0.6, 0.75], dawn: [0.7, 0.3, 0.65], club: [-0.75, 0.45, 0.4], press: [0.35, 0.8, 0.5], square: [-0.75, 0.22, 0.62], harbour: [0.55, 0.28, 0.78], gym: [0.25, 0.85, 0.48],
};
/** lightning: frames of the strikes (the cuts in and out of the storm hide under the first one) */
export const STRIKES = [CUT.storm1, CUT.storm1 + 10, CUT.night, T.richer, CUT.storm2, T.cships - 3];
export const strikeAt = (f: number) => { let a = 0; for (const s0 of STRIKES) { const n = f - s0; if (n >= 0 && n < 6) a = Math.max(a, [1, 0.55, 0.85, 0.35, 0.15, 0.05][n]); } return a; };

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 11, focus: () => HEAD },                 // Plimsoll medium: the MPs behind go soft
  { f: T.villains + 9, dur: 10, cInf: 1 },               // the crane and the flight: everything sharp
  { f: T.bottom + 4, dur: 18, cInf: 7, focus: () => [HOARD[0] - 0.2, BED + 0.4, HOARD[2]] },
  { f: CUT.dock, cInf: 2 },
  { f: T.britain, dur: 14, cInf: 10, focus: () => [OWNER[0], 1.5, OWNER[2]] },   // the owner: the fog and warehouses go soft
  { f: T.insure - 3, cInf: 14, focus: () => [DESK[0] - 0.22, 0.9, DESK[2]] },
  { f: T.rotting - 3, cInf: 2 },
  { f: T.old - 2, dur: 10, cInf: 12, focus: () => HULLPT },
  { f: T.cram - 5, dur: 10, cInf: 4 },
  { f: T.until - 3, dur: 10, cInf: 8 },
  { f: T.makes - 9, dur: 10, cInf: 6, focus: () => [OWNER[0], 1.5, OWNER[2]] },
  { f: T.rich - 5, dur: 8, cInf: 10, focus: () => [OWNER[0], 1.6, OWNER[2]] },
  { f: CUT.storm1, cInf: 0 },
  { f: CUT.night, cInf: 10, focus: () => [OWNER[0], 1.5, OWNER[2]] },
  { f: CUT.storm2, cInf: 3 },
  { f: CUT.dawn, cInf: 1 },
  { f: CUT.dawn + 22, dur: 10, cInf: 9, focus: (f) => [plimWalk(f).pos[0], 1.4, plimWalk(f).pos[2]] },
  { f: T.pushes - 4, dur: 10, cInf: 10, focus: () => [PL_STOP[0], 1.45, PL_STOP[2]] },
  { f: T.paint - 5, dur: 8, cInf: 12, focus: () => MARK },
  { f: T.stays - 7, dur: 8, cInf: 9, focus: () => [HARB[0], 1.3, HARB[2]] },
  { f: CUT.club, cInf: 9, focus: () => [CLUB_CHAIRS[0][0], 1.0, CLUB_CHAIRS[0][1]] },
  { f: T.worse - 6, dur: 10, cInf: 6, focus: (f) => ownerWalk(f).pos },
  { f: T.plenty - 2, dur: 10, cInf: 7, focus: () => [OWNER_SEAT[0], 1.0, OWNER_SEAT[2]] },
  { f: T.snaps - 4, dur: 10, cInf: 10, focus: () => [PM[0], 1.3, PM[2]] },
  { f: T.dropped - 6, dur: 6, cInf: 8, focus: () => [BIN[0], 0.6, BIN[2]] },
  { f: T.plimSnap - 4, dur: 6, cInf: 13, focus: () => [PLIM[0], 1.55, PLIM[2]] },
  { f: T.stamps - 4, dur: 6, cInf: 12, focus: () => [PLIM[0], 0.2, PLIM[2]] },
  { f: T.slams - 5, dur: 6, cInf: 10, focus: () => [PLIM[0] + 0.5, 1.0, PLIM[2]] },
  { f: T.shakes - 4, dur: 6, cInf: 12, focus: () => [PLIM[0] + 0.3, 1.8, PLIM[2]] },
  { f: T.yells - 4, dur: 6, cInf: 13, focus: () => [PLIM[0], 1.5, PLIM[2]] },
  { f: T.speaker - 4, dur: 6, cInf: 10, focus: () => [SPEAKER[0], 2.0, SPEAKER[2]] },
  { f: T.refuses - 6, dur: 6, cInf: 11, focus: () => [PLIM[0], 1.4, PLIM[2]] },
  { f: T.wife + 2, dur: 14, cInf: 4 },
  { f: T.handing - 8, dur: 10, cInf: 9, focus: () => [WIFE[0], 5.2, WIFE[2]] },
  { f: CUT.papers, cInf: 12, focus: () => [PRX, 1.2, 0.2] },
  { f: CUT.papers + 6, dur: 12, cInf: 6, focus: () => [PRX + 0.2, 1.3, 0.2] },
  { f: CUT.square, cInf: 12, focus: () => [QX + 0.32, 2.4, 0] },
  { f: CUT.square + 4, dur: 16, cInf: 8, focus: () => [QX, 2.0, 0] },
  { f: CUT.caves, cInf: 10, focus: () => [0.4, 1.0, 0.5] },
  { f: CUT.year, cInf: 2 },
  { f: T.wear - 4, dur: 12, cInf: 10, focus: () => [MARK[0], DW + 0.95, MARK[2]] },
  { f: CUT.shoes, cInf: 14, focus: () => [SHOE[0] + 0.02, 0.02, SHOE[2]] },
  { f: T.looked - 4, dur: 16, cInf: 10, focus: () => [SHOE[0] - 0.4, 0.05, SHOE[2]] },
  { f: T.got - 6, dur: 14, cInf: 8, focus: () => [GX, 1.0, 0] },
  { f: T.plimsolls - 2, dur: 12, cInf: 7, focus: () => [GX, 5.3, -7.94] },
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
