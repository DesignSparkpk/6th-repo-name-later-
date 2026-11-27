// Who is on screen and what they do in "Why NASA's Telescope Had to Wear Glasses", plus the flat 2D effect cards
// (steam, sparks, flashes). Characters are the lit cards of the engine (Actor / Pool in ../bridge/cast); they breathe
// (a slow scale bob), blink on their own clocks and squash a little on impacts.
import * as THREE from "three";
import { Pen, bodyFront, SKIN, fxBurst, Outfit, FrontOpts } from "./toon";
import type { FxPlace, Stage, CamInfo, Place as Card } from "../bridge/cast";
import { FPS, T, CUT, CROC, HB, RAIL, WIN, BATH, clamp01, smooth } from "./story";
import type { Place } from "./story";

// ---------------- cast ----------------
export const CROC_O: Outfit = { jacket: "#f2f0ea", style: "collar", trim: "#2c4f86", pants: "#4a4f5c", boots: "#2a2a30", hat: "hair", hair: "#6a5644", specs: true, skin: SKIN };
const CROC_SHOWER: Outfit = { jacket: SKIN, style: "bare", pants: SKIN, boots: SKIN, hat: "showercap", skin: SKIN };

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

// ---------------- stage ----------------
export const stage = (place: Place, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  if (cam.sun) SUN.copy(cam.sun).normalize();
  const P = (who: Who, x: number, y: number, z: number, fo: FrontOpts, sc = 1) => out.places.push(person(cam, who, x, y, z, { blink: lidAt(f, who.i), ...fo }, sc * breathe(f, who.i)));

  if (place === "bath") {
    // Crocker under the hot water, hand up on the shower head, staring at it (deadpan); later he slides it and it tilts
    const eureka = f >= T.freeze - 2 && f < CUT.clean;
    P({ i: 1, o: CROC_SHOWER, okey: "crocShower" }, CROC[0], CROC[1], CROC[2], { mode: "stand", expr: eureka ? (f >= T.mirrors - 2 ? "shock" : "dazed") : "neutral", prop: eureka ? null : "showerhead", look: eureka ? 0 : 0.85, facing: eureka ? 0 : 1, headTilt: eureka ? 0 : 7 });
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
  void clamp01;
  return out;
};
