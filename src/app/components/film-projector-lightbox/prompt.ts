/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React image gallery + lightbox called <ProjectorLightbox /> where the photos are frames on a strip of film and opening one plays it on an old film projector.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS (v4 container queries).
- Client component ("use client"). Native <dialog> for the modal. No UI, animation or audio libraries.

## Gallery
- A responsive grid (1 → 2 → 3 → 4 columns using @container queries) of film frames: a near-black film border (#16110c) with sprocket holes top and bottom (repeating-linear-gradient), the photo inset with a soft vignette, a frame code ("▸ 01A") and the film stock name ("LOFI 400") printed in amber along the edge, and the caption below.
- Hover / focus: the frame lifts slightly and a "▶ Project" pill fades in. Each frame is a <button aria-haspopup="dialog" aria-label="Project frame N: <alt>">.
- Empty state: a dashed "No film loaded" box when images is empty.

## Projection room (the lightbox)
- showModal() a full-screen dark dialog. Top bar: title, a live "Frame 03 / 08" counter, a sound toggle and a close button.
- Stage: on wide screens an SVG projector at the bottom-left with two spinning reels and a flickering lens; a warm light beam (a clip-path polygon from the lens to the screen corners, recalculated with a ResizeObserver) fans out to the screen.
- Screen: a fixed 4:3 frame sized with min(80vw, 1000px, (100dvh − 15rem) × 4/3), film edges with sprocket holes on both sides, the image object-contain, plus film grain (a small random canvas tile, animated), vignette, a drifting scratch line and a gentle brightness flicker. Show "Threading film…" until the image loads.
- Animations: warm-up on open (dark → bright), a vertical film-jump when moving next / previous, and the picture shrinking to a dot of light on close.
- Prev / next round buttons beside the screen (disabled at the ends), the caption under it, and a thumbnail film strip at the bottom (aria-current on the current frame) that scrolls the current thumbnail into view.

## Interaction
- Arrow keys / Home / End move between frames; swipe left / right on touch (pointer dx > 50 px); Escape or the close button plays the close animation then closes (prevent the dialog's instant cancel). Lock body scroll while open and return focus to the frame that opened it.
- Optional Web Audio sound (off by default): a projector motor whirr — looping low-passed noise chopped by a 24 Hz square-wave "shutter" plus a faint 60 Hz hum — and a two-click "clack" when the film advances.

## Accessibility
- Dialog labelled by its title; all controls are real buttons with labels; counter is aria-live polite; images use the required alt text.
- prefers-reduced-motion: no reels, beam flicker, grain, scratch or film-jump; instant open / close.

## Props (typed)
images: { src, alt, caption? }[] (required), title = "Screening room", filmStock = "LOFI 400", defaultSound = false, onChange(index | null), palette { film, light, edge }, className.

## Files
- src/components/projector-lightbox/ProjectorLightbox.tsx
- src/components/projector-lightbox/projectorSound.ts
- src/components/projector-lightbox/index.ts`;
