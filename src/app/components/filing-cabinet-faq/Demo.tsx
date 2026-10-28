"use client";

import { FilingCabinetFAQ } from "@/components/filing-cabinet-faq";
import { DEMO_FILES } from "./demoFiles";

export function CabinetDemo() {
  return (
    <div className="mx-auto max-w-3xl">
      <FilingCabinetFAQ items={DEMO_FILES} title="FAQ · Files" defaultOpen={["what"]} />
    </div>
  );
}
