"use client";

import { RadioTunerPricing, type RadioPlan } from "@/components/radio-tuner-pricing";
import { PreviewFrame } from "@/components/site/PreviewFrame";

export const DEMO_PLANS: RadioPlan[] = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    tagline: "For tinkering on weekends.",
    features: ["3 components / month", "Community support", "Copy-paste code", "MIT license"],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    featured: true,
    price: { monthly: 12, yearly: 120 },
    tagline: "For makers shipping every week.",
    features: ["Unlimited components", "Prompt library", "Figma kit", "Priority support"],
  },
  {
    id: "team",
    name: "Team",
    price: { monthly: 39, yearly: 390 },
    tagline: "For studios and small teams.",
    features: ["Everything in Pro", "5 seats included", "Shared collections", "Private Discord"],
  },
];

export function Preview() {
  return (
    <PreviewFrame note="drag the knob or the dial">
      {(key) => (
        <RadioTunerPricing
          key={key}
          plans={DEMO_PLANS}
          title="Tune in to a plan"
          subtitle="Turn the knob, drag the dial or tap a preset. Each plan comes in clearly when you hit its station."
          onSelect={() => new Promise((r) => setTimeout(r, 1200))}
        />
      )}
    </PreviewFrame>
  );
}
