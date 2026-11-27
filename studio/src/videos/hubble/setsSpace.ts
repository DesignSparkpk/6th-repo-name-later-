// Orbit, far out at SPX: the Earth (NASA Blue Marble day map, DMSP city lights at night, a generated cloud layer,
// terminator glow, blue limb), a star field and the sun that follow the camera, and Hubble itself at true size
// (13.2 m): aft shroud, equipment bays, light shield with a hinged aperture door, roll-out solar blankets, two
// high-gain antennas on booms, yellow handrails, silver MLI foil that glints.
import * as THREE from "three";
import { staticFile } from "remotion";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { ctex, rep } from "../bridge/paint";
import { twoTone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { M, cyl, glow } from "./kit";
import { HUB, EARTH_C, RE } from "./story";

// ---------------- Earth textures (loaded once, before the first frame renders) ----------------
const EARTH: { day?: THREE.Texture; night?: THREE.Texture; clouds?: THREE.Texture; nebula?: THREE.Texture } = {};
/** the film's last picture (studio/scripts/make_nebula.py), once loaded */
export const nebulaTexture = () => EARTH.nebula;
let earthPromise: Promise<void> | null = null;
export const loadEarth = () => {
  if (earthPromise) return earthPromise;
  const L = new THREE.TextureLoader();
  const one = (name: "day" | "night" | "clouds" | "nebula", srgb: boolean) => new Promise<void>((res) => L.load(staticFile(name === "nebula" ? "assets/hubble/nebula.jpg" : `assets/earth/${name}.jpg`), (t) => {
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping; EARTH[name] = t; res();
  }, undefined, () => res()));
  earthPromise = Promise.all([one("day", true), one("night", true), one("clouds", false), one("nebula", true)]).then(() => undefined);
  return earthPromise;
};

/** the day map's image (for the mission-control ground-track display), once loaded */
export const earthDayImage = () => EARTH.day?.image as HTMLImageElement | undefined;

const earthMaterial = () => new THREE.ShaderMaterial({
  uniforms: { dayMap: { value: EARTH.day ?? null }, nightMap: { value: EARTH.night ?? null }, cloudMap: { value: EARTH.clouds ?? null },
    sunDir: { value: new THREE.Vector3(1, 0, 0) }, camPos: { value: new THREE.Vector3() }, cloudShift: { value: 0 }, exposure: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vW; varying vec2 vUv;
    void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform sampler2D dayMap, nightMap, cloudMap; uniform vec3 sunDir, camPos; uniform float cloudShift, exposure;
    varying vec3 vN; varying vec3 vW; varying vec2 vUv;
    void main(){
      vec3 n = normalize(vN), v = normalize(camPos - vW);
      float ndl = dot(n, sunDir), day = smoothstep(-0.1, 0.22, ndl);
      vec3 albedo = texture2D(dayMap, vUv).rgb;
      float cl = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;
      float clSh = texture2D(cloudMap, vUv + vec2(cloudShift - 0.0015, 0.0008)).r;            // cloud shadows on the ground
      albedo = mix(albedo, albedo * vec3(0.55, 0.75, 1.05), step(albedo.b, albedo.r + 0.02) * 0.0 + smoothstep(0.05, 0.25, albedo.b - albedo.r) * 0.35);  // deeper oceans
      vec3 lit = albedo * (1.0 - 0.45 * clSh * day) * (0.02 + 1.6 * max(ndl, 0.0));
      lit = mix(lit, vec3(1.0, 0.99, 0.97) * (0.015 + 1.55 * max(ndl, 0.0)), cl * 0.85);
      float term = exp(-pow((ndl - 0.02) / 0.1, 2.0));
      lit += vec3(1.0, 0.42, 0.12) * term * 0.18 * (0.4 + cl);                                // sunrise band
      vec3 nl = texture2D(nightMap, vUv).rgb; nl = nl * nl * 4.0 * (1.0 - day) * (1.0 - 0.85 * cl);
      float fr = pow(1.0 - max(dot(n, v), 0.0), 5.0);
      vec3 atm = mix(vec3(0.22, 0.45, 1.0), vec3(1.0, 0.5, 0.22), term) * fr * (0.05 + 0.75 * smoothstep(-0.25, 0.45, ndl));
      gl_FragColor = vec4((lit + nl + atm) * exposure, 1.0);
    }`,
  fog: false,
});
const atmoMaterial = () => new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: new THREE.Vector3(1, 0, 0) }, camPos: { value: new THREE.Vector3() }, center: { value: new THREE.Vector3(...EARTH_C) } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 sunDir, camPos, center; varying vec3 vW;
    void main(){
      vec3 v = normalize(vW - camPos), n = normalize(vW - center);
      // how close the view ray passes to the planet's limb: brightest in a thin band just outside the surface
      float rim = pow(clamp(1.0 - abs(dot(n, -v)) * 1.25, 0.0, 1.0), 3.0);
      float lit = smoothstep(-0.35, 0.5, dot(n, sunDir));
      float sunset = exp(-pow(dot(n, sunDir) / 0.22, 2.0));
      vec3 c = mix(vec3(0.3, 0.58, 1.0), vec3(1.0, 0.55, 0.25), sunset * 0.8) * rim * (0.06 + 2.2 * lit);
      gl_FragColor = vec4(c, 1.0);
    }`,
  side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false,
});

// ---------------- Hubble ----------------
const foilTex = () => ctex("hubbleFoil", 1024, 512, (g, r) => {
  g.fillStyle = "#cfd3da"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(255,255,255,${0.1 + r() * 0.25})` : `rgba(90,96,110,${0.06 + r() * 0.16})`; g.save(); g.translate(r() * 1024, r() * 512); g.rotate(r() * 3); g.fillRect(0, 0, 6 + r() * 30, 1.5 + r() * 3); g.restore(); }
  g.strokeStyle = "rgba(70,74,86,0.65)"; g.lineWidth = 3;
  for (let x = 0; x <= 1024; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  for (let y = 0; y <= 512; y += 170) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  g.fillStyle = "rgba(60,64,76,0.6)"; for (let x = 8; x < 1024; x += 32) for (let y = 8; y < 512; y += 170) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
});
const bayTex = () => ctex("hubbleBays", 1024, 256, (g, r) => {
  g.fillStyle = "#bfc4cc"; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 8; i++) { const x = i * 128; g.fillStyle = i % 2 ? "#d6dae1" : "#c4c9d1"; g.fillRect(x + 8, 18, 112, 220); g.strokeStyle = "#5a5f6c"; g.lineWidth = 4; g.strokeRect(x + 8, 18, 112, 220);
    g.fillStyle = "#e8c445"; g.fillRect(x + 54, 30, 20, 8); g.fillRect(x + 54, 218, 20, 8); // yellow handholds
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${r() * 0.2})`; g.fillRect(x + 10 + r() * 100, 20 + r() * 210, 10 + r() * 20, 2); } }
});
const cellTex = () => ctex("solarCells", 256, 1024, (g, r) => {
  g.fillStyle = "#1a2a55"; g.fillRect(0, 0, 256, 1024);
  for (let y = 0; y < 1024; y += 16) for (let x = 0; x < 256; x += 16) { const v = r(); g.fillStyle = `rgb(${30 + v * 14},${48 + v * 22},${110 + v * 40})`; g.fillRect(x + 1, y + 1, 14, 14); }
  g.fillStyle = "#c9a248"; g.fillRect(0, 0, 256, 10); g.fillRect(0, 1014, 256, 10); g.fillRect(0, 0, 8, 1024); g.fillRect(248, 0, 8, 1024);
  for (let y = 128; y < 1024; y += 128) { g.fillStyle = "#c9a248"; g.fillRect(0, y - 2, 256, 4); }
});
export type HubbleModel = { g: THREE.Group; door: THREE.Group; bayDoor: THREE.Group; tube: THREE.Mesh; specs: THREE.Group; glint: THREE.Sprite };
export const hubbleModel = (): HubbleModel => {
  const g = new THREE.Group(), b = new Batch();
  const foil = twoTone(new THREE.MeshPhongMaterial({ map: rep(foilTex(), 3, 1), specular: new THREE.Color("#8a8f9a"), shininess: 38 }));
  const bays = twoTone(new THREE.MeshPhongMaterial({ map: rep(bayTex(), 1, 1), specular: new THREE.Color("#6a6f7a"), shininess: 30 }));
  const dark = lam("hubbleDark", () => ({ color: "#2a2d36" }));
  const yellow = lam("hubbleRail", () => ({ color: "#e8c445" }));
  const gold = twoTone(new THREE.MeshPhongMaterial({ color: "#d6a640", specular: new THREE.Color("#c09030"), shininess: 50 }));
  const rx = (geo: THREE.BufferGeometry) => geo.rotateZ(-Math.PI / 2); // cylinders along +x
  b.add(rx(cyl(2.12, 2.12, 3.8, 40)), foil, M(-4.7, 0, 0));                                     // aft shroud
  b.add(rx(cyl(2.18, 2.18, 2.3, 40)), bays, M(-1.65, 0, 0));                                    // equipment section with bay doors
  b.add(rx(cyl(1.6, 2.18, 0.5, 40)), foil, M(-0.25, 0, 0));                                     // shoulder
  b.add(rx(cyl(1.55, 1.55, 6.3, 40, true)), foil, M(3.15, 0, 0));                               // forward shell + light shield
  const tube = new THREE.Mesh(rx(cyl(1.52, 1.52, 6.2, 40, true)), lam("tubeInside", () => ({ color: "#0a0b0e", side: THREE.BackSide })));
  tube.position.set(3.1, 0, 0); g.add(tube);
  b.add(new THREE.CircleGeometry(2.12, 40).rotateY(-Math.PI / 2), dark, M(-6.6, 0, 0));           // aft bulkhead
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(-6.62, -0.5 + k * 0.3, -1.4), V(-6.6, -0.3 + k * 0.3, 1.4), 0), gold);
  for (let a = 0; a < 6; a++) { const ang = (a / 6) * Math.PI * 2 + 0.3; b.add(rx(cyl(0.025, 0.025, 3.2, 6)), yellow, M(-4.7, Math.cos(ang) * 2.2, Math.sin(ang) * 2.2)); }
  for (let a = 0; a < 4; a++) { const ang = (a / 4) * Math.PI * 2 + 0.6; b.add(rx(cyl(0.022, 0.022, 4.6, 6)), yellow, M(3.0, Math.cos(ang) * 1.62, Math.sin(ang) * 1.62)); }
  for (const sd of [-1, 1]) b.add(boxGeo(V(1.0, sd * 1.55 - 0.12, -0.25), V(1.9, sd * 1.55 + 0.12, 0.25), 0), dark);  // magnetometers / star-tracker boxes
  // solar wings along +-z: a central boom, two roll-out blankets, a spreader bar at the tip
  const cells = twoTone(new THREE.MeshPhongMaterial({ map: cellTex(), specular: new THREE.Color("#5a6a9a"), shininess: 60, side: THREE.DoubleSide }));
  for (const sd of [-1, 1]) {
    b.add(cyl(0.05, 0.05, 12.2, 8).rotateX(Math.PI / 2), yellow, M(-1.8, 0, sd * 8.2));
    for (const ox of [-0.72, 0.72]) {
      const bl = new THREE.PlaneGeometry(1.25, 11.2).rotateX(-Math.PI / 2).rotateZ(1.25);
      b.add(bl, cells, M(-1.8, ox * 0.95, sd * 8.3));
    }
    b.add(boxGeo(V(-3.2, -0.05, sd * 14.0 - 0.06), V(-0.4, 0.05, sd * 14.0 + 0.06), 0), dark);
    b.add(boxGeo(V(-2.0, -0.2, sd * 2.1 - 0.15), V(-1.6, 0.2, sd * 2.6), 0), dark);
  }
  // high-gain antennas: stubby masts off the forward shell (+-y), each ending in a gimbal block and a parabolic dish
  // whose concave face (with its feed on struts) turns toward the camera side, so it reads as a dish, not a floating disc
  const dishMat = lam("hgaDish", () => ({ color: "#eef0f3", side: THREE.DoubleSide })), mastMat = lam("hgaBoom", () => ({ color: "#c9ccd3" }));
  const prof: THREE.Vector2[] = []; for (let i = 0; i <= 10; i++) { const r = 0.9 * i / 10; prof.push(new THREE.Vector2(r, (r * r) / (4 * 0.5))); }
  for (const sd of [-1, 1]) {
    const tip = V(0.4, sd * 4.3, 0), axis = V(-0.25, sd * 0.3, 1).normalize();
    b.add(cyl(0.075, 0.075, 2.8, 10), mastMat, M(0.4, sd * (1.5 + 1.4), 0));
    b.add(boxGeo(V(0.22, sd * 4.15 - 0.16, -0.18), V(0.58, sd * 4.15 + 0.16, 0.18), 0), dark);
    const put = (geo: THREE.BufferGeometry, mat: THREE.Material, off: number) => { geo.rotateX(Math.PI / 2); geo.lookAt(axis); const c = tip.clone().addScaledVector(axis, off); b.add(geo, mat, M(c.x, c.y, c.z)); };
    put(new THREE.LatheGeometry(prof, 32), dishMat, 0.05);                    // the dish, vertex at the gimbal
    put(cyl(0.03, 0.03, 0.5, 6), mastMat, 0.3);           // feed support
    put(cyl(0.09, 0.05, 0.16, 10), dark, 0.58);           // feed horn at the focus
  }
  b.build(g);
  // aperture door, hinged on top of the front opening; opened ~100 degrees
  const door = new THREE.Group(); door.position.set(6.3, 1.55, 0);
  const dd = new THREE.Mesh(new THREE.CircleGeometry(1.62, 40).rotateY(Math.PI / 2), foil); dd.position.set(0.02, -1.55, 0); door.add(dd);
  const ddBack = new THREE.Mesh(new THREE.CircleGeometry(1.62, 40).rotateY(-Math.PI / 2), lam("doorBack", () => ({ color: "#3a3d47" }))); ddBack.position.set(0.0, -1.55, 0); door.add(ddBack);
  door.rotation.z = 1.75; g.add(door);
  // bay door on the equipment section (opened for the instrument swap in the spacewalk)
  const bayDoor = new THREE.Group(); bayDoor.position.set(-2.8, 0, 2.18);
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), bays); bd.position.set(1.1, 0, 0); bayDoor.add(bd);
  g.add(bayDoor);
  // the gag: a pair of round spectacles perched on the front of the telescope (frames, lenses, bridge, temple arms)
  const specs = new THREE.Group(); specs.position.set(6.9, 0.15, 0); specs.visible = false; g.add(specs);
  const frameM = lam("specFrame", () => ({ color: "#1c1c22" }));
  const lensM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#bfe6ff"), transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
  for (const sd of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.1, 10, 48).rotateY(Math.PI / 2), frameM); ring.position.set(0, 0, sd * 1.15); specs.add(ring);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40).rotateY(Math.PI / 2), lensM); lens.position.set(0, 0, sd * 1.15); lens.layers.set(NOINK); specs.add(lens);
    const arm = new THREE.Mesh(cyl(0.06, 0.06, 4.6, 8).rotateZ(Math.PI / 2), frameM); arm.position.set(-2.3, 0.1, sd * 2.2); specs.add(arm);
    const hook = new THREE.Mesh(cyl(0.06, 0.06, 0.8, 8).rotateZ(0.5), frameM); hook.position.set(-4.75, -0.2, sd * 2.2); specs.add(hook);
  }
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 16, Math.PI).rotateY(Math.PI / 2), frameM); bridge.position.set(0, 0.35, 0); specs.add(bridge);
  const glint = glow("#ffffff", 1.4, 4.0); glint.visible = false; specs.add(glint);
  return { g, door, bayDoor, tube, specs, glint };
};

export type SpaceSet = { earth: THREE.Mesh; atmo: THREE.Mesh; stars: THREE.Points; sun: THREE.Sprite; sunCore: THREE.Sprite; hubble: HubbleModel };
export const buildSpace = (R: THREE.Object3D): SpaceSet => {
  const earth = new THREE.Mesh(new THREE.SphereGeometry(RE, 160, 100), earthMaterial());
  earth.position.set(...EARTH_C); earth.layers.set(NOINK); R.add(earth);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(RE * 1.035, 120, 80), atmoMaterial());
  atmo.position.set(...EARTH_C); atmo.layers.set(NOINK); atmo.renderOrder = 1; R.add(atmo);
  // stars: a sphere of points that rides with the camera (never parallaxes)
  const n = 4200, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r0 = Math.sqrt(1 - u * u);
    pos.set([Math.cos(a) * r0 * 900, u * 900, Math.sin(a) * r0 * 900], i * 3);
    const k = 0.35 + rnd() ** 3 * 2.2, tint = rnd();
    col.set([k * (tint < 0.2 ? 0.8 : 1), k * (tint < 0.2 ? 0.88 : tint > 0.85 ? 0.9 : 1), k * (tint > 0.85 ? 0.75 : 1)], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); sg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, depthWrite: false, fog: false, transparent: true }));
  stars.layers.set(NOINK); stars.frustumCulled = false; stars.renderOrder = -1; R.add(stars);
  const sun = glow("#fff2dc", 260, 2.6), sunCore = glow("#ffffff", 46, 6.0);
  sun.renderOrder = 2; sunCore.renderOrder = 2; R.add(sun, sunCore);
  const hubble = hubbleModel(); hubble.g.position.set(...HUB); R.add(hubble.g);
  return { earth, atmo, stars, sun, sunCore, hubble };
};
