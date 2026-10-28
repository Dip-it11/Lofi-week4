import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "plans", type: "RadioPlan[]", description: "The plans (stations): { id, name, price: { monthly, yearly }, features, frequency?, tagline?, cta?, featured?, disabled? }. Required." },
  { name: "defaultPlanId", type: "string", default: "featured plan", description: "Plan the radio is tuned to on load." },
  { name: "defaultBilling", type: '"monthly" | "yearly"', default: '"monthly"', description: "Starting billing period. Yearly shows the best saving on the switch." },
  { name: "onSelect", type: "(plan, billing) => void | Promise<void>", description: "Called when the plan button is pressed. Return a promise to show “Tuning in…”, then “<Plan> selected”; a rejection shows the error state." },
  { name: "onTune", type: "(plan | null) => void", description: "Called whenever a different plan locks in (or the signal is lost)." },
  { name: "title", type: "string", description: "Section heading above the radio." },
  { name: "subtitle", type: "string", description: "Supporting line under the heading." },
  { name: "currency", type: "string", default: '"$"', description: "Currency symbol." },
  { name: "range", type: "[number, number]", default: "[88, 108]", description: "Dial range in MHz. Plans without a frequency are spaced evenly across it." },
  { name: "captureRange", type: "number", default: "1.4", description: "How close (MHz) the needle must be for a plan to come through; releasing inside it glides onto the station." },
  { name: "defaultSound", type: "boolean", default: "false", description: "Start with the radio-static sound on (users can toggle it)." },
  { name: "brand", type: "string", default: '"LOFISTACK"', description: "Text on the brass name plate." },
  { name: "palette", type: "Partial<RadioPalette>", default: "Lofistack purple + amber", description: "{ body, bodyInner, brass, glow, screen, needle }." },
  { name: "className", type: "string", description: "Extra classes for the section." },
];
