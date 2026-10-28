import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("film-projector-lightbox")!;
const IMPORT_DIR = "src/components/projector-lightbox";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `import { ProjectorLightbox } from "@/components/projector-lightbox";

const photos = [
  { src: "/photos/ridge.jpg", alt: "Purple mountains at sunset", caption: "Ridge line, last light" },
  { src: "/photos/city.jpg", alt: "City skyline at night", caption: "Night shift downtown" },
  { src: "/photos/sea.jpg", alt: "Sun setting over a calm sea", caption: "Low tide, golden hour" },
];

export default function Gallery() {
  return <ProjectorLightbox images={photos} title="Screening room" filmStock="LOFI 400" />;
}
`;

const FEATURES = [
  "A gallery of film frames with sprocket holes, frame codes and the film stock printed on the edge.",
  "Opening a frame warms up a projector: spinning reels, a light beam that tracks the screen, grain, flicker and a scratch line.",
  "Arrow keys, Home / End, swipe, prev / next buttons and a thumbnail film strip to move between frames.",
  "Native <dialog> modal: focus trapped, scroll locked, Escape plays the close animation, focus returns to the frame.",
  "Optional projector whirr and frame clack made with the Web Audio API — off by default.",
  "Container-query layout from 1 to 4 columns; reduced motion turns off every effect.",
];

export default async function FilmProjectorLightboxPage() {
  const files = await loadComponentFiles(
    IMPORT_DIR,
    [{ name: "ProjectorLightbox.tsx" }, { name: "projectorSound.ts" }, { name: "index.ts" }],
    USAGE,
  );
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="Click any frame to project it. Use the arrow keys or swipe to change frames, turn on the sound, and press Esc to close."
      codeDescription="Copy the three files into src/components/projector-lightbox — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/projector-lightbox and paste each file from the tabs below."],
        ["Pass your images", "Give each image a src and a real alt; captions are optional."],
        ["Listen (optional)", "Set defaultSound or let visitors switch the projector sound on."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="Only images is required — every other prop is optional and typed."
      features={FEATURES}
    />
  );
}
