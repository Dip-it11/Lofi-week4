import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("elevator-panel-navbar")!;
const IMPORT_DIR = "src/components/elevator-navbar";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `import { ElevatorNavbar } from "@/components/elevator-navbar";

const floors = [
  { id: "home", label: "Lobby", button: "L" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "pricing", label: "Pricing" },
  { id: "contact", label: "Contact" },
];

export default function Page() {
  return (
    <>
      <ElevatorNavbar floors={floors} brand="LOFISTACK" />
      <main>
        {floors.map((f) => (
          <section key={f.id} id={f.id} className="min-h-screen">{f.label}</section>
        ))}
      </main>
    </>
  );
}
`;

const FEATURES = [
  "A brass floor dial whose needle glides between floors as you scroll — a fractional scroll spy, not a jump.",
  "Up / down direction lamps light while the page is moving and switch off when it stops.",
  "Press a floor: the doors close, the page travels, and they open again on that section with an optional ding.",
  "Every floor is a real link with aria-current, plus a live region announcing the floor you arrive at.",
  "On narrow widths it folds into a dial + “Choose a floor” dropdown with Escape, outside-click and focus handling.",
  "Works with the page scroll or any scroll container; reduced motion skips the doors and easing.",
];

export default async function ElevatorPanelNavbarPage() {
  const files = await loadComponentFiles(IMPORT_DIR, [{ name: "ElevatorNavbar.tsx" }, { name: "index.ts" }], USAGE);
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="Scroll inside the mini-site and watch the dial and lamps, then press a floor button. Switch to Mobile to try the dropdown."
      codeDescription="Copy the two files into src/components/elevator-navbar — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/elevator-navbar and paste each file from the tabs below."],
        ["Give sections ids", "Each floor's id must match a section's id on the page."],
        ["Set the offset", "Pass offset (px) if something else is pinned above your sections."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="Only floors is required — everything else is optional and typed."
      features={FEATURES}
    />
  );
}
