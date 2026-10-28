/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React pricing section called <RadioTunerPricing /> that looks and works like a retro radio.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS.
- Client component ("use client"). No UI, animation or audio libraries.

## Look
- A radio cabinet: carry handle on top, rounded purple body (#351367) with an inner dark panel, little feet underneath.
- Left: a tall speaker grille (dot pattern) above a brass name plate ("LOFISTACK").
- Centre top: a dial window with an amber backlight that follows the needle, a 88–108 MHz scale (minor ticks every 0.5, numbers every 2), the plan names printed above their frequencies, and a red needle. Inset the scale ~5% so edge numbers are never clipped.
- Centre: a dark "screen" with scanlines showing the tuned plan — frequency readout + 5-bar signal meter, plan name, "Most popular" badge, tagline, big price, feature list with ticks, and the CTA button pinned to the bottom (keep the screen a fixed minimum height so nothing jumps).
- Right: a big brass tuning knob with a ridged face and a glowing indicator, numbered preset buttons (1 Free, 2 Pro, 3 Team), a Monthly / Yearly switch showing the best yearly saving (e.g. −17%), and a "Static on/off" sound toggle.
- Mobile: dial, then screen, then the controls stacked; the speaker hides.

## Tuning behaviour
- Each plan has a frequency (or they're spaced evenly). Track the current frequency as one number.
- Knob: drag in a circle — use atan2 around the knob centre and add the angle delta (270° of knob travel = the whole dial). Dial: drag or click to set the needle directly. Presets: glide to that station with an eased animation that passes through the static in between.
- Signal = 1 − distance / captureRange (1.4 MHz). With some signal, show the nearest plan but blurred, faded and jittering; with none, show "Searching…". Locked = within 0.06 MHz.
- Magnetic lock: when a drag or arrow-key press ends within the capture range, glide onto the station.
- Static: an animated noise canvas (96×54, redrawn ~25 fps, scaled up pixelated) over the screen, opacity rising as the signal drops. Optional Web Audio static (looping noise → band-pass with a slow flutter) whose volume follows the signal, plus a soft chime when a plan locks in.

## States
- CTA: "Tune to a plan" / "Fine-tune to lock in…" (disabled) until locked; then "Choose <Plan>". If onSelect returns a promise: "Tuning in…" with a spinner (aria-busy), then "<Plan> selected", or an error message on rejection. Reset when the plan or billing changes.
- Disabled plans show "Coming soon" and can't be chosen. Hover, focus-visible, active and disabled styles on every control.

## Accessibility
- The knob is role="slider" with aria-valuemin/max/now and aria-valuetext like "98.0 FM — Pro, $12 / month". Arrow keys fine-tune (Shift = bigger steps), PageUp/PageDown jump between plans, Home/End go to the ends.
- Presets use aria-pressed; billing is a radiogroup. A polite live region announces only when a plan locks in.
- prefers-reduced-motion: no jitter, no glide animations, no static.

## Props (typed)
plans (required), defaultPlanId, defaultBilling, onSelect(plan, billing), onTune(plan | null), title, subtitle, currency = "$", range = [88, 108], captureRange = 1.4, defaultSound = false, brand, palette { body, bodyInner, brass, glow, screen, needle }, className.

## Files
- src/components/radio-tuner-pricing/RadioTunerPricing.tsx
- src/components/radio-tuner-pricing/radioStatic.ts (Web Audio static + lock chime)
- src/components/radio-tuner-pricing/index.ts`;
