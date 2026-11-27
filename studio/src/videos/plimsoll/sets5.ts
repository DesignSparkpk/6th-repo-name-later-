// The ending: two more marked hulls for the sunrise harbour, and the school gym (x ~ GX) with a pair of plimsolls
// whose rubber stripe matches the line on the hull (the match cut), wall bars, ropes, a vaulting box and the portrait.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { M, cyl, basic, ship } from "./sets";
import { DX, DW, GX, SHOE } from "./story";

const markFull = () => ctex("markFull", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "#ffffff"; g.lineWidth = 22; g.beginPath(); g.arc(128, 128, 84, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#ffffff"; g.fillRect(6, 116, 244, 24); g.font = "bold 46px Georgia, serif"; g.textAlign = "center"; g.fillText("L", 64, 100); g.fillText("R", 192, 100);
});
const gymFloor = () => ctex("gymFloor", 1024, 1024, (g, r) => {
  g.fillStyle = "#d9a865"; g.fillRect(0, 0, 1024, 1024);
  for (let x = 0; x < 1024; x += 32) { g.fillStyle = `rgb(${210 + r() * 22},${158 + r() * 18},${92 + r() * 14})`; g.fillRect(x + 1, 0, 30, 1024); g.fillStyle = "rgba(120,80,40,0.35)"; g.fillRect(x, 0, 2, 1024); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,240,210,0.25)"; g.fillRect(r() * 1024, r() * 1024, 30 + r() * 60, 4); }
  g.strokeStyle = "#c0302a"; g.lineWidth = 10; g.beginPath(); g.arc(512, 512, 260, 0, 7); g.stroke();
  g.strokeStyle = "#2c4f86"; g.lineWidth = 10; g.strokeRect(60, 60, 904, 904);
});
const gymWall = () => ctex("gymWall", 512, 512, (g, r) => {
  g.fillStyle = "#eadfca"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -40 : 0; x < 512; x += 80) { g.fillStyle = `rgba(${200 + r() * 20},${188 + r() * 20},${160 + r() * 20},0.6)`; g.fillRect(x + 2, y + 2, 76, 28); }
  g.fillStyle = "#4a7a5a"; g.fillRect(0, 400, 512, 112);
});
const portrait = () => ctex("plimPortrait", 384, 480, (g) => {
  g.fillStyle = "#c9a24e"; g.fillRect(0, 0, 384, 480); g.fillStyle = "#2a2a36"; g.fillRect(26, 26, 332, 428);
  g.fillStyle = "#f4efe2"; g.beginPath(); g.ellipse(192, 200, 104, 112, 0, 0, 7); g.fill(); g.strokeStyle = "#241726"; g.lineWidth = 9; g.stroke();
  g.fillStyle = "#76604c"; g.beginPath(); g.moveTo(88, 220); g.quadraticCurveTo(86, 380, 192, 392); g.quadraticCurveTo(298, 380, 296, 220); g.quadraticCurveTo(250, 286, 192, 286); g.quadraticCurveTo(134, 286, 88, 220); g.fill(); g.stroke();
  g.fillStyle = "#6e5e50"; g.beginPath(); g.moveTo(92, 160); g.quadraticCurveTo(192, 40, 292, 160); g.quadraticCurveTo(250, 112, 192, 108); g.quadraticCurveTo(134, 112, 92, 160); g.fill();
  g.fillStyle = "#241726"; g.fillRect(132, 180, 40, 9); g.fillRect(212, 180, 40, 9); g.beginPath(); g.arc(152, 205, 9, 0, 7); g.arc(232, 205, 9, 0, 7); g.fill();
  g.fillStyle = "#5e4a3a"; g.beginPath(); g.ellipse(192, 262, 46, 12, 0, 0, 7); g.fill();
  g.fillStyle = "#2a2a36"; g.fillRect(0, 440, 384, 40); g.fillStyle = "#e2c26a"; g.font = "bold 26px Georgia, serif"; g.textAlign = "center"; g.fillText("S. PLIMSOLL  1824-1898", 192, 468);
});

/** a canvas plimsoll: white rubber sole and toe cap, the thin dark rubber stripe around it, navy canvas upper, white laces */
const shoe = (b: Batch, x: number, z: number, ry: number, s = 1) => {
  const shp = new THREE.Shape(); // footprint (heel at -x, toe at +x), metres
  shp.moveTo(-0.13, 0); shp.bezierCurveTo(-0.13, 0.05, -0.08, 0.052, 0.0, 0.048); shp.bezierCurveTo(0.08, 0.05, 0.145, 0.04, 0.145, 0.0);
  shp.bezierCurveTo(0.145, -0.04, 0.08, -0.05, 0.0, -0.045); shp.bezierCurveTo(-0.08, -0.046, -0.13, -0.045, -0.13, 0);
  const m = new THREE.Matrix4().compose(V(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(s, s, s));
  const ext = (h: number, y0: number, grow: number) => { const g = new THREE.ExtrudeGeometry(shp, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.scale(1 + grow, 1, 1 + grow * 2.5); g.translate(0, y0, 0); return g; };
  b.add(ext(0.012, 0, 0), lam("shoeSole", () => ({ color: "#f2efe8" })), m);
  b.add(ext(0.006, 0.012, 0.008), lam("shoeStripe", () => ({ color: "#1d1d24" })), m); // the stripe the shoes are named after
  b.add(ext(0.014, 0.018, 0), lam("shoeSole", () => ({})), m);
  const up = new THREE.SphereGeometry(0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); up.scale(1.3, 0.62, 0.46); up.translate(-0.01, 0.03, 0);
  b.add(up, lam("shoeCanvas", () => ({ color: "#22304a" })), m);
  const toe = new THREE.SphereGeometry(0.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); toe.scale(1.0, 0.55, 0.9); toe.translate(0.105, 0.03, 0);
  b.add(toe, lam("shoeSole", () => ({})), m);
  for (let k = 0; k < 4; k++) b.add(new THREE.BoxGeometry(0.008, 0.006, 0.07), lam("shoeLace", () => ({ color: "#ffffff" })), new THREE.Matrix4().multiplyMatrices(m, new THREE.Matrix4().makeTranslation(0.025 - k * 0.022, 0.087 - k * 0.002, 0)));
};

export type Sets5 = { harbourShips: THREE.Group[] };

export const buildSets5 = (R: THREE.Object3D): Sets5 => {
  // ---- the sunrise harbour: two more sound ships along the quay, each wearing the mark ----
  const harbourShips: THREE.Group[] = [];
  [[DX + 18, 3.2, 0], [DX - 14, 3.2, 1]].forEach(([x, z, k]) => {
    const s2 = ship(15, 4.2, 3.0, false, { masts: 2 + (k % 2), crates: 3, seed: 50 + k, sails: "furled" });
    s2.position.set(x, DW + 1.45, z); s2.visible = false; R.add(s2);
    for (const side of [-1, 1]) {
      const mk = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: markFull(), transparent: true, alphaTest: 0.3, depthWrite: false, side: THREE.DoubleSide }));
      mk.position.set(0.4, -0.5, side * 2.07); mk.rotation.y = side < 0 ? Math.PI : 0; mk.layers.set(NOINK); s2.add(mk);
    }
    harbourShips.push(s2);
  });
  // ---- the school gym ----
  const b = new Batch();
  b.add(boxGeo(V(GX - 12, -0.2, -8), V(GX + 12, 0, 9), 0), lam("gymFloor", () => ({ map: rep(gymFloor(), 1, 1) })));
  const wall = lam("gymWall", () => ({ map: rep(gymWall(), 1, 1) }));
  b.add(boxGeo(V(GX - 12, 0, -8.3), V(GX + 12, 8, -8), 3), wall);
  b.add(boxGeo(V(GX - 12.3, 0, -8), V(GX - 12, 8, 9), 3), wall); b.add(boxGeo(V(GX + 12, 0, -8), V(GX + 12.3, 8, 9), 3), wall);
  b.add(boxGeo(V(GX - 12, 0, 9), V(GX + 12, 8, 9.3), 3), wall);
  b.add(boxGeo(V(GX - 12, 8, -8), V(GX + 12, 8.3, 9.3), 0), lam("gymCeil", () => ({ color: "#d8d0c0" })));
  for (let z = -6; z <= 8; z += 3.5) b.add(boxGeo(V(GX - 12, 7.5, z - 0.15), V(GX + 12, 8, z + 0.15)), lam("gymBeam", () => ({ color: "#8a6a4a" })));
  // tall windows high on the back wall: bright daylight
  for (let k = -3; k <= 3; k++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.4), basic("gymWin", () => ({ map: ctex("gymWinTex", 128, 140, (g) => { g.fillStyle = "#f4fbff"; g.fillRect(0, 0, 128, 140); g.fillStyle = "#cfe6f5"; g.fillRect(8, 8, 52, 58); g.fillRect(68, 8, 52, 58); g.fillRect(8, 74, 52, 58); g.fillRect(68, 74, 52, 58); }), color: new THREE.Color(1.35, 1.35, 1.35) })));
    w.position.set(GX + k * 3.2, 6.0, -7.98); w.layers.set(NOINK); R.add(w);
  }
  // wall bars along the back wall, climbing ropes, a vaulting box, a long bench
  const wood = lam("gymWood", () => ({ color: "#b88a52" }));
  for (let k = -9; k <= 9; k += 1.1) { b.add(boxGeo(V(GX + k - 0.05, 0, -7.95), V(GX + k + 0.05, 4.2, -7.75)), wood); }
  for (let y = 0.3; y < 4.2; y += 0.32) b.add(cyl(0.025, 0.025, 19.6, 6).rotateZ(Math.PI / 2), wood, M(GX, y, -7.83));
  for (const x of [-7, -5.6]) b.add(cyl(0.03, 0.03, 7.5, 6), lam("gymRope", () => ({ color: "#c8b080" })), M(GX + x, 3.75, -2));
  b.add(boxGeo(V(GX + 5, 0, -3.5), V(GX + 7, 1.1, -2.7)), wood); b.add(boxGeo(V(GX + 5, 1.1, -3.55), V(GX + 7, 1.25, -2.65)), lam("gymPad", () => ({ color: "#7a2a2a" })));
  b.add(boxGeo(V(GX - 4, 0.35, 3.3), V(GX + 4, 0.45, 3.6)), wood); for (const x of [-3.6, 3.6]) b.add(boxGeo(V(GX + x - 0.05, 0, 3.32), V(GX + x + 0.05, 0.35, 3.58)), wood);
  // the hero pair of plimsolls on the floor, and a row of pairs further along
  shoe(b, SHOE[0], SHOE[2], 0.0); shoe(b, SHOE[0] + 0.02, SHOE[2] - 0.13, 0.06);
  for (let k = 1; k <= 5; k++) { shoe(b, SHOE[0] - k * 0.5, SHOE[2] - 0.02 * k, 0.04 * k); shoe(b, SHOE[0] - k * 0.5 + 0.02, SHOE[2] - 0.13 - 0.02 * k, 0.04 * k + 0.05); }
  b.build(R);
  // the portrait over the wall bars
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), lam("plimPortrait", () => ({ map: portrait() })));
  pf.position.set(GX, 5.3, -7.94); R.add(pf);
  return { harbourShips };
};
