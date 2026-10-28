import type { PropDoc } from "@/components/site/ComponentPage";

export const PROPS: PropDoc[] = [
  { name: "recipient", type: "string", default: '"Lofistack"', description: "Who the letter is addressed to — used in the letterhead, name plate and wax seal." },
  { name: "onSubmit", type: "(data) => void | Promise<void>", description: "Receives { name, email, message }. Return a promise: pending shows “Sending…”, a rejection shows the NOT SENT stamp. Without it, sending is simulated." },
  { name: "labels", type: "Partial<{ name; email; message; submit }>", default: '"From", "Reply to", …', description: "Field labels and the Return key text." },
  { name: "placeholders", type: "Partial<{ name; email; message }>", description: "Faint pencilled hints shown on empty lines." },
  { name: "minMessageLength", type: "number", default: "10", description: "Shortest message accepted before the TOO SHORT stamp." },
  { name: "defaultSound", type: "boolean", default: "true", description: "Start with key clacks, bell and carriage sounds on (users can mute them)." },
  { name: "successTitle", type: "string", default: '"Letter sent!"', description: "Heading on the confirmation note." },
  { name: "successMessage", type: "string", description: "Body text on the confirmation note." },
  { name: "fontFamily", type: "string", default: "Special Elite stack", description: "Typewriter font for the typed text." },
  { name: "palette", type: "Partial<TypewriterPalette>", default: "Lofistack purple", description: "{ body, keys, paper, ink, stamp }." },
  { name: "className", type: "string", description: "Extra classes for the section." },
];
