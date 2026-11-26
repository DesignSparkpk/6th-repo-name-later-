// Who is on screen in each shot and what they do, plus the flat 2D effect cards (smoke, drips, the bag, the cups,
// the ribbon, the egg, the leaf, rain). Characters are the template's lit cards (Actor / Pool from ../bridge/cast).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, KID as KID_O, SKIN, INK, fxBurst, fxRing, fxShadow, fxContact, Outfit, Expr, FrontOpts, SideOpts } from "./toon";
import type { Place, FxPlace, Stage, CamInfo } from "../bridge/cast";
import { FPS, SHOTS, T, V3, GUEST, TABLE, BAR, LX, CAR, SPOT, SHOP, PAN, PX, LEAF, ARCH_Q, MIRROR, BADGE, PANEL, smooth, clamp01, meltAt, WORDS_T } from "./story";

// ---------------- the cast ----------------
const ARCH: Outfit = { jacket: "#2e3440", pants: "#2e3440", boots: "#16161b", hat: "hair", hair: "#d2d3d9", buttons: "#f1efe9", skin: SKIN };
const GUEST_O: Outfit = { jacket: "#ff8f3a", pants: "#2c6fb3", boots: "#f2c79f", hat: "hair", hair: "#3b2a20", skin: "#f2c79f", build: "stout" };
const BARMAN: Outfit = { jacket: "#f4f1ea", pants: "#24262d", boots: "#1b1b20", hat: "hair", hair: "#1c1c22", skin: "#c99067", buttons: "#24262d" };
const WORKER = (v: number): Outfit => ({ jacket: "#2fb3a8", pants: "#efe6d6", boots: "#f4f1ea", hat: "cap", cap: ["#e0503f", "#3f6fb5"][v % 2], skin: ["#ecd0b6", "#c99067"][v % 2] });
const OWNER: Outfit = { jacket: "#3b4f7a", pants: "#cdb995", boots: "#5a3b2a", hat: "hair", hair: "#6b4a2f", skin: SKIN };
const SHOPK: Outfit = { jacket: "#c0533a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#2a201a", skin: "#c99067", moustache: "#2a201a" };
const REPORTER: Outfit = { jacket: "#7b5ac9", pants: "#2d2f3a", boots: "#2d2f3a", hat: "hair", hair: "#a0522d", dress: "#e2b13c", skin: SKIN };
const LONDONER = (v: number): Outfit => ({ jacket: ["#3f4a5c", "#6b3a3a", "#2f5f6a", "#5a5148"][v % 4], pants: "#2b2d35", boots: "#1d1d22", hat: "hair",
  hair: ["#2a201a", "#c9a35a", "#5a3b2a", "#1c1c22"][v % 4], skin: ["#ffe2c2", "#c99067", "#f5c9a0", "#ecd0b6"][v % 4], cap: ["#1d2a44", "#7a1f2b", "#22252c", "#2f5f6a"][v % 4] });

// ---------------- drawing helpers (same rules as the template cast) ----------------
const SU = 0.00216;
const q = (v: number, n = 120) => Math.round(v * n) / n;
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const tier = (d: number): [number, number, number] => d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number) => {
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, side: boolean, mirror: boolean, fo: FrontOpts, so: SideOpts = {}, scale = 1): Place => {
  const d = cam.pos.distanceTo(new THREE.Vector3(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mir = side && mirror, light = light2D(cam, mir), seed = (who.i % 7) + 1;
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return { key, x, y, z, scale, mirror: mir, draw: (p) => (side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)), size: [w, h, k] };
};
const hexK = (k: number) => `#${[0.2, 0.21, 0.33].map((v) => Math.round(255 * (1 - (1 - v) * k) ** (1 / 2.2)).toString(16).padStart(2, "0")).join("")}`;
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y))), len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
  const tc = hexK(0.55 * k);
  out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  const cc = hexK(k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x, y: y + 0.022, z, w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};
const LEAD = 2; // reactions land 2 frames before the word

// ---------------- 2D effects (our own drawings, 0..1 parameters) ----------------
const smoke = (p: Pen, u: number, col = "120,120,128") => {
  for (let i = 0; i < 4; i++) {
    const t = clamp01(u * 1.2 - i * 0.12), r = 26 + 46 * t;
    if (t <= 0) continue;
    p.ell(150 + Math.sin(t * 6 + i) * 30, 260 - 200 * t, r, r * 0.85, `rgba(${col},${(0.75 * (1 - t)).toFixed(3)})`, 0);
  }
};
const drip = (p: Pen, u: number, col: string) => {
  for (let i = 0; i < 3; i++) {
    const x = 40 + i * 60, l = (40 + 140 * u) * (0.6 + 0.4 * ((i * 7) % 3) / 2), w = 22 - i * 3;
    p.poly([[x - w, 0], [x + w, 0], [x + w * 0.7, l], [x, l + w * 1.3], [x - w * 0.7, l]], col, 6);
  }
};
const bag = (p: Pen, u: number) => { // a plastic newspaper bag slumping into a puddle
  const h = 190 * (1 - 0.72 * u), sag = 60 * u;
  p.poly([[60, 260], [240, 260], [230 + sag * 0.4, 260 - h], [170, 260 - h - 20 + sag], [130, 260 - h - 20 + sag], [70 - sag * 0.4, 260 - h]], "rgba(232,240,248,0.92)", 7);
  p.poly([[110, 245], [190, 245], [180, 260 - h * 0.7], [120, 260 - h * 0.7]], "rgba(120,150,190,0.5)", 0);
  if (u > 0.3) p.ell(150, 262, 110 * u + 40, 16, "rgba(232,240,248,0.85)", 6);
};
const cup = (p: Pen, u: number, col: string) => { // red plastic cup folding over
  const a = u * 1.25, cx = 100, by = 280, hb = 170;
  const top = (x: number, y: number): [number, number] => { const dx = x - cx, dy = y - (by - hb * 0.45); return [cx + dx * Math.cos(a) + dy * Math.sin(a), by - hb * 0.45 - dx * Math.sin(a) + dy * Math.cos(a)]; };
  p.poly([[cx - 42, by], [cx + 42, by], [cx + 50, by - hb * 0.45], [cx - 50, by - hb * 0.45]], col, 7);
  p.poly([top(cx - 50, by - hb * 0.45), top(cx + 50, by - hb * 0.45), top(cx + 58, by - hb), top(cx - 58, by - hb)], col, 7);
  p.stroke([top(cx - 56, by - hb * 0.88), top(cx + 56, by - hb * 0.88)], 8, "#ffffff");
};
const ribbon = (p: Pen, u: number) => { // red ribbon with a bow; u > 0 = cut and falling
  const y = 100, fall = 160 * u * u;
  p.band([[20, y + fall * 0.6], [290, y + fall]], "#d62f3a", 18, 5);
  p.band([[310, y + fall], [580, y + fall * 0.6]], "#d62f3a", 18, 5);
  if (u < 0.05) { p.ell(300, y, 34, 22, "#d62f3a", 6); p.poly([[300, y], [250, y + 70], [280, y + 74]], "#d62f3a", 6); p.poly([[300, y], [350, y + 70], [320, y + 74]], "#d62f3a", 6); }
};
const egg = (p: Pen, u: number) => { // top-down fried egg with sizzle bubbles
  const pts: [number, number][] = [];
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2, r = (110 + 18 * Math.sin(k * 2.3) + 10 * Math.cos(k * 1.7)) * (0.75 + 0.25 * u); pts.push([200 + r * Math.cos(a), 200 + r * Math.sin(a) * 0.92]); }
  p.poly(pts, "#fbfaf4", 8);
  if (u > 0.4) p.poly(pts.map(([x, y]) => [200 + (x - 200) * 1.02, 200 + (y - 200) * 1.02] as [number, number]), null, 5);
  p.ell(206, 188, 46, 42, "#f7b52c", 8);
  p.ell(192, 174, 14, 9, "#ffe08a", 0);
  for (let i = 0; i < Math.round(10 * u); i++) { const a = i * 2.39, r = 120 + 10 * ((i * 3) % 4); p.ell(200 + r * Math.cos(a), 200 + r * Math.sin(a), 8, 8, "rgba(255,255,255,0.9)", 4); }
};
const steam = (p: Pen, u: number) => {
  for (let i = 0; i < 3; i++) {
    const pts: [number, number][] = [], x0 = 80 + i * 70, ph = u * 6 + i;
    for (let k = 0; k <= 10; k++) pts.push([x0 + 16 * Math.sin(ph + k * 0.7), 300 - k * 26]);
    p.g.globalAlpha = 0.75; p.stroke(pts, 10, "#ffffff"); p.g.globalAlpha = 1;
  }
};
const leaf = (p: Pen, u: number) => {
  p.poly([[40, 150], [120, 70], [230, 60], [280, 150], [230, 240], [120, 230]], "#5fae3c", 7);
  p.stroke([[50, 150], [270, 150]], 6, "#3f7f28");
  for (const x of [110, 160, 210]) { p.stroke([[x, 150], [x + 30, 100]], 4, "#3f7f28"); p.stroke([[x, 150], [x + 30, 200]], 4, "#3f7f28"); }
  if (u > 0) { p.ell(180, 150, 12 + 40 * u, 10 + 34 * u, "#3b2a1a", 0); p.ell(180, 150, 6 + 16 * u, 5 + 14 * u, "#f4a02c", 0); }
};
const rainStreak = (p: Pen) => { p.g.globalAlpha = 0.85; p.stroke([[16, 8], [8, 248]], 7, "#eef4fb"); p.g.globalAlpha = 1; };
const scissors = (p: Pen, u: number) => {
  const a = 0.35 * (1 - u);
  for (const s of [-1, 1]) { const c = Math.cos(s * a), sn = Math.sin(s * a); p.poly([[100, 100], [100 + 150 * c, 100 + 150 * sn], [100 + 150 * c - 8 * sn, 100 + 150 * sn + 8 * c]], "#c9ccd2", 5); p.ell(100 - 40 * c, 100 - 40 * sn, 26, 18, null, 9); }
};

// ---------------- staging per shot ----------------
const sid = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b)?.id ?? SHOTS.length;
const talking = (f: number) => WORDS_T.some((w) => f >= w.s * FPS - 1 && f < w.e * FPS);
const fxAt = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, ...extra });
const smokeAt = (out: Stage, f: number, x: number, y: number, z: number, s = 1, n = 3, col?: string) => {
  for (let i = 0; i < n; i++) { const u = q(((f / FPS) * 0.55 + i / n) % 1, 30); fxAt(out, `smoke${col ?? ""}${u}`, 300, 300, (p) => smoke(p, u, col), x + (i - 1) * 0.12 * s, y + 0.35 * s * u, z, 0.9 * s, 0.9 * s, { soft: true }); }
};

export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  // sun for card shading: straight from the world's light rig
  if (cam.sun) SUN.copy(cam.sun).normalize();
  const P = (who: Who, x: number, y: number, z: number, fo: FrontOpts, sc = 1) => { out.places.push(person(cam, who, x, y, z, false, false, { blink: lidAt(f, who.i), ...fo }, {}, sc)); };
  const PS = (who: Who, x: number, y: number, z: number, mirror: boolean, so: SideOpts) => { out.places.push(person(cam, who, x, y, z, true, mirror, {}, { blink: lidAt(f, who.i), ...so })); };
  const A: Who = { i: 1, o: ARCH, okey: "arch" };

  if (id === 1) { // melting wing mirror ECU
    const u = meltAt(f, "mirror");
    fxAt(out, `drip${q(u, 30)}`, 260, 320, (p) => drip(p, q(u, 30), "#1f5a43"), MIRROR[0] - 0.02, MIRROR[1] - 0.08 - 0.06 * u, MIRROR[2] + 0.2, 0.1, 0.13);
    smokeAt(out, f, MIRROR[0], MIRROR[1] + 0.1, MIRROR[2] + 0.15, 0.32, 2);
  }
  if (id === 2) { // the proud architect, model tower in hand
    const x = LX - 5.5, z = 7.4;
    P(A, x, 0.15, z, { mode: "stand", expr: f < T.mirrorMelt1 + 40 ? "smile" : "grin", prop: "model", look: 0 });
    blob(out, x, 0.15, z);
  }
  if (id === 3) { // grand opening at the pool
    const x = 0, z = 7.6, u = clamp01((f - T.ribbon) / 14);
    P(A, x - 0.5, 0.12, z, { mode: "stand", expr: f < T.ribbon ? "grin" : "laugh", wave: f > T.ribbon ? q(0.5 + 0.5 * Math.sin(f * 0.5), 10) : undefined });
    blob(out, x - 0.5, 0.12, z);
    fxAt(out, `ribbon${q(u, 20)}`, 600, 300, (p) => ribbon(p, q(u, 20)), x + 0.1, 1.15, z + 0.25, 3.0, 1.5);
    [[-2.3, 8.4, 3], [2.4, 8.3, 4], [3.6, 9.2, 5]].forEach(([dx, zz, i]) => { P({ i, o: LONDONER(i), okey: "fan" + i }, x + dx, 0.12, zz, { mode: "stand", expr: "smile", wave: f > T.ribbon ? q(0.5 + 0.5 * Math.sin(f * 0.6 + i), 10) : undefined }); blob(out, x + dx, 0.12, zz); });
  }
  const G: Who = { i: 2, o: GUEST_O, okey: "guest" };
  if (id === 4 || id === 7) { // guest on the lounger
    const sniff = f >= T.sniff - LEAD, own = f >= T.own - LEAD;
    const expr: Expr = id === 7 ? (f > T.bigger ? "dazed" : "nervous") : own ? "shock" : sniff ? "nervous" : "smile_closed";
    P(G, GUEST[0], 0.36, GUEST[2] + 0.35, { mode: "sit", tilt: id === 4 && !own ? -16 : -4, expr, look: sniff ? -0.6 : 0, headTilt: own && id === 4 ? -6 : 0 });
    if (id === 4 && f >= T.sniff) smokeAt(out, f, GUEST[0], 1.55, GUEST[2] + 0.4, 0.55, 3);
  }
  if (id === 5) { // the side table: his bag melts, the cups droop
    const ub = smooth((f - T.bag + 4) / 30), uc = smooth((f - T.cups + 2) / 26);
    fxAt(out, `bag${q(ub, 24)}`, 300, 300, (p) => bag(p, q(ub, 24)), TABLE[0] - 0.12, 0.72, TABLE[2] + 0.02, 0.36, 0.36);
    ["#e23a3a", "#2f7fd6"].forEach((col, i) => fxAt(out, `cup${col}${q(uc * (i ? 0.8 : 1), 24)}`, 200, 300, (p) => cup(p, q(uc * (i ? 0.8 : 1), 24), col), TABLE[0] + 0.14 + i * 0.13, 0.69, TABLE[2] + 0.06 + i * 0.03, 0.15, 0.22));
    smokeAt(out, f, TABLE[0], 0.85, TABLE[2], 0.35, 2);
  }
  if (id === 6) { // the bar: guest complains, the staff giggle
    const gig = f >= T.giggle - LEAD, staff = f >= T.staff - LEAD;
    P({ i: 3, o: BARMAN, okey: "barman" }, BAR[0] + 0.2, 0, BAR[2] - 1.9, { mode: "stand", expr: gig ? (staff ? (talking(f) && f % 8 < 4 ? "laugh" : "grin") : "laugh") : "smile", wave: staff ? q(0.3 + 0.2 * Math.sin(f * 0.3), 10) : undefined });
    P(G, BAR[0] + 1.6, 0, BAR[2] + 0.5, { mode: "stand", expr: gig ? "stern" : "pained", facing: -1, tilt: 3 });
    blob(out, BAR[0] + 1.6, 0, BAR[2] + 0.5);
    smokeAt(out, f, BAR[0] + 1.62, 2.05, BAR[2] + 0.5, 0.4, 2);
  }
  if (id === 7) { // two workers wheel in a giant umbrella
    const u = smooth((f - (T.bigger - 48)) / 44), x = GUEST[0] + 9 * (1 - u);
    [0, 1].forEach((k) => { const wx = x + 2.2 + k * 0.9, wz = GUEST[2] + 0.4 + k * 0.6; PS({ i: 4 + k, o: WORKER(k), okey: "worker" + k }, wx, 0, wz, true, { mode: u < 1 ? "march" : "stand", phase: q((f / FPS) * 1.6 + k * 0.3, 20), expr: "grin" }); blob(out, wx, 0, wz); });
    if (f >= T.bigger - 2 && f < T.bigger + 10) { const v = q((f - T.bigger + 2) / 12, 12); fxAt(out, `burst${v}`, 500, 500, (p) => fxBurst(p, v), GUEST[0], 4.6, GUEST[2] + 0.5, 3, 3); }
  }
  if (id === 8) { // the architect waves from the street below his London tower
    const w = f >= T.wave - LEAD;
    P(A, LX - 1.2, 0.15, 5.9, { mode: "stand", expr: "grin", prop: w ? undefined : "model", wave: w ? q(0.5 + 0.5 * Math.sin(f * 0.55), 10) : undefined });
    blob(out, LX - 1.2, 0.15, 5.9);
  }
  const O: Who = { i: 6, o: OWNER, okey: "owner" };
  if (id === 9) { // parks, locks, strolls off whistling
    const walk = f >= T.walkOff, u = (f - T.walkOff) / FPS;
    if (!walk) P(O, CAR[0] + 0.7, 0.15, 5.7, { mode: "stand", expr: "whistle", prop: "keys" });
    else PS(O, CAR[0] + 0.9 + 1.3 * u, 0.15, 6.2, false, { mode: "march", phase: q(u * 1.8, 20), expr: "whistle", stride: 0.8 });
    blob(out, walk ? CAR[0] + 0.9 + 1.3 * u : CAR[0] + 0.7, 0.15, walk ? 6.2 : 5.7);
  }
  if (id === 10) {
    if (f < T.mMirror - 6) { // he comes back and freezes
      const u = clamp01((f - SHOTS[9].a) / 20), x = CAR[0] + 4.5 - 2.6 * smooth(u);
      if (u < 1) PS(O, x, 0.15, 6.1, true, { mode: "march", phase: q(f / FPS * 1.8, 20), expr: "whistle", stride: 0.8 });
      else P(O, x, 0.15, 6.1, { mode: "stand", expr: "shock", lift: 0 });
      blob(out, x, 0.15, 6.1);
    }
    for (const [part, pt, col] of [["mirror", MIRROR, "#1f5a43"], ["badge", BADGE, "#c9cdd3"], ["panels", PANEL, "#1f5a43"]] as const) {
      const u = meltAt(f, part);
      if (u <= 0) continue;
      const n = part === "panels" ? 4 : 2, w = part === "panels" ? 0.32 : 0.14;
      for (let k = 0; k < n; k++) fxAt(out, `drip${col}${q(u, 30)}`, 260, 320, (p) => drip(p, q(u, 30), col), pt[0] - 0.5 * (n - 1) * w + k * w * 1.1, pt[1] - 0.06 - 0.1 * u, pt[2] + 0.1, w, w * 1.25);
      smokeAt(out, f, pt[0], pt[1] + 0.15, pt[2] + 0.12, part === "panels" ? 0.9 : 0.45, 2);
    }
  }
  if (id === 11) { // the shopkeeper stamps on his scorched mat
    const st = f >= T.scorch - LEAD;
    P({ i: 7, o: SHOPK, okey: "shopk" }, SHOP[0] + 0.15, 0.15, SHOP[2] - 0.45, { mode: st ? "march" : "stand", phase: q((f / FPS) * 3.2, 20), lift: 90, expr: st ? "shock" : "nervous" });
    smokeAt(out, f, SHOP[0] - 0.3, 0.45, SHOP[2] - 0.6, 0.9, 3, "90,86,84");
    smokeAt(out, f, SHOP[0] + 0.45, 0.4, SHOP[2] - 0.55, 0.7, 2, "90,86,84");
  }
  const RP: Who = { i: 8, o: REPORTER, okey: "reporter" };
  if (id === 12 || id === 13) { // reporter strolls in with a pan, crouches, cooks an egg
    const crouch = f >= T.cooks - LEAD;
    if (id === 12) {
      if (!crouch) { const u = (f - SHOTS[11].a) / FPS, x = PAN[0] - 3.2 + Math.min(2.4, 1.2 * u); P(RP, x, 0.15, PAN[2] + 0.2, { mode: x < PAN[0] - 0.85 ? "stroll" : "stand", phase: q(u * 1.6, 20), expr: "grin", prop: "pan" }); blob(out, x, 0.15, PAN[2] + 0.2); }
      else { P(RP, PAN[0] - 0.65, 0.15, PAN[2] + 0.25, { mode: "sit", expr: f > T.eggIn ? "laugh" : "grin" }); blob(out, PAN[0] - 0.65, 0.15, PAN[2] + 0.25); }
    }
    if (f >= T.eggIn - 4) {
      const u = q(clamp01((f - T.eggIn + 4) / 40), 24);
      fxAt(out, `egg${u}`, 400, 400, (p) => egg(p, u), PAN[0], 0.235, PAN[2], 0.36, 0.36, { flat: true });
      const v = q(((f / FPS) * 0.8) % 1, 30); fxAt(out, `steam${v}`, 300, 320, (p) => steam(p, v), PAN[0], 0.45, PAN[2], 0.28, 0.32, { soft: true });
    }
  }
  if (id === 14) { // kid + magnifying glass over a leaf
    const burn = q(clamp01((f - T.leaf + 6) / 30), 24);
    P({ i: 9, o: KID_O, okey: "kid" }, PX, 0, 0, { mode: "stand", expr: f >= T.trick - LEAD ? "grin" : burn > 0 ? "laugh" : "smile", prop: "magnifier", look: -0.5 });
    blob(out, PX, 0, 0, 0.8);
    fxAt(out, `leaf${burn}`, 320, 300, (p) => leaf(p, burn), LEAF[0], 0.02, LEAF[2], 0.42, 0.39, { flat: true, rot: 0.4 });
    if (burn > 0.2) smokeAt(out, f, LEAF[0], 0.12, LEAF[2], 0.4, 2);
  }
  if (id === 17 || id === 18) { // the explanation: shrug, then the quote, squinting at the sun
    const shr = id === 17 && f >= T.shrug - LEAD;
    const talk = id === 18 && talking(f);
    const expr: Expr = id === 17 ? (shr ? "nervous" : "smile") : talk ? (f % 8 < 4 ? "grin" : "smile") : "smile_closed";
    P(A, ARCH_Q[0], 0.15, ARCH_Q[2], { mode: "stand", expr, wave: shr ? q(0.15 + 0.1 * Math.sin(f * 0.4), 10) : id === 18 && f > T.sunny - 10 ? q(0.6 + 0.3 * Math.sin(f * 0.25), 10) : undefined, look: id === 18 ? -0.6 : 0 });
    blob(out, ARCH_Q[0], 0.15, ARCH_Q[2]);
  }
  if (id === 19) { // pouring rain: the architect, soaked; Londoners pass under umbrellas
    P(A, ARCH_Q[0], 0.15, ARCH_Q[2], { mode: "stand", expr: "dazed", tilt: 0 });
    [[-0.95, 5.9, 10], [1.0, 6.0, 11], [-1.7, 5.4, 12]].forEach(([dx, z, i], k) => {
      const x = ARCH_Q[0] + dx + (k % 2 ? -1 : 1) * 0.6 * ((f - SHOTS[18].a) / FPS);
      P({ i, o: LONDONER(i), okey: "lond" + i }, x, 0.15, z, { mode: "stroll", phase: q((f / FPS) * 1.6 + k * 0.4, 20), expr: "stern", prop: "umbrella" });
    });
    // rain: streak cards in a box in front of the lens, splash rings on the pavement
    for (let i = 0; i < 260; i++) {
      const sp = 11, y = 4.4 - (((f / FPS) * sp + hh(i, 1) * 4.4) % 4.4), x = ARCH_Q[0] + (hh(i, 2) - 0.5) * 4.5, z = ARCH_Q[2] - 1.5 + hh(i, 3) * 4.6;
      fxAt(out, "rain", 24, 256, rainStreak, x, y, z, 0.035, 0.62, { soft: true, rot: 0.1 });
    }
    for (let i = 0; i < 14; i++) { const u = q(((f / FPS) * 1.6 + hh(i, 4)) % 1, 20); fxAt(out, `ring${u}`, 600, 600, (p) => fxRing(p, u), ARCH_Q[0] + (hh(i, 5) - 0.5) * 5, 0.17, ARCH_Q[2] + 0.2 + hh(i, 6) * 2.6, 0.5, 0.5, { flat: true }); }
  }
  return out;
};
export { sid, INK };
