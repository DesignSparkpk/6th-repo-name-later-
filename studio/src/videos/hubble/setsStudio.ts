// Two rooms where people made fun of the telescope:
//  - STU: a late-night TV studio (a generic show, "TONITE!"): glossy floor, a glowing night-skyline backdrop, the host's
//    desk with a neon front, a guest couch, a lighting truss, an ON AIR sign and a studio camera in the foreground.
//  - SEN: a Senate hearing room: wood panelling, a raised curved dais with gooseneck microphones and nameplates, flags,
//    a gold plaque, and an easel with a cartoon "techno-turkey" (a turkey whose body is a telescope).
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { cyl, hdr, glow, basic } from "./kit";
import { STU, SEN } from "./story";

// ---------------- textures ----------------
const skyline = () => ctex("tvSkyline", 2048, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#1a1240"); gr.addColorStop(0.55, "#3a2a7a"); gr.addColorStop(0.85, "#c05a8a"); gr.addColorStop(1, "#f08a6a");
  g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
  g.fillStyle = "#fff4d8"; g.beginPath(); g.arc(1640, 210, 70, 0, 7); g.fill();
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.7})`; g.fillRect(r() * 2048, r() * 450, 2, 2); }
  for (let layer = 0; layer < 2; layer++) {
    let x = -20;
    while (x < 2048) {
      const w = 60 + r() * 120, h = (layer ? 260 : 380) + r() * (layer ? 220 : 380), y = 1024 - h;
      g.fillStyle = layer ? "#1e1638" : "#130e26"; g.fillRect(x, y, w, h);
      if (r() < 0.3) { g.fillRect(x + w * 0.4, y - 60, w * 0.2, 60); }
      for (let wy = y + 14; wy < 1010; wy += 22) for (let wx = x + 8; wx < x + w - 10; wx += 16) if (r() < (layer ? 0.25 : 0.4)) { g.fillStyle = r() < 0.8 ? "#ffd98a" : "#9fd0ff"; g.fillRect(wx, wy, 7, 10); }
      x += w + 4 + r() * 10;
    }
  }
});
const neonFront = () => ctex("tvDeskFront", 1024, 384, (g) => {
  g.fillStyle = "#1b2a6a"; g.fillRect(0, 0, 1024, 384);
  for (let x = 0; x < 1024; x += 64) { g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x, 0, 30, 384); }
  g.font = "italic bold 170px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = "#ff5ab4"; g.shadowBlur = 40; g.fillStyle = "#ffd0ec"; g.fillText("TONITE!", 512, 200); g.shadowBlur = 0;
});
const woodPanel = () => ctex("senWood", 512, 512, (g, r) => {
  g.fillStyle = "#6a3f24"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${60 + r() * 50},${30 + r() * 25},${14 + r() * 12},${0.25 + r() * 0.3})`; g.lineWidth = 1 + r() * 3; const x = r() * 512; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 30, 170, x + (r() - 0.5) * 30, 340, x + (r() - 0.5) * 20, 512); g.stroke(); }
  g.strokeStyle = "rgba(30,14,6,0.7)"; g.lineWidth = 6; g.strokeRect(24, 24, 464, 464);
  g.strokeStyle = "rgba(255,210,160,0.18)"; g.lineWidth = 3; g.strokeRect(34, 34, 444, 444);
});
const senCarpet = () => ctex("senCarpet", 256, 256, (g, r) => {
  g.fillStyle = "#2c3a6a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(20,30,70,${r() * 0.2})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  g.fillStyle = "rgba(220,180,90,0.35)"; for (let x = 32; x < 256; x += 64) for (let y = 32; y < 256; y += 64) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 5 : 12; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
});
const plaque = () => ctex("senPlaque", 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  const gr = g.createRadialGradient(220, 200, 20, 256, 256, 250); gr.addColorStop(0, "#f6dc8a"); gr.addColorStop(1, "#9a7a2a");
  g.fillStyle = gr; g.beginPath(); g.arc(256, 256, 246, 0, 7); g.fill();
  g.fillStyle = "#2c3a6a"; g.beginPath(); g.arc(256, 256, 190, 0, 7); g.fill();
  g.fillStyle = "#f6dc8a"; for (let k = 0; k < 13; k++) { const a = (k / 13) * Math.PI * 2; const x = 256 + Math.cos(a) * 150, y = 256 + Math.sin(a) * 150; g.beginPath(); for (let j = 0; j < 10; j++) { const b = (j / 10) * Math.PI * 2 - Math.PI / 2, rr = j % 2 ? 7 : 17; g.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr); } g.fill(); }
  g.fillStyle = "#f6dc8a"; g.beginPath(); for (let j = 0; j < 10; j++) { const b = (j / 10) * Math.PI * 2 - Math.PI / 2, rr = j % 2 ? 36 : 90; g.lineTo(256 + Math.cos(b) * rr, 256 + Math.sin(b) * rr); } g.fill();
});
const nameplate = (t: string) => ctex("plate" + t, 512, 128, (g) => {
  g.fillStyle = "#1c1814"; g.fillRect(0, 0, 512, 128); g.strokeStyle = "#c9a248"; g.lineWidth = 6; g.strokeRect(6, 6, 500, 116);
  g.fillStyle = "#f2ead6"; g.font = "bold 64px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 256, 68);
});
/** the chart on the easel: a cartoon turkey whose body is a telescope tube, one bleary eye, a question mark */
export const turkeyChart = () => ctex("turkeyChart", 768, 1024, (g) => {
  g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, 768, 1024);
  g.strokeStyle = "#26222a"; g.lineWidth = 10; g.strokeRect(14, 14, 740, 996);
  g.fillStyle = "#26222a"; g.font = "bold 92px Georgia, serif"; g.textAlign = "center"; g.fillText("HUBBLE", 384, 140);
  const ink = (w: number) => { g.strokeStyle = "#26222a"; g.lineWidth = w; g.lineJoin = "round"; g.lineCap = "round"; };
  // tail fan
  const fan = ["#c0533a", "#e6a33a", "#7a4a2a", "#d8743a", "#e6a33a", "#c0533a", "#7a4a2a"];
  fan.forEach((c, k) => { const a = -2.6 + k * 0.42; g.fillStyle = c; g.beginPath(); g.moveTo(330, 560); g.lineTo(330 + Math.cos(a - 0.2) * 290, 560 + Math.sin(a - 0.2) * 290); g.lineTo(330 + Math.cos(a + 0.2) * 290, 560 + Math.sin(a + 0.2) * 290); g.closePath(); g.fill(); ink(6); g.stroke(); });
  // telescope body (silver tube) with an open aperture
  g.save(); g.translate(400, 600); g.rotate(-0.25);
  g.fillStyle = "#dfe4ec"; g.fillRect(-190, -95, 330, 190); ink(8); g.strokeRect(-190, -95, 330, 190);
  g.fillStyle = "#c9ced8"; g.beginPath(); g.ellipse(140, 0, 34, 95, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = "#1a1c24"; g.beginPath(); g.ellipse(140, 0, 22, 74, 0, 0, 7); g.fill();
  g.fillStyle = "#e8c445"; g.fillRect(-130, -95, 14, 190); g.fillRect(-40, -95, 14, 190);
  g.restore();
  // head and neck, wattle, one bleary spiral eye
  g.fillStyle = "#b8743a"; g.beginPath(); g.moveTo(520, 520); g.quadraticCurveTo(600, 420, 590, 330); g.lineTo(640, 330); g.quadraticCurveTo(650, 450, 560, 560); g.closePath(); g.fill(); ink(7); g.stroke();
  g.fillStyle = "#c9a26a"; g.beginPath(); g.arc(615, 300, 58, 0, 7); g.fill(); ink(7); g.stroke();
  g.fillStyle = "#e8b03a"; g.beginPath(); g.moveTo(668, 300); g.lineTo(720, 316); g.lineTo(668, 330); g.closePath(); g.fill(); ink(5); g.stroke();
  g.fillStyle = "#d8352a"; g.beginPath(); g.ellipse(668, 360, 14, 34, 0.2, 0, 7); g.fill(); ink(5); g.stroke();
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(620, 290, 22, 0, 7); g.fill(); ink(4); g.stroke();
  ink(3); g.beginPath(); for (let t = 0; t < 14; t += 0.3) { const rr = t * 1.4; g.lineTo(620 + Math.cos(t) * rr, 290 + Math.sin(t) * rr); } g.stroke();
  // legs
  ink(9); g.beginPath(); g.moveTo(360, 690); g.lineTo(340, 820); g.lineTo(300, 840); g.moveTo(340, 820); g.lineTo(360, 845); g.moveTo(450, 680); g.lineTo(470, 820); g.lineTo(430, 840); g.moveTo(470, 820); g.lineTo(495, 845); g.stroke();
  g.fillStyle = "#c0533a"; g.font = "bold 150px Georgia, serif"; g.fillText("?", 140, 900);
});

// ---------------- the TV studio ----------------
export type StudioSet = { onAir: THREE.Mesh };
export const buildStudio = (R: THREE.Object3D): StudioSet => {
  const root = new THREE.Group(); root.position.set(...STU); R.add(root);
  const b = new Batch();
  b.add(new THREE.PlaneGeometry(26, 20).rotateX(-Math.PI / 2).translate(0, 0, 0), lam("tvFloor", () => ({ color: "#2a2040" })));
  b.add(boxGeo(V(-8, 0, -5.4), V(8, 0.45, 1.2), 0), lam("tvStage", () => ({ color: "#3a2c58" })));                        // the raised stage
  b.add(boxGeo(V(-8, 0.38, 1.14), V(8, 0.5, 1.24), 0), lam("tvStageEdge", () => ({ color: "#c9a248" })));
  // host desk: wood top, neon front (unlit panel)
  b.add(boxGeo(V(-2.6, 0.45, -2.9), V(-0.2, 1.42, -2.0), 0), lam("tvDeskBody", () => ({ color: "#2a3a7a" })));
  b.add(boxGeo(V(-2.7, 1.42, -3.0), V(-0.1, 1.5, -1.9), 0), lam("tvDeskTop", () => ({ color: "#8a5a34" })));
  b.add(boxGeo(V(-2.1, 0.45, -3.9), V(-1.4, 1.1, -3.3), 0), lam("tvChair", () => ({ color: "#5a2030" })));
  b.add(cyl(0.05, 0.06, 0.12, 12).translate(-0.8, 1.56, -2.4), lam("tvMug", () => ({ color: "#e8e4dc" })));
  // guest couch
  const couch = lam("tvCouch", () => ({ color: "#7a2a3a" }));
  b.add(boxGeo(V(0.8, 0.45, -3.6), V(3.6, 0.95, -2.7), 0), couch); b.add(boxGeo(V(0.8, 0.95, -3.6), V(3.6, 1.6, -3.3), 0), couch);
  for (const x of [0.8, 3.4]) b.add(boxGeo(V(x, 0.95, -3.6), V(x + 0.2, 1.25, -2.7), 0), couch);
  // a potted plant and a lamp
  b.add(cyl(0.22, 0.17, 0.5, 14).translate(4.4, 0.7, -3.6), lam("tvPot", () => ({ color: "#c9a248" })));
  for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; b.add(new THREE.ConeGeometry(0.12, 1.1, 6).rotateZ(0.5 * Math.cos(a)).rotateX(0.5 * Math.sin(a)).translate(4.4 + Math.cos(a) * 0.2, 1.45, -3.6 + Math.sin(a) * 0.2), lam("tvLeaf", () => ({ color: "#2f7a4a" }))); }
  // lighting truss and the studio camera in the foreground
  b.add(boxGeo(V(-9, 6.2, -1.2), V(9, 6.5, -0.9), 0), lam("truss", () => ({ color: "#1a1a20" })));
  const tvcam = lam("tvCam", () => ({ color: "#26262c" }));
  b.add(boxGeo(V(-3.9, 1.4, 3.0), V(-3.1, 1.95, 4.1), 0), tvcam); b.add(cyl(0.2, 0.24, 0.5, 14).rotateX(Math.PI / 2).translate(-3.5, 1.68, 2.8), tvcam);
  b.add(cyl(0.08, 0.1, 1.4, 8).translate(-3.5, 0.7, 3.6), tvcam); b.add(cyl(0.5, 0.5, 0.12, 14).translate(-3.5, 0.06, 3.6), tvcam);
  b.build(root);
  // the backdrop (unlit, glowing), the desk's neon front, the ON AIR sign, the truss lamps
  const back = new THREE.Mesh(new THREE.PlaneGeometry(17, 8.5), basic("tvBackdrop", () => ({ map: skyline(), color: hdr("#ffffff", 1.05) })));
  back.position.set(0, 4.7, -5.5); back.layers.set(NOINK); root.add(back);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), basic("tvNeon", () => ({ map: neonFront(), color: hdr("#ffffff", 1.4) })));
  front.position.set(-1.4, 0.96, -1.99); root.add(front);
  const onAir = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), basic("onAir", () => ({ map: ctex("onAirTex", 256, 80, (g) => { g.fillStyle = "#300808"; g.fillRect(0, 0, 256, 80); g.fillStyle = "#ff3a3a"; g.font = "bold 52px sans-serif"; g.textAlign = "center"; g.fillText("ON AIR", 128, 58); }), color: hdr("#ffffff", 2.0) })));
  onAir.position.set(5.2, 5.4, -5.4); onAir.layers.set(NOINK); root.add(onAir);
  for (let k = 0; k < 7; k++) { const gl = glow(k % 2 ? "#ffd0a0" : "#ffb0e0", 1.6, 2.4); gl.position.set(-7.5 + k * 2.5, 6.05, -1.05); root.add(gl); }
  const spot = glow("#fff0d8", 7, 0.25); spot.position.set(-1.4, 2.2, -2.2); root.add(spot);
  return { onAir };
};

// ---------------- the Senate hearing room ----------------
export type SenateSet = { flash: THREE.Sprite[] };
export const buildSenate = (R: THREE.Object3D): SenateSet => {
  const root = new THREE.Group(); root.position.set(...SEN); R.add(root);
  const b = new Batch(), wood = lam("senWood", () => ({ map: rep(woodPanel(), 1, 1) })), dark = lam("senDarkWood", () => ({ color: "#4a2a18" }));
  b.add(new THREE.PlaneGeometry(24, 18).rotateX(-Math.PI / 2), lam("senCarpet", () => ({ map: rep(senCarpet(), 8, 6) })));
  b.add(new THREE.PlaneGeometry(24, 7).translate(0, 3.5, -6), wood);                                                    // back wall
  b.add(new THREE.PlaneGeometry(18, 7).rotateY(Math.PI / 2).translate(-9, 3.5, 3), wood);
  b.add(new THREE.PlaneGeometry(18, 7).rotateY(-Math.PI / 2).translate(9, 3.5, 3), wood);
  b.add(boxGeo(V(-12, 6.6, -6), V(12, 7, 12), 0), lam("senCeil", () => ({ color: "#efe6d6" })));
  // the dais: a raised platform, a curved front (segments of an arc), a bench top
  b.add(boxGeo(V(-7, 0, -5.8), V(7, 0.6, -2.6), 0), dark);
  const N = 9;
  for (let k = 0; k < N; k++) {
    const a0 = -0.42 + (0.84 * k) / N, a1 = -0.42 + (0.84 * (k + 1)) / N, Rr = 9.5, cz = -11.6;
    const p0 = V(Math.sin(a0) * Rr, 0, cz + Math.cos(a0) * Rr), p1 = V(Math.sin(a1) * Rr, 0, cz + Math.cos(a1) * Rr);
    const seg = new THREE.PlaneGeometry(p0.distanceTo(p1) + 0.02, 1.45); const ang = Math.atan2(p1.x - p0.x, p1.z - p0.z) - Math.PI / 2;
    seg.rotateY(ang); seg.translate((p0.x + p1.x) / 2, 0.725, (p0.z + p1.z) / 2); b.add(seg, wood);
    b.add(boxGeo(V(-0.1, 0, -0.35), V(0.1, 0.07, 0.35), 0).scale((p0.distanceTo(p1) + 0.04) / 0.2, 1, 1).rotateY(ang).translate((p0.x + p1.x) / 2, 1.45, (p0.z + p1.z) / 2 - 0.3), dark);
  }
  // gooseneck microphones and nameplates along the bench
  const metal = lam("senMic", () => ({ color: "#2a2a2e" }));
  for (const x of [-4, 0, 4]) {
    const z = -11.6 + Math.sqrt(9.5 * 9.5 - x * x) - 0.45;
    b.add(cyl(0.012, 0.012, 0.42, 6).rotateX(0.55).translate(x + 0.22, 1.66, z - 0.15), metal); b.add(cyl(0.03, 0.022, 0.09, 10).rotateX(1.2).translate(x + 0.22, 1.84, z - 0.3), metal);
  }
  b.build(root);
  for (const [x, t] of [[-4, "SENATOR"], [0, "SENATOR"], [4, "SENATOR"]] as const) {
    const z = -11.6 + Math.sqrt(9.5 * 9.5 - x * x) + 0.02;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), basic("plate" + t, () => ({ map: nameplate(t), color: hdr("#ffffff", 0.9) }))); pl.position.set(x, 1.36, z + 0.01); pl.rotation.y = -Math.asin(x / 9.5); root.add(pl);
  }
  const pq = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), basic("senPlaque", () => ({ map: plaque(), transparent: true }))); pq.position.set(0, 4.3, -5.95); root.add(pq);
  // flags on poles either side of the dais
  for (const x of [-5.6, 5.6]) {
    const pole = new THREE.Mesh(cyl(0.035, 0.035, 3.4, 8), lam("senPole", () => ({ color: "#c9a248" }))); pole.position.set(x, 2.3, -4.9); root.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2, 1, 10), lam("senFlag", () => ({ map: ctex("senFlagTex", 200, 320, (g) => { for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f2ee" : "#b8323a"; g.fillRect(0, (i * 320) / 13, 200, 320 / 13 + 1); } g.fillStyle = "#2c3a70"; g.fillRect(0, 0, 90, 170); }), side: THREE.DoubleSide })));
    const fp = fl.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < fp.count; i++) fp.setZ(i, Math.sin(fp.getY(i) * 3) * 0.08);
    fl.geometry.computeVertexNormals(); fl.position.set(x + 0.05, 2.6, -4.85); root.add(fl);
  }
  // the easel with the techno-turkey chart
  const easel = new Batch(), ew = lam("easelWood", () => ({ color: "#8a5a34" }));
  easel.add(cyl(0.03, 0.03, 2.4, 6).rotateZ(0.12).translate(-0.45, 1.15, 0), ew); easel.add(cyl(0.03, 0.03, 2.4, 6).rotateZ(-0.12).translate(0.45, 1.15, 0), ew);
  easel.add(cyl(0.03, 0.03, 2.3, 6).rotateX(-0.35).translate(0, 1.1, -0.4), ew); easel.add(boxGeo(V(-0.6, 0.62, -0.02), V(0.6, 0.68, 0.12), 0), ew);
  const eg = new THREE.Group(); eg.position.set(-1.25, 0, -1.0); eg.rotation.y = 0.12; root.add(eg); easel.build(eg);
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.55), lam("turkeyChart", () => ({ map: turkeyChart() }))); chart.position.set(0, 1.48, 0.13); chart.rotation.x = -0.06; eg.add(chart);
  // press flashes (popped per frame by world.ts)
  const flash = [0, 1, 2].map((k) => { const s = glow("#ffffff", 2.2, 5); s.position.set(-2 + k * 2.2, 1.7 + (k % 2) * 0.3, 5.5 - k * 0.6); s.visible = false; root.add(s); return s; });
  return { flash };
};
