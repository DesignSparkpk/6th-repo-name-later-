// Who is on screen and what they do, plus the flat 2D effect cards (shout burst, splash, bubbles, fish, seaweed,
// coin glints, the INSURED policy). Characters are the template's lit cards (Actor / Pool from ../bridge/cast).
import * as THREE from "three";
import { Pen, bodyFront, SKIN, INK, fxBurst, fxRing, fxSplash, fxShadow, fxContact, Outfit, FrontOpts } from "./toon";
import type { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import { FPS, PLIM, WATER, HOARD, BED, COFFIN, T, talking, camAt, clamp01, smooth } from "./story";

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
const gull = (p: Pen, u: number) => { const w = 30 * Math.sin(u * Math.PI * 2); p.stroke([[10, 60 + w], [60, 50], [110, 60 + w]], 9, "#2a2430"); };

// ---------------- staging ----------------
export const stage = (place: "chamber" | "river" | "under", f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  if (cam.sun) SUN.copy(cam.sun).normalize();
  const P = (who: Who, x: number, y: number, z: number, fo: FrontOpts, sc = 1) => { out.places.push(person(cam, who, x, y, z, { blink: lidAt(f, who.i), ...fo }, sc)); };

  if (place === "chamber") {
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
  void smooth;
  return out;
};
export { INK };
