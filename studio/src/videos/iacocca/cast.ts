// Who is on screen in "I Just Don't Like You", and the 2D effect cards (rain, sparks, papers). Characters are the lit
// cards of the engine (Actor / Pool in ../bridge/cast): they breathe, blink on their own clocks, and are generic cartoon
// stand-ins, not portraits.
import * as THREE from "three";
import { Pen, bodyFront, SKIN, fxBurst, Outfit, FrontOpts } from "./toon";
import type { FxPlace, Stage, CamInfo, Place as Card } from "../bridge/cast";
import { FPS, T, CUT, BRD, TWR, FAC, BOSS, LAMP, clamp01, lerp, throwAt, speaking } from "./story";
import type { Place } from "./story";

// ---------------- cast ----------------
export const HERO: Outfit = { jacket: "#2a3242", style: "collar", trim: "#8a1a2a", pants: "#2a3242", boots: "#16161a", hat: "hair", hair: "#3a3330", specs: true, skin: SKIN };
export const BOSSO: Outfit = { jacket: "#1e1e24", style: "collar", trim: "#4a4a58", pants: "#1e1e24", boots: "#101014", hat: "hair", hair: "#d6d6d6", build: "stout", skin: SKIN };
const GUARD: Outfit = { jacket: "#2a3550", style: "collar", trim: "#c9a248", pants: "#22283a", boots: "#101014", hat: "cap", cap: "#1a1e2a", skin: SKIN };
const WORKER: Outfit = { jacket: "#3a5a8a", style: "zip", pants: "#2c3a5a", boots: "#2a2018", hat: "cap", cap: "#c8a020", skin: SKIN };

// ---------------- helpers (same rules as the Hubble cast) ----------------
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
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, fo: FrontOpts, scale = 1, roll = 0): Card => {
  const d = cam.pos.distanceTo(new THREE.Vector3(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const f2: FrontOpts = { ...fo, light: light2D(cam), seed: (who.i % 7) + 1 };
  return { key: `F|${who.okey}|${fkey(f2)}`, x, y, z, scale, roll, draw: (p) => bodyFront(p, who.o, f2), size: [w, h, k] };
};
const fxAt = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, ...extra });
const breathe = (f: number, i: number) => 1 + 0.008 * Math.sin((f / FPS) * 2 * Math.PI / (3.2 + hh(i, 4)) + i);
const rainStreak = (p: Pen) => { const g = p.g, gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(220,230,255,0)"); gr.addColorStop(0.6, "rgba(220,230,255,0.55)"); gr.addColorStop(1, "rgba(220,230,255,0)"); g.fillStyle = gr; g.fillRect(13, 0, 6, 256); };
const rain = (out: Stage, f: number, cam: CamInfo, n = 50) => {
  for (let k = 0; k < n; k++) {
    const per = 9 + 5 * hh(k, 1), u = ((f + hh(k, 2) * per) % per) / per;
    const cx = cam.pos.x + (hh(k, 3) - 0.5) * 7, cz = cam.pos.z - 1.5 - hh(k, 4) * 6, cy = cam.pos.y + 3.2 - u * 6.5;
    fxAt(out, "rain", 32, 256, rainStreak, cx, cy, cz, 0.03, 0.55, { soft: true, rot: 0.1 });
  }
};
const paperSheet = (p: Pen) => { const g = p.g; g.fillStyle = "#f4f1ea"; g.fillRect(4, 4, 56, 72); g.strokeStyle = "#241726"; g.lineWidth = 3; g.strokeRect(4, 4, 56, 72); g.fillStyle = "#9aa1ab"; for (let l = 0; l < 6; l++) g.fillRect(12, 16 + l * 9, 40, 3); };

// ---------------- stage ----------------
export const stage = (place: Place, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  if (cam.sun) SUN.copy(cam.sun).normalize();
  const P = (who: Who, x: number, y: number, z: number, fo: FrontOpts, sc = 1, roll = 0) => out.places.push(person(cam, who, x, y, z, { blink: lidAt(f, who.i), ...fo }, sc * breathe(f, who.i), roll));

  if (place === "board") {
    // the old man behind his desk: finger up from the first word; the insult itself, cold, mouth moving on the words
    const talk = speaking(f, "quote"), open = talk && Math.floor(f / 3) % 2 === 0;
    P({ i: 2, o: BOSSO, okey: "boss" }, BRD[0] + BOSS[0], BRD[1] + BOSS[1], BRD[2] + BOSS[2], { mode: "stand", expr: talk ? (open ? "angry" : "stern") : "stern", point: f >= 6, look: 0, headTilt: talk ? -4 : 0 });
    // sparks when the lamp pops
    const u = (f - T.you - 2) / 10;
    if (u >= 0 && u < 1) fxAt(out, `spark${q(u, 10)}`, 256, 256, (p) => fxBurst(p, u, "#ffe08a", 10, 16, 110), BRD[0] + LAMP[0], BRD[1] + LAMP[1] + 0.38, BRD[2] + LAMP[2] + 0.1, 0.6, 0.6);
  }
  if (place === "plaza") {
    rain(out, f, cam);
    if (f < CUT.show) {
      // two guards in the doorway; he comes flying out of it, tumbling, and lands on his backside on the wet stone
      const u = throwAt(f), z = lerp(-7.2, -2.6, u), y = Math.sin(Math.PI * Math.min(1, u * 1.05)) * 1.1, roll = u < 1 ? -1.2 * u : -0.25;
      P({ i: 1, o: HERO, okey: "hero" }, TWR[0] + 0.1, TWR[1] + y, TWR[2] + z, { mode: u < 1 ? "fall" : "sit", expr: "shock", look: 0 }, 1, roll);
      for (const sd of [-1, 1]) P({ i: 5 + (sd > 0 ? 1 : 0), o: GUARD, okey: "guard" }, TWR[0] + sd * 0.9, TWR[1], TWR[2] - 7.6, { mode: "stand", expr: "stern", point: u < 0.4, look: -sd * 0.3 });
      // his papers burst out of the box as it hits the ground
      for (let k = 0; k < 8; k++) {
        const t = (f - CUT.plaza - 14) / FPS; if (t < 0) break;
        const x = TWR[0] + (hh(k, 1) - 0.5) * 2.4 * Math.min(1, t * 2), yy = TWR[1] + 0.3 + 2.2 * t - 3 * t * t + hh(k, 2) * 0.4, zz = TWR[2] - 2.4 + (hh(k, 3) - 0.3) * 1.5 * Math.min(1, t * 2);
        fxAt(out, "paper", 64, 80, paperSheet, x, Math.max(TWR[1] + 0.02, yy), zz, 0.22, 0.27, { rot: (hh(k, 4) - 0.5) * 6 + t * 5 });
      }
    } else {
      // "Fired anyway": low on the stone, the little red car slides into frame past him
      P({ i: 1, o: HERO, okey: "hero" }, TWR[0] - 0.3, TWR[1], TWR[2] - 2.6, { mode: "sit", expr: "pained", look: 0.5 });
    }
  }
  if (place === "factory" && f < CUT.show) {
    // workers on the line freeze as it stalls; on "turned it around" he stands square in front of the wall
    for (let k = 0; k < 4; k++) P({ i: 10 + k, o: WORKER, okey: "worker" + k }, FAC[0] - 9 + k * 6 + hh(k, 2), FAC[1], FAC[2] - 3.6 - hh(k, 3) * 0.6, { mode: "stand", expr: f >= T.company + 10 ? "shock" : "neutral", look: (hh(k, 5) - 0.5) * 0.8 });
    if (f >= T.turned - 2) P({ i: 1, o: HERO, okey: "hero" }, FAC[0], FAC[1], FAC[2] - 2.2, { mode: "stand", expr: "smug", look: 0, fold: true });
  }
  void clamp01;
  return out;
};
