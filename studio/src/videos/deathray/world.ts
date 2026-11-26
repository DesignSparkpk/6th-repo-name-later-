// One three.js scene for the whole film (three sets far apart), posed per frame: update(id, f, camera) is a pure
// function of shot + frame. Light rig, sky, fog, cards and effects follow the bridge template's world.ts.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Kit, V } from "../bridge/build";
import { cloudHD } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { buildSets, Sets } from "./sets";
import { stage } from "./cast";
import { FPS, SHOTS, camAt, ShotDef, T, meltAt, londonSpot, GUEST, smooth, clamp01 } from "./story";

const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree", "plant_bushLarge", "plant_bushDetailed", "plant_bush", "hedge", "lantern"];
const PALMS = ["tree_palm", "tree_palmTall", "tree_palmDetailedTall", "tree_palmBend"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    const one = (n: string, path: string) => loader.loadAsync(staticFile(path)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const);
    kitP = Promise.all([...KENNEY.map((n) => one(n, `bridge/kenney/${n}.glb`)), ...PALMS.map((n) => one(n, `deathray/${n}.glb`))])
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunCache = new Map<number, THREE.Vector3>();
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<string, THREE.Texture[]> = {};
  private S: Sets;
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6); this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    for (const L of ["day", "desert", "overcast"] as const) this.cloudMaps[L] = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK[L].cloud));
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30; m.scale.set(w, w / 2, 1); m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }
    this.S = buildSets(R, kit);
  }

  /** camera-relative sun frozen per shot (az from the mean view direction toward screen right, el up) */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) { const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 10, 120);
    this.sun.position.copy(focus).addScaledVector(sunDir, 260); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 560; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.sun.castShadow = s.light !== "overcast";
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky + fog + clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    this.clouds.forEach((m, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      m.position.set(cam.position.x + Math.cos(a) * d, 110 + (i % 4) * 36 + (s.light === "overcast" ? -40 : 0), cam.position.z + Math.sin(a) * d);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      const mat = m.material as THREE.MeshBasicMaterial; mat.map = this.cloudMaps[s.light === "golden" ? "day" : s.light][i % 4];
      m.scale.set((s.light === "overcast" ? 260 : 130 + (i % 4) * 30), (s.light === "overcast" ? 120 : (130 + (i % 4) * 30) / 2), 1);
    });
    // ---- dynamic set pieces ----
    const S = this.S;
    const pulse = 1 + 0.12 * Math.sin(t * 9) + 0.06 * Math.sin(t * 23);
    S.vegasSpot.visible = id >= 4 && id <= 7 && !(id === 7 && f > T.bigger);
    S.vegasSpot.scale.setScalar(pulse * (id === 4 ? 0.6 + 0.4 * smooth((f - T.sniff + 40) / 40) : 1));
    const ls = londonSpot(f) * (id === 1 || (id >= 9 && id <= 13) || id === 15 || id === 16 ? 1 : 0);
    const boost = id === 15 ? 1 + 0.9 * smooth((f - T.fifteen + 2) / 8) : 1;
    S.londonSpot.visible = ls > 0.01 && !(id === 9 && f < T.walkOff) && !(id === 10 && f < T.mMirror - 6 && false);
    S.londonSpot.scale.setScalar(pulse * ls * boost);
    S.londonSpotCar.visible = ls > 0.01 && (id === 1 || id === 10 || id === 15);
    S.londonSpotCar.scale.set(pulse * ls, pulse * ls, 1);
    S.parkDot.visible = id === 14; S.parkDot.scale.setScalar(1 + 0.25 * Math.sin(t * 14));
    S.glints.forEach((g, i) => { g.visible = i === 0 ? id >= 3 && id <= 7 : id === 2 || id === 8 || id === 15 || id === 18; g.lookAt(cam.position); g.scale.setScalar(1 + 0.08 * Math.sin(t * 5 + i)); });
    // big umbrella wheeled in (shot 7)
    const bu = S.bigUmbrella; bu.visible = id === 7;
    if (id === 7) { const u = smooth((f - (T.bigger - 48)) / 44); bu.position.set(GUEST[0] + 9 * (1 - u), 0, GUEST[2] + 0.2); bu.rotation.y = 0.3 * (1 - u); }
    // rays converge (shot 15)
    S.rays.forEach((r, k) => {
      r.visible = id === 15 && f >= T.catches + k * 2;
      const u = smooth((f - T.catches - k * 2) / 26);
      r.scale.set(1 + 0.6 * (boost - 1), Math.max(0.001, u * r.userData.len), 1 + 0.6 * (boost - 1));
    });
    // sunshade fins slide in from the left (shot 16 on)
    S.fins.forEach((m, k) => {
      const u = smooth((f - T.bolting - k * 3) / 22);
      m.visible = f >= T.bolting + k * 3 && id >= 16;
      const h = m.userData.home as THREE.Vector3; m.position.set(h.x - 90 * (1 - u), h.y, h.z);
    });
    // the car: hidden in Vegas, the park and the rain end; melting parts
    S.car.root.visible = s.set === "london";
    const mm = meltAt(f, "mirror"), mb = meltAt(f, "badge"), mp = meltAt(f, "panels");
    S.car.mirror.rotation.set(0.9 * mm, 0, -0.5 * mm); S.car.mirror.scale.set(1 + 0.25 * mm, 1 - 0.55 * mm, 1);
    S.car.badge.scale.set(1, 1 - 0.7 * mb, 1); S.car.badge.position.y = 0.78 - 0.05 * mb;
    S.car.panel.scale.set(1, 1 + 0.35 * mp, 1); S.car.panel.position.y = 0.62 - 0.08 * mp; S.car.panel.rotation.x = 0.06 * mp;
    S.panGroup.visible = (id === 12 && f >= T.cooks - 2) || id === 13;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++); const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw); a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2); a.mesh.castShadow = L.actorShadow; used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++); e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); e.use(!!p.soft);
      e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1); fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    void clamp01;
    return focus;
  }
}
