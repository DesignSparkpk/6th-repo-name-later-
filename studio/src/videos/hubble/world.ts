// One three.js scene for the whole film, posed per frame: update(f, camera) is a pure function of the frame.
// Light rig, sky, fog and cards follow the Plimsoll world; the light preset follows the camera's place, the sun can move
// per frame (orbit), and every place gets its own rim-light colour on the characters.
import * as THREE from "three";
import { V } from "../bridge/build";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { LIGHTS, LOOK, RIM } from "./lights";
import { buildHotel, HotelSet } from "./setsHotel";
import { buildSpace, SpaceSet } from "./setsSpace";
import { stage } from "./cast";
import { FPS, camAt, placeAt, sunAt, showerHead, CUT, RAIL, SUN_OF, EARTH_BELOW } from "./story";
import { glow } from "./kit";

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#000000", 25, 420);
  private H: HotelSet; private S: SpaceSet; private moon: THREE.Sprite; private moonHalo: THREE.Sprite;
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
    this.H = buildHotel(R);
    this.S = buildSpace(R);
    this.moonHalo = glow("#9fb4ff", 160, 0.55); this.moon = glow("#fff6e4", 34, 3.2); R.add(this.moonHalo, this.moon);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, place = placeAt(f), L = LIGHTS[place], K = LOOK[place];
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = place === "space" ? 0.12 : 0.05; cam.far = place === "space" ? 2600 : 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig: world-space sun per place (per frame in orbit) ----
    const sunDir = V(...sunAt(f, place)).normalize();
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + (place === "space" ? 14 : 4), place === "bath" ? 4 : 10, place === "space" ? 40 : 90);
    this.sun.position.copy(focus).addScaledVector(sunDir, 260); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 560; sc.updateProjectionMatrix();
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
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = place === "space" ? null : this.fog; scene.background = null;
    // ---- the hotel: shower head on its rail, the water, the city's traffic ----
    const H = this.H, sh = showerHead(f);
    H.head.position.y = sh.y; H.head.rotation.x = sh.tilt;
    const water = f < CUT.space || (f >= CUT.bath2 && f < CUT.clean);
    H.spray.visible = water;
    if (water) {
      const dir = V(0, -Math.sin(sh.tilt), Math.cos(sh.tilt)), face = V(RAIL.x, sh.y, RAIL.z + 0.02).addScaledVector(dir, 0.24);
      H.spray.position.copy(face); H.spray.quaternion.setFromUnitVectors(V(0, -1, 0), V(0, -0.82, 0.18).add(dir.multiplyScalar(0.25)).normalize());
      const map = (H.spray as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.map!; map.offset.y = -t * 2.2; map.wrapT = THREE.RepeatWrapping;
    }
    for (const g of H.cars) { const d = g.userData as { lane: number; x0: number; v: number }; g.position.set(((d.x0 + d.v * t + 150) % 300 + 300) % 300 - 150, 0.7, d.lane); }
    // ---- orbit: Earth, atmosphere, stars and sun ride with the camera ----
    const S = this.S, inSpace = place === "space";
    S.stars.visible = inSpace; S.sun.visible = inSpace; S.sunCore.visible = inSpace;
    S.earth.visible = inSpace; S.atmo.visible = inSpace;
    if (inSpace) {
      const eu = (S.earth.material as THREE.ShaderMaterial).uniforms, au = (S.atmo.material as THREE.ShaderMaterial).uniforms;
      eu.sunDir.value.copy(sunDir); eu.camPos.value.copy(cam.position); eu.cloudShift.value = t * 0.0004;
      au.sunDir.value.copy(sunDir); au.camPos.value.copy(cam.position);
      const la = THREE.MathUtils.degToRad(EARTH_BELOW.lat), lo = THREE.MathUtils.degToRad(EARTH_BELOW.lon + EARTH_BELOW.drift * t);
      const below = V(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo));
      S.earth.quaternion.setFromUnitVectors(below, V(0, 1, 0));
      S.stars.position.copy(cam.position);
      S.sun.position.copy(cam.position).addScaledVector(sunDir, 900); S.sunCore.position.copy(S.sun.position);
    }
    // ---- the moon over Munich ----
    const night = place === "city" || place === "street" || place === "bath";
    this.moon.visible = night; this.moonHalo.visible = night;
    if (night) { const md = V(...SUN_OF.city).normalize(); this.moon.position.copy(cam.position).addScaledVector(md, 900); this.moonHalo.position.copy(this.moon.position); }
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
