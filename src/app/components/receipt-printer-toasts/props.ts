import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "children", type: "ReactNode", description: "Your app (or panel). Anything inside can call useReceiptPrinter()." },
  { name: "position", type: '"bottom-right" | "bottom-left" | "bottom-center"', default: '"bottom-right"', description: "Where the printer sits." },
  { name: "contained", type: "boolean", default: "false", description: "Pin the printer inside the nearest positioned parent instead of the window — handy for panels and previews." },
  { name: "alwaysShow", type: "boolean", default: "false", description: "Keep the printer visible when idle. By default it slides away until there's something to print." },
  { name: "max", type: "number", default: "3", description: "Most receipts on screen at once; the oldest tears off automatically." },
  { name: "duration", type: "number", default: "5000", description: "Default auto-tear time in ms (errors get at least 8 s). Timers pause on hover, focus and when the tab is hidden." },
  { name: "brand", type: "string", default: '"LOFISTACK"', description: "Name on the printer and the top of every receipt." },
  { name: "defaultSound", type: "boolean", default: "false", description: "Start with printer sounds on (users can toggle them on the printer)." },
  { name: "palette", type: "Partial<ReceiptPalette>", default: "Lofistack purple", description: "{ body, paper, ink, accent }." },
  { name: "className", type: "string", description: "Extra classes for the notification region." },
  { name: "useReceiptPrinter()", type: "ReceiptPrinterApi", description: "Returns { print, success, error, warning, info, tear, clear }. print/success/… take { title, message?, items?, action?, duration?, id? } and return the receipt id." },
];
