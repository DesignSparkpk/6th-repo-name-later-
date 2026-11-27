// One three.js scene for the whole film, posed per frame: update(f, camera) is a pure function of the frame.
// Light rig, sky, fog and cards follow the Hubble world; every place has its own light preset and rim colour.
import * as THREE from "three";
import { V } from "../bridge/build";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { LIGHTS, LOOK, RIM } from "./lights";
import { buildBoard, BoardSet, buildPlaza, PlazaSet, buildFactory, FactorySet, paintCounter } from "./sets";
import { stage } from "./cast";
import { FPS, T, CUT, camAt, placeAt, sunAt, counterAt, inkAt, lampPop, throwAt, stallAt, smooth, clamp01 } from "./story";

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#000000", 25, 420);
  private B: BoardSet; private Pz: PlazaSet; private F: FactorySet;
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor() {
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
    this.sky.renderOrder = -2; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.0);
    this.sun = new THREE.DirectionalLight("#ffffff", 2.6); this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.B = buildBoard(R);
    this.Pz = buildPlaza(R);
    this.F = buildFactory(R);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const place = placeAt(f), L = LIGHTS[place], K = LOOK[place];
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const sunDir = V(...sunAt(f, place)).normalize();
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 4, 6, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, 160); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 360; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const rim = RIM[place]; CHAR.uRimCol.value.set(rim[0], rim[1], rim[2]); CHAR.uRimK.value = rim[3];
    // ---- sky + fog ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    // ---- the boardroom: the lamp pops on "you" ----
    const pop = lampPop(f); this.B.lampBulb.visible = !pop; this.B.lampGlow.visible = !pop;
    // ---- the plaza: the doors burst open, the box hits the stone, the little car flies out and skids ----
    const u = throwAt(f), open = smooth((f - CUT.plaza) / 4);
    this.Pz.doors.forEach((d, i) => { (d.parent as THREE.Group).rotation.y = (i ? -1 : 1) * 1.3 * open; });
    const bz = -7.0 + 4.9 * clamp01(u * 1.1), by = Math.max(0, Math.sin(Math.PI * Math.min(1, u * 1.1)) * 1.4);
    this.Pz.box.position.set(0.5, by, bz); this.Pz.box.rotation.set(u * 2.2, u * 0.8, 0);
    const mt = Math.max(0, f - CUT.plaza - 13) / FPS, mt2 = f >= CUT.plaza2 ? Math.max(0, f - CUT.plaza2) / FPS : 0;
    const mx = f >= CUT.plaza2 ? 2.4 - 3.2 * (1 - Math.exp(-mt2 * 2.2)) : 0.6 + 2.0 * (1 - Math.exp(-mt * 3)), mz = f >= CUT.plaza2 ? -1.2 : -2.2 + 1.0 * (1 - Math.exp(-mt * 3));
    const my = f >= CUT.plaza2 ? 0 : Math.max(0, 0.9 * mt * 4 - 5 * mt * mt);
    this.Pz.model.visible = f >= CUT.plaza + 13; this.Pz.model.position.set(mx, my, mz); this.Pz.model.rotation.set(0, f >= CUT.plaza2 ? 2.6 + mt2 * 1.5 : mt * 7, f >= CUT.plaza2 ? 0 : mt * 3);
    // ---- the plant: the counter, the ink, the line stalling car by car, the sirens ----
    if (place === "factory") {
      const cv = counterAt(f); paintCounter(this.F, cv.v, cv.green);
      this.F.ink.scale.y = Math.max(0.001, inkAt(f)); this.F.inkMat.color.set(cv.green ? "#18a83a" : "#b8121a");
      this.F.cars.forEach((g, i) => { const k = f - stallAt(i), j = k >= 0 && k < 6 ? Math.sin(k * 1.6) * 0.06 * (1 - k / 6) : 0; g.position.x = -15 + i * 5 + (k < 0 ? (f - T.company) * 0.08 : 0.5); g.rotation.z = j; });
      this.F.sirens.forEach((s, i) => { s.visible = f < T.turned && Math.floor(f / 4 + i) % 2 === 0; });
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(place, f, { pos: cam.position, right, sun: sunDir });
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
      const e2 = this.fx(fi++); e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); e2.use(!!p.soft);
      e2.mesh.visible = true; e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0); else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1); fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return { focus, place };
  }
}
