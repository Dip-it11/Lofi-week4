import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("radio-tuner-pricing")!;
const IMPORT_DIR = "src/components/radio-tuner-pricing";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `import { RadioTunerPricing, type RadioPlan } from "@/components/radio-tuner-pricing";

const plans: RadioPlan[] = [
  { id: "free", name: "Free", price: { monthly: 0, yearly: 0 }, features: ["3 components / month", "Community support"], cta: "Start free" },
  { id: "pro", name: "Pro", featured: true, price: { monthly: 12, yearly: 120 }, features: ["Unlimited components", "Priority support"] },
  { id: "team", name: "Team", price: { monthly: 39, yearly: 390 }, features: ["Everything in Pro", "5 seats included"] },
];

export default function Pricing() {
  return (
    <RadioTunerPricing
      plans={plans}
      title="Tune in to a plan"
      subtitle="Turn the knob, drag the dial or tap a preset."
      onSelect={async (plan, billing) => {
        await fetch("/api/checkout", { method: "POST", body: JSON.stringify({ plan: plan.id, billing }) });
      }}
    />
  );
}
`;

const FEATURES = [
  "Three ways to tune: drag the knob in a circle, drag the dial, or press a numbered preset.",
  "Static, blur and jitter fade out as the signal improves; releasing near a station glides the needle onto it.",
  "Monthly / Yearly switch with the best yearly saving calculated from your prices.",
  "Optional Web Audio radio static that follows the signal, plus a chime when a plan locks in.",
  "Knob is an ARIA slider: arrows fine-tune, Page Up/Down jump between plans; lock-ins are announced once.",
  "Choose button with locked/unlocked, loading, selected, error and disabled states; reduced motion turns off jitter and glides.",
];

export default async function RadioTunerPricingPage() {
  const files = await loadComponentFiles(IMPORT_DIR, [{ name: "RadioTunerPricing.tsx" }, { name: "radioStatic.ts" }, { name: "index.ts" }], USAGE);
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="Turn the knob, drag the dial or press a preset. Switch to Monthly/Yearly, try the keyboard (Page Up/Down), and turn the static on for sound."
      codeDescription="Copy the three files into src/components/radio-tuner-pricing — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/radio-tuner-pricing and paste each file from the tabs below."],
        ["Define your plans", "Give each plan an id, name, monthly and yearly price, and features. Frequencies are optional."],
        ["Handle the choice", "Use onSelect to start checkout — return a promise and the button shows its loading state."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="Only plans is required; everything else is optional and typed."
      features={FEATURES}
    />
  );
}
