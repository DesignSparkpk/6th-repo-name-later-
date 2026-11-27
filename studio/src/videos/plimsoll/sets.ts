// The places of "The Plimsoll Line", built once and placed far apart in one scene:
//  - the House of Commons chamber around the origin (benches along z, the hook window in the west wall x = -7.2)
//  - the Thames at dusk outside that window (water at y = WATER, a coffin ship moored below, the far bank at x ~ -230)
//  - the riverbed under it (y = BED): a sunken ship, a burst sack of insurance gold, seaweed, light shafts
// Same look as the template: painted canvas textures, two-tone lambert (lam / twoTone), ink from the post pass.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep, stoneHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { WATER, BED, PLIM, WIN, COFFIN, WRECK, HOARD } from "./story";

// ---------------- painted textures ----------------
const panelTex = () => ctex("oakPanel", 512, 1024, (g, r) => {
  // dark oak linenfold panelling: two rows of tall panels, each with folded-linen ribs, a lighter frame, ink seams
  g.fillStyle = "#5b3a25"; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${40 + r() * 30},${22 + r() * 14},${10 + r() * 8},${0.12 + r() * 0.1})`; g.fillRect(r() * 512, r() * 1024, 1 + r() * 2, 20 + r() * 80); }
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    const x = 26 + col * 243, y = 30 + row * 492, w = 217, h = 452;
    g.fillStyle = "#6e4630"; g.fillRect(x, y, w, h);
    for (let k = 0; k < 7; k++) { // linen folds: soft ribs
      const fx = x + 16 + k * 28, gr = g.createLinearGradient(fx, 0, fx + 26, 0);
      gr.addColorStop(0, "#4e301e"); gr.addColorStop(0.45, "#8a5a3c"); gr.addColorStop(1, "#4e301e");
      g.fillStyle = gr; g.fillRect(fx, y + 40, 26, h - 80);
      g.fillStyle = "#3a2214"; g.beginPath(); g.ellipse(fx + 13, y + 40, 13, 16, 0, Math.PI, 0); g.fill(); g.beginPath(); g.ellipse(fx + 13, y + h - 40, 13, 16, 0, 0, Math.PI); g.fill();
    }
    g.strokeStyle = "#2a170d"; g.lineWidth = 5; g.strokeRect(x, y, w, h);
    g.strokeStyle = "rgba(255,210,160,0.18)"; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, w - 12, h - 12);
  }
});
const leatherTex = () => ctex("greenLeather", 512, 512, (g, r) => {
  // the Commons' green leather: deep green with a buttoned diamond tuft grid
  g.fillStyle = "#2f6a48"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "20,60,38" : "90,150,110"},${0.06 + r() * 0.08})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2 + r() * 4); }
  g.strokeStyle = "rgba(15,45,28,0.75)"; g.lineWidth = 3;
  for (let k = -8; k < 16; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64 + 512, 512); g.stroke(); g.beginPath(); g.moveTo(k * 64 + 512, 0); g.lineTo(k * 64, 512); g.stroke(); }
  for (let y = 0; y <= 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x <= 512; x += 64) {
    g.fillStyle = "#123a24"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
    g.fillStyle = "rgba(160,220,180,0.35)"; g.beginPath(); g.arc(x - 2, y - 2, 2.5, 0, 7); g.fill();
  }
});
const carpetTex = () => ctex("carpet", 256, 512, (g, r) => {
  g.fillStyle = "#24553c"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#c9a24e"; g.fillRect(14, 0, 10, 512); g.fillRect(232, 0, 10, 512);
  g.fillStyle = "#7a1f2b"; g.fillRect(28, 0, 6, 512); g.fillRect(222, 0, 6, 512);
  for (let y = 32; y < 512; y += 64) { g.fillStyle = "#2e6a4a"; g.beginPath(); g.moveTo(128, y - 26); g.lineTo(170, y); g.lineTo(128, y + 26); g.lineTo(86, y); g.fill(); g.fillStyle = "#c9a24e"; g.beginPath(); g.arc(128, y, 6, 0, 7); g.fill(); }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(10,30,20,${r() * 0.1})`; g.fillRect(r() * 256, r() * 512, 2, 2); }
});
const floorTex = () => ctex("chamberFloor", 512, 512, (g, r) => {
  g.fillStyle = "#6b4630"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -64 : 0; x < 512; x += 128) {
    g.fillStyle = `rgb(${100 + r() * 24},${64 + r() * 16},${40 + r() * 10})`; g.fillRect(x + 2, y + 2, 124, 28);
    g.fillStyle = "rgba(255,220,180,0.1)"; g.fillRect(x + 6, y + 6, 100, 3);
  }
  g.fillStyle = "#3a2214"; for (let y = 0; y <= 512; y += 32) g.fillRect(0, y - 1, 512, 3);
});
const ceilTex = () => ctex("ceiling", 512, 512, (g) => {
  g.fillStyle = "#3e2617"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    g.fillStyle = "#5a3822"; g.fillRect(x * 256 + 18, y * 256 + 18, 220, 220);
    g.fillStyle = "#4a2d1b"; g.fillRect(x * 256 + 40, y * 256 + 40, 176, 176);
    g.fillStyle = "#d4aa4f"; g.beginPath(); g.arc(x * 256 + 128, y * 256 + 128, 16, 0, 7); g.fill();
    g.strokeStyle = "#241208"; g.lineWidth = 4; g.strokeRect(x * 256 + 18, y * 256 + 18, 220, 220);
  }
});
/** leaded pointed-arch window, glowing with the sunset behind it; transparent outside the arch (alphaTest) */
const archWin = (key: string, glowTop: string, glowBot: string) => ctex(key, 256, 512, (g) => {
  const arch = () => { g.beginPath(); g.moveTo(8, 512); g.lineTo(8, 180); g.quadraticCurveTo(8, 20, 128, 6); g.quadraticCurveTo(248, 20, 248, 180); g.lineTo(248, 512); g.closePath(); };
  g.clearRect(0, 0, 256, 512); g.save(); arch(); g.clip();
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, glowTop); gr.addColorStop(1, glowBot);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  const tint = ["rgba(200,60,60,0.35)", "rgba(60,90,200,0.3)", "rgba(230,190,60,0.35)", "rgba(60,150,90,0.3)"];
  for (let y = 0; y < 512; y += 36) for (let x = (y / 36) % 2 ? -16 : 0; x < 256; x += 32) {
    if ((x + y) % 5 === 0) { g.fillStyle = tint[(x * 7 + y) % 4]; g.beginPath(); g.moveTo(x + 16, y); g.lineTo(x + 32, y + 18); g.lineTo(x + 16, y + 36); g.lineTo(x, y + 18); g.fill(); }
  }
  g.strokeStyle = "rgba(40,24,30,0.85)"; g.lineWidth = 3;
  for (let k = -16; k < 32; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32 + 512, 512); g.stroke(); g.beginPath(); g.moveTo(k * 32 + 512, 0); g.lineTo(k * 32, 512); g.stroke(); }
  g.fillStyle = "#2b1d22"; g.fillRect(124, 0, 8, 512); g.fillRect(0, 300, 256, 8);
  g.restore();
  arch(); g.strokeStyle = "#2b1d22"; g.lineWidth = 12; g.stroke();
});
const waterDusk = () => ctex("waterDusk", 1024, 1024, (g, r) => {
  // dusk river: deep violet-blue with long warm glint streaks and darker trough bands (tiles every 24 m)
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#3b4677"); gr.addColorStop(1, "#2c3561");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  // marks run along texture-v = world z = across the camera's view, so they read as horizontal ripples on screen
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(22,26,56,${0.22 + r() * 0.2})`; g.fillRect(r() * 1024, r() * 1024, 6 + r() * 6, 50 + r() * 140); }
  for (let i = 0; i < 70; i++) { const c = r() < 0.5 ? "255,186,120" : "250,140,110"; g.fillStyle = `rgba(${c},${0.22 + r() * 0.3})`; g.fillRect(r() * 1024, r() * 1024, 3 + r() * 3, 30 + r() * 90); }
  for (let i = 0; i < 18; i++) { g.fillStyle = "rgba(255,230,190,0.6)"; g.fillRect(r() * 1024, r() * 1024, 3, 10 + r() * 24); }
});
const underSurf = () => ctex("underSurface", 512, 512, (g, r) => {
  // the surface seen from below: bright green-white light net (caustics)
  g.fillStyle = "#5fb8a0"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(225,255,240,0.8)"; g.lineWidth = 5; g.lineJoin = "round";
  for (let i = 0; i < 70; i++) { g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
});
const sandTex = () => ctex("riverSand", 1024, 1024, (g, r) => {
  g.fillStyle = "#b9a678"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 60; i++) { // ripple marks
    const y = r() * 1024; g.strokeStyle = `rgba(120,100,60,${0.25 + r() * 0.2})`; g.lineWidth = 4 + r() * 4;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 10 * Math.sin(x * 0.02 + i)); g.stroke();
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "90,80,60" : "230,220,190"},${0.4 + r() * 0.4})`; g.beginPath(); g.arc(r() * 1024, r() * 1024, 2 + r() * 5, 0, 7); g.fill(); }
});
const hullTex = (key: string, rot: boolean) => ctex(key, 1024, 512, (g, r) => {
  // hull planks running fore-aft; the coffin ship gets rot, patches, slime and the odd hole
  g.fillStyle = rot ? "#4d3a2a" : "#5c3f28"; g.fillRect(0, 0, 1024, 512);
  for (let y = 0; y < 512; y += 32) {
    for (let x = (y / 32) % 2 ? -80 : 0; x < 1024; x += 220) { g.fillStyle = `rgb(${(rot ? 70 : 92) + r() * 22},${(rot ? 54 : 62) + r() * 14},${(rot ? 38 : 40) + r() * 10})`; g.fillRect(x + 2, y + 2, 216, 28); }
    g.fillStyle = "#22150c"; g.fillRect(0, y - 1, 1024, 3);
  }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(30,18,10,${r() * 0.25})`; g.fillRect(r() * 1024, r() * 512, 20 + r() * 60, 2); }
  if (rot) {
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(90,110,50,${0.35 + r() * 0.3})`; g.beginPath(); g.ellipse(r() * 1024, 380 + r() * 120, 40 + r() * 70, 14 + r() * 20, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 6; i++) { const x = r() * 960, y = 60 + r() * 300; g.fillStyle = "#7a5d3e"; g.fillRect(x, y, 50, 34); g.strokeStyle = "#22150c"; g.lineWidth = 3; g.strokeRect(x, y, 50, 34); for (const d of [6, 44]) { g.fillStyle = "#c9b48a"; g.beginPath(); g.arc(x + d, y + 6, 3, 0, 7); g.arc(x + d, y + 28, 3, 0, 7); g.fill(); } }
    for (let i = 0; i < 3; i++) { g.fillStyle = "#120a06"; g.beginPath(); g.ellipse(100 + r() * 820, 120 + r() * 220, 10 + r() * 10, 7 + r() * 6, r(), 0, 7); g.fill(); }
  }
});
const crateTex = (key: string, label: string) => ctex(key, 256, 256, (g, r) => {
  g.fillStyle = "#a9773f"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 42) { g.fillStyle = `rgb(${160 + r() * 30},${110 + r() * 20},${60 + r() * 14})`; g.fillRect(14, y + 3, 228, 36); }
  g.fillStyle = "#6b4520"; g.fillRect(0, 0, 256, 16); g.fillRect(0, 240, 256, 16); g.fillRect(0, 0, 16, 256); g.fillRect(240, 0, 16, 256);
  g.save(); g.translate(128, 128); g.rotate(Math.PI / 4); g.fillRect(-170, -9, 340, 18); g.restore();
  g.fillStyle = "rgba(40,20,10,0.8)"; g.font = "bold 44px Georgia, serif"; g.textAlign = "center"; g.fillText(label, 128, 146);
  g.strokeStyle = "#2a170b"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 250);
});
const sackTex = () => ctex("goldSack", 256, 256, (g, r) => {
  g.fillStyle = "#b99560"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 6) { g.fillStyle = "rgba(90,60,30,0.25)"; g.fillRect(i, 0, 2, 256); g.fillRect(0, i, 256, 2); }
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(60,40,20,${r() * 0.15})`; g.fillRect(r() * 256, r() * 256, 4, 4); }
  g.fillStyle = "#5a2f1a"; g.font = "bold 130px Georgia, serif"; g.textAlign = "center"; g.fillText("£", 128, 175);
});
const farBankTex = (key: string, seed: number) => ctex(key, 512, 512, (g, r) => {
  // warehouse brick at dusk with a few warm lit windows (the warm ones read through the fog)
  g.fillStyle = seed % 2 ? "#6a4a52" : "#5a4458"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 12) for (let x = (y / 12) % 2 ? -12 : 0; x < 512; x += 24) { g.fillStyle = `rgba(${120 + r() * 30},${70 + r() * 20},${70 + r() * 20},0.25)`; g.fillRect(x + 1, y + 1, 22, 10); }
  for (let fy = 40; fy < 512; fy += 96) for (let fx = 30; fx < 512; fx += 80) {
    const lit = r() < 0.3; g.fillStyle = lit ? "#ffc874" : "#2c2436"; g.fillRect(fx, fy, 34, 52);
    if (lit) { g.fillStyle = "rgba(255,240,200,0.8)"; g.fillRect(fx + 4, fy + 4, 10, 44); }
    g.strokeStyle = "#1c1420"; g.lineWidth = 4; g.strokeRect(fx, fy, 34, 52);
  }
});
const facadeOut = () => ctex("commonsRiverFront", 1024, 1024, (g, r) => {
  // the palace's river front at dusk: pale stone, buttresses, rows of tall gothic windows, several lit
  g.fillStyle = "#b9a58f"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 32) for (let x = (y / 32) % 2 ? -40 : 0; x < 1024; x += 80) { g.fillStyle = `rgba(${150 + r() * 30},${130 + r() * 26},${110 + r() * 20},0.35)`; g.fillRect(x + 2, y + 2, 76, 28); }
  for (let k = 0; k < 8; k++) { g.fillStyle = "#a08c78"; g.fillRect(k * 128 + 2, 0, 18, 1024); }
  for (let row = 0; row < 3; row++) for (let k = 0; k < 8; k++) {
    const x = k * 128 + 44, y = 90 + row * 320, lit = r() < 0.55;
    g.fillStyle = lit ? "#ffb86a" : "#3a3346";
    g.beginPath(); g.moveTo(x, y + 220); g.lineTo(x, y + 60); g.quadraticCurveTo(x, y, x + 30, y - 10); g.quadraticCurveTo(x + 60, y, x + 60, y + 60); g.lineTo(x + 60, y + 220); g.closePath(); g.fill();
    g.strokeStyle = "#2b2230"; g.lineWidth = 5; g.stroke(); g.fillStyle = "#2b2230"; g.fillRect(x + 28, y, 4, 220); g.fillRect(x, y + 120, 60, 4);
  }
  g.fillStyle = "rgba(40,30,40,0.5)"; g.fillRect(0, 0, 1024, 28);
});

const sailTex = (torn: boolean) => ctex(torn ? "sailTornTex" : "sailSetTex", 256, 256, (g, r) => {
  g.fillStyle = torn ? "#c9bc98" : "#eee4cc"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(120,100,70,0.35)"; g.fillRect(x, 0, 3, 256); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(110,90,60,${r() * 0.1})`; g.fillRect(r() * 256, r() * 256, 3, 3); }
  if (torn) { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 5; i++) { g.beginPath(); const x = r() * 256, y = r() * 256; g.moveTo(x, y); for (let k = 0; k < 6; k++) g.lineTo(x + (r() - 0.5) * 90, y + (r() - 0.5) * 90); g.fill(); } }
  g.globalCompositeOperation = "source-over"; g.strokeStyle = "#5a4a30"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 250);
});

// ---------------- geometry helpers ----------------
export const M = (x: number, y: number, z: number, ry = 0, rx = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(s, s, s));
export const cyl = (r0: number, r1: number, h: number, n = 14) => new THREE.CylinderGeometry(r0, r1, h, n);
export const basic = (key: string, make: () => THREE.MeshBasicMaterialParameters) => {
  const cache = basicCache.get(key); if (cache) return cache;
  const m = new THREE.MeshBasicMaterial(make()); basicCache.set(key, m); return m;
};
const basicCache = new Map<string, THREE.MeshBasicMaterial>();

/** a wooden sailing ship (bow +x, deck at y = 0, keel at -D), built as one group; `rot` = the rotting coffin-ship paint */
export const ship = (L: number, B: number, D: number, rot: boolean, opts: { masts?: number; crates?: number; seed?: number; broken?: boolean; sails?: "furled" | "set" | "torn" } = {}) => {
  const g = new THREE.Group(), b = new Batch(), seed = opts.seed ?? 1;
  const N = 18, Mn = 9, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = (t - 0.5) * L;
    const half = (B / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.92)), 0.55) * (t < 0.08 ? 0.86 + t * 1.5 : 1);
    const sheer = 0.35 * (2 * t - 1) ** 2 + (t > 0.85 ? (t - 0.85) * 2.2 : 0);
    for (let j = 0; j < Mn; j++) {
      const ph = -Math.PI / 2 + (Math.PI * j) / (Mn - 1);
      const y = sheer - D * Math.pow(Math.cos(ph), 1.4) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)));
      pos.push(x, y, half * Math.sin(ph)); uv.push(t * L / 3.5, j / (Mn - 1));
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < Mn - 1; j++) {
    const a = i * Mn + j, c = (i + 1) * Mn + j;
    idx.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  hg.setIndex(idx); hg.computeVertexNormals();
  const hullM = lam(rot ? "hullRot" : "hullSound", () => ({ map: rep(hullTex(rot ? "hullRot" : "hullSound", rot), 1, 1), side: THREE.DoubleSide }));
  b.add(hg, hullM);
  // deck + bulwark rail
  const deckM = lam("deckPlanks", () => ({ map: rep(ctex("deckPlanks", 512, 512, (gg, r) => { gg.fillStyle = "#9c7448"; gg.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 24) { gg.fillStyle = `rgb(${150 + r() * 20},${110 + r() * 14},${70 + r() * 10})`; gg.fillRect(0, y + 2, 512, 20); gg.fillStyle = "#4a321c"; gg.fillRect(0, y, 512, 2); } }), 3, 1) }));
  const outline: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) { const k = i * Mn + Mn - 1; outline.push(new THREE.Vector2(pos[k * 3], -pos[k * 3 + 2])); }
  for (let i = N; i >= 0; i--) { const k = i * Mn; outline.push(new THREE.Vector2(pos[k * 3], -pos[k * 3 + 2])); }
  const deck = new THREE.ShapeGeometry(new THREE.Shape(outline)); deck.rotateX(-Math.PI / 2); deck.translate(0, 0.05, 0);
  b.add(deck, deckM);
  const railM = lam("shipRail", () => ({ color: rot ? "#3a2a1e" : "#4a2f1c" }));
  for (let i = 0; i < N; i++) for (const j of [0, Mn - 1]) {
    const a = i * Mn + j, c = (i + 1) * Mn + j, p0 = V(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]), p1 = V(pos[c * 3], pos[c * 3 + 1], pos[c * 3 + 2]);
    const len = p0.distanceTo(p1), mid = p0.clone().add(p1).multiplyScalar(0.5);
    const m = new THREE.Matrix4().lookAt(p0, p1, V(0, 1, 0)).setPosition(mid.x, mid.y + 0.25, mid.z);
    b.add(new THREE.BoxGeometry(0.1, 0.5, len + 0.05), railM, m);
  }
  // masts, yards, furled sails, rigging
  const spar = lam("spar", () => ({ color: "#5a3a22" })), canvas = lam(rot ? "sailRot" : "sail", () => ({ color: rot ? "#cbbd9c" : "#efe6cf" }));
  const nm = opts.masts ?? 2, rope = lam("rope", () => ({ color: "#2a2018" }));
  for (let k = 0; k < nm; k++) {
    const mx = (nm === 1 ? 0 : -L * 0.22 + (L * 0.44 * k) / (nm - 1)), h = (opts.broken && k === 1 ? 0.35 : 1) * L * (k === 0 ? 0.95 : 0.85);
    b.add(cyl(0.12, 0.17, h).translate(0, h / 2, 0), spar, M(mx, 0, 0));
    if (opts.broken && k === 1) continue;
    const ys = [0.45, 0.7, 0.9];
    for (let yi = 0; yi < ys.length; yi++) {
      const yk = ys[yi], w = B * (1.5 - yk * 0.7);
      b.add(cyl(0.06, 0.06, w).rotateX(Math.PI / 2), spar, M(mx, h * yk, 0));
      if ((opts.sails ?? "furled") === "furled") { b.add(cyl(0.16, 0.12, w * 0.92, 10).rotateX(Math.PI / 2), canvas, M(mx + 0.08, h * yk - 0.16, 0)); continue; }
      // set square sail hanging from this yard down to the next one, bellied forward (+x)
      const sh = (yi === 0 ? h * yk - 0.9 : h * (yk - ys[yi - 1])) - 0.15, sg = new THREE.PlaneGeometry(w * 0.9, sh, 8, 6);
      const sp2 = sg.attributes.position as THREE.BufferAttribute;
      for (let v = 0; v < sp2.count; v++) { const sx = sp2.getX(v) / (w * 0.45), sy = sp2.getY(v) / (sh / 2); sp2.setZ(v, 0.55 * (1 - sx * sx) * (1 - 0.5 * (sy - 0.2) ** 2)); }
      sg.computeVertexNormals(); sg.rotateY(Math.PI / 2);
      const sailM = lam(opts.sails === "torn" ? "sailTorn" : "sailSet", () => ({ map: sailTex(opts.sails === "torn"), side: THREE.DoubleSide, alphaTest: 0.5 }));
      b.add(sg, sailM, M(mx + 0.15, h * yk - sh / 2 - 0.08, 0));
    }
    for (const s of [-1, 1]) for (const dx of [-0.6, 0.6]) { // shrouds
      const top = V(mx, h * 0.92, 0), bot = V(mx + dx, 0.5, s * B * 0.48), len = top.distanceTo(bot), mid = top.clone().add(bot).multiplyScalar(0.5);
      b.add(cyl(0.018, 0.018, len, 5), rope, new THREE.Matrix4().lookAt(bot, top, V(0, 1, 0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)).setPosition(mid));
    }
  }
  // bowsprit
  b.add(cyl(0.08, 0.1, L * 0.3).rotateZ(-Math.PI / 2 + 0.25), spar, M(L * 0.55, 0.9, 0));
  // cargo piled high (the coffin ship: far too much)
  const crateM = [lam("crateCoal", () => ({ map: crateTex("crateCoal", "COAL") })), lam("crateTea", () => ({ map: crateTex("crateTea", "TEA") })), lam("crateIron", () => ({ map: crateTex("crateIron", "IRON") }))];
  const barrelM = lam("barrel", () => ({ color: "#8a5a32" }));
  let s2 = seed * 9301;
  const rnd = () => { s2 = (s2 * 9301 + 49297) % 233280; return s2 / 233280; };
  for (let c = 0; c < (opts.crates ?? 0); c++) {
    const lay = Math.floor(c / 9), cx = (rnd() - 0.5) * L * 0.55, cz = (rnd() - 0.5) * B * 0.55, sz = 0.7 + rnd() * 0.4;
    if (c % 5 === 4) b.add(cyl(sz * 0.42, sz * 0.36, sz * 1.1, 12), barrelM, M(cx, 0.05 + lay * 0.85 + sz * 0.55, cz));
    else b.add(new THREE.BoxGeometry(sz, sz * 0.85, sz), crateM[c % 3], M(cx, 0.05 + lay * 0.85 + sz * 0.42, cz, rnd() * 0.5));
  }
  b.build(g);
  return g;
};

// ---------------- the sets ----------------
export type Sets = {
  casement: THREE.Object3D[];        // the hook window's two glass leaves (swing open as the camera flies through)
  water: THREE.Mesh; waterTex: THREE.Texture; under: THREE.Mesh; underTex: THREE.Texture;
  shafts: THREE.Mesh[];              // underwater light shafts
  coffin: THREE.Group;               // the overloaded ship moored below the window
};

export const buildSets = (R: THREE.Object3D): Sets => {
  const b = new Batch();
  // ======== House of Commons chamber ========
  const oak = lam("oakPanel", () => ({ map: rep(panelTex(), 1, 1) }));
  const oakPlain = lam("oakDark", () => ({ color: "#4a2e1c" }));
  const leather = lam("greenLeather", () => ({ map: rep(leatherTex(), 1, 1) }));
  const stone = lam("chamberStone", () => ({ map: rep(stoneHD("chamberStone", ["#d9c9ae", "#cfbea2", "#e2d3ba", "#c8b699"], "#9c8a70"), 1, 1) }));
  const gold = lam("brass", () => ({ color: "#d4a94a" }));
  const oakBeam = lam("oakBeam", () => ({ color: "#4a2e1c" })); // structure: never casts (the key light stands in for the chandeliers)
  b.add(boxGeo(V(-7.2, -0.3, -15), V(7.2, 0, 15), 4), lam("chamberFloor", () => ({ map: rep(floorTex(), 1, 1) })));
  b.add(boxGeo(V(-1.5, 0, -15), V(1.5, 0.02, 15), 0), lam("carpet", () => ({ map: rep(carpetTex(), 1, 8) })));
  // table of the House + dispatch boxes + mace
  b.add(boxGeo(V(-0.95, 0, -4.5), V(0.95, 0.88, 4.5), 1.5), oakPlain);
  b.add(boxGeo(V(-1.0, 0.88, -4.6), V(1.0, 0.95, 4.6), 0.8), leather);
  for (const s of [-1, 1]) { b.add(boxGeo(V(s * 0.75 - 0.25, 0.95, -0.4), V(s * 0.75 + 0.25, 1.3, 0.4)), lam("dispatchBox", () => ({ color: "#6b3a22" }))); b.add(boxGeo(V(s * 0.75 - 0.27, 1.12, -0.42), V(s * 0.75 + 0.27, 1.16, 0.42)), gold); }
  b.add(cyl(0.05, 0.05, 1.5).rotateX(Math.PI / 2), gold, M(0, 1.05, 2.4)); b.add(new THREE.SphereGeometry(0.16, 14, 10), gold, M(0, 1.05, 3.2));
  for (let i = 0; i < 7; i++) b.add(boxGeo(V(-0.5 + (i % 3) * 0.3, 0.95, -3 + i * 0.7), V(-0.3 + (i % 3) * 0.3, 0.97, -2.6 + i * 0.7)), lam("paper", () => ({ color: "#f1ead8" })));
  // benches: 4 tiers each side, split by the gangway at z = 0
  for (const s of [-1, 1]) for (let t = 0; t < 4; t++) {
    const x0 = s * (1.9 + t * 1.0), seatY = 0.42 + t * 0.4, floorY = t * 0.4;
    if (t > 0) b.add(boxGeo(V(Math.min(x0, x0 + s * 1.0) - (s < 0 ? 0 : 0), 0, -12), V(Math.max(x0, x0 + s * 1.0), floorY, 12), 1), oakPlain); // stepped riser
    for (const [z0, z1] of [[-12, -0.6], [0.6, 12]]) {
      const xa = Math.min(x0, x0 + s * 0.62), xb = Math.max(x0, x0 + s * 0.62);
      b.add(boxGeo(V(xa, floorY, z0), V(xb, seatY - 0.1, z1)), oakPlain);
      b.add(boxGeo(V(xa, seatY - 0.1, z0), V(xb, seatY, z1), 0.5), leather);
      const xbk = s < 0 ? xa : xb - 0.16; // backrest at the back edge of the seat
      b.add(boxGeo(V(s < 0 ? xa - 0.16 : xb - 0.02, seatY, z0), V(s < 0 ? xa + 0.02 : xb + 0.16, seatY + 0.62, z1), 0.5), leather);
      void xbk;
      for (const ze of [z0, z1]) b.add(boxGeo(V(xa - 0.04, floorY, ze - 0.05), V(xb + 0.04, seatY + 0.75, ze + 0.05)), oakPlain);
    }
  }
  // walls: linenfold oak to 4 m, a gallery front, cream stone above with pointed windows
  for (const s of [-1, 1]) {
    const x = s * 7.2;
    b.add(boxGeo(V(Math.min(x, x + s * 0.4), 0, -15), V(Math.max(x, x + s * 0.4), 4.2, 15), 2.1), oak);
    b.add(boxGeo(V(Math.min(x, x - s * 1.6), 4.2, -15), V(Math.max(x, x - s * 1.6), 4.5, 15), 1), oakBeam); // gallery floor
    b.add(boxGeo(V(Math.min(x - s * 1.6, x - s * 1.7), 4.5, -15), V(Math.max(x - s * 1.6, x - s * 1.7), 5.25, 15), 0.75), oak); // gallery front
    b.add(boxGeo(V(Math.min(x - s * 1.72, x - s * 1.6), 5.25, -15), V(Math.max(x - s * 1.72, x - s * 1.6), 5.35, 15)), gold);
    // upper wall with window openings every 4 m (the hook window at z = WIN.z on the west side stays open)
    const winZ = [-12, -8, -4, 0, 4, 8, 12].map((z) => z + (s < 0 ? WIN.z - 4 : 0));
    let zc = -15;
    for (const wz of winZ) {
      if (wz - 1.05 > zc) b.add(boxGeo(V(Math.min(x, x + s * 0.4), 4.2, zc), V(Math.max(x, x + s * 0.4), 12, wz - 1.05), 2.4), stone);
      b.add(boxGeo(V(Math.min(x, x + s * 0.4), 4.2, wz - 1.05), V(Math.max(x, x + s * 0.4), 5.4, wz + 1.05), 2.4), stone);  // sill
      b.add(boxGeo(V(Math.min(x, x + s * 0.4), 9.6, wz - 1.05), V(Math.max(x, x + s * 0.4), 12, wz + 1.05), 2.4), stone);   // above the arch
      if (!(s < 0 && Math.abs(wz - WIN.z) < 0.01)) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.2), basic("archGlow", () => ({ map: archWin("archGlow", "#ffcf8a", "#e8775a"), alphaTest: 0.5, side: THREE.DoubleSide, fog: false })));
        win.position.set(x + s * 0.1, 7.5, wz); win.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2; win.layers.set(NOINK); R.add(win);
      }
      zc = wz + 1.05;
    }
    if (zc < 15) b.add(boxGeo(V(Math.min(x, x + s * 0.4), 4.2, zc), V(Math.max(x, x + s * 0.4), 12, 15), 2.4), stone);
  }
  // end walls (the Speaker's end at -z with his canopied chair, the bar end at +z) + ceiling
  b.add(boxGeo(V(-7.2, 0, -15.4), V(7.2, 12, -15), 2.1), oak);
  for (const [x0, x1, y0] of [[-7.2, -1.1, 0], [1.1, 7.2, 0], [-1.1, 1.1, 3.4]] as const) b.add(boxGeo(V(x0, y0, 15), V(x1, 12, 15.4), 2.1), stone); // the bar end, with the door to the club
  b.add(boxGeo(V(-1.0, 0, -14.6), V(1.0, 1.2, -13.4)), oakPlain);
  b.add(boxGeo(V(-0.8, 1.2, -14.6), V(0.8, 3.8, -14.3)), leather);
  b.add(boxGeo(V(-1.1, 3.8, -14.8), V(1.1, 4.2, -13.2)), oakPlain);
  b.add(new THREE.ConeGeometry(0.9, 2.6, 4), oakPlain, M(0, 5.5, -14.0, Math.PI / 4));
  b.add(boxGeo(V(-7.2, 12, -15), V(7.2, 12.4, 15), 0), lam("ceiling", () => ({ map: rep(ceilTex(), 4, 8) })));
  for (let z = -13; z <= 13; z += 2.6) b.add(boxGeo(V(-7.2, 11.6, z - 0.15), V(7.2, 12, z + 0.15)), oakBeam);
  // chandeliers: a brass ring of candles hanging from the ceiling
  const flame = basic("flame", () => ({ color: new THREE.Color(3.2, 2.2, 1.1), fog: false }));
  for (const z of [-9, -3, 3, 9]) for (const x of [-3.5, 3.5]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 8, 28).rotateX(Math.PI / 2), basic("chandelierGold", () => ({ color: "#e8b85a" })));
    ring.position.set(x, 8.2, z); R.add(ring);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, cx = x + Math.cos(a) * 0.75, cz = z + Math.sin(a) * 0.75;
      b.add(cyl(0.035, 0.035, 0.26, 6), lam("candleWax", () => ({ color: "#f4ecd6" })), M(cx, 8.35, cz));
      const fm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6).scale(1, 1.8, 1), flame); fm.position.set(cx, 8.55, cz); fm.layers.set(NOINK); R.add(fm);
    }
  }
  // the hook window: an open arch in the west wall, two leaded casements hinged at its sides
  const casement: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(-7.4, 7.5, WIN.z + side * 1.02);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 4.2), basic("archLeaf" + side, () => ({ map: archWin("archLeaf", "#ffd59a", "#ee8a62"), alphaTest: 0.5, side: THREE.DoubleSide, fog: false })));
    leaf.position.set(0, 0, -side * 0.51); leaf.rotation.y = Math.PI / 2; leaf.layers.set(NOINK);
    pivot.add(leaf); R.add(pivot); casement.push(pivot);
  }
  // ======== outside: the palace's river front, the Thames at dusk ========
  const front = lam("riverFront", () => ({ map: rep(facadeOut(), 1, 1) }));
  b.add(boxGeo(V(-7.8, WATER - 2, -60), V(-7.6, 14, WIN.z - 1.05), 8), front);
  b.add(boxGeo(V(-7.8, WATER - 2, WIN.z + 1.05), V(-7.6, 14, 60), 8), front);
  b.add(boxGeo(V(-7.8, WATER - 2, WIN.z - 1.05), V(-7.6, 5.4, WIN.z + 1.05), 8), front);
  b.add(boxGeo(V(-7.8, 9.6, WIN.z - 1.05), V(-7.6, 14, WIN.z + 1.05), 8), front);
  for (let z = -56; z <= 56; z += 8) b.add(boxGeo(V(-8.6, WATER - 2, z - 0.6), V(-7.6, 16, z + 0.6), 2), stone); // buttresses
  for (let z = -56; z <= 56; z += 8) b.add(new THREE.ConeGeometry(0.75, 3, 4), stone, M(-8.1, 17.5, z, Math.PI / 4));
  // far bank: warehouses, chimneys, a spire, lamp glow
  const gable = (w: number, d: number, h: number) => { // triangular roof prism, ridge along z
    const sh = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)]);
    return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
  };
  for (let i = 0; i < 26; i++) { // long brick warehouses with gable roofs, lit windows, chimneys
    const z = -190 + i * 15, w = 13 + ((i * 37) % 7), h = 9 + ((i * 53) % 8), x = -232 - ((i * 13) % 10), dx = 14 + (i % 3) * 3;
    b.add(boxGeo(V(x - dx, WATER - 1, z), V(x + dx, WATER + h, z + w), 0), lam("farBank" + (i % 4), () => ({ map: farBankTex("farBank" + (i % 4), i) })));
    b.add(gable(2 * dx, w, 4 + (i % 3)), lam("farRoof", () => ({ color: "#4a3a52" })), M(x, WATER + h, z, 0));
    if (i % 2 === 0) b.add(cyl(0.8, 1.1, 9), lam("chimney", () => ({ color: "#6a4650" })), M(x + dx * 0.6, WATER + h + 6, z + w * 0.5));
  }
  b.add(boxGeo(V(-238, WATER - 1, -12), V(-226, WATER + 30, 0)), lam("farChurch", () => ({ color: "#6a5868" })));
  b.add(new THREE.ConeGeometry(4.5, 26, 4), lam("farRoof", () => ({ color: "#3d3346" })), M(-232, WATER + 43, -6, Math.PI / 4));
  b.add(boxGeo(V(-245, WATER - 3, -220), V(-200, WATER + 0.5, 220), 0), lam("farQuay", () => ({ color: "#4a3e4c" })));
  // ======== the riverbed ========
  const bed = new THREE.PlaneGeometry(140, 140, 70, 70); bed.rotateX(-Math.PI / 2);
  const bp = bed.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), z = bp.getZ(i); bp.setY(i, 0.5 * Math.sin(x * 0.21) * Math.cos(z * 0.17) + 0.25 * Math.sin(x * 0.6 + z * 0.4)); }
  bed.computeVertexNormals(); bed.translate(HOARD[0], BED, HOARD[2]);
  b.add(bed, lam("riverSand", () => ({ map: rep(sandTex(), 10, 10) })));
  const rock = lam("bedRock", () => ({ color: "#6f6a5c" }));
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4, d = 4 + (i * 7) % 26, r = 0.4 + ((i * 13) % 10) / 6;
    b.add(new THREE.IcosahedronGeometry(r, 1).scale(1.3, 0.7, 1), rock, M(HOARD[0] + Math.cos(a) * d, BED + r * 0.25, HOARD[2] + Math.sin(a) * d, a));
  }
  // the hoard: a burst sack and a heap of gold
  const sack = new THREE.SphereGeometry(0.9, 18, 14); const sp = sack.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < sp.count; i++) { const y = sp.getY(i); sp.setXYZ(i, sp.getX(i) * (1 + 0.15 * Math.sin(i)), y * 0.75 + (y > 0.6 ? 0.25 : 0), sp.getZ(i)); }
  sack.computeVertexNormals();
  b.add(sack, lam("goldSack", () => ({ map: sackTex() })), M(HOARD[0] - 0.9, BED + 0.6, HOARD[2] - 0.6, 0.6, 0, 0.35));
  const coinM = lam("gold", () => ({ color: "#f2c14e", emissive: new THREE.Color("#6a4a08") }));
  let cs = 7;
  const cr = () => { cs = (cs * 16807) % 2147483647; return cs / 2147483647; };
  for (let i = 0; i < 260; i++) {
    const a = cr() * Math.PI * 2, rr = Math.sqrt(cr()) * 1.6, h = Math.max(0, 0.75 * (1 - rr / 1.6)) * cr();
    b.add(cyl(0.11, 0.11, 0.025, 14), coinM, M(HOARD[0] + Math.cos(a) * rr * 1.2 + 0.3, BED + 0.05 + h, HOARD[2] + Math.sin(a) * rr, 0, (cr() - 0.5) * 1.2, (cr() - 0.5) * 1.2));
  }
  for (let i = 0; i < 40; i++) b.add(cyl(0.11, 0.11, 0.025, 14), coinM, M(HOARD[0] - 2.5 - cr() * 3, BED + 0.04, HOARD[2] - 1 + cr() * 2.5, 0, (cr() - 0.5) * 0.4, (cr() - 0.5) * 0.4));
  b.build(R);
  const noCast = new Set<THREE.Material>([stone, oak, oakBeam, front, lam("ceiling", () => ({}))]);
  R.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && noCast.has(m.material as THREE.Material)) m.castShadow = false; });
  // the sunken ship lies on its side beside the hoard
  const wreck = ship(16, 4.4, 3.2, true, { masts: 2, crates: 6, seed: 3, broken: true });
  const wreckYaw = new THREE.Group(); wreckYaw.position.set(WRECK[0], WRECK[1], WRECK[2]); wreckYaw.rotation.y = -2.64; // bow pointing away into the murk
  wreck.rotation.set(1.15, 0, 0.1); wreckYaw.add(wreck); R.add(wreckYaw);
  // the coffin ship moored below the window: low in the water, cargo piled high
  const coffin = ship(15, 4.2, 3.0, true, { masts: 2, crates: 30, seed: 5 });
  coffin.position.set(COFFIN[0], COFFIN[1], COFFIN[2]); coffin.rotation.y = 0.35; R.add(coffin);
  // other moored ships along the river (sound ones, sitting properly)
  [[-70, 40, 0.2], [-95, -34, -0.4], [-140, 18, 0.1], [-160, -60, 0.6], [-60, -48, 0.9]].forEach(([x, z, ry], i) => {
    const s = ship(13 + (i % 3) * 2, 4, 3, false, { masts: 2 + (i % 2), crates: 4, seed: 10 + i });
    s.position.set(x, WATER + 1.4, z); s.rotation.y = ry; R.add(s);
  });
  // river surface (from above) and its underside (from below)
  const waterTex = rep(waterDusk(), 1, 1);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: waterTex, side: THREE.FrontSide }));
  (water.material as THREE.MeshBasicMaterial).map!.repeat.set(25, 25);
  water.position.set(-150, WATER, 0); R.add(water);
  const underTex = rep(underSurf(), 1, 1);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: underTex, side: THREE.BackSide, transparent: true, opacity: 0.92 }));
  (under.material as THREE.MeshBasicMaterial).map!.repeat.set(60, 60);
  under.position.set(-150, WATER - 0.02, 0); under.layers.set(NOINK); R.add(under);
  // underwater light shafts: soft additive slabs slanting down from the surface
  const shaftTex = ctex("shaft", 64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(220,255,230,0.55)"); gr.addColorStop(1, "rgba(220,255,230,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const hg = g.createLinearGradient(0, 0, 64, 0); hg.addColorStop(0, "rgba(0,0,0,1)"); hg.addColorStop(0.5, "rgba(0,0,0,0)"); hg.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = hg; g.fillRect(0, 0, 64, 256); });
  const shafts: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2 + (i % 3), 22), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
    m.position.set(HOARD[0] - 8 + i * 2.1, WATER - 11, HOARD[2] - 5 + (i % 4) * 3); m.rotation.set(0, i * 0.7, 0.28); m.layers.set(NOINK); R.add(m); shafts.push(m);
  }
  return { casement, water, waterTex, under, underTex, shafts, coffin };
};
