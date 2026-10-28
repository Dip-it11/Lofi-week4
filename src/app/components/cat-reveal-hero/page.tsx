import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("cat-reveal-hero")!;
const IMPORT_DIR = "src/components/cat-reveal-hero";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `import { CatRevealHero } from "@/components/cat-reveal-hero";

export default function Home() {
  return (
    <CatRevealHero
      companyName="Lofistack"
      eyebrow="90 Day Build Challenge"
      tagline="Ship calm, considered products — one component at a time."
    />
  );
}
`;

const FEATURES = [
  "The name is a real h1 — readable by screen readers and search engines.",
  "Cut-out rig: legs, tail and head swing on hand-picked pivots; the walk is driven by distance, so paws don't skate.",
  "Sized from the font's cap height, so the cat always matches the letters on any screen.",
  "Reduced motion shows the finished hero instantly with the cat already seated.",
  "Artwork is lazy-loaded — a soft placeholder shows while it loads.",
  "Replay button with loading, disabled, hover, focus-visible and active states.",
];

export default async function CatRevealHeroPage() {
  const files = await loadComponentFiles(
    IMPORT_DIR,
    [
      { name: "CatRevealHero.tsx" },
      { name: "BlackCat.tsx" },
      { name: "catArt.ts", preview: true, note: "Artwork data — the preview is shortened, but Copy copies the complete file." },
      { name: "index.ts" },
    ],
    USAGE,
  );
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="The hero running live. Switch widths to check mobile and tablet, or restart the walk."
      codeDescription="Copy the four files into src/components/cat-reveal-hero — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/cat-reveal-hero and paste each file from the tabs below."],
        ["Load the font", "Add a tall condensed face such as Bebas Neue and expose it as --font-display."],
        ["Use it", "Import CatRevealHero at the top of a page, as in Usage.tsx."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="Every prop is optional and typed — defaults give you the Lofistack hero shown above."
      features={FEATURES}
      credits="Cat illustrations: “Hand drawn Halloween black cats collection” by Freepik, rigged and animated for this component."
    />
  );
}
