import type { Metadata } from "next";
import { ComponentPage } from "@/components/site/ComponentPage";
import { loadComponentFiles } from "@/lib/loadComponentFiles";
import { componentLabel, getComponent } from "@/lib/registry";
import { Preview } from "./Preview";
import { PROMPT } from "./prompt";
import { PROPS } from "./props";

const entry = getComponent("receipt-printer-toasts")!;
const IMPORT_DIR = "src/components/receipt-printer-toasts";

export const metadata: Metadata = {
  title: `${entry.name} — ${componentLabel(entry)}`,
  description: entry.summary,
};

const USAGE = `// app/layout.tsx — wrap the app once
import { ReceiptPrinter } from "@/components/receipt-printer-toasts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReceiptPrinter brand="LOFISTACK">{children}</ReceiptPrinter>
      </body>
    </html>
  );
}

// anywhere inside — e.g. a checkout button
"use client";
import { useReceiptPrinter } from "@/components/receipt-printer-toasts";

export function PayButton() {
  const printer = useReceiptPrinter();
  return (
    <button
      onClick={() =>
        printer.success("Payment received", {
          message: "Order #1042 is on its way.",
          items: [{ label: "Total", value: "$129.60" }],
        })
      }
    >
      Pay now
    </button>
  );
}
`;

const FEATURES = [
  "Receipts feed out of the printer line by line and get a DONE / VOID / CHECK / NOTE rubber stamp when they finish.",
  "A real print queue — several notifications at once print one after another while the printer shows how many are waiting.",
  "Older receipts roll up to their title; hover or focus the stack to unroll it and pause every timer.",
  "Swipe sideways, press ✂ or Esc to tear one off, or “Tear all” on the printer. Errors stay longer, and duration: 0 keeps a note pinned.",
  "Line items with dotted leaders and one action button (Undo, Retry…) for receipts that need a follow-up.",
  "Polite / assertive live regions, labelled buttons and reduced-motion support; optional Web Audio printer sounds.",
];

export default async function ReceiptPrinterToastsPage() {
  const files = await loadComponentFiles(
    IMPORT_DIR,
    [{ name: "ReceiptPrinter.tsx" }, { name: "printerSound.ts" }, { name: "index.ts" }],
    USAGE,
  );
  return (
    <ComponentPage
      entry={entry}
      files={files}
      importDir={IMPORT_DIR}
      preview={<Preview />}
      previewDescription="Press the buttons to print receipts. Try “Rush hour ×4” to see the queue, hover the paper to unroll the stack, and swipe or press ✂ to tear one off."
      codeDescription="Copy the three files into src/components/receipt-printer-toasts — no extra packages needed beyond React and Tailwind CSS."
      setup={[
        ["Copy the files", "Create src/components/receipt-printer-toasts and paste each file from the tabs below."],
        ["Wrap your app", "Put <ReceiptPrinter> around your layout (or a panel, with contained)."],
        ["Print receipts", "Call useReceiptPrinter().success / error / warning / info from any child component."],
      ]}
      prompt={PROMPT}
      props={PROPS}
      propsDescription="All props are optional and typed. The last row is the hook you call to print."
      features={FEATURES}
    />
  );
}
