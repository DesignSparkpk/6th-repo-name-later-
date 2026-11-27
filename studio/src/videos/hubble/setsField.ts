// "Nobody can climb inside to fix it": a field at dusk (FLD) with an absurdly tall aluminium ladder (30 m), an engineer
// at the very top reaching up with a wrench, a farmhouse and a tree line far off, a fence, and Hubble as a glinting
// speck high in the darkening sky.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { glow } from "./kit";
import { FLD, LADDER_H } from "./story";

const meadow = () => ctex("meadow", 512, 512, (g, r) => {
  g.fillStyle = "#6f8a3a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3000; i++) { g.strokeStyle = ["#7f9a42", "#5f7a30", "#8aa64a", "#9a9a4a"][Math.floor(r() * 4)]; g.globalAlpha = 0.5; g.lineWidth = 1.5; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 6 - r() * 8); g.stroke(); }
  g.globalAlpha = 1;
});
export type FieldSet = { ladder: THREE.Group; speck: THREE.Sprite };
export const buildField = (R: THREE.Object3D): FieldSet => {
  const root = new THREE.Group(); root.position.set(...FLD); R.add(root);
  const b = new Batch();
  b.add(new THREE.CircleGeometry(1400, 64).rotateX(-Math.PI / 2), lam("meadow", () => ({ map: rep(meadow(), 160, 160) })));
  // a tree line and a farmhouse with a barn far off, a split-rail fence nearer
  const tree = lam("fieldTree", () => ({ color: "#3f5a3a" })), wall = lam("farmWall", () => ({ color: "#e8dccb" })), barn = lam("barn", () => ({ color: "#a8402e" })), roofM = lam("farmRoof", () => ({ color: "#5a4a52" }));
  for (let k = 0; k < 60; k++) { const a = -1.3 + (k / 60) * 2.2, d = 380 + ((k * 37) % 9) * 14, h = 14 + ((k * 13) % 7) * 3; b.add(new THREE.SphereGeometry(h * 0.6, 10, 8).scale(1, 1.2, 1).translate(Math.sin(a) * d, h * 0.7, -Math.cos(a) * d), tree); }
  b.add(boxGeo(V(-130, 0, -260), V(-112, 7, -248), 0), wall); b.add(new THREE.ConeGeometry(13.5, 6, 4).rotateY(Math.PI / 4).scale(1, 1, 0.66).translate(-121, 10, -254), roofM);
  b.add(boxGeo(V(-95, 0, -275), V(-70, 11, -255), 0), barn); b.add(new THREE.ConeGeometry(17.5, 7, 4).rotateY(Math.PI / 4).scale(1, 1, 0.8).translate(-82.5, 14.5, -265), roofM);
  const rail = lam("fenceRail", () => ({ color: "#7a5a3a" }));
  for (let x = -40; x <= 40; x += 4) b.add(boxGeo(V(x - 0.07, 0, -14.07), V(x + 0.07, 1.3, -13.93), 0), rail);
  for (const y of [0.55, 1.1]) b.add(boxGeo(V(-40, y - 0.05, -14.03), V(40, y + 0.05, -13.97), 0), rail);
  b.build(root);
  // the ladder: two rails and a rung every 30 cm, pivoting at its feet so it can sway
  const ladder = new THREE.Group(); root.add(ladder);
  const lb = new Batch(), alu = lam("ladderAlu", () => ({ color: "#c8ccd2" }));
  for (const x of [-0.24, 0.24]) lb.add(boxGeo(V(x - 0.035, 0, -0.03), V(x + 0.035, LADDER_H, 0.03), 0), alu);
  for (let y = 0.3; y < LADDER_H; y += 0.3) lb.add(boxGeo(V(-0.24, y - 0.016, -0.016), V(0.24, y + 0.016, 0.016), 0), alu);
  lb.add(boxGeo(V(-0.3, 0, -0.06), V(-0.18, 0.06, 0.06), 0), lam("ladderFoot", () => ({ color: "#2a2a2e" }))); lb.add(boxGeo(V(0.18, 0, -0.06), V(0.3, 0.06, 0.06), 0), lam("ladderFoot", () => ({ color: "#2a2a2e" })));
  lb.build(ladder);
  const speck = glow("#ffffff", 9, 3.2); speck.position.set(60, 680, -420); root.add(speck);
  return { ladder, speck };
};
