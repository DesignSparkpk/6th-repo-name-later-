// The telescope's control room at CTL (used twice: the blurry first picture in 1990 and the razor-sharp one in 1994).
// A dark, tiered room lit by its screens: a big centre screen that loads the image scanline by scanline (a live canvas),
// a ground-track map and a telemetry wall on either side, three rows of beige consoles with glowing CRT monitors and
// chairs, ceiling downlights, and one coffee mug that is about to have a bad day.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { cyl, hdr, glow } from "./kit";
import { CTL } from "./story";
import { earthDayImage } from "./setsSpace";

/** room layout relative to CTL: the screens are on the front wall (z = FRONT), the rows step up toward the back */
export const ROOM = { x0: -9, x1: 9, front: -9, back: 7, h: 5.6 };
export const ROWS = [{ z: -4.6, y: 0 }, { z: -1.1, y: 0.45 }, { z: 2.4, y: 0.9 }];
export const DESK_H = 0.8;
/** the mug on the front row, in front of the lead engineer (row 0, seat 1): world position of its base centre */
export const MUG: [number, number, number] = [CTL[0] - 1.42, CTL[1] + ROWS[0].y + DESK_H, CTL[2] + ROWS[0].z + 0.26];
/** seats: [row, x] for every engineer (the lead is row 0, x -1.6) */
export const SEATS: [number, number][] = [[0, -4.8], [0, -1.6], [0, 1.6], [0, 4.8], [1, -3.2], [1, 0.0], [1, 3.2], [2, -1.6], [2, 1.6]];

// ---------------- textures ----------------
const carpet = () => ctex("ctlCarpet", 256, 256, (g, r) => {
  g.fillStyle = "#262c3a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${60 + r() * 40},${70 + r() * 40},${100 + r() * 50},${r() * 0.15})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  g.strokeStyle = "rgba(90,100,140,0.18)"; g.lineWidth = 2; for (let k = 0; k < 256; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.stroke(); }
});
const panelWall = () => ctex("ctlWall", 256, 256, (g, r) => {
  g.fillStyle = "#1c2534"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 3; g.strokeRect(2, 2, 252, 252);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,140,180,${r() * 0.04})`; g.fillRect(r() * 256, r() * 256, 6, 6); }
});
const consoleFace = () => ctex("ctlConsoleFace", 512, 128, (g, r) => {
  g.fillStyle = "#8d8b84"; g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 90; i++) { // rows of little lit buttons and switches
    const x = 12 + (i % 30) * 16.5, y = 18 + Math.floor(i / 30) * 30, c = ["#e8433a", "#f2c23a", "#4fd06a", "#3aa0f2", "#e8e4d8"][Math.floor(r() * 5)];
    g.fillStyle = "#3a3a38"; g.fillRect(x - 1, y - 1, 12, 10); g.fillStyle = r() < 0.6 ? c : "#55534e"; g.fillRect(x, y, 10, 8);
  }
  g.fillStyle = "#2a2a28"; g.fillRect(150, 104, 210, 18);   // keyboard slot
});
/** CRT monitor faces: four looks (green text, blue plot, amber text, cyan wireframe) */
const crt = (k: number) => ctex("crt" + k, 256, 192, (g, r) => {
  const col = ["#5cff8a", "#6cc8ff", "#ffb84a", "#7af0ff"][k];
  g.fillStyle = "#06100c"; g.fillRect(0, 0, 256, 192);
  g.fillStyle = col; g.font = "bold 13px monospace";
  if (k === 0 || k === 2) for (let y = 16; y < 186; y += 15) { let s = ""; for (let i = 0; i < 26; i++) s += r() < 0.18 ? " " : "0123456789ABCDEF:.-"[Math.floor(r() * 19)]; g.globalAlpha = 0.6 + r() * 0.4; g.fillText(s, 8, y); }
  else if (k === 1) { g.strokeStyle = col; g.lineWidth = 2; for (let c = 0; c < 3; c++) { g.beginPath(); for (let x = 0; x < 256; x += 4) { const y = 96 + 40 * Math.sin(x * 0.04 + c * 2) * Math.cos(x * 0.013 + c); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.globalAlpha = 0.9 - c * 0.25; g.stroke(); } g.globalAlpha = 0.25; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 1, 192); for (let y = 0; y < 192; y += 32) g.fillRect(0, y, 256, 1); }
  else { g.strokeStyle = col; g.lineWidth = 1.5; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(128, 96, 20 + i * 7, 10 + i * 4, 0.3, 0, 7); g.globalAlpha = 0.5; g.stroke(); } }
  g.globalAlpha = 1;
  for (let y = 0; y < 192; y += 3) { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, y, 256, 1); }   // scanlines
});
/** the left wall display: the world map in green phosphor with Hubble's sine-wave ground track */
const groundTrack = () => ctex("ctlTrack", 1024, 600, (g) => {
  g.fillStyle = "#03100a"; g.fillRect(0, 0, 1024, 600);
  const img = earthDayImage();
  if (img) {
    g.globalAlpha = 0.85; g.drawImage(img, 0, 40, 1024, 512); g.globalAlpha = 1;
    const d = g.getImageData(0, 40, 1024, 512), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const land = a[i + 1] > a[i + 2] * 0.95 || a[i] > 120; const v = land ? 120 : 18; a[i] = v * 0.25; a[i + 1] = v; a[i + 2] = v * 0.45; }
    g.putImageData(d, 0, 40);
  }
  g.strokeStyle = "rgba(90,255,140,0.25)"; g.lineWidth = 1; for (let x = 0; x <= 1024; x += 64) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 552); g.stroke(); } for (let y = 40; y <= 552; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  for (let k = 0; k < 3; k++) { g.strokeStyle = k ? `rgba(255,220,90,${0.5 - k * 0.15})` : "#ffe066"; g.lineWidth = k ? 2 : 4; g.beginPath(); for (let x = 0; x <= 1024; x += 4) { const y = 296 - 150 * Math.sin((x / 1024) * Math.PI * 2 + k * 0.42); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(612, 296 - 150 * Math.sin((612 / 1024) * Math.PI * 2), 9, 0, 7); g.fill();
  g.fillStyle = "#5cff8a"; g.font = "bold 30px monospace"; g.fillText("HST GROUND TRACK      ORBIT 0074", 24, 30); g.fillText("ALT 611 KM   INCL 28.5   TDRS-E LOCK", 24, 588);
});
const telemetry = () => ctex("ctlTelemetry", 1024, 600, (g, r) => {
  g.fillStyle = "#040b14"; g.fillRect(0, 0, 1024, 600);
  for (let p = 0; p < 4; p++) {
    const x0 = (p % 2) * 512 + 16, y0 = Math.floor(p / 2) * 296 + 40;
    g.strokeStyle = "rgba(108,200,255,0.35)"; g.strokeRect(x0, y0, 480, 240);
    g.strokeStyle = ["#6cc8ff", "#5cff8a", "#ffb84a", "#ff6a8a"][p]; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x < 480; x += 6) { const y = y0 + 120 + 70 * Math.sin(x * 0.02 * (p + 1) + p) * Math.exp(-x / 900) + (r() - 0.5) * 12; if (x) g.lineTo(x0 + x, y); else g.moveTo(x0 + x, y); }
    g.stroke();
  }
  g.fillStyle = "#6cc8ff"; g.font = "bold 28px monospace"; g.fillText("WFPC  OTA  FGS  POINTING  THERMAL", 20, 30);
});

// ---------------- the big screen: a live canvas ----------------
/** star positions for "the first picture": a cluster field (deterministic) */
const STARS = (() => { let s = 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Array.from({ length: 70 }, () => ({ x: r(), y: r(), m: r() ** 2.2 })); })();
const drawField = (g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, sharp: number) => {
  g.fillStyle = "#020306"; g.fillRect(x0, y0, w, h);
  for (const st of STARS) {
    const x = x0 + st.x * w, y = y0 + st.y * h, b = 0.35 + st.m * 0.65;
    // blurred: a broad fuzzy halo with a weak core (spherical aberration); sharp: a tight point with a little glow
    const halo = (1 - sharp) * (26 + 60 * st.m), core = 1.4 + 3.2 * st.m;
    if (halo > 1) {
      const gr = g.createRadialGradient(x, y, 0, x, y, halo); gr.addColorStop(0, `rgba(230,236,255,${0.42 * b})`); gr.addColorStop(0.35, `rgba(190,205,255,${0.2 * b})`); gr.addColorStop(1, "rgba(150,170,255,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, halo, 0, 7); g.fill();
    }
    const cr = core * (1 + (1 - sharp) * 1.2), gr2 = g.createRadialGradient(x, y, 0, x, y, cr * 3);
    gr2.addColorStop(0, `rgba(255,255,255,${0.5 + 0.5 * sharp})`); gr2.addColorStop(0.3, `rgba(220,230,255,${0.35 + 0.3 * sharp})`); gr2.addColorStop(1, "rgba(200,210,255,0)");
    g.fillStyle = gr2; g.beginPath(); g.arc(x, y, cr * 3, 0, 7); g.fill();
    if (sharp > 0.5 && st.m > 0.55) { g.strokeStyle = `rgba(240,244,255,${0.6 * (sharp - 0.5) * 2})`; g.lineWidth = 1.5; const L = 10 + 26 * st.m; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L); g.lineTo(x, y + L); g.stroke(); }
  }
};
export type BigScreen = { tex: THREE.CanvasTexture; g: CanvasRenderingContext2D; field: HTMLCanvasElement[]; last: string };
const makeBig = (): BigScreen => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 768;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const field = [0, 1].map((sharp) => { const fc = document.createElement("canvas"); fc.width = 960; fc.height = 640; drawField(fc.getContext("2d")!, 0, 0, 960, 640, sharp); return fc; });
  return { tex, g: c.getContext("2d")!, field, last: "" };
};
/** paint the big screen: `load` 0..1 = how much of the picture has arrived (top down), `sharp` 0..1 */
export const paintBig = (B: BigScreen, load: number, sharp: number, label: string) => {
  const key = `${Math.round(load * 160)}|${Math.round(sharp * 20)}|${label}`;
  if (key === B.last) return; B.last = key;
  const g = B.g; g.fillStyle = "#030608"; g.fillRect(0, 0, 1024, 768);
  g.fillStyle = "#5cff8a"; g.font = "bold 30px monospace"; g.fillText(label, 32, 46);
  g.fillStyle = "rgba(92,255,138,0.6)"; g.fillRect(32, 58, 960, 2);
  const x0 = 32, y0 = 84, w = 960, h = 640, rows = Math.floor(h * Math.min(1, load));
  if (rows > 0) {
    if (sharp <= 0.001 || sharp >= 0.999) g.drawImage(B.field[sharp > 0.5 ? 1 : 0], 0, 0, w, rows, x0, y0, w, rows);
    else { g.globalAlpha = 1; g.drawImage(B.field[0], 0, 0, w, rows, x0, y0, w, rows); g.globalAlpha = sharp; g.drawImage(B.field[1], 0, 0, w, rows, x0, y0, w, rows); g.globalAlpha = 1; }
  }
  if (load < 1) {
    g.fillStyle = "#0a1410"; g.fillRect(x0, y0 + rows, w, h - rows);
    g.fillStyle = "rgba(160,255,190,0.9)"; g.fillRect(x0, y0 + rows, w, 3);      // the scan line
    g.fillStyle = "#5cff8a"; g.font = "bold 26px monospace"; g.fillText(`RECEIVING  ${String(Math.round(load * 100)).padStart(3, " ")}%`, 32, 752);
  } else { g.fillStyle = "#5cff8a"; g.font = "bold 26px monospace"; g.fillText("IMAGE COMPLETE", 32, 752); }
  B.tex.needsUpdate = true;
};

// ---------------- the room ----------------
export type ControlSet = { big: BigScreen; mug: THREE.Group; spill: THREE.Mesh; monitors: THREE.Mesh[] };
export const buildControl = (R: THREE.Object3D): ControlSet => {
  const root = new THREE.Group(); root.position.set(...CTL); R.add(root);
  const b = new Batch(), { x0, x1, front, back, h } = ROOM;
  const wall = lam("ctlWall", () => ({ map: rep(panelWall(), 1, 1) }));
  b.add(new THREE.PlaneGeometry(x1 - x0, back - front).rotateX(-Math.PI / 2).translate(0, 0, (front + back) / 2), lam("ctlCarpet", () => ({ map: rep(carpet(), 9, 8) })));
  b.add(new THREE.PlaneGeometry(x1 - x0, back - front).rotateX(Math.PI / 2).translate(0, h, (front + back) / 2), lam("ctlCeil", () => ({ color: "#151a24" })));
  b.add(boxGeo(V(x0, 0, front - 0.2), V(x1, h, front), 0), lam("ctlFront", () => ({ color: "#121925" })));
  b.add(new THREE.PlaneGeometry(back - front, h).rotateY(Math.PI / 2).translate(x0, h / 2, (front + back) / 2), wall);
  b.add(new THREE.PlaneGeometry(back - front, h).rotateY(-Math.PI / 2).translate(x1, h / 2, (front + back) / 2), wall);
  b.add(new THREE.PlaneGeometry(x1 - x0, h).rotateY(Math.PI).translate(0, h / 2, back), wall);
  // tiers
  const riser = lam("ctlRiser", () => ({ color: "#2b3242" }));
  for (const r of ROWS) if (r.y > 0) b.add(boxGeo(V(x0, 0, r.z - 1.6), V(x1, r.y, back), 0), riser);
  // consoles: desk, sloped button panel, two CRTs per seat, a chair behind
  const beige = lam("ctlBeige", () => ({ color: "#b4b0a4" })), face = lam("ctlFace", () => ({ map: consoleFace() }));
  const crtBody = lam("ctlCrt", () => ({ color: "#c9c4b6" })), chair = lam("ctlChair", () => ({ color: "#2d2f36" }));
  const monitors: THREE.Mesh[] = [];
  ROWS.forEach((r, ri) => {
    b.add(boxGeo(V(-6.6, r.y, r.z - 0.55), V(6.6, r.y + DESK_H, r.z + 0.45), 0), beige);
    const slope = new THREE.PlaneGeometry(13.2, 0.26).rotateX(-1.2).translate(0, r.y + DESK_H + 0.05, r.z + 0.1);
    b.add(slope, face);
    for (const [rr, x] of SEATS) if (rr === ri) {
      for (const dx of [-0.62, 0.62]) {
        b.add(boxGeo(V(x + dx - 0.29, r.y + DESK_H, r.z - 0.5), V(x + dx + 0.29, r.y + DESK_H + 0.5, r.z - 0.02), 0), crtBody);
        const k = Math.abs(Math.round(x * 3 + dx * 5 + ri)) % 4;
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.36), new THREE.MeshBasicMaterial({ map: crt(k), color: hdr("#ffffff", 1.25) }));
        scr.position.set(x + dx, r.y + DESK_H + 0.26, r.z + 0.0); scr.layers.set(NOINK); root.add(scr); monitors.push(scr);
      }
      b.add(boxGeo(V(x - 0.26, r.y + 0.42, r.z + 0.65), V(x + 0.26, r.y + 0.5, r.z + 1.15), 0), chair);
      b.add(boxGeo(V(x - 0.26, r.y + 0.5, r.z + 1.1), V(x + 0.26, r.y + 1.05, r.z + 1.18), 0), chair);
      b.add(cyl(0.04, 0.04, 0.42, 6).translate(x, r.y + 0.21, r.z + 0.9), chair);
    }
  });
  // ceiling downlights
  for (let x = -7; x <= 7; x += 3.5) for (let z = -7; z <= 5; z += 3) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: hdr("#dfe8ff", 1.1) }));
    l.position.set(x, h - 0.01, z); l.layers.set(NOINK); root.add(l);
  }
  b.build(root);
  // the wall of screens: frames, the two side displays, the big live screen and its glow
  const frameM = lam("ctlScreenFrame", () => ({ color: "#0b0e14" }));
  const fb = new Batch();
  fb.add(boxGeo(V(-3.0, 0.45, front), V(3.0, 4.75, front + 0.12), 0), frameM);
  fb.add(boxGeo(V(-8.5, 1.3, front), V(-3.4, 4.5, front + 0.1), 0), frameM); fb.add(boxGeo(V(3.4, 1.3, front), V(8.5, 4.5, front + 0.1), 0), frameM);
  fb.build(root);
  const big = makeBig();
  const bigM = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 4.1), new THREE.MeshBasicMaterial({ map: big.tex, color: hdr("#ffffff", 1.35) }));
  bigM.position.set(0, 2.6, front + 0.14); bigM.layers.set(NOINK); root.add(bigM);
  for (const [x, tex] of [[-5.95, groundTrack()], [5.95, telemetry()]] as const) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 3.0), new THREE.MeshBasicMaterial({ map: tex, color: hdr("#ffffff", 1.2) }));
    m.position.set(x, 2.9, front + 0.12); m.layers.set(NOINK); root.add(m);
  }
  const bg = glow("#9fdcff", 9, 0.35); bg.position.set(0, 2.6, front + 0.6); root.add(bg);
  // the mug (white, a blue band) with coffee in it, pivoting on its -x bottom edge so it tips over sideways along the desk
  const mug = new THREE.Group(); mug.position.set(MUG[0] - CTL[0] - 0.045, MUG[1] - CTL[1], MUG[2] - CTL[2]); root.add(mug);
  const mb = new Batch(), white = lam("mugWhite", () => ({ color: "#f3f1ec" })), blue = lam("mugBlue", () => ({ color: "#2c5fb8" }));
  mb.add(cyl(0.045, 0.042, 0.105, 24, true).translate(0.045, 0.0525, 0), white);
  mb.add(cyl(0.0455, 0.0455, 0.022, 24, true).translate(0.045, 0.07, 0), blue);
  mb.add(new THREE.CircleGeometry(0.042, 24).rotateX(-Math.PI / 2).translate(0.045, 0.002, 0), white);
  mb.add(new THREE.TorusGeometry(0.03, 0.009, 8, 16, Math.PI).rotateY(Math.PI / 2).rotateX(Math.PI / 2).rotateZ(-Math.PI / 2).translate(0.045, 0.055, 0.045), white);
  mb.add(new THREE.CircleGeometry(0.041, 24).rotateX(-Math.PI / 2).translate(0.045, 0.088, 0), lam("coffee", () => ({ color: "#4a2a16" })));
  mb.build(mug, false);
  const spill = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), lam("coffeeSpill", () => ({ color: "#3e2412" })));
  spill.position.set(MUG[0] - CTL[0] - 0.14, MUG[1] - CTL[1] + 0.003, MUG[2] - CTL[2]); spill.visible = false; root.add(spill);
  return { big, mug, spill, monitors };
};
