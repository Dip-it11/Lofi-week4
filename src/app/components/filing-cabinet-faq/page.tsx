import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("filing-cabinet-faq")!;
const IMPORT_DIR = "src/components/filing-cabinet-faq";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `import { FilingCabinetFAQ } from "@/components/filing-cabinet-faq";

const faqs = [
  { id: "what", tag: "Basics", question: "What is Lofistack UI?", answer: "A library of cozy, retro-object React components." },
  { id: "billing", tag: "Billing", question: "How do I cancel my plan?", answer: "Settings → Billing → Cancel.", keywords: "refund" },
  { id: "roadmap", tag: "Archive", question: "What's on the secret roadmap?", answer: "Nice try.", locked: true },
];

export default function FAQ() {
  return <FilingCabinetFAQ items={faqs} title="FAQ · Files" defaultOpen={["what"]} />;
}
`;

const FEATURES = [
  "Every question is a steel drawer with a brass label holder and pull handle; opening it reveals a manila folder with the answer.",
  "Single or multiple open drawers, defaultOpen and onOpenChange for analytics or URL syncing.",
  "“Find a file…” search across questions, tags, keywords and answers, with highlighted matches and an empty state.",
  "Locked drawers rattle instead of opening — handy for “coming soon” or members-only answers.",
  "Full WAI-ARIA accordion: buttons in headings, aria-expanded / controls, regions, Arrow / Home / End navigation.",
  "Container-query layout for any width; optional drawer slide-and-clunk sounds; reduced motion turns off the movement.",
];

export default async function FilingCabinetFAQPage() {
  const files = await loadComponentFiles(
    IMPORT_DIR,
    [{ name: "FilingCabinetFAQ.tsx" }, { name: "cabinetSound.ts" }, { name: "index.ts" }],
    USAGE,
  );
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="Pull a drawer to read the answer. Search with the label strip, try the locked drawer at the bottom, and use the arrow keys to move between drawers."
      codeDescription="Copy the three files into src/components/filing-cabinet-faq — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/filing-cabinet-faq and paste each file from the tabs below."],
        ["Load the fonts", "Special Elite (--font-typewriter) and Bebas Neue (--font-display) give the labels their look."],
        ["Add your questions", "Pass items — answers can be text or any JSX, like links and paragraphs."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="Only items is required — everything else is optional and typed."
      features={FEATURES}
    />
  );
}
