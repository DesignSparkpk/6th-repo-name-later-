// The three places of the film, built once: the Las Vegas pool under the curved hotel, the London street under the
// top-heavy curved tower (with the car, shop, phone box and the sunshade fins), and a small park lawn.
// Same look as the bridge template: painted canvas textures, two-tone lambert (lam / twoTone), ink from the post pass.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, boxGeo, house, prop, Kit } from "../bridge/build";
import { ctex, rep, grassHD, stoneHD, rng } from "../bridge/paint";
import { twoTone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { HOTEL, POOL, GUEST, TABLE, BAR, LX, TOWER, CAR, SPOT, SHOP, PAN, PX, V3 } from "./story";

// ---------------- painted textures ----------------
const glassTex = (key: string, tint: string[]) => ctex(key, 1024, 1024, (g, r) => {
  // sky reflected in the curtain wall: vertical gradient, two soft diagonal sheens, a mullion grid (3 floors x 8 panels per tile)
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  tint.forEach((c, i) => gr.addColorStop(i / (tint.length - 1), c));
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (const [x0, w, a] of [[120, 150, 0.16], [560, 90, 0.12], [820, 60, 0.1]] as const) {
    g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w - 380, 1024); g.lineTo(x0 - 380, 1024); g.fill();
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(20,40,70,${0.05 + r() * 0.08})`; g.fillRect(Math.floor(r() * 8) * 128 + 6, Math.floor(r() * 3) * 341 + 10, 116, 321); }
  g.fillStyle = "#26364d";
  for (let k = 0; k <= 8; k++) g.fillRect(k * 128 - 5, 0, 10, 1024);
  for (let k = 0; k <= 3; k++) g.fillRect(0, k * 341.3 - 7, 1024, 14);
  g.fillStyle = "rgba(255,255,255,0.35)";
  for (let k = 0; k < 3; k++) g.fillRect(0, k * 341.3 + 8, 1024, 3);
});
const tiles = (key: string, base: string[], joint: string, n = 4) => ctex(key, 512, 512, (g, r) => {
  const s = 512 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = base[Math.floor(r() * base.length)]; g.fillRect(x * s, y * s, s, s); }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(90,70,40,${r() * 0.06})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 6, 2 + r() * 6); }
  g.fillStyle = joint;
  for (let k = 0; k <= n; k++) { g.fillRect(k * s - 2, 0, 4, 512); g.fillRect(0, k * s - 2, 512, 4); }
});
const asphalt = () => ctex("asphalt", 512, 512, (g, r) => {
  g.fillStyle = "#5d5f66"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { const c = 70 + r() * 40; g.fillStyle = `rgba(${c},${c},${c + 6},0.5)`; g.fillRect(r() * 512, r() * 512, 2, 2); }
  for (let i = 0; i < 6; i++) { g.strokeStyle = "rgba(40,40,46,0.35)"; g.lineWidth = 2; g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += r() * 40; g.lineTo(x, y); } g.stroke(); }
});
const waterTex = () => ctex("poolWater", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 512, 512); gr.addColorStop(0, "#5fe0ea"); gr.addColorStop(1, "#22b5d8");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 5; g.lineJoin = "round";
  for (let i = 0; i < 26; i++) { g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += 20 + r() * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.8)";
  for (let i = 0; i < 18; i++) g.fillRect(r() * 512, r() * 512, 10 + r() * 16, 4);
});
const stripes = (key: string, a: string, b: string, n = 8) => ctex(key, 512, 64, (g) => { for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? a : b; g.fillRect((k * 512) / n, 0, 512 / n, 64); } });
const matTex = () => ctex("doormat", 256, 128, (g, r) => {
  g.fillStyle = "#b5763c"; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "#8a5428"; g.lineWidth = 3;
  for (let x = 6; x < 256; x += 8) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 122); g.stroke(); }
  g.strokeStyle = "#5b3518"; g.lineWidth = 8; g.strokeRect(6, 6, 244, 116);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(60,30,10,${r() * 0.15})`; g.fillRect(r() * 256, r() * 128, 3, 3); }
});
const phoneTex = () => ctex("phonebox", 256, 512, (g) => {
  g.fillStyle = "#c8202b"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#1a1a22"; g.fillRect(28, 24, 200, 46);
  g.fillStyle = "#f1ece2"; g.fillRect(40, 34, 176, 26);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 3; x++) { g.fillStyle = "#cfe2ec"; g.fillRect(36 + x * 64, 96 + y * 58, 52, 46); }
  g.fillStyle = "#a51822"; for (let x = 0; x < 4; x++) g.fillRect(30 + x * 64, 90, 6, 360);
});

// ---------------- helpers ----------------
const glow = (color: THREE.ColorRepresentation, k: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
const radialTex = () => ctex("radialSoft", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.75)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** soft additive light pool lying on the ground (bloom picks it up) */
const pool = (color: string, k: number, w: number, h: number) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: radialTex(), color: new THREE.Color(color).multiplyScalar(k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  m.rotation.x = -Math.PI / 2; m.layers.set(NOINK); m.renderOrder = 2;
  return m;
};
const flatUp = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / tile, uv.getY(i) * (z1 - z0) / tile);
  return g;
};
const cyl = (r0: number, r1: number, h: number, seg = 16) => new THREE.CylinderGeometry(r0, r1, h, seg);
const at = (x: number, y: number, z: number, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(1, 1, 1));

export type Sets = {
  vegasSpot: THREE.Mesh; londonSpot: THREE.Mesh; londonSpotCar: THREE.Mesh; parkDot: THREE.Mesh;
  bigUmbrella: THREE.Group; fins: THREE.Mesh[]; rays: THREE.Mesh[]; glints: THREE.Mesh[];
  car: { root: THREE.Group; mirror: THREE.Group; badge: THREE.Mesh; panel: THREE.Mesh };
  panGroup: THREE.Group;
};

export const buildSets = (R: THREE.Object3D, kit: Kit): Sets => {
  const b = new Batch();
  // ======================= LAS VEGAS =======================
  const deck = lam("vDeck", () => ({ map: rep(tiles("vDeck", ["#f1e4c9", "#ecdcbd", "#f4e9d3", "#e8d6b4"], "#cdb48c"), 1, 1) }));
  b.add(flatUp(-160, 160, -40, 120, 0, 2), deck);
  const coping = lam("vCope", () => ({ map: stoneHD("vCopeHD", ["#fbf6ec", "#f2ebdd", "#f7f1e6", "#efe6d6"], "#cbbfa8") }));
  const { x0, x1, z0, z1 } = POOL;
  for (const [a, c] of [[V(x0 - 0.6, -0.02, z0 - 0.6), V(x1 + 0.6, 0.12, z0)], [V(x0 - 0.6, -0.02, z1), V(x1 + 0.6, 0.12, z1 + 0.6)],
    [V(x0 - 0.6, -0.02, z0), V(x0, 0.12, z1)], [V(x1, -0.02, z0), V(x1 + 0.6, 0.12, z1)]] as const) b.add(boxGeo(a, c, 1), coping);
  const water = new THREE.Mesh(flatUp(x0, x1, z0, z1, 0.06, 6), twoTone(new THREE.MeshLambertMaterial({ map: rep(waterTex(), 1, 1), emissive: new THREE.Color("#1a6f86"), emissiveIntensity: 0.25 }), 0.4));
  water.receiveShadow = true; R.add(water);
  // the curved hotel: a crescent slab, glass on the concave (pool) side
  const glassM = lam("glassVegas", () => ({ map: rep(glassTex("glassVegas", ["#d9ebfb", "#9cc4ec", "#5f93cf", "#7fb0e0", "#b9d6f2"]), 1, 1) }));
  const sideM = lam("hotelSide", () => ({ color: "#d8d2c6" }));
  {
    const n = 48, { cx, cz, r, depth, a0, a1, h } = HOTEL, rad = (d: number) => (d * Math.PI) / 180;
    const pos: number[] = [], nor: number[] = [], uv: number[] = [];
    const pOut: number[] = [], nOut: number[] = [], uOut: number[] = [];
    let arc = 0;
    for (let i = 0; i < n; i++) {
      const A = rad(a0 + ((a1 - a0) * i) / n), B = rad(a0 + ((a1 - a0) * (i + 1)) / n);
      const pa = [cx + r * Math.cos(A), cz + r * Math.sin(A)], pb = [cx + r * Math.cos(B), cz + r * Math.sin(B)];
      const da = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      // inner (glass) face, normal toward the centre
      const na = [-Math.cos(A), -Math.sin(A)], nb = [-Math.cos(B), -Math.sin(B)];
      const quadV = [[pa, 0, na, arc], [pb, 0, nb, arc + da], [pb, h, nb, arc + da], [pa, 0, na, arc], [pb, h, nb, arc + da], [pa, h, na, arc]] as const;
      for (const [p, y, nn, u] of quadV) { pos.push(p[0], y, p[1]); nor.push(nn[0], 0, nn[1]); uv.push(u / 12, y / 12); }
      const ro = r + depth, qa = [cx + ro * Math.cos(A), cz + ro * Math.sin(A)], qb = [cx + ro * Math.cos(B), cz + ro * Math.sin(B)];
      for (const [p, y, s, u] of [[qb, 0, B, 0], [qa, 0, A, 1], [qa, h, A, 1], [qb, 0, B, 0], [qa, h, A, 1], [qb, h, B, 0]] as const) { pOut.push(p[0], y, p[1]); nOut.push(Math.cos(s), 0, Math.sin(s)); uOut.push(u, y / 12); }
      for (const [p, y] of [[pa, h], [pb, h], [qb, h], [pa, h], [qb, h], [qa, h]] as const) { pOut.push(p[0], y, p[1]); nOut.push(0, 1, 0); uOut.push(0, 0); }
      arc += da;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    b.add(g, glassM);
    const go = new THREE.BufferGeometry(); go.setAttribute("position", new THREE.Float32BufferAttribute(pOut, 3)); go.setAttribute("normal", new THREE.Float32BufferAttribute(nOut, 3)); go.setAttribute("uv", new THREE.Float32BufferAttribute(uOut, 2));
    b.add(go, sideM);
    // end caps
    for (const ang of [a0, a1]) {
      const A = rad(ang), p = V(cx + r * Math.cos(A), 0, cz + r * Math.sin(A)), q = V(cx + (r + depth) * Math.cos(A), 0, cz + (r + depth) * Math.sin(A));
      const g2 = new THREE.BufferGeometry(), up = V(0, h, 0);
      const pts = ang === a0 ? [q, p, p.clone().add(up), q, p.clone().add(up), q.clone().add(up)] : [p, q, q.clone().add(up), p, q.clone().add(up), p.clone().add(up)];
      const nn = V(-Math.sin(A), 0, Math.cos(A)).multiplyScalar(ang === a0 ? -1 : 1);
      g2.setAttribute("position", new THREE.Float32BufferAttribute(pts.flatMap((v) => [v.x, v.y, v.z]), 3));
      g2.setAttribute("normal", new THREE.Float32BufferAttribute(pts.flatMap(() => [nn.x, nn.y, nn.z]), 3));
      b.add(g2, sideM);
    }
    // crown band + ground podium
    const crown = lam("hotelCrown", () => ({ color: "#efe9dd" }));
    for (let i = 0; i < n; i++) {
      const A = rad(a0 + ((a1 - a0) * (i + 0.5)) / n), x = cx + (r + 0.6) * Math.cos(A), z = cz + (r + 0.6) * Math.sin(A);
      b.add(new THREE.BoxGeometry(((a1 - a0) / n) * (Math.PI / 180) * r + 0.1, 3.2, 1.6), crown, at(x, h + 1.6, z, -A + Math.PI / 2));
      b.add(new THREE.BoxGeometry(((a1 - a0) / n) * (Math.PI / 180) * r + 0.1, 5.5, 3.2), crown, at(x, 2.75, z, -A + Math.PI / 2));
    }
  }
  // loungers + small umbrellas along the south side of the pool, facing the hotel
  const frameM = lam("loungerFrame", () => ({ color: "#f7f5ef" })), cushion = lam("cushion", () => ({ color: "#2fb3a8" }));
  const umbM = lam("umbStripe", () => ({ map: stripes("umbStripe", "#f4f1e8", "#e0503f", 12), side: THREE.DoubleSide }));
  const loungers = [-10.5, -7.5, -4.5, -1.5, 3, 7.5, 10.5];
  for (const x of loungers) {
    const z = GUEST[2];
    b.add(boxGeo(V(x - 0.38, 0.28, z - 1.0), V(x + 0.38, 0.38, z + 1.0)), frameM);
    for (const sx of [-0.33, 0.33]) for (const sz of [-0.9, 0.9]) b.add(boxGeo(V(x + sx - 0.04, 0, z + sz - 0.04), V(x + sx + 0.04, 0.3, z + sz + 0.04)), frameM);
    b.add(boxGeo(V(x - 0.36, 0.38, z - 0.15), V(x + 0.36, 0.48, z + 1.0)), cushion);
    b.add(new THREE.BoxGeometry(0.72, 0.1, 0.95), cushion, at(x, 0.72, z - 0.52, 0, -0.95));
  }
  for (const x of [-9, -3, 9]) {
    b.add(cyl(0.045, 0.045, 2.4), frameM, at(x, 1.2, GUEST[2] + 0.9));
    const c = new THREE.ConeGeometry(1.5, 0.5, 12, 1, true); b.add(c, umbM, at(x, 2.55, GUEST[2] + 0.9));
  }
  // side table for the cups + bag
  b.add(cyl(0.34, 0.34, 0.06, 20), frameM, at(TABLE[0], 0.55, TABLE[2]));
  b.add(cyl(0.04, 0.04, 0.55), frameM, at(TABLE[0], 0.27, TABLE[2]));
  // poolside bar
  const wood = lam("barWood", () => ({ map: rep(tiles("barWood", ["#a8693e", "#9c5f36", "#b27447"], "#6e3f22", 8), 1, 1) }));
  const top = lam("barTop", () => ({ color: "#f3efe6" }));
  b.add(boxGeo(V(BAR[0] - 2.4, 0, BAR[2] - 1.1), V(BAR[0] + 2.4, 1.05, BAR[2] - 0.5), 1), wood);
  b.add(boxGeo(V(BAR[0] - 2.5, 1.05, BAR[2] - 1.2), V(BAR[0] + 2.5, 1.12, BAR[2] - 0.38)), top);
  b.add(boxGeo(V(BAR[0] - 2.4, 0, BAR[2] - 3.2), V(BAR[0] + 2.4, 2.4, BAR[2] - 2.8), 1), wood);
  const bottleCols = ["#3f8f4a", "#c9822f", "#3e6fb3", "#b8323a", "#e3c25a"];
  for (let i = 0; i < 14; i++) b.add(cyl(0.06, 0.07, 0.34, 8), lam("bottle" + (i % 5), () => ({ color: bottleCols[i % 5] })), at(BAR[0] - 2 + i * 0.3, 1.62 + (i % 2) * 0.55, BAR[2] - 2.95));
  b.add(boxGeo(V(BAR[0] - 2.4, 1.42, BAR[2] - 3.0), V(BAR[0] + 2.4, 1.46, BAR[2] - 2.7)), top);
  b.add(boxGeo(V(BAR[0] - 2.4, 1.97, BAR[2] - 3.0), V(BAR[0] + 2.4, 2.01, BAR[2] - 2.7)), top);
  for (const dx of [-1.6, 0, 1.6]) { b.add(cyl(0.22, 0.22, 0.08, 14), cushion, at(BAR[0] + dx, 0.78, BAR[2] + 0.1)); b.add(cyl(0.04, 0.04, 0.76), frameM, at(BAR[0] + dx, 0.38, BAR[2] + 0.1)); }
  // palms + a far skyline of other casinos
  const palms = ["tree_palmTall", "tree_palmDetailedTall", "tree_palm", "tree_palmBend"];
  [[-17, 13], [-13.5, 16], [15, 12], [18.5, 15], [-20, 3], [20, -1], [-6, 17], [7, 18], [-24, -12], [25, -15]].forEach(([x, z], i) => prop(b, kit, palms[i % 4], x, 0, z, 7 + (i % 3) * 1.6, i));
  const far = lam("farTower", () => ({ color: "#c9b9a6" }));
  const r0 = rng(5);
  for (let i = 0; i < 14; i++) { const x = -260 + i * 40 + r0() * 20, h = 50 + r0() * 90; b.add(boxGeo(V(x, 0, 150 + r0() * 60), V(x + 18 + r0() * 14, h, 170 + r0() * 60)), far); }

  // ======================= LONDON =======================
  const road = lam("asphalt", () => ({ map: rep(asphalt(), 1, 1) }));
  b.add(flatUp(LX - 160, LX + 160, -5, 5, 0, 6), road);
  const paveM = lam("pavement", () => ({ map: rep(tiles("pave", ["#c9c4bb", "#c2bdb3", "#cfcac1"], "#9d978d", 4), 1, 1) }));
  b.add(flatUp(LX - 160, LX + 160, -9, -5, 0.15, 2.4), paveM);
  b.add(flatUp(LX - 160, LX + 160, 5, 9, 0.15, 2.4), paveM);
  b.add(flatUp(LX - 160, LX + 160, -200, -9, 0.15, 3), paveM);
  b.add(flatUp(LX - 160, LX + 160, 9, 200, 0.15, 3), paveM);
  const kerb = lam("kerb", () => ({ color: "#b9b4aa" }));
  for (const z of [-5, 5]) b.add(boxGeo(V(LX - 160, 0, z - 0.15), V(LX + 160, 0.15, z + 0.15)), kerb);
  // lines: dashed white centre, double yellow at both kerbs
  const white = lam("lineW", () => ({ color: "#f1efe9" })), yellow = lam("lineY", () => ({ color: "#f2c230" }));
  for (let x = LX - 160; x < LX + 160; x += 6) b.add(flatUp(x, x + 3, -0.07, 0.07, 0.01, 1), white);
  for (const z of [-4.62, -4.42, 4.42, 4.62]) b.add(flatUp(LX - 160, LX + 160, z - 0.05, z + 0.05, 0.012, 1), yellow);
  // the tower: top-heavy, south face concave (leans out with height and is dished in plan)
  const glassL = lam("glassLondon", () => ({ map: rep(glassTex("glassLondon", ["#e4eef8", "#b3cde6", "#7aa2cc", "#9fbddb", "#cfe0f0"]), 1, 1) }));
  const towerSide = lam("towerSide", () => ({ map: rep(glassTex("glassLondonSide", ["#c7d8ea", "#97b5d4", "#6f92bb", "#8fadcf", "#b5cce3"]), 1, 1) }));
  const { h: TH, hw0, hw1, lean, back } = TOWER;
  const hwAt = (y: number) => hw0 + (hw1 - hw0) * (y / TH) ** 1.3;
  const southZ = (x: number, y: number) => TOWER.z + lean * (y / TH) ** 2 - 3.2 * (1 - (x / hwAt(y)) ** 2);
  {
    const NX = 18, NY = 32, pos: number[] = [], uv: number[] = [];
    const P = (i: number, j: number) => { const y = (TH * j) / NY, hw = hwAt(y), x = -hw + (2 * hw * i) / NX; return [LX + x, y, southZ(x, y), (x + hw) / 12, y / 12]; };
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const a = P(i, j), c = P(i + 1, j), d = P(i + 1, j + 1), e = P(i, j + 1);
      for (const q of [a, c, d, a, d, e]) { pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    b.add(g, glassL);
    // sides, back, roof
    const sp: number[] = [], su: number[] = [];
    for (let j = 0; j < NY; j++) {
      const y0 = (TH * j) / NY, y1 = (TH * (j + 1)) / NY;
      for (const s of [-1, 1]) {
        const xa = s * hwAt(y0), xb = s * hwAt(y1);
        const A = [LX + xa, y0, southZ(xa, y0)], B = [LX + xa, y0, back], C = [LX + xb, y1, back], D = [LX + xb, y1, southZ(xb, y1)];
        const quadPts = s < 0 ? [A, B, C, A, C, D] : [B, A, D, B, D, C];
        for (const q of quadPts) { sp.push(q[0], q[1], q[2]); su.push((q[2] - back) / 12, q[1] / 12); }
      }
      const w0 = hwAt(y0), w1 = hwAt(y1);
      for (const q of [[LX + w0, y0, back], [LX - w0, y0, back], [LX - w1, y1, back], [LX + w0, y0, back], [LX - w1, y1, back], [LX + w1, y1, back]]) { sp.push(q[0], q[1], q[2]); su.push((q[0] - LX) / 12, q[1] / 12); }
    }
    const gs = new THREE.BufferGeometry(); gs.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); gs.setAttribute("uv", new THREE.Float32BufferAttribute(su, 2)); gs.computeVertexNormals();
    b.add(gs, towerSide);
    const roofM = lam("towerRoof", () => ({ color: "#d9dde2" }));
    const hw = hwAt(TH), zs = southZ(0, TH);
    b.add(boxGeo(V(LX - hw, TH, back), V(LX + hw, TH + 1.5, zs)), roofM);
    b.add(boxGeo(V(LX - hw0 - 2, 0, back), V(LX + hw0 + 2, 6, TOWER.z + 0.3)), lam("podium", () => ({ color: "#3a4150" })));
  }
  // old London terraces opposite (south side, facing the street) and either side of the tower
  const brickSet = [7, 2, 7, 0, 6, 7, 3, 2, 7, 6];
  let hx = LX - 70;
  for (let i = 0; hx < LX + 70; i++) {
    const w = 7 + (i % 3), h = 10 + (i % 4) * 1.4;
    house(b, hx + w / 2, 9 + 4, Math.PI, w, 8, h, brickSet[i % brickSet.length], 0.15);
    hx += w + 0.2;
  }
  for (const [xa, xb] of [[LX - 90, LX - 36], [LX + 36, LX + 90]]) {
    let x = xa;
    for (let i = 0; x < xb; i++) { const w = 7 + ((i + 1) % 3), h = 11 + (i % 3) * 1.6; house(b, x + w / 2, -9 - 4, 0, w, 8, h, brickSet[(i + 3) % brickSet.length], 0.15); x += w + 0.2; }
  }
  // shop awning + doormat
  b.add(new THREE.BoxGeometry(4.2, 0.08, 1.6), lam("awning", () => ({ map: stripes("awning", "#f3efe4", "#2d6b4a", 10), side: THREE.DoubleSide })), at(SHOP[0], 3.0, SHOP[2] - 0.6, 0, -0.35));
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.75), lam("doormat", () => ({ map: matTex() })));
  mat.rotation.x = -Math.PI / 2; mat.position.set(SHOP[0], 0.17, SHOP[2] - 0.55); mat.receiveShadow = true; R.add(mat);
  // red phone box + black lamp posts
  b.add(boxGeo(V(LX - 9.5, 0.15, 6.4), V(LX - 8.5, 2.65, 7.4)), lam("phonebox", () => ({ map: phoneTex() })));
  b.add(boxGeo(V(LX - 9.6, 2.65, 6.3), V(LX - 8.4, 2.85, 7.5)), lam("phoneTop", () => ({ color: "#b51c26" })));
  const iron = lam("lampIron", () => ({ color: "#2a2c33" }));
  for (const x of [LX - 24, LX - 2, LX + 20, LX + 42]) { b.add(cyl(0.07, 0.1, 4.6, 10), iron, at(x, 2.45, 5.6)); b.add(boxGeo(V(x - 0.22, 4.6, 5.38), V(x + 0.22, 5.1, 5.82)), lam("lampGlass", () => ({ color: "#f6e7b8" }))); }
  // a few street trees
  [[LX - 32, 6.8], [LX + 28, 6.8], [LX - 46, -6.8]].forEach(([x, z], i) => prop(b, kit, "tree_default", x, 0.15, z, 6 + i, i));

  // ======================= PARK =======================
  b.add(flatUp(PX - 120, PX + 120, -120, 120, 0, 4), lam("parkGrass", () => ({ map: grassHD() })));
  [[PX - 6, -9], [PX + 5, -12], [PX - 12, -4], [PX + 11, -6], [PX - 3, -16], [PX + 16, -14]].forEach(([x, z], i) => prop(b, kit, ["tree_oak", "tree_detailed", "tree_fat", "tree_default"][i % 4], x, 0, z, 6 + (i % 3), i));
  [[PX - 2.5, -2.8], [PX + 3.2, -3.4], [PX - 4.5, 1.5]].forEach(([x, z], i) => prop(b, kit, ["plant_bushDetailed", "plant_bushLarge", "plant_bush"][i], x, 0, z, 0.9, i));
  b.build(R);

  // ======================= dynamic pieces =======================
  const vegasSpot = pool("#fff2c8", 1.1, 4.6, 3.6); vegasSpot.position.set(GUEST[0] + 0.3, 0.02, GUEST[2] - 0.2); R.add(vegasSpot);
  const londonSpot = pool("#fff0c0", 1.05, 5.8, 4.0); londonSpot.position.set(SPOT[0], 0.18, SPOT[2]); R.add(londonSpot);
  const londonSpotCar = pool("#fff0c0", 0.38, 3.6, 1.2); londonSpotCar.rotation.set(0, 0, 0); londonSpotCar.position.set(CAR[0] - 0.2, 0.8, CAR[2] + 0.97); R.add(londonSpotCar);
  const parkDot = pool("#fff6d0", 6, 0.22, 0.22); parkDot.position.set(PX + 0.42, 0.03, 0.55); R.add(parkDot);
  // big umbrella on a wheeled base (shot 7)
  const bigUmbrella = new THREE.Group();
  const bu = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.5, 16, 1, true), umbM); bu.position.y = 4.4; bu.castShadow = true;
  const pole = new THREE.Mesh(cyl(0.09, 0.09, 4.4), frameM); pole.position.y = 2.2; pole.castShadow = true;
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.35, 1.4, 3, 0.1), lam("umbBase", () => ({ color: "#3b3f49" }))); base.position.y = 0.3;
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) { const w = new THREE.Mesh(cyl(0.13, 0.13, 0.1, 12), lam("tyre", () => ({ color: "#1d1e22" }))); w.rotation.x = Math.PI / 2; w.position.set(dx, 0.13, dz); bigUmbrella.add(w); }
  bigUmbrella.add(bu, pole, base); bigUmbrella.visible = false; R.add(bigUmbrella);
  // sunshade fins (shot 16 on): horizontal blades over the upper south face
  const finM = lam("fin", () => ({ color: "#e9ecef" }));
  const fins: THREE.Mesh[] = [];
  for (let k = 0; k < 14; k++) {
    const y = TH * (0.3 + 0.045 * k), hw = hwAt(y), z = southZ(0, y) + 1.6;
    const m = new THREE.Mesh(new THREE.BoxGeometry(2 * hw * 0.92, 0.45, 2.6), finM); m.position.set(LX, y, z); m.castShadow = true; m.visible = false;
    m.userData.home = m.position.clone(); fins.push(m); R.add(m);
  }
  // converging light rays (shot 15): thin glowing tubes from the dished face to the hot spot
  const rays: THREE.Mesh[] = [];
  const rayM = glow("#ffe7a3", 0.55);
  for (let k = 0; k < 16; k++) {
    const y = TH * (0.25 + 0.6 * ((k * 7) % 16) / 16), x = (k % 2 ? 1 : -1) * hwAt(y) * (0.15 + 0.7 * ((k * 5) % 8) / 8);
    const from = V(LX + x, y, southZ(x, y) + 0.5), to = V(SPOT[0], 0.3, SPOT[2]);
    const len = from.distanceTo(to), g = cyl(0.13, 0.13, 1, 6); g.translate(0, 0.5, 0);
    const m = new THREE.Mesh(g, rayM); m.position.copy(from); m.quaternion.setFromUnitVectors(V(0, 1, 0), to.clone().sub(from).normalize());
    m.userData.len = len; m.scale.set(1, 0.001, 1); m.visible = false; m.layers.set(NOINK); rays.push(m); R.add(m);
  }
  // sun glints on both glass faces (dazzle)
  const glints: THREE.Mesh[] = [];
  for (const [p, s] of [[[0, 52, -36], 26], [[LX + 4, 92, TOWER.z + 6], 24]] as const) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: radialTex(), color: new THREE.Color(1.3, 1.2, 1.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.position.set(...(p as unknown as V3)); m.layers.set(NOINK); glints.push(m); R.add(m);
  }

  // ---- the car: a long, low British saloon in racing green (generic, no real badge) ----
  const car = new THREE.Group(); car.position.set(...CAR);
  const paint = twoTone(new THREE.MeshPhongMaterial({ color: "#1f5a43", specular: "#9fb8ac", shininess: 70 }), 0.15);
  const glassC = twoTone(new THREE.MeshPhongMaterial({ color: "#26354a", specular: "#c8d6e6", shininess: 90 }), 0.15);
  const chrome = twoTone(new THREE.MeshPhongMaterial({ color: "#c9cdd3", specular: "#ffffff", shininess: 80 }), 0.2);
  const tyre = lam("tyre", () => ({ color: "#1d1e22" }));
  const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; car.add(o); return o; };
  add(new RoundedBoxGeometry(4.9, 0.62, 1.86, 4, 0.24), paint, 0, 0.6, 0);
  add(new RoundedBoxGeometry(2.4, 0.56, 1.6, 4, 0.22), glassC, -0.35, 1.13, 0);
  add(new RoundedBoxGeometry(2.0, 0.12, 1.5, 3, 0.05), paint, -0.35, 1.43, 0);
  add(new THREE.BoxGeometry(0.06, 0.26, 1.2), lam("grille", () => ({ color: "#202228" })), 2.44, 0.62, 0);
  for (const z of [-0.68, 0.68]) add(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.5) }), 2.42, 0.72, z);
  for (const [x, z] of [[1.55, 0.86], [-1.55, 0.86], [1.55, -0.86], [-1.55, -0.86]]) {
    const w = add(cyl(0.36, 0.36, 0.28, 18), tyre, x, 0.36, z); w.rotation.x = Math.PI / 2;
    const hb = add(cyl(0.2, 0.2, 0.3, 14), chrome, x, 0.36, z); hb.rotation.x = Math.PI / 2;
  }
  const panel = add(new THREE.BoxGeometry(2.0, 0.42, 0.02), paint, -0.4, 0.62, 0.935);
  const badge = add(cyl(0.085, 0.085, 0.03, 18), chrome, 2.36, 0.78, 0); badge.rotation.z = Math.PI / 2;
  const mirror = new THREE.Group(); mirror.position.set(0.95, 1.05, 0.86); car.add(mirror);
  const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.16), paint); stalk.position.set(0, 0, 0.08); mirror.add(stalk);
  const housing = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.15, 0.1, 2, 0.03), paint); housing.position.set(-0.02, 0.02, 0.2); housing.castShadow = true; mirror.add(housing);
  const glassM2 = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.1), chrome); glassM2.position.set(-0.13, 0.02, 0.2); glassM2.rotation.y = -Math.PI / 2; mirror.add(glassM2);
  const mL = mirror.clone(); mL.position.z = -0.86; mL.scale.z = -1; car.add(mL);
  R.add(car);

  // frying pan on the pavement (shots 12-13)
  const panGroup = new THREE.Group(); panGroup.position.set(...PAN);
  const iron2 = twoTone(new THREE.MeshPhongMaterial({ color: "#2b2b31", specular: "#777", shininess: 40 }), 0.15);
  const panM = new THREE.Mesh(cyl(0.26, 0.22, 0.06, 28), iron2); panM.position.y = 0.2; panM.castShadow = true;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.05), iron2); handle.position.set(0.44, 0.22, 0); handle.rotation.z = 0.08;
  panGroup.add(panM, handle); panGroup.visible = false; R.add(panGroup);

  return { vegasSpot, londonSpot, londonSpotCar, parkDot, bigUmbrella, fins, rays, glints, car: { root: car, mirror, badge, panel }, panGroup };
};
