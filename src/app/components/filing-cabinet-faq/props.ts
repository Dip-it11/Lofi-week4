import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "items", type: "CabinetFile[]", description: "Required. { id?, question, answer, tag?, keywords?, locked? } — answer can be any ReactNode; keywords help search when it isn't plain text." },
  { name: "title", type: "string", default: '"FAQ · Files"', description: "Text on the brass plate; also labels the section." },
  { name: "multiple", type: "boolean", default: "false", description: "Allow more than one drawer open at a time." },
  { name: "defaultOpen", type: "string[]", default: "[]", description: "Ids of drawers that start open." },
  { name: "onOpenChange", type: "(open: string[]) => void", description: "Called with the open drawer ids whenever they change." },
  { name: "searchable", type: "boolean", default: "true", description: "Show the “Find a file…” search strip with an empty state." },
  { name: "defaultSound", type: "boolean", default: "false", description: "Start with drawer slide and clunk sounds on (users can toggle them)." },
  { name: "palette", type: "Partial<CabinetPalette>", default: "Lofistack steel + brass", description: "{ steel, brass, card, folder, ink }." },
  { name: "className", type: "string", description: "Extra classes for the section." },
];
