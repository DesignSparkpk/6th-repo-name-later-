// The printing press (x ~ PRX) and the lantern-lit town square at dusk (x ~ QX).
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep, cobbleHD, facadeHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { M, cyl, basic } from "./sets";
import { PRX, QX } from "./story";

const brickWall = () => ctex("pressBrick", 512, 512, (g, r) => {
  g.fillStyle = "#4a3028"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 24) for (let x = (y / 24) % 2 ? -32 : 0; x < 512; x += 64) { g.fillStyle = `rgb(${110 + r() * 30},${56 + r() * 16},${40 + r() * 12})`; g.fillRect(x + 2, y + 2, 60, 20); }
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(20,14,10,${0.1 + r() * 0.15})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 60, 20 + r() * 40, 0, 0, 7); g.fill(); }
});
const posterTex = (k: number) => ctex("poster" + k, 256, 340, (g, r) => {
  g.fillStyle = "#e9dfc6"; g.fillRect(0, 0, 256, 340);
  g.fillStyle = "#2a2430"; g.font = "bold 30px Georgia, serif"; g.textAlign = "center"; g.fillText(["THE TIMES", "DAILY NEWS", "THE GLOBE"][k % 3], 128, 40);
  g.fillRect(16, 52, 224, 4);
  for (let i = 0; i < 12; i++) g.fillRect(16 + (i % 2) * 116, 70 + Math.floor(i / 2) * 42, 104, 30 - r() * 8);
});
const bannerTex = () => ctex("bannerSailors", 1024, 192, (g) => {
  g.fillStyle = "#f1e6c8"; g.fillRect(0, 0, 1024, 192); g.strokeStyle = "#7a1f2b"; g.lineWidth = 14; g.strokeRect(8, 8, 1008, 176);
  g.fillStyle = "#7a1f2b"; g.font = "bold 110px Georgia, serif"; g.textAlign = "center"; g.fillText("SAVE OUR SAILORS", 512, 138);
});
const pubSign = () => ctex("pubSign", 256, 256, (g) => {
  g.fillStyle = "#1f3b2c"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#e2c26a"; g.lineWidth = 10; g.strokeRect(8, 8, 240, 240);
  g.fillStyle = "#e2c26a"; g.font = "bold 40px Georgia, serif"; g.textAlign = "center"; g.fillText("THE", 128, 70); g.fillText("ANCHOR", 128, 226);
  g.strokeStyle = "#e2c26a"; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 92); g.lineTo(128, 180); g.moveTo(98, 112); g.lineTo(158, 112); g.stroke(); g.beginPath(); g.arc(128, 160, 34, 0.2, Math.PI - 0.2); g.stroke();
});

export type Sets4 = { rollers: THREE.Object3D[]; flywheel: THREE.Object3D; sheets: THREE.Mesh[] };

export const buildSets4 = (R: THREE.Object3D): Sets4 => {
  const b = new Batch();
  // ======== the press room ========
  const brick = lam("pressBrick", () => ({ map: rep(brickWall(), 1, 1) }));
  const iron = lam("pressIron", () => ({ color: "#2f4a3e" })), brass = lam("pressBrass", () => ({ color: "#c9a24e" }));
  b.add(boxGeo(V(PRX - 7, -0.2, -6), V(PRX + 7, 0, 7), 2), lam("pressFloor", () => ({ color: "#5a4030" })));
  b.add(boxGeo(V(PRX - 7.3, 0, -6), V(PRX - 7, 6, 7), 3), brick); b.add(boxGeo(V(PRX + 7, 0, -6), V(PRX + 7.3, 6, 7), 3), brick);
  b.add(boxGeo(V(PRX - 7, 0, -6.3), V(PRX + 7, 6, -6), 3), brick);
  b.add(boxGeo(V(PRX - 7, 6, -6), V(PRX + 7, 6.3, 7), 0), lam("pressCeil", () => ({ color: "#2e221a" })));
  for (let k = 0; k < 6; k++) { const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), lam("poster" + k, () => ({ map: posterTex(k) }))); pm.position.set(PRX - 4.5 + k * 1.6, 3.0 + (k % 2) * 0.3, -5.98); pm.rotation.z = (k % 3 - 1) * 0.05; R.add(pm); }
  // the press: a frame, an ink drum, three rollers, a feed table, an output tray, a flywheel on the side
  b.add(boxGeo(V(PRX - 1.6, 0, -0.9), V(PRX - 1.3, 2.4, 0.9)), iron); b.add(boxGeo(V(PRX + 1.3, 0, -0.9), V(PRX + 1.6, 2.4, 0.9)), iron);
  b.add(boxGeo(V(PRX - 1.6, 2.4, -0.9), V(PRX + 1.6, 2.7, 0.9)), iron);
  b.add(boxGeo(V(PRX - 1.4, 0.95, 0.9), V(PRX + 1.4, 1.05, 2.2)), lam("feedTable", () => ({ color: "#7a5a3a" })));
  b.add(boxGeo(V(PRX - 1.0, 1.05, 1.2), V(PRX + 1.0, 1.35, 2.0)), lam("paperStack", () => ({ color: "#f1ead8" })));
  b.add(boxGeo(V(PRX - 1.4, 0.7, -2.2), V(PRX + 1.4, 0.8, -0.9)), lam("feedTable", () => ({})));
  for (const x of [-1.62, 1.62]) b.add(new THREE.SphereGeometry(0.1, 10, 8), brass, M(PRX + x, 2.55, 0));
  b.build(R);
  const rollers: THREE.Object3D[] = [];
  [[1.1, 0.25, 0.32], [1.6, -0.2, 0.26], [2.05, 0.15, 0.22]].forEach(([y, z, r0], k) => {
    const g = new THREE.Group(); g.position.set(PRX, y, z); R.add(g);
    const rb = new Batch(); rb.add(cyl(r0, r0, 2.6, 24).rotateZ(Math.PI / 2), k === 0 ? lam("inkDrum", () => ({ map: ctex("inkDrum", 256, 64, (gg) => { gg.fillStyle = "#2a2430"; gg.fillRect(0, 0, 256, 64); gg.fillStyle = "#6a6470"; for (let x = 0; x < 256; x += 32) gg.fillRect(x, 0, 10, 64); }) })) : lam("roller", () => ({ map: ctex("rollerTex", 256, 64, (gg) => { gg.fillStyle = "#b9b2a4"; gg.fillRect(0, 0, 256, 64); gg.fillStyle = "#7a7468"; for (let x = 0; x < 256; x += 32) gg.fillRect(x, 0, 8, 64); }) })), M(0, 0, 0)); rb.build(g);
    rollers.push(g);
  });
  const flywheel = new THREE.Group(); flywheel.position.set(PRX + 1.9, 1.4, 0); R.add(flywheel);
  const fb = new Batch(); fb.add(new THREE.TorusGeometry(1.05, 0.08, 10, 36).rotateY(Math.PI / 2), iron, M(0, 0, 0));
  for (let k = 0; k < 6; k++) fb.add(new THREE.BoxGeometry(0.06, 2.0, 0.08), iron, M(0, 0, 0, 0, (k / 6) * Math.PI));
  fb.add(cyl(0.14, 0.14, 0.3, 16).rotateZ(Math.PI / 2), brass, M(0, 0, 0)); fb.build(flywheel);
  // sheets streaming out of the rollers (dynamic)
  const sheetTex = ctex("printedSheet", 256, 340, (g) => { g.fillStyle = "#f4efe2"; g.fillRect(0, 0, 256, 340); g.fillStyle = "#2a2430"; g.font = "bold 26px Georgia, serif"; g.textAlign = "center"; g.fillText("PLIMSOLL'S", 128, 40); g.fillText("PROTEST!", 128, 72); for (let i = 0; i < 12; i++) g.fillRect(16 + (i % 2) * 116, 96 + Math.floor(i / 2) * 38, 104, 24); });
  const sheets: THREE.Mesh[] = [];
  for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.82), new THREE.MeshBasicMaterial({ map: sheetTex, side: THREE.DoubleSide })); m.layers.set(NOINK); R.add(m); sheets.push(m); }
  // gas lamps in the press room
  for (const x of [-4, 4]) { const gl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), basic("pressLamp", () => ({ color: new THREE.Color(3, 2.1, 0.9) }))); gl.position.set(PRX + x, 4.6, -1); gl.layers.set(NOINK); R.add(gl); }
  // ======== the town square at dusk ========
  const sb = new Batch();
  sb.add(boxGeo(V(QX - 40, -0.3, -30), V(QX + 40, 0, 40), 4), lam("squareCobble", () => ({ map: cobbleHD() })));
  const houses: [number, number, number, number, number][] = [[-20, -14, 0, 8, 11], [-11, -14, 0, 7, 12], [-3, -14, 0, 8, 10], [6, -14, 0, 7, 12], [14, -14, 0, 8, 11],
    [-22, 2, Math.PI / 2, 9, 11], [-22, 13, Math.PI / 2, 9, 10], [22, 3, -Math.PI / 2, 9, 12], [22, 14, -Math.PI / 2, 9, 10]];
  houses.forEach(([x, z, ry, w, h], k) => {
    const g = new THREE.Group(); g.position.set(QX + x, 0, z); g.rotation.y = ry; R.add(g);
    const hb = new Batch();
    hb.add(boxGeo(V(-w / 2, 0, -8), V(w / 2, h, 0), 0), lam("sqHouse" + k, () => ({ map: facadeHD("sqHouse" + k, w, h, { wall: ["#9e6b50", "#b88a5e", "#7a4a3a", "#c49a6c"][k % 4], shutter: ["#2f4f3a", "#3a2f4a", "#7a1f2b"][k % 3], door: true, brick: k % 2 === 0 }) })));
    hb.add(new THREE.ConeGeometry(Math.hypot(w, 8) / 2, 3.5, 4).scale(1, 1, 8 / w), lam("sqRoof", () => ({ color: "#3d3346" })), M(0, h + 1.75, -4, Math.PI / 4));
    hb.add(cyl(0.45, 0.55, 2.6, 8), lam("sqChimney", () => ({ color: "#6a4650" })), M(w * 0.3, h + 2.2, -5));
    hb.build(g);
  });
  // the pub sign, gas lamps, the banner strung between two lamp posts, crates for the orator
  const iron2 = lam("sqIron", () => ({ color: "#26282e" }));
  const lampXZ: [number, number][] = [[-5, -7.2], [5, -7.2], [-11, 6], [11, 6], [-6, 12], [6, 12]];
  const glows: THREE.Mesh[] = [];
  for (const [x, z] of lampXZ) {
    sb.add(cyl(0.08, 0.12, 5.6, 10), iron2, M(QX + x, 2.8, z));
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), basic("sqLamp", () => ({ color: new THREE.Color(3.2, 2.2, 1.0) }))); gl.position.set(QX + x, 5.85, z); gl.layers.set(NOINK); R.add(gl); glows.push(gl);
  }
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.0, 10, 1), lam("bannerSailors", () => ({ map: bannerTex(), side: THREE.DoubleSide })));
  const bp = banner.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < bp.count; i++) bp.setY(i, bp.getY(i) - 0.35 * (1 - (bp.getX(i) / 5.5) ** 2)); banner.geometry.computeVertexNormals();
  banner.position.set(QX, 5.6, -7.2); banner.scale.setScalar(0.9); R.add(banner);
  const ps = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), lam("pubSign", () => ({ map: pubSign(), side: THREE.DoubleSide }))); ps.position.set(QX - 14.5, 5.2, -13.2); R.add(ps);
  sb.add(new THREE.BoxGeometry(1.1, 0.55, 0.8), lam("crateTea", () => ({})), M(QX, 0.275, 0));
  [[2.5, -1.5], [-3, 1.5], [9, 3]].forEach(([x, z]) => sb.add(cyl(0.42, 0.36, 1.05, 14), lam("barrel", () => ({})), M(QX + x, 0.52, z)));
  sb.build(R);
  return { rollers, flywheel, sheets };
};
