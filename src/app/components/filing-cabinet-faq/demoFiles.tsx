import type { CabinetFile } from "@/components/filing-cabinet-faq";

/** Sample FAQ used in the preview. */
export const DEMO_FILES: CabinetFile[] = [
  {
    id: "what",
    tag: "Basics",
    question: "What is Lofistack UI?",
    answer:
      "A library of cozy, retro-object React components — each one typed, accessible and responsive. Copy the files into your project and they work with plain React and Tailwind CSS.",
  },
  {
    id: "license",
    tag: "Basics",
    question: "Can I use the components in client work?",
    answer: "Yes. Everything is MIT licensed, so you can use it in personal and commercial projects. Credit is appreciated but not required.",
  },
  {
    id: "install",
    tag: "Setup",
    question: "Do I need to install any packages?",
    answer: "No extra packages. Each component only needs React and Tailwind CSS v4. Sounds are generated with the Web Audio API, so there are no audio files either.",
  },
  {
    id: "billing",
    tag: "Billing",
    question: "How do I change or cancel my plan?",
    keywords: "refund subscription invoice",
    answer: (
      <>
        <p>Open Settings → Billing and pick a new plan; changes apply straight away and we pro-rate the difference.</p>
        <p>
          Cancelling keeps Pro until the end of the period. Need a refund? <a href="#billing">Write to us</a> within 14 days.
        </p>
      </>
    ),
  },
  {
    id: "a11y",
    tag: "Quality",
    question: "Are the components accessible?",
    answer: "Every component supports the keyboard, has visible focus styles, uses the right ARIA roles and respects prefers-reduced-motion.",
  },
  {
    id: "roadmap",
    tag: "Archive",
    question: "What's on the secret roadmap?",
    locked: true,
    answer: "Nice try.",
  },
];
