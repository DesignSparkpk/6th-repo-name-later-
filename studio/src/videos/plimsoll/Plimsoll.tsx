// "The Plimsoll Line": flat 2D characters in a painted 3D world, one continuous camera (story.ts), posed per frame
// (world.ts). Post chain as the template: InkPass -> lens blur (thin-lens DOF from dofAt) -> [bloom + NEUTRAL tone map
// + grade]. On top: one-word captions, hard swap on every word (white extra-bold, thin black outline).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../bridge/grade";
import { TOTAL, dofAt, placeAt, WORDS_T, FPS, CUT } from "./story";

export const PLIMSOLL_FRAMES = TOTAL;

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
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
  const { focus } = world.update(f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(focus);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, placeAt(f) === "under" ? "day" : "golden");
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
        WebkitTextStroke: "7px #000000", paintOrder: "stroke fill",
        textShadow: "0 6px 12px rgba(0,0,0,0.45)",
      }}>{w}</div>
    </AbsoluteFill>
  );
};

/** the plunge: a 9-frame burst of white foam and bubbles sweeping up the frame as the camera breaks the surface */
let DIVE = -1;
const diveFrame = () => {
  if (DIVE < 0) { DIVE = 0; for (let f = 0; f < TOTAL; f++) if (placeAt(f) === "under") { DIVE = f; break; } }
  return DIVE;
};
const hsh = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const Plunge: React.FC = () => {
  const f = useCurrentFrame(), d = diveFrame(), k = f - d + 4;
  if (!d || k < 0 || k > 9) return null;
  const u = k / 9, cover = Math.sin(Math.PI * Math.min(1, u * 1.15));
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <rect x="0" y="0" width="1080" height="1920" fill="#dff7ee" opacity={0.35 * cover} />
        {Array.from({ length: 70 }, (_, i) => {
          const x = hsh(i, 1) * 1080, y0 = 1950 + hsh(i, 2) * 600, y = y0 - u * (2300 + hsh(i, 3) * 900), r = 30 + hsh(i, 4) * 140 * cover;
          return <g key={i}><circle cx={x} cy={y} r={r} fill="#ffffff" opacity={0.85 * cover} /><circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.25} fill="#e6fff6" opacity={cover} /></g>;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** rising bubbles that fill the frame for ~12 frames around the hidden cut into the dock */
const BubbleWipe: React.FC = () => {
  const f = useCurrentFrame(), k = f - (CUT.dock - 7);
  if (k < 0 || k > 14) return null;
  const u = k / 14, cover = Math.sin(Math.PI * u);
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <rect x="0" y="0" width="1080" height="1920" fill="#cfeee4" opacity={0.45 * cover} />
        {Array.from({ length: 80 }, (_, i) => {
          const x = hsh(i, 5) * 1080, y = 2100 - u * (2600 + hsh(i, 6) * 800) + hsh(i, 7) * 900, r = 20 + hsh(i, 8) * 120 * (0.4 + cover);
          return <g key={i}><circle cx={x} cy={y} r={r} fill="#ffffff" opacity={0.8 * cover} /><circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.22} fill="#e9fff7" opacity={cover} /></g>;
        })}
      </svg>
    </AbsoluteFill>
  );
};
/** pink-white cloud puffs sweeping across the frame (out of the storm clouds into the dawn sky) */
const CloudWipe: React.FC = () => {
  const f = useCurrentFrame(), k = f - (CUT.dawn - 8);
  if (k < 0 || k > 16) return null;
  const u = k / 16, cover = Math.sin(Math.PI * u);
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <rect x="0" y="0" width="1080" height="1920" fill={u < 0.5 ? "#c9cfe0" : "#ffe1d2"} opacity={0.6 * cover} />
        {Array.from({ length: 46 }, (_, i) => {
          const x = -400 + u * 1900 + hsh(i, 11) * 1200 - 600, y = hsh(i, 12) * 1920, r = 120 + hsh(i, 13) * 260 * cover;
          return <circle key={i} cx={x} cy={y} r={r} fill={u < 0.5 ? "#dde2ee" : "#fff0e6"} opacity={0.95 * cover} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
/** a reporter's copy flies at the lens and fills the frame (hides the cut into the press) */
const PaperWipe: React.FC = () => {
  const f = useCurrentFrame(), k = f - (CUT.papers - 8);
  if (k < 0 || k > 13) return null;
  const u = k / 13, sc = u < 0.55 ? 0.15 + 1.9 * (u / 0.55) ** 2 : 2.05, op = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <g transform={`translate(540 960) rotate(${-25 + 30 * u}) scale(${sc})`}>
          <rect x="-520" y="-700" width="1040" height="1400" fill="#f4efe2" stroke="#2a2430" strokeWidth="10" />
          {Array.from({ length: 14 }, (_, i) => <rect key={i} x={-440 + (i % 2) * 460} y={-560 + Math.floor(i / 2) * 170} width="400" height="90" fill="#8a8a9a" />)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
/** the newspaper spins in and lands on the headline; then it shrinks into the orator's hand (hides the cut into the square) */
const PaperSpin: React.FC = () => {
  const f = useCurrentFrame(), a0 = CUT.square - 16, k = f - a0;
  if (k < 0 || k > 26) return null;
  const spin = Math.min(1, k / 14), out = Math.max(0, (k - 20) / 6);
  const sc = 0.05 + 0.95 * (1 - (1 - spin) ** 3) - 0.75 * out, rot = 720 * (1 - (1 - spin) ** 3) + 4;
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920">
        <rect x="0" y="0" width="1080" height="1920" fill="#120c08" opacity={0.6 * (1 - out)} />
        <g transform={`translate(540 900) rotate(${rot}) scale(${sc})`}>
          <rect x="-470" y="-640" width="940" height="1280" fill="#efe9d8" stroke="#2a2430" strokeWidth="10" />
          <text x="0" y="-540" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="64" fill="#2a2430">THE DAILY NEWS</text>
          <rect x="-420" y="-505" width="840" height="8" fill="#2a2430" />
          <text x="0" y="-390" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="118" fill="#1a1420">PLIMSOLL&apos;S</text>
          <text x="0" y="-260" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold" fontSize="118" fill="#1a1420">PROTEST!</text>
          <text x="0" y="-175" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="52" fill="#7a1f2b">&quot;Villains!&quot; - M.P. defies the House</text>
          <g transform="translate(-200 120)">
            <rect x="-170" y="-200" width="340" height="400" fill="#d9d2c0" stroke="#2a2430" strokeWidth="6" />
            <circle cx="0" cy="-40" r="110" fill="#f4efe2" stroke="#2a2430" strokeWidth="8" />
            <path d="M -105 -20 Q -110 150 0 170 Q 110 150 105 -20 Q 60 40 0 40 Q -60 40 -105 -20 Z" fill="#6e5e50" stroke="#2a2430" strokeWidth="6" />
            <path d="M -95 -80 Q 0 -190 95 -80 L 80 -110 Q 0 -170 -80 -110 Z" fill="#6e5e50" />
            <path d="M -60 -55 L -20 -45 M 20 -45 L 60 -55" stroke="#2a2430" strokeWidth="10" />
            <circle cx="-38" cy="-25" r="9" fill="#2a2430" /><circle cx="38" cy="-25" r="9" fill="#2a2430" />
            <ellipse cx="0" cy="45" rx="34" ry="22" fill="#7a1f2b" stroke="#2a2430" strokeWidth="5" />
          </g>
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x={30 + (i % 2) * 220} y={-60 + Math.floor(i / 2) * 70} width={180 - (i % 3) * 20} height="22" fill="#8a8a9a" />)}
          {Array.from({ length: 6 }, (_, i) => <rect key={"b" + i} x={-420 + (i % 3) * 290} y={400 + Math.floor(i / 3) * 90} width="250" height="26" fill="#8a8a9a" />)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
/** "A year later": a warm sun glare blooms over the cut into the sunrise harbour */
const Glare: React.FC = () => {
  const f = useCurrentFrame(), n = f - CUT.year;
  if (n < -5 || n > 7) return null;
  const a = n < 0 ? (n + 5) / 5 : 1 - n / 7;
  return <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 35%, #fff6d8 0%, #ffd890 35%, rgba(255,190,120,0.6) 70%)", opacity: a }} />;
};
/** lightning: a white flash on the cuts in and out of the storm */
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  let a = 0;
  for (const c0 of [CUT.storm1, CUT.night, CUT.storm2]) { const n = f - c0; if (n >= -1 && n < 4) a = Math.max(a, [0.85, 1, 0.65, 0.3, 0.1][n + 1]); }
  return a > 0 ? <AbsoluteFill style={{ background: "#eef4ff", opacity: a }} /> : null;
};

const useFont = () => {
  const [handle] = useState(() => delayRender("caption font"));
  useEffect(() => {
    const face = new FontFace("MontserratX", `url(${staticFile("fonts/Montserrat-ExtraBold.ttf")})`, { weight: "100 900" });
    face.load().then((ff) => { document.fonts.add(ff); continueRender(handle); }).catch(() => continueRender(handle));
  }, [handle]);
};

/** whip pans: horizontal motion blur on the picture around a cut (peak on the cut frame) */
const WHIPS = [CUT.club, CUT.caves];
const whipAt = (f: number) => { let a = 0; for (const c0 of WHIPS) { const n = Math.abs(f - c0); if (n <= 5) a = Math.max(a, 1 - n / 6); } return a; };

export const PlimsollShort: React.FC = () => {
  useFont();
  const f = useCurrentFrame(), whip = whipAt(f);
  return (
    <AbsoluteFill style={{ background: "#1a1420" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="whipblur" x="-10%" y="0%" width="120%" height="100%"><feGaussianBlur stdDeviation={`${Math.round(70 * whip)} 0`} /></filter>
      </svg>
      <AbsoluteFill style={{ filter: whip > 0.01 ? "url(#whipblur)" : undefined }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.08, far: 1500 }}>
        <Inner />
      </ThreeCanvas>
      </AbsoluteFill>
      <Plunge />
      <BubbleWipe />
      <Flash />
      <CloudWipe />
      <PaperWipe />
      <PaperSpin />
      <Glare />
      <Caption />
    </AbsoluteFill>
  );
};
