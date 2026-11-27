// The Munich hotel and its city, built around the origin:
//  - the 5th-floor bathroom (floor y = HB): tiles, a walk-in shower behind a glass panel, the chrome slide rail with the
//    moving shower head, vanity and mirror, a glowing ceiling lamp, the open street window the camera flies out of
//  - the hotel facade (z = FACADE_Z) with that window cut out, the street below (wet asphalt, lamps, a taxi)
//  - the old town by night (lit windows that bloom) and a floodlit twin-domed cathedral; a moonlit cloud deck above
import * as THREE from "three";
import { Batch, V, lam, boxGeo, quad, tri } from "../bridge/build";
import { ctex, rep, rng, roofHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { M, MS, cyl, basic, hdr, glow } from "./kit";
import { HB, BATH, RAIL, WIN, FACADE_Z, CHURCH, CLOUD_Y } from "./story";

// ---------------- textures ----------------
const tileTex = () => ctex("bathTile", 512, 512, (g, r) => {
  // 15 cm glossy white tiles, pale grout, a soft sheen per tile (1 m = 512 px / 1.5)
  g.fillStyle = "#c9d6d4"; g.fillRect(0, 0, 512, 512);
  const n = 10, s = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = r() * 14, gr = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
    gr.addColorStop(0, `rgb(${52 + v},${108 + v},${112 + v})`); gr.addColorStop(1, `rgb(${34 + v},${82 + v},${88 + v})`);
    g.fillStyle = gr; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
    g.fillStyle = "rgba(220,255,250,0.35)"; g.fillRect(i * s + 6, j * s + 6, s * 0.35, 3);
  }
});
const mosaicTex = () => ctex("bathMosaic", 512, 128, (g, r) => {
  g.fillStyle = "#1d2a44"; g.fillRect(0, 0, 512, 128);
  for (let x = 0; x < 512; x += 16) for (let y = 0; y < 128; y += 16) { const k = r(); g.fillStyle = k < 0.3 ? "#2c4f86" : k < 0.6 ? "#3a6aa8" : k < 0.8 ? "#5a8ac0" : "#1a3a6a"; g.fillRect(x + 1.5, y + 1.5, 13, 13); }
});
const floorTex = () => ctex("bathFloor", 512, 512, (g, r) => {
  g.fillStyle = "#9aa0aa"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 512; x += 32) { const v = 150 + r() * 30; g.fillStyle = `rgb(${v},${v + 3},${v + 8})`; g.beginPath(); g.arc(x + 16, y + 16, 13.5, 0, 7); g.fill(); }
});
const steamGlassTex = () => ctex("steamGlass", 256, 512, (g, r) => {
  // clear at the top, fogged toward the bottom, with drips running down through the fog
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "rgba(230,240,255,0.04)"); gr.addColorStop(0.45, "rgba(232,238,248,0.1)"); gr.addColorStop(0.66, "rgba(236,240,248,0.42)"); gr.addColorStop(1, "rgba(240,244,250,0.6)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 26; i++) { const x = r() * 256, y0 = 230 + r() * 120, len = 60 + r() * 200; g.strokeStyle = "rgba(160,180,210,0.35)"; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (r() - 0.5) * 6, y0 + len); g.stroke(); g.fillStyle = "rgba(200,215,240,0.6)"; g.beginPath(); g.arc(x, y0 + len, 3, 0, 7); g.fill(); }
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.3})`; g.beginPath(); g.arc(r() * 256, 200 + r() * 312, 1 + r() * 2.5, 0, 7); g.fill(); }
});
const mirrorTex = () => ctex("bathMirror", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, "#c8d6e8"); gr.addColorStop(0.5, "#9fb2cc"); gr.addColorStop(1, "#7f92b0");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(30, 256); g.lineTo(90, 0); g.lineTo(120, 0); g.lineTo(60, 256); g.fill();
  g.fillStyle = "rgba(230,236,246,0.5)"; g.fillRect(0, 170, 256, 86); // steamed lower half
});
/** night facade: plaster, cornices between floors, a window grid (some lit). `lit` = the emissive map of the same layout */
const nightFacade = (key: string, wm: number, hm: number, wall: string, seed: number, lit: boolean, opts: { floorH?: number; colX0?: number; colStep?: number; litFrac?: number; skip?: [number, number] } = {}) =>
  ctex(`nf_${key}_${lit ? "e" : "d"}`, Math.min(1024, Math.round(wm * 40)), Math.min(1024, Math.round(hm * 40)), (g) => {
    const W = g.canvas.width, H = g.canvas.height, sx = W / wm, sy = H / hm, R = rng(seed);
    const fh = opts.floorH ?? 3.04, cx0 = opts.colX0 ?? 1.6, cs = opts.colStep ?? 3.0, lf = opts.litFrac ?? 0.45;
    if (!lit) {
      g.fillStyle = wall; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "0,0,0" : "255,255,255"},${0.03 + R() * 0.03})`; g.fillRect(R() * W, R() * H, 2 + R() * 6, 2 + R() * 6); }
      for (let fl = 1; fl * fh < hm; fl++) { g.fillStyle = "rgba(0,0,0,0.16)"; g.fillRect(0, H - fl * fh * sy - 0.12 * sy, W, 0.18 * sy); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(0, H - fl * fh * sy - 0.3 * sy, W, 0.12 * sy); }
    } else { g.fillStyle = "#000000"; g.fillRect(0, 0, W, H); }
    for (let fl = 0; (fl + 1) * fh <= hm + 0.01; fl++) for (let cx = cx0; cx + 0.6 < wm; cx += cs) {
      const on = R() < lf, curtain = R(), x = (cx - 0.55) * sx, y = H - (fl * fh + 2.45) * sy, w = 1.1 * sx, h = 1.45 * sy;
      if (fl === 0 && R() < 0.4) continue;
      if (opts.skip && Math.abs(cx - opts.skip[0]) < 0.2 && fl === opts.skip[1]) { if (!lit) { g.fillStyle = "#0a0c14"; g.fillRect(x, y, w, h); } continue; }
      if (!lit) {
        g.fillStyle = "#e9e2d2"; g.fillRect(x - 0.08 * sx, y - 0.08 * sy, w + 0.16 * sx, h + 0.16 * sy);
        if (on) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "#ffd99a"); gr.addColorStop(1, "#f0a95a"); g.fillStyle = gr; }
        else g.fillStyle = "#151b2c";
        g.fillRect(x, y, w, h);
        if (on && curtain < 0.6) { g.fillStyle = "rgba(190,110,60,0.55)"; g.fillRect(x, y, w * 0.28, h); g.fillRect(x + w * 0.72, y, w * 0.28, h); }
        if (!on) { g.fillStyle = "rgba(120,140,190,0.18)"; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.4, y); g.lineTo(x + w * 0.6, y); g.lineTo(x + w * 0.2, y + h); g.fill(); }
        g.fillStyle = "#e9e2d2"; g.fillRect(x + w / 2 - 0.04 * sx, y, 0.08 * sx, h); g.fillRect(x, y + h * 0.38, w, 0.07 * sy);
        g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x - 0.12 * sx, y + h + 0.08 * sy, w + 0.24 * sx, 0.1 * sy);
      } else if (on) {
        g.fillStyle = curtain < 0.6 ? "#7a5a3a" : "#c89860"; g.fillRect(x, y, w, h);
        if (curtain < 0.6) { g.fillStyle = "#2a1c12"; g.fillRect(x, y, w * 0.28, h); g.fillRect(x + w * 0.72, y, w * 0.28, h); }
        g.fillStyle = "#000"; g.fillRect(x + w / 2 - 0.04 * sx, y, 0.08 * sx, h); g.fillRect(x, y + h * 0.38, w, 0.07 * sy);
      }
    }
  });
const asphaltTex = () => ctex("wetAsphalt", 1024, 1024, (g, r) => {
  g.fillStyle = "#1c1f28"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { const v = 20 + r() * 26; g.fillStyle = `rgba(${v},${v + 2},${v + 8},0.5)`; g.fillRect(r() * 1024, r() * 1024, 2, 2); }
  for (let i = 0; i < 26; i++) { const x = r() * 1024, y = r() * 1024; const gr = g.createRadialGradient(x, y, 0, x, y, 40 + r() * 90); gr.addColorStop(0, "rgba(120,130,170,0.22)"); gr.addColorStop(1, "rgba(120,130,170,0)"); g.fillStyle = gr; g.fillRect(x - 130, y - 130, 260, 260); }
  g.fillStyle = "rgba(230,230,240,0.55)"; for (let y = 0; y < 1024; y += 128) g.fillRect(506, y, 12, 64); // centre dashes
});
const paverTex = () => ctex("pavers", 512, 512, (g, r) => {
  g.fillStyle = "#3a3c46"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) { const v = 70 + r() * 24; g.fillStyle = `rgb(${v},${v + 2},${v + 8})`; g.fillRect(x + 3, y + 3, 58, 58); }
});
const brickNightTex = () => ctex("cathBrick", 512, 1024, (g, r) => {
  g.fillStyle = "#9a4a34"; g.fillRect(0, 0, 512, 1024);
  for (let y = 0; y < 1024; y += 12) for (let x = (y / 12) % 2 ? -12 : 0; x < 512; x += 24) { const v = r(); g.fillStyle = `rgb(${150 + v * 40},${70 + v * 22},${50 + v * 16})`; g.fillRect(x + 1, y + 1, 22, 10); }
  for (const cx of [128, 384]) { g.fillStyle = "#2a1c22"; g.fillRect(cx - 34, 180, 68, 520); g.beginPath(); g.arc(cx, 180, 34, Math.PI, 0); g.fill(); g.fillStyle = "#e9a95a"; g.fillRect(cx - 4, 160, 8, 540); }
});

// ---------------- pieces ----------------
/** a quad on the plane z = zc (facing +z when `front`), UVs taken from a facade texture spanning [fx0, fx0 + fw] x [0, fh] */
const facePiece = (x0: number, x1: number, y0: number, y1: number, zc: number, fx0: number, fw: number, fh: number) =>
  quad(V(x0, y0, zc), V(x1, y0, zc), V(x1, y1, zc), V(x0, y1, zc), (x1 - fx0) / fw, y1 / fh, (x0 - fx0) / fw, y0 / fh);

type Block = { x0: number; x1: number; z0: number; z1: number; h: number; wall: string; seed: number };
/** a city building: night facades on all four sides (lit windows bloom), a pitched roof along its longer side */
const block = (b: Batch, k: Block) => {
  const w = k.x1 - k.x0, d = k.z1 - k.z0, h = k.h;
  const mat = (wm: number, side: string) => {
    const key = `${k.seed}_${side}_${Math.round(wm)}_${Math.round(h)}`;
    return lam("blk" + key, () => ({ map: nightFacade(key, wm, h, k.wall, k.seed * 7 + side.length, false), emissiveMap: nightFacade(key, wm, h, k.wall, k.seed * 7 + side.length, true), emissive: hdr("#ffffff", 1.7) }));
  };
  b.add(quad(V(k.x1, 0, k.z0), V(k.x0, 0, k.z0), V(k.x0, h, k.z0), V(k.x1, h, k.z0)), mat(w, "s"));  // faces -z (toward the hotel)
  b.add(quad(V(k.x0, 0, k.z1), V(k.x1, 0, k.z1), V(k.x1, h, k.z1), V(k.x0, h, k.z1)), mat(w, "n"));
  b.add(quad(V(k.x0, 0, k.z0), V(k.x0, 0, k.z1), V(k.x0, h, k.z1), V(k.x0, h, k.z0)), mat(d, "w"));
  b.add(quad(V(k.x1, 0, k.z1), V(k.x1, 0, k.z0), V(k.x1, h, k.z0), V(k.x1, h, k.z1)), mat(d, "e"));
  const roof = lam("cityRoof" + (k.seed % 2), () => ({ map: rep(roofHD(k.seed % 2 ? "#7a4a3a" : "#4e4a52", k.seed % 2 === 0), Math.max(1, w / 8), 1), side: THREE.DoubleSide }));
  const rh = Math.min(w, d) * 0.45;
  if (w >= d) { // ridge along x
    const zc = (k.z0 + k.z1) / 2;
    b.add(quad(V(k.x1, h, k.z0), V(k.x0, h, k.z0), V(k.x0, h + rh, zc), V(k.x1, h + rh, zc)), roof);
    b.add(quad(V(k.x0, h, k.z1), V(k.x1, h, k.z1), V(k.x1, h + rh, zc), V(k.x0, h + rh, zc)), roof);
    const gable = lam("gable" + k.wall, () => ({ color: k.wall }));
    b.add(tri(V(k.x0, h, k.z0), V(k.x0, h, k.z1), V(k.x0, h + rh, zc)), gable);
    b.add(tri(V(k.x1, h, k.z1), V(k.x1, h, k.z0), V(k.x1, h + rh, zc)), gable);
  } else {
    const xc = (k.x0 + k.x1) / 2;
    b.add(quad(V(k.x0, h, k.z0), V(k.x0, h, k.z1), V(xc, h + rh, k.z1), V(xc, h + rh, k.z0)), roof);
    b.add(quad(V(k.x1, h, k.z1), V(k.x1, h, k.z0), V(xc, h + rh, k.z0), V(xc, h + rh, k.z1)), roof);
  }
};

export type HotelSet = { head: THREE.Group; spray: THREE.Object3D; cars: THREE.Object3D[]; lampGlows: THREE.Sprite[]; casement: THREE.Object3D; taxi: THREE.Group };

export const buildHotel = (R: THREE.Object3D): HotelSet => {
  const b = new Batch();
  const { x0, x1, z0, z1, h } = BATH, y0 = HB;
  // ---- bathroom shell ----
  const tile = lam("bathTile", () => ({ map: rep(tileTex(), 1, 1) }));
  const tileW = (w: number, hh: number) => lam(`bathTile_${w.toFixed(2)}_${hh.toFixed(2)}`, () => ({ map: rep(tileTex(), w / 1.5, hh / 1.5) }));
  b.add(boxGeo(V(x0 - 0.15, y0 - 0.2, z0 - 0.15), V(x1 + 0.15, y0, z1 + 0.15), 0), lam("bathFloor", () => ({ map: rep(floorTex(), 3, 3) })));
  b.add(boxGeo(V(x0 - 0.15, y0 + h, z0 - 0.15), V(x1 + 0.15, y0 + h + 0.2, z1 + 0.15), 0), lam("bathCeil", () => ({ color: "#eef0f4" })));
  b.add(boxGeo(V(x0 - 0.15, y0, z0 - 0.15), V(x1 + 0.15, y0 + h, z0), 0), tileW(x1 - x0 + 0.3, h));          // back (shower) wall
  b.add(boxGeo(V(x0 - 0.15, y0, z0), V(x0, y0 + h, z1), 0), tileW(z1 - z0, h));                               // left wall
  b.add(boxGeo(V(x1, y0, z0), V(x1 + 0.15, y0 + h, z1), 0), tileW(z1 - z0, h));                               // right wall (vanity)
  const wx0 = WIN.x - WIN.w / 2, wx1 = WIN.x + WIN.w / 2;
  for (const [a0, a1, c0, c1] of [[x0 - 0.15, wx0, y0, y0 + h], [wx1, x1 + 0.15, y0, y0 + h], [wx0, wx1, y0, WIN.y0], [wx0, wx1, WIN.y1, y0 + h]])
    b.add(boxGeo(V(a0, c0, z1), V(a1, c1, z1 + 0.02), 0), tileW(Math.max(0.2, a1 - a0), Math.max(0.2, c1 - c0)));  // street wall around the window
  const band = lam("bathMosaic", () => ({ map: rep(mosaicTex(), 3, 1) }));
  for (const [ax, az, bx, bz] of [[x0, z0 + 0.01, x1, z0 + 0.01], [x0 + 0.01, z0, x0 + 0.01, z1], [x1 - 0.01, z1, x1 - 0.01, z0]] as const)
    b.add(quad(V(ax, y0 + 1.18, az), V(bx, y0 + 1.18, bz), V(bx, y0 + 1.3, bz), V(ax, y0 + 1.3, az)), band);
  // ---- shower: tray, glass panel, rail, mixer, hose ----
  const chrome = lam("chrome", () => ({ color: "#d9dee6" }));
  const white = lam("ceramic", () => ({ color: "#f4f6fa" }));
  b.add(boxGeo(V(x0, y0, z0), V(-0.2, y0 + 0.06, 4.55), 0), white);
  b.add(cyl(0.016, 0.016, RAIL.y1 - RAIL.y0, 10), chrome, M(RAIL.x, (RAIL.y0 + RAIL.y1) / 2, RAIL.z + 0.06));
  for (const yy of [RAIL.y0, RAIL.y1]) b.add(boxGeo(V(RAIL.x - 0.025, yy - 0.025, RAIL.z), V(RAIL.x + 0.025, yy + 0.025, RAIL.z + 0.07), 0), chrome);
  b.add(boxGeo(V(RAIL.x - 0.12, y0 + 0.98, RAIL.z), V(RAIL.x + 0.12, y0 + 1.08, RAIL.z + 0.07), 0), chrome);             // mixer bar
  for (const sd of [-1, 1]) b.add(cyl(0.03, 0.03, 0.05, 12).rotateX(Math.PI / 2), lam(sd < 0 ? "knobHot" : "knobCold", () => ({ color: sd < 0 ? "#c0303a" : "#2c5f9a" })), M(RAIL.x + sd * 0.12, y0 + 1.03, RAIL.z + 0.09));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.95), new THREE.MeshBasicMaterial({ map: steamGlassTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  glass.position.set(x0 + 1.0, y0 + 0.06 + 0.975, 4.55); glass.layers.set(NOINK); glass.renderOrder = 2; R.add(glass);   // frameless glass (no edge across his face)
  // ---- vanity, mirror, towel, light ----
  b.add(boxGeo(V(x1 - 0.5, y0, 4.5), V(x1, y0 + 0.82, 5.5), 0), lam("vanityWood", () => ({ color: "#7a5a3e" })));
  b.add(boxGeo(V(x1 - 0.52, y0 + 0.82, 4.48), V(x1, y0 + 0.88, 5.52), 0), white);
  b.add(cyl(0.2, 0.16, 0.1, 20), white, M(x1 - 0.26, y0 + 0.9, 5.0));
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), lam("bathMirror", () => ({ map: mirrorTex() })));
  mirror.position.set(x1 - 0.005, y0 + 1.45, 5.0); mirror.rotation.y = -Math.PI / 2; R.add(mirror);
  const lampBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.7), basic("vanityLamp", () => ({ color: hdr("#fff1d8", 2.6) })));
  lampBar.position.set(x1 - 0.04, y0 + 1.95, 5.0); lampBar.layers.set(NOINK); R.add(lampBar);
  b.add(cyl(0.012, 0.012, 0.6, 8).rotateX(Math.PI / 2), chrome, M(-0.2, y0 + 1.25, z1 - 0.05 - 0.0));
  b.add(boxGeo(V(0.25, y0 + 0.75, z1 - 0.09), V(0.55, y0 + 1.3, z1 - 0.03), 0), lam("towel", () => ({ map: ctex("towelTex", 64, 128, (g) => { g.fillStyle = "#f4f2ee"; g.fillRect(0, 0, 64, 128); g.fillStyle = "#2c4f86"; g.fillRect(0, 96, 64, 10); g.fillRect(0, 112, 64, 4); }) })));
  const ceilLamp = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), basic("ceilLamp", () => ({ color: hdr("#fff4e0", 3.0) })));
  ceilLamp.rotation.x = Math.PI / 2; ceilLamp.position.set(0.1, y0 + h - 0.01, 4.6); ceilLamp.layers.set(NOINK); R.add(ceilLamp);
  // ---- the window: frame, open casement, the facade around it ----
  const frame = lam("winFrame", () => ({ color: "#f2efe8" }));
  b.add(boxGeo(V(wx0 - 0.06, WIN.y0 - 0.06, z1 - 0.02), V(wx1 + 0.06, WIN.y0, FACADE_Z + 0.04), 0), frame);
  b.add(boxGeo(V(wx0 - 0.06, WIN.y1, z1 - 0.02), V(wx1 + 0.06, WIN.y1 + 0.06, FACADE_Z + 0.04), 0), frame);
  for (const xx of [wx0 - 0.06, wx1]) b.add(boxGeo(V(xx, WIN.y0, z1 - 0.02), V(xx + 0.06, WIN.y1, FACADE_Z + 0.04), 0), frame);
  const casement = new THREE.Group(); casement.position.set(wx1, 0, z1 - 0.01);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w * 0.96, WIN.y1 - WIN.y0 - 0.06), new THREE.MeshBasicMaterial({ map: steamGlassTex(), transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  pane.position.set(-WIN.w * 0.48, (WIN.y0 + WIN.y1) / 2, 0); pane.layers.set(NOINK); casement.add(pane);
  const sash = new THREE.Mesh(new THREE.BoxGeometry(WIN.w * 0.98, 0.05, 0.05), frame); sash.position.set(-WIN.w * 0.48, WIN.y1 - 0.03, 0); casement.add(sash);
  const sash2 = sash.clone(); sash2.position.y = WIN.y0 + 0.03; casement.add(sash2);
  casement.rotation.y = -2.0; R.add(casement); // swung wide open into the room, out of the camera's path
  // hotel facade (24 m x 21.5 m), the bathroom window column aligned with the painted grid
  const FX0 = -12.05, FW = 24, FH = 21.5;
  const hotelWall = "#d9c7a4";
  const hotelMat = lam("hotelFacade", () => ({ map: nightFacade("hotel", FW, FH, hotelWall, 41, false, { colX0: WIN.x - FX0, colStep: 3.0, litFrac: 0.4, skip: [WIN.x - FX0, 5] }),
    emissiveMap: nightFacade("hotel", FW, FH, hotelWall, 41, true, { colX0: WIN.x - FX0, colStep: 3.0, litFrac: 0.4, skip: [WIN.x - FX0, 5] }), emissive: hdr("#ffffff", 1.6) }));
  for (const [a0, a1, c0, c1] of [[FX0, wx0, 0, FH], [wx1, FX0 + FW, 0, FH], [wx0, wx1, 0, WIN.y0], [wx0, wx1, WIN.y1, FH]])
    b.add(facePiece(a0, a1, c0, c1, FACADE_Z, FX0, FW, FH), hotelMat);
  b.add(boxGeo(V(FX0, 0, -14), V(FX0 + FW, FH, FACADE_Z - 0.01), 0), lam("hotelBack", () => ({ color: hotelWall })));
  b.add(boxGeo(V(FX0 - 0.3, FH, -14.3), V(FX0 + FW + 0.3, FH + 0.6, FACADE_Z + 0.4), 0), lam("cornice", () => ({ color: "#bfae8c" })));
  for (const yy of [3.04, 15.2 - 0.04]) b.add(boxGeo(V(FX0 - 0.1, yy - 0.15, FACADE_Z), V(FX0 + FW + 0.1, yy, FACADE_Z + 0.22), 0), lam("cornice", () => ({ color: "#bfae8c" })));
  // ground floor: entrance with warm glass doors and a canopy
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), basic("hotelDoor", () => ({ map: ctex("hotelDoorTex", 128, 104, (g) => { const gr = g.createLinearGradient(0, 0, 0, 104); gr.addColorStop(0, "#ffe2b0"); gr.addColorStop(1, "#e8a860"); g.fillStyle = gr; g.fillRect(0, 0, 128, 104); g.fillStyle = "#3a2a20"; g.fillRect(62, 0, 4, 104); g.fillRect(0, 0, 4, 104); g.fillRect(124, 0, 4, 104); }), color: hdr("#ffffff", 1.6) })));
  doorGlow.position.set(-4.0, 1.3, FACADE_Z + 0.02); doorGlow.layers.set(NOINK); R.add(doorGlow);
  b.add(boxGeo(V(-6.2, 2.9, FACADE_Z), V(-1.8, 3.05, FACADE_Z + 2.2), 0), lam("canopy", () => ({ color: "#6a1f2b" })));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), basic("hotelSign", () => ({ map: ctex("hotelSignTex", 360, 90, (g) => { g.fillStyle = "#1a1418"; g.fillRect(0, 0, 360, 90); g.fillStyle = "#ffd27a"; g.font = "bold 64px Georgia, serif"; g.textAlign = "center"; g.fillText("HOTEL", 180, 70); }), color: hdr("#ffffff", 2.0) })));
  sign.position.set(-4.0, 3.6, FACADE_Z + 0.06); sign.layers.set(NOINK); R.add(sign);
  // ---- street: sidewalks, wet asphalt, lamps ----
  b.add(boxGeo(V(-90, -0.2, FACADE_Z), V(90, 0.12, 9.2), 0), lam("pavers", () => ({ map: rep(paverTex(), 45, 1.5) })));
  b.add(boxGeo(V(-90, -0.25, 9.2), V(90, 0.0, 19.2), 0), lam("wetAsphalt", () => ({ map: rep(asphaltTex(), 18, 2) })));
  b.add(boxGeo(V(-90, -0.2, 19.2), V(90, 0.12, 22), 0), lam("pavers", () => ({ map: rep(paverTex(), 45, 1.5) })));
  const pole = lam("lampPole", () => ({ color: "#1c1e24" }));
  const lampGlows: THREE.Sprite[] = [];
  for (let x = -75; x <= 75; x += 15) for (const zz of [8.7, 19.8]) {
    b.add(cyl(0.07, 0.09, 4.6, 8), pole, M(x + (zz > 10 ? 7 : 0), 2.3, zz));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.32), basic("lampHead", () => ({ color: hdr("#ffcf88", 3.2) })));
    head.position.set(x + (zz > 10 ? 7 : 0), 4.75, zz); head.layers.set(NOINK); R.add(head);
    const gl = glow("#ffb868", 3.2, 1.2); gl.position.copy(head.position); R.add(gl); lampGlows.push(gl);
  }
  // a cream taxi waiting at the door
  const taxi = new THREE.Group(), tb = new Batch(), cream = lam("taxiCream", () => ({ color: "#efe4c4" })), dark = lam("taxiGlass", () => ({ color: "#20242e" }));
  tb.add(boxGeo(V(-2.3, 0.35, -0.9), V(2.3, 1.05, 0.9), 0), cream); tb.add(boxGeo(V(-1.2, 1.05, -0.82), V(1.1, 1.55, 0.82), 0), dark);
  tb.add(boxGeo(V(-0.2, 1.55, -0.18), V(0.3, 1.72, 0.18), 0), lam("taxiSign", () => ({ color: "#f2c94c" })));
  for (const [wx, wz] of [[-1.5, -0.92], [1.5, -0.92], [-1.5, 0.92], [1.5, 0.92]]) tb.add(cyl(0.34, 0.34, 0.22, 16).rotateX(Math.PI / 2), lam("tyre", () => ({ color: "#15161a" })), M(wx, 0.34, wz));
  tb.build(taxi); taxi.position.set(-9, 0, 11); R.add(taxi);
  // ---- the old town across the street and beyond ----
  const walls = ["#d8c4a2", "#c9b49a", "#e0d2b8", "#bba78f", "#d2b892", "#c4cad2"];
  let seed = 3;
  for (let x = -60; x < 70; x += 14) { const w = 11 + (seed % 3) * 1.5; block(b, { x0: x, x1: x + w, z0: 22.5, z1: 34, h: 13 + (seed % 4) * 1.6, wall: walls[seed % 6], seed: seed++ }); }
  const R2 = rng(77);
  for (let gz = 46; gz < 420; gz += 30) for (let gx = -150; gx < 260; gx += 28) {
    if (Math.abs(gx + 14 - CHURCH[0]) < 70 && Math.abs(gz + 12 - CHURCH[2]) < 70) continue;
    const w = 14 + R2() * 10, d = 12 + R2() * 8, hh = 12 + Math.floor(R2() * 4) * 2.5;
    block(b, { x0: gx, x1: gx + w, z0: gz, z1: gz + d, h: hh, wall: walls[seed % 6], seed: seed++ });
  }
  // ---- the cathedral: red brick nave, twin towers with green domes, floodlit ----
  const brick = lam("cathBrick", () => ({ map: rep(brickNightTex(), 4, 2), emissive: hdr("#ff9a50", 0.12) }));
  const [cxx, , czz] = CHURCH;
  b.add(boxGeo(V(cxx - 20, 0, czz), V(cxx + 20, 34, czz + 95), 0), brick);
  b.add(quad(V(cxx - 20, 34, czz), V(cxx - 20, 34, czz + 95), V(cxx, 58, czz + 95), V(cxx, 58, czz)), lam("cathRoof", () => ({ map: rep(roofHD("#7a3a2e"), 10, 3), side: THREE.DoubleSide })));
  b.add(quad(V(cxx + 20, 34, czz + 95), V(cxx + 20, 34, czz), V(cxx, 58, czz), V(cxx, 58, czz + 95)), lam("cathRoof", () => ({ map: rep(roofHD("#7a3a2e"), 10, 3), side: THREE.DoubleSide })));
  const copper = lam("copperDome", () => ({ color: "#4f9a86" }));
  for (const sd of [-1, 1]) {
    const tx = cxx + sd * 12.5, tz = czz - 6;
    b.add(boxGeo(V(tx - 6.5, 0, tz - 6.5), V(tx + 6.5, 70, tz + 6.5), 0), brick);
    b.add(cyl(6.2, 6.6, 12, 8), brick, M(tx, 76, tz));
    const dome = new THREE.SphereGeometry(6.4, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62); dome.scale(1, 1.35, 1);
    b.add(dome, copper, M(tx, 82, tz));
    b.add(cyl(0.6, 1.6, 6, 10), copper, M(tx, 92.5, tz));
    b.add(new THREE.SphereGeometry(0.9, 12, 8), lam("gilt", () => ({ color: "#e8c45a" })), M(tx, 96.2, tz));
    const fl = glow("#ffb070", 44, 0.55); fl.position.set(tx, 18, tz - 14); R.add(fl);
  }
  b.build(R);
  // shower head: chrome disc on a slider bracket (moves on the rail), a water spray cone under it
  const head = new THREE.Group(), hb2 = new Batch();
  hb2.add(boxGeo(V(-0.035, -0.035, 0), V(0.035, 0.035, 0.07), 0), chrome);
  hb2.add(cyl(0.012, 0.012, 0.16, 8).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), chrome, M(0, 0, 0.13));
  hb2.add(cyl(0.065, 0.05, 0.03, 24).rotateX(Math.PI / 2), chrome, M(0, 0, 0.22));
  hb2.add(new THREE.CircleGeometry(0.058, 24), lam("headFace", () => ({ map: ctex("headFaceTex", 64, 64, (g) => { g.fillStyle = "#aab2bc"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#3a3f48"; for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = 4 + (i % 5) * 5.5; g.beginPath(); g.arc(32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr, 1.6, 0, 7); g.fill(); } }) })), M(0, 0, 0.236));
  hb2.build(head); head.position.set(RAIL.x, RAIL.y0 + 0.4, RAIL.z + 0.02); R.add(head);
  const sprayGeo = new THREE.ConeGeometry(0.2, 1.3, 20, 1, true); sprayGeo.translate(0, -0.65, 0);
  const spray = new THREE.Mesh(sprayGeo, new THREE.MeshBasicMaterial({ map: ctex("sprayTex", 128, 256, (g, r) => { g.clearRect(0, 0, 128, 256); for (let i = 0; i < 70; i++) { const x = r() * 128; g.strokeStyle = `rgba(220,235,255,${0.2 + r() * 0.35})`; g.lineWidth = 1 + r(); g.beginPath(); g.moveTo(x, r() * 40); g.lineTo(x, 60 + r() * 196); g.stroke(); } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending }));
  spray.layers.set(NOINK); spray.renderOrder = 3; R.add(spray);
  // distant car lights crawling along the old-town streets
  const cars: THREE.Object3D[] = [];
  for (let i = 0; i < 14; i++) { const gl = glow(i % 3 ? "#ffd9a0" : "#ff5040", 2.2, 1.4); gl.userData = { lane: 40 + (i % 7) * 30, x0: -150 + i * 31, v: (i % 2 ? 1 : -1) * (5 + (i % 4)) }; R.add(gl); cars.push(gl); }
  // moonlit cloud deck the crane rises into
  const cloudMat = (k: number) => new THREE.MeshBasicMaterial({ map: ctex("nightCloud" + k, 512, 256, (g, r) => { g.clearRect(0, 0, 512, 256); for (let i = 0; i < 60; i++) { const x = 60 + r() * 392, y = 70 + r() * 120, rr = 30 + r() * 70; const gr = g.createRadialGradient(x, y - rr * 0.3, 0, x, y, rr); gr.addColorStop(0, "rgba(214,222,244,0.9)"); gr.addColorStop(0.6, "rgba(150,162,198,0.55)"); gr.addColorStop(1, "rgba(90,100,140,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); } }), transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const C = rng(9);
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cloudMat(i % 4)), s = 120 + C() * 160;
    m.scale.set(s, s * 0.5, 1); m.position.set(-120 + C() * 320, CLOUD_Y + C() * 70, 40 + C() * 320); m.rotation.set(-Math.PI / 2 + (C() - 0.5) * 0.5, 0, C() * 6.28);
    m.layers.set(NOINK); R.add(m);
  }
  return { head, spray, cars, lampGlows, casement, taxi };
};
