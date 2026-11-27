// Who is on screen and what they do, plus the flat 2D effect cards (shout burst, splash, bubbles, fish, seaweed,
// coin glints, the INSURED policy). Characters are the template's lit cards (Actor / Pool from ../bridge/cast).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, SKIN, INK, fxBurst, fxRing, fxSplash, fxShadow, fxContact, fxPuff, Outfit, FrontOpts, SideOpts } from "./toon";
import type { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import { FPS, PLIM, WATER, HOARD, BED, COFFIN, T, talking, camAt, clamp01, smooth, OWNER, DESK, DSHIP, DX, SX, HULLPT, paperAt, shipSink, CUT, STRIKES, plimWalk, PL_STOP, MARK, HARB, dawnSink, DW, CLUB_CHAIRS, ownerWalk, OWNER_SEAT, PM, BIN, SPEAKER, WIFE, REPORTERS } from "./story";
import type { Place as Place3 } from "./story";

// ---------------- cast ----------------
const PLIMSOLL: Outfit = { jacket: "#2b2e3d", pants: "#34343f", boots: "#1b1b20", hat: "hair", hair: "#6e5e50", beard: "#76604c", moustache: "#5e4a3a",
  style: "collar", trim: "#b0303a", skin: SKIN };
const MP = (v: number): Outfit => ({
  jacket: ["#2e2a36", "#3b3f52", "#4a3b30", "#283246", "#3d2f3a", "#2f3d36"][v % 6], pants: "#2b2d35", boots: "#1d1d22",
  hat: v % 3 === 2 ? "hair" : "tophat", hair: ["#2a201a", "#8a8a8a", "#5a3b2a", "#c9a35a"][v % 4],
  style: "collar", trim: ["#7a1f2b", "#2f4f7a", "#c9a24e", "#3d6b4a", "#5a2a4a"][v % 5],
  chops: v % 4 === 1 ? "#5a4636" : undefined, moustache: v % 3 === 0 ? "#3a2c22" : undefined, monocle: v === 4, skin: SKIN,
  build: v % 5 === 3 ? "stout" : "adult",
});

const OWNER_O: Outfit = { jacket: "#3a2f4a", pants: "#2b2633", boots: "#1d1d22", hat: "tophat", style: "vest", trim: "#8a1f2b", chops: "#5a4636",
  monocle: true, chain: true, cigar: true, build: "stout", skin: SKIN };
const CLERK_O: Outfit = { jacket: "#2a2f3a", pants: "#2a2f3a", boots: "#1d1d22", hat: "hair", hair: "#3a2c22", style: "collar", trim: "#3a3a48", specs: true, skin: SKIN };
const OWNER2_O: Outfit = { jacket: "#2c3d33", pants: "#2b2633", boots: "#1d1d22", hat: "tophat", style: "vest", trim: "#2f6b4a", chops: "#9a9a9a", chain: true, build: "stout", skin: SKIN };
const OWNER3_O: Outfit = { jacket: "#2c3550", pants: "#2b2633", boots: "#1d1d22", hat: "tophat", style: "vest", trim: "#c9a24e", moustache: "#3a2c22", cigar: true, build: "stout", skin: SKIN };
const PM_O: Outfit = { jacket: "#1f1f28", pants: "#2b2b33", boots: "#151518", hat: "hair", hair: "#1c1c22", style: "collar", trim: "#5a2a4a", moustache: "#1c1c22", skin: SKIN };
const SPEAKER_O: Outfit = { jacket: "#1b1b22", pants: "#1b1b22", boots: "#151518", hat: "hair", hair: "#f1ede2", wig: true, style: "collar", trim: "#f2efe8", build: "stout", skin: SKIN };
const WIFE_O: Outfit = { jacket: "#5a2a4a", pants: "#5a2a4a", boots: "#2a2026", hat: "bonnet", dress: "#7a3a5a", skin: SKIN };
const REPORTER = (v: number): Outfit => ({ jacket: ["#4a4a52", "#5a4a3a", "#3a4a5a"][v % 3], pants: "#2b2b33", boots: "#1d1d22", hat: "bowler", style: "collar",
  trim: ["#7a1f2b", "#2f4f7a", "#c9a24e"][v % 3], moustache: v % 3 === 1 ? "#3a2c22" : undefined, specs: v % 3 === 2, skin: SKIN });
const HARBOUR_O: Outfit = { jacket: "#22304a", pants: "#22304a", boots: "#1b1b20", hat: "cap", cap: "#22304a", style: "collar", trim: "#c9a24e", moustache: "#5a4636",
  buttons: "#e2b84a", build: "stout", skin: SKIN };
const SAILOR = (v: number): Outfit => ({ jacket: "#f2efe8", style: "stripes", trim: "#2c4f86", pants: ["#2b3a55", "#3a3a44", "#4a3b30"][v % 3], boots: "#3a2c22",
  hat: "cap", cap: ["#2c3a55", "#7a1f2b", "#3a3a44"][v % 3], beard: v % 2 ? "#5a4636" : undefined, skin: SKIN });

// ---------------- drawing helpers (same rules as the template cast) ----------------
const q = (v: number, n = 120) => Math.round(v * n) / n;
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const tier = (d: number): [number, number, number] => d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const light2D = (cam: CamInfo) => {
  const sx = SUN.dot(cam.right), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(new THREE.Vector3(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const f2: FrontOpts = { ...fo, light: light2D(cam), seed: (who.i % 7) + 1 };
  return { key: `F|${who.okey}|${fkey(f2)}`, x, y, z, scale, draw: (p) => bodyFront(p, who.o, f2), size: [w, h, k] };
};
const personSide = (cam: CamInfo, who: Who, x: number, y: number, z: number, mirror: boolean, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(new THREE.Vector3(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const s2: SideOpts = { ...so, light: light2D(cam), seed: (who.i % 7) + 1 };
  return { key: `S|${who.okey}|${fkey(s2)}`, x, y, z, scale, mirror, draw: (p) => bodySide(p, who.o, s2), size: [w, h, k] };
};
const hexK = (k: number) => `#${[0.2, 0.21, 0.33].map((v) => Math.round(255 * (1 - (1 - v) * k) ** (1 / 2.2)).toString(16).padStart(2, "0")).join("")}`;
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  const len = 1.2 * sc, h = len + 0.55 * sc, c = 0.3 * h, tc = hexK(0.55 * k), cc = hexK(k);
  out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x, y: y + 0.022, z, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};
const LEAD = 2; // reactions land 2 frames before the word
const fxAt = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, ...extra });

// ---------------- 2D effects (our own drawings) ----------------
const bubble = (p: Pen) => { p.ell(64, 64, 52, 52, "rgba(210,255,240,0.25)", 7); p.arc(48, 46, 24, 20, 200, 290, 6, "#ffffff"); };
const speck = (p: Pen) => { p.ell(32, 32, 20, 20, "rgba(220,255,235,0.7)", 0); };
const glint = (p: Pen, u: number) => { // four-point star, size pulses
  const r = 30 + 70 * u, c = 128;
  p.poly([[c, c - r], [c + 0.18 * r, c - 0.18 * r], [c + r, c], [c + 0.18 * r, c + 0.18 * r], [c, c + r], [c - 0.18 * r, c + 0.18 * r], [c - r, c], [c - 0.18 * r, c - 0.18 * r]], "#fff6cf", 0);
  p.ell(c, c, 0.22 * r, 0.22 * r, "#ffffff", 0);
};
const fish = (p: Pen, u: number, col: string) => { // side-on cartoon fish, tail flick by u
  const t = 22 * Math.sin(u * Math.PI * 2);
  p.poly([[60, 100], [10, 70 + t], [16, 100], [10, 130 + t]], col, 7);
  p.ell(140, 100, 90, 48, col, 8);
  p.poly([[120, 56], [160, 30], [175, 58]], col, 6);
  p.dot(195, 90, 9); p.arc(205, 112, 12, 8, 10, 120, 5);
};
const weed = (p: Pen, u: number, k: number) => { // seaweed ribbon swaying
  const pts: [number, number][] = [];
  for (let i = 0; i <= 10; i++) pts.push([64 + 26 * Math.sin(u * Math.PI * 2 + i * 0.5 + k) * (i / 10), 500 - i * 48]);
  p.stroke(pts, 30, INK); p.stroke(pts, 20, k % 2 ? "#3f8f4a" : "#5aa846");
};
const policy = (p: Pen) => { // the INSURED policy: soggy parchment with a red stamp
  p.poly([[20, 30], [480, 14], [492, 330], [30, 350]], "#efe2bf", 8);
  p.g.save(); p.g.fillStyle = "#4a3a2a"; p.g.font = "bold 42px Georgia, serif"; p.g.textAlign = "center";
  p.g.fillText("MARINE POLICY", 255, 92); p.g.font = "26px Georgia, serif";
  for (let i = 0; i < 4; i++) p.g.fillRect(70, 130 + i * 30, 360 - (i % 2) * 90, 6);
  p.g.translate(270, 270); p.g.rotate(-0.16); p.g.strokeStyle = "#c0202a"; p.g.lineWidth = 9; p.g.strokeRect(-190, -52, 380, 96);
  p.g.fillStyle = "#c0202a"; p.g.font = "bold 58px Georgia, serif"; p.g.fillText("INSURED", 0, -2); p.g.font = "bold 34px Georgia, serif"; p.g.fillText("£20,000", 0, 36);
  p.g.restore();
};
const policyFlat = (stamped: boolean) => (p: Pen) => { // the policy lying on the desk: blank, then stamped
  p.poly([[20, 30], [480, 14], [492, 330], [30, 350]], "#efe2bf", 8);
  p.g.save(); p.g.fillStyle = "#4a3a2a"; p.g.font = "bold 42px Georgia, serif"; p.g.textAlign = "center"; p.g.fillText("MARINE POLICY", 255, 92);
  for (let i = 0; i < 4; i++) p.g.fillRect(70, 130 + i * 30, 360 - (i % 2) * 90, 6);
  if (stamped) { p.g.translate(270, 270); p.g.rotate(-0.16); p.g.strokeStyle = "#c0202a"; p.g.lineWidth = 9; p.g.strokeRect(-190, -52, 380, 96);
    p.g.fillStyle = "#c0202a"; p.g.font = "bold 58px Georgia, serif"; p.g.fillText("INSURED", 0, -2); p.g.font = "bold 34px Georgia, serif"; p.g.fillText("£20,000", 0, 36); }
  p.g.restore();
};
const rat = (p: Pen, u: number) => { // grey rat, head-on, whiskers twitching
  p.ell(150, 150, 90, 70, "#8d8a92", 8); p.ell(85, 80, 34, 34, "#c9a2b0", 7); p.ell(215, 80, 34, 34, "#c9a2b0", 7);
  p.dot(118, 140, 10); p.dot(182, 140, 10); p.ell(150, 190, 14, 10, "#e78fa6", 5);
  const w = 6 * Math.sin(u * Math.PI * 6);
  for (const sd of [-1, 1]) for (const k of [-1, 0, 1]) p.stroke([[150 + sd * 22, 192], [150 + sd * 95, 180 + k * 18 + w]], 3, "#2a2430");
};
const ratSide = (p: Pen, u: number) => { // leaping rat, side view
  p.ell(150, 110, 95, 46, "#8d8a92", 8); p.ell(235, 92, 40, 34, "#8d8a92", 7); p.ell(222, 58, 16, 16, "#c9a2b0", 5); p.dot(252, 86, 7);
  p.stroke([[58, 116], [20, 90 + 30 * Math.sin(u * 6)], [4, 60]], 9, "#e78fa6");
  for (const [x, a] of [[110, 1], [190, -1]]) p.stroke([[x, 145], [x + 20 * a, 175]], 9, "#2a2430");
};
const coin = (p: Pen, k: number) => { p.ell(64, 64, 54 - (k % 3) * 18, 54, "#f2c14e", 7); p.ell(64, 64, 30 - (k % 3) * 10, 30, null, 4, 0, 360); };
const bag = (p: Pen) => { // fat money bag
  p.ell(150, 175, 125, 112, "#b99560", 10); p.poly([[110, 72], [190, 72], [175, 100], [125, 100]], "#b99560", 8); p.stroke([[112, 104], [188, 104]], 10, "#6b4520");
  p.g.save(); p.g.fillStyle = "#5a2f1a"; p.g.font = "bold 130px Georgia, serif"; p.g.textAlign = "center"; p.g.fillText("£", 150, 222); p.g.restore();
};
const bolt = (p: Pen, seed: number) => { // lightning fork
  const pts: [number, number][] = [[150 + (seed % 3) * 20, 0]]; let x = pts[0][0];
  for (let y = 40; y <= 600; y += 40) { x += ((seed * 37 + y) % 70) - 35; pts.push([x, y]); }
  p.stroke(pts, 26, "rgba(200,220,255,0.55)"); p.stroke(pts, 10, "#ffffff");
  const bx = pts[6]; p.stroke([bx, [bx[0] + 60, bx[1] + 70], [bx[0] + 40, bx[1] + 140]], 6, "#ffffff");
};
const stampHand = (p: Pen, u: number) => { // the clerk's hand bringing the rubber stamp down (seen from above)
  p.band([[150, -40], [150, 150]], "#2a2f3a", 70, 8, "butt");
  p.ell(150, 170, 52, 44, "#fbf8f3", 8);
  for (const d of [-26, -8, 10, 28]) p.arc(150 + d, 140, 10, 8, 180, 360, 4);
  p.poly([[96, 200], [204, 200], [204, 262], [96, 262]], "#8a5a34", 7);
  p.poly([[86, 262], [214, 262], [214, 290], [86, 290]], "#6b4520", 7);
  if (u > 0.9) p.poly([[86, 290], [214, 290], [214, 298], [86, 298]], "#c0202a", 0);
};
const brushHand = (p: Pen) => { // a hand holding a dripping paint brush, bristles at the bottom-left (the card's anchor)
  p.band([[230, 40], [300, -40]], "#2b2e3d", 60, 8, "butt");
  p.ell(205, 70, 42, 36, "#fbf8f3", 7);
  p.band([[190, 92], [120, 170]], "#8a5a34", 18, 6, "round");
  p.poly([[100, 160], [140, 192], [112, 232], [70, 200]], "#e9e4d8", 7);
  p.poly([[70, 200], [112, 232], [98, 246], [58, 214]], "#ffffff", 0);
};
const monocleFly = (p: Pen) => { p.ell(64, 64, 44, 44, "rgba(220,235,255,0.35)", 7); p.stroke([[96, 96], [124, 126]], 4, "#d9b44a"); };
const cigarFly = (p: Pen) => { p.band([[20, 64], [108, 64]], "#6b3f22", 16, 4, "round"); p.ell(110, 64, 9, 9, "#ff7a2e", 0); };
const paperFly = (p: Pen) => { p.poly([[10, 10], [118, 4], [122, 150], [14, 156]], "#f4efe2", 6); for (let k = 0; k < 5; k++) p.stroke([[24, 34 + k * 22], [104, 32 + k * 22]], 4, "#8a8a9a"); };
const folderFly = (p: Pen) => {
  p.poly([[10, 20], [230, 10], [238, 170], [16, 180]], "#b8864a", 8);
  p.g.save(); p.g.fillStyle = "#3a2414"; p.g.textAlign = "center"; p.g.font = "bold 34px Georgia, serif"; p.g.fillText("SHIPPING", 124, 88); p.g.fillText("BILL", 124, 128); p.g.restore();
};
const steam = (p: Pen, u: number) => { for (let i = 0; i < 3; i++) { const t2 = clamp01(u * 1.3 - i * 0.15); if (t2 <= 0) continue; p.ell(64 + 10 * i, 220 - 170 * t2 - i * 20, 26 + 30 * t2, 22 + 26 * t2, `rgba(245,245,245,${0.9 * (1 - t2)})`, 0); } };
const hatFly = (p: Pen) => { p.poly([[40, 30], [120, 30], [124, 150], [36, 150]], "#2e2a36", 7); p.ell(80, 150, 70, 16, "#1d1b22", 7); p.stroke([[38, 124], [122, 124]], 12, "#5a2a4a"); };
const capFly = (p: Pen, col: string) => { p.ell(64, 70, 50, 34, col, 7); p.ell(64, 96, 58, 12, col, 6); };
const rainStreak = (p: Pen) => { p.g.globalAlpha = 0.85; p.stroke([[16, 8], [8, 248]], 7, "#dfe8f6"); p.g.globalAlpha = 1; };
const gull = (p: Pen, u: number) => { const w = 30 * Math.sin(u * Math.PI * 2); p.stroke([[10, 60 + w], [60, 50], [110, 60 + w]], 9, "#2a2430"); };

// ---------------- staging ----------------
export const stage = (place: Place3, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  if (cam.sun) SUN.copy(cam.sun).normalize();
  const P = (who: Who, x: number, y: number, z: number, fo: FrontOpts, sc = 1) => { out.places.push(person(cam, who, x, y, z, { blink: lidAt(f, who.i), ...fo }, sc)); };

  if (place === "chamber" && f >= T.plenty - 6 && f < T.snaps) {
    // "Plenty of them sit in Parliament": shipowners in top hats along the east benches, tipping their hats to each other
    const seats: [number, number, number, Outfit][] = [[OWNER_SEAT[0], OWNER_SEAT[1], OWNER_SEAT[2], OWNER_O], [2.21, 0.3, 10.7, OWNER2_O], [3.21, 0.7, 11.5, OWNER3_O],
      [3.21, 0.7, 9.9, OWNER2_O], [4.21, 1.1, 10.8, OWNER_O], [2.21, 0.3, 9.1, OWNER3_O], [4.21, 1.1, 12.4, OWNER2_O]];
    seats.forEach(([x, y, z, o], k) => {
      const tip = f >= T.plenty + 4 + k * 3 && f < T.plenty + 26 + k * 3;
      P({ i: 60 + k, o, okey: "ownerMP" + k }, x, y, z, { mode: "sit", expr: tip ? "grin" : "smug", prop: tip ? "tipHat" : null, look: k % 2 ? 0.5 : -0.5 });
    });
  }
  if (place === "club") {
    // three shipowners roaring in their armchairs by the fire
    const laughing = f >= T.laughW - LEAD - 6, talk = f >= T.linePaint - LEAD && f < T.worse && talking(f + LEAD);
    const walk = ownerWalk(f), up = f >= T.worse + 4;
    if (!up) P({ i: 30, o: OWNER_O, okey: "owner" }, CLUB_CHAIRS[0][0], 0.33, CLUB_CHAIRS[0][1], { mode: "sit", expr: talk ? (f % 8 < 4 ? "laugh" : "grin") : laughing ? "laugh" : "smug",
      point: f >= T.my - LEAD && f < T.worse - 2, tilt: f >= T.my - LEAD ? 6 : laughing ? -6 : 0, headTilt: laughing && !talk ? -5 : 0, facing: 1 });
    else if (f < T.plenty - 11) out.places.push(personSide(cam, { i: 30, o: OWNER_O, okey: "ownerWalk" }, walk.pos[0], 0, walk.pos[2], false,
      { mode: walk.walking ? "march" : "stand", phase: q(walk.phase % 1, 20), expr: "smug", stomp: 1.1 }));
    [[1, OWNER2_O], [2, OWNER3_O]].forEach(([k, o]) => {
      const [x, z] = CLUB_CHAIRS[k as number];
      P({ i: 30 + (k as number), o: o as Outfit, okey: "clubOwner" + k }, x, 0.33, z, { mode: "sit", expr: laughing ? (f % 10 < 5 ? "laugh" : "grin") : "smug", tilt: laughing ? -8 : 0, facing: (k as number) === 1 ? 1 : -1 });
    });
    const r = cam.right;
    if (f >= T.laughW - 2 && f < T.laughW + 22) { // the monocle pops off
      const u = (f - T.laughW + 2) / 24;
      fxAt(out, "monocleFly", 128, 128, monocleFly, CLUB_CHAIRS[0][0] + r.x * (0.2 + 0.6 * u), 1.35 + 1.4 * u - 2.2 * u * u, CLUB_CHAIRS[0][1] + r.z * (0.2 + 0.6 * u), 0.16, 0.16, { rot: u * 9 });
    }
    if (f >= T.laughW + 2 && f < T.laughW + 26) { // a cigar shoots out of a laughing mouth
      const u = (f - T.laughW - 2) / 24;
      fxAt(out, "cigarFly", 128, 128, cigarFly, CLUB_CHAIRS[2][0] - r.x * (0.3 + 1.0 * u), 1.3 + 1.2 * u - 2.0 * u * u, CLUB_CHAIRS[2][1] - r.z * (0.3 + 1.0 * u), 0.22, 0.22, { rot: -u * 12 });
    }
    for (let i = 0; i < 3; i++) { const u = q(((f / FPS) * 0.4 + i / 3) % 1, 20); fxAt(out, `smoke${u}`, 300, 300, (p) => fxBurst(p, u, "#d9c9c0", 5, 30, 120), -1.6 + i * 0.4, 2.2 + u * 0.8, 18.6 + i, 0.6, 0.6, { soft: true }); }
  }
  if (place === "chamber" && f >= T.snaps && f < CUT.papers) {
    const r = cam.right;
    // the Prime Minister at the dispatch box with the shipping bill, which goes in the bin on "dropped"
    const holding = f < T.dropped - 2;
    P({ i: 70, o: PM_O, okey: "pm" }, PM[0], 0, PM[2], { mode: "stand", expr: holding ? "neutral" : "smug", prop: holding ? "folder" : null, facing: -1 });
    if (!holding && f < T.dropped + 14) { // the folder drops into the basket
      const u = clamp01((f - T.dropped + 2) / 9);
      fxAt(out, "folderFly", 256, 192, folderFly, BIN[0] + (PM[0] - BIN[0]) * (1 - u), 1.2 - 0.62 * u * u, BIN[2] + (PM[2] + 0.3 - BIN[2]) * (1 - u), 0.42, 0.32, { rot: u * 1.6 });
      if (u >= 1) { const v = clamp01((f - T.dropped - 7) / 8); fxAt(out, `binThud${q(v, 8)}`, 500, 500, (p) => fxBurst(p, v, "#f3e6c8", 7, 70, 200), BIN[0], 0.65, BIN[2], 0.6, 0.6); }
    }
    // Plimsoll: twitch, stamp, slam, fist, yell, then arms folded
    const pe = f >= T.refuses - LEAD ? "neutral" : f >= T.yells - LEAD ? (talking(f + LEAD) || f >= T.quoteI ? "yell" : "angry") : f >= T.stamps - LEAD ? "angry" : f >= T.plimSnap - LEAD ? (f % 6 < 3 ? "twitch" : "angry") : "stern";
    const stampFoot = f >= T.stamps && f < T.foot + 8 ? (f < T.foot ? 0.6 * smooth((f - T.stamps) / (T.foot - 2 - T.stamps)) : Math.min(1, 0.6 + 0.4 * (f - T.foot + 2) / 2)) : 0;
    const slamming = f >= T.slams - 4 && f < T.shakes - 2, fisting = f >= T.shakes - LEAD && f < T.refuses - LEAD;
    P({ i: 1, o: PLIMSOLL, okey: "plim" }, PLIM[0], PLIM[1], PLIM[2], {
      mode: "stand", expr: pe, facing: 1, look: f >= T.refuses ? -0.9 : 0, headTilt: f >= T.refuses ? 9 : 0,
      fold: f >= T.refuses - LEAD, stampFoot, prop: slamming ? "copies" : null, swing: slamming ? smooth((f - (T.table - 6)) / 5) : 0,
      fist: fisting ? q(((f / FPS) * (f >= T.yells ? 4.2 : 3.2)) % 1, 12) : undefined, tilt: f >= T.yells && f < T.refuses ? 6 : f >= T.foot && f < T.foot + 6 ? 3 : 0 });
    blob(out, PLIM[0], 0, PLIM[2]);
    if (f >= T.plimSnap - 4 && f < T.stamps + 10) for (const sd of [-1, 1]) { // steam out of his ears
      const u = q((((f - T.plimSnap) / FPS) * 1.6) % 1, 16);
      fxAt(out, `steam${u}`, 128, 256, (p) => steam(p, u), PLIM[0] + r.x * sd * 0.32, 1.72, PLIM[2] + r.z * sd * 0.32, 0.3, 0.6, { soft: true });
    }
    if (f >= T.foot && f < T.foot + 12) { const v = (f - T.foot) / 12; for (const sd of [-1, 1]) fxAt(out, `stompDust${q(v, 12)}`, 400, 400, (p) => fxPuff(p, v), PLIM[0] + r.x * (0.12 + sd * 0.28 * (0.4 + v)), 0.12 + 0.1 * v, PLIM[2] + r.z * (0.12 + sd * 0.28 * (0.4 + v)) + 0.08, 0.55, 0.55, { soft: true }); }
    if (f >= T.table && f < T.table + 26) for (let k = 0; k < 9; k++) { // the protest explodes off the table
      const u = (f - T.table) / 26, a = (k / 9) * Math.PI - Math.PI / 2 + (hh(k, 2) - 0.5) * 0.4, sp = 1.4 + hh(k, 3) * 1.2;
      fxAt(out, "paperFly", 128, 160, paperFly, PLIM[0] + 0.55 + r.x * Math.sin(a) * sp * u, 1.0 + Math.cos(a) * 0.4 * sp * u + 2.2 * u - 2.6 * u * u, PLIM[2] - 0.2 + r.z * Math.sin(a) * sp * u, 0.22, 0.27, { rot: u * (6 + k) });
    }
    if (f >= T.yells && f < T.refuses - 4) { const u = q((((f - T.yells) / FPS) * 3) % 1, 10); fxAt(out, `shout${u}`, 500, 500, (p) => fxBurst(p, u, "#fff3d0", 7, 90, 230), PLIM[0] + r.x * 0.55 + 0.2, 1.45, PLIM[2] + r.z * 0.55 + 0.25, 0.75, 0.75); }
    // MPs on the benches behind him: duck and recoil at the yell; a top hat flies off on "villains"
    const seats: [number, number, number][] = [[-2.21, 0.3, 2.05], [-2.21, 0.3, -1.3], [-3.21, 0.7, 1.65], [-3.21, 0.7, 2.85], [-3.21, 0.7, -0.95], [-4.21, 1.1, 1.2], [-4.21, 1.1, -0.45], [-5.21, 1.5, 0.8], [-5.21, 1.5, -1.25]];
    seats.forEach(([x, y, z], k) => {
      const duck = f >= T.yells - LEAD + (k % 3) && f < T.refuses;
      const hatGone = k === 3 && f >= T.villains2;
      P({ i: 10 + k, o: hatGone ? { ...MP(k), hat: "hair" } : MP(k), okey: "mp" + k + (hatGone ? "h" : ""), }, x, y, z, { mode: "sit", expr: duck ? (k % 2 ? "shock" : "pained") : f >= T.plimSnap ? "nervous" : "stern", tilt: duck ? -10 - (k % 3) * 3 : 0, look: 0.6 });
    });
    if (f >= T.villains2 && f < T.villains2 + 30) { const u = (f - T.villains2) / 30; fxAt(out, "hatFly", 160, 180, hatFly, -3.21 + r.x * 1.2 * u, 2.3 + 2.2 * u - 2.2 * u * u, 2.85 + r.z * 1.2 * u, 0.36, 0.4, { rot: u * 9 }); }
    // shipowners on the far benches enjoying it (seen behind the PM)
    [[2.21, 0.3, -2.0, OWNER_O], [3.21, 0.7, -1.2, OWNER3_O], [3.21, 0.7, 1.6, OWNER2_O], [4.21, 1.1, 0.4, OWNER_O]].forEach(([x, y, z, o], k) =>
      P({ i: 80 + k, o: o as Outfit, okey: "ownerOpp" + k }, x as number, y as number, z as number, { mode: "sit", expr: f >= T.dropped ? "grin" : "smug", look: -0.5 }));
    // the Speaker on his chair, pointing down at Plimsoll on "orders"
    P({ i: 90, o: SPEAKER_O, okey: "speaker" }, SPEAKER[0], SPEAKER[1], SPEAKER[2], { mode: "sit", expr: f >= T.orders - LEAD ? "angry" : "stern", point: f >= T.orders - LEAD && f < T.refuses + 20, tilt: f >= T.orders ? 5 : 0 });
    // the press gallery: his wife, calm as anything, dealing copies of his protest to the reporters
    if (f >= T.wife - 10) {
      P({ i: 100, o: WIFE_O, okey: "wife" }, WIFE[0], WIFE[1], WIFE[2], { mode: "stand", expr: "smile_closed", prop: "copies", facing: -1 });
      REPORTERS.forEach(([x, y, z], k) => P({ i: 101 + k, o: REPORTER(k), okey: "reporter" + k }, x, y, z, { mode: "stand", expr: f >= T.handing - LEAD ? (k % 2 ? "grin" : "shock") : "neutral", prop: "notebook", tilt: f >= T.handing ? 6 : 0 }));
      for (let n = 0; n < 7; n++) { // copies flicked across one after another, like dealing cards
        const f0 = T.handing + n * 8, u = (f - f0) / 10;
        if (u < 0 || u > 1) continue;
        const [tx, ty, tz] = REPORTERS[n % 3];
        fxAt(out, "paperFly", 128, 160, paperFly, WIFE[0] + (tx - WIFE[0]) * u, 5.55 + 0.4 * Math.sin(Math.PI * u), WIFE[2] + (tz - WIFE[2]) * u, 0.2, 0.25, { rot: u * 5 });
      }
    }
  }
  if (place === "chamber" && f < CUT.dock) {
    // Plimsoll on his feet: fist up and shaking, mouth working with the words; "villains" is the loudest
    const vil = f >= T.villains - LEAD && f < T.villains + 12, open = talking(f + LEAD);
    P({ i: 1, o: PLIMSOLL, okey: "plim" }, PLIM[0], PLIM[1], PLIM[2], {
      mode: "stand", expr: open || vil ? "yell" : "angry", fist: q(((f / FPS) * 3.2) % 1, 12), tilt: vil ? 6 : 3, headTilt: vil ? -4 : 0, facing: 1 });
    blob(out, PLIM[0], 0, PLIM[2]);
    if (vil) { // shout lines fanning out beside his mouth (toward the camera's right)
      const u = clamp01((f - T.villains + LEAD) / 10), r = cam.right;
      fxAt(out, `shout${q(u, 10)}`, 500, 500, (p) => fxBurst(p, u, "#fff3d0", 7, 90, 230), PLIM[0] + r.x * 0.55 + 0.2, 1.45, PLIM[2] + r.z * 0.55 + 0.25, 0.75, 0.75);
    }
    // the benches behind him: MPs in top hats, stern, then recoiling at "villains"
    const seats: [number, number, number][] = [
      [-2.21, 0.3, 2.05], [-2.21, 0.3, -1.3], [-3.21, 0.7, 1.65], [-3.21, 0.7, 2.85], [-3.21, 0.7, -0.95],
      [-4.21, 1.1, 1.2], [-4.21, 1.1, -0.45], [-4.21, 1.1, -1.95], [-5.21, 1.5, 0.8], [-5.21, 1.5, -1.25], [-5.21, 1.5, -2.85],
    ];
    seats.forEach(([x, y, z], k) => {
      const hit = f >= T.villains - LEAD + (k % 3);
      P({ i: 10 + k, o: MP(k), okey: "mp" + k }, x, y, z, { mode: "sit", expr: hit ? (k % 3 === 1 ? "pained" : "shock") : k % 2 ? "stern" : "neutral", tilt: hit ? -7 - (k % 3) * 2 : 0, look: 0.6 });
    });
  }

  if (place === "river") {
    // gulls over the water, smoke lazily off the far chimneys
    [[-60, 14, -8], [-75, 18, 6], [-52, 11, 14]].forEach(([x, y, z], k) => {
      const u = q(((f / FPS) * 2.2 + k * 0.3) % 1, 12);
      fxAt(out, `gull${u}`, 128, 100, (p) => gull(p, u), x - (f / FPS) * 3, y, z, 1.4, 1.1);
    });
    // waves lapping over the coffin ship's deck
    for (let i = 0; i < 3; i++) { const u = q(((f / FPS) * 0.9 + i / 3) % 1, 20); fxAt(out, `ring${u}`, 600, 600, (p) => fxRing(p, u), COFFIN[0] - 3 + i * 3, WATER + 0.05, COFFIN[2] + 1.6 - i, 2.4, 2.4, { flat: true }); }
    const c = camAt(f);
    if (c.pos[1] < WATER + 2.2) { const u = clamp01((WATER + 2.2 - c.pos[1]) / 2.2); fxAt(out, `splash${q(u, 12)}`, 600, 600, (p) => fxSplash(p, u), c.pos[0] - 1.2, WATER + 0.2, c.pos[2] - 0.2, 2.2, 2.2); }
  }

  if (place === "under") {
    const t = f / FPS, c = camAt(f);
    // the plunge: a burst of bubbles boiling up past the lens
    const fw = new THREE.Vector3(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]).normalize();
    for (let i = 0; i < 34; i++) { // small bubbles boiling up 1.5-5 m ahead of the lens
      const age = (f - T.bottom) / FPS - hh(i, 2) * 0.35;
      if (age < 0 || age > 1.8) continue;
      const dd = 1.5 + hh(i, 6) * 3.5, sz = 0.04 + 0.09 * hh(i, 5);
      fxAt(out, "bubble", 128, 128, bubble, c.pos[0] + fw.x * dd + (hh(i, 3) - 0.5) * 2.2, c.pos[1] + fw.y * dd - 0.8 + age * 2.6, c.pos[2] + fw.z * dd + (hh(i, 4) - 0.5) * 2.2, sz, sz, { soft: true });
    }
    // drifting specks
    for (let i = 0; i < 40; i++) {
      const x = HOARD[0] - 8 + hh(i, 1) * 16, z = HOARD[2] - 6 + hh(i, 2) * 12, y = BED + 0.5 + ((hh(i, 3) * 9 + t * 0.2) % 9);
      fxAt(out, "speck", 64, 64, speck, x + 0.3 * Math.sin(t + i), y, z, 0.05, 0.05, { soft: true });
    }
    // a little school of fish crossing behind the hoard
    for (let i = 0; i < 5; i++) {
      const u = q(((t * 2.4 + i * 0.2) % 1), 10);
      fxAt(out, `fish${i % 2}${u}`, 256, 200, (p) => fish(p, u, i % 2 ? "#e9a23b" : "#d9643a"), HOARD[0] - 6 + t * 1.6 + i * 0.7, BED + 2.4 + (i % 3) * 0.5, HOARD[2] + 3 + (i % 2) * 0.8, 0.7, 0.55);
    }
    // seaweed swaying around the hoard and the wreck
    for (let i = 0; i < 10; i++) {
      const u = q((t * 0.5 + hh(i, 6)) % 1, 30), a = i * 0.63, d = 2.2 + (i % 4) * 1.1;
      if (Math.hypot(HOARD[0] + Math.cos(a) * d - c.pos[0], HOARD[2] + Math.sin(a) * d * 0.8 - c.pos[2]) < 3) continue; // never in front of the lens
      fxAt(out, `weed${i % 2}${u}`, 128, 512, (p) => weed(p, u, i), HOARD[0] + Math.cos(a) * d, BED + 1.2, HOARD[2] + Math.sin(a) * d * 0.8, 0.45, 1.8);
    }
    // gold glints twinkling on the heap
    for (let i = 0; i < 8; i++) {
      const u = 0.5 + 0.5 * Math.sin(t * 6 + i * 1.7);
      if (u < 0.25) continue;
      fxAt(out, `glint${q(u, 8)}`, 256, 256, (p) => glint(p, u), HOARD[0] + 0.3 + (hh(i, 7) - 0.5) * 2.4, BED + 0.25 + hh(i, 8) * 0.55, HOARD[2] + (hh(i, 9) - 0.5) * 2, 0.32, 0.32, { soft: true });
    }
    // the policy drifting down beside the sack
    fxAt(out, "policy", 512, 360, policy, HOARD[0] - 1.6, BED + 1.35 + 0.08 * Math.sin(t * 1.3), HOARD[2] + 0.9, 1.05, 0.74, { rot: 0.18 + 0.08 * Math.sin(t * 0.9) });
  }
  if (place === "dock" || place === "night") {
    const night = place === "night", c = camAt(f), r = cam.right;
    // the shipowner: smug on the quay with his cigar; hat out for coins on "rich"; at night under an umbrella catching a bigger bag
    const hatUp = !night && f >= T.rich - LEAD && f < CUT.storm1;
    const oexpr = night ? (f >= T.richer - LEAD ? "laugh" : "smug") : hatUp ? "grin" : f >= T.nasty - LEAD ? "grin" : "smug";
    P({ i: 30, o: OWNER_O, okey: "owner" }, OWNER[0], 0, OWNER[2], { mode: "stand", expr: oexpr, prop: night ? "umbrella" : hatUp ? "hatUp" : null, facing: 1, tilt: oexpr === "laugh" ? -5 : 0 });
    blob(out, OWNER[0], 0, OWNER[2]);
    if (!night && f < CUT.storm1 && f >= T.nasty - 2) { // a puff of cigar smoke curling up
      const u = q(((f - T.nasty) / FPS * 0.6) % 1, 20); fxAt(out, `cigar${u}`, 300, 300, (p) => fxBurst(p, u, "#d9dde6", 5, 30, 120), OWNER[0] + r.x * 0.35, 1.9 + u * 0.4, OWNER[2] + r.z * 0.35, 0.45, 0.45, { soft: true });
    }
    if (hatUp) for (let k = 0; k < 28; k++) { // coins raining into the upturned hat
      const age = (f - T.rich) / FPS - (k % 14) * 0.045 - Math.floor(k / 14) * 0.4;
      if (age < 0 || age > 0.5) continue;
      const hx = OWNER[0] + r.x * 0.55, hz = OWNER[2] + r.z * 0.55, y = 3.7 - 9.8 * age * age * 2.4;
      if (y < 2.25) continue;
      fxAt(out, `coin${k % 3}`, 128, 128, (p) => coin(p, k), hx + (hh(k, 3) - 0.5) * 0.36, y, hz + (hh(k, 4) - 0.5) * 0.2, 0.2, 0.2);
    }
    if (night) {
      if (f >= T.richer - 8) { // the bag drops out of the sky into his arm
        const u = clamp01((f - (T.richer - 8)) / 8), y = 6.2 - 5.25 * u * u; // lands in the crook of his arm
        fxAt(out, "bag", 300, 300, bag, OWNER[0] - r.x * 0.32, y, OWNER[2] + 0.25, 0.6, 0.6);
        if (f >= T.richer && f < T.richer + 8) { const v = (f - T.richer) / 8; fxAt(out, `thump${q(v, 8)}`, 500, 500, (p) => fxBurst(p, v, "#ffe08a", 8, 110, 230), OWNER[0] - r.x * 0.7, 1.25, OWNER[2] + 0.3, 0.7, 0.7); }
      }
      for (let i = 0; i < 180; i++) { // rain in front of the lens
        const sp = 12, y = 1.5 + 4.2 - (((f / FPS) * sp + hh(i, 1) * 4.2) % 4.2), x = c.pos[0] - 3 + hh(i, 2) * 6, z = c.pos[2] - 4.5 + hh(i, 3) * 4;
        fxAt(out, "rain", 24, 256, rainStreak, x, y, z, 0.03, 0.55, { soft: true, rot: 0.12 });
      }
    } else {
      // the clerk behind his desk: stamp raised, slammed on "insure"
      const sw = smooth((f - (T.insure + 5)) / 4);
      P({ i: 31, o: CLERK_O, okey: "clerk" }, DESK[0] + 0.15, 0, DESK[2] - 0.75, { mode: "stand", expr: f >= T.insure + 9 ? "smug" : "neutral", prop: "stamp", swing: sw, facing: -1 });
      const stamped = f >= T.insure + 9;
      if (f < T.rotting - 3) fxAt(out, `policy${stamped ? 1 : 0}`, 512, 360, policyFlat(stamped), DESK[0] - 0.22, 0.88, DESK[2], 0.46, 0.33, { flat: true, rot: 0.15 });
      if (f >= T.insure + 9 && f < T.insure + 17) { const v = (f - T.insure - 9) / 8; fxAt(out, `stampHit${q(v, 8)}`, 500, 500, (p) => fxBurst(p, v, "#fff3d0", 8, 70, 220), DESK[0] - 0.22, 0.95, DESK[2], 0.4, 0.4); }
      if (f >= T.insure - 3 && f < T.insure + 18) { // macro insert: the hand comes down with the stamp, then lifts away
        const down = smooth((f - (T.insure + 3)) / 6), up = smooth((f - (T.insure + 12)) / 5), h = 0.98 + 0.55 * (1 - down) + 0.6 * up;
        fxAt(out, `stampHand${down > 0.9 && up < 0.1 ? 1 : 0}`, 300, 300, (p) => stampHand(p, down > 0.9 && up < 0.1 ? 1 : 0), DESK[0] - 0.2, h, DESK[2] + 0.02, 0.34, 0.34);
      }
      if (f >= T.rotting - 3) { // blown off the desk to the hull, then stuck there
        const pt = paperAt(f), spin = f < T.rotting + 17 ? (f - T.rotting) * 0.35 : 0.2;
        fxAt(out, "policy1", 512, 360, policyFlat(true), pt[0], pt[1] + 0.15, pt[2] - (f >= T.rotting + 17 ? 0.04 : 0), 0.5, 0.36, { rot: spin });
      }
      // the rat: looks out of a hole on "old", jumps ship on "floating"
      if (f >= T.old - 4 && f < T.cram) { const u = smooth((f - T.old + 4) / 8); fxAt(out, `rat${q(((f / FPS) * 2) % 1, 6)}`, 300, 260, (p) => rat(p, (f / FPS) * 2 % 1), HULLPT[0] + 0.55, HULLPT[1] - 0.18 + 0.06 * u, HULLPT[2] - 0.08 - 0.1 * u, 0.32 * u + 0.01, 0.28 * u + 0.01); }
      if (f >= T.floating - 4 && f < T.floating + 14) {
        const u = (f - T.floating + 4) / 18, x = DSHIP[0] - 1 + 2.4 * u, y = shipSink(f) + 0.2 + 1.4 * Math.sin(Math.PI * u), z = 1.6 - 2.2 * u;
        fxAt(out, `ratLeap${q(u, 6)}`, 300, 200, (p) => ratSide(p, u), x, y, z, 0.42, 0.28);
      }
      // sailors: two on the quay, three nervous on the sinking deck
      if (f < T.makes - 2) {
        [[DX + 7.5, -3.6, 0], [DX - 9.5, -4.4, 1]].forEach(([x, z, k]) => P({ i: 40 + k, o: SAILOR(k), okey: "sailorQ" + k }, x, 0, z, { mode: "stand", expr: k ? "stern" : "neutral", look: k ? 0.5 : -0.5 }));
        if (f >= T.cram - 5) [[-1.6, 3.6, 2], [1.2, 2.9, 3], [3.4, 3.7, 4]].forEach(([dx, z, k]) => P({ i: 40 + k, o: SAILOR(k), okey: "sailorD" + k }, DSHIP[0] + dx, shipSink(f) + 0.06, z, { mode: "stand", expr: f >= T.until - LEAD ? "nervous" : "stern", look: 0.4 }));
      }
      // gulls in the fog
      [[DX + 6, 9, 8], [DX - 4, 11, 12]].forEach(([x, y, z], k) => { const u = q(((f / FPS) * 2.1 + k * 0.4) % 1, 12); fxAt(out, `gull${u}`, 128, 100, (p) => gull(p, u), x + (f / FPS) * 1.5, y, z, 1.1, 0.85); });
    }
  }

  if (place === "dawn") {
    const r = cam.right;
    // Plimsoll: strides in with his pot of white paint; stops, an idea, the brush goes up
    const w = plimWalk(f), stopped = f >= T.pushes - 4;
    P({ i: 1, o: PLIMSOLL, okey: "plim" }, w.pos[0], 0, w.pos[2], stopped
      ? { mode: "stand", expr: f >= T.simple - LEAD ? "smug" : "stern", prop: "brush", swing: q(((f - T.pushes) / FPS * 1.2) % 1, 12), facing: 1, tilt: 2 }
      : { mode: w.walking ? "stroll" : "stand", phase: q(w.phase % 1, 24), expr: "stern", prop: "paint", tilt: 3 });
    blob(out, w.pos[0], 0, w.pos[2]);
    if (f >= T.simple - 4 && f < T.simple + 12) { const v = (f - T.simple + 4) / 16; fxAt(out, `idea${q(v, 8)}`, 500, 500, (p) => fxBurst(p, v, "#ffe066", 9, 60, 200), w.pos[0] + r.x * 0.2, 2.45, w.pos[2] + r.z * 0.2, 0.7, 0.7); }
    // sailors watching from the quay; caps go up on "home"
    const late = f >= T.stays - 7; // for the board and the cheer they gather round the harbour master, at the quay edge behind him
    const SAIL: [number, number, number][] = late ? [[HARB[0] - 1.05, -0.35, 0], [HARB[0] + 1.1, -0.45, 1], [HARB[0] - 0.2, -0.15, 2], [HARB[0] + 2.2, -0.6, 3]]
      : [[PL_STOP[0] + 1.6, -2.7, 0], [PL_STOP[0] + 3.0, -3.3, 1], [PL_STOP[0] - 1.4, -3.4, 2], [HARB[0] + 1.6, -2.4, 3]];
    SAIL.forEach(([x, z, k]) => {
      const cheer = f >= T.home - LEAD;
      P({ i: 40 + k, o: SAILOR(k), okey: "sailorDawn" + k }, x, 0, z, { mode: "stand", expr: cheer ? "laugh" : f >= T.water ? "shock" : "neutral", wave: cheer ? q(0.5 + 0.5 * Math.sin(f * 0.5 + k), 10) : undefined });
      blob(out, x, 0, z);
      if (cheer && f < T.home + 26) { const u = (f - T.home) / 26; fxAt(out, `cap${k}`, 128, 128, (p) => capFly(p, SAILOR(k).cap!), x + r.x * 0.2, 2.0 + 3.2 * u - 3 * u * u, z, 0.35, 0.35, { rot: u * 6 + k }); }
    });
    // the harbour master: board up, slammed down on "stays"
    const sw = smooth((f - (T.stays - 1)) / 4);
    P({ i: 50, o: HARBOUR_O, okey: "harbour" }, HARB[0], 0, HARB[2], { mode: "stand", expr: f >= T.stays - LEAD ? "stern" : "neutral", prop: "board", swing: sw, facing: -1 });
    blob(out, HARB[0], 0, HARB[2]);
    if (f >= T.stays + 3 && f < T.stays + 11) { const v = (f - T.stays - 3) / 8; fxAt(out, `slam${q(v, 8)}`, 500, 500, (p) => fxBurst(p, v, "#f3e6c8", 8, 80, 220), HARB[0] + r.x * 0.45, 0.45, HARB[2] + r.z * 0.45, 0.8, 0.8); }
    // the macro: a hand with the brush rides the tip of every stroke of the mark
    if (f >= T.paint - 2 && f < T.everyHull + 16) {
      const kk = Math.max(0, Math.min(16, (16 * (f - T.paint)) / (T.everyHull + 12 - T.paint))), ca = Math.min(1, kk / 10), la = Math.max(0, Math.min(1, (kk - 10) / 6));
      let px = 128, py = 44;
      if (la <= 0) { const th = -Math.PI / 2 + ca * Math.PI * 2; px = 128 + 84 * Math.cos(th); py = 128 + 84 * Math.sin(th); } else { px = 6 + 244 * la; py = 128; }
      const my = dawnSink(f) - 0.5;
      fxAt(out, "brushHand", 300, 300, brushHand, MARK[0] + ((px - 128) * 1.2) / 256 + 0.12, my - ((py - 128) * 1.2) / 256 + 0.14, MARK[2] + 0.18, 0.55, 0.55);
    }
    // ripples where the water meets the hull as it is loaded
    if (f >= T.water - 6) for (let i = 0; i < 3; i++) { const u = q(((f / FPS) * 1.1 + i / 3) % 1, 20); fxAt(out, `ring${u}`, 600, 600, (p) => fxRing(p, u), MARK[0] - 1 + i, DW + 0.02, MARK[2] + 0.6, 1.6, 1.6, { flat: true }); }
  }

  if (place === "storm") {
    const c = camAt(f);
    for (let i = 0; i < 220; i++) {
      const sp = 14, y = c.pos[1] - 2 + 6 - (((f / FPS) * sp + hh(i, 1) * 6) % 6), x = c.pos[0] + 1 + hh(i, 2) * 8, z = c.pos[2] - 6 + hh(i, 3) * 8;
      fxAt(out, "rain", 24, 256, rainStreak, x, y, z, 0.04, 0.7, { soft: true, rot: 0.25 });
    }
    for (const s0 of STRIKES) { const n = f - s0; if (n >= 0 && n < 3) fxAt(out, `bolt${s0 % 5}`, 400, 600, (p) => bolt(p, s0 % 5), SX + 18 - (s0 % 3) * 12, 26, -60, 22, 33); }
    for (let k = 0; k < 4; k++) { // waves bursting over the bow
      const u = q(((f / FPS) * 0.9 + k * 0.25) % 1, 20);
      fxAt(out, `splash${u}`, 600, 600, (p) => fxSplash(p, u), SX - 4 + k * 3, 1.2, 2.6 - (k % 2) * 4, 3.2, 3.2);
    }
  }
  void smooth; void DX;
  return out;
};
export { INK };
