"use client";

import { PreviewFrame } from "@/components/site/PreviewFrame";
import { ElevatorDemo } from "./Demo";

export function Preview() {
  return <PreviewFrame note="scroll inside the box or press a floor">{(key) => <ElevatorDemo key={key} />}</PreviewFrame>;
}
