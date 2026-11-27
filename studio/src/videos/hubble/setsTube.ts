// Inside the telescope at TUB: the black tube with its baffle rings, the secondary mirror on its four spider vanes, a
// shaft of starlight down the axis, and the 2.4 m primary mirror at the far end (a painted, unlit reflection so it always
// reads as a mirror) with a red zone at its rim where it was polished too flat. Next door, the macro set MAC: the same
// mirror's edge seen at hair scale - a silver surface, one human hair lying across it, the hair's cut end showing its
// cross-section in 50 strips, and the polishing error as a thin red step along the rim, 1/50 of the hair's width.
import * as THREE from "three";
import { Batch, V, lam } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { cyl, hdr, glow, shaft, basic } from "./kit";
import { TUB, MAC, HAIR_R } from "./story";

const mirrorFace = () => ctex("primaryMirror", 1024, 1024, (g) => {
  // a concave mirror looking back up the tube: deep blue-silver, the bright ring of the tube's open end reflected,
  // the secondary's dark silhouette and spider in the middle, a soft sheen
  const c = 512;
  const gr = g.createRadialGradient(c, c, 60, c, c, 512); gr.addColorStop(0, "#c8d6ec"); gr.addColorStop(0.45, "#8ea4c8"); gr.addColorStop(0.8, "#5d7398"); gr.addColorStop(1, "#33476a");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  const ring = g.createRadialGradient(c, c, 250, c, c, 420); ring.addColorStop(0, "rgba(255,255,255,0)"); ring.addColorStop(0.5, "rgba(240,248,255,0.7)"); ring.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = ring; g.beginPath(); g.arc(c, c, 420, 0, 7); g.fill();
  g.fillStyle = "#0b0f18"; g.beginPath(); g.arc(c, c, 120, 0, 7); g.fill();
  g.strokeStyle = "#0b0f18"; g.lineWidth = 14; g.beginPath(); g.moveTo(c - 470, c); g.lineTo(c + 470, c); g.moveTo(c, c - 470); g.lineTo(c, c + 470); g.stroke();
  const sh = g.createLinearGradient(200, 150, 820, 880); sh.addColorStop(0, "rgba(255,255,255,0.22)"); sh.addColorStop(0.5, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(255,255,255,0.1)");
  g.fillStyle = sh; g.fillRect(0, 0, 1024, 1024);
});
const silver = () => ctex("mirrorMacro", 1024, 1024, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 1024, 1024); gr.addColorStop(0, "#e6edf7"); gr.addColorStop(0.5, "#aebcd2"); gr.addColorStop(1, "#d4deec");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(255,255,255,${r() * 0.12})`; g.lineWidth = 1 + r() * 2; const y = r() * 1024; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + (r() - 0.5) * 40, 700, y + (r() - 0.5) * 40, 1024, y); g.stroke(); }
});
const hairSkin = () => ctex("hairSkin", 512, 256, (g, r) => {
  // overlapping cuticle scales along the strand
  g.fillStyle = "#4b2f1e"; g.fillRect(0, 0, 512, 256);
  for (let x = -40; x < 560; x += 34) for (let y = -20; y < 280; y += 22) {
    const ox = (Math.floor(y / 22) % 2) * 17 + (r() - 0.5) * 6;
    g.fillStyle = `rgba(${110 + r() * 40},${72 + r() * 25},${46 + r() * 20},0.55)`; g.beginPath(); g.moveTo(x + ox, y); g.quadraticCurveTo(x + ox + 30, y + 11, x + ox, y + 24); g.lineTo(x + ox - 6, y + 22); g.quadraticCurveTo(x + ox + 20, y + 11, x + ox - 6, y + 2); g.closePath(); g.fill();
    g.strokeStyle = "rgba(30,16,8,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + ox, y); g.quadraticCurveTo(x + ox + 30, y + 11, x + ox, y + 24); g.stroke();
  }
});
/** the hair's cut end: cuticle rim, cortex, medulla; 50 strips across it, one of them lit red (strip 24) */
export const hairEnd = (lit: number) => ctex("hairEnd" + Math.round(lit * 8), 512, 512, (g) => {
  const c = 256;
  g.fillStyle = "#3a2416"; g.beginPath(); g.arc(c, c, 254, 0, 7); g.fill();
  const gr = g.createRadialGradient(c - 40, c - 50, 10, c, c, 236); gr.addColorStop(0, "#9a6a44"); gr.addColorStop(0.7, "#6e4a30"); gr.addColorStop(1, "#4a301e");
  g.fillStyle = gr; g.beginPath(); g.arc(c, c, 232, 0, 7); g.fill();
  g.fillStyle = "#2e1c10"; g.beginPath(); g.ellipse(c + 10, c - 6, 46, 38, 0.4, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(c, c, 232, 0, 7); g.clip();
  for (let k = 1; k < 50; k++) { const x = c - 232 + (464 * k) / 50; g.strokeStyle = "rgba(255,240,220,0.35)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  if (lit > 0) { const x = c - 232 + (464 * 24) / 50; g.fillStyle = `rgba(255,${60 + 60 * (1 - lit)},${50 + 40 * (1 - lit)},${0.25 + 0.75 * lit})`; g.fillRect(x, 0, 464 / 50, 512); }
  g.restore();
  g.strokeStyle = "#1a0e06"; g.lineWidth = 8; g.beginPath(); g.arc(c, c, 250, 0, 7); g.stroke();
});

export type TubeSet = { errRing: THREE.Mesh; errStep: THREE.Mesh; errGlow: THREE.Sprite; hairEndM: THREE.Mesh; endLit: number };
export const buildTube = (R: THREE.Object3D): TubeSet => {
  const root = new THREE.Group(); root.position.set(...TUB); R.add(root);
  const b = new Batch(), black = lam("tubeBlack", () => ({ color: "#0c0d12" })), baffle = lam("tubeBaffle", () => ({ color: "#1b1d26" }));
  // the tube (seen from inside) and its baffle rings, the secondary mirror on four vanes, the primary's cell
  b.add(cyl(1.62, 1.62, 16, 48, true).rotateX(Math.PI / 2).translate(0, 0, -1), lam("tubeInside", () => ({ color: "#0a0b10", side: THREE.BackSide })));
  for (let z = 5.5; z > -6.6; z -= 0.95) b.add(new THREE.RingGeometry(1.36, 1.62, 48).translate(0, 0, z), lam("tubeBaffleRing", () => ({ color: "#20232e", side: THREE.DoubleSide })));
  for (let z = 5.5; z > -6.6; z -= 0.95) b.add(new THREE.TorusGeometry(1.36, 0.012, 6, 48).translate(0, 0, z), baffle);
  b.add(cyl(0.17, 0.17, 0.22, 32).rotateX(Math.PI / 2).translate(0, 0, 4.2), black);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.add(new THREE.BoxGeometry(dx ? 1.45 : 0.012, dy ? 1.45 : 0.012, 0.09).translate(dx * 0.89, dy * 0.89, 4.2), black);
  b.add(cyl(1.3, 1.3, 0.35, 64).rotateX(Math.PI / 2).translate(0, 0, -6.9), lam("mirrorCell", () => ({ color: "#2a2d36" })));
  b.add(cyl(0.3, 0.3, 1.6, 32, true).rotateX(Math.PI / 2).translate(0, 0, -6.2), black);   // the central baffle through the hole
  b.build(root);
  // the primary mirror: a shallow concave dish with a central hole, painted reflection (unlit, it blooms a little)
  const prof: THREE.Vector2[] = []; for (let i = 0; i <= 16; i++) { const r = 0.3 + (1.2 - 0.3) * (i / 16); prof.push(new THREE.Vector2(r, 0.04 * (r / 1.2) ** 2)); }
  const dish = new THREE.LatheGeometry(prof, 96); dish.rotateX(Math.PI / 2);
  const pos = dish.attributes.position as THREE.BufferAttribute, uv = dish.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / 2.4, 0.5 + pos.getY(i) / 2.4);
  const mirror = new THREE.Mesh(dish, new THREE.MeshBasicMaterial({ map: mirrorFace(), color: hdr("#ffffff", 1.15), side: THREE.DoubleSide }));
  mirror.position.set(0, 0, -6.7); root.add(mirror);
  // the polishing error: a red glowing zone round the rim (shown on "off")
  const errRing = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.2, 96), new THREE.MeshBasicMaterial({ color: hdr("#ff3b2f", 2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  errRing.position.set(0, 0, -6.64); errRing.layers.set(NOINK); root.add(errRing);
  root.add(shaft(V(0, 0, 9), V(0, 0, -6.6), 1.1, 1.25, "#bcd2ff", 0.12));
  // ---- the macro set: the mirror's rim at hair scale ----
  const mac = new THREE.Group(); mac.position.set(...MAC); R.add(mac);
  const mb = new Batch();
  mb.add(new THREE.PlaneGeometry(60, 30).rotateX(-Math.PI / 2).translate(0, 0, -15), basic("macSilver", () => ({ map: rep(silver(), 3, 2), color: hdr("#ffffff", 0.92) })));
  mb.add(new THREE.PlaneGeometry(60, 8).translate(0, -4, 0), lam("macEdge", () => ({ color: "#3d5a7e" })));          // the mirror's ground edge face
  mb.add(new THREE.PlaneGeometry(60, 30).rotateX(-Math.PI / 2).translate(0, -8, 15), lam("macBelow", () => ({ color: "#0b0e16" })));
  // the hair, lying across the rim and off the edge, its cut end facing +x
  const hairG = cyl(HAIR_R, HAIR_R, 40, 40, true).rotateZ(Math.PI / 2).translate(-20, HAIR_R, -2.5);
  mb.add(hairG, lam("hair", () => ({ map: rep(hairSkin(), 30, 1) })));
  mb.build(mac);
  const hairEndM = new THREE.Mesh(new THREE.CircleGeometry(HAIR_R, 48).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ map: hairEnd(0), color: hdr("#ffffff", 0.95) }));
  hairEndM.position.set(0.001, HAIR_R, -2.5); mac.add(hairEndM);
  // the error: a thin red step along the rim, 1/50 of the hair's width tall
  const errStep = new THREE.Mesh(new THREE.BoxGeometry(60, (2 * HAIR_R) / 50, 0.6), new THREE.MeshBasicMaterial({ color: hdr("#ff3b2f", 2.4), transparent: true, opacity: 0, depthWrite: false }));
  errStep.position.set(0, HAIR_R / 50, -0.3); errStep.layers.set(NOINK); mac.add(errStep);
  const errGlow = glow("#ff4a3a", 1.2, 0.8); errGlow.position.set(-1.0, 0.03, -0.3); errGlow.visible = false; mac.add(errGlow);
  return { errRing, errStep, errGlow, hairEndM, endLit: -1 };
};
