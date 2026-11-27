// Who is on screen and what they do in "Why NASA's Telescope Had to Wear Glasses", plus the flat 2D effect cards
// (steam, sparks, flashes). Characters are the lit cards of the engine (Actor / Pool in ../bridge/cast); they breathe
// (a slow scale bob), blink on their own clocks and squash a little on impacts.
import * as THREE from "three";
import { Pen, bodyFront, SKIN, fxBurst, Outfit, FrontOpts, shade, INK } from "./toon";
import type { FxPlace, Stage, CamInfo, Place as Card } from "../bridge/cast";
import { FPS, T, CUT, CROC, HB, RAIL, WIN, BATH, clamp01, smooth, PAD, PADL, DECK, LAUNCHES, launchAt, add, CTL, STU, SEN, FLD, LADDER_H, swayAt, crocWalkX, FACADE_Z, HUB, EVA_ON, boxSlide, PRS } from "./story";
import { EVA } from "./setsEva";
import { SEATS, ROWS, MUG as MUGW } from "./setsControl";
import type { Place } from "./story";
import { speaking as speakingLine } from "./story";

// ---------------- cast ----------------
export const CROC_O: Outfit = { jacket: "#f2f0ea", style: "collar", trim: "#2c4f86", pants: "#4a4f5c", boots: "#2a2a30", hat: "hair", hair: "#6a5644", specs: true, skin: SKIN };
const CROC_SHOWER: Outfit = { jacket: SKIN, style: "bare", pants: SKIN, boots: SKIN, hat: "showercap", skin: SKIN };
const CROC_COAT: Outfit = { ...CROC_O, jacket: "#b49a6e", style: "collar", trim: "#2c4f86" };
// the control room's engineers (short sleeves, ties, headsets); index 1 is the lead, front row, by the mug
const ENG: Outfit[] = [
  { jacket: "#f2f0ea", style: "collar", trim: "#7a2a3a", pants: "#4a4f5c", boots: "#2a2a30", hat: "hair", hair: "#3a2c22", specs: true, headset: true, skin: SKIN },
  { jacket: "#dfe7f2", style: "collar", trim: "#2c4f86", pants: "#3b3f52", boots: "#2a2a30", hat: "hair", hair: "#6a5644", specs: true, headset: true, skin: SKIN },
  { jacket: "#f2ead8", style: "collar", trim: "#2f6a3a", pants: "#4a4f5c", boots: "#2a2a30", hat: "bob", hair: "#8a5a30", headset: true, skin: SKIN },
  { jacket: "#e8eef6", style: "collar", trim: "#b8323a", pants: "#3b3f52", boots: "#2a2a30", hat: "hair", hair: "#1e1a18", headset: true, skin: SKIN },
  { jacket: "#f4f1e6", style: "collar", trim: "#5a3a8a", pants: "#4a4f5c", boots: "#2a2a30", hat: "hair", hair: "#a87a40", specs: true, headset: true, skin: SKIN },
  { jacket: "#e6ecf4", style: "collar", trim: "#c08a2a", pants: "#3b3f52", boots: "#2a2a30", hat: "bob", hair: "#2a2018", headset: true, skin: SKIN },
  { jacket: "#f2f0ea", style: "collar", trim: "#2c6a7a", pants: "#4a4f5c", boots: "#2a2a30", hat: "hair", hair: "#5a4632", headset: true, skin: SKIN },
  { jacket: "#dfe7f2", style: "collar", trim: "#8a2a2a", pants: "#3b3f52", boots: "#2a2a30", hat: "hair", hair: "#7a6a5a", specs: true, headset: true, skin: SKIN },
  { jacket: "#f2ead8", style: "collar", trim: "#2c4f86", pants: "#4a4f5c", boots: "#2a2a30", hat: "hair", hair: "#3a2c22", headset: true, skin: SKIN },
];
/** a seated engineer seen from behind, against the bright screens: shirt back, the back of the head, ears, the headset band,
 *  and a cool rim of screen light along the top edges (same 600 x 1000 design space and seat height as bodyFront "sit") */
const bodyBackSit = (p: Pen, o: Outfit, rim = "rgba(150,225,255,0.85)", stand = false) => {
  const g = p.g, cx = 300, hc = stand ? 309 : 576, a = 118, b = 111, top = stand ? 420 : 687;
  const torso: [number, number][] = [];
  for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI; torso.push([cx - Math.cos(t) * 150 * (0.92 + 0.08 * Math.sin(t)), top + 40 - Math.sin(t) * 46]); }
  torso.push([cx + 150, 975], [cx - 150, 975]);
  p.poly(torso, shade(o.jacket, 0.42), 12);
  p.ell(cx - a + 4, hc + 16, 17, 26, shade(o.skin ?? SKIN, 0.5), 8); p.ell(cx + a - 4, hc + 16, 17, 26, shade(o.skin ?? SKIN, 0.5), 8);
  p.ell(cx, hc, a, b, shade(o.hat === "cap" ? (o.cap ?? "#333") : (o.hair ?? "#2a2018"), 0.7), 12);
  if (o.headset) { g.strokeStyle = "#1a1c20"; g.lineWidth = 16; g.beginPath(); g.ellipse(cx, hc + 4, a + 6, b + 6, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); g.strokeStyle = INK; }
  g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 7;
  g.beginPath(); g.ellipse(cx, hc, a - 5, b - 5, 0, Math.PI * 1.18, Math.PI * 1.82); g.stroke();
  g.beginPath(); g.moveTo(cx - 128, top + 30); g.quadraticCurveTo(cx, top - 14, cx + 128, top + 30); g.stroke();
};
// the TV host, the senator, the audience and the press
const HOST: Outfit = { jacket: "#2a3550", style: "collar", trim: "#c0353a", pants: "#2a3550", boots: "#1a1a20", hat: "hair", hair: "#2a2018", skin: SKIN };
const SENATOR: Outfit = { jacket: "#7a2a3a", style: "collar", trim: "#f2ead6", pants: "#5a2030", boots: "#2a1a1a", hat: "bob", hair: "#cdb894", pearls: true, skin: SKIN };
const SENATOR2: Outfit = { jacket: "#2c3550", style: "collar", trim: "#8a2a2a", pants: "#2c3550", boots: "#1a1a20", hat: "hair", hair: "#9a9a9a", specs: true, skin: SKIN };
const BACKS = ["#3a4a6a", "#6a3a4a", "#4a5a3a", "#5a4a6a", "#2a3a4a", "#6a5a3a"];
// 1990 launch spectators at the press site
const DAD: Outfit = { jacket: "#2f9fb0", style: "tee", pants: "#c8b48a", boots: "#f2f0ea", hat: "cap", cap: "#d8453a", specs: true, skin: SKIN };
const MOM: Outfit = { jacket: "#e76fa0", style: "tee", pants: "#34466e", boots: "#f2f0ea", hat: "bob", hair: "#6a4a30", skin: SKIN };
const KIDL: Outfit = { jacket: "#f4c430", style: "tee", pants: "#3a6fd8", boots: "#f2f0ea", hat: "cap", cap: "#3a6fd8", build: "kid", skin: SKIN };

// ---------------- helpers (same rules as the Plimsoll cast) ----------------
const q = (v: number, n = 120) => Math.round(v * n) / n;
export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const tier = (d: number): [number, number, number] => d < 1.6 ? [2400, 4000, 4.0] : d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const light2D = (cam: CamInfo) => { const sx = SUN.dot(cam.right), sy = -SUN.y; return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4); };
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1): Card => {
  const d = cam.pos.distanceTo(new THREE.Vector3(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const f2: FrontOpts = { ...fo, light: light2D(cam), seed: (who.i % 7) + 1 };
  return { key: `F|${who.okey}|${fkey(f2)}`, x, y, z, scale, draw: (p) => bodyFront(p, who.o, f2), size: [w, h, k] };
};
const fxAt = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, ...extra });
/** breathing: a slow 1 % scale bob, each character on its own phase */
const breathe = (f: number, i: number) => 1 + 0.008 * Math.sin((f / FPS) * 2 * Math.PI / (3.2 + hh(i, 4)) + i);

// ---------------- 2D effects ----------------
const steamPuff = (p: Pen, k: number) => { // soft white steam cloud (alpha only, no ink)
  for (let i = 0; i < 6; i++) { const a = i * 1.1 + k, r = 60 + 30 * Math.sin(i * 2.1 + k); p.ell(128 + Math.cos(a) * 46, 128 + Math.sin(a) * 34, r, r * 0.82, `rgba(255,255,255,${0.16 + 0.05 * (i % 3)})`, 0); }
};

/** a lit cumulus puff of launch smoke: lobes with their bright side toward the light (ang = canvas angle the light comes
 *  FROM), lavender shade, soft edges; warm = fresh exhaust still lit orange from below by the flame */
const smokePuff = (p: Pen, k: number, ang: number, warm: boolean, night = false) => {
  const g = p.g, lx = Math.cos(ang), ly = Math.sin(ang);
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    const a = i * 0.83 + k * 1.7, rad = i === 0 ? 0 : 38 + 12 * Math.sin(i * 1.3 + k);
    const cx = 128 + Math.cos(a) * rad, cy = 134 + Math.sin(a) * rad * 0.72, r = i === 0 ? 84 : 50 + 15 * Math.sin(i * 2.1 + k);
    const gr = g.createRadialGradient(cx + lx * r * 0.5, cy + ly * r * 0.5, r * 0.05, cx, cy, r);
    gr.addColorStop(0, night ? (warm ? "rgba(255,214,150,0.96)" : "rgba(196,140,110,0.92)") : warm ? "rgba(255,238,210,0.96)" : "rgba(255,247,234,0.96)");
    gr.addColorStop(0.5, night ? (warm ? "rgba(200,120,80,0.9)" : "rgba(110,72,70,0.88)") : warm ? "rgba(240,196,160,0.9)" : "rgba(228,218,216,0.9)");
    gr.addColorStop(0.84, night ? "rgba(46,34,44,0.6)" : "rgba(162,152,180,0.62)");
    gr.addColorStop(1, night ? "rgba(30,24,32,0)" : "rgba(150,140,170,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  }
  if (warm) {
    const gr = g.createRadialGradient(128, 236, 6, 128, 200, 130); gr.addColorStop(0, "rgba(255,170,78,0.85)"); gr.addColorStop(1, "rgba(255,140,60,0)");
    g.globalCompositeOperation = "source-atop"; g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = "source-over";
  }
};
/** the launch's smoke: main-engine steam, booster clouds rolling out of both trench mouths, a billow round the launcher,
 *  and the column the boosters leave behind as the stack climbs. Every puff is a pure function of its age. */
const launchSmoke = (out: Stage, f: number, cam: CamInfo, Lk: { ssme: number; srb: number }, night = false) => {
  const ang = night ? Math.PI / 2 : light2D(cam);
  const puff = (k: number, x: number, y: number, z: number, s: number, age: number, warmUntil = 8, rot = 0) => {
    if (age < 0) return;
    const warm = age < warmUntil, a = q(ang, 4);
    fxAt(out, `smk${k % 6}|${a}|${warm ? 1 : 0}|${night ? 1 : 0}`, 256, 256, (p) => smokePuff(p, k % 6, a, warm, night), PAD[0] + x, PAD[1] + y, PAD[2] + z, s, s * 0.86, { soft: true, rot: rot + hh(k, 7) * 6 });
  };
  const e = (age: number, tau: number) => 1 - Math.exp(-Math.max(0, age) / tau);
  // main-engine steam pouring off the deck under the tail
  for (let i = 0; i < 10; i++) {
    const age = f - Lk.ssme - i * 0.6, sx = i % 2 ? 1 : -1, u = e(age, 10);
    puff(i, sx * (3 + 16 * u * (0.5 + hh(i, 1))), DECK - 1 + 4 * u * hh(i, 2), 9 + 9 * u * hh(i, 3), 6 + 15 * u, age, 0);
  }
  // booster clouds out of both trench mouths, rolling along the ground and climbing as they slow
  for (const sd of [-1, 1]) for (let i = 0; i < 22; i++) {
    const k = 100 + i + (sd > 0 ? 50 : 0), age = f - Lk.srb - i * 0.45, u = e(age, 16);
    puff(k, sd * (PADL.trench + 4 + 100 * u * (0.55 + 0.6 * hh(k, 1))), -3 + 8 * e(age, 22) + Math.max(0, age) * 0.16, (hh(k, 2) - 0.5) * 12 + (hh(k, 3) - 0.5) * 56 * u,
      9 + 34 * u * (0.7 + 0.6 * hh(k, 4)), age, 9);
  }
  // the billow round the launcher
  for (let i = 0; i < 14; i++) {
    const k = 200 + i, age = f - Lk.srb - 1 - i * 0.7, u = e(age, 14), a = hh(k, 1) * Math.PI * 2;
    puff(k, Math.cos(a) * (14 + 16 * u), DECK - 5 + 16 * u * (0.5 + hh(k, 2)), Math.sin(a) * (12 + 14 * u) + 4, 10 + 24 * u, age, 6);
  }
  // the column: one puff per booster per frame since liftoff, left where the nozzle was
  const L0 = f < CUT.control ? LAUNCHES[0] : LAUNCHES[1];
  for (let j = L0.srb + 1; j <= f; j++) for (const sd of [-1, 1]) {
    const k = 300 + j * 2 + (sd > 0 ? 1 : 0), age = f - j - 2, h = launchAt(j).h;   // the trail forms behind the flame's tip
    puff(k, sd * PADL.srbX * (1 + 0.1 * e(age, 12)), DECK + h - 30 + age * 0.05, (hh(k, 2) - 0.5) * 2, 8 + 10 * e(age, 10), age, 3);
  }
};

// ---------------- stage ----------------
export const stage = (place: Place, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  if (cam.sun) SUN.copy(cam.sun).normalize();
  const P = (who: Who, x: number, y: number, z: number, fo: FrontOpts, sc = 1) => out.places.push(person(cam, who, x, y, z, { blink: lidAt(f, who.i), ...fo }, sc * breathe(f, who.i)));

  if (place === "bath") {
    // Crocker under the hot water, hand up on the shower head, staring at it (deadpan); later he slides it and it tilts
    // eureka: frozen wide-eyed on "freezes", then "Mirrors... on little arms" (mouth open on the words, a slow grin between)
    const eureka = f >= T.freeze && f < CUT.clean, talk = eureka && f >= T.mirrors - 1 && speakingLine(f, "freeze");
    const expr = !eureka ? "neutral" : f < T.mirrors - 1 ? "shock" : talk ? (Math.floor(f / 3) % 2 ? "relief_open" : "shock") : "smile";
    P({ i: 1, o: CROC_SHOWER, okey: "crocShower" }, CROC[0], CROC[1], CROC[2], { mode: "stand", expr, prop: eureka ? null : "showerhead", look: eureka ? 0 : 0.85, facing: eureka ? 0 : 1, headTilt: eureka ? 0 : 7 });
    if (eureka) {
      // the idea hits: a burst behind his head, and a blob of soap foam slides off his cap
      const bu = (f - T.freeze) / 12;
      if (bu >= 0 && bu < 1) fxAt(out, `idea${q(bu, 12)}`, 256, 256, (p) => fxBurst(p, bu, "#ffe27a", 12, 30, 120), CROC[0] - 0.05, CROC[1] + 1.62, CROC[2] - 0.35, 1.3, 1.3);
      const fu = clamp01((f - T.freeze - 8) / 30);
      fxAt(out, "foam", 256, 256, (p) => steamPuff(p, 2), CROC[0] + 0.22, CROC[1] + 1.86 - 0.45 * fu * fu, CROC[2] + 0.12, 0.2, 0.16, { soft: true });
    }
    // steam: puffs rise off the hot water, drift toward the open window and pour out of it
    for (let k = 0; k < 16; k++) {
      const per = 70 + 30 * hh(k, 1), u = (((f + hh(k, 2) * per) % per) / per), x0 = CROC[0] + (hh(k, 3) - 0.5) * 0.7, z0 = CROC[2] - 0.2 + hh(k, 5) * 0.5;
      const tw = smooth((u - 0.35) / 0.65), x = x0 + (WIN.x - x0) * tw * (k % 2 ? 1 : 0.6), z = z0 + (BATH.z1 + 0.6 - z0) * tw * (k % 2 ? 1 : 0.4);
      const y = HB + 1.75 + u * 1.0, s = 0.35 + 0.8 * u, op = Math.sin(Math.PI * u);
      if (op < 0.05 || (u < 0.3 && Math.abs(x - CROC[0]) < 0.3)) continue;   // keep his face clear
      fxAt(out, `steam${k % 4}`, 256, 256, (p) => steamPuff(p, k % 4), x, y, z - 0.25, s, s * 0.8, { soft: true, rot: hh(k, 6) * 6 + u });
    }
    // water hitting his shoulders: a little splash burst
    const sp = (f % 9) / 9;
    fxAt(out, `splash${q(sp, 9)}`, 256, 256, (p) => fxBurst(p, sp, "#e8f4ff", 7, 20, 90), CROC[0] + 0.18, HB + 1.42, CROC[2] + 0.05, 0.28, 0.28, { soft: true });
    void RAIL;
  }
  if (place === "pad") {
    // the press site: three spectators gasp at ignition, then cheer as it climbs
    const pr = add(PAD, PADL.press), rt = [0.808, 0, 0.589], cheer = f >= T.launches + 6;
    const at = (o: number, d = 0): [number, number, number] => [pr[0] + rt[0] * o - 0.589 * d, pr[1], pr[2] + rt[2] * o + 0.808 * d];
    const ph = (i: number) => ((f + i * 3) * 0.16) % 1;
    // a family, staggered in depth so all three fit the tall frame: the kid in front, the parents behind either side
    P({ i: 11, o: DAD, okey: "dad" }, ...at(0.55, 0.6), { mode: "stand", expr: cheer ? "laugh" : "shock", prop: cheer ? null : "camera", fist: cheer ? ph(0) : undefined, look: -0.2 });
    P({ i: 12, o: MOM, okey: "mom" }, ...at(-0.5, 0.45), { mode: "stand", expr: cheer ? "laugh" : "shock", wave: cheer ? ph(2) : undefined, look: 0.2 });
    P({ i: 13, o: KIDL, okey: "kidl" }, ...at(0.02, -0.4), { mode: "stand", expr: cheer ? "laugh" : "shock", fist: cheer ? ph(4) : undefined, look: 0 });
    // more of the crowd further back (soft in the lens)
    const CROWD: Outfit[] = [
      { jacket: "#f08a2c", style: "tee", pants: "#3b3f52", boots: "#f2f0ea", hat: "cap", cap: "#2e6db4", skin: SKIN },
      { jacket: "#7b5ac9", style: "tee", pants: "#c8b48a", boots: "#5a3b2a", hat: "hair", hair: "#3a2c22", skin: SKIN },
      { jacket: "#3aa070", style: "hawaii", pants: "#34466e", boots: "#f2f0ea", hat: "hair", hair: "#a87a40", specs: true, skin: SKIN },
      { jacket: "#e2453c", style: "tee", pants: "#3b5b9a", boots: "#f2f0ea", hat: "bob", hair: "#2a2018", skin: SKIN },
      { jacket: "#f2f0ea", style: "collar", pants: "#4a4f5c", boots: "#2a2a30", hat: "hair", hair: "#5a4632", skin: SKIN },
      { jacket: "#2c4f86", style: "tee", pants: "#c8b48a", boots: "#f2f0ea", hat: "cap", cap: "#f4c430", skin: SKIN },
    ];
    CROWD.forEach((o, i) => P({ i: 20 + i, o, okey: "crowd" + i }, ...at(-3.2 + i * 1.35 + (hh(i, 3) - 0.5) * 0.6, 5.5 + hh(i, 5) * 4), { mode: "stand", expr: cheer ? (i % 2 ? "laugh" : "grin") : "shock", fist: cheer && i % 3 === 0 ? ph(i) : undefined, wave: cheer && i % 3 === 1 ? ph(i + 1) : undefined }));
    const Lk = LAUNCHES[0], lit = launchAt(f);
    if (lit.lit) launchSmoke(out, f, cam, Lk);
  }
  if (place === "control" && f >= CUT.control2) {
    // 1994: nervous while it loads; on "razor sharp" the room erupts - fists, waves, papers in the air
    const win = f >= T.razor + 2;
    SEATS.forEach(([ri, x], i) => {
      const r = ROWS[ri], wx = CTL[0] + x + (i === 1 ? 0 : (hh(i, 2) - 0.5) * 0.25), wy = CTL[1] + r.y + 0.4 + (win ? 0.05 * Math.abs(Math.sin((f + i * 4) * 0.5)) : 0), wz = CTL[2] + r.z + 0.9;
      const who = { i: 30 + i, o: ENG[i % ENG.length], okey: "eng" + i };
      if (cam.pos.z > wz + 0.2) { out.places.push({ key: `B|eng${i}`, x: wx, y: wy, z: wz, scale: 1, draw: (pp) => bodyBackSit(pp, who.o), size: [480, 800, 0.8] }); return; }
      const ph = ((f + i * 3) * 0.18) % 1;
      P(who, wx, wy, wz, { mode: "sit", expr: win ? (i % 2 ? "laugh" : "relief_open") : "nervous", fist: win && i % 2 === 0 ? ph : undefined, wave: win && i % 2 === 1 ? ph : undefined, look: (hh(i, 6) - 0.5) * 0.4 });
    });
    if (win) for (let k = 0; k < 14; k++) {   // papers thrown up, fluttering down
      const t = (f - T.razor - 2) / FPS, x = CTL[0] - 1.6 + (hh(k, 1) - 0.5) * 3.2, z = CTL[2] - 3.2 + hh(k, 2) * 2.6, vy = 3.2 + hh(k, 3) * 1.6;
      const y = CTL[1] + 1.3 + vy * t - 2.4 * t * t, rot = (hh(k, 4) - 0.5) * 6 + t * (2 + hh(k, 5) * 4);
      fxAt(out, "paper", 64, 80, (p) => { const g = p.g; g.fillStyle = "#f4f1ea"; g.fillRect(4, 4, 56, 72); g.strokeStyle = "#241726"; g.lineWidth = 3; g.strokeRect(4, 4, 56, 72); g.fillStyle = "#9aa1ab"; for (let l = 0; l < 6; l++) g.fillRect(12, 16 + l * 9, 40, 3); }, x, Math.max(CTL[1] + 0.9, y), z, 0.2, 0.25, { rot });
    }
  }
  if (place === "control" && f < CUT.tube) {
    // 1990: anticipation (leaning in, hopeful smiles), then the picture lands blurry: shock, then crushed; the lead is dazed
    const done = f >= T.completely + 7, crushed = f >= T.blurry;
    SEATS.forEach(([ri, x], i) => {
      const r = ROWS[ri], wx = CTL[0] + x + (i === 1 ? 0 : (hh(i, 2) - 0.5) * 0.25), wy = CTL[1] + r.y + 0.4, wz = CTL[2] + r.z + 0.9;
      const who = { i: 30 + i, o: ENG[i % ENG.length], okey: "eng" + i };
      if (cam.pos.z > wz + 0.2) {            // camera behind them: backlit silhouettes
        out.places.push({ key: `B|eng${i}`, x: wx, y: wy, z: wz, scale: 1, draw: (pp) => bodyBackSit(pp, who.o), size: [480, 800, 0.8] });
        return;
      }
      const lead = i === 1;
      const expr = crushed ? (lead ? "dazed" : i % 3 === 0 ? "pained" : "shock") : done ? "shock" : f >= T.completely ? "smile" : "grin";
      P(who, wx, wy, wz, { mode: "sit", expr, look: lead ? 0 : (hh(i, 6) - 0.5) * 0.6, headTilt: crushed ? (lead ? -8 : (hh(i, 7) - 0.5) * 10) : 0 });
    });
    // the coffee leaps out of the mug as it goes over
    const sp = (f - T.blurry - 4) / 10;
    if (sp >= 0 && sp < 1) fxAt(out, `coffee${q(sp, 10)}`, 256, 256, (p) => fxBurst(p, sp, "#6a3a1c", 9, 18, 110), MUGW[0] - 0.12, MUGW[1] + 0.06, MUGW[2] - 0.02, 0.26, 0.26);
  }
  if (place === "studio") {
    // the host, laughing, holds up the blurry print; the audience in the foreground rocks with laughter (backlit)
    P({ i: 40, o: HOST, okey: "host" }, STU[0] - 1.35, STU[1] + 0.45, STU[2] - 3.1, { mode: "stand", expr: "laugh", prop: "blurryPrint", look: 0.1 });
    for (let k = 0; k < 9; k++) {
      const row = k < 5 ? 0 : 1, x = STU[0] - 2.4 + (row ? 0.6 : 0) + (k - (row ? 5 : 0)) * 1.2 + (hh(k, 1) - 0.5) * 0.3, z = STU[2] + 3.6 + row * 1.2;
      const bob = 0.035 * Math.abs(Math.sin((f + k * 5) * 0.55)), o: Outfit = { jacket: BACKS[k % 6], pants: "#222", boots: "#222", hat: k % 3 ? "hair" : "bob", hair: ["#2a2018", "#5a4632", "#8a6a40"][k % 3], skin: SKIN };
      out.places.push({ key: `A|aud${k}`, x, y: STU[1] + 0.05 + row * 0.25 + bob, z, scale: 1, draw: (pp) => bodyBackSit(pp, o, "rgba(255,190,230,0.8)"), size: [480, 800, 0.8] });
    }
  }
  if (place === "senate") {
    // the senator at the dais; on "techno-turkey" she says it into the mic and points at the chart
    const say = f >= T.turkey && f < T.turkey + 22, open = say && Math.floor((f - T.turkey) / 3) % 2 === 0;
    P({ i: 41, o: SENATOR, okey: "senator" }, SEN[0], SEN[1] + 1.0, SEN[2] - 2.75, { mode: "sit", expr: say ? (open ? "yell" : "smug") : "stern", point: f >= T.turkey - 2, look: f >= T.turkey ? -0.4 : 0 });
    P({ i: 42, o: SENATOR2, okey: "sen2" }, SEN[0] - 4, SEN[1] + 1.0, SEN[2] - 3.6, { mode: "sit", expr: f >= T.turkey ? "smug" : "neutral", look: 0.6 });
    P({ i: 43, o: { ...SENATOR2, hair: "#3a2c22", specs: false, trim: "#2c4f86" }, okey: "sen3" }, SEN[0] + 4, SEN[1] + 1.0, SEN[2] - 3.6, { mode: "sit", expr: f >= T.turkey ? "grin" : "neutral", look: -0.6 });
    // photographers in the foreground (seen from behind)
    for (let k = 0; k < 3; k++) {
      const o: Outfit = { jacket: BACKS[(k + 2) % 6], pants: "#222", boots: "#222", hat: "hair", hair: ["#3a2c22", "#6a5644", "#1e1a18"][k], skin: SKIN };
      out.places.push({ key: `B|press${k}`, x: SEN[0] - 1.3 + k * 1.5, y: SEN[1] - 0.1, z: SEN[2] + 3.5 + (k % 2) * 0.45, scale: 1, draw: (pp) => bodyBackSit(pp, o, "rgba(255,215,170,0.8)", true), size: [480, 800, 0.8] });
    }
  }
  if (place === "field") {
    // the engineer on the top rungs, stretching up with a wrench; when the ladder starts to sway he looks at us
    const sw = swayAt(f), y = FLD[1] + LADDER_H - 1.25, dx = Math.sin(sw) * (LADDER_H - 1.25);
    const late = f >= T.fix - 4;
    P({ i: 50, o: { ...ENG[3], headset: false }, okey: "ladderMan" }, FLD[0] - dx, y * Math.cos(sw) + FLD[1] * 0, FLD[2] + 0.12, { mode: "stand", expr: late ? "nervous" : "pained", prop: "wrenchUp", look: late ? 0 : 0.5, tilt: -sw * 57 });
  }
  if (place === "street") {
    for (let k = 0; k < 8; k++) {   // steam curling out of the lit bathroom window high above
      const per = 60 + 20 * hh(k, 1), u = ((f + hh(k, 2) * per) % per) / per;
      fxAt(out, `steam${k % 4}`, 256, 256, (p) => steamPuff(p, k % 4), WIN.x + (hh(k, 3) - 0.5) * 0.6 + u * 0.4, HB + 1.9 + u * 2.4, FACADE_Z + 0.3 + u * 1.2, 0.6 + u * 1.4, (0.6 + u * 1.4) * 0.8, { soft: true, rot: hh(k, 5) * 6 });
    }
    // he trudges along the wet sidewalk with his suitcase toward the hotel; drizzle streaks past the lens
    const x = crocWalkX(f);
    P({ i: 1, o: CROC_COAT, okey: "crocCoat" }, x, 0.12, 7.4, { mode: "stroll", phase: ((f - CUT.street) * 0.035) % 1, expr: "neutral", prop: "suitcase", facing: -1, look: -0.4, blink: 0.55 });
    for (let k = 0; k < 46; k++) {
      const per = 9 + 5 * hh(k, 1), u = ((f + hh(k, 2) * per) % per) / per;
      const cx = cam.pos.x + (hh(k, 3) - 0.5) * 7, cz = cam.pos.z - 1.5 - hh(k, 4) * 6, cy = cam.pos.y + 3.2 - u * 6.5;
      fxAt(out, "rain", 32, 256, (p) => { const g = p.g, gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(220,230,255,0)"); gr.addColorStop(0.6, "rgba(220,230,255,0.55)"); gr.addColorStop(1, "rgba(220,230,255,0)"); g.fillStyle = gr; g.fillRect(13, 0, 6, 256); }, cx, cy, cz, 0.03, 0.55, { soft: true, rot: 0.08 });
    }
  }
  if (place === "press" && f < CUT.neb) {
    // the senator at the lectern; on "holds it up" up go the prints; she says the line into the microphones
    const up = f >= T.holds, say = f >= T.troubleW - 1 && speakingLine(f, "trouble"), open = say && Math.floor(f / 3) % 2 === 0;
    P({ i: 41, o: SENATOR, okey: "senatorP" }, PRS[0], PRS[1], PRS[2] - 1.75, { mode: "stand", expr: say ? (open ? "relief_open" : "smile") : up ? "grin" : "smile", prop: up ? "prints" : null, look: up ? 0 : 0.3 });
    for (let k = 0; k < 4; k++) {
      const o: Outfit = { jacket: BACKS[(k + 1) % 6], pants: "#222", boots: "#222", hat: k === 2 ? "cap" : "hair", cap: "#2a2a30", hair: ["#3a2c22", "#6a5644", "#1e1a18", "#8a6a40"][k], skin: SKIN };
      out.places.push({ key: `B|pressP${k}`, x: PRS[0] - 1.9 + k * 1.25, y: PRS[1] - 0.15, z: PRS[2] + 3.6 + (k % 2) * 0.5, scale: 1, draw: (pp) => bodyBackSit(pp, o, "rgba(230,240,255,0.8)", true), size: [480, 800, 0.8] });
    }
  }
  if (place === "nightpad") launchSmoke(out, f, cam, LAUNCHES[1], true);
  if (place === "space" && EVA_ON(f)) {
    // the spacewalk: one astronaut on the robot arm's foot restraint with the box, one on the aft shroud's handrail
    const ASTRO: Outfit = { jacket: "#eeeeea", space: true, hat: "helmet", visor: 1, pants: "#eeeeea", boots: "#e6e6e2", skin: SKIN };
    const pa = EVA.plate, slipped = f >= T.slip + 2;
    P({ i: 60, o: ASTRO, okey: "astroA" }, HUB[0] + pa.x, HUB[1] + pa.y + 0.05, HUB[2] + pa.z, { mode: "stand", expr: "neutral", look: -0.5, facing: -1 });
    const closeB = f >= T.one - 1 && f < T.slideL, visor = closeB ? 0 : 1;
    P({ i: 61, o: { ...ASTRO, visor }, okey: "astroB" + visor }, HUB[0] - 4.75, HUB[1] + 0.75, HUB[2] + 2.75, { mode: "stand", expr: slipped ? "shock" : closeB ? "nervous" : "neutral", prop: slipped ? null : "wrench", look: slipped ? 0.6 : 0.2 });
    void boxSlide;
  }
  void clamp01;
  return out;
};
