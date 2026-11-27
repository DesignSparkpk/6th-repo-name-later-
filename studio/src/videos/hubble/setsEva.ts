// The repair, December 1993, around Hubble: the shuttle's robot arm reaching up from below with a foot restraint at its
// end, the corrective-optics box (a phone booth in size) that the astronauts carry and slide into the open bay, and the
// wrench that slips out of a glove.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { cyl } from "./kit";
import { HUB } from "./story";

const seg = (b: Batch, a: THREE.Vector3, c: THREE.Vector3, r: number, m: THREE.Material) => {
  const g = cyl(r, r, a.distanceTo(c), 20); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()));
  const mid = a.clone().add(c).multiplyScalar(0.5); g.translate(mid.x, mid.y, mid.z); b.add(g, m);
};
/** where things are, relative to HUB */
export const EVA = {
  shoulder: V(3, -17, 10), elbow: V(-2.5, -7, 10.5), wrist: V(-1.1, -1.4, 5.8), plate: V(-1.1, -1.05, 5.3),
  boxOut: V(-1.7, 0.1, 4.0), boxIn: V(-1.7, 0.1, 1.15),        // the box beside the open bay, and slid home
  glove: V(-4.35, 2.25, 2.95),                                    // the second astronaut's glove on the aft shroud, holding the wrench
};
export type EvaSet = { box: THREE.Group; wrench: THREE.Group };
export const buildEva = (R: THREE.Object3D): EvaSet => {
  const root = new THREE.Group(); root.position.set(...HUB); R.add(root);
  const b = new Batch(), white = lam("rmsWhite", () => ({ color: "#ecebe6" })), joint = lam("rmsJoint", () => ({ color: "#3a3c44" })), gold = lam("rmsGold", () => ({ color: "#c9a248" }));
  const { shoulder, elbow, wrist, plate } = EVA;
  seg(b, shoulder, elbow, 0.19, white); seg(b, elbow, wrist, 0.17, white);
  for (const p of [elbow, wrist]) b.add(new THREE.SphereGeometry(0.28, 16, 10).translate(p.x, p.y, p.z), joint);
  seg(b, wrist, plate, 0.14, joint);
  b.add(boxGeo(V(plate.x - 0.45, plate.y - 0.06, plate.z - 0.35), V(plate.x + 0.45, plate.y + 0.04, plate.z + 0.35), 0), gold);   // foot restraint
  for (const s of [-1, 1]) b.add(boxGeo(V(plate.x + s * 0.18 - 0.08, plate.y + 0.04, plate.z - 0.12), V(plate.x + s * 0.18 + 0.08, plate.y + 0.14, plate.z + 0.12), 0), joint);
  b.build(root);
  // the box: silver foil body, handrails, a grapple fixture, a stripe of gold
  const box = new THREE.Group(); box.position.copy(EVA.boxOut); root.add(box);
  const bb = new Batch(), foil = lam("costarFoil", () => ({ color: "#d9dde4" })), rail = lam("costarRail", () => ({ color: "#e8c445" }));
  bb.add(boxGeo(V(-0.45, -0.45, -1.1), V(0.45, 0.45, 1.1), 0), foil);
  bb.add(boxGeo(V(-0.46, -0.46, 0.5), V(0.46, 0.46, 0.62), 0), gold);
  for (const s of [-1, 1]) bb.add(boxGeo(V(s * 0.5 - 0.02, -0.3, -0.8), V(s * 0.5 + 0.02, -0.26, 0.8), 0), rail);
  bb.add(cyl(0.09, 0.09, 0.22, 12).translate(0, 0.55, 0), joint);
  bb.build(box);
  // the wrench (about 30 cm)
  const wrench = new THREE.Group(); wrench.position.copy(EVA.glove); wrench.scale.setScalar(2.2); root.add(wrench);
  const wb = new Batch(), steel = lam("wrenchSteel", () => ({ color: "#a9b0ba" }));
  wb.add(boxGeo(V(-0.16, -0.016, -0.008), V(0.12, 0.016, 0.008), 0), steel);
  wb.add(new THREE.TorusGeometry(0.035, 0.012, 6, 16, Math.PI * 1.4).rotateZ(0.8).translate(0.15, 0, 0), steel);
  wb.add(new THREE.TorusGeometry(0.03, 0.011, 6, 16).translate(-0.18, 0, 0), steel);
  wb.build(wrench);
  return { box, wrench };
};
