/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React FAQ accordion called <FilingCabinetFAQ /> that looks and works like a metal office filing cabinet.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS v4 (container queries).
- Client component ("use client"). No UI, animation or audio libraries.

## Look
- A purple-grey steel cabinet (#3d2d5c) with brushed side shading, a dark plinth and two little feet.
- Top of the cabinet: a brass name plate ("FAQ · FILES" in Bebas Neue), a "FIND A FILE…" search strip styled like dark label-maker tape (typewriter font, inset shadow), a "Close all" button when anything is open, and a sound toggle.
- Every question is a drawer front: a bevelled steel face with a brass label holder holding a cream card — a red typewriter code ("A-01 · Billing") above the question in Special Elite — and a brass pull handle with two mounts on the right.
- Locked drawers show a round brass lock with a keyhole instead of the handle and a faded "LOCKED" card.
- Opening a drawer reveals the pulled-out drawer ABOVE its front (like looking down into it): dark inner walls with a deep inset shadow, two back folder tabs peeking up, and a manila folder (#ecd39c) with a tab ("BILLING") holding the answer. The front gets a shadow from the drawer above and a small "clunk" bounce when it stops.
- Container queries (@container, @xl:) so it adapts to its own width: tighter padding, smaller labels and a shorter handle on narrow screens, and the search drops onto its own row.

## Behaviour
- Single mode by default (opening one closes the other); multiple lets several stay open. defaultOpen ids start open; onOpenChange reports the open ids.
- Smooth open / close with grid-template-rows 0fr → 1fr; inert on closed panels.
- Locked drawers don't open — they rattle (a short shake) with a metal rattle sound.
- Search filters drawers by question, tag, keywords and plain-text answers, highlights the match in the question with a yellow <mark>, shows a "No files match “…”" empty state with "Clear search", and Escape clears it.
- Optional Web Audio sounds (off by default): a drawer rolling on its runners (band-passed noise with a bearing wobble) ending in a low clunk, and the locked rattle.

## Accessibility (WAI-ARIA accordion)
- Each drawer front is a <button> inside an <h3> with aria-expanded and aria-controls; the panel is role="region" with aria-labelledby. The front comes first in the DOM (shown visually below the open drawer with CSS order).
- Locked drawers use aria-disabled (still focusable, announced as locked).
- Arrow Up / Down move between drawers, Home / End jump to the first / last.
- The search has a label, and a polite live region announces "2 of 6 questions match".
- Visible focus rings everywhere; prefers-reduced-motion removes the slide, bounce and rattle.

## Props (typed)
items: { id?, question, answer: ReactNode, tag?, keywords?, locked? }[] (required), title = "FAQ · Files", multiple = false, defaultOpen = [], onOpenChange(ids), searchable = true, defaultSound = false, palette { steel, brass, card, folder, ink }, className.

## Files
- src/components/filing-cabinet-faq/FilingCabinetFAQ.tsx
- src/components/filing-cabinet-faq/cabinetSound.ts
- src/components/filing-cabinet-faq/index.ts`;
