// The launch pad at PAD (used twice: the golden 1990 morning and the 1993 night launch). Everything in metres, true scale:
// the shuttle stack (orange external tank with its ogive nose and ribbed intertank, two white boosters with field-joint
// rings, the orbiter with its black belly, cockpit window mask, delta wings, tail fin, OMS pods and three main engines)
// on the mobile launcher, a red lattice service tower with its crew access arm and vent arm, the pad mound and crawlerway,
// a water tower, marsh and palms, the ocean to the east, the assembly building far inland, and the press site with its
// countdown clock. The stack group rises at liftoff; flames are additive HDR meshes (they bloom), smoke is 2D cards (cast.ts).
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { twoTone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { M, MS, cyl, glow } from "./kit";
import { PAD, DECK, GROUND, PADL } from "./story";
export { DECK };


// ---------------- textures ----------------
const foam = () => ctex("etFoam", 512, 1024, (g, r) => {
  g.fillStyle = "#c2672f"; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${110 + r() * 70},${44 + r() * 30},${16 + r() * 18},${0.06 + r() * 0.1})`; g.fillRect(r() * 512, r() * 1024, 2 + r() * 9, 30 + r() * 140); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(255,${190 + r() * 40},${130 + r() * 50},${r() * 0.07})`; g.fillRect(r() * 512, r() * 1024, 2 + r() * 5, 2 + r() * 5); }
});
const ribs = () => ctex("etRibs", 512, 128, (g, r) => {
  g.fillStyle = "#a95b2c"; g.fillRect(0, 0, 512, 128);
  for (let x = 0; x < 512; x += 16) { g.fillStyle = "rgba(60,24,8,0.45)"; g.fillRect(x, 0, 4, 128); g.fillStyle = "rgba(255,190,140,0.12)"; g.fillRect(x + 5, 0, 3, 128); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(80,30,10,${r() * 0.08})`; g.fillRect(r() * 512, r() * 128, 3, 3); }
});
/** the orbiter skin, wrapped round the lofted fuselage: u = angle (0 = +x side, 0.25 = top/back, 0.75 = belly), v = tail..nose */
const NOSE = 37.05;
const skin = () => ctex("orbiterSkin", 1024, 2048, (g, r) => {
  const Y = (y: number) => (1 - y / NOSE) * 2048, U = (u: number) => u * 1024;
  g.fillStyle = "#efeee8"; g.fillRect(0, 0, 1024, 2048);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(150,150,160,${r() * 0.06})`; g.fillRect(r() * 1024, r() * 2048, 8 + r() * 30, 6 + r() * 20); }  // tile-to-tile tonal patchwork
  // black belly tiles, the chine curving up toward the nose
  g.fillStyle = "#1d1e23"; g.beginPath(); g.moveTo(U(0.555), Y(0)); g.lineTo(U(0.555), Y(28)); g.quadraticCurveTo(U(0.52), Y(34), U(0.47), Y(NOSE));
  g.lineTo(U(1.03), Y(NOSE)); g.quadraticCurveTo(U(0.98), Y(34), U(0.945), Y(28)); g.lineTo(U(0.945), Y(0)); g.closePath(); g.fill();
  g.fillStyle = "#1d1e23"; g.fillRect(0, Y(NOSE), U(0.03), Y(28) - Y(NOSE));
  for (let x = U(0.56); x < U(0.94); x += 9) { g.fillStyle = "rgba(255,255,255,0.035)"; g.fillRect(x, 0, 1, 2048); }   // tile grid
  for (let y = 0; y < 2048; y += 9) { g.fillStyle = "rgba(255,255,255,0.03)"; g.fillRect(U(0.56), y, U(0.38), 1); }
  // nose cap
  g.fillStyle = "#2a2b30"; g.fillRect(0, 0, 1024, Y(36.15));
  // the black mask round the windscreen, windows inside it, and the two overhead windows
  g.fillStyle = "#1b1c21"; g.beginPath(); g.moveTo(U(0.1), Y(31.0)); g.quadraticCurveTo(U(0.25), Y(30.2), U(0.4), Y(31.0)); g.lineTo(U(0.37), Y(34.0)); g.quadraticCurveTo(U(0.25), Y(34.6), U(0.13), Y(34.0)); g.closePath(); g.fill();
  for (let k = 0; k < 6; k++) {
    const u0 = 0.135 + k * 0.039, u1 = u0 + 0.033;
    const gr = g.createLinearGradient(0, Y(33.6), 0, Y(31.6)); gr.addColorStop(0, "#26354f"); gr.addColorStop(0.5, "#0c1220"); gr.addColorStop(1, "#3c5072");
    g.fillStyle = gr; g.beginPath(); g.moveTo(U(u0), Y(31.6)); g.lineTo(U(u1), Y(31.6)); g.lineTo(U(u1 - 0.004), Y(33.5)); g.lineTo(U(u0 + 0.004), Y(33.5)); g.closePath(); g.fill();
  }
  g.fillStyle = "#121826"; g.fillRect(U(0.215), Y(30.4), U(0.025), Y(29.8) - Y(30.4)); g.fillRect(U(0.26), Y(30.4), U(0.025), Y(29.8) - Y(30.4));
  // payload bay doors: centre seam, hinge lines, panel joints
  g.fillStyle = "rgba(90,92,100,0.8)"; g.fillRect(U(0.249), Y(24.6), 3, Y(7.2) - Y(24.6));
  for (const u of [0.115, 0.385]) g.fillRect(U(u), Y(24.6), 2, Y(7.2) - Y(24.6));
  for (let y = 7.2; y <= 24.7; y += 1.75) g.fillRect(U(0.115), Y(y), U(0.27), 2);
  // forward RCS thruster ports on the nose sides
  g.fillStyle = "#18191d"; for (const u of [0.02, 0.48]) for (let k = 0; k < 3; k++) g.fillRect(U(u) - 10, Y(35.4 - k * 0.45), 20, 12);
  // the crew hatch on the left side (u = 0.5 is the -x side)
  g.strokeStyle = "rgba(70,72,80,0.9)"; g.lineWidth = 3; g.beginPath(); g.arc(U(0.5), Y(29.5), 26, 0, 7); g.stroke();
});
const lattice = (col: string) => lam("tower" + col, () => ({ color: col }));
const marsh = () => ctex("marsh", 1024, 1024, (g, r) => {
  g.fillStyle = "#7d8a46"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 2600; i++) { const c = ["#8c9a4c", "#6f7c3c", "#a3a457", "#5f6e38", "#b0a35e"][Math.floor(r() * 5)]; g.fillStyle = c; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 6 + r() * 40, 4 + r() * 18, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  for (let k = 0; k < 7; k++) { // meandering water channels
    g.strokeStyle = "rgba(84,112,118,0.55)"; g.lineWidth = 2 + r() * 4; g.beginPath(); let x = r() * 1024, y = 0; g.moveTo(x, y);
    while (y < 1024) { x += (r() - 0.5) * 90; y += 30 + r() * 40; g.lineTo(x, y); } g.stroke();
  }
});
const concrete = () => ctex("padConcrete", 512, 512, (g, r) => {
  g.fillStyle = "#b9b4aa"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${90 + r() * 60},${86 + r() * 50},${80 + r() * 40},${r() * 0.12})`; g.fillRect(r() * 512, r() * 512, 3 + r() * 20, 3 + r() * 20); }
  g.strokeStyle = "rgba(80,76,70,0.4)"; g.lineWidth = 2; for (let x = 0; x <= 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(512, x); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,36,34,${0.05 + r() * 0.1})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }   // exhaust scorch
});
const ocean = () => ctex("ocean", 512, 512, (g, r) => {
  g.fillStyle = "#3d6f9a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${200 + r() * 55},${220 + r() * 35},255,${r() * 0.18})`; g.fillRect(r() * 512, r() * 512, 10 + r() * 50, 1 + r() * 2); }
});
const palmTex = () => ctex("palm", 256, 512, (g, r) => {
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = "#4a3c2a"; g.lineWidth = 10; g.beginPath(); g.moveTo(128, 512); g.quadraticCurveTo(116, 300, 132, 130); g.stroke();
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.42 + (r() - 0.5) * 0.2, L = 80 + r() * 40;
    g.strokeStyle = "#2f4a26"; g.lineWidth = 5; g.beginPath(); g.moveTo(132, 130);
    const ex = 132 + Math.cos(a) * L, ey = 130 + Math.sin(a) * L * 0.6 + L * 0.45; g.quadraticCurveTo(132 + Math.cos(a) * L * 0.5, 130 + Math.sin(a) * L * 0.6, ex, ey); g.stroke();
    for (let j = 1; j < 9; j++) { const t = j / 9, px = 132 + (ex - 132) * t, py = 130 + (ey - 130) * t - Math.sin(t * Math.PI) * 18; g.lineWidth = 3; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + 1.2) * 18, py + 14); g.moveTo(px, py); g.lineTo(px + Math.cos(a - 1.2) * 18, py + 14); g.stroke(); }
  }
});

// ---------------- geometry helpers ----------------
/** a lofted body along +y through superellipse sections [y, half-width (x), half-depth (z), centre z] */
const loft = (st: [number, number, number, number][], n = 40, sq = 3.2) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const top = st[st.length - 1][0];
  for (const [y, a, b, cz] of st) for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    pos.push(a * Math.sign(c) * Math.abs(c) ** (2 / sq), y, cz + b * Math.sign(s) * Math.abs(s) ** (2 / sq)); uv.push(i / n, y / top);
  }
  for (let j = 0; j < st.length - 1; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + n + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
};
/** a lathe (round body of revolution) from [radius, y] pairs */
const lathe = (pts: [number, number][], n = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y)), n);
/** a thin beam between two points (4-sided) */
const beamGeo = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), 4, 1); g.rotateY(Math.PI / 4);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  g.applyQuaternion(q); const m = a.clone().add(b).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
};
/** an extruded flat plate from a 2D outline (in the plate's own x/y), `thick` metres along +z */
const plate = (pts: [number, number][], thick: number) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
};

// ---------------- the shuttle stack ----------------
export type Stack = { g: THREE.Group; srbFire: THREE.Mesh[]; ssmeFire: THREE.Mesh[]; srbGlow: THREE.Sprite[]; ssmeGlow: THREE.Sprite[]; diamonds: THREE.Sprite[] };
const flameTex = (key: string, stops: [number, string][]) => ctex(key, 64, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
  const sx = g.createLinearGradient(0, 0, 64, 0); sx.addColorStop(0, "rgba(0,0,0,0.55)"); sx.addColorStop(0.5, "rgba(0,0,0,0)"); sx.addColorStop(1, "rgba(0,0,0,0.55)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = sx; g.fillRect(0, 0, 64, 512); g.globalCompositeOperation = "source-over";
});
const fireMesh = (len: number, r0: number, r1: number, tex: THREE.Texture, col: THREE.Color) => {
  const geo = new THREE.CylinderGeometry(r0, r1, len, 28, 1, true); geo.translate(0, -len / 2, 0);   // hangs down from its origin
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.layers.set(NOINK); m.visible = false; m.frustumCulled = false; return m;
};
export const buildStack = (): Stack => {
  const g = new THREE.Group(), b = new Batch();
  const et = twoTone(new THREE.MeshLambertMaterial({ map: rep(foam(), 3, 2) }));
  const it = twoTone(new THREE.MeshLambertMaterial({ map: rep(ribs(), 4, 1) }));
  const white = lam("srbWhite", () => ({ color: "#f1efe9" })), dark = lam("stackDark", () => ({ color: "#2a2b30" }));
  const metal = twoTone(new THREE.MeshPhongMaterial({ color: "#6d7078", specular: new THREE.Color("#9aa0aa"), shininess: 40, side: THREE.DoubleSide }));
  // external tank: aft dome, hydrogen tank, ribbed intertank, oxygen tank, ogive nose with its spike
  b.add(lathe([[0.01, 12.1], [2.2, 12.35], [3.5, 12.9], [4.2, 13.6], [4.2, 41.0]], 48), et);
  b.add(cyl(4.24, 4.24, 3.6, 48, true).translate(0, 42.8, 0), it);
  const og: [number, number][] = [[4.2, 44.6], [4.2, 50.6]];
  for (let k = 1; k <= 12; k++) { const t = k / 12; og.push([4.2 * Math.cos(t * Math.PI / 2) ** 0.85, 50.6 + t * 9.8]); }
  b.add(lathe(og, 48), et);
  b.add(cyl(0.12, 0.35, 1.4, 10).translate(0, 61.0, 0), dark);
  b.add(cyl(0.3, 0.3, 30, 10).translate(1.9, 28.8, 3.75), et);                                     // LO2 feed line down the side
  b.add(cyl(0.22, 0.22, 30, 8).translate(-1.6, 28.8, 3.85), et);                                    // cable tray
  // the two boosters
  for (const sd of [-1, 1]) {
    const x = sd * PADL.srbX;
    b.add(lathe([[2.55, 0], [2.3, 1.6], [1.95, 3.2], [1.85, 3.3]], 36).translate(x, 0, 0), white);   // aft skirt
    b.add(cyl(1.85, 1.85, 38.2, 36, true).translate(x, 22.4, 0), white);
    b.add(lathe([[1.85, 41.5], [1.0, 44.6], [0.55, 45.6], [0.01, 46.3]], 36).translate(x, 0, 0), white);   // nose frustum + cap
    for (const y of [10.5, 18.0, 25.5, 33.0]) b.add(cyl(1.88, 1.88, 0.22, 36, true).translate(x, y, 0), dark);   // field joints
    b.add(cyl(1.875, 1.875, 1.1, 36, true).translate(x, 40.4, 0), dark);                            // forward separation-motor band
    b.add(cyl(0.9, 1.6, 3.2, 28, true).translate(x, -1.6, 0), metal);                                // nozzle
    b.add(boxGeo(V(x - sd * 1.6 - 0.25, 7.0, -0.2), V(x - sd * 1.6 + 0.25, 8.2, 0.2), 0), dark);     // aft attach strut
  }
  // the orbiter: lofted fuselage (tail at y 0, nose up), wings, fin, OMS pods, main engines, body flap
  const O = new THREE.Group(); O.position.set(0, 13.2, PADL.orbZ); g.add(O);
  const fus = new THREE.Mesh(loft([[0.0, 2.55, 2.4, 0.15], [6.0, 2.6, 2.5, 0.2], [24.5, 2.6, 2.5, 0.2], [27.5, 2.55, 2.45, 0.1], [30.0, 2.4, 2.25, -0.1], [32.0, 2.15, 1.95, -0.35],
    [33.8, 1.8, 1.55, -0.6], [35.2, 1.35, 1.1, -0.85], [36.3, 0.85, 0.65, -1.05], [36.9, 0.35, 0.28, -1.2], [NOSE, 0.02, 0.02, -1.25]]), twoTone(new THREE.MeshLambertMaterial({ map: skin() })));
  fus.castShadow = true; fus.receiveShadow = true; O.add(fus);
  const ob = new Batch();
  const wingTop = lam("orbWhite", () => ({ color: "#efeee8" })), wingBot = lam("orbBlack", () => ({ color: "#1d1e23" }));
  for (const sd of [-1, 1]) {
    const pl: [number, number][] = [[2.3, 23.0], [4.2, 17.0], [12.0, 4.4], [12.0, 2.2], [2.3, 0.9]].map(([x, y]) => [sd * x, y]);
    if (sd < 0) pl.reverse();
    ob.add(plate(pl, 0.42).translate(0, 0, -2.5), wingBot); ob.add(plate(pl, 0.34).translate(0, 0, -2.08), wingTop);
    const le: [number, number][] = [[2.3, 23.0], [4.2, 17.0], [12.0, 4.4], [11.6, 4.2], [3.9, 16.6], [2.3, 22.2]].map(([x, y]) => [sd * x, y]);
    if (sd < 0) le.reverse();
    ob.add(plate(le, 0.78).translate(0, 0, -2.51), lam("orbRcc", () => ({ color: "#4a4b52" })));                                          // grey leading edge
    ob.add(new THREE.SphereGeometry(1, 20, 12).scale(1.15, 4.2, 0.95).translate(sd * 1.75, 4.6, 2.25), wingTop);                         // OMS pod
    ob.add(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.2, 0.6, 1.0).rotateX(Math.PI).translate(sd * 1.75, 0.45, 2.25), wingBot);
  }
  const fin = plate([[2.4, 9.8], [10.7, 3.4], [10.7, 0.7], [2.4, 0.6]], 0.55); fin.rotateY(-Math.PI / 2); fin.translate(0.275, 0, 0);
  ob.add(fin, wingTop);
  const finEdge = plate([[2.4, 9.8], [10.7, 3.4], [10.7, 3.0], [2.4, 9.3]], 0.62); finEdge.rotateY(-Math.PI / 2); finEdge.translate(0.31, 0, 0); ob.add(finEdge, lam("orbRcc", () => ({ color: "#4a4b52" })));
  ob.add(boxGeo(V(-2.7, -0.7, -2.45), V(2.7, 0.35, -1.25), 0), wingBot);                            // body flap
  ob.add(boxGeo(V(-2.4, -0.15, -1.3), V(2.4, 0.05, 2.3), 0), wingBot);                              // aft heat shield
  const engines: [number, number][] = [[0, 1.15], [-1.38, -0.85], [1.38, -0.85]];
  for (const [ex, ez] of engines) { ob.add(cyl(0.5, 1.12, 3.1, 28, true).translate(ex, -1.5, ez), metal); ob.add(cyl(0.48, 0.48, 0.5, 20).translate(ex, 0.0, ez), dark); }
  ob.build(O);
  b.build(g);
  // flames: booster plumes (white-hot core to orange) and the main engines' pale blue-violet cones with shock diamonds
  const srbT = flameTex("srbFlame", [[0, "rgba(255,255,250,1)"], [0.12, "rgba(255,236,170,1)"], [0.45, "rgba(255,150,60,0.8)"], [0.8, "rgba(200,80,30,0.35)"], [1, "rgba(120,40,20,0)"]]);
  const ssmeT = flameTex("ssmeFlame", [[0, "rgba(255,255,255,1)"], [0.2, "rgba(210,190,255,0.85)"], [0.7, "rgba(150,140,255,0.35)"], [1, "rgba(120,120,255,0)"]]);
  const srbFire: THREE.Mesh[] = [], srbGlow: THREE.Sprite[] = [], ssmeFire: THREE.Mesh[] = [], ssmeGlow: THREE.Sprite[] = [], diamonds: THREE.Sprite[] = [];
  for (const sd of [-1, 1]) {
    const f = fireMesh(1, 1.7, 5.2, srbT, new THREE.Color(1, 1, 1).multiplyScalar(2.4)); f.position.set(sd * PADL.srbX, -3.2, 0); g.add(f); srbFire.push(f);
    const gl = glow("#ffe7b0", 26, 4.0); gl.position.set(sd * PADL.srbX, -4.5, 0); gl.visible = false; g.add(gl); srbGlow.push(gl);
  }
  for (const [ex, ez] of engines) {
    const f = fireMesh(1, 1.05, 1.6, ssmeT, new THREE.Color(1, 1, 1).multiplyScalar(2.6)); f.position.set(ex, 13.2 - 3.05, PADL.orbZ + ez); g.add(f); ssmeFire.push(f);
    const gl = glow("#d8d0ff", 7, 3.0); gl.position.set(ex, 13.2 - 3.6, PADL.orbZ + ez); gl.visible = false; g.add(gl); ssmeGlow.push(gl);
    for (let k = 0; k < 3; k++) { const d = glow("#fff4ff", 1.6, 4.5); d.position.set(ex, 13.2 - 4.6 - k * 2.2, PADL.orbZ + ez); d.visible = false; g.add(d); diamonds.push(d); }
  }
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh && !o.layers.isEnabled(NOINK)) { o.castShadow = true; o.receiveShadow = true; } });
  return { g, srbFire, ssmeFire, srbGlow, ssmeGlow, diamonds };
};

// ---------------- the pad, the tower, the landscape ----------------
export type PadSet = { stack: Stack; clock: THREE.Mesh; clockTex: THREE.CanvasTexture; clockCtx: CanvasRenderingContext2D; padGlow: THREE.Sprite; trenchGlow: THREE.Sprite[]; deckFire: THREE.Sprite[] };
export const buildPad = (R: THREE.Object3D): PadSet => {
  const root = new THREE.Group(); root.position.set(...PAD); R.add(root);
  const b = new Batch();
  // marsh, the pad mound (an octagonal frustum) and its concrete top, the crawlerway ramp
  const marshM = twoTone(new THREE.MeshLambertMaterial({ map: rep(marsh(), 26, 26) }));
  const disc = new THREE.CircleGeometry(3200, 64).rotateX(-Math.PI / 2).translate(0, GROUND, 0); b.add(disc, marshM);
  const conc = twoTone(new THREE.MeshLambertMaterial({ map: rep(concrete(), 8, 8) }));
  b.add(new THREE.CylinderGeometry(78, 104, -GROUND, 8, 1, true).rotateY(Math.PI / 8).translate(0, GROUND / 2, 0), lam("padSlope", () => ({ color: "#8f9668" })));
  b.add(new THREE.CircleGeometry(78, 8).rotateX(-Math.PI / 2).rotateY(Math.PI / 8).translate(0, 0.02, 0), conc);
  const crawl = lam("crawlerway", () => ({ color: "#b5ab98" }));
  b.add(boxGeo(V(-1600, GROUND, -16), V(-100, GROUND + 0.4, -3), 0), crawl); b.add(boxGeo(V(-1600, GROUND, 3), V(-100, GROUND + 0.4, 16), 0), crawl);
  for (const [z0, z1] of [[-16, -3], [3, 16]]) {
    const ramp = new THREE.PlaneGeometry(1, 1); const p = ramp.attributes.position as THREE.BufferAttribute;
    const P4 = [V(-100, GROUND + 0.4, z1), V(-60, 0.03, z1), V(-100, GROUND + 0.4, z0), V(-60, 0.03, z0)];
    for (let i = 0; i < 4; i++) p.setXYZ(i, P4[i].x, P4[i].y, P4[i].z); ramp.computeVertexNormals(); b.add(ramp, crawl);
  }
  // the ocean to the east and its beach
  b.add(new THREE.PlaneGeometry(8000, 12000).rotateX(-Math.PI / 2).translate(4700, GROUND - 0.3, 0), twoTone(new THREE.MeshLambertMaterial({ map: rep(ocean(), 40, 60) })));
  b.add(new THREE.PlaneGeometry(90, 12000).rotateX(-Math.PI / 2).translate(660, GROUND + 0.05, 0), lam("beach", () => ({ color: "#e8d9b0" })));
  // mobile launcher platform on its pedestals, tail service masts, the flame holes' dark mouths
  const mlp = lam("mlpGrey", () => ({ color: "#8d9096" }));
  b.add(boxGeo(V(-24.5, 4, -20.5), V(24.5, DECK, 20.5), 0), mlp);
  for (const x of [-20, 0, 20]) for (const z of [-16, 16]) b.add(boxGeo(V(x - 2, 0, z - 2), V(x + 2, 4, z + 2), 0), conc);
  for (const sd of [-1, 1]) b.add(boxGeo(V(sd * 9.2 - 1.4, DECK, 3.2), V(sd * 9.2 + 1.4, DECK + 8.5, 6.6), 0), mlp);
  b.add(boxGeo(V(-PADL.trench - 14, -4.5, -9), V(-PADL.trench, 0.05, 9), 0), lam("trench", () => ({ color: "#2b2a2c" })));
  b.add(boxGeo(V(PADL.trench, -4.5, -9), V(PADL.trench + 14, 0.05, 9), 0), lam("trench", () => ({ color: "#2b2a2c" })));
  // the fixed service tower: red-painted lattice, 12 levels, hammerhead crane, lightning mast, access arm and vent arm
  const T = PADL.tower, red = lattice("#b4462e"), grey = lam("towerGrey", () => ({ color: "#d4d1ca" }));
  const cx = [T.x0, T.x1], cz = [T.z0, T.z1];
  for (const x of cx) for (const z of cz) b.add(boxGeo(V(x - 0.45, 0, z - 0.45), V(x + 0.45, T.h, z + 0.45), 0), red);
  for (let L = 0; L <= 12; L++) {
    const y = 4 + L * 6.2; if (y > T.h) break;
    b.add(boxGeo(V(T.x0, y - 0.3, T.z0 - 0.3), V(T.x1, y + 0.3, T.z0 + 0.3), 0), red); b.add(boxGeo(V(T.x0, y - 0.3, T.z1 - 0.3), V(T.x1, y + 0.3, T.z1 + 0.3), 0), red);
    b.add(boxGeo(V(T.x0 - 0.3, y - 0.3, T.z0), V(T.x0 + 0.3, y + 0.3, T.z1), 0), red); b.add(boxGeo(V(T.x1 - 0.3, y - 0.3, T.z0), V(T.x1 + 0.3, y + 0.3, T.z1), 0), red);
    b.add(boxGeo(V(T.x0, y - 0.12, T.z0), V(T.x1, y + 0.05, T.z1), 0), grey);                       // grating floor
    if (L < 12 && y + 6.2 <= T.h) {
      const y1 = y + 6.2;
      for (const z of cz) { b.add(beamGeo(V(T.x0, y, z), V(T.x1, y1, z), 0.17), red); b.add(beamGeo(V(T.x1, y, z), V(T.x0, y1, z), 0.17), red); }
      for (const x of cx) { b.add(beamGeo(V(x, y, T.z0), V(x, y1, T.z1), 0.17), red); b.add(beamGeo(V(x, y, T.z1), V(x, y1, T.z0), 0.17), red); }
    }
  }
  b.add(boxGeo(V(T.x0 - 8, T.h, -1.2), V(T.x1 + 6, T.h + 2.4, 1.2), 0), red);                     // hammerhead crane boom
  b.add(boxGeo(V(T.x0 + 2, T.h, -2), V(T.x0 + 6, T.h + 5, 2), 0), grey);                          // crane house
  b.add(cyl(0.6, 0.9, 22, 10).translate((T.x0 + T.x1) / 2, T.h + 11, 0), lam("mast", () => ({ color: "#e9e6df" })));   // lightning mast
  b.add(cyl(0.05, 0.6, 3, 8).translate((T.x0 + T.x1) / 2, T.h + 23.5, 0), dark0());
  // crew access arm out to the orbiter's hatch, with the white room at its end; the vent arm swung back from the tank's nose
  const armY = DECK + 13.2 + 28.5, hatch = V(-2.4, armY, PADL.orbZ - 0.3);
  b.add(beamGeo(V(T.x1, armY, 1.0), V(hatch.x - 2.4, armY, hatch.z - 0.4), 1.15), grey);
  b.add(boxGeo(V(hatch.x - 3.6, armY - 1.6, hatch.z - 1.7), V(hatch.x - 0.6, armY + 1.6, hatch.z + 1.3), 0), lam("whiteRoom", () => ({ color: "#f3f1ec" })));
  b.add(boxGeo(V(T.x1, DECK + 62.5, -1.0), V(T.x1 + 3, DECK + 64.2, 1.0), 0), grey);
  b.add(beamGeo(V(T.x1 + 3, DECK + 63.4, 0), V(T.x1 + 4, DECK + 63.4, -14), 0.6), grey);
  b.add(new THREE.SphereGeometry(2.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(T.x1 + 4, DECK + 61.8, -15.5), grey);   // the "beanie cap" hood
  // the water tower and a few service buildings
  b.add(cyl(2.2, 2.6, 74, 14).translate(-170, GROUND + 37, -260), grey);
  b.add(new THREE.SphereGeometry(9, 24, 16).translate(-170, GROUND + 80, -260), grey);
  for (const [x, z, w, d, h] of [[90, -120, 24, 14, 9], [120, 90, 30, 16, 7], [-130, 110, 20, 12, 8]] as const) b.add(boxGeo(V(x, GROUND, z), V(x + w, GROUND + h, z + d), 0), lam("shed", () => ({ color: "#d8d4c8" })));
  // the vehicle assembly building, far inland in the haze, with its huge flag
  b.add(boxGeo(V(-2100, GROUND, -260), V(-1940, GROUND + 160, -60), 0), lam("vab", () => ({ color: "#ddd9d0" })));
  b.add(boxGeo(V(-1939.9, GROUND + 70, -230), V(-1939.5, GROUND + 140, -140), 0), twoTone(new THREE.MeshLambertMaterial({ map: flagTex() })));
  // palms and scrub around the press site
  const palmM = new THREE.MeshLambertMaterial({ map: palmTex(), transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
  twoTone(palmM);
  const palms: [number, number, number][] = [[-262, 318, 13], [-275, 352, 11], [-238, 366, 12], [-205, 305, 10], [-300, 300, 12], [-182, 350, 9], [-320, 340, 14]];
  for (const [x, z, h] of palms) { const p = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.5, h), palmM); p.position.set(x, GROUND + h / 2, z); p.rotation.y = -0.65; root.add(p); }
  // the press site: a grass bank, the flagpole, the countdown clock (its LED face is a live canvas)
  b.add(boxGeo(V(-300, GROUND, 300), V(-200, GROUND + 0.6, 380), 0), lam("pressGrass", () => ({ color: "#86a04e" })));
  const [kx, , kz] = PADL.clock;
  const clockG = new THREE.Group(); clockG.position.set(kx, GROUND, kz); clockG.rotation.y = PADL.clockYaw; root.add(clockG);
  const cb = new Batch();
  cb.add(boxGeo(V(-4.4, 0.6, -0.6), V(4.4, 4.6, 0.6), 0), lam("clockBox", () => ({ color: "#232428" })));
  cb.add(boxGeo(V(-4.6, 4.6, -0.7), V(4.6, 4.9, 0.7), 0), lam("clockTrim", () => ({ color: "#d9d6cf" })));
  for (const x of [-3.2, 3.2]) cb.add(boxGeo(V(x - 0.25, 0, -0.25), V(x + 0.25, 0.6, 0.25), 0), dark0());
  cb.build(clockG);
  b.add(cyl(0.09, 0.12, 16, 8).translate(kx + 10, GROUND + 8, kz - 2), lam("pole", () => ({ color: "#e6e4de" })));
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4, 12, 1), twoTone(new THREE.MeshLambertMaterial({ map: flagTex(), side: THREE.DoubleSide })));
  const fp = flag.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < fp.count; i++) fp.setZ(i, Math.sin((fp.getX(i) + 2.1) * 1.4) * 0.25 * (fp.getX(i) + 2.1) / 4.2);
  flag.geometry.computeVertexNormals(); flag.position.set(kx + 12.1, GROUND + 14.6, kz - 2); flag.rotation.y = -0.5; root.add(flag);
  b.build(root);
  const cc = document.createElement("canvas"); cc.width = 1024; cc.height = 256;
  const clockTex = new THREE.CanvasTexture(cc); clockTex.colorSpace = THREE.SRGBColorSpace;
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 3.4), new THREE.MeshBasicMaterial({ map: clockTex, color: new THREE.Color(1, 1, 1).multiplyScalar(1.6), toneMapped: true }));
  clock.position.set(0, 2.6, 0.62); clock.layers.set(NOINK); clockG.add(clock);
  const stack = buildStack(); stack.g.position.set(0, DECK, 0); root.add(stack.g);
  const padGlow = glow("#ffb060", 90, 1.6); padGlow.position.set(0, DECK + 2.5, 4); padGlow.visible = false; root.add(padGlow);
  const trenchGlow = [-1, 1].map((sd) => { const s = glow("#ffb070", 60, 1.4); s.position.set(sd * (PADL.trench + 8), 0, 0); s.visible = false; root.add(s); return s; });
  // the boosters' fire bursting out at deck level at ignition (stays at the pad as the stack climbs away)
  const deckFire = [-1, 1].map((sd) => { const s = glow("#ffd9a0", 34, 3.2); s.position.set(sd * PADL.srbX, DECK + 1.2, 1); s.visible = false; root.add(s); return s; });
  return { stack, clock, clockTex, clockCtx: cc.getContext("2d")!, padGlow, trenchGlow, deckFire };
};
const dark0 = () => lam("stackDark", () => ({ color: "#2a2b30" }));
const flagTex = () => ctex("usFlag", 380, 200, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f2ee" : "#b8323a"; g.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1); }
  g.fillStyle = "#2c3a70"; g.fillRect(0, 0, 152, (7 * 200) / 13);
  g.fillStyle = "#f4f2ee"; for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++) { g.beginPath(); g.arc(12 + c * 25 + (r % 2 ? 12 : 0), 9 + r * 11.8, 3, 0, 7); g.fill(); }
});

/** paint the countdown clock's LED face: "T-" then minutes:seconds, amber digits on black */
export const paintClock = (P: PadSet, secs: number) => {
  const g = P.clockCtx; g.fillStyle = "#050404"; g.fillRect(0, 0, 1024, 256);
  const s = Math.max(0, Math.ceil(secs)), txt = `T-00:00:${String(s).padStart(2, "0")}`;
  g.font = "bold 150px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#3a1a04"; g.fillText("T-88:88:88", 512, 136);
  g.fillStyle = "#ffb43a"; g.shadowColor = "#ff8a1a"; g.shadowBlur = 24; g.fillText(txt, 512, 136); g.shadowBlur = 0;
  P.clockTex.needsUpdate = true;
};
void MS; void M;
