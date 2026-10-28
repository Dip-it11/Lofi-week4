export type { PropDoc } from "@/components/site/ComponentPage";
import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "companyName", type: "string", default: '"Lofistack"', description: "The name revealed behind the cat. Also rendered as the accessible page heading." },
  { name: "uppercase", type: "boolean", default: "true", description: "Render the name in capitals." },
  { name: "eyebrow", type: "string", description: "Small pill label above the name." },
  { name: "tagline", type: "string", description: "Supporting line under the name. Fades in once the name is revealed." },
  { name: "primaryAction", type: "HeroAction", description: "Optional filled button: { label, href, ariaLabel?, onClick? }. Not rendered unless passed." },
  { name: "secondaryAction", type: "HeroAction", description: "Optional outline button: { label, href, ariaLabel?, onClick? }. Not rendered unless passed." },
  { name: "colors", type: "Partial<HeroColors>", default: "Lofistack purple", description: "{ brand, background, text, onBrand }." },
  { name: "catPalette", type: "Partial<CatPalette>", default: "Black cat", description: "{ fill, shade, line, fur } — recolour the cat artwork." },
  { name: "duration", type: "number", default: "5", description: "Seconds for the cat to walk in and reach its seat. The gait is distance-driven, so paws never skate at any speed." },
  { name: "trigger", type: '"mount" | "in-view"', default: '"in-view"', description: "Start immediately, or when 35% of the hero scrolls into view." },
  { name: "loop", type: "boolean", default: "false", description: "Walk in again after the cat has sat down." },
  { name: "loopDelay", type: "number", default: "2.5", description: "Seconds to wait between loops." },
  { name: "showReplay", type: "boolean", default: "true", description: "Show a replay button (disabled while walking)." },
  { name: "reducedMotion", type: '"auto" | "always" | "never"', default: '"auto"', description: "auto follows prefers-reduced-motion; always shows the finished hero with the cat already seated." },
  { name: "fontFamily", type: "string", default: "Bebas Neue stack", description: "Font stack for the name. Tall, condensed faces work best." },
  { name: "headingLevel", type: '"h1" | "h2"', default: '"h1"', description: "Heading element used for the name." },
  { name: "minHeight", type: "string", default: '"min(78svh, 760px)"', description: "Any CSS length for the section height." },
  { name: "className", type: "string", description: "Extra classes for the <section>." },
  { name: "onComplete", type: "() => void", description: "Called once the cat has sat down." },
];
