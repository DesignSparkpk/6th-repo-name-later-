// The idea, drawn as a glowing blueprint at CLN: the corrective-optics box (the size of a phone booth) with its
// fold-out arms, the telescope's light coming down as rays. With the flaw the rays never meet (a fat red smear on the
// detector); when the arm swings a tiny mirror into the beam - the same flaw in reverse - they converge on one sharp
// point (cyan). Lines are thin glowing tubes (HDR, they bloom); the backdrop is blueprint paper with a grid.
import * as THREE from "three";
import { Batch, V } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { hdr, glow, basic } from "./kit";
import { CLN } from "./story";

const paper = () => ctex("blueprint", 512, 512, (g, r) => {
  g.fillStyle = "#0e2a5c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,170,255,${r() * 0.05})`; g.fillRect(r() * 512, r() * 512, 3, 3); }
  g.strokeStyle = "rgba(150,195,255,0.22)"; g.lineWidth = 1; for (let k = 0; k <= 512; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
  g.strokeStyle = "rgba(170,210,255,0.4)"; g.lineWidth = 2; for (let k = 0; k <= 512; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
});
/** a glowing line segment (a thin tube) from a to b */
const tube = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), 6, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()));
  const m = a.clone().add(b).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
};
const lineMat = (key: string, col: string, gain: number): THREE.MeshBasicMaterial => basic(key, () => ({ color: hdr(col, gain), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
/** the 12 edges of a box as glowing tubes */
const wireBox = (b: Batch, min: THREE.Vector3, max: THREE.Vector3, r: number, mat: THREE.Material) => {
  const xs = [min.x, max.x], ys = [min.y, max.y], zs = [min.z, max.z];
  for (const y of ys) for (const z of zs) b.add(tube(V(min.x, y, z), V(max.x, y, z), r), mat);
  for (const x of xs) for (const z of zs) b.add(tube(V(x, min.y, z), V(x, max.y, z), r), mat);
  for (const x of xs) for (const y of ys) b.add(tube(V(x, y, min.z), V(x, y, max.z), r), mat);
};

/** beam geometry (CLN-relative): rays start on rings at the top and run down to the detector at y = DET */
const TOP = 3.4, DET = -0.1, MIR = 1.5;
const RAYS = [0.22, 0.4, 0.6].flatMap((r) => [0, 1, 2, 3].map((k) => ({ r, a: (k / 4) * Math.PI * 2 + r * 3 })));
export type CleanSet = { arm: THREE.Group; arms2: THREE.Group[]; smear: THREE.Sprite; star: THREE.Sprite; redM: THREE.MeshBasicMaterial; cyanM: THREE.MeshBasicMaterial };
export const buildClean = (R: THREE.Object3D): CleanSet => {
  const root = new THREE.Group(); root.position.set(...CLN); R.add(root);
  // blueprint paper all round and underfoot
  const bp = basic("blueprintPaper", () => ({ map: rep(paper(), 10, 3), side: THREE.BackSide, fog: false }));
  const wrap = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 14, 48, 1, true), bp); wrap.position.y = 4; root.add(wrap);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 48).rotateX(-Math.PI / 2), basic("blueprintFloor", () => ({ map: rep(paper(), 6, 6), fog: false }))); floor.position.y = -0.6; root.add(floor);
  wrap.layers.set(NOINK); floor.layers.set(NOINK);
  // the box (wireframe with a faint fill) beside the beam, its fold-out arm hinges, the detector plate under the beam
  const white = lineMat("bpWhite", "#e8f2ff", 1.6), faint = basic("bpFill", () => ({ color: new THREE.Color("#7fb0ff"), transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  const lb = new Batch();
  wireBox(lb, V(0.75, -0.3, -0.45), V(1.65, 2.3, 0.45), 0.012, white);
  for (let y = 0.2; y < 2.2; y += 0.42) lb.add(tube(V(0.75, y, 0.45), V(1.65, y, 0.45), 0.006), white);   // panel lines
  wireBox(lb, V(-0.35, DET - 0.08, -0.35), V(0.35, DET, 0.35), 0.01, white);                              // the detector
  for (const [x, y] of [[0.75, MIR], [0.75, 1.0], [0.75, 0.55]]) lb.add(tube(V(x, y, -0.08), V(x, y, 0.08), 0.03), white);   // hinges
  lb.build(root);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.9), faint); fill.position.set(1.2, 1.0, 0); root.add(fill);
  root.traverse((o) => o.layers.set(NOINK));
  // the arm that matters: hinged at the box, swings a tiny mirror into the beam at y = MIR
  const arm = new THREE.Group(); arm.position.set(0.75, MIR, 0); root.add(arm);
  const ab = new Batch(); ab.add(tube(V(0, 0, 0), V(-0.75, 0, 0), 0.016), white); ab.build(arm);
  const mirrorDisc = new THREE.Mesh(new THREE.CircleGeometry(0.11, 32).rotateX(-Math.PI / 2), basic("bpMirror", () => ({ color: hdr("#bff4ff", 2.2), side: THREE.DoubleSide, fog: false })));
  mirrorDisc.position.set(-0.75, 0, 0); arm.add(mirrorDisc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 6, 32).rotateX(Math.PI / 2), white); ring.position.set(-0.75, 0, 0); arm.add(ring);
  // two more arms (decor: they fold out to the side holding their own tiny mirrors)
  const arms2 = [1.0, 0.55].map((y) => {
    const g = new THREE.Group(); g.position.set(0.75, y, 0); root.add(g);
    const b2 = new Batch(); b2.add(tube(V(0, 0, 0), V(-0.5, 0, 0), 0.012), white); b2.build(g);
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), basic("bpMirror2", () => ({ color: hdr("#bff4ff", 1.8), side: THREE.DoubleSide, fog: false }))); d.position.set(-0.5, 0, 0); d.rotation.y = Math.PI / 2; g.add(d);
    return g;
  });
  arm.traverse((o) => o.layers.set(NOINK)); arms2.forEach((g) => g.traverse((o) => o.layers.set(NOINK)));
  // the rays: flawed (red: each ring crosses the axis at its own height, a smear on the detector) and fixed (cyan: one point)
  const fb = new Batch(), xb = new Batch();
  const red = lineMat("bpRed", "#ff6a4a", 1.8), cyan = lineMat("bpCyan", "#7af6ff", 2.0);
  for (const { r, a } of RAYS) {
    const s = V(Math.cos(a) * r, TOP, Math.sin(a) * r);
    const yc = 0.05 + 1.0 * (r / 0.6) ** 2, k = (DET - TOP) / (yc - TOP);        // straight on through its own crossing point
    fb.add(tube(s, V(s.x * (1 - k), DET, s.z * (1 - k)), 0.007), red);
    const m = V(s.x * 0.5, MIR, s.z * 0.5);                                          // through the corrective mirror...
    xb.add(tube(s, m, 0.007), cyan); xb.add(tube(m, V(0, DET, 0), 0.007), cyan);    // ...onto one point
  }
  const flawed = new THREE.Mesh(); fb.build(flawed, false); const fixed = new THREE.Mesh(); xb.build(fixed, false);
  root.add(flawed, fixed); flawed.traverse((o) => o.layers.set(NOINK)); fixed.traverse((o) => o.layers.set(NOINK));
  const smear = glow("#ff6a4a", 1.3, 1.6); smear.position.set(0, DET + 0.02, 0); root.add(smear);
  const star = glow("#e8ffff", 0.5, 4.0); star.position.set(0, DET + 0.02, 0); star.visible = false; root.add(star);
  return { arm, arms2, smear, star, redM: red, cyanM: cyan };
};
