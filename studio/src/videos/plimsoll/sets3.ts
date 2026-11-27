// The shipowners' club, built against the bar end of the Commons chamber (z = 15.4 .. 24): red damask, a roaring
// fire, gas sconces, a portrait of a ship, bookshelves, leather armchairs, brandy, a globe, a ship model in a glass case,
// and the door through into the chamber with HOUSE OF COMMONS painted over it.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { M, cyl, basic, ship } from "./sets";
import { CLUB_CHAIRS } from "./story";

const damask = () => ctex("damask", 512, 512, (g, r) => {
  g.fillStyle = "#7a1f24"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 128) for (let x = (y / 128) % 2 ? 64 : 0; x < 576; x += 128) {
    g.fillStyle = "#8e2a2e"; g.beginPath(); g.ellipse(x, y + 64, 34, 52, 0, 0, 7); g.fill();
    g.fillStyle = "#a8763a"; g.beginPath(); g.moveTo(x, y + 20); g.lineTo(x + 16, y + 64); g.lineTo(x, y + 108); g.lineTo(x - 16, y + 64); g.fill();
    g.fillStyle = "#6a1a1e"; g.beginPath(); g.arc(x, y + 64, 8, 0, 7); g.fill();
  }
  for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(40,8,10,${r() * 0.1})`; g.fillRect(r() * 512, r() * 512, 3, 3); }
});
const rugTex = () => ctex("clubRug", 512, 512, (g) => {
  g.fillStyle = "#5a1a20"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#c9a24e"; g.lineWidth = 14; g.strokeRect(24, 24, 464, 464); g.lineWidth = 5; g.strokeRect(54, 54, 404, 404);
  g.fillStyle = "#2c3a5a"; g.beginPath(); g.moveTo(256, 110); g.lineTo(400, 256); g.lineTo(256, 402); g.lineTo(112, 256); g.fill();
  g.fillStyle = "#c9a24e"; g.beginPath(); g.arc(256, 256, 40, 0, 7); g.fill();
});
const shelfTex = () => ctex("bookshelf", 512, 512, (g, r) => {
  g.fillStyle = "#3a2214"; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 4; row++) {
    let x = 10; const y = row * 128 + 14;
    while (x < 500) { const w = 12 + r() * 18, h = 80 + r() * 26; g.fillStyle = ["#7a1f24", "#2c4f3a", "#2c3a5a", "#8a6a2a", "#5a3a22"][Math.floor(r() * 5)]; g.fillRect(x, y + 104 - h, w, h); g.fillStyle = "rgba(230,200,120,0.6)"; g.fillRect(x + 2, y + 104 - h + 10, w - 4, 3); x += w + 2; }
    g.fillStyle = "#5a3820"; g.fillRect(0, row * 128 + 118, 512, 10);
  }
});
const portraitTex = () => ctex("shipPortrait", 384, 288, (g) => {
  g.fillStyle = "#c9a24e"; g.fillRect(0, 0, 384, 288); g.fillStyle = "#3a5a78"; g.fillRect(22, 22, 340, 244);
  const sky = g.createLinearGradient(0, 22, 0, 170); sky.addColorStop(0, "#e8b878"); sky.addColorStop(1, "#7a9ab8"); g.fillStyle = sky; g.fillRect(22, 22, 340, 150);
  g.fillStyle = "#4a2e1c"; g.beginPath(); g.moveTo(90, 180); g.lineTo(300, 180); g.lineTo(276, 214); g.lineTo(112, 214); g.fill();
  g.fillStyle = "#f2e8d0"; for (const [x, h] of [[150, 110], [220, 96]]) { g.fillRect(x - 2, 180 - h, 4, h); g.fillRect(x - 34, 180 - h + 10, 68, 30); g.fillRect(x - 30, 180 - h + 46, 60, 28); }
  g.fillStyle = "#c9a24e"; g.font = "bold 16px Georgia, serif"; g.textAlign = "center"; g.fillText("THE PROFITABLE", 192, 258);
});
const doorSign = () => ctex("commonsDoorSign", 1024, 192, (g) => {
  g.fillStyle = "#2a1a12"; g.fillRect(0, 0, 1024, 192); g.strokeStyle = "#c9a24e"; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 172);
  g.fillStyle = "#e2c26a"; g.font = "bold 92px Georgia, serif"; g.textAlign = "center"; g.fillText("HOUSE OF COMMONS", 512, 128);
});

export type Sets3 = { fire: THREE.Mesh[]; doorLeaves: THREE.Object3D[] };

export const buildClub = (R: THREE.Object3D): Sets3 => {
  const b = new Batch();
  const wall = lam("damask", () => ({ map: rep(damask(), 1, 1) }));
  const wood = lam("clubWood", () => ({ color: "#3e2416" }));
  const gold = lam("clubGold", () => ({ color: "#c9a24e" }));
  const Z0 = 15.4, Z1 = 24, X = 7.2, H = 5.6;
  b.add(boxGeo(V(-X, -0.2, Z0), V(X, 0, Z1), 2), lam("clubFloor", () => ({ color: "#4a2c1a" })));
  b.add(boxGeo(V(-4.2, 0, 16.4), V(1.2, 0.02, 22.8), 0), lam("clubRug", () => ({ map: rugTex() })));
  b.add(boxGeo(V(-X - 0.3, 0, Z0), V(-X, H, Z1), 2.2), wall);
  b.add(boxGeo(V(X, 0, Z0), V(X + 0.3, H, Z1), 2.2), wall);
  b.add(boxGeo(V(-X, 0, Z1), V(X, H, Z1 + 0.3), 2.2), wall);
  // the shared wall's club face, with the door gap at x -1.1 .. 1.1, y 0 .. 3.4
  b.add(boxGeo(V(-X, 0, Z0), V(-1.1, H, Z0 + 0.06), 2.2), wall);
  b.add(boxGeo(V(1.1, 0, Z0), V(X, H, Z0 + 0.06), 2.2), wall);
  b.add(boxGeo(V(-1.1, 3.4, Z0), V(1.1, H, Z0 + 0.06), 2.2), wall);
  for (const s of [-1, 1]) b.add(boxGeo(V(s * 1.1 - 0.18, 0, Z0), V(s * 1.1 + 0.18, 3.55, Z0 + 0.2)), wood);
  b.add(boxGeo(V(-1.3, 3.4, Z0), V(1.3, 3.65, Z0 + 0.2)), wood);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.64), basic("commonsDoorSign", () => ({ map: doorSign() })));
  sign.position.set(0, 4.2, Z0 + 0.22); R.add(sign);
  // wainscot + picture rail
  for (const [a, c] of [[V(-X, 0, Z0 + 0.06), V(-X + 0.08, 1.1, Z1)], [V(X - 0.08, 0, Z0 + 0.06), V(X, 1.1, Z1)], [V(-X, 0, Z1 - 0.08), V(X, 1.1, Z1)]] as const) b.add(boxGeo(a, c, 1), wood);
  b.add(boxGeo(V(-X, H - 0.4, Z0), V(X, H, Z1), 2), wood); // cornice band
  b.add(boxGeo(V(-X, H, Z0), V(X, H + 0.3, Z1), 0), lam("clubCeil", () => ({ color: "#2e1a10" })));
  // fireplace on the west wall, a fire glowing in it, the portrait of a ship over the mantel
  const FZ = 19.6;
  b.add(boxGeo(V(-X, 0, FZ - 1.4), V(-X + 0.5, 1.6, FZ - 0.95)), lam("marble", () => ({ color: "#d9cfc0" })));
  b.add(boxGeo(V(-X, 0, FZ + 0.95), V(-X + 0.5, 1.6, FZ + 1.4)), lam("marble", () => ({})));
  b.add(boxGeo(V(-X, 1.6, FZ - 1.55), V(-X + 0.65, 1.8, FZ + 1.55)), lam("marble", () => ({})));
  b.add(boxGeo(V(-X - 0.2, 0, FZ - 0.95), V(-X + 0.02, 1.6, FZ + 0.95)), lam("firebox", () => ({ color: "#1a0e0a" })));
  const fire: THREE.Mesh[] = [];
  for (let k = 0; k < 5; k++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.2 + (k % 2) * 0.08, 0.7 + (k % 3) * 0.2, 8), basic("fireGlow" + (k % 2), () => ({ color: k % 2 ? new THREE.Color(3.4, 1.6, 0.4) : new THREE.Color(3.0, 2.2, 0.6) })));
    m.position.set(-X + 0.25, 0.45, FZ - 0.5 + k * 0.25); m.layers.set(NOINK); R.add(m); fire.push(m);
  }
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.5), lam("shipPortrait", () => ({ map: portraitTex() })));
  portrait.position.set(-X + 0.06, 3.1, FZ); portrait.rotation.y = Math.PI / 2; R.add(portrait);
  b.add(cyl(0.16, 0.2, 0.42, 12), gold, M(-X + 0.35, 2.02, FZ + 1.1)); // mantel clock
  // the model ship in a glass case on the mantel
  const model = ship(1.4, 0.4, 0.28, false, { masts: 2, crates: 0, seed: 77, sails: "set" });
  model.position.set(-X + 0.35, 2.1, FZ - 0.85); model.rotation.y = Math.PI / 2; model.scale.setScalar(0.7); R.add(model);
  // bookshelves on the east wall, gas sconces all round
  b.add(boxGeo(V(X - 0.45, 0, 17), V(X, 3.6, 23), 0), lam("bookshelf", () => ({ map: rep(shelfTex(), 3, 1) })));
  for (const [x, z, ry] of [[-X + 0.1, 17.4, Math.PI / 2], [-X + 0.1, 21.8, Math.PI / 2], [X - 0.1, 16.2, -Math.PI / 2], [-3.5, Z1 - 0.1, Math.PI], [3.5, Z1 - 0.1, Math.PI]]) {
    b.add(cyl(0.03, 0.03, 0.35, 6).rotateZ(Math.PI / 2), gold, M(x, 2.6, z, ry));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), basic("sconce", () => ({ color: new THREE.Color(3.0, 2.0, 0.9) })));
    glow.position.set(x + Math.sin(ry) * 0.3, 2.75, z + Math.cos(ry) * 0.3); glow.layers.set(NOINK); R.add(glow);
  }
  // leather armchairs facing east (toward the room), a table with brandy, a globe
  const leather = lam("clubLeather", () => ({ color: "#6b1f24" }));
  for (const [x, z] of CLUB_CHAIRS) {
    b.add(boxGeo(V(x - 0.45, 0, z - 0.5), V(x + 0.45, 0.42, z + 0.5)), leather);
    b.add(boxGeo(V(x - 0.62, 0.42, z - 0.55), V(x - 0.4, 1.35, z + 0.55)), leather);
    for (const s of [-1, 1]) b.add(boxGeo(V(x - 0.45, 0.42, z + s * 0.5 - 0.12), V(x + 0.42, 0.75, z + s * 0.5 + 0.12)), leather);
    for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.06, 8, 6), gold, M(x + 0.42, 0.75, z + s * 0.5));
  }
  b.add(cyl(0.45, 0.45, 0.05, 20), wood, M(-1.0, 0.7, 18.9)); b.add(cyl(0.05, 0.08, 0.7), wood, M(-1.0, 0.35, 18.9));
  b.add(cyl(0.07, 0.12, 0.32, 12), lam("decanter", () => ({ color: "#b8642a" })), M(-1.05, 0.88, 18.8));
  for (const dz of [0.18, -0.16]) b.add(cyl(0.05, 0.035, 0.1, 10), lam("glass", () => ({ color: "#e8c890" })), M(-0.82, 0.78, 18.9 + dz));
  b.add(new THREE.SphereGeometry(0.42, 18, 12), lam("globe", () => ({ map: ctex("globeTex", 256, 128, (g, r) => { g.fillStyle = "#c9b98a"; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 14; i++) { g.fillStyle = "#6a8a5a"; g.beginPath(); g.ellipse(r() * 256, 20 + r() * 88, 10 + r() * 26, 6 + r() * 16, r(), 0, 7); g.fill(); } }) })), M(3.8, 1.25, 22.6));
  b.add(cyl(0.04, 0.18, 0.85), wood, M(3.8, 0.42, 22.6));
  b.build(R);
  // the two door leaves, standing open into the chamber
  const doorLeaves: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(s * 1.08, 0, 15.05); R.add(pv);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.06, 3.35, 0.08), lam("doorLeaf", () => ({ color: "#4a2c1a" })));
    leaf.position.set(-s * 0.53, 1.68, 0); pv.add(leaf); pv.rotation.y = s * 1.35; doorLeaves.push(pv);
  }
  return { fire, doorLeaves };
};
