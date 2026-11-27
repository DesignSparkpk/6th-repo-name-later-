// Small shared building helpers for the Hubble sets (same conventions as the Plimsoll sets: painted canvas textures,
// two-tone lambert via lam(), merged Batches, NOINK for glows that must not get ink lines).
import * as THREE from "three";
import { V } from "../bridge/build";
import { NOINK } from "../bridge/ink";

export const M = (x: number, y: number, z: number, ry = 0, rx = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(s, s, s));
export const MS = (x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));
export const cyl = (r0: number, r1: number, h: number, n = 16, open = false) => new THREE.CylinderGeometry(r0, r1, h, n, 1, open);
const basicCache = new Map<string, THREE.MeshBasicMaterial>();
/** unlit material, cached; colour may exceed 1 (it then blooms) */
export const basic = (key: string, make: () => THREE.MeshBasicMaterialParameters) => {
  const c = basicCache.get(key); if (c) return c;
  const m = new THREE.MeshBasicMaterial(make()); basicCache.set(key, m); return m;
};
/** an HDR colour for emissive lamps / screens: hex x gain (gain > 1 blooms) */
export const hdr = (hex: string, gain: number) => new THREE.Color(hex).multiplyScalar(gain);
/** additive soft glow sprite texture (radial falloff) */
let glowTex: THREE.CanvasTexture | null = null;
export const glowTexture = () => {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.55)"); gr.addColorStop(0.6, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace; return glowTex;
};
/** a camera-facing additive glow (lamp halo, sun, flame) */
export const glow = (col: THREE.ColorRepresentation, size: number, gain = 1.5) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color(col).multiplyScalar(gain), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  s.scale.set(size, size, 1); s.layers.set(NOINK); return s;
};
/** plain quad mesh facing +z, centred */
export const plane = (w: number, h: number, mat: THREE.Material) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
/** soft-edged additive light shaft (a cone of dust in a beam) from `from` to `to` */
export const shaft = (from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, col: THREE.ColorRepresentation, opacity: number) => {
  const len = from.distanceTo(to), g = new THREE.CylinderGeometry(r0, r1, len, 24, 1, true);
  g.translate(0, -len / 2, 0); g.rotateX(-Math.PI / 2);
  const tex = (() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 256; const x = c.getContext("2d")!;
    const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(c); return t;
  })();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.copy(from); m.lookAt(to); m.layers.set(NOINK); return m;
};
