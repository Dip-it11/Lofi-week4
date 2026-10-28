import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "images", type: "ProjectorImage[]", description: "Required. { src, alt, caption? } — alt is required and becomes the button and screen description." },
  { name: "title", type: "string", default: '"Screening room"', description: "Heading in the projection room; also labels the dialog." },
  { name: "filmStock", type: "string", default: '"LOFI 400"', description: "Text printed along the film edge of each frame." },
  { name: "defaultSound", type: "boolean", default: "false", description: "Start with the projector motor whirr and frame clacks on (users can toggle it)." },
  { name: "onChange", type: "(index: number | null) => void", description: "Called with the frame index when the lightbox opens or moves, and null when it closes." },
  { name: "palette", type: "Partial<ProjectorPalette>", default: "Warm film", description: "{ film, light, edge }." },
  { name: "className", type: "string", description: "Extra classes for the gallery section." },
];
