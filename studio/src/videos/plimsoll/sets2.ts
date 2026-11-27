// The dock (foggy morning / night rain / pink dawn / golden sunrise all happen here) and the open sea in a storm.
//  - dock at x ~ DX: cobbled quay top y = 0 along z < 0, water at y = DW for z > 0, the rotting ship moored alongside,
//    warehouses (BOGGS & SONS), the MARINE INSURANCE office, gas lamps, bollards, a crane, crates, masts in the fog
//  - storm at x ~ SX: a displaced wave sheet, the coffin ship going under, a stern lantern
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep, stoneHD, cobbleHD, facadeHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { ship, M, cyl, basic } from "./sets";
import { DX, DW, DSHIP, DESK, CRANE, SX } from "./story";

const signTex = (key: string, text: string, sub: string, bg: string, fg: string) => ctex(key, 1024, 256, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
  g.fillStyle = fg; g.textAlign = "center"; g.font = "bold 96px Georgia, serif"; g.fillText(text, 512, 132);
  g.font = "italic 48px Georgia, serif"; g.fillText(sub, 512, 205);
});
const dockWater = () => ctex("dockWater", 1024, 1024, (g, r) => {
  // grey-green harbour water: soft swell bands across, pale ripple dashes (reads in fog, dawn and sunrise alike)
  g.fillStyle = "#4f6d6a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(30,52,52,${0.18 + r() * 0.2})`; g.fillRect(r() * 1024, r() * 1024, 90 + r() * 200, 5 + r() * 7); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(220,235,228,${0.25 + r() * 0.35})`; g.fillRect(r() * 1024, r() * 1024, 20 + r() * 60, 3 + r() * 2); }
});
const stormWater = () => ctex("stormWater", 1024, 1024, (g, r) => {
  g.fillStyle = "#1d3346"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(10,22,34,${0.3 + r() * 0.3})`; g.fillRect(r() * 1024, r() * 1024, 140 + r() * 220, 10 + r() * 12); }
  g.strokeStyle = "rgba(225,240,245,0.85)"; g.lineCap = "round";
  for (let i = 0; i < 70; i++) { // foam streaks
    g.lineWidth = 3 + r() * 5; g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += 20 + r() * 40; y += (r() - 0.5) * 14; g.lineTo(x, y); } g.stroke();
  }
});
const mudTex = () => ctex("dockMud", 512, 512, (g, r) => {
  g.fillStyle = "#4a4a38"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "30,30,20" : "120,120,90"},${0.2 + r() * 0.3})`; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 6, 0, 7); g.fill(); }
});

export type Sets2 = {
  dockShip: THREE.Group; dockSails: THREE.Group; craneJib: THREE.Group; craneLoad: THREE.Object3D; deckCrates: THREE.Object3D[];
  dockWater: THREE.Mesh; dockWaterTex: THREE.Texture; dockUnder: THREE.Mesh; lamps: THREE.Mesh[];
  sea: THREE.Mesh; seaBase: Float32Array; seaTex: THREE.Texture; stormShip: THREE.Group; lantern: THREE.Mesh; markDock: THREE.Mesh;
};

export const buildSets2 = (R: THREE.Object3D): Sets2 => {
  const b = new Batch();
  // ======== the dock ========
  const cob = lam("dockCobble", () => ({ map: cobbleHD() }));
  const quayStone = lam("quayStone", () => ({ map: rep(stoneHD("quayStone", ["#8f8a80", "#9a948a", "#858078", "#a09a90"], "#5f5a52"), 1, 1) }));
  const coping = lam("coping", () => ({ color: "#b9b2a4" }));
  b.add(boxGeo(V(DX - 80, -0.6, -40), V(DX + 80, 0, 0), 4), cob);
  b.add(boxGeo(V(DX - 80, DW - 9, -1.2), V(DX + 80, -0.6, 0), 3), quayStone);
  b.add(boxGeo(V(DX - 80, -0.05, -0.7), V(DX + 80, 0.12, 0.05), 1), coping);
  b.add(boxGeo(V(DX - 120, DW - 9, 0), V(DX + 120, DW - 8.6, 70), 0), lam("dockMud", () => ({ map: rep(mudTex(), 30, 18) })));
  // warehouses along the back of the quay, the shipowners' sign over the big doors
  const fac = (key: string, w: number, h: number, si: number) => lam(key, () => ({ map: facadeHD(key, w, h, { wall: ["#b88a5e", "#9e6b50", "#c49a6c"][si % 3], shutter: "#2f4f3a", door: true, brick: si % 2 === 0 }) }));
  [[-38, 16, 11, 0], [-20, 20, 13, 1], [2, 18, 12, 2], [22, 16, 10, 3], [40, 18, 12, 4], [-56, 18, 11, 5]].forEach(([x0, w, h, si]) => {
    b.add(boxGeo(V(DX + x0, 0, -26), V(DX + x0 + w, h, -14), 0), fac(`ware${si}`, w, h, si));
    b.add(new THREE.ConeGeometry(Math.hypot(w, 12) / 2, 4, 4).scale(1, 1, 12 / w), lam("wareRoof", () => ({ color: "#4a4652" })), M(DX + x0 + w / 2, h + 2, -20, Math.PI / 4));
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), basic("signBoggs", () => ({ map: signTex("signBoggs", "BOGGS & SONS", "~ Shipowners ~", "#1f3b2c", "#e2c26a") })));
  sign.position.set(DX - 11, 8.2, -13.9); R.add(sign);
  // the insurance office: a narrow bow-fronted shop with its own sign, the clerk's desk outside under an awning
  b.add(boxGeo(V(DESK[0] - 2.6, 0, -9), V(DESK[0] + 2.6, 6.5, -4.5), 0), lam("officeFront", () => ({ map: facadeHD("officeFront", 5.2, 6.5, { wall: "#e3d2b8", shutter: "#7a1f2b", door: true }) })));
  b.add(boxGeo(V(DESK[0] - 2.8, 6.5, -9.2), V(DESK[0] + 2.8, 6.9, -4.3), 0), lam("officeCornice", () => ({ color: "#3d3346" })));
  const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), basic("signIns", () => ({ map: signTex("signIns", "MARINE INSURANCE", "Lloyd's Agents", "#7a1f2b", "#f2e6c8") })));
  sign2.position.set(DESK[0], 4.9, -4.48); R.add(sign2);
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.2), lam("awning", () => ({ map: ctex("awningStripes", 256, 64, (g) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? "#f2e6c8" : "#7a1f2b"; g.fillRect(k * 32, 0, 32, 64); } }), side: THREE.DoubleSide })));
  awn.position.set(DESK[0], 3.3, -3.5); awn.rotation.x = -1.0; R.add(awn);
  // the clerk's desk: a crate with a ledger, an inkpot and a quill
  const crateM = lam("crateCoal", () => ({}));
  b.add(new THREE.BoxGeometry(1.3, 0.85, 0.8), lam("deskCrate", () => ({ color: "#8a5a32" })), M(DESK[0], 0.425, DESK[2]));
  b.add(new THREE.BoxGeometry(0.5, 0.04, 0.36), lam("ledger", () => ({ color: "#6b2a24" })), M(DESK[0] - 0.3, 0.87, DESK[2], 0.2));
  b.add(cyl(0.06, 0.07, 0.1, 10), lam("inkpot", () => ({ color: "#1d1d24" })), M(DESK[0] + 0.4, 0.9, DESK[2] - 0.1));
  void crateM;
  // gas lamps, bollards, crates, barrels, rope coils along the quay
  const iron = lam("dockIron", () => ({ color: "#26282e" }));
  const lamps: THREE.Mesh[] = [];
  for (let k = -5; k <= 5; k++) {
    const x = DX + k * 9 + 1.5;
    b.add(cyl(0.07, 0.11, 3.8, 10), iron, M(x, 1.9, -1.4));
    b.add(boxGeo(V(x - 0.22, 3.8, -1.62), V(x + 0.22, 4.35, -1.18)), iron);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), basic("lampGlow", () => ({ color: new THREE.Color(2.2, 1.6, 0.8) })));
    glass.position.set(x, 4.05, -1.4); glass.layers.set(NOINK); R.add(glass); lamps.push(glass);
    b.add(cyl(0.14, 0.2, 0.55, 12), iron, M(x + 4.5, 0.27, -0.35));
    b.add(new THREE.SphereGeometry(0.17, 12, 8), iron, M(x + 4.5, 0.6, -0.35));
  }
  const crates = [lam("crateCoal", () => ({})), lam("crateTea", () => ({})), lam("crateIron", () => ({}))];
  [[-9, -4], [-8, -5.2], [-12, -3.2], [6, -6], [7.1, -6.2], [12, -3.5], [-16, -6], [16, -5]].forEach(([x, z], k) => {
    const sz = 0.9 + (k % 3) * 0.15;
    b.add(new THREE.BoxGeometry(sz, sz * 0.85, sz), crates[k % 3], M(DX + x, sz * 0.42, z, k * 0.4));
    if (k % 2 === 0) b.add(new THREE.BoxGeometry(sz * 0.9, sz * 0.8, sz * 0.9), crates[(k + 1) % 3], M(DX + x + 0.1, sz * 0.85 + sz * 0.4, z, k * 0.7));
  });
  const barrelM = lam("barrel", () => ({}));
  [[-6, -7], [-5.2, -7.4], [9, -2.6], [9.7, -3.1], [-14, -2.4]].forEach(([x, z]) => b.add(cyl(0.42, 0.36, 1.05, 14), barrelM, M(DX + x, 0.52, z)));
  for (const [x, z] of [[-3, -0.9], [14, -0.9]]) b.add(new THREE.TorusGeometry(0.4, 0.09, 8, 20).rotateX(Math.PI / 2), lam("ropeCoil", () => ({ color: "#a8875a" })), M(DX + x, 0.1, z));
  // the dockside crane: post, jib, and a load that swings over the ship (dynamic)
  const wood = lam("craneWood", () => ({ color: "#6b4a30" }));
  b.add(cyl(0.25, 0.32, 7.5, 12), wood, M(CRANE[0], 3.75, CRANE[2]));
  const craneJib = new THREE.Group(); craneJib.position.set(CRANE[0], 6.6, CRANE[2]); R.add(craneJib);
  const jibB = new Batch();
  jibB.add(cyl(0.16, 0.12, 9).rotateZ(Math.PI / 2 - 0.35), wood, M(3.9, 1.5, 0));
  jibB.add(cyl(0.03, 0.03, 3.2, 6), lam("rope", () => ({})), M(8.1, 1.2, 0));
  jibB.build(craneJib);
  const craneLoad = new THREE.Group(); craneLoad.position.set(8.1, -0.6, 0); craneJib.add(craneLoad);
  const loadB = new Batch(); loadB.add(new THREE.BoxGeometry(1.1, 0.95, 1.1), crates[1], M(0, -0.5, 0)); loadB.add(new THREE.TorusGeometry(0.16, 0.035, 6, 14), iron, M(0, 0.15, 0)); loadB.build(craneLoad);
  // other ships moored further along, their masts fading into the fog
  [[30, 3.5, 0.0, 0], [55, 3.5, 0.02, 1], [-34, 3.5, 3.1, 2], [10, 26, 0.5, 3], [-50, 30, -0.4, 4], [70, 34, 0.3, 5]].forEach(([x, z, ry, k]) => {
    const s2 = ship(14 + (k % 3) * 2, 4.2, 3, false, { masts: 2 + (k % 2), crates: 3, seed: 30 + k, sails: "furled" });
    s2.position.set(DX + x, DW + 1.4, z); s2.rotation.y = ry; R.add(s2);
  });
  b.build(R);
  // the rotting ship alongside the quay: its cargo arrives crate by crate, and it sinks lower each time
  const dockShip = ship(15, 4.2, 3.0, true, { masts: 2, crates: 0, seed: 21, sails: "furled" });
  dockShip.position.set(DSHIP[0], DW + 1.6, DSHIP[2]); R.add(dockShip);
  const dockSails = ship(15, 4.2, 3.0, true, { masts: 2, crates: 0, seed: 21, sails: "set" }); // the same ship under sail (it leaves)
  dockSails.visible = false; R.add(dockSails);
  const deckCrates: THREE.Object3D[] = [];
  for (let k = 0; k < 14; k++) {
    const g = new THREE.Group(), cb = new Batch(), sz = 0.85 + (k % 3) * 0.12, lay = Math.floor(k / 5);
    cb.add(new THREE.BoxGeometry(sz, sz * 0.85, sz), crates[k % 3], M(0, sz * 0.42, 0, k * 0.37)); cb.build(g);
    g.position.set(-4 + (k % 5) * 2.0, 0.05 + lay * 0.82, ((k * 7) % 3 - 1) * 1.1); g.visible = false; dockShip.add(g); deckCrates.push(g);
  }
  // the Plimsoll mark on the hull (painted at dawn): a white disc with a line through it, hidden until then
  const markTex = ctex("plimsollMark", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256); g.strokeStyle = "#ffffff"; g.lineWidth = 22; g.beginPath(); g.arc(128, 128, 84, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#ffffff"; g.fillRect(4, 116, 248, 24); g.fillStyle = "#ffffff"; g.font = "bold 46px Georgia, serif"; g.textAlign = "center"; g.fillText("L", 64, 100); g.fillText("R", 192, 100);
  });
  const markDock = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: markTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false }));
  markDock.position.set(0.6, -0.95, -2.12); markDock.rotation.y = Math.PI; markDock.visible = false; markDock.layers.set(NOINK); dockShip.add(markDock);
  // harbour water + its underside
  const dockWaterTex = rep(dockWater(), 14, 6);
  const dw = new THREE.Mesh(new THREE.PlaneGeometry(300, 140).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: dockWaterTex }));
  dw.position.set(DX, DW, 70); R.add(dw);
  const du = new THREE.Mesh(new THREE.PlaneGeometry(300, 140).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#7fb3a0", side: THREE.BackSide, transparent: true, opacity: 0.9 }));
  du.position.set(DX, DW - 0.02, 70); du.layers.set(NOINK); R.add(du);
  // ======== the storm at sea ========
  const seaTex = rep(stormWater(), 6, 6);
  const sg = new THREE.PlaneGeometry(260, 260, 130, 130); sg.rotateX(-Math.PI / 2);
  const seaBase = Float32Array.from(sg.attributes.position.array as Float32Array);
  const sea = new THREE.Mesh(sg, lam("stormSea", () => ({ map: seaTex })));
  sea.position.set(SX, 0, 0); sea.receiveShadow = false; R.add(sea);
  const stormShip = ship(15, 4.2, 3.0, true, { masts: 2, crates: 22, seed: 5, sails: "torn" });
  stormShip.position.set(SX, 0.2, 0); R.add(stormShip);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), basic("lanternGlow", () => ({ color: new THREE.Color(3.2, 2.2, 0.9) })));
  lantern.position.set(-7.2, 2.0, 0); lantern.layers.set(NOINK); stormShip.add(lantern);
  return { dockShip, dockSails, craneJib, craneLoad, deckCrates, dockWater: dw, dockWaterTex, dockUnder: du, lamps, sea, seaBase, seaTex, stormShip, lantern, markDock };
};

/** storm swell: a pure function of the time (used for the sheet and to float the ship) */
export const swell = (x: number, z: number, t: number) =>
  1.6 * Math.sin(0.11 * x + 1.3 * t) + 1.1 * Math.sin(0.17 * z - 1.7 * t + 0.6) + 0.55 * Math.sin(0.31 * (x + z) + 2.3 * t) + 0.25 * Math.sin(0.7 * x - 3.1 * t);
