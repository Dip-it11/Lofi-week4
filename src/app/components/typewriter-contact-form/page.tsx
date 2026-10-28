import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("typewriter-contact-form")!;
const IMPORT_DIR = "src/components/typewriter-form";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `import { TypewriterContactForm } from "@/components/typewriter-form";

export default function Contact() {
  return (
    <TypewriterContactForm
      recipient="Lofistack"
      onSubmit={async (data) => {
        const res = await fetch("/api/contact", { method: "POST", body: JSON.stringify(data) });
        if (!res.ok) throw new Error("Not sent"); // shows the NOT SENT stamp
      }}
    />
  );
}
`;

const FEATURES = [
  "Real inputs underneath, struck-ink letters on top — selection, autofill, spellcheck and screen readers all still work.",
  "Matching keys dip as you type, the carriage marker follows the caret, and the bell rings near the end of a line.",
  "Enter moves to the next line like a carriage return; Cmd/Ctrl + Enter sends.",
  "Red rubber-stamp errors with aria-invalid, aria-describedby and focus on the first problem field.",
  "Sending, error (NOT SENT stamp) and success states — the letter folds into an envelope and flies off.",
  "Key clacks, bell and carriage zip made with the Web Audio API (mutable); reduced motion skips the animations.",
];

export default async function TypewriterContactFormPage() {
  const files = await loadComponentFiles(IMPORT_DIR, [{ name: "TypewriterContactForm.tsx" }, { name: "typewriterSound.ts" }, { name: "index.ts" }], USAGE);
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="Type a letter, try sending it empty to see the stamps, then send it for real. Tick “Simulate send error” to see the failure state."
      codeDescription="Copy the three files into src/components/typewriter-form — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/typewriter-form and paste each file from the tabs below."],
        ["Load the font", "Add Special Elite (e.g. @fontsource/special-elite) and expose it as --font-typewriter."],
        ["Send the letter", "Pass onSubmit — return a promise; throw to show the NOT SENT state."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="Every prop is optional and typed — wire up onSubmit to send real messages."
      features={FEATURES}
    />
  );
}
