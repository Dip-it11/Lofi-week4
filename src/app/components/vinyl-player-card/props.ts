import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "title", type: "string", description: "Track title — shown under the record and printed on the generated cover. Required." },
  { name: "artist", type: "string", description: "Artist or collection name. Required." },
  { name: "coverImage", type: "string", description: "Cover image URL. When omitted, a lofi sunset cover is generated from palette." },
  { name: "coverAlt", type: "string", default: '""', description: "Alt text for coverImage." },
  { name: "palette", type: "Partial<VinylPalette>", default: "Lofistack purple", description: "{ sky: [top, bottom], sun, land, label, accent } — cover, record label and control colours." },
  { name: "src", type: "string", description: "Audio file to play. Without it the card runs a timed preview (or the demo beat)." },
  { name: "demoSound", type: "boolean", default: "false", description: "Play a lofi beat generated live with the Web Audio API when there is no src." },
  { name: "duration", type: "number", default: "180", description: "Track length in seconds, used when there is no src." },
  { name: "badge", type: "string", description: "Record-shop sticker on the sleeve, e.g. \"New\" or \"Coming soon\"." },
  { name: "labelText", type: "string", default: "artist", description: "Text printed around the record label." },
  { name: "tone", type: '"light" | "dark"', default: '"light"', description: "Card surface." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the card and disables play and seek." },
  { name: "loading", type: "boolean", default: "false", description: "Shows the loading spinner (e.g. while you fetch a track URL). Buffering audio shows it automatically." },
  { name: "onPlay", type: "() => void", description: "Called when playback starts." },
  { name: "onPause", type: "() => void", description: "Called when playback pauses (including when another card starts)." },
  { name: "onEnded", type: "() => void", description: "Called when the track reaches the end." },
  { name: "className", type: "string", description: "Extra classes for the card." },
];
