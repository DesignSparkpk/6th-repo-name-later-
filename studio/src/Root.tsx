import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { Probe } from "./videos/probe/Probe";
import { DeathRayShort, DEATHRAY_FRAMES } from "./videos/deathray/DeathRay";
import { PlimsollShort, PLIMSOLL_FRAMES } from "./videos/plimsoll/Plimsoll";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Probe" component={Probe} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="Plimsoll" component={PlimsollShort} durationInFrames={PLIMSOLL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DeathRay" component={DeathRayShort} durationInFrames={DEATHRAY_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
