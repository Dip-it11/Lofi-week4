import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "floors", type: "ElevatorFloor[]", description: "Required. One per section: { id, label, button? }. id is the section element's id; button is the text on the round button (defaults to the floor number — use \"L\" or \"G\" for a lobby)." },
  { name: "brand", type: "string", default: '"LOFISTACK"', description: "Text on the brass name plate (hidden on narrow screens)." },
  { name: "scrollRoot", type: "() => HTMLElement | null", default: "window", description: "The scrolling element that holds the sections, if it isn't the page itself." },
  { name: "offset", type: "number", default: "96", description: "Height in px of anything pinned above the sections — usually the navbar — so sections don't land underneath it." },
  { name: "doors", type: "boolean", default: "true", description: "Close and open elevator doors over the page while travelling. Always skipped with reduced motion." },
  { name: "defaultSound", type: "boolean", default: "false", description: "Start with the arrival ding on (users can toggle it on the panel)." },
  { name: "onNavigate", type: "(floor: ElevatorFloor) => void", description: "Called after arriving at a floor from a button press." },
  { name: "palette", type: "Partial<ElevatorPalette>", default: "Lofistack purple + brass", description: "{ panel, brass, lamp, text }." },
  { name: "className", type: "string", description: "Extra classes for the nav." },
];
