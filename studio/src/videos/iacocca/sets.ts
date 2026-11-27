// The sets of "I Just Don't Like You", each on its own island (story.ts): Ford's walnut boardroom at dusk, the rainy
// plaza under the glass tower, Chrysler's plant (a loss counter over the line, red ink pouring down the walls), plus a
// generic 1960s-70s coupe used everywhere (no badges or logos).
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { cyl, hdr, glow, basic } from "./kit";
import { BRD, TWR, FAC, LAMP, CUP, BOSS } from "./story";

// ---------------- textures ----------------
const walnut = () => ctex("walnut", 512, 512, (g, r) => {
  g.fillStyle = "#4a2a18"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 180; i++) { g.strokeStyle = `rgba(${30 + r() * 40},${14 + r() * 20},${6 + r() * 10},${0.25 + r() * 0.35})`; g.lineWidth = 1 + r() * 3; const x = r() * 512; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 40, 170, x + (r() - 0.5) * 40, 340, x + (r() - 0.5) * 30, 512); g.stroke(); }
  g.strokeStyle = "rgba(20,10,4,0.75)"; g.lineWidth = 8; g.strokeRect(20, 20, 472, 472);
  g.strokeStyle = "rgba(255,200,150,0.14)"; g.lineWidth = 3; g.strokeRect(32, 32, 448, 448);
});
const carpet = () => ctex("brdCarpet", 256, 256, (g, r) => {
  g.fillStyle = "#4a1a1c"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${20 + r() * 40},${6 + r() * 14},${8 + r() * 14},${r() * 0.25})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  g.strokeStyle = "rgba(200,150,80,0.18)"; g.lineWidth = 3; g.strokeRect(16, 16, 224, 224);
});
/** Detroit at dusk through the boardroom window: orange sky, river, towers with lit windows */
const dusk = () => ctex("duskSkyline", 1024, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#2a1a3a"); gr.addColorStop(0.45, "#c0504a"); gr.addColorStop(0.75, "#f09a50"); gr.addColorStop(1, "#ffd08a");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "rgba(255,230,180,0.9)"; g.beginPath(); g.arc(780, 380, 46, 0, 7); g.fill();
  let x = -10;
  while (x < 1024) {
    const w = 40 + r() * 90, h = 140 + r() * 260, y = 512 - h;
    g.fillStyle = "#1e1428"; g.fillRect(x, y, w, h);
    for (let wy = y + 10; wy < 500; wy += 14) for (let wx = x + 5; wx < x + w - 6; wx += 10) if (r() < 0.3) { g.fillStyle = r() < 0.8 ? "#ffcf7a" : "#a8d0ff"; g.fillRect(wx, wy, 5, 7); }
    x += w + 2 + r() * 8;
  }
});
const glassWall = () => ctex("glassWall", 512, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 512, 1024); gr.addColorStop(0, "#7a8aa4"); gr.addColorStop(0.5, "#4a5a74"); gr.addColorStop(1, "#6a7a94");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(220,230,250,${r() * 0.08})`; g.fillRect(r() * 512, 0, 6 + r() * 40, 1024); }
  g.strokeStyle = "#2a3040"; g.lineWidth = 6; for (let x = 0; x <= 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  g.lineWidth = 4; for (let y = 0; y <= 1024; y += 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
const wetStone = () => ctex("wetStone", 512, 512, (g, r) => {
  g.fillStyle = "#4a4e58"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) { const v = 66 + r() * 18; g.fillStyle = `rgb(${v},${v + 3},${v + 10})`; g.fillRect(x + 2, y + 2, 60, 60); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(190,205,230,${0.06 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 4 + r() * 10, 0, 0, 7); g.fill(); }   // reflections
});
const concrete = () => ctex("facConcrete", 512, 512, (g, r) => {
  g.fillStyle = "#6a625a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${40 + r() * 50},${36 + r() * 40},${32 + r() * 30},${r() * 0.15})`; g.fillRect(r() * 512, r() * 512, 3 + r() * 14, 3 + r() * 14); }
  g.strokeStyle = "rgba(230,190,40,0.7)"; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 470); g.lineTo(512, 470); g.stroke();
});
const brick = () => ctex("facBrick", 512, 512, (g, r) => {
  g.fillStyle = "#3a2420"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 512; x += 64) { const v = 0.8 + r() * 0.3; g.fillStyle = `rgb(${110 * v},${56 * v},${44 * v})`; g.fillRect(x + 2, y + 2, 60, 28); }
});
/** the ink: deep red paint running down the wall, a ragged dripping lower edge (alpha) */
const inkTex = () => ctex("ink", 512, 512, (g, r) => {
  g.clearRect(0, 0, 512, 512);
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 430);
  for (let x = 0; x < 512; x += 6) { const L = 20 + r() * 80 + (r() < 0.15 ? 60 : 0); g.fillRect(x, 420, 7, L); g.beginPath(); g.arc(x + 3.5, 420 + L, 4.5, 0, 7); g.fill(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`; g.fillRect(r() * 512, 0, 2 + r() * 6, 300 + r() * 160); }
});

// ---------------- the coupe (generic, no badges) ----------------
const PROFILE: [number, number][] = [[-2.3, 0.33], [2.3, 0.33], [2.36, 0.6], [2.12, 0.8], [0.6, 0.9], [0.08, 1.3], [-1.2, 1.32], [-1.92, 0.96], [-2.36, 0.84]];
const WINDOW: [number, number][] = [[0.48, 0.93], [0.06, 1.25], [-1.12, 1.27], [-1.72, 0.96]];
const extrude = (pts: [number, number][], depth: number) => { const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }); g.translate(0, 0, -depth / 2); return g; };
export const coupe = (color: string) => {
  const g = new THREE.Group(), b = new Batch();
  b.add(extrude(PROFILE, 1.7), lam("car" + color, () => ({ color })));
  const glass = lam("carGlass", () => ({ color: "#1c2430" })), chrome = lam("carChrome", () => ({ color: "#d8dce2" })), tyre = lam("carTyre", () => ({ color: "#1a1a1e" }));
  for (const sd of [-1, 1]) { const w = extrude(WINDOW, 0.02); w.translate(0, 0, sd * 0.88); b.add(w, glass); }
  b.add(boxGeo(V(0.06, 0.95, -0.72), V(0.5, 1.22, 0.72), 0).rotateZ(0), glass);   // windscreen band
  for (const x of [-1.45, 1.45]) for (const sd of [-1, 1]) { b.add(cyl(0.36, 0.36, 0.26, 18).rotateX(Math.PI / 2).translate(x, 0.36, sd * 0.8), tyre); b.add(cyl(0.2, 0.2, 0.28, 14).rotateX(Math.PI / 2).translate(x, 0.36, sd * 0.81), chrome); }
  b.add(boxGeo(V(2.34, 0.34, -0.86), V(2.46, 0.46, 0.86), 0), chrome); b.add(boxGeo(V(-2.46, 0.34, -0.86), V(-2.34, 0.46, 0.86), 0), chrome);
  b.build(g);
  for (const sd of [-1, 1]) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16).rotateY(Math.PI / 2), basic("headlamp", () => ({ color: hdr("#fff4d8", 1.8) }))); h.position.set(2.37, 0.66, sd * 0.6); g.add(h); }
  return g;
};

// ---------------- Ford's boardroom ----------------
export type BoardSet = { lampGlow: THREE.Sprite; lampBulb: THREE.Mesh; cup: THREE.Group; tv: THREE.Mesh; tvCtx: CanvasRenderingContext2D; tvTex: THREE.CanvasTexture };
export const buildBoard = (R: THREE.Object3D): BoardSet => {
  const root = new THREE.Group(); root.position.set(...BRD); R.add(root);
  const b = new Batch(), wood = lam("walnut", () => ({ map: rep(walnut(), 1, 1) }));
  b.add(new THREE.PlaneGeometry(14, 12).rotateX(-Math.PI / 2).translate(0, 0, -0.5), lam("brdCarpet", () => ({ map: rep(carpet(), 5, 4) })));
  b.add(new THREE.PlaneGeometry(14, 12).rotateX(Math.PI / 2).translate(0, 4.6, -0.5), lam("brdCeil", () => ({ color: "#2a1c16" })));
  // back wall around the big window, side walls of panelling
  for (const [x0, x1, y0, y1] of [[-7, -4, 0, 4.6], [4, 7, 0, 4.6], [-4, 4, 0, 0.9], [-4, 4, 4.2, 4.6]]) b.add(new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, -6.5), wood);
  b.add(new THREE.PlaneGeometry(12, 4.6).rotateY(Math.PI / 2).translate(-7, 2.3, -0.5), wood); b.add(new THREE.PlaneGeometry(12, 4.6).rotateY(-Math.PI / 2).translate(7, 2.3, -0.5), wood);
  for (let x = -4; x <= 4; x += 1.6) b.add(boxGeo(V(x - 0.07, 0.9, -6.5), V(x + 0.07, 4.2, -6.36), 0), lam("mullion", () => ({ color: "#1e1410" })));
  // the desk: walnut body, green leather inset, a brass pen stand
  b.add(boxGeo(V(-1.75, 0, -2.65), V(1.75, 0.74, -1.5), 0), wood);
  b.add(boxGeo(V(-1.85, 0.74, -2.75), V(1.85, 0.8, -1.42), 0), lam("deskTop", () => ({ color: "#5a321c" })));
  b.add(boxGeo(V(-0.9, 0.8, -2.45), V(0.9, 0.81, -1.7), 0), lam("deskLeather", () => ({ color: "#2a4a34" })));
  // the big leather chair behind him, a portrait on the wall, bookshelves
  const leather = lam("brdChair", () => ({ color: "#5a1a1a" }));
  b.add(boxGeo(V(-0.6, 0, -4.1), V(0.6, 0.55, -3.5), 0), leather); b.add(boxGeo(V(-0.65, 0.55, -4.2), V(0.65, 1.55, -3.95), 0), leather);
  b.add(boxGeo(V(-6.9, 2.0, -3.2), V(-6.85, 3.6, -1.6), 0), lam("frameGold", () => ({ color: "#b8902a" })));
  for (const sd of [-1, 1]) for (let y = 0.3; y < 4; y += 0.8) b.add(boxGeo(V(sd * 6.95 - (sd > 0 ? 0.4 : 0), y, 1.2), V(sd * 6.95 + (sd < 0 ? 0.4 : 0), y + 0.06, 3.6), 0), wood);
  // the lamp: brass foot and stem, green glass shade
  const brass = lam("brass", () => ({ color: "#c9a040" }));
  b.add(cyl(0.12, 0.15, 0.04, 16).translate(LAMP[0], LAMP[1] + 0.02, LAMP[2]), brass); b.add(cyl(0.015, 0.015, 0.38, 8).translate(LAMP[0], LAMP[1] + 0.21, LAMP[2]), brass);
  b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.42, 20, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(LAMP[0], LAMP[1] + 0.42, LAMP[2]), lam("lampShade", () => ({ color: "#1e6a3a" })));
  // the TV on a cabinet (it shows his triumph at the end)
  b.add(boxGeo(V(-3.9, 0, -4.6), V(-2.6, 0.75, -3.9), 0), wood); b.add(boxGeo(V(-3.75, 0.75, -4.5), V(-2.75, 1.6, -3.95), 0), lam("tvBox", () => ({ color: "#3a2c22" })));
  b.build(root);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.3), basic("duskWin", () => ({ map: dusk(), color: hdr("#ffffff", 1.15) })));
  win.position.set(0, 2.55, -6.6); win.layers.set(NOINK); root.add(win);
  const lampBulb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.05), basic("lampBulb", () => ({ color: hdr("#ffe6b0", 3.0) })));
  lampBulb.position.set(LAMP[0], LAMP[1] + 0.36, LAMP[2]); lampBulb.layers.set(NOINK); root.add(lampBulb);
  const lampGlow = glow("#ffd89a", 1.6, 1.3); lampGlow.position.set(LAMP[0], LAMP[1] + 0.33, LAMP[2] + 0.05); root.add(lampGlow);
  // the coffee cup on its saucer (tips at the very end)
  const cup = new THREE.Group(); cup.position.set(CUP[0], CUP[1], CUP[2]); root.add(cup);
  const cb = new Batch(), china = lam("china", () => ({ color: "#f2f0ea" }));
  cb.add(cyl(0.075, 0.075, 0.012, 20).translate(0.05, 0.006, 0), china); cb.add(cyl(0.045, 0.036, 0.075, 18, true).translate(0.05, 0.05, 0), china);
  cb.add(new THREE.CircleGeometry(0.043, 18).rotateX(-Math.PI / 2).translate(0.05, 0.075, 0), lam("coffee", () => ({ color: "#3a2010" })));
  cb.build(cup, false);
  const cc = document.createElement("canvas"); cc.width = 256; cc.height = 192;
  const tvTex = new THREE.CanvasTexture(cc); tvTex.colorSpace = THREE.SRGBColorSpace;
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.62), new THREE.MeshBasicMaterial({ map: tvTex, color: hdr("#ffffff", 1.3) }));
  tv.position.set(-3.25, 1.17, -3.94); tv.layers.set(NOINK); root.add(tv);
  void BOSS;
  return { lampGlow, lampBulb, cup, tv, tvCtx: cc.getContext("2d")!, tvTex };
};

// ---------------- the plaza under the glass tower ----------------
export type PlazaSet = { doors: THREE.Mesh[]; box: THREE.Group; model: THREE.Group };
export const buildPlaza = (R: THREE.Object3D): PlazaSet => {
  const root = new THREE.Group(); root.position.set(...TWR); R.add(root);
  const b = new Batch();
  b.add(new THREE.PlaneGeometry(60, 40).rotateX(-Math.PI / 2).translate(0, 0, 4), lam("wetStone", () => ({ map: rep(wetStone(), 12, 8) })));
  for (const [x0, x1] of [[-30, -1.7], [1.7, 30]]) b.add(new THREE.PlaneGeometry(x1 - x0, 40).translate((x0 + x1) / 2, 20, -8), lam("glassWall", () => ({ map: rep(glassWall(), 6, 4) })));
  b.add(new THREE.PlaneGeometry(3.4, 37).translate(0, 21.5, -8), lam("glassWall", () => ({ map: rep(glassWall(), 1, 4) })));
  b.add(boxGeo(V(-1.8, 3, -8.3), V(1.8, 3.4, -7.4), 0), lam("canopySteel", () => ({ color: "#2a2e38" })));
  b.add(boxGeo(V(-3, 0, -7.6), V(3, 0.16, -6.4), 0), lam("step", () => ({ color: "#7a7e88" })));
  for (const x of [-5.5, 5.5]) { b.add(boxGeo(V(x - 0.9, 0, -6.2), V(x + 0.9, 0.7, -5.2), 0), lam("planter", () => ({ color: "#5a5e68" }))); b.add(new THREE.SphereGeometry(0.75, 12, 8).scale(1, 0.8, 0.6).translate(x, 1.1, -5.7), lam("shrub", () => ({ color: "#3a5a3a" }))); }
  b.add(cyl(0.07, 0.09, 4.2, 8).translate(-3.6, 2.1, -2.5), lam("post", () => ({ color: "#22252c" })));
  for (const [x, z, s] of [[1.4, -2.2, 1.6], [-1.2, -0.6, 1.1], [2.6, 0.8, 1.3]]) b.add(new THREE.CircleGeometry(s, 24).scale(1, 0.5, 1).rotateX(-Math.PI / 2).translate(x, 0.005, z), lam("puddle", () => ({ color: "#9aa6c0" })));
  b.build(root);
  // the glass doors (swing open as he is thrown out)
  const doors = [-1, 1].map((sd) => {
    const piv = new THREE.Group(); piv.position.set(sd * 1.6, 0, -7.95); root.add(piv);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 2.9), new THREE.MeshBasicMaterial({ color: new THREE.Color("#a8bcd8"), transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    m.position.set(-sd * 0.78, 1.45, 0); m.layers.set(NOINK); piv.add(m); return m;
  });
  // his cardboard box, and the little red car model that flies out of it
  const box = new THREE.Group(); root.add(box);
  const bx = new Batch(); bx.add(boxGeo(V(-0.25, 0, -0.18), V(0.25, 0.28, 0.18), 0, true), lam("cardboard", () => ({ color: "#b8905a" }))); bx.build(box);
  const model = coupe("#c8282a"); model.scale.setScalar(0.08); root.add(model);
  return { doors, box, model };
};

// ---------------- Chrysler's plant ----------------
export type FactorySet = { counter: THREE.Mesh; ctx: CanvasRenderingContext2D; ctex: THREE.CanvasTexture; ink: THREE.Mesh; inkMat: THREE.MeshBasicMaterial; cars: THREE.Group[]; sirens: THREE.Sprite[]; last: string };
export const buildFactory = (R: THREE.Object3D): FactorySet => {
  const root = new THREE.Group(); root.position.set(...FAC); R.add(root);
  const b = new Batch();
  b.add(new THREE.PlaneGeometry(40, 30).rotateX(-Math.PI / 2).translate(0, 0, -1), lam("facConcrete", () => ({ map: rep(concrete(), 8, 6) })));
  const br = lam("facBrick", () => ({ map: rep(brick(), 6, 3) }));
  b.add(new THREE.PlaneGeometry(40, 14).translate(0, 7, -12), br);
  b.add(new THREE.PlaneGeometry(30, 14).rotateY(Math.PI / 2).translate(-20, 7, 3), br); b.add(new THREE.PlaneGeometry(30, 14).rotateY(-Math.PI / 2).translate(20, 7, 3), br);
  b.add(new THREE.PlaneGeometry(40, 14).rotateY(Math.PI).translate(0, 7, 14), br);
  b.add(new THREE.PlaneGeometry(40, 30).rotateX(Math.PI / 2).translate(0, 14, 1), lam("facRoof", () => ({ color: "#1a1412" })));
  const steel = lam("truss", () => ({ color: "#3a3430" }));
  for (let z = -10; z <= 12; z += 4) b.add(boxGeo(V(-20, 12.6, z - 0.15), V(20, 13.0, z + 0.15), 0), steel);
  // the line: a long conveyor with rails
  b.add(boxGeo(V(-19, 0, -7.2), V(19, 0.55, -4.8), 0), lam("conveyor", () => ({ color: "#2a2c30" })));
  for (const z of [-7.25, -4.75]) b.add(boxGeo(V(-19, 0.55, z - 0.06), V(19, 0.75, z + 0.06), 0), lam("rail", () => ({ color: "#e0b020" })));
  // the counter's frame and the doors at the front
  b.add(boxGeo(V(-6.2, 5.8, -11.95), V(6.2, 8.6, -11.7), 0), lam("counterFrame", () => ({ color: "#121214" })));
  b.add(boxGeo(V(-3.5, 0, 13.9), V(3.5, 5.2, 14.0), 0), lam("facDoors", () => ({ color: "#4a5a4a" })));
  b.build(root);
  // the red ink: a sheet hung from the top of the back wall, scaled down the wall
  const inkGeo = new THREE.PlaneGeometry(40, 13); inkGeo.translate(0, -6.5, 0);
  const inkMat = new THREE.MeshBasicMaterial({ map: rep(inkTex(), 6, 1), color: hdr("#9a0a12", 0.9), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const ink = new THREE.Mesh(inkGeo, inkMat); ink.position.set(0, 13.2, -11.9); ink.scale.y = 0.001; ink.layers.set(NOINK); root.add(ink);
  // the counter: a live canvas
  const cc = document.createElement("canvas"); cc.width = 1024; cc.height = 224;
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const counter = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.6), new THREE.MeshBasicMaterial({ map: ct, color: hdr("#ffffff", 1.6) }));
  counter.position.set(0, 7.2, -11.65); counter.layers.set(NOINK); root.add(counter);
  // cars on the line
  const cols = ["#6a7a8a", "#a83030", "#e0d8c0", "#2a4a7a", "#3a6a4a", "#c08a2a", "#7a2a5a"];
  const cars = cols.map((c, i) => { const g = coupe(c); g.position.set(-15 + i * 5, 0.55, -6); root.add(g); return g; });
  // work lights and red sirens
  for (let x = -16; x <= 16; x += 8) { const l = glow("#ffb060", 3.5, 1.2); l.position.set(x, 11.5, -2); root.add(l); }
  const sirens = [-7.4, 7.4].map((x) => { const s = glow("#ff2020", 3, 2.4); s.position.set(x, 8.6, -11.5); root.add(s); return s; });
  return { counter, ctx: cc.getContext("2d")!, ctex: ct, ink, inkMat, cars, sirens, last: "" };
};
/** paint the counter: red "-$1,100,000,000" (a loss) or green "+$2,400,000,000" */
export const paintCounter = (F: FactorySet, v: number, green: boolean) => {
  const n = Math.round(Math.abs(v) / 1e6) * 1e6, key = `${n}|${green}|${Math.sign(v)}`;
  if (key === F.last) return; F.last = key;
  const g = F.ctx; g.fillStyle = "#080606"; g.fillRect(0, 0, 1024, 224);
  const txt = (v < 0 ? "-" : green ? "+" : " ") + "$" + n.toLocaleString("en-US");
  g.font = "bold 104px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = green ? "#0a2a10" : "#2a0606"; g.fillText("-$8,888,888,888", 512, 118);
  g.fillStyle = green ? "#5cff7a" : "#ff3a2a"; g.shadowColor = g.fillStyle; g.shadowBlur = 26; g.fillText(txt, 512, 118); g.shadowBlur = 0;
  F.ctex.needsUpdate = true;
};
