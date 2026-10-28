"use client";

import { ProjectorLightbox } from "@/components/projector-lightbox";
import { PreviewFrame } from "@/components/site/PreviewFrame";
import { DEMO_FRAMES } from "./demoFrames";

export function Preview() {
  return (
    <PreviewFrame note="click a frame to project it">
      {(key) => <ProjectorLightbox key={key} images={DEMO_FRAMES} title="Lofistack screening room" />}
    </PreviewFrame>
  );
}
