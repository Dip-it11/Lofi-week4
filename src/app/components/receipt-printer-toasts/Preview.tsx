"use client";

import { PreviewFrame } from "@/components/site/PreviewFrame";
import { ReceiptDemo } from "./Demo";

export function Preview() {
  return <PreviewFrame note="press a button to print a receipt">{(key) => <ReceiptDemo key={key} />}</PreviewFrame>;
}
