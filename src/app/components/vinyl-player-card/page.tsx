import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("vinyl-player-card")!;
const IMPORT_DIR = "src/components/vinyl-card";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `import { VinylCard } from "@/components/vinyl-card";

export default function Playlist() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Live lofi beat, generated in the browser */}
      <VinylCard title="Midnight Commit" artist="Lofistack" demoSound duration={96} badge="Sound on" />

      {/* Your own audio file + a custom palette */}
      <VinylCard
        title="Rainy Deploy"
        artist="Lo-fi Pipelines"
        src="/audio/rainy-deploy.mp3"
        palette={{ sky: ["#0f3b57", "#6fb7c7"], sun: "#f4e9cd", land: "#0b2235", label: "#f4e9cd", accent: "#0f5f7a" }}
      />

      {/* Dark card */}
      <VinylCard title="Coffee & Code" artist="Lofistack Radio" tone="dark" />
    </div>
  );
}
`;

const FEATURES = [
  "Hover or keyboard focus peeks the record out; play slides it out, spins it and drops the tonearm.",
  "Built-in lofi beat made with the Web Audio API — chords, swung drums, tape wobble and vinyl crackle, no audio files.",
  "Plays real audio too: pass src and it shows buffering, seeking and end-of-track for you.",
  "Only one card plays at a time — starting one pauses the others.",
  "Generated sunset cover art from your palette, or pass your own cover image.",
  "Play button and seek bar with hover, focus-visible, active, loading and disabled states; reduced motion stops the spin.",
];

export default async function VinylPlayerCardPage() {
  const files = await loadComponentFiles(IMPORT_DIR, [{ name: "VinylCard.tsx" }, { name: "lofiSynth.ts" }, { name: "index.ts" }], USAGE);
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="Hover a card to peek the record, then press play. The first card plays a beat generated live in your browser — turn your sound on."
      codeDescription="Copy the three files into src/components/vinyl-card — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/vinyl-card and paste each file from the tabs below."],
        ["Pick your audio", "Pass src for a real track, demoSound for the built-in beat, or neither for a silent timed preview."],
        ["Use it", "Import VinylCard anywhere — one card or a whole playlist grid, as in Usage.tsx."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="title and artist are required; everything else is optional and typed."
      features={FEATURES}
    />
  );
}
