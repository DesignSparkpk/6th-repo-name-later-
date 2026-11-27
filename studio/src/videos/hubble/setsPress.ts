// The press conference at PRS (January 1994): a deep-blue curtain with a scatter of stars, a lectern with a bundle of
// microphones, two TV cameras on tripods, flash units that pop (world.ts), and - next door at NEB - the final image:
// a full-colour nebula painted procedurally (gas clouds in teal, gold and rose, dark dust lanes, bright stars with
// four-point diffraction spikes) that the camera pushes into at the very end.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { cyl, hdr, glow, basic } from "./kit";
import { PRS, NEB } from "./story";

const curtain = () => ctex("pressCurtain", 512, 512, (g, r) => {
  g.fillStyle = "#16306a"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 24) { const gr = g.createLinearGradient(x, 0, x + 24, 0); gr.addColorStop(0, "rgba(0,0,0,0.25)"); gr.addColorStop(0.5, "rgba(120,160,255,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = gr; g.fillRect(x, 0, 24, 512); }
  for (let i = 0; i < 60; i++) { const x = r() * 512, y = r() * 512, s = 1 + r() * 2.5; g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.5})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
});
/** the final picture: a nebula (deterministic) */
export const nebulaTex = () => ctex("nebula", 1080, 1920, (g, r) => {
  g.fillStyle = "#03040a"; g.fillRect(0, 0, 1080, 1920);
  const blob = (x: number, y: number, rad: number, col: string, a: number) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col.replace("A", String(a))); gr.addColorStop(1, col.replace("A", "0")); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); };
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 70; i++) blob(540 + (r() - 0.5) * 900, 960 + (r() - 0.5) * 1500, 160 + r() * 380, "rgba(40,150,170,A)", 0.12);     // teal (oxygen)
  for (let i = 0; i < 60; i++) blob(470 + (r() - 0.5) * 700, 900 + (r() - 0.5) * 1100, 120 + r() * 300, "rgba(230,150,60,A)", 0.12);     // gold (sulphur/hydrogen)
  for (let i = 0; i < 40; i++) blob(620 + (r() - 0.5) * 700, 1100 + (r() - 0.5) * 900, 90 + r() * 240, "rgba(220,70,110,A)", 0.1);       // rose
  g.globalCompositeOperation = "source-over";
  // soft dark dust: overlapping smoky blobs in drifting lanes, their edges lit gold where the stars hit them
  for (let i = 0; i < 46; i++) {
    const t = r(), x = 140 + t * 800 + (r() - 0.5) * 160, y = 1500 - t * 700 + (r() - 0.5) * 260, rad = 70 + r() * 150;
    const gr = g.createRadialGradient(x, y, rad * 0.2, x, y, rad); gr.addColorStop(0, "rgba(16,10,12,0.7)"); gr.addColorStop(1, "rgba(16,10,12,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  }
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 30; i++) { const x = 520 + (r() - 0.5) * 260, y = 820 + (r() - 0.5) * 260; const gr = g.createRadialGradient(x, y, 0, x, y, 40 + r() * 60); gr.addColorStop(0, "rgba(255,230,200,0.22)"); gr.addColorStop(1, "rgba(255,200,150,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 100, 0, 7); g.fill(); }
  g.globalCompositeOperation = "source-over";
  // wispy filaments: thin glowing strands sweeping round the bright heart, gold near it, teal further out
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 260; i++) {
    const a = r() * Math.PI * 2, r0 = 60 + r() * 520, len = 0.25 + r() * 0.6, cx = 540, cy = 860;
    const near = r0 < 260, col = near ? `rgba(255,${190 + r() * 40},${120 + r() * 50},${0.05 + r() * 0.08})` : `rgba(${80 + r() * 60},${200 + r() * 40},${210 + r() * 40},${0.04 + r() * 0.07})`;
    g.strokeStyle = col; g.lineWidth = 1 + r() * 3; g.beginPath();
    for (let k = 0; k <= 12; k++) { const t = a + (k / 12) * len, rr = r0 * (1 + 0.15 * Math.sin(k * 0.9 + i)); const x = cx + Math.cos(t) * rr * 0.9, y = cy + Math.sin(t) * rr * 1.3; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  }
  { const gr = g.createRadialGradient(540, 860, 0, 540, 860, 230); gr.addColorStop(0, "rgba(255,250,235,0.55)"); gr.addColorStop(0.4, "rgba(255,210,150,0.18)"); gr.addColorStop(1, "rgba(255,200,150,0)"); g.fillStyle = gr; g.beginPath(); g.arc(540, 860, 230, 0, 7); g.fill(); }
  g.globalCompositeOperation = "source-over";
  // stars, a few big ones with four-point spikes
  for (let i = 0; i < 900; i++) { const s = r() ** 3 * 2.4 + 0.4; g.fillStyle = `rgba(255,${235 + r() * 20},${220 + r() * 35},${0.4 + r() * 0.6})`; g.beginPath(); g.arc(r() * 1080, r() * 1920, s, 0, 7); g.fill(); }
  for (let i = 0; i < 9; i++) {
    const x = r() * 1080, y = r() * 1920, L = 40 + r() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, 22); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(200,220,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill();
    g.strokeStyle = "rgba(230,240,255,0.75)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L); g.lineTo(x, y + L); g.stroke();
  }
});

export type PressSet = { flash: THREE.Sprite[] };
export const buildPress = (R: THREE.Object3D): PressSet => {
  const root = new THREE.Group(); root.position.set(...PRS); R.add(root);
  const b = new Batch();
  b.add(new THREE.PlaneGeometry(20, 14).rotateX(-Math.PI / 2), lam("pressFloor", () => ({ color: "#3a3f4c" })));
  b.add(new THREE.PlaneGeometry(14, 6).translate(0, 3, -3.2), lam("pressCurtain", () => ({ map: rep(curtain(), 4, 2) })));
  // the lectern and its bundle of microphones
  const wood = lam("lectern", () => ({ color: "#5a3a24" })), black = lam("micBlack", () => ({ color: "#1c1c22" }));
  b.add(boxGeo(V(-0.45, 0, -1.5), V(0.45, 0.92, -1.0), 0), wood);
  b.add(boxGeo(V(-0.5, 0.92, -1.55), V(0.5, 1.0, -0.95), 0), wood);
  for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.2; b.add(cyl(0.012, 0.012, 0.16, 6).translate(Math.sin(a) * 0.3, 1.08, -1.0), black); b.add(cyl(0.03, 0.03, 0.08, 10).rotateX(1.2).translate(Math.sin(a) * 0.3, 1.16, -0.98), [black, lam("micRed", () => ({ color: "#b8323a" })), lam("micBlue", () => ({ color: "#2c5fb8" }))][k % 3]); }
  // TV cameras on tripods at the sides
  for (const x of [-2.6, 2.6]) {
    b.add(boxGeo(V(x - 0.25, 1.5, 1.6), V(x + 0.25, 1.85, 2.3), 0), black); b.add(cyl(0.11, 0.13, 0.3, 12).rotateX(Math.PI / 2).translate(x, 1.68, 1.45), black);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; b.add(cyl(0.02, 0.02, 1.6, 6).rotateZ(0.25 * Math.cos(a)).rotateX(0.25 * Math.sin(a)).translate(x + Math.cos(a) * 0.2, 0.75, 1.95 + Math.sin(a) * 0.2), black); }
  }
  b.build(root);
  const spot = glow("#fff4e0", 4.5, 0.3); spot.position.set(0, 2.0, -1.4); root.add(spot);
  const flash = [0, 1, 2, 3].map((k) => { const s = glow("#ffffff", 2.0, 5); s.position.set(-1.6 + k * 1.05, 1.75 + (k % 2) * 0.35, 3.2 - (k % 2) * 0.5); s.visible = false; root.add(s); return s; });
  // the final picture, far away on its own
  const neb = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 19.2), basic("nebula", () => ({ map: nebulaTex(), color: hdr("#ffffff", 1.2), fog: false })));
  neb.position.set(...NEB); neb.layers.set(NOINK); R.add(neb);
  return { flash };
};
