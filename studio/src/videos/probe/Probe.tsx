import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame } from "remotion";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
const tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });
const Box: React.FC = () => { const f = useCurrentFrame(); return (<mesh rotation={[0.4, f * 0.05, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="red" /></mesh>); };
export const Probe: React.FC = () => (
  <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, position: [0, 0, 5] }} style={{ background: "#123" }}>
    <ambientLight intensity={1} /><directionalLight position={[2, 3, 4]} intensity={2} /><Box />
    <EffectComposer multisampling={4}><primitive object={tone} dispose={null} /></EffectComposer>
  </ThreeCanvas>
);
