// One three.js scene for the whole film, posed per frame: update(f, camera) is a pure function of the frame.
// Light rig, sky, fog, cards and effects follow the template's world.ts; the light preset follows the camera's place.
import * as THREE from "three";
import { V } from "../bridge/build";
import { cloudHD } from "../bridge/paint";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { LIGHTS, LOOK } from "./lights";
import { buildSets, Sets } from "./sets";
import { buildSets2, Sets2, swell } from "./sets2";
import { stage } from "./cast";
import { FPS, camAt, placeAt, LIGHT_OF, SUN_OF, T, WIN, smooth, DX, DW, DSHIP, SX, DROPS, shipSink, strikeAt, CUT, dawnSink } from "./story";

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = [];
  private S: Sets; private S2: Sets2;
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
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6); this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    const maps = [0, 1, 2, 3].map((k) => cloudHD(k + 10, LOOK.dusk.cloud));
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: maps[i % 4], color: new THREE.Color(1.05, 1.05, 1.05), transparent: true, depthWrite: false, fog: false }));
      const w = 140 + (i % 4) * 40; m.scale.set(w, w / 2, 1); m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }
    this.S = buildSets(R);
    this.S2 = buildSets2(R);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, place = placeAt(f), ln = LIGHT_OF[place], L = LIGHTS[ln], K = LOOK[ln];
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.08; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig (world-space sun per place) ----
    const sunDir = V(...SUN_OF[place]).normalize();
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 10, 90);
    this.sun.position.copy(focus).addScaledVector(sunDir, 260); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 560; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.sun.castShadow = place !== "under";
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky + fog + clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const strike = place === "storm" || place === "night" ? strikeAt(f) : 0;
    if (strike > 0) { const w = new THREE.Color("#cfdcff"); for (let i = 0; i < 5; i++) (su["c" + i].value as THREE.Color).lerp(w, 0.75 * strike); this.hemi.intensity = L.hemiI + 2.6 * strike; }
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    const dark = place === "storm" || place === "night";
    this.clouds.forEach((m, i) => {
      m.visible = place === "river" || dark;
      (m.material as THREE.MeshBasicMaterial).color.setScalar(dark ? 0.32 + 0.9 * strike : 1.05);
      const a = Math.PI + ((i / 12) - 0.5) * 2.6, d = 640 + (i % 3) * 70; // banked up in the west, behind the far bank
      m.position.set(cam.position.x + Math.cos(a) * d, 60 + (i % 4) * 34, cam.position.z + Math.sin(a) * d);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
    });
    // ---- moving set pieces ----
    const S = this.S;
    const open = smooth((f - (T.villains + 12)) / 16); // the casements swing outward as the camera rushes at them
    S.casement.forEach((p, k) => { p.rotation.y = (k ? 1 : -1) * 1.75 * open; });
    S.water.visible = place !== "under"; S.under.visible = place === "under";
    S.waterTex.offset.set(-0.012 * t, 0.004 * Math.sin(t * 0.7));
    S.underTex.offset.set(0.02 * t, 0.015 * t);
    S.shafts.forEach((m, k) => { m.visible = place === "under"; m.rotation.z = 0.28 + 0.04 * Math.sin(t * 0.8 + k); });
    S.coffin.position.y = -6 + 0.35 + 0.05 * Math.sin(t * 1.4); S.coffin.rotation.z = 0.02 * Math.sin(t * 1.1);
    void WIN;
    const S2 = this.S2;
    // the dock ship: loaded crate by crate (each drop falls in and presses the hull down), then it sails away
    const atDock = f < CUT.storm1;
    const leaving = f >= T.makes - 2;
    S2.dockShip.visible = atDock && !leaving;
    S2.dockShip.position.y = shipSink(f) + 0.04 * Math.sin(t * 1.3);
    S2.dockShip.rotation.z = 0.012 * Math.sin(t * 0.9);
    for (const [f0, k] of DROPS) {
      const c3 = S2.deckCrates[k], u = (f - f0) / 5;
      c3.visible = f >= f0 - 6;
      const home = c3.userData.home ?? (c3.userData.home = c3.position.y);
      c3.position.y = home + 7 * Math.max(0, 1 - Math.max(0, u + 1.2) / 1.2) ** 2; // falls from ~7 m in 6 frames
    }
    S2.dockSails.visible = atDock && leaving;
    if (leaving) {
      const u = smooth((f - (T.makes - 2)) / 46);
      S2.dockSails.position.set(DSHIP[0] + 3 * u, shipSink(f) + 0.04 * Math.sin(t * 1.3), DSHIP[2] + 20 * u); // straight out from the quay into the fog
      S2.dockSails.rotation.y = -1.35 * smooth(u * 1.6);
    }
    S2.craneJib.rotation.y = 0.25 * Math.sin(t * 0.8) - 0.1;
    S2.dockWaterTex.offset.set(0.01 * t, 0.006 * Math.sin(t * 0.5));
    const camUnderDock = place === "under" && f >= CUT.dock;
    S2.dockWater.visible = !camUnderDock; S2.dockUnder.visible = camUnderDock;
    S2.lamps.forEach((m) => (m.material as THREE.MeshBasicMaterial).color.setRGB(...((place === "night" ? [3.2, 2.2, 1.0] : [2.0, 1.5, 0.8]) as [number, number, number])));
    // the storm: the sea heaves; the ship pitches, then goes under bow first; its lantern dies on "ships"
    const stormOn = place === "storm";
    S2.sea.visible = stormOn; S2.stormShip.visible = stormOn;
    if (stormOn) {
      const pa = S2.sea.geometry.attributes.position as THREE.BufferAttribute, base = S2.seaBase;
      for (let i = 0; i < pa.count; i++) pa.setY(i, swell(base[i * 3] + SX, base[i * 3 + 2], t));
      pa.needsUpdate = true; S2.sea.geometry.computeVertexNormals();
      S2.seaTex.offset.set(0.02 * t, 0.01 * t);
      const sink = f < CUT.storm2 ? smooth((f - T.sinks + 4) / 34) : 0.72 + 0.1 * smooth((f - CUT.storm2) / 36);
      const y0 = swell(SX, 0, t);
      S2.stormShip.position.set(SX, y0 + 0.2 - 4.2 * sink, 0);
      S2.stormShip.rotation.set(0.12 * Math.sin(t * 1.7), 0.3, 0.1 * Math.sin(t * 1.3) - 0.95 * sink);
      S2.lantern.visible = f < T.cships;
    }
    // dawn: the sound ship gets its mark stroke by stroke, then a load pushes the mark under the water
    const dawn = place === "dawn";
    S2.dawnShip.visible = dawn;
    if (dawn) {
      S2.dockShip.visible = false;
      S2.dawnShip.position.y = dawnSink(f) + 0.04 * Math.sin(t * 1.3);
      const k = Math.max(0, Math.min(16, Math.floor(16 * (f - T.paint) / (T.everyHull + 12 - T.paint))));
      (S2.markDawn.material as THREE.MeshBasicMaterial).map = S2.markTex[k]; S2.markDawn.visible = f >= T.paint;
      S2.dawnCrates.forEach((c3, i) => {
        const f0 = T.water - 4 + i * 2, u = (f - f0) / 5; c3.visible = f >= f0 - 6;
        const home = c3.userData.home ?? (c3.userData.home = c3.position.y);
        c3.position.y = home + 7 * Math.max(0, 1 - Math.max(0, u + 1.2) / 1.2) ** 2;
      });
    }
    void DX; void DW;
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
