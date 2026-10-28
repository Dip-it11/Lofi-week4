"use client";

import { PreviewFrame } from "@/components/site/PreviewFrame";
import { CabinetDemo } from "./Demo";

export function Preview() {
  return <PreviewFrame note="pull a drawer to read the answer">{(key) => <CabinetDemo key={key} />}</PreviewFrame>;
}
