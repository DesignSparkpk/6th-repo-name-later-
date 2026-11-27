// "Why NASA's Telescope Had to Wear Glasses": flat 2D characters in a painted 3D world, one continuous camera (story.ts),
// posed per frame (world.ts). Post chain: InkPass -> lens blur (thin-lens DOF) -> bloom -> Neutral tone map -> grade.
// On top: automatic motion blur from the camera's own angular speed (no blur across cuts), cut-hiding overlays,
// one-word captions.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { loadEarth } from "./setsSpace";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../bridge/grade";
import { TOTAL, dofAt, placeAt, WORDS_T, FPS, CUT, camAt, isCut } from "./story";

export const HUBBLE_FRAMES = TOTAL;

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.7, luminanceThreshold: 1.0, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 7, radius: 0.68 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const WARM = new Set(["pad", "senate", "studio", "nightpad", "field", "street", "city"]);

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 26, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  useEffect(() => () => (fx.ink as unknown as { dispose?: () => void }).dispose?.(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  ), [fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const { focus, place } = world.update(f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(focus);
  fx.lens.focus = Math.max(0.2, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, WARM.has(place) ? "golden" : "day");
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** one word at a time, hard swap on each word; the last word stays up through the short gap before the next */
const Caption: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  let w = "";
  for (let i = 0; i < WORDS_T.length; i++) {
    const cur = WORDS_T[i], next = WORDS_T[i + 1];
    if (t >= cur.s - 0.02 && t < (next ? Math.min(next.s - 0.02, cur.e + 0.5) : cur.e + 0.4)) { w = cur.w; break; }
  }
  if (!w) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{
        position: "absolute", top: "64%", width: "100%", textAlign: "center",
        fontFamily: "MontserratX", fontWeight: 800, fontSize: 92, letterSpacing: -1, color: "#ffffff",
        WebkitTextStroke: "7px #000000", paintOrder: "stroke fill", textShadow: "0 6px 12px rgba(0,0,0,0.45)",
      }}>{w}</div>
    </AbsoluteFill>
  );
};

const hsh = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** the crane punches up through a moonlit cloud deck: puffs rush down past the lens, hiding the cut into orbit */
const CloudPass: React.FC = () => {
  const f = useCurrentFrame(), k = f - (CUT.space - 7);
  if (k < 0 || k > 13) return null;
  const u = k / 13, cover = Math.sin(Math.PI * u);
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <rect x="0" y="0" width="1080" height="1920" fill={u < 0.5 ? "#9aa6c8" : "#0a0c18"} opacity={0.55 * cover} />
        {Array.from({ length: 60 }, (_, i) => {
          const x = hsh(i, 21) * 1080, y = -300 + (u * 2.4 + hsh(i, 22)) * 1400 % 2600 - 300, r = 140 + hsh(i, 23) * 260 * (0.5 + cover);
          return <circle key={i} cx={x} cy={y} r={r} fill={hsh(i, 24) < 0.5 ? "#c6cfe8" : "#8e9ac0"} opacity={0.9 * cover} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const useFont = () => {
  const [handle] = useState(() => delayRender("caption font"));
  useEffect(() => {
    const face = new FontFace("MontserratX", `url(${staticFile("fonts/Montserrat-ExtraBold.ttf")})`, { weight: "100 900" });
    face.load().then((ff) => { document.fonts.add(ff); continueRender(handle); }).catch(() => continueRender(handle));
  }, [handle]);
};
const useEarth = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("earth textures"));
  useEffect(() => { loadEarth().then(() => { setReady(true); continueRender(handle); }); }, [handle]);
  return ready;
};

/** screen-space camera motion in px/frame (yaw, pitch), 0 across cuts */
const motionAt = (f: number): [number, number] => {
  if (f < 1 || isCut(f)) return [0, 0];
  const a = camAt(f), b = camAt(f - 1);
  const dir = (c: typeof a) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; const n = Math.hypot(d[0], d[1], d[2]); return [d[0] / n, d[1] / n, d[2] / n]; };
  const da = dir(a), db = dir(b);
  const yaw = Math.atan2(da[0], da[2]) - Math.atan2(db[0], db[2]), pitch = Math.asin(da[1]) - Math.asin(db[1]);
  const pxPerRad = 1920 / ((a.fov * Math.PI) / 180);
  const wrap = (x: number) => Math.atan2(Math.sin(x), Math.cos(x));
  return [Math.abs(wrap(yaw)) * pxPerRad * 0.5625, Math.abs(pitch) * pxPerRad];
};

export const HubbleShort: React.FC = () => {
  useFont();
  const ready = useEarth();
  const f = useCurrentFrame();
  const [mx, my] = motionAt(f);
  const bx = Math.min(36, Math.max(0, mx - 26) * 0.32), by = Math.min(36, Math.max(0, my - 26) * 0.32);
  const blur = bx > 0.5 || by > 0.5;
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="camblur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={`${bx.toFixed(1)} ${by.toFixed(1)}`} /></filter>
      </svg>
      <AbsoluteFill style={{ filter: blur ? "url(#camblur)" : undefined }}>
        {ready ? (
          <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
            camera={{ fov: 40, near: 0.05, far: 1500 }}>
            <Inner />
          </ThreeCanvas>
        ) : null}
      </AbsoluteFill>
      <CloudPass />
      <Caption />
    </AbsoluteFill>
  );
};
